/**
 * Staff Setup Router
 *
 * Public endpoints for staff password setup flow.
 * These are used when an admin creates a new staff member and they need to set their password.
 */

import { account, db, passwordSetupToken, staff, user } from "@SYNERGY-GY/db";
import { randomUUID } from "node:crypto";
import { ORPCError } from "@orpc/server";
import { and, eq, gt, isNull } from "drizzle-orm";
import { z } from "zod";
import { publicProcedure } from "../index";
import { hashPassword, validatePasswordStrength } from "../utils/password";

// Schema for verifying a setup token
const verifyTokenSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

// Schema for completing password setup
const completeSetupSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const staffSetupRouter = {
  /**
   * Verify a password setup token
   * Returns the staff member's email and name if valid
   */
  verifyToken: publicProcedure
    .input(verifyTokenSchema)
    .handler(async ({ input }) => {
      const { token } = input;

      // Find the token record
      const tokenRecords = await db
        .select({
          id: passwordSetupToken.id,
          userId: passwordSetupToken.userId,
          expiresAt: passwordSetupToken.expiresAt,
          usedAt: passwordSetupToken.usedAt,
        })
        .from(passwordSetupToken)
        .where(eq(passwordSetupToken.token, token))
        .limit(1);

      const record = tokenRecords[0];
      if (!record) {
        throw new ORPCError("NOT_FOUND", {
          message:
            "Invalid setup token. Please contact your administrator for a new invite.",
        });
      }

      // Check if token has been used
      if (record.usedAt) {
        throw new ORPCError("BAD_REQUEST", {
          message:
            "This setup link has already been used. Please login or contact your administrator.",
        });
      }

      // Check if token has expired
      if (new Date() > record.expiresAt) {
        throw new ORPCError("BAD_REQUEST", {
          message:
            "This setup link has expired. Please contact your administrator for a new invite.",
        });
      }

      // Get the user details
      const userRecords = await db
        .select({
          id: user.id,
          email: user.email,
          name: user.name,
        })
        .from(user)
        .where(eq(user.id, record.userId))
        .limit(1);

      const staffUser = userRecords[0];
      if (!staffUser) {
        throw new ORPCError("NOT_FOUND", {
          message: "User account not found. Please contact your administrator.",
        });
      }

      // Get staff details
      const staffRecords = await db
        .select({
          role: staff.role,
          businesses: staff.businesses,
          jobTitle: staff.jobTitle,
        })
        .from(staff)
        .where(eq(staff.userId, staffUser.id))
        .limit(1);

      return {
        email: staffUser.email,
        name: staffUser.name,
        role: staffRecords[0]?.role || null,
        jobTitle: staffRecords[0]?.jobTitle || null,
      };
    }),

  /**
   * Complete password setup for a new staff member
   * Creates the account credentials and marks the token as used
   */
  completeSetup: publicProcedure
    .input(completeSetupSchema)
    .handler(async ({ input }) => {
      const { token, password } = input;

      // Validate password strength
      const passwordValidation = validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        throw new ORPCError("BAD_REQUEST", {
          message: passwordValidation.errors.join(". "),
        });
      }

      // Find the token record (must be unused and not expired)
      const tokenRecords = await db
        .select({
          id: passwordSetupToken.id,
          userId: passwordSetupToken.userId,
          expiresAt: passwordSetupToken.expiresAt,
          usedAt: passwordSetupToken.usedAt,
        })
        .from(passwordSetupToken)
        .where(
          and(
            eq(passwordSetupToken.token, token),
            isNull(passwordSetupToken.usedAt),
            gt(passwordSetupToken.expiresAt, new Date())
          )
        )
        .limit(1);

      const record = tokenRecords[0];
      if (!record) {
        throw new ORPCError("BAD_REQUEST", {
          message:
            "Invalid, expired, or already used setup token. Please contact your administrator.",
        });
      }

      // Check if account already exists
      const existingAccount = await db
        .select({ id: account.id })
        .from(account)
        .where(
          and(
            eq(account.userId, record.userId),
            eq(account.providerId, "credential")
          )
        )
        .limit(1);

      if (existingAccount.length > 0) {
        // Mark token as used since account exists
        await db
          .update(passwordSetupToken)
          .set({ usedAt: new Date() })
          .where(eq(passwordSetupToken.id, record.id));

        throw new ORPCError("BAD_REQUEST", {
          message: "Account already has credentials. Please login instead.",
        });
      }

      // Hash the password
      const hashedPassword = await hashPassword(password);

      // Create the account credentials
      await db.insert(account).values({
        id: randomUUID(),
        userId: record.userId,
        accountId: record.userId,
        providerId: "credential",
        password: hashedPassword,
      });

      // Mark the token as used
      await db
        .update(passwordSetupToken)
        .set({ usedAt: new Date() })
        .where(eq(passwordSetupToken.id, record.id));

      // Get user email for return
      const userRecords = await db
        .select({ email: user.email })
        .from(user)
        .where(eq(user.id, record.userId))
        .limit(1);

      return {
        success: true,
        email: userRecords[0]?.email || "",
        message: "Password created successfully. You can now login.",
      };
    }),
};
