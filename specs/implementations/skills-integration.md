# Claude Code Skills Integration

**Implemented:** December 2024
**Status:** Complete

## Overview

Integrated 9 Claude Code Skills to maximize Claude's effectiveness when working with the GK-Nexus codebase. Skills are model-invoked capabilities that Claude automatically discovers and uses based on context.

## Skills Created

| Skill | Purpose | Triggers |
|-------|---------|----------|
| `drizzle-schema` | Database schema patterns | schema, table, migration, Drizzle, PostgreSQL |
| `orpc-router` | API router patterns | API, endpoint, router, procedure, backend |
| `react-component` | Frontend component patterns | component, React, UI, form, Shadcn |
| `tanstack-route` | Route development | route, page, navigation, TanStack |
| `change-tracking` | Git/docs workflow | commit, changelog, PR, documentation |
| `code-quality` | Ultracite/Biome standards | lint, format, TypeScript, code quality |
| `testing-e2e` | Playwright testing | test, E2E, Playwright, spec |
| `business-context` | GCMC/KAJ domain knowledge | GCMC, KAJ, tax, immigration, Guyana |
| `ui-ux-design` | UI/UX design system | UI, UX, design, accessibility, component |

## Directory Structure

```
.claude/skills/
├── drizzle-schema/
│   └── SKILL.md
├── orpc-router/
│   └── SKILL.md
├── react-component/
│   └── SKILL.md
├── tanstack-route/
│   └── SKILL.md
├── change-tracking/
│   └── SKILL.md
├── code-quality/
│   └── SKILL.md
├── testing-e2e/
│   └── SKILL.md
├── business-context/
│   └── SKILL.md
└── ui-ux-design/
    ├── SKILL.md
    └── helpers.md
```

## Skill Details

### drizzle-schema
- UUID primary keys with `crypto.randomUUID()`
- Timestamp columns (`createdAt`, `updatedAt`)
- Business filtering (`businesses` array)
- Relations with `relations()` function
- Index definitions

### orpc-router
- Procedure types: `publicProcedure`, `protectedProcedure`, `staffProcedure`, `adminProcedure`, `financialProcedure`
- Zod input validation
- Error handling with `ORPCError`
- Activity logging patterns

### react-component
- TanStack Query with `orpc` hooks
- Form handling with React Hook Form + Zod
- Shadcn/UI component imports
- Loading, error, and empty states

### tanstack-route
- File-based routing structure
- Route protection with `beforeLoad`
- Loader patterns for data fetching
- Dynamic routes with `$param` naming

### change-tracking
- CHANGELOG.md format (Keep a Changelog)
- Conventional commit format
- GitHub issue references
- Spec file updates

### code-quality
- No `any` types (use `unknown`)
- Arrow functions for callbacks
- `for...of` over `.forEach()`
- Proper async/await patterns
- Security best practices

### testing-e2e
- Test file structure
- Page object patterns
- Authentication helpers
- Test data cleanup (no mock data)

### business-context
- GCMC services (training, consulting, immigration, paralegal)
- KAJ services (tax, accounting, NIS)
- Staff roles and permissions
- Guyana-specific requirements (GRA, NIS, currency)

### ui-ux-design
Comprehensive design system including:
- Design system tokens (colors, typography, spacing)
- Layout patterns and information architecture
- Component library specifications
- Accessibility (WCAG AA/AAA compliance)
- Animation and micro-interaction patterns
- Form UX best practices
- Responsive/mobile-first design
- Performance patterns (skeletons, virtualization)

Plus `helpers.md` with ready-to-use code:
- Animation keyframes
- Custom hooks (useDebounce, useMediaQuery, useLocalStorage, etc.)
- Utility functions
- Ready-to-use components
- Icon sets
- Accessibility utilities

## How Skills Work

Claude automatically discovers and uses skills based on context:
- Create database table → `drizzle-schema` activates
- Build API endpoint → `orpc-router` activates
- Create React component → `react-component` activates
- Design UI feature → `ui-ux-design` activates

## Maintenance

Skills should be updated when:
- Project patterns change
- New conventions are adopted
- New helper utilities are created
- Business requirements change

Skills are stored in `.claude/skills/` and shared via git with the team.
