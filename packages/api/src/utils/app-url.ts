/**
 * Get Application URL for generating links in emails and other places.
 *
 * This function safely gets the application URL, avoiding the issue where
 * CORS_ORIGIN might be set to "*" (which is invalid for URLs).
 *
 * Priority:
 * 1. APP_URL environment variable (recommended for production)
 * 2. CORS_ORIGIN if it's a valid URL (not "*")
 * 3. Default fallback for development
 *
 * Usage:
 * ```
 * import { getAppUrl } from "../utils/app-url";
 * const appUrl = getAppUrl();
 * const setupUrl = `${appUrl}/staff/setup-password?token=${token}`;
 * ```
 */
export function getAppUrl(): string {
  // Priority 1: Use APP_URL if explicitly set
  if (process.env.APP_URL) {
    return process.env.APP_URL;
  }

  // Priority 2: Use CORS_ORIGIN if it's a valid URL (not "*")
  const corsOrigin = process.env.CORS_ORIGIN;
  if (corsOrigin && corsOrigin !== "*" && corsOrigin.startsWith("http")) {
    return corsOrigin;
  }

  // Priority 3: Fallback for development
  return "http://localhost:5173";
}
