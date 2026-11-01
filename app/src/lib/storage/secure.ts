import * as SecureStore from "expo-secure-store";
import type { Storage } from "redux-persist";

const OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export const secure = {
  get: (key: string) => SecureStore.getItemAsync(key, OPTIONS),
  set: (key: string, value: string) => SecureStore.setItemAsync(key, value, OPTIONS),
  remove: (key: string) => SecureStore.deleteItemAsync(key, OPTIONS),
};

/** redux-persist adapter for the compact `auth` slice only (SecureStore keys cannot contain ':'). */
export const securePersistStorage: Storage = {
  getItem: (key: string) => secure.get(key),
  setItem: (key: string, value: string) => secure.set(key, value),
  removeItem: (key: string) => secure.remove(key),
};
