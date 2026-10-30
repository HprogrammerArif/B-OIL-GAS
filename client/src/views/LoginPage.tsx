import React, { useState } from 'react';
import { AppRole, Lang, ROLE_META, t } from '../types';
import { showToast } from '../App';
import {
  Lock, Mail, ArrowRight, ShieldCheck,
  Globe, Eye, EyeOff, Sparkles
} from 'lucide-react';
import TelemetryLoader from '../components/TelemetryLoader';

interface LoginPageProps {
  onLogin: (role: AppRole) => void;
  lang: Lang;
  onLangToggle: () => void;
}

interface PersonaOption {
  role: AppRole;
  shortLabel: string;
  shortLabelBn: string;
}

const PERSONAS: PersonaOption[] = [
  { role: 'chairman',        shortLabel: 'Chairman & MD',        shortLabelBn: 'চেয়ারম্যান ও এমডি' },
  { role: 'plant_gm',        shortLabel: 'Plant GM',             shortLabelBn: 'প্ল্যান্ট জিএম' },
  { role: 'hr_admin',        shortLabel: 'GM, HR & Admin',       shortLabelBn: 'এইচআর ও প্রশাসন' },
  { role: 'transport_admin', shortLabel: 'Transport Supervisor', shortLabelBn: 'পরিবহন সুপারভাইজার' },
  { role: 'hod',             shortLabel: 'Head of Finance',      shortLabelBn: 'অর্থ বিভাগ প্রধান' },
  { role: 'employee',        shortLabel: 'Sales Officer',        shortLabelBn: 'সিনিয়র সেলস অফিসার' },
  { role: 'driver',          shortLabel: 'Company Driver',       shortLabelBn: 'কোম্পানি ড্রাইভার' },
];

export default function LoginPage({ onLogin, lang, onLangToggle }: LoginPageProps) {
  const [selectedRole, setSelectedRole] = useState<AppRole>('chairman');
  const [email, setEmail] = useState(ROLE_META.chairman.email);
  const [password, setPassword] = useState('bogcl2026');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectPersona = (p: PersonaOption) => {
    const meta = ROLE_META[p.role];
    setSelectedRole(p.role);
    setEmail(meta.email);
    setPassword('bogcl2026');
  };

  const handleEmailChange = (val: string) => {
    setEmail(val);
    const normalized = val.trim().toLowerCase();
    const matchedRole = (Object.keys(ROLE_META) as AppRole[]).find(
      (r) =>
        ROLE_META[r].email.toLowerCase() === normalized ||
        ROLE_META[r].empId.toLowerCase() === normalized
    );
    if (matchedRole) {
      setSelectedRole(matchedRole);
    }
  };

  const handleTelemetryComplete = () => {
    setIsSubmitting(false);
    onLogin(selectedRole);
    const meta = ROLE_META[selectedRole];
    showToast(
      t(
        `Welcome, ${meta.name}! Signed into BOGCL OneOps.`,
        `স্বাগতম, ${meta.nameBn}! সফলভাবে লগইন সম্পন্ন হয়েছে।`,
        lang
      ),
      'gold'
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
  };

  const currentMeta = ROLE_META[selectedRole];

  return (
    <div className={`login-screen${lang === 'bn' ? ' lang-bn' : ''}`}>
      {/* Top Header Bar */}
      <header className="login-topbar">
        <div className="login-brand-logo">
          <div className="brand-emblem">B</div>
          <div className="login-brand-title">
            <h1>BASHUNDHARA OIL & GAS COMPANY LTD.</h1>
            <p>{t('A Concern of Bashundhara Group • Company Operations Portal', 'বসুন্ধরা গ্রুপ — দেশ ও মানুষের কল্যাণে', lang)}</p>
          </div>
        </div>

        <button
          className="btn-lang"
          onClick={onLangToggle}
          style={{
            background: 'rgba(255,255,255,0.08)',
            color: '#fff',
            borderColor: 'rgba(255,255,255,0.18)',
            padding: '6px 14px',
            borderRadius: '20px',
            cursor: 'pointer',
          }}
        >
          <Globe size={14} />
          <span>{lang === 'en' ? 'বাংলা' : 'English'}</span>
        </button>
      </header>

      {/* Centered Main Form Container */}
      <main className="login-body">
        <div className="login-card-centered">
          {/* Card Brand Header */}
          <div className="login-card-header">
            <div className="brand-badge-ring">
              <div className="brand-emblem-large">B</div>
            </div>
            <h2 className="login-main-title">
              {t('Sign In to BOGCL OneOps', 'বসুন্ধরা ওয়ান-অপ্স পোর্টালে সাইন ইন করুন', lang)}
            </h2>
            <p className="login-main-subtitle">
              {t(
                'Daily Operations, Approvals, Vehicles, Assets & Staff Services',
                'দৈনন্দিন কার্যক্রম, অনুমোদন, পরিবহন, সম্পদ ও কর্মী সেবা পোর্টাল',
                lang
              )}
            </p>
          </div>

          {/* Quick Demo Role Switcher */}
          <div className="demo-persona-section">
            <div className="demo-persona-label">
              <Sparkles size={12} color="var(--brand-gold)" />
              <span>{t('Choose a Role to Preview the System', 'সিস্টেমটি দেখার জন্য যেকোনো একটি পদবি নির্বাচন করুন', lang)}</span>
            </div>

            <div className="demo-pills-grid">
              {PERSONAS.map((p) => {
                const meta = ROLE_META[p.role];
                const isSelected = selectedRole === p.role;
                return (
                  <button
                    key={p.role}
                    type="button"
                    className={`demo-pill-btn ${isSelected ? 'active' : ''}`}
                    onClick={() => handleSelectPersona(p)}
                    title={`${meta.name} (${meta.empId}) — ${t(meta.label, meta.labelBn, lang)}`}
                  >
                    <span className="demo-pill-avatar" style={{ background: meta.avatarColor }}>
                      {meta.initials}
                    </span>
                    <span className="demo-pill-text">
                      <strong className="demo-pill-name">{meta.shortName}</strong>
                      <span className="demo-pill-role">{t(p.shortLabel, p.shortLabelBn, lang)}</span>
                    </span>
                    {isSelected && <span className="demo-pill-check">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="login-form-clean">
            {/* Work Email / Employee ID */}
            <div className="form-group-clean">
              <div className="label-with-link">
                <label>{t('Work Email or Employee ID', 'অফিস ইমেইল অথবা কর্মী আইডি', lang)}</label>
                <span style={{ fontSize: '11px', color: 'var(--brand-gold)', fontWeight: 700, fontFamily: 'monospace' }}>
                  {currentMeta.empId}
                </span>
              </div>
              <div className="login-input-clean">
                <Mail size={15} className="input-icon-clean" />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  placeholder="name@bashundhara.com or EMP-0001"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group-clean">
              <div className="label-with-link">
                <label>{t('Password', 'পাসওয়ার্ড', lang)}</label>
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    showToast(
                      t(
                        'For password reset, please call IT Support Desk at Ext. 4401.',
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
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="pw-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="login-options-clean">
              <label className="remember-checkbox-clean">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>{t('Keep me signed in on this computer', 'এই ডিভাইসে সাইন-ইন মনে রাখুন', lang)}</span>
              </label>
            </div>

            {/* Primary Submit Button */}
            <button
              type="submit"
              className="btn-login-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span>{t('Signing In...', 'প্রবেশ করা হচ্ছে...', lang)}</span>
              ) : (
                <>
                  <span>
                    {t(
                      `Sign In as ${currentMeta.shortName} (${currentMeta.label})`,
                      `${currentMeta.nameBn} হিসেবে প্রবেশ করুন`,
                      lang
                    )}
                  </span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            {/* Divider */}
            <div className="login-divider-clean">
              <span>{t('or continue with', 'অথবা', lang)}</span>
            </div>

            {/* Company Single Sign-On */}
            <button
              type="button"
              className="btn-sso-clean"
              onClick={() => setIsSubmitting(true)}
            >
              <ShieldCheck size={16} color="var(--brand-gold)" />
              <span>{t('Sign In with Bashundhara Group Office Account', 'বসুন্ধরা গ্রুপ অফিস অ্যাকাউন্ট দিয়ে প্রবেশ করুন', lang)}</span>
            </button>
          </form>
        </div>
      </main>

      {/* Clean Footer */}
      <footer className="login-footer-clean">
        <div>
          © 2026 <strong>Bashundhara Oil & Gas Company Limited</strong>. All rights reserved.
        </div>
        <div className="login-footer-tags">
          <span>🔒 {t('Secure Connection', 'নিরাপদ সংযোগ', lang)}</span>
          <span>•</span>
          <span>{t('Baridhara Head Office', 'বারিধারা প্রধান কার্যালয়', lang)}</span>
          <span>•</span>
          <span>{t('Keraniganj Plant', 'কেরানীগঞ্জ প্ল্যান্ট', lang)}</span>
        </div>
      </footer>

      {/* Sign-In Progress Overlay */}
      {isSubmitting && (
        <TelemetryLoader
          role={selectedRole}
          lang={lang}
          onComplete={handleTelemetryComplete}
        />
      )}
    </div>
  );
}
