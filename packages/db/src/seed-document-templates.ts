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

  // ===============================
  // GRA Forms (Tax Authority)
  // ===============================

  {
    name: "GRA Form 2 - Income Tax Return (Individual)",
    description:
      "Individual income tax return form for Guyana Revenue Authority",
    category: "FORM",
    business: "KAJ",
    content: `GUYANA REVENUE AUTHORITY
INCOME TAX RETURN - FORM 2
Tax Year: {{date.year}}

SECTION A: TAXPAYER INFORMATION
TIN: {{client.tinNumber}}
Full Name: {{client.displayName}}
Address: {{client.address}}
Contact: {{client.phone}}
Email: {{client.email}}

SECTION B: EMPLOYMENT INCOME
Employer 1: _______________________
  Gross Salary: $_______________
  PAYE Deducted: $_______________
  NIS Deducted: $_______________
  Net Pay: $_______________

Employer 2 (if applicable): _______________________
  Gross Salary: $_______________
  PAYE Deducted: $_______________

Total Employment Income: $_______________

SECTION C: OTHER INCOME
Rental Income: $_______________
Interest Income: $_______________
Dividend Income: $_______________
Business Income: $_______________
Other Income: $_______________
Total Other Income: $_______________

SECTION D: ALLOWABLE DEDUCTIONS
NIS Contributions: $_______________
Medical Expenses: $_______________
Education Expenses: $_______________
Mortgage Interest: $_______________
Other Deductions: $_______________
Total Deductions: $_______________

SECTION E: TAX CALCULATION
Gross Income (B + C): $_______________
Less: Deductions (D): $_______________
Taxable Income: $_______________
Tax Payable (28%/40%): $_______________
Less: Tax Credits: $_______________
Less: PAYE Already Paid: $_______________
Balance Due / (Refund): $_______________

DECLARATION
I declare that the information provided is true and correct.

Signature: _______________________
Date: {{date.today}}

Prepared by: {{staff.name}}
KAJ Accountancy Services`,
    placeholders: [...commonPlaceholders],
    sortOrder: 100,
  },
  {
    name: "GRA Form 5 - Corporate Income Tax Return",
    description: "Corporate income tax return form for companies",
    category: "FORM",
    business: "KAJ",
    content: `GUYANA REVENUE AUTHORITY
CORPORATE INCOME TAX RETURN - FORM 5
Tax Year: {{date.year}}

SECTION A: COMPANY INFORMATION
TIN: {{client.tinNumber}}
Company Name: {{client.displayName}}
Registered Address: {{client.address}}
Business Nature: _______________________
Incorporation Date: _______________________

SECTION B: INCOME STATEMENT
Revenue
  Gross Sales/Services: $_______________
  Less: Sales Returns: $_______________
  Net Sales: $_______________
  Other Operating Income: $_______________
  Interest Income: $_______________
  Dividend Income: $_______________
  Total Revenue: $_______________

Cost of Goods Sold
  Opening Inventory: $_______________
  Add: Purchases: $_______________
  Less: Closing Inventory: $_______________
  Cost of Goods Sold: $_______________

Gross Profit: $_______________

SECTION C: OPERATING EXPENSES
  Salaries & Wages: $_______________
  Rent: $_______________
  Utilities: $_______________
  Insurance: $_______________
  Depreciation: $_______________
  Professional Fees: $_______________
  Advertising: $_______________
  Travel & Entertainment: $_______________
  Office Supplies: $_______________
  Other Expenses: $_______________
  Total Operating Expenses: $_______________

Net Operating Income: $_______________

SECTION D: TAX ADJUSTMENTS
Add Back:
  Entertainment (50%): $_______________
  Non-Deductible Expenses: $_______________
  Depreciation Adjustment: $_______________
Deduct:
  Capital Allowances: $_______________
  Investment Allowances: $_______________
Adjusted Taxable Income: $_______________

SECTION E: TAX COMPUTATION
Taxable Income: $_______________
Corporate Tax Rate: 25% / 40%
Tax Payable: $_______________
Less: Advance Tax Paid: $_______________
Balance Due / (Refund): $_______________

DIRECTOR'S DECLARATION
I certify that this return is correct and complete.

Director's Signature: _______________________
Name: _______________________
Date: {{date.today}}

Prepared by: {{staff.name}}
KAJ Accountancy Services`,
    placeholders: [...commonPlaceholders],
    sortOrder: 101,
  },
  {
    name: "GRA Form 7B - VAT Return",
    description: "Value Added Tax return form",
    category: "FORM",
    business: "KAJ",
    content: `GUYANA REVENUE AUTHORITY
VAT RETURN - FORM 7B
Tax Period: _______________________

SECTION A: REGISTRANT INFORMATION
TIN: {{client.tinNumber}}
VAT Registration Number: _______________________
Business Name: {{client.displayName}}
Address: {{client.address}}

SECTION B: OUTPUT TAX (Tax Collected on Sales)
Standard Rated Supplies (14%)
  Total Value: $_______________
  VAT Collected: $_______________

Zero Rated Supplies (0%)
  Total Value: $_______________
  VAT: $0.00

Exempt Supplies
  Total Value: $_______________
  VAT: N/A

Total Output Tax: $_______________

SECTION C: INPUT TAX (Tax Paid on Purchases)
Taxable Purchases (14%)
  Total Value: $_______________
  VAT Paid: $_______________

Capital Goods Purchases
  Total Value: $_______________
  VAT Paid: $_______________

Import VAT Paid: $_______________

Total Input Tax: $_______________

SECTION D: TAT CALCULATION
Output Tax (B): $_______________
Less: Input Tax (C): $_______________
Net VAT Payable / (Refundable): $_______________

SECTION E: PAYMENT DETAILS
Amount Due: $_______________
Payment Method: [ ] Cash [ ] Cheque [ ] Bank Transfer
Receipt Number: _______________________

DECLARATION
I declare that this return is true and complete.

Signature: _______________________
Date: {{date.today}}

Prepared by: {{staff.name}}
KAJ Accountancy Services`,
    placeholders: [...commonPlaceholders],
    sortOrder: 102,
  },

  // ===============================
  // NIS Forms (National Insurance)
  // ===============================

  {
    name: "NIS CS3 - Contributions Statement",
    description: "Employee contribution statement request form",
    category: "FORM",
    business: "KAJ",
    content: `NATIONAL INSURANCE SCHEME
CONTRIBUTION STATEMENT REQUEST - FORM CS3

Date: {{date.today}}

SECTION A: EMPLOYEE INFORMATION
NIS Number: _______________________
Full Name: {{client.displayName}}
Date of Birth: _______________________
National ID: _______________________
Address: {{client.address}}
Phone: {{client.phone}}
Email: {{client.email}}

SECTION B: REQUEST DETAILS
Statement Period Requested:
  From: _______________________ To: _______________________

Purpose of Request:
[ ] Retirement/Pension Claim
[ ] Sickness Benefit Application
[ ] Maternity Benefit Application
[ ] Funeral Grant Application
[ ] Loan Application
[ ] Employment Verification
[ ] Immigration Purpose
[ ] Other: _______________________

SECTION C: EMPLOYMENT HISTORY
Current/Most Recent Employer: _______________________
  Employer NIS Number: _______________________
  Employment Period: From _______ To _______

Previous Employer (if applicable): _______________________
  Employer NIS Number: _______________________
  Employment Period: From _______ To _______

SECTION D: COLLECTION PREFERENCE
[ ] Collect at NIS Office
[ ] Mail to Address Above
[ ] Email (if available)

DECLARATION
I hereby request a statement of my NIS contributions for the period specified above. I confirm that I am the account holder or authorized representative.

Signature: _______________________
Date: {{date.today}}

FOR OFFICE USE ONLY
Verified by: _____________ Date: _____________
Statement Issued: [ ] Yes [ ] No
Contribution Weeks: _____________`,
    placeholders: [...commonPlaceholders],
    sortOrder: 110,
  },
  {
    name: "NIS Employee Registration Form",
    description: "New employee registration with National Insurance Scheme",
    category: "FORM",
    business: "KAJ",
    content: `NATIONAL INSURANCE SCHEME
NEW EMPLOYEE REGISTRATION FORM

Date: {{date.today}}

SECTION A: EMPLOYEE INFORMATION
Full Name: {{client.displayName}}
Date of Birth: _______________________
Place of Birth: _______________________
Gender: [ ] Male [ ] Female
Marital Status: [ ] Single [ ] Married [ ] Divorced [ ] Widowed
National ID Number: _______________________
Address: {{client.address}}
Phone: {{client.phone}}
Email: {{client.email}}

SECTION B: EMPLOYMENT DETAILS
Employer Name: _______________________
Employer NIS Number: _______________________
Job Title/Occupation: _______________________
Date of Employment: _______________________
Employment Type: [ ] Full-Time [ ] Part-Time [ ] Seasonal
Monthly Gross Salary: $_______________

SECTION C: NEXT OF KIN
Name: _______________________
Relationship: _______________________
Address: _______________________
Phone: _______________________

SECTION D: BANK DETAILS (For Benefit Payments)
Bank Name: _______________________
Branch: _______________________
Account Number: _______________________
Account Type: [ ] Savings [ ] Checking

SECTION E: DECLARATION
I declare that all information provided is true and correct. I understand that false information may result in denial of benefits.

Employee Signature: _______________________
Date: {{date.today}}

EMPLOYER CERTIFICATION
I certify that the above-named person is employed by our organization.

Employer Signature: _______________________
Name: _______________________
Position: _______________________
Date: _______________________
Company Stamp: [STAMP]

Submitted by: {{staff.name}}
KAJ Accountancy Services`,
    placeholders: [...commonPlaceholders],
    sortOrder: 111,
  },
  {
    name: "NIS Monthly Contribution Schedule",
    description: "Monthly NIS contribution schedule for employers",
    category: "FORM",
    business: "KAJ",
    content: `NATIONAL INSURANCE SCHEME
MONTHLY CONTRIBUTION SCHEDULE

Employer Name: {{client.displayName}}
Employer NIS Number: _______________________
TIN: {{client.tinNumber}}
Contribution Period: _______________

EMPLOYEE CONTRIBUTIONS

| No. | Employee Name | NIS Number | Gross Earnings | Employee Share (5.6%) | Employer Share (8.4%) | Total |
|-----|--------------|------------|----------------|----------------------|----------------------|-------|
| 1   |              |            | $              | $                    | $                    | $     |
| 2   |              |            | $              | $                    | $                    | $     |
| 3   |              |            | $              | $                    | $                    | $     |
| 4   |              |            | $              | $                    | $                    | $     |
| 5   |              |            | $              | $                    | $                    | $     |
| 6   |              |            | $              | $                    | $                    | $     |
| 7   |              |            | $              | $                    | $                    | $     |
| 8   |              |            | $              | $                    | $                    | $     |
| 9   |              |            | $              | $                    | $                    | $     |
| 10  |              |            | $              | $                    | $                    | $     |

SUMMARY
Total Employees: _______
Total Gross Earnings: $_______________
Total Employee Contributions (5.6%): $_______________
Total Employer Contributions (8.4%): $_______________
Grand Total Contributions (14%): $_______________

PAYMENT DETAILS
Due Date: _______________________
Payment Method: [ ] Cash [ ] Cheque [ ] Bank Transfer
Receipt Number: _______________________

EMPLOYER DECLARATION
I certify that the information contained herein is true and correct.

Authorized Signature: _______________________
Name: _______________________
Date: {{date.today}}

Prepared by: {{staff.name}}
KAJ Accountancy Services`,
    placeholders: [...commonPlaceholders],
    sortOrder: 112,
  },

  // ===============================
  // Legal Templates
  // ===============================

  {
    name: "General Affidavit",
    description: "Standard affidavit template for sworn statements",
    category: "FORM",
    business: null,
    content: `AFFIDAVIT

BEFORE ME, the undersigned authority, personally appeared:

DEPONENT INFORMATION
Name: {{client.displayName}}
Address: {{client.address}}
Occupation: _______________________
National ID/Passport: _______________________

Who being duly sworn, deposes and says:

1. I am the Deponent named above and I make this affidavit of my own free will and accord.

2. I am [relationship/capacity] and I have personal knowledge of the facts stated herein.

3. [STATEMENT OF FACTS]
   _________________________________________________________________
   _________________________________________________________________
   _________________________________________________________________
   _________________________________________________________________
   _________________________________________________________________

4. [ADDITIONAL STATEMENTS IF REQUIRED]
   _________________________________________________________________
   _________________________________________________________________
   _________________________________________________________________

5. I make this solemn declaration conscientiously believing it to be true and knowing that it is of the same force and effect as if made under oath.

SWORN to at Georgetown, Guyana
this _____ day of ____________, {{date.year}}

BEFORE ME:

_______________________
Justice of the Peace/Commissioner of Oaths/Notary Public

_______________________
Deponent: {{client.displayName}}

Witness:
1. Name: _______________________ Signature: _______________________
2. Name: _______________________ Signature: _______________________`,
    placeholders: [...commonPlaceholders],
    sortOrder: 120,
  },
  {
    name: "Statutory Declaration",
    description: "Formal statutory declaration for legal purposes",
    category: "FORM",
    business: null,
    content: `STATUTORY DECLARATION
(Made pursuant to the Statutory Declarations Act, Chapter 5:09)

I, {{client.displayName}}, of {{client.address}}, do solemnly and sincerely declare as follows:

1. I am the declarant and I am [age] years of age.

2. I am making this declaration for the purpose of:
   _________________________________________________________________

3. I declare and affirm that:

   (a) _________________________________________________________________

   (b) _________________________________________________________________

   (c) _________________________________________________________________

   (d) _________________________________________________________________

4. I am fully aware that making a false statutory declaration is a criminal offence punishable under the laws of Guyana.

5. I make this solemn declaration conscientiously believing it to be true and correct, and knowing that it has the same force and effect as if made under oath.

AND I make this solemn declaration conscientiously believing it to be true and by virtue of the provisions of the Statutory Declarations Act.

DECLARED at Georgetown, Guyana
this _____ day of ____________, {{date.year}}

_______________________
{{client.displayName}}
(Declarant)

BEFORE ME:

_______________________
Justice of the Peace/Commissioner of Oaths
Name: _______________________
Registration No.: _______________________`,
    placeholders: [...commonPlaceholders],
    sortOrder: 121,
  },
  {
    name: "Non-Disclosure Agreement (NDA)",
    description:
      "Confidentiality agreement for protecting sensitive information",
    category: "AGREEMENT",
    business: null,
    content: `NON-DISCLOSURE AGREEMENT

This Non-Disclosure Agreement ("Agreement") is made effective as of {{date.today}}

BETWEEN:
Disclosing Party: _______________________
Address: _______________________
("Disclosing Party")

AND:
Receiving Party: {{client.displayName}}
Address: {{client.address}}
("Receiving Party")

RECITALS
WHEREAS, the Disclosing Party possesses certain confidential and proprietary information; and
WHEREAS, the Receiving Party desires to receive certain confidential information for the purpose of [PURPOSE];

NOW, THEREFORE, in consideration of the mutual covenants contained herein, the parties agree:

1. DEFINITION OF CONFIDENTIAL INFORMATION
"Confidential Information" includes all information disclosed by the Disclosing Party, whether orally, in writing, or by inspection, including but not limited to:
- Business plans and strategies
- Financial information
- Client lists and data
- Technical data and know-how
- Trade secrets

2. OBLIGATIONS OF RECEIVING PARTY
The Receiving Party agrees to:
(a) Hold all Confidential Information in strict confidence
(b) Not disclose Confidential Information to any third party
(c) Use Confidential Information only for the stated purpose
(d) Protect Confidential Information with reasonable care

3. EXCLUSIONS
This Agreement does not apply to information that:
(a) Is or becomes publicly available through no fault of the Receiving Party
(b) Was known to the Receiving Party prior to disclosure
(c) Is independently developed by the Receiving Party
(d) Is required to be disclosed by law

4. TERM
This Agreement shall remain in effect for [NUMBER] years from the date of execution.

5. RETURN OF INFORMATION
Upon request or termination, the Receiving Party shall return or destroy all Confidential Information.

6. REMEDIES
The Receiving Party acknowledges that breach may cause irreparable harm and the Disclosing Party shall be entitled to seek injunctive relief.

7. GOVERNING LAW
This Agreement shall be governed by the laws of the Co-operative Republic of Guyana.

IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.

DISCLOSING PARTY:
Signature: _______________________
Name: _______________________
Date: _______________________

RECEIVING PARTY:
Signature: _______________________
Name: {{client.displayName}}
Date: {{date.today}}`,
    placeholders: [...commonPlaceholders],
    sortOrder: 122,
  },

  // ===============================
  // Correspondence Templates
  // ===============================

  {
    name: "Engagement Letter - Professional Services",
    description: "Initial engagement letter outlining service terms",
    category: "LETTER",
    business: null,
    content: `[COMPANY LETTERHEAD]

{{date.today}}

{{client.displayName}}
{{client.address}}

RE: ENGAGEMENT FOR PROFESSIONAL SERVICES

Dear {{client.displayName}},

Thank you for selecting [Company Name] to provide professional services. This letter confirms the terms of our engagement.

1. SCOPE OF SERVICES
We have been engaged to provide the following services:
[ ] Tax Return Preparation
[ ] Bookkeeping Services
[ ] Immigration Services
[ ] Business Registration
[ ] Financial Consulting
[ ] Other: _______________________

Specific services include:
- _______________________
- _______________________
- _______________________

2. OUR RESPONSIBILITIES
We will:
- Perform services with professional competence and due care
- Maintain confidentiality of your information
- Provide regular progress updates
- Meet agreed-upon deadlines

3. YOUR RESPONSIBILITIES
You agree to:
- Provide accurate and complete information
- Submit required documents by specified deadlines
- Pay fees in accordance with the payment schedule
- Respond promptly to our inquiries

4. FEES AND PAYMENT
Professional Fees: $_______________
Payment Schedule: [ ] Due on completion [ ] 50% deposit required [ ] Monthly billing

Additional costs (filing fees, courier, etc.) will be billed separately at cost.

5. TIMELINE
Estimated completion: _______________________
(Subject to timely receipt of required information)

6. LIMITATIONS
Our engagement does not include:
- Legal advice (unless specifically engaged for legal services)
- Audit or assurance services
- Representation in court proceedings

7. CONFIDENTIALITY
All information provided will be treated as confidential and used solely for the purposes of this engagement.

8. TERMINATION
Either party may terminate this engagement with 14 days written notice.

Please confirm your acceptance by signing and returning a copy of this letter.

Sincerely,

{{staff.name}}
{{staff.title}}
[Company Name]

ACCEPTANCE
I have read and agree to the terms of this engagement letter.

_______________________
{{client.displayName}}
Date: _______________________`,
    placeholders: [...commonPlaceholders],
    sortOrder: 130,
  },
  {
    name: "Payment Reminder - First Notice",
    description: "Friendly payment reminder for overdue invoices",
    category: "LETTER",
    business: null,
    content: `[COMPANY LETTERHEAD]

{{date.today}}

{{client.displayName}}
{{client.address}}

RE: PAYMENT REMINDER - Invoice #[INVOICE NUMBER]

Dear {{client.displayName}},

I hope this letter finds you well.

This is a friendly reminder that payment for the following invoice is now overdue:

Invoice Number: [INVOICE NUMBER]
Invoice Date: [INVOICE DATE]
Amount Due: $[AMOUNT]
Due Date: [DUE DATE]
Days Overdue: [DAYS]

We understand that oversights can happen. If you have already made this payment, please disregard this notice and accept our thanks.

If payment has not yet been made, we kindly request that you remit the outstanding amount at your earliest convenience.

Payment Methods:
- Bank Transfer: [Bank Details]
- Cheque payable to: [Company Name]
- Cash at our office

If you are experiencing any difficulties or have questions regarding this invoice, please do not hesitate to contact us to discuss alternative arrangements.

Thank you for your prompt attention to this matter.

Best regards,

{{staff.name}}
{{staff.title}}
[Company Name]
Tel: [Phone]
Email: [Email]`,
    placeholders: [...commonPlaceholders],
    sortOrder: 131,
  },
  {
    name: "Payment Reminder - Final Notice",
    description: "Final payment reminder before collection action",
    category: "LETTER",
    business: null,
    content: `[COMPANY LETTERHEAD]

{{date.today}}

{{client.displayName}}
{{client.address}}

RE: FINAL NOTICE - OVERDUE PAYMENT
Invoice #[INVOICE NUMBER]

Dear {{client.displayName}},

FINAL NOTICE BEFORE FURTHER ACTION

Despite previous reminders, our records indicate that the following amount remains outstanding:

Invoice Number: [INVOICE NUMBER]
Original Amount: $[AMOUNT]
Amount Due: $[AMOUNT]
Due Date: [DUE DATE]
Days Overdue: [DAYS]

We have attempted to contact you regarding this matter but have not received a response or payment.

THIS IS YOUR FINAL NOTICE

If payment is not received within 7 DAYS of the date of this letter, we will have no alternative but to:
1. Suspend all current services
2. Apply late payment interest charges
3. Refer the matter to our collections department
4. Consider legal action to recover the debt

To avoid these actions, please:
- Make immediate payment of the full amount due, OR
- Contact us within 3 days to discuss a payment arrangement

Payment must be made by: [DEADLINE DATE]

We strongly urge you to resolve this matter immediately to avoid additional costs and damage to your credit standing.

Contact our office immediately at [Phone] to discuss this matter.

This letter serves as formal notice of our intent to pursue collection if payment is not received.

Yours sincerely,

{{staff.name}}
{{staff.title}}
[Company Name]

cc: Accounts Department`,
    placeholders: [...commonPlaceholders],
    sortOrder: 132,
  },
  {
    name: "Status Update Letter",
    description: "Letter providing status update on ongoing matters",
    category: "LETTER",
    business: null,
    content: `[COMPANY LETTERHEAD]

{{date.today}}

{{client.displayName}}
{{client.address}}

RE: STATUS UPDATE - [MATTER/SERVICE TYPE]
Reference: [REFERENCE NUMBER]

Dear {{client.displayName}},

I am writing to provide you with an update on the progress of your [service type].

CURRENT STATUS: [In Progress / Under Review / Pending Documents / Awaiting Response]

PROGRESS SUMMARY:

Steps Completed:
✓ [Completed step 1]
✓ [Completed step 2]
✓ [Completed step 3]

Currently In Progress:
→ [Current action being taken]

Pending Items:
○ [Next step awaiting completion]
○ [Additional pending items]

TIMELINE:
Submitted: [Date]
Expected Response: [Date/Timeframe]
Estimated Completion: [Date/Timeframe]

DOCUMENTS RECEIVED:
[ ] [Document 1]
[ ] [Document 2]
[ ] [Document 3]

OUTSTANDING REQUIREMENTS:
If applicable, please provide:
• [Outstanding document/information]
• [Outstanding document/information]

NEXT STEPS:
1. [Next action we will take]
2. [What we are waiting for]
3. [Expected milestone]

We will continue to monitor the progress and keep you informed of any developments. If you have any questions or concerns, please do not hesitate to contact us.

Thank you for your continued patience and trust in our services.

Best regards,

{{staff.name}}
{{staff.title}}
[Company Name]
Tel: [Phone]
Email: [Email]`,
    placeholders: [...commonPlaceholders],
    sortOrder: 133,
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
