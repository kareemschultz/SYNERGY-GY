/**
 * Knowledge Base Forms Seed Script
 *
 * Seeds the Knowledge Base with actual downloaded government forms
 * and generates letter templates as DOCX files.
 *
 * Run with: bun run packages/db/src/seed-kb-forms.ts
 */

import { existsSync, mkdirSync, statSync } from "node:fs";
import { readdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import { eq } from "drizzle-orm";
import { db } from "./index";
import { user } from "./schema/auth";
import { staff } from "./schema/core";
import { knowledgeBaseItem } from "./schema/knowledge-base";

// Get project root (computed lazily in functions to avoid side effects at import time)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, "../../..");

// Helper to get paths - called inside functions to avoid top-level side effects
function getKbPaths() {
  const KB_UPLOADS_DIR = join(PROJECT_ROOT, "data/uploads/knowledge-base");
  const TEMPLATES_DIR = join(KB_UPLOADS_DIR, "templates");
  return { KB_UPLOADS_DIR, TEMPLATES_DIR };
}

// Helper to ensure templates directory exists - called only when seeding
function ensureTemplatesDirExists() {
  const { TEMPLATES_DIR } = getKbPaths();
  if (!existsSync(TEMPLATES_DIR)) {
    mkdirSync(TEMPLATES_DIR, { recursive: true });
  }
  return TEMPLATES_DIR;
}

type KnowledgeBaseType =
  | "AGENCY_FORM"
  | "LETTER_TEMPLATE"
  | "GUIDE"
  | "CHECKLIST";
type KnowledgeBaseCategory =
  | "GRA"
  | "NIS"
  | "IMMIGRATION"
  | "DCRA"
  | "GENERAL"
  | "TRAINING"
  | "INTERNAL";
type Business = "GCMC" | "KAJ" | null;

type KnowledgeBaseItemData = {
  type: KnowledgeBaseType;
  category: KnowledgeBaseCategory;
  business: Business;
  title: string;
  description: string;
  shortDescription: string;
  fileName?: string;
  storagePath?: string;
  mimeType?: string;
  fileSize?: number;
  content?: string;
  supportsAutoFill: boolean;
  relatedServices: string[];
  requiredFor: string[];
  agencyUrl?: string;
  governmentFees?: string;
  isStaffOnly: boolean;
  isFeatured: boolean;
};

// ============================================
// DOWNLOADED GOVERNMENT FORMS
// ============================================

const downloadedForms: KnowledgeBaseItemData[] = [
  // GRA Forms
  {
    type: "AGENCY_FORM",
    category: "GRA",
    business: "GCMC",
    title: "Individual Income Tax Return (IT-1)",
    description:
      "Official GRA form for filing annual Individual Income Tax Return. This form is used to report all sources of income, claim deductions, and calculate tax liability for the tax year. Must be filed by April 30th following the tax year. Form G0004-IIT-v3.",
    shortDescription: "Annual income tax filing for individuals",
    fileName: "GRA-Individual-Income-Tax-Return-IT1.pdf",
    storagePath: "knowledge-base/gra/GRA-Individual-Income-Tax-Return-IT1.pdf",
    mimeType: "application/pdf",
    supportsAutoFill: true,
    relatedServices: ["Personal Tax Filing", "Tax Compliance"],
    requiredFor: ["Annual Tax Return", "Tax Clearance Certificate"],
    agencyUrl: "https://www.gra.gov.gy/optimal/forms-and-guides/",
    governmentFees: "No filing fee. Tax payable as per calculation.",
    isStaffOnly: false,
    isFeatured: true,
  },
  {
    type: "AGENCY_FORM",
    category: "GRA",
    business: "GCMC",
    title: "Corporation Tax Return (CT-1)",
    description:
      "Official GRA form for annual Corporate Tax Return. Reports company income, expenses, and calculates corporate tax liability. Companies must file within 3 months of their financial year-end. Form G0003-CIT-v1.",
    shortDescription: "Annual tax return for corporations",
    fileName: "GRA-Corporation-Tax-Return-CT1.pdf",
    storagePath: "knowledge-base/gra/GRA-Corporation-Tax-Return-CT1.pdf",
    mimeType: "application/pdf",
    supportsAutoFill: true,
    relatedServices: ["Corporate Tax Filing", "Annual Corporate Compliance"],
    requiredFor: ["Corporate Tax Return", "Tax Clearance"],
    agencyUrl: "https://www.gra.gov.gy/optimal/forms-and-guides/",
    governmentFees:
      "No filing fee. Tax payable at 25% (small business) or 40% (standard).",
    isStaffOnly: false,
    isFeatured: true,
  },
  {
    type: "AGENCY_FORM",
    category: "GRA",
    business: "GCMC",
    title: "Value Added Tax Return (VAT)",
    description:
      "Official GRA VAT Return form for VAT-registered businesses. Reports taxable supplies, exempt supplies, and VAT collected/paid. Must be filed by the 21st of the month following the tax period. Form G0002-VAT-v1.",
    shortDescription: "VAT reporting for registered businesses",
    fileName: "GRA-VAT-Return.pdf",
    storagePath: "knowledge-base/gra/GRA-VAT-Return.pdf",
    mimeType: "application/pdf",
    supportsAutoFill: true,
    relatedServices: ["VAT Filing", "Tax Compliance"],
    requiredFor: ["VAT Compliance", "Tax Clearance"],
    agencyUrl: "https://www.gra.gov.gy/optimal/forms-and-guides/",
    governmentFees: "No filing fee. VAT rate is 14%.",
    isStaffOnly: false,
    isFeatured: true,
  },
  {
    type: "AGENCY_FORM",
    category: "GRA",
    business: "GCMC",
    title: "PAYE Return Guide",
    description:
      "Official GRA guide for PAYE (Pay-As-You-Earn) returns. Comprehensive guidance for employers on calculating, deducting, and remitting PAYE tax. Applicable from 2022.",
    shortDescription: "Employer PAYE compliance guide",
    fileName: "GRA-PAYE-Return-Guide.pdf",
    storagePath: "knowledge-base/gra/GRA-PAYE-Return-Guide.pdf",
    mimeType: "application/pdf",
    supportsAutoFill: false,
    relatedServices: ["Payroll Services", "PAYE Compliance"],
    requiredFor: ["Employer Tax Compliance"],
    agencyUrl: "https://www.gra.gov.gy/optimal/forms-and-guides/",
    governmentFees:
      "No filing fee. PAYE rates: 28% (first bracket), 40% (above threshold).",
    isStaffOnly: false,
    isFeatured: false,
  },
  {
    type: "AGENCY_FORM",
    category: "GRA",
    business: "GCMC",
    title: "Taxpayer Registration Form - Organisation",
    description:
      "Official GRA form for business/organisation TIN registration. Required for all businesses conducting taxable activities in Guyana. Essential for opening bank accounts and conducting business. Form G0016.",
    shortDescription: "Register business for Tax ID Number (TIN)",
    fileName: "GRA-TIN-Registration-Organisation.pdf",
    storagePath: "knowledge-base/gra/GRA-TIN-Registration-Organisation.pdf",
    mimeType: "application/pdf",
    supportsAutoFill: true,
    relatedServices: ["Business Registration", "Tax Registration"],
    requiredFor: ["New Business Setup", "Tax Compliance"],
    agencyUrl: "https://www.gra.gov.gy/optimal/forms-and-guides/",
    governmentFees: "Free",
    isStaffOnly: false,
    isFeatured: true,
  },
  {
    type: "AGENCY_FORM",
    category: "GRA",
    business: "GCMC",
    title: "Capital Gains Tax Return",
    description:
      "Official GRA form for reporting capital gains from the sale of assets. Required when disposing of property, shares, or other capital assets. Form G0007-CGT-v1.",
    shortDescription: "Report capital gains on asset sales",
    fileName: "GRA-Capital-Gains-Tax-Return.pdf",
    storagePath: "knowledge-base/gra/GRA-Capital-Gains-Tax-Return.pdf",
    mimeType: "application/pdf",
    supportsAutoFill: true,
    relatedServices: ["Tax Filing", "Property Services"],
    requiredFor: ["Asset Disposal", "Property Sale"],
    agencyUrl: "https://www.gra.gov.gy/optimal/forms-and-guides/",
    governmentFees: "Capital gains tax rate varies by asset type.",
    isStaffOnly: false,
    isFeatured: false,
  },
  {
    type: "AGENCY_FORM",
    category: "GRA",
    business: "GCMC",
    title: "Individual Property Tax Return",
    description:
      "Official GRA form for individual property tax filing. Required for property owners to report and pay annual property taxes. Form G0010-IPT-v2.",
    shortDescription: "Annual property tax for individuals",
    fileName: "GRA-Property-Tax-Individual.pdf",
    storagePath: "knowledge-base/gra/GRA-Property-Tax-Individual.pdf",
    mimeType: "application/pdf",
    supportsAutoFill: true,
    relatedServices: ["Property Tax", "Tax Compliance"],
    requiredFor: ["Property Tax Filing"],
    agencyUrl: "https://www.gra.gov.gy/optimal/forms-and-guides/",
    governmentFees: "Property tax based on property value.",
    isStaffOnly: false,
    isFeatured: false,
  },
  {
    type: "AGENCY_FORM",
    category: "GRA",
    business: "GCMC",
    title: "Excise Tax Return",
    description:
      "Official GRA form for excise tax returns. Required for businesses dealing with excisable goods including alcohol, tobacco, and fuel. Form G0013-Excise-v1a.",
    shortDescription: "Excise tax on goods",
    fileName: "GRA-Excise-Tax-Return.pdf",
    storagePath: "knowledge-base/gra/GRA-Excise-Tax-Return.pdf",
    mimeType: "application/pdf",
    supportsAutoFill: false,
    relatedServices: ["Excise Tax", "Import/Export"],
    requiredFor: ["Excise License Compliance"],
    agencyUrl: "https://www.gra.gov.gy/optimal/forms-and-guides/",
    governmentFees: "Excise rates vary by product type.",
    isStaffOnly: false,
    isFeatured: false,
  },

  // NIS Forms
  {
    type: "AGENCY_FORM",
    category: "NIS",
    business: "GCMC",
    title: "NIS Employer Registration (Form R400F1)",
    description:
      "Official NIS form for registering as an employer. All employers with one or more employees must register within 7 days of hiring their first employee. ISO 9001 certified form.",
    shortDescription: "Register business as NIS employer",
    fileName: "NIS-Employer-Registration.pdf",
    storagePath: "knowledge-base/nis/NIS-Employer-Registration.pdf",
    mimeType: "application/pdf",
    supportsAutoFill: true,
    relatedServices: ["NIS Registration", "Payroll Setup"],
    requiredFor: ["Employer NIS Compliance", "New Business Setup"],
    agencyUrl: "https://www.nis.org.gy/downloads",
    governmentFees: "Free",
    isStaffOnly: false,
    isFeatured: true,
  },
  {
    type: "AGENCY_FORM",
    category: "NIS",
    business: "GCMC",
    title: "NIS Employee Registration (Form R400F4)",
    description:
      "Official NIS form for registering employees. Must be completed for each new employee. NIS number is required for all formal employment and accessing NIS benefits. ISO 9001 certified form.",
    shortDescription: "Register employee for NIS benefits",
    fileName: "NIS-Employee-Registration.pdf",
    storagePath: "knowledge-base/nis/NIS-Employee-Registration.pdf",
    mimeType: "application/pdf",
    supportsAutoFill: true,
    relatedServices: ["NIS Registration", "Employee Onboarding"],
    requiredFor: ["Employee Registration", "NIS Compliance"],
    agencyUrl: "https://www.nis.org.gy/downloads",
    governmentFees: "Free",
    isStaffOnly: false,
    isFeatured: true,
  },
  {
    type: "AGENCY_FORM",
    category: "NIS",
    business: "GCMC",
    title: "NIS Self-Employed Registration (Form R400F4A)",
    description:
      "Official NIS form for self-employed persons to register and make voluntary contributions. Enables access to NIS benefits including sickness, maternity, and old age pension.",
    shortDescription: "Self-employed NIS registration",
    fileName: "NIS-Self-Employed-Registration.pdf",
    storagePath: "knowledge-base/nis/NIS-Self-Employed-Registration.pdf",
    mimeType: "application/pdf",
    supportsAutoFill: true,
    relatedServices: ["NIS Registration", "Self-Employment"],
    requiredFor: ["Self-Employed NIS Coverage"],
    agencyUrl: "https://www.nis.org.gy/downloads",
    governmentFees: "Free (contributions based on declared income)",
    isStaffOnly: false,
    isFeatured: false,
  },
  {
    type: "AGENCY_FORM",
    category: "NIS",
    business: "GCMC",
    title: "NIS Monthly Contribution Schedule (Form F200F2)",
    description:
      "Official NIS monthly contribution schedule for employers. Reports all employee earnings and NIS deductions. Due by the 14th of the following month. Contribution rate: 14% (5.6% employee, 8.4% employer).",
    shortDescription: "Monthly NIS contribution reporting",
    fileName: "NIS-Monthly-Contribution-Schedule.pdf",
    storagePath: "knowledge-base/nis/NIS-Monthly-Contribution-Schedule.pdf",
    mimeType: "application/pdf",
    supportsAutoFill: true,
    relatedServices: ["Payroll Services", "NIS Compliance"],
    requiredFor: ["NIS Compliance", "Employee Benefits"],
    agencyUrl: "https://www.nis.org.gy/downloads",
    governmentFees: "14% of insurable earnings (ceiling: GYD 280,000/month)",
    isStaffOnly: false,
    isFeatured: true,
  },
  {
    type: "AGENCY_FORM",
    category: "NIS",
    business: "GCMC",
    title: "NIS Electronic Schedule 2025",
    description:
      "Official NIS electronic contribution schedule spreadsheet for 2025. Excel format for electronic submission of monthly contributions. Version 24.1.",
    shortDescription: "Electronic NIS contribution template",
    fileName: "NIS-Electronic-Schedule-2025.xls",
    storagePath: "knowledge-base/nis/NIS-Electronic-Schedule-2025.xls",
    mimeType: "application/vnd.ms-excel",
    supportsAutoFill: false,
    relatedServices: ["Payroll Services", "NIS Compliance"],
    requiredFor: ["Electronic NIS Filing"],
    agencyUrl: "https://www.nis.org.gy/downloads",
    governmentFees: "Free",
    isStaffOnly: false,
    isFeatured: false,
  },
  {
    type: "AGENCY_FORM",
    category: "NIS",
    business: "GCMC",
    title: "NIS Maternity Benefit Claim (Form B700F2)",
    description:
      "Official NIS claim form for maternity benefits. Insured females can claim 13 weeks of maternity benefit. Requires at least 15 paid contributions in the 39 weeks before expected delivery.",
    shortDescription: "Claim maternity benefits from NIS",
    fileName: "NIS-Maternity-Benefit-Claim.pdf",
    storagePath: "knowledge-base/nis/NIS-Maternity-Benefit-Claim.pdf",
    mimeType: "application/pdf",
    supportsAutoFill: true,
    relatedServices: ["NIS Benefits Assistance"],
    requiredFor: ["Maternity Benefit Claim"],
    agencyUrl: "https://www.nis.org.gy/downloads",
    governmentFees:
      "No fee. Benefit: 70% of average insurable earnings for 13 weeks.",
    isStaffOnly: false,
    isFeatured: false,
  },
  {
    type: "AGENCY_FORM",
    category: "NIS",
    business: "GCMC",
    title: "NIS Old Age Pension Claim (Form P300F1)",
    description:
      "Official NIS claim form for old age pension. Insured persons aged 60+ (or 55 for women) with at least 750 paid contributions can claim pension. Earlier retirement available with reduced benefits.",
    shortDescription: "Claim NIS retirement pension",
    fileName: "NIS-Old-Age-Pension-Claim.pdf",
    storagePath: "knowledge-base/nis/NIS-Old-Age-Pension-Claim.pdf",
    mimeType: "application/pdf",
    supportsAutoFill: true,
    relatedServices: ["NIS Benefits Assistance", "Retirement Planning"],
    requiredFor: ["Retirement Pension Claim"],
    agencyUrl: "https://www.nis.org.gy/downloads",
    governmentFees:
      "No fee. Pension based on contribution history and earnings.",
    isStaffOnly: false,
    isFeatured: false,
  },
  {
    type: "AGENCY_FORM",
    category: "NIS",
    business: "GCMC",
    title: "NIS Employer Compliance Certificate (Form C100F72)",
    description:
      "Official NIS application for employer compliance certificate. Required for government contracts, tenders, and business licenses. Confirms employer is current with NIS obligations.",
    shortDescription: "Apply for NIS compliance certificate",
    fileName: "NIS-Employer-Compliance-Certificate.pdf",
    storagePath: "knowledge-base/nis/NIS-Employer-Compliance-Certificate.pdf",
    mimeType: "application/pdf",
    supportsAutoFill: true,
    relatedServices: ["NIS Compliance", "Government Contracts"],
    requiredFor: ["Tender Submissions", "Business Licenses"],
    agencyUrl: "https://www.nis.org.gy/downloads",
    governmentFees: "Free (if compliant)",
    isStaffOnly: false,
    isFeatured: true,
  },

  // Immigration Forms
  {
    type: "AGENCY_FORM",
    category: "IMMIGRATION",
    business: "GCMC",
    title: "Employment Visa Application Form",
    description:
      "Official Ministry of Home Affairs form for employment visa (work permit). For foreign nationals seeking employment in Guyana. Includes sections for applicant information and sponsor/employer details.",
    shortDescription: "Apply for work permit in Guyana",
    fileName: "Immigration-Employment-Visa-Application.pdf",
    storagePath:
      "knowledge-base/immigration/Immigration-Employment-Visa-Application.pdf",
    mimeType: "application/pdf",
    supportsAutoFill: true,
    relatedServices: ["Work Permit Application", "Immigration Services"],
    requiredFor: ["Foreign Worker Employment", "Work Authorization"],
    agencyUrl: "https://moha.gov.gy/",
    governmentFees: "GYD 50,000 - 150,000 depending on duration",
    isStaffOnly: false,
    isFeatured: true,
  },
  {
    type: "AGENCY_FORM",
    category: "IMMIGRATION",
    business: "GCMC",
    title: "Work Permit Application Form (New)",
    description:
      "Official Ministry of Foreign Affairs work permit application form. For non-nationals wishing to work for a company in Guyana. Requires sworn particulars in support of the application.",
    shortDescription: "Work permit for foreign nationals",
    fileName: "Immigration-Work-Permit-Application.pdf",
    storagePath:
      "knowledge-base/immigration/Immigration-Work-Permit-Application.pdf",
    mimeType: "application/pdf",
    supportsAutoFill: true,
    relatedServices: ["Work Permit Application", "Immigration Services"],
    requiredFor: ["Foreign Worker Employment"],
    agencyUrl:
      "https://www.oldminfor.minfor.gov.gy/sites/default/files/2022-02/WORK_PERMIT_APPLICATION_FORM.pdf",
    governmentFees: "GYD 50,000 - 150,000 depending on duration",
    isStaffOnly: false,
    isFeatured: true,
  },
  {
    type: "AGENCY_FORM",
    category: "IMMIGRATION",
    business: "GCMC",
    title: "Work Permit Renewal Application",
    description:
      "Form for renewing an existing work permit in Guyana. Must be submitted at least 30 days before current permit expires. Requires proof of continued employment.",
    shortDescription: "Renew existing work permit",
    supportsAutoFill: true,
    relatedServices: ["Work Permit Renewal", "Immigration Services"],
    requiredFor: ["Work Permit Extension"],
    agencyUrl: "https://moha.gov.gy/",
    governmentFees: "GYD 30,000 - 100,000 depending on duration",
    isStaffOnly: false,
    isFeatured: false,
  },
  {
    type: "AGENCY_FORM",
    category: "IMMIGRATION",
    business: "GCMC",
    title: "Visitor Visa Application Form",
    description:
      "Application form for visitor visa to Guyana. For tourists, family visits, and short-term business trips. Single entry valid for up to 90 days.",
    shortDescription: "Tourist and visitor visa application",
    supportsAutoFill: true,
    relatedServices: ["Visa Services", "Immigration Consulting"],
    requiredFor: ["Tourist Entry", "Family Visit"],
    agencyUrl: "https://moha.gov.gy/",
    governmentFees: "USD 50 - 100",
    isStaffOnly: false,
    isFeatured: false,
  },
  {
    type: "AGENCY_FORM",
    category: "IMMIGRATION",
    business: "GCMC",
    title: "Business Visa Application Form",
    description:
      "Application for business visa to Guyana. For attending meetings, conferences, negotiations, or exploring business opportunities. Does not permit employment.",
    shortDescription: "Business travel visa application",
    supportsAutoFill: true,
    relatedServices: ["Business Immigration", "Visa Services"],
    requiredFor: ["Business Travel", "Conference Attendance"],
    agencyUrl: "https://moha.gov.gy/",
    governmentFees: "USD 100 - 200",
    isStaffOnly: false,
    isFeatured: false,
  },
  {
    type: "AGENCY_FORM",
    category: "IMMIGRATION",
    business: "GCMC",
    title: "Student Visa Application Form",
    description:
      "Application form for student visa. For foreign nationals enrolled in educational institutions in Guyana. Requires proof of enrollment and financial support.",
    shortDescription: "Student visa for education",
    supportsAutoFill: true,
    relatedServices: ["Student Immigration", "Visa Services"],
    requiredFor: ["Student Enrollment", "Education in Guyana"],
    agencyUrl: "https://moha.gov.gy/",
    governmentFees: "USD 50 - 75",
    isStaffOnly: false,
    isFeatured: false,
  },
  {
    type: "AGENCY_FORM",
    category: "IMMIGRATION",
    business: "GCMC",
    title: "Residence Permit Application",
    description:
      "Application for permanent or temporary residence permit in Guyana. For foreign nationals seeking to reside in Guyana for extended periods.",
    shortDescription: "Residence permit application",
    supportsAutoFill: true,
    relatedServices: ["Residence Permit", "Immigration Services"],
    requiredFor: ["Permanent Residency", "Long-term Stay"],
    agencyUrl: "https://moha.gov.gy/",
    governmentFees: "GYD 100,000 - 500,000",
    isStaffOnly: false,
    isFeatured: true,
  },
  {
    type: "AGENCY_FORM",
    category: "IMMIGRATION",
    business: "GCMC",
    title: "Visa Extension Request Form",
    description:
      "Form to request extension of existing visa. Must be submitted before current visa expires. Extensions granted at discretion of immigration authorities.",
    shortDescription: "Extend current visa duration",
    supportsAutoFill: true,
    relatedServices: ["Visa Extension", "Immigration Services"],
    requiredFor: ["Extended Stay"],
    agencyUrl: "https://moha.gov.gy/",
    governmentFees: "GYD 20,000 - 50,000",
    isStaffOnly: false,
    isFeatured: false,
  },
  {
    type: "AGENCY_FORM",
    category: "IMMIGRATION",
    business: "GCMC",
    title: "Re-entry Permit Application",
    description:
      "Application for re-entry permit. Allows residents to travel abroad and return without losing their residence status.",
    shortDescription: "Re-entry permit for residents",
    supportsAutoFill: true,
    relatedServices: ["Re-entry Permit", "Immigration Services"],
    requiredFor: ["International Travel", "Preserve Residence Status"],
    agencyUrl: "https://moha.gov.gy/",
    governmentFees: "GYD 10,000 - 30,000",
    isStaffOnly: false,
    isFeatured: false,
  },
  {
    type: "AGENCY_FORM",
    category: "IMMIGRATION",
    business: "GCMC",
    title: "Dependent Visa Application",
    description:
      "Application for dependent visa. For spouses and children of work permit holders or residents to join them in Guyana.",
    shortDescription: "Visa for family members",
    supportsAutoFill: true,
    relatedServices: ["Family Immigration", "Visa Services"],
    requiredFor: ["Family Reunification"],
    agencyUrl: "https://moha.gov.gy/",
    governmentFees: "USD 75 - 150 per dependent",
    isStaffOnly: false,
    isFeatured: false,
  },
  {
    type: "AGENCY_FORM",
    category: "IMMIGRATION",
    business: "GCMC",
    title: "Investor Visa Application",
    description:
      "Application for investor visa. For foreign nationals making substantial investments in Guyana. Requires proof of investment amount and business plan.",
    shortDescription: "Visa for investors",
    supportsAutoFill: true,
    relatedServices: ["Investment Immigration", "Business Setup"],
    requiredFor: ["Foreign Investment", "Business Establishment"],
    agencyUrl: "https://moha.gov.gy/",
    governmentFees: "USD 500 - 1,000",
    isStaffOnly: false,
    isFeatured: true,
  },

  // ============================================
  // DCRA FORMS - Deeds & Commercial Registry
  // ============================================
  {
    type: "AGENCY_FORM",
    category: "DCRA",
    business: "GCMC",
    title: "Company Incorporation Form",
    description:
      "Official form for incorporating a new company in Guyana under the Companies Act. Includes Articles of Incorporation, Director appointments, and share structure.",
    shortDescription: "Register new company",
    supportsAutoFill: true,
    relatedServices: ["Company Registration", "Business Setup"],
    requiredFor: ["New Company Formation", "Business Establishment"],
    agencyUrl: "https://dcra.gov.gy",
    governmentFees: "GYD 25,000 - 50,000 plus stamp duty",
    isStaffOnly: false,
    isFeatured: true,
  },
  {
    type: "AGENCY_FORM",
    category: "DCRA",
    business: "GCMC",
    title: "Business Name Registration",
    description:
      "Application to register a business name (trading as). Required for sole proprietors and partnerships operating under a business name different from their own.",
    shortDescription: "Register trading name",
    supportsAutoFill: true,
    relatedServices: ["Business Registration", "Sole Proprietorship"],
    requiredFor: ["Business Name Registration", "Trading Name"],
    agencyUrl: "https://dcra.gov.gy",
    governmentFees: "GYD 5,000 - 10,000",
    isStaffOnly: false,
    isFeatured: true,
  },
  {
    type: "AGENCY_FORM",
    category: "DCRA",
    business: "GCMC",
    title: "Foreign Company Registration",
    description:
      "Registration form for foreign companies establishing a branch or subsidiary in Guyana. Requires certified copies of incorporation documents from country of origin.",
    shortDescription: "Register foreign company branch",
    supportsAutoFill: true,
    relatedServices: ["Foreign Company Registration", "Business Setup"],
    requiredFor: ["Foreign Business Establishment"],
    agencyUrl: "https://dcra.gov.gy",
    governmentFees: "GYD 100,000 - 200,000",
    isStaffOnly: false,
    isFeatured: false,
  },
  {
    type: "AGENCY_FORM",
    category: "DCRA",
    business: "GCMC",
    title: "Company Annual Return",
    description:
      "Annual return form required for all registered companies. Must be filed within 42 days of AGM. Includes details of directors, shareholders, and registered office.",
    shortDescription: "Annual company filing",
    supportsAutoFill: true,
    relatedServices: ["Annual Compliance", "Company Secretarial"],
    requiredFor: ["Annual Compliance", "Company Good Standing"],
    agencyUrl: "https://dcra.gov.gy",
    governmentFees: "GYD 10,000 - 25,000",
    isStaffOnly: false,
    isFeatured: true,
  },
  {
    type: "AGENCY_FORM",
    category: "DCRA",
    business: "GCMC",
    title: "Change of Directors Notification",
    description:
      "Form to notify DCRA of changes to company directors. Must be filed within 14 days of appointment or resignation.",
    shortDescription: "Update director information",
    supportsAutoFill: true,
    relatedServices: ["Company Changes", "Corporate Governance"],
    requiredFor: ["Director Appointment", "Director Resignation"],
    agencyUrl: "https://dcra.gov.gy",
    governmentFees: "GYD 5,000",
    isStaffOnly: false,
    isFeatured: false,
  },
  {
    type: "AGENCY_FORM",
    category: "DCRA",
    business: "GCMC",
    title: "Change of Registered Office",
    description:
      "Notification form for change of company's registered office address. Effective 14 days after filing unless otherwise specified.",
    shortDescription: "Update company address",
    supportsAutoFill: true,
    relatedServices: ["Company Changes", "Address Update"],
    requiredFor: ["Office Relocation"],
    agencyUrl: "https://dcra.gov.gy",
    governmentFees: "GYD 3,000",
    isStaffOnly: false,
    isFeatured: false,
  },
  {
    type: "AGENCY_FORM",
    category: "DCRA",
    business: "GCMC",
    title: "Change of Company Name",
    description:
      "Application to change company name. Requires special resolution of shareholders and name availability search.",
    shortDescription: "Change company name",
    supportsAutoFill: true,
    relatedServices: ["Company Changes", "Rebranding"],
    requiredFor: ["Company Name Change"],
    agencyUrl: "https://dcra.gov.gy",
    governmentFees: "GYD 15,000 - 25,000",
    isStaffOnly: false,
    isFeatured: false,
  },
  {
    type: "AGENCY_FORM",
    category: "DCRA",
    business: "GCMC",
    title: "Share Transfer Form",
    description:
      "Form for transferring shares between shareholders. Requires stamp duty payment based on share value.",
    shortDescription: "Transfer company shares",
    supportsAutoFill: true,
    relatedServices: ["Share Transfers", "Corporate Transactions"],
    requiredFor: ["Share Sale", "Ownership Change"],
    agencyUrl: "https://dcra.gov.gy",
    governmentFees: "GYD 5,000 plus stamp duty (2% of share value)",
    isStaffOnly: false,
    isFeatured: false,
  },
  {
    type: "AGENCY_FORM",
    category: "DCRA",
    business: "GCMC",
    title: "Capital Increase Application",
    description:
      "Application to increase company's authorized share capital. Requires special resolution and amended articles.",
    shortDescription: "Increase company capital",
    supportsAutoFill: true,
    relatedServices: ["Corporate Finance", "Capital Structure"],
    requiredFor: ["Capital Increase", "Investment Round"],
    agencyUrl: "https://dcra.gov.gy",
    governmentFees: "GYD 10,000 plus stamp duty",
    isStaffOnly: false,
    isFeatured: false,
  },
  {
    type: "AGENCY_FORM",
    category: "DCRA",
    business: "GCMC",
    title: "Voluntary Dissolution Form",
    description:
      "Application for voluntary winding up of a company. Requires special resolution and settlement of all debts and obligations.",
    shortDescription: "Close company voluntarily",
    supportsAutoFill: true,
    relatedServices: ["Company Dissolution", "Business Closure"],
    requiredFor: ["Company Wind-up", "Business Closure"],
    agencyUrl: "https://dcra.gov.gy",
    governmentFees: "GYD 25,000",
    isStaffOnly: false,
    isFeatured: false,
  },
  {
    type: "AGENCY_FORM",
    category: "DCRA",
    business: "GCMC",
    title: "Company Restoration Application",
    description:
      "Application to restore a struck-off or dissolved company to the register. Must demonstrate valid reasons and settle outstanding filings.",
    shortDescription: "Restore dissolved company",
    supportsAutoFill: true,
    relatedServices: ["Company Restoration", "Corporate Recovery"],
    requiredFor: ["Company Revival"],
    agencyUrl: "https://dcra.gov.gy",
    governmentFees: "GYD 50,000 plus penalties",
    isStaffOnly: false,
    isFeatured: false,
  },
  {
    type: "AGENCY_FORM",
    category: "DCRA",
    business: "GCMC",
    title: "Partnership Registration",
    description:
      "Form to register a partnership business. Required for all formal partnerships operating in Guyana.",
    shortDescription: "Register partnership",
    supportsAutoFill: true,
    relatedServices: ["Partnership Formation", "Business Registration"],
    requiredFor: ["Partnership Setup"],
    agencyUrl: "https://dcra.gov.gy",
    governmentFees: "GYD 10,000 - 20,000",
    isStaffOnly: false,
    isFeatured: false,
  },

  // ============================================
  // SBB FORMS - Small Business Bureau
  // ============================================
  {
    type: "AGENCY_FORM",
    category: "GENERAL",
    business: "GCMC",
    title: "SBB Small Business Registration",
    description:
      "Registration form for the Small Business Bureau. Provides access to SBB programs, training, and financing options for small businesses.",
    shortDescription: "Register with Small Business Bureau",
    supportsAutoFill: true,
    relatedServices: ["Small Business Support", "Business Development"],
    requiredFor: ["SBB Programs", "Small Business Financing"],
    agencyUrl: "https://sbb.gov.gy",
    governmentFees: "Free",
    isStaffOnly: false,
    isFeatured: true,
  },
  {
    type: "AGENCY_FORM",
    category: "GENERAL",
    business: "GCMC",
    title: "SBB Small Business Loan Application",
    description:
      "Application for small business loan through SBB. Competitive interest rates for registered small businesses. Requires business plan and financial projections.",
    shortDescription: "Apply for SBB loan",
    supportsAutoFill: true,
    relatedServices: ["Business Financing", "Loan Applications"],
    requiredFor: ["Business Loan", "Capital Acquisition"],
    agencyUrl: "https://sbb.gov.gy",
    governmentFees: "Processing fee varies",
    isStaffOnly: false,
    isFeatured: true,
  },
  {
    type: "AGENCY_FORM",
    category: "GENERAL",
    business: "GCMC",
    title: "SBB Business Grant Application",
    description:
      "Application for SBB business grants. Various grant programs available for eligible small businesses including startup grants and expansion grants.",
    shortDescription: "Apply for business grant",
    supportsAutoFill: true,
    relatedServices: ["Grant Applications", "Business Funding"],
    requiredFor: ["Grant Funding", "Business Expansion"],
    agencyUrl: "https://sbb.gov.gy",
    governmentFees: "Free",
    isStaffOnly: false,
    isFeatured: false,
  },
  {
    type: "AGENCY_FORM",
    category: "TRAINING",
    business: "GCMC",
    title: "SBB Training Program Registration",
    description:
      "Registration for SBB business training programs. Various courses available including business management, marketing, and financial literacy.",
    shortDescription: "Register for SBB training",
    supportsAutoFill: true,
    relatedServices: ["Business Training", "Capacity Building"],
    requiredFor: ["Skills Development", "Business Education"],
    agencyUrl: "https://sbb.gov.gy",
    governmentFees: "Varies by program",
    isStaffOnly: false,
    isFeatured: false,
  },
  {
    type: "AGENCY_FORM",
    category: "GENERAL",
    business: "GCMC",
    title: "SBB Certificate Application",
    description:
      "Application for Small Business Bureau certification. Certifies business as a registered small business for government contracts and programs.",
    shortDescription: "SBB certification application",
    supportsAutoFill: true,
    relatedServices: ["Business Certification", "Government Contracts"],
    requiredFor: ["Small Business Certification", "Tender Eligibility"],
    agencyUrl: "https://sbb.gov.gy",
    governmentFees: "GYD 5,000",
    isStaffOnly: false,
    isFeatured: false,
  },

  // ============================================
  // MINISTRY OF LABOUR FORMS
  // ============================================
  {
    type: "AGENCY_FORM",
    category: "GENERAL",
    business: "GCMC",
    title: "Standard Employment Contract Template",
    description:
      "Ministry of Labour standard employment contract template. Compliant with Guyana labour laws including probation, benefits, and termination provisions.",
    shortDescription: "Standard employment contract",
    supportsAutoFill: true,
    relatedServices: ["HR Services", "Employment Documentation"],
    requiredFor: ["Employee Hiring", "Contract Compliance"],
    agencyUrl: "https://mol.gov.gy",
    governmentFees: "Free",
    isStaffOnly: false,
    isFeatured: true,
  },
  {
    type: "AGENCY_FORM",
    category: "GENERAL",
    business: "GCMC",
    title: "Employee Termination Notice Template",
    description:
      "Official termination notice template compliant with Labour Act requirements. Includes notice period calculations and severance provisions.",
    shortDescription: "Employee termination notice",
    supportsAutoFill: true,
    relatedServices: ["HR Services", "Employment Termination"],
    requiredFor: ["Employee Termination", "Layoffs"],
    agencyUrl: "https://mol.gov.gy",
    governmentFees: "Free",
    isStaffOnly: true,
    isFeatured: false,
  },
  {
    type: "AGENCY_FORM",
    category: "GENERAL",
    business: "GCMC",
    title: "Severance Pay Calculation Worksheet",
    description:
      "Worksheet for calculating severance pay per Guyana labour laws. Based on years of service and last drawn salary.",
    shortDescription: "Calculate severance payments",
    supportsAutoFill: true,
    relatedServices: ["HR Services", "Payroll"],
    requiredFor: ["Severance Calculation", "Termination Processing"],
    agencyUrl: "https://mol.gov.gy",
    governmentFees: "Free",
    isStaffOnly: true,
    isFeatured: false,
  },
  {
    type: "AGENCY_FORM",
    category: "GENERAL",
    business: "GCMC",
    title: "Extended Work Hours Application",
    description:
      "Application to Ministry of Labour for permission to work extended hours beyond normal limits. Required for shift work or overtime arrangements.",
    shortDescription: "Apply for extended work hours",
    supportsAutoFill: true,
    relatedServices: ["Labour Compliance", "Work Arrangements"],
    requiredFor: ["Overtime Approval", "Shift Work"],
    agencyUrl: "https://mol.gov.gy",
    governmentFees: "GYD 5,000",
    isStaffOnly: false,
    isFeatured: false,
  },
  {
    type: "AGENCY_FORM",
    category: "GENERAL",
    business: "GCMC",
    title: "Minor Employment Authorization",
    description:
      "Authorization form for employing persons under 18 years. Requires parental consent and compliance with child labour restrictions.",
    shortDescription: "Authorize minor employment",
    supportsAutoFill: true,
    relatedServices: ["Labour Compliance", "Youth Employment"],
    requiredFor: ["Minor Employment", "Apprenticeship"],
    agencyUrl: "https://mol.gov.gy",
    governmentFees: "Free",
    isStaffOnly: true,
    isFeatured: false,
  },
  {
    type: "AGENCY_FORM",
    category: "GENERAL",
    business: "GCMC",
    title: "Industrial Relations Registration",
    description:
      "Form for registration of trade unions or employer associations with the Ministry of Labour.",
    shortDescription: "Register union/association",
    supportsAutoFill: true,
    relatedServices: ["Industrial Relations", "Union Registration"],
    requiredFor: ["Union Formation", "Collective Bargaining"],
    agencyUrl: "https://mol.gov.gy",
    governmentFees: "GYD 10,000",
    isStaffOnly: false,
    isFeatured: false,
  },

  // ============================================
  // EPA FORMS - Environmental Protection Agency
  // ============================================
  {
    type: "AGENCY_FORM",
    category: "GENERAL",
    business: "GCMC",
    title: "EPA Environmental Permit Application",
    description:
      "Application for environmental permit from the Environmental Protection Agency. Required for activities with potential environmental impact.",
    shortDescription: "Environmental permit application",
    supportsAutoFill: true,
    relatedServices: ["Environmental Compliance", "Permit Applications"],
    requiredFor: ["Environmental Approval", "Project Commencement"],
    agencyUrl: "https://epaguyana.org",
    governmentFees: "GYD 50,000 - 500,000 depending on project",
    isStaffOnly: false,
    isFeatured: true,
  },
  {
    type: "AGENCY_FORM",
    category: "GENERAL",
    business: "GCMC",
    title: "EPA Environmental Impact Assessment Form",
    description:
      "Environmental Impact Assessment (EIA) submission form. Required for major projects with significant environmental implications.",
    shortDescription: "Submit EIA",
    supportsAutoFill: false,
    relatedServices: ["Environmental Consulting", "Project Planning"],
    requiredFor: ["Major Project Approval", "EIA Compliance"],
    agencyUrl: "https://epaguyana.org",
    governmentFees: "GYD 200,000 - 1,000,000",
    isStaffOnly: false,
    isFeatured: false,
  },
  {
    type: "AGENCY_FORM",
    category: "GENERAL",
    business: "GCMC",
    title: "EPA Environmental Compliance Report",
    description:
      "Annual environmental compliance report form. Required for permit holders to demonstrate ongoing compliance with environmental conditions.",
    shortDescription: "Annual environmental report",
    supportsAutoFill: true,
    relatedServices: ["Environmental Compliance", "Annual Reporting"],
    requiredFor: ["Permit Maintenance", "Compliance Verification"],
    agencyUrl: "https://epaguyana.org",
    governmentFees: "GYD 25,000",
    isStaffOnly: false,
    isFeatured: false,
  },

  // ============================================
  // GNBS FORMS - Guyana National Bureau of Standards
  // ============================================
  {
    type: "AGENCY_FORM",
    category: "GENERAL",
    business: "GCMC",
    title: "GNBS Product Certification Application",
    description:
      "Application for GNBS product certification. Required for products requiring standards certification before sale in Guyana.",
    shortDescription: "Product certification",
    supportsAutoFill: true,
    relatedServices: ["Product Certification", "Quality Assurance"],
    requiredFor: ["Product Launch", "Market Entry"],
    agencyUrl: "https://gnbs.gov.gy",
    governmentFees: "GYD 20,000 - 100,000 depending on product",
    isStaffOnly: false,
    isFeatured: false,
  },
  {
    type: "AGENCY_FORM",
    category: "GENERAL",
    business: "GCMC",
    title: "GNBS Import Permit Application",
    description:
      "Application for import permit for regulated products. Required for importing products subject to GNBS standards.",
    shortDescription: "Import permit application",
    supportsAutoFill: true,
    relatedServices: ["Import Services", "Trade Compliance"],
    requiredFor: ["Product Import", "Trade Clearance"],
    agencyUrl: "https://gnbs.gov.gy",
    governmentFees: "GYD 10,000 - 50,000",
    isStaffOnly: false,
    isFeatured: false,
  },
  {
    type: "AGENCY_FORM",
    category: "GENERAL",
    business: "GCMC",
    title: "GNBS Inspection Request Form",
    description:
      "Form to request GNBS inspection of products, facilities, or processes. Various inspection types available.",
    shortDescription: "Request GNBS inspection",
    supportsAutoFill: true,
    relatedServices: ["Quality Inspection", "Compliance Verification"],
    requiredFor: ["Product Quality", "Facility Certification"],
    agencyUrl: "https://gnbs.gov.gy",
    governmentFees: "GYD 15,000 - 75,000",
    isStaffOnly: false,
    isFeatured: false,
  },

  // ============================================
  // ADDITIONAL GRA FORMS
  // ============================================
  {
    type: "AGENCY_FORM",
    category: "GRA",
    business: "KAJ",
    title: "Taxpayer Registration Form - Individual (R400F1)",
    description:
      "Official GRA form for individual TIN registration. Required for all individuals earning income in Guyana including employees and self-employed persons.",
    shortDescription: "Register individual for TIN",
    supportsAutoFill: true,
    relatedServices: ["Tax Registration", "Individual Tax Services"],
    requiredFor: ["Employment", "Self-Employment", "Tax Compliance"],
    agencyUrl: "https://www.gra.gov.gy",
    governmentFees: "Free",
    isStaffOnly: false,
    isFeatured: true,
  },
  {
    type: "AGENCY_FORM",
    category: "GRA",
    business: "KAJ",
    title: "Tax Clearance Certificate Request",
    description:
      "Application for GRA Tax Clearance Certificate. Required for government contracts, tenders, and certain business transactions.",
    shortDescription: "Apply for tax clearance",
    supportsAutoFill: true,
    relatedServices: ["Tax Compliance", "Government Contracts"],
    requiredFor: [
      "Tender Submissions",
      "Loan Applications",
      "Business Licenses",
    ],
    agencyUrl: "https://www.gra.gov.gy",
    governmentFees: "Free (if compliant)",
    isStaffOnly: false,
    isFeatured: true,
  },
  {
    type: "AGENCY_FORM",
    category: "GRA",
    business: "KAJ",
    title: "Tax Assessment Objection Form",
    description:
      "Form to object to a GRA tax assessment. Must be filed within 30 days of receiving assessment notice.",
    shortDescription: "Object to tax assessment",
    supportsAutoFill: true,
    relatedServices: ["Tax Disputes", "Tax Appeals"],
    requiredFor: ["Assessment Objection", "Tax Dispute"],
    agencyUrl: "https://www.gra.gov.gy",
    governmentFees: "Free",
    isStaffOnly: false,
    isFeatured: false,
  },
  {
    type: "AGENCY_FORM",
    category: "GRA",
    business: "KAJ",
    title: "Tax Refund Application",
    description:
      "Application for refund of overpaid taxes. Requires supporting documentation of overpayment.",
    shortDescription: "Apply for tax refund",
    supportsAutoFill: true,
    relatedServices: ["Tax Refunds", "Tax Services"],
    requiredFor: ["Tax Overpayment Recovery"],
    agencyUrl: "https://www.gra.gov.gy",
    governmentFees: "Free",
    isStaffOnly: false,
    isFeatured: false,
  },
  {
    type: "AGENCY_FORM",
    category: "GRA",
    business: "KAJ",
    title: "Withholding Tax Return Form",
    description:
      "Monthly withholding tax return for payers making payments subject to withholding tax (rent, interest, dividends, etc.).",
    shortDescription: "File withholding tax return",
    supportsAutoFill: true,
    relatedServices: ["Tax Compliance", "Withholding Tax"],
    requiredFor: ["Monthly WHT Compliance"],
    agencyUrl: "https://www.gra.gov.gy",
    governmentFees: "No filing fee",
    isStaffOnly: false,
    isFeatured: false,
  },
  {
    type: "AGENCY_FORM",
    category: "GRA",
    business: "KAJ",
    title: "Penalty Waiver Request Form",
    description:
      "Application to request waiver of penalties and interest. Requires valid justification and proof of circumstances.",
    shortDescription: "Request penalty waiver",
    supportsAutoFill: true,
    relatedServices: ["Tax Relief", "Penalty Abatement"],
    requiredFor: ["Penalty Relief", "Voluntary Disclosure"],
    agencyUrl: "https://www.gra.gov.gy",
    governmentFees: "Free",
    isStaffOnly: false,
    isFeatured: false,
  },

  // ============================================
  // ADDITIONAL NIS FORMS
  // ============================================
  {
    type: "AGENCY_FORM",
    category: "NIS",
    business: "KAJ",
    title: "NIS Sickness Benefit Claim (Form B500F3)",
    description:
      "Claim form for NIS sickness benefits. Requires minimum contribution record and medical certification. Benefit: 70% of average earnings.",
    shortDescription: "Claim sickness benefit",
    supportsAutoFill: true,
    relatedServices: ["NIS Benefits", "Employee Benefits"],
    requiredFor: ["Sickness Benefit Claim"],
    agencyUrl: "https://www.nis.org.gy",
    governmentFees: "Free",
    isStaffOnly: false,
    isFeatured: false,
  },
  {
    type: "AGENCY_FORM",
    category: "NIS",
    business: "KAJ",
    title: "NIS Funeral Grant Application (Form P800F1)",
    description:
      "Application for NIS funeral grant upon death of insured person. Fixed benefit amount to assist with funeral expenses.",
    shortDescription: "Apply for funeral grant",
    supportsAutoFill: true,
    relatedServices: ["NIS Benefits", "Death Benefits"],
    requiredFor: ["Funeral Grant Claim"],
    agencyUrl: "https://www.nis.org.gy",
    governmentFees: "Free",
    isStaffOnly: false,
    isFeatured: false,
  },
  {
    type: "AGENCY_FORM",
    category: "NIS",
    business: "KAJ",
    title: "NIS Survivor's Benefit Claim (Form P400F1)",
    description:
      "Claim form for survivor's benefits upon death of insured person. For eligible surviving spouses and dependents.",
    shortDescription: "Claim survivor's benefit",
    supportsAutoFill: true,
    relatedServices: ["NIS Benefits", "Death Benefits"],
    requiredFor: ["Survivor's Benefit Claim"],
    agencyUrl: "https://www.nis.org.gy",
    governmentFees: "Free",
    isStaffOnly: false,
    isFeatured: false,
  },
  {
    type: "AGENCY_FORM",
    category: "NIS",
    business: "KAJ",
    title: "NIS Invalidity Benefit Claim (Form D200F1)",
    description:
      "Claim form for NIS invalidity benefit. For insured persons permanently unable to work due to illness or injury.",
    shortDescription: "Claim invalidity benefit",
    supportsAutoFill: true,
    relatedServices: ["NIS Benefits", "Disability Benefits"],
    requiredFor: ["Invalidity Benefit Claim"],
    agencyUrl: "https://www.nis.org.gy",
    governmentFees: "Free",
    isStaffOnly: false,
    isFeatured: false,
  },
  {
    type: "AGENCY_FORM",
    category: "NIS",
    business: "KAJ",
    title: "NIS Card Replacement Request",
    description:
      "Form to request replacement of lost, stolen, or damaged NIS card. Original NIS number will be retained.",
    shortDescription: "Replace NIS card",
    supportsAutoFill: true,
    relatedServices: ["NIS Services", "Card Replacement"],
    requiredFor: ["NIS Card Replacement"],
    agencyUrl: "https://www.nis.org.gy",
    governmentFees: "GYD 500",
    isStaffOnly: false,
    isFeatured: false,
  },
];

// ============================================
// LETTER TEMPLATES
// ============================================

type LetterTemplateConfig = {
  title: string;
  description: string;
  shortDescription: string;
  category: KnowledgeBaseCategory;
  business: Business;
  fileName: string;
  isStaffOnly: boolean;
  isFeatured: boolean;
  relatedServices: string[];
  requiredFor: string[];
  paragraphs: { heading?: string; text: string; isPlaceholder?: boolean }[];
};

const letterTemplateConfigs: LetterTemplateConfig[] = [
  {
    title: "Engagement Letter - Tax Services",
    description:
      "Professional engagement letter template for tax preparation and compliance services. Outlines scope of work, fees, client responsibilities, and terms of engagement.",
    shortDescription: "Tax services engagement agreement",
    category: "GENERAL",
    business: "GCMC",
    fileName: "Engagement-Letter-Tax-Services.docx",
    isStaffOnly: false,
    isFeatured: true,
    relatedServices: ["Tax Filing", "Tax Compliance", "Tax Planning"],
    requiredFor: ["Client Onboarding", "Service Commencement"],
    paragraphs: [
      { text: "[COMPANY LETTERHEAD]" },
      { text: "{{current_date}}", isPlaceholder: true },
      { text: "{{client_name}}\n{{client_address}}", isPlaceholder: true },
      { text: "Dear {{client_salutation}}," },
      {
        heading: "RE: ENGAGEMENT LETTER - TAX SERVICES",
        text: "We are pleased to confirm our appointment as your tax advisors for the {{tax_year}} tax year. This letter outlines the terms of our engagement and the services we will provide.",
      },
      {
        heading: "SCOPE OF SERVICES",
        text: "We will provide the following tax services:\n- Preparation and filing of annual income tax returns\n- Tax planning and advisory services\n- Representation in correspondence with GRA\n- Quarterly tax estimates and compliance reviews",
      },
      {
        heading: "OUR RESPONSIBILITIES",
        text: "1. Prepare your tax returns based on information you provide\n2. Advise on tax planning opportunities\n3. Represent you in correspondence with GRA\n4. Meet all filing deadlines for returns we prepare",
      },
      {
        heading: "YOUR RESPONSIBILITIES",
        text: "1. Provide complete and accurate information\n2. Respond promptly to our requests for information\n3. Review and approve returns before filing\n4. Make timely payment of fees",
      },
      {
        heading: "FEES",
        text: "Our fees for the above services will be {{fee_amount}}. Additional services will be billed at our standard hourly rates. Payment is due within 14 days of invoice.",
      },
      {
        heading: "CONFIDENTIALITY",
        text: "All information you provide will be treated as confidential and will not be disclosed to third parties except as required by law.",
      },
      {
        text: "Please sign and return one copy of this letter to confirm your acceptance of these terms.\n\nYours faithfully,\n\n____________________\n{{staff_name}}\n{{staff_title}}\n{{company_name}}\n\nACCEPTED AND AGREED:\n\n____________________\n{{client_name}}\nDate: ________________",
      },
    ],
  },
  {
    title: "Client Welcome Letter",
    description:
      "Professional welcome letter template for new clients. Provides key information about services, team contacts, portal access, and next steps.",
    shortDescription: "Welcome new clients",
    category: "GENERAL",
    business: null,
    fileName: "Client-Welcome-Letter.docx",
    isStaffOnly: false,
    isFeatured: true,
    relatedServices: ["Client Onboarding"],
    requiredFor: ["New Client Setup"],
    paragraphs: [
      { text: "[COMPANY LETTERHEAD]" },
      { text: "{{current_date}}", isPlaceholder: true },
      { text: "{{client_name}}\n{{client_address}}", isPlaceholder: true },
      { text: "Dear {{client_salutation}}," },
      {
        heading: "WELCOME TO {{company_name}}",
        text: "On behalf of our entire team, I would like to extend a warm welcome and thank you for choosing us as your trusted partner.",
      },
      {
        heading: "YOUR ACCOUNT TEAM",
        text: "Primary Contact: {{primary_contact}}\nEmail: {{contact_email}}\nPhone: {{contact_phone}}",
      },
      {
        heading: "CLIENT PORTAL ACCESS",
        text: "We have set up your secure client portal. Your login credentials will be sent separately.\n\nThrough the portal, you can:\n- Upload and download documents securely\n- Track the status of your matters\n- Communicate with our team\n- View invoices and make payments\n- Request appointments",
      },
      {
        heading: "NEXT STEPS",
        text: "1. Log in to the client portal and update your password\n2. Complete your profile information\n3. Upload any pending documents\n4. Schedule an introductory meeting with your account manager",
      },
      {
        text: "We are committed to providing you with exceptional service and look forward to a successful partnership.\n\nWarm regards,\n\n____________________\n{{staff_name}}\n{{staff_title}}\n{{company_name}}",
      },
    ],
  },
  {
    title: "Collection Letter - Overdue Payment",
    description:
      "Professional reminder letter template for overdue payments. First-stage collection letter with payment options and account details.",
    shortDescription: "Payment reminder letter",
    category: "GENERAL",
    business: null,
    fileName: "Collection-Letter-Overdue.docx",
    isStaffOnly: true,
    isFeatured: false,
    relatedServices: ["Collections", "Accounts Receivable"],
    requiredFor: ["Overdue Invoice Follow-up"],
    paragraphs: [
      { text: "[COMPANY LETTERHEAD]" },
      { text: "{{current_date}}", isPlaceholder: true },
      { text: "{{client_name}}\n{{client_address}}", isPlaceholder: true },
      { text: "Dear {{client_salutation}}," },
      {
        heading: "OVERDUE PAYMENT REMINDER - INVOICE {{invoice_number}}",
        text: "We are writing to remind you that the following invoice remains unpaid:",
      },
      {
        text: "Invoice Number: {{invoice_number}}\nInvoice Date: {{invoice_date}}\nOriginal Due Date: {{due_date}}\nDays Overdue: {{days_overdue}}\nAmount Outstanding: {{outstanding_amount}}",
      },
      {
        text: "We understand that oversights can happen, and we would appreciate your prompt attention to this matter.",
      },
      {
        heading: "PAYMENT OPTIONS",
        text: "1. Bank Transfer:\n   Bank: {{bank_name}}\n   Account: {{account_number}}\n   Reference: {{invoice_number}}\n\n2. Online Payment:\n   Visit {{payment_portal_url}} to pay by credit card",
      },
      {
        text: "If you have already made this payment, please disregard this notice and accept our thanks.\n\nIf you are experiencing difficulties making payment, please contact us to discuss payment arrangements.\n\nWe value our business relationship and look forward to your prompt response.\n\nYours sincerely,\n\n____________________\n{{staff_name}}\nAccounts Department\n{{company_name}}",
      },
    ],
  },
  {
    title: "Tax Filing Confirmation Letter",
    description:
      "Confirmation letter template for successful tax return filing with GRA. Includes filing reference numbers, tax summary, and key dates.",
    shortDescription: "Confirm tax return filing",
    category: "GRA",
    business: "GCMC",
    fileName: "Tax-Filing-Confirmation.docx",
    isStaffOnly: false,
    isFeatured: false,
    relatedServices: ["Tax Filing", "Tax Compliance"],
    requiredFor: ["Post-Filing Communication"],
    paragraphs: [
      { text: "[COMPANY LETTERHEAD]" },
      { text: "{{current_date}}", isPlaceholder: true },
      { text: "{{client_name}}\n{{client_address}}", isPlaceholder: true },
      { text: "Dear {{client_salutation}}," },
      {
        heading: "CONFIRMATION OF TAX RETURN FILING - {{tax_year}}",
        text: "We are pleased to confirm that we have successfully filed your {{return_type}} with the Guyana Revenue Authority (GRA).",
      },
      {
        heading: "FILING DETAILS",
        text: "Return Type: {{return_type}}\nTax Year: {{tax_year}}\nFiling Date: {{filing_date}}\nGRA Reference: {{gra_reference}}",
      },
      {
        heading: "TAX SUMMARY",
        text: "Taxable Income: {{taxable_income}}\nTax Liability: {{tax_liability}}\nTax Paid/Withheld: {{tax_paid}}\nBalance Due/(Refund): {{balance_due}}",
      },
      {
        heading: "IMPORTANT DATES",
        text: "Next filing deadline: {{next_deadline}}",
      },
      {
        text: "Please retain this letter and the enclosed copy of your filed return for your records.\n\nIf you have any questions, please contact us.\n\nYours faithfully,\n\n____________________\n{{staff_name}}\n{{staff_title}}\n{{company_name}}\n\nEnc: Copy of Filed Return",
      },
    ],
  },
  {
    title: "NIS Registration Confirmation Letter",
    description:
      "Confirmation letter template for NIS employer or employee registration. Includes NIS numbers, contribution requirements, and next steps.",
    shortDescription: "Confirm NIS registration",
    category: "NIS",
    business: "GCMC",
    fileName: "NIS-Registration-Confirmation.docx",
    isStaffOnly: false,
    isFeatured: false,
    relatedServices: ["NIS Registration", "Payroll Services"],
    requiredFor: ["Post-Registration Communication"],
    paragraphs: [
      { text: "[COMPANY LETTERHEAD]" },
      { text: "{{current_date}}", isPlaceholder: true },
      { text: "{{client_name}}\n{{client_address}}", isPlaceholder: true },
      { text: "Dear {{client_salutation}}," },
      {
        heading: "CONFIRMATION OF NIS REGISTRATION",
        text: "We are pleased to confirm that we have successfully completed your registration with the National Insurance Scheme (NIS).",
      },
      {
        heading: "REGISTRATION DETAILS",
        text: "Registration Type: {{registration_type}}\nNIS Number: {{nis_number}}\nEffective Date: {{effective_date}}",
      },
      {
        heading: "EMPLOYER OBLIGATIONS",
        text: "1. Register all employees within 7 days of hiring\n2. Deduct employee contributions (5.6%) from wages\n3. Contribute employer portion (8.4%) of insurable earnings\n4. Submit monthly returns (Form C1) by the 14th of the following month\n5. Contribution ceiling: GYD 280,000 per month",
      },
      {
        heading: "NEXT STEPS",
        text: "- Submit your first monthly return by {{first_return_date}}\n- Ensure all employees are registered",
      },
      {
        text: "Please keep this letter with your NIS card for your records.\n\nIf you have any questions, please contact us.\n\nYours faithfully,\n\n____________________\n{{staff_name}}\n{{staff_title}}\n{{company_name}}",
      },
    ],
  },
  {
    title: "Service Completion Letter",
    description:
      "Professional letter template confirming successful completion of services. Summarizes work completed, deliverables provided, and recommended follow-up.",
    shortDescription: "Confirm service completion",
    category: "GENERAL",
    business: null,
    fileName: "Service-Completion-Letter.docx",
    isStaffOnly: false,
    isFeatured: false,
    relatedServices: ["Service Delivery"],
    requiredFor: ["Matter Closure", "Project Completion"],
    paragraphs: [
      { text: "[COMPANY LETTERHEAD]" },
      { text: "{{current_date}}", isPlaceholder: true },
      { text: "{{client_name}}\n{{client_address}}", isPlaceholder: true },
      { text: "Dear {{client_salutation}}," },
      {
        heading: "SERVICE COMPLETION - {{service_description}}",
        text: "We are pleased to confirm the successful completion of the following service(s):",
      },
      {
        heading: "SERVICE DETAILS",
        text: "Service: {{service_description}}\nReference: {{matter_number}}\nCompletion Date: {{completion_date}}",
      },
      {
        heading: "WORK COMPLETED",
        text: "{{work_items}}",
      },
      {
        heading: "DELIVERABLES PROVIDED",
        text: "{{deliverables}}",
      },
      {
        heading: "RECOMMENDED FOLLOW-UP",
        text: "{{follow_up_items}}",
      },
      {
        text: "We trust that you are satisfied with our services. Your feedback is important to us.\n\nThank you for your business. We look forward to serving you again.\n\nYours faithfully,\n\n____________________\n{{staff_name}}\n{{staff_title}}\n{{company_name}}",
      },
    ],
  },
];

// ============================================
// DOCX GENERATION
// ============================================

async function generateLetterTemplate(
  config: LetterTemplateConfig
): Promise<Buffer> {
  const children: Paragraph[] = [];

  for (const para of config.paragraphs) {
    if (para.heading) {
      children.push(
        new Paragraph({
          text: para.heading,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 },
        })
      );
    }

    const textLines = para.text.split("\n");
    for (const line of textLines) {
      const runs: TextRun[] = [];

      // Handle placeholders ({{...}})
      const parts = line.split(/(\{\{[^}]+\}\})/g);
      for (const part of parts) {
        if (part.startsWith("{{") && part.endsWith("}}")) {
          runs.push(
            new TextRun({
              text: part,
              color: "0070C0", // Blue for placeholders
              italics: true,
            })
          );
        } else {
          runs.push(new TextRun({ text: part }));
        }
      }

      children.push(
        new Paragraph({
          children: runs,
          spacing: { after: 100 },
        })
      );
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}

async function createLetterTemplates(): Promise<void> {
  console.log("\n📝 Generating letter templates...\n");

  const TEMPLATES_DIR = ensureTemplatesDirExists();
  for (const config of letterTemplateConfigs) {
    const filePath = join(TEMPLATES_DIR, config.fileName);

    try {
      const buffer = await generateLetterTemplate(config);
      await writeFile(filePath, buffer);
      console.log(`   ✅ Created: ${config.fileName}`);
    } catch (error) {
      console.error(
        `   ❌ Failed to create ${config.fileName}:`,
        error instanceof Error ? error.message : error
      );
    }
  }
}

// ============================================
// GET FILE SIZES
// ============================================

async function getFileSizes(): Promise<Map<string, number>> {
  const sizes = new Map<string, number>();
  const { KB_UPLOADS_DIR } = getKbPaths();

  async function scanDir(dir: string): Promise<void> {
    if (!existsSync(dir)) {
      return;
    }

    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        await scanDir(fullPath);
      } else {
        const stats = statSync(fullPath);
        const relativePath = fullPath.replace(
          `${PROJECT_ROOT}/data/uploads/`,
          ""
        );
        sizes.set(relativePath, stats.size);
      }
    }
  }

  await scanDir(KB_UPLOADS_DIR);
  return sizes;
}

// ============================================
// MAIN SEED FUNCTION
// ============================================

async function seedKnowledgeBaseForms(): Promise<void> {
  console.log("🌱 Starting Knowledge Base Forms seed...\n");

  // Get an owner user
  const owners = await db
    .select({ id: user.id, name: user.name })
    .from(user)
    .innerJoin(staff, eq(staff.userId, user.id))
    .where(eq(staff.role, "OWNER"))
    .limit(1);

  if (owners.length === 0) {
    console.error(
      "❌ No owner found in database. Please create an owner first."
    );
    process.exit(1);
  }

  const owner = owners[0];
  if (!owner) {
    console.error("❌ No owner found.");
    process.exit(1);
  }
  const createdById = owner.id;
  console.log(`✅ Using owner: ${owner.name} (${createdById})`);

  // Create letter templates
  await createLetterTemplates();

  // Get file sizes
  const fileSizes = await getFileSizes();
  console.log(`\n📦 Found ${fileSizes.size} files in knowledge-base directory`);

  // Prepare letter template entries
  const letterTemplateItems: KnowledgeBaseItemData[] =
    letterTemplateConfigs.map((config) => {
      const storagePath = `knowledge-base/templates/${config.fileName}`;
      return {
        type: "LETTER_TEMPLATE" as const,
        category: config.category,
        business: config.business,
        title: config.title,
        description: config.description,
        shortDescription: config.shortDescription,
        fileName: config.fileName,
        storagePath,
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        fileSize: fileSizes.get(storagePath),
        supportsAutoFill: true,
        relatedServices: config.relatedServices,
        requiredFor: config.requiredFor,
        isStaffOnly: config.isStaffOnly,
        isFeatured: config.isFeatured,
      };
    });

  // Add file sizes to downloaded forms
  const formsWithSizes = downloadedForms.map((form) => ({
    ...form,
    fileSize: form.storagePath ? fileSizes.get(form.storagePath) : undefined,
  }));

  // Combine all items
  const allItems = [...formsWithSizes, ...letterTemplateItems];

  console.log(`\n📚 Preparing to insert ${allItems.length} items:`);
  console.log(`   - Government Forms: ${downloadedForms.length}`);
  console.log(`   - Letter Templates: ${letterTemplateItems.length}\n`);

  let inserted = 0;
  const skipped = 0;
  let updated = 0;

  for (const item of allItems) {
    // Check if item already exists by title
    const existing = await db
      .select({ id: knowledgeBaseItem.id })
      .from(knowledgeBaseItem)
      .where(eq(knowledgeBaseItem.title, item.title))
      .limit(1);

    const existingItem = existing[0];
    if (existingItem) {
      // Update existing item with file path and size
      await db
        .update(knowledgeBaseItem)
        .set({
          storagePath: item.storagePath,
          fileSize: item.fileSize,
          fileName: item.fileName,
          mimeType: item.mimeType,
          agencyUrl: item.agencyUrl,
          updatedAt: new Date(),
        })
        .where(eq(knowledgeBaseItem.id, existingItem.id));

      console.log(`📝 Updated: ${item.title}`);
      updated += 1;
      continue;
    }

    // Insert new item
    await db.insert(knowledgeBaseItem).values({
      type: item.type,
      category: item.category,
      business: item.business,
      title: item.title,
      description: item.description,
      shortDescription: item.shortDescription,
      fileName: item.fileName,
      storagePath: item.storagePath,
      mimeType: item.mimeType,
      fileSize: item.fileSize,
      content: item.content,
      supportsAutoFill: item.supportsAutoFill,
      relatedServices: item.relatedServices,
      requiredFor: item.requiredFor,
      agencyUrl: item.agencyUrl,
      governmentFees: item.governmentFees,
      isActive: true,
      isStaffOnly: item.isStaffOnly,
      isFeatured: item.isFeatured,
      createdById,
    });

    console.log(`✅ Inserted: ${item.title}`);
    inserted += 1;
  }

  console.log(`\n${"=".repeat(50)}`);
  console.log("🎉 Seed complete!");
  console.log(`   Inserted: ${inserted}`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Total: ${allItems.length}`);
  console.log(`${"=".repeat(50)}\n`);
}

// Export for use in other scripts
export { seedKnowledgeBaseForms };

// Run when executed directly via CLI
// Check if this is the main module being run
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  seedKnowledgeBaseForms()
    .then(() => {
      console.log("Seed completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Seed failed:", error);
      process.exit(1);
    });
}
