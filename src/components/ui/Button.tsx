// src/components/ui/Button.tsx
'use client';
import React from 'react';
import { Loader2 } from 'lucide-react';
import styles from './Button.module.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, disabled, icon, children, className = '', type = 'button', ...props }, ref) => {
    const classNames = [
      styles.button,
      styles[variant],
      styles[size],
      loading ? styles.loading : '',
      className
    ].filter(Boolean).join(' ');

    return (
      <button
        ref={ref}
        type={type}
        className={classNames}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className={styles.spinner} />}
        {!loading && icon && <span className={styles.icon}>{icon}</span>}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
