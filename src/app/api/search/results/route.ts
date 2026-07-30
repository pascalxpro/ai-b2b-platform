import { NextRequest, NextResponse } from 'next/server';
import { searchStore } from '@/lib/search/store';
import type { ResultsFilter, QualityStatus, ConversionStatus } from '@/lib/providers/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const filter: ResultsFilter = {
      taskId: searchParams.get('taskId') || undefined,
      qualityStatus: searchParams.get('qualityStatus')?.split(',').filter(Boolean) as QualityStatus[] || undefined,
      conversionStatus: searchParams.get('conversionStatus')?.split(',').filter(Boolean) as ConversionStatus[] || undefined,
      countries: searchParams.get('countries')?.split(',').filter(Boolean) || undefined,
      industries: searchParams.get('industries')?.split(',').filter(Boolean) || undefined,
      search: searchParams.get('search') || undefined,
      sortBy: searchParams.get('sortBy') || undefined,
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || undefined,
      page: searchParams.has('page') ? parseInt(searchParams.get('page')!) : undefined,
      pageSize: searchParams.has('pageSize') ? parseInt(searchParams.get('pageSize')!) : undefined,
    };

    const results = searchStore.listResults(filter);
    return NextResponse.json(results);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
