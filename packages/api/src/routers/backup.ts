import { backupSchedule, db, systemBackup } from "@SYNERGY-GY/db";
import { exec } from "node:child_process";
import { existsSync } from "node:fs";
import { readdir, stat, unlink } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { ORPCError } from "@orpc/server";
import { and, count, desc, eq, gte, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { adminProcedure } from "../index";

const execAsync = promisify(exec);

// Get absolute path to project root (from packages/api/src/routers/)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, "../../../../..");

// Configuration - use absolute paths to avoid working directory issues
const BACKUP_DIR = process.env.BACKUP_DIR || join(PROJECT_ROOT, "backups");
const SCRIPTS_DIR = process.env.SCRIPTS_DIR || join(PROJECT_ROOT, "scripts");

// Zod schemas
const createBackupSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  type: z
    .enum(["manual", "scheduled", "pre_update", "pre_restore"])
    .default("manual"),
});

const listBackupsSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  status: z.enum(["pending", "in_progress", "completed", "failed"]).optional(),
  type: z.enum(["manual", "scheduled", "pre_update", "pre_restore"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const getBackupByIdSchema = z.object({
  id: z.string(),
});

const deleteBackupSchema = z.object({
  id: z.string(),
  deleteFile: z.boolean().default(true),
});

const restoreBackupSchema = z.object({
  id: z.string(),
  skipMigrations: z.boolean().default(false),
});

const createScheduleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  cronExpression: z.string().min(1, "Cron expression is required"),
  retentionDays: z.number().min(1).max(365).default(30),
  syncToCloud: z.boolean().default(false),
});

const updateScheduleSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  cronExpression: z.string().optional(),
  retentionDays: z.number().min(1).max(365).optional(),
  syncToCloud: z.boolean().optional(),
});

const toggleScheduleSchema = z.object({
  id: z.string(),
  isEnabled: z.boolean(),
});

// Helper: Format file size
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

// Helper: Parse manifest file (reserved for future use)
async function _parseManifest(
  _backupPath: string
): Promise<Record<string, unknown> | null> {
  try {
    // Try to read manifest from zip (would need unzip)
    // For now, return null - manifest will be parsed during backup creation
    return null;
  } catch {
    return null;
  }
}

// Helper: Get backup file info
async function getBackupFileInfo(filePath: string): Promise<{
  exists: boolean;
  size?: number;
  modifiedAt?: Date;
} | null> {
  try {
    if (!existsSync(filePath)) {
      return { exists: false };
    }
    const stats = await stat(filePath);
    return {
      exists: true,
      size: stats.size,
      modifiedAt: stats.mtime,
    };
  } catch {
    return null;
  }
}

// Helper: List backup files from disk
async function listBackupFiles(): Promise<
  Array<{
    name: string;
    path: string;
    size: number;
    createdAt: Date;
  }>
> {
  try {
    if (!existsSync(BACKUP_DIR)) {
      return [];
    }
    const files = await readdir(BACKUP_DIR);
    const backupFiles = [];

    for (const file of files) {
      // Support both tar.gz and zip formats
      const isBackupFile =
        (file.endsWith(".tar.gz") || file.endsWith(".zip")) &&
        (file.startsWith("gk-nexus-backup-") ||
          file.startsWith("test-backup") ||
          file.startsWith("scheduled-"));
      if (isBackupFile) {
        const fullPath = join(BACKUP_DIR, file);
        const stats = await stat(fullPath);
        backupFiles.push({
          name: file,
          path: fullPath,
          size: stats.size,
          createdAt: stats.birthtime,
        });
      }
    }

    return backupFiles.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  } catch {
    return [];
  }
}

export const backupRouter = {
  // Create a new backup
  create: adminProcedure
    .input(createBackupSchema)
    .handler(async ({ input, context }) => {
      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .slice(0, 19);
      const backupName = input.name || `gk-nexus-backup-${timestamp}`;

      // Create backup record
      const backupResult = await db
        .insert(systemBackup)
        .values({
          name: backupName,
          description: input.description,
          type: input.type,
          status: "in_progress",
          startedAt: new Date(),
          createdById: context.session.user.id,
        })
        .returning();

      const backup = backupResult[0];
      if (!backup) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to create backup record",
        });
      }

      try {
        // Execute backup script
        const scriptPath = join(SCRIPTS_DIR, "backup.sh");
        if (!existsSync(scriptPath)) {
          throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "Backup script not found",
          });
        }

        const { stdout } = await execAsync(
          `bash "${scriptPath}" "${backupName}"`,
          { cwd: process.cwd(), timeout: 300_000 } // 5 minute timeout
        );

        // Parse output for file path
        const outputLines = stdout.split("\n");
        const archiveLine = outputLines.find((line) =>
          line.includes("Archive:")
        );
        const filePath = archiveLine?.match(
          /Archive:\s*(.+\.(?:tar\.gz|zip))/
        )?.[1];

        // Get file info
        let fileSize = 0;
        let checksum = "";
        if (filePath && existsSync(filePath)) {
          const stats = await stat(filePath);
          fileSize = stats.size;

          // Get checksum from output
          const checksumLine = outputLines.find((line) =>
            line.includes("SHA256:")
          );
          checksum = checksumLine?.match(/SHA256:\s*(\w+)/)?.[1] || "";
        }

        // Parse manifest for stats (from stdout)
        const tablesMatch = stdout.match(/Tables:\s*(\d+)/);
        const recordsMatch = stdout.match(/Records:\s*(\d+)/);
        const filesMatch = stdout.match(/Files:\s*(\d+)/);

        // Update backup record with success
        const [updated] = await db
          .update(systemBackup)
          .set({
            status: "completed",
            filePath,
            fileSize,
            checksum,
            tableCount: tablesMatch?.[1]
              ? Number.parseInt(tablesMatch[1], 10)
              : null,
            recordCount: recordsMatch?.[1]
              ? Number.parseInt(recordsMatch[1], 10)
              : null,
            uploadedFilesCount: filesMatch?.[1]
              ? Number.parseInt(filesMatch[1], 10)
              : null,
            completedAt: new Date(),
          })
          .where(eq(systemBackup.id, backup.id))
          .returning();

        return {
          success: true,
          backup: {
            ...updated,
            fileSizeFormatted: formatFileSize(fileSize),
          },
        };
      } catch (error) {
        // Update backup record with failure
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        await db
          .update(systemBackup)
          .set({
            status: "failed",
            errorMessage,
            completedAt: new Date(),
          })
          .where(eq(systemBackup.id, backup.id));

        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: `Backup failed: ${errorMessage}`,
        });
      }
    }),

  // List all backups
  list: adminProcedure.input(listBackupsSchema).handler(async ({ input }) => {
    const { page, limit, status, type, startDate, endDate } = input;
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [];
    if (status) {
      conditions.push(eq(systemBackup.status, status));
    }
    if (type) {
      conditions.push(eq(systemBackup.type, type));
    }
    if (startDate) {
      conditions.push(gte(systemBackup.createdAt, new Date(startDate)));
    }
    if (endDate) {
      conditions.push(lte(systemBackup.createdAt, new Date(endDate)));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get backups
    const backups = await db
      .select()
      .from(systemBackup)
      .where(whereClause)
      .orderBy(desc(systemBackup.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const totalResult = await db
      .select({ total: count() })
      .from(systemBackup)
      .where(whereClause);
    const total = totalResult[0]?.total ?? 0;

    // Check file existence for each backup
    const backupsWithFileInfo = await Promise.all(
      backups.map(async (backup) => {
        const fileInfo = backup.filePath
          ? await getBackupFileInfo(backup.filePath)
          : null;
        return {
          ...backup,
          fileSizeFormatted: backup.fileSize
            ? formatFileSize(backup.fileSize)
            : null,
          fileExists: fileInfo?.exists ?? false,
        };
      })
    );

    return {
      backups: backupsWithFileInfo,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }),

  // Get backup by ID
  getById: adminProcedure
    .input(getBackupByIdSchema)
    .handler(async ({ input }) => {
      const backup = await db.query.systemBackup.findFirst({
        where: eq(systemBackup.id, input.id),
        with: {
          createdBy: {
            columns: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!backup) {
        throw new ORPCError("NOT_FOUND", {
          message: "Backup not found",
        });
      }

      const fileInfo = backup.filePath
        ? await getBackupFileInfo(backup.filePath)
        : null;

      return {
        ...backup,
        fileSizeFormatted: backup.fileSize
          ? formatFileSize(backup.fileSize)
          : null,
        fileExists: fileInfo?.exists ?? false,
      };
    }),

  // Delete backup
  delete: adminProcedure
    .input(deleteBackupSchema)
    .handler(async ({ input }) => {
      const backup = await db.query.systemBackup.findFirst({
        where: eq(systemBackup.id, input.id),
      });

      if (!backup) {
        throw new ORPCError("NOT_FOUND", {
          message: "Backup not found",
        });
      }

      // Delete file if requested and exists
      if (input.deleteFile && backup.filePath && existsSync(backup.filePath)) {
        try {
          await unlink(backup.filePath);
        } catch (error) {
          console.error("Failed to delete backup file:", error);
        }
      }

      // Delete database record
      await db.delete(systemBackup).where(eq(systemBackup.id, input.id));

      return { success: true };
    }),

  // Restore from backup
  restore: adminProcedure
    .input(restoreBackupSchema)
    .handler(async ({ input }) => {
      const backup = await db.query.systemBackup.findFirst({
        where: eq(systemBackup.id, input.id),
      });

      if (!backup) {
        throw new ORPCError("NOT_FOUND", {
          message: "Backup not found",
        });
      }

      if (!(backup.filePath && existsSync(backup.filePath))) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Backup file not found on disk",
        });
      }

      try {
        // Execute restore script
        const scriptPath = join(SCRIPTS_DIR, "restore.sh");
        if (!existsSync(scriptPath)) {
          throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "Restore script not found",
          });
        }

        const skipFlag = input.skipMigrations ? "--skip-migrations" : "";
        const { stdout } = await execAsync(
          `bash "${scriptPath}" "${backup.filePath}" --force ${skipFlag}`,
          { cwd: process.cwd(), timeout: 600_000 } // 10 minute timeout
        );

        return {
          success: true,
          message: "Restore completed successfully",
          output: stdout,
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: `Restore failed: ${errorMessage}`,
        });
      }
    }),

  // Get backup statistics
  getStats: adminProcedure.handler(async () => {
    // Get counts by status
    const statusCounts = await db
      .select({
        status: systemBackup.status,
        count: count(),
      })
      .from(systemBackup)
      .groupBy(systemBackup.status);

    // Get latest backup
    const [latestBackup] = await db
      .select()
      .from(systemBackup)
      .where(eq(systemBackup.status, "completed"))
      .orderBy(desc(systemBackup.completedAt))
      .limit(1);

    // Get total storage used
    const sizeResult = await db
      .select({
        totalSize: sql<number>`COALESCE(SUM(${systemBackup.fileSize}), 0)`,
      })
      .from(systemBackup)
      .where(eq(systemBackup.status, "completed"));
    const totalSize = sizeResult[0]?.totalSize ?? 0;

    // List files from disk
    const diskFiles = await listBackupFiles();
    const diskTotalSize = diskFiles.reduce((sum, f) => sum + f.size, 0);

    return {
      counts: {
        total: statusCounts.reduce((sum, s) => sum + s.count, 0),
        completed:
          statusCounts.find((s) => s.status === "completed")?.count || 0,
        failed: statusCounts.find((s) => s.status === "failed")?.count || 0,
        inProgress:
          statusCounts.find((s) => s.status === "in_progress")?.count || 0,
      },
      latestBackup: latestBackup
        ? {
            id: latestBackup.id,
            name: latestBackup.name,
            completedAt: latestBackup.completedAt,
            fileSize: latestBackup.fileSize,
            fileSizeFormatted: latestBackup.fileSize
              ? formatFileSize(latestBackup.fileSize)
              : null,
          }
        : null,
      storage: {
        databaseRecords: Number(totalSize),
        databaseRecordsFormatted: formatFileSize(Number(totalSize)),
        diskFiles: diskFiles.length,
        diskTotalSize,
        diskTotalSizeFormatted: formatFileSize(diskTotalSize),
      },
    };
  }),

  // Backup schedules
  schedules: {
    // List schedules
    list: adminProcedure.handler(async () => {
      const schedules = await db
        .select()
        .from(backupSchedule)
        .orderBy(desc(backupSchedule.createdAt));

      return schedules;
    }),

    // Create schedule
    create: adminProcedure
      .input(createScheduleSchema)
      .handler(async ({ input, context }) => {
        const [schedule] = await db
          .insert(backupSchedule)
          .values({
            name: input.name,
            description: input.description,
            cronExpression: input.cronExpression,
            retentionDays: input.retentionDays,
            syncToCloud: input.syncToCloud,
            createdById: context.session.user.id,
          })
          .returning();

        return schedule;
      }),

    // Update schedule
    update: adminProcedure
      .input(updateScheduleSchema)
      .handler(async ({ input }) => {
        const { id, ...updates } = input;

        const existing = await db.query.backupSchedule.findFirst({
          where: eq(backupSchedule.id, id),
        });

        if (!existing) {
          throw new ORPCError("NOT_FOUND", {
            message: "Schedule not found",
          });
        }

        const [updated] = await db
          .update(backupSchedule)
          .set(updates)
          .where(eq(backupSchedule.id, id))
          .returning();

        return updated;
      }),

    // Toggle schedule enabled/disabled
    toggle: adminProcedure
      .input(toggleScheduleSchema)
      .handler(async ({ input }) => {
        const existing = await db.query.backupSchedule.findFirst({
          where: eq(backupSchedule.id, input.id),
        });

        if (!existing) {
          throw new ORPCError("NOT_FOUND", {
            message: "Schedule not found",
          });
        }

        const [updated] = await db
          .update(backupSchedule)
          .set({ isEnabled: input.isEnabled })
          .where(eq(backupSchedule.id, input.id))
          .returning();

        return updated;
      }),

    // Delete schedule
    delete: adminProcedure
      .input(z.object({ id: z.string() }))
      .handler(async ({ input }) => {
        const existing = await db.query.backupSchedule.findFirst({
          where: eq(backupSchedule.id, input.id),
        });

        if (!existing) {
          throw new ORPCError("NOT_FOUND", {
            message: "Schedule not found",
          });
        }

        await db.delete(backupSchedule).where(eq(backupSchedule.id, input.id));

        return { success: true };
      }),
  },

  // List backup files from disk (untracked)
  listDiskFiles: adminProcedure.handler(async () => {
    const files = await listBackupFiles();
    return files.map((f) => ({
      ...f,
      sizeFormatted: formatFileSize(f.size),
    }));
  }),
};
