import { SearchProviderResult } from './tavilyProvider';

export async function searchWithYahoo(
  query: string,
  targetCount: number
): Promise<{ results: SearchProviderResult[] }> {
  console.log(`[Yahoo] Attempting search for query: "${query}"...`);

  try {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://search.yahoo.com/search?p=${encodedQuery}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });

    if (!response.ok) {
      throw new Error(`Yahoo returned status ${response.status}`);
    }

    const html = await response.text();
    const results: SearchProviderResult[] = [];

    // Extract Yahoo redirect links containing encoded RU= parameters or direct hrefs
    const regex = /<h3[^>]*class="[^"]*title[^"]*"[^>]*><a[^>]*href="([^"]+)"[^>]*>(.*?)<\/a><\/h3>/gi;

    let match: RegExpExecArray | null;
    const cleanHtml = (str: string) =>
      (str || '')
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&#x27;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim();

    while ((match = regex.exec(html)) !== null && results.length < targetCount) {
      let rawHref = match[1];
      const rawTitle = cleanHtml(match[2]);
      let realUrl = '';

      if (rawHref.includes('RU=')) {
        try {
          const u = new URL(rawHref);
          const ru = u.searchParams.get('RU');
          if (ru) realUrl = decodeURIComponent(ru);
        } catch (e) {}
      } else {
        const ruMatch = rawHref.match(/https%3a%2f%2f[^"&]+/gi);
        if (ruMatch && ruMatch[0]) {
          realUrl = decodeURIComponent(ruMatch[0]);
        }
      }

      if (!realUrl) {
        realUrl = rawHref.split('/RK=')[0];
      }

      if (
        !realUrl.startsWith('http') ||
        realUrl.includes('yahoo.com') ||
        realUrl.includes('uservoice.com')
      ) {
        continue;
      }

      // Clean trailing /RK=...
      realUrl = realUrl.split('/RK=')[0];

      let companyName = rawTitle.split('-')[0].split('|')[0].split(':')[0].trim();
      if (companyName.length > 60) companyName = companyName.substring(0, 60);

      results.push({
        companyName: companyName || rawTitle,
        website: realUrl,
        title: rawTitle,
        snippet: rawTitle,
      });
    }

    // Backup regex if organic h3 matched fewer items
    if (results.length === 0) {
      const ruMatches = html.match(/https%3a%2f%2f[^"&]+/gi) || [];
      for (const rawRu of ruMatches) {
        if (results.length >= targetCount) break;
        const decoded = decodeURIComponent(rawRu).split('/RK=')[0];
        if (!decoded.startsWith('http') || decoded.includes('yahoo.com') || decoded.includes('uservoice.com')) continue;

        if (!results.some(r => r.website === decoded)) {
          let hostName = 'Enterprise Partner';
          try {
            hostName = new URL(decoded).hostname.replace('www.', '');
          } catch (e) {}

          results.push({
            companyName: hostName,
            website: decoded,
            title: hostName,
            snippet: hostName,
          });
        }
      }
    }

    console.log(`[Yahoo] Search succeeded. Returned ${results.length} results.`);
    return { results };
  } catch (error: any) {
    console.error('[Yahoo] Search failed:', error);
    return { results: [] };
  }
}
