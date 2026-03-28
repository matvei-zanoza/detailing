"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/components/i18n/i18n-provider";

import { getStudioJoinCode } from "./actions";

export function JoinCodeForm({ studioId }: { studioId: string }) {
  const [code, setCode] = useState("");
  const [isPending, startTransition] = useTransition();
  const { t } = useI18n();

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
          toast.success(t("settings.joinCode.copied"), { description: text });
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
        toast.success(t("settings.joinCode.copied"), { description: text });
      } else {
        toast.error(t("settings.joinCode.copyFailed"));
      }
    } catch {
      toast.error(t("settings.joinCode.copyFailed"));
    }
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label>{t("settings.joinCode.label")}</Label>
        <Input
          type="text"
          value={code}
          readOnly
          placeholder={t("settings.joinCode.placeholder")}
          disabled={isPending}
        />
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" onClick={() => copyToClipboard(code)} disabled={isPending || !code.trim()}>
          {t("settings.joinCode.copy")}
        </Button>
      </div>
    </div>
  );
}
