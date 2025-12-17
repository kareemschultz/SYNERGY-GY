/**
 * Verification Script: Client Service Selections
 *
 * Verifies integrity of clientServiceSelection records and fixes any issues.
 * Since the wizard was sending category codes but the API expected UUIDs,
 * this script identifies and resolves any data inconsistencies.
 *
 * Run with: bun run packages/db/src/verify-client-selections.ts
 */
import { Pool } from "pg";
import "dotenv/config";

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres123@localhost:5432/synergy_gy";

async function verifyClientSelections() {
  const pool = new Pool({ connectionString: DATABASE_URL });

  try {
    console.log("🔍 Verifying client service selections...\n");

    // Step 1: Count total selections
    const totalResult = await pool.query(
      "SELECT COUNT(*) FROM client_service_selection"
    );
    const totalCount = Number.parseInt(totalResult.rows[0].count, 10);
    console.log(`📊 Total service selections: ${totalCount}`);

    if (totalCount === 0) {
      console.log("✅ No service selections found. Database is clean.\n");
      return;
    }

    // Step 2: Find invalid selections (where serviceCode doesn't match serviceCatalog.id)
    const invalidSelections = await pool.query(`
      SELECT css.id, css.client_id, css.service_code, css.service_name, css.business
      FROM client_service_selection css
      LEFT JOIN service_catalog sc ON css.service_code = sc.id
      WHERE sc.id IS NULL
    `);

    console.log(
      `❌ Invalid selections (no matching service): ${invalidSelections.rows.length}`
    );

    if (invalidSelections.rows.length === 0) {
      console.log("✅ All service selections are valid!\n");
      return;
    }

    // Step 3: Analyze invalid selections
    console.log("\n📋 Invalid Selection Details:");
    for (const selection of invalidSelections.rows) {
      console.log(
        `  • Client: ${selection.client_id} | Service Code: ${selection.service_code} | Name: ${selection.service_name}`
      );
    }

    // Step 4: Attempt to match by name to serviceCatalog
    console.log("\n🔧 Attempting to fix invalid selections...");

    let fixedCount = 0;
    let unfixableCount = 0;

    for (const selection of invalidSelections.rows) {
      // Try to find matching service in serviceCatalog by name and business
      const matchingService = await pool.query(
        `SELECT id, name, display_name, document_requirements
         FROM service_catalog
         WHERE business = $1
           AND (name = $2 OR display_name = $2)
           AND is_active = true
         LIMIT 1`,
        [selection.business, selection.service_name]
      );

      if (matchingService.rows.length > 0) {
        const service = matchingService.rows[0];

        // Update the selection with correct service_code
        await pool.query(
          `UPDATE client_service_selection
           SET service_code = $1,
               service_name = $2,
               required_documents = $3,
               updated_at = NOW()
           WHERE id = $4`,
          [
            service.id,
            service.name,
            service.document_requirements || [],
            selection.id,
          ]
        );

        console.log(`  ✓ Fixed: "${selection.service_name}" → ${service.id}`);
        fixedCount += 1;
      } else {
        console.log(
          `  ✗ Cannot fix: "${selection.service_name}" (no matching service found)`
        );
        unfixableCount += 1;
      }
    }

    // Step 5: Handle unfixable selections
    if (unfixableCount > 0) {
      console.log(
        `\n⚠️  ${unfixableCount} selections could not be automatically fixed.`
      );
      console.log(
        "   These selections reference services that no longer exist."
      );
      console.log("   Options:");
      console.log("   1. Manually investigate and fix");
      console.log(
        "   2. Delete invalid selections (use delete-invalid-selections.ts)"
      );
    }

    // Summary
    console.log("\n✅ Verification complete!");
    console.log(`   • Total selections: ${totalCount}`);
    console.log(
      `   • Valid selections: ${totalCount - invalidSelections.rows.length + fixedCount}`
    );
    console.log(`   • Fixed selections: ${fixedCount}`);
    console.log(`   • Remaining invalid: ${unfixableCount}`);

    // Step 6: Show statistics by service
    console.log("\n📊 Selection Statistics by Service:");

    const stats = await pool.query(`
      SELECT
        sc.name as service_name,
        sc.business,
        COUNT(css.id) as selection_count
      FROM client_service_selection css
      JOIN service_catalog sc ON css.service_code = sc.id
      GROUP BY sc.name, sc.business
      ORDER BY selection_count DESC, sc.business, sc.name
      LIMIT 15
    `);

    if (stats.rows.length > 0) {
      console.log("\n   Top Selected Services:");
      for (const stat of stats.rows) {
        console.log(
          `   • ${stat.service_name} (${stat.business}): ${stat.selection_count} selections`
        );
      }
    } else {
      console.log("   No valid selections found.");
    }
  } catch (error) {
    console.error("❌ Verification failed:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run verification
verifyClientSelections().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
