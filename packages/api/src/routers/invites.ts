/**
 * Staff Invites Router
 *
 * Manages invite creation, listing, and revocation for staff accounts.
 * Only OWNER role can create/manage invites to prevent privilege escalation.
 *
 * Security considerations:
 * - Only OWNER can create invites
 * - Invites are single-use and time-limited
 * - Invites are tied to specific email addresses
 * - Role and business assignment is pre-configured in the invite
 */

import {
  and,
  bootstrapToken,
  count,
  db,
  desc,
  eq,
  gte,
  isNull,
  lt,
  or,
  staff,
  staffInvite,
  user,
} from "@SYNERGY-GY/db";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { ownerProcedure, publicProcedure } from "../index";
import { getAppUrl } from "../utils/app-url";
import { generateSecureToken } from "../utils/signup-protection";

// Staff role values (must match database enum)
const staffRoleValues = [
  "OWNER",
  "GCMC_MANAGER",
  "KAJ_MANAGER",
  "STAFF_GCMC",
  "STAFF_KAJ",
  "STAFF_BOTH",
  "RECEPTIONIST",
] as const;

const businessValues = ["GCMC", "KAJ"] as const;

// Zod schemas
const createInviteSchema = z.object({
  email: z.string().email("Valid email is required"),
  role: z.enum(staffRoleValues),
  businesses: z
    .array(z.enum(businessValues))
    .min(1, "At least one business required"),
  expiresInDays: z.number().min(1).max(30).default(7),
});

const listInvitesSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  status: z.enum(["PENDING", "ACCEPTED", "EXPIRED", "REVOKED"]).optional(),
});

// Default invite expiration in days
const DEFAULT_INVITE_EXPIRY_DAYS = 7;

// Helper: Get role display name
function getRoleDisplay(role: string): string {
  const roleMap: Record<string, string> = {
    OWNER: "Owner",
    GCMC_MANAGER: "GCMC Manager",
    KAJ_MANAGER: "KAJ Manager",
    STAFF_GCMC: "GCMC Staff",
    STAFF_KAJ: "KAJ Staff",
    STAFF_BOTH: "Staff (Both)",
    RECEPTIONIST: "Receptionist",
  };
  return roleMap[role] || role;
}

// Helper: Validate business access matches role
function validateBusinessAccess(role: string, businesses: string[]): void {
  const requiresBothBusinesses = ["OWNER", "STAFF_BOTH"].includes(role);
  const requiresGCMC = ["GCMC_MANAGER", "STAFF_GCMC"].includes(role);
  const requiresKAJ = ["KAJ_MANAGER", "STAFF_KAJ"].includes(role);

  if (
    requiresBothBusinesses &&
    (businesses.length !== 2 ||
      !businesses.includes("GCMC") ||
      !businesses.includes("KAJ"))
  ) {
    throw new ORPCError("BAD_REQUEST", {
      message: `Role ${getRoleDisplay(role)} requires access to both GCMC and KAJ`,
    });
  }

  if (requiresGCMC && !businesses.includes("GCMC")) {
    throw new ORPCError("BAD_REQUEST", {
      message: `Role ${getRoleDisplay(role)} requires access to GCMC`,
    });
  }

  if (requiresKAJ && !businesses.includes("KAJ")) {
    throw new ORPCError("BAD_REQUEST", {
      message: `Role ${getRoleDisplay(role)} requires access to KAJ`,
    });
  }
}

export const invitesRouter = {
  // Create a new invite (OWNER only)
  create: ownerProcedure
    .input(createInviteSchema)
    .handler(async ({ input, context }) => {
      const { email, role, businesses, expiresInDays } = input;

      // Normalize email
      const normalizedEmail = email.toLowerCase().trim();

      // Check if user with this email already exists
      const existingUser = await db.query.user.findFirst({
        where: eq(user.email, normalizedEmail),
      });

      if (existingUser) {
        throw new ORPCError("CONFLICT", {
          message: "A user with this email already exists",
        });
      }

      // Check for existing pending invite to this email
      const existingInvite = await db.query.staffInvite.findFirst({
        where: and(
          eq(staffInvite.email, normalizedEmail),
          eq(staffInvite.status, "PENDING"),
          gte(staffInvite.expiresAt, new Date())
        ),
      });

      if (existingInvite) {
        throw new ORPCError("CONFLICT", {
          message: "A pending invite already exists for this email",
        });
      }

      // Validate business access matches role
      validateBusinessAccess(role, businesses);

      // Generate secure token
      const token = generateSecureToken();
      const expiresAt = new Date(
        Date.now() +
          (expiresInDays || DEFAULT_INVITE_EXPIRY_DAYS) * 24 * 60 * 60 * 1000
      );

      // Create the invite
      const [newInvite] = await db
        .insert(staffInvite)
        .values({
          email: normalizedEmail,
          token,
          role,
          businesses,
          status: "PENDING",
          createdById: context.session.user.id,
          expiresAt,
        })
        .returning();

      // Generate invite URL using getAppUrl() to avoid invalid "*" URLs
      const inviteUrl = `${getAppUrl()}/register?invite=${token}`;

      return {
        invite: newInvite,
        inviteUrl,
        expiresAt,
      };
    }),

  // List all invites with pagination (OWNER only)
  list: ownerProcedure.input(listInvitesSchema).handler(async ({ input }) => {
    const { page, limit, status } = input;

    // Build where clause
    const conditions: ReturnType<typeof eq>[] = [];
    if (status) {
      conditions.push(eq(staffInvite.status, status));
    }

    // Auto-expire old invites in the query
    // If status is PENDING, also check expiration
    if (status === "PENDING") {
      conditions.push(gte(staffInvite.expiresAt, new Date()));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [countResult] = await db
      .select({ total: count() })
      .from(staffInvite)
      .where(whereClause);

    const total = countResult?.total ?? 0;

    // Get paginated results
    const offset = (page - 1) * limit;

    const invites = await db
      .select({
        id: staffInvite.id,
        email: staffInvite.email,
        role: staffInvite.role,
        businesses: staffInvite.businesses,
        status: staffInvite.status,
        createdAt: staffInvite.createdAt,
        expiresAt: staffInvite.expiresAt,
        acceptedAt: staffInvite.acceptedAt,
        createdById: staffInvite.createdById,
      })
      .from(staffInvite)
      .where(whereClause)
      .orderBy(desc(staffInvite.createdAt))
      .limit(limit)
      .offset(offset);

    // Mark expired invites
    const invitesWithStatus = invites.map((inv) => ({
      ...inv,
      isExpired: inv.expiresAt < new Date() && inv.status === "PENDING",
      roleDisplay: getRoleDisplay(inv.role),
    }));

    return {
      invites: invitesWithStatus,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }),

  // Get single invite by ID (OWNER only)
  getById: ownerProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      const invite = await db.query.staffInvite.findFirst({
        where: eq(staffInvite.id, input.id),
      });

      if (!invite) {
        throw new ORPCError("NOT_FOUND", {
          message: "Invite not found",
        });
      }

      return {
        ...invite,
        isExpired: invite.expiresAt < new Date() && invite.status === "PENDING",
        roleDisplay: getRoleDisplay(invite.role),
      };
    }),

  // Revoke an invite (OWNER only)
  revoke: ownerProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      const invite = await db.query.staffInvite.findFirst({
        where: eq(staffInvite.id, input.id),
      });

      if (!invite) {
        throw new ORPCError("NOT_FOUND", {
          message: "Invite not found",
        });
      }

      if (invite.status !== "PENDING") {
        throw new ORPCError("BAD_REQUEST", {
          message: `Cannot revoke invite with status: ${invite.status}`,
        });
      }

      const [revokedInvite] = await db
        .update(staffInvite)
        .set({
          status: "REVOKED",
        })
        .where(eq(staffInvite.id, input.id))
        .returning();

      return revokedInvite;
    }),

  // Resend invite (generates new token, OWNER only)
  resend: ownerProcedure
    .input(
      z.object({
        id: z.string(),
        expiresInDays: z.number().min(1).max(30).default(7),
      })
    )
    .handler(async ({ input }) => {
      const invite = await db.query.staffInvite.findFirst({
        where: eq(staffInvite.id, input.id),
      });

      if (!invite) {
        throw new ORPCError("NOT_FOUND", {
          message: "Invite not found",
        });
      }

      if (invite.status !== "PENDING") {
        throw new ORPCError("BAD_REQUEST", {
          message: `Cannot resend invite with status: ${invite.status}`,
        });
      }

      // Generate new token and expiration
      const newToken = generateSecureToken();
      const newExpiresAt = new Date(
        Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000
      );

      const [updatedInvite] = await db
        .update(staffInvite)
        .set({
          token: newToken,
          expiresAt: newExpiresAt,
        })
        .where(eq(staffInvite.id, input.id))
        .returning();

      const inviteUrl = `${getAppUrl()}/register?invite=${newToken}`;

      return {
        invite: updatedInvite,
        inviteUrl,
        expiresAt: newExpiresAt,
      };
    }),

  // Validate invite token (PUBLIC - for registration page)
  validate: publicProcedure
    .input(z.object({ token: z.string() }))
    .handler(async ({ input }) => {
      const invite = await db.query.staffInvite.findFirst({
        where: and(
          eq(staffInvite.token, input.token),
          eq(staffInvite.status, "PENDING"),
          gte(staffInvite.expiresAt, new Date())
        ),
      });

      if (!invite) {
        return {
          valid: false,
          error: "Invalid or expired invite token",
        };
      }

      return {
        valid: true,
        email: invite.email,
        role: invite.role,
        roleDisplay: getRoleDisplay(invite.role),
        businesses: invite.businesses,
        expiresAt: invite.expiresAt,
      };
    }),

  // Get invite statistics (OWNER only)
  stats: ownerProcedure.handler(async () => {
    const now = new Date();

    // Count by status
    const [pending] = await db
      .select({ count: count() })
      .from(staffInvite)
      .where(
        and(eq(staffInvite.status, "PENDING"), gte(staffInvite.expiresAt, now))
      );

    const [accepted] = await db
      .select({ count: count() })
      .from(staffInvite)
      .where(eq(staffInvite.status, "ACCEPTED"));

    const [expired] = await db
      .select({ count: count() })
      .from(staffInvite)
      .where(
        or(
          eq(staffInvite.status, "EXPIRED"),
          and(eq(staffInvite.status, "PENDING"), lt(staffInvite.expiresAt, now))
        )
      );

    const [revoked] = await db
      .select({ count: count() })
      .from(staffInvite)
      .where(eq(staffInvite.status, "REVOKED"));

    return {
      pending: pending?.count ?? 0,
      accepted: accepted?.count ?? 0,
      expired: expired?.count ?? 0,
      revoked: revoked?.count ?? 0,
    };
  }),

  // Bootstrap: Check if bootstrap is needed and status
  bootstrapStatus: publicProcedure.handler(async () => {
    // Check if any staff exist
    const [existingStaff] = await db
      .select({ id: staff.id })
      .from(staff)
      .limit(1);

    if (existingStaff) {
      return {
        needsBootstrap: false,
        message: "System already has staff members",
      };
    }

    // Check if there's a valid bootstrap token
    const [validToken] = await db
      .select({ id: bootstrapToken.id, expiresAt: bootstrapToken.expiresAt })
      .from(bootstrapToken)
      .where(
        and(
          isNull(bootstrapToken.usedAt),
          gte(bootstrapToken.expiresAt, new Date())
        )
      )
      .limit(1);

    return {
      needsBootstrap: true,
      hasValidBootstrapToken: Boolean(validToken),
      bootstrapTokenExpires: validToken?.expiresAt ?? null,
      message: "System needs initial OWNER setup",
    };
  }),
};
