export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  const diag: any = { timestamp: new Date().toISOString() };

  try {
    // Get the latest search task from DB
    const task = await prisma.searchTask.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    if (!task) {
      diag.error = 'No tasks found';
      return NextResponse.json(diag);
    }

    diag.taskId = task.id;
    diag.queryText = task.queryText;
    diag.criteriaJson = task.criteriaJson;

    // Build the same query as searchService
    const crit = (task.criteriaJson as any) || {};
    const countriesStr = Array.isArray(crit.countries) ? crit.countries.join(' ') : '';
    const industriesStr = Array.isArray(crit.industries) ? crit.industries.join(' ') : '';
    const keywordsStr = Array.isArray(crit.keywords) ? crit.keywords.join(' ') : '';
    const companyTypesStr = Array.isArray(crit.companyTypes) ? crit.companyTypes.join(' ') : '';

    const queryParts = [
      task.queryText || crit.queryText || '',
      countriesStr,
      industriesStr,
      keywordsStr,
      companyTypesStr
    ].filter(Boolean);

    const fullQuery = queryParts.join(' ').trim();
    diag.builtFullQuery = fullQuery;
    diag.builtFullQueryLength = fullQuery.length;

    // Test Yahoo search with this exact query from DB
    const yahooUrl = `https://search.yahoo.com/search?p=${encodeURIComponent(fullQuery)}`;
    diag.yahooUrl = yahooUrl;

    const yahooRes = await fetch(yahooUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });

    const yahooHtml = await yahooRes.text();
    diag.yahooHttpStatus = yahooRes.status;
    diag.yahooHtmlLength = yahooHtml.length;

    // Extract links using the proven method
    const ruMatches = yahooHtml.match(/https%3a%2f%2f[^"&\s]+/gi) || [];
    const seen = new Set<string>();
    const results: any[] = [];

    for (const rawRu of ruMatches) {
      let decoded = '';
      try { decoded = decodeURIComponent(rawRu); } catch { continue; }
      decoded = decoded.split('/RK=')[0];
      if (!decoded.startsWith('http')) continue;
      if (decoded.includes('yahoo.com') || decoded.includes('uservoice.com') || decoded.includes('yimg.com') || decoded.includes('bing.com')) continue;
      if (seen.has(decoded)) continue;
      seen.add(decoded);

      let host = 'unknown';
      try { host = new URL(decoded).hostname.replace('www.', ''); } catch {}
      results.push({ companyName: host, website: decoded });
    }

    diag.rawMatchCount = ruMatches.length;
    diag.filteredResultCount = results.length;
    diag.results = results.slice(0, 10);

  } catch (e: any) {
    diag.error = e.message;
    diag.stack = e.stack;
  }

  return NextResponse.json(diag);
}
