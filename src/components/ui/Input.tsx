// src/components/ui/Input.tsx
'use client';
import React from 'react';
import styles from './Input.module.css';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  multiline?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps>(
  ({ label, error, helperText, icon, multiline, className = '', disabled, required, ...props }, ref) => {
    const Component = multiline ? 'textarea' : 'input';
    
    const containerClasses = [
      styles.container,
      disabled ? styles.disabled : '',
      error ? styles.errorState : '',
      className
    ].filter(Boolean).join(' ');

    return (
      <div className={containerClasses}>
        {label && (
          <label className={styles.label}>
            {label}
            {required && <span className={styles.required}>*</span>}
          </label>
        )}
        <div className={styles.inputWrapper}>
          {icon && <span className={styles.icon}>{icon}</span>}
          <Component
            ref={ref as any}
            className={`${styles.input} ${icon ? styles.hasIcon : ''}`}
            disabled={disabled}
            required={required}
            aria-invalid={!!error}
            {...(props as any)}
          />
        </div>
        {error && <span className={styles.errorText}>{error}</span>}
        {!error && helperText && <span className={styles.helperText}>{helperText}</span>}
      </div>
    );
  }
);
Input.displayName = 'Input';
