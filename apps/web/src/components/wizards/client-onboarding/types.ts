// DocumentCategory matches the database enum
type DocumentCategory =
  | "IDENTITY"
  | "TAX"
  | "FINANCIAL"
  | "LEGAL"
  | "IMMIGRATION"
  | "BUSINESS"
  | "CORRESPONDENCE"
  | "TRAINING"
  | "OTHER";

// Service Catalog Types for Enhanced Selection

/**
 * Pricing tier for tiered service pricing
 */
export type PricingTier = {
  name: string; // e.g., "Standard (3-day)", "Express (1-day)"
  price?: number; // Fixed price for this tier
  minPrice?: number; // Minimum price (for ranges)
  maxPrice?: number; // Maximum price (for ranges)
  description?: string; // Optional description
};

/**
 * Full service catalog item with all details for wizard
 */
export type ServiceCatalogItem = {
  id: string;
  name: string;
  displayName: string;
  shortDescription: string | null;
  description: string | null; // Maps to "description" in database schema
  business: "GCMC" | "KAJ";
  categoryId: string;
  categoryName?: string;
  categoryDisplayName?: string;

  // Pricing
  pricingType: "FIXED" | "RANGE" | "TIERED" | "CUSTOM";
  basePrice: string | number | null;
  maxPrice: string | number | null;
  pricingTiers: PricingTier[] | null;

  // Details
  estimatedDays: number | null;
  typicalDuration: string | null;
  documentRequirements: string[] | null;
  governmentAgencies: string[] | null;

  // Metadata
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
};

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
    documentRequirements: [],
  },
  {
    value: "CONSULTING",
    label: "Consulting",
    description: "Business Development, Management Consulting",
    documentRequirements: [],
  },
  {
    value: "PARALEGAL",
    label: "Paralegal Services",
    description: "Affidavits, Agreements, Wills, Power of Attorney",
    documentRequirements: [
      "National ID or Passport",
      "Proof of Address",
      "Relevant Supporting Documents",
    ],
  },
  {
    value: "IMMIGRATION",
    label: "Immigration",
    description: "Work Permits, Citizenship, Business Visas",
    documentRequirements: [
      "Valid Passport (6+ months validity)",
      "Passport Photos (4 copies)",
      "Police Clearance Certificate",
      "Medical Certificate",
      "Employment Contract/Letter",
    ],
  },
  {
    value: "BUSINESS_REGISTRATION",
    label: "Business Registration",
    description: "Incorporation, Business Name, Partnerships",
    documentRequirements: [
      "National ID of Directors/Owners",
      "Proof of Address",
      "Draft Articles of Association",
    ],
  },
  {
    value: "BUSINESS_PROPOSAL",
    label: "Business Proposals",
    description: "Land Applications, Investment Proposals",
    documentRequirements: [
      "Business Plan",
      "Financial Projections",
      "Company Profile",
    ],
  },
] as const;

export const KAJ_SERVICES = [
  {
    value: "TAX_RETURN",
    label: "Tax Returns",
    description: "Individual, Corporate, Self-Employed",
    documentRequirements: [
      "TIN Certificate",
      "Previous Year Tax Return (if any)",
      "Income Documentation (Pay Slips, Contracts)",
      "Bank Statements",
    ],
  },
  {
    value: "COMPLIANCE",
    label: "Compliance Certificates",
    description: "Tender, Work Permit, Land Transfer",
    documentRequirements: [
      "TIN Certificate",
      "NIS Compliance",
      "Latest Tax Return",
    ],
  },
  {
    value: "PAYE",
    label: "PAYE Services",
    description: "PAYE Returns",
    documentRequirements: [
      "Employee List with TINs",
      "Payroll Records",
      "Previous PAYE Returns",
    ],
  },
  {
    value: "FINANCIAL_STATEMENT",
    label: "Financial Statements",
    description: "Income/Expenditure, Balance Sheets",
    documentRequirements: [
      "Bank Statements (12 months)",
      "Invoices and Receipts",
      "Previous Financial Statements",
    ],
  },
  {
    value: "NIS_SERVICES",
    label: "NIS Services",
    description: "Registration, Contributions, Pension",
    documentRequirements: [
      "National ID",
      "Birth Certificate",
      "Proof of Employment",
    ],
  },
  {
    value: "BOOKKEEPING",
    label: "Bookkeeping",
    description: "Monthly Bookkeeping, Payroll",
    documentRequirements: [
      "Bank Statements",
      "Invoices and Receipts",
      "Expense Records",
    ],
  },
  {
    value: "AUDIT",
    label: "Audit Services",
    description: "NGO & Co-operative Audits",
    documentRequirements: [
      "Financial Statements",
      "Bank Statements",
      "Minutes of Meetings",
      "Membership Register",
    ],
  },
] as const;

export type GCMCService = (typeof GCMC_SERVICES)[number]["value"];
export type KAJService = (typeof KAJ_SERVICES)[number]["value"];

// Note: PricingTier and ServiceCatalogItem are already defined above (lines 18-56)

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
    name?: string;
    relationship?: string;
    phone?: string;
    email?: string;
  };
  nextOfKin?: {
    name?: string;
    relationship?: string;
    phone?: string;
    address?: string;
  };

  // Step 4: Identification
  tinNumber: string;
  nationalId: string;
  passportNumber: string;
  nisNumber: string;

  // Step 5: Employment & Income (for individuals)
  employment?: {
    status?:
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
    pepRelationship?: string;
  }>;

  // Step 7: AML/Compliance
  amlCompliance?: {
    sourceOfFunds?: string[]; // Array of: "EMPLOYMENT" | "BUSINESS" | "INHERITANCE" | "INVESTMENTS" | "OTHER" etc.
    sourceOfFundsDetails?: string;
    isPep?: boolean;
    pepCategory?:
      | "DOMESTIC"
      | "FOREIGN"
      | "INTERNATIONAL_ORG"
      | "HEAD_OF_STATE"
      | "GOVERNMENT_OFFICIAL"
      | "JUDICIAL_OFFICIAL"
      | "MILITARY_OFFICIAL"
      | "STATE_OWNED_EXECUTIVE"
      | "POLITICAL_PARTY_OFFICIAL"
      | "INTERNATIONAL_ORGANIZATION"
      | "FAMILY_MEMBER"
      | "CLOSE_ASSOCIATE";
    pepPosition?: string;
    pepJurisdiction?: string;
    sanctionsScreeningConsent?: boolean;
  };

  // Step 8: Business Assignment & Services
  businesses: Business[];
  selectedServiceIds: string[]; // Array of service catalog UUIDs

  // Temporary: Keep old format for backward compatibility until service catalog UI is complete
  gcmcServices: GCMCService[];
  kajServices: KAJService[];

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
  gcmcServices: [],
  kajServices: [],
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
    description: "Disclose beneficial owners (25%+ ownership) - optional",
    isOptional: true,
    validate: (data: ClientOnboardingData) => {
      // Skip validation if not a business type
      if (!isBusinessType(data.clientType)) {
        return null;
      }

      // Skip validation if no owners provided (user chose to skip)
      if (!data.beneficialOwners || data.beneficialOwners.length === 0) {
        return null;
      }

      // Validate provided owners
      const errors: Record<string, string> = {};
      for (const [index, owner] of data.beneficialOwners.entries()) {
        if (!owner.fullName) {
          errors[`owner_${index}_name`] =
            `Owner ${index + 1}: Name is required`;
        }
        if (owner.ownershipPercentage < 0 || owner.ownershipPercentage > 100) {
          errors[`owner_${index}_percentage`] =
            `Owner ${index + 1}: Ownership must be 0-100%`;
        }
      }

      return Object.keys(errors).length > 0 ? errors : null;
    },
  },
  {
    id: "aml-compliance",
    title: "AML/KYC Compliance",
    description: "Anti-Money Laundering compliance (optional)",
    isOptional: true,
    validate: (data: ClientOnboardingData) => {
      // Skip validation if no AML data provided (user skipped)
      if (!data.amlCompliance?.sourceOfFunds) {
        return null;
      }

      const errors: Record<string, string> = {};

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

      // Only require consent if user started filling out AML data
      if (
        data.amlCompliance?.sourceOfFunds &&
        !data.amlCompliance?.sanctionsScreeningConsent
      ) {
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

      // Check for services in either new or old format (temporary backward compatibility)
      const hasServices =
        data.selectedServiceIds.length > 0 ||
        data.gcmcServices.length > 0 ||
        data.kajServices.length > 0;

      if (!hasServices) {
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

  // Business-specific documents
  if (isBusinessType(data.clientType)) {
    documents.push("Business Registration Certificate");
    documents.push("TIN Certificate");
    if (data.clientType === "CORPORATION") {
      documents.push("Certificate of Incorporation");
      documents.push("Articles of Association");
    }
    if (data.clientType === "NGO") {
      documents.push("NGO Registration Certificate");
      documents.push("Constitution/By-Laws");
    }
    if (data.clientType === "COOP" || data.clientType === "CREDIT_UNION") {
      documents.push("Co-operative Registration Certificate");
      documents.push("By-Laws");
    }
  }

  // Foreign National specific
  if (data.clientType === "FOREIGN_NATIONAL") {
    documents.push("Valid Passport");
    documents.push("Current Visa/Immigration Status");
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
    return "IDENTITY";
  }

  // Tax-related documents
  if (
    lower.includes("tin") ||
    lower.includes("tax return") ||
    lower.includes("tax clearance") ||
    lower.includes("paye") ||
    lower.includes("vat")
  ) {
    return "TAX";
  }

  // NIS documents
  if (lower.includes("nis") || lower.includes("national insurance")) {
    return "OTHER";
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
    return "TRAINING";
  }

  // Agreements/Contracts
  if (
    lower.includes("agreement") ||
    lower.includes("contract") ||
    lower.includes("will") ||
    lower.includes("affidavit")
  ) {
    return "LEGAL";
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
 * Get required documents organized by category
 * Note: Service-specific requirements should come from the service catalog.
 * This function returns general client-type-based requirements.
 */
export function getRequiredDocumentsByServices(
  data: ClientOnboardingData
): Record<string, string[]> {
  const requirements: Record<string, string[]> = {};

  // General requirements for all clients
  requirements["General Documents"] = [
    "National ID or Passport",
    "Proof of Address (utility bill, bank statement - within 3 months)",
  ];

  // Business-specific requirements
  if (isBusinessType(data.clientType)) {
    requirements["Business Registration Documents"] = [
      "Business Registration/Incorporation Certificate",
      "TIN Certificate",
      "NIS Employer Number",
    ];

    if (data.clientType === "CORPORATION") {
      requirements["Corporation Documents"] = [
        "Certificate of Incorporation",
        "Articles of Association",
        "Share Register",
        "Directors' Details",
      ];
    }

    if (data.clientType === "NGO") {
      requirements["NGO Documents"] = [
        "NGO Registration Certificate",
        "Constitution/By-Laws",
        "List of Board Members",
      ];
    }

    if (data.clientType === "COOP" || data.clientType === "CREDIT_UNION") {
      requirements["Co-operative Documents"] = [
        "Co-operative Registration Certificate",
        "By-Laws",
        "List of Directors",
      ];
    }
  }

  // Foreign National specific
  if (data.clientType === "FOREIGN_NATIONAL") {
    requirements["Immigration Documents"] = [
      "Valid Passport (6+ months validity)",
      "Current Visa/Immigration Status",
      "Passport Photos (4 copies)",
    ];
  }

  // AML/KYC requirements for high-risk clients
  if (data.amlCompliance?.isPep) {
    requirements["Enhanced Due Diligence"] = [
      "Source of Wealth Declaration",
      "Source of Funds Documentation",
      "PEP Declaration Form",
    ];
  }

  // Beneficial ownership for corporations
  if (data.clientType === "CORPORATION" && data.beneficialOwners.length > 0) {
    requirements["Beneficial Ownership Documents"] = [
      "Beneficial Owner Identification (for each owner 25%+)",
      "Ownership Structure Chart",
      "Proof of Address for Beneficial Owners",
    ];
  }

  return requirements;
}
