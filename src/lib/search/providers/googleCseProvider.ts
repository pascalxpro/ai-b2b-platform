import { SearchProviderResult } from './tavilyProvider';

export async function searchWithGoogleCse(
  query: string,
  targetCount: number,
  apiKeysString: string,
  extraConfig?: string,
  geo?: { gl?: string; cr?: string; lr?: string }
): Promise<{ results: SearchProviderResult[]; usedKey: string }> {
  const keys = apiKeysString.split(',').map((k) => k.trim()).filter(Boolean);
  const cx = extraConfig || '';

  for (const key of keys) {
    try {
      console.log(`[GoogleCSE] Trying key ${key.substring(0, 4)}... (geo: ${geo?.gl || 'none'})`);
      let url = `https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(key)}&cx=${encodeURIComponent(cx)}&q=${encodeURIComponent(query)}&num=${targetCount}`;
      if (geo?.gl) url += `&gl=${encodeURIComponent(geo.gl)}`;
      if (geo?.cr) url += `&cr=${encodeURIComponent(geo.cr)}`;
      if (geo?.lr) url += `&lr=${encodeURIComponent(geo.lr)}`;
      const response = await fetch(url);

      if (!response.ok) {
        if ([401, 402, 403, 429].includes(response.status)) {
          console.warn(`[GoogleCSE] Key failed with status ${response.status}, trying next key`);
          continue;
        }
        throw new Error(`[GoogleCSE] HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const results: SearchProviderResult[] = (data.items || []).map((item: any) => {
        const title = item.title || '';
        const companyName = title.split(/[-|:]/)[0].trim().substring(0, 60);
        return {
          companyName,
          website: item.link || '',
          title,
          snippet: item.snippet || '',
        };
      });

      console.log(`[GoogleCSE] Success with key ${key.substring(0, 4)}...`);
      return { results, usedKey: key };
    } catch (error) {
      console.warn(`[GoogleCSE] Error with key ${key.substring(0, 4)}...:`, error);
    }
  }

  throw new Error('[GoogleCSE] All provided API keys failed');
}
