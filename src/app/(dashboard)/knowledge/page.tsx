'use client';

import React, { useState } from 'react';
import { 
  LayoutGrid, 
  List, 
  Plus, 
  Search,
  FileText,
  Package,
  ClipboardList,
  BarChart2,
  FileCode,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import styles from './page.module.css';

type KnowledgeType = 'document' | 'product' | 'sop' | 'report' | 'template';

interface KnowledgeItem {
  id: string;
  title: string;
  type: KnowledgeType;
  tags: string[];
  author: string;
  date: string;
  version: string;
}

const MOCK_KNOWLEDGE: KnowledgeItem[] = [
  { id: '1', title: '公司食品包裝機產品目錄', type: 'product', tags: ['產品', '型錄', '包裝機'], author: '行銷部', date: '2024-07-28', version: 'v2.1' },
  { id: '2', title: '客戶拜訪SOP', type: 'sop', tags: ['業務', '流程', '指南'], author: '業務部', date: '2024-06-15', version: 'v1.4' },
  { id: '3', title: '2024 Q2東南亞市場分析', type: 'report', tags: ['市場研究', '東南亞', 'Q2'], author: '分析團隊', date: '2024-07-10', version: 'v1.0' },
  { id: '4', title: '標準報價單範本', type: 'template', tags: ['業務', '範本', '報價'], author: '財務部', date: '2024-01-05', version: 'v3.0' },
  { id: '5', title: 'ISO 9001 認證流程指南', type: 'document', tags: ['ISO', '品管', '流程'], author: '品保部', date: '2024-05-20', version: 'v1.2' },
  { id: '6', title: '競品分析-日本市場', type: 'report', tags: ['競品', '日本', '研究'], author: '分析團隊', date: '2024-07-25', version: 'v1.1' },
  { id: '7', title: '新進人員培訓手冊', type: 'document', tags: ['HR', '培訓', '新人'], author: '人資部', date: '2024-02-15', version: 'v2.5' },
  { id: '8', title: '智慧型包裝機操作手冊', type: 'product', tags: ['產品', '手冊', '操作'], author: '研發部', date: '2024-04-30', version: 'v1.0' },
  { id: '9', title: '客訴處理標準作業流程', type: 'sop', tags: ['客服', 'SOP', '客訴'], author: '客服部', date: '2023-11-12', version: 'v2.0' },
  { id: '10', title: '年度行銷企劃範本', type: 'template', tags: ['行銷', '企劃', '範本'], author: '行銷部', date: '2023-12-01', version: 'v1.0' },
  { id: '11', title: '歐洲區環保法規更新報告', type: 'report', tags: ['法規', '歐洲', '環保'], author: '法務部', date: '2024-07-18', version: 'v1.0' },
  { id: '12', title: '經銷商合約標準版', type: 'document', tags: ['法務', '合約', '經銷'], author: '法務部', date: '2024-03-22', version: 'v4.1' },
];

const TYPE_CONFIG = {
  document: { icon: FileText, color: 'blue', label: '文件' },
  product: { icon: Package, color: 'purple', label: '產品資料' },
  sop: { icon: ClipboardList, color: 'green', label: 'SOP文件' },
  report: { icon: BarChart2, color: 'orange', label: '市場報告' },
  template: { icon: FileCode, color: 'teal', label: '範本' },
};

const CATEGORIES = ['全部', '產品資料', 'SOP文件', '市場報告', '範本'];

export default function KnowledgePage() {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [activeCategory, setActiveCategory] = useState('全部');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = MOCK_KNOWLEDGE.filter(item => {
    const matchesCategory = activeCategory === '全部' || TYPE_CONFIG[item.type].label === activeCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <h1 className={styles.title}>知識中心</h1>
          <div className={styles.viewToggle}>
            <button 
              className={`${styles.toggleBtn} ${view === 'grid' ? styles.active : ''}`}
              onClick={() => setView('grid')}
            >
              <LayoutGrid size={18} />
              卡片
            </button>
            <button 
              className={`${styles.toggleBtn} ${view === 'list' ? styles.active : ''}`}
              onClick={() => setView('list')}
            >
              <List size={18} />
              列表
            </button>
          </div>
        </div>
        <button className={styles.addButton} onClick={() => alert('新增知識功能開發中')}>
          <Plus size={18} />
          新增知識
        </button>
      </header>

      <div className={styles.controls}>
        <div className={styles.tabs}>
          {CATEGORIES.map(cat => (
            <button 
              key={cat}
              className={`${styles.tab} ${activeCategory === cat ? styles.tabActive : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
        
        <div className={styles.searchBox}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="搜尋知識、文件或標籤..." 
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className={view === 'grid' ? styles.grid : styles.list}>
        {filteredItems.map(item => {
          const config = TYPE_CONFIG[item.type];
          const Icon = config.icon;

          return (
            <div key={item.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={`${styles.typeIcon} ${styles[`icon${config.color}`]}`}>
                  <Icon size={20} />
                </div>
                <span className={styles.versionBadge}>{item.version}</span>
              </div>
              
              <h3 className={styles.cardTitle}>{item.title}</h3>
              
              <div className={styles.tags}>
                {item.tags.map(tag => (
                  <span key={tag} className={styles.tag}>{tag}</span>
                ))}
              </div>
              
              <div className={styles.cardFooter}>
                <span className={styles.author}>{item.author}</span>
                <span className={styles.date}>{item.date}</span>
              </div>
            </div>
          );
        })}
      </div>

      {filteredItems.length > 0 && (
        <div className={styles.pagination}>
          <button className={styles.pageBtn} disabled onClick={() => alert('分頁功能開發中')}><ChevronLeft size={18} /></button>
          <button className={`${styles.pageBtn} ${styles.pageActive}`} onClick={() => alert('分頁功能開發中')}>1</button>
          <button className={styles.pageBtn} onClick={() => alert('分頁功能開發中')}>2</button>
          <button className={styles.pageBtn} onClick={() => alert('分頁功能開發中')}>3</button>
          <span className={styles.pageEllipsis}>...</span>
          <button className={styles.pageBtn} onClick={() => alert('分頁功能開發中')}><ChevronRight size={18} /></button>
        </div>
      )}
      
      {filteredItems.length === 0 && (
        <div className={styles.emptyState}>
          <p>找不到符合條件的知識內容</p>
        </div>
      )}
    </div>
  );
}
