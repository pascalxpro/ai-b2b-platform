import { NextRequest, NextResponse } from 'next/server';
import { searchStore } from '@/lib/search/store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids, updates } = body;
    
    if (!Array.isArray(ids)) {
      return NextResponse.json({ error: 'ids must be an array' }, { status: 400 });
    }
    
    const count = searchStore.batchUpdateResults(ids, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
    
    return NextResponse.json({ updated: count });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
