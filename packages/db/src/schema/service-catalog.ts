import { relations } from "drizzle-orm";
import {
  boolean,
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
import { businessEnum } from "./core";

// Service catalog category enum - high-level grouping for service catalog
export const serviceCatalogCategoryEnum = pgEnum("service_catalog_category", [
  // GCMC Categories
  "TRAINING",
  "CONSULTING",
  "PARALEGAL",
  "IMMIGRATION",
  "BUSINESS_PROPOSALS",
  "NETWORKING",
  // KAJ Categories
  "TAX",
  "ACCOUNTING",
  "AUDIT",
  "NIS",
  "COMPLIANCE",
  "FINANCIAL_STATEMENTS",
  // Shared
  "OTHER",
]);

// Pricing tier type enum
export const pricingTierTypeEnum = pgEnum("pricing_tier_type", [
  "FIXED", // Single fixed price
  "RANGE", // Price range (min-max)
  "TIERED", // Multiple tiers (e.g., 2-day vs 5-day training)
  "CUSTOM", // Quote-based pricing
]);

// Service category table - categories of services
export const serviceCategory = pgTable(
  "service_category",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    business: businessEnum("business").notNull(),
    name: text("name").notNull(), // e.g., "TRAININGS", "PARALEGAL SERVICES", "INCOME TAX RETURNS"
    displayName: text("display_name").notNull(), // User-friendly name
    description: text("description"), // Overview of the category
    icon: text("icon"), // Icon name for UI (e.g., "GraduationCap", "FileText", "Calculator")

    // Ordering
    sortOrder: integer("sort_order").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),

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
    index("service_category_business_idx").on(table.business),
    index("service_category_is_active_idx").on(table.isActive),
    index("service_category_sort_order_idx").on(table.sortOrder),
  ]
);

// Service catalog table - individual services with pricing
export const serviceCatalog = pgTable(
  "service_catalog",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    // Category relationship
    categoryId: text("category_id")
      .notNull()
      .references(() => serviceCategory.id, { onDelete: "cascade" }),
    business: businessEnum("business").notNull(),

    // Basic information
    name: text("name").notNull(), // e.g., "Human Resource Management Training"
    displayName: text("display_name").notNull(), // User-friendly name
    description: text("description"), // Detailed description
    shortDescription: text("short_description"), // Brief summary for cards

    // Service details
    targetAudience: text("target_audience"), // Who this service is for
    topicsCovered: jsonb("topics_covered").$type<string[]>(), // Array of topics/areas covered
    documentRequirements: jsonb("document_requirements").$type<string[]>(), // Required documents
    workflow: text("workflow"), // Service workflow/process description
    deliverables: jsonb("deliverables").$type<string[]>(), // What client receives

    // Timing
    typicalDuration: text("typical_duration"), // e.g., "2-5 days", "3-7 business days"
    estimatedDays: integer("estimated_days"), // Numeric estimate for internal use

    // Pricing
    pricingType: pricingTierTypeEnum("pricing_type").default("FIXED").notNull(),

    // Simple pricing (FIXED or RANGE types)
    basePrice: decimal("base_price", { precision: 12, scale: 2 }), // Minimum or fixed price
    maxPrice: decimal("max_price", { precision: 12, scale: 2 }), // Maximum price (for RANGE type)
    currency: text("currency").default("GYD").notNull(), // Currency code

    // Complex pricing (TIERED type) - stored as JSON
    pricingTiers:
      jsonb("pricing_tiers").$type<
        Array<{
          name: string; // e.g., "2 Days", "5 Days", "Corporate Package"
          description?: string;
          price?: number; // Specific price
          minPrice?: number; // Price range min
          maxPrice?: number; // Price range max
          conditions?: string; // e.g., "10+ participants"
        }>
      >(),

    // Additional pricing notes
    pricingNotes: text("pricing_notes"), // e.g., "Urgent processing: +50% premium"
    discountsAvailable: text("discounts_available"), // e.g., "Group discounts available"

    // Government/external fees
    governmentFees: text("government_fees"), // Description of any government fees
    governmentAgencies: jsonb("government_agencies").$type<string[]>(), // Agencies involved

    // Metadata
    isActive: boolean("is_active").default(true).notNull(),
    isFeatured: boolean("is_featured").default(false).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),

    // Tags for search/filtering
    tags: jsonb("tags").$type<string[]>(),

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
    index("service_catalog_category_idx").on(table.categoryId),
    index("service_catalog_business_idx").on(table.business),
    index("service_catalog_is_active_idx").on(table.isActive),
    index("service_catalog_is_featured_idx").on(table.isFeatured),
    index("service_catalog_sort_order_idx").on(table.sortOrder),
  ]
);

// Relations
export const serviceCategoryRelations = relations(
  serviceCategory,
  ({ one, many }) => ({
    services: many(serviceCatalog),
    createdBy: one(user, {
      fields: [serviceCategory.createdById],
      references: [user.id],
    }),
  })
);

export const serviceCatalogRelations = relations(serviceCatalog, ({ one }) => ({
  category: one(serviceCategory, {
    fields: [serviceCatalog.categoryId],
    references: [serviceCategory.id],
  }),
  createdBy: one(user, {
    fields: [serviceCatalog.createdById],
    references: [user.id],
  }),
}));
