import React, { useState } from 'react';
import { AppRole, Lang, ROLE_META, t } from '../types';
import { Lock, Unlock, LogOut, ShieldCheck } from 'lucide-react';
import { showToast } from '../App';

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
  const meta = ROLE_META[role];

  const handleUnlockAttempt = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.trim() === '1234') {
      onUnlock();
      showToast(
        t(
          `Screen unlocked. Welcome back, ${meta.name}!`,
          `স্ক্রিন আনলক হয়েছে। স্বাগতম, ${meta.nameBn}!`,
          lang
        ),
        'success'
      );
    } else {
      setError(true);
      setTimeout(() => setError(false), 2500);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'radial-gradient(ellipse at center, #111A38 0%, #060D1F 100%)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        color: '#fff',
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
            color: '#fff',
            border: '3px solid var(--brand-gold)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            fontWeight: 900,
            margin: '0 auto 16px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
          }}
        >
          {meta.initials}
        </div>

        <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 4px', color: '#fff' }}>
          {t(meta.name, meta.nameBn, lang)}
        </h2>
        <div style={{ fontSize: '12.5px', color: 'var(--brand-gold)', fontWeight: 600 }}>
          {t(meta.label, meta.labelBn, lang)}
        </div>
        <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px', marginBottom: '20px' }}>
          {t(`${meta.dept} • ${meta.empId}`, `${meta.deptBn} • ${meta.empId}`, lang)}
        </div>

        {/* Unlock Form */}
        <form onSubmit={handleUnlockAttempt}>
          <div style={{ marginBottom: '14px' }}>
            <input
              type="password"
              placeholder={t('Enter 4-Digit PIN (Demo PIN: 1234)', '৪-সংখ্যার পিন দিন (ডেমো পিন: 1234)', lang)}
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                if (error) setError(false);
              }}
              maxLength={6}
              autoFocus
              style={{
                width: '100%',
                padding: '12px 16px',
                textAlign: 'center',
                letterSpacing: '3px',
                fontSize: '15px',
                borderRadius: '8px',
                border: error ? '2px solid #EF4444' : '1px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#fff',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <div style={{ color: error ? '#F87171' : '#94A3B8', fontSize: '11px', marginTop: '6px' }}>
              {error
                ? t('Incorrect PIN. Please enter 1234 to unlock.', 'ভুল পিন। আনলক করতে 1234 টাইপ করুন।', lang)
                : t('Demo PIN: 1234', 'ডেমো পিন: 1234', lang)}
            </div>
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
            onClick={() => {
              onUnlock();
              showToast(t('Unlocked using quick fingerprint check.', 'দ্রুত ফিঙ্গারপ্রিন্ট যাচাইয়ে আনলক হয়েছে।', lang), 'success');
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <ShieldCheck size={13} color="#10B981" />
            <span>{t('Quick Fingerprint Unlock', 'দ্রুত ফিঙ্গারপ্রিন্ট আনলক', lang)}</span>
          </button>

          <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>•</span>

          <button
            type="button"
            onClick={onLogout}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#F87171',
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
}
