export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { executeSearchTask } from '@/lib/search/searchService';
import { requireAuth } from '@/lib/auth/guard';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const task = await prisma.searchTask.findUnique({
      where: { id },
      include: {
        createdBy: true,
        searchResults: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    
    return NextResponse.json(task);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const body = await request.json();
    
    const task = await prisma.searchTask.update({
      where: { id },
      data: body,
    });
    
    return NextResponse.json(task);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Re-run a search task (clear old results and execute again)
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;

    const task = await prisma.searchTask.findUnique({ where: { id } });
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Delete old results
    await prisma.searchResult.deleteMany({ where: { searchTaskId: id } });

    // Reset task status
    await prisma.searchTask.update({
      where: { id },
      data: { status: 'QUEUED', startedAt: null },
    });

    // Re-execute asynchronously
    executeSearchTask(id).catch(console.error);

    return NextResponse.json({ message: 'Task re-queued', taskId: id });
  } catch (error: any) {
    console.error('Error in POST /api/search/tasks/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
