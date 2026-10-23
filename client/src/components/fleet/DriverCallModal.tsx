import React, { useState, useEffect } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, Grid, Shield, Sparkles } from 'lucide-react';
import { t } from '../../types';
import { showToast } from '../../App';

interface DriverCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  calleeName: string;
  calleeRole: string;
  calleePhone: string;
  lang: 'en' | 'bn';
}

export default function DriverCallModal({
  isOpen,
  onClose,
  calleeName,
  calleeRole,
  calleePhone,
  lang,
}: DriverCallModalProps) {
  const [callState, setCallState] = useState<'connecting' | 'ringing' | 'connected' | 'ended'>('connecting');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);
  const [showKeypad, setShowKeypad] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCallState('connecting');
      setCallDuration(0);
      setIsMuted(false);
      setShowKeypad(false);
      return;
    }

    // Step 1: Connecting -> Ringing after 1.5s
    const ringTimer = setTimeout(() => {
      setCallState('ringing');
    }, 1400);

    // Step 2: Ringing -> Connected after 3.8s
    const connectTimer = setTimeout(() => {
      setCallState('connected');
    }, 3800);

    return () => {
      clearTimeout(ringTimer);
      clearTimeout(connectTimer);
    };
  }, [isOpen]);

  // Duration Timer when connected
  useEffect(() => {
    let interval: any = null;
    if (callState === 'connected') {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callState]);

  if (!isOpen) return null;

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    setCallState('ended');
    const durStr = formatTimer(callDuration);
    showToast(
      lang === 'en'
        ? `Call disconnected with ${calleeName} (${durStr})`
        : `${calleeName}-এর সাথে কল সমাপ্ত হয়েছে (${durStr})`,
      'info'
    );
    setTimeout(() => {
      onClose();
    }, 500);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={handleEndCall}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '380px',
          background: 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)',
          borderRadius: '28px',
          padding: '32px 24px',
          color: '#fff',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Network & Security Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(255, 255, 255, 0.08)',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '10.5px',
            color: '#94A3B8',
            marginBottom: '24px',
          }}
        >
          <Shield size={12} color="#10B981" />
          <span>BOGCL Fleet Net • VoIP 256-bit Encrypted</span>
        </div>

        {/* Animated Avatar / Ringing Halo */}
        <div
          style={{
            position: 'relative',
            width: '96px',
            height: '96px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #1D4ED8 0%, #7C3AED 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            fontWeight: 800,
            marginBottom: '18px',
            boxShadow:
              callState === 'ringing'
                ? '0 0 0 10px rgba(59, 130, 246, 0.25), 0 0 0 20px rgba(59, 130, 246, 0.1)'
                : callState === 'connected'
                ? '0 0 0 6px rgba(16, 185, 129, 0.3)'
                : 'none',
            transition: 'all 0.5s ease',
          }}
        >
          {calleeName
            .split(' ')
            .filter((n) => !['Md.', 'Sheikh', 'Engr.'].includes(n))
            .slice(0, 2)
            .map((n) => n[0])
            .join('') || 'DR'}
        </div>

        {/* Callee Info */}
        <h3 style={{ margin: '0 0 4px 0', fontSize: '19px', fontWeight: 800, textAlign: 'center' }}>
          {calleeName}
        </h3>
        <p style={{ margin: '0 0 6px 0', fontSize: '11.5px', color: '#94A3B8', textAlign: 'center', lineHeight: '1.4' }}>
          {calleeRole}
        </p>
        <div style={{ fontSize: '12px', fontFamily: 'monospace', color: '#38BDF8', marginBottom: '18px' }}>
          {calleePhone}
        </div>

        {/* Call Status Badge */}
        <div
          style={{
            padding: '6px 16px',
            borderRadius: '16px',
            fontSize: '12px',
            fontWeight: 700,
            marginBottom: '28px',
            background:
              callState === 'connected'
                ? 'rgba(16, 185, 129, 0.15)'
                : callState === 'ringing'
                ? 'rgba(234, 179, 8, 0.15)'
                : 'rgba(59, 130, 246, 0.15)',
            color:
              callState === 'connected'
                ? '#34D399'
                : callState === 'ringing'
                ? '#FDE047'
                : '#60A5FA',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {callState === 'connecting' && <span>Connecting...</span>}
          {callState === 'ringing' && <span>Ringing (+880)...</span>}
          {callState === 'connected' && (
            <>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#10B981',
                  animation: 'pulse 1.5s infinite',
                }}
              />
              <span>Connected • {formatTimer(callDuration)}</span>
            </>
          )}
          {callState === 'ended' && <span>Call Disconnected</span>}
        </div>

        {/* In-Call Live Audio Waves & Speech Caption */}
        {callState === 'connected' && (
          <div
            style={{
              width: '100%',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '14px',
              padding: '12px',
              marginBottom: '24px',
              fontSize: '12px',
              color: '#CBD5E1',
              textAlign: 'center',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
              {[12, 24, 18, 30, 15, 28, 20, 14, 25, 18].map((h, i) => (
                <div
                  key={i}
                  style={{
                    width: '3px',
                    height: `${h}px`,
                    background: '#10B981',
                    borderRadius: '2px',
                    animation: `pulse ${0.6 + (i % 4) * 0.2}s infinite alternate`,
                  }}
                />
              ))}
            </div>
            <div style={{ fontStyle: 'italic', color: '#E2E8F0', fontSize: '11.5px' }}>
              &ldquo;Assalamu Alaikum Sir! I am at Gate-1 porch with the car running. How may I assist you?&rdquo;
            </div>
          </div>
        )}

        {/* Call Action Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
            width: '100%',
            marginBottom: '28px',
          }}
        >
          {/* Mute Button */}
          <button
            onClick={() => setIsMuted((prev) => !prev)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              background: isMuted ? '#EF4444' : 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '16px',
              padding: '12px 8px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '11px',
              transition: 'all 0.2s',
            }}
          >
            {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
            <span>{isMuted ? 'Unmute' : 'Mute'}</span>
          </button>

          {/* Keypad */}
          <button
            onClick={() => setShowKeypad((prev) => !prev)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              background: showKeypad ? '#3B82F6' : 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '16px',
              padding: '12px 8px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '11px',
              transition: 'all 0.2s',
            }}
          >
            <Grid size={20} />
            <span>Keypad</span>
          </button>

          {/* Speaker */}
          <button
            onClick={() => setIsSpeaker((prev) => !prev)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              background: isSpeaker ? '#10B981' : 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '16px',
              padding: '12px 8px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '11px',
              transition: 'all 0.2s',
            }}
          >
            {isSpeaker ? <Volume2 size={20} /> : <VolumeX size={20} />}
            <span>Speaker</span>
          </button>
        </div>

        {/* End Call Button */}
        <button
          onClick={handleEndCall}
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
            border: 'none',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(239, 68, 68, 0.4)',
            transition: 'transform 0.15s ease',
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.92)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          title="Disconnect Call"
        >
          <PhoneOff size={28} />
        </button>
      </div>
    </div>
  );
}
