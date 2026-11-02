import React, { useState } from 'react';
import { AppRole, Lang, ROLE_META, t } from '../types';
import { showToast } from '../components/ToastManager';
import { sessionStore, resolveIdentifier } from '../auth/session';
import { sha256Hex } from '../lib/hash';
import TelemetryLoader from '../components/TelemetryLoader';
import '../styles/login-sportscity.css';
import {
  Globe, Eye, EyeOff, AlertCircle, Loader2, ArrowRight
} from 'lucide-react';

interface LoginPageProps {
  lang: Lang;
  onLangToggle: () => void;
}

type FormError = 'invalid_credentials' | 'locked' | 'missing' | null;

const DEMO_PASSWORD_SHA256 = '95665bd975b309827cbc17b25a0776ba447701bd70909ae63ba8da93560de34d';

const ERROR_TEXT: Record<Exclude<FormError, null>, { en: string; bn: string }> = {
  missing: {
    en: 'Enter your email or employee ID and password.',
    bn: 'আপনার ইমেইল বা আইডি এবং পাসওয়ার্ড লিখুন।',
  },
  invalid_credentials: {
    en: 'Incorrect email/ID or password.',
    bn: 'ইমেইল/আইডি অথবা পাসওয়ার্ড সঠিক নয়।',
  },
  locked: {
    en: 'Account locked. Contact IT Support Desk (Ext. 4401).',
    bn: 'অ্যাকাউন্ট লক করা হয়েছে। আইটি সহায়তায় (Ext. 4401) কল করুন।',
  },
};

interface DemoRoleItem {
  role: AppRole;
  labelEn: string;
  labelBn: string;
  isSpan2?: boolean;
}

const DEMO_ROLES: DemoRoleItem[] = [
  { role: 'chairman',        labelEn: 'Chairman',        labelBn: 'চেয়ারম্যান' },
  { role: 'plant_gm',        labelEn: 'Plant GM',        labelBn: 'প্ল্যান্ট জিএম' },
  { role: 'hr_admin',        labelEn: 'HR Admin',        labelBn: 'এইচআর এডমিন' },
  { role: 'transport_admin', labelEn: 'Transport Admin', labelBn: 'পরিবহন এডমিন' },
  { role: 'hod',             labelEn: 'Finance HOD',     labelBn: 'অর্থ প্রধান' },
  { role: 'employee',        labelEn: 'Sales Officer',   labelBn: 'সেলস অফিসার' },
  { role: 'driver',          labelEn: 'Company Driver',  labelBn: 'কোম্পানি ড্রাইভার', isSpan2: true },
];

export default function LoginPage({ lang, onLangToggle }: LoginPageProps) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<FormError>(null);
  const [telemetryRole, setTelemetryRole] = useState<AppRole | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || telemetryRole) return;
    if (!identifier.trim() || !password) {
      setError('missing');
      return;
    }
    setError(null);
    setIsSubmitting(true);

    const role = resolveIdentifier(identifier);
    const digest = await sha256Hex(password);
    const isValid = role && digest === DEMO_PASSWORD_SHA256;

    if (!isValid) {
      setIsSubmitting(false);
      setError('invalid_credentials');
      setPassword('');
      return;
    }

    // Launch the cinematic telemetry simulation
    setTelemetryRole(role);
  };

  const handleTelemetryComplete = async () => {
    const [result] = await Promise.all([
      sessionStore.login(identifier, password, true),
      new Promise((r) => setTimeout(r, 150)),
    ]);
    setIsSubmitting(false);
    setTelemetryRole(null);

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

  const handleSelectRole = (r: AppRole) => {
    const meta = ROLE_META[r];
    setIdentifier(meta.email);
    setPassword('bogcl2026');
    if (error) setError(null);
    showToast(
      t(
        `Credentials loaded for ${meta.name} (${t(meta.label, meta.labelBn, lang)}). Click "Enter Command Centre" to proceed.`,
        `${meta.nameBn} (${meta.labelBn})-এর তথ্য লোড করা হয়েছে। "কমান্ড সেন্টারে প্রবেশ" চাপুন।`,
        lang
      ),
      'info'
    );
  };

  return (
    <div className={`sc-login-wrapper${lang === 'bn' ? ' lang-bn' : ''}`}>
      {/* ──────────────────────────────────────────────────────────────────
          LEFT HERO: FULL-BLEED AERIAL REFINERY NIGHT PHOTOGRAPHY
          ────────────────────────────────────────────────────────────────── */}
      <section className="sc-hero-backdrop">
        <header className="sc-brand-badge-box">
          <div className="sc-brand-badge-emblem">
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '6px',
                background: 'linear-gradient(135deg, #BA1C37 0%, #7A0C1E 100%)',
                color: '#FFFFFF',
                fontWeight: 900,
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              B
            </div>
            <div className="sc-brand-logo-text">
              <strong>BOGCL</strong>
              <span>OneOps</span>
            </div>
          </div>
        </header>

        <div className="sc-hero-center">
          <span className="sc-command-tag">
            {t('COMMAND CENTRE', 'অপারেশনস কমান্ড সেন্টার', lang)}
          </span>

          <h1 className="sc-hero-title">
            BASHUNDHARA<br />OIL & GAS
          </h1>

          <p className="sc-hero-tagline">
            {t(
              'One Platform. Complete Energy Operations.',
              'একক প্ল্যাটফর্ম • সমন্বিত এনার্জি অপারেশনস।',
              lang
            )}
          </p>
        </div>

        <footer className="sc-hero-footer">
          <span>{t('Refining', 'পরিশোধন', lang)}</span>
          <span className="bullet">•</span>
          <span>{t('Storage', 'সংরক্ষণ', lang)}</span>
          <span className="bullet">•</span>
          <span>{t('Fleet', 'ফ্লিট', lang)}</span>
          <span className="bullet">•</span>
          <span>{t('Terminal', 'টার্মিনাল', lang)}</span>
          <span className="bullet">•</span>
          <span>{t('Compliance', 'কমপ্লায়েন্স', lang)}</span>
        </footer>
      </section>

      {/* ──────────────────────────────────────────────────────────────────
          RIGHT SIDE: SLEEK MINIMAL COMMAND CENTRE PANEL (Sports City Style)
          ────────────────────────────────────────────────────────────────── */}
      <aside className="sc-login-panel">
        <div className="sc-panel-header">
          <div className="sc-panel-top-row">
            <h2 className="sc-staff-title">
              {t('Staff access', 'স্টাফ অ্যাক্সেস', lang)}
            </h2>

            <button
              type="button"
              className="sc-lang-toggle-btn"
              onClick={onLangToggle}
              title={t('Toggle Language', 'ভাষা পরিবর্তন', lang)}
            >
              <Globe size={12} />
              <span>{lang === 'en' ? 'বাংলা' : 'English'}</span>
            </button>
          </div>

          <p className="sc-staff-sub">
            {t(
              'Sign In to operate the live complex — or click a demo role below.',
              'লাইভ প্ল্যাটফর্ম পরিচালনায় সাইন ইন করুন — অথবা নিচের ডেমো রোলে ক্লিক করুন।',
              lang
            )}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="sc-form" noValidate>
          {error && (
            <div className="sc-error-banner" role="alert">
              <AlertCircle size={14} />
              <span>{t(ERROR_TEXT[error].en, ERROR_TEXT[error].bn, lang)}</span>
            </div>
          )}

          <div className="sc-input-group">
            <div className="sc-input-label-row">
              <label className="sc-input-label" htmlFor="sc-email">
                {t('Email', 'ইমেইল', lang)}
              </label>
            </div>
            <div className="sc-input-wrap">
              <input
                id="sc-email"
                type="text"
                className="sc-text-input"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  if (error) setError(null);
                }}
                placeholder={t('name@bashundhara.com or EMP-0001', 'name@bashundhara.com অথবা EMP-0001', lang)}
                autoComplete="username"
                autoFocus
                disabled={isSubmitting || !!telemetryRole}
              />
            </div>
          </div>

          <div className="sc-input-group">
            <div className="sc-input-label-row">
              <label className="sc-input-label" htmlFor="sc-password">
                {t('Password', 'পাসওয়ার্ড', lang)}
              </label>
              <a
                href="#forgot"
                onClick={(e) => {
                  e.preventDefault();
                  showToast(
                    t('For password reset, contact IT Support Desk at Ext. 4401.', 'পাসওয়ার্ড রিসেট করতে আইটি ডেস্কে (Ext. 4401) কল করুন।', lang),
                    'info'
                  );
                }}
                className="sc-input-forgot"
              >
                {t('Forgot?', 'ভুলে গেছেন?', lang)}
              </a>
            </div>
            <div className="sc-input-wrap">
              <input
                id="sc-password"
                type={showPassword ? 'text' : 'password'}
                className="sc-text-input"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                autoComplete="current-password"
                disabled={isSubmitting || !!telemetryRole}
              />
              <button
                type="button"
                className="sc-pw-toggle"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? t('Hide', 'লুকান', lang) : t('Show', 'দেখান', lang)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="sc-submit-btn"
            disabled={isSubmitting || !!telemetryRole}
          >
            {isSubmitting || !!telemetryRole ? (
              <>
                <Loader2 size={15} className="spin-anim" />
                <span>{t('Authenticating…', 'যাচাই করা হচ্ছে…', lang)}</span>
              </>
            ) : (
              <>
                <span>{t('Enter Command Centre', 'কমান্ড সেন্টারে প্রবেশ করুন', lang)}</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        {/* ──────────────────────────────────────────────────────────────
            DEMO LOGIN (MINIMAL 2-COLUMN GRID LIKE SPORTS CITY)
            ────────────────────────────────────────────────────────────── */}
        <div className="sc-demo-section">
          <div className="sc-demo-header-row">
            <span className="sc-demo-heading">
              {t('Demo Login', 'ডেমো লগইন', lang)}
            </span>
            <span className="sc-demo-pw-badge">
              Password <strong>bogcl2026</strong>
            </span>
          </div>

          <div className="sc-demo-grid">
            {DEMO_ROLES.map(({ role: r, labelEn, labelBn, isSpan2 }) => {
              const meta = ROLE_META[r];
              const isSelected =
                identifier.trim().toLowerCase() === meta.email.toLowerCase() ||
                identifier.trim().toLowerCase() === meta.empId.toLowerCase();

              return (
                <button
                  key={r}
                  type="button"
                  className={`sc-demo-btn${isSpan2 ? ' span-2' : ''}${isSelected ? ' active' : ''}`}
                  onClick={() => handleSelectRole(r)}
                  title={t(
                    `Load credentials for ${meta.name} (${meta.label})`,
                    `${meta.nameBn} (${meta.labelBn})-এর তথ্য লোড করুন`,
                    lang
                  )}
                  disabled={isSubmitting || !!telemetryRole}
                >
                  {t(labelEn, labelBn, lang)}
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* Cinematic Telemetry Loader Simulation */}
      {telemetryRole && (
        <TelemetryLoader
          role={telemetryRole}
          lang={lang}
          onComplete={handleTelemetryComplete}
        />
      )}
    </div>
  );
}
