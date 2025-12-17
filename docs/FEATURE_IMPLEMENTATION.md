# GK-Nexus Feature Implementation Documentation

**Last Updated:** December 17, 2024
**Version:** 1.0.0
**Status:** Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Phase 1 - Core Platform](#phase-1---core-platform)
3. [Phase 2 - Enhanced Features](#phase-2---enhanced-features)
4. [Phase 3 - Integrations](#phase-3---integrations)
5. [Recent Implementations](#recent-implementations)
6. [Technical Architecture](#technical-architecture)
7. [API Reference](#api-reference)
8. [Testing Guidelines](#testing-guidelines)

---

## Overview

GK-Nexus is a comprehensive business management platform designed for professional services firms in Guyana, specifically GCMC (Green Crescent Management Consultancy) and KAJ (Kareem Abdul-Jabar Tax & Accounting Services).

### Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React + Vite + TanStack Router | 19.x / 6.x / 1.x |
| Backend | Hono + Bun | 4.x / 1.2 |
| Database | PostgreSQL + Drizzle ORM | 17 / 0.45 |
| Auth | Better-Auth | 1.4 |
| API | oRPC | 1.12 |
| Styling | TailwindCSS + shadcn/ui | 4.x |

### Key Principles

- **No Mock Data**: All data is user-created through the application
- **Type Safety**: Full TypeScript with Zod validation
- **Role-Based Access**: 7 staff roles with business-specific permissions
- **Security First**: Non-root containers, read-only filesystems, capability drops

---

## Phase 1 - Core Platform

### 1.1 Client Management

**Location:** `/app/clients`

**Features:**
- Comprehensive client profiles with contact information
- Client classification (Individual, Small Business, Corporation, NGO, etc.)
- Status tracking (Active, Inactive, Archived)
- AML risk rating (Low, Medium, High)
- Portal access management
- Bulk actions (Archive, Export CSV, Update Status, Assign Staff)

**API Endpoints:**
```typescript
// Router: clients
clients.list({ page, limit, search, status, type, business })
clients.create({ ... })
clients.update({ id, ... })
clients.delete({ id })
clients.bulk.archive({ ids })
clients.bulk.export({ ids })
clients.bulk.updateStatus({ ids, status })
clients.bulk.assignStaff({ ids, staffId })
```

**Database Schema:**
```typescript
// packages/db/src/schema/clients.ts
export const client = pgTable("client", {
  id: varchar("id", { length: 21 }).primaryKey(),
  displayName: varchar("display_name", { length: 255 }).notNull(),
  clientType: clientTypeEnum("client_type").notNull(),
  business: businessEnum("business").notNull(),
  status: varchar("status", { length: 20 }).default("ACTIVE"),
  amlRiskRating: varchar("aml_risk_rating", { length: 20 }),
  // ... additional fields
});
```

### 1.2 Matter Tracking

**Location:** `/app/matters`

**Features:**
- Case/project organization
- Status workflow (New → In Progress → Pending Client → Submitted → Complete)
- Priority levels (Low, Normal, High, Urgent)
- Staff assignment and tracking
- Document and invoice linking
- Matter-to-matter relationships
- Creation wizard for guided setup

**Status Flow:**
```
NEW → IN_PROGRESS → PENDING_CLIENT → SUBMITTED → COMPLETE
                 ↓
              CANCELLED
```

### 1.3 Document Management

**Location:** `/app/documents`

**Features:**
- Centralized document storage
- 9 document categories (Identity, Tax, Financial, Legal, etc.)
- File type support (PDF, DOCX, images, etc.)
- Document templates with placeholders
- Expiration tracking and alerts
- Collection requests from clients
- Bulk actions (Archive, Change Category)
- **NEW:** Advanced filtering (file type, status, date range)

**API Endpoints:**
```typescript
documents.list({ page, limit, search, category, status })
documents.upload({ file, clientId?, matterId?, category })
documents.getDownloadUrl({ id })
documents.archive({ id })
documents.bulk.archive({ ids })
documents.bulk.updateCategory({ ids, category })
```

### 1.4 Deadline Calendar

**Location:** `/app/calendar`

**Features:**
- Calendar view with filtering
- Deadline integration with matters
- Email notifications (via Resend)
- Recurring deadline support
- Priority-based color coding

### 1.5 Dashboard

**Location:** `/app`

**Features:**
- Real-time insights
- Upcoming deadlines overview
- Recent activities feed
- Key performance metrics
- Quick access shortcuts

---

## Phase 2 - Enhanced Features

### 2.1 Admin Panel

**Location:** `/app/admin`

#### Staff Management (`/app/admin/staff`)
- Staff listing with role badges
- Create/Edit/Deactivate staff
- Role assignment
- Business access configuration

#### Roles & Permissions (`/app/admin/roles`)
- 7 role definitions with permissions matrix
- Role statistics
- Business access requirements

#### System Settings (`/app/admin/settings`)
- Application info display
- Backup system status
- Staff overview by business
- Quick action links

#### Service Catalog (`/app/admin/services`)
- Service CRUD operations
- Pricing tiers management
- Document requirements
- Deliverables listing
- Government fees tracking
- Edit/Delete functionality
- Service detail page (`/app/admin/services/$serviceId`)

### 2.2 Invoice Generation

**Location:** `/app/invoices`

**Features:**
- Professional invoice creation
- Status tracking (Draft, Sent, Paid, Overdue, Cancelled)
- Line items with service catalog integration
- Discount support (Percentage or Fixed)
- Multiple payment methods
- PDF export
- Auto-generated invoice numbers (GK-2024-0001)
- **ServicePicker:** Add services from catalog directly

**Invoice Number Format:**
```
GK-{YEAR}-{SEQUENCE}
Example: GK-2024-0001
```

### 2.3 Tax Calculators

**Location:** `/app/calculators`

#### PAYE Calculator (`/app/calculators/paye`)
- Monthly income input
- Personal allowance (default $1,560,000/year)
- Other deductions
- Progressive tax calculation
- Save calculation history

#### VAT Calculator (`/app/calculators/vat`)
- Add or extract VAT
- 14% standard rate
- Bidirectional calculation

#### NIS Calculator (`/app/calculators/nis`)
- Employee/Employer/Both views
- 5.6% employee rate
- 8.4% employer rate
- $280,000 monthly ceiling (2025)

#### **NEW: Payroll Calculator** (`/app/calculators/salary`)
- Comprehensive net pay calculation
- Multi-frequency support (daily/weekly/fortnightly/monthly/yearly)
- Progressive PAYE brackets (25%/35%)
- NIS deductions
- Optional gratuity (22.5%)
- Qualification allowances
- Child deductions
- Employer cost breakdown
- Effective rate visualization

**2025 Tax Rates:**
```typescript
const TAX_RATES = {
  PAYE: {
    FIRST_BRACKET_RATE: 0.25,    // 25% on first $3.12M
    SECOND_BRACKET_RATE: 0.35,   // 35% above $3.12M
    FIRST_BRACKET_THRESHOLD: 3_120_000,
    PERSONAL_ALLOWANCE: 1_560_000, // $130,000/month
  },
  NIS: {
    EMPLOYEE_RATE: 0.056,  // 5.6%
    EMPLOYER_RATE: 0.084,  // 8.4%
    MONTHLY_CEILING: 280_000,
  },
  SALARY: {
    GRATUITY_RATE: 0.225,  // 22.5%
    QUALIFICATION_ALLOWANCES: {
      NONE: 0,
      CERTIFICATE: 50_000,
      DIPLOMA: 100_000,
      BACHELORS: 150_000,
      MASTERS: 200_000,
      DOCTORATE: 250_000,
    },
    CHILD_DEDUCTION: 10_000,
    MAX_CHILD_DEDUCTIONS: 4,
  },
};
```

### 2.4 Training Management

**Location:** `/app/training`

**Features:**
- Course schedules
- Enrollment tracking
- Certificate generation
- Schedule detail pages

### 2.5 Appointment Scheduling

**Location:** `/app/appointments`

**Features:**
- Booking system
- Availability management
- Calendar integration

### 2.6 Client Portal

**Location:** `/portal`

**Features:**
- Self-service access for clients
- Matter and document viewing
- Staff impersonation capability
- Activity tracking

### 2.7 User Settings

**Location:** `/app/settings`

**Sections:**
1. **Profile** - Name editing, avatar upload (NEW)
2. **Appearance** - Theme preferences
3. **Notifications** - Email notification settings
4. **Security** - Password change, session management, 2FA preview (NEW)
5. **About** - Application information

---

## Phase 3 - Integrations

### 3.1 Email Integration

**Provider:** Resend

**Features:**
- Transactional emails
- Deadline notifications
- Appointment reminders

**Configuration:**
```env
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=noreply@yourcompany.com
```

### 3.2 Reporting & Analytics

**Location:** `/app/reports`, `/app/analytics`

**Features:**
- Business reports with PDF/Excel export
- Analytics dashboard with charts
- Audit trail page
- Bulk data export

### 3.3 Knowledge Base

**Location:** `/app/knowledge-base`, `/app/admin/knowledge-base`

**Features:**
- FAQ management
- Training materials
- Admin interface

### 3.4 Backup & Restore

**Features:**
- Automated backup system
- S3-compatible cloud backup
- Scheduled backups
- Point-in-time recovery
- Disaster recovery procedures

**Files:**
- `scripts/backup.sh` - CLI backup
- `scripts/restore.sh` - CLI restore
- `packages/api/src/routers/backup.ts` - API endpoints

---

## Recent Implementations

### December 17, 2024

#### Payroll Calculator
**Backend:** `packages/api/src/routers/tax-calculators.ts`
- Added `calculateSalary` endpoint with comprehensive payroll calculation
- Added `getTaxRates` endpoint for displaying current tax rates
- Updated `listHistory` and `saveCalculation` to support SALARY type

**Frontend:** `apps/web/src/routes/app/calculators/salary.tsx`
- Full-featured calculator UI with all input options
- Tax rates info cards at top
- Collapsible advanced options (qualification, children, deductions)
- Results display with net pay, deductions, tax breakdown, employer costs
- Save calculation functionality

**Calculator Index:** `apps/web/src/routes/app/calculators/index.tsx`
- Added Payroll Calculator card (highlighted as primary)
- Updated grid layout to 4 columns

#### Document Filtering Enhancements
**File:** `apps/web/src/routes/app/documents/index.tsx`
- File type filter (PDF, Images, Word, Spreadsheets, Other)
- Status filter (Active, Archived, All)
- Date range filter (From/To date inputs)
- Collapsible filter panel
- Active filter count badge
- Clear all filters button

#### User Settings Enhancements
**Profile Settings:** `apps/web/src/components/settings/profile-settings.tsx`
- Avatar upload with preview
- Camera icon overlay on avatar
- File validation (image type, max 5MB)
- Upload button alternative

**Security Settings:** `apps/web/src/components/settings/security-settings.tsx`
- Two-Factor Authentication section
- Authenticator App option (Coming Soon)
- SMS Verification option (Coming Soon)
- Security info banner

---

## Technical Architecture

### Project Structure

```
gk-nexus/
├── apps/
│   ├── web/              # React frontend
│   │   ├── src/
│   │   │   ├── components/   # Reusable UI components
│   │   │   ├── routes/       # File-based routing (TanStack)
│   │   │   ├── hooks/        # Custom React hooks
│   │   │   └── utils/        # Utilities
│   │   └── vite.config.ts
│   ├── server/           # Hono backend
│   │   └── src/
│   │       └── index.ts
│   └── docs/             # Starlight documentation
├── packages/
│   ├── api/              # oRPC routers
│   │   └── src/
│   │       └── routers/
│   ├── auth/             # Better-Auth config
│   ├── db/               # Drizzle schema
│   │   └── src/
│   │       └── schema/
│   └── config/           # Shared config
├── docs/                 # Documentation
├── specs/                # Technical specifications
└── scripts/              # Build/deployment scripts
```

### oRPC Pattern (IMPORTANT)

**Problem:** 3-level nested oRPC paths don't work with `createTanstackQueryUtils`

**Solution:** Use `useQuery`/`useMutation` directly from `@tanstack/react-query`

```typescript
// ❌ WRONG - 3-level nested paths fail
orpc.clientServices.getFulfillmentProgress.useQuery({ clientId })

// ✅ CORRECT - Direct useQuery with client
import { useQuery } from "@tanstack/react-query";
import { client } from "@/utils/orpc";

const { data } = useQuery({
  queryKey: ["clientServices", "getFulfillmentProgress", clientId],
  queryFn: () => client.clientServices.getFulfillmentProgress({ clientId }),
});
```

### Database Schema

**Key Tables:**
- `user` - Authentication users (Better-Auth)
- `staff` - Staff profiles with roles
- `client` - Client records
- `matter` - Cases/projects
- `document` - Uploaded files
- `invoice` - Invoices with line items
- `deadline` - Calendar deadlines
- `service` - Service catalog entries
- `tax_calculation` - Saved calculator results
- `system_backup` - Backup records

---

## API Reference

### Tax Calculators Router

```typescript
// Calculate Payroll
POST /api/taxCalculators/calculateSalary
Body: {
  grossSalary: number,
  frequency: "daily" | "weekly" | "fortnightly" | "monthly" | "yearly",
  includeGratuity: boolean,
  month?: number,           // 1-12
  qualificationLevel?: "NONE" | "CERTIFICATE" | "DIPLOMA" | "BACHELORS" | "MASTERS" | "DOCTORATE",
  numberOfChildren?: number, // 0-10
  otherDeductions?: number,
  pensionContribution?: number
}

Response: SalaryBreakdown

// Get Tax Rates
GET /api/taxCalculators/getTaxRates
Response: {
  paye: { firstBracketRate, secondBracketRate, firstBracketThreshold, personalAllowance },
  nis: { employeeRate, employerRate, monthlyCeiling },
  salary: { gratuityRate, qualificationAllowances, childDeduction, maxChildDeductions },
  vat: { rate }
}

// Save Calculation
POST /api/taxCalculators/saveCalculation
Body: {
  calculationType: "PAYE" | "VAT" | "NIS" | "SALARY",
  inputData: Record<string, unknown>,
  result: Record<string, unknown>
}
```

### Documents Router

```typescript
// List Documents
GET /api/documents/list
Query: {
  page: number,
  limit: number,
  search?: string,
  category?: string,
  status?: "ACTIVE" | "ARCHIVED"
}

// Get Stats
GET /api/documents/getStats
Response: {
  totalDocuments: number,
  totalSize: number,
  byCategory: Record<string, number>
}
```

---

## Testing Guidelines

### Unit Tests

```bash
# Run all tests
bun test

# Run specific test file
bun test packages/api/src/routers/tax-calculators.test.ts
```

### E2E Tests

```bash
# Run Playwright tests
bun run test:e2e
```

### Manual Testing Checklist

#### Payroll Calculator
- [ ] Enter gross salary and verify calculation
- [ ] Test all frequency options
- [ ] Toggle gratuity on/off
- [ ] Select different months (check June/December special)
- [ ] Enable advanced options
- [ ] Select different qualification levels
- [ ] Enter number of children
- [ ] Add other deductions
- [ ] Verify all result sections display correctly
- [ ] Save calculation and verify in history

#### Document Filters
- [ ] Search by document name
- [ ] Filter by category
- [ ] Filter by file type
- [ ] Filter by status
- [ ] Set date range
- [ ] Verify active filter count
- [ ] Clear all filters

#### User Settings
- [ ] Edit profile name
- [ ] Upload avatar (test file type validation)
- [ ] Upload avatar (test file size validation)
- [ ] View 2FA options (should show "Coming Soon")
- [ ] Change password
- [ ] View active sessions

---

## Appendix

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/gknexus

# Authentication
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:5173

# Email
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=noreply@yourcompany.com

# Backup (Optional)
BACKUP_S3_BUCKET=your-bucket
BACKUP_S3_REGION=us-east-1
BACKUP_S3_ACCESS_KEY=xxxx
BACKUP_S3_SECRET_KEY=xxxx
```

### Useful Commands

```bash
# Development
bun dev              # Start all apps
bun dev:web          # Start frontend only
bun dev:server       # Start backend only

# Database
bun run db:push      # Push schema changes
bun run db:studio    # Open Drizzle Studio

# Build
bun run build        # Build all apps
bun run type-check   # TypeScript check

# Code Quality
npx ultracite fix    # Format code
npx ultracite check  # Check code quality
```

---

**Document Version:** 1.0.0
**Last Updated:** December 17, 2024
**Author:** Claude Code Assistant
