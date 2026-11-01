/** Wire envelopes from docs/platform/03 §1.2. */
export interface Envelope<T> {
  data: T;
  meta?: { requestId?: string };
}

export interface ListMeta {
  page: number;
  pageSize: number;
  total: number;
  sort?: string;
  requestId?: string;
}

export interface ListEnvelope<T> {
  data: T[];
  meta: ListMeta;
}

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INVALID_STATE_TRANSITION"
  | "RATE_LIMITED"
  | "INTERNAL"
  | "PRECONDITION_FAILED"
  | "PAYLOAD_TOO_LARGE"
  | "UNSUPPORTED_MEDIA_TYPE"
  | "POLICY_VIOLATION";

export interface ApiErrorDetail {
  path?: (string | number)[];
  message?: string;
  reason?: string;
  rule?: string;
  [key: string]: unknown;
}

export interface ApiErrorBody {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: ApiErrorDetail[];
    requestId?: string;
  };
}

/** Page of results as consumed by screens (meta kept for "showing n of m"). */
export interface Page<T> {
  items: T[];
  meta: ListMeta;
}
