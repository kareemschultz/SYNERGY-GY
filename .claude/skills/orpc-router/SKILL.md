---
name: orpc-router
description: Create oRPC API routers with authentication, Zod validation, and business logic. Use when building API endpoints, backend procedures, or server-side functionality. Triggers on: API, endpoint, router, procedure, backend, oRPC, server.
---

# oRPC Router Development

## Location
All routers in `packages/api/src/routers/`

## Procedure Types (from packages/api/src/index.ts)

| Procedure | Auth Required | Staff Required | Role Check |
|-----------|---------------|----------------|------------|
| `publicProcedure` | No | No | None |
| `protectedProcedure` | Yes | No | None |
| `staffProcedure` | Yes | Yes (active) | None |
| `adminProcedure` | Yes | Yes | OWNER, *_MANAGER |
| `managerProcedure` | Yes | Yes | OWNER, *_MANAGER |
| `gcmcProcedure` | Yes | Yes | GCMC roles only |
| `kajProcedure` | Yes | Yes | KAJ roles only |
| `financialProcedure` | Yes | Yes | canViewFinancials |

## Basic Router Pattern

```typescript
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { db, myTable } from "@SYNERGY-GY/db";
import { and, eq, desc, ilike, count } from "drizzle-orm";
import {
  staffProcedure,
  adminProcedure,
  canAccessBusiness,
  getAccessibleBusinesses,
} from "../index";
import { logActivity } from "../utils/activity-logger";

export const myRouter = {
  // LIST with pagination, filtering, search
  list: staffProcedure
    .input(
      z.object({
        business: z.enum(["GCMC", "KAJ"]).optional(),
        status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
        page: z.number().min(1).default(1),
      })
    )
    .handler(async ({ input, context }) => {
      // Business access check
      const businesses = input.business
        ? [input.business]
        : getAccessibleBusinesses(context.staff);

      if (input.business && !canAccessBusiness(context.staff, input.business)) {
        throw new ORPCError("FORBIDDEN", {
          message: "You don't have access to this business",
        });
      }

      const offset = (input.page - 1) * input.limit;

      // Build conditions
      const conditions = [];
      if (input.status) {
        conditions.push(eq(myTable.status, input.status));
      }
      if (input.search) {
        conditions.push(ilike(myTable.name, `%${input.search}%`));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Query with relations
      const items = await db.query.myTable.findMany({
        where: whereClause,
        orderBy: [desc(myTable.createdAt)],
        limit: input.limit,
        offset,
        with: {
          client: { columns: { id: true, displayName: true } },
        },
      });

      // Get total count
      const [{ total }] = await db
        .select({ total: count() })
        .from(myTable)
        .where(whereClause);

      return {
        items,
        pagination: {
          page: input.page,
          limit: input.limit,
          total,
          totalPages: Math.ceil(total / input.limit),
        },
      };
    }),

  // GET BY ID
  getById: staffProcedure
    .input(z.object({ id: z.string().uuid() }))
    .handler(async ({ input, context }) => {
      const item = await db.query.myTable.findFirst({
        where: eq(myTable.id, input.id),
        with: {
          client: true,
        },
      });

      if (!item) {
        throw new ORPCError("NOT_FOUND", {
          message: "Item not found",
        });
      }

      // Business access check
      if (!canAccessBusiness(context.staff, item.business)) {
        throw new ORPCError("FORBIDDEN");
      }

      return item;
    }),

  // CREATE
  create: staffProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required"),
        clientId: z.string().uuid(),
        business: z.enum(["GCMC", "KAJ"]),
        description: z.string().optional(),
      })
    )
    .handler(async ({ input, context }) => {
      // Business access check
      if (!canAccessBusiness(context.staff, input.business)) {
        throw new ORPCError("FORBIDDEN");
      }

      const [item] = await db
        .insert(myTable)
        .values({
          ...input,
          createdBy: context.staff.id,
        })
        .returning();

      // Log activity
      await logActivity({
        staffId: context.staff.id,
        action: "CREATE",
        entityType: "MY_ENTITY",
        entityId: item.id,
        description: `Created: ${input.name}`,
      });

      return item;
    }),

  // UPDATE
  update: staffProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const existing = await db.query.myTable.findFirst({
        where: eq(myTable.id, input.id),
      });

      if (!existing) {
        throw new ORPCError("NOT_FOUND");
      }

      if (!canAccessBusiness(context.staff, existing.business)) {
        throw new ORPCError("FORBIDDEN");
      }

      const { id, ...updates } = input;
      const [updated] = await db
        .update(myTable)
        .set(updates)
        .where(eq(myTable.id, id))
        .returning();

      await logActivity({
        staffId: context.staff.id,
        action: "UPDATE",
        entityType: "MY_ENTITY",
        entityId: id,
        description: `Updated: ${updated.name}`,
      });

      return updated;
    }),

  // DELETE (admin only)
  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .handler(async ({ input, context }) => {
      const existing = await db.query.myTable.findFirst({
        where: eq(myTable.id, input.id),
      });

      if (!existing) {
        throw new ORPCError("NOT_FOUND");
      }

      await db.delete(myTable).where(eq(myTable.id, input.id));

      await logActivity({
        staffId: context.staff.id,
        action: "DELETE",
        entityType: "MY_ENTITY",
        entityId: input.id,
        description: `Deleted: ${existing.name}`,
      });

      return { success: true };
    }),
};
```

## Register Router
Add to `packages/api/src/routers/index.ts`:

```typescript
import { myRouter } from "./my-router";

export const appRouter = {
  // ... existing routers
  myEntity: myRouter,
};
```

## Error Handling

```typescript
// Standard error codes
throw new ORPCError("NOT_FOUND", { message: "Resource not found" });
throw new ORPCError("FORBIDDEN", { message: "Access denied" });
throw new ORPCError("BAD_REQUEST", { message: "Invalid input" });
throw new ORPCError("UNAUTHORIZED", { message: "Login required" });
throw new ORPCError("CONFLICT", { message: "Resource already exists" });
throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Something went wrong" });
```

## Context Object

```typescript
// Available in handler via context
context.session       // User session (if authenticated)
context.session.user  // User object with id, email, name
context.staff         // Staff profile (if staffProcedure+)
context.staff.id      // Staff UUID
context.staff.role    // StaffRole enum value
context.staff.isActive // boolean
context.staff.canViewFinancials // boolean | null
```

## Activity Logging

```typescript
import { logActivity } from "../utils/activity-logger";

await logActivity({
  staffId: context.staff.id,  // or null for system
  userId: context.session?.user?.id, // optional
  action: "CREATE" | "UPDATE" | "DELETE" | "VIEW" | "STATUS_CHANGE",
  entityType: "CLIENT" | "MATTER" | "DOCUMENT" | "INVOICE" | "APPOINTMENT",
  entityId: item.id,
  description: "Human-readable description",
  metadata: { oldStatus, newStatus }, // optional extra data
});
```

## Critical Rules

1. **ALWAYS check business access** - Use `canAccessBusiness()` before operations
2. **ALWAYS validate input** - Use Zod schemas for all inputs
3. **ALWAYS handle not found** - Return proper 404 errors
4. **ALWAYS log activities** - For CREATE, UPDATE, DELETE operations
5. **Use appropriate procedure** - Match auth level to operation sensitivity
6. **Register in index.ts** - Or router won't be accessible
