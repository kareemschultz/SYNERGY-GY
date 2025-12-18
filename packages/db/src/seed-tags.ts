/**
 * Seed default tags into the database
 * Run with: DATABASE_URL="..." bun run packages/db/src/seed-tags.ts
 */

import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { DEFAULT_TAGS, tag } from "./schema/tags";

async function seedTags() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error("DATABASE_URL environment variable is required");
    process.exit(1);
  }

  const db = drizzle(databaseUrl);

  console.log("Seeding default tags...\n");

  let created = 0;
  let skipped = 0;

  for (const defaultTag of DEFAULT_TAGS) {
    // Check if tag exists
    const existing = await db
      .select()
      .from(tag)
      .where(eq(tag.name, defaultTag.name))
      .limit(1);

    if (existing.length > 0) {
      console.log(`  ⏭️  Skipped: ${defaultTag.name} (already exists)`);
      skipped++;
      continue;
    }

    // Insert tag
    await db.insert(tag).values({
      name: defaultTag.name,
      color: defaultTag.color,
      business: null, // Available for both businesses
    });

    console.log(`  ✅ Created: ${defaultTag.name}`);
    created++;
  }

  console.log(`\n✨ Done! Created: ${created}, Skipped: ${skipped}`);
  process.exit(0);
}

seedTags().catch((error) => {
  console.error("Error seeding tags:", error);
  process.exit(1);
});
