import { Suspense } from "react";
import { redirect } from "next/navigation";

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
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-[1100px] items-center justify-center p-6">
        <div className="grid w-full grid-cols-1 gap-8 md:grid-cols-2 md:items-center">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-muted-foreground">
              DetailingOS CRM
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Run your detailing studio in one clean panel.
            </h1>
            <p className="text-sm text-muted-foreground">
              Bookings today, cars in progress, staff workload, customer history, and a visual workflow board.
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border p-3">
                <div className="font-medium">Fast morning scan</div>
                <div className="text-xs text-muted-foreground">Dashboard shows what matters.</div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="font-medium">2-click updates</div>
                <div className="text-xs text-muted-foreground">Move jobs through workflow.</div>
              </div>
            </div>
          </div>
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
