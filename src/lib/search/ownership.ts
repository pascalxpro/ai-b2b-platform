import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import type { SessionUser } from '@/lib/auth/guard';

/**
 * Per-account ownership of search results, and the shared opportunity pool.
 *
 * Before this existed, /api/search/results returned every row to any signed-in
 * user — the pool was effectively shared regardless of who ran the search.
 * These helpers are the single place that decides what an account may see and
 * touch, so the rule can't drift between the list, detail, batch and update
 * routes.
 */

/**
 * What a given user is allowed to SEE:
 *   - rows they own
 *   - rows currently in the shared pool awaiting a claim
 *   - rows they released (deliberately kept visible after release, so the
 *     finder can follow what happened to it — see PoolState in the schema)
 * Admins see everything, so they can actually administer.
 */
export function visibilityFilter(user: SessionUser): Prisma.SearchResultWhereInput {
  if (user.isAdmin) return {};
  return {
    OR: [
      { ownerUserId: user.id },
      { poolState: 'RELEASED' },
      { releasedByUserId: user.id },
    ],
  };
}

/**
 * What a given user is allowed to MODIFY — narrower than what they can see.
 * A released row is visible to everyone but must not be editable by everyone;
 * only its owner (or an admin) may change it.
 */
export function mutabilityFilter(user: SessionUser): Prisma.SearchResultWhereInput {
  if (user.isAdmin) return {};
  return { ownerUserId: user.id };
}

/** True if the user may modify this specific row. */
export async function canModifyResult(user: SessionUser, resultId: string): Promise<boolean> {
  if (user.isAdmin) return true;
  const found = await prisma.searchResult.findFirst({
    where: { id: resultId, ownerUserId: user.id },
    select: { id: true },
  });
  return Boolean(found);
}

/**
 * Assigns owners to rows created before ownerUserId existed, deriving them
 * from the task's creator.
 *
 * Runs once per process, and is a no-op afterwards because the WHERE clause
 * stops matching. Without it, adding the column would make every existing
 * result ownerless and the pool would render empty — which looks like data
 * loss rather than a migration step.
 */
let backfillDone = false;
export async function backfillResultOwners(): Promise<void> {
  if (backfillDone) return;
  try {
    const updated = await prisma.$executeRawUnsafe(`
      UPDATE "search_results" sr
      SET "owner_user_id" = st."created_by_id"
      FROM "search_tasks" st
      WHERE sr."search_task_id" = st."id"
        AND sr."owner_user_id" IS NULL
    `);
    if (updated > 0) {
      console.log(`[ownership] Backfilled owner for ${updated} legacy search results`);
    }
    backfillDone = true;
  } catch (e) {
    // Don't block the request: the column may not exist yet on a database
    // that hasn't had `prisma db push` applied.
    console.warn('[ownership] Owner backfill skipped:', e);
  }
}

/**
 * Detects whether the user already holds the same company, used to warn before
 * claiming a duplicate. Matches on website hostname rather than company name,
 * which varies between providers for the same site.
 */
export async function findExistingDuplicate(userId: string, website: string | null) {
  if (!website) return null;
  let hostname = '';
  try {
    hostname = new URL(website).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
  if (!hostname) return null;

  return prisma.searchResult.findFirst({
    where: {
      ownerUserId: userId,
      website: { contains: hostname, mode: 'insensitive' },
    },
    select: { id: true, companyName: true, website: true },
  });
}
