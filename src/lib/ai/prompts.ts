/**
 * Prompt construction shared by the server routes and the browser-side caller.
 *
 * Both call paths must produce byte-identical prompts, otherwise switching
 * between 伺服端 and 瀏覽端 would silently change search quality. Keeping the
 * builders here (pure functions, no server-only imports) is what makes that
 * guarantee hold.
 */

export const LANG_MAP: Record<string, string> = {
  ja: 'Japanese', en: 'English', ko: 'Korean',
  vi: 'Vietnamese', th: 'Thai', de: 'German',
  fr: 'French', es: 'Spanish', it: 'Italian',
  pt: 'Portuguese', id: 'Indonesian', ms: 'Malay',
  'zh-TW': 'Traditional Chinese', 'zh-CN': 'Simplified Chinese',
};

export const COUNTRY_LANG: Record<string, { lang: string; langCode: string }> = {
  '日本': { lang: 'Japanese', langCode: 'ja' },
  '台灣': { lang: 'Traditional Chinese', langCode: 'zh-TW' },
  '美國': { lang: 'English', langCode: 'en' },
  '韓國': { lang: 'Korean', langCode: 'ko' },
  '越南': { lang: 'Vietnamese', langCode: 'vi' },
  '泰國': { lang: 'Thai', langCode: 'th' },
  '德國': { lang: 'German', langCode: 'de' },
  '法國': { lang: 'French', langCode: 'fr' },
  '印尼': { lang: 'Indonesian', langCode: 'id' },
  '馬來西亞': { lang: 'Malay', langCode: 'ms' },
};

export function buildTranslatePrompt(text: string, targetLang: string): string {
  const langName = LANG_MAP[targetLang] || targetLang;
  return `You are a professional B2B business translator. Translate the following search query into ${langName}.
The text describes a business search intent for finding companies/suppliers/distributors.
Keep it natural and use industry-standard terminology in the target language.
Only output the translated text, nothing else.

Text to translate:
${text}`;
}

export interface OptimizeCriteria {
  queryText?: string;
  industries?: string[];
  companyTypes?: string[];
  keywords?: string[];
}

export function buildOptimizePrompt(criteria: OptimizeCriteria, country: string): string {
  const { queryText = '', industries = [], companyTypes = [], keywords = [] } = criteria;
  const langName = (COUNTRY_LANG[country] || { lang: country }).lang;

  return `You are a B2B search optimization expert. Given search criteria in Chinese, optimize and transform them into ${langName} for maximum search engine effectiveness.

IMPORTANT: Do NOT just translate literally. You must:
1. Convert the description into search-engine-friendly keyword combinations
2. Add common synonyms and local industry terms used in ${country}
3. Use terminology that businesses in ${country} actually use
4. Expand keywords to improve search coverage

Input criteria (Chinese):
- Description: ${queryText}
- Industries: ${industries.join(', ')}
- Company Types: ${companyTypes.join(', ')}
- Keywords: ${keywords.join(', ')}

Return ONLY a valid JSON object (no markdown, no code fences):
{
  "description": "optimized search query string",
  "industries": ["optimized industry 1", "optimized industry 2"],
  "companyTypes": ["optimized type 1", "optimized type 2"],
  "keywords": ["keyword1", "keyword2", "keyword3"]
}`;
}

/** Extracts the JSON payload, tolerating models that wrap it in code fences. */
export function parseOptimizeResponse(raw: string, country: string) {
  const match = raw.match(/\{[\s\S]*\}/);
  const parsed = JSON.parse(match ? match[0] : raw);
  const info = COUNTRY_LANG[country] || { lang: country, langCode: 'unknown' };
  return { ...parsed, langCode: info.langCode, langName: info.lang };
}
