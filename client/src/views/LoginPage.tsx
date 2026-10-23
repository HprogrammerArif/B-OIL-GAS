import React, { useState } from 'react';
import { AppRole, Lang, ROLE_META, t } from '../types';
import { showToast } from '../App';
import {
  Lock, Mail, ArrowRight, ShieldCheck,
  Globe, Eye, EyeOff, Sparkles, User
} from 'lucide-react';
import TelemetryLoader from '../components/TelemetryLoader';

interface LoginPageProps {
  onLogin: (role: AppRole) => void;
  lang: Lang;
  onLangToggle: () => void;
}

interface PersonaOption {
  role: AppRole;
  email: string;
  shortLabel: string;
  shortLabelBn: string;
}

const PERSONAS: PersonaOption[] = [
  { role: 'chairman',       email: 'ahmed.sobhan@bashundhara.com',    shortLabel: 'Chairman & MD',       shortLabelBn: 'চেয়ারম্যান' },
  { role: 'plant_gm',       email: 'harunur.rashid@bashundhara.com',  shortLabel: 'Plant GM',            shortLabelBn: 'প্ল্যান্ট জিএম' },
  { role: 'hr_admin',       email: 'afroza.sultana@bashundhara.com',  shortLabel: 'HR GM',               shortLabelBn: 'এইচআর জিএম' },
  { role: 'transport_admin',email: 'kamruzzaman@bashundhara.com',     shortLabel: 'Transport Super',     shortLabelBn: 'পরিবহন সুপার' },
  { role: 'hod',            email: 'farida.begum@bashundhara.com',    shortLabel: 'Finance HOD',         shortLabelBn: 'অর্থ প্রধান' },
  { role: 'employee',       email: 'tanvir.ahmed@bashundhara.com',    shortLabel: 'Staff Self-Service',  shortLabelBn: 'কর্মী সেলফ-সার্ভিস' },
  { role: 'driver',         email: 'rafiqul.driver@bashundhara.com',  shortLabel: 'Duty Driver Terminal',shortLabelBn: 'ডিউটি ড্রাইভার' },
];

export default function LoginPage({ onLogin, lang, onLangToggle }: LoginPageProps) {
  const [selectedRole, setSelectedRole] = useState<AppRole>('chairman');
  const [email, setEmail] = useState('ahmed.sobhan@bashundhara.com');
  const [password, setPassword] = useState('••••••••••••');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectPersona = (p: PersonaOption) => {
    setSelectedRole(p.role);
    setEmail(p.email);
    setPassword('••••••••••••');
  };

  const handleTelemetryComplete = () => {
    setIsSubmitting(false);
    onLogin(selectedRole);
    const meta = ROLE_META[selectedRole];
    showToast(t(
      `Welcome, ${meta.name}! Logged into BOGCL OneOps.`,
      `স্বাগতম, ${meta.name}! সফলভাবে লগইন সম্পন্ন হয়েছে।`,
      lang
    ), 'gold');
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
            <p>{t('A Concern of Bashundhara Group • Enterprise Operations', 'বসুন্ধরা গ্রুপ — দেশ ও মানুষের কল্যাণে', lang)}</p>
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
            cursor: 'pointer'
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
              {t('Sign In to BOGCL OneOps', 'বসুন্ধরা ওয়ান-অপ্স এ সাইন ইন করুন', lang)}
            </h2>
            <p className="login-main-subtitle">
              {t('Unified Operational Governance & Refinery Command', 'একীভূত অপারেশনাল গভর্ন্যান্স ও রিফাইনারি কমান্ড', lang)}
            </p>
          </div>

          {/* Quick Demo Persona Switcher (Clean, intuitive 3x2 pills) */}
          <div className="demo-persona-section">
            <div className="demo-persona-label">
              <Sparkles size={12} color="var(--brand-gold)" />
              <span>{t('Select Persona for Demo / Evaluation', 'ডেমো পর্যালোচনার জন্য পদবি নির্বাচন করুন', lang)}</span>
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
                    title={`${meta.name} — ${t(meta.label, meta.labelBn, lang)}`}
                  >
                    <span className="demo-pill-avatar" style={{ background: meta.avatarColor }}>
                      {meta.initials}
                    </span>
                    <span className="demo-pill-text">
                      <strong className="demo-pill-name">{meta.name.split(' ')[0]}</strong>
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
            {/* Corporate Email / PERNR */}
            <div className="form-group-clean">
              <label>{t('Corporate Email / Employee ID', 'প্রাতিষ্ঠানিক ইমেইল বা আইডি', lang)}</label>
              <div className="login-input-clean">
                <Mail size={15} className="input-icon-clean" />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@bashundhara.com"
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
                    showToast(t('Contact Bashundhara IT Helpdesk: ext. 4401', 'আইটি হেল্পডেস্কে যোগাযোগ করুন: ext. 4401', lang), 'info');
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
                <span>{t('Remember this workstation', 'এই ওয়ার্কস্টেশন মনে রাখুন', lang)}</span>
              </label>
            </div>

            {/* Primary Submit Button */}
            <button
              type="submit"
              className="btn-login-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span>{t('Authenticating Credentials...', 'যাচাই করা হচ্ছে...', lang)}</span>
              ) : (
                <>
                  <span>
                    {t(
                      `Sign In as ${currentMeta.name.split(' ')[0]}`,
                      `${currentMeta.name.split(' ')[0]} হিসেবে প্রবেশ করুন`,
                      lang
                    )}
                  </span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            {/* Subtle SSO Divider */}
            <div className="login-divider-clean">
              <span>{t('or continue with', 'অথবা', lang)}</span>
            </div>

            {/* Enterprise Active Directory SSO */}
            <button
              type="button"
              className="btn-sso-clean"
              onClick={() => setIsSubmitting(true)}
            >
              <ShieldCheck size={16} color="var(--brand-gold)" />
              <span>{t('Bashundhara Group Active Directory (SSO)', 'বসুন্ধরা গ্রুপ অ্যাক্টিভ ডিরেক্টরি (এসএসও)', lang)}</span>
            </button>
          </form>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="login-footer-clean">
        <div>
          © 2026 <strong>Bashundhara Oil & Gas Company Limited</strong>. All rights reserved.
        </div>
        <div className="login-footer-tags">
          <span>🔒 256-Bit TLS</span>
          <span>•</span>
          <span>ISO 9001:2015</span>
          <span>•</span>
          <span>Keraniganj Refinery Node</span>
        </div>
      </footer>

      {/* Telemetry Loader */}
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
