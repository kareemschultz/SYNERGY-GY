import {
  appointment,
  appointmentType,
  client,
  db,
  document,
  invoice,
  invoicePayment,
  matter,
  portalActivityLog,
  portalInvite,
  portalPasswordReset,
  portalSession,
  portalUser,
  staffImpersonationSession,
} from "@SYNERGY-GY/db";
import { ORPCError } from "@orpc/server";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  isNull,
  lte,
  or,
  sql,
} from "drizzle-orm";
import { z } from "zod";
import { adminProcedure, publicProcedure, staffProcedure } from "../index";
import { logActivity } from "../utils/activity-logger";
import { sendPasswordReset, sendPortalInvite } from "../utils/email";
import {
  generateSecureToken,
  hashPassword,
  validatePasswordStrength,
  verifyPassword,
} from "../utils/password";

// Constants
const INVITE_EXPIRY_DAYS = 7;
const PASSWORD_RESET_EXPIRY_HOURS = 1;
const SESSION_EXPIRY_MINUTES = 30;
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCKOUT_MINUTES = 15;

// Portal auth middleware - verify portal session
const requirePortalAuth = publicProcedure.middleware(
  async ({ context, next }) => {
    const portalSessionToken =
      context.req?.raw?.headers?.get("x-portal-session");

    if (!portalSessionToken || typeof portalSessionToken !== "string") {
      throw new ORPCError("UNAUTHORIZED", {
        message: "Portal session required",
      });
    }

    // Find valid session
    const [session] = await db
      .select()
      .from(portalSession)
      .where(
        and(
          eq(portalSession.token, portalSessionToken),
          gt(portalSession.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!session) {
      throw new ORPCError("UNAUTHORIZED", {
        message: "Invalid or expired session",
      });
    }

    // Get portal user with client data
    const [portalUserData] = await db
      .select()
      .from(portalUser)
      .where(eq(portalUser.id, session.portalUserId))
      .limit(1);

    if (!portalUserData?.isActive) {
      throw new ORPCError("FORBIDDEN", {
        message: "Portal account is not active",
      });
    }

    // Update session activity
    await db
      .update(portalSession)
      .set({
        lastActivityAt: new Date(),
        expiresAt: new Date(Date.now() + SESSION_EXPIRY_MINUTES * 60 * 1000),
      })
      .where(eq(portalSession.id, session.id));

    return next({
      context: {
        portalUser: portalUserData,
        portalSession: session,
      },
    });
  }
);

const portalProcedure = publicProcedure.use(requirePortalAuth);

// Input schemas
const sendInviteSchema = z.object({
  clientId: z.string().uuid(),
  email: z.string().email(),
});

const verifyInviteSchema = z.object({
  token: z.string(),
});

const registerSchema = z.object({
  token: z.string(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const requestPasswordResetSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(8),
});

const listMattersSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(20),
});

const getMatterSchema = z.object({
  matterId: z.string().uuid(),
});

const listDocumentsSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(20),
  matterId: z.string().uuid().optional(),
});

const downloadDocumentSchema = z.object({
  documentId: z.string().uuid(),
});

// Portal router
export const portalRouter = {
  // Staff actions - send portal invite
  invite: {
    send: staffProcedure
      .input(sendInviteSchema)
      .handler(async ({ input, context }) => {
        // Verify client exists
        const [clientRecord] = await db
          .select()
          .from(client)
          .where(eq(client.id, input.clientId))
          .limit(1);

        if (!clientRecord) {
          throw new ORPCError("NOT_FOUND", {
            message: "Client not found",
          });
        }

        // Check if portal user already exists
        const [existingPortalUser] = await db
          .select()
          .from(portalUser)
          .where(eq(portalUser.clientId, input.clientId))
          .limit(1);

        if (existingPortalUser) {
          throw new ORPCError("CONFLICT", {
            message: "Client already has a portal account",
          });
        }

        // Check for pending invites
        const [existingInvite] = await db
          .select()
          .from(portalInvite)
          .where(
            and(
              eq(portalInvite.clientId, input.clientId),
              eq(portalInvite.status, "PENDING"),
              gt(portalInvite.expiresAt, new Date())
            )
          )
          .limit(1);

        if (existingInvite) {
          throw new ORPCError("CONFLICT", {
            message: "A pending invite already exists for this client",
          });
        }

        // Generate secure token
        const token = generateSecureToken();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);

        // Create invite
        const inviteResult = await db
          .insert(portalInvite)
          .values({
            clientId: input.clientId,
            email: input.email,
            token,
            expiresAt,
            createdById: context.session.user.id,
          })
          .returning();

        const invite = inviteResult[0];
        if (!invite) {
          throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "Failed to create portal invite",
          });
        }

        // Log activity
        await logActivity({
          userId: context.session.user.id,
          staffId: context.staff?.id,
          action: "CREATE",
          entityType: "CLIENT",
          entityId: input.clientId,
          description: `Sent portal invite to ${input.email}`,
          metadata: { inviteId: invite.id },
        });

        // Use session user's name for personalization
        const invitedByName = context.session.user.name || "GK-Nexus Team";

        // Send email with invite link
        const appUrl = process.env.BETTER_AUTH_URL || "http://localhost:5173";
        const inviteUrl = `${appUrl}/portal/register?token=${token}`;

        await sendPortalInvite({
          clientName: clientRecord.displayName,
          email: input.email,
          inviteUrl,
          expiresInDays: INVITE_EXPIRY_DAYS,
          invitedBy: invitedByName,
        });

        return {
          success: true,
          inviteId: invite.id,
          expiresAt: invite.expiresAt,
          message: "Portal invite sent successfully",
        };
      }),

    verify: publicProcedure
      .input(verifyInviteSchema)
      .handler(async ({ input }) => {
        const [invite] = await db
          .select({
            id: portalInvite.id,
            clientId: portalInvite.clientId,
            email: portalInvite.email,
            status: portalInvite.status,
            expiresAt: portalInvite.expiresAt,
            clientName: client.displayName,
          })
          .from(portalInvite)
          .leftJoin(client, eq(client.id, portalInvite.clientId))
          .where(eq(portalInvite.token, input.token))
          .limit(1);

        if (!invite) {
          throw new ORPCError("NOT_FOUND", {
            message: "Invalid invite token",
          });
        }

        if (invite.status !== "PENDING") {
          throw new ORPCError("BAD_REQUEST", {
            message: "This invite has already been used or revoked",
          });
        }

        if (new Date() > invite.expiresAt) {
          throw new ORPCError("BAD_REQUEST", {
            message: "This invite has expired",
          });
        }

        return {
          valid: true,
          email: invite.email,
          clientName: invite.clientName,
        };
      }),

    // List all portal invites (staff only)
    list: staffProcedure
      .input(
        z.object({
          page: z.number().min(1).default(1),
          limit: z.number().min(1).max(100).default(20),
          status: z.enum(["PENDING", "USED", "EXPIRED", "REVOKED"]).optional(),
          search: z.string().optional(),
        })
      )
      .handler(async ({ input }) => {
        const offset = (input.page - 1) * input.limit;
        const now = new Date();

        // Build conditions
        const conditions = [];

        if (input.status) {
          if (input.status === "EXPIRED") {
            // Expired means PENDING but past expiresAt
            conditions.push(eq(portalInvite.status, "PENDING"));
            conditions.push(lte(portalInvite.expiresAt, now));
          } else if (input.status === "PENDING") {
            // Only truly pending (not expired)
            conditions.push(eq(portalInvite.status, "PENDING"));
            conditions.push(gt(portalInvite.expiresAt, now));
          } else {
            conditions.push(eq(portalInvite.status, input.status));
          }
        }

        if (input.search) {
          const searchTerm = `%${input.search}%`;
          conditions.push(
            or(
              sql`${portalInvite.email} ILIKE ${searchTerm}`,
              sql`${client.displayName} ILIKE ${searchTerm}`
            )
          );
        }

        const whereClause =
          conditions.length > 0 ? and(...conditions) : undefined;

        const invites = await db
          .select({
            id: portalInvite.id,
            clientId: portalInvite.clientId,
            email: portalInvite.email,
            status: portalInvite.status,
            expiresAt: portalInvite.expiresAt,
            createdAt: portalInvite.createdAt,
            usedAt: portalInvite.usedAt,
            revokedAt: portalInvite.revokedAt,
            revocationReason: portalInvite.revocationReason,
            clientName: client.displayName,
            createdByName: sql<string>`(SELECT name FROM "user" WHERE id = ${portalInvite.createdById})`,
            revokedByName: sql<string>`(SELECT name FROM "user" WHERE id = ${portalInvite.revokedById})`,
          })
          .from(portalInvite)
          .leftJoin(client, eq(client.id, portalInvite.clientId))
          .where(whereClause)
          .orderBy(desc(portalInvite.createdAt))
          .limit(input.limit)
          .offset(offset);

        // Compute actual status (PENDING vs EXPIRED)
        const invitesWithStatus = invites.map((inv) => ({
          ...inv,
          computedStatus:
            inv.status === "PENDING" && new Date(inv.expiresAt) <= now
              ? "EXPIRED"
              : inv.status,
        }));

        // Get total count
        const countResult = await db
          .select({ count: count() })
          .from(portalInvite)
          .leftJoin(client, eq(client.id, portalInvite.clientId))
          .where(whereClause);

        return {
          invites: invitesWithStatus,
          pagination: {
            page: input.page,
            limit: input.limit,
            total: countResult[0]?.count ?? 0,
            totalPages: Math.ceil((countResult[0]?.count ?? 0) / input.limit),
          },
        };
      }),

    // Revoke a pending portal invite
    revoke: staffProcedure
      .input(
        z.object({
          inviteId: z.string().uuid(),
          reason: z.string().optional(),
        })
      )
      .handler(async ({ input, context }) => {
        const [invite] = await db
          .select()
          .from(portalInvite)
          .where(eq(portalInvite.id, input.inviteId))
          .limit(1);

        if (!invite) {
          throw new ORPCError("NOT_FOUND", {
            message: "Invite not found",
          });
        }

        if (invite.status !== "PENDING") {
          throw new ORPCError("BAD_REQUEST", {
            message: "Only pending invites can be revoked",
          });
        }

        await db
          .update(portalInvite)
          .set({
            status: "REVOKED",
            revokedAt: new Date(),
            revokedById: context.session.user.id,
            revocationReason: input.reason || "Revoked by staff",
          })
          .where(eq(portalInvite.id, input.inviteId));

        // Log activity
        await logActivity({
          userId: context.session.user.id,
          staffId: context.staff?.id,
          action: "UPDATE",
          entityType: "CLIENT",
          entityId: invite.clientId,
          description: `Revoked portal invite for ${invite.email}`,
          metadata: { inviteId: invite.id, reason: input.reason },
        });

        return {
          success: true,
          message: "Invite revoked successfully",
        };
      }),

    // Resend an expired or revoked portal invite
    resend: staffProcedure
      .input(
        z.object({
          inviteId: z.string().uuid(),
        })
      )
      .handler(async ({ input, context }) => {
        const [invite] = await db
          .select({
            id: portalInvite.id,
            clientId: portalInvite.clientId,
            email: portalInvite.email,
            status: portalInvite.status,
            expiresAt: portalInvite.expiresAt,
          })
          .from(portalInvite)
          .where(eq(portalInvite.id, input.inviteId))
          .limit(1);

        if (!invite) {
          throw new ORPCError("NOT_FOUND", {
            message: "Invite not found",
          });
        }

        // Check if client already has portal account
        const [existingPortalUser] = await db
          .select()
          .from(portalUser)
          .where(eq(portalUser.clientId, invite.clientId))
          .limit(1);

        if (existingPortalUser) {
          throw new ORPCError("CONFLICT", {
            message: "Client already has a portal account",
          });
        }

        // Only allow resending expired or revoked invites
        const isExpired =
          invite.status === "PENDING" &&
          new Date(invite.expiresAt) <= new Date();
        const isRevoked = invite.status === "REVOKED";

        if (!(isExpired || isRevoked) && invite.status !== "PENDING") {
          throw new ORPCError("BAD_REQUEST", {
            message: "Only expired or revoked invites can be resent",
          });
        }

        // Check for active pending invites
        const [activePending] = await db
          .select()
          .from(portalInvite)
          .where(
            and(
              eq(portalInvite.clientId, invite.clientId),
              eq(portalInvite.status, "PENDING"),
              gt(portalInvite.expiresAt, new Date())
            )
          )
          .limit(1);

        if (activePending && activePending.id !== invite.id) {
          throw new ORPCError("CONFLICT", {
            message: "An active invite already exists for this client",
          });
        }

        // Get client info
        const [clientRecord] = await db
          .select()
          .from(client)
          .where(eq(client.id, invite.clientId))
          .limit(1);

        if (!clientRecord) {
          throw new ORPCError("NOT_FOUND", {
            message: "Client not found",
          });
        }

        // Generate new token and update invite
        const newToken = generateSecureToken();
        const newExpiresAt = new Date();
        newExpiresAt.setDate(newExpiresAt.getDate() + INVITE_EXPIRY_DAYS);

        await db
          .update(portalInvite)
          .set({
            token: newToken,
            status: "PENDING",
            expiresAt: newExpiresAt,
            revokedAt: null,
            revokedById: null,
            revocationReason: null,
          })
          .where(eq(portalInvite.id, input.inviteId));

        // Send email with new invite link
        const appUrl = process.env.BETTER_AUTH_URL || "http://localhost:5173";
        const inviteUrl = `${appUrl}/portal/register?token=${newToken}`;
        const invitedByName = context.session.user.name || "GK-Nexus Team";

        await sendPortalInvite({
          clientName: clientRecord.displayName,
          email: invite.email,
          inviteUrl,
          expiresInDays: INVITE_EXPIRY_DAYS,
          invitedBy: invitedByName,
        });

        // Log activity
        await logActivity({
          userId: context.session.user.id,
          staffId: context.staff?.id,
          action: "UPDATE",
          entityType: "CLIENT",
          entityId: invite.clientId,
          description: `Resent portal invite to ${invite.email}`,
          metadata: { inviteId: invite.id },
        });

        return {
          success: true,
          expiresAt: newExpiresAt,
          message: "Invite resent successfully",
        };
      }),
  },

  // Portal auth - register
  auth: {
    register: publicProcedure
      .input(registerSchema)
      .handler(async ({ input }) => {
        // Verify invite
        const [invite] = await db
          .select()
          .from(portalInvite)
          .where(eq(portalInvite.token, input.token))
          .limit(1);

        if (!invite) {
          throw new ORPCError("NOT_FOUND", {
            message: "Invalid invite token",
          });
        }

        if (invite.status !== "PENDING") {
          throw new ORPCError("BAD_REQUEST", {
            message: "This invite has already been used",
          });
        }

        if (new Date() > invite.expiresAt) {
          throw new ORPCError("BAD_REQUEST", {
            message: "This invite has expired",
          });
        }

        // Validate password strength
        const passwordValidation = validatePasswordStrength(input.password);
        if (!passwordValidation.isValid) {
          throw new ORPCError("BAD_REQUEST", {
            message: passwordValidation.errors.join(", "),
          });
        }

        // Hash password
        const passwordHash = await hashPassword(input.password);

        // Create portal user
        const portalUserResult = await db
          .insert(portalUser)
          .values({
            clientId: invite.clientId,
            email: invite.email,
            passwordHash,
            status: "ACTIVE",
            isActive: true,
            emailVerified: true,
            invitedById: invite.createdById,
            invitedAt: invite.createdAt,
          })
          .returning();

        const newPortalUser = portalUserResult[0];
        if (!newPortalUser) {
          throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "Failed to create portal user",
          });
        }

        // Mark invite as used
        await db
          .update(portalInvite)
          .set({
            status: "USED",
            usedAt: new Date(),
            usedById: newPortalUser.id,
          })
          .where(eq(portalInvite.id, invite.id));

        // Log activity
        await logActivity({
          userId: newPortalUser.id,
          action: "CREATE",
          entityType: "CLIENT",
          entityId: invite.clientId,
          description: "Registered portal account",
        });

        return {
          success: true,
          message: "Portal account registered successfully",
        };
      }),

    login: publicProcedure.input(loginSchema).handler(async ({ input }) => {
      // Find portal user
      const [user] = await db
        .select()
        .from(portalUser)
        .where(eq(portalUser.email, input.email))
        .limit(1);

      if (!user) {
        throw new ORPCError("UNAUTHORIZED", {
          message: "Invalid email or password",
        });
      }

      if (!user.isActive) {
        throw new ORPCError("FORBIDDEN", {
          message: "Your account has been deactivated",
        });
      }

      // Check login attempts (simple rate limiting)
      const attempts = Number.parseInt(user.loginAttempts, 10);
      if (attempts >= MAX_LOGIN_ATTEMPTS) {
        const lastActivity = user.lastActivityAt || user.updatedAt;
        const lockoutEnd = new Date(
          lastActivity.getTime() + LOGIN_LOCKOUT_MINUTES * 60 * 1000
        );

        if (new Date() < lockoutEnd) {
          throw new ORPCError("TOO_MANY_REQUESTS", {
            message: `Too many failed login attempts. Try again in ${LOGIN_LOCKOUT_MINUTES} minutes.`,
          });
        }

        // Reset attempts after lockout period
        await db
          .update(portalUser)
          .set({ loginAttempts: "0" })
          .where(eq(portalUser.id, user.id));
      }

      // Verify password
      const isValidPassword = await verifyPassword(
        input.password,
        user.passwordHash
      );

      if (!isValidPassword) {
        // Increment failed attempts
        await db
          .update(portalUser)
          .set({
            loginAttempts: String(attempts + 1),
            lastActivityAt: new Date(),
          })
          .where(eq(portalUser.id, user.id));

        throw new ORPCError("UNAUTHORIZED", {
          message: "Invalid email or password",
        });
      }

      // Create session
      const sessionToken = generateSecureToken();
      const expiresAt = new Date(
        Date.now() + SESSION_EXPIRY_MINUTES * 60 * 1000
      );

      const sessionResult = await db
        .insert(portalSession)
        .values({
          portalUserId: user.id,
          token: sessionToken,
          expiresAt,
          // TODO: Extract from request headers
          ipAddress: null,
          userAgent: null,
        })
        .returning();

      const session = sessionResult[0];
      if (!session) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to create session",
        });
      }

      // Update user
      await db
        .update(portalUser)
        .set({
          lastLoginAt: new Date(),
          lastActivityAt: new Date(),
          loginAttempts: "0", // Reset on successful login
        })
        .where(eq(portalUser.id, user.id));

      // Log activity
      await logActivity({
        userId: user.id,
        action: "LOGIN",
        entityType: "SESSION",
        entityId: session.id,
        description: "Portal user logged in",
      });

      return {
        success: true,
        sessionToken,
        expiresAt,
        user: {
          id: user.id,
          email: user.email,
          clientId: user.clientId,
        },
      };
    }),

    logout: portalProcedure.handler(async ({ context }) => {
      // Delete session
      await db
        .delete(portalSession)
        .where(eq(portalSession.id, context.portalSession.id));

      // Log activity
      await logActivity({
        userId: context.portalUser.id,
        action: "LOGOUT",
        entityType: "SESSION",
        entityId: context.portalSession.id,
        description: "Portal user logged out",
      });

      return { success: true };
    }),

    requestPasswordReset: publicProcedure
      .input(requestPasswordResetSchema)
      .handler(async ({ input }) => {
        const [user] = await db
          .select()
          .from(portalUser)
          .where(eq(portalUser.email, input.email))
          .limit(1);

        // Always return success to prevent email enumeration
        if (!user) {
          return {
            success: true,
            message: "If an account exists, a password reset email was sent",
          };
        }

        // Generate reset token
        const token = generateSecureToken();
        const expiresAt = new Date(
          Date.now() + PASSWORD_RESET_EXPIRY_HOURS * 60 * 60 * 1000
        );

        await db.insert(portalPasswordReset).values({
          portalUserId: user.id,
          token,
          expiresAt,
        });

        // Send email with reset link
        const appUrl = process.env.BETTER_AUTH_URL || "http://localhost:5173";
        const resetUrl = `${appUrl}/portal/reset-password?token=${token}`;

        await sendPasswordReset({
          email: input.email,
          resetUrl,
          expiresInHours: PASSWORD_RESET_EXPIRY_HOURS,
        });

        return {
          success: true,
          message: "If an account exists, a password reset email was sent",
        };
      }),

    resetPassword: publicProcedure
      .input(resetPasswordSchema)
      .handler(async ({ input }) => {
        // Find valid reset token
        const [resetToken] = await db
          .select()
          .from(portalPasswordReset)
          .where(
            and(
              eq(portalPasswordReset.token, input.token),
              gt(portalPasswordReset.expiresAt, new Date()),
              isNull(portalPasswordReset.usedAt)
            )
          )
          .limit(1);

        if (!resetToken) {
          throw new ORPCError("BAD_REQUEST", {
            message: "Invalid or expired reset token",
          });
        }

        // Validate password strength
        const passwordValidation = validatePasswordStrength(input.newPassword);
        if (!passwordValidation.isValid) {
          throw new ORPCError("BAD_REQUEST", {
            message: passwordValidation.errors.join(", "),
          });
        }

        // Hash new password
        const passwordHash = await hashPassword(input.newPassword);

        // Update user password
        await db
          .update(portalUser)
          .set({
            passwordHash,
            loginAttempts: "0", // Reset login attempts
          })
          .where(eq(portalUser.id, resetToken.portalUserId));

        // Mark token as used
        await db
          .update(portalPasswordReset)
          .set({ usedAt: new Date() })
          .where(eq(portalPasswordReset.id, resetToken.id));

        // Invalidate all existing sessions for security
        await db
          .delete(portalSession)
          .where(eq(portalSession.portalUserId, resetToken.portalUserId));

        return {
          success: true,
          message: "Password reset successfully",
        };
      }),
  },

  // Portal user settings
  user: {
    // Change password (requires current password)
    changePassword: portalProcedure
      .input(
        z.object({
          currentPassword: z.string().min(1),
          newPassword: z.string().min(8),
        })
      )
      .handler(async ({ input, context }) => {
        const portalUserId = context.portalUser.id;

        // Get current user
        const [user] = await db
          .select()
          .from(portalUser)
          .where(eq(portalUser.id, portalUserId))
          .limit(1);

        if (!user) {
          throw new ORPCError("NOT_FOUND", {
            message: "User not found",
          });
        }

        // Verify current password
        const isValid = await verifyPassword(
          input.currentPassword,
          user.passwordHash
        );

        if (!isValid) {
          throw new ORPCError("UNAUTHORIZED", {
            message: "Current password is incorrect",
          });
        }

        // Validate new password
        const passwordValidation = validatePasswordStrength(input.newPassword);
        if (!passwordValidation.valid) {
          throw new ORPCError("BAD_REQUEST", {
            message: passwordValidation.errors.join(", "),
          });
        }

        // Hash and update password
        const newPasswordHash = await hashPassword(input.newPassword);

        await db
          .update(portalUser)
          .set({ passwordHash: newPasswordHash })
          .where(eq(portalUser.id, portalUserId));

        // Invalidate all other sessions for security
        await db
          .delete(portalSession)
          .where(
            and(
              eq(portalSession.portalUserId, portalUserId),
              sql`${portalSession.id} != ${context.session.id}`
            )
          );

        // Log activity
        await db.insert(portalActivityLog).values({
          portalUserId,
          clientId: context.portalUser.clientId,
          action: "CHANGE_PASSWORD",
          sessionId: context.session.id,
        });

        return {
          success: true,
          message: "Password changed successfully",
        };
      }),

    // Get notification preferences
    getNotificationPreferences: portalProcedure.handler(async ({ context }) => {
      const portalUserId = context.portalUser.id;

      const [user] = await db
        .select({ notificationPreferences: portalUser.notificationPreferences })
        .from(portalUser)
        .where(eq(portalUser.id, portalUserId))
        .limit(1);

      const defaultPrefs = {
        emailOnMatterUpdate: true,
        emailOnAppointment: true,
        emailOnDocumentRequest: true,
      };

      return (
        (user?.notificationPreferences as typeof defaultPrefs) ?? defaultPrefs
      );
    }),

    // Update notification preferences
    updateNotificationPreferences: portalProcedure
      .input(
        z.object({
          emailOnMatterUpdate: z.boolean().optional(),
          emailOnAppointment: z.boolean().optional(),
          emailOnDocumentRequest: z.boolean().optional(),
        })
      )
      .handler(async ({ input, context }) => {
        const portalUserId = context.portalUser.id;

        // Get current preferences
        const [user] = await db
          .select({
            notificationPreferences: portalUser.notificationPreferences,
          })
          .from(portalUser)
          .where(eq(portalUser.id, portalUserId))
          .limit(1);

        const currentPrefs = (user?.notificationPreferences as Record<
          string,
          boolean
        >) ?? {
          emailOnMatterUpdate: true,
          emailOnAppointment: true,
          emailOnDocumentRequest: true,
        };

        // Merge with updates
        const updatedPrefs = {
          ...currentPrefs,
          ...(input.emailOnMatterUpdate !== undefined && {
            emailOnMatterUpdate: input.emailOnMatterUpdate,
          }),
          ...(input.emailOnAppointment !== undefined && {
            emailOnAppointment: input.emailOnAppointment,
          }),
          ...(input.emailOnDocumentRequest !== undefined && {
            emailOnDocumentRequest: input.emailOnDocumentRequest,
          }),
        };

        await db
          .update(portalUser)
          .set({ notificationPreferences: updatedPrefs })
          .where(eq(portalUser.id, portalUserId));

        return {
          success: true,
          preferences: updatedPrefs,
        };
      }),
  },

  // Portal data access - matters
  matters: {
    list: portalProcedure
      .input(listMattersSchema)
      .handler(async ({ input, context }) => {
        const offset = (input.page - 1) * input.limit;

        const matters = await db
          .select({
            id: matter.id,
            referenceNumber: matter.referenceNumber,
            description: matter.description,
            status: matter.status,
            priority: matter.priority,
            createdAt: matter.createdAt,
            updatedAt: matter.updatedAt,
          })
          .from(matter)
          .where(eq(matter.clientId, context.portalUser.clientId))
          .orderBy(desc(matter.createdAt))
          .limit(input.limit)
          .offset(offset);

        // Get total count
        const countResult = await db
          .select({ count: count() })
          .from(matter)
          .where(eq(matter.clientId, context.portalUser.clientId));
        const totalCount = countResult[0]?.count ?? 0;

        return {
          matters,
          pagination: {
            page: input.page,
            limit: input.limit,
            total: totalCount,
            totalPages: Math.ceil(totalCount / input.limit),
          },
        };
      }),

    get: portalProcedure
      .input(getMatterSchema)
      .handler(async ({ input, context }) => {
        const [matterRecord] = await db
          .select()
          .from(matter)
          .where(
            and(
              eq(matter.id, input.matterId),
              eq(matter.clientId, context.portalUser.clientId)
            )
          )
          .limit(1);

        if (!matterRecord) {
          throw new ORPCError("NOT_FOUND", {
            message: "Matter not found or you don't have access",
          });
        }

        // Log view activity
        await logActivity({
          userId: context.portalUser.id,
          action: "VIEW",
          entityType: "MATTER",
          entityId: input.matterId,
          description: `Viewed matter ${matterRecord.referenceNumber}`,
        });

        return matterRecord;
      }),
  },

  // Portal data access - documents
  documents: {
    list: portalProcedure
      .input(listDocumentsSchema)
      .handler(async ({ input, context }) => {
        const offset = (input.page - 1) * input.limit;

        // Build where conditions
        const conditions = [eq(document.clientId, context.portalUser.clientId)];

        if (input.matterId) {
          conditions.push(eq(document.matterId, input.matterId));
        }

        const documents = await db
          .select({
            id: document.id,
            originalName: document.originalName,
            mimeType: document.mimeType,
            fileSize: document.fileSize,
            category: document.category,
            description: document.description,
            matterId: document.matterId,
            createdAt: document.createdAt,
          })
          .from(document)
          .where(and(...conditions))
          .orderBy(desc(document.createdAt))
          .limit(input.limit)
          .offset(offset);

        // Get total count
        const countResult = await db
          .select({ count: count() })
          .from(document)
          .where(and(...conditions));
        const totalCount = countResult[0]?.count ?? 0;

        return {
          documents,
          pagination: {
            page: input.page,
            limit: input.limit,
            total: totalCount,
            totalPages: Math.ceil(totalCount / input.limit),
          },
        };
      }),

    download: portalProcedure
      .input(downloadDocumentSchema)
      .handler(async ({ input, context }) => {
        const [doc] = await db
          .select()
          .from(document)
          .where(
            and(
              eq(document.id, input.documentId),
              eq(document.clientId, context.portalUser.clientId)
            )
          )
          .limit(1);

        if (!doc) {
          throw new ORPCError("NOT_FOUND", {
            message: "Document not found or you don't have access",
          });
        }

        // Log download activity
        await logActivity({
          userId: context.portalUser.id,
          action: "DOWNLOAD",
          entityType: "DOCUMENT",
          entityId: input.documentId,
          description: `Downloaded document ${doc.originalName}`,
        });

        return {
          fileName: doc.originalName,
          mimeType: doc.mimeType,
          storagePath: doc.storagePath,
          // TODO: Generate signed URL or stream file
          // For now, return metadata
        };
      }),
  },

  // Portal user info
  me: portalProcedure.handler(async ({ context }) => {
    // Get client info
    const [clientInfo] = await db
      .select()
      .from(client)
      .where(eq(client.id, context.portalUser.clientId))
      .limit(1);

    return {
      id: context.portalUser.id,
      email: context.portalUser.email,
      status: context.portalUser.status,
      lastLoginAt: context.portalUser.lastLoginAt,
      client: clientInfo,
    };
  }),

  // Enhanced profile - personal info view with TIN, certificates, etc.
  profile: portalProcedure.handler(async ({ context }) => {
    const [clientInfo] = await db
      .select({
        id: client.id,
        displayName: client.displayName,
        type: client.type,
        firstName: client.firstName,
        lastName: client.lastName,
        dateOfBirth: client.dateOfBirth,
        nationality: client.nationality,
        businessName: client.businessName,
        registrationNumber: client.registrationNumber,
        incorporationDate: client.incorporationDate,
        email: client.email,
        phone: client.phone,
        alternatePhone: client.alternatePhone,
        address: client.address,
        city: client.city,
        country: client.country,
        tinNumber: client.tinNumber,
        nationalId: client.nationalId,
        passportNumber: client.passportNumber,
        createdAt: client.createdAt,
      })
      .from(client)
      .where(eq(client.id, context.portalUser.clientId))
      .limit(1);

    if (!clientInfo) {
      throw new ORPCError("NOT_FOUND", { message: "Client not found" });
    }

    // Get matter summary
    const matterSummary = await db
      .select({
        total: count(),
        active: sql<number>`COUNT(CASE WHEN ${matter.status} IN ('NEW', 'IN_PROGRESS', 'PENDING_CLIENT', 'SUBMITTED') THEN 1 END)`,
        completed: sql<number>`COUNT(CASE WHEN ${matter.status} = 'COMPLETE' THEN 1 END)`,
      })
      .from(matter)
      .where(eq(matter.clientId, context.portalUser.clientId));

    // Get document count
    const documentCount = await db
      .select({ count: count() })
      .from(document)
      .where(eq(document.clientId, context.portalUser.clientId));

    return {
      ...clientInfo,
      summary: {
        totalMatters: matterSummary[0]?.total ?? 0,
        activeMatters: matterSummary[0]?.active ?? 0,
        completedMatters: matterSummary[0]?.completed ?? 0,
        totalDocuments: documentCount[0]?.count ?? 0,
      },
    };
  }),

  // Financial summary for client
  financials: {
    summary: portalProcedure.handler(async ({ context }) => {
      // Get invoice totals
      const invoiceSummary = await db
        .select({
          totalInvoiced: sql<string>`COALESCE(SUM(CAST(${invoice.totalAmount} AS DECIMAL)), 0)`,
          totalPaid: sql<string>`COALESCE(SUM(CAST(${invoice.amountPaid} AS DECIMAL)), 0)`,
          totalOutstanding: sql<string>`COALESCE(SUM(CAST(${invoice.amountDue} AS DECIMAL)), 0)`,
        })
        .from(invoice)
        .where(
          and(
            eq(invoice.clientId, context.portalUser.clientId),
            or(
              eq(invoice.status, "SENT"),
              eq(invoice.status, "OVERDUE"),
              eq(invoice.status, "PAID")
            )
          )
        );

      // Get overdue amount
      const overdueSummary = await db
        .select({
          totalOverdue: sql<string>`COALESCE(SUM(CAST(${invoice.amountDue} AS DECIMAL)), 0)`,
          overdueCount: count(),
        })
        .from(invoice)
        .where(
          and(
            eq(invoice.clientId, context.portalUser.clientId),
            eq(invoice.status, "OVERDUE")
          )
        );

      return {
        totalInvoiced: invoiceSummary[0]?.totalInvoiced || "0",
        totalPaid: invoiceSummary[0]?.totalPaid || "0",
        totalOutstanding: invoiceSummary[0]?.totalOutstanding || "0",
        totalOverdue: overdueSummary[0]?.totalOverdue || "0",
        overdueCount: overdueSummary[0]?.overdueCount || 0,
      };
    }),

    invoices: portalProcedure
      .input(
        z.object({
          page: z.number().min(1).default(1),
          limit: z.number().min(1).max(50).default(20),
          status: z.enum(["SENT", "PAID", "OVERDUE"]).optional(),
        })
      )
      .handler(async ({ input, context }) => {
        const offset = (input.page - 1) * input.limit;

        const conditions = [
          eq(invoice.clientId, context.portalUser.clientId),
          or(
            eq(invoice.status, "SENT"),
            eq(invoice.status, "PAID"),
            eq(invoice.status, "OVERDUE")
          ),
        ];

        if (input.status) {
          conditions.push(eq(invoice.status, input.status));
        }

        const whereClause = and(...conditions);

        const invoices = await db
          .select({
            id: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            business: invoice.business,
            invoiceDate: invoice.invoiceDate,
            dueDate: invoice.dueDate,
            status: invoice.status,
            totalAmount: invoice.totalAmount,
            amountPaid: invoice.amountPaid,
            amountDue: invoice.amountDue,
            paidDate: invoice.paidDate,
          })
          .from(invoice)
          .where(whereClause)
          .orderBy(desc(invoice.invoiceDate))
          .limit(input.limit)
          .offset(offset);

        const countResult = await db
          .select({ count: count() })
          .from(invoice)
          .where(whereClause);

        return {
          invoices,
          pagination: {
            page: input.page,
            limit: input.limit,
            total: countResult[0]?.count ?? 0,
            totalPages: Math.ceil((countResult[0]?.count ?? 0) / input.limit),
          },
        };
      }),

    getInvoice: portalProcedure
      .input(z.object({ invoiceId: z.string().uuid() }))
      .handler(async ({ input, context }) => {
        const [inv] = await db
          .select()
          .from(invoice)
          .where(
            and(
              eq(invoice.id, input.invoiceId),
              eq(invoice.clientId, context.portalUser.clientId)
            )
          )
          .limit(1);

        if (!inv) {
          throw new ORPCError("NOT_FOUND", {
            message: "Invoice not found",
          });
        }

        // Only show sent/paid/overdue invoices to portal
        if (!["SENT", "PAID", "OVERDUE"].includes(inv.status)) {
          throw new ORPCError("NOT_FOUND", {
            message: "Invoice not found",
          });
        }

        // Get line items
        const lineItems = await db.query.invoiceLineItem.findMany({
          where: eq(invoice.id, input.invoiceId),
        });

        // Get payments
        const payments = await db
          .select({
            id: invoicePayment.id,
            amount: invoicePayment.amount,
            paymentDate: invoicePayment.paymentDate,
            paymentMethod: invoicePayment.paymentMethod,
          })
          .from(invoicePayment)
          .where(eq(invoicePayment.invoiceId, input.invoiceId))
          .orderBy(desc(invoicePayment.paymentDate));

        return {
          ...inv,
          lineItems,
          payments,
        };
      }),

    paymentHistory: portalProcedure
      .input(
        z.object({
          page: z.number().min(1).default(1),
          limit: z.number().min(1).max(50).default(20),
        })
      )
      .handler(async ({ input, context }) => {
        const offset = (input.page - 1) * input.limit;

        // Get client's invoices first
        const clientInvoices = await db
          .select({ id: invoice.id })
          .from(invoice)
          .where(eq(invoice.clientId, context.portalUser.clientId));

        const invoiceIds = clientInvoices.map((i) => i.id);

        if (invoiceIds.length === 0) {
          return {
            payments: [],
            pagination: {
              page: input.page,
              limit: input.limit,
              total: 0,
              totalPages: 0,
            },
          };
        }

        const payments = await db
          .select({
            id: invoicePayment.id,
            invoiceId: invoicePayment.invoiceId,
            amount: invoicePayment.amount,
            paymentDate: invoicePayment.paymentDate,
            paymentMethod: invoicePayment.paymentMethod,
            invoiceNumber: invoice.invoiceNumber,
          })
          .from(invoicePayment)
          .innerJoin(invoice, eq(invoice.id, invoicePayment.invoiceId))
          .where(
            sql`${invoicePayment.invoiceId} = ANY(ARRAY[${sql.join(invoiceIds, sql`, `)}]::text[])`
          )
          .orderBy(desc(invoicePayment.paymentDate))
          .limit(input.limit)
          .offset(offset);

        const countResult = await db
          .select({ count: count() })
          .from(invoicePayment)
          .where(
            sql`${invoicePayment.invoiceId} = ANY(ARRAY[${sql.join(invoiceIds, sql`, `)}]::text[])`
          );

        return {
          payments,
          pagination: {
            page: input.page,
            limit: input.limit,
            total: countResult[0]?.count ?? 0,
            totalPages: Math.ceil((countResult[0]?.count ?? 0) / input.limit),
          },
        };
      }),
  },

  // Appointments for portal users
  appointments: {
    list: portalProcedure
      .input(
        z.object({
          page: z.number().min(1).default(1),
          limit: z.number().min(1).max(50).default(20),
          status: z
            .enum(["REQUESTED", "CONFIRMED", "COMPLETED", "CANCELLED"])
            .optional(),
          upcoming: z.boolean().default(false),
        })
      )
      .handler(async ({ input, context }) => {
        const offset = (input.page - 1) * input.limit;

        const conditions = [
          eq(appointment.clientId, context.portalUser.clientId),
        ];

        if (input.status) {
          conditions.push(eq(appointment.status, input.status));
        }

        if (input.upcoming) {
          conditions.push(gte(appointment.scheduledAt, new Date()));
          const statusCondition = or(
            eq(appointment.status, "REQUESTED"),
            eq(appointment.status, "CONFIRMED")
          );
          if (statusCondition) {
            conditions.push(statusCondition);
          }
        }

        const whereClause = and(...conditions);

        const appointments = await db.query.appointment.findMany({
          where: whereClause,
          orderBy: input.upcoming
            ? [asc(appointment.scheduledAt)]
            : [desc(appointment.scheduledAt)],
          limit: input.limit,
          offset,
          with: {
            appointmentType: {
              columns: { id: true, name: true, color: true },
            },
          },
        });

        const countResult = await db
          .select({ count: count() })
          .from(appointment)
          .where(whereClause);

        return {
          appointments: appointments.map((apt) => ({
            id: apt.id,
            title: apt.title,
            description: apt.description,
            scheduledAt: apt.scheduledAt,
            endAt: apt.endAt,
            durationMinutes: apt.durationMinutes,
            locationType: apt.locationType,
            location: apt.location,
            status: apt.status,
            clientNotes: apt.clientNotes,
            appointmentType: apt.appointmentType,
          })),
          pagination: {
            page: input.page,
            limit: input.limit,
            total: countResult[0]?.count ?? 0,
            totalPages: Math.ceil((countResult[0]?.count ?? 0) / input.limit),
          },
        };
      }),

    getUpcoming: portalProcedure.handler(async ({ context }) => {
      const appointments = await db.query.appointment.findMany({
        where: and(
          eq(appointment.clientId, context.portalUser.clientId),
          gte(appointment.scheduledAt, new Date()),
          or(
            eq(appointment.status, "REQUESTED"),
            eq(appointment.status, "CONFIRMED")
          )
        ),
        orderBy: [asc(appointment.scheduledAt)],
        limit: 5,
        with: {
          appointmentType: {
            columns: { id: true, name: true, color: true },
          },
        },
      });

      return appointments.map((apt) => ({
        id: apt.id,
        title: apt.title,
        scheduledAt: apt.scheduledAt,
        endAt: apt.endAt,
        status: apt.status,
        locationType: apt.locationType,
        location: apt.location,
        appointmentType: apt.appointmentType,
      }));
    }),

    getAvailableTypes: portalProcedure.handler(async ({ context }) => {
      // Get client's businesses
      const [clientInfo] = await db
        .select({ businesses: client.businesses })
        .from(client)
        .where(eq(client.id, context.portalUser.clientId))
        .limit(1);

      if (!clientInfo) {
        return [];
      }

      // Get active appointment types for client's businesses
      const types = await db.query.appointmentType.findMany({
        where: and(
          eq(appointmentType.isActive, true),
          or(
            sql`${appointmentType.business} IS NULL`,
            sql`${appointmentType.business}::text = ANY(ARRAY[${sql.join(clientInfo.businesses, sql`, `)}]::text[])`
          )
        ),
        orderBy: [asc(appointmentType.sortOrder), asc(appointmentType.name)],
      });

      return types.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        defaultDurationMinutes: t.defaultDurationMinutes,
        color: t.color,
        requiresApproval: t.requiresApproval,
      }));
    }),

    request: portalProcedure
      .input(
        z.object({
          appointmentTypeId: z.string().min(1),
          preferredDate: z.string(), // ISO datetime
          preferredDuration: z.number().min(15).optional(),
          description: z.string().optional(),
          locationType: z
            .enum(["IN_PERSON", "PHONE", "VIDEO"])
            .default("IN_PERSON"),
        })
      )
      .handler(async ({ input, context }) => {
        // Get client info
        const [clientInfo] = await db
          .select()
          .from(client)
          .where(eq(client.id, context.portalUser.clientId))
          .limit(1);

        if (!clientInfo) {
          throw new ORPCError("NOT_FOUND", { message: "Client not found" });
        }

        // Get appointment type
        const [aptType] = await db
          .select()
          .from(appointmentType)
          .where(
            and(
              eq(appointmentType.id, input.appointmentTypeId),
              eq(appointmentType.isActive, true)
            )
          )
          .limit(1);

        if (!aptType) {
          throw new ORPCError("NOT_FOUND", {
            message: "Appointment type not found",
          });
        }

        // Determine business (use appointment type's business or client's first business)
        const business =
          aptType.business || (clientInfo.businesses[0] as "GCMC" | "KAJ");
        const duration =
          input.preferredDuration || aptType.defaultDurationMinutes;
        const scheduledAt = new Date(input.preferredDate);
        const endAt = new Date(scheduledAt.getTime() + duration * 60 * 1000);

        // Create appointment request
        const [newAppointment] = await db
          .insert(appointment)
          .values({
            appointmentTypeId: input.appointmentTypeId,
            clientId: context.portalUser.clientId,
            business,
            title: `${aptType.name} - ${clientInfo.displayName}`,
            description: input.description || null,
            scheduledAt,
            endAt,
            durationMinutes: duration,
            locationType: input.locationType,
            status: "REQUESTED",
            requestedByPortalUserId: context.portalUser.id,
          })
          .returning();

        if (!newAppointment) {
          throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "Failed to create appointment",
          });
        }

        // Log activity
        await logActivity({
          userId: context.portalUser.id,
          action: "CREATE",
          entityType: "APPOINTMENT",
          entityId: newAppointment.id,
          description: `Requested appointment: ${aptType.name}`,
        });

        return {
          success: true,
          appointmentId: newAppointment.id,
          message: aptType.requiresApproval
            ? "Your appointment request has been submitted and is pending approval."
            : "Your appointment has been scheduled.",
        };
      }),

    cancel: portalProcedure
      .input(
        z.object({
          appointmentId: z.string(),
          reason: z.string().optional(),
        })
      )
      .handler(async ({ input, context }) => {
        const [apt] = await db
          .select()
          .from(appointment)
          .where(
            and(
              eq(appointment.id, input.appointmentId),
              eq(appointment.clientId, context.portalUser.clientId)
            )
          )
          .limit(1);

        if (!apt) {
          throw new ORPCError("NOT_FOUND", {
            message: "Appointment not found",
          });
        }

        // Only allow cancellation of requested or confirmed appointments
        if (!["REQUESTED", "CONFIRMED"].includes(apt.status)) {
          throw new ORPCError("BAD_REQUEST", {
            message: "This appointment cannot be cancelled",
          });
        }

        await db
          .update(appointment)
          .set({
            status: "CANCELLED",
            cancelledAt: new Date(),
            cancellationReason: input.reason || "Cancelled by client",
          })
          .where(eq(appointment.id, input.appointmentId));

        // Log activity
        await logActivity({
          userId: context.portalUser.id,
          action: "UPDATE",
          entityType: "APPOINTMENT",
          entityId: input.appointmentId,
          description: "Cancelled appointment",
        });

        return { success: true };
      }),
  },

  impersonation: {
    start: staffProcedure
      .input(
        z.object({
          clientId: z.string().uuid(),
          reason: z.string().min(10, "Reason must be at least 10 characters"),
        })
      )
      .handler(async ({ input, context }) => {
        // Verify client has active portal account
        const [portalAccount] = await db
          .select()
          .from(portalUser)
          .where(
            and(
              eq(portalUser.clientId, input.clientId),
              eq(portalUser.isActive, true),
              eq(portalUser.status, "ACTIVE")
            )
          )
          .limit(1);

        if (!portalAccount) {
          throw new ORPCError("BAD_REQUEST", {
            message: "Client does not have an active portal account",
          });
        }

        // Generate secure token with 30-minute expiry
        const token = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

        const [_session] = await db
          .insert(staffImpersonationSession)
          .values({
            token,
            staffUserId: context.session.user.id,
            portalUserId: portalAccount.id,
            clientId: input.clientId,
            reason: input.reason,
            expiresAt,
            ipAddress: context.req?.header("x-forwarded-for") || "unknown",
            userAgent: context.req?.header("user-agent") || "unknown",
          })
          .returning();

        // Log the impersonation start
        await db.insert(portalActivityLog).values({
          portalUserId: portalAccount.id,
          clientId: input.clientId,
          action: "LOGIN",
          isImpersonated: true,
          impersonatedByUserId: context.session.user.id,
          metadata: { reason: input.reason },
          ipAddress: context.req?.header("x-forwarded-for") || "unknown",
          userAgent: context.req?.header("user-agent") || "unknown",
        });

        return {
          token,
          expiresAt,
          portalUserId: portalAccount.id,
          clientId: input.clientId,
        };
      }),

    end: staffProcedure
      .input(
        z.object({
          token: z.string(),
        })
      )
      .handler(async ({ input }) => {
        const [session] = await db
          .select()
          .from(staffImpersonationSession)
          .where(
            and(
              eq(staffImpersonationSession.token, input.token),
              eq(staffImpersonationSession.isActive, true)
            )
          )
          .limit(1);

        if (!session) {
          throw new ORPCError("UNAUTHORIZED", {
            message: "Invalid or expired impersonation session",
          });
        }

        await db
          .update(staffImpersonationSession)
          .set({
            endedAt: new Date(),
            isActive: false,
          })
          .where(eq(staffImpersonationSession.id, session.id));

        // Log the impersonation end
        await db.insert(portalActivityLog).values({
          portalUserId: session.portalUserId,
          clientId: session.clientId,
          action: "LOGOUT",
          isImpersonated: true,
          impersonatedByUserId: session.staffUserId,
          metadata: { reason: "Impersonation ended" },
        });

        return { success: true };
      }),

    listActive: adminProcedure.handler(async () => {
      const activeSessions = await db.query.staffImpersonationSession.findMany({
        where: eq(staffImpersonationSession.isActive, true),
        with: {
          staffUser: true,
          portalUser: {
            with: {
              client: true,
            },
          },
        },
        orderBy: [desc(staffImpersonationSession.startedAt)],
      });

      return activeSessions;
    }),
  },

  analytics: {
    getPortalActivity: staffProcedure
      .input(
        z.object({
          clientId: z.string().uuid(),
          startDate: z.date().optional(),
          endDate: z.date().optional(),
          action: z
            .enum([
              "LOGIN",
              "LOGOUT",
              "VIEW_DASHBOARD",
              "VIEW_MATTER",
              "VIEW_DOCUMENT",
              "DOWNLOAD_DOCUMENT",
              "UPLOAD_DOCUMENT",
              "VIEW_INVOICE",
              "REQUEST_APPOINTMENT",
              "CANCEL_APPOINTMENT",
              "UPDATE_PROFILE",
              "CHANGE_PASSWORD",
              "VIEW_RESOURCES",
            ])
            .optional(),
          limit: z.number().min(1).max(100).default(50),
          offset: z.number().min(0).default(0),
        })
      )
      .handler(async ({ input }) => {
        const conditions = [eq(portalActivityLog.clientId, input.clientId)];

        if (input.action) {
          conditions.push(eq(portalActivityLog.action, input.action));
        }

        if (input.startDate) {
          conditions.push(gte(portalActivityLog.createdAt, input.startDate));
        }

        if (input.endDate) {
          conditions.push(lte(portalActivityLog.createdAt, input.endDate));
        }

        const activities = await db.query.portalActivityLog.findMany({
          where: and(...conditions),
          with: {
            portalUser: true,
            impersonatedBy: true,
          },
          orderBy: [desc(portalActivityLog.createdAt)],
          limit: input.limit,
          offset: input.offset,
        });

        const countResult = await db
          .select({ count: count() })
          .from(portalActivityLog)
          .where(and(...conditions));

        return {
          activities,
          totalCount: countResult[0]?.count ?? 0,
          limit: input.limit,
          offset: input.offset,
        };
      }),

    getActivityStats: staffProcedure
      .input(
        z.object({
          clientId: z.string().uuid(),
        })
      )
      .handler(async ({ input }) => {
        const activities = await db.query.portalActivityLog.findMany({
          where: eq(portalActivityLog.clientId, input.clientId),
          orderBy: [desc(portalActivityLog.createdAt)],
        });

        const logins = activities.filter((a) => a.action === "LOGIN");
        const downloads = activities.filter(
          (a) => a.action === "DOWNLOAD_DOCUMENT"
        );

        // Calculate average session duration (login to logout)
        let totalSessionDuration = 0;
        let sessionCount = 0;

        for (let i = 0; i < activities.length - 1; i++) {
          const activity = activities[i];
          if (activity?.action === "LOGIN") {
            const nextLogout = activities
              .slice(i + 1)
              .find((a) => a.action === "LOGOUT");
            if (nextLogout) {
              const duration =
                new Date(nextLogout.createdAt).getTime() -
                new Date(activity.createdAt).getTime();
              totalSessionDuration += duration;
              sessionCount++;
            }
          }
        }

        const avgSessionDuration =
          sessionCount > 0
            ? totalSessionDuration / sessionCount / 1000 / 60
            : 0;

        return {
          totalLogins: logins.length,
          totalDownloads: downloads.length,
          avgSessionDuration: Math.round(avgSessionDuration),
          lastLoginAt: logins[0]?.createdAt || null,
          totalActivities: activities.length,
        };
      }),

    getImpersonationHistory: staffProcedure
      .input(
        z.object({
          clientId: z.string().uuid(),
        })
      )
      .handler(async ({ input }) => {
        const impersonations =
          await db.query.staffImpersonationSession.findMany({
            where: eq(staffImpersonationSession.clientId, input.clientId),
            with: {
              staffUser: true,
              portalUser: true,
            },
            orderBy: [desc(staffImpersonationSession.startedAt)],
          });

        return impersonations;
      }),
  },
};
