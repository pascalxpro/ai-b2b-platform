export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/guard';

export async function GET(request: NextRequest) {
  // Signature and expiry are verified inside getSessionUser. The previous
  // version just base64-decoded whatever the cookie contained and trusted the
  // user id it found there.
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true, user });
}
