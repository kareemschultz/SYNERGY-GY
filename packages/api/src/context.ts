import { auth } from "@SYNERGY-GY/auth";
import { db, staff } from "@SYNERGY-GY/db";
import { eq } from "drizzle-orm";
import type { Context as HonoContext } from "hono";

export type CreateContextOptions = {
  context: HonoContext;
};

// Staff type from schema
export type Staff = typeof staff.$inferSelect;

export async function createContext({ context }: CreateContextOptions) {
  const session = await auth.api.getSession({
    headers: context.req.raw.headers,
  });

  // Fetch staff profile if user is authenticated
  let staffProfile: Staff | null = null;
  if (session?.user?.id) {
    const staffResult = await db
      .select()
      .from(staff)
      .where(eq(staff.userId, session.user.id))
      .limit(1);
    staffProfile = staffResult[0] ?? null;
  }

  return {
    session,
    staff: staffProfile,
    req: context.req,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
