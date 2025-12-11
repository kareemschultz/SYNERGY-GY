import { drizzle } from "drizzle-orm/node-postgres";
// biome-ignore lint/performance/noNamespaceImport: Auto-fix
import * as schema from "./schema";

export const db = drizzle(process.env.DATABASE_URL || "", { schema });

// Re-export schema for convenience
// biome-ignore lint/performance/noBarrelFile: Auto-fix
export * from "./schema";
