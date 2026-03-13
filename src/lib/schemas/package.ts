import { z } from "zod";

export const packageSchema = z.object({
  name: z.string().min(2).max(60),
  description: z.string().min(10).max(240),
  target_profile: z.string().min(5).max(120),
  base_price: z.coerce.number().min(0),
  is_active: z.boolean().default(true),
  included_service_ids: z.array(z.string().uuid()).min(1, "Pick at least 1 service"),
});

export type PackageValues = z.infer<typeof packageSchema>;
