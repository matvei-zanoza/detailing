"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Resolver } from "react-hook-form";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { bookingFormSchema, type BookingFormValues } from "@/lib/schemas/booking";
import { BOOKING_STATUSES } from "@/lib/domain/booking";
import { titleCase } from "@/lib/format";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

import { CustomerDialog } from "../customers/customer-dialog";
import { CarDialog } from "../cars/car-dialog";

type Option = { id: string; label: string };

type Props = {
  mode: "create" | "edit";
  bookingId?: string;
  initialValues?: Partial<BookingFormValues>;
  customers: Option[];
  cars: (Option & { customer_id: string })[];
  staff: Option[];
  services: Option[];
  packages: Option[];
  submitAction: (values: BookingFormValues) => Promise<{ id: string }>;
};

export function BookingForm({
  mode,
  bookingId,
  initialValues,
  customers,
  cars,
  staff,
  services,
  packages,
  submitAction,
}: Props) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [localCustomers, setLocalCustomers] = useState(customers);
  const [localCars, setLocalCars] = useState(cars);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema) as unknown as Resolver<
      BookingFormValues
    >,
    defaultValues: {
      customer_id: initialValues?.customer_id ?? (customers[0]?.id ?? ""),
      car_id: initialValues?.car_id ?? "",
      item_type: initialValues?.item_type ?? "service",
      service_id: initialValues?.service_id ?? null,
      package_id: initialValues?.package_id ?? null,
      staff_id: initialValues?.staff_id ?? null,
      booking_date: initialValues?.booking_date ?? new Date().toISOString().slice(0, 10),
      start_time: initialValues?.start_time ?? "09:00",
      end_time: initialValues?.end_time ?? null,
      status: initialValues?.status ?? "booked",
      price: initialValues?.price ?? 0,
      notes: initialValues?.notes ?? null,
    },
  });

  const customerId = form.watch("customer_id");
  const itemType = form.watch("item_type");
  const staffValue = form.watch("staff_id") ?? "__unassigned__";

  const carOptions = useMemo(() => {
    const filtered = localCars.filter((c) => c.customer_id === customerId);
    return filtered.length ? filtered : localCars;
  }, [localCars, customerId]);

  async function submit(values: BookingFormValues) {
    setIsPending(true);
    try {
      const result = await submitAction(values);
      toast.success(mode === "create" ? "Booking created" : "Booking updated");
      if (mode === "create") {
        router.push(`/bookings/${result.id}`);
      } else {
        router.refresh();
      }
    } catch (e) {
      toast.error("Save failed", {
        description: e instanceof Error ? e.message : "Please try again",
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form
      onSubmit={form.handleSubmit(submit as any)}
      className="space-y-6"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label>Customer</Label>
            <CustomerDialog
              triggerLabel="New customer"
              title="New customer"
              onCreated={(c) => {
                setLocalCustomers((prev) => [...prev, c]);
                form.setValue("customer_id", c.id);
                form.setValue("car_id", "");
              }}
            />
          </div>
          <Select
            value={form.watch("customer_id")}
            onValueChange={(v) => {
              form.setValue("customer_id", v);
              const firstCar = localCars.find((c) => c.customer_id === v);
              form.setValue("car_id", firstCar ? firstCar.id : "");
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select customer" />
            </SelectTrigger>
            <SelectContent>
              {localCustomers.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.customer_id && (
            <div className="text-xs text-destructive">{form.formState.errors.customer_id.message}</div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label>Car</Label>
            <CarDialog
              triggerLabel="New car"
              title="New car"
              customers={localCustomers}
              defaultCustomerId={customerId || undefined}
              onCreated={(car) => {
                setLocalCars((prev) => [car, ...prev]);
                form.setValue("customer_id", car.customer_id);
                form.setValue("car_id", car.id);
              }}
            />
          </div>
          <Select value={form.watch("car_id")} onValueChange={(v) => form.setValue("car_id", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select car" />
            </SelectTrigger>
            <SelectContent>
              {carOptions.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.car_id && (
            <div className="text-xs text-destructive">{form.formState.errors.car_id.message}</div>
          )}
        </div>
      </div>

      <Separator />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Type</Label>
          <Select value={itemType} onValueChange={(v) => form.setValue("item_type", v as any)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="service">Service</SelectItem>
              <SelectItem value="package">Package</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{itemType === "service" ? "Service" : "Package"}</Label>
          {itemType === "service" ? (
            <Select
              value={form.watch("service_id") ?? ""}
              onValueChange={(v) => {
                form.setValue("service_id", v);
                form.setValue("package_id", null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select service" />
              </SelectTrigger>
              <SelectContent>
                {services.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Select
              value={form.watch("package_id") ?? ""}
              onValueChange={(v) => {
                form.setValue("package_id", v);
                form.setValue("service_id", null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select package" />
              </SelectTrigger>
              <SelectContent>
                {packages.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {form.formState.errors.service_id && itemType === "service" && (
            <div className="text-xs text-destructive">{form.formState.errors.service_id.message}</div>
          )}
          {form.formState.errors.package_id && itemType === "package" && (
            <div className="text-xs text-destructive">{form.formState.errors.package_id.message}</div>
          )}
        </div>

        <div className="space-y-2">
          <Label>Assigned staff</Label>
          <Select
            value={staffValue}
            onValueChange={(v) => form.setValue("staff_id", v === "__unassigned__" ? null : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Unassigned" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__unassigned__">Unassigned</SelectItem>
              {staff.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="space-y-2">
          <Label>Date</Label>
          <Input type="date" value={form.watch("booking_date")} onChange={(e) => form.setValue("booking_date", e.target.value)} />
          {form.formState.errors.booking_date && (
            <div className="text-xs text-destructive">{form.formState.errors.booking_date.message}</div>
          )}
        </div>
        <div className="space-y-2">
          <Label>Start</Label>
          <Input type="time" value={form.watch("start_time")} onChange={(e) => form.setValue("start_time", e.target.value)} />
          {form.formState.errors.start_time && (
            <div className="text-xs text-destructive">{form.formState.errors.start_time.message}</div>
          )}
        </div>
        <div className="space-y-2">
          <Label>End (optional)</Label>
          <Input
            type="time"
            value={form.watch("end_time") ?? ""}
            onChange={(e) => form.setValue("end_time", e.target.value ? e.target.value : null)}
          />
        </div>
        <div className="space-y-2">
          <Label>Price</Label>
          <Input
            inputMode="decimal"
            value={String(form.watch("price"))}
            onChange={(e) => form.setValue("price", Number(e.target.value || 0))}
          />
          {form.formState.errors.price && (
            <div className="text-xs text-destructive">{form.formState.errors.price.message}</div>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={form.watch("status")} onValueChange={(v) => form.setValue("status", v as any)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BOOKING_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {titleCase(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Notes</Label>
          <Textarea
            rows={3}
            value={form.watch("notes") ?? ""}
            onChange={(e) => form.setValue("notes", e.target.value ? e.target.value : null)}
            placeholder="Optional operational notes"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : mode === "create" ? "Create booking" : "Save changes"}
        </Button>
      </div>

      {bookingId ? <input type="hidden" value={bookingId} /> : null}
    </form>
  );
}
