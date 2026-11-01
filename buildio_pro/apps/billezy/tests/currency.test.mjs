import assert from "node:assert/strict";
import test from "node:test";

import { currencyForLocale } from "../lib/currency.ts";

test("suggests a supported currency from the browser locale, with a dollar fallback", () => {
  for (const [locale, expected] of [
    ["en-IN", "₹"],
    ["hi", "₹"],
    ["en-GB", "£"],
    ["ja-JP", "¥"],
    ["zh-CN", "¥"],
    ["de-DE", "€"],
    ["bg-BG", "€"],
    ["fr-CH", "$"],
    ["en-US", "$"],
    ["en", "$"],
    ["", "$"],
    ["not_a_locale", "$"],
  ]) {
    assert.equal(currencyForLocale(locale), expected, locale);
  }
});
