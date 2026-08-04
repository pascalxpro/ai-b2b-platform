'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { MobileNav } from '@/components/layout/MobileNav';
import PageTransition from '@/components/ui/PageTransition';

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

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => (r.ok ? r.json() : null))
      .then(data => setCurrentUser(data?.authenticated ? data.user : null))
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
          © 2024 AI B2B 商業情報平台 • Powered by AI
        </footer>
      </div>

      <MobileNav />
    </div>
  );
}
