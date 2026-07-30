'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Eye } from 'lucide-react';
import ResultsToolbar from '@/components/search/ResultsToolbar';
import BatchActionBar from '@/components/search/BatchActionBar';
import ResultDetailDrawer from '@/components/search/ResultDetailDrawer';
import { Download, Filter, Search, Plus, CheckCircle, AlertCircle, XCircle, MoreVertical, Building2, Globe2, Tag, Loader2, Play } from 'lucide-react';
import Breadcrumb from '@/components/ui/Breadcrumb';
import styles from './page.module.css';

// Mock Data - 30 results
const MOCK_RESULTS = Array.from({ length: 30 }).map((_, i) => {
  const countries = ['台灣', '日本', '美國', '德國', '越南', '韓國', '泰國', '新加坡'];
  const industries = ['半導體', '食品包裝', '電子零件', '汽車零件', '機械設備', '化學材料'];
  const types = ['製造商', '代理商', '經銷商', '進口商'];
  const statuses = ['NEW', 'VALID', 'PENDING_REVIEW', 'DUPLICATE', 'INVALID'] as const;
  const names = [
    'TechCorp Innovations', 'NexGen Solutions', 'GlobalParts Ltd', 'Yamada Manufacturing',
    'Pacific Trading Co', 'EuroPack GmbH', 'AsiaLink Corp', 'Dragon Electronics',
    'SunRise Industries', 'Apex Precision', 'KingTech Systems', 'FuturePak Inc',
    'MegaTrade Asia', 'StarChem Corp', 'OceanBridge Ltd', 'PrimeMotion K.K.',
    'Alliance Components', 'BrightWave Tech', 'CrystalPack Co', 'DeltaForce Mfg',
    'EagleTech Systems', 'FairPoint Trading', 'GoldStar Precision', 'HarmonyPak Ltd',
    'IronBridge Corp', 'JetStream Solutions', 'KoreaLink Co', 'LionGate Industries',
    'MetaPack Trading', 'NovaTech Asia'
  ];
  const localNames = [
    '科技創新有限公司', '新世代方案公司', '環球零件有限公司', '山田製造株式会社',
    '太平洋貿易有限公司', 'EuroPack 有限公司', '亞洲連結公司', '龍騰電子公司',
    '旭日工業', '頂峰精密', '金科技系統', '未來包裝公司',
    '大貿亞洲', '星辰化學', '海橋有限公司', 'PrimeMotion 株式会社',
    '聯盟零件', '明波科技', '水晶包裝', '三角力量製造',
    '鷹科技系統', '公正貿易', '金星精密', '和諧包裝',
    '鐵橋公司', '噴流方案', '韓連公司', '獅門工業',
    'MetaPack 貿易', '新星科技亞洲'
  ];

  return {
    id: `res-${i}`,
    name: names[i % names.length],
    localName: localNames[i % localNames.length],
    country: countries[i % countries.length],
    industry: industries[i % industries.length],
    companyType: types[i % types.length],
    employeeCount: `${(i + 1) * 50}-${(i + 2) * 100}`,
    revenue: `$${(i + 1) * 5}M`,
    website: `https://${names[i % names.length].toLowerCase().replace(/\s+/g, '')}.com`,
    email: `contact@${names[i % names.length].toLowerCase().replace(/\s+/g, '')}.com`,
    phone: `+886 2 ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`,
    linkedin: `https://linkedin.com/company/${names[i % names.length].toLowerCase().replace(/\s+/g, '-')}`,
    sourceCount: Math.floor(Math.random() * 5) + 1,
    qualityScore: Math.floor(Math.random() * 40) + 60,
    qualityStatus: statuses[i % statuses.length],
    conversionStatus: 'NONE',
    sources: [
      { provider: 'Web Search', url: '#', confidence: 85 + Math.floor(Math.random() * 15) },
      { provider: 'LinkedIn', url: '#', confidence: 80 + Math.floor(Math.random() * 20) }
    ]
  };
});

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const taskId = searchParams.get('taskId');

  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detailData, setDetailData] = useState<any | null>(null);

  // Filter & Sort state
  const [searchTerm, setSearchTerm] = useState('');
  const [activeQualityFilter, setActiveQualityFilter] = useState<string>('ALL');
  const [activeCountry, setActiveCountry] = useState<string>('ALL');
  const [sortField, setSortField] = useState<string>('qualityScore');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');

  useEffect(() => {
    const timer = setTimeout(() => {
      setResults(MOCK_RESULTS);
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
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

  // Handler: update quality status for selected items
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

      {taskId && (
        <div className={styles.taskSummaryBar}>
          <div className={styles.taskInfo}>
            <span className={styles.taskName}>目標任務: 日本食品包裝機械</span>
            <span className={styles.taskStatus}>執行中</span>
          </div>
          <div className={styles.taskProgress}>
            <div className={styles.progressTrack}>
              <div className={styles.progressBar} style={{ width: '65%' }} />
            </div>
            <span className={styles.progressText}>65% (32/50)</span>
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
                <th className={styles.th}>來源數</th>
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
                    <div className={styles.companyName}>{row.name}</div>
                    <div className={styles.companyLocalName}>{row.localName}</div>
                  </td>
                  <td className={styles.td}>{row.country}</td>
                  <td className={styles.td}>{row.industry}</td>
                  <td className={styles.td}>
                    <span className={`${styles.badge} ${styles.badgeMuted}`}>{row.companyType}</span>
                  </td>
                  <td className={styles.td}>{row.sourceCount}</td>
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
