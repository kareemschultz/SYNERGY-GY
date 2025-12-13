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
import { client } from "./clients";
import { staff } from "./core";
import { document } from "./documents";

// Ownership type enum
export const ownershipTypeEnum = pgEnum("ownership_type", [
  "DIRECT",
  "INDIRECT",
  "BENEFICIAL",
]);

// PEP relationship enum
export const pepRelationshipEnum = pgEnum("pep_relationship", [
  "SELF",
  "FAMILY_MEMBER",
  "CLOSE_ASSOCIATE",
]);

// Risk level enum
export const riskLevelEnum = pgEnum("risk_level", ["LOW", "MEDIUM", "HIGH"]);

// AML risk rating enum (includes PROHIBITED)
export const amlRiskRatingEnum = pgEnum("aml_risk_rating", [
  "LOW",
  "MEDIUM",
  "HIGH",
  "PROHIBITED",
]);

// AML status enum
export const amlStatusEnum = pgEnum("aml_status", [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "UNDER_REVIEW",
]);

// PEP category enum
export const pepCategoryEnum = pgEnum("pep_category", [
  "DOMESTIC",
  "FOREIGN",
  "INTERNATIONAL_ORG",
]);

// Source of funds enum
export const sourceOfFundsEnum = pgEnum("source_of_funds", [
  "EMPLOYMENT",
  "BUSINESS",
  "INHERITANCE",
  "INVESTMENTS",
  "OTHER",
]);

// Beneficial owner table
export const clientBeneficialOwner = pgTable(
  "client_beneficial_owner",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    clientId: text("client_id")
      .notNull()
      .references(() => client.id, { onDelete: "cascade" }),

    // Personal Information
    fullName: text("full_name").notNull(),
    dateOfBirth: date("date_of_birth").notNull(),
    nationality: text("nationality").notNull(),
    nationalId: text("national_id"),
    passportNumber: text("passport_number"),

    // Ownership Details
    ownershipPercentage: integer("ownership_percentage").notNull(), // 1-100
    ownershipType: ownershipTypeEnum("ownership_type").notNull(),
    positionHeld: text("position_held"), // e.g., "Director", "Shareholder", "Trustee"

    // Contact
    address: text("address"),
    email: text("email"),
    phone: text("phone"),

    // PEP Declaration
    isPep: boolean("is_pep").notNull().default(false),
    pepDetails: text("pep_details"), // If PEP, describe position
    pepRelationship: pepRelationshipEnum("pep_relationship"), // SELF, FAMILY_MEMBER, CLOSE_ASSOCIATE

    // Risk Assessment
    riskLevel: riskLevelEnum("risk_level").default("LOW"),
    riskNotes: text("risk_notes"),

    // Verification
    isVerified: boolean("is_verified").default(false),
    verifiedAt: timestamp("verified_at"),
    verifiedById: text("verified_by_id").references(() => staff.id, {
      onDelete: "set null",
    }),
    verificationDocumentId: text("verification_document_id").references(
      () => document.id,
      { onDelete: "set null" }
    ),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("client_beneficial_owner_client_id_idx").on(table.clientId),
    index("client_beneficial_owner_is_pep_idx").on(table.isPep),
    index("client_beneficial_owner_risk_level_idx").on(table.riskLevel),
  ]
);

// AML Assessment table
export const clientAmlAssessment = pgTable(
  "client_aml_assessment",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    clientId: text("client_id")
      .notNull()
      .references(() => client.id, { onDelete: "cascade" }),

    // Assessment Details
    assessmentDate: date("assessment_date").notNull().defaultNow(),
    assessedById: text("assessed_by_id")
      .notNull()
      .references(() => staff.id, { onDelete: "set null" }),

    // Risk Scoring (weighted calculation)
    clientTypeRisk: integer("client_type_risk").notNull().default(0), // 0-25
    serviceRisk: integer("service_risk").notNull().default(0), // 0-25
    geographicRisk: integer("geographic_risk").notNull().default(0), // 0-25
    transactionRisk: integer("transaction_risk").notNull().default(0), // 0-25
    totalRiskScore: integer("total_risk_score").notNull().default(0), // 0-100
    riskRating: amlRiskRatingEnum("risk_rating").notNull(),

    // PEP Status
    isPep: boolean("is_pep").notNull().default(false),
    pepCategory: pepCategoryEnum("pep_category"),
    pepPosition: text("pep_position"),
    pepJurisdiction: text("pep_jurisdiction"),

    // Enhanced Due Diligence (EDD) Triggers
    requiresEdd: boolean("requires_edd").notNull().default(false),
    eddReasons: text("edd_reasons").array(),
    eddCompletedAt: timestamp("edd_completed_at"),

    // Sanctions Screening
    sanctionsScreened: boolean("sanctions_screened").notNull().default(false),
    sanctionsScreenedAt: timestamp("sanctions_screened_at"),
    sanctionsMatch: boolean("sanctions_match").default(false),
    sanctionsDetails: text("sanctions_details"),

    // Source of Funds/Wealth
    sourceOfFunds: sourceOfFundsEnum("source_of_funds"),
    sourceOfFundsDetails: text("source_of_funds_details"),
    sourceOfWealth: text("source_of_wealth"),

    // Approval Status
    status: amlStatusEnum("status").notNull().default("PENDING"),
    approvedById: text("approved_by_id").references(() => staff.id, {
      onDelete: "set null",
    }),
    approvedAt: timestamp("approved_at"),
    rejectionReason: text("rejection_reason"),

    // Next Review
    nextReviewDate: date("next_review_date").notNull(), // LOW: 3 years, MEDIUM: 2 years, HIGH: 1 year

    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("client_aml_assessment_client_id_idx").on(table.clientId),
    index("client_aml_assessment_risk_rating_idx").on(table.riskRating),
    index("client_aml_assessment_status_idx").on(table.status),
    index("client_aml_assessment_next_review_idx").on(table.nextReviewDate),
  ]
);

// Relations
export const clientBeneficialOwnerRelations = relations(
  clientBeneficialOwner,
  ({ one }) => ({
    client: one(client, {
      fields: [clientBeneficialOwner.clientId],
      references: [client.id],
    }),
    verifiedBy: one(staff, {
      fields: [clientBeneficialOwner.verifiedById],
      references: [staff.id],
    }),
    verificationDocument: one(document, {
      fields: [clientBeneficialOwner.verificationDocumentId],
      references: [document.id],
    }),
  })
);

export const clientAmlAssessmentRelations = relations(
  clientAmlAssessment,
  ({ one }) => ({
    client: one(client, {
      fields: [clientAmlAssessment.clientId],
      references: [client.id],
    }),
    assessedBy: one(staff, {
      fields: [clientAmlAssessment.assessedById],
      references: [staff.id],
      relationName: "amlAssessedBy",
    }),
    approvedBy: one(staff, {
      fields: [clientAmlAssessment.approvedById],
      references: [staff.id],
      relationName: "amlApprovedBy",
    }),
  })
);
