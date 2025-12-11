import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

// Business enum - the two companies
export const businessEnum = pgEnum("business", ["GCMC", "KAJ"]);

// Client type enum
export const clientTypeEnum = pgEnum("client_type", [
  "INDIVIDUAL",
  "SMALL_BUSINESS",
  "CORPORATION",
  "NGO",
  "COOP",
  "CREDIT_UNION",
  "FOREIGN_NATIONAL",
  "INVESTOR",
]);

// Staff role enum
export const staffRoleEnum = pgEnum("staff_role", [
  "OWNER",
  "GCMC_MANAGER",
  "KAJ_MANAGER",
  "STAFF_GCMC",
  "STAFF_KAJ",
  "STAFF_BOTH",
  "RECEPTIONIST",
]);

// Staff table - extends user with role and business assignment
export const staff = pgTable(
  "staff",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),
    role: staffRoleEnum("role").notNull(),
    businesses: text("businesses").array().notNull(), // ["GCMC"], ["KAJ"], or ["GCMC", "KAJ"]
    phone: text("phone"),
    jobTitle: text("job_title"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("staff_user_id_idx").on(table.userId)]
);

// Staff relations
export const staffRelations = relations(staff, ({ one }) => ({
  user: one(user, {
    fields: [staff.userId],
    references: [user.id],
  }),
}));
