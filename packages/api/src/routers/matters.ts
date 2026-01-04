import {
  db,
  matter,
  matterChecklist,
  matterNote,
  serviceType,
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

const recurrencePatternValues = [
  "MONTHLY",
  "QUARTERLY",
  "SEMI_ANNUALLY",
  "ANNUALLY",
] as const;

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
  // Recurring matter fields
  isRecurring: z.boolean().default(false),
  recurrencePattern: z.enum(recurrencePatternValues).optional(),
  nextRecurrenceDate: z.string().optional(),
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
  // Recurring matter fields
  isRecurring: z.boolean().optional(),
  recurrencePattern: z.enum(recurrencePatternValues).nullable().optional(),
  nextRecurrenceDate: z.string().nullable().optional(),
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

/**
 * Calculate the next recurrence date based on pattern
 */
function calculateNextRecurrenceDate(
  currentDate: Date,
  pattern: "MONTHLY" | "QUARTERLY" | "SEMI_ANNUALLY" | "ANNUALLY"
): string {
  const nextDate = new Date(currentDate);

  switch (pattern) {
    case "MONTHLY":
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case "QUARTERLY":
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    case "SEMI_ANNUALLY":
      nextDate.setMonth(nextDate.getMonth() + 6);
      break;
    case "ANNUALLY":
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
    default:
      // Exhaustive check - TypeScript ensures all patterns are handled
      break;
  }

  return nextDate.toISOString().split("T")[0] as string;
}

/**
 * Calculate tax year based on due date
 */
function calculateTaxYear(dueDate: string | null): number | null {
  if (!dueDate) {
    return null;
  }
  const date = new Date(dueDate);
  // If before April 30, it's for the previous year
  const month = date.getMonth(); // 0-indexed
  const day = date.getDate();
  const year = date.getFullYear();

  if (month < 3 || (month === 3 && day <= 30)) {
    return year - 1;
  }
  return year;
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
          sql`${matter.business}::text = ANY(ARRAY[${sql.join(
            accessibleBusinesses.map((b) => sql`${b}`),
            sql`, `
          )}]::text[])`
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
            orderBy: (c, { asc: ascOrder }) => [ascOrder(c.sortOrder)],
            with: {
              completedBy: true,
            },
          },
          notes: {
            orderBy: (n, { desc: descOrder }) => [descOrder(n.createdAt)],
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

      // Validate service type exists and matches business
      if (!svcType) {
        throw new ORPCError("BAD_REQUEST", {
          message:
            "Invalid service type. Please select a valid service from the dropdown.",
        });
      }

      if (svcType.business !== input.business) {
        throw new ORPCError("BAD_REQUEST", {
          message: `Service type "${svcType.name}" is not available for ${input.business}. Please select a service from the correct business.`,
        });
      }

      const [newMatter] = await db
        .insert(matter)
        .values({
          ...input,
          referenceNumber,
          startDate: input.startDate || new Date().toISOString().split("T")[0],
          estimatedFee: input.estimatedFee || null,
          createdById: context.session.user.id,
        })
        .returning();

      if (!newMatter) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to create matter",
        });
      }

      // Create default checklist items from service type
      if (svcType.defaultChecklistItems?.length) {
        const checklistItems = svcType.defaultChecklistItems.map(
          (item: string, index: number) => ({
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

  // Get service types for dropdown (uses serviceType table - FK constraint)
  getServiceTypes: staffProcedure
    .input(z.object({ business: z.enum(businessValues).optional() }))
    .handler(async ({ input, context }) => {
      const accessibleBusinesses = getAccessibleBusinesses(context.staff);
      const businessFilter = input.business || accessibleBusinesses;

      const services = await db.query.serviceType.findMany({
        where: and(
          eq(serviceType.isActive, true),
          Array.isArray(businessFilter)
            ? sql`${serviceType.business}::text = ANY(ARRAY[${sql.join(businessFilter, sql`, `)}]::text[])`
            : eq(serviceType.business, businessFilter)
        ),
        orderBy: [asc(serviceType.sortOrder), asc(serviceType.name)],
      });

      // Map to expected format for frontend compatibility
      return services.map((s) => ({
        id: s.id,
        name: s.name,
        category: s.category || "Other",
        business: s.business,
        description: s.description,
        estimatedDays: s.estimatedDays,
        defaultFee: s.defaultFee,
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
        sql`${matter.business}::text = ANY(ARRAY[${sql.join(
          accessibleBusinesses.map((b) => sql`${b}`),
          sql`, `
        )}]::text[])`
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

  // Recurring matters management
  recurring: {
    // List all recurring matters
    list: staffProcedure
      .input(
        z.object({
          page: z.number().min(1).default(1),
          limit: z.number().min(1).max(100).default(20),
          business: z.enum(businessValues).optional(),
          includeCompleted: z.boolean().default(false),
        })
      )
      .handler(async ({ input, context }) => {
        const accessibleBusinesses = getAccessibleBusinesses(context.staff);

        if (accessibleBusinesses.length === 0) {
          return {
            matters: [],
            total: 0,
            page: input.page,
            limit: input.limit,
          };
        }

        const conditions = [eq(matter.isRecurring, true)];

        // Filter by business
        if (input.business) {
          if (!accessibleBusinesses.includes(input.business)) {
            throw new ORPCError("FORBIDDEN", {
              message: "You don't have access to this business",
            });
          }
          conditions.push(eq(matter.business, input.business));
        } else {
          conditions.push(
            sql`${matter.business}::text = ANY(ARRAY[${sql.join(
              accessibleBusinesses.map((b) => sql`${b}`),
              sql`, `
            )}]::text[])`
          );
        }

        // Exclude completed unless requested
        if (!input.includeCompleted) {
          conditions.push(
            sql`${matter.status} NOT IN ('COMPLETE', 'CANCELLED')`
          );
        }

        const offset = (input.page - 1) * input.limit;

        const [matters, totalResult] = await Promise.all([
          db.query.matter.findMany({
            where: and(...conditions),
            with: {
              client: {
                columns: {
                  id: true,
                  displayName: true,
                  email: true,
                },
              },
              serviceType: {
                columns: {
                  id: true,
                  name: true,
                  category: true,
                },
              },
              assignedStaff: {
                columns: {
                  id: true,
                  jobTitle: true,
                },
                with: {
                  user: {
                    columns: {
                      name: true,
                    },
                  },
                },
              },
            },
            orderBy: [asc(matter.nextRecurrenceDate), desc(matter.createdAt)],
            limit: input.limit,
            offset,
          }),
          db
            .select({ count: count() })
            .from(matter)
            .where(and(...conditions)),
        ]);

        const totalCount = totalResult[0]?.count ?? 0;

        return {
          matters,
          total: totalCount,
          page: input.page,
          limit: input.limit,
        };
      }),

    // Set up recurrence on an existing matter
    setup: staffProcedure
      .input(
        z.object({
          matterId: z.string(),
          recurrencePattern: z.enum(recurrencePatternValues),
          startDate: z.string().optional(), // Date to start recurrence from
        })
      )
      .handler(async ({ input, context }) => {
        const accessibleBusinesses = getAccessibleBusinesses(context.staff);

        // Get the matter
        const existingMatter = await db.query.matter.findFirst({
          where: eq(matter.id, input.matterId),
        });

        if (!existingMatter) {
          throw new ORPCError("NOT_FOUND", {
            message: "Matter not found",
          });
        }

        if (!accessibleBusinesses.includes(existingMatter.business)) {
          throw new ORPCError("FORBIDDEN", {
            message: "You don't have access to this matter",
          });
        }

        // Calculate next recurrence date - determine base date
        let baseDate: Date;
        if (input.startDate) {
          baseDate = new Date(input.startDate);
        } else if (existingMatter.dueDate) {
          baseDate = new Date(existingMatter.dueDate);
        } else {
          baseDate = new Date();
        }

        const nextRecurrenceDate = calculateNextRecurrenceDate(
          baseDate,
          input.recurrencePattern
        );

        // Update the matter
        const [updated] = await db
          .update(matter)
          .set({
            isRecurring: true,
            recurrencePattern: input.recurrencePattern,
            nextRecurrenceDate,
            updatedAt: new Date(),
          })
          .where(eq(matter.id, input.matterId))
          .returning();

        return updated;
      }),

    // Create the next occurrence of a recurring matter
    createNext: staffProcedure
      .input(
        z.object({
          matterId: z.string(),
        })
      )
      .handler(async ({ input, context }) => {
        const accessibleBusinesses = getAccessibleBusinesses(context.staff);
        const staffId = context.staff.id;

        // Get the parent matter
        const parentMatter = await db.query.matter.findFirst({
          where: eq(matter.id, input.matterId),
        });

        if (!parentMatter) {
          throw new ORPCError("NOT_FOUND", {
            message: "Matter not found",
          });
        }

        if (!accessibleBusinesses.includes(parentMatter.business)) {
          throw new ORPCError("FORBIDDEN", {
            message: "You don't have access to this matter",
          });
        }

        if (!(parentMatter.isRecurring && parentMatter.recurrencePattern)) {
          throw new ORPCError("BAD_REQUEST", {
            message: "This matter is not set up for recurrence",
          });
        }

        // Generate new reference number
        const referenceNumber = await generateReferenceNumber(
          parentMatter.business as "GCMC" | "KAJ"
        );

        // Calculate new dates based on recurrence pattern
        const newDueDate = parentMatter.dueDate
          ? calculateNextRecurrenceDate(
              new Date(parentMatter.dueDate),
              parentMatter.recurrencePattern as
                | "MONTHLY"
                | "QUARTERLY"
                | "SEMI_ANNUALLY"
                | "ANNUALLY"
            )
          : null;

        const newTaxYear = newDueDate ? calculateTaxYear(newDueDate) : null;

        // Create the new matter
        const [newMatter] = await db
          .insert(matter)
          .values({
            referenceNumber,
            clientId: parentMatter.clientId,
            serviceTypeId: parentMatter.serviceTypeId,
            business: parentMatter.business,
            title: parentMatter.title,
            description: parentMatter.description,
            priority: parentMatter.priority,
            status: "NEW",
            startDate: newDueDate
              ? new Date(
                  new Date(newDueDate).getTime() - 30 * 24 * 60 * 60 * 1000
                )
                  .toISOString()
                  .split("T")[0]
              : undefined, // Start 30 days before due
            dueDate: newDueDate,
            assignedStaffId: parentMatter.assignedStaffId,
            estimatedFee: parentMatter.estimatedFee,
            taxYear: newTaxYear,
            isRecurring: true,
            recurrencePattern: parentMatter.recurrencePattern,
            parentMatterId: parentMatter.parentMatterId || parentMatter.id, // Link to original parent
            recurrenceCount: (parentMatter.recurrenceCount || 0) + 1,
            createdById: staffId,
          })
          .returning();

        // Update the parent matter's next recurrence date
        const nextRecurrence = calculateNextRecurrenceDate(
          new Date(newDueDate || new Date()),
          parentMatter.recurrencePattern as
            | "MONTHLY"
            | "QUARTERLY"
            | "SEMI_ANNUALLY"
            | "ANNUALLY"
        );

        await db
          .update(matter)
          .set({
            nextRecurrenceDate: nextRecurrence,
            updatedAt: new Date(),
          })
          .where(eq(matter.id, input.matterId));

        return {
          newMatter,
          nextRecurrenceDate: nextRecurrence,
        };
      }),

    // Cancel recurrence on a matter
    cancel: staffProcedure
      .input(
        z.object({
          matterId: z.string(),
        })
      )
      .handler(async ({ input, context }) => {
        const accessibleBusinesses = getAccessibleBusinesses(context.staff);

        // Get the matter
        const existingMatter = await db.query.matter.findFirst({
          where: eq(matter.id, input.matterId),
        });

        if (!existingMatter) {
          throw new ORPCError("NOT_FOUND", {
            message: "Matter not found",
          });
        }

        if (!accessibleBusinesses.includes(existingMatter.business)) {
          throw new ORPCError("FORBIDDEN", {
            message: "You don't have access to this matter",
          });
        }

        // Update the matter to remove recurrence
        const [updated] = await db
          .update(matter)
          .set({
            isRecurring: false,
            recurrencePattern: null,
            nextRecurrenceDate: null,
            updatedAt: new Date(),
          })
          .where(eq(matter.id, input.matterId))
          .returning();

        return updated;
      }),

    // Get matters due for recurrence (for background processing)
    getDue: staffProcedure
      .input(
        z.object({
          daysAhead: z.number().min(0).max(30).default(0),
        })
      )
      .handler(async ({ input, context }) => {
        const accessibleBusinesses = getAccessibleBusinesses(context.staff);

        if (accessibleBusinesses.length === 0) {
          return { matters: [] };
        }

        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + input.daysAhead);
        const targetDateStr = targetDate.toISOString().split("T")[0];

        const dueMatters = await db.query.matter.findMany({
          where: and(
            eq(matter.isRecurring, true),
            sql`${matter.nextRecurrenceDate} <= ${targetDateStr}`,
            sql`${matter.status} NOT IN ('COMPLETE', 'CANCELLED')`,
            sql`${matter.business}::text = ANY(ARRAY[${sql.join(
              accessibleBusinesses.map((b) => sql`${b}`),
              sql`, `
            )}]::text[])`
          ),
          with: {
            client: {
              columns: {
                id: true,
                displayName: true,
                email: true,
              },
            },
            serviceType: {
              columns: {
                id: true,
                name: true,
                category: true,
              },
            },
          },
          orderBy: [asc(matter.nextRecurrenceDate)],
        });

        return { matters: dueMatters };
      }),
  },
};
