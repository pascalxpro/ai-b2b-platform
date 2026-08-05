/**
 * Prompt construction shared by the server routes and the browser-side caller.
 *
 * Both call paths must produce byte-identical prompts, otherwise switching
 * between 伺服端 and 瀏覽端 would silently change search quality. Keeping the
 * builders here (pure functions, no server-only imports) is what makes that
 * guarantee hold.
 */

import { COUNTRIES, getCountry } from '@/lib/search/countries';

/** Language options for the standalone translate tool, derived from the
 *  country table so the two can't drift. */
export const LANG_MAP: Record<string, string> = Object.fromEntries(
  COUNTRIES.map(c => [c.langCode, c.lang])
);

export function buildTranslatePrompt(text: string, targetLang: string, country?: string): string {
  const info = getCountry(country);
  const langName = info?.lang || LANG_MAP[targetLang] || targetLang;
  // Region matters even within one language: a UK "stockist" and a US
  // "distributor" are the same role under different words, and English-only
  // guidance loses that.
  const region = info ? ` as used in ${info.en}` : '';

  return `You are a professional B2B sourcing translator. Translate the following search intent into ${langName}${region}.

The text describes a search for companies — suppliers, distributors, wholesalers, agents.

Rules:
- Use the trade vocabulary that companies in this market use about themselves, not textbook translation.
- Keep proper nouns, product model numbers and units unchanged.
- Do not add explanation, romanisation, or alternatives in brackets.

Output the translated text only.

Text:
${text}`;
}

export interface OptimizeCriteria {
  queryText?: string;
  industries?: string[];
  companyTypes?: string[];
  keywords?: string[];
}

/**
 * Turns Chinese criteria into search strings a local buyer would actually type.
 *
 * The previous version asked for a single "optimized search query string" plus
 * translated tag lists, with four one-line instructions and no examples. Three
 * problems it had, all fixed here:
 *
 *   1. It produced a sentence. Search engines want 3-7 term queries; a full
 *      sentence matches article prose, which is how directories and blog
 *      round-ups outranked actual manufacturers.
 *   2. "Use local terminology" is exactly the kind of abstract instruction a
 *      small model (Flash Lite) satisfies with a literal translation. The
 *      worked example below is what makes it concrete.
 *   3. Nothing kept out job boards and consumer marketplaces, which dominate
 *      these keyword spaces in every market.
 */
export function buildOptimizePrompt(criteria: OptimizeCriteria, country: string): string {
  const { queryText = '', industries = [], companyTypes = [], keywords = [] } = criteria;
  const info = getCountry(country);
  const langName = info?.lang || country;
  const enName = info?.en || country;
  const suffixes = info?.companySuffixes.join(' / ') || '';

  return `You are a B2B sourcing specialist who finds supplier companies in the ${enName} market.

Rewrite the Chinese criteria below into search-engine queries in ${langName} — the words a buyer or sourcing agent in ${enName} would actually type into a search engine to find real supplier companies.

RULES
1. Write queries, not sentences. 3-7 terms each. A full sentence matches articles and directories instead of company sites.
2. Use the short trade words the industry uses in ${enName}, not formal or textbook translation. Distribution roles in particular have local shorthand — use it.
3. Produce 4 queries that attack the goal from different angles: the product term, the trade/distribution role, an industry-specific term, and one combining a product term with a local company-form suffix${suffixes ? ` (${suffixes})` : ''} to bias toward company websites.
4. Vary the vocabulary between the queries. Four rephrasings of the same words add no coverage.
5. excludeTerms: words that pull in the wrong kind of page in this market — recruitment/job listings, consumer shopping marketplaces, and blog round-up or ranking articles. Give the local words, not English ones.
6. Never invent company names, brands, or place names that were not in the input.

WORKED EXAMPLE (input in Chinese, target 日本 / Japanese)
Input: 描述「找日本的塑膠杯、紙杯、食品容器的代理商與批發商」, 產業「食品包材」, 類型「代理商, 批發商」
Good output:
  queries: ["食品容器 卸 業務用", "紙コップ プラカップ 代理店 取扱店", "食品包装資材 商社 業務用", "使い捨て容器 卸売 株式会社"]
  keywords: ["食品容器", "紙コップ", "プラスチックカップ", "使い捨て容器", "業務用"]
  companyTypes: ["卸", "代理店", "商社", "取扱店"]
  industries: ["食品包装資材", "包装資材"]
  excludeTerms: ["求人", "通販", "楽天", "Amazon", "まとめ", "ランキング"]
Note what makes it good: 卸 / 商社 / 取扱店 are what the trade says; 販売代理業者 is a dictionary translation nobody searches for.

NOW DO THE SAME FOR ${enName} (${langName})
- Description: ${queryText || '(none)'}
- Industries: ${industries.join(', ') || '(none)'}
- Company Types: ${companyTypes.join(', ') || '(none)'}
- Keywords: ${keywords.join(', ') || '(none)'}

Return ONLY a valid JSON object, no markdown, no code fences, all values in ${langName}:
{
  "queries": ["query 1", "query 2", "query 3", "query 4"],
  "industries": ["..."],
  "companyTypes": ["..."],
  "keywords": ["..."],
  "excludeTerms": ["..."]
}`;
}

export interface OptimizedResult {
  queries: string[];
  industries: string[];
  companyTypes: string[];
  keywords: string[];
  excludeTerms: string[];
  langCode: string;
  langName: string;
}

const asStringArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.trim() !== '') : [];

/**
 * Extracts the JSON payload, tolerating models that wrap it in code fences.
 *
 * Every field is coerced to a string array. A model that returns `queries` as
 * a bare string, or omits a key, previously flowed straight into the UI and
 * then into the search as undefined — normalising here means one bad response
 * degrades coverage instead of breaking the run.
 */
export function parseOptimizeResponse(raw: string, country: string): OptimizedResult {
  const match = raw.match(/\{[\s\S]*\}/);
  const parsed = JSON.parse(match ? match[0] : raw);
  const info = getCountry(country);

  // Older responses (and any model that ignores the schema) may still send a
  // single "description" sentence instead of a queries array.
  const queries = asStringArray(parsed.queries);
  if (queries.length === 0 && typeof parsed.description === 'string' && parsed.description.trim()) {
    queries.push(parsed.description.trim());
  }

  return {
    queries,
    industries: asStringArray(parsed.industries),
    companyTypes: asStringArray(parsed.companyTypes),
    keywords: asStringArray(parsed.keywords),
    excludeTerms: asStringArray(parsed.excludeTerms),
    langCode: info?.langCode || 'unknown',
    langName: info?.lang || country,
  };
}
