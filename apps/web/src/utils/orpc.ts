import type { AppRouterClient } from "@SYNERGY-GY/api/routers/index";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { QueryCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      toast.error(`Error: ${error.message}`, {
        action: {
          label: "retry",
          onClick: () => {
            queryClient.invalidateQueries();
          },
        },
      });
    },
  }),
});

// RPCLink requires an absolute URL, not a relative one
// Pass a function to dynamically resolve URL at request time
// This ensures proper URL construction in browser environment
const getServerUrl = (): string => {
  const viteServerUrl = import.meta.env.VITE_SERVER_URL;

  // In production or when VITE_SERVER_URL is not set/localhost
  // use the browser's origin for reverse proxy compatibility
  if (!viteServerUrl || viteServerUrl.includes("localhost")) {
    return `${window.location.origin}/rpc`;
  }

  return `${viteServerUrl}/rpc`;
};

export const link = new RPCLink({
  // Pass function to defer URL resolution until request time
  url: getServerUrl,
  fetch(_url, options) {
    // Normalize RPC paths: convert dot notation to slash notation
    // e.g., /rpc/settings.getStaffStatus → /rpc/settings/getStaffStatus
    // Only transform dots in the pathname, not in query parameters or fragments
    const urlString = typeof _url === "string" ? _url : _url.toString();

    // Debug logging (remove in production)
    console.log("[oRPC] fetch called with URL:", urlString);

    try {
      const urlObj = new URL(urlString, window.location.origin);
      const originalPathname = urlObj.pathname;

      // Only normalize if pathname contains /rpc/ and has dots
      if (
        urlObj.pathname.startsWith("/rpc/") &&
        urlObj.pathname.includes(".")
      ) {
        urlObj.pathname = urlObj.pathname.replace(/\./g, "/");
        console.log(
          "[oRPC] Normalized path:",
          originalPathname,
          "->",
          urlObj.pathname
        );
      }

      const finalUrl = urlObj.toString();
      console.log("[oRPC] Final URL:", finalUrl);

      return fetch(finalUrl, {
        ...options,
        credentials: "include",
      });
    } catch (e) {
      // Fallback: if URL parsing fails, use original URL
      console.error("[oRPC] URL parsing error:", e);
      return fetch(urlString, {
        ...options,
        credentials: "include",
      });
    }
  },
});

export const client: AppRouterClient = createORPCClient(link);

export const orpc = createTanstackQueryUtils(client);
