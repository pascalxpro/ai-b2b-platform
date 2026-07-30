// src/components/ui/Card.tsx
'use client';
import React from 'react';
import styles from './Card.module.css';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  selected?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ hoverable, selected, padding = 'md', className = '', children, ...props }, ref) => {
    const classNames = [
      styles.card,
      hoverable ? styles.hoverable : '',
      selected ? styles.selected : '',
      styles[`padding-${padding}`],
      className
    ].filter(Boolean).join(' ');

    return (
      <div ref={ref} className={classNames} {...props}>
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';
