# Dashboard

**Status:** ✅ Complete
**Phase:** 1
**Priority:** High

## Overview

Central dashboard providing an overview of business operations. Displays key statistics, matter status, upcoming deadlines, and recent activity.

## User Stories

### Staff
- As a staff member, I can see my workload at a glance
- As a staff member, I can quickly access recent matters
- As a staff member, I can see upcoming deadlines

### Manager
- As a manager, I can see overall business health
- As a manager, I can monitor matter distribution by status
- As a manager, I can identify overdue items

## Dashboard Widgets

### 1. Statistics Cards (Top Row)
Five cards showing key metrics:

| Metric | Icon | Description |
|--------|------|-------------|
| Active Clients | Users | Total active clients across businesses |
| Open Matters | FolderOpen | Matters not completed/cancelled |
| Upcoming Deadlines | Calendar | Due in next 7 days |
| Overdue | AlertCircle | Past due, not completed |
| Documents | FileText | Total documents uploaded |

### 2. Matters by Status (Middle)
Card showing matter distribution:

| Status | Color | Description |
|--------|-------|-------------|
| New | Blue | Just created |
| In Progress | Yellow | Work underway |
| Pending Client | Orange | Waiting for client |
| Submitted | Purple | Sent to authority |
| Complete | Green | Finished |
| Cancelled | Gray | Cancelled |

### 3. Upcoming Deadlines (Bottom Left)
Card showing next 5 deadlines:
- Deadline title
- Client name
- Priority badge
- Due date
- Link to calendar

### 4. Recent Matters (Bottom Right)
Card showing 5 most recent matters:
- Matter title
- Reference number
- Client name
- Status badge
- Link to matter detail

## API Endpoints

### Base: `/dashboard`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/getStats` | Main statistics |
| GET | `/getMattersByStatus` | Status breakdown |
| GET | `/getRecentMatters` | Recent matters |
| GET | `/getUpcomingDeadlines` | Upcoming deadlines |
| GET | `/getRecentClients` | Recent clients |
| GET | `/getMattersByBusiness` | Business breakdown |

### Response Shapes

#### `getStats`
```typescript
{
  activeClients: number;
  openMatters: number;
  totalDocuments: number;
  upcomingDeadlines: number;
  overdueDeadlines: number;
}
```

#### `getMattersByStatus`
```typescript
{
  NEW: number;
  IN_PROGRESS: number;
  PENDING_CLIENT: number;
  SUBMITTED: number;
  COMPLETE: number;
  CANCELLED: number;
}
```

#### `getRecentMatters`
```typescript
Array<{
  id: string;
  referenceNumber: string;
  title: string;
  status: string;
  client: { id: string; displayName: string; };
  serviceType: { id: string; name: string; };
}>
```

#### `getUpcomingDeadlines`
```typescript
Array<{
  id: string;
  title: string;
  dueDate: Date;
  priority: string;
  client?: { id: string; displayName: string; };
}>
```

## UI Components

### Page Structure
```
PageHeader
  └── Title: "Dashboard"
  └── Description: "Overview of your business operations"

Content
  ├── Stats Cards Row (5 cards)
  ├── Matters by Status Card
  └── Two Column Layout
      ├── Upcoming Deadlines Card
      └── Recent Matters Card
```

### StatsCard Component
- Title (small text)
- Icon (right-aligned)
- Value (large number)
- Description (muted text)
- Loading state (spinner)
- Optional value color

### StatusCard Component
- Color indicator dot
- Label text
- Count number

### DeadlineItem Component
- Priority badge
- Title
- Client name
- Due date

### MatterItem Component (Link)
- Title
- Reference number
- Client name
- Status badge

## Business Rules

1. **Business Filtering**: Stats filtered by user's accessible businesses
2. **Caching**: TanStack Query caches API responses
3. **Refresh**: Data refreshes on route navigation
4. **Access Control**: Shows only data user has access to

## Data Flow

```
Dashboard Page
  │
  ├── useQuery(dashboardStats)
  │     └── client.dashboard.getStats()
  │
  ├── useQuery(mattersByStatus)
  │     └── client.dashboard.getMattersByStatus()
  │
  ├── useQuery(recentMatters)
  │     └── client.dashboard.getRecentMatters({ limit: 5 })
  │
  └── useQuery(upcomingDeadlines)
        └── client.dashboard.getUpcomingDeadlines({ limit: 5 })
```

## Dependencies

- Client router (client counts)
- Matter router (matter stats)
- Document router (document count)
- Deadline router (deadline stats)

## Files

| Purpose | Path |
|---------|------|
| Router | `/packages/api/src/routers/dashboard.ts` |
| Page | `/apps/web/src/routes/app/index.tsx` |

## Implementation Requirements

### Database Implementation
- [x] No dedicated tables (uses views/queries from other modules)
- [x] Ensure indexes exist on frequently queried fields:
  - `client.status` for active client counts
  - `matter.status` for open matter counts
  - `deadline.dueDate` and `deadline.isCompleted` for deadline stats
  - `document.createdAt` for document counts

### API Implementation
- [x] Implement `/dashboard/getStats` endpoint
  - Query active client count (status = ACTIVE)
  - Query open matter count (status NOT IN [COMPLETE, CANCELLED])
  - Query total document count
  - Query upcoming deadlines count (next 7 days)
  - Query overdue deadlines count (past due, not completed)
  - Apply business filtering to all counts
- [x] Implement `/dashboard/getMattersByStatus` endpoint
  - Count matters grouped by status (NEW, IN_PROGRESS, etc.)
  - Apply business filtering
  - Return counts for all status values
- [x] Implement `/dashboard/getRecentMatters` endpoint
  - Return last N matters ordered by createdAt desc
  - Include client and service type relations
  - Apply business filtering
  - Default limit: 5
- [x] Implement `/dashboard/getUpcomingDeadlines` endpoint
  - Return next N deadlines ordered by dueDate asc
  - Filter where isCompleted = false
  - Include client relation if present
  - Apply business filtering
  - Default limit: 5
- [x] Implement `/dashboard/getRecentClients` endpoint (optional)
  - Return last N clients ordered by createdAt desc
  - Apply business filtering
  - Default limit: 5
- [x] Implement `/dashboard/getMattersByBusiness` endpoint (optional)
  - Count matters per business (GCMC vs KAJ)
  - Useful for admin dashboard
- [x] Optimize all queries for performance (< 500ms)
- [x] Add caching headers for appropriate endpoints
- [x] Add authorization checks to all endpoints

### Frontend Implementation
- [x] Create dashboard page layout
  - Page header with title and description
  - Statistics cards row (5 cards)
  - Matters by status card (middle section)
  - Two-column layout for recent matters and deadlines
- [x] Create StatsCard component
  - Icon (right-aligned)
  - Title (small, muted)
  - Value (large number)
  - Description (optional, muted)
  - Loading state (skeleton or spinner)
  - Optional value color
- [x] Create StatusCard component
  - Status indicator dot (colored)
  - Status label
  - Count number
  - Color coding matches matter status
- [x] Create DeadlineItem component
  - Priority badge
  - Deadline title
  - Client name (if present)
  - Due date (formatted)
  - Link to calendar
- [x] Create MatterItem component
  - Matter title
  - Reference number (muted)
  - Client name
  - Status badge
  - Link to matter detail
- [x] Implement data fetching with TanStack Query
  - Separate queries for each widget
  - Loading states for each section
  - Error handling for failed queries
  - Auto-refresh on route navigation
- [x] Add loading skeletons for all widgets
- [x] Handle empty states gracefully
  - "No matters found" message
  - "No upcoming deadlines" message
  - Helpful call-to-action buttons

### Validation Rules
- [x] All endpoints require authentication
- [x] Business filtering applied automatically based on user
- [x] Stats reflect only data user has access to
- [x] Limit parameters validated (max 50)

## Acceptance Criteria

### Functional Requirements
- [ ] User sees 5 key statistics on dashboard load
- [ ] Active client count is accurate
- [ ] Open matter count excludes completed/cancelled
- [ ] Upcoming deadlines count shows next 7 days
- [ ] Overdue count shows past due, incomplete deadlines
- [ ] Document count shows total documents
- [ ] Matters by status shows distribution across all statuses
- [ ] Recent matters list shows last 5 matters with details
- [ ] Upcoming deadlines list shows next 5 deadlines
- [ ] All links navigate to correct detail pages
- [ ] Dashboard reflects user's business access (GCMC/KAJ filtering)
- [ ] Manager sees all data for their business
- [ ] Admin sees combined data from both businesses
- [ ] Data refreshes when navigating to dashboard

### Technical Requirements
- [ ] Dashboard loads in < 2 seconds
- [ ] Each API endpoint responds in < 500ms
- [ ] All queries properly indexed for performance
- [ ] TanStack Query caches responses appropriately
- [ ] Business filtering prevents data leakage
- [ ] API returns proper HTTP status codes
- [ ] Error states handled gracefully
- [ ] Loading states show before data arrives
- [ ] No unnecessary re-fetching on rerenders

### User Experience
- [ ] Dashboard loads quickly with skeleton loaders
- [ ] Statistics cards use meaningful icons
- [ ] Colors are visually consistent with other modules
- [ ] Overdue count visually stands out (red)
- [ ] Status cards use consistent color coding
- [ ] Empty states are helpful and clear
- [ ] Links are obviously clickable
- [ ] Mobile layout stacks sections appropriately
- [ ] Dashboard provides at-a-glance business health
- [ ] No layout shift during loading

## Test Cases

### Unit Tests (API Layer)
```typescript
describe('Dashboard API', () => {
  test('getStats returns all statistics')
  test('getStats filters by user business')
  test('getStats counts only active clients')
  test('getStats counts only open matters')
  test('getStats counts upcoming deadlines (7 days)')
  test('getStats counts overdue deadlines correctly')
  test('getMattersByStatus returns all statuses')
  test('getMattersByStatus includes zero counts')
  test('getMattersByStatus filters by business')
  test('getRecentMatters returns last N matters')
  test('getRecentMatters includes relations')
  test('getRecentMatters respects limit parameter')
  test('getRecentMatters filters by business')
  test('getUpcomingDeadlines returns next N deadlines')
  test('getUpcomingDeadlines excludes completed')
  test('getUpcomingDeadlines orders by dueDate asc')
  test('getUpcomingDeadlines filters by business')
  test('getRecentClients returns last N clients')
  test('getMattersByBusiness returns business breakdown')
})

describe('Dashboard Performance', () => {
  test('getStats completes in < 500ms with 1000 records')
  test('getMattersByStatus completes in < 500ms')
  test('getRecentMatters completes in < 500ms')
  test('all endpoints use proper indexes')
})
```

### Integration Tests (E2E)
```typescript
describe('Dashboard Flow', () => {
  test('view dashboard and see all widgets')
  test('click recent matter and navigate to detail')
  test('click upcoming deadline and navigate to calendar')
  test('verify statistics match actual data counts')
  test('GCMC staff sees only GCMC data')
  test('KAJ staff sees only KAJ data')
  test('admin sees combined data from both businesses')
  test('dashboard refreshes on navigation')
})

describe('Dashboard Empty States', () => {
  test('new user sees zero statistics')
  test('empty states show helpful messages')
  test('call-to-action buttons work')
})
```

### Manual Test Scenarios
1. **Initial Dashboard Load**
   - Login to application
   - Verify redirects to dashboard
   - Verify all 5 statistics cards load
   - Verify matters by status card loads
   - Verify recent matters list loads
   - Verify upcoming deadlines list loads
   - Check loading states show briefly

2. **Verify Statistics Accuracy**
   - Note active client count
   - Navigate to clients, count active clients
   - Verify counts match
   - Repeat for open matters
   - Repeat for upcoming deadlines
   - Repeat for total documents

3. **Matters by Status**
   - Note counts for each status
   - Navigate to matters
   - Filter by each status
   - Verify counts match dashboard

4. **Recent Matters List**
   - View recent matters on dashboard
   - Note top matter
   - Click on matter title
   - Verify navigates to matter detail
   - Verify is correct matter
   - Return to dashboard

5. **Upcoming Deadlines List**
   - View upcoming deadlines
   - Note top deadline
   - Click on deadline title
   - Verify navigates to calendar
   - Verify deadline is visible

6. **Business Filtering**
   - Login as GCMC staff
   - Note dashboard statistics
   - Verify only GCMC data shown
   - Login as KAJ staff
   - Verify only KAJ data shown
   - Login as admin
   - Verify combined data shown

7. **Empty States**
   - Use test account with no data
   - View dashboard
   - Verify statistics show 0
   - Verify empty state messages
   - Click "Add Client" CTA
   - Verify navigates to new client form

8. **Overdue Indicators**
   - Create overdue deadline
   - Refresh dashboard
   - Verify overdue count increased
   - Verify count is red/urgent color
   - Complete overdue deadline
   - Verify count decreased

9. **Mobile Responsiveness**
   - View dashboard on mobile viewport
   - Verify statistics cards stack vertically
   - Verify matters by status is readable
   - Verify recent items lists are usable
   - Test all links work on mobile
