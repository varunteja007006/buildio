export function formatMoney(cents: number, currency: string): string {
  const negative = cents < 0;
  const abs = Math.abs(cents);
  const major = Math.floor(abs / 100);
  const minor = String(abs % 100).padStart(2, "0");
  return `${negative ? "-" : ""}${currency}${major}.${minor}`;
}

/** Decimal strings only; do not round user input or accept unsafe integer cents. */
export function parseAmountToCents(input: string): number {
  const normalized = input.replace(",", ".").trim();
  if (!/^(?:\d+(?:\.\d{0,2})?|\.\d{1,2})$/.test(normalized)) return Number.NaN;
  const [major = "0", minor = ""] = normalized.split(".");
  const cents = Number(major) * 100 + Number(minor.padEnd(2, "0"));
  return Number.isSafeInteger(cents) && cents > 0 ? cents : Number.NaN;
}
