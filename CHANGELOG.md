# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

### Code Quality
- **TypeScript Strict Mode** - ✅ Complete - All TypeScript errors resolved
  - Fixed 60+ backend TypeScript errors in API routers
  - Fixed 70+ frontend TypeScript errors across all routes
  - Proper type definitions for form components and hooks
  - Created missing UI components (Alert, AlertDialog, Form)
  - Added use-toast hook compatible with sonner

### Planned Features
- Tax calculation utilities (Guyana-specific)
- Training course management system
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
