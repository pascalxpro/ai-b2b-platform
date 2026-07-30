'use client';

import React, { useState, useEffect, KeyboardEvent } from 'react';
import { X, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import styles from './SearchCriteriaBuilder.module.css';

// Simple inline TagInput since we need it self-contained
const TagInput = ({ 
  tags, 
  onAdd, 
  onRemove, 
  placeholder,
  suggestions = [] 
}: { 
  tags: string[], 
  onAdd: (tag: string) => void, 
  onRemove: (tag: string) => void, 
  placeholder: string,
  suggestions?: string[] 
}) => {
  const [input, setInput] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault();
      onAdd(input.trim());
      setInput('');
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      onRemove(tags[tags.length - 1]);
    }
  };

  return (
    <div className={styles.tagInput}>
      {tags.map(tag => (
        <span key={tag} className={styles.tag}>
          {tag}
          <button type="button" className={styles.tagRemove} onClick={() => onRemove(tag)}>
            <X size={14} />
          </button>
        </span>
      ))}
      <input
        type="text"
        className={styles.tagInputInner}
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? placeholder : ''}
        list={`suggestions-${placeholder}`}
      />
      {suggestions.length > 0 && (
        <datalist id={`suggestions-${placeholder}`}>
          {suggestions.map(s => (
            <option key={s} value={s} />
          ))}
        </datalist>
      )}
    </div>
  );
};

export default function SearchCriteriaBuilder({ 
  onClose 
}: { 
  onClose: () => void;
}) {
  const router = useRouter();
  
  // State
  const [description, setDescription] = useState('');
  const [countries, setCountries] = useState<string[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [companyTypes, setCompanyTypes] = useState<string[]>([]);
  const [targetCount, setTargetCount] = useState<number>(50);
  
  const [savedSearches, setSavedSearches] = useState<any[]>([]);
  const [selectedSavedId, setSelectedSavedId] = useState<string>('');

  const [isEstimating, setIsEstimating] = useState(false);
  const [showEstimates, setShowEstimates] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetch('/api/search/saved')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setSavedSearches(data);
        }
      })
      .catch(console.error);
  }, []);

  const handleSelectSaved = (id: string) => {
    setSelectedSavedId(id);
    const item = savedSearches.find(s => s.id === id);
    if (!item) return;

    const crit = item.criteriaJson || {};
    setDescription(crit.queryText || item.name || '');
    setCountries(crit.countries || []);
    setIndustries(crit.industries || []);
    setKeywords(crit.keywords || []);
    setCompanyTypes(crit.companyTypes || []);
    setTargetCount(crit.targetCount || 50);
    setShowEstimates(true);
  };

  const COMPANY_TYPES = ['製造商', '代理商', '經銷商', '進口商', '批發商'];
  const COUNTRY_SUGGESTIONS = ['台灣', '日本', '美國', '越南', '泰國', '德國'];
  const INDUSTRY_SUGGESTIONS = ['半導體', '電子零組件', '機械設備', '食品加工', '軟體服務'];



  const toggleCompanyType = (type: string) => {
    setCompanyTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
    setShowEstimates(true);
  };

  const handleSubmit = async () => {
    setIsSearching(true);
    try {
      const response = await fetch('/api/search/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: description || '未命名搜尋',
          criteria: {
            queryText: description,
            countries,
            industries,
            keywords,
            companyTypes,
            targetCount
          },
          autoStart: true
        })
      });

      if (response.ok) {
        const task = await response.json();
        router.push(`/search/${task.id}`);
      } else {
        router.push('/search/results');
      }
      onClose();
    } catch (error) {
      console.error('Failed to create task', error);
      router.push('/search/results');
      onClose();
    } finally {
      setIsSearching(false);
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch('/api/search/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: description || '未命名儲存條件',
          criteria: {
            queryText: description,
            countries,
            industries,
            keywords,
            companyTypes,
            targetCount
          }
        })
      });

      if (response.ok) {
        alert('條件已儲存！');
      } else {
        alert('儲存失敗，請重試。');
      }
    } catch (error) {
      console.error('Failed to save criteria', error);
      alert('儲存失敗，請重試。');
    }
  };

  const handleReset = () => {
    setDescription('');
    setCountries([]);
    setIndustries([]);
    setKeywords([]);
    setCompanyTypes([]);
    setTargetCount(50);
    setShowEstimates(false);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>建立搜尋任務</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {savedSearches.length > 0 && (
          <div className={styles.section} style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
            <h3 className={styles.sectionTitle} style={{ fontSize: '13px', color: '#a1a1aa' }}>快速載入已儲存條件</h3>
            <select
              className={styles.textarea}
              style={{ height: '38px', padding: '0 12px', cursor: 'pointer' }}
              value={selectedSavedId}
              onChange={e => handleSelectSaved(e.target.value)}
            >
              <option value="">-- 選擇已儲存的搜尋條件 --</option>
              {savedSearches.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name || item.criteriaJson?.queryText || '未命名條件'} ({new Date(item.createdAt).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>自然語言描述</h3>
          <textarea
            className={styles.textarea}
            rows={3}
            placeholder="描述您想尋找的目標企業，例如：位於日本的食品包裝機械製造商，具備出口經驗..."
            value={description}
            onChange={e => {
              setDescription(e.target.value);
              setShowEstimates(true);
            }}
          />
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>結構化篩選器</h3>
          <div className={styles.filtersGrid}>
            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>目標國家</span>
              <TagInput
                tags={countries}
                onAdd={tag => { setCountries([...countries, tag]); setShowEstimates(true); }}
                onRemove={tag => { setCountries(countries.filter(t => t !== tag)); setShowEstimates(true); }}
                placeholder="輸入國家並按 Enter"
                suggestions={COUNTRY_SUGGESTIONS}
              />
            </div>
            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>產業別</span>
              <TagInput
                tags={industries}
                onAdd={tag => { setIndustries([...industries, tag]); setShowEstimates(true); }}
                onRemove={tag => { setIndustries(industries.filter(t => t !== tag)); setShowEstimates(true); }}
                placeholder="輸入產業並按 Enter"
                suggestions={INDUSTRY_SUGGESTIONS}
              />
            </div>
          </div>

          <div className={styles.filterGroup} style={{ marginBottom: '16px' }}>
            <span className={styles.filterLabel}>公司類型</span>
            <div className={styles.checkboxGroup}>
              {COMPANY_TYPES.map(type => (
                <label key={type} className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={companyTypes.includes(type)}
                    onChange={() => toggleCompanyType(type)}
                  />
                  {type}
                </label>
              ))}
            </div>
          </div>

          <div className={styles.filtersGrid}>
            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>關鍵字</span>
              <TagInput
                tags={keywords}
                onAdd={tag => { setKeywords([...keywords, tag]); setShowEstimates(true); }}
                onRemove={tag => { setKeywords(keywords.filter(t => t !== tag)); setShowEstimates(true); }}
                placeholder="輸入關鍵字並按 Enter"
              />
            </div>
            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>目標數量</span>
              <div className={styles.sliderContainer}>
                <input
                  type="range"
                  min="10"
                  max="500"
                  step="10"
                  className={styles.slider}
                  value={targetCount}
                  onChange={e => {
                    setTargetCount(Number(e.target.value));
                    setShowEstimates(true);
                  }}
                />
                <input
                  type="number"
                  className={styles.numberInput}
                  value={targetCount}
                  onChange={e => {
                    setTargetCount(Number(e.target.value));
                    setShowEstimates(true);
                  }}
                  min="10"
                  max="500"
                />
              </div>
            </div>
          </div>
        </div>

        {showEstimates && (
          <div className={styles.estimatePanel}>
            <div className={styles.estimateItem}>
              <span className={styles.estimateLabel}>預估結果數</span>
              <span className={`${styles.estimateValue} ${styles.primary}`}>~{targetCount * 1.5} 筆</span>
            </div>
            <div className={styles.estimateItem}>
              <span className={styles.estimateLabel}>預估時間</span>
              <span className={styles.estimateValue}>約 {Math.ceil(targetCount / 10)} 分鐘</span>
            </div>
            <div className={styles.estimateItem}>
              <span className={styles.estimateLabel}>預估成本</span>
              <span className={styles.estimateValue}>${(targetCount * 0.1).toFixed(2)}</span>
            </div>
          </div>
        )}

        <div className={styles.actions}>
          <button className={`${styles.btn} ${styles.btnGhost}`} onClick={handleReset}>
            重設
          </button>
          <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={handleSave}>
            儲存條件
          </button>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleSubmit} disabled={isSearching}>
            {isSearching ? '⏳ 搜尋引擎抓取中...' : '開始搜尋'}
          </button>
        </div>
      </div>
    </div>
  );
}
