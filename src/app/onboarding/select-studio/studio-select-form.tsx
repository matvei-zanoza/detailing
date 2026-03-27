"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Building2, Loader2, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [code, setCode] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  function onSubmit() {
    startTransition(async () => {
      const res = await requestStudioAccess(studioId, code);
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
        <Label className="text-sm font-medium text-white/70">Choose your studio</Label>
        <Select value={studioId} onValueChange={setStudioId} disabled={isPending}>
          <SelectTrigger className="h-12 rounded-xl bg-white/5 border-white/10 text-white hover:bg-white/10 transition-colors">
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20">
                <Building2 className="h-3.5 w-3.5 text-emerald-400" />
              </div>
              <SelectValue placeholder="Select studio" />
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-xl bg-zinc-900 border-white/10">
            {studios.map((s) => (
              <SelectItem 
                key={s.id} 
                value={s.id}
                className="rounded-lg cursor-pointer text-white focus:bg-white/10 focus:text-white"
              >
                <div className="flex items-center gap-2 py-0.5">
                  <Building2 className="h-3.5 w-3.5 text-white/50" />
                  {s.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2.5">
        <Label className="text-sm font-medium text-white/70">Studio code</Label>
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          disabled={isPending}
          className="h-12 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/30 hover:bg-white/10 transition-colors"
          placeholder="Enter code from studio owner"
        />
      </div>

      <Button 
        onClick={onSubmit} 
        disabled={isPending || !studioId || !code.trim()} 
        className="w-full h-12 rounded-xl font-medium text-sm gap-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30"
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
