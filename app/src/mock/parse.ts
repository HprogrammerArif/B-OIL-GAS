import type { z } from "zod";
import { validationError } from "./http";

/** Validates external input and maps the first issue to the doc 03 VALIDATION_ERROR envelope. */
export function parse<T extends z.ZodType>(schema: T, value: unknown): z.infer<T> {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw validationError(String(issue?.path[0] ?? "body"), issue?.message ?? "Invalid request");
  }
  return parsed.data;
}
