// src/api/baseApi.ts
import {
  createApi,
  fetchBaseQuery,
  retry,
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { logout, updateToken } from "../features/auth/authSlice";
import Toast from "react-native-toast-message"; // or your toast library
import { RootState } from "../store";
import { logger } from "@/lib/logger";

// EXPO_PUBLIC_API_URL must always be set — in dev via .env.local, in production via your build config.
const API_URL = (() => {
  const url = process.env.EXPO_PUBLIC_API_URL;
  if (!url) {
    throw new Error(
      "[baseApi] EXPO_PUBLIC_API_URL is not set. Copy .env.example to .env.local and set it to your backend URL.",
    );
  }
  return url.replace(/"/g, "").replace(/\/$/, "");
})();
export const baseUrl = API_URL;
const baseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  timeout: 15000, // 15 seconds timeout
  credentials: "include",
  prepareHeaders: (headers, { getState, endpoint }) => {
    // Skip token for public endpoints
    const skipAuth = [
      "login",
      "register",
      "refreshToken",
      "verify-email",
      "confirm",
      "legal-privacy/",
      "submitSupportForm",
    ].includes(endpoint);
    if (skipAuth) return headers;

    const token = (getState() as RootState).auth.token;
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  const requestUrl = typeof args === "string" ? args : args.url;
  logger.log(`[RTK Query] 📡 Requesting: ${API_URL}/${requestUrl}`);

  let result = await baseQuery(args, api, extraOptions);

  // Check if this is an approve/reject endpoint
  const isApproveRejectEndpoint = requestUrl?.includes("/expenses/approve/");
  const is403Error = result.error?.status === 403;

  if (result.error) {
    if (!(isApproveRejectEndpoint && is403Error)) {
      logger.log(`[RTK Query] ❌ Error for ${requestUrl}:`, result.error);
    }
  } else {
    logger.log(`[RTK Query] ✅ Success for ${requestUrl}:`, result.data);
  }

  // Handle known errors
  if (result.error?.status === 401) {
    logger.log("Token expired — attempting refresh");

    const refreshToken = (api.getState() as RootState).auth.refreshToken;

    if (!refreshToken) {
      logger.log("No refresh token available - logging out");
      api.dispatch(logout());
      return result;
    }

    try {
      const refreshResult = await fetch(`${API_URL}/api/token/refresh/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      const data = await refreshResult.json();

      if (refreshResult.ok || data?.access) {
        const user = (api.getState() as RootState).auth.user;

        if (!user) {
          api.dispatch(logout());
          return result;
        }

        // Update token in store
        api.dispatch(
          updateToken({
            token: data.access,
          }),
        );

        // Retry original request
        result = await baseQuery(args, api, extraOptions);
      } else {
        throw new Error("Refresh failed");
      }
    } catch (error) {
      logger.log("Refresh failed — logging out", error);
      api.dispatch(logout());
      Toast.show({
        type: "error",
        text1: "Session expired. Please log in again.",
      });
    }
  }

  // Optional: global error handling
  if (result.error) {
    const errorData = result.error.data as { message?: string } | undefined;
    const message = errorData?.message || "Something went wrong";

    // Don't show toast for expected 403 errors on approve/reject (handled in UI)
    if (result.error.status === 403 && !isApproveRejectEndpoint) {
      Toast.show({ type: "error", text1: message });
    } else if (result.error.status === 404) {
      logger.log("404 error", message);
    } else if (typeof result.error.status === "number" && result.error.status >= 500) {
      Toast.show({
        type: "error",
        text1: "Server error. Please try again later.",
      });
    }
  }

  return result;
};

/**
 * Wraps baseQueryWithReauth with automatic retry logic.
 * Only retries on FETCH_ERROR (network failure) — never on 4xx / 5xx.
 * Max 2 retries (3 total attempts) with RTK Query's built-in exponential back-off.
 */
const baseQueryWithRetry = retry(
  async (args: string | FetchArgs, api, extraOptions) => {
    const result = await baseQueryWithReauth(args, api, extraOptions);
    // Bail immediately on definitive server/auth errors — no point retrying
    if (result.error && result.error.status !== "FETCH_ERROR") {
      retry.fail(result.error);
    }
    return result;
  },
  { maxRetries: 2 },
);

export const baseApi = createApi({
  reducerPath: "baseApi",
  baseQuery: baseQueryWithRetry,
  refetchOnReconnect: true, // Re-fetch when network comes back
  refetchOnFocus: true, // Re-fetch when app returns to foreground (AppState → onFocus)
  tagTypes: [
    "Child",
    "Message",
    "Expense",
    "Schedule",
    "documents",
    "Profile",
    "Onboarding",
    "Children",
    "PendingInvitations",
    "Milestones",
    "NotificationPreferences",
    "NotificationHistory",
    "HomeScreenSentimentGraph",
    "LegalAndPrivacyPolicy",
    "SubscriptionPlans",
    "MySubscription",
  ] as const,
  endpoints: (builder) => ({}),
});
