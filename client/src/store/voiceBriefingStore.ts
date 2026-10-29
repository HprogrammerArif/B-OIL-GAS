import React from 'react';

export interface VoiceBriefingItem {
  id: string;
  senderName: string;
  senderRole: string;
  title: string;
  titleBn: string;
  durationSeconds: number;
  recordedAt: string;
  transcript: string;
  transcriptBn: string;
  targetAudiences: string[];
  priority: 'normal' | 'urgent';
  audioPresetKey?: string;
  listenedCount?: number;
}

const DEFAULT_BRIEFING: VoiceBriefingItem = {
  id: 'VB-2026-1029-01',
  senderName: 'Ahmed Akbar Sobhan',
  senderRole: 'Chairman & Managing Director',
  title: "Chairman's Morning Strategic Direction",
  titleBn: 'চেয়ারম্যান মহোদয়ের সকালের দিকনির্দেশনা',
  durationSeconds: 42,
  recordedAt: 'Today, 07:45 AM',
  transcript:
    'Keraniganj refinery team, maintain 5,000 MT peak output today. I have sanctioned the generator overhaul with 5% warranty clause. CFO Farida, ensure all Mushak-6.3 tax vouchers are verified before BEFTN release.',
  transcriptBn:
    'কেরানীগঞ্জ রিফাইনারি টিম, আজ ৫,০০০ মে.টন সর্বোচ্চ উৎপাদন বজায় রাখুন। ৫% ওয়ারেন্টি শর্তে আমি জেনারেটর মেরামত অনুমোদন করেছি। অর্থ বিভাগকে নির্দেশ দেওয়া হলো ভ্যাট ভাউচার যাচাই করে অর্থছাড় করতে।',
  targetAudiences: ['Inner Circle', 'Plant Operations', 'Corporate Finance'],
  priority: 'urgent',
  listenedCount: 18,
};

class VoiceBriefingStore {
  private activeBriefing: VoiceBriefingItem | null = DEFAULT_BRIEFING;
  private isPlaying: boolean = false;
  private listeners: Set<() => void> = new Set();

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  getActiveBriefing(): VoiceBriefingItem | null {
    return this.activeBriefing;
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  setIsPlaying(playing: boolean) {
    this.isPlaying = playing;
    this.notify();
  }

  publishBriefing(briefing: VoiceBriefingItem) {
    this.activeBriefing = briefing;
    this.isPlaying = false;
    this.notify();
  }

  clearBriefing() {
    this.activeBriefing = null;
    this.isPlaying = false;
    this.notify();
  }
}

export const voiceBriefingStore = new VoiceBriefingStore();

export function useVoiceBriefingStore() {
  const [activeBriefing, setActiveBriefing] = React.useState<VoiceBriefingItem | null>(
    voiceBriefingStore.getActiveBriefing()
  );
  const [isPlaying, setIsPlaying] = React.useState<boolean>(voiceBriefingStore.getIsPlaying());

  React.useEffect(() => {
    const unsubscribe = voiceBriefingStore.subscribe(() => {
      setActiveBriefing(voiceBriefingStore.getActiveBriefing());
      setIsPlaying(voiceBriefingStore.getIsPlaying());
    });
    return unsubscribe;
  }, []);

  return {
    activeBriefing,
    isPlaying,
    setIsPlaying: voiceBriefingStore.setIsPlaying.bind(voiceBriefingStore),
    publishBriefing: voiceBriefingStore.publishBriefing.bind(voiceBriefingStore),
    clearBriefing: voiceBriefingStore.clearBriefing.bind(voiceBriefingStore),
  };
}
