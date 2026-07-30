'use client';

import React from 'react';
import { Target, TrendingUp, AlertTriangle, Lightbulb, Clock, User, Sparkles, Check, X, ArrowRightCircle, PauseCircle } from 'lucide-react';
import Breadcrumb from '@/components/ui/Breadcrumb';
import styles from './page.module.css';

export default function DecisionsPage() {
  const decisions = [
    { id: 1, title: '核准與ABC株式會社的合作提案', desc: '新一季戰略合作協議，涉及日幣1,000萬投資', entity: 'ABC株式會社', due: '今天', priority: 'high', ai: '建議核准，符合年度亞太擴展策略', recommendation: 'approve' },
    { id: 2, title: '擴大越南市場投資預算', desc: '增加Q3行銷預算20%', entity: '越南分公司', due: '3天後', priority: 'medium', ai: '建議核准，該市場成長動能強勁', recommendation: 'approve' },
    { id: 3, title: '批准新產品線包裝設計', desc: '環保材質包裝轉換計畫', entity: '產品部', due: '1週後', priority: 'low', ai: '建議延後，成本影響需進一步評估', recommendation: 'delay' },
    { id: 4, title: '決定是否參加東京包裝展', desc: '2024年度最大行業展會參展決定', entity: '行銷部', due: '5天後', priority: 'medium', ai: '建議核准，預計可增加30%潛在客戶', recommendation: 'approve' },
    { id: 5, title: '調整韓國市場定價策略', desc: '因應匯率波動調整價格', entity: '韓國區', due: '2週後', priority: 'low', ai: '建議轉派定價委員會審議', recommendation: 'assign' },
    { id: 6, title: '是否將 Tata 升級為 VIP 客戶', desc: '年度採購額已達標', entity: 'Tata 集團', due: '1週後', priority: 'low', ai: '建議核准，提升客戶忠誠度', recommendation: 'approve' },
    { id: 7, title: '核准新募業務人員入職', desc: '歐洲區業務經理2名', entity: 'HR部', due: '4天後', priority: 'low', ai: '建議核准，人力缺口已達警戒線', recommendation: 'approve' },
    { id: 8, title: '簽署新加坡經銷商合約', desc: '為期兩年獨家經銷權', entity: 'SG Tech', due: '明天', priority: 'high', ai: '建議核准，條件優於市場平均', recommendation: 'approve' }
  ];

  const timeline = [
    { id: 1, date: '2024-07-28', title: '核准歐洲區Q3行銷預算', outcome: 'approved', by: '王大明 (總經理)' },
    { id: 2, date: '2024-07-27', title: '拒絕供應商A的漲價要求', outcome: 'rejected', by: '李小美 (採購主管)' },
    { id: 3, date: '2024-07-26', title: '延後新辦公室租賃決策', outcome: 'delayed', by: '陳建國 (營運長)' },
    { id: 4, date: '2024-07-25', title: '核准北美市場定價調整', outcome: 'approved', by: '王大明 (總經理)' },
    { id: 5, date: '2024-07-22', title: '拒絕非必要差旅申請', outcome: 'rejected', by: '陳建國 (營運長)' },
    { id: 6, date: '2024-07-20', title: '核准中東市場代理權合約', outcome: 'approved', by: '王大明 (總經理)' }
  ];

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
            {decisions.map(item => (
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
              {timeline.map(item => (
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
