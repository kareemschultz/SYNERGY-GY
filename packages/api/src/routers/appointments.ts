import {
  appointment,
  appointmentType,
  client,
  db,
  matter,
  staffAvailability,
  staffAvailabilityOverride,
} from "@SYNERGY-GY/db";
import { ORPCError } from "@orpc/server";
import type { SQL } from "drizzle-orm";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  lte,
  or,
  sql,
} from "drizzle-orm";
import { z } from "zod";
import {
  adminProcedure,
  canAccessBusiness,
  getAccessibleBusinesses,
  staffProcedure,
} from "../index";

// Enum values
const appointmentStatusValues = [
  "REQUESTED",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
  "RESCHEDULED",
] as const;

const locationTypeValues = ["IN_PERSON", "PHONE", "VIDEO"] as const;

const businessValues = ["GCMC", "KAJ"] as const;

// Input schemas
const listAppointmentsSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.enum(appointmentStatusValues).optional(),
  business: z.enum(businessValues).optional(),
  clientId: z.string().optional(),
  staffId: z.string().optional(),
  appointmentTypeId: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  sortBy: z.enum(["scheduledAt", "createdAt", "status"]).default("scheduledAt"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

const createAppointmentSchema = z.object({
  appointmentTypeId: z.string().min(1, "Appointment type is required"),
  clientId: z.string().min(1, "Client is required"),
  matterId: z.string().optional(),
  business: z.enum(businessValues),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  scheduledAt: z.string(), // ISO datetime
  durationMinutes: z.number().min(15).default(30),
  locationType: z.enum(locationTypeValues).default("IN_PERSON"),
  location: z.string().optional(),
  assignedStaffId: z.string().optional(),
  preAppointmentNotes: z.string().optional(),
  clientNotes: z.string().optional(),
});

const updateAppointmentSchema = z.object({
  id: z.string(),
  appointmentTypeId: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  scheduledAt: z.string().optional(),
  durationMinutes: z.number().min(15).optional(),
  locationType: z.enum(locationTypeValues).optional(),
  location: z.string().optional(),
  assignedStaffId: z.string().nullable().optional(),
  preAppointmentNotes: z.string().optional(),
  postAppointmentNotes: z.string().optional(),
  clientNotes: z.string().optional(),
});

const confirmAppointmentSchema = z.object({
  id: z.string(),
  assignedStaffId: z.string().optional(),
  preAppointmentNotes: z.string().optional(),
});

const cancelAppointmentSchema = z.object({
  id: z.string(),
  cancellationReason: z.string().optional(),
});

const rescheduleAppointmentSchema = z.object({
  id: z.string(),
  newScheduledAt: z.string(),
  newDurationMinutes: z.number().min(15).optional(),
  reason: z.string().optional(),
});

const createAppointmentTypeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  defaultDurationMinutes: z.number().min(15).default(30),
  business: z.enum(businessValues).optional(),
  color: z.string().default("#3B82F6"),
  requiresApproval: z.boolean().default(true),
  sortOrder: z.number().default(0),
});

const updateAppointmentTypeSchema = createAppointmentTypeSchema
  .partial()
  .extend({
    id: z.string(),
    isActive: z.boolean().optional(),
  });

const staffAvailabilitySchema = z.object({
  staffId: z.string(),
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string(), // HH:mm format
  endTime: z.string(),
  isAvailable: z.boolean().default(true),
  business: z.enum(businessValues).optional(),
});

const staffAvailabilityOverrideSchema = z.object({
  staffId: z.string(),
  date: z.string(), // ISO date
  isAvailable: z.boolean().default(false),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  reason: z.string().optional(),
});

// Helper functions
function calculateEndTime(scheduledAt: string, durationMinutes: number): Date {
  const start = new Date(scheduledAt);
  return new Date(start.getTime() + durationMinutes * 60 * 1000);
}

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
    // Check for overlapping time ranges
    and(
      lte(appointment.scheduledAt, endAt),
      gte(appointment.endAt, new Date(scheduledAt))
    ),
  ];

  if (staffId) {
    conditions.push(eq(appointment.assignedStaffId, staffId));
  }

  if (excludeAppointmentId) {
    conditions.push(sql`${appointment.id} != ${excludeAppointmentId}`);
  }

  const conflicts = await db
    .select({ count: count() })
    .from(appointment)
    .where(and(...conditions));

  return (conflicts[0]?.count ?? 0) > 0;
}

// Appointments router
export const appointmentsRouter = {
  /**
   * List appointments with pagination and filters
   */
  list: staffProcedure
    .input(listAppointmentsSchema)
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: List handler builds dynamic query with business access checks, search, status, client, date range, and staff filters
    .handler(async ({ input, context }) => {
      const accessibleBusinesses = getAccessibleBusinesses(context.staff);

      if (accessibleBusinesses.length === 0) {
        return {
          appointments: [],
          total: 0,
          page: input.page,
          limit: input.limit,
        };
      }

      const conditions: SQL<unknown>[] = [];

      // Filter by accessible businesses
      if (input.business) {
        if (!accessibleBusinesses.includes(input.business)) {
          throw new ORPCError("FORBIDDEN", {
            message: "You don't have access to this business",
          });
        }
        conditions.push(eq(appointment.business, input.business));
      } else {
        conditions.push(
          sql`${appointment.business}::text = ANY(ARRAY[${sql.join(
            accessibleBusinesses.map((b) => sql`${b}`),
            sql`, `
          )}]::text[])`
        );
      }

      // Search filter (title or client name via join)
      if (input.search) {
        const searchTerm = `%${input.search}%`;
        const searchCondition = or(
          ilike(appointment.title, searchTerm),
          ilike(appointment.description, searchTerm)
        );
        if (searchCondition) {
          conditions.push(searchCondition);
        }
      }

      // Status filter
      if (input.status) {
        conditions.push(eq(appointment.status, input.status));
      }

      // Client filter
      if (input.clientId) {
        conditions.push(eq(appointment.clientId, input.clientId));
      }

      // Staff filter
      if (input.staffId) {
        conditions.push(eq(appointment.assignedStaffId, input.staffId));
      }

      // Appointment type filter
      if (input.appointmentTypeId) {
        conditions.push(
          eq(appointment.appointmentTypeId, input.appointmentTypeId)
        );
      }

      // Date range filters
      if (input.fromDate) {
        conditions.push(gte(appointment.scheduledAt, new Date(input.fromDate)));
      }
      if (input.toDate) {
        conditions.push(lte(appointment.scheduledAt, new Date(input.toDate)));
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count
      const countResult = await db
        .select({ total: count() })
        .from(appointment)
        .where(whereClause);

      const total = countResult[0]?.total ?? 0;

      // Get paginated results
      const offset = (input.page - 1) * input.limit;
      const orderColumn = appointment[input.sortBy];
      const orderDirection = input.sortOrder === "asc" ? asc : desc;

      const appointments = await db.query.appointment.findMany({
        where: whereClause,
        orderBy: [orderDirection(orderColumn)],
        limit: input.limit,
        offset,
        with: {
          appointmentType: true,
          client: {
            columns: { id: true, displayName: true, email: true, phone: true },
          },
          matter: {
            columns: { id: true, title: true, referenceNumber: true },
          },
          assignedStaff: {
            with: {
              user: {
                columns: { id: true, name: true, email: true },
              },
            },
          },
        },
      });

      return {
        appointments,
        total,
        page: input.page,
        limit: input.limit,
        totalPages: Math.ceil(total / input.limit),
      };
    }),

  /**
   * Get single appointment by ID
   */
  getById: staffProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const result = await db.query.appointment.findFirst({
        where: eq(appointment.id, input.id),
        with: {
          appointmentType: true,
          client: true,
          matter: true,
          assignedStaff: {
            with: {
              user: true,
            },
          },
          requestedByStaff: {
            with: {
              user: true,
            },
          },
          confirmedBy: true,
          cancelledBy: true,
          reminders: true,
        },
      });

      if (!result) {
        throw new ORPCError("NOT_FOUND", { message: "Appointment not found" });
      }

      // Check access
      if (!canAccessBusiness(context.staff, result.business)) {
        throw new ORPCError("FORBIDDEN", {
          message: "You don't have access to this appointment",
        });
      }

      return result;
    }),

  /**
   * Create new appointment (staff-initiated)
   */
  create: staffProcedure
    .input(createAppointmentSchema)
    .handler(async ({ input, context }) => {
      // Verify access to business
      if (!canAccessBusiness(context.staff, input.business)) {
        throw new ORPCError("FORBIDDEN", {
          message: `You don't have access to ${input.business}`,
        });
      }

      // Verify client exists
      const clientExists = await db.query.client.findFirst({
        where: eq(client.id, input.clientId),
      });
      if (!clientExists) {
        throw new ORPCError("NOT_FOUND", { message: "Client not found" });
      }

      // Verify appointment type exists
      const typeExists = await db.query.appointmentType.findFirst({
        where: eq(appointmentType.id, input.appointmentTypeId),
      });
      if (!typeExists) {
        throw new ORPCError("NOT_FOUND", {
          message: "Appointment type not found",
        });
      }

      // Verify matter exists if provided
      if (input.matterId) {
        const matterExists = await db.query.matter.findFirst({
          where: eq(matter.id, input.matterId),
        });
        if (!matterExists) {
          throw new ORPCError("NOT_FOUND", { message: "Matter not found" });
        }
      }

      // Calculate end time
      const endAt = calculateEndTime(input.scheduledAt, input.durationMinutes);

      // Check for conflicts if staff is assigned
      if (input.assignedStaffId) {
        const hasConflict = await checkForConflicts(
          input.scheduledAt,
          endAt,
          input.assignedStaffId
        );
        if (hasConflict) {
          throw new ORPCError("CONFLICT", {
            message: "This time slot conflicts with another appointment",
          });
        }
      }

      // Create appointment (staff-created appointments are auto-confirmed)
      const [newAppointment] = await db
        .insert(appointment)
        .values({
          appointmentTypeId: input.appointmentTypeId,
          clientId: input.clientId,
          matterId: input.matterId || null,
          business: input.business,
          title: input.title,
          description: input.description || null,
          scheduledAt: new Date(input.scheduledAt),
          endAt,
          durationMinutes: input.durationMinutes,
          locationType: input.locationType,
          location: input.location || null,
          assignedStaffId: input.assignedStaffId || null,
          status: "CONFIRMED", // Staff-created appointments are auto-confirmed
          requestedByStaffId: context.staff?.id,
          confirmedById: context.session.user.id,
          confirmedAt: new Date(),
          preAppointmentNotes: input.preAppointmentNotes || null,
          clientNotes: input.clientNotes || null,
        })
        .returning();

      return newAppointment;
    }),

  /**
   * Update existing appointment
   */
  update: staffProcedure
    .input(updateAppointmentSchema)
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Appointment update requires multiple validation checks (existence, access, status), schedule conflict detection, and conditional end time recalculation
    .handler(async ({ input, context }) => {
      const { id, ...updates } = input;

      // Fetch existing appointment
      const existing = await db.query.appointment.findFirst({
        where: eq(appointment.id, id),
      });

      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Appointment not found" });
      }

      // Check access
      if (!canAccessBusiness(context.staff, existing.business)) {
        throw new ORPCError("FORBIDDEN", {
          message: "You don't have access to this appointment",
        });
      }

      // Don't allow updates to completed/cancelled appointments
      if (["COMPLETED", "CANCELLED", "NO_SHOW"].includes(existing.status)) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Cannot update a completed or cancelled appointment",
        });
      }

      // Calculate new end time if schedule changed
      let endAt = existing.endAt;
      if (updates.scheduledAt || updates.durationMinutes) {
        const newScheduledAt =
          updates.scheduledAt || existing.scheduledAt.toISOString();
        const newDuration = updates.durationMinutes || existing.durationMinutes;
        endAt = calculateEndTime(newScheduledAt, newDuration);

        // Check for conflicts
        const staffId =
          updates.assignedStaffId !== undefined
            ? updates.assignedStaffId
            : existing.assignedStaffId;

        if (staffId) {
          const hasConflict = await checkForConflicts(
            newScheduledAt,
            endAt,
            staffId,
            id
          );
          if (hasConflict) {
            throw new ORPCError("CONFLICT", {
              message: "This time slot conflicts with another appointment",
            });
          }
        }
      }

      const [updated] = await db
        .update(appointment)
        .set({
          ...updates,
          scheduledAt: updates.scheduledAt
            ? new Date(updates.scheduledAt)
            : undefined,
          endAt:
            updates.scheduledAt || updates.durationMinutes ? endAt : undefined,
          assignedStaffId: updates.assignedStaffId,
        })
        .where(eq(appointment.id, id))
        .returning();

      return updated;
    }),

  /**
   * Confirm a requested appointment
   */
  confirm: staffProcedure
    .input(confirmAppointmentSchema)
    .handler(async ({ input, context }) => {
      const existing = await db.query.appointment.findFirst({
        where: eq(appointment.id, input.id),
      });

      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Appointment not found" });
      }

      // Check access
      if (!canAccessBusiness(context.staff, existing.business)) {
        throw new ORPCError("FORBIDDEN", {
          message: "You don't have access to this appointment",
        });
      }

      if (existing.status !== "REQUESTED") {
        throw new ORPCError("BAD_REQUEST", {
          message: "Only requested appointments can be confirmed",
        });
      }

      // Check for conflicts if assigning staff
      const staffId = input.assignedStaffId || existing.assignedStaffId;
      if (staffId) {
        const hasConflict = await checkForConflicts(
          existing.scheduledAt.toISOString(),
          existing.endAt,
          staffId,
          input.id
        );
        if (hasConflict) {
          throw new ORPCError("CONFLICT", {
            message: "This time slot conflicts with another appointment",
          });
        }
      }

      const [confirmed] = await db
        .update(appointment)
        .set({
          status: "CONFIRMED",
          confirmedById: context.session.user.id,
          confirmedAt: new Date(),
          assignedStaffId: input.assignedStaffId || existing.assignedStaffId,
          preAppointmentNotes:
            input.preAppointmentNotes || existing.preAppointmentNotes,
        })
        .where(eq(appointment.id, input.id))
        .returning();

      return confirmed;
    }),

  /**
   * Mark appointment as completed
   */
  complete: staffProcedure
    .input(
      z.object({
        id: z.string(),
        postAppointmentNotes: z.string().optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const existing = await db.query.appointment.findFirst({
        where: eq(appointment.id, input.id),
      });

      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Appointment not found" });
      }

      // Check access
      if (!canAccessBusiness(context.staff, existing.business)) {
        throw new ORPCError("FORBIDDEN", {
          message: "You don't have access to this appointment",
        });
      }

      if (existing.status !== "CONFIRMED") {
        throw new ORPCError("BAD_REQUEST", {
          message: "Only confirmed appointments can be completed",
        });
      }

      const [completed] = await db
        .update(appointment)
        .set({
          status: "COMPLETED",
          completedAt: new Date(),
          postAppointmentNotes: input.postAppointmentNotes || null,
        })
        .where(eq(appointment.id, input.id))
        .returning();

      return completed;
    }),

  /**
   * Mark as no-show
   */
  markNoShow: staffProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const existing = await db.query.appointment.findFirst({
        where: eq(appointment.id, input.id),
      });

      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Appointment not found" });
      }

      // Check access
      if (!canAccessBusiness(context.staff, existing.business)) {
        throw new ORPCError("FORBIDDEN", {
          message: "You don't have access to this appointment",
        });
      }

      if (existing.status !== "CONFIRMED") {
        throw new ORPCError("BAD_REQUEST", {
          message: "Only confirmed appointments can be marked as no-show",
        });
      }

      const [updated] = await db
        .update(appointment)
        .set({ status: "NO_SHOW" })
        .where(eq(appointment.id, input.id))
        .returning();

      return updated;
    }),

  /**
   * Cancel an appointment
   */
  cancel: staffProcedure
    .input(cancelAppointmentSchema)
    .handler(async ({ input, context }) => {
      const existing = await db.query.appointment.findFirst({
        where: eq(appointment.id, input.id),
      });

      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Appointment not found" });
      }

      // Check access
      if (!canAccessBusiness(context.staff, existing.business)) {
        throw new ORPCError("FORBIDDEN", {
          message: "You don't have access to this appointment",
        });
      }

      if (["COMPLETED", "CANCELLED", "NO_SHOW"].includes(existing.status)) {
        throw new ORPCError("BAD_REQUEST", {
          message: "This appointment cannot be cancelled",
        });
      }

      const [cancelled] = await db
        .update(appointment)
        .set({
          status: "CANCELLED",
          cancelledById: context.session.user.id,
          cancelledAt: new Date(),
          cancellationReason: input.cancellationReason || null,
        })
        .where(eq(appointment.id, input.id))
        .returning();

      return cancelled;
    }),

  /**
   * Reschedule an appointment (creates a new one and marks old as rescheduled)
   */
  reschedule: staffProcedure
    .input(rescheduleAppointmentSchema)
    .handler(async ({ input, context }) => {
      const existing = await db.query.appointment.findFirst({
        where: eq(appointment.id, input.id),
      });

      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Appointment not found" });
      }

      // Check access
      if (!canAccessBusiness(context.staff, existing.business)) {
        throw new ORPCError("FORBIDDEN", {
          message: "You don't have access to this appointment",
        });
      }

      if (!["REQUESTED", "CONFIRMED"].includes(existing.status)) {
        throw new ORPCError("BAD_REQUEST", {
          message:
            "Only requested or confirmed appointments can be rescheduled",
        });
      }

      // Calculate new end time
      const newDuration = input.newDurationMinutes || existing.durationMinutes;
      const newEndAt = calculateEndTime(input.newScheduledAt, newDuration);

      // Check for conflicts
      if (existing.assignedStaffId) {
        const hasConflict = await checkForConflicts(
          input.newScheduledAt,
          newEndAt,
          existing.assignedStaffId,
          input.id
        );
        if (hasConflict) {
          throw new ORPCError("CONFLICT", {
            message: "The new time slot conflicts with another appointment",
          });
        }
      }

      // Update the existing appointment with new time (rather than creating new)
      const [rescheduled] = await db
        .update(appointment)
        .set({
          scheduledAt: new Date(input.newScheduledAt),
          endAt: newEndAt,
          durationMinutes: newDuration,
          postAppointmentNotes: input.reason
            ? `Rescheduled: ${input.reason}`
            : "Rescheduled",
        })
        .where(eq(appointment.id, input.id))
        .returning();

      return rescheduled;
    }),

  /**
   * Get upcoming appointments
   */
  getUpcoming: staffProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
        staffId: z.string().optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const accessibleBusinesses = getAccessibleBusinesses(context.staff);

      const conditions = [
        sql`${appointment.business}::text = ANY(ARRAY[${sql.join(
          accessibleBusinesses.map((b) => sql`${b}`),
          sql`, `
        )}]::text[])`,
        gte(appointment.scheduledAt, new Date()),
        or(
          eq(appointment.status, "REQUESTED"),
          eq(appointment.status, "CONFIRMED")
        ),
      ];

      if (input.staffId) {
        conditions.push(eq(appointment.assignedStaffId, input.staffId));
      }

      const appointments = await db.query.appointment.findMany({
        where: and(...conditions),
        orderBy: [asc(appointment.scheduledAt)],
        limit: input.limit,
        with: {
          appointmentType: true,
          client: {
            columns: { id: true, displayName: true, phone: true },
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

      return appointments;
    }),

  /**
   * Get today's appointments
   */
  getToday: staffProcedure.handler(async ({ context }) => {
    const accessibleBusinesses = getAccessibleBusinesses(context.staff);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const appointments = await db.query.appointment.findMany({
      where: and(
        sql`${appointment.business}::text = ANY(ARRAY[${sql.join(
          accessibleBusinesses.map((b) => sql`${b}`),
          sql`, `
        )}]::text[])`,
        gte(appointment.scheduledAt, today),
        lte(appointment.scheduledAt, tomorrow),
        or(
          eq(appointment.status, "REQUESTED"),
          eq(appointment.status, "CONFIRMED")
        )
      ),
      orderBy: [asc(appointment.scheduledAt)],
      with: {
        appointmentType: true,
        client: {
          columns: { id: true, displayName: true, phone: true },
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

    return appointments;
  }),

  // Appointment Types sub-router (admin only)
  types: {
    list: staffProcedure
      .input(
        z.object({
          includeInactive: z.boolean().default(false),
          business: z.enum(businessValues).optional(),
        })
      )
      .handler(async ({ input }) => {
        const conditions: SQL<unknown>[] = [];

        if (!input.includeInactive) {
          conditions.push(eq(appointmentType.isActive, true));
        }

        if (input.business) {
          const businessCondition = or(
            eq(appointmentType.business, input.business),
            sql`${appointmentType.business} IS NULL`
          );
          if (businessCondition) {
            conditions.push(businessCondition);
          }
        }

        return await db.query.appointmentType.findMany({
          where: conditions.length > 0 ? and(...conditions) : undefined,
          orderBy: [asc(appointmentType.sortOrder), asc(appointmentType.name)],
        });
      }),

    create: adminProcedure
      .input(createAppointmentTypeSchema)
      .handler(async ({ input }) => {
        const [newType] = await db
          .insert(appointmentType)
          .values({
            name: input.name,
            description: input.description || null,
            defaultDurationMinutes: input.defaultDurationMinutes,
            business: input.business || null,
            color: input.color,
            requiresApproval: input.requiresApproval,
            sortOrder: input.sortOrder,
          })
          .returning();

        return newType;
      }),

    update: adminProcedure
      .input(updateAppointmentTypeSchema)
      .handler(async ({ input }) => {
        const { id, ...updates } = input;

        const [updated] = await db
          .update(appointmentType)
          .set({
            ...updates,
            business: updates.business ?? null,
          })
          .where(eq(appointmentType.id, id))
          .returning();

        return updated;
      }),

    delete: adminProcedure
      .input(z.object({ id: z.string() }))
      .handler(async ({ input }) => {
        // Check if any appointments use this type
        const usageCount = await db
          .select({ count: count() })
          .from(appointment)
          .where(eq(appointment.appointmentTypeId, input.id));

        if ((usageCount[0]?.count ?? 0) > 0) {
          throw new ORPCError("BAD_REQUEST", {
            message:
              "Cannot delete appointment type that has appointments. Deactivate it instead.",
          });
        }

        await db
          .delete(appointmentType)
          .where(eq(appointmentType.id, input.id));
        return { success: true };
      }),
  },

  // Staff availability sub-router
  availability: {
    getForStaff: staffProcedure
      .input(z.object({ staffId: z.string() }))
      .handler(async ({ input }) => {
        const availability = await db.query.staffAvailability.findMany({
          where: eq(staffAvailability.staffId, input.staffId),
          orderBy: [asc(staffAvailability.dayOfWeek)],
        });

        return availability;
      }),

    setWeeklySchedule: staffProcedure
      .input(
        z.object({
          staffId: z.string(),
          schedule: z.array(staffAvailabilitySchema.omit({ staffId: true })),
        })
      )
      .handler(async ({ input }) => {
        // Delete existing schedule
        await db
          .delete(staffAvailability)
          .where(eq(staffAvailability.staffId, input.staffId));

        // Insert new schedule
        if (input.schedule.length > 0) {
          await db.insert(staffAvailability).values(
            input.schedule.map((slot) => ({
              staffId: input.staffId,
              dayOfWeek: slot.dayOfWeek,
              startTime: slot.startTime,
              endTime: slot.endTime,
              isAvailable: slot.isAvailable,
              business: slot.business || null,
            }))
          );
        }

        return { success: true };
      }),

    getOverrides: staffProcedure
      .input(
        z.object({
          staffId: z.string(),
          fromDate: z.string(),
          toDate: z.string(),
        })
      )
      .handler(async ({ input }) => {
        const overrides = await db.query.staffAvailabilityOverride.findMany({
          where: and(
            eq(staffAvailabilityOverride.staffId, input.staffId),
            gte(staffAvailabilityOverride.date, new Date(input.fromDate)),
            lte(staffAvailabilityOverride.date, new Date(input.toDate))
          ),
          orderBy: [asc(staffAvailabilityOverride.date)],
        });

        return overrides;
      }),

    createOverride: staffProcedure
      .input(staffAvailabilityOverrideSchema)
      .handler(async ({ input }) => {
        // Check if override already exists for this date
        const existing = await db.query.staffAvailabilityOverride.findFirst({
          where: and(
            eq(staffAvailabilityOverride.staffId, input.staffId),
            eq(staffAvailabilityOverride.date, new Date(input.date))
          ),
        });

        if (existing) {
          // Update existing
          const [updated] = await db
            .update(staffAvailabilityOverride)
            .set({
              isAvailable: input.isAvailable,
              startTime: input.startTime || null,
              endTime: input.endTime || null,
              reason: input.reason || null,
            })
            .where(eq(staffAvailabilityOverride.id, existing.id))
            .returning();

          return updated;
        }

        // Create new
        const [newOverride] = await db
          .insert(staffAvailabilityOverride)
          .values({
            staffId: input.staffId,
            date: new Date(input.date),
            isAvailable: input.isAvailable,
            startTime: input.startTime || null,
            endTime: input.endTime || null,
            reason: input.reason || null,
          })
          .returning();

        return newOverride;
      }),

    deleteOverride: staffProcedure
      .input(z.object({ id: z.string() }))
      .handler(async ({ input }) => {
        await db
          .delete(staffAvailabilityOverride)
          .where(eq(staffAvailabilityOverride.id, input.id));
        return { success: true };
      }),
  },
};
