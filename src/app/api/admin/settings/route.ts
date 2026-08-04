import { NextRequest, NextResponse } from 'next/server';
import { loadSettingsFromDb, updateSystemSettings } from '@/lib/settings/settingsService';
import { requireAdmin } from '@/lib/auth/guard';

export const dynamic = 'force-dynamic';

// This endpoint returns and accepts every third-party API key in plaintext.
// It previously had no auth at all, so anyone who knew the URL could read the
// search-engine and AI keys, or repoint the AI base URL at their own server.
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const settings = await loadSettingsFromDb();
    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const updated = await updateSystemSettings(body);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
