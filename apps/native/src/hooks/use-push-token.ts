import { useEffect, useState } from "react";
import { registerForPushNotificationsAsync } from "../lib/notifications";
import { appStorage } from "../lib/storage";

const PUSH_TOKEN_KEY = "gk_push_token";

/**
 * Hook to register for push notifications and get the token.
 * Caches the token in MMKV storage to avoid re-registering.
 *
 * @returns Object with token string and loading state
 */
export function usePushToken() {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function getToken() {
      try {
        // Check for cached token first
        const cachedToken = appStorage.get<string>(PUSH_TOKEN_KEY);
        if (cachedToken) {
          setToken(cachedToken);
          setIsLoading(false);
          return;
        }

        // Register for push notifications
        const pushToken = await registerForPushNotificationsAsync();
        if (pushToken) {
          setToken(pushToken);
          appStorage.set(PUSH_TOKEN_KEY, pushToken);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        console.error("Error getting push token:", err);
      } finally {
        setIsLoading(false);
      }
    }

    getToken();
  }, []);

  return { token, isLoading, error };
}

/**
 * Clear the cached push token (call when user logs out).
 */
export function clearPushToken(): void {
  appStorage.remove(PUSH_TOKEN_KEY);
}
