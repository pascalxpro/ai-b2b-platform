export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/guard';
import { getOrCreateDefaultWorkspace } from '@/lib/db/workspace';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

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
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();

    // Same fix as the search-task route: create the workspace on first use
    // instead of failing, and credit the authenticated caller rather than
    // whichever user happened to be first in the table.
    const workspace = await getOrCreateDefaultWorkspace(auth.id);

    const { name, criteria } = body;

    const saved = await prisma.savedSearch.create({
      data: {
        name: name || '未命名儲存條件',
        workspaceId: workspace.id,
        ownerUserId: auth.id,
        criteriaJson: criteria || {}
      }
    });
    
    return NextResponse.json(saved, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/search/saved:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
