export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  createSessionToken,
  hashPassword,
  verifyPassword,
} from '@/lib/auth/session';
import { isAdminUser } from '@/lib/auth/guard';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: '請輸入帳號與密碼' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: '帳號或密碼錯誤' }, { status: 401 });
    }

    // The previous check was `if (user.passwordHash && user.passwordHash !== hashed)`,
    // so an account with no passwordHash accepted *any* password.
    const { ok, needsUpgrade } = verifyPassword(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: '帳號或密碼錯誤' }, { status: 401 });
    }

    if (user.status !== 'ACTIVE') {
      return NextResponse.json({ error: '帳號已停用，請聯繫管理員' }, { status: 403 });
    }

    // Migrate legacy unsalted SHA-256 hashes to scrypt on successful login.
    if (needsUpgrade) {
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { passwordHash: hashPassword(password) },
        });
      } catch (e) {
        console.warn('[auth] Could not upgrade password hash:', e);
      }
    }

    const admin = isAdminUser(user);
    const response = NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, isAdmin: admin },
    });

    response.cookies.set(SESSION_COOKIE, createSessionToken(user.id), {
      httpOnly: true,
      path: '/',
      maxAge: SESSION_MAX_AGE_SECONDS,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    // The old "user-role" cookie was readable and writable by the client, so a
    // user could hand themselves the admin badge by editing it. Admin status is
    // now only ever reported by the server; clear any stale copy.
    response.cookies.set('user-role', '', { path: '/', maxAge: 0 });

    return response;
  } catch (error: any) {
    console.error('[auth] Login failed:', error);
    return NextResponse.json({ error: '登入失敗，請稍後再試' }, { status: 500 });
  }
}
