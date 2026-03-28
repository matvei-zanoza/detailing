"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Mail, Lock, User } from "lucide-react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useI18n } from "@/components/i18n/i18n-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SignupForm() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const { t } = useI18n();

  const schema = z.object({
    display_name: z.string().min(2, t("auth.signup.validation.displayNameMin")),
    email: z.string().email(t("auth.signup.validation.emailInvalid")),
    password: z.string().min(8, t("auth.signup.validation.passwordMin")),
  });

  type FormValues = z.infer<typeof schema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { display_name: "", email: "", password: "" },
  });

  async function onSubmit(values: FormValues) {
    setIsPending(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=/onboarding`;

      const { error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: { display_name: values.display_name },
          emailRedirectTo: redirectTo,
        },
      });

      if (error) throw error;

      toast.success(t("auth.signup.toast.checkEmailTitle"), {
        description: t("auth.signup.toast.checkEmailBody"),
      });

      router.replace("/login");
    } catch (e) {
      toast.error(t("auth.signup.toast.signupFailed"), {
        description: e instanceof Error ? e.message : t("common.tryAgain"),
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/30 backdrop-blur-xl">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-semibold text-white">{t("auth.signup.form.title")}</h2>
          <p className="mt-2 text-sm text-white/60">{t("auth.signup.form.subtitle")}</p>
        </div>

        <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="display_name" className="text-sm font-medium text-white/80">
              {t("auth.signup.form.displayNameLabel")}
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <Input
                id="display_name"
                className="h-11 border-white/10 bg-white/5 pl-10 text-white placeholder:text-white/30 transition-colors focus:bg-white/10 focus:border-primary/50"
                placeholder={t("auth.signup.form.displayNamePlaceholder")}
                {...form.register("display_name")}
              />
            </div>
            {form.formState.errors.display_name && (
              <p className="text-xs text-destructive">{form.formState.errors.display_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-white/80">
              {t("auth.signup.form.emailLabel")}
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder={t("auth.signup.form.emailPlaceholder")}
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
              {t("auth.signup.form.passwordLabel")}
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder={t("auth.signup.form.passwordPlaceholder")}
                className="h-11 border-white/10 bg-white/5 pl-10 text-white placeholder:text-white/30 transition-colors focus:bg-white/10 focus:border-primary/50"
                {...form.register("password")}
              />
            </div>
            {form.formState.errors.password && (
              <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="h-11 w-full text-sm font-semibold bg-primary hover:bg-primary/90" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("auth.signup.form.creating")}
              </>
            ) : (
              t("auth.signup.form.submit")
            )}
          </Button>
        </form>

        <div className="mt-6 border-t border-white/10 pt-6">
          <p className="text-center text-xs text-white/40">
            {t("auth.signup.form.footer.haveAccount")}{" "}
            <Link href="/login" className="text-white/70 hover:text-white">
              {t("auth.signup.form.footer.signIn")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
