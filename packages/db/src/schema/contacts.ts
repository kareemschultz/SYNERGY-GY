import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { client } from "./clients";
import { document } from "./documents";

// Emergency contact type enum
export const emergencyContactTypeEnum = pgEnum("emergency_contact_type", [
  "EMERGENCY",
  "NEXT_OF_KIN",
]);

// Employment status enum
export const employmentStatusEnum = pgEnum("employment_status", [
  "EMPLOYED",
  "SELF_EMPLOYED",
  "UNEMPLOYED",
  "RETIRED",
  "STUDENT",
]);

// Emergency contact table
export const clientEmergencyContact = pgTable(
  "client_emergency_contact",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    clientId: text("client_id")
      .notNull()
      .references(() => client.id, { onDelete: "cascade" }),

    contactType: emergencyContactTypeEnum("contact_type").notNull(),
    name: text("name").notNull(),
    relationship: text("relationship").notNull(), // "SPOUSE", "PARENT", "SIBLING", "CHILD", "FRIEND", "OTHER"
    phone: text("phone").notNull(),
    alternatePhone: text("alternate_phone"),
    email: text("email"),
    address: text("address"),

    isPrimary: boolean("is_primary").default(false),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("client_emergency_contact_client_id_idx").on(table.clientId),
    index("client_emergency_contact_type_idx").on(table.contactType),
  ]
);

// Employment information table
export const clientEmploymentInfo = pgTable(
  "client_employment_info",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    clientId: text("client_id")
      .notNull()
      .references(() => client.id, { onDelete: "cascade" }),

    employmentStatus: employmentStatusEnum("employment_status").notNull(),

    // For Employed/Self-Employed
    employerName: text("employer_name"),
    jobTitle: text("job_title"),
    industry: text("industry"),
    employmentStartDate: date("employment_start_date"),

    // Income Information
    annualIncome: text("annual_income"), // Store as text to avoid precision issues
    incomeSource: text("income_source").array(), // ["SALARY", "BUSINESS", "INVESTMENTS", "RENTAL", "OTHER"]

    // Contact
    employerAddress: text("employer_address"),
    employerPhone: text("employer_phone"),

    // Verification
    isVerified: boolean("is_verified").default(false),
    verifiedAt: timestamp("verified_at"),
    verificationDocumentId: text("verification_document_id").references(
      () => document.id,
      { onDelete: "set null" }
    ),

    isCurrent: boolean("is_current").default(true), // Track employment history

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("client_employment_info_client_id_idx").on(table.clientId),
    index("client_employment_info_is_current_idx").on(table.isCurrent),
    index("client_employment_info_status_idx").on(table.employmentStatus),
  ]
);

// Relations
export const clientEmergencyContactRelations = relations(
  clientEmergencyContact,
  ({ one }) => ({
    client: one(client, {
      fields: [clientEmergencyContact.clientId],
      references: [client.id],
    }),
  })
);

export const clientEmploymentInfoRelations = relations(
  clientEmploymentInfo,
  ({ one }) => ({
    client: one(client, {
      fields: [clientEmploymentInfo.clientId],
      references: [client.id],
    }),
    verificationDocument: one(document, {
      fields: [clientEmploymentInfo.verificationDocumentId],
      references: [document.id],
    }),
  })
);
