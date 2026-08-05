'use client';

import React from 'react';
import { Check, X, Star, XCircle, Share2, Undo2, HandCoins } from 'lucide-react';
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
  /**
   * Which pool is on screen. In the shared opportunity pool the rows belong to
   * other accounts, so the status/favourite actions would be rejected
   * server-side — claiming is the only thing on offer there.
   */
  mode?: 'mine' | 'opportunities';
  onRelease?: () => void;
  onWithdraw?: () => void;
  onClaim?: () => void;
}

export default function BatchActionBar({
  selectedCount,
  onMarkValid,
  onMarkInvalid,
  onFavorite,
  onClearSelection,
  busy = false,
  mode = 'mine',
  onRelease,
  onWithdraw,
  onClaim,
}: BatchActionBarProps) {
  if (selectedCount === 0) return null;

  const opportunities = mode === 'opportunities';

  return (
    <Portal>
    <div className={styles.container}>
      <div className={styles.countText}>
        已選取 <span className={styles.countNumber}>{selectedCount}</span> 筆
        {busy && <span style={{ marginLeft: 8, opacity: 0.7 }}>更新中...</span>}
      </div>

      <div className={styles.actions}>
        {opportunities ? (
          onClaim && (
            <button
              className={`${styles.btn} ${styles.btnSuccess}`}
              onClick={onClaim}
              disabled={busy}
            >
              <HandCoins size={16} />
              認領
            </button>
          )
        ) : (
          <>
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

            {onRelease && (
              <button
                className={`${styles.btn} ${styles.btnRelease}`}
                onClick={onRelease}
                disabled={busy}
              >
                <Share2 size={16} />
                釋放到商機池
              </button>
            )}

            {onWithdraw && (
              <button
                className={styles.btn}
                onClick={onWithdraw}
                disabled={busy}
                title="將尚未被認領的資料收回為私有"
              >
                <Undo2 size={16} />
                收回
              </button>
            )}
          </>
        )}

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
