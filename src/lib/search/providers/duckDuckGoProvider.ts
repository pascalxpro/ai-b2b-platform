import { SearchProviderResult } from './tavilyProvider';

export async function searchWithDuckDuckGo(
  query: string,
  targetCount: number
): Promise<{ results: SearchProviderResult[] }> {
  console.log(`[DuckDuckGo] Attempting POST search for query: "${query}"...`);

  try {
    const response = await fetch('https://html.duckduckgo.com/html/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      body: `q=${encodeURIComponent(query)}&b=`,
    });

    if (!response.ok) {
      throw new Error(`DuckDuckGo returned status ${response.status}`);
    }

    const html = await response.text();
    const results: SearchProviderResult[] = [];

    // Regex to match result links: <a ... class="result__a" ... href="...">Title</a>
    const resultRegex = /<a [^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gi;

    let match: RegExpExecArray | null;
    const cleanHtmlTag = (str: string) =>
      str
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim();

    while ((match = resultRegex.exec(html)) !== null && results.length < targetCount) {
      let href = match[1];
      const rawTitle = cleanHtmlTag(match[2]);

      // Skip ad links (duckduckgo.com/y.js...)
      if (href.includes('duckduckgo.com/y.js') || href.includes('bing.com/aclick')) {
        // Extract real target URL from ad if present in u3 or uddg parameter
        const u3Match = href.match(/u3=([^&]+)/);
        if (u3Match) {
          try {
            href = decodeURIComponent(u3Match[1]);
          } catch (e) {}
        } else {
          continue;
        }
      }

      // Decode DDG redirect URL (uddg parameter)
      if (href.includes('uddg=')) {
        try {
          const u = new URL(href.startsWith('http') ? href : `https://duckduckgo.com${href}`);
          const uddg = u.searchParams.get('uddg');
          if (uddg) href = uddg;
        } catch {
          // fallback to raw href
        }
      }

      if (href.startsWith('//')) {
        href = `https:${href}`;
      }

      // Filter out duckduckgo self-links or invalid schemes
      if (!href.startsWith('http') || href.includes('duckduckgo.com')) continue;

      let companyName = rawTitle.split('-')[0].split('|')[0].split(':')[0].trim();
      if (companyName.length > 60) companyName = companyName.substring(0, 60);

      results.push({
        companyName: companyName || rawTitle,
        website: href,
        title: rawTitle,
        snippet: rawTitle,
      });
    }

    console.log(`[DuckDuckGo] POST Search succeeded for "${query}". Returned ${results.length} results.`);
    return { results };
  } catch (error: any) {
    console.error('[DuckDuckGo] Search failed:', error);
    return { results: [] };
  }
}
