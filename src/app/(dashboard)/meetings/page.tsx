'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Calendar, 
  Users, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  CheckCircle2, 
  Target 
} from 'lucide-react';
import { SkeletonCard } from '@/components/ui/Skeleton';
import styles from './page.module.css';

interface Meeting {
  id: string;
  title: string;
  date: string;
  status: 'done' | 'in_progress' | 'scheduled' | string;
  summary?: string;
  decisions: string[];
  actionItems: { task: string; assignee: string }[];
  createdBy: { name: string };
}

const STATUS_MAP: Record<string, { label: string, color: string }> = {
  done: { label: '已完成', color: 'success' },
  in_progress: { label: '進行中', color: 'info' },
  scheduled: { label: '排定', color: 'warning' },
  DONE: { label: '已完成', color: 'success' },
  IN_PROGRESS: { label: '進行中', color: 'info' },
  SCHEDULED: { label: '排定', color: 'warning' }
};

export default function MeetingsPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const res = await fetch('/api/meetings');
        if (res.ok) {
          const data = await res.json();
          setMeetings(data);
        }
      } catch (error) {
        console.error('Failed to fetch meetings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMeetings();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return { month: '??', day: '??' };
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return { month: '??', day: '??' };
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return { month, day };
  };

  if (loading) return <div className={styles.container}><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>會議智慧</h1>
        <button className={styles.addButton} onClick={() => alert('新增會議功能開發中')}>
          <Plus size={18} />
          新增會議
        </button>
      </header>

      <div className={styles.meetingList}>
        {meetings.map(meeting => {
          const { month, day } = formatDate(meeting.date);
          const isExpanded = expandedId === meeting.id;
          const statusConfig = STATUS_MAP[meeting.status] || STATUS_MAP.done;

          return (
            <div 
              key={meeting.id} 
              className={`${styles.meetingCard} ${isExpanded ? styles.expanded : ''}`}
            >
              <div 
                className={styles.cardMain} 
                onClick={() => toggleExpand(meeting.id)}
              >
                <div className={styles.dateBlock}>
                  <span className={styles.dateMonth}>{month}月</span>
                  <span className={styles.dateDay}>{day}</span>
                </div>
                
                <div className={styles.cardCenter}>
                  <h3 className={styles.meetingTitle}>{meeting.title}</h3>
                  <div className={styles.meetingMeta}>
                    <div className={styles.metaItem}>
                      <Users size={14} />
                      發起人: {meeting.createdBy?.name || '-'}
                    </div>
                  </div>
                </div>

                <div className={styles.cardRight}>
                  <div className={`${styles.statusBadge} ${styles[`status${statusConfig.color}`]}`}>
                    {meeting.status === 'in_progress' && <span className={styles.pulseIndicator}></span>}
                    {statusConfig.label}
                  </div>
                  <button className={styles.expandButton}>
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className={styles.cardDetails}>
                  <div className={styles.detailSection}>
                    <h4 className={styles.sectionTitle}>
                      <Sparkles size={16} className={styles.iconPrimary} />
                      AI 摘要
                    </h4>
                    <p className={styles.summaryText}>{meeting.summary || '無摘要'}</p>
                  </div>
                  
                  <div className={styles.detailGrid}>
                    <div className={styles.detailSection}>
                      <h4 className={styles.sectionTitle}>
                        <CheckCircle2 size={16} className={styles.iconSuccess} />
                        決策事項
                      </h4>
                      {meeting.decisions && meeting.decisions.length > 0 ? (
                        <ul className={styles.bulletList}>
                          {meeting.decisions.map((dec, idx) => (
                            <li key={idx}>{dec}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className={styles.emptyText}>無紀錄</span>
                      )}
                    </div>
                    
                    <div className={styles.detailSection}>
                      <h4 className={styles.sectionTitle}>
                        <Target size={16} className={styles.iconWarning} />
                        行動項目
                      </h4>
                      {meeting.actionItems && meeting.actionItems.length > 0 ? (
                        <div className={styles.actionList}>
                          {meeting.actionItems.map((item, idx) => (
                            <div key={idx} className={styles.actionItem}>
                              <span className={styles.actionTask}>{item.task}</span>
                              <span className={styles.actionAssignee}>{item.assignee}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className={styles.emptyText}>無紀錄</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
