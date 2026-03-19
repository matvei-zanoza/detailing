import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/require-user";

export const requireSuperAdmin = cache(async () => {
  const { supabase, user } = await requireUser();

  const { data: isSuperAdmin, error } = await supabase.rpc("is_super_admin");

  if (error || !isSuperAdmin) {
    redirect("/dashboard");
  }

  return { supabase, user };
});
