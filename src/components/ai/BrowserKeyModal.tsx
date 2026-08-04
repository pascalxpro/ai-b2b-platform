'use client';

import React, { useState } from 'react';
import { X, Eye, EyeOff, ExternalLink, CheckCircle2, Loader2 } from 'lucide-react';
import Portal from '@/components/ui/Portal';
import { callGemini } from '@/lib/ai/gemini';
import {
  getBrowserGeminiKey, setBrowserGeminiKey, clearBrowserGeminiKey,
  getBrowserGeminiModel, setBrowserGeminiModel,
} from '@/lib/ai/browserKey';
import { GEMINI_MODELS, modelLabel, findModel } from '@/lib/ai/models';
import styles from './BrowserKeyModal.module.css';

export default function BrowserKeyModal({
  model: teamDefaultModel,
  onClose,
  onSaved,
}: {
  /** Team default configured by the admin; used when the user picks no override. */
  model: string;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const [key, setKey] = useState(getBrowserGeminiKey());
  // '' means "follow the team default" rather than pinning a specific model.
  const [modelOverride, setModelOverride] = useState(getBrowserGeminiModel());
  const [show, setShow] = useState(false);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const effectiveModel = modelOverride || teamDefaultModel;
  const effectiveInfo = findModel(effectiveModel);
  const defaultInfo = findModel(teamDefaultModel);

  const handleTest = async () => {
    setTesting(true);
    setResult(null);
    try {
      // Runs from this browser, which is the whole point: it proves the key
      // works from the user's own network, not from the blocked server. It also
      // tests the model actually selected, so an unavailable model shows up here.
      const reply = await callGemini(key.trim(), effectiveModel, '請回覆「連線成功」四個字。', {
        maxOutputTokens: 50,
      });
      setResult({ ok: true, message: `連線成功（${effectiveModel}）：${reply}` });
    } catch (e: any) {
      setResult({ ok: false, message: e.message || '測試失敗' });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    setBrowserGeminiKey(key);
    setBrowserGeminiModel(modelOverride);
    onSaved?.();
    onClose();
  };

  const handleClear = () => {
    clearBrowserGeminiKey();
    setBrowserGeminiModel('');
    setKey('');
    setModelOverride('');
    setResult(null);
    onSaved?.();
  };

  return (
    <Portal>
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.panel} onClick={e => e.stopPropagation()}>
          <div className={styles.header}>
            <h3>我的 Gemini API 金鑰</h3>
            <button className={styles.iconBtn} onClick={onClose}><X size={20} /></button>
          </div>

          <div className={styles.body}>
            <p className={styles.explain}>
              本系統的伺服器位於機房，Google 會封鎖來自機房 IP 的 Gemini 請求，
              因此 AI 功能改由<strong>您的瀏覽器</strong>直接呼叫。
            </p>

            <div className={styles.notice}>
              🔒 金鑰只會存在<strong>您這台電腦的瀏覽器</strong>，不會上傳到伺服器，
              也不會與其他同事共用。每個人各自擁有免費額度（每日 500 次），不用互相搶。
            </div>

            <label className={styles.field}>
              <span>Google AI API Key</span>
              <div className={styles.inputRow}>
                <input
                  type={show ? 'text' : 'password'}
                  value={key}
                  onChange={e => { setKey(e.target.value); setResult(null); }}
                  placeholder="AIza..."
                  autoComplete="off"
                  spellCheck={false}
                />
                <button type="button" className={styles.iconBtn} onClick={() => setShow(s => !s)}>
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            <a
              className={styles.link}
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
            >
              前往 Google AI Studio 免費取得金鑰 <ExternalLink size={13} />
            </a>

            <label className={styles.field}>
              <span>使用的模型</span>
              <select
                value={modelOverride}
                onChange={e => { setModelOverride(e.target.value); setResult(null); }}
                className={styles.select}
              >
                <option value="">
                  跟隨系統預設
                  {defaultInfo ? `（${defaultInfo.name}｜${defaultInfo.rpd}/日）` : ''}
                </option>
                {GEMINI_MODELS.map(m => (
                  <option key={m.id} value={m.id}>{modelLabel(m)}</option>
                ))}
              </select>
            </label>

            {/* The quota is spent from this user's own key, so make the cost of
                the choice explicit rather than burying it in the option text. */}
            {effectiveInfo && (
              <div className={effectiveInfo.rpd >= 500 ? styles.quotaOk : styles.quotaWarn}>
                {effectiveInfo.rpd >= 500
                  ? `✅ 目前使用 ${effectiveInfo.name}，您每日可用 ${effectiveInfo.rpd} 次（每分鐘 ${effectiveInfo.rpm} 次）。`
                  : `⚠️ ${effectiveInfo.name} 每日僅 ${effectiveInfo.rpd} 次。AI 優化搜尋是「每個國家一次請求」，選 3 個國家即消耗 3 次，很快會用完。`}
                {effectiveInfo.preview && ' 此為 preview 模型，通常需要已啟用計費的專案。'}
              </div>
            )}

            {result && (
              <div className={result.ok ? styles.resultOk : styles.resultErr}>
                {result.ok ? <CheckCircle2 size={15} /> : <X size={15} />}
                <span>{result.message}</span>
              </div>
            )}
          </div>

          <div className={styles.footer}>
            {getBrowserGeminiKey() && (
              <button className={styles.clearBtn} onClick={handleClear}>清除金鑰</button>
            )}
            <div className={styles.footerRight}>
              <button className={styles.testBtn} onClick={handleTest} disabled={!key.trim() || testing}>
                {testing ? <><Loader2 size={15} className={styles.spin} /> 測試中...</> : '測試連線'}
              </button>
              <button className={styles.saveBtn} onClick={handleSave} disabled={!key.trim()}>
                儲存
              </button>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
}
