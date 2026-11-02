import AsyncStorage from "@react-native-async-storage/async-storage";
import { createTransform, type PersistConfig } from "redux-persist";
import { securePersistStorage } from "@/lib/storage/secure";
import type { AuthState } from "@/redux/slices/auth.slice";
import type { UiState } from "@/redux/slices/ui.slice";

/** Queries a field user may read offline (doc 05 §4.5) — plus permissions so gating works offline. */
export const OFFLINE_READ_ENDPOINTS = new Set([
  "getMe",
  "getMyPermissions",
  "getNotices",
  "getNotice",
  "getInbox",
  "getApproval",
  "getMyTrips",
  "getTrip",
  "getTodayAttendance",
  "getGeofences",
  "getMySeat",
  "getTodayVisits",
  "getMyDashboard",
]);

interface PersistedQuery {
  status?: string;
  endpointName?: string;
}

interface ApiSliceShape {
  queries?: Record<string, PersistedQuery | undefined>;
  [key: string]: unknown;
}

const apiWhitelistTransform = createTransform<ApiSliceShape, ApiSliceShape>(
  (inbound, key) => {
    if (key !== "queries") return inbound;
    const queries = inbound as unknown as Record<string, PersistedQuery | undefined>;
    return Object.fromEntries(
      Object.entries(queries).filter(
        ([, q]) => q?.status === "fulfilled" && !!q.endpointName && OFFLINE_READ_ENDPOINTS.has(q.endpointName),
      ),
    ) as unknown as ApiSliceShape;
  },
  (outbound) => outbound,
);

/** SecureStore keys may not contain ':' so the prefix uses '_' (doc 05 §4.1). */
export const authPersistConfig: PersistConfig<AuthState> = {
  key: "auth",
  keyPrefix: "persist_",
  storage: securePersistStorage,
  blacklist: ["accessToken", "accessTokenExpiresAt", "locked"],
};

export const uiPersistConfig: PersistConfig<UiState> = {
  key: "ui",
  storage: AsyncStorage,
};

export const apiPersistConfig: PersistConfig<ApiSliceShape> = {
  key: "baseApi",
  storage: AsyncStorage,
  whitelist: ["queries", "provided"],
  transforms: [apiWhitelistTransform],
  throttle: 1000,
};
