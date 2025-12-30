/**
 * Email Templates Router
 *
 * API endpoints for managing customizable email templates.
 */

import {
  db,
  emailTemplate,
  emailTemplateTypeValues,
  emailTemplateVersion,
} from "@SYNERGY-GY/db";
import { ORPCError } from "@orpc/server";
import { and, count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { z } from "zod";
import { staffProcedure } from "../index";

// Input schemas
const businessValues = ["GCMC", "KAJ"] as const;

const listTemplatesSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  search: z.string().optional(),
  type: z.enum(emailTemplateTypeValues).optional(),
  business: z.enum(businessValues).optional(),
  isActive: z.boolean().optional(),
});

const createTemplateSchema = z.object({
  type: z.enum(emailTemplateTypeValues),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  subject: z.string().min(1, "Subject is required"),
  htmlContent: z.string().min(1, "HTML content is required"),
  textContent: z.string().optional(),
  business: z.enum(businessValues).optional(),
  availableVariables: z.string().optional(),
  isActive: z.boolean().default(true),
});

const updateTemplateSchema = z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  subject: z.string().min(1).optional(),
  htmlContent: z.string().min(1).optional(),
  textContent: z.string().optional(),
  business: z.enum(businessValues).nullable().optional(),
  availableVariables: z.string().optional(),
  isActive: z.boolean().optional(),
  changeNotes: z.string().optional(), // For version tracking
});

// Available variables by template type
const templateVariables: Record<string, string[]> = {
  PORTAL_INVITE: [
    "clientName",
    "email",
    "inviteUrl",
    "expiresInDays",
    "invitedBy",
    "appUrl",
  ],
  WELCOME: ["clientName", "email", "loginUrl", "appUrl"],
  PASSWORD_RESET: ["resetUrl", "expiresInHours", "appUrl"],
  STAFF_PASSWORD_SETUP: [
    "staffName",
    "email",
    "setupUrl",
    "expiresInHours",
    "invitedBy",
    "appUrl",
  ],
  DOCUMENT_REQUEST: [
    "clientName",
    "documentTitle",
    "description",
    "dueDate",
    "portalUrl",
    "appUrl",
  ],
  DOCUMENT_UPLOAD_CONFIRMATION: [
    "clientName",
    "documentTitle",
    "uploadedFileName",
    "uploadedAt",
    "appUrl",
  ],
  MESSAGE_NOTIFICATION: [
    "recipientName",
    "senderName",
    "subject",
    "messagePreview",
    "portalUrl",
    "appUrl",
  ],
  PORTAL_DOCUMENT_UPLOADED: [
    "staffName",
    "clientName",
    "documentName",
    "category",
    "uploadedAt",
    "reviewUrl",
    "appUrl",
  ],
  MATTER_CREATED: [
    "clientName",
    "matterTitle",
    "matterDescription",
    "portalUrl",
    "appUrl",
  ],
  DEADLINE_APPROACHING: [
    "recipientName",
    "deadlineTitle",
    "deadlineDate",
    "daysRemaining",
    "matterTitle",
    "clientName",
    "portalUrl",
    "appUrl",
  ],
  APPOINTMENT_REMINDER: [
    "recipientName",
    "appointmentTitle",
    "appointmentDate",
    "appointmentTime",
    "durationMinutes",
    "locationType",
    "location",
    "assignedStaff",
    "reminderLabel",
    "portalUrl",
    "appUrl",
  ],
  SCHEDULED_REPORT: [
    "reportName",
    "scheduleName",
    "generatedAt",
    "rowCount",
    "attachmentFilename",
    "appUrl",
  ],
  BOOKING_CONFIRMATION: [
    "recipientName",
    "appointmentType",
    "dateFormatted",
    "timeFormatted",
    "durationMinutes",
    "locationDisplay",
    "status",
    "statusMessage",
    "manageUrl",
    "appUrl",
  ],
  INVOICE_CREATED: [
    "clientName",
    "invoiceNumber",
    "totalAmount",
    "dueDate",
    "portalUrl",
    "appUrl",
  ],
  PAYMENT_RECEIVED: [
    "clientName",
    "invoiceNumber",
    "paymentAmount",
    "paymentDate",
    "remainingBalance",
    "appUrl",
  ],
  RECURRING_MATTER_CREATED: [
    "clientName",
    "matterTitle",
    "nextDueDate",
    "recurrencePattern",
    "portalUrl",
    "appUrl",
  ],
  CUSTOM: ["appUrl"],
};

export const emailTemplatesRouter = {
  // List templates with pagination and filters
  list: staffProcedure.input(listTemplatesSchema).handler(async ({ input }) => {
    // biome-ignore lint/suspicious/noEvolvingTypes: Conditions array built dynamically
    const conditions = [];

    // Search filter
    if (input.search) {
      const searchTerm = `%${input.search}%`;
      conditions.push(
        or(
          ilike(emailTemplate.name, searchTerm),
          ilike(emailTemplate.subject, searchTerm),
          ilike(emailTemplate.description, searchTerm)
        )
      );
    }

    // Type filter
    if (input.type) {
      conditions.push(eq(emailTemplate.type, input.type));
    }

    // Business filter
    if (input.business) {
      conditions.push(
        or(
          eq(emailTemplate.business, input.business),
          sql`${emailTemplate.business} IS NULL`
        )
      );
    }

    // Active filter
    if (input.isActive !== undefined) {
      conditions.push(eq(emailTemplate.isActive, input.isActive));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const offset = (input.page - 1) * input.limit;

    const [templates, totalResult] = await Promise.all([
      db.query.emailTemplate.findMany({
        where: whereClause,
        with: {
          createdBy: {
            columns: {
              id: true,
              name: true,
            },
          },
          updatedBy: {
            columns: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [desc(emailTemplate.updatedAt)],
        limit: input.limit,
        offset,
      }),
      db.select({ count: count() }).from(emailTemplate).where(whereClause),
    ]);

    const totalCount = totalResult[0]?.count ?? 0;

    return {
      templates,
      total: totalCount,
      page: input.page,
      limit: input.limit,
    };
  }),

  // Get single template by ID
  getById: staffProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      const template = await db.query.emailTemplate.findFirst({
        where: eq(emailTemplate.id, input.id),
        with: {
          createdBy: {
            columns: {
              id: true,
              name: true,
            },
          },
          updatedBy: {
            columns: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!template) {
        throw new ORPCError("NOT_FOUND", {
          message: "Email template not found",
        });
      }

      return template;
    }),

  // Get template by type (for email service to use)
  getByType: staffProcedure
    .input(
      z.object({
        type: z.enum(emailTemplateTypeValues),
        business: z.enum(businessValues).optional(),
      })
    )
    .handler(async ({ input }) => {
      // First try to find a business-specific active template
      if (input.business) {
        const businessTemplate = await db.query.emailTemplate.findFirst({
          where: and(
            eq(emailTemplate.type, input.type),
            eq(emailTemplate.business, input.business),
            eq(emailTemplate.isActive, true)
          ),
          orderBy: [desc(emailTemplate.updatedAt)],
        });

        if (businessTemplate) {
          return businessTemplate;
        }
      }

      // Fall back to a global template (null business)
      const globalTemplate = await db.query.emailTemplate.findFirst({
        where: and(
          eq(emailTemplate.type, input.type),
          sql`${emailTemplate.business} IS NULL`,
          eq(emailTemplate.isActive, true)
        ),
        orderBy: [desc(emailTemplate.updatedAt)],
      });

      return globalTemplate || null;
    }),

  // Create new template
  create: staffProcedure
    .input(createTemplateSchema)
    .handler(async ({ input, context }) => {
      const userId = context.session?.user?.id;

      // Add default available variables if not provided
      const availableVariables =
        input.availableVariables ||
        templateVariables[input.type]?.join(", ") ||
        "";

      const [created] = await db
        .insert(emailTemplate)
        .values({
          type: input.type,
          name: input.name,
          description: input.description,
          subject: input.subject,
          htmlContent: input.htmlContent,
          textContent: input.textContent,
          business: input.business,
          availableVariables,
          isActive: input.isActive,
          createdById: userId,
          updatedById: userId,
        })
        .returning();

      return created;
    }),

  // Update template
  update: staffProcedure.input(updateTemplateSchema).handler(
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Update handler has many optional field checks and version tracking logic
    async ({ input, context }) => {
      const userId = context.session?.user?.id;

      // Get existing template
      const existing = await db.query.emailTemplate.findFirst({
        where: eq(emailTemplate.id, input.id),
      });

      if (!existing) {
        throw new ORPCError("NOT_FOUND", {
          message: "Email template not found",
        });
      }

      // Create version record for history (only if content changed)
      const contentChanged =
        (input.subject && input.subject !== existing.subject) ||
        (input.htmlContent && input.htmlContent !== existing.htmlContent) ||
        (input.textContent && input.textContent !== existing.textContent);

      if (contentChanged) {
        // Count existing versions
        const versionCountResult = await db
          .select({ count: count() })
          .from(emailTemplateVersion)
          .where(eq(emailTemplateVersion.templateId, input.id));

        const versionNumber = (versionCountResult[0]?.count ?? 0) + 1;

        await db.insert(emailTemplateVersion).values({
          templateId: input.id,
          version: versionNumber.toString(),
          subject: existing.subject,
          htmlContent: existing.htmlContent,
          textContent: existing.textContent,
          changedById: userId,
          changeNotes: input.changeNotes || `Version ${versionNumber}`,
        });
      }

      // Build update object
      const updateData: Record<string, unknown> = {
        updatedById: userId,
        updatedAt: new Date(),
      };

      if (input.name !== undefined) {
        updateData.name = input.name;
      }
      if (input.description !== undefined) {
        updateData.description = input.description;
      }
      if (input.subject !== undefined) {
        updateData.subject = input.subject;
      }
      if (input.htmlContent !== undefined) {
        updateData.htmlContent = input.htmlContent;
      }
      if (input.textContent !== undefined) {
        updateData.textContent = input.textContent;
      }
      if (input.business !== undefined) {
        updateData.business = input.business;
      }
      if (input.availableVariables !== undefined) {
        updateData.availableVariables = input.availableVariables;
      }
      if (input.isActive !== undefined) {
        updateData.isActive = input.isActive;
      }

      const [updated] = await db
        .update(emailTemplate)
        .set(updateData)
        .where(eq(emailTemplate.id, input.id))
        .returning();

      return updated;
    }
  ),

  // Delete template
  delete: staffProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      const existing = await db.query.emailTemplate.findFirst({
        where: eq(emailTemplate.id, input.id),
      });

      if (!existing) {
        throw new ORPCError("NOT_FOUND", {
          message: "Email template not found",
        });
      }

      if (existing.isDefault) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Cannot delete default system template",
        });
      }

      await db.delete(emailTemplate).where(eq(emailTemplate.id, input.id));

      return { success: true };
    }),

  // Get template versions (history)
  getVersions: staffProcedure
    .input(z.object({ templateId: z.string() }))
    .handler(async ({ input }) => {
      const versions = await db.query.emailTemplateVersion.findMany({
        where: eq(emailTemplateVersion.templateId, input.templateId),
        with: {
          changedBy: {
            columns: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [desc(emailTemplateVersion.changedAt)],
      });

      return versions;
    }),

  // Restore a previous version
  restoreVersion: staffProcedure
    .input(z.object({ versionId: z.string() }))
    .handler(async ({ input, context }) => {
      const userId = context.session?.user?.id;

      const version = await db.query.emailTemplateVersion.findFirst({
        where: eq(emailTemplateVersion.id, input.versionId),
      });

      if (!version) {
        throw new ORPCError("NOT_FOUND", {
          message: "Template version not found",
        });
      }

      // Update the template with the version's content
      const [restored] = await db
        .update(emailTemplate)
        .set({
          subject: version.subject,
          htmlContent: version.htmlContent,
          textContent: version.textContent,
          updatedById: userId,
          updatedAt: new Date(),
        })
        .where(eq(emailTemplate.id, version.templateId))
        .returning();

      return restored;
    }),

  // Preview template with sample data
  preview: staffProcedure
    .input(
      z.object({
        id: z.string().optional(),
        htmlContent: z.string().optional(),
        subject: z.string().optional(),
        type: z.enum(emailTemplateTypeValues).optional(),
      })
    )
    .handler(async ({ input }) => {
      let htmlContent: string;
      let subject: string;
      let templateType: string;

      if (input.id) {
        // Load template from database
        const template = await db.query.emailTemplate.findFirst({
          where: eq(emailTemplate.id, input.id),
        });

        if (!template) {
          throw new ORPCError("NOT_FOUND", {
            message: "Email template not found",
          });
        }

        htmlContent = template.htmlContent;
        subject = template.subject;
        templateType = template.type;
      } else {
        // Use provided content
        htmlContent = input.htmlContent || "";
        subject = input.subject || "";
        templateType = input.type || "CUSTOM";
      }

      // Generate sample data based on template type
      const sampleData = getSampleData(templateType);

      // Replace variables in content
      const renderedHtml = replaceVariables(htmlContent, sampleData);
      const renderedSubject = replaceVariables(subject, sampleData);

      return {
        subject: renderedSubject,
        html: renderedHtml,
        sampleData,
      };
    }),

  // Get available variable list for a template type
  getAvailableVariables: staffProcedure
    .input(z.object({ type: z.enum(emailTemplateTypeValues) }))
    .handler(({ input }) => ({
      variables: templateVariables[input.type] || [],
    })),

  // Get all template types
  getTypes: staffProcedure.handler(() =>
    emailTemplateTypeValues.map((type) => ({
      value: type,
      label: formatTemplateType(type),
      variables: templateVariables[type] || [],
    }))
  ),
};

// Helper function to format template type for display
function formatTemplateType(type: string): string {
  return type
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

// Helper function to replace {{variable}} placeholders
function replaceVariables(
  content: string,
  data: Record<string, string>
): string {
  let result = content;
  for (const [key, value] of Object.entries(data)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
    result = result.replace(regex, value);
  }
  return result;
}

// Helper function to generate sample data for preview
function getSampleData(templateType: string): Record<string, string> {
  const baseData: Record<string, string> = {
    appUrl: "https://portal.gk-nexus.com",
    portalUrl: "https://portal.gk-nexus.com",
  };

  const sampleDataByType: Record<string, Record<string, string>> = {
    PORTAL_INVITE: {
      clientName: "John Smith",
      email: "john.smith@example.com",
      inviteUrl: "https://portal.gk-nexus.com/invite/abc123",
      expiresInDays: "7",
      invitedBy: "Jane Doe",
    },
    WELCOME: {
      clientName: "John Smith",
      email: "john.smith@example.com",
      loginUrl: "https://portal.gk-nexus.com/login",
    },
    PASSWORD_RESET: {
      resetUrl: "https://portal.gk-nexus.com/reset-password/abc123",
      expiresInHours: "24",
    },
    STAFF_PASSWORD_SETUP: {
      staffName: "Jane Doe",
      email: "jane.doe@gcmc.gy",
      setupUrl: "https://portal.gk-nexus.com/setup/abc123",
      expiresInHours: "48",
      invitedBy: "Admin User",
    },
    DOCUMENT_REQUEST: {
      clientName: "John Smith",
      documentTitle: "Tax Return 2024",
      description: "Please upload your completed tax return for 2024",
      dueDate: "January 15, 2025",
    },
    DOCUMENT_UPLOAD_CONFIRMATION: {
      clientName: "John Smith",
      documentTitle: "Passport Copy",
      uploadedFileName: "passport-scan.pdf",
      uploadedAt: "December 30, 2024 at 10:30 AM",
    },
    MESSAGE_NOTIFICATION: {
      recipientName: "John Smith",
      senderName: "Jane Doe",
      subject: "Your Tax Filing Status",
      messagePreview:
        "Hi John, I wanted to update you on the status of your tax filing...",
    },
    PORTAL_DOCUMENT_UPLOADED: {
      staffName: "Jane Doe",
      clientName: "John Smith",
      documentName: "Bank Statement.pdf",
      category: "Financial",
      uploadedAt: "December 30, 2024 at 10:30 AM",
      reviewUrl: "https://portal.gk-nexus.com/documents/review/abc123",
    },
    MATTER_CREATED: {
      clientName: "John Smith",
      matterTitle: "Annual Tax Filing 2024",
      matterDescription: "Preparation and submission of annual tax returns",
    },
    DEADLINE_APPROACHING: {
      recipientName: "Jane Doe",
      deadlineTitle: "Tax Filing Deadline",
      deadlineDate: "April 30, 2025",
      daysRemaining: "5",
      matterTitle: "Annual Tax Filing 2024",
      clientName: "John Smith",
    },
    APPOINTMENT_REMINDER: {
      recipientName: "John Smith",
      appointmentTitle: "Tax Consultation",
      appointmentDate: "January 5, 2025",
      appointmentTime: "2:00 PM",
      durationMinutes: "60",
      locationType: "In Person",
      location: "GCMC Office, Georgetown",
      assignedStaff: "Jane Doe",
      reminderLabel: "tomorrow",
    },
    SCHEDULED_REPORT: {
      reportName: "Monthly Revenue Report",
      scheduleName: "Weekly Revenue Summary",
      generatedAt: "December 30, 2024 at 8:00 AM",
      rowCount: "150",
      attachmentFilename: "revenue-report-2024-12.xlsx",
    },
    BOOKING_CONFIRMATION: {
      recipientName: "John Smith",
      appointmentType: "Tax Consultation",
      dateFormatted: "Monday, January 6, 2025",
      timeFormatted: "2:00 PM",
      durationMinutes: "60",
      locationDisplay: "Video Call",
      status: "Confirmed",
      statusMessage: "Your appointment has been confirmed!",
      manageUrl: "https://portal.gk-nexus.com/book/manage/abc123",
    },
    INVOICE_CREATED: {
      clientName: "John Smith",
      invoiceNumber: "INV-2024-0123",
      totalAmount: "$1,500.00",
      dueDate: "January 30, 2025",
    },
    PAYMENT_RECEIVED: {
      clientName: "John Smith",
      invoiceNumber: "INV-2024-0123",
      paymentAmount: "$500.00",
      paymentDate: "December 30, 2024",
      remainingBalance: "$1,000.00",
    },
    RECURRING_MATTER_CREATED: {
      clientName: "John Smith",
      matterTitle: "Quarterly VAT Filing",
      nextDueDate: "March 31, 2025",
      recurrencePattern: "Quarterly",
    },
    CUSTOM: {},
  };

  return {
    ...baseData,
    ...(sampleDataByType[templateType] || {}),
  };
}
