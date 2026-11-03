import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import type { Storage } from "redux-persist";

const OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

/** Web has no SecureStore; tokens stay in memory only (never localStorage). Also used during static/SSR render. */
const memory = new Map<string, string>();
const native = Platform.OS !== "web";

export const secure = {
  get: async (key: string) => (native ? SecureStore.getItemAsync(key, OPTIONS) : (memory.get(key) ?? null)),
  set: async (key: string, value: string) => {
    if (native) await SecureStore.setItemAsync(key, value, OPTIONS);
    else memory.set(key, value);
  },
  remove: async (key: string) => {
    if (native) await SecureStore.deleteItemAsync(key, OPTIONS);
    else memory.delete(key);
  },
};

/** redux-persist adapter for the compact `auth` slice only (SecureStore keys cannot contain ':'). */
export const securePersistStorage: Storage = {
  getItem: (key: string) => secure.get(key),
  setItem: (key: string, value: string) => secure.set(key, value),
  removeItem: (key: string) => secure.remove(key),
};

/** Static web export renders routes in Node where `window` does not exist; persist becomes a no-op there. */
export function ssrSafeStorage(real: Storage): Storage {
  if (typeof window !== "undefined" || Platform.OS !== "web") return real;
  return { getItem: async () => null, setItem: async () => undefined, removeItem: async () => undefined };
}
