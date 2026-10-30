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
    const timer1 = setTimeout(() => { setCurrentStepIndex(1); setProgress(45); }, 250);
    const timer2 = setTimeout(() => { setCurrentStepIndex(2); setProgress(75); }, 550);
    const timer3 = setTimeout(() => { setCurrentStepIndex(3); setProgress(100); }, 850);
    const timerEnd = setTimeout(() => { onComplete(); }, 1150);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timerEnd);
    };
  }, [onComplete]);

  return (
    <div className="telemetry-loader-overlay">
      <div className="telemetry-loader-box">
        <div className="loader-emblem-wrap">
          <div className="brand-emblem loader-pulse">B</div>
          <div className="loader-ring" />
        </div>

        <div className="loader-hd">
          <h3>BASHUNDHARA OIL & GAS COMPANY LTD.</h3>
          <p className="loader-sub">{t('OneOps Company Operations Portal • Signing In', 'ওয়ানঅপ্স কোম্পানি পোর্টাল • প্রবেশ করা হচ্ছে', lang)}</p>
        </div>

        {/* User Identity Welcome */}
        <div className="loader-persona-pill">
          <div className="persona-avatar" style={{ background: meta.avatarColor, width: '28px', height: '28px', fontSize: '11px' }}>
            {meta.initials}
          </div>
          <div>
            <span className="user-name">{t(meta.name, meta.nameBn, lang)}</span>
            <span className="user-role"> • {t(meta.label, meta.labelBn, lang)} ({meta.empId})</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="loader-progress-track">
          <div className="loader-progress-fill" style={{ width: `${progress}%` }} />
        </div>

        <div className="loader-pct-row">
          <span>{progress}% {t('Ready', 'সম্পন্ন', lang)}</span>
          <span className="loader-status-tag">
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
                  <CheckCircle2 size={13} color="#34D399" />
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
