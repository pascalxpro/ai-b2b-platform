/**
 * Fetches a candidate company page and extracts the signals used to verify
 * country and to filter out pages that were never a company in the first
 * place (articles, directories, product manuals).
 *
 * Deliberately plain HTTP GET, no headless browser: matches the reliability
 * level of the existing scraper providers, and keeps cost/latency down for
 * something that only runs on the subset of results needing verification.
 * The known tradeoff is that JS-rendered contact info won't be seen — that
 * must read as "unverified", never as "confirmed absent".
 */

export interface PageSignals {
  fetchOk: boolean;
  /** og:site_name or <title>, cleaned up — usually a much better company
   *  name than a search engine's page title (which is often an article
   *  headline for non-company results). */
  siteName?: string;
  /** <html lang="..."> or og:locale, e.g. "ja", "zh-TW". */
  htmlLang?: string;
  /** Raw visible text, capped, for phone-number scanning. */
  textSample: string;
  /** True if the URL path looks like an article/listing rather than a
   *  company site (used by the classifier alongside other signals). */
  looksLikeArticlePath: boolean;
}

const FETCH_TIMEOUT_MS = 6000;
const MAX_TEXT_SAMPLE = 20000;

// URL path patterns common to articles, directories, and wikis — checked
// against the path only (not the whole URL) so a company whose name happens
// to contain a similar word in the domain isn't penalized.
const ARTICLE_PATH_PATTERNS = [
  /\/(blog|article|articles|news|post|posts)\//i,
  /\/(wiki|wikipedia)\//i,
  /\/(directory|list|listing|top\d+)\//i,
];

function extractMeta(html: string, property: string): string | undefined {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`,
    'i'
  );
  return html.match(re)?.[1]?.trim();
}

function extractTitle(html: string): string | undefined {
  return html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim();
}

function extractHtmlLang(html: string): string | undefined {
  return html.match(/<html[^>]+lang=["']([^"']+)["']/i)?.[1]?.trim();
}

/** Strips tags/scripts/styles down to visible-ish text for phone scanning. */
function extractTextSample(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, MAX_TEXT_SAMPLE);
}

export async function fetchPageSignals(url: string): Promise<PageSignals> {
  const empty: PageSignals = { fetchOk: false, textSample: '', looksLikeArticlePath: false };

  let path = '';
  try {
    path = new URL(url).pathname;
  } catch {
    return empty;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
    });

    if (!res.ok) return empty;

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) return empty;

    const html = await res.text();
    const siteName = extractMeta(html, 'og:site_name') || extractTitle(html);
    const htmlLang = extractMeta(html, 'og:locale') || extractHtmlLang(html);

    return {
      fetchOk: true,
      siteName: siteName?.substring(0, 200),
      htmlLang: htmlLang?.toLowerCase(),
      textSample: extractTextSample(html),
      looksLikeArticlePath: ARTICLE_PATH_PATTERNS.some(re => re.test(path)),
    };
  } catch {
    // Timeout, network error, DNS failure, TLS error — all read as
    // "unverified", not as "definitely not a company".
    return empty;
  } finally {
    clearTimeout(timeout);
  }
}
