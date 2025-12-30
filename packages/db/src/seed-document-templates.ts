/**
 * Document Templates Seed Script
 *
 * Seeds the document_template table with common templates for GCMC and KAJ services.
 * Run with: bun run packages/db/src/seed-document-templates.ts
 */

import { db, documentTemplate } from "./index";

type TemplatePlaceholder = {
  key: string;
  label: string;
  type: "text" | "date" | "number" | "currency";
  source: "client" | "matter" | "staff" | "business" | "date" | "custom";
  sourceField?: string;
};

type TemplateData = {
  name: string;
  description: string;
  category:
    | "LETTER"
    | "AGREEMENT"
    | "CERTIFICATE"
    | "FORM"
    | "REPORT"
    | "INVOICE"
    | "OTHER";
  business: "GCMC" | "KAJ" | null;
  content: string;
  placeholders: TemplatePlaceholder[];
  sortOrder: number;
};

// Common placeholders used across templates
const commonPlaceholders: TemplatePlaceholder[] = [
  {
    key: "client.displayName",
    label: "Client Name",
    type: "text",
    source: "client",
    sourceField: "displayName",
  },
  {
    key: "client.email",
    label: "Client Email",
    type: "text",
    source: "client",
    sourceField: "email",
  },
  {
    key: "client.phone",
    label: "Client Phone",
    type: "text",
    source: "client",
    sourceField: "phone",
  },
  {
    key: "client.address",
    label: "Client Address",
    type: "text",
    source: "client",
    sourceField: "address",
  },
  {
    key: "client.tinNumber",
    label: "TIN Number",
    type: "text",
    source: "client",
    sourceField: "tinNumber",
  },
  { key: "date.today", label: "Today's Date", type: "date", source: "date" },
  { key: "date.year", label: "Current Year", type: "text", source: "date" },
  {
    key: "staff.name",
    label: "Staff Name",
    type: "text",
    source: "staff",
    sourceField: "name",
  },
  {
    key: "staff.title",
    label: "Staff Title",
    type: "text",
    source: "staff",
    sourceField: "title",
  },
];

const templates: TemplateData[] = [
  // ===============================
  // GCMC Templates
  // ===============================

  // Letters
  {
    name: "Work Permit Cover Letter",
    description: "Cover letter for work permit application submission",
    category: "LETTER",
    business: "GCMC",
    content: `GREEN CRESCENT MANAGEMENT CONSULTANCY
Georgetown, Guyana
Tel: [Phone] | Email: [Email]

{{date.today}}

The Chief Immigration Officer
Immigration Department
Ministry of Home Affairs
Georgetown, Guyana

RE: WORK PERMIT APPLICATION - {{client.displayName}}

Dear Sir/Madam,

We hereby submit this application for a Work Permit on behalf of our client, {{client.displayName}}.

Enclosed please find the following documents:
1. Completed Application Form
2. Valid Passport (Copy)
3. Passport-sized Photographs (4)
4. Police Clearance Certificate
5. Medical Certificate
6. Employment Contract
7. Employer's Company Registration
8. Employer's TIN/NIS Compliance Certificates
9. Educational Certificates

We respectfully request your favorable consideration of this application.

Should you require any additional information, please do not hesitate to contact us.

Yours faithfully,

{{staff.name}}
{{staff.title}}
Green Crescent Management Consultancy`,
    placeholders: [...commonPlaceholders],
    sortOrder: 1,
  },
  {
    name: "Citizenship Application Cover Letter",
    description: "Cover letter for citizenship application",
    category: "LETTER",
    business: "GCMC",
    content: `GREEN CRESCENT MANAGEMENT CONSULTANCY
Georgetown, Guyana

{{date.today}}

The Chief Immigration Officer
Immigration Department
Ministry of Home Affairs
Georgetown, Guyana

RE: APPLICATION FOR CITIZENSHIP BY NATURALISATION - {{client.displayName}}

Dear Sir/Madam,

We are pleased to submit this application for Citizenship by Naturalisation on behalf of {{client.displayName}}.

The applicant has been resident in Guyana for the required period and meets all eligibility criteria for naturalisation.

Enclosed Documents:
1. Completed Application Form
2. Birth Certificate (Certified Copy)
3. Police Clearance Certificates
4. Proof of Residence (5+ years)
5. Employment Documentation
6. Tax Compliance Certificate
7. Character References (3)
8. Passport Photographs (6)

We trust this application will receive your favorable consideration.

Yours faithfully,

{{staff.name}}
{{staff.title}}
Green Crescent Management Consultancy`,
    placeholders: commonPlaceholders,
    sortOrder: 2,
  },
  {
    name: "Sponsor Letter Template",
    description: "Employment sponsorship letter for immigration applications",
    category: "LETTER",
    business: "GCMC",
    content: `[EMPLOYER LETTERHEAD]

{{date.today}}

The Chief Immigration Officer
Immigration Department
Ministry of Home Affairs
Georgetown, Guyana

RE: EMPLOYMENT SPONSORSHIP - {{client.displayName}}

Dear Sir/Madam,

This letter serves to confirm that [Company Name] wishes to sponsor {{client.displayName}} for employment in Guyana.

Position: [Job Title]
Department: [Department]
Duration: [Contract Duration]
Salary: [Monthly Salary]

We confirm that:
1. The position cannot be filled by a qualified Guyanese national
2. The company is in good standing with all statutory requirements
3. We will be responsible for the applicant's welfare during employment

Please find attached our company registration documents and compliance certificates.

Yours faithfully,

[Authorized Signatory]
[Company Name]`,
    placeholders: commonPlaceholders,
    sortOrder: 3,
  },

  // Agreements
  {
    name: "Service Agreement - Immigration",
    description: "Service agreement for immigration consulting services",
    category: "AGREEMENT",
    business: "GCMC",
    content: `SERVICE AGREEMENT

This Agreement is made on {{date.today}}

BETWEEN:
Green Crescent Management Consultancy ("the Consultant")
AND
{{client.displayName}} ("the Client")

1. SERVICES
The Consultant agrees to provide immigration consulting services including:
- Document preparation and review
- Application submission
- Follow-up with authorities
- Status updates

2. SERVICE TYPE: [Immigration Service Type]

3. FEES
Total Fee: $[Amount]
Payment Terms: [Payment Schedule]

4. TIMELINE
Estimated Processing Time: [Duration]
(Subject to government processing times)

5. CLIENT RESPONSIBILITIES
- Provide accurate information
- Submit required documents promptly
- Pay fees as agreed
- Attend interviews as required

6. CONSULTANT RESPONSIBILITIES
- Process applications professionally
- Maintain confidentiality
- Provide regular updates
- Act in client's best interest

7. DISCLAIMER
Processing times and outcomes are subject to government discretion.

SIGNED:

_______________________          _______________________
Client: {{client.displayName}}     Consultant Representative
Date:                             Date:`,
    placeholders: commonPlaceholders,
    sortOrder: 10,
  },
  {
    name: "Power of Attorney",
    description: "General power of attorney template",
    category: "AGREEMENT",
    business: "GCMC",
    content: `POWER OF ATTORNEY

KNOW ALL MEN BY THESE PRESENTS:

I, {{client.displayName}}, of [Address], Guyana, do hereby appoint [Attorney Name] of [Attorney Address] as my true and lawful Attorney-in-Fact ("Attorney").

POWERS GRANTED:
My Attorney shall have authority to:
1. [Specific Powers]
2. [Specific Powers]
3. [Specific Powers]

DURATION:
This Power of Attorney shall remain in effect from {{date.today}} until [End Date/Revocation].

LIMITATIONS:
This Power of Attorney does not authorize my Attorney to:
1. Make healthcare decisions on my behalf
2. [Other Limitations]

ACKNOWLEDGMENT:
I declare that I am of sound mind and have executed this document voluntarily.

IN WITNESS WHEREOF, I have set my hand this {{date.today}}.

_______________________
{{client.displayName}}
(Principal)

WITNESS:

1. _______________________     2. _______________________
   Name:                          Name:
   Address:                       Address:`,
    placeholders: commonPlaceholders,
    sortOrder: 11,
  },

  // Certificates
  {
    name: "Training Completion Certificate",
    description: "Certificate for completed training programs",
    category: "CERTIFICATE",
    business: "GCMC",
    content: `GREEN CRESCENT MANAGEMENT CONSULTANCY

CERTIFICATE OF COMPLETION

This is to certify that

{{client.displayName}}

has successfully completed the

[TRAINING PROGRAM NAME]

Duration: [Start Date] to [End Date]
Total Hours: [Number] Hours

Topics Covered:
- [Topic 1]
- [Topic 2]
- [Topic 3]

Issued on {{date.today}} at Georgetown, Guyana

_______________________
Green Crescent Management
Director
Green Crescent Management Consultancy`,
    placeholders: commonPlaceholders,
    sortOrder: 20,
  },

  // Forms
  {
    name: "Client Intake Form - Immigration",
    description: "Initial client intake form for immigration services",
    category: "FORM",
    business: "GCMC",
    content: `GREEN CRESCENT MANAGEMENT CONSULTANCY
CLIENT INTAKE FORM - IMMIGRATION SERVICES

Date: {{date.today}}

SECTION A: PERSONAL INFORMATION
Full Name: {{client.displayName}}
Email: {{client.email}}
Phone: {{client.phone}}
Address: {{client.address}}
Nationality: _______________________
Passport Number: _______________________
Passport Expiry: _______________________

SECTION B: SERVICE REQUIRED
[ ] Work Permit Application
[ ] Work Permit Renewal
[ ] Citizenship Application
[ ] Business Visa
[ ] Permanent Residence
[ ] Family Reunification
[ ] Other: _______________________

SECTION C: EMPLOYMENT DETAILS (if applicable)
Employer Name: _______________________
Position: _______________________
Industry: _______________________
Start Date: _______________________

SECTION D: DOCUMENTS CHECKLIST
[ ] Valid Passport
[ ] Passport Photos (4)
[ ] Police Clearance
[ ] Medical Certificate
[ ] Employment Contract
[ ] Educational Certificates

Client Signature: _______________________
Date: _______________________`,
    placeholders: commonPlaceholders,
    sortOrder: 30,
  },

  // ===============================
  // KAJ Templates
  // ===============================

  // Letters
  {
    name: "Tax Return Submission Letter",
    description: "Cover letter for tax return submission to GRA",
    category: "LETTER",
    business: "KAJ",
    content: `KAJ ACCOUNTANCY SERVICES
Georgetown, Guyana

{{date.today}}

The Commissioner General
Guyana Revenue Authority
Georgetown, Guyana

RE: INCOME TAX RETURN SUBMISSION - {{client.displayName}}
TIN: {{client.tinNumber}}
TAX YEAR: {{date.year}}

Dear Sir/Madam,

Please find enclosed the Income Tax Return for the above-named taxpayer for the tax year ending December 31, {{date.year}}.

Summary:
- Gross Income: $[Amount]
- Allowable Deductions: $[Amount]
- Taxable Income: $[Amount]
- Tax Payable: $[Amount]
- Tax Already Paid: $[Amount]
- Balance Due/(Refund): $[Amount]

All supporting documents are attached for your review.

Should you require any clarification, please contact our office.

Yours faithfully,

{{staff.name}}
{{staff.title}}
KAJ Accountancy Services`,
    placeholders: commonPlaceholders,
    sortOrder: 40,
  },
  {
    name: "Tax Compliance Request Letter",
    description: "Letter requesting tax compliance certificate from GRA",
    category: "LETTER",
    business: "KAJ",
    content: `KAJ ACCOUNTANCY SERVICES
Georgetown, Guyana

{{date.today}}

The Commissioner General
Guyana Revenue Authority
Georgetown, Guyana

RE: REQUEST FOR TAX COMPLIANCE CERTIFICATE
CLIENT: {{client.displayName}}
TIN: {{client.tinNumber}}

Dear Sir/Madam,

We hereby request a Tax Compliance Certificate for the above-named taxpayer.

Purpose: [Tender/Work Permit/Land Transfer/Other]

We confirm that:
1. All outstanding tax returns have been filed
2. All tax payments are up to date
3. There are no outstanding tax liabilities

Please process this request at your earliest convenience.

Yours faithfully,

{{staff.name}}
{{staff.title}}
KAJ Accountancy Services`,
    placeholders: commonPlaceholders,
    sortOrder: 41,
  },
  {
    name: "NIS Registration Cover Letter",
    description: "Cover letter for NIS employer/employee registration",
    category: "LETTER",
    business: "KAJ",
    content: `KAJ ACCOUNTANCY SERVICES
Georgetown, Guyana

{{date.today}}

The General Manager
National Insurance Scheme
Georgetown, Guyana

RE: NIS REGISTRATION - {{client.displayName}}

Dear Sir/Madam,

We are submitting the NIS registration application for our client, {{client.displayName}}.

Registration Type:
[ ] New Employer Registration
[ ] New Employee Registration
[ ] Change of Details

Enclosed Documents:
1. Completed NIS Registration Form
2. National ID (Copy)
3. Birth Certificate (Copy)
4. [Additional Documents]

Please process this registration at your earliest convenience.

Yours faithfully,

{{staff.name}}
{{staff.title}}
KAJ Accountancy Services`,
    placeholders: commonPlaceholders,
    sortOrder: 42,
  },

  // Agreements
  {
    name: "Service Agreement - Bookkeeping",
    description: "Monthly bookkeeping service agreement",
    category: "AGREEMENT",
    business: "KAJ",
    content: `SERVICE AGREEMENT - BOOKKEEPING SERVICES

This Agreement is entered into on {{date.today}}

BETWEEN:
KAJ Accountancy Services ("the Service Provider")
AND
{{client.displayName}} ("the Client")

1. SERVICES
The Service Provider agrees to provide monthly bookkeeping services including:
- Recording of transactions
- Bank reconciliation
- Accounts receivable/payable management
- Monthly financial reports
- Payroll processing (if applicable)

2. FEES
Monthly Fee: $[Amount]
Payment Due: [Day] of each month

3. TERM
This agreement commences on [Start Date] and continues on a month-to-month basis until terminated by either party with 30 days written notice.

4. CLIENT RESPONSIBILITIES
- Provide all financial documents by [Day] of each month
- Maintain organized records
- Respond to queries promptly

5. CONFIDENTIALITY
All financial information will be kept strictly confidential.

SIGNED:

_______________________          _______________________
Client: {{client.displayName}}     Service Provider
Date:                             Date:`,
    placeholders: commonPlaceholders,
    sortOrder: 50,
  },
  {
    name: "Service Agreement - Tax Returns",
    description: "Annual tax return preparation agreement",
    category: "AGREEMENT",
    business: "KAJ",
    content: `SERVICE AGREEMENT - TAX RETURN PREPARATION

Date: {{date.today}}

BETWEEN:
KAJ Accountancy Services ("the Service Provider")
AND
{{client.displayName}} ("the Client")
TIN: {{client.tinNumber}}

1. SERVICES
Preparation and filing of Income Tax Return for tax year [Year].

2. FEES
Service Fee: $[Amount]
Filing Fee (if applicable): $[Amount]

3. DOCUMENTS REQUIRED
- Income statements (T4s, pay slips)
- Business income records
- Expense receipts
- Previous tax returns
- Bank statements

4. DEADLINE
Client must provide all documents by [Date] for timely filing.

5. REPRESENTATIONS
- Client declares all information provided is accurate
- Service Provider will exercise due diligence

SIGNED:

_______________________
{{client.displayName}}
Date:`,
    placeholders: commonPlaceholders,
    sortOrder: 51,
  },

  // Forms
  {
    name: "Client Intake Form - Tax Services",
    description: "Initial client intake form for tax services",
    category: "FORM",
    business: "KAJ",
    content: `KAJ ACCOUNTANCY SERVICES
CLIENT INTAKE FORM - TAX SERVICES

Date: {{date.today}}

SECTION A: CLIENT INFORMATION
Full Name/Business Name: {{client.displayName}}
TIN: {{client.tinNumber}}
NIS Number: _______________________
Email: {{client.email}}
Phone: {{client.phone}}
Address: {{client.address}}

SECTION B: CLIENT TYPE
[ ] Individual
[ ] Sole Proprietorship
[ ] Partnership
[ ] Corporation
[ ] NGO/Non-Profit

SECTION C: SERVICES REQUIRED
[ ] Income Tax Return (Individual)
[ ] Income Tax Return (Corporate)
[ ] VAT Registration/Returns
[ ] PAYE Services
[ ] NIS Registration/Contributions
[ ] Tax Compliance Certificate
[ ] Monthly Bookkeeping
[ ] Financial Statements
[ ] Audit Services
[ ] Other: _______________________

SECTION D: TAX YEAR
Tax Year(s) Required: _______________________

SECTION E: DOCUMENTS PROVIDED
[ ] Previous Tax Returns
[ ] Income Documentation
[ ] Bank Statements
[ ] Expense Receipts
[ ] TIN Certificate
[ ] NIS Number

Client Signature: _______________________
Date: _______________________`,
    placeholders: commonPlaceholders,
    sortOrder: 60,
  },

  // ===============================
  // Shared Templates (Both Businesses)
  // ===============================

  {
    name: "Client Welcome Letter",
    description: "Welcome letter for new clients",
    category: "LETTER",
    business: null,
    content: `[COMPANY LETTERHEAD]

{{date.today}}

{{client.displayName}}
{{client.address}}

Dear {{client.displayName}},

Welcome to [Company Name]!

We are delighted to have you as our client and look forward to serving your [service type] needs.

Your dedicated representative is {{staff.name}}, who can be reached at:
- Email: [Staff Email]
- Phone: [Staff Phone]

What to Expect:
1. Your initial consultation has been scheduled
2. We will review your requirements
3. A detailed service plan will be provided
4. Regular updates on your matters

Please don't hesitate to contact us with any questions.

We look forward to a successful partnership.

Warm regards,

{{staff.name}}
{{staff.title}}`,
    placeholders: commonPlaceholders,
    sortOrder: 70,
  },
  {
    name: "Document Request Letter",
    description: "Letter requesting documents from client",
    category: "LETTER",
    business: null,
    content: `[COMPANY LETTERHEAD]

{{date.today}}

{{client.displayName}}
{{client.email}}

RE: DOCUMENT REQUEST

Dear {{client.displayName}},

To proceed with your [Service/Matter], we require the following documents:

REQUIRED DOCUMENTS:
1. [ ] [Document 1]
2. [ ] [Document 2]
3. [ ] [Document 3]
4. [ ] [Document 4]

Please submit these documents by [Deadline Date].

You may:
- Upload via client portal: [Portal URL]
- Email to: [Email Address]
- Drop off at our office

If you have any questions about any of these requirements, please contact us.

Thank you for your prompt attention to this matter.

Best regards,

{{staff.name}}
{{staff.title}}`,
    placeholders: commonPlaceholders,
    sortOrder: 71,
  },
  {
    name: "Service Completion Letter",
    description: "Letter confirming service completion",
    category: "LETTER",
    business: null,
    content: `[COMPANY LETTERHEAD]

{{date.today}}

{{client.displayName}}
{{client.address}}

RE: SERVICE COMPLETION CONFIRMATION

Dear {{client.displayName}},

We are pleased to confirm that the following service has been successfully completed:

Service: [Service Name]
Reference: [Matter/Reference Number]
Completion Date: {{date.today}}

Summary:
[Brief description of what was accomplished]

Attached Documents:
- [List of delivered documents]

Next Steps:
[Any follow-up actions required]

Thank you for choosing our services. We hope to continue serving you in the future.

Best regards,

{{staff.name}}
{{staff.title}}`,
    placeholders: commonPlaceholders,
    sortOrder: 72,
  },
];

async function seedDocumentTemplates() {
  console.log("Seeding document templates...");

  for (const template of templates) {
    try {
      await db.insert(documentTemplate).values({
        name: template.name,
        description: template.description,
        category: template.category,
        business: template.business,
        content: template.content,
        placeholders: template.placeholders,
        sortOrder: template.sortOrder,
        isActive: true,
      });
      console.log(`  ✓ Created template: ${template.name}`);
    } catch (error) {
      console.error(`  ✗ Failed to create template: ${template.name}`, error);
    }
  }

  console.log(`\nSeeded ${templates.length} document templates.`);
}

// Run the seed
seedDocumentTemplates()
  .then(() => {
    console.log("Document template seeding complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed to seed document templates:", error);
    process.exit(1);
  });
