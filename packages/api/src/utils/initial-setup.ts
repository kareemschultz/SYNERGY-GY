import { account, db, staff, user } from "@SYNERGY-GY/db";
import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { eq } from "drizzle-orm";
import { validatePasswordStrength } from "./password";

/**
 * Run initial setup to create the first owner account from environment variables.
 *
 * This function checks if any OWNER role exists in the database. If not, and the
 * required environment variables are set, it creates the initial owner account.
 *
 * Environment variables:
 * - INITIAL_OWNER_EMAIL: Email for the owner account (required)
 * - INITIAL_OWNER_PASSWORD: Password for the owner account (required)
 * - INITIAL_OWNER_NAME: Display name (optional, defaults to "System Administrator")
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

    // Get environment variables
    const email = process.env.INITIAL_OWNER_EMAIL;
    const password = process.env.INITIAL_OWNER_PASSWORD;
    const name = process.env.INITIAL_OWNER_NAME || "System Administrator";

    // Check if env vars are set
    if (!(email && password)) {
      console.warn("[Setup] ⚠️  No owner exists in the database!");
      console.warn(
        "[Setup] Set INITIAL_OWNER_EMAIL and INITIAL_OWNER_PASSWORD in .env to create one"
      );
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
