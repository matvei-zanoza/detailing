"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { serviceSchema, type ServiceValues } from "@/lib/schemas/service";
import { useI18n } from "@/components/i18n/i18n-provider";

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
  open: controlledOpen,
  onOpenChange,
  hideTrigger,
}: {
  triggerLabel?: string;
  title: string;
  mode: "create" | "edit";
  initialValues?: Partial<ServiceValues>;
  serviceId?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
}) {
  const [isPending, setIsPending] = useState(false);
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;
  const { t } = useI18n();

  const defaultValues = useMemo(
    () => ({
      name: initialValues?.name ?? "",
      description: initialValues?.description ?? "",
      duration_minutes: initialValues?.duration_minutes ?? 60,
      base_price: initialValues?.base_price ?? 0,
      category: initialValues?.category ?? "general",
      is_active: initialValues?.is_active ?? true,
    }),
    [
      initialValues?.base_price,
      initialValues?.category,
      initialValues?.description,
      initialValues?.duration_minutes,
      initialValues?.is_active,
      initialValues?.name,
    ],
  );

  const form = useForm<ServiceValues>({
    resolver: zodResolver(serviceSchema) as unknown as Resolver<ServiceValues>,
    defaultValues,
  });

  useEffect(() => {
    if (!open) return;
    form.reset(defaultValues);
  }, [open, defaultValues, form]);

  async function submit(values: ServiceValues) {
    setIsPending(true);
    try {
      if (mode === "create") {
        await createService(values);
      } else {
        if (!serviceId) throw new Error("Missing serviceId");
        await updateService(serviceId, values);
      }
      toast.success(t("common.saved"));
      setOpen(false);
    } catch (e) {
      toast.error(t("common.saveFailed"), {
        description: e instanceof Error ? e.message : t("common.tryAgain"),
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!hideTrigger ? (
        <DialogTrigger asChild>
          <Button variant="secondary" size="sm">
            {triggerLabel}
          </Button>
        </DialogTrigger>
      ) : null}
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {serviceId ? t("service.dialog.descEdit") : t("service.dialog.descCreate")}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={form.handleSubmit(submit as any)}>
          <div className="space-y-2">
            <Label>{t("service.field.name")}</Label>
            <Input {...form.register("name")} placeholder={t("service.field.namePlaceholder")} />
            {form.formState.errors.name && (
              <div className="text-xs text-destructive">{form.formState.errors.name.message}</div>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t("service.field.description")}</Label>
            <Textarea rows={3} {...form.register("description")} />
            {form.formState.errors.description && (
              <div className="text-xs text-destructive">{form.formState.errors.description.message}</div>
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-2">
              <Label>{t("service.field.duration")}</Label>
              <Input inputMode="numeric" {...form.register("duration_minutes")} />
            </div>
            <div className="space-y-2">
              <Label>{t("service.field.basePrice")}</Label>
              <Input inputMode="decimal" {...form.register("base_price")} />
            </div>
            <div className="space-y-2">
              <Label>{t("service.field.category")}</Label>
              <Input {...form.register("category")} placeholder={t("service.field.categoryPlaceholder")} />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <div className="text-sm font-medium">{t("service.activeTitle")}</div>
              <div className="text-xs text-muted-foreground">{t("service.activeHint")}</div>
            </div>
            <Switch
              checked={form.watch("is_active")}
              onCheckedChange={(v) => form.setValue("is_active", v)}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? t("common.saving") : t("common.save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
