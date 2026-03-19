"use client";

import { useState } from "react";
import { toast } from "sonner";

import { createBooking } from "./actions";
import { BookingForm } from "./booking-form";
import type { BookingFormValues } from "@/lib/schemas/booking";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  const [open, setOpen] = useState(false);

  async function onSubmit(values: BookingFormValues) {
    const res = await createBooking(values);
    setOpen(false);
    return res;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create booking</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>New booking</DialogTitle>
          <DialogDescription className="sr-only">
            Create a new booking by selecting customer, car, services, and schedule.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto pr-2">
          <BookingForm
            mode="create"
            customers={customers}
            cars={cars}
            staff={staff}
            services={services}
            packages={packages}
            submitAction={async (v) => {
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
