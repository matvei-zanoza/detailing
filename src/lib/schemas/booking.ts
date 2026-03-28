import { z } from "zod";

import { BOOKING_STATUSES } from "@/lib/domain/booking";

export const bookingFormSchema = z
  .object({
    customer_id: z.string().uuid().nullable().optional(),
    customer_name: z.string().trim().min(1).max(80).nullable().optional(),
    car_id: z.string().uuid().nullable().optional(),
    car_brand: z.string().trim().min(1).max(40).nullable().optional(),
    car_model: z.string().trim().min(1).max(40).nullable().optional(),
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
    const hasCustomerId = Boolean(val.customer_id);
    const hasCustomerName = Boolean(val.customer_name);

    if (!hasCustomerId && !hasCustomerName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["customer_id"],
        message: "booking.validation.selectOrEnterCustomer",
      });
    }

    const hasCarId = Boolean(val.car_id);
    const hasCarDetails = Boolean(val.car_brand) && Boolean(val.car_model);

    if (!hasCarId && !hasCarDetails) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["car_id"],
        message: "booking.validation.selectOrEnterCar",
      });
    }

    if ((val.car_brand && !val.car_model) || (!val.car_brand && val.car_model)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["car_brand"],
        message: "booking.validation.enterBrandAndModel",
      });
    }

    if (val.item_type === "service") {
      if (!val.service_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["service_id"],
          message: "booking.validation.selectService",
        });
      }
      if (val.package_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["package_id"],
          message: "booking.validation.packageMustBeEmpty",
        });
      }
    }

    if (val.item_type === "package") {
      if (!val.package_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["package_id"],
          message: "booking.validation.selectPackage",
        });
      }
      if (val.service_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["service_id"],
          message: "booking.validation.serviceMustBeEmpty",
        });
      }
    }
  });

export type BookingFormValues = z.infer<typeof bookingFormSchema>;
