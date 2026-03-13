"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Sparkles, Mail, Lock } from "lucide-react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type FormValues = z.infer<typeof schema>;

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const next = params.get("next") ?? "/dashboard";

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  async function signIn(email: string, password: string) {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      try {
        await signIn(values.email, values.password);
        toast.success("Welcome back");
        router.replace(next);
        router.refresh();
      } catch (e) {
        toast.error("Login failed", {
          description: e instanceof Error ? e.message : "Please check your credentials",
        });
      }
    });
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-border/50 bg-card/80 p-8 shadow-2xl shadow-black/20 backdrop-blur-sm">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/20">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">Welcome back</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to your DetailingOS account
          </p>
        </div>

        {/* Form */}
        <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-foreground">
              Email address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="name@studio.com"
                className="h-11 bg-muted/30 pl-10 transition-colors focus:bg-muted/50"
                {...form.register("email")}
              />
            </div>
            {form.formState.errors.email && (
              <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-foreground">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                className="h-11 bg-muted/30 pl-10 transition-colors focus:bg-muted/50"
                {...form.register("password")}
              />
            </div>
            {form.formState.errors.password && (
              <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="h-11 w-full text-sm font-medium"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign in to Dashboard"
            )}
          </Button>
        </form>

        {/* Footer */}
        <div className="mt-6 border-t border-border/50 pt-6">
          <p className="text-center text-xs text-muted-foreground">
            Demo uses sanitized fictional data for testing purposes.
          </p>
        </div>
      </div>
    </div>
  );
}
