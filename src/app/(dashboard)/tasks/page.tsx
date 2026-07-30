'use client';

import React, { useState, useEffect } from 'react';
import { LayoutGrid, List, Plus, Search, Bot, User, Clock } from 'lucide-react';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { SkeletonCard } from '@/components/ui/Skeleton';
import styles from './page.module.css';

type Status = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';

interface Task {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: Status;
  assignee: {
    name: string;
    avatarUrl?: string;
  };
  dueAt: string;
  sourceType: string;
}

const COLUMNS = [
  { id: 'TODO', title: '待辦', color: 'gray' },
  { id: 'IN_PROGRESS', title: '進行中', color: 'info' },
  { id: 'DONE', title: '已完成', color: 'success' },
  { id: 'CANCELLED', title: '已取消', color: 'danger' },
];

const PRIORITY_MAP: Record<string, { label: string, color: string }> = {
  high: { label: '高', color: 'danger' },
  medium: { label: '中', color: 'warning' },
  low: { label: '低', color: 'info' },
  HIGH: { label: '高', color: 'danger' },
  MEDIUM: { label: '中', color: 'warning' },
  LOW: { label: '低', color: 'info' }
};

const SOURCE_ICON_MAP: Record<string, any> = {
  search: Search,
  manual: User,
  ai: Bot
};

export default function TasksPage() {
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch('/api/tasks');
        if (res.ok) {
          const data = await res.json();
          setTasks(data);
        }
      } catch (error) {
        console.error('Failed to fetch tasks:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  const getSourceIcon = (source: string) => {
    const Icon = SOURCE_ICON_MAP[source] || SOURCE_ICON_MAP.manual;
    return <Icon size={14} />;
  };

  if (loading) return <div className={styles.container}><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>;

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
          <span className={styles.statValue}>{tasks.length}</span>
        </div>
      </div>

      <div className={styles.board}>
        {COLUMNS.map(col => {
          const columnTasks = tasks.filter(t => t.status === col.id);
          
          return (
            <div key={col.id} className={styles.column}>
              <div className={`${styles.columnHeader} ${styles[`header${col.color}`]}`}>
                <h3>{col.title}</h3>
                <span className={styles.badge}>{columnTasks.length}</span>
              </div>
              
              <div className={styles.taskList}>
                {columnTasks.map(task => (
                  <div key={task.id} className={styles.taskCard}>
                    <div className={styles.taskHeader}>
                      <span className={`${styles.priorityBadge} ${styles[`priority${task.priority?.toLowerCase() || 'medium'}`]}`}>
                        {PRIORITY_MAP[task.priority?.toLowerCase() || 'medium']?.label || '中'}
                      </span>
                      <div className={styles.sourceIcon} title={`來源: ${task.sourceType}`}>
                        {getSourceIcon(task.sourceType)}
                      </div>
                    </div>
                    
                    <h4 className={styles.taskTitle}>{task.title}</h4>
                    
                    <div className={styles.taskFooter}>
                      <div className={styles.assignee}>
                        <div className={styles.avatar}>{task.assignee?.name?.charAt(0) || '-'}</div>
                        <span>{task.assignee?.name || '未指派'}</span>
                      </div>
                      <div className={styles.dueDate}>
                        <Clock size={14} />
                        {task.dueAt ? new Date(task.dueAt).toLocaleDateString() : '-'}
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
