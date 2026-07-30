import { NextRequest, NextResponse } from 'next/server';
import { searchEngine } from '@/lib/search/search-engine';
import { searchStore } from '@/lib/search/store';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const task = searchStore.getTask(id);
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    return NextResponse.json(task);
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
    const { status, ...updates } = body;
    
    let task = searchStore.getTask(id);
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    if (status === 'CANCELLED' && task.status === 'RUNNING') {
      searchEngine.cancelTask(id);
      task = searchStore.updateTask(id, { status: 'CANCELLED' })!;
    } else {
      task = searchStore.updateTask(id, { status, ...updates })!;
    }
    
    return NextResponse.json(task);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
