'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Search, FileSearch, LayoutDashboard, Building2, Users,
  CheckSquare, Mic, BookOpen, Bot, Target, BarChart3,
  Settings, ChevronRight, ChevronLeft
} from 'lucide-react';
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
  { id: 'settings', icon: Settings, label: '系統管理', href: '/admin' },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  
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
          <div className={styles.logoIcon}></div>
          {!collapsed && (
            <div className={styles.brand}>
              <div className={styles.brandName}>AI B2B</div>
              <div className={styles.subtitle}>商業情報平台</div>
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
