import { z } from "zod";

export const CAR_CATEGORIES = [
  "sedan",
  "suv",
  "coupe",
  "pickup",
  "van",
  "supercar",
] as const;

export const carSchema = z.object({
  customer_id: z.union([z.string().uuid(), z.literal(""), z.literal("__no_owner__")]),
  brand: z.string().trim().min(1).max(40),
  model: z.string().trim().min(1).max(40),
  year: z
    .union([z.coerce.number().int().min(1900).max(2100), z.literal(""), z.null()])
    .optional(),
  color: z.string().max(30).optional(),
  license_plate: z.string().max(20).optional(),
  category: z.union([z.enum(CAR_CATEGORIES), z.literal(""), z.literal("__no_category__")]).optional(),
});

export type CarValues = z.infer<typeof carSchema>;
