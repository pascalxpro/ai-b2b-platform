export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('session');
  response.cookies.delete('user-role');
  return response;
}
