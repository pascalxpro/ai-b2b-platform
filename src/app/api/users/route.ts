export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin, isAdminUser } from '@/lib/auth/guard';
import { hashPassword } from '@/lib/auth/session';
import { ensureDefaultWorkspaceMembership } from '@/lib/db/workspace';

// Fields a caller is allowed to set. Notably absent: passwordHash and isAdmin —
// the old handler spread the whole request body straight into Prisma, so an
// unauthenticated PATCH with {id, passwordHash} could overwrite any account's
// password (including the admin's) and take it over.
const EDITABLE_FIELDS = ['name', 'email', 'status', 'locale', 'theme', 'paletteId', 'avatarUrl'] as const;

function pickEditable(body: Record<string, any>) {
  const data: Record<string, any> = {};
  for (const field of EDITABLE_FIELDS) {
    if (body[field] !== undefined) data[field] = body[field];
  }
  return data;
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const users = await prisma.user.findMany({
      // Explicit select so password hashes are never returned over the API.
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        isAdmin: true,
        createdAt: true,
        workspaceMembers: {
          include: { workspace: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Report the *effective* admin flag, i.e. the same rule the auth layer
    // applies. Otherwise the bootstrap admin (granted by its unique email
    // rather than the isAdmin column) shows up in the UI as a plain member
    // even though it has full admin access.
    return NextResponse.json(
      users.map(u => ({ ...u, isAdmin: isAdminUser(u) }))
    );
  } catch (error: any) {
    console.error('[API] Failed to list users:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    if (!body.email || !body.name) {
      return NextResponse.json({ error: 'name 與 email 為必填' }, { status: 400 });
    }
    // Enforced here too, not just in the UI: an account created without a
    // password gets a null hash, which now rejects every login attempt — the
    // account would exist but be permanently unusable.
    if (!body.password || String(body.password).length < 8) {
      return NextResponse.json({ error: '請設定至少 8 碼的初始密碼' }, { status: 400 });
    }

    const data = pickEditable(body);
    data.status = data.status || 'ACTIVE';
    data.passwordHash = hashPassword(String(body.password));
    // Only an existing admin can mint another admin, and only explicitly.
    if (body.isAdmin === true) data.isAdmin = true;

    const user = await prisma.user.create({
      data: data as any,
      select: { id: true, name: true, email: true, status: true, isAdmin: true, createdAt: true },
    });

    // Put the new account in the default workspace straight away. Without this
    // it sits at Workspace「無」 until the person happens to run their first
    // search, which is when the workspace helper would otherwise enrol them.
    try {
      await ensureDefaultWorkspaceMembership(user.id, auth.id, data.isAdmin ? 'ADMIN' : 'MEMBER');
    } catch (e) {
      // The account itself is created; don't fail the request over membership.
      console.error('[API] Could not add new user to default workspace:', e);
    }

    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    console.error('[API] Failed to create user:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { id } = body;
    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const data = pickEditable(body);
    if (body.password) {
      if (String(body.password).length < 8) {
        return NextResponse.json({ error: '密碼至少需要 8 碼' }, { status: 400 });
      }
      data.passwordHash = hashPassword(String(body.password));
    }
    if (typeof body.isAdmin === 'boolean') {
      // Don't let an admin lock themselves out of the admin area.
      if (body.isAdmin === false && id === auth.id) {
        return NextResponse.json({ error: '無法移除自己的管理員權限' }, { status: 400 });
      }
      data.isAdmin = body.isAdmin;
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, status: true, isAdmin: true },
    });

    // Backfill membership for accounts created before this was automatic —
    // re-saving such a user is enough to fix their Workspace「無」. Existing
    // memberships are left untouched, so this never changes anyone's role.
    try {
      await ensureDefaultWorkspaceMembership(user.id, auth.id);
    } catch (e) {
      console.error('[API] Could not ensure workspace membership:', e);
    }

    return NextResponse.json(user);
  } catch (error: any) {
    console.error('[API] Failed to update user:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Permanent deletion, distinct from the existing 停用 (disable) status toggle.
// Several tables reference User without onDelete:Cascade or SetNull —
// SearchTask/Meeting/KnowledgeItem.createdBy and Approval.requester/approver —
// so deleting a user who has created any of those fails at the database level
// with a foreign-key constraint. That's treated as an expected, reportable
// outcome (409 with a clear reason) rather than a generic 500: it means the
// account has real history and 停用 is the correct tool, not a bug.
export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const id = request.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }
  if (id === auth.id) {
    return NextResponse.json({ error: '無法刪除自己的帳號' }, { status: 400 });
  }

  try {
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) {
      return NextResponse.json({ error: '找不到使用者' }, { status: 404 });
    }

    if (isAdminUser(target)) {
      // Counting `where: { isAdmin: true }` would undercount: the bootstrap
      // admin (granted by matching BOOTSTRAP_ADMIN_EMAIL — see isAdminUser)
      // can be an admin with that column still false. Evaluate the same
      // effective rule the auth layer uses for every user instead.
      const allUsers = await prisma.user.findMany({ select: { id: true, email: true, isAdmin: true } });
      const effectiveAdminCount = allUsers.filter(isAdminUser).length;
      if (effectiveAdminCount <= 1) {
        return NextResponse.json({ error: '無法刪除唯一的管理員帳號' }, { status: 400 });
      }
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      return NextResponse.json(
        { error: '此使用者已建立過搜尋任務、會議記錄或其他資料，無法直接刪除，請改用「停用」' },
        { status: 409 }
      );
    }
    console.error('[API] Failed to delete user:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
