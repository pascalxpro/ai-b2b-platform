import { NextRequest, NextResponse } from 'next/server';
import { searchEngine } from '@/lib/search/search-engine';
import { searchStore } from '@/lib/search/store';

// POST: Create and optionally start a search task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, criteria, autoStart = true } = body;
    
    // Validate criteria
    if (!criteria) {
      return NextResponse.json({ error: 'Criteria required' }, { status: 400 });
    }
    
    const task = await searchEngine.createTask(name || 'Untitled Search', criteria);
    
    if (autoStart) {
      // Start execution in background (don't await)
      searchEngine.executeTask(task.id).catch(console.error);
    }
    
    return NextResponse.json(task, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET: List tasks with optional status filter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const tasks = searchStore.listTasks(status ? { status } : undefined);
    return NextResponse.json(tasks);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
