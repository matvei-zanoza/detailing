"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { getStudioJoinCode, rotateStudioJoinCode } from "./actions";

export function JoinCodeForm({ studioId }: { studioId: string }) {
  const [code, setCode] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const res = await getStudioJoinCode();
        if (!alive) return;
        if (res.ok && res.code) setCode(res.code);
      } catch {
        // ignore
      }
    })();

    return () => {
      alive = false;
    };
  }, [studioId]);

  async function copyToClipboard(text: string) {
    try {
      if (!text.trim()) return;

      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(text);
          toast.success("Copied", { description: text });
          return;
        } catch {
          // fall back to execCommand
        }
      }

      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      textarea.style.top = "-9999px";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);
      if (ok) {
        toast.success("Copied", { description: text });
      } else {
        toast.error("Copy failed");
      }
    } catch {
      toast.error("Copy failed");
    }
  }

  function onGenerate() {
    startTransition(async () => {
      try {
        const res = await rotateStudioJoinCode();
        if (!res.ok) {
          toast.error("Generate failed", { description: res.error });
          return;
        }

        if (res.code) {
          setCode(res.code);
          await copyToClipboard(res.code);
        } else {
          toast.success("Join code updated");
        }
      } catch {
        toast.error("Generate failed");
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
