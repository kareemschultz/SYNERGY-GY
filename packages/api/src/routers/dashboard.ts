import { client, db, deadline, document, matter } from "@SYNERGY-GY/db";
import { and, count, eq, gte, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { getAccessibleBusinesses, staffProcedure } from "../index";

// Dashboard router
export const dashboardRouter = {
  // Get overall statistics
  getStats: staffProcedure.handler(async ({ context }) => {
    const accessibleBusinesses = getAccessibleBusinesses(context.staff);
    const businessFilter = sql`${client.businesses} && ARRAY[${sql.join(accessibleBusinesses, sql`, `)}]::text[]`;
    const matterBusinessFilter = sql`${matter.business} = ANY(ARRAY[${sql.join(accessibleBusinesses, sql`, `)}]::text[])`;
    const deadlineBusinessFilter = sql`(${deadline.business} IS NULL OR ${deadline.business} = ANY(ARRAY[${sql.join(accessibleBusinesses, sql`, `)}]::text[]))`;

    // Active clients
    const activeClientsResult = await db
      .select({ count: count() })
      .from(client)
      .where(and(eq(client.status, "ACTIVE"), businessFilter));

    // Open matters
    const openMattersResult = await db
      .select({ count: count() })
      .from(matter)
      .where(
        and(
          sql`${matter.status} NOT IN ('COMPLETE', 'CANCELLED')`,
          matterBusinessFilter
        )
      );

    // Pending documents (documents without expiration or with future expiration)
    const totalDocumentsResult = await db
      .select({ count: count() })
      .from(document)
      .where(eq(document.status, "ACTIVE"));

    // Upcoming deadlines (next 7 days)
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    const upcomingDeadlinesResult = await db
      .select({ count: count() })
      .from(deadline)
      .where(
        and(
          eq(deadline.isCompleted, false),
          gte(deadline.dueDate, new Date()),
          lte(deadline.dueDate, weekFromNow),
          deadlineBusinessFilter
        )
      );

    // Overdue deadlines
    const overdueDeadlinesResult = await db
      .select({ count: count() })
      .from(deadline)
      .where(
        and(
          eq(deadline.isCompleted, false),
          lte(deadline.dueDate, new Date()),
          deadlineBusinessFilter
        )
      );

    return {
      activeClients: activeClientsResult[0]?.count ?? 0,
      openMatters: openMattersResult[0]?.count ?? 0,
      totalDocuments: totalDocumentsResult[0]?.count ?? 0,
      upcomingDeadlines: upcomingDeadlinesResult[0]?.count ?? 0,
      overdueDeadlines: overdueDeadlinesResult[0]?.count ?? 0,
    };
  }),

  // Get matters by status
  getMattersByStatus: staffProcedure.handler(async ({ context }) => {
    const accessibleBusinesses = getAccessibleBusinesses(context.staff);

    const statusCounts = await db
      .select({
        status: matter.status,
        count: count(),
      })
      .from(matter)
      .where(
        sql`${matter.business} = ANY(ARRAY[${sql.join(accessibleBusinesses, sql`, `)}]::text[])`
      )
      .groupBy(matter.status);

    return statusCounts.reduce(
      (acc, { status, count }) => {
        acc[status] = count;
        return acc;
      },
      {} as Record<string, number>
    );
  }),

  // Get recent matters
  getRecentMatters: staffProcedure
    .input(z.object({ limit: z.number().default(5) }))
    .handler(async ({ input, context }) => {
      const accessibleBusinesses = getAccessibleBusinesses(context.staff);

      const matters = await db.query.matter.findMany({
        where: sql`${matter.business} = ANY(ARRAY[${sql.join(accessibleBusinesses, sql`, `)}]::text[])`,
        orderBy: (m, { desc }) => [desc(m.createdAt)],
        limit: input.limit,
        with: {
          client: {
            columns: { id: true, displayName: true },
          },
          serviceType: {
            columns: { id: true, name: true },
          },
        },
      });

      return matters;
    }),

  // Get upcoming deadlines
  getUpcomingDeadlines: staffProcedure
    .input(z.object({ limit: z.number().default(5) }))
    .handler(async ({ input, context }) => {
      const accessibleBusinesses = getAccessibleBusinesses(context.staff);
      const deadlineBusinessFilter = sql`(${deadline.business} IS NULL OR ${deadline.business} = ANY(ARRAY[${sql.join(accessibleBusinesses, sql`, `)}]::text[]))`;

      const deadlines = await db.query.deadline.findMany({
        where: and(
          eq(deadline.isCompleted, false),
          gte(deadline.dueDate, new Date()),
          deadlineBusinessFilter
        ),
        orderBy: (d, { asc }) => [asc(d.dueDate)],
        limit: input.limit,
        with: {
          client: {
            columns: { id: true, displayName: true },
          },
        },
      });

      return deadlines;
    }),

  // Get recent clients
  getRecentClients: staffProcedure
    .input(z.object({ limit: z.number().default(5) }))
    .handler(async ({ input, context }) => {
      const accessibleBusinesses = getAccessibleBusinesses(context.staff);

      const clients = await db.query.client.findMany({
        where: and(
          eq(client.status, "ACTIVE"),
          sql`${client.businesses} && ARRAY[${sql.join(accessibleBusinesses, sql`, `)}]::text[]`
        ),
        orderBy: (c, { desc }) => [desc(c.createdAt)],
        limit: input.limit,
      });

      return clients;
    }),

  // Get matters statistics by business
  getMattersByBusiness: staffProcedure.handler(async ({ context }) => {
    const accessibleBusinesses = getAccessibleBusinesses(context.staff);

    const businessCounts = await db
      .select({
        business: matter.business,
        count: count(),
      })
      .from(matter)
      .where(
        sql`${matter.business} = ANY(ARRAY[${sql.join(accessibleBusinesses, sql`, `)}]::text[])`
      )
      .groupBy(matter.business);

    return businessCounts.reduce(
      (acc, { business, count }) => {
        acc[business] = count;
        return acc;
      },
      {} as Record<string, number>
    );
  }),
};
