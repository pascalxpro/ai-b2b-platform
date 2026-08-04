export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/guard';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = request.nextUrl;
    const workspaceId = searchParams.get('workspaceId');

    const where: any = {};
    if (workspaceId) where.workspaceId = workspaceId;

    const knowledgeItems = await prisma.knowledgeItem.findMany({
      where,
      include: { createdBy: { select: { name: true } } },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(knowledgeItems);
  } catch (error) {
    console.error('Failed to fetch knowledge items:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const knowledgeItem = await prisma.knowledgeItem.create({ data: body });
    return NextResponse.json(knowledgeItem, { status: 201 });
  } catch (error) {
    console.error('Failed to create knowledge item:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
