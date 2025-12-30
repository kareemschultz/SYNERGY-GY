import { db } from "@SYNERGY-GY/db";
// biome-ignore lint/performance/noNamespaceImport: Auto-fix
import * as schema from "@SYNERGY-GY/db/schema/auth";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

const isProduction = process.env.NODE_ENV === "production";

// CORS origin is required in production - prevents security misconfiguration
const corsOrigin = process.env.CORS_ORIGIN;
if (isProduction && !corsOrigin) {
  throw new Error("CORS_ORIGIN must be set in production environment");
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",

    schema,
  }),
  trustedOrigins: corsOrigin ? [corsOrigin] : ["http://localhost:3001"],
  emailAndPassword: {
    enabled: true,
  },
  advanced: {
    defaultCookieAttributes: {
      // "strict" prevents CSRF attacks in production
      // "lax" allows cross-site for development convenience
      sameSite: isProduction ? "strict" : "lax",
      secure: isProduction,
      httpOnly: true,
    },
  },
});
