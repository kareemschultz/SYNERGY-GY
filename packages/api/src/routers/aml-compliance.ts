import { client, clientAmlAssessment, db, staff } from "@SYNERGY-GY/db";
import { ORPCError } from "@orpc/server";
import { and, asc, desc, eq, gte, lte } from "drizzle-orm";
import { z } from "zod";
import {
  adminProcedure,
  getAccessibleBusinesses,
  type Staff,
  staffProcedure,
} from "../index";
import {
  calculateNextReviewDate,
  calculateRiskScore,
  type RiskScoreInput,
} from "../utils/risk-scoring";

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
 * Validate that staff can access an AML assessment (via client)
 */
async function validateAssessmentAccess(
  staffRecord: Staff | null,
  assessmentId: string
): Promise<boolean> {
  const assessment = await db.query.clientAmlAssessment.findFirst({
    where: eq(clientAmlAssessment.id, assessmentId),
    columns: { clientId: true },
  });

  if (!assessment) {
    return false;
  }

  return validateClientAccess(staffRecord, assessment.clientId);
}

/**
 * Get client IDs accessible to staff based on business assignments
 */
async function getAccessibleClientIds(
  staffRecord: Staff | null
): Promise<string[]> {
  const accessibleBusinesses = getAccessibleBusinesses(staffRecord);
  if (accessibleBusinesses.length === 0) {
    return [];
  }

  const clients = await db.query.client.findMany({
    columns: { id: true, businesses: true },
  });

  return clients
    .filter((c) =>
      c.businesses.some((b) => accessibleBusinesses.includes(b as Business))
    )
    .map((c) => c.id);
}

// Enum values
const riskRatingValues = ["LOW", "MEDIUM", "HIGH", "PROHIBITED"] as const;
const pepCategoryValues = ["DOMESTIC", "FOREIGN", "INTERNATIONAL_ORG"] as const;
const sourceOfFundsValues = [
  "EMPLOYMENT",
  "BUSINESS",
  "INHERITANCE",
  "INVESTMENTS",
  "OTHER",
] as const;
// Assessment status values (used in database enum):
// "PENDING" | "APPROVED" | "REJECTED" | "UNDER_REVIEW"

// Zod schemas
const calculateRiskScoreSchema = z.object({
  clientType: z.enum([
    "INDIVIDUAL",
    "SMALL_BUSINESS",
    "CORPORATION",
    "NGO",
    "COOP",
    "CREDIT_UNION",
    "FOREIGN_NATIONAL",
    "INVESTOR",
  ]),
  serviceTypes: z.array(z.string()),
  country: z.string(),
  isPep: z.boolean(),
  hasBeneficialOwners: z.boolean(),
  pepCount: z.number().min(0),
  transactionAmount: z.number().optional(),
  isFirstTimeClient: z.boolean(),
});

const createAssessmentSchema = z.object({
  clientId: z.string().uuid(),
  clientTypeRisk: z.number().min(0).max(25),
  serviceRisk: z.number().min(0).max(25),
  geographicRisk: z.number().min(0).max(25),
  transactionRisk: z.number().min(0).max(25),
  totalRiskScore: z.number().min(0).max(100),
  riskRating: z.enum(riskRatingValues),
  isPep: z.boolean().default(false),
  pepCategory: z.enum(pepCategoryValues).optional(),
  pepPosition: z.string().optional(),
  pepJurisdiction: z.string().optional(),
  requiresEdd: z.boolean(),
  eddReasons: z.array(z.string()),
  sanctionsScreened: z.boolean().default(false),
  sanctionsScreenedAt: z.string().optional(), // ISO date
  sanctionsMatch: z.boolean().default(false),
  sourceOfFunds: z.enum(sourceOfFundsValues).optional(),
  sourceOfFundsDetails: z.string().optional(),
  sourceOfWealth: z.string().optional(),
  notes: z.string().optional(),
});

const approveAssessmentSchema = z.object({
  id: z.string().uuid(),
  approved: z.boolean(),
  approvalNotes: z.string().optional(),
});

const listPendingReviewsSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  riskRating: z.enum(riskRatingValues).optional(),
});

// Router
export const amlComplianceRouter = {
  /**
   * Calculate risk score for a client
   * This is a utility endpoint that doesn't save to database
   */
  calculateRiskScore: staffProcedure
    .input(calculateRiskScoreSchema)
    .handler(({ input }) => {
      const riskInput: RiskScoreInput = {
        clientType: input.clientType,
        serviceTypes: input.serviceTypes,
        country: input.country,
        isPep: input.isPep,
        hasBeneficialOwners: input.hasBeneficialOwners,
        pepCount: input.pepCount,
        transactionAmount: input.transactionAmount,
        isFirstTimeClient: input.isFirstTimeClient,
      };

      const result = calculateRiskScore(riskInput);
      const nextReviewDate = calculateNextReviewDate(result.rating);

      return {
        ...result,
        nextReviewDate: nextReviewDate.toISOString(),
      };
    }),

  /**
   * Create a new AML assessment for a client
   */
  createAssessment: staffProcedure
    .input(createAssessmentSchema)
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

      // Get staff profile - use context.session?.user?.id for auth context
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

      // Calculate next review date
      const nextReviewDate = calculateNextReviewDate(input.riskRating);

      // Determine initial status
      const status =
        input.riskRating === "HIGH" || input.riskRating === "PROHIBITED"
          ? "PENDING"
          : "APPROVED";

      // Create assessment
      const [assessment] = await db
        .insert(clientAmlAssessment)
        .values({
          clientId: input.clientId,
          assessedById: staffProfile.id,
          assessmentDate: new Date().toISOString().split("T")[0] ?? "",
          clientTypeRisk: input.clientTypeRisk,
          serviceRisk: input.serviceRisk,
          geographicRisk: input.geographicRisk,
          transactionRisk: input.transactionRisk,
          totalRiskScore: input.totalRiskScore,
          riskRating: input.riskRating,
          isPep: input.isPep,
          pepCategory: input.pepCategory,
          pepPosition: input.pepPosition,
          pepJurisdiction: input.pepJurisdiction,
          requiresEdd: input.requiresEdd,
          eddReasons: input.eddReasons,
          sanctionsScreened: input.sanctionsScreened,
          sanctionsScreenedAt: input.sanctionsScreenedAt
            ? new Date(input.sanctionsScreenedAt)
            : null,
          sanctionsMatch: input.sanctionsMatch,
          sourceOfFunds: input.sourceOfFunds,
          sourceOfFundsDetails: input.sourceOfFundsDetails,
          sourceOfWealth: input.sourceOfWealth,
          status,
          nextReviewDate: nextReviewDate.toISOString().split("T")[0] as string,
          notes: input.notes,
        })
        .returning();

      // Update client risk rating
      // Note: client.amlRiskRating doesn't support "PROHIBITED", map to "HIGH"
      const clientRiskRating =
        input.riskRating === "PROHIBITED" ? "HIGH" : input.riskRating;
      await db
        .update(client)
        .set({
          amlRiskRating: clientRiskRating,
          isPep: input.isPep,
          requiresEnhancedDueDiligence: input.requiresEdd,
        })
        .where(eq(client.id, input.clientId));

      return assessment;
    }),

  /**
   * Get AML assessment for a client
   */
  getAssessment: staffProcedure
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

      const assessment = await db.query.clientAmlAssessment.findFirst({
        where: eq(clientAmlAssessment.clientId, input.clientId),
        orderBy: desc(clientAmlAssessment.assessmentDate),
        with: {
          client: true,
          assessedBy: true,
          approvedBy: true,
        },
      });

      return assessment;
    }),

  /**
   * Get all assessments for a client (history)
   */
  getAssessmentHistory: staffProcedure
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

      const assessments = await db.query.clientAmlAssessment.findMany({
        where: eq(clientAmlAssessment.clientId, input.clientId),
        orderBy: desc(clientAmlAssessment.assessmentDate),
        with: {
          assessedBy: true,
          approvedBy: true,
        },
      });

      return assessments;
    }),

  /**
   * Approve or reject an AML assessment (admin only)
   */
  approveAssessment: adminProcedure
    .input(approveAssessmentSchema)
    .handler(async ({ input, context }) => {
      // SECURITY: Validate assessment access via client
      const hasAccess = await validateAssessmentAccess(context.staff, input.id);
      if (!hasAccess) {
        throw new ORPCError("FORBIDDEN", {
          message: "You don't have access to this assessment",
        });
      }

      const existing = await db.query.clientAmlAssessment.findFirst({
        where: eq(clientAmlAssessment.id, input.id),
      });

      if (!existing) {
        throw new ORPCError("NOT_FOUND", {
          message: "AML assessment not found",
        });
      }

      // Get staff profile
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

      const [updated] = await db
        .update(clientAmlAssessment)
        .set({
          status: input.approved ? "APPROVED" : "REJECTED",
          approvedById: staffProfile.id,
          approvedAt: new Date(),
          rejectionReason: input.approved ? null : input.approvalNotes,
        })
        .where(eq(clientAmlAssessment.id, input.id))
        .returning();

      return updated;
    }),

  /**
   * Get pending AML reviews (admin only)
   */
  getPendingReviews: adminProcedure
    .input(listPendingReviewsSchema)
    .handler(async ({ input, context }) => {
      // SECURITY: Get accessible client IDs for business filtering
      const accessibleClientIds = await getAccessibleClientIds(context.staff);
      if (accessibleClientIds.length === 0) {
        return {
          assessments: [],
          pagination: {
            page: input.page,
            limit: input.limit,
            total: 0,
            totalPages: 0,
          },
        };
      }

      const offset = (input.page - 1) * input.limit;

      // Fetch pending assessments
      const allAssessments = await db.query.clientAmlAssessment.findMany({
        where: input.riskRating
          ? and(
              eq(clientAmlAssessment.status, "PENDING"),
              eq(clientAmlAssessment.riskRating, input.riskRating)
            )
          : eq(clientAmlAssessment.status, "PENDING"),
        orderBy: desc(clientAmlAssessment.assessmentDate),
        with: {
          client: true,
          assessedBy: true,
        },
      });

      // Filter to only accessible clients
      const filteredAssessments = allAssessments.filter((a) =>
        accessibleClientIds.includes(a.clientId)
      );

      const totalCount = filteredAssessments.length;
      const assessments = filteredAssessments.slice(
        offset,
        offset + input.limit
      );

      return {
        assessments,
        pagination: {
          page: input.page,
          limit: input.limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / input.limit),
        },
      };
    }),

  /**
   * Get clients requiring AML review (approaching review date)
   */
  getClientsRequiringReview: staffProcedure
    .input(
      z.object({
        daysAhead: z.number().min(1).max(365).default(30),
      })
    )
    .handler(async ({ input, context }) => {
      // SECURITY: Get accessible client IDs for business filtering
      const accessibleClientIds = await getAccessibleClientIds(context.staff);
      if (accessibleClientIds.length === 0) {
        return [];
      }

      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + input.daysAhead);

      const todayStr = today.toISOString().split("T")[0] as string;
      const futureDateStr = futureDate.toISOString().split("T")[0] as string;

      const assessments = await db.query.clientAmlAssessment.findMany({
        where: and(
          gte(clientAmlAssessment.nextReviewDate, todayStr),
          lte(clientAmlAssessment.nextReviewDate, futureDateStr)
        ),
        orderBy: asc(clientAmlAssessment.nextReviewDate),
        with: {
          client: true,
        },
      });

      // Filter to only accessible clients
      return assessments.filter((a) =>
        accessibleClientIds.includes(a.clientId)
      );
    }),

  /**
   * Screen client against sanctions lists (mock implementation)
   * In production, this would integrate with ComplyAdvantage, Refinitiv, etc.
   */
  screenSanctions: staffProcedure
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

      const clientRecord = await db.query.client.findFirst({
        where: eq(client.id, input.clientId),
      });

      if (!clientRecord) {
        throw new ORPCError("NOT_FOUND", {
          message: "Client not found",
        });
      }

      // Mock implementation - always returns no match
      // In production, integrate with sanctions screening API
      const screeningResult = {
        screened: true,
        screenedAt: new Date().toISOString(),
        match: false,
        matchDetails: null as string | null,
      };

      // Log screening in assessment if exists
      const existingAssessment = await db.query.clientAmlAssessment.findFirst({
        where: eq(clientAmlAssessment.clientId, input.clientId),
        orderBy: desc(clientAmlAssessment.assessmentDate),
      });

      if (existingAssessment) {
        await db
          .update(clientAmlAssessment)
          .set({
            sanctionsScreened: true,
            sanctionsScreenedAt: new Date(),
            sanctionsMatch: false,
          })
          .where(eq(clientAmlAssessment.id, existingAssessment.id));
      }

      return screeningResult;
    }),
};
