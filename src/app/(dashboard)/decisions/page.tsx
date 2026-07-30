'use client';

import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, AlertTriangle, Lightbulb, Clock, User, Sparkles, Check, X, ArrowRightCircle, PauseCircle } from 'lucide-react';
import Breadcrumb from '@/components/ui/Breadcrumb';
import styles from './page.module.css';

export default function DecisionsPage() {
  const [decisions, setDecisions] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/decisions')
      .then(r => r.json())
      .then(data => {
        const parsed = data.map((d: any) => ({
          ...d,
          payload: typeof d.payload === 'string' ? JSON.parse(d.payload) : (d.payload || {})
        }));

        setDecisions(parsed.filter((d: any) => d.status === 'PENDING').map((d: any) => ({
          id: d.id,
          title: d.payload?.title || d.actionType,
          desc: d.payload?.description || '',
          entity: d.payload?.entity || d.requester?.name || '未知',
          due: d.payload?.due || '近期',
          priority: d.payload?.priority || 'medium',
          ai: d.reason || '建議審慎評估',
          recommendation: 'approve'
        })));

        setTimeline(parsed.filter((d: any) => d.status !== 'PENDING').map((d: any) => ({
          id: d.id,
          date: new Date(d.createdAt).toLocaleDateString(),
          title: d.payload?.title || d.actionType,
          outcome: d.status.toLowerCase(),
          by: d.approver?.name || '系統'
        })));

        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Target className={styles.headerIcon} />
        <div>
          <Breadcrumb items={[{ label: '決策中心' }]} />
          <h1 className={styles.title}>決策中心</h1>
          <p className={styles.subtitle}>智慧決策輔助與追蹤</p>
        </div>
      </header>

      <section className={styles.insights}>
        <div className={`glass-2 ${styles.insightCard} ${styles.insightOpportunity}`}>
          <div className={styles.insightHeader}>
            <div className={styles.insightTitle}><TrendingUp size={18} style={{ color: 'var(--color-success)' }} /> 市場機會</div>
            <span className={`${styles.badge} ${styles.badgeSuccess}`}>機會</span>
          </div>
          <p className={styles.insightContent}>日本食品包裝市場預計 Q4 成長 12%，建議提前佈局</p>
        </div>
        <div className={`glass-2 ${styles.insightCard} ${styles.insightRisk}`}>
          <div className={styles.insightHeader}>
            <div className={styles.insightTitle}><AlertTriangle size={18} style={{ color: 'var(--color-warning)' }} /> 風險提示</div>
            <span className={`${styles.badge} ${styles.badgeWarning}`}>風險</span>
          </div>
          <p className={styles.insightContent}>德國客戶 AutoMechanik 已逾期 30 天未回應，建議主動聯繫</p>
        </div>
        <div className={`glass-2 ${styles.insightCard} ${styles.insightStrategy}`}>
          <div className={styles.insightHeader}>
            <div className={styles.insightTitle}><Lightbulb size={18} style={{ color: 'var(--color-info)' }} /> 策略建議</div>
            <span className={`${styles.badge} ${styles.badgeInfo}`}>建議</span>
          </div>
          <p className={styles.insightContent}>越南代理商業績優良，建議提升為獨家代理</p>
        </div>
      </section>

      <div className={styles.mainContent}>
        <section>
          <h2 className={styles.sectionTitle}>待決策項目</h2>
          <div className={styles.decisionList}>
            {loading ? <p>載入中...</p> : decisions.map(item => (
              <div key={item.id} className={`glass-2 ${styles.decisionCard}`}>
                <div className={`${styles.priorityIndicator} ${item.priority === 'high' ? styles.priorityHigh : item.priority === 'medium' ? styles.priorityMedium : styles.priorityLow}`} />
                <div className={styles.decisionContent}>
                  <div className={styles.decisionHeader}>
                    <div className={styles.decisionTitle}>{item.title}</div>
                  </div>
                  <div className={styles.decisionMeta}>
                    <span className={styles.metaItem}><User size={14} /> {item.entity}</span>
                    <span className={styles.metaItem}><Clock size={14} /> {item.due} 到期</span>
                  </div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{item.desc}</div>
                  <div className={styles.decisionRecommendation}>
                    <Sparkles size={14} /> {item.ai}
                  </div>
                  <div className={styles.decisionActions}>
                    <button className={`${styles.btn} ${styles.btnApprove}`} onClick={() => alert('決策操作功能開發中')}><Check size={16} /> 核准</button>
                    <button className={`${styles.btn} ${styles.btnDelay}`} onClick={() => alert('決策操作功能開發中')}><PauseCircle size={16} /> 延後</button>
                    <button className={`${styles.btn} ${styles.btnAssign}`} onClick={() => alert('決策操作功能開發中')}><ArrowRightCircle size={16} /> 轉派</button>
                    <button className={`${styles.btn} ${styles.btnReject}`} onClick={() => alert('決策操作功能開發中')}><X size={16} /> 拒絕</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="glass-2" style={{ padding: 'var(--space-6)', borderRadius: '12px' }}>
            <h2 className={styles.sectionTitle}>決策歷程</h2>
            <div className={styles.timeline}>
              {loading ? <p>載入中...</p> : timeline.map(item => (
                <div key={item.id} className={styles.timelineItem}>
                  <div className={styles.timelineDot} />
                  <div className={styles.timelineContent}>
                    <div className={styles.timelineDate}>{item.date}</div>
                    <div className={styles.timelineTitle}>{item.title}</div>
                    <div className={styles.timelineOutcome}>
                      <span className={`${styles.timelineOutcomeBadge} ${item.outcome === 'approved' ? styles.outcomeApproved : item.outcome === 'rejected' ? styles.outcomeRejected : styles.outcomeDelayed}`}>
                        {item.outcome === 'approved' ? '已核准' : item.outcome === 'rejected' ? '已拒絕' : '已延期'}
                      </span>
                      <span className={styles.timelinePerson}>{item.by}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
