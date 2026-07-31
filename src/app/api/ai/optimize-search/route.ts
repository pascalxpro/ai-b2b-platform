export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { loadSettingsFromDb } from '@/lib/settings/settingsService';

const COUNTRY_LANG: Record<string, { lang: string; langCode: string }> = {
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

export async function POST(request: NextRequest) {
  try {
    const { criteria, targetCountries } = await request.json();

    if (!criteria || !targetCountries || !Array.isArray(targetCountries)) {
      return NextResponse.json({ error: 'Missing criteria or targetCountries' }, { status: 400 });
    }

    const settings = await loadSettingsFromDb();
    const { aiProvider, aiApiKey, aiModel, aiBaseUrl } = settings;

    if (!aiApiKey && aiProvider === 'gemini') {
      return NextResponse.json({ error: 'AI API Key 未設定，請在系統管理中設定 Google AI API Key' }, { status: 400 });
    }

    const { queryText = '', industries = [], companyTypes = [], keywords = [] } = criteria;
    const optimized: Record<string, any> = {};

    for (const country of targetCountries) {
      const countryInfo = COUNTRY_LANG[country] || { lang: country, langCode: 'unknown' };
      const langName = countryInfo.lang;

      const prompt = `You are a B2B search optimization expert. Given search criteria in Chinese, optimize and transform them into ${langName} for maximum search engine effectiveness.

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

      let aiResponseText = '';

      if (aiProvider === 'gemini') {
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${aiModel || 'gemini-1.5-flash'}:generateContent?key=${aiApiKey}`;
        const res = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.4,
              maxOutputTokens: 1500,
            },
          }),
        });

        if (!res.ok) {
          const errText = await res.text();
          console.error(`[AI Optimize Search] Gemini error for ${country}:`, errText);
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
              temperature: 0.4,
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
            temperature: 0.4,
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
          // Extract JSON in case AI added markdown formatting like ```json ... ```
          const jsonMatch = aiResponseText.match(/\{[\s\S]*\}/);
          const jsonStr = jsonMatch ? jsonMatch[0] : aiResponseText;
          const parsed = JSON.parse(jsonStr);

          optimized[country] = {
            ...parsed,
            langCode: countryInfo.langCode,
            langName: countryInfo.lang
          };
        } catch (err) {
          console.error(`[AI Optimize Search] JSON parsing error for ${country}:`, err, '\\nResponse:', aiResponseText);
        }
      }
    }

    return NextResponse.json({ optimized });
  } catch (error: any) {
    console.error('[AI Optimize Search] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
