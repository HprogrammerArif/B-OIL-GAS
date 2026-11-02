/// <reference types="node" />
import * as mockNodeCrypto from "node:crypto";
import mockAsyncStorage from "@react-native-async-storage/async-storage/jest/async-storage-mock";

jest.mock("@react-native-async-storage/async-storage", () => mockAsyncStorage);

jest.mock("expo-crypto", () => ({
  CryptoDigestAlgorithm: { SHA256: "SHA-256" },
  randomUUID: () => mockNodeCrypto.randomUUID(),
  getRandomBytes: (size: number) => new Uint8Array(mockNodeCrypto.randomBytes(size)),
  digestStringAsync: async (_algorithm: string, value: string) =>
    mockNodeCrypto.createHash("sha256").update(value).digest("hex"),
}));

jest.mock("expo-secure-store", () => {
  const mockStore = new Map<string, string>();
  return {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 6,
    getItemAsync: async (key: string) => mockStore.get(key) ?? null,
    setItemAsync: async (key: string, value: string) => {
      mockStore.set(key, value);
    },
    deleteItemAsync: async (key: string) => {
      mockStore.delete(key);
    },
  };
});

jest.mock("expo-location", () => ({
  Accuracy: { Balanced: 3, High: 4 },
  requestForegroundPermissionsAsync: async () => ({ status: "granted", granted: true }),
  getForegroundPermissionsAsync: async () => ({ status: "granted", granted: true }),
  getCurrentPositionAsync: async () => ({
    coords: { latitude: 23.7808, longitude: 90.4152, accuracy: 12 },
    timestamp: Date.now(),
    mocked: false,
  }),
}));
