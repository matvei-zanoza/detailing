export function formatMoneyFromCents(
  cents: number,
  currency: string,
  locale: string = "en-US",
) {
  const effectiveLocale = currency === "THB" && locale === "en-US" ? "th-TH" : locale;
  return new Intl.NumberFormat(effectiveLocale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format((cents ?? 0) / 100);
}

export function titleCase(input: string) {
  return input
    .split("_")
    .map((s) => (s ? s[0]!.toUpperCase() + s.slice(1) : s))
    .join(" ");
}
