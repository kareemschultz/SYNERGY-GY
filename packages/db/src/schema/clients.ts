import { relations } from "drizzle-orm";
import {
  date,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { clientTypeEnum, staff } from "./core";

// Client status enum
export const clientStatusEnum = pgEnum("client_status", [
  "ACTIVE",
  "INACTIVE",
  "ARCHIVED",
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
  "OTHER",
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
