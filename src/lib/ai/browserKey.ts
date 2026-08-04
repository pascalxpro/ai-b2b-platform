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

/** Masks a key for display, e.g. AIzaSy...pqM4 */
export function maskKey(key: string): string {
  if (!key) return '';
  return key.length > 12 ? `${key.slice(0, 6)}...${key.slice(-4)}` : '••••••';
}
