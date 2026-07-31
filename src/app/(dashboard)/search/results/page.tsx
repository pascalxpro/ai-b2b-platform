'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Eye } from 'lucide-react';
import ResultsToolbar from '@/components/search/ResultsToolbar';
import BatchActionBar from '@/components/search/BatchActionBar';
import ResultDetailDrawer from '@/components/search/ResultDetailDrawer';
import Breadcrumb from '@/components/ui/Breadcrumb';
import styles from './page.module.css';

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const taskId = searchParams.get('taskId');

  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detailData, setDetailData] = useState<any | null>(null);
  const [taskInfo, setTaskInfo] = useState<any | null>(null);

  // Filter & Sort state
  const [searchTerm, setSearchTerm] = useState('');
  const [activeQualityFilter, setActiveQualityFilter] = useState<string>('ALL');
  const [activeCountry, setActiveCountry] = useState<string>('ALL');
  const [sortField, setSortField] = useState<string>('qualityScore');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');

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

    // Fetch results
    const url = taskId ? `/api/search/results?taskId=${taskId}` : '/api/search/results';
    fetch(url)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setResults(data.map((d: any) => {
            let scoreObj = d.scoreJson;
            if (typeof scoreObj === 'string') {
              try { scoreObj = JSON.parse(scoreObj); } catch (e) { scoreObj = {}; }
            }
            return {
              id: d.id,
              name: d.companyName || d.name || '未知',
              localName: d.companyName || '',
              country: d.country || '未知',
              industry: scoreObj?.industry || '未知產業',
              companyType: scoreObj?.companyType || '未知類型',
              employeeCount: scoreObj?.employeeCount || '',
              revenue: scoreObj?.revenue || '',
              qualityScore: scoreObj?.totalScore || 75,
              qualityStatus: d.qualityStatus || 'NEW',
              conversionStatus: d.conversionStatus || 'NONE',
              sourceCount: 1,
              website: d.website || '',
              email: scoreObj?.email || '',
              phone: scoreObj?.phone || '',
              linkedin: scoreObj?.linkedin || '',
              notes: scoreObj?.notes || '',
              sources: d.sources || [],
              provider: scoreObj?.provider || '未知',
              createdAt: d.createdAt
            };
          }));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [taskId]);

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
  }, [results, activeQualityFilter, activeCountry, searchTerm, sortField, sortOrder]);

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

  const handleBatchStatus = (newStatus: string) => {
    setResults(prev =>
      prev.map(r =>
        selectedIds.has(r.id) ? { ...r, qualityStatus: newStatus } : r
      )
    );
    setSelectedIds(new Set());
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
    const headers = ['公司名稱', '本地名稱', '國家', '產業', '類型', '品質分數', '狀態', '來源數'];
    const csvRows = [headers.join(',')];
    filteredResults.forEach(r => {
      csvRows.push([r.name, r.localName, r.country, r.industry, r.companyType, r.qualityScore, r.qualityStatus, r.sourceCount].join(','));
    });
    const blob = new Blob([`\uFEFF${csvRows.join('\n')}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `search_results_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.page}>
      <Breadcrumb items={[{ label: '搜尋', href: '/' }, { label: '結果池' }]} />
      <div className={styles.header}>
        <h1 className={styles.title}>搜尋結果池</h1>
        <span className={styles.resultCount}>共 {filteredResults.length} 筆</span>
      </div>

      {taskInfo && (
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
      />

      {viewMode === 'table' ? (
      <div className={styles.tableContainer}>
        {loading ? (
          <div className={styles.loading}>載入中...</div>
        ) : filteredResults.length === 0 ? (
          <div className={styles.emptyState}>
            <p>沒有符合條件的結果</p>
            <button onClick={() => { setActiveQualityFilter('ALL'); setActiveCountry('ALL'); setSearchTerm(''); }}>
              清除篩選條件
            </button>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th} style={{ width: 40 }}>
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
                <th className={styles.th}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredResults.map(row => (
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
                    <div className={styles.companyName}>
                      {row.website ? (
                        <a href={row.website} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                          {row.name}
                        </a>
                      ) : row.name}
                    </div>
                    <div className={styles.companyLocalName}>
                      {row.website ? (
                        <a href={row.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontSize: '0.78rem' }}>
                          {row.localName} ↗
                        </a>
                      ) : row.localName}
                    </div>
                  </td>
                  <td className={styles.td}>{row.country}</td>
                  <td className={styles.td}>{row.industry}</td>
                  <td className={styles.td}>
                    <span className={`${styles.badge} ${styles.badgeMuted}`}>{row.companyType}</span>
                  </td>
                  <td className={styles.td}>
                    <span className={`${styles.badge} ${styles.badgeMuted}`} style={{ fontSize: '0.72rem' }}>{row.provider}</span>
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
                    <button
                      className={styles.actionBtn}
                      onClick={() => setDetailData(row)}
                    >
                      <Eye size={18} />
                    </button>
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
        ) : filteredResults.map(row => (
          <div key={row.id} className={styles.resultCard} onClick={() => setDetailData(row)}>
            <div className={styles.cardTop}>
              <div>
                <div className={styles.companyName}>{row.name}</div>
                <div className={styles.companyLocalName}>{row.localName}</div>
              </div>
              <span className={`${styles.badge} ${getStatusBadgeClass(row.qualityStatus)}`}>
                {getStatusLabel(row.qualityStatus)}
              </span>
            </div>
            <div className={styles.cardMeta}>
              <span>{row.country}</span>
              <span>{row.industry}</span>
              <span>{row.companyType}</span>
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

      <BatchActionBar
        selectedCount={selectedIds.size}
        onMarkValid={() => handleBatchStatus('VALID')}
        onMarkInvalid={() => handleBatchStatus('INVALID')}
        onFavorite={() => handleBatchStatus('VALID')}
        onAssign={() => setSelectedIds(new Set())}
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
