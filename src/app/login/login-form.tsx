"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type FormValues = z.infer<typeof schema>;

type DemoPreset = {
  label: string;
  email: string;
};

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [demoPending, setDemoPending] = useState<string | null>(null);

  const next = params.get("next") ?? "/dashboard";

  const presets = useMemo<DemoPreset[]>(
    () => [
      { label: "BlackMirror (Owner)", email: "owner.blackmirror@example.com" },
      { label: "UrbanGloss (Manager)", email: "manager.urbangloss@example.com" },
      { label: "Apex Ceramic (Staff)", email: "staff.apex-ceramic@example.com" },
    ],
    [],
  );

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

  async function onDemo(email: string) {
    try {
      setDemoPending(email);
      const password = process.env.NEXT_PUBLIC_DEMO_DEFAULT_PASSWORD;
      if (!password) {
        toast.error("Missing demo password", {
          description: "Set NEXT_PUBLIC_DEMO_DEFAULT_PASSWORD in .env.local",
        });
        return;
      }
      await signIn(email, password);
      toast.success("Signed in to demo");
      router.replace("/dashboard");
      router.refresh();
    } catch (e) {
      toast.error("Demo login failed", {
        description: e instanceof Error ? e.message : "Seed the demo users first",
      });
    } finally {
      setDemoPending(null);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>
          DetailingOS CRM demo uses sanitized fictional data.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
            {form.formState.errors.email && (
              <div className="text-xs text-destructive">{form.formState.errors.email.message}</div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" autoComplete="current-password" {...form.register("password")} />
            {form.formState.errors.password && (
              <div className="text-xs text-destructive">{form.formState.errors.password.message}</div>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <div className="text-xs text-muted-foreground">Demo login</div>
            <Separator className="flex-1" />
          </div>
          <div className="grid gap-2">
            {presets.map((p) => (
              <Button
                key={p.email}
                type="button"
                variant="outline"
                onClick={() => onDemo(p.email)}
                disabled={demoPending !== null}
              >
                {demoPending === p.email ? "Signing in…" : p.label}
              </Button>
            ))}
          </div>
          <div className="text-xs text-muted-foreground">
            Demo password is controlled via <span className="font-mono">NEXT_PUBLIC_DEMO_DEFAULT_PASSWORD</span>.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
