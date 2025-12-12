---
name: change-tracking
description: Follow GK-Nexus documentation and git workflow requirements. Use when committing code, creating PRs, updating CHANGELOG, or documenting changes. Triggers on: commit, changelog, PR, release, documentation, git, version.
---

# Change Tracking Requirements (MANDATORY)

## Overview
Every change to the GK-Nexus codebase MUST be properly tracked and documented. This ensures data integrity and maintainability.

## Before Making Changes

1. **Check for existing GitHub issue**
   - Search issues for related work
   - If none exists, create one first

2. **Reference issue in all work**
   - Commits: `feat(scope): description (#123)`
   - PR title: `feat(scope): description (#123)`

## CHANGELOG.md Format

Location: `/CHANGELOG.md`

### Adding Entries
Add under `## [Unreleased]` section:

```markdown
## [Unreleased]

### Added
- **Feature Name** - Brief description of new functionality (#issue)
  - Sub-detail if needed
  - Another sub-detail

### Changed
- **What Changed** - Description of modification (#issue)

### Fixed
- **Bug Name** - What was fixed and why (#issue)

### Removed
- **Removed Feature** - Why it was removed (#issue)

### Security
- **Security Fix** - Description of security improvement (#issue)

### Deprecated
- **Deprecated Feature** - What and why (#issue)
```

### Example Entry
```markdown
### Added
- **Appointment Management System** - Complete scheduling infrastructure (#45)
  - Database schema: appointmentType, staffAvailability, appointment tables
  - API router with full CRUD, confirm, cancel, reschedule endpoints
  - Status workflow: REQUESTED → CONFIRMED → COMPLETED
```

## Commit Message Format

### Structure
```
type(scope): description (#issue)

[optional body]
[optional footer]
```

### Types
| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting (no code change) |
| `refactor` | Code change (no new feature or fix) |
| `test` | Adding tests |
| `chore` | Maintenance tasks |
| `perf` | Performance improvement |

### Scopes (GK-Nexus specific)
- `clients` - Client management
- `matters` - Matter/case tracking
- `documents` - Document management
- `portal` - Client portal
- `invoices` - Invoicing system
- `appointments` - Appointment scheduling
- `training` - Training module
- `admin` - Admin panel
- `auth` - Authentication
- `db` - Database schema
- `api` - API routers
- `ui` - Frontend components

### Examples
```bash
feat(clients): add bulk import functionality (#45)
fix(portal): resolve session timeout issue (#52)
docs(specs): update client portal implementation status
refactor(api): extract common validation logic
test(invoices): add e2e tests for payment flow
chore(deps): update TanStack Query to v5
```

## Spec Documentation Updates

### When to Update
- New features → Create/update feature spec
- API changes → Update API docs
- Schema changes → Update database docs
- UI changes → Update component docs

### Locations
```
specs/
├── phase-1/           # Phase 1 features
├── phase-2/           # Phase 2 features
│   ├── 00-overview.md
│   ├── 01-client-portal.md
│   └── ...
├── phase-3/           # Future features
├── implementations/   # Implementation summaries
├── business-rules/    # Business logic docs
├── api-patterns.md    # API conventions
└── design-system.md   # UI guidelines
```

### Updating Feature Spec Status
```markdown
## Implementation Status

| Component | Status | Notes |
|-----------|--------|-------|
| Database Schema | ✅ Complete | Tables created |
| API Router | ✅ Complete | All endpoints working |
| Staff UI | ⏳ Pending | Design complete |
| Portal UI | ⏳ Pending | Not started |
```

## Pull Request Requirements

### Title Format
```
type(scope): description (#issue)
```

### Body Template
```markdown
## Summary
Brief description of changes.

## Changes
- Change 1
- Change 2

## Testing
- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] Manual testing done

## Checklist
- [ ] CHANGELOG updated
- [ ] Specs updated (if applicable)
- [ ] Types are correct (no `any`)
- [ ] Linting passes (`npx ultracite check`)
```

### Link to Issue
Always include `Closes #123` or `Fixes #123` in PR body.

## Git Workflow

### Branch Naming
```
feature/issue-number-description
fix/issue-number-description
docs/issue-number-description
```

Examples:
```
feature/45-bulk-client-import
fix/52-portal-session-timeout
docs/60-api-documentation
```

### Commit Best Practices
1. **Atomic commits** - One logical change per commit
2. **Present tense** - "add feature" not "added feature"
3. **Imperative mood** - "fix bug" not "fixes bug"
4. **Reference issues** - Always include (#issue)

## Critical Rules

1. **NEVER commit without issue reference**
2. **ALWAYS update CHANGELOG for features/fixes**
3. **ALWAYS update specs for feature changes**
4. **Use conventional commits format**
5. **Run linting before commit** - `npx ultracite fix`
6. **Keep commits atomic** - One change per commit
