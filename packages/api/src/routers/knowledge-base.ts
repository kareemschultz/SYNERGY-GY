import {
  client,
  db,
  knowledgeBaseDownload,
  knowledgeBaseItem,
  matter,
} from "@SYNERGY-GY/db";
import { and, count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { z } from "zod";
import { adminProcedure, publicProcedure, staffProcedure } from "../index";

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

      // In real implementation, call document template generation here
      // using the templateId and the client/matter data

      return {
        success: true,
        itemId: item.id,
        templateId: item.templateId,
        clientData,
        matterData,
        // generatedContent: ... (from template engine)
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
};
