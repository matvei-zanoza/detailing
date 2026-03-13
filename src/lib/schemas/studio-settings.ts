import { z } from "zod";

export const studioSettingsSchema = z.object({
  name: z.string().min(2).max(80),
  timezone: z.string().min(2).max(60),
  currency: z.string().length(3),
  branding_color: z.string().min(2).max(20),
  business_hours: z
    .string()
    .min(2)
    .max(1200)
    .refine((v) => {
      try {
        const parsed = JSON.parse(v);
        return typeof parsed === "object" && parsed !== null;
      } catch {
        return false;
      }
    }, "Must be valid JSON"),
});

export type StudioSettingsValues = z.infer<typeof studioSettingsSchema>;
