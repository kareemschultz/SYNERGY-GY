import { db, deadline, deadlineReminder } from "@SYNERGY-GY/db";
import { ORPCError } from "@orpc/server";
import { and, asc, count, desc, eq, gte, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { getAccessibleBusinesses, staffProcedure } from "../index";
import { nanoid } from "../lib/nanoid";

// Deadline type
type DeadlineType =
  | "FILING"
  | "RENEWAL"
  | "PAYMENT"
  | "SUBMISSION"
  | "MEETING"
  | "FOLLOWUP"
  | "OTHER";

// Input schemas
const deadlineTypeValues = [
  "FILING",
  "RENEWAL",
  "PAYMENT",
  "SUBMISSION",
  "MEETING",
  "FOLLOWUP",
  "OTHER",
] as const;

const recurrencePatternValues = [
  "NONE",
  "DAILY",
  "WEEKLY",
  "MONTHLY",
  "QUARTERLY",
  "ANNUALLY",
] as const;

const priorityValues = ["LOW", "NORMAL", "HIGH", "URGENT"] as const;

const businessValues = ["GCMC", "KAJ"] as const;

const listDeadlinesSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  type: z.enum(deadlineTypeValues).optional(),
  business: z.enum(businessValues).optional(),
  clientId: z.string().optional(),
  matterId: z.string().optional(),
  assignedStaffId: z.string().optional(),
  isCompleted: z.boolean().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sortBy: z.enum(["dueDate", "createdAt", "title"]).default("dueDate"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

const createDeadlineSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  type: z.enum(deadlineTypeValues),
  clientId: z.string().optional(),
  matterId: z.string().optional(),
  business: z.enum(businessValues).optional(),
  dueDate: z.string(), // ISO date string
  recurrencePattern: z.enum(recurrencePatternValues).default("NONE"),
  recurrenceEndDate: z.string().optional(),
  assignedStaffId: z.string().optional(),
  priority: z.enum(priorityValues).default("NORMAL"),
});

const updateDeadlineSchema = z.object({
  id: z.string(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  type: z.enum(deadlineTypeValues).optional(),
  dueDate: z.string().optional(),
  assignedStaffId: z.string().nullable().optional(),
  priority: z.enum(priorityValues).optional(),
});

// Helper to create reminders for a deadline
async function createReminders(deadlineId: string, dueDate: Date) {
  const reminderDays = [30, 14, 7, 1, 0]; // Days before deadline
  // biome-ignore lint/suspicious/noEvolvingTypes: Auto-fix
  const reminders = [];

  for (const daysBefore of reminderDays) {
    const reminderDate = new Date(dueDate);
    reminderDate.setDate(reminderDate.getDate() - daysBefore);

    // Only create reminder if it's in the future
    if (reminderDate > new Date()) {
      reminders.push({
        deadlineId,
        daysBefore,
        reminderDate,
      });
    }
  }

  if (reminders.length > 0) {
    await db.insert(deadlineReminder).values(reminders);
  }
}

// Helper to calculate next occurrence date based on pattern
function calculateNextOccurrence(
  currentDate: Date,
  pattern: string
): Date | null {
  const nextDate = new Date(currentDate);

  switch (pattern) {
    case "DAILY":
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case "WEEKLY":
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case "MONTHLY":
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case "QUARTERLY":
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    case "ANNUALLY":
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
    case "NONE":
      return null;
    default:
      return null;
  }

  return nextDate;
}

// Generate recurring deadline instances for the next N months
async function generateRecurringInstances(
  parentId: string,
  parentDeadline: {
    title: string;
    description: string | null;
    type: string;
    clientId: string | null;
    matterId: string | null;
    business: string | null;
    dueDate: Date;
    recurrencePattern: string;
    recurrenceEndDate: string | null;
    assignedStaffId: string | null;
    priority: string;
    createdById: string | null;
  },
  monthsAhead = 12
) {
  if (parentDeadline.recurrencePattern === "NONE") {
    return [];
  }

  // biome-ignore lint/suspicious/noEvolvingTypes: Auto-fix
  const instances = [];
  let currentDate = new Date(parentDeadline.dueDate);
  const endDate = parentDeadline.recurrenceEndDate
    ? new Date(parentDeadline.recurrenceEndDate)
    : new Date(
        currentDate.getFullYear() + 2,
        currentDate.getMonth(),
        currentDate.getDate()
      );
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + monthsAhead);

  // Limit generation to earlier of recurrenceEndDate or monthsAhead
  const effectiveEndDate = endDate < maxDate ? endDate : maxDate;

  // Generate instances
  while (true) {
    const nextDate = calculateNextOccurrence(
      currentDate,
      parentDeadline.recurrencePattern
    );
    if (!nextDate || nextDate > effectiveEndDate) {
      break;
    }

    instances.push({
      id: nanoid(),
      title: parentDeadline.title,
      description: parentDeadline.description,
      type: parentDeadline.type as DeadlineType,
      clientId: parentDeadline.clientId,
      matterId: parentDeadline.matterId,
      business: parentDeadline.business as "GCMC" | "KAJ" | null,
      dueDate: nextDate,
      recurrencePattern: "NONE" as const, // Instances don't recur themselves
      recurrenceEndDate: null,
      parentDeadlineId: parentId,
      assignedStaffId: parentDeadline.assignedStaffId,
      priority: parentDeadline.priority as "LOW" | "NORMAL" | "HIGH" | "URGENT",
      createdById: parentDeadline.createdById,
      isCompleted: false,
    });

    currentDate = nextDate;

    // Safety check to prevent infinite loops
    if (instances.length > 200) {
      break;
    }
  }

  // Insert instances and create reminders
  if (instances.length > 0) {
    const insertedInstances = await db
      .insert(deadline)
      .values(instances)
      .returning();

    // Create reminders for each instance
    for (const instance of insertedInstances) {
      await createReminders(instance.id, instance.dueDate);
    }

    return insertedInstances;
  }

  return [];
}

// Deadlines router
export const deadlinesRouter = {
  // List deadlines with pagination and filters
  list: staffProcedure
    .input(listDeadlinesSchema)
    .handler(async ({ input, context }) => {
      const accessibleBusinesses = getAccessibleBusinesses(context.staff);
      // biome-ignore lint/suspicious/noEvolvingTypes: Auto-fix
      const conditions = [];

      // Business filter
      if (input.business) {
        if (!accessibleBusinesses.includes(input.business)) {
          throw new ORPCError("FORBIDDEN", {
            message: "You don't have access to this business",
          });
        }
        conditions.push(eq(deadline.business, input.business));
      } else {
        conditions.push(
          sql`(${deadline.business} IS NULL OR ${deadline.business}::text = ANY(ARRAY[${sql.join(
            accessibleBusinesses.map((b) => sql`${b}`),
            sql`, `
          )}]::text[]))`
        );
      }

      // Type filter
      if (input.type) {
        conditions.push(eq(deadline.type, input.type));
      }

      // Client filter
      if (input.clientId) {
        conditions.push(eq(deadline.clientId, input.clientId));
      }

      // Matter filter
      if (input.matterId) {
        conditions.push(eq(deadline.matterId, input.matterId));
      }

      // Assigned staff filter
      if (input.assignedStaffId) {
        conditions.push(eq(deadline.assignedStaffId, input.assignedStaffId));
      }

      // Completion status filter
      if (input.isCompleted !== undefined) {
        conditions.push(eq(deadline.isCompleted, input.isCompleted));
      }

      // Date range filter
      if (input.startDate) {
        conditions.push(gte(deadline.dueDate, new Date(input.startDate)));
      }
      if (input.endDate) {
        conditions.push(lte(deadline.dueDate, new Date(input.endDate)));
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count
      const countResult = await db
        .select({ total: count() })
        .from(deadline)
        .where(whereClause);

      const total = countResult[0]?.total ?? 0;

      // Get paginated results
      const offset = (input.page - 1) * input.limit;
      const orderColumn = deadline[input.sortBy];
      const orderDirection = input.sortOrder === "asc" ? asc : desc;

      const deadlines = await db.query.deadline.findMany({
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
        deadlines,
        total,
        page: input.page,
        limit: input.limit,
        totalPages: Math.ceil(total / input.limit),
      };
    }),

  // Get calendar data for a date range
  getCalendarData: staffProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
        business: z.enum(businessValues).optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const accessibleBusinesses = getAccessibleBusinesses(context.staff);
      const conditions = [
        gte(deadline.dueDate, new Date(input.startDate)),
        lte(deadline.dueDate, new Date(input.endDate)),
      ];

      if (input.business) {
        if (!accessibleBusinesses.includes(input.business)) {
          throw new ORPCError("FORBIDDEN", {
            message: "You don't have access to this business",
          });
        }
        conditions.push(eq(deadline.business, input.business));
      } else {
        conditions.push(
          sql`(${deadline.business} IS NULL OR ${deadline.business}::text = ANY(ARRAY[${sql.join(
            accessibleBusinesses.map((b) => sql`${b}`),
            sql`, `
          )}]::text[]))`
        );
      }

      const deadlines = await db.query.deadline.findMany({
        where: and(...conditions),
        orderBy: [asc(deadline.dueDate)],
        with: {
          client: {
            columns: { id: true, displayName: true },
          },
          matter: {
            columns: { id: true, referenceNumber: true },
          },
        },
      });

      return deadlines;
    }),

  // Get single deadline by ID
  getById: staffProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      const result = await db.query.deadline.findFirst({
        where: eq(deadline.id, input.id),
        with: {
          client: true,
          matter: true,
          assignedStaff: {
            with: {
              user: true,
            },
          },
          completedBy: true,
          createdBy: true,
          reminders: {
            // biome-ignore lint/nursery/noShadow: Auto-fix
            orderBy: (r, { asc }) => [asc(r.daysBefore)],
          },
        },
      });

      if (!result) {
        throw new ORPCError("NOT_FOUND", { message: "Deadline not found" });
      }

      return result;
    }),

  // Create new deadline
  create: staffProcedure
    .input(createDeadlineSchema)
    .handler(async ({ input, context }) => {
      const dueDate = new Date(input.dueDate);

      const deadlineResult = await db
        .insert(deadline)
        .values({
          ...input,
          dueDate,
          recurrenceEndDate: input.recurrenceEndDate || null,
          createdById: context.session.user.id,
        })
        .returning();

      const newDeadline = deadlineResult[0];
      if (!newDeadline) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to create deadline",
        });
      }

      // Create reminders for parent deadline
      await createReminders(newDeadline.id, dueDate);

      // Generate recurring instances if pattern is set
      if (input.recurrencePattern && input.recurrencePattern !== "NONE") {
        await generateRecurringInstances(newDeadline.id, {
          title: newDeadline.title,
          description: newDeadline.description,
          type: newDeadline.type,
          clientId: newDeadline.clientId,
          matterId: newDeadline.matterId,
          business: newDeadline.business,
          dueDate: newDeadline.dueDate,
          recurrencePattern: newDeadline.recurrencePattern,
          recurrenceEndDate: newDeadline.recurrenceEndDate,
          assignedStaffId: newDeadline.assignedStaffId,
          priority: newDeadline.priority,
          createdById: newDeadline.createdById,
        });
      }

      return newDeadline;
    }),

  // Update deadline
  update: staffProcedure
    .input(updateDeadlineSchema)
    .handler(async ({ input }) => {
      const { id, ...updates } = input;

      const existing = await db.query.deadline.findFirst({
        where: eq(deadline.id, id),
      });

      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Deadline not found" });
      }

      const updateData: Record<string, unknown> = { ...updates };
      if (updates.dueDate) {
        updateData.dueDate = new Date(updates.dueDate);
      }

      const [updated] = await db
        .update(deadline)
        .set(updateData)
        .where(eq(deadline.id, id))
        .returning();

      // If due date changed, recreate reminders
      if (updates.dueDate) {
        await db
          .delete(deadlineReminder)
          .where(eq(deadlineReminder.deadlineId, id));
        await createReminders(id, new Date(updates.dueDate));
      }

      return updated;
    }),

  // Delete deadline
  delete: staffProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      await db.delete(deadline).where(eq(deadline.id, input.id));
      return { success: true };
    }),

  // Mark deadline as complete
  complete: staffProcedure
    .input(z.object({ id: z.string() }))
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Auto-fix
    .handler(async ({ input, context }) => {
      const existing = await db.query.deadline.findFirst({
        where: eq(deadline.id, input.id),
      });

      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Deadline not found" });
      }

      const [updated] = await db
        .update(deadline)
        .set({
          isCompleted: true,
          completedAt: new Date(),
          completedById: context.session.user.id,
        })
        .where(eq(deadline.id, input.id))
        .returning();

      // If this is a recurring instance, generate the next occurrence
      if (existing.parentDeadlineId) {
        const parent = await db.query.deadline.findFirst({
          where: eq(deadline.id, existing.parentDeadlineId),
        });

        if (parent && parent.recurrencePattern !== "NONE") {
          // Check if next instance already exists
          const nextOccurrence = calculateNextOccurrence(
            existing.dueDate,
            parent.recurrencePattern
          );

          if (nextOccurrence) {
            const endDate = parent.recurrenceEndDate
              ? new Date(parent.recurrenceEndDate)
              : null;

            // Only generate if within recurrence end date
            if (!endDate || nextOccurrence <= endDate) {
              const existingNext = await db.query.deadline.findFirst({
                where: and(
                  eq(deadline.parentDeadlineId, parent.id),
                  eq(deadline.dueDate, nextOccurrence)
                ),
              });

              if (!existingNext) {
                // Generate next instance
                const [nextInstance] = await db
                  .insert(deadline)
                  .values({
                    title: parent.title,
                    description: parent.description,
                    type: parent.type,
                    clientId: parent.clientId,
                    matterId: parent.matterId,
                    business: parent.business,
                    dueDate: nextOccurrence,
                    recurrencePattern: "NONE",
                    recurrenceEndDate: null,
                    parentDeadlineId: parent.id,
                    assignedStaffId: parent.assignedStaffId,
                    priority: parent.priority,
                    createdById: parent.createdById,
                    isCompleted: false,
                  })
                  .returning();

                if (nextInstance) {
                  await createReminders(nextInstance.id, nextOccurrence);
                }
              }
            }
          }
        }
      }

      return updated;
    }),

  // Mark deadline as incomplete
  uncomplete: staffProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      const [updated] = await db
        .update(deadline)
        .set({
          isCompleted: false,
          completedAt: null,
          completedById: null,
        })
        .where(eq(deadline.id, input.id))
        .returning();

      if (!updated) {
        throw new ORPCError("NOT_FOUND", { message: "Deadline not found" });
      }

      return updated;
    }),

  // Get upcoming deadlines (for dashboard)
  getUpcoming: staffProcedure
    .input(
      z.object({ days: z.number().default(7), limit: z.number().default(10) })
    )
    .handler(async ({ input, context }) => {
      const accessibleBusinesses = getAccessibleBusinesses(context.staff);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + input.days);

      const deadlines = await db.query.deadline.findMany({
        where: and(
          eq(deadline.isCompleted, false),
          gte(deadline.dueDate, new Date()),
          lte(deadline.dueDate, endDate),
          sql`(${deadline.business} IS NULL OR ${deadline.business}::text = ANY(ARRAY[${sql.join(
            accessibleBusinesses.map((b) => sql`${b}`),
            sql`, `
          )}]::text[]))`
        ),
        orderBy: [asc(deadline.dueDate)],
        limit: input.limit,
        with: {
          client: {
            columns: { id: true, displayName: true },
          },
          matter: {
            columns: { id: true, referenceNumber: true },
          },
        },
      });

      return deadlines;
    }),

  // Get overdue deadlines
  getOverdue: staffProcedure.handler(async ({ context }) => {
    const accessibleBusinesses = getAccessibleBusinesses(context.staff);

    const deadlines = await db.query.deadline.findMany({
      where: and(
        eq(deadline.isCompleted, false),
        lte(deadline.dueDate, new Date()),
        sql`(${deadline.business} IS NULL OR ${deadline.business}::text = ANY(ARRAY[${sql.join(
          accessibleBusinesses.map((b) => sql`${b}`),
          sql`, `
        )}]::text[]))`
      ),
      orderBy: [asc(deadline.dueDate)],
      with: {
        client: {
          columns: { id: true, displayName: true },
        },
        matter: {
          columns: { id: true, referenceNumber: true },
        },
      },
    });

    return deadlines;
  }),

  // Get deadline statistics
  getStats: staffProcedure.handler(async ({ context }) => {
    const accessibleBusinesses = getAccessibleBusinesses(context.staff);
    const businessFilter = sql`(${deadline.business} IS NULL OR ${deadline.business}::text = ANY(ARRAY[${sql.join(
      accessibleBusinesses.map((b) => sql`${b}`),
      sql`, `
    )}]::text[]))`;

    const now = new Date();
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    // Count overdue
    const overdueResults = await db
      .select({ count: count() })
      .from(deadline)
      .where(
        and(
          eq(deadline.isCompleted, false),
          lte(deadline.dueDate, now),
          businessFilter
        )
      );

    // Count due this week
    const weekResults = await db
      .select({ count: count() })
      .from(deadline)
      .where(
        and(
          eq(deadline.isCompleted, false),
          gte(deadline.dueDate, now),
          lte(deadline.dueDate, weekFromNow),
          businessFilter
        )
      );

    // Count completed this month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const completedResults = await db
      .select({ count: count() })
      .from(deadline)
      .where(
        and(
          eq(deadline.isCompleted, true),
          gte(deadline.completedAt, startOfMonth),
          businessFilter
        )
      );

    // Total pending
    const pendingResults = await db
      .select({ count: count() })
      .from(deadline)
      .where(and(eq(deadline.isCompleted, false), businessFilter));

    return {
      overdue: overdueResults[0]?.count ?? 0,
      dueThisWeek: weekResults[0]?.count ?? 0,
      completedThisMonth: completedResults[0]?.count ?? 0,
      totalPending: pendingResults[0]?.count ?? 0,
    };
  }),

  // Get recurrence pattern info for a deadline
  getRecurrencePattern: staffProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      const result = await db.query.deadline.findFirst({
        where: eq(deadline.id, input.id),
        columns: {
          id: true,
          recurrencePattern: true,
          recurrenceEndDate: true,
          parentDeadlineId: true,
        },
      });

      if (!result) {
        throw new ORPCError("NOT_FOUND", { message: "Deadline not found" });
      }

      // If this is an instance, get parent info
      if (result.parentDeadlineId) {
        const parent = await db.query.deadline.findFirst({
          where: eq(deadline.id, result.parentDeadlineId),
          columns: {
            id: true,
            recurrencePattern: true,
            recurrenceEndDate: true,
          },
        });

        return {
          isRecurring: true,
          isInstance: true,
          parentId: result.parentDeadlineId,
          pattern: parent?.recurrencePattern ?? "NONE",
          endDate: parent?.recurrenceEndDate ?? null,
        };
      }

      return {
        isRecurring: result.recurrencePattern !== "NONE",
        isInstance: false,
        parentId: null,
        pattern: result.recurrencePattern,
        endDate: result.recurrenceEndDate,
      };
    }),

  // Update entire recurring series
  updateRecurringSeries: staffProcedure
    .input(
      z.object({
        parentId: z.string(),
        title: z.string().optional(),
        description: z.string().nullable().optional(),
        type: z.enum(deadlineTypeValues).optional(),
        assignedStaffId: z.string().nullable().optional(),
        priority: z.enum(priorityValues).optional(),
        recurrenceEndDate: z.string().nullable().optional(),
      })
    )
    .handler(async ({ input }) => {
      const { parentId, ...updates } = input;

      // Update parent
      const updateData: Record<string, unknown> = {};
      if (updates.title !== undefined) {
        updateData.title = updates.title;
      }
      if (updates.description !== undefined) {
        updateData.description = updates.description;
      }
      if (updates.type !== undefined) {
        updateData.type = updates.type;
      }
      if (updates.assignedStaffId !== undefined) {
        updateData.assignedStaffId = updates.assignedStaffId;
      }
      if (updates.priority !== undefined) {
        updateData.priority = updates.priority;
      }
      if (updates.recurrenceEndDate !== undefined) {
        updateData.recurrenceEndDate = updates.recurrenceEndDate;
      }

      await db
        .update(deadline)
        .set(updateData)
        .where(eq(deadline.id, parentId));

      // Update all future (incomplete) instances
      const futureInstanceUpdates: Record<string, unknown> = {};
      if (updates.title !== undefined) {
        futureInstanceUpdates.title = updates.title;
      }
      if (updates.description !== undefined) {
        futureInstanceUpdates.description = updates.description;
      }
      if (updates.type !== undefined) {
        futureInstanceUpdates.type = updates.type;
      }
      if (updates.assignedStaffId !== undefined) {
        futureInstanceUpdates.assignedStaffId = updates.assignedStaffId;
      }
      if (updates.priority !== undefined) {
        futureInstanceUpdates.priority = updates.priority;
      }

      if (Object.keys(futureInstanceUpdates).length > 0) {
        await db
          .update(deadline)
          .set(futureInstanceUpdates)
          .where(
            and(
              eq(deadline.parentDeadlineId, parentId),
              eq(deadline.isCompleted, false)
            )
          );
      }

      return { success: true };
    }),

  // Generate more instances for a recurring deadline
  generateMoreInstances: staffProcedure
    .input(
      z.object({ parentId: z.string(), monthsAhead: z.number().default(6) })
    )
    .handler(async ({ input }) => {
      const parent = await db.query.deadline.findFirst({
        where: eq(deadline.id, input.parentId),
      });

      if (!parent) {
        throw new ORPCError("NOT_FOUND", { message: "Deadline not found" });
      }

      if (parent.recurrencePattern === "NONE") {
        throw new ORPCError("BAD_REQUEST", {
          message: "This deadline does not have a recurrence pattern",
        });
      }

      const generated = await generateRecurringInstances(
        parent.id,
        {
          title: parent.title,
          description: parent.description,
          type: parent.type,
          clientId: parent.clientId,
          matterId: parent.matterId,
          business: parent.business,
          dueDate: parent.dueDate,
          recurrencePattern: parent.recurrencePattern,
          recurrenceEndDate: parent.recurrenceEndDate,
          assignedStaffId: parent.assignedStaffId,
          priority: parent.priority,
          createdById: parent.createdById,
        },
        input.monthsAhead
      );

      return { generated: generated.length };
    }),

  // Get all instances of a recurring deadline
  getRecurringInstances: staffProcedure
    .input(z.object({ parentId: z.string() }))
    .handler(async ({ input }) => {
      const instances = await db.query.deadline.findMany({
        where: eq(deadline.parentDeadlineId, input.parentId),
        orderBy: [asc(deadline.dueDate)],
        with: {
          client: {
            columns: { id: true, displayName: true },
          },
          matter: {
            columns: { id: true, referenceNumber: true, title: true },
          },
        },
      });

      return instances;
    }),

  // Pre-built Guyana tax deadline templates
  getGuyanaTemplates: staffProcedure.handler(() => {
    const currentYear = new Date().getFullYear();

    return [
      {
        id: "template-monthly-paye",
        title: "Monthly PAYE Returns",
        description:
          "PAYE returns must be filed by the 14th of each month for the previous month",
        type: "FILING" as const,
        priority: "HIGH" as const,
        recurrencePattern: "MONTHLY" as const,
        suggestedDueDay: 14,
        business: "KAJ" as const,
      },
      {
        id: "template-quarterly-vat",
        title: "Quarterly VAT Returns",
        description: "VAT returns due quarterly to the GRA",
        type: "FILING" as const,
        priority: "HIGH" as const,
        recurrencePattern: "QUARTERLY" as const,
        business: "KAJ" as const,
      },
      {
        id: "template-annual-income-tax",
        title: "Annual Income Tax Returns",
        description: "Annual income tax returns due by April 30",
        type: "FILING" as const,
        priority: "URGENT" as const,
        recurrencePattern: "ANNUALLY" as const,
        suggestedDueDate: `${currentYear}-04-30`,
        business: "KAJ" as const,
      },
      {
        id: "template-monthly-nis",
        title: "Monthly NIS Contributions",
        description: "National Insurance Scheme contributions due monthly",
        type: "PAYMENT" as const,
        priority: "HIGH" as const,
        recurrencePattern: "MONTHLY" as const,
        suggestedDueDay: 15,
        business: "KAJ" as const,
      },
      {
        id: "template-work-permit-renewal",
        title: "Work Permit Renewal",
        description: "Annual work permit renewal reminder",
        type: "RENEWAL" as const,
        priority: "URGENT" as const,
        recurrencePattern: "ANNUALLY" as const,
        business: "GCMC" as const,
      },
      {
        id: "template-company-annual-return",
        title: "Company Annual Return",
        description: "Annual company return filing with Registrar of Companies",
        type: "FILING" as const,
        priority: "HIGH" as const,
        recurrencePattern: "ANNUALLY" as const,
        business: "GCMC" as const,
      },
    ];
  }),
};
