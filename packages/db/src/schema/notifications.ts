import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

/**
 * Notification type enum
 * Defines the different types of notifications that can be generated
 */
export const notificationTypeEnum = pgEnum("notification_type", [
  "ASSIGNMENT", // New matter/task assigned
  "DEADLINE_APPROACHING", // Deadline approaching (7, 3, 1 day warning)
  "DEADLINE_OVERDUE", // Deadline passed
  "DOCUMENT_UPLOADED", // Document uploaded to matter
  "MATTER_STATUS_CHANGE", // Matter status changed
  "INVOICE_CREATED", // New invoice created
  "INVOICE_PAID", // Invoice marked as paid
  "INVOICE_OVERDUE", // Invoice past due date
  "CLIENT_PORTAL_ACTIVITY", // Client portal activity (login, document view)
  "SYSTEM", // System notifications (backup, maintenance)
]);

/**
 * Notification priority enum
 */
export const notificationPriorityEnum = pgEnum("notification_priority", [
  "LOW",
  "NORMAL",
  "HIGH",
  "URGENT",
]);

/**
 * Notification table
 * Stores user notifications for the notification center
 */
export const notification = pgTable(
  "notification",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    // User who receives the notification
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    // Notification content
    type: notificationTypeEnum("type").notNull(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    priority: notificationPriorityEnum("priority").default("NORMAL").notNull(),

    // Optional link to navigate to (e.g., /app/matters/xxx)
    link: text("link"),

    // Related entity IDs for filtering/grouping
    matterId: text("matter_id"),
    clientId: text("client_id"),
    invoiceId: text("invoice_id"),
    documentId: text("document_id"),
    deadlineId: text("deadline_id"),

    // Read status
    readAt: timestamp("read_at"),

    // Dismissal (allows hiding without marking read)
    dismissedAt: timestamp("dismissed_at"),

    // Standard timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("notification_user_id_idx").on(table.userId),
    index("notification_type_idx").on(table.type),
    index("notification_read_at_idx").on(table.readAt),
    index("notification_created_at_idx").on(table.createdAt),
    index("notification_matter_id_idx").on(table.matterId),
    index("notification_client_id_idx").on(table.clientId),
  ]
);

/**
 * Notification preferences table
 * Stores user preferences for which notifications they want to receive
 */
export const notificationPreference = pgTable(
  "notification_preference",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),

    // In-app notification preferences (all default to true)
    enableAssignment: boolean("enable_assignment").default(true).notNull(),
    enableDeadlineApproaching: boolean("enable_deadline_approaching")
      .default(true)
      .notNull(),
    enableDeadlineOverdue: boolean("enable_deadline_overdue")
      .default(true)
      .notNull(),
    enableDocumentUploaded: boolean("enable_document_uploaded")
      .default(true)
      .notNull(),
    enableMatterStatusChange: boolean("enable_matter_status_change")
      .default(true)
      .notNull(),
    enableInvoiceCreated: boolean("enable_invoice_created")
      .default(true)
      .notNull(),
    enableInvoicePaid: boolean("enable_invoice_paid").default(true).notNull(),
    enableInvoiceOverdue: boolean("enable_invoice_overdue")
      .default(true)
      .notNull(),
    enableClientPortalActivity: boolean("enable_client_portal_activity")
      .default(true)
      .notNull(),
    enableSystem: boolean("enable_system").default(true).notNull(),

    // Email notification preferences (default to false for now)
    emailEnabled: boolean("email_enabled").default(false).notNull(),
    emailDigestFrequency: text("email_digest_frequency").default("NEVER"), // NEVER, DAILY, WEEKLY

    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("notification_preference_user_id_idx").on(table.userId)]
);

// Relations
export const notificationRelations = relations(notification, ({ one }) => ({
  user: one(user, {
    fields: [notification.userId],
    references: [user.id],
  }),
}));

export const notificationPreferenceRelations = relations(
  notificationPreference,
  ({ one }) => ({
    user: one(user, {
      fields: [notificationPreference.userId],
      references: [user.id],
    }),
  })
);
