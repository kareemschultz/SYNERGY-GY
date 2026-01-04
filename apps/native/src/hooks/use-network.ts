import NetInfo from "@react-native-community/netinfo";
import { onlineManager } from "@tanstack/react-query";
import { useEffect, useState } from "react";

/**
 * Hook to monitor network connectivity status.
 * Also syncs with TanStack Query's online manager for proper offline behavior.
 *
 * @returns Object with isOnline boolean and isConnected (null if unknown)
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  useEffect(() => {
    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = !!state.isConnected && !!state.isInternetReachable;
      setIsOnline(online);
      setIsConnected(state.isConnected);

      // Sync with TanStack Query
      onlineManager.setOnline(online);
    });

    // Get initial state
    NetInfo.fetch().then((state) => {
      const online = !!state.isConnected && !!state.isInternetReachable;
      setIsOnline(online);
      setIsConnected(state.isConnected);
      onlineManager.setOnline(online);
    });

    return () => unsubscribe();
  }, []);

  return { isOnline, isConnected };
}
