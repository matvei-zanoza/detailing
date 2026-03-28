"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Mail, Lock } from "lucide-react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useI18n } from "@/components/i18n/i18n-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, setIsPending] = useState(false);
  const { t } = useI18n();

  const next = params.get("next") ?? "/dashboard";
  const error = params.get("error");

  useEffect(() => {
    if (error === "missing_profile") {
      toast.error(t("auth.login.toast.missingProfileTitle"), {
        description: t("auth.login.toast.missingProfileBody"),
      });
    }
  }, [error, t]);

  const schema = z.object({
    email: z.string().email(t("auth.login.validation.emailInvalid")),
    password: z.string().min(8, t("auth.login.validation.passwordMin")),
  });

  type FormValues = z.infer<typeof schema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  async function signIn(email: string, password: string) {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function onSubmit(values: FormValues) {
    setIsPending(true);
    try {
      await signIn(values.email, values.password);
      toast.success(t("auth.login.toast.welcomeBack"));
      router.replace(next);
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : t("auth.login.toast.checkCredentials");
      const isNotConfirmed = msg.toLowerCase().includes("email") && msg.toLowerCase().includes("confirm");
      toast.error(t("auth.login.toast.loginFailed"), {
        description: isNotConfirmed
          ? t("auth.login.toast.confirmEmail")
          : msg,
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/30 backdrop-blur-xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center">
            <Image
              src="/images/logo-v2.png"
              alt="DetailingOS"
              width={64}
              height={64}
              className="h-16 w-16 object-contain"
              priority
            />
          </div>
          <h2 className="text-2xl font-semibold text-white">{t("auth.login.form.title")}</h2>
          <p className="mt-2 text-sm text-white/60">
            {t("auth.login.form.subtitle")}
          </p>
        </div>

        {/* Form */}
        <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-white/80">
              {t("auth.login.form.emailLabel")}
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder={t("auth.login.form.emailPlaceholder")}
                className="h-11 border-white/10 bg-white/5 pl-10 text-white placeholder:text-white/30 transition-colors focus:bg-white/10 focus:border-primary/50"
                {...form.register("email")}
              />
            </div>
            {form.formState.errors.email && (
              <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-white/80">
              {t("auth.login.form.passwordLabel")}
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder={t("auth.login.form.passwordPlaceholder")}
                className="h-11 border-white/10 bg-white/5 pl-10 text-white placeholder:text-white/30 transition-colors focus:bg-white/10 focus:border-primary/50"
                {...form.register("password")}
              />
            </div>
            {form.formState.errors.password && (
              <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="h-11 w-full text-sm font-semibold bg-primary hover:bg-primary/90"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("auth.login.form.signingIn")}
              </>
            ) : (
              t("auth.login.form.submit")
            )}
          </Button>
        </form>

        {/* Footer */}
        <div className="mt-6 border-t border-white/10 pt-6">
          <p className="text-center text-xs text-white/40">
            {t("auth.login.form.footer.newHere")}{" "}
            <Link href="/signup" className="text-white/70 hover:text-white">
              {t("auth.login.form.footer.createAccount")}
            </Link>
          </p>
          <p className="text-center text-xs text-white/40">
            {t("auth.login.form.footer.demoNote")}
          </p>
        </div>
      </div>
    </div>
  );
}
