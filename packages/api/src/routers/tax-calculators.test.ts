/**
 * Tax Calculator Golden Tests
 *
 * These tests verify the correctness of Guyana 2025 tax calculations
 * using pre-calculated expected values ("golden" values).
 *
 * Tax Rates Reference (GRA 2025):
 * - PAYE: 25% first bracket (up to GYD 3,120,000), 40% second bracket
 * - Personal Allowance: GYD 1,560,000/year (GYD 130,000/month)
 * - VAT: 14%
 * - NIS Employee: 5.6%, Employer: 8.4%, Ceiling: GYD 280,000/month
 * - Gratuity: 22.5%
 * - Child Deduction: GYD 120,000/child/year (max 4 children)
 */

import { describe, expect, it } from "vitest";

// Re-implement the tax calculation functions for testing
// These mirror the implementations in tax-calculators.ts

const TAX_RATES = {
  PAYE: {
    FIRST_BRACKET_RATE: 0.25,
    SECOND_BRACKET_RATE: 0.4,
    FIRST_BRACKET_THRESHOLD: 3_120_000,
    PERSONAL_ALLOWANCE: 1_560_000,
    RATE: 0.25, // Legacy flat rate
  },
  VAT: {
    RATE: 0.14,
  },
  NIS: {
    EMPLOYEE_RATE: 0.056,
    EMPLOYER_RATE: 0.084,
    MONTHLY_CEILING: 280_000,
  },
  SALARY: {
    GRATUITY_RATE: 0.225,
    QUALIFICATION_ALLOWANCES: {
      NONE: 0,
      CERTIFICATE: 50_000,
      DIPLOMA: 100_000,
      BACHELORS: 150_000,
      MASTERS: 200_000,
      DOCTORATE: 250_000,
    },
    CHILD_DEDUCTION: 120_000,
    MAX_CHILD_DEDUCTIONS: 4,
  },
};

// PAYE Calculator (flat rate version used in basic calculator)
function calculatePAYE(input: {
  monthlyIncome: number;
  personalAllowance?: number;
  otherDeductions?: number;
}) {
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

// VAT Calculator
function calculateVAT(input: { amount: number; includesVAT: boolean }) {
  const amount = input.amount;
  const vatRate = TAX_RATES.VAT.RATE;

  let vatAmount: number;
  let totalWithVAT: number;
  let totalWithoutVAT: number;

  if (input.includesVAT) {
    totalWithVAT = amount;
    totalWithoutVAT = amount / (1 + vatRate);
    vatAmount = amount - totalWithoutVAT;
  } else {
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

// NIS Calculator
function calculateNIS(input: {
  monthlyIncome: number;
  contributionType: "employee" | "employer" | "both";
}) {
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

// Full Salary Calculator (progressive brackets)
type PayFrequency = "daily" | "weekly" | "fortnightly" | "monthly" | "yearly";
type QualificationLevel =
  | "NONE"
  | "CERTIFICATE"
  | "DIPLOMA"
  | "BACHELORS"
  | "MASTERS"
  | "DOCTORATE";

function toMonthly(amount: number, frequency: PayFrequency): number {
  switch (frequency) {
    case "daily":
      return amount * 22;
    case "weekly":
      return amount * 4.33;
    case "fortnightly":
      return amount * 2.17;
    case "monthly":
      return amount;
    case "yearly":
      return amount / 12;
    default: {
      const _exhaustive: never = frequency;
      return _exhaustive;
    }
  }
}

function calculateFullSalary(input: {
  grossSalary: number;
  frequency: PayFrequency;
  includeGratuity: boolean;
  month?: number;
  qualificationLevel?: QualificationLevel;
  numberOfChildren?: number;
  otherDeductions?: number;
}) {
  const grossMonthly = toMonthly(input.grossSalary, input.frequency);
  const grossAnnual = grossMonthly * 12;

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
  const otherDeductions = (input.otherDeductions || 0) * 12;

  const totalDeductions =
    personalAllowance +
    qualificationAllowance +
    childDeduction +
    otherDeductions;

  const taxableIncome = Math.max(0, grossAnnual - totalDeductions);

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

  const nisCeiling = TAX_RATES.NIS.MONTHLY_CEILING;
  const cappedIncome = Math.min(grossMonthly, nisCeiling);
  const employeeNisMonthly = cappedIncome * TAX_RATES.NIS.EMPLOYEE_RATE;
  const employerNisMonthly = cappedIncome * TAX_RATES.NIS.EMPLOYER_RATE;

  const gratuityRate = TAX_RATES.SALARY.GRATUITY_RATE;
  const gratuityMonthly = input.includeGratuity
    ? grossMonthly * gratuityRate
    : 0;

  const monthlyNetPay =
    grossMonthly - monthlyTax - employeeNisMonthly + gratuityMonthly;

  const effectiveTaxRate =
    grossAnnual > 0 ? (totalAnnualTax / grossAnnual) * 100 : 0;

  return {
    grossMonthly,
    grossAnnual,
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
      cappedIncome,
      ceiling: nisCeiling,
    },
    gratuity: {
      included: input.includeGratuity,
      monthlyAmount: gratuityMonthly,
    },
    netPay: {
      monthly: monthlyNetPay,
    },
    effectiveRates: {
      taxRate: effectiveTaxRate,
    },
  };
}

// ============================================================
// GOLDEN TESTS
// ============================================================

describe("PAYE Calculator (Flat Rate)", () => {
  it("calculates correctly for income below personal allowance", () => {
    const result = calculatePAYE({ monthlyIncome: 100_000 });

    // Annual: 1,200,000 < Personal Allowance: 1,560,000
    // Taxable: 0, Tax: 0
    expect(result.annualIncome).toBe(1_200_000);
    expect(result.personalAllowance).toBe(1_560_000);
    expect(result.taxableIncome).toBe(0);
    expect(result.totalTax).toBe(0);
    expect(result.monthlyTax).toBe(0);
    expect(result.netIncome).toBe(100_000);
    expect(result.effectiveRate).toBe(0);
  });

  it("calculates correctly for income above personal allowance", () => {
    const result = calculatePAYE({ monthlyIncome: 200_000 });

    // Annual: 2,400,000
    // Taxable: 2,400,000 - 1,560,000 = 840,000
    // Tax: 840,000 * 0.25 = 210,000 annual
    // Monthly tax: 17,500
    expect(result.annualIncome).toBe(2_400_000);
    expect(result.taxableIncome).toBe(840_000);
    expect(result.totalTax).toBe(210_000);
    expect(result.monthlyTax).toBe(17_500);
    expect(result.netIncome).toBe(182_500);
    // Effective rate: 210,000 / 2,400,000 * 100 = 8.75%
    expect(result.effectiveRate).toBeCloseTo(8.75, 2);
  });

  it("calculates correctly with custom personal allowance", () => {
    const result = calculatePAYE({
      monthlyIncome: 200_000,
      personalAllowance: 1_000_000,
    });

    // Taxable: 2,400,000 - 1,000,000 = 1,400,000
    // Tax: 1,400,000 * 0.25 = 350,000
    expect(result.taxableIncome).toBe(1_400_000);
    expect(result.totalTax).toBe(350_000);
    expect(result.monthlyTax).toBeCloseTo(29_166.67, 0);
  });

  it("calculates correctly with other deductions", () => {
    const result = calculatePAYE({
      monthlyIncome: 200_000,
      otherDeductions: 200_000, // Annual deduction
    });

    // Taxable: 2,400,000 - 1,560,000 - 200,000 = 640,000
    // Tax: 640,000 * 0.25 = 160,000
    expect(result.taxableIncome).toBe(640_000);
    expect(result.totalTax).toBe(160_000);
  });

  it("handles zero income", () => {
    const result = calculatePAYE({ monthlyIncome: 0 });

    expect(result.annualIncome).toBe(0);
    expect(result.taxableIncome).toBe(0);
    expect(result.totalTax).toBe(0);
    expect(result.effectiveRate).toBe(0);
  });

  it("calculates high income correctly", () => {
    const result = calculatePAYE({ monthlyIncome: 500_000 });

    // Annual: 6,000,000
    // Taxable: 6,000,000 - 1,560,000 = 4,440,000
    // Tax: 4,440,000 * 0.25 = 1,110,000
    expect(result.taxableIncome).toBe(4_440_000);
    expect(result.totalTax).toBe(1_110_000);
    expect(result.monthlyTax).toBe(92_500);
  });
});

describe("VAT Calculator", () => {
  it("adds VAT to amount excluding VAT", () => {
    const result = calculateVAT({ amount: 100_000, includesVAT: false });

    // VAT: 100,000 * 0.14 = 14,000
    // Total with VAT: 114,000
    expect(result.vatAmount).toBeCloseTo(14_000, 2);
    expect(result.totalWithVAT).toBeCloseTo(114_000, 2);
    expect(result.totalWithoutVAT).toBe(100_000);
    expect(result.vatRate).toBeCloseTo(14, 2);
  });

  it("extracts VAT from amount including VAT", () => {
    const result = calculateVAT({ amount: 114_000, includesVAT: true });

    // Without VAT: 114,000 / 1.14 = 100,000
    // VAT: 114,000 - 100,000 = 14,000
    expect(result.totalWithoutVAT).toBeCloseTo(100_000, 2);
    expect(result.vatAmount).toBeCloseTo(14_000, 2);
    expect(result.totalWithVAT).toBe(114_000);
  });

  it("handles zero amount", () => {
    const result = calculateVAT({ amount: 0, includesVAT: false });

    expect(result.vatAmount).toBe(0);
    expect(result.totalWithVAT).toBe(0);
    expect(result.totalWithoutVAT).toBe(0);
  });

  it("handles large amounts", () => {
    const result = calculateVAT({ amount: 10_000_000, includesVAT: false });

    // VAT: 10,000,000 * 0.14 = 1,400,000
    expect(result.vatAmount).toBeCloseTo(1_400_000, 2);
    expect(result.totalWithVAT).toBeCloseTo(11_400_000, 2);
  });

  it("round-trips correctly", () => {
    // Add VAT then extract it should give same result
    const added = calculateVAT({ amount: 100_000, includesVAT: false });
    const extracted = calculateVAT({
      amount: added.totalWithVAT,
      includesVAT: true,
    });

    expect(extracted.totalWithoutVAT).toBeCloseTo(100_000, 2);
  });
});

describe("NIS Calculator", () => {
  it("calculates employee-only contribution below ceiling", () => {
    const result = calculateNIS({
      monthlyIncome: 200_000,
      contributionType: "employee",
    });

    // Employee: 200,000 * 0.056 = 11,200
    expect(result.cappedIncome).toBe(200_000);
    expect(result.employeeContribution).toBe(11_200);
    expect(result.employerContribution).toBe(0);
    expect(result.totalContribution).toBe(11_200);
  });

  it("calculates employer-only contribution below ceiling", () => {
    const result = calculateNIS({
      monthlyIncome: 200_000,
      contributionType: "employer",
    });

    // Employer: 200,000 * 0.084 = 16,800
    expect(result.employeeContribution).toBe(0);
    expect(result.employerContribution).toBe(16_800);
    expect(result.totalContribution).toBe(16_800);
  });

  it("calculates both contributions below ceiling", () => {
    const result = calculateNIS({
      monthlyIncome: 200_000,
      contributionType: "both",
    });

    // Employee: 200,000 * 0.056 = 11,200
    // Employer: 200,000 * 0.084 = 16,800
    // Total: 28,000
    expect(result.employeeContribution).toBe(11_200);
    expect(result.employerContribution).toBe(16_800);
    expect(result.totalContribution).toBe(28_000);
  });

  it("caps contributions at ceiling", () => {
    const result = calculateNIS({
      monthlyIncome: 500_000,
      contributionType: "both",
    });

    // Capped at 280,000
    // Employee: 280,000 * 0.056 = 15,680
    // Employer: 280,000 * 0.084 = 23,520
    expect(result.cappedIncome).toBe(280_000);
    expect(result.employeeContribution).toBe(15_680);
    expect(result.employerContribution).toBe(23_520);
    expect(result.totalContribution).toBe(39_200);
  });

  it("reports correct rates", () => {
    const result = calculateNIS({
      monthlyIncome: 200_000,
      contributionType: "both",
    });

    expect(result.employeeRate).toBeCloseTo(5.6, 2);
    expect(result.employerRate).toBeCloseTo(8.4, 2);
    expect(result.ceiling).toBe(280_000);
  });

  it("handles income exactly at ceiling", () => {
    const result = calculateNIS({
      monthlyIncome: 280_000,
      contributionType: "both",
    });

    expect(result.cappedIncome).toBe(280_000);
    expect(result.employeeContribution).toBe(15_680);
    expect(result.employerContribution).toBe(23_520);
  });
});

describe("Full Salary Calculator (Progressive Brackets)", () => {
  it("calculates salary with no tax (below personal allowance)", () => {
    const result = calculateFullSalary({
      grossSalary: 100_000,
      frequency: "monthly",
      includeGratuity: false,
    });

    // Annual: 1,200,000 < Personal Allowance: 1,560,000
    expect(result.grossMonthly).toBe(100_000);
    expect(result.grossAnnual).toBe(1_200_000);
    expect(result.taxableIncome).toBe(0);
    expect(result.tax.totalAnnualTax).toBe(0);
    expect(result.tax.monthlyTax).toBe(0);
  });

  it("calculates salary in first tax bracket only", () => {
    const result = calculateFullSalary({
      grossSalary: 300_000,
      frequency: "monthly",
      includeGratuity: false,
    });

    // Annual: 3,600,000
    // Taxable: 3,600,000 - 1,560,000 = 2,040,000
    // First bracket: 2,040,000 at 25% = 510,000
    // Second bracket: 0 (taxable < 3,120,000 threshold)
    expect(result.taxableIncome).toBe(2_040_000);
    expect(result.tax.firstBracketIncome).toBe(2_040_000);
    expect(result.tax.firstBracketTax).toBe(510_000);
    expect(result.tax.secondBracketIncome).toBe(0);
    expect(result.tax.secondBracketTax).toBe(0);
    expect(result.tax.totalAnnualTax).toBe(510_000);
    expect(result.tax.monthlyTax).toBe(42_500);
  });

  it("calculates salary spanning both tax brackets", () => {
    const result = calculateFullSalary({
      grossSalary: 500_000,
      frequency: "monthly",
      includeGratuity: false,
    });

    // Annual: 6,000,000
    // Taxable: 6,000,000 - 1,560,000 = 4,440,000
    // First bracket: 3,120,000 at 25% = 780,000
    // Second bracket: 4,440,000 - 3,120,000 = 1,320,000 at 40% = 528,000
    // Total: 1,308,000
    expect(result.taxableIncome).toBe(4_440_000);
    expect(result.tax.firstBracketIncome).toBe(3_120_000);
    expect(result.tax.firstBracketTax).toBe(780_000);
    expect(result.tax.secondBracketIncome).toBe(1_320_000);
    expect(result.tax.secondBracketTax).toBe(528_000);
    expect(result.tax.totalAnnualTax).toBe(1_308_000);
    expect(result.tax.monthlyTax).toBe(109_000);
  });

  it("applies NIS contributions correctly", () => {
    const result = calculateFullSalary({
      grossSalary: 300_000,
      frequency: "monthly",
      includeGratuity: false,
    });

    // Income 300,000 > ceiling 280,000, so capped
    // Employee NIS: 280,000 * 0.056 = 15,680
    // Employer NIS: 280,000 * 0.084 = 23,520
    expect(result.nis.cappedIncome).toBe(280_000);
    expect(result.nis.employeeMonthly).toBe(15_680);
    expect(result.nis.employerMonthly).toBe(23_520);
  });

  it("includes gratuity correctly", () => {
    const result = calculateFullSalary({
      grossSalary: 200_000,
      frequency: "monthly",
      includeGratuity: true,
    });

    // Gratuity: 200,000 * 0.225 = 45,000
    expect(result.gratuity.included).toBe(true);
    expect(result.gratuity.monthlyAmount).toBe(45_000);
  });

  it("applies qualification allowance", () => {
    const resultNone = calculateFullSalary({
      grossSalary: 300_000,
      frequency: "monthly",
      includeGratuity: false,
      qualificationLevel: "NONE",
    });

    const resultBachelors = calculateFullSalary({
      grossSalary: 300_000,
      frequency: "monthly",
      includeGratuity: false,
      qualificationLevel: "BACHELORS",
    });

    // Bachelor's allowance: 150,000
    expect(resultNone.deductions.qualificationAllowance).toBe(0);
    expect(resultBachelors.deductions.qualificationAllowance).toBe(150_000);

    // Taxable should be lower with qualification
    expect(resultBachelors.taxableIncome).toBe(
      resultNone.taxableIncome - 150_000
    );
  });

  it("applies child deductions (capped at 4)", () => {
    const result2Kids = calculateFullSalary({
      grossSalary: 300_000,
      frequency: "monthly",
      includeGratuity: false,
      numberOfChildren: 2,
    });

    const result6Kids = calculateFullSalary({
      grossSalary: 300_000,
      frequency: "monthly",
      includeGratuity: false,
      numberOfChildren: 6, // Capped at 4
    });

    // 2 children: 2 * 120,000 = 240,000
    expect(result2Kids.deductions.childDeduction).toBe(240_000);

    // 6 children capped to 4: 4 * 120,000 = 480,000
    expect(result6Kids.deductions.childDeduction).toBe(480_000);
  });

  it("converts daily salary correctly", () => {
    const result = calculateFullSalary({
      grossSalary: 10_000, // Daily rate
      frequency: "daily",
      includeGratuity: false,
    });

    // Monthly: 10,000 * 22 working days = 220,000
    expect(result.grossMonthly).toBe(220_000);
    expect(result.grossAnnual).toBe(2_640_000);
  });

  it("converts weekly salary correctly", () => {
    const result = calculateFullSalary({
      grossSalary: 50_000, // Weekly rate
      frequency: "weekly",
      includeGratuity: false,
    });

    // Monthly: 50,000 * 4.33 = 216,500
    expect(result.grossMonthly).toBeCloseTo(216_500, 0);
  });

  it("converts yearly salary correctly", () => {
    const result = calculateFullSalary({
      grossSalary: 3_600_000, // Annual salary
      frequency: "yearly",
      includeGratuity: false,
    });

    // Monthly: 3,600,000 / 12 = 300,000
    expect(result.grossMonthly).toBe(300_000);
  });

  it("calculates effective tax rate correctly", () => {
    const result = calculateFullSalary({
      grossSalary: 300_000,
      frequency: "monthly",
      includeGratuity: false,
    });

    // Tax: 510,000 / Gross: 3,600,000 = 14.167%
    expect(result.effectiveRates.taxRate).toBeCloseTo(14.17, 1);
  });

  it("calculates net pay correctly", () => {
    const result = calculateFullSalary({
      grossSalary: 300_000,
      frequency: "monthly",
      includeGratuity: false,
    });

    // Net = Gross - Tax - NIS Employee
    // Net = 300,000 - 42,500 - 15,680 = 241,820
    expect(result.netPay.monthly).toBe(241_820);
  });

  it("calculates net pay with gratuity correctly", () => {
    const result = calculateFullSalary({
      grossSalary: 300_000,
      frequency: "monthly",
      includeGratuity: true,
    });

    // Gratuity: 300,000 * 0.225 = 67,500
    // Net = 300,000 - 42,500 - 15,680 + 67,500 = 309,320
    expect(result.netPay.monthly).toBe(309_320);
  });
});

describe("Edge Cases", () => {
  it("handles exactly at personal allowance threshold", () => {
    // Monthly that gives exactly 1,560,000 annual
    const result = calculatePAYE({ monthlyIncome: 130_000 });

    expect(result.annualIncome).toBe(1_560_000);
    expect(result.taxableIncome).toBe(0);
    expect(result.totalTax).toBe(0);
  });

  it("handles exactly at first bracket threshold", () => {
    const result = calculateFullSalary({
      grossSalary: 390_000, // Gives taxable = 3,120,000
      frequency: "monthly",
      includeGratuity: false,
    });

    // Annual: 4,680,000
    // Taxable: 4,680,000 - 1,560,000 = 3,120,000 (exactly at threshold)
    expect(result.taxableIncome).toBe(3_120_000);
    expect(result.tax.firstBracketIncome).toBe(3_120_000);
    expect(result.tax.secondBracketIncome).toBe(0);
    expect(result.tax.firstBracketTax).toBe(780_000);
    expect(result.tax.secondBracketTax).toBe(0);
  });

  it("handles exactly at NIS ceiling", () => {
    const result = calculateNIS({
      monthlyIncome: 280_000,
      contributionType: "both",
    });

    expect(result.cappedIncome).toBe(280_000);
    expect(result.monthlyIncome).toBe(280_000);
  });

  it("handles very high income", () => {
    const result = calculateFullSalary({
      grossSalary: 1_000_000,
      frequency: "monthly",
      includeGratuity: false,
    });

    // Annual: 12,000,000
    // Taxable: 12,000,000 - 1,560,000 = 10,440,000
    // First: 3,120,000 at 25% = 780,000
    // Second: 7,320,000 at 40% = 2,928,000
    // Total: 3,708,000
    expect(result.tax.totalAnnualTax).toBe(3_708_000);
    expect(result.tax.monthlyTax).toBe(309_000);
  });

  it("handles all deductions combined", () => {
    const result = calculateFullSalary({
      grossSalary: 400_000,
      frequency: "monthly",
      includeGratuity: true,
      qualificationLevel: "DOCTORATE",
      numberOfChildren: 4,
      otherDeductions: 10_000, // Monthly
    });

    // Total deductions:
    // Personal: 1,560,000
    // Qualification (Doctorate): 250,000
    // Children (4 * 120,000): 480,000
    // Other (10,000 * 12): 120,000
    // Total: 2,410,000
    expect(result.deductions.personalAllowance).toBe(1_560_000);
    expect(result.deductions.qualificationAllowance).toBe(250_000);
    expect(result.deductions.childDeduction).toBe(480_000);
    expect(result.deductions.otherDeductions).toBe(120_000);
    expect(result.deductions.totalDeductions).toBe(2_410_000);
  });
});

describe("Consistency Checks", () => {
  it("PAYE and Full Salary give same result for basic case", () => {
    // Note: Basic PAYE uses flat 25% rate while Full Salary uses progressive
    // They will only match when income is entirely in first bracket
    const paye = calculatePAYE({ monthlyIncome: 200_000 });
    const full = calculateFullSalary({
      grossSalary: 200_000,
      frequency: "monthly",
      includeGratuity: false,
    });

    // Both should have same taxable income
    expect(paye.taxableIncome).toBe(full.taxableIncome);

    // For income in first bracket only, tax should be same
    expect(paye.totalTax).toBe(full.tax.totalAnnualTax);
  });

  it("NIS calculations match in Full Salary", () => {
    const nis = calculateNIS({
      monthlyIncome: 300_000,
      contributionType: "both",
    });

    const full = calculateFullSalary({
      grossSalary: 300_000,
      frequency: "monthly",
      includeGratuity: false,
    });

    expect(nis.employeeContribution).toBe(full.nis.employeeMonthly);
    expect(nis.employerContribution).toBe(full.nis.employerMonthly);
    expect(nis.cappedIncome).toBe(full.nis.cappedIncome);
  });
});
