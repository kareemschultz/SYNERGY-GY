import { DEFAULT_TAGS, db, tag } from "@SYNERGY-GY/db";
import { ORPCError } from "@orpc/server";
import { asc, eq, ilike, isNull, or } from "drizzle-orm";
import { z } from "zod";
import {
  adminProcedure,
  getAccessibleBusinesses,
  staffProcedure,
} from "../index";

// Tags Router
export const tagsRouter = {
  // List all tags (with optional search)
  list: staffProcedure
    .input(
      z.object({
        search: z.string().optional(),
        business: z.enum(["GCMC", "KAJ"]).optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const accessibleBusinesses = getAccessibleBusinesses(context.staff);

      // Build conditions
      const conditions = [];

      // Filter by search
      if (input.search) {
        conditions.push(ilike(tag.name, `%${input.search}%`));
      }

      // Filter by business - show tags that are null (both) or match accessible businesses
      if (input.business) {
        conditions.push(
          or(eq(tag.business, input.business), isNull(tag.business))
        );
      } else {
        // Show all accessible business tags + shared tags
        const businessConditions = accessibleBusinesses.map((b) =>
          eq(tag.business, b)
        );
        conditions.push(or(isNull(tag.business), ...businessConditions));
      }

      const tags = await db.query.tag.findMany({
        where: conditions.length > 0 ? or(...conditions) : undefined,
        orderBy: [asc(tag.name)],
      });

      return tags;
    }),

  // Create a new tag
  create: staffProcedure
    .input(
      z.object({
        name: z.string().min(1, "Tag name is required").max(50),
        color: z
          .string()
          .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color")
          .optional(),
        business: z.enum(["GCMC", "KAJ"]).nullish(),
      })
    )
    .handler(async ({ input, context }) => {
      // Check if tag already exists
      const existing = await db.query.tag.findFirst({
        where: eq(tag.name, input.name),
      });

      if (existing) {
        throw new ORPCError("CONFLICT", {
          message: "A tag with this name already exists",
        });
      }

      const [newTag] = await db
        .insert(tag)
        .values({
          name: input.name,
          color: input.color || "#6B7280", // Default gray
          business: input.business || null,
          createdById: context.session.user.id,
        })
        .returning();

      return newTag;
    }),

  // Delete a tag (admin only)
  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      const existing = await db.query.tag.findFirst({
        where: eq(tag.id, input.id),
      });

      if (!existing) {
        throw new ORPCError("NOT_FOUND", {
          message: "Tag not found",
        });
      }

      await db.delete(tag).where(eq(tag.id, input.id));

      return { success: true };
    }),

  // Seed default tags (admin only, one-time setup)
  seed: adminProcedure.handler(async ({ context }) => {
    const results = {
      created: 0,
      skipped: 0,
      tags: [] as string[],
    };

    for (const defaultTag of DEFAULT_TAGS) {
      // Check if exists
      const existing = await db.query.tag.findFirst({
        where: eq(tag.name, defaultTag.name),
      });

      if (existing) {
        results.skipped++;
        continue;
      }

      await db.insert(tag).values({
        name: defaultTag.name,
        color: defaultTag.color,
        business: null, // Available for both businesses
        createdById: context.session.user.id,
      });

      results.created++;
      results.tags.push(defaultTag.name);
    }

    return results;
  }),
};
