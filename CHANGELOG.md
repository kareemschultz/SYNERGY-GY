# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Client Onboarding Wizard** - Complete step-by-step wizard for adding new clients (December 2024)
  - Multi-step wizard system with `useWizard` hook for state management
  - 6 wizard steps: Client Type, Basic Info, Contact, Identification, Services, Review
  - Client type selection: Individual, Small Business, Corporation, NGO, Co-op, Credit Union, Foreign National, Investor
  - Business assignment (GCMC, KAJ, or both) with service selection
  - Form validation with step-by-step error handling
  - LocalStorage draft persistence for incomplete forms
  - Review step with summary and required documents checklist
  - Direct integration with clients.create API
  - Reusable wizard components in kebab-case: wizard-container, wizard-progress, wizard-navigation, wizard-step
  - Accessible SVG icons and keyboard navigation
  - Mobile-responsive with progress bar and step indicators
  - Route: `/app/clients/onboard`
- **Claude Code Skills Integration** - 9 project-specific skills for enhanced AI assistance (December 2024)
  - `drizzle-schema` - Database schema patterns for Drizzle ORM PostgreSQL
  - `orpc-router` - API router patterns with oRPC procedures and Zod validation
  - `react-component` - Frontend component patterns with TanStack Query and Shadcn/UI
  - `tanstack-route` - TanStack Router file-based routing patterns
  - `change-tracking` - Git workflow, CHANGELOG format, and documentation requirements
  - `code-quality` - Ultracite/Biome code standards and TypeScript rules
  - `testing-e2e` - Playwright E2E testing patterns and page objects
  - `business-context` - GCMC/KAJ domain knowledge and Guyana-specific requirements
  - `ui-ux-design` - Comprehensive UI/UX design system with accessibility, animations, and helpers
  - Skills stored in `.claude/skills/` directory, shared via git
- **Appointment Management System** - Complete scheduling infrastructure (December 2024)
  - Database schema: `appointmentType`, `staffAvailability`, `appointment`, `appointmentReminder` tables
  - Status workflow: REQUESTED → CONFIRMED → COMPLETED (or CANCELLED/NO_SHOW)
  - Location types: IN_PERSON, PHONE, VIDEO
  - Appointment types with customizable duration, color, and approval requirements
  - Staff availability scheduling with weekly patterns and date overrides
  - API router with full CRUD, confirm, cancel, reschedule, and availability endpoints
  - Sub-routers: `types.*`, `availability.*` for admin management
- **Enhanced Client Portal** - Profile, financials, and appointment management
  - Profile endpoint with TIN, certificates, and services tracking
  - Financials sub-router: `summary`, `invoices`, `getInvoice`, `paymentHistory`
  - Outstanding balance and overdue amounts calculation
  - Appointments sub-router: `list`, `getUpcoming`, `getAvailableTypes`, `request`, `cancel`
  - Client self-service appointment requests through portal
- **Enhanced Client Dashboard** - Rich staff-facing client overview
  - `getDashboard` endpoint with matters, documents, financials, appointments
  - Financial summary with aging (0-30, 31-60, 61-90, 90+ days overdue)
  - Recent communications and upcoming appointments
  - Role-based financial data visibility
- **Payment Tracking Enhancements** - Discounts and aging reports
  - Invoice discount fields: `discountType`, `discountValue`, `discountAmount`, `discountReason`
  - Discount types: NONE, PERCENTAGE, FIXED_AMOUNT
  - `getClientBalance` endpoint for total outstanding by client
  - `getAgingReport` endpoint with bucket breakdown (current, 30, 60, 90+ days)
  - `applyDiscount` endpoint for invoice discount application
- **Role-Based Financial Access Control** - Permission system for financial data
  - `canViewFinancials` column on staff table
  - `canViewFinancials()` helper function with role-based defaults
  - `financialProcedure` middleware for financial endpoint protection
  - OWNER and MANAGERs default to financial access, others require explicit permission
- **Activity Logger Extensions** - Added APPOINTMENT and INVOICE entity types
  - Extended `entityTypeEnum` in database schema
  - Updated activity logger utility with new entity mappings

- **Initial Owner Setup** - Environment-based first user creation system
  - Auto-creates OWNER account on first server startup from env vars
  - `INITIAL_OWNER_EMAIL`, `INITIAL_OWNER_PASSWORD`, `INITIAL_OWNER_NAME` configuration
  - One-time setup, ignored after first owner exists
  - Uses Better-Auth's native password hashing (`better-auth/crypto`) for compatibility
  - Supports Docker deployment patterns
- **Staff Password Setup Flow** - Complete invite-based onboarding
  - `/staff/setup-password` route for new staff members
  - Password setup tokens with 24-hour expiry
  - Token validation and secure password creation
  - `passwordSetupToken` table in database schema
- **Database Schema Extensions**
  - Added `staff` table with role-based access control
  - Added `password_setup_token` table for secure onboarding
  - Added `staff_role` enum type for role management
- **Authentication Documentation** - Comprehensive `/specs/authentication.md`

### Changed
- **Login Page**: Removed public signup, login-only for security
- **File Structure**: Renamed route files to follow kebab-case convention (e.g., `$courseId.tsx` → `$course-id.tsx`).
- **Route Parameters**: Updated route parameter access to match new kebab-case filenames (e.g., `params['course-id']`).
- **Linting**: Resolved comprehensive linting issues including `noLeakedRender`, `noNestedTernary`, and file naming conventions.
- **TypeScript**: Fixed critical type errors in training router, service details, and calendar components.

### Fixed
- **PostgreSQL Enum/Text Comparison** - Fixed 500 Internal Server errors across all API routers
  - Cast enum columns to text before array comparison in raw SQL queries
  - Affected routers: dashboard, invoices, deadlines, matters, documents
  - Error was `operator does not exist: business = text` when comparing enum to text[]
- **Breadcrumb HTML Nesting** - Fixed React hydration error from invalid HTML
  - Changed `BreadcrumbSeparator` from `<li>` to `<span>` element
  - Prevents `<li>` being nested inside another `<li>` (BreadcrumbItem)
- **Database Schema Enum Conflict** - Renamed `service_category` enum to `service_type_category`
  - Resolved conflict with `service_category` table name in service-catalog schema
- **Training Router**: Fixed potential undefined object access in course deletion check.
- **Calendar Component**: Resolved type mismatch for `CalendarRoot` with React Day Picker v8.
- **Service Detail**: Added missing argument to `renderPricing` function.
- **Route Tree**: Regenerated route tree to reflect renamed file structure.
- **Orphan User Handling**: Users without staff profiles see "Access Pending" message instead of errors.

### Completed (December 2024)

#### Phase 1 Polish - ✅ ALL COMPLETE
- **Mobile Sidebar** - ✅ Complete - Hamburger menu with slide-in drawer for mobile viewports
  - Responsive design with < 640px breakpoint
  - 280px slide-in drawer from left
  - Semi-transparent backdrop with blur effect
  - 200ms ease-out animations
  - Closes on navigation, backdrop click, or Escape key
  - Full accessibility with ARIA attributes and focus trap
  - Hamburger button in header with proper aria-expanded state
- **Admin Panel** - ✅ Complete - Staff management UI with full CRUD operations
  - Staff list with search and role filtering
  - Create new staff with email invitations
  - Edit staff details and roles
  - Activate/deactivate staff accounts
- **Settings Page** - ✅ Complete - User preferences, theme toggle, profile settings, security, and about sections
- **Activity Logging API** - ✅ Complete - Activity router with stats and filtering
- **File Upload Handler** - ✅ Complete - Server-side upload/download handlers with validation

#### Phase 2 Features - ✅ HIGH PRIORITY COMPLETE
- **Client Portal** (#6) - ✅ Complete - Full self-service portal for clients
  - Portal user authentication with secure sessions
  - Portal invite system with email notifications
  - Password reset flow with secure tokens
  - Client matter viewing with pagination
  - Document download for client's own files
  - Matter detail pages with document associations
- **Email Integration** (#11) - ✅ Complete - Resend integration for portal invites, password resets, and staff onboarding
  - Email service utility with Resend SDK
  - Professional HTML and plain text email templates
  - Portal invite emails with personalized links
  - Password reset emails with secure tokens
  - Staff password setup emails for onboarding
  - Document request and upload confirmation templates
  - Graceful fallback: logs to console in development without API key
  - Environment variable configuration (RESEND_API_KEY, EMAIL_FROM)
- **Service Catalog & Pricing** - ✅ Complete - Comprehensive service catalog system for GCMC and KAJ
  - Database schema with serviceCategory and serviceCatalog tables
  - Support for multiple pricing types (Fixed, Range, Tiered, Custom/Quote-based)
  - Flexible pricing tiers with conditions (e.g., "2 Days", "5 Days", "10+ participants")
  - Service metadata: target audience, topics covered, document requirements, deliverables, workflow
  - Government agencies and fees tracking
  - Tags, featured services, and category organization
  - API router with full CRUD operations (admin-only write, staff read)
  - Service catalog browse page with category sidebar and search
  - Featured services section on main catalog page
  - Individual service detail page with comprehensive information display
  - Admin service management interface (view-only, CRUD to be implemented)
  - ServiceCard and ServiceDetail reusable components
  - Currency formatting utility (GYD support)
- **Invoice Generation System** - ✅ Complete - Comprehensive invoicing and billing system for both businesses
  - Database schema: invoice, invoiceLineItem, and invoicePayment tables
  - Status tracking: DRAFT, SENT, PAID, OVERDUE, CANCELLED
  - Payment methods: Cash, Cheque, Bank Transfer, Credit/Debit Card, Mobile Money
  - Auto-generated invoice numbers (GK-2024-0001 format) per business per year
  - Line item editor with automatic amount calculation
  - Tax support with customizable tax amounts
  - Payment recording with partial and full payment tracking
  - Automatic status updates based on payments and due dates
  - Invoice list page with search, filters, and pagination
  - Invoice detail page with full information display
  - New invoice creation page with client and matter linking
  - Payment modal for recording payments with validation
  - Invoice section in client detail page showing all client invoices
  - API router with full CRUD operations and business access control
  - Currency formatting in GYD (Guyanese Dollar)
  - Invoice summary statistics endpoint
  - PDF generation placeholder (to be implemented with PDF library)
- **Training Management System** - ✅ Complete - Comprehensive training course management for GCMC business
  - Database schema: courses, courseSchedules, and enrollments tables
  - Course catalog with categories (Human Resources, Customer Relations, Business Development, Compliance)
  - Course metadata: title, description, duration, max participants, pricing, active status
  - Schedule management with dates, location, instructor, and status tracking
  - Enrollment tracking with status (Registered, Confirmed, Attended, Cancelled, No Show)
  - Payment status tracking (Pending, Partial, Paid, Refunded)
  - Certificate issuance with auto-generated certificate numbers (GCMC-CERT-2024-0001 format)
  - Course list page with search, category filter, and active status filter
  - Course detail page with schedules table and quick stats
  - Schedule detail page with enrollment list and participant management
  - New course creation form with validation
  - Schedule creation dialog with date/time pickers
  - Enrollment management with client selection
  - Mark attendance and issue certificates functionality
  - Capacity tracking with full/almost full indicators
  - Attendance rate calculation and statistics
  - API router with full CRUD operations and GCMC business filter
  - CourseCard, ScheduleTable, and EnrollmentList reusable components
  - Training navigation added to sidebar
- **Tax Calculators** - ✅ Complete - Guyana-specific tax calculation tools (2025 rates)
  - PAYE (Pay As You Earn) calculator with 25% tax rate and $130,000 monthly allowance
  - VAT (Value Added Tax) calculator with 14% rate, supports inclusive/exclusive modes
  - NIS (National Insurance Scheme) calculator with 5.6% employee and 8.4% employer rates
  - Database schema for saving calculation history
  - Calculation results display with detailed breakdowns
  - History storage with user association
  - Calculator navigation page with feature cards
- **Document Templates** - ✅ Complete - Template generation system for business documents
  - Database schema extended with content field and categories
  - Template categories: Letter, Agreement, Certificate, Form, Report, Invoice
  - Business-specific templates (GCMC, KAJ, or both)
  - Placeholder system for dynamic content ({{client.name}}, {{date}}, etc.)
  - Template list page with search and filters
  - Template creation form with rich content editor
  - Template preview and editing functionality
  - API router for template CRUD operations
- **Recurring Deadlines** - ✅ Complete - Automated deadline generation system
  - Recurrence patterns: Daily, Weekly, Monthly, Quarterly, Annually
  - Pre-configured Guyana tax deadline templates (PAYE, VAT, Income Tax, NIS)
  - Instance generation with parent-child relationship
  - End date support for time-limited recurrences
  - Automatic reminder creation for generated instances
  - Safety limits to prevent infinite loops
  - API endpoints for generating future instances

### Code Quality
- **TypeScript Strict Mode** - ✅ Complete - All TypeScript errors resolved
  - Fixed 60+ backend TypeScript errors in API routers
  - Fixed 70+ frontend TypeScript errors across all routes
  - Proper type definitions for form components and hooks
  - Created missing UI components (Alert, AlertDialog, Form, RadioGroup)
  - Added use-toast hook compatible with sonner
- **API Pattern Fixes** - ✅ Complete - Corrected oRPC and TanStack Query usage
  - Fixed frontend API calls: converted from `orpc.*.useMutation()` to `useMutation` from `@tanstack/react-query` with `client`
  - Fixed Zod schemas: `z.record()` requires both key and value types
  - Fixed Drizzle ORM: `or()` returns `SQL | undefined`, must check before array push
  - Created `specs/api-patterns.md` documentation for future reference
- **Build System** - ✅ Complete - All packages building successfully
  - Pinned Zod to v3 in docs package for Astro/Starlight compatibility
  - Monorepo uses Zod v4, docs package uses v3 (isolated dependency)

### Planned Features
- Appointment scheduling and calendar sync
- Cloud storage backup integration (S3/R2)
- Advanced reporting and analytics dashboard
- Document OCR and automated data extraction
- WhatsApp integration for client communications
- Bulk import/export capabilities

### Technical Improvements
- Background job scheduler for recurring tasks
- Redis caching layer for improved performance
- Full-text search with PostgreSQL FTS
- Automated database backups
- CI/CD pipeline configuration
- End-to-end testing suite
- API rate limiting and monitoring
- Docker deployment configuration

## [0.1.0] - 2025-12-11

### Added

#### Core Business Logic
- Dual-business support (GCMC and KAJ) with unified platform
- Client management system with support for 7 client types (Individual, Small Business, Corporation, NGO, Cooperative, Foreign National, Investor)
- Service/matter tracking from initiation to completion
- Document management with category organization and expiration tracking
- Deadline calendar with recurring event support
- Comprehensive role-based access control system

#### Authentication & Authorization
- Better-Auth integration with session management
- 7 staff role types (Owner, GCMC Manager, KAJ Manager, Staff GCMC, Staff KAJ, Staff Both, Receptionist)
- Role-based middleware for API endpoints
- Business-level permissions and data filtering

#### Database Schema (19+ Tables)
- **Core tables**: Staff management with multi-business support
- **Client tables**: Clients, contacts, links (family/business relationships), communications log
- **Service tables**: Service types, matters, checklist items, notes, matter links
- **Document tables**: Documents with cloud backup tracking, templates with placeholders
- **Deadline tables**: Deadlines with recurrence patterns, automated reminders
- **Activity table**: Comprehensive audit trail for all user actions

#### API Routers (oRPC)
- `clients.ts` - Complete CRUD with contacts, links, communications, and search
- `matters.ts` - Matter lifecycle management with checklists, notes, and reference numbers
- `documents.ts` - Upload/download workflows with template generation
- `deadlines.ts` - Calendar data, recurring instances, and upcoming deadline queries
- `dashboard.ts` - Statistics, recent activity, and assignment tracking
- Custom middleware for authentication and role-based authorization

#### Frontend Application
- React 19 with TanStack Router for type-safe routing
- Authenticated layout with responsive sidebar navigation
- Business context filtering (GCMC/KAJ toggle)
- 26+ shadcn/ui components integrated
- Dark mode support with system preference detection
- Form handling with validation
- Loading states and skeleton screens

#### UI Components
- **Layout**: Sidebar with business filtering, breadcrumbs, page headers
- **Forms**: Client forms, matter forms with service selection, deadline creation
- **Data Display**: Tables with sorting/filtering, status badges, priority indicators
- **Navigation**: Dropdown menus, tabs, sheets for mobile
- **Feedback**: Toast notifications, dialogs, loading skeletons

#### Developer Experience
- TypeScript throughout the entire stack
- Turborepo monorepo with workspace management
- Ultracite code standards with automated Biome formatting
- Husky pre-commit hooks with lint-staged
- Better-T-Stack CLI integration
- Hot module reloading in development

### Technical Stack

#### Frontend
- React 19
- TanStack Router (type-safe routing)
- TanStack Query (data fetching and caching)
- Tailwind CSS (styling)
- shadcn/ui (component library)
- Vite (build tool)

#### Backend
- Hono (web framework)
- oRPC (type-safe RPC)
- Better-Auth (authentication)
- Bun runtime

#### Database
- PostgreSQL (primary database)
- Drizzle ORM (type-safe database access)
- Drizzle Kit (migrations and schema management)

#### Infrastructure
- Bun package manager and runtime
- Turborepo (monorepo orchestration)
- Docker ready (containerization planned)
- Deployment target: Self-managed VPS (Vultr)

### Documentation
- Implementation plan with complete technical specification
- Better-T-Stack integration guide
- Ultracite code standards documentation
- Project structure documentation
- Database schema reference
- API router specifications

### Configuration Files
- Workspace-level TypeScript configurations
- Shared Biome configuration via Ultracite
- Turbo pipeline definitions
- Environment variable templates
- Git hooks for code quality enforcement

### Development Workflow
- Monorepo structure with apps and packages separation
- Shared packages: `@SYNERGY-GY/api`, `@SYNERGY-GY/auth`, `@SYNERGY-GY/db`
- Independent app development: `web` (frontend), `server` (backend), `docs` (documentation)
- Database commands via package scripts
- Parallel development server support

### Project Metadata
- Project name: SYNERGY-GY (GK-Nexus platform)
- Target users: 5-10 staff members
- Target scale: 200-500 clients
- Geographic focus: Guyana
- Business domains: Legal services, immigration, tax, accounting, training, consulting

## [0.0.1] - 2025-12-11

### Added
- Initial project scaffolding with Better-T-Stack
- Basic project structure and configuration
- Repository initialization

---

## Links

- [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
- [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
- [Better-T-Stack](https://bts.omar-raad.com/)