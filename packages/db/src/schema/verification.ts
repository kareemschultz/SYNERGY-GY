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
import { staff } from "./core";
import { document } from "./documents";

// Document verification status enum
export const verificationStatusEnum = pgEnum("verification_status", [
  "PENDING",
  "VERIFIED",
  "REJECTED",
  "EXPIRED",
  "REQUIRES_RENEWAL",
]);

// Document verification table
export const documentVerification = pgTable(
  "document_verification",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    documentId: text("document_id")
      .notNull()
      .references(() => document.id, { onDelete: "cascade" }),

    // Verification Status
    verificationStatus: verificationStatusEnum("verification_status")
      .notNull()
      .default("PENDING"),

    verifiedById: text("verified_by_id").references(() => staff.id, {
      onDelete: "set null",
    }),
    verifiedAt: timestamp("verified_at"),
    rejectionReason: text("rejection_reason"),

    // Expiry Tracking
    issueDate: date("issue_date"),
    expiryDate: date("expiry_date"),
    expiryNotificationSent: boolean("expiry_notification_sent").default(false),
    expiryNotificationSentAt: timestamp("expiry_notification_sent_at"),

    // Document Authority/Issuer
    issuingAuthority: text("issuing_authority"), // e.g., "GRA", "Ministry of Home Affairs", "Employer"
    documentNumber: text("document_number"), // Passport #, TIN, License #

    // Renewal Status
    renewalRequired: boolean("renewal_required").default(false),
    renewalReminderDays: integer("renewal_reminder_days").default(30), // Days before expiry to remind

    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("document_verification_document_id_idx").on(table.documentId),
    index("document_verification_status_idx").on(table.verificationStatus),
    index("document_verification_expiry_date_idx").on(table.expiryDate),
  ]
);

// Relations
export const documentVerificationRelations = relations(
  documentVerification,
  ({ one }) => ({
    document: one(document, {
      fields: [documentVerification.documentId],
      references: [document.id],
    }),
    verifiedBy: one(staff, {
      fields: [documentVerification.verifiedById],
      references: [staff.id],
    }),
  })
);
