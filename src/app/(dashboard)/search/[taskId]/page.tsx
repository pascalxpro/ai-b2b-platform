'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { XCircle, List } from 'lucide-react';
import styles from './page.module.css';

export default function SearchTaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.taskId as string;

  const [task, setTask] = useState<any>(null);

  useEffect(() => {
    // Mock initial fetch
    setTask({
      id: taskId,
      name: '日本食品包裝機械製造商',
      status: 'RUNNING',
      createdTime: '2026-07-29 10:00:00',
      startedTime: '2026-07-29 10:01:23',
      targetCount: 50,
      foundCount: 32,
      validCount: 28,
      duplicateCount: 4,
      estimatedCost: 3.5,
      previewResults: [
        { id: '1', name: 'Tokyo Packaging Corp', country: '日本', score: 95 },
        { id: '2', name: 'Osaka Machinery', country: '日本', score: 88 },
        { id: '3', name: 'Nippon Food Tech', country: '日本', score: 82 },
        { id: '4', name: 'Yokohama Pack Solutions', country: '日本', score: 79 },
        { id: '5', name: 'Kyoto Industrial Co', country: '日本', score: 76 },
      ],
      activityLog: [
        { time: '10:15:23', msg: '找到 Tokyo Packaging Corp (品質 95)' },
        { time: '10:14:08', msg: '正在掃描 Google Search 第 3 頁...' },
        { time: '10:12:45', msg: '找到 Osaka Machinery (品質 88)' },
        { time: '10:11:30', msg: '找到 Nippon Food Tech (品質 82)' },
        { time: '10:10:12', msg: '開始執行搜尋任務...' },
        { time: '10:01:23', msg: '任務已提交並加入佇列' },
      ]
    });

    // Mock polling if RUNNING
    const interval = setInterval(() => {
      setTask((prev: any) => {
        if (prev?.status !== 'RUNNING') return prev;
        const newFound = Math.min(prev.foundCount + Math.floor(Math.random() * 3), prev.targetCount);
        const isCompleted = newFound >= prev.targetCount;
        return {
          ...prev,
          foundCount: newFound,
          validCount: Math.floor(newFound * 0.9),
          status: isCompleted ? 'COMPLETED' : 'RUNNING'
        };
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [taskId]);

  if (!task) return <div className={styles.page}>載入中...</div>;

  const progress = Math.round((task.foundCount / task.targetCount) * 100);

  return (
    <div className={styles.page}>
      <div className={styles.headerCard}>
        <div className={styles.headerTop}>
          <div className={styles.titleArea}>
            <span className={`${styles.badge} ${task.status === 'RUNNING' ? styles.badgePulse : styles.badgeDone}`}>
            {task.status === 'RUNNING' ? '執行中' : '✅ 已完成'}
          </span>
            <h1 className={styles.title}>{task.name}</h1>
          </div>
          <div className={styles.timeInfo}>
            <span>建立時間: {task.createdTime}</span>
            <span>開始時間: {task.startedTime}</span>
          </div>
        </div>

        <div className={styles.progressSection}>
          <div className={styles.progressHeader}>
            <span className={styles.progressLabel}>搜尋進度</span>
            <span className={styles.progressStats}>{task.foundCount} / {task.targetCount} ({progress}%)</span>
          </div>
          <div className={styles.progressTrackLarge}>
            <div className={styles.progressBarLarge} style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>有效結果</span>
            <span className={styles.statValue} style={{ color: 'var(--color-success)' }}>{task.validCount}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>重複結果</span>
            <span className={styles.statValue} style={{ color: 'var(--color-warning)' }}>{task.duplicateCount}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>預估花費</span>
            <span className={styles.statValue}>${task.estimatedCost.toFixed(2)}</span>
          </div>
        </div>

        <div className={styles.actions}>
          <button 
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={() => router.push(`/search/results?taskId=${taskId}`)}
          >
            <List size={20} />
            查看所有結果
          </button>
          {task.status === 'RUNNING' && (
            <button className={`${styles.btn} ${styles.btnDangerGhost}`} onClick={() => setTask((prev: any) => ({ ...prev, status: 'CANCELLED' }))}>
              <XCircle size={20} />
              取消任務
            </button>
          )}
        </div>
      </div>

      <div className={styles.bottomGrid}>
        <div className={styles.previewSection}>
          <h2 className={styles.sectionTitle}>最新結果預覽</h2>
          <table className={styles.previewTable}>
            <thead>
              <tr>
                <th>公司名稱</th>
                <th>國家</th>
                <th>品質分數</th>
              </tr>
            </thead>
            <tbody>
              {task.previewResults.map((res: any) => (
                <tr key={res.id}>
                  <td style={{ fontWeight: 600 }}>{res.name}</td>
                  <td>{res.country}</td>
                  <td style={{ color: 'var(--color-success)', fontWeight: 600 }}>{res.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.logSection}>
          <h2 className={styles.sectionTitle}>執行日誌</h2>
          <div className={styles.logList}>
            {task.activityLog?.map((log: any, i: number) => (
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
