import { prisma } from '@/lib/db/prisma';

/**
 * Returns a workspace to attach new records to, creating one on first use.
 *
 * Search tasks, saved searches and results are all scoped to a workspace, but
 * nothing in the product ever creates the first one — the routes just did
 * `workspace.findFirst()` and threw "No default workspace or user found" when
 * the table was empty. On a fresh database that made every search fail with a
 * 500 before a single provider was contacted.
 *
 * Also enrols the acting user as a member, so the workspace shows up against
 * their account instead of leaving the admin list reading "無".
 */
export async function getOrCreateDefaultWorkspace(userId: string) {
  const existing = await prisma.workspace.findFirst({
    orderBy: { createdAt: 'asc' },
  });

  const workspace =
    existing ??
    (await prisma.workspace.create({
      data: {
        name: '預設工作區',
        type: 'DEPARTMENT',
        description: '系統自動建立的第一個工作區',
      },
    }));

  // Idempotent: the unique constraint on (workspaceId, userId) makes repeat
  // calls a no-op rather than piling up duplicate memberships.
  await prisma.workspaceMember.upsert({
    where: { workspaceId_userId: { workspaceId: workspace.id, userId } },
    update: {},
    create: { workspaceId: workspace.id, userId, role: 'ADMIN' },
  });

  return workspace;
}
