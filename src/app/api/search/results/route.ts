export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/guard';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const searchTaskId = searchParams.get('searchTaskId') || searchParams.get('taskId');
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');
    
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;
    const offset = offsetParam ? parseInt(offsetParam, 10) : undefined;
    
    const where: any = {};
    if (workspaceId) where.workspaceId = workspaceId;
    if (searchTaskId) where.searchTaskId = searchTaskId;
    
    if (status) {
      // Treat status as qualityStatus for filtering
      where.qualityStatus = status;
    }
    if (search) {
      where.companyName = { contains: search, mode: 'insensitive' };
    }
    
    const results = await prisma.searchResult.findMany({
      where,
      include: {
        searchTask: { select: { name: true } },
        sources: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
    
    return NextResponse.json(results);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
