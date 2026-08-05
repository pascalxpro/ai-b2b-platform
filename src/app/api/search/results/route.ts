export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/guard';
import { ownedPoolFilter, backfillResultOwners } from '@/lib/search/ownership';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    // Rows predating the ownerUserId column would otherwise be invisible to
    // everyone once the filter below applies.
    await backfillResultOwners();

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const searchTaskId = searchParams.get('searchTaskId') || searchParams.get('taskId');
    const pool = searchParams.get('pool'); // 'mine' (default) | 'opportunities'
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

    if (pool === 'opportunities') {
      // The shared pool: released and not yet claimed. The user's own releases
      // are excluded — the tab is "可認領" and claiming a row back off yourself
      // is meaningless. They remain in the user's own pool marked 待認領, which
      // is also where the withdraw action lives.
      where.poolState = 'RELEASED';
      where.NOT = { releasedByUserId: auth.id };
    } else {
      // The account's own pool. This filter is what makes results private —
      // previously every signed-in user received every row regardless of who
      // ran the search. Note it is ownedPoolFilter, not visibilityFilter:
      // the latter also admits everyone's released rows, which belong in the
      // shared pool tab and not in this one.
      where.AND = [...(where.AND || []), ownedPoolFilter(auth)];
    }

    const results = await prisma.searchResult.findMany({
      where,
      include: {
        searchTask: { select: { name: true } },
        sources: true,
        owner: { select: { id: true, name: true, email: true } },
        releasedBy: { select: { id: true, name: true, email: true } },
        claimedBy: { select: { id: true, name: true, email: true } },
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
