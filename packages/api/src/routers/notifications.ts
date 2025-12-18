import { db, notification, notificationPreference } from "@SYNERGY-GY/db";
import { ORPCError } from "@orpc/server";
import { and, count, desc, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, staffProcedure } from "../index";

// Notification types
const notificationTypeValues = [
  "ASSIGNMENT",
  "DEADLINE_APPROACHING",
  "DEADLINE_OVERDUE",
  "DOCUMENT_UPLOADED",
  "MATTER_STATUS_CHANGE",
  "INVOICE_CREATED",
  "INVOICE_PAID",
  "INVOICE_OVERDUE",
  "CLIENT_PORTAL_ACTIVITY",
  "SYSTEM",
] as const;

const notificationPriorityValues = ["LOW", "NORMAL", "HIGH", "URGENT"] as const;

// Input schemas
const listNotificationsSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  unreadOnly: z.boolean().default(false),
  type: z.enum(notificationTypeValues).optional(),
});

const createNotificationSchema = z.object({
  userId: z.string(),
  type: z.enum(notificationTypeValues),
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "Message is required"),
  priority: z.enum(notificationPriorityValues).default("NORMAL"),
  link: z.string().optional(),
  matterId: z.string().optional(),
  clientId: z.string().optional(),
  invoiceId: z.string().optional(),
  documentId: z.string().optional(),
  deadlineId: z.string().optional(),
});

const updatePreferencesSchema = z.object({
  enableAssignment: z.boolean().optional(),
  enableDeadlineApproaching: z.boolean().optional(),
  enableDeadlineOverdue: z.boolean().optional(),
  enableDocumentUploaded: z.boolean().optional(),
  enableMatterStatusChange: z.boolean().optional(),
  enableInvoiceCreated: z.boolean().optional(),
  enableInvoicePaid: z.boolean().optional(),
  enableInvoiceOverdue: z.boolean().optional(),
  enableClientPortalActivity: z.boolean().optional(),
  enableSystem: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
  emailDigestFrequency: z.enum(["NEVER", "DAILY", "WEEKLY"]).optional(),
});

/**
 * Helper function to create a notification
 * This can be used by other routers to create notifications
 */
export async function createNotification(
  data: z.infer<typeof createNotificationSchema>
): Promise<void> {
  // Check user preferences
  const prefs = await db.query.notificationPreference.findFirst({
    where: eq(notificationPreference.userId, data.userId),
  });

  // If user has preferences, check if this type is enabled
  if (prefs) {
    const typeToPreference: Record<string, keyof typeof prefs> = {
      ASSIGNMENT: "enableAssignment",
      DEADLINE_APPROACHING: "enableDeadlineApproaching",
      DEADLINE_OVERDUE: "enableDeadlineOverdue",
      DOCUMENT_UPLOADED: "enableDocumentUploaded",
      MATTER_STATUS_CHANGE: "enableMatterStatusChange",
      INVOICE_CREATED: "enableInvoiceCreated",
      INVOICE_PAID: "enableInvoicePaid",
      INVOICE_OVERDUE: "enableInvoiceOverdue",
      CLIENT_PORTAL_ACTIVITY: "enableClientPortalActivity",
      SYSTEM: "enableSystem",
    };

    const prefKey = typeToPreference[data.type];
    if (prefKey && prefs[prefKey] === false) {
      // User has disabled this notification type
      return;
    }
  }

  // Create the notification
  await db.insert(notification).values({
    userId: data.userId,
    type: data.type,
    title: data.title,
    message: data.message,
    priority: data.priority,
    link: data.link || null,
    matterId: data.matterId || null,
    clientId: data.clientId || null,
    invoiceId: data.invoiceId || null,
    documentId: data.documentId || null,
    deadlineId: data.deadlineId || null,
  });
}

/**
 * Notifications router
 */
export const notificationsRouter = {
  /**
   * List notifications for the current user
   */
  list: protectedProcedure
    .input(listNotificationsSchema)
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;
      const offset = (input.page - 1) * input.limit;

      const conditions = [
        eq(notification.userId, userId),
        isNull(notification.dismissedAt),
      ];

      if (input.unreadOnly) {
        conditions.push(isNull(notification.readAt));
      }

      if (input.type) {
        conditions.push(eq(notification.type, input.type));
      }

      const whereClause = and(...conditions);

      const notifications = await db.query.notification.findMany({
        where: whereClause,
        orderBy: [desc(notification.createdAt)],
        limit: input.limit,
        offset,
      });

      const countResult = await db
        .select({ total: count() })
        .from(notification)
        .where(whereClause);
      const total = countResult[0]?.total ?? 0;

      return {
        notifications,
        pagination: {
          page: input.page,
          limit: input.limit,
          total,
          totalPages: Math.ceil(total / input.limit),
        },
      };
    }),

  /**
   * Get unread count for notification badge
   */
  getUnreadCount: protectedProcedure.handler(async ({ context }) => {
    const userId = context.session.user.id;

    const [result] = await db
      .select({ count: count() })
      .from(notification)
      .where(
        and(
          eq(notification.userId, userId),
          isNull(notification.readAt),
          isNull(notification.dismissedAt)
        )
      );

    return { count: result?.count ?? 0 };
  }),

  /**
   * Get recent notifications (for dropdown)
   */
  getRecent: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(20).default(5) }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      const notifications = await db.query.notification.findMany({
        where: and(
          eq(notification.userId, userId),
          isNull(notification.dismissedAt)
        ),
        orderBy: [desc(notification.createdAt)],
        limit: input.limit,
      });

      const unreadResult = await db
        .select({ unreadCount: count() })
        .from(notification)
        .where(
          and(
            eq(notification.userId, userId),
            isNull(notification.readAt),
            isNull(notification.dismissedAt)
          )
        );

      return {
        notifications,
        unreadCount: unreadResult[0]?.unreadCount ?? 0,
      };
    }),

  /**
   * Mark a notification as read
   */
  markAsRead: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      const existing = await db.query.notification.findFirst({
        where: and(
          eq(notification.id, input.id),
          eq(notification.userId, userId)
        ),
      });

      if (!existing) {
        throw new ORPCError("NOT_FOUND", {
          message: "Notification not found",
        });
      }

      const [updated] = await db
        .update(notification)
        .set({ readAt: new Date() })
        .where(eq(notification.id, input.id))
        .returning();

      return updated;
    }),

  /**
   * Mark all notifications as read
   */
  markAllAsRead: protectedProcedure.handler(async ({ context }) => {
    const userId = context.session.user.id;

    await db
      .update(notification)
      .set({ readAt: new Date() })
      .where(and(eq(notification.userId, userId), isNull(notification.readAt)));

    return { success: true };
  }),

  /**
   * Dismiss a notification (hide it)
   */
  dismiss: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      const existing = await db.query.notification.findFirst({
        where: and(
          eq(notification.id, input.id),
          eq(notification.userId, userId)
        ),
      });

      if (!existing) {
        throw new ORPCError("NOT_FOUND", {
          message: "Notification not found",
        });
      }

      await db
        .update(notification)
        .set({ dismissedAt: new Date() })
        .where(eq(notification.id, input.id));

      return { success: true };
    }),

  /**
   * Dismiss all notifications
   */
  dismissAll: protectedProcedure.handler(async ({ context }) => {
    const userId = context.session.user.id;

    await db
      .update(notification)
      .set({ dismissedAt: new Date() })
      .where(
        and(eq(notification.userId, userId), isNull(notification.dismissedAt))
      );

    return { success: true };
  }),

  /**
   * Get notification preferences
   */
  getPreferences: protectedProcedure.handler(async ({ context }) => {
    const userId = context.session.user.id;

    let prefs = await db.query.notificationPreference.findFirst({
      where: eq(notificationPreference.userId, userId),
    });

    // If no preferences exist, create default ones
    if (!prefs) {
      const [created] = await db
        .insert(notificationPreference)
        .values({ userId })
        .returning();
      prefs = created;
    }

    return prefs;
  }),

  /**
   * Update notification preferences
   */
  updatePreferences: protectedProcedure
    .input(updatePreferencesSchema)
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      // Check if preferences exist
      const existing = await db.query.notificationPreference.findFirst({
        where: eq(notificationPreference.userId, userId),
      });

      if (!existing) {
        // Create with provided values
        const [created] = await db
          .insert(notificationPreference)
          .values({ userId, ...input })
          .returning();
        return created;
      }

      // Update existing preferences
      const [updated] = await db
        .update(notificationPreference)
        .set(input)
        .where(eq(notificationPreference.userId, userId))
        .returning();

      return updated;
    }),

  /**
   * Create a notification (for internal use by other routers)
   * Only staff can create notifications for other users
   */
  create: staffProcedure
    .input(createNotificationSchema)
    .handler(async ({ input }) => {
      await createNotification(input);
      return { success: true };
    }),

  /**
   * Delete old notifications (cleanup job)
   * Admin only - deletes notifications older than 90 days
   */
  cleanup: staffProcedure
    .input(z.object({ olderThanDays: z.number().min(30).default(90) }))
    .handler(async ({ input }) => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - input.olderThanDays);

      const result = await db
        .delete(notification)
        .where(sql`${notification.createdAt} < ${cutoffDate}`)
        .returning({ id: notification.id });

      return { deletedCount: result.length };
    }),
};
