"use client";

import { useState } from "react";
import { toast } from "sonner";

import { updateCarTimes } from "./actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/components/i18n/i18n-provider";

function toDateTimeLocalValue(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDateTimeLocalValue(v: string) {
  if (!v) return null;
  const d = new Date(v);
  return d.toISOString();
}

export function CarTimesForm({
  bookingId,
  initialValues,
}: {
  bookingId: string;
  initialValues: {
    car_arrived_at: string | null;
    car_ready_at: string | null;
    car_picked_up_at: string | null;
  };
}) {
  const [isPending, setIsPending] = useState(false);
  const { t } = useI18n();

  const [arrived, setArrived] = useState(toDateTimeLocalValue(initialValues.car_arrived_at));
  const [ready, setReady] = useState(toDateTimeLocalValue(initialValues.car_ready_at));
  const [picked, setPicked] = useState(toDateTimeLocalValue(initialValues.car_picked_up_at));

  async function submit() {
    setIsPending(true);
    try {
      await updateCarTimes(bookingId, {
        car_arrived_at: fromDateTimeLocalValue(arrived),
        car_ready_at: fromDateTimeLocalValue(ready),
        car_picked_up_at: fromDateTimeLocalValue(picked),
      });
      toast.success(t("common.saved"));
    } catch (e) {
      toast.error(t("common.saveFailed"), {
        description: e instanceof Error ? t(e.message) : t("common.tryAgain"),
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{t("bookingCarTimes.arrivedAt")}</Label>
        <Input type="datetime-local" value={arrived} onChange={(e) => setArrived(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label>{t("bookingCarTimes.readyAt")}</Label>
        <Input type="datetime-local" value={ready} onChange={(e) => setReady(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label>{t("bookingCarTimes.pickedUpAt")}</Label>
        <Input type="datetime-local" value={picked} onChange={(e) => setPicked(e.target.value)} />
      </div>

      <div className="flex justify-end">
        <Button size="sm" onClick={submit} disabled={isPending}>
          {isPending ? t("common.saving") : t("common.save")}
        </Button>
      </div>
    </div>
  );
}
