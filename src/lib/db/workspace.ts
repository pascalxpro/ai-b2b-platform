import type { WorkspaceRole } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';

/**
 * Returns a workspace to attach new records to, creating one on first use.
 *
 * Search tasks, saved searches and results are all scoped to a workspace, but
 * nothing in the product ever created the first one — the routes just did
 * `workspace.findFirst()` and threw "No default workspace or user found" when
 * the table was empty. On a fresh database that made every search fail with a
 * 500 before a single provider was contacted.
 */
export async function getOrCreateDefaultWorkspace(userId: string) {
  const existing = await prisma.workspace.findFirst({
    orderBy: { createdAt: 'asc' },
  });

  if (existing) {
    // Joining a workspace someone else set up: plain member.
    await addUserToWorkspace(existing.id, userId, 'MEMBER');
    return existing;
  }

  const created = await prisma.workspace.create({
    data: {
      name: '預設工作區',
      type: 'DEPARTMENT',
      description: '系統自動建立的第一個工作區',
    },
  });

  // Whoever brings the workspace into existence owns it. The previous version
  // granted ADMIN to *every* caller, so any user who ran a search silently
  // became a workspace administrator.
  await addUserToWorkspace(created.id, userId, 'ADMIN');
  return created;
}

/**
 * Idempotent membership. The unique constraint on (workspaceId, userId) makes
 * repeat calls a no-op instead of piling up duplicates, and an existing
 * member's role is left alone so re-running this never escalates privileges.
 */
export async function addUserToWorkspace(
  workspaceId: string,
  userId: string,
  role: WorkspaceRole = 'MEMBER'
) {
  return prisma.workspaceMember.upsert({
    where: { workspaceId_userId: { workspaceId, userId } },
    update: {},
    create: { workspaceId, userId, role },
  });
}

/**
 * Ensures a user belongs to the default workspace, without disturbing the
 * acting admin's own membership. Used when accounts are created or edited so
 * new members don't sit at Workspace「無」 until their first search.
 */
export async function ensureDefaultWorkspaceMembership(
  targetUserId: string,
  actingUserId: string,
  role: WorkspaceRole = 'MEMBER'
) {
  // Creates the workspace under the acting admin if it doesn't exist yet, so
  // ownership doesn't land on the account being created.
  const workspace = await getOrCreateDefaultWorkspace(actingUserId);
  await addUserToWorkspace(workspace.id, targetUserId, role);
  return workspace;
}
