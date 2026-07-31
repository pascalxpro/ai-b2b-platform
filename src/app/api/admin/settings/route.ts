import { NextRequest, NextResponse } from 'next/server';
import { loadSettingsFromDb, updateSystemSettings } from '@/lib/settings/settingsService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await loadSettingsFromDb();
    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const updated = await updateSystemSettings(body);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
