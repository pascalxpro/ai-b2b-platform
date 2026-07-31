export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import crypto from 'crypto';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

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

    const hashed = hashPassword(password);
    if (user.passwordHash && user.passwordHash !== hashed) {
      return NextResponse.json({ error: '帳號或密碼錯誤' }, { status: 401 });
    }

    // Set session cookie
    const response = NextResponse.json({ 
      success: true, 
      user: { id: user.id, name: user.name, email: user.email, isAdmin: user.email === 'admin@b2b.com' || user.name === 'Admin' }
    });
    
    // Simple session token = base64(userId:timestamp)
    const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');
    response.cookies.set('session', token, {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: 'lax',
    });
    response.cookies.set('user-role', user.email === 'admin@b2b.com' || user.name === 'Admin' ? 'admin' : 'user', {
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
