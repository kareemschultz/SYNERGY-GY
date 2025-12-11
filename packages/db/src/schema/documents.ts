import { relations } from "drizzle-orm";
import {
  boolean,
  date,
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
import { businessEnum } from "./core";
import { matter } from "./services";

// Document category enum
export const documentCategoryEnum = pgEnum("document_category", [
  "IDENTITY",
  "TAX",
  "FINANCIAL",
  "LEGAL",
  "IMMIGRATION",
  "BUSINESS",
  "CORRESPONDENCE",
  "TRAINING",
  "OTHER",
]);

// Document status enum
export const documentStatusEnum = pgEnum("document_status", [
  "PENDING", // Just created, upload in progress
  "ACTIVE", // Normal state
  "ARCHIVED", // Soft deleted
]);

// Document table
export const document = pgTable(
  "document",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    // File information
    fileName: text("file_name").notNull(), // Stored name (UUID-based)
    originalName: text("original_name").notNull(), // Original upload name
    mimeType: text("mime_type").notNull(),
    fileSize: integer("file_size").notNull(), // bytes

    // Storage
    storagePath: text("storage_path").notNull(), // Local path
    cloudBackupPath: text("cloud_backup_path"), // S3/R2 path when backed up
    isBackedUp: boolean("is_backed_up").default(false).notNull(),
    backupedAt: timestamp("backuped_at"),

    // Classification
    category: documentCategoryEnum("category").notNull(),
    description: text("description"),
    tags: text("tags").array(), // Flexible tagging

    // Associations
    clientId: text("client_id").references(() => client.id, {
      onDelete: "set null",
    }),
    matterId: text("matter_id").references(() => matter.id, {
      onDelete: "set null",
    }),

    // Status
    status: documentStatusEnum("status").default("ACTIVE").notNull(),

    // Expiration tracking
    expirationDate: date("expiration_date"),
    expirationNotified: boolean("expiration_notified").default(false),

    // Metadata
    uploadedById: text("uploaded_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    archivedAt: timestamp("archived_at"),
  },
  (table) => [
    index("document_client_id_idx").on(table.clientId),
    index("document_matter_id_idx").on(table.matterId),
    index("document_category_idx").on(table.category),
    index("document_status_idx").on(table.status),
    index("document_expiration_date_idx").on(table.expirationDate),
    index("document_uploaded_by_idx").on(table.uploadedById),
    index("document_is_backed_up_idx").on(table.isBackedUp),
  ]
);

// Document template placeholder definition
interface TemplatePlaceholder {
  key: string;
  label: string;
  type: "text" | "date" | "number" | "currency";
  source?: "client" | "matter" | "custom";
  sourceField?: string;
}

// Document templates
export const documentTemplate = pgTable(
  "document_template",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    description: text("description"),
    category: documentCategoryEnum("category").notNull(),
    business: businessEnum("business"), // null = both businesses
    templatePath: text("template_path").notNull(), // Path to template file
    placeholders: jsonb("placeholders").$type<TemplatePlaceholder[]>(),
    isActive: boolean("is_active").default(true).notNull(),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("document_template_category_idx").on(table.category),
    index("document_template_business_idx").on(table.business),
    index("document_template_is_active_idx").on(table.isActive),
  ]
);

// Relations
export const documentRelations = relations(document, ({ one }) => ({
  client: one(client, {
    fields: [document.clientId],
    references: [client.id],
  }),
  matter: one(matter, {
    fields: [document.matterId],
    references: [matter.id],
  }),
  uploadedBy: one(user, {
    fields: [document.uploadedById],
    references: [user.id],
  }),
}));
