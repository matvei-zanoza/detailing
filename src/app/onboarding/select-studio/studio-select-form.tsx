"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/components/i18n/i18n-provider";

import { requestStudioAccess } from "./actions";

export function StudioSelectForm() {
  const [code, setCode] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const { t } = useI18n();

  function onSubmit() {
    startTransition(async () => {
      const res = await requestStudioAccess(code);
      if (!res.ok) {
        toast.error(t("onboarding.select.toast.requestFailed"), { description: t(res.error) });
        return;
      }
      toast.success(t("onboarding.select.toast.requestSent"), { description: t("onboarding.select.toast.waitingForApproval") });
      window.location.href = "/onboarding/pending";
    });
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2.5">
        <Label className="text-sm font-medium text-white/70">{t("onboarding.select.form.studioCode")}</Label>
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          disabled={isPending}
          className="h-12 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/30 hover:bg-white/10 transition-colors"
          placeholder={t("onboarding.select.form.placeholder")}
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
            {t("onboarding.select.form.sending")}
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            {t("onboarding.select.form.requestAccess")}
          </>
        )}
      </Button>
    </div>
  );
}
