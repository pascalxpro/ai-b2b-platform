import { SearchProviderResult } from './tavilyProvider';

export async function searchWithSearxng(
  query: string,
  targetCount: number,
  apiKeysString: string,
  extraConfig?: string
): Promise<{ results: SearchProviderResult[]; usedKey: string }> {
  const instanceUrl = extraConfig?.replace(/\/$/, '') || '';
  if (!instanceUrl) {
    throw new Error('[Searxng] Missing instance URL in extraConfig');
  }

  try {
    console.log(`[Searxng] Searching instance ${instanceUrl}...`);
    const url = `${instanceUrl}/search?q=${encodeURIComponent(query)}&format=json&engines=google,bing,duckduckgo`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`[Searxng] HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    let results: SearchProviderResult[] = (data.results || []).map((item: any) => {
      const title = item.title || '';
      const companyName = title.split(/[-|:]/)[0].trim().substring(0, 60);
      return {
        companyName,
        website: item.url || '',
        title,
        snippet: item.content || item.snippet || '',
      };
    });

    if (results.length > targetCount) {
      results = results.slice(0, targetCount);
    }

    console.log(`[Searxng] Success`);
    return { results, usedKey: 'none' };
  } catch (error) {
    console.warn(`[Searxng] Error:`, error);
    throw error;
  }
}
