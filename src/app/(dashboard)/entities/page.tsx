'use client';

import { useState, useEffect } from 'react';
import { Plus, LayoutGrid, List, Search, Filter, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { SkeletonCard } from '@/components/ui/Skeleton';
import styles from './page.module.css';

interface Entity {
  id: string;
  name: string;
  country: string;
  city: string;
  industry: string;
  website: string;
  email: string;
  status: string;
  leadScore: {
    fit: number;
    intent: number;
    value: number;
    confidence: number;
  };
}

export default function EntitiesPage() {
  const [view, setView] = useState<'table' | 'card'>('table');
  const [activeFilter, setActiveFilter] = useState('全部');
  const [customers, setCustomers] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEntities = async () => {
      try {
        const res = await fetch('/api/entities');
        if (res.ok) {
          const data = await res.json();
          setCustomers(data);
        }
      } catch (error) {
        console.error('Failed to fetch entities:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEntities();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case '潛在客戶': return styles.statusInfo;
      case '活躍客戶': return styles.statusSuccess;
      case '成交客戶': return styles.statusPrimary;
      case '流失客戶': return styles.statusDanger;
      default: return '';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'var(--color-success)';
    if (score >= 50) return 'var(--color-warning)';
    return 'var(--color-danger)';
  };

  if (loading) return <div className={styles.container}><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <Breadcrumb items={[{ label: '客戶與商機' }]} />
          <h1 className={styles.title}>客戶與商機</h1>
        </div>
        <div className={styles.headerActions}>
          <div className={`glass-1 ${styles.viewToggle}`}>
            <button 
              className={`${styles.toggleBtn} ${view === 'table' ? styles.active : ''}`}
              onClick={() => setView('table')}
            >
              <List size={16} />
            </button>
            <button 
              className={`${styles.toggleBtn} ${view === 'card' ? styles.active : ''}`}
              onClick={() => setView('card')}
            >
              <LayoutGrid size={16} />
            </button>
          </div>
          <button className={styles.createBtn} onClick={() => alert('新增客戶功能開發中')}>
            <Plus size={18} /> 新增客戶
          </button>
        </div>
      </header>

      <div className={`glass-1 ${styles.filterBar}`}>
        <div className={styles.statusChips}>
          {['全部', '潛在', '活躍', '成交', '流失'].map(status => (
            <button 
              key={status}
              className={`${styles.chip} ${activeFilter === status ? styles.chipActive : ''}`}
              onClick={() => setActiveFilter(status)}
            >
              {status}
            </button>
          ))}
        </div>
        
        <div className={styles.filterActions}>
          <div className={styles.searchBox}>
            <Search size={16} className={styles.searchIcon} />
            <input type="text" placeholder="搜尋客戶..." className={styles.searchInput} />
          </div>
          <button className={styles.filterBtn} onClick={() => alert('排序功能開發中')}>
            <Filter size={16} /> 排序
          </button>
        </div>
      </div>

      <div className={`glass-2 ${styles.tableContainer}`}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>公司名稱</th>
              <th>國家</th>
              <th>產業</th>
              <th>Lead Score</th>
              <th>狀態</th>
              <th>負責人</th>
              <th>最後互動</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => {
              const score = c.leadScore?.fit || 0;
              return (
                <tr key={c.id}>
                  <td className={styles.companyName}>{c.name}</td>
                  <td>{c.country}</td>
                  <td>
                    <span className={styles.industryTag}>{c.industry}</span>
                  </td>
                  <td>
                    <div className={styles.scoreCell}>
                      <span className={styles.scoreText}>{score}</span>
                      <div className={styles.scoreBarBg}>
                        <div 
                          className={styles.scoreBarFill} 
                          style={{ 
                            width: `${score}%`,
                            backgroundColor: getScoreColor(score)
                          }} 
                        />
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${getStatusColor(c.status)}`}>
                      {c.status}
                    </span>
                  </td>
                  <td>
                    <div className={styles.ownerAvatar}>-</div>
                  </td>
                  <td className={styles.mutedText}>-</td>
                  <td>
                    <button className={styles.actionBtn} onClick={() => alert('更多操作')}>
                      <MoreHorizontal size={18} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className={`glass-1 ${styles.pagination}`}>
        <span className={styles.pageInfo}>共 {customers.length} 筆</span>
        <div className={styles.pageControls}>
          <button className={styles.pageBtn} disabled onClick={() => alert('分頁功能開發中')}><ChevronLeft size={16} /></button>
          <button className={`${styles.pageBtn} ${styles.pageActive}`} onClick={() => alert('分頁功能開發中')}>1</button>
          <button className={styles.pageBtn} onClick={() => alert('分頁功能開發中')}><ChevronRight size={16} /></button>
        </div>
      </div>
    </div>
  );
}
