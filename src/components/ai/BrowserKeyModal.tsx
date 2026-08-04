'use client';

import React, { useState } from 'react';
import { X, Eye, EyeOff, ExternalLink, CheckCircle2, Loader2 } from 'lucide-react';
import Portal from '@/components/ui/Portal';
import { callGemini } from '@/lib/ai/gemini';
import { getBrowserGeminiKey, setBrowserGeminiKey, clearBrowserGeminiKey } from '@/lib/ai/browserKey';
import styles from './BrowserKeyModal.module.css';

export default function BrowserKeyModal({
  model,
  onClose,
  onSaved,
}: {
  model: string;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const [key, setKey] = useState(getBrowserGeminiKey());
  const [show, setShow] = useState(false);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const handleTest = async () => {
    setTesting(true);
    setResult(null);
    try {
      // Runs from this browser, which is the whole point: it proves the key
      // works from the user's own network, not from the blocked server.
      const reply = await callGemini(key.trim(), model, '請回覆「連線成功」四個字。', {
        maxOutputTokens: 50,
      });
      setResult({ ok: true, message: `連線成功：${reply}` });
    } catch (e: any) {
      setResult({ ok: false, message: e.message || '測試失敗' });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    setBrowserGeminiKey(key);
    onSaved?.();
    onClose();
  };

  const handleClear = () => {
    clearBrowserGeminiKey();
    setKey('');
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
