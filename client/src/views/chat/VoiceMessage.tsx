import React, { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { t, type Lang } from '../../types';
import { formatClock, parseDurationSeconds } from './helpers';

const BARS = [40, 75, 25, 90, 60, 30, 85, 95, 45, 65, 80, 50, 70, 90, 35, 60, 85, 40, 55, 75, 30, 65, 90, 45];
const SPEEDS = [1, 1.5, 2] as const;
const TICK_MS = 200;

interface VoiceMessageProps {
  durationLabel?: string;
  playing: boolean;
  onPlayingChange: (playing: boolean) => void;
  lang: Lang;
}

/** Voice note with a seekable waveform, running clock and playback speed. Playback is simulated (no audio assets). */
export default function VoiceMessage({ durationLabel, playing, onPlayingChange, lang }: VoiceMessageProps) {
  const total = Math.max(1, parseDurationSeconds(durationLabel));
  const [elapsed, setElapsed] = useState(0);
  const [speedIdx, setSpeedIdx] = useState(0);
  const speed = SPEEDS[speedIdx];
  const onChangeRef = useRef(onPlayingChange);
  useEffect(() => {
    onChangeRef.current = onPlayingChange;
  }, [onPlayingChange]);

  useEffect(() => {
    if (!playing) return undefined;
    const id = window.setInterval(() => {
      setElapsed((prev) => {
        const next = prev + (TICK_MS / 1000) * speed;
        if (next >= total) {
          window.setTimeout(() => onChangeRef.current(false), 0);
          return 0;
        }
        return next;
      });
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [playing, speed, total]);

  const progress = elapsed / total;

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width === 0) return;
    setElapsed(Math.min(total, Math.max(0, ((e.clientX - rect.left) / rect.width) * total)));
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight') setElapsed((v) => Math.min(total, v + 5));
    if (e.key === 'ArrowLeft') setElapsed((v) => Math.max(0, v - 5));
  };

  return (
    <div className="ic-voice-card">
      <button
        type="button"
        className="ic-voice-play-btn"
        onClick={() => onPlayingChange(!playing)}
        aria-label={playing ? t('Pause voice message', 'ভয়েস বার্তা থামান', lang) : t('Play voice message', 'ভয়েস বার্তা শুনুন', lang)}
      >
        {playing ? <Pause size={15} /> : <Play size={15} />}
      </button>
      <div className="ic-voice-waveform-wrap">
        <div
          className="ic-waveform-bars"
          role="slider"
          tabIndex={0}
          aria-label={t('Seek voice message', 'ভয়েস বার্তায় এগিয়ে যান', lang)}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={Math.round(elapsed)}
          onClick={seek}
          onKeyDown={onKeyDown}
        >
          {BARS.map((h, idx) => (
            <span
              key={idx}
              className={idx / BARS.length < progress ? 'played' : ''}
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
        <div className="ic-voice-timing">
          <span>{formatClock(elapsed)}</span>
          <span>{formatClock(total)}</span>
        </div>
      </div>
      <button
        type="button"
        className="ic-voice-speed-pill"
        onClick={() => setSpeedIdx((i) => (i + 1) % SPEEDS.length)}
        aria-label={t('Playback speed', 'প্লেব্যাক গতি', lang)}
      >
        {speed}x
      </button>
    </div>
  );
}
