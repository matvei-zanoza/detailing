import { z } from "zod";

export const serviceSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().min(10).max(240),
  duration_minutes: z.coerce.number().int().min(15).max(24 * 60),
  base_price: z.coerce.number().min(0),
  category: z.string().min(2).max(30),
  is_active: z.boolean().default(true),
});

export type ServiceValues = z.infer<typeof serviceSchema>;
