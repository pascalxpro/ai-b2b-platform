import { prisma } from '@/lib/db/prisma';
import { loadSettingsFromDb } from '@/lib/settings/settingsService';
import { searchWithTavily, SearchProviderResult } from './providers/tavilyProvider';
import { searchWithSerper } from './providers/serperProvider';
import { searchWithGoogleCse } from './providers/googleCseProvider';
import { searchWithBingApi } from './providers/bingApiProvider';
import { searchWithExa } from './providers/exaProvider';
import { searchWithSearxng } from './providers/searxngProvider';
import { searchWithBraveApi } from './providers/braveApiProvider';

// Re-export for other modules
export type { SearchProviderResult } from './providers/tavilyProvider';

// Non-B2B domain blocklist
const BLOCKLIST = [
  // Search engines & their subdomains
  'yahoo.com', 'uservoice.com', 'yimg.com', 'bing.com', 'mm.bing.net',
  'google.com', 'google.co', 'googleapis.com', 'gstatic.com',
  'brave.com', 'brave.app', 'bravesoftware.com',
  'duckduckgo.com',
  // Reference / wiki
  'wikipedia.org', 'wikimedia.org', 'wiktionary.org',
  // Video / social media
  'youtube.com', 'youtu.be',
  'facebook.com', 'twitter.com', 'x.com', 'instagram.com', 'linkedin.com', 'tiktok.com',
  'reddit.com', 'pinterest.com', 'tumblr.com',
  // E-commerce marketplaces
  'amazon.com', 'amazon.co', 'ebay.com', 'shopee.com', 'lazada.com',
  // Travel
  'tripadvisor.com', 'booking.com', 'expedia.com', 'kayak.com', 'kayak.co',
  'hoponworld.com', 'japan-guide.com', 'japan.travel', 'jnto.go.jp',
  // Chinese platforms
  'baidu.com', 'zhihu.com', 'weibo.com', 'qq.com',
  // News
  'nytimes.com', 'reuters.com', 'bbc.com', 'cnn.com', 'usnews.com', 'upi.com',
  // Tech
  'microsoft.com', 'apple.com', 'github.com', 'stackoverflow.com',
  'hackerone.com', 'torproject.org',
  // CDN / infra
  'cloudflare.com', 'akamai.com', 'fastly.net', 'jsdelivr.net',
  // Short links
  'wa.me', 'bit.ly', 't.co', 'goo.gl',
  // Schemas / standards
  'w3.org', 'schema.org', 'schemas.live.com',
];

function cleanUrl(url: string): string {
  return url
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function isBlockedUrl(url: string): boolean {
  const lower = url.toLowerCase();
  if (BLOCKLIST.some(b => lower.includes(b))) return true;
  if (/\.(jpg|jpeg|png|gif|svg|webp|mp4|pdf|css|js)(\?|$)/i.test(url)) return true;
  return false;
}

// ─── Yahoo Search (proven stable on Zeabur cloud IP) ───
async function searchYahoo(query: string, targetCount: number): Promise<SearchProviderResult[]> {
  console.log(`[Yahoo] Searching: "${query}"`);
  try {
    const res = await fetch(`https://search.yahoo.com/search?p=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });
    if (!res.ok) return [];

    const html = await res.text();
    const results: SearchProviderResult[] = [];
    const seen = new Set<string>();
    const ruMatches = html.match(/https%3a%2f%2f[^"&\s]+/gi) || [];

    for (const rawRu of ruMatches) {
      if (results.length >= targetCount) break;
      let decoded = '';
      try { decoded = decodeURIComponent(rawRu); } catch { continue; }
      decoded = decoded.split('/RK=')[0];
      if (!decoded.startsWith('http') || isBlockedUrl(decoded)) continue;
      if (seen.has(decoded)) continue;
      seen.add(decoded);

      let companyName = 'Enterprise';
      try { companyName = new URL(decoded).hostname.replace('www.', ''); } catch {}
      results.push({ companyName, website: decoded, title: companyName, snippet: companyName });
    }

    console.log(`[Yahoo] Found ${results.length} results`);
    return results;
  } catch (e: any) {
    console.error('[Yahoo] Failed:', e.message);
    return [];
  }
}

// ─── DuckDuckGo POST Search ───
async function searchDDG(query: string, targetCount: number): Promise<SearchProviderResult[]> {
  console.log(`[DDG] Searching: "${query}"`);
  try {
    const res = await fetch('https://html.duckduckgo.com/html/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html',
        'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      body: `q=${encodeURIComponent(query)}&b=`,
    });

    const html = await res.text();
    const results: SearchProviderResult[] = [];
    const clean = (s: string) => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").trim();
    const regex = /<a [^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gi;
    let m: RegExpExecArray | null;

    while ((m = regex.exec(html)) !== null && results.length < targetCount) {
      let href = m[1];
      const title = clean(m[2]);
      if (href.includes('duckduckgo.com/y.js') || href.includes('bing.com/aclick')) continue;
      if (href.includes('uddg=')) {
        try {
          const u = new URL(href.startsWith('http') ? href : `https://duckduckgo.com${href}`);
          const uddg = u.searchParams.get('uddg');
          if (uddg) href = uddg;
        } catch {}
      }
      if (href.startsWith('//')) href = `https:${href}`;
      if (!href.startsWith('http') || href.includes('duckduckgo.com') || isBlockedUrl(href)) continue;

      let name = title.split('-')[0].split('|')[0].split(':')[0].trim();
      if (name.length > 60) name = name.substring(0, 60);
      results.push({ companyName: name || title, website: href, title, snippet: title });
    }

    console.log(`[DDG] Found ${results.length} results`);
    return results;
  } catch (e: any) {
    console.error('[DDG] Failed:', e.message);
    return [];
  }
}

// ─── Bing Scraper Search ───
async function searchBing(query: string, targetCount: number): Promise<SearchProviderResult[]> {
  console.log(`[Bing] Searching: "${query}"`);
  try {
    const res = await fetch(`https://www.bing.com/search?q=${encodeURIComponent(query)}&setlang=zh-TW`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });
    if (!res.ok) return [];

    const html = await res.text();
    console.log(`[Bing] HTML length: ${html.length}`);
    const results: SearchProviderResult[] = [];
    const seen = new Set<string>();

    // Strategy 1: Extract from <cite> tags (Bing shows URLs in cite elements)
    const citeRegex = /<cite[^>]*>(https?:\/\/[^<]+)<\/cite>/gi;
    let m: RegExpExecArray | null;
    while ((m = citeRegex.exec(html)) !== null && results.length < targetCount) {
      let url = m[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim();
      // Remove trailing ellipsis
      url = url.replace(/\s*›.*$/, '').replace(/\s*…$/, '').trim();
      if (!url.startsWith('http')) url = `https://${url}`;
      if (isBlockedUrl(url) || seen.has(url)) continue;
      seen.add(url);
      let name = 'Enterprise';
      try { name = new URL(url).hostname.replace('www.', ''); } catch {}
      results.push({ companyName: name, website: url, title: name, snippet: name });
    }

    // Strategy 2: Extract from data-u attributes (some Bing versions)
    if (results.length === 0) {
      const dataRegex = /data-u="[^"]*\|(https?:\/\/[^"|]+)/gi;
      while ((m = dataRegex.exec(html)) !== null && results.length < targetCount) {
        const url = m[1];
        if (isBlockedUrl(url) || seen.has(url)) continue;
        seen.add(url);
        let name = 'Enterprise';
        try { name = new URL(url).hostname.replace('www.', ''); } catch {}
        results.push({ companyName: name, website: url, title: name, snippet: name });
      }
    }

    // Strategy 3: Extract real URLs from href that are NOT bing.com
    if (results.length === 0) {
      const hrefRegex = /href="(https?:\/\/(?!r\.bing\.com|th\.bing\.com|www\.bing\.com|bing\.com)[^"]+)"/gi;
      while ((m = hrefRegex.exec(html)) !== null && results.length < targetCount) {
        const url = m[1];
        if (isBlockedUrl(url) || seen.has(url)) continue;
        seen.add(url);
        let name = 'Enterprise';
        try { name = new URL(url).hostname.replace('www.', ''); } catch {}
        results.push({ companyName: name, website: url, title: name, snippet: name });
      }
    }

    console.log(`[Bing] Found ${results.length} results`);
    return results;
  } catch (e: any) {
    console.error('[Bing] Failed:', e.message);
    return [];
  }
}
// ─── Brave Search ───
async function searchBrave(query: string, targetCount: number): Promise<SearchProviderResult[]> {
  console.log(`[Brave] Searching: "${query}"`);
  try {
    const res = await fetch(`https://search.brave.com/search?q=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
      },
    });
    if (!res.ok) { console.log(`[Brave] HTTP ${res.status}`); return []; }

    const html = await res.text();
    console.log(`[Brave] HTML length: ${html.length}`);
    const results: SearchProviderResult[] = [];
    const seen = new Set<string>();

    // Brave result cards contain external hrefs
    const regex = /href="(https?:\/\/(?!search\.brave\.com|brave\.com|cdn\.search\.brave\.com)[^"]+)"/gi;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(html)) !== null && results.length < targetCount) {
      const url = m[1];
      if (isBlockedUrl(url) || seen.has(url)) continue;
      if (/\.(css|js|ico|png|jpg|svg|woff|ttf)(\?|$)/i.test(url)) continue;
      seen.add(url);
      let name = 'Enterprise';
      try { name = new URL(url).hostname.replace('www.', ''); } catch {}
      results.push({ companyName: name, website: url, title: name, snippet: name });
    }

    console.log(`[Brave] Found ${results.length} results`);
    return results;
  } catch (e: any) {
    console.error('[Brave] Failed:', e.message);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════
// Main search execution: ALL engines search, results are MERGED
// ═══════════════════════════════════════════════════════════════
export async function executeSearchTask(taskId: string) {
  try {
    const task = await prisma.searchTask.findUnique({ where: { id: taskId } });
    if (!task) throw new Error('Task not found');

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
      countriesStr, industriesStr, keywordsStr, companyTypesStr,
    ].filter(Boolean);

    const fullQuery = queryParts.join(' ').trim();
    const requestedCount = crit.targetCount || task.targetCount || 10;

    // Shorter focused query for additional coverage
    const shortQuery = [
      countriesStr, keywordsStr || industriesStr,
      companyTypesStr ? companyTypesStr.split(' ')[0] : '',
    ].filter(Boolean).join(' ').trim() || fullQuery;

    console.log(`[SearchService] Task ${taskId} executing.`);
    console.log(`[SearchService] Full query: "${fullQuery}"`);
    console.log(`[SearchService] Short query: "${shortQuery}"`);

    const settings = await loadSettingsFromDb();
    const enabledEngines = (settings.searchEngines || []).filter(e => e.enabled);

    console.log(`[SearchService] Enabled engines: ${enabledEngines.map(e => e.id).join(', ')}`);

    // ──────────────────────────────────────────────
    // Run ALL ENABLED engines in PARALLEL, merge
    // ──────────────────────────────────────────────
    const providerPromises: { name: string; promise: Promise<SearchProviderResult[]> }[] = [];

    // Engine name map for display
    const ENGINE_NAMES: Record<string, string> = {
      tavily: 'Tavily AI', serper: 'Serper.dev', google_cse: 'Google CSE',
      bing_api: 'Bing API', exa: 'Exa.ai', searxng: 'SearXNG',
      brave_api: 'Brave API', yahoo: 'Yahoo Search', duckduckgo: 'DuckDuckGo',
      bing_scraper: 'Bing Search', brave_scraper: 'Brave Search',
    };

    for (const engine of enabledEngines) {
      const name = ENGINE_NAMES[engine.id] || engine.id;
      const keys = engine.apiKeys || '';
      const extra = engine.extraConfig || '';

      // Dispatch to the correct provider
      switch (engine.id) {
        case 'tavily':
          if (keys.trim()) {
            providerPromises.push({
              name,
              promise: searchWithTavily(fullQuery, requestedCount, keys).then(r => r.results || []).catch(e => { console.warn(`[${name}] Failed:`, e.message); return []; }),
            });
          }
          break;

        case 'serper':
          if (keys.trim()) {
            providerPromises.push({
              name,
              promise: searchWithSerper(fullQuery, requestedCount, keys).then(r => r.results || []).catch(e => { console.warn(`[${name}] Failed:`, e.message); return []; }),
            });
          }
          break;

        case 'google_cse':
          if (keys.trim() && extra.trim()) {
            providerPromises.push({
              name,
              promise: searchWithGoogleCse(fullQuery, requestedCount, keys, extra).then(r => r.results || []).catch(e => { console.warn(`[${name}] Failed:`, e.message); return []; }),
            });
          }
          break;

        case 'bing_api':
          if (keys.trim()) {
            providerPromises.push({
              name,
              promise: searchWithBingApi(fullQuery, requestedCount, keys).then(r => r.results || []).catch(e => { console.warn(`[${name}] Failed:`, e.message); return []; }),
            });
          }
          break;

        case 'exa':
          if (keys.trim()) {
            providerPromises.push({
              name,
              promise: searchWithExa(fullQuery, requestedCount, keys).then(r => r.results || []).catch(e => { console.warn(`[${name}] Failed:`, e.message); return []; }),
            });
          }
          break;

        case 'searxng':
          if (extra.trim()) {
            providerPromises.push({
              name,
              promise: searchWithSearxng(fullQuery, requestedCount, '', extra).then(r => r.results || []).catch(e => { console.warn(`[${name}] Failed:`, e.message); return []; }),
            });
          }
          break;

        case 'brave_api':
          if (keys.trim()) {
            providerPromises.push({
              name,
              promise: searchWithBraveApi(fullQuery, requestedCount, keys).then(r => r.results || []).catch(e => { console.warn(`[${name}] Failed:`, e.message); return []; }),
            });
          }
          break;

        // Free scrapers (no API key needed)
        case 'yahoo':
          providerPromises.push({ name, promise: searchYahoo(fullQuery, requestedCount).catch(() => []) });
          if (shortQuery !== fullQuery) {
            providerPromises.push({ name, promise: searchYahoo(shortQuery, requestedCount).catch(() => []) });
          }
          break;

        case 'duckduckgo':
          providerPromises.push({ name, promise: searchDDG(fullQuery, requestedCount).catch(() => []) });
          if (shortQuery !== fullQuery) {
            providerPromises.push({ name, promise: searchDDG(shortQuery, requestedCount).catch(() => []) });
          }
          break;

        case 'bing_scraper':
          providerPromises.push({ name, promise: searchBing(fullQuery, requestedCount).catch(() => []) });
          if (shortQuery !== fullQuery) {
            providerPromises.push({ name, promise: searchBing(shortQuery, requestedCount).catch(() => []) });
          }
          break;
      }
    }

    // Wait for ALL providers to complete
    const providerResults = await Promise.allSettled(
      providerPromises.map(p => p.promise)
    );

    // Merge and deduplicate results from all providers
    const mergedMap = new Map<string, { result: SearchProviderResult; provider: string }>();
    
    for (let i = 0; i < providerResults.length; i++) {
      const outcome = providerResults[i];
      const providerName = providerPromises[i].name;
      
      if (outcome.status === 'fulfilled' && outcome.value.length > 0) {
        console.log(`[SearchService] ${providerName} returned ${outcome.value.length} results`);
        for (const item of outcome.value) {
          if (!item.website || !item.companyName) continue;
          
          // Clean HTML entities from URL
          const cleanedWebsite = cleanUrl(item.website);
          
          // Re-check blocklist on cleaned URL
          if (isBlockedUrl(cleanedWebsite)) continue;
          
          // Deduplicate by hostname
          let hostname = '';
          try { hostname = new URL(cleanedWebsite).hostname.replace('www.', ''); } catch { continue; }
          
          // Store the cleaned version
          const cleanedItem = { ...item, website: cleanedWebsite };
          
          if (!mergedMap.has(hostname)) {
            mergedMap.set(hostname, { result: cleanedItem, provider: providerName });
          } else {
            // If this provider has a better company name (not just hostname), update it
            const existing = mergedMap.get(hostname)!;
            if (cleanedItem.companyName !== hostname && existing.result.companyName === hostname) {
              mergedMap.set(hostname, { result: cleanedItem, provider: providerName });
            }
          }
        }
      } else if (outcome.status === 'rejected') {
        console.warn(`[SearchService] ${providerName} rejected:`, outcome.reason);
      } else {
        console.log(`[SearchService] ${providerName} returned 0 results`);
      }
    }

    const allResults = Array.from(mergedMap.values());
    console.log(`[SearchService] Total merged unique results: ${allResults.length}`);

    // Save ALL results to database
    let savedCount = 0;
    for (const { result: item, provider } of allResults) {
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
              provider,
            },
          },
        });
        savedCount++;
      }
    }

    // Update task status
    await prisma.searchTask.update({
      where: { id: taskId },
      data: { status: 'COMPLETED' },
    });

    const providerSummary = [...new Set(allResults.map(r => r.provider))].join(', ');
    console.log(`[SearchService] Task ${taskId} COMPLETED. Providers: [${providerSummary}]. Saved ${savedCount} unique results.`);
  } catch (error: any) {
    console.error(`[SearchService] Task ${taskId} FAILED:`, error);
    await prisma.searchTask.update({
      where: { id: taskId },
      data: { status: 'FAILED' },
    });
  }
}
