'use client';
import React, { useState } from 'react';
import { Search, Clock, Bookmark, Loader2, ArrowRight, Sparkles, Globe, Building2, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import SearchCriteriaBuilder from '@/components/search/SearchCriteriaBuilder';
import styles from './page.module.css';

export default function SearchCenterPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const recentSearches = [
    { query: '找日本具食品包裝需求的代理商', time: '2 小時前', count: 87 },
    { query: '東南亞半導體設備經銷商', time: '昨天', count: 124 },
    { query: '歐洲有機食品進口商', time: '3 天前', count: 56 },
  ];

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
      setShowBuilder(true); // 空白時才開啟進階設定
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleHintClick = (hint: string) => {
    setSearchQuery(hint);
    quickSearch(hint);
  };

  const handleRecentClick = (query: string) => {
    setSearchQuery(query);
    quickSearch(query);
  };

  return (
    <div className={styles.container}>
      {/* Decorative background orbs */}
      <div className={styles.bgOrb1} />
      <div className={styles.bgOrb2} />
      <div className={styles.bgOrb3} />

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <Sparkles size={14} />
            <span>AI 驅動商業情報引擎</span>
          </div>
          <h1 className={styles.heroTitle}>
            <span className="gradient-text">探索全球</span>
            <br />
            商業情報
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
            <span className={styles.quickStatBadge}>5</span>
          </div>
          <div className={styles.quickStatDivider} />
          <div className={styles.quickStat}>
            <span className={styles.quickStatLabel}>本週結果</span>
            <span className={styles.quickStatBadge}>127</span>
          </div>
          <div className={styles.quickStatDivider} />
          <div className={styles.quickStat}>
            <span className={styles.quickStatLabel}>活躍任務</span>
            <span className={styles.quickStatBadge}>3</span>
          </div>
        </div>
      </section>

      {/* Stats Cards */}
      <section className={styles.statsSection}>
        <div className={styles.statsGrid}>
          <div className={styles.statCard} onClick={() => router.push('/search/results')}>
            <div className={styles.statIconWrap}>
              <Clock size={22} />
            </div>
            <div className={styles.statBody}>
              <span className={styles.statCount}>0</span>
              <span className={styles.statLabel}>最近搜尋</span>
            </div>
            <ArrowRight size={16} className={styles.statArrow} />
          </div>
          <div className={styles.statCard} onClick={() => router.push('/search/results')}>
            <div className={`${styles.statIconWrap} ${styles.statIconAccent}`}>
              <Bookmark size={22} />
            </div>
            <div className={styles.statBody}>
              <span className={styles.statCount}>0</span>
              <span className={styles.statLabel}>儲存搜尋</span>
            </div>
            <ArrowRight size={16} className={styles.statArrow} />
          </div>
          <div className={styles.statCard} onClick={() => router.push('/tasks')}>
            <div className={`${styles.statIconWrap} ${styles.statIconSuccess}`}>
              <Loader2 size={22} />
            </div>
            <div className={styles.statBody}>
              <span className={styles.statCount}>0</span>
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
            {recentSearches.map((item, i) => (
              <div key={i} className={styles.recentItem} onClick={() => handleRecentClick(item.query)} style={{ cursor: 'pointer' }}>
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
