'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Play, Pause, XCircle, ChevronRight, BarChart2 } from 'lucide-react';
import styles from './SearchTaskCard.module.css';

interface SearchTaskCardProps {
  id: string;
  name: string;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  criteriaSummary: string;
  createdTime: string;
  progress?: number;
  resultCount?: number;
}

export default function SearchTaskCard({
  id,
  name,
  status,
  criteriaSummary,
  createdTime,
  progress = 0,
  resultCount = 0
}: SearchTaskCardProps) {
  const router = useRouter();

  const handleCardClick = () => {
    router.push(`/search/${id}`);
  };

  const handleResultsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/search/results?taskId=${id}`);
  };

  const statusLabels = {
    QUEUED: '排隊中',
    RUNNING: '執行中',
    COMPLETED: '已完成',
    FAILED: '失敗',
    CANCELLED: '已取消'
  };

  return (
    <div className={styles.card} onClick={handleCardClick}>
      <div className={styles.left}>
        <div className={`${styles.statusIndicator} ${styles[`status_${status}`]}`}>
          <div className={styles.dot} />
          <span className={styles.badge}>{statusLabels[status]}</span>
        </div>
      </div>

      <div className={styles.center}>
        <h3 className={styles.title}>{name}</h3>
        <p className={styles.summary}>{criteriaSummary}</p>
        <span className={styles.time}>{createdTime}</span>
      </div>

      <div className={styles.right}>
        {status === 'RUNNING' && (
          <div className={styles.progressContainer}>
            <div className={styles.progressHeader}>
              <span>進度</span>
              <span>{progress}%</span>
            </div>
            <div className={styles.progressTrack}>
              <div className={styles.progressBar} style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        <div className={styles.resultCount}>
          <span className={styles.countNumber}>{resultCount}</span>
          <span className={styles.countLabel}>筆結果</span>
        </div>

        <div className={styles.actions}>
          {(status === 'COMPLETED' || status === 'RUNNING') && (
            <button 
              className={styles.actionBtn} 
              onClick={handleResultsClick}
              title="查看結果"
            >
              <BarChart2 size={18} />
            </button>
          )}
          <button className={styles.actionBtn} title="詳細資訊">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
