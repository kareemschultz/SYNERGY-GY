# Auto-Fill Forms Integration Specification

**Status**: Draft
**Priority**: MEDIUM
**Phase**: Phase 2
**Created**: 2025-12-12
**Last Updated**: 2025-12-12

---

## Overview

Auto-Fill Forms Integration enables staff to generate government forms and business letters pre-filled with client and matter data, dramatically reducing data entry time and errors. This system leverages the existing document template infrastructure and extends it to support PDF form generation.

### Purpose

- **Save Time**: Generate forms in seconds vs 15-30 minutes manual entry
- **Reduce Errors**: Eliminate typos and incorrect data
- **Ensure Consistency**: Standardized formatting across all forms
- **Improve Compliance**: All required fields populated correctly
- **Enhance Professionalism**: Clean, properly formatted documents

### Current State vs Proposed

**Current**: Existing document template system with 60+ placeholders supports text generation. Staff manually copy-paste data into PDF forms or Word documents.

**Proposed**: Direct PDF generation with form field mapping, preview before download, draft watermarking, and integration with knowledge base.

---

## Goals & Objectives

1. **Auto-Fill 80% of Forms**: GRA, NIS, Immigration, DCRA forms
2. **Time Savings**: 90% reduction in form completion time
3. **Error Reduction**: 95% reduction in data entry errors
4. **User Adoption**: 70% of staff use auto-fill weekly
5. **Performance**: Generate forms in <2 seconds

---

## User Stories

**AF-1: Generate Work Permit Form**
> As a **staff member**, I want to **auto-fill a work permit application with client data**, so that **I can submit it to Immigration quickly**.

**AF-2: Preview Before Download**
> As a **staff member**, I want to **preview the filled form before downloading**, so that **I can verify accuracy**.

**AF-3: Generate Letter Templates**
> As a **staff member**, I want to **generate an engagement letter with client details**, so that **I can send professional correspondence**.

**AF-4: Handle Missing Data**
> As a **staff member**, I want to **see which fields couldn't be auto-filled**, so that **I can complete them manually**.

---

## Technical Requirements

### Functional Requirements

**FR-1: PDF Generation Library**
- Options: `pdf-lib` (manipulation) or `@react-pdf/renderer` (creation)
- Must support form field mapping
- Must handle text, checkboxes, radio buttons, dates
- Must support multi-page documents

**FR-2: Data Mapping**
- Map 60+ placeholders to form fields
- Client data: name, address, TIN, ID numbers, contact
- Matter data: reference, description, dates, fees
- Staff data: name, email, phone, title
- Business data: company name, address, registration numbers

**FR-3: Form Field Types**
```typescript
type FormFieldType =
  | "text"           // Single-line text
  | "textarea"       // Multi-line text
  | "checkbox"       // Boolean
  | "radio"          // Single choice from options
  | "date"           // Date picker
  | "signature"      // Signature field
  | "currency"       // Money amounts
```

**FR-4: Draft Watermarking**
- All generated forms marked as DRAFT
- Watermark: "DRAFT - Review before submission"
- Diagonal, semi-transparent, non-removable
- Disclaimer footer on every page

**FR-5: Template Linkage**
- Knowledge base items link to documentTemplates
- Auto-fill button only visible for linked items
- Select client/matter context before generation

---

## Architecture

### PDF Generation Flow

```
┌──────────────┐
│ Staff clicks │
│  "Auto-Fill" │
│  on KB item  │
└──────┬───────┘
       │
       ▼
┌────────────────────────────┐
│ Modal: Select Client/Matter│
└──────┬─────────────────────┘
       │
       ▼
┌────────────────────────────┐
│ Fetch Client Data          │
│ Fetch Matter Data (if sel) │
│ Fetch Staff Data (current) │
│ Fetch Business Data        │
└──────┬─────────────────────┘
       │
       ▼
┌────────────────────────────┐
│ Load KB Item + Template    │
│ Map placeholders to values │
│ Identify missing data      │
└──────┬─────────────────────┘
       │
       ▼
┌────────────────────────────┐
│ Generate PDF               │
│ • Load base PDF template   │
│ • Fill form fields         │
│ • Apply DRAFT watermark    │
│ • Add disclaimer footer    │
└──────┬─────────────────────┘
       │
       ▼
┌────────────────────────────┐
│ Preview Modal              │
│ • Show PDF in iframe       │
│ • List filled fields       │
│ • Highlight missing fields │
│ • [Download] button        │
└────────────────────────────┘
```

### Library Comparison

**Option 1: pdf-lib** (Recommended for forms)
```typescript
import { PDFDocument } from 'pdf-lib'

async function fillForm(templatePath: string, data: any) {
  const existingPdfBytes = await fetch(templatePath).then(res => res.arrayBuffer())
  const pdfDoc = await PDFDocument.load(existingPdfBytes)
  const form = pdfDoc.getForm()

  // Fill fields
  const nameField = form.getTextField('applicant_name')
  nameField.setText(data.clientName)

  // Add watermark
  const pages = pdfDoc.getPages()
  pages.forEach(page => {
    page.drawText('DRAFT', {
      x: 200,
      y: 400,
      size: 72,
      opacity: 0.2,
      rotate: degrees(45),
    })
  })

  const pdfBytes = await pdfDoc.save()
  return pdfBytes
}
```

**Option 2: @react-pdf/renderer** (Recommended for letters)
```typescript
import { Document, Page, Text, View } from '@react-pdf/renderer'

const EngagementLetter = ({ client, matter }) => (
  <Document>
    <Page size="A4">
      <View style={styles.section}>
        <Text style={styles.header}>Tax Engagement Letter</Text>
        <Text>Dear {client.displayName},</Text>
        <Text>Re: {matter.title}</Text>
        <Text>We are pleased to confirm our engagement...</Text>
      </View>
    </Page>
  </Document>
)
```

**Decision**: Use **pdf-lib** for government forms (PDF manipulation), **@react-pdf/renderer** for letter templates (PDF creation).

---

## Data Mapping

### Placeholder to Field Mapping

**Client Placeholders** → **Form Fields**
```typescript
{
  "{{client.displayName}}": "applicant_name",
  "{{client.email}}": "email_address",
  "{{client.phone}}": "phone_number",
  "{{client.address}}": "residential_address",
  "{{client.tinNumber}}": "tin",
  "{{client.nationalId}}": "national_id_number",
  "{{client.passportNumber}}": "passport_number",
  "{{client.dateOfBirth}}": "date_of_birth",
  "{{client.nationality}}": "nationality",
}
```

**Matter Placeholders** → **Form Fields**
```typescript
{
  "{{matter.referenceNumber}}": "reference_number",
  "{{matter.title}}": "service_description",
  "{{matter.startDate}}": "application_date",
  "{{matter.dueDate}}": "expected_completion_date",
}
```

**Business Placeholders** → **Form Fields**
```typescript
{
  "{{business.name}}": "company_name",
  "{{business.address}}": "company_address",
  "{{business.phone}}": "company_phone",
  "{{business.email}}": "company_email",
  "{{business.registrationNumber}}": "company_reg_number",
}
```

**Date Placeholders** → **Form Fields**
```typescript
{
  "{{date.today}}": "form_completion_date",
  "{{date.todayFormatted}}": "form_completion_date_formatted", // "December 12, 2024"
}
```

---

## API Endpoints

### Knowledge Base Auto-Fill

**Addition to**: `/packages/api/src/routers/knowledge-base.ts`

```typescript
// Auto-fill form with client/matter data
autoFill: staffProcedure
  .input(z.object({
    id: z.string().uuid(), // KB item ID
    clientId: z.string().uuid().optional(),
    matterId: z.string().uuid().optional(),
    format: z.enum(["PDF", "DOCX"]).default("PDF"),
  }))
  .mutation(async ({ input, context }) => {
    const { id, clientId, matterId, format } = input
    const { db, user } = context

    // 1. Get KB item
    const kbItem = await db.query.knowledgeBaseItem.findFirst({
      where: eq(knowledgeBaseItem.id, id),
    })

    if (!kbItem || !kbItem.supportsAutoFill || !kbItem.templateId) {
      throw new Error("KB item does not support auto-fill")
    }

    // 2. Get linked template
    const template = await db.query.documentTemplate.findFirst({
      where: eq(documentTemplate.id, kbItem.templateId),
    })

    // 3. Fetch context data
    const client = clientId
      ? await db.query.client.findFirst({ where: eq(client.id, clientId) })
      : null

    const matter = matterId
      ? await db.query.matter.findFirst({ where: eq(matter.id, matterId) })
      : null

    const staff = user

    // 4. Build placeholder map
    const placeholders = {
      client: client ? mapClientToPlaceholders(client) : {},
      matter: matter ? mapMatterToPlaceholders(matter) : {},
      staff: mapStaffToPlaceholders(staff),
      business: kbItem.business ? getBusinessData(kbItem.business) : {},
      date: {
        today: new Date().toISOString().split('T')[0],
        todayFormatted: format(new Date(), 'MMMM dd, yyyy'),
      },
    }

    // 5. Generate PDF
    if (format === "PDF") {
      const pdfBytes = await generatePDF(kbItem, template, placeholders)

      // Store temporarily
      const tempPath = `/tmp/autofill-${Date.now()}.pdf`
      await fs.writeFile(tempPath, pdfBytes)

      return {
        success: true,
        downloadUrl: `/api/download/temp/${path.basename(tempPath)}`,
        fileName: `${kbItem.title.replace(/\s+/g, '-')}-DRAFT.pdf`,
        missingFields: identifyMissingFields(placeholders, template.placeholders),
      }
    }

    // 6. Generate DOCX (alternative)
    if (format === "DOCX") {
      const docxBuffer = await generateDOCX(template.content, placeholders)
      // Similar to PDF flow
    }
  }),
```

---

## UI Components

### Auto-Fill Modal

```
┌─ Auto-Fill: Work Permit Application ──────────────────┐
│                                                        │
│ Select Context:                                        │
│ ┌────────────────────────────────────────────────────┐│
│ │ Client: [John Doe ▼]                               ││
│ └────────────────────────────────────────────────────┘│
│ ┌────────────────────────────────────────────────────┐│
│ │ Matter (optional): [WP-2024-001 ▼]                 ││
│ └────────────────────────────────────────────────────┘│
│                                                        │
│ Data Preview:                                          │
│ ✅ Applicant Name: John Doe                           │
│ ✅ Passport Number: G1234567                          │
│ ✅ Date of Birth: January 15, 1990                    │
│ ✅ Nationality: Canadian                              │
│ ✅ Employer: ABC Company Ltd                          │
│ ✅ Position: Senior Engineer                          │
│ ⚠️  Medical Certificate Number: (missing - fill manually)│
│ ⚠️  Police Clearance Date: (missing - fill manually)  │
│                                                        │
│ Output Format:                                         │
│ ◉ PDF (Recommended)    ○ Microsoft Word               │
│                                                        │
│ ⚠️  Generated documents are marked as DRAFT.          │
│    Review all data before submitting to authorities.  │
│                                                        │
│ [Cancel]                       [Preview] [Generate]   │
└────────────────────────────────────────────────────────┘
```

### Preview Modal

```
┌─ Preview: Work Permit Application (DRAFT) ────────────┐
│                                                        │
│ ┌────────────────────────────────────────────────────┐│
│ │                                                    ││
│ │         [PDF Preview - Page 1 of 3]               ││
│ │                                                    ││
│ │   MINISTRY OF HOME AFFAIRS                         ││
│ │   Work Permit Application Form                     ││
│ │                                                    ││
│ │   Applicant Name: John Doe                         ││
│ │   Passport Number: G1234567                        ││
│ │   ...                                              ││
│ │                                                    ││
│ │          ╱╱╱ DRAFT ╱╱╱                            ││
│ │                                                    ││
│ └────────────────────────────────────────────────────┘│
│                                                        │
│ [< Page 1 of 3 >]                                     │
│                                                        │
│ Missing Fields:                                        │
│ • Medical Certificate Number (page 2, section C)      │
│ • Police Clearance Date (page 3, section D)          │
│                                                        │
│ ℹ️  You'll need to fill these manually after download.│
│                                                        │
│ [Close]              [Download PDF] [Download DOCX]   │
└────────────────────────────────────────────────────────┘
```

---

## PDF Form Templates

### Form Field Naming Convention

**Standard Field Names**:
```
# Personal Information
applicant_name
applicant_first_name
applicant_last_name
date_of_birth
nationality
gender
marital_status

# Contact Information
email_address
phone_number
alternate_phone
residential_address
mailing_address
city
country

# Identification
national_id_number
tin
passport_number
passport_expiry_date
nis_number

# Employment (for work permits)
employer_name
employer_address
employer_tin
job_title
job_description
salary
start_date

# Business (for registrations)
company_name
company_type
registration_number
incorporation_date
directors[]
shareholders[]
```

---

## Draft Watermarking

### Implementation (pdf-lib)

```typescript
import { degrees, PDFDocument, rgb, StandardFonts } from 'pdf-lib'

async function addDraftWatermark(pdfDoc: PDFDocument) {
  const pages = pdfDoc.getPages()
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  for (const page of pages) {
    const { width, height } = page.getSize()

    // Diagonal watermark
    page.drawText('DRAFT', {
      x: width / 4,
      y: height / 2,
      size: 72,
      font,
      color: rgb(0.5, 0.5, 0.5),
      opacity: 0.2,
      rotate: degrees(45),
    })

    // Footer disclaimer
    page.drawText('DRAFT - Review all information before submission', {
      x: 50,
      y: 30,
      size: 10,
      font,
      color: rgb(0.6, 0, 0),
    })
  }
}
```

---

## Error Handling

### Missing Data Scenarios

**Strategy**: Generate form with available data, clearly mark missing fields.

**Missing Client Data**:
```typescript
if (!client) {
  return {
    error: "Client context required for this form",
    requiredData: ["client"],
  }
}

if (!client.passportNumber && formRequires.includes("passport")) {
  missingFields.push({
    field: "passport_number",
    label: "Passport Number",
    location: "Page 1, Section A",
  })
}
```

**Missing Matter Data**:
```typescript
if (formRequires.includes("matter") && !matter) {
  // Show warning but allow generation
  warnings.push("Matter not selected. Some fields may be empty.")
}
```

**Invalid Data Format**:
```typescript
if (client.dateOfBirth) {
  try {
    const formattedDate = format(new Date(client.dateOfBirth), 'yyyy-MM-dd')
    placeholders['date_of_birth'] = formattedDate
  } catch (error) {
    warnings.push("Invalid date format for Date of Birth")
    placeholders['date_of_birth'] = ''
  }
}
```

---

## Testing Strategy

### Unit Tests

```typescript
describe("Auto-Fill Generation", () => {
  it("fills all available fields", async () => {
    const result = await generateAutoFill({
      kbItemId: "work-permit-form",
      clientId: "client-123",
      matterId: "matter-456",
    })

    expect(result.filledFields).toHaveLength(35)
    expect(result.missingFields).toHaveLength(2)
  })

  it("applies DRAFT watermark", async () => {
    const pdfBytes = await generatePDF(/* params */)
    const pdfDoc = await PDFDocument.load(pdfBytes)
    const page = pdfDoc.getPages()[0]
    const textContent = await page.getTextContent()

    expect(textContent).toContain("DRAFT")
  })

  it("handles missing client data gracefully", async () => {
    const result = await generateAutoFill({
      kbItemId: "tax-form",
      clientId: "incomplete-client", // Missing TIN
    })

    expect(result.warnings).toContain("TIN not found")
    expect(result.missingFields).toContainEqual({
      field: "tin",
      label: "TIN",
    })
  })
})
```

### E2E Tests

```typescript
test("staff can auto-fill and download form", async ({ page }) => {
  await page.goto("/app/knowledge-base")
  await page.click("text=Work Permit Application")
  await page.click("text=Auto-Fill")

  // Select client
  await page.selectOption('select[name="clientId"]', clientId)

  // Generate
  await page.click("text=Generate")

  // Preview modal appears
  await expect(page.locator("text=Preview")).toBeVisible()
  await expect(page.locator("text=DRAFT")).toBeVisible()

  // Download
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click("text=Download PDF"),
  ])

  expect(download.suggestedFilename()).toMatch(/Work-Permit.*DRAFT\.pdf/)
})
```

---

## Performance Requirements

- **Generation Time**: < 2 seconds for simple forms (1-3 pages)
- **Preview Load**: < 1 second to display preview
- **File Size**: Optimized PDFs < 500KB (forms), < 2MB (letters with logos)
- **Concurrent Requests**: Handle 10 simultaneous auto-fill requests

---

## Success Metrics

- **Adoption**: 70% of staff use auto-fill weekly
- **Time Savings**: 90% reduction in form completion time (25 min → 2.5 min)
- **Error Reduction**: 95% reduction in data entry errors
- **User Satisfaction**: 4.5/5 rating from staff
- **Coverage**: 80% of government forms support auto-fill

---

## Open Questions

1. Should we support auto-fill in multiple languages?
2. Should clients be able to auto-fill forms from portal?
3. Integration with e-signature services (DocuSign, Adobe Sign)?
4. Auto-submit to government portals (future API integrations)?

---

**Version**: 1.0
**Next Review**: After proof-of-concept
**Dependencies**: pdf-lib, @react-pdf/renderer
**Related**: [Knowledge Base System](./knowledge-base-system.md), [Document Management](./document-management-system.md)
