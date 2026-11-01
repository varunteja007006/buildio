const EURO_REGIONS = new Set(
  "AD AT BE BG CY DE EE ES FI FR GR HR IE IT LT LU LV MC ME MT NL PT SI SK SM VA XK".split(
    " ",
  ),
);

/** Browsers expose a locale, not a currency; suggest one of our supported symbols. */
export function currencyForLocale(locale: string): string {
  try {
    const region = new Intl.Locale(locale).maximize().region ?? "";
    if (EURO_REGIONS.has(region)) return "€";
    if (["GB", "GG", "IM", "JE"].includes(region)) return "£";
    if (region === "IN") return "₹";
    if (region === "JP" || region === "CN") return "¥";
  } catch {
    // Invalid or unavailable locale information uses the existing default.
  }
  return "$";
}
