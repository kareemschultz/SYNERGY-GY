import { account, bootstrapToken, db, staff, user } from "@SYNERGY-GY/db";
import { randomUUID } from "node:crypto";
import { and, eq, gte, isNull } from "drizzle-orm";
import { hashPassword, validatePasswordStrength } from "./password";

/**
 * Run initial setup to create the first owner account from environment variables.
 *
 * SECURITY NOTE: This function uses environment variables for initial setup,
 * which is acceptable for development and initial deployment. For enhanced security,
 * use the bootstrap token system instead:
 *
 * 1. Set GENERATE_BOOTSTRAP_TOKEN=true to generate a one-time token on startup
 * 2. Use the token via the /register?bootstrap=TOKEN URL to create the first OWNER
 *
 * Environment variables:
 * - INITIAL_OWNER_EMAIL: Email for the owner account (optional, for legacy setup)
 * - INITIAL_OWNER_PASSWORD: Password for the owner account (optional, for legacy setup)
 * - INITIAL_OWNER_NAME: Display name (optional, defaults to "System Administrator")
 * - GENERATE_BOOTSTRAP_TOKEN: If "true", generates a bootstrap token instead of creating account
 * - BOOTSTRAP_TOKEN: Pre-configured bootstrap token (for automated deployments)
 *
 * This function is idempotent - it will only create the owner if one doesn't exist.
 */
export async function runInitialSetup(): Promise<void> {
  try {
    // Check if any OWNER exists in the database
    const existingOwner = await db
      .select({ id: staff.id })
      .from(staff)
      .where(eq(staff.role, "OWNER"))
      .limit(1);

    if (existingOwner.length > 0) {
      console.log("[Setup] Owner already exists, skipping initial setup");
      return;
    }

    // Check if bootstrap token generation is requested (more secure option)
    const generateBootstrap = process.env.GENERATE_BOOTSTRAP_TOKEN === "true";
    const preConfiguredToken = process.env.BOOTSTRAP_TOKEN;

    if (generateBootstrap || preConfiguredToken) {
      await handleBootstrapToken(preConfiguredToken);
      return;
    }

    // Get environment variables for legacy direct creation
    const email = process.env.INITIAL_OWNER_EMAIL;
    const password = process.env.INITIAL_OWNER_PASSWORD;
    const name = process.env.INITIAL_OWNER_NAME || "System Administrator";

    // Check if env vars are set
    if (!(email && password)) {
      console.warn("[Setup] ⚠️  No owner exists in the database!");
      console.warn("[Setup] Options to create the first OWNER account:");
      console.warn("[Setup]");
      console.warn("[Setup] Option 1 (Recommended - More Secure):");
      console.warn(
        "[Setup]   Set GENERATE_BOOTSTRAP_TOKEN=true to generate a one-time token"
      );
      console.warn(
        "[Setup]   Then use /register?bootstrap=TOKEN to create the owner"
      );
      console.warn("[Setup]");
      console.warn("[Setup] Option 2 (Quick Setup):");
      console.warn(
        "[Setup]   Set INITIAL_OWNER_EMAIL and INITIAL_OWNER_PASSWORD in .env"
      );
      console.warn("[Setup]");
      console.warn(
        "[Setup] App will continue, but admin features require an owner account"
      );
      return;
    }

    // Validate email format
    // biome-ignore lint/performance/useTopLevelRegex: Only called once on startup
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error(
        "[Setup] ❌ INITIAL_OWNER_EMAIL is not a valid email address"
      );
      return;
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      console.error(
        "[Setup] ❌ INITIAL_OWNER_PASSWORD does not meet requirements:"
      );
      for (const error of passwordValidation.errors) {
        console.error(`[Setup]    - ${error}`);
      }
      return;
    }

    // Check if user with this email already exists
    const existingUser = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      console.error(
        "[Setup] ❌ A user with email",
        email,
        "already exists but has no OWNER role"
      );
      console.error(
        "[Setup] Please use the admin panel to assign the OWNER role"
      );
      return;
    }

    // Create the owner account
    console.log("[Setup] Creating initial owner account...");

    const userId = randomUUID();
    const accountId = randomUUID();
    const staffId = randomUUID();
    const hashedPassword = await hashPassword(password);

    // Insert user record
    await db.insert(user).values({
      id: userId,
      name,
      email,
      emailVerified: true,
    });

    // Insert account record (Better-Auth credential provider)
    await db.insert(account).values({
      id: accountId,
      userId,
      accountId: userId,
      providerId: "credential",
      password: hashedPassword,
    });

    // Insert staff record with OWNER role and both businesses
    await db.insert(staff).values({
      id: staffId,
      userId,
      role: "OWNER",
      businesses: ["GCMC", "KAJ"],
      isActive: true,
    });

    console.log("[Setup] ✅ Initial owner created successfully!");
    console.log(`[Setup]    Email: ${email}`);
    console.log(`[Setup]    Name: ${name}`);
    console.log("[Setup]    Role: OWNER (full access to GCMC and KAJ)");
    console.log("[Setup]");
    console.log(
      "[Setup] You can now login at /login with the credentials above."
    );
    console.log(
      "[Setup] For security, consider removing INITIAL_OWNER_* from .env after first login."
    );
  } catch (error) {
    console.error("[Setup] ❌ Failed to run initial setup:", error);
    // Don't throw - let the app continue even if setup fails
  }
}

/**
 * Handle bootstrap token creation or validation
 *
 * This creates a one-time use token that can be used to create the first OWNER account
 * through the web interface, which is more secure than putting credentials in env vars.
 */
async function handleBootstrapToken(
  preConfiguredToken?: string
): Promise<void> {
  // Check if there's already a valid bootstrap token
  const existingToken = await db
    .select()
    .from(bootstrapToken)
    .where(
      and(
        isNull(bootstrapToken.usedAt),
        gte(bootstrapToken.expiresAt, new Date())
      )
    )
    .limit(1);

  if (existingToken.length > 0) {
    console.log("[Setup] ℹ️  A valid bootstrap token already exists");
    console.log(
      "[Setup]    Expires:",
      existingToken[0].expiresAt.toISOString()
    );
    console.log("[Setup]");
    console.log(
      "[Setup] Use the existing token to create the first OWNER account"
    );
    return;
  }

  // Generate or use pre-configured token
  const token = preConfiguredToken || randomUUID();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await db.insert(bootstrapToken).values({
    token,
    expiresAt,
  });

  const appUrl = process.env.CORS_ORIGIN || "http://localhost:5173";
  const bootstrapUrl = `${appUrl}/register?bootstrap=${token}`;

  console.log("[Setup] 🔐 Bootstrap token created!");
  console.log("[Setup]");
  console.log(
    "[Setup] ═══════════════════════════════════════════════════════════"
  );
  console.log("[Setup] BOOTSTRAP TOKEN:", token);
  console.log(
    "[Setup] ═══════════════════════════════════════════════════════════"
  );
  console.log("[Setup]");
  console.log("[Setup] Use this URL to create the first OWNER account:");
  console.log(`[Setup] ${bootstrapUrl}`);
  console.log("[Setup]");
  console.log("[Setup] Token expires in 24 hours:", expiresAt.toISOString());
  console.log("[Setup]");
  console.log("[Setup] ⚠️  SECURITY NOTES:");
  console.log("[Setup]    - This token can only be used ONCE");
  console.log("[Setup]    - Token expires in 24 hours");
  console.log(
    "[Setup]    - After creating the owner, remove GENERATE_BOOTSTRAP_TOKEN from .env"
  );
  console.log(
    "[Setup]    - The token is logged here ONLY - save it now if needed"
  );
}
