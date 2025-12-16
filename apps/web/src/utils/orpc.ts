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

  // Pass the function reference as per @orpc/client documentation for dynamic URL resolution

  url: getServerUrl,

  fetch(_url, options) {

    // If _url is a function (as passed by RPCLink), execute it to get the actual URL string

    const resolvedUrl = typeof _url === "function" ? _url() : _url;



    // Now resolvedUrl should be a string (or a URL object)

    const urlString = typeof resolvedUrl === "string" ? resolvedUrl : resolvedUrl.toString();



    try {

      const urlObj = new URL(urlString, window.location.origin);



      // Only normalize if pathname contains /rpc/ and has dots

      if (

        urlObj.pathname.startsWith("/rpc/") &&

        urlObj.pathname.includes(".")

      ) {

        urlObj.pathname = urlObj.pathname.replace(/\./g, "/");

      }



      const finalUrl = urlObj.toString();



      return fetch(finalUrl, {

        ...options,

        credentials: "include",

      });

    } catch (e) {

      // Fallback: if URL parsing fails, use original resolved URL

      return fetch(resolvedUrl, {

        ...options,

        credentials: "include",

      });

    }

  },

});

export const client: AppRouterClient = createORPCClient(link);

export const orpc = createTanstackQueryUtils(client);
