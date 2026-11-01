import { z } from "zod";

/** Messages are i18n keys resolved by FormField. */
export const loginSchema = z.object({
  identifier: z.string().trim().min(3, "auth:errors.required").max(120, "auth:errors.required"),
  password: z.string().min(1, "auth:errors.passwordRequired").max(128),
  rememberMe: z.boolean(),
});

export type LoginForm = z.infer<typeof loginSchema>;
