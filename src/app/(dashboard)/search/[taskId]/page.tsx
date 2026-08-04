'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { XCircle, List, RefreshCw, RotateCw } from 'lucide-react';
import styles from './page.module.css';

export default function SearchTaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.taskId as string;

  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchTaskDetails = async () => {
    try {
      const res = await fetch(`/api/search/tasks/${taskId}`);
      if (res.ok) {
        const data = await res.json();
        setTask(data);
      }
    } catch (err) {
      console.error('Failed to fetch task details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaskDetails();

    // Poll for updates if task is queued or running
    const interval = setInterval(() => {
      fetchTaskDetails();
    }, 3000);

    return () => clearInterval(interval);
  }, [taskId]);

  if (loading && !task) {
    return <div className={styles.page} style={{ color: '#fff', padding: '40px' }}>載入任務資料中...</div>;
  }

  if (!task) {
    return (
      <div className={styles.page} style={{ color: '#fff', padding: '40px' }}>
        <h2>找不到指定的搜尋任務</h2>
        <button className={`${styles.btn} ${styles.btnPrimary}`} style={{ marginTop: '16px' }} onClick={() => router.push('/search/results')}>
          返回搜尋中心
        </button>
      </div>
    );
  }

  const results = task.searchResults || [];
  const foundCount = results.length;
  const targetCount = task.targetCount || (task.criteriaJson as any)?.targetCount || 50;
  const progress = Math.min(100, Math.round((foundCount / targetCount) * 100));

  // Generate dynamic real activity logs based on task state
  const logs = [];
  logs.push({
    time: task.createdAt ? new Date(task.createdAt).toLocaleTimeString() : '',
    msg: `建立搜尋任務：「${task.name}」`
  });

  if (task.startedAt) {
    logs.push({
      time: new Date(task.startedAt).toLocaleTimeString(),
      msg: '開始執行網路搜尋引擎抓取...'
    });
  }

  results.forEach((item: any) => {
    const title = item.companyName || item.website;
    const provider = item.scoreJson?.provider ? `[${item.scoreJson.provider}] ` : '';
    logs.push({
      time: item.createdAt ? new Date(item.createdAt).toLocaleTimeString() : '',
      msg: `${provider}成功抓取目標企業：${title}`
    });
  });

  if (task.status === 'COMPLETED') {
    logs.push({
      time: new Date(task.updatedAt || Date.now()).toLocaleTimeString(),
      msg: `搜尋完成！共取得 ${foundCount} 筆資料`
    });
  } else if (task.status === 'FAILED') {
    logs.push({
      time: new Date(task.updatedAt || Date.now()).toLocaleTimeString(),
      msg: `搜尋失敗或逾時`
    });
  }

  // Reverse logs so latest is first
  logs.reverse();

  return (
    <div className={styles.page}>
      <div className={styles.headerCard}>
        <div className={styles.headerTop}>
          <div className={styles.titleArea}>
            <span className={`${styles.badge} ${task.status === 'RUNNING' || task.status === 'QUEUED' ? styles.badgePulse : styles.badgeDone}`}>
              {task.status === 'RUNNING' ? '搜尋執行中' : task.status === 'QUEUED' ? '佇列中' : task.status === 'COMPLETED' ? '✅ 已完成' : '❌ 失敗'}
            </span>
            <h1 className={styles.title}>{task.name}</h1>
          </div>
          <div className={styles.timeInfo}>
            <span>建立時間: {task.createdAt ? new Date(task.createdAt).toLocaleString() : '-'}</span>
            {task.startedAt && <span>開始時間: {new Date(task.startedAt).toLocaleString()}</span>}
          </div>
        </div>

        {/* Explains a FAILED task, or a COMPLETED one that produced nothing —
            both previously rendered as an empty table with no reason given. */}
        {task.errorMessage && (
          <div
            style={{
              margin: '12px 0',
              padding: '10px 14px',
              borderRadius: 8,
              background: task.status === 'FAILED' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
              border: `1px solid ${task.status === 'FAILED' ? 'rgba(239,68,68,0.4)' : 'rgba(245,158,11,0.4)'}`,
              color: task.status === 'FAILED' ? '#ef4444' : '#f59e0b',
              fontSize: '0.85rem',
              lineHeight: 1.6,
            }}
          >
            {task.status === 'FAILED' ? '❌ ' : '⚠️ '}{task.errorMessage}
          </div>
        )}

        <div className={styles.progressSection}>
          <div className={styles.progressHeader}>
            <span className={styles.progressLabel}>搜尋進度</span>
            <span className={styles.progressStats}>{foundCount} / {targetCount} ({progress}%)</span>
          </div>
          <div className={styles.progressTrackLarge}>
            <div className={styles.progressBarLarge} style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>已抓取真實結果</span>
            <span className={styles.statValue} style={{ color: 'var(--color-success)' }}>{foundCount}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>目標設定數量</span>
            <span className={styles.statValue} style={{ color: 'var(--color-warning)' }}>{targetCount}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>任務狀態</span>
            <span className={styles.statValue}>{task.status}</span>
          </div>
        </div>

        <div className={styles.actions}>
          <button 
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={() => router.push(`/search/results?taskId=${taskId}`)}
          >
            <List size={20} />
            查看所有搜尋結果 ({foundCount})
          </button>
          <button 
            className={`${styles.btn} ${styles.btnWarning || styles.btnPrimary}`}
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none' }}
            onClick={async () => {
              if (!confirm('確定要重新執行此搜尋任務嗎？舊的搜尋結果將會被清除並重新抓取。')) return;
              try {
                const res = await fetch(`/api/search/tasks/${taskId}`, { method: 'POST' });
                if (res.ok) {
                  setTask((prev: any) => ({ ...prev, status: 'QUEUED', searchResults: [] }));
                }
              } catch (err) {
                console.error('Re-run failed', err);
              }
            }}
          >
            <RotateCw size={18} />
            重新執行搜尋
          </button>
          <button className={`${styles.btn} ${styles.btnGhost}`} onClick={fetchTaskDetails}>
            <RefreshCw size={18} />
            手動重新整理
          </button>
        </div>
      </div>

      <div className={styles.bottomGrid}>
        <div className={styles.previewSection}>
          <h2 className={styles.sectionTitle}>最新結果預覽 (真實資料)</h2>
          {results.length === 0 ? (
            <div style={{ padding: '24px', color: '#9ca3af', textAlign: 'center' }}>
              {task.status === 'RUNNING' || task.status === 'QUEUED' ? '正在搜尋中，請稍候...' : '尚無抓取結果'}
            </div>
          ) : (
            <table className={styles.previewTable}>
              <thead>
                <tr>
                  <th>公司名稱</th>
                  <th>網站 URL</th>
                  <th>來源資訊</th>
                </tr>
              </thead>
              <tbody>
                {results.slice(0, 10).map((res: any) => (
                  <tr key={res.id}>
                    <td style={{ fontWeight: 600 }}>{res.companyName}</td>
                    <td>
                      <a href={res.website} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', textDecoration: 'underline' }}>
                        {res.website}
                      </a>
                    </td>
                    <td style={{ color: '#9ca3af', fontSize: '13px' }}>
                      {res.scoreJson?.provider || 'Web Scraper'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className={styles.logSection}>
          <h2 className={styles.sectionTitle}>即時執行日誌</h2>
          <div className={styles.logList}>
            {logs.map((log: any, i: number) => (
              <div key={i} className={styles.logItem}>
                <span className={styles.logTime}>{log.time}</span>
                <span className={styles.logMsg}>{log.msg}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
