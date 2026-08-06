export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import type { QualityStatus, ConversionStatus, Prisma } from '@prisma/client';
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

/**
 * Permanently removes results. Body: { ids: string[] } — the single-row delete
 * button sends one id, so there is only one code path to keep correct.
 *
 * A hard delete, not a soft one: 標記無效 already covers "keep it but mark it
 * bad", so the only thing left for this to mean is "get it out of my pool".
 * SearchSource cascades from the schema, so the evidence rows go with it.
 */
export async function DELETE(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { ids } = await request.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: '請選擇至少一筆資料' }, { status: 400 });
    }

    // Read first so the audit log can name what was destroyed. Scoped by
    // ownership here too, so the log never records rows that weren't deleted.
    const doomed = await prisma.searchResult.findMany({
      where: { AND: [{ id: { in: ids } }, mutabilityFilter(auth)] },
      select: { id: true, companyName: true, website: true, poolState: true },
    });

    if (doomed.length === 0) {
      return NextResponse.json(
        { error: '沒有可刪除的資料（僅擁有者可刪除）' },
        { status: 403 }
      );
    }

    const result = await prisma.searchResult.deleteMany({
      where: { id: { in: doomed.map(d => d.id) } },
    });

    // Deletion is the one action here with no undo, so the trail matters more
    // than for the reversible ones. Never allowed to fail the operation.
    try {
      await prisma.auditLog.createMany({
        data: doomed.map(d => ({
          actorId: auth.id,
          action: 'search_result.delete',
          targetType: 'SearchResult',
          targetId: d.id,
          metadata: {
            companyName: d.companyName,
            website: d.website,
            poolState: d.poolState,
          } satisfies Prisma.InputJsonObject,
        })),
      });
    } catch (e) {
      console.error('[API] Could not write delete audit log:', e);
    }

    return NextResponse.json({
      deleted: result.count,
      // Rows the caller asked for but does not own — a colleague claimed them,
      // or the ids are stale.
      skipped: ids.length - result.count,
    });
  } catch (error: any) {
    console.error('[API] Batch delete failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
