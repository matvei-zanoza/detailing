"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { rotateStudioJoinCode } from "./actions";

export function JoinCodeForm({ studioId }: { studioId: string }) {
  const [code, setCode] = useState("");
  const [isPending, startTransition] = useTransition();

  const storageKey = useMemo(() => `studio_join_code:${studioId}`, [studioId]);

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    if (stored) setCode(stored);
  }, [storageKey]);

  async function copyToClipboard(text: string) {
    await navigator.clipboard.writeText(text);
    toast.success("Copied", { description: text });
  }

  function onGenerate() {
    startTransition(async () => {
      const res = await rotateStudioJoinCode();
      if (!res.ok) {
        toast.error("Generate failed", { description: res.error });
        return;
      }
      if (res.code) {
        setCode(res.code);
        window.localStorage.setItem(storageKey, res.code);
        await copyToClipboard(res.code);
      } else {
        toast.success("Join code updated");
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label>New join code</Label>
        <Input
          type="text"
          value={code}
          readOnly
          placeholder="Click Generate to create a code"
          disabled={isPending}
        />
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" onClick={onGenerate} disabled={isPending}>
          {isPending ? "Working…" : "Generate"}
        </Button>
        <Button variant="secondary" onClick={() => copyToClipboard(code)} disabled={isPending || !code.trim()}>
          Copy
        </Button>
      </div>
    </div>
  );
}
