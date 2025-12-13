/**
 * AML/KYC Risk Scoring Utility
 *
 * Implements CFATF-compliant risk assessment for client onboarding.
 * Risk scoring follows a weighted approach across 4 dimensions:
 * - Client Type Risk (0-25 points)
 * - Service Risk (0-25 points)
 * - Geographic Risk (0-25 points)
 * - Transaction Risk (0-25 points)
 *
 * Total Score (0-100) maps to Risk Rating:
 * - LOW: 0-33
 * - MEDIUM: 34-66
 * - HIGH: 67-84
 * - PROHIBITED: 85-100
 */

export type ClientType =
  | "INDIVIDUAL"
  | "SMALL_BUSINESS"
  | "CORPORATION"
  | "NGO"
  | "COOP"
  | "CREDIT_UNION"
  | "FOREIGN_NATIONAL"
  | "INVESTOR";

export type RiskRating = "LOW" | "MEDIUM" | "HIGH" | "PROHIBITED";

export type RiskScoreInput = {
  clientType: ClientType;
  serviceTypes: string[]; // Service codes (e.g., "TAX_RETURN", "IMMIGRATION")
  country: string;
  isPep: boolean; // Is client or any beneficial owner a PEP?
  hasBeneficialOwners: boolean;
  pepCount: number; // Number of PEPs in beneficial ownership structure
  transactionAmount?: number; // Estimated transaction value
  isFirstTimeClient: boolean;
};

export type RiskScoreResult = {
  clientTypeRisk: number; // 0-25
  serviceRisk: number; // 0-25
  geographicRisk: number; // 0-25
  transactionRisk: number; // 0-25
  totalScore: number; // 0-100
  rating: RiskRating;
  requiresEdd: boolean; // Enhanced Due Diligence required
  eddReasons: string[];
};

/**
 * Client Type Risk Scoring (0-25 points)
 *
 * Higher risk for:
 * - Foreign nationals and investors (potential money laundering)
 * - Corporations (complex ownership structures)
 * - NGOs/Credit Unions (potential for abuse)
 */
const CLIENT_TYPE_RISK_MAP: Record<ClientType, number> = {
  INDIVIDUAL: 5,
  SMALL_BUSINESS: 10,
  CORPORATION: 15,
  NGO: 12,
  COOP: 10,
  CREDIT_UNION: 12,
  FOREIGN_NATIONAL: 20,
  INVESTOR: 25,
};

/**
 * Service Risk Scoring (0-25 points)
 *
 * Higher risk for:
 * - Immigration services (potential for fraud)
 * - Business registration (shell companies)
 * - Audit services (complex financial structures)
 */
const SERVICE_RISK_MAP: Record<string, number> = {
  // GCMC Services
  TRAINING: 5,
  CONSULTING: 8,
  PARALEGAL: 10,
  IMMIGRATION: 18,
  BUSINESS_REGISTRATION: 15,
  BUSINESS_PROPOSAL: 15,

  // KAJ Services
  TAX_RETURN: 12,
  COMPLIANCE: 10,
  PAYE: 10,
  FINANCIAL_STATEMENT: 12,
  NIS_SERVICES: 8,
  BOOKKEEPING: 10,
  AUDIT: 15,
};

/**
 * High-risk countries based on FATF lists
 * (This should be updated periodically based on current FATF blacklist/greylist)
 */
const HIGH_RISK_COUNTRIES = [
  // FATF Blacklist (Call for Action)
  "Iran",
  "North Korea",
  "Myanmar",

  // FATF Greylist (Increased Monitoring) - Examples
  "Syria",
  "Yemen",
  "Afghanistan",
  "Pakistan",
  "Uganda",
  "Philippines",
  "Panama",
  "Haiti",
  "Jamaica",
  "South Sudan",
  "Mali",
  "Mozambique",
  "Tanzania",
  "Turkey",
  "Democratic Republic of Congo",
  "Senegal",
];

/**
 * Calculate risk score for a client
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: CFATF-compliant risk scoring requires multiple conditional checks
export function calculateRiskScore(input: RiskScoreInput): RiskScoreResult {
  // 1. Client Type Risk (0-25)
  const clientTypeRisk = CLIENT_TYPE_RISK_MAP[input.clientType] || 10;

  // 2. Service Risk (0-25)
  // Take the maximum risk from selected services
  const maxServiceRisk = Math.max(
    ...input.serviceTypes.map((s) => SERVICE_RISK_MAP[s] || 10),
    5 // Minimum service risk
  );
  const serviceRisk = Math.min(maxServiceRisk, 25);

  // 3. Geographic Risk (0-25)
  let geographicRisk = 5; // Default for Guyana

  if (HIGH_RISK_COUNTRIES.includes(input.country)) {
    geographicRisk = 25;
  } else if (input.country !== "Guyana") {
    // CARICOM or other countries
    geographicRisk = 10;
  }

  // 4. Transaction Risk (0-25)
  let transactionRisk = 0;

  // PEP significantly increases risk
  if (input.isPep) {
    transactionRisk += 15;
  }

  // Multiple PEPs in beneficial ownership
  if (input.pepCount > 1) {
    transactionRisk += 5;
  }

  // High transaction amounts
  if (input.transactionAmount) {
    if (input.transactionAmount > 5_000_000) {
      // GYD 5M+
      transactionRisk += 10;
    } else if (input.transactionAmount > 1_000_000) {
      // GYD 1M+
      transactionRisk += 5;
    }
  }

  // Complex ownership structure
  if (input.hasBeneficialOwners && input.pepCount > 2) {
    transactionRisk += 5;
  }

  transactionRisk = Math.min(transactionRisk, 25);

  // Calculate total score
  const totalScore =
    clientTypeRisk + serviceRisk + geographicRisk + transactionRisk;

  // Determine rating
  let rating: RiskRating;
  if (totalScore >= 85) {
    rating = "PROHIBITED"; // Automatically reject
  } else if (totalScore >= 67) {
    rating = "HIGH";
  } else if (totalScore >= 34) {
    rating = "MEDIUM";
  } else {
    rating = "LOW";
  }

  // Determine if Enhanced Due Diligence (EDD) required
  const eddReasons: string[] = [];
  let requiresEdd = false;

  if (rating === "HIGH" || rating === "PROHIBITED") {
    requiresEdd = true;
    eddReasons.push("High risk rating requires enhanced due diligence");
  }

  if (input.isPep) {
    requiresEdd = true;
    eddReasons.push(
      "Client or beneficial owner is a Politically Exposed Person (PEP)"
    );
  }

  if (HIGH_RISK_COUNTRIES.includes(input.country)) {
    requiresEdd = true;
    eddReasons.push("Client from high-risk geographic jurisdiction");
  }

  if (
    input.clientType === "INVESTOR" &&
    input.transactionAmount &&
    input.transactionAmount > 5_000_000
  ) {
    requiresEdd = true;
    eddReasons.push("Large investment amount exceeds GYD 5,000,000");
  }

  if (input.serviceTypes.includes("IMMIGRATION") && input.isPep) {
    requiresEdd = true;
    eddReasons.push("PEP requesting immigration services");
  }

  // Complex corporate structures
  if (
    input.hasBeneficialOwners &&
    input.pepCount > 2 &&
    input.clientType === "CORPORATION"
  ) {
    requiresEdd = true;
    eddReasons.push(
      "Complex corporate structure with multiple PEPs in ownership"
    );
  }

  return {
    clientTypeRisk,
    serviceRisk,
    geographicRisk,
    transactionRisk,
    totalScore,
    rating,
    requiresEdd,
    eddReasons,
  };
}

/**
 * Calculate next review date based on risk rating
 */
export function calculateNextReviewDate(rating: RiskRating): Date {
  const now = new Date();
  const reviewDate = new Date(now);

  switch (rating) {
    case "LOW":
      // Review every 3 years
      reviewDate.setFullYear(reviewDate.getFullYear() + 3);
      break;
    case "MEDIUM":
      // Review every 2 years
      reviewDate.setFullYear(reviewDate.getFullYear() + 2);
      break;
    case "HIGH":
    case "PROHIBITED":
      // Review annually
      reviewDate.setFullYear(reviewDate.getFullYear() + 1);
      break;
    default:
      // Default to annual review
      reviewDate.setFullYear(reviewDate.getFullYear() + 1);
      break;
  }

  return reviewDate;
}

/**
 * Validate ownership percentage totals
 * Note: Total can exceed 100% due to indirect/beneficial ownership
 */
export function validateOwnershipPercentages(
  owners: Array<{ ownershipPercentage: number }>
): { valid: boolean; totalPercentage: number; warning?: string } {
  const totalPercentage = owners.reduce(
    (sum, owner) => sum + owner.ownershipPercentage,
    0
  );

  // Warn if total is less than 100% (incomplete disclosure)
  if (totalPercentage < 100) {
    return {
      valid: true,
      totalPercentage,
      warning:
        "Total disclosed ownership is less than 100%. Ensure all beneficial owners (25%+ ownership) are disclosed.",
    };
  }

  // Total can exceed 100% due to indirect/beneficial ownership
  return {
    valid: true,
    totalPercentage,
  };
}

/**
 * Check if a person is of legal age (18+) based on date of birth
 */
export function isLegalAge(dateOfBirth: Date): boolean {
  const today = new Date();
  const age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())
  ) {
    return age - 1 >= 18;
  }

  return age >= 18;
}

/**
 * Calculate age from date of birth
 */
export function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  const age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())
  ) {
    return age - 1;
  }

  return age;
}
