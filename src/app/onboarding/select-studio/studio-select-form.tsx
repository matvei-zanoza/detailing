"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Building2, Loader2, Send } from "lucide-react";

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
    <div className="space-y-5">
      <div className="space-y-2.5">
        <Label className="text-sm font-medium">Choose your studio</Label>
        <Select value={studioId} onValueChange={setStudioId} disabled={isPending}>
          <SelectTrigger className="h-12 rounded-xl bg-muted/30 border-border/50 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                <Building2 className="h-3.5 w-3.5 text-primary" />
              </div>
              <SelectValue placeholder="Select studio" />
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            {studios.map((s) => (
              <SelectItem 
                key={s.id} 
                value={s.id}
                className="rounded-lg cursor-pointer"
              >
                <div className="flex items-center gap-2 py-0.5">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  {s.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button 
        onClick={onSubmit} 
        disabled={isPending || !studioId} 
        className="w-full h-12 rounded-xl font-medium text-sm gap-2 shadow-lg shadow-primary/20"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending request...
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Request Access
          </>
        )}
      </Button>
    </div>
  );
}
