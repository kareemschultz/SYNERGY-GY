# Financial Access Control

**Status:** ✅ COMPLETE
**Phase:** 2
**Priority:** High
**Created:** December 2024
**Updated:** December 12, 2024

## Implementation Status

| Component | Status | Notes |
|-----------|--------|-------|
| Database Schema | ✅ Complete | `canViewFinancials` column added to staff table |
| Helper Function | ✅ Complete | `canViewFinancials()` with role-based defaults |
| API Middleware | ✅ Complete | `financialProcedure` protecting sensitive endpoints |
| Client Router | ✅ Complete | `getDashboard` respects financial access |
| Invoice Router | ✅ Complete | Aging/balance endpoints protected |
| Admin UI | ✅ Complete | Staff edit & create forms with checkbox |
| Client UI | ✅ Complete | Invoices tab conditionally hidden based on canViewFinancials |

## Overview

Role-based permission system to control which staff members can view financial data (invoices, payments, outstanding balances, client financial summaries).

## Business Requirement

Some staff members (e.g., receptionists, junior staff) should NOT have access to sensitive financial information. Only managers and owners should see payment-related data by default.

## Implementation

### Staff Table Addition

Add `canViewFinancials` boolean field to the `staff` table:

```sql
ALTER TABLE staff ADD COLUMN can_view_financials BOOLEAN DEFAULT false;
```

### Default Values by Role

| Role | `canViewFinancials` Default |
|------|----------------------------|
| OWNER | `true` |
| GCMC_MANAGER | `true` |
| KAJ_MANAGER | `true` |
| STAFF_GCMC | `false` |
| STAFF_KAJ | `false` |
| STAFF_BOTH | `false` |
| RECEPTIONIST | `false` |

**Note:** Admins can override the default for individual staff members (e.g., give a senior staff member access).

## API Changes

### New Helper Function

Add to `packages/api/src/index.ts`:

```typescript
export function canViewFinancials(staff: Staff | null): boolean {
  if (!staff?.isActive) return false;

  // Check explicit permission flag first
  if (staff.canViewFinancials !== undefined) {
    return staff.canViewFinancials;
  }

  // Fall back to role-based default
  const managerRoles = ['OWNER', 'GCMC_MANAGER', 'KAJ_MANAGER'];
  return managerRoles.includes(staff.role);
}
```

### New Middleware

Create `financialProcedure` that extends `staffProcedure`:

```typescript
export const financialProcedure = staffProcedure.use(async ({ context, next }) => {
  if (!canViewFinancials(context.staff)) {
    throw new ORPCError('FORBIDDEN', {
      message: 'You do not have permission to view financial data'
    });
  }
  return next({ context });
});
```

### Protected Endpoints

The following endpoints should use `financialProcedure`:

**Invoices Router:**
- `invoices.list` - List invoices with amounts
- `invoices.getById` - Invoice details
- `invoices.getClientBalance` - Client balance summary
- `invoices.getAgingReport` - Aging breakdown
- `invoices.recordPayment` - Record payments
- `invoices.getSummary` - Revenue statistics

**Clients Router:**
- `clients.getFinancialSummary` - Client financial overview

**Portal Router (Staff Side):**
- Portal activity showing payment data

### Unprotected Financial Data

Some data should remain visible to all staff:
- Invoice status (PAID/UNPAID) without amounts
- Whether a client has outstanding balance (yes/no, no amount)
- Matter billing status

## UI Changes

### Client Detail Page

**For users WITH financial access:**
- Show "Financials" tab with full data
- Display outstanding balance in header
- Show payment history
- Show aging breakdown

**For users WITHOUT financial access:**
- Hide "Financials" tab completely
- Hide balance amounts
- Show only invoice status (Paid/Unpaid)
- Show payment indicator without amounts

### Invoice List Page

**For users WITHOUT financial access:**
- Redirect to 403 page or show "Access Denied"
- Or show limited view (invoice numbers and status only)

### Dashboard

**For users WITHOUT financial access:**
- Hide revenue statistics cards
- Hide "Accounts Receivable" widget
- Show only non-financial metrics

## Admin Settings

### Staff Management UI

Add checkbox in staff edit form:
- **Label:** "Can View Financial Data"
- **Description:** "Allow this staff member to view invoices, payments, and financial reports"
- **Default:** Based on role

### Audit Logging

Log when:
- Financial access is granted to a staff member
- Financial access is revoked
- A staff member attempts to access financial data without permission

## Database Migration

```sql
-- Add financial access column
ALTER TABLE staff
ADD COLUMN can_view_financials BOOLEAN;

-- Set defaults based on current roles
UPDATE staff
SET can_view_financials = CASE
  WHEN role IN ('OWNER', 'GCMC_MANAGER', 'KAJ_MANAGER') THEN true
  ELSE false
END;

-- Make column NOT NULL with default
ALTER TABLE staff
ALTER COLUMN can_view_financials SET NOT NULL,
ALTER COLUMN can_view_financials SET DEFAULT false;
```

## Acceptance Criteria

### Permission Checks
- [ ] Staff with `canViewFinancials = false` cannot access invoice list
- [ ] Staff with `canViewFinancials = false` cannot see payment amounts
- [ ] Staff with `canViewFinancials = false` cannot see client balance
- [ ] Staff with `canViewFinancials = true` has full financial access
- [ ] Managers and owners have access by default
- [ ] Regular staff do not have access by default

### UI Behavior
- [ ] Financials tab hidden for restricted users
- [ ] Balance amounts hidden for restricted users
- [ ] Invoice page shows 403 for restricted users
- [ ] Dashboard hides revenue stats for restricted users

### Admin Control
- [ ] Admin can grant financial access to any staff
- [ ] Admin can revoke financial access from any staff
- [ ] Changes take effect immediately
- [ ] Audit log records permission changes

### Security
- [ ] API returns 403 for unauthorized financial requests
- [ ] No financial data leaks through other endpoints
- [ ] Portal endpoints unaffected (clients see their own data)

## Test Cases

1. **Default Access**
   - Create OWNER → should have financial access
   - Create STAFF_GCMC → should NOT have financial access
   - Create RECEPTIONIST → should NOT have financial access

2. **Override Access**
   - Grant access to STAFF_GCMC → should now have access
   - Revoke access from GCMC_MANAGER → should NOT have access

3. **API Protection**
   - Staff without access calls `invoices.list` → 403 error
   - Staff with access calls `invoices.list` → success

4. **UI Hiding**
   - Login as receptionist → no Financials tab visible
   - Login as manager → Financials tab visible

## Dependencies

- Staff management system (Phase 1)
- Invoice system (Phase 2)
- Client management (Phase 1)

## Files to Modify

| File | Changes |
|------|---------|
| `packages/db/src/schema/core.ts` | Add `canViewFinancials` to staff table |
| `packages/api/src/index.ts` | Add helper function and middleware |
| `packages/api/src/routers/invoices.ts` | Use `financialProcedure` |
| `packages/api/src/routers/clients.ts` | Protect financial endpoints |
| `apps/web/src/routes/app/clients/$client-id.tsx` | Conditional financials tab |
| `apps/web/src/routes/app/invoices/*` | Permission check |
| `apps/web/src/routes/app/settings/staff/*` | Add checkbox in staff form |
