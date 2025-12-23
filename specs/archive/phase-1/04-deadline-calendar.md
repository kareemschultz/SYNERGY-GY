# Deadline Calendar

**Status:** ✅ Complete
**Phase:** 1
**Priority:** High

## Overview

Calendar and deadline management system to track filings, renewals, payments, and other time-sensitive tasks. Supports recurring deadlines and reminder notifications.

## User Stories

### Staff
- As a staff member, I can create deadlines for clients
- As a staff member, I can view deadlines in a calendar
- As a staff member, I can mark deadlines as complete
- As a staff member, I can see upcoming deadlines

### Manager
- As a manager, I can see all deadlines for my business
- As a manager, I can see overdue deadlines
- As a manager, I can view deadline statistics

### System
- As the system, I send reminders before deadlines (30/14/7/1 days)

## Database Schema

### Tables

#### `deadline`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| title | varchar(255) | Deadline title |
| description | text | Details |
| type | enum | Deadline type |
| clientId | uuid | Client FK (optional) |
| matterId | uuid | Matter FK (optional) |
| business | enum | GCMC, KAJ, or null (both) |
| dueDate | timestamp | Due date/time |
| recurrencePattern | enum | Recurrence type |
| recurrenceEndDate | date | End of recurrence |
| parentDeadlineId | uuid | Parent if recurring |
| assignedStaffId | uuid | Assigned staff FK |
| isCompleted | boolean | Completion status |
| completedAt | timestamp | When completed |
| completedById | uuid | Who completed |
| priority | enum | LOW, NORMAL, HIGH, URGENT |
| createdAt | timestamp | Created date |
| updatedAt | timestamp | Updated date |

#### `deadlineReminder`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| deadlineId | uuid | Deadline FK |
| daysBefore | integer | 30, 14, 7, or 1 |
| isSent | boolean | Sent status |
| sentAt | timestamp | When sent |

### Deadline Types

| Type | Description |
|------|-------------|
| FILING | Tax filings, regulatory submissions |
| RENEWAL | Permits, licenses, registrations |
| PAYMENT | Due dates for payments |
| SUBMISSION | Document submissions |
| MEETING | Court dates, client meetings |
| FOLLOWUP | Reminders, follow-ups |
| OTHER | Miscellaneous |

### Recurrence Patterns

| Pattern | Description |
|---------|-------------|
| NONE | One-time deadline |
| DAILY | Every day |
| WEEKLY | Every week |
| MONTHLY | Every month |
| QUARTERLY | Every 3 months |
| ANNUALLY | Every year |

### Priority Levels

| Priority | Color | Description |
|----------|-------|-------------|
| LOW | Gray | Nice to have |
| NORMAL | Blue | Standard |
| HIGH | Orange | Important |
| URGENT | Red | Critical |

## API Endpoints

### Base: `/deadlines`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/list` | Paginated list with filters |
| GET | `/getById` | Single deadline |
| POST | `/create` | Create deadline |
| PUT | `/update` | Update deadline |
| DELETE | `/delete` | Delete deadline |
| PUT | `/complete` | Mark complete |
| PUT | `/uncomplete` | Unmark complete |
| GET | `/getCalendarData` | Date range data |
| GET | `/getUpcoming` | Next N days |
| GET | `/getOverdue` | Past due |
| GET | `/getStats` | Statistics |

## UI Components

### Pages
- `/app/calendar/` - Calendar view
- `/app/calendar/new` - New deadline form

### Calendar Page Features

**Header Stats:**
- Overdue count (red)
- Due this week count (amber)
- Completed this month count (green)
- Total pending count (blue)

**Calendar View:**
- Monthly grid layout
- Day headers (Sun-Sat)
- Deadline indicators with priority colors
- Today highlighting
- Navigation (prev/next month, today)
- Business filter (All/GCMC/KAJ)

**Sidebar:**
- Overdue deadlines card (if any)
- Upcoming deadlines (7 days)
- Deadline type legend

### New Deadline Form

**Sections:**
1. Deadline Information
   - Title (required)
   - Description
   - Type selection
   - Priority selection
   - Business selection

2. Schedule
   - Due date (required)
   - Due time (optional)
   - Recurrence pattern
   - Recurrence end date

3. Link to Client/Matter (optional)
   - Client search
   - Matter selection (filtered by client)

## Business Rules

1. **Due Date Required**: Every deadline needs a due date
2. **Business Context**: Filters deadlines by user's business access
3. **Completion Tracking**: Records who completed and when
4. **Overdue Detection**: `dueDate < now() AND isCompleted = false`
5. **Recurring Instances**: Parent creates child deadlines (deferred)

## Reminder Schedule

| Days Before | Email Sent |
|-------------|------------|
| 30 | Yes |
| 14 | Yes |
| 7 | Yes |
| 1 | Yes |

Reminders created when deadline is created. Background job sends emails and marks `isSent = true`.

## Dependencies

- Client table (optional link)
- Matter table (optional link)
- Staff table (assignment)
- Email service (reminders - deferred)

## Deferred Items

- [ ] Background reminder job
- [ ] Email notification sending
- [ ] Recurring deadline instance creation
- [ ] Week view
- [ ] Drag-and-drop rescheduling

## Files

| Purpose | Path |
|---------|------|
| Schema | `/packages/db/src/schema/deadlines.ts` |
| Router | `/packages/api/src/routers/deadlines.ts` |
| Calendar Page | `/apps/web/src/routes/app/calendar/index.tsx` |
| New Page | `/apps/web/src/routes/app/calendar/new.tsx` |

## Implementation Requirements

### Database Implementation
- [x] Create `deadline` table with all fields including recurrence
- [x] Create `deadlineReminder` table for reminder tracking
- [x] Add indexes on `dueDate`, `business`, `status` (`isCompleted`), `assignedStaffId`
- [x] Add foreign key constraints to `clientId`, `matterId`, `assignedStaffId`, `parentDeadlineId`
- [x] Add index on `recurrencePattern` for recurring deadline queries
- [x] Implement composite index on (business, dueDate, isCompleted)

### API Implementation
- [x] Implement `/deadlines/list` with pagination and filters
  - Filter by: type, business, priority, staff, isCompleted
  - Search by: title
  - Sort by: dueDate, priority, createdAt
  - Return 20 items per page by default
- [x] Implement `/deadlines/getById` with related data
  - Include: client, matter, assigned staff
- [x] Implement `/deadlines/create` with validation
  - Validate dueDate is required
  - Create reminder records (30, 14, 7, 1 days before)
  - Handle recurrence pattern setup
- [x] Implement `/deadlines/update` with partial updates
  - Update reminder records if dueDate changes
- [x] Implement `/deadlines/delete` (soft delete or hard delete)
- [x] Implement `/deadlines/complete` to mark complete
  - Set isCompleted = true, completedAt, completedById
- [x] Implement `/deadlines/uncomplete` to unmark
- [x] Implement `/deadlines/getCalendarData` for month view
  - Return deadlines within date range
  - Group by date for calendar rendering
- [x] Implement `/deadlines/getUpcoming` for next N days
- [x] Implement `/deadlines/getOverdue` for past due
  - Where dueDate < now() AND isCompleted = false
- [x] Implement `/deadlines/getStats` for dashboard
- [ ] Implement recurring deadline instance creation (deferred)
- [x] Add business-level filtering to all queries
- [x] Add authorization checks to all mutations

### Frontend Implementation
- [x] Create calendar page with monthly grid
  - Month/year header with navigation
  - Calendar grid (7 columns x 5-6 rows)
  - Day cells with deadline indicators
  - Today highlighting
  - Click day to see deadlines
- [x] Create calendar statistics header
  - Overdue count (red badge)
  - Due this week count (amber badge)
  - Completed this month count (green badge)
  - Total pending count (blue badge)
- [x] Create calendar sidebar
  - Overdue deadlines card (if any)
  - Upcoming deadlines (7 days)
  - Deadline type legend with colors
- [x] Create new deadline form
  - Title and description fields
  - Type selector dropdown
  - Priority selector
  - Business selector
  - Due date and time pickers
  - Recurrence pattern selector
  - Recurrence end date picker
  - Client selector (optional)
  - Matter selector (optional, filtered by client)
  - Submit with loading state
- [x] Implement deadline cards with actions
  - Show title, priority badge, type
  - Complete/uncomplete checkbox
  - Edit and delete buttons
  - Client/matter links if present
- [x] Implement business filter toggle
  - All / GCMC / KAJ filter buttons
  - Filter applies to calendar and sidebar
- [x] Add loading states and error handling
- [x] Implement optimistic updates for completion toggle

### Validation Rules
- [x] Title is required
- [x] Due date is required
- [x] Type is required (enum)
- [x] Priority is required (enum)
- [x] Business can be null (applies to both)
- [x] If client selected, must exist and be active
- [x] If matter selected, must exist and belong to client
- [x] Recurrence end date must be > due date
- [x] Due time is optional

## Acceptance Criteria

### Functional Requirements
- [ ] User can view calendar with monthly grid layout
- [ ] User can navigate between months (prev/next/today)
- [ ] User can see deadlines on calendar as indicators
- [ ] User can click day to view deadlines for that day
- [ ] User can create new deadlines with all fields
- [ ] User can set priority levels (low, normal, high, urgent)
- [ ] User can link deadlines to clients and matters
- [ ] User can mark deadlines as complete/incomplete
- [ ] User can view overdue deadlines in sidebar
- [ ] User can view upcoming deadlines (7 days)
- [ ] User can filter calendar by business (all/GCMC/KAJ)
- [ ] User can edit and delete deadlines
- [ ] User can only access deadlines within their assigned businesses
- [ ] Manager can see all deadlines for their business
- [ ] Statistics update in real-time

### Technical Requirements
- [ ] Overdue calculation is accurate (considers time zones)
- [ ] Calendar data query is performant (< 500ms)
- [ ] Completion toggle updates instantly (optimistic)
- [ ] Priority colors are visually distinct
- [ ] Reminder records created on deadline creation
- [ ] Foreign key constraints prevent orphaned deadlines
- [ ] Business filtering prevents data leakage
- [ ] API returns proper HTTP status codes
- [ ] Date/time handling respects user timezone

### User Experience
- [ ] Calendar loads quickly with skeleton loader
- [ ] Today is visually highlighted
- [ ] Deadline indicators show priority colors
- [ ] Multiple deadlines on same day are visible
- [ ] Sidebar shows most urgent items first
- [ ] Forms provide helpful validation messages
- [ ] Success messages confirm actions
- [ ] Mobile layout is usable and responsive
- [ ] Navigation is intuitive (prev/next/today buttons)
- [ ] Empty states show helpful messages

## Test Cases

### Unit Tests (API Layer)
```typescript
describe('Deadline API', () => {
  test('list deadlines with pagination')
  test('list filters by type correctly')
  test('list filters by priority correctly')
  test('list filters by business correctly')
  test('list filters by completion status')
  test('getById returns deadline with relations')
  test('getById returns 404 for non-existent deadline')
  test('create validates required fields')
  test('create creates reminder records')
  test('create validates recurrence end date')
  test('update allows partial updates')
  test('update updates reminders if dueDate changed')
  test('complete marks deadline complete with timestamp')
  test('uncomplete unmarks deadline')
  test('getCalendarData returns deadlines in date range')
  test('getUpcoming returns next N days')
  test('getOverdue returns past due incomplete deadlines')
  test('getStats returns accurate counts')
  test('business filtering prevents cross-business access')
})

describe('Deadline Reminders', () => {
  test('create deadline creates 4 reminders (30,14,7,1 days)')
  test('reminders have correct daysBefore values')
  test('reminders are initially not sent')
  test('changing dueDate updates reminder dates')
})
```

### Integration Tests (E2E)
```typescript
describe('Deadline Calendar Flow', () => {
  test('view calendar and navigate months')
  test('create new deadline and see on calendar')
  test('click day to view deadlines')
  test('complete deadline and verify badge updates')
  test('view overdue deadlines in sidebar')
  test('view upcoming deadlines in sidebar')
  test('filter calendar by business')
  test('edit deadline and verify changes')
  test('delete deadline and verify removed')
  test('staff cannot access other business deadlines')
})

describe('Deadline Priority and Types', () => {
  test('create URGENT priority deadline shows red')
  test('create HIGH priority shows orange')
  test('create NORMAL priority shows blue')
  test('create LOW priority shows gray')
  test('different deadline types have correct badges')
})
```

### Manual Test Scenarios
1. **View Calendar**
   - Navigate to calendar page
   - Verify current month shown
   - Verify today highlighted
   - Click "Next Month"
   - Click "Previous Month"
   - Click "Today" to return
   - Verify statistics cards show correct counts

2. **Create Deadline**
   - Click "New Deadline"
   - Fill title: "Tax Return Filing"
   - Select type: FILING
   - Select priority: URGENT
   - Select business: GCMC
   - Set due date: 15 days from now
   - Set due time: 5:00 PM
   - Select client
   - Submit
   - Verify appears on calendar
   - Verify appears in upcoming sidebar

3. **Complete Deadline**
   - Find deadline in sidebar
   - Click checkbox to complete
   - Verify instantly updates (optimistic)
   - Verify completedAt timestamp set
   - Uncomplete deadline
   - Verify updates again

4. **Overdue Deadlines**
   - Create deadline with past due date
   - Verify appears in overdue sidebar card
   - Verify statistics show overdue count
   - Complete overdue deadline
   - Verify removed from overdue list

5. **Business Filtering**
   - Create GCMC deadline
   - Create KAJ deadline
   - Click "GCMC" filter
   - Verify only GCMC deadlines show
   - Click "KAJ" filter
   - Verify only KAJ deadlines show
   - Click "All" filter
   - Verify both show

6. **Priority Levels**
   - Create URGENT deadline (red)
   - Create HIGH deadline (orange)
   - Create NORMAL deadline (blue)
   - Create LOW deadline (gray)
   - Verify color coding on calendar
   - Verify sidebar sorts by priority

7. **Access Control**
   - Login as GCMC staff
   - Verify can only see GCMC and shared deadlines
   - Try accessing KAJ deadline by URL
   - Verify access denied
   - Login as admin
   - Verify can see all deadlines
