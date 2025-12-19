/**
 * Unified Seed Script for GK-Nexus
 *
 * This script seeds all necessary data for a fresh installation.
 * All operations are idempotent - safe to run multiple times.
 *
 * Usage: DATABASE_URL="..." bun run packages/db/src/seed.ts
 *
 * For individual seeds:
 * - Service Types: bun run packages/db/src/seed-service-types.ts
 * - Knowledge Base: bun run packages/db/src/seed-kb.ts
 * - Document Templates: bun run packages/db/src/seed-document-templates.ts
 * - Service Catalog: bun run packages/db/src/scripts/seed-service-catalog.ts
 * - Tags: bun run packages/db/src/seed-tags.ts
 *
 * Guyana-specific tax rates (hardcoded in calculators):
 * - VAT: 14%
 * - NIS Employee: 5.6% (capped at GYD 312,480/month)
 * - NIS Employer: 8.4% (capped at GYD 312,480/month)
 * - PAYE: 28% first GYD 2,040,000, 40% above
 * - Personal Allowance: GYD 100,000/month
 */

import { eq, sql } from "drizzle-orm";
import { db } from "./index";
import { serviceCategory } from "./schema/service-catalog";
import { DEFAULT_TAGS, tag } from "./schema/tags";

type SeedResult = {
  name: string;
  created: number;
  skipped: number;
  errors: string[];
};

const results: SeedResult[] = [];

/**
 * Helper to count existing records
 */
async function countTable(tableName: string): Promise<number> {
  const result = await db.execute(
    sql.raw(`SELECT COUNT(*) as count FROM ${tableName}`)
  );
  return Number(result.rows[0]?.count ?? 0);
}

/**
 * Seed default tags
 */
async function seedTags(): Promise<SeedResult> {
  const result: SeedResult = {
    name: "Tags",
    created: 0,
    skipped: 0,
    errors: [],
  };

  for (const defaultTag of DEFAULT_TAGS) {
    try {
      const existing = await db
        .select()
        .from(tag)
        .where(eq(tag.name, defaultTag.name))
        .limit(1);

      if (existing.length > 0) {
        result.skipped += 1;
        continue;
      }

      await db.insert(tag).values({
        name: defaultTag.name,
        color: defaultTag.color,
        business: null,
      });
      result.created += 1;
    } catch (error) {
      result.errors.push(`Tag "${defaultTag.name}": ${String(error)}`);
    }
  }

  return result;
}

/**
 * Seed service categories and catalog
 * Based on specs/business-rules/gcmc-services.md and kaj-services.md
 */
async function seedServiceCatalog(): Promise<SeedResult> {
  const result: SeedResult = {
    name: "Service Catalog",
    created: 0,
    skipped: 0,
    errors: [],
  };

  // Check if already seeded
  const existingCategories = await countTable("service_category");
  if (existingCategories > 0) {
    result.skipped = existingCategories;
    return result;
  }

  // GCMC Categories
  const gcmcCategories = [
    {
      name: "TRAINING",
      displayName: "Training & Development",
      icon: "GraduationCap",
      sortOrder: 1,
    },
    {
      name: "CONSULTANCY",
      displayName: "Business Development & Consultancy",
      icon: "Briefcase",
      sortOrder: 2,
    },
    {
      name: "PARALEGAL",
      displayName: "Paralegal Services",
      icon: "FileText",
      sortOrder: 3,
    },
    {
      name: "IMMIGRATION",
      displayName: "Immigration Services",
      icon: "Plane",
      sortOrder: 4,
    },
    {
      name: "BUSINESS_PROPOSALS",
      displayName: "Business Proposals",
      icon: "FileEdit",
      sortOrder: 5,
    },
  ];

  // KAJ Categories
  const kajCategories = [
    {
      name: "TAX",
      displayName: "Tax Services",
      icon: "Calculator",
      sortOrder: 6,
    },
    {
      name: "ACCOUNTING",
      displayName: "Accounting Services",
      icon: "FileSpreadsheet",
      sortOrder: 7,
    },
    {
      name: "AUDIT",
      displayName: "Audit Services",
      icon: "ClipboardCheck",
      sortOrder: 8,
    },
    {
      name: "NIS",
      displayName: "NIS Services",
      icon: "ShieldCheck",
      sortOrder: 9,
    },
    {
      name: "COMPLIANCE",
      displayName: "Compliance Services",
      icon: "BadgeCheck",
      sortOrder: 10,
    },
  ];

  try {
    // Insert GCMC categories
    for (const cat of gcmcCategories) {
      await db.insert(serviceCategory).values({
        business: "GCMC",
        name: cat.name,
        displayName: cat.displayName,
        description: `${cat.displayName} services`,
        icon: cat.icon,
        sortOrder: cat.sortOrder,
      });
      result.created += 1;
    }

    // Insert KAJ categories
    for (const cat of kajCategories) {
      await db.insert(serviceCategory).values({
        business: "KAJ",
        name: cat.name,
        displayName: cat.displayName,
        description: `${cat.displayName} services`,
        icon: cat.icon,
        sortOrder: cat.sortOrder,
      });
      result.created += 1;
    }
  } catch (error) {
    result.errors.push(`Categories: ${String(error)}`);
  }

  return result;
}

/**
 * Seed Guyana tax configuration
 * Note: Tax rates are currently hardcoded in the calculators.
 * This documents the current rates for reference.
 */
function logTaxConfiguration(): void {
  console.log("\n📊 Guyana Tax Configuration (Built-in):");
  console.log("   VAT Rate: 14%");
  console.log("   NIS Employee Rate: 5.6%");
  console.log("   NIS Employer Rate: 8.4%");
  console.log("   NIS Ceiling: GYD 312,480/month");
  console.log("   PAYE First Bracket: 28% (up to GYD 2,040,000/year)");
  console.log("   PAYE Second Bracket: 40% (above GYD 2,040,000/year)");
  console.log("   Personal Allowance: GYD 100,000/month (GYD 1,200,000/year)");
}

/**
 * Display summary of database contents
 */
async function displaySummary(): Promise<void> {
  console.log("\n📈 Database Summary:");

  const tables = [
    "user",
    "staff",
    "client",
    "matter",
    "service_type",
    "service_category",
    "service_catalog",
    "knowledge_base_item",
    "document_template",
    "tag",
    "notification",
    "time_entry",
    "active_timer",
    "portal_message",
    "appointment",
    "invoice",
  ];

  for (const tableName of tables) {
    try {
      const count = await countTable(tableName);
      console.log(`   ${tableName}: ${count} records`);
    } catch {
      // Table might not exist yet
    }
  }
}

/**
 * Main seed function
 */
async function main(): Promise<void> {
  console.log("🌱 GK-Nexus Database Seeding");
  console.log("============================\n");

  // Check database connection
  try {
    await db.execute(sql`SELECT 1`);
    console.log("✅ Database connection successful\n");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  }

  // Run seeds
  console.log("Running seeds...\n");

  // 1. Tags (no dependencies)
  console.log("1️⃣  Seeding tags...");
  results.push(await seedTags());

  // 2. Service Categories/Catalog
  console.log("2️⃣  Seeding service catalog...");
  results.push(await seedServiceCatalog());

  // Display results
  console.log("\n📋 Seed Results:");
  console.log("─".repeat(50));

  for (const result of results) {
    const status = result.errors.length > 0 ? "⚠️" : "✅";
    console.log(
      `${status} ${result.name}: ${result.created} created, ${result.skipped} skipped`
    );
    for (const error of result.errors) {
      console.log(`   ❌ ${error}`);
    }
  }

  // Log tax configuration
  logTaxConfiguration();

  // Display summary
  await displaySummary();

  // Additional seed instructions
  console.log("\n📝 Additional Seeds Available:");
  console.log(
    "   bun run packages/db/src/seed-service-types.ts  - Legacy service types"
  );
  console.log(
    "   bun run packages/db/src/seed-kb.ts             - Knowledge base items"
  );
  console.log(
    "   bun run packages/db/src/seed-document-templates.ts - Document templates"
  );
  console.log(
    "   bun run packages/db/src/scripts/seed-service-catalog.ts - Full service catalog"
  );

  console.log("\n✨ Seed complete!");
}

// Run the seed
main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
