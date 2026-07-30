// src/components/ui/Badge.tsx
'use client';
import React from 'react';
import styles from './Badge.module.css';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({ 
  variant = 'default', 
  size = 'sm', 
  dot = false, 
  children, 
  className = '',
  ...props 
}) => {
  const classNames = [
    styles.badge,
    styles[variant],
    styles[size],
    className
  ].filter(Boolean).join(' ');

  return (
    <span className={classNames} {...props}>
      {dot && <span className={styles.dot} aria-hidden="true" />}
      {children}
    </span>
  );
};
Badge.displayName = 'Badge';
