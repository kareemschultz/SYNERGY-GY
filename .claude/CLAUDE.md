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

## 🚀 Production Status & Development Workflow

> **CONTEXT FOR ALL AGENTS** - App is deployed to production. Use `develop` branch for new work.

### Current Status
**Status:** ✅ **DEPLOYED TO PRODUCTION** - App is live, staff adding data
**GHCR Image:** `ghcr.io/kareemschultz/gk-nexus:latest`

### Branch Workflow (IMPORTANT)

```
master (production)     ← What's deployed, image on GHCR
  └── develop           ← Active development (work here!)
```

**Daily workflow:**
1. Work on `develop` branch
2. Test locally with `docker compose -f docker-compose.local.yml up --build`
3. When ready, merge to `master` (triggers GHCR publish + production update)

### Updating Production

**After merging to master, on production server:**
```bash
# Pull and restart (preserves data volumes)
docker compose pull && docker compose up -d

# Verify health
curl http://localhost:3000/health
```

**If schema changes, run migrations first:**
```bash
DATABASE_URL="postgresql://..." bun run db:push
```

### Implementation Phases (Status)

| Phase | Status |
|-------|--------|
| Phase 1: Docker Optimization | ✅ COMPLETE |
| Phase 2: CI/CD Pipeline | ✅ COMPLETE |
| Phase 3: Routing & UX Fixes | ✅ COMPLETE |
| Phase 4: Documentation | 🚧 IN PROGRESS |
| Phase 5: Knowledge Base | ⏳ Pending |
| Phase 6: Backup Testing | ✅ COMPLETE |
| Phase 7: Production Deployment | ✅ DEPLOYED |

### Development Guidelines

#### Before Making Changes:
1. **Ensure on `develop` branch** - Never commit directly to master
2. **Test with Docker** - Run `docker compose -f docker-compose.local.yml up --build`

#### Critical Principles:
1. **NO MOCK DATA** - Never create seed data or placeholder content
2. **Docker security** - Maintain non-root user, read-only filesystem
3. **Code quality** - Run `npx ultracite fix` before ALL commits

#### oRPC + TanStack Query Patterns:
1. **For queries (reading data)**: Use `orpc.xxx.useQuery()`
   ```typescript
   const { data } = orpc.clients.list.useQuery({ limit: 10 });
   ```

2. **For mutations (creating/updating)**: Use `useMutation` from @tanstack/react-query with `client`
   ```typescript
   import { useMutation } from "@tanstack/react-query";
   import { client } from "@/utils/orpc";

   const mutation = useMutation({
     mutationFn: (input) => client.clients.create(input),
   });
   ```

3. **For nested routers**: NEVER use `orpc.nested.sub.useMutation()` - it doesn't work with nested objects
   ```typescript
   // ❌ WRONG - won't work with nested routers
   const mutation = orpc.portal.impersonation.start.useMutation();

   // ✅ CORRECT - use useMutation with client directly
   const mutation = useMutation({
     mutationFn: (input) => client.portal.impersonation.start(input),
   });
   ```

4. **Unwrap responses**: oRPC v1.12+ wraps responses in `{ json: T }` envelope
   ```typescript
   import { unwrapOrpc } from "@/utils/orpc-response";

   const { data: dataRaw } = useQuery({ ... });
   const data = unwrapOrpc<MyType>(dataRaw);
   ```

#### What NOT to Do:
- ❌ Don't commit directly to master (use develop → staging → master)
- ❌ Don't create mock data or seed scripts
- ❌ Don't skip Docker testing before merging

---
