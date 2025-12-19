/**
 * Backup Utility - Node.js-based database backup
 *
 * This replaces the shell script approach for Docker compatibility.
 * Uses direct PostgreSQL connection via Drizzle ORM for data export.
 * Creates compressed JSON backups without external dependencies.
 */

import { db, sql } from "@SYNERGY-GY/db";
import { createHash } from "node:crypto";
import { createWriteStream, existsSync, mkdirSync } from "node:fs";
import { readdir, readFile, rm, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";
import { createGzip } from "node:zlib";

// Get absolute path to project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, "../../../../..");

// Configuration
const BACKUP_DIR = process.env.BACKUP_DIR || join(PROJECT_ROOT, "backups");
const UPLOADS_DIR =
  process.env.UPLOADS_DIR || join(PROJECT_ROOT, "data/uploads");

// Ensure backup directory exists
if (!existsSync(BACKUP_DIR)) {
  mkdirSync(BACKUP_DIR, { recursive: true });
}

type BackupResult = {
  success: boolean;
  archivePath?: string;
  tableCount?: number;
  recordCount?: number;
  uploadedFilesCount?: number;
  fileSize?: number;
  checksum?: string;
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

/**
 * Get all user tables and their row counts
 */
async function getTableInfo(): Promise<TableInfo[]> {
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

  return result.rows.map((row) => ({
    tableName: row.table_name,
    rowCount: Number.parseInt(row.row_count, 10) || 0,
  }));
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
 * Count uploaded files
 */
async function countUploadedFiles(): Promise<number> {
  if (!existsSync(UPLOADS_DIR)) {
    return 0;
  }

  let fileCount = 0;

  async function countDir(dir: string): Promise<void> {
    try {
      const entries = await readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          await countDir(join(dir, entry.name));
        } else {
          fileCount += 1;
        }
      }
    } catch {
      // Directory might not exist or be accessible
    }
  }

  await countDir(UPLOADS_DIR);
  return fileCount;
}

/**
 * Create a complete database backup
 */
export async function createBackup(backupName: string): Promise<BackupResult> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const finalName = backupName || `gk-nexus-backup-${timestamp}`;
  const archivePath = join(BACKUP_DIR, `${finalName}.json.gz`);

  try {
    // Get table information
    const tables = await getTableInfo();
    const totalRecords = tables.reduce((sum, t) => sum + t.rowCount, 0);

    // Export all tables
    const tableData: TableData[] = [];
    for (const table of tables) {
      if (table.rowCount > 0) {
        const data = await exportTableData(table.tableName);
        tableData.push(data);
      }
    }

    // Count uploaded files
    const uploadedFilesCount = await countUploadedFiles();

    // Create backup object
    const backup = {
      version: "2.0.0",
      format: "json-compressed",
      createdAt: new Date().toISOString(),
      backupName: finalName,
      metadata: {
        tableCount: tables.length,
        totalRecords,
        uploadedFilesCount,
        tables: tables.map((t) => ({
          name: t.tableName,
          rows: t.rowCount,
        })),
      },
      data: tableData,
      note: "Uploaded files are not included. Use volume backup for complete data recovery.",
    };

    // Write compressed JSON
    const jsonData = JSON.stringify(backup);
    const readable = Readable.from([jsonData]);
    const gzip = createGzip({ level: 9 });
    const writable = createWriteStream(archivePath);

    await pipeline(readable, gzip, writable);

    // Get file stats
    const archiveStats = await stat(archivePath);

    // Calculate checksum
    const fileBuffer = await readFile(archivePath);
    const checksum = createHash("sha256").update(fileBuffer).digest("hex");

    return {
      success: true,
      archivePath,
      tableCount: tables.length,
      recordCount: totalRecords,
      uploadedFilesCount,
      fileSize: archiveStats.size,
      checksum,
    };
  } catch (error) {
    // Clean up on error
    try {
      if (existsSync(archivePath)) {
        await rm(archivePath, { force: true });
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
 * Restore a database from backup
 * Note: Not yet implemented - returns a promise for API compatibility
 */
export function restoreBackup(
  _archivePath: string
): Promise<{ success: boolean; message: string }> {
  // TODO: Implement restore functionality
  // This requires careful handling of foreign key constraints
  return Promise.resolve({
    success: false,
    message:
      "Restore functionality requires manual intervention. " +
      "Please decompress the backup and use the data to restore tables manually.",
  });
}
