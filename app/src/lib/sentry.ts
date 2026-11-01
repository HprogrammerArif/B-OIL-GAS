// ─────────────────────────────────────────────────────────────────────────────
// Sentry — Optional error tracking
//
// Sentry is DISABLED when EXPO_PUBLIC_SENTRY_DSN is blank or missing.
// To enable: add your DSN to .env.local:
//   EXPO_PUBLIC_SENTRY_DSN=https://xxx@ooo.ingest.sentry.io/yyy
//
// You never need to change this file. It is always called in _layout.tsx.
// ─────────────────────────────────────────────────────────────────────────────

import * as Sentry from "@sentry/react-native";
import { logger } from "./logger";

const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

/**
 * Call once at app startup in the root _layout.tsx.
 * No-op when EXPO_PUBLIC_SENTRY_DSN is not set.
 */
export function initSentry(): void {
  if (!DSN) {
    logger.log("[Sentry] DSN not set — Sentry is disabled.");
    return;
  }

  Sentry.init({
    dsn: DSN,
    debug: __DEV__,
    // Capture 100% of transactions in dev, 20% in production
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
    // Attach breadcrumbs for better crash context
    attachStacktrace: true,
    enabled: !__DEV__, // disable in dev to avoid noise; set to true to test
  });

  logger.log("[Sentry] Initialized.");
}

/**
 * Report a caught error to Sentry (no-op if Sentry is disabled).
 */
export function captureError(error: unknown, context?: Record<string, unknown>): void {
  if (!DSN) return;
  Sentry.withScope((scope) => {
    if (context) scope.setExtras(context);
    Sentry.captureException(error);
  });
}

/**
 * Add a breadcrumb for debugging (no-op if Sentry is disabled).
 */
export function addBreadcrumb(message: string, data?: Record<string, unknown>): void {
  if (!DSN) return;
  Sentry.addBreadcrumb({ message, data, level: "info" });
}

/**
 * Identify the user in Sentry (call after login).
 * Pass null to reset on logout.
 */
export function identifySentryUser(user: { id: string; email?: string } | null): void {
  if (!DSN) return;
  if (user) {
    Sentry.setUser({ id: user.id, email: user.email });
  } else {
    Sentry.setUser(null);
  }
}
