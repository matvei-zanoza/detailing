"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { requestStudioAccess } from "./actions";

type StudioOption = { id: string; name: string };

export function StudioSelectForm({ studios }: { studios: StudioOption[] }) {
  const [studioId, setStudioId] = useState<string>(studios[0]?.id ?? "");
  const [isPending, startTransition] = useTransition();

  function onSubmit() {
    startTransition(async () => {
      const res = await requestStudioAccess(studioId);
      if (!res.ok) {
        toast.error("Request failed", { description: res.error });
        return;
      }
      toast.success("Request sent", { description: "Waiting for approval" });
      window.location.href = "/onboarding/pending";
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Studio</Label>
        <Select value={studioId} onValueChange={setStudioId} disabled={isPending}>
          <SelectTrigger>
            <SelectValue placeholder="Select studio" />
          </SelectTrigger>
          <SelectContent>
            {studios.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button onClick={onSubmit} disabled={isPending || !studioId} className="w-full">
        {isPending ? "Sending…" : "Request access"}
      </Button>
    </div>
  );
}
