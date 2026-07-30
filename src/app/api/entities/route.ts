export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const workspaceId = searchParams.get('workspaceId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const where: any = {};
    if (workspaceId) where.workspaceId = workspaceId;
    if (status) {
      where.status = status;
    }
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const entities = await prisma.businessEntity.findMany({
      where,
      include: { leadScore: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(entities);
  } catch (error) {
    console.error('Failed to fetch entities:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const entity = await prisma.businessEntity.create({ data: body });
    return NextResponse.json(entity, { status: 201 });
  } catch (error) {
    console.error('Failed to create entity:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
