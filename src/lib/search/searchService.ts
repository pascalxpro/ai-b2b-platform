import { prisma } from '@/lib/db/prisma';
import { getSystemSettings } from '@/lib/settings/settingsService';
import { searchWithTavily, SearchProviderResult } from './providers/tavilyProvider';
import { searchWithGoogleThis } from './providers/googleThisProvider';

export async function executeSearchTask(taskId: string) {
  try {
    const task = await prisma.searchTask.findUnique({ where: { id: taskId } });
    if (!task) throw new Error('Task not found');

    // Update status to RUNNING
    await prisma.searchTask.update({
      where: { id: taskId },
      data: { status: 'RUNNING' },
    });

    // Build query
    const keywords = (task.criteriaJson as any)?.keywords?.join(' ') || '';
    const query = `${task.queryText || ''} ${keywords}`.trim();
    const requestedCount = (task.criteriaJson as any)?.targetCount || task.targetCount || 10;

    // Load provider configuration & priority
    const settings = getSystemSettings();
    const priorityList = settings.providerPriority || ['tavily', 'googlethis'];
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
          searchResults = tavilyRes.results;
          executedProvider = 'Tavily';
          if (searchResults.length > 0) break; // Successfully got results
        } catch (error: any) {
          console.warn('[SearchService] Tavily provider failed or all keys exhausted:', error.message);
          // Fall through to next provider in priority
        }
      } else if (normalizedProvider === 'googlethis' || normalizedProvider === 'google') {
        try {
          const googleRes = await searchWithGoogleThis(query, requestedCount);
          searchResults = googleRes.results;
          executedProvider = 'GoogleThis (Scraper)';
          if (searchResults.length > 0) break; // Successfully got results
        } catch (error: any) {
          console.warn('[SearchService] GoogleThis provider failed:', error.message);
        }
      }
    }

    if (searchResults.length === 0) {
      console.warn(`[SearchService] Task ${taskId}: No search provider returned results.`);
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
