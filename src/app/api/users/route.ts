export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/auth/guard';
import { hashPassword } from '@/lib/auth/session';

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
    return NextResponse.json(users);
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

    const data = pickEditable(body);
    data.status = data.status || 'ACTIVE';
    if (body.password) data.passwordHash = hashPassword(body.password);
    // Only an existing admin can mint another admin, and only explicitly.
    if (body.isAdmin === true) data.isAdmin = true;

    const user = await prisma.user.create({
      data: data as any,
      select: { id: true, name: true, email: true, status: true, isAdmin: true, createdAt: true },
    });
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
    if (body.password) data.passwordHash = hashPassword(body.password);
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
    return NextResponse.json(user);
  } catch (error: any) {
    console.error('[API] Failed to update user:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
