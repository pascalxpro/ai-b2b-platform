export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await prisma.searchResult.findUnique({
      where: { id },
      include: {
        sources: true,
        searchTask: { select: { name: true } },
      },
    });
    
    if (!result) {
      return NextResponse.json({ error: 'Result not found' }, { status: 404 });
    }
    
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
