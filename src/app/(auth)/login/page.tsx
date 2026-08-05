'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Sparkles } from 'lucide-react';
import styles from './login.module.css';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { DEFAULT_BRANDING, type BrandingSettings } from '@/lib/settings/branding';

/*
 * Inlined rather than loaded from svgrepo.com. The external images failed to
 * load and rendered as broken-image placeholders next to the alt text; a login
 * page also shouldn't depend on (or leak a request to) a third-party host.
 */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.6l6.2 5.2C37 41.2 44 36 44 24c0-1.3-.1-2.6-.4-3.9z" />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 23 23" aria-hidden="true">
      <path fill="#F25022" d="M1 1h10v10H1z" />
      <path fill="#7FBA00" d="M12 1h10v10H12z" />
      <path fill="#00A4EF" d="M1 12h10v10H1z" />
      <path fill="#FFB900" d="M12 12h10v10H12z" />
    </svg>
  );
}

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  // The logo and both text lines were hardcoded here, so a customised install
  // still showed the stock "AI B2B" branding on its own login screen.
  const [branding, setBranding] = useState<BrandingSettings>(DEFAULT_BRANDING);

  useEffect(() => {
    fetch('/api/branding')
      .then(r => (r.ok ? r.json() : null))
      .then(b => { if (b) setBranding({ ...DEFAULT_BRANDING, ...b }); })
      .catch(() => { /* cosmetic only — keep the defaults */ });
  }, []);

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
          {branding.logoDataUrl ? (
            // height only, width auto — preserves the uploaded image's own
            // aspect ratio, same rule as the sidebar.
            <img
              src={branding.logoDataUrl}
              alt={branding.brandName}
              className={styles.logoImage}
              style={{ height: Math.max(44, branding.logoHeight) }}
            />
          ) : (
            <div className={styles.logoWrapper}>
              <Sparkles className={styles.logoIcon} size={28} />
            </div>
          )}
          <h1 className={styles.title}>{branding.brandName}</h1>
          <p className={styles.subtitle}>{branding.subtitle}</p>
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
              <Mail className={styles.inputIcon} size={18} />
              <input
                type="email"
                placeholder="電子郵件"
                className={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                aria-label="電子郵件"
                required
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <div className={styles.inputWrapper}>
              <Lock className={styles.inputIcon} size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="密碼"
                className={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                aria-label="密碼"
                required
              />
              <button
                type="button"
                className={styles.togglePassword}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? '隱藏密碼' : '顯示密碼'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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
          <button type="button" className={styles.ssoBtn} disabled>
            <span className={styles.ssoIcon}><GoogleIcon /></span>
            <span>Google 登入</span>
            <span className={styles.badge}>即將開放</span>
          </button>
          <button type="button" className={styles.ssoBtn} disabled>
            <span className={styles.ssoIcon}><MicrosoftIcon /></span>
            <span>Microsoft 登入</span>
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
