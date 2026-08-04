'use client';

/**
 * Per-user Gemini key held in the user's own browser.
 *
 * Deliberately NOT stored on the server: a single shared key sent to every
 * browser would be readable by anyone who opens DevTools, and Gemini's HTTP
 * referrer restrictions are known to be unreliable, so a leaked key could not
 * be locked down — only revoked. Keeping one key per user also means each
 * person spends their own free-tier quota (500 requests/day) instead of the
 * whole team sharing one allowance.
 */

const KEY_STORAGE = 'ai-b2b:gemini-key';
const MODEL_STORAGE = 'ai-b2b:gemini-model';

export function getBrowserGeminiKey(): string {
  if (typeof window === 'undefined') return '';
  try {
    return window.localStorage.getItem(KEY_STORAGE) || '';
  } catch {
    // localStorage can throw in private-browsing / blocked-cookie modes.
    return '';
  }
}

export function setBrowserGeminiKey(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    const trimmed = key.trim();
    if (trimmed) {
      window.localStorage.setItem(KEY_STORAGE, trimmed);
    } else {
      window.localStorage.removeItem(KEY_STORAGE);
    }
  } catch (e) {
    console.warn('[ai] Could not persist API key to localStorage:', e);
  }
}

export function clearBrowserGeminiKey(): void {
  setBrowserGeminiKey('');
}

/** Resolves which model to use: the user's override, else the team default. */
export function resolveModel(teamDefault: string): string {
  return getBrowserGeminiModel() || teamDefault;
}

/**
 * Optional per-user model override.
 *
 * Only meaningful in browser mode: there each user spends their own free-tier
 * quota, so the quality-versus-requests-per-day tradeoff is genuinely personal
 * (500/day on Flash Lite vs 20/day on the full Flash models). An empty value
 * means "follow the team default the admin configured".
 */
export function getBrowserGeminiModel(): string {
  if (typeof window === 'undefined') return '';
  try {
    return window.localStorage.getItem(MODEL_STORAGE) || '';
  } catch {
    return '';
  }
}

export function setBrowserGeminiModel(model: string): void {
  if (typeof window === 'undefined') return;
  try {
    if (model) {
      window.localStorage.setItem(MODEL_STORAGE, model);
    } else {
      window.localStorage.removeItem(MODEL_STORAGE);
    }
  } catch (e) {
    console.warn('[ai] Could not persist model preference:', e);
  }
}

/** Masks a key for display, e.g. AIzaSy...pqM4 */
export function maskKey(key: string): string {
  if (!key) return '';
  return key.length > 12 ? `${key.slice(0, 6)}...${key.slice(-4)}` : '••••••';
}
