import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { QualityStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');
    
    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });
    }
    
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;
    const offset = offsetParam ? parseInt(offsetParam, 10) : undefined;
    
    const where: any = { workspaceId };
    
    if (status) {
      // Treat status as qualityStatus for filtering
      where.qualityStatus = status as QualityStatus;
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
