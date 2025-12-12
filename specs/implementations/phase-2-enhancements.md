# Phase 2 Enhancements - December 2024

**Implemented:** December 11, 2024
**Status:** API Complete (Frontend UI Pending)

## Overview

Major backend enhancements adding appointment scheduling, enhanced client portal features, invoice discounts, aging reports, and role-based financial access control.

## Features Implemented

### 1. Appointment Management System

**Database Schema** (`packages/db/src/schema/appointments.ts`):
- `appointmentType` - Configurable appointment types with business, duration, color, approval settings
- `staffAvailability` - Weekly availability patterns (day, start/end time, business)
- `staffAvailabilityOverride` - Date-specific overrides (holidays, special hours)
- `appointment` - Core appointments with status workflow, location types
- `appointmentReminder` - Configurable reminders (EMAIL, SMS)

**Status Workflow:**
```
REQUESTED → CONFIRMED → COMPLETED
                    → CANCELLED
                    → NO_SHOW
                    → RESCHEDULED
```

**API Router** (`packages/api/src/routers/appointments.ts`):
- `list` - List appointments with filters (status, date range, client, staff)
- `getById` - Get appointment details
- `create` - Create new appointment (staff-initiated)
- `update` - Update appointment details
- `confirm` - Confirm requested appointment
- `cancel` - Cancel with reason
- `reschedule` - Reschedule to new time
- `complete` / `noShow` - Mark final status
- `types.*` - CRUD for appointment types
- `availability.*` - Staff availability management

### 2. Enhanced Client Portal

**Profile Endpoint** (`portal.profile`):
- Full client profile with TIN, national ID, passport
- Business registration details (for business clients)
- Summary stats: total/active/completed matters, document count

**Financials Sub-router** (`portal.financials.*`):
- `summary` - Outstanding balance, total invoiced/paid, overdue amounts
- `invoices` - Paginated invoice list with status filter
- `getInvoice` - Invoice detail with line items and payments
- `paymentHistory` - All payments across client's invoices

**Appointments Sub-router** (`portal.appointments.*`):
- `list` - Client's appointments with status/upcoming filters
- `getUpcoming` - Next 5 upcoming appointments
- `getAvailableTypes` - Appointment types for client's businesses
- `request` - Submit appointment request (requires staff approval)
- `cancel` - Cancel own appointments

### 3. Invoice Discounts & Aging Reports

**Schema Changes** (`packages/db/src/schema/invoices.ts`):
```typescript
discountType: NONE | PERCENTAGE | FIXED_AMOUNT
discountValue: decimal  // Percentage or fixed amount
discountAmount: decimal // Calculated discount in GYD
discountReason: text    // Optional note
```

**Total Calculation:** `totalAmount = subtotal + taxAmount - discountAmount`

**New API Endpoints** (`packages/api/src/routers/invoices.ts`):
- `getClientBalance` - Total invoiced/paid/outstanding per client
- `getAgingReport` - Breakdown by aging buckets:
  - Current (not yet due)
  - 1-30 days overdue
  - 31-60 days overdue
  - 61-90 days overdue
  - 90+ days overdue
- `applyDiscount` - Apply discount to DRAFT invoices

### 4. Financial Access Control

**Database Change** (`packages/db/src/schema/core.ts`):
```typescript
canViewFinancials: boolean // Nullable - uses role default if null
```

**API Helper** (`packages/api/src/index.ts`):
```typescript
function canViewFinancials(staff: Staff | null): boolean
// Returns true for OWNER, GCMC_MANAGER, KAJ_MANAGER
// Returns explicit flag value for others
// Returns false for null/inactive staff

const financialProcedure = staffProcedure.use(requireFinancialAccess)
```

**Role Defaults:**
| Role | Default Access |
|------|---------------|
| OWNER | ✅ Yes |
| GCMC_MANAGER | ✅ Yes |
| KAJ_MANAGER | ✅ Yes |
| STAFF_GCMC | ❌ No |
| STAFF_KAJ | ❌ No |
| STAFF_BOTH | ❌ No |
| RECEPTIONIST | ❌ No |

**Protected Features:**
- Client dashboard financials section (conditionally hidden)
- Invoice list/detail views
- Aging reports
- Client balance summaries

### 5. Enhanced Client Dashboard (Staff View)

**New Endpoint** (`clients.getDashboard`):
- Matters summary (by status, recent activity)
- Documents list (recent, by category)
- Financial summary (if staff has access)
- Recent communications
- Upcoming appointments

## Files Changed

### New Files
- `packages/db/src/schema/appointments.ts` - Appointment schema
- `packages/api/src/routers/appointments.ts` - Appointment API router
- `specs/phase-2/06-financial-access-control.md` - New spec

### Modified Files
- `packages/db/src/schema/core.ts` - Added `canViewFinancials` to staff
- `packages/db/src/schema/invoices.ts` - Added discount fields and enum
- `packages/db/src/schema/index.ts` - Export appointments schema
- `packages/api/src/index.ts` - Added `canViewFinancials()` and `financialProcedure`
- `packages/api/src/routers/index.ts` - Registered appointments router
- `packages/api/src/routers/invoices.ts` - Added discount/aging endpoints
- `packages/api/src/routers/portal.ts` - Added profile, financials, appointments
- `packages/api/src/routers/clients.ts` - Added enhanced dashboard

### Updated Specs
- `specs/phase-2/00-overview.md` - Updated module statuses
- `specs/phase-2/01-client-portal.md` - Added Phase 2 enhancements status
- `specs/phase-2/02-invoicing.md` - Added discount/aging documentation
- `specs/phase-2/05-appointments.md` - Complete rewrite with implementation

## Next Steps (Frontend UI)

### Staff App
1. **Appointments Page** - Calendar view, list view, detail modals
2. **Appointment Types Admin** - CRUD interface in settings
3. **Staff Availability** - Weekly schedule editor
4. **Invoice Discounts** - Discount form in invoice editor
5. **Aging Reports Page** - Visual breakdown chart
6. **Staff Edit Form** - Financial access checkbox

### Client Portal
1. **Profile Page** - Enhanced view with TIN, certificates
2. **Financials Tab** - Invoice list, balance summary
3. **Appointments Tab** - Request form, upcoming list, cancel button

## Testing

All API endpoints can be tested via:
1. Drizzle Studio (`bun run db:studio`) for data inspection
2. Direct API calls via curl or Postman
3. Integration tests (pending)

## Notes

- All financial data conditionally hidden based on `canViewFinancials()`
- Appointment requests from portal default to REQUESTED status
- Discounts only applicable to DRAFT invoices
- Aging report buckets based on `dueDate` comparison to today
