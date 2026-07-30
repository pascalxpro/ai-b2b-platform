export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    
    const where: any = {};
    if (workspaceId) where.workspaceId = workspaceId;

    const saved = await prisma.savedSearch.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    
    return NextResponse.json(saved);
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

    const { name, criteria } = body;
    
    const saved = await prisma.savedSearch.create({ 
      data: {
        name: name || '未命名儲存條件',
        workspaceId: defaultWorkspace.id,
        ownerUserId: defaultUser.id,
        criteriaJson: criteria || {}
      } 
    });
    
    return NextResponse.json(saved, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/search/saved:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
