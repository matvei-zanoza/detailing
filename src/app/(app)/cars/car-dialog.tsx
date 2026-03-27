"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { CAR_CATEGORIES, carSchema, type CarValues } from "@/lib/schemas/car";

import { createCar } from "./actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type CustomerOption = { id: string; label: string };

export function CarDialog({
  triggerLabel,
  title,
  customers,
  defaultCustomerId,
  onCreated,
}: {
  triggerLabel: string;
  title: string;
  customers: CustomerOption[];
  defaultCustomerId?: string;
  onCreated?: (car: { id: string; customer_id: string | null; label: string }) => void;
}) {
  const [isPending, setIsPending] = useState(false);
  const [open, setOpen] = useState(false);

  const defaultCid = defaultCustomerId ?? customers[0]?.id ?? "__no_owner__";

  const form = useForm<CarValues>({
    resolver: zodResolver(carSchema) as unknown as Resolver<CarValues>,
    defaultValues: {
      customer_id: defaultCid,
      brand: "",
      model: "",
      year: "" as any,
      color: "",
      license_plate: "",
      category: "__no_category__" as any,
    },
  });

  const customerId = form.watch("customer_id");

  const customerLabel = useMemo(() => {
    if (!customerId || customerId === "__no_owner__") return "No owner";
    return customers.find((c) => c.id === customerId)?.label ?? "Customer";
  }, [customers, customerId]);

  async function submit(values: CarValues) {
    setIsPending(true);
    try {
      const res = await createCar(values);
      toast.success("Car created");
      onCreated?.(res);
      setOpen(false);
      form.reset({
        customer_id: values.customer_id,
        brand: "",
        model: "",
        year: "" as any,
        color: "",
        license_plate: "",
        category: "__no_category__" as any,
      });
    } catch (e) {
      toast.error("Create failed", {
        description: e instanceof Error ? e.message : "Please try again",
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">{triggerLabel}</Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Add a vehicle for {customerLabel}.</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={form.handleSubmit(submit as any)}>
          <div className="space-y-2">
            <Label>Owner</Label>
            <Select value={form.watch("customer_id") ?? ""} onValueChange={(v) => form.setValue("customer_id", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__no_owner__">No owner</SelectItem>
                {customers.map((c) => (
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

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Brand</Label>
              <Input {...form.register("brand")} placeholder="BMW" />
              {form.formState.errors.brand && (
                <div className="text-xs text-destructive">{form.formState.errors.brand.message}</div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Model</Label>
              <Input {...form.register("model")} placeholder="M3" />
              {form.formState.errors.model && (
                <div className="text-xs text-destructive">{form.formState.errors.model.message}</div>
              )}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Year</Label>
              <Input inputMode="numeric" {...form.register("year")} placeholder="2024" />
              {form.formState.errors.year && (
                <div className="text-xs text-destructive">{form.formState.errors.year.message}</div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <Input {...form.register("color")} placeholder="Black" />
              {form.formState.errors.color && (
                <div className="text-xs text-destructive">{form.formState.errors.color.message}</div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.watch("category")} onValueChange={(v) => form.setValue("category", v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__no_category__">No category</SelectItem>
                  {CAR_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.category && (
                <div className="text-xs text-destructive">{form.formState.errors.category.message}</div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>License plate</Label>
            <Input {...form.register("license_plate")} placeholder="A123BC" />
            {form.formState.errors.license_plate && (
              <div className="text-xs text-destructive">{form.formState.errors.license_plate.message}</div>
            )}
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
