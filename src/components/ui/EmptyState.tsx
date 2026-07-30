// src/components/ui/EmptyState.tsx
'use client';
import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from './Button';
import styles from './EmptyState.module.css';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = ''
}) => {
  return (
    <div className={`${styles.container} ${className}`}>
      <div className={styles.iconWrapper}>
        <Icon className={styles.icon} size={48} strokeWidth={1.5} />
      </div>
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.description}>{description}</p>}
      {actionLabel && onAction && (
        <Button variant="primary" className={styles.actionButton} onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
