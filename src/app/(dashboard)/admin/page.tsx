'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './page.module.css';
import { 
  Settings, Plus, Search, Edit2, Ban, Trash2, GripVertical, X,
  AlertTriangle, Globe, Monitor, Cpu, Zap, CheckCircle, XCircle,
  Eye, EyeOff, Shield
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Portal from '@/components/ui/Portal';
import { GEMINI_MODELS, modelLabel } from '@/lib/ai/models';
import { DEFAULT_BRANDING, MAX_LOGO_DATA_URL_LENGTH, type BrandingSettings } from '@/lib/settings/branding';

const AI_PROVIDERS = [
  { id: 'gemini' as const, name: 'Google Gemini', desc: '雲端 AI，需要 API Key', icon: Globe },
  { id: 'ollama' as const, name: 'Ollama', desc: '本地 AI，免費開源', icon: Monitor },
  { id: 'lmstudio' as const, name: 'LM Studio', desc: '本地 AI，簡易介面', icon: Cpu },
];

// GEMINI_MODELS lives in @/lib/ai/models so this page and the per-user key
// dialog render the same catalogue — a second copy here would drift as soon as
// Google renames a model or changes a quota.

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

  // Raw user records from the API; display strings are derived at render time
  // so edits don't have to keep a parallel formatted copy in sync.
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [userModal, setUserModal] = useState<null | { mode: 'create' | 'edit'; user: any }>(null);
  const [userSaving, setUserSaving] = useState(false);
  const [userError, setUserError] = useState('');

  // Promise chain rather than async/await: the react-hooks lint rule traces
  // into async callbacks invoked from an effect and reports the setState calls
  // as synchronous cascading renders, even though they run after an await.
  const loadUsers = useCallback(() => {
    return fetch('/api/users')
      .then(r => r.json())
      .then(data => setUsers(Array.isArray(data) ? data : []))
      .catch(e => console.error('Failed to load users:', e))
      .finally(() => setLoading(false));
  }, []);

  const saveUser = async (form: { id?: string; name: string; email: string; password: string; isAdmin: boolean; status: string }) => {
    setUserSaving(true);
    setUserError('');
    try {
      const isEdit = Boolean(form.id);
      const payload: Record<string, any> = {
        name: form.name,
        email: form.email,
        status: form.status,
        isAdmin: form.isAdmin,
      };
      if (form.id) payload.id = form.id;
      // On edit an empty password field means "leave the password alone".
      if (form.password) payload.password = form.password;

      const res = await fetch('/api/users', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      await loadUsers();
      setUserModal(null);
    } catch (e: any) {
      setUserError(e.message);
    } finally {
      setUserSaving(false);
    }
  };

  const toggleUserStatus = async (user: any) => {
    const nextStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const verb = nextStatus === 'ACTIVE' ? '啟用' : '停用';
    if (!confirm(`確定要${verb} ${user.name}（${user.email}）嗎？`)) return;
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, status: nextStatus }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      await loadUsers();
    } catch (e: any) {
      alert(`${verb}失敗：${e.message}`);
    }
  };

  // Permanent and distinct from toggleUserStatus's 停用: this removes the row
  // entirely rather than just marking it inactive. The API refuses when the
  // account has created search tasks/meetings/etc. (a real FK constraint, not
  // a bug) and reports that back so the message here explains why.
  const deleteUser = async (user: any) => {
    if (!confirm(`確定要永久刪除 ${user.name}（${user.email}）嗎？此動作無法復原。`)) return;
    try {
      const res = await fetch(`/api/users?id=${encodeURIComponent(user.id)}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      await loadUsers();
    } catch (e: any) {
      alert(`刪除失敗：${e.message}`);
    }
  };

  const visibleUsers = users.filter(u => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return true;
    return (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
  });

  // Engine states
  const [engines, setEngines] = useState<EngineState[]>([]);
  const [maxSearchLimit, setMaxSearchLimit] = useState(50);
  const [defaultTargetCount, setDefaultTargetCount] = useState(100);
  const [branding, setBranding] = useState<BrandingSettings>(DEFAULT_BRANDING);
  const [logoUploadError, setLogoUploadError] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('');

  // AI settings state
  const [aiProvider, setAiProvider] = useState<'gemini' | 'ollama' | 'lmstudio'>('gemini');
  const [aiApiKey, setAiApiKey] = useState('');
  const [aiModel, setAiModel] = useState('gemini-3.5-flash-lite');
  const [aiBaseUrl, setAiBaseUrl] = useState('');
  const [aiCallMode, setAiCallMode] = useState<'server' | 'browser'>('server');
  const [aiTestResult, setAiTestResult] = useState<{success: boolean; message: string} | null>(null);
  const [aiTesting, setAiTesting] = useState(false);
  const [aiSaving, setAiSaving] = useState(false);

  // Drag state
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  useEffect(() => {
    // Fire-and-forget: every setState inside happens after an await, so it
    // cannot cascade renders synchronously from the effect body.
    void loadUsers();

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
          if (data.aiCallMode) setAiCallMode(data.aiCallMode);
          if (data.branding) setBranding({ ...DEFAULT_BRANDING, ...data.branding });

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
    // loadUsers is a useCallback with no deps, so it is stable and this still
    // runs exactly once on mount.
  }, [loadUsers]);

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

  // Resizes the uploaded image client-side before it ever becomes a data URL.
  // Without this, a user uploading a straight-off-the-camera photo as a
  // "logo" would blow well past MAX_LOGO_DATA_URL_LENGTH and bloat the
  // settings row. Capping at 240px (well above anything the sidebar actually
  // renders it at) keeps the stored size small while preserving the source
  // image's aspect ratio — width and height are scaled by the same factor,
  // never cropped or stretched.
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file next time
    if (!file) return;

    setLogoUploadError('');
    if (!file.type.startsWith('image/')) {
      setLogoUploadError('請上傳圖片檔案');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setLogoUploadError('圖片檔案過大（上限 8MB），請先壓縮再上傳');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 240;
        const scale = Math.min(1, MAX_DIM / Math.max(img.naturalWidth, img.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.naturalWidth * scale);
        canvas.height = Math.round(img.naturalHeight * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setLogoUploadError('瀏覽器不支援圖片處理');
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');

        if (dataUrl.length > MAX_LOGO_DATA_URL_LENGTH) {
          setLogoUploadError('圖片處理後仍然過大，請使用更簡單／更小尺寸的圖片');
          return;
        }
        setBranding(prev => ({ ...prev, logoDataUrl: dataUrl }));
      };
      img.onerror = () => setLogoUploadError('無法讀取這張圖片');
      img.src = reader.result as string;
    };
    reader.onerror = () => setLogoUploadError('無法讀取檔案');
    reader.readAsDataURL(file);
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
          branding,
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
        body: JSON.stringify({ aiProvider, aiApiKey, aiModel, aiBaseUrl, aiCallMode }),
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
                <input
                  type="text"
                  placeholder="搜尋使用者..."
                  className={styles.searchInput}
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                />
              </div>
              <button
                className={styles.primaryBtn}
                onClick={() => {
                  setUserError('');
                  setUserModal({ mode: 'create', user: { name: '', email: '', isAdmin: false, status: 'ACTIVE' } });
                }}
              >
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
                  ) : visibleUsers.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24, color: 'var(--color-text-muted)' }}>
                      {userSearch ? '找不到符合的使用者' : '尚無使用者'}
                    </td></tr>
                  ) : visibleUsers.map(user => {
                    const active = user.status === 'ACTIVE';
                    return (
                      <tr key={user.id}>
                        <td>{user.name || '未知'}</td>
                        <td>{user.email}</td>
                        <td>
                          <span className={`${styles.badge} ${user.isAdmin ? styles.badgeSuccess : styles.badgeDefault}`}>
                            {user.isAdmin ? '管理員' : (user.workspaceMembers?.[0]?.role || '成員')}
                          </span>
                        </td>
                        <td>{user.workspaceMembers?.[0]?.workspace?.name || '無'}</td>
                        <td>
                          <span className={`${styles.badge} ${active ? styles.badgeSuccess : styles.badgeWarning}`}>
                            {active ? '啟用' : '停用'}
                          </span>
                        </td>
                        <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '未知'}</td>
                        <td>
                          <div className={styles.actionBtns}>
                            <button
                              className={styles.iconBtn}
                              title="編輯"
                              onClick={() => { setUserError(''); setUserModal({ mode: 'edit', user }); }}
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              className={`${styles.iconBtn} ${styles.danger}`}
                              title={active ? '停用' : '啟用'}
                              onClick={() => toggleUserStatus(user)}
                            >
                              <Ban size={16} />
                            </button>
                            <button
                              className={`${styles.iconBtn} ${styles.danger}`}
                              title="永久刪除"
                              onClick={() => deleteUser(user)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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

              {/* Where the Gemini request originates from */}
              {aiProvider === 'gemini' && (
                <div style={{ marginTop: 20 }}>
                  <div className={styles.label} style={{ marginBottom: 8 }}>呼叫來源</div>
                  <div className={styles.callModeGrid}>
                    <button
                      className={`${styles.callModeCard} ${aiCallMode === 'server' ? styles.callModeActive : ''}`}
                      onClick={() => { setAiCallMode('server'); setAiTestResult(null); }}
                    >
                      <strong>伺服端呼叫</strong>
                      <span>由伺服器統一使用上方金鑰。若主機 IP 被 Google 判定為機房位址，會出現 <code>User location is not supported</code>。</span>
                    </button>
                    <button
                      className={`${styles.callModeCard} ${aiCallMode === 'browser' ? styles.callModeActive : ''}`}
                      onClick={() => { setAiCallMode('browser'); setAiTestResult(null); }}
                    >
                      <strong>瀏覽端呼叫</strong>
                      <span>由每位使用者的瀏覽器以<strong>自己的金鑰</strong>呼叫，金鑰只存在各自電腦，額度也各自獨立（每日 500 次）。</span>
                    </button>
                  </div>
                  {aiCallMode === 'browser' && (
                    <div className={styles.callModeHint}>
                      ℹ️ 切換為瀏覽端後，上方的伺服器金鑰不會再用於翻譯與搜尋詞優化。
                      每位使用者需在「建立搜尋任務」視窗中設定自己的金鑰
                      （<a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer">免費申請</a>）。
                      伺服器金鑰仍保留供日後切換回伺服端使用。
                    </div>
                  )}
                </div>
              )}

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
                  {aiCallMode === 'browser' && aiProvider === 'gemini' && (
                    <span style={{ fontWeight: 400, fontSize: '0.76rem', color: 'var(--color-text-muted)' }}>
                      （團隊預設值，使用者可在自己的金鑰設定中覆寫）
                    </span>
                  )}
                </div>
                {aiProvider === 'gemini' ? (
                  <select
                    className={styles.engineKeyInput}
                    style={{ marginTop: 8, minHeight: 42, cursor: 'pointer' }}
                    value={aiModel}
                    onChange={e => setAiModel(e.target.value)}
                  >
                    {GEMINI_MODELS.map(m => (
                      <option key={m.id} value={m.id}>{modelLabel(m)}</option>
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

            <div className={`${styles.settingsCard} glass-2`}>
              <h3 className={styles.settingsTitle}>品牌設定</h3>
              <div className={styles.formGroup}>
                {/* Logo */}
                <div className={styles.formRow} style={{ alignItems: 'flex-start' }}>
                  <div>
                    <div className={styles.label}>Logo 圖片</div>
                    <div className={styles.desc}>上傳後依原圖比例縮放，不會被裁切變形；未上傳時使用預設的漸層圖示</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {branding.logoDataUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element -- data: URL preview, see Sidebar
                        <img src={branding.logoDataUrl} alt="Logo 預覽" style={{ height: 40, width: 'auto', maxWidth: 160, objectFit: 'contain' }} />
                      ) : (
                        <div style={{ width: 40, height: 40, borderRadius: 8, background: 'linear-gradient(135deg, hsl(var(--hue-primary),80%,55%), hsl(var(--hue-accent),80%,50%))' }} />
                      )}
                      <label className={styles.aiTestBtn} style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
                        上傳圖片
                        <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
                      </label>
                      {branding.logoDataUrl && (
                        <button
                          type="button"
                          onClick={() => setBranding(prev => ({ ...prev, logoDataUrl: '' }))}
                          style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', fontSize: '0.82rem' }}
                        >
                          移除
                        </button>
                      )}
                    </div>
                    {logoUploadError && <div style={{ color: 'var(--color-danger)', fontSize: '0.78rem' }}>{logoUploadError}</div>}
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div>
                    <div className={styles.label}>Logo 高度</div>
                    <div className={styles.desc}>寬度依比例自動調整</div>
                  </div>
                  <input
                    type="number"
                    className={styles.inputField}
                    min={20}
                    max={64}
                    value={branding.logoHeight}
                    onChange={e => setBranding(prev => ({ ...prev, logoHeight: Math.min(64, Math.max(20, Number(e.target.value) || 36)) }))}
                  />
                </div>

                <div style={{ height: 1, background: 'var(--color-border-subtle)', margin: '4px 0' }} />

                {/* Line 1: brand name */}
                <div className={styles.formRow}>
                  <div>
                    <div className={styles.label}>第一行文字</div>
                    <div className={styles.desc}>品牌名稱</div>
                  </div>
                  <input
                    type="text"
                    className={styles.inputField}
                    value={branding.brandName}
                    onChange={e => setBranding(prev => ({ ...prev, brandName: e.target.value }))}
                    maxLength={30}
                  />
                </div>
                <div className={styles.formRow}>
                  <div><div className={styles.label}>第一行文字大小</div></div>
                  <input
                    type="number"
                    className={styles.inputField}
                    min={10}
                    max={32}
                    value={branding.brandNameSize}
                    onChange={e => setBranding(prev => ({ ...prev, brandNameSize: Math.min(32, Math.max(10, Number(e.target.value) || 17)) }))}
                  />
                </div>
                <div className={styles.formRow}>
                  <div><div className={styles.label}>第一行文字顏色</div></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input
                      type="color"
                      value={branding.brandNameColor || '#ffffff'}
                      onChange={e => setBranding(prev => ({ ...prev, brandNameColor: e.target.value }))}
                      style={{ width: 40, height: 32, padding: 0, border: '1px solid var(--color-border)', borderRadius: 6, cursor: 'pointer', background: 'none' }}
                    />
                    {branding.brandNameColor && (
                      <button type="button" onClick={() => setBranding(prev => ({ ...prev, brandNameColor: '' }))} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '0.78rem' }}>
                        恢復預設
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ height: 1, background: 'var(--color-border-subtle)', margin: '4px 0' }} />

                {/* Line 2: subtitle */}
                <div className={styles.formRow}>
                  <div>
                    <div className={styles.label}>第二行文字</div>
                    <div className={styles.desc}>副標題</div>
                  </div>
                  <input
                    type="text"
                    className={styles.inputField}
                    value={branding.subtitle}
                    onChange={e => setBranding(prev => ({ ...prev, subtitle: e.target.value }))}
                    maxLength={30}
                  />
                </div>
                <div className={styles.formRow}>
                  <div><div className={styles.label}>第二行文字大小</div></div>
                  <input
                    type="number"
                    className={styles.inputField}
                    min={8}
                    max={24}
                    value={branding.subtitleSize}
                    onChange={e => setBranding(prev => ({ ...prev, subtitleSize: Math.min(24, Math.max(8, Number(e.target.value) || 12)) }))}
                  />
                </div>
                <div className={styles.formRow}>
                  <div><div className={styles.label}>第二行文字顏色</div></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input
                      type="color"
                      value={branding.subtitleColor || '#94a3b8'}
                      onChange={e => setBranding(prev => ({ ...prev, subtitleColor: e.target.value }))}
                      style={{ width: 40, height: 32, padding: 0, border: '1px solid var(--color-border)', borderRadius: 6, cursor: 'pointer', background: 'none' }}
                    />
                    {branding.subtitleColor && (
                      <button type="button" onClick={() => setBranding(prev => ({ ...prev, subtitleColor: '' }))} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '0.78rem' }}>
                        恢復預設
                      </button>
                    )}
                  </div>
                </div>

                {/* Live preview, styled like the actual sidebar header */}
                <div style={{ marginTop: 8, padding: '14px 16px', borderRadius: 10, background: '#1a1a2e', display: 'flex', alignItems: 'center', gap: 12 }}>
                  {branding.logoDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- data: URL preview, see Sidebar
                    <img src={branding.logoDataUrl} alt="" style={{ height: branding.logoHeight, width: 'auto', maxWidth: 160, objectFit: 'contain', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: branding.logoHeight, height: branding.logoHeight, borderRadius: 8, flexShrink: 0, background: 'linear-gradient(135deg, hsl(var(--hue-primary),80%,55%), hsl(var(--hue-accent),80%,50%))' }} />
                  )}
                  <div>
                    <div style={{ fontWeight: 700, fontSize: branding.brandNameSize, color: branding.brandNameColor || '#ffffff', lineHeight: 1.2 }}>
                      {branding.brandName || 'AI B2B'}
                    </div>
                    <div style={{ fontSize: branding.subtitleSize, color: branding.subtitleColor || '#94a3b8' }}>
                      {branding.subtitle || '商業情報平台'}
                    </div>
                  </div>
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

      {userModal && (
        <UserFormModal
          mode={userModal.mode}
          user={userModal.user}
          saving={userSaving}
          error={userError}
          onCancel={() => setUserModal(null)}
          onSave={saveUser}
        />
      )}
    </div>
  );
}

// ─── Create / edit user ───
function UserFormModal({
  mode, user, saving, error, onCancel, onSave,
}: {
  mode: 'create' | 'edit';
  user: any;
  saving: boolean;
  error: string;
  onCancel: () => void;
  onSave: (form: { id?: string; name: string; email: string; password: string; isAdmin: boolean; status: string }) => void;
}) {
  const [name, setName] = useState(user.name || '');
  const [email, setEmail] = useState(user.email || '');
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(Boolean(user.isAdmin));
  const [status, setStatus] = useState(user.status || 'ACTIVE');

  const isEdit = mode === 'edit';
  // A new account with no password could never be signed into, so require one
  // on create; on edit an empty field just leaves the existing password alone.
  const canSubmit = name.trim() && email.trim() && (isEdit || password.length >= 8) && !saving;

  return (
    <Portal>
      <div className={styles.modalOverlay} onClick={onCancel}>
        <div className={styles.modalPanel} onClick={e => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <h3>{isEdit ? '編輯使用者' : '新增使用者'}</h3>
            <button className={styles.iconBtn} onClick={onCancel}><X size={20} /></button>
          </div>

          {error && <div className={styles.modalError}>❌ {error}</div>}

          <div className={styles.modalBody}>
            <label className={styles.modalField}>
              <span>姓名</span>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="王小明" />
            </label>

            <label className={styles.modalField}>
              <span>Email</span>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="user@company.com" />
            </label>

            <label className={styles.modalField}>
              <span>{isEdit ? '重設密碼（留空表示不變更）' : '初始密碼（至少 8 碼）'}</span>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={isEdit ? '不變更' : '至少 8 碼'}
                autoComplete="new-password"
              />
            </label>

            <label className={styles.modalField}>
              <span>狀態</span>
              <select value={status} onChange={e => setStatus(e.target.value)}>
                <option value="ACTIVE">啟用</option>
                <option value="INACTIVE">停用</option>
                <option value="SUSPENDED">已暫停</option>
              </select>
            </label>

            <label className={styles.modalCheckbox}>
              <input type="checkbox" checked={isAdmin} onChange={e => setIsAdmin(e.target.checked)} />
              <span>管理員權限（可存取系統管理、API 金鑰與使用者管理）</span>
            </label>
          </div>

          <div className={styles.modalFooter}>
            <button className={styles.modalCancelBtn} onClick={onCancel} disabled={saving}>取消</button>
            <button
              className={styles.primaryBtn}
              disabled={!canSubmit}
              onClick={() => onSave({ id: user.id, name: name.trim(), email: email.trim(), password, isAdmin, status })}
            >
              {saving ? '儲存中...' : '儲存'}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
