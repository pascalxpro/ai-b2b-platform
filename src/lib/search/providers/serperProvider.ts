import { SearchProviderResult } from './tavilyProvider';

export async function searchWithSerper(
  query: string,
  targetCount: number,
  apiKeysString: string,
  extraConfig?: string
): Promise<{ results: SearchProviderResult[]; usedKey: string }> {
  const keys = apiKeysString.split(',').map((k) => k.trim()).filter(Boolean);

  for (const key of keys) {
    try {
      console.log(`[Serper] Trying key ${key.substring(0, 4)}...`);
      const response = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': key,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ q: query, num: targetCount }),
      });

      if (!response.ok) {
        if ([401, 402, 403, 429].includes(response.status)) {
          console.warn(`[Serper] Key failed with status ${response.status}, trying next key`);
          continue;
        }
        throw new Error(`[Serper] HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const results: SearchProviderResult[] = (data.organic || []).map((item: any) => {
        const title = item.title || '';
        const companyName = title.split(/[-|:]/)[0].trim().substring(0, 60);
        return {
          companyName,
          website: item.link || '',
          title,
          snippet: item.snippet || '',
        };
      });

      console.log(`[Serper] Success with key ${key.substring(0, 4)}...`);
      return { results, usedKey: key };
    } catch (error) {
      console.warn(`[Serper] Error with key ${key.substring(0, 4)}...:`, error);
    }
  }

  throw new Error('[Serper] All provided API keys failed');
}
