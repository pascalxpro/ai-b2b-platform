import { SearchProviderResult } from './tavilyProvider';

export async function searchWithBingApi(
  query: string,
  targetCount: number,
  apiKeysString: string,
  geo?: { mkt?: string; cc?: string }
): Promise<{ results: SearchProviderResult[]; usedKey: string }> {
  const keys = apiKeysString.split(',').map((k) => k.trim()).filter(Boolean);

  for (const key of keys) {
    try {
      console.log(`[BingAPI] Trying key ${key.substring(0, 4)}... (geo: ${geo?.cc || 'none'})`);
      let url = `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(query)}&count=${targetCount}`;
      if (geo?.mkt) url += `&mkt=${encodeURIComponent(geo.mkt)}`;
      if (geo?.cc) url += `&cc=${encodeURIComponent(geo.cc)}`;
      const response = await fetch(url, {
        headers: {
          'Ocp-Apim-Subscription-Key': key,
        },
      });

      if (!response.ok) {
        if ([401, 402, 403, 429].includes(response.status)) {
          console.warn(`[BingAPI] Key failed with status ${response.status}, trying next key`);
          continue;
        }
        throw new Error(`[BingAPI] HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const results: SearchProviderResult[] = (data.webPages?.value || []).map((item: any) => {
        const title = item.name || '';
        const companyName = title.split(/[-|:]/)[0].trim().substring(0, 60);
        return {
          companyName,
          website: item.url || '',
          title,
          snippet: item.snippet || '',
        };
      });

      console.log(`[BingAPI] Success with key ${key.substring(0, 4)}...`);
      return { results, usedKey: key };
    } catch (error) {
      console.warn(`[BingAPI] Error with key ${key.substring(0, 4)}...:`, error);
    }
  }

  throw new Error('[BingAPI] All provided API keys failed');
}
