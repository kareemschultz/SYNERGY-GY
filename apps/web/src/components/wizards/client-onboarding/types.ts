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
    description: "Monthly/Annual PAYE Returns",
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

  // Step 3: Contact Information
  email: string;
  phone: string;
  alternatePhone: string;
  address: string;
  city: string;
  country: string;

  // Step 4: Identification
  tinNumber: string;
  nationalId: string;
  passportNumber: string;
  nisNumber: string;

  // Step 5: Business Assignment & Services
  businesses: Business[];
  gcmcServices: GCMCService[];
  kajServices: KAJService[];

  // Step 6: Notes
  notes: string;
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
  tinNumber: "",
  nationalId: "",
  passportNumber: "",
  nisNumber: "",
  businesses: [],
  gcmcServices: [],
  kajServices: [],
  notes: "",
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
    id: "services",
    title: "Services",
    description: "Select businesses and services",
    validate: (data: ClientOnboardingData) => {
      if (data.businesses.length === 0) {
        return { businesses: "Please select at least one business" };
      }
      return null;
    },
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
