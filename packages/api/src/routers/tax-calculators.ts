/**
 * Tax Calculators Router
 *
 * Provides calculators for Guyana tax obligations:
 * - PAYE (Pay As You Earn) income tax
 * - VAT (Value Added Tax)
 * - NIS (National Insurance Scheme)
 *
 * Updated with 2025 tax rates:
 * - Personal allowance: $130,000/month ($1,560,000/year)
 * - Tax rate: 25% (reduced from 28%)
 */

import { db, taxCalculations } from "@SYNERGY-GY/db";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure } from "../index";
import { nanoid } from "../lib/nanoid";

// Type definitions
type PAYEInput = {
  monthlyIncome: number;
  personalAllowance?: number;
  otherDeductions?: number;
};

type PAYEResult = {
  monthlyIncome: number;
  annualIncome: number;
  personalAllowance: number;
  taxableIncome: number;
  totalTax: number;
  monthlyTax: number;
  netIncome: number;
  effectiveRate: number;
};

type VATInput = {
  amount: number;
  includesVAT: boolean;
};

type VATResult = {
  amount: number;
  vatAmount: number;
  totalWithVAT: number;
  totalWithoutVAT: number;
  vatRate: number;
};

type NISInput = {
  monthlyIncome: number;
  contributionType: "employee" | "employer" | "both";
};

type NISResult = {
  monthlyIncome: number;
  cappedIncome: number;
  employeeContribution: number;
  employerContribution: number;
  totalContribution: number;
  employeeRate: number;
  employerRate: number;
  ceiling: number;
};

/**
 * Guyana Tax Rates (2025)
 * Updated with 2025 budget measures
 */
const TAX_RATES = {
  PAYE: {
    RATE: 0.25, // Reduced from 28% to 25%
    PERSONAL_ALLOWANCE: 1_560_000, // GYD per year ($130,000/month)
  },
  VAT: {
    RATE: 0.14, // 14%
  },
  NIS: {
    EMPLOYEE_RATE: 0.056, // 5.6%
    EMPLOYER_RATE: 0.084, // 8.4%
    MONTHLY_CEILING: 1_386_600, // GYD per month
  },
};

/**
 * Calculate PAYE (Pay As You Earn) tax
 */
function calculatePAYE(input: PAYEInput): PAYEResult {
  const monthlyIncome = input.monthlyIncome;
  const annualIncome = monthlyIncome * 12;
  const personalAllowance =
    input.personalAllowance ?? TAX_RATES.PAYE.PERSONAL_ALLOWANCE;
  const otherDeductions = input.otherDeductions ?? 0;

  const taxableIncome = Math.max(
    0,
    annualIncome - personalAllowance - otherDeductions
  );

  const totalTax = taxableIncome * TAX_RATES.PAYE.RATE;
  const monthlyTax = totalTax / 12;
  const netIncome = monthlyIncome - monthlyTax;
  const effectiveRate = annualIncome > 0 ? (totalTax / annualIncome) * 100 : 0;

  return {
    monthlyIncome,
    annualIncome,
    personalAllowance,
    taxableIncome,
    totalTax,
    monthlyTax,
    netIncome,
    effectiveRate,
  };
}

/**
 * Calculate VAT (Value Added Tax)
 */
function calculateVAT(input: VATInput): VATResult {
  const amount = input.amount;
  const vatRate = TAX_RATES.VAT.RATE;

  let vatAmount: number;
  let totalWithVAT: number;
  let totalWithoutVAT: number;

  if (input.includesVAT) {
    // Amount already includes VAT, extract it
    totalWithVAT = amount;
    totalWithoutVAT = amount / (1 + vatRate);
    vatAmount = amount - totalWithoutVAT;
  } else {
    // Amount excludes VAT, add it
    totalWithoutVAT = amount;
    vatAmount = amount * vatRate;
    totalWithVAT = amount + vatAmount;
  }

  return {
    amount,
    vatAmount,
    totalWithVAT,
    totalWithoutVAT,
    vatRate: vatRate * 100,
  };
}

/**
 * Calculate NIS (National Insurance Scheme) contributions
 */
function calculateNIS(input: NISInput): NISResult {
  const monthlyIncome = input.monthlyIncome;
  const ceiling = TAX_RATES.NIS.MONTHLY_CEILING;
  const cappedIncome = Math.min(monthlyIncome, ceiling);

  const employeeRate = TAX_RATES.NIS.EMPLOYEE_RATE;
  const employerRate = TAX_RATES.NIS.EMPLOYER_RATE;

  const employeeContribution =
    input.contributionType === "employer" ? 0 : cappedIncome * employeeRate;
  const employerContribution =
    input.contributionType === "employee" ? 0 : cappedIncome * employerRate;
  const totalContribution = employeeContribution + employerContribution;

  return {
    monthlyIncome,
    cappedIncome,
    employeeContribution,
    employerContribution,
    totalContribution,
    employeeRate: employeeRate * 100,
    employerRate: employerRate * 100,
    ceiling,
  };
}

// Tax Calculators Router (oRPC pattern - plain object with .handler())
export const taxCalculatorsRouter = {
  // Calculate PAYE tax
  calculatePaye: protectedProcedure
    .input(
      z.object({
        monthlyIncome: z.number().min(0),
        personalAllowance: z.number().min(0).optional(),
        otherDeductions: z.number().min(0).optional(),
      })
    )
    .handler(({ input }) => calculatePAYE(input)),

  // Calculate VAT
  calculateVat: protectedProcedure
    .input(
      z.object({
        amount: z.number().min(0),
        includesVAT: z.boolean(),
      })
    )
    .handler(({ input }) => calculateVAT(input)),

  // Calculate NIS contributions
  calculateNis: protectedProcedure
    .input(
      z.object({
        monthlyIncome: z.number().min(0),
        contributionType: z.enum(["employee", "employer", "both"]),
      })
    )
    .handler(({ input }) => calculateNIS(input)),

  // List saved calculations for the current user
  listHistory: protectedProcedure
    .input(
      z.object({
        calculationType: z.enum(["PAYE", "VAT", "NIS"]).optional(),
        limit: z.number().min(1).max(100).optional().default(20),
      })
    )
    .handler(async ({ input, context }) => {
      const userId = context.session?.user?.id;
      if (!userId) {
        throw new Error("User not authenticated");
      }

      const conditions = [eq(taxCalculations.userId, userId)];
      if (input.calculationType) {
        conditions.push(
          eq(taxCalculations.calculationType, input.calculationType)
        );
      }

      const results = await db
        .select()
        .from(taxCalculations)
        .where(and(...conditions))
        .orderBy(desc(taxCalculations.createdAt))
        .limit(input.limit);

      return results;
    }),

  // Save a calculation result
  saveCalculation: protectedProcedure
    .input(
      z.object({
        calculationType: z.enum(["PAYE", "VAT", "NIS"]),
        inputData: z.record(z.string(), z.unknown()),
        result: z.record(z.string(), z.unknown()),
      })
    )
    .handler(async ({ input, context }) => {
      const userId = context.session?.user?.id;
      if (!userId) {
        throw new Error("User not authenticated");
      }

      const [calculation] = await db
        .insert(taxCalculations)
        .values({
          id: nanoid(),
          userId,
          calculationType: input.calculationType,
          inputData: input.inputData,
          result: input.result,
        })
        .returning();

      return calculation;
    }),
};
