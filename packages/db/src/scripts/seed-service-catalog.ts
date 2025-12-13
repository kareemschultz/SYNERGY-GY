/**
 * Service Catalog Seed Script
 *
 * Populates service_catalog and service_category tables with actual GCMC and KAJ offerings
 * Based on /specs/business-rules/gcmc-services.md and kaj-services.md
 *
 * This is NOT mock data - these are the real services offered by the businesses.
 */

import { db } from "../index";
import { serviceCatalog, serviceCategory } from "../schema/service-catalog";

async function seedServiceCatalog() {
  console.log("🌱 Seeding service catalog...");

  // First, create service categories
  console.log("📁 Creating service categories...");

  const gcmcTraining = await db
    .insert(serviceCategory)
    .values({
      business: "GCMC",
      name: "TRAINING",
      displayName: "Training & Development",
      description:
        "Professional development programs designed to enhance organizational and individual capacity.",
      icon: "GraduationCap",
      sortOrder: 1,
    })
    .returning()
    .then((rows) => rows[0]);

  const gcmcConsulting = await db
    .insert(serviceCategory)
    .values({
      business: "GCMC",
      name: "CONSULTANCY",
      displayName: "Business Development & Consultancy",
      description:
        "Professional services to support entrepreneurs and small business owners.",
      icon: "Briefcase",
      sortOrder: 2,
    })
    .returning()
    .then((rows) => rows[0]);

  const gcmcParalegal = await db
    .insert(serviceCategory)
    .values({
      business: "GCMC",
      name: "PARALEGAL",
      displayName: "Paralegal Services",
      description: "Professional legal documentation and support services.",
      icon: "FileText",
      sortOrder: 3,
    })
    .returning()
    .then((rows) => rows[0]);

  const gcmcImmigration = await db
    .insert(serviceCategory)
    .values({
      business: "GCMC",
      name: "IMMIGRATION",
      displayName: "Immigration Services",
      description:
        "Comprehensive immigration application support for foreign nationals.",
      icon: "Plane",
      sortOrder: 4,
    })
    .returning()
    .then((rows) => rows[0]);

  const gcmcProposals = await db
    .insert(serviceCategory)
    .values({
      business: "GCMC",
      name: "BUSINESS_PROPOSALS",
      displayName: "Business Proposals",
      description:
        "Professional business proposal writing and preparation services.",
      icon: "FileEdit",
      sortOrder: 5,
    })
    .returning()
    .then((rows) => rows[0]);

  const kajTax = await db
    .insert(serviceCategory)
    .values({
      business: "KAJ",
      name: "TAX",
      displayName: "Tax Services",
      description: "Complete tax return preparation and compliance services.",
      icon: "Calculator",
      sortOrder: 6,
    })
    .returning()
    .then((rows) => rows[0]);

  const kajCompliance = await db
    .insert(serviceCategory)
    .values({
      business: "KAJ",
      name: "COMPLIANCE",
      displayName: "Compliance Services",
      description:
        "Comprehensive compliance documentation for various regulatory requirements.",
      icon: "CheckCircle",
      sortOrder: 7,
    })
    .returning()
    .then((rows) => rows[0]);

  const kajFinancial = await db
    .insert(serviceCategory)
    .values({
      business: "KAJ",
      name: "FINANCIAL_STATEMENTS",
      displayName: "Financial Statements",
      description:
        "Professional financial statements for various applications.",
      icon: "FileSpreadsheet",
      sortOrder: 8,
    })
    .returning()
    .then((rows) => rows[0]);

  const kajAudit = await db
    .insert(serviceCategory)
    .values({
      business: "KAJ",
      name: "AUDIT",
      displayName: "Audit Services",
      description: "Statutory audits and financial statement preparation.",
      icon: "Search",
      sortOrder: 9,
    })
    .returning()
    .then((rows) => rows[0]);

  const kajNIS = await db
    .insert(serviceCategory)
    .values({
      business: "KAJ",
      name: "NIS",
      displayName: "NIS Services",
      description: "Complete NIS administration and pension applications.",
      icon: "Shield",
      sortOrder: 10,
    })
    .returning()
    .then((rows) => rows[0]);

  console.log("✓ Created 10 service categories");

  // Now create services with proper schema fields
  const services = [
    // GCMC - Training Services
    {
      categoryId: gcmcTraining.id,
      business: "GCMC",
      name: "Human Resource Management Training",
      displayName: "HR Management Training",
      shortDescription:
        "Professional development program covering recruitment, employee relations, performance management, and HR best practices.",
      description:
        "Comprehensive training covering recruitment and selection, employee onboarding, performance management, disciplinary procedures, Guyana Labour Act compliance, and HR record-keeping requirements.",
      typicalDuration: "2-5 days",
      estimatedDays: 2,
      pricingType: "TIERED",
      basePrice: "30000",
      maxPrice: "80000",
      pricingTiers: [
        {
          name: "2 Days",
          minPrice: 30_000,
          maxPrice: 50_000,
          description: "Per person",
        },
        {
          name: "5 Days",
          minPrice: 50_000,
          maxPrice: 80_000,
          description: "Per person",
        },
        {
          name: "Corporate Package",
          description: "10+ participants - Negotiable",
        },
      ],
      documentRequirements: [
        "Registration form",
        "Proof of payment",
        "Copy of ID for certificate",
      ],
      isFeatured: true,
      sortOrder: 1,
    },
    {
      categoryId: gcmcTraining.id,
      business: "GCMC",
      name: "Customer Relations Training",
      displayName: "Customer Relations Training",
      shortDescription:
        "Service excellence training focused on customer engagement, conflict resolution, and communication skills.",
      description:
        "Training covering customer needs assessment, effective communication, handling difficult customers, complaint resolution, building loyalty, and service recovery techniques.",
      typicalDuration: "1-3 days",
      estimatedDays: 1,
      pricingType: "TIERED",
      basePrice: "15000",
      maxPrice: "50000",
      pricingTiers: [
        {
          name: "1 Day",
          minPrice: 15_000,
          maxPrice: 25_000,
          description: "Per person",
        },
        {
          name: "2-3 Days",
          minPrice: 30_000,
          maxPrice: 50_000,
          description: "Per person",
        },
      ],
      documentRequirements: [
        "Registration form",
        "Proof of payment",
        "Copy of ID",
      ],
      sortOrder: 2,
    },
    {
      categoryId: gcmcTraining.id,
      business: "GCMC",
      name: "Co-operatives and Credit Unions Training",
      displayName: "Co-op & Credit Union Training",
      shortDescription:
        "Specialized training on cooperative principles, governance, and regulatory compliance.",
      description:
        "Training on cooperative principles and values, governance and board responsibilities, financial management, Guyana Co-operative Societies Act compliance, and risk management.",
      typicalDuration: "2-5 days",
      estimatedDays: 2,
      pricingType: "TIERED",
      basePrice: "30000",
      maxPrice: "80000",
      pricingTiers: [
        {
          name: "2 Days",
          minPrice: 30_000,
          maxPrice: 50_000,
          description: "Per person",
        },
        {
          name: "5 Days",
          minPrice: 50_000,
          maxPrice: 80_000,
          description: "Per person",
        },
      ],
      documentRequirements: [
        "Registration form",
        "Proof of payment",
        "Copy of ID",
        "Cooperative registration documents",
      ],
      governmentAgencies: [
        "Department of Co-operatives (Ministry of Labour)",
        "Credit Union League",
      ],
      sortOrder: 3,
    },
    {
      categoryId: gcmcTraining.id,
      business: "GCMC",
      name: "Organisational Management Training",
      displayName: "Organizational Management",
      shortDescription:
        "Comprehensive training on organizational structure, strategic planning, and leadership.",
      description:
        "Training covering organizational structure and design, strategic planning, leadership and team management, change management, process improvement, and project management fundamentals.",
      typicalDuration: "3-5 days",
      estimatedDays: 3,
      pricingType: "TIERED",
      basePrice: "40000",
      maxPrice: "80000",
      pricingTiers: [
        {
          name: "3 Days",
          minPrice: 40_000,
          maxPrice: 60_000,
          description: "Per person",
        },
        {
          name: "5 Days",
          minPrice: 50_000,
          maxPrice: 80_000,
          description: "Per person",
        },
      ],
      documentRequirements: [
        "Registration form",
        "Proof of payment",
        "Copy of ID",
      ],
      sortOrder: 4,
    },

    // GCMC - Consultancy Services
    {
      categoryId: gcmcConsulting.id,
      business: "GCMC",
      name: "Company Incorporation",
      displayName: "Company Incorporation",
      shortDescription:
        "Complete service for incorporating a limited liability company in Guyana.",
      description:
        "Full company incorporation including name search, Memorandum and Articles of Association, director consents, submission to Deeds Registry, and post-incorporation compliance support.",
      typicalDuration: "7-14 business days",
      estimatedDays: 14,
      pricingType: "RANGE",
      basePrice: "80000",
      maxPrice: "150000",
      documentRequirements: [
        "Director IDs (minimum 2)",
        "Proof of address",
        "Proposed company names (3 options)",
        "Registered office address proof",
        "Share structure details",
        "Business objectives",
      ],
      governmentAgencies: [
        "Deeds Registry (Ministry of Legal Affairs)",
        "Guyana Revenue Authority (TIN)",
        "National Insurance Scheme",
      ],
      isFeatured: true,
      sortOrder: 5,
    },
    {
      categoryId: gcmcConsulting.id,
      business: "GCMC",
      name: "Business Registration",
      displayName: "Business Registration",
      shortDescription:
        "Registration of business names, sole proprietorships, and partnerships.",
      description:
        "Complete business name registration with the Deeds Registry, including name search, form completion, submission, and post-registration guidance.",
      typicalDuration: "3-7 business days",
      estimatedDays: 7,
      pricingType: "TIERED",
      basePrice: "15000",
      maxPrice: "35000",
      pricingTiers: [
        { name: "Business Name", minPrice: 15_000, maxPrice: 25_000 },
        { name: "Partnership", minPrice: 20_000, maxPrice: 35_000 },
        { name: "Renewals", minPrice: 12_000, maxPrice: 20_000 },
      ],
      documentRequirements: [
        "National ID or Passport",
        "Proof of address",
        "Proposed business names",
        "Business address proof",
      ],
      governmentAgencies: [
        "Deeds Registry",
        "Guyana Revenue Authority (TIN)",
        "City/Town Council",
      ],
      isFeatured: true,
      sortOrder: 6,
    },

    // GCMC - Paralegal Services
    {
      categoryId: gcmcParalegal.id,
      business: "GCMC",
      name: "Affidavits",
      displayName: "Affidavits",
      shortDescription:
        "Preparation and commissioning of sworn written statements.",
      description:
        "Professional affidavit preparation for support, common law union, single status, name change, loss of documents, ownership, and residency purposes.",
      typicalDuration: "Same day to 1 business day",
      estimatedDays: 1,
      pricingType: "RANGE",
      basePrice: "5000",
      maxPrice: "15000",
      documentRequirements: [
        "Valid ID",
        "Supporting documents",
        "Details of facts to be sworn",
      ],
      sortOrder: 7,
    },
    {
      categoryId: gcmcParalegal.id,
      business: "GCMC",
      name: "Agreement of Sales and Purchases",
      displayName: "Sales & Purchase Agreements",
      shortDescription:
        "Legally binding contracts for sale and purchase of property, vehicles, or businesses.",
      description:
        "Professional contract drafting for property, vehicle, business, equipment, and asset sales with legal review and notarization.",
      typicalDuration: "2-5 business days",
      estimatedDays: 5,
      pricingType: "RANGE",
      basePrice: "20000",
      maxPrice: "60000",
      documentRequirements: [
        "Seller and buyer IDs",
        "Property/asset details",
        "Proof of ownership",
        "Purchase price and payment terms",
      ],
      governmentAgencies: [
        "Transport and Harbours Department (vehicles)",
        "Deeds Registry (property)",
      ],
      sortOrder: 8,
    },
    {
      categoryId: gcmcParalegal.id,
      business: "GCMC",
      name: "Wills",
      displayName: "Wills",
      shortDescription:
        "Testamentary documents for distribution of assets upon death.",
      description:
        "Comprehensive will preparation ensuring legal compliance with Guyana's succession laws, including estate planning consultation and executor designation.",
      typicalDuration: "3-7 business days",
      estimatedDays: 7,
      pricingType: "RANGE",
      basePrice: "25000",
      maxPrice: "75000",
      documentRequirements: [
        "Valid ID",
        "List of assets",
        "Beneficiary details",
        "Executor designation",
        "Guardian designation (if minor children)",
      ],
      sortOrder: 9,
    },
    {
      categoryId: gcmcParalegal.id,
      business: "GCMC",
      name: "Separation Agreement",
      displayName: "Separation Agreement",
      shortDescription: "Legal contracts for spouses or partners separating.",
      description:
        "Comprehensive separation agreements outlining asset division, child custody, support arrangements, and other separation terms with legal review and notarization.",
      typicalDuration: "5-10 business days",
      estimatedDays: 10,
      pricingType: "RANGE",
      basePrice: "40000",
      maxPrice: "100000",
      documentRequirements: [
        "Both parties' IDs",
        "Marriage certificate or proof of relationship",
        "Property ownership documents",
        "Financial disclosure",
        "Children's information",
      ],
      governmentAgencies: [
        "Supreme Court",
        "Child Care and Protection Agency",
        "Maintenance Court",
      ],
      sortOrder: 10,
    },
    {
      categoryId: gcmcParalegal.id,
      business: "GCMC",
      name: "Investment & Partnership Agreement",
      displayName: "Partnership Agreements",
      shortDescription:
        "Legal contracts for business partnerships and joint ventures.",
      description:
        "Comprehensive partnership agreements including capital contributions, profit sharing, management structure, decision-making processes, and exit provisions.",
      typicalDuration: "5-10 business days",
      estimatedDays: 10,
      pricingType: "RANGE",
      basePrice: "50000",
      maxPrice: "150000",
      documentRequirements: [
        "All partners/investors IDs",
        "Business plan",
        "Capital contribution details",
        "Ownership percentage terms",
        "Management structure",
      ],
      sortOrder: 11,
    },

    // GCMC - Immigration Services
    {
      categoryId: gcmcImmigration.id,
      business: "GCMC",
      name: "Work Permits",
      displayName: "Work Permits",
      shortDescription:
        "Work authorization applications for foreign nationals.",
      description:
        "Complete work permit applications and renewals for foreign nationals employed in Guyana, including document preparation and submission to Ministry of Home Affairs.",
      typicalDuration: "4-8 weeks",
      estimatedDays: 56,
      pricingType: "TIERED",
      basePrice: "50000",
      maxPrice: "100000",
      pricingTiers: [
        { name: "New Work Permit", minPrice: 50_000, maxPrice: 100_000 },
        { name: "Renewal", minPrice: 40_000, maxPrice: 80_000 },
        { name: "Amendment", minPrice: 35_000, maxPrice: 60_000 },
        { name: "Dependent Permit", minPrice: 30_000, maxPrice: 50_000 },
      ],
      pricingNotes: "Urgent processing: +50% premium",
      documentRequirements: [
        "Valid passport",
        "Passport photographs",
        "Birth certificate",
        "Police clearance",
        "Medical certificate",
        "Educational qualifications",
        "Employer documents",
      ],
      governmentAgencies: [
        "Ministry of Home Affairs",
        "Ministry of Labour",
        "Ministry of Health",
      ],
      isFeatured: true,
      sortOrder: 12,
    },
    {
      categoryId: gcmcImmigration.id,
      business: "GCMC",
      name: "Citizenship",
      displayName: "Citizenship Applications",
      shortDescription:
        "Citizenship applications through naturalization or registration.",
      description:
        "Comprehensive citizenship application assistance including naturalization (7+ years residence), registration (marriage/descent), and all required documentation.",
      typicalDuration: "6-18 months",
      estimatedDays: 365,
      pricingType: "TIERED",
      basePrice: "120000",
      maxPrice: "200000",
      pricingTiers: [
        { name: "Naturalization", minPrice: 120_000, maxPrice: 200_000 },
        { name: "Registration", minPrice: 80_000, maxPrice: 150_000 },
      ],
      documentRequirements: [
        "Valid passport",
        "Birth certificate",
        "Police clearance",
        "Proof of residence",
        "Tax compliance certificate",
        "NIS records",
        "Character references",
      ],
      governmentAgencies: [
        "Ministry of Home Affairs",
        "Guyana Police Force",
        "Guyana Revenue Authority",
        "National Insurance Scheme",
      ],
      sortOrder: 13,
    },
    {
      categoryId: gcmcImmigration.id,
      business: "GCMC",
      name: "Business Visa",
      displayName: "Business Visas",
      shortDescription: "Business visa applications for foreign nationals.",
      description:
        "Business visa application support for conferences, meetings, investment exploration, and business missions with invitation letter preparation and submission assistance.",
      typicalDuration: "1-3 weeks",
      estimatedDays: 21,
      pricingType: "TIERED",
      basePrice: "25000",
      maxPrice: "60000",
      pricingTiers: [
        { name: "Single Entry", minPrice: 25_000, maxPrice: 40_000 },
        { name: "Multiple Entry", minPrice: 35_000, maxPrice: 60_000 },
      ],
      pricingNotes: "Urgent processing: +GYD 15,000",
      documentRequirements: [
        "Valid passport",
        "Visa application form",
        "Passport photographs",
        "Letter of invitation",
        "Company registration",
        "Travel itinerary",
      ],
      governmentAgencies: [
        "Ministry of Home Affairs",
        "Ministry of Foreign Affairs",
      ],
      sortOrder: 14,
    },

    // GCMC - Business Proposals
    {
      categoryId: gcmcProposals.id,
      business: "GCMC",
      name: "Land Occupation Proposals",
      displayName: "Land Occupation Proposals",
      shortDescription: "Proposals for state land occupation applications.",
      description:
        "Comprehensive land occupation proposals including development plans, financial projections, environmental considerations, and regulatory compliance for agricultural, commercial, or industrial use.",
      typicalDuration: "2-4 weeks",
      estimatedDays: 28,
      pricingType: "RANGE",
      basePrice: "80000",
      maxPrice: "200000",
      documentRequirements: [
        "Applicant ID and business registration",
        "Land coordinates or description",
        "Intended use details",
        "Development plan",
        "Financial capacity proof",
      ],
      governmentAgencies: [
        "Guyana Lands and Surveys Commission",
        "Ministry of Agriculture",
        "Environmental Protection Agency (EPA)",
        "Regional Democratic Council (RDC)",
      ],
      sortOrder: 15,
    },
    {
      categoryId: gcmcProposals.id,
      business: "GCMC",
      name: "Investment Proposals",
      displayName: "Investment Proposals",
      shortDescription:
        "Professional investment proposals for securing funding.",
      description:
        "Comprehensive business plans with market research, financial modeling, risk assessment, and presentation-ready documents for banks, investors, or government programs.",
      typicalDuration: "3-6 weeks",
      estimatedDays: 42,
      pricingType: "RANGE",
      basePrice: "150000",
      maxPrice: "400000",
      documentRequirements: [
        "Investor background",
        "Business concept",
        "Market research data",
        "Financial statements",
        "Funding requirements",
      ],
      governmentAgencies: [
        "Guyana Office for Investment (GO-Invest)",
        "Bank of Guyana",
        "Ministry of Finance",
        "Small Business Bureau",
      ],
      isFeatured: true,
      sortOrder: 16,
    },
    {
      categoryId: gcmcProposals.id,
      business: "GCMC",
      name: "Start-Up Proposals",
      displayName: "Start-Up Proposals",
      shortDescription: "Business proposals for new venture launches.",
      description:
        "Tailored start-up business plans for grant applications, accelerator programs, and initial funding with lean business model development and pitch deck preparation.",
      typicalDuration: "2-4 weeks",
      estimatedDays: 28,
      pricingType: "RANGE",
      basePrice: "60000",
      maxPrice: "150000",
      documentRequirements: [
        "Entrepreneur background",
        "Business idea description",
        "Market research",
        "Startup cost estimates",
        "Funding needs",
      ],
      governmentAgencies: [
        "Small Business Bureau",
        "Institute of Private Enterprise Development (IPED)",
        "GO-Invest",
      ],
      sortOrder: 17,
    },

    // KAJ - Tax Services
    {
      categoryId: kajTax.id,
      business: "KAJ",
      name: "Individual Income Tax Returns",
      displayName: "Individual Tax Returns",
      shortDescription: "Personal income tax return preparation and filing.",
      description:
        "Complete individual tax return preparation for employed and self-employed persons using GRA forms IT-01 and IT-03, including all deductions and calculations.",
      typicalDuration: "3-5 days",
      estimatedDays: 5,
      pricingType: "RANGE",
      basePrice: "15000",
      maxPrice: "60000",
      documentRequirements: [
        "Pay slips",
        "NIS records",
        "Bank statements",
        "Investment income statements",
        "Deduction receipts",
      ],
      governmentAgencies: ["Guyana Revenue Authority"],
      isFeatured: true,
      sortOrder: 18,
    },
    {
      categoryId: kajTax.id,
      business: "KAJ",
      name: "Corporate Tax Returns",
      displayName: "Corporate Tax Returns",
      shortDescription: "Business income tax filing for companies.",
      description:
        "Comprehensive corporate tax return preparation using form CT-01 with all required schedules, including financial statement review and tax computation.",
      typicalDuration: "5-10 days",
      estimatedDays: 10,
      pricingType: "RANGE",
      basePrice: "50000",
      maxPrice: "300000",
      documentRequirements: [
        "Financial statements",
        "Trial balance",
        "General ledger",
        "Asset register",
        "Payroll records",
        "Prior returns",
      ],
      governmentAgencies: ["Guyana Revenue Authority"],
      isFeatured: true,
      sortOrder: 19,
    },
    {
      categoryId: kajTax.id,
      business: "KAJ",
      name: "Self-Employed Tax Returns",
      displayName: "Self-Employed Returns",
      shortDescription: "Tax returns for sole proprietors and contractors.",
      description:
        "Tax return preparation for self-employed individuals and independent contractors with complete business income and expense reporting using IT-01 with business schedules.",
      typicalDuration: "3-7 days",
      estimatedDays: 7,
      pricingType: "RANGE",
      basePrice: "25000",
      maxPrice: "80000",
      documentRequirements: [
        "Revenue records",
        "Expense receipts",
        "Business bank statements",
        "Vehicle logs",
        "Inventory records",
      ],
      governmentAgencies: ["Guyana Revenue Authority"],
      sortOrder: 20,
    },
    {
      categoryId: kajTax.id,
      business: "KAJ",
      name: "Monthly PAYE Submissions",
      displayName: "Monthly PAYE",
      shortDescription: "Monthly employer payroll tax filing.",
      description:
        "Calculate and file monthly PAYE tax withholding using forms PAYE-01 and PAYE-03 with all required employee tax calculations and submissions to GRA TRIPS system.",
      typicalDuration: "2-3 days",
      estimatedDays: 3,
      pricingType: "RANGE",
      basePrice: "10000",
      maxPrice: "25000",
      documentRequirements: [
        "Payroll register",
        "Employee earnings",
        "Tax withheld",
        "Payments made",
      ],
      governmentAgencies: [
        "Guyana Revenue Authority",
        "National Insurance Scheme",
      ],
      sortOrder: 21,
    },
    {
      categoryId: kajTax.id,
      business: "KAJ",
      name: "Annual PAYE Reconciliation",
      displayName: "Annual PAYE Reconciliation",
      shortDescription:
        "Year-end PAYE reconciliation and employee certificates.",
      description:
        "Complete annual PAYE reconciliation using form PAYE-04 with employee tax certificates and verification of all monthly submissions for the tax year.",
      typicalDuration: "5-7 days",
      estimatedDays: 7,
      pricingType: "RANGE",
      basePrice: "30000",
      maxPrice: "80000",
      documentRequirements: [
        "All monthly returns",
        "Annual payroll summary",
        "Employee tax certificates",
      ],
      governmentAgencies: [
        "Guyana Revenue Authority",
        "National Insurance Scheme",
      ],
      sortOrder: 22,
    },

    // KAJ - Compliance Services
    {
      categoryId: kajCompliance.id,
      business: "KAJ",
      name: "Tender Compliance",
      displayName: "Tender Compliance",
      shortDescription: "Tax compliance documentation for tender applications.",
      description:
        "Complete tax compliance package for government and private sector tenders including Certificate of Compliance, Tax Clearance, and NIS compliance certificates.",
      typicalDuration: "5-10 days",
      estimatedDays: 10,
      pricingType: "RANGE",
      basePrice: "25000",
      maxPrice: "50000",
      documentRequirements: [
        "Recent tax returns",
        "Certificate of compliance",
        "NIS compliance",
        "Financial statements",
      ],
      governmentAgencies: [
        "Guyana Revenue Authority",
        "National Insurance Scheme",
      ],
      sortOrder: 23,
    },
    {
      categoryId: kajCompliance.id,
      business: "KAJ",
      name: "Work Permit Compliance",
      displayName: "Work Permit Compliance",
      shortDescription: "Tax clearance for work permit applications.",
      description:
        "Tax clearance and compliance documentation for work permit applications and renewals with GRA compliance letters and certificates.",
      typicalDuration: "5-7 days",
      estimatedDays: 7,
      pricingType: "RANGE",
      basePrice: "25000",
      maxPrice: "40000",
      documentRequirements: [
        "Recent tax returns",
        "Proof of tax payments",
        "NIS compliance",
      ],
      governmentAgencies: [
        "Guyana Revenue Authority",
        "National Insurance Scheme",
        "Ministry of Home Affairs",
      ],
      sortOrder: 24,
    },
    {
      categoryId: kajCompliance.id,
      business: "KAJ",
      name: "Land Transfer Compliance",
      displayName: "Land Transfer Compliance",
      shortDescription: "Tax documentation for property transfers.",
      description:
        "Complete tax compliance package for property transfers and transactions including Certificate of Compliance, Tax Clearance, and capital gains calculations.",
      typicalDuration: "7-10 days",
      estimatedDays: 10,
      pricingType: "RANGE",
      basePrice: "30000",
      maxPrice: "60000",
      documentRequirements: [
        "Property documents",
        "Prior tax returns",
        "Capital gains calculations",
      ],
      governmentAgencies: ["Guyana Revenue Authority", "Deeds Registry"],
      sortOrder: 25,
    },

    // KAJ - Financial Statements
    {
      categoryId: kajFinancial.id,
      business: "KAJ",
      name: "Bank Loan Statements",
      displayName: "Loan Application Statements",
      shortDescription: "Income/expenditure statements for loan applications.",
      description:
        "Professional income and expenditure analysis for loan applications including cash flow projections, debt service capacity, and comprehensive financial assessment.",
      typicalDuration: "3-5 days",
      estimatedDays: 5,
      pricingType: "RANGE",
      basePrice: "30000",
      maxPrice: "60000",
      documentRequirements: [
        "6-12 months bank statements",
        "Income sources",
        "Asset listings",
        "Liabilities",
      ],
      sortOrder: 26,
    },
    {
      categoryId: kajFinancial.id,
      business: "KAJ",
      name: "Firearm License Statements",
      displayName: "Firearm License Statements",
      shortDescription:
        "Financial statements for firearm license applications.",
      description:
        "Detailed income and expenditure statements for Commissioner of Police firearm license applications with net worth analysis and financial character profile.",
      typicalDuration: "3-5 days",
      estimatedDays: 5,
      pricingType: "RANGE",
      basePrice: "25000",
      maxPrice: "45000",
      documentRequirements: [
        "Bank statements",
        "Employment/business income records",
        "Tax returns",
        "Assets/liabilities",
      ],
      governmentAgencies: ["Guyana Police Force"],
      sortOrder: 27,
    },
    {
      categoryId: kajFinancial.id,
      business: "KAJ",
      name: "Cash Flow Projections",
      displayName: "Cash Flow Projections",
      shortDescription: "Business cash flow forecasts and analysis.",
      description:
        "Detailed monthly/quarterly cash flow projections for 12-36 months including break-even analysis, funding gap analysis, and business planning support.",
      typicalDuration: "5-10 days",
      estimatedDays: 10,
      pricingType: "RANGE",
      basePrice: "50000",
      maxPrice: "150000",
      documentRequirements: [
        "Historical financials",
        "Sales forecasts",
        "Expense budgets",
        "Capital requirements",
      ],
      sortOrder: 28,
    },

    // KAJ - Audit Services
    {
      categoryId: kajAudit.id,
      business: "KAJ",
      name: "NGO Audit",
      displayName: "NGO Audit",
      shortDescription: "Statutory audit of NGO financial statements.",
      description:
        "Complete statutory audit of non-governmental organization financial statements with audit report, management letter, and compliance certificates per NGO Act requirements.",
      typicalDuration: "2-4 weeks",
      estimatedDays: 28,
      pricingType: "RANGE",
      basePrice: "150000",
      maxPrice: "400000",
      documentRequirements: [
        "Constitution/bylaws",
        "Board minutes",
        "Bank statements",
        "Accounting records",
        "Donor agreements",
        "Grant documentation",
      ],
      isFeatured: true,
      sortOrder: 29,
    },
    {
      categoryId: kajAudit.id,
      business: "KAJ",
      name: "Co-operative Society Audit",
      displayName: "Co-operative Audit",
      shortDescription: "Annual audit per Co-operative Societies Act.",
      description:
        "Statutory audit of co-operative society financial statements with auditor's report to members and compliance reporting to Registrar of Co-operatives.",
      typicalDuration: "2-4 weeks",
      estimatedDays: 28,
      pricingType: "RANGE",
      basePrice: "120000",
      maxPrice: "350000",
      documentRequirements: [
        "Society rules",
        "Membership register",
        "Share capital records",
        "Loan records",
        "Bank statements",
        "Minutes",
      ],
      governmentAgencies: ["Registrar of Co-operatives"],
      isFeatured: true,
      sortOrder: 30,
    },

    // KAJ - NIS Services
    {
      categoryId: kajNIS.id,
      business: "KAJ",
      name: "NIS Registration",
      displayName: "NIS Registration",
      shortDescription: "Employer and employee NIS registration.",
      description:
        "Complete NIS registration for employers and employees including form submission, number assignment, and compliance setup.",
      typicalDuration: "5-7 days",
      estimatedDays: 7,
      pricingType: "FIXED",
      basePrice: "15000",
      documentRequirements: [
        "Business registration",
        "Employee IDs",
        "Employment contracts",
      ],
      governmentAgencies: ["National Insurance Scheme"],
      sortOrder: 31,
    },
    {
      categoryId: kajNIS.id,
      business: "KAJ",
      name: "Monthly NIS Returns",
      displayName: "Monthly NIS Returns",
      shortDescription: "Monthly NIS contribution submissions.",
      description:
        "Calculate and submit monthly NIS contributions for all employees with Form C1 preparation and online submission via NIS portal.",
      typicalDuration: "2-3 days",
      estimatedDays: 3,
      pricingType: "RANGE",
      basePrice: "8000",
      maxPrice: "20000",
      documentRequirements: [
        "Payroll register",
        "Employee wages",
        "Previous NIS returns",
      ],
      governmentAgencies: ["National Insurance Scheme"],
      sortOrder: 32,
    },
    {
      categoryId: kajNIS.id,
      business: "KAJ",
      name: "NIS Pension Applications",
      displayName: "Pension Applications",
      shortDescription: "Old age and retirement pension applications.",
      description:
        "Complete NIS pension application preparation including contribution verification, benefit calculations, and submission to NIS with all required documentation.",
      typicalDuration: "7-10 days",
      estimatedDays: 10,
      pricingType: "RANGE",
      basePrice: "25000",
      maxPrice: "50000",
      documentRequirements: [
        "Birth certificate",
        "National ID",
        "NIS card",
        "Employment history",
        "Bank account details",
      ],
      governmentAgencies: ["National Insurance Scheme"],
      sortOrder: 33,
    },
  ];

  console.log(`📦 Inserting ${services.length} services...`);

  let successCount = 0;
  for (const service of services) {
    try {
      await db.insert(serviceCatalog).values(service);
      console.log(`✓ ${service.business}/${service.name}`);
      successCount++;
    } catch (error) {
      console.error(`✗ Failed to insert ${service.name}:`, error);
    }
  }

  console.log("\n✅ Service catalog seeded successfully!");
  console.log("\n📊 Summary:");
  console.log(
    `   GCMC Services: ${services.filter((s) => s.business === "GCMC").length}`
  );
  console.log(
    `   KAJ Services: ${services.filter((s) => s.business === "KAJ").length}`
  );
  console.log(`   Total: ${successCount}/${services.length} services inserted`);
}

seedServiceCatalog()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error seeding service catalog:", error);
    process.exit(1);
  });
