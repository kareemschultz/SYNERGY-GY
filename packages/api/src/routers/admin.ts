import { account, db, passwordSetupToken, staff, user } from "@SYNERGY-GY/db";
import { randomUUID } from "node:crypto";
import { ORPCError } from "@orpc/server";
import { and, asc, count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { z } from "zod";
import { adminProcedure } from "../index";
import { getAppUrl } from "../utils/app-url";
import { sendStaffPasswordSetup } from "../utils/email";
import { generateSecureToken, hashPassword } from "../utils/password";

// Staff role values
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
const createStaffSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  role: z.enum(staffRoleValues),
  businesses: z
    .array(z.enum(businessValues))
    .min(1, "At least one business required"),
  phone: z.string().optional(),
  jobTitle: z.string().optional(),
  canViewFinancials: z.boolean().optional(),
  // Account setup options
  sendInviteEmail: z.boolean().default(true),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .optional(),
});

const updateStaffSchema = z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.enum(staffRoleValues).optional(),
  businesses: z.array(z.enum(businessValues)).min(1).optional(),
  phone: z.string().optional(),
  jobTitle: z.string().optional(),
  canViewFinancials: z.boolean().optional(),
});

const listStaffSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  search: z.string().optional(),
  role: z.enum(staffRoleValues).optional(),
  business: z.enum(businessValues).optional(),
  isActive: z.boolean().optional(),
  sortBy: z.enum(["name", "email", "createdAt"]).default("name"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

const toggleActiveSchema = z.object({
  id: z.string(),
  isActive: z.boolean(),
});

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

// Admin router
export const adminRouter = {
  staff: {
    // List all staff with pagination and filters
    list: adminProcedure.input(listStaffSchema).handler(async ({ input }) => {
      const conditions: Array<
        ReturnType<typeof eq> | ReturnType<typeof or> | ReturnType<typeof sql>
      > = [];

      // Search filter
      if (input.search) {
        const searchTerm = `%${input.search}%`;
        conditions.push(
          or(
            ilike(user.name, searchTerm),
            ilike(user.email, searchTerm),
            ilike(staff.jobTitle, searchTerm)
          )
        );
      }

      // Role filter
      if (input.role) {
        conditions.push(eq(staff.role, input.role));
      }

      // Business filter - staff must have access to the business
      if (input.business) {
        conditions.push(
          sql`${staff.businesses} && ARRAY[${input.business}]::text[]`
        );
      }

      // Active filter
      if (input.isActive !== undefined) {
        conditions.push(eq(staff.isActive, input.isActive));
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count
      const countResult = await db
        .select({ total: count() })
        .from(staff)
        .innerJoin(user, eq(staff.userId, user.id))
        .where(whereClause);

      const total = countResult[0]?.total ?? 0;

      // Get paginated results with user details
      const offset = (input.page - 1) * input.limit;

      // Determine sort column and table
      const orderColumn =
        input.sortBy === "name" || input.sortBy === "email"
          ? user[input.sortBy]
          : staff[input.sortBy];
      const orderDirection = input.sortOrder === "asc" ? asc : desc;

      const results = await db
        .select({
          id: staff.id,
          userId: staff.userId,
          role: staff.role,
          businesses: staff.businesses,
          phone: staff.phone,
          jobTitle: staff.jobTitle,
          isActive: staff.isActive,
          createdAt: staff.createdAt,
          updatedAt: staff.updatedAt,
          userName: user.name,
          userEmail: user.email,
          userImage: user.image,
        })
        .from(staff)
        .innerJoin(user, eq(staff.userId, user.id))
        .where(whereClause)
        .orderBy(orderDirection(orderColumn))
        .limit(input.limit)
        .offset(offset);

      return {
        staff: results,
        total,
        page: input.page,
        limit: input.limit,
        totalPages: Math.ceil(total / input.limit),
      };
    }),

    // Get single staff by ID with full details
    getById: adminProcedure
      .input(z.object({ id: z.string() }))
      .handler(async ({ input }) => {
        const result = await db.query.staff.findFirst({
          where: eq(staff.id, input.id),
          with: {
            user: true,
          },
        });

        if (!result) {
          throw new ORPCError("NOT_FOUND", {
            message: "Staff member not found",
          });
        }

        return result;
      }),

    // Create new staff member (creates user + staff profile)
    create: adminProcedure
      .input(createStaffSchema)
      .handler(async ({ input, context }) => {
        const {
          name,
          email,
          role,
          businesses,
          phone,
          jobTitle,
          canViewFinancials,
          sendInviteEmail = true,
          password,
        } = input;

        // Check if email already exists
        const existingUser = await db.query.user.findFirst({
          where: eq(user.email, email),
        });

        if (existingUser) {
          throw new ORPCError("BAD_REQUEST", {
            message: "A user with this email already exists",
          });
        }

        // Validate business access matches role
        validateBusinessAccess(role, businesses);

        // Use Better Auth to create user account
        // For now, we'll create user manually - in production, use Better Auth signup
        // Generate a unique ID for the user using UUID
        const userId = randomUUID();

        const newUserResult = await db
          .insert(user)
          .values({
            id: userId,
            name,
            email,
            emailVerified: true, // Auto-verify admin-created accounts
          })
          .returning();

        const newUser = newUserResult[0];
        if (!newUser) {
          throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "Failed to create user account",
          });
        }

        // Create staff profile
        const [newStaff] = await db
          .insert(staff)
          .values({
            userId: newUser.id,
            role,
            businesses,
            phone: phone || null,
            jobTitle: jobTitle || null,
            isActive: true,
            canViewFinancials: canViewFinancials ?? undefined,
          })
          .returning();

        // Handle account setup based on method chosen
        let setupMethod: "email" | "local";

        if (!sendInviteEmail && password) {
          // LOCAL PASSWORD: Admin set password directly
          const hashedPassword = await hashPassword(password);
          await db.insert(account).values({
            id: randomUUID(),
            accountId: newUser.id,
            providerId: "credential",
            userId: newUser.id,
            password: hashedPassword,
          });
          setupMethod = "local";
        } else {
          // EMAIL INVITE: Send setup email (default behavior)
          const setupToken = generateSecureToken();
          const expiresAt = new Date();
          expiresAt.setHours(expiresAt.getHours() + 24); // 24-hour expiry

          await db.insert(passwordSetupToken).values({
            id: randomUUID(),
            userId: newUser.id,
            token: setupToken,
            expiresAt,
          });

          const setupUrl = `${getAppUrl()}/staff/setup-password?token=${setupToken}`;

          // Get the name of the admin who created this staff member
          const invitedByName = context.session.user.name || "GK-Nexus Admin";

          // Send password setup email
          await sendStaffPasswordSetup({
            staffName: name,
            email,
            setupUrl,
            expiresInHours: 24,
            invitedBy: invitedByName,
          });
          setupMethod = "email";
        }

        return {
          ...newStaff,
          user: newUser,
          setupMethod,
        };
      }),

    // Update existing staff member
    update: adminProcedure
      .input(updateStaffSchema)
      // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Auto-fix
      .handler(async ({ input }) => {
        const {
          id,
          name,
          email,
          role,
          businesses,
          phone,
          jobTitle,
          canViewFinancials,
        } = input;

        // Check staff exists
        const existing = await db.query.staff.findFirst({
          where: eq(staff.id, id),
          with: { user: true },
        });

        if (!existing) {
          throw new ORPCError("NOT_FOUND", {
            message: "Staff member not found",
          });
        }

        // Type assertion for user relation (Drizzle returns union type)
        const existingUser = existing.user as { name: string; email: string };

        // If updating email, check it's not taken
        if (email && email !== existingUser.email) {
          const emailTaken = await db.query.user.findFirst({
            where: eq(user.email, email),
          });
          if (emailTaken) {
            throw new ORPCError("BAD_REQUEST", {
              message: "Email is already in use by another user",
            });
          }
        }

        // Validate business access matches role if both are being updated
        const finalRole = role || existing.role;
        const finalBusinesses = businesses || existing.businesses;
        validateBusinessAccess(finalRole, finalBusinesses as string[]);

        // Update user details if provided
        if (name || email) {
          await db
            .update(user)
            .set({
              name: name || existingUser.name,
              email: email || existingUser.email,
            })
            .where(eq(user.id, existing.userId));
        }

        // Update staff details
        const staffUpdates: Record<string, unknown> = {};
        if (role) {
          staffUpdates.role = role;
        }
        if (businesses) {
          staffUpdates.businesses = businesses;
        }
        if (phone !== undefined) {
          staffUpdates.phone = phone || null;
        }
        if (jobTitle !== undefined) {
          staffUpdates.jobTitle = jobTitle || null;
        }
        if (canViewFinancials !== undefined) {
          staffUpdates.canViewFinancials = canViewFinancials;
        }

        if (Object.keys(staffUpdates).length > 0) {
          await db
            .update(staff)
            .set(staffUpdates)
            .where(eq(staff.id, id))
            .returning();

          // Fetch complete updated record
          const result = await db.query.staff.findFirst({
            where: eq(staff.id, id),
            with: { user: true },
          });

          return result;
        }

        // If nothing to update, return existing
        return existing;
      }),

    // Toggle staff active/inactive status
    toggleActive: adminProcedure
      .input(toggleActiveSchema)
      .handler(async ({ input, context }) => {
        const { id, isActive } = input;

        // Check staff exists
        const existing = await db.query.staff.findFirst({
          where: eq(staff.id, id),
          with: { user: true },
        });

        if (!existing) {
          throw new ORPCError("NOT_FOUND", {
            message: "Staff member not found",
          });
        }

        // Prevent deactivating self
        if (context.staff?.id === id && !isActive) {
          throw new ORPCError("BAD_REQUEST", {
            message: "You cannot deactivate your own account",
          });
        }

        // Update status
        const [updated] = await db
          .update(staff)
          .set({ isActive })
          .where(eq(staff.id, id))
          .returning();

        return {
          ...updated,
          user: existing.user,
        };
      }),

    // Get staff statistics
    stats: adminProcedure.handler(async () => {
      // Total staff count
      const totalStaffResult = await db
        .select({ totalStaff: count() })
        .from(staff);
      const totalStaff = totalStaffResult[0]?.totalStaff ?? 0;

      // Active staff count
      const activeStaffResult = await db
        .select({ activeStaff: count() })
        .from(staff)
        .where(eq(staff.isActive, true));
      const activeStaff = activeStaffResult[0]?.activeStaff ?? 0;

      // Staff by role
      const byRole = await db
        .select({
          role: staff.role,
          count: count(),
        })
        .from(staff)
        .where(eq(staff.isActive, true))
        .groupBy(staff.role);

      // Staff by business
      const gcmcStaff = await db
        .select({ count: count() })
        .from(staff)
        .where(
          and(
            eq(staff.isActive, true),
            sql`${staff.businesses} && ARRAY['GCMC']::text[]`
          )
        );

      const kajStaff = await db
        .select({ count: count() })
        .from(staff)
        .where(
          and(
            eq(staff.isActive, true),
            sql`${staff.businesses} && ARRAY['KAJ']::text[]`
          )
        );

      return {
        totalStaff,
        activeStaff,
        inactiveStaff: totalStaff - activeStaff,
        byRole: byRole.map((r) => ({
          role: r.role,
          roleDisplay: getRoleDisplay(r.role),
          count: r.count,
        })),
        byBusiness: {
          GCMC: gcmcStaff[0]?.count || 0,
          KAJ: kajStaff[0]?.count || 0,
        },
      };
    }),

    // Resend password setup link to staff member
    resendSetupLink: adminProcedure
      .input(z.object({ staffId: z.string() }))
      .handler(async ({ input, context }) => {
        // Get staff member with user info
        const staffMember = await db.query.staff.findFirst({
          where: eq(staff.id, input.staffId),
          with: { user: true },
        });

        if (!staffMember) {
          throw new ORPCError("NOT_FOUND", {
            message: "Staff member not found",
          });
        }

        // Check if user already has credentials (account exists)
        const existingAccount = await db.query.account.findFirst({
          where: eq(account.userId, staffMember.userId),
        });

        if (existingAccount) {
          throw new ORPCError("BAD_REQUEST", {
            message:
              "This user already has a password set. Use 'Reset Password' instead.",
          });
        }

        // Delete any existing unused tokens for this user
        await db
          .delete(passwordSetupToken)
          .where(eq(passwordSetupToken.userId, staffMember.userId));

        // Generate new setup token
        const setupToken = generateSecureToken();
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        await db.insert(passwordSetupToken).values({
          id: randomUUID(),
          userId: staffMember.userId,
          token: setupToken,
          expiresAt,
        });

        const setupUrl = `${getAppUrl()}/staff/setup-password?token=${setupToken}`;

        const invitedByName = context.session.user.name || "GK-Nexus Admin";

        // Type assertion for user relation (Drizzle returns union type)
        const staffUser = staffMember.user as { name: string; email: string };

        // Send password setup email
        await sendStaffPasswordSetup({
          staffName: staffUser.name,
          email: staffUser.email,
          setupUrl,
          expiresInHours: 24,
          invitedBy: invitedByName,
        });

        return {
          success: true,
          message: `Password setup link sent to ${staffUser.email}`,
          email: staffUser.email,
        };
      }),

    // Reset password for existing user (generates new setup token)
    resetPassword: adminProcedure
      .input(z.object({ staffId: z.string() }))
      .handler(async ({ input, context }) => {
        // Get staff member with user info
        const staffMember = await db.query.staff.findFirst({
          where: eq(staff.id, input.staffId),
          with: { user: true },
        });

        if (!staffMember) {
          throw new ORPCError("NOT_FOUND", {
            message: "Staff member not found",
          });
        }

        // Delete any existing account credentials
        await db.delete(account).where(eq(account.userId, staffMember.userId));

        // Delete any existing setup tokens
        await db
          .delete(passwordSetupToken)
          .where(eq(passwordSetupToken.userId, staffMember.userId));

        // Generate new setup token
        const setupToken = generateSecureToken();
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        await db.insert(passwordSetupToken).values({
          id: randomUUID(),
          userId: staffMember.userId,
          token: setupToken,
          expiresAt,
        });

        // Use getAppUrl() to avoid invalid URLs when CORS_ORIGIN is "*"
        const setupUrl = `${getAppUrl()}/staff/setup-password?token=${setupToken}`;

        const invitedByName = context.session.user.name || "GK-Nexus Admin";

        // Type assertion for user relation (Drizzle returns union type)
        const resetStaffUser = staffMember.user as {
          name: string;
          email: string;
        };

        // Send password reset email
        await sendStaffPasswordSetup({
          staffName: resetStaffUser.name,
          email: resetStaffUser.email,
          setupUrl,
          expiresInHours: 24,
          invitedBy: invitedByName,
        });

        return {
          success: true,
          message: `Password reset link sent to ${resetStaffUser.email}`,
          email: resetStaffUser.email,
        };
      }),

    // Check if staff member has set up their password
    checkPasswordStatus: adminProcedure
      .input(z.object({ staffId: z.string() }))
      .handler(async ({ input }) => {
        const staffMember = await db.query.staff.findFirst({
          where: eq(staff.id, input.staffId),
          with: { user: true },
        });

        if (!staffMember) {
          throw new ORPCError("NOT_FOUND", {
            message: "Staff member not found",
          });
        }

        // Check if user has credentials
        const existingAccount = await db.query.account.findFirst({
          where: eq(account.userId, staffMember.userId),
        });

        // Check for pending setup token
        const pendingToken = await db.query.passwordSetupToken.findFirst({
          where: and(
            eq(passwordSetupToken.userId, staffMember.userId),
            sql`${passwordSetupToken.usedAt} IS NULL`,
            sql`${passwordSetupToken.expiresAt} > NOW()`
          ),
        });

        return {
          hasPassword: !!existingAccount,
          hasPendingSetup: !!pendingToken,
          pendingSetupExpires: pendingToken?.expiresAt || null,
        };
      }),
  },
};
