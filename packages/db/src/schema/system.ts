import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

// System backup records
export const systemBackup = pgTable(
  "system_backup",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    description: text("description"),
    // Type of backup: manual, scheduled, pre_update, pre_restore
    type: text("type", {
      enum: ["manual", "scheduled", "pre_update", "pre_restore"],
    })
      .notNull()
      .default("manual"),
    // Status of backup operation
    status: text("status", {
      enum: ["pending", "in_progress", "completed", "failed"],
    })
      .notNull()
      .default("pending"),
    // Local file information
    filePath: text("file_path"),
    fileSize: integer("file_size"),
    checksum: text("checksum"),
    // Cloud sync information
    cloudPath: text("cloud_path"),
    cloudProvider: text("cloud_provider", { enum: ["s3", "r2"] }),
    isCloudSynced: boolean("is_cloud_synced").default(false),
    cloudSyncedAt: timestamp("cloud_synced_at"),
    // Backup statistics
    tableCount: integer("table_count"),
    recordCount: integer("record_count"),
    uploadedFilesCount: integer("uploaded_files_count"),
    uploadedFilesSize: integer("uploaded_files_size"),
    // Version information for restore compatibility
    appVersion: text("app_version"),
    schemaVersion: text("schema_version"),
    // Error handling
    errorMessage: text("error_message"),
    // Timing
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    // Audit
    createdById: text("created_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("system_backup_status_idx").on(table.status),
    index("system_backup_type_idx").on(table.type),
    index("system_backup_created_at_idx").on(table.createdAt),
  ]
);

// Backup schedule configuration
export const backupSchedule = pgTable("backup_schedule", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  // Cron expression for scheduling
  // Examples: "0 2 * * *" (daily at 2am), "0 0 * * 0" (weekly Sunday midnight)
  cronExpression: text("cron_expression").notNull(),
  // Whether schedule is enabled
  isEnabled: boolean("is_enabled").default(true).notNull(),
  // Retention: how many days to keep backups before auto-deleting
  retentionDays: integer("retention_days").default(30).notNull(),
  // Whether to automatically sync to cloud storage
  syncToCloud: boolean("sync_to_cloud").default(false).notNull(),
  // Execution tracking
  lastRunAt: timestamp("last_run_at"),
  nextRunAt: timestamp("next_run_at"),
  lastBackupId: text("last_backup_id").references(() => systemBackup.id, {
    onDelete: "set null",
  }),
  // Statistics
  successCount: integer("success_count").default(0).notNull(),
  failureCount: integer("failure_count").default(0).notNull(),
  // Audit
  createdById: text("created_by_id").references(() => user.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// Relations
export const systemBackupRelations = relations(systemBackup, ({ one }) => ({
  createdBy: one(user, {
    fields: [systemBackup.createdById],
    references: [user.id],
  }),
}));

export const backupScheduleRelations = relations(backupSchedule, ({ one }) => ({
  createdBy: one(user, {
    fields: [backupSchedule.createdById],
    references: [user.id],
  }),
  lastBackup: one(systemBackup, {
    fields: [backupSchedule.lastBackupId],
    references: [systemBackup.id],
  }),
}));
