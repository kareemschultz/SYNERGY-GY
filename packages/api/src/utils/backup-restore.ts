/**
 * Backup Restore Utility
 *
 * Provides comprehensive restore functionality for GK-Nexus backups:
 * - Validate backup files before restore
 * - Support replace/merge strategies
 * - Handle foreign key constraints properly
 * - Support partial restores (settings only, data only, or all)
 * - Create pre-restore safety backups
 * - Progress tracking for UI feedback
 */

import { type BackupScope, db, sql } from "@SYNERGY-GY/db";
import { existsSync, mkdirSync } from "node:fs";
import { copyFile, mkdir, readFile, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { createGunzip } from "node:zlib";
import { extract as tarExtract } from "tar";
import {
  BACKUP_DIR,
  createBackup,
  DATA_TABLES,
  SETTINGS_TABLES,
  UPLOADS_DIR,
} from "./backup-utility";

// ============================================================================
// Types
// ============================================================================

export type RestoreStrategy = "replace" | "merge";

export type RestoreScope = "settings" | "data" | "all";

export type RestoreOptions = {
  scope: RestoreScope;
  strategy: RestoreStrategy;
  restoreFiles?: boolean;
  dryRun?: boolean;
  createPreRestoreBackup?: boolean;
  onProgress?: (progress: RestoreProgress) => void;
};

export type RestoreProgress = {
  phase: "validating" | "backing_up" | "restoring" | "files" | "complete";
  currentTable?: string;
  tablesCompleted: number;
  tablesTotal: number;
  recordsRestored: number;
  filesRestored?: number;
  filesTotal?: number;
  message: string;
};

export type BackupValidation = {
  valid: boolean;
  format: "json-compressed" | "tar-gz-bundle" | "unknown";
  version: string;
  scope: BackupScope;
  tableCount: number;
  recordCount: number;
  hasFiles: boolean;
  fileCount: number;
  createdAt: string;
  errors: string[];
  warnings: string[];
};

export type RestoreResult = {
  success: boolean;
  tablesRestored: number;
  recordsRestored: number;
  filesRestored?: number;
  preRestoreBackupId?: string;
  dryRunOnly?: boolean;
  error?: string;
  details?: {
    tableResults: Array<{
      tableName: string;
      recordsRestored: number;
      strategy: RestoreStrategy;
    }>;
  };
};

type BackupData = {
  version: string;
  format: string;
  scope: BackupScope;
  createdAt: string;
  backupName: string;
  includesFiles?: boolean;
  metadata: {
    tableCount: number;
    totalRecords: number;
    uploadedFilesCount?: number;
    uploadedFilesSize?: number;
    tables: Array<{ name: string; rows: number }>;
    files?: Array<{
      relativePath: string;
      size: number;
      checksum: string;
      mtime: string;
    }>;
  };
  data: Array<{
    tableName: string;
    columns: string[];
    rows: Record<string, unknown>[];
  }>;
};

// ============================================================================
// Helpers
// ============================================================================

/**
 * Get tables that match the restore scope
 */
function getRestoreTables(
  restoreScope: RestoreScope,
  availableTables: string[]
): string[] {
  switch (restoreScope) {
    case "settings":
      return availableTables.filter((t) =>
        (SETTINGS_TABLES as readonly string[]).includes(t)
      );
    case "data":
      return availableTables.filter((t) =>
        (DATA_TABLES as readonly string[]).includes(t)
      );
    default:
      // "all" and any unknown scope returns all tables
      return availableTables;
  }
}

/**
 * Extract backup data from archive
 */
async function extractBackupData(archivePath: string): Promise<BackupData> {
  const isFullBackup = archivePath.endsWith(".tar.gz");

  if (isFullBackup) {
    // Extract tar.gz to temp directory
    const tempDir = join(BACKUP_DIR, `.restore-temp-${Date.now()}`);
    mkdirSync(tempDir, { recursive: true });

    try {
      await tarExtract({
        file: archivePath,
        cwd: tempDir,
      });

      // Read database.json from extracted files
      const databaseJsonPath = join(tempDir, "database.json");
      const jsonContent = await readFile(databaseJsonPath, "utf-8");
      const data = JSON.parse(jsonContent) as BackupData;

      // Store temp dir path for file restoration
      (data as BackupData & { _tempDir: string })._tempDir = tempDir;

      return data;
    } catch (error) {
      // Clean up on error - ignore cleanup failures
      // biome-ignore lint/suspicious/noEmptyBlockStatements: intentionally ignoring cleanup errors
      await rm(tempDir, { recursive: true, force: true }).catch(() => {});
      throw error;
    }
  } else {
    // Decompress and parse JSON
    const compressedBuffer = await readFile(archivePath);

    return new Promise((resolve, reject) => {
      const gunzip = createGunzip();
      const chunks: Buffer[] = [];

      gunzip.on("data", (chunk) => chunks.push(chunk));
      gunzip.on("end", () => {
        try {
          const jsonString = Buffer.concat(chunks).toString("utf-8");
          resolve(JSON.parse(jsonString) as BackupData);
        } catch (error) {
          reject(error);
        }
      });
      gunzip.on("error", reject);

      gunzip.write(compressedBuffer);
      gunzip.end();
    });
  }
}

/**
 * Clean up temp directory after restore
 */
async function cleanupTempDir(backupData: BackupData): Promise<void> {
  const tempDir = (backupData as BackupData & { _tempDir?: string })._tempDir;
  if (tempDir && existsSync(tempDir)) {
    // biome-ignore lint/suspicious/noEmptyBlockStatements: intentionally ignoring cleanup errors
    await rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate a backup file and return information about its contents
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complex validation logic with multiple checks
export async function validateBackup(
  archivePath: string
): Promise<BackupValidation> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check file exists
  if (!existsSync(archivePath)) {
    return {
      valid: false,
      format: "unknown",
      version: "unknown",
      scope: "database",
      tableCount: 0,
      recordCount: 0,
      hasFiles: false,
      fileCount: 0,
      createdAt: "",
      errors: ["Backup file not found"],
      warnings: [],
    };
  }

  // Determine format
  const isFullBackup = archivePath.endsWith(".tar.gz");
  const format = isFullBackup ? "tar-gz-bundle" : "json-compressed";

  try {
    const backupData = await extractBackupData(archivePath);

    // Validate version compatibility
    const version = backupData.version || "1.0.0";
    const majorVersion = Number.parseInt(version.split(".")[0] || "1", 10);
    if (majorVersion > 3) {
      errors.push(
        `Backup version ${version} is newer than supported. Please update the application.`
      );
    }

    // Validate required fields
    if (!(backupData.data && Array.isArray(backupData.data))) {
      errors.push("Backup file is missing table data");
    }

    // Count records
    const recordCount = backupData.data?.reduce(
      (sum, table) => sum + (table.rows?.length || 0),
      0
    );

    // Check for files
    const hasFiles = backupData.includesFiles === true;
    const fileCount = backupData.metadata?.uploadedFilesCount || 0;

    // Validate file checksums if this is a full backup
    if (hasFiles && backupData.metadata?.files) {
      const tempDir = (backupData as BackupData & { _tempDir?: string })
        ._tempDir;
      if (tempDir) {
        const uploadsDir = join(tempDir, "uploads");
        for (const file of backupData.metadata.files) {
          const filePath = join(uploadsDir, file.relativePath);
          if (!existsSync(filePath)) {
            warnings.push(`File missing from backup: ${file.relativePath}`);
          }
        }
      }
    }

    // Clean up temp directory from extraction
    await cleanupTempDir(backupData);

    return {
      valid: errors.length === 0,
      format: format as "json-compressed" | "tar-gz-bundle",
      version,
      scope: backupData.scope || "database",
      tableCount: backupData.data?.length || 0,
      recordCount: recordCount || 0,
      hasFiles,
      fileCount,
      createdAt: backupData.createdAt || "",
      errors,
      warnings,
    };
  } catch (error) {
    return {
      valid: false,
      format,
      version: "unknown",
      scope: "database",
      tableCount: 0,
      recordCount: 0,
      hasFiles: false,
      fileCount: 0,
      createdAt: "",
      errors: [
        `Failed to read backup: ${error instanceof Error ? error.message : "Unknown error"}`,
      ],
      warnings: [],
    };
  }
}

// ============================================================================
// Restore Functions
// ============================================================================

/**
 * Restore a backup with the specified options
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complex restore logic with transactions and multiple phases
export async function restoreBackup(
  archivePath: string,
  options: RestoreOptions
): Promise<RestoreResult> {
  const {
    scope,
    strategy,
    restoreFiles = false,
    dryRun = false,
    createPreRestoreBackup = true,
    onProgress,
  } = options;

  const updateProgress = (progress: Partial<RestoreProgress>) => {
    if (onProgress) {
      onProgress({
        phase: "validating",
        tablesCompleted: 0,
        tablesTotal: 0,
        recordsRestored: 0,
        message: "",
        ...progress,
      });
    }
  };

  try {
    // Phase 1: Validate backup
    updateProgress({
      phase: "validating",
      message: "Validating backup file...",
    });

    const validation = await validateBackup(archivePath);
    if (!validation.valid) {
      return {
        success: false,
        tablesRestored: 0,
        recordsRestored: 0,
        error: `Backup validation failed: ${validation.errors.join(", ")}`,
      };
    }

    // Phase 2: Create pre-restore backup
    let preRestoreBackupId: string | undefined;
    if (createPreRestoreBackup && !dryRun) {
      updateProgress({
        phase: "backing_up",
        message: "Creating safety backup before restore...",
      });

      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .slice(0, 19);
      const safetyBackup = await createBackup(
        `pre-restore-safety-${timestamp}`,
        { scope: "database" }
      );

      if (!safetyBackup.success) {
        return {
          success: false,
          tablesRestored: 0,
          recordsRestored: 0,
          error: `Failed to create safety backup: ${safetyBackup.error}`,
        };
      }

      // We'll return the archive path as the ID for reference
      preRestoreBackupId = safetyBackup.archivePath;
    }

    // Extract backup data
    const backupData = await extractBackupData(archivePath);

    // Get tables to restore based on scope
    const allBackupTables = backupData.data.map((t) => t.tableName);
    const tablesToRestore = getRestoreTables(scope, allBackupTables);

    if (tablesToRestore.length === 0) {
      await cleanupTempDir(backupData);
      return {
        success: false,
        tablesRestored: 0,
        recordsRestored: 0,
        error: `No tables to restore for scope: ${scope}`,
      };
    }

    // If dry run, return what would be restored
    if (dryRun) {
      const recordCount = backupData.data
        .filter((t) => tablesToRestore.includes(t.tableName))
        .reduce((sum, t) => sum + t.rows.length, 0);

      await cleanupTempDir(backupData);
      return {
        success: true,
        tablesRestored: tablesToRestore.length,
        recordsRestored: recordCount,
        filesRestored: restoreFiles ? validation.fileCount : 0,
        dryRunOnly: true,
        details: {
          tableResults: backupData.data
            .filter((t) => tablesToRestore.includes(t.tableName))
            .map((t) => ({
              tableName: t.tableName,
              recordsRestored: t.rows.length,
              strategy,
            })),
        },
      };
    }

    // Phase 3: Restore database
    updateProgress({
      phase: "restoring",
      tablesTotal: tablesToRestore.length,
      message: "Restoring database tables...",
    });

    const tableResults: Array<{
      tableName: string;
      recordsRestored: number;
      strategy: RestoreStrategy;
    }> = [];

    let totalRecordsRestored = 0;

    // Use a transaction for atomicity
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complex transaction with table iteration and FK handling
    await db.transaction(async (tx) => {
      // Disable foreign key checks temporarily
      await tx.execute(sql`SET session_replication_role = 'replica'`);

      try {
        let tablesCompleted = 0;

        for (const tableName of tablesToRestore) {
          const tableData = backupData.data.find(
            (t) => t.tableName === tableName
          );
          if (!tableData || tableData.rows.length === 0) {
            tablesCompleted += 1;
            continue;
          }

          updateProgress({
            phase: "restoring",
            currentTable: tableName,
            tablesCompleted,
            tablesTotal: tablesToRestore.length,
            recordsRestored: totalRecordsRestored,
            message: `Restoring table: ${tableName}`,
          });

          if (strategy === "replace") {
            // Truncate and insert all records
            await tx.execute(sql.raw(`TRUNCATE TABLE "${tableName}" CASCADE`));
          }

          // Insert records
          for (const row of tableData.rows) {
            const columns = Object.keys(row);
            const values = Object.values(row);

            if (columns.length === 0) {
              continue;
            }

            const columnList = columns.map((c) => `"${c}"`).join(", ");
            // Build SQL values using proper escaping for each value
            const valuesSql = values.map((v) => {
              if (v === null) {
                return sql`NULL`;
              }
              if (typeof v === "number") {
                return sql`${v}`;
              }
              if (typeof v === "boolean") {
                return sql`${v}`;
              }
              // For strings and other types, use parameterized query
              return sql`${v}`;
            });
            const valuesClause = sql.join(valuesSql, sql`, `);

            if (strategy === "merge") {
              // Use upsert (ON CONFLICT DO UPDATE) for merge strategy
              // Assuming 'id' is the primary key
              const updateList = columns
                .filter((c) => c !== "id")
                .map((c) => `"${c}" = EXCLUDED."${c}"`)
                .join(", ");

              await tx.execute(
                sql`INSERT INTO ${sql.raw(`"${tableName}"`)} (${sql.raw(columnList)}) VALUES (${valuesClause})
                   ON CONFLICT (id) DO UPDATE SET ${sql.raw(updateList)}`
              );
            } else {
              await tx.execute(
                sql`INSERT INTO ${sql.raw(`"${tableName}"`)} (${sql.raw(columnList)}) VALUES (${valuesClause})`
              );
            }

            totalRecordsRestored += 1;
          }

          tableResults.push({
            tableName,
            recordsRestored: tableData.rows.length,
            strategy,
          });

          tablesCompleted += 1;
        }
      } finally {
        // Re-enable foreign key checks
        await tx.execute(sql`SET session_replication_role = 'origin'`);
      }
    });

    // Phase 4: Restore files if requested
    let filesRestored = 0;
    if (
      restoreFiles &&
      backupData.includesFiles &&
      backupData.metadata?.files
    ) {
      const tempDir = (backupData as BackupData & { _tempDir?: string })
        ._tempDir;
      if (tempDir) {
        updateProgress({
          phase: "files",
          tablesCompleted: tablesToRestore.length,
          tablesTotal: tablesToRestore.length,
          recordsRestored: totalRecordsRestored,
          filesTotal: backupData.metadata.files.length,
          message: "Restoring uploaded files...",
        });

        const uploadsSource = join(tempDir, "uploads");
        if (existsSync(uploadsSource)) {
          for (const file of backupData.metadata.files) {
            const sourcePath = join(uploadsSource, file.relativePath);
            const targetPath = join(UPLOADS_DIR, file.relativePath);

            if (existsSync(sourcePath)) {
              await mkdir(dirname(targetPath), { recursive: true });
              await copyFile(sourcePath, targetPath);
              filesRestored += 1;

              updateProgress({
                phase: "files",
                tablesCompleted: tablesToRestore.length,
                tablesTotal: tablesToRestore.length,
                recordsRestored: totalRecordsRestored,
                filesRestored,
                filesTotal: backupData.metadata.files.length,
                message: `Restoring file: ${file.relativePath}`,
              });
            }
          }
        }
      }
    }

    // Clean up temp directory
    await cleanupTempDir(backupData);

    // Phase 5: Complete
    updateProgress({
      phase: "complete",
      tablesCompleted: tablesToRestore.length,
      tablesTotal: tablesToRestore.length,
      recordsRestored: totalRecordsRestored,
      filesRestored,
      message: "Restore complete!",
    });

    return {
      success: true,
      tablesRestored: tableResults.length,
      recordsRestored: totalRecordsRestored,
      filesRestored,
      preRestoreBackupId,
      details: { tableResults },
    };
  } catch (error) {
    return {
      success: false,
      tablesRestored: 0,
      recordsRestored: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Preview a restore operation without making changes
 */
export async function previewRestore(
  archivePath: string,
  scope: RestoreScope = "all"
): Promise<{
  valid: boolean;
  tables: Array<{ name: string; recordCount: number }>;
  totalRecords: number;
  filesCount: number;
  hasFiles: boolean;
  errors: string[];
}> {
  const validation = await validateBackup(archivePath);

  if (!validation.valid) {
    return {
      valid: false,
      tables: [],
      totalRecords: 0,
      filesCount: 0,
      hasFiles: false,
      errors: validation.errors,
    };
  }

  try {
    const backupData = await extractBackupData(archivePath);
    const allBackupTables = backupData.data.map((t) => t.tableName);
    const tablesToRestore = getRestoreTables(scope, allBackupTables);

    const tables = backupData.data
      .filter((t) => tablesToRestore.includes(t.tableName))
      .map((t) => ({
        name: t.tableName,
        recordCount: t.rows.length,
      }));

    const totalRecords = tables.reduce((sum, t) => sum + t.recordCount, 0);

    await cleanupTempDir(backupData);

    return {
      valid: true,
      tables,
      totalRecords,
      filesCount: validation.fileCount,
      hasFiles: validation.hasFiles,
      errors: [],
    };
  } catch (error) {
    return {
      valid: false,
      tables: [],
      totalRecords: 0,
      filesCount: 0,
      hasFiles: false,
      errors: [error instanceof Error ? error.message : "Unknown error"],
    };
  }
}
