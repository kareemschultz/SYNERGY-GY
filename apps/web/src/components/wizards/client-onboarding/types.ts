import type { DocumentCategory } from "@/utils/api";

export const CLIENT_TYPES = [
  {
    value: "INDIVIDUAL",
    label: "Individual",
    description: "Personal client for tax, training, or other services",
  },
  {
    value: "SMALL_BUSINESS",
    label: "Small Business",
    description: "Sole proprietorship or small enterprise",
  },
  {
    value: "CORPORATION",
    label: "Corporation",
    description: "Limited liability company or corporation",
  },
  { value: "NGO", label: "NGO", description: "Non-governmental organization" },
  { value: "COOP", label: "Co-operative", description: "Co-operative society" },
  {
    value: "CREDIT_UNION",
    label: "Credit Union",
    description: "Credit union organization",
  },
  {
    value: "FOREIGN_NATIONAL",
    label: "Foreign National",
    description: "Non-Guyanese citizen requiring immigration services",
  },
  {
    value: "INVESTOR",
    label: "Investor",
    description: "Foreign or local investor",
  },
] as const;

export type ClientType = (typeof CLIENT_TYPES)[number]["value"];

export const BUSINESSES = [
  {
    value: "GCMC",
    label: "GCMC",
    description: "Green Crescent Management Consultancy",
    color: "emerald",
  },
  {
    value: "KAJ",
    label: "KAJ",
    description: "Kareem Abdul-Jabar Tax & Accounting",
    color: "blue",
  },
] as const;

export type Business = (typeof BUSINESSES)[number]["value"];

export const GCMC_SERVICES = [
  {
    value: "TRAINING",
    label: "Training Services",
    description: "HR, Customer Relations, Supervisory Management",
  },
  {
    value: "CONSULTING",
    label: "Consulting",
    description: "Business Development, Management Consulting",
  },
  {
    value: "PARALEGAL",
    label: "Paralegal Services",
    description: "Affidavits, Agreements, Wills, Power of Attorney",
  },
  {
    value: "IMMIGRATION",
    label: "Immigration",
    description: "Work Permits, Citizenship, Business Visas",
  },
  {
    value: "BUSINESS_REGISTRATION",
    label: "Business Registration",
    description: "Incorporation, Business Name, Partnerships",
  },
  {
    value: "BUSINESS_PROPOSAL",
    label: "Business Proposals",
    description: "Land Applications, Investment Proposals",
  },
] as const;

export const KAJ_SERVICES = [
  {
    value: "TAX_RETURN",
    label: "Tax Returns",
    description: "Individual, Corporate, Self-Employed",
  },
  {
    value: "COMPLIANCE",
    label: "Compliance Certificates",
    description: "Tender, Work Permit, Land Transfer",
  },
  {
    value: "PAYE",
    label: "PAYE Services",
    description: "PAYE Returns",
  },
  {
    value: "FINANCIAL_STATEMENT",
    label: "Financial Statements",
    description: "Income/Expenditure, Balance Sheets",
  },
  {
    value: "NIS_SERVICES",
    label: "NIS Services",
    description: "Registration, Contributions, Pension",
  },
  {
    value: "BOOKKEEPING",
    label: "Bookkeeping",
    description: "Monthly Bookkeeping, Payroll",
  },
  {
    value: "AUDIT",
    label: "Audit Services",
    description: "NGO & Co-operative Audits",
  },
] as const;

export type GCMCService = (typeof GCMC_SERVICES)[number]["value"];
export type KAJService = (typeof KAJ_SERVICES)[number]["value"];

// Service catalog item from API
export type PricingTier = {
  name: string;
  description?: string;
  price?: number;
  minPrice?: number;
  maxPrice?: number;
  conditions?: string;
};

export type ServiceCatalogItem = {
  id: string;
  displayName: string;
  shortDescription?: string;
  basePrice?: string | null;
  maxPrice?: string | null;
  pricingType: "FIXED" | "RANGE" | "TIERED" | "CUSTOM";
  pricingTiers?: PricingTier[];
  estimatedDays?: number | null;
  typicalDuration?: string | null;
  documentRequirements: string[];
  documentCount: number;
  isFeatured?: boolean;
  // Full details for modal
  description?: string | null;
  targetAudience?: string | null;
  topicsCovered?: string[] | null;
  deliverables?: string[] | null;
  workflow?: string | null;
  pricingNotes?: string | null;
  discountsAvailable?: string | null;
  governmentFees?: string | null;
  governmentAgencies?: string[] | null;
};

export type ServicesByCategory = Record<string, ServiceCatalogItem[]>;

export type ServicesForWizard = {
  GCMC: ServicesByCategory;
  KAJ: ServicesByCategory;
};

export type ClientOnboardingData = {
  // Step 1: Client Type
  clientType: ClientType | "";

  // Step 2: Basic Information
  // Individual fields
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;

  // Business fields
  businessName: string;
  registrationNumber: string;
  incorporationDate: string;

  // Foreign National fields
  passportCountry: string;
  currentLocation: string;

  // Step 3: Contact Information & Preferences
  email: string;
  phone: string;
  alternatePhone: string;
  address: string;
  city: string;
  country: string;
  preferredContactMethod: "EMAIL" | "PHONE" | "WHATSAPP" | "IN_PERSON";
  preferredLanguage: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
  };
  nextOfKin?: {
    name: string;
    relationship: string;
    phone: string;
    address?: string;
  };

  // Step 4: Identification
  tinNumber: string;
  nationalId: string;
  passportNumber: string;
  nisNumber: string;

  // Step 5: Employment & Income (for individuals)
  employment?: {
    status:
      | "EMPLOYED"
      | "SELF_EMPLOYED"
      | "UNEMPLOYED"
      | "RETIRED"
      | "STUDENT"
      | "";
    employerName?: string;
    jobTitle?: string;
    industry?: string;
    employmentStartDate?: string;
    annualIncomeRange?: string;
    incomeSources?: string[];
    employerPhone?: string;
    employerAddress?: string;
    verificationDocument?: File;
  };

  // Step 6: Beneficial Owners (for businesses)
  beneficialOwners: Array<{
    fullName: string;
    dateOfBirth: string;
    nationality: string;
    nationalId?: string;
    passportNumber?: string;
    ownershipPercentage: number;
    ownershipType: "DIRECT" | "INDIRECT" | "BENEFICIAL";
    positionHeld?: string;
    address?: string;
    email?: string;
    phone?: string;
    isPep: boolean;
    pepDetails?: string;
    pepRelationship?: "SELF" | "FAMILY_MEMBER" | "CLOSE_ASSOCIATE";
  }>;

  // Step 7: AML/Compliance
  amlCompliance?: {
    sourceOfFunds:
      | "EMPLOYMENT"
      | "BUSINESS"
      | "INHERITANCE"
      | "INVESTMENTS"
      | "OTHER"
      | "";
    sourceOfFundsDetails?: string;
    isPep: boolean;
    pepCategory?: "DOMESTIC" | "FOREIGN" | "INTERNATIONAL_ORG";
    pepPosition?: string;
    pepJurisdiction?: string;
    sanctionsScreeningConsent: boolean;
  };

  // Step 8: Business Assignment & Services
  businesses: Business[];
  selectedServiceIds: string[]; // Array of service catalog UUIDs

  // Step 9: Notes
  notes: string;

  // Step 10: Documents (optional)
  documents?: {
    files: File[];
    uploads: Array<{
      file: File;
      category: DocumentCategory;
      description: string;
      linkedService?: string; // service code
      linkedRequirement?: string; // requirement name
      issueDate?: string;
      expiryDate?: string;
      documentNumber?: string;
      issuingAuthority?: string;
    }>;
  };
};

export const initialOnboardingData: ClientOnboardingData = {
  clientType: "",
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  nationality: "Guyanese",
  businessName: "",
  registrationNumber: "",
  incorporationDate: "",
  passportCountry: "",
  currentLocation: "",
  email: "",
  phone: "",
  alternatePhone: "",
  address: "",
  city: "",
  country: "Guyana",
  preferredContactMethod: "EMAIL",
  preferredLanguage: "English",
  tinNumber: "",
  nationalId: "",
  passportNumber: "",
  nisNumber: "",
  beneficialOwners: [],
  businesses: [],
  selectedServiceIds: [],
  notes: "",
  documents: {
    files: [],
    uploads: [],
  },
};

export function getDisplayName(data: ClientOnboardingData): string {
  if (
    data.clientType === "INDIVIDUAL" ||
    data.clientType === "FOREIGN_NATIONAL"
  ) {
    return `${data.firstName} ${data.lastName}`.trim();
  }
  return data.businessName || "";
}

export function isIndividualType(type: ClientType | ""): boolean {
  return type === "INDIVIDUAL" || type === "FOREIGN_NATIONAL";
}

export function isBusinessType(type: ClientType | ""): boolean {
  return [
    "SMALL_BUSINESS",
    "CORPORATION",
    "NGO",
    "COOP",
    "CREDIT_UNION",
    "INVESTOR",
  ].includes(type);
}

type OnboardingStep = {
  id: string;
  title: string;
  description?: string;
  isOptional?: boolean;
  validate?: (data: ClientOnboardingData) => Record<string, string> | null;
};

export const onboardingSteps: OnboardingStep[] = [
  {
    id: "client-type",
    title: "Client Type",
    description: "Select the type of client",
    validate: (data: ClientOnboardingData) => {
      if (!data.clientType) {
        return { clientType: "Please select a client type" };
      }
      return null;
    },
  },
  {
    id: "basic-info",
    title: "Basic Information",
    description: "Enter client details",
    validate: (data: ClientOnboardingData) => {
      const errors: Record<string, string> = {};

      if (isIndividualType(data.clientType)) {
        if (!data.firstName) {
          errors.firstName = "First name is required";
        }
        if (!data.lastName) {
          errors.lastName = "Last name is required";
        }
      } else if (isBusinessType(data.clientType) && !data.businessName) {
        errors.businessName = "Business name is required";
      }

      if (data.clientType === "FOREIGN_NATIONAL" && !data.passportCountry) {
        errors.passportCountry = "Passport country is required";
      }

      return Object.keys(errors).length > 0 ? errors : null;
    },
  },
  {
    id: "contact",
    title: "Contact Information",
    description: "How to reach the client",
    validate: (data: ClientOnboardingData) => {
      const errors: Record<string, string> = {};

      if (!(data.phone || data.email)) {
        errors.contact = "Please provide at least a phone number or email";
      }

      if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.email = "Please enter a valid email address";
      }

      return Object.keys(errors).length > 0 ? errors : null;
    },
  },
  {
    id: "identification",
    title: "Identification",
    description: "Tax and ID numbers",
    isOptional: true,
  },
  {
    id: "employment",
    title: "Employment & Income",
    description: "Employment and income information",
    isOptional: false,
    validate: (data: ClientOnboardingData) => {
      // Only required for individuals and foreign nationals
      if (
        !isIndividualType(data.clientType) &&
        data.clientType !== "FOREIGN_NATIONAL"
      ) {
        return null;
      }

      const errors: Record<string, string> = {};

      if (!data.employment?.status) {
        errors.employmentStatus = "Employment status is required";
      }

      return Object.keys(errors).length > 0 ? errors : null;
    },
  },
  {
    id: "beneficial-owners",
    title: "Beneficial Ownership",
    description: "Disclose beneficial owners (25%+ ownership)",
    isOptional: false,
    validate: (data: ClientOnboardingData) => {
      // Only required for business types
      if (!isBusinessType(data.clientType)) {
        return null;
      }

      const errors: Record<string, string> = {};

      // Corporations must have at least one beneficial owner
      if (
        data.clientType === "CORPORATION" &&
        (!data.beneficialOwners || data.beneficialOwners.length === 0)
      ) {
        errors.beneficialOwners =
          "At least one beneficial owner (25%+ ownership) must be disclosed for corporations";
      }

      return Object.keys(errors).length > 0 ? errors : null;
    },
  },
  {
    id: "aml-compliance",
    title: "AML/KYC Compliance",
    description: "Anti-Money Laundering compliance",
    isOptional: false,
    validate: (data: ClientOnboardingData) => {
      const errors: Record<string, string> = {};

      // Source of funds required for all clients
      if (
        !data.amlCompliance?.sourceOfFunds ||
        data.amlCompliance.sourceOfFunds.length === 0
      ) {
        errors.sourceOfFunds = "Please select at least one source of funds";
      }

      // If OTHER is selected, details are required
      if (
        data.amlCompliance?.sourceOfFunds?.includes("OTHER") &&
        !data.amlCompliance.sourceOfFundsDetails
      ) {
        errors.sourceOfFundsDetails =
          "Please provide details about your source of funds";
      }

      // PEP fields required if isPep is true
      if (data.amlCompliance?.isPep) {
        if (!data.amlCompliance.pepCategory) {
          errors.pepCategory = "PEP category is required";
        }
        if (!data.amlCompliance.pepPosition) {
          errors.pepPosition = "Position/title is required for PEPs";
        }
        if (!data.amlCompliance.pepJurisdiction) {
          errors.pepJurisdiction = "Jurisdiction/country is required for PEPs";
        }
      }

      // Sanctions screening consent required
      if (!data.amlCompliance?.sanctionsScreeningConsent) {
        errors.sanctionsScreeningConsent =
          "You must consent to sanctions screening to proceed";
      }

      return Object.keys(errors).length > 0 ? errors : null;
    },
  },
  {
    id: "services",
    title: "Services",
    description: "Select businesses and services",
    validate: (data: ClientOnboardingData) => {
      const errors: Record<string, string> = {};

      if (data.businesses.length === 0) {
        errors.businesses = "Please select at least one business";
      }

      if (!data.selectedServiceIds || data.selectedServiceIds.length === 0) {
        errors.services = "Please select at least one service";
      }

      return Object.keys(errors).length > 0 ? errors : null;
    },
  },
  {
    id: "documents",
    title: "Documents",
    description: "Upload required documents",
    isOptional: true,
  },
  {
    id: "review",
    title: "Review",
    description: "Review and create client",
  },
];

export function getRequiredDocuments(data: ClientOnboardingData): string[] {
  const documents: string[] = [];

  // Universal documents
  documents.push("National ID or Passport");
  documents.push("Proof of Address (utility bill, bank statement)");

  // Based on services selected
  if (data.kajServices.length > 0) {
    documents.push("TIN Certificate");
  }

  if (
    data.kajServices.includes("NIS_SERVICES") ||
    data.kajServices.includes("PAYE")
  ) {
    documents.push("NIS Number/Card");
  }

  if (data.gcmcServices.includes("IMMIGRATION")) {
    documents.push("Valid Passport (all pages)");
    documents.push("Passport Photos (4 copies)");
    documents.push("Police Clearance Certificate");
    documents.push("Medical Certificate");
  }

  if (isBusinessType(data.clientType)) {
    documents.push("Business Registration Certificate");
    if (data.clientType === "CORPORATION") {
      documents.push("Certificate of Incorporation");
      documents.push("Articles of Association");
    }
  }

  return [...new Set(documents)];
}

/**
 * Document category mapping for auto-categorization
 */
export function inferDocumentCategory(documentName: string): DocumentCategory {
  const lower = documentName.toLowerCase();

  // Identification documents
  if (
    lower.includes("passport") ||
    lower.includes("national id") ||
    lower.includes("birth certificate") ||
    lower.includes("id card")
  ) {
    return "IDENTIFICATION";
  }

  // Tax-related documents
  if (
    lower.includes("tin") ||
    lower.includes("tax return") ||
    lower.includes("tax clearance") ||
    lower.includes("paye") ||
    lower.includes("vat")
  ) {
    return "TAX_FILING";
  }

  // NIS documents
  if (lower.includes("nis") || lower.includes("national insurance")) {
    return "NIS";
  }

  // Financial documents
  if (
    lower.includes("bank statement") ||
    lower.includes("financial statement") ||
    lower.includes("income") ||
    lower.includes("expense") ||
    lower.includes("balance sheet")
  ) {
    return "FINANCIAL";
  }

  // Immigration documents
  if (
    lower.includes("police clearance") ||
    lower.includes("medical certificate") ||
    lower.includes("visa") ||
    lower.includes("work permit")
  ) {
    return "IMMIGRATION";
  }

  // Certificates
  if (
    lower.includes("certificate") ||
    lower.includes("diploma") ||
    lower.includes("license")
  ) {
    return "CERTIFICATE";
  }

  // Agreements/Contracts
  if (
    lower.includes("agreement") ||
    lower.includes("contract") ||
    lower.includes("will") ||
    lower.includes("affidavit")
  ) {
    return "AGREEMENT";
  }

  // Correspondence
  if (
    lower.includes("letter") ||
    lower.includes("correspondence") ||
    lower.includes("email")
  ) {
    return "CORRESPONDENCE";
  }

  // Default to OTHER
  return "OTHER";
}

/**
 * Get required documents organized by service
 * Based on document-requirements.md specification
 */
export function getRequiredDocumentsByServices(
  data: ClientOnboardingData
): Record<string, string[]> {
  const requirements: Record<string, string[]> = {};

  // Helper to add requirements
  const addReqs = (service: string, reqs: string[]) => {
    if (!requirements[service]) {
      requirements[service] = [];
    }
    requirements[service].push(...reqs);
  };

  // ==================
  // KAJ Services
  // ==================

  if (data.kajServices.includes("TAX_RETURN")) {
    if (isIndividualType(data.clientType)) {
      addReqs("Individual Tax Returns", [
        "TIN Certificate",
        "National ID",
        "Employment Income Statements (payslips)",
        "Bank Statements (tax year)",
        "Investment Income Proof",
        "Expense Receipts (medical, education)",
        "Previous Year's Assessment",
      ]);
    } else {
      addReqs("Corporate Tax Returns", [
        "Company TIN",
        "Audited Financial Statements",
        "Trial Balance",
        "Bank Statements (fiscal year)",
        "Revenue Documentation (invoices)",
        "Expense Documentation",
        "Asset Register",
        "Depreciation Schedule",
        "Directors' Remuneration Details",
      ]);
    }
  }

  if (data.kajServices.includes("COMPLIANCE")) {
    addReqs("Tax Compliance Certificate", [
      "TIN Certificate",
      "Filed Tax Returns (last 3 years)",
      "Payment Receipts",
      "National ID/Incorporation Certificate",
    ]);
    addReqs("Tender Compliance Certificate", [
      "Tax Clearance Certificate",
      "NIS Compliance Certificate",
      "Company Registration",
      "Audited Financial Statements (last 2 years)",
      "Business License",
    ]);
  }

  if (data.kajServices.includes("PAYE")) {
    addReqs("PAYE Services", [
      "Employer TIN",
      "Employer NIS Number",
      "Employee Earnings Schedule",
      "Previous Month's Schedule",
      "Time Sheets",
    ]);
  }

  if (data.kajServices.includes("NIS_SERVICES")) {
    addReqs("NIS Registration (Employer)", [
      "Company Registration",
      "TIN Certificate",
      "Business Address Proof",
      "Bank Account Details",
      "Employee List",
    ]);
    addReqs("NIS Monthly Contributions", [
      "Employee Earnings Schedule",
      "Previous Month's Schedule",
      "Payment Receipt",
    ]);
  }

  if (data.kajServices.includes("FINANCIAL_STATEMENT")) {
    addReqs("Financial Statements", [
      "Bank Statements (6 months)",
      "Sales Invoices",
      "Purchase Invoices",
      "Payroll Records",
      "Opening Balances",
    ]);
  }

  if (data.kajServices.includes("BOOKKEEPING")) {
    addReqs("Monthly Bookkeeping", [
      "Bank Statements",
      "Sales Invoices",
      "Purchase Invoices/Receipts",
      "Credit Card Statements",
      "Petty Cash Records",
    ]);
  }

  if (data.kajServices.includes("AUDIT")) {
    addReqs("Audit Services", [
      "Financial Statements",
      "Trial Balance",
      "Bank Reconciliations",
      "Asset Register",
      "Minutes of Meetings",
      "Loan Documentation",
    ]);
  }

  // ==================
  // GCMC Services
  // ==================

  if (data.gcmcServices.includes("TRAINING")) {
    addReqs("Training Services", [
      "Participant List",
      "Company Details (for corporate training)",
      "Training Needs Assessment",
    ]);
  }

  if (data.gcmcServices.includes("CONSULTING")) {
    addReqs("Consulting Services", [
      "Business Registration (if existing)",
      "Business Plan (draft)",
      "Financial Projections",
    ]);
  }

  if (data.gcmcServices.includes("PARALEGAL")) {
    addReqs("Paralegal - Affidavits", [
      "National ID/Passport",
      "Supporting Documents (related to affidavit)",
      "Witness Identification",
    ]);
    addReqs("Paralegal - Agreements", [
      "Party Identification Documents",
      "Property Details (for property agreements)",
      "Draft Terms",
    ]);
    addReqs("Paralegal - Wills", [
      "Testator National ID",
      "Asset Inventory",
      "Property Deeds",
      "Beneficiary Details",
      "Witness Information (2 persons)",
    ]);
  }

  if (data.gcmcServices.includes("IMMIGRATION")) {
    addReqs("Work Permit Application", [
      "Valid Passport (all pages, 6+ months validity)",
      "Passport Photos (4 copies)",
      "Police Clearance Certificate (apostilled)",
      "Medical Certificate",
      "Employment Contract",
      "Employer's Company Registration",
      "Employer's TIN/NIS Compliance",
      "Educational Certificates",
      "Professional Qualifications",
      "CV/Resume",
    ]);
    addReqs("Citizenship Application", [
      "Birth Certificate",
      "Marriage/Divorce Certificate (if applicable)",
      "Police Clearance (all countries, 10 years)",
      "Proof of Residence (5+ years)",
      "Employment History (5+ years)",
      "Tax Compliance Certificate",
      "Passport",
      "Photos (6 copies)",
      "Character References (3)",
    ]);
    addReqs("Business Visa Application", [
      "Passport (6+ months validity)",
      "Passport Photos (2 copies)",
      "Business Invitation Letter",
      "Company Registration (applicant)",
      "Company Registration (host in Guyana)",
      "Financial Statements",
      "Bank Statements (6 months)",
      "Travel Itinerary",
      "Return Ticket",
    ]);
  }

  if (data.gcmcServices.includes("BUSINESS_REGISTRATION")) {
    addReqs("Company Incorporation", [
      "Proposed Names (3 options)",
      "Name Search Results",
      "Directors' National IDs",
      "Directors' Address Proof",
      "Registered Office Address Proof",
      "Share Structure Details",
      "Shareholders' IDs",
      "Business Objectives",
    ]);
    addReqs("Business Name Registration", [
      "Proposed Names (3 options)",
      "Name Search Results",
      "Proprietor's National ID",
      "Business Address Proof",
      "Business Type Description",
    ]);
    addReqs("Partnership Registration", [
      "Partnership Agreement",
      "Partners' National IDs",
      "Business Address Proof",
      "Name Search Results",
      "Capital Contributions Details",
    ]);
  }

  if (data.gcmcServices.includes("BUSINESS_PROPOSAL")) {
    addReqs("Business Proposals", [
      "Business Concept/Idea Description",
      "Financial Projections",
      "Market Research Data",
      "Applicant Identification",
      "Property Details (for land proposals)",
    ]);
  }

  // ==================
  // General Client Type Requirements
  // ==================

  if (isBusinessType(data.clientType)) {
    if (!requirements["General Business Documents"]) {
      addReqs("General Business Documents", [
        "Business Registration/Incorporation",
        "TIN Certificate",
        "NIS Employer Number",
      ]);
    }
    if (data.clientType === "CORPORATION") {
      requirements["General Business Documents"]?.push(
        "Certificate of Incorporation",
        "Articles of Association"
      );
    }
    if (data.clientType === "NGO") {
      requirements["General Business Documents"]?.push(
        "NGO Registration Certificate",
        "Constitution/By-Laws"
      );
    }
    if (data.clientType === "COOP" || data.clientType === "CREDIT_UNION") {
      requirements["General Business Documents"]?.push(
        "Co-operative Registration Certificate",
        "By-Laws"
      );
    }
  } else {
    if (!requirements["General Individual Documents"]) {
      addReqs("General Individual Documents", [
        "National ID or Passport",
        "Proof of Address (utility bill, bank statement - within 3 months)",
      ]);
    }
    if (data.clientType === "FOREIGN_NATIONAL") {
      requirements["General Individual Documents"]?.push(
        "Valid Passport",
        "Current Visa/Immigration Status"
      );
    }
  }

  return requirements;
}
