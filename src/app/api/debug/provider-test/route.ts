export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { loadSettingsFromDb } from '@/lib/settings/settingsService';
import { searchWithSerper } from '@/lib/search/providers/serperProvider';
import { searchWithExa } from '@/lib/search/providers/exaProvider';
import { searchWithTavily } from '@/lib/search/providers/tavilyProvider';

export async function GET(request: NextRequest) {
  const query = 'Japan food packaging manufacturer';
  const results: any = { query, timestamp: new Date().toISOString(), engines: {} };

  const settings = await loadSettingsFromDb();
  const engines = settings.searchEngines || [];

  // Test Tavily
  const tavily = engines.find(e => e.id === 'tavily');
  if (tavily?.enabled && tavily.apiKeys?.trim()) {
    try {
      const r = await searchWithTavily(query, 5, tavily.apiKeys);
      results.engines.tavily = { status: 'OK', resultCount: r.results?.length || 0, sample: r.results?.slice(0, 2) };
    } catch (e: any) {
      results.engines.tavily = { status: 'ERROR', error: e.message };
    }
  } else {
    results.engines.tavily = { status: 'DISABLED_OR_NO_KEY' };
  }

  // Test Serper
  const serper = engines.find(e => e.id === 'serper');
  if (serper?.enabled && serper.apiKeys?.trim()) {
    try {
      const r = await searchWithSerper(query, 5, serper.apiKeys);
      results.engines.serper = { status: 'OK', resultCount: r.results?.length || 0, sample: r.results?.slice(0, 2) };
    } catch (e: any) {
      results.engines.serper = { status: 'ERROR', error: e.message };
    }
  } else {
    results.engines.serper = { status: 'DISABLED_OR_NO_KEY' };
  }

  // Test Exa
  const exa = engines.find(e => e.id === 'exa');
  if (exa?.enabled && exa.apiKeys?.trim()) {
    try {
      const r = await searchWithExa(query, 5, exa.apiKeys);
      results.engines.exa = { status: 'OK', resultCount: r.results?.length || 0, sample: r.results?.slice(0, 2) };
    } catch (e: any) {
      results.engines.exa = { status: 'ERROR', error: e.message };
    }
  } else {
    results.engines.exa = { status: 'DISABLED_OR_NO_KEY' };
  }

  return NextResponse.json(results);
}
