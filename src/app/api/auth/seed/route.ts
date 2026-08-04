export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { hashPassword, BOOTSTRAP_ADMIN_EMAIL } from '@/lib/auth/session';

/**
 * One-time bootstrap of the first admin account.
 *
 * This used to be a GET that reset the admin password to a hardcoded value with
 * no authentication at all — anyone who opened the URL could take over the
 * admin account. It is now POST, refuses to run once an admin exists, and
 * requires the caller to supply the initial password instead of baking a
 * well-known default into the source.
 */
export async function POST(request: NextRequest) {
  try {
    const existingAdmin = await prisma.user.findFirst({
      where: { OR: [{ isAdmin: true }, { email: BOOTSTRAP_ADMIN_EMAIL }] },
    });

    if (existingAdmin) {
      // Never touch an existing account here; password changes go through the
      // authenticated admin API instead.
      return NextResponse.json(
        { error: '管理員帳號已存在，此端點僅供初次建立使用' },
        { status: 409 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const email = body?.email || BOOTSTRAP_ADMIN_EMAIL;
    const password = body?.password;

    if (!password || String(password).length < 8) {
      return NextResponse.json(
        { error: '請提供至少 8 碼的初始密碼：{ "password": "..." }' },
        { status: 400 }
      );
    }

    const user = await prisma.user.create({
      data: {
        name: body?.name || 'Admin',
        email,
        passwordHash: hashPassword(String(password)),
        isAdmin: true,
        status: 'ACTIVE',
      },
      select: { id: true, email: true },
    });

    console.warn(`[auth] Bootstrap admin created: ${user.email}`);
    return NextResponse.json({ message: 'Admin user created', email: user.email });
  } catch (error: any) {
    console.error('[auth] Bootstrap failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
