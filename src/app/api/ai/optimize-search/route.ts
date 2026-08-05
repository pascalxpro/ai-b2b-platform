export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { loadSettingsFromDb } from '@/lib/settings/settingsService';
import { requireAuth } from '@/lib/auth/guard';
import { buildOptimizePrompt, parseOptimizeResponse, type OptimizedResult } from '@/lib/ai/prompts';

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { criteria } = body;
    // A task targets one country. targetCountries is still accepted so an
    // older client (or a saved payload) keeps working; only the first is used.
    const targetCountry: string | undefined =
      body.targetCountry || (Array.isArray(body.targetCountries) ? body.targetCountries[0] : undefined);

    if (!criteria || !targetCountry) {
      return NextResponse.json({ error: 'Missing criteria or targetCountry' }, { status: 400 });
    }
    const targetCountries = [targetCountry];

    const settings = await loadSettingsFromDb();
    const { aiProvider, aiApiKey, aiModel, aiBaseUrl } = settings;

    if (!aiApiKey && aiProvider === 'gemini') {
      return NextResponse.json({ error: 'AI API Key 未設定，請在系統管理中設定 Google AI API Key' }, { status: 400 });
    }

    const { queryText = '', industries = [], companyTypes = [], keywords = [] } = criteria;
    const optimized: Record<string, OptimizedResult> = {};
    // Remembers why the per-country calls failed, so a run where every country
    // failed can report the real cause rather than silently returning nothing.
    let lastError = '';

    for (const country of targetCountries) {
      // Shared with the browser-side path so both modes send an identical prompt.
      const prompt = buildOptimizePrompt({ queryText, industries, companyTypes, keywords }, country);

      let aiResponseText = '';

      if (aiProvider === 'gemini') {
        // Fallback matches the settings default; gemini-1.5-flash is no longer
        // in the published model list.
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${aiModel || 'gemini-3.5-flash-lite'}:generateContent?key=${aiApiKey}`;
        const res = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              // Matches the browser path: the prompt asks for four different
              // angles, and a low temperature just rephrases the first.
              temperature: 0.7,
              maxOutputTokens: 1500,
            },
          }),
        });

        if (!res.ok) {
          const errText = await res.text();
          console.error(`[AI Optimize Search] Gemini error for ${country}:`, errText);
          try {
            lastError = JSON.parse(errText)?.error?.message || errText;
          } catch { lastError = errText; }
          lastError = `(${res.status}) ${String(lastError).substring(0, 300)}`;
          continue; // Skip this country on error and proceed to the next
        }

        const data = await res.json();
        aiResponseText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
      } else if (aiProvider === 'ollama') {
        const baseUrl = aiBaseUrl || 'http://localhost:11434';
        const res = await fetch(`${baseUrl}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: aiModel || 'llama3',
            prompt,
            stream: false,
            options: {
              temperature: 0.7,
              num_predict: 1500,
            }
          }),
        });

        if (!res.ok) {
          console.error(`[AI Optimize Search] Ollama error for ${country}:`, res.status);
          continue;
        }
        
        const data = await res.json();
        aiResponseText = data.response?.trim() || '';
      } else if (aiProvider === 'lmstudio') {
        const baseUrl = aiBaseUrl || 'http://localhost:1234';
        const res = await fetch(`${baseUrl}/v1/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: aiModel || 'local-model',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 1500,
          }),
        });

        if (!res.ok) {
          console.error(`[AI Optimize Search] LM Studio error for ${country}:`, res.status);
          continue;
        }

        const data = await res.json();
        aiResponseText = data.choices?.[0]?.message?.content?.trim() || '';
      }

      if (aiResponseText) {
        try {
          optimized[country] = parseOptimizeResponse(aiResponseText, country);
        } catch (err) {
          console.error(`[AI Optimize Search] JSON parsing error for ${country}:`, err, '\\nResponse:', aiResponseText);
        }
      }
    }

    // Every country failed — report it instead of returning an empty object,
    // which the client treated as success and rendered as a blank preview panel
    // with no indication that anything went wrong.
    if (Object.keys(optimized).length === 0) {
      return NextResponse.json(
        { error: lastError ? `AI 優化失敗：${lastError}` : 'AI 優化失敗：未取得任何結果' },
        { status: 502 }
      );
    }

    return NextResponse.json({ optimized });
  } catch (error: any) {
    console.error('[AI Optimize Search] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
