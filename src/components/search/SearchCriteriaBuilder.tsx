'use client';

import React, { useState, useEffect, KeyboardEvent } from 'react';
import { X, Check, Languages, ArrowDown, Loader2, Sparkles } from 'lucide-react';
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

  // AI Optimization preview state
  type OptimizedData = { description: string; industries: string[]; companyTypes: string[]; keywords: string[]; langCode: string; langName: string };
  const [showPreview, setShowPreview] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedData, setOptimizedData] = useState<Record<string, OptimizedData>>({});
  const [previewTab, setPreviewTab] = useState('');
  const [optimizeError, setOptimizeError] = useState('');

  // AI Translation state
  const [translateInput, setTranslateInput] = useState('');
  const [translateLang, setTranslateLang] = useState('ja');
  const [translateResult, setTranslateResult] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translateError, setTranslateError] = useState('');

  const TRANSLATE_LANGS = [
    { code: 'ja', name: '日文', flag: '🇯🇵' },
    { code: 'en', name: '英文', flag: '🇺🇸' },
    { code: 'ko', name: '韓文', flag: '🇰🇷' },
    { code: 'vi', name: '越南文', flag: '🇻🇳' },
    { code: 'th', name: '泰文', flag: '🇹🇭' },
    { code: 'de', name: '德文', flag: '🇩🇪' },
    { code: 'fr', name: '法文', flag: '🇫🇷' },
    { code: 'es', name: '西班牙文', flag: '🇪🇸' },
    { code: 'id', name: '印尼文', flag: '🇮🇩' },
    { code: 'ms', name: '馬來文', flag: '🇲🇾' },
  ];

  const handleTranslate = async () => {
    if (!translateInput.trim()) return;
    setIsTranslating(true);
    setTranslateError('');
    setTranslateResult('');
    try {
      const res = await fetch('/api/ai/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: translateInput, targetLang: translateLang }),
      });
      const data = await res.json();
      if (res.ok && data.translatedText) {
        setTranslateResult(data.translatedText);
      } else {
        setTranslateError(data.error || '翻譯失敗');
      }
    } catch (e: any) {
      setTranslateError(e.message);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleImportTranslation = () => {
    if (translateResult) {
      setDescription(translateResult);
      setShowEstimates(true);
    }
  };

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
  const CUSTOMER_TYPES = [
    '咖啡連鎖品牌', '手搖飲品牌', '早餐店連鎖', '冰品與甜點品牌',
    '食品包材進口商', '餐飲耗材經銷商', '食品容器批發商',
    '活動與展覽用品供應商', '航空/飯店/餐飲集團', '酒商與酒展活動商',
  ];
  const COUNTRY_SUGGESTIONS = ['台灣', '日本', '美國', '韓國', '越南', '泰國', '德國'];
  const INDUSTRY_SUGGESTIONS = ['半導體', '電子零組件', '機械設備', '食品加工', '軟體服務'];

  // Country-specific industry suggestions in local language
  const COUNTRY_INDUSTRIES: Record<string, { label: string; local: string }[]> = {
    '日本': [
      { label: '食品加工', local: '食品加工' },
      { label: '機械設備', local: '機械設備' },
      { label: '汽車零件', local: '自動車部品' },
      { label: '電子零件', local: '電子部品' },
      { label: '化學材料', local: '化学材料' },
      { label: '包裝材料', local: '包装資材' },
      { label: '半導體', local: '半導体' },
      { label: '醫療器材', local: '医療機器' },
      { label: '精密儀器', local: '精密機器' },
      { label: '金屬加工', local: '金属加工' },
    ],
    '台灣': [
      { label: '半導體', local: '半導體' },
      { label: '電子零組件', local: '電子零組件' },
      { label: '機械設備', local: '機械設備' },
      { label: '食品加工', local: '食品加工' },
      { label: '塑膠製品', local: '塑膠製品' },
      { label: '紡織成衣', local: '紡織成衣' },
      { label: '化學材料', local: '化學材料' },
      { label: '金屬製品', local: '金屬製品' },
      { label: '光電產業', local: '光電產業' },
      { label: '生技醫藥', local: '生技醫藥' },
    ],
    '美國': [
      { label: '軟體服務', local: 'Software & SaaS' },
      { label: '醫療設備', local: 'Medical Devices' },
      { label: '航太國防', local: 'Aerospace & Defense' },
      { label: '汽車零件', local: 'Auto Parts' },
      { label: '食品飲料', local: 'Food & Beverage' },
      { label: '化工材料', local: 'Chemicals' },
      { label: '電子元件', local: 'Electronics' },
      { label: '農業設備', local: 'Agriculture Equipment' },
      { label: '能源設備', local: 'Energy Equipment' },
      { label: '包裝材料', local: 'Packaging' },
    ],
    '越南': [
      { label: '紡織成衣', local: 'Dệt may' },
      { label: '食品加工', local: 'Chế biến thực phẩm' },
      { label: '電子組裝', local: 'Lắp ráp điện tử' },
      { label: '木材家具', local: 'Gỗ và nội thất' },
      { label: '塑膠製品', local: 'Nhựa' },
      { label: '水產養殖', local: 'Thủy sản' },
      { label: '機械設備', local: 'Máy móc thiết bị' },
      { label: '皮革鞋業', local: 'Da giày' },
    ],
    '泰國': [
      { label: '食品加工', local: 'แปรรูปอาหาร' },
      { label: '汽車零件', local: 'ชิ้นส่วนยานยนต์' },
      { label: '電子產品', local: 'อิเล็กทรอนิกส์' },
      { label: '橡膠製品', local: 'ผลิตภัณฑ์ยาง' },
      { label: '塑膠製品', local: 'พลาสติก' },
      { label: '紡織服裝', local: 'สิ่งทอ' },
      { label: '珠寶首飾', local: 'อัญมณี' },
      { label: '農產加工', local: 'เกษตรแปรรูป' },
    ],
    '德國': [
      { label: '機械工程', local: 'Maschinenbau' },
      { label: '汽車工業', local: 'Automobilindustrie' },
      { label: '化學工業', local: 'Chemische Industrie' },
      { label: '電氣工程', local: 'Elektrotechnik' },
      { label: '醫療技術', local: 'Medizintechnik' },
      { label: '金屬加工', local: 'Metallverarbeitung' },
      { label: '食品飲料', local: 'Lebensmittel' },
      { label: '包裝技術', local: 'Verpackungstechnik' },
    ],
    '韓國': [
      { label: '半導體', local: '반도체' },
      { label: '電子產品', local: '전자제품' },
      { label: '汽車零件', local: '자동차 부품' },
      { label: '造船工業', local: '조선업' },
      { label: '化學材料', local: '화학소재' },
      { label: '食品加工', local: '식품가공' },
      { label: '美容化妝', local: '화장품' },
      { label: '機械設備', local: '기계장비' },
    ],
  };

  // Get suggested industries for selected countries
  const suggestedIndustries = countries.length > 0
    ? (COUNTRY_INDUSTRIES[countries[0]] || []).filter(
        ind => !industries.includes(ind.local) && !industries.includes(ind.label)
      )
    : [];



  const toggleCompanyType = (type: string) => {
    setCompanyTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
    setShowEstimates(true);
  };

  const handleSubmit = async () => {
    // If countries selected, optimize first
    if (countries.length > 0) {
      setIsOptimizing(true);
      setOptimizeError('');
      setShowPreview(true);
      try {
        const res = await fetch('/api/ai/optimize-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            criteria: { queryText: description, countries, industries, companyTypes, keywords },
            targetCountries: countries,
          }),
        });
        const data = await res.json();
        if (res.ok && data.optimized) {
          setOptimizedData(data.optimized);
          setPreviewTab(countries[0]);
        } else {
          setOptimizeError(data.error || '優化失敗');
        }
      } catch (e: any) {
        setOptimizeError(e.message);
      } finally {
        setIsOptimizing(false);
      }
      return;
    }
    // No countries — search directly
    await executeSearch();
  };

  const executeSearch = async (overrideCriteria?: Record<string, OptimizedData>) => {
    setIsSearching(true);
    setShowPreview(false);
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
            targetCount,
            ...(overrideCriteria ? { optimizedCriteria: overrideCriteria } : {}),
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

  const handleConfirmOptimized = () => {
    executeSearch(optimizedData);
  };

  const updateOptimizedField = (country: string, field: keyof OptimizedData, value: string) => {
    setOptimizedData(prev => ({
      ...prev,
      [country]: {
        ...prev[country],
        [field]: field === 'description' ? value : value.split(',').map(s => s.trim()).filter(Boolean),
      },
    }));
  };

  const handleSave = async () => {
    // Build descriptive name from filters
    const parts: string[] = [];
    if (description) parts.push(description);
    if (countries.length > 0) parts.push(`🌍${countries.join('/')}`);
    if (industries.length > 0) parts.push(`🏭${industries.join('/')}`);
    if (keywords.length > 0) parts.push(`🔑${keywords.join('/')}`);
    if (companyTypes.length > 0) parts.push(`🏢${companyTypes.join('/')}`);
    const saveName = parts.join(' · ') || '未命名儲存條件';

    try {
      const response = await fetch('/api/search/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: saveName,
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
        const saved = await response.json();
        // Add to local list immediately
        setSavedSearches(prev => [saved, ...prev]);
        alert('✅ 條件已儲存！');
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
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>建立搜尋任務</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {savedSearches.length > 0 && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle} style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>快速載入已儲存條件</h3>
            <select
              className={styles.selectField}
              value={selectedSavedId}
              onChange={e => handleSelectSaved(e.target.value)}
            >
              <option value="">-- 選擇已儲存的搜尋條件 --</option>
              {savedSearches.map(item => {
                const crit = item.criteriaJson || {};
                const tags: string[] = [];
                if (crit.countries?.length) tags.push(`🌍${crit.countries.join('/')}`);
                if (crit.industries?.length) tags.push(`🏭${crit.industries.join('/')}`);
                if (crit.companyTypes?.length) tags.push(`🏢${crit.companyTypes.join('/')}`);
                const label = crit.queryText || item.name || '未命名條件';
                const tagStr = tags.length > 0 ? ` [${tags.join(' ')}]` : '';
                const dateStr = new Date(item.createdAt).toLocaleDateString();
                return (
                  <option key={item.id} value={item.id}>
                    {label}{tagStr} ({dateStr})
                  </option>
                );
              })}
            </select>
          </div>
        )}

        {/* Natural Language Description + AI Translation */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>自然語言描述</h3>

          {/* AI Translation inline helper — FIRST: input Chinese here */}
          <div className={styles.translateBlock}>
            <div className={styles.translateRow}>
              <input
                type="text"
                className={styles.translateInput}
                placeholder="輸入中文，AI 翻譯成目標語言後導入下方欄位"
                value={translateInput}
                onChange={e => setTranslateInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleTranslate(); }}}
              />
              <select
                className={styles.langSelect}
                value={translateLang}
                onChange={e => setTranslateLang(e.target.value)}
              >
                {TRANSLATE_LANGS.map(l => (
                  <option key={l.code} value={l.code}>{l.flag} {l.name}</option>
                ))}
              </select>
              <button
                className={styles.translateBtn}
                onClick={handleTranslate}
                disabled={isTranslating || !translateInput.trim()}
              >
                {isTranslating ? <Loader2 size={14} className={styles.spinning} /> : <Languages size={14} />}
                {isTranslating ? '翻譯中' : 'AI 翻譯'}
              </button>
            </div>
            {translateError && (
              <div className={styles.translateError}>❌ {translateError}</div>
            )}
            {translateResult && (
              <div className={styles.translateResult}>
                <span className={styles.translateResultText}>{translateResult}</span>
                <button className={styles.importBtn} onClick={handleImportTranslation}>
                  <ArrowDown size={12} />
                  導入 ↓
                </button>
              </div>
            )}
          </div>

          {/* Description textarea — SECOND: translated result imports here */}
          <textarea
            className={styles.textarea}
            rows={2}
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

          {/* Country quick select chips */}
          <div className={styles.quickChipsRow}>
            <span className={styles.suggestLabel}>🌍 快速選擇國家：</span>
            <div className={styles.suggestChips}>
              {COUNTRY_SUGGESTIONS.filter(c => !countries.includes(c)).map(c => (
                <button
                  key={c}
                  className={styles.suggestChip}
                  onClick={() => { setCountries([...countries, c]); setShowEstimates(true); }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Country-based industry suggestions - full width */}
          {suggestedIndustries.length > 0 && (
            <div className={styles.quickChipsRow}>
              <span className={styles.suggestLabel}>🏭 {countries[0]}熱門產業（點擊加入）：</span>
              <div className={styles.suggestChips}>
                {suggestedIndustries.map(ind => (
                  <button
                    key={ind.local}
                    className={`${styles.suggestChip} ${styles.suggestChipIndustry}`}
                    onClick={() => { setIndustries([...industries, ind.local]); setShowEstimates(true); }}
                    title={`${ind.label}（${ind.local}）`}
                  >
                    {ind.local}
                  </button>
                ))}
              </div>
            </div>
          )}

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
            <span className={styles.filterLabel} style={{ marginTop: 10 }}>目標客戶類型</span>
            <div className={styles.checkboxGroup}>
              {CUSTOMER_TYPES.map(type => (
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
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleSubmit} disabled={isSearching || isOptimizing}>
            {isSearching ? '⏳ 搜尋引擎抓取中...' : countries.length > 0 ? '✨ AI 優化並搜尋' : '開始搜尋'}
          </button>
        </div>
      </div>

      {/* AI Optimization Preview Panel */}
      {showPreview && (
        <div className={styles.previewOverlay} onClick={e => e.stopPropagation()}>
          <div className={styles.previewPanel}>
            {isOptimizing ? (
              <div className={styles.optimizingOverlay}>
                <div className={styles.optimizingSpinner} />
                <div className={styles.optimizingText}>🔄 AI 正在優化潝飾搜尋條件...</div>
                <div className={styles.optimizingSubtext}>將中文條件轉化為目標國家的商業搜尋用語</div>
              </div>
            ) : optimizeError ? (
              <div>
                <div className={styles.previewHeader}>
                  <span className={styles.previewTitle}>❌ 優化失敗</span>
                  <button className={styles.closeButton} onClick={() => setShowPreview(false)}><X size={20} /></button>
                </div>
                <p style={{ color: '#ef4444', marginBottom: 16 }}>{optimizeError}</p>
                <div className={styles.previewActions}>
                  <button className={styles.previewBackBtn} onClick={() => setShowPreview(false)}>返回修改</button>
                  <button className={styles.previewConfirmBtn} onClick={() => executeSearch()}>跳過優化，直接搜尋</button>
                </div>
              </div>
            ) : (
              <div>
                <div className={styles.previewHeader}>
                  <span className={styles.previewTitle}>
                    <Sparkles size={20} style={{ color: 'var(--color-primary)' }} />
                    搜尋條件優化預覽
                  </span>
                  <button className={styles.closeButton} onClick={() => setShowPreview(false)}><X size={20} /></button>
                </div>

                {/* Country Tabs */}
                {Object.keys(optimizedData).length > 1 && (
                  <div className={styles.previewTabs}>
                    {Object.keys(optimizedData).map(c => (
                      <button
                        key={c}
                        className={`${styles.previewTab} ${previewTab === c ? styles.previewTabActive : ''}`}
                        onClick={() => setPreviewTab(c)}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}

                {/* Preview Fields */}
                {optimizedData[previewTab] && (
                  <div>
                    <div className={styles.previewField}>
                      <div className={styles.previewFieldLabel}>搜尋描述</div>
                      <div className={styles.previewOriginal}>原始：{description}</div>
                      <input
                        className={styles.previewInput}
                        value={optimizedData[previewTab].description}
                        onChange={e => updateOptimizedField(previewTab, 'description', e.target.value)}
                      />
                    </div>

                    {optimizedData[previewTab].industries?.length > 0 && (
                      <div className={styles.previewField}>
                        <div className={styles.previewFieldLabel}>產業別</div>
                        <div className={styles.previewOriginal}>原始：{industries.join(', ')}</div>
                        <input
                          className={styles.previewInput}
                          value={optimizedData[previewTab].industries.join(', ')}
                          onChange={e => updateOptimizedField(previewTab, 'industries', e.target.value)}
                        />
                      </div>
                    )}

                    {optimizedData[previewTab].companyTypes?.length > 0 && (
                      <div className={styles.previewField}>
                        <div className={styles.previewFieldLabel}>公司/客戶類型</div>
                        <div className={styles.previewOriginal}>原始：{companyTypes.join(', ')}</div>
                        <input
                          className={styles.previewInput}
                          value={optimizedData[previewTab].companyTypes.join(', ')}
                          onChange={e => updateOptimizedField(previewTab, 'companyTypes', e.target.value)}
                        />
                      </div>
                    )}

                    {optimizedData[previewTab].keywords?.length > 0 && (
                      <div className={styles.previewField}>
                        <div className={styles.previewFieldLabel}>關鍵字</div>
                        <div className={styles.previewOriginal}>原始：{keywords.join(', ')}</div>
                        <input
                          className={styles.previewInput}
                          value={optimizedData[previewTab].keywords.join(', ')}
                          onChange={e => updateOptimizedField(previewTab, 'keywords', e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                )}

                <div className={styles.previewActions}>
                  <button className={styles.previewBackBtn} onClick={() => setShowPreview(false)}>
                    返回修改
                  </button>
                  <button
                    className={styles.previewConfirmBtn}
                    onClick={handleConfirmOptimized}
                    disabled={isSearching}
                  >
                    <Sparkles size={16} />
                    {isSearching ? '搜尋中...' : '✅ 確認並開始搜尋'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
