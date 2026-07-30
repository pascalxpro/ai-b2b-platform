import { NextRequest, NextResponse } from 'next/server';
import { searchStore } from '@/lib/search/store';
import { randomUUID } from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const saved = searchStore.listSavedSearches();
    return NextResponse.json(saved);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, criteria } = body;
    
    if (!name || !criteria) {
      return NextResponse.json({ error: 'Name and criteria are required' }, { status: 400 });
    }
    
    const saved = searchStore.createSavedSearch({
      id: randomUUID(),
      name,
      criteria,
      createdAt: new Date().toISOString(),
    });
    
    return NextResponse.json(saved, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
