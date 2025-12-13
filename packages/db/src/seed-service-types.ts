/**
 * Seed service_type table with GCMC and KAJ services
 * Based on specs/business-rules/gcmc-services.md and kaj-services.md
 */
import { Pool } from "pg";
import "dotenv/config";

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres123@localhost:5432/synergy_gy";

// GCMC Service Types
const gcmcServices = [
  // Training Services
  {
    business: "GCMC",
    name: "Human Resource Management Training",
    description:
      "Professional development covering recruitment, employee relations, performance management, labor laws, and HR best practices.",
    category: "TRAINING",
    estimatedDays: 5,
    defaultFee: 50_000,
    sortOrder: 1,
  },
  {
    business: "GCMC",
    name: "Customer Relations Training",
    description:
      "Service excellence training focused on customer engagement, conflict resolution, and communication skills.",
    category: "TRAINING",
    estimatedDays: 3,
    defaultFee: 35_000,
    sortOrder: 2,
  },
  {
    business: "GCMC",
    name: "Co-operatives and Credit Unions Training",
    description:
      "Specialized training on cooperative principles, governance, financial management, and regulatory compliance.",
    category: "TRAINING",
    estimatedDays: 4,
    defaultFee: 45_000,
    sortOrder: 3,
  },
  {
    business: "GCMC",
    name: "Organisational Management Training",
    description:
      "Comprehensive management training covering leadership, strategic planning, and organizational development.",
    category: "TRAINING",
    estimatedDays: 5,
    defaultFee: 55_000,
    sortOrder: 4,
  },

  // Small Business Development
  {
    business: "GCMC",
    name: "Company Incorporation",
    description:
      "Full company registration service including Articles of Incorporation, registration with Deeds Registry and GRA.",
    category: "REGISTRATION",
    estimatedDays: 14,
    defaultFee: 75_000,
    sortOrder: 10,
  },
  {
    business: "GCMC",
    name: "Business Registration",
    description:
      "Register sole proprietorships and partnerships with the Deeds Registry and relevant authorities.",
    category: "REGISTRATION",
    estimatedDays: 7,
    defaultFee: 45_000,
    sortOrder: 11,
  },
  {
    business: "GCMC",
    name: "NPO Registration",
    description:
      "Non-Profit Organization registration including charity status applications and compliance setup.",
    category: "REGISTRATION",
    estimatedDays: 21,
    defaultFee: 90_000,
    sortOrder: 12,
  },
  {
    business: "GCMC",
    name: "Cooperative Registration",
    description:
      "Register cooperative societies under the Guyana Co-operative Societies Act.",
    category: "REGISTRATION",
    estimatedDays: 21,
    defaultFee: 90_000,
    sortOrder: 13,
  },

  // Paralegal Services
  {
    business: "GCMC",
    name: "Affidavits",
    description:
      "Prepare sworn statements and affidavits for various legal purposes.",
    category: "PARALEGAL",
    estimatedDays: 2,
    defaultFee: 15_000,
    sortOrder: 20,
  },
  {
    business: "GCMC",
    name: "Agreements",
    description:
      "Draft rental agreements, partnership agreements, and other contractual documents.",
    category: "PARALEGAL",
    estimatedDays: 5,
    defaultFee: 40_000,
    sortOrder: 21,
  },
  {
    business: "GCMC",
    name: "Wills",
    description:
      "Prepare last will and testament documents with proper legal requirements.",
    category: "PARALEGAL",
    estimatedDays: 7,
    defaultFee: 40_000,
    sortOrder: 22,
  },
  {
    business: "GCMC",
    name: "Settlement Agreements",
    description:
      "Draft settlement agreements for disputes, business matters, and separations.",
    category: "PARALEGAL",
    estimatedDays: 10,
    defaultFee: 60_000,
    sortOrder: 23,
  },
  {
    business: "GCMC",
    name: "Investment Agreements",
    description:
      "Prepare investment agreements, shareholder agreements, and joint venture documents.",
    category: "PARALEGAL",
    estimatedDays: 10,
    defaultFee: 75_000,
    sortOrder: 24,
  },

  // Immigration Services
  {
    business: "GCMC",
    name: "Work Permits",
    description:
      "Complete work permit application service including document preparation and Ministry liaison.",
    category: "IMMIGRATION",
    estimatedDays: 30,
    defaultFee: 120_000,
    sortOrder: 30,
  },
  {
    business: "GCMC",
    name: "Citizenship Application",
    description:
      "Assist with Guyanese citizenship applications including documentation and ministry submissions.",
    category: "IMMIGRATION",
    estimatedDays: 90,
    defaultFee: 150_000,
    sortOrder: 31,
  },
  {
    business: "GCMC",
    name: "Business Visas",
    description:
      "Business visa application assistance for investors and business visitors.",
    category: "IMMIGRATION",
    estimatedDays: 14,
    defaultFee: 80_000,
    sortOrder: 32,
  },
  {
    business: "GCMC",
    name: "Dependent Visas",
    description:
      "Visa applications for dependents of work permit holders and residents.",
    category: "IMMIGRATION",
    estimatedDays: 21,
    defaultFee: 100_000,
    sortOrder: 33,
  },

  // Business Proposals
  {
    business: "GCMC",
    name: "Land Occupation Proposals",
    description:
      "Prepare proposals for land occupation, leases, and development applications.",
    category: "CONSULTING",
    estimatedDays: 14,
    defaultFee: 100_000,
    sortOrder: 40,
  },
  {
    business: "GCMC",
    name: "Investment Proposals",
    description:
      "Develop comprehensive investment proposals for local and international investors.",
    category: "CONSULTING",
    estimatedDays: 21,
    defaultFee: 150_000,
    sortOrder: 41,
  },
  {
    business: "GCMC",
    name: "Start-Up Proposals",
    description:
      "Create business plans and start-up proposals for new ventures and funding applications.",
    category: "CONSULTING",
    estimatedDays: 14,
    defaultFee: 80_000,
    sortOrder: 42,
  },

  // Networking/Referral Services
  {
    business: "GCMC",
    name: "Legal Referrals",
    description:
      "Connect clients with appropriate legal professionals for specialized matters.",
    category: "OTHER",
    estimatedDays: 3,
    defaultFee: null,
    sortOrder: 50,
  },
  {
    business: "GCMC",
    name: "Real Estate Referrals",
    description:
      "Connect clients with licensed real estate agents and property professionals.",
    category: "OTHER",
    estimatedDays: 3,
    defaultFee: null,
    sortOrder: 51,
  },
  {
    business: "GCMC",
    name: "IT Referrals",
    description:
      "Connect clients with IT consultants and technology service providers.",
    category: "OTHER",
    estimatedDays: 3,
    defaultFee: null,
    sortOrder: 52,
  },
];

// KAJ Service Types
const kajServices = [
  // Income Tax Returns
  {
    business: "KAJ",
    name: "Individual Tax Returns",
    description:
      "Personal income tax return preparation and filing for employed and self-employed individuals.",
    category: "TAX",
    estimatedDays: 5,
    defaultFee: 35_000,
    sortOrder: 1,
  },
  {
    business: "KAJ",
    name: "Corporate Tax Returns",
    description:
      "Business income tax filing for companies and partnerships including all required schedules.",
    category: "TAX",
    estimatedDays: 10,
    defaultFee: 150_000,
    sortOrder: 2,
  },
  {
    business: "KAJ",
    name: "Self-Employed Tax Returns",
    description:
      "Tax return preparation for sole proprietors and independent contractors.",
    category: "TAX",
    estimatedDays: 7,
    defaultFee: 50_000,
    sortOrder: 3,
  },

  // Compliance Services
  {
    business: "KAJ",
    name: "Tender Compliance",
    description:
      "Tax compliance documentation for government and private sector tenders.",
    category: "TAX",
    estimatedDays: 7,
    defaultFee: 35_000,
    sortOrder: 10,
  },
  {
    business: "KAJ",
    name: "Work Permit Tax Compliance",
    description:
      "Tax clearance preparation for work permit applications and renewals.",
    category: "TAX",
    estimatedDays: 5,
    defaultFee: 30_000,
    sortOrder: 11,
  },
  {
    business: "KAJ",
    name: "Land Transfer Compliance",
    description:
      "Tax documentation for property transfers including capital gains calculations.",
    category: "TAX",
    estimatedDays: 10,
    defaultFee: 45_000,
    sortOrder: 12,
  },
  {
    business: "KAJ",
    name: "Firearm License Compliance",
    description:
      "Financial statements and tax compliance for firearm license applications.",
    category: "TAX",
    estimatedDays: 5,
    defaultFee: 30_000,
    sortOrder: 13,
  },
  {
    business: "KAJ",
    name: "Pension Compliance",
    description: "Pension-related tax and compliance documentation.",
    category: "TAX",
    estimatedDays: 5,
    defaultFee: 25_000,
    sortOrder: 14,
  },
  {
    business: "KAJ",
    name: "Certificate of Assessments",
    description: "Obtain official tax assessment certificates from GRA.",
    category: "TAX",
    estimatedDays: 7,
    defaultFee: 25_000,
    sortOrder: 15,
  },

  // PAYE Services
  {
    business: "KAJ",
    name: "Monthly PAYE Submissions",
    description:
      "Calculate and file monthly employer PAYE tax withholding returns.",
    category: "ACCOUNTING",
    estimatedDays: 3,
    defaultFee: 15_000,
    sortOrder: 20,
  },
  {
    business: "KAJ",
    name: "Annual PAYE Reconciliation",
    description:
      "Year-end reconciliation of all PAYE payments and preparation of employee tax certificates.",
    category: "ACCOUNTING",
    estimatedDays: 10,
    defaultFee: 50_000,
    sortOrder: 21,
  },

  // Financial Statements
  {
    business: "KAJ",
    name: "Bank Loan Statements",
    description:
      "Prepare income/expenditure statements for bank loan applications.",
    category: "ACCOUNTING",
    estimatedDays: 5,
    defaultFee: 25_000,
    sortOrder: 30,
  },
  {
    business: "KAJ",
    name: "Firearm Application Statements",
    description:
      "Financial statements required for firearm license applications.",
    category: "ACCOUNTING",
    estimatedDays: 5,
    defaultFee: 25_000,
    sortOrder: 31,
  },
  {
    business: "KAJ",
    name: "Investment Statements",
    description:
      "Financial statements and projections for investment applications.",
    category: "ACCOUNTING",
    estimatedDays: 7,
    defaultFee: 35_000,
    sortOrder: 32,
  },
  {
    business: "KAJ",
    name: "Cash Flow Projections",
    description:
      "Prepare cash flow projections for business planning and loan applications.",
    category: "ACCOUNTING",
    estimatedDays: 7,
    defaultFee: 40_000,
    sortOrder: 33,
  },

  // Audit Services
  {
    business: "KAJ",
    name: "NGO Audit",
    description:
      "Statutory audit and financial statement preparation for non-profit organizations.",
    category: "AUDIT",
    estimatedDays: 21,
    defaultFee: 100_000,
    sortOrder: 40,
  },
  {
    business: "KAJ",
    name: "Cooperative Society Audit",
    description:
      "Annual audit for cooperative societies as required by the Co-operative Societies Act.",
    category: "AUDIT",
    estimatedDays: 21,
    defaultFee: 100_000,
    sortOrder: 41,
  },
  {
    business: "KAJ",
    name: "Credit Union Audit",
    description:
      "Specialized audit services for credit unions including regulatory compliance review.",
    category: "AUDIT",
    estimatedDays: 30,
    defaultFee: 150_000,
    sortOrder: 42,
  },

  // NIS Services
  {
    business: "KAJ",
    name: "NIS Registration (Employer)",
    description:
      "Register new employers with the National Insurance Scheme including all required documentation.",
    category: "NIS",
    estimatedDays: 7,
    defaultFee: 25_000,
    sortOrder: 50,
  },
  {
    business: "KAJ",
    name: "NIS Registration (Employee)",
    description: "Register new employees for NIS and obtain NIS numbers.",
    category: "NIS",
    estimatedDays: 5,
    defaultFee: 15_000,
    sortOrder: 51,
  },
  {
    business: "KAJ",
    name: "Monthly NIS Contributions",
    description:
      "Calculate and submit monthly NIS contribution schedules and payments.",
    category: "NIS",
    estimatedDays: 3,
    defaultFee: 12_000,
    sortOrder: 52,
  },
  {
    business: "KAJ",
    name: "NIS Compliance Review",
    description:
      "Review and remediate NIS compliance issues including arrears calculations.",
    category: "NIS",
    estimatedDays: 7,
    defaultFee: 35_000,
    sortOrder: 53,
  },
  {
    business: "KAJ",
    name: "NIS Pension Application",
    description:
      "Assist with NIS old age pension and other benefit applications.",
    category: "NIS",
    estimatedDays: 14,
    defaultFee: 30_000,
    sortOrder: 54,
  },
  {
    business: "KAJ",
    name: "NIS Sickness Benefit Claims",
    description: "Process NIS sickness benefit claims for eligible employees.",
    category: "NIS",
    estimatedDays: 10,
    defaultFee: 20_000,
    sortOrder: 55,
  },
];

async function seedServiceTypes() {
  const pool = new Pool({ connectionString: DATABASE_URL });

  try {
    console.log("Checking existing service types...");

    const existingResult = await pool.query(
      "SELECT COUNT(*) FROM service_type"
    );
    const existingCount = Number.parseInt(existingResult.rows[0].count, 10);

    if (existingCount > 0) {
      console.log(
        `Found ${existingCount} existing service types. Skipping seed.`
      );
      console.log("To re-seed, first run: DELETE FROM service_type;");
      return;
    }

    console.log("Seeding GCMC service types...");
    for (const service of gcmcServices) {
      await pool.query(
        `INSERT INTO service_type (id, business, name, description, category, estimated_days, default_fee, sort_order, is_active)
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, true)`,
        [
          service.business,
          service.name,
          service.description,
          service.category,
          service.estimatedDays,
          service.defaultFee,
          service.sortOrder,
        ]
      );
    }
    console.log(`✅ Inserted ${gcmcServices.length} GCMC service types`);

    console.log("Seeding KAJ service types...");
    for (const service of kajServices) {
      await pool.query(
        `INSERT INTO service_type (id, business, name, description, category, estimated_days, default_fee, sort_order, is_active)
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, true)`,
        [
          service.business,
          service.name,
          service.description,
          service.category,
          service.estimatedDays,
          service.defaultFee,
          service.sortOrder,
        ]
      );
    }
    console.log(`✅ Inserted ${kajServices.length} KAJ service types`);

    // Final count
    const finalResult = await pool.query(
      "SELECT business, COUNT(*) as count FROM service_type GROUP BY business"
    );
    console.log("\n📊 Service Types Summary:");
    for (const row of finalResult.rows) {
      console.log(`  ${row.business}: ${row.count} services`);
    }
  } catch (error) {
    console.error("Error seeding service types:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

seedServiceTypes();
