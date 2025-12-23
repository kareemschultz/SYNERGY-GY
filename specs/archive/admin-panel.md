# Admin Panel - Staff Management

**Status:** ✅ COMPLETED
**Implementation Date:** December 11, 2024
**Module Type:** Administrative Interface

This document describes the admin panel implementation for staff management in GK-Nexus.

> **⚠️ NO MOCK DATA POLICY**: The admin panel works exclusively with real database records. There is no mock data, placeholder content, or seed data. All staff are created through the admin interface. See [NO MOCK DATA Policy](./README.md#critical-development-policy-no-mock-data).

---

## Overview

The Admin Panel provides a comprehensive interface for managing staff members across both GCMC and KAJ businesses. Only users with administrative roles (OWNER, GCMC_MANAGER, KAJ_MANAGER) can access this module.

### Key Features

1. **Admin Dashboard** - Overview of staff statistics and quick actions
2. **Staff List** - Browse, search, and filter all staff members
3. **Staff Creation** - Add new staff with role and business assignment
4. **Staff Editing** - Update staff details, roles, and permissions
5. **Status Management** - Activate/deactivate staff accounts

---

## Access Control

### Authorized Roles

Only these roles can access the admin panel:

- **OWNER**: Full access to all administrative functions
- **GCMC_MANAGER**: Administrative access for GCMC operations
- **KAJ_MANAGER**: Administrative access for KAJ operations

### Security Measures

- All admin routes use `adminProcedure` middleware
- Unauthorized access returns 403 Forbidden
- Staff cannot deactivate their own account
- Email uniqueness enforced across the system
- Password minimum length: 8 characters

---

## Routes

### Frontend Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/app/admin` | Admin Dashboard | Statistics and quick actions |
| `/app/admin/staff` | Staff List | Browse all staff members |
| `/app/admin/staff/new` | New Staff Form | Create new staff member |
| `/app/admin/staff/$staffId` | Staff Detail | View/edit staff details |

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `admin.staff.list` | Query | List all staff with filters |
| `admin.staff.getById` | Query | Get single staff details |
| `admin.staff.create` | Mutation | Create new staff member |
| `admin.staff.update` | Mutation | Update existing staff |
| `admin.staff.toggleActive` | Mutation | Activate/deactivate staff |
| `admin.staff.stats` | Query | Get staff statistics |

---

## Database Schema

The admin panel works with existing database tables:

### Staff Table

```typescript
staff {
  id: string (UUID)
  userId: string (references user.id)
  role: staffRoleEnum
  businesses: string[] (["GCMC"], ["KAJ"], or ["GCMC", "KAJ"])
  phone: string | null
  jobTitle: string | null
  isActive: boolean (default: true)
  createdAt: timestamp
  updatedAt: timestamp
}
```

### User Table

```typescript
user {
  id: string (UUID)
  name: string
  email: string (unique)
  emailVerified: boolean
  image: string | null
  createdAt: timestamp
  updatedAt: timestamp
}
```

### Staff Roles

| Role | Description | Business Access |
|------|-------------|-----------------|
| `OWNER` | Full system access | GCMC + KAJ (required) |
| `GCMC_MANAGER` | GCMC administrative access | GCMC (required) |
| `KAJ_MANAGER` | KAJ administrative access | KAJ (required) |
| `STAFF_GCMC` | GCMC staff member | GCMC (required) |
| `STAFF_KAJ` | KAJ staff member | KAJ (required) |
| `STAFF_BOTH` | Cross-business staff | GCMC + KAJ (required) |
| `RECEPTIONIST` | Reception and support | Either or both |

---

## Features

### 1. Admin Dashboard

**Route:** `/app/admin`

**Components:**
- Quick action cards for common tasks
- Staff overview statistics
- Business distribution charts
- Role breakdown

**Statistics Displayed:**
- Total staff count
- Active staff count
- Inactive staff count
- Admin role count
- Staff by business (GCMC/KAJ)
- Staff by role

**Quick Actions:**
- View Staff List
- Add New Staff
- Roles & Permissions (coming soon)
- System Settings (coming soon)

### 2. Staff List

**Route:** `/app/admin/staff`

**Features:**
- Paginated table view (20 per page)
- Real-time search across name, email, job title
- Filter by role
- Filter by business access
- Filter by active/inactive status
- Sort by name, email, or creation date

**Table Columns:**
- Name (clickable link to details)
- Email
- Role (color-coded badge)
- Business Access (GCMC/KAJ badges)
- Job Title
- Status (Active/Inactive badge)
- Actions menu

**Row Actions:**
- View Details
- Edit
- Activate/Deactivate

**Empty State:**
- Displays when no staff members exist
- Shows "Add your first staff member" CTA

### 3. Create New Staff

**Route:** `/app/admin/staff/new`

**Form Sections:**

**Personal Information:**
- Full Name (required)
- Email (required, must be unique)
- Phone (optional)
- Job Title (optional)

**Role & Permissions:**
- Role selection (required)
- Business access checkboxes
- Auto-selects businesses based on role requirements
- Enforces role-business relationship rules

**Security:**
- Initial password (required, min 8 characters)
- Confirm password (must match)
- Information alert about password setup

**Validation Rules:**
- Email must be unique across all users
- Password minimum 8 characters
- At least one business must be selected
- Business access must match role requirements:
  - OWNER/STAFF_BOTH: Must have both GCMC and KAJ
  - GCMC_MANAGER/STAFF_GCMC: Must have GCMC
  - KAJ_MANAGER/STAFF_KAJ: Must have KAJ
  - RECEPTIONIST: Either or both

**User Experience:**
- Role selection auto-populates business checkboxes
- Required business checkboxes are disabled to prevent invalid selection
- Clear validation errors inline
- Success toast on creation
- Redirects to staff list on success

### 4. Staff Detail & Edit

**Route:** `/app/admin/staff/$staffId`

**View Mode:**

Displays three information cards:
1. **Personal Information**
   - Full Name
   - Email
   - Phone
   - Job Title

2. **Role & Permissions**
   - Current role with badge
   - Role description
   - Business access badges

3. **System Information**
   - Account created date
   - Last updated date
   - User ID
   - Staff ID

**Edit Mode:**

- Toggled via "Edit" button
- Same form fields as creation
- Pre-populated with current values
- Cannot change password (use password reset flow)
- Validation same as creation
- "Save Changes" commits updates
- "Cancel" discards changes

**Actions:**
- Edit button (enters edit mode)
- Activate/Deactivate toggle
- Cannot deactivate own account (prevented)

---

## API Implementation

### Router: `/packages/api/src/routers/admin.ts`

**Procedures:**

#### `admin.staff.list`

Lists all staff members with pagination and filtering.

**Input Schema:**
```typescript
{
  page: number (default: 1)
  limit: number (default: 20, max: 100)
  search?: string
  role?: StaffRole
  business?: "GCMC" | "KAJ"
  isActive?: boolean
  sortBy: "name" | "email" | "createdAt" (default: "name")
  sortOrder: "asc" | "desc" (default: "asc")
}
```

**Returns:**
```typescript
{
  staff: StaffWithUser[]
  total: number
  page: number
  limit: number
  totalPages: number
}
```

**Features:**
- Joins staff with user table for name/email
- Search across name, email, job title (case-insensitive)
- Filter by role, business access, active status
- Sorts by specified column
- Returns paginated results

#### `admin.staff.getById`

Gets complete staff details including user information.

**Input:** `{ id: string }`
**Returns:** Staff record with joined user data
**Errors:** 404 if not found

#### `admin.staff.create`

Creates a new staff member (creates user account + staff profile).

**Input Schema:**
```typescript
{
  name: string
  email: string (unique)
  role: StaffRole
  businesses: ("GCMC" | "KAJ")[]
  phone?: string
  jobTitle?: string
  password: string (min 8 chars)
}
```

**Validation:**
- Email uniqueness check
- Business-role relationship validation
- OWNER/STAFF_BOTH must have both businesses
- GCMC roles must have GCMC access
- KAJ roles must have KAJ access

**Process:**
1. Check email doesn't exist
2. Validate business access matches role
3. Create user record (email verified: true)
4. Create staff profile
5. Return staff with user data

**Note:** Password handling currently placeholder. In production, use Better Auth password setup flow.

#### `admin.staff.update`

Updates existing staff member details.

**Input Schema:**
```typescript
{
  id: string
  name?: string
  email?: string
  role?: StaffRole
  businesses?: ("GCMC" | "KAJ")[]
  phone?: string
  jobTitle?: string
}
```

**Validation:**
- Staff exists check
- Email uniqueness (if changing)
- Business-role relationship (validates final state)

**Process:**
1. Fetch existing staff
2. Validate changes
3. Update user table (if name/email changed)
4. Update staff table
5. Return updated record

#### `admin.staff.toggleActive`

Activates or deactivates a staff account.

**Input:** `{ id: string, isActive: boolean }`
**Validation:** Cannot deactivate own account
**Returns:** Updated staff record

#### `admin.staff.stats`

Returns statistics for dashboard.

**Returns:**
```typescript
{
  totalStaff: number
  activeStaff: number
  inactiveStaff: number
  byRole: {
    role: string
    roleDisplay: string
    count: number
  }[]
  byBusiness: {
    GCMC: number
    KAJ: number
  }
}
```

**Calculations:**
- Total staff count
- Active vs inactive breakdown
- Count by each role (active only)
- Count by business access (active only)

---

## UI Components

### Key Components Used

From `@/components/ui`:
- `Card`, `CardHeader`, `CardTitle`, `CardContent` - Layout containers
- `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell` - Data tables
- `Button` - Actions and CTAs
- `Input` - Text inputs
- `Select` - Dropdown selectors
- `Checkbox` - Business access selection
- `Badge` - Status and role indicators
- `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage` - Form handling
- `DropdownMenu` - Row action menus

From `@/components/layout`:
- `PageHeader` - Consistent page headers with breadcrumbs

### Custom Components

**StatCard** - Dashboard metric display
- Icon with colored background
- Title and value
- Variants: default, success, warning, info

**QuickActionCard** - Dashboard action cards
- Icon with primary background
- Title and description
- Link to action
- Disabled state for coming soon

**RoleBadge** - Role display with color coding
- Admin roles: Purple (OWNER, GCMC_MANAGER, KAJ_MANAGER)
- Staff roles: Blue (STAFF_GCMC, STAFF_KAJ, STAFF_BOTH, RECEPTIONIST)

**BusinessBadges** - Business access indicators
- GCMC: Emerald green badge
- KAJ: Blue badge

**StatusBadge** - Active/Inactive status
- Active: Green badge
- Inactive: Gray badge

---

## User Experience

### Loading States

- Skeleton loaders on dashboard statistics
- Spinner on table loading
- Button loading state during mutations
- Full-page loader on detail page

### Error Handling

- User-friendly error messages
- Toast notifications for errors
- Inline form validation
- Network error handling

### Empty States

- Staff list: "No staff members found" with CTA
- Dashboard: Handles zero-count gracefully

### Success Feedback

- Toast notification on create
- Toast notification on update
- Toast notification on status change
- Visual badge updates

### Validation

- Real-time form validation
- Server-side validation with clear errors
- Business-role relationship enforcement
- Email uniqueness check
- Password strength requirement

---

## Security Considerations

### Authorization

- All routes behind `adminProcedure`
- Returns 403 for non-admin users
- Session check on every request

### Data Protection

- Cannot deactivate own account
- Email verification on admin-created accounts
- Password requirements enforced
- No password display (creation only)

### Input Validation

- Zod schemas on all endpoints
- Server-side validation mandatory
- SQL injection prevention (parameterized queries)
- XSS prevention

---

## Testing Checklist

### Functional Tests

- [ ] Admin dashboard loads and displays statistics
- [ ] Staff list displays all staff members
- [ ] Search filters staff correctly
- [ ] Role filter works
- [ ] Business filter works
- [ ] Status filter works
- [ ] Pagination works correctly
- [ ] Create staff with all required fields
- [ ] Email uniqueness validation works
- [ ] Business-role validation works
- [ ] Edit staff updates successfully
- [ ] Toggle active/inactive works
- [ ] Cannot deactivate own account
- [ ] Empty states display correctly
- [ ] Loading states appear appropriately
- [ ] Error messages are user-friendly

### Security Tests

- [ ] Non-admin cannot access admin routes
- [ ] Cannot create duplicate email
- [ ] Cannot assign invalid business-role combinations
- [ ] Session timeout works
- [ ] CSRF protection active

### UI/UX Tests

- [ ] Responsive on mobile (< 768px)
- [ ] Responsive on tablet (768px - 1024px)
- [ ] Responsive on desktop (> 1024px)
- [ ] Keyboard navigation works
- [ ] Focus states visible
- [ ] Color contrast meets WCAG AA
- [ ] Toast notifications appear
- [ ] Form validation errors inline

---

## Future Enhancements

### Planned Features

1. **Password Reset**
   - Admin-initiated password reset
   - Send reset link via email
   - Temporary password generation

2. **Bulk Actions**
   - Bulk activate/deactivate
   - Export staff list to CSV
   - Bulk role assignment

3. **Audit Log**
   - Track all admin actions
   - View who created/modified staff
   - Filter by action type and date

4. **Permission Granularity**
   - Custom permissions beyond roles
   - Feature-level access control
   - Business-specific permissions

5. **Staff Invitations**
   - Email invitation system
   - Self-registration with invite code
   - Onboarding workflow

---

## Implementation Files

### API Layer

- `/packages/api/src/routers/admin.ts` - Admin router with staff procedures
- `/packages/api/src/routers/index.ts` - Router registration
- `/packages/api/src/index.ts` - adminProcedure middleware

### Frontend Routes

- `/apps/web/src/routes/app/admin/index.tsx` - Admin dashboard
- `/apps/web/src/routes/app/admin/staff/index.tsx` - Staff list
- `/apps/web/src/routes/app/admin/staff/new.tsx` - Create staff form
- `/apps/web/src/routes/app/admin/staff/$staffId.tsx` - Staff detail/edit

### Database

- `/packages/db/src/schema/core.ts` - Staff table schema
- `/packages/db/src/schema/auth.ts` - User table schema

---

## Changelog

### December 11, 2024 - Initial Implementation

**Added:**
- Admin dashboard with statistics
- Staff list with search, filter, pagination
- Staff creation form with validation
- Staff detail/edit page
- Activate/deactivate functionality
- API router with all CRUD operations
- Role-based access control
- Business-role relationship validation

**Components:**
- StatCard for dashboard metrics
- QuickActionCard for quick actions
- RoleBadge, BusinessBadges, StatusBadge for visual indicators
- Complete form handling with react-hook-form + zod

**Security:**
- adminProcedure authorization
- Email uniqueness enforcement
- Password validation
- Self-deactivation prevention

---

*Last Updated: December 11, 2024*
