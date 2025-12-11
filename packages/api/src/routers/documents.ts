import { db, document, documentTemplate } from "@SYNERGY-GY/db";
import { ORPCError } from "@orpc/server";
import { and, asc, count, desc, eq, ilike, isNull, or, sql } from "drizzle-orm";
import { z } from "zod";
import { getAccessibleBusinesses, staffProcedure } from "../index";

// Input schemas
const documentCategoryValues = [
  "IDENTITY",
  "TAX",
  "FINANCIAL",
  "LEGAL",
  "IMMIGRATION",
  "BUSINESS",
  "CORRESPONDENCE",
  "TRAINING",
  "OTHER",
] as const;

const documentStatusValues = ["PENDING", "ACTIVE", "ARCHIVED"] as const;

const listDocumentsSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  search: z.string().optional(),
  category: z.enum(documentCategoryValues).optional(),
  clientId: z.string().optional(),
  matterId: z.string().optional(),
  status: z.enum(documentStatusValues).default("ACTIVE"),
  sortBy: z
    .enum(["originalName", "createdAt", "fileSize", "expirationDate"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

const createDocumentSchema = z.object({
  fileName: z.string(),
  originalName: z.string(),
  mimeType: z.string(),
  fileSize: z.number(),
  storagePath: z.string(),
  category: z.enum(documentCategoryValues),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  clientId: z.string().optional(),
  matterId: z.string().optional(),
  expirationDate: z.string().optional(),
});

const updateDocumentSchema = z.object({
  id: z.string(),
  category: z.enum(documentCategoryValues).optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  clientId: z.string().nullable().optional(),
  matterId: z.string().nullable().optional(),
  expirationDate: z.string().nullable().optional(),
});

// Documents router
export const documentsRouter = {
  // List documents with pagination and filters
  list: staffProcedure.input(listDocumentsSchema).handler(async ({ input }) => {
    const conditions = [];

    // Status filter
    conditions.push(eq(document.status, input.status));

    // Search filter
    if (input.search) {
      const searchTerm = `%${input.search}%`;
      conditions.push(
        or(
          ilike(document.originalName, searchTerm),
          ilike(document.description, searchTerm)
        )
      );
    }

    // Category filter
    if (input.category) {
      conditions.push(eq(document.category, input.category));
    }

    // Client filter
    if (input.clientId) {
      conditions.push(eq(document.clientId, input.clientId));
    }

    // Matter filter
    if (input.matterId) {
      conditions.push(eq(document.matterId, input.matterId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [{ total }] = await db
      .select({ total: count() })
      .from(document)
      .where(whereClause);

    // Get paginated results
    const offset = (input.page - 1) * input.limit;
    const orderColumn = document[input.sortBy];
    const orderDirection = input.sortOrder === "asc" ? asc : desc;

    const documents = await db.query.document.findMany({
      where: whereClause,
      orderBy: [orderDirection(orderColumn)],
      limit: input.limit,
      offset,
      with: {
        client: {
          columns: { id: true, displayName: true },
        },
        matter: {
          columns: { id: true, referenceNumber: true, title: true },
        },
        uploadedBy: {
          columns: { id: true, name: true },
        },
      },
    });

    return {
      documents,
      total,
      page: input.page,
      limit: input.limit,
      totalPages: Math.ceil(total / input.limit),
    };
  }),

  // Get single document by ID
  getById: staffProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      const result = await db.query.document.findFirst({
        where: eq(document.id, input.id),
        with: {
          client: true,
          matter: true,
          uploadedBy: true,
        },
      });

      if (!result) {
        throw new ORPCError("NOT_FOUND", { message: "Document not found" });
      }

      return result;
    }),

  // Create new document (after file upload)
  create: staffProcedure
    .input(createDocumentSchema)
    .handler(async ({ input, context }) => {
      const [newDoc] = await db
        .insert(document)
        .values({
          ...input,
          uploadedById: context.session.user.id,
        })
        .returning();

      return newDoc;
    }),

  // Update document metadata
  update: staffProcedure
    .input(updateDocumentSchema)
    .handler(async ({ input }) => {
      const { id, ...updates } = input;

      const existing = await db.query.document.findFirst({
        where: eq(document.id, id),
      });

      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Document not found" });
      }

      const [updated] = await db
        .update(document)
        .set(updates)
        .where(eq(document.id, id))
        .returning();

      return updated;
    }),

  // Archive document (soft delete)
  archive: staffProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      const [updated] = await db
        .update(document)
        .set({
          status: "ARCHIVED",
          archivedAt: new Date(),
        })
        .where(eq(document.id, input.id))
        .returning();

      if (!updated) {
        throw new ORPCError("NOT_FOUND", { message: "Document not found" });
      }

      return updated;
    }),

  // Restore archived document
  restore: staffProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      const [updated] = await db
        .update(document)
        .set({
          status: "ACTIVE",
          archivedAt: null,
        })
        .where(eq(document.id, input.id))
        .returning();

      if (!updated) {
        throw new ORPCError("NOT_FOUND", { message: "Document not found" });
      }

      return updated;
    }),

  // Get documents expiring soon
  getExpiring: staffProcedure
    .input(z.object({ daysAhead: z.number().default(30) }))
    .handler(async ({ input }) => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + input.daysAhead);

      const expiring = await db.query.document.findMany({
        where: and(
          eq(document.status, "ACTIVE"),
          sql`${document.expirationDate} IS NOT NULL`,
          sql`${document.expirationDate} <= ${futureDate.toISOString().split("T")[0]}`,
          sql`${document.expirationDate} >= CURRENT_DATE`
        ),
        orderBy: [asc(document.expirationDate)],
        with: {
          client: {
            columns: { id: true, displayName: true },
          },
        },
      });

      return expiring;
    }),

  // Get documents by client
  getByClient: staffProcedure
    .input(z.object({ clientId: z.string() }))
    .handler(async ({ input }) => {
      const documents = await db.query.document.findMany({
        where: and(
          eq(document.clientId, input.clientId),
          eq(document.status, "ACTIVE")
        ),
        orderBy: [desc(document.createdAt)],
        with: {
          matter: {
            columns: { id: true, referenceNumber: true, title: true },
          },
          uploadedBy: {
            columns: { id: true, name: true },
          },
        },
      });

      return documents;
    }),

  // Get documents by matter
  getByMatter: staffProcedure
    .input(z.object({ matterId: z.string() }))
    .handler(async ({ input }) => {
      const documents = await db.query.document.findMany({
        where: and(
          eq(document.matterId, input.matterId),
          eq(document.status, "ACTIVE")
        ),
        orderBy: [desc(document.createdAt)],
        with: {
          uploadedBy: {
            columns: { id: true, name: true },
          },
        },
      });

      return documents;
    }),

  // Templates sub-router
  templates: {
    list: staffProcedure
      .input(
        z.object({
          category: z.enum(documentCategoryValues).optional(),
          business: z.enum(["GCMC", "KAJ"]).optional(),
        })
      )
      .handler(async ({ input, context }) => {
        const accessibleBusinesses = getAccessibleBusinesses(context.staff);
        const conditions = [eq(documentTemplate.isActive, true)];

        if (input.category) {
          conditions.push(eq(documentTemplate.category, input.category));
        }

        // Filter by business or null (both)
        if (input.business) {
          conditions.push(
            or(
              eq(documentTemplate.business, input.business),
              isNull(documentTemplate.business)
            )
          );
        } else {
          conditions.push(
            or(
              isNull(documentTemplate.business),
              sql`${documentTemplate.business} = ANY(ARRAY[${sql.join(accessibleBusinesses, sql`, `)}]::text[])`
            )
          );
        }

        const templates = await db
          .select()
          .from(documentTemplate)
          .where(and(...conditions))
          .orderBy(asc(documentTemplate.sortOrder), asc(documentTemplate.name));

        return templates;
      }),

    getById: staffProcedure
      .input(z.object({ id: z.string() }))
      .handler(async ({ input }) => {
        const template = await db.query.documentTemplate.findFirst({
          where: eq(documentTemplate.id, input.id),
        });

        if (!template) {
          throw new ORPCError("NOT_FOUND", { message: "Template not found" });
        }

        return template;
      }),
  },

  // Get category statistics
  getStats: staffProcedure.handler(async () => {
    const stats = await db
      .select({
        category: document.category,
        count: count(),
      })
      .from(document)
      .where(eq(document.status, "ACTIVE"))
      .groupBy(document.category);

    const totalSize = await db
      .select({
        total: sql<number>`COALESCE(SUM(${document.fileSize}), 0)`,
      })
      .from(document)
      .where(eq(document.status, "ACTIVE"));

    return {
      byCategory: stats.reduce(
        (acc, { category, count }) => {
          acc[category] = count;
          return acc;
        },
        {} as Record<string, number>
      ),
      totalSize: totalSize[0]?.total || 0,
      totalDocuments: stats.reduce((sum, { count }) => sum + count, 0),
    };
  }),
};
