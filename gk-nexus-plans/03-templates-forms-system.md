# Plan 03: Document Templates and Form Generation System

> **Priority:** P2 - Medium
> **Estimated Effort:** 2-3 weeks (reduced - system exists!)
> **Status:** 🟢 System Exists - Needs Content Only
> **Last Updated:** December 17, 2024

---

## 🎉 CRITICAL DISCOVERY: Template System Already Implemented!

### Existing Infrastructure (Found Dec 17, 2024)

**Database Schema:** `packages/db/src/schema/documents.ts`
- `documentTemplate` table with full placeholder support
- Categories: LETTER, AGREEMENT, CERTIFICATE, FORM, REPORT, INVOICE, OTHER
- Business filtering (GCMC, KAJ, or both)

**API Endpoints:** `packages/api/src/routers/documents.ts` (lines 368-726)
- `templates.list` - List templates with filters
- `templates.getById` - Get single template
- `templates.create` - Create template (admin only)
- `templates.update` - Update template (admin only)
- `templates.delete` - Soft delete template
- `templates.preview` - Preview with data substitution
- `templates.generate` - Generate document from template

**UI Pages:** `apps/web/src/routes/app/documents/templates/`
- `/templates` - List all templates
- `/templates/new` - Create new template
- `/templates/$template-id` - Edit template

**Placeholder System:**
```typescript
type TemplatePlaceholder = {
  key: string;           // e.g., "client.displayName"
  label: string;         // e.g., "Client Name"
  type: "text" | "date" | "number" | "currency";
  source: "client" | "matter" | "staff" | "business" | "date" | "custom";
  sourceField?: string;
};
```

**Available Data Sources:**
- `client.*` - All client fields (displayName, tinNumber, nisNumber, etc.)
- `matter.*` - All matter fields (referenceNumber, title, etc.)
- `staff.*` - Current staff profile
- `business.GCMC.*` / `business.KAJ.*` - Business info
- `date.today` / `date.todayFormatted` - Current date
- `custom.*` - Custom values passed at generation

### What's Actually Needed
1. **Content creation only** - Just add GRA/NIS/Legal form content
2. **No code changes required** - Use existing admin UI at `/app/documents/templates/new`
3. **Business filtering works** - Can target GCMC, KAJ, or both

---

## 📋 Problem Statement

GCMC and KAJ staff manually create repetitive documents like GRA forms, NIS submissions, affidavits, and client correspondence. A template system would:
- Save hours of manual data entry
- Ensure consistency and accuracy
- Reduce errors in tax calculations
- Auto-populate client/matter information

---

## 🎯 Objectives

1. Build a template management system with variable placeholders
2. Create templates for all common GRA and NIS forms
3. Create legal document templates (affidavits, POA, agreements)
4. Enable auto-population from client/matter records
5. Generate professional PDF and DOCX output

---

## 📝 Core Template Categories

### Category 1: GRA (Guyana Revenue Authority) Forms

| Form | Description | Priority |
|------|-------------|----------|
| **Form 2** | Annual Return of Employers (PAYE) | High |
| **Form 5** | Monthly Return of Deductions (PAYE) | High |
| **Form 7B** | Employee Emolument Statement | High |
| Individual Income Tax Return | Annual personal tax return | Medium |
| Corporate Income Tax Return | Company tax return | Medium |
| VAT Return | Monthly/quarterly VAT filing | High |
| Form G0019 | eServices Tax Agent Authorization | Medium |
| Compliance Certificate Application | Tax compliance request | High |
| Liability Statement Request | Outstanding tax request | Medium |

### Category 2: NIS (National Insurance Scheme) Forms

| Form | Description | Priority |
|------|-------------|----------|
| **CS3** | Contribution Schedule | High |
| Form R400 | Employer Registration | Medium |
| Employee Registration | New employee NIS registration | Medium |
| Self-Employment Registration | Self-employed registration | Medium |
| Monthly Contribution Report | Monthly NIS submission | High |
| Annual Contribution Summary | Year-end NIS summary | Medium |
| Age Benefit Claim | Pension application | Low |
| Sickness/Maternity Claim | Benefit claims | Low |
| Compliance Certificate Request | NIS compliance | Medium |

### Category 3: Legal Document Templates

| Template | Description | Priority |
|----------|-------------|----------|
| **General Affidavit** | Sworn statement | High |
| Affidavit of Identity | Identity verification | High |
| Statutory Declaration | Legal declaration | Medium |
| **General Power of Attorney** | Full authority delegation | High |
| Limited Power of Attorney | Specific authority | High |
| Revocation of POA | Cancel existing POA | Medium |
| Agreement of Sale (Property) | Real estate sale | Medium |
| Lease Agreement | Property rental | Medium |
| Last Will and Testament | Estate planning | Low |
| Non-Disclosure Agreement | Confidentiality | Medium |
| Service Agreement | Professional services | High |
| Employment Contract | Employee terms | Medium |

### Category 4: Business Correspondence

| Template | Description | Priority |
|----------|-------------|----------|
| **Engagement Letter** | New client terms | High |
| Fee Quote/Proposal | Service pricing | High |
| Invoice Cover Letter | Invoice accompaniment | Medium |
| Payment Reminder (1st) | Gentle reminder | High |
| Payment Reminder (2nd) | Firm reminder | High |
| Payment Reminder (Final) | Final notice | High |
| GRA Filing Cover Letter | Tax submission cover | Medium |
| Reference Letter | Employment/character reference | Medium |
| Certificate of Employment | Employment verification | Medium |

---

## 📝 Tasks

### Task 1: Database Schema for Templates
**Status:** 🔴 Not Started

```sql
-- Templates table
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL, -- 'GRA', 'NIS', 'LEGAL', 'CORRESPONDENCE'
  subcategory VARCHAR(50),       -- 'PAYE', 'VAT', 'AFFIDAVIT', etc.
  content TEXT NOT NULL,         -- Rich text with {{variables}}
  variables JSONB NOT NULL DEFAULT '[]', -- Variable definitions
  business VARCHAR(10),          -- 'GCMC', 'KAJ', or NULL for both
  output_format VARCHAR(10) DEFAULT 'PDF', -- 'PDF', 'DOCX', 'BOTH'
  is_active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Variable definition example in JSONB:
-- [
--   {"key": "client.name", "label": "Client Name", "type": "text", "source": "client"},
--   {"key": "client.tin", "label": "TIN", "type": "text", "source": "client"},
--   {"key": "date.current", "label": "Current Date", "type": "date", "source": "system"},
--   {"key": "custom.amount", "label": "Amount", "type": "currency", "source": "input"}
-- ]

-- Generated documents tracking
CREATE TABLE generated_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES templates(id),
  client_id UUID REFERENCES clients(id),
  matter_id UUID REFERENCES matters(id),
  document_id UUID REFERENCES documents(id), -- Link to saved document
  variables_snapshot JSONB NOT NULL,         -- Values used at generation
  generated_by UUID REFERENCES users(id),
  generated_at TIMESTAMP DEFAULT NOW()
);

-- Template categories reference
CREATE TABLE template_categories (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  sort_order INTEGER DEFAULT 0
);

INSERT INTO template_categories VALUES
  ('GRA', 'GRA Forms', 'Guyana Revenue Authority tax forms', 'FileText', 1),
  ('NIS', 'NIS Forms', 'National Insurance Scheme forms', 'Shield', 2),
  ('LEGAL', 'Legal Documents', 'Affidavits, agreements, and legal templates', 'Scale', 3),
  ('CORRESPONDENCE', 'Correspondence', 'Letters and business communication', 'Mail', 4);
```

---

### Task 2: Variable System Implementation
**Status:** 🔴 Not Started

**Variable Types:**

| Type | Description | Example |
|------|-------------|---------|
| `text` | Plain text | Client name |
| `number` | Numeric value | Employee count |
| `currency` | GYD amount | Invoice total |
| `date` | Date value | Filing date |
| `phone` | Phone number | Contact number |
| `email` | Email address | Client email |
| `address` | Multi-line address | Business address |
| `tin` | TIN number | 123-456-789 |
| `nis` | NIS number | A1234567 |
| `select` | Dropdown options | Business type |
| `boolean` | Yes/No checkbox | VAT registered |
| `calculated` | Computed value | Total with VAT |

**Variable Sources:**

```typescript
type VariableSource = 
  | 'client'      // Auto-fill from client record
  | 'matter'      // Auto-fill from matter record
  | 'invoice'     // Auto-fill from invoice
  | 'staff'       // Auto-fill from current user/assigned staff
  | 'business'    // Auto-fill from GCMC/KAJ business info
  | 'system'      // System values (date, time)
  | 'input'       // User must enter manually
  | 'calculated'; // Computed from other variables

interface VariableDefinition {
  key: string;           // e.g., 'client.name'
  label: string;         // Display label
  type: VariableType;
  source: VariableSource;
  required: boolean;
  defaultValue?: string;
  format?: string;       // Date format, currency format
  options?: string[];    // For select type
  formula?: string;      // For calculated type
}
```

**Auto-population Mapping:**

```typescript
const clientVariables = {
  'client.name': client.name,
  'client.tin': client.tin,
  'client.nis': client.nisNumber,
  'client.email': client.email,
  'client.phone': client.phone,
  'client.address': formatAddress(client.address),
  'client.business_name': client.businessName,
  'client.business_type': client.businessType,
};

const matterVariables = {
  'matter.title': matter.title,
  'matter.reference': matter.referenceNumber,
  'matter.service_type': matter.serviceType.name,
  'matter.staff': matter.assignedStaff.user.name,
  'matter.created_date': formatDate(matter.createdAt),
};

const systemVariables = {
  'date.current': formatDate(new Date()),
  'date.year': new Date().getFullYear(),
  'date.month': getMonthName(new Date()),
  'business.name': currentBusiness.name,
  'business.address': currentBusiness.address,
  'business.phone': currentBusiness.phone,
  'staff.name': currentUser.name,
  'staff.position': currentUser.position,
};
```

---

### Task 3: Template Editor
**Status:** 🔴 Not Started

**Features:**
- [ ] Rich text editor (TipTap or similar)
- [ ] Variable insertion toolbar
- [ ] Variable picker dropdown
- [ ] Live preview panel
- [ ] Template versioning
- [ ] Save as draft
- [ ] Duplicate template

**Editor UI Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│ Template: General Affidavit                    [Save] [Preview] │
├─────────────────────────────────────────────────────────────────┤
│ Category: [Legal ▼]  Subcategory: [Affidavit ▼]  Business: [All]│
├───────────────────────────────────┬─────────────────────────────┤
│                                   │                             │
│  [B] [I] [U] │ H1 H2 │ [Variable] │     LIVE PREVIEW            │
│  ─────────────────────────────────│                             │
│                                   │     AFFIDAVIT               │
│  I, {{client.name}}, of          │                             │
│  {{client.address}}, do hereby   │     I, John Smith, of       │
│  solemnly and sincerely declare  │     123 Main St, Georgetown │
│  that...                         │     do hereby solemnly...   │
│                                   │                             │
│  Date: {{date.current}}          │     Date: December 17, 2024 │
│                                   │                             │
│  Signature: ___________________  │     Signature: ____________ │
│                                   │                             │
├───────────────────────────────────┴─────────────────────────────┤
│ Variables Used: client.name, client.address, date.current       │
└─────────────────────────────────────────────────────────────────┘
```

**Variable Insertion:**
```typescript
// Insert variable at cursor position
const insertVariable = (key: string) => {
  editor.commands.insertContent(`{{${key}}}`);
};

// Variable picker component
<VariablePicker
  onSelect={insertVariable}
  categories={['client', 'matter', 'system', 'custom']}
/>
```

---

### Task 4: Document Generation
**Status:** 🔴 Not Started

**Generation Flow:**
1. User selects template
2. System identifies required variables
3. Auto-populate from client/matter if selected
4. User fills remaining variables
5. Preview generated document
6. Generate PDF/DOCX
7. Option to save to matter/client documents
8. Option to email to client

**PDF Generation (using pdf-lib or similar):**

```typescript
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

async function generatePDF(template: Template, variables: Record<string, string>) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]); // Letter size
  
  const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const boldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  
  // Replace variables in content
  let content = template.content;
  for (const [key, value] of Object.entries(variables)) {
    content = content.replaceAll(`{{${key}}}`, value);
  }
  
  // Render content to PDF
  // ... text layout logic
  
  return await pdfDoc.save();
}
```

**DOCX Generation (using docx library):**

```typescript
import { Document, Paragraph, TextRun } from 'docx';

async function generateDOCX(template: Template, variables: Record<string, string>) {
  // Parse template content and replace variables
  const content = replaceVariables(template.content, variables);
  
  const doc = new Document({
    sections: [{
      children: parseContentToParagraphs(content),
    }],
  });
  
  return await Packer.toBuffer(doc);
}
```

---

### Task 5: Template Library - GRA Forms
**Status:** 🔴 Not Started

**Priority Templates to Create:**

#### 5.1 Form 7B - Employee Emolument Statement

```markdown
# FORM 7B
## CERTIFICATE OF EMOLUMENTS AND TAX DEDUCTED

**Year of Assessment:** {{tax.year}}

### EMPLOYER DETAILS
Employer Name: {{business.name}}
Employer TIN: {{business.tin}}
Address: {{business.address}}

### EMPLOYEE DETAILS
Employee Name: {{employee.name}}
Employee TIN: {{employee.tin}}
NIS Number: {{employee.nis}}

### EMOLUMENTS AND DEDUCTIONS
| Description | Amount (GYD) |
|-------------|--------------|
| Gross Emoluments | {{employee.gross_emoluments}} |
| Less: NIS Contribution | {{employee.nis_contribution}} |
| Less: Medical/Life Insurance | {{employee.insurance_deduction}} |
| Taxable Income | {{calculated.taxable_income}} |
| Tax Deducted | {{employee.tax_deducted}} |

Date: {{date.current}}

_____________________________
Authorized Signature
```

#### 5.2 VAT Return Template

```markdown
# VALUE ADDED TAX RETURN

**Tax Period:** {{vat.period_from}} to {{vat.period_to}}
**Due Date:** {{vat.due_date}}

### TAXPAYER INFORMATION
Business Name: {{client.business_name}}
TIN: {{client.tin}}
Address: {{client.address}}

### OUTPUT TAX (Sales)
| Description | Value (GYD) | VAT (14%) |
|-------------|-------------|-----------|
| Standard Rated Sales | {{vat.standard_sales}} | {{calculated.standard_vat}} |
| Zero Rated Sales | {{vat.zero_sales}} | 0.00 |
| Exempt Sales | {{vat.exempt_sales}} | N/A |
| **Total Output Tax** | | **{{calculated.total_output}}** |

### INPUT TAX (Purchases)
| Description | Value (GYD) | VAT (14%) |
|-------------|-------------|-----------|
| Standard Rated Purchases | {{vat.standard_purchases}} | {{calculated.input_vat}} |
| **Total Input Tax** | | **{{calculated.total_input}}** |

### TAX CALCULATION
| | Amount (GYD) |
|---|--------------|
| Output Tax | {{calculated.total_output}} |
| Less: Input Tax | {{calculated.total_input}} |
| **Net VAT Payable/(Refundable)** | **{{calculated.net_vat}}** |

Declaration: I declare that the information provided is true and correct.

Date: {{date.current}}
Signature: _____________________________
```

---

### Task 6: Template Library - NIS Forms
**Status:** 🔴 Not Started

#### 6.1 NIS Contribution Schedule (CS3)

```markdown
# NATIONAL INSURANCE AND SOCIAL SECURITY SCHEME - GUYANA
## CONTRIBUTION SCHEDULE

**Employer:** {{business.name}}
**Employer NIS Number:** {{business.nis_employer}}
**Period:** {{nis.period_month}} {{nis.period_year}}

### EMPLOYEE CONTRIBUTIONS

| # | Employee Name | NIS Number | Gross Earnings | Employee (5.6%) | Employer (8.4%) | Total (14%) |
|---|---------------|------------|----------------|-----------------|-----------------|-------------|
{{#each employees}}
| {{@index}} | {{name}} | {{nis}} | {{gross}} | {{employee_contribution}} | {{employer_contribution}} | {{total}} |
{{/each}}

### SUMMARY
| | Amount (GYD) |
|---|--------------|
| Total Gross Earnings | {{calculated.total_gross}} |
| Total Employee Contributions (5.6%) | {{calculated.total_employee}} |
| Total Employer Contributions (8.4%) | {{calculated.total_employer}} |
| **Grand Total Contributions (14%)** | **{{calculated.grand_total}}** |

**Note:** Maximum insurable earnings: GYD 280,000 per month

Date: {{date.current}}

_____________________________
Authorized Signature
```

---

### Task 7: Template Library - Legal Documents
**Status:** 🔴 Not Started

#### 7.1 General Affidavit

```markdown
# AFFIDAVIT

**THE CO-OPERATIVE REPUBLIC OF GUYANA**

I, **{{deponent.name}}**, of **{{deponent.address}}**, {{deponent.occupation}}, do hereby make oath and say as follows:

1. That I am the Deponent herein and as such am competent to swear to this Affidavit.

2. {{affidavit.statement_1}}

3. {{affidavit.statement_2}}

4. {{affidavit.statement_3}}

5. That this Affidavit is made in support of {{affidavit.purpose}}.

6. That I make this solemn declaration conscientiously believing the same to be true.

**SWORN TO** at {{location.city}}, in the County of {{location.county}}, this **{{date.day}}** day of **{{date.month}}**, **{{date.year}}**.

BEFORE ME:

_____________________________
COMMISSIONER OF OATHS / JUSTICE OF THE PEACE

_____________________________
DEPONENT
```

#### 7.2 Power of Attorney

```markdown
# GENERAL POWER OF ATTORNEY

**KNOW ALL MEN BY THESE PRESENTS:**

That I, **{{principal.name}}**, of **{{principal.address}}**, do hereby make, constitute, and appoint **{{attorney.name}}**, of **{{attorney.address}}**, my true and lawful Attorney-in-Fact.

**GIVING AND GRANTING** unto my said Attorney-in-Fact full power and authority to do and perform all and every act and thing whatsoever requisite and necessary to be done in and about the premises, as fully to all intents and purposes as I might or could do if personally present, with full power of substitution and revocation.

**This Power of Attorney shall be effective** from {{effective.date}} {{#if effective.end_date}}until {{effective.end_date}}{{else}}until revoked in writing{{/if}}.

**POWERS GRANTED:**
{{#each powers}}
- {{this}}
{{/each}}

**IN WITNESS WHEREOF**, I have hereunto set my hand and seal this **{{date.day}}** day of **{{date.month}}**, **{{date.year}}**.

_____________________________
{{principal.name}} (PRINCIPAL)

**WITNESSES:**

1. Name: _____________________ Signature: _____________________
   Address: _____________________

2. Name: _____________________ Signature: _____________________
   Address: _____________________
```

---

### Task 8: Template Library - Correspondence
**Status:** 🔴 Not Started

#### 8.1 Engagement Letter

```markdown
{{business.letterhead}}

{{date.current}}

{{client.name}}
{{client.address}}

**RE: ENGAGEMENT FOR PROFESSIONAL SERVICES**

Dear {{client.salutation}} {{client.last_name}},

Thank you for selecting **{{business.name}}** to provide {{service.type}} services. This letter confirms the terms of our engagement.

**SCOPE OF SERVICES:**
{{service.description}}

**FEES:**
Our professional fees for these services will be **GYD {{service.fee}}** {{service.fee_basis}}.

{{#if service.includes_vat}}
This amount is inclusive of 14% VAT.
{{else}}
VAT at 14% will be added to all invoices.
{{/if}}

**PAYMENT TERMS:**
- Payment is due within {{payment.terms}} days of invoice date
- A deposit of {{payment.deposit}}% is required to commence work

**TIMELINE:**
We estimate completion within {{service.timeline}}.

Please sign below to confirm your acceptance of these terms.

Yours faithfully,

_____________________________
{{staff.name}}
{{staff.position}}
{{business.name}}

---

**ACCEPTANCE**

I/We accept the terms of this engagement.

_____________________________          Date: _____________________________
{{client.name}}
```

#### 8.2 Payment Reminder (Final Notice)

```markdown
{{business.letterhead}}

{{date.current}}

**URGENT - FINAL NOTICE**

{{client.name}}
{{client.address}}

**RE: OVERDUE ACCOUNT - {{invoice.number}}**

Dear {{client.salutation}} {{client.last_name}},

Despite our previous reminders, your account remains unpaid. The following invoice is now **{{invoice.days_overdue}} days overdue**:

| Invoice # | Date | Amount | Status |
|-----------|------|--------|--------|
| {{invoice.number}} | {{invoice.date}} | GYD {{invoice.amount}} | OVERDUE |

**Total Outstanding: GYD {{invoice.total_outstanding}}**

This is our final notice. If payment is not received within **7 days** of this letter, we will have no alternative but to:

1. Suspend all services on your account
2. Refer this matter to our collections department
3. Consider legal action to recover the debt

To avoid these actions, please remit payment immediately via:
- Bank Transfer: {{business.bank_details}}
- Cheque payable to: {{business.name}}

If you have already made payment, please disregard this notice and contact us with payment details.

For any queries regarding this account, please contact us immediately.

Yours faithfully,

_____________________________
{{staff.name}}
Accounts Department
{{business.name}}
Tel: {{business.phone}}
```

---

### Task 9: Template Management UI
**Status:** 🔴 Not Started

**Features:**
- [ ] Template browser with category navigation
- [ ] Search and filter templates
- [ ] Favorite/frequently used section
- [ ] Template preview
- [ ] Edit/duplicate/delete actions
- [ ] Import/export templates
- [ ] Template usage statistics

**UI Components:**
```
apps/web/src/
├── routes/app/templates/
│   ├── index.tsx           # Template browser
│   ├── $template-id.tsx    # Template editor
│   └── generate.tsx        # Document generation wizard
├── components/templates/
│   ├── template-browser.tsx
│   ├── template-editor.tsx
│   ├── template-preview.tsx
│   ├── variable-picker.tsx
│   ├── variable-input-form.tsx
│   └── generation-wizard.tsx
```

---

### Task 10: Document Generation Wizard
**Status:** 🔴 Not Started

**Wizard Steps:**

1. **Select Template**
   - Browse by category
   - Search templates
   - View template preview

2. **Select Context** (optional)
   - Link to Client (auto-populate)
   - Link to Matter (auto-populate)
   - Link to Invoice (for invoice-related templates)

3. **Fill Variables**
   - Auto-populated fields shown (editable)
   - Required fields highlighted
   - Validation on each field
   - Real-time preview update

4. **Preview & Generate**
   - Full document preview
   - Choose output format (PDF/DOCX)
   - Download or save to system
   - Email to client option

---

## 🔧 Technical Implementation

### API Endpoints

```typescript
// Templates CRUD
orpc.templates.list        // List templates with filters
orpc.templates.getById     // Get single template
orpc.templates.create      // Create new template
orpc.templates.update      // Update template
orpc.templates.delete      // Delete template
orpc.templates.duplicate   // Duplicate template

// Document Generation
orpc.templates.generate    // Generate document from template
orpc.templates.preview     // Preview with variables
orpc.templates.variables   // Get variable definitions for template

// Generated Documents
orpc.generatedDocuments.list    // List generated documents
orpc.generatedDocuments.getById // Get generated document details
```

### Dependencies to Add

```json
{
  "dependencies": {
    "pdf-lib": "^1.17.1",      // PDF generation
    "docx": "^8.5.0",          // DOCX generation
    "@tiptap/react": "^2.1.0", // Rich text editor
    "@tiptap/starter-kit": "^2.1.0",
    "handlebars": "^4.7.8"     // Template variable replacement
  }
}
```

---

## ✅ Definition of Done

- [ ] Template editor functional with variable system
- [ ] At least 15 core templates created and tested
- [ ] Auto-population from client/matter records works
- [ ] PDF generation produces professional output
- [ ] DOCX generation works correctly
- [ ] GYD currency formatting correct
- [ ] VAT (14%) calculations accurate
- [ ] NIS (5.6%/8.4%) calculations accurate
- [ ] Generated documents saved to system
- [ ] Template search and filtering works
- [ ] Mobile-friendly template selection

---

## 📊 Progress Tracking

| Task | Status | Templates Created |
|------|--------|-------------------|
| 1. Database Schema | 🔴 | - |
| 2. Variable System | 🔴 | - |
| 3. Template Editor | 🔴 | - |
| 4. Document Generation | 🔴 | - |
| 5. GRA Forms | 🔴 | 0/9 |
| 6. NIS Forms | 🔴 | 0/9 |
| 7. Legal Documents | 🔴 | 0/12 |
| 8. Correspondence | 🔴 | 0/9 |
| 9. Management UI | 🔴 | - |
| 10. Generation Wizard | 🔴 | - |

---

*Plan Created: December 2024*
*For: Claude Code AI-assisted development*
