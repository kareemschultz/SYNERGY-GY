import { client, clientBeneficialOwner, db, staff } from "@SYNERGY-GY/db";
import { ORPCError } from "@orpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getAccessibleBusinesses, type Staff, staffProcedure } from "../index";

// Business filtering helper type
type Business = "GCMC" | "KAJ";

/**
 * Validate that staff can access a client's business
 */
async function validateClientAccess(
  staffRecord: Staff | null,
  clientId: string
): Promise<boolean> {
  const accessibleBusinesses = getAccessibleBusinesses(staffRecord);
  if (accessibleBusinesses.length === 0) {
    return false;
  }

  const clientRecord = await db.query.client.findFirst({
    where: eq(client.id, clientId),
    columns: { businesses: true },
  });

  if (!clientRecord) {
    return false;
  }

  return clientRecord.businesses.some((b) =>
    accessibleBusinesses.includes(b as Business)
  );
}

/**
 * Validate that staff can access a beneficial owner (via client)
 */
async function validateBeneficialOwnerAccess(
  staffRecord: Staff | null,
  ownerId: string
): Promise<boolean> {
  const owner = await db.query.clientBeneficialOwner.findFirst({
    where: eq(clientBeneficialOwner.id, ownerId),
    columns: { clientId: true },
  });

  if (!owner) {
    return false;
  }

  return validateClientAccess(staffRecord, owner.clientId);
}

// Enum values
const ownershipTypeValues = ["DIRECT", "INDIRECT", "BENEFICIAL"] as const;
const riskLevelValues = ["LOW", "MEDIUM", "HIGH"] as const;
const pepRelationshipValues = [
  "FAMILY_MEMBER",
  "SELF",
  "CLOSE_ASSOCIATE",
] as const;

// Zod schemas
const createBeneficialOwnerSchema = z.object({
  clientId: z.string().uuid(),
  fullName: z.string().min(1, "Full name is required"),
  dateOfBirth: z.string(), // ISO date string
  nationality: z.string().min(1, "Nationality is required"),
  nationalId: z.string().optional(),
  passportNumber: z.string().optional(),
  ownershipPercentage: z
    .number()
    .min(25, "Ownership must be at least 25%")
    .max(100, "Ownership cannot exceed 100%"),
  ownershipType: z.enum(ownershipTypeValues),
  positionHeld: z.string().optional(),
  isPep: z.boolean().default(false),
  pepDetails: z.string().optional(),
  pepRelationship: z.enum(pepRelationshipValues).optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  riskLevel: z.enum(riskLevelValues).default("LOW"),
  riskNotes: z.string().optional(),
});

const updateBeneficialOwnerSchema = createBeneficialOwnerSchema
  .partial()
  .extend({
    id: z.string().uuid(),
  });

const verifyBeneficialOwnerSchema = z.object({
  id: z.string().uuid(),
  verificationDocumentId: z.string().uuid().optional(),
  riskNotes: z.string().optional(),
});

const listByClientSchema = z.object({
  clientId: z.string().uuid(),
  includeUnverified: z.boolean().default(true),
});

// Router
export const beneficialOwnersRouter = {
  /**
   * List all beneficial owners for a client
   */
  list: staffProcedure
    .input(listByClientSchema)
    .handler(async ({ input, context }) => {
      // SECURITY: Validate client access
      const hasAccess = await validateClientAccess(
        context.staff,
        input.clientId
      );
      if (!hasAccess) {
        throw new ORPCError("FORBIDDEN", {
          message: "You don't have access to this client",
        });
      }

      const owners = await db
        .select({
          id: clientBeneficialOwner.id,
          clientId: clientBeneficialOwner.clientId,
          fullName: clientBeneficialOwner.fullName,
          dateOfBirth: clientBeneficialOwner.dateOfBirth,
          nationality: clientBeneficialOwner.nationality,
          nationalId: clientBeneficialOwner.nationalId,
          passportNumber: clientBeneficialOwner.passportNumber,
          ownershipPercentage: clientBeneficialOwner.ownershipPercentage,
          ownershipType: clientBeneficialOwner.ownershipType,
          positionHeld: clientBeneficialOwner.positionHeld,
          isPep: clientBeneficialOwner.isPep,
          pepDetails: clientBeneficialOwner.pepDetails,
          pepRelationship: clientBeneficialOwner.pepRelationship,
          email: clientBeneficialOwner.email,
          phone: clientBeneficialOwner.phone,
          address: clientBeneficialOwner.address,
          riskLevel: clientBeneficialOwner.riskLevel,
          riskNotes: clientBeneficialOwner.riskNotes,
          isVerified: clientBeneficialOwner.isVerified,
          verifiedAt: clientBeneficialOwner.verifiedAt,
          verifiedById: clientBeneficialOwner.verifiedById,
          verificationDocumentId: clientBeneficialOwner.verificationDocumentId,
          createdAt: clientBeneficialOwner.createdAt,
          updatedAt: clientBeneficialOwner.updatedAt,
        })
        .from(clientBeneficialOwner)
        .where(
          input.includeUnverified
            ? eq(clientBeneficialOwner.clientId, input.clientId)
            : and(
                eq(clientBeneficialOwner.clientId, input.clientId),
                eq(clientBeneficialOwner.isVerified, true)
              )
        )
        .orderBy(desc(clientBeneficialOwner.ownershipPercentage));

      return owners;
    }),

  /**
   * Get a single beneficial owner by ID
   */
  get: staffProcedure
    .input(z.object({ id: z.string().uuid() }))
    .handler(async ({ input, context }) => {
      // SECURITY: Validate access via beneficial owner's client
      const hasAccess = await validateBeneficialOwnerAccess(
        context.staff,
        input.id
      );
      if (!hasAccess) {
        throw new ORPCError("FORBIDDEN", {
          message: "You don't have access to this beneficial owner",
        });
      }

      const owner = await db.query.clientBeneficialOwner.findFirst({
        where: eq(clientBeneficialOwner.id, input.id),
        with: {
          client: true,
          verifiedBy: true,
          verificationDocument: true,
        },
      });

      if (!owner) {
        throw new ORPCError("NOT_FOUND", {
          message: "Beneficial owner not found",
        });
      }

      return owner;
    }),

  /**
   * Create a new beneficial owner
   */
  create: staffProcedure
    .input(createBeneficialOwnerSchema)
    .handler(async ({ input, context }) => {
      // SECURITY: Validate client access
      const hasAccess = await validateClientAccess(
        context.staff,
        input.clientId
      );
      if (!hasAccess) {
        throw new ORPCError("FORBIDDEN", {
          message: "You don't have access to this client",
        });
      }

      // Verify client exists
      const clientExists = await db.query.client.findFirst({
        where: eq(client.id, input.clientId),
      });

      if (!clientExists) {
        throw new ORPCError("NOT_FOUND", {
          message: "Client not found",
        });
      }

      // Validate age (must be 18+)
      const birthDate = new Date(input.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      const actualAge =
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
          ? age - 1
          : age;

      if (actualAge < 18) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Beneficial owner must be at least 18 years old",
        });
      }

      // Create beneficial owner
      const [newOwner] = await db
        .insert(clientBeneficialOwner)
        .values({
          clientId: input.clientId,
          fullName: input.fullName,
          dateOfBirth: input.dateOfBirth,
          nationality: input.nationality,
          nationalId: input.nationalId,
          passportNumber: input.passportNumber,
          ownershipPercentage: input.ownershipPercentage,
          ownershipType: input.ownershipType,
          positionHeld: input.positionHeld,
          isPep: input.isPep,
          pepDetails: input.pepDetails,
          pepRelationship: input.pepRelationship,
          email: input.email,
          phone: input.phone,
          address: input.address,
          riskLevel: input.riskLevel,
          riskNotes: input.riskNotes,
        })
        .returning();

      return newOwner;
    }),

  /**
   * Update a beneficial owner
   */
  update: staffProcedure
    .input(updateBeneficialOwnerSchema)
    .handler(async ({ input, context }) => {
      const { id, ...updates } = input;

      // SECURITY: Validate access via beneficial owner's client
      const hasAccess = await validateBeneficialOwnerAccess(context.staff, id);
      if (!hasAccess) {
        throw new ORPCError("FORBIDDEN", {
          message: "You don't have access to this beneficial owner",
        });
      }

      // Verify exists
      const existing = await db.query.clientBeneficialOwner.findFirst({
        where: eq(clientBeneficialOwner.id, id),
      });

      if (!existing) {
        throw new ORPCError("NOT_FOUND", {
          message: "Beneficial owner not found",
        });
      }

      // Validate age if dateOfBirth is being updated
      if (updates.dateOfBirth) {
        const birthDate = new Date(updates.dateOfBirth);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        const actualAge =
          monthDiff < 0 ||
          (monthDiff === 0 && today.getDate() < birthDate.getDate())
            ? age - 1
            : age;

        if (actualAge < 18) {
          throw new ORPCError("BAD_REQUEST", {
            message: "Beneficial owner must be at least 18 years old",
          });
        }
      }

      // Map riskNotes to match schema if present
      const updateData = {
        ...updates,
        riskNotes: updates.riskNotes,
      };
      // Remove fields that don't exist in schema
      (updateData as Record<string, unknown>).clientId = undefined;

      const [updated] = await db
        .update(clientBeneficialOwner)
        .set(updateData)
        .where(eq(clientBeneficialOwner.id, id))
        .returning();

      return updated;
    }),

  /**
   * Delete a beneficial owner
   */
  delete: staffProcedure
    .input(z.object({ id: z.string().uuid() }))
    .handler(async ({ input, context }) => {
      // SECURITY: Validate access via beneficial owner's client
      const hasAccess = await validateBeneficialOwnerAccess(
        context.staff,
        input.id
      );
      if (!hasAccess) {
        throw new ORPCError("FORBIDDEN", {
          message: "You don't have access to this beneficial owner",
        });
      }

      const existing = await db.query.clientBeneficialOwner.findFirst({
        where: eq(clientBeneficialOwner.id, input.id),
      });

      if (!existing) {
        throw new ORPCError("NOT_FOUND", {
          message: "Beneficial owner not found",
        });
      }

      await db
        .delete(clientBeneficialOwner)
        .where(eq(clientBeneficialOwner.id, input.id));

      return { success: true };
    }),

  /**
   * Verify a beneficial owner
   */
  verify: staffProcedure
    .input(verifyBeneficialOwnerSchema)
    .handler(async ({ input, context }) => {
      // SECURITY: Validate access via beneficial owner's client
      const hasAccess = await validateBeneficialOwnerAccess(
        context.staff,
        input.id
      );
      if (!hasAccess) {
        throw new ORPCError("FORBIDDEN", {
          message: "You don't have access to this beneficial owner",
        });
      }

      const existing = await db.query.clientBeneficialOwner.findFirst({
        where: eq(clientBeneficialOwner.id, input.id),
      });

      if (!existing) {
        throw new ORPCError("NOT_FOUND", {
          message: "Beneficial owner not found",
        });
      }

      // Verify staff profile exists
      const userId = context.session?.user?.id;
      if (!userId) {
        throw new ORPCError("UNAUTHORIZED", {
          message: "User not authenticated",
        });
      }

      const staffProfile = await db.query.staff.findFirst({
        where: eq(staff.userId, userId),
      });

      if (!staffProfile) {
        throw new ORPCError("FORBIDDEN", {
          message: "Staff profile not found",
        });
      }

      const [verified] = await db
        .update(clientBeneficialOwner)
        .set({
          isVerified: true,
          verifiedAt: new Date(),
          verifiedById: staffProfile.id,
          verificationDocumentId: input.verificationDocumentId,
          riskNotes: input.riskNotes || existing.riskNotes,
        })
        .where(eq(clientBeneficialOwner.id, input.id))
        .returning();

      return verified;
    }),

  /**
   * Get total ownership percentage for a client
   */
  getTotalOwnership: staffProcedure
    .input(z.object({ clientId: z.string().uuid() }))
    .handler(async ({ input, context }) => {
      // SECURITY: Validate client access
      const hasAccess = await validateClientAccess(
        context.staff,
        input.clientId
      );
      if (!hasAccess) {
        throw new ORPCError("FORBIDDEN", {
          message: "You don't have access to this client",
        });
      }

      const owners = await db
        .select({
          ownershipPercentage: clientBeneficialOwner.ownershipPercentage,
        })
        .from(clientBeneficialOwner)
        .where(eq(clientBeneficialOwner.clientId, input.clientId));

      const totalPercentage = owners.reduce(
        (sum, owner) => sum + owner.ownershipPercentage,
        0
      );

      // Note: Total can exceed 100% due to indirect/beneficial ownership
      const warning =
        totalPercentage < 100
          ? "Total disclosed ownership is less than 100%. Ensure all beneficial owners (25%+ ownership) are disclosed."
          : undefined;

      return {
        totalPercentage,
        ownerCount: owners.length,
        warning,
      };
    }),
};
