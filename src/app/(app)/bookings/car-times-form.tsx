"use client";

import { useState } from "react";
import { toast } from "sonner";

import { updateCarTimes } from "./actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
      toast.success("Saved");
    } catch (e) {
      toast.error("Save failed", {
        description: e instanceof Error ? e.message : "Please try again",
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Arrived at</Label>
        <Input type="datetime-local" value={arrived} onChange={(e) => setArrived(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label>Ready at</Label>
        <Input type="datetime-local" value={ready} onChange={(e) => setReady(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label>Picked up at</Label>
        <Input type="datetime-local" value={picked} onChange={(e) => setPicked(e.target.value)} />
      </div>

      <div className="flex justify-end">
        <Button size="sm" onClick={submit} disabled={isPending}>
          {isPending ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
}
