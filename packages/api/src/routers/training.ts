/**
 * Training Management Router
 *
 * Handles training course catalog, scheduling, and enrollment management
 * for GCMC business. Supports course CRUD, schedule management, and
 * participant tracking with certificate issuance.
 */

import {
  client,
  courseSchedules,
  courses,
  db,
  enrollments,
  insertCourseScheduleSchema,
  insertCourseSchema,
  insertEnrollmentSchema,
} from "@SYNERGY-GY/db";
import { and, count, desc, eq, gte, lte, or, sql } from "drizzle-orm";
import { z } from "zod";
import {
  adminProcedure,
  gcmcProcedure,
  protectedProcedure,
  staffProcedure,
} from "../index";
import { nanoid } from "../lib/nanoid";

/**
 * Generate certificate number in format: GCMC-CERT-YYYY-NNNN
 */
async function generateCertificateNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `GCMC-CERT-${year}`;

  // Get the count of certificates issued this year
  const result = await db
    .select({ count: count() })
    .from(enrollments)
    .where(sql`${enrollments.certificateNumber} LIKE ${`${prefix}-%`}`);

  const nextNumber = (result[0]?.count ?? 0) + 1;
  return `${prefix}-${String(nextNumber).padStart(4, "0")}`;
}

// Training Router (oRPC pattern - plain object with .handler())
export const trainingRouter = {
  // ========== Course Management ==========

  // List all courses with optional filters
  listCourses: gcmcProcedure
    .input(
      z.object({
        category: z
          .enum([
            "HUMAN_RESOURCES",
            "CUSTOMER_RELATIONS",
            "BUSINESS_DEVELOPMENT",
            "COMPLIANCE",
            "OTHER",
          ])
          .optional(),
        isActive: z.boolean().optional(),
        search: z.string().optional(),
      })
    )
    .handler(async ({ input }) => {
      const conditions = [eq(courses.business, "GCMC")];

      if (input.category) {
        conditions.push(eq(courses.category, input.category));
      }

      if (input.isActive !== undefined) {
        conditions.push(eq(courses.isActive, input.isActive));
      }

      if (input.search) {
        const searchCondition = or(
          sql`${courses.title} ILIKE ${`%${input.search}%`}`,
          sql`${courses.description} ILIKE ${`%${input.search}%`}`
        );
        if (searchCondition) {
          conditions.push(searchCondition);
        }
      }

      const result = await db
        .select({
          id: courses.id,
          title: courses.title,
          description: courses.description,
          category: courses.category,
          duration: courses.duration,
          maxParticipants: courses.maxParticipants,
          price: courses.price,
          isActive: courses.isActive,
          createdAt: courses.createdAt,
          updatedAt: courses.updatedAt,
          scheduleCount: count(courseSchedules.id),
        })
        .from(courses)
        .leftJoin(courseSchedules, eq(courses.id, courseSchedules.courseId))
        .where(and(...conditions))
        .groupBy(courses.id)
        .orderBy(desc(courses.createdAt));

      return result;
    }),

  // Get single course with schedules
  getCourse: gcmcProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      const [course] = await db
        .select()
        .from(courses)
        .where(and(eq(courses.id, input.id), eq(courses.business, "GCMC")))
        .limit(1);

      if (!course) {
        throw new Error("Course not found");
      }

      // Get schedules for this course
      const schedules = await db
        .select({
          id: courseSchedules.id,
          startDate: courseSchedules.startDate,
          endDate: courseSchedules.endDate,
          location: courseSchedules.location,
          instructor: courseSchedules.instructor,
          status: courseSchedules.status,
          createdAt: courseSchedules.createdAt,
          enrollmentCount: count(enrollments.id),
        })
        .from(courseSchedules)
        .leftJoin(enrollments, eq(courseSchedules.id, enrollments.scheduleId))
        .where(eq(courseSchedules.courseId, input.id))
        .groupBy(courseSchedules.id)
        .orderBy(desc(courseSchedules.startDate));

      return {
        ...course,
        schedules,
      };
    }),

  // Create new course (admin only)
  createCourse: adminProcedure
    .input(
      insertCourseSchema.omit({ id: true, createdAt: true, updatedAt: true })
    )
    .handler(async ({ input }) => {
      const id = nanoid();

      const [course] = await db
        .insert(courses)
        .values({
          id,
          ...input,
          business: "GCMC",
        })
        .returning();

      return course;
    }),

  // Update course (admin only)
  updateCourse: adminProcedure
    .input(
      z.object({
        id: z.string(),
        data: insertCourseSchema
          .omit({
            id: true,
            createdAt: true,
            updatedAt: true,
            business: true,
          })
          .partial(),
      })
    )
    .handler(async ({ input }) => {
      const [course] = await db
        .update(courses)
        .set({
          ...input.data,
          updatedAt: new Date(),
        })
        .where(and(eq(courses.id, input.id), eq(courses.business, "GCMC")))
        .returning();

      if (!course) {
        throw new Error("Course not found");
      }

      return course;
    }),

  // Delete course (admin only)
  deleteCourse: adminProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      // Check if there are any schedules with enrollments
      const schedulesWithEnrollments = await db
        .select({ count: count() })
        .from(courseSchedules)
        .leftJoin(enrollments, eq(courseSchedules.id, enrollments.scheduleId))
        .where(
          and(
            eq(courseSchedules.courseId, input.id),
            sql`${enrollments.id} IS NOT NULL`
          )
        );

      if ((schedulesWithEnrollments[0]?.count ?? 0) > 0) {
        throw new Error(
          "Cannot delete course with existing enrollments. Consider deactivating instead."
        );
      }

      await db
        .delete(courses)
        .where(and(eq(courses.id, input.id), eq(courses.business, "GCMC")));

      return { success: true };
    }),

  // ========== Schedule Management ==========

  // List schedules for a course
  listSchedules: gcmcProcedure
    .input(
      z.object({
        courseId: z.string().optional(),
        status: z
          .enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"])
          .optional(),
        startDateFrom: z.date().optional(),
        startDateTo: z.date().optional(),
      })
    )
    .handler(async ({ input }) => {
      const conditions: ReturnType<typeof eq>[] = [];

      if (input.courseId) {
        conditions.push(eq(courseSchedules.courseId, input.courseId));
      }

      if (input.status) {
        conditions.push(eq(courseSchedules.status, input.status));
      }

      if (input.startDateFrom) {
        conditions.push(gte(courseSchedules.startDate, input.startDateFrom));
      }

      if (input.startDateTo) {
        conditions.push(lte(courseSchedules.startDate, input.startDateTo));
      }

      const result = await db
        .select({
          id: courseSchedules.id,
          courseId: courseSchedules.courseId,
          courseTitle: courses.title,
          startDate: courseSchedules.startDate,
          endDate: courseSchedules.endDate,
          location: courseSchedules.location,
          instructor: courseSchedules.instructor,
          status: courseSchedules.status,
          maxParticipants: courses.maxParticipants,
          enrollmentCount: count(enrollments.id),
        })
        .from(courseSchedules)
        .innerJoin(
          courses,
          and(
            eq(courseSchedules.courseId, courses.id),
            eq(courses.business, "GCMC")
          )
        )
        .leftJoin(enrollments, eq(courseSchedules.id, enrollments.scheduleId))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .groupBy(courseSchedules.id, courses.id)
        .orderBy(desc(courseSchedules.startDate));

      return result;
    }),

  // Get single schedule with enrollments
  getSchedule: gcmcProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      const [schedule] = await db
        .select({
          id: courseSchedules.id,
          courseId: courseSchedules.courseId,
          courseTitle: courses.title,
          courseDescription: courses.description,
          courseCategory: courses.category,
          courseDuration: courses.duration,
          coursePrice: courses.price,
          maxParticipants: courses.maxParticipants,
          startDate: courseSchedules.startDate,
          endDate: courseSchedules.endDate,
          location: courseSchedules.location,
          instructor: courseSchedules.instructor,
          status: courseSchedules.status,
          createdAt: courseSchedules.createdAt,
        })
        .from(courseSchedules)
        .innerJoin(
          courses,
          and(
            eq(courseSchedules.courseId, courses.id),
            eq(courses.business, "GCMC")
          )
        )
        .where(eq(courseSchedules.id, input.id))
        .limit(1);

      if (!schedule) {
        throw new Error("Schedule not found");
      }

      // Get enrollments for this schedule
      const enrollmentList = await db
        .select({
          id: enrollments.id,
          clientId: enrollments.clientId,
          clientName: client.displayName,
          clientEmail: client.email,
          status: enrollments.status,
          paymentStatus: enrollments.paymentStatus,
          certificateNumber: enrollments.certificateNumber,
          certificateIssuedAt: enrollments.certificateIssuedAt,
          enrolledAt: enrollments.enrolledAt,
        })
        .from(enrollments)
        .innerJoin(client, eq(enrollments.clientId, client.id))
        .where(eq(enrollments.scheduleId, input.id))
        .orderBy(desc(enrollments.enrolledAt));

      return {
        ...schedule,
        enrollments: enrollmentList,
      };
    }),

  // Create schedule (staff only)
  createSchedule: staffProcedure
    .input(
      insertCourseScheduleSchema.omit({
        id: true,
        createdAt: true,
        updatedAt: true,
      })
    )
    .handler(async ({ input }) => {
      // Verify course exists and belongs to GCMC
      const [course] = await db
        .select()
        .from(courses)
        .where(
          and(eq(courses.id, input.courseId), eq(courses.business, "GCMC"))
        )
        .limit(1);

      if (!course) {
        throw new Error("Course not found");
      }

      const id = nanoid();

      const [schedule] = await db
        .insert(courseSchedules)
        .values({
          id,
          ...input,
        })
        .returning();

      return schedule;
    }),

  // Update schedule (staff only)
  updateSchedule: staffProcedure
    .input(
      z.object({
        id: z.string(),
        data: insertCourseScheduleSchema
          .omit({ id: true, createdAt: true, updatedAt: true })
          .partial(),
      })
    )
    .handler(async ({ input }) => {
      const [schedule] = await db
        .update(courseSchedules)
        .set({
          ...input.data,
          updatedAt: new Date(),
        })
        .where(eq(courseSchedules.id, input.id))
        .returning();

      if (!schedule) {
        throw new Error("Schedule not found");
      }

      return schedule;
    }),

  // Cancel schedule (staff only)
  cancelSchedule: staffProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      const [schedule] = await db
        .update(courseSchedules)
        .set({
          status: "CANCELLED",
          updatedAt: new Date(),
        })
        .where(eq(courseSchedules.id, input.id))
        .returning();

      if (!schedule) {
        throw new Error("Schedule not found");
      }

      // Update all enrollments to cancelled
      await db
        .update(enrollments)
        .set({
          status: "CANCELLED",
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(enrollments.scheduleId, input.id),
            sql`${enrollments.status} IN ('REGISTERED', 'CONFIRMED')`
          )
        );

      return schedule;
    }),

  // ========== Enrollment Management ==========

  // List enrollments
  listEnrollments: gcmcProcedure
    .input(
      z.object({
        scheduleId: z.string().optional(),
        clientId: z.string().optional(),
        status: z
          .enum(["REGISTERED", "CONFIRMED", "ATTENDED", "CANCELLED", "NO_SHOW"])
          .optional(),
        paymentStatus: z
          .enum(["PENDING", "PARTIAL", "PAID", "REFUNDED"])
          .optional(),
      })
    )
    .handler(async ({ input }) => {
      const conditions: ReturnType<typeof eq>[] = [];

      if (input.scheduleId) {
        conditions.push(eq(enrollments.scheduleId, input.scheduleId));
      }

      if (input.clientId) {
        conditions.push(eq(enrollments.clientId, input.clientId));
      }

      if (input.status) {
        conditions.push(eq(enrollments.status, input.status));
      }

      if (input.paymentStatus) {
        conditions.push(eq(enrollments.paymentStatus, input.paymentStatus));
      }

      const result = await db
        .select({
          id: enrollments.id,
          scheduleId: enrollments.scheduleId,
          clientId: enrollments.clientId,
          clientName: client.displayName,
          clientEmail: client.email,
          courseTitle: courses.title,
          scheduleStartDate: courseSchedules.startDate,
          scheduleLocation: courseSchedules.location,
          status: enrollments.status,
          paymentStatus: enrollments.paymentStatus,
          certificateNumber: enrollments.certificateNumber,
          certificateIssuedAt: enrollments.certificateIssuedAt,
          enrolledAt: enrollments.enrolledAt,
        })
        .from(enrollments)
        .innerJoin(client, eq(enrollments.clientId, client.id))
        .innerJoin(
          courseSchedules,
          eq(enrollments.scheduleId, courseSchedules.id)
        )
        .innerJoin(
          courses,
          and(
            eq(courseSchedules.courseId, courses.id),
            eq(courses.business, "GCMC")
          )
        )
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(enrollments.enrolledAt));

      return result;
    }),

  // Enroll client in course
  createEnrollment: staffProcedure
    .input(
      insertEnrollmentSchema.omit({
        id: true,
        enrolledAt: true,
        updatedAt: true,
      })
    )
    .handler(async ({ input }) => {
      // Verify schedule exists and is not full
      const [scheduleData] = await db
        .select({
          id: courseSchedules.id,
          status: courseSchedules.status,
          maxParticipants: courses.maxParticipants,
          enrollmentCount: count(enrollments.id),
        })
        .from(courseSchedules)
        .innerJoin(
          courses,
          and(
            eq(courseSchedules.courseId, courses.id),
            eq(courses.business, "GCMC")
          )
        )
        .leftJoin(
          enrollments,
          and(
            eq(courseSchedules.id, enrollments.scheduleId),
            sql`${enrollments.status} NOT IN ('CANCELLED', 'NO_SHOW')`
          )
        )
        .where(eq(courseSchedules.id, input.scheduleId))
        .groupBy(courseSchedules.id, courses.id)
        .limit(1);

      if (!scheduleData) {
        throw new Error("Schedule not found");
      }

      if (scheduleData.status === "CANCELLED") {
        throw new Error("Cannot enroll in cancelled schedule");
      }

      if (scheduleData.status === "COMPLETED") {
        throw new Error("Cannot enroll in completed schedule");
      }

      if (scheduleData.enrollmentCount >= scheduleData.maxParticipants) {
        throw new Error("Schedule is full");
      }

      // Check if client is already enrolled
      const [existing] = await db
        .select()
        .from(enrollments)
        .where(
          and(
            eq(enrollments.scheduleId, input.scheduleId),
            eq(enrollments.clientId, input.clientId)
          )
        )
        .limit(1);

      if (existing) {
        throw new Error("Client is already enrolled in this schedule");
      }

      const id = nanoid();

      const [enrollment] = await db
        .insert(enrollments)
        .values({
          id,
          ...input,
        })
        .returning();

      return enrollment;
    }),

  // Update enrollment status
  updateEnrollment: staffProcedure
    .input(
      z.object({
        id: z.string(),
        data: insertEnrollmentSchema
          .omit({
            id: true,
            enrolledAt: true,
            updatedAt: true,
            scheduleId: true,
            clientId: true,
          })
          .partial(),
      })
    )
    .handler(async ({ input }) => {
      const [enrollment] = await db
        .update(enrollments)
        .set({
          ...input.data,
          updatedAt: new Date(),
        })
        .where(eq(enrollments.id, input.id))
        .returning();

      if (!enrollment) {
        throw new Error("Enrollment not found");
      }

      return enrollment;
    }),

  // Issue certificate for enrollment
  issueCertificate: staffProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      // Verify enrollment is in ATTENDED status
      const [enrollment] = await db
        .select()
        .from(enrollments)
        .where(eq(enrollments.id, input.id))
        .limit(1);

      if (!enrollment) {
        throw new Error("Enrollment not found");
      }

      if (enrollment.status !== "ATTENDED") {
        throw new Error("Can only issue certificates for attended enrollments");
      }

      if (enrollment.certificateNumber) {
        throw new Error("Certificate already issued");
      }

      const certificateNumber = await generateCertificateNumber();

      const [updated] = await db
        .update(enrollments)
        .set({
          certificateNumber,
          certificateIssuedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(enrollments.id, input.id))
        .returning();

      return updated;
    }),

  // Cancel enrollment
  cancelEnrollment: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      const [enrollment] = await db
        .update(enrollments)
        .set({
          status: "CANCELLED",
          updatedAt: new Date(),
        })
        .where(eq(enrollments.id, input.id))
        .returning();

      if (!enrollment) {
        throw new Error("Enrollment not found");
      }

      return enrollment;
    }),
};
