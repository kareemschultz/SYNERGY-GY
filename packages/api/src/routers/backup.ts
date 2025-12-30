import {
  BACKUP_SCOPES,
  backupSchedule,
  db,
  systemBackup,
} from "@SYNERGY-GY/db";
import { existsSync } from "node:fs";
import { readdir, stat, unlink } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ORPCError } from "@orpc/server";
import type { SQL } from "drizzle-orm";
import { and, count, desc, eq, gte, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { adminProcedure } from "../index";

// Get absolute path to project root (from packages/api/src/routers/)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, "../../../../..");

// Configuration - use absolute paths to avoid working directory issues
const BACKUP_DIR = process.env.BACKUP_DIR || join(PROJECT_ROOT, "backups");

// Zod schemas
const backupScopeSchema = z.enum(BACKUP_SCOPES);

const createBackupSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  type: z
    .enum(["manual", "scheduled", "pre_update", "pre_restore"])
    .default("manual"),
  scope: backupScopeSchema.default("database"),
  syncToCloud: z.boolean().default(false),
});

const listBackupsSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  status: z.enum(["pending", "in_progress", "completed", "failed"]).optional(),
  type: z.enum(["manual", "scheduled", "pre_update", "pre_restore"]).optional(),
  scope: backupScopeSchema.optional(),
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
  scope: z.enum(["settings", "data", "all"]).default("all"),
  strategy: z.enum(["replace", "merge"]).default("replace"),
  restoreFiles: z.boolean().default(false),
  dryRun: z.boolean().default(false),
  createPreRestoreBackup: z.boolean().default(true),
});

const previewRestoreSchema = z.object({
  id: z.string(),
  scope: z.enum(["settings", "data", "all"]).default("all"),
});

const getBackupStatsSchema = z.object({
  scope: backupScopeSchema.optional(),
});

const createScheduleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  cronExpression: z.string().min(1, "Cron expression is required"),
  scope: backupScopeSchema.default("full"),
  retentionDays: z.number().min(1).max(365).default(30),
  syncToCloud: z.boolean().default(false),
});

const updateScheduleSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  cronExpression: z.string().optional(),
  scope: backupScopeSchema.optional(),
  retentionDays: z.number().min(1).max(365).optional(),
  syncToCloud: z.boolean().optional(),
});

const toggleScheduleSchema = z.object({
  id: z.string(),
  isEnabled: z.boolean(),
});

// Helper: Format file size
function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
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
    isFullBackup: boolean;
  }>
> {
  try {
    if (!existsSync(BACKUP_DIR)) {
      return [];
    }
    const files = await readdir(BACKUP_DIR);
    const backupFiles: {
      name: string;
      path: string;
      size: number;
      createdAt: Date;
      isFullBackup: boolean;
    }[] = [];

    for (const file of files) {
      // Support tar.gz (full), json.gz (database/settings/data), and legacy zip
      const isBackupFile =
        file.endsWith(".tar.gz") ||
        file.endsWith(".json.gz") ||
        file.endsWith(".zip");
      if (isBackupFile) {
        const fullPath = join(BACKUP_DIR, file);
        const stats = await stat(fullPath);
        backupFiles.push({
          name: file,
          path: fullPath,
          size: stats.size,
          createdAt: stats.birthtime,
          isFullBackup: file.endsWith(".tar.gz"),
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
  // Create a new backup with scope selection
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
          scope: input.scope,
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
        // Use Node.js backup utility with scope
        const { createBackup: runBackup } = await import(
          "../utils/backup-utility"
        );
        const result = await runBackup(backupName, {
          scope: input.scope,
          description: input.description,
          syncToCloud: input.syncToCloud,
        });

        if (!result.success) {
          throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: result.error || "Backup failed",
          });
        }

        // Update backup record with success
        const [updated] = await db
          .update(systemBackup)
          .set({
            status: "completed",
            filePath: result.archivePath,
            fileSize: result.fileSize,
            checksum: result.checksum,
            tableCount: result.tableCount,
            recordCount: result.recordCount,
            uploadedFilesCount: result.uploadedFilesCount,
            uploadedFilesSize: result.uploadedFilesSize,
            includesFiles: result.includesFiles,
            completedAt: new Date(),
          })
          .where(eq(systemBackup.id, backup.id))
          .returning();

        return {
          success: true,
          backup: {
            ...updated,
            fileSizeFormatted: result.fileSize
              ? formatFileSize(result.fileSize)
              : null,
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

  // Estimate backup size before creating
  estimateSize: adminProcedure
    .input(z.object({ scope: backupScopeSchema }))
    .handler(async ({ input }) => {
      const { getBackupStats } = await import("../utils/backup-utility");
      const stats = await getBackupStats(input.scope);

      return {
        scope: input.scope,
        tableCount: stats.tableCount,
        recordCount: stats.recordCount,
        estimatedDatabaseSize: stats.estimatedDatabaseSize,
        estimatedDatabaseSizeFormatted: formatFileSize(
          stats.estimatedDatabaseSize
        ),
        uploadedFilesCount: stats.uploadedFilesCount,
        uploadedFilesSize: stats.uploadedFilesSize,
        uploadedFilesSizeFormatted: formatFileSize(stats.uploadedFilesSize),
        estimatedTotalSize: stats.estimatedTotalSize,
        estimatedTotalSizeFormatted: formatFileSize(stats.estimatedTotalSize),
        includesFiles: input.scope === "full",
      };
    }),

  // List all backups
  list: adminProcedure.input(listBackupsSchema).handler(async ({ input }) => {
    const { page, limit, status, type, scope, startDate, endDate } = input;
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions: SQL<unknown>[] = [];
    if (status) {
      conditions.push(eq(systemBackup.status, status));
    }
    if (type) {
      conditions.push(eq(systemBackup.type, type));
    }
    if (scope) {
      conditions.push(eq(systemBackup.scope, scope));
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

  // Preview restore (dry run)
  previewRestore: adminProcedure
    .input(previewRestoreSchema)
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

      const { previewRestore } = await import("../utils/backup-restore");
      const preview = await previewRestore(backup.filePath, input.scope);

      if (!preview.valid) {
        throw new ORPCError("BAD_REQUEST", {
          message: `Invalid backup: ${preview.errors.join(", ")}`,
        });
      }

      return {
        backupId: backup.id,
        backupName: backup.name,
        scope: input.scope,
        tables: preview.tables,
        totalRecords: preview.totalRecords,
        filesCount: preview.filesCount,
        hasFiles: preview.hasFiles,
        canRestoreFiles: preview.hasFiles && backup.includesFiles === true,
      };
    }),

  // Restore from backup
  restore: adminProcedure
    .input(restoreBackupSchema)
    .handler(async ({ input, context }) => {
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

      // Validate file restoration request
      if (input.restoreFiles && backup.includesFiles !== true) {
        throw new ORPCError("BAD_REQUEST", {
          message:
            "This backup does not include uploaded files. Create a backup with 'full' scope to include files.",
        });
      }

      const { restoreBackup: doRestore } = await import(
        "../utils/backup-restore"
      );
      const result = await doRestore(backup.filePath, {
        scope: input.scope,
        strategy: input.strategy,
        restoreFiles: input.restoreFiles,
        dryRun: input.dryRun,
        createPreRestoreBackup: input.createPreRestoreBackup,
      });

      if (!result.success) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: `Restore failed: ${result.error}`,
        });
      }

      // Update backup record with restore info (if not dry run)
      if (!input.dryRun) {
        await db
          .update(systemBackup)
          .set({
            restoredAt: new Date(),
            restoredById: context.session.user.id,
          })
          .where(eq(systemBackup.id, backup.id));
      }

      return {
        success: true,
        dryRun: input.dryRun,
        tablesRestored: result.tablesRestored,
        recordsRestored: result.recordsRestored,
        filesRestored: result.filesRestored,
        preRestoreBackupPath: result.preRestoreBackupId,
        details: result.details,
      };
    }),

  // Get backup statistics
  getStats: adminProcedure
    .input(getBackupStatsSchema.optional())
    .handler(async () => {
      // Get counts by status
      const statusCounts = await db
        .select({
          status: systemBackup.status,
          count: count(),
        })
        .from(systemBackup)
        .groupBy(systemBackup.status);

      // Get counts by scope
      const scopeCounts = await db
        .select({
          scope: systemBackup.scope,
          count: count(),
        })
        .from(systemBackup)
        .where(eq(systemBackup.status, "completed"))
        .groupBy(systemBackup.scope);

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
        byScope: {
          settings: scopeCounts.find((s) => s.scope === "settings")?.count || 0,
          data: scopeCounts.find((s) => s.scope === "data")?.count || 0,
          database: scopeCounts.find((s) => s.scope === "database")?.count || 0,
          full: scopeCounts.find((s) => s.scope === "full")?.count || 0,
        },
        latestBackup: latestBackup
          ? {
              id: latestBackup.id,
              name: latestBackup.name,
              scope: latestBackup.scope,
              completedAt: latestBackup.completedAt,
              fileSize: latestBackup.fileSize,
              fileSizeFormatted: latestBackup.fileSize
                ? formatFileSize(latestBackup.fileSize)
                : null,
              includesFiles: latestBackup.includesFiles,
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

  // Cleanup failed backups
  cleanupFailed: adminProcedure.handler(async () => {
    // Get all failed backups
    const failedBackups = await db
      .select()
      .from(systemBackup)
      .where(eq(systemBackup.status, "failed"));

    // Delete any associated files
    for (const backup of failedBackups) {
      if (backup.filePath && existsSync(backup.filePath)) {
        try {
          await unlink(backup.filePath);
        } catch {
          // Ignore file deletion errors
        }
      }
    }

    // Delete all failed backup records
    const result = await db
      .delete(systemBackup)
      .where(eq(systemBackup.status, "failed"))
      .returning({ id: systemBackup.id });

    return {
      success: true,
      deletedCount: result.length,
      message: `Cleaned up ${result.length} failed backup records`,
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

    // Create schedule with scope
    create: adminProcedure
      .input(createScheduleSchema)
      .handler(async ({ input, context }) => {
        const [schedule] = await db
          .insert(backupSchedule)
          .values({
            name: input.name,
            description: input.description,
            cronExpression: input.cronExpression,
            scope: input.scope,
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

  // Google Drive cloud storage
  googleDrive: {
    // Get Google Drive connection status
    getStatus: adminProcedure.handler(async () => {
      const {
        isGoogleDriveConfigured,
        getGoogleDriveInfo,
        testGoogleDriveConnection,
      } = await import("../utils/google-drive-storage");

      const configured = isGoogleDriveConfigured();
      if (!configured) {
        return {
          configured: false,
          connected: false,
          email: null,
          storageUsed: null,
          storageTotal: null,
          folderId: null,
        };
      }

      const info = getGoogleDriveInfo();
      if (!info.hasValidTokens) {
        return {
          configured: true,
          connected: false,
          email: null,
          storageUsed: null,
          storageTotal: null,
          folderId: info.folderId,
        };
      }

      // Test connection to get user info
      const connectionTest = await testGoogleDriveConnection();
      return {
        configured: true,
        connected: connectionTest.success,
        email: connectionTest.email ?? null,
        storageUsed: connectionTest.storageUsed ?? null,
        storageTotal: connectionTest.storageTotal ?? null,
        folderId: info.folderId,
      };
    }),

    // Get OAuth authorization URL
    getAuthUrl: adminProcedure.handler(async () => {
      const { isGoogleDriveConfigured, getAuthorizationUrl } = await import(
        "../utils/google-drive-storage"
      );

      if (!isGoogleDriveConfigured()) {
        throw new ORPCError("BAD_REQUEST", {
          message:
            "Google Drive not configured. Set GOOGLE_DRIVE_CLIENT_ID and GOOGLE_DRIVE_CLIENT_SECRET environment variables.",
        });
      }

      const state = crypto.randomUUID();
      const authUrl = getAuthorizationUrl(state);

      return { authUrl, state };
    }),

    // Exchange OAuth code for tokens
    exchangeCode: adminProcedure
      .input(z.object({ code: z.string() }))
      .handler(async ({ input }) => {
        const { exchangeCodeForTokens } = await import(
          "../utils/google-drive-storage"
        );

        const result = await exchangeCodeForTokens(input.code);
        if (!result.success) {
          throw new ORPCError("BAD_REQUEST", {
            message: result.error ?? "Failed to exchange OAuth code",
          });
        }

        return { success: true };
      }),

    // Disconnect Google Drive
    disconnect: adminProcedure.handler(async () => {
      const { disconnectGoogleDrive } = await import(
        "../utils/google-drive-storage"
      );

      await disconnectGoogleDrive();
      return { success: true };
    }),

    // Create backup folder in Google Drive
    createFolder: adminProcedure
      .input(z.object({ folderName: z.string().optional() }))
      .handler(async ({ input }) => {
        const { createBackupFolder } = await import(
          "../utils/google-drive-storage"
        );

        const result = await createBackupFolder(input.folderName);
        if (!result.success) {
          throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: result.error ?? "Failed to create folder",
          });
        }

        return { success: true, folderId: result.folderId };
      }),

    // Upload a backup to Google Drive
    upload: adminProcedure
      .input(z.object({ backupId: z.string() }))
      .handler(async ({ input }) => {
        const backup = await db.query.systemBackup.findFirst({
          where: eq(systemBackup.id, input.backupId),
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

        const { uploadToGoogleDrive } = await import(
          "../utils/google-drive-storage"
        );

        const result = await uploadToGoogleDrive(backup.filePath);
        if (!result.success) {
          throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: result.error ?? "Failed to upload to Google Drive",
          });
        }

        // Update backup record with cloud info
        await db
          .update(systemBackup)
          .set({
            cloudPath: result.fileId,
            cloudProvider: "google_drive" as never, // Will need schema update
            isCloudSynced: true,
            cloudSyncedAt: new Date(),
          })
          .where(eq(systemBackup.id, backup.id));

        return {
          success: true,
          fileId: result.fileId,
          fileName: result.fileName,
        };
      }),

    // List backups in Google Drive
    list: adminProcedure.handler(async () => {
      const { listGoogleDriveBackups } = await import(
        "../utils/google-drive-storage"
      );

      const result = await listGoogleDriveBackups();
      if (!result.success) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: result.error ?? "Failed to list Google Drive backups",
        });
      }

      return {
        backups: result.backups.map((b) => ({
          ...b,
          sizeFormatted: formatFileSize(b.size),
        })),
      };
    }),

    // Download a backup from Google Drive
    download: adminProcedure
      .input(z.object({ fileId: z.string(), fileName: z.string() }))
      .handler(async ({ input }) => {
        const { downloadFromGoogleDrive } = await import(
          "../utils/google-drive-storage"
        );

        const localPath = join(BACKUP_DIR, input.fileName);
        const result = await downloadFromGoogleDrive(input.fileId, localPath);

        if (!result.success) {
          throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: result.error ?? "Failed to download from Google Drive",
          });
        }

        return {
          success: true,
          localPath: result.localPath,
        };
      }),

    // Delete a backup from Google Drive
    delete: adminProcedure
      .input(z.object({ fileId: z.string() }))
      .handler(async ({ input }) => {
        const { deleteFromGoogleDrive } = await import(
          "../utils/google-drive-storage"
        );

        const result = await deleteFromGoogleDrive(input.fileId);
        if (!result.success) {
          throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: result.error ?? "Failed to delete from Google Drive",
          });
        }

        return { success: true };
      }),
  },
};
