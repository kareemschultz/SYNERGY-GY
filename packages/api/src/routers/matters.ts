import {
  db,
  matter,
  matterChecklist,
  matterNote,
  serviceCatalog,
} from "@SYNERGY-GY/db";
import { ORPCError } from "@orpc/server";
import { and, asc, count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { z } from "zod";
import {
  canAccessBusiness,
  getAccessibleBusinesses,
  staffProcedure,
} from "../index";

// Input schemas
const matterStatusValues = [
  "NEW",
  "IN_PROGRESS",
  "PENDING_CLIENT",
  "SUBMITTED",
  "COMPLETE",
  "CANCELLED",
] as const;

const matterPriorityValues = ["LOW", "NORMAL", "HIGH", "URGENT"] as const;

const businessValues = ["GCMC", "KAJ"] as const;

const listMattersSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.enum(matterStatusValues).optional(),
  business: z.enum(businessValues).optional(),
  clientId: z.string().optional(),
  assignedStaffId: z.string().optional(),
  sortBy: z
    .enum(["referenceNumber", "createdAt", "dueDate", "status"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

const createMatterSchema = z.object({
  clientId: z.string(),
  serviceTypeId: z.string(),
  business: z.enum(businessValues),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  priority: z.enum(matterPriorityValues).default("NORMAL"),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  assignedStaffId: z.string().optional(),
  estimatedFee: z.string().optional(),
  taxYear: z.number().optional(),
});

const updateMatterSchema = z.object({
  id: z.string(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(matterStatusValues).optional(),
  priority: z.enum(matterPriorityValues).optional(),
  dueDate: z.string().optional(),
  assignedStaffId: z.string().nullable().optional(),
  estimatedFee: z.string().optional(),
  actualFee: z.string().optional(),
  isPaid: z.boolean().optional(),
  taxYear: z.number().optional(),
});

// Helper to generate reference number
async function generateReferenceNumber(
  business: "GCMC" | "KAJ"
): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `${business}-${year}`;

  // Get the latest reference number for this business and year
  const latest = await db
    .select({ referenceNumber: matter.referenceNumber })
    .from(matter)
    .where(sql`${matter.referenceNumber} LIKE ${`${prefix}-%`}`)
    .orderBy(desc(matter.referenceNumber))
    .limit(1);

  let nextNumber = 1;
  if (latest.length > 0 && latest[0]) {
    const parts = latest[0].referenceNumber.split("-");
    const lastNumber = Number.parseInt(parts[2] || "0", 10);
    nextNumber = lastNumber + 1;
  }

  return `${prefix}-${nextNumber.toString().padStart(4, "0")}`;
}

// Matters router
export const mattersRouter = {
  // List matters with pagination and filters
  list: staffProcedure
    .input(listMattersSchema)
    .handler(async ({ input, context }) => {
      const accessibleBusinesses = getAccessibleBusinesses(context.staff);

      if (accessibleBusinesses.length === 0) {
        return { matters: [], total: 0, page: input.page, limit: input.limit };
      }

      // biome-ignore lint/suspicious/noEvolvingTypes: Auto-fix
      const conditions = [];

      // Filter by accessible businesses
      if (input.business) {
        if (!accessibleBusinesses.includes(input.business)) {
          throw new ORPCError("FORBIDDEN", {
            message: "You don't have access to this business",
          });
        }
        conditions.push(eq(matter.business, input.business));
      } else {
        conditions.push(
          sql`${matter.business}::text = ANY(ARRAY[${sql.join(accessibleBusinesses, sql`, `)}]::text[])`
        );
      }

      // Search filter
      if (input.search) {
        const searchTerm = `%${input.search}%`;
        conditions.push(
          or(
            ilike(matter.title, searchTerm),
            ilike(matter.referenceNumber, searchTerm),
            ilike(matter.description, searchTerm)
          )
        );
      }

      // Status filter
      if (input.status) {
        conditions.push(eq(matter.status, input.status));
      }

      // Client filter
      if (input.clientId) {
        conditions.push(eq(matter.clientId, input.clientId));
      }

      // Assigned staff filter
      if (input.assignedStaffId) {
        conditions.push(eq(matter.assignedStaffId, input.assignedStaffId));
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count
      const countResult = await db
        .select({ total: count() })
        .from(matter)
        .where(whereClause);

      const total = countResult[0]?.total ?? 0;

      // Get paginated results
      const offset = (input.page - 1) * input.limit;
      const orderColumn = matter[input.sortBy];
      const orderDirection = input.sortOrder === "asc" ? asc : desc;

      const matters = await db.query.matter.findMany({
        where: whereClause,
        orderBy: [orderDirection(orderColumn)],
        limit: input.limit,
        offset,
        with: {
          client: {
            columns: { id: true, displayName: true },
          },
          serviceType: {
            columns: { id: true, name: true, category: true },
          },
          assignedStaff: {
            with: {
              user: {
                columns: { id: true, name: true },
              },
            },
          },
        },
      });

      return {
        matters,
        total,
        page: input.page,
        limit: input.limit,
        totalPages: Math.ceil(total / input.limit),
      };
    }),

  // Get single matter by ID
  getById: staffProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const result = await db.query.matter.findFirst({
        where: eq(matter.id, input.id),
        with: {
          client: true,
          serviceType: true,
          assignedStaff: {
            with: {
              user: true,
            },
          },
          createdBy: true,
          checklist: {
            // biome-ignore lint/nursery/noShadow: Auto-fix
            orderBy: (c, { asc }) => [asc(c.sortOrder)],
            with: {
              completedBy: true,
            },
          },
          notes: {
            // biome-ignore lint/nursery/noShadow: Auto-fix
            orderBy: (n, { desc }) => [desc(n.createdAt)],
            with: {
              createdBy: true,
            },
          },
        },
      });

      if (!result) {
        throw new ORPCError("NOT_FOUND", { message: "Matter not found" });
      }

      // Check if user has access to this matter's business
      if (!canAccessBusiness(context.staff, result.business)) {
        throw new ORPCError("FORBIDDEN", {
          message: "You don't have access to this matter",
        });
      }

      return result;
    }),

  // Create new matter
  create: staffProcedure
    .input(createMatterSchema)
    .handler(async ({ input, context }) => {
      // Verify user can access the business
      if (!canAccessBusiness(context.staff, input.business)) {
        throw new ORPCError("FORBIDDEN", {
          message: `You don't have access to ${input.business}`,
        });
      }

      // Generate reference number
      const referenceNumber = await generateReferenceNumber(input.business);

      // Get default checklist items from service type
      const svcType = await db.query.serviceType.findFirst({
        where: eq(serviceType.id, input.serviceTypeId),
      });

      const matterResult = await db
        .insert(matter)
        .values({
          ...input,
          referenceNumber,
          startDate: input.startDate || new Date().toISOString().split("T")[0],
          estimatedFee: input.estimatedFee || null,
          createdById: context.session.user.id,
        })
        .returning();

      const newMatter = matterResult[0];
      if (!newMatter) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to create matter",
        });
      }

      // Create default checklist items if service type has them
      if (svcType?.defaultChecklistItems?.length) {
        const checklistItems = svcType.defaultChecklistItems.map(
          (item, index) => ({
            matterId: newMatter.id,
            item,
            sortOrder: index,
          })
        );
        await db.insert(matterChecklist).values(checklistItems);
      }

      return newMatter;
    }),

  // Update existing matter
  update: staffProcedure
    .input(updateMatterSchema)
    .handler(async ({ input, context }) => {
      const { id, ...updates } = input;

      // Fetch existing matter
      const existing = await db.query.matter.findFirst({
        where: eq(matter.id, id),
      });

      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Matter not found" });
      }

      // Check access
      if (!canAccessBusiness(context.staff, existing.business)) {
        throw new ORPCError("FORBIDDEN", {
          message: "You don't have access to this matter",
        });
      }

      // If status is being set to COMPLETE, set completedDate
      const additionalUpdates: Record<string, unknown> = {};
      if (updates.status === "COMPLETE" && existing.status !== "COMPLETE") {
        additionalUpdates.completedDate = new Date()
          .toISOString()
          .split("T")[0];
      }

      const [updated] = await db
        .update(matter)
        .set({ ...updates, ...additionalUpdates })
        .where(eq(matter.id, id))
        .returning();

      return updated;
    }),

  // Get service types for dropdown (uses serviceCatalog table)
  getServiceTypes: staffProcedure
    .input(z.object({ business: z.enum(businessValues).optional() }))
    .handler(async ({ input, context }) => {
      const accessibleBusinesses = getAccessibleBusinesses(context.staff);
      const businessFilter = input.business || accessibleBusinesses;

      const services = await db.query.serviceCatalog.findMany({
        where: and(
          eq(serviceCatalog.isActive, true),
          Array.isArray(businessFilter)
            ? sql`${serviceCatalog.business}::text = ANY(ARRAY[${sql.join(businessFilter, sql`, `)}]::text[])`
            : eq(serviceCatalog.business, businessFilter)
        ),
        orderBy: [
          asc(serviceCatalog.sortOrder),
          asc(serviceCatalog.displayName),
        ],
        with: {
          category: true,
        },
      });

      // Map to expected format for frontend compatibility
      return services.map((s) => ({
        id: s.id,
        name: s.displayName,
        category: s.category?.displayName || "Other",
        business: s.business,
        description: s.shortDescription || s.description,
        estimatedDays: s.estimatedDays,
        defaultFee: s.basePrice,
        isActive: s.isActive,
        sortOrder: s.sortOrder,
      }));
    }),

  // Checklist operations
  checklist: {
    addItem: staffProcedure
      .input(
        z.object({
          matterId: z.string(),
          item: z.string().min(1),
        })
      )
      .handler(async ({ input }) => {
        // Get max sort order
        const existing = await db
          .select({ maxOrder: sql<number>`COALESCE(MAX(sort_order), 0)` })
          .from(matterChecklist)
          .where(eq(matterChecklist.matterId, input.matterId));

        const sortOrder = (existing[0]?.maxOrder || 0) + 1;

        const [newItem] = await db
          .insert(matterChecklist)
          .values({
            matterId: input.matterId,
            item: input.item,
            sortOrder,
          })
          .returning();

        return newItem;
      }),

    toggleItem: staffProcedure
      .input(z.object({ id: z.string(), isCompleted: z.boolean() }))
      .handler(async ({ input, context }) => {
        const [updated] = await db
          .update(matterChecklist)
          .set({
            isCompleted: input.isCompleted,
            completedAt: input.isCompleted ? new Date() : null,
            completedById: input.isCompleted ? context.session.user.id : null,
          })
          .where(eq(matterChecklist.id, input.id))
          .returning();

        return updated;
      }),

    deleteItem: staffProcedure
      .input(z.object({ id: z.string() }))
      .handler(async ({ input }) => {
        await db
          .delete(matterChecklist)
          .where(eq(matterChecklist.id, input.id));
        return { success: true };
      }),
  },

  // Notes operations
  notes: {
    create: staffProcedure
      .input(
        z.object({
          matterId: z.string(),
          content: z.string().min(1),
          isInternal: z.boolean().default(true),
        })
      )
      .handler(async ({ input, context }) => {
        const [newNote] = await db
          .insert(matterNote)
          .values({
            ...input,
            createdById: context.session.user.id,
          })
          .returning();

        return newNote;
      }),
  },

  // Get matters by status (for dashboard)
  getByStatus: staffProcedure.handler(async ({ context }) => {
    const accessibleBusinesses = getAccessibleBusinesses(context.staff);

    const statusCounts = await db
      .select({
        status: matter.status,
        count: count(),
      })
      .from(matter)
      .where(
        sql`${matter.business}::text = ANY(ARRAY[${sql.join(accessibleBusinesses, sql`, `)}]::text[])`
      )
      .groupBy(matter.status);

    return statusCounts.reduce(
      // biome-ignore lint/nursery/noShadow: Auto-fix
      (acc, { status, count }) => {
        acc[status] = count;
        return acc;
      },
      {} as Record<string, number>
    );
  }),

  // Bulk operations
  bulk: {
    // Bulk update matter status
    updateStatus: staffProcedure
      .input(
        z.object({
          ids: z.array(z.string()).min(1),
          status: z.enum(matterStatusValues),
        })
      )
      .handler(async ({ input, context }) => {
        const accessibleBusinesses = getAccessibleBusinesses(context.staff);

        // Verify access to all matters
        const mattersToUpdate = await db.query.matter.findMany({
          where: sql`${matter.id} = ANY(ARRAY[${sql.join(input.ids, sql`, `)}]::text[])`,
        });

        for (const m of mattersToUpdate) {
          if (!accessibleBusinesses.includes(m.business)) {
            throw new ORPCError("FORBIDDEN", {
              message: `You don't have access to matter ${m.referenceNumber}`,
            });
          }
        }

        // If status is COMPLETE, set completedDate
        const additionalUpdates: Record<string, unknown> = {};
        if (input.status === "COMPLETE") {
          additionalUpdates.completedDate = new Date()
            .toISOString()
            .split("T")[0];
        }

        await db
          .update(matter)
          .set({ status: input.status, ...additionalUpdates })
          .where(
            sql`${matter.id} = ANY(ARRAY[${sql.join(input.ids, sql`, `)}]::text[])`
          );

        return { success: true, count: input.ids.length };
      }),

    // Bulk export matters to CSV
    export: staffProcedure
      .input(z.object({ ids: z.array(z.string()).min(1) }))
      .handler(async ({ input, context }) => {
        const accessibleBusinesses = getAccessibleBusinesses(context.staff);

        const matters = await db.query.matter.findMany({
          where: sql`${matter.id} = ANY(ARRAY[${sql.join(input.ids, sql`, `)}]::text[])`,
          with: {
            client: {
              columns: { id: true, displayName: true },
            },
            serviceType: {
              columns: { id: true, name: true },
            },
            assignedStaff: {
              with: {
                user: {
                  columns: { name: true },
                },
              },
            },
          },
        });

        // Filter by access
        const accessibleMatters = matters.filter((m) =>
          accessibleBusinesses.includes(m.business)
        );

        // Generate CSV content
        const headers = [
          "Reference Number",
          "Title",
          "Business",
          "Client",
          "Service",
          "Status",
          "Priority",
          "Assigned To",
          "Start Date",
          "Due Date",
          "Estimated Fee",
          "Actual Fee",
          "Is Paid",
          "Created At",
        ];

        const rows = accessibleMatters.map((m) => [
          m.referenceNumber,
          m.title,
          m.business,
          m.client?.displayName || "",
          m.serviceType?.name || "",
          m.status,
          m.priority,
          m.assignedStaff?.user?.name || "",
          m.startDate || "",
          m.dueDate || "",
          m.estimatedFee || "",
          m.actualFee || "",
          m.isPaid ? "Yes" : "No",
          m.createdAt ? new Date(m.createdAt).toISOString() : "",
        ]);

        const csvContent = [
          headers.join(","),
          ...rows.map((row) =>
            row
              .map((cell) =>
                typeof cell === "string" && cell.includes(",")
                  ? `"${cell.replace(/"/g, '""')}"`
                  : cell
              )
              .join(",")
          ),
        ].join("\n");

        return { csv: csvContent, count: accessibleMatters.length };
      }),

    // Bulk assign staff to matters
    assignStaff: staffProcedure
      .input(
        z.object({
          ids: z.array(z.string()).min(1),
          assignedStaffId: z.string().nullable(),
        })
      )
      .handler(async ({ input, context }) => {
        const accessibleBusinesses = getAccessibleBusinesses(context.staff);

        // Verify access to all matters
        const mattersToUpdate = await db.query.matter.findMany({
          where: sql`${matter.id} = ANY(ARRAY[${sql.join(input.ids, sql`, `)}]::text[])`,
        });

        for (const m of mattersToUpdate) {
          if (!accessibleBusinesses.includes(m.business)) {
            throw new ORPCError("FORBIDDEN", {
              message: `You don't have access to matter ${m.referenceNumber}`,
            });
          }
        }

        await db
          .update(matter)
          .set({ assignedStaffId: input.assignedStaffId })
          .where(
            sql`${matter.id} = ANY(ARRAY[${sql.join(input.ids, sql`, `)}]::text[])`
          );

        return { success: true, count: input.ids.length };
      }),

    // Bulk update priority
    updatePriority: staffProcedure
      .input(
        z.object({
          ids: z.array(z.string()).min(1),
          priority: z.enum(matterPriorityValues),
        })
      )
      .handler(async ({ input, context }) => {
        const accessibleBusinesses = getAccessibleBusinesses(context.staff);

        // Verify access to all matters
        const mattersToUpdate = await db.query.matter.findMany({
          where: sql`${matter.id} = ANY(ARRAY[${sql.join(input.ids, sql`, `)}]::text[])`,
        });

        for (const m of mattersToUpdate) {
          if (!accessibleBusinesses.includes(m.business)) {
            throw new ORPCError("FORBIDDEN", {
              message: `You don't have access to matter ${m.referenceNumber}`,
            });
          }
        }

        await db
          .update(matter)
          .set({ priority: input.priority })
          .where(
            sql`${matter.id} = ANY(ARRAY[${sql.join(input.ids, sql`, `)}]::text[])`
          );

        return { success: true, count: input.ids.length };
      }),
  },
};
