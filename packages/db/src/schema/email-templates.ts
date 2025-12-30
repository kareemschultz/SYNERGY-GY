/**
 * Email Templates Schema
 *
 * Stores customizable email templates for various notification types.
 * Templates support variable placeholders like {{clientName}}, {{portalUrl}}, etc.
 */

import { relations } from "drizzle-orm";
import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";

/**
 * Email template types - matches the email service methods
 */
export const emailTemplateTypeValues = [
  "PORTAL_INVITE",
  "WELCOME",
  "PASSWORD_RESET",
  "STAFF_PASSWORD_SETUP",
  "DOCUMENT_REQUEST",
  "DOCUMENT_UPLOAD_CONFIRMATION",
  "MESSAGE_NOTIFICATION",
  "PORTAL_DOCUMENT_UPLOADED",
  "MATTER_CREATED",
  "DEADLINE_APPROACHING",
  "APPOINTMENT_REMINDER",
  "SCHEDULED_REPORT",
  "BOOKING_CONFIRMATION",
  "INVOICE_CREATED",
  "PAYMENT_RECEIVED",
  "RECURRING_MATTER_CREATED",
  "CUSTOM",
] as const;

export type EmailTemplateType = (typeof emailTemplateTypeValues)[number];

/**
 * Email templates table
 */
export const emailTemplate = pgTable("email_template", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  type: text("type").notNull(), // One of emailTemplateTypeValues
  name: text("name").notNull(),
  description: text("description"),
  subject: text("subject").notNull(),
  htmlContent: text("html_content").notNull(),
  textContent: text("text_content"),
  isActive: boolean("is_active").default(true).notNull(),
  isDefault: boolean("is_default").default(false).notNull(), // System default template
  business: text("business"), // null = applies to all businesses

  // Variables available for this template (comma-separated for display)
  availableVariables: text("available_variables"),

  // Metadata
  createdById: text("created_by_id").references(() => user.id, {
    onDelete: "set null",
  }),
  updatedById: text("updated_by_id").references(() => user.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

/**
 * Email template version history for audit trail
 */
export const emailTemplateVersion = pgTable("email_template_version", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  templateId: text("template_id")
    .notNull()
    .references(() => emailTemplate.id, { onDelete: "cascade" }),
  version: text("version").notNull(), // e.g., "1", "2", etc.
  subject: text("subject").notNull(),
  htmlContent: text("html_content").notNull(),
  textContent: text("text_content"),
  changedById: text("changed_by_id").references(() => user.id, {
    onDelete: "set null",
  }),
  changedAt: timestamp("changed_at", { mode: "date" }).defaultNow().notNull(),
  changeNotes: text("change_notes"),
});

// Relations
export const emailTemplateRelations = relations(emailTemplate, ({ one }) => ({
  createdBy: one(user, {
    fields: [emailTemplate.createdById],
    references: [user.id],
    relationName: "templateCreatedBy",
  }),
  updatedBy: one(user, {
    fields: [emailTemplate.updatedById],
    references: [user.id],
    relationName: "templateUpdatedBy",
  }),
}));

export const emailTemplateVersionRelations = relations(
  emailTemplateVersion,
  ({ one }) => ({
    template: one(emailTemplate, {
      fields: [emailTemplateVersion.templateId],
      references: [emailTemplate.id],
    }),
    changedBy: one(user, {
      fields: [emailTemplateVersion.changedById],
      references: [user.id],
    }),
  })
);

// Type exports
export type EmailTemplate = typeof emailTemplate.$inferSelect;
export type NewEmailTemplate = typeof emailTemplate.$inferInsert;
export type EmailTemplateVersion = typeof emailTemplateVersion.$inferSelect;
