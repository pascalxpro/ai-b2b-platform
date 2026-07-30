import { SearchProviderResult } from './tavilyProvider';

export async function searchWithDuckDuckGo(
  query: string,
  targetCount: number
): Promise<{ results: SearchProviderResult[] }> {
  console.log(`[DuckDuckGo] Attempting search for query: "${query}"...`);

  try {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://html.duckduckgo.com/html/?q=${encodedQuery}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });

    if (!response.ok) {
      throw new Error(`DuckDuckGo returned status ${response.status}`);
    }

    const html = await response.text();
    const results: SearchProviderResult[] = [];

    // Parse DDG HTML results using Regex
    // Pattern matches <a class="result__a" href="...">Title</a> and snippet in <a class="result__snippet">...</a>
    const resultRegex = /<a class="result__a"[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>[\s\S]*?(?:<a class="result__snippet"[^>]*>(.*?)<\/a>|<div class="result__snippet"[^>]*>(.*?)<\/div>)/gi;

    let match: RegExpExecArray | null;
    const cleanHtmlTag = (str: string) => str.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").trim();

    while ((match = resultRegex.exec(html)) !== null && results.length < targetCount) {
      let href = match[1];
      const rawTitle = cleanHtmlTag(match[2]);
      const rawSnippet = cleanHtmlTag(match[3] || match[4] || '');

      // Decode DDG redirect URL (uddg parameter)
      if (href.includes('uddg=')) {
        try {
          const urlParams = new URLSearchParams(href.split('?')[1]);
          const uddg = urlParams.get('uddg');
          if (uddg) href = uddg;
        } catch {
          // fallback to raw href
        }
      }

      if (href.startsWith('//')) {
        href = `https:${href}`;
      }

      // Filter out duckduckgo self-links or ad links
      if (!href.startsWith('http') || href.includes('duckduckgo.com')) continue;

      let companyName = rawTitle.split('-')[0].split('|')[0].split(':')[0].trim();
      if (companyName.length > 50) companyName = companyName.substring(0, 50);

      results.push({
        companyName: companyName || rawTitle,
        website: href,
        title: rawTitle,
        snippet: rawSnippet,
      });
    }

    console.log(`[DuckDuckGo] Search succeeded. Returned ${results.length} results.`);
    return { results };
  } catch (error: any) {
    console.error('[DuckDuckGo] Search failed:', error);
    return { results: [] };
  }
}
