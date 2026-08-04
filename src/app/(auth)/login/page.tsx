'use client';

import React, { useState, Suspense } from 'react';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Sparkles } from 'lucide-react';
import styles from './login.module.css';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!email || !password) {
        throw new Error('請輸入電子郵件與密碼');
      }

      // The previous "ensure admin exists" call to /api/auth/seed is gone: that
      // endpoint reset the admin password to a hardcoded default on every visit
      // to this page, and is now a guarded one-time bootstrap.
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '登入失敗');
      }

      // Return the user to wherever the auth gate intercepted them.
      const next = searchParams.get('next');
      router.push(next && next.startsWith('/') ? next : '/');
      router.refresh();
    } catch (err: any) {
      setError(err.message || '登入失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={`glass-2 ${styles.loginCard}`}>
        <div className={styles.header}>
          <div className={styles.logoWrapper}>
            <Sparkles className={styles.logoIcon} size={28} />
          </div>
          <h1 className={styles.title}>AI B2B</h1>
          <p className={styles.subtitle}>商業情報平台</p>
        </div>

        {error && (
          <div className={styles.alert}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className={styles.form}>
          <div className={styles.inputGroup}>
            <div className={styles.inputWrapper}>
              <Mail className={styles.inputIcon} size={20} />
              <input
                type="email"
                placeholder="電子郵件"
                className={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <div className={styles.inputWrapper}>
              <Lock className={styles.inputIcon} size={20} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="密碼"
                className={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className={styles.togglePassword}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className={styles.options}>
            <label className={styles.checkboxLabel}>
              <input type="checkbox" className={styles.checkbox} />
              <span>記住我</span>
            </label>
            <Link href="#" className={styles.forgotPassword}>忘記密碼？</Link>
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
          >
            {loading ? '登入中...' : '登入'}
          </button>
        </form>

        <div className={styles.divider}>
          <span>或</span>
        </div>

        <div className={styles.ssoContainer}>
          <button className={styles.ssoBtn} disabled>
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" width={20} height={20} />
            Google 登入
            <span className={styles.badge}>即將開放</span>
          </button>
          <button className={styles.ssoBtn} disabled>
            <img src="https://www.svgrepo.com/show/448234/microsoft.svg" alt="Microsoft" width={20} height={20} />
            Microsoft 登入
            <span className={styles.badge}>即將開放</span>
          </button>
        </div>

        <div className={styles.footer}>
          <Link href="#" className={styles.telegramLink}>
            使用 Telegram 登入
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  // useSearchParams requires a Suspense boundary during prerender.
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
