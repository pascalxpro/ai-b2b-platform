'use client';
import React, { useEffect, useState } from 'react';
import styles from './PageTransition.module.css';

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  return (
    <div className={`${styles.wrapper} ${mounted ? styles.visible : ''}`}>
      {children}
    </div>
  );
}
