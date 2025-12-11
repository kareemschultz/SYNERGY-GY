/**
 * Training Management Schema
 *
 * Manages training courses, schedules, and enrollments for GCMC business.
 * Supports course catalog, scheduling, participant tracking, and certificate issuance.
 */

import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { client } from "./clients";

/**
 * Training course categories
 */
export const trainingCategoryEnum = pgEnum("training_category", [
  "HUMAN_RESOURCES",
  "CUSTOMER_RELATIONS",
  "BUSINESS_DEVELOPMENT",
  "COMPLIANCE",
  "OTHER",
]);

/**
 * Schedule status
 */
export const scheduleStatusEnum = pgEnum("schedule_status", [
  "SCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
]);

/**
 * Enrollment status
 */
export const enrollmentStatusEnum = pgEnum("enrollment_status", [
  "REGISTERED",
  "CONFIRMED",
  "ATTENDED",
  "CANCELLED",
  "NO_SHOW",
]);

/**
 * Payment status for enrollments
 */
export const enrollmentPaymentStatusEnum = pgEnum("enrollment_payment_status", [
  "PENDING",
  "PARTIAL",
  "PAID",
  "REFUNDED",
]);

/**
 * Training Courses
 *
 * Catalog of training courses offered by GCMC.
 * Includes course details, pricing, and capacity limits.
 */
export const courses = pgTable("courses", {
  id: text("id").primaryKey(),

  // Business context (always GCMC for training)
  business: varchar("business", { length: 10 }).notNull().default("GCMC"),

  // Course details
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: trainingCategoryEnum("category").notNull(),

  // Duration and capacity
  duration: integer("duration").notNull(), // Duration in hours
  maxParticipants: integer("max_participants").notNull().default(20),

  // Pricing
  price: integer("price").notNull(), // Price in cents (GYD)

  // Status
  isActive: boolean("is_active").notNull().default(true),

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Course Schedules
 *
 * Specific scheduled sessions for training courses.
 * Tracks dates, location, instructor, and current status.
 */
export const courseSchedules = pgTable("course_schedules", {
  id: text("id").primaryKey(),

  // Course reference
  courseId: text("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),

  // Schedule details
  startDate: timestamp("start_date", { withTimezone: true }).notNull(),
  endDate: timestamp("end_date", { withTimezone: true }).notNull(),
  location: varchar("location", { length: 255 }).notNull(),
  instructor: varchar("instructor", { length: 255 }).notNull(),

  // Status
  status: scheduleStatusEnum("status").notNull().default("SCHEDULED"),

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Course Enrollments
 *
 * Tracks client enrollment in scheduled training courses.
 * Manages attendance, payment status, and certificate issuance.
 */
export const enrollments = pgTable("enrollments", {
  id: text("id").primaryKey(),

  // References
  scheduleId: text("schedule_id")
    .notNull()
    .references(() => courseSchedules.id, { onDelete: "cascade" }),
  clientId: text("client_id")
    .notNull()
    .references(() => client.id, { onDelete: "cascade" }),

  // Enrollment status
  status: enrollmentStatusEnum("status").notNull().default("REGISTERED"),
  paymentStatus: enrollmentPaymentStatusEnum("payment_status")
    .notNull()
    .default("PENDING"),

  // Certificate tracking
  certificateNumber: varchar("certificate_number", { length: 50 }),
  certificateIssuedAt: timestamp("certificate_issued_at", {
    withTimezone: true,
  }),

  // Timestamps
  enrolledAt: timestamp("enrolled_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Relations
export const coursesRelations = relations(courses, ({ many }) => ({
  schedules: many(courseSchedules),
}));

export const courseSchedulesRelations = relations(
  courseSchedules,
  ({ one, many }) => ({
    course: one(courses, {
      fields: [courseSchedules.courseId],
      references: [courses.id],
    }),
    enrollments: many(enrollments),
  })
);

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  schedule: one(courseSchedules, {
    fields: [enrollments.scheduleId],
    references: [courseSchedules.id],
  }),
  client: one(client, {
    fields: [enrollments.clientId],
    references: [client.id],
  }),
}));

// Zod Schemas for validation
export const insertCourseSchema = createInsertSchema(courses, {
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().optional(),
  category: z.enum([
    "HUMAN_RESOURCES",
    "CUSTOMER_RELATIONS",
    "BUSINESS_DEVELOPMENT",
    "COMPLIANCE",
    "OTHER",
  ]),
  duration: z.number().int().positive("Duration must be positive"),
  maxParticipants: z
    .number()
    .int()
    .positive("Max participants must be positive")
    .default(20),
  price: z.number().int().nonnegative("Price must be non-negative"),
  isActive: z.boolean().default(true),
  business: z.literal("GCMC").default("GCMC"),
});

export const selectCourseSchema = createSelectSchema(courses);

export const updateCourseSchema = insertCourseSchema
  .partial()
  .required({ id: true });

export const insertCourseScheduleSchema = createInsertSchema(courseSchedules, {
  courseId: z.string().min(1, "Course ID is required"),
  startDate: z.date(),
  endDate: z.date(),
  location: z.string().min(1, "Location is required").max(255),
  instructor: z.string().min(1, "Instructor is required").max(255),
  status: z
    .enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"])
    .default("SCHEDULED"),
}).refine((data) => data.endDate > data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"],
});

export const selectCourseScheduleSchema = createSelectSchema(courseSchedules);

export const updateCourseScheduleSchema = insertCourseScheduleSchema
  .partial()
  .required({ id: true });

export const insertEnrollmentSchema = createInsertSchema(enrollments, {
  scheduleId: z.string().min(1, "Schedule ID is required"),
  clientId: z.string().min(1, "Client ID is required"),
  status: z
    .enum(["REGISTERED", "CONFIRMED", "ATTENDED", "CANCELLED", "NO_SHOW"])
    .default("REGISTERED"),
  paymentStatus: z
    .enum(["PENDING", "PARTIAL", "PAID", "REFUNDED"])
    .default("PENDING"),
  certificateNumber: z.string().max(50).optional(),
  certificateIssuedAt: z.date().optional(),
});

export const selectEnrollmentSchema = createSelectSchema(enrollments);

export const updateEnrollmentSchema = insertEnrollmentSchema
  .partial()
  .required({ id: true });

// Type exports
export type Course = typeof courses.$inferSelect;
export type NewCourse = typeof courses.$inferInsert;
export type CourseSchedule = typeof courseSchedules.$inferSelect;
export type NewCourseSchedule = typeof courseSchedules.$inferInsert;
export type Enrollment = typeof enrollments.$inferSelect;
export type NewEnrollment = typeof enrollments.$inferInsert;
