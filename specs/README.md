# GK-Nexus Technical Specifications

Unified business management platform for GCMC (training, consulting, paralegal, immigration) and KAJ (tax, accounting, financial services) in Guyana.

**Developed by:** Kareem Schultz, Karetech Solutions

---

## Current Documentation

| Document | Description |
|----------|-------------|
| **[FEATURE_INVENTORY.md](./FEATURE_INVENTORY.md)** | **Source of Truth** - Complete feature list with routes and API endpoints |

---

## Project Overview

| Attribute | Value |
|-----------|-------|
| **Stack** | React 19 + TanStack Router \| Hono + oRPC \| PostgreSQL 17 + Drizzle ORM \| Better-Auth |
| **Scale** | 200-500 clients, 5-10 staff |
| **Deployment** | Docker containers (GHCR image: `ghcr.io/kareemschultz/gk-nexus:latest`) |
| **Storage** | Local filesystem + S3/R2 cloud backup |

---

## Businesses

### GCMC (Green Crescent Management Consultancy)
- Professional Training & Development
- Business Consulting
- Paralegal Services
- Immigration Services

### KAJ (Kareem Abdul-Jabar Tax & Accounting Services)
- Tax Preparation & Filing
- Accounting Services
- Financial Planning
- Business Registration

---

## Implementation Status

### Phase 1: Core Platform - **COMPLETE**
Foundation modules for managing clients, matters, documents, and deadlines.

| Module | Status |
|--------|--------|
| Client Management | ✅ Complete |
| Matter Tracking | ✅ Complete |
| Document Management | ✅ Complete |
| Deadline Calendar | ✅ Complete |
| Dashboard | ✅ Complete |

### Phase 2: Advanced Features - **COMPLETE**
Extended functionality for client self-service and business operations.

| Module | Status |
|--------|--------|
| Admin Panel | ✅ Complete |
| Settings Page | ✅ Complete |
| Client Portal | ✅ Complete |
| Service Catalog | ✅ Complete |
| Invoicing & Payments | ✅ Complete |
| Tax Calculators | ✅ Complete |
| Training Management | ✅ Complete |
| Appointments | ✅ Complete |
| Knowledge Base | ✅ Complete |
| Reports & Analytics | ✅ Complete |
| AML Compliance | ✅ Complete |
| Email Integration | ✅ Complete |

### Phase 3: External Integrations - **FUTURE**
External service integrations for government agencies and communication.

| Module | Status |
|--------|--------|
| WhatsApp Integration | 📅 Planned |
| GRA Integration | 📅 Planned |
| NIS Integration | 📅 Planned |
| DCRA Integration | 📅 Planned |

---

## Archived Specifications

Historical planning and specification documents are archived in the [archive/](./archive/) folder:

| Archive | Description |
|---------|-------------|
| [Phase 1 Specs](./archive/phase-1/) | Core features specifications (completed) |
| [Phase 2 Specs](./archive/phase-2/) | Advanced features specifications (completed) |
| [Phase 3 Specs](./archive/phase-3/) | Future integrations specifications |
| [Architecture](./archive/architecture/) | System design documentation |
| [Business Rules](./archive/business-rules/) | Guyana-specific business rules |
| [Implementations](./archive/implementations/) | Historical implementation logs |

> **Note:** These specs were created during planning. For current implementation status, always refer to **[FEATURE_INVENTORY.md](./FEATURE_INVENTORY.md)**.

---

## Quick Reference

### Key Directories

| Purpose | Path |
|---------|------|
| API Routers | `packages/api/src/routers/` |
| Database Schema | `packages/db/src/schema/` |
| Frontend Routes | `apps/web/src/routes/` |
| E2E Tests | `apps/web/e2e/` |

### Common Commands

```bash
# Development
bun run dev              # Start all apps
bun run dev:web          # Frontend only
bun run dev:server       # Backend only

# Database
bun run db:push          # Push schema changes
bun run db:studio        # Open Drizzle Studio

# Code Quality
npx ultracite fix        # Auto-fix linting/formatting
bun run check-types      # TypeScript type checking

# Testing
bunx playwright test     # Run E2E tests
```

---

## Critical Development Policy: NO MOCK DATA

> **MANDATORY**: This application must NEVER contain mock data, fake data, seed data, or placeholder content.

All data in the system must be:
- **Manually created** by users through the UI
- **Imported** from real external sources (with user consent)
- **Generated** by legitimate business operations

| ❌ NOT ALLOWED | ✅ REQUIRED |
|----------------|-------------|
| Hardcoded fake clients | Empty database on fresh install |
| Seed scripts with dummy data | Manual data entry through UI |
| Mock API responses | Real API calls to database |
| Placeholder documents | Actual uploaded files |

**Exceptions:** Service type definitions, enum values, and lookup tables are configuration metadata (allowed).

---

## Development Guidelines

### Code Style
- Follow Ultracite/Biome standards - run `npx ultracite fix` before committing
- Use TypeScript strict mode
- Explicit return types for exported functions
- Prefer named exports over default exports

### Testing
- E2E tests in `apps/web/e2e/`
- Unit tests with Vitest
- All tests must pass before merging

### Documentation
- Update CHANGELOG.md with each change
- Reference GitHub issues in commits
- Use conventional commits: `type(scope): description`

---

*Last Updated: December 2025*
