import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query";
import * as Application from "expo-application";
import { apiBaseUrl, isMockApi } from "@/lib/env";
import { getDeviceId } from "@/lib/device";
import { connectivity } from "@/lib/connectivity";
import { handleMockRequest } from "@/mock/server";
import type { HttpMethod } from "@/mock/http";
import type { Envelope } from "@/types/api";
import type { SessionTokens } from "@/types/domain/identity";

/** Endpoints that must never carry the bearer token. */
export const PUBLIC_ENDPOINTS = new Set(["login", "refresh", "forgotPassword", "demoPersonas", "demoSession"]);

interface HeaderState {
  ui: { language: "en" | "bn" | null };
  auth: { accessToken: string | null };
}

/** Headers every request carries (doc 03 §1.1). */
export async function commonHeaders(state: HeaderState, endpoint: string): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    accept: "application/json",
    "accept-language": state.ui.language ?? "en",
    "x-client": `oneops-mobile/${Application.nativeApplicationVersion ?? "dev"}+${Application.nativeBuildVersion ?? "0"}`,
    "x-device-id": await getDeviceId(),
  };
  if (!PUBLIC_ENDPOINTS.has(endpoint) && state.auth.accessToken) {
    headers.authorization = `Bearer ${state.auth.accessToken}`;
  }
  return headers;
}

function toRecord(headers: FetchArgs["headers"]): Record<string, string> {
  const out: Record<string, string> = {};
  if (!headers) return out;
  if (headers instanceof Headers) {
    headers.forEach((v, k) => {
      out[k.toLowerCase()] = v;
    });
  } else if (Array.isArray(headers)) {
    headers.forEach(([k, v]) => {
      out[k.toLowerCase()] = v;
    });
  } else {
    Object.entries(headers).forEach(([k, v]) => {
      if (typeof v === "string") out[k.toLowerCase()] = v;
    });
  }
  return out;
}

function splitUrl(url: string, params: FetchArgs["params"]): { path: string; query: Record<string, string> } {
  const [rawPath = "", rawQuery = ""] = url.split("?");
  const query: Record<string, string> = {};
  new URLSearchParams(rawQuery).forEach((v, k) => {
    query[k] = v;
  });
  Object.entries((params ?? {}) as Record<string, unknown>).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") query[k] = String(v);
  });
  return { path: rawPath.startsWith("/") ? rawPath : `/${rawPath}`, query };
}

/**
 * Mock transport: same contract as `fetchBaseQuery`, served by the in-app API.
 * Honours device connectivity so offline behaviour matches production.
 */
export const mockBaseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, api) => {
  if (!connectivity.isOnline()) return { error: { status: "FETCH_ERROR", error: "Network request failed" } };
  const fetchArgs: FetchArgs = typeof args === "string" ? { url: args } : args;
  const { path, query } = splitUrl(fetchArgs.url, fetchArgs.params);
  const headers = {
    ...(await commonHeaders(api.getState() as HeaderState, api.endpoint)),
    ...toRecord(fetchArgs.headers),
  };
  const res = await handleMockRequest({
    method: (fetchArgs.method?.toUpperCase() ?? "GET") as HttpMethod,
    path,
    query,
    body: fetchArgs.body ?? null,
    headers,
  });
  if (res.status >= 200 && res.status < 300) return { data: res.body };
  return { error: { status: res.status, data: res.body } };
};

export type RefreshResult = { ok: true; tokens: SessionTokens } | { ok: false; reason: "rejected" | "network" };

/** Exchanges a refresh token for a rotated pair; distinguishes revocation from being offline. */
export async function requestRefresh(refreshToken: string): Promise<RefreshResult> {
  if (!connectivity.isOnline()) return { ok: false, reason: "network" };
  try {
    if (isMockApi) {
      const res = await handleMockRequest({
        method: "POST",
        path: "/auth/refresh",
        query: {},
        body: { refreshToken },
        headers: { "x-device-id": await getDeviceId() },
      });
      return res.status === 200
        ? { ok: true, tokens: (res.body as Envelope<SessionTokens>).data }
        : { ok: false, reason: res.status === 401 ? "rejected" : "network" };
    }
    const res = await fetch(`${apiBaseUrl}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Device-Id": await getDeviceId() },
      body: JSON.stringify({ refreshToken }),
    });
    if (res.status === 401) return { ok: false, reason: "rejected" };
    if (!res.ok) return { ok: false, reason: "network" };
    return { ok: true, tokens: ((await res.json()) as Envelope<SessionTokens>).data };
  } catch {
    return { ok: false, reason: "network" };
  }
}
