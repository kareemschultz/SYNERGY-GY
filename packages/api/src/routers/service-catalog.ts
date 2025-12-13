import { db, serviceCatalog, serviceCategory } from "@SYNERGY-GY/db";
import { ORPCError } from "@orpc/server";
import { and, asc, count, desc, eq, ilike, or } from "drizzle-orm";
import { z } from "zod";
import {
  adminProcedure,
  canAccessBusiness,
  getAccessibleBusinesses,
  staffProcedure,
} from "../index";

// Enum values
const businessValues = ["GCMC", "KAJ"] as const;

const pricingTierTypeValues = ["FIXED", "RANGE", "TIERED", "CUSTOM"] as const;

// Zod schemas for service category
const createCategorySchema = z.object({
  business: z.enum(businessValues),
  name: z.string().min(1, "Name is required"),
  displayName: z.string().min(1, "Display name is required"),
  description: z.string().optional(),
  icon: z.string().optional(),
  sortOrder: z.number().default(0),
  isActive: z.boolean().default(true),
});

const updateCategorySchema = createCategorySchema.partial().extend({
  id: z.string(),
});

const listCategoriesSchema = z.object({
  business: z.enum(businessValues).optional(),
  isActive: z.boolean().optional(),
  includeServiceCount: z.boolean().default(false),
});

// Zod schemas for service catalog
const pricingTierSchema = z.object({
  name: z.string().min(1, "Tier name is required"),
  description: z.string().optional(),
  price: z.number().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  conditions: z.string().optional(),
});

const createServiceSchema = z.object({
  categoryId: z.string(),
  business: z.enum(businessValues),
  name: z.string().min(1, "Name is required"),
  displayName: z.string().min(1, "Display name is required"),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  targetAudience: z.string().optional(),
  topicsCovered: z.array(z.string()).optional(),
  documentRequirements: z.array(z.string()).optional(),
  workflow: z.string().optional(),
  deliverables: z.array(z.string()).optional(),
  typicalDuration: z.string().optional(),
  estimatedDays: z.number().optional(),
  pricingType: z.enum(pricingTierTypeValues).default("FIXED"),
  basePrice: z.string().optional(), // Decimal as string
  maxPrice: z.string().optional(),
  currency: z.string().default("GYD"),
  pricingTiers: z.array(pricingTierSchema).optional(),
  pricingNotes: z.string().optional(),
  discountsAvailable: z.string().optional(),
  governmentFees: z.string().optional(),
  governmentAgencies: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  sortOrder: z.number().default(0),
  tags: z.array(z.string()).optional(),
});

const updateServiceSchema = createServiceSchema.partial().extend({
  id: z.string(),
});

const listServicesSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  search: z.string().optional(),
  business: z.enum(businessValues).optional(),
  categoryId: z.string().optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  sortBy: z
    .enum(["displayName", "sortOrder", "createdAt", "basePrice"])
    .default("sortOrder"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

// Service Catalog Router
export const serviceCatalogRouter = {
  // Service Categories - Admin only
  categories: {
    // List all categories
    list: staffProcedure
      .input(listCategoriesSchema)
      .handler(async ({ input, context }) => {
        const accessibleBusinesses = getAccessibleBusinesses(context.staff);

        if (accessibleBusinesses.length === 0) {
          return { categories: [] };
        }

        // biome-ignore lint/suspicious/noEvolvingTypes: Auto-fix
        const conditions = [];

        // Filter by business access
        if (input.business) {
          if (!accessibleBusinesses.includes(input.business)) {
            throw new ORPCError("FORBIDDEN", {
              message: "You don't have access to this business",
            });
          }
          conditions.push(eq(serviceCategory.business, input.business));
        } else if (accessibleBusinesses.length === 1) {
          conditions.push(
            // biome-ignore lint/style/noNonNullAssertion: Auto-fix
            eq(serviceCategory.business, accessibleBusinesses[0]!)
          );
        } else if (accessibleBusinesses.length > 1) {
          // Show all accessible businesses
          conditions.push(
            or(
              ...accessibleBusinesses.map((b) =>
                eq(serviceCategory.business, b)
              )
            )
          );
        }

        // Active filter
        if (input.isActive !== undefined) {
          conditions.push(eq(serviceCategory.isActive, input.isActive));
        }

        const whereClause =
          conditions.length > 0 ? and(...conditions) : undefined;

        const categories = await db.query.serviceCategory.findMany({
          where: whereClause,
          orderBy: [
            asc(serviceCategory.sortOrder),
            asc(serviceCategory.displayName),
          ],
        });

        // Optionally include service count
        if (input.includeServiceCount) {
          const categoriesWithCount = await Promise.all(
            categories.map(async (category) => {
              const countResult = await db
                .select({ total: count() })
                .from(serviceCatalog)
                .where(
                  and(
                    eq(serviceCatalog.categoryId, category.id),
                    eq(serviceCatalog.isActive, true)
                  )
                );

              return {
                ...category,
                serviceCount: countResult[0]?.total ?? 0,
              };
            })
          );

          return { categories: categoriesWithCount };
        }

        return { categories };
      }),

    // Get single category by ID
    getById: staffProcedure
      .input(z.object({ id: z.string() }))
      .handler(async ({ input, context }) => {
        const category = await db.query.serviceCategory.findFirst({
          where: eq(serviceCategory.id, input.id),
        });

        if (!category) {
          throw new ORPCError("NOT_FOUND", {
            message: "Category not found",
          });
        }

        // Check business access
        if (!canAccessBusiness(context.staff, category.business)) {
          throw new ORPCError("FORBIDDEN", {
            message: "You don't have access to this category",
          });
        }

        return category;
      }),

    // Create new category (admin only)
    create: adminProcedure
      .input(createCategorySchema)
      .handler(async ({ input, context }) => {
        const [newCategory] = await db
          .insert(serviceCategory)
          .values({
            ...input,
            createdById: context.session.user.id,
          })
          .returning();

        return newCategory;
      }),

    // Update category (admin only)
    update: adminProcedure
      .input(updateCategorySchema)
      .handler(async ({ input }) => {
        const { id, ...updates } = input;

        const existing = await db.query.serviceCategory.findFirst({
          where: eq(serviceCategory.id, id),
        });

        if (!existing) {
          throw new ORPCError("NOT_FOUND", {
            message: "Category not found",
          });
        }

        const [updated] = await db
          .update(serviceCategory)
          .set(updates)
          .where(eq(serviceCategory.id, id))
          .returning();

        return updated;
      }),

    // Delete category (admin only)
    delete: adminProcedure
      .input(z.object({ id: z.string() }))
      .handler(async ({ input }) => {
        // Check if category has services
        const countResult = await db
          .select({ total: count() })
          .from(serviceCatalog)
          .where(eq(serviceCatalog.categoryId, input.id));

        const total = countResult[0]?.total ?? 0;

        if (total > 0) {
          throw new ORPCError("BAD_REQUEST", {
            message: "Cannot delete category with existing services",
          });
        }

        await db
          .delete(serviceCategory)
          .where(eq(serviceCategory.id, input.id));

        return { success: true };
      }),
  },

  // Services - Public/staff read, admin write
  services: {
    // List services with pagination and filters
    list: staffProcedure
      .input(listServicesSchema)
      .handler(async ({ input, context }) => {
        const accessibleBusinesses = getAccessibleBusinesses(context.staff);

        if (accessibleBusinesses.length === 0) {
          return {
            services: [],
            total: 0,
            page: input.page,
            limit: input.limit,
          };
        }

        // biome-ignore lint/suspicious/noEvolvingTypes: Auto-fix
        const conditions = [];

        // Filter by accessible businesses
        if (input.business) {
          if (!accessibleBusinesses.includes(input.business)) {
            throw new ORPCError("FORBIDDEN", {
              message: "You don't have access to this business",
            });
          }
          conditions.push(eq(serviceCatalog.business, input.business));
        } else if (accessibleBusinesses.length === 1) {
          conditions.push(
            // biome-ignore lint/style/noNonNullAssertion: Auto-fix
            eq(serviceCatalog.business, accessibleBusinesses[0]!)
          );
        } else if (accessibleBusinesses.length > 1) {
          conditions.push(
            or(
              ...accessibleBusinesses.map((b) => eq(serviceCatalog.business, b))
            )
          );
        }

        // Search filter
        if (input.search) {
          const searchTerm = `%${input.search}%`;
          conditions.push(
            or(
              ilike(serviceCatalog.displayName, searchTerm),
              ilike(serviceCatalog.name, searchTerm),
              ilike(serviceCatalog.description, searchTerm),
              ilike(serviceCatalog.shortDescription, searchTerm)
            )
          );
        }

        // Category filter
        if (input.categoryId) {
          conditions.push(eq(serviceCatalog.categoryId, input.categoryId));
        }

        // Active filter
        if (input.isActive !== undefined) {
          conditions.push(eq(serviceCatalog.isActive, input.isActive));
        }

        // Featured filter
        if (input.isFeatured !== undefined) {
          conditions.push(eq(serviceCatalog.isFeatured, input.isFeatured));
        }

        const whereClause =
          conditions.length > 0 ? and(...conditions) : undefined;

        // Get total count
        const countResult = await db
          .select({ total: count() })
          .from(serviceCatalog)
          .where(whereClause);

        const total = countResult[0]?.total ?? 0;

        // Get paginated results
        const offset = (input.page - 1) * input.limit;
        const orderColumn = serviceCatalog[input.sortBy];
        const orderDirection = input.sortOrder === "asc" ? asc : desc;

        const services = await db.query.serviceCatalog.findMany({
          where: whereClause,
          orderBy: [orderDirection(orderColumn)],
          limit: input.limit,
          offset,
          with: {
            category: true,
          },
        });

        return {
          services,
          total,
          page: input.page,
          limit: input.limit,
          totalPages: Math.ceil(total / input.limit),
        };
      }),

    // Get single service by ID
    getById: staffProcedure
      .input(z.object({ id: z.string() }))
      .handler(async ({ input, context }) => {
        const service = await db.query.serviceCatalog.findFirst({
          where: eq(serviceCatalog.id, input.id),
          with: {
            category: true,
          },
        });

        if (!service) {
          throw new ORPCError("NOT_FOUND", {
            message: "Service not found",
          });
        }

        // Check business access
        if (!canAccessBusiness(context.staff, service.business)) {
          throw new ORPCError("FORBIDDEN", {
            message: "You don't have access to this service",
          });
        }

        return service;
      }),

    // Get services by category
    getByCategory: staffProcedure
      .input(
        z.object({
          categoryId: z.string(),
          isActive: z.boolean().optional().default(true),
        })
      )
      .handler(async ({ input, context }) => {
        // First check if category exists and user has access
        const category = await db.query.serviceCategory.findFirst({
          where: eq(serviceCategory.id, input.categoryId),
        });

        if (!category) {
          throw new ORPCError("NOT_FOUND", {
            message: "Category not found",
          });
        }

        if (!canAccessBusiness(context.staff, category.business)) {
          throw new ORPCError("FORBIDDEN", {
            message: "You don't have access to this category",
          });
        }

        const conditions = [eq(serviceCatalog.categoryId, input.categoryId)];

        if (input.isActive !== undefined) {
          conditions.push(eq(serviceCatalog.isActive, input.isActive));
        }

        const services = await db.query.serviceCatalog.findMany({
          where: and(...conditions),
          orderBy: [
            asc(serviceCatalog.sortOrder),
            asc(serviceCatalog.displayName),
          ],
        });

        return { services, category };
      }),

    // Get featured services
    getFeatured: staffProcedure
      .input(
        z.object({
          business: z.enum(businessValues).optional(),
          limit: z.number().default(6),
        })
      )
      .handler(async ({ input, context }) => {
        const accessibleBusinesses = getAccessibleBusinesses(context.staff);

        const conditions = [
          eq(serviceCatalog.isActive, true),
          eq(serviceCatalog.isFeatured, true),
        ];

        // Filter by business
        if (input.business) {
          if (!accessibleBusinesses.includes(input.business)) {
            throw new ORPCError("FORBIDDEN", {
              message: "You don't have access to this business",
            });
          }
          conditions.push(eq(serviceCatalog.business, input.business));
        } else if (accessibleBusinesses.length === 1) {
          conditions.push(
            // biome-ignore lint/style/noNonNullAssertion: Auto-fix
            eq(serviceCatalog.business, accessibleBusinesses[0]!)
          );
        } else if (accessibleBusinesses.length > 1) {
          const businessFilter = or(
            ...accessibleBusinesses.map((b) => eq(serviceCatalog.business, b))
          );
          if (businessFilter) {
            conditions.push(businessFilter);
          }
        }

        const whereClause =
          conditions.length > 0 ? and(...conditions) : undefined;

        const services = await db.query.serviceCatalog.findMany({
          where: whereClause,
          orderBy: [
            asc(serviceCatalog.sortOrder),
            asc(serviceCatalog.displayName),
          ],
          limit: input.limit,
          with: {
            category: true,
          },
        });

        return { services };
      }),

    // Create new service (admin only)
    create: adminProcedure
      .input(createServiceSchema)
      .handler(async ({ input, context }) => {
        // Verify category exists and matches business
        const category = await db.query.serviceCategory.findFirst({
          where: eq(serviceCategory.id, input.categoryId),
        });

        if (!category) {
          throw new ORPCError("NOT_FOUND", {
            message: "Category not found",
          });
        }

        if (category.business !== input.business) {
          throw new ORPCError("BAD_REQUEST", {
            message: "Service business must match category business",
          });
        }

        const [newService] = await db
          .insert(serviceCatalog)
          .values({
            ...input,
            createdById: context.session.user.id,
          })
          .returning();

        return newService;
      }),

    // Update service (admin only)
    update: adminProcedure
      .input(updateServiceSchema)
      .handler(async ({ input }) => {
        const { id, categoryId, business, ...updates } = input;

        const existing = await db.query.serviceCatalog.findFirst({
          where: eq(serviceCatalog.id, id),
        });

        if (!existing) {
          throw new ORPCError("NOT_FOUND", {
            message: "Service not found",
          });
        }

        // If updating category, verify it exists and matches business
        if (categoryId) {
          const category = await db.query.serviceCategory.findFirst({
            where: eq(serviceCategory.id, categoryId),
          });

          if (!category) {
            throw new ORPCError("NOT_FOUND", {
              message: "Category not found",
            });
          }

          const finalBusiness = business || existing.business;
          if (category.business !== finalBusiness) {
            throw new ORPCError("BAD_REQUEST", {
              message: "Service business must match category business",
            });
          }
        }

        const [updated] = await db
          .update(serviceCatalog)
          .set({
            ...updates,
            categoryId: categoryId || existing.categoryId,
            business: business || existing.business,
          })
          .where(eq(serviceCatalog.id, id))
          .returning();

        return updated;
      }),

    // Delete service (admin only)
    delete: adminProcedure
      .input(z.object({ id: z.string() }))
      .handler(async ({ input }) => {
        // TODO: Check if service is referenced in any matters
        // For now, allow deletion

        await db.delete(serviceCatalog).where(eq(serviceCatalog.id, input.id));

        return { success: true };
      }),

    // Quick search for autocomplete
    search: staffProcedure
      .input(
        z.object({
          query: z.string().min(1),
          business: z.enum(businessValues).optional(),
          limit: z.number().default(10),
        })
      )
      .handler(async ({ input, context }) => {
        const accessibleBusinesses = getAccessibleBusinesses(context.staff);
        const searchTerm = `%${input.query}%`;

        const conditions = [
          eq(serviceCatalog.isActive, true),
          or(
            ilike(serviceCatalog.displayName, searchTerm),
            ilike(serviceCatalog.name, searchTerm)
          ),
        ];

        // Filter by business
        if (input.business) {
          if (!accessibleBusinesses.includes(input.business)) {
            throw new ORPCError("FORBIDDEN", {
              message: "You don't have access to this business",
            });
          }
          conditions.push(eq(serviceCatalog.business, input.business));
        } else if (accessibleBusinesses.length === 1) {
          conditions.push(
            // biome-ignore lint/style/noNonNullAssertion: Auto-fix
            eq(serviceCatalog.business, accessibleBusinesses[0]!)
          );
        } else if (accessibleBusinesses.length > 1) {
          conditions.push(
            or(
              ...accessibleBusinesses.map((b) => eq(serviceCatalog.business, b))
            )
          );
        }

        const results = await db
          .select({
            id: serviceCatalog.id,
            displayName: serviceCatalog.displayName,
            shortDescription: serviceCatalog.shortDescription,
            business: serviceCatalog.business,
            categoryId: serviceCatalog.categoryId,
            basePrice: serviceCatalog.basePrice,
            maxPrice: serviceCatalog.maxPrice,
            pricingType: serviceCatalog.pricingType,
          })
          .from(serviceCatalog)
          .where(and(...conditions))
          .orderBy(asc(serviceCatalog.sortOrder))
          .limit(input.limit);

        return results;
      }),

    // Get services grouped by category for wizard
    getForWizard: staffProcedure
      .input(
        z.object({
          business: z.enum(["GCMC", "KAJ"]),
        })
      )
      .handler(async ({ input, context }) => {
        const accessibleBusinesses = getAccessibleBusinesses(context.staff);

        // Check business access
        if (!accessibleBusinesses.includes(input.business)) {
          throw new ORPCError("FORBIDDEN", {
            message: "You don't have access to this business",
          });
        }

        // Fetch all active services with their categories
        const services = await db.query.serviceCatalog.findMany({
          where: and(
            eq(serviceCatalog.business, input.business),
            eq(serviceCatalog.isActive, true)
          ),
          orderBy: [
            asc(serviceCatalog.sortOrder),
            asc(serviceCatalog.displayName),
          ],
          with: {
            category: true,
          },
        });

        // Group services by category
        const grouped: Record<
          string,
          {
            categoryId: string;
            categoryName: string;
            categoryDisplayName: string;
            categoryDescription: string;
            services: typeof services;
          }
        > = {};

        for (const service of services) {
          if (!service.category) continue;

          const categoryKey = service.category.name;

          if (!grouped[categoryKey]) {
            grouped[categoryKey] = {
              categoryId: service.category.id,
              categoryName: service.category.name,
              categoryDisplayName: service.category.displayName,
              categoryDescription: service.category.description || "",
              services: [],
            };
          }

          grouped[categoryKey].services.push(service);
        }

        return grouped;
      }),
  },
};
