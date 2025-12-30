import { db, user } from "@SYNERGY-GY/db";
import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure } from "../index";

const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
});

// Note: Password change is handled directly by better-auth on the frontend
// via authClient.changePassword() - no custom API endpoint needed

// Note: Notification preferences are stored in localStorage on the frontend
// for simplicity. Will be migrated to database when email integration is added.

export const settingsRouter = {
  // Get user profile
  getProfile: protectedProcedure.handler(async ({ context }) => {
    const userId = context.session?.user?.id;
    if (!userId) {
      throw new ORPCError("UNAUTHORIZED", {
        message: "User not authenticated",
      });
    }

    const userData = await db.query.user.findFirst({
      where: eq(user.id, userId),
      columns: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
      },
    });

    if (!userData) {
      throw new ORPCError("NOT_FOUND", {
        message: "User not found",
      });
    }

    return userData;
  }),

  // Update user profile
  updateProfile: protectedProcedure
    .input(updateProfileSchema)
    .handler(async ({ context, input }) => {
      const userId = context.session?.user?.id;
      if (!userId) {
        throw new ORPCError("UNAUTHORIZED", {
          message: "User not authenticated",
        });
      }

      await db
        .update(user)
        .set({
          name: input.name,
          updatedAt: new Date(),
        })
        .where(eq(user.id, userId));

      return { success: true, message: "Profile updated successfully" };
    }),

  // Note: Notification preferences are now stored in localStorage on the frontend
  // Note: Password change is handled by better-auth directly on the frontend

  // Get active sessions
  getActiveSessions: protectedProcedure.handler(async ({ context }) => {
    const userId = context.session?.user?.id;
    if (!userId) {
      throw new ORPCError("UNAUTHORIZED", {
        message: "User not authenticated",
      });
    }

    const sessions = await db.query.session.findMany({
      // biome-ignore lint/nursery/noShadow: Auto-fix
      where: (session, { eq }) => eq(session.userId, userId),
      columns: {
        id: true,
        createdAt: true,
        ipAddress: true,
        userAgent: true,
        expiresAt: true,
      },
      orderBy: (session, { desc }) => [desc(session.createdAt)],
    });

    return sessions.map((s) => ({
      id: s.id,
      createdAt: s.createdAt,
      ipAddress: s.ipAddress || "Unknown",
      userAgent: s.userAgent || "Unknown",
      expiresAt: s.expiresAt,
      current: s.id === context.session?.session.id,
    }));
  }),

  // Revoke session
  revokeSession: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .handler(async ({ context, input }) => {
      const userId = context.session?.user?.id;
      if (!userId) {
        throw new ORPCError("UNAUTHORIZED", {
          message: "User not authenticated",
        });
      }

      // Prevent revoking current session
      if (input.sessionId === context.session?.session.id) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Cannot revoke current session",
        });
      }

      const { session: sessionTable } = await import(
        "@SYNERGY-GY/db/schema/auth"
      );
      await db.delete(sessionTable).where(eq(sessionTable.id, input.sessionId));

      return { success: true, message: "Session revoked successfully" };
    }),

  // Get app info
  getAppInfo: protectedProcedure.handler(async () => ({
    version: "1.0.0",
    buildDate: "2025-01-01",
    environment: process.env.NODE_ENV || "production",
  })),

  // Get current staff status - used to check if user has staff profile
  getStaffStatus: protectedProcedure.handler(async ({ context }) => {
    const userId = context.session?.user?.id;
    if (!userId) {
      return { hasStaffProfile: false, isActive: false, staff: null };
    }

    // Import staff table dynamically to use it
    const { staff } = await import("@SYNERGY-GY/db");

    const staffProfile = await db.query.staff.findFirst({
      where: eq(staff.userId, userId),
      columns: {
        id: true,
        role: true,
        businesses: true,
        isActive: true,
        jobTitle: true,
        canViewFinancials: true,
      },
    });

    if (!staffProfile) {
      return { hasStaffProfile: false, isActive: false, staff: null };
    }

    // Determine financial access based on explicit flag or role
    const managerRoles = ["OWNER", "GCMC_MANAGER", "KAJ_MANAGER"];
    const hasFinancialAccess =
      staffProfile.canViewFinancials ??
      managerRoles.includes(staffProfile.role);

    return {
      hasStaffProfile: true,
      isActive: staffProfile.isActive,
      staff: {
        id: staffProfile.id,
        role: staffProfile.role,
        businesses: staffProfile.businesses,
        jobTitle: staffProfile.jobTitle,
        canViewFinancials: hasFinancialAccess,
      },
    };
  }),
};
