import { db, deadline, deadlineReminder } from "@SYNERGY-GY/db";
import { ORPCError } from "@orpc/server";
import { and, asc, count, desc, eq, gte, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { getAccessibleBusinesses, staffProcedure } from "../index";

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

// Deadlines router
export const deadlinesRouter = {
  // List deadlines with pagination and filters
  list: staffProcedure
    .input(listDeadlinesSchema)
    .handler(async ({ input, context }) => {
      const accessibleBusinesses = getAccessibleBusinesses(context.staff);
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
          sql`(${deadline.business} IS NULL OR ${deadline.business} = ANY(ARRAY[${sql.join(accessibleBusinesses, sql`, `)}]::text[]))`
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
      const [{ total }] = await db
        .select({ total: count() })
        .from(deadline)
        .where(whereClause);

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
          sql`(${deadline.business} IS NULL OR ${deadline.business} = ANY(ARRAY[${sql.join(accessibleBusinesses, sql`, `)}]::text[]))`
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

      const [newDeadline] = await db
        .insert(deadline)
        .values({
          ...input,
          dueDate,
          recurrenceEndDate: input.recurrenceEndDate || null,
          createdById: context.session.user.id,
        })
        .returning();

      // Create reminders
      await createReminders(newDeadline.id, dueDate);

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
    .handler(async ({ input, context }) => {
      const [updated] = await db
        .update(deadline)
        .set({
          isCompleted: true,
          completedAt: new Date(),
          completedById: context.session.user.id,
        })
        .where(eq(deadline.id, input.id))
        .returning();

      if (!updated) {
        throw new ORPCError("NOT_FOUND", { message: "Deadline not found" });
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
          sql`(${deadline.business} IS NULL OR ${deadline.business} = ANY(ARRAY[${sql.join(accessibleBusinesses, sql`, `)}]::text[]))`
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
        sql`(${deadline.business} IS NULL OR ${deadline.business} = ANY(ARRAY[${sql.join(accessibleBusinesses, sql`, `)}]::text[]))`
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
    const businessFilter = sql`(${deadline.business} IS NULL OR ${deadline.business} = ANY(ARRAY[${sql.join(accessibleBusinesses, sql`, `)}]::text[]))`;

    const now = new Date();
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    // Count overdue
    const [overdueResult] = await db
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
    const [weekResult] = await db
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
    const [completedResult] = await db
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
    const [pendingResult] = await db
      .select({ count: count() })
      .from(deadline)
      .where(and(eq(deadline.isCompleted, false), businessFilter));

    return {
      overdue: overdueResult.count,
      dueThisWeek: weekResult.count,
      completedThisMonth: completedResult.count,
      totalPending: pendingResult.count,
    };
  }),
};
