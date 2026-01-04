import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import Constants from "expo-constants";
import { getAuthToken, getPortalToken } from "./auth";

// In production, import the actual router type from @SYNERGY-GY/api
// biome-ignore lint/suspicious/noExplicitAny: oRPC clients require any for dynamic method chaining
type AppClient = any;

/**
 * API base URL from environment or Expo constants.
 * Falls back to localhost for development.
 */
const API_URL =
  Constants.expoConfig?.extra?.apiUrl ||
  process.env.EXPO_PUBLIC_API_URL ||
  "http://localhost:3000";

/**
 * Creates an authenticated RPC link for the oRPC client.
 * Handles token injection and URL path normalization.
 *
 * @param isPortal - Whether to use portal auth (client) or staff auth
 */
export const createAuthenticatedLink = (isPortal = false) => {
  return new RPCLink({
    url: `${API_URL}/rpc`,
    fetch: async (url: string | URL | Request, options?: RequestInit) => {
      // Get the appropriate token based on user type
      const token = isPortal ? await getPortalToken() : await getAuthToken();

      const headers = new Headers(options?.headers);
      headers.set("Content-Type", "application/json");

      // Inject auth token
      // Staff uses Bearer token, Portal uses x-portal-session header
      if (token) {
        if (isPortal) {
          headers.set("x-portal-session", token);
        } else {
          headers.set("Authorization", `Bearer ${token}`);
        }
      }

      // Normalize RPC paths: convert dots to slashes
      // oRPC uses dots for path separators, but server expects slashes
      let finalUrl = url instanceof Request ? url.url : url.toString();
      try {
        const urlObj = new URL(finalUrl);
        if (
          urlObj.pathname.startsWith("/rpc/") &&
          urlObj.pathname.includes(".")
        ) {
          urlObj.pathname = urlObj.pathname.replace(/\./g, "/");
        }
        finalUrl = urlObj.toString();
      } catch {
        // Keep original URL if parsing fails
      }

      return fetch(finalUrl, {
        ...options,
        method: "POST",
        headers,
      });
    },
  });
};

// ─────────────────────────────────────────────────
// oRPC Clients
// ─────────────────────────────────────────────────

/**
 * Staff client - uses better-auth bearer token.
 * Use this for all staff-facing features.
 */
export const staffLink = createAuthenticatedLink(false);
export const staffClient: AppClient = createORPCClient(staffLink);

/**
 * Portal client - uses portal session token.
 * Use this for all client portal features.
 */
export const portalLink = createAuthenticatedLink(true);
export const portalClient: AppClient = createORPCClient(portalLink);

// ─────────────────────────────────────────────────
// Response Helpers
// ─────────────────────────────────────────────────

/**
 * Unwrap oRPC response envelope.
 * oRPC v1.12+ wraps responses in { json: T } format.
 *
 * @example
 * const { data: dataRaw } = useQuery({...});
 * const data = unwrapOrpc<MyType>(dataRaw);
 */
export function unwrapOrpc<T>(response: unknown): T {
  if (
    response &&
    typeof response === "object" &&
    "json" in response &&
    response.json !== undefined
  ) {
    return response.json as T;
  }
  return response as T;
}

/**
 * API URL for direct fetch calls (file uploads, etc.)
 */
export { API_URL };
