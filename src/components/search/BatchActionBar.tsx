'use client';

import React from 'react';
import { Check, X, Star, XCircle } from 'lucide-react';
import Portal from '@/components/ui/Portal';
import styles from './BatchActionBar.module.css';

interface BatchActionBarProps {
  selectedCount: number;
  onMarkValid: () => void;
  onMarkInvalid: () => void;
  onFavorite: () => void;
  onClearSelection: () => void;
  /** Disables the buttons while a batch update is in flight. */
  busy?: boolean;
}

export default function BatchActionBar({
  selectedCount,
  onMarkValid,
  onMarkInvalid,
  onFavorite,
  onClearSelection,
  busy = false,
}: BatchActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <Portal>
    <div className={styles.container}>
      <div className={styles.countText}>
        已選取 <span className={styles.countNumber}>{selectedCount}</span> 筆
        {busy && <span style={{ marginLeft: 8, opacity: 0.7 }}>更新中...</span>}
      </div>

      <div className={styles.actions}>
        <button
          className={`${styles.btn} ${styles.btnSuccess}`}
          onClick={onMarkValid}
          disabled={busy}
        >
          <Check size={16} />
          標記有效
        </button>

        <button
          className={`${styles.btn} ${styles.btnDanger}`}
          onClick={onMarkInvalid}
          disabled={busy}
        >
          <X size={16} />
          標記無效
        </button>

        <button
          className={`${styles.btn} ${styles.btnAccent}`}
          onClick={onFavorite}
          disabled={busy}
        >
          <Star size={16} />
          加入收藏
        </button>

        <button
          className={`${styles.btn} ${styles.btnPrimary}`}
          onClick={onClearSelection}
          disabled={busy}
        >
          <XCircle size={16} />
          取消選取
        </button>
      </div>
    </div>
    </Portal>
  );
}
