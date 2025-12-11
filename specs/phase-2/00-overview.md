# Phase 2: Advanced Features

**Status:** IN PROGRESS
**Prerequisites:** Phase 1 Complete
**Last Updated:** December 11, 2024

Phase 2 extends the platform with client self-service, billing, and specialized business tools.

> **⚠️ NO MOCK DATA POLICY**: All features must be designed for real, user-created data only. Never use mock data, placeholder content, or fake records. See [NO MOCK DATA Policy](../README.md#critical-development-policy-no-mock-data).

---

## Phase 1 Deferred Items (Include in Phase 2)

The following items were identified during Phase 1 testing and should be addressed in Phase 2:

### Priority 1: Critical for Production
| Item | Description | Module | Status |
|------|-------------|--------|--------|
| ~~**Mobile Sidebar**~~ | Hamburger menu with slide-in drawer for < 640px | Core UI | ✅ **COMPLETED** |
| ~~**Admin Panel**~~ | Staff management and user creation | New Module | ✅ **COMPLETED** |
| ~~**Settings Page**~~ | Application configuration interface | New Module | ✅ **COMPLETED** |

### Priority 2: Enhanced Functionality
| Item | Description | Module | Status |
|------|-------------|--------|--------|
| ~~**File Upload Handler**~~ | Complete server-side upload implementation | Documents | ✅ **COMPLETED** |
| **Document Templates** | Template generation system | Documents | PENDING |
| **Recurring Deadlines** | Auto-generate recurring instances | Calendar | PENDING |
| **Background Jobs** | Email reminders and scheduled tasks | Core | PENDING |
| **Cloud Backup** | S3/R2 integration for file backup | Documents | PENDING |

---

## Modules

| # | Module | Description | Priority | Status |
|---|--------|-------------|----------|--------|
| 1 | [Client Portal](./01-client-portal.md) | Self-service client access | High | ✅ **COMPLETED** |
| 2 | [Invoicing](./02-invoicing.md) | Billing and payments | High | ✅ **COMPLETED** |
| 3 | [Service Catalog](./service-catalog.md) | Service definitions and pricing | High | ✅ **COMPLETED** |
| 4 | [Tax Calculators](./03-tax-calculators.md) | Guyana tax calculation tools | Medium | Planned |
| 5 | [Training Management](./04-training-management.md) | GCMC course management | Medium | Planned |
| 6 | [Appointments](./05-appointments.md) | Scheduling system | Low | Planned |

## Requirements

### Functional Requirements
- FR-2.1: Clients can log in and view their matters
- FR-2.2: Clients can upload documents securely
- FR-2.3: Staff can generate invoices from matters
- FR-2.4: System calculates Guyana PAYE, VAT, NIS
- FR-2.5: Staff can manage training courses and enrollments
- FR-2.6: Clients can book appointments online

### Non-Functional Requirements
- NFR-2.1: Client portal response time < 2 seconds
- NFR-2.2: Support 100 concurrent client portal users
- NFR-2.3: Invoice PDF generation < 5 seconds
- NFR-2.4: Tax calculations accurate to 2 decimal places

## Implementation Plan

### Stage 1: Client Portal (4-6 weeks)
1. Extend auth for client users
2. Create portal routes and pages
3. Implement read-only matter view
4. Add document upload capability
5. Testing and security review

### Stage 2: Invoicing (3-4 weeks)
1. Design invoice schema
2. Create invoice router
3. Build invoice generation UI
4. Implement PDF export
5. Payment tracking

### Stage 3: Tax Calculators (2-3 weeks)
1. Research current GY tax rates
2. Implement calculation logic
3. Build calculator UI
4. Add result saving/export

### Stage 4: Training Management (3-4 weeks)
1. Design course schema
2. Create training router
3. Build course management UI
4. Implement enrollment tracking
5. Certificate generation

### Stage 5: Appointments (2-3 weeks)
1. Design appointment schema
2. Create booking router
3. Build scheduling UI
4. Calendar integration

## Database Additions

New tables for Phase 2:
- `portal_user` - Client portal accounts
- `invoice` - Invoice records
- `invoice_item` - Invoice line items
- `payment` - Payment records
- `tax_calculation` - Saved calculations
- `course` - Training courses
- `enrollment` - Course enrollments
- `appointment` - Scheduled appointments
- `availability` - Staff availability

## Technical Considerations

### Client Portal Security
- Separate auth context for clients
- Read-only by default
- Document upload sandboxed
- Rate limiting on uploads
- Session timeout shorter than staff

### Invoice Generation
- PDF generation library (pdf-lib or puppeteer)
- Template system for invoice layouts
- Number sequence management
- Currency formatting (GYD)

### Tax Calculations
- Stay updated with GRA rate changes
- Clear disclaimers (not tax advice)
- Audit trail for calculations

## Dependencies

- Phase 1 complete
- Email sending (for portal invites)
- PDF generation library
- Possibly payment gateway (future)

## Success Criteria

- [ ] 50% of clients use portal within 3 months
- [ ] Invoice generation reduces admin time by 30%
- [ ] Tax calculators used 100+ times per month
- [ ] Training courses managed entirely in system

---

## Phase 2 Requirements Summary

### Overview
Phase 2 builds upon the foundation established in Phase 1 to deliver client-facing features, billing capabilities, and specialized business tools. This phase transforms the platform from an internal management system into a comprehensive solution that serves both staff and clients.

### Prerequisites from Phase 1

Before beginning Phase 2 implementation, the following Phase 1 components must be complete and verified:

1. **Core Infrastructure**
   - Database schema for clients, matters, documents, staff, and activity logging
   - Authentication system for staff users
   - Role-based access control (RBAC)
   - Document storage system

2. **Client Management**
   - Client CRUD operations
   - Client search and filtering
   - Client detail pages

3. **Matter Tracking**
   - Matter lifecycle management
   - Status tracking
   - Matter-client relationships

4. **Document Management**
   - Document upload and storage
   - Document-matter associations
   - Document retrieval and download

5. **Activity & Deadlines**
   - Activity logging system
   - Deadline tracking
   - Dashboard views

### Technical Requirements

#### Authentication Extensions
- Separate authentication context for portal users (clients)
- Session management with different timeout policies
- Email verification for portal accounts
- Password reset functionality

#### API Infrastructure
- All Phase 2 endpoints must follow existing oRPC patterns
- Input validation using Zod schemas
- Proper error handling and status codes
- Rate limiting on public-facing endpoints

#### Security Requirements
- Portal users must only access their own data
- File uploads must be validated (type, size, malware scanning)
- All sensitive data encrypted at rest and in transit
- Audit logging for all portal activities
- CSRF protection on all forms

#### Performance Requirements
- Portal pages must load in under 2 seconds
- PDF generation must complete in under 5 seconds
- Support 100+ concurrent portal users
- Database queries optimized with proper indexes

#### UI/UX Requirements
- Mobile-responsive design for all portal pages
- Accessibility compliance (WCAG 2.1 AA)
- Consistent styling with Phase 1
- Loading states and error handling

#### Email Integration
- Transactional email service configured (Resend)
- Email templates for all notifications
- Email delivery tracking
- Unsubscribe management

#### PDF Generation
- PDF library integrated (pdf-lib or Puppeteer)
- Professional invoice templates
- Certificate templates for training
- Watermarking capability

### Acceptance Criteria for Phase 2 Completion

#### Client Portal
- [ ] Portal users can register with email invite
- [ ] Portal users can log in securely
- [ ] Clients can view all their matters
- [ ] Clients can download their documents
- [ ] Clients can upload requested documents
- [ ] Email notifications sent for key events
- [ ] No unauthorized data access possible
- [ ] Portal performs within NFR targets

#### Invoicing
- [ ] Invoices can be created manually
- [ ] Invoices can be generated from matters
- [ ] Invoice PDFs render correctly
- [ ] Payment tracking functional
- [ ] Partial payments supported
- [ ] Invoice numbering sequential and unique
- [ ] Overdue detection working
- [ ] Email delivery of invoices functional

#### Tax Calculators
- [ ] PAYE calculator accurate to GRA rules
- [ ] VAT calculator working correctly
- [ ] NIS calculator matches official rates
- [ ] Results can be saved
- [ ] Calculations can be exported
- [ ] Disclaimers visible on all calculators
- [ ] Mobile-responsive design

#### Training Management
- [ ] Courses can be created and managed
- [ ] Course schedules functional
- [ ] Student enrollment working
- [ ] Attendance tracking operational
- [ ] Certificates generate correctly
- [ ] Certificate numbering unique
- [ ] GCMC business filter working

#### Appointments
- [ ] Staff availability management working
- [ ] Appointment booking functional
- [ ] Calendar view displays correctly
- [ ] Email confirmations sent
- [ ] Reminders delivered on schedule
- [ ] No double-booking possible
- [ ] Rescheduling and cancellation working

#### Integration & Testing
- [ ] All modules integrate with Phase 1
- [ ] No regression in Phase 1 features
- [ ] Unit tests for critical paths
- [ ] Integration tests for workflows
- [ ] Security audit completed
- [ ] Performance testing passed
- [ ] Documentation complete

#### Deployment
- [ ] Database migrations successful
- [ ] Environment variables configured
- [ ] Email service operational
- [ ] PDF generation working in production
- [ ] Monitoring and logging active
- [ ] Backup strategy implemented
- [ ] Rollback plan documented
