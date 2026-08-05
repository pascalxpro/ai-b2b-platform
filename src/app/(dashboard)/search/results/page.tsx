'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Eye, Edit2, Save, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import ResultsToolbar from '@/components/search/ResultsToolbar';
import BatchActionBar from '@/components/search/BatchActionBar';
import ResultDetailDrawer from '@/components/search/ResultDetailDrawer';
import Breadcrumb from '@/components/ui/Breadcrumb';
import styles from './page.module.css';

// Mirrors the countryConfidence values written by executeSearchTask():
// 'high'     = hostname TLD matches a targeted country
// 'low'      = generic .com/.net/.org, kept but never country-verified
// 'unscoped' = the search specified no target country, so nothing to verify
const CONFIDENCE_META: Record<string, { label: string; color: string; title: string }> = {
  high: { label: '已驗證', color: 'var(--color-success)', title: '網域國別碼與目標國家相符' },
  low: { label: '未驗證', color: 'var(--color-warning)', title: '通用網域（.com/.net/.org），無法由網域確認國別，建議人工複核' },
  unscoped: { label: '—', color: 'var(--color-text-muted)', title: '此次搜尋未指定目標國家' },
};

// Display-only fallback for empty fields. Kept out of the stored row data so
// the inline editor never pre-fills a placeholder and save it back as real
// content.
const show = (value: string, placeholder: string) => (value?.trim() ? value : placeholder);

/**
 * Maps an API row into the shape the table renders. Shared by the initial load
 * and the post-pool-action reload so the two can't drift — an earlier version
 * inlined a second copy and immediately diverged.
 */
function mapResult(d: any) {
  let s = d.scoreJson;
  if (typeof s === 'string') {
    try { s = JSON.parse(s); } catch { s = {}; }
  }
  return {
    id: d.id,
    name: d.companyName || d.name || '',
    localName: d.companyName || '',
    // Raw values only — "未確認"/"未知產業" placeholders are applied at render
    // time via show(). Baking them in here made the inline editor pre-fill
    // those literal strings and save them as real data.
    country: d.country || '',
    countryConfidence: s?.countryConfidence || 'unscoped',
    industry: s?.industry || '',
    companyType: s?.companyType || '',
    employeeCount: s?.employeeCount || '',
    revenue: s?.revenue || '',
    // Falls back to 0, not the old static 75, so genuinely unscored rows are
    // visible rather than masquerading as decent.
    qualityScore: s?.totalScore ?? 0,
    qualityStatus: d.qualityStatus || 'NEW',
    conversionStatus: d.conversionStatus || 'NONE',
    sourceCount: d.sourceCount ?? (Array.isArray(d.sources) ? d.sources.length : 0),
    website: d.website || '',
    email: s?.email || '',
    phone: s?.phone || '',
    linkedin: s?.linkedin || '',
    notes: s?.notes || '',
    sources: d.sources || [],
    provider: s?.provider || '',
    // Ownership / opportunity-pool state
    poolState: d.poolState || 'PRIVATE',
    owner: d.owner || null,
    releasedBy: d.releasedBy || null,
    claimedBy: d.claimedBy || null,
    releasedAt: d.releasedAt || null,
    claimedAt: d.claimedAt || null,
    createdAt: d.createdAt,
  };
}

/** The user shape the results API embeds for owner / releasedBy / claimedBy. */
type PoolUser = { id: string; name?: string | null; email?: string | null } | null | undefined;

/**
 * Shows where a row sits in the ownership flow. What's useful differs by view:
 * in the shared pool the question is "who released this", in your own pool
 * it's "have I released it, and did anyone take it".
 */
function OwnershipCell({
  row,
  poolView,
  myId,
}: {
  row: { poolState?: string; releasedBy?: PoolUser; claimedBy?: PoolUser };
  poolView: 'mine' | 'opportunities';
  myId?: string;
}) {
  const name = (u: PoolUser) => (u?.id === myId ? '我' : u?.name || u?.email || '—');

  // The shared pool never contains the viewer's own releases, so this is
  // always a colleague.
  if (poolView === 'opportunities') {
    return (
      <span style={{ fontSize: '0.78rem', color: 'var(--color-text)' }}>
        {name(row.releasedBy)}
      </span>
    );
  }

  if (row.poolState === 'CLAIMED') {
    // Either I claimed someone's release, or someone claimed mine.
    const iClaimed = row.claimedBy?.id === myId;
    return (
      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
        {iClaimed
          ? <>認領自 <strong style={{ color: 'var(--color-text)' }}>{name(row.releasedBy)}</strong></>
          : <>已由 <strong style={{ color: 'var(--color-text)' }}>{name(row.claimedBy)}</strong> 認領</>}
      </span>
    );
  }

  if (row.poolState === 'RELEASED') {
    return (
      <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 10, whiteSpace: 'nowrap', color: '#f59e0b', border: '1px solid #f59e0b' }}>
        待認領
      </span>
    );
  }

  return <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>—</span>;
}

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const taskId = searchParams.get('taskId');

  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detailData, setDetailData] = useState<any | null>(null);
  const [taskInfo, setTaskInfo] = useState<any | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [savingEdit, setSavingEdit] = useState(false);

  // Filter & Sort state
  const [searchTerm, setSearchTerm] = useState('');
  const [activeQualityFilter, setActiveQualityFilter] = useState<string>('ALL');
  const [activeCountry, setActiveCountry] = useState<string>('ALL');
  const [activeConfidence, setActiveConfidence] = useState<string>('ALL');
  const [batchBusy, setBatchBusy] = useState(false);
  const [sortField, setSortField] = useState<string>('qualityScore');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  // 'mine' = this account's own results; 'opportunities' = the shared pool of
  // results other accounts have released for anyone to claim.
  const [poolView, setPoolView] = useState<'mine' | 'opportunities'>('mine');
  const [me, setMe] = useState<{ id: string } | null>(null);

  useEffect(() => {
    // Needed to tell "released by me" from "released by a colleague" in the
    // opportunity pool — you can withdraw your own, but not claim it.
    fetch('/api/auth/me')
      .then(r => (r.ok ? r.json() : null))
      .then(d => setMe(d?.user ? { id: d.user.id } : null))
      .catch(() => setMe(null));
  }, []);

  useEffect(() => {
    // Fetch task info
    if (taskId) {
      fetch(`/api/search/tasks/${taskId}`)
        .then(r => r.json())
        .then(task => {
          if (task && !task.error) {
            setTaskInfo(task);
          }
        })
        .catch(console.error);
    } else {
      // No taskId: fetch most recent task
      fetch('/api/search/tasks?limit=1')
        .then(r => r.json())
        .then(tasks => {
          if (Array.isArray(tasks) && tasks.length > 0) {
            setTaskInfo(tasks[0]);
          }
        })
        .catch(console.error);
    }

    // Fetch results. The opportunity pool is cross-account and cross-task, so
    // the taskId filter is deliberately not applied there.
    const url = poolView === 'opportunities'
      ? '/api/search/results?pool=opportunities'
      : (taskId ? `/api/search/results?taskId=${taskId}` : '/api/search/results');
    setLoading(true);
    fetch(url)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setResults(data.map(mapResult));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [taskId, poolView]);

  // Filtered & sorted results
  const filteredResults = useMemo(() => {
    let filtered = [...results];

    // Quality status filter
    if (activeQualityFilter !== 'ALL') {
      filtered = filtered.filter(r => r.qualityStatus === activeQualityFilter);
    }

    // Country filter
    if (activeCountry !== 'ALL') {
      filtered = filtered.filter(r => r.country === activeCountry);
    }

    // Country-confidence filter — lets the user isolate results whose country
    // was never verified by a matching TLD (generic .com/.net/.org domains).
    if (activeConfidence !== 'ALL') {
      filtered = filtered.filter(r => r.countryConfidence === activeConfidence);
    }

    // Search term
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.localName.toLowerCase().includes(q) ||
        r.country.toLowerCase().includes(q) ||
        r.industry.toLowerCase().includes(q)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortOrder === 'desc' ? valB - valA : valA - valB;
      }
      const strA = String(valA || '');
      const strB = String(valB || '');
      return sortOrder === 'desc' ? strB.localeCompare(strA) : strA.localeCompare(strB);
    });

    return filtered;
  }, [results, activeQualityFilter, activeCountry, activeConfidence, searchTerm, sortField, sortOrder]);

  // Country options derived from the actual results, so countries the toolbar's
  // old hardcoded list didn't know about are still filterable.
  const countryOptions = useMemo(
    () => Array.from(new Set(results.map(r => r.country).filter(Boolean))).sort(),
    [results]
  );

  // Count of results whose country was never TLD-verified — surfaced as a hint
  // so a run that quietly filled up with unverifiable domains is noticeable.
  const lowConfidenceCount = useMemo(
    () => results.filter(r => r.countryConfidence === 'low').length,
    [results]
  );

  // Reset to page 1 when filters change
  useEffect(() => { setCurrentPage(1); }, [activeQualityFilter, activeCountry, activeConfidence, searchTerm, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredResults.length / pageSize));
  const paginatedResults = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredResults.slice(start, start + pageSize);
  }, [filteredResults, currentPage, pageSize]);

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(filteredResults.map(r => r.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const getQualityColor = (score: number) => {
    if (score >= 80) return 'var(--color-success)';
    if (score >= 60) return 'var(--color-warning)';
    return 'var(--color-danger)';
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'NEW': return styles.badgeInfo;
      case 'VALID': return styles.badgeSuccess;
      case 'PENDING_REVIEW': return styles.badgeWarning;
      case 'DUPLICATE': return styles.badgeMuted;
      case 'INVALID': return styles.badgeDanger;
      default: return styles.badgeInfo;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'NEW': return '新進';
      case 'VALID': return '有效';
      case 'PENDING_REVIEW': return '待確認';
      case 'DUPLICATE': return '重複';
      case 'INVALID': return '無效';
      default: return status;
    }
  };

  /**
   * Release / claim / withdraw against the shared opportunity pool.
   * Always reloads from the server afterwards rather than patching local
   * state: a claim can partially fail (someone else got there first, or the
   * row duplicates one you already hold), so the authoritative result has to
   * come back from the database.
   */
  const runPoolAction = async (action: 'release' | 'claim' | 'withdraw') => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    const verb = action === 'release' ? '釋放' : action === 'claim' ? '認領' : '收回';
    if (action === 'release' && !confirm(`確定要釋放 ${ids.length} 筆到商機池？其他帳號將可認領。`)) return;

    setBatchBusy(true);
    try {
      const res = await fetch('/api/search/results/pool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ids }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

      const notes: string[] = [];
      if (action === 'release') notes.push(`已釋放 ${data.released} 筆`);
      if (action === 'withdraw') notes.push(`已收回 ${data.withdrawn} 筆`);
      if (action === 'claim') {
        notes.push(`已認領 ${data.claimed} 筆`);
        // Someone else claimed it between the list loading and the click.
        if (data.lost > 0) notes.push(`${data.lost} 筆已被其他人先行認領`);
        if (data.duplicates?.length > 0) {
          notes.push(
            `${data.duplicates.length} 筆略過（您的結果池已有同一家公司）：\n` +
            data.duplicates.map((d: any) => `　・${d.companyName}`).join('\n')
          );
        }
      }
      if (data.skipped > 0) notes.push(`${data.skipped} 筆略過`);

      setSelectedIds(new Set());
      alert(notes.join('\n'));

      // Re-read from the server rather than patching local state: rows can
      // leave the current view entirely (a released row leaves the opportunity
      // pool once claimed) and ownership has changed server-side.
      const url = poolView === 'opportunities'
        ? '/api/search/results?pool=opportunities'
        : (taskId ? `/api/search/results?taskId=${taskId}` : '/api/search/results');
      const fresh = await fetch(url).then(r => r.json()).catch(() => null);
      if (Array.isArray(fresh)) setResults(fresh.map(mapResult));
    } catch (e: any) {
      console.error(`${verb} failed:`, e);
      alert(`${verb}失敗：\n${e.message}`);
    } finally {
      setBatchBusy(false);
    }
  };

  // Persists the change first, then reflects it locally. The previous version
  // only mutated React state, so every batch action was silently lost on reload.
  const applyBatchUpdate = async (updates: { qualityStatus?: string; conversionStatus?: string }) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    setBatchBusy(true);
    try {
      const res = await fetch('/api/search/results/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, updates }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      setResults(prev =>
        prev.map(r => (selectedIds.has(r.id) ? { ...r, ...updates } : r))
      );
      setSelectedIds(new Set());
    } catch (e: any) {
      console.error('Batch update failed:', e);
      alert(`批次更新失敗（變更未儲存）：\n${e.message}`);
    } finally {
      setBatchBusy(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    if (key === 'qualityStatus') {
      setActiveQualityFilter(value);
    } else if (key === 'country') {
      setActiveCountry(value);
    }
  };

  const handleSortChange = (sort: string) => {
    if (sort === sortField) {
      setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(sort);
      setSortOrder('desc');
    }
  };

  const handleExport = () => {
    // Company names routinely contain commas and quotes; without escaping, every
    // column after such a value shifts and the export silently corrupts.
    const escape = (v: any) => {
      const s = String(v ?? '');
      return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const headers = ['公司名稱', '國家', '國別信心', '產業', '類型', '網站', 'Email', '電話', '品質分數', '狀態', '來源引擎', '來源數'];
    const csvRows = [headers.join(',')];
    filteredResults.forEach(r => {
      csvRows.push([
        r.name, r.country, CONFIDENCE_META[r.countryConfidence]?.label || r.countryConfidence,
        r.industry, r.companyType, r.website, r.email, r.phone,
        r.qualityScore, getStatusLabel(r.qualityStatus), r.provider, r.sourceCount,
      ].map(escape).join(','));
    });
    const blob = new Blob([`\uFEFF${csvRows.join('\n')}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `search_results_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const startEdit = (row: any) => {
    setEditingId(row.id);
    setEditValues({
      name: row.name || '',
      country: row.country || '',
      industry: row.industry || '',
      companyType: row.companyType || '',
      website: row.website || '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({});
  };

  const saveEdit = async (id: string) => {
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/search/results/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: editValues.name,
          country: editValues.country,
          industry: editValues.industry,
          companyType: editValues.companyType,
          website: editValues.website,
        }),
      });
      // The response status was previously never checked: a 401 or 500 still
      // updated local state and closed the editor, so the edit looked like it
      // had saved and only vanished on the next reload.
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      setResults(prev => prev.map(r => r.id === id ? {
        ...r,
        name: editValues.name,
        localName: editValues.name,
        country: editValues.country,
        industry: editValues.industry,
        companyType: editValues.companyType,
        website: editValues.website,
      } : r));
      setEditingId(null);
      setEditValues({});
    } catch (e: any) {
      console.error('Save failed:', e);
      // Keep the editor open so the user's typing isn't thrown away.
      alert(`儲存失敗（變更未寫入資料庫）：\n${e.message}`);
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className={styles.page}>
      <Breadcrumb items={[{ label: '搜尋', href: '/' }, { label: '結果池' }]} />
      <div className={styles.header}>
        <h1 className={styles.title}>
          {poolView === 'opportunities' ? '商機池' : '搜尋結果池'}
        </h1>
        <span className={styles.resultCount}>共 {filteredResults.length} 筆</span>
      </div>

      {/* Which pool is being viewed. "我的結果池" is this account's own results;
          "商機池" is the shared pool of results colleagues have released. */}
      <div className={styles.poolTabs}>
        <button
          className={`${styles.poolTab} ${poolView === 'mine' ? styles.poolTabActive : ''}`}
          onClick={() => { setPoolView('mine'); setSelectedIds(new Set()); }}
        >
          我的結果池
        </button>
        <button
          className={`${styles.poolTab} ${poolView === 'opportunities' ? styles.poolTabActive : ''}`}
          onClick={() => { setPoolView('opportunities'); setSelectedIds(new Set()); }}
        >
          商機池（可認領）
        </button>
        <span className={styles.poolHint}>
          {poolView === 'opportunities'
            ? '這裡是同事釋放出來、開放認領的商機。認領後會移入您的結果池。'
            : '只有您自己的搜尋結果。可選取後釋放到商機池供同事認領。'}
        </span>
      </div>

      {taskInfo && poolView === 'mine' && (
        <div className={styles.taskSummaryBar}>
          <div className={styles.taskInfo}>
            <span className={styles.taskName}>目標任務: {taskInfo.name || '未命名任務'}</span>
            <span className={styles.taskStatus}>
              {taskInfo.status === 'COMPLETED' ? '已完成' : taskInfo.status === 'RUNNING' ? '執行中' : taskInfo.status === 'FAILED' ? '失敗' : '排隊中'}
            </span>
          </div>
          <div className={styles.taskProgress}>
            <div className={styles.progressTrack}>
              <div className={styles.progressBar} style={{ width: `${taskInfo.status === 'COMPLETED' ? 100 : Math.round((filteredResults.length / (taskInfo.targetCount || 50)) * 100)}%` }} />
            </div>
            <span className={styles.progressText}>
              {taskInfo.status === 'COMPLETED' ? '100%' : `${Math.round((filteredResults.length / (taskInfo.targetCount || 50)) * 100)}%`} ({filteredResults.length}/{taskInfo.targetCount || 50})
            </span>
          </div>
        </div>
      )}

      <ResultsToolbar
        onSearch={(term) => setSearchTerm(term)}
        onFilterChange={handleFilterChange}
        onSortChange={handleSortChange}
        onViewChange={setViewMode}
        onExport={handleExport}
        viewMode={viewMode}
        countryOptions={countryOptions}
      />

      {/* Country-verification filter. Only meaningful once a run has produced
          results whose country could not be confirmed from the domain. */}
      {lowConfidenceCount > 0 && (
        <div className={styles.confidenceBar}>
          <span className={styles.confidenceHint}>
            ⚠️ 有 <strong>{lowConfidenceCount}</strong> 筆結果使用通用網域（.com/.net/.org），國別無法由網域確認
          </span>
          <div className={styles.confidenceChips}>
            {[
              { id: 'ALL', label: '全部' },
              { id: 'high', label: '已驗證國別' },
              { id: 'low', label: '未驗證國別' },
            ].map(f => (
              <button
                key={f.id}
                className={`${styles.confidenceChip} ${activeConfidence === f.id ? styles.confidenceChipActive : ''}`}
                onClick={() => setActiveConfidence(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {viewMode === 'table' ? (
      <div className={styles.tableContainer}>
        {loading ? (
          <div className={styles.loading}>載入中...</div>
        ) : filteredResults.length === 0 ? (
          <div className={styles.emptyState}>
            {/* An empty opportunity pool is the normal state, not a filtering
                mistake — offering "clear filters" there just misleads. */}
            {poolView === 'opportunities' && results.length === 0 ? (
              <p>目前沒有開放認領的商機。同事釋放資料後會顯示在這裡。</p>
            ) : (
              <>
                <p>沒有符合條件的結果</p>
                <button onClick={() => { setActiveQualityFilter('ALL'); setActiveCountry('ALL'); setSearchTerm(''); }}>
                  清除篩選條件
                </button>
              </>
            )}
          </div>
        ) : (
          <table className={styles.table}>
            {/* Fixed column widths. With the default auto layout plus
                white-space:nowrap, a page of long company names (article
                titles from Tavily run to 30+ characters) stretched the name
                column until 狀態 and 操作 were pushed off the right edge —
                so the same table appeared to have different columns on
                different pages. */}
            <colgroup>
              <col style={{ width: 44 }} />
              <col />
              <col style={{ width: 140 }} />
              <col style={{ width: 110 }} />
              <col style={{ width: 110 }} />
              <col style={{ width: 120 }} />
              <col style={{ width: 130 }} />
              <col style={{ width: 90 }} />
              {/* Ownership column: shows the releaser in the shared pool, and
                  the release/claim state in the account's own pool. */}
              <col style={{ width: 120 }} />
              <col style={{ width: 92 }} />
            </colgroup>
            <thead>
              <tr>
                <th className={styles.th}>
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={selectedIds.size === filteredResults.length && filteredResults.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className={styles.th}>公司名稱</th>
                <th className={styles.th}>國家</th>
                <th className={styles.th}>產業</th>
                <th className={styles.th}>類型</th>
                <th className={styles.th}>來源引擎</th>
                <th className={styles.th}>品質分數</th>
                <th className={styles.th}>狀態</th>
                <th className={styles.th}>{poolView === 'opportunities' ? '釋放者' : '歸屬'}</th>
                <th className={styles.th}>操作</th>
              </tr>
            </thead>
            <tbody>
              {paginatedResults.map(row => (
                <tr
                  key={row.id}
                  className={`${styles.tr} ${selectedIds.has(row.id) ? styles.trSelected : ''}`}
                >
                  <td className={styles.td}>
                    <input
                      type="checkbox"
                      className={styles.checkbox}
                      checked={selectedIds.has(row.id)}
                      onChange={() => toggleSelect(row.id)}
                    />
                  </td>
                  <td className={styles.td}>
                    {editingId === row.id ? (
                      <input
                        style={{ width: '100%', padding: '4px 8px', borderRadius: 6, border: '1px solid var(--color-border)', background: 'var(--color-surface-alt)', color: 'var(--color-text)', fontSize: '0.85rem' }}
                        value={editValues.name || ''}
                        onChange={e => setEditValues(v => ({ ...v, name: e.target.value }))}
                      />
                    ) : (
                      <>
                        {/* title= keeps the full name reachable now that the
                            cell truncates instead of stretching the table. */}
                        <div className={styles.companyName} title={row.name}>
                          {row.website ? (
                            <a href={row.website} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                              {show(row.name, '未知')}
                            </a>
                          ) : show(row.name, '未知')}
                        </div>
                        <div className={styles.companyLocalName} title={row.website || row.localName}>
                          {row.website ? (
                            <a href={row.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontSize: '0.78rem' }}>
                              {row.localName} ↗
                            </a>
                          ) : row.localName}
                        </div>
                      </>
                    )}
                  </td>
                  <td className={styles.td}>
                    {editingId === row.id ? (
                      // width:100% rather than a fixed 60px: the columns are
                      // fixed-width now, so a hardcoded input width just left
                      // most of the cell unusable.
                      <input style={{ width: '100%', padding: '4px 6px', borderRadius: 6, border: '1px solid var(--color-border)', background: 'var(--color-surface-alt)', color: 'var(--color-text)', fontSize: '0.82rem' }} value={editValues.country || ''} onChange={e => setEditValues(v => ({ ...v, country: e.target.value }))} />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>{show(row.country, '未確認')}</span>
                        {row.countryConfidence !== 'unscoped' && (
                          <span
                            title={CONFIDENCE_META[row.countryConfidence]?.title}
                            style={{
                              fontSize: '0.68rem',
                              padding: '1px 6px',
                              borderRadius: 10,
                              whiteSpace: 'nowrap',
                              color: CONFIDENCE_META[row.countryConfidence]?.color,
                              border: `1px solid ${CONFIDENCE_META[row.countryConfidence]?.color}`,
                            }}
                          >
                            {CONFIDENCE_META[row.countryConfidence]?.label}
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className={styles.td}>
                    {editingId === row.id ? (
                      <input style={{ width: '100%', padding: '4px 6px', borderRadius: 6, border: '1px solid var(--color-border)', background: 'var(--color-surface-alt)', color: 'var(--color-text)', fontSize: '0.82rem' }} value={editValues.industry || ''} onChange={e => setEditValues(v => ({ ...v, industry: e.target.value }))} />
                    ) : show(row.industry, '未知產業')}
                  </td>
                  <td className={styles.td}>
                    {editingId === row.id ? (
                      <input style={{ width: '100%', padding: '4px 6px', borderRadius: 6, border: '1px solid var(--color-border)', background: 'var(--color-surface-alt)', color: 'var(--color-text)', fontSize: '0.82rem' }} value={editValues.companyType || ''} onChange={e => setEditValues(v => ({ ...v, companyType: e.target.value }))} />
                    ) : (
                      <span className={`${styles.badge} ${styles.badgeMuted}`}>{show(row.companyType, '未知類型')}</span>
                    )}
                  </td>
                  <td className={styles.td}>
                    <span className={`${styles.badge} ${styles.badgeMuted}`} style={{ fontSize: '0.72rem' }}>{show(row.provider, '未知')}</span>
                  </td>
                  <td className={styles.td}>
                    <div className={styles.qualityBar}>
                      <div
                        className={styles.qualityFill}
                        style={{
                          width: `${row.qualityScore}%`,
                          backgroundColor: getQualityColor(row.qualityScore)
                        }}
                      />
                    </div>
                    <span className={styles.qualityScore}>{row.qualityScore}</span>
                  </td>
                  <td className={styles.td}>
                    <span className={`${styles.badge} ${getStatusBadgeClass(row.qualityStatus)}`}>
                      {getStatusLabel(row.qualityStatus)}
                    </span>
                  </td>
                  <td className={styles.td}>
                    <OwnershipCell row={row} poolView={poolView} myId={me?.id} />
                  </td>
                  <td className={styles.td}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {editingId === row.id ? (
                        <>
                          <button className={styles.actionBtn} onClick={() => saveEdit(row.id)} disabled={savingEdit} title="儲存"><Save size={16} style={{ color: 'var(--color-success)' }} /></button>
                          <button className={styles.actionBtn} onClick={cancelEdit} disabled={savingEdit} title="取消"><X size={16} style={{ color: '#ef4444' }} /></button>
                        </>
                      ) : (
                        <>
                          {/* Editing is owner-only server-side; hiding the
                              button in the shared pool avoids offering an
                              action that would just 403. */}
                          {row.owner?.id === me?.id && (
                            <button className={styles.actionBtn} onClick={() => startEdit(row)} title="編輯"><Edit2 size={16} /></button>
                          )}
                          <button className={styles.actionBtn} onClick={() => setDetailData(row)} title="檢視"><Eye size={16} /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      ) : (
      <div className={styles.cardGrid}>
        {loading ? (
          <div className={styles.loading}>載入中...</div>
        ) : filteredResults.length === 0 ? (
          <div className={styles.emptyState}>
            <p>沒有符合條件的結果</p>
            <button onClick={() => { setActiveQualityFilter('ALL'); setActiveCountry('ALL'); setSearchTerm(''); }}>清除篩選條件</button>
          </div>
        ) : paginatedResults.map(row => (
          <div key={row.id} className={styles.resultCard} onClick={() => setDetailData(row)}>
            <div className={styles.cardTop}>
              <div>
                <div className={styles.companyName}>{show(row.name, '未知')}</div>
                <div className={styles.companyLocalName}>{row.localName}</div>
              </div>
              <span className={`${styles.badge} ${getStatusBadgeClass(row.qualityStatus)}`}>
                {getStatusLabel(row.qualityStatus)}
              </span>
            </div>
            <div className={styles.cardMeta}>
              <span>{show(row.country, '未確認')}</span>
              <span>{show(row.industry, '未知產業')}</span>
              <span>{show(row.companyType, '未知類型')}</span>
            </div>
            <div className={styles.cardBottom}>
              <div className={styles.qualityBar} style={{ flex: 1 }}>
                <div className={styles.qualityFill} style={{ width: `${row.qualityScore}%`, backgroundColor: getQualityColor(row.qualityScore) }} />
              </div>
              <span className={styles.qualityScore}>{row.qualityScore}</span>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Pagination */}
      {filteredResults.length > 0 && (
        <div className={styles.pagination}>
          <div className={styles.paginationInfo}>
            顯示 {Math.min((currentPage - 1) * pageSize + 1, filteredResults.length)}-{Math.min(currentPage * pageSize, filteredResults.length)} / 共 {filteredResults.length} 筆
          </div>
          <div className={styles.paginationControls}>
            <select
              className={styles.pageSizeSelect}
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
            >
              <option value={20}>20 筆/頁</option>
              <option value={50}>50 筆/頁</option>
              <option value={100}>100 筆/頁</option>
            </select>
            <button className={styles.pageBtn} disabled={currentPage <= 1} onClick={() => setCurrentPage(1)}>
              <ChevronsLeft size={16} />
            </button>
            <button className={styles.pageBtn} disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)}>
              <ChevronLeft size={16} />
            </button>
            <span className={styles.pageIndicator}>{currentPage} / {totalPages}</span>
            <button className={styles.pageBtn} disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}>
              <ChevronRight size={16} />
            </button>
            <button className={styles.pageBtn} disabled={currentPage >= totalPages} onClick={() => setCurrentPage(totalPages)}>
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      )}

      <BatchActionBar
        selectedCount={selectedIds.size}
        busy={batchBusy}
        mode={poolView}
        onMarkValid={() => applyBatchUpdate({ qualityStatus: 'VALID' })}
        onMarkInvalid={() => applyBatchUpdate({ qualityStatus: 'INVALID' })}
        onFavorite={() => applyBatchUpdate({ conversionStatus: 'FAVORITED' })}
        onRelease={() => runPoolAction('release')}
        onWithdraw={() => runPoolAction('withdraw')}
        onClaim={() => runPoolAction('claim')}
        onClearSelection={() => setSelectedIds(new Set())}
      />

      <ResultDetailDrawer
        data={detailData}
        isOpen={!!detailData}
        onClose={() => setDetailData(null)}
        onUpdated={(updated) => {
          setResults(prev => prev.map(r => r.id === updated.id ? { ...r, ...updated } : r));
          setDetailData(updated);
        }}
      />
    </div>
  );
}

export default function SearchResultsPage() {
  return (
    <Suspense fallback={<div className={styles.page}>Loading...</div>}>
      <SearchResultsContent />
    </Suspense>
  );
}
