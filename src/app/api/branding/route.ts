export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { loadSettingsFromDb } from '@/lib/settings/settingsService';
import { requireAuth } from '@/lib/auth/guard';

/**
 * Branding only, for the sidebar — every signed-in user needs this, not just
 * admins. /api/admin/settings also carries every third-party API key in
 * plaintext and is admin-only, so the sidebar must not call it.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const settings = await loadSettingsFromDb();
    return NextResponse.json(settings.branding);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
