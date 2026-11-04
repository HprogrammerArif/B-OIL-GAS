import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { AppRole, Lang, ROLE_META, t } from '../types';
import { Lock, Unlock, LogOut } from 'lucide-react';
import { showToast } from './ToastManager';
import { sessionStore } from '../auth/session';

const MAX_UNLOCK_ATTEMPTS = 5;

interface LockScreenModalProps {
  role: AppRole;
  lang: Lang;
  onUnlock: () => void;
  onLogout: () => void;
}

export default function LockScreenModal({
  role,
  lang,
  onUnlock,
  onLogout,
}: LockScreenModalProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [checking, setChecking] = useState(false);
  const meta = ROLE_META[role];

  const handleUnlockAttempt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin || checking) return;
    setChecking(true);
    const ok = await sessionStore.verifyPassword(pin);
    setChecking(false);
    setPin('');
    if (ok) {
      onUnlock();
      showToast(
        t(
          `Screen unlocked. Welcome back, ${meta.name}!`,
          `স্ক্রিন আনলক হয়েছে। স্বাগতম, ${meta.nameBn}!`,
          lang
        ),
        'success'
      );
      return;
    }
    const next = attempts + 1;
    setAttempts(next);
    setError(true);
    if (next >= MAX_UNLOCK_ATTEMPTS) {
      showToast(t('Too many failed attempts. Please sign in again.', 'বারবার ভুল চেষ্টা। আবার সাইন ইন করুন।', lang), 'danger');
      onLogout();
    }
  };

  const portalTarget =
    (typeof document !== 'undefined' && document.querySelector('.app-shell')) ||
    (typeof document !== 'undefined' ? document.body : null);

  const modalContent = (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        background: 'radial-gradient(ellipse at center, var(--surface-inverse) 0%, var(--surface-inverse-deep) 100%)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        boxSizing: 'border-box',
        color: 'var(--text-on-brand)',
        animation: 'fadeInBackdrop 0.25s ease',
      }}
    >
      <div
        style={{
          maxWidth: '420px',
          width: '100%',
          textAlign: 'center',
          background: 'rgba(255, 255, 255, 0.04)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '18px',
          padding: '36px 28px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6)',
        }}
      >
        {/* Header Pill */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 12px',
            borderRadius: '20px',
            background: 'rgba(212, 175, 55, 0.12)',
            border: '1px solid rgba(212, 175, 55, 0.3)',
            marginBottom: '24px',
          }}
        >
          <Lock size={13} color="var(--brand-gold)" />
          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              color: 'var(--brand-gold)',
              letterSpacing: '0.8px',
              textTransform: 'uppercase',
            }}
          >
            {t('Screen Locked', 'স্ক্রিন লক করা আছে', lang)}
          </span>
        </div>

        {/* User Avatar */}
        <div
          style={{
            width: '74px',
            height: '74px',
            borderRadius: '50%',
            background: meta.avatarColor,
            color: 'var(--text-on-brand)',
            border: '3px solid var(--brand-gold)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            fontWeight: 900,
            margin: '0 auto 16px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {meta.avatarUrl ? (
            <img
              src={meta.avatarUrl}
              alt={meta.shortName}
              style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
          ) : null}
          <span>{meta.initials}</span>
        </div>

        <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 4px', color: 'var(--text-on-brand)' }}>
          {t(meta.name, meta.nameBn, lang)}
        </h2>
        <div style={{ fontSize: '12.5px', color: 'var(--brand-gold)', fontWeight: 600 }}>
          {t(meta.label, meta.labelBn, lang)}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', marginBottom: '20px' }}>
          {t(`${meta.dept} • ${meta.empId}`, `${meta.deptBn} • ${meta.empId}`, lang)}
        </div>

        {/* Unlock Form */}
        <form onSubmit={handleUnlockAttempt}>
          <div style={{ marginBottom: '14px' }}>
            <input
              type="password"
              placeholder={t('Enter your password', 'আপনার পাসওয়ার্ড দিন', lang)}
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                if (error) setError(false);
              }}
              autoComplete="current-password"
              autoFocus
              style={{
                width: '100%',
                padding: '12px 16px',
                textAlign: 'center',
                letterSpacing: '3px',
                fontSize: '15px',
                borderRadius: '8px',
                border: error ? '2px solid var(--status-danger)' : '1px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.08)',
                color: 'var(--text-on-brand)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            {error && (
              <div style={{ color: 'var(--status-danger-bright)', fontSize: '11px', marginTop: '6px' }}>
                {t(
                  `Incorrect password. ${MAX_UNLOCK_ATTEMPTS - attempts} attempt(s) left.`,
                  `ভুল পাসওয়ার্ড। আর ${MAX_UNLOCK_ATTEMPTS - attempts} বার চেষ্টা করা যাবে।`,
                  lang
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn-gold"
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '13px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <Unlock size={15} />
            <span>{t('Unlock Screen', 'স্ক্রিন আনলক করুন', lang)}</span>
          </button>
        </form>

        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '14px', fontSize: '11px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={onLogout}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--status-danger-bright)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <LogOut size={13} />
            <span>{t('Sign In as Another User', 'অন্য অ্যাকাউন্টে প্রবেশ করুন', lang)}</span>
          </button>
        </div>
      </div>
    </div>
  );

  return portalTarget ? createPortal(modalContent, portalTarget) : modalContent;
}
