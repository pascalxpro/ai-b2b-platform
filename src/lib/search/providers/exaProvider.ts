import { SearchProviderResult } from './tavilyProvider';

export async function searchWithExa(
  query: string,
  targetCount: number,
  apiKeysString: string,
  extraConfig?: string
): Promise<{ results: SearchProviderResult[]; usedKey: string }> {
  const keys = apiKeysString.split(',').map((k) => k.trim()).filter(Boolean);

  for (const key of keys) {
    try {
      console.log(`[Exa] Trying key ${key.substring(0, 4)}...`);
      const response = await fetch('https://api.exa.ai/search', {
        method: 'POST',
        headers: {
          'x-api-key': key,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, numResults: targetCount, type: 'keyword' }),
      });

      if (!response.ok) {
        if ([401, 402, 403, 429].includes(response.status)) {
          console.warn(`[Exa] Key failed with status ${response.status}, trying next key`);
          continue;
        }
        throw new Error(`[Exa] HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const results: SearchProviderResult[] = (data.results || []).map((item: any) => {
        const title = item.title || '';
        const companyName = title.split(/[-|:]/)[0].trim().substring(0, 60);
        return {
          companyName,
          website: item.url || '',
          title,
          snippet: item.snippet || item.text || '',
        };
      });

      console.log(`[Exa] Success with key ${key.substring(0, 4)}...`);
      return { results, usedKey: key };
    } catch (error) {
      console.warn(`[Exa] Error with key ${key.substring(0, 4)}...:`, error);
    }
  }

  throw new Error('[Exa] All provided API keys failed');
}
