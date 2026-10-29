import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Mic,
  Square,
  Play,
  Pause,
  RotateCcw,
  Send,
  Volume2,
  Radio,
  Users,
  CheckCircle2,
  Sparkles,
  ShieldAlert,
  Clock,
  Layers,
} from 'lucide-react';
import { Lang, t } from '../../types';
import { showToast } from '../../App';
import { voiceBriefingStore, VoiceBriefingItem } from '../../store/voiceBriefingStore';

interface SendVoiceBriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Lang;
}

const PRESET_VOICE_MEMOS = [
  {
    key: 'factory_run',
    label: '🏭 Factory Run & Generator Overhaul',
    labelBn: '🏭 কারখানা উৎপাদন ও জেনারেটর মেরামত',
    duration: 42,
    title: "Chairman's Morning Strategic Direction",
    titleBn: 'চেয়ারম্যান মহোদয়ের সকালের দিকনির্দেশনা',
    text: 'Keraniganj refinery team, maintain 5,000 MT peak output today. I have sanctioned the emergency generator overhaul with 5% warranty clause. Zero plant downtime authorized. CFO Farida, ensure all Mushak-6.3 tax vouchers are verified before BEFTN release.',
    textBn:
      'কেরানীগঞ্জ রিফাইনারি টিম, আজ ৫,০০০ মে.টন সর্বোচ্চ উৎপাদন বজায় রাখুন। ৫% ওয়ারেন্টি শর্তে জেনারেটর মেরামত অনুমোদন করা হয়েছে। অর্থ বিভাগকে নির্দেশ দেওয়া হলো ভ্যাট ভাউচার যাচাই করে অর্থছাড় করতে।',
  },
  {
    key: 'hse_safety',
    label: '⚠️ HSE Critical Steam Line Protocol',
    labelBn: '⚠️ এইচএসই হাই-প্রেসার স্টিম লাইন ব্রিফিং',
    duration: 35,
    title: 'HSE Safety Priority Mandate',
    titleBn: 'জরুরি নিরাপত্তা ব্রিফিং ও নির্দেশনা',
    text: 'Plant GM and HSE marshals, execute mandatory ultrasonic inspection on vacuum distillation steam line valves before Friday. Safety first, zero tolerance on protocol breaches.',
    textBn:
      'প্ল্যান্ট জিএম ও এইচএসই কর্মকর্তা, শুক্রবারের পূর্বে স্টিম লাইন ভালভের পরিদর্শন সম্পন্ন করুন। নিরাপত্তায় আপস নয়, জিরো টলারেন্স নীতি বজায় রাখুন।',
  },
  {
    key: 'finance_release',
    label: '💼 Finance & Vendor Disbursement',
    labelBn: '💼 অর্থ বিভাগ ও সরবরাহকারী বিল পরিশোধ',
    duration: 28,
    title: 'Vendor Payment & Statutory VAT Clearance',
    titleBn: 'ভ্যাট যাচাই ও ভেন্ডর পেমেন্ট ক্লিয়ারেন্স',
    text: 'Accounts and CFO Farida Begum, release pending supplier payments via BEFTN once Mushak-6.3 tax invoices are validated. Keep corporate credit lines solid.',
    textBn:
      'অর্থ বিভাগ ও সিএফও, ভ্যাট ইনভয়েস যাচাই করে বিইএফটিএন মাধ্যমে সরবরাহকারীদের পাওনা দ্রুত পরিশোধ করুন।',
  },
];

export default function SendVoiceBriefingModal({
  isOpen,
  onClose,
  lang,
}: SendVoiceBriefingModalProps) {
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'recorded' | 'playing'>('idle');
  const [seconds, setSeconds] = useState(0);
  const [selectedPreset, setSelectedPreset] = useState<string>(PRESET_VOICE_MEMOS[0].key);
  const [transcript, setTranscript] = useState(PRESET_VOICE_MEMOS[0].text);
  const [transcriptBn, setTranscriptBn] = useState(PRESET_VOICE_MEMOS[0].textBn);
  const [priority, setPriority] = useState<'normal' | 'urgent'>('urgent');
  const [audiences, setAudiences] = useState<string[]>([
    'Inner Circle (GM, CFO, Legal, HR)',
    'Keraniganj Plant Operations & Shift Leads',
  ]);
  const timerRef = useRef<any | null>(null);

  useEffect(() => {
    if (recordingState === 'recording') {
      timerRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev >= 60) {
            setRecordingState('recorded');
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } else if (recordingState === 'playing') {
      timerRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev <= 1) {
            setRecordingState('recorded');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [recordingState]);

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  const handleSelectPreset = (key: string) => {
    const p = PRESET_VOICE_MEMOS.find((item) => item.key === key);
    if (p) {
      setSelectedPreset(p.key);
      setTranscript(p.text);
      setTranscriptBn(p.textBn);
      setSeconds(p.duration);
      setRecordingState('recorded');
    }
  };

  const handleStartRecording = () => {
    setSeconds(0);
    setRecordingState('recording');
    showToast(t('Recording audio memo...', 'অডিও রেকর্ডিং শুরু হয়েছে...', lang), 'info');
  };

  const handleStopRecording = () => {
    setRecordingState('recorded');
    if (seconds === 0) setSeconds(42);
    showToast(t('Voice memo captured successfully.', 'ভয়েস মেমো রেকর্ড সম্পন্ন।', lang), 'success');
  };

  const handleTogglePlay = () => {
    if (recordingState === 'playing') {
      setRecordingState('recorded');
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } else {
      setRecordingState('playing');
      // Synthetic Voice Preview using SpeechSynthesis if available
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(transcript);
        utterance.rate = 1.0;
        utterance.pitch = 0.95;
        utterance.onend = () => {
          setRecordingState('recorded');
          setSeconds(42);
        };
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  const handleReset = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setRecordingState('idle');
    setSeconds(0);
  };

  const toggleAudience = (aud: string) => {
    setAudiences((prev) =>
      prev.includes(aud) ? prev.filter((a) => a !== aud) : [...prev, aud]
    );
  };

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    const currentPresetObj = PRESET_VOICE_MEMOS.find((p) => p.key === selectedPreset);

    const newBriefing: VoiceBriefingItem = {
      id: `VB-2026-${Date.now().toString().slice(-4)}`,
      senderName: 'Ahmed Akbar Sobhan',
      senderRole: 'Chairman & Managing Director',
      title: currentPresetObj?.title || "Chairman's Executive Voice Directive",
      titleBn: currentPresetObj?.titleBn || 'চেয়ারম্যান মহোদয়ের ভয়েস নির্দেশনা',
      durationSeconds: seconds || 42,
      recordedAt: 'Today, Just Now',
      transcript: transcript.trim() || PRESET_VOICE_MEMOS[0].text,
      transcriptBn: transcriptBn.trim() || PRESET_VOICE_MEMOS[0].textBn,
      targetAudiences: audiences.length > 0 ? audiences : ['Inner Circle'],
      priority,
      listenedCount: 0,
    };

    voiceBriefingStore.publishBriefing(newBriefing);

    showToast(
      lang === 'en'
        ? `🎙️ Chairman's 60-Sec Voice Memo broadcasted to ${audiences.length} target channels via Mobile & Radio!`
        : `🎙️ চেয়ারম্যান মহোদয়ের ভয়েস মেমো মোবাইল অ্যাপ ও পুশ অ্যালার্টের মাধ্যমে সম্প্রচারিত হয়েছে!`,
      'gold'
    );

    onClose();
  };

  return createPortal(
    <div
      className="modal-bg"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(15, 23, 42, 0.82)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        padding: '16px',
        boxSizing: 'border-box',
      }}
    >
      <div
        className="modal"
        style={{
          maxWidth: '700px',
          width: '100%',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '16px',
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          overflow: 'hidden',
          background: '#FFFFFF',
          margin: 'auto',
          animation: 'modal-pop 0.22s cubic-bezier(0.16,1,0.3,1) both',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className="modal-hd"
          style={{
            background: 'linear-gradient(135deg, #18181B 0%, #27272A 50%, #3F3F46 100%)',
            color: '#FFFFFF',
            padding: '16px 22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
            borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(212, 175, 55, 0.25)',
                border: '1.5px solid rgba(212, 175, 55, 0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FDE047',
              }}
            >
              <Mic size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#FFFFFF' }}>
                  {t("Executive Voice Briefing Studio", "চেয়ারম্যানের ভয়েস ব্রিফিং স্টুডিও", lang)}
                </h3>
                <span className="badge" style={{ background: '#DC2626', color: '#FFFFFF', fontSize: '9.5px', fontWeight: 800 }}>
                  CHAIRMAN DIRECT
                </span>
              </div>
              <div style={{ fontSize: '11.5px', color: '#D4D4D8', marginTop: '2px' }}>
                {t('Broadcast real-time executive voice directives to Inner Circle & factory leadership', 'মূল নেতৃত্ব ও কারখানায় তাৎক্ষণিক অডিও দিকনির্দেশনা সম্প্রচার', lang)}
              </div>
            </div>
          </div>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            title={t('Close', 'বন্ধ করুন', lang)}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              borderColor: 'rgba(255, 255, 255, 0.25)',
              color: '#FFFFFF',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleBroadcast} style={{ margin: 0, display: 'flex', flexDirection: 'column', flex: '1 1 auto', overflow: 'hidden' }}>
          <div className="modal-body" style={{ padding: '20px', overflowY: 'auto', flex: '1 1 auto' }}>
            
            {/* Audio Studio Waveform Console */}
            <div
              style={{
                background: 'linear-gradient(135deg, #09090B 0%, #18181B 100%)',
                borderRadius: '12px',
                padding: '18px 20px',
                marginBottom: '18px',
                border: '1px solid #27272A',
                color: '#FFFFFF',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: recordingState === 'recording' ? '#EF4444' : recordingState === 'playing' ? '#10B981' : '#EAB308',
                      boxShadow: recordingState === 'recording' ? '0 0 10px #EF4444' : undefined,
                      animation: recordingState === 'recording' ? 'pulse 1s infinite' : undefined,
                    }}
                  />
                  <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase', color: '#A1A1AA' }}>
                    {recordingState === 'recording'
                      ? '🔴 RECORDING LIVE (MAX 60s)'
                      : recordingState === 'playing'
                      ? '▶ PLAYING PREVIEW'
                      : recordingState === 'recorded'
                      ? '✓ VOICE MEMO READY'
                      : '● READY TO RECORD'}
                  </span>
                </div>
                <div style={{ fontSize: '15px', fontWeight: 800, fontFamily: 'monospace', color: '#FDE047' }}>
                  00:{seconds < 10 ? `0${seconds}` : seconds} / 01:00
                </div>
              </div>

              {/* Animated Waveform Visualizer */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  height: '46px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  borderRadius: '8px',
                  padding: '0 12px',
                  marginBottom: '14px',
                  overflow: 'hidden',
                }}
              >
                {Array.from({ length: 32 }).map((_, idx) => {
                  const isActive = recordingState === 'recording' || recordingState === 'playing';
                  const baseHeight = 8 + (Math.sin(idx * 0.5) * 12 + 14);
                  const dynamicHeight = isActive ? Math.max(6, (baseHeight * (1 + Math.sin(idx + Date.now() / 200))) % 40) : 6;

                  return (
                    <div
                      key={idx}
                      style={{
                        width: '3.5px',
                        height: `${dynamicHeight}px`,
                        background: isActive ? 'linear-gradient(to top, #D4AF37, #FDE047)' : '#3F3F46',
                        borderRadius: '2px',
                        transition: 'height 0.15s ease',
                      }}
                    />
                  );
                })}
              </div>

              {/* Studio Recording Controls */}
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '14px' }}>
                {recordingState !== 'recording' ? (
                  <button
                    type="button"
                    onClick={handleStartRecording}
                    style={{
                      background: '#DC2626',
                      border: 'none',
                      borderRadius: '50px',
                      padding: '8px 18px',
                      color: '#FFFFFF',
                      fontSize: '12px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 8px rgba(220, 38, 38, 0.4)',
                    }}
                  >
                    <Mic size={15} />
                    {t('Record Memo', 'রেকর্ড করুন', lang)}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStopRecording}
                    style={{
                      background: '#EA580C',
                      border: 'none',
                      borderRadius: '50px',
                      padding: '8px 18px',
                      color: '#FFFFFF',
                      fontSize: '12px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Square size={14} />
                    {t('Stop Recording', 'রেকর্ড থামান', lang)}
                  </button>
                )}

                {seconds > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={handleTogglePlay}
                      style={{
                        background: recordingState === 'playing' ? '#059669' : '#27272A',
                        border: '1px solid #3F3F46',
                        borderRadius: '50px',
                        padding: '8px 16px',
                        color: '#FFFFFF',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      {recordingState === 'playing' ? <Pause size={14} /> : <Play size={14} />}
                      {recordingState === 'playing' ? t('Pause', 'থামান', lang) : t('Play Preview', 'শুনুন', lang)}
                    </button>

                    <button
                      type="button"
                      onClick={handleReset}
                      style={{
                        background: 'transparent',
                        border: '1px solid #52525B',
                        borderRadius: '50px',
                        padding: '8px 14px',
                        color: '#A1A1AA',
                        fontSize: '11.5px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}
                      title="Reset audio memo"
                    >
                      <RotateCcw size={13} />
                      {t('Reset', 'রিসেট', lang)}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* 1-Click Executive Presets */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <Sparkles size={14} color="#D97706" />
                <label style={{ fontSize: '12px', fontWeight: 800, color: '#1E293B' }}>
                  {t('1-Click Pre-Recorded Executive Briefings:', 'দ্রুত এক-ক্লিক ব্রিফিং নির্বাচন:', lang)}
                </label>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {PRESET_VOICE_MEMOS.map((p) => {
                  const isSelected = selectedPreset === p.key;
                  return (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => handleSelectPreset(p.key)}
                      style={{
                        fontSize: '11.5px',
                        padding: '7px 12px',
                        borderRadius: '7px',
                        border: isSelected ? '1.5px solid #D97706' : '1px solid #CBD5E1',
                        background: isSelected ? '#FEF3C7' : '#FFFFFF',
                        color: isSelected ? '#92400E' : '#334155',
                        fontWeight: isSelected ? 800 : 500,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {lang === 'bn' ? p.labelBn : p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* AI Speech-to-Text Live Transcript */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A' }}>
                  {t('Live Speech-to-Text Transcript (Dispatched with Audio Alert):', 'লাইভ অডিও ট্রান্সক্রিপ্ট ও বিবরণ:', lang)}
                </label>
                <span className="badge green" style={{ fontSize: '10px' }}>✓ AI Transcribed</span>
              </div>
              <textarea
                rows={3}
                required
                className="form-input"
                style={{
                  width: '100%',
                  fontSize: '12px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1.5px solid #CBD5E1',
                  background: '#F8FAFC',
                  color: '#0F172A',
                  boxSizing: 'border-box',
                  lineHeight: 1.5,
                }}
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Spoken words transcribe here automatically..."
              />
            </div>

            {/* Target Audience Channels */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                {t('Broadcast Distribution Channels:', 'বার্তা প্রেরণের প্রাপক গোষ্ঠী:', lang)}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {[
                  'Inner Circle (GM, CFO, Legal, HR)',
                  'Keraniganj Plant Operations & Shift Leads',
                  'Central Transport & Heavy Fleet Hub',
                  'Enterprise Broadcast (All 1,240 Personnel)',
                ].map((aud) => {
                  const isChecked = audiences.includes(aud);
                  return (
                    <label
                      key={aud}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        background: isChecked ? '#EEF2FF' : '#F8FAFC',
                        border: isChecked ? '1px solid #818CF8' : '1px solid #E2E8F0',
                        fontSize: '11px',
                        fontWeight: isChecked ? 700 : 500,
                        color: isChecked ? '#3730A3' : '#475569',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleAudience(aud)}
                        style={{ cursor: 'pointer' }}
                      />
                      <span>{aud}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Priority & Delivery Protocol */}
            <div
              style={{
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: '8px',
                padding: '10px 12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={16} color="#DC2626" />
                <span style={{ fontSize: '11.5px', color: '#991B1B', fontWeight: 700 }}>
                  {t('Executive Red Alert Priority Override:', 'জরুরি অগ্রাধিকার স্তর:', lang)}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setPriority('normal')}
                  style={{
                    padding: '3px 10px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    border: 'none',
                    background: priority === 'normal' ? '#475569' : '#E2E8F0',
                    color: priority === 'normal' ? '#FFFFFF' : '#475569',
                    cursor: 'pointer',
                    fontWeight: priority === 'normal' ? 800 : 500,
                  }}
                >
                  Standard
                </button>
                <button
                  type="button"
                  onClick={() => setPriority('urgent')}
                  style={{
                    padding: '3px 10px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    border: 'none',
                    background: priority === 'urgent' ? '#DC2626' : '#FEE2E2',
                    color: priority === 'urgent' ? '#FFFFFF' : '#991B1B',
                    cursor: 'pointer',
                    fontWeight: priority === 'urgent' ? 800 : 500,
                  }}
                >
                  ⚡ Urgent Mandate
                </button>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div
            className="modal-footer"
            style={{
              padding: '12px 20px',
              background: '#F8FAFC',
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              className="btn-outline"
              onClick={onClose}
              style={{ fontSize: '12px', padding: '8px 14px' }}
            >
              {t('Cancel', 'বাতিল', lang)}
            </button>
            <button
              type="submit"
              className="btn-primary"
              style={{
                fontSize: '12px',
                padding: '8px 20px',
                background: 'linear-gradient(135deg, #B45309 0%, #78350F 100%)',
                borderColor: '#B45309',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 800,
                color: '#FFFFFF',
                boxShadow: '0 2px 8px rgba(180, 83, 9, 0.35)',
              }}
            >
              <Radio size={15} />
              {t('Broadcast Voice Briefing', 'ভয়েস ব্রিফিং সম্প্রচার করুন', lang)}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
