# Ultracite Code Standards

This project uses **Ultracite**, a zero-config Biome preset that enforces strict code quality standards through automated formatting and linting.

## Quick Reference

- **Format code**: `npx ultracite fix`
- **Check for issues**: `npx ultracite check`
- **Diagnose setup**: `npx ultracite doctor`

Biome (the underlying engine) provides extremely fast Rust-based linting and formatting. Most issues are automatically fixable.

---

## Core Principles

Write code that is **accessible, performant, type-safe, and maintainable**. Focus on clarity and explicit intent over brevity.

### Type Safety & Explicitness

- Use explicit types for function parameters and return values when they enhance clarity
- Prefer `unknown` over `any` when the type is genuinely unknown
- Use const assertions (`as const`) for immutable values and literal types
- Leverage TypeScript's type narrowing instead of type assertions
- Use meaningful variable names instead of magic numbers - extract constants with descriptive names

### Modern JavaScript/TypeScript

- Use arrow functions for callbacks and short functions
- Prefer `for...of` loops over `.forEach()` and indexed `for` loops
- Use optional chaining (`?.`) and nullish coalescing (`??`) for safer property access
- Prefer template literals over string concatenation
- Use destructuring for object and array assignments
- Use `const` by default, `let` only when reassignment is needed, never `var`

### Async & Promises

- Always `await` promises in async functions - don't forget to use the return value
- Use `async/await` syntax instead of promise chains for better readability
- Handle errors appropriately in async code with try-catch blocks
- Don't use async functions as Promise executors

### React & JSX

- Use function components over class components
- Call hooks at the top level only, never conditionally
- Specify all dependencies in hook dependency arrays correctly
- Use the `key` prop for elements in iterables (prefer unique IDs over array indices)
- Nest children between opening and closing tags instead of passing as props
- Don't define components inside other components
- Use semantic HTML and ARIA attributes for accessibility:
  - Provide meaningful alt text for images
  - Use proper heading hierarchy
  - Add labels for form inputs
  - Include keyboard event handlers alongside mouse events
  - Use semantic elements (`<button>`, `<nav>`, etc.) instead of divs with roles

### Error Handling & Debugging

- Remove `console.log`, `debugger`, and `alert` statements from production code
- Throw `Error` objects with descriptive messages, not strings or other values
- Use `try-catch` blocks meaningfully - don't catch errors just to rethrow them
- Prefer early returns over nested conditionals for error cases

### Code Organization

- Keep functions focused and under reasonable cognitive complexity limits
- Extract complex conditions into well-named boolean variables
- Use early returns to reduce nesting
- Prefer simple conditionals over nested ternary operators
- Group related code together and separate concerns

### Security

- Add `rel="noopener"` when using `target="_blank"` on links
- Avoid `dangerouslySetInnerHTML` unless absolutely necessary
- Don't use `eval()` or assign directly to `document.cookie`
- Validate and sanitize user input

### Performance

- Avoid spread syntax in accumulators within loops
- Use top-level regex literals instead of creating them in loops
- Prefer specific imports over namespace imports
- Avoid barrel files (index files that re-export everything)
- Use proper image components (e.g., Next.js `<Image>`) over `<img>` tags

### Framework-Specific Guidance

**Next.js:**
- Use Next.js `<Image>` component for images
- Use `next/head` or App Router metadata API for head elements
- Use Server Components for async data fetching instead of async Client Components

**React 19+:**
- Use ref as a prop instead of `React.forwardRef`

**Solid/Svelte/Vue/Qwik:**
- Use `class` and `for` attributes (not `className` or `htmlFor`)

---

## Testing

- Write assertions inside `it()` or `test()` blocks
- Avoid done callbacks in async tests - use async/await instead
- Don't use `.only` or `.skip` in committed code
- Keep test suites reasonably flat - avoid excessive `describe` nesting

## When Biome Can't Help

Biome's linter will catch most issues automatically. Focus your attention on:

1. **Business logic correctness** - Biome can't validate your algorithms
2. **Meaningful naming** - Use descriptive names for functions, variables, and types
3. **Architecture decisions** - Component structure, data flow, and API design
4. **Edge cases** - Handle boundary conditions and error states
5. **User experience** - Accessibility, performance, and usability considerations
6. **Documentation** - Add comments for complex logic, but prefer self-documenting code

---

Most formatting and common issues are automatically fixed by Biome. Run `npx ultracite fix` before committing to ensure compliance.

---

## GK-Nexus Project Rules

> These rules are MANDATORY for all development on this project.

### Change Tracking
1. **Always reference GitHub issues** - Every change must link to an issue
2. **Update CHANGELOG.md** - Add entries under [Unreleased] for any feature/fix
3. **Use conventional commits** - `type(scope): description (#issue)`

### Before Making Changes
1. Check if a GitHub issue exists for the task
2. If not, suggest creating one first
3. Reference issue number in commits

### Documentation Requirements
- Update `/specs/` for feature changes
- Update API docs for endpoint changes
- Keep CHANGELOG.md current

### Code Quality
- Run `npx ultracite fix` before committing
- No `any` types
- Explicit error handling with user-friendly messages
- Loading and error states for all UI

### GitHub Workflow
- Branch naming: `feature/issue-number-description`
- PR must link to issue
- CHANGELOG entry required

### Error Handling
- Always provide user-friendly error messages
- Explain WHY something failed
- Suggest next steps for user

---

## 🚀 ACTIVE: Production Deployment Implementation

> **CRITICAL CONTEXT FOR ALL AGENTS** - We are actively implementing production deployment. Read this section before making ANY changes.

### Current Status
**Plan:** `gk-nexus-production-deployment` (Jan 15, 2025)
**Location:** `~/.claude/plans/gk-nexus-production-deployment.md`
**Spec:** `/specs/implementations/PRODUCTION_DEPLOYMENT.md`
**Status:** 🚧 Phase 1 in progress
**Priority:** CRITICAL - Production deployment is the top priority

### Project Intent & Goals
Transform GK-Nexus from development to production-ready by:
1. **Optimizing Docker deployment** - Turbo prune + BuildKit caching for fast builds (<5min) and small images (<300MB)
2. **Automating CI/CD** - GitHub Actions for automated builds, testing, and GHCR publishing
3. **Improving UX** - Smart routing, authentication flow, loading states
4. **Creating documentation** - DEPLOYMENT.md, SECURITY.md, architecture diagrams, screenshots
5. **Building knowledge base** - 30+ pages in Starlight for services, forms, guides, training materials
6. **Testing backup system** - Validate the backup/restore implementation (commit 560f8f1)
7. **Deploying to production** - Live deployment with SSL, monitoring, automated backups

### 7 Implementation Phases

| Phase | Status | GitHub Issue | Priority |
|-------|--------|--------------|----------|
| Phase 1: Docker Optimization | 🚧 IN PROGRESS | [#PROD-001] | CRITICAL |
| Phase 2: CI/CD Pipeline | ⏳ Pending | [#PROD-002] | CRITICAL |
| Phase 3: Routing & UX Fixes | ✅ COMPLETE | [#PROD-003] | HIGH |
| Phase 4: Documentation | ⏳ Pending | [#PROD-004] | MEDIUM |
| Phase 5: Knowledge Base | ⏳ Pending | [#PROD-005] | MEDIUM |
| Phase 6: Backup Testing | ⏳ Pending | [#PROD-006] | HIGH |
| Phase 7: Production Deployment | ⏳ Pending | [#PROD-007] | CRITICAL |

### MANDATORY Instructions for All Agents

#### Before Making ANY Changes:
1. **Read the plan** - Check `~/.claude/plans/gk-nexus-production-deployment.md` for full context
2. **Check current phase** - See which phase is active in `/specs/implementations/PRODUCTION_DEPLOYMENT.md`
3. **Verify GitHub issue** - Ensure your work aligns with an existing issue ([#PROD-001] through [#PROD-007])
4. **Check CHANGELOG** - Review recent changes under `[Unreleased]` section

#### While Making Changes:
1. **ALWAYS log changes** in CHANGELOG.md under `[Unreleased]` → `In Progress` or `Added`/`Changed`/`Fixed`
2. **Reference GitHub issues** in commit messages: `type(scope): description (#PROD-XXX)`
3. **Update spec document** - Mark tasks complete in `/specs/implementations/PRODUCTION_DEPLOYMENT.md` as you finish them
4. **Follow the plan** - Don't deviate from the approved implementation plan without user approval
5. **Test thoroughly** - Each phase has a testing checklist - complete it before moving on
6. **Document decisions** - If you make architectural choices, document them in the spec or plan

#### Critical Principles to Follow:
1. **NO MOCK DATA** - Never create seed data, placeholder content, or demo records (see CLAUDE.md policy)
2. **Docker security** - All Docker configs must use: non-root user, read-only filesystem, dropped capabilities, no-new-privileges
3. **BuildKit optimization** - Use cache mounts for `/root/.bun` and `/root/.cache/turbo`
4. **Turbo prune** - Always use `bunx turbo prune --scope=server --docker` for minimal build context
5. **Health checks** - All Docker containers must have working health checks at `/health`
6. **Code quality** - Run `npx ultracite fix` before ALL commits
7. **Type safety** - No `any` types, use `unknown` for genuinely unknown types
8. **Error handling** - User-friendly messages explaining WHY and suggesting next steps

#### What NOT to Do:
- ❌ Don't skip phases or tasks without user approval
- ❌ Don't create files not specified in the plan
- ❌ Don't modify Dockerfile without using the optimized version from the plan
- ❌ Don't push to production without completing testing checklists
- ❌ Don't create commits without updating CHANGELOG.md
- ❌ Don't make changes without checking if a GitHub issue exists
- ❌ Don't break existing functionality - test after each change
- ❌ Don't ignore security hardening requirements

#### Files Currently Being Created/Modified (Phase 1):
- `.dockerignore` (NEW) - Reduce build context
- `Dockerfile.prod` (REPLACE) - Optimized multi-stage build with Turbo prune
- `docker-compose.prod.yml` (MODIFY) - Add security hardening (read-only, cap_drop, etc.)
- `scripts/verify-docker-build.sh` (NEW) - Local verification script
- `CHANGELOG.md` (MODIFY) - Log all changes
- `/specs/implementations/PRODUCTION_DEPLOYMENT.md` (MODIFY) - Update task completion

#### Success Criteria (Must Meet Before Production):
- ✅ Docker image builds in <5 minutes
- ✅ Image size <300MB
- ✅ Application starts in <60 seconds
- ✅ Health check responds in <1 second
- ✅ CI/CD pipeline passes all verification tests
- ✅ All routes accessible and render correctly
- ✅ Backup/restore tested and verified
- ✅ Documentation complete (DEPLOYMENT.md, SECURITY.md, diagrams)
- ✅ Zero security vulnerabilities

### Quick Reference Links
- **Full Plan:** `~/.claude/plans/gk-nexus-production-deployment.md` (125KB, all implementation details)
- **Spec Document:** `/specs/implementations/PRODUCTION_DEPLOYMENT.md` (this gets updated as we complete tasks)
- **CHANGELOG:** Track progress in CHANGELOG.md under `[Unreleased]`
- **GitHub Issues:** Create/track at https://github.com/kareemschultz/SYNERGY-GY/issues

### Communication Protocol
If you're unsure about ANY aspect of the implementation:
1. Ask the user for clarification
2. Reference the specific section of the plan
3. Explain the trade-offs or options
4. Wait for user approval before proceeding

**DO NOT** make assumptions or deviate from the plan without explicit user approval.

---
