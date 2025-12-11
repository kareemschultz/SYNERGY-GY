import {
  client,
  clientCommunication,
  clientContact,
  clientLink,
  db,
} from "@SYNERGY-GY/db";
import { ORPCError } from "@orpc/server";
import { and, asc, count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { z } from "zod";
import {
  canAccessBusiness,
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
                ? updates.isPrimary
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
};
