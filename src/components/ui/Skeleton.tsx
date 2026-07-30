'use client';
import React from 'react';
import styles from './Skeleton.module.css';

interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  className?: string;
}

export function Skeleton({ width = '100%', height = '16px', borderRadius = 'var(--radius-md)', className }: SkeletonProps) {
  return <div className={`${styles.skeleton} ${className || ''}`} style={{ width, height, borderRadius }} />;
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={`${styles.card} ${className || ''}`}>
      <Skeleton height="20px" width="60%" />
      <Skeleton height="14px" width="80%" />
      <Skeleton height="14px" width="40%" />
      <Skeleton height="32px" width="100%" borderRadius="var(--radius-sm)" />
    </div>
  );
}
