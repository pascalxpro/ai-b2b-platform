import { NextRequest, NextResponse } from 'next/server';
import { searchStore } from '@/lib/search/store';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = searchStore.getResult(id);
    if (!result) {
      return NextResponse.json({ error: 'Result not found' }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const updated = searchStore.updateResult(id, {
      ...body,
      updatedAt: new Date().toISOString()
    });
    
    if (!updated) {
      return NextResponse.json({ error: 'Result not found' }, { status: 404 });
    }
    
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
