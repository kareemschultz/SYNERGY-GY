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
    const url = typeof _url === "string" ? _url : _url.toString();
    const normalizedUrl = url.replace(/\.(\w)/g, "/$1");

    return fetch(normalizedUrl, {
      ...options,
      credentials: "include",
    });
  },
});

export const client: AppRouterClient = createORPCClient(link);

export const orpc = createTanstackQueryUtils(client);
