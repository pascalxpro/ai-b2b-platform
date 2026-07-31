export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { executeSearchTask } from '@/lib/search/searchService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    
    const where: any = {};
    if (workspaceId) where.workspaceId = workspaceId;
    const limit = searchParams.get('limit');
    
    const tasks = await prisma.searchTask.findMany({
      where,
      include: {
        createdBy: { select: { name: true } },
        _count: { select: { searchResults: true } },
      },
      orderBy: { createdAt: 'desc' },
      ...(limit ? { take: parseInt(limit, 10) } : {}),
    });
    
    return NextResponse.json(tasks);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // For demo/prototype, use the first workspace and user if not provided via auth session
    const defaultWorkspace = await prisma.workspace.findFirst();
    const defaultUser = await prisma.user.findFirst();
    
    if (!defaultWorkspace || !defaultUser) {
      throw new Error("No default workspace or user found");
    }

    const { name, criteria, autoStart } = body;
    
    const task = await prisma.searchTask.create({ 
      data: {
        name: name || '未命名搜尋',
        workspaceId: defaultWorkspace.id,
        createdById: defaultUser.id,
        queryText: criteria?.queryText || '',
        criteriaJson: criteria || {},
        targetCount: criteria?.targetCount || 50,
        status: 'QUEUED'
      } 
    });
    
    // Execute search synchronously - must await because serverless runtimes
    // kill background tasks after response is sent
    if (autoStart) {
      try {
        await executeSearchTask(task.id);
      } catch (e) {
        console.error('Search execution error:', e);
      }
      
      // Re-fetch task with results to return to client
      const updatedTask = await prisma.searchTask.findUnique({
        where: { id: task.id },
        include: {
          searchResults: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });
      return NextResponse.json(updatedTask, { status: 201 });
    }
    
    return NextResponse.json(task, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/search/tasks:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
