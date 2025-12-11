import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth";

/**
 * Tax calculation records
 * Stores calculations performed by users for PAYE, VAT, and NIS
 */
export const taxCalculations = pgTable("tax_calculations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  calculationType: text("calculation_type", {
    enum: ["PAYE", "VAT", "NIS"],
  }).notNull(),
  inputData: jsonb("input_data").notNull(),
  result: jsonb("result").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type TaxCalculation = typeof taxCalculations.$inferSelect;
export type NewTaxCalculation = typeof taxCalculations.$inferInsert;

/**
 * Input types for different calculators
 */
export type PAYEInput = {
  monthlyIncome: number;
  personalAllowance?: number;
  otherDeductions?: number;
};

export type VATInput = {
  amount: number;
  includesVAT: boolean;
};

export type NISInput = {
  monthlyIncome: number;
  contributionType: "employee" | "employer" | "both";
};

/**
 * Result types for different calculators
 */
export type PAYEResult = {
  monthlyIncome: number;
  annualIncome: number;
  personalAllowance: number;
  taxableIncome: number;
  taxOnFirstBracket: number;
  taxOnSecondBracket: number;
  totalTax: number;
  monthlyTax: number;
  netIncome: number;
  effectiveRate: number;
};

export type VATResult = {
  amount: number;
  vatAmount: number;
  totalWithVAT: number;
  totalWithoutVAT: number;
  vatRate: number;
};

export type NISResult = {
  monthlyIncome: number;
  cappedIncome: number;
  employeeContribution: number;
  employerContribution: number;
  totalContribution: number;
  employeeRate: number;
  employerRate: number;
  ceiling: number;
};
