import { client, clientAmlAssessment, db, staff } from "@SYNERGY-GY/db";
import { ORPCError } from "@orpc/server";
import { and, asc, desc, eq, gte, lte } from "drizzle-orm";
import { z } from "zod";
import { adminProcedure, staffProcedure } from "../index";
import {
  calculateNextReviewDate,
  calculateRiskScore,
  type RiskScoreInput,
} from "../utils/risk-scoring";

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
    .handler(async ({ input }) => {
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
    .handler(async ({ input }) => {
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
    .handler(async ({ input }) => {
      const offset = (input.page - 1) * input.limit;

      const where = input.riskRating
        ? and(
            eq(clientAmlAssessment.status, "PENDING"),
            eq(clientAmlAssessment.riskRating, input.riskRating)
          )
        : eq(clientAmlAssessment.status, "PENDING");

      const [assessments, countResult] = await Promise.all([
        db.query.clientAmlAssessment.findMany({
          where,
          orderBy: desc(clientAmlAssessment.assessmentDate),
          limit: input.limit,
          offset,
          with: {
            client: true,
            assessedBy: true,
          },
        }),
        db
          .select({ count: db.$count(clientAmlAssessment.id) })
          .from(clientAmlAssessment)
          .where(where),
      ]);

      const totalCount = countResult[0]?.count ?? 0;

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
    .handler(async ({ input }) => {
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

      return assessments;
    }),

  /**
   * Screen client against sanctions lists (mock implementation)
   * In production, this would integrate with ComplyAdvantage, Refinitiv, etc.
   */
  screenSanctions: staffProcedure
    .input(z.object({ clientId: z.string().uuid() }))
    .handler(async ({ input }) => {
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
