import { drizzle } from "drizzle-orm/node-postgres";
// biome-ignore lint/performance/noNamespaceImport: Required for Drizzle ORM schema initialization - needs all schema exports as single object
import * as schema from "./schema";

export const db = drizzle(process.env.DATABASE_URL || "", { schema });

// Re-export drizzle-orm operators to ensure consistent module resolution
export {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  ilike,
  inArray,
  isNotNull,
  isNull,
  like,
  lt,
  lte,
  ne,
  or,
  sql,
} from "drizzle-orm";
// Re-export schema for convenience
export * from "./schema";

// NOTE: Seed functions are NOT exported here to avoid circular dependencies
// They create a circular import: seed -> db -> seed
// Run seed scripts directly: bun run packages/db/src/seed-kb-forms.ts
