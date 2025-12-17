/**
 * Backup Scheduler - Processes scheduled backup jobs
 *
 * Uses a simple interval-based approach that checks every minute
 * for schedules that need to run based on their cron expressions.
 */

import { backupSchedule, db, systemBackup } from "@SYNERGY-GY/db";
import { exec } from "node:child_process";
import { existsSync } from "node:fs";
import { stat, unlink } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import { and, eq, lte } from "drizzle-orm";

const execAsync = promisify(exec);

// @ts-expect-error Reserved for future use - will be used for backup file path resolution
const _BACKUP_DIR = process.env.BACKUP_DIR || "./backups";
const SCRIPTS_DIR = process.env.SCRIPTS_DIR || "./scripts";
const CHECK_INTERVAL_MS = 60_000; // Check every minute

// Simple cron parser - supports basic patterns
// Format: minute hour day-of-month month day-of-week
// Examples:
// - "0 2 * * *" = every day at 2:00 AM
// - "0 0 * * 0" = every Sunday at midnight
// - "30 3 * * 1-5" = weekdays at 3:30 AM
// - "0 */6 * * *" = every 6 hours

type CronFields = {
  minute: number[];
  hour: number[];
  dayOfMonth: number[];
  month: number[];
  dayOfWeek: number[];
};

function parseCronField(field: string, min: number, max: number): number[] {
  const values: number[] = [];

  if (field === "*") {
    for (let i = min; i <= max; i++) {
      values.push(i);
    }
    return values;
  }

  // Handle step values (*/n or start-end/n)
  if (field.includes("/")) {
    const [range, stepStr] = field.split("/");
    if (!stepStr) {
      return values;
    }
    const step = Number.parseInt(stepStr, 10);

    let start = min;
    let end = max;

    if (range && range !== "*") {
      if (range.includes("-")) {
        const parts = range.split("-");
        const s = parts[0];
        const e = parts[1];
        if (s && e) {
          start = Number.parseInt(s, 10);
          end = Number.parseInt(e, 10);
        }
      } else {
        start = Number.parseInt(range, 10);
      }
    }

    for (let i = start; i <= end; i += step) {
      values.push(i);
    }
    return values;
  }

  // Handle ranges (a-b)
  if (field.includes("-") && !field.includes(",")) {
    const parts = field.split("-").map((n) => Number.parseInt(n, 10));
    const start = parts[0];
    const end = parts[1];
    if (start !== undefined && end !== undefined) {
      for (let i = start; i <= end; i++) {
        values.push(i);
      }
    }
    return values;
  }

  // Handle lists (a,b,c)
  if (field.includes(",")) {
    const listParts = field.split(",");
    for (const part of listParts) {
      if (part.includes("-")) {
        const rangeParts = part.split("-").map((n) => Number.parseInt(n, 10));
        const start = rangeParts[0];
        const end = rangeParts[1];
        if (start !== undefined && end !== undefined) {
          for (let i = start; i <= end; i++) {
            values.push(i);
          }
        }
      } else {
        values.push(Number.parseInt(part, 10));
      }
    }
    return values;
  }

  // Single value
  values.push(Number.parseInt(field, 10));
  return values;
}

function parseCronExpression(expr: string): CronFields | null {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) {
    return null;
  }

  const [minutePart, hourPart, dayPart, monthPart, dowPart] = parts;
  if (!(minutePart && hourPart && dayPart && monthPart && dowPart)) {
    return null;
  }

  try {
    return {
      minute: parseCronField(minutePart, 0, 59),
      hour: parseCronField(hourPart, 0, 23),
      dayOfMonth: parseCronField(dayPart, 1, 31),
      month: parseCronField(monthPart, 1, 12),
      dayOfWeek: parseCronField(dowPart, 0, 6), // 0 = Sunday
    };
  } catch {
    return null;
  }
}

function shouldRunNow(cron: CronFields, now: Date): boolean {
  const minute = now.getMinutes();
  const hour = now.getHours();
  const dayOfMonth = now.getDate();
  const month = now.getMonth() + 1; // JavaScript months are 0-indexed
  const dayOfWeek = now.getDay(); // 0 = Sunday

  return (
    cron.minute.includes(minute) &&
    cron.hour.includes(hour) &&
    cron.dayOfMonth.includes(dayOfMonth) &&
    cron.month.includes(month) &&
    cron.dayOfWeek.includes(dayOfWeek)
  );
}

function getNextRunTime(cron: CronFields, from: Date): Date {
  const next = new Date(from);
  next.setSeconds(0);
  next.setMilliseconds(0);

  // Find next matching minute, hour, day, etc.
  // Simple approach: iterate minute by minute up to 1 year
  const maxIterations = 525_600; // ~1 year in minutes

  for (let i = 0; i < maxIterations; i++) {
    next.setMinutes(next.getMinutes() + 1);
    if (shouldRunNow(cron, next)) {
      return next;
    }
  }

  // Fallback: return tomorrow at the first matching time
  next.setDate(next.getDate() + 1);
  return next;
}

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

async function executeBackup(
  schedule: typeof backupSchedule.$inferSelect
): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const backupName = `scheduled-${schedule.name.toLowerCase().replace(/\s+/g, "-")}-${timestamp}`;

  console.log(`[BackupScheduler] Starting scheduled backup: ${backupName}`);

  // Create backup record
  const [backup] = await db
    .insert(systemBackup)
    .values({
      name: backupName,
      description: `Scheduled backup from "${schedule.name}"`,
      type: "scheduled",
      status: "in_progress",
      startedAt: new Date(),
      createdById: schedule.createdById,
    })
    .returning();

  if (!backup) {
    console.error(
      `[BackupScheduler] Failed to create backup record for: ${backupName}`
    );
    return;
  }

  try {
    // Execute backup script
    const scriptPath = join(SCRIPTS_DIR, "backup.sh");
    if (!existsSync(scriptPath)) {
      throw new Error("Backup script not found");
    }

    const { stdout } = await execAsync(`bash "${scriptPath}" "${backupName}"`, {
      cwd: process.cwd(),
      timeout: 300_000, // 5 minute timeout
    });

    // Parse output for file path
    const outputLines = stdout.split("\n");
    const archiveLine = outputLines.find((line) => line.includes("Archive:"));
    const filePath = archiveLine?.match(/Archive:\s*(.+\.zip)/)?.[1];

    // Get file info
    let fileSize = 0;
    let checksum = "";
    if (filePath && existsSync(filePath)) {
      const stats = await stat(filePath);
      fileSize = stats.size;

      const checksumLine = outputLines.find((line) => line.includes("SHA256:"));
      checksum = checksumLine?.match(/SHA256:\s*(\w+)/)?.[1] || "";
    }

    // Parse manifest for stats
    const tablesMatch = stdout.match(/Tables:\s*(\d+)/);
    const recordsMatch = stdout.match(/Records:\s*(\d+)/);
    const filesMatch = stdout.match(/Files:\s*(\d+)/);

    // Update backup record with success
    await db
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
      .where(eq(systemBackup.id, backup.id));

    // Update schedule success count
    await db
      .update(backupSchedule)
      .set({
        lastRunAt: new Date(),
        successCount: (schedule.successCount || 0) + 1,
      })
      .where(eq(backupSchedule.id, schedule.id));

    console.log(
      `[BackupScheduler] Backup completed: ${backupName} (${formatFileSize(fileSize)})`
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    // Update backup record with failure
    await db
      .update(systemBackup)
      .set({
        status: "failed",
        errorMessage,
        completedAt: new Date(),
      })
      .where(eq(systemBackup.id, backup.id));

    // Update schedule failure count
    await db
      .update(backupSchedule)
      .set({
        lastRunAt: new Date(),
        failureCount: (schedule.failureCount || 0) + 1,
      })
      .where(eq(backupSchedule.id, schedule.id));

    console.error(`[BackupScheduler] Backup failed: ${backupName}`, error);
  }
}

async function applyRetentionPolicy(
  schedule: typeof backupSchedule.$inferSelect
): Promise<void> {
  if (!schedule.retentionDays || schedule.retentionDays <= 0) {
    return;
  }

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - schedule.retentionDays);

  // Find old backups from this schedule
  const oldBackups = await db
    .select()
    .from(systemBackup)
    .where(
      and(
        eq(systemBackup.type, "scheduled"),
        lte(systemBackup.createdAt, cutoffDate)
      )
    );

  for (const backup of oldBackups) {
    // Only delete if the backup name matches this schedule's pattern
    const scheduleName = schedule.name.toLowerCase().replace(/\s+/g, "-");
    if (!backup.name.includes(scheduleName)) {
      continue;
    }

    // Delete file if exists
    if (backup.filePath && existsSync(backup.filePath)) {
      try {
        await unlink(backup.filePath);
        console.log(
          `[BackupScheduler] Deleted old backup file: ${backup.filePath}`
        );
      } catch {
        console.error(
          `[BackupScheduler] Failed to delete file: ${backup.filePath}`
        );
      }
    }

    // Delete database record
    await db.delete(systemBackup).where(eq(systemBackup.id, backup.id));
    console.log(`[BackupScheduler] Removed old backup record: ${backup.name}`);
  }
}

async function checkAndRunSchedules(): Promise<void> {
  const now = new Date();

  // Get all enabled schedules
  const schedules = await db
    .select()
    .from(backupSchedule)
    .where(eq(backupSchedule.isEnabled, true));

  for (const schedule of schedules) {
    try {
      const cron = parseCronExpression(schedule.cronExpression);
      if (!cron) {
        console.warn(
          `[BackupScheduler] Invalid cron expression for schedule "${schedule.name}": ${schedule.cronExpression}`
        );
        continue;
      }

      // Check if it's time to run
      if (shouldRunNow(cron, now)) {
        // Ensure we don't run multiple times in the same minute
        if (schedule.lastRunAt) {
          const lastRun = new Date(schedule.lastRunAt);
          const timeSinceLastRun = now.getTime() - lastRun.getTime();
          if (timeSinceLastRun < 60_000) {
            // Less than a minute since last run
            continue;
          }
        }

        // Run the backup
        await executeBackup(schedule);

        // Apply retention policy
        await applyRetentionPolicy(schedule);
      }

      // Update nextRunAt
      const nextRun = getNextRunTime(cron, now);
      await db
        .update(backupSchedule)
        .set({ nextRunAt: nextRun })
        .where(eq(backupSchedule.id, schedule.id));
    } catch (error) {
      console.error(
        `[BackupScheduler] Error processing schedule "${schedule.name}":`,
        error
      );
    }
  }
}

let schedulerInterval: ReturnType<typeof setInterval> | null = null;

export function startBackupScheduler(): void {
  if (schedulerInterval) {
    console.log("[BackupScheduler] Scheduler already running");
    return;
  }

  console.log(
    `[BackupScheduler] Starting scheduler (checking every ${CHECK_INTERVAL_MS / 1000}s)`
  );

  // Run immediately on startup
  checkAndRunSchedules().catch((error) => {
    console.error("[BackupScheduler] Initial check failed:", error);
  });

  // Then run on interval
  schedulerInterval = setInterval(() => {
    checkAndRunSchedules().catch((error) => {
      console.error("[BackupScheduler] Scheduled check failed:", error);
    });
  }, CHECK_INTERVAL_MS);
}

export function stopBackupScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log("[BackupScheduler] Scheduler stopped");
  }
}

export { parseCronExpression, shouldRunNow, getNextRunTime };
