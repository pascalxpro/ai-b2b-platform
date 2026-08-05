import type { QualityStatus } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { loadSettingsFromDb } from '@/lib/settings/settingsService';
import { searchWithTavily, SearchProviderResult } from './providers/tavilyProvider';
import { searchWithSerper } from './providers/serperProvider';
import { searchWithGoogleCse } from './providers/googleCseProvider';
import { searchWithBingApi } from './providers/bingApiProvider';
import { searchWithExa } from './providers/exaProvider';
import { searchWithSearxng } from './providers/searxngProvider';
import { searchWithBraveApi } from './providers/braveApiProvider';
import { enrichCandidates, type EnrichmentResult } from './enrichment';
import { isoToCountryLabel } from './enrichment/phone';

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

// ─── Locale helpers: build Accept-Language + engine-specific region params ───
// NOTE: kl/vl/cc/mkt values below are best-effort per public docs/community references
// and have not been live-verified against every provider — check logs after deploy.
interface GeoParams { gl: string; hl: string }

function buildAcceptLanguage(geo?: GeoParams): string {
  if (!geo) return 'en-US,en;q=0.9';
  const primary = geo.hl;
  const base = primary.split('-')[0];
  return base === primary
    ? `${primary},en;q=0.8`
    : `${primary},${base};q=0.9,en;q=0.7`;
}

const DDG_REGION: Record<string, string> = {
  jp: 'jp-jp', tw: 'tw-tzh', us: 'us-en', vn: 'vn-en', th: 'th-en',
  de: 'de-de', kr: 'kr-kr', cn: 'cn-zh', id: 'id-en', my: 'my-en',
  in: 'in-en', uk: 'uk-en', fr: 'fr-fr', it: 'it-it', es: 'es-es',
  au: 'au-en', ph: 'ph-en', sg: 'sg-en',
};

// ─── Yahoo Search (multi-page for more results) ───
async function searchYahoo(query: string, targetCount: number, geo?: GeoParams): Promise<SearchProviderResult[]> {
  console.log(`[Yahoo] Searching: "${query}" (target: ${targetCount}, geo: ${geo?.gl || 'none'})`);
  const results: SearchProviderResult[] = [];
  const seen = new Set<string>();
  const maxPages = Math.min(5, Math.ceil(targetCount / 10));
  const acceptLanguage = buildAcceptLanguage(geo);
  const vlParam = geo ? `&vl=lang_${geo.hl.split('-')[0]}` : '';

  for (let page = 0; page < maxPages; page++) {
    const startIndex = page * 10 + 1;
    try {
      const res = await fetch(`https://search.yahoo.com/search?p=${encodeURIComponent(query)}&b=${startIndex}${vlParam}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': acceptLanguage,
        },
      });
      if (!res.ok) break;

      const html = await res.text();
      let pageFound = 0;
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
        pageFound++;
      }

      console.log(`[Yahoo] Page ${page + 1}: found ${pageFound} results`);
      if (pageFound === 0) break; // No more results
      if (results.length >= targetCount) break;

      // Small delay between pages to avoid rate limiting
      if (page < maxPages - 1) {
        await new Promise(r => setTimeout(r, 500));
      }
    } catch (e: any) {
      console.error(`[Yahoo] Page ${page + 1} failed:`, e.message);
      break;
    }
  }

  console.log(`[Yahoo] Total: ${results.length} results from ${maxPages} pages`);
  return results;
}

// ─── DuckDuckGo POST Search ───
async function searchDDG(query: string, targetCount: number, geo?: GeoParams): Promise<SearchProviderResult[]> {
  console.log(`[DDG] Searching: "${query}" (geo: ${geo?.gl || 'none'})`);
  try {
    const acceptLanguage = buildAcceptLanguage(geo);
    const kl = geo ? DDG_REGION[geo.gl] : undefined;
    const res = await fetch('https://html.duckduckgo.com/html/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html',
        'Accept-Language': acceptLanguage,
      },
      body: `q=${encodeURIComponent(query)}&b=${kl ? `&kl=${kl}` : ''}`,
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
async function searchBing(query: string, targetCount: number, geo?: GeoParams): Promise<SearchProviderResult[]> {
  console.log(`[Bing] Searching: "${query}" (geo: ${geo?.gl || 'none'})`);
  try {
    const acceptLanguage = buildAcceptLanguage(geo);
    const setlang = geo?.hl || 'en';
    const cc = geo ? `&cc=${geo.gl.toUpperCase()}` : '';
    const res = await fetch(`https://www.bing.com/search?q=${encodeURIComponent(query)}&setlang=${setlang}${cc}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': acceptLanguage,
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
    const countries: string[] = Array.isArray(crit.countries) ? crit.countries : [];
    const industriesStr = Array.isArray(crit.industries) ? crit.industries.join(' ') : '';
    const keywordsStr = Array.isArray(crit.keywords) ? crit.keywords.join(' ') : '';
    const companyTypesStr = Array.isArray(crit.companyTypes) ? crit.companyTypes.join(' ') : '';

    // Country to TLD / English name mapping for geo-targeted search
    const COUNTRY_INFO: Record<string, { tlds: string[]; en: string; lang: string }> = {
      '日本': { tlds: ['.jp', '.co.jp'], en: 'Japan', lang: 'ja' },
      '台灣': { tlds: ['.tw', '.com.tw'], en: 'Taiwan', lang: 'zh-TW' },
      '美國': { tlds: ['.us'], en: 'USA', lang: 'en' },
      '越南': { tlds: ['.vn'], en: 'Vietnam', lang: 'vi' },
      '泰國': { tlds: ['.th', '.co.th'], en: 'Thailand', lang: 'th' },
      '德國': { tlds: ['.de'], en: 'Germany', lang: 'de' },
      '韓國': { tlds: ['.kr', '.co.kr'], en: 'Korea', lang: 'ko' },
      '中國': { tlds: ['.cn', '.com.cn'], en: 'China', lang: 'zh-CN' },
      '印尼': { tlds: ['.id', '.co.id'], en: 'Indonesia', lang: 'id' },
      '馬來西亞': { tlds: ['.my', '.com.my'], en: 'Malaysia', lang: 'ms' },
      '印度': { tlds: ['.in', '.co.in'], en: 'India', lang: 'en' },
      '英國': { tlds: ['.uk', '.co.uk'], en: 'UK', lang: 'en' },
      '法國': { tlds: ['.fr'], en: 'France', lang: 'fr' },
      '義大利': { tlds: ['.it'], en: 'Italy', lang: 'it' },
      '西班牙': { tlds: ['.es'], en: 'Spain', lang: 'es' },
      '澳洲': { tlds: ['.au', '.com.au'], en: 'Australia', lang: 'en' },
      '菲律賓': { tlds: ['.ph'], en: 'Philippines', lang: 'en' },
      '新加坡': { tlds: ['.sg', '.com.sg'], en: 'Singapore', lang: 'en' },
    };

    // Collect TLDs for post-filtering and site: restriction
    const targetTlds: string[] = [];
    const countryEnNames: string[] = [];
    for (const c of countries) {
      const info = COUNTRY_INFO[c];
      if (info) {
        targetTlds.push(...info.tlds);
        countryEnNames.push(info.en);
      }
    }

    // Build search queries — use English country name + industry terms
    // This produces much better geo-targeted results than Chinese-only queries
    const baseQuery = task.queryText || crit.queryText || '';
    const enCountryStr = countryEnNames.join(' ');

    // Primary query: use English country name for better geo-targeting
    const queryParts = [baseQuery, enCountryStr, industriesStr, keywordsStr, companyTypesStr].filter(Boolean);
    const fullQuery = queryParts.join(' ').trim();

    // For scrapers: add site: TLD restriction (pick the main TLD per country)
    const mainTlds = countries.map(c => COUNTRY_INFO[c]?.tlds[0]).filter(Boolean);
    const siteRestriction = mainTlds.length === 1
      ? `site:${mainTlds[0]}`
      : mainTlds.length > 1
        ? mainTlds.map(tld => `site:${tld}`).join(' OR ')
        : '';

    // Geo query for scrapers — base query + site restriction
    const geoQuery = siteRestriction
      ? `${baseQuery} ${industriesStr} ${keywordsStr} ${companyTypesStr} ${siteRestriction}`.replace(/\s+/g, ' ').trim()
      : fullQuery;

    const requestedCount = crit.targetCount || task.targetCount || 10;

    // Short query for additional coverage
    const shortQuery = [enCountryStr, keywordsStr || industriesStr,
      companyTypesStr ? companyTypesStr.split(' ')[0] : '',
    ].filter(Boolean).join(' ').trim() || fullQuery;
    const geoShortQuery = siteRestriction
      ? `${shortQuery} ${siteRestriction}`.trim()
      : shortQuery;

    console.log(`[SearchService] Task ${taskId} executing.`);
    console.log(`[SearchService] Full query: "${fullQuery}"`);
    console.log(`[SearchService] Geo query (scrapers): "${geoQuery}"`);
    console.log(`[SearchService] Short query: "${shortQuery}"`);
    console.log(`[SearchService] Target TLDs: ${targetTlds.join(', ') || 'none'}`);

    // Build API engine parameters
    // NOTE: Tavily/Exa "include_domains" was previously fed bare TLD strings (e.g. "jp"),
    // which those APIs do not treat as a valid domain suffix filter — removed in favor of
    // the unified post-merge country-confidence filter below, which is verified to work.
    // gl/hl — Google/Bing country+language codes, applied when exactly one country is targeted
    // (a single API call can only carry one geo bias; multi-country runs need per-country
    // calls, which is a larger structural change tracked separately)
    const COUNTRY_GL: Record<string, { gl: string; hl: string }> = {
      '日本': { gl: 'jp', hl: 'ja' },
      '台灣': { gl: 'tw', hl: 'zh-TW' },
      '美國': { gl: 'us', hl: 'en' },
      '越南': { gl: 'vn', hl: 'vi' },
      '泰國': { gl: 'th', hl: 'th' },
      '德國': { gl: 'de', hl: 'de' },
      '韓國': { gl: 'kr', hl: 'ko' },
      '中國': { gl: 'cn', hl: 'zh-CN' },
      '印尼': { gl: 'id', hl: 'id' },
      '馬來西亞': { gl: 'my', hl: 'ms' },
      '印度': { gl: 'in', hl: 'en' },
      '英國': { gl: 'uk', hl: 'en' },
      '法國': { gl: 'fr', hl: 'fr' },
      '義大利': { gl: 'it', hl: 'it' },
      '西班牙': { gl: 'es', hl: 'es' },
      '澳洲': { gl: 'au', hl: 'en' },
      '菲律賓': { gl: 'ph', hl: 'en' },
      '新加坡': { gl: 'sg', hl: 'en' },
    };
    const primaryGeo: GeoParams | undefined = countries.length === 1 ? COUNTRY_GL[countries[0]] : undefined;
    // Bing "mkt" market code (e.g. "ja-JP") — hl is already a full locale for some
    // languages (zh-TW/zh-CN), so avoid double-appending the country suffix in that case
    const bingMkt = primaryGeo
      ? (primaryGeo.hl.includes('-') ? primaryGeo.hl : `${primaryGeo.hl}-${primaryGeo.gl.toUpperCase()}`)
      : undefined;

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
              promise: searchWithSerper(fullQuery, requestedCount, keys, primaryGeo).then(r => r.results || []).catch(e => { console.warn(`[${name}] Failed:`, e.message); return []; }),
            });
          }
          break;

        case 'google_cse':
          if (keys.trim() && extra.trim()) {
            providerPromises.push({
              name,
              promise: searchWithGoogleCse(fullQuery, requestedCount, keys, extra, primaryGeo ? {
                gl: primaryGeo.gl,
                cr: `country${primaryGeo.gl.toUpperCase()}`,
                lr: `lang_${primaryGeo.hl}`,
              } : undefined).then(r => r.results || []).catch(e => { console.warn(`[${name}] Failed:`, e.message); return []; }),
            });
          }
          break;

        case 'bing_api':
          if (keys.trim()) {
            providerPromises.push({
              name,
              promise: searchWithBingApi(fullQuery, requestedCount, keys, primaryGeo ? {
                mkt: bingMkt,
                cc: primaryGeo.gl.toUpperCase(),
              } : undefined).then(r => r.results || []).catch(e => { console.warn(`[${name}] Failed:`, e.message); return []; }),
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
          providerPromises.push({ name, promise: searchYahoo(geoQuery, requestedCount, primaryGeo).catch(() => []) });
          if (geoShortQuery !== geoQuery) {
            providerPromises.push({ name, promise: searchYahoo(geoShortQuery, requestedCount, primaryGeo).catch(() => []) });
          }
          break;

        case 'duckduckgo':
          providerPromises.push({ name, promise: searchDDG(geoQuery, requestedCount, primaryGeo).catch(() => []) });
          if (geoShortQuery !== geoQuery) {
            providerPromises.push({ name, promise: searchDDG(geoShortQuery, requestedCount, primaryGeo).catch(() => []) });
          }
          break;

        case 'bing_scraper':
          providerPromises.push({ name, promise: searchBing(geoQuery, requestedCount, primaryGeo).catch(() => []) });
          if (geoShortQuery !== geoQuery) {
            providerPromises.push({ name, promise: searchBing(geoShortQuery, requestedCount, primaryGeo).catch(() => []) });
          }
          break;
      }
    }

    // No provider was dispatched at all — every engine is either disabled or
    // enabled but missing the API key / extra config it needs. Previously this
    // still finished as COMPLETED with zero results, which is indistinguishable
    // from "searched properly and found nothing".
    if (providerPromises.length === 0) {
      const reason = enabledEngines.length === 0
        ? '沒有啟用任何搜尋引擎，請至「系統管理 → 搜尋引擎管理」勾選並設定引擎。'
        : `已啟用的引擎（${enabledEngines.map(e => e.id).join(', ')}）都缺少必要的 API Key 或設定，無法執行搜尋。`;
      console.error(`[SearchService] Task ${taskId} aborted: ${reason}`);
      await prisma.searchTask.update({
        where: { id: taskId },
        data: { status: 'FAILED', errorMessage: reason },
      });
      return;
    }

    // Wait for ALL providers to complete
    const providerResults = await Promise.allSettled(
      providerPromises.map(p => p.promise)
    );

    // Merge and deduplicate results from all providers.
    // countryConfidence reflects how sure we are the result actually belongs to a
    // targeted country: 'high' = TLD directly matches, 'low' = ambiguous generic TLD
    // (.com/.net/.org — kept, not dropped, since many legitimate local companies use them,
    // but must not be silently treated as equal to a confirmed match), 'unscoped' = no
    // country filter was requested.
    type CountryConfidence = 'high' | 'low' | 'unscoped';
    const mergedMap = new Map<string, { result: SearchProviderResult; provider: string; countryConfidence: CountryConfidence }>();

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

          // Post-filter: if target countries specified, only keep matching or ambiguous TLDs.
          // A TLD that clearly belongs to a different, non-targeted country is dropped —
          // only the generic .com/.net/.org case is kept-but-unverified, never silently
          // promoted to a confirmed match.
          let countryConfidence: CountryConfidence = 'unscoped';
          if (targetTlds.length > 0) {
            const matchesTld = targetTlds.some(tld => hostname.endsWith(tld.replace(/^\./, '')));
            const isGenericTld = hostname.endsWith('.com') || hostname.endsWith('.net') || hostname.endsWith('.org');
            if (!matchesTld && !isGenericTld) continue;
            countryConfidence = matchesTld ? 'high' : 'low';
          }

          // Store the cleaned version
          const cleanedItem = { ...item, website: cleanedWebsite };

          if (!mergedMap.has(hostname)) {
            mergedMap.set(hostname, { result: cleanedItem, provider: providerName, countryConfidence });
          } else {
            const existing = mergedMap.get(hostname)!;
            // Prefer a higher-confidence match if a later provider confirms one
            if (countryConfidence === 'high' && existing.countryConfidence !== 'high') {
              mergedMap.set(hostname, { result: cleanedItem, provider: providerName, countryConfidence });
            } else if (cleanedItem.companyName !== hostname && existing.result.companyName === hostname) {
              // If this provider has a better company name (not just hostname), update it
              mergedMap.set(hostname, { result: cleanedItem, provider: providerName, countryConfidence: existing.countryConfidence });
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

    // ── Content enrichment for TLD-unverified (low-confidence) candidates ──
    // Fetches the actual page for every 'low' item (a generic .com/.net/.org
    // domain that only entered the pool because it wasn't excludable) and
    // classifies it using the page's real company name, its phone numbers'
    // country codes, and whether the URL structure looks like an article or
    // directory rather than a business site. This is what catches "searched
    // Japan, got a Taiwanese company" and "result is a blog post, not a
    // company" — neither of which the TLD-only check can distinguish.
    const lowConfidenceEntries = allResults.filter(r => r.countryConfidence === 'low');
    let enrichmentMap = new Map<string, EnrichmentResult>();
    if (lowConfidenceEntries.length > 0) {
      console.log(`[SearchService] Enriching ${lowConfidenceEntries.length} TLD-unverified candidates...`);
      try {
        enrichmentMap = await enrichCandidates(
          lowConfidenceEntries.map(e => e.result.website),
          countries
        );
      } catch (e) {
        // Enrichment is a precision improvement, not a required step — a
        // failure here must not take down the whole search task.
        console.error('[SearchService] Enrichment batch failed:', e);
      }
    }

    // Save ALL results to database
    // TLD to country name mapping for auto-detection
    const TLD_COUNTRY: Record<string, string> = {
      '.jp': '日本', '.tw': '台灣', '.us': '美國', '.vn': '越南',
      '.th': '泰國', '.de': '德國', '.kr': '韓國', '.cn': '中國',
      '.id': '印尼', '.my': '馬來西亞', '.in': '印度', '.uk': '英國',
      '.fr': '法國', '.it': '義大利', '.es': '西班牙', '.au': '澳洲',
      '.ph': '菲律賓', '.sg': '新加坡', '.br': '巴西', '.mx': '墨西哥',
      '.nl': '荷蘭', '.se': '瑞典', '.ch': '瑞士', '.at': '奧地利',
      '.nz': '紐西蘭', '.ca': '加拿大', '.hk': '香港',
    };

    // Returns the country the TLD actually indicates, or null when the domain (e.g. a
    // generic .com/.net/.org) gives no reliable signal. IMPORTANT: this must never fall
    // back to "assume it's whatever country the user searched for" — that fallback was
    // the direct cause of unrelated-country results being mislabeled as the target
    // country (e.g. a Taiwanese .com company saved as "日本" just because the user
    // searched Japan). Callers should treat a null return as "country unverified".
    function detectCountry(url: string): string | null {
      try {
        const hostname = new URL(url).hostname.toLowerCase();
        // Check longest TLDs first (e.g. .co.uk, .com.au)
        if (hostname.endsWith('.co.uk')) return '英國';
        if (hostname.endsWith('.com.au')) return '澳洲';
        if (hostname.endsWith('.co.jp')) return '日本';
        if (hostname.endsWith('.co.kr')) return '韓國';
        if (hostname.endsWith('.com.tw')) return '台灣';
        if (hostname.endsWith('.com.hk')) return '香港';
        if (hostname.endsWith('.com.br')) return '巴西';
        if (hostname.endsWith('.com.mx')) return '墨西哥';
        // Check simple TLDs
        for (const [tld, country] of Object.entries(TLD_COUNTRY)) {
          if (hostname.endsWith(tld)) return country;
        }
      } catch {}
      return null;
    }

    let savedCount = 0;
    for (const { result: item, provider, countryConfidence } of allResults) {
      const existing = await prisma.searchResult.findFirst({
        where: { searchTaskId: taskId, website: item.website },
      });

      if (!existing) {
        // Calculate quality score based on data completeness and relevance
        let score = 40; // base score for having a valid website
        const hostname = (() => { try { return new URL(item.website).hostname.replace('www.', ''); } catch { return ''; } })();

        // Company name quality (not just hostname)
        if (item.companyName && item.companyName !== hostname && item.companyName.length > 2) {
          score += 15;
        }
        // Has meaningful title
        if (item.title && item.title.length > 5) score += 8;
        // Has snippet/description
        if (item.snippet && item.snippet.length > 20) score += 10;
        // TLD matches target country
        if (countryConfidence === 'high') score += 12;
        // Query terms appear in title/snippet (relevance)
        const queryTerms = baseQuery.split(/\s+/).filter((t: string) => t.length > 1);
        const titleSnippet = `${item.title || ''} ${item.snippet || ''}`.toLowerCase();
        const matchCount = queryTerms.filter((t: string) => titleSnippet.includes(t.toLowerCase())).length;
        if (matchCount > 0) score += Math.min(15, matchCount * 5);

        // Low-confidence country matches (ambiguous .com/.net/.org that didn't hit a
        // target TLD) are kept but flagged for manual review rather than silently
        // trusted — see detectCountry() and the post-filter above.
        let detectedCountry = detectCountry(item.website);
        let finalCountryConfidence: CountryConfidence = countryConfidence;
        let finalQualityStatus: QualityStatus = countryConfidence === 'low' ? 'PENDING_REVIEW' : 'NEW';
        let finalCompanyName = item.companyName;
        let enrichment: EnrichmentResult | undefined;

        if (countryConfidence === 'low') {
          enrichment = enrichmentMap.get(item.website);
          if (enrichment?.verdict === 'verified') {
            // Phone number confirms the target country — this is the one case
            // where it's safe to promote a generic-TLD result to 'high'.
            finalCountryConfidence = 'high';
            finalQualityStatus = 'NEW';
            score += 20;
            if (enrichment.matchedCountry) detectedCountry = enrichment.matchedCountry;
            if (enrichment.companyName) finalCompanyName = enrichment.companyName;
          } else if (enrichment?.verdict === 'wrong-country' || enrichment?.verdict === 'not-company') {
            // Confirmed wrong country, or confirmed not a company at all
            // (article/directory/wiki) — exclude from the active pool rather
            // than leaving it to masquerade as an unreviewed candidate.
            finalQualityStatus = 'INVALID';
            if (enrichment.verdict === 'wrong-country' && enrichment.phoneCountries[0]) {
              detectedCountry = isoToCountryLabel(enrichment.phoneCountries[0]);
            }
            if (enrichment.companyName) finalCompanyName = enrichment.companyName;
          }
          // 'unverified' (fetch failed, or no conclusive signal): leave
          // exactly as the TLD-only check already decided.
        }

        score = Math.min(100, Math.max(20, score));

        await prisma.searchResult.create({
          data: {
            searchTaskId: taskId,
            workspaceId: task.workspaceId,
            // The account whose search produced this row owns it. Without
            // this, new results would be ownerless and only reachable through
            // the legacy backfill.
            ownerUserId: task.createdById,
            companyName: finalCompanyName,
            website: item.website,
            country: detectedCountry,
            sourceCount: 1,
            qualityStatus: finalQualityStatus,
            conversionStatus: 'NONE',
            scoreJson: {
              title: item.title,
              description: item.snippet,
              provider,
              totalScore: score,
              countryConfidence: finalCountryConfidence,
              ...(enrichment ? { enrichment: { verdict: enrichment.verdict, reason: enrichment.reason } } : {}),
            },
          },
        });
        savedCount++;
      }
    }

    // Every provider ran but nothing usable came back. Record why, so the task
    // detail page can explain it instead of just showing an empty table.
    const providerErrors = providerResults
      .map((o, i) => (o.status === 'rejected' ? providerPromises[i].name : null))
      .filter(Boolean);
    const emptyReason = savedCount === 0
      ? providerErrors.length === providerPromises.length
        ? `所有搜尋引擎都呼叫失敗（${[...new Set(providerErrors)].join(', ')}），請確認 API Key 是否有效或額度是否用盡。`
        : '搜尋引擎有回應，但沒有任何結果通過過濾條件（可能是關鍵字太窄、國別限制過嚴，或結果都被排除清單擋下）。'
      : null;

    await prisma.searchTask.update({
      where: { id: taskId },
      data: { status: 'COMPLETED', errorMessage: emptyReason },
    });

    const providerSummary = [...new Set(allResults.map(r => r.provider))].join(', ');
    console.log(`[SearchService] Task ${taskId} COMPLETED. Providers: [${providerSummary}]. Saved ${savedCount} unique results.`);
  } catch (error: any) {
    console.error(`[SearchService] Task ${taskId} FAILED:`, error);
    await prisma.searchTask.update({
      where: { id: taskId },
      // Keep the reason: the UI previously showed a bare "失敗" with no clue.
      data: { status: 'FAILED', errorMessage: String(error?.message || error).substring(0, 500) },
    });
  }
}
