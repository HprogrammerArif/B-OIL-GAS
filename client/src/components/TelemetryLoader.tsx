import React, { useState, useEffect } from 'react';
import { Lang, t, ROLE_META, AppRole } from '../types';
import { Shield, Cpu, Activity, CheckCircle2, Lock, Radio } from 'lucide-react';

interface TelemetryLoaderProps {
  role: AppRole;
  lang: Lang;
  onComplete: () => void;
}

const STEPS = [
  { textEn: 'Authenticating 256-bit TLS enterprise token...', textBn: '২৫৬-বিট টিএলএস টোকেন যাচাই করা হচ্ছে...' },
  { textEn: 'Establishing edge mesh link to Keraniganj Refinery DCS...', textBn: 'কেরানীগঞ্জ রিফাইনারি ডিসিএস নোডে সংযোগ স্থাপন...' },
  { textEn: 'Synchronizing SAP S/4HANA Enterprise Gateway ledger...', textBn: 'এসএপি এস/ফোরহানা গেটওয়ে সিঙ্ক করা হচ্ছে...' },
  { textEn: 'Validating tamper-proof cryptographic e-sign certificates...', textBn: 'ডিজিটাল ই-স্বাক্ষর নিরাপত্তা সনদ যাচাই...' },
  { textEn: 'Launching BOGCL OneOps Executive Cockpit...', textBn: 'এক্সিকিউটিভ কক্পিট প্রস্তুত করা হচ্ছে...' },
];

export default function TelemetryLoader({ role, lang, onComplete }: TelemetryLoaderProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(12);
  const meta = ROLE_META[role];

  useEffect(() => {
    const timer1 = setTimeout(() => { setCurrentStepIndex(1); setProgress(35); }, 300);
    const timer2 = setTimeout(() => { setCurrentStepIndex(2); setProgress(62); }, 650);
    const timer3 = setTimeout(() => { setCurrentStepIndex(3); setProgress(88); }, 950);
    const timer4 = setTimeout(() => { setCurrentStepIndex(4); setProgress(100); }, 1250);
    const timerEnd = setTimeout(() => { onComplete(); }, 1550);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timerEnd);
    };
  }, [onComplete]);

  return (
    <div className="telemetry-loader-overlay">
      <div className="telemetry-loader-box">
        {/* Glow emblem */}
        <div className="loader-emblem-wrap">
          <div className="brand-emblem loader-pulse">B</div>
          <div className="loader-ring" />
        </div>

        <div className="loader-hd">
          <h3>BASHUNDHARA OIL & GAS COMPANY LTD.</h3>
          <p className="loader-sub">OneOps Enterprise Operations Platform • Terminal Handshake</p>
        </div>

        {/* User Identity Welcome */}
        <div className="loader-persona-pill">
          <div className="persona-avatar" style={{ background: meta.avatarColor, width: '28px', height: '28px', fontSize: '11px' }}>
            {meta.initials}
          </div>
          <div>
            <span className="user-name">{meta.name}</span>
            <span className="user-role"> • {t(meta.label, meta.labelBn, lang)}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="loader-progress-track">
          <div className="loader-progress-fill" style={{ width: `${progress}%` }} />
        </div>

        <div className="loader-pct-row">
          <span>{progress}% Loaded</span>
          <span className="loader-status-tag">
            <Radio size={11} className="spin-slow" />
            <span>Industrial Edge Node: 23.6844° N</span>
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
