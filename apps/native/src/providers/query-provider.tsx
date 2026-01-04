import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import type { ReactNode } from "react";
import { mmkvStorage } from "../lib/storage";

/**
 * Query client with offline-friendly defaults.
 * Data is cached for 24 hours and returned immediately while refetching.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes - data considered fresh
      gcTime: 1000 * 60 * 60 * 24, // 24 hours - keep in cache
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
      networkMode: "offlineFirst", // Return cached data immediately
    },
    mutations: {
      networkMode: "offlineFirst",
      retry: 3,
    },
  },
});

/**
 * Persister for offline storage using MMKV.
 * Synchronously persists query cache to disk.
 */
const persister = createSyncStoragePersister({
  storage: mmkvStorage,
  key: "gk-nexus-query-cache",
});

type QueryProviderProps = {
  children: ReactNode;
};

/**
 * Query provider with offline persistence.
 * Wraps the app to provide TanStack Query with MMKV-backed caching.
 */
export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 1000 * 60 * 60 * 24, // 24 hours
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => {
            // Only persist successful queries with data
            return query.state.status === "success" && !!query.state.data;
          },
        },
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}

// biome-ignore lint/performance/noBarrelFile: Intentional re-export for convenience
export { QueryClientProvider } from "@tanstack/react-query";
