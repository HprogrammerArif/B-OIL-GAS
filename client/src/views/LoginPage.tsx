import React, { useState } from 'react';
import { Lang, ROLE_META, t } from '../types';
import { showToast } from '../components/ToastManager';
import { sessionStore } from '../auth/session';
import {
  Lock, Mail, ArrowRight, ShieldCheck,
  Globe, Eye, EyeOff, AlertCircle, Loader2
} from 'lucide-react';

interface LoginPageProps {
  lang: Lang;
  onLangToggle: () => void;
}

type FormError = 'invalid_credentials' | 'locked' | 'missing' | null;

const ERROR_TEXT: Record<Exclude<FormError, null>, { en: string; bn: string }> = {
  missing: {
    en: 'Enter your work email or employee ID and password.',
    bn: 'আপনার অফিস ইমেইল বা কর্মী আইডি এবং পাসওয়ার্ড লিখুন।',
  },
invalid_credentials  : {
    en: 'The email/ID or password you entered is incorrect.',
    bn: 'ইমেইল/আইডি অথবা পাসওয়ার্ড সঠিক নয়।',
  },
  locked: {
    en: 'Too many failed attempts. Contact IT Support Desk (Ext. 4401) to unlock your account.',
    bn: 'অনেকবার ভুল চেষ্টা হয়েছে। অ্যাকাউন্ট আনলক করতে আইটি সাপোর্ট ডেস্কে (Ext. 4401) যোগাযোগ করুন।',
  },
};

export default function LoginPage({ lang, onLangToggle }: LoginPageProps) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<FormError>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!identifier.trim() || !password) {
      setError('missing');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    // Small delay so the state change reads as a real round-trip.
    const [result] = await Promise.all([
      sessionStore.login(identifier, password, rememberMe),
      new Promise((r) => setTimeout(r, 650)),
    ]);
    setIsSubmitting(false);
    if (!result.ok) {
      setError(result.reason);
      setPassword('');
      return;
    }
    const user = sessionStore.getState().user;
    if (user) {
      showToast(
        t(`Welcome back, ${user.shortName}.`, `স্বাগতম, ${user.nameBn}।`, lang),
        'gold'
      );
    }
  };

  const handleSso = () => {
    showToast(
      t(
        'Office Account sign-in is available on the company network only.',
        'অফিস অ্যাকাউন্ট সাইন-ইন শুধুমাত্র কোম্পানি নেটওয়ার্কে ব্যবহারযোগ্য।',
        lang
      ),
      'info'
    );
  };

  return (
    <div className={`login-screen${lang === 'bn' ? ' lang-bn' : ''}`}>
      <header className="login-topbar">
        <div className="login-brand-logo">
          <div className="brand-emblem">B</div>
          <div className="login-brand-title">
            <h1>BASHUNDHARA OIL & GAS COMPANY LTD.</h1>
            <p>{t('A Concern of Bashundhara Group • Company Operations Portal', 'বসুন্ধরা গ্রুপ — দেশ ও মানুষের কল্যাণে', lang)}</p>
          </div>
        </div>

        <button
          type="button"
          className="btn-lang login-lang-btn"
          onClick={onLangToggle}
        >
          <Globe size={14} />
          <span>{lang === 'en' ? 'বাংলা' : 'English'}</span>
        </button>
      </header>

      <main className="login-body">
        <div className="login-card-centered">
          <div className="login-card-header">
            <div className="brand-badge-ring">
              <div className="brand-emblem-large">B</div>
            </div>
            <h2 className="login-main-title">
              {t('Sign in to BOGCL OneOps', 'বসুন্ধরা ওয়ান-অপ্স পোর্টালে সাইন ইন করুন', lang)}
            </h2>
            <p className="login-main-subtitle">
              {t(
                'Daily operations, approvals, vehicles, assets & staff services',
                'দৈনন্দিন কার্যক্রম, অনুমোদন, পরিবহন, সম্পদ ও কর্মী সেবা পোর্টাল',
                lang
              )}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="login-form-clean" noValidate>
            {error && (
              <div className="login-error-banner" role="alert">
                <AlertCircle size={15} />
                <span>{t(ERROR_TEXT[error].en, ERROR_TEXT[error].bn, lang)}</span>
              </div>
            )}

            <div className="form-group-clean">
              <div className="label-with-link">
                <label htmlFor="login-identifier">{t('Work Email or Employee ID', 'অফিস ইমেইল অথবা কর্মী আইডি', lang)}</label>
              </div>
              <div className="login-input-clean">
                <Mail size={15} className="input-icon-clean" />
                <input
                  id="login-identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => { setIdentifier(e.target.value); if (error) setError(null); }}
                  placeholder={t('name@bashundhara.com or EMP-0001', 'name@bashundhara.com অথবা EMP-0001', lang)}
                  autoComplete="username"
                  autoFocus
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="form-group-clean">
              <div className="label-with-link">
                <label htmlFor="login-password">{t('Password', 'পাসওয়ার্ড', lang)}</label>
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    showToast(
                      t(
                        'For password reset, call IT Support Desk at Ext. 4401.',
                        'পাসওয়ার্ড রিসেটের জন্য আইটি সাপোর্ট ডেস্কে কল করুন: Ext. 4401',
                        lang
                      ),
                      'info'
                    );
                  }}
                  className="forgot-link-clean"
                >
                  {t('Forgot password?', 'পাসওয়ার্ড ভুলে গেছেন?', lang)}
                </a>
              </div>
              <div className="login-input-clean">
                <Lock size={15} className="input-icon-clean" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (error) setError(null); }}
                  autoComplete="current-password"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  className="pw-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? t('Hide password', 'পাসওয়ার্ড লুকান', lang) : t('Show password', 'পাসওয়ার্ড দেখান', lang)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="login-options-clean">
              <label className="remember-checkbox-clean">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isSubmitting}
                />
                <span>{t('Keep me signed in on this computer', 'এই ডিভাইসে সাইন-ইন মনে রাখুন', lang)}</span>
              </label>
            </div>

            <button type="submit" className="btn-login-primary" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="spin-anim" />
                  <span>{t('Signing in…', 'প্রবেশ করা হচ্ছে…', lang)}</span>
                </>
              ) : (
                <>
                  <span>{t('Sign in', 'সাইন ইন', lang)}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            <div className="login-divider-clean">
              <span>{t('or', 'অথবা', lang)}</span>
            </div>

            <button type="button" className="btn-sso-clean" onClick={handleSso} disabled={isSubmitting}>
              <ShieldCheck size={16} color="var(--brand-gold)" />
              <span>{t('Sign in with Bashundhara Group Office Account', 'বসুন্ধরা গ্রুপ অফিস অ্যাকাউন্ট দিয়ে প্রবেশ করুন', lang)}</span>
            </button>
          </form>
        </div>
      </main>

      <footer className="login-footer-clean">
        <div>
          © 2026 <strong>Bashundhara Oil & Gas Company Limited</strong>. {t('All rights reserved.', 'সর্বস্বত্ব সংরক্ষিত।', lang)}
        </div>
        <div className="login-footer-tags">
          <span>{t('Secure connection', 'নিরাপদ সংযোগ', lang)}</span>
          <span>•</span>
          <span>{ROLE_META.chairman.siteLabel.split(',')[0]}</span>
          <span>•</span>
          <span>{t('Keraniganj Plant', 'কেরানীগঞ্জ প্ল্যান্ট', lang)}</span>
        </div>
      </footer>
    </div>
  );
}
