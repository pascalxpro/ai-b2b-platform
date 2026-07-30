'use client';

import React, { useState } from 'react';
import { X, Globe, Mail, Phone, Link2 as Linkedin, Copy, ExternalLink, MessageSquare } from 'lucide-react';
import styles from './ResultDetailDrawer.module.css';

interface Source {
  provider: string;
  url: string;
  confidence: number;
}

interface ResultData {
  id: string;
  name: string;
  country: string;
  industry: string;
  companyType: string;
  employeeCount: string;
  revenue: string;
  website: string;
  email: string;
  phone: string;
  linkedin: string;
  qualityStatus: string;
  conversionStatus: string;
  sources: Source[];
  notes?: string;
}

export default function ResultDetailDrawer({
  data,
  isOpen,
  onClose
}: {
  data: ResultData | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [notes, setNotes] = useState(data?.notes || '');

  if (!isOpen || !data) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add a toast here
  };

  const getStatusBadgeClass = (status: string) => {
    switch(status) {
      case 'NEW': return styles.badgeInfo;
      case 'VALID': return styles.badgeSuccess;
      case 'PENDING': return styles.badgeWarning;
      case 'INVALID': return styles.badgeDanger;
      default: return styles.badgeInfo;
    }
  };

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.drawer}>
        <div className={styles.header}>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={24} />
          </button>
          <h2 className={styles.companyName}>{data.name}</h2>
          <div className={styles.badges}>
            <span className={`${styles.badge} ${getStatusBadgeClass(data.qualityStatus)}`}>
              {data.qualityStatus}
            </span>
            <span className={`${styles.badge} ${styles.badgeInfo}`}>
              {data.conversionStatus}
            </span>
          </div>
        </div>

        <div className={styles.content}>
          <section>
            <h3 className={styles.sectionTitle}>基本資訊</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>國家</span>
                <span className={styles.infoValue}>🇹🇼 {data.country}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>產業</span>
                <span className={styles.infoValue}>{data.industry}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>公司類型</span>
                <span className={styles.infoValue}>{data.companyType}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>員工數</span>
                <span className={styles.infoValue}>{data.employeeCount}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>預估營收</span>
                <span className={styles.infoValue}>{data.revenue}</span>
              </div>
            </div>
          </section>

          <section>
            <h3 className={styles.sectionTitle}>聯絡資訊</h3>
            <div className={styles.contactList}>
              <div className={styles.contactItem}>
                <Globe size={18} className={styles.contactIcon} />
                <a href={data.website} target="_blank" rel="noreferrer" className={styles.contactValue} style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
                  {data.website}
                </a>
                <button className={styles.contactAction} onClick={() => handleCopy(data.website)}><Copy size={16} /></button>
              </div>
              <div className={styles.contactItem}>
                <Mail size={18} className={styles.contactIcon} />
                <span className={styles.contactValue}>{data.email}</span>
                <button className={styles.contactAction} onClick={() => handleCopy(data.email)}><Copy size={16} /></button>
              </div>
              <div className={styles.contactItem}>
                <Phone size={18} className={styles.contactIcon} />
                <span className={styles.contactValue}>{data.phone}</span>
                <button className={styles.contactAction} onClick={() => handleCopy(data.phone)}><Copy size={16} /></button>
              </div>
              <div className={styles.contactItem}>
                <Linkedin size={18} className={styles.contactIcon} />
                <a href={data.linkedin} target="_blank" rel="noreferrer" className={styles.contactValue} style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
                  LinkedIn Profile
                </a>
                <button className={styles.contactAction} onClick={() => handleCopy(data.linkedin)}><Copy size={16} /></button>
              </div>
            </div>
          </section>

          <section>
            <h3 className={styles.sectionTitle}>來源資訊</h3>
            <div className={styles.sourceList}>
              {data.sources.map((src, idx) => (
                <div key={idx} className={styles.sourceItem}>
                  <a href={src.url} target="_blank" rel="noreferrer" className={styles.sourceLink}>
                    {src.provider} <ExternalLink size={14} />
                  </a>
                  <span className={styles.confidence}>可信度 {src.confidence}%</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className={styles.sectionTitle}>
              <MessageSquare size={18} /> 內部筆記
            </h3>
            <textarea 
              className={styles.textarea}
              rows={4}
              placeholder="新增關於此企業的備註..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </section>
        </div>

        <div className={styles.footer}>
          <button className={`${styles.btn} ${styles.btnDangerGhost}`}>
            刪除
          </button>
          <button className={`${styles.btn} ${styles.btnPrimary}`}>
            轉為客戶
          </button>
        </div>
      </div>
    </>
  );
}
