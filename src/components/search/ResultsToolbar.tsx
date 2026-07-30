'use client';

import React, { useState } from 'react';
import { Search, Download, List, LayoutGrid } from 'lucide-react';
import styles from './ResultsToolbar.module.css';

interface ResultsToolbarProps {
  onSearch: (term: string) => void;
  onFilterChange: (type: string, value: string) => void;
  onSortChange: (sort: string) => void;
  onViewChange?: (view: 'table' | 'card') => void;
  onExport?: () => void;
  viewMode?: 'table' | 'card';
}

export default function ResultsToolbar({
  onSearch,
  onFilterChange,
  onSortChange,
  onViewChange,
  onExport,
  viewMode: externalViewMode,
}: ResultsToolbarProps) {
  const [activeQuality, setActiveQuality] = useState('ALL');
  const [internalViewMode, setInternalViewMode] = useState<'table'|'card'>('table');
  const [searchTerm, setSearchTerm] = useState('');

  const viewMode = externalViewMode ?? internalViewMode;

  const qualityFilters = [
    { id: 'ALL', label: '全部' },
    { id: 'NEW', label: '新進' },
    { id: 'VALID', label: '有效' },
    { id: 'PENDING_REVIEW', label: '待確認' },
    { id: 'DUPLICATE', label: '重複' },
    { id: 'INVALID', label: '無效' }
  ];

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    onSearch(e.target.value);
  };

  const handleQualityChange = (id: string) => {
    setActiveQuality(id);
    onFilterChange('qualityStatus', id);
  };

  const handleViewChange = (view: 'table' | 'card') => {
    setInternalViewMode(view);
    onViewChange?.(view);
  };

  const handleExport = () => {
    onExport?.();
  };

  return (
    <div className={styles.toolbar}>
      <div className={styles.left}>
        <div className={styles.filterChips}>
          {qualityFilters.map(filter => (
            <button
              key={filter.id}
              className={`${styles.chip} ${activeQuality === filter.id ? styles.active : ''}`}
              onClick={() => handleQualityChange(filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>
        
        <select 
          className={styles.select}
          onChange={(e) => onFilterChange('country', e.target.value || 'ALL')}
        >
          <option value="">所有國家</option>
          <option value="台灣">台灣</option>
          <option value="日本">日本</option>
          <option value="美國">美國</option>
          <option value="德國">德國</option>
          <option value="越南">越南</option>
          <option value="韓國">韓國</option>
          <option value="泰國">泰國</option>
          <option value="新加坡">新加坡</option>
        </select>
      </div>

      <div className={styles.center}>
        <div className={styles.searchWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="在結果中搜尋..."
            className={styles.searchInput}
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
      </div>

      <div className={styles.right}>
        <select 
          className={styles.select}
          onChange={(e) => onSortChange(e.target.value)}
        >
          <option value="qualityScore">品質分數 (高到低)</option>
          <option value="name">公司名稱 (A-Z)</option>
          <option value="sourceCount">來源數 (多到少)</option>
        </select>

        <div className={styles.viewToggle}>
          <button 
            className={`${styles.toggleBtn} ${viewMode === 'table' ? styles.active : ''}`}
            onClick={() => handleViewChange('table')}
            title="表格檢視"
          >
            <List size={18} />
          </button>
          <button 
            className={`${styles.toggleBtn} ${viewMode === 'card' ? styles.active : ''}`}
            onClick={() => handleViewChange('card')}
            title="卡片檢視"
          >
            <LayoutGrid size={18} />
          </button>
        </div>

        <button className={styles.exportBtn} onClick={handleExport}>
          <Download size={16} />
          匯出
        </button>
      </div>
    </div>
  );
}
