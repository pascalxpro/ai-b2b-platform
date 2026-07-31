import { SearchProviderResult } from './tavilyProvider';

export async function searchWithBraveApi(
  query: string,
  targetCount: number,
  apiKeysString: string,
  extraConfig?: string
): Promise<{ results: SearchProviderResult[]; usedKey: string }> {
  const keys = apiKeysString.split(',').map((k) => k.trim()).filter(Boolean);

  for (const key of keys) {
    try {
      console.log(`[BraveAPI] Trying key ${key.substring(0, 4)}...`);
      const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${targetCount}`;
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip',
          'X-Subscription-Token': key,
        },
      });

      if (!response.ok) {
        if ([401, 402, 403, 429].includes(response.status)) {
          console.warn(`[BraveAPI] Key failed with status ${response.status}, trying next key`);
          continue;
        }
        throw new Error(`[BraveAPI] HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const results: SearchProviderResult[] = (data.web?.results || []).map((item: any) => {
        const title = item.title || '';
        const companyName = title.split(/[-|:]/)[0].trim().substring(0, 60);
        return {
          companyName,
          website: item.url || '',
          title,
          snippet: item.description || '',
        };
      });

      console.log(`[BraveAPI] Success with key ${key.substring(0, 4)}...`);
      return { results, usedKey: key };
    } catch (error) {
      console.warn(`[BraveAPI] Error with key ${key.substring(0, 4)}...:`, error);
    }
  }

  throw new Error('[BraveAPI] All provided API keys failed');
}
