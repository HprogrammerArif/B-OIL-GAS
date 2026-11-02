import { z } from "zod";

/** Doc 05 §9.1 `decisionSchema`; messages are i18n keys resolved by FormField. */
export const decisionSchema = z
  .object({
    decision: z.enum(["APPROVE", "REJECT", "RETURN"]),
    comment: z.string().trim().max(1000),
    improvements: z.string().trim().max(1000),
    reasonCategory: z.string().max(80),
    otp: z.string().trim(),
    needsOtp: z.boolean(),
  })
  .superRefine((d, ctx) => {
    if (d.decision !== "APPROVE" && d.comment.length < 10) {
      ctx.addIssue({ code: "custom", path: ["comment"], message: "errors:commentMin10" });
    }
    if (d.decision === "APPROVE" && d.needsOtp && !/^\d{6}$/.test(d.otp)) {
      ctx.addIssue({ code: "custom", path: ["otp"], message: "errors:otp6" });
    }
  });

export type DecisionForm = z.infer<typeof decisionSchema>;
