import { db, knowledgeBaseItem, user } from "./index";

async function main() {
  console.log("Seeding Knowledge Base...");

  // Get a user to attribute creation to (first user)
  const users = await db.select().from(user).limit(1);
  if (users.length === 0) {
    console.error("No users found. Please create a user first.");
    process.exit(1);
  }
  const creatorId = users[0].id;

  const items = [
    // GRA Forms (8)
    {
      title: "Individual Tax Return (TIN 2A)",
      description: "Annual Income Tax Return for Individuals",
      type: "AGENCY_FORM",
      category: "GRA",
      business: "KAJ",
      fileName: "TIN_2A_Form.pdf",
    },
    {
      title: "Corporation Tax Return",
      description: "Annual Corporation Tax Return",
      type: "AGENCY_FORM",
      category: "GRA",
      business: "KAJ",
      fileName: "Corp_Tax_Return.pdf",
    },
    {
      title: "PAYE Monthly Remittance Form",
      description: "Form 2 - Monthly Remittance of PAYE",
      type: "AGENCY_FORM",
      category: "GRA",
      business: "KAJ",
      fileName: "Form_2_PAYE.pdf",
    },
    {
      title: "VAT Return Form",
      description: "Value Added Tax Return",
      type: "AGENCY_FORM",
      category: "GRA",
      business: "KAJ",
      fileName: "VAT_Return.pdf",
    },
    {
      title: "TIN Application Form (Individual)",
      description: "Application for Taxpayer Identification Number",
      type: "AGENCY_FORM",
      category: "GRA",
      business: "KAJ",
      fileName: "TIN_App_Ind.pdf",
    },
    {
      title: "TIN Application Form (Company)",
      description: "Application for Company TIN",
      type: "AGENCY_FORM",
      category: "GRA",
      business: "KAJ",
      fileName: "TIN_App_Comp.pdf",
    },
    {
      title: "Property Tax Return (Individual)",
      description: "Annual Property Tax Return for Individuals",
      type: "AGENCY_FORM",
      category: "GRA",
      business: "KAJ",
      fileName: "Prop_Tax_Ind.pdf",
    },
    {
      title: "Compliance Application Form",
      description: "Application for Tax Compliance Certificate",
      type: "AGENCY_FORM",
      category: "GRA",
      business: "KAJ",
      fileName: "Compliance_App.pdf",
    },

    // NIS Forms (6)
    {
      title: "NIS Registration Form (Employee)",
      description: "R1 - Application for Registration as an Employed Person",
      type: "AGENCY_FORM",
      category: "NIS",
      business: "KAJ",
      fileName: "NIS_R1.pdf",
    },
    {
      title: "NIS Registration Form (Self-Employed)",
      description: "R2 - Application for Registration as Self-Employed",
      type: "AGENCY_FORM",
      category: "NIS",
      business: "KAJ",
      fileName: "NIS_R2.pdf",
    },
    {
      title: "Monthly Contribution Schedule (Electronic)",
      description: "CS-1 Electronic Submission Template",
      type: "AGENCY_FORM",
      category: "NIS",
      business: "KAJ",
      fileName: "CS1_Template.xls",
    },
    {
      title: "Benefit Claim Form (Sickness)",
      description: "B1 - Claim for Sickness Benefit",
      type: "AGENCY_FORM",
      category: "NIS",
      business: "KAJ",
      fileName: "NIS_B1.pdf",
    },
    {
      title: "Compliance Certificate Application",
      description: "Application for NIS Compliance",
      type: "AGENCY_FORM",
      category: "NIS",
      business: "KAJ",
      fileName: "NIS_Compliance.pdf",
    },
    {
      title: "Employer Registration Form",
      description: "R1 - Employer Registration",
      type: "AGENCY_FORM",
      category: "NIS",
      business: "KAJ",
      fileName: "NIS_Employer_Reg.pdf",
    },

    // Immigration Forms (5)
    {
      title: "Work Permit Application Form",
      description: "Application for Employment Visa/Work Permit",
      type: "AGENCY_FORM",
      category: "IMMIGRATION",
      business: "GCMC",
      fileName: "Work_Permit_App.pdf",
    },
    {
      title: "Extension of Stay Application",
      description: "Application for Extension of Stay",
      type: "AGENCY_FORM",
      category: "IMMIGRATION",
      business: "GCMC",
      fileName: "Extension_Stay.pdf",
    },
    {
      title: "Visa Application Form",
      description: "General Visa Application",
      type: "AGENCY_FORM",
      category: "IMMIGRATION",
      business: "GCMC",
      fileName: "Visa_App.pdf",
    },
    {
      title: "Citizenship Application Form",
      description: "Application for Registration as a Citizen",
      type: "AGENCY_FORM",
      category: "IMMIGRATION",
      business: "GCMC",
      fileName: "Citizenship_App.pdf",
    },
    {
      title: "Business Visa Sponsorship Letter",
      description: "Template for business visa sponsorship",
      type: "LETTER_TEMPLATE",
      category: "IMMIGRATION",
      business: "GCMC",
      fileName: "Sponsorship_Letter.docx",
    },

    // DCRA Forms (4)
    {
      title: "Business Name Registration Form",
      description: "Application for Registration of Business Name",
      type: "AGENCY_FORM",
      category: "DCRA",
      business: "GCMC",
      fileName: "Business_Name_Reg.pdf",
    },
    {
      title: "Incorporation Form 1",
      description: "Notice of Address of Registered Office",
      type: "AGENCY_FORM",
      category: "DCRA",
      business: "GCMC",
      fileName: "Inc_Form_1.pdf",
    },
    {
      title: "Incorporation Form 2",
      description: "Consent to Act as Director",
      type: "AGENCY_FORM",
      category: "DCRA",
      business: "GCMC",
      fileName: "Inc_Form_2.pdf",
    },
    {
      title: "Annual Return Form",
      description: "Annual Return for Companies",
      type: "AGENCY_FORM",
      category: "DCRA",
      business: "GCMC",
      fileName: "Annual_Return.pdf",
    },

    // Letter Templates (10)
    {
      title: "Engagement Letter - Tax Services",
      description: "Standard engagement letter for tax clients",
      type: "LETTER_TEMPLATE",
      category: "GENERAL",
      business: "KAJ",
      isStaffOnly: true,
    },
    {
      title: "Engagement Letter - Immigration",
      description: "Standard engagement letter for immigration services",
      type: "LETTER_TEMPLATE",
      category: "GENERAL",
      business: "GCMC",
      isStaffOnly: true,
    },
    {
      title: "Bank Reference Request",
      description: "Request for bank reference letter",
      type: "LETTER_TEMPLATE",
      category: "GENERAL",
      business: "KAJ",
    },
    {
      title: "Employment Verification Letter",
      description: "Verification of employment template",
      type: "LETTER_TEMPLATE",
      category: "GENERAL",
      business: "KAJ",
    },
    {
      title: "GRA Inquiry Letter",
      description: "Template for responding to GRA inquiries",
      type: "LETTER_TEMPLATE",
      category: "GRA",
      business: "KAJ",
      isStaffOnly: true,
    },
    {
      title: "NIS Appeal Letter",
      description: "Template for appealing NIS decisions",
      type: "LETTER_TEMPLATE",
      category: "NIS",
      business: "KAJ",
    },
    {
      title: "Business Introduction Letter",
      description: "Introduction letter for new businesses",
      type: "LETTER_TEMPLATE",
      category: "DCRA",
      business: "GCMC",
    },
    {
      title: "Visa Support Letter",
      description: "Support letter for visa applications",
      type: "LETTER_TEMPLATE",
      category: "IMMIGRATION",
      business: "GCMC",
    },
    {
      title: "Client Termination Letter",
      description: "Formal termination of services",
      type: "LETTER_TEMPLATE",
      category: "GENERAL",
      business: null,
      isStaffOnly: true,
    },
    {
      title: "Quote for Services",
      description: "Template for providing service quotes",
      type: "LETTER_TEMPLATE",
      category: "GENERAL",
      business: null,
      isStaffOnly: true,
    },

    // Guides (12)
    {
      title: "Tax Return Filing Guide 2024",
      description: "Step-by-step guide for filing 2024 returns",
      type: "GUIDE",
      category: "GRA",
      business: "KAJ",
      content: "# Tax Return Filing Guide 2024\n\n...",
    },
    {
      title: "NIS Compliance Requirements",
      description: "Guide to maintaining NIS compliance",
      type: "GUIDE",
      category: "NIS",
      business: "KAJ",
      content: "# NIS Compliance\n\n...",
    },
    {
      title: "Starting a Business in Guyana",
      description: "Comprehensive guide for new business owners",
      type: "GUIDE",
      category: "DCRA",
      business: "GCMC",
      content: "# Starting a Business\n\n...",
    },
    {
      title: "Work Permit Application Process",
      description: "Detailed walkthrough of the work permit process",
      type: "GUIDE",
      category: "IMMIGRATION",
      business: "GCMC",
      content: "# Work Permit Process\n\n...",
    },
    {
      title: "Internal: Client Onboarding SOP",
      description: "Standard operating procedure for new clients",
      type: "GUIDE",
      category: "INTERNAL",
      business: null,
      isStaffOnly: true,
      content: "# Client Onboarding SOP\n\n...",
    },
    {
      title: "Internal: Document Management Policy",
      description: "Policy for handling client documents",
      type: "GUIDE",
      category: "INTERNAL",
      business: null,
      isStaffOnly: true,
      content: "# Document Management Policy\n\n...",
    },
    {
      title: "Understanding VAT",
      description: "Guide to Value Added Tax in Guyana",
      type: "GUIDE",
      category: "GRA",
      business: "KAJ",
      content: "# Understanding VAT\n\n...",
    },
    {
      title: "Employee vs Contractor",
      description: "Guide to classifying workers correctly",
      type: "GUIDE",
      category: "NIS",
      business: "KAJ",
      content: "# Employee vs Contractor\n\n...",
    },
    {
      title: "Local Content Certificate Guide",
      description: "How to apply for Local Content Certificate",
      type: "GUIDE",
      category: "DCRA",
      business: "GCMC",
      content: "# Local Content Certificate\n\n...",
    },
    {
      title: "Housing Support Services",
      description: "Guide to housing support for expats",
      type: "GUIDE",
      category: "IMMIGRATION",
      business: "GCMC",
      content: "# Housing Support\n\n...",
    },
    {
      title: "Internal: Billing and Invoicing",
      description: "SOP for billing clients",
      type: "GUIDE",
      category: "INTERNAL",
      business: null,
      isStaffOnly: true,
      content: "# Billing SOP\n\n...",
    },
    {
      title: "Internal: IT Security Policy",
      description: "Security policy for staff",
      type: "GUIDE",
      category: "INTERNAL",
      business: null,
      isStaffOnly: true,
      content: "# IT Security Policy\n\n...",
    },
  ];

  for (const item of items) {
    await db.insert(knowledgeBaseItem).values({
      ...item,
      createdById: creatorId,
      type: item.type as any,
      category: item.category as any,
      business: item.business as any,
      isActive: true,
      isStaffOnly: item.isStaffOnly,
      isFeatured: false,
      supportsAutoFill: false,
      relatedServices: [],
      requiredFor: [],
      storagePath: item.fileName ? `kb/${item.fileName}` : undefined,
    });
  }

  console.log(`Seeded ${items.length} knowledge base items.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
