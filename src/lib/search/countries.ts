/**
 * The single source of truth for target-country data.
 *
 * This used to live in three places that had drifted apart: COUNTRY_INFO in
 * searchService (18 countries), COUNTRY_GL in the same file (18), and
 * COUNTRY_LANG in ai/prompts (10). Picking one of the 8 countries the prompt
 * table was missing produced a prompt that read "transform them into 義大利" —
 * the Chinese country name where the language name belonged.
 *
 * Pure data with no server-only imports, so the criteria builder can render
 * the picker from the same list the search and the prompts run on. A country
 * that isn't here cannot be selected, which is what keeps the three uses in
 * step from now on.
 */

export interface CountryInfo {
  /** Chinese display name — also the key used throughout criteriaJson. */
  name: string;
  /** English name, used in queries and as a geo hint to the engines. */
  en: string;
  /** Domain suffixes that positively identify the country. */
  tlds: string[];
  /** Language the search queries should be written in. */
  lang: string;
  langCode: string;
  /** Google/Serper country + language bias. */
  gl: string;
  hl: string;
  /**
   * Local legal company-form suffixes. Including one in a query is a cheap way
   * to hit a real company's own site instead of a directory listing about it.
   */
  companySuffixes: string[];
}

export const COUNTRIES: CountryInfo[] = [
  { name: '日本', en: 'Japan', tlds: ['.jp', '.co.jp'], lang: 'Japanese', langCode: 'ja', gl: 'jp', hl: 'ja', companySuffixes: ['株式会社', '有限会社', '合同会社'] },
  { name: '台灣', en: 'Taiwan', tlds: ['.tw', '.com.tw'], lang: 'Traditional Chinese', langCode: 'zh-TW', gl: 'tw', hl: 'zh-TW', companySuffixes: ['股份有限公司', '有限公司', '企業社'] },
  { name: '韓國', en: 'Korea', tlds: ['.kr', '.co.kr'], lang: 'Korean', langCode: 'ko', gl: 'kr', hl: 'ko', companySuffixes: ['주식회사', '(주)'] },
  { name: '美國', en: 'USA', tlds: ['.us'], lang: 'English', langCode: 'en', gl: 'us', hl: 'en', companySuffixes: ['Inc.', 'LLC', 'Corp.'] },
  { name: '中國', en: 'China', tlds: ['.cn', '.com.cn'], lang: 'Simplified Chinese', langCode: 'zh-CN', gl: 'cn', hl: 'zh-CN', companySuffixes: ['有限公司', '股份有限公司'] },
  { name: '越南', en: 'Vietnam', tlds: ['.vn'], lang: 'Vietnamese', langCode: 'vi', gl: 'vn', hl: 'vi', companySuffixes: ['Công ty TNHH', 'Công ty Cổ phần'] },
  { name: '泰國', en: 'Thailand', tlds: ['.th', '.co.th'], lang: 'Thai', langCode: 'th', gl: 'th', hl: 'th', companySuffixes: ['บริษัท', 'จำกัด'] },
  { name: '印尼', en: 'Indonesia', tlds: ['.id', '.co.id'], lang: 'Indonesian', langCode: 'id', gl: 'id', hl: 'id', companySuffixes: ['PT', 'CV'] },
  { name: '馬來西亞', en: 'Malaysia', tlds: ['.my', '.com.my'], lang: 'Malay', langCode: 'ms', gl: 'my', hl: 'ms', companySuffixes: ['Sdn Bhd', 'Berhad'] },
  { name: '新加坡', en: 'Singapore', tlds: ['.sg', '.com.sg'], lang: 'English', langCode: 'en', gl: 'sg', hl: 'en', companySuffixes: ['Pte Ltd', 'Pte. Ltd.'] },
  { name: '菲律賓', en: 'Philippines', tlds: ['.ph'], lang: 'English', langCode: 'en', gl: 'ph', hl: 'en', companySuffixes: ['Inc.', 'Corp.'] },
  { name: '印度', en: 'India', tlds: ['.in', '.co.in'], lang: 'English', langCode: 'en', gl: 'in', hl: 'en', companySuffixes: ['Pvt Ltd', 'Private Limited'] },
  { name: '德國', en: 'Germany', tlds: ['.de'], lang: 'German', langCode: 'de', gl: 'de', hl: 'de', companySuffixes: ['GmbH', 'AG', 'KG'] },
  { name: '法國', en: 'France', tlds: ['.fr'], lang: 'French', langCode: 'fr', gl: 'fr', hl: 'fr', companySuffixes: ['SARL', 'SAS', 'SA'] },
  { name: '義大利', en: 'Italy', tlds: ['.it'], lang: 'Italian', langCode: 'it', gl: 'it', hl: 'it', companySuffixes: ['S.r.l.', 'S.p.A.'] },
  { name: '西班牙', en: 'Spain', tlds: ['.es'], lang: 'Spanish', langCode: 'es', gl: 'es', hl: 'es', companySuffixes: ['S.L.', 'S.A.'] },
  { name: '英國', en: 'UK', tlds: ['.uk', '.co.uk'], lang: 'English', langCode: 'en', gl: 'uk', hl: 'en', companySuffixes: ['Ltd', 'Limited', 'PLC'] },
  { name: '澳洲', en: 'Australia', tlds: ['.au', '.com.au'], lang: 'English', langCode: 'en', gl: 'au', hl: 'en', companySuffixes: ['Pty Ltd'] },
];

const BY_NAME = new Map(COUNTRIES.map(c => [c.name, c]));

export function getCountry(name: string | undefined | null): CountryInfo | undefined {
  return name ? BY_NAME.get(name) : undefined;
}

/** Chinese names, for pickers. */
export const COUNTRY_NAMES = COUNTRIES.map(c => c.name);
