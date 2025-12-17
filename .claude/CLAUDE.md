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

### oRPC TanStack Query Integration

The @orpc/tanstack-query package provides `.queryOptions()` and `.mutationOptions()` helpers, NOT hooks directly.

**Correct patterns:**
```typescript
import { useMutation, useQuery } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";

// Simple query - no input
const { data } = useQuery(orpc.healthCheck.queryOptions());

// Query with input
const { data } = useQuery(
  orpc.knowledgeBase.list.queryOptions({
    input: { search: "foo", limit: 20 },
  })
);

// Query with enabled condition
const { data } = useQuery({
  ...orpc.knowledgeBase.getById.queryOptions({
    input: { id: itemId! },
  }),
  enabled: !!itemId,
});

// Mutation with callbacks
const mutation = useMutation({
  ...orpc.knowledgeBase.download.mutationOptions(),
  onSuccess: () => {
    toast.success("Download started");
  },
  onError: (error: Error) => {
    toast.error(error.message);
  },
});
```

**Incorrect patterns (DO NOT USE):**
```typescript
// WRONG - .useQuery() doesn't exist on orpc utils
orpc.knowledgeBase.list.useQuery({ search: "foo" });

// WRONG - .useMutation() doesn't exist on orpc utils
orpc.knowledgeBase.download.useMutation({ onSuccess: ... });
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
