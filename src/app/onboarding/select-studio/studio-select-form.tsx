"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { requestStudioAccess } from "./actions";

export function StudioSelectForm() {
  const [code, setCode] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  function onSubmit() {
    startTransition(async () => {
      const res = await requestStudioAccess(code);
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
        disabled={isPending || !code.trim()} 
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
