'use client';

import React, { useState, useEffect } from 'react';
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
import { SkeletonCard } from '@/components/ui/Skeleton';
import styles from './page.module.css';

interface KnowledgeItem {
  id: string;
  title: string;
  type: string;
  content: string;
  source: string;
  version: string;
  visibility: string;
  status: string;
  createdBy: { name: string };
  createdAt: string;
  updatedAt: string;
}

const TYPE_CONFIG: Record<string, { icon: any, color: string, label: string }> = {
  document: { icon: FileText, color: 'blue', label: '文件' },
  product: { icon: Package, color: 'purple', label: '產品資料' },
  sop: { icon: ClipboardList, color: 'green', label: 'SOP文件' },
  report: { icon: BarChart2, color: 'orange', label: '市場報告' },
  template: { icon: FileCode, color: 'teal', label: '範本' },
  default: { icon: FileText, color: 'gray', label: '未分類' }
};

const CATEGORIES = ['全部', '文件', '產品資料', 'SOP文件', '市場報告', '範本'];

export default function KnowledgePage() {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [activeCategory, setActiveCategory] = useState('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const [knowledge, setKnowledge] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKnowledge = async () => {
      try {
        const res = await fetch('/api/knowledge');
        if (res.ok) {
          const data = await res.json();
          setKnowledge(data);
        }
      } catch (error) {
        console.error('Failed to fetch knowledge:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchKnowledge();
  }, []);

  const filteredItems = knowledge.filter(item => {
    const config = TYPE_CONFIG[item.type?.toLowerCase()] || TYPE_CONFIG.default;
    const matchesCategory = activeCategory === '全部' || config.label === activeCategory;
    const matchesSearch = item.title?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) return <div className={styles.container}><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>;

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
            placeholder="搜尋知識..." 
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className={view === 'grid' ? styles.grid : styles.list}>
        {filteredItems.map(item => {
          const config = TYPE_CONFIG[item.type?.toLowerCase()] || TYPE_CONFIG.default;
          const Icon = config.icon;

          return (
            <div key={item.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={`${styles.typeIcon} ${styles[`icon${config.color}`]}`}>
                  <Icon size={20} />
                </div>
                <span className={styles.versionBadge}>{item.version || 'v1.0'}</span>
              </div>
              
              <h3 className={styles.cardTitle}>{item.title}</h3>
              
              <div className={styles.tags}>
                <span className={styles.tag}>{config.label}</span>
                {item.visibility && <span className={styles.tag}>{item.visibility}</span>}
              </div>
              
              <div className={styles.cardFooter}>
                <span className={styles.author}>{item.createdBy?.name || '-'}</span>
                <span className={styles.date}>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'}</span>
              </div>
            </div>
          );
        })}
      </div>

      {filteredItems.length > 0 && (
        <div className={styles.pagination}>
          <button className={styles.pageBtn} disabled onClick={() => alert('分頁功能開發中')}><ChevronLeft size={18} /></button>
          <button className={`${styles.pageBtn} ${styles.pageActive}`} onClick={() => alert('分頁功能開發中')}>1</button>
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
