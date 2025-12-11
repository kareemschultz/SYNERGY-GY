# GK-Nexus GitHub Project Tracking

This document provides an overview of the GK-Nexus platform development, milestone tracking, and GitHub issue management.

---

## Project Overview

**GK-Nexus** is a unified business management platform for GCMC (Guyana Career & Management Consultants) and KAJ (KAJ Tax & Accounting Services) in Guyana.

**Technology Stack:**
- **Frontend:** React 19 + TanStack Router
- **Backend:** Hono + oRPC
- **Database:** PostgreSQL + Drizzle ORM
- **Authentication:** Better-Auth
- **Deployment:** Docker containers on self-managed VPS (Vultr)
- **Storage:** Local filesystem + S3/R2 cloud backup

**Scale:**
- 200-500 clients
- 5-10 staff members
- Two distinct business units (GCMC & KAJ)

---

## Milestones

The project is organized into three major phases, each with its own milestone:

| Phase | Name | Issues | Status | Target Completion |
|-------|------|--------|--------|-------------------|
| Phase 1 | Core Platform | #1-5 | ✅ COMPLETE | Completed |
| Phase 2 | Advanced Features | #6-10 | 📋 PLANNED | Q2 2025 |
| Phase 3 | Integrations | #11-14 | 🔮 FUTURE | Q3 2025 |

### Phase 1: Core Platform (COMPLETE)

Foundation modules for managing clients, matters, documents, and deadlines.

**Deliverables:**
- 19 database tables across 6 schema files
- 5 main API routers (clients, matters, documents, deadlines, dashboard)
- Responsive web application with role-based access control
- Document storage system with local + cloud backup
- Calendar and deadline tracking

### Phase 2: Advanced Features (PLANNED)

Extended functionality for client self-service and business operations.

**Deliverables:**
- Client portal for self-service access
- Invoicing and payment tracking system
- Guyana-specific tax calculators (PAYE, VAT, NIS)
- Training management for GCMC courses
- Appointment scheduling system

### Phase 3: Integrations (FUTURE)

External service integrations and advanced reporting capabilities.

**Deliverables:**
- Email integration with Resend
- WhatsApp Business API integration
- Guyana Revenue Authority (GRA) integration
- Advanced reporting and analytics

---

## Issue Tracking

All development work is tracked through GitHub Issues. Each issue corresponds to a specific module or feature with detailed specifications.

### Phase 1 Issues (COMPLETE)

| Issue # | Module | Spec | Status | Labels |
|---------|--------|------|--------|--------|
| #1 | Client Management | [01-client-management.md](/specs/phase-1/01-client-management.md) | ✅ Complete | `phase-1`, `feature`, `api`, `frontend`, `database` |
| #2 | Matter Tracking | [02-matter-tracking.md](/specs/phase-1/02-matter-tracking.md) | ✅ Complete | `phase-1`, `feature`, `api`, `frontend`, `database` |
| #3 | Document Management | [03-document-management.md](/specs/phase-1/03-document-management.md) | ✅ Complete | `phase-1`, `feature`, `api`, `frontend`, `database` |
| #4 | Deadline Calendar | [04-deadline-calendar.md](/specs/phase-1/04-deadline-calendar.md) | ✅ Complete | `phase-1`, `feature`, `api`, `frontend`, `database` |
| #5 | Dashboard | [05-dashboard.md](/specs/phase-1/05-dashboard.md) | ✅ Complete | `phase-1`, `feature`, `api`, `frontend` |

### Phase 2 Issues (PLANNED)

| Issue # | Module | Spec | Status | Labels |
|---------|--------|------|--------|--------|
| #6 | Client Portal | [01-client-portal.md](/specs/phase-2/01-client-portal.md) | 📋 Planned | `phase-2`, `feature`, `priority-high`, `api`, `frontend`, `database` |
| #7 | Invoicing | [02-invoicing.md](/specs/phase-2/02-invoicing.md) | 📋 Planned | `phase-2`, `feature`, `priority-high`, `api`, `frontend`, `database` |
| #8 | Tax Calculators | [03-tax-calculators.md](/specs/phase-2/03-tax-calculators.md) | 📋 Planned | `phase-2`, `feature`, `priority-medium`, `frontend` |
| #9 | Training Management | [04-training-management.md](/specs/phase-2/04-training-management.md) | 📋 Planned | `phase-2`, `feature`, `priority-medium`, `api`, `frontend`, `database` |
| #10 | Appointments | [05-appointments.md](/specs/phase-2/05-appointments.md) | 📋 Planned | `phase-2`, `feature`, `priority-medium`, `api`, `frontend`, `database` |

### Phase 3 Issues (FUTURE)

| Issue # | Module | Spec | Status | Labels |
|---------|--------|------|--------|--------|
| #11 | Email Integration | [01-email-integration.md](/specs/phase-3/01-email-integration.md) | 🔮 Future | `phase-3`, `feature`, `priority-high`, `api`, `integration` |
| #12 | WhatsApp Integration | [02-whatsapp-integration.md](/specs/phase-3/02-whatsapp-integration.md) | 🔮 Future | `phase-3`, `feature`, `priority-medium`, `api`, `integration` |
| #13 | GRA Integration | [03-gra-integration.md](/specs/phase-3/03-gra-integration.md) | 🔮 Future | `phase-3`, `feature`, `priority-high`, `api`, `integration` |
| #14 | Reporting & Analytics | [04-reporting.md](/specs/phase-3/04-reporting.md) | 🔮 Future | `phase-3`, `feature`, `priority-medium`, `api`, `frontend` |

---

## Labels

GitHub labels are used to categorize and prioritize issues:

### Phase Labels
- `phase-1` - Core Platform features (COMPLETE)
- `phase-2` - Advanced Features (PLANNED)
- `phase-3` - Integrations (FUTURE)

### Type Labels
- `feature` - New functionality
- `bug` - Bug fixes
- `enhancement` - Improvements to existing features
- `documentation` - Documentation updates
- `refactor` - Code refactoring
- `chore` - Maintenance tasks

### Priority Labels
- `priority-high` - Critical features for business operations
- `priority-medium` - Important but not critical
- `priority-low` - Nice to have features

### Component Labels
- `api` - Backend API changes
- `frontend` - Frontend UI/UX changes
- `database` - Database schema changes
- `integration` - External service integrations
- `security` - Security-related changes
- `performance` - Performance optimizations

### Business Labels
- `gcmc` - GCMC-specific features
- `kaj` - KAJ-specific features
- `shared` - Shared across both businesses

---

## Development Workflow

Follow these steps when working on an issue:

### 1. Pick Up an Issue

1. Browse open issues in the [GitHub Issues](https://github.com/kareemschultz/SYNERGY-GY/issues) page
2. Look for issues tagged with the current phase (`phase-2` for current work)
3. Check that the issue is not already assigned
4. Assign the issue to yourself
5. Move the issue to "In Progress" on the project board (if using Projects)

### 2. Read the Specification

1. Each issue links to a detailed specification in `/specs/`
2. Read the full specification document thoroughly
3. Review related specifications for dependencies
4. Check the database schema in `/specs/architecture/database-schema.md`
5. Review API endpoints in `/specs/architecture/api-reference.md`

### 3. Create a Branch

Branch naming convention:
```bash
# Feature branches
git checkout -b feature/issue-number-short-description

# Examples:
git checkout -b feature/6-client-portal
git checkout -b feature/7-invoicing-system
git checkout -b feature/8-tax-calculators

# Bug fix branches
git checkout -b fix/issue-number-short-description

# Examples:
git checkout -b fix/15-deadline-timezone-bug
git checkout -b fix/16-upload-validation
```

### 4. Implement the Feature

**Backend (API) Work:**
1. Create/update database schema in `/packages/db/src/schema/`
2. Run `bun run db:push` to apply schema changes
3. Create API router in `/packages/api/src/routers/`
4. Add procedures with proper validation (Zod schemas)
5. Implement business logic with error handling
6. Add the router to `/packages/api/src/routers/index.ts`

**Frontend Work:**
1. Create routes in `/apps/web/src/routes/`
2. Build components in `/apps/web/src/components/`
3. Use TanStack Query for data fetching
4. Implement forms with TanStack Form
5. Add proper loading states and error handling
6. Ensure responsive design (mobile-first)

**Code Quality:**
- Run `npx ultracite fix` to format code
- Run `npx ultracite check` to verify code quality
- Follow TypeScript strict mode
- Write meaningful variable and function names
- Add comments for complex business logic

### 5. Test Your Changes

**Manual Testing:**
1. Test all CRUD operations
2. Test edge cases and error conditions
3. Verify role-based access control
4. Test on different screen sizes (responsive design)
5. Check browser console for errors

**Automated Testing (when applicable):**
```bash
bun test              # Run all tests
bun test:unit         # Unit tests
bun test:integration  # API tests
```

### 6. Submit a Pull Request

**PR Title Format:**
```
[TYPE] Brief description (#issue-number)

Examples:
feat: Add client portal with self-service access (#6)
fix: Resolve deadline notification timezone issue (#15)
docs: Update API reference for matter endpoints (#20)
```

**PR Description Template:**
```markdown
## Description
Brief summary of changes and motivation

## Related Issue
Closes #[issue-number]

## Changes
- Bullet list of specific changes made
- Include database schema changes
- Include API endpoint changes
- Include UI changes

## Testing
- [ ] Manual testing completed
- [ ] All existing tests pass
- [ ] New tests added (if applicable)
- [ ] Tested on mobile and desktop
- [ ] Tested with different user roles

## Screenshots (if UI changes)
Add before/after screenshots or feature demonstration

## Checklist
- [ ] Code passes `npx ultracite check`
- [ ] All tests pass
- [ ] Documentation updated (if needed)
- [ ] No console.log or debugger statements
- [ ] TypeScript strict mode passes
- [ ] Responsive design verified
```

**Submit PR:**
1. Push your branch to GitHub
2. Open a Pull Request to `master` (or `develop` if using)
3. Fill out the PR template completely
4. Request review from team members
5. Address review feedback promptly

### 7. Code Review Process

**Reviewers will check:**
- Code follows Ultracite/Biome standards
- Business logic is correct
- Security considerations (input validation, auth)
- Performance implications
- Error handling is appropriate
- Tests are sufficient
- Documentation is clear

**Required approvals:**
- Bug fixes: 1 reviewer
- Features: 2 reviewers
- Breaking changes: All team members

### 8. Merge and Close

**After approval:**
1. Ensure all CI checks pass
2. Squash and merge the PR
3. Delete the feature branch
4. The linked issue will close automatically
5. Verify deployment to staging/production

---

## Quick Links

### Documentation
- [Project README](/README.md)
- [Specifications Index](/specs/README.md)
- [Implementation Plan](/.claude/IMPLEMENTATION_PLAN.md)
- [Code Standards](/CLAUDE.md)

### Phase Overviews
- [Phase 1: Core Platform](/specs/phase-1/00-overview.md)
- [Phase 2: Advanced Features](/specs/phase-2/00-overview.md)
- [Phase 3: Integrations](/specs/phase-3/00-overview.md)

### Architecture
- [Database Schema](/specs/architecture/database-schema.md)
- [API Reference](/specs/architecture/api-reference.md)
- [Auth System](/specs/architecture/auth-system.md)
- [File Storage](/specs/architecture/file-storage.md)

### Business Rules
- [GCMC Services](/specs/business-rules/gcmc-services.md)
- [KAJ Services](/specs/business-rules/kaj-services.md)
- [Guyana Tax Rules](/specs/business-rules/guyana-tax-rules.md)
- [Compliance Requirements](/specs/business-rules/compliance-requirements.md)

### GitHub
- [GitHub Issues](https://github.com/kareemschultz/SYNERGY-GY/issues)
- [Pull Requests](https://github.com/kareemschultz/SYNERGY-GY/pulls)
- [Repository](https://github.com/kareemschultz/SYNERGY-GY)

### Code Locations
- [API Routers](/packages/api/src/routers/)
- [Database Schema](/packages/db/src/schema/)
- [Web Routes](/apps/web/src/routes/)
- [Components](/apps/web/src/components/)

---

## Project Status

### Current Phase: Phase 2 (Advanced Features)

Phase 1 is complete. The core platform is functional with:
- ✅ Client management system
- ✅ Matter tracking with workflows
- ✅ Document storage and organization
- ✅ Deadline calendar with reminders
- ✅ Dashboard with business statistics

**Next Steps:**
1. Begin Phase 2 implementation
2. Start with Client Portal (Issue #6) - highest priority
3. Follow with Invoicing system (Issue #7)
4. Implement Tax Calculators (Issue #8)
5. Add Training Management (Issue #9)
6. Complete with Appointments (Issue #10)

### Key Metrics

**Code Statistics:**
- Database Tables: 19
- API Routers: 5 (clients, matters, documents, deadlines, dashboard)
- Frontend Routes: 15+
- UI Components: 25+

**Development Progress:**
- Phase 1: 100% (5/5 modules complete)
- Phase 2: 0% (0/5 modules started)
- Phase 3: 0% (0/4 modules planned)
- Overall: 36% (5/14 total modules)

---

## Contributing

### Setting Up Development Environment

1. **Clone the repository:**
   ```bash
   git clone https://github.com/kareemschultz/SYNERGY-GY.git
   cd SYNERGY-GY
   ```

2. **Install dependencies:**
   ```bash
   bun install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your database and service credentials
   ```

4. **Set up the database:**
   ```bash
   bun run db:push      # Apply schema
   bun run db:studio    # Open database studio
   ```

5. **Start development servers:**
   ```bash
   bun run dev          # Start all apps
   # OR
   bun run dev:web      # Frontend only
   bun run dev:server   # Backend only
   ```

### Development Commands

```bash
# Development
bun run dev              # Start all apps
bun run dev:web          # Start web app only
bun run dev:server       # Start server only

# Database
bun run db:push          # Push schema changes
bun run db:studio        # Open Drizzle Studio
bun run db:generate      # Generate migrations
bun run db:migrate       # Run migrations

# Code Quality
npx ultracite fix        # Format and fix code
npx ultracite check      # Check for issues
npx ultracite doctor     # Diagnose setup

# Testing
bun test                 # Run all tests
bun test:unit            # Unit tests only
bun test:integration     # Integration tests
bun test:coverage        # Coverage report

# Build
bun run build            # Build all apps
bun run build:web        # Build web app
bun run build:server     # Build server
```

### Getting Help

- Read the specifications in `/specs/`
- Check existing issues and PRs
- Review the implementation plan in `/.claude/IMPLEMENTATION_PLAN.md`
- Ask questions in issue comments
- Contact project maintainers

---

## License

This is a proprietary project for GCMC and KAJ. All rights reserved.

---

**Last Updated:** 2025-12-11
**Maintained by:** Kareem Schultz (@kareemschultz)
