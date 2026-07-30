// src/components/ui/Toast.tsx
'use client';
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';
import { createPortal } from 'react-dom';
import styles from './Toast.module.css';

export type ToastVariant = 'success' | 'warning' | 'error' | 'info';

export interface ToastProps {
  id: string;
  message: string;
  variant?: ToastVariant;
  duration?: number;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ id, message, variant = 'info', duration = 3000, onClose }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => onClose(id), duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  const icons = {
    success: <CheckCircle size={20} className={styles.iconSuccess} />,
    warning: <AlertTriangle size={20} className={styles.iconWarning} />,
    error: <XCircle size={20} className={styles.iconError} />,
    info: <Info size={20} className={styles.iconInfo} />
  };

  return (
    <div className={`${styles.toast} ${styles[variant]}`} role="alert">
      <div className={styles.indicator} />
      <div className={styles.iconWrapper}>{icons[variant]}</div>
      <div className={styles.message}>{message}</div>
      <button className={styles.closeButton} onClick={() => onClose(id)} aria-label="Close toast">
        <X size={16} />
      </button>
    </div>
  );
};

interface ToastContextType {
  toast: (message: string, variant?: ToastVariant, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Omit<ToastProps, 'onClose'>[]>([]);

  const addToast = useCallback((message: string, variant: ToastVariant = 'info', duration = 3000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, variant, duration }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const container = typeof document !== 'undefined' ? (
    createPortal(
      <div className={styles.container}>
        {toasts.map((t) => (
          <Toast key={t.id} {...t} onClose={removeToast} />
        ))}
      </div>,
      document.body
    )
  ) : null;

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      {container}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
