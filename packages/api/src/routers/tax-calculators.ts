/**
 * Tax Calculators Router
 *
 * Provides calculators for Guyana tax obligations:
 * - PAYE (Pay As You Earn) income tax
 * - VAT (Value Added Tax)
 * - NIS (National Insurance Scheme)
 * - Full Salary Calculator (comprehensive payroll)
 *
 * Updated with 2025 tax rates (4-bracket progressive system):
 * - First $780,000: 0% (tax-free threshold)
 * - $780,001 - $1,560,000: 28%
 * - $1,560,001 - $2,340,000: 30%
 * - Over $2,340,000: 40%
 * - NIS ceiling: $280,000/month
 * - VAT: 14%
 *
 * Source: Guyana Revenue Authority (GRA) 2025
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
 * Per GRA Notice - Income Tax (Amendment) Act No. 2 of 2025
 * Effective January 1, 2025
 */
const TAX_RATES = {
  PAYE: {
    // 2025 rates - tax rate reduced from 28% to 25%
    FIRST_BRACKET_RATE: 0.25, // 25% on first $3,120,000 of taxable income
    SECOND_BRACKET_RATE: 0.4, // 40% on income above $3,120,000
    FIRST_BRACKET_THRESHOLD: 3_120_000, // GYD annual threshold (increased from $2,400,000)
    PERSONAL_ALLOWANCE: 1_560_000, // GYD per year ($130,000/month)
    RATE: 0.25, // Legacy - used by basic PAYE calculator
  },
  VAT: {
    RATE: 0.14, // 14%
  },
  NIS: {
    EMPLOYEE_RATE: 0.056, // 5.6%
    EMPLOYER_RATE: 0.084, // 8.4%
    MONTHLY_CEILING: 280_000, // GYD per month (2025 rate)
  },
  SALARY: {
    // Gratuity rates
    GRATUITY_RATE: 0.225, // 22.5%
    // Qualification allowances (annual)
    QUALIFICATION_ALLOWANCES: {
      NONE: 0,
      CERTIFICATE: 50_000,
      DIPLOMA: 100_000,
      BACHELORS: 150_000,
      MASTERS: 200_000,
      DOCTORATE: 250_000,
    } as const,
    // Child deduction per child per year (2025: $10,000/month = $120,000/year)
    CHILD_DEDUCTION: 120_000,
    MAX_CHILD_DEDUCTIONS: 4,
    // Medical/Life Insurance deduction (2025: 10% of gross or $600,000, whichever is less)
    MEDICAL_INSURANCE_CAP: 600_000,
    MEDICAL_INSURANCE_RATE: 0.1, // 10%
    // Overtime exemption (2025: first $50,000/month tax-free)
    OVERTIME_EXEMPTION_MONTHLY: 50_000,
    // Second job exemption (2025: first $50,000/month tax-free)
    SECOND_JOB_EXEMPTION_MONTHLY: 50_000,
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

// ============================================================
// FULL SALARY CALCULATOR (2025 Guyana Tax Rules)
// ============================================================

type PayFrequency = "daily" | "weekly" | "fortnightly" | "monthly" | "yearly";
type QualificationLevel =
  | "NONE"
  | "CERTIFICATE"
  | "DIPLOMA"
  | "BACHELORS"
  | "MASTERS"
  | "DOCTORATE";

type SalaryInput = {
  grossSalary: number;
  frequency: PayFrequency;
  includeGratuity: boolean;
  month?: number; // 1-12 for gratuity calculations (month 6 and 12 are special)
  qualificationLevel?: QualificationLevel;
  numberOfChildren?: number;
  otherDeductions?: number;
  pensionContribution?: number; // Custom pension contribution
};

type SalaryBreakdown = {
  // Input values (normalized to monthly)
  grossMonthly: number;
  grossAnnual: number;
  frequency: PayFrequency;

  // Deductions
  deductions: {
    personalAllowance: number;
    qualificationAllowance: number;
    childDeduction: number;
    otherDeductions: number;
    totalDeductions: number;
  };

  // Taxable income
  taxableIncome: number;

  // Tax breakdown (progressive)
  tax: {
    firstBracketIncome: number;
    firstBracketTax: number;
    secondBracketIncome: number;
    secondBracketTax: number;
    totalAnnualTax: number;
    monthlyTax: number;
  };

  // NIS contributions
  nis: {
    employeeMonthly: number;
    employerMonthly: number;
    employeeAnnual: number;
    employerAnnual: number;
    cappedIncome: number;
    ceiling: number;
  };

  // Gratuity (if applicable)
  gratuity: {
    included: boolean;
    rate: number;
    monthlyAmount: number;
    isSpecialMonth: boolean; // Month 6 or 12
    specialMonthBonus: number;
  };

  // Net pay
  netPay: {
    monthly: number;
    annual: number;
    // Breakdown by frequency
    daily: number;
    weekly: number;
    fortnightly: number;
  };

  // Employer costs
  employerCosts: {
    grossSalary: number;
    nisContribution: number;
    gratuityContribution: number;
    totalMonthlyCost: number;
    totalAnnualCost: number;
  };

  // Effective rates
  effectiveRates: {
    taxRate: number;
    nisRate: number;
    totalDeductionRate: number;
  };
};

/**
 * Convert salary to monthly based on frequency
 */
function toMonthly(amount: number, frequency: PayFrequency): number {
  switch (frequency) {
    case "daily":
      return amount * 22; // Assuming 22 working days per month
    case "weekly":
      return amount * 4.33; // 52 weeks / 12 months
    case "fortnightly":
      return amount * 2.17; // 26 fortnights / 12 months
    case "monthly":
      return amount;
    case "yearly":
      return amount / 12;
    default: {
      // Exhaustive check - TypeScript ensures all PayFrequency values are handled
      const _exhaustive: never = frequency;
      return _exhaustive;
    }
  }
}

/**
 * Convert monthly amount to specified frequency
 */
function fromMonthly(amount: number, frequency: PayFrequency): number {
  switch (frequency) {
    case "daily":
      return amount / 22;
    case "weekly":
      return amount / 4.33;
    case "fortnightly":
      return amount / 2.17;
    case "monthly":
      return amount;
    case "yearly":
      return amount * 12;
    default: {
      // Exhaustive check - TypeScript ensures all PayFrequency values are handled
      const _exhaustive: never = frequency;
      return _exhaustive;
    }
  }
}

/**
 * Calculate Full Salary with all deductions
 * Implements 2025 Guyana tax rules with progressive brackets
 */
function calculateFullSalary(input: SalaryInput): SalaryBreakdown {
  // Normalize to monthly
  const grossMonthly = toMonthly(input.grossSalary, input.frequency);
  const grossAnnual = grossMonthly * 12;

  // Calculate deductions
  const personalAllowance = TAX_RATES.PAYE.PERSONAL_ALLOWANCE;
  const qualificationAllowance =
    TAX_RATES.SALARY.QUALIFICATION_ALLOWANCES[
      input.qualificationLevel || "NONE"
    ];
  const numChildren = Math.min(
    input.numberOfChildren || 0,
    TAX_RATES.SALARY.MAX_CHILD_DEDUCTIONS
  );
  const childDeduction = numChildren * TAX_RATES.SALARY.CHILD_DEDUCTION;
  const otherDeductions = (input.otherDeductions || 0) * 12; // Assume monthly input, convert to annual

  const totalDeductions =
    personalAllowance +
    qualificationAllowance +
    childDeduction +
    otherDeductions;

  // Calculate taxable income
  const taxableIncome = Math.max(0, grossAnnual - totalDeductions);

  // Calculate progressive tax (2025 2-bracket system)
  // Personal allowance: $1,560,000/year ($130,000/month) - tax free
  // First bracket: 25% on taxable income up to $3,120,000
  // Second bracket: 40% on taxable income above $3,120,000
  const firstBracketThreshold = TAX_RATES.PAYE.FIRST_BRACKET_THRESHOLD;
  const firstBracketIncome = Math.min(taxableIncome, firstBracketThreshold);
  const secondBracketIncome = Math.max(
    0,
    taxableIncome - firstBracketThreshold
  );

  const firstBracketTax =
    firstBracketIncome * TAX_RATES.PAYE.FIRST_BRACKET_RATE;
  const secondBracketTax =
    secondBracketIncome * TAX_RATES.PAYE.SECOND_BRACKET_RATE;

  const totalAnnualTax = firstBracketTax + secondBracketTax;
  const monthlyTax = totalAnnualTax / 12;

  // Calculate NIS
  const nisCeiling = TAX_RATES.NIS.MONTHLY_CEILING;
  const cappedIncome = Math.min(grossMonthly, nisCeiling);
  const employeeNisMonthly = cappedIncome * TAX_RATES.NIS.EMPLOYEE_RATE;
  const employerNisMonthly = cappedIncome * TAX_RATES.NIS.EMPLOYER_RATE;

  // Calculate gratuity
  const gratuityRate = TAX_RATES.SALARY.GRATUITY_RATE;
  const gratuityMonthly = input.includeGratuity
    ? grossMonthly * gratuityRate
    : 0;

  // Month 6 and 12 have special gratuity calculations (double payment)
  const currentMonth = input.month || new Date().getMonth() + 1;
  const isSpecialMonth = currentMonth === 6 || currentMonth === 12;
  const specialMonthBonus =
    input.includeGratuity && isSpecialMonth ? gratuityMonthly : 0;

  // Calculate net pay
  const monthlyNetPay =
    grossMonthly - monthlyTax - employeeNisMonthly + gratuityMonthly;
  const annualNetPay = monthlyNetPay * 12;

  // Calculate employer costs
  const totalMonthlyCost =
    grossMonthly +
    employerNisMonthly +
    (input.includeGratuity ? gratuityMonthly : 0);

  // Calculate effective rates
  const effectiveTaxRate =
    grossAnnual > 0 ? (totalAnnualTax / grossAnnual) * 100 : 0;
  const effectiveNisRate =
    grossMonthly > 0 ? (employeeNisMonthly / grossMonthly) * 100 : 0;
  const totalMonthlyDeductions = monthlyTax + employeeNisMonthly;
  const totalDeductionRate =
    grossMonthly > 0 ? (totalMonthlyDeductions / grossMonthly) * 100 : 0;

  return {
    grossMonthly,
    grossAnnual,
    frequency: input.frequency,

    deductions: {
      personalAllowance,
      qualificationAllowance,
      childDeduction,
      otherDeductions,
      totalDeductions,
    },

    taxableIncome,

    tax: {
      firstBracketIncome,
      firstBracketTax,
      secondBracketIncome,
      secondBracketTax,
      totalAnnualTax,
      monthlyTax,
    },

    nis: {
      employeeMonthly: employeeNisMonthly,
      employerMonthly: employerNisMonthly,
      employeeAnnual: employeeNisMonthly * 12,
      employerAnnual: employerNisMonthly * 12,
      cappedIncome,
      ceiling: nisCeiling,
    },

    gratuity: {
      included: input.includeGratuity,
      rate: gratuityRate * 100,
      monthlyAmount: gratuityMonthly,
      isSpecialMonth,
      specialMonthBonus,
    },

    netPay: {
      monthly: monthlyNetPay,
      annual: annualNetPay,
      daily: fromMonthly(monthlyNetPay, "daily"),
      weekly: fromMonthly(monthlyNetPay, "weekly"),
      fortnightly: fromMonthly(monthlyNetPay, "fortnightly"),
    },

    employerCosts: {
      grossSalary: grossMonthly,
      nisContribution: employerNisMonthly,
      gratuityContribution: gratuityMonthly,
      totalMonthlyCost,
      totalAnnualCost: totalMonthlyCost * 12,
    },

    effectiveRates: {
      taxRate: effectiveTaxRate,
      nisRate: effectiveNisRate,
      totalDeductionRate,
    },
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

  // Calculate Full Salary (comprehensive payroll calculator)
  calculateSalary: protectedProcedure
    .input(
      z.object({
        grossSalary: z.number().min(0),
        frequency: z.enum([
          "daily",
          "weekly",
          "fortnightly",
          "monthly",
          "yearly",
        ]),
        includeGratuity: z.boolean(),
        month: z.number().min(1).max(12).optional(),
        qualificationLevel: z
          .enum([
            "NONE",
            "CERTIFICATE",
            "DIPLOMA",
            "BACHELORS",
            "MASTERS",
            "DOCTORATE",
          ])
          .optional(),
        numberOfChildren: z.number().min(0).max(10).optional(),
        otherDeductions: z.number().min(0).optional(),
        pensionContribution: z.number().min(0).optional(),
      })
    )
    .handler(({ input }) => calculateFullSalary(input)),

  // Get tax rates for display
  getTaxRates: protectedProcedure.handler(() => ({
    paye: {
      firstBracketRate: TAX_RATES.PAYE.FIRST_BRACKET_RATE * 100,
      secondBracketRate: TAX_RATES.PAYE.SECOND_BRACKET_RATE * 100,
      firstBracketThreshold: TAX_RATES.PAYE.FIRST_BRACKET_THRESHOLD,
      personalAllowance: TAX_RATES.PAYE.PERSONAL_ALLOWANCE,
    },
    nis: {
      employeeRate: TAX_RATES.NIS.EMPLOYEE_RATE * 100,
      employerRate: TAX_RATES.NIS.EMPLOYER_RATE * 100,
      monthlyCeiling: TAX_RATES.NIS.MONTHLY_CEILING,
    },
    salary: {
      gratuityRate: TAX_RATES.SALARY.GRATUITY_RATE * 100,
      qualificationAllowances: TAX_RATES.SALARY.QUALIFICATION_ALLOWANCES,
      childDeduction: TAX_RATES.SALARY.CHILD_DEDUCTION,
      maxChildDeductions: TAX_RATES.SALARY.MAX_CHILD_DEDUCTIONS,
      medicalInsuranceCap: TAX_RATES.SALARY.MEDICAL_INSURANCE_CAP,
      medicalInsuranceRate: TAX_RATES.SALARY.MEDICAL_INSURANCE_RATE * 100,
      overtimeExemptionMonthly: TAX_RATES.SALARY.OVERTIME_EXEMPTION_MONTHLY,
      secondJobExemptionMonthly: TAX_RATES.SALARY.SECOND_JOB_EXEMPTION_MONTHLY,
    },
    vat: {
      rate: TAX_RATES.VAT.RATE * 100,
    },
  })),

  // List saved calculations for the current user
  listHistory: protectedProcedure
    .input(
      z.object({
        calculationType: z.enum(["PAYE", "VAT", "NIS", "SALARY"]).optional(),
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
        calculationType: z.enum(["PAYE", "VAT", "NIS", "SALARY"]),
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
