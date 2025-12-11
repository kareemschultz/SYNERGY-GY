import { activityLog, db } from "@SYNERGY-GY/db";
import { and, count, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { adminProcedure, staffProcedure } from "../index";

const entityTypeValues = [
  "CLIENT",
  "MATTER",
  "DOCUMENT",
  "DEADLINE",
  "STAFF",
  "SERVICE_TYPE",
  "TEMPLATE",
  "COMMUNICATION",
  "NOTE",
  "SESSION",
] as const;

const actionValues = [
  "CREATE",
  "UPDATE",
  "DELETE",
  "VIEW",
  "LOGIN",
  "LOGOUT",
  "UPLOAD",
  "DOWNLOAD",
  "STATUS_CHANGE",
  "ASSIGN",
  "COMPLETE",
  "ARCHIVE",
] as const;

export const activityRouter = {
  // List activity logs (admin only for full list)
  list: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(50),
        entityType: z.enum(entityTypeValues).optional(),
        entityId: z.string().optional(),
        action: z.enum(actionValues).optional(),
        userId: z.string().optional(),
        staffId: z.string().optional(),
      })
    )
    .handler(async ({ input }) => {
      const conditions = [];

      if (input.entityType) {
        conditions.push(eq(activityLog.entityType, input.entityType));
      }
      if (input.entityId) {
        conditions.push(eq(activityLog.entityId, input.entityId));
      }
      if (input.action) {
        conditions.push(eq(activityLog.action, input.action));
      }
      if (input.userId) {
        conditions.push(eq(activityLog.userId, input.userId));
      }
      if (input.staffId) {
        conditions.push(eq(activityLog.staffId, input.staffId));
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      const countResult = await db
        .select({ total: count() })
        .from(activityLog)
        .where(whereClause);

      const total = countResult[0]?.total ?? 0;

      const offset = (input.page - 1) * input.limit;

      const logs = await db.query.activityLog.findMany({
        where: whereClause,
        orderBy: [desc(activityLog.createdAt)],
        limit: input.limit,
        offset,
        with: {
          user: {
            columns: { id: true, name: true, email: true },
          },
          staff: {
            columns: { id: true, role: true },
          },
        },
      });

      return {
        logs,
        total,
        page: input.page,
        limit: input.limit,
        totalPages: Math.ceil(total / input.limit),
      };
    }),

  // Get activity for a specific entity (any staff can view)
  getByEntity: staffProcedure
    .input(
      z.object({
        entityType: z.enum(entityTypeValues),
        entityId: z.string(),
        limit: z.number().default(20),
      })
    )
    .handler(async ({ input }) => {
      const logs = await db.query.activityLog.findMany({
        where: and(
          eq(activityLog.entityType, input.entityType),
          eq(activityLog.entityId, input.entityId)
        ),
        orderBy: [desc(activityLog.createdAt)],
        limit: input.limit,
        with: {
          user: {
            columns: { id: true, name: true },
          },
          staff: {
            columns: { id: true, role: true },
          },
        },
      });

      return logs;
    }),

  // Get recent activity (for dashboard)
  getRecent: staffProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .handler(async ({ input, context }) => {
      // Only show activity performed by current user or for entities they can access
      const logs = await db.query.activityLog.findMany({
        where: eq(activityLog.staffId, context.staff?.id ?? ""),
        orderBy: [desc(activityLog.createdAt)],
        limit: input.limit,
      });

      return logs;
    }),

  // Get activity stats (for dashboard)
  getStats: adminProcedure
    .input(
      z.object({
        days: z.number().default(7),
      })
    )
    .handler(async ({ input }) => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - input.days);

      // Activity by action type
      const byAction = await db
        .select({
          action: activityLog.action,
          count: count(),
        })
        .from(activityLog)
        .where(sql`${activityLog.createdAt} >= ${cutoffDate}`)
        .groupBy(activityLog.action);

      // Activity by entity type
      const byEntity = await db
        .select({
          entityType: activityLog.entityType,
          count: count(),
        })
        .from(activityLog)
        .where(sql`${activityLog.createdAt} >= ${cutoffDate}`)
        .groupBy(activityLog.entityType);

      // Total count
      const totalResult = await db
        .select({ total: count() })
        .from(activityLog)
        .where(sql`${activityLog.createdAt} >= ${cutoffDate}`);

      const total = totalResult[0]?.total ?? 0;

      return {
        total,
        byAction: byAction.reduce(
          (acc, { action, count }) => {
            acc[action] = count;
            return acc;
          },
          {} as Record<string, number>
        ),
        byEntity: byEntity.reduce(
          (acc, { entityType, count }) => {
            acc[entityType] = count;
            return acc;
          },
          {} as Record<string, number>
        ),
        period: `Last ${input.days} days`,
      };
    }),
};
