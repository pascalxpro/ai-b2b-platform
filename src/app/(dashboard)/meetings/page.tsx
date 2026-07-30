'use client';

import React, { useState } from 'react';
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
import styles from './page.module.css';

interface Meeting {
  id: string;
  title: string;
  date: string;
  status: 'done' | 'in_progress' | 'scheduled';
  participants: number;
  duration: string;
  aiSummary: string;
  decisions: string[];
  actionItems: { task: string; assignee: string }[];
}

const MOCK_MEETINGS: Meeting[] = [
  {
    id: '1',
    title: 'Q3 日本市場策略會議',
    date: '2024-07-25',
    status: 'done',
    participants: 4,
    duration: '1.5 小時',
    aiSummary: '本次會議主要討論Q3針對日本市場的行銷策略。團隊決定擴大社交媒體廣告預算，並於9月推出本地化包裝的新產品。預計可提升20%的市佔率。',
    decisions: ['增加日本區社群廣告預算30%', '確認9月15日為新包裝上線日', '指定田中先生負責經銷商協調'],
    actionItems: [
      { task: '擬定社群媒體廣告素材', assignee: '林美玲' },
      { task: '確認新包裝印刷進度', assignee: '陳大文' }
    ]
  },
  {
    id: '2',
    title: 'ABC株式會社需求訪談',
    date: '2024-07-22',
    status: 'done',
    participants: 3,
    duration: '1 小時',
    aiSummary: '與ABC公司採購部進行季度需求訪談。客戶對產品品質表示滿意，但希望交期能縮短。雙方同意嘗試新的物流方案。',
    decisions: ['下季度訂單量維持不變', '試行空運與海運混合物流方案'],
    actionItems: [
      { task: '計算混合物流方案成本', assignee: '王小明' }
    ]
  },
  {
    id: '3',
    title: '東南亞代理商季度回顧',
    date: '2024-07-20',
    status: 'done',
    participants: 6,
    duration: '2 小時',
    aiSummary: '回顧東南亞各區代理商Q2業績。整體表現優於預期，特別是越南市場成長顯著。會議中分享了成功的在地化行銷案例。',
    decisions: ['提高越南區年度銷售目標15%', '將印尼市場列為下季重點開發區域'],
    actionItems: [
      { task: '準備印尼市場進入策略報告', assignee: '李四' },
      { task: '發放越南代理商獎金', assignee: '財務部' }
    ]
  },
  {
    id: '4',
    title: '產品包裝規格討論',
    date: '2024-07-28',
    status: 'in_progress',
    participants: 5,
    duration: '進行中',
    aiSummary: '正在進行中...AI將在會議結束後生成總結。',
    decisions: [],
    actionItems: []
  },
  {
    id: '5',
    title: '下週客戶拜訪行前會議',
    date: '2024-07-30',
    status: 'scheduled',
    participants: 3,
    duration: '預計 45 分鐘',
    aiSummary: '會議尚未開始。',
    decisions: [],
    actionItems: []
  }
];

const STATUS_MAP = {
  done: { label: '已完成', color: 'success' },
  in_progress: { label: '進行中', color: 'info' },
  scheduled: { label: '排定', color: 'warning' }
};

export default function MeetingsPage() {
  const [expandedId, setExpandedId] = useState<string | null>('1');

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return { month, day };
  };

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
        {MOCK_MEETINGS.map(meeting => {
          const { month, day } = formatDate(meeting.date);
          const isExpanded = expandedId === meeting.id;
          const statusConfig = STATUS_MAP[meeting.status];

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
                      {meeting.participants} 人參與
                    </div>
                    <div className={styles.metaItem}>
                      <Clock size={14} />
                      {meeting.duration}
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
                    <p className={styles.summaryText}>{meeting.aiSummary}</p>
                  </div>
                  
                  <div className={styles.detailGrid}>
                    <div className={styles.detailSection}>
                      <h4 className={styles.sectionTitle}>
                        <CheckCircle2 size={16} className={styles.iconSuccess} />
                        決策事項
                      </h4>
                      {meeting.decisions.length > 0 ? (
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
                      {meeting.actionItems.length > 0 ? (
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
