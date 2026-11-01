import * as SecureStore from "expo-secure-store";
import { Storage } from "redux-persist";

const secureStorage: Storage = {
  getItem: async (key: string) => {
    return await SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string) => {
    return await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string) => {
    return await SecureStore.deleteItemAsync(key);
  },
};

export default secureStorage;
