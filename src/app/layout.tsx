import type { Metadata } from 'next';
import { Inter, Noto_Sans_TC } from 'next/font/google';
import { ThemeProvider } from '@/lib/theme/ThemeContext';
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

export const metadata: Metadata = {
  title: 'AI B2B 商業情報平台',
  description: 'AI-powered B2B Intelligence and Lead Generation Platform',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" data-theme="dark" suppressHydrationWarning>
      <body className={`${inter.variable} ${notoSansTC.variable} font-sans antialiased`}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
