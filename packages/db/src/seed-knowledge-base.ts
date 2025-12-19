/**
 * Knowledge Base Seed Script
 *
 * This script populates the knowledge base with comprehensive content including:
 * - Agency Forms (GRA, NIS, Immigration, DCRA, Deeds Registry)
 * - Letter Templates (engagement letters, client correspondence)
 * - Guides (step-by-step procedures for common tasks)
 * - Checklists (requirements for various services)
 *
 * Run with: bun run packages/db/src/seed-knowledge-base.ts
 */

import { eq } from "drizzle-orm";
import { db } from "./index";
import { user } from "./schema/auth";
import { staff } from "./schema/core";
import { knowledgeBaseItem } from "./schema/knowledge-base";

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
  content?: string;
  fileName?: string;
  mimeType?: string;
  supportsAutoFill: boolean;
  relatedServices: string[];
  requiredFor: string[];
  agencyUrl?: string;
  governmentFees?: string;
  isStaffOnly: boolean;
  isFeatured: boolean;
};

// ============================================
// AGENCY FORMS
// ============================================

const agencyForms: KnowledgeBaseItemData[] = [
  // GRA Tax Forms
  {
    type: "AGENCY_FORM",
    category: "GRA",
    business: "GCMC",
    title: "Income Tax Return (Form IT-1)",
    description:
      "Annual Income Tax Return form for individuals and sole proprietors. This form is used to report all sources of income, claim deductions, and calculate tax liability for the tax year. Must be filed by April 30th following the tax year.",
    shortDescription: "Annual income tax filing for individuals",
    fileName: "GRA-IT1-Income-Tax-Return.pdf",
    mimeType: "application/pdf",
    supportsAutoFill: true,
    relatedServices: ["Personal Tax Filing", "Tax Compliance"],
    requiredFor: ["Annual Tax Return", "Tax Clearance Certificate"],
    agencyUrl: "https://www.gra.gov.gy/tax-services/income-tax/",
    governmentFees: "No filing fee. Tax payable as per calculation.",
    isStaffOnly: false,
    isFeatured: true,
  },
  {
    type: "AGENCY_FORM",
    category: "GRA",
    business: "GCMC",
    title: "Corporate Tax Return (Form CT-1)",
    description:
      "Annual Corporate Tax Return for companies registered in Guyana. Reports company income, expenses, and calculates corporate tax liability. Companies must file within 3 months of their financial year-end.",
    shortDescription: "Annual tax return for corporations",
    fileName: "GRA-CT1-Corporate-Tax-Return.pdf",
    mimeType: "application/pdf",
    supportsAutoFill: true,
    relatedServices: ["Corporate Tax Filing", "Annual Corporate Compliance"],
    requiredFor: ["Corporate Tax Return", "Tax Clearance"],
    agencyUrl: "https://www.gra.gov.gy/tax-services/corporate-tax/",
    governmentFees:
      "No filing fee. Tax payable at 25% (small business) or 40% (standard).",
    isStaffOnly: false,
    isFeatured: true,
  },
  {
    type: "AGENCY_FORM",
    category: "GRA",
    business: "GCMC",
    title: "VAT Return (Form VAT-1)",
    description:
      "Monthly or quarterly Value Added Tax return for VAT-registered businesses. Reports taxable supplies, exempt supplies, and VAT collected/paid. Must be filed by the 21st of the month following the tax period.",
    shortDescription: "VAT reporting for registered businesses",
    fileName: "GRA-VAT1-Return.pdf",
    mimeType: "application/pdf",
    supportsAutoFill: true,
    relatedServices: ["VAT Filing", "Tax Compliance"],
    requiredFor: ["VAT Compliance", "Tax Clearance"],
    agencyUrl: "https://www.gra.gov.gy/tax-services/vat/",
    governmentFees: "No filing fee. VAT rate is 14%.",
    isStaffOnly: false,
    isFeatured: true,
  },
  {
    type: "AGENCY_FORM",
    category: "GRA",
    business: "GCMC",
    title: "PAYE Return (Form PAYE-1)",
    description:
      "Monthly Pay-As-You-Earn return for employers. Reports employee wages, tax deductions, and NIS contributions. Must be filed and remitted by the 14th of the following month.",
    shortDescription: "Employer payroll tax reporting",
    fileName: "GRA-PAYE1-Return.pdf",
    mimeType: "application/pdf",
    supportsAutoFill: true,
    relatedServices: ["Payroll Services", "PAYE Compliance"],
    requiredFor: ["Employer Tax Compliance", "Tax Clearance"],
    agencyUrl: "https://www.gra.gov.gy/tax-services/paye/",
    governmentFees:
      "No filing fee. PAYE rates: 28% (first bracket), 40% (above threshold).",
    isStaffOnly: false,
    isFeatured: false,
  },
  {
    type: "AGENCY_FORM",
    category: "GRA",
    business: "GCMC",
    title: "Tax Registration Application (TIN Application)",
    description:
      "Application form for obtaining a Taxpayer Identification Number (TIN). Required for all individuals and businesses conducting taxable activities in Guyana. Essential for opening bank accounts and conducting business.",
    shortDescription: "Apply for a Taxpayer ID Number",
    fileName: "GRA-TIN-Application.pdf",
    mimeType: "application/pdf",
    supportsAutoFill: true,
    relatedServices: ["Business Registration", "Tax Registration"],
    requiredFor: ["New Business Setup", "Tax Compliance"],
    agencyUrl: "https://www.gra.gov.gy/tax-services/tin-registration/",
    governmentFees: "Free",
    isStaffOnly: false,
    isFeatured: false,
  },
  {
    type: "AGENCY_FORM",
    category: "GRA",
    business: "GCMC",
    title: "VAT Registration Application",
    description:
      "Application to register a business for VAT. Mandatory for businesses with annual turnover exceeding GYD 15 million. Voluntary registration available for smaller businesses.",
    shortDescription: "Register business for VAT",
    fileName: "GRA-VAT-Registration.pdf",
    mimeType: "application/pdf",
    supportsAutoFill: true,
    relatedServices: ["VAT Registration", "Business Compliance"],
    requiredFor: ["VAT Registration"],
    agencyUrl: "https://www.gra.gov.gy/tax-services/vat-registration/",
    governmentFees: "Free",
    isStaffOnly: false,
    isFeatured: false,
  },

  // NIS Forms
  {
    type: "AGENCY_FORM",
    category: "NIS",
    business: "GCMC",
    title: "NIS Employer Registration (Form NIS-1)",
    description:
      "Registration form for new employers with the National Insurance Scheme. All employers with one or more employees must register within 7 days of hiring their first employee.",
    shortDescription: "Register as an NIS employer",
    fileName: "NIS-Form1-Employer-Registration.pdf",
    mimeType: "application/pdf",
    supportsAutoFill: true,
    relatedServices: ["NIS Registration", "Payroll Setup"],
    requiredFor: ["Employer NIS Compliance", "New Business Setup"],
    agencyUrl: "https://www.nis.gov.gy/employers/",
    governmentFees: "Free",
    isStaffOnly: false,
    isFeatured: true,
  },
  {
    type: "AGENCY_FORM",
    category: "NIS",
    business: "GCMC",
    title: "NIS Employee Registration (Form NIS-2)",
    description:
      "Registration form for new employees with NIS. Must be completed for each new employee. NIS number is required for all formal employment and accessing NIS benefits.",
    shortDescription: "Register employee for NIS benefits",
    fileName: "NIS-Form2-Employee-Registration.pdf",
    mimeType: "application/pdf",
    supportsAutoFill: true,
    relatedServices: ["NIS Registration", "Employee Onboarding"],
    requiredFor: ["Employee Registration", "NIS Compliance"],
    agencyUrl: "https://www.nis.gov.gy/insured-persons/",
    governmentFees: "Free",
    isStaffOnly: false,
    isFeatured: false,
  },
  {
    type: "AGENCY_FORM",
    category: "NIS",
    business: "GCMC",
    title: "NIS Monthly Contribution Return (Form NIS-C1)",
    description:
      "Monthly return for employer NIS contributions. Reports all employee earnings and NIS deductions. Due by the 14th of the following month. Contribution rate: 14% (5.6% employee, 8.4% employer).",
    shortDescription: "Monthly NIS contribution reporting",
    fileName: "NIS-FormC1-Monthly-Return.pdf",
    mimeType: "application/pdf",
    supportsAutoFill: true,
    relatedServices: ["Payroll Services", "NIS Compliance"],
    requiredFor: ["NIS Compliance", "Employee Benefits"],
    agencyUrl: "https://www.nis.gov.gy/contributions/",
    governmentFees: "14% of insurable earnings (ceiling: GYD 280,000/month)",
    isStaffOnly: false,
    isFeatured: false,
  },
  {
    type: "AGENCY_FORM",
    category: "NIS",
    business: "GCMC",
    title: "NIS Sickness Benefit Claim (Form SB-1)",
    description:
      "Claim form for NIS sickness benefits. Insured persons who are unable to work due to illness can claim sickness benefit after 3 waiting days. Requires medical certificate.",
    shortDescription: "Claim sickness benefits from NIS",
    fileName: "NIS-FormSB1-Sickness-Benefit.pdf",
    mimeType: "application/pdf",
    supportsAutoFill: true,
    relatedServices: ["NIS Benefits Assistance"],
    requiredFor: ["Sickness Benefit Claim"],
    agencyUrl: "https://www.nis.gov.gy/benefits/sickness/",
    governmentFees: "No fee. Benefit: 70% of average insurable earnings.",
    isStaffOnly: false,
    isFeatured: false,
  },
  {
    type: "AGENCY_FORM",
    category: "NIS",
    business: "GCMC",
    title: "NIS Maternity Benefit Claim (Form MB-1)",
    description:
      "Claim form for NIS maternity benefits. Insured females can claim 13 weeks of maternity benefit. Requires at least 15 paid contributions in the 39 weeks before expected delivery.",
    shortDescription: "Claim maternity benefits from NIS",
    fileName: "NIS-FormMB1-Maternity-Benefit.pdf",
    mimeType: "application/pdf",
    supportsAutoFill: true,
    relatedServices: ["NIS Benefits Assistance"],
    requiredFor: ["Maternity Benefit Claim"],
    agencyUrl: "https://www.nis.gov.gy/benefits/maternity/",
    governmentFees:
      "No fee. Benefit: 70% of average insurable earnings for 13 weeks.",
    isStaffOnly: false,
    isFeatured: false,
  },
  {
    type: "AGENCY_FORM",
    category: "NIS",
    business: "GCMC",
    title: "NIS Old Age Pension Claim (Form OA-1)",
    description:
      "Claim form for NIS old age pension. Insured persons aged 60+ (or 55 for women) with at least 750 paid contributions can claim pension. Earlier retirement available with reduced benefits.",
    shortDescription: "Claim NIS retirement pension",
    fileName: "NIS-FormOA1-Old-Age-Pension.pdf",
    mimeType: "application/pdf",
    supportsAutoFill: true,
    relatedServices: ["NIS Benefits Assistance", "Retirement Planning"],
    requiredFor: ["Retirement Pension Claim"],
    agencyUrl: "https://www.nis.gov.gy/benefits/old-age/",
    governmentFees:
      "No fee. Pension based on contribution history and earnings.",
    isStaffOnly: false,
    isFeatured: false,
  },

  // Immigration Forms
  {
    type: "AGENCY_FORM",
    category: "IMMIGRATION",
    business: "KAJ",
    title: "Work Permit Application (Form WP-1)",
    description:
      "Application for foreign nationals seeking employment in Guyana. Requires job offer from a Guyanese employer, proof of qualifications, and police clearance. Valid for 1-3 years depending on position.",
    shortDescription: "Apply for work permit in Guyana",
    fileName: "Immigration-WP1-Work-Permit.pdf",
    mimeType: "application/pdf",
    supportsAutoFill: true,
    relatedServices: ["Work Permit Application", "Immigration Services"],
    requiredFor: ["Foreign Worker Employment", "Work Authorization"],
    agencyUrl: "https://www.moha.gov.gy/immigration/",
    governmentFees: "GYD 50,000 - 150,000 depending on duration",
    isStaffOnly: false,
    isFeatured: true,
  },
  {
    type: "AGENCY_FORM",
    category: "IMMIGRATION",
    business: "KAJ",
    title: "Work Permit Renewal Application",
    description:
      "Application to renew an existing work permit. Must be submitted 30 days before expiry. Requires updated employment contract, police clearance, and employer recommendation.",
    shortDescription: "Renew existing work permit",
    fileName: "Immigration-WP-Renewal.pdf",
    mimeType: "application/pdf",
    supportsAutoFill: true,
    relatedServices: ["Work Permit Renewal", "Immigration Services"],
    requiredFor: ["Work Permit Extension"],
    agencyUrl: "https://www.moha.gov.gy/immigration/",
    governmentFees: "GYD 50,000 - 150,000 depending on duration",
    isStaffOnly: false,
    isFeatured: false,
  },
  {
    type: "AGENCY_FORM",
    category: "IMMIGRATION",
    business: "KAJ",
    title: "Visa Application Form",
    description:
      "General visa application for foreign nationals visiting Guyana. Various visa types available: Tourist, Business, Student, and Transit. Processing time: 5-10 business days.",
    shortDescription: "Apply for Guyana visa",
    fileName: "Immigration-Visa-Application.pdf",
    mimeType: "application/pdf",
    supportsAutoFill: true,
    relatedServices: ["Visa Application", "Immigration Services"],
    requiredFor: ["Entry to Guyana", "Business Visit"],
    agencyUrl: "https://www.moha.gov.gy/immigration/",
    governmentFees: "USD 25 - 100 depending on visa type and nationality",
    isStaffOnly: false,
    isFeatured: false,
  },
  {
    type: "AGENCY_FORM",
    category: "IMMIGRATION",
    business: "KAJ",
    title: "Permanent Residence Application",
    description:
      "Application for permanent residence in Guyana. Eligibility: 5+ years legal residence, or marriage to Guyanese citizen, or significant investment. Processing: 6-12 months.",
    shortDescription: "Apply for permanent residency",
    fileName: "Immigration-PR-Application.pdf",
    mimeType: "application/pdf",
    supportsAutoFill: true,
    relatedServices: ["Permanent Residence", "Immigration Services"],
    requiredFor: ["Permanent Settlement", "Long-term Residence"],
    agencyUrl: "https://www.moha.gov.gy/immigration/",
    governmentFees: "GYD 100,000",
    isStaffOnly: false,
    isFeatured: false,
  },
  {
    type: "AGENCY_FORM",
    category: "IMMIGRATION",
    business: "KAJ",
    title: "Extension of Stay Application",
    description:
      "Application to extend the period of stay in Guyana beyond the initial visa duration. Must be submitted before current authorization expires.",
    shortDescription: "Extend your stay in Guyana",
    fileName: "Immigration-Extension-Stay.pdf",
    mimeType: "application/pdf",
    supportsAutoFill: true,
    relatedServices: ["Extension of Stay", "Immigration Services"],
    requiredFor: ["Extended Visit", "Continued Stay"],
    agencyUrl: "https://www.moha.gov.gy/immigration/",
    governmentFees: "GYD 15,000 - 30,000",
    isStaffOnly: false,
    isFeatured: false,
  },

  // DCRA / Company Registry Forms
  {
    type: "AGENCY_FORM",
    category: "DCRA",
    business: "GCMC",
    title: "Company Incorporation Form (Form 1)",
    description:
      "Application to register a new company in Guyana. Includes Articles of Incorporation and details of directors/shareholders. Processing time: 3-5 business days.",
    shortDescription: "Register a new company",
    fileName: "DCRA-Form1-Incorporation.pdf",
    mimeType: "application/pdf",
    supportsAutoFill: true,
    relatedServices: ["Company Incorporation", "Business Registration"],
    requiredFor: ["New Company Setup", "Business Formation"],
    agencyUrl: "https://dcra.gov.gy/company-registry/",
    governmentFees: "GYD 25,000 - 50,000 based on authorized capital",
    isStaffOnly: false,
    isFeatured: true,
  },
  {
    type: "AGENCY_FORM",
    category: "DCRA",
    business: "GCMC",
    title: "Company Annual Return (Form 3)",
    description:
      "Annual return for registered companies. Must be filed within 60 days of the company's anniversary date. Includes current directors, shareholders, and registered office details.",
    shortDescription: "File annual company return",
    fileName: "DCRA-Form3-Annual-Return.pdf",
    mimeType: "application/pdf",
    supportsAutoFill: true,
    relatedServices: ["Annual Return Filing", "Corporate Compliance"],
    requiredFor: ["Annual Compliance", "Company Good Standing"],
    agencyUrl: "https://dcra.gov.gy/company-registry/",
    governmentFees: "GYD 10,000 + late fees if applicable",
    isStaffOnly: false,
    isFeatured: true,
  },
  {
    type: "AGENCY_FORM",
    category: "DCRA",
    business: "GCMC",
    title: "Change of Directors Form (Form 10)",
    description:
      "Notification of change in company directors. Must be filed within 14 days of the change. Includes appointment and resignation of directors.",
    shortDescription: "Notify change of company directors",
    fileName: "DCRA-Form10-Change-Directors.pdf",
    mimeType: "application/pdf",
    supportsAutoFill: true,
    relatedServices: ["Corporate Changes", "Director Changes"],
    requiredFor: ["Director Appointment", "Director Resignation"],
    agencyUrl: "https://dcra.gov.gy/company-registry/",
    governmentFees: "GYD 5,000",
    isStaffOnly: false,
    isFeatured: false,
  },
  {
    type: "AGENCY_FORM",
    category: "DCRA",
    business: "GCMC",
    title: "Change of Registered Office (Form 8)",
    description:
      "Notification of change in company's registered office address. Must be filed within 14 days of the change. All official correspondence will be sent to the registered office.",
    shortDescription: "Update company registered address",
    fileName: "DCRA-Form8-Change-Address.pdf",
    mimeType: "application/pdf",
    supportsAutoFill: true,
    relatedServices: ["Corporate Changes", "Address Update"],
    requiredFor: ["Office Relocation", "Address Change"],
    agencyUrl: "https://dcra.gov.gy/company-registry/",
    governmentFees: "GYD 5,000",
    isStaffOnly: false,
    isFeatured: false,
  },
  {
    type: "AGENCY_FORM",
    category: "DCRA",
    business: "GCMC",
    title: "Business Name Registration (Form BN-1)",
    description:
      "Registration of a business name (sole proprietorship or partnership). Valid for 3 years and renewable. Required for operating under a trade name.",
    shortDescription: "Register a business name",
    fileName: "DCRA-FormBN1-Business-Name.pdf",
    mimeType: "application/pdf",
    supportsAutoFill: true,
    relatedServices: [
      "Business Name Registration",
      "Sole Proprietorship Setup",
    ],
    requiredFor: ["Business Name Registration", "Trade Name"],
    agencyUrl: "https://dcra.gov.gy/business-names/",
    governmentFees: "GYD 15,000 (3 years)",
    isStaffOnly: false,
    isFeatured: false,
  },
  {
    type: "AGENCY_FORM",
    category: "DCRA",
    business: "GCMC",
    title: "Share Transfer Form (Form 5)",
    description:
      "Transfer of shares between shareholders. Must be filed with the Registry within 30 days of the transfer. Requires stamp duty payment.",
    shortDescription: "Transfer company shares",
    fileName: "DCRA-Form5-Share-Transfer.pdf",
    mimeType: "application/pdf",
    supportsAutoFill: true,
    relatedServices: ["Share Transfer", "Ownership Changes"],
    requiredFor: ["Shareholder Changes", "Equity Transfer"],
    agencyUrl: "https://dcra.gov.gy/company-registry/",
    governmentFees: "GYD 5,000 + stamp duty (2% of transfer value)",
    isStaffOnly: false,
    isFeatured: false,
  },

  // Deeds Registry Forms
  {
    type: "AGENCY_FORM",
    category: "DCRA",
    business: "GCMC",
    title: "Transport of Property (Conveyance Form)",
    description:
      "Legal document for transferring property ownership in Guyana. Required for all real estate transactions. Must be executed before a Commissioner of Oaths and registered at the Deeds Registry.",
    shortDescription: "Transfer property ownership",
    fileName: "Deeds-Transport-Conveyance.pdf",
    mimeType: "application/pdf",
    supportsAutoFill: true,
    relatedServices: ["Property Transfer", "Conveyancing"],
    requiredFor: ["Property Sale", "Real Estate Transaction"],
    agencyUrl: "https://dcra.gov.gy/deeds-registry/",
    governmentFees: "Stamp duty: 2% of property value + registration fee",
    isStaffOnly: false,
    isFeatured: false,
  },
  {
    type: "AGENCY_FORM",
    category: "DCRA",
    business: "GCMC",
    title: "Mortgage Registration Form",
    description:
      "Registration of mortgage/security interest over real property. Required by all financial institutions for property-secured loans. Creates priority over unregistered interests.",
    shortDescription: "Register mortgage on property",
    fileName: "Deeds-Mortgage-Registration.pdf",
    mimeType: "application/pdf",
    supportsAutoFill: true,
    relatedServices: ["Mortgage Registration", "Property Security"],
    requiredFor: ["Property Financing", "Bank Loan Security"],
    agencyUrl: "https://dcra.gov.gy/deeds-registry/",
    governmentFees: "0.5% of mortgage value + registration fee",
    isStaffOnly: false,
    isFeatured: false,
  },
  {
    type: "AGENCY_FORM",
    category: "DCRA",
    business: "GCMC",
    title: "Property Search Request Form",
    description:
      "Request for official search of property records at the Deeds Registry. Reveals ownership history, encumbrances, mortgages, and pending legal matters. Essential before any property transaction.",
    shortDescription: "Search property ownership records",
    fileName: "Deeds-Property-Search.pdf",
    mimeType: "application/pdf",
    supportsAutoFill: false,
    relatedServices: ["Property Search", "Due Diligence"],
    requiredFor: ["Property Purchase", "Title Verification"],
    agencyUrl: "https://dcra.gov.gy/deeds-registry/",
    governmentFees: "GYD 5,000 per property",
    isStaffOnly: false,
    isFeatured: false,
  },
];

// ============================================
// LETTER TEMPLATES
// ============================================

const letterTemplates: KnowledgeBaseItemData[] = [
  {
    type: "LETTER_TEMPLATE",
    category: "GENERAL",
    business: null,
    title: "Engagement Letter - Tax Services",
    description:
      "Standard engagement letter for tax preparation and compliance services. Outlines scope of work, fees, client responsibilities, and terms of engagement. Auto-fills with client name, address, and service details.",
    shortDescription: "Tax services engagement agreement",
    content: `[COMPANY LETTERHEAD]

{{current_date}}

{{client_name}}
{{client_address}}

Dear {{client_salutation}},

RE: ENGAGEMENT LETTER - TAX SERVICES

We are pleased to confirm our appointment as your tax advisors for the {{tax_year}} tax year. This letter outlines the terms of our engagement and the services we will provide.

SCOPE OF SERVICES:
{{#each services}}
- {{this}}
{{/each}}

OUR RESPONSIBILITIES:
1. Prepare your tax returns based on information you provide
2. Advise on tax planning opportunities
3. Represent you in correspondence with GRA
4. Meet all filing deadlines for returns we prepare

YOUR RESPONSIBILITIES:
1. Provide complete and accurate information
2. Respond promptly to our requests for information
3. Review and approve returns before filing
4. Make timely payment of fees

FEES:
Our fees for the above services will be {{fee_amount}}. Additional services will be billed at our standard hourly rates.

CONFIDENTIALITY:
All information you provide will be treated as confidential and will not be disclosed to third parties except as required by law.

Please sign and return one copy of this letter to confirm your acceptance of these terms.

Yours faithfully,

____________________
{{staff_name}}
{{staff_title}}
{{company_name}}

ACCEPTED AND AGREED:

____________________
{{client_name}}
Date: ________________`,
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
    title: "Engagement Letter - Consulting Services",
    description:
      "Engagement letter for business consulting, advisory, and professional services. Covers project scope, deliverables, timeline, and payment terms.",
    shortDescription: "Consulting engagement agreement",
    content: `[COMPANY LETTERHEAD]

{{current_date}}

{{client_name}}
{{client_address}}

Dear {{client_salutation}},

RE: ENGAGEMENT LETTER - CONSULTING SERVICES

We are pleased to submit this letter outlining the terms of our engagement for consulting services.

PROJECT OVERVIEW:
{{project_description}}

SCOPE OF WORK:
{{#each deliverables}}
- {{this}}
{{/each}}

TIMELINE:
- Commencement Date: {{start_date}}
- Expected Completion: {{end_date}}

FEES AND PAYMENT:
- Fixed Fee: {{fee_amount}}
- Payment Schedule: {{payment_terms}}

EXCLUSIONS:
The following are outside the scope of this engagement:
{{exclusions}}

TERMS AND CONDITIONS:
1. Work will commence upon receipt of signed engagement letter
2. Additional work outside scope will require separate approval
3. Either party may terminate with 14 days written notice
4. All materials remain our property until full payment received

Please sign and return to confirm your acceptance.

Yours faithfully,

____________________
{{staff_name}}
{{staff_title}}
{{company_name}}

ACCEPTED:

____________________
{{client_name}}
Date: ________________`,
    supportsAutoFill: true,
    relatedServices: ["Business Consulting", "Advisory Services"],
    requiredFor: ["Project Commencement", "Client Onboarding"],
    isStaffOnly: false,
    isFeatured: true,
  },
  {
    type: "LETTER_TEMPLATE",
    category: "GENERAL",
    business: null,
    title: "Client Onboarding Welcome Letter",
    description:
      "Welcome letter for new clients providing key information about our services, team contacts, portal access, and next steps. Creates a professional first impression.",
    shortDescription: "Welcome new clients",
    content: `[COMPANY LETTERHEAD]

{{current_date}}

{{client_name}}
{{client_address}}

Dear {{client_salutation}},

RE: WELCOME TO {{company_name}}

On behalf of our entire team, I would like to extend a warm welcome and thank you for choosing {{company_name}} as your trusted partner.

YOUR ACCOUNT TEAM:
- Primary Contact: {{primary_contact}}
- Email: {{contact_email}}
- Phone: {{contact_phone}}

CLIENT PORTAL ACCESS:
We have set up your secure client portal at {{portal_url}}. Your login credentials:
- Username: {{portal_username}}
- Temporary Password: [To be sent separately]

Through the portal, you can:
- Upload and download documents securely
- Track the status of your matters
- Communicate with our team
- View invoices and make payments
- Request appointments

NEXT STEPS:
1. Log in to the client portal and update your password
2. Complete your profile information
3. Upload any pending documents
4. Schedule an introductory meeting with your account manager

We are committed to providing you with exceptional service and look forward to a successful partnership.

If you have any questions, please don't hesitate to contact us.

Warm regards,

____________________
{{staff_name}}
{{staff_title}}
{{company_name}}`,
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
    title: "Invoice Cover Letter",
    description:
      "Professional cover letter to accompany invoices. Includes payment details, due date, and payment methods available.",
    shortDescription: "Invoice cover letter",
    content: `[COMPANY LETTERHEAD]

{{current_date}}

{{client_name}}
{{client_address}}

Dear {{client_salutation}},

RE: INVOICE {{invoice_number}} - {{invoice_description}}

Please find enclosed our invoice for professional services rendered during {{billing_period}}.

INVOICE SUMMARY:
- Invoice Number: {{invoice_number}}
- Invoice Date: {{invoice_date}}
- Due Date: {{due_date}}
- Amount Due: {{invoice_amount}}

PAYMENT METHODS:
1. Bank Transfer:
   Bank: {{bank_name}}
   Account: {{account_number}}
   Reference: {{invoice_number}}

2. Online Payment:
   Visit {{payment_portal_url}} to pay by credit card

Please include the invoice number as a reference with your payment.

If you have any questions regarding this invoice, please contact our accounts department at {{accounts_email}}.

Thank you for your business.

Yours faithfully,

____________________
{{staff_name}}
{{company_name}}`,
    supportsAutoFill: true,
    relatedServices: ["Invoicing", "Client Billing"],
    requiredFor: ["Invoice Delivery"],
    isStaffOnly: false,
    isFeatured: false,
  },
  {
    type: "LETTER_TEMPLATE",
    category: "GENERAL",
    business: null,
    title: "Collection Letter - Overdue Payment",
    description:
      "Professional reminder for overdue payments. Escalating series available from gentle reminder to final notice.",
    shortDescription: "Payment reminder letter",
    content: `[COMPANY LETTERHEAD]

{{current_date}}

{{client_name}}
{{client_address}}

Dear {{client_salutation}},

RE: OVERDUE PAYMENT REMINDER - INVOICE {{invoice_number}}

We are writing to remind you that the following invoice remains unpaid:

Invoice Number: {{invoice_number}}
Invoice Date: {{invoice_date}}
Original Due Date: {{due_date}}
Days Overdue: {{days_overdue}}
Amount Outstanding: {{outstanding_amount}}

We understand that oversights can happen, and we would appreciate your prompt attention to this matter.

PAYMENT OPTIONS:
{{payment_instructions}}

If you have already made this payment, please disregard this notice and accept our thanks.

If you are experiencing difficulties making payment, please contact us to discuss payment arrangements.

We value our business relationship and look forward to your prompt response.

Yours sincerely,

____________________
{{staff_name}}
Accounts Department
{{company_name}}`,
    supportsAutoFill: true,
    relatedServices: ["Collections", "Accounts Receivable"],
    requiredFor: ["Overdue Invoice Follow-up"],
    isStaffOnly: false,
    isFeatured: false,
  },
  {
    type: "LETTER_TEMPLATE",
    category: "GRA",
    business: "GCMC",
    title: "Tax Filing Confirmation Letter",
    description:
      "Confirmation letter to client after successful filing of tax returns with GRA. Includes filing reference numbers and key dates.",
    shortDescription: "Confirm tax return filing",
    content: `[COMPANY LETTERHEAD]

{{current_date}}

{{client_name}}
{{client_address}}

Dear {{client_salutation}},

RE: CONFIRMATION OF TAX RETURN FILING - {{tax_year}}

We are pleased to confirm that we have successfully filed your {{return_type}} with the Guyana Revenue Authority (GRA).

FILING DETAILS:
- Return Type: {{return_type}}
- Tax Year: {{tax_year}}
- Filing Date: {{filing_date}}
- GRA Reference: {{gra_reference}}

TAX SUMMARY:
- Taxable Income: {{taxable_income}}
- Tax Liability: {{tax_liability}}
- Tax Paid/Withheld: {{tax_paid}}
- Balance Due/(Refund): {{balance_due}}

{{#if balance_due > 0}}
PAYMENT DUE:
The balance of {{balance_due}} is due by {{payment_deadline}}. Payment can be made at any GRA office or via the GRA online portal.
{{/if}}

{{#if refund_amount > 0}}
REFUND EXPECTED:
Based on your return, you are entitled to a refund of {{refund_amount}}. Refunds typically take 6-8 weeks to process.
{{/if}}

IMPORTANT DATES:
- Next filing deadline: {{next_deadline}}

Please retain this letter and the enclosed copy of your filed return for your records.

If you have any questions, please contact us.

Yours faithfully,

____________________
{{staff_name}}
{{staff_title}}
{{company_name}}

Enc: Copy of Filed Return`,
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
      "Confirmation letter for newly registered NIS employers or employees. Includes NIS numbers and contribution requirements.",
    shortDescription: "Confirm NIS registration",
    content: `[COMPANY LETTERHEAD]

{{current_date}}

{{client_name}}
{{client_address}}

Dear {{client_salutation}},

RE: CONFIRMATION OF NIS REGISTRATION

We are pleased to confirm that we have successfully completed your registration with the National Insurance Scheme (NIS).

REGISTRATION DETAILS:
- Registration Type: {{registration_type}}
- NIS Number: {{nis_number}}
- Effective Date: {{effective_date}}

{{#if employer_registration}}
EMPLOYER OBLIGATIONS:
1. Register all employees within 7 days of hiring
2. Deduct employee contributions (5.6%) from wages
3. Contribute employer portion (8.4%) of insurable earnings
4. Submit monthly returns (Form C1) by the 14th of the following month
5. Contribution ceiling: GYD 280,000 per month

NEXT STEPS:
- Submit your first monthly return by {{first_return_date}}
- Ensure all employees are registered
{{/if}}

{{#if employee_registration}}
YOUR NIS BENEFITS:
With your NIS registration, you are entitled to:
- Sickness benefit (after 3 waiting days)
- Maternity benefit (13 weeks)
- Funeral grant
- Old age pension (at age 60/55)
- Survivor benefits
{{/if}}

Please keep this letter with your NIS card for your records.

If you have any questions, please contact us.

Yours faithfully,

____________________
{{staff_name}}
{{staff_title}}
{{company_name}}`,
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
      "Letter confirming successful completion of a service or project. Summarizes work completed and next steps.",
    shortDescription: "Confirm service completion",
    content: `[COMPANY LETTERHEAD]

{{current_date}}

{{client_name}}
{{client_address}}

Dear {{client_salutation}},

RE: SERVICE COMPLETION - {{service_description}}

We are pleased to confirm the successful completion of the following service(s):

SERVICE DETAILS:
- Service: {{service_description}}
- Reference: {{matter_number}}
- Completion Date: {{completion_date}}

WORK COMPLETED:
{{#each work_items}}
✓ {{this}}
{{/each}}

DELIVERABLES PROVIDED:
{{#each deliverables}}
- {{this}}
{{/each}}

{{#if follow_up_required}}
RECOMMENDED FOLLOW-UP:
{{follow_up_items}}
{{/if}}

We trust that you are satisfied with our services. Your feedback is important to us, and we would appreciate if you could take a moment to share your experience.

Thank you for your business. We look forward to serving you again.

Yours faithfully,

____________________
{{staff_name}}
{{staff_title}}
{{company_name}}`,
    supportsAutoFill: true,
    relatedServices: ["Service Delivery"],
    requiredFor: ["Matter Closure", "Project Completion"],
    isStaffOnly: false,
    isFeatured: false,
  },
  {
    type: "LETTER_TEMPLATE",
    category: "GENERAL",
    business: null,
    title: "Termination of Services Letter",
    description:
      "Professional letter for terminating client engagement. Covers handover of documents, outstanding matters, and final invoice.",
    shortDescription: "Terminate client services",
    content: `[COMPANY LETTERHEAD]

{{current_date}}

{{client_name}}
{{client_address}}

Dear {{client_salutation}},

RE: TERMINATION OF SERVICES

In accordance with our engagement letter dated {{engagement_date}}, we hereby give notice that our professional relationship will terminate effective {{termination_date}}.

REASON FOR TERMINATION:
{{termination_reason}}

HANDOVER ARRANGEMENTS:
We will provide the following to facilitate a smooth transition:
1. All original documents provided by you
2. Copies of filed returns and correspondence
3. Summary of pending matters and deadlines
4. Introduction to your new service provider (if requested)

OUTSTANDING MATTERS:
{{#each pending_matters}}
- {{this.description}} - Deadline: {{this.deadline}}
{{/each}}

FINAL INVOICE:
Our final invoice for services rendered through the termination date will be issued separately. Payment terms as per our engagement letter.

DOCUMENT COLLECTION:
Please arrange to collect your documents by {{collection_deadline}}. Alternatively, we can courier them to you at additional cost.

We wish you all the best in your future endeavors.

Yours sincerely,

____________________
{{staff_name}}
{{staff_title}}
{{company_name}}`,
    supportsAutoFill: true,
    relatedServices: ["Client Offboarding"],
    requiredFor: ["Service Termination"],
    isStaffOnly: true,
    isFeatured: false,
  },
];

// ============================================
// GUIDES
// ============================================

const guides: KnowledgeBaseItemData[] = [
  {
    type: "GUIDE",
    category: "DCRA",
    business: "GCMC",
    title: "How to Register a Company in Guyana",
    description:
      "Complete step-by-step guide to incorporating a company in Guyana. Covers name search, document preparation, registration process, and post-incorporation requirements.",
    shortDescription: "Complete company incorporation guide",
    content: `# How to Register a Company in Guyana

## Overview
This guide walks you through the complete process of incorporating a private limited company in Guyana, from initial planning to post-incorporation compliance.

**Estimated Timeline:** 7-14 business days
**Approximate Cost:** GYD 50,000 - 100,000 (depending on authorized capital)

---

## Step 1: Choose Your Company Name

### Name Requirements
- Must end with "Limited", "Ltd", "Incorporated", or "Inc"
- Cannot be identical or similar to existing company names
- Cannot contain restricted words without approval (Bank, Insurance, Trust, etc.)

### Name Search
1. Visit DCRA office at Lot 4 Avenue of the Republic, Georgetown
2. Submit up to 3 proposed names for search
3. Fee: GYD 2,500 per name
4. Results available same day

**Tip:** Choose a distinctive name that reflects your business and is easy to remember.

---

## Step 2: Prepare Incorporation Documents

### Required Documents
1. **Articles of Incorporation (Form 1)**
   - Company name
   - Registered office address
   - Directors (minimum 1)
   - Shareholders
   - Authorized share capital
   - Business objects

2. **Notice of Directors (Form 10)**
   - Full names and addresses
   - Nationality
   - Occupation
   - ID copies

3. **Notice of Registered Office (Form 8)**
   - Physical address in Guyana
   - Cannot be a P.O. Box

4. **Consent of Directors**
   - Written consent from each director

### Shareholder Requirements
- Minimum 1 shareholder
- Can be an individual or corporate entity
- No residency requirement

---

## Step 3: Submit to DCRA

### Submission Process
1. Complete all forms accurately
2. Have documents signed before a Commissioner of Oaths
3. Submit to Commercial Registry Division
4. Pay registration fees

### Fees
| Authorized Capital | Registration Fee |
|-------------------|------------------|
| Up to GYD 50,000 | GYD 25,000 |
| GYD 50,001 - 500,000 | GYD 35,000 |
| GYD 500,001 - 5,000,000 | GYD 45,000 |
| Over GYD 5,000,000 | GYD 55,000 |

---

## Step 4: Receive Certificate of Incorporation

### What You'll Receive
- Certificate of Incorporation
- Company Registration Number
- Certified copies of filed documents

### Processing Time
- Standard: 5-7 business days
- Expedited (additional fee): 2-3 business days

---

## Step 5: Post-Incorporation Requirements

### Immediate Actions (Within 30 days)
1. **Open Corporate Bank Account**
   - Take Certificate of Incorporation
   - Directors' IDs
   - Board resolution

2. **Apply for TIN**
   - Required for all tax filings
   - Free of charge

3. **NIS Registration** (if hiring employees)
   - Register as employer
   - Register employees

4. **Business License**
   - Apply to City Council/NDC
   - Required for operating premises

### Ongoing Compliance
- Annual Return (Form 3) - within 60 days of anniversary
- Statutory registers maintenance
- Director/shareholder changes (Form 10/5)

---

## Common Mistakes to Avoid

1. ❌ Using a name already registered
2. ❌ Incorrect registered office address
3. ❌ Missing director signatures
4. ❌ Not updating changes within 14 days
5. ❌ Forgetting annual return filing

---

## Need Help?

GCMC provides complete company incorporation services including:
- Name search and reservation
- Document preparation
- DCRA submission
- Post-incorporation compliance

**Contact us for a free consultation.**`,
    supportsAutoFill: false,
    relatedServices: ["Company Incorporation", "Business Registration"],
    requiredFor: ["New Business Setup"],
    agencyUrl: "https://dcra.gov.gy/company-registry/",
    isStaffOnly: false,
    isFeatured: true,
  },
  {
    type: "GUIDE",
    category: "GRA",
    business: "GCMC",
    title: "How to File Income Tax Returns in Guyana",
    description:
      "Comprehensive guide to filing personal and corporate income tax returns with GRA. Covers deadlines, deductions, required documents, and common errors.",
    shortDescription: "Income tax filing guide",
    content: `# How to File Income Tax Returns in Guyana

## Overview
This guide covers the income tax filing requirements for individuals and businesses in Guyana.

**Filing Deadline:** April 30th (individuals) / 3 months after year-end (companies)
**Late Filing Penalty:** GYD 10,000 + 2% per month on unpaid tax

---

## Who Must File?

### Individuals
- Employees earning above the personal allowance (GYD 1,560,000/year)
- Self-employed persons with business income
- Persons with rental income, investments, or capital gains
- Non-residents with Guyana-source income

### Companies
- All companies registered in Guyana
- Branches of foreign companies
- Partnerships (partnership return)

---

## Step 1: Gather Required Documents

### For Employees
- [ ] Employment income statement (from employer)
- [ ] P14 forms (tax deducted at source)
- [ ] Bank interest statements
- [ ] Rental income records
- [ ] Investment income statements
- [ ] Receipts for deductions

### For Self-Employed/Business
- [ ] Financial statements
- [ ] Bank statements
- [ ] Sales and purchase invoices
- [ ] Payroll records
- [ ] Asset register
- [ ] Previous year's tax return

---

## Step 2: Calculate Taxable Income

### Personal Income Tax Rates (2024)

| Income Bracket | Rate |
|---------------|------|
| First GYD 3,120,000 | 28% |
| Above GYD 3,120,000 | 40% |

### Personal Allowance: GYD 1,560,000/year

### Allowable Deductions
- NIS contributions (up to ceiling)
- Pension contributions (approved schemes)
- Medical expenses (with receipts)
- Dependents (up to 4 children)
- Interest on mortgage (own home)

### Corporate Tax Rates
| Company Type | Rate |
|-------------|------|
| Small business (< GYD 120M turnover) | 25% |
| Standard companies | 40% |
| Manufacturing companies | 27.5% |

---

## Step 3: Complete the Tax Return

### Form IT-1 (Personal Income Tax)
1. Personal information
2. Employment income
3. Business/self-employment income
4. Rental income
5. Investment income
6. Deductions and allowances
7. Tax calculation
8. Declaration

### Form CT-1 (Corporate Tax)
1. Company information
2. Revenue and expenses
3. Capital allowances
4. Tax adjustments
5. Tax computation
6. Director certification

---

## Step 4: Submit and Pay

### Filing Options
1. **In-Person**
   - GRA Main Office, Camp Street, Georgetown
   - Regional GRA offices

2. **Online (TRIPS)**
   - Register at trips.gra.gov.gy
   - File and pay electronically
   - Receive instant confirmation

### Payment Methods
- Cash at GRA cashier
- Bank transfer
- Online (TRIPS)

---

## Common Deductible Expenses (Business)

- Salaries and wages
- Rent for business premises
- Utilities
- Professional fees
- Advertising
- Vehicle expenses (business use)
- Depreciation
- Bad debts (written off)
- Interest on business loans

---

## Common Mistakes to Avoid

1. ❌ Missing the filing deadline
2. ❌ Not declaring all sources of income
3. ❌ Claiming personal expenses as business deductions
4. ❌ Mathematical errors
5. ❌ Not keeping supporting documents
6. ❌ Not signing the return

---

## After Filing

- Keep copies of filed returns for 6 years
- Retain all supporting documents
- Respond promptly to GRA queries
- Set aside for quarterly tax installments

**Need assistance? Contact GCMC for professional tax preparation services.**`,
    supportsAutoFill: false,
    relatedServices: ["Personal Tax Filing", "Corporate Tax Filing"],
    requiredFor: ["Tax Compliance"],
    agencyUrl: "https://www.gra.gov.gy/tax-services/",
    isStaffOnly: false,
    isFeatured: true,
  },
  {
    type: "GUIDE",
    category: "GRA",
    business: "GCMC",
    title: "How to Register for VAT in Guyana",
    description:
      "Complete guide to VAT registration, returns, and compliance in Guyana. Covers registration thresholds, exempt supplies, and record-keeping requirements.",
    shortDescription: "VAT registration and compliance guide",
    content: `# How to Register for VAT in Guyana

## Overview
Value Added Tax (VAT) is a consumption tax applied to goods and services in Guyana.

**Standard VAT Rate:** 14%
**Registration Threshold:** GYD 15,000,000 annual turnover
**Filing Frequency:** Monthly (by 21st of following month)

---

## Who Must Register?

### Mandatory Registration
- Businesses with annual taxable supplies exceeding GYD 15,000,000
- Registration required within 21 days of exceeding threshold

### Voluntary Registration
- Businesses below threshold may register voluntarily
- Benefits: claim input VAT on purchases
- Commitment: file regular returns

---

## VAT-Exempt Supplies

The following are exempt from VAT:
- Basic food items (rice, flour, bread, vegetables, fish, etc.)
- Medical services and pharmaceuticals
- Educational services
- Financial services
- Residential rent
- Public transportation
- Agricultural inputs

---

## Registration Process

### Step 1: Prepare Documents
- [ ] TIN registration certificate
- [ ] Business registration/incorporation documents
- [ ] Financial statements (last 12 months)
- [ ] Projected turnover
- [ ] Bank account details

### Step 2: Submit Application
1. Complete VAT Registration Form
2. Submit to GRA VAT Department
3. Processing time: 7-14 days

### Step 3: Receive VAT Number
- VAT registration certificate issued
- VAT number for use on invoices
- Effective date of registration

---

## VAT Invoicing Requirements

Every VAT invoice must show:
1. Supplier name and VAT number
2. Customer name and address
3. Invoice number and date
4. Description of goods/services
5. Quantity and unit price
6. VAT amount (separately stated)
7. Total amount including VAT

---

## Filing VAT Returns

### Monthly Return (Form VAT-1)
Due by the 21st of the following month

### What to Report
1. Output VAT (tax collected on sales)
2. Input VAT (tax paid on purchases)
3. Net VAT payable or refundable
4. Exempt and zero-rated supplies

### Record Keeping
- Keep all tax invoices for 6 years
- Maintain sales and purchase records
- Keep import documents

---

## Input VAT Claims

### Claimable
- VAT on goods for resale
- VAT on business expenses
- VAT on capital assets

### Not Claimable
- Entertainment expenses
- Motor vehicles (private use)
- Personal expenses
- Exempt supplies inputs

---

## Common Mistakes

1. ❌ Late registration
2. ❌ Issuing invalid VAT invoices
3. ❌ Not keeping proper records
4. ❌ Claiming input VAT on exempt supplies
5. ❌ Late filing and payment
6. ❌ Under-declaring output VAT

---

## Penalties

| Offense | Penalty |
|---------|---------|
| Late registration | GYD 50,000 |
| Late filing | GYD 50,000 |
| Late payment | 2% per month |
| Invalid invoices | GYD 25,000 per invoice |

---

**GCMC can assist with VAT registration, return preparation, and compliance. Contact us today.**`,
    supportsAutoFill: false,
    relatedServices: ["VAT Registration", "VAT Compliance"],
    requiredFor: ["VAT Compliance"],
    agencyUrl: "https://www.gra.gov.gy/tax-services/vat/",
    isStaffOnly: false,
    isFeatured: false,
  },
  {
    type: "GUIDE",
    category: "NIS",
    business: "GCMC",
    title: "How to Apply for NIS Benefits",
    description:
      "Guide to NIS benefits including sickness, maternity, old age pension, and survivor benefits. Covers eligibility requirements and claim procedures.",
    shortDescription: "NIS benefits application guide",
    content: `# How to Apply for NIS Benefits

## Overview
The National Insurance Scheme (NIS) provides social security benefits to insured persons in Guyana.

**Contribution Rate:** 14% (5.6% employee + 8.4% employer)
**Insurable Earnings Ceiling:** GYD 280,000/month

---

## Available Benefits

### 1. Sickness Benefit
- **Eligibility:** 8+ paid contributions in last 13 weeks
- **Waiting Period:** 3 days
- **Duration:** Up to 26 weeks
- **Amount:** 70% of average insurable earnings

### 2. Maternity Benefit
- **Eligibility:** 15+ contributions in last 39 weeks
- **Duration:** 13 weeks (6 before, 7 after delivery)
- **Amount:** 70% of average insurable earnings

### 3. Funeral Grant
- **Eligibility:** 26+ paid contributions
- **Amount:** Fixed lump sum

### 4. Old Age Pension
- **Age:** 60 (men) or 55 (women)
- **Contributions:** 750+ paid contributions
- **Amount:** Based on contribution history

### 5. Invalidity Pension
- **Eligibility:** Permanently incapable of work
- **Contributions:** 150+ paid contributions
- **Amount:** Based on earnings and contributions

### 6. Survivor's Benefit
- **Eligibility:** Death of insured contributor
- **Recipients:** Spouse and dependent children
- **Amount:** Percentage of pension entitlement

---

## How to Claim

### Step 1: Obtain Claim Form
- Visit any NIS office
- Download from NIS website
- Request from employer

### Step 2: Complete the Form
- Personal details
- NIS number
- Employment history
- Medical certificate (if applicable)

### Step 3: Submit with Supporting Documents

**Sickness Benefit:**
- Medical certificate from registered physician
- Employer's statement of earnings
- Bank account details

**Maternity Benefit:**
- Doctor's certificate confirming pregnancy
- Expected delivery date
- Employer's statement

**Old Age Pension:**
- Birth certificate
- NIS card
- Marriage certificate (if claiming for spouse)

### Step 4: Processing
- Claims processed within 14-21 days
- Payment via bank transfer or NIS office

---

## Important Offices

**NIS Head Office**
Brickdam, Georgetown
Tel: 223-5203

**Regional Offices:**
- Linden
- New Amsterdam
- Rose Hall
- Anna Regina
- Bartica

---

## Tips for Faster Processing

1. ✅ Keep your NIS contributions up to date
2. ✅ Submit complete documentation
3. ✅ Use correct forms
4. ✅ Include valid contact information
5. ✅ Keep copies of all submissions

---

**GCMC can assist with NIS registration and benefit claims. Contact us for support.**`,
    supportsAutoFill: false,
    relatedServices: ["NIS Benefits Assistance"],
    requiredFor: ["Benefit Claims"],
    agencyUrl: "https://www.nis.gov.gy/benefits/",
    isStaffOnly: false,
    isFeatured: false,
  },
  {
    type: "GUIDE",
    category: "IMMIGRATION",
    business: "KAJ",
    title: "How to Apply for a Work Permit in Guyana",
    description:
      "Comprehensive guide to obtaining work authorization in Guyana for foreign nationals. Covers application requirements, processing times, and renewal procedures.",
    shortDescription: "Work permit application guide",
    content: `# How to Apply for a Work Permit in Guyana

## Overview
Foreign nationals require a valid work permit to be employed in Guyana.

**Issuing Authority:** Ministry of Home Affairs, Immigration Department
**Processing Time:** 4-6 weeks
**Validity:** 1-3 years

---

## Who Needs a Work Permit?

All foreign nationals seeking employment in Guyana EXCEPT:
- CARICOM nationals (free movement of skilled labor)
- Diplomatic personnel
- UN and international organization staff

---

## Step 1: Employer Responsibilities

### Before Hiring
1. Advertise position locally (minimum 2 weeks)
2. Document unsuccessful local recruitment
3. Justify need for foreign worker

### Employer's Application
The Guyanese employer must:
- Submit work permit application
- Provide job description
- Show no qualified local available
- Guarantee worker's repatriation

---

## Step 2: Required Documents

### From Employer
- [ ] Work permit application letter
- [ ] Company registration documents
- [ ] Tax compliance certificate
- [ ] Employment contract
- [ ] Proof of local advertising
- [ ] Business license

### From Employee
- [ ] Passport (valid 6+ months)
- [ ] Passport photos (4)
- [ ] CV/Resume
- [ ] Educational certificates
- [ ] Professional licenses
- [ ] Police clearance (home country)
- [ ] Medical certificate

---

## Step 3: Application Process

1. **Employer submits application**
   - Ministry of Home Affairs
   - Immigration Department
   - Camp Street, Georgetown

2. **Review and processing**
   - Document verification
   - Security clearance
   - Ministry recommendation

3. **Decision**
   - Approval: permit issued
   - Rejection: reasons provided

4. **Permit collection**
   - Employer collects permit
   - Fees payable at collection

---

## Fees

| Duration | Fee |
|----------|-----|
| 1 year | GYD 50,000 |
| 2 years | GYD 100,000 |
| 3 years | GYD 150,000 |

*Additional processing fees may apply*

---

## Work Permit Conditions

- Employment only with sponsoring employer
- Job changes require new application
- Must maintain valid passport
- Subject to immigration laws
- Report address changes

---

## Renewal Process

### Timeline
- Apply 30-60 days before expiry
- Same process as initial application
- Current permit must be valid

### Documents
- Current work permit
- Updated employer letter
- Performance evaluation
- Updated police clearance

---

## Common Reasons for Rejection

1. ❌ Incomplete documentation
2. ❌ Job can be filled locally
3. ❌ Criminal record issues
4. ❌ Previous immigration violations
5. ❌ Insufficient employer justification

---

## Important Notes

- Entering on tourist visa does not allow work
- Working without permit is illegal
- Employers face penalties for illegal workers
- Keep permit with passport at all times

---

**KAJ Immigration Services can handle your work permit application. Contact us for a consultation.**`,
    supportsAutoFill: false,
    relatedServices: ["Work Permit Application", "Immigration Services"],
    requiredFor: ["Foreign Worker Employment"],
    agencyUrl: "https://www.moha.gov.gy/immigration/",
    isStaffOnly: false,
    isFeatured: true,
  },
  {
    type: "GUIDE",
    category: "DCRA",
    business: "GCMC",
    title: "How to Transfer Property in Guyana (Conveyancing)",
    description:
      "Step-by-step guide to buying and selling real property in Guyana. Covers title search, agreement of sale, and transport registration.",
    shortDescription: "Property transfer guide",
    content: `# How to Transfer Property in Guyana

## Overview
This guide covers the legal process for transferring real property ownership in Guyana.

**Average Timeline:** 3-6 months
**Key Costs:** Stamp duty (2%), legal fees, registration

---

## Step 1: Agreement of Sale

### Negotiation
- Agree on purchase price
- Determine payment terms
- Set completion timeline

### Agreement Contents
- Parties' details
- Property description
- Purchase price and payment schedule
- Conditions (subject to title search, financing)
- Completion date
- Deposit amount (usually 10%)

**Important:** Have a lawyer review before signing!

---

## Step 2: Title Search

### Purpose
Verify:
- Seller's ownership
- No encumbrances (mortgages, liens)
- No pending litigation
- Property boundaries
- Outstanding taxes

### Process
1. Apply at Deeds Registry
2. Fee: GYD 5,000 per property
3. Results: 3-5 business days

---

## Step 3: Due Diligence

### Checks to Perform
- [ ] Physical inspection of property
- [ ] Verify boundaries match documents
- [ ] Check for building approvals
- [ ] Confirm no squatters
- [ ] Review municipal taxes status
- [ ] Verify utility connections

---

## Step 4: Prepare Transport

### Transport Document
- Legal document transferring ownership
- Prepared by attorney
- Signed by seller before Commissioner of Oaths

### Required Information
- Full legal description of property
- Transport number and date
- Seller and buyer details
- Purchase price
- Any covenants or conditions

---

## Step 5: Payment of Duties and Fees

### Stamp Duty
- **Rate:** 2% of property value
- Paid to GRA before registration
- Receipt required for registration

### Registration Fee
- Based on property value
- Paid to Deeds Registry

### Legal Fees
- Usually 2-3% of transaction value
- Covers preparation and registration

---

## Step 6: Registration

### At Deeds Registry
1. Submit original transport
2. Provide stamp duty receipt
3. Pay registration fee
4. Documents examined

### After Registration
- Transport registered in buyer's name
- Certified copy issued
- Original retained at Registry

---

## Mortgage Transactions

If purchasing with a loan:
1. Bank conducts own title search
2. Bank's lawyers prepare mortgage document
3. Both transport and mortgage registered
4. Mortgage creates security interest

---

## Common Issues

| Problem | Solution |
|---------|----------|
| Title defects | May require court action |
| Boundary disputes | Survey required |
| Missing documents | Search archives |
| Outstanding mortgages | Require discharge |
| Estate property | Probate required |

---

## Costs Summary

| Item | Approximate Cost |
|------|-----------------|
| Title search | GYD 5,000 |
| Stamp duty | 2% of value |
| Legal fees | 2-3% of value |
| Registration | GYD 10,000+ |
| Survey (if needed) | GYD 50,000+ |

---

**GCMC provides complete conveyancing services. Contact us for property transactions.**`,
    supportsAutoFill: false,
    relatedServices: ["Conveyancing", "Property Transfer"],
    requiredFor: ["Property Purchase", "Property Sale"],
    agencyUrl: "https://dcra.gov.gy/deeds-registry/",
    isStaffOnly: false,
    isFeatured: false,
  },
  {
    type: "GUIDE",
    category: "GRA",
    business: "GCMC",
    title: "PAYE Compliance Guide for Employers",
    description:
      "Essential guide for employers on PAYE (Pay As You Earn) tax obligations. Covers calculation, deduction, remittance, and reporting requirements.",
    shortDescription: "Employer PAYE compliance guide",
    content: `# PAYE Compliance Guide for Employers

## Overview
Pay As You Earn (PAYE) is the system where employers deduct income tax from employee wages and remit to GRA.

**Due Date:** 14th of following month
**Forms:** PAYE-1 (monthly return)

---

## Employer Obligations

### Registration
- Register as PAYE employer with GRA
- Obtain employer reference number
- Maintain payroll records

### Monthly Duties
1. Calculate tax due on employee earnings
2. Deduct tax from wages
3. Remit to GRA by 14th
4. Submit PAYE return

### Annual Duties
- Issue P14 certificates to employees
- Submit annual employer return
- Reconcile with monthly payments

---

## PAYE Calculation

### Tax Rates (2024)
| Annual Income | Rate |
|--------------|------|
| First GYD 3,120,000 | 28% |
| Above GYD 3,120,000 | 40% |

### Personal Allowance
- GYD 130,000 per month
- GYD 1,560,000 per year

### Formula
\`\`\`
Taxable Pay = Gross Pay - (Personal Allowance + NIS)
PAYE = Taxable Pay × Tax Rate
\`\`\`

---

## NIS Deductions

Deduct alongside PAYE:
- Employee contribution: 5.6%
- Employer contribution: 8.4%
- Ceiling: GYD 280,000/month

---

## What's Taxable?

### Taxable Benefits
- Basic salary
- Overtime pay
- Bonuses and commissions
- Housing allowance
- Vehicle allowance
- Entertainment allowance

### Non-Taxable
- Reimbursed business expenses
- Approved pension contributions
- Medical insurance (employer-paid)
- Gratuity (first GYD 10M)

---

## Monthly PAYE Return

### Form PAYE-1 Contents
- Employer details
- Total employees
- Total gross pay
- Total PAYE deducted
- Total NIS contributions
- Payment details

### Submission
- Online via TRIPS
- In person at GRA

---

## Record Keeping

Maintain for 6 years:
- [ ] Employee contracts
- [ ] Payroll registers
- [ ] Time records
- [ ] Leave records
- [ ] P14 copies
- [ ] PAYE returns
- [ ] Payment receipts

---

## New Employee Checklist

- [ ] Obtain NIS number (or register)
- [ ] Get tax exemption certificate (if applicable)
- [ ] Complete employee data form
- [ ] Add to payroll system
- [ ] Set up tax code

---

## Termination Procedures

1. Calculate final pay including:
   - Outstanding wages
   - Leave pay
   - Gratuity (if applicable)

2. Deduct final PAYE and NIS

3. Issue P14 certificate

4. Update monthly return

---

## Penalties

| Offense | Penalty |
|---------|---------|
| Late payment | 2% per month |
| Late filing | GYD 50,000 |
| No return | Criminal prosecution |
| Under-deduction | Recovery + penalties |

---

## Best Practices

1. ✅ Use payroll software
2. ✅ Reconcile monthly
3. ✅ File on time every month
4. ✅ Keep accurate records
5. ✅ Stay updated on rate changes

---

**GCMC provides payroll services including PAYE compliance. Contact us for assistance.**`,
    supportsAutoFill: false,
    relatedServices: ["Payroll Services", "PAYE Compliance"],
    requiredFor: ["Employer Tax Compliance"],
    agencyUrl: "https://www.gra.gov.gy/tax-services/paye/",
    isStaffOnly: false,
    isFeatured: false,
  },
  {
    type: "GUIDE",
    category: "DCRA",
    business: "GCMC",
    title: "Annual Corporate Compliance Checklist",
    description:
      "Year-end compliance checklist for Guyanese companies covering all statutory filings, tax obligations, and corporate governance requirements.",
    shortDescription: "Annual company compliance overview",
    content: `# Annual Corporate Compliance Checklist

## Overview
This comprehensive checklist ensures your company meets all annual compliance requirements in Guyana.

---

## Company Registry (DCRA)

### Annual Return (Form 3)
**Due:** Within 60 days of incorporation anniversary

**Contents:**
- [ ] Current directors
- [ ] Current shareholders
- [ ] Registered office address
- [ ] Share capital details

**Fee:** GYD 10,000 (+ late fees if applicable)

### Other Filings (Within 14 days of change)
- [ ] Director changes (Form 10)
- [ ] Address changes (Form 8)
- [ ] Share transfers (Form 5)
- [ ] Share capital changes

---

## Tax Compliance (GRA)

### Corporate Tax Return
**Due:** 3 months after financial year-end

**Requirements:**
- [ ] Audited financial statements (if applicable)
- [ ] Tax computation
- [ ] Supporting schedules
- [ ] Director certification

### VAT Returns (If registered)
**Due:** Monthly by 21st

- [ ] 12 monthly returns filed
- [ ] All payments made
- [ ] Input VAT properly claimed

### PAYE Returns
**Due:** Monthly by 14th

- [ ] 12 monthly returns filed
- [ ] All tax remitted
- [ ] P14s issued to employees
- [ ] Annual reconciliation

---

## NIS Compliance

### Monthly Returns
**Due:** By 14th of following month

- [ ] 12 monthly returns filed
- [ ] All contributions paid
- [ ] Employee registrations current

### Annual Reconciliation
- [ ] Verify all employees registered
- [ ] Reconcile contributions with wages
- [ ] Update employee records

---

## Financial Records

### Books to Maintain
- [ ] General ledger
- [ ] Cash book
- [ ] Sales journal
- [ ] Purchase journal
- [ ] Payroll records
- [ ] Fixed asset register
- [ ] Bank reconciliations

### Document Retention
Keep for minimum 6 years:
- [ ] Invoices (sales and purchases)
- [ ] Bank statements
- [ ] Contracts
- [ ] Tax returns
- [ ] Board minutes

---

## Corporate Governance

### Board Meetings
- [ ] Hold minimum 4 board meetings
- [ ] Maintain minutes
- [ ] Pass required resolutions

### Shareholders
- [ ] Hold Annual General Meeting
- [ ] Approve financial statements
- [ ] Declare dividends (if any)
- [ ] Appoint auditors (if required)

### Statutory Registers
Maintain updated:
- [ ] Register of directors
- [ ] Register of shareholders
- [ ] Register of charges
- [ ] Minutes books

---

## Other Licenses & Permits

### Municipal
- [ ] Business license renewed
- [ ] Property tax paid

### Industry-Specific
- [ ] Professional licenses current
- [ ] Environmental permits (if applicable)
- [ ] Health certificates (if applicable)

---

## Insurance

### Review Coverage
- [ ] Public liability
- [ ] Property insurance
- [ ] Workers' compensation
- [ ] Directors & officers (D&O)

---

## Important Deadlines Summary

| Obligation | Deadline |
|------------|----------|
| Annual Return | 60 days from anniversary |
| Corporate Tax | 3 months from year-end |
| VAT Returns | 21st of following month |
| PAYE Returns | 14th of following month |
| NIS Returns | 14th of following month |

---

## Penalties for Non-Compliance

| Area | Penalty |
|------|---------|
| Late Annual Return | GYD 5,000/month |
| Late Tax Return | GYD 10,000 + 2%/month |
| No Annual Return | Company may be struck off |

---

**GCMC offers annual compliance packages to keep your company in good standing. Contact us for details.**`,
    supportsAutoFill: false,
    relatedServices: ["Annual Compliance", "Corporate Secretarial"],
    requiredFor: ["Company Good Standing"],
    isStaffOnly: false,
    isFeatured: true,
  },
];

// ============================================
// CHECKLISTS
// ============================================

const checklists: KnowledgeBaseItemData[] = [
  {
    type: "CHECKLIST",
    category: "GENERAL",
    business: null,
    title: "New Client Onboarding Checklist",
    description:
      "Complete checklist for onboarding new clients. Covers KYC documentation, engagement letters, and system setup.",
    shortDescription: "Client onboarding requirements",
    content: `# New Client Onboarding Checklist

## Client Information
- [ ] Full legal name (individual or business)
- [ ] Trading name (if different)
- [ ] Date of birth / incorporation date
- [ ] TIN number
- [ ] NIS number (if employer)
- [ ] Contact phone and email
- [ ] Physical address
- [ ] Mailing address

## KYC Documentation

### Individuals
- [ ] Valid passport or national ID
- [ ] Proof of address (utility bill < 3 months)
- [ ] Source of funds declaration

### Companies
- [ ] Certificate of Incorporation
- [ ] Articles of Incorporation
- [ ] Current Annual Return
- [ ] Board resolution authorizing engagement
- [ ] Directors' IDs
- [ ] Beneficial ownership declaration

## Engagement
- [ ] Services scope confirmed
- [ ] Fee structure agreed
- [ ] Engagement letter signed
- [ ] Payment terms confirmed
- [ ] Deposit received (if applicable)

## System Setup
- [ ] Client record created in system
- [ ] Portal account created
- [ ] Welcome email sent
- [ ] Primary contact assigned
- [ ] Matters created

## Initial Meeting
- [ ] Introductory call scheduled
- [ ] Service overview provided
- [ ] Key contacts exchanged
- [ ] Communication preferences noted
- [ ] Urgent matters identified`,
    supportsAutoFill: false,
    relatedServices: ["Client Onboarding"],
    requiredFor: ["New Client Setup"],
    isStaffOnly: true,
    isFeatured: false,
  },
  {
    type: "CHECKLIST",
    category: "GRA",
    business: "GCMC",
    title: "Income Tax Filing Requirements Checklist",
    description:
      "Checklist of documents and information required for income tax return preparation.",
    shortDescription: "Tax filing document checklist",
    content: `# Income Tax Filing Requirements

## Personal Information
- [ ] Full name and TIN
- [ ] Address
- [ ] Bank account for refunds
- [ ] Dependents information

## Employment Income
- [ ] P14 from each employer
- [ ] Final pay slip for year
- [ ] Bonus/commission statements
- [ ] Benefits-in-kind details

## Business Income
- [ ] Financial statements
- [ ] Bank statements
- [ ] Sales records
- [ ] Expense receipts
- [ ] Asset purchases

## Investment Income
- [ ] Bank interest statements
- [ ] Dividend receipts
- [ ] Rental income records
- [ ] Capital gains documents

## Deductions
- [ ] NIS contribution statements
- [ ] Pension contributions
- [ ] Medical receipts
- [ ] Mortgage interest
- [ ] Charitable donations

## Previous Returns
- [ ] Copy of prior year return
- [ ] Carry-forward losses
- [ ] Outstanding assessments`,
    supportsAutoFill: false,
    relatedServices: ["Tax Filing"],
    requiredFor: ["Income Tax Return"],
    isStaffOnly: false,
    isFeatured: false,
  },
  {
    type: "CHECKLIST",
    category: "DCRA",
    business: "GCMC",
    title: "Company Incorporation Requirements",
    description:
      "Complete checklist of requirements for incorporating a company in Guyana.",
    shortDescription: "Incorporation requirements",
    content: `# Company Incorporation Requirements

## Name Search
- [ ] 3 proposed company names
- [ ] Name search fee (GYD 2,500/name)

## Directors Information
For each director:
- [ ] Full legal name
- [ ] Residential address
- [ ] Nationality
- [ ] Occupation
- [ ] Copy of ID (passport/national ID)
- [ ] Signed consent to act

## Shareholders Information
For each shareholder:
- [ ] Full name
- [ ] Address
- [ ] Number of shares
- [ ] ID copy (individual)
- [ ] Registration documents (corporate)

## Company Details
- [ ] Registered office address
- [ ] Nature of business
- [ ] Authorized share capital
- [ ] Share class structure
- [ ] Articles of Incorporation

## Fees
- [ ] Registration fee (GYD 25,000-55,000)
- [ ] Name search fee
- [ ] Certified copies fee

## Post-Incorporation
- [ ] Apply for TIN
- [ ] Register for VAT (if applicable)
- [ ] Register as NIS employer
- [ ] Open bank account
- [ ] Obtain business license`,
    supportsAutoFill: false,
    relatedServices: ["Company Incorporation"],
    requiredFor: ["New Company Setup"],
    isStaffOnly: false,
    isFeatured: true,
  },
  {
    type: "CHECKLIST",
    category: "GRA",
    business: "GCMC",
    title: "VAT Registration Requirements",
    description:
      "Documents and information required for VAT registration with GRA.",
    shortDescription: "VAT registration checklist",
    content: `# VAT Registration Requirements

## Business Information
- [ ] Business name
- [ ] Trading name (if different)
- [ ] TIN number
- [ ] Business address
- [ ] Nature of business activities

## Registration Documents
- [ ] Certificate of Incorporation OR
- [ ] Business Name Registration
- [ ] TIN registration certificate
- [ ] Bank account details

## Financial Information
- [ ] Estimated annual turnover
- [ ] Last 12 months sales records
- [ ] Financial statements
- [ ] Taxable and exempt sales breakdown

## Contact Information
- [ ] Principal contact person
- [ ] Email address
- [ ] Phone number
- [ ] Mailing address

## Supporting Documents
- [ ] Lease agreement OR proof of premises
- [ ] Business license
- [ ] Import/export licenses (if applicable)`,
    supportsAutoFill: false,
    relatedServices: ["VAT Registration"],
    requiredFor: ["VAT Compliance"],
    isStaffOnly: false,
    isFeatured: false,
  },
  {
    type: "CHECKLIST",
    category: "NIS",
    business: "GCMC",
    title: "NIS Employer Registration Requirements",
    description: "Requirements for registering as an employer with NIS.",
    shortDescription: "NIS employer registration checklist",
    content: `# NIS Employer Registration Requirements

## Employer Information
- [ ] Business name
- [ ] Business address
- [ ] Nature of business
- [ ] Date business started
- [ ] Number of employees

## Registration Documents
- [ ] Certificate of Incorporation OR
- [ ] Business Name Registration
- [ ] TIN certificate
- [ ] Business license

## Authorized Representative
- [ ] Name of authorized person
- [ ] Position/title
- [ ] Contact information
- [ ] ID copy

## Employee Information
For each employee:
- [ ] Full name
- [ ] Date of birth
- [ ] NIS number (or apply)
- [ ] Date of employment
- [ ] Monthly salary

## Bank Details
- [ ] Bank name
- [ ] Account number
- [ ] Branch

## Forms Required
- [ ] Form NIS-1 (Employer Registration)
- [ ] Form NIS-2 (Employee Registration - each employee)`,
    supportsAutoFill: false,
    relatedServices: ["NIS Registration", "Payroll Setup"],
    requiredFor: ["NIS Compliance"],
    isStaffOnly: false,
    isFeatured: false,
  },
  {
    type: "CHECKLIST",
    category: "IMMIGRATION",
    business: "KAJ",
    title: "Work Permit Application Requirements",
    description:
      "Complete checklist of requirements for work permit applications in Guyana.",
    shortDescription: "Work permit application checklist",
    content: `# Work Permit Application Requirements

## From Employer
- [ ] Work permit application letter
- [ ] Company registration documents
- [ ] Tax compliance certificate
- [ ] Employment contract
- [ ] Job description
- [ ] Evidence of local advertising
- [ ] Justification for foreign worker
- [ ] Business license

## From Employee
- [ ] Valid passport (6+ months validity)
- [ ] 4 passport-size photos
- [ ] Curriculum vitae
- [ ] Educational certificates
- [ ] Professional licenses/certifications
- [ ] Police clearance (home country)
- [ ] Medical certificate
- [ ] Previous work permits (if any)

## Additional Documents
- [ ] Proof of qualifications
- [ ] Reference letters
- [ ] Skills assessment (if required)

## Fees
- [ ] Application fee
- [ ] Work permit fee (GYD 50,000-150,000)
- [ ] Processing fee

## Renewal Only
- [ ] Current work permit
- [ ] Employment performance letter
- [ ] Updated police clearance`,
    supportsAutoFill: false,
    relatedServices: ["Work Permit Application"],
    requiredFor: ["Foreign Worker Employment"],
    isStaffOnly: false,
    isFeatured: true,
  },
  {
    type: "CHECKLIST",
    category: "DCRA",
    business: "GCMC",
    title: "Property Purchase Requirements",
    description:
      "Checklist for purchasing property in Guyana covering legal and financial requirements.",
    shortDescription: "Property buying checklist",
    content: `# Property Purchase Requirements

## Before Signing Agreement
- [ ] View property in person
- [ ] Verify seller's identity
- [ ] Confirm property boundaries
- [ ] Check building approvals
- [ ] Review property tax status
- [ ] Assess property condition

## Title Investigation
- [ ] Commission title search
- [ ] Review transport history
- [ ] Check for encumbrances
- [ ] Verify no pending litigation
- [ ] Confirm property dimensions

## Documentation
- [ ] Agreement of Sale
- [ ] Seller's transport copy
- [ ] Survey plan
- [ ] Building plans (if applicable)
- [ ] Property tax receipts
- [ ] Utility account status

## Financing (if applicable)
- [ ] Loan pre-approval
- [ ] Bank valuation
- [ ] Insurance quote
- [ ] Mortgage documents

## Closing Requirements
- [ ] Final inspection
- [ ] Stamp duty (2%)
- [ ] Legal fees
- [ ] Registration fees
- [ ] Keys and access codes

## Post-Purchase
- [ ] Transfer utilities
- [ ] Update property tax records
- [ ] Update insurance
- [ ] Secure property`,
    supportsAutoFill: false,
    relatedServices: ["Property Purchase", "Conveyancing"],
    requiredFor: ["Real Estate Transaction"],
    isStaffOnly: false,
    isFeatured: false,
  },
];

// ============================================
// MAIN SEED FUNCTION
// ============================================

async function seedKnowledgeBase() {
  console.log("🌱 Starting Knowledge Base seed...\n");

  // Get an owner user to use as createdById
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

  const createdById = owners[0].id;
  console.log(`✅ Using owner: ${owners[0].name} (${createdById})\n`);

  // Combine all items
  const allItems = [
    ...agencyForms,
    ...letterTemplates,
    ...guides,
    ...checklists,
  ];

  console.log(`📚 Preparing to insert ${allItems.length} items:`);
  console.log(`   - Agency Forms: ${agencyForms.length}`);
  console.log(`   - Letter Templates: ${letterTemplates.length}`);
  console.log(`   - Guides: ${guides.length}`);
  console.log(`   - Checklists: ${checklists.length}\n`);

  let inserted = 0;
  let skipped = 0;

  for (const item of allItems) {
    // Check if item already exists by title
    const existing = await db
      .select({ id: knowledgeBaseItem.id })
      .from(knowledgeBaseItem)
      .where(eq(knowledgeBaseItem.title, item.title))
      .limit(1);

    if (existing.length > 0) {
      console.log(`⏭️  Skipping (exists): ${item.title}`);
      skipped += 1;
      continue;
    }

    await db.insert(knowledgeBaseItem).values({
      type: item.type,
      category: item.category,
      business: item.business,
      title: item.title,
      description: item.description,
      shortDescription: item.shortDescription,
      content: item.content,
      fileName: item.fileName,
      mimeType: item.mimeType,
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
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Total: ${allItems.length}`);
  console.log(`${"=".repeat(50)}\n`);
}

// Run the seed
seedKnowledgeBase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  });
