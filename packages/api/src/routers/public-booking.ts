/**
 * Public Booking API
 *
 * Unauthenticated endpoints for public appointment booking.
 * Allows visitors to book appointments without creating an account.
 */

import {
  appointment,
  appointmentReminder,
  appointmentType,
  db,
  staffAvailability,
  staffAvailabilityOverride,
} from "@SYNERGY-GY/db";
import { ORPCError } from "@orpc/server";
import { and, count, eq, gte, lte, ne, or, sql } from "drizzle-orm";
import { z } from "zod";
import { publicProcedure } from "../index";
import { sendBookingConfirmation } from "../utils/email";

// Enum values matching schema
const locationTypeValues = ["IN_PERSON", "PHONE", "VIDEO"] as const;

// Generate a secure random token
function generateBookingToken(): string {
  const chars = "abcdefghijkmnpqrstuvwxyz23456789"; // Removed similar chars like l, 1, o, 0
  let token = "";
  for (let i = 0; i < 12; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Calculate end time from start time and duration
function calculateEndTime(scheduledAt: string, durationMinutes: number): Date {
  const start = new Date(scheduledAt);
  return new Date(start.getTime() + durationMinutes * 60 * 1000);
}

// Check for conflicting appointments
async function checkForConflicts(
  scheduledAt: string,
  endAt: Date,
  staffId?: string,
  excludeAppointmentId?: string
): Promise<boolean> {
  const conditions = [
    or(
      eq(appointment.status, "REQUESTED"),
      eq(appointment.status, "CONFIRMED")
    ),
    and(
      lte(appointment.scheduledAt, endAt),
      gte(appointment.endAt, new Date(scheduledAt))
    ),
  ];

  if (staffId) {
    conditions.push(eq(appointment.assignedStaffId, staffId));
  }

  if (excludeAppointmentId) {
    conditions.push(ne(appointment.id, excludeAppointmentId));
  }

  const conflicts = await db
    .select({ count: count() })
    .from(appointment)
    .where(and(...conditions));

  return (conflicts[0]?.count ?? 0) > 0;
}

// Check if a time slot overlaps with existing appointments
type AppointmentData = { scheduledAt: Date; endAt: Date };

function isSlotBooked(
  slotStart: Date,
  slotEnd: Date,
  appointments: AppointmentData[]
): boolean {
  return appointments.some((appt) => {
    const apptStart = new Date(appt.scheduledAt);
    const apptEnd = new Date(appt.endAt);
    const startsInSlot = slotStart >= apptStart && slotStart < apptEnd;
    const endsInSlot = slotEnd > apptStart && slotEnd <= apptEnd;
    const coversSlot = slotStart <= apptStart && slotEnd >= apptEnd;
    return startsInSlot || endsInSlot || coversSlot;
  });
}

// Generate slots for a single schedule block
function generateSlotsForBlock(
  block: { startTime: string; endTime: string },
  dateStr: string,
  duration: number,
  existingAppointments: AppointmentData[]
): { time: string; available: boolean }[] {
  const slots: { time: string; available: boolean }[] = [];
  const [startHour, startMin] = block.startTime.split(":").map(Number);
  const [endHour, endMin] = block.endTime.split(":").map(Number);
  const endTimeMinutes = (endHour ?? 17) * 60 + (endMin ?? 0);

  let currentHour = startHour ?? 9;
  let currentMin = startMin ?? 0;

  while (
    currentHour < (endHour ?? 17) ||
    (currentHour === (endHour ?? 17) && currentMin < (endMin ?? 0))
  ) {
    const slotTime = `${String(currentHour).padStart(2, "0")}:${String(currentMin).padStart(2, "0")}`;
    const slotDateTime = new Date(`${dateStr}T${slotTime}:00`);
    const slotEndTime = new Date(slotDateTime.getTime() + duration * 60 * 1000);
    const slotEndMinutes =
      slotEndTime.getHours() * 60 + slotEndTime.getMinutes();

    if (slotEndMinutes <= endTimeMinutes) {
      slots.push({
        time: slotTime,
        available: !isSlotBooked(
          slotDateTime,
          slotEndTime,
          existingAppointments
        ),
      });
    }

    currentMin += duration;
    while (currentMin >= 60) {
      currentMin -= 60;
      currentHour += 1;
    }
  }

  return slots;
}

// Generate time slots for a date based on availability and existing appointments
async function generateAvailableSlots(
  date: Date,
  appointmentTypeData: typeof appointmentType.$inferSelect,
  assignedStaffId?: string
): Promise<{ time: string; available: boolean }[]> {
  const dayOfWeek = date.getDay();
  const dateStr = date.toISOString().split("T")[0];
  const duration = appointmentTypeData.defaultDurationMinutes;

  // Get staff availability for this day
  const availabilities = await db
    .select()
    .from(staffAvailability)
    .where(
      and(
        eq(staffAvailability.dayOfWeek, dayOfWeek),
        eq(staffAvailability.isAvailable, true),
        assignedStaffId
          ? eq(staffAvailability.staffId, assignedStaffId)
          : sql`1=1`
      )
    );

  // Get overrides for this specific date
  const overrides = await db
    .select()
    .from(staffAvailabilityOverride)
    .where(
      and(
        gte(staffAvailabilityOverride.date, new Date(dateStr)),
        lte(staffAvailabilityOverride.date, new Date(`${dateStr}T23:59:59`)),
        assignedStaffId
          ? eq(staffAvailabilityOverride.staffId, assignedStaffId)
          : sql`1=1`
      )
    );

  // If there's an unavailability override, return empty
  if (overrides.some((o) => !o.isAvailable)) {
    return [];
  }

  // Get existing appointments for this date
  const existingAppointments = await db
    .select()
    .from(appointment)
    .where(
      and(
        gte(appointment.scheduledAt, new Date(dateStr)),
        lte(appointment.scheduledAt, new Date(`${dateStr}T23:59:59`)),
        or(
          eq(appointment.status, "REQUESTED"),
          eq(appointment.status, "CONFIRMED")
        )
      )
    );

  // Determine effective schedule
  const hasAvailableOverride =
    overrides.length > 0 && overrides[0]?.isAvailable;
  const schedule = hasAvailableOverride
    ? overrides.map((o) => ({
        startTime: o.startTime || "09:00:00",
        endTime: o.endTime || "17:00:00",
      }))
    : availabilities.map((a) => ({
        startTime: a.startTime,
        endTime: a.endTime,
      }));

  const effectiveSchedule =
    schedule.length > 0
      ? schedule
      : [{ startTime: "09:00:00", endTime: "17:00:00" }];

  // Generate slots for each schedule block
  const allSlots = effectiveSchedule.flatMap((block) =>
    generateSlotsForBlock(block, dateStr, duration, existingAppointments)
  );

  return allSlots;
}

// Validate booking time is within allowed window
function validateBookingTime(
  scheduledAt: Date,
  minAdvanceNoticeHours: number | null,
  maxAdvanceBookingDays: number | null
): { valid: boolean; error?: string } {
  const now = new Date();
  const minHours = minAdvanceNoticeHours ?? 24;
  const maxDays = maxAdvanceBookingDays ?? 30;
  const minDate = new Date(now.getTime() + minHours * 60 * 60 * 1000);
  const maxDate = new Date(now.getTime() + maxDays * 24 * 60 * 60 * 1000);

  if (scheduledAt < minDate) {
    return {
      valid: false,
      error: `Appointments must be booked at least ${minHours} hours in advance`,
    };
  }
  if (scheduledAt > maxDate) {
    return {
      valid: false,
      error: `Appointments can only be booked up to ${maxDays} days in advance`,
    };
  }
  return { valid: true };
}

// Create appointment reminders
async function createAppointmentReminders(
  appointmentId: string,
  scheduledAt: Date
): Promise<void> {
  const now = new Date();
  const reminderTimes = [1440, 60]; // 24 hours, 1 hour in minutes

  for (const minutesBefore of reminderTimes) {
    const reminderAt = new Date(
      scheduledAt.getTime() - minutesBefore * 60 * 1000
    );
    if (reminderAt > now) {
      await db.insert(appointmentReminder).values({
        appointmentId,
        reminderType: "EMAIL",
        reminderMinutesBefore: minutesBefore,
        scheduledAt: reminderAt,
      });
    }
  }
}

// Input schemas
const getBookingPageSchema = z.object({
  token: z.string().min(1, "Booking token is required"),
});

const getAvailableSlotsSchema = z.object({
  token: z.string().min(1, "Booking token is required"),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format"),
});

const createBookingSchema = z.object({
  token: z.string().min(1, "Booking token is required"),
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  scheduledAt: z.string(), // ISO datetime
  locationType: z.enum(locationTypeValues).default("IN_PERSON"),
  notes: z.string().optional(),
});

const getBookingStatusSchema = z.object({
  bookingToken: z.string().min(1, "Booking token is required"),
});

const cancelBookingSchema = z.object({
  bookingToken: z.string().min(1, "Booking token is required"),
  reason: z.string().optional(),
});

// Public Booking Router
export const publicBookingRouter = {
  /**
   * Get booking page details by public token
   * Returns appointment type info for the booking form
   */
  getBookingPage: publicProcedure
    .input(getBookingPageSchema)
    .handler(async ({ input }) => {
      const apptType = await db.query.appointmentType.findFirst({
        where: and(
          eq(appointmentType.publicBookingToken, input.token),
          eq(appointmentType.isPublicBooking, true),
          eq(appointmentType.isActive, true)
        ),
      });

      if (!apptType) {
        throw new ORPCError("NOT_FOUND", {
          message: "Booking page not found or not available",
        });
      }

      // Calculate booking window
      const now = new Date();
      const minDate = new Date(
        now.getTime() + (apptType.minAdvanceNoticeHours ?? 24) * 60 * 60 * 1000
      );
      const maxDate = new Date(
        now.getTime() +
          (apptType.maxAdvanceBookingDays ?? 30) * 24 * 60 * 60 * 1000
      );

      return {
        id: apptType.id,
        name: apptType.name,
        description: apptType.publicBookingDescription || apptType.description,
        instructions: apptType.bookingInstructions,
        durationMinutes: apptType.defaultDurationMinutes,
        business: apptType.business,
        color: apptType.color,
        minDate: minDate.toISOString().split("T")[0],
        maxDate: maxDate.toISOString().split("T")[0],
        requiresApproval: apptType.requiresApproval,
      };
    }),

  /**
   * Get available time slots for a specific date
   */
  getAvailableSlots: publicProcedure
    .input(getAvailableSlotsSchema)
    .handler(async ({ input }) => {
      const apptType = await db.query.appointmentType.findFirst({
        where: and(
          eq(appointmentType.publicBookingToken, input.token),
          eq(appointmentType.isPublicBooking, true),
          eq(appointmentType.isActive, true)
        ),
      });

      if (!apptType) {
        throw new ORPCError("NOT_FOUND", {
          message: "Booking page not found",
        });
      }

      // Validate date is within booking window
      const requestedDate = new Date(input.date);
      const now = new Date();
      const minDate = new Date(
        now.getTime() + (apptType.minAdvanceNoticeHours ?? 24) * 60 * 60 * 1000
      );
      const maxDate = new Date(
        now.getTime() +
          (apptType.maxAdvanceBookingDays ?? 30) * 24 * 60 * 60 * 1000
      );

      if (requestedDate < minDate || requestedDate > maxDate) {
        return { slots: [], message: "Date is outside booking window" };
      }

      // Check daily booking limit
      if (apptType.maxBookingsPerDay) {
        const dateStart = new Date(input.date);
        const dateEnd = new Date(`${input.date}T23:59:59`);

        const dayBookings = await db
          .select({ count: count() })
          .from(appointment)
          .where(
            and(
              eq(appointment.appointmentTypeId, apptType.id),
              gte(appointment.scheduledAt, dateStart),
              lte(appointment.scheduledAt, dateEnd),
              or(
                eq(appointment.status, "REQUESTED"),
                eq(appointment.status, "CONFIRMED")
              )
            )
          );

        if ((dayBookings[0]?.count ?? 0) >= apptType.maxBookingsPerDay) {
          return {
            slots: [],
            message: "No more bookings available for this date",
          };
        }
      }

      const slots = await generateAvailableSlots(requestedDate, apptType);

      return {
        date: input.date,
        durationMinutes: apptType.defaultDurationMinutes,
        slots: slots.filter((s) => s.available),
      };
    }),

  /**
   * Create a new public booking
   */
  createBooking: publicProcedure
    .input(createBookingSchema)
    .handler(async ({ input }) => {
      const apptType = await db.query.appointmentType.findFirst({
        where: and(
          eq(appointmentType.publicBookingToken, input.token),
          eq(appointmentType.isPublicBooking, true),
          eq(appointmentType.isActive, true)
        ),
      });

      if (!apptType) {
        throw new ORPCError("NOT_FOUND", { message: "Booking page not found" });
      }

      // Validate scheduled time using helper
      const scheduledAt = new Date(input.scheduledAt);
      const timeValidation = validateBookingTime(
        scheduledAt,
        apptType.minAdvanceNoticeHours,
        apptType.maxAdvanceBookingDays
      );
      if (!timeValidation.valid) {
        throw new ORPCError("BAD_REQUEST", {
          message: timeValidation.error ?? "Invalid time",
        });
      }

      const duration = apptType.defaultDurationMinutes;
      const endAt = calculateEndTime(input.scheduledAt, duration);

      // Check for conflicts
      const hasConflict = await checkForConflicts(input.scheduledAt, endAt);
      if (hasConflict) {
        throw new ORPCError("CONFLICT", {
          message: "This time slot is no longer available",
        });
      }

      // Generate booking management token and determine status
      const bookingToken = generateBookingToken();
      const status = apptType.requiresApproval ? "REQUESTED" : "CONFIRMED";

      // Create the appointment
      const [newAppointment] = await db
        .insert(appointment)
        .values({
          appointmentTypeId: apptType.id,
          business: apptType.business || "GCMC",
          title: `${apptType.name} - ${input.name}`,
          description: input.notes,
          scheduledAt,
          endAt,
          durationMinutes: duration,
          locationType: input.locationType,
          status,
          isPublicBooking: true,
          publicBookerName: input.name,
          publicBookerEmail: input.email,
          publicBookerPhone: input.phone,
          publicBookingToken: bookingToken,
        })
        .returning();

      if (!newAppointment) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to create appointment",
        });
      }

      // Create reminders using helper
      await createAppointmentReminders(newAppointment.id, scheduledAt);

      // Send confirmation email
      try {
        await sendBookingConfirmation({
          recipientEmail: input.email,
          recipientName: input.name,
          appointmentType: apptType.name,
          scheduledAt,
          durationMinutes: duration,
          locationType: input.locationType,
          status,
          bookingToken,
          business: apptType.business || "GCMC",
        });
      } catch (error) {
        console.error(
          "[PublicBooking] Failed to send confirmation email:",
          error
        );
        // Don't fail the booking if email fails
      }

      return {
        success: true,
        appointmentId: newAppointment.id,
        bookingToken,
        status,
        message:
          status === "REQUESTED"
            ? "Your booking request has been submitted and is pending approval"
            : "Your appointment has been confirmed",
        scheduledAt: newAppointment.scheduledAt.toISOString(),
        durationMinutes: duration,
      };
    }),

  /**
   * Get booking status by management token
   */
  getBookingStatus: publicProcedure
    .input(getBookingStatusSchema)
    .handler(async ({ input }) => {
      const appt = await db.query.appointment.findFirst({
        where: eq(appointment.publicBookingToken, input.bookingToken),
        with: {
          appointmentType: true,
        },
      });

      if (!appt) {
        throw new ORPCError("NOT_FOUND", {
          message: "Booking not found",
        });
      }

      return {
        id: appt.id,
        status: appt.status,
        appointmentType: appt.appointmentType?.name,
        scheduledAt: appt.scheduledAt.toISOString(),
        durationMinutes: appt.durationMinutes,
        locationType: appt.locationType,
        location: appt.location,
        name: appt.publicBookerName,
        email: appt.publicBookerEmail,
        canCancel: ["REQUESTED", "CONFIRMED"].includes(appt.status),
      };
    }),

  /**
   * Cancel a public booking
   */
  cancelBooking: publicProcedure
    .input(cancelBookingSchema)
    .handler(async ({ input }) => {
      const appt = await db.query.appointment.findFirst({
        where: eq(appointment.publicBookingToken, input.bookingToken),
      });

      if (!appt) {
        throw new ORPCError("NOT_FOUND", {
          message: "Booking not found",
        });
      }

      if (!["REQUESTED", "CONFIRMED"].includes(appt.status)) {
        throw new ORPCError("BAD_REQUEST", {
          message: "This booking cannot be cancelled",
        });
      }

      // Update appointment status
      await db
        .update(appointment)
        .set({
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancellationReason: input.reason || "Cancelled by booker",
        })
        .where(eq(appointment.id, appt.id));

      return {
        success: true,
        message: "Your booking has been cancelled",
      };
    }),
};
