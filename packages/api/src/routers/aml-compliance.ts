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
const pepCategoryValues = [
  "HEAD_OF_STATE",
  "GOVERNMENT_OFFICIAL",
  "JUDICIAL_OFFICIAL",
  "MILITARY_OFFICIAL",
  "STATE_OWNED_EXECUTIVE",
  "POLITICAL_PARTY_OFFICIAL",
  "INTERNATIONAL_ORGANIZATION",
  "FAMILY_MEMBER",
  "CLOSE_ASSOCIATE",
] as const;
const sourceOfFundsValues = [
  "EMPLOYMENT",
  "BUSINESS",
  "INVESTMENTS",
  "INHERITANCE",
  "SAVINGS",
  "GIFT",
  "LOAN",
  "OTHER",
] as const;
const _assessmentStatusValues = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "UNDER_REVIEW",
] as const;

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
  sourceOfFunds: z.array(z.enum(sourceOfFundsValues)),
  sourceOfFundsDetails: z.string().optional(),
  sourceOfWealth: z.string().optional(),
  expectedTransactionVolume: z.string().optional(),
  businessPurpose: z.string().optional(),
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
    .query(({ input }) => {
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
    .mutation(async ({ input, context }) => {
      // Verify client exists
      const clientExists = await db.query.client.findFirst({
        where: eq(client.id, input.clientId),
      });

      if (!clientExists) {
        throw new ORPCError({
          code: "NOT_FOUND",
          message: "Client not found",
        });
      }

      // Get staff profile
      const staffProfile = await db.query.staff.findFirst({
        where: eq(staff.userId, context.user.id),
      });

      if (!staffProfile) {
        throw new ORPCError({
          code: "FORBIDDEN",
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
          assessmentDate: new Date(),
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
          expectedTransactionVolume: input.expectedTransactionVolume,
          businessPurpose: input.businessPurpose,
          status,
          nextReviewDate: nextReviewDate.toISOString().split("T")[0],
          notes: input.notes,
        })
        .returning();

      // Update client risk rating
      await db
        .update(client)
        .set({
          amlRiskRating: input.riskRating,
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
    .query(async ({ input }) => {
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
    .query(async ({ input }) => {
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
    .mutation(async ({ input, context }) => {
      const existing = await db.query.clientAmlAssessment.findFirst({
        where: eq(clientAmlAssessment.id, input.id),
      });

      if (!existing) {
        throw new ORPCError({
          code: "NOT_FOUND",
          message: "AML assessment not found",
        });
      }

      // Get staff profile
      const staffProfile = await db.query.staff.findFirst({
        where: eq(staff.userId, context.user.id),
      });

      if (!staffProfile) {
        throw new ORPCError({
          code: "FORBIDDEN",
          message: "Staff profile not found",
        });
      }

      const [updated] = await db
        .update(clientAmlAssessment)
        .set({
          status: input.approved ? "APPROVED" : "REJECTED",
          approvedById: staffProfile.id,
          approvedAt: new Date(),
          approvalNotes: input.approvalNotes,
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
    .query(async ({ input }) => {
      const offset = (input.page - 1) * input.limit;

      const where = input.riskRating
        ? and(
            eq(clientAmlAssessment.status, "PENDING"),
            eq(clientAmlAssessment.riskRating, input.riskRating)
          )
        : eq(clientAmlAssessment.status, "PENDING");

      const [assessments, [{ count: totalCount }]] = await Promise.all([
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

      return {
        assessments,
        pagination: {
          page: input.page,
          limit: input.limit,
          total: totalCount || 0,
          totalPages: Math.ceil((totalCount || 0) / input.limit),
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
    .query(async ({ input }) => {
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + input.daysAhead);

      const todayStr = today.toISOString().split("T")[0];
      const futureDateStr = futureDate.toISOString().split("T")[0];

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
    .mutation(async ({ input }) => {
      const clientRecord = await db.query.client.findFirst({
        where: eq(client.id, input.clientId),
      });

      if (!clientRecord) {
        throw new ORPCError({
          code: "NOT_FOUND",
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
