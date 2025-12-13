import { relations, sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { businessEnum, clientTypeEnum, staff } from "./core";

// Client status enum
export const clientStatusEnum = pgEnum("client_status", [
  "ACTIVE",
  "INACTIVE",
  "ARCHIVED",
]);

// Service selection status
export const serviceSelectionStatusEnum = pgEnum("service_selection_status", [
  "INTERESTED",
  "ACTIVE",
  "COMPLETED",
  "INACTIVE",
]);

// Communication type enum
export const communicationTypeEnum = pgEnum("communication_type", [
  "PHONE",
  "EMAIL",
  "IN_PERSON",
  "LETTER",
  "WHATSAPP",
  "OTHER",
]);

// Communication direction enum
export const communicationDirectionEnum = pgEnum("communication_direction", [
  "INBOUND",
  "OUTBOUND",
]);

// Client link type enum
export const clientLinkTypeEnum = pgEnum("client_link_type", [
  "SPOUSE",
  "PARENT",
  "CHILD",
  "SIBLING",
  "DIRECTOR",
  "SHAREHOLDER",
  "EMPLOYEE",
  "PARTNER",
  "ACCOUNTANT",
  "ATTORNEY",
  "BENEFICIAL_OWNER",
  "TRUSTEE",
  "AUTHORIZED_SIGNATORY",
  "FAMILY_MEMBER",
  "BUSINESS_ASSOCIATE",
  "OTHER",
]);

// Preferred contact method enum
export const preferredContactMethodEnum = pgEnum("preferred_contact_method", [
  "EMAIL",
  "PHONE",
  "WHATSAPP",
  "IN_PERSON",
]);

// Client AML risk rating enum
export const clientAmlRiskRatingEnum = pgEnum("client_aml_risk_rating", [
  "LOW",
  "MEDIUM",
  "HIGH",
]);

// Main client table
export const client = pgTable(
  "client",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    // Basic information
    type: clientTypeEnum("type").notNull(),
    displayName: text("display_name").notNull(), // Primary display name

    // For individuals
    firstName: text("first_name"),
    lastName: text("last_name"),
    dateOfBirth: date("date_of_birth"),
    nationality: text("nationality"),

    // For businesses/organizations
    businessName: text("business_name"),
    registrationNumber: text("registration_number"),
    incorporationDate: date("incorporation_date"),

    // Contact information
    email: text("email"),
    phone: text("phone"),
    alternatePhone: text("alternate_phone"),
    address: text("address"),
    city: text("city"),
    country: text("country").default("Guyana"),

    // Tax/ID information
    tinNumber: text("tin_number"), // Tax Identification Number
    nationalId: text("national_id"),
    passportNumber: text("passport_number"),

    // Communication Preferences
    preferredContactMethod: preferredContactMethodEnum(
      "preferred_contact_method"
    ).default("EMAIL"),
    preferredLanguage: text("preferred_language").default("English"),

    // AML/Risk Flags
    amlRiskRating: clientAmlRiskRatingEnum("aml_risk_rating").default("LOW"),
    isPep: boolean("is_pep").default(false),
    requiresEnhancedDueDiligence: boolean(
      "requires_enhanced_due_diligence"
    ).default(false),

    // Compliance Verification
    graCompliant: boolean("gra_compliant").default(false), // Tax compliance verified
    nisCompliant: boolean("nis_compliant").default(false), // NIS compliance verified
    lastComplianceCheckDate: date("last_compliance_check_date"),

    // Onboarding Completion
    onboardingCompleted: boolean("onboarding_completed").default(false),
    onboardingCompletedAt: timestamp("onboarding_completed_at"),

    // Business relationship
    businesses: text("businesses").array().notNull(), // Which businesses serve this client
    status: clientStatusEnum("status").default("ACTIVE").notNull(),

    // Assignment
    primaryStaffId: text("primary_staff_id").references(() => staff.id, {
      onDelete: "set null",
    }),

    // Notes
    notes: text("notes"),

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
    index("client_type_idx").on(table.type),
    index("client_status_idx").on(table.status),
    index("client_display_name_idx").on(table.displayName),
    index("client_email_idx").on(table.email),
    index("client_tin_idx").on(table.tinNumber),
    index("client_primary_staff_idx").on(table.primaryStaffId),
  ]
);

// Client contacts (multiple contacts per client)
export const clientContact = pgTable(
  "client_contact",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    clientId: text("client_id")
      .notNull()
      .references(() => client.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    relationship: text("relationship"), // e.g., "Spouse", "Director", "Accountant"
    email: text("email"),
    phone: text("phone"),
    isPrimary: text("is_primary").default("false"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("client_contact_client_id_idx").on(table.clientId)]
);

// Family/business links between clients
export const clientLink = pgTable(
  "client_link",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    clientId: text("client_id")
      .notNull()
      .references(() => client.id, { onDelete: "cascade" }),
    linkedClientId: text("linked_client_id")
      .notNull()
      .references(() => client.id, { onDelete: "cascade" }),
    linkType: clientLinkTypeEnum("link_type").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("client_link_client_id_idx").on(table.clientId),
    index("client_link_linked_client_id_idx").on(table.linkedClientId),
  ]
);

// Communication history
export const clientCommunication = pgTable(
  "client_communication",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    clientId: text("client_id")
      .notNull()
      .references(() => client.id, { onDelete: "cascade" }),
    type: communicationTypeEnum("type").notNull(),
    direction: communicationDirectionEnum("direction").notNull(),
    subject: text("subject"),
    summary: text("summary").notNull(),
    staffId: text("staff_id").references(() => staff.id, {
      onDelete: "set null",
    }),
    communicatedAt: timestamp("communicated_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("client_communication_client_id_idx").on(table.clientId),
    index("client_communication_staff_id_idx").on(table.staffId),
    index("client_communication_date_idx").on(table.communicatedAt),
  ]
);

export const clientServiceSelection = pgTable(
  "client_service_selection",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    clientId: text("client_id")
      .notNull()
      .references(() => client.id, { onDelete: "cascade" }),

    business: businessEnum("business").notNull(),
    serviceCode: text("service_code").notNull(),
    serviceName: text("service_name").notNull(),

    requiredDocuments: jsonb("required_documents")
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),

    uploadedDocuments: jsonb("uploaded_documents")
      .$type<
        Array<{
          documentId: string;
          fileName: string;
          uploadedAt: string;
          requirementName: string;
        }>
      >()
      .notNull()
      .default(sql`'[]'::jsonb`),

    status: serviceSelectionStatusEnum("status")
      .notNull()
      .default("INTERESTED"),

    selectedAt: timestamp("selected_at").defaultNow().notNull(),
    activatedAt: timestamp("activated_at"),
    completedAt: timestamp("completed_at"),
    inactivatedAt: timestamp("inactivated_at"),

    notes: text("notes"),
    estimatedCompletionDate: date("estimated_completion_date"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("client_service_selection_client_id_idx").on(table.clientId),
    index("client_service_selection_status_idx").on(table.status),
    index("client_service_selection_business_idx").on(table.business),
    index("client_service_selection_service_code_idx").on(table.serviceCode),
  ]
);

// Relations
export const clientRelations = relations(client, ({ one, many }) => ({
  primaryStaff: one(staff, {
    fields: [client.primaryStaffId],
    references: [staff.id],
  }),
  createdBy: one(user, {
    fields: [client.createdById],
    references: [user.id],
  }),
  contacts: many(clientContact),
  links: many(clientLink, { relationName: "clientLinks" }),
  linkedFrom: many(clientLink, { relationName: "linkedClientLinks" }),
  communications: many(clientCommunication),
  serviceSelections: many(clientServiceSelection),
}));

export const clientContactRelations = relations(clientContact, ({ one }) => ({
  client: one(client, {
    fields: [clientContact.clientId],
    references: [client.id],
  }),
}));

export const clientLinkRelations = relations(clientLink, ({ one }) => ({
  client: one(client, {
    fields: [clientLink.clientId],
    references: [client.id],
    relationName: "clientLinks",
  }),
  linkedClient: one(client, {
    fields: [clientLink.linkedClientId],
    references: [client.id],
    relationName: "linkedClientLinks",
  }),
}));

export const clientCommunicationRelations = relations(
  clientCommunication,
  ({ one }) => ({
    client: one(client, {
      fields: [clientCommunication.clientId],
      references: [client.id],
    }),
    staff: one(staff, {
      fields: [clientCommunication.staffId],
      references: [staff.id],
    }),
  })
);

export const clientServiceSelectionRelations = relations(
  clientServiceSelection,
  ({ one }) => ({
    client: one(client, {
      fields: [clientServiceSelection.clientId],
      references: [client.id],
    }),
  })
);
