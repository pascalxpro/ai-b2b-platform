'use client';
import React, { useState, useEffect } from 'react';
import { Search, Clock, Bookmark, Loader2, ArrowRight, Sparkles, Globe, Building2, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import SearchCriteriaBuilder from '@/components/search/SearchCriteriaBuilder';
import styles from './page.module.css';

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `${diffMin} 分鐘前`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} 小時前`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return '昨天';
  return `${diffDay} 天前`;
}

export default function SearchCenterPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentSearches, setRecentSearches] = useState<any[]>([]);
  const [stats, setStats] = useState({ recentCount: 0, savedCount: 0, runningCount: 0, todayCount: 0, weekResults: 0 });

  // Fetch real data on mount
  useEffect(() => {
    // Fetch recent tasks
    fetch('/api/search/tasks?limit=5')
      .then(r => r.json())
      .then(tasks => {
        if (Array.isArray(tasks)) {
          setRecentSearches(tasks.map(t => ({
            id: t.id,
            query: t.name || t.queryText || '未命名搜尋',
            time: timeAgo(t.createdAt),
            count: t._count?.searchResults || 0,
            status: t.status,
          })));

          // Calculate stats
          const now = new Date();
          const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);

          const todayCount = tasks.filter(t => new Date(t.createdAt) >= todayStart).length;
          const runningCount = tasks.filter(t => t.status === 'RUNNING' || t.status === 'QUEUED').length;
          const weekResults = tasks
            .filter(t => new Date(t.createdAt) >= weekStart)
            .reduce((sum, t) => sum + (t._count?.searchResults || 0), 0);

          setStats(prev => ({
            ...prev,
            recentCount: tasks.length,
            runningCount,
            todayCount,
            weekResults,
          }));
        }
      })
      .catch(console.error);

    // Fetch saved searches count
    fetch('/api/search/saved')
      .then(r => r.json())
      .then(saved => {
        if (Array.isArray(saved)) {
          setStats(prev => ({ ...prev, savedCount: saved.length }));
        }
      })
      .catch(console.error);
  }, []);

  // 直接建立搜尋任務（有輸入內容時）
  const quickSearch = async (query: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/search/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: query,
          criteria: { queryText: query, targetCount: 50 },
          autoStart: true,
        }),
      });
      if (res.ok) {
        const task = await res.json();
        router.push(`/search/${task.id}`);
      } else {
        router.push('/search/results');
      }
    } catch {
      router.push('/search/results');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      quickSearch(searchQuery.trim());
    } else {
      setShowBuilder(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleHintClick = (hint: string) => {
    setSearchQuery(hint);
    quickSearch(hint);
  };

  const handleRecentClick = (taskId: string) => {
    router.push(`/search/results?taskId=${taskId}`);
  };

  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <div className={styles.heroLabel}>
            <Sparkles size={14} />
            AI-Powered B2B Intelligence
          </div>
          <h1 className={styles.heroTitle}>
            智能商業搜尋引擎
          </h1>
          <p className={styles.heroSubtitle}>
            使用自然語言描述您的需求，AI 將自動搜尋、篩選並驗證全球商業資訊
          </p>
        </div>

        {/* Search Bar */}
        <div className={`${styles.searchContainer} ${isFocused ? styles.searchFocused : ''}`}>
          <div className={styles.searchBar}>
            <Search size={20} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="例如：找日本具食品包裝需求的代理商 100 家..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={handleKeyDown}
            />
            <button className={styles.searchBtn} onClick={handleSearch}>
              <Search size={18} />
              <span>搜尋</span>
            </button>
          </div>
          <div className={styles.searchHints}>
            <span className={styles.hintLabel}>熱門：</span>
            <button className={styles.hintChip} onClick={() => handleHintClick('東南亞代理商')}>東南亞代理商</button>
            <button className={styles.hintChip} onClick={() => handleHintClick('歐洲進口商')}>歐洲進口商</button>
            <button className={styles.hintChip} onClick={() => handleHintClick('日本食品包裝')}>日本食品包裝</button>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className={styles.quickStatsBar}>
          <div className={styles.quickStat}>
            <span className={styles.quickStatLabel}>今日搜尋</span>
            <span className={styles.quickStatBadge}>{stats.todayCount}</span>
          </div>
          <div className={styles.quickStatDivider} />
          <div className={styles.quickStat}>
            <span className={styles.quickStatLabel}>本週結果</span>
            <span className={styles.quickStatBadge}>{stats.weekResults}</span>
          </div>
          <div className={styles.quickStatDivider} />
          <div className={styles.quickStat}>
            <span className={styles.quickStatLabel}>活躍任務</span>
            <span className={styles.quickStatBadge}>{stats.runningCount}</span>
          </div>
        </div>
      </section>

      {/* Stats Cards */}
      <section className={styles.statsSection}>
        <div className={styles.statsGrid}>
          <div className={styles.statCard} onClick={() => router.push('/search/results')} style={{ cursor: 'pointer' }}>
            <div className={styles.statIconWrap}>
              <Clock size={22} />
            </div>
            <div className={styles.statBody}>
              <span className={styles.statCount}>{stats.recentCount}</span>
              <span className={styles.statLabel}>最近搜尋</span>
            </div>
            <ArrowRight size={16} className={styles.statArrow} />
          </div>
          <div className={styles.statCard} onClick={() => router.push('/search/results')} style={{ cursor: 'pointer' }}>
            <div className={`${styles.statIconWrap} ${styles.statIconAccent}`}>
              <Bookmark size={22} />
            </div>
            <div className={styles.statBody}>
              <span className={styles.statCount}>{stats.savedCount}</span>
              <span className={styles.statLabel}>儲存搜尋</span>
            </div>
            <ArrowRight size={16} className={styles.statArrow} />
          </div>
          <div className={styles.statCard} onClick={() => router.push('/tasks')} style={{ cursor: 'pointer' }}>
            <div className={`${styles.statIconWrap} ${styles.statIconSuccess}`}>
              <Loader2 size={22} />
            </div>
            <div className={styles.statBody}>
              <span className={styles.statCount}>{stats.runningCount}</span>
              <span className={styles.statLabel}>執行中任務</span>
            </div>
            <ArrowRight size={16} className={styles.statArrow} />
          </div>
        </div>
      </section>

      {/* Quick Access Section */}
      <section className={styles.quickSection}>
        <h2 className={styles.sectionTitle}>快速開始</h2>
        <div className={styles.quickGrid}>
          <div className={styles.quickCard} onClick={() => setShowBuilder(true)} style={{ cursor: 'pointer' }}>
            <div className={styles.quickIconWrap}>
              <Globe size={24} />
            </div>
            <h3>全球搜尋</h3>
            <p>搜尋全球企業資訊，涵蓋 50+ 國家與地區</p>
          </div>
          <div className={styles.quickCard} onClick={() => setShowBuilder(true)} style={{ cursor: 'pointer' }}>
            <div className={styles.quickIconWrap}>
              <Building2 size={24} />
            </div>
            <h3>產業分析</h3>
            <p>深入分析目標產業趨勢與競爭格局</p>
          </div>
          <div className={styles.quickCard} onClick={() => router.push('/search/results')} style={{ cursor: 'pointer' }}>
            <div className={styles.quickIconWrap}>
              <TrendingUp size={24} />
            </div>
            <h3>商機追蹤</h3>
            <p>自動追蹤與評分潛在商業機會</p>
          </div>
        </div>
      </section>

      {/* Recent Searches */}
      {recentSearches.length > 0 && (
        <section className={styles.recentSection}>
          <h2 className={styles.sectionTitle}>最近搜尋紀錄</h2>
          <div className={styles.recentList}>
            {recentSearches.map((item) => (
              <div key={item.id} className={styles.recentItem} onClick={() => handleRecentClick(item.id)} style={{ cursor: 'pointer' }}>
                <Clock size={16} className={styles.recentIcon} />
                <span className={styles.recentQuery}>{item.query}</span>
                <span className={styles.recentMeta}>{item.count} 筆結果</span>
                <span className={styles.recentTime}>{item.time}</span>
                <ArrowRight size={14} className={styles.recentArrow} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Search Criteria Builder Modal */}
      {showBuilder && (
        <SearchCriteriaBuilder
          onClose={() => setShowBuilder(false)}
        />
      )}
    </div>
  );
}
