import { Suspense } from "react";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Clock, Zap, Shield, BarChart3 } from "lucide-react";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRequestLocale, t as tServer } from "@/lib/i18n/server";
import { LoginForm } from "./login-form";
import { LoginBackground } from "./login-background";

export default async function LoginPage() {
  const locale = await getRequestLocale();
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("membership_status")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.membership_status === "active") {
      redirect("/dashboard");
    }

    redirect("/onboarding");
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated Mesh Gradient Background */}
      <LoginBackground />
      
      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1200px] items-center justify-center p-6">
        <div className="grid w-full grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          {/* Left Side - Brand & Features */}
          <div className="space-y-8">
            {/* Brand */}
            <div className="space-y-4">
              <div className="inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-sm">
                <Image
                  src="/images/logo-v2.png"
                  alt="DetailingOS"
                  width={24}
                  height={24}
                  className="h-6 w-6 object-contain"
                  priority
                />
                <span className="text-sm font-medium text-white">DetailingOS</span>
              </div>
              <h1 className="text-4xl font-semibold tracking-tight text-white lg:text-5xl">
                {tServer(locale, "auth.login.heroTitle")}
              </h1>
              <p className="text-base leading-relaxed text-white/70">
                {tServer(locale, "auth.login.heroSubtitle")}
              </p>
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="group rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition-colors hover:border-white/20 hover:bg-white/10">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
                  <Clock className="h-5 w-5 text-white/80" />
                </div>
                <div className="font-medium text-white">5-Second Overview</div>
                <div className="mt-1 text-xs text-white/60">
                  {tServer(locale, "auth.login.feature1.body")}
                </div>
              </div>
              <div className="group rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition-colors hover:border-white/20 hover:bg-white/10">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
                  <Zap className="h-5 w-5 text-white/80" />
                </div>
                <div className="font-medium text-white">2-Click Updates</div>
                <div className="mt-1 text-xs text-white/60">
                  {tServer(locale, "auth.login.feature2.body")}
                </div>
              </div>
              <div className="group rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition-colors hover:border-white/20 hover:bg-white/10">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
                  <Shield className="h-5 w-5 text-white/80" />
                </div>
                <div className="font-medium text-white">Secure & Private</div>
                <div className="mt-1 text-xs text-white/60">
                  {tServer(locale, "auth.login.feature3.body")}
                </div>
              </div>
              <div className="group rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition-colors hover:border-white/20 hover:bg-white/10">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
                  <BarChart3 className="h-5 w-5 text-white/80" />
                </div>
                <div className="font-medium text-white">Live Analytics</div>
                <div className="mt-1 text-xs text-white/60">
                  {tServer(locale, "auth.login.feature4.body")}
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
