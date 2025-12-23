# Matter Tracking

**Status:** ✅ Complete
**Phase:** 1
**Priority:** High

## Overview

Track service requests (matters) from initial intake through completion. Each matter has a status workflow, checklist, notes, and is linked to a client and service type.

## User Stories

### Staff
- As a staff member, I can create new matters for clients
- As a staff member, I can update matter status as work progresses
- As a staff member, I can complete checklist items
- As a staff member, I can add notes to matters

### Manager
- As a manager, I can see all matters for my business
- As a manager, I can reassign matters between staff
- As a manager, I can view matters by status

### Client (Future - Phase 2)
- As a client, I can view the status of my matters

## Database Schema

### Tables

#### `serviceType`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| business | enum | GCMC or KAJ |
| name | varchar(255) | Service name |
| description | text | Service description |
| category | varchar(100) | Service category |
| defaultChecklistItems | jsonb | Default checklist template |
| estimatedDays | integer | Typical completion time |
| isActive | boolean | Available for new matters |

#### `matter`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| referenceNumber | varchar(20) | Unique: GCMC-2024-0001 |
| clientId | uuid | Client FK |
| serviceTypeId | uuid | Service type FK |
| business | enum | GCMC or KAJ |
| title | varchar(255) | Matter title |
| description | text | Matter details |
| status | enum | NEW, IN_PROGRESS, PENDING_CLIENT, SUBMITTED, COMPLETE, CANCELLED |
| startDate | date | Work start date |
| dueDate | date | Target completion |
| completedDate | date | Actual completion |
| assignedStaffId | uuid | Assigned staff FK |
| estimatedFee | decimal | Quoted fee |
| actualFee | decimal | Final fee |
| isPaid | boolean | Payment status |
| priority | enum | LOW, NORMAL, HIGH, URGENT |
| createdAt | timestamp | Created date |
| updatedAt | timestamp | Updated date |

#### `matterChecklist`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| matterId | uuid | Matter FK |
| item | varchar(255) | Checklist item text |
| isCompleted | boolean | Completion status |
| completedAt | timestamp | When completed |
| completedById | uuid | Who completed |
| sortOrder | integer | Display order |

#### `matterNote`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| matterId | uuid | Matter FK |
| content | text | Note content |
| isInternal | boolean | Internal only flag |
| createdById | uuid | Author FK |
| createdAt | timestamp | Created date |

#### `matterLink`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| matterId | uuid | Matter FK |
| linkedMatterId | uuid | Linked matter FK |
| linkType | varchar(50) | prerequisite, related, dependent |

## Reference Number Format

```
{BUSINESS}-{YEAR}-{SEQUENCE}

Examples:
- GCMC-2024-0001
- GCMC-2024-0002
- KAJ-2024-0001
```

Sequence resets each year per business.

## Status Workflow

```
NEW
 │
 ▼
IN_PROGRESS ◄──► PENDING_CLIENT
 │
 ▼
SUBMITTED
 │
 ▼
COMPLETE

(Any state can → CANCELLED)
```

| Status | Description |
|--------|-------------|
| NEW | Matter created, not yet started |
| IN_PROGRESS | Work actively underway |
| PENDING_CLIENT | Waiting for client action/documents |
| SUBMITTED | Submitted to authority/entity |
| COMPLETE | Work finished |
| CANCELLED | Matter cancelled |

## API Endpoints

### Base: `/matters`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/list` | Paginated list with filters |
| GET | `/getById` | Single matter with relations |
| POST | `/create` | Create new matter |
| PUT | `/update` | Update matter |
| PUT | `/updateStatus` | Change status |
| GET | `/getServiceTypes` | List service types |
| GET | `/getByStatus` | Matters grouped by status |

### Checklist: `/matters/checklist`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/list` | List checklist items |
| POST | `/addItem` | Add item |
| PUT | `/toggleItem` | Toggle completion |
| DELETE | `/deleteItem` | Remove item |

### Notes: `/matters/notes`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/list` | List notes |
| POST | `/create` | Add note |

## UI Components

### Pages
- `/app/matters/` - Matter list with filters
- `/app/matters/new` - New matter form
- `/app/matters/$matterId` - Matter detail

### Matter List Features
- Filter by status, business, staff, client
- Search by reference number, title
- Pagination (20 per page)
- Status badges with colors

### Matter Detail Tabs
- **Overview** - Status, dates, fees, client link
- **Checklist** - Interactive checklist with add/complete
- **Notes** - Notes timeline with add
- **Documents** - Related documents (future)

## Business Rules

1. **Reference Number**: Auto-generated on create, immutable
2. **Client Required**: Every matter must link to a client
3. **Service Type**: Determines default checklist items
4. **Status Changes**: Follow workflow, track timestamps
5. **Access Control**: Staff see only their business's matters

## Service Types (Seeded)

### GCMC (19 types)
- Business Registration
- Annual Return Filing
- NIS Registration
- Company Incorporation
- TIN Registration
- Work Permit Application
- Immigration Consultation
- Certificate of Compliance
- Business Name Search
- Certified Copies
- Professional Training
- Business Consulting
- Paralegal Services
- Notary Services
- Document Authentication
- Power of Attorney
- Visa Application
- Residency Application
- Passport Services

### KAJ (19 types)
- Personal Tax Return
- Corporate Tax Return
- VAT Registration
- VAT Return Filing
- PAYE Registration
- PAYE Monthly Filing
- NIS Contribution Filing
- Withholding Tax Filing
- Financial Statements
- Bookkeeping
- Payroll Processing
- Tax Planning
- Tax Advisory
- Audit Preparation
- Business Valuation
- Financial Analysis
- Budget Preparation
- Cash Flow Management
- Compliance Review

## Files

| Purpose | Path |
|---------|------|
| Schema | `/packages/db/src/schema/services.ts` |
| Router | `/packages/api/src/routers/matters.ts` |
| List Page | `/apps/web/src/routes/app/matters/index.tsx` |
| New Page | `/apps/web/src/routes/app/matters/new.tsx` |
| Detail Page | `/apps/web/src/routes/app/matters/$matterId.tsx` |

## Implementation Requirements

### Database Implementation
- [x] Create `serviceType` table with service categories
- [x] Create `matter` table with all workflow fields
- [x] Create `matterChecklist` table for task tracking
- [x] Create `matterNote` table for internal/external notes
- [x] Create `matterLink` table for matter relationships
- [x] Add indexes on `referenceNumber`, `status`, `business`, `clientId`
- [x] Add foreign key constraints to `clientId`, `serviceTypeId`, `assignedStaffId`
- [x] Implement reference number auto-generation logic
- [x] Seed 38 service types (19 GCMC + 19 KAJ)

### API Implementation
- [x] Implement `/matters/list` with pagination and filters
  - Filter by: status, business, staff, client, serviceType
  - Search by: referenceNumber, title
  - Sort by: createdAt, dueDate, status
  - Return 20 items per page by default
- [x] Implement `/matters/getById` with related data
  - Include: client, serviceType, checklist, notes, documents
- [x] Implement `/matters/create` with validation
  - Auto-generate referenceNumber (GCMC-2024-0001 format)
  - Initialize checklist from serviceType defaults
  - Validate client exists and is active
- [x] Implement `/matters/update` with partial updates
  - Prevent changing immutable fields (id, referenceNumber, createdAt)
- [x] Implement `/matters/updateStatus` with workflow enforcement
  - Track status transition timestamps
  - Update completedDate when status becomes COMPLETE
- [x] Implement `/matters/getServiceTypes` filtered by business
- [x] Implement `/matters/getByStatus` for kanban-style views
- [x] Implement checklist endpoints (add, toggle, delete)
- [x] Implement note endpoints (create, list)
- [x] Add business-level filtering to all queries
- [x] Add authorization checks to all mutations

### Frontend Implementation
- [x] Create matter list page with filters
  - Status filter dropdown
  - Business filter (GCMC/KAJ/All)
  - Staff filter dropdown
  - Search by reference number or title
  - Status badges with colors
  - Pagination controls
- [x] Create new matter form
  - Client autocomplete/selector
  - Service type dropdown (filtered by selected business)
  - Title and description fields
  - Start date and due date pickers
  - Assigned staff dropdown
  - Priority selector
  - Fee estimate input
  - Submit with loading state
- [x] Create matter detail page with tabs
  - Overview tab: status, dates, fees, client link, service type
  - Checklist tab: interactive checklist with checkboxes, add item
  - Notes tab: notes timeline, add note (internal/external toggle)
  - Documents tab: related documents (future)
- [x] Implement status update with workflow validation
- [x] Add loading states and error handling
- [x] Implement optimistic updates for checklist toggles

### Validation Rules
- [x] Client is required
- [x] Service type is required
- [x] Title is required
- [x] Business is required and determines service type options
- [x] Reference number auto-generated, immutable
- [x] Status transitions follow workflow (no invalid jumps)
- [x] Due date must be >= start date
- [x] Fees are non-negative decimals

## Acceptance Criteria

### Functional Requirements
- [ ] User can create new matters linked to clients
- [ ] User can select from appropriate service types based on business
- [ ] Reference numbers auto-generate in correct format (GCMC-2024-0001)
- [ ] User can view matter list filtered by status, business, staff
- [ ] User can search matters by reference number or title
- [ ] User can view complete matter details with all related data
- [ ] User can update matter status following workflow
- [ ] User can add and complete checklist items
- [ ] User can add internal and external notes
- [ ] User can link related matters (prerequisite, dependent)
- [ ] User can only access matters within their assigned businesses
- [ ] Manager can reassign matters to different staff
- [ ] Status badge colors match matter state visually

### Technical Requirements
- [ ] Reference numbers are unique per business per year
- [ ] Reference number sequence increments correctly
- [ ] Status workflow prevents invalid transitions
- [ ] Checklist items maintain sort order
- [ ] Notes are timestamped and attributed to creator
- [ ] Foreign key constraints prevent orphaned matters
- [ ] Business filtering prevents data leakage
- [ ] API returns proper HTTP status codes
- [ ] Optimistic updates work smoothly

### User Experience
- [ ] Matter list loads quickly with skeleton loaders
- [ ] Service type dropdown filters based on business selection
- [ ] Forms provide helpful validation messages
- [ ] Checklist items toggle instantly (optimistic update)
- [ ] Success messages confirm actions
- [ ] Navigation to/from client is intuitive
- [ ] Mobile layout is usable and responsive
- [ ] Status colors are visually distinct and accessible

## Test Cases

### Unit Tests (API Layer)
```typescript
describe('Matter API', () => {
  test('list matters with pagination')
  test('list filters by status correctly')
  test('list filters by business correctly')
  test('search by reference number')
  test('getById returns matter with relations')
  test('getById returns 404 for non-existent matter')
  test('create generates reference number')
  test('create initializes checklist from service type')
  test('create validates client exists')
  test('update allows partial updates')
  test('update prevents changing referenceNumber')
  test('updateStatus enforces workflow')
  test('updateStatus sets completedDate when COMPLETE')
  test('getServiceTypes filters by business')
  test('business filtering prevents cross-business access')
})

describe('Matter Checklist API', () => {
  test('addItem creates checklist item')
  test('toggleItem marks item complete')
  test('toggleItem records completedAt and completedById')
  test('deleteItem removes item')
  test('list returns items in sort order')
})

describe('Matter Notes API', () => {
  test('create adds note to matter')
  test('list returns notes for matter')
  test('internal notes marked correctly')
  test('notes ordered by createdAt desc')
})

describe('Matter Links API', () => {
  test('create links two matters')
  test('list returns linked matters')
  test('delete removes link')
  test('prevents linking matter to itself')
})

describe('Reference Number Generation', () => {
  test('generates GCMC-2024-0001 for first GCMC matter in 2024')
  test('generates GCMC-2024-0002 for second GCMC matter in 2024')
  test('generates KAJ-2024-0001 for first KAJ matter in 2024')
  test('sequence resets in new year')
  test('handles concurrent creation safely')
})
```

### Integration Tests (E2E)
```typescript
describe('Matter Tracking Flow', () => {
  test('create matter for client and view details')
  test('update matter status from NEW to IN_PROGRESS')
  test('complete checklist items')
  test('add internal note')
  test('add external note')
  test('update matter to COMPLETE status')
  test('filter matters by status')
  test('search matter by reference number')
  test('link two matters as related')
  test('staff cannot access other business matters')
})
```

### Manual Test Scenarios
1. **Create Matter**
   - Navigate to matters, click "New Matter"
   - Search and select client
   - Select business (GCMC)
   - Select service type (Business Registration)
   - Fill title and description
   - Set start date and due date
   - Submit and verify redirect to matter detail
   - Verify reference number format (GCMC-2024-XXXX)
   - Verify checklist initialized from service type

2. **Update Matter Status**
   - Open matter in NEW status
   - Change status to IN_PROGRESS
   - Verify status badge updates
   - Change to PENDING_CLIENT
   - Change to SUBMITTED
   - Change to COMPLETE
   - Verify completedDate is set

3. **Manage Checklist**
   - Open matter detail, go to Checklist tab
   - Check first item, verify it updates instantly
   - Add new checklist item
   - Verify item appears in list
   - Check new item
   - Verify completedAt and completedBy tracked

4. **Add Notes**
   - Go to Notes tab
   - Add internal note
   - Verify "Internal" badge shows
   - Add external note
   - Verify no internal badge
   - Verify notes ordered newest first

5. **Filter and Search**
   - Filter by IN_PROGRESS status
   - Filter by GCMC business
   - Combine filters
   - Search by reference number
   - Search by partial title
   - Verify results match filters
