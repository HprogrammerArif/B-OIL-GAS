import React, { useState, useEffect } from 'react';
import { Lang, t, ROLE_META, AppRole } from '../types';
import { Activity, CheckCircle2, Radio } from 'lucide-react';

interface TelemetryLoaderProps {
  role: AppRole;
  lang: Lang;
  onComplete: () => void;
}

const STEPS = [
  { textEn: 'Verifying your employee account...', textBn: 'আপনার কর্মী অ্যাকাউন্ট যাচাই করা হচ্ছে...' },
  { textEn: 'Connecting to Head Office & Keraniganj Plant...', textBn: 'প্রধান কার্যালয় ও কেরানীগঞ্জ প্ল্যান্টের সাথে সংযোগ...' },
  { textEn: 'Loading latest approvals, vehicles & records...', textBn: 'সর্বশেষ অনুমোদন, গাড়ি ও নথিপত্র লোড হচ্ছে...' },
  { textEn: 'Preparing your workspace...', textBn: 'আপনার ওয়ার্কস্পেস প্রস্তুত করা হচ্ছে...' },
];

export default function TelemetryLoader({ role, lang, onComplete }: TelemetryLoaderProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(18);
  const meta = ROLE_META[role];

  useEffect(() => {
    const timer1 = setTimeout(() => { setCurrentStepIndex(1); setProgress(45); }, 280);
    const timer2 = setTimeout(() => { setCurrentStepIndex(2); setProgress(75); }, 600);
    const timer3 = setTimeout(() => { setCurrentStepIndex(3); setProgress(100); }, 920);
    const timerEnd = setTimeout(() => { onComplete(); }, 1200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timerEnd);
    };
  }, [onComplete]);

  return (
    <div className="telemetry-loader-overlay" role="dialog" aria-modal="true" aria-label="Authenticating session">
      <div className="telemetry-loader-box">
        <div className="loader-emblem-wrap">
          <div className="brand-emblem loader-pulse">B</div>
          <div className="loader-ring" />
        </div>

        <div className="loader-hd">
          <h3>BASHUNDHARA OIL & GAS COMPANY LTD.</h3>
          <p className="loader-sub">
            {t('OneOps Operations Portal • Authenticating Session', 'ওয়ান-অপ্স পোর্টাল • সেশন যাচাই করা হচ্ছে', lang)}
          </p>
        </div>

        {/* User Identity Welcome */}
        <div className="loader-persona-pill">
          <div
            className="persona-avatar"
            style={{
              background: meta.avatarColor,
              width: '26px',
              height: '26px',
              fontSize: '10px',
              fontWeight: 800,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
            }}
          >
            {meta.initials}
          </div>
          <div>
            <span className="user-name" style={{ fontWeight: 700 }}>
              {t(meta.name, meta.nameBn, lang)}
            </span>
            <span className="user-role" style={{ opacity: 0.85, fontSize: '11px' }}>
              {' '}• {t(meta.label, meta.labelBn, lang)} ({meta.empId})
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="loader-progress-track">
          <div className="loader-progress-fill" style={{ width: `${progress}%` }} />
        </div>

        <div className="loader-pct-row">
          <span>{progress}% {t('Initialized', 'সম্পন্ন', lang)}</span>
          <span className="loader-status-tag" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Radio size={11} className="spin-slow" />
            <span>{t(meta.siteLabel, meta.siteLabelBn, lang)}</span>
          </span>
        </div>

        {/* Live Step Stream */}
        <div className="loader-steps-list">
          {STEPS.map((step, idx) => {
            const isDone = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            if (idx > currentStepIndex) return null;

            return (
              <div key={idx} className={`loader-step-row ${isCurrent ? 'active' : 'done'}`}>
                {isDone ? (
                  <CheckCircle2 size={13} color="var(--status-success-bright)" />
                ) : (
                  <Activity size={13} color="var(--brand-gold)" className="spin-anim" />
                )}
                <span>{t(step.textEn, step.textBn, lang)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

