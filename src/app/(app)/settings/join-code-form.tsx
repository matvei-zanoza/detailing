"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { rotateStudioJoinCode, setStudioJoinCode } from "./actions";

export function JoinCodeForm() {
  const [code, setCode] = useState("");
  const [isPending, startTransition] = useTransition();

  async function copyToClipboard(text: string) {
    await navigator.clipboard.writeText(text);
    toast.success("Copied", { description: text });
  }

  function onSave() {
    startTransition(async () => {
      const res = await setStudioJoinCode({ code });
      if (!res.ok) {
        toast.error("Save failed", { description: res.error });
        return;
      }
      toast.success("Join code updated");
    });
  }

  function onRotate() {
    startTransition(async () => {
      const res = await rotateStudioJoinCode();
      if (!res.ok) {
        toast.error("Rotate failed", { description: res.error });
        return;
      }
      if (res.code) {
        setCode(res.code);
        await copyToClipboard(res.code);
      } else {
        toast.success("Join code rotated");
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
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter new studio code"
          disabled={isPending}
        />
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" onClick={onRotate} disabled={isPending}>
          {isPending ? "Working…" : "Rotate"}
        </Button>
        <Button variant="secondary" onClick={() => copyToClipboard(code)} disabled={isPending || !code.trim()}>
          Copy
        </Button>
        <Button onClick={onSave} disabled={isPending || !code.trim()}>
          {isPending ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
}
