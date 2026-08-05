'use client';

import React, { useState, useEffect, KeyboardEvent } from 'react';
import { X, Check, Languages, ArrowDown, Loader2, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Portal from '@/components/ui/Portal';
import BrowserKeyModal from '@/components/ai/BrowserKeyModal';
import { callGemini, DEFAULT_GEMINI_MODEL } from '@/lib/ai/gemini';
import { getBrowserGeminiKey, resolveModel } from '@/lib/ai/browserKey';
import {
  buildTranslatePrompt, buildOptimizePrompt, parseOptimizeResponse,
  type OptimizedResult, type SuggestionTerm,
} from '@/lib/ai/prompts';
import { COUNTRIES, getCountry } from '@/lib/search/countries';
import styles from './SearchCriteriaBuilder.module.css';

/**
 * One row of AI-suggested terms for a single criteria field.
 *
 * Each chip shows the local term with a Chinese gloss, because the user reads
 * Chinese while the terms are Japanese/Korean/Thai — without the gloss the
 * suggestions cannot be reviewed, only accepted on faith. Terms already on the
 * form stay visible as "added" rather than disappearing, so the row does not
 * reflow underneath the cursor while clicking through it.
 */
function SuggestGroup({
  label, terms, current, onAdd, onAddAll,
}: {
  label: string;
  terms: SuggestionTerm[];
  current: string[];
  onAdd: (t: SuggestionTerm) => void;
  onAddAll: () => void;
}) {
  if (terms.length === 0) return null;
  const remaining = terms.filter(t => !current.includes(t.local)).length;

  return (
    <div className={styles.suggestGroup}>
      <span className={styles.suggestGroupLabel}>{label}</span>
      <div className={styles.suggestChipsRow}>
        {terms.map(t => {
          const added = current.includes(t.local);
          return (
            <button
              key={t.local}
              className={`${styles.aiChip} ${added ? styles.aiChipAdded : ''}`}
              onClick={() => !added && onAdd(t)}
              disabled={added}
              title={added ? '已加入' : `加入「${t.local}」`}
            >
              {added ? '✓ ' : '+ '}{t.local}
              {t.zh && <span className={styles.aiChipZh}>（{t.zh}）</span>}
            </button>
          );
        })}
        {remaining > 1 && (
          <button className={styles.aiChipAll} onClick={onAddAll}>全部加入（{remaining}）</button>
        )}
      </div>
    </div>
  );
}

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
  // One country per task. Multi-country runs spent AI tokens per country and
  // then merged everything into a single query that could only carry one
  // country's geo bias anyway, so the extra countries cost money and made the
  // results worse. Stored as an array because criteriaJson and the search
  // service still speak that shape.
  const [country, setCountry] = useState<string>('');
  const countries = country ? [country] : [];
  const [industries, setIndustries] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [companyTypes, setCompanyTypes] = useState<string[]>([]);
  const [targetCount, setTargetCount] = useState<number>(50);
  
  const [savedSearches, setSavedSearches] = useState<any[]>([]);
  const [selectedSavedId, setSelectedSavedId] = useState<string>('');

  const [isEstimating, setIsEstimating] = useState(false);
  const [showEstimates, setShowEstimates] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  // AI Optimization preview state
  type OptimizedData = OptimizedResult;
  const [showPreview, setShowPreview] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedData, setOptimizedData] = useState<Record<string, OptimizedData>>({});
  const [previewTab, setPreviewTab] = useState('');
  const [optimizeError, setOptimizeError] = useState('');

  /**
   * Result of the "AI 建議條件" button: the suggested terms shown as chips, and
   * the queries that will be searched. Holding both from one call is what keeps
   * the normal path at a single AI request — pressing 搜尋 without touching
   * anything reuses this rather than asking the model again.
   */
  const [suggestion, setSuggestion] = useState<OptimizedResult | null>(null);
  const [suggestionCountry, setSuggestionCountry] = useState('');
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestError, setSuggestError] = useState('');
  /**
   * Set whenever a criteria field changes after a suggestion arrived. The
   * cached queries were derived from the old fields, so reusing them would
   * silently ignore the edit — the same "editing does nothing" trap the
   * preview panel used to have. Stale means 搜尋 re-runs the optimizer.
   */
  const [suggestionStale, setSuggestionStale] = useState(false);
  const [showQueries, setShowQueries] = useState(false);

  // Every criteria mutation funnels through this, so no field can change
  // without invalidating the cached queries.
  const touched = () => { setShowEstimates(true); setSuggestionStale(true); };

  // AI Translation state
  const [translateInput, setTranslateInput] = useState('');
  const [translateLang, setTranslateLang] = useState('ja');
  const [translateResult, setTranslateResult] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translateError, setTranslateError] = useState('');

  // Which side makes the Gemini call. In 'browser' mode the request goes out
  // from the user's own network with their own key, because Google rejects the
  // server's datacenter IP.
  const [aiCallMode, setAiCallMode] = useState<'server' | 'browser'>('server');
  const [aiModel, setAiModel] = useState(DEFAULT_GEMINI_MODEL);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [hasBrowserKey, setHasBrowserKey] = useState(false);

  useEffect(() => {
    // Both updates run inside the promise chain: localStorage is only readable
    // after hydration, and setting state synchronously in an effect body would
    // trigger an extra render pass before the config has even arrived.
    fetch('/api/ai/config')
      .then(r => (r.ok ? r.json() : null))
      .then(cfg => {
        if (cfg?.aiCallMode) setAiCallMode(cfg.aiCallMode);
        if (cfg?.aiModel) setAiModel(cfg.aiModel);
      })
      .catch(() => { /* fall back to server mode */ })
      .finally(() => setHasBrowserKey(Boolean(getBrowserGeminiKey())));
  }, []);

  const browserMode = aiCallMode === 'browser';
  // In browser mode the user must supply their own key before AI can run.
  const needsOwnKey = browserMode && !hasBrowserKey;

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
    if (needsOwnKey) { setShowKeyModal(true); return; }

    setIsTranslating(true);
    setTranslateError('');
    setTranslateResult('');
    // Only pass the country when it actually speaks the language being
    // translated into — it sharpens regional wording (a UK "stockist" vs a US
    // "distributor"), but claiming the wrong region would be worse than none.
    const translateCountry =
      getCountry(country)?.langCode === translateLang ? country : undefined;
    try {
      if (browserMode) {
        // Same prompt builder the server route uses, so both modes behave alike.
        const text = await callGemini(
          getBrowserGeminiKey(),
          // The user's own model choice wins over the team default, because in
          // browser mode the request is billed against their own quota.
          resolveModel(aiModel),
          buildTranslatePrompt(translateInput, translateLang, translateCountry),
          { temperature: 0.3, maxOutputTokens: 500 }
        );
        setTranslateResult(text);
      } else {
        const res = await fetch('/api/ai/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: translateInput, targetLang: translateLang, country: translateCountry }),
        });
        const data = await res.json();
        if (res.ok && data.translatedText) {
          setTranslateResult(data.translatedText);
        } else {
          setTranslateError(data.error || '翻譯失敗');
        }
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
    // Saved searches predating the single-country rule may hold several;
    // take the first rather than silently dropping the whole field.
    setCountry(crit.countries?.[0] || '');
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
    touched();
  };

  /**
   * One AI call against the criteria as they currently stand. Shared by the
   * 建議 button and the fallback path in handleSubmit, so both always send an
   * identical prompt.
   */
  const runOptimize = async (): Promise<OptimizedResult> => {
    const criteria = { queryText: description, industries, companyTypes, keywords };

    if (browserMode) {
      const raw = await callGemini(
        getBrowserGeminiKey(),
        resolveModel(aiModel),
        buildOptimizePrompt(criteria, country),
        // 0.7, not 0.4: the job is four genuinely different angles on the same
        // goal, and a low temperature just rephrases the first one.
        { temperature: 0.7, maxOutputTokens: 1500 },
      );
      return parseOptimizeResponse(raw, country);
    }

    const res = await fetch('/api/ai/optimize-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ criteria, targetCountry: country }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '優化失敗');
    const result = data.optimized?.[country];
    if (!result) throw new Error('AI 未取得任何結果');
    return result;
  };

  /** "AI 建議條件" — fills the criteria fields before the user searches. */
  const handleSuggest = async () => {
    if (!description.trim() || !country) return;
    if (needsOwnKey) { setShowKeyModal(true); return; }

    setIsSuggesting(true);
    setSuggestError('');
    try {
      const result = await runOptimize();
      setSuggestion(result);
      setSuggestionCountry(country);
      // Produced from the fields exactly as they stand, so it starts fresh;
      // any later edit flips this.
      setSuggestionStale(false);
      setShowQueries(false);
    } catch (e: any) {
      console.error('[AI] Suggest failed:', e);
      setSuggestError(e.message || String(e));
    } finally {
      setIsSuggesting(false);
    }
  };

  /** Adds suggested terms to a field, skipping ones already present. */
  const addTerms = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    current: string[],
    terms: SuggestionTerm[],
  ) => {
    const additions = terms.map(t => t.local).filter(t => !current.includes(t));
    if (additions.length === 0) return;
    setter([...current, ...additions]);
    touched();
  };

  /** True when the cached suggestion still matches what is on the form. */
  const suggestionUsable = Boolean(
    suggestion && suggestionCountry === country && !suggestionStale && suggestion.queries.length > 0
  );

  const handleSubmit = async () => {
    // Already reviewed a suggestion and changed nothing since — search on it
    // directly. This is what keeps the normal path at one AI call, and it
    // skips a confirmation dialog for something already seen.
    if (suggestionUsable) {
      await executeSearch({ [country]: suggestion! });
      return;
    }

    // A country is what makes optimization meaningful — it selects the
    // language and the local trade vocabulary. Without one, search directly.
    if (country) {
      if (needsOwnKey) { setShowKeyModal(true); return; }

      setIsOptimizing(true);
      setOptimizeError('');
      setShowPreview(true);
      try {
        const result = await runOptimize();
        setOptimizedData({ [country]: result });
        setPreviewTab(country);
      } catch (e: any) {
        console.error('[AI] Optimize failed:', e);
        setOptimizeError(e.message || String(e));
      } finally {
        setIsOptimizing(false);
      }
      return;
    }
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
        onClose();
        return;
      }
      // Don't close the modal on failure — the user loses their criteria and
      // lands on an empty results pool with no idea what went wrong.
      const data = await response.json().catch(() => ({}));
      setSearchError(data.error || `建立搜尋任務失敗（HTTP ${response.status}）`);
    } catch (error: any) {
      console.error('Failed to create task', error);
      setSearchError(error.message || '建立搜尋任務失敗');
    } finally {
      setIsSearching(false);
    }
  };

  const handleConfirmOptimized = () => {
    executeSearch(optimizedData);
  };

  /**
   * The one comma-separated field left editable in the preview. Narrowed to
   * 'excludeTerms' on purpose: the other term lists are {local, zh} objects
   * now, and they are not sent to the search anyway, so a generic setter here
   * would only make it easy to reintroduce an editor that changes nothing.
   */
  const updateExcludeTerms = (country: string, value: string) => {
    setOptimizedData(prev => ({
      ...prev,
      [country]: {
        ...prev[country],
        excludeTerms: value.split(',').map(s => s.trim()).filter(Boolean),
      },
    }));
  };

  /** One search query line. Blanking a line drops it from the run. */
  const updateOptimizedQuery = (country: string, index: number, value: string) => {
    setOptimizedData(prev => {
      const queries = [...(prev[country]?.queries || [])];
      queries[index] = value;
      return { ...prev, [country]: { ...prev[country], queries } };
    });
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
    setCountry('');
    setIndustries([]);
    setKeywords([]);
    setCompanyTypes([]);
    setTargetCount(50);
    setShowEstimates(false);
  };

  return (
    <Portal>
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <h3 className={styles.sectionTitle} style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: 0 }}>快速載入已儲存條件</h3>
              {selectedSavedId && (
                <button
                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 4 }}
                  onClick={async () => {
                    if (!confirm('確定要刪除此儲存條件？')) return;
                    try {
                      await fetch(`/api/search/saved/${selectedSavedId}`, { method: 'DELETE' });
                      setSavedSearches(prev => prev.filter(s => s.id !== selectedSavedId));
                      setSelectedSavedId('');
                    } catch (e) { console.error(e); }
                  }}
                >
                  <X size={14} /> 刪除
                </button>
              )}
            </div>
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
                const label = (crit.queryText || item.name || '未命名條件').slice(0, 30);
                const tagStr = tags.length > 0 ? ` [${tags.join(' ')}]` : '';
                const dateStr = new Date(item.createdAt).toLocaleDateString();
                const fullText = `${label}${tagStr} (${dateStr})`;
                const display = fullText.length > 55 ? fullText.slice(0, 55) + '…' : fullText;
                return (
                  <option key={item.id} value={item.id}>
                    {display}
                  </option>
                );
              })}
            </select>
          </div>
        )}

        {/* Natural Language Description + AI Translation */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>自然語言描述</h3>

          {/* In browser mode the AI runs on the user's own key, so surface its
              state here rather than letting the action fail with a vague error. */}
          {browserMode && (
            <div className={hasBrowserKey ? styles.keyBarOk : styles.keyBarWarn}>
              <span>
                {hasBrowserKey
                  ? '🔑 AI 使用您自己的 Gemini 金鑰（存在本機瀏覽器）'
                  : '⚠️ AI 功能需要您自己的 Gemini 金鑰，請先設定'}
              </span>
              <button type="button" className={styles.keyBarBtn} onClick={() => setShowKeyModal(true)}>
                {hasBrowserKey ? '管理金鑰' : '設定金鑰'}
              </button>
            </div>
          )}

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
              touched();
            }}
          />

          {/* One AI call turns the description into the four criteria fields.
              Explicitly triggered, never on keystroke: the free tier allows
              15 requests/minute, and a half-typed description suggests badly. */}
          <div className={styles.suggestRow}>
            <button
              className={styles.suggestBtn}
              onClick={handleSuggest}
              disabled={isSuggesting || !description.trim() || !country}
              title={
                !country ? '請先選擇目標國家——建議詞需要知道用哪種語言'
                  : !description.trim() ? '請先輸入搜尋描述'
                  : '依描述建議目標國家的產業別、關鍵字、公司類型與目標客戶類型'
              }
            >
              {isSuggesting ? <Loader2 size={14} className={styles.spinning} /> : <Sparkles size={14} />}
              {isSuggesting ? 'AI 分析中…' : 'AI 建議條件'}
            </button>
            <span className={styles.suggestHint}>
              {!country
                ? '選擇目標國家後即可使用'
                : `依描述產出 ${country} 當地用語的產業別、關鍵字、公司類型與目標客戶類型`}
            </span>
          </div>

          {suggestError && <div className={styles.translateError}>❌ {suggestError}</div>}

          {suggestion && suggestionCountry === country && (
            <div className={styles.suggestPanel}>
              <div className={styles.suggestPanelHead}>
                <span>✨ AI 建議（{suggestion.langName}，點擊加入，括號為中文對照）</span>
                {suggestionStale && (
                  <span className={styles.staleTag}>條件已變更，搜尋時會重新產生查詢語句</span>
                )}
              </div>

              <SuggestGroup
                label="產業別" terms={suggestion.industries} current={industries}
                onAdd={t => addTerms(setIndustries, industries, [t])}
                onAddAll={() => addTerms(setIndustries, industries, suggestion.industries)}
              />
              <SuggestGroup
                label="關鍵字" terms={suggestion.keywords} current={keywords}
                onAdd={t => addTerms(setKeywords, keywords, [t])}
                onAddAll={() => addTerms(setKeywords, keywords, suggestion.keywords)}
              />
              {/* Both land in companyTypes — the form keeps one array, but the
                  AI separates the two axes so each appears under the heading
                  that says what it means. */}
              <SuggestGroup
                label="公司類型（要找的對象）" terms={suggestion.companyTypes} current={companyTypes}
                onAdd={t => addTerms(setCompanyTypes, companyTypes, [t])}
                onAddAll={() => addTerms(setCompanyTypes, companyTypes, suggestion.companyTypes)}
              />
              <SuggestGroup
                label="目標客戶類型（對方服務的客群）" terms={suggestion.customerTypes} current={companyTypes}
                onAdd={t => addTerms(setCompanyTypes, companyTypes, [t])}
                onAddAll={() => addTerms(setCompanyTypes, companyTypes, suggestion.customerTypes)}
              />

              <button className={styles.queriesToggle} onClick={() => setShowQueries(v => !v)}>
                {showQueries ? '▾' : '▸'} 查看 AI 產生的 {suggestion.queries.length} 條搜尋語句
              </button>
              {showQueries && (
                <div className={styles.queriesBox}>
                  {suggestion.queries.map((q, i) => <div key={i} className={styles.queryLine}>{q}</div>)}
                  {suggestion.excludeTerms.length > 0 && (
                    <div className={styles.queryExclude}>排除：{suggestion.excludeTerms.join('、')}</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>結構化篩選器</h3>
          <div className={styles.filtersGrid}>
            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>目標國家（單選）</span>
              {/* A dropdown, not free text: the country name keys the language,
                  TLD and geo-bias tables, and a typo used to fall through to a
                  prompt that asked the model to translate "into 義大利". */}
              <select
                className={styles.selectField}
                value={country}
                onChange={e => { setCountry(e.target.value); touched(); }}
              >
                <option value="">不指定國家</option>
                {COUNTRIES.map(c => (
                  <option key={c.name} value={c.name}>{c.name}（{c.en}）</option>
                ))}
              </select>
            </div>
            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>產業別</span>
              <TagInput
                tags={industries}
                onAdd={tag => { setIndustries([...industries, tag]); touched(); }}
                onRemove={tag => { setIndustries(industries.filter(t => t !== tag)); touched(); }}
                placeholder="輸入產業並按 Enter"
                suggestions={INDUSTRY_SUGGESTIONS}
              />
            </div>
          </div>

          {/* Country quick select chips */}
          <div className={styles.quickChipsRow}>
            <span className={styles.suggestLabel}>🌍 快速選擇國家：</span>
            <div className={styles.suggestChips}>
              {COUNTRY_SUGGESTIONS.map(c => (
                <button
                  key={c}
                  className={`${styles.suggestChip} ${country === c ? styles.suggestChipActive : ''}`}
                  onClick={() => { setCountry(country === c ? '' : c); touched(); }}
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
                    onClick={() => { setIndustries([...industries, ind.local]); touched(); }}
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
                onAdd={tag => { setKeywords([...keywords, tag]); touched(); }}
                onRemove={tag => { setKeywords(keywords.filter(t => t !== tag)); touched(); }}
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

        {searchError && (
          <div className={styles.submitError}>❌ {searchError}</div>
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

                {/* Preview Fields */}
                {optimizedData[previewTab] && (
                  <div>
                    {/* The queries are the part that actually reaches the
                        search engines — shown first, and one row each so a bad
                        one can be fixed or emptied without touching the rest. */}
                    <div className={styles.previewField}>
                      <div className={styles.previewFieldLabel}>
                        搜尋語句（{optimizedData[previewTab].langName}）— 實際送出的查詢
                      </div>
                      <div className={styles.previewOriginal}>原始：{description}</div>
                      {optimizedData[previewTab].queries.map((q, i) => (
                        <input
                          key={i}
                          className={styles.previewInput}
                          style={{ marginBottom: 6 }}
                          value={q}
                          onChange={e => updateOptimizedQuery(previewTab, i, e.target.value)}
                        />
                      ))}
                      {optimizedData[previewTab].queries.length === 0 && (
                        <div style={{ color: '#f59e0b', fontSize: '0.85rem' }}>
                          AI 未產生搜尋語句，將改用原始條件搜尋。
                        </div>
                      )}
                    </div>

                    {optimizedData[previewTab].excludeTerms?.length > 0 && (
                      <div className={styles.previewField}>
                        <div className={styles.previewFieldLabel}>排除詞（避開求人、購物商城、排行文章）</div>
                        <input
                          className={styles.previewInput}
                          value={optimizedData[previewTab].excludeTerms.join(', ')}
                          onChange={e => updateExcludeTerms(previewTab, e.target.value)}
                        />
                      </div>
                    )}

                    {/* Read-only, deliberately. Only queries and excludeTerms
                        above are sent to the search engines; these are what the
                        AI understood, shown so the queries can be judged. To
                        change them, close this and use「AI 建議條件」on the form,
                        where edits do feed back into the queries. */}
                    {(['industries', 'companyTypes', 'customerTypes', 'keywords'] as const).map(field => {
                      const terms = optimizedData[previewTab][field];
                      if (!terms?.length) return null;
                      const LABEL = {
                        industries: '產業別', companyTypes: '公司類型',
                        customerTypes: '目標客戶類型', keywords: '關鍵字',
                      }[field];
                      return (
                        <div className={styles.previewField} key={field}>
                          <div className={styles.previewFieldLabel}>{LABEL}（AI 理解，僅供參考）</div>
                          <div className={styles.previewTermList}>
                            {terms.map(t => (
                              <span key={t.local} className={styles.previewTerm}>
                                {t.local}{t.zh && <span className={styles.aiChipZh}>（{t.zh}）</span>}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
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

      {showKeyModal && (
        <BrowserKeyModal
          model={aiModel}
          onClose={() => setShowKeyModal(false)}
          onSaved={() => setHasBrowserKey(Boolean(getBrowserGeminiKey()))}
        />
      )}
    </div>
    </Portal>
  );
}
