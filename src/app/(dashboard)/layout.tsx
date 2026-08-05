'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { MobileNav } from '@/components/layout/MobileNav';
import PageTransition from '@/components/ui/PageTransition';
import { DEFAULT_BRANDING, type BrandingSettings } from '@/lib/settings/branding';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  // The account menu previously always showed a hardcoded {name:'Admin'}
  // regardless of who was actually signed in, and its "登出" was a plain
  // <Link> that never called the logout endpoint — the session cookie was
  // never cleared. Both are fixed by giving TopBar the real session user.
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; isAdmin: boolean } | null>(null);
  // The footer had the brand name hardcoded (and a frozen "2024"), so it kept
  // showing stock text next to a customised sidebar.
  const [branding, setBranding] = useState<BrandingSettings>(DEFAULT_BRANDING);

  useEffect(() => {
    fetch('/api/branding')
      .then(r => (r.ok ? r.json() : null))
      .then(b => {
        if (!b) return;
        const merged = { ...DEFAULT_BRANDING, ...b };
        setBranding(merged);
        // The tab title can't come from generateMetadata — these pages are
        // statically prerendered, so that runs at build time when no database
        // is reachable. Set it here instead, once branding has actually loaded.
        document.title = `${merged.brandName} ${merged.subtitle}`.trim();
      })
      .catch(() => { /* cosmetic only */ });
  }, []);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (data?.authenticated) {
          setCurrentUser(data.user);
          return;
        }
        // proxy.ts only checks that a session cookie EXISTS, not that it is
        // valid — a deliberately cheap edge check. So a stale or wrongly
        // signed cookie still gets the shell rendered, while every API call
        // 401s: the avatar falls back to "U", branding reverts to defaults and
        // every counter shows 0, which reads as "the app is broken" rather
        // than "you are signed out". Send them to the login page instead.
        // (A common trigger is SESSION_SECRET being unset on the host, which
        // regenerates on each restart and invalidates all existing cookies.)
        window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
      })
      .catch(() => setCurrentUser(null));
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setIsMobile(true);
      } else {
        setIsMobile(false);
        if (width < 1200) {
          setSidebarCollapsed(true);
        } else {
          setSidebarCollapsed(false);
        }
      }
    };
    
    // Initial check
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="layout-root" style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: 'var(--color-bg-start)',
      color: 'var(--color-text)',
    }}>
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />
      
      <div 
        className="main-container"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          marginLeft: isMobile ? '0' : (sidebarCollapsed ? '72px' : '256px'),
          transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          width: '100%',
          height: '100vh',
          overflowY: 'auto',
        }}
      >
        <TopBar currentWorkspace="B2B Tech Corp" user={currentUser || undefined} />
        
        <main style={{
          flex: 1,
          padding: '24px',
          paddingBottom: isMobile ? 'calc(24px + 64px + env(safe-area-inset-bottom))' : '24px',
          overflowX: 'hidden'
        }}>
          <div style={{
            maxWidth: '1440px',
            margin: '0 auto',
            width: '100%',
            height: '100%'
          }}>
            <PageTransition>{children}</PageTransition>
          </div>
        </main>

        <footer style={{
          padding: '16px 24px',
          textAlign: 'center',
          fontSize: '12px',
          color: 'var(--color-text-muted)',
          borderTop: '1px solid var(--color-border-subtle)',
          opacity: 0.6
        }}>
          © {new Date().getFullYear()} {branding.brandName} {branding.subtitle} • Powered by AI
        </footer>
      </div>

      <MobileNav />
    </div>
  );
}
