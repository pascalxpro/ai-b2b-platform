import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js';

/**
 * Phone-number-based country verification.
 *
 * Deliberately phone-only, not address: phone numbers have an international
 * standard format (+81, +886, ...) that a library can parse reliably.
 * Addresses have no such standard — Japan writes largest-unit-first, the US
 * smallest-first, and every country uses its own postal code shape and place
 * names — so parsing them would mean a pile of per-country regexes with a
 * poor accuracy-to-effort ratio. Chosen deliberately over address parsing.
 */

// Maps our Chinese country labels (used throughout searchService) to the ISO
// 3166-1 alpha-2 codes libphonenumber-js expects.
export const COUNTRY_TO_ISO: Record<string, CountryCode> = {
  '日本': 'JP', '台灣': 'TW', '美國': 'US', '越南': 'VN', '泰國': 'TH',
  '德國': 'DE', '韓國': 'KR', '中國': 'CN', '印尼': 'ID', '馬來西亞': 'MY',
  '印度': 'IN', '英國': 'GB', '法國': 'FR', '義大利': 'IT', '西班牙': 'ES',
  '澳洲': 'AU', '菲律賓': 'PH', '新加坡': 'SG',
};

const ISO_TO_COUNTRY: Record<string, string> = Object.fromEntries(
  Object.entries(COUNTRY_TO_ISO).map(([label, iso]) => [iso, label])
);

/** Chinese label for an ISO code, if it's one of ours; otherwise the raw code. */
export function isoToCountryLabel(iso: string): string {
  return ISO_TO_COUNTRY[iso] || iso;
}

export interface PhoneCheckResult {
  /** True if at least one phone number on the page resolved to a real country. */
  found: boolean;
  /** ISO country codes of every distinct number found, e.g. ["JP", "TW"]. */
  countries: string[];
  /** Which of the requested target countries (Chinese label) matched, if any. */
  matchedTarget?: string;
  /** The first valid E.164 number found, for storing as evidence. */
  sampleNumber?: string;
}

// Loose net: matches strings that merely look phone-shaped (digits with
// typical separators). libphonenumber-js does the real validation afterward,
// so a permissive regex here just maximizes what gets a chance to be checked.
const PHONE_CANDIDATE = /(\+?\d[\d\s().-]{7,18}\d)/g;

/**
 * Scans page text for phone numbers and reports which countries they belong
 * to. A page can legitimately list several offices, so this returns every
 * country found, and separately whether any of them is one of the countries
 * being searched for (a task can target more than one).
 *
 * Only numbers already in international format (a leading "+" and country
 * code, e.g. "+81-3-...") are accepted as evidence.
 *
 * An earlier version also accepted local-format numbers (e.g. "02-2345-6789")
 * by validating them against each target country as a "default region" hint.
 * That turned out to be unsound: `isValid()` only checks whether a number's
 * digit count and pattern are *plausible* for the assumed region, not that it
 * actually originates there. Confirmed experimentally — "02-2345-6789"
 * validates as a plausible number under BOTH Japan's and Taiwan's numbering
 * plans. Using it as a hint would have reintroduced the same kind of false
 * positive this feature exists to eliminate, just from a different mechanism.
 * The tradeoff is reduced recall (a page whose only phone number is written
 * in local format contributes no evidence), which is the correct tradeoff
 * here: classifySignals treats "no phone found" as 'unverified' — no harm —
 * whereas a wrong country attribution is the exact failure mode being fixed.
 */
export function checkPhoneNumbers(pageText: string, targetCountries: string[] = []): PhoneCheckResult {
  const candidates = pageText.match(PHONE_CANDIDATE) || [];
  const targetIsos = new Set(targetCountries.map(c => COUNTRY_TO_ISO[c]).filter(Boolean));

  const countries = new Set<string>();
  let sampleNumber: string | undefined;

  for (const raw of candidates) {
    if (!raw.trim().startsWith('+')) continue; // unambiguous international format only
    const parsed = parsePhoneNumberFromString(raw);
    if (parsed?.isValid()) {
      countries.add(parsed.country || 'UNKNOWN');
      if (!sampleNumber) sampleNumber = parsed.number;
    }
  }

  const matchedIso = [...targetIsos].find(iso => countries.has(iso));

  return {
    found: countries.size > 0,
    countries: [...countries],
    matchedTarget: matchedIso ? isoToCountryLabel(matchedIso) : undefined,
    sampleNumber,
  };
}
