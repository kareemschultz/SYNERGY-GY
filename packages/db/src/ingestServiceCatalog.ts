// packages/db/src/ingestServiceCatalog.ts

import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import type { businessEnum } from "./schema/core";
import {
  type pricingTierTypeEnum,
  serviceCatalog,
  serviceCategory,
} from "./schema/service-catalog";

dotenv.config({
  path: "../../apps/server/.env",
});

// Ensure businessEnum values are correct based on core.ts
type Business = (typeof businessEnum.enumValues)[number];
type PricingTierType = (typeof pricingTierTypeEnum.enumValues)[number];

type ServiceCategoryData = {
  business: Business;
  name: string;
  displayName: string;
  description?: string;
  icon?: string;
  sortOrder: number;
  services: ServiceCatalogData[];
};

type ServiceCatalogData = {
  name: string;
  displayName: string;
  shortDescription?: string;
  description?: string;
  targetAudience?: string;
  topicsCovered?: string[];
  documentRequirements?: string[];
  workflow?: string;
  deliverables?: string[];
  typicalDuration?: string;
  estimatedDays?: number;
  pricingType: PricingTierType;
  basePrice?: string; // Use string for decimal type
  maxPrice?: string; // Use string for decimal type
  currency: string;
  pricingTiers?: Array<{
    name: string;
    description?: string;
    price?: number;
    minPrice?: number;
    maxPrice?: number;
    conditions?: string;
  }>;
  pricingNotes?: string;
  discountsAvailable?: string;
  governmentFees?: string;
  governmentAgencies?: string[];
  isFeatured: boolean;
  sortOrder: number;
  tags?: string[];
};

async function ingestServiceCatalog() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool, { schema });

  console.log("Starting service catalog ingestion...");

  const serviceCategoriesToInsert: ServiceCategoryData[] = [
    // GCMC Services
    {
      business: "GCMC",
      name: "TRAINING_SERVICES",
      displayName: "Training Services",
      sortOrder: 1,
      services: [
        {
          name: "HR_MANAGEMENT_TRAINING",
          displayName: "HR Management Training",
          description:
            "Comprehensive training on human resource management best practices.",
          typicalDuration: "Varies",
          pricingType: "CUSTOM",
          currency: "GYD",
          isFeatured: false,
          sortOrder: 1,
        },
        {
          name: "CUSTOMER_RELATIONS_TRAINING",
          displayName: "Customer Relations Training",
          description:
            "Training focused on enhancing customer service and building strong client relationships.",
          typicalDuration: "Varies",
          pricingType: "CUSTOM",
          currency: "GYD",
          isFeatured: false,
          sortOrder: 2,
        },
        {
          name: "COOPS_CREDIT_UNIONS_TRAINING",
          displayName: "Co-ops/Credit Unions Training",
          description:
            "Specialized training for cooperative societies and credit unions.",
          typicalDuration: "Varies",
          pricingType: "CUSTOM",
          currency: "GYD",
          isFeatured: false,
          sortOrder: 3,
        },
        {
          name: "ORGANISATIONAL_MANAGEMENT_TRAINING",
          displayName: "Organisational Management Training",
          description:
            "Training on effective strategies for organisational management and development.",
          typicalDuration: "Varies",
          pricingType: "CUSTOM",
          currency: "GYD",
          isFeatured: false,
          sortOrder: 4,
        },
      ],
    },
    {
      business: "GCMC",
      name: "SMALL_BUSINESS_DEVELOPMENT",
      displayName: "Small Business Development",
      sortOrder: 2,
      services: [
        {
          name: "COMPANY_INCORPORATION",
          displayName: "Company Incorporation",
          description:
            "Assistance with the process of incorporating a new company.",
          typicalDuration: "10-15 business days",
          pricingType: "FIXED",
          basePrice: "75000",
          currency: "GYD",
          governmentFees: "GRA filing fees apply",
          governmentAgencies: ["Commercial Registry"],
          isFeatured: true,
          sortOrder: 1,
          documentRequirements: [
            "Proposed company name",
            "Articles of Incorporation",
            "Bylaws",
            "Shareholder information",
          ],
        },
        {
          name: "BUSINESS_REGISTRATION",
          displayName: "Business Registration",
          description:
            "Guidance and support for registering your business with relevant authorities.",
          typicalDuration: "5-7 business days",
          pricingType: "FIXED",
          basePrice: "45000",
          currency: "GYD",
          governmentFees: "GRA registration fees apply",
          governmentAgencies: ["GRA"],
          isFeatured: false,
          sortOrder: 2,
          documentRequirements: [
            "Business name",
            "Business address",
            "Owner/Partner details",
          ],
        },
        {
          name: "NPO_REGISTRATION",
          displayName: "NPO Registration",
          description: "Assistance with registering Non-Profit Organizations.",
          typicalDuration: "15-20 business days",
          pricingType: "FIXED",
          basePrice: "90000",
          currency: "GYD",
          governmentFees: "NPO registration fees apply",
          governmentAgencies: ["Ministry of Human Services"],
          isFeatured: false,
          sortOrder: 3,
          documentRequirements: [
            "NPO name",
            "Mission statement",
            "Board member details",
            "Constitution/Bylaws",
          ],
        },
        {
          name: "COOPERATIVE_REGISTRATION",
          displayName: "Cooperative Registration",
          description: "Support for registering cooperative societies.",
          typicalDuration: "15-20 business days",
          pricingType: "FIXED",
          basePrice: "90000",
          currency: "GYD",
          governmentFees: "Cooperative registration fees apply",
          governmentAgencies: [
            "Ministry of Labour, Co-operatives and Friendly Societies",
          ],
          isFeatured: false,
          sortOrder: 4,
          documentRequirements: ["Cooperative name", "Bylaws", "Member list"],
        },
      ],
    },
    {
      business: "GCMC",
      name: "PARALEGAL_SERVICES",
      displayName: "Paralegal Services",
      sortOrder: 3,
      services: [
        {
          name: "AFFIDAVITS",
          displayName: "Affidavits",
          description:
            "Preparation and notarization of affidavits for various legal purposes.",
          typicalDuration: "1-2 business days",
          pricingType: "RANGE",
          basePrice: "10000",
          maxPrice: "25000",
          currency: "GYD",
          isFeatured: false,
          sortOrder: 1,
          documentRequirements: [
            "Relevant case details",
            "Deponent's identification",
          ],
        },
        {
          name: "AGREEMENTS",
          displayName: "Agreements",
          description:
            "Drafting and review of various legal agreements (e.g., rental, employment).",
          typicalDuration: "3-5 business days",
          pricingType: "RANGE",
          basePrice: "30000",
          maxPrice: "75000",
          currency: "GYD",
          isFeatured: false,
          sortOrder: 2,
          documentRequirements: [
            "Parties' information",
            "Terms of agreement",
            "Any supporting documents",
          ],
        },
        {
          name: "WILLS",
          displayName: "Wills",
          description:
            "Assistance in drafting last will and testament documents.",
          typicalDuration: "5-7 business days",
          pricingType: "FIXED",
          basePrice: "40000",
          currency: "GYD",
          isFeatured: false,
          sortOrder: 3,
          documentRequirements: [
            "Beneficiary details",
            "Executor information",
            "Asset list",
          ],
        },
        {
          name: "SETTLEMENT_AGREEMENTS",
          displayName: "Settlement Agreements",
          description:
            "Preparation of settlement agreements for dispute resolution.",
          typicalDuration: "5-10 business days",
          pricingType: "CUSTOM",
          currency: "GYD",
          isFeatured: false,
          sortOrder: 4,
          documentRequirements: [
            "Dispute details",
            "Proposed settlement terms",
            "Parties' legal representation (if any)",
          ],
        },
        {
          name: "INVESTMENT_AGREEMENTS",
          displayName: "Investment Agreements",
          description:
            "Drafting and review of agreements related to investments.",
          typicalDuration: "7-10 business days",
          pricingType: "CUSTOM",
          currency: "GYD",
          isFeatured: false,
          sortOrder: 5,
          documentRequirements: [
            "Investor and investee details",
            "Investment terms",
            "Due diligence documents",
          ],
        },
      ],
    },
    {
      business: "GCMC",
      name: "IMMIGRATION_SERVICES",
      displayName: "Immigration Services",
      sortOrder: 4,
      services: [
        {
          name: "WORK_PERMITS",
          displayName: "Work Permits",
          description:
            "Assistance with obtaining work permits for foreign nationals.",
          typicalDuration: "20-30 business days",
          pricingType: "FIXED",
          basePrice: "120000",
          currency: "GYD",
          governmentFees: "Immigration Department fees apply",
          governmentAgencies: ["Immigration Department"],
          isFeatured: true,
          sortOrder: 1,
          documentRequirements: [
            "Passport copy",
            "Job offer letter",
            "Qualifications",
            "Police clearance",
          ],
        },
        {
          name: "CITIZENSHIP",
          displayName: "Citizenship Application",
          description: "Guidance through the citizenship application process.",
          typicalDuration: "60-90 business days",
          pricingType: "CUSTOM",
          currency: "GYD",
          governmentFees: "Citizenship fees apply",
          governmentAgencies: ["Immigration Department"],
          isFeatured: false,
          sortOrder: 2,
          documentRequirements: [
            "Birth certificate",
            "Marriage certificate (if applicable)",
            "Residency proof",
            "Police clearance",
          ],
        },
        {
          name: "BUSINESS_VISAS",
          displayName: "Business Visas",
          description:
            "Support for securing business visas for international travel.",
          typicalDuration: "10-15 business days",
          pricingType: "FIXED",
          basePrice: "80000",
          currency: "GYD",
          governmentFees: "Visa application fees apply",
          governmentAgencies: ["Relevant Embassies/Consulates"],
          isFeatured: false,
          sortOrder: 3,
          documentRequirements: [
            "Passport copy",
            "Invitation letter",
            "Business itinerary",
            "Proof of funds",
          ],
        },
        {
          name: "DEPENDENT_VISAS",
          displayName: "Dependent Visas",
          description:
            "Assistance for family members to obtain dependent visas.",
          typicalDuration: "20-30 business days",
          pricingType: "FIXED",
          basePrice: "100000",
          currency: "GYD",
          governmentFees: "Immigration Department fees apply",
          governmentAgencies: ["Immigration Department"],
          isFeatured: false,
          sortOrder: 4,
          documentRequirements: [
            "Primary applicant's visa details",
            "Proof of relationship",
            "Dependent's passport",
          ],
        },
      ],
    },
    {
      business: "GCMC",
      name: "BUSINESS_PROPOSALS",
      displayName: "Business Proposals",
      sortOrder: 5,
      services: [
        {
          name: "LAND_OCCUPATION_PROPOSALS",
          displayName: "Land Occupation Proposals",
          description: "Drafting proposals for land use and occupation.",
          typicalDuration: "7-14 business days",
          pricingType: "CUSTOM",
          currency: "GYD",
          governmentAgencies: ["Guyana Lands and Surveys Commission"],
          isFeatured: false,
          sortOrder: 1,
          documentRequirements: [
            "Land coordinates",
            "Proposed use of land",
            "Business plan",
          ],
        },
        {
          name: "INVESTMENT_PROPOSALS",
          displayName: "Investment Proposals",
          description: "Development of comprehensive investment proposals.",
          typicalDuration: "10-20 business days",
          pricingType: "CUSTOM",
          currency: "GYD",
          governmentAgencies: ["Go-Invest"],
          isFeatured: false,
          sortOrder: 2,
          documentRequirements: [
            "Business concept",
            "Financial projections",
            "Market analysis",
          ],
        },
        {
          name: "STARTUP_PROPOSALS",
          displayName: "Start-Up Proposals",
          description:
            "Crafting proposals for new business ventures and startups.",
          typicalDuration: "7-14 business days",
          pricingType: "CUSTOM",
          currency: "GYD",
          isFeatured: false,
          sortOrder: 3,
          documentRequirements: [
            "Business idea",
            "Team details",
            "Funding requirements",
          ],
        },
      ],
    },
    {
      business: "GCMC",
      name: "NETWORKING_SERVICES",
      displayName: "Networking Services",
      sortOrder: 6,
      services: [
        {
          name: "REAL_ESTATE_REFERRALS",
          displayName: "Real Estate Referrals",
          description:
            "Connecting clients with trusted real estate professionals.",
          typicalDuration: "Ongoing",
          pricingType: "CUSTOM",
          currency: "GYD",
          isFeatured: false,
          sortOrder: 1,
        },
        {
          name: "IT_REFERRALS",
          displayName: "IT Referrals",
          description: "Referring clients to reliable IT service providers.",
          typicalDuration: "Ongoing",
          pricingType: "CUSTOM",
          currency: "GYD",
          isFeatured: false,
          sortOrder: 2,
        },
        {
          name: "LEGAL_REFERRALS",
          displayName: "Legal Referrals",
          description: "Connecting clients with qualified legal practitioners.",
          typicalDuration: "Ongoing",
          pricingType: "CUSTOM",
          currency: "GYD",
          isFeatured: false,
          sortOrder: 3,
        },
      ],
    },
    // KAJ Services
    {
      business: "KAJ",
      name: "INCOME_TAX_RETURNS",
      displayName: "Income Tax Returns",
      sortOrder: 7,
      services: [
        {
          name: "INDIVIDUAL_TAX_RETURN",
          displayName: "Individual Income Tax Return",
          description:
            "Preparation and filing of individual income tax returns.",
          typicalDuration: "3-5 business days",
          pricingType: "FIXED",
          basePrice: "15000",
          currency: "GYD",
          governmentAgencies: ["GRA"],
          documentRequirements: [
            "PAYE slips",
            "Other income statements",
            "Deduction claims",
          ],
          isFeatured: true,
          sortOrder: 1,
        },
        {
          name: "CORPORATE_TAX_RETURN",
          displayName: "Corporate Income Tax Return",
          description:
            "Preparation and filing of corporate income tax returns.",
          typicalDuration: "7-10 business days",
          pricingType: "RANGE",
          basePrice: "50000",
          maxPrice: "150000",
          currency: "GYD",
          governmentAgencies: ["GRA"],
          documentRequirements: [
            "Financial statements",
            "Trial balance",
            "Previous year's return",
          ],
          isFeatured: false,
          sortOrder: 2,
        },
        {
          name: "SELF_EMPLOYED_TAX_RETURN",
          displayName: "Self-Employed Income Tax Return",
          description:
            "Preparation and filing of income tax returns for self-employed individuals.",
          typicalDuration: "5-7 business days",
          pricingType: "FIXED",
          basePrice: "25000",
          currency: "GYD",
          governmentAgencies: ["GRA"],
          documentRequirements: [
            "Business income records",
            "Expense receipts",
            "NIS contributions",
          ],
          isFeatured: false,
          sortOrder: 3,
        },
        {
          name: "PARTNERSHIP_TAX_RETURN",
          displayName: "Partnership Income Tax Return",
          description:
            "Preparation and filing of income tax returns for partnerships.",
          typicalDuration: "7-10 business days",
          pricingType: "FIXED",
          basePrice: "40000",
          currency: "GYD",
          governmentAgencies: ["GRA"],
          documentRequirements: [
            "Partnership agreement",
            "Financial statements",
            "Individual partner details",
          ],
          isFeatured: false,
          sortOrder: 4,
        },
      ],
    },
    {
      business: "KAJ",
      name: "TAX_COMPLIANCE_SERVICES",
      displayName: "Tax Compliance Services",
      sortOrder: 8,
      services: [
        {
          name: "TENDER_COMPLIANCE",
          displayName: "Tender Compliance",
          description:
            "Assistance with tax compliance requirements for tender submissions.",
          typicalDuration: "2-3 business days",
          pricingType: "FIXED",
          basePrice: "20000",
          currency: "GYD",
          governmentAgencies: ["GRA"],
          documentRequirements: [
            "Tender documents",
            "Business registration",
            "GRA compliance status",
          ],
          isFeatured: false,
          sortOrder: 1,
        },
        {
          name: "WORK_PERMIT_TAX_COMPLIANCE",
          displayName: "Work Permit Tax Compliance",
          description: "Ensuring tax compliance for work permit applications.",
          typicalDuration: "3-5 business days",
          pricingType: "FIXED",
          basePrice: "25000",
          currency: "GYD",
          governmentAgencies: ["GRA", "Immigration Department"],
          documentRequirements: [
            "Work permit application",
            "Employer details",
            "Employee tax info",
          ],
          isFeatured: false,
          sortOrder: 2,
        },
        {
          name: "LAND_TRANSFER_TAX_COMPLIANCE",
          displayName: "Land Transfer Tax Compliance",
          description:
            "Handling tax compliance for land transfer transactions.",
          typicalDuration: "5-7 business days",
          pricingType: "FIXED",
          basePrice: "35000",
          currency: "GYD",
          governmentAgencies: ["GRA", "Deeds Registry"],
          documentRequirements: [
            "Agreement of sale",
            "Transport/Title",
            "Valuation report",
          ],
          isFeatured: false,
          sortOrder: 3,
        },
        {
          name: "FIREARM_TAX_COMPLIANCE",
          displayName: "Firearm Tax Compliance",
          description: "Assistance with tax compliance for firearm licenses.",
          typicalDuration: "3-5 business days",
          pricingType: "FIXED",
          basePrice: "20000",
          currency: "GYD",
          governmentAgencies: ["GRA", "Guyana Police Force"],
          documentRequirements: [
            "Firearm license application",
            "Proof of ownership",
            "Tax record",
          ],
          isFeatured: false,
          sortOrder: 4,
        },
        {
          name: "PENSION_TAX_COMPLIANCE",
          displayName: "Pension Tax Compliance",
          description:
            "Ensuring tax compliance for pension fund administration.",
          typicalDuration: "5-7 business days",
          pricingType: "CUSTOM",
          currency: "GYD",
          governmentAgencies: ["GRA", "NIS"],
          documentRequirements: [
            "Pension scheme details",
            "Beneficiary info",
            "Annual returns",
          ],
          isFeatured: false,
          sortOrder: 5,
        },
        {
          name: "CERTIFICATE_OF_ASSESSMENT",
          displayName: "Certificate of Assessment",
          description:
            "Application for and procurement of Certificate of Assessment.",
          typicalDuration: "7-10 business days",
          pricingType: "FIXED",
          basePrice: "25000",
          currency: "GYD",
          governmentAgencies: ["GRA"],
          documentRequirements: [
            "Taxpayer ID",
            "Previous tax returns",
            "Proof of income",
          ],
          isFeatured: false,
          sortOrder: 6,
        },
      ],
    },
    {
      business: "KAJ",
      name: "PAYE_SERVICES",
      displayName: "PAYE Services",
      sortOrder: 9,
      services: [
        {
          name: "MONTHLY_PAYE_RETURNS",
          displayName: "Monthly PAYE Returns",
          description: "Preparation and submission of monthly PAYE returns.",
          typicalDuration: "2-3 business days (monthly)",
          pricingType: "RANGE",
          basePrice: "10000",
          maxPrice: "30000",
          currency: "GYD",
          pricingNotes: "Price varies based on number of employees.",
          governmentAgencies: ["GRA"],
          documentRequirements: ["Payroll records", "Employee details"],
          isFeatured: false,
          sortOrder: 1,
        },
        {
          name: "ANNUAL_PAYE_RECONCILIATION",
          displayName: "Annual PAYE Reconciliation",
          description: "Annual reconciliation of PAYE records and submissions.",
          typicalDuration: "5-7 business days",
          pricingType: "FIXED",
          basePrice: "40000",
          currency: "GYD",
          governmentAgencies: ["GRA"],
          documentRequirements: [
            "Annual payroll summary",
            "Monthly PAYE records",
          ],
          isFeatured: false,
          sortOrder: 2,
        },
        {
          name: "EMPLOYEE_PAYE_CERTIFICATES",
          displayName: "Employee PAYE Certificates",
          description: "Issuance of PAYE certificates for employees.",
          typicalDuration: "2-3 business days",
          pricingType: "FIXED",
          basePrice: "5000",
          currency: "GYD",
          pricingNotes: "Per employee.",
          governmentAgencies: ["GRA"],
          documentRequirements: ["Employee tax details"],
          isFeatured: false,
          sortOrder: 3,
        },
      ],
    },
    {
      business: "KAJ",
      name: "FINANCIAL_STATEMENTS",
      displayName: "Financial Statements",
      sortOrder: 10,
      services: [
        {
          name: "BANK_LOAN_FINANCIALS",
          displayName: "Financial Statements for Bank Loan",
          description:
            "Preparation of financial statements suitable for bank loan applications.",
          typicalDuration: "7-14 business days",
          pricingType: "RANGE",
          basePrice: "60000",
          maxPrice: "180000",
          currency: "GYD",
          pricingNotes: "Price depends on complexity and business size.",
          isFeatured: true,
          sortOrder: 1,
          documentRequirements: [
            "Bank statements",
            "Ledger records",
            "Previous financials",
          ],
        },
        {
          name: "COMMISSIONER_OF_POLICE_FINANCIALS",
          displayName: "Financial Statements for Commissioner of Police",
          description:
            "Preparation of financial statements for submission to the Commissioner of Police.",
          typicalDuration: "7-14 business days",
          pricingType: "RANGE",
          basePrice: "60000",
          maxPrice: "180000",
          currency: "GYD",
          isFeatured: false,
          sortOrder: 2,
          documentRequirements: [
            "Bank statements",
            "Ledger records",
            "Previous financials",
          ],
        },
        {
          name: "INVESTMENT_FINANCIALS",
          displayName: "Financial Statements for Investment",
          description:
            "Preparation of financial statements tailored for investment purposes.",
          typicalDuration: "7-14 business days",
          pricingType: "RANGE",
          basePrice: "60000",
          maxPrice: "180000",
          currency: "GYD",
          isFeatured: false,
          sortOrder: 3,
          documentRequirements: [
            "Bank statements",
            "Ledger records",
            "Previous financials",
            "Investment proposals",
          ],
        },
        {
          name: "CASH_FLOW_PROJECTIONS",
          displayName: "Cash Flow Projections",
          description:
            "Development of detailed cash flow projections for business planning.",
          typicalDuration: "5-10 business days",
          pricingType: "RANGE",
          basePrice: "40000",
          maxPrice: "100000",
          currency: "GYD",
          isFeatured: false,
          sortOrder: 4,
          documentRequirements: [
            "Historical financial data",
            "Sales forecasts",
            "Expense budgets",
          ],
        },
      ],
    },
    {
      business: "KAJ",
      name: "AUDIT_SERVICES",
      displayName: "Audit Services",
      sortOrder: 11,
      services: [
        {
          name: "NGO_AUDIT",
          displayName: "NGO Audit",
          description:
            "Independent audit services for Non-Governmental Organizations.",
          typicalDuration: "14-21 business days",
          pricingType: "CUSTOM",
          currency: "GYD",
          isFeatured: false,
          sortOrder: 1,
          documentRequirements: [
            "Financial records",
            "Grant agreements",
            "Governance documents",
          ],
        },
        {
          name: "COOPERATIVE_AUDIT",
          displayName: "Cooperative Audit",
          description: "Audit services tailored for cooperative societies.",
          typicalDuration: "14-21 business days",
          pricingType: "CUSTOM",
          currency: "GYD",
          isFeatured: false,
          sortOrder: 2,
          documentRequirements: [
            "Financial records",
            "Membership registry",
            "Bylaws",
          ],
        },
        {
          name: "CREDIT_UNION_AUDIT",
          displayName: "Credit Union Audit",
          description: "Specialized audit services for credit unions.",
          typicalDuration: "14-21 business days",
          pricingType: "CUSTOM",
          currency: "GYD",
          isFeatured: false,
          sortOrder: 3,
          documentRequirements: [
            "Financial records",
            "Loan portfolio",
            "Regulatory compliance documents",
          ],
        },
        {
          name: "FINANCIAL_STATEMENT_PREPARATION",
          displayName: "Financial Statement Preparation for Audit",
          description:
            "Preparation of financial statements specifically for audit purposes.",
          typicalDuration: "7-14 business days",
          pricingType: "RANGE",
          basePrice: "75000",
          maxPrice: "250000",
          currency: "GYD",
          isFeatured: false,
          sortOrder: 4,
          documentRequirements: [
            "Ledger accounts",
            "Bank reconciliations",
            "Asset registers",
          ],
        },
      ],
    },
    {
      business: "KAJ",
      name: "NIS_SERVICES",
      displayName: "NIS Services",
      sortOrder: 12,
      services: [
        {
          name: "EMPLOYER_NIS_REGISTRATION",
          displayName: "Employer NIS Registration",
          description:
            "Assistance with registering employers with the National Insurance Scheme.",
          typicalDuration: "5-7 business days",
          pricingType: "FIXED",
          basePrice: "30000",
          currency: "GYD",
          governmentAgencies: ["NIS"],
          isFeatured: false,
          sortOrder: 1,
          documentRequirements: [
            "Business registration",
            "TIN",
            "Employer details",
          ],
        },
        {
          name: "EMPLOYEE_NIS_REGISTRATION",
          displayName: "Employee NIS Registration",
          description:
            "Registration of employees with the National Insurance Scheme.",
          typicalDuration: "3-5 business days",
          pricingType: "FIXED",
          basePrice: "10000",
          currency: "GYD",
          pricingNotes: "Per employee.",
          governmentAgencies: ["NIS"],
          isFeatured: false,
          sortOrder: 2,
          documentRequirements: [
            "Employee ID",
            "Birth certificate",
            "Job letter",
          ],
        },
        {
          name: "MONTHLY_CS3_SUBMISSION",
          displayName: "Monthly CS-3 Submission",
          description: "Preparation and submission of monthly NIS CS-3 forms.",
          typicalDuration: "2-3 business days (monthly)",
          pricingType: "RANGE",
          basePrice: "10000",
          maxPrice: "25000",
          currency: "GYD",
          pricingNotes: "Price varies based on number of employees.",
          governmentAgencies: ["NIS"],
          isFeatured: false,
          sortOrder: 3,
          documentRequirements: ["Payroll records", "Previous CS-3 forms"],
        },
        {
          name: "PENSION_APPLICATIONS",
          displayName: "NIS Pension Applications",
          description:
            "Assistance with applying for NIS old age and other pensions.",
          typicalDuration: "7-14 business days",
          pricingType: "FIXED",
          basePrice: "40000",
          currency: "GYD",
          governmentAgencies: ["NIS"],
          isFeatured: false,
          sortOrder: 4,
          documentRequirements: [
            "NIS card",
            "Birth certificate",
            "Employment history",
          ],
        },
        {
          name: "BENEFIT_CLAIMS",
          displayName: "NIS Benefit Claims",
          description:
            "Support for filing various NIS benefit claims (e.g., sickness, maternity).",
          typicalDuration: "5-10 business days",
          pricingType: "FIXED",
          basePrice: "30000",
          currency: "GYD",
          governmentAgencies: ["NIS"],
          isFeatured: false,
          sortOrder: 5,
          documentRequirements: [
            "Medical certificates",
            "NIS card",
            "Relevant forms",
          ],
        },
      ],
    },
  ];

  await db.transaction(async (tx) => {
    try {
      for (const catData of serviceCategoriesToInsert) {
        console.log(`Inserting category: ${catData.displayName}`);
        const [insertedCategory] = await tx
          .insert(serviceCategory)
          .values({
            id: crypto.randomUUID(),
            business: catData.business,
            name: catData.name,
            displayName: catData.displayName,
            description: catData.description,
            icon: catData.icon,
            sortOrder: catData.sortOrder,
          })
          .returning();

        if (!insertedCategory) {
          throw new Error(`Failed to insert category: ${catData.displayName}`);
        }

        for (const serviceData of catData.services) {
          console.log(`  Inserting service: ${serviceData.displayName}`);
          await tx.insert(serviceCatalog).values({
            id: crypto.randomUUID(),
            categoryId: insertedCategory.id,
            business: catData.business,
            name: serviceData.name,
            displayName: serviceData.displayName,
            shortDescription: serviceData.shortDescription,
            description: serviceData.description,
            targetAudience: serviceData.targetAudience,
            topicsCovered: serviceData.topicsCovered,
            documentRequirements: serviceData.documentRequirements,
            workflow: serviceData.workflow,
            deliverables: serviceData.deliverables,
            typicalDuration: serviceData.typicalDuration,
            estimatedDays: serviceData.estimatedDays,
            pricingType: serviceData.pricingType,
            basePrice: serviceData.basePrice,
            maxPrice: serviceData.maxPrice,
            currency: serviceData.currency,
            pricingTiers: serviceData.pricingTiers as any, // Drizzle expects JSONB to be any type
            pricingNotes: serviceData.pricingNotes,
            discountsAvailable: serviceData.discountsAvailable,
            governmentFees: serviceData.governmentFees,
            governmentAgencies: serviceData.governmentAgencies,
            isFeatured: serviceData.isFeatured,
            sortOrder: serviceData.sortOrder,
            tags: serviceData.tags,
          });
        }
      }
      console.log("Service catalog ingestion completed successfully!");
    } catch (error) {
      console.error("Service catalog ingestion failed:", error);
      throw error; // Transaction auto-rolls back on error
    }
  });

  await pool.end();
}

ingestServiceCatalog().catch(console.error);
