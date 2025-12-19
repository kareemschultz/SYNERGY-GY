import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  decimal,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { client } from "./clients";
import { businessEnum, staff } from "./core";

// Service category enum (for service_type table)
export const serviceCategoryEnum = pgEnum("service_type_category", [
  "TAX",
  "ACCOUNTING",
  "IMMIGRATION",
  "PARALEGAL",
  "TRAINING",
  "CONSULTING",
  "AUDIT",
  "NIS",
  "REGISTRATION",
  "OTHER",
]);

// Matter status enum
export const matterStatusEnum = pgEnum("matter_status", [
  "NEW",
  "IN_PROGRESS",
  "PENDING_CLIENT",
  "SUBMITTED",
  "COMPLETE",
  "CANCELLED",
]);

// Matter priority enum
export const matterPriorityEnum = pgEnum("matter_priority", [
  "LOW",
  "NORMAL",
  "HIGH",
  "URGENT",
]);

// Matter link type enum
export const matterLinkTypeEnum = pgEnum("matter_link_type", [
  "PREREQUISITE",
  "RELATED",
  "DEPENDENT",
]);

// Recurrence pattern enum for services
export const recurrencePatternEnum = pgEnum("recurrence_pattern", [
  "MONTHLY",
  "QUARTERLY",
  "SEMI_ANNUALLY",
  "ANNUALLY",
]);

// Service type definitions (the catalog of services offered)
export const serviceType = pgTable(
  "service_type",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    business: businessEnum("business").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    category: serviceCategoryEnum("category").notNull(),
    defaultChecklistItems: jsonb("default_checklist_items").$type<string[]>(),
    estimatedDays: integer("estimated_days"),
    defaultFee: decimal("default_fee", { precision: 10, scale: 2 }),
    isActive: boolean("is_active").default(true).notNull(),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("service_type_business_idx").on(table.business),
    index("service_type_category_idx").on(table.category),
    index("service_type_is_active_idx").on(table.isActive),
  ]
);

// Main matter/service request table
export const matter = pgTable(
  "matter",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    referenceNumber: text("reference_number").notNull().unique(), // Auto-generated: GCMC-2024-0001

    clientId: text("client_id")
      .notNull()
      .references(() => client.id, { onDelete: "restrict" }),
    serviceTypeId: text("service_type_id")
      .notNull()
      .references(() => serviceType.id, { onDelete: "restrict" }),
    business: businessEnum("business").notNull(),

    title: text("title").notNull(),
    description: text("description"),
    status: matterStatusEnum("status").default("NEW").notNull(),
    priority: matterPriorityEnum("priority").default("NORMAL").notNull(),

    // Dates
    startDate: date("start_date").defaultNow().notNull(),
    dueDate: date("due_date"),
    completedDate: date("completed_date"),

    // Assignment
    assignedStaffId: text("assigned_staff_id").references(() => staff.id, {
      onDelete: "set null",
    }),

    // Billing (basic for Phase 1)
    estimatedFee: decimal("estimated_fee", { precision: 10, scale: 2 }),
    actualFee: decimal("actual_fee", { precision: 10, scale: 2 }),
    isPaid: boolean("is_paid").default(false).notNull(),

    // Tax year (for tax-related matters)
    taxYear: integer("tax_year"),

    // Recurring matter fields
    isRecurring: boolean("is_recurring").default(false).notNull(),
    recurrencePattern: recurrencePatternEnum("recurrence_pattern"),
    nextRecurrenceDate: date("next_recurrence_date"),
    parentMatterId: text("parent_matter_id"), // Link to original matter if this is a recurring instance (self-reference added via alter table)
    recurrenceCount: integer("recurrence_count").default(0), // How many times this has recurred

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
    index("matter_client_id_idx").on(table.clientId),
    index("matter_service_type_id_idx").on(table.serviceTypeId),
    index("matter_business_idx").on(table.business),
    index("matter_status_idx").on(table.status),
    index("matter_assigned_staff_idx").on(table.assignedStaffId),
    index("matter_due_date_idx").on(table.dueDate),
    index("matter_reference_number_idx").on(table.referenceNumber),
    index("matter_is_recurring_idx").on(table.isRecurring),
    index("matter_next_recurrence_date_idx").on(table.nextRecurrenceDate),
    index("matter_parent_matter_id_idx").on(table.parentMatterId),
  ]
);

// Matter checklist items
export const matterChecklist = pgTable(
  "matter_checklist",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    matterId: text("matter_id")
      .notNull()
      .references(() => matter.id, { onDelete: "cascade" }),
    item: text("item").notNull(),
    isCompleted: boolean("is_completed").default(false).notNull(),
    completedAt: timestamp("completed_at"),
    completedById: text("completed_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("matter_checklist_matter_id_idx").on(table.matterId),
    index("matter_checklist_is_completed_idx").on(table.isCompleted),
  ]
);

// Matter notes/updates
export const matterNote = pgTable(
  "matter_note",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    matterId: text("matter_id")
      .notNull()
      .references(() => matter.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    isInternal: boolean("is_internal").default(true).notNull(), // For Phase 2 client portal
    createdById: text("created_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("matter_note_matter_id_idx").on(table.matterId)]
);

// Linked matters (e.g., Work Permit + Tax Clearance)
export const matterLink = pgTable(
  "matter_link",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    matterId: text("matter_id")
      .notNull()
      .references(() => matter.id, { onDelete: "cascade" }),
    linkedMatterId: text("linked_matter_id")
      .notNull()
      .references(() => matter.id, { onDelete: "cascade" }),
    linkType: matterLinkTypeEnum("link_type").default("RELATED").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("matter_link_matter_id_idx").on(table.matterId),
    index("matter_link_linked_matter_id_idx").on(table.linkedMatterId),
  ]
);

// Relations
export const serviceTypeRelations = relations(serviceType, ({ many }) => ({
  matters: many(matter),
}));

export const matterRelations = relations(matter, ({ one, many }) => ({
  client: one(client, {
    fields: [matter.clientId],
    references: [client.id],
  }),
  serviceType: one(serviceType, {
    fields: [matter.serviceTypeId],
    references: [serviceType.id],
  }),
  assignedStaff: one(staff, {
    fields: [matter.assignedStaffId],
    references: [staff.id],
  }),
  createdBy: one(user, {
    fields: [matter.createdById],
    references: [user.id],
  }),
  // Recurring matter relations
  parentMatter: one(matter, {
    fields: [matter.parentMatterId],
    references: [matter.id],
    relationName: "recurringInstances",
  }),
  recurringInstances: many(matter, { relationName: "recurringInstances" }),
  checklist: many(matterChecklist),
  notes: many(matterNote),
  links: many(matterLink, { relationName: "matterLinks" }),
  linkedFrom: many(matterLink, { relationName: "linkedMatterLinks" }),
}));

export const matterChecklistRelations = relations(
  matterChecklist,
  ({ one }) => ({
    matter: one(matter, {
      fields: [matterChecklist.matterId],
      references: [matter.id],
    }),
    completedBy: one(user, {
      fields: [matterChecklist.completedById],
      references: [user.id],
    }),
  })
);

export const matterNoteRelations = relations(matterNote, ({ one }) => ({
  matter: one(matter, {
    fields: [matterNote.matterId],
    references: [matter.id],
  }),
  createdBy: one(user, {
    fields: [matterNote.createdById],
    references: [user.id],
  }),
}));

export const matterLinkRelations = relations(matterLink, ({ one }) => ({
  matter: one(matter, {
    fields: [matterLink.matterId],
    references: [matter.id],
    relationName: "matterLinks",
  }),
  linkedMatter: one(matter, {
    fields: [matterLink.linkedMatterId],
    references: [matter.id],
    relationName: "linkedMatterLinks",
  }),
}));
