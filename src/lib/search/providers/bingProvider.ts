import { SearchProviderResult } from './tavilyProvider';

export async function searchWithBing(
  query: string,
  targetCount: number
): Promise<{ results: SearchProviderResult[] }> {
  console.log(`[Bing] Attempting search for query: "${query}"...`);

  try {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://www.bing.com/search?q=${encodedQuery}&setlang=zh-TW`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });

    if (!response.ok) {
      throw new Error(`Bing returned status ${response.status}`);
    }

    const html = await response.text();
    const results: SearchProviderResult[] = [];

    // Match Bing organic results <li class="b_algo"><h2><a href="...">Title</a></h2>...<p>Snippet</p>
    const regex = /<li[^>]*class="b_algo"[^>]*>[\s\S]*?<h2><a[^>]*href="([^"]+)"[^>]*>(.*?)<\/a><\/h2>[\s\S]*?(?:<p[^>]*>(.*?)<\/p>|<div[^>]*class="b_caption"[^>]*>(.*?)<\/div>)?/gi;

    let match: RegExpExecArray | null;
    const cleanHtml = (str: string) =>
      (str || '')
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim();

    while ((match = regex.exec(html)) !== null && results.length < targetCount) {
      const href = match[1];
      const rawTitle = cleanHtml(match[2]);
      const rawSnippet = cleanHtml(match[3] || match[4] || '');

      if (!href.startsWith('http') || href.includes('bing.com') || href.includes('microsoft.com')) continue;

      let companyName = rawTitle.split('-')[0].split('|')[0].split(':')[0].trim();
      if (companyName.length > 60) companyName = companyName.substring(0, 60);

      results.push({
        companyName: companyName || rawTitle,
        website: href,
        title: rawTitle,
        snippet: rawSnippet,
      });
    }

    console.log(`[Bing] Search succeeded. Returned ${results.length} results.`);
    return { results };
  } catch (error: any) {
    console.error('[Bing] Search failed:', error);
    return { results: [] };
  }
}
