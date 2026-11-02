import { createApi, fetchBaseQuery, retry } from "@reduxjs/toolkit/query/react";
import type { BaseQueryApi, BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { REHYDRATE } from "redux-persist";
import type { UnknownAction } from "@reduxjs/toolkit";
import { apiBaseUrl, isMockApi } from "@/lib/env";
import { secure } from "@/lib/storage/secure";
import { SecureKeys } from "@/lib/storage/keys";
import { sessionExpired, tokenRefreshed } from "@/redux/slices/auth.slice";
import { TAG_TYPES } from "./tags";
import { commonHeaders, mockBaseQuery, PUBLIC_ENDPOINTS, requestRefresh } from "./transport";

type HeaderState = Parameters<typeof commonHeaders>[0];

const liveBaseQuery = fetchBaseQuery({
  baseUrl: apiBaseUrl,
  timeout: 15_000,
  prepareHeaders: async (headers, { getState, endpoint }) => {
    const common = await commonHeaders(getState() as HeaderState, endpoint);
    Object.entries(common).forEach(([k, v]) => {
      if (!headers.has(k)) headers.set(k, v);
    });
    return headers;
  },
});

const rawBaseQuery = isMockApi ? mockBaseQuery : liveBaseQuery;

let refreshInFlight: Promise<"ok" | "rejected" | "network"> | null = null;

/** Single-flight refresh: concurrent 401s share one rotation; the new refresh token is stored before retries. */
function refreshSession(api: BaseQueryApi): Promise<"ok" | "rejected" | "network"> {
  refreshInFlight ??= (async () => {
    const refreshToken = await secure.get(SecureKeys.refreshToken);
    if (!refreshToken) return "rejected" as const;
    const result = await requestRefresh(refreshToken);
    if (!result.ok) return result.reason;
    await secure.set(SecureKeys.refreshToken, result.tokens.refreshToken);
    api.dispatch(tokenRefreshed({ accessToken: result.tokens.accessToken, expiresIn: result.tokens.expiresIn }));
    return "ok" as const;
  })()
    .catch(() => "network" as const)
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
}

export const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  let result = await rawBaseQuery(args, api, extraOptions);
  if (result.error?.status === 401 && !PUBLIC_ENDPOINTS.has(api.endpoint)) {
    const outcome = await refreshSession(api);
    if (outcome === "ok") {
      result = await rawBaseQuery(args, api, extraOptions);
    } else if (outcome === "rejected") {
      await secure.remove(SecureKeys.refreshToken);
      api.dispatch(sessionExpired());
    }
  }
  return result;
};

/** Retry only idempotent reads on transport failures; mutations rely on the offline queue instead. */
const baseQueryWithRetry = retry(
  async (args: string | FetchArgs, api, extraOptions) => {
    const result = await baseQueryWithReauth(args, api, extraOptions);
    const transient = result.error?.status === "FETCH_ERROR" || result.error?.status === "TIMEOUT_ERROR";
    if (result.error && !(api.type === "query" && transient)) retry.fail(result.error);
    return result;
  },
  { maxRetries: 2 },
);

interface RehydrateAction extends UnknownAction {
  key: string;
  payload?: Record<string, unknown>;
}

const isRehydrate = (action: UnknownAction): action is RehydrateAction => action.type === REHYDRATE;

export const baseApi = createApi({
  reducerPath: "baseApi",
  baseQuery: baseQueryWithRetry,
  refetchOnReconnect: true,
  refetchOnFocus: true,
  keepUnusedDataFor: 120,
  // Rehydrated offline entries render immediately, then revalidate once they are older than this.
  refetchOnMountOrArgChange: 60,
  extractRehydrationInfo(action, { reducerPath }) {
    if (isRehydrate(action) && action.key === reducerPath && action.payload) {
      // Only `queries` and `provided` are persisted (redux/persist/config.ts); RTK Query's
      // rehydrate handlers iterate every sub-slice, so the rest must exist (even if empty).
      const p = action.payload;
      return {
        queries: p.queries ?? {},
        mutations: {},
        provided: p.provided ?? { tags: {}, keys: {} },
      } as never;
    }
    return undefined;
  },
  tagTypes: TAG_TYPES,
  endpoints: () => ({}),
});
