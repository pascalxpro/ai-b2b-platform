'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, LayoutDashboard, CheckSquare, Bot, Menu } from 'lucide-react';
import styles from './MobileNav.module.css';

const MOBILE_NAV_ITEMS = [
  { icon: Search, label: '搜尋', href: '/' },
  { icon: LayoutDashboard, label: '儀表板', href: '/dashboard' },
  { icon: CheckSquare, label: '任務', href: '/tasks' },
  { icon: Bot, label: 'AI', href: '/ai-partner' },
  { icon: Menu, label: '更多', href: '/admin' },
];

export function MobileNav() {
  const pathname = usePathname();
  
  return (
    <nav className={styles.nav}>
      {MOBILE_NAV_ITEMS.map(item => {
        const Icon = item.icon;
        const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} className={`${styles.item} ${isActive ? styles.active : ''}`}>
            <Icon size={20} />
            <span className={styles.label}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
