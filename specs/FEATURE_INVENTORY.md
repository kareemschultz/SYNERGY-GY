# GK-Nexus Feature Inventory

> Auto-generated comprehensive feature inventory based on codebase analysis.
> Last updated: 2025-12-23

## Overview

GK-Nexus is a comprehensive business management platform for **Green Crescent Management Consultancy (GCMC)** and **KAJ Financial Services** in Guyana. The platform provides client management, matter tracking, invoicing, document management, tax calculations, and client portal features.

## Quick Stats

| Category | Count |
|----------|-------|
| Database Tables | 70+ |
| API Routers | 26 |
| API Endpoints | 200+ |
| UI Routes | 69 |
| Feature Areas | 16 |

---

## Feature Areas

### 1. Authentication & Authorization

| Feature | Status | Routes | API Endpoints |
|---------|--------|--------|---------------|
| Staff Login | ✅ Complete | `/login` | `auth.signIn` |
| Session Management | ✅ Complete | - | `auth.session` |
| Role-Based Access | ✅ Complete | - | Context middleware |
| Password Setup | ✅ Complete | `/staff/setup-password` | `staffSetup.setupPassword` |
| Portal Authentication | ✅ Complete | `/portal/login` | `portal.login` |

**Roles:**
- OWNER - Full system access
- GCMC_MANAGER - GCMC management
- KAJ_MANAGER - KAJ management
- STAFF_GCMC - GCMC staff
- STAFF_KAJ - KAJ staff
- STAFF_BOTH - Both businesses
- RECEPTIONIST - Limited access

---

### 2. Dashboard

| Feature | Status | Routes | API Endpoints |
|---------|--------|--------|---------------|
| KPI Overview | ✅ Complete | `/app` | `dashboard.getStats` |
| Matter Status Chart | ✅ Complete | `/app` | `dashboard.getMattersByStatus` |
| Recent Matters | ✅ Complete | `/app` | `dashboard.getRecentMatters` |
| Upcoming Deadlines | ✅ Complete | `/app` | `dashboard.getUpcomingDeadlines` |
| Financial Summary | ✅ Complete | `/app` | `dashboard.getFinancialSummary` |

---

### 3. Client Management

| Feature | Status | Routes | API Endpoints |
|---------|--------|--------|---------------|
| Client List | ✅ Complete | `/app/clients` | `clients.list`, `clients.listWithStats` |
| Quick Add Client | ✅ Complete | `/app/clients/new` | `clients.create` |
| Client Onboarding Wizard | ✅ Complete | `/app/clients/onboard` | `clients.create` + services |
| Client Detail | ✅ Complete | `/app/clients/$id` | `clients.getById`, `clients.getDashboard` |
| Client Search | ✅ Complete | `/app/clients` | `clients.search` |
| Bulk Archive | ✅ Complete | `/app/clients` | `clients.archive` |
| Bulk Export CSV | ✅ Complete | `/app/clients` | `clients.export` |
| Bulk Assign Staff | ✅ Complete | `/app/clients` | `clients.assignStaff` |
| Client Contacts | ✅ Complete | `/app/clients/$id` | `clients.contacts.*` |
| Client Links | ✅ Complete | `/app/clients/$id` | `clients.links.*` |
| Communications Log | ✅ Complete | `/app/clients/$id` | `clients.communications.*` |

**Client Types:**
- Individual
- Small Business
- Corporation
- NGO
- Cooperative
- Credit Union
- Foreign National
- Investor

---

### 4. Matters/Cases

| Feature | Status | Routes | API Endpoints |
|---------|--------|--------|---------------|
| Matter List | ✅ Complete | `/app/matters` | `matters.list` |
| Create Matter | ✅ Complete | `/app/matters/new` | `matters.create` |
| Matter Wizard | ✅ Complete | `/app/matters/wizard` | `matters.create` + checklist |
| Matter Detail | ✅ Complete | `/app/matters/$id` | `matters.getById` |
| Matter Checklist | ✅ Complete | `/app/matters/$id` | `matters.checklist.*` |
| Matter Notes | ✅ Complete | `/app/matters/$id` | `matters.notes.*` |
| Bulk Status Update | ✅ Complete | `/app/matters` | `matters.updateStatus` |
| Bulk Export | ✅ Complete | `/app/matters` | `matters.export` |

**Matter Statuses:**
- NEW
- IN_PROGRESS
- PENDING_CLIENT
- SUBMITTED
- COMPLETE
- CANCELLED

---

### 5. Documents

| Feature | Status | Routes | API Endpoints |
|---------|--------|--------|---------------|
| Document List | ✅ Complete | `/app/documents` | `documents.list` |
| Document Upload | ✅ Complete | `/app/documents/upload` | `documents.prepareUpload` |
| Document Preview | ✅ Complete | `/app/documents` | `documents.getDownloadUrl` |
| Document Templates | ✅ Complete | `/app/documents/templates` | `documents.templates.*` |
| Template Generation | ✅ Complete | `/app/documents/templates` | `documents.templates.generate` |
| Bulk Archive | ✅ Complete | `/app/documents` | `documents.archive` |
| Expiring Docs Alert | ✅ Complete | `/app/documents` | `documents.getExpiring` |

**Document Categories:**
- IDENTITY
- TAX
- FINANCIAL
- LEGAL
- IMMIGRATION
- BUSINESS
- CORRESPONDENCE
- TRAINING
- OTHER

---

### 6. Invoicing

| Feature | Status | Routes | API Endpoints |
|---------|--------|--------|---------------|
| Invoice List | ✅ Complete | `/app/invoices` | `invoices.list` |
| Create Invoice | ✅ Complete | `/app/invoices/new` | `invoices.create` |
| Invoice Detail | ✅ Complete | `/app/invoices/$id` | `invoices.getById` |
| Line Items | ✅ Complete | `/app/invoices/$id` | `invoices.lineItems.*` |
| Payments | ✅ Complete | `/app/invoices/$id` | `invoices.payments.*` |
| Mark as Paid | ✅ Complete | `/app/invoices` | `invoices.markAsPaid` |
| Send Invoice | ✅ Complete | `/app/invoices/$id` | `invoices.send` |
| PDF Export | ✅ Complete | `/app/invoices/$id` | `invoices.generatePdf` |
| Aging Report | ✅ Complete | `/app/reports/aging` | `reports.executeReport` |

**Invoice Statuses:**
- DRAFT
- SENT
- PAID
- OVERDUE
- CANCELLED

---

### 7. Appointments

| Feature | Status | Routes | API Endpoints |
|---------|--------|--------|---------------|
| Appointment List | ✅ Complete | `/app/appointments` | `appointments.list` |
| Create Appointment | ✅ Complete | `/app/appointments/new` | `appointments.create` |
| Appointment Detail | ✅ Complete | `/app/appointments/$id` | `appointments.getById` |
| Confirm Appointment | ✅ Complete | `/app/appointments` | `appointments.confirm` |
| Reschedule | ✅ Complete | `/app/appointments/$id` | `appointments.reschedule` |
| Cancel | ✅ Complete | `/app/appointments/$id` | `appointments.cancel` |
| Calendar View | ✅ Complete | `/app/appointments/calendar` | `appointments.list` |
| Staff Availability | ✅ Complete | Admin | `appointments.availability.*` |
| Appointment Types | ✅ Complete | Admin | `appointments.types.*` |

**Appointment Statuses:**
- REQUESTED
- CONFIRMED
- COMPLETED
- CANCELLED
- NO_SHOW
- RESCHEDULED

---

### 8. Calendar & Deadlines

| Feature | Status | Routes | API Endpoints |
|---------|--------|--------|---------------|
| Calendar View | ✅ Complete | `/app/calendar` | `deadlines.list` |
| Create Deadline | ✅ Complete | `/app/calendar/new` | `deadlines.create` |
| Deadline Detail | ✅ Complete | `/app/calendar` | `deadlines.getById` |
| Mark Complete | ✅ Complete | `/app/calendar` | `deadlines.complete` |
| Recurring Deadlines | ✅ Complete | `/app/calendar` | `deadlines.create` |
| Reminders | ✅ Complete | `/app/calendar` | `deadlines.reminders.*` |

**Deadline Types:**
- FILING
- RENEWAL
- PAYMENT
- SUBMISSION
- MEETING
- FOLLOWUP
- OTHER

---

### 9. Training Management

| Feature | Status | Routes | API Endpoints |
|---------|--------|--------|---------------|
| Course List | ✅ Complete | `/app/training` | `training.courses.list` |
| Create Course | ✅ Complete | `/app/training/new` | `training.courses.create` |
| Course Detail | ✅ Complete | `/app/training/courses/$id` | `training.courses.getById` |
| Schedules | ✅ Complete | `/app/training/schedules/$id` | `training.schedules.*` |
| Enrollments | ✅ Complete | `/app/training/enrollments` | `training.enrollments.*` |
| Training Calendar | ✅ Complete | `/app/training/calendar` | `training.schedules.list` |

---

### 10. Service Catalog

| Feature | Status | Routes | API Endpoints |
|---------|--------|--------|---------------|
| Service List | ✅ Complete | `/app/services` | `serviceCatalog.services.list` |
| Service Detail | ✅ Complete | `/app/services/$id` | `serviceCatalog.services.getById` |
| Admin Management | ✅ Complete | `/app/admin/services` | `serviceCatalog.services.*` |
| Categories | ✅ Complete | Admin | `serviceCatalog.categories.*` |

**Service Categories:**
- TAX
- ACCOUNTING
- AUDIT
- NIS
- COMPLIANCE
- FINANCIAL_STATEMENTS
- TRAINING
- CONSULTING
- PARALEGAL
- IMMIGRATION
- BUSINESS_PROPOSALS
- NETWORKING

---

### 11. Tax Calculators

| Feature | Status | Routes | API Endpoints |
|---------|--------|--------|---------------|
| Calculator Hub | ✅ Complete | `/app/calculators` | - |
| PAYE Calculator | ✅ Complete | `/app/calculators/paye` | `taxCalculators.calculatePAYE` |
| VAT Calculator | ✅ Complete | `/app/calculators/vat` | `taxCalculators.calculateVAT` |
| NIS Calculator | ✅ Complete | `/app/calculators/nis` | `taxCalculators.calculateNIS` |
| Salary Calculator | ✅ Complete | `/app/calculators/salary` | `taxCalculators.calculateSalary` |
| Save Calculation | ✅ Complete | All | `taxCalculators.saveCalculation` |

**2025 Guyana Tax Rates:**
- PAYE: 25% (first 3.12M GYD), 40% (above)
- VAT: 14%
- NIS Employee: 5.6%
- NIS Employer: 8.4%
- NIS Ceiling: 280,000 GYD/month

---

### 12. Knowledge Base

| Feature | Status | Routes | API Endpoints |
|---------|--------|--------|---------------|
| KB List | ✅ Complete | `/app/knowledge-base` | `knowledgeBase.list` |
| KB Detail | ✅ Complete | `/app/knowledge-base` | `knowledgeBase.getById` |
| Admin CRUD | ✅ Complete | `/app/admin/knowledge-base` | `knowledgeBase.*` |
| Download Tracking | ✅ Complete | `/app/knowledge-base` | `knowledgeBase.trackDownload` |

**KB Categories:**
- GRA (Tax Authority)
- NIS
- IMMIGRATION
- DCRA (Company Registry)
- GENERAL
- TRAINING
- INTERNAL

---

### 13. Reports & Analytics

| Feature | Status | Routes | API Endpoints |
|---------|--------|--------|---------------|
| Report Hub | ✅ Complete | `/app/reports` | `reports.listReports` |
| Execute Report | ✅ Complete | `/app/reports` | `reports.executeReport` |
| Export PDF/Excel/CSV | ✅ Complete | `/app/reports` | `reports.exportData` |
| Custom Reports | ✅ Complete | `/app/reports/custom` | `reports.executeReport` |
| Aging Report | ✅ Complete | `/app/reports/aging` | `reports.executeReport` |
| Analytics Dashboard | ✅ Complete | `/app/analytics` | `analytics.*` |
| Audit Log | ✅ Complete | `/app/analytics/audit` | `activity.list` |

**Report Categories:**
- CLIENT - Client Summary, Activity
- MATTER - Status, Revenue
- FINANCIAL - Revenue Summary, AR, Invoices
- DEADLINE - Deadline Summary
- STAFF - Productivity

---

### 14. Administration

| Feature | Status | Routes | API Endpoints |
|---------|--------|--------|---------------|
| Staff List | ✅ Complete | `/app/admin/staff` | `admin.list` |
| Create Staff | ✅ Complete | `/app/admin/staff/new` | `admin.create` |
| Staff Detail | ✅ Complete | `/app/admin/staff/$id` | `admin.getById` |
| Toggle Active | ✅ Complete | `/app/admin/staff` | `admin.toggleActive` |
| Reset Password | ✅ Complete | `/app/admin/staff` | `admin.resetPassword` |
| Roles Management | ✅ Complete | `/app/admin/roles` | - |
| Portal Invites | ✅ Complete | `/app/admin/portal-invites` | `portal.sendInvite` |
| System Settings | ✅ Complete | `/app/admin/settings` | `settings.*` |

---

### 15. Client Portal

| Feature | Status | Routes | API Endpoints |
|---------|--------|--------|---------------|
| Portal Login | ✅ Complete | `/portal/login` | `portal.login` |
| Portal Register | ✅ Complete | `/portal/register` | `portal.acceptInvite` |
| Portal Dashboard | ✅ Complete | `/portal` | `portal.getDashboard` |
| View Matters | ✅ Complete | `/portal/matters/$id` | `portal.getMatters` |
| View Documents | ✅ Complete | `/portal/documents` | `portal.getDocuments` |
| Upload Documents | ✅ Complete | `/portal/documents` | `portal.uploadDocument` |
| View Appointments | ✅ Complete | `/portal/appointments` | `portal.getAppointments` |
| View Invoices | ✅ Complete | `/portal/financials` | `portal.getInvoices` |
| Messages | ✅ Complete | `/portal/messages` | `portal.messages.*` |
| Profile | ✅ Complete | `/portal/profile` | `portal.updateProfile` |
| Password Reset | ✅ Complete | `/portal/forgot-password` | `portal.resetPassword` |
| Resources | ✅ Complete | `/portal/resources` | `knowledgeBase.list` |

---

### 16. AML Compliance

| Feature | Status | Routes | API Endpoints |
|---------|--------|--------|---------------|
| Beneficial Owners | ✅ Complete | Client Detail | `beneficialOwners.*` |
| AML Assessments | ✅ Complete | Client Detail | `amlCompliance.*` |
| Risk Scoring | ✅ Complete | Client Detail | `amlCompliance.create` |
| PEP Identification | ✅ Complete | Client Detail | `amlCompliance.*` |

**Risk Levels:**
- LOW - Review in 3 years
- MEDIUM - Review in 2 years
- HIGH - Review in 1 year
- PROHIBITED - No business

---

## System Features

### Time Tracking
- Time entry CRUD
- Active timer (start/stop)
- Billable/non-billable tracking
- Invoice linkage

### Notifications
- In-app notifications
- Email digest (never/daily/weekly)
- Type-specific preferences

### Backup & Recovery
- Manual backup
- Scheduled backup
- Cloud sync (S3/R2)
- Restore capability

### Tags
- Document tagging
- Color-coded tags
- Business-specific tags

---

## E2E Test Coverage Required

Based on this inventory, the following test suites are needed:

1. **Authentication Tests** - Login, logout, session management
2. **Dashboard Tests** - KPIs, charts, recent data
3. **Client Tests** - CRUD, search, filters, bulk actions
4. **Matter Tests** - CRUD, status workflow, checklist
5. **Document Tests** - Upload, download, templates
6. **Invoice Tests** - CRUD, payments, PDF export
7. **Appointment Tests** - CRUD, scheduling, calendar
8. **Deadline Tests** - CRUD, calendar view
9. **Training Tests** - Courses, schedules, enrollments
10. **Service Catalog Tests** - Browse, admin CRUD
11. **Calculator Tests** - PAYE, VAT, NIS, Salary
12. **Knowledge Base Tests** - Browse, download
13. **Reports Tests** - Generate, export
14. **Admin Tests** - Staff CRUD, settings
15. **Portal Tests** - Client self-service flow
16. **Compliance Tests** - AML, beneficial owners

---

## Architecture Notes

### Tech Stack
- **Frontend**: React 19, TanStack Router, TanStack Query, Tailwind CSS, shadcn/ui
- **Backend**: Hono, oRPC, Drizzle ORM, Better Auth
- **Database**: PostgreSQL 17
- **Runtime**: Bun
- **Build**: Vite, Turborepo

### API Pattern
All API calls use oRPC with TanStack Query integration:
```typescript
// For queries - use orpc hooks
const { data } = orpc.clients.list.useQuery({ limit: 10 });

// For mutations - use useMutation with client
const mutation = useMutation({
  mutationFn: (input) => client.clients.create(input),
});
```

### Business Isolation
- Staff can be assigned to GCMC, KAJ, or both
- Data is filtered based on staff business access
- Financial data requires explicit permission

### Portal Isolation
- Portal users are separate from staff users
- Portal sessions are independent
- Staff can impersonate portal users for support
