import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { client } from "./clients";
import { businessEnum, staff } from "./core";
import { matter } from "./services";

// Deadline type enum
export const deadlineTypeEnum = pgEnum("deadline_type", [
  "FILING", // Tax filings, regulatory filings
  "RENEWAL", // Permit renewals, license renewals
  "PAYMENT", // Payment due dates
  "SUBMISSION", // Document submissions
  "MEETING", // Court dates, client meetings
  "FOLLOWUP", // Follow-up reminders
  "OTHER",
]);

// Recurrence pattern enum
export const recurrencePatternEnum = pgEnum("recurrence_pattern", [
  "NONE",
  "DAILY",
  "WEEKLY",
  "MONTHLY",
  "QUARTERLY",
  "ANNUALLY",
]);

// Deadline priority enum
export const deadlinePriorityEnum = pgEnum("deadline_priority", [
  "LOW",
  "NORMAL",
  "HIGH",
  "URGENT",
]);

// Deadline table
export const deadline = pgTable(
  "deadline",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    title: text("title").notNull(),
    description: text("description"),
    type: deadlineTypeEnum("type").notNull(),

    // Associations (at least one should be provided typically)
    clientId: text("client_id").references(() => client.id, {
      onDelete: "cascade",
    }),
    matterId: text("matter_id").references(() => matter.id, {
      onDelete: "cascade",
    }),

    business: businessEnum("business"),

    // Due date/time
    dueDate: timestamp("due_date").notNull(),

    // Recurrence
    recurrencePattern: recurrencePatternEnum("recurrence_pattern")
      .default("NONE")
      .notNull(),
    recurrenceEndDate: date("recurrence_end_date"),
    // Self-reference for recurring instances - FK constraint added separately
    parentDeadlineId: text("parent_deadline_id"),

    // Assignment
    assignedStaffId: text("assigned_staff_id").references(() => staff.id, {
      onDelete: "set null",
    }),

    // Status
    isCompleted: boolean("is_completed").default(false).notNull(),
    completedAt: timestamp("completed_at"),
    completedById: text("completed_by_id").references(() => user.id, {
      onDelete: "set null",
    }),

    // Priority/urgency (for color coding)
    priority: deadlinePriorityEnum("priority").default("NORMAL").notNull(),

    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdById: text("created_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
  },
  (table) => [
    index("deadline_client_id_idx").on(table.clientId),
    index("deadline_matter_id_idx").on(table.matterId),
    index("deadline_business_idx").on(table.business),
    index("deadline_due_date_idx").on(table.dueDate),
    index("deadline_is_completed_idx").on(table.isCompleted),
    index("deadline_assigned_staff_idx").on(table.assignedStaffId),
    index("deadline_type_idx").on(table.type),
    index("deadline_parent_id_idx").on(table.parentDeadlineId),
  ]
);

// Deadline reminders
export const deadlineReminder = pgTable(
  "deadline_reminder",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    deadlineId: text("deadline_id")
      .notNull()
      .references(() => deadline.id, { onDelete: "cascade" }),
    daysBefore: integer("days_before").notNull(), // 30, 14, 7, 1, 0
    reminderDate: timestamp("reminder_date").notNull(), // Calculated date to send
    isSent: boolean("is_sent").default(false).notNull(),
    sentAt: timestamp("sent_at"),
    recipientEmail: text("recipient_email"), // Override email if different from assigned staff
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("deadline_reminder_deadline_id_idx").on(table.deadlineId),
    index("deadline_reminder_reminder_date_idx").on(table.reminderDate),
    index("deadline_reminder_is_sent_idx").on(table.isSent),
  ]
);

// Relations
export const deadlineRelations = relations(deadline, ({ one, many }) => ({
  client: one(client, {
    fields: [deadline.clientId],
    references: [client.id],
  }),
  matter: one(matter, {
    fields: [deadline.matterId],
    references: [matter.id],
  }),
  assignedStaff: one(staff, {
    fields: [deadline.assignedStaffId],
    references: [staff.id],
  }),
  completedBy: one(user, {
    fields: [deadline.completedById],
    references: [user.id],
    relationName: "completedDeadlines",
  }),
  createdBy: one(user, {
    fields: [deadline.createdById],
    references: [user.id],
    relationName: "createdDeadlines",
  }),
  // Note: parentDeadline self-reference is handled manually in queries
  // to avoid TypeScript circular reference issues
  reminders: many(deadlineReminder),
}));

export const deadlineReminderRelations = relations(
  deadlineReminder,
  ({ one }) => ({
    deadline: one(deadline, {
      fields: [deadlineReminder.deadlineId],
      references: [deadline.id],
    }),
  })
);
