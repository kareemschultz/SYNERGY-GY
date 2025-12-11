# GK-Nexus Specifications

Unified business management platform for GCMC (training, consulting, paralegal, immigration) and KAJ (tax, accounting, financial services) in Guyana.

## Project Overview

| Attribute | Value |
|-----------|-------|
| **Stack** | React 19 + TanStack Router \| Hono + oRPC \| PostgreSQL + Drizzle ORM \| Better-Auth |
| **Scale** | 200-500 clients, 5-10 staff |
| **Deployment** | Docker containers on self-managed VPS (Vultr) |
| **Storage** | Local filesystem + S3/R2 cloud backup |

## Businesses

### GCMC (Guyana Career & Management Consultants)
- Professional Training & Development
- Business Consulting
- Paralegal Services
- Immigration Services

### KAJ (KAJ Tax & Accounting Services)
- Tax Preparation & Filing
- Accounting Services
- Financial Planning
- Business Registration

---

## Phases

### [Phase 1: Core Platform](./phase-1/00-overview.md) - **COMPLETE**
Foundation modules for managing clients, matters, documents, and deadlines.

| Module | Status | Documentation |
|--------|--------|---------------|
| Client Management | ✅ Complete | [Spec](./phase-1/01-client-management.md) |
| Matter Tracking | ✅ Complete | [Spec](./phase-1/02-matter-tracking.md) |
| Document Management | ✅ Complete | [Spec](./phase-1/03-document-management.md) |
| Deadline Calendar | ✅ Complete | [Spec](./phase-1/04-deadline-calendar.md) |
| Dashboard | ✅ Complete | [Spec](./phase-1/05-dashboard.md) |

### [Phase 2: Advanced Features](./phase-2/00-overview.md) - PLANNED
Extended functionality for client self-service and business operations.

| Module | Status | Documentation |
|--------|--------|---------------|
| Client Portal | Planned | [Spec](./phase-2/01-client-portal.md) |
| Invoicing & Payments | Planned | [Spec](./phase-2/02-invoicing.md) |
| Tax Calculators | Planned | [Spec](./phase-2/03-tax-calculators.md) |
| Training Management | Planned | [Spec](./phase-2/04-training-management.md) |
| Appointments | Planned | [Spec](./phase-2/05-appointments.md) |

### [Phase 3: Integrations](./phase-3/00-overview.md) - FUTURE
External service integrations and advanced reporting.

| Module | Status | Documentation |
|--------|--------|---------------|
| Email Integration | Future | [Spec](./phase-3/01-email-integration.md) |
| WhatsApp Integration | Future | [Spec](./phase-3/02-whatsapp-integration.md) |
| GRA Integration | Future | [Spec](./phase-3/03-gra-integration.md) |
| Reporting & Analytics | Future | [Spec](./phase-3/04-reporting.md) |

---

## Design & UX

| Document | Description |
|----------|-------------|
| [Design System](./design-system.md) | Design tokens, colors, typography, spacing |
| [UX Guidelines](./ux-guidelines.md) | Error handling, feedback, accessibility |
| [UI Components](./ui-components.md) | Component specifications and patterns |

---

## Architecture

| Document | Description |
|----------|-------------|
| [Database Schema](./architecture/database-schema.md) | Complete database structure |
| [API Reference](./architecture/api-reference.md) | API endpoints and parameters |
| [Auth System](./architecture/auth-system.md) | Authentication and RBAC |
| [File Storage](./architecture/file-storage.md) | Document storage design |

---

## Business Rules

| Document | Description |
|----------|-------------|
| [GCMC Services](./business-rules/gcmc-services.md) | GCMC service definitions |
| [KAJ Services](./business-rules/kaj-services.md) | KAJ service definitions |
| [Guyana Tax Rules](./business-rules/guyana-tax-rules.md) | GY tax regulations |
| [Compliance Requirements](./business-rules/compliance-requirements.md) | Legal/regulatory requirements |

---

## Quick Links

### Development
- [Main Plan](/home/kareem/.claude/plans/distributed-yawning-eagle.md)
- [API Routers](/packages/api/src/routers/)
- [Database Schema](/packages/db/src/schema/)
- [Web Routes](/apps/web/src/routes/)

### Key Files
| Purpose | Path |
|---------|------|
| API Middleware | `/packages/api/src/index.ts` |
| Client Router | `/packages/api/src/routers/clients.ts` |
| Matter Router | `/packages/api/src/routers/matters.ts` |
| Document Router | `/packages/api/src/routers/documents.ts` |
| Deadline Router | `/packages/api/src/routers/deadlines.ts` |
| Dashboard Router | `/packages/api/src/routers/dashboard.ts` |
| Auth Layout | `/apps/web/src/routes/_authenticated.tsx` |
| Sidebar | `/apps/web/src/components/layout/sidebar.tsx` |

---

## Implementation Plan

### Phase 1: Core Platform (Current Priority)

#### Implementation Order

| Step | Component | Priority | Dependencies | Estimated Effort |
|------|-----------|----------|--------------|------------------|
| 1 | Database Schema Setup | Critical | None | 1-2 days |
| 2 | Authentication System | Critical | Database | 2-3 days |
| 3 | Client Management API | High | Auth | 2-3 days |
| 4 | Client Management UI | High | Client API | 3-4 days |
| 5 | Matter Tracking API | High | Client API | 2-3 days |
| 6 | Matter Tracking UI | High | Matter API | 3-4 days |
| 7 | Document Management API | High | Matter API | 3-4 days |
| 8 | Document Storage Setup | High | None | 1-2 days |
| 9 | Document Management UI | High | Document API, Storage | 4-5 days |
| 10 | Deadline Calendar API | Medium | Matter API | 2-3 days |
| 11 | Deadline Calendar UI | Medium | Deadline API | 3-4 days |
| 12 | Dashboard API | Medium | All APIs | 2-3 days |
| 13 | Dashboard UI | Medium | Dashboard API | 3-4 days |
| 14 | Integration Testing | High | All components | 2-3 days |
| 15 | User Acceptance Testing | High | All components | 3-5 days |

#### Technical Implementation Steps

**Backend Setup**
1. Initialize PostgreSQL database with Drizzle ORM
2. Configure Better-Auth with email/password provider
3. Implement role-based access control (Admin, Staff, Client)
4. Create API routers using oRPC with Hono
5. Set up file storage with local filesystem + S3/R2 backup
6. Configure error handling and logging middleware
7. Implement data validation with Zod schemas

**Frontend Setup**
1. Configure TanStack Router with authentication guards
2. Set up shadcn/ui component library
3. Implement responsive layout with sidebar navigation
4. Create reusable form components with validation
5. Set up React Query for data fetching and caching
6. Implement optimistic updates for better UX
7. Configure Vite for development and production builds

**Data Layer**
1. Define database schemas for all core entities
2. Create migration files for schema deployment
3. Set up database indexes for performance
4. Implement soft deletes for audit trail
5. Create database seed scripts for testing
6. Configure connection pooling for scalability

#### Testing Requirements

| Test Type | Coverage Target | Tools | Responsibility |
|-----------|----------------|-------|----------------|
| Unit Tests | 70%+ critical paths | Vitest | Developers |
| Integration Tests | All API endpoints | Supertest + Vitest | Developers |
| E2E Tests | Critical user flows | Playwright | QA/Developers |
| Performance Tests | API response < 200ms | k6 or Artillery | DevOps |
| Security Tests | OWASP Top 10 | Manual + OWASP ZAP | Security Review |
| Accessibility Tests | WCAG 2.1 AA | axe-core + manual | Developers |

**Critical Test Scenarios**
- Client CRUD operations with validation
- Matter creation and status transitions
- Document upload, download, and deletion
- Deadline notifications and filtering
- Multi-user concurrent access
- Permission-based access control
- Data export and backup procedures

#### Deployment Considerations

**Infrastructure**
| Component | Configuration | Backup Strategy |
|-----------|--------------|-----------------|
| VPS Server | Vultr 4GB RAM, 2 vCPU | Snapshot daily |
| PostgreSQL | Docker container, 20GB storage | Automated dumps every 6 hours |
| Application | Docker Compose multi-container | Blue-green deployment |
| File Storage | Local + R2/S3 sync | Hourly sync to cloud |
| SSL/TLS | Let's Encrypt auto-renewal | Certificate monitoring |
| Reverse Proxy | Nginx or Caddy | Configuration versioning |

**Deployment Pipeline**
1. Code review and approval required
2. Automated tests must pass
3. Build Docker images with version tags
4. Deploy to staging environment
5. Run smoke tests on staging
6. Manual approval for production
7. Rolling deployment with health checks
8. Monitor logs and metrics post-deployment
9. Automated rollback on critical errors

**Monitoring & Maintenance**
- Application logs: Structured JSON to file + log aggregation
- Error tracking: Sentry or similar APM
- Uptime monitoring: External service (UptimeRobot, Pingdom)
- Database monitoring: Connection pool, query performance
- Backup verification: Weekly restore tests
- Security updates: Monthly dependency audits

---

## Requirements

### Functional Requirements Summary

#### Core Capabilities

| Module | Key Functions | Business Value |
|--------|---------------|----------------|
| **Client Management** | Create, update, search clients; track contact info, business affiliations | Centralized customer database |
| **Matter Tracking** | Create matters, assign services, track status, link to clients | Service delivery tracking |
| **Document Management** | Upload, categorize, version, search documents; link to clients/matters | Organized record keeping |
| **Deadline Calendar** | Set deadlines, notifications, filter by service/client | Compliance and timeliness |
| **Dashboard** | View upcoming deadlines, recent activity, quick stats | Operational awareness |

#### User Roles & Permissions

| Role | Access Level | Key Capabilities |
|------|-------------|------------------|
| **Admin** | Full system access | User management, system configuration, all data access |
| **Staff** | Business-specific access | Manage assigned clients, matters, documents within their business unit |
| **Client** | Self-service portal | View own matters, documents, deadlines; upload documents |

#### Data Management

- **Multi-business support**: GCMC and KAJ operate independently within shared platform
- **Client relationships**: Individual and business clients with multiple contacts
- **Matter lifecycle**: Draft → Active → Completed → Archived states
- **Document versioning**: Track changes with audit trail
- **Activity logging**: User actions, timestamps, changes tracked

### Non-Functional Requirements

#### Performance

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Page Load Time | < 2s on 3G connection | Lighthouse, WebPageTest |
| API Response Time | < 200ms for 95th percentile | Application monitoring |
| Database Query Time | < 100ms for common queries | Query logging |
| File Upload | Support files up to 50MB | Integration testing |
| Concurrent Users | Handle 20+ simultaneous users | Load testing |
| Search Results | Return in < 500ms | Performance testing |

#### Security

| Requirement | Implementation | Verification |
|------------|----------------|--------------|
| Authentication | Better-Auth with bcrypt password hashing | Security audit |
| Authorization | Role-based access control (RBAC) | Permission testing |
| Data Encryption | TLS 1.3 in transit, encrypted backups at rest | SSL Labs scan |
| Input Validation | Zod schemas on all inputs | Penetration testing |
| File Security | Virus scanning, type validation, size limits | Security review |
| Session Management | Secure HTTP-only cookies, CSRF protection | OWASP compliance |
| Audit Trail | Log all data modifications with user/timestamp | Audit log review |

#### Scalability

| Aspect | Current Target | Growth Strategy |
|--------|---------------|-----------------|
| Users | 5-10 staff, 200-500 clients | Horizontal scaling with load balancer |
| Data Storage | 100GB initial | Add storage volumes as needed |
| Database | Single PostgreSQL instance | Read replicas for reporting |
| File Storage | Local + cloud backup | Cloud-first storage for growth |
| API Throughput | 1000 requests/minute | Rate limiting, caching layer |

#### Reliability & Availability

- **Uptime target**: 99.5% (< 3.6 hours downtime/month)
- **Backup frequency**: Database every 6 hours, files hourly
- **Recovery time objective (RTO)**: < 4 hours
- **Recovery point objective (RPO)**: < 6 hours
- **Error handling**: Graceful degradation with user-friendly messages
- **Data integrity**: ACID compliance, foreign key constraints

### Integration Requirements

#### Phase 1 (Core Platform)
- Email notifications via SMTP (SendGrid, AWS SES, or similar)
- File storage: S3-compatible API (AWS S3, Cloudflare R2, Backblaze B2)
- Authentication: OAuth 2.0 ready for future social login

#### Phase 2 (Advanced Features)
- Payment processing: Stripe or PayPal integration
- Calendar sync: iCal/CalDAV export for deadline integration
- SMS notifications: Twilio or similar provider

#### Phase 3 (External Integrations)
- WhatsApp Business API for client communication
- Email client integration (IMAP/SMTP)
- Guyana Revenue Authority (GRA) API for tax filing
- Accounting software export (QuickBooks, Xero formats)

### User Experience Requirements

#### Accessibility
- **WCAG 2.1 Level AA compliance** for all public-facing interfaces
- Keyboard navigation support for all interactive elements
- Screen reader compatibility with ARIA labels
- Sufficient color contrast ratios (4.5:1 for text)
- Responsive design for mobile, tablet, desktop (320px - 2560px)
- Font size adjustable without breaking layout

#### Usability
- **Max 3 clicks** to reach any primary function
- Consistent navigation patterns across all modules
- Clear visual hierarchy and information architecture
- Inline validation with helpful error messages
- Confirmation dialogs for destructive actions
- Undo capability where feasible
- Loading states and progress indicators for async operations

#### Internationalization
- Support for Guyanese English (primary)
- Date format: DD/MM/YYYY (local preference)
- Currency: GYD (Guyanese Dollar) with USD support
- Time zone: GMT-4 (Guyana Time)
- Number format: comma thousands separator, period decimal

---

## Development Guidelines

### Code Organization Standards

#### Project Structure

```
apps/
  web/                    # Frontend React application
    src/
      components/         # Reusable UI components
        ui/              # shadcn/ui components
        layout/          # Layout components (sidebar, header)
        forms/           # Form components
      routes/            # TanStack Router pages
      lib/               # Utility functions, configurations
      hooks/             # Custom React hooks
  server/                # Backend Hono server
    src/
      index.ts           # Server entry point
      middleware/        # Custom middleware

packages/
  api/                   # Shared API logic
    src/
      routers/           # oRPC route handlers
      context.ts         # Request context setup
  auth/                  # Authentication utilities
    src/
      index.ts           # Better-Auth configuration
  db/                    # Database layer
    src/
      schema/            # Drizzle schema definitions
      index.ts           # Database client export
```

#### Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Files | kebab-case | `client-management.ts` |
| Components | PascalCase | `ClientList.tsx` |
| Functions | camelCase | `fetchClientData()` |
| Constants | UPPER_SNAKE_CASE | `MAX_FILE_SIZE` |
| Types/Interfaces | PascalCase | `ClientData`, `MatterStatus` |
| Database Tables | snake_case | `client_matters` |
| API Routes | kebab-case | `/api/clients/search` |

#### Code Style

- **Follow Ultracite/Biome standards** - run `npx ultracite fix` before committing
- Maximum line length: 100 characters
- Use TypeScript strict mode
- Explicit return types for exported functions
- Prefer named exports over default exports
- Group imports: external, internal, relative
- Use path aliases (`@/components`) instead of relative paths

### Testing Expectations

#### Test Coverage Requirements

| Code Type | Minimum Coverage | Priority Areas |
|-----------|-----------------|----------------|
| API Routes | 80% | All endpoints, error cases |
| Database Queries | 70% | CRUD operations, complex queries |
| Business Logic | 85% | Service calculators, validators |
| UI Components | 60% | Critical flows, form validation |
| Utility Functions | 90% | Pure functions, transformations |

#### Test Organization

```
__tests__/
  unit/                  # Unit tests for functions, utilities
  integration/           # API endpoint tests
  e2e/                   # End-to-end user flow tests
```

**Testing Best Practices**
- Write tests before fixing bugs (TDD for bug fixes)
- Use descriptive test names: `should [expected behavior] when [condition]`
- Mock external dependencies (database, APIs)
- Test edge cases and error conditions
- Keep tests independent and isolated
- Use factories/fixtures for test data

#### Test Commands

```bash
bun test              # Run all tests
bun test:unit         # Run unit tests only
bun test:integration  # Run integration tests
bun test:e2e          # Run E2E tests
bun test:coverage     # Generate coverage report
```

### Documentation Requirements

#### Code Documentation

**When to Document**
- Complex business logic requiring explanation
- Non-obvious architectural decisions
- Public API functions and interfaces
- Configuration options and environment variables
- Database schema changes

**Documentation Standards**
```typescript
/**
 * Calculates Guyana income tax based on 2024 tax brackets.
 *
 * @param income - Annual taxable income in GYD
 * @param deductions - Total eligible deductions in GYD
 * @returns Tax liability object with breakdown by bracket
 * @throws {ValidationError} If income is negative
 *
 * @example
 * const tax = calculateIncomeTax(1500000, 50000);
 * // Returns: { total: 123456, brackets: [...] }
 */
```

#### Required Documentation

| Document Type | Location | Update Frequency |
|--------------|----------|------------------|
| API Endpoints | `/specs/architecture/api-reference.md` | With each API change |
| Database Schema | `/specs/architecture/database-schema.md` | With each migration |
| Environment Variables | `README.md` or `.env.example` | When variables change |
| Setup Instructions | `README.md` | When setup process changes |
| Deployment Procedures | `/docs/deployment.md` | Before each release |
| Changelog | `CHANGELOG.md` | With each release |

#### User Documentation
- Feature guides for each major module
- Role-based user manuals (Admin, Staff, Client)
- FAQ for common questions
- Video tutorials for complex workflows
- API documentation for integrations

### Review Process

#### Code Review Checklist

**Before Submitting PR**
- [ ] Code passes `npx ultracite check`
- [ ] All tests pass (`bun test`)
- [ ] No console.log or debugger statements
- [ ] TypeScript strict mode passes with no errors
- [ ] Updated relevant documentation
- [ ] Added/updated tests for changes
- [ ] Self-reviewed diff for unintended changes
- [ ] Tested manually in development environment

**Reviewer Responsibilities**
- [ ] Code follows project conventions and standards
- [ ] Business logic is correct and handles edge cases
- [ ] Security considerations addressed (input validation, auth)
- [ ] Performance implications considered
- [ ] Error handling is appropriate
- [ ] Tests are meaningful and sufficient
- [ ] Documentation is clear and accurate
- [ ] No unnecessary complexity or over-engineering

#### Pull Request Guidelines

**PR Title Format**
```
[TYPE] Brief description

Types: feat, fix, docs, refactor, test, chore
Examples:
  feat: Add client search with filters
  fix: Resolve deadline notification timezone issue
  docs: Update API reference for matter endpoints
```

**PR Description Template**
```markdown
## Description
Brief summary of changes and motivation

## Changes
- Bullet list of specific changes

## Testing
How this was tested

## Screenshots (if UI changes)
Before/After or feature demonstration

## Checklist
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Biome checks pass
- [ ] Breaking changes documented
```

#### Review Timeline

| PR Type | Review Window | Approvals Required |
|---------|--------------|-------------------|
| Hotfix | 4 hours | 1 reviewer |
| Bug fix | 24 hours | 1 reviewer |
| Feature | 48 hours | 2 reviewers |
| Refactoring | 48 hours | 2 reviewers |
| Breaking change | 72 hours | All team members |

**Branch Strategy**
- `master` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - New features
- `fix/*` - Bug fixes
- `hotfix/*` - Urgent production fixes

**Merge Requirements**
- All CI checks pass
- Required approvals obtained
- No unresolved conversations
- Up to date with target branch
- Squash and merge for feature branches
