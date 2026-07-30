import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    const knowledgeItems = await prisma.knowledgeItem.findMany({
      where: { workspaceId },
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
  try {
    const body = await request.json();
    const knowledgeItem = await prisma.knowledgeItem.create({ data: body });
    return NextResponse.json(knowledgeItem, { status: 201 });
  } catch (error) {
    console.error('Failed to create knowledge item:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
