export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { provider, apiKey, model, baseUrl } = await request.json();

    if (provider === 'gemini') {
      if (!apiKey) {
        return NextResponse.json({ success: false, error: 'API Key 未填寫' });
      }
      // Fallback matches the settings default. gemini-2.0-flash-lite is no
      // longer in the published model list and would fail with a confusing
      // 404/400; a Flash Lite model also spends far less of the free-tier
      // daily quota (500 RPD vs 20 RPD) on what is only a connection test.
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model || 'gemini-3.5-flash-lite'}:generateContent?key=${apiKey}`;
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Say "Connection successful" in one short sentence.' }] }],
          generationConfig: { temperature: 0, maxOutputTokens: 50 },
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        return NextResponse.json({ success: false, error: `API 錯誤 (${res.status}): ${errText.substring(0, 200)}` });
      }

      const data = await res.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
      return NextResponse.json({ success: true, reply, model });
    }

    if (provider === 'ollama') {
      const url = baseUrl || 'http://localhost:11434';
      const res = await fetch(`${url}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: model || 'llama3', prompt: 'Say hello', stream: false }),
      });
      if (!res.ok) {
        return NextResponse.json({ success: false, error: `Ollama 連線失敗 (${res.status})` });
      }
      const data = await res.json();
      return NextResponse.json({ success: true, reply: data.response?.trim(), model });
    }

    if (provider === 'lmstudio') {
      const url = baseUrl || 'http://localhost:1234';
      const res = await fetch(`${url}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model || 'local-model',
          messages: [{ role: 'user', content: 'Say hello' }],
          max_tokens: 50,
        }),
      });
      if (!res.ok) {
        return NextResponse.json({ success: false, error: `LM Studio 連線失敗 (${res.status})` });
      }
      const data = await res.json();
      return NextResponse.json({ success: true, reply: data.choices?.[0]?.message?.content?.trim(), model });
    }

    return NextResponse.json({ success: false, error: '不支援的 AI 提供商' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
