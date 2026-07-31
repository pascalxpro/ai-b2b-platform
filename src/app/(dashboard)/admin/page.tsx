'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './page.module.css';
import { 
  Settings, Plus, Search, Edit2, Ban, GripVertical,
  AlertTriangle
} from 'lucide-react';

// Engine registry (must match server-side ENGINE_REGISTRY)
const ENGINE_REGISTRY = [
  { id: 'tavily', name: 'Tavily AI Search', type: 'api' as const, freeQuota: '1,000次/月', quotaDetail: '免費方案每月 1,000 次 API 呼叫', signupUrl: 'https://tavily.com', needsApiKey: true },
  { id: 'serper', name: 'Serper.dev (Google)', type: 'api' as const, freeQuota: '2,500次/月', quotaDetail: '免費方案每月 2,500 次 Google 搜尋', signupUrl: 'https://serper.dev', needsApiKey: true },
  { id: 'google_cse', name: 'Google Custom Search', type: 'api' as const, freeQuota: '100次/天', quotaDetail: '免費方案每天 100 次查詢', signupUrl: 'https://programmablesearchengine.google.com', needsApiKey: true, needsExtraConfig: true, extraConfigLabel: 'CX ID', extraConfigPlaceholder: '搜尋引擎 CX ID' },
  { id: 'bing_api', name: 'Bing Web Search API', type: 'api' as const, freeQuota: '1,000次/月', quotaDetail: '免費方案每月 1,000 次查詢', signupUrl: 'https://www.microsoft.com/en-us/bing/apis/bing-web-search-api', needsApiKey: true },
  { id: 'exa', name: 'Exa.ai', type: 'api' as const, freeQuota: '1,000次/月', quotaDetail: '免費方案每月 1,000 次 AI 語義搜尋', signupUrl: 'https://exa.ai', needsApiKey: true },
  { id: 'searxng', name: 'SearXNG (自架)', type: 'api' as const, freeQuota: '無限 (自架)', quotaDetail: '自架伺服器，無次數限制', signupUrl: 'https://docs.searxng.org', needsApiKey: false, needsExtraConfig: true, extraConfigLabel: 'Instance URL', extraConfigPlaceholder: 'https://your-searxng-instance.com' },
  { id: 'brave_api', name: 'Brave Search API', type: 'api' as const, freeQuota: '2,000次/月', quotaDetail: '免費方案每月 2,000 次查詢', signupUrl: 'https://brave.com/search/api/', needsApiKey: true },
  { id: 'yahoo', name: 'Yahoo Search (免費爬蟲)', type: 'scraper' as const, freeQuota: '無限', quotaDetail: '免費網頁爬蟲，無次數限制', needsApiKey: false },
  { id: 'duckduckgo', name: 'DuckDuckGo (免費爬蟲)', type: 'scraper' as const, freeQuota: '無限', quotaDetail: '免費網頁爬蟲，無次數限制', needsApiKey: false, warning: '雲端 IP 可能被封鎖' },
  { id: 'bing_scraper', name: 'Bing Search (免費爬蟲)', type: 'scraper' as const, freeQuota: '無限', quotaDetail: '免費網頁爬蟲，無次數限制', needsApiKey: false, warning: '結果品質可能受限' },
];

interface EngineState {
  id: string;
  enabled: boolean;
  apiKeys: string;
  extraConfig: string;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Engine states
  const [engines, setEngines] = useState<EngineState[]>([]);
  const [maxSearchLimit, setMaxSearchLimit] = useState(50);
  const [defaultTargetCount, setDefaultTargetCount] = useState(100);
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('');

  // Drag state
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

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

    // Fetch Settings
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(data => {
        if (data) {
          if (data.maxSearchLimit) setMaxSearchLimit(data.maxSearchLimit);
          if (data.defaultTargetCount) setDefaultTargetCount(data.defaultTargetCount);
          
          if (Array.isArray(data.searchEngines) && data.searchEngines.length > 0) {
            // Use saved order
            const engList: EngineState[] = data.searchEngines.map((e: any) => ({
              id: e.id,
              enabled: !!e.enabled,
              apiKeys: e.apiKeys || '',
              extraConfig: e.extraConfig || '',
            }));
            // Add any new engines not in saved data
            const savedIds = new Set(engList.map(e => e.id));
            for (const reg of ENGINE_REGISTRY) {
              if (!savedIds.has(reg.id)) {
                engList.push({ id: reg.id, enabled: false, apiKeys: '', extraConfig: '' });
              }
            }
            setEngines(engList);
          } else {
            // Default
            setEngines(ENGINE_REGISTRY.map(e => ({
              id: e.id,
              enabled: e.id === 'tavily' || e.id === 'yahoo',
              apiKeys: e.id === 'tavily' ? (data.tavilyApiKeys || '') : '',
              extraConfig: '',
            })));
          }
        }
      })
      .catch(console.error);
  }, []);

  // Engine helpers
  const getRegistryInfo = (id: string) => ENGINE_REGISTRY.find(e => e.id === id);

  const updateEngine = useCallback((idx: number, field: keyof EngineState, value: any) => {
    setEngines(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  }, []);

  // Drag handlers
  const handleDragStart = (idx: number) => {
    dragItem.current = idx;
    setDragIdx(idx);
  };

  const handleDragEnter = (idx: number) => {
    dragOverItem.current = idx;
    setDragOverIdx(idx);
  };

  const handleDragEnd = () => {
    if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
      setEngines(prev => {
        const next = [...prev];
        const draggedItem = next[dragItem.current!];
        next.splice(dragItem.current!, 1);
        next.splice(dragOverItem.current!, 0, draggedItem);
        return next;
      });
    }
    dragItem.current = null;
    dragOverItem.current = null;
    setDragIdx(null);
    setDragOverIdx(null);
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    setSaveSuccessMessage('');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          searchEngines: engines.map(e => ({
            id: e.id,
            enabled: e.enabled,
            apiKeys: e.apiKeys,
            extraConfig: e.extraConfig,
          })),
          maxSearchLimit,
          defaultTargetCount,
        })
      });

      if (res.ok) {
        setSaveSuccessMessage('✅ 設定已成功儲存！');
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

  // Find first scraper index for separator
  const firstScraperIdx = engines.findIndex(e => getRegistryInfo(e.id)?.type === 'scraper');

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
          搜尋引擎管理
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

        {/* Tab 2: Search Engine Management */}
        {activeTab === 'providers' && (
          <div className={styles.settingsGrid}>
            <div className={styles.engineSubtitle}>
              拖拽引擎卡片調整搜尋順序（上方優先）。勾選啟用的引擎，每個引擎支援多組 API Key（以逗號分隔），額度用完自動切換下一組。
            </div>

            <div className={styles.engineList}>
              {engines.map((engine, idx) => {
                const info = getRegistryInfo(engine.id);
                if (!info) return null;
                const isScraper = info.type === 'scraper';
                const showSeparator = idx === firstScraperIdx && firstScraperIdx > 0;

                return (
                  <React.Fragment key={engine.id}>
                    {showSeparator && (
                      <div className={styles.engineSeparator}>
                        免費爬蟲引擎（無需 API Key）
                      </div>
                    )}
                    <div
                      className={`${styles.engineCard} ${!engine.enabled ? styles.engineCardDisabled : ''} ${dragIdx === idx ? styles.engineCardDragging : ''} ${dragOverIdx === idx ? styles.engineDragOver : ''}`}
                      draggable
                      onDragStart={() => handleDragStart(idx)}
                      onDragEnter={() => handleDragEnter(idx)}
                      onDragOver={(e) => e.preventDefault()}
                      onDragEnd={handleDragEnd}
                    >
                      {/* Drag Handle */}
                      <div className={styles.dragHandle}>
                        <GripVertical size={18} />
                      </div>

                      {/* Checkbox */}
                      <div className={styles.engineCheckbox}>
                        <input
                          type="checkbox"
                          checked={engine.enabled}
                          onChange={(e) => { e.stopPropagation(); updateEngine(idx, 'enabled', e.target.checked); }}
                        />
                      </div>

                      {/* Content */}
                      <div className={styles.engineContent}>
                        {/* Header row */}
                        <div className={styles.engineHeader}>
                          <span className={styles.engineOrder}>{idx + 1}</span>
                          <span className={styles.engineName}>{info.name}</span>
                          <span className={`${styles.engineTypeBadge} ${isScraper ? styles.badgeFree : styles.badgeApi}`}>
                            {isScraper ? 'FREE' : 'API'}
                          </span>
                        </div>

                        {/* API Key input */}
                        {info.needsApiKey && (
                          <div className={styles.engineKeySection}>
                            <label className={styles.engineKeyLabel}>API Keys（多組以逗號分隔，額度用完自動切換）</label>
                            <textarea
                              className={styles.engineKeyInput}
                              placeholder={`輸入 ${info.name} API Key，多組以逗號分隔`}
                              value={engine.apiKeys}
                              onChange={(e) => updateEngine(idx, 'apiKeys', e.target.value)}
                              rows={1}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        )}

                        {/* Extra config (CX ID, Instance URL) */}
                        {info.needsExtraConfig && (
                          <div className={styles.engineKeySection}>
                            <label className={styles.engineKeyLabel}>{info.extraConfigLabel}</label>
                            <input
                              type="text"
                              className={styles.engineKeyInput}
                              style={{ minHeight: '36px' }}
                              placeholder={info.extraConfigPlaceholder}
                              value={engine.extraConfig}
                              onChange={(e) => updateEngine(idx, 'extraConfig', e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        )}

                        {/* Quota & Meta info */}
                        <div className={styles.engineQuotaRow}>
                          <span className={`${styles.quotaBadge} ${isScraper ? styles.quotaFree : styles.quotaLimited}`}>
                            {isScraper ? '🟢' : '📊'} 免費額度：{info.freeQuota}
                          </span>
                          {info.warning && (
                            <span className={styles.engineWarningBadge}>
                              <AlertTriangle size={12} /> {info.warning}
                            </span>
                          )}
                        </div>
                        <div className={styles.engineMetaDetail}>
                          <span>{info.quotaDetail}</span>
                          {(info as any).signupUrl && (
                            <>
                              <span>·</span>
                              <a 
                                href={(info as any).signupUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className={styles.engineSignupLink}
                                onClick={(e) => e.stopPropagation()}
                              >
                                🔗 申請 API Key
                              </a>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
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
              {savingSettings ? '儲存中...' : '💾 儲存引擎設定'}
            </button>
          </div>
        )}

        {/* Tab 3: System Settings */}
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
