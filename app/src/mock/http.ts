import type { ApiErrorBody, ApiErrorCode, ApiErrorDetail, ListMeta } from "@/types/api";

export type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export interface MockRequest {
  method: HttpMethod;
  path: string;
  query: Record<string, string>;
  body: unknown;
  headers: Record<string, string>;
}

export interface MockResponse {
  status: number;
  body: unknown;
}

const STATUS_FOR: Record<ApiErrorCode, number> = {
  VALIDATION_ERROR: 422,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INVALID_STATE_TRANSITION: 409,
  PRECONDITION_FAILED: 412,
  PAYLOAD_TOO_LARGE: 413,
  UNSUPPORTED_MEDIA_TYPE: 415,
  POLICY_VIOLATION: 422,
  RATE_LIMITED: 429,
  INTERNAL: 500,
};

/** Thrown by handlers; converted to the doc 03 error envelope by the server. */
export class HttpError extends Error {
  readonly status: number;
  constructor(
    readonly code: ApiErrorCode,
    message: string,
    readonly details?: ApiErrorDetail[],
    status?: number,
  ) {
    super(message);
    this.status = status ?? STATUS_FOR[code];
  }
}

export function ok<T>(data: T, status = 200): MockResponse {
  return { status, body: { data } };
}

export function noContent(): MockResponse {
  return { status: 204, body: null };
}

export function errorBody(err: HttpError, requestId: string): ApiErrorBody {
  return {
    error: { code: err.code, message: err.message, details: err.details, requestId },
  };
}

export function notFound(what = "Resource"): HttpError {
  return new HttpError("NOT_FOUND", `${what} not found`);
}

export function forbidden(message = "You do not have permission to perform this action"): HttpError {
  return new HttpError("FORBIDDEN", message);
}

export function invalidTransition(message: string): HttpError {
  return new HttpError("INVALID_STATE_TRANSITION", message);
}

export function policyViolation(rule: string, message: string): HttpError {
  return new HttpError("POLICY_VIOLATION", message, [{ rule, message }]);
}

export function validationError(path: string, message: string): HttpError {
  return new HttpError("VALIDATION_ERROR", message, [{ path: [path], message }]);
}

/** Page-based list over an already-filtered, already-sorted array (doc 03 §1.4). */
export function paginate<T>(items: T[], query: Record<string, string>, defaultPageSize = 20): MockResponse {
  const pageSize = Math.min(Math.max(Number(query.pageSize) || defaultPageSize, 1), 100);
  const page = Math.max(Number(query.page) || 1, 1);
  const start = (page - 1) * pageSize;
  const meta: ListMeta = { page, pageSize, total: items.length, sort: query.sort };
  return { status: 200, body: { data: items.slice(start, start + pageSize), meta } };
}

/** Sort by a `-field` / `field` key on plain records. */
export function sortBy<T>(items: T[], sort: string | undefined, fallback: string): T[] {
  const key = sort || fallback;
  const desc = key.startsWith("-");
  const field = (desc ? key.slice(1) : key) as keyof T;
  return [...items].sort((a, b) => {
    const av = a[field];
    const bv = b[field];
    if (av === bv) return 0;
    if (av === null || av === undefined) return 1;
    if (bv === null || bv === undefined) return -1;
    return (av < bv ? -1 : 1) * (desc ? -1 : 1);
  });
}

/** Case-insensitive contains across the given fields. */
export function matchesSearch(q: string | undefined, ...fields: (string | null | undefined)[]): boolean {
  if (!q) return true;
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  return fields.some((f) => f?.toLowerCase().includes(needle));
}

export function csv(value: string | undefined): string[] {
  return value ? value.split(",").map((v) => v.trim()).filter(Boolean) : [];
}
