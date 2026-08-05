'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Search, FileSearch, LayoutDashboard, Building2, Users,
  CheckSquare, Mic, BookOpen, Bot, Target, BarChart3,
  Settings, HelpCircle, ChevronRight, ChevronLeft
} from 'lucide-react';
import { DEFAULT_BRANDING, type BrandingSettings } from '@/lib/settings/branding';
import styles from './Sidebar.module.css';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  activeItem?: string;
}

const NAV_ITEMS = [
  { id: 'search', icon: Search, label: '搜尋中心', href: '/' },
  { id: 'results', icon: FileSearch, label: '搜尋任務與結果池', href: '/search/results' },
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { id: 'workspace', icon: Building2, label: 'Workspace', href: '/workspaces' },
  { id: 'customers', icon: Users, label: '客戶與商機', href: '/entities' },
  { id: 'tasks', icon: CheckSquare, label: '任務中心', href: '/tasks' },
  { id: 'meetings', icon: Mic, label: '會議智慧', href: '/meetings' },
  { id: 'knowledge', icon: BookOpen, label: '知識中心', href: '/knowledge' },
  { id: 'ai', icon: Bot, label: 'AI Business Partner', href: '/ai-partner' },
  { id: 'decisions', icon: Target, label: '決策中心', href: '/decisions' },
  { id: 'reports', icon: BarChart3, label: '報表分析', href: '/reports' },
  { id: 'help', icon: HelpCircle, label: '使用說明', href: '/help' },
  { id: 'settings', icon: Settings, label: '系統管理', href: '/admin' },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const [branding, setBranding] = useState<BrandingSettings>(DEFAULT_BRANDING);

  useEffect(() => {
    fetch('/api/branding')
      .then(r => (r.ok ? r.json() : null))
      .then(data => { if (data) setBranding({ ...DEFAULT_BRANDING, ...data }); })
      .catch(() => { /* keep the built-in default on failure */ });
  }, []);

  const getActiveId = () => {
    if (pathname === '/') return 'search';
    const match = NAV_ITEMS.find(item => item.href !== '/' && pathname.startsWith(item.href));
    return match?.id || 'search';
  };
  
  const activeId = getActiveId();

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
      <div className={styles.header}>
        <div className={styles.logo}>
          {branding.logoDataUrl ? (
            // Only `height` is set — `width: auto` (in CSS) lets the browser
            // preserve whatever aspect ratio the uploaded image actually has,
            // instead of forcing it into the old fixed 36x36 square.
            // Plain <img>, not next/image: next/image cannot optimize a data:
            // URL (it would need `unoptimized`, gaining nothing for a ~36px
            // inline logo) and wants fixed dimensions, which is precisely what
            // we're avoiding here.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={branding.logoDataUrl}
              alt={branding.brandName}
              className={styles.logoImg}
              style={{ height: branding.logoHeight }}
            />
          ) : (
            <div className={styles.logoIcon} style={{ width: branding.logoHeight, height: branding.logoHeight }} />
          )}
          {!collapsed && (
            <div className={styles.brand}>
              <div
                className={styles.brandName}
                style={{
                  fontSize: branding.brandNameSize,
                  ...(branding.brandNameColor ? { color: branding.brandNameColor } : {}),
                }}
              >
                {branding.brandName}
              </div>
              <div
                className={styles.subtitle}
                style={{
                  fontSize: branding.subtitleSize,
                  ...(branding.subtitleColor ? { color: branding.subtitleColor } : {}),
                }}
              >
                {branding.subtitle}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <nav className={styles.nav}>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeId === item.id;
          return (
            <Link 
              key={item.id} 
              href={item.href}
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={styles.icon} size={20} />
              {!collapsed && <span className={styles.label}>{item.label}</span>}
              {isActive && <div className={styles.activeStrip} />}
            </Link>
          );
        })}
      </nav>

      <div className={styles.footer}>
        <button className={styles.toggleBtn} onClick={onToggle} title={collapsed ? '展開' : '收合'}>
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>
    </aside>
  );
}
