export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { loadSettingsFromDb } from '@/lib/settings/settingsService';
import { requireAuth } from '@/lib/auth/guard';

/**
 * Non-sensitive AI configuration for any signed-in user.
 *
 * /api/admin/settings is admin-only because it returns every API key in
 * plaintext, but ordinary users still need to know which call mode and model
 * are in effect so the browser-side path can run. This endpoint deliberately
 * exposes only those two facts — never a key.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const settings = await loadSettingsFromDb();
    return NextResponse.json({
      aiProvider: settings.aiProvider,
      aiModel: settings.aiModel,
      aiCallMode: settings.aiCallMode || 'server',
      // Lets the UI explain why nothing works without leaking the key itself.
      serverKeyConfigured: Boolean(settings.aiApiKey),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
