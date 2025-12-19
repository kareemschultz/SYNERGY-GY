/**
 * Signup Protection Middleware
 *
 * This module provides security controls for user registration:
 * 1. Blocks public signup in production by default
 * 2. Validates invite tokens before allowing registration
 * 3. Handles bootstrap token for first OWNER creation
 *
 * Environment variables:
 * - ALLOW_PUBLIC_SIGNUP: Set to "true" to allow public signup (NOT recommended for production)
 * - BOOTSTRAP_TOKEN: One-time token for creating the first OWNER account
 */

import {
  and,
  bootstrapToken,
  db,
  eq,
  gte,
  isNull,
  staff,
  staffInvite,
} from "@SYNERGY-GY/db";
import type { Context, Next } from "hono";

/**
 * Check if public signup is allowed
 * Default: false in production, true in development
 */
export function isPublicSignupAllowed(): boolean {
  const envValue = process.env.ALLOW_PUBLIC_SIGNUP;
  if (envValue === "true") {
    return true;
  }
  // Default to allowing signup in development for testing
  if (process.env.NODE_ENV !== "production") {
    return true;
  }
  return false;
}

/**
 * Validate an invite token
 * Returns the invite if valid, null otherwise
 */
export async function validateInviteToken(
  token: string
): Promise<typeof staffInvite.$inferSelect | null> {
  if (!token) {
    return null;
  }

  const [invite] = await db
    .select()
    .from(staffInvite)
    .where(
      and(
        eq(staffInvite.token, token),
        eq(staffInvite.status, "PENDING"),
        gte(staffInvite.expiresAt, new Date())
      )
    )
    .limit(1);

  return invite ?? null;
}

/**
 * Validate a bootstrap token for first OWNER creation
 * Only valid when no staff exist in the database
 */
export async function validateBootstrapToken(token: string): Promise<boolean> {
  if (!token) {
    return false;
  }

  // First check if any staff exist - bootstrap is only valid for empty database
  const [existingStaff] = await db
    .select({ id: staff.id })
    .from(staff)
    .limit(1);
  if (existingStaff) {
    return false;
  }

  // Check if bootstrap token is valid
  const [validToken] = await db
    .select()
    .from(bootstrapToken)
    .where(
      and(
        eq(bootstrapToken.token, token),
        isNull(bootstrapToken.usedAt),
        gte(bootstrapToken.expiresAt, new Date())
      )
    )
    .limit(1);

  return Boolean(validToken);
}

/**
 * Check if this is a valid bootstrap scenario (no staff exist)
 */
export async function isBootstrapScenario(): Promise<boolean> {
  const [existingStaff] = await db
    .select({ id: staff.id })
    .from(staff)
    .limit(1);
  return !existingStaff;
}

/**
 * Mark a bootstrap token as used
 */
export async function markBootstrapTokenUsed(
  token: string,
  userId: string
): Promise<void> {
  await db
    .update(bootstrapToken)
    .set({
      usedAt: new Date(),
      usedById: userId,
    })
    .where(eq(bootstrapToken.token, token));
}

/**
 * Mark an invite as accepted
 */
export async function markInviteAccepted(
  token: string,
  userId: string
): Promise<void> {
  await db
    .update(staffInvite)
    .set({
      status: "ACCEPTED",
      acceptedAt: new Date(),
      acceptedById: userId,
    })
    .where(eq(staffInvite.token, token));
}

/**
 * Generate a cryptographically secure token
 */
export function generateSecureToken(): string {
  return crypto.randomUUID();
}

/**
 * Create a new bootstrap token (for CLI/admin use)
 * Expires in 24 hours by default
 */
export async function createBootstrapToken(
  expiresInHours = 24
): Promise<string> {
  const token = generateSecureToken();
  const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

  await db.insert(bootstrapToken).values({
    token,
    expiresAt,
  });

  return token;
}

// Type for signup validation result
type SignupValidationResult =
  | { allowed: true; context?: Record<string, unknown> }
  | { allowed: false; error: string; code: string; hint?: string };

/**
 * Handle bootstrap token validation
 */
async function handleBootstrapValidation(
  tokenValue: string
): Promise<SignupValidationResult> {
  const isValid = await validateBootstrapToken(tokenValue);
  if (isValid) {
    console.log(
      "[SignupProtection] Valid bootstrap token, allowing OWNER creation"
    );
    return { allowed: true, context: { bootstrapToken: tokenValue } };
  }
  return {
    allowed: false,
    error: "Invalid or expired bootstrap token",
    code: "INVALID_BOOTSTRAP_TOKEN",
  };
}

/**
 * Handle invite token validation
 */
async function handleInviteValidation(
  inviteToken: string,
  email?: string
): Promise<SignupValidationResult> {
  const invite = await validateInviteToken(inviteToken);
  if (!invite) {
    return {
      allowed: false,
      error: "Invalid or expired invite token",
      code: "INVALID_INVITE_TOKEN",
    };
  }

  // Verify email matches
  if (invite.email.toLowerCase() !== email?.toLowerCase()) {
    return {
      allowed: false,
      error: "Email does not match invite",
      code: "EMAIL_MISMATCH",
    };
  }

  console.log("[SignupProtection] Valid invite token, allowing signup");
  return { allowed: true, context: { inviteToken, inviteData: invite } };
}

/**
 * Handle bootstrap scenario (no staff exist)
 */
async function handleBootstrapScenario(
  bootstrapTokenValue?: string
): Promise<SignupValidationResult> {
  const isBootstrap = await isBootstrapScenario();
  if (!isBootstrap) {
    return {
      allowed: false,
      error: "Signup is disabled. You need an invite to create an account.",
      code: "SIGNUP_DISABLED",
    };
  }

  // Check for environment bootstrap token
  const envBootstrapToken = process.env.BOOTSTRAP_TOKEN;
  if (envBootstrapToken && bootstrapTokenValue === envBootstrapToken) {
    console.log(
      "[SignupProtection] Valid env bootstrap token, allowing OWNER creation"
    );
    return { allowed: true, context: { isEnvBootstrap: true } };
  }

  return {
    allowed: false,
    error:
      "No staff exist. Use a bootstrap token to create the first OWNER account.",
    code: "BOOTSTRAP_REQUIRED",
    hint: "Contact your system administrator for a bootstrap token",
  };
}

/**
 * Check if request is a signup request
 */
function isSignupRequest(path: string): boolean {
  return path.includes("/api/auth/sign-up");
}

/**
 * Apply context data to Hono context
 */
function applyContextData(c: Context, context?: Record<string, unknown>): void {
  if (!context) {
    return;
  }
  for (const [key, value] of Object.entries(context)) {
    c.set(key, value);
  }
}

/**
 * Build error response from validation result
 */
function buildErrorResponse(
  result: SignupValidationResult & { allowed: false }
) {
  return {
    error: result.error,
    code: result.code,
    ...(result.hint && { hint: result.hint }),
  };
}

/**
 * Signup protection middleware for Hono
 *
 * This middleware intercepts Better-Auth signup requests and validates:
 * 1. If public signup is allowed
 * 2. If a valid invite token is provided
 * 3. If a valid bootstrap token is provided (for first OWNER)
 *
 * The invite/bootstrap token should be passed in the request body as `inviteToken`
 */
export function signupProtectionMiddleware() {
  return async (c: Context, next: Next) => {
    const path = new URL(c.req.url).pathname;

    // Only intercept signup requests
    if (!isSignupRequest(path)) {
      return next();
    }

    // Allow public signup if explicitly enabled
    if (isPublicSignupAllowed()) {
      console.log("[SignupProtection] Public signup allowed, proceeding");
      return next();
    }

    // Parse and validate request
    try {
      const body = await c.req.json();
      const result = await validateSignupRequest(body);

      if (result.allowed) {
        applyContextData(c, result.context);
        return next();
      }

      return c.json(buildErrorResponse(result), 403);
    } catch (error) {
      console.error("[SignupProtection] Error parsing request:", error);
      return next();
    }
  };
}

/**
 * Validate signup request and return result
 */
function validateSignupRequest(body: {
  inviteToken?: string;
  bootstrapToken?: string;
  email?: string;
}): Promise<SignupValidationResult> {
  const { inviteToken, bootstrapToken: bootstrapTokenValue, email } = body;

  // Check for bootstrap token (first OWNER creation)
  if (bootstrapTokenValue) {
    return handleBootstrapValidation(bootstrapTokenValue);
  }

  // Check for invite token
  if (inviteToken) {
    return handleInviteValidation(inviteToken, email);
  }

  // No token provided - check if bootstrap scenario
  return handleBootstrapScenario(bootstrapTokenValue);
}
