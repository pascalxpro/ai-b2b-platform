'use client';

import { useState, useEffect } from 'react';
import { Plus, Users, Settings } from 'lucide-react';
import { SkeletonCard } from '@/components/ui/Skeleton';
import styles from './page.module.css';

interface Workspace {
  id: string;
  name: string;
  type: string;
  status: string;
  description: string;
  members: { user: { name: string; email: string; avatarUrl?: string }, role: string }[];
  _count: { entities: number; tasks: number };
}

const TYPE_ICONS: Record<string, string> = {
  Department: '🏢',
  Project: '🚀',
  System: '⚙️',
  default: '📋'
};

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const res = await fetch('/api/workspaces');
        if (res.ok) {
          const data = await res.json();
          setWorkspaces(data);
        }
      } catch (error) {
        console.error('Failed to fetch workspaces:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchWorkspaces();
  }, []);

  if (loading) return <div className={styles.container}><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Workspace 管理</h1>
        <button className={styles.createBtn} onClick={() => alert('新增 Workspace 功能開發中')}>
          <Plus size={18} /> 新增 Workspace
        </button>
      </header>

      <div className={styles.grid}>
        {workspaces.map((ws) => (
          <div 
            key={ws.id} 
            className={`glass-2 ${styles.card} ${ws.type === 'System' ? styles.systemCard : ''}`}
          >
            <div className={styles.cardHeader}>
              <div className={styles.iconWrapper}>{TYPE_ICONS[ws.type] || TYPE_ICONS.default}</div>
              <div className={styles.badges}>
                <span className={styles.typeBadge}>{ws.type}</span>
                <span className={styles.statusBadge}>{ws.status}</span>
              </div>
            </div>

            <h3 className={styles.wsName}>{ws.name}</h3>
            {ws.description && <p className={styles.wsDescription} style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>{ws.description}</p>}

            <div className={styles.membersArea}>
              <div className={styles.memberAvatars}>
                {ws.members.slice(0, 4).map((m, i) => (
                  <div key={i} className={styles.avatar}>
                    {m.user.name.charAt(0)}
                  </div>
                ))}
                {ws.members.length > 4 && (
                  <div className={styles.avatarMore}>+{ws.members.length - 4}</div>
                )}
              </div>
              <span className={styles.memberCount}>{ws.members.length} 成員</span>
            </div>

            <div className={styles.cardActions}>
              <button className={`glass-1 ${styles.actionBtn}`} onClick={() => alert('設定功能開發中')}>
                <Settings size={14} /> 設定
              </button>
              <button className={`glass-1 ${styles.actionBtn}`} onClick={() => alert('成員管理功能開發中')}>
                <Users size={14} /> 成員管理
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
