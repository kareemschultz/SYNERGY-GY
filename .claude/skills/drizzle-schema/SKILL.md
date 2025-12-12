---
name: drizzle-schema
description: Create and modify Drizzle ORM database schemas for PostgreSQL. Use when creating database tables, adding columns, defining relations, writing migrations, or working with data models. Triggers on: schema, table, column, migration, Drizzle, PostgreSQL, database.
---

# Drizzle Schema Development

## Location
All schemas in `packages/db/src/schema/`

## Required Pattern

### Table Definition
```typescript
import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  decimal,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";

// 1. Define enum if needed (use snake_case for DB name)
export const statusEnum = pgEnum("status_name", ["ACTIVE", "INACTIVE", "ARCHIVED"]);

// 2. Define table (use snake_case for DB, camelCase for TS)
export const myTable = pgTable(
  "my_table",
  {
    // UUID primary key (ALWAYS use this pattern)
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    // Foreign key references
    clientId: text("client_id")
      .references(() => client.id, { onDelete: "cascade" })
      .notNull(),

    // Business filter - use ONE of these patterns:
    // Option A: Single business (enum)
    business: businessEnum("business").notNull(),
    // Option B: Multi-business (array)
    businesses: text("businesses").array().notNull(),

    // Status with enum
    status: statusEnum("status").default("ACTIVE").notNull(),

    // Common field types
    name: text("name").notNull(),
    description: text("description"),
    amount: decimal("amount", { precision: 10, scale: 2 }),
    count: integer("count").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),

    // Standard timestamps (ALWAYS include these)
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    // Define indexes for frequently queried columns
    index("my_table_client_id_idx").on(table.clientId),
    index("my_table_status_idx").on(table.status),
    index("my_table_created_at_idx").on(table.createdAt),
  ]
);

// 3. Define relations (ALWAYS add relations for FKs)
export const myTableRelations = relations(myTable, ({ one, many }) => ({
  // One-to-one or many-to-one
  client: one(client, {
    fields: [myTable.clientId],
    references: [client.id],
  }),
  // One-to-many (if this table has children)
  items: many(myTableItem),
}));
```

## Business Enum (from core.ts)
```typescript
// Already defined - import when needed
export const businessEnum = pgEnum("business", ["GCMC", "KAJ"]);
```

## Staff Role Enum (from core.ts)
```typescript
export const staffRoleEnum = pgEnum("staff_role", [
  "OWNER",
  "GCMC_MANAGER",
  "KAJ_MANAGER",
  "STAFF_GCMC",
  "STAFF_KAJ",
  "STAFF_BOTH",
  "RECEPTIONIST",
]);
```

## Export in index.ts
After creating schema, add to `packages/db/src/schema/index.ts`:
```typescript
export * from "./my-schema";
```

## After Schema Changes
```bash
# Push changes directly (development)
bun run db:push

# Generate migration file (production)
bun run db:generate

# Run migrations
bun run db:migrate

# View database in browser
bun run db:studio
```

## Common Patterns

### Soft Delete
```typescript
deletedAt: timestamp("deleted_at"),
```

### Audit Fields
```typescript
createdBy: text("created_by").references(() => staff.id),
updatedBy: text("updated_by").references(() => staff.id),
```

### JSON/JSONB Fields
```typescript
import { jsonb } from "drizzle-orm/pg-core";
metadata: jsonb("metadata").$type<Record<string, unknown>>(),
```

### Array Fields
```typescript
tags: text("tags").array(),
```

## Critical Rules

1. **NEVER use auto-increment IDs** - Always use UUID with `crypto.randomUUID()`
2. **ALWAYS include timestamps** - `createdAt` and `updatedAt`
3. **ALWAYS define relations** - For every foreign key
4. **ALWAYS add indexes** - For frequently queried columns
5. **Use snake_case for DB names** - PostgreSQL convention
6. **Export from index.ts** - Required for imports to work
