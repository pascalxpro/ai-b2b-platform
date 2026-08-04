import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { SESSION_COOKIE, verifySessionToken, BOOTSTRAP_ADMIN_EMAIL } from './session';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
}

export function isAdminUser(user: { email: string; isAdmin?: boolean | null }): boolean {
  return user.isAdmin === true || user.email === BOOTSTRAP_ADMIN_EMAIL;
}

/** Resolves the signed session cookie to a user, or null if not authenticated. */
export async function getSessionUser(request: NextRequest): Promise<SessionUser | null> {
  const userId = verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  if (!userId) return null;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.status !== 'ACTIVE') return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    isAdmin: isAdminUser(user),
  };
}

/**
 * Route-handler guards. On failure they return a NextResponse the caller should
 * return immediately:
 *
 *   const auth = await requireAdmin(request);
 *   if (auth instanceof NextResponse) return auth;
 *   // auth is the SessionUser from here on
 */
export async function requireAuth(request: NextRequest): Promise<SessionUser | NextResponse> {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: '請先登入' }, { status: 401 });
  }
  return user;
}

export async function requireAdmin(request: NextRequest): Promise<SessionUser | NextResponse> {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: '請先登入' }, { status: 401 });
  }
  if (!user.isAdmin) {
    return NextResponse.json({ error: '需要管理員權限' }, { status: 403 });
  }
  return user;
}
