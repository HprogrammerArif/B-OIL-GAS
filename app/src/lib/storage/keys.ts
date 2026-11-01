/** SecureStore keys (Keychain / Android Keystore). Values must stay well under 2 KB. */
export const SecureKeys = {
  refreshToken: "oneops_refresh_token",
  deviceId: "oneops_device_id",
  rememberedIdentifier: "oneops_identifier",
} as const;

/** AsyncStorage keys for non-secret data. */
export const AsyncKeys = {
  mockDb: "oneops.mock.db.v1",
} as const;
