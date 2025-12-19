import {
  client,
  db,
  deadline,
  invoice,
  matter,
  staff,
  user,
} from "@SYNERGY-GY/db";
import { and, count, eq, gte, lte, sql } from "drizzle-orm";
import { z } from "zod";
import {
  adminProcedure,
  getAccessibleBusinesses,
  staffProcedure,
} from "../index";

/**
 * Calculate percentage growth between two periods.
 * Returns 100 if only current period has value, 0 if both are zero.
 */
function calculateGrowthPercentage(
  currentValue: number,
  previousValue: number
): number {
  if (previousValue > 0) {
    return ((currentValue - previousValue) / previousValue) * 100;
  }
  if (currentValue > 0) {
    return 100;
  }
  return 0;
}

// Analytics router for dashboard visualizations
export const analyticsRouter = {
  // Get KPI overview
  getKPIs: staffProcedure.handler(async ({ context }) => {
    const accessibleBusinesses = getAccessibleBusinesses(context.staff);

    // Date calculations
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Client counts
    const totalClientsResult = await db
      .select({ count: count() })
      .from(client)
      .where(
        sql`${client.businesses} && ARRAY[${sql.join(accessibleBusinesses, sql`, `)}]::text[]`
      );

    const newClientsThisMonthResult = await db
      .select({ count: count() })
      .from(client)
      .where(
        and(
          sql`${client.businesses} && ARRAY[${sql.join(accessibleBusinesses, sql`, `)}]::text[]`,
          gte(client.createdAt, startOfMonth)
        )
      );

    const newClientsLastMonthResult = await db
      .select({ count: count() })
      .from(client)
      .where(
        and(
          sql`${client.businesses} && ARRAY[${sql.join(accessibleBusinesses, sql`, `)}]::text[]`,
          gte(client.createdAt, startOfLastMonth),
          lte(client.createdAt, endOfLastMonth)
        )
      );

    // Matter counts
    const totalMattersResult = await db
      .select({ count: count() })
      .from(matter)
      .where(
        sql`${matter.business}::text = ANY(ARRAY[${sql.join(accessibleBusinesses, sql`, `)}]::text[])`
      );

    const completedMattersThisMonthResult = await db
      .select({ count: count() })
      .from(matter)
      .where(
        and(
          sql`${matter.business}::text = ANY(ARRAY[${sql.join(accessibleBusinesses, sql`, `)}]::text[])`,
          eq(matter.status, "COMPLETE"),
          gte(matter.updatedAt, startOfMonth)
        )
      );

    // Deadline stats
    const overdueDeadlinesResult = await db
      .select({ count: count() })
      .from(deadline)
      .where(
        and(
          eq(deadline.isCompleted, false),
          lte(deadline.dueDate, now),
          sql`(${deadline.business} IS NULL OR ${deadline.business}::text = ANY(ARRAY[${sql.join(accessibleBusinesses, sql`, `)}]::text[]))`
        )
      );

    const completedDeadlinesThisMonthResult = await db
      .select({ count: count() })
      .from(deadline)
      .where(
        and(
          eq(deadline.isCompleted, true),
          gte(deadline.completedAt, startOfMonth),
          sql`(${deadline.business} IS NULL OR ${deadline.business}::text = ANY(ARRAY[${sql.join(accessibleBusinesses, sql`, `)}]::text[]))`
        )
      );

    const totalDeadlinesThisMonthResult = await db
      .select({ count: count() })
      .from(deadline)
      .where(
        and(
          gte(deadline.dueDate, startOfMonth),
          lte(deadline.dueDate, now),
          sql`(${deadline.business} IS NULL OR ${deadline.business}::text = ANY(ARRAY[${sql.join(accessibleBusinesses, sql`, `)}]::text[]))`
        )
      );

    // Revenue (from invoices) - format dates as strings for date type comparison
    const formatDate = (d: Date) => d.toISOString().split("T")[0];

    const revenueThisMonthResult = await db
      .select({
        total: sql<string>`COALESCE(SUM(CAST(${invoice.amountPaid} AS DECIMAL)), 0)`,
      })
      .from(invoice)
      .where(
        and(
          sql`${invoice.business}::text = ANY(ARRAY[${sql.join(accessibleBusinesses, sql`, `)}]::text[])`,
          eq(invoice.status, "PAID"),
          sql`${invoice.paidDate} >= ${formatDate(startOfMonth)}`
        )
      );

    const revenueLastMonthResult = await db
      .select({
        total: sql<string>`COALESCE(SUM(CAST(${invoice.amountPaid} AS DECIMAL)), 0)`,
      })
      .from(invoice)
      .where(
        and(
          sql`${invoice.business}::text = ANY(ARRAY[${sql.join(accessibleBusinesses, sql`, `)}]::text[])`,
          eq(invoice.status, "PAID"),
          sql`${invoice.paidDate} >= ${formatDate(startOfLastMonth)}`,
          sql`${invoice.paidDate} <= ${formatDate(endOfLastMonth)}`
        )
      );

    const revenueYTDResult = await db
      .select({
        total: sql<string>`COALESCE(SUM(CAST(${invoice.amountPaid} AS DECIMAL)), 0)`,
      })
      .from(invoice)
      .where(
        and(
          sql`${invoice.business}::text = ANY(ARRAY[${sql.join(accessibleBusinesses, sql`, `)}]::text[])`,
          eq(invoice.status, "PAID"),
          sql`${invoice.paidDate} >= ${formatDate(startOfYear)}`
        )
      );

    // Calculate percentage changes
    const newClientsThisMonth = newClientsThisMonthResult[0]?.count ?? 0;
    const newClientsLastMonth = newClientsLastMonthResult[0]?.count ?? 0;
    const clientGrowth = calculateGrowthPercentage(
      newClientsThisMonth,
      newClientsLastMonth
    );

    const revenueThisMonth = Number.parseFloat(
      revenueThisMonthResult[0]?.total ?? "0"
    );
    const revenueLastMonth = Number.parseFloat(
      revenueLastMonthResult[0]?.total ?? "0"
    );
    const revenueGrowth = calculateGrowthPercentage(
      revenueThisMonth,
      revenueLastMonth
    );

    const completedDeadlines = completedDeadlinesThisMonthResult[0]?.count ?? 0;
    const totalDeadlines = totalDeadlinesThisMonthResult[0]?.count ?? 0;
    const deadlineCompletionRate =
      totalDeadlines > 0 ? (completedDeadlines / totalDeadlines) * 100 : 100;

    return {
      clients: {
        total: totalClientsResult[0]?.count ?? 0,
        newThisMonth: newClientsThisMonth,
        growth: Math.round(clientGrowth),
      },
      matters: {
        total: totalMattersResult[0]?.count ?? 0,
        completedThisMonth: completedMattersThisMonthResult[0]?.count ?? 0,
      },
      deadlines: {
        overdue: overdueDeadlinesResult[0]?.count ?? 0,
        completionRate: Math.round(deadlineCompletionRate),
      },
      revenue: {
        thisMonth: revenueThisMonth,
        lastMonth: revenueLastMonth,
        ytd: Number.parseFloat(revenueYTDResult[0]?.total ?? "0"),
        growth: Math.round(revenueGrowth),
      },
    };
  }),

  // Get monthly trends for charts
  getMonthlyTrends: staffProcedure
    .input(
      z.object({
        months: z.number().min(1).max(24).default(12),
      })
    )
    .handler(async ({ input, context }) => {
      const accessibleBusinesses = getAccessibleBusinesses(context.staff);
      const now = new Date();
      const trends: {
        month: string;
        monthKey: string;
        clients: number;
        matters: number;
        revenue: number;
        deadlinesCompleted: number;
      }[] = [];

      for (let i = input.months - 1; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

        // New clients this month
        const clientsResult = await db
          .select({ count: count() })
          .from(client)
          .where(
            and(
              sql`${client.businesses} && ARRAY[${sql.join(accessibleBusinesses, sql`, `)}]::text[]`,
              gte(client.createdAt, monthStart),
              lte(client.createdAt, monthEnd)
            )
          );

        // New matters this month
        const mattersResult = await db
          .select({ count: count() })
          .from(matter)
          .where(
            and(
              sql`${matter.business}::text = ANY(ARRAY[${sql.join(accessibleBusinesses, sql`, `)}]::text[])`,
              gte(matter.createdAt, monthStart),
              lte(matter.createdAt, monthEnd)
            )
          );

        // Revenue this month - use string format for date comparison
        const formatDate = (d: Date) => d.toISOString().split("T")[0];
        const revenueResult = await db
          .select({
            total: sql<string>`COALESCE(SUM(CAST(${invoice.amountPaid} AS DECIMAL)), 0)`,
          })
          .from(invoice)
          .where(
            and(
              sql`${invoice.business}::text = ANY(ARRAY[${sql.join(accessibleBusinesses, sql`, `)}]::text[])`,
              eq(invoice.status, "PAID"),
              sql`${invoice.paidDate} >= ${formatDate(monthStart)}`,
              sql`${invoice.paidDate} <= ${formatDate(monthEnd)}`
            )
          );

        // Completed deadlines
        const deadlinesResult = await db
          .select({ count: count() })
          .from(deadline)
          .where(
            and(
              eq(deadline.isCompleted, true),
              gte(deadline.completedAt, monthStart),
              lte(deadline.completedAt, monthEnd),
              sql`(${deadline.business} IS NULL OR ${deadline.business}::text = ANY(ARRAY[${sql.join(accessibleBusinesses, sql`, `)}]::text[]))`
            )
          );

        trends.push({
          month: monthStart.toLocaleString("default", {
            month: "short",
            year: "numeric",
          }),
          monthKey: `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, "0")}`,
          clients: clientsResult[0]?.count ?? 0,
          matters: mattersResult[0]?.count ?? 0,
          revenue: Number.parseFloat(revenueResult[0]?.total ?? "0"),
          deadlinesCompleted: deadlinesResult[0]?.count ?? 0,
        });
      }

      return trends;
    }),

  // Get matters by service type category for pie chart
  getMattersByCategory: staffProcedure.handler(async ({ context }) => {
    const accessibleBusinesses = getAccessibleBusinesses(context.staff);

    // Get matters grouped by service type, then aggregate by category
    const matters = await db.query.matter.findMany({
      where: sql`${matter.business}::text = ANY(ARRAY[${sql.join(accessibleBusinesses, sql`, `)}]::text[])`,
      with: {
        serviceType: {
          columns: {
            category: true,
          },
        },
      },
    });

    // Aggregate by service type category
    const categoryMap = new Map<string, number>();
    for (const m of matters) {
      const category = m.serviceType?.category ?? "OTHER";
      categoryMap.set(category, (categoryMap.get(category) ?? 0) + 1);
    }

    return Array.from(categoryMap.entries()).map(([name, value]) => ({
      name,
      value,
    }));
  }),

  // Get revenue by business for pie chart
  getRevenueByBusiness: staffProcedure.handler(async ({ context }) => {
    const accessibleBusinesses = getAccessibleBusinesses(context.staff);

    const revenueCounts = await db
      .select({
        business: invoice.business,
        total: sql<string>`COALESCE(SUM(CAST(${invoice.amountPaid} AS DECIMAL)), 0)`,
      })
      .from(invoice)
      .where(
        and(
          sql`${invoice.business}::text = ANY(ARRAY[${sql.join(accessibleBusinesses, sql`, `)}]::text[])`,
          eq(invoice.status, "PAID")
        )
      )
      .groupBy(invoice.business);

    return revenueCounts.map(({ business, total }) => ({
      name: business,
      value: Number.parseFloat(total),
    }));
  }),

  // Get staff workload distribution
  getStaffWorkload: adminProcedure.handler(async ({ context }) => {
    const accessibleBusinesses = getAccessibleBusinesses(context.staff);

    // Get active staff
    const staffList = await db
      .select({
        staffId: staff.id,
        staffName: user.name,
      })
      .from(staff)
      .innerJoin(user, eq(staff.userId, user.id))
      .where(eq(staff.isActive, true));

    // Get matter counts per staff
    const workload: {
      name: string;
      activeMatters: number;
      pendingDeadlines: number;
      total: number;
    }[] = [];
    for (const s of staffList) {
      const matterCount = await db
        .select({ count: count() })
        .from(matter)
        .where(
          and(
            eq(matter.assignedStaffId, s.staffId),
            sql`${matter.status} NOT IN ('COMPLETE', 'CANCELLED')`,
            sql`${matter.business}::text = ANY(ARRAY[${sql.join(accessibleBusinesses, sql`, `)}]::text[])`
          )
        );

      const deadlineCount = await db
        .select({ count: count() })
        .from(deadline)
        .where(
          and(
            eq(deadline.assignedStaffId, s.staffId),
            eq(deadline.isCompleted, false)
          )
        );

      workload.push({
        name: s.staffName || "Unknown",
        activeMatters: matterCount[0]?.count ?? 0,
        pendingDeadlines: deadlineCount[0]?.count ?? 0,
        total: (matterCount[0]?.count ?? 0) + (deadlineCount[0]?.count ?? 0),
      });
    }

    return workload.sort((a, b) => b.total - a.total);
  }),

  // Get deadline status distribution
  getDeadlineDistribution: staffProcedure.handler(async ({ context }) => {
    const accessibleBusinesses = getAccessibleBusinesses(context.staff);
    const now = new Date();
    const weekFromNow = new Date();
    weekFromNow.setDate(now.getDate() + 7);

    const businessFilter = sql`(${deadline.business} IS NULL OR ${deadline.business}::text = ANY(ARRAY[${sql.join(accessibleBusinesses, sql`, `)}]::text[]))`;

    // Overdue
    const overdueResult = await db
      .select({ count: count() })
      .from(deadline)
      .where(
        and(
          eq(deadline.isCompleted, false),
          lte(deadline.dueDate, now),
          businessFilter
        )
      );

    // Due this week
    const dueThisWeekResult = await db
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

    // Upcoming (beyond this week)
    const upcomingResult = await db
      .select({ count: count() })
      .from(deadline)
      .where(
        and(
          eq(deadline.isCompleted, false),
          gte(deadline.dueDate, weekFromNow),
          businessFilter
        )
      );

    // Completed
    const completedResult = await db
      .select({ count: count() })
      .from(deadline)
      .where(and(eq(deadline.isCompleted, true), businessFilter));

    return [
      { name: "Overdue", value: overdueResult[0]?.count ?? 0, fill: "#ef4444" },
      {
        name: "Due This Week",
        value: dueThisWeekResult[0]?.count ?? 0,
        fill: "#f59e0b",
      },
      {
        name: "Upcoming",
        value: upcomingResult[0]?.count ?? 0,
        fill: "#3b82f6",
      },
      {
        name: "Completed",
        value: completedResult[0]?.count ?? 0,
        fill: "#22c55e",
      },
    ];
  }),

  // Get client type distribution
  getClientTypeDistribution: staffProcedure.handler(async ({ context }) => {
    const accessibleBusinesses = getAccessibleBusinesses(context.staff);

    const typeCounts = await db
      .select({
        type: client.type,
        count: count(),
      })
      .from(client)
      .where(
        sql`${client.businesses} && ARRAY[${sql.join(accessibleBusinesses, sql`, `)}]::text[]`
      )
      .groupBy(client.type);

    const typeLabels: Record<string, string> = {
      INDIVIDUAL: "Individual",
      SMALL_BUSINESS: "Small Business",
      CORPORATION: "Corporation",
      NGO: "NGO",
      COOP: "Co-operative",
      CREDIT_UNION: "Credit Union",
      FOREIGN_NATIONAL: "Foreign National",
      INVESTOR: "Investor",
    };

    return typeCounts.map(({ type, count: c }) => ({
      name: typeLabels[type] || type,
      value: c,
    }));
  }),
};
