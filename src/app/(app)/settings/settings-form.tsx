"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  studioSettingsSchema,
  type StudioSettingsValues,
} from "@/lib/schemas/studio-settings";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/components/i18n/i18n-provider";

import type { UpdateStudioSettingsResult } from "./actions";

export function SettingsForm({
  initialValues,
  submitAction,
}: {
  initialValues: StudioSettingsValues;
  submitAction: (values: StudioSettingsValues) => Promise<UpdateStudioSettingsResult>;
}) {
  const [isPending, setIsPending] = useState(false);
  const { t } = useI18n();

  const form = useForm<StudioSettingsValues>({
    resolver: zodResolver(studioSettingsSchema) as unknown as Resolver<
      StudioSettingsValues
    >,
    defaultValues: initialValues,
  });

  async function submit(values: StudioSettingsValues) {
    setIsPending(true);
    try {
      const res = await submitAction(values);
      if (!res.ok) {
        toast.error(t("common.saveFailed"), {
          description: res.error,
        });
        return;
      }
      toast.success(t("settings.saved"));
    } catch (e) {
      toast.error(t("common.saveFailed"), {
        description: e instanceof Error ? e.message : t("common.tryAgain"),
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(submit as any)} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>{t("settings.form.studioName")}</Label>
          <Input {...form.register("name")} />
          {form.formState.errors.name && (
            <div className="text-xs text-destructive">{form.formState.errors.name.message}</div>
          )}
        </div>
        <div className="space-y-2">
          <Label>{t("settings.form.timezone")}</Label>
          <Input {...form.register("timezone")} placeholder={t("settings.form.timezonePlaceholder")} />
          {form.formState.errors.timezone && (
            <div className="text-xs text-destructive">{form.formState.errors.timezone.message}</div>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>{t("settings.form.currency")}</Label>
          <Input {...form.register("currency")} placeholder="THB" />
          {form.formState.errors.currency && (
            <div className="text-xs text-destructive">{form.formState.errors.currency.message}</div>
          )}
        </div>
        <div className="space-y-2">
          <Label>{t("settings.form.brandingColor")}</Label>
          <Input {...form.register("branding_color")} placeholder="zinc" />
          {form.formState.errors.branding_color && (
            <div className="text-xs text-destructive">{form.formState.errors.branding_color.message}</div>
          )}
        </div>
        <div className="space-y-2">
          <Label>{t("settings.form.logo")}</Label>
          <Input value="(placeholder)" disabled />
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t("settings.form.businessHours")}</Label>
        <Textarea rows={8} {...form.register("business_hours")} />
        {form.formState.errors.business_hours && (
          <div className="text-xs text-destructive">{form.formState.errors.business_hours.message}</div>
        )}
        <div className="text-xs text-muted-foreground">
          {t("settings.form.example")} {`{"mon":{"open":"09:00","close":"18:00"}}`}
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? t("common.saving") : t("common.save")}
        </Button>
      </div>
    </form>
  );
}
