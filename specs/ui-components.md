# UI Components Specification

This document provides detailed specifications for all UI components in the SYNERGY-GY legal practice management system.

---

## 1. Multi-Step Wizards

All wizards follow a consistent pattern:
- Progress indicator showing current step and completion status
- Navigation: "Back", "Next", "Save Draft" buttons
- Validation before proceeding to next step
- Auto-save drafts to prevent data loss
- Review step shows all entered data with edit links

### 1.1 Client Onboarding Wizard (5 Steps)

**Step 1: Basic Information**
- **Client Type** (radio buttons)
  - Individual
  - Business/Corporation
- **Full Name/Business Name** (text input)
  - Validation: Required, min 2 characters
  - For individuals: First Name, Middle Name (optional), Last Name
- **Contact Information**
  - Primary Phone: `+592-XXX-XXXX` (formatted input with country code)
  - Secondary Phone (optional)
  - Email: Standard email validation
  - Preferred Contact Method (dropdown: Phone, Email, WhatsApp)

**Step 2: Identification**
- **For Individuals:**
  - National ID Number: Format `XXXXXX` (6 digits)
  - Passport Number (optional): Alphanumeric
  - Date of Birth: Date picker (DD/MM/YYYY)
  - Gender (dropdown): Male, Female, Other, Prefer not to say
- **Tax Information:**
  - TIN (Tax Identification Number): Format validation
  - NIS Number: Format validation
- **Address:**
  - Street Address
  - City/Town (dropdown with common Guyana locations)
  - Region (dropdown: 1-10, Georgetown, etc.)
  - Country (default: Guyana)

**Step 3: Business Information** (conditional - only if Business/Corporation selected)
- **Business Registration Number**
- **Business Type** (dropdown)
  - Sole Proprietorship
  - Partnership
  - Corporation
  - Limited Liability Company (LLC)
  - Other
- **Date of Incorporation:** Date picker
- **Industry** (dropdown with common industries)
- **Number of Employees** (number input)
- **Registered Address** (checkbox to use same as contact address)

**Step 4: Document Upload**
- **Required Documents Checklist:**
  - [ ] Government-issued ID (PDF/Image)
  - [ ] Proof of Address (PDF/Image)
  - [ ] TIN Certificate (if applicable)
  - [ ] Business Registration (if applicable)
- **Drag-and-drop upload area**
  - Accepted formats: PDF, JPG, PNG
  - Max file size: 10MB per file
  - Preview thumbnails with delete option
- **Document categorization** (auto-suggested based on filename)

**Step 5: Review & Confirm**
- **Summary view** organized by section
  - Each section has "Edit" link to jump back to relevant step
- **Terms & Conditions checkbox**
- **Client assignment** (dropdown to assign to staff member)
- **Initial matter creation** (optional checkbox)
  - Quick matter creation form if checked
- **Submit button** creates client record and redirects to client profile

---

### 1.2 Work Permit Wizard (6 Steps)

**Step 1: Applicant Details**
- **Personal Information:**
  - Full Name (as per passport)
  - Date of Birth (DD/MM/YYYY)
  - Place of Birth (country dropdown)
  - Nationality (country dropdown)
  - Gender
- **Contact Information:**
  - Current Address (in home country)
  - Email Address
  - Phone Number (with country code)
- **Passport Information:**
  - Passport Number
  - Issue Date
  - Expiry Date (validation: must be valid for at least 6 months)
  - Issuing Country

**Step 2: Employer Information**
- **Employer Details:**
  - Company Name (searchable dropdown of existing clients or "Add New")
  - Business Registration Number
  - Industry/Sector
  - Company Address in Guyana
  - Contact Person Name & Title
  - Contact Phone & Email
- **If existing client selected:** Auto-populate known details

**Step 3: Job Details**
- **Position Information:**
  - Job Title
  - Job Description (rich text editor)
  - Department
  - Reporting To (position/title)
- **Employment Terms:**
  - Start Date (date picker)
  - Contract Duration (dropdown: 1 year, 2 years, 3 years, Indefinite)
  - Salary/Wage (GYD currency input)
  - Benefits Summary (textarea)
- **Work Location:**
  - Primary work location address
  - Remote work arrangement (Yes/No)

**Step 4: Document Checklist**
- **Required Documents:**
  - [ ] Valid Passport (bio-data page)
  - [ ] Passport-size photographs (2)
  - [ ] Police Clearance Certificate (from country of origin)
  - [ ] Educational Certificates/Qualifications
  - [ ] CV/Resume
  - [ ] Employment Contract (signed)
  - [ ] Employer's Business Registration
  - [ ] Employer's Letter of Support
  - [ ] Medical Certificate (if applicable)
  - [ ] Previous Work Permits (if applicable)
- **Interactive checklist** with status indicators
- **Document requirements notes** expandable per item

**Step 5: Document Upload**
- **Categorized upload sections** matching checklist
- **Each document type:**
  - Drag-and-drop zone
  - File preview
  - Document quality check suggestions
  - Option to add notes
- **Batch upload option**
- **Auto-categorization** based on OCR/filename

**Step 6: Review & Submit**
- **Complete application summary**
  - Applicant overview
  - Employer summary
  - Position details
  - Document checklist status
- **Application fee calculation** (based on permit type/duration)
- **Processing timeline estimate**
- **Assign to staff member** (dropdown)
- **Set internal deadline** (date picker with suggested date)
- **Submit button** creates matter and generates cover letter

---

### 1.3 Company Incorporation Wizard (7 Steps)

**Step 1: Company Name Selection**
- **Name Reservation Search:**
  - Search field to check name availability
  - Real-time availability check against registry
  - Similarity warnings
- **Proposed Names (3 required):**
  1. First Choice (text input)
  2. Second Choice (text input)
  3. Third Choice (text input)
- **Name Requirements checklist:**
  - Must end with Ltd., Inc., or Corp.
  - Cannot contain restricted words without approval
  - Cannot be identical to existing company
- **Name type** (radio buttons)
  - Standard name
  - Adapted name (requires justification)

**Step 2: Company Type & Structure**
- **Company Type** (radio buttons with descriptions)
  - Private Limited Company
  - Public Limited Company
  - Company Limited by Guarantee
  - Unlimited Company
- **Business Activity:**
  - Primary activity (searchable dropdown)
  - Secondary activities (multi-select)
  - NAICS Code (auto-suggested based on activity)
- **Share Capital:**
  - Authorized capital amount (GYD)
  - Number of shares
  - Par value per share (auto-calculated)
  - Currency (default GYD, other options available)

**Step 3: Directors & Officers**
- **Minimum requirements indicator** (e.g., "At least 1 director required")
- **Director Entry Form (repeatable):**
  - Full Name
  - Date of Birth
  - Nationality
  - Residential Address
  - Occupation
  - ID/Passport Number
  - Director Type (Executive/Non-Executive)
  - Shareholding (Yes/No)
- **Officers:**
  - Company Secretary (required)
  - Treasurer (optional)
  - Other officers (repeatable)
- **Add/Remove buttons** for multiple entries
- **Validation:** At least one director must be Guyanese resident

**Step 4: Shareholders & Share Allocation**
- **Shareholder Entry Form (repeatable):**
  - Individual or Corporate shareholder (radio)
  - Full Name/Company Name
  - ID/Registration Number
  - Address
  - Share class (Ordinary, Preference, etc.)
  - Number of shares allocated
  - Consideration/Payment amount
- **Share allocation summary:**
  - Total shares allocated
  - Total shares remaining
  - Percentage ownership pie chart
  - Share class breakdown
- **Validation:**
  - Total allocated cannot exceed authorized
  - At least one shareholder required
  - Percentages must total 100%

**Step 5: Registered Office & Business Address**
- **Registered Office Address:**
  - Cannot be PO Box
  - Must be physical location in Guyana
  - Street address
  - Building/Suite number
  - City/Town
  - Region
- **Option:** Use our office as registered address (checkbox with fee)
- **Principal Business Address:**
  - Checkbox: Same as registered office
  - If different: Full address fields
- **Business Hours:**
  - Operating hours (time inputs)
  - Contact number
  - Contact email

**Step 6: Documents Upload**
- **Required Documents:**
  - [ ] Directors' ID/Passport copies
  - [ ] Directors' proof of address
  - [ ] Shareholders' ID/Passport copies
  - [ ] Company Secretary consent letter
  - [ ] Memorandum of Association (template provided)
  - [ ] Articles of Association (template provided)
  - [ ] Form 3 (Declaration of Compliance) - signed
  - [ ] Proof of registered address
- **Templates provided:**
  - Download buttons for standard documents
  - Instructions for completion
- **Upload area per document type**

**Step 7: Review & Payment**
- **Summary sections with edit links:**
  - Company name choices
  - Company structure
  - Directors & officers list
  - Shareholders & share allocation
  - Addresses
  - Document checklist status
- **Fee calculation breakdown:**
  - Name reservation fee: GYD XXX
  - Registration fee: GYD XXX (based on capital)
  - Professional fee: GYD XXX
  - Stamp duty: GYD XXX
  - Total: GYD XXX
- **Payment options:**
  - Pay now (if payment integration available)
  - Pay later (generates invoice)
- **Estimated completion:** X business days
- **Submit button** creates matter and initiates process

---

### 1.4 Tax Return Preparation Wizard (6 Steps)

**Step 1: Return Type & Period**
- **Tax Return Type** (radio buttons)
  - Individual Income Tax
  - Corporation Tax
  - Value Added Tax (VAT)
  - Property Tax
  - PAYE Returns
- **Tax Year/Period:**
  - Year selector (dropdown)
  - Period (for VAT: monthly/quarterly selector)
- **Taxpayer Information:**
  - Link to existing client (searchable dropdown)
  - Or enter new taxpayer details
  - TIN (required, validated)
  - NIS Number (if applicable)

**Step 2: Income Sources**
*Dynamic form based on return type selected*

**For Individual Income Tax:**
- **Employment Income:**
  - Employer name(s) (repeatable)
  - Gross salary (GYD)
  - PAYE deducted
  - Benefits in kind
- **Business Income:**
  - Business name/type
  - Gross receipts
  - Allowable expenses (categorized)
  - Net profit/loss (auto-calculated)
- **Investment Income:**
  - Dividends received
  - Interest earned
  - Rental income
  - Capital gains
- **Other Income:**
  - Description
  - Amount

**For Corporation Tax:**
- Revenue breakdown by category
- Cost of goods sold
- Operating expenses (detailed categories)
- Capital allowances
- Brought forward losses

**Step 3: Deductions & Allowances**
*Dynamic based on return type*

**For Individual:**
- **Personal Allowances:**
  - Personal relief (auto-filled standard amount)
  - Spouse relief (if applicable)
  - Dependent children (number × rate)
  - Tertiary education (for children)
- **Deductible Expenses:**
  - Medical expenses
  - Life insurance premiums
  - Pension contributions
  - Charitable donations
  - Mortgage interest (if applicable)
- **Upload supporting documents** for each claim

**For Corporation:**
- Capital allowances by asset type
- Depreciation adjustments
- Losses brought forward
- Donations to approved charities
- R&D expenditure (if applicable)

**Step 4: Calculations Preview**
- **Tax Computation Display:**
  - Total income (summarized by category)
  - Less: Total deductions
  - Taxable income
  - Tax rates applied (progressive bands shown)
  - Gross tax payable
  - Less: Tax credits/prepayments
  - Net tax payable/refund due
- **Side-by-side comparison** (if prior year data available)
- **Highlight significant changes** from prior year
- **Tax optimization suggestions:**
  - Missed deductions alerts
  - Planning opportunities for next year
- **Editable fields** with recalculation on change

**Step 5: Review & Verify**
- **Complete return summary:**
  - All sections expandable/collapsible
  - Edit links to return to specific steps
- **Document checklist verification:**
  - All supporting documents attached
  - Quality check on uploaded documents
- **Declaration section:**
  - Review statutory declaration text
  - Checkbox confirmations:
    - [ ] Information is true and complete
    - [ ] Aware of penalties for false declaration
    - [ ] Authorize firm to file on behalf
- **Preparer information** (auto-filled)
- **Signature capture:**
  - Digital signature pad
  - Upload signed declaration option

**Step 6: Submit & File**
- **Filing method** (radio buttons)
  - Electronic filing to GRA (if integrated)
  - Manual filing (generate PDF for client)
  - Firm will file on behalf
- **Submission confirmation:**
  - Generate PDF copy
  - Email copy to client
  - Store in matter documents
- **Payment handling:**
  - If tax payable: Payment instructions
  - If refund due: Expected timeline
  - Generate payment voucher if needed
- **Set reminders:**
  - Payment deadline
  - Next year's return
  - Estimated tax payments (if applicable)
- **Matter creation:**
  - Create matter for this return
  - Link to client profile
  - Set follow-up tasks

---

## 2. Modal Dialogs

### 2.1 Confirmation Modal

**Purpose:** Confirm destructive or important actions

**Variants:**

**Delete Confirmation:**
```
┌─────────────────────────────────────────┐
│ [!] Delete Client?                   [×]│
├─────────────────────────────────────────┤
│                                         │
│ Are you sure you want to delete         │
│ "John Smith"?                           │
│                                         │
│ This will permanently delete:           │
│ • Client record                         │
│ • 3 associated matters                  │
│ • 47 documents                          │
│ • All communication history             │
│                                         │
│ This action cannot be undone.           │
│                                         │
│ Type "DELETE" to confirm: [_________]   │
│                                         │
│              [Cancel] [Delete Client]   │
└─────────────────────────────────────────┘
```

**Archive Confirmation:**
- Similar layout but warning is less severe
- Explains what archiving means (hidden from active lists, can be restored)
- No confirmation text required
- Action button: "Archive"

**Status Change Confirmation:**
- Shows current status → new status
- Lists implications of the change
- Optional comment field for reason
- Action button varies by context

**Component Props:**
- `type: "delete" | "archive" | "status" | "custom"`
- `title: string`
- `message: string`
- `itemName: string` (highlighted in message)
- `consequences: string[]` (bulleted list)
- `requireConfirmation: boolean` (shows text input for "DELETE")
- `confirmationText: string` (text to type)
- `onConfirm: () => void`
- `onCancel: () => void`
- `variant: "danger" | "warning" | "info"`

---

### 2.2 Quick View Modal

**Purpose:** Preview client or matter details without leaving current page

**Client Quick View:**
```
┌──────────────────────────────────────────────────────────┐
│ Client Details                      [Open Full] [Edit] [×]│
├──────────────────────────────────────────────────────────┤
│ [Avatar] John Smith                                       │
│          Individual Client                                │
│          Since: 15/03/2024                               │
│                                                          │
│ Contact                                                  │
│ ├─ 📞 +592-222-3333                                      │
│ ├─ ✉️  john.smith@email.com                             │
│ └─ 📍 123 Main St, Georgetown                           │
│                                                          │
│ Active Matters (3)                                       │
│ ├─ [Badge:In Progress] Work Permit Application          │
│ ├─ [Badge:Pending] Property Purchase                    │
│ └─ [Badge:Review] Tax Return 2024                       │
│                                                          │
│ Upcoming Deadlines                                       │
│ ├─ [🔴] Work permit docs - 2 days                       │
│ └─ [🟡] Property closing - 12 days                      │
│                                                          │
│ Recent Activity                                          │
│ ├─ 10/12/2025 - Document uploaded                       │
│ ├─ 08/12/2025 - Email sent                              │
│ └─ 05/12/2025 - Meeting completed                       │
│                                                          │
│ Quick Actions                                            │
│ [+ New Matter] [Send Email] [Schedule Meeting]           │
└──────────────────────────────────────────────────────────┘
```

**Matter Quick View:**
- Similar structure but focused on matter details
- Shows: Matter type, status, assigned staff, client, timeline
- Quick actions: Update status, Add note, Upload document

**Component Props:**
- `type: "client" | "matter"`
- `id: string` (client or matter ID)
- `onClose: () => void`
- `onOpenFull: () => void` (navigates to full page)
- `showQuickActions: boolean`

---

### 2.3 Document Preview Modal

**Purpose:** View documents without downloading

**Layout:**
```
┌────────────────────────────────────────────────────────────────┐
│ passport_scan.pdf                      [Download] [Print] [×]  │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────────────────────────────────────────────┐     │
│  │                                                       │     │
│  │                                                       │     │
│  │              [PDF Preview Area]                       │     │
│  │                                                       │     │
│  │                                                       │     │
│  │                                                       │     │
│  └──────────────────────────────────────────────────────┘     │
│                                                                │
│  [◄] [1 / 3] [►]                               [Zoom: 100%▼]  │
│                                                                │
│  Document Details:                                             │
│  • Uploaded: 10/12/2025 at 14:30                              │
│  • Size: 2.4 MB                                               │
│  • Type: Identification Document                               │
│  • Category: Passports                                         │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**Features:**
- PDF rendering for PDF files
- Image preview for images (JPG, PNG)
- Page navigation for multi-page documents
- Zoom controls (50%, 75%, 100%, 125%, 150%, Fit)
- Rotation controls for images
- Thumbnails sidebar (optional, toggleable)
- Download original file button
- Print functionality

**Component Props:**
- `documentId: string`
- `documentUrl: string`
- `documentType: string`
- `fileName: string`
- `metadata: object`
- `onClose: () => void`

---

### 2.4 File Upload Modal

**Purpose:** Upload single or multiple files with categorization

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│ Upload Documents                                     [×]│
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Document Type: [Identification ▼]                     │
│  Category: [Passport ▼]                                │
│                                                         │
│  ┌───────────────────────────────────────────────┐     │
│  │                                               │     │
│  │    Drag and drop files here                   │     │
│  │    or click to browse                         │     │
│  │                                               │     │
│  │    [📁 Browse Files]                          │     │
│  │                                               │     │
│  │    Supported: PDF, JPG, PNG, DOCX            │     │
│  │    Max size: 10 MB per file                  │     │
│  └───────────────────────────────────────────────┘     │
│                                                         │
│  Uploaded Files:                                        │
│  ┌─────────────────────────────────────────────────┐   │
│  │ [📄] passport_john.pdf        2.4 MB  [×]      │   │
│  │      ████████████░░░░ 75%                      │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │ [✓] id_card_front.jpg         1.2 MB  [×]      │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Notes (optional):                                      │
│  [_____________________________________________]         │
│                                                         │
│                          [Cancel] [Upload All]          │
└─────────────────────────────────────────────────────────┘
```

**Features:**
- Drag-and-drop zone
- Click to browse
- Multiple file selection
- Per-file progress bars
- File validation (type, size)
- Preview thumbnails
- Remove files before upload
- Bulk categorization
- Individual file notes
- Auto-categorization suggestions based on filename/OCR

**Component Props:**
- `matterId?: string`
- `clientId?: string`
- `allowMultiple: boolean`
- `acceptedTypes: string[]`
- `maxSize: number` (in MB)
- `categories: string[]`
- `onUploadComplete: (files: File[]) => void`
- `onClose: () => void`

---

### 2.5 Quick Add Modals

**Purpose:** Rapidly add small items without full form

**Quick Add Contact:**
```
┌──────────────────────────────────────┐
│ Add Contact                       [×]│
├──────────────────────────────────────┤
│                                      │
│  Name: [____________________]        │
│                                      │
│  Type: (•) Phone  ( ) Email          │
│                                      │
│  Value: [+592-___-____]              │
│                                      │
│  Label: [Mobile ▼]                   │
│         (Mobile/Work/Home/Other)     │
│                                      │
│  [ ] Preferred contact method        │
│                                      │
│               [Cancel] [Add Contact] │
└──────────────────────────────────────┘
```

**Quick Add Note:**
```
┌────────────────────────────────────────┐
│ Add Note                            [×]│
├────────────────────────────────────────┤
│                                        │
│  Type: [General Note ▼]                │
│        (Meeting, Call, Email, etc.)    │
│                                        │
│  Note:                                 │
│  ┌────────────────────────────────┐   │
│  │                                │   │
│  │                                │   │
│  │                                │   │
│  └────────────────────────────────┘   │
│                                        │
│  [ ] Mark as important                 │
│  [ ] Set reminder                      │
│                                        │
│                  [Cancel] [Save Note]  │
└────────────────────────────────────────┘
```

**Quick Add Task:**
- Task description
- Due date picker
- Assign to (staff dropdown)
- Priority (Low/Medium/High)
- Linked to (matter/client selector)

---

## 3. Dropdown Components

### 3.1 Business Selector

**Purpose:** Toggle between GCMC and KAJ businesses

**Layout:**
```
┌─────────────────────────────────┐
│ [GCMC Icon] GCMC              ▼ │
└─────────────────────────────────┘
     ↓ (when clicked)
┌─────────────────────────────────┐
│ [✓] [GCMC Icon] GCMC            │
│     Guyanese Consultancy &      │
│     Management Co.              │
├─────────────────────────────────┤
│ [ ] [KAJ Icon] KAJ & Associates │
│     Legal Services              │
└─────────────────────────────────┘
```

**Features:**
- Persistent selection (stored in user preferences)
- Affects entire app context
- Shows business logo/icon
- Displays full business name on hover
- Keyboard navigation support
- Updates dashboard, reports, client lists accordingly

**Component Props:**
- `currentBusiness: "GCMC" | "KAJ"`
- `onChange: (business: string) => void`
- `businesses: Array<{id, name, fullName, icon}>`

---

### 3.2 Status Dropdowns

**Purpose:** Display and change status with color coding

**Matter Status Dropdown:**
```
┌──────────────────────────┐
│ [🟡] In Progress       ▼ │
└──────────────────────────┘
     ↓
┌──────────────────────────┐
│ [🟢] Not Started         │
│ [🟡] In Progress     [✓] │
│ [🔵] Under Review        │
│ [🟣] Awaiting Client     │
│ [🟠] On Hold             │
│ [✅] Completed           │
│ [⛔] Cancelled           │
└──────────────────────────┘
```

**Color Scheme:**
- Not Started: Gray (🟢)
- In Progress: Yellow (🟡)
- Under Review: Blue (🔵)
- Awaiting Client: Purple (🟣)
- On Hold: Orange (🟠)
- Completed: Green (✅)
- Cancelled: Red (⛔)

**Client Status:**
- Active: Green
- Inactive: Gray
- Prospective: Blue
- Former: Orange

**Invoice Status:**
- Draft: Gray
- Sent: Blue
- Partially Paid: Yellow
- Paid: Green
- Overdue: Red
- Cancelled: Dark Gray

**Features:**
- Color indicator dot/badge
- Status change confirmation for important transitions
- Status history tooltip (hover to see recent changes)
- Disabled states based on permissions
- Audit log entry on change

**Component Props:**
- `type: "matter" | "client" | "invoice" | "deadline"`
- `currentStatus: string`
- `allowedTransitions: string[]` (only show valid next states)
- `onChange: (newStatus: string) => void`
- `requireConfirmation: boolean`
- `showHistory: boolean`

---

### 3.3 Service Type Hierarchical Dropdown

**Purpose:** Select service with category hierarchy

**Layout:**
```
┌─────────────────────────────────────────┐
│ Select Service Type                   ▼ │
└─────────────────────────────────────────┘
     ↓
┌─────────────────────────────────────────┐
│ 🔍 Search services...                   │
├─────────────────────────────────────────┤
│ ▶ Immigration Services                  │
│ ▶ Corporate Services                    │
│ ▼ Tax Services                          │
│   ├─ Individual Tax Return              │
│   ├─ Corporation Tax Return             │
│   ├─ VAT Registration                   │
│   ├─ Tax Planning                       │
│   └─ Tax Dispute Resolution             │
│ ▶ Real Estate                           │
│ ▶ Litigation                            │
│ ▶ Other Services                        │
└─────────────────────────────────────────┘
```

**Service Categories & Types:**

1. **Immigration Services**
   - Work Permit Application
   - Work Permit Renewal
   - Permanent Residence
   - Citizenship Application
   - Visa Consultation

2. **Corporate Services**
   - Company Incorporation
   - Company Name Reservation
   - Annual Returns Filing
   - Registered Agent Services
   - Corporate Restructuring
   - Dissolution/Strike Off

3. **Tax Services**
   - Individual Tax Return
   - Corporation Tax Return
   - VAT Registration
   - VAT Returns
   - Tax Planning & Advisory
   - Tax Dispute Resolution
   - PAYE Compliance

4. **Real Estate**
   - Property Purchase
   - Property Sale
   - Title Search
   - Property Transfer
   - Lease Agreement
   - Mortgage Documentation

5. **Litigation**
   - Civil Litigation
   - Commercial Disputes
   - Employment Disputes
   - Debt Recovery

6. **Notarial Services**
   - Document Notarization
   - Affidavits
   - Certified Copies
   - Statutory Declarations

7. **Other Services**
   - General Legal Consultation
   - Document Review
   - Contract Drafting
   - Compliance Advisory

**Features:**
- Expandable/collapsible categories
- Search/filter functionality
- Recently used services at top
- Keyboard navigation
- Popular services quick access
- Multi-select option for complex matters

**Component Props:**
- `value: string | string[]`
- `onChange: (value: string | string[]) => void`
- `multiSelect: boolean`
- `showRecent: boolean`
- `placeholder: string`

---

### 3.4 Staff Assignment Dropdown

**Purpose:** Assign matters/tasks to staff members

**Layout:**
```
┌──────────────────────────────────────┐
│ [AV] Assigned to...                ▼ │
└──────────────────────────────────────┘
     ↓
┌──────────────────────────────────────┐
│ 🔍 Search staff...                   │
├──────────────────────────────────────┤
│ Lawyers                              │
│ ├─ [KM] Kareem Mohammed          [✓]│
│ │       2 active matters              │
│ └─ [JD] Jane Doe                     │
│         5 active matters              │
├──────────────────────────────────────┤
│ Paralegals                           │
│ ├─ [AS] Alice Smith                  │
│ │       8 active tasks                │
│ └─ [BC] Bob Chen                     │
│         3 active tasks                │
├──────────────────────────────────────┤
│ Administrators                       │
│ └─ [MJ] Mary Johnson                 │
│         1 active task                 │
└──────────────────────────────────────┘
```

**Features:**
- Avatar initials or photo
- Grouped by role
- Current workload indicator
- Online status indicator (if real-time)
- Search by name
- Filter by availability
- Multi-assign capability
- Unassigned option at top

**Component Props:**
- `selectedStaffId: string | string[]`
- `onChange: (staffId: string | string[]) => void`
- `filterByRole: string[]`
- `showWorkload: boolean`
- `multiSelect: boolean`
- `excludeStaff: string[]` (e.g., exclude already assigned)

---

### 3.5 Date Range Presets Dropdown

**Purpose:** Quick date range selection with custom option

**Layout:**
```
┌─────────────────────────────────┐
│ 📅 Last 30 Days               ▼ │
└─────────────────────────────────┘
     ↓
┌─────────────────────────────────┐
│ [✓] Last 30 Days                │
│ [ ] Last 7 Days                 │
│ [ ] Last 90 Days                │
│ [ ] This Month                  │
│ [ ] Last Month                  │
│ [ ] This Quarter                │
│ [ ] Last Quarter                │
│ [ ] This Year                   │
│ [ ] Last Year                   │
│ [ ] All Time                    │
├─────────────────────────────────┤
│ [📅] Custom Range...            │
└─────────────────────────────────┘
```

**Custom Range Picker:**
```
┌──────────────────────────────────────┐
│ Custom Date Range                    │
├──────────────────────────────────────┤
│ From: [10/11/2025 📅]                │
│ To:   [10/12/2025 📅]                │
│                                      │
│              [Cancel] [Apply]        │
└──────────────────────────────────────┘
```

**Features:**
- Common presets
- Custom range option opens date picker
- Displays selected range in button
- Fiscal year options (if applicable)
- Relative dates (e.g., "Next 30 days")

**Component Props:**
- `value: {start: Date, end: Date}`
- `onChange: (range: {start: Date, end: Date}) => void`
- `presets: string[]` (customizable preset list)
- `maxRange: number` (max days between dates)
- `allowFuture: boolean`

---

## 4. Form Components

### 4.1 GYD Currency Input

**Purpose:** Formatted currency input for Guyanese Dollars

**Appearance:**
```
┌───────────────────────────────┐
│ Amount (GYD)                  │
│ ┌───────────────────────────┐ │
│ │ GYD $ 1,234,567.89       │ │
│ └───────────────────────────┘ │
└───────────────────────────────┘
```

**Features:**
- Auto-formatting with thousand separators
- Two decimal places
- Currency symbol prefix (GYD $)
- Remove non-numeric input
- Copy-paste handling (strips formatting)
- Right-aligned text
- Validation: min/max values
- Optional: Show amount in words below (e.g., "One million, two hundred...")

**Component Props:**
- `value: number`
- `onChange: (value: number) => void`
- `min: number`
- `max: number`
- `required: boolean`
- `disabled: boolean`
- `showWordsRepresentation: boolean`

---

### 4.2 Phone Input

**Purpose:** Formatted phone input with Guyana country code

**Appearance:**
```
┌───────────────────────────────┐
│ Phone Number                  │
│ ┌───────────────────────────┐ │
│ │ +592 222-3333            │ │
│ └───────────────────────────┘ │
│ Mobile                        │
└───────────────────────────────┘
```

**Features:**
- Default country code: +592
- Auto-formatting: +592 XXX-XXXX
- Country selector for international numbers
- Validation: 7 digits after country code for Guyana
- Format as you type
- Click to call integration (if applicable)
- Type indicator (Mobile/Work/Home)

**Component Props:**
- `value: string`
- `onChange: (value: string) => void`
- `defaultCountry: string` (default: "GY")
- `allowInternational: boolean`
- `type: "mobile" | "work" | "home"`
- `required: boolean`

---

### 4.3 TIN Input

**Purpose:** Tax Identification Number with validation

**Appearance:**
```
┌───────────────────────────────┐
│ TIN (Tax ID Number)           │
│ ┌───────────────────────────┐ │
│ │ ___________              │ │
│ └───────────────────────────┘ │
│ Format: XXXXXXXXX             │
└───────────────────────────────┘
```

**Features:**
- Format validation based on Guyana TIN structure
- Real-time validation feedback
- Check digit verification (if applicable)
- Lookup existing TIN in system (duplicate check)
- Format helper text
- Copy button for verified TIN

**Component Props:**
- `value: string`
- `onChange: (value: string) => void`
- `checkDuplicate: boolean`
- `required: boolean`
- `validateFormat: boolean`

---

### 4.4 NIS Number Input

**Purpose:** National Insurance Scheme number input

**Appearance:**
```
┌───────────────────────────────┐
│ NIS Number                    │
│ ┌───────────────────────────┐ │
│ │ ___________              │ │
│ └───────────────────────────┘ │
│ Format: XXXXXXXXX             │
└───────────────────────────────┘
```

**Features:**
- Format validation
- Numeric only
- Length validation
- Optional verification against registry (if API available)
- Duplicate check in system

**Component Props:**
- Similar to TIN input

---

### 4.5 Passport Number Input

**Purpose:** Passport number with country-specific validation

**Appearance:**
```
┌─────────────────────────────────────┐
│ Passport Number                     │
│ ┌─────────────────────────────────┐ │
│ │ G1234567                        │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Issuing Country: [Guyana        ▼] │
│                                     │
│ Issue Date:   [10/01/2020 📅]      │
│ Expiry Date:  [10/01/2030 📅]      │
│ ✓ Valid for 5 years, 1 month       │
└─────────────────────────────────────┘
```

**Features:**
- Alphanumeric input
- Country-specific format validation
- Issue and expiry date pickers
- Auto-calculate validity period
- Warning if expiring within 6 months
- Error if expired

**Component Props:**
- `value: string`
- `onChange: (value: string) => void`
- `country: string`
- `issueDate: Date`
- `expiryDate: Date`
- `warnExpiryDays: number` (default: 180)

---

### 4.6 Date Picker

**Purpose:** Guyana-formatted date selection

**Appearance:**
```
┌───────────────────────────────┐
│ Date of Birth                 │
│ ┌───────────────────────────┐ │
│ │ 15/03/1985          [📅] │ │
│ └───────────────────────────┘ │
└───────────────────────────────┘
     ↓ (when calendar clicked)
┌─────────────────────────────────┐
│    ◄  December 2025  ►         │
├─────────────────────────────────┤
│ Mo Tu We Th Fr Sa Su           │
│  1  2  3  4  5  6  7           │
│  8  9 10 [11] 12 13 14         │
│ 15 16 17 18 19 20 21           │
│ 22 23 24 25 26 27 28           │
│ 29 30 31                       │
├─────────────────────────────────┤
│ [Today] [Clear]                 │
└─────────────────────────────────┘
```

**Features:**
- Format: DD/MM/YYYY (Guyana standard)
- Calendar popup
- Month/year quick selection
- Keyboard navigation (arrow keys, enter)
- Today button
- Clear button
- Min/max date validation
- Disable specific dates or date ranges
- Highlight special dates (holidays, deadlines)

**Component Props:**
- `value: Date`
- `onChange: (date: Date) => void`
- `format: string` (default: "DD/MM/YYYY")
- `minDate: Date`
- `maxDate: Date`
- `disabledDates: Date[]`
- `highlightDates: Date[]`
- `showToday: boolean`

---

### 4.7 File Upload with Preview

**Purpose:** Single file upload with preview

**Appearance:**
```
┌──────────────────────────────────────┐
│ Upload Passport Copy                 │
│                                      │
│ ┌──────────────────────────────┐    │
│ │  Drag file here or           │    │
│ │  [Browse Files]              │    │
│ │                              │    │
│ │  PDF, JPG, PNG (Max 10MB)    │    │
│ └──────────────────────────────┘    │
│                                      │
│ OR                                   │
│                                      │
│ [📷 Take Photo]                      │
└──────────────────────────────────────┘

After upload:
┌──────────────────────────────────────┐
│ Upload Passport Copy                 │
│                                      │
│ ┌──────────────────────────────┐    │
│ │                              │    │
│ │   [Document Preview]         │    │
│ │   passport_john.pdf          │    │
│ │   2.4 MB • Uploaded          │    │
│ │                              │    │
│ │   [Replace] [Remove]         │    │
│ └──────────────────────────────┘    │
└──────────────────────────────────────┘
```

**Features:**
- Drag and drop
- Browse files
- Camera capture (mobile)
- Image preview
- PDF thumbnail
- Progress bar during upload
- Replace/remove options
- File size validation
- File type validation
- Image optimization/compression option

**Component Props:**
- `value: File | null`
- `onChange: (file: File | null) => void`
- `acceptedTypes: string[]`
- `maxSize: number`
- `showPreview: boolean`
- `allowCamera: boolean`
- `compressImages: boolean`

---

### 4.8 Rich Text Editor for Notes

**Purpose:** Formatted text input for notes and descriptions

**Appearance:**
```
┌────────────────────────────────────────────┐
│ Notes                                      │
│ ┌────────────────────────────────────────┐ │
│ │ [B][I][U] [•][1.] [Link] [Clear]      │ │
│ ├────────────────────────────────────────┤ │
│ │                                        │ │
│ │ Client called regarding work permit.   │ │
│ │                                        │ │
│ │ Key points:                            │ │
│ │ • Employer information needed          │ │
│ │ • Passport expires in 8 months         │ │
│ │                                        │ │
│ │ Follow-up scheduled for next week.     │ │
│ │                                        │ │
│ └────────────────────────────────────────┘ │
│ 0/5000 characters                          │
└────────────────────────────────────────────┘
```

**Features:**
- Basic formatting: Bold, Italic, Underline
- Lists: Bulleted, Numbered
- Links
- Undo/Redo
- Character counter
- Auto-save draft (for long notes)
- Mention staff (@username)
- Timestamp insertion
- Templates for common notes

**Component Props:**
- `value: string` (HTML or Markdown)
- `onChange: (value: string) => void`
- `maxLength: number`
- `placeholder: string`
- `showCharCount: boolean`
- `allowMentions: boolean`
- `templates: Array<{name, content}>`

---

### 4.9 Signature Capture

**Purpose:** Digital signature input

**Appearance:**
```
┌────────────────────────────────────────┐
│ Client Signature                       │
│ ┌────────────────────────────────────┐ │
│ │                                    │ │
│ │                                    │ │
│ │   [Signature drawn here]           │ │
│ │                                    │ │
│ │                                    │ │
│ └────────────────────────────────────┘ │
│ [Clear] [Upload Image]                 │
│                                        │
│ Date: 11/12/2025 15:45                │
│ IP: 192.168.1.100                     │
└────────────────────────────────────────┘
```

**Features:**
- Canvas for drawing signature
- Touch/stylus support
- Mouse signature support
- Clear button
- Upload signature image option
- Auto-timestamp
- IP address logging
- Signature preview
- Save as image (PNG)
- Signature verification status

**Component Props:**
- `value: string` (base64 image)
- `onChange: (signature: string) => void`
- `width: number`
- `height: number`
- `penColor: string`
- `backgroundColor: string`
- `required: boolean`

---

## 5. Data Tables

### 5.1 Standard Data Table

**Purpose:** Display and manipulate tabular data

**Appearance:**
```
┌──────────────────────────────────────────────────────────────────────┐
│ Clients                                  [🔍 Search] [+ New Client]  │
├──────────────────────────────────────────────────────────────────────┤
│ [Filters ▼] [Columns ▼] [Export ▼]         Showing 1-25 of 127     │
├──┬──────────────────┬───────────┬──────────────┬──────────┬─────────┤
│□ │ Name          ▲  │ Type      │ Status       │ Matters  │ Actions │
├──┼──────────────────┼───────────┼──────────────┼──────────┼─────────┤
│□ │ John Smith       │ Individual│ [🟢] Active  │ 3        │ [⋯]     │
│□ │ ABC Corp Ltd.    │ Business  │ [🟢] Active  │ 7        │ [⋯]     │
│□ │ Jane Doe         │ Individual│ [🟡] Prospec │ 1        │ [⋯]     │
│□ │ XYZ Holdings     │ Business  │ [🟢] Active  │ 12       │ [⋯]     │
│□ │ Bob Johnson      │ Individual│ [⚪] Inactive│ 0        │ [⋯]     │
├──┴──────────────────┴───────────┴──────────────┴──────────┴─────────┤
│ 5 selected   [Archive Selected] [Delete Selected]                   │
│                                      ◄ 1 2 3 4 5 6 ►  [25 per page▼]│
└──────────────────────────────────────────────────────────────────────┘
```

**Features:**

**Sorting:**
- Click column header to sort
- Visual indicator (▲/▼) for sort direction
- Multi-column sorting (Shift+Click)

**Filtering:**
- Global search across all columns
- Per-column filters (dropdown panel)
- Date range filters
- Status filters with checkboxes
- Number range filters
- Clear all filters button

**Column Management:**
- Show/hide columns (column selector dropdown)
- Reorder columns (drag-and-drop)
- Resize columns (drag column border)
- Save column preferences per user

**Bulk Actions:**
- Select all checkbox in header
- Select individual rows
- Select range (Shift+Click)
- Bulk action buttons appear when rows selected
- Common actions: Delete, Archive, Export, Assign

**Row Actions:**
- Three-dot menu per row
- Quick actions: View, Edit, Delete
- Contextual actions based on row status

**Pagination:**
- Configurable page size (10, 25, 50, 100)
- Page number navigation
- First/Last page buttons
- Total count display

**Export:**
- CSV export
- Excel export (XLSX)
- PDF export (formatted table)
- Export selected rows or all data
- Export with current filters applied

**Row Expansion:**
- Expandable rows for additional details
- Click row or expand icon
- Show related records without navigation

**Responsive:**
- Mobile: Card view instead of table
- Tablet: Horizontal scroll with fixed columns

**Component Props:**
- `data: Array<T>`
- `columns: ColumnDef[]`
- `onSort: (column, direction) => void`
- `onFilter: (filters) => void`
- `onPageChange: (page, pageSize) => void`
- `onSelect: (selectedRows) => void`
- `bulkActions: Action[]`
- `rowActions: Action[]`
- `expandable: boolean`
- `exportEnabled: boolean`

---

### 5.2 Example Tables

**Clients Table Columns:**
1. Checkbox (select)
2. Name (sortable, searchable)
3. Type (filterable: Individual/Business)
4. Contact (email, phone)
5. Status (filterable, colored badge)
6. Active Matters (count, clickable)
7. Last Contact (date, sortable)
8. Assigned To (staff, filterable)
9. Actions (menu)

**Matters Table Columns:**
1. Checkbox
2. Matter ID (searchable)
3. Client Name (sortable, searchable, linked)
4. Service Type (filterable)
5. Status (filterable, colored badge)
6. Assigned To (staff, filterable)
7. Deadline (date, sortable, color-coded by urgency)
8. Progress (progress bar)
9. Last Updated (date, sortable)
10. Actions

**Documents Table Columns:**
1. Checkbox
2. Document Name (searchable, with icon)
3. Type/Category (filterable)
4. Related To (client/matter link)
5. Uploaded By (staff)
6. Upload Date (sortable)
7. File Size
8. Actions (View, Download, Delete)

**Deadlines Table Columns:**
1. Checkbox
2. Description (searchable)
3. Related To (matter link)
4. Client (searchable)
5. Due Date (sortable, color-coded)
6. Days Remaining (calculated, sortable)
7. Assigned To (filterable)
8. Status (Not Started, In Progress, Complete)
9. Actions

---

## 6. Cards & Tiles

### 6.1 Client Summary Card

**Purpose:** Display client overview on dashboard

**Appearance:**
```
┌──────────────────────────────────────┐
│ [Avatar] John Smith              [⋯] │
│          Individual Client           │
│          Since: 15/03/2024          │
├──────────────────────────────────────┤
│ 📞 +592-222-3333                    │
│ ✉️  john.smith@email.com            │
│ 📍 Georgetown                       │
├──────────────────────────────────────┤
│ Active Matters: 3                    │
│ Next Deadline: 2 days                │
│ Last Contact: 5 days ago             │
├──────────────────────────────────────┤
│ [View Profile] [New Matter]          │
└──────────────────────────────────────┘
```

**Features:**
- Client avatar or initials
- Key contact info
- Quick stats
- Action buttons
- Status indicator (active/inactive)
- Hover: Quick view tooltip

---

### 6.2 Matter Status Card

**Purpose:** Display matter overview

**Appearance:**
```
┌──────────────────────────────────────┐
│ [🟡] Work Permit Application     [⋯] │
│                                      │
│ Client: John Smith                   │
│ Assigned: Kareem Mohammed            │
│                                      │
│ Progress: ▓▓▓▓▓▓░░░░ 60%            │
│                                      │
│ ⏰ Deadline: 13/12/2025 (2 days)    │
│ 📎 Documents: 5/8 uploaded          │
│                                      │
│ [Update Status] [View Details]       │
└──────────────────────────────────────┘
```

**Features:**
- Status color indicator
- Progress bar
- Key metrics
- Urgency indicator for deadline
- Quick actions
- Click card to view full details

---

### 6.3 Deadline Card

**Purpose:** Display upcoming deadline with urgency

**Appearance:**
```
┌──────────────────────────────────────┐
│ [🔴] URGENT - 2 days remaining       │
├──────────────────────────────────────┤
│ Submit Work Permit Documents         │
│                                      │
│ Matter: Work Permit - John Smith     │
│ Due: 13/12/2025 17:00               │
│                                      │
│ [✓] Passport copy uploaded          │
│ [✓] Application form completed      │
│ [⏳] Police clearance pending       │
│                                      │
│ [Mark Complete] [View Matter]        │
└──────────────────────────────────────┘
```

**Urgency Color Coding:**
- Red (🔴): Due within 2 days or overdue
- Yellow (🟡): Due within 7 days
- Green (🟢): Due within 30 days
- Gray (⚪): Due after 30 days

**Features:**
- Countdown timer
- Checklist of requirements
- Quick complete action
- Link to related matter
- Snooze/postpone option

---

### 6.4 Document Card

**Purpose:** Display document in grid view

**Appearance:**
```
┌──────────────────────────┐
│      ┌──────────┐         │
│      │   PDF    │         │
│      │   ICON   │         │
│      └──────────┘         │
│                          │
│ passport_john.pdf        │
│ 2.4 MB                   │
│                          │
│ Uploaded: 10/12/2025     │
│ By: Kareem Mohammed      │
│                          │
│ [View] [Download]    [⋯] │
└──────────────────────────┘
```

**Features:**
- Icon by file type (PDF, Word, Image, etc.)
- Thumbnail preview for images
- Metadata display
- Quick actions
- Context menu for more options
- Visual indication if document needs review

**Document Type Icons:**
- PDF: Red PDF icon
- Word: Blue document icon
- Excel: Green spreadsheet icon
- Image: Photo icon with thumbnail
- Unknown: Generic file icon

---

### 6.5 Stats Card

**Purpose:** Display KPI with trend

**Appearance:**
```
┌──────────────────────────────────┐
│ Active Matters                   │
│                                  │
│     47                           │
│     ↑ 12% from last month        │
│                                  │
│ ▂▃▅▄▆▇█ (sparkline chart)        │
└──────────────────────────────────┘
```

**Variants:**
- Active Matters (count with trend)
- Total Revenue (GYD with trend)
- Client Count (count with trend)
- Deadline Compliance (percentage with trend)
- Response Time (hours/days with trend)

**Features:**
- Large number display
- Trend indicator (up/down arrow with %)
- Trend color (green for good, red for bad)
- Mini sparkline chart
- Click to drill down

---

## 7. Timeline Components

### 7.1 Activity Timeline

**Purpose:** Display chronological activity log

**Appearance:**
```
┌────────────────────────────────────────────────┐
│ Activity Log                        [Filter ▼] │
├────────────────────────────────────────────────┤
│                                                │
│ ● Document uploaded                           │
│ │ passport_john.pdf                           │
│ │ By: Kareem Mohammed                         │
│ │ 10/12/2025 14:30                           │
│ │                                             │
│ ● Status changed                              │
│ │ In Progress → Under Review                  │
│ │ By: Jane Doe                                │
│ │ 09/12/2025 09:15                           │
│ │                                             │
│ ● Email sent                                  │
│ │ Subject: Document Request                   │
│ │ To: john.smith@email.com                   │
│ │ By: Kareem Mohammed                         │
│ │ 08/12/2025 16:45                           │
│ │                                             │
│ ● Matter created                              │
│ │ Work Permit Application                     │
│ │ By: Kareem Mohammed                         │
│ │ 05/12/2025 10:00                           │
│                                                │
└────────────────────────────────────────────────┘
```

**Activity Types & Icons:**
- Matter created: ●
- Status changed: ◆
- Document uploaded: 📎
- Email sent: ✉️
- Meeting scheduled: 📅
- Note added: 📝
- Task completed: ✓
- Payment received: 💰
- Deadline updated: ⏰
- Comment added: 💬

**Features:**
- Chronological order (newest first)
- Filter by activity type
- Filter by user
- Filter by date range
- Expandable entries for full details
- Infinite scroll or pagination
- Real-time updates (for current activities)

---

### 7.2 Communication History Timeline

**Purpose:** Track all communications with client

**Appearance:**
```
┌────────────────────────────────────────────────┐
│ Communications                  [+ New Message] │
├────────────────────────────────────────────────┤
│                                                │
│ ✉️ Email - Document Request                   │
│ │ To: john.smith@email.com                    │
│ │ From: info@gcmc.gy                          │
│ │ Re: Work Permit Documents Needed            │
│ │ 10/12/2025 14:30                           │
│ │ [View Email]                                │
│ │                                             │
│ 📞 Phone Call - Follow-up                     │
│ │ Outbound call to +592-222-3333              │
│ │ Duration: 8 minutes                         │
│ │ Notes: Discussed timeline, client will      │
│ │ submit documents by Friday                  │
│ │ By: Kareem Mohammed                         │
│ │ 08/12/2025 11:20                           │
│ │                                             │
│ 💬 WhatsApp - Quick Update                    │
│ │ From: +592-222-3333                         │
│ │ "Documents ready, will drop off tomorrow"   │
│ │ 07/12/2025 18:45                           │
│ │                                             │
│ ✉️ Email - Initial Consultation              │
│ │ From: john.smith@email.com                  │
│ │ Re: Work Permit Inquiry                     │
│ │ 05/12/2025 09:30                           │
│ │ [View Email]                                │
│                                                │
└────────────────────────────────────────────────┘
```

**Communication Types:**
- Email (sent/received)
- Phone call (inbound/outbound)
- Meeting (in-person/virtual)
- WhatsApp message
- SMS
- Postal mail
- Portal message

**Features:**
- Filter by communication type
- Search communications
- View full message/call details
- Quick reply to emails
- Log new communication
- Attachments display
- Mark as important

---

### 7.3 Matter Progress Timeline

**Purpose:** Visual representation of matter stages

**Appearance:**
```
┌────────────────────────────────────────────────┐
│ Matter Progress                                │
├────────────────────────────────────────────────┤
│                                                │
│ [✓]─────[✓]─────[●]─────[ ]─────[ ]─────[ ]  │
│  │       │       │       │       │       │    │
│ Opened  Docs   Review  Submit  Approve Close  │
│ 05/12   10/12  11/12   13/12   20/12   27/12 │
│  ✓       ✓      ⏳      -       -       -    │
│                                                │
│ Current Stage: Under Review                    │
│ Started: 11/12/2025                           │
│ Expected completion: 15/12/2025                │
│                                                │
│ Stage Tasks:                                   │
│ [✓] Verify all documents                      │
│ [⏳] Prepare submission package               │
│ [ ] Quality check                             │
│                                                │
└────────────────────────────────────────────────┘
```

**Features:**
- Visual progress line
- Stage checkpoints
- Current stage highlight
- Completed stages marked
- Expected dates for each stage
- Stage-specific tasks
- Delays/blockers indicated
- Click stage to see details

**Common Matter Stages:**

**Work Permit:**
1. Matter Opened
2. Documents Collection
3. Application Preparation
4. Client Review
5. Submission to Immigration
6. Processing
7. Approval/Collection
8. Matter Closed

**Company Incorporation:**
1. Name Reservation
2. Document Preparation
3. Client Signatures
4. Submission to Registry
5. Registry Processing
6. Certificate Issued
7. Post-incorporation
8. Matter Closed

**Property Transfer:**
1. Title Search
2. Document Review
3. Draft Transfer Deed
4. Client Approval
5. Execution
6. Submission to Registry
7. Registration Complete
8. Matter Closed

---

### 7.4 Deadline Timeline

**Purpose:** Upcoming deadlines in chronological view

**Appearance:**
```
┌────────────────────────────────────────────────┐
│ Upcoming Deadlines                  [This Week▼]│
├────────────────────────────────────────────────┤
│                                                │
│ TODAY - 11/12/2025                            │
│ ├─ [🔴] 17:00 - Submit VAT Return             │
│ │              ABC Corp Ltd.                   │
│ │              [Mark Complete]                 │
│ │                                             │
│ TOMORROW - 12/12/2025                         │
│ ├─ [🔴] 09:00 - Court Hearing                 │
│ │              Smith vs Jones                  │
│ │              [View Details]                  │
│ │                                             │
│ ├─ [🟡] 16:00 - Client Meeting                │
│ │              XYZ Holdings Inc.               │
│ │              [Reschedule]                    │
│ │                                             │
│ FRIDAY - 13/12/2025                           │
│ ├─ [🟡] EOD - Work Permit Docs Due            │
│ │            John Smith                        │
│ │            [Upload Documents]                │
│ │                                             │
│ NEXT WEEK                                     │
│ ├─ [🟢] 16/12 - Annual Return Filing          │
│ │            ABC Corp Ltd.                     │
│ │                                             │
│ └─ [🟢] 18/12 - Tax Payment Deadline          │
│              Multiple Clients (5)              │
│                                                │
└────────────────────────────────────────────────┘
```

**Features:**
- Grouped by date
- Color-coded by urgency
- Quick actions per deadline
- Count of items per day
- Filter by: date range, matter type, client, staff
- Click to expand full details
- Drag to reschedule (if applicable)

---

## 8. Calendar Views

### 8.1 Month View

**Purpose:** Overview of deadlines and events for the month

**Appearance:**
```
┌──────────────────────────────────────────────────────────────┐
│        ◄  December 2025  ►              [Month▼] [+ Event]   │
├──────────────────────────────────────────────────────────────┤
│ Mon   Tue   Wed   Thu   Fri   Sat   Sun                      │
├───────┬───────┬───────┬───────┬───────┬───────┬──────────────┤
│  1    │  2    │  3    │  4    │  5  🔴│  6    │  7           │
│       │       │       │       │ 2 due │       │              │
├───────┼───────┼───────┼───────┼───────┼───────┼──────────────┤
│  8    │  9    │ 10    │ 11 🟡 │ 12 🔴 │ 13    │ 14           │
│       │       │       │ Today │ 3 due │       │              │
│       │       │       │ 1 due │       │       │              │
├───────┼───────┼───────┼───────┼───────┼───────┼──────────────┤
│ 15    │ 16    │ 17    │ 18 🟢 │ 19    │ 20    │ 21           │
│       │       │       │ 1 due │       │       │              │
├───────┼───────┼───────┼───────┼───────┼───────┼──────────────┤
│ 22    │ 23    │ 24    │ 25    │ 26    │ 27    │ 28           │
│       │       │       │ CLOSED│       │       │              │
├───────┼───────┼───────┼───────┼───────┼───────┼──────────────┤
│ 29    │ 30    │ 31    │       │       │       │              │
│       │       │       │       │       │       │              │
└───────┴───────┴───────┴───────┴───────┴───────┴──────────────┘
```

**Features:**
- Color-coded deadline indicators
- Number of items per day
- Click date to see list of items
- Today highlighted
- Holidays/office closures marked
- Navigate months with arrows
- Quick jump to month/year
- Print calendar view

---

### 8.2 Week View

**Purpose:** Detailed view of week with time slots

**Appearance:**
```
┌──────────────────────────────────────────────────────────────────┐
│   Week of 08 - 14 December 2025      [Week▼] [Today] [+ Event]  │
├──────┬─────────┬─────────┬─────────┬─────────┬─────────┬────────┤
│ Time │ Mon 8   │ Tue 9   │ Wed 10  │ Thu 11  │ Fri 12  │ Sat 13 │
├──────┼─────────┼─────────┼─────────┼─────────┼─────────┼────────┤
│ 09:00│         │         │         │         │ [Court] │        │
│ 10:00│         │         │         │         │ Hearing │        │
├──────┼─────────┼─────────┼─────────┼─────────┼─────────┼────────┤
│ 11:00│         │         │         │ [Today] │         │        │
│ 12:00│         │         │         │         │         │        │
├──────┼─────────┼─────────┼─────────┼─────────┼─────────┼────────┤
│ 13:00│         │         │         │         │         │        │
│ 14:00│ [Client │         │         │         │         │        │
│ 15:00│ Meeting]│         │         │         │         │        │
├──────┼─────────┼─────────┼─────────┼─────────┼─────────┼────────┤
│ 16:00│         │         │         │         │ [Client │        │
│ 17:00│         │         │         │ [VAT    │ Meeting]│ [Docs  │
│      │         │         │         │ Return] │         │ Due]   │
└──────┴─────────┴─────────┴─────────┴─────────┴─────────┴────────┘
```

**Features:**
- Time slots (configurable: 30 min / 1 hour)
- Drag-and-drop to reschedule
- Color-coded by type
- Click event to view details
- Double-click to create event
- Week navigation arrows
- Business hours highlight
- All-day events row at top

---

### 8.3 Day Agenda View

**Purpose:** Detailed list of today's schedule

**Appearance:**
```
┌────────────────────────────────────────────────────────────┐
│ Today - Thursday, 11 December 2025        [Day▼] [◄] [►]   │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ 09:00 - 10:00                                             │
│ ┌────────────────────────────────────────────────────┐    │
│ │ [🔵] Client Consultation - Initial                 │    │
│ │ John Smith - Work Permit Inquiry                   │    │
│ │ Location: Office                                   │    │
│ │ [Join] [Reschedule] [Complete]                     │    │
│ └────────────────────────────────────────────────────┘    │
│                                                            │
│ 11:00 - 11:30                                             │
│ ┌────────────────────────────────────────────────────┐    │
│ │ [🟡] Team Meeting                                  │    │
│ │ Weekly case review                                 │    │
│ │ Location: Conference Room                          │    │
│ └────────────────────────────────────────────────────┘    │
│                                                            │
│ 14:00                                                     │
│ ┌────────────────────────────────────────────────────┐    │
│ │ [🔴] DEADLINE: Document Submission                 │    │
│ │ ABC Corp Ltd. - Annual Return                      │    │
│ │ [View Matter] [Mark Complete]                      │    │
│ └────────────────────────────────────────────────────┘    │
│                                                            │
│ 17:00 (End of Day)                                        │
│ ┌────────────────────────────────────────────────────┐    │
│ │ [🔴] DEADLINE: VAT Return Submission               │    │
│ │ XYZ Holdings - Q4 2025                             │    │
│ │ [View Matter] [Mark Complete]                      │    │
│ └────────────────────────────────────────────────────┘    │
│                                                            │
│ No time set                                               │
│ ┌────────────────────────────────────────────────────┐    │
│ │ [🟢] Task: Review contract drafts                  │    │
│ │ Property Purchase - Smith Residence                │    │
│ └────────────────────────────────────────────────────┘    │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Features:**
- Chronological list
- Time-blocked events
- All-day/no-time events at end
- Color-coded by type/urgency
- Quick actions per item
- Navigate to previous/next day
- Print daily agenda
- Email agenda summary

---

### 8.4 Upcoming Deadlines List

**Purpose:** Simple list of upcoming deadlines

**Appearance:**
```
┌────────────────────────────────────────────────┐
│ Upcoming Deadlines             [Next 30 Days▼] │
├────────────────────────────────────────────────┤
│                                                │
│ [🔴] OVERDUE                                   │
│ ├─ VAT Return - ABC Corp (Due: 10/12)         │
│ └─ Work Permit Renewal - J. Doe (Due: 09/12)  │
│                                                │
│ [🔴] DUE WITHIN 2 DAYS                        │
│ ├─ 11/12 - Document Submission - XYZ Inc.     │
│ ├─ 12/12 - Court Filing - Smith Case          │
│ └─ 13/12 - Work Permit Docs - John Smith      │
│                                                │
│ [🟡] DUE THIS WEEK                            │
│ ├─ 15/12 - Tax Payment - Multiple Clients (5) │
│ ├─ 16/12 - Annual Return - ABC Corp           │
│ └─ 17/12 - Property Closing - Brown Purchase  │
│                                                │
│ [🟢] DUE THIS MONTH                           │
│ ├─ 20/12 - Year-end Reports (3 clients)       │
│ ├─ 23/12 - Contract Review - XYZ Holdings     │
│ └─ 30/12 - Tax Planning Meeting - 5 clients   │
│                                                │
│ [Show All] [Export List]                       │
└────────────────────────────────────────────────┘
```

**Features:**
- Grouped by urgency
- Count indicators
- Click to view matter
- Mark as complete
- Reschedule/extend deadline
- Filter by client/matter type/staff
- Export to calendar (iCal)
- Set reminder notifications

---

## 9. Charts

### 9.1 Donut Chart - Matters by Status

**Purpose:** Visual breakdown of matter statuses

**Appearance:**
```
┌──────────────────────────────────────┐
│ Matters by Status                    │
│                                      │
│         ╭───────╮                    │
│      ╭──┘       └──╮                 │
│     │      47      │                 │
│     │    TOTAL     │                 │
│      ╰──╮       ╭──╯                 │
│         ╰───────╯                    │
│                                      │
│ [🟡] In Progress      18 (38%)      │
│ [🔵] Under Review     12 (26%)      │
│ [🟣] Awaiting Client   8 (17%)      │
│ [🟢] Not Started       5 (11%)      │
│ [🟠] On Hold           3 (6%)       │
│ [⛔] Other             1 (2%)       │
│                                      │
│ Click segment for details            │
└──────────────────────────────────────┘
```

**Features:**
- Interactive segments (click to filter)
- Hover to see exact count & percentage
- Total in center
- Legend with color coding
- Animated on load
- Export as image

---

### 9.2 Bar Chart - Revenue by Month

**Purpose:** Monthly revenue comparison

**Appearance:**
```
┌────────────────────────────────────────────────┐
│ Revenue by Month (GYD)            [2025 ▼]     │
│                                                │
│  3M ┤                                          │
│     │                          ██              │
│  2M ┤              ██          ██              │
│     │     ██       ██   ██     ██              │
│  1M ┤     ██  ██   ██   ██     ██   ██         │
│     │ ██  ██  ██   ██   ██     ██   ██         │
│   0 ┼──┬───┬───┬───┬───┬───┬───┬───┬───┬───   │
│      Jan Feb Mar Apr May Jun Jul Aug Sep Oct   │
│                                                │
│ Total 2025: GYD $15,234,567                   │
│ Average/month: GYD $1,523,457                 │
│ vs 2024: ↑ 23%                                │
│                                                │
│ [Export] [View Table]                          │
└────────────────────────────────────────────────┘
```

**Features:**
- Hover to see exact amounts
- Click bar to see breakdown
- Year selector
- Comparison line to previous year (optional)
- Target line (optional)
- Export data
- View as table

---

### 9.3 Line Chart - Client Growth

**Purpose:** Track client acquisition over time

**Appearance:**
```
┌────────────────────────────────────────────────┐
│ Client Growth                  [Last 12 Months▼]│
│                                                │
│ 150┤                                      ╱    │
│    │                                  ╱───     │
│ 130┤                              ╱───         │
│    │                          ╱───             │
│ 110┤                      ╱───                 │
│    │                  ╱───                     │
│  90┤              ╱───                         │
│    │          ╱───                             │
│  70┼──────────────────────────────────────────  │
│     Dec Jan Feb Mar Apr May Jun Jul Aug Sep    │
│                                                │
│ New Clients: 12                                │
│ Total Active: 147                              │
│ Growth Rate: +8.9%                             │
│                                                │
│ [Active] [All] [By Type]                       │
└────────────────────────────────────────────────┘
```

**Features:**
- Smooth line animation
- Data points clickable
- Tooltip with details
- Multiple series (active, inactive, total)
- Date range selector
- Zoom/pan for large datasets
- Export chart

---

### 9.4 Gauge Chart - Deadline Compliance

**Purpose:** Show percentage of deadlines met on time

**Appearance:**
```
┌──────────────────────────────────────┐
│ Deadline Compliance Rate             │
│                                      │
│          ╭─────────╮                 │
│        ╱     92%    ╲                │
│       │      ▲      │                │
│        ╲           ╱                 │
│          ╰─────────╯                 │
│      [Poor]  [Good]  [Excellent]     │
│        0%     50%      100%          │
│                                      │
│ This Month: 92% (23/25 met)         │
│ Last Month: 88%                      │
│ Trend: ↑ 4%                          │
│                                      │
│ [View Missed Deadlines]              │
└──────────────────────────────────────┘
```

**Color Ranges:**
- 0-60%: Red (Poor)
- 61-85%: Yellow (Good)
- 86-100%: Green (Excellent)

**Features:**
- Animated needle
- Color-coded ranges
- Comparison to previous period
- Click to see details
- Historical trend

---

## 10. Empty States

### 10.1 No Clients

**Appearance:**
```
┌────────────────────────────────────────┐
│                                        │
│         [Illustration of               │
│          empty folder/desk]            │
│                                        │
│      No clients yet                    │
│                                        │
│  Start building your client base       │
│  by adding your first client.          │
│                                        │
│      [+ Add Your First Client]         │
│                                        │
│  Or import from spreadsheet            │
│      [Import Clients]                  │
│                                        │
└────────────────────────────────────────┘
```

---

### 10.2 No Matters

**Appearance:**
```
┌────────────────────────────────────────┐
│                                        │
│         [Illustration of               │
│          empty briefcase]              │
│                                        │
│      No matters to show                │
│                                        │
│  Create a new matter to get started    │
│  or adjust your filters.               │
│                                        │
│      [+ Create Matter]                 │
│      [Clear Filters]                   │
│                                        │
└────────────────────────────────────────┘
```

---

### 10.3 No Documents

**Appearance:**
```
┌────────────────────────────────────────┐
│                                        │
│         [Illustration of               │
│          empty file cabinet]           │
│                                        │
│      No documents uploaded             │
│                                        │
│  Upload your first document or         │
│  drag and drop files here.             │
│                                        │
│      [Upload Document]                 │
│                                        │
│  Supported formats: PDF, DOCX,         │
│  JPG, PNG (Max 10MB)                   │
│                                        │
└────────────────────────────────────────┘
```

---

### 10.4 No Search Results

**Appearance:**
```
┌────────────────────────────────────────┐
│                                        │
│         [Illustration of               │
│          magnifying glass]             │
│                                        │
│      No results found for              │
│      "john smith"                      │
│                                        │
│  Try adjusting your search terms or    │
│  removing filters.                     │
│                                        │
│      [Clear Search]                    │
│      [Reset All Filters]               │
│                                        │
└────────────────────────────────────────┘
```

---

### 10.5 No Upcoming Deadlines

**Appearance:**
```
┌────────────────────────────────────────┐
│                                        │
│         [Illustration of               │
│          checkmark/calendar]           │
│                                        │
│      All caught up!                    │
│                                        │
│  You have no upcoming deadlines        │
│  in the selected period.               │
│                                        │
│  Great work staying on top of things!  │
│                                        │
│      [View All Deadlines]              │
│                                        │
└────────────────────────────────────────┘
```

---

## 11. Loading States

### 11.1 Table Skeleton

**Appearance:**
```
┌──────────────────────────────────────────────────┐
│ Clients                              [Loading...] │
├──────────────────────────────────────────────────┤
│ ▓▓▓▓▓▓▓▓▓▓░░░░░  ▓▓▓▓░░  ▓▓▓▓▓░░░  ▓▓░░  ░░░   │
│ ▓▓▓▓▓▓▓▓▓▓▓░░░░  ▓▓▓▓░░  ▓▓▓▓▓░░░  ▓▓░░  ░░░   │
│ ▓▓▓▓▓▓▓▓░░░░░░░  ▓▓▓▓░░  ▓▓▓▓▓░░░  ▓▓░░  ░░░   │
│ ▓▓▓▓▓▓▓▓▓▓▓▓░░░  ▓▓▓▓░░  ▓▓▓▓▓░░░  ▓▓░░  ░░░   │
│ ▓▓▓▓▓▓▓░░░░░░░░  ▓▓▓▓░░  ▓▓▓▓▓░░░  ▓▓░░  ░░░   │
└──────────────────────────────────────────────────┘
```

**Features:**
- Shimmer animation
- Matches table structure
- Represents column widths
- Shows realistic row count
- Accessible loading announcement

---

### 11.2 Card Skeleton

**Appearance:**
```
┌──────────────────────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░       │
│                                  │
│ ▓▓▓▓▓▓▓▓░░░░░░░░                │
│ ▓▓▓▓▓▓▓▓▓▓▓▓░░░░                │
│                                  │
│ ▓▓▓▓░░░░  ▓▓▓▓▓░░░░             │
│ ▓▓▓▓░░░░  ▓▓▓▓▓░░░░             │
│                                  │
│ ▓▓▓▓▓▓▓▓▓▓░░░░  ▓▓▓▓▓▓▓▓▓░░░   │
└──────────────────────────────────┘
```

---

### 11.3 Form Skeleton

**Appearance:**
```
┌──────────────────────────────────────┐
│ ▓▓▓▓▓▓▓▓░░░░                        │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░  │
│                                      │
│ ▓▓▓▓▓▓▓░░░░                         │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░  │
│                                      │
│ ▓▓▓▓▓▓▓▓▓░░░░                       │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░  │
│                                      │
│                    ▓▓▓▓▓▓▓▓▓░░░░   │
└──────────────────────────────────────┘
```

---

### 11.4 Button Loading Spinner

**Appearance:**
```
┌──────────────────┐
│ [⟳] Saving...   │
└──────────────────┘
```

**States:**
- Default: "Save"
- Loading: "[spinner] Saving..."
- Success: "[✓] Saved!"
- Error: "[✗] Failed - Retry"

**Features:**
- Button disabled during loading
- Spinner animation
- Text changes during states
- Brief success/error feedback
- Returns to default after timeout

---

## 12. Error States

### 12.1 Form Field Errors

**Inline Validation:**
```
┌──────────────────────────────────────┐
│ Email Address                        │
│ ┌──────────────────────────────────┐ │
│ │ john.smith@invalid              │ │
│ └──────────────────────────────────┘ │
│ ⚠️ Please enter a valid email address│
└──────────────────────────────────────┘
```

**Error Styles:**
- Red border on input
- Red error icon
- Red error message below field
- Shake animation on submit attempt
- Clear on correct input

**Common Field Errors:**
- Required: "This field is required"
- Email: "Please enter a valid email address"
- Phone: "Please enter a valid phone number (+592-XXX-XXXX)"
- TIN: "Invalid TIN format"
- Date: "Invalid date format (DD/MM/YYYY)"
- File: "File size exceeds 10MB limit"
- Password: "Password must be at least 8 characters"

---

### 12.2 Form-Level Errors

**Appearance:**
```
┌────────────────────────────────────────────┐
│ ┌────────────────────────────────────────┐ │
│ │ ⚠️ Unable to Save Client               │ │
│ │                                        │ │
│ │ Please fix the following errors:       │ │
│ │ • Email address is required            │ │
│ │ • Phone number format is invalid       │ │
│ │ • At least one ID document required    │ │
│ │                                        │ │
│ │ [Dismiss]                              │ │
│ └────────────────────────────────────────┘ │
│                                            │
│ [Email field with error]                   │
│ [Phone field with error]                   │
│ [Documents section with error]             │
│                                            │
└────────────────────────────────────────────┘
```

**Features:**
- Alert banner at top of form
- List of errors with links to fields
- Fields highlighted in error state
- Scroll to first error on submit
- Clear errors on fix
- Prevent form submission until resolved

---

### 12.3 Page-Level Error

**Appearance:**
```
┌────────────────────────────────────────┐
│                                        │
│         [Illustration of               │
│          error symbol]                 │
│                                        │
│      Something went wrong              │
│                                        │
│  We encountered an error loading       │
│  this page. Please try again.          │
│                                        │
│  Error Code: 500                       │
│  Reference: ERR-2025-12-11-1234        │
│                                        │
│      [Try Again]                       │
│      [Go to Dashboard]                 │
│                                        │
│  If the problem persists, please       │
│  contact support with the reference    │
│  number above.                         │
│                                        │
└────────────────────────────────────────┘
```

---

### 12.4 Network Error

**Appearance:**
```
┌────────────────────────────────────────┐
│ ┌────────────────────────────────────┐ │
│ │ ⚠️ Connection Lost                 │ │
│ │                                    │ │
│ │ Unable to connect to server.       │ │
│ │ Please check your internet         │ │
│ │ connection and try again.          │ │
│ │                                    │ │
│ │ Retrying in 5 seconds...           │ │
│ │                                    │ │
│ │ [Retry Now] [Dismiss]              │ │
│ └────────────────────────────────────┘ │
└────────────────────────────────────────┘
```

**Features:**
- Toast/banner notification
- Auto-retry with countdown
- Manual retry button
- Dismiss option
- Offline indicator in header
- Queue actions for when connection restored

---

### 12.5 404 Page Not Found

**Appearance:**
```
┌────────────────────────────────────────┐
│                                        │
│              404                       │
│                                        │
│         [Illustration of               │
│          lost/confused person]         │
│                                        │
│      Page Not Found                    │
│                                        │
│  The page you're looking for doesn't   │
│  exist or has been moved.              │
│                                        │
│      [Go to Dashboard]                 │
│      [View All Clients]                │
│      [View All Matters]                │
│                                        │
│  Or use the search above to find       │
│  what you're looking for.              │
│                                        │
└────────────────────────────────────────┘
```

---

### 12.6 403 Forbidden / Permission Denied

**Appearance:**
```
┌────────────────────────────────────────┐
│                                        │
│         [Illustration of               │
│          locked door/padlock]          │
│                                        │
│      Access Denied                     │
│                                        │
│  You don't have permission to          │
│  access this page or resource.         │
│                                        │
│  If you believe this is an error,      │
│  please contact your administrator.    │
│                                        │
│      [Go Back]                         │
│      [Go to Dashboard]                 │
│                                        │
└────────────────────────────────────────┘
```

---

## General Component Guidelines

### Accessibility
- All components must be keyboard navigable
- Proper ARIA labels and roles
- Focus indicators visible
- Color contrast meets WCAG AA standards
- Screen reader announcements for dynamic content
- Skip links for long forms

### Responsiveness
- Mobile-first design approach
- Breakpoints:
  - Mobile: < 640px
  - Tablet: 640px - 1024px
  - Desktop: > 1024px
- Touch-friendly targets (min 44px × 44px)
- Responsive tables (stack or scroll on mobile)
- Hamburger menu for mobile navigation

### Animations & Transitions
- Subtle, purposeful animations
- Respect prefers-reduced-motion
- Durations: 150-300ms for UI interactions
- Easing: ease-in-out for most transitions
- Loading states animate in after 300ms delay
- Success feedback: brief (1-2s)

### Color Scheme
- Primary: Professional blue (#2563EB)
- Secondary: Slate gray (#64748B)
- Success: Green (#10B981)
- Warning: Yellow/Amber (#F59E0B)
- Error/Danger: Red (#EF4444)
- Info: Blue (#3B82F6)
- Neutral: Gray shades

### Typography
- Headings: Clear hierarchy (H1-H6)
- Body: 14-16px for readability
- Small text: Min 12px
- Line height: 1.5 for body, 1.2 for headings
- Font family: System fonts or professional sans-serif

### Spacing
- Base unit: 4px
- Use multiples: 4px, 8px, 12px, 16px, 24px, 32px, 48px
- Consistent padding/margins throughout
- White space for breathing room

### Interactive States
All interactive elements should have:
- Default state
- Hover state (color/background change)
- Active/pressed state
- Focus state (visible outline)
- Disabled state (reduced opacity, no cursor)
- Loading state (spinner or skeleton)

---

## Implementation Notes

### Component Library
Consider using shadcn/ui (already included in project) as base components and customize for SYNERGY-GY needs:
- Button variants
- Form components
- Modal/Dialog
- Dropdown menus
- Data tables
- Calendar/date picker
- Toast notifications

### State Management
- Form state: React Hook Form or similar
- Global state: Context API or Zustand
- Server state: TanStack Query (already in project via oRPC)
- Optimistic updates for better UX

### Performance
- Lazy load heavy components (calendar, charts)
- Virtual scrolling for long tables/lists
- Debounce search inputs
- Optimize images and documents
- Code splitting by route

### Testing
- Unit tests for utility functions
- Component tests for UI components
- Integration tests for wizards/forms
- E2E tests for critical flows
- Accessibility testing

---

## Priority Implementation Order

**Phase 1: Core Components (Week 1-2)**
1. Form components (inputs, date picker, file upload)
2. Data tables (clients, matters)
3. Cards (client, matter, stats)
4. Modal dialogs (confirmation, quick view)

**Phase 2: Navigation & Lists (Week 3)**
5. Dropdowns (status, staff, service type)
6. Timeline components
7. Empty states
8. Loading states

**Phase 3: Advanced Features (Week 4-5)**
9. Multi-step wizards (start with client onboarding)
10. Calendar views
11. Charts and dashboards

**Phase 4: Polish (Week 6)**
12. Error states
13. Animations and transitions
14. Accessibility improvements
15. Mobile responsiveness
16. Performance optimization

---

## 8. Settings Page

### 8.1 Overview

**Purpose:** Central location for user preferences, account settings, security, and application information

**Route:** `/app/settings`

**Layout:** Sidebar navigation (desktop) / horizontal tabs (mobile)

### 8.2 Sections

#### Profile Settings
- **User Information:**
  - Name (editable)
  - Email (read-only, managed by auth provider)
  - Profile picture (linked to auth provider)
  - Member since date
- **Actions:**
  - Edit mode with Save/Cancel buttons
  - Validation on name field (required, min 2 characters)
  - Success/error toast notifications

#### Appearance
- **Theme Selection:**
  - Light mode
  - Dark mode
  - System preference (automatic)
- **Visual Preview:**
  - Live preview cards showing theme
  - Button examples in selected theme
- **Storage:**
  - Theme preference saved to localStorage
  - Uses next-themes for implementation

#### Notifications
- **Email Notifications:**
  - Master toggle for all email notifications
  - Deadline reminders (24 hours before)
  - Activity updates (real-time)
- **Conditional States:**
  - Deadline/activity toggles disabled when master toggle is off
  - Warning message when notifications are disabled
- **Persistence:**
  - Currently stored in localStorage
  - Backend support available for future database storage

#### Security
- **Change Password:**
  - Current password field
  - New password field (min 8 characters)
  - Confirm password field
  - Real-time validation feedback
  - Password mismatch indicator
- **Active Sessions:**
  - List of all active login sessions
  - Shows: Device type, last active date, IP address, user agent
  - Current session highlighted
  - Revoke session functionality (with confirmation dialog)
- **Security Tips:**
  - Best practices for account security
  - Password guidelines

#### About
- **Application Information:**
  - Version number with "Latest" badge
  - Build date
  - Environment (Production/Development)
  - System status indicator
- **Technology Stack:**
  - Badges showing tech stack (React, TypeScript, etc.)
  - Description of platform purpose
- **Support Links:**
  - Documentation
  - Help Center
  - Contact Support
  - GitHub repository
- **Legal:**
  - Terms of Service
  - Privacy Policy
  - Cookie Policy
  - Compliance information

### 8.3 Implementation Details

**API Endpoints (settings router):**
- `getProfile()` - Fetch user profile data
- `updateProfile({ name })` - Update user name
- `getNotificationPreferences()` - Get notification settings
- `updateNotificationPreferences({ ... })` - Save notification settings
- `changePassword({ currentPassword, newPassword })` - Change password
- `getActiveSessions()` - List all active sessions
- `revokeSession({ sessionId })` - Revoke a session
- `getAppInfo()` - Get app version and environment info

**Components:**
- `/routes/app/settings/index.tsx` - Main settings page with section navigation
- `/components/settings/profile-settings.tsx` - Profile section
- `/components/settings/appearance-settings.tsx` - Appearance section
- `/components/settings/notification-settings.tsx` - Notifications section
- `/components/settings/security-settings.tsx` - Security section
- `/components/settings/about-settings.tsx` - About section

**shadcn/ui Components Used:**
- Card, CardHeader, CardTitle, CardDescription, CardContent
- Input, Label, Switch, Button
- AlertDialog (for session revocation confirmation)
- Badge (for version, environment, tech stack)
- Separator (section dividers)
- ScrollArea (for navigation sidebar)

**Responsive Design:**
- Desktop: Sidebar navigation with content area
- Mobile: Horizontal scrollable tabs at top
- All forms are touch-friendly and mobile-optimized

### 8.4 User Flow

1. User clicks "Settings" in sidebar navigation
2. Settings page loads with Profile section by default
3. User can navigate between sections using sidebar (desktop) or tabs (mobile)
4. Changes are saved per section with explicit Save button
5. Success/error feedback via toast notifications
6. Theme changes apply immediately without reload

### 8.5 Status

**Implementation:** ✅ Complete (December 2024)
**Testing:** Pending
**Documentation:** Complete

---

This specification provides a comprehensive guide for implementing all UI components in the SYNERGY-GY legal practice management system. Each component should be built with accessibility, responsiveness, and user experience as top priorities, following the Ultracite code standards and Better-T-Stack architecture.
