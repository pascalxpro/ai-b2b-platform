export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/guard';
import { mutabilityFilter, findExistingDuplicate } from '@/lib/search/ownership';

/**
 * Release results into the shared opportunity pool, and claim them out of it.
 *
 * POST body: { action: 'release' | 'claim' | 'withdraw', ids: string[] }
 */

type Action = 'release' | 'claim' | 'withdraw';

/**
 * Records who did what to which result. The AuditLog table already existed but
 * had never been written to; the columns on SearchResult only hold the latest
 * release/claim, so this is what preserves the full history when a record goes
 * round more than once.
 */
async function logPoolAction(
  actorId: string,
  action: Action,
  resultIds: string[],
  metadata: Record<string, unknown> = {}
) {
  try {
    await prisma.auditLog.createMany({
      data: resultIds.map(id => ({
        actorId,
        action: `search_result.${action}`,
        targetType: 'SearchResult',
        targetId: id,
        metadata: metadata as any,
      })),
    });
  } catch (e) {
    // History is valuable but must not fail the operation itself.
    console.error('[pool] Could not write audit log:', e);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { action, ids } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: '請選擇至少一筆資料' }, { status: 400 });
    }
    if (!['release', 'claim', 'withdraw'].includes(action)) {
      return NextResponse.json({ error: `不支援的操作：${action}` }, { status: 400 });
    }

    // ─── Release: put my own PRIVATE rows into the shared pool ───
    if (action === 'release') {
      const result = await prisma.searchResult.updateMany({
        // Ownership + current state are both in the WHERE clause, so someone
        // else's rows and already-released rows are skipped rather than
        // silently re-stamped.
        where: { AND: [{ id: { in: ids }, poolState: 'PRIVATE' }, mutabilityFilter(auth)] },
        data: {
          poolState: 'RELEASED',
          releasedByUserId: auth.id,
          releasedAt: new Date(),
          // Clear any previous claim so a re-released record doesn't keep a
          // stale claimer on it.
          claimedByUserId: null,
          claimedAt: null,
        },
      });
      await logPoolAction(auth.id, 'release', ids, { released: result.count });
      return NextResponse.json({
        released: result.count,
        skipped: ids.length - result.count,
      });
    }

    // ─── Withdraw: pull my unclaimed rows back out of the shared pool ───
    if (action === 'withdraw') {
      const result = await prisma.searchResult.updateMany({
        where: {
          AND: [
            { id: { in: ids }, poolState: 'RELEASED', releasedByUserId: auth.id },
            mutabilityFilter(auth),
          ],
        },
        data: { poolState: 'PRIVATE', releasedAt: null, releasedByUserId: null },
      });
      await logPoolAction(auth.id, 'withdraw', ids, { withdrawn: result.count });
      return NextResponse.json({
        withdrawn: result.count,
        skipped: ids.length - result.count,
      });
    }

    // ─── Claim: take rows out of the shared pool ───
    const claimed: string[] = [];
    const duplicates: { id: string; companyName: string; existing: string }[] = [];
    let lost = 0;

    for (const id of ids) {
      const candidate = await prisma.searchResult.findFirst({
        // Claiming your own release is a no-op with confusing side effects
        // (it would stamp you as both releaser and claimer). The listing
        // already hides these; this is the server-side guard, since ids come
        // from the client.
        where: { id, poolState: 'RELEASED', NOT: { releasedByUserId: auth.id } },
        select: { id: true, companyName: true, website: true },
      });
      if (!candidate) { lost++; continue; }

      // Warn rather than block: the claimer may legitimately want both rows,
      // but claiming a company they already hold is usually a mistake.
      const dupe = await findExistingDuplicate(auth.id, candidate.website);
      if (dupe) {
        duplicates.push({
          id: candidate.id,
          companyName: candidate.companyName,
          existing: dupe.companyName,
        });
        continue;
      }

      // Conditional update, not read-then-write: poolState is re-checked
      // inside the WHERE, so if two people claim the same row at the same
      // moment exactly one update matches and the other gets count 0.
      const taken = await prisma.searchResult.updateMany({
        where: { id, poolState: 'RELEASED', NOT: { releasedByUserId: auth.id } },
        data: {
          poolState: 'CLAIMED',
          ownerUserId: auth.id,
          claimedByUserId: auth.id,
          claimedAt: new Date(),
          conversionStatus: 'ASSIGNED',
        },
      });

      if (taken.count === 1) claimed.push(id); else lost++;
    }

    if (claimed.length > 0) {
      await logPoolAction(auth.id, 'claim', claimed, { claimedBy: auth.email });
    }

    return NextResponse.json({
      claimed: claimed.length,
      // Already taken by someone else between listing and clicking.
      lost,
      duplicates,
    });
  } catch (error: any) {
    console.error('[pool] Action failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
