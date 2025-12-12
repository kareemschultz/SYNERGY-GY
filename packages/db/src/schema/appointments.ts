import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  time,
  timestamp,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { client } from "./clients";
import { businessEnum, staff } from "./core";
import { matter } from "./services";

/**
 * Appointment location type enum
 */
export const appointmentLocationTypeEnum = pgEnum("appointment_location_type", [
  "IN_PERSON",
  "PHONE",
  "VIDEO",
]);

/**
 * Appointment status enum
 * REQUESTED - Client requested via portal (awaiting staff approval)
 * CONFIRMED - Staff approved/created appointment
 * COMPLETED - Appointment finished
 * CANCELLED - Cancelled by staff or client
 * NO_SHOW - Client didn't attend
 * RESCHEDULED - Appointment was rescheduled (new appointment created)
 */
export const appointmentStatusEnum = pgEnum("appointment_status", [
  "REQUESTED",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
  "RESCHEDULED",
]);

/**
 * Appointment reminder type enum
 */
export const appointmentReminderTypeEnum = pgEnum("appointment_reminder_type", [
  "EMAIL",
  "SMS",
  "IN_APP",
]);

/**
 * Appointment type table
 * Defines different types of appointments (consultation, document pickup, etc.)
 */
export const appointmentType = pgTable(
  "appointment_type",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    description: text("description"),
    defaultDurationMinutes: integer("default_duration_minutes")
      .default(30)
      .notNull(),
    business: businessEnum("business"), // null = both businesses
    color: text("color").default("#3B82F6"), // Calendar color
    requiresApproval: boolean("requires_approval").default(true).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("appointment_type_business_idx").on(table.business),
    index("appointment_type_is_active_idx").on(table.isActive),
  ]
);

/**
 * Staff availability table
 * Weekly recurring availability schedule
 */
export const staffAvailability = pgTable(
  "staff_availability",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    staffId: text("staff_id")
      .notNull()
      .references(() => staff.id, { onDelete: "cascade" }),
    dayOfWeek: integer("day_of_week").notNull(), // 0 = Sunday, 6 = Saturday
    startTime: time("start_time").notNull(),
    endTime: time("end_time").notNull(),
    isAvailable: boolean("is_available").default(true).notNull(),
    business: businessEnum("business"), // null = both businesses
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("staff_availability_staff_id_idx").on(table.staffId),
    index("staff_availability_day_of_week_idx").on(table.dayOfWeek),
  ]
);

/**
 * Staff availability override table
 * Date-specific overrides (vacations, holidays, special hours)
 */
export const staffAvailabilityOverride = pgTable(
  "staff_availability_override",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    staffId: text("staff_id")
      .notNull()
      .references(() => staff.id, { onDelete: "cascade" }),
    date: timestamp("date").notNull(),
    isAvailable: boolean("is_available").default(false).notNull(),
    startTime: time("start_time"), // If available, custom hours
    endTime: time("end_time"),
    reason: text("reason"), // e.g., "Vacation", "Public Holiday"
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("staff_availability_override_staff_id_idx").on(table.staffId),
    index("staff_availability_override_date_idx").on(table.date),
  ]
);

/**
 * Main appointment table
 */
export const appointment = pgTable(
  "appointment",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    // References
    appointmentTypeId: text("appointment_type_id")
      .notNull()
      .references(() => appointmentType.id, { onDelete: "restrict" }),
    clientId: text("client_id")
      .notNull()
      .references(() => client.id, { onDelete: "restrict" }),
    matterId: text("matter_id").references(() => matter.id, {
      onDelete: "set null",
    }),
    business: businessEnum("business").notNull(),

    // Scheduling
    title: text("title").notNull(),
    description: text("description"),
    scheduledAt: timestamp("scheduled_at").notNull(), // Start date/time
    endAt: timestamp("end_at").notNull(), // End date/time
    durationMinutes: integer("duration_minutes").notNull(),

    // Location
    locationType: appointmentLocationTypeEnum("location_type")
      .default("IN_PERSON")
      .notNull(),
    location: text("location"), // Physical address OR video call link

    // Assignment
    assignedStaffId: text("assigned_staff_id").references(() => staff.id, {
      onDelete: "set null",
    }),

    // Status tracking
    status: appointmentStatusEnum("status").default("REQUESTED").notNull(),

    // Request tracking (for client-initiated appointments)
    requestedByPortalUserId: text("requested_by_portal_user_id"), // If client booked via portal
    requestedByStaffId: text("requested_by_staff_id").references(
      () => staff.id,
      { onDelete: "set null" }
    ),
    requestedAt: timestamp("requested_at").defaultNow().notNull(),

    // Confirmation tracking
    confirmedById: text("confirmed_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    confirmedAt: timestamp("confirmed_at"),

    // Completion
    completedAt: timestamp("completed_at"),

    // Cancellation
    cancelledById: text("cancelled_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    cancelledAt: timestamp("cancelled_at"),
    cancellationReason: text("cancellation_reason"),

    // Notes
    preAppointmentNotes: text("pre_appointment_notes"), // Staff notes before
    postAppointmentNotes: text("post_appointment_notes"), // Staff notes after
    clientNotes: text("client_notes"), // Notes visible to client in portal

    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("appointment_appointment_type_id_idx").on(table.appointmentTypeId),
    index("appointment_client_id_idx").on(table.clientId),
    index("appointment_matter_id_idx").on(table.matterId),
    index("appointment_business_idx").on(table.business),
    index("appointment_scheduled_at_idx").on(table.scheduledAt),
    index("appointment_assigned_staff_id_idx").on(table.assignedStaffId),
    index("appointment_status_idx").on(table.status),
  ]
);

/**
 * Appointment reminders table
 */
export const appointmentReminder = pgTable(
  "appointment_reminder",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    appointmentId: text("appointment_id")
      .notNull()
      .references(() => appointment.id, { onDelete: "cascade" }),
    reminderType: appointmentReminderTypeEnum("reminder_type")
      .default("EMAIL")
      .notNull(),
    reminderMinutesBefore: integer("reminder_minutes_before").notNull(), // e.g., 1440 = 1 day, 60 = 1 hour
    scheduledAt: timestamp("scheduled_at").notNull(),
    isSent: boolean("is_sent").default(false).notNull(),
    sentAt: timestamp("sent_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("appointment_reminder_appointment_id_idx").on(table.appointmentId),
    index("appointment_reminder_scheduled_at_idx").on(table.scheduledAt),
    index("appointment_reminder_is_sent_idx").on(table.isSent),
  ]
);

// Relations
export const appointmentTypeRelations = relations(
  appointmentType,
  ({ many }) => ({
    appointments: many(appointment),
  })
);

export const staffAvailabilityRelations = relations(
  staffAvailability,
  ({ one }) => ({
    staff: one(staff, {
      fields: [staffAvailability.staffId],
      references: [staff.id],
    }),
  })
);

export const staffAvailabilityOverrideRelations = relations(
  staffAvailabilityOverride,
  ({ one }) => ({
    staff: one(staff, {
      fields: [staffAvailabilityOverride.staffId],
      references: [staff.id],
    }),
  })
);

export const appointmentRelations = relations(appointment, ({ one, many }) => ({
  appointmentType: one(appointmentType, {
    fields: [appointment.appointmentTypeId],
    references: [appointmentType.id],
  }),
  client: one(client, {
    fields: [appointment.clientId],
    references: [client.id],
  }),
  matter: one(matter, {
    fields: [appointment.matterId],
    references: [matter.id],
  }),
  assignedStaff: one(staff, {
    fields: [appointment.assignedStaffId],
    references: [staff.id],
    relationName: "assignedAppointments",
  }),
  requestedByStaff: one(staff, {
    fields: [appointment.requestedByStaffId],
    references: [staff.id],
    relationName: "requestedAppointments",
  }),
  confirmedBy: one(user, {
    fields: [appointment.confirmedById],
    references: [user.id],
    relationName: "confirmedAppointments",
  }),
  cancelledBy: one(user, {
    fields: [appointment.cancelledById],
    references: [user.id],
    relationName: "cancelledAppointments",
  }),
  reminders: many(appointmentReminder),
}));

export const appointmentReminderRelations = relations(
  appointmentReminder,
  ({ one }) => ({
    appointment: one(appointment, {
      fields: [appointmentReminder.appointmentId],
      references: [appointment.id],
    }),
  })
);
