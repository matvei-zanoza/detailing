import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Clock, Zap, Shield, BarChart3 } from "lucide-react";

import { LocaleToggle } from "@/components/app/locale-toggle";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRequestLocale, t as tServer } from "@/lib/i18n/server";
import { LoginForm } from "./login-form";
import { LoginBackground } from "./login-background";
import { LoginThemeToggle } from "./login-theme-toggle";
import { ShieldLogo } from "./shield-logo";

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

      <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
        <LoginThemeToggle />
        <LocaleToggle />
      </div>
      
      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1200px] items-center justify-center p-6">
        <div className="grid w-full grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          {/* Left Side - Brand & Features */}
          <div className="space-y-8">
            {/* Brand */}
            <div className="space-y-4">
              <div className="inline-flex items-center gap-3 rounded-full border border-foreground/20 bg-foreground/10 px-4 py-2 backdrop-blur-sm">
                <ShieldLogo size={24} />
                <span className="text-sm font-medium text-foreground">DetailingOS</span>
              </div>
              <h1 className="text-4xl font-semibold tracking-tight text-foreground lg:text-5xl">
                {tServer(locale, "auth.login.heroTitle")}
              </h1>
              <p className="text-base leading-relaxed text-muted-foreground">
                {tServer(locale, "auth.login.heroSubtitle")}
              </p>
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="group rounded-xl border border-foreground/10 bg-foreground/5 p-4 backdrop-blur-sm transition-colors hover:border-foreground/20 hover:bg-foreground/10">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-foreground/10">
                  <Clock className="h-5 w-5 text-foreground/80" />
                </div>
                <div className="font-medium text-foreground">{tServer(locale, "auth.login.feature1.title")}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {tServer(locale, "auth.login.feature1.body")}
                </div>
              </div>
              <div className="group rounded-xl border border-foreground/10 bg-foreground/5 p-4 backdrop-blur-sm transition-colors hover:border-foreground/20 hover:bg-foreground/10">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-foreground/10">
                  <Zap className="h-5 w-5 text-foreground/80" />
                </div>
                <div className="font-medium text-foreground">{tServer(locale, "auth.login.feature2.title")}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {tServer(locale, "auth.login.feature2.body")}
                </div>
              </div>
              <div className="group rounded-xl border border-foreground/10 bg-foreground/5 p-4 backdrop-blur-sm transition-colors hover:border-foreground/20 hover:bg-foreground/10">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-foreground/10">
                  <Shield className="h-5 w-5 text-foreground/80" />
                </div>
                <div className="font-medium text-foreground">{tServer(locale, "auth.login.feature3.title")}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {tServer(locale, "auth.login.feature3.body")}
                </div>
              </div>
              <div className="group rounded-xl border border-foreground/10 bg-foreground/5 p-4 backdrop-blur-sm transition-colors hover:border-foreground/20 hover:bg-foreground/10">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-foreground/10">
                  <BarChart3 className="h-5 w-5 text-foreground/80" />
                </div>
                <div className="font-medium text-foreground">{tServer(locale, "auth.login.feature4.title")}</div>
                <div className="mt-1 text-xs text-muted-foreground">
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
