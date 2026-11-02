import { z } from "zod";

/** Mirrors the server's create-notice validation (doc 03 §7, BR-01-10); messages are i18n keys. */
export const noticeSchema = z.object({
  title: z.string().trim().min(5, "errors:min5").max(200),
  titleBn: z.string().trim().max(200),
  body: z.string().trim().min(10, "errors:commentMin10").max(20000),
  bodyBn: z.string().trim().max(20000),
  referenceNo: z.string().trim().max(60),
  category: z.enum(["EXECUTIVE", "SAFETY", "OPERATIONS", "HR", "ADMIN", "POLICY", "FINANCE"]),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "CRITICAL"]),
  audienceKey: z.string().min(1, "errors:required"),
  isPinned: z.boolean(),
  requiresAck: z.boolean(),
  sendSms: z.boolean(),
});

export type NoticeForm = z.infer<typeof noticeSchema>;

export const broadcastSchema = z.object({
  title: z.string().trim().min(5, "errors:min5").max(200),
  titleBn: z.string().trim().max(200),
  body: z.string().trim().min(10, "errors:commentMin10").max(5000),
  bodyBn: z.string().trim().max(5000),
  requiresAck: z.boolean(),
  sendSms: z.boolean(),
});

export type BroadcastForm = z.infer<typeof broadcastSchema>;
