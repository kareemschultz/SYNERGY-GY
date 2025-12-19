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

---

## oRPC + TanStack Query Patterns

> **CRITICAL KNOWLEDGE** - This project uses oRPC with TanStack Query. These patterns are essential.

### The Problem: 3-Level Nested oRPC Paths

`createTanstackQueryUtils` from oRPC **does NOT support** 3-level nested paths. This causes "useQuery is not a function" errors.

**Broken Pattern (DO NOT USE):**
```typescript
// ❌ This fails with "useQuery is not a function"
orpc.clientServices.getFulfillmentProgress.useQuery({ clientId })
orpc.knowledgeBase.delete.useMutation({ ... })
```

**Working Pattern (USE THIS):**
```typescript
// ✅ Use useQuery/useMutation from @tanstack/react-query directly
import { useQuery, useMutation } from "@tanstack/react-query";
import { client } from "@/utils/orpc";

// For queries:
const { data } = useQuery({
  queryKey: ["clientServices", "getFulfillmentProgress", clientId],
  queryFn: () => client.clientServices.getFulfillmentProgress({ clientId }),
});

// For mutations:
const mutation = useMutation({
  mutationFn: (input: { id: string }) => client.knowledgeBase.delete(input),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["knowledgeBase"] });
  },
});
```

### When Each Pattern Works

| Pattern | Levels | Example | Works? |
|---------|--------|---------|--------|
| `orpc.clients.list.useQuery()` | 2 | `clients.list` | ✅ Yes |
| `orpc.clientServices.getByClient.useQuery()` | 3 | `clientServices.getByClient` | ❌ No |
| `orpc.documents.templates.list.useQuery()` | 3 | `documents.templates.list` | ❌ No |

### Quick Reference

```typescript
// Import from @tanstack/react-query
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Import client (NOT orpc) from utils
import { client, queryClient } from "@/utils/orpc";

// Use client.xxx.yyy() for API calls
// Use queryClient.invalidateQueries() for cache invalidation
```

### Development Guidelines

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

---

## API & Backend Patterns

### oRPC Error Handling

**Correct pattern:**
```typescript
throw new ORPCError("NOT_FOUND", {
  message: "Resource not found",
});
```

**Incorrect pattern (DO NOT USE):**
```typescript
// WRONG - code should be first argument, not in object
throw new ORPCError({
  code: "NOT_FOUND",
  message: "Resource not found",
});
```

**Standard error codes:**
- `NOT_FOUND` - Resource doesn't exist (404)
- `UNAUTHORIZED` - User not authenticated (401)
- `FORBIDDEN` - User lacks permission (403)
- `BAD_REQUEST` - Invalid input/validation error (400)
- `CONFLICT` - Resource already exists (409)

### Context Access in Handlers

**Correct pattern:**
```typescript
.handler(async ({ input, context }) => {
  const userId = context.session?.user?.id;
  if (!userId) {
    throw new ORPCError("UNAUTHORIZED", {
      message: "User not authenticated",
    });
  }
  // Use userId...
});
```

**Incorrect patterns (DO NOT USE):**
```typescript
// WRONG - context.user doesn't exist, use context.session?.user
context.user.id

// WRONG - ctx doesn't exist, use context
context.ctx.session
```

### Schema Field Matching

Always verify schema fields match before using in queries:
- Check `packages/db/src/schema/*.ts` for actual column names
- Common mistakes:
  - `notes` vs `riskNotes` (use actual schema field)
  - `business` vs `businesses` (use actual schema field)
  - Missing fields like `city`, `country` that don't exist

### Enum Values in Zod

When using enums that map to database enums, use `z.enum()` with the exact values:

```typescript
// Define enum values matching database
const pepRelationshipValues = ["FAMILY_MEMBER", "SELF", "CLOSE_ASSOCIATE"] as const;

// Use in Zod schema
pepRelationship: z.enum(pepRelationshipValues).optional()
```

**Avoid:** Using `z.string()` when the database expects specific enum values.

---

## Frontend Patterns

### TanStack Query Configuration

**Correct cache configuration:**
```typescript
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,        // 30 seconds - data fresh
      gcTime: 5 * 60 * 1000,       // 5 minutes - garbage collection
      refetchOnWindowFocus: true,  // Refetch on tab focus
      retry: 1,                    // Retry failed requests once
    },
  },
  // ... queryCache
});
```

Without these defaults, users need to use incognito mode to see data changes.

### Devtools in Production

**Correct pattern:**
```tsx
{import.meta.env.DEV && (
  <>
    <TanStackRouterDevtools position="bottom-left" />
    <ReactQueryDevtools buttonPosition="bottom-right" />
  </>
)}
```

**Never** render devtools unconditionally - they will appear in production.

### Navigation After Auth

Use `/app` as the authenticated layout root, not `/dashboard`:
```typescript
navigate({ to: "/app" });  // Correct
navigate({ to: "/dashboard" });  // Wrong
```

### Client vs orpc Imports

- **`client`**: Raw oRPC client for direct async calls (await/async)
- **`orpc`**: TanStack Query utilities for React hooks

```typescript
import { client, orpc } from "@/utils/orpc";

// Use `client` for imperative calls (outside React hooks)
const handleDownload = async (id: string) => {
  const result = await client.documents.download({ id });
};

// Use `orpc` with React Query hooks
const { data } = useQuery(orpc.documents.list.queryOptions());
```

### DocumentCategory Enum

DocumentCategory must match database enum exactly:

```typescript
// Database enum (packages/db/src/schema/documents.ts):
type DocumentCategory =
  | "IDENTITY"
  | "TAX"
  | "FINANCIAL"
  | "LEGAL"
  | "IMMIGRATION"
  | "BUSINESS"
  | "CORRESPONDENCE"
  | "TRAINING"
  | "OTHER";

// WRONG - These values don't exist in database
// "IDENTIFICATION", "TAX_FILING", "NIS", "CERTIFICATE", "AGREEMENT"
```

### Error Handling in Mutations

Always type error handlers properly:

```typescript
const mutation = useMutation({
  ...orpc.xxx.mutationOptions(),
  onSuccess: (data) => {
    // data is typed from API response
    toast.success("Success");
  },
  onError: (error: Error) => {
    // Always type as Error
    toast.error(error.message);
  },
});
```

For imperative async calls, use try-catch:
```typescript
try {
  const result = await client.xxx({ input });
} catch (e: unknown) {
  const message = e instanceof Error ? e.message : "Unknown error";
  toast.error(message);
}
```

---

## Server Configuration

### CORS Configuration

**Production-safe pattern:**
```typescript
const CORS_ORIGIN = process.env.CORS_ORIGIN;
if (!CORS_ORIGIN && process.env.NODE_ENV === "production") {
  throw new Error("CORS_ORIGIN must be set in production");
}

cors({
  origin: (origin) => {
    if (process.env.NODE_ENV !== "production") {
      if (!origin || origin.startsWith("http://localhost")) return true;
    }
    const allowedOrigins = CORS_ORIGIN?.split(",").map((o) => o.trim()) || [];
    return allowedOrigins.includes(origin || "");
  },
  credentials: true,
});
```

**Never** use empty string as default CORS origin in production.

### Hono Request Headers

**Correct pattern:**
```typescript
// Use .header() method, not .headers property
const authHeader = context.req.header("Authorization");
```

**Incorrect:**
```typescript
// WRONG - .headers doesn't exist on HonoRequest
context.req.headers.get("Authorization");
```

---

## Database Patterns

### Drizzle ORM Date Comparisons

When comparing dates, ensure type compatibility:
```typescript
// For date columns that return strings
const todayStr = new Date().toISOString().split("T")[0];
where: gte(table.dateColumn, todayStr)

// For timestamp columns that return Date objects
where: gte(table.timestampColumn, new Date())
```

### Optional Query Results

Always handle potentially undefined results:
```typescript
// Check for undefined before accessing properties
const [{ count: totalCount }] = await db.select(...);
// Use: totalCount || 0

// Or use optional chaining
result?.count ?? 0
```

---

## Frontend Type Patterns

### Client Onboarding Wizard Types

The `ClientOnboardingData` type uses a **flat structure** (not nested). Fields are at the top level:

```typescript
// CORRECT - flat structure
data.firstName
data.lastName
data.email
data.phone
data.address
data.city

// WRONG - nested structure doesn't exist
data.basicInfo.firstName
data.contactInfo.email
data.contactInfo.address.street
```

**Optional nested objects** (like `employment`, `amlCompliance`, `emergencyContact`) have all fields optional to allow partial updates:

```typescript
// Type definition pattern
employment?: {
  status?: "EMPLOYED" | "SELF_EMPLOYED" | "UNEMPLOYED" | "RETIRED" | "STUDENT" | "";
  employerName?: string;
  // ... all fields optional
};

amlCompliance?: {
  sourceOfFunds?: string[];  // Optional, not required
  isPep?: boolean;           // Optional, not required
  // ...
};
```

### Type Safety for Partial Updates

When updating nested state objects, spread the existing value safely:

```typescript
// Safe pattern for partial updates
onChange={(value) =>
  onUpdate({
    employment: {
      ...data.employment,
      status: value,
    },
  })
}

// For conditional rendering with unknown types, use ternary
{log.metadata ? (
  <div>{JSON.stringify(log.metadata as Record<string, unknown>)}</div>
) : null}

// NOT: {log.metadata && (...)} - unknown type causes error
```

### DocumentCategory Enum Values

**Valid values:**
- `IDENTITY` - ID documents (passport, national ID)
- `TAX` - Tax-related documents
- `FINANCIAL` - Bank statements, financial records
- `LEGAL` - Agreements, contracts, affidavits
- `IMMIGRATION` - Visas, work permits
- `BUSINESS` - Business registration, certificates
- `CORRESPONDENCE` - Letters, communications
- `TRAINING` - Training certificates
- `OTHER` - Everything else

**Invalid values (DO NOT USE):**
- `IDENTIFICATION` - Use `IDENTITY`
- `TAX_FILING` - Use `TAX`
- `NIS` - Use `OTHER`
- `CERTIFICATE` - Use `BUSINESS`
- `AGREEMENT` - Use `LEGAL`

### WizardStep Component

**Accepted props:**
```typescript
type WizardStepProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};
```

**Props that DO NOT exist:**
- `icon` - Removed, do not pass

### oRPC Direct Calls vs Query Hooks

```typescript
// Direct API call - use client (no .query())
await client.serviceCatalog.services.getById({ id })

// NOT: client.serviceCatalog.services.getById.query({ id })

// React Query hook - use orpc with queryOptions
useQuery(orpc.serviceCatalog.services.list.queryOptions({ input: {...} }))
```

### Handling Undefined Values in JSX

```typescript
// Handle undefined before passing to functions
onClick={() => itemDetails?.id && handleDownload(itemDetails.id)}

// Add disabled state for safety
disabled={!itemDetails?.id}
```

---

## Docker & Deployment Patterns

### Shell Scripts in Docker

**NEVER** use shell scripts (`*.sh`) for operations inside Docker containers. They may work locally but fail in production.

**Why shell scripts fail in Docker:**
- Container may not have bash installed
- Scripts directory may not be copied in Dockerfile
- Running `docker` commands from inside a container doesn't work
- Shell script dependencies may not exist

**Solution:** Use Node.js utilities instead of shell scripts:
```typescript
// ✅ Use Node.js backup utility (works inside containers)
const { createBackup } = await import("./utils/backup-utility");
const result = await createBackup(backupName);
```

**Backup Utility Location:** `/packages/api/src/utils/backup-utility.ts`
- Uses Drizzle ORM for data export (no external dependencies)
- Creates compressed JSON backups with `node:zlib`
- Works inside the Docker container

---

## Biome Linting Patterns

### noLeakedRender False Positives

Biome's `lint/nursery/noLeakedRender` may flag false positives for ternaries inside callbacks (not actual renders).

**Problem:**
```typescript
// Biome complains about potential leaked render (false positive)
onValueChange={(value) =>
  setFilters({
    clientId: value === "all" ? undefined : value,  // Flagged!
  })
}
```

**Solution - use if/else instead:**
```typescript
// ✅ Use if/else to avoid the false positive
onValueChange={(value) => {
  if (value === "all") {
    setFilters({ ...filters, clientId: undefined });
  } else {
    setFilters({ ...filters, clientId: value });
  }
}}
```

### Import Source Corrections

When imports fail with "Export not found", check the actual export location:
- `staff` is in `packages/db/src/schema/core.ts`, NOT `auth.ts`
- `user` is in `packages/db/src/schema/auth.ts`

---

## API Schema vs Implementation

### Filter Schema ≠ Filter Implementation

Just because an API schema accepts a filter parameter doesn't mean the query uses it!

**Example - Reports router:**
```typescript
// Schema accepts clientId
const executeReportSchema = z.object({
  filters: z.object({
    clientId: z.string().optional(),  // Schema accepts it
  }).optional(),
});

// BUT the query must actually USE it:
if (input.filters?.clientId) {
  conditions.push(eq(matter.clientId, input.filters.clientId));
}
```

**Always verify:** When adding UI filters, check both:
1. API schema accepts the parameter
2. Query logic actually uses it

---

## Anti-Patterns to Avoid

| Anti-Pattern | Correct Approach |
|-------------|------------------|
| `throw new ORPCError({ code: "...", message: "..." })` | `throw new ORPCError("CODE", { message: "..." })` |
| `context.user.id` | `context.session?.user?.id` |
| `context.ctx.session` | `context.session` |
| `req.headers.get()` | `req.header()` |
| `notes` (when schema has `riskNotes`) | Check actual schema field name |
| CORS origin: `""` in production | Require explicit `CORS_ORIGIN` env var |
| Devtools always rendered | Gate with `import.meta.env.DEV` |
| No QueryClient defaults | Set `staleTime` and `gcTime` |
| Unused variables | Prefix with `_` or remove |
| `data.basicInfo.firstName` | `data.firstName` (flat structure) |
| `client.xxx.query({...})` | `client.xxx({...})` (no .query()) |
| `WizardStep icon={...}` | Remove icon prop |
| `{value && <div>...}` for unknown | `{value ? <div>... : null}` |
| `orpc.nested.sub.useMutation()` | `useMutation({ mutationFn: () => client.nested.sub() })` |
| Shell scripts (`*.sh`) in Docker | Use Node.js utilities instead |
| Ternary in callbacks (noLeakedRender) | Use if/else statements |
| `import { staff } from "./schema/auth"` | `import { staff } from "./schema/core"` |
| Schema accepts filter but query ignores | Add filter logic to actual query |
