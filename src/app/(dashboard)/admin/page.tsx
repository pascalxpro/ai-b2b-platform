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

  // Settings State
  const [tavilyApiKeys, setTavilyApiKeys] = useState('');
  const [providerPriorityMode, setProviderPriorityMode] = useState<'tavily_first' | 'googlethis_first'>('tavily_first');
  const [maxSearchLimit, setMaxSearchLimit] = useState(50);
  const [defaultTargetCount, setDefaultTargetCount] = useState(100);
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('');

  useEffect(() => {
    // Fetch users
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

    // Fetch System Settings
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(data => {
        if (data) {
          if (data.tavilyApiKeys !== undefined) setTavilyApiKeys(data.tavilyApiKeys);
          if (Array.isArray(data.providerPriority)) {
            if (data.providerPriority[0] === 'googlethis') {
              setProviderPriorityMode('googlethis_first');
            } else {
              setProviderPriorityMode('tavily_first');
            }
          }
          if (data.maxSearchLimit) setMaxSearchLimit(data.maxSearchLimit);
          if (data.defaultTargetCount) setDefaultTargetCount(data.defaultTargetCount);
        }
      })
      .catch(console.error);
  }, []);

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    setSaveSuccessMessage('');
    try {
      const providerPriority = providerPriorityMode === 'tavily_first'
        ? ['tavily', 'googlethis']
        : ['googlethis', 'tavily'];

      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tavilyApiKeys,
          providerPriority,
          maxSearchLimit,
          defaultTargetCount
        })
      });

      if (res.ok) {
        setSaveSuccessMessage('設定已成功儲存！');
        setTimeout(() => setSaveSuccessMessage(''), 3000);
      } else {
        alert('儲存失敗');
      }
    } catch (e) {
      console.error(e);
      alert('儲存失敗');
    } finally {
      setSavingSettings(false);
    }
  };

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
          Provider 與 API Key 管理
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

        {/* Tab 2: Providers & API Keys */}
        {activeTab === 'providers' && (
          <div className={styles.settingsGrid}>
            <div className={`${styles.settingsCard} glass-2`}>
              <h3 className={styles.settingsTitle}>Tavily API Key 設定 (多組備援)</h3>
              <div className={styles.formGroup}>
                <div className={styles.formRow} style={{ alignItems: 'flex-start', flexDirection: 'column', gap: '8px' }}>
                  <div>
                    <div className={styles.label}>Tavily API Keys</div>
                    <div className={styles.desc}>
                      支援設定多組 Key。當第一組 Key 額度用完 (429/Quota Limit) 後，系統將自動倒退使用下一組 Key。
                      <br />
                      <strong>格式：</strong>以半形逗號 <code>,</code> 分隔多組 API Key (例如：<code>tvly-Key1, tvly-Key2, tvly-Key3</code>)
                    </div>
                  </div>
                  <textarea 
                    className={styles.inputField} 
                    style={{ width: '100%', minHeight: '90px', fontFamily: 'monospace' }}
                    placeholder="tvly-xxxxxxxxxxxx, tvly-yyyyyyy"
                    value={tavilyApiKeys}
                    onChange={e => setTavilyApiKeys(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className={`${styles.settingsCard} glass-2`}>
              <h3 className={styles.settingsTitle}>搜尋平台優先順序設定</h3>
              <div className={styles.formGroup}>
                <div className={styles.formRow}>
                  <div>
                    <div className={styles.label}>搜尋引擎優先調用順序</div>
                    <div className={styles.desc}>選擇搜尋任務執行時，系統嘗試搜尋平台的優先順序</div>
                  </div>
                  <select 
                    className={styles.inputField}
                    value={providerPriorityMode}
                    onChange={e => setProviderPriorityMode(e.target.value as any)}
                  >
                    <option value="tavily_first">1. Tavily AI Search  ➜  2. GoogleThis (免費爬蟲)</option>
                    <option value="googlethis_first">1. GoogleThis (免費爬蟲)  ➜  2. Tavily AI Search</option>
                  </select>
                </div>
              </div>
            </div>

            {saveSuccessMessage && (
              <div style={{ color: '#10b981', fontWeight: 600, padding: '8px 0' }}>
                {saveSuccessMessage}
              </div>
            )}

            <button 
              className={`${styles.primaryBtn} ${styles.saveBtn}`} 
              onClick={handleSaveSettings}
              disabled={savingSettings}
            >
              {savingSettings ? '儲存中...' : '儲存 Provider 設定'}
            </button>
          </div>
        )}

        {/* Tab 3: Settings */}
        {activeTab === 'settings' && (
          <div className={styles.settingsGrid}>
            <div className={`${styles.settingsCard} glass-2`}>
              <h3 className={styles.settingsTitle}>搜尋與分析設定</h3>
              <div className={styles.formGroup}>
                <div className={styles.formRow}>
                  <div>
                    <div className={styles.label}>每次搜尋上限</div>
                    <div className={styles.desc}>單次深度搜尋可抓取的頁面數</div>
                  </div>
                  <input 
                    type="number" 
                    className={styles.inputField} 
                    value={maxSearchLimit}
                    onChange={e => setMaxSearchLimit(Number(e.target.value))} 
                  />
                </div>
                <div className={styles.formRow}>
                  <div>
                    <div className={styles.label}>預設目標數量</div>
                    <div className={styles.desc}>建立潛在客戶清單時的預設尋找數量</div>
                  </div>
                  <input 
                    type="number" 
                    className={styles.inputField} 
                    value={defaultTargetCount}
                    onChange={e => setDefaultTargetCount(Number(e.target.value))} 
                  />
                </div>
              </div>
            </div>

            <div className={`${styles.settingsCard} glass-2`}>
              <h3 className={styles.settingsTitle}>搜尋平台與 Key 快速設定</h3>
              <div className={styles.formGroup}>
                <div className={styles.formRow} style={{ alignItems: 'flex-start', flexDirection: 'column', gap: '8px' }}>
                  <div>
                    <div className={styles.label}>Tavily API Keys (多組以逗號分隔)</div>
                  </div>
                  <input 
                    type="text"
                    className={styles.inputField} 
                    style={{ width: '100%', fontFamily: 'monospace' }}
                    placeholder="tvly-Key1, tvly-Key2"
                    value={tavilyApiKeys}
                    onChange={e => setTavilyApiKeys(e.target.value)}
                  />
                </div>
                <div className={styles.formRow}>
                  <div>
                    <div className={styles.label}>搜尋引擎優先順序</div>
                  </div>
                  <select 
                    className={styles.inputField}
                    value={providerPriorityMode}
                    onChange={e => setProviderPriorityMode(e.target.value as any)}
                  >
                    <option value="tavily_first">1. Tavily AI Search  ➜  2. GoogleThis (免費爬蟲)</option>
                    <option value="googlethis_first">1. GoogleThis (免費爬蟲)  ➜  2. Tavily AI Search</option>
                  </select>
                </div>
              </div>
            </div>

            {saveSuccessMessage && (
              <div style={{ color: '#10b981', fontWeight: 600, padding: '8px 0' }}>
                {saveSuccessMessage}
              </div>
            )}

            <button 
              className={`${styles.primaryBtn} ${styles.saveBtn}`} 
              onClick={handleSaveSettings}
              disabled={savingSettings}
            >
              {savingSettings ? '儲存中...' : '儲存系統設定'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
