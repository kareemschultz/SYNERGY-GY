import { relations } from "drizzle-orm";
import {
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { staff } from "./core";

// Activity action enum
export const activityActionEnum = pgEnum("activity_action", [
  "CREATE",
  "UPDATE",
  "DELETE",
  "VIEW",
  "LOGIN",
  "LOGOUT",
  "UPLOAD",
  "DOWNLOAD",
  "STATUS_CHANGE",
  "ASSIGN",
  "COMPLETE",
  "ARCHIVE",
]);

// Entity type enum
export const entityTypeEnum = pgEnum("entity_type", [
  "CLIENT",
  "MATTER",
  "DOCUMENT",
  "DEADLINE",
  "STAFF",
  "SERVICE_TYPE",
  "TEMPLATE",
  "COMMUNICATION",
  "NOTE",
  "SESSION",
]);

// Activity log for audit trail
export const activityLog = pgTable(
  "activity_log",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    // Who
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    staffId: text("staff_id").references(() => staff.id, {
      onDelete: "set null",
    }),

    // What
    action: activityActionEnum("action").notNull(),
    entityType: entityTypeEnum("entity_type").notNull(),
    entityId: text("entity_id"),

    // Details
    description: text("description").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(), // Additional context (old values, new values, etc.)

    // When/Where
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("activity_log_user_id_idx").on(table.userId),
    index("activity_log_staff_id_idx").on(table.staffId),
    index("activity_log_action_idx").on(table.action),
    index("activity_log_entity_type_idx").on(table.entityType),
    index("activity_log_entity_id_idx").on(table.entityId),
    index("activity_log_created_at_idx").on(table.createdAt),
  ]
);

// Relations
export const activityLogRelations = relations(activityLog, ({ one }) => ({
  user: one(user, {
    fields: [activityLog.userId],
    references: [user.id],
  }),
  staff: one(staff, {
    fields: [activityLog.staffId],
    references: [staff.id],
  }),
}));
