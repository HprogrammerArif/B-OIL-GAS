import React, { useState, useRef, useEffect } from 'react';
import { ViewProps, t } from '../types';
import { showToast } from '../App';
import {
  Send, Paperclip, Mic, Flag, Pin, Search, Phone, Video,
  CheckCheck, Check, Clock, Shield, ChevronRight, MessageSquare,
  Users, Star, MoreVertical, Image, FileText, X, Hash,
  Lock, Eye, Play, Pause, Volume2, CornerDownRight, Smile,
  Sliders, ThumbsUp, AlertCircle, Sparkles, Download, PhoneOff,
  MicOff, VideoOff, Maximize2, ShieldCheck, Zap, Crown, CheckCircle
} from 'lucide-react';

interface ChatMember {
  id: string;
  name: string;
  role: string;
  initials: string;
  color: string;
  status: 'online' | 'away' | 'in-meeting' | 'offline';
  statusLabel: string;
  location: string;
  phone: string;
  lastSeen?: string;
  unread?: number;
}

interface ChatChannel {
  id: string;
  name: string;
  description: string;
  membersCount: number;
  unread?: number;
  isLocked?: boolean;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole?: string;
  senderInitials: string;
  senderColor: string;
  content: string;
  timestamp: string;
  type: 'text' | 'voice' | 'document' | 'directive';
  isUrgent?: boolean;
  isPinned?: boolean;
  isChairman?: boolean;
  readBy: string[];
  directiveId?: string;
  directiveAcknowledged?: boolean;
  fileName?: string;
  fileSize?: string;
  voiceDuration?: string;
  reactions?: Record<string, number>;
  repliesCount?: number;
}

const CHANNELS: ChatChannel[] = [
  { id: 'ch_executive', name: 'executive-command', description: 'C-Suite, Chairman & Board Strategic Directives', membersCount: 7, unread: 3 },
  { id: 'ch_refinery', name: 'refinery-ops-confidential', description: 'Keraniganj Unit 1 & 2 DCS Telemetry & Production', membersCount: 5 },
  { id: 'ch_capex', name: 'capex-finance-treasury', description: 'L/C Authorizations, Banking & Large PO Sign-offs', membersCount: 4 },
  { id: 'ch_statutory', name: 'regulatory-statutory-risk', description: 'BSTI, Explosives Directorate & Legal Audit Compliance', membersCount: 4, isLocked: true },
];

const INNER_CIRCLE_MEMBERS: ChatMember[] = [
  { id: 'hr', name: 'Engr. M. Harunur Rashid', role: 'Plant GM, Keraniganj', initials: 'HR', color: '#0369A1', status: 'online', statusLabel: 'Control Room Unit-1', location: 'Keraniganj Plant', phone: '+880 1711-002101', unread: 2 },
  { id: 'fb', name: 'Farida Begum', role: 'CFO & Finance Director', initials: 'FB', color: '#7C3AED', status: 'in-meeting', statusLabel: 'Boardroom A (Q4 Review)', location: 'Dhaka HQ, Level 9', phone: '+880 1711-002102' },
  { id: 'km', name: 'Adv. Karim Molla', role: 'Head of Legal & Compliance', initials: 'KM', color: '#059669', status: 'away', statusLabel: 'At BSTI Tejgaon Directorate', location: 'Tejgaon, Dhaka', phone: '+880 1711-002103', unread: 1 },
  { id: 'si', name: 'Md. Shafiqul Islam', role: 'Director, Sales & Dist.', initials: 'SI', color: '#D97706', status: 'online', statusLabel: 'Available at HQ', location: 'Level-8 Commercial', phone: '+880 1711-002104' },
  { id: 'ta', name: 'Engr. Tariq Ahmed', role: 'Plant Engineer, Unit-2', initials: 'TA', color: '#A51C30', status: 'offline', statusLabel: 'On Approved Medical Leave', location: 'Dhanmondi, Dhaka', phone: '+880 1711-002105', lastSeen: '10:15 AM' },
  { id: 'nj', name: 'Nusrat Jahan', role: 'GM, Human Resources', initials: 'NJ', color: '#0891B2', status: 'online', statusLabel: 'Available at HR Suite', location: 'Level-6 HR Wing', phone: '+880 1711-002106' },
];

const INITIAL_MESSAGES: Record<string, ChatMessage[]> = {
  ch_executive: [
    {
      id: 'm1',
      senderId: 'hr',
      senderName: 'Engr. M. Harunur Rashid',
      senderRole: 'Plant GM, Keraniganj',
      senderInitials: 'HR',
      senderColor: '#0369A1',
      content: 'Honourable Chairman Sir, Keraniganj Unit-2 catalytic cracking reached 5,000 MT/day today. Efficiency is 12% above projected baseline. Daily DCS telemetry summary is attached below for your perusal.',
      timestamp: '09:14 AM',
      type: 'text',
      readBy: ['fb', 'km', 'si', 'nj', 'chairman'],
      reactions: { '👍': 4, '👏': 2 },
      repliesCount: 3,
    },
    {
      id: 'm2',
      senderId: 'hr',
      senderName: 'Engr. M. Harunur Rashid',
      senderRole: 'Plant GM, Keraniganj',
      senderInitials: 'HR',
      senderColor: '#0369A1',
      content: 'Refinery_Output_Keraniganj_Oct2026.pdf',
      timestamp: '09:15 AM',
      type: 'document',
      fileName: 'Refinery_Output_Keraniganj_Oct2026.pdf',
      fileSize: '3.4 MB',
      readBy: ['fb', 'km', 'si', 'nj', 'chairman'],
      reactions: { '📥': 3 },
    },
    {
      id: 'm3',
      senderId: 'chairman',
      senderName: 'Ahmed Akbar Sobhan (You)',
      senderRole: 'Chairman & Managing Director',
      senderInitials: 'AAS',
      senderColor: '#A51C30',
      content: 'COMMENCE PREVENTIVE MAINTENANCE ON COLUMN C-102 IMMEDIATELY. SAFETY VALVES PROCUREMENT (৳48.5L) AUTHORIZED UNDER FAST-TRACK. CFO EXPEDITE L/C DISBURSEMENT WITHIN 48 HOURS.',
      timestamp: '09:22 AM',
      type: 'directive',
      directiveId: 'BOGCL-DIR-2026-0922',
      directiveAcknowledged: true,
      isChairman: true,
      isUrgent: true,
      isPinned: true,
      readBy: ['hr', 'fb', 'km', 'si', 'nj'],
      reactions: { '🫡': 5, '⚡': 3 },
    },
    {
      id: 'm4',
      senderId: 'fb',
      senderName: 'Farida Begum',
      senderRole: 'CFO & Finance Director',
      senderInitials: 'FB',
      senderColor: '#7C3AED',
      content: 'Understood Chairman Sir. L/C instructions have been formally transmitted to Bashundhara Corporate Bank branch under GL 4102-KER. Bank assurance confirmed for 2:00 PM today.',
      timestamp: '09:28 AM',
      type: 'text',
      readBy: ['hr', 'km', 'si', 'nj', 'chairman'],
      reactions: { '✅': 4 },
    },
    {
      id: 'm5',
      senderId: 'nj',
      senderName: 'Nusrat Jahan',
      senderRole: 'GM, Human Resources',
      senderInitials: 'NJ',
      senderColor: '#0891B2',
      content: 'Staff Shift Welfare & Night Duty Roster Update',
      timestamp: '11:15 AM',
      type: 'voice',
      voiceDuration: '0:42',
      readBy: ['hr', 'fb', 'km', 'si', 'chairman'],
      reactions: { '👂': 3 },
    },
  ],
  ch_refinery: [
    {
      id: 'rf1',
      senderId: 'hr',
      senderName: 'Engr. M. Harunur Rashid',
      senderRole: 'Plant GM',
      senderInitials: 'HR',
      senderColor: '#0369A1',
      content: 'SCADA alarm C-102 reboiler skin temperature peaked at 382°C at 04:00 AM. Nitrogen purge was activated. Temperature stabilized to 365°C.',
      timestamp: '07:45 AM',
      type: 'text',
      isUrgent: true,
      readBy: ['chairman'],
    },
  ],
  hr: [
    {
      id: 'dm_hr1',
      senderId: 'hr',
      senderName: 'Engr. M. Harunur Rashid',
      senderRole: 'Plant GM',
      senderInitials: 'HR',
      senderColor: '#0369A1',
      content: 'Sir, strictly confidential: DoE regulatory inspector Dr. Shahabuddin is conducting surprise site walk today. We are demonstrating compliance on the water effluent treatment plant (ETP).',
      timestamp: '08:30 AM',
      type: 'text',
      readBy: ['chairman'],
    },
    {
      id: 'dm_hr2',
      senderId: 'chairman',
      senderName: 'Ahmed Akbar Sobhan (You)',
      senderRole: 'Chairman & MD',
      senderInitials: 'AAS',
      senderColor: '#A51C30',
      content: 'Received Harun. Ensure full cooperation, provide all laboratory sample logs, and accord him highest official hospitality. Keep me updated hourly.',
      timestamp: '08:42 AM',
      type: 'text',
      isChairman: true,
      readBy: ['hr'],
    },
  ],
};

export default function InnerCircleChat({ role, lang }: ViewProps) {
  const [activeTarget, setActiveTarget] = useState<{ type: 'channel' | 'dm'; id: string }>({ type: 'channel', id: 'ch_executive' });
  const [allMessages, setAllMessages] = useState<Record<string, ChatMessage[]>>(INITIAL_MESSAGES);
  const [messageInput, setMessageInput] = useState('');
  const [isDirectiveMode, setIsDirectiveMode] = useState(false);
  const [isUrgentFlag, setIsUrgentFlag] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [activeTabFilter, setActiveTabFilter] = useState<'all' | 'channels' | 'direct' | 'pinned'>('all');
  const [showRightDrawer, setShowRightDrawer] = useState(true);
  const [showSecurityBanner, setShowSecurityBanner] = useState(false);
  const [showQuickDirectives, setShowQuickDirectives] = useState(false);
  const [showCallModal, setShowCallModal] = useState<'voice' | 'video' | null>(null);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [voiceProgress, setVoiceProgress] = useState(14);
  const [voiceSpeed, setVoiceSpeed] = useState<number>(1);

  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll messages strictly inside the messages panel (does not jump the window!)
  const scrollToBottom = () => {
    if (messagesScrollRef.current) {
      messagesScrollRef.current.scrollTop = messagesScrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [allMessages, activeTarget]);

  // Voice recording timer simulation
  useEffect(() => {
    let interval: any;
    if (isRecordingVoice) {
      interval = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecordingVoice]);

  const activeMessages = allMessages[activeTarget.id] || [];

  const activeChannel = activeTarget.type === 'channel'
    ? CHANNELS.find((c) => c.id === activeTarget.id)
    : null;

  const activeMember = activeTarget.type === 'dm'
    ? INNER_CIRCLE_MEMBERS.find((m) => m.id === activeTarget.id)
    : null;

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: 'chairman',
      senderName: 'Ahmed Akbar Sobhan (You)',
      senderRole: 'Chairman & Managing Director',
      senderInitials: 'AAS',
      senderColor: '#A51C30',
      content: messageInput.trim(),
      timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      type: isDirectiveMode ? 'directive' : 'text',
      directiveId: isDirectiveMode ? `BOGCL-DIR-2026-${Math.floor(1000 + Math.random() * 9000)}` : undefined,
      directiveAcknowledged: false,
      isChairman: true,
      isUrgent: isUrgentFlag || isDirectiveMode,
      readBy: [],
      reactions: {},
    };

    setAllMessages((prev) => ({
      ...prev,
      [activeTarget.id]: [...(prev[activeTarget.id] || []), newMsg],
    }));

    setMessageInput('');
    setIsDirectiveMode(false);
    setIsUrgentFlag(false);

    showToast(
      isDirectiveMode
        ? '👑 Executive Directive dispatched with cryptographic seal. Leadership notified.'
        : '✓ Message securely delivered to Inner Circle Enclave.',
      isDirectiveMode ? 'success' : 'info'
    );
  };

  const handleSendVoiceMemo = () => {
    const newMsg: ChatMessage = {
      id: `voice-${Date.now()}`,
      senderId: 'chairman',
      senderName: 'Ahmed Akbar Sobhan (You)',
      senderRole: 'Chairman & Managing Director',
      senderInitials: 'AAS',
      senderColor: '#A51C30',
      content: 'Chairman Voice Directive Memo',
      timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      type: 'voice',
      voiceDuration: `0:${recordingSeconds < 10 ? '0' : ''}${recordingSeconds || 24}`,
      isChairman: true,
      readBy: [],
      reactions: {},
    };

    setAllMessages((prev) => ({
      ...prev,
      [activeTarget.id]: [...(prev[activeTarget.id] || []), newMsg],
    }));

    setIsRecordingVoice(false);
    showToast('🎙️ Audio memo encrypted and dispatched.', 'success');
  };

  const handleAcknowledgeDirective = (msgId: string) => {
    setAllMessages((prev) => ({
      ...prev,
      [activeTarget.id]: (prev[activeTarget.id] || []).map((m) =>
        m.id === msgId ? { ...m, directiveAcknowledged: true } : m
      ),
    }));
    showToast('✓ Directive formally acknowledged & recorded in SAP Governance log.', 'success');
  };

  const handleAddReaction = (msgId: string, emoji: string) => {
    setAllMessages((prev) => ({
      ...prev,
      [activeTarget.id]: (prev[activeTarget.id] || []).map((m) => {
        if (m.id === msgId) {
          const current = m.reactions || {};
          return {
            ...m,
            reactions: {
              ...current,
              [emoji]: (current[emoji] || 0) + 1,
            },
          };
        }
        return m;
      }),
    }));
  };

  const handleQuickDirective = (text: string) => {
    setMessageInput(text);
    setIsDirectiveMode(true);
    inputRef.current?.focus();
  };

  const getStatusColor = (status: ChatMember['status']) => {
    switch (status) {
      case 'online': return '#10B981';
      case 'away': return '#F59E0B';
      case 'in-meeting': return '#8B5CF6';
      case 'offline': return '#94A3B8';
    }
  };

  return (
    <div className={`inner-circle-workspace ${!showRightDrawer ? 'drawer-closed' : ''}`}>
      {/* ──────────────────────────────────────────────────────────────────────
          LEFT COLUMN: Inner Circle Hub (Channels & Direct Messages)
          ────────────────────────────────────────────────────────────────────── */}
      <aside className="ic-hub-sidebar">
        {/* Hub Header */}
        <div className="ic-hub-header">
          <div className="ic-hub-title-row">
            <div className="ic-hub-badge">
              <Lock size={13} className="ic-lock-icon" />
              <span>SOVEREIGN ENCLAVE</span>
            </div>
            <span className="ic-cipher-tag">AES-256</span>
          </div>
          <h3 className="ic-hub-heading">{t("Chairman's Inner Circle", 'চেয়ারম্যানের ইনার সার্কেল', lang)}</h3>
          <div className="ic-hub-subtext">
            <ShieldCheck size={12} color="#10B981" />
            <span>Bashundhara Corporate Security Node #01</span>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="ic-hub-tabs">
          <button
            className={`ic-tab-btn ${activeTabFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTabFilter('all')}
          >
            {t('All', 'সব', lang)}
          </button>
          <button
            className={`ic-tab-btn ${activeTabFilter === 'channels' ? 'active' : ''}`}
            onClick={() => setActiveTabFilter('channels')}
          >
            # {t('Channels', 'চ্যানেল', lang)}
          </button>
          <button
            className={`ic-tab-btn ${activeTabFilter === 'direct' ? 'active' : ''}`}
            onClick={() => setActiveTabFilter('direct')}
          >
            👤 {t('Direct', 'সরাসরি', lang)}
          </button>
        </div>

        {/* Search Input */}
        <div className="ic-hub-search">
          <Search size={14} className="ic-search-icon" />
          <input
            type="text"
            placeholder={t('Search messages, files, orders...', 'বার্তা, নথি বা অর্ডার খুঁজুন...', lang)}
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
          />
        </div>

        {/* Channel & Contact List */}
        <div className="ic-hub-list">
          {/* Section: Executive Channels */}
          {(activeTabFilter === 'all' || activeTabFilter === 'channels') && (
            <div className="ic-section-group">
              <div className="ic-section-title">
                <span>{t('WAR ROOM CHANNELS', 'কমান্ড চ্যানেলসমূহ', lang)}</span>
                <span className="ic-section-count">{CHANNELS.length}</span>
              </div>
              {CHANNELS.map((ch) => (
                <div
                  key={ch.id}
                  className={`ic-list-item channel-item ${activeTarget.type === 'channel' && activeTarget.id === ch.id ? 'active' : ''}`}
                  onClick={() => setActiveTarget({ type: 'channel', id: ch.id })}
                >
                  <div className="ic-item-prefix">
                    {ch.isLocked ? <Lock size={14} /> : <Hash size={14} />}
                  </div>
                  <div className="ic-item-body">
                    <div className="ic-item-title">{ch.name}</div>
                    <div className="ic-item-snippet">{ch.description}</div>
                  </div>
                  {ch.unread && <span className="ic-unread-pill">{ch.unread}</span>}
                </div>
              ))}
            </div>
          )}

          {/* Section: Direct Executive Lines */}
          {(activeTabFilter === 'all' || activeTabFilter === 'direct') && (
            <div className="ic-section-group">
              <div className="ic-section-title">
                <span>{t('EXECUTIVE HOTLINES (1-ON-1)', 'শীর্ষ নেতৃত্ব হটলাইন', lang)}</span>
                <span className="ic-section-count">{INNER_CIRCLE_MEMBERS.length}</span>
              </div>
              {INNER_CIRCLE_MEMBERS.map((member) => (
                <div
                  key={member.id}
                  className={`ic-list-item contact-item ${activeTarget.type === 'dm' && activeTarget.id === member.id ? 'active' : ''}`}
                  onClick={() => setActiveTarget({ type: 'dm', id: member.id })}
                >
                  <div className="ic-avatar-wrap">
                    <div className="ic-avatar" style={{ background: member.color }}>
                      {member.initials}
                    </div>
                    <span
                      className="ic-status-indicator"
                      style={{ background: getStatusColor(member.status) }}
                      title={`${member.statusLabel}`}
                    />
                  </div>
                  <div className="ic-item-body">
                    <div className="ic-item-top">
                      <span className="ic-item-title">{member.name}</span>
                    </div>
                    <div className="ic-item-role">{member.role}</div>
                    <div className="ic-item-status-note">📍 {member.statusLabel}</div>
                  </div>
                  {member.unread && <span className="ic-unread-pill danger">{member.unread}</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Hardware Token & Security Status */}
        <div className="ic-hub-footer">
          <div className="ic-token-card">
            <div className="ic-token-dot" />
            <div className="ic-token-info">
              <div className="ic-token-title">CHAIRMAN HW-TOKEN #001</div>
              <div className="ic-token-desc">Mutual TLS · Keraniganj SCADA Synced</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ──────────────────────────────────────────────────────────────────────
          MIDDLE COLUMN: Real-Time Chat Stream & Executive Composer
          ────────────────────────────────────────────────────────────────────── */}
      <main className="ic-chat-main">
        {/* Chat Room Top Bar - Sleek, Compact Enterprise Header */}
        <header className="ic-chat-topbar">
          <div className="ic-topbar-left">
            <div className="ic-room-avatar-badge">
              {activeTarget.type === 'channel' ? (
                <div className="ic-room-icon-box">
                  <Hash size={16} />
                </div>
              ) : (
                <div className="ic-room-avatar" style={{ background: activeMember?.color }}>
                  {activeMember?.initials}
                  <span className="ic-avatar-dot" style={{ background: getStatusColor(activeMember?.status || 'online') }} />
                </div>
              )}
            </div>
            <div className="ic-room-meta">
              <div className="ic-room-title-line">
                <h2 className="ic-room-title">
                  {activeTarget.type === 'channel' ? `#${activeChannel?.name}` : activeMember?.name}
                </h2>
                <span className="ic-security-pill" title="Mutual TLS & AES-256 Enclave">
                  <Lock size={9} /> {t('AES-256', 'এনক্রিপ্টেড', lang)}
                </span>
                {activeTarget.type === 'channel' && (
                  <span className="ic-members-pill">
                    <Users size={10} /> {activeChannel?.membersCount}
                  </span>
                )}
              </div>
              <p className="ic-room-desc" title={activeTarget.type === 'channel' ? activeChannel?.description : `${activeMember?.role} · ${activeMember?.location}`}>
                {activeTarget.type === 'channel'
                  ? activeChannel?.description
                  : `${activeMember?.role} · 📍 ${activeMember?.location}`}
              </p>
            </div>
          </div>

          <div className="ic-topbar-actions">
            <button
              className={`ic-topbar-tool-btn ${showQuickDirectives ? 'active' : ''}`}
              onClick={() => setShowQuickDirectives(!showQuickDirectives)}
              title={t('Toggle Directive Presets', 'দ্রুত নির্দেশাবলি টগল করুন', lang)}
            >
              <Zap size={13} color={showQuickDirectives ? '#D4AF37' : '#94A3B8'} />
              <span>{t('Directives', 'নির্দেশাবলি', lang)}</span>
            </button>
            <button
              className="ic-btn-call"
              onClick={() => setShowCallModal('voice')}
              title={t('Start Encrypted Voice Call', 'ভয়েস কল শুরু করুন', lang)}
            >
              <Phone size={13} />
              <span>{t('Voice Call', 'ভয়েস কল', lang)}</span>
            </button>
            <button
              className="ic-btn-video"
              onClick={() => setShowCallModal('video')}
              title={t('Convene Secure Video Conference', 'ভিডিও মিটিং শুরু করুন', lang)}
            >
              <Video size={13} />
              <span>{t('Tele-Conf', 'ভিডিও মিটিং', lang)}</span>
            </button>
            <button
              className={`ic-btn-panel-toggle ${showRightDrawer ? 'active' : ''}`}
              onClick={() => setShowRightDrawer(!showRightDrawer)}
              title={t('Toggle Executive Vault & Details', 'ভল্ট ও বিবরণ প্যানেল', lang)}
            >
              <Pin size={14} />
            </button>
          </div>
        </header>

        {/* Message Stream */}
        <div className="ic-messages-container" ref={messagesScrollRef}>
          {showSecurityBanner && (
            <div className="ic-security-banner">
              <div className="ic-sec-left">
                <ShieldCheck size={14} color="#D4AF37" />
                <span>
                  <strong>{t('Sovereign Enclave Active', 'সার্বভৌম এনক্রিপশন সক্রিয়', lang)}:</strong>{' '}
                  {t('Signed with Chairman AAS token. Logged in SAP compliance audit trails.', 'চেয়ারম্যান ডিজিটাল কি দিয়ে স্বাক্ষরিত ও স্যাপ অডিটে সংরক্ষিত।', lang)}
                </span>
              </div>
              <button
                className="ic-sec-close"
                onClick={() => setShowSecurityBanner(false)}
                title="Dismiss"
              >
                <X size={12} />
              </button>
            </div>
          )}

          {/* Date Divider */}
          <div className="ic-date-divider">
            <span className="ic-date-chip">{t('Today, 17 October 2026', 'আজ, ১৭ অক্টোবর ২০২৬', lang)}</span>
          </div>

          {/* Message List */}
          {activeMessages.map((msg) => {
            const isMe = msg.isChairman || msg.senderId === 'chairman';

            return (
              <div
                key={msg.id}
                className={`ic-message-row ${isMe ? 'outgoing' : 'incoming'} ${msg.type === 'directive' ? 'is-directive' : ''}`}
              >
                {!isMe && (
                  <div className="ic-msg-avatar" style={{ background: msg.senderColor }}>
                    {msg.senderInitials}
                  </div>
                )}

                <div className="ic-msg-content-block">
                  {/* Sender Header */}
                  <div className="ic-msg-meta-header">
                    <span className="ic-msg-sender">{msg.senderName}</span>
                    {msg.senderRole && <span className="ic-msg-role-tag">{msg.senderRole}</span>}
                    <span className="ic-msg-time">{msg.timestamp}</span>
                    {msg.isUrgent && <span className="ic-msg-urgent-tag">🚨 {t('PRIORITY', 'জরুরি', lang)}</span>}
                    {msg.isPinned && <span className="ic-msg-pinned-tag">📌 {t('PINNED', 'পিনকৃত', lang)}</span>}
                  </div>

                  {/* Body Content based on Type */}
                  {msg.type === 'directive' ? (
                    <div className="ic-directive-card">
                      <div className="ic-directive-header">
                        <div className="ic-directive-title">
                          <Zap size={15} color="#D4AF37" />
                          <span>CHAIRMAN EXECUTIVE DIRECTIVE</span>
                        </div>
                        <code className="ic-directive-id">{msg.directiveId}</code>
                      </div>
                      <div className="ic-directive-body">{msg.content}</div>
                      <div className="ic-directive-footer">
                        {msg.directiveAcknowledged ? (
                          <div className="ic-ack-status success">
                            <CheckCheck size={15} color="#10B981" />
                            <span>Formal Execution Certified in SAP Governance</span>
                          </div>
                        ) : (
                          <div className="ic-ack-action">
                            <button
                              className="ic-btn-ack"
                              onClick={() => handleAcknowledgeDirective(msg.id)}
                            >
                              <CheckCircle size={14} /> {t('Sign Acknowledgment & Execute', 'স্বাক্ষর ও কার্যকর করুন', lang)}
                            </button>
                            <span className="ic-ack-sla">SLA: 48h Response Window</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : msg.type === 'document' ? (
                    <div className="ic-document-card">
                      <div className="ic-doc-icon-box">
                        <FileText size={24} color="#A51C30" />
                      </div>
                      <div className="ic-doc-info">
                        <div className="ic-doc-name">{msg.fileName}</div>
                        <div className="ic-doc-sub">{msg.fileSize} · High-Security PDF · DCS Verified</div>
                      </div>
                      <div className="ic-doc-actions">
                        <button
                          className="ic-doc-btn"
                          onClick={() => showToast(t(`Viewing ${msg.fileName}...`, `${msg.fileName} দেখা হচ্ছে...`, lang), 'info')}
                          title="View In-App"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          className="ic-doc-btn"
                          onClick={() => showToast(t(`Downloading ${msg.fileName}...`, `ডাউনলোড হচ্ছে...`, lang), 'info')}
                          title="Download Document"
                        >
                          <Download size={14} />
                        </button>
                      </div>
                    </div>
                  ) : msg.type === 'voice' ? (
                    <div className="ic-voice-card">
                      <button
                        className="ic-voice-play-btn"
                        onClick={() => setPlayingVoiceId(playingVoiceId === msg.id ? null : msg.id)}
                      >
                        {playingVoiceId === msg.id ? <Pause size={15} /> : <Play size={15} />}
                      </button>
                      <div className="ic-voice-waveform-wrap">
                        <div className="ic-waveform-bars">
                          {[40, 75, 25, 90, 60, 30, 85, 95, 45, 65, 80, 50, 70, 90, 35, 60, 85, 40].map((h, idx) => (
                            <span
                              key={idx}
                              style={{
                                height: `${h}%`,
                                background: idx < 8 ? '#A51C30' : 'var(--brand-slate-300)',
                              }}
                            />
                          ))}
                        </div>
                        <div className="ic-voice-timing">
                          <span>{playingVoiceId === msg.id ? '0:18' : '0:00'}</span>
                          <span>{msg.voiceDuration}</span>
                        </div>
                      </div>
                      <button
                        className="ic-voice-speed-pill"
                        onClick={() => setVoiceSpeed((s) => (s === 1 ? 1.5 : s === 1.5 ? 2 : 1))}
                      >
                        {voiceSpeed}x
                      </button>
                    </div>
                  ) : (
                    <div className="ic-text-bubble">
                      <p>{msg.content}</p>
                    </div>
                  )}

                  {/* Message Reactions and Read Receipts */}
                  <div className="ic-msg-bottom-bar">
                    <div className="ic-reactions-group">
                      {msg.reactions &&
                        Object.entries(msg.reactions).map(([emoji, count]) => (
                          <button
                            key={emoji}
                            className="ic-reaction-chip"
                            onClick={() => handleAddReaction(msg.id, emoji)}
                          >
                            <span>{emoji}</span>
                            <span className="ic-reaction-count">{count}</span>
                          </button>
                        ))}
                      <div className="ic-reaction-picker">
                        {['👍', '⚡', '✅', '👁️', '🚨'].map((emoji) => (
                          <button
                            key={emoji}
                            className="ic-mini-react-btn"
                            onClick={() => handleAddReaction(msg.id, emoji)}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>

                    {isMe && (
                      <div className="ic-read-receipt" title="Read by all 6 members">
                        <CheckCheck size={14} color="#3B82F6" />
                        <span>{t('Delivered & Read', 'পঠিত', lang)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {isMe && (
                  <div className="ic-msg-avatar chairman-avatar">
                    AAS
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Executive Quick Directive Bar (collapsible) */}
        {showQuickDirectives && (
          <div className="ic-quick-directives">
            <div className="ic-quick-label">
              <Zap size={12} color="#D4AF37" />
              <span>{t('DIRECTIVE PRESETS:', 'দ্রুত নির্দেশাবলি:', lang)}</span>
            </div>
            <button
              className="ic-quick-chip"
              onClick={() => handleQuickDirective('COMMENCE IMMEDIATE SAFETY VALVES OVERHAUL. AUTHORIZED 48-HR WINDOW.')}
            >
              ⚡ Valve Overhaul Mandate
            </button>
            <button
              className="ic-quick-chip"
              onClick={() => handleQuickDirective('APPROVE FAST-TRACK L/C DISBURSEMENT FOR CATALYST FEED REPLACEMENT.')}
            >
              💰 Fast-Track L/C Authorization
            </button>
            <button
              className="ic-quick-chip"
              onClick={() => handleQuickDirective('CONVENE EMERGENCY REFINERY RISK REVIEW MEETING TODAY AT 4:00 PM.')}
            >
              🏛️ Emergency Board Summons
            </button>
            <button
              className="ic-quick-chip"
              onClick={() => handleQuickDirective('REQUEST REAL-TIME TELEMETRY STREAM FOR CRUDE TANK FARM LEVEL.')}
            >
              📊 Live Telemetry Requisition
            </button>
          </div>
        )}

        {/* Recording Bar if Audio Mode Active */}
        {isRecordingVoice ? (
          <div className="ic-recording-container">
            <div className="ic-recording-pulse">
              <span className="ic-rec-dot" />
              <span className="ic-rec-text">
                {t('RECORDING VOICE DIRECTIVE', 'ভয়েস নির্দেশ রেকর্ড হচ্ছে', lang)} (0:{recordingSeconds < 10 ? '0' : ''}{recordingSeconds})
              </span>
            </div>
            <div className="ic-recording-wave">
              <span /><span /><span /><span /><span /><span /><span /><span />
            </div>
            <div className="ic-recording-actions">
              <button className="btn-outline" onClick={() => setIsRecordingVoice(false)}>
                {t('Cancel', 'বাতিল', lang)}
              </button>
              <button className="btn-primary" onClick={handleSendVoiceMemo}>
                <Send size={14} /> {t('Send Encrypted Voice Memo', 'ভয়েস মেমো পাঠান', lang)}
              </button>
            </div>
          </div>
        ) : (
          /* Main Message Composer */
          <div className={`ic-composer-box ${isDirectiveMode ? 'directive-active' : ''}`}>
            {isDirectiveMode && (
              <div className="ic-directive-mode-bar">
                <div className="ic-dir-tag">
                  <Crown size={14} color="#D4AF37" />
                  <span>FORMAL CHAIRMAN EXECUTIVE DIRECTIVE (LEGALLY BINDING)</span>
                </div>
                <button className="ic-dir-close" onClick={() => setIsDirectiveMode(false)}>
                  <X size={14} />
                </button>
              </div>
            )}

            <div className="ic-composer-input-row">
              <textarea
                ref={inputRef}
                className="ic-composer-textarea"
                rows={2}
                placeholder={
                  isDirectiveMode
                    ? t('Draft legally binding Chairman Executive Order to Leadership...', 'আইনত বাধ্যতামূলক চেয়ারম্যান নির্বাহী আদেশ লিখুন...', lang)
                    : t('Type secure dispatch to Inner Circle (Enter to send, Shift+Enter for newline)...', 'ইনার সার্কেলে বার্তা লিখুন...', lang)
                }
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
            </div>

            <div className="ic-composer-bottom-bar">
              <div className="ic-composer-tools">
                <button
                  type="button"
                  className={`ic-tool-btn ${isDirectiveMode ? 'active' : ''}`}
                  onClick={() => setIsDirectiveMode(!isDirectiveMode)}
                  title="Toggle Formal Executive Order Mode"
                >
                  <Crown size={15} color={isDirectiveMode ? '#D4AF37' : 'inherit'} />
                  <span>{t('Executive Order', 'নির্বাহী আদেশ', lang)}</span>
                </button>
                <button
                  type="button"
                  className={`ic-tool-btn ${isUrgentFlag ? 'active danger' : ''}`}
                  onClick={() => setIsUrgentFlag(!isUrgentFlag)}
                  title="Flag as Urgent Red Priority"
                >
                  <Flag size={15} color={isUrgentFlag ? '#EF4444' : 'inherit'} />
                  <span>{t('Urgent', 'জরুরি', lang)}</span>
                </button>
                <button
                  type="button"
                  className="ic-tool-btn"
                  onClick={() => showToast(t('Attach PDF, telemetry data or test report', 'নথি সংযুক্ত করুন', lang), 'info')}
                  title="Attach Confidential Document"
                >
                  <Paperclip size={15} />
                </button>
                <button
                  type="button"
                  className={`ic-tool-btn ${showQuickDirectives ? 'active' : ''}`}
                  onClick={() => setShowQuickDirectives(!showQuickDirectives)}
                  title="Toggle Quick Directive Presets"
                >
                  <Zap size={14} color={showQuickDirectives ? '#D4AF37' : 'inherit'} />
                  <span>{t('Presets', 'প্রিসেট', lang)}</span>
                </button>
                <button
                  type="button"
                  className="ic-tool-btn"
                  onClick={() => setIsRecordingVoice(true)}
                  title="Record High-Quality Voice Directive"
                >
                  <Mic size={15} />
                </button>
              </div>

              <div className="ic-composer-send-group">
                <span className="ic-kbd-hint">Press ↵ Enter to Send</span>
                <button
                  className={`ic-btn-send ${isDirectiveMode ? 'gold' : ''}`}
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                >
                  <Send size={15} />
                  <span>{isDirectiveMode ? t('Dispatch Directive', 'আদেশ জারি করুন', lang) : t('Send', 'পাঠান', lang)}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ──────────────────────────────────────────────────────────────────────
          RIGHT DRAWER: Room Context, Pinned Directives & Shared Vault
          ────────────────────────────────────────────────────────────────────── */}
      {showRightDrawer && (
        <aside className="ic-vault-drawer">
          <div className="ic-drawer-header">
            <h4>{t('Intelligence & Vault', 'ইন্টেলিজেন্স ও ভল্ট', lang)}</h4>
            <button className="ic-drawer-close" onClick={() => setShowRightDrawer(false)}>
              <X size={15} />
            </button>
          </div>

          <div className="ic-drawer-content">
            {/* Active Contact Profile or Channel Roster */}
            {activeTarget.type === 'dm' && activeMember ? (
              <div className="ic-member-dossier">
                <div className="ic-dossier-avatar" style={{ background: activeMember.color }}>
                  {activeMember.initials}
                </div>
                <div className="ic-dossier-name">{activeMember.name}</div>
                <div className="ic-dossier-role">{activeMember.role}</div>
                <div className="ic-dossier-meta-card">
                  <div className="ic-dm-row">
                    <span className="lbl">Status:</span>
                    <span className="val" style={{ color: getStatusColor(activeMember.status), fontWeight: 600 }}>
                      ● {activeMember.statusLabel}
                    </span>
                  </div>
                  <div className="ic-dm-row">
                    <span className="lbl">Location:</span>
                    <span className="val">{activeMember.location}</span>
                  </div>
                  <div className="ic-dm-row">
                    <span className="lbl">Encrypted Mobile:</span>
                    <span className="val">{activeMember.phone}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="ic-channel-roster">
                <div className="ic-drawer-sec-title">
                  <span>ROOM MEMBERS ({activeChannel?.membersCount})</span>
                </div>
                <div className="ic-roster-list">
                  {INNER_CIRCLE_MEMBERS.map((m) => (
                    <div key={m.id} className="ic-roster-row">
                      <div className="ic-mini-avatar" style={{ background: m.color }}>{m.initials}</div>
                      <div className="ic-roster-info">
                        <div className="ic-roster-name">{m.name}</div>
                        <div className="ic-roster-dept">{m.role}</div>
                      </div>
                      <span className="ic-roster-dot" style={{ background: getStatusColor(m.status) }} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pinned Orders Section */}
            <div className="ic-drawer-section">
              <div className="ic-drawer-sec-title">
                <Pin size={12} color="#D4AF37" />
                <span>PINNED DIRECTIVES & ORDERS</span>
              </div>
              <div className="ic-pinned-list">
                <div className="ic-pinned-card">
                  <div className="ic-pinned-tag">⚡ DIRECTIVE #0922</div>
                  <div className="ic-pinned-text">COMMENCE PREVENTIVE MAINTENANCE ON COLUMN C-102. 48-HR L/C WINDOW.</div>
                  <div className="ic-pinned-meta">Issued by Chairman AAS · Today 09:22 AM</div>
                </div>
              </div>
            </div>

            {/* Shared Cryptographic Vault */}
            <div className="ic-drawer-section">
              <div className="ic-drawer-sec-title">
                <FileText size={12} />
                <span>SHARED ENCRYPTED VAULT</span>
              </div>
              <div className="ic-vault-list">
                <div className="ic-vault-file">
                  <div className="ic-vf-icon"><FileText size={16} color="#A51C30" /></div>
                  <div className="ic-vf-info">
                    <div className="ic-vf-name">Refinery_Output_Keraniganj_Oct2026.pdf</div>
                    <div className="ic-vf-size">3.4 MB · Plant Telemetry</div>
                  </div>
                  <Download size={14} className="ic-vf-dl" />
                </div>
                <div className="ic-vault-file">
                  <div className="ic-vf-icon"><FileText size={16} color="#059669" /></div>
                  <div className="ic-vf-info">
                    <div className="ic-vf-name">DoE_Inspection_Audit_Notice.pdf</div>
                    <div className="ic-vf-size">1.8 MB · Legal Statutory</div>
                  </div>
                  <Download size={14} className="ic-vf-dl" />
                </div>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* ──────────────────────────────────────────────────────────────────────
          SECURE VOICE / VIDEO TELE-CONFERENCE MODAL
          ────────────────────────────────────────────────────────────────────── */}
      {showCallModal && (
        <div className="ic-call-overlay">
          <div className="ic-call-modal">
            <div className="ic-call-header">
              <div className="ic-call-badge">
                <Lock size={12} />
                <span>BOGCL SECURE ENCRYPTED LINE #04</span>
              </div>
              <button className="ic-call-close" onClick={() => setShowCallModal(null)}>
                <X size={16} />
              </button>
            </div>

            <div className="ic-call-stage">
              <div className="ic-call-visualizer-ring">
                <div className="ic-call-pulse-ring" />
                <div className="ic-call-pulse-ring delay" />
                <div className="ic-call-avatar-center">
                  {activeTarget.type === 'channel' ? <Users size={42} /> : activeMember?.initials}
                </div>
              </div>

              <h3 className="ic-call-subject">
                {activeTarget.type === 'channel'
                  ? `Inner Circle Emergency Conference (${activeChannel?.name})`
                  : `Secure Direct Line: ${activeMember?.name}`}
              </h3>
              <p className="ic-call-time">00:48 · End-to-End Encrypted via Keraniganj Dedicated Microwave Loop</p>
            </div>

            <div className="ic-call-control-bar">
              <button className="ic-ctrl-btn" title="Mute Microphone"><Mic size={18} /></button>
              <button className="ic-ctrl-btn" title="Toggle Camera"><Video size={18} /></button>
              <button className="ic-ctrl-btn end-call" onClick={() => setShowCallModal(null)} title="Terminate Call">
                <PhoneOff size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
