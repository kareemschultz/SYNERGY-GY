# Smart Client Onboarding & Wizard System

**Status:** ✅ CLIENT ONBOARDING COMPLETE
**Phase:** 2
**Priority:** High
**Created:** December 2024
**Last Updated:** December 11, 2024

## Implementation Status

| Component | Status | Notes |
|-----------|--------|-------|
| Wizard Framework | ✅ Complete | useWizard hook, WizardContainer, WizardProgress, WizardNavigation, WizardStep |
| Client Onboarding Steps | ✅ Complete | 6 steps: Type, BasicInfo, Contact, Identification, Services, Review |
| TypeScript Integration | ✅ Complete | All TypeScript errors resolved |
| Route Integration | ✅ Complete | `/app/clients/onboard` route with full page |
| API Integration | ✅ Complete | Connected to clients.create mutation |
| UI/UX Polish | ✅ Complete | SVG accessibility, responsive design |
| Clients Page Integration | ✅ Complete | "Client Wizard" button in header, empty state |
| Matter Creation Wizard | ⏳ Pending | Phase B |
| Compliance Filing Wizards | ⏳ Pending | Phase D |
| Immigration Case Wizards | ⏳ Pending | Phase F |
| Government Form Auto-Fill | ⏳ Pending | Phase E |

### Client Onboarding Wizard - Completed Features

- **UI Integration** - "Client Wizard" button added to clients page header alongside "Quick Add"
- **Empty State Link** - Empty clients table shows wizard link for first-time users
- **Multi-step wizard** with 6 steps: Client Type → Basic Info → Contact → Identification → Services → Review
- **Client type selection** with 8 types: Individual, Small Business, Corporation, NGO, Co-op, Credit Union, Foreign National, Investor
- **Adaptive forms** that change based on client type (individual vs business fields)
- **Business assignment** with GCMC/KAJ selection and service categories
- **Form validation** with step-by-step error handling and inline messages
- **LocalStorage persistence** for draft saving (key: "client-onboarding")
- **Review step** with full summary, required documents checklist, and notes
- **Direct API integration** with clients.create mutation
- **Success state** with navigation to view client or add another
- **Mobile responsive** with progress bar and step indicators
- **Accessible** SVG icons and keyboard navigation

## Summary

Build an intelligent, adaptive wizard system across GK-Nexus that simplifies data entry for clients, services, compliance filings, and more. The system will dynamically adjust based on client type, selected services, and business rules, while ensuring required documents are tracked and workflows are properly initiated.

---

## Research Summary

### Industry Best Practices (2025)

Based on research from [Webstacks](https://www.webstacks.com/blog/multi-step-form), [UX Design Institute](https://www.uxdesigninstitute.com/blog/ux-onboarding-best-practices-guide/), and immigration software leaders like [Docketwise](https://www.docketwise.com/) and [Clio](https://www.clio.com/practice-types/immigration-law-software/):

1. **Progressive Disclosure** - Break complex forms into bite-sized steps (70% more approachable)
2. **Progress Indicators** - 80% of users feel more confident with visible progress
3. **Start Simple** - Name/type questions first, complex details later
4. **Real-Time Validation** - 24% abandon forms due to lack of clarity
5. **Skippable Steps** - Allow users to skip optional sections and return later
6. **AI-Powered Adaptation** - Personalize flows based on user context (2025 trend)
7. **Document Checklists** - Track what's received vs. outstanding
8. **Multi-Language Support** - For immigration clients especially

---

## Wizard Implementations

### 1. Client Onboarding Wizard (Priority: HIGH)

**Location:** `/app/clients/onboard` (new route)

**Flow:**
```
Step 1: Client Type Selection
├── Individual (Person)
├── Business (Company/Organization)
└── Foreign National

Step 2: Basic Information (adapts to type)
├── Individual: First name, Last name, DOB, Nationality
├── Business: Business name, Registration #, Incorporation date
└── Foreign: Passport country, Current location

Step 3: Contact Information
├── Email, Phone, Address
└── Alternate contacts

Step 4: Identification
├── TIN Number (required for KAJ services)
├── National ID / Passport
└── NIS Number

Step 5: Business Assignment & Services
├── Select GCMC and/or KAJ
├── Show service categories based on selection
└── Pre-select services client is interested in

Step 6: Document Collection Preview
├── Show required documents based on selected services
├── Optional: Upload documents now or later
└── Generate document checklist

Step 7: Review & Create
├── Summary of all entered data
├── Create client + initial matter(s)
└── Success with next steps
```

**Adaptive Logic:**
- If type = INDIVIDUAL → show personal fields, hide business fields
- If type = FOREIGN_NATIONAL → require passport, show immigration services
- If services include TAX → require TIN
- If services include IMMIGRATION → require passport, police clearance checklist
- If services include NIS → require NIS number

**Files to Create/Modify:**
- `apps/web/src/routes/app/clients/onboard.tsx` (new wizard page)
- `apps/web/src/components/wizards/client-onboarding/` (wizard components)
- `packages/api/src/routers/clients.ts` (add onboard endpoint)

---

### 2. Service/Matter Creation Wizard (Priority: HIGH)

**Location:** `/app/matters/new` (replace current simple form)

**Flow:**
```
Step 1: Select Client
├── Search existing clients
├── Or quick-add new client (opens mini-wizard)
└── Show client summary card

Step 2: Select Business & Service Category
├── GCMC: Training, Consulting, Paralegal, Immigration, Business Proposals
├── KAJ: Tax, Compliance, PAYE, Financial Statements, NIS, Audit
└── Filter by client's assigned businesses

Step 3: Select Specific Service
├── Show service catalog items in category
├── Display pricing, duration, requirements
└── Multiple selection allowed (creates linked matters)

Step 4: Document Requirements
├── Show required documents for selected service(s)
├── Check which client already has on file
├── Mark what's still needed
└── Optional upload

Step 5: Service Details
├── Title (pre-filled from service name)
├── Priority, Due date
├── Assigned staff
├── Tax year (if applicable)
├── Estimated fee (from service catalog)

Step 6: Review & Create
├── Summary with checklist items
├── Create matter(s)
└── Option to create linked matters (e.g., Work Permit + Tax Compliance)
```

**Adaptive Logic:**
- Show only services from client's assigned businesses
- Pre-populate checklist from `serviceType.defaultChecklistItems`
- Link related services (Work Permit needs Tax Compliance)
- Auto-calculate fee from service catalog
- Show government agencies involved

**Files to Create/Modify:**
- `apps/web/src/routes/app/matters/new.tsx` (enhance to wizard)
- `apps/web/src/components/wizards/matter-creation/` (wizard components)

---

### 3. Compliance Filing Wizards (Priority: HIGH)

**Location:** `/app/filings/` (new section)

**Sub-Wizards:**

#### 3a. PAYE Filing Wizard
```
Step 1: Select Client & Period
├── Select employer client
├── Select month/year
└── Check previous filing status

Step 2: Employee Earnings
├── Import from previous month (if exists)
├── Add/edit employees
├── Enter gross pay, allowances, deductions
└── Auto-calculate tax withheld

Step 3: Summary & Calculations
├── Total employees
├── Total gross pay
├── Total PAYE withheld
├── Amount due to GRA

Step 4: Documents
├── Payroll register
├── Supporting documents
└── Payment receipt (after submission)

Step 5: Submit & Track
├── Generate filing document
├── Mark as submitted
├── Set reminder for next month
└── Create deadline entry
```

#### 3b. NIS Contribution Wizard
```
Step 1: Select Employer & Period
Step 2: Employee Schedule
├── Import employee list
├── Enter earnings per employee
├── Auto-calculate contributions (5.6% employee, 8.4% employer)
Step 3: Summary
├── Total contributions
├── Employer portion
├── Employee portion
Step 4: Generate Schedule & Submit
```

#### 3c. Income Tax Return Wizard
```
Step 1: Client & Tax Year Selection
Step 2: Income Sources (adapts to client type)
├── Individual: Employment, Self-employment, Rental, Investment
├── Corporate: Business income, Other income
Step 3: Deductions & Credits
Step 4: Document Checklist
├── TIN cert, Income statements, Expense receipts
├── Bank statements, Previous assessments
Step 5: Calculate & Review
Step 6: Generate Return for Filing
```

#### 3d. VAT Return Wizard
```
Step 1: Business & Period
Step 2: Output VAT (Sales)
Step 3: Input VAT (Purchases)
Step 4: Net VAT Calculation
Step 5: Supporting Documents
Step 6: Generate Return
```

**Files to Create:**
- `apps/web/src/routes/app/filings/` (new folder)
  - `index.tsx` - Filing dashboard
  - `paye.tsx` - PAYE wizard
  - `nis.tsx` - NIS wizard
  - `income-tax.tsx` - Tax return wizard
  - `vat.tsx` - VAT wizard
- `packages/api/src/routers/filings.ts` (new router)
- `packages/db/src/schema/filings.ts` (filing records schema)

---

### 4. Document Collection Wizard (Priority: MEDIUM)

**Location:** `/app/documents/collect` or integrated into other wizards

**Purpose:** Batch document collection for a client/matter

**Flow:**
```
Step 1: Select Context
├── Client + Matter (optional)
└── Show what's already on file

Step 2: Document Checklist
├── Required documents (from service requirements)
├── Optional documents
├── Status: Received, Pending, Expired

Step 3: Upload Interface
├── Drag & drop zone
├── Auto-categorize by filename patterns
├── Set expiration dates
└── Add notes

Step 4: Review & Confirm
├── All uploaded documents
├── Missing items highlighted
└── Send document request to client (via portal/email)
```

---

### 5. Invoice Creation Wizard (Priority: MEDIUM)

**Location:** `/app/invoices/new` (enhance existing)

**Flow:**
```
Step 1: Select Client & Matter(s)
├── Search client
├── Show open matters
├── Multi-select matters to invoice

Step 2: Line Items
├── Pre-populate from matter fees
├── Add custom line items
├── Service catalog integration
└── Auto-calculate amounts

Step 3: Discounts & Adjustments
├── Discount type (%, fixed)
├── Reason for discount
└── Government fees to pass through

Step 4: Payment Terms
├── Due date
├── Payment instructions
├── Notes to client

Step 5: Preview & Send
├── Invoice preview (PDF-like)
├── Send via email
├── Print option
└── Mark as sent
```

---

### 6. Training Enrollment Wizard (Priority: MEDIUM)

**Location:** `/app/training/enroll` (enhance existing)

**Flow:**
```
Step 1: Select Course & Schedule
├── Browse courses
├── Select schedule/session
└── Check availability

Step 2: Select Participants
├── Existing clients
├── Add new participants
├── Bulk add for corporate clients

Step 3: Payment & Pricing
├── Show per-participant pricing
├── Apply group discounts
├── Payment method

Step 4: Confirmation
├── Registration summary
├── Generate certificates (post-completion)
└── Send confirmation emails
```

---

### 7. Appointment Booking Wizard (Priority: MEDIUM)

**Location:** `/app/appointments/new` (enhance existing)

**Flow:**
```
Step 1: Select Client
Step 2: Appointment Type
├── Initial consultation
├── Document review
├── Filing assistance
├── Training session
Step 3: Date/Time Selection
├── Calendar view
├── Staff availability
├── Duration
Step 4: Details & Confirmation
├── Location (In-person, Phone, Video)
├── Notes/agenda
├── Send confirmation
```

---

### 8. Immigration Case Wizard (Priority: HIGH for GCMC)

**Location:** `/app/immigration/` (new section)

**Sub-Wizards:**

#### 8a. Work Permit Application
```
Step 1: Applicant Information
├── Select/create client (foreign national)
├── Passport details
├── Current visa status

Step 2: Employer Information
├── Select/create employer client
├── Company registration
├── TIN/NIS compliance status

Step 3: Position Details
├── Job title, Description
├── Salary, Duration
├── Justification for foreign worker

Step 4: Document Checklist
├── Passport (all pages)
├── Photos (4 copies)
├── Police clearance
├── Medical certificate
├── Employment contract
├── Employer compliance docs
├── Educational certificates

Step 5: Fees & Timeline
├── Government fees
├── Service fees
├── Expected timeline (6-8 weeks)

Step 6: Submit & Track
├── Create matter with checklist
├── Generate cover letter
├── Track submission status
```

#### 8b. Citizenship Application
Similar structure with citizenship-specific requirements.

#### 8c. Business Visa
Similar structure with business visa requirements.

---

## Shared Wizard Components

### Reusable Components to Build

```
apps/web/src/components/wizards/
├── WizardContainer.tsx       # Main wrapper with progress
├── WizardStep.tsx            # Individual step container
├── WizardProgress.tsx        # Progress bar/steps indicator
├── WizardNavigation.tsx      # Previous/Next/Skip buttons
├── WizardSummary.tsx         # Review step summary
├── ClientSelector.tsx        # Search/select client
├── ServiceSelector.tsx       # Service catalog picker
├── DocumentChecklist.tsx     # Document requirements list
├── DocumentUploader.tsx      # Multi-file uploader
├── CalculationSummary.tsx    # Financial calculations display
└── hooks/
    ├── useWizard.ts          # Wizard state management
    └── useDocumentRequirements.ts  # Fetch doc requirements
```

### Wizard State Management

```typescript
// useWizard hook
interface WizardState<T> {
  currentStep: number;
  totalSteps: number;
  data: T;
  errors: Record<string, string>;
  isComplete: boolean;
  canGoNext: boolean;
  canGoPrev: boolean;
}

function useWizard<T>(config: WizardConfig<T>) {
  // Manages step navigation
  // Validates each step
  // Persists draft to localStorage
  // Tracks completion
}
```

---

## Database Schema Additions

### Filing Records Table

```typescript
// packages/db/src/schema/filings.ts
export const filing = pgTable("filing", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  clientId: text("client_id").references(() => client.id).notNull(),
  matterId: text("matter_id").references(() => matter.id),
  business: businessEnum("business").notNull(),

  // Filing type
  filingType: filingTypeEnum("filing_type").notNull(), // PAYE, NIS, VAT, INCOME_TAX
  period: text("period").notNull(), // "2025-01" for monthly, "2024" for annual

  // Status
  status: filingStatusEnum("status").default("DRAFT").notNull(),
  // DRAFT, READY, SUBMITTED, ACCEPTED, REJECTED, AMENDED

  // Data (JSON for flexibility)
  filingData: jsonb("filing_data"), // Earnings, calculations, etc.

  // Amounts
  amountDue: decimal("amount_due", { precision: 12, scale: 2 }),
  amountPaid: decimal("amount_paid", { precision: 12, scale: 2 }),

  // Tracking
  submittedAt: timestamp("submitted_at"),
  submittedById: text("submitted_by_id").references(() => user.id),
  confirmationNumber: text("confirmation_number"),

  // Audit
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
  createdById: text("created_by_id").references(() => user.id).notNull(),
});

export const filingTypeEnum = pgEnum("filing_type", [
  "PAYE_MONTHLY", "PAYE_ANNUAL",
  "NIS_MONTHLY", "NIS_QUARTERLY",
  "VAT_MONTHLY", "VAT_QUARTERLY",
  "INCOME_TAX_INDIVIDUAL", "INCOME_TAX_CORPORATE",
  "COMPLIANCE_TENDER", "COMPLIANCE_WORK_PERMIT", "COMPLIANCE_OTHER"
]);
```

---

## Implementation Phases

### Phase A: Foundation (Week 1)
1. Create shared wizard components
2. Build `useWizard` hook
3. Create wizard container with progress UI

### Phase B: Client Onboarding (Week 2)
1. Build client onboarding wizard
2. Integrate with existing client creation API
3. Add document requirements lookup
4. Test adaptive logic

### Phase C: Matter/Service Creation (Week 3)
1. Enhance matter creation with wizard
2. Service catalog integration
3. Document checklist generation
4. Linked matters support

### Phase D: Compliance Filings (Week 4-5)
1. PAYE wizard
2. NIS wizard
3. Filing records schema
4. Filing dashboard

### Phase E: Immigration Cases (Week 6)
1. Work permit wizard
2. Citizenship wizard
3. Integration with document tracking

### Phase F: Polish & Enhancement (Week 7)
1. Invoice wizard enhancement
2. Training enrollment wizard
3. Appointment booking wizard
4. Mobile responsiveness
5. Accessibility audit

---

## Critical Files to Modify/Create

### New Files
```
apps/web/src/routes/app/clients/onboard.tsx
apps/web/src/routes/app/filings/index.tsx
apps/web/src/routes/app/filings/paye.tsx
apps/web/src/routes/app/filings/nis.tsx
apps/web/src/routes/app/filings/income-tax.tsx
apps/web/src/routes/app/immigration/index.tsx
apps/web/src/routes/app/immigration/work-permit.tsx
apps/web/src/components/wizards/WizardContainer.tsx
apps/web/src/components/wizards/WizardStep.tsx
apps/web/src/components/wizards/WizardProgress.tsx
apps/web/src/components/wizards/WizardNavigation.tsx
apps/web/src/components/wizards/ClientSelector.tsx
apps/web/src/components/wizards/ServiceSelector.tsx
apps/web/src/components/wizards/DocumentChecklist.tsx
apps/web/src/components/wizards/hooks/useWizard.ts
packages/db/src/schema/filings.ts
packages/api/src/routers/filings.ts
```

### Files to Modify
```
apps/web/src/routes/app/matters/new.tsx (enhance with wizard)
apps/web/src/routes/app/invoices/new.tsx (enhance with wizard)
apps/web/src/routes/app/training/new.tsx (enhance with wizard)
apps/web/src/components/layout/sidebar.tsx (add Filings, Immigration nav)
packages/db/src/schema/index.ts (export filings)
packages/api/src/routers/index.ts (add filings router)
```

---

## UX Design Principles

1. **Progressive Disclosure** - Only show relevant fields based on context
2. **Smart Defaults** - Pre-fill from existing data where possible
3. **Save & Resume** - Auto-save drafts to localStorage
4. **Validation as You Go** - Real-time feedback on each step
5. **Clear Progress** - Always show where user is in the process
6. **Skip Optional** - Allow skipping non-essential steps
7. **Mobile First** - All wizards must work on mobile
8. **Accessibility** - Keyboard navigation, screen reader support
9. **Help Text** - Contextual guidance on complex fields
10. **Error Recovery** - Clear error messages with suggested actions

---

## Success Metrics

- [ ] Client onboarding time reduced by 50%
- [ ] Matter creation includes all required documents
- [ ] Compliance filings tracked end-to-end
- [ ] Zero missing document submissions
- [ ] Mobile completion rate > 80%
- [ ] User satisfaction score > 4/5

---

## Notes

- All wizards respect the **NO MOCK DATA** policy
- Empty states guide users to create their first entries
- Existing simple forms remain available for power users
- Wizards can be started but finished later (drafts)
- Integration with client portal for document requests

---

## Government Agency Integration & Form Auto-Fill

### Research Summary

Based on web research, here are the key Guyana government agencies and their digital capabilities:

### 1. Guyana Revenue Authority (GRA)
**Website:** [gra.gov.gy](https://www.gra.gov.gy/)
**eServices Portal:** [eservices.gra.gov.gy](https://eservices.gra.gov.gy/)
**Mobile App:** GRA Padna (Android/iOS)

**Available Forms (PDF):**
- Form 5 - Monthly PAYE Return (Deductions by Employer)
- Forms 2 - Annual PAYE Summary
- Individual Income Tax Return
- Corporate Income Tax Return
- VAT Returns

**Auto-Fill Opportunities:**
- Pre-fill TIN, employer details, employee list
- Calculate PAYE withheld from salary data
- Generate Form 5 with employee earnings
- Track filing deadlines (monthly 14th, annual April 30)

**Future API Integration:**
- eServices uses TIN as username
- Potential for direct submission when API available

---

### 2. National Insurance Scheme (NIS)
**Website:** [nis.org.gy](https://www.nis.org.gy/)
**E-Schedule Portal:** [esched.nis.org.gy](https://esched.nis.org.gy/)

**Available Forms:**
- Employer Registration Form
- Employee Registration (Form R4)
- Monthly Contribution Schedule (Form F200F2)
- Weekly Contribution Schedule (Form F200F6)
- Pension Application Forms

**Auto-Fill Opportunities:**
- Pre-fill employer NIS number, employee details
- Calculate contributions (5.6% employee, 8.4% employer)
- Generate contribution schedules
- Track deadline (15th of following month)

**Future API Integration:**
- E-Schedule submission portal exists
- Electronic schedule uploads supported

---

### 3. Deeds and Commercial Registries Authority (DCRA)
**Website:** [dcra.gov.gy](https://dcra.gov.gy/)

**Services:**
- Company Incorporation
- Business Name Registration
- Partnership Registration
- Trade Marks, Patents, Designs
- Powers of Attorney
- Bills of Sale

**Available Forms:**
- Articles of Incorporation
- Notice of Directors / Change of Directors
- Notice of Change of Address
- Business Name Application
- Partnership Registration

**Auto-Fill Opportunities:**
- Pre-fill director details from client profiles
- Generate company registration documents
- Track annual return deadlines

---

### 4. Ministry of Home Affairs (Immigration)
**Website:** [moha.gov.gy](https://moha.gov.gy/)

**Available Forms:**
- Employment Visa Application
- Work Permit Application
- Business Visa Application
- Firearm License Application

**Auto-Fill Opportunities:**
- Pre-fill applicant passport details
- Pre-fill employer information
- Generate cover letters
- Track permit expiration dates

**2025 Update:** Work permit applications must be filed before foreign national enters Guyana.

---

### 5. Guyana Police Force (GPF)
**Website:** [guyanapoliceforce.gy](https://guyanapoliceforce.gy/)

**Services:**
- Police Clearance Certificate
- Firearm License Application

**Auto-Fill Opportunities:**
- Pre-fill applicant personal details
- Generate supporting income/expenditure statements (for firearm)
- Track clearance validity

---

### 6. Guyana Lands & Surveys Commission (GL&SC)
**Website:** [glsc.gov.gy](https://glsc.gov.gy/)

**Services:**
- Land Application/Transfer
- Lease Applications
- Mortgage Applications

**Auto-Fill Opportunities:**
- Pre-fill applicant details
- Track land application status

---

### 7. National Procurement & Tender Administration (NPTA)
**Website:** [npta.gov.gy](https://www.npta.gov.gy/)
**Bidder Registration:** [bidders.npta.gov.gy/registration](https://bidders.npta.gov.gy/registration)

**Tender Compliance Requirements:**
- Valid NIS Compliance Certificate
- Valid GRA Tax Compliance Certificate

**Auto-Fill Opportunities:**
- Generate tender compliance package
- Track compliance certificate validity
- Alert when certificates expire

---

## Form Generation Feature

### Architecture

```
apps/web/src/features/forms/
├── templates/           # PDF form templates (blank PDFs)
│   ├── gra/
│   │   ├── form-5-paye.pdf
│   │   ├── forms-2-annual.pdf
│   │   └── income-tax-individual.pdf
│   ├── nis/
│   │   ├── employer-registration.pdf
│   │   └── contribution-schedule.pdf
│   ├── dcra/
│   │   ├── articles-of-incorporation.pdf
│   │   └── business-name-application.pdf
│   ├── moha/
│   │   ├── work-permit-application.pdf
│   │   └── employment-visa.pdf
│   └── gpf/
│       └── firearm-application.pdf
├── generators/          # Form fill logic
│   ├── gra-form5.ts
│   ├── nis-schedule.ts
│   └── work-permit.ts
├── components/
│   ├── FormPreview.tsx
│   ├── FormDownload.tsx
│   └── FormFieldMapper.tsx
└── hooks/
    └── useFormGenerator.ts
```

### Form Field Mapping

```typescript
// Example: GRA Form 5 field mapping
const form5Mapping = {
  employerTin: { clientField: "tinNumber", pdfField: "tin_number" },
  employerName: { clientField: "displayName", pdfField: "employer_name" },
  periodMonth: { wizardField: "period.month", pdfField: "tax_period_month" },
  periodYear: { wizardField: "period.year", pdfField: "tax_period_year" },
  employees: {
    array: true,
    fields: {
      name: { field: "employee_name_{{index}}" },
      tin: { field: "employee_tin_{{index}}" },
      grossPay: { field: "gross_pay_{{index}}" },
      taxWithheld: { field: "tax_withheld_{{index}}" },
    }
  }
};
```

### PDF Library Options

1. **pdf-lib** (Recommended) - Pure JavaScript, works in browser
2. **puppeteer** - For complex HTML-to-PDF generation
3. **@react-pdf/renderer** - For custom PDF generation from React

---

## Implementation Phases (Updated)

### Phase A: Foundation (Week 1)
1. Shared wizard components
2. useWizard hook
3. Form preview components

### Phase B: Client Onboarding (Week 2)
1. Client onboarding wizard
2. Self-service portal registration
3. Document upload with camera capture
4. Mobile responsive design

### Phase C: Matter/Service Creation (Week 3)
1. Matter creation wizard
2. Service catalog integration
3. Document checklist generation
4. Linked matters support

### Phase D: Compliance Filings (Week 4-5)
1. PAYE wizard with Form 5 generation
2. NIS wizard with schedule generation
3. Filing records schema
4. Filing dashboard with deadlines

### Phase E: Government Forms (Week 6)
1. PDF form templates collection
2. Form field mapping system
3. Auto-fill from client data
4. Form preview and download

### Phase F: Immigration Cases (Week 7)
1. Work permit wizard
2. Work permit form generation
3. Document tracking integration

### Phase G: Polish & Mobile (Week 8)
1. Mobile camera document capture
2. Invoice wizard enhancement
3. Training enrollment wizard
4. Accessibility audit

---

## Future API Integration Roadmap

When Guyana government agencies provide APIs or eServices integration:

### GRA eServices API (When Available)
```typescript
// Future integration point
interface GRAIntegration {
  submitForm5(data: PAYEData): Promise<SubmissionResult>;
  submitIncomeTax(data: TaxReturnData): Promise<SubmissionResult>;
  getComplianceStatus(tin: string): Promise<ComplianceStatus>;
}
```

### NIS E-Schedule API (Partial - Exists Now)
```typescript
// Could potentially integrate with esched.nis.org.gy
interface NISIntegration {
  uploadSchedule(file: File): Promise<SubmissionResult>;
  getContributionHistory(nisNumber: string): Promise<Contribution[]>;
}
```

### Design for Future
- All form data stored in structured JSON
- Easy to map to future API payloads
- Filing records track submission status
- Ready for when agencies digitize fully
