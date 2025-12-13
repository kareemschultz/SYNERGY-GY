# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Template Generation in Client Onboarding Wizard** (December 13, 2024)
  - Integrated template generator component into document step of client onboarding wizard
  - Allows users to search, preview, and generate documents from templates during onboarding
  - Template preview shows rendered content with client data (name, email, phone, address) before generation
  - Generated documents automatically added to uploaded files list with proper categorization
  - Category filtering (Letters, Agreements, Certificates, Forms, Reports, Invoices) for easy template discovery
  - **Files Created/Modified**:
    - `apps/web/src/components/wizards/client-onboarding/template-generator.tsx` - New component for template management
    - `apps/web/src/components/wizards/client-onboarding/step-documents.tsx` - Integrated template generator with upload workflow
  - **Impact**:
    - Staff can generate client-specific documents during onboarding without leaving the wizard
    - Reduces manual document creation time
    - Ensures consistent document formatting across all clients

### Fixed

- **Edit Client Button in Client Detail Page** (December 13, 2024)
  - Fixed "Edit Client" dropdown menu item that had no handler
  - Now properly navigates to client detail page with `?edit=true` search parameter
  - **Root Cause**: DropdownMenuItem was missing `asChild` prop and Link component
  - **Files Modified**:
    - `apps/web/src/routes/app/clients/$client-id.tsx` - Added Link wrapper with search parameter to Edit Client menu item
  - **Impact**:
    - Users can now click "Edit Client" to navigate to edit mode
    - Consistent with edit pattern used in client card and client list
    - Completes the client editing workflow from detail page

- **Document Upload and Service-Specific Requirements** (December 13, 2024)
  - Fixed document upload button functionality in client onboarding wizard
  - Added graceful error handling for service catalog lookups using `Promise.allSettled()` instead of `Promise.all()`
  - Implemented service-specific document requirement fetching via `client.serviceCatalog.services.getById.query()`
  - **Root Cause**: Upload button had `pointer-events-none` preventing clicks; service lookup failures crashed the wizard
  - **Files Modified**:
    - `apps/web/src/components/wizards/client-onboarding/step-documents.tsx` - Fixed upload button, added service-specific document fetching with error resilience
  - **Impact**:
    - Upload buttons now functional with proper file type filtering (`.pdf,.doc,.docx,.jpg,.jpeg,.png`)
    - Document completion progress tracking works correctly
    - Wizard gracefully handles missing or invalid service IDs with warning instead of crash
    - Service-specific document requirements display when services are available

- **Client Pages Database Enum Errors** (December 12, 2024)
  - Fixed critical 500 errors on client list page caused by invalid `matter_status` enum values
  - **Root Cause**: SQL queries were using invalid enum values (`PENDING_INFO`, `UNDER_REVIEW`, `COMPLETED`) instead of valid database enum values (`PENDING_CLIENT`, `SUBMITTED`, `COMPLETE`)
  - **Files Fixed**:
    - `packages/api/src/routers/clients.ts` - Updated `listWithStats` SQL queries to use correct enum values and fixed table alias references in raw SQL WHERE clauses
    - `packages/api/src/routers/portal.ts` - Updated portal dashboard matter summary queries
    - `apps/web/src/components/clients/mini-cards.tsx` - Updated `matterStatusColors` object to only include valid enum values
  - **Impact**: All client pages now fully functional
    - Client list displays correctly with all statistics
    - Client wizard loads and navigates properly through all 10 steps
    - Quick add form renders without errors
    - Client detail pages show all tabs and information correctly
  - **Technical Details**: Converted raw SQL conditions from Drizzle schema objects to string-based raw SQL to properly use table alias `c` instead of `"client"` table reference

### Added

- **Service Catalog Database Population** (December 12, 2024)
  - Created seed script `packages/db/src/scripts/seed-service-catalog.ts` with real GCMC and KAJ services
  - Populated **33 services** across **10 categories**:
    - **GCMC** (17 services): Training & Development (4), Business Consulting (2), Paralegal (5), Immigration (3), Proposals (3)
    - **KAJ** (16 services): Tax Services (5), Compliance (3), Audit (2), NIS Services (3), PAYE (3)
  - Each service includes tiered pricing, estimated duration, document requirements, and government agencies
  - Fixed API router patterns: replaced `.query()` and `.mutation()` with `.handler()` in 5 router files
  - Verified wizard displays all services correctly with proper category grouping and expandable accordions

- **Enhanced Service Selection for Client Onboarding Wizard** (December 12, 2024)
  - **Individual Service Selection**: Granular selection of specific services within categories
    - Replaced category-level selection with individual service checkboxes
    - Full pricing transparency (all tiers displayed inline per user requirement)
    - Service details modal with comprehensive information
    - Search/filter functionality for quick service discovery
  - **Backend Infrastructure**:
    - `getForWizard` API endpoint in `service-catalog.ts` - Returns services grouped by category
    - Updated `saveSelections` API to accept `serviceIds: string[]` instead of category codes
    - Migration script: `migrate-to-service-catalog.ts` - Migrates 54 services from service_type to serviceCatalog
    - Verification script: `verify-client-selections.ts` - Fixes broken client service selections
  - **Frontend Types & Utilities**:
    - `ServiceCatalogItem` type with full pricing and document requirement details
    - `PricingTier` type supporting FIXED/RANGE/TIERED/CUSTOM pricing models
    - Changed `ClientOnboardingData.selectedServiceIds: string[]` (from gcmcServices/kajServices arrays)
    - Pricing utility (`apps/web/src/utils/pricing.ts`):
      - `getServicePriceDisplay()` - Shows all pricing tiers inline (e.g., "3-day: GYD 35k | 5-day: GYD 50k")
      - `formatCurrency()` - GYD formatting with compact mode
      - `calculateTotalPrice()` - Estimates total cost for selected services
      - `formatDuration()` - Service duration display
  - **UI Components** (✅ COMPLETED):
    - `ServiceCategoryAccordion` - Expandable category cards with service count and price range
    - `ServiceCheckboxItem` - Individual service with full pricing tiers, duration, and document count
    - `ServiceDetailsModal` - Comprehensive service information with tiered pricing tables
    - `StepServicesEnhanced` - Enhanced wizard step with category accordion and service selection
    - Integrated with TanStack Query for real-time service catalog data
    - Business-specific filtering (GCMC/KAJ) with conditional rendering
  - **Data Architecture Fix**: Resolved mismatch between wizard (sent category codes) and API (expected service UUIDs)

- **Clients At-a-Glance Enhancement** (December 12, 2024)
  - **API Layer**: New `listWithStats` endpoint with efficient SQL using LATERAL joins
    - Aggregates workload, compliance, financial, and engagement data per client
    - Permission-based financial data filtering (requires `canViewFinancials`)
  - **New Shared Components** (`apps/web/src/components/clients/`):
    - `client-stats-badge.tsx` - WorkloadBadge, FinancialBadge, EngagementBadge
    - `compliance-indicator.tsx` - GRA/NIS/AML status display (compact + full modes)
    - `client-card.tsx` - Mobile card view for the clients list
    - `quick-stat-card.tsx` - Quick stat display cards for overview page
    - `mini-cards.tsx` - MatterMiniCard, AppointmentMiniCard, CommunicationMiniCard
  - **Clients List Page Enhancement**:
    - Hybrid responsive view: Table on desktop, cards on mobile
    - View toggle buttons (table/cards) on desktop
    - Enhanced table columns: Workload, Compliance, Financial, Engagement
    - Auto-switch to cards on mobile (<768px)
    - Loading skeletons for both views
  - **Client Detail Page Overview Tab**:
    - Quick Stats Grid (Active Matters, Documents, Upcoming Appointments, Outstanding Balance)
    - Compliance Status card (GRA/NIS/AML)
    - Financial Summary card (Total Invoiced, Paid, Outstanding, Overdue)
    - Recent Activity section (Matters, Appointments, Communications)
    - Client Information section with existing info cards

- **Enhanced Client Onboarding with AML/KYC Compliance - Phase 1** (December 12, 2024)
  - **Legal Compliance**: Full implementation of Guyana Beneficial Ownership Disclosure Act
    - GYD $200,000 penalty avoidance through proper beneficial owner tracking
    - 25%+ ownership disclosure requirement enforcement
    - Complete audit trail for regulatory inspections
  - **CFATF Standards Implementation**: Caribbean Financial Action Task Force Recommendations
    - Recommendation 10: Customer Due Diligence (CDD) with risk-based approach
    - Recommendation 11: Record Keeping with 7-year retention capability
    - Recommendation 12: Politically Exposed Persons (PEP) identification and enhanced due diligence
    - Recommendation 20: Suspicious transaction monitoring framework foundation
  - **Database Schema (5 New Tables, 12 New Enums)**:
    - `client_beneficial_owner` table (24 columns, 3 indexes) - Beneficial ownership tracking
      - 25-100% ownership validation, ownership type classification (DIRECT/INDIRECT/BENEFICIAL)
      - PEP declarations with relationship tracking (SELF/FAMILY_MEMBER/CLOSE_ASSOCIATE)
      - Risk level assessment (LOW/MEDIUM/HIGH), verification workflow with document linking
      - Age validation (18+), national ID and passport number fields
    - `client_aml_assessment` table (32 columns, 4 indexes) - AML/KYC risk scoring
      - 4-factor risk scoring: Client Type (0-25), Service (0-25), Geographic (0-25), Transaction (0-25)
      - Risk ratings: LOW (0-33), MEDIUM (34-66), HIGH (67-84), PROHIBITED (85-100)
      - PEP category classification (9 categories from HEAD_OF_STATE to CLOSE_ASSOCIATE)
      - Source of funds tracking (5 categories: EMPLOYMENT, BUSINESS, INHERITANCE, INVESTMENTS, OTHER)
      - Sanctions screening integration placeholders (OFAC, UN, EU lists)
      - Enhanced Due Diligence (EDD) triggers and requirement tracking
      - Review scheduling: LOW (3 years), MEDIUM (2 years), HIGH (1 year)
      - Approval workflow for HIGH/PROHIBITED ratings (admin-only)
    - `client_emergency_contact` table (12 columns, 2 indexes) - Emergency contacts
      - Contact types: EMERGENCY, NEXT_OF_KIN
      - Full contact details with relationship tracking
    - `client_employment_info` table (17 columns, 3 indexes) - Employment verification
      - Employment status: EMPLOYED, SELF_EMPLOYED, UNEMPLOYED, RETIRED, STUDENT
      - Employer details, job title, industry, annual income ranges
      - Income source tracking (8 categories), verification document linking
      - Employment history tracking with isCurrent flag
    - `document_verification` table (17 columns, 3 indexes) - Document lifecycle management
      - Verification status: PENDING, VERIFIED, REJECTED, EXPIRED, REQUIRES_RENEWAL
      - Issue/expiry date tracking, renewal reminder system (configurable days ahead)
      - Issuing authority and document number fields
      - Expiry notification tracking to prevent duplicate alerts
  - **Client Table Enhancements**:
    - Added 10 new compliance fields: preferredContactMethod, preferredLanguage, amlRiskRating
    - PEP flags: isPep, requiresEnhancedDueDiligence
    - Compliance tracking: graCompliant, nisCompliant, lastComplianceCheckDate
    - Onboarding completion: onboardingCompleted, onboardingCompletedAt
    - Extended clientLinkTypeEnum with 5 new relationship types
  - **Risk Scoring Algorithm** (`packages/api/src/utils/risk-scoring.ts`)
    - CFATF-compliant weighted risk assessment across 4 dimensions
    - Client type scoring: INDIVIDUAL (5) to INVESTOR (25)
    - Service risk scoring: TRAINING (5) to IMMIGRATION (18)
    - Geographic risk: Guyana (5), CARICOM (10), FATF Blacklist countries (25)
    - Transaction risk: PEP status (+15), high transaction amounts (+10), complex ownership (+5)
    - Helper functions: calculateNextReviewDate(), validateOwnershipPercentages(), isLegalAge()
  - **API Routers (3 New Routers, 25 Endpoints)**:
    - `beneficial-owners` router (7 endpoints):
      - `list`, `get`, `create`, `update`, `delete`, `verify`, `getTotalOwnership`
      - Age validation (18+ required), ownership percentage validation (25-100%)
      - Staff verification workflow with document linking
    - `aml-compliance` router (8 endpoints):
      - `calculateRiskScore` - Real-time risk calculation utility
      - `createAssessment` - Create assessment with auto-approval logic (LOW/MEDIUM)
      - `getAssessment`, `getAssessmentHistory` - Retrieve assessments and audit trail
      - `approveAssessment` - Admin-only approval for HIGH/PROHIBITED ratings
      - `getPendingReviews` - Admin dashboard for pending EDD approvals
      - `getClientsRequiringReview` - Upcoming review date alerts (configurable days ahead)
      - `screenSanctions` - Mock sanctions screening (ComplyAdvantage integration in Phase 3)
    - `document-verification` router (10 endpoints):
      - `create`, `get`, `verify`, `update` - Verification CRUD operations
      - `getExpiringDocuments` - Documents expiring in next N days (default: 30)
      - `markNotificationSent` - Track expiry notifications
      - `checkExpiredDocuments` - Background job to auto-expire documents
      - `getStatistics` - Verification dashboard statistics
      - Date validation: issue date before expiry, expiry date in future
  - **Enhanced Wizard UI Components (4 New/Updated Steps)**:
    - Enhanced `step-contact.tsx` - Communication preferences and emergency contacts
      - Dropdown: Preferred Contact Method (Email, Phone, WhatsApp, In Person)
      - Dropdown: Preferred Language (English, Spanish, Portuguese, Chinese, Hindi, Urdu, Other)
      - Emergency Contact section (optional): name, relationship, phone, email
      - Next of Kin section (optional): name, relationship, phone, address
    - New `step-employment.tsx` - Employment and income verification (INDIVIDUAL/FOREIGN_NATIONAL only)
      - Dropdown: Employment Status (5 options)
      - Dropdown: Annual Income Range (7 ranges from Under 500K to Over 10M GYD)
      - Multi-select checkboxes: Income Sources (8 categories)
      - Conditional employer fields (shown only for EMPLOYED/SELF_EMPLOYED)
      - Date picker for employment start date
    - New `step-beneficial-owners.tsx` - Beneficial ownership disclosure (BUSINESS types only)
      - Legal warning alert: GYD $200,000 penalty for non-compliance
      - Interactive table with Add/Edit/Delete actions
      - Modal dialog for adding beneficial owners:
        - Dropdown: Nationality (11 common nationalities)
        - Dropdown: Ownership Type (Direct, Indirect, Beneficial)
        - Ownership percentage input (25-100% validation)
        - PEP checkbox with conditional dropdown (PEP Relationship: Self, Family Member, Close Associate)
        - Real-time ownership total calculation with <100% warnings
      - Form validation: required fields, age 18+, PEP details if declared
    - New `step-aml-compliance.tsx` - AML/KYC compliance and risk assessment
      - Multi-select checkboxes: Source of Funds (8 categories)
      - Conditional textarea for "Other" source details
      - PEP declaration checkbox with conditional fields:
        - Dropdown: PEP Category (9 categories)
        - Inputs: Position/Title, Jurisdiction/Country
      - Required checkbox: Sanctions Screening Consent
      - Preliminary Risk Assessment Card:
        - Real-time risk calculation (LOW/MEDIUM/HIGH)
        - Colored badge display (green/yellow/red)
        - Enhanced Due Diligence warning for HIGH risk
  - **TypeScript Types**:
    - Extended `ClientOnboardingData` with 10 new field groups
    - All wizard components fully typed with proper inference
  - **Database Migration**:
    - Migration file: `0001_perfect_grandmaster.sql`
    - Creates 5 new tables, 12 new enums, adds 10 columns to client table
    - 15 new indexes for query performance optimization
    - 11 foreign key constraints with proper cascade rules
  - **Compliance Features**:
    - Automatic risk score calculation on client creation
    - Enhanced Due Diligence (EDD) workflow for HIGH/PROHIBITED risk clients
    - Manager approval required for HIGH risk clients (blocks onboarding until approved)
    - Automated review date scheduling based on risk rating
    - Complete audit trail for all assessments, verifications, and approvals
    - Document expiry tracking with automated notification system foundation
    - GRA and NIS compliance status tracking

### Fixed
- **Service Catalog API Bug** - Fixed serviceCatalog.code → serviceCatalog.id references (December 12, 2024)
  - Fixed 5 locations in `client-services.ts` where non-existent `.code` field was used
  - Enables wizard service selections to be saved correctly
  - Bug was preventing `saveSelections` mutation from working

- **Document Category Mapping** - Documents now auto-categorized instead of defaulting to "OTHER" (December 12, 2024)
  - Created `inferDocumentCategory()` function with intelligent pattern matching
  - Supports 8 categories: IDENTIFICATION, TAX_FILING, NIS, FINANCIAL, IMMIGRATION, CERTIFICATE, AGREEMENT, CORRESPONDENCE
  - Updated client onboarding wizard to use auto-categorization

- **Matter Wizard Service Types** - Fixed "No service types available" issue (December 12, 2024)
  - Created missing `service_type` database table (was defined in schema but not pushed)
  - Added `seed-service-types.ts` script to populate service types
  - **47 service types** seeded: 23 GCMC + 24 KAJ
  - Services properly organized by category:
    - GCMC: TRAINING, REGISTRATION, PARALEGAL, IMMIGRATION, CONSULTING, OTHER
    - KAJ: TAX, ACCOUNTING, AUDIT, NIS
  - Added `db:seed-service-types` npm script
  - Fixed import path issues (`@/utils/classnames` → `@/lib/utils`)
  - Added missing `Progress` UI component via shadcn

### Added
- **Matter Wizard Document Upload Step** - Added document collection to matter creation (December 12, 2024)
  - New `step-documents.tsx` component for matter wizard
  - Service-specific document requirements based on selected service type
  - Progress tracking with visual upload status
  - Optional step - can be skipped and documents uploaded later
  - Matter wizard now has 6 steps: Client → Service → Details → Schedule → Documents → Review

- **Template Generation UI** - Generate documents from templates with client data (December 12, 2024)
  - New `TemplateGeneratorDialog` component for selecting and generating documents
  - Preview templates with actual client/matter data filled in
  - Category filtering and search functionality
  - Integrated into Client Documents tab with "Generate" button
  - Uses existing backend `templates.preview` and `templates.generate` APIs

- **Dynamic Document Requirements** - Comprehensive service-based document requirements (December 12, 2024)
  - Expanded `getRequiredDocumentsByServices()` from ~20 to 100+ requirements
  - Full coverage for all GCMC/KAJ services:
    - Tax services: Individual, Corporate, Self-employed returns
    - Compliance: Tender, Work Permit, Land Transfer, Firearm, Pension
    - PAYE: Monthly and Annual submissions
    - NIS: Registration, Contributions, Benefits
    - Financial: Statements, Cash Flow, Investment
    - Audit: NGO, Cooperative, Credit Union
    - Immigration: Work Permit, Citizenship, Business Visa
    - Business Registration: Incorporation, NPO, Cooperative
    - Paralegal: Affidavits, Agreements, Wills
    - Training and Consulting services
  - Dynamic requirements based on client type (Individual vs Business vs NGO)

- **Service Catalog Data Population** - Complete GCMC and KAJ service catalog (December 12, 2024)
  - Created `ingestServiceCatalog.ts` script with all business services
  - Added `db:ingest-catalog` npm script for running the ingestion
  - **12 categories** (6 GCMC, 6 KAJ) with proper descriptions and icons
  - **49 services** with complete details:
    - GCMC (23 services): Training, Small Business, Paralegal, Immigration, Proposals, Networking
    - KAJ (26 services): Income Tax, Tax Compliance, PAYE, Financial Statements, Audit, NIS
  - Each service includes: pricing type, base/max prices (GYD), duration, document requirements
  - Government agency associations for compliance services
  - 4 featured services highlighted in catalog

- **Service Catalog Admin UI** - Full CRUD for categories and services (December 12, 2024)
  - `CategoryFormDialog` component for creating service categories
  - `ServiceFormDialog` component for creating services with pricing, duration, and descriptions
  - Enabled "Add Category" and "Add Service" buttons in admin panel
  - Services now display in public catalog once created
  - Updated admin info card with setup instructions
  - Resolves the "No services available" issue - admins can now populate the catalog through the UI
- **Document Management & Knowledge Base System** - Sprint 1: Database schema implementation (December 12, 2024)
  - **Client Service Tracking**: New `clientServiceSelection` table (16 columns, 4 indexes)
    - Persists service selections from onboarding wizard
    - Tracks document requirements per service (from service catalog)
    - Monitors service lifecycle: INTERESTED → ACTIVE → COMPLETED → INACTIVE
    - Links uploaded documents to service requirements
    - Calculates document fulfillment percentage
  - **Knowledge Base Repository**: New schema file `knowledge-base.ts` with 2 tables
    - `knowledgeBaseItem` table (26 columns, 6 indexes) for forms, templates, guides
    - Support for 4 item types: AGENCY_FORM, LETTER_TEMPLATE, GUIDE, CHECKLIST
    - 7 categories: GRA, NIS, IMMIGRATION, DCRA, GENERAL, TRAINING, INTERNAL
    - Auto-fill capabilities linking to document templates
    - Business-scoped items (GCMC, KAJ, or both)
    - Staff-only vs client-accessible content control
    - Featured items and version tracking
    - `knowledgeBaseDownload` table (6 columns, 3 indexes) for download analytics
    - Tracks downloads by staff and clients with timestamps
  - **Portal Activity & Impersonation**: Enhanced `portal.ts` schema with 2 new tables
    - `portalActivityLog` table (13 columns, 6 indexes) tracks all client portal actions
    - 13 action types: LOGIN, LOGOUT, VIEW_DOCUMENT, DOWNLOAD_DOCUMENT, etc.
    - Records impersonation sessions (staff viewing as client)
    - Session tracking with IP address and user agent
    - `staffImpersonationSession` table (12 columns, 6 indexes) for secure staff impersonation
    - 30-minute session expiry for security
    - Required reason field for audit trail
    - Active session monitoring
    - Secure token generation for impersonation links
  - **Database Migration**: Generated migration file with all 5 new tables and 3 enums
    - Migration file: `0000_dapper_titania.sql`
    - Full referential integrity with cascade deletes
    - Proper indexing on frequently queried columns
- **Client Services API Router** - Complete service selection tracking (December 12, 2024)
  - `saveSelections` - Persist services from onboarding wizard
  - `getByClient` - Retrieve client's services with fulfillment calculations
  - `updateStatus` - Manage service lifecycle transitions
  - `linkDocument` - Connect uploaded documents to service requirements
  - `getFulfillmentProgress` - Calculate document collection progress
  - `getPopularServices` - Analytics on most requested services (admin)
  - `getCompletionMetrics` - Average completion times by service (admin)
  - `delete` - Remove service selections
- **Knowledge Base API Router** - Forms, templates, and guides management (December 12, 2024)
  - `list` - Browse KB items with filters (staff & clients)
  - `getById` - Retrieve single KB item
  - `download` - Download with tracking
  - `autoFill` - Auto-fill PDF forms with client/matter data
  - `create` - Admin create KB items
  - `update` - Admin update with version control
  - `delete` - Soft delete (archive)
  - `getDownloadStats` - Download analytics per item
  - `getPopularItems` - Most downloaded items analytics
- **Portal Impersonation & Analytics** - Staff portal management endpoints (December 12, 2024)
  - `impersonation.start` - Create 30-minute impersonation session with audit reason
  - `impersonation.end` - Terminate impersonation session
  - `impersonation.listActive` - View all active staff impersonations (admin)
  - `analytics.getPortalActivity` - Full activity log with filters and pagination
  - `analytics.getActivityStats` - Login/download/session statistics
  - `analytics.getImpersonationHistory` - Complete impersonation audit trail
  - Role-based access control (staff-only, admin-only endpoints)

### Added
- **Matter Wizard** - Step-by-step guided matter creation workflow (December 12, 2024)
  - 5-step wizard: Client → Service Type → Matter Details → Schedule & Fees → Review
  - Reuses existing wizard infrastructure from client onboarding
  - New route at `/app/matters/wizard`
  - New wizard components in `apps/web/src/components/wizards/matter-wizard/`
- **ClientSelector Component** - Reusable client selection dropdown with business grouping (December 12, 2024)
  - Groups clients by business affiliation (GCMC Only, KAJ Only, Both Businesses)
  - Searchable dropdown with scrollable list
  - Shows client type icons (Individual, Business, etc.)
  - Created at `apps/web/src/components/clients/client-selector.tsx`
- **Matters Page Wizard Integration** - Added Quick Add and Matter Wizard buttons (December 12, 2024)
  - Matches client page pattern with both options
  - Empty state links to wizard for first-time users

### Fixed
- **Service Type Dropdown Empty State** - Shows helpful message when no service types exist (December 12, 2024)
  - Displays "No service types available for [business]" with link to create them
  - Applies to both Quick Add form and Matter Wizard
- **Mobile Header Layout** - Fixed buttons being cut off on form pages (December 12, 2024)
  - PageHeader now uses responsive flex layout
  - Buttons stack vertically on mobile, inline on larger screens
- **Matter Quick Add Form** - Replaced broken client search with ClientSelector (December 12, 2024)
  - Fixed missing Popover/Command imports causing runtime errors
  - Form now works correctly with searchable client dropdown

- **Unit Testing Infrastructure** - Vitest setup for component and utility testing (December 12, 2024)
  - Vitest configuration with React Testing Library integration
  - JSDOM environment for browser API mocking
  - Test utilities with QueryClient provider wrapper
  - Global mocks for matchMedia, ResizeObserver, IntersectionObserver
  - Test scripts: `bun run test`, `bun run test:watch`, `bun run test:coverage`
  - Sample ErrorBoundary component tests demonstrating patterns
- **E2E Testing Infrastructure** - Playwright setup for end-to-end testing (December 12, 2024)
  - Playwright configuration with base URL and screenshot settings
  - Initial audit spec file with login, dashboard, and client wizard tests
  - Test screenshots directory structure

### Fixed
- **Wizard Navigation Visibility** - Fixed Continue/Submit button being cut off in client onboarding wizard (December 12, 2024)
  - Removed ScrollArea wrapper from app layout that was interfering with height propagation
  - Updated wizard container to use flex layout with scrollable content area and fixed navigation
  - Navigation buttons now stay visible at bottom of wizard card on both desktop and mobile
  - Affected files: `apps/web/src/routes/app.tsx`, `apps/web/src/components/wizards/wizard-container.tsx`, `apps/web/src/routes/app/clients/onboard.tsx`
- **Calendar New Deadline Form** - Fixed Radix UI Select component crash on business field (December 12, 2024)
  - Select.Item cannot have empty string as value, changed from `value=""` to `value="BOTH"`
  - Updated onChange handler to convert "BOTH" back to empty string for form data
  - Page now loads correctly without console errors

### Added
- **Real-Time Field Validation on Blur** - Immediate validation feedback for wizard forms (December 12, 2024)
  - Added `validateField`, `touchField`, and `isFieldTouched` methods to useWizard hook
  - Fields now validate immediately when user leaves them (onBlur event)
  - Email format validation shows error instantly without clicking Continue
  - Users see "Please enter a valid email address" when entering invalid email format
  - Applied to step-basic-info (First Name, Last Name, Business Name) and step-contact (Email, Phone)
  - Errors clear automatically when user fixes the field value
  - Accessible error display with aria-describedby linking inputs to error messages
- **Form Validation Feedback System** - Comprehensive error handling and user feedback (December 12, 2024)
  - Created ValidationSummary component for displaying validation errors
  - Added tooltip explanations to disabled wizard navigation buttons
  - Shows "Please complete all required fields" on hover when Continue is disabled
  - Added validation message banner above navigation when specific field errors exist
  - Updated WizardNavigation with errors and fieldLabels props for better error display
  - Added inline validation to Quick Add Client form (displayName, businesses required)
  - Visual indicators on required fields that haven't been completed
  - Accessible error handling with aria-live, aria-describedby, and role="alert"

### Changed
- **Documentation Updates** - Fixed spec and README inconsistencies (December 12, 2024)
  - Updated README.md Phase 2 status from "In Progress" to "Complete"
  - Updated README.md Phase 3 status to show partial completion (Email + Reporting done)
  - Added missing Phase 2 features to README (Training, Appointments, Tax Calculators)
  - Added Phase 3 features section to README
  - Fixed project structure - removed deleted seed.ts reference
  - Updated documentation links for moved GITHUB.md file
  - Added test commands to Available Scripts section
- **Project Structure Cleanup** - Comprehensive codebase reorganization (December 12, 2024)
  - Moved 12 implementation docs from root to `/specs/implementations/`
  - Moved GEMINI audit docs to `/specs/audits/`
  - Moved GITHUB workflow docs to `/specs/workflows/`
  - Root directory now contains only essential files (README, CLAUDE, CHANGELOG, CONTRIBUTING)
- **Lint Configuration** - Updated biome.json with relaxed rules for existing patterns
  - Set `noLeakedRender`, `noBarrelFile`, `useTopLevelRegex` to warnings
  - Set `noExcessiveCognitiveComplexity`, `noNestedTernary` to warnings
  - Added `.playwright-mcp` to ignore list
  - Fixed noLeakedRender in appointment-card.tsx using Boolean() wrappers

### Removed
- **Policy Violation Cleanup** - Removed files violating NO MOCK DATA policy (December 12, 2024)
  - Deleted `packages/db/src/seed.ts` (721 lines of mock service catalog data)
  - Deleted `packages/db/src/schema/gra.ts` (premature Phase 3 schema)
  - Deleted `packages/db/src/schema/whatsapp.ts` (premature Phase 3 schema)
  - Deleted `AGENTS.md.bak` backup file
  - Deleted log files (`*.log`, `server.log`, `web.log`)
- **Updated .gitignore** - Added patterns for cleanup
  - Playwright artifacts: `.playwright-mcp/`, `playwright-report/`, `test-results/`
  - Log files: `*.log`
  - Backup files: `*.bak`, `*.backup`, `*.old`

### Fixed
- **Appointment Card Lint** - Fixed potential leaked render values using explicit Boolean() conversions

---

## [2.0.0] - 2024-12-12

Phase 2 Complete - Enhanced Features Release

### Added
- **Reporting System** - Comprehensive business reporting and analytics (December 12, 2024)
  - Database schema: `reportDefinition`, `reportExecution`, `scheduledReport` tables
  - Report types: STANDARD and CUSTOM with category classification
  - Report categories: CLIENT, MATTER, FINANCIAL, DEADLINE, DOCUMENT, STAFF
  - Export formats: PDF, EXCEL, CSV (xlsx library installed)
  - 9 standard reports implemented:
    - CLIENT_SUMMARY - Client overview with matter counts and document counts
    - CLIENT_LIST - Detailed client listing with contact info and services
    - MATTER_STATUS - Matter breakdown by status (Open, In Progress, Completed)
    - REVENUE_SUMMARY - Invoice revenue by status with totals
    - ACCOUNTS_RECEIVABLE - Unpaid invoices with aging
    - INVOICE_REPORT - Detailed invoice listing with payment tracking
    - DEADLINE_SUMMARY - Upcoming deadlines by priority level
    - STAFF_PRODUCTIVITY - Staff activity and workload metrics
    - DOCUMENT_EXPIRY - Documents approaching expiration
  - API endpoints: `list`, `execute`, `history`, `categories`
  - Reports UI page at `/app/reports` with:
    - Report catalog with category filtering and search
    - Report cards with icons, descriptions, and badges
    - Execution dialog with business/date filter parameters
    - Results view with data table and summary statistics tabs
  - Report execution tracking with row counts and timestamps
  - Business-level filtering (GCMC, KAJ, or both)
  - Date range filtering for time-bound reports
- **Invoice PDF Generation** - Generate and download professional PDF invoices (December 12, 2024)
  - pdf-lib integration for server-side PDF generation
  - Professional invoice template with GCMC/KAJ branding
  - Line items table with quantities, prices, and amounts
  - Subtotal, discount, tax, and total calculations
  - Client information with TIN, email, and address
  - Status badge and payment tracking in PDF
  - Base64 encoded PDF transport via API
  - Download button in invoice detail page (`/app/invoices/$invoice-id`)
- **Financial Access Control Admin UI** - Staff forms with canViewFinancials checkbox (December 12, 2024)
  - Staff edit form (`/app/admin/staff/$staff-id`) - Checkbox to toggle financial data access
  - Staff create form (`/app/admin/staff/new`) - Checkbox to set initial financial access
  - View mode shows "Can View" or "No Access" badge for financial permissions
  - API schema updated to accept canViewFinancials in create/update operations
- **Global Error Boundary** - React error boundary component for graceful error handling (December 12, 2024)
  - Catches and displays React rendering errors application-wide
  - User-friendly error message with "Try Again" and "Reload Page" options
  - Development mode shows detailed error messages
  - Consistent UI with card-based error display
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
  - UI Integration: "Client Wizard" button in clients page header (December 12, 2024)
  - Empty state links to wizard for first-time users
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
- **Enhanced Client Portal UI** - Complete frontend for profile, financials, and appointment management
  - `/portal/profile` - Personal information view with TIN, national ID, passport details, contact info
  - `/portal/financials` - Invoice list, payment history, outstanding balance summary
  - `/portal/appointments` - Upcoming/past appointments with filtering tabs, status badges, location icons
  - Dashboard navigation cards for quick access to portal features
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
- **Payment Tracking Enhancements UI** - Complete discount and aging report frontend
  - Invoice discount modal component with live preview calculation
  - Supports NONE, PERCENTAGE, FIXED_AMOUNT discount types
  - Discount reason tracking for audit trail
  - Aging report component with visual breakdown (current, 30, 60, 90+ days)
  - Collapsible aging report toggle on invoices list page
  - Distribution bar chart visualization with color-coded buckets
  - Summary stats: total outstanding, current (not due), overdue amounts
  - Invoice discount fields: `discountType`, `discountValue`, `discountAmount`, `discountReason`
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
- **Duplicate Header on Mobile** - Fixed duplicate navigation headers showing on /app/* and /portal/* routes (December 12, 2024)
  - Root layout header now conditionally hidden on routes with their own layouts
  - Mobile view shows clean single header with hamburger menu
  - Desktop sidebar navigation unaffected
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

## [1.0.0] - 2024-12-11

Phase 1 Complete - Core Platform Release

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