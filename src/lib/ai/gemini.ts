/**
 * Isomorphic Gemini caller — identical behaviour whether it runs on the server
 * or in the user's browser.
 *
 * The browser path exists because Google blocks requests originating from
 * datacenter IPs ("User location is not supported"), which is what the Zeabur
 * container is. The same key called from a normal ISP connection works, so in
 * 瀏覽端 mode each user's browser makes the call with their own key.
 */

export const DEFAULT_GEMINI_MODEL = 'gemini-3.5-flash-lite';

export interface GeminiOptions {
  temperature?: number;
  maxOutputTokens?: number;
}

export class GeminiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'GeminiError';
    this.status = status;
  }
}

/** Pulls Google's own message out of an error body so callers can show the real cause. */
function extractMessage(body: string, status: number): string {
  try {
    const parsed = JSON.parse(body);
    const msg = parsed?.error?.message;
    if (msg) return String(msg).substring(0, 300);
  } catch {
    /* non-JSON body — fall through to the raw text */
  }
  return `HTTP ${status}: ${body.substring(0, 200)}`;
}

export async function callGemini(
  apiKey: string,
  model: string,
  prompt: string,
  options: GeminiOptions = {}
): Promise<string> {
  if (!apiKey) throw new GeminiError('未設定 Gemini API Key', 400);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${
    model || DEFAULT_GEMINI_MODEL
  }:generateContent?key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: options.temperature ?? 0.3,
        maxOutputTokens: options.maxOutputTokens ?? 500,
      },
    }),
  });

  if (!res.ok) {
    throw new GeminiError(extractMessage(await res.text(), res.status), res.status);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) throw new GeminiError('Gemini 回傳空結果', 502);
  return text;
}
