"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAppAdmin } from "@/lib/auth/require-app-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const schema = z.object({ email: z.string().email() });

export async function addAdminByEmail(raw: unknown) {
  await requireAppAdmin();

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid email" } as const;
  }

  const admin = createSupabaseAdminClient();
  const list = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const user = list.data?.users?.find((u) => (u.email ?? "").toLowerCase() === parsed.data.email.toLowerCase());

  if (!user) {
    return { ok: false, error: "User not found" } as const;
  }

  const { supabase } = await requireAppAdmin();
  const ins = await supabase.from("app_admins").upsert({ user_id: user.id });
  if (ins.error) {
    return { ok: false, error: ins.error.message ?? "Failed to add admin" } as const;
  }

  revalidatePath("/admin/admins");
  return { ok: true } as const;
}
