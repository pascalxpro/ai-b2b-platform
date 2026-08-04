import { fetchPageSignals } from './pageFetch';
import { classifySignals, type EnrichmentResult } from './classify';

export type { EnrichmentResult, EnrichmentVerdict } from './classify';

const CONCURRENCY = 5;

/**
 * Runs enrichment (fetch + classify) for a batch of candidate URLs, capping
 * how many run at once. This is the step that only runs on TLD-unverified
 * ("low confidence") results, so the batch is normally a minority of a run,
 * but an unbounded Promise.all across 50 external hosts would still be worth
 * avoiding — some will hang until the per-request timeout, and firing them
 * all at once is impolite to whichever sites are on the list.
 */
export async function enrichCandidates(
  urls: string[],
  targetCountries: string[]
): Promise<Map<string, EnrichmentResult>> {
  const results = new Map<string, EnrichmentResult>();
  let cursor = 0;

  async function worker() {
    while (cursor < urls.length) {
      const url = urls[cursor++];
      try {
        const signals = await fetchPageSignals(url);
        results.set(url, classifySignals(signals, targetCountries));
      } catch (e) {
        // fetchPageSignals already catches its own errors and returns
        // fetchOk:false; this is a last-resort guard so one bad URL (e.g. an
        // unparseable one) can't take down the whole batch.
        results.set(url, { verdict: 'unverified', phoneCountries: [], reason: String(e) });
      }
    }
  }

  const workers = Array.from({ length: Math.min(CONCURRENCY, urls.length) }, () => worker());
  await Promise.all(workers);
  return results;
}
