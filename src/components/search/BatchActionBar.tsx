'use client';

import React from 'react';
import { Check, X, Star, UserPlus } from 'lucide-react';
import styles from './BatchActionBar.module.css';

interface BatchActionBarProps {
  selectedCount: number;
  onMarkValid: () => void;
  onMarkInvalid: () => void;
  onFavorite: () => void;
  onAssign: () => void;
}

export default function BatchActionBar({
  selectedCount,
  onMarkValid,
  onMarkInvalid,
  onFavorite,
  onAssign
}: BatchActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className={styles.container}>
      <div className={styles.countText}>
        已選取 <span className={styles.countNumber}>{selectedCount}</span> 筆
      </div>
      
      <div className={styles.actions}>
        <button 
          className={`${styles.btn} ${styles.btnSuccess}`}
          onClick={onMarkValid}
        >
          <Check size={16} />
          標記有效
        </button>
        
        <button 
          className={`${styles.btn} ${styles.btnDanger}`}
          onClick={onMarkInvalid}
        >
          <X size={16} />
          標記無效
        </button>
        
        <button 
          className={`${styles.btn} ${styles.btnAccent}`}
          onClick={onFavorite}
        >
          <Star size={16} />
          加入收藏
        </button>
        
        <button 
          className={`${styles.btn} ${styles.btnPrimary}`}
          onClick={onAssign}
        >
          <UserPlus size={16} />
          指派
        </button>
      </div>
    </div>
  );
}
