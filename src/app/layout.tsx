import type { Metadata } from 'next';
import { Inter, Noto_Sans_TC } from 'next/font/google';
import { ThemeProvider } from '@/lib/theme/ThemeContext';
import { DEFAULT_BRANDING } from '@/lib/settings/branding';
import './globals.css';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const notoSansTC = Noto_Sans_TC({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-noto-sans-tc',
  display: 'swap',
});

/**
 * Static fallback only. The real, configured title is applied client-side by
 * the dashboard layout once branding loads.
 *
 * Reading the database in generateMetadata was tried and removed: these pages
 * are statically prerendered, so metadata is computed at BUILD time — and the
 * build runs without a reachable database (scripts/build.js supplies a
 * placeholder URL). The custom title would therefore never have been picked
 * up, only re-baked on redeploy, while every build emitted a wall of failed
 * Prisma calls. Forcing the whole app dynamic just to title a tab wasn't a
 * worthwhile trade.
 */
export const metadata: Metadata = {
  title: `${DEFAULT_BRANDING.brandName} ${DEFAULT_BRANDING.subtitle}`,
  description: 'AI-powered B2B Intelligence and Lead Generation Platform',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" data-theme="light" suppressHydrationWarning>
      <body className={`${inter.variable} ${notoSansTC.variable} font-sans antialiased`}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
