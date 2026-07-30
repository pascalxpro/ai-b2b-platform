import { prisma } from '@/lib/db/prisma';
import { getSystemSettings } from '@/lib/settings/settingsService';
import { searchWithTavily, SearchProviderResult } from './providers/tavilyProvider';

// Inline reliable Yahoo search - proven to work on Zeabur cloud IP 43.163.217.55
async function inlineYahooSearch(query: string, targetCount: number): Promise<SearchProviderResult[]> {
  console.log(`[InlineYahoo] Searching for: "${query}"`);
  
  try {
    const url = `https://search.yahoo.com/search?p=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });

    if (!res.ok) {
      console.error(`[InlineYahoo] HTTP ${res.status}`);
      return [];
    }

    const html = await res.text();
    console.log(`[InlineYahoo] Got HTML length: ${html.length}`);

    const results: SearchProviderResult[] = [];
    const seen = new Set<string>();

    // Extract all encoded URLs from Yahoo redirect links
    const ruMatches = html.match(/https%3a%2f%2f[^"&\s]+/gi) || [];
    console.log(`[InlineYahoo] Found ${ruMatches.length} raw URL matches`);

    for (const rawRu of ruMatches) {
      if (results.length >= targetCount) break;
      
      let decoded = '';
      try {
        decoded = decodeURIComponent(rawRu);
      } catch {
        continue;
      }
      
      // Remove Yahoo tracking suffix /RK=.../RS=...
      decoded = decoded.split('/RK=')[0];
      
      // Skip Yahoo's own domains and non-http links
      if (!decoded.startsWith('http')) continue;
      if (decoded.includes('yahoo.com')) continue;
      if (decoded.includes('uservoice.com')) continue;
      if (decoded.includes('yimg.com')) continue;
      if (decoded.includes('bing.com')) continue;
      
      // Deduplicate
      if (seen.has(decoded)) continue;
      seen.add(decoded);

      // Extract hostname as company name
      let companyName = 'Enterprise';
      try {
        const hostname = new URL(decoded).hostname.replace('www.', '');
        companyName = hostname;
      } catch {}

      results.push({
        companyName,
        website: decoded,
        title: companyName,
        snippet: companyName,
      });
    }

    console.log(`[InlineYahoo] Extracted ${results.length} unique results`);
    return results;
  } catch (error: any) {
    console.error('[InlineYahoo] Failed:', error.message);
    return [];
  }
}

// Inline DuckDuckGo POST search
async function inlineDDGSearch(query: string, targetCount: number): Promise<SearchProviderResult[]> {
  console.log(`[InlineDDG] Searching for: "${query}"`);
  
  try {
    const res = await fetch('https://html.duckduckgo.com/html/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      body: `q=${encodeURIComponent(query)}&b=`,
    });

    const html = await res.text();
    console.log(`[InlineDDG] HTTP ${res.status}, HTML length: ${html.length}`);

    const results: SearchProviderResult[] = [];
    const cleanHtml = (str: string) =>
      str.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").trim();

    const resultRegex = /<a [^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gi;
    let match: RegExpExecArray | null;

    while ((match = resultRegex.exec(html)) !== null && results.length < targetCount) {
      let href = match[1];
      const rawTitle = cleanHtml(match[2]);

      // Skip ads
      if (href.includes('duckduckgo.com/y.js') || href.includes('bing.com/aclick')) continue;

      // Decode DDG redirect
      if (href.includes('uddg=')) {
        try {
          const u = new URL(href.startsWith('http') ? href : `https://duckduckgo.com${href}`);
          const uddg = u.searchParams.get('uddg');
          if (uddg) href = uddg;
        } catch {}
      }

      if (href.startsWith('//')) href = `https:${href}`;
      if (!href.startsWith('http') || href.includes('duckduckgo.com')) continue;

      let companyName = rawTitle.split('-')[0].split('|')[0].split(':')[0].trim();
      if (companyName.length > 60) companyName = companyName.substring(0, 60);

      results.push({
        companyName: companyName || rawTitle,
        website: href,
        title: rawTitle,
        snippet: rawTitle,
      });
    }

    console.log(`[InlineDDG] Found ${results.length} results`);
    return results;
  } catch (error: any) {
    console.error('[InlineDDG] Failed:', error.message);
    return [];
  }
}

export async function executeSearchTask(taskId: string) {
  try {
    const task = await prisma.searchTask.findUnique({ where: { id: taskId } });
    if (!task) throw new Error('Task not found');

    // Update status to RUNNING
    await prisma.searchTask.update({
      where: { id: taskId },
      data: { status: 'RUNNING', startedAt: new Date() },
    });

    // Build query from criteria
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

    const fullQuery = queryParts.join(' ').trim();
    const requestedCount = crit.targetCount || task.targetCount || 10;

    // Also create a shorter focused query for backup
    const shortQuery = [
      countriesStr || '',
      keywordsStr || industriesStr || '',
      companyTypesStr ? companyTypesStr.split(' ')[0] : '',
    ].filter(Boolean).join(' ').trim() || fullQuery;

    console.log(`[SearchService] Task ${taskId} executing.`);
    console.log(`[SearchService] Full query: "${fullQuery}"`);
    console.log(`[SearchService] Short query: "${shortQuery}"`);

    // Load settings
    const settings = getSystemSettings();
    const tavilyKeys = settings.tavilyApiKeys || '';

    let searchResults: SearchProviderResult[] = [];
    let executedProvider = '';

    // Strategy 1: Try Tavily if API keys exist
    if (tavilyKeys && tavilyKeys.trim()) {
      try {
        console.log('[SearchService] Trying Tavily...');
        const tavilyRes = await searchWithTavily(fullQuery, requestedCount, tavilyKeys);
        if (tavilyRes.results && tavilyRes.results.length > 0) {
          searchResults = tavilyRes.results;
          executedProvider = 'Tavily AI';
        }
      } catch (e: any) {
        console.warn('[SearchService] Tavily failed:', e.message);
      }
    }

    // Strategy 2: DuckDuckGo POST (may fail on cloud IPs)
    if (searchResults.length === 0) {
      console.log('[SearchService] Trying DuckDuckGo POST...');
      const ddgResults = await inlineDDGSearch(fullQuery, requestedCount);
      if (ddgResults.length > 0) {
        searchResults = ddgResults;
        executedProvider = 'DuckDuckGo';
      }
    }

    // Strategy 3: Yahoo with full query
    if (searchResults.length === 0) {
      console.log('[SearchService] Trying Yahoo (full query)...');
      const yahooResults = await inlineYahooSearch(fullQuery, requestedCount);
      if (yahooResults.length > 0) {
        searchResults = yahooResults;
        executedProvider = 'Yahoo Search';
      }
    }

    // Strategy 4: Yahoo with short focused query (different results)
    if (searchResults.length === 0 && shortQuery !== fullQuery) {
      console.log('[SearchService] Trying Yahoo (short query)...');
      const yahooResults = await inlineYahooSearch(shortQuery, requestedCount);
      if (yahooResults.length > 0) {
        searchResults = yahooResults;
        executedProvider = 'Yahoo Search (Short)';
      }
    }

    // Strategy 5: DuckDuckGo with short query
    if (searchResults.length === 0 && shortQuery !== fullQuery) {
      console.log('[SearchService] Trying DuckDuckGo (short query)...');
      const ddgResults = await inlineDDGSearch(shortQuery, requestedCount);
      if (ddgResults.length > 0) {
        searchResults = ddgResults;
        executedProvider = 'DuckDuckGo (Short)';
      }
    }

    console.log(`[SearchService] Provider [${executedProvider || 'NONE'}] returned ${searchResults.length} results.`);

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

    console.log(`[SearchService] Task ${taskId} COMPLETED via [${executedProvider}]. Saved ${savedCount} results.`);
  } catch (error: any) {
    console.error(`[SearchService] Task ${taskId} FAILED:`, error);
    await prisma.searchTask.update({
      where: { id: taskId },
      data: { status: 'FAILED' },
    });
  }
}
