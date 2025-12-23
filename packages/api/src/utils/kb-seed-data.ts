/**
 * Knowledge Base Seed Data
 *
 * Contains government forms and letter templates for seeding the Knowledge Base.
 * This is used by the seedForms API endpoint.
 */

import { db, knowledgeBaseItem, staff, user } from "@SYNERGY-GY/db";
import { eq } from "drizzle-orm";

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
  directPdfUrl?: string; // Direct link to PDF for auto-download
  governmentFees?: string;
  isStaffOnly: boolean;
  isFeatured: boolean;
};

// ============================================
// GOVERNMENT FORMS DATA
// ============================================

const governmentForms: KnowledgeBaseItemData[] = [
  // GRA Forms
  {
    type: "AGENCY_FORM",
    category: "GRA",
    business: "GCMC",
    title: "Individual Income Tax Return (IT-1)",
    description:
      "Official GRA form for filing annual Individual Income Tax Return. This form is used to report all sources of income, claim deductions, and calculate tax liability for the tax year. Must be filed by April 30th following the tax year. Form G0004-IIT-v3.",
    shortDescription: "Annual income tax filing for individuals",
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
    supportsAutoFill: true,
    relatedServices: ["Business Registration", "Tax Registration"],
    requiredFor: ["New Business Setup", "Tax Compliance"],
    agencyUrl: "https://www.gra.gov.gy/optimal/forms-and-guides/",
    directPdfUrl:
      "https://www.gra.gov.gy/wp-content/uploads/2020/10/G0016-Taxpayer-Registration-Form-Organisation-v1.pdf",
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
    supportsAutoFill: false,
    relatedServices: ["Excise Tax", "Import/Export"],
    requiredFor: ["Excise License Compliance"],
    agencyUrl: "https://www.gra.gov.gy/optimal/forms-and-guides/",
    governmentFees: "Excise rates vary by product type.",
    isStaffOnly: false,
    isFeatured: false,
  },
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
    directPdfUrl:
      "https://www.gra.gov.gy/wp-content/uploads/2020/10/Taxpayer-Registration-Form-Individual-v5.pdf",
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

  // NIS Forms
  {
    type: "AGENCY_FORM",
    category: "NIS",
    business: "GCMC",
    title: "NIS Employer Registration (Form R400F1)",
    description:
      "Official NIS form for registering as an employer. All employers with one or more employees must register within 7 days of hiring their first employee. ISO 9001 certified form.",
    shortDescription: "Register business as NIS employer",
    supportsAutoFill: true,
    relatedServices: ["NIS Registration", "Payroll Setup"],
    requiredFor: ["Employer NIS Compliance", "New Business Setup"],
    agencyUrl: "https://www.nis.org.gy/downloads",
    directPdfUrl:
      "https://www.nis.org.gy/pdf/iso/FORM_R400F1_R1_Application_for_Registration_as_Employer.pdf",
    governmentFees: "Free",
    isStaffOnly: false,
    isFeatured: true,
  },
  {
    type: "AGENCY_FORM",
    category: "NIS",
    business: "GCMC",
    title: "NIS Employee Registration (Form R4)",
    description:
      "Official NIS form for registering employees. Must be completed for each new employee. NIS number is required for all formal employment and accessing NIS benefits. ISO 9001 certified form.",
    shortDescription: "Register employee for NIS benefits",
    supportsAutoFill: true,
    relatedServices: ["NIS Registration", "Employee Onboarding"],
    requiredFor: ["Employee Registration", "NIS Compliance"],
    agencyUrl: "https://www.nis.org.gy/downloads",
    directPdfUrl:
      "https://nis.org.gy/pdf/FORM%20R4%20Employed%20Person%27s%20Application%20Form%20-%2017-02-2006.pdf",
    governmentFees: "Free",
    isStaffOnly: false,
    isFeatured: true,
  },
  {
    type: "AGENCY_FORM",
    category: "NIS",
    business: "GCMC",
    title: "NIS Self-Employed Registration (Form R4A)",
    description:
      "Official NIS form for self-employed persons to register and make voluntary contributions. Enables access to NIS benefits including sickness, maternity, and old age pension.",
    shortDescription: "Self-employed NIS registration",
    supportsAutoFill: true,
    relatedServices: ["NIS Registration", "Self-Employment"],
    requiredFor: ["Self-Employed NIS Coverage"],
    agencyUrl: "https://www.nis.org.gy/downloads",
    directPdfUrl:
      "https://www.nis.org.gy/pdf/R4A%20-%20Self-Employed%20Person%27s%20Application%20for%20Registration%202017.pdf",
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
    supportsAutoFill: true,
    relatedServices: ["NIS Compliance", "Government Contracts"],
    requiredFor: ["Tender Submissions", "Business Licenses"],
    agencyUrl: "https://www.nis.org.gy/downloads",
    directPdfUrl:
      "https://nis.org.gy/pdf/iso/FORM_C100F72_R0_Application_for_Compliance_Certificate_Employers.pdf",
    governmentFees: "Free (if compliant)",
    isStaffOnly: false,
    isFeatured: true,
  },
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

  // Immigration Forms
  {
    type: "AGENCY_FORM",
    category: "IMMIGRATION",
    business: "GCMC",
    title: "Employment Visa Application Form",
    description:
      "Official Ministry of Home Affairs form for employment visa (work permit). For foreign nationals seeking employment in Guyana. Includes sections for applicant information and sponsor/employer details.",
    shortDescription: "Apply for work permit in Guyana",
    supportsAutoFill: true,
    relatedServices: ["Work Permit Application", "Immigration Services"],
    requiredFor: ["Foreign Worker Employment", "Work Authorization"],
    agencyUrl: "https://moha.gov.gy/",
    directPdfUrl:
      "https://moha.gov.gy/wp-content/uploads/2021/04/Employment-Visa.pdf",
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
    supportsAutoFill: true,
    relatedServices: ["Work Permit Application", "Immigration Services"],
    requiredFor: ["Foreign Worker Employment"],
    agencyUrl: "https://mofa.gov.gy/",
    directPdfUrl:
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
    directPdfUrl:
      "https://moha.gov.gy/wp-content/uploads/2021/04/Visitor-Visa.pdf",
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

  // DCRA Forms
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
    directPdfUrl:
      "https://sbb.gov.gy/wp-content/uploads/2021/06/Business-Names-Form.pdf",
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

  // SBB Forms
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
    directPdfUrl:
      "https://sbb.gov.gy/wp-content/uploads/2020/04/SBB-Registration-Form.pdf",
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

  // Labour Forms
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
      "Worksheet for calculating severance pay per Guyana labour laws. Based on years of service and last drawn salary. Reference: Termination of Employment and Severance Pay Act 1997.",
    shortDescription: "Calculate severance payments",
    supportsAutoFill: true,
    relatedServices: ["HR Services", "Payroll"],
    requiredFor: ["Severance Calculation", "Termination Processing"],
    agencyUrl: "https://mol.gov.gy",
    directPdfUrl:
      "https://labour.gov.gy/wp-content/uploads/2024/07/Termination-and-severance.pdf",
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

  // EPA Forms
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

  // GNBS Forms
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
];

// ============================================
// LETTER TEMPLATES (Metadata only - no DOCX generation in API)
// ============================================

const letterTemplates: KnowledgeBaseItemData[] = [
  {
    type: "LETTER_TEMPLATE",
    category: "GENERAL",
    business: "GCMC",
    title: "Engagement Letter - Tax Services",
    description:
      "Professional engagement letter template for tax preparation and compliance services. Outlines scope of work, fees, client responsibilities, and terms of engagement.",
    shortDescription: "Tax services engagement agreement",
    supportsAutoFill: true,
    relatedServices: ["Tax Filing", "Tax Compliance", "Tax Planning"],
    requiredFor: ["Client Onboarding", "Service Commencement"],
    isStaffOnly: false,
    isFeatured: true,
  },
  {
    type: "LETTER_TEMPLATE",
    category: "GENERAL",
    business: null,
    title: "Client Welcome Letter",
    description:
      "Professional welcome letter template for new clients. Provides key information about services, team contacts, portal access, and next steps.",
    shortDescription: "Welcome new clients",
    supportsAutoFill: true,
    relatedServices: ["Client Onboarding"],
    requiredFor: ["New Client Setup"],
    isStaffOnly: false,
    isFeatured: true,
  },
  {
    type: "LETTER_TEMPLATE",
    category: "GENERAL",
    business: null,
    title: "Collection Letter - Overdue Payment",
    description:
      "Professional reminder letter template for overdue payments. First-stage collection letter with payment options and account details.",
    shortDescription: "Payment reminder letter",
    supportsAutoFill: true,
    relatedServices: ["Collections", "Accounts Receivable"],
    requiredFor: ["Overdue Invoice Follow-up"],
    isStaffOnly: true,
    isFeatured: false,
  },
  {
    type: "LETTER_TEMPLATE",
    category: "GRA",
    business: "GCMC",
    title: "Tax Filing Confirmation Letter",
    description:
      "Confirmation letter template for successful tax return filing with GRA. Includes filing reference numbers, tax summary, and key dates.",
    shortDescription: "Confirm tax return filing",
    supportsAutoFill: true,
    relatedServices: ["Tax Filing", "Tax Compliance"],
    requiredFor: ["Post-Filing Communication"],
    isStaffOnly: false,
    isFeatured: false,
  },
  {
    type: "LETTER_TEMPLATE",
    category: "NIS",
    business: "GCMC",
    title: "NIS Registration Confirmation Letter",
    description:
      "Confirmation letter template for NIS employer or employee registration. Includes NIS numbers, contribution requirements, and next steps.",
    shortDescription: "Confirm NIS registration",
    supportsAutoFill: true,
    relatedServices: ["NIS Registration", "Payroll Services"],
    requiredFor: ["Post-Registration Communication"],
    isStaffOnly: false,
    isFeatured: false,
  },
  {
    type: "LETTER_TEMPLATE",
    category: "GENERAL",
    business: null,
    title: "Service Completion Letter",
    description:
      "Professional letter template confirming successful completion of services. Summarizes work completed, deliverables provided, and recommended follow-up.",
    shortDescription: "Confirm service completion",
    supportsAutoFill: true,
    relatedServices: ["Service Delivery"],
    requiredFor: ["Matter Closure", "Project Completion"],
    isStaffOnly: false,
    isFeatured: false,
  },
];

// ============================================
// SEED FUNCTION
// ============================================

export type SeedResult = {
  success: boolean;
  inserted: number;
  updated: number;
  skipped: number;
  total: number;
  errors: string[];
};

/**
 * Seeds the Knowledge Base with government forms and letter templates.
 * This function is safe to call from an API endpoint.
 *
 * @param staffId - The staff ID to use as the creator
 * @returns Result object with counts of inserted, updated, and skipped items
 */
export async function seedKnowledgeBaseForms(
  staffId: string
): Promise<SeedResult> {
  const result: SeedResult = {
    success: false,
    inserted: 0,
    updated: 0,
    skipped: 0,
    total: 0,
    errors: [],
  };

  const allItems = [...governmentForms, ...letterTemplates];
  result.total = allItems.length;

  for (const item of allItems) {
    try {
      // Check if item already exists by title
      const existing = await db
        .select({ id: knowledgeBaseItem.id })
        .from(knowledgeBaseItem)
        .where(eq(knowledgeBaseItem.title, item.title))
        .limit(1);

      const existingItem = existing[0];
      if (existingItem) {
        // Update existing item
        await db
          .update(knowledgeBaseItem)
          .set({
            description: item.description,
            shortDescription: item.shortDescription,
            agencyUrl: item.agencyUrl,
            directPdfUrl: item.directPdfUrl,
            governmentFees: item.governmentFees,
            relatedServices: item.relatedServices,
            requiredFor: item.requiredFor,
            supportsAutoFill: item.supportsAutoFill,
            updatedAt: new Date(),
          })
          .where(eq(knowledgeBaseItem.id, existingItem.id));

        result.updated += 1;
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
        directPdfUrl: item.directPdfUrl,
        governmentFees: item.governmentFees,
        isActive: true,
        isStaffOnly: item.isStaffOnly,
        isFeatured: item.isFeatured,
        createdById: staffId,
      });

      result.inserted += 1;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      result.errors.push(`Failed to process "${item.title}": ${errorMessage}`);
      result.skipped += 1;
    }
  }

  result.success = result.errors.length === 0;
  return result;
}

/**
 * Gets an owner staff ID for seeding.
 * Falls back to any staff member if no owner is found.
 */
export async function getSeederStaffId(): Promise<string | null> {
  // Try to find an owner first
  const owners = await db
    .select({ id: user.id })
    .from(user)
    .innerJoin(staff, eq(staff.userId, user.id))
    .where(eq(staff.role, "OWNER"))
    .limit(1);

  const owner = owners[0];
  if (owner) {
    return owner.id;
  }

  // Fall back to any staff member
  const anyStaff = await db
    .select({ userId: staff.userId })
    .from(staff)
    .limit(1);

  const staffMember = anyStaff[0];
  return staffMember?.userId ?? null;
}
