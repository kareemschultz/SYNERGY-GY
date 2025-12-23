import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { businessEnum } from "./core";

// Knowledge base item type enum
export const knowledgeBaseTypeEnum = pgEnum("knowledge_base_type", [
  "AGENCY_FORM",
  "LETTER_TEMPLATE",
  "GUIDE",
  "CHECKLIST",
]);

// Knowledge base category enum
export const knowledgeBaseCategoryEnum = pgEnum("knowledge_base_category", [
  "GRA", // Guyana Revenue Authority
  "NIS", // National Insurance Scheme
  "IMMIGRATION", // Ministry of Home Affairs
  "DCRA", // Deeds & Commercial Registries Authority
  "GENERAL",
  "TRAINING",
  "INTERNAL",
]);

// Knowledge base items (forms, templates, guides)
export const knowledgeBaseItem = pgTable(
  "knowledge_base_item",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    // Classification
    type: knowledgeBaseTypeEnum("type").notNull(),
    category: knowledgeBaseCategoryEnum("category").notNull(),
    business: businessEnum("business"), // Null = both GCMC and KAJ

    // Content
    title: text("title").notNull(),
    description: text("description").notNull(),
    shortDescription: text("short_description"),

    // For downloadable forms (PDFs)
    fileName: text("file_name"),
    storagePath: text("storage_path"),
    mimeType: text("mime_type"),
    fileSize: integer("file_size"),

    // For guides/checklists (markdown content)
    content: text("content"),

    // Auto-fill capabilities
    supportsAutoFill: boolean("supports_auto_fill").default(false).notNull(),
    templateId: text("template_id"), // References documentTemplate.id

    // Metadata
    relatedServices: text("related_services")
      .array()
      .default(sql`ARRAY[]::text[]`)
      .notNull(),
    requiredFor: text("required_for")
      .array()
      .default(sql`ARRAY[]::text[]`)
      .notNull(),
    agencyUrl: text("agency_url"),
    governmentFees: text("government_fees"),

    // Auto-download tracking
    directPdfUrl: text("direct_pdf_url"), // Direct link to PDF (when available)
    lastDownloadAttempt: timestamp("last_download_attempt"), // When last attempted
    lastDownloadError: text("last_download_error"), // Error message if failed

    // Access control
    isActive: boolean("is_active").default(true).notNull(),
    isStaffOnly: boolean("is_staff_only").default(true).notNull(),
    isFeatured: boolean("is_featured").default(false).notNull(),

    // Audit
    createdById: text("created_by_id")
      .notNull()
      .references(() => user.id, { onDelete: "set null" }),
    lastUpdatedById: text("last_updated_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    version: integer("version").default(1).notNull(),
  },
  (table) => [
    index("knowledge_base_item_type_idx").on(table.type),
    index("knowledge_base_item_category_idx").on(table.category),
    index("knowledge_base_item_business_idx").on(table.business),
    index("knowledge_base_item_is_active_idx").on(table.isActive),
    index("knowledge_base_item_is_staff_only_idx").on(table.isStaffOnly),
    index("knowledge_base_item_is_featured_idx").on(table.isFeatured),
  ]
);

// Download tracking for KB items
export const knowledgeBaseDownload = pgTable(
  "knowledge_base_download",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    knowledgeBaseItemId: text("knowledge_base_item_id")
      .notNull()
      .references(() => knowledgeBaseItem.id, { onDelete: "cascade" }),

    // Downloaded by (staff or client)
    downloadedById: text("downloaded_by_id").notNull(), // user.id or portalUser.id
    downloadedByType: text("downloaded_by_type", {
      enum: ["STAFF", "CLIENT"],
    }).notNull(),
    clientId: text("client_id"), // For client downloads

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("knowledge_base_download_item_id_idx").on(table.knowledgeBaseItemId),
    index("knowledge_base_download_downloaded_by_idx").on(table.downloadedById),
    index("knowledge_base_download_client_id_idx").on(table.clientId),
  ]
);

// Relations
export const knowledgeBaseItemRelations = relations(
  knowledgeBaseItem,
  ({ one, many }) => ({
    createdBy: one(user, {
      fields: [knowledgeBaseItem.createdById],
      references: [user.id],
      relationName: "knowledgeBaseCreatedBy",
    }),
    lastUpdatedBy: one(user, {
      fields: [knowledgeBaseItem.lastUpdatedById],
      references: [user.id],
      relationName: "knowledgeBaseUpdatedBy",
    }),
    downloads: many(knowledgeBaseDownload),
  })
);

export const knowledgeBaseDownloadRelations = relations(
  knowledgeBaseDownload,
  ({ one }) => ({
    item: one(knowledgeBaseItem, {
      fields: [knowledgeBaseDownload.knowledgeBaseItemId],
      references: [knowledgeBaseItem.id],
    }),
  })
);
