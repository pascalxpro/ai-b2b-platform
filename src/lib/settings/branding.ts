/**
 * Branding types/defaults, split out from settingsService.ts specifically so
 * they can be imported from client components (Sidebar, the admin settings
 * form). settingsService.ts imports `prisma` at module scope, which pulls in
 * server-only Node modules (`pg` etc.) — importing anything from it inside a
 * 'use client' file would try to bundle that into the browser.
 */

// Logo is stored as a data: URL directly in the settings row (Postgres, not
// the container filesystem) rather than saved to local disk: the container is
// ephemeral on Zeabur and a redeploy would silently wipe an uploaded file.
// Size is capped client- and server-side to keep the settings row small.
export interface BrandingSettings {
  logoDataUrl: string;    // '' = fall back to the built-in gradient icon
  logoHeight: number;     // px; width is auto so the source image's own
                           // aspect ratio is preserved rather than being
                           // forced into a fixed square
  brandName: string;
  brandNameSize: number;  // px
  brandNameColor: string; // '' = follow the current theme's text colour
  subtitle: string;
  subtitleSize: number;   // px
  subtitleColor: string;  // '' = follow the current theme's muted-text colour
}

export const MAX_LOGO_DATA_URL_LENGTH = 500_000; // ~375KB of raw image data

export const DEFAULT_BRANDING: BrandingSettings = {
  logoDataUrl: '',
  logoHeight: 36,
  brandName: 'AI B2B',
  brandNameSize: 17,
  brandNameColor: '',
  subtitle: '商業情報平台',
  subtitleSize: 12,
  subtitleColor: '',
};
