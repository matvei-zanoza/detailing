import "server-only";

import { cookies } from "next/headers";

import {
  DEFAULT_LOCALE,
  isLocale,
  MESSAGES_BY_LOCALE,
  type Locale,
} from "@/lib/i18n/messages";

export async function getRequestLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const raw = cookieStore.get("crm_locale")?.value;
  return isLocale(raw) ? raw : DEFAULT_LOCALE;
}

export function t(locale: Locale, key: string) {
  return MESSAGES_BY_LOCALE[locale][key] ?? key;
}
