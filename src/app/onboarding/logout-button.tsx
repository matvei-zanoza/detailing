"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

import { Button } from "@/components/ui/button";

export function LogoutButton({ children }: { children: ReactNode }) {
  const router = useRouter();

  async function onLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <Button variant="ghost" onClick={onLogout}>
      {children}
    </Button>
  );
}
