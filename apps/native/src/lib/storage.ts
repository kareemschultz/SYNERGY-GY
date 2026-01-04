import { MMKV } from "react-native-mmkv";

/**
 * MMKV storage instance for fast synchronous access.
 * Used for TanStack Query persistence and general app storage.
 *
 * MMKV is ~30x faster than AsyncStorage because it's synchronous
 * and uses memory-mapped files for storage.
 */
export const storage = new MMKV();

/**
 * Wrapper for TanStack Query persist storage interface.
 * MMKV is synchronous, which is required by createSyncStoragePersister.
 */
export const mmkvStorage = {
  setItem: (key: string, value: string): void => {
    storage.set(key, value);
  },
  getItem: (key: string): string | null => storage.getString(key) ?? null,
  removeItem: (key: string): void => {
    storage.delete(key);
  },
};

/**
 * App-specific storage helpers
 */
export const appStorage = {
  get: <T>(key: string): T | null => {
    const value = storage.getString(key);
    if (!value) {
      return null;
    }
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  },

  set: <T>(key: string, value: T): void => {
    storage.set(key, JSON.stringify(value));
  },

  remove: (key: string): void => {
    storage.delete(key);
  },

  clear: (): void => {
    storage.clearAll();
  },
};
