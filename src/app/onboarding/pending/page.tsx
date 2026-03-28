import { Clock, Mail, CheckCircle2 } from "lucide-react";

import { getRequestLocale, t as tServer } from "@/lib/i18n/server";

export default async function PendingApprovalPage() {
  const locale = await getRequestLocale();
  return (
    <div className="w-full max-w-md">
      {/* Main Card */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
        {/* Animated Clock Icon */}
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-white/20" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-white/20 bg-white/10">
              <Clock className="h-10 w-10 text-white/80" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="mb-2 text-center text-2xl font-semibold tracking-tight text-white">
          {tServer(locale, "onboarding.pending.title")}
        </h1>
        <p className="mb-8 text-center text-sm text-white/60">
          {tServer(locale, "onboarding.pending.subtitle")}
        </p>

        {/* Status Steps */}
        <div className="mb-8 space-y-4">
          <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <div className="text-sm font-medium text-white">{tServer(locale, "onboarding.pending.step1.title")}</div>
              <div className="text-xs text-white/50">{tServer(locale, "onboarding.pending.step1.body")}</div>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <div className="text-sm font-medium text-white">{tServer(locale, "onboarding.pending.step2.title")}</div>
              <div className="text-xs text-white/50">{tServer(locale, "onboarding.pending.step2.body")}</div>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20">
              <Clock className="h-5 w-5 text-amber-400 animate-pulse" />
            </div>
            <div>
              <div className="text-sm font-medium text-white">{tServer(locale, "onboarding.pending.step3.title")}</div>
              <div className="text-xs text-white/50">{tServer(locale, "onboarding.pending.step3.body")}</div>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-start gap-3">
            <Mail className="mt-0.5 h-4 w-4 flex-shrink-0 text-white/40" />
            <div className="text-xs leading-relaxed text-white/50">
              {tServer(locale, "onboarding.pending.info")}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 text-center text-xs text-white/30">
        {tServer(locale, "onboarding.pending.footer")}
      </div>
    </div>
  );
}
