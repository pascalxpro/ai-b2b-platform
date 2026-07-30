'use client';

import React from 'react';
import { BarChart3, TrendingUp, Globe, Users, Sparkles, Download, Share2, Eye } from 'lucide-react';
import Breadcrumb from '@/components/ui/Breadcrumb';
import styles from './page.module.css';

export default function ReportsPage() {
  const reports = [
    { id: 1, title: '2024 Q2 銷售績效總覽', type: '銷售分析', date: '2024-07-15', status: 'done', color: 'var(--color-primary)' },
    { id: 2, title: '日本市場競品分析報告', type: '市場研究', date: '2024-07-20', status: 'done', color: 'var(--color-info)' },
    { id: 3, title: 'Q2 團隊績效評估', type: '績效報告', date: '2024-07-10', status: 'done', color: 'var(--color-success)' },
    { id: 4, title: '東南亞市場進入可行性分析', type: '市場研究', date: '2024-07-25', status: 'doing', color: 'var(--color-info)' },
    { id: 5, title: '客戶流失率分析 - 全區域', type: '自訂報表', date: '2024-07-22', status: 'done', color: 'var(--color-accent)' },
    { id: 6, title: 'Q3 目標與策略報告', type: '銷售分析', date: '2024-07-28', status: 'draft', color: 'var(--color-primary)' },
    { id: 7, title: '歐洲市場法規影響報告', type: '市場研究', date: '2024-06-30', status: 'done', color: 'var(--color-info)' },
    { id: 8, title: '月度業務報表 - 7月', type: '績效報告', date: '2024-07-29', status: 'doing', color: 'var(--color-success)' }
  ];

  const renderMiniChart = (color: string) => (
    <svg viewBox="0 0 100 40" className={styles.miniChart} preserveAspectRatio="none">
      <path d="M0 40 L0 25 L20 30 L40 15 L60 20 L80 5 L100 10 L100 40 Z" fill={color} opacity="0.2" />
      <path d="M0 25 L20 30 L40 15 L60 20 L80 5 L100 10" fill="none" stroke={color} strokeWidth="2" />
    </svg>
  );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <BarChart3 className={styles.headerIcon} />
        <div>
          <Breadcrumb items={[{ label: '報表分析' }]} />
          <h1 className={styles.title}>報表分析</h1>
          <p className={styles.subtitle}>數據洞察與智慧報告</p>
        </div>
      </header>

      <section className={`glass-2 ${styles.quickGenSection}`}>
        <h2 className={styles.sectionTitle}>AI 快速產出報表</h2>
        <div className={styles.quickGenGrid}>
          <div className={`glass-1 ${styles.templateCard}`}>
            <div className={styles.templateHeader}><TrendingUp size={18} style={{ color: 'var(--color-primary)' }} /> 銷售績效報告</div>
            <p className={styles.templateDesc}>自動彙整銷售數據與KPI</p>
            <button className={styles.btnGen} onClick={() => alert('報表產出功能開發中')}>產出</button>
          </div>
          <div className={`glass-1 ${styles.templateCard}`}>
            <div className={styles.templateHeader}><Globe size={18} style={{ color: 'var(--color-info)' }} /> 市場競爭分析</div>
            <p className={styles.templateDesc}>競品比較與市場佔有率</p>
            <button className={styles.btnGen} onClick={() => alert('報表產出功能開發中')}>產出</button>
          </div>
          <div className={`glass-1 ${styles.templateCard}`}>
            <div className={styles.templateHeader}><Users size={18} style={{ color: 'var(--color-success)' }} /> 客戶健康度報告</div>
            <p className={styles.templateDesc}>客戶流失率與留存分析</p>
            <button className={styles.btnGen} onClick={() => alert('報表產出功能開發中')}>產出</button>
          </div>
          <button className={styles.btnCustom} onClick={() => alert('AI 自訂報表功能開發中')}>
            <Sparkles size={24} />
            AI 自訂報表
          </button>
        </div>
      </section>

      <section className={styles.librarySection}>
        <div className={`glass-1 ${styles.tabs}`}>
          <div className={`${styles.tab} ${styles.tabActive}`}>全部</div>
          <div className={styles.tab}>銷售分析</div>
          <div className={styles.tab}>市場研究</div>
          <div className={styles.tab}>績效報告</div>
          <div className={styles.tab}>自訂報表</div>
        </div>

        <div className={styles.reportsGrid}>
          {reports.map(report => (
            <div key={report.id} className={`glass-2 ${styles.reportCard}`}>
              <div className={styles.reportHeader}>
                <div className={styles.typeBadge}>
                  <div className={styles.typeIcon} style={{ backgroundColor: report.color }} />
                  {report.type}
                </div>
              </div>
              <div className={styles.reportTitle}>{report.title}</div>
              {renderMiniChart(report.color)}
              <div className={styles.reportMeta}>
                <span>{report.date}</span>
                <span className={`${styles.statusBadge} ${report.status === 'done' ? styles.statusDone : report.status === 'doing' ? styles.statusDoing : styles.statusDraft}`}>
                  {report.status === 'done' ? '已產出' : report.status === 'doing' ? '產出中' : '草稿'}
                </span>
              </div>
              <div className={styles.reportActions}>
                <button className={styles.actionBtn} onClick={() => alert('下載功能開發中')}><Download size={14} /> 下載</button>
                <button className={styles.actionBtn} onClick={() => alert('分享功能開發中')}><Share2 size={14} /> 分享</button>
                <button className={styles.actionBtn} onClick={() => alert('查看功能開發中')}><Eye size={14} /> 查看</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className={`glass-1 ${styles.statsBar}`}>
        <div className={styles.statItem}>
          <div className={styles.statValue}>12 份</div>
          <div className={styles.statLabel}>本月產出</div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statValue}>8 份 (67%)</div>
          <div className={styles.statLabel}>AI 產出</div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statValue}>3.2 分鐘</div>
          <div className={styles.statLabel}>平均產出時間</div>
        </div>
      </div>
    </div>
  );
}
