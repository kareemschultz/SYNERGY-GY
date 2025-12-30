import { ORPCError, os } from "@orpc/server";
import type { Context, Staff } from "./context";

export const o = os.$context<Context>();

// Base procedure without any middleware (for truly public endpoints)
export const baseProcedure = o;

export const publicProcedure = o;

// Middleware: Require authenticated user
// biome-ignore lint/suspicious/useAwait: Auto-fix
const requireAuth = o.middleware(async ({ context, next }) => {
  if (!context.session?.user) {
    throw new ORPCError("UNAUTHORIZED");
  }
  return next({
    context: {
      session: context.session,
      staff: context.staff,
    },
  });
});

export const protectedProcedure = publicProcedure.use(requireAuth);

// Staff role types
export type StaffRole =
  | "OWNER"
  | "GCMC_MANAGER"
  | "KAJ_MANAGER"
  | "STAFF_GCMC"
  | "STAFF_KAJ"
  | "STAFF_BOTH"
  | "RECEPTIONIST";

// Admin roles (can manage staff and settings)
const ADMIN_ROLES: StaffRole[] = ["OWNER", "GCMC_MANAGER", "KAJ_MANAGER"];

// Manager roles (can manage their business operations)
const MANAGER_ROLES: StaffRole[] = ["OWNER", "GCMC_MANAGER", "KAJ_MANAGER"];

// Roles that can access GCMC data
const GCMC_ROLES: StaffRole[] = [
  "OWNER",
  "GCMC_MANAGER",
  "STAFF_GCMC",
  "STAFF_BOTH",
];

// Roles that can access KAJ data
const KAJ_ROLES: StaffRole[] = [
  "OWNER",
  "KAJ_MANAGER",
  "STAFF_KAJ",
  "STAFF_BOTH",
];

// Middleware: Require staff profile (must be a staff member)
// biome-ignore lint/suspicious/useAwait: Auto-fix
const requireStaff = o.middleware(async ({ context, next }) => {
  if (!context.session?.user) {
    throw new ORPCError("UNAUTHORIZED");
  }
  if (!context.staff) {
    throw new ORPCError("FORBIDDEN", {
      message: "Staff profile required",
    });
  }
  if (!context.staff.isActive) {
    throw new ORPCError("FORBIDDEN", {
      message: "Staff account is deactivated",
    });
  }
  return next({
    context: {
      session: context.session,
      staff: context.staff,
    },
  });
});

export const staffProcedure = publicProcedure.use(requireStaff);

// Middleware factory: Require specific roles
const requireRole = (allowedRoles: StaffRole[]) =>
  // biome-ignore lint/suspicious/useAwait: Auto-fix
  o.middleware(async ({ context, next }) => {
    if (!context.session?.user) {
      throw new ORPCError("UNAUTHORIZED");
    }
    if (!context.staff) {
      throw new ORPCError("FORBIDDEN", {
        message: "Staff profile required",
      });
    }
    if (!context.staff.isActive) {
      throw new ORPCError("FORBIDDEN", {
        message: "Staff account is deactivated",
      });
    }
    if (!allowedRoles.includes(context.staff.role as StaffRole)) {
      throw new ORPCError("FORBIDDEN", {
        message: "Insufficient permissions",
      });
    }
    return next({
      context: {
        session: context.session,
        staff: context.staff,
      },
    });
  });

// Admin procedure (Owner and Managers)
export const adminProcedure = publicProcedure.use(requireRole(ADMIN_ROLES));

// Owner-only procedure (for sensitive operations like creating invites)
export const ownerProcedure = publicProcedure.use(requireRole(["OWNER"]));

// Manager procedure
export const managerProcedure = publicProcedure.use(requireRole(MANAGER_ROLES));

// GCMC-only procedure
export const gcmcProcedure = publicProcedure.use(requireRole(GCMC_ROLES));

// KAJ-only procedure
export const kajProcedure = publicProcedure.use(requireRole(KAJ_ROLES));

// Helper to check if staff can access a business
export function canAccessBusiness(
  staff: Staff | null,
  business: "GCMC" | "KAJ"
): boolean {
  if (!staff?.isActive) {
    return false;
  }
  const role = staff.role as StaffRole;

  if (role === "OWNER") {
    return true;
  }
  if (business === "GCMC") {
    return GCMC_ROLES.includes(role);
  }
  if (business === "KAJ") {
    return KAJ_ROLES.includes(role);
  }
  return false;
}

// Helper to get accessible businesses for a staff member
export function getAccessibleBusinesses(
  staff: Staff | null
): ("GCMC" | "KAJ")[] {
  if (!staff?.isActive) {
    return [];
  }
  const role = staff.role as StaffRole;

  if (role === "OWNER" || role === "STAFF_BOTH") {
    return ["GCMC", "KAJ"];
  }
  if (GCMC_ROLES.includes(role) && !KAJ_ROLES.includes(role)) {
    return ["GCMC"];
  }
  if (KAJ_ROLES.includes(role) && !GCMC_ROLES.includes(role)) {
    return ["KAJ"];
  }
  return [];
}

// Roles that can view financial data by default
const FINANCIAL_ROLES: StaffRole[] = ["OWNER", "GCMC_MANAGER", "KAJ_MANAGER"];

/**
 * Check if staff member can view financial data
 * Financial access is determined by:
 * 1. Explicit canViewFinancials permission on staff record (if set)
 * 2. Default based on role: OWNER and MANAGERs can view, others cannot
 */
export function canViewFinancials(staff: Staff | null): boolean {
  if (!staff?.isActive) {
    return false;
  }

  // If explicit permission is set, use it
  if (staff.canViewFinancials !== null) {
    return staff.canViewFinancials;
  }

  // Otherwise, default based on role
  const role = staff.role as StaffRole;
  return FINANCIAL_ROLES.includes(role);
}

// Middleware: Require financial access
// biome-ignore lint/suspicious/useAwait: Auto-fix
const requireFinancialAccess = o.middleware(async ({ context, next }) => {
  if (!context.session?.user) {
    throw new ORPCError("UNAUTHORIZED");
  }
  if (!context.staff) {
    throw new ORPCError("FORBIDDEN", {
      message: "Staff profile required",
    });
  }
  if (!context.staff.isActive) {
    throw new ORPCError("FORBIDDEN", {
      message: "Staff account is deactivated",
    });
  }
  if (!canViewFinancials(context.staff)) {
    throw new ORPCError("FORBIDDEN", {
      message: "You don't have permission to view financial data",
    });
  }
  return next({
    context: {
      session: context.session,
      staff: context.staff,
    },
  });
});

// Financial procedure - requires staff with financial access
export const financialProcedure = publicProcedure.use(requireFinancialAccess);

// Re-export context types
export type { Context, Staff } from "./context";
