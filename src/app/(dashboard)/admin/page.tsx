'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './page.module.css';
import { 
  Settings, Plus, Search, Edit2, Ban, GripVertical,
  AlertTriangle, Globe, Monitor, Cpu, Zap, CheckCircle, XCircle,
  Eye, EyeOff, Shield
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const AI_PROVIDERS = [
  { id: 'gemini' as const, name: 'Google Gemini', desc: '雲端 AI，需要 API Key', icon: Globe },
  { id: 'ollama' as const, name: 'Ollama', desc: '本地 AI，免費開源', icon: Monitor },
  { id: 'lmstudio' as const, name: 'LM Studio', desc: '本地 AI，簡易介面', icon: Cpu },
];

const GEMINI_MODELS = [
  { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite (最經濟)' },
  { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash Lite (經濟)' },
  { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash (推薦)' },
  { id: 'gemini-3.1-pro', name: 'Gemini 3.1 Pro (最強)' },
];

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
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
  const [showAiKey, setShowAiKey] = useState(false);

  // Check admin auth
  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => {
        if (data.authenticated && data.user?.isAdmin) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      })
      .catch(() => setIsAdmin(false))
      .finally(() => setAuthChecking(false));
  }, []);

  const toggleKeyVisibility = (engineId: string) => {
    setShowApiKeys(prev => ({ ...prev, [engineId]: !prev[engineId] }));
  };

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Engine states
  const [engines, setEngines] = useState<EngineState[]>([]);
  const [maxSearchLimit, setMaxSearchLimit] = useState(50);
  const [defaultTargetCount, setDefaultTargetCount] = useState(100);
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('');

  // AI settings state
  const [aiProvider, setAiProvider] = useState<'gemini' | 'ollama' | 'lmstudio'>('gemini');
  const [aiApiKey, setAiApiKey] = useState('');
  const [aiModel, setAiModel] = useState('gemini-2.0-flash-lite');
  const [aiBaseUrl, setAiBaseUrl] = useState('');
  const [aiTestResult, setAiTestResult] = useState<{success: boolean; message: string} | null>(null);
  const [aiTesting, setAiTesting] = useState(false);
  const [aiSaving, setAiSaving] = useState(false);

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
          if (data.aiProvider) setAiProvider(data.aiProvider);
          if (data.aiApiKey) setAiApiKey(data.aiApiKey);
          if (data.aiModel) setAiModel(data.aiModel);
          if (data.aiBaseUrl) setAiBaseUrl(data.aiBaseUrl);
          
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

  // Drag handlers - safe reorder
  const handleDragStart = (e: React.DragEvent, idx: number) => {
    dragItem.current = idx;
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
    // Required for Firefox
    e.dataTransfer.setData('text/plain', String(idx));
  };

  const handleDragEnter = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    dragOverItem.current = idx;
    setDragOverIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIdx: number) => {
    e.preventDefault();
    const fromIdx = dragItem.current;
    if (fromIdx === null || fromIdx === dropIdx) {
      setDragIdx(null);
      setDragOverIdx(null);
      dragItem.current = null;
      dragOverItem.current = null;
      return;
    }
    setEngines(prev => {
      const next = [...prev];
      const [movedItem] = next.splice(fromIdx, 1);
      next.splice(dropIdx, 0, movedItem);
      return next;
    });
    dragItem.current = null;
    dragOverItem.current = null;
    setDragIdx(null);
    setDragOverIdx(null);
  };

  const handleDragEnd = () => {
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
        const data = await res.json().catch(() => ({}));
        alert(`儲存失敗（設定未寫入資料庫，重啟後會遺失）：\n${data.error || `HTTP ${res.status}`}`);
      }
    } catch (e: any) {
      console.error(e);
      alert(`儲存失敗（設定未寫入資料庫，重啟後會遺失）：\n${e.message}`);
    } finally {
      setSavingSettings(false);
    }
  };

  // AI test connection
  const handleAiTest = async () => {
    setAiTesting(true);
    setAiTestResult(null);
    try {
      const res = await fetch('/api/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: aiProvider, apiKey: aiApiKey, model: aiModel, baseUrl: aiBaseUrl }),
      });
      const data = await res.json();
      if (data.success) {
        setAiTestResult({ success: true, message: `✅ 連線成功！回覆：${data.reply}` });
      } else {
        setAiTestResult({ success: false, message: `❌ ${data.error}` });
      }
    } catch (e: any) {
      setAiTestResult({ success: false, message: `❌ 連線失敗：${e.message}` });
    } finally {
      setAiTesting(false);
    }
  };

  // Save AI settings
  const handleSaveAiSettings = async () => {
    setAiSaving(true);
    setSaveSuccessMessage('');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aiProvider, aiApiKey, aiModel, aiBaseUrl }),
      });
      if (res.ok) {
        setSaveSuccessMessage('✅ AI 設定已成功儲存！');
        setTimeout(() => setSaveSuccessMessage(''), 3000);
      } else {
        const data = await res.json().catch(() => ({}));
        alert(`儲存失敗（API Key 未寫入資料庫，重啟後會遺失）：\n${data.error || `HTTP ${res.status}`}`);
      }
    } catch (e: any) {
      console.error(e);
      alert(`儲存失敗（API Key 未寫入資料庫，重啟後會遺失）：\n${e.message}`);
    } finally {
      setAiSaving(false);
    }
  };

  // Find first scraper index for separator
  const firstScraperIdx = engines.findIndex(e => getRegistryInfo(e.id)?.type === 'scraper');

  if (authChecking) {
    return (
      <div className={styles.authGuard}>
        <div className={styles.authCard}>
          <div className={styles.authSpinner} />
          <h2 className={styles.authTitle}>驗證身分中</h2>
          <p className={styles.authSubtext}>正在確認您的管理員權限...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className={styles.authGuard}>
        <div className={styles.authCard}>
          <div className={styles.authShield}>
            <Shield size={32} />
          </div>
          <h2 className={styles.authTitle}>存取被拒絕</h2>
          <p className={styles.authSubtext}>
            此功能僅限系統管理員使用。<br />
            請使用管理員帳號登入以存取系統設定。
          </p>
          <button
            className={styles.authLoginBtn}
            onClick={() => router.push('/login')}
          >
            <Shield size={16} />
            前往登入
          </button>
        </div>
      </div>
    );
  }

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
          className={`${styles.tab} ${activeTab === 'ai' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('ai')}
        >
          AI 服務配置
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
                      onDragStart={(e) => handleDragStart(e, idx)}
                      onDragEnter={(e) => handleDragEnter(e, idx)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, idx)}
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
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                              <input
                                className={styles.engineKeyInput}
                                type={showApiKeys[info.id] ? 'text' : 'password'}
                                placeholder={`輸入 ${info.name} API Key，多組以逗號分隔`}
                                value={engine.apiKeys}
                                onChange={(e) => updateEngine(idx, 'apiKeys', e.target.value)}
                                style={{ paddingRight: 40 }}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <button
                                type="button"
                                onClick={() => toggleKeyVisibility(info.id)}
                                style={{ position: 'absolute', right: 10, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4 }}
                              >
                                {showApiKeys[info.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            </div>
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

        {/* Tab 3: AI Settings */}
        {activeTab === 'ai' && (
          <div className={styles.settingsGrid} style={{ maxWidth: 900 }}>
            <div className={`${styles.settingsCard} glass-2`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Zap size={20} color="white" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>AI 服務配置</h3>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>選擇並設定 AI 服務，支援雲端與本地端模型。</p>
                </div>
              </div>

              {/* Provider Selection */}
              <div style={{ marginTop: 16 }}>
                <div className={styles.label} style={{ marginBottom: 12 }}>AI 服務提供商</div>
                <div className={styles.aiProviderGrid}>
                  {AI_PROVIDERS.map(p => {
                    const Icon = p.icon;
                    const isActive = aiProvider === p.id;
                    return (
                      <button
                        key={p.id}
                        className={`${styles.aiProviderCard} ${isActive ? styles.aiProviderActive : ''}`}
                        onClick={() => { setAiProvider(p.id); setAiTestResult(null); }}
                      >
                        {isActive && <CheckCircle size={16} className={styles.aiProviderCheck} />}
                        <Icon size={28} style={{ color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)' }} />
                        <span className={styles.aiProviderName}>{p.name}</span>
                        <span className={styles.aiProviderDesc}>{p.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* API Key */}
              {aiProvider === 'gemini' && (
                <div style={{ marginTop: 16 }}>
                  <div className={styles.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>🔑</span> Google AI API Key
                  </div>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginTop: 8 }}>
                    <input
                      className={styles.engineKeyInput}
                      type={showAiKey ? 'text' : 'password'}
                      style={{ minHeight: 42, width: '100%', paddingRight: 40 }}
                      placeholder="輸入 Google AI API Key"
                      value={aiApiKey}
                      onChange={e => setAiApiKey(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowAiKey(!showAiKey)}
                      style={{ position: 'absolute', right: 10, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4 }}
                    >
                      {showAiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '0.8rem', color: 'var(--color-primary)', marginTop: 6, display: 'inline-block' }}
                  >
                    從 Google AI Studio 免費取得 →
                  </a>
                </div>
              )}

              {/* Base URL for Ollama / LM Studio */}
              {(aiProvider === 'ollama' || aiProvider === 'lmstudio') && (
                <div style={{ marginTop: 16 }}>
                  <div className={styles.label}>🌐 API 端點</div>
                  <input
                    type="text"
                    className={styles.engineKeyInput}
                    style={{ marginTop: 8, minHeight: 42 }}
                    placeholder={aiProvider === 'ollama' ? 'http://localhost:11434' : 'http://localhost:1234'}
                    value={aiBaseUrl}
                    onChange={e => setAiBaseUrl(e.target.value)}
                  />
                </div>
              )}

              {/* Model Selection */}
              <div style={{ marginTop: 16 }}>
                <div className={styles.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>🤖</span> 模型
                </div>
                {aiProvider === 'gemini' ? (
                  <select
                    className={styles.engineKeyInput}
                    style={{ marginTop: 8, minHeight: 42, cursor: 'pointer' }}
                    value={aiModel}
                    onChange={e => setAiModel(e.target.value)}
                  >
                    {GEMINI_MODELS.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    className={styles.engineKeyInput}
                    style={{ marginTop: 8, minHeight: 42 }}
                    placeholder={aiProvider === 'ollama' ? 'llama3' : 'local-model'}
                    value={aiModel}
                    onChange={e => setAiModel(e.target.value)}
                  />
                )}
              </div>

              {/* Test Connection */}
              <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <button
                  className={styles.aiTestBtn}
                  onClick={handleAiTest}
                  disabled={aiTesting}
                >
                  <Zap size={16} />
                  {aiTesting ? '測試中...' : '測試連線'}
                </button>
                {aiTestResult && (
                  <span style={{
                    fontSize: '0.85rem',
                    color: aiTestResult.success ? '#10b981' : '#ef4444',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    {aiTestResult.success ? <CheckCircle size={16} /> : <XCircle size={16} />}
                    {aiTestResult.message}
                  </span>
                )}
              </div>
            </div>

            {saveSuccessMessage && (
              <div style={{ color: '#10b981', fontWeight: 600, padding: '8px 0' }}>
                {saveSuccessMessage}
              </div>
            )}

            <button
              className={`${styles.primaryBtn} ${styles.saveBtn}`}
              onClick={handleSaveAiSettings}
              disabled={aiSaving}
            >
              {aiSaving ? '儲存中...' : '💾 儲存 AI 設定'}
            </button>
          </div>
        )}

        {/* Tab 4: System Settings */}
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
