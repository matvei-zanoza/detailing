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
  customer_id: z.string().uuid(),
  brand: z.string().min(1).max(40),
  model: z.string().min(1).max(40),
  year: z.coerce.number().int().min(1900).max(2100),
  color: z.string().min(1).max(30),
  license_plate: z.string().min(1).max(20),
  category: z.enum(CAR_CATEGORIES),
});

export type CarValues = z.infer<typeof carSchema>;
