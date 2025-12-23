import {
  client,
  db,
  knowledgeBaseDownload,
  knowledgeBaseItem,
  matter,
} from "@SYNERGY-GY/db";
import { ORPCError } from "@orpc/server";
import { and, count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { z } from "zod";
import { adminProcedure, publicProcedure, staffProcedure } from "../index";
import {
  downloadPdfFromUrl,
  fileExists,
  generateFileName,
  sleep,
} from "../utils/kb-form-downloader";
import {
  getSeederStaffId,
  seedKnowledgeBaseForms,
} from "../utils/kb-seed-data";

// Category enum for validation
const categoryEnum = z.enum([
  "GRA",
  "NIS",
  "IMMIGRATION",
  "DCRA",
  "GENERAL",
  "TRAINING",
  "INTERNAL",
]);

// Helper type for batch download item
type KbItem = {
  id: string;
  title: string;
  category: string;
  directPdfUrl: string | null;
  storagePath: string | null;
};

// Helper function to process a single form download
async function processFormDownload(
  item: KbItem
): Promise<{ status: "downloaded" | "failed"; error?: string }> {
  if (!item.directPdfUrl) {
    return { status: "failed", error: "No direct PDF URL" };
  }

  // Update last download attempt
  await db
    .update(knowledgeBaseItem)
    .set({ lastDownloadAttempt: new Date(), lastDownloadError: null })
    .where(eq(knowledgeBaseItem.id, item.id));

  // Generate filename and download
  const fileName = generateFileName(item.title, item.category);
  const result = await downloadPdfFromUrl(
    item.directPdfUrl,
    item.category,
    fileName
  );

  if (!result.success) {
    await db
      .update(knowledgeBaseItem)
      .set({ lastDownloadError: result.error || "Unknown error" })
      .where(eq(knowledgeBaseItem.id, item.id));
    return { status: "failed", error: result.error };
  }

  // Update KB item with file info
  await db
    .update(knowledgeBaseItem)
    .set({
      fileName: result.fileName,
      storagePath: result.storagePath,
      mimeType: result.mimeType,
      fileSize: result.fileSize,
      lastDownloadError: null,
    })
    .where(eq(knowledgeBaseItem.id, item.id));

  return { status: "downloaded" };
}

// Helper type for stats calculation
type StatsItem = {
  directPdfUrl: string | null;
  storagePath: string | null;
  lastDownloadError: string | null;
};

// Helper function to classify a form item's download status
function classifyFormStatus(
  item: StatsItem
): "downloaded" | "pending" | "failed" {
  if (!item.directPdfUrl) {
    return "pending";
  }
  if (item.storagePath && fileExists(item.storagePath)) {
    return "downloaded";
  }
  if (item.lastDownloadError) {
    return "failed";
  }
  return "pending";
}

export const knowledgeBaseRouter = {
  /**
   * List KB items with filters (accessible to staff and clients)
   */
  list: publicProcedure
    .input(
      z.object({
        type: z
          .enum(["AGENCY_FORM", "LETTER_TEMPLATE", "GUIDE", "CHECKLIST"])
          .optional(),
        category: z
          .enum([
            "GRA",
            "NIS",
            "IMMIGRATION",
            "DCRA",
            "GENERAL",
            "TRAINING",
            "INTERNAL",
          ])
          .optional(),
        business: z.enum(["GCMC", "KAJ"]).optional(),
        search: z.string().optional(),
        isStaffOnly: z.boolean().optional(),
        isFeatured: z.boolean().optional(),
        page: z.number().default(1),
        limit: z.number().default(50),
      })
    )
    .handler(async ({ input, context }) => {
      const {
        type,
        category,
        business,
        search,
        isStaffOnly,
        isFeatured,
        page,
        limit,
      } = input;

      const conditions: ReturnType<typeof eq>[] = [
        eq(knowledgeBaseItem.isActive, true),
      ];

      // If not staff, only return client-accessible items
      if (!context.session?.user) {
        conditions.push(eq(knowledgeBaseItem.isStaffOnly, false));
      }

      if (type) {
        conditions.push(eq(knowledgeBaseItem.type, type));
      }

      if (category) {
        conditions.push(eq(knowledgeBaseItem.category, category));
      }

      if (business) {
        const businessCondition = or(
          eq(knowledgeBaseItem.business, business),
          sql`${knowledgeBaseItem.business} IS NULL`
        );
        if (businessCondition) {
          conditions.push(businessCondition);
        }
      }

      if (isStaffOnly !== undefined) {
        conditions.push(eq(knowledgeBaseItem.isStaffOnly, isStaffOnly));
      }

      if (isFeatured !== undefined) {
        conditions.push(eq(knowledgeBaseItem.isFeatured, isFeatured));
      }

      if (search) {
        const searchCondition = or(
          ilike(knowledgeBaseItem.title, `%${search}%`),
          ilike(knowledgeBaseItem.description, `%${search}%`)
        );
        if (searchCondition) {
          conditions.push(searchCondition);
        }
      }

      const offset = (page - 1) * limit;

      const items = await db.query.knowledgeBaseItem.findMany({
        where: and(...conditions),
        limit,
        offset,
        orderBy: [
          desc(knowledgeBaseItem.isFeatured),
          desc(knowledgeBaseItem.createdAt),
        ],
        with: {
          createdBy: {
            columns: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      const [totalCount] = await db
        .select({ count: count() })
        .from(knowledgeBaseItem)
        .where(and(...conditions));

      return {
        items,
        pagination: {
          page,
          limit,
          total: totalCount?.count || 0,
          totalPages: Math.ceil((totalCount?.count || 0) / limit),
        },
      };
    }),

  /**
   * Get single KB item by ID
   */
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .handler(async ({ input, context }) => {
      const item = await db.query.knowledgeBaseItem.findFirst({
        where: and(
          eq(knowledgeBaseItem.id, input.id),
          eq(knowledgeBaseItem.isActive, true)
        ),
        with: {
          createdBy: {
            columns: {
              id: true,
              name: true,
              email: true,
            },
          },
          lastUpdatedBy: {
            columns: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!item) {
        throw new Error("Knowledge base item not found");
      }

      // Check staff-only access
      if (item.isStaffOnly && !context.session?.user) {
        throw new Error("This resource is only available to staff");
      }

      return item;
    }),

  /**
   * Download KB file (logs download)
   */
  download: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        clientId: z.string().uuid().optional(), // For client downloads
      })
    )
    .handler(async ({ input, context }) => {
      const item = await db.query.knowledgeBaseItem.findFirst({
        where: and(
          eq(knowledgeBaseItem.id, input.id),
          eq(knowledgeBaseItem.isActive, true)
        ),
      });

      if (!item) {
        throw new Error("Knowledge base item not found");
      }

      // Check staff-only access - use session user for staff check
      const user = context.session?.user;
      if (item.isStaffOnly && !user) {
        throw new Error("This resource is only available to staff");
      }

      // Log download - use session user ID if available
      const downloadedBy = user?.id;
      const downloadedByType = user ? "STAFF" : "CLIENT";

      if (downloadedBy) {
        await db.insert(knowledgeBaseDownload).values({
          knowledgeBaseItemId: item.id,
          downloadedById: downloadedBy,
          downloadedByType,
          clientId: input.clientId,
        });
      }

      // Return download URL (in real implementation, generate signed URL)
      return {
        id: item.id,
        fileName: item.fileName,
        storagePath: item.storagePath,
        mimeType: item.mimeType,
        // downloadUrl: generateSignedUrl(item.storagePath)
      };
    }),

  /**
   * Auto-fill form with client/matter data (staff only)
   * Returns placeholder mappings for document generation
   */
  autoFill: staffProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        clientId: z.string().uuid().optional(),
        matterId: z.string().uuid().optional(),
      })
    )
    .handler(async ({ input }) => {
      const item = await db.query.knowledgeBaseItem.findFirst({
        where: eq(knowledgeBaseItem.id, input.id),
      });

      if (!item) {
        throw new Error("Knowledge base item not found");
      }

      if (!item.supportsAutoFill) {
        throw new Error("This item does not support auto-fill");
      }

      // Fetch client data
      let clientData: Awaited<ReturnType<typeof db.query.client.findFirst>>;
      if (input.clientId) {
        clientData = await db.query.client.findFirst({
          where: eq(client.id, input.clientId),
        });
      }

      // Fetch matter data
      let matterData: Awaited<
        ReturnType<typeof db.query.matter.findFirst>
      > | null = null;
      if (input.matterId) {
        matterData = await db.query.matter.findFirst({
          where: eq(matter.id, input.matterId),
          with: {
            client: true,
          },
        });
      }

      // Build placeholder replacements for document generation
      const placeholderValues: Record<string, string> = {};

      if (clientData) {
        placeholderValues.client_name =
          clientData.displayName ||
          `${clientData.firstName} ${clientData.lastName}`;
        placeholderValues.client_salutation = clientData.firstName || "Client";
        placeholderValues.client_address = clientData.address || "";
        placeholderValues.client_email = clientData.email || "";
        placeholderValues.client_phone = clientData.phone || "";
        placeholderValues.tin_number = clientData.tinNumber || "";
      }

      if (matterData) {
        placeholderValues.matter_number = matterData.referenceNumber;
        placeholderValues.matter_title = matterData.title;
        placeholderValues.service_description =
          matterData.description || matterData.title;
      }

      // Add date placeholders
      const now = new Date();
      placeholderValues.current_date = now.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      placeholderValues.tax_year = String(now.getFullYear() - 1);

      return {
        success: true,
        itemId: item.id,
        templateId: item.templateId,
        storagePath: item.storagePath,
        fileName: item.fileName,
        clientData,
        matterData,
        placeholderValues,
        downloadUrl: `/api/knowledge-base/download/${item.id}?clientId=${input.clientId || ""}`,
      };
    }),

  /**
   * Admin: Create KB item
   */
  create: adminProcedure
    .input(
      z.object({
        type: z.enum(["AGENCY_FORM", "LETTER_TEMPLATE", "GUIDE", "CHECKLIST"]),
        category: z.enum([
          "GRA",
          "NIS",
          "IMMIGRATION",
          "DCRA",
          "GENERAL",
          "TRAINING",
          "INTERNAL",
        ]),
        business: z.enum(["GCMC", "KAJ"]).nullable(),
        title: z.string().min(1),
        description: z.string().min(1),
        shortDescription: z.string().optional(),
        fileName: z.string().optional(),
        storagePath: z.string().optional(),
        mimeType: z.string().optional(),
        fileSize: z.number().optional(),
        content: z.string().optional(), // For guides/checklists
        supportsAutoFill: z.boolean(),
        templateId: z.string().uuid().optional(),
        relatedServices: z.array(z.string()),
        requiredFor: z.array(z.string()),
        agencyUrl: z.string().optional(),
        governmentFees: z.string().optional(),
        isStaffOnly: z.boolean(),
        isFeatured: z.boolean(),
      })
    )
    .handler(async ({ input, context }) => {
      const staffId = context.staff?.id;
      if (!staffId) {
        throw new Error("Staff profile not found");
      }

      const [created] = await db
        .insert(knowledgeBaseItem)
        .values({
          ...input,
          createdById: staffId,
        })
        .returning();

      return created;
    }),

  /**
   * Admin: Update KB item
   */
  update: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        type: z
          .enum(["AGENCY_FORM", "LETTER_TEMPLATE", "GUIDE", "CHECKLIST"])
          .optional(),
        category: z
          .enum([
            "GRA",
            "NIS",
            "IMMIGRATION",
            "DCRA",
            "GENERAL",
            "TRAINING",
            "INTERNAL",
          ])
          .optional(),
        business: z.enum(["GCMC", "KAJ"]).nullable().optional(),
        title: z.string().min(1).optional(),
        description: z.string().min(1).optional(),
        shortDescription: z.string().optional(),
        fileName: z.string().optional(),
        storagePath: z.string().optional(),
        mimeType: z.string().optional(),
        fileSize: z.number().optional(),
        content: z.string().optional(),
        supportsAutoFill: z.boolean().optional(),
        templateId: z.string().uuid().optional(),
        relatedServices: z.array(z.string()).optional(),
        requiredFor: z.array(z.string()).optional(),
        agencyUrl: z.string().optional(),
        governmentFees: z.string().optional(),
        isStaffOnly: z.boolean().optional(),
        isFeatured: z.boolean().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const { id, ...updateData } = input;

      const staffId = context.staff?.id;
      if (!staffId) {
        throw new Error("Staff profile not found");
      }

      const [updated] = await db
        .update(knowledgeBaseItem)
        .set({
          ...updateData,
          lastUpdatedById: staffId,
          version: sql`${knowledgeBaseItem.version} + 1`,
        })
        .where(eq(knowledgeBaseItem.id, id))
        .returning();

      return updated;
    }),

  /**
   * Admin: Soft delete KB item
   */
  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .handler(async ({ input }) => {
      await db
        .update(knowledgeBaseItem)
        .set({ isActive: false })
        .where(eq(knowledgeBaseItem.id, input.id));

      return { success: true };
    }),

  /**
   * Get download statistics for a KB item (admin)
   */
  getDownloadStats: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .handler(async ({ input }) => {
      const downloads = await db.query.knowledgeBaseDownload.findMany({
        where: eq(knowledgeBaseDownload.knowledgeBaseItemId, input.id),
        orderBy: (t) => desc(t.createdAt),
        limit: 100,
      });

      const totalDownloads = downloads.length;
      const staffDownloads = downloads.filter(
        (d) => d.downloadedByType === "STAFF"
      ).length;
      const clientDownloads = downloads.filter(
        (d) => d.downloadedByType === "CLIENT"
      ).length;

      return {
        totalDownloads,
        staffDownloads,
        clientDownloads,
        recentDownloads: downloads.slice(0, 10),
      };
    }),

  /**
   * Get most popular KB items (admin analytics)
   */
  getPopularItems: adminProcedure
    .input(
      z.object({
        limit: z.number().default(10),
        type: z
          .enum(["AGENCY_FORM", "LETTER_TEMPLATE", "GUIDE", "CHECKLIST"])
          .optional(),
      })
    )
    .handler(async ({ input }) => {
      const { limit: inputLimit, type } = input;

      const conditions: ReturnType<typeof eq>[] = [];
      if (type) {
        conditions.push(eq(knowledgeBaseItem.type, type));
      }

      // Get download counts per item
      const downloadCounts = await db
        .select({
          itemId: knowledgeBaseDownload.knowledgeBaseItemId,
          downloads: count(knowledgeBaseDownload.id),
        })
        .from(knowledgeBaseDownload)
        .groupBy(knowledgeBaseDownload.knowledgeBaseItemId)
        .orderBy(({ downloads }) => desc(downloads))
        .limit(inputLimit);

      // Fetch the actual items
      const items = await Promise.all(
        downloadCounts.map(async ({ itemId, downloads }) => {
          const item = await db.query.knowledgeBaseItem.findFirst({
            where: and(
              eq(knowledgeBaseItem.id, itemId),
              ...(conditions.length > 0 ? conditions : [])
            ),
          });

          return item ? { ...item, downloadCount: downloads } : null;
        })
      );

      return items.filter((item) => item !== null);
    }),

  /**
   * Admin: Seed government forms and letter templates
   * Seeds 70+ government forms and 6 letter templates into the Knowledge Base.
   */
  seedForms: adminProcedure.handler(async ({ context }) => {
    // Get the staff ID to use as the creator
    const staffId = context.staff?.id;
    if (!staffId) {
      // Try to find an owner staff ID as fallback
      const fallbackStaffId = await getSeederStaffId();
      if (!fallbackStaffId) {
        throw new ORPCError("BAD_REQUEST", {
          message:
            "No staff member found to use as creator. Please ensure at least one staff member exists.",
        });
      }
    }

    const creatorId = staffId || (await getSeederStaffId());
    if (!creatorId) {
      throw new ORPCError("BAD_REQUEST", {
        message: "Could not determine a valid staff ID for seeding.",
      });
    }

    // Perform the seeding
    const result = await seedKnowledgeBaseForms(creatorId);

    if (!result.success && result.errors.length > 0) {
      // Return partial success with error details
      return {
        success: false,
        message: `Seeding completed with ${result.errors.length} errors`,
        inserted: result.inserted,
        updated: result.updated,
        skipped: result.skipped,
        total: result.total,
        errors: result.errors.slice(0, 10), // Limit to first 10 errors
      };
    }

    return {
      success: true,
      message: `Successfully seeded Knowledge Base with ${result.inserted} new items and updated ${result.updated} existing items.`,
      inserted: result.inserted,
      updated: result.updated,
      skipped: result.skipped,
      total: result.total,
    };
  }),

  /**
   * Admin: Download a single form from its direct PDF URL
   */
  downloadFormFromAgency: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        forceRedownload: z.boolean().default(false),
      })
    )
    .handler(async ({ input }) => {
      const item = await db.query.knowledgeBaseItem.findFirst({
        where: eq(knowledgeBaseItem.id, input.id),
      });

      if (!item) {
        throw new ORPCError("NOT_FOUND", {
          message: "Knowledge base item not found",
        });
      }

      if (!item.directPdfUrl) {
        throw new ORPCError("BAD_REQUEST", {
          message:
            "This item does not have a direct PDF URL. Set the directPdfUrl first.",
        });
      }

      // Check if already downloaded (unless force redownload)
      if (item.storagePath && !input.forceRedownload) {
        const exists = fileExists(item.storagePath);
        if (exists) {
          return {
            success: true,
            message: "File already exists",
            alreadyExists: true,
            storagePath: item.storagePath,
            fileName: item.fileName,
          };
        }
      }

      // Update last download attempt
      await db
        .update(knowledgeBaseItem)
        .set({
          lastDownloadAttempt: new Date(),
          lastDownloadError: null,
        })
        .where(eq(knowledgeBaseItem.id, input.id));

      // Generate filename from title and category
      const fileName = generateFileName(item.title, item.category);

      // Attempt download
      const result = await downloadPdfFromUrl(
        item.directPdfUrl,
        item.category,
        fileName
      );

      if (!result.success) {
        // Record the error
        await db
          .update(knowledgeBaseItem)
          .set({
            lastDownloadError: result.error || "Unknown error",
          })
          .where(eq(knowledgeBaseItem.id, input.id));

        return {
          success: false,
          error: result.error,
          errorCode: result.errorCode,
        };
      }

      // Update the KB item with file info
      await db
        .update(knowledgeBaseItem)
        .set({
          fileName: result.fileName,
          storagePath: result.storagePath,
          mimeType: result.mimeType,
          fileSize: result.fileSize,
          lastDownloadError: null,
        })
        .where(eq(knowledgeBaseItem.id, input.id));

      return {
        success: true,
        message: "File downloaded successfully",
        fileName: result.fileName,
        storagePath: result.storagePath,
        fileSize: result.fileSize,
      };
    }),

  /**
   * Admin: Batch download all forms with direct PDF URLs
   */
  downloadAllFormsFromAgencies: adminProcedure
    .input(
      z.object({
        category: categoryEnum.optional(),
        skipExisting: z.boolean().default(true),
        dryRun: z.boolean().default(false),
      })
    )
    .handler(async ({ input }) => {
      const conditions: ReturnType<typeof eq>[] = [
        eq(knowledgeBaseItem.isActive, true),
        sql`${knowledgeBaseItem.directPdfUrl} IS NOT NULL`,
      ];

      if (input.category) {
        conditions.push(eq(knowledgeBaseItem.category, input.category));
      }

      const items = await db.query.knowledgeBaseItem.findMany({
        where: and(...conditions),
        orderBy: [desc(knowledgeBaseItem.category)],
      });

      const result = {
        processed: 0,
        downloaded: 0,
        skipped: 0,
        failed: 0,
        errors: [] as { id: string; title: string; error: string }[],
      };

      for (const item of items) {
        result.processed += 1;

        // Skip if file exists and skipExisting is true
        const shouldSkip =
          input.skipExisting &&
          item.storagePath &&
          fileExists(item.storagePath);
        if (shouldSkip) {
          result.skipped += 1;
          continue;
        }

        // Dry run - just count
        if (input.dryRun) {
          result.downloaded += 1;
          continue;
        }

        // Rate limiting between actual downloads
        const needsDelay = result.downloaded > 0 || result.failed > 0;
        if (needsDelay) {
          await sleep(2000);
        }

        // Process the download using helper function
        const downloadResult = await processFormDownload(item);

        if (downloadResult.status === "failed") {
          result.failed += 1;
          result.errors.push({
            id: item.id,
            title: item.title,
            error: downloadResult.error || "Unknown error",
          });
          continue;
        }

        result.downloaded += 1;
      }

      return {
        success: result.failed === 0,
        message: input.dryRun
          ? `Dry run complete: ${result.downloaded} forms would be downloaded`
          : `Downloaded ${result.downloaded} forms, skipped ${result.skipped}, failed ${result.failed}`,
        ...result,
      };
    }),

  /**
   * Admin: Get download status statistics
   */
  getFormDownloadStatus: adminProcedure.handler(async () => {
    // Get counts for different states
    const allItems = await db
      .select({
        id: knowledgeBaseItem.id,
        category: knowledgeBaseItem.category,
        directPdfUrl: knowledgeBaseItem.directPdfUrl,
        storagePath: knowledgeBaseItem.storagePath,
        lastDownloadError: knowledgeBaseItem.lastDownloadError,
      })
      .from(knowledgeBaseItem)
      .where(
        and(
          eq(knowledgeBaseItem.isActive, true),
          eq(knowledgeBaseItem.type, "AGENCY_FORM")
        )
      );

    const stats = {
      total: allItems.length,
      withDirectUrl: 0,
      downloaded: 0,
      pending: 0,
      failed: 0,
      byCategory: {} as Record<
        string,
        { total: number; downloaded: number; pending: number; failed: number }
      >,
    };

    for (const item of allItems) {
      // Initialize category stats if not exists
      if (!stats.byCategory[item.category]) {
        stats.byCategory[item.category] = {
          total: 0,
          downloaded: 0,
          pending: 0,
          failed: 0,
        };
      }

      const categoryStats = stats.byCategory[item.category];
      if (!categoryStats) {
        continue;
      }

      categoryStats.total += 1;

      // Count items with direct URL
      if (item.directPdfUrl) {
        stats.withDirectUrl += 1;
      }

      // Classify and update stats using helper
      const status = classifyFormStatus(item);
      stats[status] += 1;
      categoryStats[status] += 1;
    }

    return stats;
  }),

  /**
   * Admin: Update the direct PDF URL for a KB item
   */
  updateDirectPdfUrl: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        directPdfUrl: z.string().url().nullable(),
      })
    )
    .handler(async ({ input, context }) => {
      const staffId = context.staff?.id;
      if (!staffId) {
        throw new ORPCError("UNAUTHORIZED", {
          message: "Staff profile not found",
        });
      }

      const [updated] = await db
        .update(knowledgeBaseItem)
        .set({
          directPdfUrl: input.directPdfUrl,
          lastUpdatedById: staffId,
          // Clear download error when URL changes
          lastDownloadError: null,
        })
        .where(eq(knowledgeBaseItem.id, input.id))
        .returning();

      if (!updated) {
        throw new ORPCError("NOT_FOUND", {
          message: "Knowledge base item not found",
        });
      }

      return {
        success: true,
        id: updated.id,
        directPdfUrl: updated.directPdfUrl,
      };
    }),
};
