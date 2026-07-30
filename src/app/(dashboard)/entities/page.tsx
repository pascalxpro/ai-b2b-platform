'use client';

import { useState } from 'react';
import { Plus, LayoutGrid, List, Search, Filter, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import Breadcrumb from '@/components/ui/Breadcrumb';
import styles from './page.module.css';

const customers = [
  { id: 1, name: 'TechCorp K.K.', country: '🇯🇵 日本', industry: '半導體製造', score: 85, status: '活躍客戶', owner: 'JD', lastInteract: '2小時前' },
  { id: 2, name: 'Global Logistics Gmbh', country: '🇩🇪 德國', industry: '物流運輸', score: 45, status: '潛在客戶', owner: 'AM', lastInteract: '1天前' },
  { id: 3, name: 'NexGen Systems Inc.', country: '🇺🇸 美國', industry: '軟體開發', score: 95, status: '成交客戶', owner: 'RW', lastInteract: '3天前' },
  { id: 4, name: 'ASEAN E-commerce', country: '🇸🇬 新加坡', industry: '電子商務', score: 62, status: '潛在客戶', owner: 'JD', lastInteract: '5小時前' },
  { id: 5, name: 'Stark Industries', country: '🇺🇸 美國', industry: '國防科技', score: 78, status: '活躍客戶', owner: 'AM', lastInteract: '1週前' },
  { id: 6, name: 'AutoMechanik A.G.', country: '🇩🇪 德國', industry: '汽車零組件', score: 30, status: '流失客戶', owner: 'RW', lastInteract: '2個月前' },
  { id: 7, name: 'FinTech Asia', country: '🇭🇰 香港', industry: '金融科技', score: 88, status: '活躍客戶', owner: 'JD', lastInteract: '昨天' },
  { id: 8, name: 'Samsung Electronics', country: '🇰🇷 韓國', industry: '消費電子', score: 92, status: '成交客戶', owner: 'AM', lastInteract: '2天前' },
  { id: 9, name: 'Foxconn', country: '🇹🇼 台灣', industry: '電子代工', score: 80, status: '活躍客戶', owner: 'RW', lastInteract: '4小時前' },
  { id: 10, name: 'Siemens Healthineers', country: '🇩🇪 德國', industry: '醫療設備', score: 55, status: '潛在客戶', owner: 'JD', lastInteract: '3天前' },
  { id: 11, name: 'Sony Corporation', country: '🇯🇵 日本', industry: '娛樂與電子', score: 70, status: '活躍客戶', owner: 'AM', lastInteract: '1週前' },
  { id: 12, name: 'VinGroup', country: '🇻🇳 越南', industry: '綜合企業', score: 40, status: '潛在客戶', owner: 'RW', lastInteract: '2週前' },
  { id: 13, name: 'Tesla Inc.', country: '🇺🇸 美國', industry: '電動車', score: 25, status: '流失客戶', owner: 'JD', lastInteract: '3個月前' },
  { id: 14, name: 'Tencent', country: '🇨🇳 中國', industry: '網際網路', score: 98, status: '成交客戶', owner: 'AM', lastInteract: '1天前' },
  { id: 15, name: 'Tata Consultancy', country: '🇮🇳 印度', industry: '資訊服務', score: 65, status: '潛在客戶', owner: 'RW', lastInteract: '5天前' },
];

export default function EntitiesPage() {
  const [view, setView] = useState<'table' | 'card'>('table');
  const [activeFilter, setActiveFilter] = useState('全部');

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
            {customers.map((c) => (
              <tr key={c.id}>
                <td className={styles.companyName}>{c.name}</td>
                <td>{c.country}</td>
                <td>
                  <span className={styles.industryTag}>{c.industry}</span>
                </td>
                <td>
                  <div className={styles.scoreCell}>
                    <span className={styles.scoreText}>{c.score}</span>
                    <div className={styles.scoreBarBg}>
                      <div 
                        className={styles.scoreBarFill} 
                        style={{ 
                          width: `${c.score}%`,
                          backgroundColor: getScoreColor(c.score)
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
                  <div className={styles.ownerAvatar}>{c.owner}</div>
                </td>
                <td className={styles.mutedText}>{c.lastInteract}</td>
                <td>
                  <button className={styles.actionBtn} onClick={() => alert('更多操作')}>
                    <MoreHorizontal size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={`glass-1 ${styles.pagination}`}>
        <span className={styles.pageInfo}>共 156 筆</span>
        <div className={styles.pageControls}>
          <button className={styles.pageBtn} disabled onClick={() => alert('分頁功能開發中')}><ChevronLeft size={16} /></button>
          <button className={`${styles.pageBtn} ${styles.pageActive}`} onClick={() => alert('分頁功能開發中')}>1</button>
          <button className={styles.pageBtn} onClick={() => alert('分頁功能開發中')}>2</button>
          <button className={styles.pageBtn} onClick={() => alert('分頁功能開發中')}>3</button>
          <span className={styles.pageEllipsis}>...</span>
          <button className={styles.pageBtn} onClick={() => alert('分頁功能開發中')}>11</button>
          <button className={styles.pageBtn} onClick={() => alert('分頁功能開發中')}><ChevronRight size={16} /></button>
        </div>
      </div>
    </div>
  );
}
