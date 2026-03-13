"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { serviceSchema, type ServiceValues } from "@/lib/schemas/service";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function ServiceDialog({
  triggerLabel,
  title,
  initialValues,
  onSubmitAction,
}: {
  triggerLabel: string;
  title: string;
  initialValues?: Partial<ServiceValues>;
  onSubmitAction: (values: ServiceValues) => Promise<{ id: string }>;
}) {
  const [isPending, startTransition] = useTransition();

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

  function submit(values: ServiceValues) {
    startTransition(async () => {
      try {
        await onSubmitAction(values);
        toast.success("Saved");
      } catch (e) {
        toast.error("Save failed", {
          description: e instanceof Error ? e.message : "Please try again",
        });
      }
    });
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={triggerLabel === "New service" ? "default" : "outline"}>
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
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
