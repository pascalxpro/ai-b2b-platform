export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    providers: {},
  };

  const testQuery = 'Japan food container manufacturer wholesaler';

  // Helper: test a URL and return status + html length + sample
  async function testEngine(name: string, url: string, method: string = 'GET', body?: string) {
    const start = Date.now();
    try {
      const options: any = {
        method,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
        },
      };
      if (body) {
        options.body = body;
        options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      }
      const res = await fetch(url, options);
      const html = await res.text();

      // Count external links
      const externalLinks = (html.match(/https?:\/\/(?!.*(?:bing\.com|yahoo\.com|duckduckgo\.com|brave\.com|google\.com))[^"'\s<>]+/gi) || [])
        .filter((u: string) => !u.match(/\.(css|js|png|jpg|ico|svg)/i))
        .filter((v: string, i: number, a: string[]) => a.indexOf(v) === i)
        .slice(0, 10);

      return {
        status: res.status,
        htmlLength: html.length,
        externalLinkCount: externalLinks.length,
        sampleLinks: externalLinks.slice(0, 5),
        timeMs: Date.now() - start,
      };
    } catch (e: any) {
      return { error: e.message, timeMs: Date.now() - start };
    }
  }

  // Test all engines in parallel
  const [ddg, yahoo, bing, brave] = await Promise.all([
    testEngine('DuckDuckGo', 'https://html.duckduckgo.com/html/', 'POST', `q=${encodeURIComponent(testQuery)}&b=`),
    testEngine('Yahoo', `https://search.yahoo.com/search?p=${encodeURIComponent(testQuery)}`),
    testEngine('Bing', `https://www.bing.com/search?q=${encodeURIComponent(testQuery)}`),
    testEngine('Brave', `https://search.brave.com/search?q=${encodeURIComponent(testQuery)}`),
  ]);

  diagnostics.providers = { duckduckgo: ddg, yahoo, bing, brave };

  // Network info
  try {
    const netRes = await fetch('https://api.ipify.org?format=json');
    const netData = await netRes.json();
    diagnostics.network = { publicIp: netData.ip };
  } catch (e: any) {
    diagnostics.network = { error: e.message };
  }

  return NextResponse.json(diagnostics);
}
