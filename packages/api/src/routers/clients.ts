import {
  appointment,
  client,
  clientCommunication,
  clientContact,
  clientLink,
  db,
  document,
  invoice,
  matter,
} from "@SYNERGY-GY/db";
import { ORPCError } from "@orpc/server";
import { and, asc, count, desc, eq, gte, ilike, or, sql } from "drizzle-orm";
import { z } from "zod";
import {
  canAccessBusiness,
  canViewFinancials,
  getAccessibleBusinesses,
  staffProcedure,
} from "../index";

// Input schemas
const clientTypeValues = [
  "INDIVIDUAL",
  "SMALL_BUSINESS",
  "CORPORATION",
  "NGO",
  "COOP",
  "CREDIT_UNION",
  "FOREIGN_NATIONAL",
  "INVESTOR",
] as const;

const clientStatusValues = ["ACTIVE", "INACTIVE", "ARCHIVED"] as const;

const communicationTypeValues = [
  "PHONE",
  "EMAIL",
  "IN_PERSON",
  "LETTER",
  "WHATSAPP",
  "OTHER",
] as const;

const communicationDirectionValues = ["INBOUND", "OUTBOUND"] as const;

const clientLinkTypeValues = [
  "SPOUSE",
  "PARENT",
  "CHILD",
  "SIBLING",
  "DIRECTOR",
  "SHAREHOLDER",
  "EMPLOYEE",
  "PARTNER",
  "ACCOUNTANT",
  "ATTORNEY",
  "OTHER",
] as const;

const businessValues = ["GCMC", "KAJ"] as const;

// Zod schemas
const createClientSchema = z.object({
  type: z.enum(clientTypeValues),
  displayName: z.string().min(1, "Display name is required"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  dateOfBirth: z.string().optional(), // ISO date string
  nationality: z.string().optional(),
  businessName: z.string().optional(),
  registrationNumber: z.string().optional(),
  incorporationDate: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  alternatePhone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().default("Guyana"),
  tinNumber: z.string().optional(),
  nationalId: z.string().optional(),
  passportNumber: z.string().optional(),
  businesses: z
    .array(z.enum(businessValues))
    .min(1, "At least one business required"),
  status: z.enum(clientStatusValues).default("ACTIVE"),
  primaryStaffId: z.string().optional(),
  notes: z.string().optional(),
});

const updateClientSchema = createClientSchema.partial().extend({
  id: z.string(),
});

const listClientsSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  search: z.string().optional(),
  type: z.enum(clientTypeValues).optional(),
  business: z.enum(businessValues).optional(),
  status: z.enum(clientStatusValues).optional(),
  sortBy: z
    .enum(["displayName", "createdAt", "updatedAt"])
    .default("displayName"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

const listWithStatsSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(20),
  search: z.string().optional(),
  type: z.enum(clientTypeValues).optional(),
  business: z.enum(businessValues).optional(),
  status: z.enum(clientStatusValues).optional(),
  sortBy: z
    .enum(["displayName", "createdAt", "updatedAt", "activeMatterCount"])
    .default("displayName"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

const createContactSchema = z.object({
  clientId: z.string(),
  name: z.string().min(1, "Name is required"),
  relationship: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  isPrimary: z.boolean().default(false),
  notes: z.string().optional(),
});

const updateContactSchema = createContactSchema.partial().extend({
  id: z.string(),
});

const createLinkSchema = z.object({
  clientId: z.string(),
  linkedClientId: z.string(),
  linkType: z.enum(clientLinkTypeValues),
  notes: z.string().optional(),
});

const createCommunicationSchema = z.object({
  clientId: z.string(),
  type: z.enum(communicationTypeValues),
  direction: z.enum(communicationDirectionValues),
  subject: z.string().optional(),
  summary: z.string().min(1, "Summary is required"),
  communicatedAt: z.string(), // ISO date string
});

// Clients router
export const clientsRouter = {
  // List clients with pagination and filters
  list: staffProcedure
    .input(listClientsSchema)
    .handler(async ({ input, context }) => {
      const accessibleBusinesses = getAccessibleBusinesses(context.staff);

      if (accessibleBusinesses.length === 0) {
        return { clients: [], total: 0, page: input.page, limit: input.limit };
      }

      // biome-ignore lint/suspicious/noEvolvingTypes: Auto-fix
      const conditions = [];

      // Filter by accessible businesses (clients must have at least one overlapping business)
      if (input.business) {
        if (!accessibleBusinesses.includes(input.business)) {
          throw new ORPCError("FORBIDDEN", {
            message: "You don't have access to this business",
          });
        }
        conditions.push(
          sql`${client.businesses} && ARRAY[${input.business}]::text[]`
        );
      } else {
        conditions.push(
          sql`${client.businesses} && ARRAY[${sql.join(accessibleBusinesses, sql`, `)}]::text[]`
        );
      }

      // Search filter
      if (input.search) {
        const searchTerm = `%${input.search}%`;
        conditions.push(
          or(
            ilike(client.displayName, searchTerm),
            ilike(client.email, searchTerm),
            ilike(client.tinNumber, searchTerm),
            ilike(client.phone, searchTerm),
            ilike(client.businessName, searchTerm)
          )
        );
      }

      // Type filter
      if (input.type) {
        conditions.push(eq(client.type, input.type));
      }

      // Status filter
      if (input.status) {
        conditions.push(eq(client.status, input.status));
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count
      const countResult = await db
        .select({ total: count() })
        .from(client)
        .where(whereClause);

      const total = countResult[0]?.total ?? 0;

      // Get paginated results
      const offset = (input.page - 1) * input.limit;
      const orderColumn = client[input.sortBy];
      const orderDirection = input.sortOrder === "asc" ? asc : desc;

      const clients = await db
        .select()
        .from(client)
        .where(whereClause)
        .orderBy(orderDirection(orderColumn))
        .limit(input.limit)
        .offset(offset);

      return {
        clients,
        total,
        page: input.page,
        limit: input.limit,
        totalPages: Math.ceil(total / input.limit),
      };
    }),

  /**
   * List clients with aggregated stats for at-a-glance information
   * Includes: matter counts, compliance status, financials, engagement metrics
   */
  listWithStats: staffProcedure
    .input(listWithStatsSchema)
    .handler(async ({ input, context }) => {
      const accessibleBusinesses = getAccessibleBusinesses(context.staff);
      const hasFinancialAccess = canViewFinancials(context.staff);

      if (accessibleBusinesses.length === 0) {
        return { clients: [], total: 0, page: input.page, limit: input.limit };
      }

      // biome-ignore lint/suspicious/noEvolvingTypes: Dynamic conditions
      const conditions = [];

      // Filter by accessible businesses
      if (input.business) {
        if (!accessibleBusinesses.includes(input.business)) {
          throw new ORPCError("FORBIDDEN", {
            message: "You don't have access to this business",
          });
        }
        conditions.push(
          sql`${client.businesses} && ARRAY[${input.business}]::text[]`
        );
      } else {
        conditions.push(
          sql`${client.businesses} && ARRAY[${sql.join(accessibleBusinesses, sql`, `)}]::text[]`
        );
      }

      // Search filter
      if (input.search) {
        const searchTerm = `%${input.search}%`;
        conditions.push(
          or(
            ilike(client.displayName, searchTerm),
            ilike(client.email, searchTerm),
            ilike(client.tinNumber, searchTerm),
            ilike(client.phone, searchTerm),
            ilike(client.businessName, searchTerm)
          )
        );
      }

      // Type filter
      if (input.type) {
        conditions.push(eq(client.type, input.type));
      }

      // Status filter
      if (input.status) {
        conditions.push(eq(client.status, input.status));
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count
      const countResult = await db
        .select({ total: count() })
        .from(client)
        .where(whereClause);

      const total = countResult[0]?.total ?? 0;

      // Get paginated results with stats using efficient subqueries
      const offset = (input.page - 1) * input.limit;

      // Build the main query with subqueries for aggregated stats
      const clientsWithStats = await db.execute(sql`
        SELECT
          c.id,
          c.display_name,
          c.type,
          c.email,
          c.phone,
          c.businesses,
          c.status,
          c.tin_number,
          c.gra_compliant,
          c.nis_compliant,
          c.aml_risk_rating,
          c.last_compliance_check_date,
          c.onboarding_completed,
          c.created_at,
          c.updated_at,
          -- Matter counts
          COALESCE(m.active_count, 0)::int as active_matter_count,
          COALESCE(m.pending_count, 0)::int as pending_matter_count,
          COALESCE(m.total_count, 0)::int as total_matter_count,
          -- Financial stats (only if user has access)
          ${
            hasFinancialAccess
              ? sql`
            COALESCE(f.total_outstanding, '0') as total_outstanding,
            COALESCE(f.overdue_amount, '0') as overdue_amount,
            COALESCE(f.overdue_count, 0)::int as overdue_count
          `
              : sql`
            NULL as total_outstanding,
            NULL as overdue_amount,
            NULL as overdue_count
          `
          },
          -- Engagement stats
          cc.last_contact_date,
          COALESCE(apt.upcoming_count, 0)::int as upcoming_appointment_count,
          apt.next_appointment_date
        FROM client c
        -- Matter stats subquery
        LEFT JOIN LATERAL (
          SELECT
            COUNT(*) FILTER (WHERE status IN ('NEW', 'IN_PROGRESS', 'PENDING_INFO', 'UNDER_REVIEW')) as active_count,
            COUNT(*) FILTER (WHERE status IN ('PENDING_CLIENT', 'PENDING_INFO')) as pending_count,
            COUNT(*) as total_count
          FROM matter WHERE client_id = c.id
        ) m ON true
        -- Financial stats subquery (only calculated if user has access)
        ${
          hasFinancialAccess
            ? sql`
          LEFT JOIN LATERAL (
            SELECT
              SUM(CAST(amount_due AS DECIMAL)) as total_outstanding,
              SUM(CASE WHEN status = 'OVERDUE' THEN CAST(amount_due AS DECIMAL) ELSE 0 END) as overdue_amount,
              COUNT(*) FILTER (WHERE status = 'OVERDUE') as overdue_count
            FROM invoice WHERE client_id = c.id AND status IN ('SENT', 'OVERDUE')
          ) f ON true
        `
            : sql``
        }
        -- Last communication date
        LEFT JOIN LATERAL (
          SELECT MAX(communicated_at) as last_contact_date
          FROM client_communication WHERE client_id = c.id
        ) cc ON true
        -- Upcoming appointments
        LEFT JOIN LATERAL (
          SELECT
            COUNT(*) as upcoming_count,
            MIN(scheduled_at) as next_appointment_date
          FROM appointment
          WHERE client_id = c.id
            AND scheduled_at >= NOW()
            AND status IN ('REQUESTED', 'CONFIRMED')
        ) apt ON true
        ${whereClause ? sql`WHERE ${whereClause}` : sql``}
        ORDER BY ${
          input.sortBy === "activeMatterCount"
            ? sql`m.active_count`
            : input.sortBy === "createdAt"
              ? sql`c.created_at`
              : input.sortBy === "updatedAt"
                ? sql`c.updated_at`
                : sql`c.display_name`
        } ${input.sortOrder === "desc" ? sql`DESC` : sql`ASC`}
        LIMIT ${input.limit}
        OFFSET ${offset}
      `);

      // Transform results to match expected shape
      const clients = clientsWithStats.rows.map(
        (row: Record<string, unknown>) => ({
          id: row.id as string,
          displayName: row.display_name as string,
          type: row.type as string,
          email: row.email as string | null,
          phone: row.phone as string | null,
          businesses: row.businesses as string[],
          status: row.status as string,
          tinNumber: row.tin_number as string | null,
          graCompliant: row.gra_compliant as boolean,
          nisCompliant: row.nis_compliant as boolean,
          amlRiskRating: row.aml_risk_rating as "LOW" | "MEDIUM" | "HIGH",
          lastComplianceCheckDate: row.last_compliance_check_date as
            | string
            | null,
          onboardingCompleted: row.onboarding_completed as boolean,
          createdAt: row.created_at as string,
          updatedAt: row.updated_at as string,
          // Aggregated stats
          activeMatterCount: row.active_matter_count as number,
          pendingMatterCount: row.pending_matter_count as number,
          totalMatterCount: row.total_matter_count as number,
          // Financial stats (null if no access)
          financials: hasFinancialAccess
            ? {
                totalOutstanding: row.total_outstanding as string,
                overdueAmount: row.overdue_amount as string,
                overdueCount: row.overdue_count as number,
              }
            : null,
          // Engagement stats
          lastContactDate: row.last_contact_date as string | null,
          upcomingAppointmentCount: row.upcoming_appointment_count as number,
          nextAppointmentDate: row.next_appointment_date as string | null,
        })
      );

      return {
        clients,
        total,
        page: input.page,
        limit: input.limit,
        totalPages: Math.ceil(total / input.limit),
        canViewFinancials: hasFinancialAccess,
      };
    }),

  // Get single client by ID
  getById: staffProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const result = await db.query.client.findFirst({
        where: eq(client.id, input.id),
        with: {
          primaryStaff: {
            with: {
              user: true,
            },
          },
          contacts: true,
          communications: {
            // biome-ignore lint/nursery/noShadow: Auto-fix
            orderBy: (comm, { desc }) => [desc(comm.communicatedAt)],
            limit: 10,
            with: {
              staff: {
                with: {
                  user: true,
                },
              },
            },
          },
          links: {
            with: {
              linkedClient: true,
            },
          },
        },
      });

      if (!result) {
        throw new ORPCError("NOT_FOUND", { message: "Client not found" });
      }

      // Check if user has access to this client's businesses
      const accessibleBusinesses = getAccessibleBusinesses(context.staff);
      const hasAccess = result.businesses.some((b) =>
        accessibleBusinesses.includes(b as "GCMC" | "KAJ")
      );

      if (!hasAccess) {
        throw new ORPCError("FORBIDDEN", {
          message: "You don't have access to this client",
        });
      }

      return result;
    }),

  // Create new client
  create: staffProcedure
    .input(createClientSchema)
    .handler(async ({ input, context }) => {
      // Verify user can access the businesses they're assigning
      for (const business of input.businesses) {
        if (!canAccessBusiness(context.staff, business)) {
          throw new ORPCError("FORBIDDEN", {
            message: `You don't have access to ${business}`,
          });
        }
      }

      const [newClient] = await db
        .insert(client)
        .values({
          ...input,
          email: input.email || null,
          createdById: context.session.user.id,
        })
        .returning();

      return newClient;
    }),

  // Update existing client
  update: staffProcedure
    .input(updateClientSchema)
    .handler(async ({ input, context }) => {
      const { id, ...updates } = input;

      // Fetch existing client
      const existing = await db.query.client.findFirst({
        where: eq(client.id, id),
      });

      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Client not found" });
      }

      // Check access to existing client
      const accessibleBusinesses = getAccessibleBusinesses(context.staff);
      const hasAccess = existing.businesses.some((b) =>
        accessibleBusinesses.includes(b as "GCMC" | "KAJ")
      );

      if (!hasAccess) {
        throw new ORPCError("FORBIDDEN", {
          message: "You don't have access to this client",
        });
      }

      // If updating businesses, verify access to new businesses
      if (updates.businesses) {
        for (const business of updates.businesses) {
          if (!canAccessBusiness(context.staff, business)) {
            throw new ORPCError("FORBIDDEN", {
              message: `You don't have access to ${business}`,
            });
          }
        }
      }

      const [updated] = await db
        .update(client)
        .set({
          ...updates,
          email: updates.email || null,
        })
        .where(eq(client.id, id))
        .returning();

      return updated;
    }),

  // Quick search for autocomplete
  search: staffProcedure
    .input(
      z.object({ query: z.string().min(1), limit: z.number().default(10) })
    )
    .handler(async ({ input, context }) => {
      const accessibleBusinesses = getAccessibleBusinesses(context.staff);
      const searchTerm = `%${input.query}%`;

      const results = await db
        .select({
          id: client.id,
          displayName: client.displayName,
          type: client.type,
          businesses: client.businesses,
        })
        .from(client)
        .where(
          and(
            sql`${client.businesses} && ARRAY[${sql.join(accessibleBusinesses, sql`, `)}]::text[]`,
            eq(client.status, "ACTIVE"),
            or(
              ilike(client.displayName, searchTerm),
              ilike(client.email, searchTerm),
              ilike(client.tinNumber, searchTerm)
            )
          )
        )
        .limit(input.limit);

      return results;
    }),

  // Contacts sub-router
  contacts: {
    list: staffProcedure
      .input(z.object({ clientId: z.string() }))
      .handler(async ({ input }) =>
        db.query.clientContact.findMany({
          where: eq(clientContact.clientId, input.clientId),
          // biome-ignore lint/nursery/noShadow: Auto-fix
          orderBy: (c, { desc }) => [desc(c.isPrimary), asc(c.name)],
        })
      ),

    create: staffProcedure
      .input(createContactSchema)
      .handler(async ({ input }) => {
        const [newContact] = await db
          .insert(clientContact)
          .values({
            ...input,
            email: input.email || null,
            isPrimary: input.isPrimary ? "true" : "false",
          })
          .returning();
        return newContact;
      }),

    update: staffProcedure
      .input(updateContactSchema)
      .handler(async ({ input }) => {
        const { id, ...updates } = input;
        const [updated] = await db
          .update(clientContact)
          .set({
            ...updates,
            email: updates.email || null,
            isPrimary:
              updates.isPrimary !== undefined
                ? // biome-ignore lint/style/noNestedTernary: Auto-fix
                  updates.isPrimary
                  ? "true"
                  : "false"
                : undefined,
          })
          .where(eq(clientContact.id, id))
          .returning();
        return updated;
      }),

    delete: staffProcedure
      .input(z.object({ id: z.string() }))
      .handler(async ({ input }) => {
        await db.delete(clientContact).where(eq(clientContact.id, input.id));
        return { success: true };
      }),
  },

  // Links sub-router
  links: {
    list: staffProcedure
      .input(z.object({ clientId: z.string() }))
      .handler(async ({ input }) =>
        db.query.clientLink.findMany({
          where: eq(clientLink.clientId, input.clientId),
          with: {
            linkedClient: true,
          },
        })
      ),

    create: staffProcedure
      .input(createLinkSchema)
      .handler(async ({ input }) => {
        // Don't allow self-linking
        if (input.clientId === input.linkedClientId) {
          throw new ORPCError("BAD_REQUEST", {
            message: "Cannot link client to themselves",
          });
        }

        const [newLink] = await db.insert(clientLink).values(input).returning();
        return newLink;
      }),

    delete: staffProcedure
      .input(z.object({ id: z.string() }))
      .handler(async ({ input }) => {
        await db.delete(clientLink).where(eq(clientLink.id, input.id));
        return { success: true };
      }),
  },

  // Communications sub-router
  communications: {
    list: staffProcedure
      .input(
        z.object({
          clientId: z.string(),
          page: z.number().default(1),
          limit: z.number().default(20),
        })
      )
      .handler(async ({ input }) => {
        const offset = (input.page - 1) * input.limit;

        const countResult = await db
          .select({ total: count() })
          .from(clientCommunication)
          .where(eq(clientCommunication.clientId, input.clientId));

        const total = countResult[0]?.total ?? 0;

        const communications = await db.query.clientCommunication.findMany({
          where: eq(clientCommunication.clientId, input.clientId),
          // biome-ignore lint/nursery/noShadow: Auto-fix
          orderBy: (c, { desc }) => [desc(c.communicatedAt)],
          limit: input.limit,
          offset,
          with: {
            staff: {
              with: {
                user: true,
              },
            },
          },
        });

        return {
          communications,
          total,
          page: input.page,
          limit: input.limit,
        };
      }),

    create: staffProcedure
      .input(createCommunicationSchema)
      .handler(async ({ input, context }) => {
        const [newComm] = await db
          .insert(clientCommunication)
          .values({
            ...input,
            communicatedAt: new Date(input.communicatedAt),
            staffId: context.staff?.id,
          })
          .returning();
        return newComm;
      }),
  },

  /**
   * Get comprehensive client dashboard data
   * Rich overview with matters, documents, financials, and appointments
   */
  getDashboard: staffProcedure
    .input(z.object({ clientId: z.string() }))
    .handler(async ({ input, context }) => {
      // Get client basic info
      const clientInfo = await db.query.client.findFirst({
        where: eq(client.id, input.clientId),
        with: {
          primaryStaff: {
            with: {
              user: {
                columns: { id: true, name: true, email: true },
              },
            },
          },
        },
      });

      if (!clientInfo) {
        throw new ORPCError("NOT_FOUND", { message: "Client not found" });
      }

      // Check access
      const accessibleBusinesses = getAccessibleBusinesses(context.staff);
      const hasAccess = clientInfo.businesses.some((b) =>
        accessibleBusinesses.includes(b as "GCMC" | "KAJ")
      );

      if (!hasAccess) {
        throw new ORPCError("FORBIDDEN", {
          message: "You don't have access to this client",
        });
      }

      // Get matter summary
      const matterSummary = await db
        .select({
          total: count(),
          active: sql<number>`COUNT(CASE WHEN ${matter.status} IN ('NEW', 'IN_PROGRESS', 'PENDING_INFO', 'UNDER_REVIEW') THEN 1 END)`,
          completed: sql<number>`COUNT(CASE WHEN ${matter.status} = 'COMPLETED' THEN 1 END)`,
        })
        .from(matter)
        .where(eq(matter.clientId, input.clientId));

      // Get recent matters (last 5)
      const recentMatters = await db.query.matter.findMany({
        where: eq(matter.clientId, input.clientId),
        orderBy: [desc(matter.updatedAt)],
        limit: 5,
        columns: {
          id: true,
          referenceNumber: true,
          title: true,
          status: true,
          business: true,
          updatedAt: true,
        },
      });

      // Get document count
      const documentCount = await db
        .select({ count: count() })
        .from(document)
        .where(eq(document.clientId, input.clientId));

      // Get recent documents (last 5)
      const recentDocuments = await db.query.document.findMany({
        where: eq(document.clientId, input.clientId),
        orderBy: [desc(document.createdAt)],
        limit: 5,
        columns: {
          id: true,
          originalName: true,
          category: true,
          createdAt: true,
        },
      });

      // Get upcoming appointments
      const upcomingAppointments = await db.query.appointment.findMany({
        where: and(
          eq(appointment.clientId, input.clientId),
          gte(appointment.scheduledAt, new Date()),
          or(
            eq(appointment.status, "REQUESTED"),
            eq(appointment.status, "CONFIRMED")
          )
        ),
        orderBy: [asc(appointment.scheduledAt)],
        limit: 5,
        with: {
          appointmentType: {
            columns: { id: true, name: true, color: true },
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

      // Get recent communications (last 5)
      const recentCommunications = await db.query.clientCommunication.findMany({
        where: eq(clientCommunication.clientId, input.clientId),
        orderBy: [desc(clientCommunication.communicatedAt)],
        limit: 5,
        with: {
          staff: {
            with: {
              user: {
                columns: { id: true, name: true },
              },
            },
          },
        },
      });

      // Financial summary - only include if staff has financial access
      let financialSummary: {
        totalInvoiced: string;
        totalPaid: string;
        totalOutstanding: string;
        totalOverdue: string;
        invoiceCount: number;
        overdueCount: number;
        recentInvoices: Array<{
          id: string;
          invoiceNumber: string;
          invoiceDate: string;
          dueDate: string;
          status: string;
          totalAmount: string;
          amountDue: string;
        }>;
      } | null = null;
      if (canViewFinancials(context.staff)) {
        const invoiceSummary = await db
          .select({
            totalInvoiced: sql<string>`COALESCE(SUM(CAST(${invoice.totalAmount} AS DECIMAL)), 0)`,
            totalPaid: sql<string>`COALESCE(SUM(CAST(${invoice.amountPaid} AS DECIMAL)), 0)`,
            totalOutstanding: sql<string>`COALESCE(SUM(CAST(${invoice.amountDue} AS DECIMAL)), 0)`,
            invoiceCount: count(),
          })
          .from(invoice)
          .where(
            and(
              eq(invoice.clientId, input.clientId),
              or(
                eq(invoice.status, "SENT"),
                eq(invoice.status, "OVERDUE"),
                eq(invoice.status, "PAID")
              )
            )
          );

        const overdueSummary = await db
          .select({
            totalOverdue: sql<string>`COALESCE(SUM(CAST(${invoice.amountDue} AS DECIMAL)), 0)`,
            overdueCount: count(),
          })
          .from(invoice)
          .where(
            and(
              eq(invoice.clientId, input.clientId),
              eq(invoice.status, "OVERDUE")
            )
          );

        // Get recent invoices
        const recentInvoices = await db.query.invoice.findMany({
          where: and(
            eq(invoice.clientId, input.clientId),
            or(
              eq(invoice.status, "SENT"),
              eq(invoice.status, "OVERDUE"),
              eq(invoice.status, "PAID")
            )
          ),
          orderBy: [desc(invoice.invoiceDate)],
          limit: 5,
          columns: {
            id: true,
            invoiceNumber: true,
            invoiceDate: true,
            dueDate: true,
            status: true,
            totalAmount: true,
            amountDue: true,
          },
        });

        financialSummary = {
          totalInvoiced: invoiceSummary[0]?.totalInvoiced || "0",
          totalPaid: invoiceSummary[0]?.totalPaid || "0",
          totalOutstanding: invoiceSummary[0]?.totalOutstanding || "0",
          totalOverdue: overdueSummary[0]?.totalOverdue || "0",
          invoiceCount: invoiceSummary[0]?.invoiceCount || 0,
          overdueCount: overdueSummary[0]?.overdueCount || 0,
          recentInvoices,
        };
      }

      return {
        client: {
          id: clientInfo.id,
          displayName: clientInfo.displayName,
          type: clientInfo.type,
          email: clientInfo.email,
          phone: clientInfo.phone,
          businesses: clientInfo.businesses,
          status: clientInfo.status,
          tinNumber: clientInfo.tinNumber,
          primaryStaff: clientInfo.primaryStaff,
          createdAt: clientInfo.createdAt,
        },
        matters: {
          total: matterSummary[0]?.total ?? 0,
          active: matterSummary[0]?.active ?? 0,
          completed: matterSummary[0]?.completed ?? 0,
          recent: recentMatters,
        },
        documents: {
          total: documentCount[0]?.count ?? 0,
          recent: recentDocuments,
        },
        appointments: {
          upcoming: upcomingAppointments.map((apt) => ({
            id: apt.id,
            title: apt.title,
            scheduledAt: apt.scheduledAt,
            endAt: apt.endAt,
            status: apt.status,
            locationType: apt.locationType,
            appointmentType: apt.appointmentType,
            assignedStaff: apt.assignedStaff,
          })),
        },
        communications: {
          recent: recentCommunications.map((comm) => ({
            id: comm.id,
            type: comm.type,
            direction: comm.direction,
            subject: comm.subject,
            summary: comm.summary,
            communicatedAt: comm.communicatedAt,
            staff: comm.staff,
          })),
        },
        financials: financialSummary,
        canViewFinancials: canViewFinancials(context.staff),
      };
    }),
};
