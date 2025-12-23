# API Patterns Reference

This document captures the correct patterns for working with oRPC and TanStack Query in this codebase. These patterns were discovered and verified during Phase 2 development.

## Table of Contents

1. [Backend oRPC Router Patterns](#backend-orpc-router-patterns)
2. [Frontend API Call Patterns](#frontend-api-call-patterns)
3. [Zod Schema Patterns](#zod-schema-patterns)
4. [Common TypeScript Fixes](#common-typescript-fixes)

---

## Backend oRPC Router Patterns

### Correct Pattern

Routers are **plain objects** with procedures. Use `.handler()` method for the implementation.

```typescript
// packages/api/src/routers/example.ts
import { z } from "zod";
import { protectedProcedure, staffProcedure } from "../procedures";

export const exampleRouter = {
  // Flat method names (NOT nested)
  listItems: staffProcedure
    .input(
      z.object({
        search: z.string().optional(),
        page: z.number().optional(),
      })
    )
    .handler(async ({ input, context }) => {
      // Implementation
      return items;
    }),

  getItem: staffProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      // Implementation
      return item;
    }),

  createItem: staffProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
      })
    )
    .handler(async ({ input, context }) => {
      // Implementation
      return newItem;
    }),
};
```

### Incorrect Patterns (DO NOT USE)

```typescript
// WRONG - Don't use router() function
export const exampleRouter = router({
  listItems: publicProcedure.query(async () => {}),
});

// WRONG - Don't use .query() or .mutation()
export const exampleRouter = {
  listItems: staffProcedure.query(async () => {}),
  createItem: staffProcedure.mutation(async () => {}),
};

// WRONG - Don't use nested method names
export const exampleRouter = {
  items: {
    list: staffProcedure.handler(async () => {}),
    create: staffProcedure.handler(async () => {}),
  },
};
```

### Method Naming Convention

Use flat, descriptive method names:
- `listCourses` (not `courses.list`)
- `getCourse` (not `courses.get`)
- `createCourse` (not `courses.create`)
- `updateEnrollment` (not `enrollments.update`)
- `calculatePaye` (not `calculate.paye`)

---

## Frontend API Call Patterns

### Two Exports from `@/utils/orpc`

```typescript
import { client, orpc } from "@/utils/orpc";
```

- **`client`**: Direct API calls - use inside `useQuery`/`useMutation` hooks
- **`orpc`**: TanStack Query utilities - DO NOT use for direct `.query()`/`.mutate()` calls

### Correct Patterns

#### Queries (Data Fetching)

```typescript
import { useQuery } from "@tanstack/react-query";
import { client } from "@/utils/orpc";

function MyComponent() {
  const { data, isLoading } = useQuery({
    queryKey: ["items", { search, page }],
    queryFn: () => client.example.listItems({ search, page }),
  });
}
```

#### Mutations (Data Modification)

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/utils/orpc";

function MyComponent() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      client.example.createItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      toast({ title: "Item created" });
    },
    onError: (error) => {
      toast({
        title: "Failed to create item",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    },
  });
}
```

### Incorrect Patterns (DO NOT USE)

```typescript
// WRONG - Don't use orpc with .useMutation()
const mutation = orpc.example.createItem.useMutation();

// WRONG - Don't use .query() or .mutate() directly on orpc
const data = await orpc.example.listItems.query({});
const result = await orpc.example.createItem.mutate({});

// WRONG - Don't use loaders with orpc
export const Route = createFileRoute("/app/items")({
  loader: async () => {
    // This pattern doesn't work in this codebase
    return await orpc.example.listItems.query({});
  },
});
```

### Complete Component Example

```typescript
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { client } from "@/utils/orpc";

export const Route = createFileRoute("/app/items")({
  component: ItemsPage,
});

function ItemsPage() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  // Query for fetching data
  const { data: items, isLoading } = useQuery({
    queryKey: ["items", { search }],
    queryFn: () => client.example.listItems({ search: search || undefined }),
  });

  // Mutation for creating data
  const createMutation = useMutation({
    mutationFn: (data: { name: string }) => client.example.createItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {items?.map((item) => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
}
```

---

## Zod Schema Patterns

### z.record() Requires Key and Value Types

```typescript
// CORRECT - Specify both key and value types
z.record(z.string(), z.string())      // Record<string, string>
z.record(z.string(), z.unknown())     // Record<string, unknown>

// WRONG - Will cause "Expected 2-3 arguments" error
z.record(z.string())   // Missing value type
z.record(z.unknown())  // Missing key type
```

### Optional vs Nullable

```typescript
// Use undefined for optional fields
description: z.string().optional()  // string | undefined

// Avoid null in input schemas - prefer undefined
// CORRECT
description: z.string().optional()

// AVOID in most cases
description: z.string().nullable()  // string | null
```

---

## Common TypeScript Fixes

### Drizzle `or()` Returns Undefined

The `or()` function from Drizzle ORM can return `SQL<unknown> | undefined`. When pushing to a conditions array:

```typescript
// WRONG - TypeScript error
const conditions: SQL<unknown>[] = [];
if (input.search) {
  conditions.push(
    or(
      sql`${table.title} ILIKE ${`%${input.search}%`}`,
      sql`${table.description} ILIKE ${`%${input.search}%`}`
    )
  );
}

// CORRECT - Handle undefined case
const conditions: SQL<unknown>[] = [];
if (input.search) {
  const searchCondition = or(
    sql`${table.title} ILIKE ${`%${input.search}%`}`,
    sql`${table.description} ILIKE ${`%${input.search}%`}`
  );
  if (searchCondition) {
    conditions.push(searchCondition);
  }
}
```

### Type Casting for Enum Fields

When working with database fields that have specific enum types:

```typescript
// When querying returns a generic string, cast to the specific type
const deadline = {
  ...dbResult,
  business: dbResult.business as "GCMC" | "KAJ" | null,
  priority: dbResult.priority as "LOW" | "NORMAL" | "HIGH" | "URGENT",
};
```

### Frontend Type Matching Backend

Ensure frontend types match exactly what the backend returns:

```typescript
// Check backend return type first
// packages/api/src/routers/tax-calculators.ts
interface PAYEResult {
  monthlyIncome: number;
  annualIncome: number;
  // ... check what fields actually exist
}

// Then match in frontend
const [result, setResult] = useState<{
  monthlyIncome: number;
  annualIncome: number;
  // ... same fields as backend
} | null>(null);
```

---

## Key Package References

- **Package naming**: `@SYNERGY-GY/db`, `@SYNERGY-GY/api` (not `@repo/db`)
- **Table naming**: Singular (e.g., `client`, not `clients`)
- **Import path for client**: `import { client } from "@/utils/orpc"`

---

## Verified Fixes Log

| Issue | Error Message | Solution |
|-------|---------------|----------|
| oRPC router structure | `router is not a function` | Use plain objects with `.handler()` |
| Frontend API calls | `useMutation does not exist` | Import from `@tanstack/react-query`, use `client` |
| Loader patterns | `query does not exist on type` | Replace loaders with `useQuery` hooks |
| z.record() | `Expected 2-3 arguments, but got 1` | Add key type: `z.record(z.string(), z.value())` |
| Drizzle or() | `undefined not assignable to SQL` | Check `if (condition)` before pushing |
| Enum type casting | Type mismatch on enum fields | Cast to specific union type |
| Zod v4/Astro incompatibility | `Cannot read properties of undefined (reading '_zod')` | Pin `zod: ^3.24.0` in docs package.json |

---

## Zod Version Compatibility

The monorepo uses Zod v4 (`^4.1.13`) in the root and most packages, but Astro/Starlight has not yet updated their integration to support Zod v4.

**Solution**: Pin Zod to v3 specifically in the docs package:

```json
// apps/docs/package.json
{
  "dependencies": {
    "@astrojs/starlight": "^0.37.1",
    "astro": "^5.6.1",
    "sharp": "^0.34.2",
    "zod": "^3.24.0"  // Pin to v3 for Astro compatibility
  }
}
```

This allows the docs package to use Zod v3 while the rest of the monorepo uses v4.

---

## Last Updated

December 2024 - Phase 2 Development
