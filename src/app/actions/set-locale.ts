"use server";

import { cookies } from "next/headers";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/lib/i18n/messages";

export async function setLocale(nextLocale: Locale) {
  const locale = isLocale(nextLocale) ? nextLocale : DEFAULT_LOCALE;

  const cookieStore = await cookies();
  cookieStore.set("crm_locale", locale, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await supabase.from("user_profiles").update({ locale }).eq("id", user.id);
  }

  return { ok: true };
}
