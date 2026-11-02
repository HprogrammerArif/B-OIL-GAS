import { Platform } from "react-native";
import * as Crypto from "expo-crypto";
import * as Device from "expo-device";
import { secure } from "./storage/secure";
import { SecureKeys } from "./storage/keys";

let cachedId: string | null = null;

/** Stable per-install device id (doc 03 `X-Device-Id`), generated once and kept in SecureStore. */
export async function getDeviceId(): Promise<string> {
  if (cachedId) return cachedId;
  const stored = await secure.get(SecureKeys.deviceId);
  if (stored) {
    cachedId = stored;
    return stored;
  }
  const id = Crypto.randomUUID();
  await secure.set(SecureKeys.deviceId, id);
  cachedId = id;
  return id;
}

export const clientPlatform: "ANDROID" | "IOS" = Platform.OS === "ios" ? "IOS" : "ANDROID";

export function deviceName(): string {
  return [Device.manufacturer, Device.modelName].filter(Boolean).join(" ") || clientPlatform;
}

export function newIdempotencyKey(): string {
  return Crypto.randomUUID();
}
