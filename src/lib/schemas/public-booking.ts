import { z } from "zod";

export const publicBookingSchema = z
  .object({
    studio_slug: z.string().min(1),
    customer_name: z.string().min(2).max(80),
    customer_phone: z.string().min(5).max(40),
    customer_email: z.string().email().nullable().optional(),
    car_brand: z.string().max(40).nullable().optional(),
    car_model: z.string().max(40).nullable().optional(),
    booking_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    start_time: z.string().regex(/^\d{2}:\d{2}$/),
    duration_hours: z.union([z.literal(1), z.literal(2)]),
    item_type: z.enum(["service", "package"]),
    service_id: z.string().uuid().nullable().optional(),
    package_id: z.string().uuid().nullable().optional(),
    notes: z.string().max(800).nullable().optional(),
    hp: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.item_type === "service") {
      if (!val.service_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["service_id"],
          message: "Select a service",
        });
      }
      if (val.package_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["package_id"],
          message: "Package must be empty when service is selected",
        });
      }
    }

    if (val.item_type === "package") {
      if (!val.package_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["package_id"],
          message: "Select a package",
        });
      }
      if (val.service_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["service_id"],
          message: "Service must be empty when package is selected",
        });
      }
    }
  });

export type PublicBookingValues = z.infer<typeof publicBookingSchema>;
