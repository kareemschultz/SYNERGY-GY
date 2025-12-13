import { db, document, documentVerification, staff } from "@SYNERGY-GY/db";
import { ORPCError } from "@orpc/server";
import { and, asc, eq, gte, lte } from "drizzle-orm";
import { z } from "zod";
import { staffProcedure } from "../index";

// Enum values
const _verificationStatusValues = [
  "PENDING",
  "VERIFIED",
  "REJECTED",
  "EXPIRED",
  "REQUIRES_RENEWAL",
] as const;

// Zod schemas
const createVerificationSchema = z.object({
  documentId: z.string().uuid(),
  issueDate: z.string().optional(), // ISO date string
  expiryDate: z.string().optional(), // ISO date string
  issuingAuthority: z.string().optional(),
  documentNumber: z.string().optional(),
  renewalReminderDays: z.number().min(1).max(365).default(30),
  notes: z.string().optional(),
});

const verifyDocumentSchema = z.object({
  verificationId: z.string().uuid(),
  approved: z.boolean(),
  rejectionReason: z.string().optional(),
  notes: z.string().optional(),
});

const updateVerificationSchema = z.object({
  verificationId: z.string().uuid(),
  issueDate: z.string().optional(),
  expiryDate: z.string().optional(),
  issuingAuthority: z.string().optional(),
  documentNumber: z.string().optional(),
  renewalReminderDays: z.number().min(1).max(365).optional(),
  notes: z.string().optional(),
});

const getExpiringDocumentsSchema = z.object({
  daysAhead: z.number().min(1).max(365).default(30),
  includeNotified: z.boolean().default(false),
});

// Router
export const documentVerificationRouter = {
  /**
   * Create a verification record for a document
   */
  create: staffProcedure
    .input(createVerificationSchema)
    .handler(async ({ input }) => {
      // Verify document exists
      const documentRecord = await db.query.document.findFirst({
        where: eq(document.id, input.documentId),
      });

      if (!documentRecord) {
        throw new ORPCError({
          code: "NOT_FOUND",
          message: "Document not found",
        });
      }

      // Check if verification already exists
      const existing = await db.query.documentVerification.findFirst({
        where: eq(documentVerification.documentId, input.documentId),
      });

      if (existing) {
        throw new ORPCError({
          code: "CONFLICT",
          message: "Verification record already exists for this document",
        });
      }

      // Validate dates
      if (input.issueDate && input.expiryDate) {
        const issue = new Date(input.issueDate);
        const expiry = new Date(input.expiryDate);

        if (issue >= expiry) {
          throw new ORPCError({
            code: "BAD_REQUEST",
            message: "Issue date must be before expiry date",
          });
        }

        const today = new Date();
        if (expiry < today) {
          throw new ORPCError({
            code: "BAD_REQUEST",
            message: "Expiry date must be in the future",
          });
        }
      }

      const [verification] = await db
        .insert(documentVerification)
        .values({
          documentId: input.documentId,
          verificationStatus: "PENDING",
          issueDate: input.issueDate,
          expiryDate: input.expiryDate,
          issuingAuthority: input.issuingAuthority,
          documentNumber: input.documentNumber,
          renewalReminderDays: input.renewalReminderDays,
          notes: input.notes,
        })
        .returning();

      return verification;
    }),

  /**
   * Get verification status for a document
   */
  get: staffProcedure
    .input(z.object({ documentId: z.string().uuid() }))
    .handler(async ({ input }) => {
      const verification = await db.query.documentVerification.findFirst({
        where: eq(documentVerification.documentId, input.documentId),
        with: {
          document: true,
          verifiedBy: true,
        },
      });

      if (!verification) {
        throw new ORPCError({
          code: "NOT_FOUND",
          message: "Verification record not found",
        });
      }

      return verification;
    }),

  /**
   * Verify or reject a document
   */
  verify: staffProcedure
    .input(verifyDocumentSchema)
    .handler(async ({ input, context }) => {
      const existing = await db.query.documentVerification.findFirst({
        where: eq(documentVerification.id, input.verificationId),
      });

      if (!existing) {
        throw new ORPCError({
          code: "NOT_FOUND",
          message: "Verification record not found",
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

      const status = input.approved ? "VERIFIED" : "REJECTED";

      const [updated] = await db
        .update(documentVerification)
        .set({
          verificationStatus: status,
          verifiedById: staffProfile.id,
          verifiedAt: new Date(),
          rejectionReason: input.approved ? null : input.rejectionReason,
          notes: input.notes || existing.notes,
        })
        .where(eq(documentVerification.id, input.verificationId))
        .returning();

      return updated;
    }),

  /**
   * Update verification details
   */
  update: staffProcedure
    .input(updateVerificationSchema)
    .handler(async ({ input }) => {
      const { verificationId, ...updates } = input;

      const existing = await db.query.documentVerification.findFirst({
        where: eq(documentVerification.id, verificationId),
      });

      if (!existing) {
        throw new ORPCError({
          code: "NOT_FOUND",
          message: "Verification record not found",
        });
      }

      // Validate dates if both provided
      if (updates.issueDate && updates.expiryDate) {
        const issue = new Date(updates.issueDate);
        const expiry = new Date(updates.expiryDate);

        if (issue >= expiry) {
          throw new ORPCError({
            code: "BAD_REQUEST",
            message: "Issue date must be before expiry date",
          });
        }
      }

      const [updated] = await db
        .update(documentVerification)
        .set(updates)
        .where(eq(documentVerification.id, verificationId))
        .returning();

      return updated;
    }),

  /**
   * Get documents expiring soon
   */
  getExpiringDocuments: staffProcedure
    .input(getExpiringDocumentsSchema)
    .handler(async ({ input }) => {
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + input.daysAhead);

      const todayStr = today.toISOString().split("T")[0];
      const futureDateStr = futureDate.toISOString().split("T")[0];

      const where = input.includeNotified
        ? and(
            gte(documentVerification.expiryDate, todayStr),
            lte(documentVerification.expiryDate, futureDateStr)
          )
        : and(
            gte(documentVerification.expiryDate, todayStr),
            lte(documentVerification.expiryDate, futureDateStr),
            eq(documentVerification.expiryNotificationSent, false)
          );

      const verifications = await db.query.documentVerification.findMany({
        where,
        orderBy: asc(documentVerification.expiryDate),
        with: {
          document: {
            with: {
              client: true,
            },
          },
        },
      });

      return verifications;
    }),

  /**
   * Mark expiry notification as sent
   */
  markNotificationSent: staffProcedure
    .input(z.object({ verificationId: z.string().uuid() }))
    .handler(async ({ input }) => {
      const existing = await db.query.documentVerification.findFirst({
        where: eq(documentVerification.id, input.verificationId),
      });

      if (!existing) {
        throw new ORPCError({
          code: "NOT_FOUND",
          message: "Verification record not found",
        });
      }

      const [updated] = await db
        .update(documentVerification)
        .set({
          expiryNotificationSent: true,
          expiryNotificationSentAt: new Date(),
        })
        .where(eq(documentVerification.id, input.verificationId))
        .returning();

      return updated;
    }),

  /**
   * Check and update expired documents
   * This would typically run as a background job
   */
  checkExpiredDocuments: staffProcedure.handler(async () => {
    const today = new Date().toISOString().split("T")[0];

    const expiredVerifications = await db.query.documentVerification.findMany({
      where: and(
        lte(documentVerification.expiryDate, today),
        eq(documentVerification.verificationStatus, "VERIFIED")
      ),
    });

    if (expiredVerifications.length === 0) {
      return { updated: 0 };
    }

    // Update all to EXPIRED status
    const expiredIds = expiredVerifications.map((v) => v.id);

    for (const id of expiredIds) {
      await db
        .update(documentVerification)
        .set({
          verificationStatus: "EXPIRED",
        })
        .where(eq(documentVerification.id, id));
    }

    return { updated: expiredIds.length };
  }),

  /**
   * Get verification statistics
   */
  getStatistics: staffProcedure.handler(async () => {
    const allVerifications = await db
      .select({
        status: documentVerification.verificationStatus,
      })
      .from(documentVerification);

    const stats = {
      total: allVerifications.length,
      pending: allVerifications.filter((v) => v.status === "PENDING").length,
      verified: allVerifications.filter((v) => v.status === "VERIFIED").length,
      rejected: allVerifications.filter((v) => v.status === "REJECTED").length,
      expired: allVerifications.filter((v) => v.status === "EXPIRED").length,
      requiresRenewal: allVerifications.filter(
        (v) => v.status === "REQUIRES_RENEWAL"
      ).length,
    };

    return stats;
  }),
};
