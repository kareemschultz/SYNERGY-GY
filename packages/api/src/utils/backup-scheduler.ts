/**
 * Backup Scheduler - Processes scheduled backup jobs
 *
 * Uses a simple interval-based approach that checks every minute
 * for schedules that need to run based on their cron expressions.
 *
 * Uses Node.js backup utility for Docker compatibility.
 */

import { backupSchedule, db, systemBackup } from "@SYNERGY-GY/db";
import { existsSync } from "node:fs";
import { unlink } from "node:fs/promises";
import { and, eq, lte } from "drizzle-orm";

const CHECK_INTERVAL_MS = 60_000; // Check every minute

// Regex patterns (module-level for performance)
const WHITESPACE_REGEX = /\s+/;
const WHITESPACE_GLOBAL_REGEX = /\s+/g;
const TIMESTAMP_CHARS_REGEX = /[:.]/g;

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

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Cron field parser handles wildcards, step values, ranges, and comma-separated lists per cron specification
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
  const parts = expr.trim().split(WHITESPACE_REGEX);
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
  const timestamp = new Date()
    .toISOString()
    .replace(TIMESTAMP_CHARS_REGEX, "-")
    .slice(0, 19);
  const backupName = `scheduled-${schedule.name.toLowerCase().replace(WHITESPACE_GLOBAL_REGEX, "-")}-${timestamp}`;

  // Use the schedule's scope (defaults to "full" for scheduled backups)
  const scope = (schedule.scope ?? "full") as
    | "settings"
    | "data"
    | "database"
    | "full";

  console.log(
    `[BackupScheduler] Starting scheduled backup: ${backupName} (scope: ${scope})`
  );

  // Create backup record with scope
  const [backup] = await db
    .insert(systemBackup)
    .values({
      name: backupName,
      description: `Scheduled backup from "${schedule.name}"`,
      type: "scheduled",
      scope,
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
    // Use Node.js backup utility (works inside Docker containers)
    const { createBackup } = await import("./backup-utility");
    const result = await createBackup(backupName, { scope });

    if (!result.success) {
      throw new Error(result.error ?? "Backup failed");
    }

    // Update backup record with success
    await db
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
      .where(eq(systemBackup.id, backup.id));

    // Update schedule with last backup reference and success count
    await db
      .update(backupSchedule)
      .set({
        lastRunAt: new Date(),
        lastBackupId: backup.id,
        successCount: (schedule.successCount || 0) + 1,
      })
      .where(eq(backupSchedule.id, schedule.id));

    console.log(
      `[BackupScheduler] Backup completed: ${backupName} (${formatFileSize(result.fileSize ?? 0)})`
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
