# Invoicing & Payments

**Status:** Planned
**Phase:** 2
**Priority:** High
**Estimated Effort:** 3-4 weeks

## Overview

Generate invoices from matters, track payments, and manage accounts receivable. Support for Guyana Dollar (GYD) with proper formatting.

## Requirements

### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| INV-FR-01 | Generate invoice from matter | Must |
| INV-FR-02 | Manual invoice creation | Must |
| INV-FR-03 | Track payment status | Must |
| INV-FR-04 | Export invoice as PDF | Must |
| INV-FR-05 | Send invoice via email | Should |
| INV-FR-06 | Payment recording | Must |
| INV-FR-07 | Partial payments | Should |
| INV-FR-08 | Invoice numbering | Must |
| INV-FR-09 | Tax line items | Should |
| INV-FR-10 | Overdue reminders | Could |

### Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| INV-NFR-01 | PDF generation time | < 5 seconds |
| INV-NFR-02 | Invoice number uniqueness | Guaranteed |
| INV-NFR-03 | Currency precision | 2 decimal places |

## User Stories

### Staff
- As a staff member, I want to generate an invoice when completing a matter
- As a staff member, I want to track which invoices are paid
- As a staff member, I want to send invoices by email
- As a staff member, I want to record partial payments

### Manager
- As a manager, I want to see accounts receivable
- As a manager, I want overdue invoice reports
- As a manager, I want revenue reports by period

### Client (Portal)
- As a client, I want to view my invoices
- As a client, I want to download invoice PDFs

## Database Schema

### New Tables

#### `invoice`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| invoiceNumber | varchar(20) | Unique: INV-2024-0001 |
| clientId | uuid | Client FK |
| matterId | uuid | Matter FK (optional) |
| business | enum | GCMC or KAJ |
| issueDate | date | Invoice date |
| dueDate | date | Payment due date |
| subtotal | decimal | Before tax |
| taxAmount | decimal | Tax total |
| total | decimal | Grand total |
| amountPaid | decimal | Total paid |
| status | enum | DRAFT, SENT, PAID, PARTIAL, OVERDUE, CANCELLED |
| notes | text | Invoice notes |
| terms | text | Payment terms |
| createdById | uuid | Creator FK |
| createdAt | timestamp | Created date |
| updatedAt | timestamp | Updated date |
| sentAt | timestamp | When emailed |
| paidAt | timestamp | Fully paid date |

#### `invoiceItem`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| invoiceId | uuid | Invoice FK |
| description | varchar(500) | Item description |
| quantity | decimal | Quantity |
| unitPrice | decimal | Price per unit |
| amount | decimal | Line total |
| taxRate | decimal | Tax percentage |
| taxAmount | decimal | Tax for line |
| sortOrder | integer | Display order |

#### `payment`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| invoiceId | uuid | Invoice FK |
| amount | decimal | Payment amount |
| method | enum | CASH, BANK_TRANSFER, CHEQUE, CARD |
| reference | varchar(100) | Transaction reference |
| receivedDate | date | Payment date |
| notes | text | Payment notes |
| recordedById | uuid | Staff FK |
| recordedAt | timestamp | Record date |

### Invoice Number Format
```
INV-{YEAR}-{SEQUENCE}

Examples:
- INV-2024-0001
- INV-2024-0002
```

## API Endpoints

### Base: `/invoices`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/list` | Paginated list with filters |
| GET | `/getById` | Single invoice with items |
| POST | `/create` | Create invoice |
| POST | `/createFromMatter` | Generate from matter |
| PUT | `/update` | Update draft invoice |
| PUT | `/send` | Email invoice |
| GET | `/getPdf` | Generate PDF |
| DELETE | `/delete` | Delete draft |
| GET | `/getOverdue` | Overdue invoices |
| GET | `/getStats` | Revenue statistics |

### Payments: `/invoices/payments`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/record` | Record payment |
| GET | `/list` | Payment history |
| DELETE | `/delete` | Delete payment |

## UI Routes

```
/app/invoices/
├── index.tsx           # Invoice list
├── new.tsx             # Create invoice
├── $invoiceId.tsx      # Invoice detail
└── $invoiceId/edit.tsx # Edit draft
```

## UI Components

### Invoice List
- Filter by status, business, client
- Search by number, client name
- Status badges
- Quick actions (view, send, record payment)

### Invoice Create/Edit
- Client selection
- Matter selection (optional)
- Line items with add/remove
- Tax calculation
- Notes and terms

### Invoice Detail
- Header with status
- Line items table
- Payment history
- Actions (send, record payment, download PDF)

### Payment Dialog
- Amount field
- Method selection
- Reference field
- Date picker

## Invoice PDF Template

```
+------------------------------------------+
| [BUSINESS LOGO]                          |
|                                          |
| INVOICE                                  |
| Invoice #: INV-2024-0001                 |
| Date: December 10, 2024                  |
| Due: December 25, 2024                   |
+------------------------------------------+
| BILL TO:                                 |
| Client Name                              |
| Client Address                           |
| TIN: XXX-XXX-XXX                         |
+------------------------------------------+
| Description          | Qty | Rate | Amt |
|----------------------+-----+------+-----|
| Service description  |  1  | $X   | $X  |
| ...                  | ... | ...  | ... |
+------------------------------------------+
|                      Subtotal:    $X     |
|                      VAT (14%):   $X     |
|                      TOTAL:       $X GYD |
+------------------------------------------+
| Payment Terms:                           |
| Bank: Republic Bank                      |
| Account: XXXX-XXXX                       |
+------------------------------------------+
```

## Implementation Plan

### Week 1: Schema & API
- [ ] Create invoice schema
- [ ] Create invoice router
- [ ] Number generation logic
- [ ] Basic CRUD operations

### Week 2: UI
- [ ] Invoice list page
- [ ] Create invoice form
- [ ] Invoice detail page
- [ ] Payment recording

### Week 3: PDF & Email
- [ ] PDF generation
- [ ] Invoice template design
- [ ] Email sending
- [ ] Matter integration

### Week 4: Polish
- [ ] Overdue detection
- [ ] Reports
- [ ] Testing
- [ ] Documentation

## Business Rules

1. **Invoice Numbers**: Sequential per year, never reused
2. **Status Flow**: DRAFT -> SENT -> PARTIAL/PAID or OVERDUE
3. **Overdue**: Past due date and not fully paid
4. **From Matter**: Pre-populate with matter fee
5. **Tax**: Apply VAT if registered

## Currency

- Primary: Guyana Dollar (GYD)
- Format: $X,XXX.XX GYD
- Precision: 2 decimal places

## Dependencies

- Client management (Phase 1)
- Matter tracking (Phase 1)
- PDF generation library
- Email service

## Success Criteria

- [ ] 90% of invoices generated through system
- [ ] Average invoice creation time < 2 minutes
- [ ] Payment tracking accuracy 100%

---

## Implementation Requirements

### Database Setup
1. **Schema Creation**
   - Create invoice tables (`invoice`, `invoiceItem`, `payment`)
   - Add indexes on invoiceNumber, clientId, status, dueDate
   - Set up foreign key constraints
   - Create unique constraint on invoiceNumber
   - Add check constraints for amounts (non-negative)

2. **Invoice Numbering**
   - Implement sequence generator for invoice numbers
   - Format: INV-{YEAR}-{SEQUENCE}
   - Ensure atomic increment (prevent duplicates)
   - Handle year rollover (reset sequence)

### API Development
1. **Invoice Router** (`/invoices`)
   - GET `/list` - Paginated invoice list with filters (status, business, client, date range)
   - GET `/getById` - Single invoice with all items and payment history
   - POST `/create` - Create new invoice with validation
   - POST `/createFromMatter` - Generate invoice from matter with pre-populated items
   - PUT `/update` - Update draft invoice only
   - PUT `/send` - Mark as sent and trigger email
   - GET `/getPdf` - Generate and stream invoice PDF
   - DELETE `/delete` - Soft delete draft invoices only
   - GET `/getOverdue` - List overdue invoices
   - GET `/getStats` - Revenue statistics (total, paid, overdue by period)
   - All endpoints validate business access and permissions

2. **Payment Router** (`/invoices/payments`)
   - POST `/record` - Record payment and update invoice status
   - GET `/list` - Payment history with filters
   - DELETE `/delete` - Remove incorrect payment (recalculate invoice status)
   - Validate payment amount doesn't exceed invoice balance

3. **Input Validation**
   - Zod schemas for all invoice fields
   - Validate line item calculations (quantity × price = amount)
   - Ensure due date is after issue date
   - Validate total matches sum of items
   - Check client exists and is active

### UI Development
1. **Invoice Routes**
   - `/app/invoices/` - Invoice list page with filters and search
   - `/app/invoices/new` - Create invoice form
   - `/app/invoices/$invoiceId` - Invoice detail view
   - `/app/invoices/$invoiceId/edit` - Edit draft invoice

2. **Invoice List Page**
   - Table with columns: Number, Client, Date, Due Date, Total, Amount Paid, Status
   - Filter by status, business, date range
   - Search by invoice number or client name
   - Status badges (Draft, Sent, Paid, Partial, Overdue, Cancelled)
   - Quick actions: View, Send, Record Payment, Download PDF
   - Pagination with configurable page size
   - Export to CSV

3. **Invoice Create/Edit Form**
   - Client autocomplete search
   - Matter selection (optional, filters by client)
   - Business selection (GCMC or KAJ)
   - Issue date picker (defaults to today)
   - Due date picker (defaults to 14 days)
   - Dynamic line items table:
     - Add/remove rows
     - Description, quantity, unit price
     - Auto-calculate line total
     - Optional tax rate per line
   - Subtotal calculation
   - Tax calculation (optional VAT 14%)
   - Grand total display
   - Notes field
   - Payment terms field (default from settings)
   - Save as draft or send immediately

4. **Invoice Detail Page**
   - Invoice header with status badge
   - Client information
   - Matter information (if linked)
   - Line items table
   - Payment history with dates and methods
   - Balance remaining
   - Action buttons: Send Email, Record Payment, Download PDF, Edit (if draft), Cancel
   - Activity timeline

5. **Payment Dialog**
   - Amount field (validate against remaining balance)
   - Payment method dropdown (Cash, Bank Transfer, Cheque, Card)
   - Reference/transaction number field
   - Date picker (defaults to today)
   - Notes field
   - Auto-update invoice status on submit

6. **Components**
   - `<InvoiceTable>` - Sortable invoice list
   - `<InvoiceForm>` - Create/edit form
   - `<LineItemsEditor>` - Dynamic line items
   - `<PaymentRecordDialog>` - Payment entry
   - `<InvoicePreview>` - Print preview
   - `<StatusBadge>` - Color-coded status

### PDF Generation
1. **PDF Library Setup**
   - Install and configure pdf-lib or Puppeteer
   - Create invoice template with company branding
   - Support GCMC and KAJ letterheads
   - Include company details and logos

2. **Invoice Template**
   - Professional layout with headers and footers
   - Company information section
   - Client billing information
   - Invoice details (number, dates, terms)
   - Itemized line items table
   - Subtotal, tax, and total
   - Payment terms and banking details
   - Footer with thank you message
   - Watermark for draft/paid status

3. **PDF Features**
   - Generate on-demand (not pre-stored)
   - Proper currency formatting (GYD)
   - Page numbers for multi-page invoices
   - QR code for payment (future enhancement)

### Email Integration
1. **Email Templates**
   - Invoice email with PDF attachment
   - Payment confirmation email
   - Overdue reminder email
   - Professional formatting with company branding

2. **Email Sending**
   - Send invoice PDF as attachment
   - Include payment instructions in email body
   - Track email delivery status
   - Handle bounces and failures
   - Resend capability

### Business Logic
1. **Invoice Status Management**
   - DRAFT: Newly created, editable
   - SENT: Emailed to client, read-only
   - PARTIAL: Some payment received
   - PAID: Fully paid
   - OVERDUE: Past due date and not fully paid
   - CANCELLED: Voided invoice

2. **Status Transitions**
   - DRAFT → SENT (on send email)
   - SENT → PARTIAL (on first payment < total)
   - SENT/PARTIAL → PAID (on full payment)
   - SENT/PARTIAL → OVERDUE (on due date pass)
   - Any → CANCELLED (manual action)

3. **Payment Processing**
   - Record payment against invoice
   - Update amountPaid field
   - Recalculate status based on balance
   - Log payment in activity
   - Send confirmation email

4. **Overdue Detection**
   - Daily scheduled job to check due dates
   - Update status to OVERDUE if unpaid
   - Generate overdue list for follow-up
   - Optional automated reminder emails

### Matter Integration
1. **Generate from Matter**
   - Pre-populate client information
   - Add matter description as line item
   - Use matter fee as default amount
   - Link invoice to matter
   - Update matter status on invoice creation

### Currency Handling
1. **Guyana Dollar (GYD)**
   - Store all amounts as decimal (10,2)
   - Format display as: $X,XXX.XX GYD
   - Use proper thousand separators
   - Round to 2 decimal places
   - Handle currency in calculations

## Acceptance Criteria

### Invoice Creation
- [ ] Invoices can be created manually
- [ ] Invoices can be generated from matters
- [ ] Client selection working with autocomplete
- [ ] Line items can be added and removed
- [ ] Calculations accurate (subtotal, tax, total)
- [ ] Invoice saved as draft
- [ ] Invoice number generated correctly
- [ ] Invoice numbers are sequential and unique
- [ ] No duplicate invoice numbers

### Invoice Management
- [ ] Invoice list displays all invoices
- [ ] Filters work correctly (status, business, date)
- [ ] Search finds invoices by number and client
- [ ] Invoice detail shows all information
- [ ] Draft invoices can be edited
- [ ] Sent invoices are read-only
- [ ] Invoices can be cancelled with reason

### PDF Generation
- [ ] PDF generates successfully
- [ ] PDF matches invoice data
- [ ] Company branding appears correctly
- [ ] Line items formatted properly
- [ ] Currency formatted as GYD
- [ ] Multi-page invoices handled
- [ ] PDF downloads with proper filename
- [ ] Generation completes in under 5 seconds

### Email Sending
- [ ] Invoice emails sent successfully
- [ ] PDF attached to email
- [ ] Email content formatted correctly
- [ ] Delivery status tracked
- [ ] Failed sends logged and retryable
- [ ] Client receives readable email

### Payment Tracking
- [ ] Payments can be recorded
- [ ] Payment amount validated
- [ ] Payment method selected
- [ ] Payment reference captured
- [ ] Invoice status updates correctly
- [ ] Partial payments supported
- [ ] Multiple payments tracked
- [ ] Payment history displayed
- [ ] Balance calculated correctly
- [ ] Full payment marks invoice paid

### Overdue Management
- [ ] Overdue status set automatically
- [ ] Due date respected
- [ ] Overdue list accessible
- [ ] Overdue count on dashboard
- [ ] Reminder emails functional (if implemented)

### Status Management
- [ ] Status transitions work correctly
- [ ] Status badges display proper colors
- [ ] Status filters work
- [ ] Cannot edit sent invoices
- [ ] Cancelled invoices excluded from reports

### Integration
- [ ] Invoice links to correct client
- [ ] Invoice links to matter (if applicable)
- [ ] Matter invoices viewable from matter page
- [ ] Client invoices viewable from client page
- [ ] Activity logged for all invoice actions

### Performance
- [ ] Invoice list loads in under 2 seconds
- [ ] PDF generates in under 5 seconds
- [ ] Payment recording instant
- [ ] Search responsive
- [ ] Pagination smooth

### Security
- [ ] Only authorized users can create invoices
- [ ] Business access controlled
- [ ] Input validation prevents injection
- [ ] Amounts validated (non-negative)
- [ ] Cannot delete sent invoices
- [ ] Audit trail for all changes

## Test Cases

### Unit Tests
1. **Invoice Number Generation**
   - Test sequence increment
   - Test year rollover
   - Test uniqueness
   - Test format (INV-YYYY-NNNN)

2. **Calculations**
   - Test line item totals
   - Test subtotal calculation
   - Test tax calculation
   - Test grand total
   - Test payment balance

3. **Status Logic**
   - Test status transitions
   - Test overdue detection
   - Test payment status update

4. **Validation**
   - Test required fields
   - Test date validation (due after issue)
   - Test amount validation (non-negative)
   - Test payment amount (not exceed balance)

### Integration Tests
1. **Invoice Lifecycle**
   - Create draft → Edit → Send → Record payment → Mark paid

2. **From Matter Flow**
   - Select matter → Generate invoice → Verify pre-population

3. **Email Flow**
   - Send invoice → Generate PDF → Attach to email → Deliver

4. **Payment Flow**
   - Record payment → Update status → Send confirmation

### End-to-End Tests
1. **Complete Invoice Workflow**
   - Create invoice → Add items → Send to client → Client views PDF → Record payment → Invoice marked paid

2. **Overdue Workflow**
   - Create invoice → Send → Wait for due date → Check overdue status → Send reminder → Record payment

### Performance Tests
1. **Load Testing**
   - Generate 100 invoices
   - Generate 50 PDFs simultaneously
   - List page with 1000+ invoices

2. **PDF Generation**
   - Single-page invoice under 3 seconds
   - Multi-page invoice under 5 seconds
   - 10 concurrent PDF generations

## Dependencies from Phase 1

### Required Completions
1. **Client Management**
   - Client table with contact information
   - Client search functionality
   - Client detail pages

2. **Matter Tracking**
   - Matter table with fee information
   - Matter status management
   - Matter-client relationship

3. **Authentication & Authorization**
   - User roles and permissions
   - Business access control

4. **Activity Logging**
   - Activity table for audit trail
   - Logging middleware

### Integration Points
- Invoices link to clients from Phase 1
- Invoices can reference matters from Phase 1
- Invoice activities logged to Phase 1 activity system
- Business filter uses Phase 1 business enum
- Email service from Phase 1 (if available)
