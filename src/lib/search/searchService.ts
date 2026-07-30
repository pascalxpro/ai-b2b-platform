import { prisma } from '@/lib/db/prisma';
import { getSystemSettings } from '@/lib/settings/settingsService';
import { searchWithTavily, SearchProviderResult } from './providers/tavilyProvider';
import { searchWithGoogleThis } from './providers/googleThisProvider';
import { searchWithDuckDuckGo } from './providers/duckDuckGoProvider';
import { searchWithBing } from './providers/bingProvider';

export async function executeSearchTask(taskId: string) {
  try {
    const task = await prisma.searchTask.findUnique({ where: { id: taskId } });
    if (!task) throw new Error('Task not found');

    // Update status to RUNNING
    await prisma.searchTask.update({
      where: { id: taskId },
      data: { status: 'RUNNING', startedAt: new Date() },
    });

    // Build comprehensive query from all criteria fields
    const crit = (task.criteriaJson as any) || {};
    const countriesStr = Array.isArray(crit.countries) ? crit.countries.join(' ') : '';
    const industriesStr = Array.isArray(crit.industries) ? crit.industries.join(' ') : '';
    const keywordsStr = Array.isArray(crit.keywords) ? crit.keywords.join(' ') : '';
    const companyTypesStr = Array.isArray(crit.companyTypes) ? crit.companyTypes.join(' ') : '';

    const queryParts = [
      task.queryText || crit.queryText || '',
      countriesStr,
      industriesStr,
      keywordsStr,
      companyTypesStr
    ].filter(Boolean);

    const query = queryParts.join(' ').trim();
    const requestedCount = crit.targetCount || task.targetCount || 10;

    // Load provider configuration & priority
    const settings = getSystemSettings();
    let priorityList = settings.providerPriority || ['tavily', 'duckduckgo', 'googlethis'];
    
    // Ensure duckduckgo and bing are available as fallback
    if (!priorityList.includes('duckduckgo')) priorityList.push('duckduckgo');
    if (!priorityList.includes('bing')) priorityList.push('bing');

    const tavilyKeys = settings.tavilyApiKeys || '';

    console.log(`[SearchService] Task ${taskId} executing. Query: "${query}". Provider Priority:`, priorityList);

    let searchResults: SearchProviderResult[] = [];
    let executedProvider = '';

    // Iterate through priority list
    for (const provider of priorityList) {
      const normalizedProvider = provider.toLowerCase().trim();

      if (normalizedProvider === 'tavily') {
        if (!tavilyKeys || !tavilyKeys.trim()) {
          console.log('[SearchService] Tavily is in priority list, but no Tavily API keys configured. Skipping...');
          continue;
        }

        try {
          const tavilyRes = await searchWithTavily(query, requestedCount, tavilyKeys);
          if (tavilyRes.results && tavilyRes.results.length > 0) {
            searchResults = tavilyRes.results;
            executedProvider = 'Tavily AI';
            break;
          }
        } catch (error: any) {
          console.warn('[SearchService] Tavily provider failed or all keys exhausted:', error.message);
        }
      } else if (normalizedProvider === 'duckduckgo') {
        try {
          const ddgRes = await searchWithDuckDuckGo(query, requestedCount);
          if (ddgRes.results && ddgRes.results.length > 0) {
            searchResults = ddgRes.results;
            executedProvider = 'DuckDuckGo Search';
            break;
          }
        } catch (error: any) {
          console.warn('[SearchService] DuckDuckGo provider failed:', error.message);
        }
      } else if (normalizedProvider === 'bing') {
        try {
          const bingRes = await searchWithBing(query, requestedCount);
          if (bingRes.results && bingRes.results.length > 0) {
            searchResults = bingRes.results;
            executedProvider = 'Bing Search';
            break;
          }
        } catch (error: any) {
          console.warn('[SearchService] Bing provider failed:', error.message);
        }
      } else if (normalizedProvider === 'googlethis' || normalizedProvider === 'google') {
        try {
          const googleRes = await searchWithGoogleThis(query, requestedCount);
          if (googleRes.results && googleRes.results.length > 0) {
            searchResults = googleRes.results;
            executedProvider = 'Google Search';
            break;
          }
        } catch (error: any) {
          console.warn('[SearchService] GoogleThis provider failed:', error.message);
        }
      }
    }

    // Ultimate fallback: Try DuckDuckGo POST if all priority providers returned 0
    if (searchResults.length === 0) {
      console.warn(`[SearchService] Task ${taskId}: Primary providers returned 0. Running DuckDuckGo POST fallback...`);
      try {
        const ddgRes = await searchWithDuckDuckGo(query, requestedCount);
        if (ddgRes.results && ddgRes.results.length > 0) {
          searchResults = ddgRes.results;
          executedProvider = 'DuckDuckGo Search (Fallback)';
        }
      } catch (e) {
        console.error('[SearchService] Emergency fallback failed:', e);
      }
    }

    // Save results to database
    let savedCount = 0;
    for (const item of searchResults) {
      if (!item.website || !item.companyName) continue;

      const existing = await prisma.searchResult.findFirst({
        where: { searchTaskId: taskId, website: item.website },
      });

      if (!existing) {
        await prisma.searchResult.create({
          data: {
            searchTaskId: taskId,
            workspaceId: task.workspaceId,
            companyName: item.companyName,
            website: item.website,
            country: 'Unknown',
            sourceCount: 1,
            qualityStatus: 'NEW',
            conversionStatus: 'NONE',
            scoreJson: {
              title: item.title,
              description: item.snippet,
              provider: executedProvider,
            },
          },
        });
        savedCount++;
      }
    }

    // Update task status to COMPLETED
    await prisma.searchTask.update({
      where: { id: taskId },
      data: { status: 'COMPLETED' },
    });

    console.log(`[SearchService] Task ${taskId} COMPLETED via provider [${executedProvider}]. Saved ${savedCount} results.`);
  } catch (error: any) {
    console.error(`[SearchService] Task ${taskId} FAILED:`, error);
    await prisma.searchTask.update({
      where: { id: taskId },
      data: { status: 'FAILED' },
    });
  }
}
