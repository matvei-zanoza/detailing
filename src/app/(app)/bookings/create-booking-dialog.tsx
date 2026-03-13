"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { createBooking } from "./actions";
import { BookingForm } from "./booking-form";
import type { BookingFormValues } from "@/lib/schemas/booking";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Option = { id: string; label: string };

export function CreateBookingDialog({
  customers,
  cars,
  staff,
  services,
  packages,
}: {
  customers: Option[];
  cars: (Option & { customer_id: string })[];
  staff: Option[];
  services: Option[];
  packages: Option[];
}) {
  const [isPending, startTransition] = useTransition();

  async function onSubmit(values: BookingFormValues) {
    const res = await createBooking(values);
    return res;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button disabled={isPending}>Create booking</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>New booking</DialogTitle>
        </DialogHeader>
        <div className="max-h-[75vh] overflow-auto pr-1">
          <BookingForm
            mode="create"
            customers={customers}
            cars={cars}
            staff={staff}
            services={services}
            packages={packages}
            onSubmitAction={async (v) => {
              try {
                const r = await onSubmit(v);
                return r;
              } catch (e) {
                toast.error("Create failed", {
                  description: e instanceof Error ? e.message : "Please try again",
                });
                throw e;
              }
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
