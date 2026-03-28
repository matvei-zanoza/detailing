import { Building2, Shield, Clock } from "lucide-react";

import { getRequestLocale, t as tServer } from "@/lib/i18n/server";

import { StudioSelectForm } from "./studio-select-form";

export default async function SelectStudioPage() {
  const locale = await getRequestLocale();
  return (
    <div className="w-full max-w-md">
      {/* Main Card */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
        {/* Header Icon */}
        <div className="mb-6 flex justify-center">
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-white/20 bg-white/10">
            <Building2 className="h-10 w-10 text-white/80" />
          </div>
        </div>

        {/* Title */}
        <h1 className="mb-2 text-center text-2xl font-semibold tracking-tight text-white">
          {tServer(locale, "onboarding.select.title")}
        </h1>
        <p className="mb-8 text-center text-sm text-white/60">
          {tServer(locale, "onboarding.select.subtitle")}
        </p>

        {/* Info Banner */}
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20">
            <Shield className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-white">{tServer(locale, "onboarding.select.bannerTitle")}</p>
            <p className="text-xs text-white/50 leading-relaxed">
              {tServer(locale, "onboarding.select.bannerBody")}
            </p>
          </div>
        </div>

        <StudioSelectForm />

        {/* Process Steps */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center text-center p-3 rounded-xl border border-white/10 bg-white/5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-semibold text-emerald-400 mb-2">
              1
            </div>
            <span className="text-xs text-white/50">{tServer(locale, "onboarding.select.step1")}</span>
          </div>
          <div className="flex flex-col items-center text-center p-3 rounded-xl border border-white/10 bg-white/5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white/50 mb-2">
              2
            </div>
            <span className="text-xs text-white/50">{tServer(locale, "onboarding.select.step2")}</span>
          </div>
          <div className="flex flex-col items-center text-center p-3 rounded-xl border border-white/10 bg-white/5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white/50 mb-2">
              3
            </div>
            <span className="text-xs text-white/50">{tServer(locale, "onboarding.select.step3")}</span>
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="mt-6 flex items-center justify-center gap-2 text-xs text-white/30">
        <Clock className="h-3.5 w-3.5" />
        <span>{tServer(locale, "onboarding.select.footerNote")}</span>
      </div>
    </div>
  );
}
