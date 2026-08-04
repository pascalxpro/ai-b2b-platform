import type { PageSignals } from './pageFetch';
import { checkPhoneNumbers } from './phone';

/**
 * Combines page signals into one verdict for a candidate that entered the
 * pipeline as TLD-unverified (a generic .com/.net/.org domain — see
 * searchService's countryConfidence). This is the "擷取 + 過濾" step:
 * upgrade a candidate to verified, downgrade/exclude it as not-a-company or
 * wrong-country, or leave it exactly where it was if nothing conclusive
 * came back.
 */

export type EnrichmentVerdict =
  | 'verified'       // phone number confirms one of the target countries
  | 'wrong-country'  // phone number confirms a DIFFERENT specific country
  | 'not-company'    // page reads as an article/directory/wiki, not a business
  | 'unverified';    // fetch failed, or no signal was conclusive either way

export interface EnrichmentResult {
  verdict: EnrichmentVerdict;
  /** Replaces the search-engine-derived name when a real site name was found. */
  companyName?: string;
  /** Chinese label of the confirmed country, set for 'verified'. */
  matchedCountry?: string;
  phoneCountries: string[];
  reason: string;
}

export function classifySignals(signals: PageSignals, targetCountries: string[]): EnrichmentResult {
  if (!signals.fetchOk) {
    return { verdict: 'unverified', phoneCountries: [], reason: '無法擷取頁面內容（逾時、連線失敗或非 HTML）' };
  }

  const phone = checkPhoneNumbers(signals.textSample, targetCountries);

  // Phone evidence is checked before the article-path heuristic: a page can
  // sit at a "/blog/" path and still be a real company's press page, so a
  // confirmed matching phone number should win over a structural guess.
  if (phone.matchedTarget) {
    return {
      verdict: 'verified',
      companyName: signals.siteName,
      matchedCountry: phone.matchedTarget,
      phoneCountries: phone.countries,
      reason: `電話號碼確認位於目標國家（${phone.sampleNumber || phone.matchedTarget}）`,
    };
  }

  if (phone.found && targetCountries.length > 0) {
    // A phone number was found, but for a different, specific country — the
    // exact "searched Japan, got a Taiwan company" case from the original bug.
    return {
      verdict: 'wrong-country',
      companyName: signals.siteName,
      phoneCountries: phone.countries,
      reason: `電話號碼顯示位於其他國家（${phone.countries.join(', ')}），與搜尋目標不符`,
    };
  }

  if (signals.looksLikeArticlePath) {
    return {
      verdict: 'not-company',
      companyName: signals.siteName,
      phoneCountries: phone.countries,
      reason: '網址路徑符合文章／名錄／百科結構，非企業官網',
    };
  }

  // No phone found and the path doesn't look like an article: could genuinely
  // be a company that just doesn't list a phone number, or could be a company
  // whose contact info is loaded by client-side JS we can't see. Either way,
  // there's no basis to move it — leave the original TLD-based confidence.
  return {
    verdict: 'unverified',
    companyName: signals.siteName,
    phoneCountries: phone.countries,
    reason: '頁面內容未包含可判斷國別的電話號碼',
  };
}
