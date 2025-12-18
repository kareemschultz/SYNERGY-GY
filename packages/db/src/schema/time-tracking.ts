import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  decimal,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { businessEnum, staff } from "./core";
import { matter } from "./services";

/**
 * Time Entry table
 * Tracks billable and non-billable time spent on matters
 */
export const timeEntry = pgTable(
  "time_entry",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    // Which matter this time is for
    matterId: text("matter_id")
      .notNull()
      .references(() => matter.id, { onDelete: "cascade" }),

    // Which staff member recorded this time
    staffId: text("staff_id")
      .notNull()
      .references(() => staff.id, { onDelete: "cascade" }),

    // Business entity (derived from matter, but stored for filtering)
    business: businessEnum("business").notNull(),

    // Time details
    description: text("description").notNull(),
    date: date("date").notNull(), // The date the work was performed

    // Duration in minutes (more flexible than hours)
    durationMinutes: integer("duration_minutes").notNull(),

    // Billing information
    isBillable: boolean("is_billable").default(true).notNull(),
    hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }), // Rate in GYD
    totalAmount: decimal("total_amount", { precision: 10, scale: 2 }), // Calculated: (durationMinutes/60) * hourlyRate

    // Timer tracking (for live timer feature)
    timerStartedAt: timestamp("timer_started_at"), // When timer was started
    timerEndedAt: timestamp("timer_ended_at"), // When timer was stopped

    // Invoice reference (if this time entry has been invoiced)
    invoiceId: text("invoice_id"),
    invoicedAt: timestamp("invoiced_at"),

    // Standard timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdById: text("created_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
  },
  (table) => [
    index("time_entry_matter_id_idx").on(table.matterId),
    index("time_entry_staff_id_idx").on(table.staffId),
    index("time_entry_business_idx").on(table.business),
    index("time_entry_date_idx").on(table.date),
    index("time_entry_is_billable_idx").on(table.isBillable),
    index("time_entry_invoice_id_idx").on(table.invoiceId),
    index("time_entry_created_at_idx").on(table.createdAt),
  ]
);

/**
 * Active Timer table
 * Tracks currently running timers (one per staff member)
 */
export const activeTimer = pgTable(
  "active_timer",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    // Staff member running the timer
    staffId: text("staff_id")
      .notNull()
      .unique() // Only one active timer per staff member
      .references(() => staff.id, { onDelete: "cascade" }),

    // Matter being timed
    matterId: text("matter_id")
      .notNull()
      .references(() => matter.id, { onDelete: "cascade" }),

    // Timer info
    description: text("description"),
    startedAt: timestamp("started_at").notNull(),
    isBillable: boolean("is_billable").default(true).notNull(),

    // Created timestamp
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("active_timer_staff_id_idx").on(table.staffId),
    index("active_timer_matter_id_idx").on(table.matterId),
  ]
);

/**
 * Staff Hourly Rate table
 * Stores default hourly rates for staff members (can be overridden per time entry)
 */
export const staffHourlyRate = pgTable(
  "staff_hourly_rate",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    staffId: text("staff_id")
      .notNull()
      .references(() => staff.id, { onDelete: "cascade" }),

    business: businessEnum("business").notNull(),

    // Default hourly rate in GYD
    hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }).notNull(),

    // Effective date range
    effectiveFrom: date("effective_from").notNull(),
    effectiveTo: date("effective_to"), // Null means currently active

    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("staff_hourly_rate_staff_id_idx").on(table.staffId),
    index("staff_hourly_rate_business_idx").on(table.business),
    index("staff_hourly_rate_effective_from_idx").on(table.effectiveFrom),
  ]
);

// Relations
export const timeEntryRelations = relations(timeEntry, ({ one }) => ({
  matter: one(matter, {
    fields: [timeEntry.matterId],
    references: [matter.id],
  }),
  staff: one(staff, {
    fields: [timeEntry.staffId],
    references: [staff.id],
  }),
  createdBy: one(user, {
    fields: [timeEntry.createdById],
    references: [user.id],
  }),
}));

export const activeTimerRelations = relations(activeTimer, ({ one }) => ({
  staff: one(staff, {
    fields: [activeTimer.staffId],
    references: [staff.id],
  }),
  matter: one(matter, {
    fields: [activeTimer.matterId],
    references: [matter.id],
  }),
}));

export const staffHourlyRateRelations = relations(
  staffHourlyRate,
  ({ one }) => ({
    staff: one(staff, {
      fields: [staffHourlyRate.staffId],
      references: [staff.id],
    }),
  })
);
