import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Sparkles, Clock, Zap, Shield, BarChart3 } from "lucide-react";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="relative min-h-screen bg-background">
      {/* Subtle grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,theme(colors.border/30)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.border/30)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      
      <div className="relative mx-auto flex min-h-screen max-w-[1200px] items-center justify-center p-6">
        <div className="grid w-full grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          {/* Left Side - Brand & Features */}
          <div className="space-y-8">
            {/* Brand */}
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-medium text-primary">Premium Auto Detailing CRM</span>
              </div>
              <h1 className="text-4xl font-semibold tracking-tight text-foreground lg:text-5xl">
                Run your detailing studio with precision.
              </h1>
              <p className="text-base leading-relaxed text-muted-foreground">
                The command center for professional detailing operations. Track bookings, manage workflow, and deliver exceptional results.
              </p>
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="group rounded-xl border border-border/50 bg-card/50 p-4 transition-colors hover:border-primary/30 hover:bg-card">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div className="font-medium text-foreground">5-Second Overview</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Dashboard shows what matters instantly.
                </div>
              </div>
              <div className="group rounded-xl border border-border/50 bg-card/50 p-4 transition-colors hover:border-primary/30 hover:bg-card">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div className="font-medium text-foreground">2-Click Updates</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Move jobs through workflow stages.
                </div>
              </div>
              <div className="group rounded-xl border border-border/50 bg-card/50 p-4 transition-colors hover:border-primary/30 hover:bg-card">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div className="font-medium text-foreground">Secure & Private</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Studio-scoped data isolation.
                </div>
              </div>
              <div className="group rounded-xl border border-border/50 bg-card/50 p-4 transition-colors hover:border-primary/30 hover:bg-card">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <div className="font-medium text-foreground">Live Analytics</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Revenue, workload, and trends.
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="flex justify-center lg:justify-end">
            <Suspense>
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
