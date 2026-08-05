export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import type { QualityStatus, ConversionStatus } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/guard';
import { mutabilityFilter } from '@/lib/search/ownership';

const QUALITY_STATUSES = ['NEW', 'VALID', 'PENDING_REVIEW', 'DUPLICATE', 'INVALID'] as const;
const CONVERSION_STATUSES = ['NONE', 'FAVORITED', 'ASSIGNED', 'CONVERTED_LEAD', 'CONVERTED_OPPORTUNITY'] as const;

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const body = await request.json();
    const { ids, updates } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids must be a non-empty array' }, { status: 400 });
    }
    if (!updates || typeof updates !== 'object') {
      return NextResponse.json({ error: 'updates object is required' }, { status: 400 });
    }

    // Only allow the two status columns through — everything else in updates is
    // ignored rather than blindly forwarded to Prisma.
    const data: { qualityStatus?: QualityStatus; conversionStatus?: ConversionStatus } = {};

    if (updates.qualityStatus !== undefined) {
      if (!QUALITY_STATUSES.includes(updates.qualityStatus)) {
        return NextResponse.json({ error: `Invalid qualityStatus: ${updates.qualityStatus}` }, { status: 400 });
      }
      data.qualityStatus = updates.qualityStatus as QualityStatus;
    }
    if (updates.conversionStatus !== undefined) {
      if (!CONVERSION_STATUSES.includes(updates.conversionStatus)) {
        return NextResponse.json({ error: `Invalid conversionStatus: ${updates.conversionStatus}` }, { status: 400 });
      }
      data.conversionStatus = updates.conversionStatus as ConversionStatus;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No supported fields to update' }, { status: 400 });
    }

    // Scope by ownership as well as id: without this, a caller could pass any
    // ids at all and mutate other accounts' rows in bulk. Rows they don't own
    // simply aren't matched, so the count reflects what actually changed.
    const result = await prisma.searchResult.updateMany({
      where: { AND: [{ id: { in: ids } }, mutabilityFilter(auth)] },
      data,
    });

    if (result.count < ids.length) {
      return NextResponse.json({
        updated: result.count,
        skipped: ids.length - result.count,
        message: `${result.count} 筆已更新，${ids.length - result.count} 筆略過（非您擁有的資料）`,
      });
    }

    return NextResponse.json({ updated: result.count });
  } catch (error: any) {
    console.error('[API] Batch update failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
