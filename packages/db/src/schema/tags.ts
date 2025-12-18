import { relations } from "drizzle-orm";
import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { businessEnum } from "./core";

// Tags table for document tagging
export const tag = pgTable(
  "tag",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull().unique(),
    color: text("color"), // Hex color like #3B82F6
    business: businessEnum("business"), // NULL means available for both
    createdAt: timestamp("created_at").defaultNow().notNull(),
    createdById: text("created_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
  },
  (table) => [
    index("tag_name_idx").on(table.name),
    index("tag_business_idx").on(table.business),
  ]
);

// Relations
export const tagRelations = relations(tag, ({ one }) => ({
  createdBy: one(user, {
    fields: [tag.createdById],
    references: [user.id],
  }),
}));

// Default tags to seed
export const DEFAULT_TAGS = [
  // Tax & Compliance
  { name: "GRA", color: "#EF4444" },
  { name: "NIS", color: "#F59E0B" },
  { name: "VAT", color: "#10B981" },
  { name: "PAYE", color: "#3B82F6" },
  { name: "Form 2", color: "#6366F1" },
  { name: "Form 5", color: "#8B5CF6" },
  { name: "Form 7B", color: "#EC4899" },
  { name: "Compliance", color: "#14B8A6" },
  { name: "Tax Return", color: "#F97316" },

  // Document Types
  { name: "Financial Statement", color: "#06B6D4" },
  { name: "Contract", color: "#84CC16" },
  { name: "Agreement", color: "#22C55E" },
  { name: "Affidavit", color: "#A855F7" },
  { name: "Power of Attorney", color: "#D946EF" },

  // Immigration
  { name: "Work Permit", color: "#0891B2" },
  { name: "Visa", color: "#7C3AED" },
  { name: "Passport", color: "#DB2777" },

  // Communication
  { name: "Client Correspondence", color: "#0EA5E9" },
  { name: "Internal", color: "#64748B" },
  { name: "Urgent", color: "#DC2626" },
  { name: "Draft", color: "#9CA3AF" },
  { name: "Final", color: "#16A34A" },
] as const;
