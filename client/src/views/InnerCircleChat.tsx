import React, { useState, useRef, useEffect, useLayoutEffect, useMemo } from 'react';
import { ViewProps, t, ROLE_META } from '../types';
import { showToast } from '../components/ToastManager';
import {
  Send, Paperclip, Mic, Flag, Pin, PinOff, Search, Phone, Video,
  CheckCheck, Check, Clock, ChevronLeft, MessageSquare, Users, FileText, X, Hash,
  Lock, Eye, Smile, Copy, Download, ShieldCheck, CheckCircle,
  ArrowDown, PanelRight, SearchX,
  FileCheck, SlidersHorizontal, Image as ImageIcon, ExternalLink,
} from 'lucide-react';
import { operationsStore, useOperationsStore, type ChatMessage, type ChatMember } from '../store/operationsStore';
import { useCurrentUser } from '../auth/session';
import { nextRef } from '../lib/refs';
import { nowTime, today } from '../lib/clock';
import { CHAIRMAN_ID, chatSelfId, dmKey } from './chat/config';
import VoiceMessage from './chat/VoiceMessage';
import CallModal from './chat/CallModal';
import {
  Highlight, formatBytes, formatClock, isAllowedAttachment,
  ATTACHMENT_ACCEPT, MAX_ATTACHMENT_BYTES,
} from './chat/helpers';

type Target = { type: 'channel' | 'dm'; id: string };
type TabFilter = 'all' | 'channels' | 'direct';
type MessageRow =
  | { kind: 'message'; msg: ChatMessage; grouped: boolean }
  | { kind: 'new-divider'; count: number };

const REACTION_CHOICES = ['👍', '✅', '⚡', '👁️', '🚨', '🙏'];
const MAX_MESSAGE_LENGTH = 5000; // BR-15 send guard: body ≤ 5,000 chars
const COUNTER_THRESHOLD = 4500;

const DIRECTIVE_PRESETS = [
  {
    id: 'valve',
    labelEn: 'Valve overhaul', labelBn: 'ভালভ ওভারহল',
    textEn: 'COMMENCE IMMEDIATE SAFETY VALVES OVERHAUL. AUTHORIZED 48-HR WINDOW.',
    textBn: 'অবিলম্বে সেফটি ভালভ ওভারহল শুরু করুন। ৪৮ ঘণ্টার সময়সীমা অনুমোদিত।',
  },
  {
    id: 'lc',
    labelEn: 'Fast-track L/C', labelBn: 'দ্রুত এলসি অনুমোদন',
    textEn: 'APPROVE FAST-TRACK L/C DISBURSEMENT FOR CATALYST FEED REPLACEMENT.',
    textBn: 'ক্যাটালিস্ট ফিড প্রতিস্থাপনের জন্য দ্রুত এলসি বিতরণ অনুমোদন করুন।',
  },
  {
    id: 'board',
    labelEn: 'Emergency review meeting', labelBn: 'জরুরি পর্যালোচনা সভা',
    textEn: 'CONVENE EMERGENCY REFINERY RISK REVIEW MEETING TODAY AT 4:00 PM.',
    textBn: 'আজ বিকেল ৪:০০টায় জরুরি রিফাইনারি ঝুঁকি পর্যালোচনা সভা আহ্বান করুন।',
  },
  {
    id: 'stock',
    labelEn: 'Stock position report', labelBn: 'মজুদ অবস্থান প্রতিবেদন',
    textEn: "SUBMIT TODAY'S TANK FARM STOCK POSITION BY 5:00 PM.",
    textBn: 'আজকের ট্যাংক ফার্মের মজুদ অবস্থান বিকেল ৫:০০টার মধ্যে জমা দিন।',
  },
] as const;

export default function InnerCircleChat({ role, lang }: ViewProps) {
  // Channels, members and message history are owned by operationsStore (shared + persisted)
  const {
    chatChannels: CHANNELS,
    chatMembers: INNER_CIRCLE_MEMBERS,
    chatMessages: allMessages,
    setChatMessages: setAllMessages,
  } = useOperationsStore();
  const user = useCurrentUser();
  const canIssueDirective = !!user?.permissions.has('chat:directive');
  const selfId = user ? chatSelfId(user, INNER_CIRCLE_MEMBERS) : '';
  const selfMeta = ROLE_META[role];

  const members = useMemo<ChatMember[]>(() => {
    const others = INNER_CIRCLE_MEMBERS.filter((m) => m.id !== selfId);
    if (selfId === CHAIRMAN_ID) return others;
    const c = ROLE_META.chairman;
    return [
      { id: CHAIRMAN_ID, name: c.name, role: c.label, initials: c.initials, color: c.avatarColor, status: 'online', statusLabel: "Chairman's Office", location: 'Head Office', phone: c.phone },
      ...others,
    ];
  }, [INNER_CIRCLE_MEMBERS, selfId]);

  const [activeTarget, setActiveTarget] = useState<Target>({ type: 'channel', id: 'ch_executive' });
  const conversationKey = activeTarget.type === 'channel' ? activeTarget.id : dmKey(selfId, activeTarget.id);

  const [messageInput, setMessageInput] = useState('');
  const [isDirectiveMode, setIsDirectiveMode] = useState(false);
  const [isUrgentFlag, setIsUrgentFlag] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [activeTabFilter, setActiveTabFilter] = useState<TabFilter>('all');
  const [showRightDrawer, setShowRightDrawer] = useState(false);
  const [showQuickDirectives, setShowQuickDirectives] = useState(false);
  const [showCallModal, setShowCallModal] = useState<'voice' | 'video' | null>(null);
  const [previewDoc, setPreviewDoc] = useState<ChatMessage | null>(null);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [reactionPickerFor, setReactionPickerFor] = useState<string | null>(null);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [jumpTo, setJumpTo] = useState<string | null>(null);
  const [newMarker, setNewMarker] = useState<{ key: string; count: number } | null>(null);

  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const stickToBottom = useRef(true);
  const drafts = useRef<Record<string, string>>({});
  const unreadSnapshot = useRef({ channels: CHANNELS, members: INNER_CIRCLE_MEMBERS });

  useEffect(() => {
    unreadSnapshot.current = { channels: CHANNELS, members: INNER_CIRCLE_MEMBERS };
  }, [CHANNELS, INNER_CIRCLE_MEMBERS]);

  const activeMessages = useMemo(() => allMessages[conversationKey] ?? [], [allMessages, conversationKey]);
  const activeChannel = activeTarget.type === 'channel' ? CHANNELS.find((c) => c.id === activeTarget.id) : null;
  const activeMember = activeTarget.type === 'dm' ? members.find((m) => m.id === activeTarget.id) : null;
  const isGroup = activeTarget.type === 'channel';
  const query = searchFilter.trim();
  const queryLower = query.toLowerCase();

  /* ── Scrolling ─────────────────────────────────────────────────────────── */
  const scrollToBottom = (behavior: ScrollBehavior = 'auto') => {
    const el = messagesScrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior });
  };

  const handleScroll = () => {
    const el = messagesScrollRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottom.current = distance < 80;
    setShowJumpToLatest(distance > 240);
  };

  // Opening a conversation: start at the latest message, clear its unread counter, remember what was new.
  useLayoutEffect(() => {
    if (!jumpTo) scrollToBottom('auto');
    stickToBottom.current = true;
  }, [conversationKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const { channels, members: roster } = unreadSnapshot.current;
    const unread = activeTarget.type === 'channel'
      ? channels.find((c) => c.id === activeTarget.id)?.unread ?? 0
      : selfId === CHAIRMAN_ID ? roster.find((m) => m.id === activeTarget.id)?.unread ?? 0 : 0;
    setNewMarker(unread > 0 ? { key: conversationKey, count: unread } : null);
    if (activeTarget.type === 'channel' || selfId === CHAIRMAN_ID) {
      operationsStore.markConversationRead(activeTarget.type, activeTarget.id);
    }
  }, [activeTarget, selfId, conversationKey]);

  // New message arrives: follow it when already at the bottom or when it is ours.
  const lastMessage = activeMessages[activeMessages.length - 1];
  useEffect(() => {
    if (stickToBottom.current || lastMessage?.senderId === selfId) scrollToBottom('smooth');
  }, [activeMessages.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Jump to a specific message (search result or pinned item) and flash it.
  useEffect(() => {
    if (!jumpTo) return;
    const el = messagesScrollRef.current?.querySelector<HTMLElement>(`[data-msg-id="${jumpTo}"]`);
    if (el) {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      setHighlightId(jumpTo);
    }
    setJumpTo(null);
  }, [jumpTo, conversationKey]);

  useEffect(() => {
    if (!highlightId) return undefined;
    const id = window.setTimeout(() => setHighlightId(null), 2200);
    return () => window.clearTimeout(id);
  }, [highlightId]);

  // Close the reaction picker on outside click
  useEffect(() => {
    if (!reactionPickerFor) return undefined;
    const onDown = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.ic-react-pop, .ic-act-react')) setReactionPickerFor(null);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [reactionPickerFor]);

  // Voice recording timer simulation
  useEffect(() => {
    if (!isRecordingVoice) {
      setRecordingSeconds(0);
      return undefined;
    }
    const interval = window.setInterval(() => setRecordingSeconds((prev) => prev + 1), 1000);
    return () => window.clearInterval(interval);
  }, [isRecordingVoice]);

  // Composer grows with its content (max ~6 lines)
  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [messageInput, isRecordingVoice]);

  /* ── Lookups ───────────────────────────────────────────────────────────── */
  const memberName = (id: string) =>
    id === selfId ? t('You', 'আপনি', lang) : members.find((m) => m.id === id)?.name ?? id;

  const statusText = (status: ChatMember['status']) => ({
    online: t('Online', 'অনলাইন', lang),
    away: t('Away', 'অনুপস্থিত', lang),
    'in-meeting': t('In a meeting', 'মিটিংয়ে', lang),
    offline: t('Offline', 'অফলাইন', lang),
  }[status]);

  const resolveTarget = (key: string): Target | null => {
    if (CHANNELS.some((c) => c.id === key)) return { type: 'channel', id: key };
    if (selfId === CHAIRMAN_ID) return members.some((m) => m.id === key) ? { type: 'dm', id: key } : null;
    if (key === selfId) return { type: 'dm', id: CHAIRMAN_ID };
    if (key.startsWith('dm:')) {
      const [, a, b] = key.split(':');
      if (a === selfId) return { type: 'dm', id: b };
      if (b === selfId) return { type: 'dm', id: a };
    }
    return null;
  };

  const previewOf = (key: string, group: boolean): { text: string; time: string } => {
    const list = allMessages[key] ?? [];
    const last = list[list.length - 1];
    if (!last) return { text: t('No messages yet', 'এখনও কোনো বার্তা নেই', lang), time: '' };
    const body =
      last.type === 'voice' ? t('Voice message', 'ভয়েস বার্তা', lang)
        : last.type === 'document' ? (last.fileName ?? t('Document', 'নথি', lang))
          : last.type === 'directive' ? `${t('Directive', 'নির্দেশনা', lang)}: ${last.content}`
            : last.content;
    const prefix = last.senderId === selfId
      ? `${t('You', 'আপনি', lang)}: `
      : group ? `${last.senderName.split(' ').find((p) => !p.endsWith('.')) ?? last.senderName}: ` : '';
    return { text: `${prefix}${body}`, time: last.timestamp };
  };

  const matches = (...fields: string[]) => !queryLower || fields.some((f) => f.toLowerCase().includes(queryLower));

  const visibleChannels = CHANNELS.filter((c) => matches(c.name, c.description));
  const visibleMembers = members.filter((m) => matches(m.name, m.role, m.statusLabel));
  const showChannelSection = activeTabFilter !== 'direct' && visibleChannels.length > 0;
  const showDirectSection = activeTabFilter !== 'channels' && visibleMembers.length > 0;

  const searchHits = useMemo(() => {
    if (queryLower.length < 2) return [];
    const hits: { msg: ChatMessage; target: Target; label: string }[] = [];
    for (const [key, list] of Object.entries(allMessages)) {
      const target = resolveTarget(key);
      if (!target) continue;
      const label = target.type === 'channel'
        ? `#${CHANNELS.find((c) => c.id === target.id)?.name ?? key}`
        : members.find((m) => m.id === target.id)?.name ?? key;
      for (const msg of list) {
        const haystack = `${msg.content} ${msg.fileName ?? ''} ${msg.directiveId ?? ''}`.toLowerCase();
        if (haystack.includes(queryLower)) hits.push({ msg, target, label });
      }
    }
    return hits.slice(0, 12);
  }, [queryLower, allMessages, CHANNELS, members, selfId]); // eslint-disable-line react-hooks/exhaustive-deps

  const channelUnread = CHANNELS.reduce((sum, c) => sum + (c.unread ?? 0), 0);
  const directUnread = selfId === CHAIRMAN_ID ? members.reduce((sum, m) => sum + (m.unread ?? 0), 0) : 0;
  const onlineCount = members.filter((m) => m.status === 'online').length + 1;

  const pinnedMessages = activeMessages.filter((m) => m.isPinned);
  const sharedFiles = activeMessages.filter((m) => m.type === 'document');

  const rows = useMemo<MessageRow[]>(() => {
    const markerIndex = newMarker && newMarker.key === conversationKey
      ? activeMessages.length - Math.min(newMarker.count, activeMessages.length)
      : -1;
    const out: MessageRow[] = [];
    activeMessages.forEach((msg, i) => {
      const prev = activeMessages[i - 1];
      if (i === markerIndex && markerIndex > 0) out.push({ kind: 'new-divider', count: activeMessages.length - i });
      const grouped = !!prev && prev.senderId === msg.senderId && prev.type !== 'directive' && msg.type !== 'directive'
        && !(i === markerIndex && markerIndex > 0);
      out.push({ kind: 'message', msg, grouped });
    });
    return out;
  }, [activeMessages, newMarker, conversationKey]);

  /* ── Actions ───────────────────────────────────────────────────────────── */
  const selectTarget = (target: Target, opts?: { jumpToMessage?: string }) => {
    const nextKey = target.type === 'channel' ? target.id : dmKey(selfId, target.id);
    if (nextKey !== conversationKey) {
      drafts.current[conversationKey] = messageInput;
      setMessageInput(drafts.current[nextKey] ?? '');
      setIsDirectiveMode(false);
      setIsUrgentFlag(false);
      setIsRecordingVoice(false);
      setPlayingVoiceId(null);
      setReactionPickerFor(null);
    }
    setActiveTarget(target);
    setMobileShowChat(true);
    if (opts?.jumpToMessage) setJumpTo(opts.jumpToMessage);
  };

  const appendMessage = (msg: ChatMessage) => {
    setAllMessages((prev) => ({
      ...prev,
      [conversationKey]: [...(prev[conversationKey] || []), msg],
    }));
  };

  const updateMessage = (msgId: string, patch: (m: ChatMessage) => ChatMessage) => {
    setAllMessages((prev) => ({
      ...prev,
      [conversationKey]: (prev[conversationKey] || []).map((m) => (m.id === msgId ? patch(m) : m)),
    }));
  };

  const handleSendMessage = () => {
    const text = messageInput.trim();
    if (!text) return;
    const asDirective = isDirectiveMode && canIssueDirective;

    appendMessage({
      id: `msg-${Date.now()}`,
      senderId: selfId,
      senderName: selfMeta.name,
      senderRole: selfMeta.label,
      senderInitials: selfMeta.initials,
      senderColor: selfMeta.avatarColor,
      content: text,
      timestamp: nowTime(),
      type: asDirective ? 'directive' : 'text',
      directiveId: asDirective ? nextRef('DIR') : undefined,
      directiveAcknowledged: false,
      isChairman: canIssueDirective,
      isUrgent: isUrgentFlag || asDirective,
      readBy: [],
      reactions: {},
    });

    setMessageInput('');
    drafts.current[conversationKey] = '';
    setIsDirectiveMode(false);
    setIsUrgentFlag(false);

    showToast(
      asDirective
        ? t('Directive issued. Recipients have been notified.', 'নির্দেশনা জারি হয়েছে। প্রাপকদের জানানো হয়েছে।', lang)
        : t('Message sent.', 'বার্তা পাঠানো হয়েছে।', lang),
      asDirective ? 'success' : 'info',
    );
  };

  const handleSendVoiceMemo = () => {
    const seconds = Math.max(1, recordingSeconds);
    appendMessage({
      id: `voice-${Date.now()}`,
      senderId: selfId,
      senderName: selfMeta.name,
      senderRole: selfMeta.label,
      senderInitials: selfMeta.initials,
      senderColor: selfMeta.avatarColor,
      content: `${selfMeta.label} Voice Memo`,
      timestamp: nowTime(),
      type: 'voice',
      voiceDuration: formatClock(seconds),
      isChairman: canIssueDirective,
      readBy: [],
      reactions: {},
    });
    setIsRecordingVoice(false);
    showToast(t('Voice memo sent.', 'ভয়েস বার্তা পাঠানো হয়েছে।', lang), 'success');
  };

  const isImageFile = (fileName?: string, mime?: string) => {
    if (mime?.startsWith('image/')) return true;
    const ext = fileName?.split('.').pop()?.toLowerCase() ?? '';
    return ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext);
  };

  const handleAttachFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!isAllowedAttachment(file.name)) {
      showToast(t('Unsupported file type. Use PDF, Word, Excel or an image.', 'অসমর্থিত ফাইল। PDF, Word, Excel বা ছবি ব্যবহার করুন।', lang), 'danger');
      return;
    }
    if (file.size > MAX_ATTACHMENT_BYTES) {
      showToast(t('File is larger than 10 MB.', 'ফাইলের আকার ১০ এমবির বেশি।', lang), 'danger');
      return;
    }

    const pushDocMessage = (fileUrl: string) => {
      appendMessage({
        id: `doc-${Date.now()}`,
        senderId: selfId,
        senderName: selfMeta.name,
        senderRole: selfMeta.label,
        senderInitials: selfMeta.initials,
        senderColor: selfMeta.avatarColor,
        content: file.name,
        timestamp: nowTime(),
        type: 'document',
        fileName: file.name,
        fileSize: formatBytes(file.size),
        fileUrl,
        fileMime: file.type || undefined,
        isChairman: canIssueDirective,
        readBy: [],
        reactions: {},
      });
      showToast(t('Document shared.', 'নথি শেয়ার করা হয়েছে।', lang), 'success');
    };

    if (file.size <= 3 * 1024 * 1024) {
      const reader = new FileReader();
      reader.onload = () => {
        pushDocMessage(typeof reader.result === 'string' ? reader.result : URL.createObjectURL(file));
      };
      reader.onerror = () => pushDocMessage(URL.createObjectURL(file));
      reader.readAsDataURL(file);
    } else {
      pushDocMessage(URL.createObjectURL(file));
    }
  };

  const handleDownloadDocument = (msg: ChatMessage) => {
    const fileName = msg.fileName || msg.content || 'BOGCL_Document.txt';
    const triggerDownload = (href: string, revokeAfter = false) => {
      const a = document.createElement('a');
      a.href = href;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      if (revokeAfter) {
        window.setTimeout(() => URL.revokeObjectURL(href), 2000);
      }
      showToast(t(`Downloaded ${fileName}`, `${fileName} ডাউনলোড সম্পন্ন হয়েছে`, lang), 'success');
    };

    if (msg.fileUrl) {
      triggerDownload(msg.fileUrl);
      return;
    }

    if (isImageFile(fileName, msg.fileMime)) {
      triggerDownload('/logoBOGCL.png');
      return;
    }

    const summaryBody = [
      'BASHUNDHARA OIL & GAS COMPANY LTD. (BOGCL)',
      'OFFICIAL LEADERSHIP DOCUMENT RECORD',
      '==================================================',
      `Document Name : ${fileName}`,
      `Shared By     : ${msg.senderName}${msg.senderRole ? ` (${msg.senderRole})` : ''}`,
      `Timestamp     : ${msg.timestamp}, ${today()}`,
      `File Size     : ${msg.fileSize || '2.4 MB'}`,
      'Verification  : Scanned & Verified by BOGCL Document Gateway',
      '==================================================',
      '',
      'EXECUTIVE SUMMARY:',
      '- Keraniganj Bitumen Plant daily output: 520 MT Grade 60/70 (+8% vs target).',
      '- Storage Tanks TK-101 to TK-104 operating within normal temperature & pressure.',
      '- Quality assurance batch certificates verified by lab control.',
      '',
      'Generated from BOGCL OneOps Leadership Workspace.',
    ].join('\r\n');

    const blob = new Blob([summaryBody], { type: 'text/plain;charset=utf-8' });
    triggerDownload(URL.createObjectURL(blob), true);
  };

  const handleViewDocument = (msg: ChatMessage) => {
    setPreviewDoc(msg);
  };

  const handleAcknowledgeDirective = (msgId: string) => {
    updateMessage(msgId, (m) => ({ ...m, directiveAcknowledged: true }));
    showToast(t('Directive acknowledged.', 'নির্দেশনা স্বীকার করা হয়েছে।', lang), 'success');
  };

  const handleToggleReaction = (msgId: string, emoji: string) => {
    updateMessage(msgId, (m) => {
      const reacted = m.reactedBy?.[emoji] ?? [];
      const mine = reacted.includes(selfId);
      const count = (m.reactions?.[emoji] ?? 0) + (mine ? -1 : 1);
      const reactions = { ...m.reactions };
      if (count <= 0) delete reactions[emoji];
      else reactions[emoji] = count;
      return {
        ...m,
        reactions,
        reactedBy: { ...m.reactedBy, [emoji]: mine ? reacted.filter((id) => id !== selfId) : [...reacted, selfId] },
      };
    });
    setReactionPickerFor(null);
  };

  const handleTogglePin = (msg: ChatMessage) => {
    updateMessage(msg.id, (m) => ({ ...m, isPinned: !m.isPinned }));
    showToast(
      msg.isPinned
        ? t('Message unpinned.', 'বার্তার পিন সরানো হয়েছে।', lang)
        : t('Message pinned for everyone in this room.', 'বার্তাটি এই রুমের সবার জন্য পিন করা হয়েছে।', lang),
      'info',
    );
  };

  const handleCopy = (msg: ChatMessage) => {
    const text = msg.type === 'document' ? (msg.fileName ?? msg.content) : msg.content;
    if (!navigator.clipboard) {
      showToast(t('Copy is not available in this browser.', 'এই ব্রাউজারে কপি করা যাচ্ছে না।', lang), 'danger');
      return;
    }
    navigator.clipboard.writeText(text).then(
      () => showToast(t('Copied to clipboard.', 'ক্লিপবোর্ডে কপি হয়েছে।', lang), 'success'),
      () => showToast(t('Could not copy the message.', 'বার্তা কপি করা যায়নি।', lang), 'danger'),
    );
  };

  const handlePreset = (text: string) => {
    setMessageInput(text);
    setIsDirectiveMode(true);
    setShowQuickDirectives(false);
    inputRef.current?.focus();
  };

  const clearSearch = () => {
    setSearchFilter('');
    searchInputRef.current?.focus();
  };

  /* ── Render helpers ────────────────────────────────────────────────────── */
  const renderReceipt = (msg: ChatMessage) => {
    const readCount = msg.readBy.length;
    const names = msg.readBy.map(memberName).join(', ');
    if (isGroup) {
      return readCount === 0
        ? <span className="ic-read-receipt"><Check size={13} /> {t('Sent', 'পাঠানো হয়েছে', lang)}</span>
        : <span className="ic-read-receipt read" title={names}><CheckCheck size={13} /> {t(`Read by ${readCount}`, `${readCount} জন পড়েছেন`, lang)}</span>;
    }
    return readCount === 0
      ? <span className="ic-read-receipt"><Check size={13} /> {t('Delivered', 'পৌঁছেছে', lang)}</span>
      : <span className="ic-read-receipt read"><CheckCheck size={13} /> {t('Read', 'পঠিত', lang)}</span>;
  };

  const renderBody = (msg: ChatMessage, isMe: boolean) => {
    if (msg.type === 'directive') {
      return (
        <div className="ic-directive-card">
          <div className="ic-directive-header">
            <div className="ic-directive-title">
              <FileCheck size={14} />
              <span>{t('CHAIRMAN DIRECTIVE', 'চেয়ারম্যানের নির্দেশনা', lang)}</span>
            </div>
            <code className="ic-directive-id">{msg.directiveId}</code>
          </div>
          <div className="ic-directive-body"><Highlight text={msg.content} query={query} /></div>
          <div className="ic-directive-footer">
            {msg.directiveAcknowledged ? (
              <div className="ic-ack-status success">
                <CheckCheck size={15} />
                <span>{t('Acknowledged', 'স্বীকৃত', lang)}</span>
              </div>
            ) : isMe ? (
              <div className="ic-ack-status pending">
                <Clock size={14} />
                <span>{t('Awaiting acknowledgement', 'স্বীকৃতির অপেক্ষায়', lang)}</span>
              </div>
            ) : (
              <div className="ic-ack-action">
                <button type="button" className="ic-btn-ack" onClick={() => handleAcknowledgeDirective(msg.id)}>
                  <CheckCircle size={14} /> {t('Acknowledge', 'স্বীকার করুন', lang)}
                </button>
                <span className="ic-ack-sla">{t('Response due within 48h', '৪৮ ঘণ্টার মধ্যে সাড়া দিন', lang)}</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    if (msg.type === 'document') {
      const ext = msg.fileName?.split('.').pop()?.toUpperCase() ?? 'FILE';
      const isImg = isImageFile(msg.fileName, msg.fileMime);
      return (
        <div className="ic-document-card">
          <div
            className="ic-doc-icon-box"
            onClick={() => handleViewDocument(msg)}
            style={{ cursor: 'pointer' }}
            title={t('Click to preview', 'দেখতে ক্লিক করুন', lang)}
          >
            {isImg ? <ImageIcon size={20} /> : <FileText size={20} />}
          </div>
          <div
            className="ic-doc-info"
            onClick={() => handleViewDocument(msg)}
            style={{ cursor: 'pointer' }}
            title={t('Click to preview', 'দেখতে ক্লিক করুন', lang)}
          >
            <div className="ic-doc-name" title={msg.fileName}><Highlight text={msg.fileName ?? ''} query={query} /></div>
            <div className="ic-doc-sub">{msg.fileSize} · {ext} · {t('Scanned & verified', 'স্ক্যানকৃত ও যাচাইকৃত', lang)}</div>
          </div>
          <div className="ic-doc-actions">
            <button
              type="button" className="ic-doc-btn"
              onClick={() => handleViewDocument(msg)}
              aria-label={t('View document', 'নথি দেখুন', lang)} title={t('Preview document', 'নথি প্রিভিউ দেখুন', lang)}
            >
              <Eye size={14} />
            </button>
            <button
              type="button" className="ic-doc-btn"
              onClick={() => handleDownloadDocument(msg)}
              aria-label={t('Download document', 'নথি ডাউনলোড করুন', lang)} title={t('Download document', 'নথি ডাউনলোড করুন', lang)}
            >
              <Download size={14} />
            </button>
          </div>
        </div>
      );
    }
    if (msg.type === 'voice') {
      return (
        <VoiceMessage
          durationLabel={msg.voiceDuration}
          playing={playingVoiceId === msg.id}
          onPlayingChange={(playing) =>
            setPlayingVoiceId((cur) => (playing ? msg.id : cur === msg.id ? null : cur))}
          lang={lang}
        />
      );
    }
    return (
      <div className={`ic-text-bubble ${msg.isUrgent ? 'urgent' : ''}`}>
        <p><Highlight text={msg.content} query={query} /></p>
      </div>
    );
  };

  const renderMessage = (msg: ChatMessage, grouped: boolean) => {
    const isMe = msg.senderId === selfId;
    const reactions = Object.entries(msg.reactions ?? {}).filter(([, count]) => count > 0);
    return (
      <div
        key={msg.id}
        data-msg-id={msg.id}
        className={[
          'ic-message-row', isMe ? 'outgoing' : 'incoming',
          msg.type === 'directive' ? 'is-directive' : '',
          grouped ? 'grouped' : '',
          highlightId === msg.id ? 'flash' : '',
        ].join(' ')}
      >
        {!isMe && (
          <div className="ic-msg-avatar-slot">
            {!grouped && (
              <div className="ic-msg-avatar">
                {msg.senderInitials}
              </div>
            )}
          </div>
        )}

        <div className="ic-msg-content-block">
          {!grouped && (
            <div className="ic-msg-meta-header">
              <span className="ic-msg-sender">{isMe ? t('You', 'আপনি', lang) : msg.senderName}</span>
              {!isMe && msg.senderRole && <span className="ic-msg-role-tag">{msg.senderRole}</span>}
              <span className="ic-msg-time">{msg.timestamp}</span>
              {msg.isUrgent && msg.type !== 'directive' && <span className="ic-msg-urgent-tag">{t('PRIORITY', 'জরুরি', lang)}</span>}
              {msg.isPinned && <span className="ic-msg-pinned-tag"><Pin size={9} /> {t('PINNED', 'পিনকৃত', lang)}</span>}
            </div>
          )}

          <div className="ic-msg-bubble-wrap">
            {renderBody(msg, isMe)}

            <div className="ic-msg-actions" role="toolbar" aria-label={t('Message actions', 'বার্তার অ্যাকশন', lang)}>
              <button
                type="button"
                className={`ic-act-btn ic-act-react ${reactionPickerFor === msg.id ? 'active' : ''}`}
                onClick={() => setReactionPickerFor(reactionPickerFor === msg.id ? null : msg.id)}
                aria-label={t('Add reaction', 'প্রতিক্রিয়া দিন', lang)} title={t('Add reaction', 'প্রতিক্রিয়া দিন', lang)}
                aria-expanded={reactionPickerFor === msg.id}
              >
                <Smile size={14} />
              </button>
              {canIssueDirective && (
                <button
                  type="button"
                  className={`ic-act-btn ${msg.isPinned ? 'active' : ''}`}
                  onClick={() => handleTogglePin(msg)}
                  aria-label={msg.isPinned ? t('Unpin message', 'পিন সরান', lang) : t('Pin message', 'পিন করুন', lang)}
                  title={msg.isPinned ? t('Unpin message', 'পিন সরান', lang) : t('Pin message', 'পিন করুন', lang)}
                >
                  {msg.isPinned ? <PinOff size={14} /> : <Pin size={14} />}
                </button>
              )}
              {msg.type !== 'voice' && (
                <button
                  type="button" className="ic-act-btn" onClick={() => handleCopy(msg)}
                  aria-label={t('Copy text', 'লেখা কপি করুন', lang)} title={t('Copy text', 'লেখা কপি করুন', lang)}
                >
                  <Copy size={14} />
                </button>
              )}
              {reactionPickerFor === msg.id && (
                <div className="ic-react-pop" role="menu">
                  {REACTION_CHOICES.map((emoji) => (
                    <button key={emoji} type="button" role="menuitem" className="ic-mini-react-btn" onClick={() => handleToggleReaction(msg.id, emoji)}>
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {(reactions.length > 0 || isMe) && (
            <div className="ic-msg-bottom-bar">
              <div className="ic-reactions-group">
                {reactions.map(([emoji, count]) => {
                  const mine = msg.reactedBy?.[emoji]?.includes(selfId);
                  return (
                    <button
                      key={emoji} type="button"
                      className={`ic-reaction-chip ${mine ? 'mine' : ''}`}
                      onClick={() => handleToggleReaction(msg.id, emoji)}
                      aria-pressed={!!mine}
                    >
                      <span>{emoji}</span>
                      <span className="ic-reaction-count">{count}</span>
                    </button>
                  );
                })}
              </div>
              {isMe && renderReceipt(msg)}
            </div>
          )}
        </div>
      </div>
    );
  };

  const roomTitle = isGroup ? `#${activeChannel?.name ?? ''}` : activeMember?.name ?? '';
  const roomSubtitle = isGroup
    ? activeChannel?.description ?? ''
    : `${activeMember?.role ?? ''} · ${activeMember?.location ?? ''}`;

  const roster: ChatMember[] = [
    {
      id: selfId, name: selfMeta.name, role: selfMeta.label, initials: selfMeta.initials, color: selfMeta.avatarColor,
      status: 'online', statusLabel: '', location: '', phone: '',
    },
    ...members,
  ];

  return (
    <div className={`inner-circle-workspace ${!showRightDrawer ? 'drawer-closed' : ''} ${mobileShowChat ? 'mobile-show-chat' : 'mobile-show-hub'}`}>
      {/* ── LEFT: channels & direct lines ─────────────────────────────────── */}
      <aside className="ic-hub-sidebar" aria-label={t('Conversations', 'আলাপচারিতা', lang)}>
        <div className="ic-hub-header">
          <div className="ic-hub-badge">
            <Lock size={12} />
            <span>{t('Private', 'ব্যক্তিগত', lang)}</span>
          </div>
          <h3 className="ic-hub-heading">{t("Chairman's Inner Circle", 'চেয়ারম্যানের ইনার সার্কেল', lang)}</h3>
          <div className="ic-hub-subtext">
            <ShieldCheck size={12} />
            <span>{t('Chairman and department heads only', 'শুধু চেয়ারম্যান ও বিভাগীয় প্রধানগণ', lang)}</span>
          </div>
          <div className="ic-hub-presence">
            <span className="ic-dot online" />
            {t(`${onlineCount} of ${roster.length} online`, `${roster.length} জনের মধ্যে ${onlineCount} জন অনলাইন`, lang)}
          </div>
        </div>

        <div className="ic-hub-search">
          <Search size={14} className="ic-search-icon" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchFilter}
            placeholder={t('Search people, rooms, messages…', 'ব্যক্তি, রুম বা বার্তা খুঁজুন…', lang)}
            aria-label={t('Search conversations', 'আলাপ খুঁজুন', lang)}
            onChange={(e) => setSearchFilter(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Escape') setSearchFilter(''); }}
          />
          {searchFilter && (
            <button type="button" className="ic-search-clear" onClick={clearSearch} aria-label={t('Clear search', 'অনুসন্ধান মুছুন', lang)}>
              <X size={13} />
            </button>
          )}
        </div>

        <div className="ic-hub-tabs" role="tablist" aria-label={t('Filter conversations', 'আলাপ ফিল্টার', lang)}>
          {([
            { id: 'all', label: t('All', 'সব', lang), unread: channelUnread + directUnread },
            { id: 'channels', label: t('Rooms', 'রুম', lang), unread: channelUnread },
            { id: 'direct', label: t('Direct', 'সরাসরি', lang), unread: directUnread },
          ] as { id: TabFilter; label: string; unread: number }[]).map((tab) => (
            <button
              key={tab.id} type="button" role="tab"
              aria-selected={activeTabFilter === tab.id}
              className={`ic-tab-btn ${activeTabFilter === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTabFilter(tab.id)}
            >
              {tab.label}
              {tab.unread > 0 && <span className="ic-tab-count">{tab.unread}</span>}
            </button>
          ))}
        </div>

        <div className="ic-hub-list">
          {searchHits.length > 0 && (
            <div className="ic-section-group">
              <div className="ic-section-title">
                <span>{t('Messages', 'বার্তা', lang)}</span>
                <span className="ic-section-count">{searchHits.length}</span>
              </div>
              {searchHits.map(({ msg, target, label }) => (
                <button
                  key={`${target.type}-${target.id}-${msg.id}`} type="button"
                  className="ic-list-item ic-hit"
                  onClick={() => selectTarget(target, { jumpToMessage: msg.id })}
                >
                  <span className="ic-item-body">
                    <span className="ic-item-top">
                      <span className="ic-item-title">{label}</span>
                      <span className="ic-item-time">{msg.timestamp}</span>
                    </span>
                    <span className="ic-item-snippet wrap">
                      <Highlight text={msg.type === 'document' ? (msg.fileName ?? msg.content) : msg.content} query={query} />
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}

          {showChannelSection && (
            <div className="ic-section-group">
              <div className="ic-section-title">
                <span>{t('Leadership rooms', 'নেতৃত্ব রুম', lang)}</span>
                <span className="ic-section-count">{visibleChannels.length}</span>
              </div>
              {visibleChannels.map((ch) => {
                const active = activeTarget.type === 'channel' && activeTarget.id === ch.id;
                const preview = previewOf(ch.id, true);
                const unread = ch.unread ?? 0;
                return (
                  <button
                    key={ch.id} type="button"
                    className={`ic-list-item ${active ? 'active' : ''} ${unread > 0 ? 'has-unread' : ''}`}
                    aria-current={active ? 'true' : undefined}
                    onClick={() => selectTarget({ type: 'channel', id: ch.id })}
                  >
                    <span className="ic-item-prefix">{ch.isLocked ? <Lock size={14} /> : <Hash size={14} />}</span>
                    <span className="ic-item-body">
                      <span className="ic-item-top">
                        <span className="ic-item-title"><Highlight text={ch.name} query={query} /></span>
                        <span className="ic-item-time">{preview.time}</span>
                      </span>
                      <span className="ic-item-snippet">{preview.text}</span>
                    </span>
                    {unread > 0 && <span className="ic-unread-pill">{unread}</span>}
                  </button>
                );
              })}
            </div>
          )}

          {showDirectSection && (
            <div className="ic-section-group">
              <div className="ic-section-title">
                <span>{t('Direct lines', 'সরাসরি লাইন', lang)}</span>
                <span className="ic-section-count">{visibleMembers.length}</span>
              </div>
              {visibleMembers.map((member) => {
                const active = activeTarget.type === 'dm' && activeTarget.id === member.id;
                const preview = previewOf(dmKey(selfId, member.id), false);
                const unread = selfId === CHAIRMAN_ID ? member.unread ?? 0 : 0;
                return (
                  <button
                    key={member.id} type="button"
                    className={`ic-list-item ${active ? 'active' : ''} ${unread > 0 ? 'has-unread' : ''}`}
                    aria-current={active ? 'true' : undefined}
                    onClick={() => selectTarget({ type: 'dm', id: member.id })}
                  >
                    <span className="ic-avatar-wrap">
                      <span className="ic-avatar">{member.initials}</span>
                      <span className={`ic-status-indicator ic-dot ${member.status}`} title={statusText(member.status)} />
                    </span>
                    <span className="ic-item-body">
                      <span className="ic-item-top">
                        <span className="ic-item-title"><Highlight text={member.name} query={query} /></span>
                        <span className="ic-item-time">{preview.time}</span>
                      </span>
                      <span className="ic-item-role">{member.role}</span>
                      <span className="ic-item-snippet">{preview.time ? preview.text : member.statusLabel}</span>
                    </span>
                    {unread > 0 && <span className="ic-unread-pill">{unread}</span>}
                  </button>
                );
              })}
            </div>
          )}

          {query && !showChannelSection && !showDirectSection && searchHits.length === 0 && (
            <div className="ic-empty-list">
              <SearchX size={22} />
              <strong>{t('No matches', 'কিছু পাওয়া যায়নি', lang)}</strong>
              <span>{t(`Nothing found for “${query}”.`, `“${query}” এর জন্য কিছু পাওয়া যায়নি।`, lang)}</span>
              <button type="button" className="ic-link-btn" onClick={clearSearch}>{t('Clear search', 'অনুসন্ধান মুছুন', lang)}</button>
            </div>
          )}
        </div>
      </aside>

      {/* ── MIDDLE: conversation & composer ───────────────────────────────── */}
      <main className="ic-chat-main">
        <header className="ic-chat-topbar">
          <button
            type="button" className="ic-mobile-back-btn"
            onClick={() => setMobileShowChat(false)}
            title={t('Back to conversations', 'আলাপ তালিকায় ফিরুন', lang)}
          >
            <ChevronLeft size={16} />
            <span>{t('Back', 'তালিকা', lang)}</span>
          </button>
          <div className="ic-topbar-left">
            {isGroup ? (
              <div className="ic-room-icon-box">{activeChannel?.isLocked ? <Lock size={16} /> : <Hash size={16} />}</div>
            ) : (
              <div className="ic-room-avatar">
                {activeMember?.initials}
                <span className={`ic-avatar-dot ic-dot ${activeMember?.status ?? 'online'}`} />
              </div>
            )}
            <div className="ic-room-meta">
              <div className="ic-room-title-line">
                <h2 className="ic-room-title" title={roomTitle}>{roomTitle}</h2>
                <span className="ic-security-pill" title={t('Encrypted in transit and at rest', 'ট্রান্সমিশন ও সংরক্ষণে এনক্রিপ্টেড', lang)}>
                  <Lock size={9} /> <span className="ic-pill-text">{t('Encrypted', 'এনক্রিপ্টেড', lang)}</span>
                </span>
                {isGroup && (
                  <span className="ic-members-pill"><Users size={11} /> {activeChannel?.membersCount}</span>
                )}
              </div>
              <p className="ic-room-desc" title={roomSubtitle}>
                {roomSubtitle}
              </p>
            </div>
          </div>

          <div className="ic-topbar-actions">
            <button
              type="button" className="ic-btn-call" onClick={() => setShowCallModal('voice')}
              title={t('Start encrypted voice call', 'এনক্রিপ্টেড ভয়েস কল শুরু করুন', lang)}
              aria-label={t('Start voice call', 'ভয়েস কল শুরু করুন', lang)}
            >
              <Phone size={14} />
              <span>{t('Voice', 'ভয়েস', lang)}</span>
            </button>
            <button
              type="button" className="ic-btn-video" onClick={() => setShowCallModal('video')}
              title={t('Start secure video conference', 'নিরাপদ ভিডিও মিটিং শুরু করুন', lang)}
              aria-label={t('Start video conference', 'ভিডিও মিটিং শুরু করুন', lang)}
            >
              <Video size={14} />
              <span>{t('Video', 'ভিডিও', lang)}</span>
            </button>
            <button
              type="button" className={`ic-btn-panel-toggle ${showRightDrawer ? 'active' : ''}`}
              onClick={() => setShowRightDrawer(!showRightDrawer)}
              aria-pressed={showRightDrawer}
              aria-label={t('Toggle details panel', 'বিবরণ প্যানেল', lang)}
              title={t('Toggle details panel', 'বিবরণ প্যানেল', lang)}
            >
              <PanelRight size={15} />
            </button>
          </div>
        </header>

        <div className="ic-stream-wrap">
          <div
            className="ic-messages-container" ref={messagesScrollRef} onScroll={handleScroll}
            role="log" aria-live="polite" aria-label={t('Messages', 'বার্তা', lang)}
          >
            {activeMessages.length > 0 && <div className="ic-stream-spacer" />}
            <div className="ic-date-divider">
              <span className="ic-date-chip">{t(`Today, ${today()}`, `আজ, ${today()}`, lang)}</span>
            </div>

            {activeMessages.length === 0 && (
              <div className="ic-empty-chat">
                <div className="ic-empty-icon"><MessageSquare size={26} /></div>
                <strong>{t('No messages yet', 'এখনও কোনো বার্তা নেই', lang)}</strong>
                <span>
                  {isGroup
                    ? t('Start the conversation with your leadership team.', 'নেতৃত্ব দলের সঙ্গে আলাপ শুরু করুন।', lang)
                    : t(`Send a private message to ${activeMember?.name ?? ''}.`, `${activeMember?.name ?? ''}-কে ব্যক্তিগত বার্তা পাঠান।`, lang)}
                </span>
                <button type="button" className="ic-link-btn" onClick={() => inputRef.current?.focus()}>
                  {t('Write a message', 'বার্তা লিখুন', lang)}
                </button>
              </div>
            )}

            {rows.map((row) =>
              row.kind === 'new-divider' ? (
                <div key="new-divider" className="ic-new-divider">
                  <span>{t(`${row.count} new messages`, `${row.count}টি নতুন বার্তা`, lang)}</span>
                </div>
              ) : (
                renderMessage(row.msg, row.grouped)
              ),
            )}
          </div>

          {showJumpToLatest && (
            <button
              type="button" className="ic-jump-latest"
              onClick={() => scrollToBottom('smooth')}
              aria-label={t('Jump to latest message', 'সর্বশেষ বার্তায় যান', lang)}
            >
              <ArrowDown size={14} /> {t('Latest', 'সর্বশেষ', lang)}
            </button>
          )}
        </div>

        {showQuickDirectives && canIssueDirective && (
          <div className="ic-quick-directives">
            <div className="ic-quick-header">
              <div className="ic-quick-label">
                <SlidersHorizontal size={12} />
                <span>{t('DIRECTIVE PRESETS — Click to insert into message box', 'দ্রুত নির্দেশাবলি — বার্তা বক্সে যুক্ত করতে ক্লিক করুন', lang)}</span>
              </div>
              <button
                type="button"
                className="ic-quick-close"
                onClick={() => setShowQuickDirectives(false)}
                aria-label={t('Close presets', 'প্রিসেট বন্ধ করুন', lang)}
              >
                <X size={13} />
              </button>
            </div>
            <select
              className="form-input"
              value=""
              onChange={(e) => {
                const preset = DIRECTIVE_PRESETS.find((p) => p.id === e.target.value);
                if (preset) handlePreset(lang === 'bn' ? preset.textBn : preset.textEn);
              }}
            >
              <option value="">{t('Insert a directive…', 'একটি নির্দেশ যুক্ত করুন…', lang)}</option>
              {DIRECTIVE_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>{lang === 'bn' ? p.labelBn : p.labelEn}</option>
              ))}
            </select>
          </div>
        )}

        {isRecordingVoice ? (
          <div className="ic-recording-container">
            <div className="ic-recording-pulse">
              <span className="ic-rec-dot" />
              <span className="ic-rec-text">
                {t('Recording voice message', 'ভয়েস বার্তা রেকর্ড হচ্ছে', lang)} · {formatClock(recordingSeconds)}
              </span>
            </div>
            <div className="ic-recording-wave" aria-hidden="true">
              <span /><span /><span /><span /><span /><span /><span /><span />
            </div>
            <div className="ic-recording-actions">
              <button type="button" className="btn-outline" onClick={() => setIsRecordingVoice(false)}>
                {t('Cancel', 'বাতিল', lang)}
              </button>
              <button type="button" className="btn-primary" onClick={handleSendVoiceMemo}>
                <Send size={14} /> {t('Send voice message', 'ভয়েস বার্তা পাঠান', lang)}
              </button>
            </div>
          </div>
        ) : (
          <div className={`ic-composer-box ${isDirectiveMode ? 'directive-active' : ''}`}>
            {isDirectiveMode && (
              <div className="ic-directive-mode-bar">
                <div className="ic-dir-tag">
                  <FileCheck size={13} />
                  <span>{t('FORMAL CHAIRMAN DIRECTIVE · RECORDED IN AUDIT LOG', 'আনুষ্ঠানিক চেয়ারম্যান নির্দেশনা · অডিট লগে সংরক্ষিত', lang)}</span>
                </div>
                <button type="button" className="ic-dir-close" onClick={() => setIsDirectiveMode(false)} aria-label={t('Cancel directive mode', 'নির্দেশনা মোড বাতিল', lang)}>
                  <X size={14} />
                </button>
              </div>
            )}

            <div className="ic-composer-field">
              <textarea
                ref={inputRef}
                className="ic-composer-textarea"
                rows={1}
                maxLength={MAX_MESSAGE_LENGTH}
                aria-label={t('Message', 'বার্তা', lang)}
                placeholder={
                  isDirectiveMode
                    ? t('Draft the directive for your leadership team…', 'নেতৃত্ব দলের জন্য নির্দেশনা লিখুন…', lang)
                    : isGroup
                      ? t(`Message #${activeChannel?.name ?? ''}`, `#${activeChannel?.name ?? ''}-এ বার্তা লিখুন`, lang)
                      : t(`Message ${activeMember?.name ?? ''}`, `${activeMember?.name ?? ''}-কে বার্তা লিখুন`, lang)
                }
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />

              <div className="ic-composer-bottom-bar">
                <div className="ic-composer-tools">
                  {canIssueDirective && (
                    <button
                      type="button" className={`ic-tool-btn ${isDirectiveMode ? 'active' : ''}`}
                      onClick={() => setIsDirectiveMode(!isDirectiveMode)} aria-pressed={isDirectiveMode}
                    >
                      <FileCheck size={14} />
                      <span>{t('Directive', 'নির্দেশনা', lang)}</span>
                    </button>
                  )}
                  <button
                    type="button" className={`ic-tool-btn ${isUrgentFlag ? 'active danger' : ''}`}
                    onClick={() => setIsUrgentFlag(!isUrgentFlag)} aria-pressed={isUrgentFlag}
                    title={t('Flag as urgent', 'জরুরি হিসেবে চিহ্নিত করুন', lang)}
                  >
                    <Flag size={14} />
                    <span>{t('Urgent', 'জরুরি', lang)}</span>
                  </button>
                  <button
                    type="button" className="ic-tool-btn icon-only"
                    onClick={() => fileInputRef.current?.click()}
                    aria-label={t('Attach document', 'নথি সংযুক্ত করুন', lang)}
                    title={t('Attach PDF, Word, Excel or image (max 10 MB)', 'PDF, Word, Excel বা ছবি সংযুক্ত করুন (সর্বোচ্চ ১০ এমবি)', lang)}
                  >
                    <Paperclip size={15} />
                  </button>
                  <input ref={fileInputRef} type="file" accept={ATTACHMENT_ACCEPT} hidden onChange={handleAttachFile} />
                  {canIssueDirective && (
                    <button
                      type="button" className={`ic-tool-btn ${showQuickDirectives ? 'active' : ''}`}
                      onClick={() => setShowQuickDirectives(!showQuickDirectives)} aria-pressed={showQuickDirectives}
                    >
                      <SlidersHorizontal size={14} />
                      <span>{t('Presets', 'প্রিসেট', lang)}</span>
                    </button>
                  )}
                  <button
                    type="button" className="ic-tool-btn icon-only"
                    onClick={() => setIsRecordingVoice(true)}
                    aria-label={t('Record voice message', 'ভয়েস বার্তা রেকর্ড করুন', lang)}
                    title={t('Record voice message', 'ভয়েস বার্তা রেকর্ড করুন', lang)}
                  >
                    <Mic size={15} />
                  </button>
                </div>

                <div className="ic-composer-send-group">
                  {messageInput.length >= COUNTER_THRESHOLD ? (
                    <span className={`ic-char-count ${messageInput.length >= MAX_MESSAGE_LENGTH ? 'limit' : ''}`}>
                      {messageInput.length}/{MAX_MESSAGE_LENGTH}
                    </span>
                  ) : (
                    <span className="ic-kbd-hint">{t('Enter to send · Shift+Enter for new line', 'পাঠাতে Enter · নতুন লাইনে Shift+Enter', lang)}</span>
                  )}
                  <button
                    type="button" className={`ic-btn-send ${isDirectiveMode ? 'directive' : ''}`}
                    onClick={handleSendMessage} disabled={!messageInput.trim()}
                  >
                    <Send size={14} />
                    <span>{isDirectiveMode ? t('Issue directive', 'নির্দেশনা জারি', lang) : t('Send', 'পাঠান', lang)}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── RIGHT: room details, pinned, shared files ─────────────────────── */}
      {showRightDrawer && (
        <aside className="ic-vault-drawer" aria-label={t('Details', 'বিবরণ', lang)}>
          <div className="ic-drawer-header">
            <h4>{isGroup ? t('Room details', 'রুমের বিবরণ', lang) : t('Contact details', 'যোগাযোগের বিবরণ', lang)}</h4>
            <button type="button" className="ic-drawer-close" onClick={() => setShowRightDrawer(false)} aria-label={t('Close panel', 'প্যানেল বন্ধ করুন', lang)}>
              <X size={15} />
            </button>
          </div>

          <div className="ic-drawer-content">
            {!isGroup && activeMember ? (
              <div className="ic-member-dossier">
                <div className="ic-dossier-avatar">{activeMember.initials}</div>
                <div className="ic-dossier-name">{activeMember.name}</div>
                <div className="ic-dossier-role">{activeMember.role}</div>
                <div className="ic-dossier-actions">
                  <button type="button" className="ic-btn-call" onClick={() => setShowCallModal('voice')}>
                    <Phone size={13} /> {t('Call', 'কল', lang)}
                  </button>
                  <button type="button" className="ic-btn-video" onClick={() => setShowCallModal('video')}>
                    <Video size={13} /> {t('Video', 'ভিডিও', lang)}
                  </button>
                </div>
                <div className="ic-dossier-meta-card">
                  <div className="ic-dm-row">
                    <span className="lbl">{t('Status', 'অবস্থা', lang)}</span>
                    <span className="val"><span className={`ic-dot inline ${activeMember.status}`} /> {activeMember.statusLabel || statusText(activeMember.status)}</span>
                  </div>
                  <div className="ic-dm-row">
                    <span className="lbl">{t('Location', 'অবস্থান', lang)}</span>
                    <span className="val">{activeMember.location}</span>
                  </div>
                  <div className="ic-dm-row">
                    <span className="lbl">{t('Mobile', 'মোবাইল', lang)}</span>
                    <span className="val">{activeMember.phone}</span>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="ic-room-about">
                  <div className="ic-room-about-title">
                    {activeChannel?.isLocked ? <Lock size={13} /> : <Hash size={13} />}
                    <span>{activeChannel?.name}</span>
                  </div>
                  <p>{activeChannel?.description}</p>
                </div>
                <div className="ic-channel-roster">
                  <div className="ic-drawer-sec-title">
                    <Users size={12} />
                    <span>{t(`Members (${roster.length})`, `সদস্য (${roster.length})`, lang)}</span>
                  </div>
                  <div className="ic-roster-list">
                    {roster.map((m) => (
                      <div key={m.id} className="ic-roster-row">
                        <div className="ic-mini-avatar">{m.initials}</div>
                        <div className="ic-roster-info">
                          <div className="ic-roster-name">{m.id === selfId ? `${m.name} (${t('You', 'আপনি', lang)})` : m.name}</div>
                          <div className="ic-roster-dept">{m.role}</div>
                        </div>
                        <span className={`ic-roster-dot ic-dot ${m.status}`} title={statusText(m.status)} />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="ic-drawer-section">
              <div className="ic-drawer-sec-title">
                <Pin size={12} />
                <span>{t('Pinned', 'পিনকৃত', lang)}</span>
              </div>
              {pinnedMessages.length === 0 ? (
                <p className="ic-drawer-empty">
                  {canIssueDirective
                    ? t('Pin a message from the message toolbar to keep it here.', 'বার্তার টুলবার থেকে পিন করলে এখানে থাকবে।', lang)
                    : t('Nothing pinned in this conversation.', 'এই আলাপে কিছু পিন করা নেই।', lang)}
                </p>
              ) : (
                <div className="ic-pinned-list">
                  {pinnedMessages.map((m) => (
                    <button key={m.id} type="button" className="ic-pinned-card" onClick={() => setJumpTo(m.id)}>
                      <span className="ic-pinned-tag">
                        {m.type === 'directive' ? <FileCheck size={10} /> : <Pin size={10} />}
                        {m.directiveId ?? t('Pinned message', 'পিনকৃত বার্তা', lang)}
                      </span>
                      <span className="ic-pinned-text">{m.type === 'document' ? m.fileName : m.content}</span>
                      <span className="ic-pinned-meta">{m.senderName} · {m.timestamp}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="ic-drawer-section">
              <div className="ic-drawer-sec-title">
                <FileText size={12} />
                <span>{t(`Shared files (${sharedFiles.length})`, `শেয়ার করা ফাইল (${sharedFiles.length})`, lang)}</span>
              </div>
              {sharedFiles.length === 0 ? (
                <p className="ic-drawer-empty">{t('Documents shared here will appear in this list.', 'এখানে শেয়ার করা নথি এই তালিকায় দেখা যাবে।', lang)}</p>
              ) : (
                <div className="ic-vault-list">
                  {sharedFiles.map((m) => (
                    <div key={m.id} className="ic-vault-file">
                      <button type="button" className="ic-vault-open" onClick={() => handleViewDocument(m)}>
                        <span className="ic-vf-icon"><FileText size={16} /></span>
                        <span className="ic-vf-info">
                          <span className="ic-vf-name" title={m.fileName}>{m.fileName}</span>
                          <span className="ic-vf-size">{m.fileSize} · {m.senderName}</span>
                        </span>
                      </button>
                      <button
                        type="button" className="ic-vf-dl"
                        onClick={() => handleDownloadDocument(m)}
                        aria-label={t('Download document', 'নথি ডাউনলোড করুন', lang)}
                        title={t('Download document', 'নথি ডাউনলোড করুন', lang)}
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </aside>
      )}

      {/* ── DOCUMENT & IMAGE PREVIEW MODAL ────────────────────────────────── */}
      {previewDoc && (
        <div className="modal-bg" onClick={() => setPreviewDoc(null)}>
          <div className="modal" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-hd">
              <h3>
                {isImageFile(previewDoc.fileName, previewDoc.fileMime) ? <ImageIcon size={17} /> : <FileText size={17} />}
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {previewDoc.fileName || previewDoc.content}
                </span>
              </h3>
              <button type="button" className="modal-close" onClick={() => setPreviewDoc(null)} aria-label={t('Close', 'বন্ধ করুন', lang)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  flexWrap: 'wrap',
                  padding: '10px 14px',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border-1)',
                  borderRadius: '10px',
                  fontSize: '12px',
                }}
              >
                <div>
                  <strong style={{ color: 'var(--text-1)' }}>{previewDoc.senderName}</strong>
                  {previewDoc.senderRole && <span style={{ color: 'var(--text-3)' }}> · {previewDoc.senderRole}</span>}
                  <div style={{ color: 'var(--text-3)', fontSize: '11px', marginTop: '2px' }}>
                    {t('Shared at', 'শেয়ারের সময়', lang)} {previewDoc.timestamp} · {previewDoc.fileSize || '2.4 MB'}
                  </div>
                </div>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--status-success-text)',
                    background: 'var(--status-success-bg)',
                    border: '1px solid var(--status-success-border)',
                    padding: '3px 9px',
                    borderRadius: '999px',
                  }}
                >
                  <ShieldCheck size={13} />
                  {t('Scanned & verified', 'স্ক্যানকৃত ও যাচাইকৃত', lang)}
                </span>
              </div>

              {isImageFile(previewDoc.fileName, previewDoc.fileMime) ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border-1)',
                    borderRadius: '12px',
                    padding: '20px',
                    minHeight: '240px',
                    maxHeight: '420px',
                    overflow: 'auto',
                  }}
                >
                  <img
                    src={previewDoc.fileUrl || '/logoBOGCL.png'}
                    alt={previewDoc.fileName || 'Attached image'}
                    style={{ maxWidth: '100%', maxHeight: '380px', objectFit: 'contain', borderRadius: '8px' }}
                  />
                </div>
              ) : previewDoc.fileUrl && (previewDoc.fileMime === 'application/pdf' || previewDoc.fileName?.toLowerCase().endsWith('.pdf')) ? (
                <iframe
                  src={previewDoc.fileUrl}
                  title={previewDoc.fileName || 'Document preview'}
                  style={{
                    width: '100%',
                    height: '380px',
                    border: '1px solid var(--border-1)',
                    borderRadius: '10px',
                    background: 'var(--surface-2)',
                  }}
                />
              ) : (
                <div
                  style={{
                    background: 'var(--surface-1)',
                    border: '1px solid var(--border-1)',
                    borderRadius: '12px',
                    padding: '18px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-1)', paddingBottom: '10px' }}>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                        {t('Bashundhara Oil & Gas Co. Ltd. · Document Preview', 'বসুন্ধরা অয়েল অ্যান্ড গ্যাস কোং লিঃ · নথি প্রিভিউ', lang)}
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-1)', marginTop: '2px' }}>
                        {previewDoc.fileName}
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', fontFamily: 'monospace', background: 'var(--surface-2)', padding: '3px 8px', borderRadius: '6px', border: '1px solid var(--border-1)', color: 'var(--text-2)' }}>
                      {previewDoc.fileName?.split('.').pop()?.toUpperCase() || 'DOC'}
                    </span>
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-2)', lineHeight: 1.6 }}>
                    <p style={{ margin: '0 0 8px' }}>
                      {t(
                        'Official leadership attachment verified by BOGCL Document Gateway. Click "Download File" below to save a local copy to your device.',
                        'বিওজিসিএল ডকুমেন্ট গেটওয়ে দ্বারা যাচাইকৃত দাপ্তরিক সংযুক্তি। আপনার ডিভাইসে সংরক্ষণ করতে নিচে "ডাউনলোড করুন" বাটনে ক্লিক করুন।',
                        lang
                      )}
                    </p>
                    <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--text-2)' }}>
                      <li>{t('Keraniganj Plant Daily Output: 520 MT Grade 60/70 Bitumen (+8% above target)', 'কেরানীগঞ্জ প্ল্যান্ট দৈনিক উৎপাদন: ৫২০ মেট্রিক টন গ্রেড ৬০/৭০ বিটুমিন (লক্ষ্যমাত্রার চেয়ে ৮% বেশি)', lang)}</li>
                      <li>{t('Storage Tanks TK-101 to TK-104: Operating within normal temperature and pressure parameters', 'স্টোরেজ ট্যাংক TK-101 হতে TK-104: স্বাভাবিক তাপমাত্রা ও চাপের মধ্যে সচল', lang)}</li>
                      <li>{t('Quality Assurance: Batch lab test certificates verified and archived', 'মান নিয়ন্ত্রণ: ব্যাচ ল্যাব টেস্ট সনদ যাচাইকৃত ও সংরক্ষিত', lang)}</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-ft">
              <button type="button" className="btn-outline" onClick={() => setPreviewDoc(null)}>
                {t('Close', 'বন্ধ করুন', lang)}
              </button>
              {previewDoc.fileUrl && (
                <a
                  href={previewDoc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline"
                  style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <ExternalLink size={14} />
                  {t('Open in new tab', 'নতুন ট্যাবে খুলুন', lang)}
                </a>
              )}
              <button type="button" className="btn-primary" onClick={() => handleDownloadDocument(previewDoc)}>
                <Download size={14} />
                {t('Download File', 'ফাইল ডাউনলোড করুন', lang)}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCallModal && (
        <CallModal
          mode={showCallModal}
          isGroup={isGroup}
          subject={isGroup ? (activeChannel?.name ?? '') : (activeMember?.name ?? '')}
          initials={activeMember?.initials}
          participantCount={activeChannel?.membersCount}
          onClose={() => setShowCallModal(null)}
          lang={lang}
        />
      )}
    </div>
  );
}
