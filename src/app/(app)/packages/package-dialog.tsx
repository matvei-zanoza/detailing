"use client";

import { useMemo, useTransition } from "react";
import { useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { packageSchema, type PackageValues } from "@/lib/schemas/package";

import { createPackage, updatePackage } from "./actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

type ServiceOption = { id: string; name: string; category: string };

export function PackageDialog({
  triggerLabel,
  title,
  mode,
  initialValues,
  services,
  packageId,
}: {
  triggerLabel: string;
  title: string;
  mode: "create" | "edit";
  initialValues?: Partial<PackageValues>;
  services: ServiceOption[];
  packageId?: string;
}) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<PackageValues>({
    resolver: zodResolver(packageSchema) as unknown as Resolver<PackageValues>,
    defaultValues: {
      name: initialValues?.name ?? "",
      description: initialValues?.description ?? "",
      target_profile: initialValues?.target_profile ?? "",
      base_price: initialValues?.base_price ?? 0,
      is_active: initialValues?.is_active ?? true,
      included_service_ids: initialValues?.included_service_ids ?? [],
    },
  });

  const selected = form.watch("included_service_ids");

  const grouped = useMemo(() => {
    const map = new Map<string, ServiceOption[]>();
    for (const s of services) {
      const key = s.category || "general";
      map.set(key, [...(map.get(key) ?? []), s]);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [services]);

  function toggleService(id: string, checked: boolean) {
    const next = new Set(selected);
    if (checked) next.add(id);
    else next.delete(id);
    form.setValue("included_service_ids", Array.from(next));
  }

  function submit(values: PackageValues) {
    startTransition(async () => {
      try {
        if (mode === "create") {
          await createPackage(values);
        } else {
          if (!packageId) throw new Error("Missing packageId");
          await updatePackage(packageId, values);
        }
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
        <Button variant={triggerLabel === "New package" ? "default" : "outline"}>
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={form.handleSubmit(submit as any)}>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input {...form.register("name")} placeholder="e.g. Signature" />
              {form.formState.errors.name && (
                <div className="text-xs text-destructive">{form.formState.errors.name.message}</div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Base price</Label>
              <Input inputMode="decimal" {...form.register("base_price")} />
              {form.formState.errors.base_price && (
                <div className="text-xs text-destructive">{form.formState.errors.base_price.message}</div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea rows={3} {...form.register("description")} />
            {form.formState.errors.description && (
              <div className="text-xs text-destructive">{form.formState.errors.description.message}</div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Target customer profile</Label>
            <Input {...form.register("target_profile")} placeholder="e.g. Daily driver maintenance" />
            {form.formState.errors.target_profile && (
              <div className="text-xs text-destructive">{form.formState.errors.target_profile.message}</div>
            )}
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <div className="text-sm font-medium">Active</div>
              <div className="text-xs text-muted-foreground">Show package in booking forms.</div>
            </div>
            <Switch
              checked={form.watch("is_active")}
              onCheckedChange={(v) => form.setValue("is_active", v)}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Included services</Label>
            {form.formState.errors.included_service_ids && (
              <div className="text-xs text-destructive">{form.formState.errors.included_service_ids.message as any}</div>
            )}
            <div className="max-h-[260px] overflow-auto rounded-lg border p-3">
              <div className="space-y-4">
                {grouped.map(([cat, items]) => (
                  <div key={cat} className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground">{cat}</div>
                    <div className="grid gap-2 md:grid-cols-2">
                      {items.map((s) => {
                        const checked = selected.includes(s.id);
                        return (
                          <label
                            key={s.id}
                            className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(v) => toggleService(s.id, Boolean(v))}
                            />
                            <span className="truncate">{s.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
