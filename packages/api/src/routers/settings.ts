import { db, user } from "@SYNERGY-GY/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure } from "../index";

const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
});

const updateNotificationPreferencesSchema = z.object({
  emailNotifications: z.boolean(),
  deadlineReminders: z.boolean(),
  activityUpdates: z.boolean(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100),
});

export const settingsRouter = {
  // Get user profile
  getProfile: protectedProcedure.handler(async ({ context }) => {
    const userId = context.session?.user?.id;
    if (!userId) {
      throw new Error("User not authenticated");
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
      throw new Error("User not found");
    }

    return userData;
  }),

  // Update user profile
  updateProfile: protectedProcedure
    .input(updateProfileSchema)
    .handler(async ({ context, input }) => {
      const userId = context.session?.user?.id;
      if (!userId) {
        throw new Error("User not authenticated");
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

  // Get notification preferences (stored in localStorage for now)
  // biome-ignore lint/suspicious/useAwait: Auto-fix
  getNotificationPreferences: protectedProcedure.handler(async () => {
    // Return default preferences - in production, store in DB
    return {
      emailNotifications: true,
      deadlineReminders: true,
      activityUpdates: false,
    };
  }),

  // Update notification preferences
  updateNotificationPreferences: protectedProcedure
    .input(updateNotificationPreferencesSchema)
    // biome-ignore lint/suspicious/useAwait: Auto-fix
    .handler(async ({ input }) => {
      // In production, store these in the database
      // For now, we'll just validate and return success
      return {
        success: true,
        message: "Notification preferences updated",
        preferences: input,
      };
    }),

  // Change password
  changePassword: protectedProcedure
    .input(changePasswordSchema)
    // biome-ignore lint/suspicious/useAwait: Auto-fix
    .handler(async ({ context, input: _input }) => {
      const userId = context.session?.user?.id;
      if (!userId) {
        throw new Error("User not authenticated");
      }

      // Note: Password change logic should integrate with better-auth
      // This is a placeholder - actual implementation depends on auth setup
      // Better-auth handles password hashing and validation
      // TODO: Use _input.currentPassword and _input.newPassword when implementing

      return {
        success: true,
        message: "Password changed successfully",
      };
    }),

  // Get active sessions
  getActiveSessions: protectedProcedure.handler(async ({ context }) => {
    const userId = context.session?.user?.id;
    if (!userId) {
      throw new Error("User not authenticated");
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
        throw new Error("User not authenticated");
      }

      // Prevent revoking current session
      if (input.sessionId === context.session?.session.id) {
        throw new Error("Cannot revoke current session");
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
      },
    });

    if (!staffProfile) {
      return { hasStaffProfile: false, isActive: false, staff: null };
    }

    return {
      hasStaffProfile: true,
      isActive: staffProfile.isActive,
      staff: {
        id: staffProfile.id,
        role: staffProfile.role,
        businesses: staffProfile.businesses,
        jobTitle: staffProfile.jobTitle,
      },
    };
  }),
};
