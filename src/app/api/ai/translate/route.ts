export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { loadSettingsFromDb } from '@/lib/settings/settingsService';
import { requireAuth } from '@/lib/auth/guard';

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { text, targetLang } = await request.json();

    if (!text || !targetLang) {
      return NextResponse.json({ error: 'Missing text or targetLang' }, { status: 400 });
    }

    const settings = await loadSettingsFromDb();
    const { aiProvider, aiApiKey, aiModel, aiBaseUrl } = settings;

    if (!aiApiKey && aiProvider === 'gemini') {
      return NextResponse.json({ error: 'AI API Key 未設定，請在系統管理中設定 Google AI API Key' }, { status: 400 });
    }

    const LANG_MAP: Record<string, string> = {
      'ja': 'Japanese', 'en': 'English', 'ko': 'Korean',
      'vi': 'Vietnamese', 'th': 'Thai', 'de': 'German',
      'fr': 'French', 'es': 'Spanish', 'it': 'Italian',
      'pt': 'Portuguese', 'id': 'Indonesian', 'ms': 'Malay',
      'zh-TW': 'Traditional Chinese', 'zh-CN': 'Simplified Chinese',
    };

    const langName = LANG_MAP[targetLang] || targetLang;

    const prompt = `You are a professional B2B business translator. Translate the following search query into ${langName}. 
The text describes a business search intent for finding companies/suppliers/distributors.
Keep it natural and use industry-standard terminology in the target language.
Only output the translated text, nothing else.

Text to translate:
${text}`;

    let translatedText = '';

    if (aiProvider === 'gemini') {
      // Google Gemini API
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${aiModel || 'gemini-3.5-flash-lite'}:generateContent?key=${aiApiKey}`;
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 500,
          },
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error('[AI Translate] Gemini error:', errText);
        // Forward Google's own message — it names the actual cause (unsupported
        // location, bad model, bad key). Returning only the status code left the
        // UI showing a bare "Gemini API 錯誤: 400" with nothing to act on.
        let detail = errText;
        try {
          detail = JSON.parse(errText)?.error?.message || errText;
        } catch { /* non-JSON body: fall back to the raw text */ }
        return NextResponse.json(
          { error: `Gemini API 錯誤 (${res.status}): ${String(detail).substring(0, 300)}` },
          { status: 500 }
        );
      }

      const data = await res.json();
      translatedText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    } else if (aiProvider === 'ollama') {
      // Ollama local API
      const baseUrl = aiBaseUrl || 'http://localhost:11434';
      const res = await fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: aiModel || 'llama3',
          prompt,
          stream: false,
        }),
      });

      if (!res.ok) {
        return NextResponse.json({ error: `Ollama API 錯誤: ${res.status}` }, { status: 500 });
      }

      const data = await res.json();
      translatedText = data.response?.trim() || '';
    } else if (aiProvider === 'lmstudio') {
      // LM Studio (OpenAI-compatible API)
      const baseUrl = aiBaseUrl || 'http://localhost:1234';
      const res = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: aiModel || 'local-model',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 500,
        }),
      });

      if (!res.ok) {
        return NextResponse.json({ error: `LM Studio API 錯誤: ${res.status}` }, { status: 500 });
      }

      const data = await res.json();
      translatedText = data.choices?.[0]?.message?.content?.trim() || '';
    }

    if (!translatedText) {
      return NextResponse.json({ error: '翻譯結果為空' }, { status: 500 });
    }

    return NextResponse.json({ translatedText, targetLang, langName });
  } catch (error: any) {
    console.error('[AI Translate] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
