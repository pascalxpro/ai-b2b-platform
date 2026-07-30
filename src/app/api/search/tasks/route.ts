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
    
    const tasks = await prisma.searchTask.findMany({
      where,
      include: {
        createdBy: { select: { name: true } },
        _count: { select: { searchResults: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    return NextResponse.json(tasks);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Default status is usually DRAFT or QUEUED, let's set to QUEUED
    const task = await prisma.searchTask.create({ 
      data: {
        ...body,
        status: 'QUEUED'
      } 
    });
    
    // Execute search asynchronously
    if (body.autoStart) {
      // Not waiting for it to finish to return the response quickly
      executeSearchTask(task.id).catch(console.error);
    }
    
    return NextResponse.json(task, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
