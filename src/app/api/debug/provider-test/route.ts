export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { searchWithDuckDuckGo } from '@/lib/search/providers/duckDuckGoProvider';
import { searchWithYahoo } from '@/lib/search/providers/yahooProvider';
import { getSystemSettings } from '@/lib/settings/settingsService';

export async function GET(request: NextRequest) {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    settings: null,
    tests: {},
  };

  try {
    // Show current settings
    const settings = getSystemSettings();
    diagnostics.settings = settings;

    // Build same query as searchService would
    const testQuery = '找在日本具有貿易商與當地經銷商的公司，批發食品容器 日本 餐飲業 PLA 紙杯 製造商 經銷商 批發商';
    diagnostics.queryUsed = testQuery;

    // Test DuckDuckGo directly
    try {
      const ddgResult = await searchWithDuckDuckGo(testQuery, 10);
      diagnostics.tests.duckduckgo = {
        resultCount: ddgResult.results.length,
        results: ddgResult.results.slice(0, 3),
      };
    } catch (e: any) {
      diagnostics.tests.duckduckgo = { error: e.message, stack: e.stack };
    }

    // Test Yahoo directly  
    try {
      const yahooResult = await searchWithYahoo(testQuery, 10);
      diagnostics.tests.yahoo = {
        resultCount: yahooResult.results.length,
        results: yahooResult.results.slice(0, 5),
      };
    } catch (e: any) {
      diagnostics.tests.yahoo = { error: e.message, stack: e.stack };
    }

  } catch (e: any) {
    diagnostics.fatalError = { message: e.message, stack: e.stack };
  }

  return NextResponse.json(diagnostics);
}
