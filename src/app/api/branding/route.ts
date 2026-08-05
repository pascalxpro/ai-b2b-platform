export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { loadSettingsFromDb, DEFAULT_BRANDING } from '@/lib/settings/settingsService';

/**
 * Sidebar/login branding. Deliberately **public** — no auth.
 *
 * It carries only the company logo, name, subtitle and their sizes/colours,
 * all of which are on display to anyone who reaches the login page anyway.
 * Requiring auth here meant the branding silently fell back to the built-in
 * "AI B2B" default whenever the session wasn't valid yet, so a customised
 * install still showed stock branding on the login screen and during the
 * moment before the session resolved.
 *
 * Note this must NOT start returning anything from the wider settings object:
 * /api/admin/settings stays admin-only because it exposes every API key.
 */
export async function GET() {
  try {
    const settings = await loadSettingsFromDb();
    return NextResponse.json(settings.branding || DEFAULT_BRANDING);
  } catch (error: any) {
    // Branding is cosmetic — never fail the page over it.
    console.error('[branding] Falling back to defaults:', error);
    return NextResponse.json(DEFAULT_BRANDING);
  }
}
