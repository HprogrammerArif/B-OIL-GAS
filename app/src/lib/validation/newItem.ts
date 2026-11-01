import { z } from "zod";

export const newItemSchema = z.object({
  title: z.string().min(1, "Title is required"),
  notes: z.string().optional(),
});

export type NewItemFormValues = z.infer<typeof newItemSchema>;
