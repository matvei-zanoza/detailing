"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { setLocale } from "@/app/actions/set-locale";
import { useI18n } from "@/components/i18n/i18n-provider";

import { Button } from "@/components/ui/button";

export function LocaleToggle({ onChanged }: { onChanged?: () => void }) {
  const { locale, t } = useI18n();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="inline-flex items-center rounded-md border border-border/50 bg-background/60">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 px-2 text-xs"
        disabled={isPending}
        aria-pressed={locale === "en"}
        onClick={() => {
          startTransition(async () => {
            await setLocale("en");
            router.refresh();
            onChanged?.();
          });
        }}
      >
        {t("i18n.en")}
      </Button>
      <div className="h-4 w-px bg-border/60" />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 px-2 text-xs"
        disabled={isPending}
        aria-pressed={locale === "th"}
        onClick={() => {
          startTransition(async () => {
            await setLocale("th");
            router.refresh();
            onChanged?.();
          });
        }}
      >
        {t("i18n.th")}
      </Button>
    </div>
  );
}
