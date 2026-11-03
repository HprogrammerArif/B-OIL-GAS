import { useEffect, useRef, useState } from 'react';
import { Lock, Mic, MicOff, PhoneOff, Users, Video, VideoOff, X } from 'lucide-react';
import { t, type Lang } from '../../types';
import { formatClock } from './helpers';

interface CallModalProps {
  mode: 'voice' | 'video';
  /** Channel name for group conferences, or the person being called. */
  subject: string;
  isGroup: boolean;
  initials?: string;
  participantCount?: number;
  onClose: () => void;
  lang: Lang;
}

/** Secure call overlay: connecting → live clock, mute / camera toggles, Esc to hang up. */
export default function CallModal({ mode, subject, isGroup, initials, participantCount, onClose, lang }: CallModalProps) {
  const [connected, setConnected] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(mode === 'voice');
  const endRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const id = window.setTimeout(() => setConnected(true), 1400);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!connected) return undefined;
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [connected]);

  useEffect(() => {
    endRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const title = isGroup
    ? t(`Leadership conference · #${subject}`, `নেতৃত্ব সম্মেলন · #${subject}`, lang)
    : t(`Secure direct line · ${subject}`, `নিরাপদ সরাসরি লাইন · ${subject}`, lang);

  return (
    <div className="ic-call-overlay" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="ic-call-modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="ic-call-header">
          <div className="ic-call-badge">
            <Lock size={12} />
            <span>{mode === 'video' ? t('SECURE VIDEO CONFERENCE', 'নিরাপদ ভিডিও মিটিং', lang) : t('SECURE VOICE LINE', 'নিরাপদ ভয়েস লাইন', lang)}</span>
          </div>
          <button type="button" className="ic-call-close" onClick={onClose} aria-label={t('Close', 'বন্ধ করুন', lang)}>
            <X size={16} />
          </button>
        </div>

        <div className="ic-call-stage">
          <div className="ic-call-visualizer-ring">
            {connected && <div className="ic-call-pulse-ring" />}
            {connected && <div className="ic-call-pulse-ring delay" />}
            <div className="ic-call-avatar-center">{isGroup ? <Users size={38} /> : initials}</div>
          </div>
          <h3 className="ic-call-subject">{title}</h3>
          <p className="ic-call-time" aria-live="polite">
            {connected
              ? `${formatClock(seconds)} · ${t('Encrypted in transit', 'ট্রান্সমিশনে এনক্রিপ্টেড', lang)}`
              : t('Connecting securely…', 'নিরাপদভাবে সংযোগ হচ্ছে…', lang)}
          </p>
          {isGroup && participantCount !== undefined && (
            <p className="ic-call-participants">
              <Users size={12} /> {t(`${participantCount} members invited`, `${participantCount} জন সদস্যকে আমন্ত্রণ`, lang)}
            </p>
          )}
        </div>

        <div className="ic-call-control-bar">
          <button
            type="button"
            className={`ic-ctrl-btn ${muted ? 'off' : ''}`}
            onClick={() => setMuted((m) => !m)}
            aria-pressed={muted}
            aria-label={muted ? t('Unmute microphone', 'মাইক চালু করুন', lang) : t('Mute microphone', 'মাইক বন্ধ করুন', lang)}
            title={muted ? t('Unmute microphone', 'মাইক চালু করুন', lang) : t('Mute microphone', 'মাইক বন্ধ করুন', lang)}
          >
            {muted ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          <button
            type="button"
            className={`ic-ctrl-btn ${cameraOff ? 'off' : ''}`}
            onClick={() => setCameraOff((c) => !c)}
            aria-pressed={cameraOff}
            aria-label={cameraOff ? t('Turn camera on', 'ক্যামেরা চালু করুন', lang) : t('Turn camera off', 'ক্যামেরা বন্ধ করুন', lang)}
            title={cameraOff ? t('Turn camera on', 'ক্যামেরা চালু করুন', lang) : t('Turn camera off', 'ক্যামেরা বন্ধ করুন', lang)}
          >
            {cameraOff ? <VideoOff size={18} /> : <Video size={18} />}
          </button>
          <button
            ref={endRef}
            type="button"
            className="ic-ctrl-btn end-call"
            onClick={onClose}
            aria-label={t('End call', 'কল শেষ করুন', lang)}
            title={t('End call', 'কল শেষ করুন', lang)}
          >
            <PhoneOff size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
