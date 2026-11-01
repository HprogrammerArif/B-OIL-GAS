import * as Sentry from "@sentry/react-native";
import { env } from "./env";
import { logger } from "./logger";

const DSN = env.EXPO_PUBLIC_SENTRY_DSN;

/** Phone numbers, NIDs and bearer tokens never leave the device (doc 07 PII rules). */
const PII_PATTERNS: RegExp[] = [/\+?880[\s-]?1\d{3}[\s-]?\d{6}/g, /\b\d{10,17}\b/g, /Bearer\s+[\w.-]+/gi, /m[ar]t_[\w]+/g];

function scrub(value: string): string {
  return PII_PATTERNS.reduce((acc, re) => acc.replace(re, "[redacted]"), value);
}

/** Call once at startup; no-op without a DSN. */
export function initSentry(): void {
  if (!DSN) {
    logger.log("[Sentry] DSN not set — disabled.");
    return;
  }
  Sentry.init({
    dsn: DSN,
    debug: false,
    sendDefaultPii: false,
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
    attachStacktrace: true,
    enabled: !__DEV__,
    beforeSend(event) {
      if (event.message) event.message = scrub(event.message);
      event.exception?.values?.forEach((v) => {
        if (v.value) v.value = scrub(v.value);
      });
      if (event.request) delete event.request.headers;
      return event;
    },
    beforeBreadcrumb(crumb) {
      if (crumb.message) crumb.message = scrub(crumb.message);
      if (crumb.category === "xhr" || crumb.category === "fetch") delete crumb.data;
      return crumb;
    },
  });
}

export function captureError(error: unknown, context?: Record<string, unknown>): void {
  if (!DSN) return;
  Sentry.withScope((scope) => {
    if (context) scope.setExtras(context);
    Sentry.captureException(error);
  });
}

export function addBreadcrumb(message: string, data?: Record<string, unknown>): void {
  if (!DSN) return;
  Sentry.addBreadcrumb({ message: scrub(message), data, level: "info" });
}

/** Opaque user id only — no email or name. */
export function identifySentryUser(userId: string | null): void {
  if (!DSN) return;
  Sentry.setUser(userId ? { id: userId } : null);
}
