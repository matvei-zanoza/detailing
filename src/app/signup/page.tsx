import { Suspense } from "react";
import Image from "next/image";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRequestLocale, t as tServer } from "@/lib/i18n/server";
import { SignupForm } from "./signup-form";
import { LoginBackground } from "../login/login-background";

export default async function SignupPage() {
  const locale = await getRequestLocale();
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <LoginBackground />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1200px] items-center justify-center p-6">
        <div className="grid w-full grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div className="space-y-8">
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
                {tServer(locale, "auth.signup.title")}
              </h1>
              <p className="text-base leading-relaxed text-white/70">
                {tServer(locale, "auth.signup.subtitle")}
              </p>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <Suspense>
              <SignupForm />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
