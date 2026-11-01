import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import type { SerializedError } from "@reduxjs/toolkit";
import type { ApiErrorBody, ApiErrorCode, ApiErrorDetail } from "@/types/api";

export type ClientErrorCode = ApiErrorCode | "NETWORK" | "TIMEOUT" | "UNKNOWN";

export interface ApiError {
  code: ClientErrorCode;
  message: string;
  status: number | null;
  details: ApiErrorDetail[];
  requestId?: string;
}

function isErrorBody(value: unknown): value is ApiErrorBody {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof (value as ApiErrorBody).error?.code === "string"
  );
}

/** Normalises RTK Query / thrown errors into the doc 03 error shape (doc 05 §4.2). */
export function toApiError(error: unknown): ApiError {
  if (typeof error === "object" && error !== null && "status" in error) {
    const e = error as FetchBaseQueryError;
    if (e.status === "FETCH_ERROR") return { code: "NETWORK", message: "No connection", status: null, details: [] };
    if (e.status === "TIMEOUT_ERROR") return { code: "TIMEOUT", message: "Request timed out", status: null, details: [] };
    if (typeof e.status === "number" && "data" in e && isErrorBody(e.data)) {
      const { code, message, details, requestId } = e.data.error;
      return { code, message, status: e.status, details: details ?? [], requestId };
    }
    return { code: "UNKNOWN", message: "Unexpected response", status: typeof e.status === "number" ? e.status : null, details: [] };
  }
  const serialized = error as SerializedError | undefined;
  return { code: "UNKNOWN", message: serialized?.message ?? "Something went wrong", status: null, details: [] };
}

/** First `details[].reason`, e.g. `INVALID_CREDENTIALS`, `ACCOUNT_LOCKED`. */
export function errorReason(error: ApiError): string | undefined {
  const reason = error.details.find((d) => typeof d.reason === "string")?.reason;
  return typeof reason === "string" ? reason : undefined;
}

/** i18n key for a user-facing message; screens add context-specific overrides. */
export function errorMessageKey(error: ApiError): string {
  switch (error.code) {
    case "NETWORK":
      return "errors:network";
    case "TIMEOUT":
      return "errors:timeout";
    case "FORBIDDEN":
      return "errors:forbidden";
    case "NOT_FOUND":
      return "errors:notFound";
    case "CONFLICT":
    case "INVALID_STATE_TRANSITION":
      return "errors:conflict";
    case "RATE_LIMITED":
      return "errors:rateLimited";
    case "VALIDATION_ERROR":
    case "POLICY_VIOLATION":
      return "errors:validation";
    default:
      return "errors:generic";
  }
}
