import {
  client,
  db,
  document,
  matter,
  portalInvite,
  portalPasswordReset,
  portalSession,
  portalUser,
} from "@SYNERGY-GY/db";
import { ORPCError } from "@orpc/server";
import { and, count, desc, eq, gt, isNull } from "drizzle-orm";
import { z } from "zod";
import { publicProcedure, staffProcedure } from "../index";
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
};
