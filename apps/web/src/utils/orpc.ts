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

// Use relative URL in production for reverse proxy compatibility
// In development, use VITE_SERVER_URL if set, otherwise default to relative
const getServerUrl = () => {
  const viteServerUrl = import.meta.env.VITE_SERVER_URL;

  // If VITE_SERVER_URL is not set or is localhost, use relative URL
  // This works with reverse proxies where frontend and backend share the same domain
  if (!viteServerUrl || viteServerUrl.includes("localhost")) {
    return "/rpc";
  }

  return `${viteServerUrl}/rpc`;
};

export const link = new RPCLink({
  url: getServerUrl(),
  fetch(_url, options) {
    // Normalize RPC paths: convert dot notation to slash notation
    // e.g., /rpc/settings.getStaffStatus → /rpc/settings/getStaffStatus
    // Only transform dots in the pathname, not in query parameters or fragments
    const urlString = typeof _url === "string" ? _url : _url.toString();

    try {
      const urlObj = new URL(urlString, window.location.origin);

      // Only normalize if pathname contains /rpc/ and has dots
      if (
        urlObj.pathname.startsWith("/rpc/") &&
        urlObj.pathname.includes(".")
      ) {
        urlObj.pathname = urlObj.pathname.replace(/\./g, "/");
      }

      return fetch(urlObj.toString(), {
        ...options,
        credentials: "include",
      });
    } catch {
      // Fallback: if URL parsing fails, use original URL
      return fetch(urlString, {
        ...options,
        credentials: "include",
      });
    }
  },
});

export const client: AppRouterClient = createORPCClient(link);

export const orpc = createTanstackQueryUtils(client);
