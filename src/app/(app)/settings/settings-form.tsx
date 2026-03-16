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

import type { UpdateStudioSettingsResult } from "./actions";

export function SettingsForm({
  initialValues,
  submitAction,
}: {
  initialValues: StudioSettingsValues;
  submitAction: (values: StudioSettingsValues) => Promise<UpdateStudioSettingsResult>;
}) {
  const [isPending, setIsPending] = useState(false);

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
        toast.error("Save failed", {
          description: res.error,
        });
        return;
      }
      toast.success("Settings saved");
    } catch (e) {
      toast.error("Save failed", {
        description: e instanceof Error ? e.message : "Please try again",
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(submit as any)} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Studio name</Label>
          <Input {...form.register("name")} />
          {form.formState.errors.name && (
            <div className="text-xs text-destructive">{form.formState.errors.name.message}</div>
          )}
        </div>
        <div className="space-y-2">
          <Label>Timezone</Label>
          <Input {...form.register("timezone")} placeholder="e.g. America/Los_Angeles" />
          {form.formState.errors.timezone && (
            <div className="text-xs text-destructive">{form.formState.errors.timezone.message}</div>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Currency</Label>
          <Input {...form.register("currency")} placeholder="USD" />
          {form.formState.errors.currency && (
            <div className="text-xs text-destructive">{form.formState.errors.currency.message}</div>
          )}
        </div>
        <div className="space-y-2">
          <Label>Branding color</Label>
          <Input {...form.register("branding_color")} placeholder="zinc" />
          {form.formState.errors.branding_color && (
            <div className="text-xs text-destructive">{form.formState.errors.branding_color.message}</div>
          )}
        </div>
        <div className="space-y-2">
          <Label>Logo</Label>
          <Input value="(placeholder)" disabled />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Business hours (JSON)</Label>
        <Textarea rows={8} {...form.register("business_hours")} />
        {form.formState.errors.business_hours && (
          <div className="text-xs text-destructive">{form.formState.errors.business_hours.message}</div>
        )}
        <div className="text-xs text-muted-foreground">
          Example: {`{"mon":{"open":"09:00","close":"18:00"}}`}
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}
