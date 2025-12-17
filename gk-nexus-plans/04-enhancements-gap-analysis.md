# Plan 04: General System Enhancements and Gap Analysis

> **Priority:** P3 - Backlog / Ongoing
> **Estimated Effort:** Ongoing (feature backlog)
> **Status:** 🟡 Audit Complete, Backlog Active
> **Last Updated:** December 17, 2024

---

## 🔍 Audit Findings (December 17, 2024)

### Existing Features Discovered
- ✅ **Document Expiry Tracking** - Already implemented with color-coded urgency levels
- ✅ **Email Integration (Resend)** - Already working
- ✅ **Document Tags System** - Now displaying in UI and searchable
- ✅ **Bulk Selection/Actions** - Documents page has bulk toolbar
- ✅ **Toast Notifications** - Sonner implementation across app
- ✅ **Skeleton Loaders** - Used in several components
- ✅ **Knowledge Base Route** - Now accessible via sidebar navigation

### Technical Debt Identified
| Item | Location | Priority |
|------|----------|----------|
| Duplicate category colors | `documents/index.tsx`, `document-quick-view.tsx` | High |
| Inline error states | `documents/index.tsx:623` | Medium |
| Monolithic route files | `documents/index.tsx` (865 lines) | Medium |
| Missing aria-busy states | Multiple loading states | Low |

### Integration Status
- GRA/NIS API: No public API available (manual form filling required)
- Payment Gateways: Research needed for Guyana options
- SMS: Research needed for local providers

---

## 📋 Purpose

This document serves as a comprehensive backlog of enhancements, feature gaps, and improvements identified for SYNERGY-GY. Items here are prioritized and can be pulled into active sprints as capacity allows.

---

## 🎯 Feature Gap Analysis

### 1. Client Management Enhancements

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| Client Portal - Document Upload | Allow clients to upload documents from portal | High | 🔴 |
| Client Portal - Messaging | In-app chat/messaging with staff | Medium | 🔴 |
| Client Portal - Invoice Payment | Online payment integration | Low | 🔴 |
| Client Portal - Appointments | Schedule meetings with staff | Low | 🔴 |
| Client Onboarding Checklist | Automated checklist per service type | High | 🔴 |
| Document Expiry Tracking | Alert when ID/licenses expire | Medium | 🟢 ✅ |
| Related Parties | Link family members/business partners | Low | 🔴 |
| Client Merge | Merge duplicate client records | Medium | 🔴 |
| Bulk Import | Import clients from CSV/Excel | Medium | 🔴 |
| Activity Timeline | Visual history of all client activities | Medium | 🔴 |

**Detailed Specifications:**

#### Client Portal - Document Upload
```
Requirements:
- Secure upload from client portal
- File type restrictions (PDF, images, common docs)
- Max file size: 10MB
- Auto-notify assigned staff
- Documents go to "Pending Review" status
- Staff can approve/reject with comments
```

#### Client Onboarding Checklist
```
Requirements:
- Template checklists per service type
- Automatic checklist assignment on client creation
- Progress tracking (% complete)
- Reminder notifications for incomplete items
- Bulk checklist management
```

---

### 2. Matter Management Enhancements

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| Matter Templates | Pre-configured checklists per service | High | 🔴 |
| Matter Cloning | Duplicate existing matter | Medium | 🔴 |
| Status Automation | Auto-update based on checklist | Medium | 🔴 |
| Matter Dependencies | Link related matters | Low | 🔴 |
| Recurring Matters | Auto-create annual returns, etc. | High | 🔴 |
| Profitability Report | Revenue vs. time spent per matter | Medium | 🔴 |
| Time Tracking | Track time spent on matter tasks | High | 🔴 |
| Kanban View | Drag-drop matter status board | Medium | 🔴 |

**Detailed Specifications:**

#### Matter Templates
```
Requirements:
- Define templates per service type (Tax Filing, Audit, etc.)
- Include: default checklist, estimated fee, typical timeline
- Apply template on matter creation
- Allow modification after creation
- Track template usage statistics
```

#### Recurring Matters
```
Requirements:
- Define recurrence pattern (annual, quarterly, monthly)
- Auto-create X days before deadline
- Copy relevant documents from previous matter
- Pre-fill known information
- Notification to assigned staff
- Examples: Annual Tax Returns, Quarterly VAT, Monthly PAYE
```

#### Time Tracking
```
Requirements:
- Timer widget (start/stop/pause)
- Manual time entry
- Associate time with matter
- Associate time with task (optional)
- Billable vs. non-billable
- Hourly rate per staff member
- Time reports by matter/client/staff
- Integration with invoicing
```

---

### 3. Deadline/Calendar System

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| Visual Calendar | Month/week/day calendar view | High | 🔴 |
| Deadline Types | Tax, Court, Renewal, Custom | High | 🔴 |
| Recurring Deadlines | Templates for annual deadlines | High | 🔴 |
| Reminders | Email, in-app, SMS notifications | High | 🔴 |
| Calendar Sync | Google Calendar, Outlook integration | Medium | 🔴 |
| Staff Workload View | See assignments across staff | Medium | 🔴 |
| Deadline Reassignment | Transfer deadlines between staff | Medium | 🔴 |

**Detailed Specifications:**

#### Visual Calendar
```
Requirements:
- Full calendar component (FullCalendar or similar)
- Views: Month, Week, Day, Agenda
- Color coding by type/priority
- Click to view deadline details
- Drag to reschedule
- Filter by: staff, client, matter, type
- Print calendar view
```

#### Guyana Tax Deadline Templates
```
Pre-configured deadlines:
- PAYE Form 5: 14th of each month
- VAT Return: 21st of each month
- NIS Contributions: 15th of each month
- Annual Income Tax (Individual): April 30
- Annual Income Tax (Company): April 30
- Annual Property Tax: Varies by region
- Form 2 (PAYE Summary): January 31
- Form 7B Distribution: February 28
```

---

### 4. Invoice Enhancements

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| Recurring Invoices | Auto-generate periodic invoices | Medium | 🔴 |
| Payment Plans | Installment tracking | Low | 🔴 |
| Online Payments | Payment gateway integration | Low | 🔴 |
| Aging Report | Overdue invoice analysis | High | 🔴 |
| Statement of Accounts | Client account summary | Medium | 🔴 |
| Credit Notes | Refunds and adjustments | Medium | 🔴 |
| Time-based Billing | Generate from time entries | High | 🔴 |
| Invoice Templates | Multiple invoice designs | Low | 🔴 |

**Detailed Specifications:**

#### Aging Report
```
Requirements:
- Group invoices by age: Current, 30, 60, 90, 120+ days
- Filter by client, business, staff
- Show total outstanding per period
- Exportable to Excel/PDF
- Click-through to invoice details
- Trend analysis (improving/worsening)
```

#### Time-based Billing
```
Requirements:
- Select matter with unbilled time
- Choose time entries to include
- Apply hourly rates (staff-specific or matter-specific)
- Generate draft invoice
- Review and adjust before finalizing
- Mark time entries as billed
```

---

### 5. Reporting Dashboard

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| KPI Dashboard | Real-time metrics | High | 🔴 |
| Revenue Reports | MTD, YTD, by business/service | High | 🔴 |
| Client Reports | Acquisition, retention, value | Medium | 🔴 |
| Staff Reports | Utilization, productivity | Medium | 🔴 |
| Custom Report Builder | User-defined reports | Low | 🔴 |
| Scheduled Reports | Auto-email reports | Low | 🔴 |
| Export Options | Excel, PDF, CSV | High | 🔴 |

**Detailed Specifications:**

#### KPI Dashboard Widgets
```
Widget Ideas:
1. Revenue MTD vs. Target (gauge)
2. Outstanding Receivables (amount + aging breakdown)
3. Active Matters by Status (pie chart)
4. Upcoming Deadlines (next 7 days list)
5. Recent Client Activity (feed)
6. Staff Workload (bar chart)
7. New Clients This Month (count + trend)
8. Invoice Collection Rate (percentage)
9. Overdue Tasks (count with severity)
10. Business Split (GCMC vs. KAJ revenue)
```

---

### 6. Workflow Automation

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| Trigger-based Actions | Automated responses to events | Medium | 🔴 |
| Email Templates | Standardized email responses | High | 🔴 |
| Notification Rules | Custom notification preferences | Medium | 🔴 |
| Task Auto-assignment | Rules-based task distribution | Low | 🔴 |
| Approval Workflows | Multi-step approval processes | Low | 🔴 |

**Detailed Specifications:**

#### Trigger-based Actions
```
Example Triggers:
- Client Created → Send welcome email
- Matter Created → Notify assigned staff
- Deadline in 7 days → Send reminder email
- Deadline in 3 days → Send urgent reminder
- Deadline passed → Alert manager
- Invoice created → Email to client
- Invoice overdue 30 days → Send reminder
- Invoice overdue 60 days → Send final notice
- Document uploaded (by client) → Notify staff
- Client portal login → Log activity

Actions:
- Send email (template-based)
- Create task
- Send notification (in-app)
- Update field
- Create calendar event
- Assign to staff member
```

---

### 7. Communication Features

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| Notification Center | Centralized notifications | High | 🔴 |
| Email Template Manager | CRUD for email templates | Medium | 🔴 |
| SMS Integration | Text message notifications | Low | 🔴 |
| Communication Log | Per-client/matter history | Medium | 🔴 |
| Internal Messaging | Staff-to-staff chat | Low | 🔴 |
| @Mentions | Tag colleagues in notes | Medium | 🔴 |

**Detailed Specifications:**

#### Notification Center
```
Requirements:
- Bell icon in header with unread count
- Dropdown showing recent notifications
- Mark as read (individual/all)
- Notification types: Tasks, Deadlines, Documents, Invoices, System
- Click to navigate to relevant item
- Notification preferences (per type)
- Full notification history page
```

---

### 8. Audit and Compliance

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| Audit Log Viewer | UI for viewing audit trails | Medium | 🔴 |
| Data Export | Regulatory compliance export | Medium | 🔴 |
| Retention Policies | Automated data archival | Low | 🔴 |
| Access Reports | Who accessed what, when | Medium | 🔴 |
| 2FA Enforcement | Require two-factor auth | High | 🔴 |
| Password Policies | Complexity, expiry rules | Medium | 🔴 |

---

### 9. Integration Points

| Integration | Description | Priority | Status |
|-------------|-------------|----------|--------|
| GRA eServices | Direct API integration (if available) | Low | 🔴 |
| NIS Portal | Direct API integration (if available) | Low | 🔴 |
| Payment Gateway | Online payments (future) | Low | 🔴 |
| Email (Resend) | Already implemented | ✅ | 🟢 |
| Cloud Backup | Automated backups | Medium | 🔴 |
| Accounting Export | QuickBooks, Xero format | Medium | 🔴 |

---

### 10. Mobile & PWA

| Feature | Description | Priority | Status |
|---------|-------------|----------|--------|
| Responsive Verification | All pages mobile-friendly | High | 🟡 |
| PWA Installation | Add to home screen | Medium | 🔴 |
| Camera Upload | Quick document capture | Medium | 🔴 |
| Offline Mode | View cached data offline | Low | 🔴 |
| Push Notifications | Mobile push alerts | Medium | 🔴 |

---

## 📊 Priority Matrix

### P0 - Critical (Current Sprint)
*Already covered in Plans 01-03*

### P1 - High Priority (Next 1-2 Sprints)

1. **Time Tracking** - Foundation for billing
2. **Visual Calendar** - Critical for deadline management
3. **Recurring Matters** - Efficiency for annual work
4. **Notification Center** - User engagement
5. **Aging Report** - Cash flow management
6. **Email Templates** - Communication efficiency

### P2 - Medium Priority (3-6 Month Roadmap)

1. Client Portal - Document Upload
2. Matter Templates
3. Statement of Accounts
4. KPI Dashboard
5. Workflow Triggers
6. @Mentions in Notes
7. Client Activity Timeline
8. Staff Workload View

### P3 - Low Priority (Future/Backlog)

1. Online Payment Integration
2. SMS Notifications
3. Custom Report Builder
4. GRA/NIS API Integration
5. Offline Mode
6. Client Portal Messaging
7. Internal Staff Chat
8. Approval Workflows

---

## 🎯 Success Metrics

| Metric | Current | Target | Timeline |
|--------|---------|--------|----------|
| Time to create invoice | Manual | From time entries | P1 |
| Deadline visibility | Per matter | Calendar view | P1 |
| Overdue invoice tracking | Manual | Automated aging | P1 |
| Client communication | Email | Centralized + templates | P2 |
| Staff utilization visibility | None | Dashboard | P2 |
| Mobile usability | ~70% | 100% | P1 |

---

## 📝 Technical Debt Items

| Item | Description | Priority |
|------|-------------|----------|
| oRPC Pattern Consistency | Standardize all frontend calls | High |
| Error Handling | Consistent error boundaries | Medium |
| Loading States | Skeleton loaders everywhere | Medium |
| Test Coverage | Add E2E tests for critical paths | Medium |
| Documentation | API documentation | Low |
| Performance | Query optimization, caching | Medium |

---

## 🗓️ Suggested Sprint Planning

### Sprint N+1 (After Plans 01-03)
- Time Tracking (core)
- Visual Calendar (basic)
- Notification Center

### Sprint N+2
- Time Tracking (billing integration)
- Calendar (deadline templates)
- Email Templates

### Sprint N+3
- Recurring Matters
- Aging Report
- KPI Dashboard (basic)

### Sprint N+4
- Client Portal Upload
- Matter Templates
- Workflow Triggers (basic)

---

## 📚 Research Required

| Topic | Purpose | Status |
|-------|---------|--------|
| GRA eServices API | Integration possibility | 🔴 |
| NIS API availability | Integration possibility | 🔴 |
| Payment gateways in Guyana | Online payment options | 🔴 |
| SMS providers in Guyana | Text notification options | 🔴 |
| Calendar libraries | Best fit for React/TanStack | 🔴 |
| Time tracking UX | Best practices research | 🔴 |

---

## ✅ Completion Tracking

| Category | Total Items | Completed | Progress |
|----------|-------------|-----------|----------|
| Client Management | 10 | 1 | 10% |
| Matter Management | 8 | 0 | 0% |
| Calendar/Deadlines | 7 | 0 | 0% |
| Invoicing | 8 | 0 | 0% |
| Reporting | 7 | 0 | 0% |
| Automation | 5 | 0 | 0% |
| Communication | 6 | 0 | 0% |
| Audit/Compliance | 6 | 0 | 0% |
| Integrations | 6 | 1 | 17% |
| Mobile/PWA | 5 | 0 | 0% |
| **TOTAL** | **68** | **2** | **3%** |

### Recently Completed (December 2024)
- ✅ Document Expiry Tracking with urgency levels
- ✅ Email Integration (Resend)
- ✅ Document Tags Display & Search
- ✅ Knowledge Base Navigation

---

*Plan Created: December 2024*
*For: Claude Code AI-assisted development*
*This document should be regularly updated as features are completed or priorities change.*
