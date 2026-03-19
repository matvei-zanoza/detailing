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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  display_name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

type FormValues = z.infer<typeof schema>;

export function SignupForm() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

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

      toast.success("Check your email", {
        description: "We sent a confirmation link. After confirming, you'll be able to request studio access.",
      });

      router.replace("/login");
    } catch (e) {
      toast.error("Signup failed", {
        description: e instanceof Error ? e.message : "Please try again",
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/30 backdrop-blur-xl">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-semibold text-white">Create account</h2>
          <p className="mt-2 text-sm text-white/60">You will need admin approval to access a studio.</p>
        </div>

        <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="display_name" className="text-sm font-medium text-white/80">
              Display name
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <Input
                id="display_name"
                className="h-11 border-white/10 bg-white/5 pl-10 text-white placeholder:text-white/30 transition-colors focus:bg-white/10 focus:border-primary/50"
                placeholder="Your name"
                {...form.register("display_name")}
              />
            </div>
            {form.formState.errors.display_name && (
              <p className="text-xs text-destructive">{form.formState.errors.display_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-white/80">
              Email address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="name@studio.com"
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
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="Create a password"
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
                Creating...
              </>
            ) : (
              "Create account"
            )}
          </Button>
        </form>

        <div className="mt-6 border-t border-white/10 pt-6">
          <p className="text-center text-xs text-white/40">
            Already have an account?{" "}
            <Link href="/login" className="text-white/70 hover:text-white">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
