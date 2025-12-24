/**
 * Backup Utility - Node.js-based database backup with scope filtering
 *
 * Supports flexible backup scopes:
 * - settings: Configuration tables, templates, service definitions
 * - data: Client data, matters, documents metadata, financial records
 * - database: All tables (settings + data)
 * - full: All tables + uploaded files (PDFs, images, documents)
 *
 * Works in Docker containers without external dependencies.
 */

import { type BackupScope, db, sql } from "@SYNERGY-GY/db";
import { createHash } from "node:crypto";
import { createWriteStream, existsSync, mkdirSync } from "node:fs";
import {
  copyFile,
  mkdir,
  readdir,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";
import { createGzip } from "node:zlib";
import { create as tarCreate } from "tar";

// Get absolute path to project root (4 levels up from packages/api/src/utils/)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, "../../../..");

// Configuration
// In Docker, backups mount at /app/backups; locally, use project root/backups
const isDocker = existsSync("/app/backups") || existsSync("/.dockerenv");
const BACKUP_DIR =
  process.env.BACKUP_DIR ||
  (isDocker ? "/app/backups" : join(PROJECT_ROOT, "backups"));
const UPLOADS_DIR =
  process.env.UPLOADS_DIR ||
  (isDocker ? "/app/data/uploads" : join(PROJECT_ROOT, "data/uploads"));

// Ensure backup directory exists
if (!existsSync(BACKUP_DIR)) {
  mkdirSync(BACKUP_DIR, { recursive: true });
}

// ============================================================================
// Table Categories
// ============================================================================

/**
 * Settings tables - Configuration, templates, service definitions
 * These rarely change and are typically migrated between environments
 */
const SETTINGS_TABLES = [
  "backup_schedule",
  "service_type",
  "service_category",
  "service_catalog",
  "document_template",
  "knowledge_base_item",
  "courses",
  "appointment_type",
  "report_definition",
  "notification_preference",
  "tag",
  "bootstrap_token",
] as const;

/**
 * Data tables - Business data that changes frequently
 * These are the core operational data of the application
 */
const DATA_TABLES = [
  // Auth & Users
  "user",
  "session",
  "account",
  "verification",
  "password_setup_token",
  // Staff
  "staff",
  "staff_invite",
  "staff_availability",
  "staff_availability_override",
  "staff_hourly_rate",
  // Clients
  "client",
  "client_contact",
  "client_link",
  "client_communication",
  "client_service_selection",
  "client_emergency_contact",
  "client_employment_info",
  "client_beneficial_owner",
  "client_aml_assessment",
  // Matters & Services
  "matter",
  "matter_checklist",
  "matter_note",
  "matter_link",
  // Documents
  "document",
  "document_verification",
  // Invoicing
  "invoice",
  "invoice_line_item",
  "invoice_payment",
  // Appointments & Deadlines
  "appointment",
  "appointment_reminder",
  "deadline",
  "deadline_reminder",
  // Time Tracking
  "time_entry",
  "active_timer",
  // Portal
  "portal_user",
  "portal_session",
  "portal_password_reset",
  "portal_invite",
  "portal_activity_log",
  "portal_message",
  "portal_document_upload",
  "staff_impersonation_session",
  // Training
  "course_schedules",
  "enrollments",
  // Activity & Notifications
  "activity_log",
  "notification",
  // Financial
  "tax_calculations",
  // Reports
  "report_execution",
  "scheduled_report",
  // System
  "system_backup",
  // Downloads tracking
  "knowledge_base_download",
] as const;

// ============================================================================
// Types
// ============================================================================

export type BackupOptions = {
  scope: BackupScope;
  description?: string;
  syncToCloud?: boolean;
};

export type BackupResult = {
  success: boolean;
  archivePath?: string;
  tableCount?: number;
  recordCount?: number;
  uploadedFilesCount?: number;
  uploadedFilesSize?: number;
  fileSize?: number;
  checksum?: string;
  scope?: BackupScope;
  includesFiles?: boolean;
  error?: string;
};

type TableInfo = {
  tableName: string;
  rowCount: number;
};

type TableData = {
  tableName: string;
  columns: string[];
  rows: Record<string, unknown>[];
};

type FileManifest = {
  relativePath: string;
  size: number;
  checksum: string;
  mtime: string;
};

// ============================================================================
// Helpers
// ============================================================================

/**
 * Get tables to include based on backup scope
 */
function getTablesForScope(scope: BackupScope): readonly string[] | "all" {
  switch (scope) {
    case "settings":
      return SETTINGS_TABLES;
    case "data":
      return DATA_TABLES;
    default:
      // "database", "full", or any unknown scope returns all tables
      return "all";
  }
}

/**
 * Get all user tables and their row counts, filtered by scope
 */
async function getTableInfo(scope: BackupScope): Promise<TableInfo[]> {
  const result = await db.execute<{
    table_name: string;
    row_count: string;
  }>(sql`
    SELECT
      relname as table_name,
      n_live_tup::text as row_count
    FROM pg_stat_user_tables
    WHERE schemaname = 'public'
    ORDER BY relname
  `);

  const tables = result.rows.map((row) => ({
    tableName: row.table_name,
    rowCount: Number.parseInt(row.row_count, 10) || 0,
  }));

  const scopeTables = getTablesForScope(scope);
  if (scopeTables === "all") {
    return tables;
  }

  return tables.filter((t) =>
    (scopeTables as readonly string[]).includes(t.tableName)
  );
}

/**
 * Export a table's data
 */
async function exportTableData(tableName: string): Promise<TableData> {
  // Get column names
  const columnsResult = await db.execute<{ column_name: string }>(sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = ${tableName}
    ORDER BY ordinal_position
  `);

  const columns = columnsResult.rows.map((r) => r.column_name);
  if (columns.length === 0) {
    return { tableName, columns: [], rows: [] };
  }

  // Get all data from the table
  const dataResult = await db.execute(sql.raw(`SELECT * FROM "${tableName}"`));

  return {
    tableName,
    columns,
    rows: dataResult.rows as Record<string, unknown>[],
  };
}

/**
 * Calculate checksum of a file
 */
async function calculateChecksum(filePath: string): Promise<string> {
  const fileBuffer = await readFile(filePath);
  return createHash("sha256").update(fileBuffer).digest("hex");
}

/**
 * Get uploaded files info and optionally copy them
 */
async function processUploadedFiles(targetDir?: string): Promise<{
  fileCount: number;
  totalSize: number;
  manifest: FileManifest[];
}> {
  const manifest: FileManifest[] = [];
  let fileCount = 0;
  let totalSize = 0;

  if (!existsSync(UPLOADS_DIR)) {
    return { fileCount: 0, totalSize: 0, manifest: [] };
  }

  async function processDir(dir: string): Promise<void> {
    try {
      const entries = await readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
          // Skip temp directories
          if (entry.name !== "temp") {
            await processDir(fullPath);
          }
        } else {
          fileCount += 1;
          const stats = await stat(fullPath);
          totalSize += stats.size;

          const relativePath = relative(UPLOADS_DIR, fullPath);

          // If we have a target directory, copy the file
          if (targetDir) {
            const targetPath = join(targetDir, relativePath);
            await mkdir(dirname(targetPath), { recursive: true });
            await copyFile(fullPath, targetPath);

            const checksum = await calculateChecksum(fullPath);
            manifest.push({
              relativePath,
              size: stats.size,
              checksum,
              mtime: stats.mtime.toISOString(),
            });
          }
        }
      }
    } catch {
      // Directory might not exist or be accessible
    }
  }

  await processDir(UPLOADS_DIR);
  return { fileCount, totalSize, manifest };
}

// ============================================================================
// Main Backup Functions
// ============================================================================

/**
 * Create a database backup with the specified scope
 *
 * @param backupName - Name for the backup file
 * @param options - Backup options including scope
 * @returns BackupResult with success status and details
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complex backup logic with file handling and multiple scopes
export async function createBackup(
  backupName: string,
  options: BackupOptions = { scope: "database" }
): Promise<BackupResult> {
  const { scope } = options;
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const finalName = backupName || `gk-nexus-backup-${timestamp}`;

  // For full backups (with files), we create a tar.gz archive
  // For other scopes, we create a simple json.gz file
  const includesFiles = scope === "full";
  const extension = includesFiles ? ".tar.gz" : ".json.gz";
  const archivePath = join(BACKUP_DIR, `${finalName}${extension}`);

  // Create a temp directory for full backups
  const tempDir = includesFiles ? join(BACKUP_DIR, `.temp-${finalName}`) : null;

  try {
    // Get table information based on scope
    const tables = await getTableInfo(scope);
    const totalRecords = tables.reduce((sum, t) => sum + t.rowCount, 0);

    // Export all tables in scope
    const tableData: TableData[] = [];
    for (const table of tables) {
      if (table.rowCount > 0) {
        const data = await exportTableData(table.tableName);
        tableData.push(data);
      }
    }

    // Process uploaded files
    let uploadedFilesCount = 0;
    let uploadedFilesSize = 0;
    let fileManifest: FileManifest[] = [];

    if (includesFiles && tempDir) {
      // Create temp directory structure
      await mkdir(tempDir, { recursive: true });
      const uploadsTarget = join(tempDir, "uploads");
      await mkdir(uploadsTarget, { recursive: true });

      // Copy files and generate manifest
      const filesResult = await processUploadedFiles(uploadsTarget);
      uploadedFilesCount = filesResult.fileCount;
      uploadedFilesSize = filesResult.totalSize;
      fileManifest = filesResult.manifest;
    } else {
      // Just count files, don't copy
      const filesInfo = await processUploadedFiles();
      uploadedFilesCount = filesInfo.fileCount;
      uploadedFilesSize = filesInfo.totalSize;
    }

    // Create backup metadata
    const backupMetadata = {
      version: "3.0.0",
      format: includesFiles ? "tar-gz-bundle" : "json-compressed",
      scope,
      createdAt: new Date().toISOString(),
      backupName: finalName,
      includesFiles,
      metadata: {
        tableCount: tables.length,
        totalRecords,
        uploadedFilesCount,
        uploadedFilesSize,
        tables: tables.map((t) => ({
          name: t.tableName,
          rows: t.rowCount,
        })),
        ...(includesFiles && { files: fileManifest }),
      },
      data: tableData,
    };

    if (includesFiles && tempDir) {
      // Write database.json to temp directory
      const databaseJsonPath = join(tempDir, "database.json");
      await writeFile(databaseJsonPath, JSON.stringify(backupMetadata));

      // Write manifest.json separately for quick inspection
      const manifestPath = join(tempDir, "manifest.json");
      await writeFile(
        manifestPath,
        JSON.stringify(
          {
            version: backupMetadata.version,
            scope,
            createdAt: backupMetadata.createdAt,
            tableCount: tables.length,
            totalRecords,
            uploadedFilesCount,
            uploadedFilesSize,
          },
          null,
          2
        )
      );

      // Create tar.gz archive
      await tarCreate(
        {
          gzip: true,
          file: archivePath,
          cwd: tempDir,
        },
        ["."]
      );

      // Clean up temp directory
      await rm(tempDir, { recursive: true, force: true });
    } else {
      // Write compressed JSON directly
      const jsonData = JSON.stringify(backupMetadata);
      const readable = Readable.from([jsonData]);
      const gzip = createGzip({ level: 9 });
      const writable = createWriteStream(archivePath);
      await pipeline(readable, gzip, writable);
    }

    // Get file stats and checksum
    const archiveStats = await stat(archivePath);
    const checksum = await calculateChecksum(archivePath);

    return {
      success: true,
      archivePath,
      tableCount: tables.length,
      recordCount: totalRecords,
      uploadedFilesCount,
      uploadedFilesSize,
      fileSize: archiveStats.size,
      checksum,
      scope,
      includesFiles,
    };
  } catch (error) {
    // Clean up on error
    try {
      if (existsSync(archivePath)) {
        await rm(archivePath, { force: true });
      }
      if (tempDir && existsSync(tempDir)) {
        await rm(tempDir, { recursive: true, force: true });
      }
    } catch {
      // Ignore cleanup errors
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get backup info without creating a backup (for size estimation)
 */
export async function getBackupStats(scope: BackupScope): Promise<{
  tableCount: number;
  recordCount: number;
  estimatedDatabaseSize: number;
  uploadedFilesCount: number;
  uploadedFilesSize: number;
  estimatedTotalSize: number;
}> {
  const tables = await getTableInfo(scope);
  const recordCount = tables.reduce((sum, t) => sum + t.rowCount, 0);

  // Rough estimate: ~100 bytes per record average (varies by table)
  const estimatedDatabaseSize = recordCount * 100;

  const filesInfo = await processUploadedFiles();

  const includesFiles = scope === "full";

  return {
    tableCount: tables.length,
    recordCount,
    estimatedDatabaseSize,
    uploadedFilesCount: filesInfo.fileCount,
    uploadedFilesSize: filesInfo.totalSize,
    estimatedTotalSize: includesFiles
      ? estimatedDatabaseSize + filesInfo.totalSize
      : estimatedDatabaseSize,
  };
}

/**
 * List available backups in the backup directory
 */
export async function listBackups(): Promise<
  Array<{
    name: string;
    path: string;
    size: number;
    createdAt: Date;
    isFullBackup: boolean;
  }>
> {
  if (!existsSync(BACKUP_DIR)) {
    return [];
  }

  const entries = await readdir(BACKUP_DIR, { withFileTypes: true });
  const backups: Array<{
    name: string;
    path: string;
    size: number;
    createdAt: Date;
    isFullBackup: boolean;
  }> = [];

  for (const entry of entries) {
    if (
      entry.isFile() &&
      (entry.name.endsWith(".json.gz") || entry.name.endsWith(".tar.gz"))
    ) {
      const fullPath = join(BACKUP_DIR, entry.name);
      const stats = await stat(fullPath);
      backups.push({
        name: entry.name,
        path: fullPath,
        size: stats.size,
        createdAt: stats.mtime,
        isFullBackup: entry.name.endsWith(".tar.gz"),
      });
    }
  }

  // Sort by creation date, newest first
  return backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/**
 * Delete a backup file
 */
export async function deleteBackup(
  archivePath: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!existsSync(archivePath)) {
      return { success: false, error: "Backup file not found" };
    }
    await rm(archivePath, { force: true });
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Export constants for use in other modules
export { BACKUP_DIR, UPLOADS_DIR, SETTINGS_TABLES, DATA_TABLES };
