import { z } from "zod";

/**
 * Public build-time configuration (`EXPO_PUBLIC_*` is inlined into the JS bundle — never secrets).
 * `mock` runs the in-app server in `src/mock`; `live` talks to `server/` at EXPO_PUBLIC_API_URL.
 */
const schema = z
  .object({
    EXPO_PUBLIC_API_MODE: z.enum(["mock", "live"]).default("mock"),
    EXPO_PUBLIC_API_URL: z.string().url().optional(),
    EXPO_PUBLIC_SENTRY_DSN: z.string().optional(),
  })
  .refine((v) => v.EXPO_PUBLIC_API_MODE === "mock" || !!v.EXPO_PUBLIC_API_URL, {
    message: "EXPO_PUBLIC_API_URL is required when EXPO_PUBLIC_API_MODE=live",
    path: ["EXPO_PUBLIC_API_URL"],
  });

const parsed = schema.safeParse({
  EXPO_PUBLIC_API_MODE: process.env.EXPO_PUBLIC_API_MODE || undefined,
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL || undefined,
  EXPO_PUBLIC_SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN || undefined,
});

if (!parsed.success) {
  throw new Error(`[env] Invalid configuration: ${parsed.error.issues.map((i) => i.message).join("; ")}`);
}

export const env = parsed.data;
export const isMockApi = env.EXPO_PUBLIC_API_MODE === "mock";
export const apiBaseUrl = isMockApi ? "mock://oneops/api/v1" : `${env.EXPO_PUBLIC_API_URL!.replace(/\/$/, "")}/api/v1`;
