export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/guard';
import { visibilityFilter, canModifyResult } from '@/lib/search/ownership';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    // findFirst with the visibility filter, not findUnique by id: otherwise
    // any signed-in user could read any row by guessing/holding its id.
    const result = await prisma.searchResult.findFirst({
      where: { AND: [{ id }, visibilityFilter(auth)] },
      include: {
        sources: true,
        searchTask: { select: { name: true } },
        owner: { select: { id: true, name: true, email: true } },
        releasedBy: { select: { id: true, name: true, email: true } },
        claimedBy: { select: { id: true, name: true, email: true } },
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

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;

    // Released rows are visible to everyone but must stay editable only by
    // their owner — visibility and mutability are deliberately different.
    if (!(await canModifyResult(auth, id))) {
      return NextResponse.json(
        { error: '無權限修改此筆資料（僅擁有者可編輯）' },
        { status: 403 }
      );
    }

    const body = await request.json();

    const updateData: any = {};

    if (body.companyName !== undefined) updateData.companyName = body.companyName;
    if (body.website !== undefined) updateData.website = body.website;
    if (body.country !== undefined) updateData.country = body.country;
    if (body.qualityStatus !== undefined) updateData.qualityStatus = body.qualityStatus;
    if (body.conversionStatus !== undefined) updateData.conversionStatus = body.conversionStatus;

    // Store extra fields in scoreJson
    const extraFields = ['industry', 'companyType', 'employeeCount', 'revenue', 'email', 'phone', 'linkedin', 'notes'];
    const hasExtra = extraFields.some(f => body[f] !== undefined);
    if (hasExtra) {
      const existing = await prisma.searchResult.findUnique({ where: { id } });
      const existingScore = (existing?.scoreJson as any) || {};
      const extraUpdate: any = {};
      for (const f of extraFields) {
        if (body[f] !== undefined) extraUpdate[f] = body[f];
      }
      updateData.scoreJson = { ...existingScore, ...extraUpdate };
    }

    const updated = await prisma.searchResult.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('[API] Failed to update search result:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
