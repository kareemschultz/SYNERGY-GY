# GK-Nexus Data Import & Export Specification

This document defines the import and export functionality for all data modules in GK-Nexus.

> **⚠️ NO MOCK DATA POLICY**: Import functionality must only accept real, validated data. Never provide sample/demo import files with fake data. See [NO MOCK DATA Policy](./README.md#critical-development-policy-no-mock-data).

---

## Overview

### Supported Modules

| Module | Export | Import | Phase |
|--------|--------|--------|-------|
| Clients | ✅ | ✅ | Phase 2 |
| Matters | ✅ | ❌ | Phase 2 |
| Documents | ✅ (metadata) | ❌ | Phase 2 |
| Deadlines | ✅ | ✅ | Phase 2 |
| Invoices | ✅ | ❌ | Phase 2 |
| Reports | ✅ | ❌ | Phase 3 |
| Activity Logs | ✅ | ❌ | Phase 3 |

### Supported Formats

| Format | Export | Import | Use Case |
|--------|--------|--------|----------|
| CSV | ✅ | ✅ | Universal compatibility |
| Excel (XLSX) | ✅ | ✅ | Spreadsheet users |
| PDF | ✅ | ❌ | Reports, printing |
| JSON | ✅ | ❌ | API/technical use |
| iCal | ✅ | ❌ | Calendar sync |

---

## Export Functionality

### Common Export Features

#### Export Button Placement
```
┌──────────────────────────────────────────────────────────────────────┐
│ Clients                                  [🔍 Search] [+ New Client]  │
├──────────────────────────────────────────────────────────────────────┤
│ [Filters ▼] [Columns ▼] [📥 Export ▼]    Showing 1-25 of 127        │
│                         ┌─────────────┐                              │
│                         │ Export As:  │                              │
│                         │ ○ CSV       │                              │
│                         │ ○ Excel     │                              │
│                         │ ○ PDF       │                              │
│                         ├─────────────┤                              │
│                         │ Export:     │                              │
│                         │ ○ All (127) │                              │
│                         │ ○ Selected  │                              │
│                         │ ○ Filtered  │                              │
│                         └─────────────┘                              │
└──────────────────────────────────────────────────────────────────────┘
```

#### Export Options
- **All Data**: Export entire dataset (with pagination bypass)
- **Selected Rows**: Export only rows selected via checkbox
- **Filtered Results**: Export only current filter results
- **Current Page**: Export only visible page

#### Export Limits
- CSV: Unlimited rows
- Excel: 50,000 rows maximum (Excel limitation)
- PDF: 1,000 rows maximum (performance/readability)

---

### Client Export

#### CSV/Excel Columns
| Column | Type | Description |
|--------|------|-------------|
| ID | UUID | System identifier (hidden in UI) |
| Display Name | Text | Client name |
| Type | Enum | INDIVIDUAL / BUSINESS |
| Email | Text | Primary email |
| Phone | Text | Primary phone |
| TIN | Text | Tax Identification Number |
| Business | Enum | GCMC / KAJ |
| Status | Enum | ACTIVE / INACTIVE / PROSPECT |
| Address | Text | Full address |
| Created Date | Date | ISO 8601 format |
| Total Matters | Number | Count of associated matters |
| Primary Contact | Text | Contact name (for businesses) |

#### PDF Export
- Formatted table with company header
- Date range and filters shown
- Page numbers
- Print-optimized layout

---

### Matter Export

#### CSV/Excel Columns
| Column | Type | Description |
|--------|------|-------------|
| Reference Number | Text | GCMC-2024-0001 format |
| Client Name | Text | Associated client |
| Service Type | Text | Service being provided |
| Status | Enum | DRAFT / IN_PROGRESS / etc. |
| Priority | Enum | LOW / MEDIUM / HIGH / URGENT |
| Start Date | Date | Matter start date |
| Target Date | Date | Expected completion |
| Completed Date | Date | Actual completion |
| Assigned Staff | Text | Staff member name |
| Notes Count | Number | Number of notes |
| Documents Count | Number | Number of documents |
| Checklist Progress | Text | "5/10 complete" format |

---

### Deadline Export

#### CSV/Excel Columns
| Column | Type | Description |
|--------|------|-------------|
| Title | Text | Deadline description |
| Due Date | Date | ISO 8601 |
| Due Time | Time | If time-specific |
| Type | Enum | TAX_FILING / RENEWAL / etc. |
| Priority | Enum | LOW / MEDIUM / HIGH / URGENT |
| Status | Enum | PENDING / COMPLETED / OVERDUE |
| Client Name | Text | Associated client |
| Matter Reference | Text | Associated matter |
| Reminder | Text | Days before due |
| Recurrence | Enum | NONE / WEEKLY / MONTHLY / etc. |

#### iCal Export
```ical
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//GK-Nexus//Deadlines//EN
BEGIN:VEVENT
UID:deadline-uuid-123@gknexus
DTSTART:20240315
DTEND:20240315
SUMMARY:Tax Filing - ABC Corp
DESCRIPTION:Annual tax return submission
CATEGORIES:TAX_FILING,HIGH_PRIORITY
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR
```

---

### Invoice Export

#### PDF Export Features
- Professional invoice template
- Company letterhead
- Line items with descriptions
- Tax calculations
- Payment terms
- Bank details for wire transfer
- QR code for online payment (optional)

#### CSV/Excel Columns
| Column | Type | Description |
|--------|------|-------------|
| Invoice Number | Text | INV-2024-0001 format |
| Client Name | Text | Bill to |
| Issue Date | Date | Invoice date |
| Due Date | Date | Payment deadline |
| Matter Reference | Text | Related matter |
| Subtotal | Currency | Before tax |
| VAT | Currency | VAT amount |
| Total | Currency | Final amount (GYD) |
| Status | Enum | DRAFT / SENT / PAID / OVERDUE |
| Payment Date | Date | If paid |

---

## Import Functionality

### Import Process Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Select File    │ ──▶ │  Validate Data  │ ──▶ │  Preview Import │
│  (CSV/Excel)    │     │  (Show Errors)  │     │  (Review Rows)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
┌─────────────────┐     ┌─────────────────┐            ▼
│  Import Report  │ ◀── │  Process Import │ ◀── ┌─────────────────┐
│  (Success/Fail) │     │  (Transaction)  │     │  Confirm Import │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Import UI

```
┌──────────────────────────────────────────────────────────────────────┐
│ Import Clients                                               [✕]     │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Step 1: Upload File                                                 │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │                                                            │     │
│  │              📁 Drag and drop your file here               │     │
│  │                         or                                 │     │
│  │                  [Browse Files]                            │     │
│  │                                                            │     │
│  │            Supported: .csv, .xlsx (max 5MB)                │     │
│  │                                                            │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                      │
│  📄 Download template: [CSV Template] [Excel Template]               │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

```
┌──────────────────────────────────────────────────────────────────────┐
│ Import Clients                                               [✕]     │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Step 2: Validation Results                                          │
│                                                                      │
│  ✅ 45 valid rows ready to import                                    │
│  ⚠️ 3 rows with warnings (will be skipped)                           │
│  ❌ 2 rows with errors (will be skipped)                             │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │ Row │ Status  │ Issue                                      │     │
│  ├─────┼─────────┼────────────────────────────────────────────┤     │
│  │  3  │ ⚠️ Warn │ Email "test@" is not valid - will skip     │     │
│  │  7  │ ❌ Error│ Required field "Display Name" is empty     │     │
│  │ 12  │ ⚠️ Warn │ Duplicate email "john@example.com"         │     │
│  │ 18  │ ❌ Error│ Invalid client type "Company"              │     │
│  │ 25  │ ⚠️ Warn │ TIN format invalid - will be skipped       │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                      │
│  [Cancel]                                      [Import 45 Clients]   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

### Client Import

#### Template Structure (CSV)
```csv
display_name,type,email,phone,tin,address,status,notes
"John Smith",INDIVIDUAL,john@example.com,+592-123-4567,123456789,"123 Main St, Georgetown",ACTIVE,"New client from referral"
"ABC Corp Ltd",BUSINESS,info@abccorp.gy,+592-987-6543,987654321,"456 Business Ave, Georgetown",ACTIVE,"Registered company"
```

#### Required Fields
- `display_name` (required)
- `type` (required): INDIVIDUAL or BUSINESS

#### Optional Fields
- `email`
- `phone`
- `tin`
- `address`
- `status` (defaults to ACTIVE)
- `notes`

#### Validation Rules
1. `display_name` cannot be empty
2. `type` must be INDIVIDUAL or BUSINESS
3. `email` must be valid format if provided
4. `tin` must be numeric if provided
5. No duplicate emails within import file
6. No duplicate of existing clients (by email)

#### Import Behavior
- **Duplicate Handling**: Skip duplicates, report in summary
- **Missing Optional Fields**: Set to null/empty
- **Invalid Rows**: Skip entire row, report error
- **Transaction**: All or nothing for valid rows

---

### Deadline Import

#### Template Structure (CSV)
```csv
title,due_date,type,priority,client_name,notes
"Tax Return Filing",2024-03-31,TAX_FILING,HIGH,"ABC Corp Ltd","Annual return"
"License Renewal",2024-06-15,RENEWAL,MEDIUM,"John Smith","Driver's license"
```

#### Required Fields
- `title` (required)
- `due_date` (required): YYYY-MM-DD format

#### Optional Fields
- `type` (defaults to OTHER)
- `priority` (defaults to MEDIUM)
- `client_name` (matched to existing client)
- `notes`

#### Validation Rules
1. `title` cannot be empty
2. `due_date` must be valid date in YYYY-MM-DD format
3. `due_date` cannot be in the past
4. `type` must match valid deadline types
5. `priority` must be LOW, MEDIUM, HIGH, or URGENT
6. `client_name` must match existing client (if provided)

---

## API Endpoints

### Export Endpoints

```typescript
// Clients
GET /api/clients/export?format=csv&filters=...
GET /api/clients/export?format=xlsx&ids=uuid1,uuid2
GET /api/clients/export?format=pdf&all=true

// Matters
GET /api/matters/export?format=csv
GET /api/matters/export?format=pdf&clientId=uuid

// Deadlines
GET /api/deadlines/export?format=csv
GET /api/deadlines/export?format=ical&range=month

// Invoices
GET /api/invoices/:id/pdf
GET /api/invoices/export?format=csv&dateRange=2024-01-01,2024-12-31
```

### Import Endpoints

```typescript
// Template downloads
GET /api/import/templates/clients.csv
GET /api/import/templates/clients.xlsx
GET /api/import/templates/deadlines.csv

// Import operations
POST /api/import/clients/validate
// Body: FormData with file
// Response: { valid: Row[], errors: Error[], warnings: Warning[] }

POST /api/import/clients/execute
// Body: { validatedRows: Row[] }
// Response: { imported: number, skipped: number, report: ImportReport }
```

---

## Security Considerations

### Export Security
- All exports require authentication
- Staff can only export data from their business (GCMC/KAJ)
- Activity logging for all exports
- Rate limiting on bulk exports
- Sensitive fields (passwords, tokens) never exported

### Import Security
- File type validation (not just extension)
- File size limit (5MB)
- Malware scanning on upload
- Input sanitization (XSS prevention)
- SQL injection prevention (parameterized queries)
- Import within authenticated session only
- Business filtering applied to imported data

---

## Error Handling

### Export Errors
| Error | Message | Action |
|-------|---------|--------|
| No data | "No data matches your criteria" | Adjust filters |
| Too many rows | "Export limited to 50,000 rows" | Apply filters |
| Generation failed | "Export failed. Please try again." | Retry |
| Permission denied | "You don't have permission to export" | Contact admin |

### Import Errors
| Error | Message | Action |
|-------|---------|--------|
| Invalid file | "Please upload a CSV or Excel file" | Choose correct file |
| File too large | "File exceeds 5MB limit" | Split file |
| No valid rows | "No valid data found in file" | Check template |
| Column mismatch | "Missing required column: display_name" | Check headers |
| Duplicate detected | "Row 5: Email already exists" | Remove duplicate |

---

## Implementation Checklist

### Phase 2 Implementation
- [ ] Client CSV export
- [ ] Client Excel export
- [ ] Client PDF export (basic table)
- [ ] Client CSV import
- [ ] Client Excel import
- [ ] Import validation UI
- [ ] Import preview UI
- [ ] Import result report
- [ ] Matter CSV export
- [ ] Matter Excel export
- [ ] Deadline CSV export
- [ ] Deadline iCal export
- [ ] Deadline CSV import
- [ ] Invoice PDF export
- [ ] Invoice CSV export
- [ ] Download template endpoint
- [ ] Export audit logging
- [ ] Import audit logging

### Phase 3 Implementation
- [ ] Report PDF export
- [ ] Report Excel export
- [ ] Activity log export
- [ ] Bulk document metadata export
- [ ] Advanced export scheduling
- [ ] Email export delivery

---

## Template Downloads

> **⚠️ NO MOCK DATA**: Templates contain only header rows with column definitions. No sample data rows are included.

### Client Import Template (CSV)
```csv
display_name,type,email,phone,tin,address,status,notes
```

### Client Import Template (Excel)
- Sheet 1: Import data (with headers and validation dropdowns)
- Sheet 2: Instructions and field descriptions
- Sheet 3: Valid values reference (INDIVIDUAL/BUSINESS, status values)

### Deadline Import Template (CSV)
```csv
title,due_date,type,priority,client_name,notes
```

---

*Last Updated: December 2024*
