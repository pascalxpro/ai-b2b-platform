'use client';

import { Plus, Users, Settings } from 'lucide-react';
import styles from './page.module.css';

const workspaces = [
  { id: 1, name: '營一部', type: 'Department', status: 'Active', members: 8, icon: '🏢' },
  { id: 2, name: '營二部', type: 'Department', status: 'Active', members: 6, icon: '🏢' },
  { id: 3, name: '營三部', type: 'Department', status: 'Active', members: 5, icon: '🏢' },
  { id: 4, name: '行銷企劃', type: 'Department', status: 'Active', members: 4, icon: '📋' },
  { id: 5, name: '專案', type: 'Project', status: 'Active', members: 12, icon: '🚀' },
  { id: 6, name: '系統', type: 'System', status: 'Active', members: 2, icon: '⚙️' },
];

export default function WorkspacesPage() {
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
              <div className={styles.iconWrapper}>{ws.icon}</div>
              <div className={styles.badges}>
                <span className={styles.typeBadge}>{ws.type}</span>
                <span className={styles.statusBadge}>{ws.status}</span>
              </div>
            </div>

            <h3 className={styles.wsName}>{ws.name}</h3>

            <div className={styles.membersArea}>
              <div className={styles.memberAvatars}>
                {[...Array(Math.min(ws.members, 4))].map((_, i) => (
                  <div key={i} className={styles.avatar}>
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
                {ws.members > 4 && (
                  <div className={styles.avatarMore}>+{ws.members - 4}</div>
                )}
              </div>
              <span className={styles.memberCount}>{ws.members} 成員</span>
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
