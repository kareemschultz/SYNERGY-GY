# GK-Nexus Implementation Plan

## Overview

Unified business management platform for GCMC (training, consulting, paralegal, immigration) and KAJ (tax, accounting, financial services) in Guyana.

**Stack:** React 19 + TanStack Router | Hono + oRPC | PostgreSQL + Drizzle ORM | Better-Auth
**Scale:** 200-500 clients, 5-10 staff
**Deployment:** Docker containers on self-managed VPS (Vultr)
**Storage:** Local filesystem + S3/R2 cloud backup

---

## Phase 1 Modules

1. **Client Management** - Unified client database across both businesses
2. **Service/Matter Tracking** - Track service requests from start to completion
3. **Document Management** - Digital storage with templates
4. **Deadline Calendar** - Never miss filings or renewals
5. **User/Role Management** - Role-based access control

**Deferred to Phase 2:** Client Portal, Invoicing, Tax Calculators, Training Management, Appointments

---

## Database Schema

Create in `/packages/db/src/schema/`:

### `core.ts` - Enums and Staff
```
- businessEnum: GCMC | KAJ
- clientTypeEnum: INDIVIDUAL | SMALL_BUSINESS | CORPORATION | NGO | COOP | FOREIGN_NATIONAL | INVESTOR
- staff table: id, userId (FK), role, businesses[], phone, isActive, timestamps
- Roles: Owner, GCMC_Manager, KAJ_Manager, Staff_GCMC, Staff_KAJ, Staff_Both, Receptionist
```

### `clients.ts` - Client Management
```
- client: id, type, displayName, firstName, lastName, dateOfBirth, nationality,
         businessName, registrationNumber, email, phone, address, city, country,
         tinNumber, nationalId, passportNumber, businesses[], status, primaryStaffId,
         notes, timestamps, createdById
- clientContact: id, clientId, name, relationship, email, phone, isPrimary
- clientLink: id, clientId, linkedClientId, linkType (spouse/parent/director/etc), notes
- clientCommunication: id, clientId, type (phone/email/in_person/whatsapp), direction,
                       subject, summary, staffId, communicatedAt
```

### `services.ts` - Matter Tracking
```
- serviceType: id, business, name, description, category, defaultChecklistItems (JSONB),
               estimatedDays, isActive
- matterStatusEnum: NEW | IN_PROGRESS | PENDING_CLIENT | SUBMITTED | COMPLETE | CANCELLED
- matter: id, referenceNumber (unique, e.g. GCMC-2024-0001), clientId, serviceTypeId,
          business, title, description, status, startDate, dueDate, completedDate,
          assignedStaffId, estimatedFee, actualFee, isPaid, priority, timestamps
- matterChecklist: id, matterId, item, isCompleted, completedAt, completedById, sortOrder
- matterNote: id, matterId, content, isInternal, createdById, createdAt
- matterLink: id, matterId, linkedMatterId, linkType (prerequisite/related/dependent)
```

### `documents.ts` - Document Management
```
- documentCategoryEnum: IDENTITY | TAX | FINANCIAL | LEGAL | IMMIGRATION | BUSINESS |
                        CORRESPONDENCE | TRAINING | OTHER
- document: id, fileName, originalName, mimeType, fileSize, storagePath, cloudBackupPath,
            isBackedUp, category, description, clientId, matterId, expirationDate,
            expirationNotified, uploadedById, timestamps
- documentTemplate: id, name, description, category, business, templatePath,
                    placeholders (JSONB), isActive
```

### `deadlines.ts` - Calendar & Reminders
```
- deadlineTypeEnum: FILING | RENEWAL | PAYMENT | SUBMISSION | MEETING | FOLLOWUP | OTHER
- recurrencePatternEnum: NONE | DAILY | WEEKLY | MONTHLY | QUARTERLY | ANNUALLY
- deadline: id, title, description, type, clientId, matterId, business, dueDate,
            recurrencePattern, recurrenceEndDate, parentDeadlineId, assignedStaffId,
            isCompleted, completedAt, completedById, priority, timestamps
- deadlineReminder: id, deadlineId, daysBefore (30/14/7/1), isSent, sentAt
```

### `activity.ts` - Audit Trail
```
- activityLog: id, userId, staffId, action (create/update/delete/view), entityType,
               entityId, description, metadata (JSONB), ipAddress, userAgent, createdAt
```

---

## API Structure

Create routers in `/packages/api/src/routers/`:

### `clients.ts`
- `list` - Paginated list with search, type, business, status filters
- `getById` - Single client with all related data
- `create` / `update` - CRUD with activity logging
- `search` - Quick search for autocomplete
- `contacts.list/create/update/delete` - Contact CRUD
- `links.list/create/delete` - Family/business links
- `communications.list/create` - Communication log

### `matters.ts`
- `list` - Paginated with status, business, staff, client filters
- `getById` / `create` / `update` / `updateStatus`
- `generateReferenceNumber` - Auto-generate GCMC-YYYY-NNNN or KAJ-YYYY-NNNN
- `checklist.list/addItem/toggleItem/deleteItem`
- `notes.list/create`
- `links.list/create/delete` - Related matters

### `documents.ts`
- `list` - By client, matter, category
- `getById` / `update` / `delete` (soft delete)
- `getUploadUrl` - Prepare upload
- `completeUpload` - Finalize after file upload
- `getDownloadUrl` - Secure download URL
- `templates.list/getById/generate` - Template operations
- `getExpiring` - Documents expiring within N days

### `deadlines.ts`
- `getCalendarData` - Data for calendar view (date range, filters)
- `list` / `getById` / `create` / `update` / `delete`
- `complete` - Mark deadline complete
- `getUpcoming` - Dashboard widget
- `createRecurringInstances` - Generate future instances

### `staff.ts`
- `list` / `getById` / `getCurrent`
- `create` / `update` / `deactivate` (admin only)
- `getActivityLog` (admin only)

### `dashboard.ts`
- `getStats` - Active clients, open matters, upcoming deadlines
- `getRecentActivity` - Latest actions
- `getMattersByStatus` - Status breakdown
- `getUpcomingDeadlines` - Next 7 days
- `getMyAssignments` - Current user's work

### Middleware Updates in `/packages/api/src/index.ts`
```typescript
const requireRole = (allowedRoles: string[]) =>
  o.middleware(async ({ context, next }) => {
    const staff = await getStaffByUserId(context.session.user.id);
    if (!staff || !allowedRoles.includes(staff.role)) {
      throw new ORPCError("FORBIDDEN");
    }
    return next({ context: { ...context, staff } });
  });

export const adminProcedure = protectedProcedure.use(requireRole(["Owner", "GCMC_Manager", "KAJ_Manager"]));
```

---

## Frontend Routes

Create in `/apps/web/src/routes/`:

```
_authenticated.tsx              # Layout with sidebar (requires auth)
_authenticated/
  dashboard.tsx                 # Main dashboard

  clients/
    index.tsx                   # Client list + search
    $clientId.tsx               # Client detail (tabs: overview, documents, matters, communications)
    new.tsx                     # New client form

  matters/
    index.tsx                   # Matter list + filters
    $matterId.tsx               # Matter detail (checklist, notes, documents, timeline)
    new.tsx                     # New matter form

  documents/
    index.tsx                   # Document browser
    upload.tsx                  # Upload interface
    templates/
      index.tsx                 # Template list

  calendar/
    index.tsx                   # Calendar + list view
    deadlines/
      new.tsx                   # New deadline

  settings/
    index.tsx                   # Settings overview
    staff.tsx                   # Staff management (admin)
    service-types.tsx           # Configure services (admin)
    profile.tsx                 # User profile
```

---

## Key Components

Create in `/apps/web/src/components/`:

### Layout
- `sidebar.tsx` - Navigation with business toggle
- `page-header.tsx` - Consistent headers with breadcrumbs
- `breadcrumbs.tsx` - Navigation trail

### Clients
- `client-list.tsx` - DataTable with filters
- `client-form.tsx` - TanStack Form with validation
- `client-card.tsx` - Summary display
- `contact-manager.tsx` - Contact CRUD inline
- `communication-log.tsx` - Log entries

### Matters
- `matter-list.tsx` - DataTable with status badges
- `matter-form.tsx` - Service type selection, assignment
- `matter-status-badge.tsx` - Color-coded status
- `matter-checklist.tsx` - Interactive checklist
- `matter-notes.tsx` - Notes timeline

### Documents
- `document-list.tsx` - Grid/list toggle
- `document-upload.tsx` - Drag-drop zone
- `document-preview.tsx` - In-browser preview

### Calendar
- `deadline-calendar.tsx` - Month/week view
- `deadline-list.tsx` - Sortable list
- `deadline-card.tsx` - Deadline item

### Shared
- `data-table.tsx` - Reusable table with sorting/filtering
- `search-input.tsx` - Debounced search
- `empty-state.tsx` - Empty state illustrations
- `confirm-dialog.tsx` - Delete confirmations

### Additional shadcn/ui to Install
- Table, Tabs, Dialog, Sheet, Select, Calendar, Command, Badge, Textarea, Avatar, Breadcrumb, Pagination

---

## File Storage Architecture

### Local Storage (Primary)
```
/data/uploads/
  ├── {year}/
  │   └── {month}/
  │       └── {clientId}/
  │           └── {documentId}_{sanitizedFilename}
```

### Cloud Backup (S3/R2)
- Same path structure
- Hourly backup job syncs `isBackedUp = false` documents
- Updates `cloudBackupPath` on success

### Upload Flow
1. `POST /rpc/documents.getUploadUrl` - Get upload path + documentId
2. `POST /api/upload/:documentId` - Stream file to local storage
3. `POST /rpc/documents.completeUpload` - Finalize metadata

### Download Flow
1. `GET /rpc/documents.getDownloadUrl` - Get signed URL
2. `GET /api/download/:documentId` - Stream file with auth check

### Server Routes (add to `/apps/server/src/index.ts`)
```typescript
app.post("/api/upload/:documentId", uploadHandler);
app.get("/api/download/:documentId", downloadHandler);
```

---

## Implementation Sequence

### Step 1: Database Foundation
- [ ] Create schema files in `/packages/db/src/schema/`
- [ ] Update `/packages/db/src/schema/index.ts` to export all
- [ ] Run `bun run db:push` to create tables
- [ ] Create seed script for service types

### Step 2: Auth & Staff Enhancement
- [ ] Add staff table and relations
- [ ] Update auth to create staff profile on signup
- [ ] Add role-based middleware to API
- [ ] Update user context with staff info

### Step 3: Core UI Layout
- [ ] Install additional shadcn/ui components
- [ ] Create `_authenticated.tsx` layout
- [ ] Build sidebar navigation
- [ ] Set up route file structure

### Step 4: Client Management
- [ ] Create client router with all procedures
- [ ] Build client list page with search/filters
- [ ] Build client detail page with tabs
- [ ] Build client create/edit forms
- [ ] Add contact management
- [ ] Add communication logging

### Step 5: Matter Tracking
- [ ] Create matter router
- [ ] Build matter list with status filters
- [ ] Build matter detail with checklist
- [ ] Implement status workflow
- [ ] Add notes functionality
- [ ] Link matters to clients

### Step 6: Document Management
- [ ] Set up local storage directory
- [ ] Create upload/download routes
- [ ] Create document router
- [ ] Build upload interface
- [ ] Build document browser
- [ ] Add document templates

### Step 7: Deadline Calendar
- [ ] Create deadline router
- [ ] Build calendar view (react-big-calendar or similar)
- [ ] Build list view
- [ ] Implement recurring deadlines
- [ ] Add reminder system (background job)

### Step 8: Dashboard
- [ ] Create dashboard router
- [ ] Build stats widgets
- [ ] Build upcoming deadlines widget
- [ ] Build recent activity feed
- [ ] Build assignments widget

### Step 9: Polish & Optimization
- [ ] Add loading states (skeletons)
- [ ] Add error boundaries
- [ ] Optimize for slow connections (pagination, lazy loading)
- [ ] Add form validation with clear messages
- [ ] Mobile responsiveness
- [ ] Set up cloud backup job

---

## Email Notifications (Resend)

### Setup
- Install `resend` package in `apps/server`
- Add `RESEND_API_KEY` to environment variables
- Create email service in `/apps/server/src/lib/email.ts`

### Notification Types
- Deadline reminders (30, 14, 7, 1 days before)
- Matter status updates (optional)
- Document expiration warnings

### Background Jobs
- Create `/apps/server/src/workers/reminders.ts`
- Run daily via cron or Bun scheduler
- Query `deadlineReminder` table for unsent reminders
- Send emails and mark `isSent = true`

---

## Performance Considerations

- Paginate all lists (20 items default)
- Debounce search inputs (300ms)
- Use TanStack Query for caching
- Prefetch on hover
- Compress images on upload
- Use skeleton loaders

---

## Critical Files Summary

| Purpose | File Path |
|---------|-----------|
| Client schema | `/packages/db/src/schema/clients.ts` |
| Matter schema | `/packages/db/src/schema/services.ts` |
| Document schema | `/packages/db/src/schema/documents.ts` |
| Deadline schema | `/packages/db/src/schema/deadlines.ts` |
| API middleware | `/packages/api/src/index.ts` |
| Client router | `/packages/api/src/routers/clients.ts` |
| Auth layout | `/apps/web/src/routes/_authenticated.tsx` |
| Sidebar | `/apps/web/src/components/layout/sidebar.tsx` |
| Server upload | `/apps/server/src/index.ts` |
