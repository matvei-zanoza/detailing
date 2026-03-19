"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { serviceSchema, type ServiceValues } from "@/lib/schemas/service";

import { createService, updateService } from "./actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function ServiceDialog({
  triggerLabel,
  title,
  mode,
  initialValues,
  serviceId,
}: {
  triggerLabel: string;
  title: string;
  mode: "create" | "edit";
  initialValues?: Partial<ServiceValues>;
  serviceId?: string;
}) {
  const [isPending, setIsPending] = useState(false);
  const [open, setOpen] = useState(false);

  const form = useForm<ServiceValues>({
    resolver: zodResolver(serviceSchema) as unknown as Resolver<ServiceValues>,
    defaultValues: {
      name: initialValues?.name ?? "",
      description: initialValues?.description ?? "",
      duration_minutes: initialValues?.duration_minutes ?? 60,
      base_price: initialValues?.base_price ?? 0,
      category: initialValues?.category ?? "general",
      is_active: initialValues?.is_active ?? true,
    },
  });

  async function submit(values: ServiceValues) {
    setIsPending(true);
    try {
      if (mode === "create") {
        await createService(values);
      } else {
        if (!serviceId) throw new Error("Missing serviceId");
        await updateService(serviceId, values);
      }
      toast.success("Saved");
      setOpen(false);
    } catch (e) {
      toast.error("Save failed", {
        description: e instanceof Error ? e.message : "Please try again",
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {serviceId ? "Update service details below." : "Add a new service to your catalog."}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={form.handleSubmit(submit as any)}>
          <div className="space-y-2">
            <Label>Name</Label>
            <Input {...form.register("name")} placeholder="e.g. Ceramic Coating" />
            {form.formState.errors.name && (
              <div className="text-xs text-destructive">{form.formState.errors.name.message}</div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea rows={3} {...form.register("description")} />
            {form.formState.errors.description && (
              <div className="text-xs text-destructive">{form.formState.errors.description.message}</div>
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Duration (min)</Label>
              <Input inputMode="numeric" {...form.register("duration_minutes")} />
            </div>
            <div className="space-y-2">
              <Label>Base price</Label>
              <Input inputMode="decimal" {...form.register("base_price")} />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Input {...form.register("category")} placeholder="wash / interior / coating" />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <div className="text-sm font-medium">Active</div>
              <div className="text-xs text-muted-foreground">Hide inactive services from booking forms.</div>
            </div>
            <Switch
              checked={form.watch("is_active")}
              onCheckedChange={(v) => form.setValue("is_active", v)}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
