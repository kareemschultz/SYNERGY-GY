/**
 * Appointment Reminder Processor
 *
 * Processes unsent appointment reminders every 5 minutes.
 * Checks appointmentReminder table where isSent = false and scheduledAt <= now().
 * Sends reminders via email and marks them as sent.
 */

import { appointment, appointmentReminder, db } from "@SYNERGY-GY/db";
import { and, eq, lte } from "drizzle-orm";
import { type AppointmentReminderData, sendAppointmentReminder } from "./email";

const CHECK_INTERVAL_MS = 5 * 60 * 1000; // Check every 5 minutes
const PORTAL_URL = process.env.BETTER_AUTH_URL || "http://localhost:5173";

/**
 * Determine reminder type based on minutes before appointment
 */
function getReminderType(
  minutesBefore: number
): AppointmentReminderData["reminderType"] {
  if (minutesBefore >= 1380) {
    // 23+ hours = 24h reminder
    return "24h";
  }
  if (minutesBefore >= 90) {
    // 1.5+ hours = 2h reminder
    return "2h";
  }
  return "1h";
}

/**
 * Format appointment time for display
 */
function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Format appointment date for display
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Process a single reminder - send email and mark as sent
 */
async function processReminder(
  reminder: {
    id: string;
    appointmentId: string;
    reminderMinutesBefore: number;
    scheduledAt: Date;
  },
  appointmentData: {
    id: string;
    title: string;
    scheduledAt: Date;
    durationMinutes: number;
    locationType: string;
    location: string | null;
    client: {
      id: string;
      displayName: string;
      email: string | null;
    } | null;
    assignedStaff: {
      id: string;
      user: {
        name: string;
      };
    } | null;
  }
): Promise<boolean> {
  // Validate client and email
  if (!appointmentData.client?.email) {
    console.warn(
      `[ReminderProcessor] Skipping reminder ${reminder.id}: Client has no email`
    );
    // Mark as sent to prevent repeated processing
    await db
      .update(appointmentReminder)
      .set({ isSent: true, sentAt: new Date() })
      .where(eq(appointmentReminder.id, reminder.id));
    return false;
  }

  const reminderData: AppointmentReminderData = {
    recipientEmail: appointmentData.client.email,
    recipientName: appointmentData.client.displayName,
    appointmentTitle: appointmentData.title,
    appointmentDate: formatDate(appointmentData.scheduledAt),
    appointmentTime: formatTime(appointmentData.scheduledAt),
    durationMinutes: appointmentData.durationMinutes,
    locationType: appointmentData.locationType,
    location: appointmentData.location ?? undefined,
    assignedStaff: appointmentData.assignedStaff?.user?.name,
    reminderType: getReminderType(reminder.reminderMinutesBefore),
    portalUrl: `${PORTAL_URL}/portal/appointments`,
  };

  try {
    await sendAppointmentReminder(reminderData);

    // Mark as sent
    await db
      .update(appointmentReminder)
      .set({ isSent: true, sentAt: new Date() })
      .where(eq(appointmentReminder.id, reminder.id));

    console.log(
      `[ReminderProcessor] Sent ${reminderData.reminderType} reminder for appointment "${appointmentData.title}" to ${reminderData.recipientEmail}`
    );
    return true;
  } catch (error) {
    console.error(
      `[ReminderProcessor] Failed to send reminder ${reminder.id}:`,
      error
    );
    return false;
  }
}

/**
 * Check for and process unsent reminders
 */
async function checkAndProcessReminders(): Promise<void> {
  const now = new Date();

  // Find unsent reminders that are due
  const dueReminders = await db
    .select({
      id: appointmentReminder.id,
      appointmentId: appointmentReminder.appointmentId,
      reminderMinutesBefore: appointmentReminder.reminderMinutesBefore,
      scheduledAt: appointmentReminder.scheduledAt,
    })
    .from(appointmentReminder)
    .where(
      and(
        eq(appointmentReminder.isSent, false),
        lte(appointmentReminder.scheduledAt, now)
      )
    )
    .limit(50); // Process up to 50 at a time to avoid overwhelming the system

  if (dueReminders.length === 0) {
    return;
  }

  console.log(
    `[ReminderProcessor] Found ${dueReminders.length} due reminder(s)`
  );

  // Fetch appointment details for each reminder
  for (const reminder of dueReminders) {
    const appointmentData = await db.query.appointment.findFirst({
      where: eq(appointment.id, reminder.appointmentId),
      with: {
        client: {
          columns: {
            id: true,
            displayName: true,
            email: true,
          },
        },
        assignedStaff: {
          columns: {
            id: true,
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
    });

    if (!appointmentData) {
      console.warn(
        `[ReminderProcessor] Appointment ${reminder.appointmentId} not found for reminder ${reminder.id}`
      );
      // Mark as sent to prevent repeated processing of orphaned reminders
      await db
        .update(appointmentReminder)
        .set({ isSent: true, sentAt: new Date() })
        .where(eq(appointmentReminder.id, reminder.id));
      continue;
    }

    // Skip cancelled appointments
    if (
      appointmentData.status === "CANCELLED" ||
      appointmentData.status === "RESCHEDULED"
    ) {
      console.log(
        `[ReminderProcessor] Skipping reminder for cancelled/rescheduled appointment ${appointmentData.id}`
      );
      await db
        .update(appointmentReminder)
        .set({ isSent: true, sentAt: new Date() })
        .where(eq(appointmentReminder.id, reminder.id));
      continue;
    }

    await processReminder(reminder, appointmentData);
  }
}

let processorInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Start the reminder processor
 * Runs immediately and then every 5 minutes
 */
export function startReminderProcessor(): void {
  if (processorInterval) {
    console.log("[ReminderProcessor] Processor already running");
    return;
  }

  console.log(
    `[ReminderProcessor] Starting processor (checking every ${CHECK_INTERVAL_MS / 1000}s)`
  );

  // Run immediately on startup
  checkAndProcessReminders().catch((error) => {
    console.error("[ReminderProcessor] Initial check failed:", error);
  });

  // Then run on interval
  processorInterval = setInterval(() => {
    checkAndProcessReminders().catch((error) => {
      console.error("[ReminderProcessor] Scheduled check failed:", error);
    });
  }, CHECK_INTERVAL_MS);
}

/**
 * Stop the reminder processor
 */
export function stopReminderProcessor(): void {
  if (processorInterval) {
    clearInterval(processorInterval);
    processorInterval = null;
    console.log("[ReminderProcessor] Processor stopped");
  }
}

/**
 * Manually trigger a reminder check (useful for testing)
 */
export async function triggerReminderCheck(): Promise<void> {
  await checkAndProcessReminders();
}
