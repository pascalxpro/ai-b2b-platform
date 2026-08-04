/**
 * Gemini model catalogue, shared by the admin settings page and the per-user
 * key dialog so the two cannot drift apart.
 *
 * Model IDs verified against ai.google.dev/gemini-api/docs/models. Quotas are
 * the free-tier limits reported by the account's rate-limit dashboard and can
 * change — they are shown in the UI because requests-per-day is the limit this
 * app actually hits first: optimize-search issues one request per target
 * country, so a 3-country search costs 3 requests.
 */

export interface GeminiModelInfo {
  id: string;
  name: string;
  /** Free-tier requests per minute. */
  rpm: number;
  /** Free-tier requests per day — the limit that usually bites first. */
  rpd: number;
  note?: string;
  /** Preview models generally require a billing-enabled project. */
  preview?: boolean;
}

export const GEMINI_MODELS: GeminiModelInfo[] = [
  { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash Lite', rpm: 15, rpd: 500, note: '推薦：額度最寬鬆' },
  { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite', rpm: 15, rpd: 500 },
  { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash', rpm: 5, rpd: 20, note: '品質較佳' },
  { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash', rpm: 5, rpd: 20 },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', rpm: 5, rpd: 20, note: '相容性最廣' },
  { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro', rpm: 5, rpd: 20, note: '最強', preview: true },
];

export const DEFAULT_MODEL_ID = 'gemini-3.5-flash-lite';

/** Single-line label used in <option> elements, where markup isn't available. */
export function modelLabel(m: GeminiModelInfo): string {
  const parts = [m.name];
  const detail = [`免費 ${m.rpm}/分、${m.rpd}/日`];
  if (m.note) detail.unshift(m.note);
  if (m.preview) detail.push('preview 需付費方案');
  parts.push(`（${detail.join('｜')}）`);
  return parts.join(' ');
}

export function findModel(id: string): GeminiModelInfo | undefined {
  return GEMINI_MODELS.find(m => m.id === id);
}
