import {
  activeTimer,
  db,
  matter,
  staffHourlyRate,
  timeEntry,
} from "@SYNERGY-GY/db";
import { ORPCError } from "@orpc/server";
import type { SQL } from "drizzle-orm";
import { and, count, desc, eq, gte, lte, sql } from "drizzle-orm";
import { z } from "zod";
import {
  canAccessBusiness,
  getAccessibleBusinesses,
  staffProcedure,
} from "../index";

// Business values
const businessValues = ["GCMC", "KAJ"] as const;

// Input schemas
const listTimeEntriesSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  matterId: z.string().optional(),
  staffId: z.string().optional(),
  business: z.enum(businessValues).optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  isBillable: z.boolean().optional(),
  invoiced: z.boolean().optional(), // true = invoiced, false = not invoiced
  sortBy: z.enum(["date", "createdAt", "durationMinutes"]).default("date"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

const createTimeEntrySchema = z.object({
  matterId: z.string(),
  description: z.string().min(1, "Description is required"),
  date: z.string(), // ISO date string
  durationMinutes: z.number().min(1, "Duration must be at least 1 minute"),
  isBillable: z.boolean().default(true),
  hourlyRate: z.string().optional(), // Override default rate
});

const updateTimeEntrySchema = z.object({
  id: z.string(),
  description: z.string().min(1).optional(),
  date: z.string().optional(),
  durationMinutes: z.number().min(1).optional(),
  isBillable: z.boolean().optional(),
  hourlyRate: z.string().optional(),
});

const startTimerSchema = z.object({
  matterId: z.string(),
  description: z.string().optional(),
  isBillable: z.boolean().default(true),
});

const stopTimerSchema = z.object({
  description: z.string().min(1, "Description is required"),
});

/**
 * Calculate total amount from duration and rate
 */
function calculateAmount(
  durationMinutes: number,
  hourlyRate: string | null
): string | null {
  if (!hourlyRate) {
    return null;
  }
  const hours = durationMinutes / 60;
  const rate = Number.parseFloat(hourlyRate);
  return (hours * rate).toFixed(2);
}

/**
 * Time tracking router
 */
export const timeTrackingRouter = {
  /**
   * List time entries with pagination and filters
   */
  list: staffProcedure
    .input(listTimeEntriesSchema)
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: List endpoint requires multiple optional filter conditions (business, matter, staff, date range, billable, invoiced) with dynamic where clause construction
    .handler(async ({ input, context }) => {
      const accessibleBusinesses = getAccessibleBusinesses(context.staff);
      const offset = (input.page - 1) * input.limit;

      const conditions: SQL<unknown>[] = [];

      // Business filter
      if (input.business) {
        if (!accessibleBusinesses.includes(input.business)) {
          throw new ORPCError("FORBIDDEN", {
            message: "You don't have access to this business",
          });
        }
        conditions.push(eq(timeEntry.business, input.business));
      } else {
        conditions.push(
          sql`${timeEntry.business}::text = ANY(ARRAY[${sql.join(
            accessibleBusinesses.map((b) => sql`${b}`),
            sql`, `
          )}]::text[])`
        );
      }

      // Matter filter
      if (input.matterId) {
        conditions.push(eq(timeEntry.matterId, input.matterId));
      }

      // Staff filter
      if (input.staffId) {
        conditions.push(eq(timeEntry.staffId, input.staffId));
      }

      // Date range filters
      if (input.fromDate) {
        conditions.push(gte(timeEntry.date, input.fromDate));
      }
      if (input.toDate) {
        conditions.push(lte(timeEntry.date, input.toDate));
      }

      // Billable filter
      if (input.isBillable !== undefined) {
        conditions.push(eq(timeEntry.isBillable, input.isBillable));
      }

      // Invoiced filter
      if (input.invoiced !== undefined) {
        if (input.invoiced) {
          conditions.push(sql`${timeEntry.invoiceId} IS NOT NULL`);
        } else {
          conditions.push(sql`${timeEntry.invoiceId} IS NULL`);
        }
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      // Get time entries with relations
      const entries = await db.query.timeEntry.findMany({
        where: whereClause,
        orderBy:
          input.sortOrder === "asc"
            ? [sql`${timeEntry[input.sortBy]} ASC`]
            : [desc(timeEntry[input.sortBy])],
        limit: input.limit,
        offset,
        with: {
          matter: {
            columns: { id: true, referenceNumber: true, title: true },
            with: {
              client: { columns: { id: true, displayName: true } },
            },
          },
          staff: {
            with: {
              user: { columns: { id: true, name: true } },
            },
          },
        },
      });

      // Get total count
      const countResult = await db
        .select({ total: count() })
        .from(timeEntry)
        .where(whereClause);
      const total = countResult[0]?.total ?? 0;

      return {
        entries,
        pagination: {
          page: input.page,
          limit: input.limit,
          total,
          totalPages: Math.ceil(total / input.limit),
        },
      };
    }),

  /**
   * Get time entry by ID
   */
  getById: staffProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const entry = await db.query.timeEntry.findFirst({
        where: eq(timeEntry.id, input.id),
        with: {
          matter: {
            with: { client: true },
          },
          staff: {
            with: { user: true },
          },
        },
      });

      if (!entry) {
        throw new ORPCError("NOT_FOUND", {
          message: "Time entry not found",
        });
      }

      if (!canAccessBusiness(context.staff, entry.business)) {
        throw new ORPCError("FORBIDDEN", {
          message: "You don't have access to this time entry",
        });
      }

      return entry;
    }),

  /**
   * Get time entries for a specific matter
   */
  getByMatter: staffProcedure
    .input(z.object({ matterId: z.string() }))
    .handler(async ({ input, context }) => {
      // Get matter to check business access
      const matterData = await db.query.matter.findFirst({
        where: eq(matter.id, input.matterId),
      });

      if (!matterData) {
        throw new ORPCError("NOT_FOUND", {
          message: "Matter not found",
        });
      }

      if (!canAccessBusiness(context.staff, matterData.business)) {
        throw new ORPCError("FORBIDDEN", {
          message: "You don't have access to this matter",
        });
      }

      const entries = await db.query.timeEntry.findMany({
        where: eq(timeEntry.matterId, input.matterId),
        orderBy: [desc(timeEntry.date), desc(timeEntry.createdAt)],
        with: {
          staff: {
            with: { user: { columns: { id: true, name: true } } },
          },
        },
      });

      // Calculate totals
      const totalMinutes = entries.reduce(
        (sum, e) => sum + e.durationMinutes,
        0
      );
      const billableMinutes = entries
        .filter((e) => e.isBillable)
        .reduce((sum, e) => sum + e.durationMinutes, 0);
      const totalAmount = entries
        .filter((e) => e.totalAmount)
        .reduce((sum, e) => sum + Number.parseFloat(e.totalAmount || "0"), 0);

      return {
        entries,
        summary: {
          totalEntries: entries.length,
          totalMinutes,
          totalHours: (totalMinutes / 60).toFixed(2),
          billableMinutes,
          billableHours: (billableMinutes / 60).toFixed(2),
          totalAmount: totalAmount.toFixed(2),
        },
      };
    }),

  /**
   * Create a new time entry
   */
  create: staffProcedure
    .input(createTimeEntrySchema)
    .handler(async ({ input, context }) => {
      // Get matter to get business
      const matterData = await db.query.matter.findFirst({
        where: eq(matter.id, input.matterId),
      });

      if (!matterData) {
        throw new ORPCError("NOT_FOUND", {
          message: "Matter not found",
        });
      }

      if (!canAccessBusiness(context.staff, matterData.business)) {
        throw new ORPCError("FORBIDDEN", {
          message: "You don't have access to this matter",
        });
      }

      // Get staff hourly rate if not provided
      let hourlyRate = input.hourlyRate || null;
      if (!hourlyRate && input.isBillable) {
        const rate = await db.query.staffHourlyRate.findFirst({
          where: and(
            eq(staffHourlyRate.staffId, context.staff.id),
            eq(staffHourlyRate.business, matterData.business),
            lte(staffHourlyRate.effectiveFrom, input.date),
            sql`(${staffHourlyRate.effectiveTo} IS NULL OR ${staffHourlyRate.effectiveTo} >= ${input.date})`
          ),
          orderBy: [desc(staffHourlyRate.effectiveFrom)],
        });
        hourlyRate = rate?.hourlyRate || null;
      }

      const totalAmount = calculateAmount(input.durationMinutes, hourlyRate);

      const [entry] = await db
        .insert(timeEntry)
        .values({
          matterId: input.matterId,
          staffId: context.staff.id,
          business: matterData.business,
          description: input.description,
          date: input.date,
          durationMinutes: input.durationMinutes,
          isBillable: input.isBillable,
          hourlyRate,
          totalAmount,
          createdById: context.session.user.id,
        })
        .returning();

      return entry;
    }),

  /**
   * Update a time entry
   */
  update: staffProcedure
    .input(updateTimeEntrySchema)
    .handler(async ({ input, context }) => {
      const existing = await db.query.timeEntry.findFirst({
        where: eq(timeEntry.id, input.id),
      });

      if (!existing) {
        throw new ORPCError("NOT_FOUND", {
          message: "Time entry not found",
        });
      }

      if (!canAccessBusiness(context.staff, existing.business)) {
        throw new ORPCError("FORBIDDEN", {
          message: "You don't have access to this time entry",
        });
      }

      // Can't update invoiced entries
      if (existing.invoiceId) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Cannot update an invoiced time entry",
        });
      }

      const { id, ...updates } = input;

      // Recalculate total if duration or rate changed
      let totalAmount = existing.totalAmount;
      const newDuration = updates.durationMinutes ?? existing.durationMinutes;
      const newRate = updates.hourlyRate ?? existing.hourlyRate;

      if (updates.durationMinutes || updates.hourlyRate) {
        totalAmount = calculateAmount(newDuration, newRate);
      }

      const [updated] = await db
        .update(timeEntry)
        .set({ ...updates, totalAmount })
        .where(eq(timeEntry.id, id))
        .returning();

      return updated;
    }),

  /**
   * Delete a time entry
   */
  delete: staffProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const existing = await db.query.timeEntry.findFirst({
        where: eq(timeEntry.id, input.id),
      });

      if (!existing) {
        throw new ORPCError("NOT_FOUND", {
          message: "Time entry not found",
        });
      }

      if (!canAccessBusiness(context.staff, existing.business)) {
        throw new ORPCError("FORBIDDEN", {
          message: "You don't have access to this time entry",
        });
      }

      // Can't delete invoiced entries
      if (existing.invoiceId) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Cannot delete an invoiced time entry",
        });
      }

      await db.delete(timeEntry).where(eq(timeEntry.id, input.id));

      return { success: true };
    }),

  // ===== TIMER OPERATIONS =====

  /**
   * Get current active timer for the user
   */
  getActiveTimer: staffProcedure.handler(async ({ context }) => {
    const timer = await db.query.activeTimer.findFirst({
      where: eq(activeTimer.staffId, context.staff.id),
      with: {
        matter: {
          columns: { id: true, referenceNumber: true, title: true },
          with: {
            client: { columns: { id: true, displayName: true } },
          },
        },
      },
    });

    if (!timer) {
      return null;
    }

    // Calculate elapsed time
    const elapsedMs = Date.now() - timer.startedAt.getTime();
    const elapsedMinutes = Math.floor(elapsedMs / 60_000);

    return {
      ...timer,
      elapsedMinutes,
    };
  }),

  /**
   * Start a timer
   */
  startTimer: staffProcedure
    .input(startTimerSchema)
    .handler(async ({ input, context }) => {
      // Check if there's already an active timer
      const existing = await db.query.activeTimer.findFirst({
        where: eq(activeTimer.staffId, context.staff.id),
      });

      if (existing) {
        throw new ORPCError("CONFLICT", {
          message: "You already have an active timer. Please stop it first.",
        });
      }

      // Verify matter exists and user has access
      const matterData = await db.query.matter.findFirst({
        where: eq(matter.id, input.matterId),
      });

      if (!matterData) {
        throw new ORPCError("NOT_FOUND", {
          message: "Matter not found",
        });
      }

      if (!canAccessBusiness(context.staff, matterData.business)) {
        throw new ORPCError("FORBIDDEN", {
          message: "You don't have access to this matter",
        });
      }

      const [timer] = await db
        .insert(activeTimer)
        .values({
          staffId: context.staff.id,
          matterId: input.matterId,
          description: input.description || null,
          startedAt: new Date(),
          isBillable: input.isBillable,
        })
        .returning();

      return timer;
    }),

  /**
   * Stop the active timer and create a time entry
   */
  stopTimer: staffProcedure
    .input(stopTimerSchema)
    .handler(async ({ input, context }) => {
      const timer = await db.query.activeTimer.findFirst({
        where: eq(activeTimer.staffId, context.staff.id),
        with: {
          matter: true,
        },
      });

      if (!timer?.matter) {
        throw new ORPCError("NOT_FOUND", {
          message: "No active timer found",
        });
      }

      // Type assertion for matter relation (Drizzle returns union type)
      const timerMatter = timer.matter as { business: "GCMC" | "KAJ" };

      // Calculate duration
      const endTime = new Date();
      const durationMs = endTime.getTime() - timer.startedAt.getTime();
      const durationMinutes = Math.max(1, Math.round(durationMs / 60_000)); // At least 1 minute

      const timerDate = timer.startedAt.toISOString().split("T")[0] as string;
      const matterBusiness: "GCMC" | "KAJ" = timerMatter.business;

      // Get hourly rate
      let hourlyRate: string | null = null;
      if (timer.isBillable) {
        const rate = await db.query.staffHourlyRate.findFirst({
          where: and(
            eq(staffHourlyRate.staffId, context.staff.id),
            eq(staffHourlyRate.business, matterBusiness),
            lte(staffHourlyRate.effectiveFrom, timerDate),
            sql`(${staffHourlyRate.effectiveTo} IS NULL OR ${staffHourlyRate.effectiveTo} >= ${timerDate})`
          ),
          orderBy: [desc(staffHourlyRate.effectiveFrom)],
        });
        hourlyRate = rate?.hourlyRate || null;
      }

      const totalAmount = calculateAmount(durationMinutes, hourlyRate);

      // Create time entry
      const [entry] = await db
        .insert(timeEntry)
        .values({
          matterId: timer.matterId,
          staffId: context.staff.id,
          business: matterBusiness,
          description: input.description,
          date: timerDate,
          durationMinutes,
          isBillable: timer.isBillable,
          hourlyRate,
          totalAmount,
          timerStartedAt: timer.startedAt,
          timerEndedAt: endTime,
          createdById: context.session.user.id,
        })
        .returning();

      // Delete the active timer
      await db.delete(activeTimer).where(eq(activeTimer.id, timer.id));

      return entry;
    }),

  /**
   * Cancel the active timer without saving
   */
  cancelTimer: staffProcedure.handler(async ({ context }) => {
    const timer = await db.query.activeTimer.findFirst({
      where: eq(activeTimer.staffId, context.staff.id),
    });

    if (!timer) {
      throw new ORPCError("NOT_FOUND", {
        message: "No active timer found",
      });
    }

    await db.delete(activeTimer).where(eq(activeTimer.id, timer.id));

    return { success: true };
  }),

  // ===== SUMMARY & REPORTING =====

  /**
   * Get time entry summary for a date range
   */
  getSummary: staffProcedure
    .input(
      z.object({
        fromDate: z.string(),
        toDate: z.string(),
        business: z.enum(businessValues).optional(),
        staffId: z.string().optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const accessibleBusinesses = getAccessibleBusinesses(context.staff);

      const conditions = [
        gte(timeEntry.date, input.fromDate),
        lte(timeEntry.date, input.toDate),
      ];

      if (input.business) {
        if (!accessibleBusinesses.includes(input.business)) {
          throw new ORPCError("FORBIDDEN", {
            message: "You don't have access to this business",
          });
        }
        conditions.push(eq(timeEntry.business, input.business));
      } else {
        conditions.push(
          sql`${timeEntry.business}::text = ANY(ARRAY[${sql.join(
            accessibleBusinesses.map((b) => sql`${b}`),
            sql`, `
          )}]::text[])`
        );
      }

      if (input.staffId) {
        conditions.push(eq(timeEntry.staffId, input.staffId));
      }

      const whereClause = and(...conditions);

      // Get summary statistics
      const [stats] = await db
        .select({
          totalEntries: count(),
          totalMinutes: sql<number>`COALESCE(SUM(${timeEntry.durationMinutes}), 0)`,
          billableMinutes: sql<number>`COALESCE(SUM(CASE WHEN ${timeEntry.isBillable} THEN ${timeEntry.durationMinutes} ELSE 0 END), 0)`,
          totalAmount: sql<string>`COALESCE(SUM(CAST(${timeEntry.totalAmount} AS DECIMAL)), 0)`,
          invoicedAmount: sql<string>`COALESCE(SUM(CASE WHEN ${timeEntry.invoiceId} IS NOT NULL THEN CAST(${timeEntry.totalAmount} AS DECIMAL) ELSE 0 END), 0)`,
        })
        .from(timeEntry)
        .where(whereClause);

      return {
        totalEntries: stats?.totalEntries ?? 0,
        totalMinutes: stats?.totalMinutes ?? 0,
        totalHours: ((stats?.totalMinutes ?? 0) / 60).toFixed(2),
        billableMinutes: stats?.billableMinutes ?? 0,
        billableHours: ((stats?.billableMinutes ?? 0) / 60).toFixed(2),
        totalAmount: stats?.totalAmount ?? "0",
        invoicedAmount: stats?.invoicedAmount ?? "0",
        uninvoicedAmount: (
          Number.parseFloat(stats?.totalAmount ?? "0") -
          Number.parseFloat(stats?.invoicedAmount ?? "0")
        ).toFixed(2),
      };
    }),

  // ===== HOURLY RATES =====

  /**
   * Get hourly rates for a staff member
   */
  getHourlyRates: staffProcedure
    .input(z.object({ staffId: z.string() }))
    .handler(async ({ input, context }) => {
      // SECURITY: Staff can only view their own rates
      // unless they have manager/admin access to at least one business
      const accessibleBusinesses = getAccessibleBusinesses(context.staff);
      const isOwnRates = input.staffId === context.staff.id;
      const isManager =
        context.staff.role === "OWNER" ||
        context.staff.role === "GCMC_MANAGER" ||
        context.staff.role === "KAJ_MANAGER";

      if (!(isOwnRates || isManager)) {
        throw new ORPCError("FORBIDDEN", {
          message: "You can only view your own hourly rates",
        });
      }

      const rates = await db.query.staffHourlyRate.findMany({
        where: eq(staffHourlyRate.staffId, input.staffId),
        orderBy: [desc(staffHourlyRate.effectiveFrom)],
      });

      // If not own rates, filter to only accessible businesses
      if (!isOwnRates) {
        return rates.filter((r) => accessibleBusinesses.includes(r.business));
      }

      return rates;
    }),

  /**
   * Set hourly rate for a staff member
   */
  setHourlyRate: staffProcedure
    .input(
      z.object({
        staffId: z.string(),
        business: z.enum(businessValues),
        hourlyRate: z.string(),
        effectiveFrom: z.string(),
      })
    )
    .handler(async ({ input, context }) => {
      if (!canAccessBusiness(context.staff, input.business)) {
        throw new ORPCError("FORBIDDEN", {
          message: "You don't have access to this business",
        });
      }

      // End any current active rate
      await db
        .update(staffHourlyRate)
        .set({ effectiveTo: input.effectiveFrom })
        .where(
          and(
            eq(staffHourlyRate.staffId, input.staffId),
            eq(staffHourlyRate.business, input.business),
            sql`${staffHourlyRate.effectiveTo} IS NULL`
          )
        );

      // Create new rate
      const [rate] = await db
        .insert(staffHourlyRate)
        .values({
          staffId: input.staffId,
          business: input.business,
          hourlyRate: input.hourlyRate,
          effectiveFrom: input.effectiveFrom,
        })
        .returning();

      return rate;
    }),
};
