'use client';

import { Search, FileSearch, TrendingUp, Users, Target, Calendar, Clock, ArrowUpRight, CheckSquare } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import Link from 'next/link';
import Breadcrumb from '@/components/ui/Breadcrumb';
import styles from './page.module.css';

const lineData = [
  { name: '7/22', value: 12 },
  { name: '7/23', value: 19 },
  { name: '7/24', value: 15 },
  { name: '7/25', value: 25 },
  { name: '7/26', value: 22 },
  { name: '7/27', value: 18 },
  { name: '7/28', value: 30 },
];

const barData = [
  { name: '科技業', value: 45 },
  { name: '製造業', value: 30 },
  { name: '金融業', value: 25 },
  { name: '零售業', value: 20 },
  { name: '醫療業', value: 15 },
  { name: '服務業', value: 10 },
];

const activities = [
  { id: 1, type: 'search', icon: <Search size={16} />, title: '搜尋任務完成: 日本半導體製造商', time: '10分鐘前', user: 'JD' },
  { id: 2, type: 'customer', icon: <Users size={16} />, title: '新增客戶: TechCorp K.K.', time: '1小時前', user: 'AM' },
  { id: 3, type: 'task', icon: <Target size={16} />, title: '建立任務: 追蹤Q3潛在客戶', time: '3小時前', user: 'JD' },
  { id: 4, type: 'meeting', icon: <Calendar size={16} />, title: '會議安排: 德國自動化設備商', time: '5小時前', user: 'RW' },
  { id: 5, type: 'search', icon: <Search size={16} />, title: '搜尋任務完成: 東南亞電商平台', time: '昨天', user: 'JD' },
  { id: 6, type: 'customer', icon: <Users size={16} />, title: '新增客戶: Global Logistics Gmbh', time: '昨天', user: 'AM' },
  { id: 7, type: 'task', icon: <Target size={16} />, title: '指派任務: 更新企業資料庫', time: '2天前', user: 'RW' },
  { id: 8, type: 'meeting', icon: <Calendar size={16} />, title: '會議記錄: 新加坡金融科技', time: '2天前', user: 'JD' },
];

export default function DashboardPage() {
  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <div className={styles.titleContainer}>
          <Breadcrumb items={[{ label: 'Dashboard' }]} />
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.dateRange}>2026年7月22日 - 2026年7月28日</p>
        </div>
      </header>

      <section className={styles.kpiCards}>
        <Link href="/search/results" className={`glass-2 ${styles.kpiCard}`}>
          <div className={`${styles.iconCircle} ${styles.primary}`}>
            <Search size={24} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiValue}>12</span>
            <span className={styles.kpiLabel}>搜尋任務</span>
          </div>
          <div className={`${styles.trend} ${styles.trendUp}`}>
            <ArrowUpRight size={14} /> 12%
          </div>
        </Link>
        
        <Link href="/search/results" className={`glass-2 ${styles.kpiCard}`}>
          <div className={`${styles.iconCircle} ${styles.info}`}>
            <FileSearch size={24} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiValue}>847</span>
            <span className={styles.kpiLabel}>搜尋結果</span>
          </div>
          <div className={`${styles.trend} ${styles.trendUp}`}>
            <ArrowUpRight size={14} /> 5%
          </div>
        </Link>

        <Link href="/reports" className={`glass-2 ${styles.kpiCard}`}>
          <div className={`${styles.iconCircle} ${styles.success}`}>
            <TrendingUp size={24} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiValue}>23.5%</span>
            <span className={styles.kpiLabel}>轉換率</span>
          </div>
          <div className={`${styles.trend} ${styles.trendUp}`}>
            <ArrowUpRight size={14} /> 2.1%
          </div>
        </Link>

        <Link href="/entities" className={`glass-2 ${styles.kpiCard}`}>
          <div className={`${styles.iconCircle} ${styles.accent}`}>
            <Users size={24} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiValue}>156</span>
            <span className={styles.kpiLabel}>活躍客戶</span>
          </div>
          <div className={`${styles.trend} ${styles.trendUp}`}>
            <ArrowUpRight size={14} /> 8%
          </div>
        </Link>
      </section>

      <section className={styles.quickActionsRow}>
        <Link href="/" className={`glass-1 ${styles.actionBtn}`}>
          <Search size={16} /> 新建搜尋
        </Link>
        <Link href="/entities" className={`glass-1 ${styles.actionBtn}`}>
          <Users size={16} /> 新增客戶
        </Link>
        <Link href="/tasks" className={`glass-1 ${styles.actionBtn}`}>
          <CheckSquare size={16} /> 建立任務
        </Link>
      </section>

      <div className={styles.mainContent}>
        <div className={styles.chartsColumn}>
          <div className={`glass-2 ${styles.chartCard}`}>
            <h3 className={styles.cardTitle}>搜尋趨勢</h3>
            <div className={styles.chartWrapper}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: '8px' }}
                    itemStyle={{ color: 'var(--color-text)' }}
                  />
                  <Line type="monotone" dataKey="value" stroke="var(--color-primary)" strokeWidth={3} dot={{ fill: 'var(--color-primary)', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, stroke: 'var(--color-primary-glow)' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={`glass-2 ${styles.chartCard}`}>
            <h3 className={styles.cardTitle}>產業分佈</h3>
            <div className={styles.chartWrapper}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: '8px' }}
                    itemStyle={{ color: 'var(--color-text)' }}
                    cursor={{ fill: 'var(--color-surface-hover)' }}
                  />
                  <Bar dataKey="value" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className={styles.activityColumn}>
          <div className={`glass-2 ${styles.activityCard}`}>
            <h3 className={styles.cardTitle}>近期活動</h3>
            <div className={styles.activityTimeline}>
              {activities.map((activity) => (
                <Link 
                  href={activity.type === 'search' ? '/search/results' : activity.type === 'customer' ? '/entities' : activity.type === 'task' ? '/tasks' : '/meetings'} 
                  key={activity.id} 
                  className={styles.activityItem}
                >
                  <div className={styles.activityIconWrapper}>
                    <div className={`${styles.activityIcon} ${styles[activity.type]}`}>
                      {activity.icon}
                    </div>
                    <div className={styles.timelineLine}></div>
                  </div>
                  <div className={styles.activityDetails}>
                    <p className={styles.activityTitle}>{activity.title}</p>
                    <div className={styles.activityMeta}>
                      <span className={styles.activityTime}>
                        <Clock size={12} /> {activity.time}
                      </span>
                      <span className={styles.activityUser}>{activity.user}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
