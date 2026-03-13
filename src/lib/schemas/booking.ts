import { z } from "zod";

import { BOOKING_STATUSES } from "@/lib/domain/booking";

export const bookingFormSchema = z
  .object({
    customer_id: z.string().uuid(),
    car_id: z.string().uuid(),
    item_type: z.enum(["service", "package"]),
    service_id: z.string().uuid().nullable().optional(),
    package_id: z.string().uuid().nullable().optional(),
    staff_id: z.string().uuid().nullable().optional(),
    booking_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    start_time: z.string().regex(/^\d{2}:\d{2}$/),
    end_time: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
    status: z.enum(BOOKING_STATUSES),
    price: z.coerce.number().min(0),
    notes: z.string().max(800).nullable().optional(),
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

export type BookingFormValues = z.infer<typeof bookingFormSchema>;
