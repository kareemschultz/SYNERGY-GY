import type { AppRouterClient } from "@SYNERGY-GY/api/routers/index";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { QueryCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds - data considered fresh
      gcTime: 5 * 60 * 1000, // 5 minutes - garbage collection time
      refetchOnWindowFocus: true, // Refetch when tab gains focus
      retry: 1, // Retry failed requests once
    },
  },
  queryCache: new QueryCache({
    onError: (error) => {
      toast.error(`Error: ${error.message}`, {
        action: {
          label: "Retry",
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
    // Handle Request objects specially - extract URL and body
    if (_url instanceof Request) {
      let finalUrl = _url.url;

      // Normalize RPC paths: convert dot notation to slash notation
      try {
        const urlObj = new URL(finalUrl, window.location.origin);
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

      // Read the body as text to avoid streaming body issues
      // This prevents "duplex member must be specified" errors
      const bodyText = await _url.text();

      // Create fetch with extracted data
      return fetch(finalUrl, {
        method: "POST",
        headers: _url.headers,
        body: bodyText || undefined,
        credentials: "include",
      });
    }

    // Handle URL string or URL object
    let urlString: string;
    if (typeof _url === "string") {
      urlString = _url;
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
      if (
        urlObj.pathname.startsWith("/rpc/") &&
        urlObj.pathname.includes(".")
      ) {
        urlObj.pathname = urlObj.pathname.replace(/\./g, "/");
      }

      return fetch(urlObj.toString(), {
        ...options,
        method: "POST",
        credentials: "include",
      });
    } catch (e) {
      console.error("[oRPC] URL parsing error:", e);
      return fetch(urlString, {
        ...options,
        method: "POST",
        credentials: "include",
      });
    }
  },
});

export const client: AppRouterClient = createORPCClient(link);

export const orpc = createTanstackQueryUtils(client);
