'use client';

import React, { useState, useEffect } from 'react';
import { X, Globe, Mail, Phone, Link2 as Linkedin, Copy, ExternalLink, MessageSquare, Save, CheckCircle2 } from 'lucide-react';
import styles from './ResultDetailDrawer.module.css';

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
  sources: { provider: string; url: string; confidence: number }[];
  notes?: string;
}

export default function ResultDetailDrawer({
  data,
  isOpen,
  onClose,
  onUpdated,
}: {
  data: ResultData | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: (updated: any) => void;
}) {
  // Editable fields
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [industry, setIndustry] = useState('');
  const [companyType, setCompanyType] = useState('');
  const [employeeCount, setEmployeeCount] = useState('');
  const [revenue, setRevenue] = useState('');
  const [website, setWebsite] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Reset fields when data changes
  useEffect(() => {
    if (data) {
      setName(data.name || '');
      setCountry(data.country || '');
      setIndustry(data.industry || '');
      setCompanyType(data.companyType || '');
      setEmployeeCount(data.employeeCount || '');
      setRevenue(data.revenue || '');
      setWebsite(data.website || '');
      setEmail(data.email || '');
      setPhone(data.phone || '');
      setLinkedin(data.linkedin || '');
      setNotes(data.notes || '');
      setSaved(false);
    }
  }, [data]);

  if (!isOpen || !data) return null;

  const handleCopy = (text: string) => {
    if (text) navigator.clipboard.writeText(text);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`/api/search/results/${data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: name,
          country,
          website,
          industry,
          companyType,
          employeeCount,
          revenue,
          email,
          phone,
          linkedin,
          notes,
        }),
      });
      if (res.ok) {
        setSaved(true);
        if (onUpdated) {
          onUpdated({
            ...data,
            name,
            companyName: name,
            localName: name,
            country,
            website,
            industry,
            companyType,
            employeeCount,
            revenue,
            email,
            phone,
            linkedin,
            notes,
          });
        }
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (e) {
      console.error('Save failed:', e);
    } finally {
      setSaving(false);
    }
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
          <input
            className={styles.companyNameInput}
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="公司名稱"
          />
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
            <div className={styles.editGrid}>
              <div className={styles.editField}>
                <label className={styles.editLabel}>國家</label>
                <input className={styles.editInput} value={country} onChange={e => setCountry(e.target.value)} placeholder="國家" />
              </div>
              <div className={styles.editField}>
                <label className={styles.editLabel}>產業</label>
                <input className={styles.editInput} value={industry} onChange={e => setIndustry(e.target.value)} placeholder="產業" />
              </div>
              <div className={styles.editField}>
                <label className={styles.editLabel}>公司類型</label>
                <input className={styles.editInput} value={companyType} onChange={e => setCompanyType(e.target.value)} placeholder="公司類型" />
              </div>
              <div className={styles.editField}>
                <label className={styles.editLabel}>員工數</label>
                <input className={styles.editInput} value={employeeCount} onChange={e => setEmployeeCount(e.target.value)} placeholder="員工數" />
              </div>
              <div className={styles.editField}>
                <label className={styles.editLabel}>預估營收</label>
                <input className={styles.editInput} value={revenue} onChange={e => setRevenue(e.target.value)} placeholder="預估營收" />
              </div>
            </div>
          </section>

          <section>
            <h3 className={styles.sectionTitle}>聯絡資訊</h3>
            <div className={styles.contactList}>
              <div className={styles.contactItem}>
                <Globe size={18} className={styles.contactIcon} />
                <input className={styles.editInput} value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://" style={{ flex: 1 }} />
                {website && (
                  <a href={website} target="_blank" rel="noreferrer" className={styles.contactAction}><ExternalLink size={16} /></a>
                )}
                <button className={styles.contactAction} onClick={() => handleCopy(website)}><Copy size={16} /></button>
              </div>
              <div className={styles.contactItem}>
                <Mail size={18} className={styles.contactIcon} />
                <input className={styles.editInput} value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" style={{ flex: 1 }} />
                <button className={styles.contactAction} onClick={() => handleCopy(email)}><Copy size={16} /></button>
              </div>
              <div className={styles.contactItem}>
                <Phone size={18} className={styles.contactIcon} />
                <input className={styles.editInput} value={phone} onChange={e => setPhone(e.target.value)} placeholder="電話" style={{ flex: 1 }} />
                <button className={styles.contactAction} onClick={() => handleCopy(phone)}><Copy size={16} /></button>
              </div>
              <div className={styles.contactItem}>
                <Linkedin size={18} className={styles.contactIcon} />
                <input className={styles.editInput} value={linkedin} onChange={e => setLinkedin(e.target.value)} placeholder="LinkedIn URL" style={{ flex: 1 }} />
                <button className={styles.contactAction} onClick={() => handleCopy(linkedin)}><Copy size={16} /></button>
              </div>
            </div>
          </section>

          <section>
            <h3 className={styles.sectionTitle}>來源資訊</h3>
            <div className={styles.sourceList}>
              {(data.sources || []).length > 0 ? (data.sources || []).map((src, idx) => (
                <div key={idx} className={styles.sourceItem}>
                  <a href={src.url} target="_blank" rel="noreferrer" className={styles.sourceLink}>
                    {src.provider} <ExternalLink size={14} />
                  </a>
                  <span className={styles.confidence}>可信度 {src.confidence}%</span>
                </div>
              )) : (
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>暫無來源資訊</div>
              )}
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
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? '儲存中...' : saved ? (
              <><CheckCircle2 size={16} /> 已儲存</>
            ) : (
              <><Save size={16} /> 儲存變更</>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
