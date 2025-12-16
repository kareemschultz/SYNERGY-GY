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
// This ensures proper URL construction in browser environment
const getServerUrl = (): string => {
  const viteServerUrl = import.meta.env.VITE_SERVER_URL;

  // Handle non-browser environments (SSR, testing, build)
  if (typeof window === "undefined") {
    return viteServerUrl || "http://localhost:3000/rpc";
  }

  // In production or when VITE_SERVER_URL is not set/localhost
  // use the browser's origin for reverse proxy compatibility
  if (!viteServerUrl || viteServerUrl.includes("localhost")) {
    return `${window.location.origin}/rpc`;
  }

  return `${viteServerUrl}/rpc`;
};

export const link = new RPCLink({
  // Call getServerUrl() to pass a resolved URL string
  url: getServerUrl(),
  async fetch(_url, options) {
    // Extract URL string and request body/headers
    // RPCLink may pass a Request object, URL object, or string
    let urlString: string;
    let body: BodyInit | null | undefined = options?.body;
    let headers: HeadersInit | undefined = options?.headers;

    if (typeof _url === "string") {
      urlString = _url;
    } else if (_url instanceof Request) {
      // Request object - extract URL, body, and headers from it
      urlString = _url.url;
      // When Request object is passed, body and headers are inside it, not in options
      if (!body) {
        body = _url.body;
      }
      if (!headers) {
        headers = _url.headers;
      }
    } else if (_url instanceof URL) {
      urlString = _url.toString();
    } else if (typeof _url === "function") {
      urlString = (_url as () => string)();
    } else {
      urlString = String(_url);
    }

    try {
      const urlObj = new URL(urlString, window.location.origin);

      // Normalize RPC paths: convert dot notation to slash notation
      // e.g., /rpc/settings.getStaffStatus → /rpc/settings/getStaffStatus
      if (
        urlObj.pathname.startsWith("/rpc/") &&
        urlObj.pathname.includes(".")
      ) {
        urlObj.pathname = urlObj.pathname.replace(/\./g, "/");
      }

      const finalUrl = urlObj.toString();

      // Merge options with extracted body/headers, force POST method
      return fetch(finalUrl, {
        ...options,
        body,
        headers,
        method: "POST",
        credentials: "include",
      });
    } catch (e) {
      console.error("[oRPC] URL parsing error:", e);
      return fetch(urlString, {
        ...options,
        body,
        headers,
        method: "POST",
        credentials: "include",
      });
    }
  },
});

export const client: AppRouterClient = createORPCClient(link);

export const orpc = createTanstackQueryUtils(client);
