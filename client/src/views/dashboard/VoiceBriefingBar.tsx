import { Mic, Pause, Play } from 'lucide-react';
import { t, type Lang } from '../../types';
import { useVoiceBriefingStore } from '../../store/voiceBriefingStore';

/** Plays the latest voice briefing from the Chairman's office (text-to-speech). */
export default function VoiceBriefingBar({ lang }: { lang: Lang }) {
  const { activeBriefing, isPlaying, setIsPlaying } = useVoiceBriefingStore();
  if (!activeBriefing) return null;

  const toggle = () => {
    const synth = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;
    if (isPlaying) {
      setIsPlaying(false);
      synth?.cancel();
      return;
    }
    setIsPlaying(true);
    if (!synth) return;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(lang === 'bn' ? activeBriefing.transcriptBn : activeBriefing.transcript);
    utterance.rate = 1;
    utterance.pitch = 0.95;
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    synth.speak(utterance);
  };

  const label = isPlaying
    ? t('Pause voice briefing', 'ভয়েস ব্রিফিং থামান', lang)
    : t('Listen to voice briefing', 'ভয়েস ব্রিফিং শুনুন', lang);

  return (
    <section className={`dash-voice ${isPlaying ? 'is-playing' : ''}`} aria-label={t('Voice briefing', 'ভয়েস ব্রিফিং', lang)}>
      <button type="button" className="dash-voice-btn" onClick={toggle} aria-label={label} title={label}>
        {isPlaying ? <Pause size={16} /> : <Play size={16} />}
      </button>
      <div className="dash-voice-text">
        <strong><Mic size={13} aria-hidden /> {t(activeBriefing.title, activeBriefing.titleBn, lang)}</strong>
        <p>{t(activeBriefing.transcript, activeBriefing.transcriptBn, lang)}</p>
      </div>
      <small>{activeBriefing.recordedAt}</small>
    </section>
  );
}
