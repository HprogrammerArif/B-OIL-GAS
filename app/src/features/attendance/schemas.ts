import { z } from "zod";
import { atTime } from "@/lib/calendar";
import type { CreateRegularisationRequest } from "@/types/domain/attendance";
import { REGULARISATION_TYPES } from "./presentation";

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const optionalTime = z.string().trim().refine((v) => v === "" || TIME.test(v), "attendance:regularise.timeFormat");

/** Zod messages are i18n keys; `FormField` translates them (doc 05 §10). */
export const regularisationSchema = z
  .object({
    type: z.enum(REGULARISATION_TYPES),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "errors:required"),
    requestedIn: optionalTime,
    requestedOut: optionalTime,
    reason: z.string().trim().min(10, "errors:commentMin10").max(500),
  })
  .superRefine((v, ctx) => {
    if (v.type === "MISSED_PUNCH" && !v.requestedIn && !v.requestedOut) {
      ctx.addIssue({ code: "custom", path: ["requestedIn"], message: "attendance:regularise.timeNeeded" });
    }
    if (v.requestedIn && v.requestedOut && v.requestedOut <= v.requestedIn) {
      ctx.addIssue({ code: "custom", path: ["requestedOut"], message: "attendance:regularise.timeOrder" });
    }
  });

export type RegularisationForm = z.infer<typeof regularisationSchema>;

export function toRegularisationRequest(v: RegularisationForm): CreateRegularisationRequest {
  const showTimes = v.type === "MISSED_PUNCH";
  return {
    date: v.date,
    type: v.type,
    requestedIn: showTimes && v.requestedIn ? atTime(v.date, v.requestedIn).toISOString() : undefined,
    requestedOut: showTimes && v.requestedOut ? atTime(v.date, v.requestedOut).toISOString() : undefined,
    reason: v.reason.trim(),
  };
}
