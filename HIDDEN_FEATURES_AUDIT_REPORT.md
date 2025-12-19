# Hidden Features Audit Report

**Generated:** 2025-12-19
**Auditor:** Claude Code
**Project:** GK-Nexus (SYNERGY-GY)

---

## Executive Summary

This audit compares API capabilities against UI exposure to identify hidden features, unused filters, and partial implementations.

| Category | Total Gaps Found |
|----------|------------------|
| Quick Wins (< 30 min) | 12 |
| Medium Effort (1-4 hours) | 8 |
| Large Effort (> 4 hours) | 4 |
| **Total** | **24** |

---

## Quick Wins (Wire Existing API to UI)

### 1. Invoices - Client Filter Dropdown
**Effort:** 15 minutes
**API:** `invoices.list` accepts `clientId` filter
**UI Gap:** No client dropdown on invoices list page

**Fix:**
```tsx
// apps/web/src/routes/app/invoices/index.tsx
// Add client selector like other list pages
<ClientSelector
  value={clientFilter}
  onChange={(value) => setClientFilter(value)}
/>
```

---

### 2. Invoices - Date Range Filter
**Effort:** 20 minutes
**API:** `invoices.list` accepts `fromDate`, `toDate`
**UI Gap:** No date pickers on invoices list

**Fix:** Add two date inputs for fromDate/toDate filtering

---

### 3. Invoices - Sort Dropdown
**Effort:** 15 minutes
**API:** `sortBy: invoiceNumber | invoiceDate | dueDate | totalAmount | status`
**UI Gap:** No sort dropdown, defaults to invoiceDate desc

**Fix:** Add sort dropdown with options

---

### 4. Matters - Assigned Staff Filter
**Effort:** 15 minutes
**API:** `matters.list` accepts `assignedStaffId`
**UI Gap:** No staff filter on matters list

**Fix:** Add staff selector dropdown

---

### 5. Matters - Client Filter
**Effort:** 15 minutes
**API:** `matters.list` accepts `clientId`
**UI Gap:** No client filter on matters list

**Fix:** Add client selector dropdown

---

### 6. Matters - Sort Dropdown
**Effort:** 15 minutes
**API:** `sortBy: referenceNumber | createdAt | dueDate | status`
**UI Gap:** No sort dropdown

**Fix:** Add sort dropdown

---

### 7. Clients - Sort Dropdown
**Effort:** 15 minutes
**API:** `sortBy: displayName | createdAt | updatedAt | activeMatterCount`
**UI Gap:** No sort dropdown on clients list

**Fix:** Add sort dropdown

---

### 8. Clients - Bulk Assign Staff
**Effort:** 20 minutes
**API:** `clients.bulk.assignStaff` exists
**UI Gap:** Bulk actions only show Archive/Export, not Assign Staff

**Fix:** Add "Assign Staff" button to bulk actions toolbar

---

### 9. Appointments - Business Filter
**Effort:** 10 minutes
**API:** `appointments.list` accepts `business`
**UI Gap:** No business (GCMC/KAJ) filter

**Fix:** Add business selector dropdown

---

### 10. Appointments - Staff Filter
**Effort:** 15 minutes
**API:** `appointments.list` accepts `staffId`
**UI Gap:** No staff filter

**Fix:** Add staff selector dropdown

---

### 11. Appointments - Search Box
**Effort:** 10 minutes
**API:** `appointments.list` accepts `search`
**UI Gap:** No search input field

**Fix:** Add search input

---

### 12. Appointments - Appointment Type Filter
**Effort:** 15 minutes
**API:** `appointments.list` accepts `appointmentTypeId`
**UI Gap:** No appointment type dropdown

**Fix:** Add appointment type selector

---

## Medium Effort (1-4 hours)

### 1. Dashboard - Financial Summary Widget
**Effort:** 2 hours
**API:** `invoices.getSummary` returns totalRevenue, totalOutstanding, totalOverdue
**UI Gap:** Dashboard doesn't show financial metrics

**Implementation:**
- Add new StatsCards for revenue metrics
- Query invoices.getSummary on dashboard
- Display total outstanding, overdue amounts

---

### 2. Dashboard - Recent Clients Widget
**Effort:** 1 hour
**API:** `dashboard.getRecentClients` exists
**UI Gap:** Dashboard shows Recent Matters but not Recent Clients

**Implementation:**
- Add new card similar to Recent Matters
- Query dashboard.getRecentClients

---

### 3. Dashboard - Business Filter Toggle
**Effort:** 2 hours
**API:** All dashboard queries respect business access
**UI Gap:** No way to filter dashboard by GCMC/KAJ

**Implementation:**
- Add toggle buttons at top
- Pass business filter to all dashboard queries

---

### 4. Reports - Custom Reports CRUD
**Effort:** 4 hours
**API:** `reports.custom.*` - create, update, delete, listCustomReports
**UI Gap:** No UI for creating custom report templates

**Implementation:**
- Add "Custom Reports" section to reports page
- Create/edit form for custom report definitions
- List saved custom reports

---

### 5. Reports - Scheduled Reports
**Effort:** 4 hours
**API:** `reports.scheduled.*` - create, update, delete schedules
**UI Gap:** No UI for scheduling automatic reports

**Implementation:**
- Add "Schedule" button on report execution
- Modal for setting frequency, recipients
- List of scheduled reports

---

### 6. Reports - Report History
**Effort:** 2 hours
**API:** `reports.history` endpoint exists
**UI Gap:** No way to view past report executions

**Implementation:**
- Add "History" tab on reports page
- Show past executions with download links

---

### 7. Invoices - Summary Stats Cards
**Effort:** 1.5 hours
**API:** `invoices.getSummary` returns comprehensive stats
**UI Gap:** No summary cards at top of invoices list

**Implementation:**
- Add stats row showing total invoiced, outstanding, overdue
- Similar to aging report but as permanent summary

---

### 8. Documents - Client/Matter Filters
**Effort:** 1.5 hours
**API:** `documents.list` accepts `clientId`, `matterId`
**UI Gap:** Documents page has many filters but not client/matter selectors

**Implementation:**
- Add client selector dropdown
- Add matter selector dropdown (filtered by selected client)

---

## Large Effort (> 4 hours)

### 1. Bulk Status Updates (Multiple Entities)
**Effort:** 6 hours
**API:**
- `invoices.bulk.updateStatus` - change status for multiple
- `clients.bulk.updateStatus` - change status for multiple
**UI Gap:** Bulk actions exist but general status update not exposed

**Implementation:**
- Add status change modal to bulk actions
- Allow selecting target status
- Show confirmation with affected count

---

### 2. Dashboard Widget Customization
**Effort:** 8 hours
**API:** Dashboard endpoints exist but no customization
**UI Gap:** Fixed dashboard layout, no user preferences

**Implementation:**
- Allow users to show/hide widgets
- Drag-drop reordering
- Save preferences to user settings

---

### 3. Report Builder UI
**Effort:** 10+ hours
**API:** Custom reports backend exists
**UI Gap:** No visual report builder

**Implementation:**
- Drag-drop field selector
- Filter builder
- Preview functionality
- Save as template

---

### 4. Calendar Sync Integration
**Effort:** 8+ hours
**API:** Appointments have all necessary data
**UI Gap:** No Google/Outlook calendar sync

**Implementation:**
- OAuth integration
- Two-way sync logic
- Conflict resolution

---

## Summary by Entity

### Clients Page
| Feature | API Status | UI Status | Effort |
|---------|------------|-----------|--------|
| Search | ✅ | ✅ | - |
| Type filter | ✅ | ✅ | - |
| Business filter | ✅ | ✅ | - |
| Status filter | ✅ | ✅ | - |
| Sort dropdown | ✅ Exists | ❌ Missing | 15 min |
| Bulk archive | ✅ | ✅ | - |
| Bulk export | ✅ | ✅ | - |
| Bulk assign staff | ✅ Exists | ❌ Missing | 20 min |
| Bulk status update | ✅ Exists | ❌ Missing | 6 hours |

### Invoices Page
| Feature | API Status | UI Status | Effort |
|---------|------------|-----------|--------|
| Search | ✅ | ✅ | - |
| Status filter | ✅ | ✅ | - |
| Business filter | ✅ | ✅ | - |
| Client filter | ✅ Exists | ❌ Missing | 15 min |
| Matter filter | ✅ Exists | ❌ Missing | 15 min |
| Date range | ✅ Exists | ❌ Missing | 20 min |
| Sort dropdown | ✅ Exists | ❌ Missing | 15 min |
| Aging report | ✅ | ✅ | - |
| Bulk export | ✅ | ✅ | - |
| Bulk mark paid | ✅ | ✅ | - |
| Summary stats | ✅ Exists | ❌ Missing | 1.5 hours |

### Matters Page
| Feature | API Status | UI Status | Effort |
|---------|------------|-----------|--------|
| Search | ✅ | ✅ | - |
| Status filter | ✅ | ✅ | - |
| Business filter | ✅ | ✅ | - |
| Client filter | ✅ Exists | ❌ Missing | 15 min |
| Assigned staff filter | ✅ Exists | ❌ Missing | 15 min |
| Sort dropdown | ✅ Exists | ❌ Missing | 15 min |
| Bulk export | ✅ | ✅ | - |

### Appointments Page
| Feature | API Status | UI Status | Effort |
|---------|------------|-----------|--------|
| Status filter | ✅ | ✅ | - |
| Date range presets | ✅ | ✅ | - |
| Search | ✅ Exists | ❌ Missing | 10 min |
| Business filter | ✅ Exists | ❌ Missing | 10 min |
| Staff filter | ✅ Exists | ❌ Missing | 15 min |
| Client filter | ✅ Exists | ❌ Missing | 15 min |
| Type filter | ✅ Exists | ❌ Missing | 15 min |

### Reports Page
| Feature | API Status | UI Status | Effort |
|---------|------------|-----------|--------|
| Report types | ✅ | ✅ | - |
| Business filter | ✅ | ✅ | - |
| Client filter | ✅ | ✅ | - |
| Date range | ✅ | ✅ | - |
| Export formats | ✅ | ✅ | - |
| Custom reports | ✅ Exists | ❌ Missing | 4 hours |
| Scheduled reports | ✅ Exists | ❌ Missing | 4 hours |
| Report history | ✅ Exists | ❌ Missing | 2 hours |

### Dashboard
| Feature | API Status | UI Status | Effort |
|---------|------------|-----------|--------|
| Stats cards | ✅ | ✅ | - |
| Matters by status | ✅ | ✅ | - |
| Recent matters | ✅ | ✅ | - |
| Upcoming deadlines | ✅ | ✅ | - |
| Recent clients | ✅ Exists | ❌ Missing | 1 hour |
| Matters by business | ✅ Exists | ❌ Missing | 1 hour |
| Financial summary | ✅ Exists | ❌ Missing | 2 hours |
| Business filter | API Ready | ❌ Missing | 2 hours |

### Documents Page
| Feature | API Status | UI Status | Effort |
|---------|------------|-----------|--------|
| Search | ✅ | ✅ | - |
| Category filter | ✅ | ✅ | - |
| Status filter | ✅ | ✅ | - |
| Date range | ✅ | ✅ | - |
| File type filter | ✅ | ✅ | - |
| Client filter | ✅ Exists | ❌ Missing | 30 min |
| Matter filter | ✅ Exists | ❌ Missing | 30 min |
| Bulk download | ✅ | ✅ | - |
| Bulk archive | ✅ | ✅ | - |

### Training Page
| Feature | API Status | UI Status | Effort |
|---------|------------|-----------|--------|
| Search | ✅ | ✅ | - |
| Category filter | ✅ | ✅ | - |
| Active status filter | ✅ | ✅ | - |
| Course management | ✅ | ✅ | - |
| Schedule management | ✅ | ✅ | - |
| Enrollment tracking | ✅ | ✅ | - |

---

## Priority Implementation Order

### Phase 1: Quick Wins (1-2 days)
1. Add sort dropdowns to Clients, Matters, Invoices lists
2. Add client/matter filters to Invoices page
3. Add date range filters to Invoices page
4. Add search/filters to Appointments page
5. Add Bulk Assign Staff to Clients

### Phase 2: Dashboard Enhancements (2-3 days)
1. Add Financial Summary widget
2. Add Recent Clients widget
3. Add Business filter toggle
4. Add Invoice summary stats to Invoices page

### Phase 3: Reports Features (1 week)
1. Implement Custom Reports UI
2. Implement Scheduled Reports
3. Add Report History view

### Phase 4: Advanced Features (2+ weeks)
1. Bulk status updates with modal
2. Dashboard customization
3. Report builder UI
4. Calendar sync integration

---

## Notes

- All "Quick Win" items involve wiring existing API endpoints to UI components
- No backend changes required for Phase 1 items
- Phase 2 requires no new APIs, just new UI components querying existing endpoints
- Phase 3 requires building new UI screens for existing API capabilities
- Phase 4 may require some backend enhancements

---

## Appendix: API Endpoints Not Used in UI

### reports.ts
- `reports.custom.create` - Not exposed
- `reports.custom.update` - Not exposed
- `reports.custom.delete` - Not exposed
- `reports.custom.listCustomReports` - Not exposed
- `reports.scheduled.create` - Not exposed
- `reports.scheduled.update` - Not exposed
- `reports.scheduled.delete` - Not exposed
- `reports.history` - Not exposed

### dashboard.ts
- `dashboard.getRecentClients` - Not used
- `dashboard.getMattersByBusiness` - Not used

### invoices.ts
- `invoices.getSummary` - Not displayed (only aging report shown)
- `invoices.bulk.updateStatus` - Only markAsPaid exposed, not general status

### clients.ts
- `clients.bulk.assignStaff` - Not exposed in UI
- `clients.bulk.updateStatus` - Not exposed (only archive)
