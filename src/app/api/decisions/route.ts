import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    
    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });
    }
    
    const decisions = await prisma.approval.findMany({
      where: { workspaceId },
      include: {
        requester: { select: { name: true } },
        approver: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(decisions);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const decision = await prisma.approval.create({ data: body });
    return NextResponse.json(decision, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, approverId, reason } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }
    
    const decision = await prisma.approval.update({
      where: { id },
      data: { status, approverId, reason },
    });
    return NextResponse.json(decision);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
