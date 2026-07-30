'use client';

import React, { useState } from 'react';
import { LayoutGrid, List, Plus, Search, Bot, User, Clock } from 'lucide-react';
import Breadcrumb from '@/components/ui/Breadcrumb';
import styles from './page.module.css';

type Priority = 'high' | 'medium' | 'low';
type Status = 'todo' | 'in_progress' | 'done' | 'overdue';
type Source = 'search' | 'manual' | 'ai';

interface Task {
  id: string;
  title: string;
  status: Status;
  priority: Priority;
  assignee: string;
  dueDate: string;
  source: Source;
}

const MOCK_TASKS: Task[] = [
  { id: '1', title: '跟進日本ABC公司報價', status: 'todo', priority: 'high', assignee: '王小明', dueDate: '2024-08-01', source: 'search' },
  { id: '2', title: '準備Q3東南亞市場報告', status: 'todo', priority: 'medium', assignee: '陳大文', dueDate: '2024-08-05', source: 'manual' },
  { id: '3', title: '回覆德國客戶技術規格', status: 'todo', priority: 'high', assignee: '林美玲', dueDate: '2024-08-02', source: 'ai' },
  { id: '4', title: '審核新進員工合約', status: 'todo', priority: 'low', assignee: '王小明', dueDate: '2024-08-10', source: 'manual' },
  
  { id: '5', title: '安排與韓國經銷商視訊會議', status: 'in_progress', priority: 'high', assignee: '張建國', dueDate: '2024-07-31', source: 'ai' },
  { id: '6', title: '產品包裝設計修改', status: 'in_progress', priority: 'medium', assignee: '陳大文', dueDate: '2024-08-03', source: 'manual' },
  { id: '7', title: '準備年度審計資料', status: 'in_progress', priority: 'high', assignee: '李四', dueDate: '2024-08-15', source: 'search' },
  
  { id: '8', title: '更新客戶關係管理系統', status: 'done', priority: 'medium', assignee: '林美玲', dueDate: '2024-07-25', source: 'manual' },
  { id: '9', title: '參加亞太區銷售會議', status: 'done', priority: 'low', assignee: '王小明', dueDate: '2024-07-28', source: 'ai' },
  { id: '10', title: '確認下月採購訂單', status: 'done', priority: 'high', assignee: '陳大文', dueDate: '2024-07-26', source: 'manual' },
  { id: '11', title: '發布產品更新公告', status: 'done', priority: 'medium', assignee: '張建國', dueDate: '2024-07-27', source: 'search' },
  { id: '12', title: '分析競品行銷策略', status: 'done', priority: 'low', assignee: '李四', dueDate: '2024-07-20', source: 'ai' },
  
  { id: '13', title: '繳交Q2部門預算報表', status: 'overdue', priority: 'high', assignee: '王小明', dueDate: '2024-07-15', source: 'manual' },
  { id: '14', title: '完成ISO認證文件補件', status: 'overdue', priority: 'high', assignee: '林美玲', dueDate: '2024-07-10', source: 'search' },
];

const COLUMNS = [
  { id: 'todo', title: '待辦', color: 'gray' },
  { id: 'in_progress', title: '進行中', color: 'info' },
  { id: 'done', title: '已完成', color: 'success' },
  { id: 'overdue', title: '已逾期', color: 'danger' },
];

const PRIORITY_MAP = {
  high: { label: '高', color: 'danger' },
  medium: { label: '中', color: 'warning' },
  low: { label: '低', color: 'info' }
};

const SOURCE_ICON_MAP = {
  search: Search,
  manual: User,
  ai: Bot
};

export default function TasksPage() {
  const [view, setView] = useState<'kanban' | 'list'>('kanban');

  const getSourceIcon = (source: Source) => {
    const Icon = SOURCE_ICON_MAP[source];
    return <Icon size={14} />;
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <Breadcrumb items={[{ label: '任務中心' }]} />
          <h1 className={styles.title}>任務中心</h1>
          <div className={styles.viewToggle}>
            <button 
              className={`${styles.toggleBtn} ${view === 'kanban' ? styles.active : ''}`}
              onClick={() => setView('kanban')}
            >
              <LayoutGrid size={18} />
              看板
            </button>
            <button 
              className={`${styles.toggleBtn} ${view === 'list' ? styles.active : ''}`}
              onClick={() => setView('list')}
            >
              <List size={18} />
              列表
            </button>
          </div>
        </div>
        <button className={styles.addButton} onClick={() => alert('新增任務功能開發中')}>
          <Plus size={18} />
          新增任務
        </button>
      </header>

      <div className={styles.statsBar}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>總任務</span>
          <span className={styles.statValue}>14</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>本週到期</span>
          <span className={styles.statValue}>3</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>已逾期</span>
          <span className={`${styles.statValue} ${styles.textDanger}`}>2</span>
        </div>
      </div>

      <div className={styles.board}>
        {COLUMNS.map(col => {
          const tasks = MOCK_TASKS.filter(t => t.status === col.id);
          
          return (
            <div key={col.id} className={styles.column}>
              <div className={`${styles.columnHeader} ${styles[`header${col.color}`]}`}>
                <h3>{col.title}</h3>
                <span className={styles.badge}>{tasks.length}</span>
              </div>
              
              <div className={styles.taskList}>
                {tasks.map(task => (
                  <div key={task.id} className={styles.taskCard}>
                    <div className={styles.taskHeader}>
                      <span className={`${styles.priorityBadge} ${styles[`priority${task.priority}`]}`}>
                        {PRIORITY_MAP[task.priority].label}
                      </span>
                      <div className={styles.sourceIcon} title={`來源: ${task.source}`}>
                        {getSourceIcon(task.source)}
                      </div>
                    </div>
                    
                    <h4 className={styles.taskTitle}>{task.title}</h4>
                    
                    <div className={styles.taskFooter}>
                      <div className={styles.assignee}>
                        <div className={styles.avatar}>{task.assignee.charAt(0)}</div>
                        <span>{task.assignee}</span>
                      </div>
                      <div className={styles.dueDate}>
                        <Clock size={14} />
                        {task.dueDate}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
