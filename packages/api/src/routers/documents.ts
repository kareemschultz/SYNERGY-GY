import { client, db, document, documentTemplate, matter } from "@SYNERGY-GY/db";
import { ORPCError } from "@orpc/server";
import { and, asc, count, desc, eq, ilike, isNull, or, sql } from "drizzle-orm";
import { z } from "zod";
import {
  adminProcedure,
  getAccessibleBusinesses,
  staffProcedure,
} from "../index";

// Template placeholder type
interface TemplatePlaceholder {
  key: string;
  label: string;
  description?: string;
  type?: "text" | "date" | "number" | "currency";
  source?: "client" | "matter" | "staff" | "business" | "date" | "custom";
  sourceField?: string;
}

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

const templateCategoryValues = [
  "LETTER",
  "AGREEMENT",
  "CERTIFICATE",
  "FORM",
  "REPORT",
  "INVOICE",
  "OTHER",
] as const;

// Helper function to get placeholder value from data object
function getPlaceholderValue(
  data: Record<string, unknown>,
  placeholder: TemplatePlaceholder
): string {
  const parts = placeholder.key.split(".");
  let value: unknown = data;

  for (const part of parts) {
    if (value && typeof value === "object" && part in value) {
      value = (value as Record<string, unknown>)[part];
    } else {
      return `[${placeholder.label}]`;
    }
  }

  if (value === null || value === undefined) {
    return `[${placeholder.label}]`;
  }

  // Format based on type
  if (placeholder.type === "date" && value instanceof Date) {
    return value.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  if (placeholder.type === "currency" && typeof value === "number") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "GYD",
    }).format(value);
  }

  return String(value);
}

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
    const countResult = await db
      .select({ total: count() })
      .from(document)
      .where(whereClause);

    const total = countResult[0]?.total ?? 0;

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
          category: z.enum(templateCategoryValues).optional(),
          business: z.enum(["GCMC", "KAJ"]).optional(),
          includeInactive: z.boolean().default(false),
        })
      )
      .handler(async ({ input, context }) => {
        const accessibleBusinesses = getAccessibleBusinesses(context.staff);
        const conditions = [];

        if (!input.includeInactive) {
          conditions.push(eq(documentTemplate.isActive, true));
        }

        if (input.category) {
          conditions.push(eq(documentTemplate.category, input.category));
        }

        // Filter by business or null (both)
        if (input.business) {
          const businessFilter = or(
            eq(documentTemplate.business, input.business),
            isNull(documentTemplate.business)
          );
          if (businessFilter) {
            conditions.push(businessFilter);
          }
        } else if (accessibleBusinesses.length > 0) {
          // Build business filter - show templates with null business or accessible businesses
          const businessFilter = or(
            isNull(documentTemplate.business),
            sql`${documentTemplate.business} = ANY(ARRAY[${sql.join(accessibleBusinesses, sql`, `)}]::text[])`
          );
          if (businessFilter) {
            conditions.push(businessFilter);
          }
        } else {
          // No accessible businesses - only show templates with null business
          conditions.push(isNull(documentTemplate.business));
        }

        const whereClause =
          conditions.length > 0 ? and(...conditions) : undefined;

        const templates = await db
          .select()
          .from(documentTemplate)
          .where(whereClause)
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

    create: adminProcedure
      .input(
        z.object({
          name: z.string().min(1).max(255),
          description: z.string().optional(),
          category: z.enum(templateCategoryValues),
          business: z.enum(["GCMC", "KAJ"]).nullable().optional(),
          content: z.string().min(1),
          placeholders: z.array(
            z.object({
              key: z.string(),
              label: z.string(),
              type: z.enum(["text", "date", "number", "currency"]),
              source: z.enum([
                "client",
                "matter",
                "staff",
                "business",
                "date",
                "custom",
              ]),
              sourceField: z.string().optional(),
            })
          ),
          sortOrder: z.number().default(0),
        })
      )
      .handler(async ({ input, context }) => {
        const [newTemplate] = await db
          .insert(documentTemplate)
          .values({
            ...input,
            createdById: context.session.user.id,
          })
          .returning();

        return newTemplate;
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.string(),
          name: z.string().min(1).max(255).optional(),
          description: z.string().optional(),
          category: z.enum(templateCategoryValues).optional(),
          business: z.enum(["GCMC", "KAJ"]).nullable().optional(),
          content: z.string().min(1).optional(),
          placeholders: z
            .array(
              z.object({
                key: z.string(),
                label: z.string(),
                type: z.enum(["text", "date", "number", "currency"]),
                source: z.enum([
                  "client",
                  "matter",
                  "staff",
                  "business",
                  "date",
                  "custom",
                ]),
                sourceField: z.string().optional(),
              })
            )
            .optional(),
          sortOrder: z.number().optional(),
          isActive: z.boolean().optional(),
        })
      )
      .handler(async ({ input }) => {
        const { id, ...updates } = input;

        const existing = await db.query.documentTemplate.findFirst({
          where: eq(documentTemplate.id, id),
        });

        if (!existing) {
          throw new ORPCError("NOT_FOUND", { message: "Template not found" });
        }

        const [updated] = await db
          .update(documentTemplate)
          .set(updates)
          .where(eq(documentTemplate.id, id))
          .returning();

        return updated;
      }),

    delete: adminProcedure
      .input(z.object({ id: z.string() }))
      .handler(async ({ input }) => {
        // Soft delete by setting isActive to false
        const [updated] = await db
          .update(documentTemplate)
          .set({ isActive: false })
          .where(eq(documentTemplate.id, input.id))
          .returning();

        if (!updated) {
          throw new ORPCError("NOT_FOUND", { message: "Template not found" });
        }

        return updated;
      }),

    preview: staffProcedure
      .input(
        z.object({
          id: z.string(),
          clientId: z.string().optional(),
          matterId: z.string().optional(),
          customData: z.record(z.string(), z.string()).optional(),
        })
      )
      .handler(async ({ input, context }) => {
        const template = await db.query.documentTemplate.findFirst({
          where: eq(documentTemplate.id, input.id),
        });

        if (!template) {
          throw new ORPCError("NOT_FOUND", { message: "Template not found" });
        }

        // Gather data for placeholders
        const data: Record<string, unknown> = {};

        // Load client data if provided
        if (input.clientId) {
          const clientData = await db.query.client.findFirst({
            where: eq(client.id, input.clientId),
          });
          if (clientData) {
            data.client = clientData;
          }
        }

        // Load matter data if provided
        if (input.matterId) {
          const matterData = await db.query.matter.findFirst({
            where: eq(matter.id, input.matterId),
          });
          if (matterData) {
            data.matter = matterData;
          }
        }

        // Load staff data
        data.staff = context.staff;

        // Add business data
        data.business = {
          GCMC: {
            name: "Green Crescent Management Consultancy",
            address: "Georgetown, Guyana",
            phone: "+592-XXX-XXXX",
            email: "info@gcmc.gy",
          },
          KAJ: {
            name: "Kareem Abdul-Jabar Tax & Accounting Services",
            address: "Georgetown, Guyana",
            phone: "+592-XXX-XXXX",
            email: "info@kaj.gy",
          },
        };

        // Add date helpers
        data.date = {
          today: new Date().toISOString().split("T")[0],
          todayFormatted: new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
        };

        // Add custom data
        if (input.customData) {
          data.custom = input.customData;
        }

        // Replace placeholders in content
        let renderedContent = template.content;
        for (const placeholder of template.placeholders) {
          const value = getPlaceholderValue(data, placeholder);
          const regex = new RegExp(`{{${placeholder.key}}}`, "g");
          renderedContent = renderedContent.replace(regex, value);
        }

        return {
          template,
          renderedContent,
          data,
        };
      }),

    generate: staffProcedure
      .input(
        z.object({
          templateId: z.string(),
          clientId: z.string().optional(),
          matterId: z.string().optional(),
          customData: z.record(z.string(), z.string()).optional(),
          fileName: z.string().optional(),
        })
      )
      .handler(async ({ input, context }) => {
        const template = await db.query.documentTemplate.findFirst({
          where: eq(documentTemplate.id, input.templateId),
        });

        if (!template) {
          throw new ORPCError("NOT_FOUND", { message: "Template not found" });
        }

        // Gather data for placeholders (same as preview)
        const data: Record<string, unknown> = {};

        if (input.clientId) {
          const clientData = await db.query.client.findFirst({
            where: eq(client.id, input.clientId),
          });
          if (clientData) {
            data.client = clientData;
          }
        }

        if (input.matterId) {
          const matterData = await db.query.matter.findFirst({
            where: eq(matter.id, input.matterId),
          });
          if (matterData) {
            data.matter = matterData;
          }
        }

        data.staff = context.staff;

        data.business = {
          GCMC: {
            name: "Green Crescent Management Consultancy",
            address: "Georgetown, Guyana",
            phone: "+592-XXX-XXXX",
            email: "info@gcmc.gy",
          },
          KAJ: {
            name: "Kareem Abdul-Jabar Tax & Accounting Services",
            address: "Georgetown, Guyana",
            phone: "+592-XXX-XXXX",
            email: "info@kaj.gy",
          },
        };

        data.date = {
          today: new Date().toISOString().split("T")[0],
          todayFormatted: new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
        };

        if (input.customData) {
          data.custom = input.customData;
        }

        // Replace placeholders
        let renderedContent = template.content;
        for (const placeholder of template.placeholders) {
          const value = getPlaceholderValue(data, placeholder);
          const regex = new RegExp(`{{${placeholder.key}}}`, "g");
          renderedContent = renderedContent.replace(regex, value);
        }

        // Generate filename
        const fileName =
          input.fileName ||
          `${template.name}_${new Date().toISOString().split("T")[0]}.txt`;

        return {
          templateId: template.id,
          templateName: template.name,
          content: renderedContent,
          fileName,
        };
      }),
  },

  // Prepare upload - creates a PENDING document record and returns upload URL
  prepareUpload: staffProcedure
    .input(
      z.object({
        category: z.enum(documentCategoryValues),
        description: z.string().optional(),
        clientId: z.string().optional(),
        matterId: z.string().optional(),
        expirationDate: z.string().optional(),
      })
    )
    .handler(async ({ input, context }) => {
      // Create document record in PENDING status
      const docResult = await db
        .insert(document)
        .values({
          fileName: "pending", // Will be updated after upload
          originalName: "pending",
          mimeType: "pending",
          fileSize: 0,
          storagePath: "pending",
          category: input.category,
          description: input.description,
          clientId: input.clientId,
          matterId: input.matterId,
          expirationDate: input.expirationDate,
          status: "PENDING",
          uploadedById: context.session.user.id,
        })
        .returning();

      const newDoc = docResult[0];
      if (!newDoc) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to create document record",
        });
      }

      return {
        documentId: newDoc.id,
        uploadUrl: `/api/upload/${newDoc.id}`,
      };
    }),

  // Get download URL for a document
  getDownloadUrl: staffProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      const doc = await db.query.document.findFirst({
        where: eq(document.id, input.id),
      });

      if (!doc) {
        throw new ORPCError("NOT_FOUND", { message: "Document not found" });
      }

      if (doc.status !== "ACTIVE") {
        throw new ORPCError("NOT_FOUND", { message: "Document not available" });
      }

      return {
        downloadUrl: `/api/download/${doc.id}`,
        fileName: doc.originalName,
        mimeType: doc.mimeType,
        fileSize: doc.fileSize,
      };
    }),

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
