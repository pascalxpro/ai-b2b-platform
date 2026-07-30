'use client';

import React, { useState, useEffect } from 'react';
import styles from './page.module.css';
import { 
  Settings, 
  Plus, 
  Search, 
  Edit2, 
  Ban, 
  Shield, 
  Globe, 
  Database, 
  ToggleLeft,
  ToggleRight,
  CheckCircle2, 
  XCircle,
  Briefcase
} from 'lucide-react';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/users')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setUsers(data.map((u: any) => ({
            id: u.id,
            name: u.name || '未知',
            email: u.email || '',
            role: u.workspaceMembers?.[0]?.role || '成員',
            roleClass: styles.badgeDefault,
            ws: u.workspaceMembers?.[0]?.workspace?.name || '無',
            status: u.status === 'ACTIVE' ? '啟用' : '停用',
            statusClass: u.status === 'ACTIVE' ? styles.badgeSuccess : styles.badgeWarning,
            login: u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '未知'
          })));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <Settings size={28} className={styles.headerIcon} />
        <h1 className={styles.title}>系統管理</h1>
      </div>

      {/* Tabs */}
      <div className={`${styles.tabs} glass-1`}>
        <button 
          className={`${styles.tab} ${activeTab === 'users' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('users')}
        >
          使用者管理
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'providers' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('providers')}
        >
          Provider 管理
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'settings' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          系統設定
        </button>
      </div>

      {/* Content Area */}
      <div className={styles.content}>
        
        {/* Tab 1: Users */}
        {activeTab === 'users' && (
          <>
            <div className={styles.toolbar}>
              <div className={styles.searchBox}>
                <Search size={18} className={styles.searchIcon} />
                <input type="text" placeholder="搜尋使用者..." className={styles.searchInput} />
              </div>
              <button className={styles.primaryBtn} onClick={() => alert('新增使用者功能開發中')}>
                <Plus size={18} />
                新增使用者
              </button>
            </div>

            <div className={`${styles.tableContainer} glass-2`}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>姓名</th>
                    <th>Email</th>
                    <th>角色</th>
                    <th>Workspace</th>
                    <th>狀態</th>
                    <th>最後登入</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7}>載入中...</td></tr>
                  ) : users.map((user, i) => (
                    <tr key={i}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td><span className={`${styles.badge} ${user.roleClass}`}>{user.role}</span></td>
                      <td>{user.ws}</td>
                      <td><span className={`${styles.badge} ${user.statusClass}`}>{user.status}</span></td>
                      <td>{user.login}</td>
                      <td>
                        <div className={styles.actionBtns}>
                          <button className={styles.iconBtn} title="編輯" onClick={() => alert('編輯使用者功能開發中')}><Edit2 size={16} /></button>
                          <button className={`${styles.iconBtn} ${styles.danger}`} title={user.status === '啟用' ? '停用' : '啟用'} onClick={() => alert('停用功能開發中')}>
                            <Ban size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Tab 2: Providers */}
        {activeTab === 'providers' && (
          <div className={styles.providerGrid}>
            <p style={{ padding: '20px' }}>無提供者資料</p>
          </div>
        )}

        {/* Tab 3: Settings */}
        {activeTab === 'settings' && (
          <div className={styles.settingsGrid}>
            <div className={`${styles.settingsCard} glass-2`}>
              <h3 className={styles.settingsTitle}>一般設定</h3>
              <div className={styles.formGroup}>
                <div className={styles.formRow}>
                  <div>
                    <div className={styles.label}>平台名稱</div>
                    <div className={styles.desc}>顯示於左上角與登入頁面</div>
                  </div>
                  <input type="text" className={styles.inputField} defaultValue="AI B2B Intelligence Platform" />
                </div>
                <div className={styles.formRow}>
                  <div>
                    <div className={styles.label}>預設語言</div>
                    <div className={styles.desc}>新使用者的預設介面語言</div>
                  </div>
                  <select className={styles.inputField}>
                    <option>繁體中文</option>
                    <option>English</option>
                    <option>日本語</option>
                  </select>
                </div>
              </div>
            </div>

            <div className={`${styles.settingsCard} glass-2`}>
              <h3 className={styles.settingsTitle}>搜尋與分析設定</h3>
              <div className={styles.formGroup}>
                <div className={styles.formRow}>
                  <div>
                    <div className={styles.label}>每次搜尋上限</div>
                    <div className={styles.desc}>單次深度搜尋可抓取的頁面數</div>
                  </div>
                  <input type="number" className={styles.inputField} defaultValue="50" />
                </div>
                <div className={styles.formRow}>
                  <div>
                    <div className={styles.label}>預設目標數量</div>
                    <div className={styles.desc}>建立潛在客戶清單時的預設尋找數量</div>
                  </div>
                  <input type="number" className={styles.inputField} defaultValue="100" />
                </div>
              </div>
            </div>

            <div className={`${styles.settingsCard} glass-2`}>
              <h3 className={styles.settingsTitle}>通知設定</h3>
              <div className={styles.formGroup}>
                <div className={styles.formRow}>
                  <div>
                    <div className={styles.label}>Email 系統通知</div>
                    <div className={styles.desc}>接收系統狀態與錯誤報告</div>
                  </div>
                  <ToggleRight size={28} className={`${styles.toggle} ${styles.toggleActive}`} />
                </div>
                <div className={styles.formRow}>
                  <div>
                    <div className={styles.label}>Telegram 機器人通知</div>
                    <div className={styles.desc}>發送任務完成通知至群組</div>
                  </div>
                  <ToggleLeft size={28} className={styles.toggle} />
                </div>
              </div>
            </div>

            <button className={`${styles.primaryBtn} ${styles.saveBtn}`} onClick={() => alert('設定已儲存（Demo）')}>
              儲存設定
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
