import google from 'googlethis';
import { SearchProviderResult } from './tavilyProvider';

export async function searchWithGoogleThis(
  query: string,
  targetCount: number
): Promise<{ results: SearchProviderResult[] }> {
  console.log(`[GoogleThis] Attempting search for query: "${query}"...`);

  const options = {
    page: 0,
    safe: false,
    additional_params: {
      hl: 'zh-TW',
    },
  };

  const response = await google.search(query, options);
  const rawResults = response.results || [];

  const results: SearchProviderResult[] = [];
  const max = Math.min(targetCount, rawResults.length);

  for (let i = 0; i < max; i++) {
    const item = rawResults[i];
    if (!item.url || !item.title) continue;

    let companyName = item.title.split('-')[0].split('|')[0].trim();
    if (companyName.length > 50) companyName = companyName.substring(0, 50);

    results.push({
      companyName: companyName || item.title,
      website: item.url,
      title: item.title,
      snippet: item.description || '',
    });
  }

  console.log(`[GoogleThis] Search succeeded. Returned ${results.length} results.`);
  return { results };
}
