---
name: business-context
description: Understand GCMC and KAJ business services, Guyana-specific requirements, and domain knowledge. Use when implementing features related to tax, immigration, training, NIS, GRA, or business services. Triggers on: GCMC, KAJ, tax, immigration, training, Guyana, NIS, GRA, business services, matter, client.
---

# GK-Nexus Business Context

## Overview

GK-Nexus serves two businesses in Guyana:

1. **GCMC** - Green Crescent Management Consultancy
   - Training, consulting, immigration, paralegal services

2. **KAJ** - Kareem Abdul-Jabar Tax & Accounting Services
   - Tax compliance, accounting, NIS services

## Business Enum

```typescript
type Business = "GCMC" | "KAJ";

// Staff can work for one or both businesses
type StaffRole =
  | "OWNER"           // Full access to both
  | "GCMC_MANAGER"    // Manages GCMC operations
  | "KAJ_MANAGER"     // Manages KAJ operations
  | "STAFF_GCMC"      // GCMC staff member
  | "STAFF_KAJ"       // KAJ staff member
  | "STAFF_BOTH"      // Works for both businesses
  | "RECEPTIONIST";   // Front desk, limited access
```

## Business Access Control

```typescript
// Check if staff can access a business
function canAccessBusiness(staff: Staff, business: Business): boolean {
  const role = staff.role;
  if (role === "OWNER") return true;
  if (role === "STAFF_BOTH") return true;

  if (business === "GCMC") {
    return ["GCMC_MANAGER", "STAFF_GCMC", "RECEPTIONIST"].includes(role);
  }
  if (business === "KAJ") {
    return ["KAJ_MANAGER", "STAFF_KAJ", "RECEPTIONIST"].includes(role);
  }
  return false;
}

// Get accessible businesses for staff
function getAccessibleBusinesses(staff: Staff): Business[] {
  const role = staff.role;
  if (["OWNER", "STAFF_BOTH", "RECEPTIONIST"].includes(role)) {
    return ["GCMC", "KAJ"];
  }
  if (["GCMC_MANAGER", "STAFF_GCMC"].includes(role)) {
    return ["GCMC"];
  }
  if (["KAJ_MANAGER", "STAFF_KAJ"].includes(role)) {
    return ["KAJ"];
  }
  return [];
}
```

---

## GCMC Services

### Training Services
- Human Resource Management Training
- Customer Relations Training
- Supervisory Management Training
- Business Development Training
- Custom Corporate Training Programs

### Consulting Services
- Business Development Consulting
- Management Consulting
- Organizational Development
- Strategic Planning

### Paralegal Services
- Affidavits and Statutory Declarations
- Legal Agreements and Contracts
- Wills and Estate Planning
- Power of Attorney Documents
- Notarization Services

### Immigration Services
- Work Permit Applications
- Work Permit Renewals
- Citizenship Applications
- Business Visas
- Immigration Consultation

### Business Registration
- Company Incorporation
- Business Name Registration
- Partnership Registration
- NGO/Co-operative Registration
- Trade License Applications

### Business Proposals
- Land Application Proposals
- Investment Proposals
- Start-up Business Plans
- Loan Applications
- Grant Proposals

---

## KAJ Services

### Tax Services
- Individual Income Tax Returns
- Corporate Income Tax Returns
- Self-Employed Tax Returns
- Tax Planning and Advisory
- Tax Compliance Letters (for tenders, work permits)

### Compliance Services
- Tender Compliance Certificates
- Work Permit Tax Compliance
- Land Transfer Tax Compliance
- Business License Renewals
- Regulatory Compliance

### PAYE Services
- Monthly PAYE Returns
- Annual PAYE Returns
- PAYE Reconciliation
- Employee Tax Registration

### Financial Statements
- Income/Expenditure Statements
- Balance Sheets
- Cash Flow Statements
- Financial Audits (NGOs, Co-ops)

### NIS Services
- Employer NIS Registration
- Employee NIS Registration
- NIS Contribution Processing
- NIS Pension Applications
- NIS Benefits Claims

### Accounting Services
- Bookkeeping
- Payroll Processing
- Accounts Receivable/Payable
- Financial Reporting
- QuickBooks Setup/Support

---

## Guyana-Specific Requirements

### GRA (Guyana Revenue Authority)
- Tax ID Numbers (TIN)
- VAT Registration
- Tax Return Filing Deadlines
- Compliance Certificate Requirements

### NIS (National Insurance Scheme)
- Employer Registration
- Employee Contribution Rates
- Pension Eligibility
- Injury/Sickness Benefits

### Common Documents
- National ID (required for tax filing)
- TIN Certificate
- NIS Card/Number
- Business Registration Certificate
- Trade License

### Currency
- All financial amounts in Guyanese Dollars (GYD)
- Format: $1,000,000.00 GYD

### Date Format
- DD/MM/YYYY (British format)
- Financial Year: January 1 - December 31

### Contact Information Format
- Phone: 592-XXX-XXXX (country code + 7 digits)
- Mobile: 592-6XX-XXXX

---

## Matter Types by Business

### GCMC Matter Types
```typescript
const gcmcMatterTypes = [
  "TRAINING",
  "CONSULTING",
  "IMMIGRATION",
  "PARALEGAL",
  "BUSINESS_REGISTRATION",
  "BUSINESS_PROPOSAL",
  "OTHER_GCMC",
];
```

### KAJ Matter Types
```typescript
const kajMatterTypes = [
  "TAX_RETURN",
  "COMPLIANCE",
  "PAYE",
  "FINANCIAL_STATEMENT",
  "NIS_SERVICES",
  "BOOKKEEPING",
  "AUDIT",
  "OTHER_KAJ",
];
```

---

## Client Types

```typescript
type ClientType =
  | "INDIVIDUAL"        // Personal tax, training
  | "SOLE_PROPRIETOR"   // Small business owner
  | "PARTNERSHIP"       // Business partnership
  | "COMPANY"           // Limited liability company
  | "NGO"               // Non-governmental organization
  | "COOPERATIVE"       // Co-operative society
  | "GOVERNMENT"        // Government agency
  | "FOREIGN";          // Foreign entity (work permits)
```

---

## Deadline Categories

### Tax Deadlines
- Individual Returns: April 30
- Corporate Returns: April 30 (or 3 months after FY end)
- PAYE Monthly: 14th of following month
- PAYE Annual: March 31

### Immigration Deadlines
- Work Permit Renewals: 30 days before expiry
- Visa Applications: Varies by type

### Compliance Deadlines
- Trade License: Annual renewal
- Business Registration: Annual return

---

## Implementation Notes

### When Building Features

1. **Always filter by business** - Staff should only see data they have access to
2. **Use business enum** - All entities should have a `business` field
3. **Check role permissions** - Use appropriate procedure types (gcmcProcedure, kajProcedure)
4. **Format currency correctly** - GYD with proper thousands separators
5. **Use local date format** - DD/MM/YYYY
6. **Validate Guyana phone numbers** - 592-XXX-XXXX format

### Service Categories for Pricing

```typescript
// GCMC service categories
const gcmcCategories = [
  { name: "Training", prefix: "TRN" },
  { name: "Immigration", prefix: "IMM" },
  { name: "Paralegal", prefix: "PLG" },
  { name: "Business Services", prefix: "BUS" },
];

// KAJ service categories
const kajCategories = [
  { name: "Tax Services", prefix: "TAX" },
  { name: "Compliance", prefix: "CMP" },
  { name: "NIS Services", prefix: "NIS" },
  { name: "Accounting", prefix: "ACC" },
];
```

---

## Database Schema Pattern

```typescript
// Example: Matters table with business context
export const matters = pgTable("matters", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  clientId: text("client_id").notNull().references(() => clients.id),
  // Business assignment
  business: businessEnum("business").notNull(),
  // Matter type specific to business
  matterType: text("matter_type").notNull(),
  // Standard fields
  status: matterStatusEnum("status").default("OPEN").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

## Critical Business Rules

1. **Data isolation** - GCMC and KAJ data should be filterable separately
2. **Staff access** - Staff only see data for businesses they work for
3. **Client sharing** - Clients can have matters with both businesses
4. **Pricing separation** - Each business has its own service catalog
5. **Financial access** - Only authorized staff see invoices/payments
