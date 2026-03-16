import { z } from "zod";

export const customerSchema = z.object({
  display_name: z.string().min(2).max(80),
  email: z.string().email().nullable().optional(),
  phone: z.string().min(5).max(40).nullable().optional(),
  notes: z.string().max(800).nullable().optional(),
});

export type CustomerValues = z.infer<typeof customerSchema>;
