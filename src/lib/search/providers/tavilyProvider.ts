export interface SearchProviderResult {
  companyName: string;
  website: string;
  title: string;
  snippet: string;
}

export async function searchWithTavily(
  query: string,
  targetCount: number,
  apiKeysString: string
): Promise<{ results: SearchProviderResult[]; usedKey: string }> {
  const keys = apiKeysString
    .split(',')
    .map(k => k.trim())
    .filter(Boolean);

  if (keys.length === 0) {
    throw new Error('No Tavily API keys provided');
  }

  let lastError: Error | null = null;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const maskedKey = key.length > 8 ? `${key.substring(0, 4)}...${key.substring(key.length - 4)}` : 'Key';
    console.log(`[Tavily] Attempting search with key #${i + 1} (${maskedKey})...`);

    try {
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: key,
          query: query,
          search_depth: 'basic',
          include_domains: [],
          exclude_domains: [],
          max_results: Math.min(targetCount, 20),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`[Tavily] Key #${i + 1} failed with status ${response.status}: ${errorText}`);
        
        // Quota exceeded (429), Unauthorized (401), Forbidden (403), or Payment Required (402)
        if ([401, 402, 403, 429].includes(response.status) || errorText.includes('quota') || errorText.includes('limit')) {
          console.warn(`[Tavily] Key #${i + 1} quota/auth error. Falling back to next key...`);
          lastError = new Error(`Key #${i + 1} quota exceeded (${response.status})`);
          continue; // Try next key
        }

        throw new Error(`Tavily API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      const rawResults = data.results || [];

      const results: SearchProviderResult[] = rawResults.map((item: any) => {
        let companyName = (item.title || '')
          .split('-')[0]
          .split('|')[0]
          .split(':')[0]
          .trim();
        if (companyName.length > 60) {
          companyName = companyName.substring(0, 60);
        }

        return {
          companyName: companyName || item.title || 'Unknown',
          website: item.url || '',
          title: item.title || '',
          snippet: item.content || item.snippet || '',
        };
      });

      console.log(`[Tavily] Search succeeded with key #${i + 1}. Returned ${results.length} results.`);
      return { results, usedKey: key };
    } catch (error: any) {
      console.warn(`[Tavily] Error with key #${i + 1}: ${error.message}`);
      lastError = error;
      // Continue loop to try next key
    }
  }

  throw lastError || new Error('All Tavily API keys failed or were exhausted');
}
