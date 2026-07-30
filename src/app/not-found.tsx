'use client';
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Home, ArrowLeft } from 'lucide-react';
import styles from './not-found.module.css';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className={styles.container}>
      <div className={styles.background}>
        <div className={`${styles.shape} ${styles.shape1}`}></div>
        <div className={`${styles.shape} ${styles.shape2}`}></div>
      </div>
      
      <div className={`glass-2 ${styles.card}`}>
        <h1 className={`gradient-text ${styles.errorCode}`}>404</h1>
        <h2 className={styles.title}>找不到頁面</h2>
        <p className={styles.description}>
          您要尋找的頁面可能已被移動或不存在。請檢查網址，或返回首頁繼續瀏覽。
        </p>
        
        <div className={styles.actions}>
          <button onClick={() => router.back()} className={styles.btnGhost}>
            <ArrowLeft size={18} />
            返回上一頁
          </button>
          <Link href="/" className={styles.btnPrimary}>
            <Home size={18} />
            返回首頁
          </Link>
        </div>
      </div>
    </div>
  );
}
