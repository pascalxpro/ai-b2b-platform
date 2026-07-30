export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    providers: {},
  };

  const testQuery = '日本 食品容器 貿易商 經銷商';

  // Test 1: DuckDuckGo POST
  try {
    const ddgStart = Date.now();
    const ddgRes = await fetch('https://html.duckduckgo.com/html/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      body: `q=${encodeURIComponent(testQuery)}&b=`,
    });

    const ddgHtml = await ddgRes.text();
    const ddgLinks = (ddgHtml.match(/class="result__a"/g) || []).length;
    const ddgUddgLinks = (ddgHtml.match(/uddg=/g) || []).length;

    diagnostics.providers.duckduckgo = {
      status: ddgRes.status,
      htmlLength: ddgHtml.length,
      resultCount: ddgLinks,
      uddgCount: ddgUddgLinks,
      timeMs: Date.now() - ddgStart,
      htmlSample: ddgHtml.substring(0, 500),
    };
  } catch (e: any) {
    diagnostics.providers.duckduckgo = { error: e.message };
  }

  // Test 2: Yahoo
  try {
    const yStart = Date.now();
    const yRes = await fetch(`https://search.yahoo.com/search?p=${encodeURIComponent(testQuery)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });

    const yHtml = await yRes.text();
    const yLinks = (yHtml.match(/https%3a%2f%2f[^"&]+/gi) || [])
      .map((m: string) => decodeURIComponent(m).split('/RK=')[0])
      .filter((u: string) => u.startsWith('http') && !u.includes('yahoo.com') && !u.includes('uservoice.com'));

    diagnostics.providers.yahoo = {
      status: yRes.status,
      htmlLength: yHtml.length,
      extractedLinkCount: yLinks.length,
      sampleLinks: yLinks.slice(0, 5),
      timeMs: Date.now() - yStart,
    };
  } catch (e: any) {
    diagnostics.providers.yahoo = { error: e.message };
  }

  // Test 3: Check fetch / DNS / Network
  try {
    const netRes = await fetch('https://api.ipify.org?format=json');
    const netData = await netRes.json();
    diagnostics.network = { publicIp: netData.ip };
  } catch (e: any) {
    diagnostics.network = { error: e.message };
  }

  return NextResponse.json(diagnostics);
}
