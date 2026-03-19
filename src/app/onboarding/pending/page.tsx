"use client";

import { Clock, Mail, CheckCircle2, LogOut } from "lucide-react";
import { SmokeBackground } from "@/components/ui/spooky-smoke-animation";
import { LogoutButton } from "../logout-button";

export default function PendingApprovalPage() {
  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* Animated Smoke Background */}
      <div className="absolute inset-0">
        <SmokeBackground smokeColor="#5a6a7a" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center p-6">
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
              Awaiting Approval
            </h1>
            <p className="mb-8 text-center text-sm text-white/60">
              Your request has been submitted to the studio administrator
            </p>

            {/* Status Steps */}
            <div className="mb-8 space-y-4">
              <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <div className="text-sm font-medium text-white">Account Created</div>
                  <div className="text-xs text-white/50">Your profile is set up</div>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <div className="text-sm font-medium text-white">Studio Selected</div>
                  <div className="text-xs text-white/50">Join request submitted</div>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20">
                  <Clock className="h-5 w-5 text-amber-400 animate-pulse" />
                </div>
                <div>
                  <div className="text-sm font-medium text-white">Pending Review</div>
                  <div className="text-xs text-white/50">Waiting for admin approval</div>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 flex-shrink-0 text-white/40" />
                <div className="text-xs leading-relaxed text-white/50">
                  The studio administrator will review your request. You will gain access once approved.
                  If this is taking too long, please contact the studio directly.
                </div>
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <div className="mt-6 flex justify-center">
            <LogoutButton>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </LogoutButton>
          </div>

          {/* Footer */}
          <div className="mt-4 text-center text-xs text-white/30">
            This page will automatically update when approved
          </div>
        </div>
      </div>
    </div>
  );
}
