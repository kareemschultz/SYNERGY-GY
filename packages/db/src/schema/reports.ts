import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  time,
  timestamp,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

// Report type enum
export const reportTypeEnum = pgEnum("report_type", ["STANDARD", "CUSTOM"]);

// Report category enum
export const reportCategoryEnum = pgEnum("report_category", [
  "CLIENT",
  "MATTER",
  "FINANCIAL",
  "DEADLINE",
  "DOCUMENT",
  "STAFF",
]);

// Report format enum
export const reportFormatEnum = pgEnum("report_format", [
  "PDF",
  "EXCEL",
  "CSV",
]);

// Report execution status enum
export const reportStatusEnum = pgEnum("report_status", [
  "PENDING",
  "RUNNING",
  "COMPLETED",
  "FAILED",
]);

// Schedule frequency enum
export const scheduleFrequencyEnum = pgEnum("schedule_frequency", [
  "DAILY",
  "WEEKLY",
  "MONTHLY",
]);

// Report definition table - stores report configurations
export const reportDefinition = pgTable(
  "report_definition",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    description: text("description"),
    type: reportTypeEnum("type").notNull().default("STANDARD"),
    category: reportCategoryEnum("category").notNull(),
    // For standard reports: the report code (e.g., "CLIENT_SUMMARY", "REVENUE_SUMMARY")
    reportCode: text("report_code").unique(),
    // For custom reports: the query template and configuration
    queryTemplate: text("query_template"),
    parameters: jsonb("parameters"), // Available parameters for the report
    columns: jsonb("columns"), // Column definitions for display
    defaultFilters: jsonb("default_filters"), // Default filter values
    isActive: boolean("is_active").default(true).notNull(),
    createdById: text("created_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("report_definition_type_idx").on(table.type),
    index("report_definition_category_idx").on(table.category),
    index("report_definition_report_code_idx").on(table.reportCode),
  ]
);

// Report execution table - tracks each time a report is run
export const reportExecution = pgTable(
  "report_execution",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    reportId: text("report_id")
      .notNull()
      .references(() => reportDefinition.id, { onDelete: "cascade" }),
    parameters: jsonb("parameters"), // Execution parameters
    filters: jsonb("filters"), // Applied filters
    format: reportFormatEnum("format").notNull().default("PDF"),
    status: reportStatusEnum("status").notNull().default("PENDING"),
    resultPath: text("result_path"), // Path to generated file
    rowCount: integer("row_count"), // Number of rows in result
    executedById: text("executed_by_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    startedAt: timestamp("started_at").defaultNow().notNull(),
    completedAt: timestamp("completed_at"),
    error: text("error"), // Error message if failed
  },
  (table) => [
    index("report_execution_report_id_idx").on(table.reportId),
    index("report_execution_status_idx").on(table.status),
    index("report_execution_user_idx").on(table.executedById),
    index("report_execution_started_at_idx").on(table.startedAt),
  ]
);

// Scheduled report table - for automated report generation
export const scheduledReport = pgTable(
  "scheduled_report",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    reportId: text("report_id")
      .notNull()
      .references(() => reportDefinition.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    parameters: jsonb("parameters"), // Report parameters
    frequency: scheduleFrequencyEnum("frequency").notNull(),
    dayOfWeek: integer("day_of_week"), // 0-6 for weekly
    dayOfMonth: integer("day_of_month"), // 1-31 for monthly
    time: time("time").notNull(), // Execution time
    format: reportFormatEnum("format").notNull().default("PDF"),
    recipients: jsonb("recipients"), // Email recipients array
    isActive: boolean("is_active").default(true).notNull(),
    lastRunAt: timestamp("last_run_at"),
    nextRunAt: timestamp("next_run_at"),
    createdById: text("created_by_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("scheduled_report_report_id_idx").on(table.reportId),
    index("scheduled_report_next_run_idx").on(table.nextRunAt),
    index("scheduled_report_active_idx").on(table.isActive),
  ]
);

// Relations
export const reportDefinitionRelations = relations(
  reportDefinition,
  ({ one, many }) => ({
    createdBy: one(user, {
      fields: [reportDefinition.createdById],
      references: [user.id],
    }),
    executions: many(reportExecution),
    schedules: many(scheduledReport),
  })
);

export const reportExecutionRelations = relations(
  reportExecution,
  ({ one }) => ({
    report: one(reportDefinition, {
      fields: [reportExecution.reportId],
      references: [reportDefinition.id],
    }),
    executedBy: one(user, {
      fields: [reportExecution.executedById],
      references: [user.id],
    }),
  })
);

export const scheduledReportRelations = relations(
  scheduledReport,
  ({ one }) => ({
    report: one(reportDefinition, {
      fields: [scheduledReport.reportId],
      references: [reportDefinition.id],
    }),
    createdBy: one(user, {
      fields: [scheduledReport.createdById],
      references: [user.id],
    }),
  })
);
