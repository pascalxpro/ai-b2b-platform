import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/auth/guard';

export const dynamic = 'force-dynamic';

/**
 * Deletes all business data, keeping only users and workspaces.
 *
 * This was previously an unauthenticated GET, so a shared link, a browser
 * prefetch or a crawler could wipe the database. It is now admin-only, POST
 * (so plain navigation cannot trigger it), and requires an explicit
 * confirmation value in the body.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json().catch(() => ({}));
    if (body?.confirm !== 'DELETE_ALL_DATA') {
      return NextResponse.json(
        { error: '需要確認參數 confirm: "DELETE_ALL_DATA"' },
        { status: 400 }
      );
    }

    // Delete in dependency order to respect foreign key constraints.
    await prisma.message.deleteMany({});
    await prisma.conversation.deleteMany({});
    await prisma.approval.deleteMany({});
    await prisma.knowledgeItem.deleteMany({});
    await prisma.meeting.deleteMany({});
    await prisma.task.deleteMany({});

    await prisma.searchSource.deleteMany({});
    await prisma.searchResult.deleteMany({});
    await prisma.searchTask.deleteMany({});

    await prisma.evidence.deleteMany({});
    await prisma.leadScore.deleteMany({});
    await prisma.businessEntity.deleteMany({});

    console.warn(`[admin] All business data cleared by ${auth.email}`);
    return NextResponse.json({ message: 'All mock data cleared. Users and workspaces kept.' });
  } catch (error: any) {
    console.error('[admin] Error clearing data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
