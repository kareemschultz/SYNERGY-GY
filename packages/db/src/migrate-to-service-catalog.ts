/**
 * Migration Script: service_type → serviceCatalog
 *
 * Migrates 54 services from service_type table to new serviceCatalog architecture
 * with enriched fields and category relationships.
 *
 * Run with: bun run packages/db/src/migrate-to-service-catalog.ts
 */
import { Pool } from "pg";
import "dotenv/config";

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres123@localhost:5432/synergy_gy";

// Category mapping: service_type category → service_catalog category
const CATEGORY_MAP: Record<
  string,
  {
    name: string;
    displayName: string;
    description: string;
    icon: string;
    business: "GCMC" | "KAJ";
  }
> = {
  // GCMC Categories
  TRAINING: {
    name: "TRAINING",
    displayName: "Training & Development",
    description:
      "Professional training programs covering HR, customer relations, cooperative management, and organizational development",
    icon: "GraduationCap",
    business: "GCMC",
  },
  REGISTRATION: {
    name: "BUSINESS_REGISTRATION",
    displayName: "Business Registration",
    description:
      "Company incorporation, business registration, NPO registration, and cooperative registration services",
    icon: "Building2",
    business: "GCMC",
  },
  PARALEGAL: {
    name: "PARALEGAL",
    displayName: "Paralegal Services",
    description:
      "Document preparation including affidavits, agreements, wills, and settlement agreements",
    icon: "FileText",
    business: "GCMC",
  },
  IMMIGRATION: {
    name: "IMMIGRATION",
    displayName: "Immigration Services",
    description:
      "Work permits, citizenship applications, business visas, and dependent visa services",
    icon: "Plane",
    business: "GCMC",
  },
  CONSULTING: {
    name: "BUSINESS_PROPOSALS",
    displayName: "Business Proposals & Consulting",
    description:
      "Comprehensive business proposals for land occupation, investments, and start-ups",
    icon: "Briefcase",
    business: "GCMC",
  },
  OTHER: {
    name: "NETWORKING",
    displayName: "Networking & Referrals",
    description:
      "Professional referrals connecting clients with legal, real estate, and IT service providers",
    icon: "Users",
    business: "GCMC",
  },

  // KAJ Categories
  TAX: {
    name: "TAX",
    displayName: "Tax Services",
    description:
      "Individual, corporate, and self-employed tax return preparation and compliance documentation",
    icon: "Calculator",
    business: "KAJ",
  },
  ACCOUNTING: {
    name: "ACCOUNTING",
    displayName: "Bookkeeping & Accounting",
    description:
      "Monthly bookkeeping, financial record management, and accounting services",
    icon: "Book",
    business: "KAJ",
  },
  AUDIT: {
    name: "AUDIT",
    displayName: "Audit Services",
    description:
      "Financial audits for cooperatives, NGOs, credit unions, and private companies",
    icon: "Search",
    business: "KAJ",
  },
  NIS: {
    name: "NIS",
    displayName: "NIS Services",
    description:
      "National Insurance Scheme registration, contributions, pensions, and compliance",
    icon: "Shield",
    business: "KAJ",
  },
};

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Migration scripts inherently require complex logic to handle data transformation, validation, and multiple sequential database operations. Refactoring would reduce clarity.
async function migrateServiceCatalog() {
  const pool = new Pool({ connectionString: DATABASE_URL });

  try {
    console.log("🚀 Starting migration: service_type → serviceCatalog\n");

    // Step 1: Check if service_type has data
    const countResult = await pool.query(
      "SELECT COUNT(*) FROM service_type WHERE is_active = true"
    );
    const serviceCount = Number.parseInt(countResult.rows[0].count, 10);
    console.log(
      `📊 Found ${serviceCount} active services in service_type table`
    );

    if (serviceCount === 0) {
      console.log(
        "⚠️  No services found in service_type. Run seed-service-types.ts first."
      );
      return;
    }

    // Step 2: Create service categories
    console.log("\n📁 Creating service categories...");

    const categoryIds: Record<string, string> = {};

    for (const [oldCategory, categoryData] of Object.entries(CATEGORY_MAP)) {
      // Check if category already exists
      const existingCategory = await pool.query(
        `SELECT id FROM service_category
         WHERE business = $1 AND name = $2`,
        [categoryData.business, categoryData.name]
      );

      let categoryId: string;

      if (existingCategory.rows.length > 0) {
        categoryId = existingCategory.rows[0].id;
        console.log(
          `  ✓ Category "${categoryData.displayName}" already exists`
        );
      } else {
        categoryId = crypto.randomUUID();
        await pool.query(
          `INSERT INTO service_category (
            id, business, name, display_name, description, icon,
            sort_order, is_active, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
          [
            categoryId,
            categoryData.business,
            categoryData.name,
            categoryData.displayName,
            categoryData.description,
            categoryData.icon,
            0,
            true,
          ]
        );
        console.log(`  ✓ Created category "${categoryData.displayName}"`);
      }

      categoryIds[oldCategory] = categoryId;
    }

    // Step 3: Migrate services
    console.log("\n📦 Migrating services to serviceCatalog...");

    const services = await pool.query(`
      SELECT * FROM service_type
      WHERE is_active = true
      ORDER BY business, category, sort_order
    `);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const service of services.rows) {
      // Check if service already exists in serviceCatalog
      const existingService = await pool.query(
        `SELECT id FROM service_catalog
         WHERE business = $1 AND name = $2`,
        [service.business, service.name]
      );

      if (existingService.rows.length > 0) {
        console.log(`  ⊘ Skipped: "${service.name}" (already exists)`);
        skippedCount += 1;
        continue;
      }

      const categoryId = categoryIds[service.category];

      if (!categoryId) {
        console.log(
          `  ⚠️  Warning: No category mapping for "${service.category}" - skipping "${service.name}"`
        );
        skippedCount += 1;
        continue;
      }

      // Determine pricing type
      const pricingType = service.default_fee === null ? "CUSTOM" : "FIXED";

      // Generate short description (first 100 chars of description)
      const shortDescription = service.description
        ? service.description.substring(0, 100) +
          (service.description.length > 100 ? "..." : "")
        : service.name;

      // Generate typical duration text
      const typicalDuration = service.estimated_days
        ? `${service.estimated_days} business days`
        : null;

      await pool.query(
        `INSERT INTO service_catalog (
          id, category_id, business,
          name, display_name, description, short_description,
          typical_duration, estimated_days,
          pricing_type, base_price, currency,
          is_active, is_featured, sort_order,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3,
          $4, $5, $6, $7,
          $8, $9,
          $10, $11, $12,
          $13, $14, $15,
          NOW(), NOW()
        )`,
        [
          crypto.randomUUID(),
          categoryId,
          service.business,
          service.name,
          service.name, // displayName = name
          service.description,
          shortDescription,
          typicalDuration,
          service.estimated_days,
          pricingType,
          service.default_fee,
          "GYD",
          service.is_active,
          false, // isFeatured
          service.sort_order,
        ]
      );

      console.log(
        `  ✓ Migrated: "${service.name}" (${service.business}/${service.category})`
      );
      migratedCount += 1;
    }

    // Summary
    console.log("\n✅ Migration complete!");
    console.log(`   • ${migratedCount} services migrated`);
    console.log(`   • ${skippedCount} services skipped (already exist)`);
    console.log(
      `   • ${Object.keys(categoryIds).length} categories created/verified`
    );

    // Verify final counts
    const finalCount = await pool.query(
      "SELECT COUNT(*) FROM service_catalog WHERE is_active = true"
    );
    console.log(
      `\n📊 Total services in serviceCatalog: ${finalCount.rows[0].count}`
    );

    console.log("\n🎉 You can now use the serviceCatalog in your wizard!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run migration
migrateServiceCatalog().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
