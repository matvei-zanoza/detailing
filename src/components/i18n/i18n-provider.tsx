"use client";

import * as React from "react";

import type { Locale, Messages } from "@/lib/i18n/messages";

type I18nContextValue = {
  locale: Locale;
  messages: Messages;
  t: (key: string) => string;
};

const I18nContext = React.createContext<I18nContextValue | null>(null);

export function I18nProvider({
  locale,
  messages,
  children,
}: {
  locale: Locale;
  messages: Messages;
  children: React.ReactNode;
}) {
  const value = React.useMemo<I18nContextValue>(() => {
    return {
      locale,
      messages,
      t: (key: string) => messages[key] ?? key,
    };
  }, [locale, messages]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = React.useContext(I18nContext);
  if (!ctx) {
    return {
      locale: "en" as const,
      t: (key: string) => key,
    };
  }

  return { locale: ctx.locale, t: ctx.t };
}
