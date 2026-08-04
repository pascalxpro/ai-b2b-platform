'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Plus, Bell, Palette, CheckCircle, AlertTriangle, Users, FileSearch, Clock } from 'lucide-react';
import { ThemePalettePicker } from '@/components/theme/ThemePalettePicker';
import styles from './TopBar.module.css';
import Link from 'next/link';

interface TopBarProps {
  currentWorkspace: string;
  user?: {
    name: string;
    email?: string;
    avatarUrl?: string;
    isAdmin?: boolean;
  };
}

const MOCK_NOTIFICATIONS = [
  { id: 1, type: 'success', icon: CheckCircle, title: '搜尋任務完成', desc: '「日本半導體製造商」已找到 47 筆結果', time: '5 分鐘前', unread: true },
  { id: 2, type: 'warning', icon: AlertTriangle, title: '任務即將到期', desc: '「跟進日本ABC公司報價」明天到期', time: '30 分鐘前', unread: true },
  { id: 3, type: 'info', icon: Users, title: '新客戶已新增', desc: 'TechCorp K.K. 已加入客戶資料庫', time: '1 小時前', unread: true },
  { id: 4, type: 'info', icon: FileSearch, title: '報表已產出', desc: '「Q2 銷售績效總覽」已完成', time: '2 小時前', unread: false },
  { id: 5, type: 'warning', icon: AlertTriangle, title: '系統提醒', desc: 'API 額度已使用 85%', time: '3 小時前', unread: false },
];

const MOCK_SEARCH_RESULTS = [
  { id: 'c1', title: 'TechCorp K.K.', category: '客戶', href: '/entities' },
  { id: 'c2', title: 'GlobalParts Ltd', category: '客戶', href: '/entities' },
  { id: 't1', title: '跟進日本ABC公司報價', category: '任務', href: '/tasks' },
  { id: 't2', title: '準備Q3東南亞市場報告', category: '任務', href: '/tasks' },
  { id: 'r1', title: '2024 Q2 銷售績效總覽', category: '報表', href: '/reports' },
];

export function TopBar({ currentWorkspace, user }: TopBarProps) {
  const [loggingOut, setLoggingOut] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showWorkspace, setShowWorkspace] = useState(false);
  const [activeWorkspace, setActiveWorkspace] = useState(currentWorkspace);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const paletteRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const quickAddRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (paletteRef.current && !paletteRef.current.contains(e.target as Node)) {
        setShowPalette(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
      if (quickAddRef.current && !quickAddRef.current.contains(e.target as Node)) {
        setShowQuickAdd(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      if (workspaceRef.current && !workspaceRef.current.contains(e.target as Node)) {
        setShowWorkspace(false);
      }
    };
    if (showPalette || showNotifications || showSearchResults || showQuickAdd || showUserMenu || showWorkspace) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPalette, showNotifications, showSearchResults, showQuickAdd, showUserMenu, showWorkspace]);

  const closeAll = () => { setShowPalette(false); setShowNotifications(false); setShowQuickAdd(false); setShowUserMenu(false); setShowWorkspace(false); };

  // Previously this was a plain <Link href="/login">, which never called the
  // logout endpoint — the session cookie stayed valid, so the account menu
  // and the actual auth state could disagree with each other. A full
  // navigation (not router.push) also clears any client-side state that
  // assumed a signed-in user.
  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      window.location.href = '/login';
    }
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  const filteredResults = MOCK_SEARCH_RESULTS.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedResults = filteredResults.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof MOCK_SEARCH_RESULTS>);

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <div className={styles.mobileLogo}>
           <div className={styles.logoIcon}></div>
        </div>
        <div className={styles.paletteWrapper} ref={workspaceRef}>
          <button className={styles.workspaceSelector} onClick={() => { closeAll(); setShowWorkspace(!showWorkspace); }}>
            <span className={styles.workspaceName}>{activeWorkspace}</span>
            <ChevronDown size={16} />
          </button>
          {showWorkspace && (
            <div className={styles.paletteDropdown} style={{ minWidth: 220, left: 0, right: 'auto' }}>
              {['B2B Tech Corp', 'GlobalTrade Asia', 'Innovation Lab'].map(ws => (
                <div
                  key={ws}
                  className={styles.quickMenuItem}
                  style={{ fontWeight: ws === activeWorkspace ? 700 : 400 }}
                  onClick={() => { setActiveWorkspace(ws); setShowWorkspace(false); }}
                >
                  {ws === activeWorkspace ? '✓ ' : '   '}{ws}
                </div>
              ))}
              <div className={styles.userMenuDivider} />
              <Link href="/workspaces" className={styles.quickMenuItem} onClick={() => setShowWorkspace(false)}>
                ⚙️ 管理 Workspace
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className={styles.center} ref={searchRef}>
        <div className={styles.searchBar}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="搜尋情報、公司、聯絡人..." 
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchResults(true);
            }}
            onFocus={() => setShowSearchResults(true)}
          />
        </div>
        
        {showSearchResults && searchQuery && (
          <div className={styles.searchResultsDropdown}>
            {filteredResults.length > 0 ? (
              Object.entries(groupedResults).map(([category, items]) => (
                <div key={category} className={styles.searchCategory}>
                  <div className={styles.searchCategoryTitle}>{category}</div>
                  {items.map(item => (
                    <Link key={item.id} href={item.href} className={styles.searchItem}>
                      {item.title}
                    </Link>
                  ))}
                </div>
              ))
            ) : (
              <div className={styles.noResults}>找不到符合「{searchQuery}」的結果</div>
            )}
          </div>
        )}
      </div>

      <div className={styles.right}>
        {/* Quick Add */}
        <div className={styles.paletteWrapper} ref={quickAddRef}>
          <button
            className={`${styles.quickAdd} ${showQuickAdd ? styles.iconBtnActive : ''}`}
            title="新增任務或情報"
            onClick={() => { closeAll(); setShowQuickAdd(!showQuickAdd); }}
          >
            <Plus size={20} />
          </button>
          {showQuickAdd && (
            <div className={styles.paletteDropdown} style={{ minWidth: 200 }}>
              <Link href="/" className={styles.quickMenuItem}>
                <Search size={16} /> 新建搜尋
              </Link>
              <Link href="/entities" className={styles.quickMenuItem}>
                <Users size={16} /> 新增客戶
              </Link>
              <Link href="/tasks" className={styles.quickMenuItem}>
                <CheckCircle size={16} /> 建立任務
              </Link>
              <Link href="/decisions" className={styles.quickMenuItem}>
                <AlertTriangle size={16} /> 新增決策
              </Link>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className={styles.paletteWrapper} ref={notifRef}>
          <button
            className={`${styles.iconBtn} ${showNotifications ? styles.iconBtnActive : ''}`}
            title="通知"
            onClick={() => { setShowNotifications(!showNotifications); setShowPalette(false); }}
          >
            <Bell size={20} />
            {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
          </button>
          {showNotifications && (
            <div className={styles.paletteDropdown} style={{ minWidth: 360 }}>
              <div className={styles.notifHeader}>
                <span className={styles.notifTitle}>通知</span>
                <button className={styles.notifMarkAll} onClick={() => setNotifications(prev => prev.map(n => ({...n, unread: false})))}>全部已讀</button>
              </div>
              <div className={styles.notifList}>
                {notifications.map(n => {
                  const Icon = n.icon;
                  return (
                    <div key={n.id} className={`${styles.notifItem} ${n.unread ? styles.notifUnread : ''}`}>
                      <div className={`${styles.notifIcon} ${styles[`notif${n.type}`]}`}>
                        <Icon size={16} />
                      </div>
                      <div className={styles.notifContent}>
                        <div className={styles.notifItemTitle}>{n.title}</div>
                        <div className={styles.notifDesc}>{n.desc}</div>
                        <div className={styles.notifTime}><Clock size={12} /> {n.time}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Theme Palette */}
        <div className={styles.paletteWrapper} ref={paletteRef}>
          <button
            className={`${styles.iconBtn} ${showPalette ? styles.iconBtnActive : ''}`}
            title="佈景主題與色彩"
            onClick={() => { setShowPalette(!showPalette); setShowNotifications(false); }}
          >
            <Palette size={20} />
          </button>
          {showPalette && (
            <div className={styles.paletteDropdown}>
              <ThemePalettePicker />
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className={styles.paletteWrapper} ref={userMenuRef}>
          <button
            className={styles.userAvatar}
            onClick={() => { closeAll(); setShowUserMenu(!showUserMenu); }}
          >
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} />
            ) : (
              <div className={styles.avatarFallback}>{user?.name?.[0] || 'U'}</div>
            )}
          </button>
          {showUserMenu && (
            <div className={styles.paletteDropdown} style={{ minWidth: 220 }}>
              {user ? (
                <>
                  <div className={styles.userMenuHeader}>
                    <div className={styles.avatarFallback} style={{ width: 36, height: 36, fontSize: 14 }}>{user.name?.[0] || 'U'}</div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {user.name}
                        {user.isAdmin && (
                          <span style={{ fontSize: '11px', fontWeight: 500, padding: '1px 6px', borderRadius: 8, background: 'var(--color-primary-subtle)', color: 'var(--color-primary)' }}>
                            管理員
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user.email}
                      </div>
                    </div>
                  </div>
                  <div className={styles.userMenuDivider} />
                  {user.isAdmin && (
                    <Link href="/admin" className={styles.quickMenuItem} onClick={() => setShowUserMenu(false)}>⚙️ 系統設定</Link>
                  )}
                  <div className={styles.userMenuDivider} />
                  <button
                    type="button"
                    className={styles.quickMenuItem}
                    style={{ color: 'var(--color-danger)', width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: loggingOut ? 'default' : 'pointer' }}
                    onClick={handleLogout}
                    disabled={loggingOut}
                  >
                    🚪 {loggingOut ? '登出中...' : '登出'}
                  </button>
                </>
              ) : (
                // Session check hasn't resolved yet, or the user somehow
                // reached this page unauthenticated (proxy.ts should already
                // have redirected them to /login before this renders).
                <Link href="/login" className={styles.quickMenuItem}>🔑 登入</Link>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

