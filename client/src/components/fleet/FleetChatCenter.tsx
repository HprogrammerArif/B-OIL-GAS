import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useFleetStore, VehicleRequisition } from '../../store/fleetStore';
import { t } from '../../types';
import { showToast } from '../../App';
import {
  MessageSquare, Send, Car, MapPin, Clock, ShieldCheck, CheckCircle2,
  Radio, Search, Navigation, QrCode, Receipt, Check, PhoneCall,
  AlertTriangle, CheckCheck, X, Fuel, ArrowLeft, Lock, Users,
  Mic, Play, Pause, FileText, Compass
} from 'lucide-react';
import DriverCallModal from './DriverCallModal';

interface FleetChatCenterProps {
  userRole: 'employee' | 'admin' | 'driver';
  lang: 'en' | 'bn';
  onNavigateToTripPass?: (req: VehicleRequisition) => void;
  initialChannelId?: string;
}

type ChannelTab = 'all' | 'trips' | 'direct' | 'broadcast';

const EMERGENCY_PHONE = '+880 1711-229944';

function statusMeta(status: string, lang: 'en' | 'bn') {
  switch (status) {
    case 'completed':
      return {
        label: t('Completed', 'সম্পন্ন', lang),
        cls: 'completed'
      };
    case 'in_transit':
      return {
        label: t('En Route', 'পথে', lang),
        cls: 'in_transit'
      };
    case 'assigned':
      return {
        label: t('Assigned', 'বরাদ্দকৃত', lang),
        cls: 'assigned'
      };
    case 'pending':
      return {
        label: t('Pending', 'অপেক্ষমান', lang),
        cls: 'pending'
      };
    default:
      return {
        label: status.replace(/_/g, ' ').toUpperCase(),
        cls: 'default'
      };
  }
}

function initials(name: string) {
  return name
    .replace(/\(.*?\)/g, '')
    .replace(/^(Md\.?|Mr\.?|Engr\.?)\s+/i, '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() || '')
    .join('');
}

export default function FleetChatCenter({
  userRole,
  lang,
  onNavigateToTripPass,
  initialChannelId,
}: FleetChatCenterProps) {
  const {
    requisitions,
    chatMessages,
    sendChatMessage,
    approveTollExpense,
  } = useFleetStore();

  const isActualEmployee = userRole === 'employee';
  const isActualDriver = userRole === 'driver';
  const isActualAdmin = userRole === 'admin';

  // Interactive Persona Switcher (Allows testing all 3 parties in real-time)
  const [activePersona, setActivePersona] = useState<'employee' | 'driver' | 'admin'>(
    isActualDriver ? 'driver' : isActualAdmin ? 'admin' : 'employee'
  );

  // Authenticated Persona Profile
  const personaName = activePersona === 'employee'
    ? 'Tanvir Ahmed'
    : activePersona === 'driver'
    ? 'Md. Shahidul Islam (Driver)'
    : 'Md. Kamruzzaman (Transport Admin)';

  const personaRole = activePersona;

  // Filter requisitions relevant to role
  const relevantRequisitions = useMemo(() => {
    if (isActualEmployee) {
      return requisitions.filter(r => r.requesterName.includes('Tanvir') || r.id === 'REQ-2026-441' || r.id === 'REQ-2026-435');
    }
    if (isActualDriver) {
      return requisitions.filter(r => r.assignedDriverName?.includes('Rafiqul') || r.assignedDriverName?.includes('Shahidul') || r.id === 'REQ-2026-435' || r.id === 'REQ-2026-441');
    }
    return requisitions;
  }, [requisitions, isActualEmployee, isActualDriver]);

  // Static Direct Hotlines & Emergency Channels
  const directChannels = useMemo(() => [
    {
      id: 'desk_direct',
      type: 'direct' as const,
      name: t('Central Transport Supervisor Hotline', 'সেন্ট্রাল ট্রান্সপোর্ট সুপারভাইজার হটলাইন', lang),
      sub: t('Supervisor Md. Kamruzzaman (Direct Assistance)', 'সুপারভাইজার মো. কামরুজ্জামান (সরাসরি সহায়তা)', lang),
      badge: t('Online', 'অনলাইন', lang),
      icon: ShieldCheck,
      color: 'indigo'
    },
    {
      id: 'broadcast',
      type: 'broadcast' as const,
      name: t('Fleet-Wide Advisory Frequency', 'ফ্লিট সার্বজনীন নির্দেশনা ফ্রিকোয়েন্সি', lang),
      sub: t('Highway Alerts, Fog & Weather Warnings', 'হাইওয়ে কুয়াশা ও আবহাওয়া সতর্কবার্তা', lang),
      badge: t('Announcements', 'ঘোষণা', lang),
      icon: Radio,
      color: 'blue'
    },
    {
      id: 'emergency_sos',
      type: 'emergency' as const,
      name: t('24/7 Roadside Emergency & Highway SOS', '২৪/৭ রোডসাইড ইমার্জেন্সি ও হাইওয়ে এসওএস', lang),
      sub: t('Highway Patrol, Incident Response & Towing', 'হাইওয়ে প্যাট্রোল ও দুর্ঘটনা সহায়তা', lang),
      badge: '24/7 SOS',
      icon: AlertTriangle,
      color: 'rose'
    },
  ], [lang]);

  // Selected Channel ID
  const [selectedChannelId, setSelectedChannelId] = useState<string>(() => {
    if (initialChannelId) return initialChannelId;
    return relevantRequisitions[0]?.id || 'REQ-2026-435';
  });

  const [channelFilterTab, setChannelFilterTab] = useState<ChannelTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [messageText, setMessageText] = useState('');
  const [isTypingUser, setIsTypingUser] = useState<string | null>(null);

  // Mobile View Toggle
  const [mobileActiveView, setMobileActiveView] = useState<'inbox' | 'conversation'>('conversation');

  // Slide-over Drawers (Dossier, GPS Radar, Toll Claim)
  const [activeDrawer, setActiveDrawer] = useState<'none' | 'dossier' | 'radar' | 'toll'>('none');

  // Toll Claim Form State
  const [tollPlaza, setTollPlaza] = useState('Mayor Hanif Flyover');
  const [tollAmount, setTollAmount] = useState('260');
  const [tollSlipNo, setTollSlipNo] = useState(`TOL-2026-${Math.floor(1000 + Math.random() * 9000)}`);

  // Audio Voice Note Player State
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);

  // Voice Note Recording Simulator
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);

  // Phone Call Modal State
  const [showCallModal, setShowCallModal] = useState(false);
  const [activeCallee, setActiveCallee] = useState({
    name: 'Md. Shahidul Islam',
    role: 'Assigned Driver • Toyota Prado GHA-13-8821',
    phone: '+880 1711-229944'
  });

  const streamScrollRef = useRef<HTMLDivElement>(null);
  const composerTextareaRef = useRef<HTMLTextAreaElement>(null);
  const timeoutsRef = useRef<number[]>([]);

  useEffect(() => () => { timeoutsRef.current.forEach(id => window.clearTimeout(id)); }, []);
  const safeTimeout = (fn: () => void, ms: number) => {
    timeoutsRef.current.push(window.setTimeout(fn, ms));
  };

  // Timer for simulated voice recording
  useEffect(() => {
    let interval: any;
    if (isRecordingVoice) {
      interval = setInterval(() => {
        setRecordSeconds(s => s + 1);
      }, 1000);
    } else {
      setRecordSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecordingVoice]);

  const currentRequisition = requisitions.find(r => r.id === selectedChannelId);
  const currentDirectChannel = directChannels.find(c => c.id === selectedChannelId);
  const activeConversationMessages = chatMessages.filter(m => m.requisitionId === selectedChannelId);

  // Auto-scroll stream to bottom smoothly
  useEffect(() => {
    const el = streamScrollRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  }, [activeConversationMessages.length, selectedChannelId, isTypingUser]);

  // Auto-expand composer
  useEffect(() => {
    const el = composerTextareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [messageText]);

  // Handle Channel Selection
  const handleSelectChannel = (id: string) => {
    setSelectedChannelId(id);
    setMobileActiveView('conversation');
    setActiveDrawer('none');
  };

  // Check if channel is read-only broadcast for non-admins
  const isReadOnlyBroadcast = selectedChannelId === 'broadcast' && activePersona !== 'admin';

  // Send Message Flow
  const handleSendMessage = (customText?: string) => {
    const text = (customText || messageText).trim();
    if (!text || isReadOnlyBroadcast) return;

    sendChatMessage(
      selectedChannelId,
      personaRole,
      personaName,
      text,
      { messageType: 'text' }
    );

    if (!customText) {
      setMessageText('');
    }

    // Trigger realistic counterpart responses for a real chat feel
    simulateCounterpartResponses(text, selectedChannelId);
  };

  // Send Voice Note Simulation
  const handleSendVoiceNote = () => {
    setIsRecordingVoice(false);
    const durationStr = `0:${recordSeconds < 10 ? '0' : ''}${recordSeconds || 14}`;
    sendChatMessage(
      selectedChannelId,
      personaRole,
      personaName,
      `🎙️ Audio dispatch voice note (${durationStr})`,
      {
        messageType: 'voice_note',
        voiceData: { duration: durationStr }
      }
    );
    showToast(t('Voice dispatch note sent', 'ভয়েস বার্তা পাঠানো হয়েছে', lang), 'success');
    simulateCounterpartResponses('voice note', selectedChannelId);
  };

  const simulateCounterpartResponses = (userText: string, channelId: string) => {
    const lower = userText.toLowerCase();

    if (channelId.startsWith('REQ-')) {
      const targetReq = requisitions.find(r => r.id === channelId);
      const driverName = targetReq?.assignedDriverName || 'Md. Shahidul Islam';
      const vehiclePlate = targetReq?.assignedVehiclePlate || 'DHAKA METRO GHA-13-8821';

      if (activePersona === 'employee') {
        safeTimeout(() => setIsTypingUser(`${driverName} (Driver)`), 800);
        safeTimeout(() => {
          setIsTypingUser(null);
          let reply = '';
          if (lower.includes('where') || lower.includes('location') || lower.includes('porch') || lower.includes('gate')) {
            reply = `Ji Tanvir Sir, I am parked at Gate-1 porch by the reception canopy with vehicle ${vehiclePlate}. AC is running at 21°C. Please come down whenever ready.`;
          } else if (lower.includes('min') || lower.includes('down') || lower.includes('delay') || lower.includes('wait')) {
            reply = `Noted Tanvir Sir, take your time. I have loaded chilled mineral water bottles in the vehicle. Waiting safely at the porch bay.`;
          } else if (lower.includes('ac') || lower.includes('cool') || lower.includes('temp')) {
            reply = `Ji Sir, cabin temperature is cooled to 20°C and fresh air circulation is running. Ready for highway transit.`;
          } else if (lower.includes('toll') || lower.includes('flyover')) {
            reply = `Ji Sir, I paid the Mayor Hanif Flyover toll (৳260) with my authorized e-pass and submitted the voucher for Central Transport clearance.`;
          } else {
            reply = `Assalamu Alaikum Tanvir Sir, message received. Vehicle ${vehiclePlate} is standing by at your service.`;
          }
          sendChatMessage(channelId, 'driver', `${driverName} (Driver)`, reply, { messageType: 'text' });
        }, 2100);
      } else if (activePersona === 'driver') {
        safeTimeout(() => setIsTypingUser('Tanvir Ahmed (Passenger)'), 800);
        safeTimeout(() => {
          setIsTypingUser(null);
          sendChatMessage(channelId, 'employee', 'Tanvir Ahmed', `Thank you Shahidul Bhai, I have the batch test dossiers ready. We will depart in 5 minutes.`, { messageType: 'text' });
        }, 2000);
      } else {
        safeTimeout(() => setIsTypingUser(`${driverName} (Driver)`), 800);
        safeTimeout(() => {
          setIsTypingUser(null);
          sendChatMessage(channelId, 'driver', `${driverName} (Driver)`, `Ji Kamruzzaman Sir, received instruction. Following designated highway corridor and maintaining safe speed limits.`, { messageType: 'text' });
        }, 2100);
      }
    } else if (channelId === 'desk_direct' && activePersona === 'employee') {
      safeTimeout(() => setIsTypingUser('Md. Kamruzzaman (Transport Supervisor)'), 800);
      safeTimeout(() => {
        setIsTypingUser(null);
        sendChatMessage('desk_direct', 'admin', 'Md. Kamruzzaman (Transport Supervisor)', `Assalamu Alaikum Tanvir. Central Transport Desk has logged your query. Vehicle allocation is prioritized. Feel free to contact hotline ${EMERGENCY_PHONE} if needed.`, { messageType: 'text' });
      }, 2000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Location Sharing Pin
  const handleShareLocationPin = () => {
    const locTitle = activePersona === 'employee' ? 'Bashundhara Corporate HQ Reception' : 'Central Transport Dispatch Yard Gate #1';
    const locAddress = activePersona === 'employee'
      ? 'Plot-3, Block-G, Umme Kulsum Road, Bashundhara R/A, Dhaka'
      : 'BOGCL Central Transport Fleet Yard Gate #1, Baridhara';

    sendChatMessage(selectedChannelId, personaRole, personaName, `Shared Pickup Location Pin: ${locTitle}`, {
      messageType: 'location_share',
      locationData: { title: locTitle, address: locAddress, coordinates: '23.8166° N, 90.4328° E' },
    });
    showToast(t('📍 Location pin shared with driver and transport admin', 'লোকেশন পিন শেয়ার করা হয়েছে', lang), 'success');
  };

  // Toll Claim Submission
  const handleSubmitTollClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRequisition) return;
    const amountNum = parseFloat(tollAmount) || 0;
    if (amountNum <= 0) {
      showToast(t('Please enter valid toll amount', 'সঠিক টোলের পরিমাণ লিখুন', lang), 'info');
      return;
    }

    sendChatMessage(
      currentRequisition.id,
      personaRole === 'admin' ? 'admin' : personaRole === 'driver' ? 'driver' : 'employee',
      personaName,
      `Claimed official highway toll: ${tollPlaza} (৳${amountNum}). Receipt voucher: ${tollSlipNo}`,
      {
        messageType: 'toll_claim',
        tollData: {
          tollName: tollPlaza,
          amount: amountNum,
          receiptNo: tollSlipNo,
          approved: false
        }
      }
    );

    setActiveDrawer('none');
    setTollSlipNo(`TOL-2026-${Math.floor(1000 + Math.random() * 9000)}`);
    showToast(t(
      `✓ Toll voucher claimed: ${tollPlaza} (৳${amountNum}). Submitted for Transport Admin audit.`,
      `✓ টোল ভাউচার দাখিল সম্পন্ন: ৳${amountNum}`,
      lang
    ), 'success');
  };

  const triggerDirectCall = (name: string, roleTitle: string, phone: string) => {
    setActiveCallee({ name, role: roleTitle, phone });
    setShowCallModal(true);
  };

  // Quick Action Chips by Role
  const smartChips = activePersona === 'employee'
    ? [
        { text: t('Waiting at Gate-1 porch canopy', 'গেট-১ এ নথিপত্র নিয়ে প্রস্তুত আছি', lang), icon: MapPin },
        { text: t('Coming down in 3 mins from office', '৩ মিনিটের মধ্যে নিচে নামছি', lang), icon: Clock },
        { text: t('Please keep AC set to 20°C', 'এসির তাপমাত্রা ২০° এ রাখবেন', lang), icon: CheckCircle2 },
        { text: t('Need pickup at Mohakhali flyover ramp', 'মহাখালীতে ১ জন সহকর্মীকে তুলতে হবে', lang), icon: Navigation },
      ]
    : activePersona === 'driver'
    ? [
        { text: t('Arrived at Gate-1 porch, vehicle ready', 'গেট-১ পোর্চে গাড়ি প্রস্তুত', lang), icon: MapPin },
        { text: t('Started highway transit via expressway', 'যাত্রা শুরু করেছি', lang), icon: Navigation },
        { text: t('Uploaded flyover toll slip (৳260)', 'টোল ভাউচার আপলোড করেছি', lang), icon: Receipt },
        { text: t('Arrived safely at destination gate', 'গন্তব্যে নিরাপদে পৌঁছেছি', lang), icon: CheckCircle2 },
      ]
    : [
        { text: t('Gate clearance BOG-7729 authorized', 'গেট পাস অনুমোদিত', lang), icon: ShieldCheck },
        { text: t('Traffic alert: Divert via Outer Ring Road', 'আউটার রিং রোড ব্যবহার করুন', lang), icon: Navigation },
        { text: t('Fuel voucher approved for 60L Octane', '৬০ লিটার ফুয়েল স্লিপ অনুমোদিত', lang), icon: Fuel },
      ];

  const q = searchQuery.trim().toLowerCase();
  const filteredRequisitions = relevantRequisitions.filter(r =>
    r.id.toLowerCase().includes(q) ||
    r.to.toLowerCase().includes(q) ||
    r.requesterName.toLowerCase().includes(q) ||
    (r.assignedDriverName && r.assignedDriverName.toLowerCase().includes(q))
  );

  const filteredDirectChannels = directChannels.filter(h =>
    !q || h.name.toLowerCase().includes(q) || h.sub.toLowerCase().includes(q)
  );

  return (
    <div className="fleet-chat-center-container">
      {/* ══════════════════════════════════════════════════════════════
          COLUMN 1: MESSAGES DIRECTORY / CHAT INBOX (FIXED 340px)
          ══════════════════════════════════════════════════════════════ */}
      <aside
        className="fleet-chat-sidebar"
        style={{
          display: mobileActiveView === 'conversation' ? undefined : 'flex',
        }}
      >
        {/* App Bar / Current User Capsule */}
        <div className="fleet-chat-user-strip">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <div className="fleet-chat-user-medallion">
              {initials(personaName)}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 800 }}>
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {personaName.replace(/\s*\(.*\)/, '')}
                </span>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
              </div>
              <div style={{ fontSize: '11px', color: 'var(--brand-slate-500, #64748B)' }}>
                {activePersona === 'employee' ? 'Staff Passenger' : activePersona === 'driver' ? 'Duty Driver' : 'Central Dispatch'}
              </div>
            </div>
          </div>

          <span style={{ padding: '2px 8px', borderRadius: '9999px', fontSize: '10px', fontWeight: 800, background: '#F1F5F9', color: '#334155', border: '1px solid #CBD5E1' }}>
            {activePersona.toUpperCase()}
          </span>
        </div>

        {/* Filter Tabs (All, Trips, Direct Hotlines) */}
        <div style={{ padding: '8px 12px', background: '#F1F5F9', borderBottom: '1px solid var(--brand-slate-200, #E2E8F0)' }}>
          <div style={{ display: 'flex', background: '#E2E8F0', padding: '2px', borderRadius: '10px', gap: '2px' }}>
            <button
              onClick={() => setChannelFilterTab('all')}
              className={`fleet-chat-tab-pill ${channelFilterTab === 'all' ? 'active' : ''}`}
            >
              {t('All', 'সকল', lang)} ({relevantRequisitions.length + directChannels.length})
            </button>
            <button
              onClick={() => setChannelFilterTab('trips')}
              className={`fleet-chat-tab-pill ${channelFilterTab === 'trips' ? 'active' : ''}`}
            >
              🚗 {t('Trips', 'ট্রিপ', lang)} ({relevantRequisitions.length})
            </button>
            <button
              onClick={() => setChannelFilterTab('direct')}
              className={`fleet-chat-tab-pill ${channelFilterTab === 'direct' ? 'active' : ''}`}
            >
              🛡️ {t('Hotlines', 'হটলাইন', lang)} ({directChannels.length})
            </button>
          </div>
        </div>

        {/* Real-time Search Box */}
        <div className="fleet-chat-search-wrap">
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', pointerEvents: 'none', color: '#94A3B8' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('Search trips, drivers, plates...', 'ট্রিপ, চালক বা গাড়ি খুঁজুন...', lang)}
              className="fleet-chat-search-input"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: '10px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#94A3B8' }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Conversation Items List */}
        <div className="fleet-chat-channel-list">
          {/* Trip Rooms (Tri-Party: Driver ↔ Staff ↔ Admin) */}
          {(channelFilterTab === 'all' || channelFilterTab === 'trips') && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px 6px', fontSize: '10.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94A3B8' }}>
                <span>{t('Active Duty Trips (3-Party)', 'সক্রিয় ডিউটি ট্রিপ চ্যানেল', lang)}</span>
                <span style={{ background: '#EFF6FF', color: '#1D4ED8', padding: '1px 6px', borderRadius: '4px', fontSize: '9.5px', fontWeight: 800 }}>Tri-Party</span>
              </div>

              {filteredRequisitions.map((r) => {
                const isSelected = selectedChannelId === r.id;
                const msgs = chatMessages.filter(m => m.requisitionId === r.id);
                const lastMsg = msgs[msgs.length - 1];
                const sm = statusMeta(r.status, lang);

                return (
                  <div
                    key={r.id}
                    onClick={() => handleSelectChannel(r.id)}
                    className={`fleet-chat-channel-card ${isSelected ? 'active' : ''}`}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      {/* Leading Visual Avatar with Presence Indicator */}
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <div className={`fleet-channel-avatar ${r.status}`}>
                          {r.status === 'in_transit' ? (
                            <Navigation size={20} />
                          ) : r.status === 'completed' ? (
                            <CheckCircle2 size={20} />
                          ) : r.status === 'pending' ? (
                            <Clock size={20} />
                          ) : (
                            <Car size={20} />
                          )}
                        </div>

                        {/* Live Presence Dot */}
                        <span
                          className={`fleet-presence-dot ${
                            r.status === 'in_transit'
                              ? 'green'
                              : r.status === 'completed'
                              ? 'green'
                              : r.status === 'assigned'
                              ? 'blue'
                              : 'amber'
                          }`}
                          title={sm.label}
                        />
                      </div>

                      {/* Content Column */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Top Line: Destination & Active / Status Badge */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                          <h4
                            style={{
                              margin: 0,
                              fontSize: '12.5px',
                              fontWeight: 800,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              color: isSelected ? 'var(--brand-crimson, #A51C30)' : undefined
                            }}
                            title={r.to}
                          >
                            {r.to.split(',')[0]}
                          </h4>

                          {isSelected ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', borderRadius: '9999px', background: 'var(--brand-crimson, #A51C30)', padding: '2px 8px', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', color: '#FFFFFF', flexShrink: 0 }}>
                              Active
                            </span>
                          ) : (
                            <span className={`fleet-status-badge ${sm.cls}`}>
                              {sm.label}
                            </span>
                          )}
                        </div>

                        {/* Line 2: Requisition ID & Route */}
                        <div style={{ marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748B' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, padding: '1px 4px', background: '#F1F5F9', borderRadius: '4px' }}>
                            #{r.id}
                          </span>
                          <span>•</span>
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {r.from.split(',')[0].replace('Bashundhara Corporate HQ', 'HQ')} ➔ {r.to.split(',')[0]}
                          </span>
                        </div>

                        {/* Line 3: Crew Badges (Driver & Passenger) */}
                        <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10.5px' }}>
                          <span
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#F1F5F9', padding: '2px 6px', borderRadius: '6px', fontWeight: 600, maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                            title={`Staff Passenger: ${r.requesterName}`}
                          >
                            <Users size={11} color="#3B82F6" style={{ flexShrink: 0 }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.requesterName.split(' ')[0]}</span>
                          </span>

                          <span style={{ color: '#CBD5E1' }}>➔</span>

                          {r.assignedDriverName ? (
                            <span
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#ECFDF5', color: '#047857', padding: '2px 6px', borderRadius: '6px', fontWeight: 700, maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                              title={`Assigned Driver: ${r.assignedDriverName}`}
                            >
                              <Car size={11} color="#059669" style={{ flexShrink: 0 }} />
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.assignedDriverName.replace(/\s*\(.*\)/, '').split(' ')[0]}</span>
                            </span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#FFFBEB', color: '#B45309', padding: '2px 6px', borderRadius: '6px', fontWeight: 600 }}>
                              <Clock size={11} color="#D97706" style={{ flexShrink: 0 }} />
                              <span>Awaiting</span>
                            </span>
                          )}
                        </div>

                        {/* Line 4: Last Message Snippet */}
                        {lastMsg && (
                          <div style={{ marginTop: '6px', paddingTop: '4px', borderTop: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: '#64748B' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>
                              <strong style={{ color: 'var(--brand-slate-700)', flexShrink: 0 }}>
                                {lastMsg.senderName.split(' ')[0]}:
                              </strong>
                              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {lastMsg.voiceData
                                  ? '🎙️ Voice note dispatch'
                                  : lastMsg.tollData
                                  ? `🧾 Toll: ৳${lastMsg.tollData.amount}`
                                  : lastMsg.locationData
                                  ? '📍 GPS pickup pin'
                                  : lastMsg.text}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#94A3B8', flexShrink: 0, paddingLeft: '4px' }}>
                              <CheckCheck size={11} color="#3B82F6" />
                              <span>{lastMsg.timestamp}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Direct & Hotline Channels */}
          {(channelFilterTab === 'all' || channelFilterTab === 'direct') && (
            <div style={{ paddingTop: '8px' }}>
              <div style={{ padding: '4px 8px 6px', fontSize: '10.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94A3B8' }}>
                {t('Dedicated Hotlines & SOS', 'সরাসরি হটলাইন ও এসওএস', lang)}
              </div>

              {filteredDirectChannels.map((c) => {
                const isSelected = selectedChannelId === c.id;
                const msgs = chatMessages.filter(m => m.requisitionId === c.id);
                const lastMsg = msgs[msgs.length - 1];
                const IconComponent = c.icon;
                const isSos = c.id === 'emergency_sos';

                return (
                  <div
                    key={c.id}
                    onClick={() => handleSelectChannel(c.id)}
                    className={`fleet-chat-channel-card ${isSelected ? 'active' : ''}`}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <div className={`fleet-channel-avatar ${isSos ? 'sos' : c.id === 'broadcast' ? 'broadcast' : 'hotline'}`}>
                          <IconComponent size={20} />
                        </div>
                        <span className={`fleet-presence-dot ${isSos ? 'red' : 'green'}`} />
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                          <h4
                            style={{
                              margin: 0,
                              fontSize: '12.5px',
                              fontWeight: 800,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              color: isSelected ? 'var(--brand-crimson, #A51C30)' : undefined
                            }}
                          >
                            {c.name}
                          </h4>

                          {isSelected ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', borderRadius: '9999px', background: isSos ? '#DC2626' : 'var(--brand-crimson, #A51C30)', padding: '2px 8px', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', color: '#FFFFFF', flexShrink: 0 }}>
                              Active
                            </span>
                          ) : (
                            <span style={{ padding: '2px 8px', borderRadius: '9999px', fontSize: '9px', fontWeight: 800, background: isSos ? '#FEE2E2' : '#EFF6FF', color: isSos ? '#DC2626' : '#1D4ED8', flexShrink: 0 }}>
                              {c.badge}
                            </span>
                          )}
                        </div>

                        <div style={{ marginTop: '2px', fontSize: '11px', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {c.sub}
                        </div>

                        {lastMsg && (
                          <div style={{ marginTop: '6px', paddingTop: '4px', borderTop: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: '#64748B' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>
                              <strong style={{ color: 'var(--brand-slate-700)', flexShrink: 0 }}>
                                {lastMsg.senderName.split(' ')[0]}:
                              </strong>
                              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lastMsg.text}</span>
                            </div>
                            <span style={{ fontSize: '10px', color: '#94A3B8', flexShrink: 0, paddingLeft: '4px' }}>{lastMsg.timestamp}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </aside>

      {/* ══════════════════════════════════════════════════════════════
          COLUMN 2: LIVE CONVERSATION STREAM (ALWAYS VISIBLE ON DESKTOP)
          ══════════════════════════════════════════════════════════════ */}
      <section
        className="fleet-chat-main-section"
        style={{
          display: mobileActiveView === 'inbox' ? undefined : 'flex',
        }}
      >
        {/* Thread Header Bar */}
        <div className="fleet-chat-main-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
            <button
              onClick={() => setMobileActiveView('inbox')}
              style={{
                borderRadius: '8px',
                border: '1px solid var(--brand-slate-200, #E2E8F0)',
                padding: '6px',
                background: 'transparent',
                cursor: 'pointer',
                display: 'none'
              }}
              className="fleet-mobile-back-btn"
            >
              <ArrowLeft size={16} />
            </button>

            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--brand-slate-900, #0F172A)', display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {currentRequisition ? (
                    <>
                      <Car size={18} style={{ color: '#A51C30', flexShrink: 0 }} />
                      <span>{currentRequisition.to.split(',')[0]} (Trip #{currentRequisition.id})</span>
                    </>
                  ) : currentDirectChannel ? (
                    <>
                      <currentDirectChannel.icon size={18} style={{ color: '#2563EB', flexShrink: 0 }} />
                      <span>{currentDirectChannel.name}</span>
                    </>
                  ) : (
                    <span>Coordination Desk</span>
                  )}
                </h3>

                {currentRequisition && (
                  <span className={`fleet-status-badge ${statusMeta(currentRequisition.status, lang).cls}`}>
                    {statusMeta(currentRequisition.status, lang).label}
                  </span>
                )}
              </div>

              {/* Subtitle Telemetry */}
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentRequisition ? (
                  <span>
                    Vehicle: <strong style={{ color: 'var(--brand-slate-800)' }}>{currentRequisition.assignedVehiclePlate || 'Awaiting Allocation'}</strong> • Driver: <strong style={{ color: 'var(--brand-slate-800)' }}>{currentRequisition.assignedDriverName || 'Pending'}</strong> • Passenger: <strong style={{ color: 'var(--brand-slate-800)' }}>{currentRequisition.requesterName}</strong>
                  </span>
                ) : (
                  <span>{currentDirectChannel?.sub}</span>
                )}
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {currentRequisition?.assignedDriverPhone && (
              <button
                onClick={() => triggerDirectCall(
                  currentRequisition.assignedDriverName || 'Driver',
                  `Assigned Driver • ${currentRequisition.assignedVehiclePlate || 'Duty Car'}`,
                  currentRequisition.assignedDriverPhone || EMERGENCY_PHONE
                )}
                className="trip-chat-btn-call"
                title="VoIP Audio Call with Driver"
              >
                <PhoneCall size={14} />
                <span>{t('Call Driver', 'কল চালক', lang)}</span>
              </button>
            )}

            {currentRequisition && (
              <button
                onClick={() => setActiveDrawer(activeDrawer === 'radar' ? 'none' : 'radar')}
                className="trip-chat-tool-btn"
                style={{
                  background: activeDrawer === 'radar' ? '#EFF6FF' : undefined,
                  borderColor: activeDrawer === 'radar' ? '#3B82F6' : undefined,
                  color: activeDrawer === 'radar' ? '#1D4ED8' : undefined,
                }}
                title="Toggle Live Route & GPS Radar"
              >
                <Compass size={15} style={{ color: '#2563EB' }} />
                <span>{t('Live Radar', 'লাইভ রাডার', lang)}</span>
              </button>
            )}

            {currentRequisition && (
              <button
                onClick={() => setActiveDrawer(activeDrawer === 'dossier' ? 'none' : 'dossier')}
                className="trip-chat-tool-btn"
                style={{
                  background: activeDrawer === 'dossier' ? '#0F172A' : undefined,
                  color: activeDrawer === 'dossier' ? '#FFFFFF' : undefined,
                }}
                title="Toggle Trip Details & Gate Pass"
              >
                <FileText size={15} />
                <span>{t('Dossier', 'চালান তথ্য', lang)}</span>
              </button>
            )}
          </div>
        </div>

        {/* ─── TRI-PARTY MISSION ROSTER & LIFECYCLE BANNER ─── */}
        {currentRequisition && (
          <div className="trip-chat-roster-bar">
            <div className="trip-chat-roster-pills">
              <span className="trip-chat-roster-tag">
                <Users size={14} style={{ color: '#2563EB' }} />
                <span>{t('Tri-Party Mission Roster:', 'ত্রি-পক্ষীয় রুম:', lang)}</span>
              </span>

              {/* 1. Requesting Employee */}
              <div className="trip-chat-presence-chip">
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3B82F6', flexShrink: 0 }} />
                <span className="trip-chat-presence-name">{currentRequisition.requesterName}</span>
                <span className="trip-chat-presence-role staff">Staff Pax</span>
              </div>

              {/* 2. Assigned Driver */}
              <div className="trip-chat-presence-chip">
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: currentRequisition.assignedDriverName ? '#10B981' : '#F59E0B',
                  flexShrink: 0
                }} />
                <span className="trip-chat-presence-name">
                  {currentRequisition.assignedDriverName || t('Awaiting Driver', 'চালক অপেক্ষমান', lang)}
                </span>
                <span className="trip-chat-presence-role driver">Duty Driver</span>
              </div>

              {/* 3. Vehicle Admin */}
              <div className="trip-chat-presence-chip">
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366F1', flexShrink: 0 }} />
                <span className="trip-chat-presence-name">Md. Kamruzzaman</span>
                <span className="trip-chat-presence-role admin">Dispatch Admin</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: '#059669', flexShrink: 0 }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
              <span>{t('Active 3-Way Frequency', 'সক্রিয় ফ্রিকোয়েন্সি', lang)}</span>
            </div>
          </div>
        )}

        {/* ─── MESSAGE FEED VIEWPORT ─── */}
        <div
          ref={streamScrollRef}
          className="trip-chat-stream"
        >
          {/* Day Divider */}
          <div className="trip-chat-day-divider">
            <span className="trip-chat-day-pill">
              TODAY • OFFICIAL DISPATCH LOG
            </span>
          </div>

          {activeConversationMessages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--brand-slate-400, #94A3B8)' }}>
              <MessageSquare size={44} style={{ margin: '0 auto 10px', opacity: 0.6 }} />
              <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--brand-slate-700, #334155)' }}>
                {t('No messages in this frequency yet', 'এই চ্যানেলে এখনও কোনো বার্তা নেই', lang)}
              </div>
              <p style={{ fontSize: '12px', marginTop: '4px', color: 'var(--brand-slate-500, #64748B)' }}>
                {isReadOnlyBroadcast
                  ? t('Central Transport announcements and fleet advisories will appear here.', 'কেন্দ্রীয় পরিবহন বিভাগের নির্দেশনা ও ঘোষণা এখানে দেখতে পাবেন।', lang)
                  : t('Send a coordination update or check-in to begin dispatch conversation.', 'কথোপকথন শুরু করতে একটি বার্তা পাঠান বা স্ট্যাটাস আপডেট দিন।', lang)}
              </p>
            </div>
          ) : (
            activeConversationMessages.map((m) => {
              const isMine = m.senderRole === activePersona;
              const isDriverMsg = m.senderRole === 'driver';
              const isAdminMsg = m.senderRole === 'admin';
              const isSystem = m.senderRole === 'system' || m.messageType === 'system_event';

              // System Event Pills
              if (isSystem) {
                return (
                  <div key={m.id} style={{ display: 'flex', justifyContent: 'center', margin: '6px 0' }}>
                    <div className="trip-chat-system-pill">
                      <ShieldCheck size={14} style={{ color: '#2563EB' }} />
                      <span>{m.actionLabel || m.text}</span>
                      <span style={{ opacity: 0.7 }}>• {m.timestamp}</span>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={m.id}
                  className={`trip-chat-row ${isMine ? 'mine' : 'theirs'}`}
                >
                  {/* Incoming Sender Avatar */}
                  {!isMine && (
                    <div className={`trip-chat-avatar ${isDriverMsg ? 'driver' : isAdminMsg ? 'admin' : 'staff'}`}>
                      {initials(m.senderName)}
                    </div>
                  )}

                  <div className={`trip-chat-msg-column ${isMine ? 'mine' : 'theirs'}`}>
                    {/* Sender Label for Incoming */}
                    {!isMine && (
                      <div className="trip-chat-sender-header">
                        <span className="trip-chat-sender-title">{m.senderName}</span>
                        <span className={`trip-chat-role-badge ${isDriverMsg ? 'driver' : isAdminMsg ? 'admin' : 'staff'}`}>
                          {isDriverMsg ? 'Driver' : isAdminMsg ? 'Dispatch' : 'Staff'}
                        </span>
                        <span className="trip-chat-timestamp">{m.timestamp}</span>
                      </div>
                    )}

                    {/* Rich Toll Voucher Card */}
                    {m.messageType === 'toll_claim' && m.tollData ? (
                      <div className="trip-chat-toll-card">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #FEF3C7', paddingBottom: '6px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 900, color: '#B45309', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Receipt size={16} />
                            <span>HIGHWAY TOLL VOUCHER</span>
                          </span>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            fontSize: '10px',
                            fontWeight: 800,
                            background: m.tollData.approved ? '#D1FAE5' : '#FEF3C7',
                            color: m.tollData.approved ? '#047857' : '#B45309'
                          }}>
                            {m.tollData.approved ? '✓ Approved' : '⏳ Pending Audit'}
                          </span>
                        </div>

                        <div className="trip-chat-toll-grid">
                          <div>
                            <span style={{ fontSize: '10px', color: 'var(--brand-slate-400)', display: 'block' }}>Plaza Name:</span>
                            <strong style={{ color: 'var(--brand-slate-900)' }}>{m.tollData.tollName}</strong>
                          </div>
                          <div>
                            <span style={{ fontSize: '10px', color: 'var(--brand-slate-400)', display: 'block' }}>Amount:</span>
                            <span style={{ fontSize: '14px', fontWeight: 900, color: '#059669' }}>৳{m.tollData.amount}</span>
                          </div>
                          <div>
                            <span style={{ fontSize: '10px', color: 'var(--brand-slate-400)', display: 'block' }}>Slip Voucher:</span>
                            <span style={{ fontFamily: 'monospace', fontSize: '11px' }}>{m.tollData.receiptNo}</span>
                          </div>
                          <div>
                            <span style={{ fontSize: '10px', color: 'var(--brand-slate-400)', display: 'block' }}>Cost Center:</span>
                            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#2563EB' }}>
                              {currentRequisition?.costCenter || 'CC-SALES-DHAKA-102'}
                            </span>
                          </div>
                        </div>

                        {/* RBAC: ONLY ADMIN CAN APPROVE */}
                        {activePersona === 'admin' && !m.tollData.approved && (
                          <div style={{ paddingTop: '6px', borderTop: '1px solid #FEF3C7', display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => approveTollExpense(m.id, m.requisitionId, personaName)}
                              style={{
                                padding: '6px 14px',
                                borderRadius: '10px',
                                background: '#059669',
                                color: '#FFFFFF',
                                fontWeight: 800,
                                fontSize: '12px',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                            >
                              <Check size={14} />
                              <span>Approve ৳{m.tollData.amount} Claim</span>
                            </button>
                          </div>
                        )}

                        {activePersona !== 'admin' && !m.tollData.approved && (
                          <div style={{ fontSize: '11px', fontStyle: 'italic', color: '#B45309' }}>
                            Awaiting Transport Supervisor authorization.
                          </div>
                        )}
                      </div>
                    ) : m.messageType === 'location_share' && m.locationData ? (
                      /* Rich Location Pin Card */
                      <div className="trip-chat-location-card">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#2563EB', fontWeight: 800, fontSize: '12px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <MapPin size={16} />
                            <span>PASSENGER PICKUP PIN</span>
                          </span>
                          <button
                            onClick={() => setActiveDrawer('radar')}
                            style={{ fontSize: '11px', fontWeight: 800, color: '#2563EB', border: 'none', background: 'transparent', cursor: 'pointer', textDecoration: 'underline' }}
                          >
                            View Radar ➔
                          </button>
                        </div>
                        <div style={{ fontWeight: 800, fontSize: '13px', color: 'var(--brand-slate-900)' }}>
                          {m.locationData.title}
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--brand-slate-600)' }}>
                          {m.locationData.address}
                        </div>
                        {m.locationData.coordinates && (
                          <div className="trip-chat-gps-badge">
                            GPS: {m.locationData.coordinates}
                          </div>
                        )}
                      </div>
                    ) : m.messageType === 'voice_note' && m.voiceData ? (
                      /* Playable Voice Note Bubble */
                      <div className={`trip-chat-voice-bubble ${isMine ? 'mine' : 'theirs'}`}>
                        <button
                          onClick={() => setPlayingVoiceId(playingVoiceId === m.id ? null : m.id)}
                          className="trip-chat-voice-play-btn"
                        >
                          {playingVoiceId === m.id ? <Pause size={15} /> : <Play size={15} style={{ marginLeft: '2px' }} />}
                        </button>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', padding: '2px 0' }}>
                            {[40, 75, 50, 90, 60, 80, 45, 95, 30, 65].map((h, i) => (
                              <span
                                key={i}
                                style={{
                                  width: '3px',
                                  borderRadius: '9999px',
                                  height: `${Math.max(4, (h / 100) * 16)}px`,
                                  background: isMine ? 'rgba(255, 255, 255, 0.85)' : '#94A3B8',
                                  display: 'inline-block'
                                }}
                              />
                            ))}
                          </div>
                          <div style={{ fontSize: '10px', marginTop: '2px', display: 'flex', justifyContent: 'space-between', opacity: 0.85 }}>
                            <span>Voice Note ({m.voiceData.duration})</span>
                            <span style={{ fontWeight: 800 }}>1.0x</span>
                          </div>
                        </div>
                      </div>
                    ) : m.messageType === 'attachment' && m.attachmentData ? (
                      /* Document Attachment Card */
                      <div className={`trip-chat-bubble ${isMine ? 'mine' : 'theirs'}`} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          background: isMine ? 'rgba(255, 255, 255, 0.2)' : '#EFF6FF',
                          color: isMine ? '#FFFFFF' : '#2563EB',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <FileText size={18} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 800, fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {m.attachmentData.fileName}
                          </div>
                          <div style={{ fontSize: '10px', opacity: 0.8 }}>{m.attachmentData.fileSize} • Gate Pass</div>
                        </div>
                      </div>
                    ) : (
                      /* Standard Speech Bubble */
                      <div className={`trip-chat-bubble ${isMine ? 'mine' : 'theirs'}`}>
                        <div style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>
                        <div className="trip-chat-bubble-footer">
                          <span>{m.timestamp}</span>
                          {isMine && <CheckCheck size={13} color="#FFFFFF" />}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Typing Indicator */}
          {isTypingUser && (
            <div className="trip-chat-typing-pill">
              <span style={{ display: 'inline-flex', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#A51C30', display: 'inline-block' }} />
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#A51C30', display: 'inline-block' }} />
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#A51C30', display: 'inline-block' }} />
              </span>
              <span>{isTypingUser} is typing...</span>
            </div>
          )}
        </div>

        {/* ─── ROLE PERSONA SWITCHER BAR ─── */}
        <div className="trip-chat-persona-bar">
          <div className="trip-chat-persona-controls">
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-slate-500, #64748B)' }}>
              {t('Testing Persona:', 'প্রেরক মোড:', lang)}
            </span>
            <div className="trip-chat-persona-group">
              <button
                type="button"
                onClick={() => setActivePersona('employee')}
                className={`trip-chat-persona-btn ${activePersona === 'employee' ? 'active-employee' : ''}`}
              >
                👤 Staff (Tanvir)
              </button>
              <button
                type="button"
                onClick={() => setActivePersona('driver')}
                className={`trip-chat-persona-btn ${activePersona === 'driver' ? 'active-driver' : ''}`}
              >
                🚗 Driver (Shahidul)
              </button>
              <button
                type="button"
                onClick={() => setActivePersona('admin')}
                className={`trip-chat-persona-btn ${activePersona === 'admin' ? 'active-admin' : ''}`}
              >
                🛡️ Admin (Kamruzzaman)
              </button>
            </div>
          </div>

          <span style={{ fontSize: '10.5px', color: 'var(--brand-slate-400, #94A3B8)' }}>
            Press <strong>Enter</strong> to send • <strong>Shift+Enter</strong> for newline
          </span>
        </div>

        {/* Role-Specific Quick Reply Suggestion Chips */}
        {!isReadOnlyBroadcast && (
          <div className="trip-chat-quick-bar">
            {smartChips.map((chip, idx) => {
              const IconComp = chip.icon;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    setMessageText(chip.text);
                    composerTextareaRef.current?.focus();
                  }}
                  className="trip-chat-quick-pill"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <IconComp size={14} style={{ color: '#94A3B8' }} />
                  <span>{chip.text}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* ─── REAL COMPOSER BAR ─── */}
        <div className="trip-chat-composer">
          {isReadOnlyBroadcast ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderRadius: '12px', background: '#F1F5F9', padding: '12px', fontSize: '12px', color: '#64748B' }}>
              <Lock size={16} style={{ color: '#94A3B8' }} />
              <span>{t('Fleet Broadcast is read-only. Only Central Transport Admins can post announcements.', 'এই চ্যানেলটি শুধুমাত্র প্রশাসকদের ঘোষণার জন্য সংরক্ষিত।', lang)}</span>
            </div>
          ) : isRecordingVoice ? (
            <div className="trip-chat-recording-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#E11D48', display: 'inline-block' }} />
                <span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 900, color: '#BE123C' }}>
                  Recording audio dispatch... 0:{recordSeconds < 10 ? '0' : ''}{recordSeconds}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => setIsRecordingVoice(false)}
                  style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: 'transparent', fontSize: '12px', fontWeight: 700, color: '#475569', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendVoiceNote}
                  style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', background: '#A51C30', color: '#FFFFFF', fontSize: '12px', fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Send size={13} />
                  <span>Send Voice Note</span>
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
              {/* Action Buttons: Pin, Toll, Voice */}
              {currentRequisition && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingBottom: '2px', flexShrink: 0 }}>
                  <button
                    onClick={handleShareLocationPin}
                    className="trip-chat-tool-btn"
                    title={t('Share Current GPS Pickup Pin', 'জিপিএস লোকেশন পিন পাঠান', lang)}
                  >
                    <MapPin size={15} style={{ color: '#2563EB' }} />
                    <span>{t('Pin', 'পিন', lang)}</span>
                  </button>

                  <button
                    onClick={() => setActiveDrawer('toll')}
                    className="trip-chat-tool-btn"
                    title={t('Upload Highway Toll Voucher', 'টোল স্লিপ দাবি করুন', lang)}
                  >
                    <Receipt size={15} style={{ color: '#D97706' }} />
                    <span>{t('Toll Slip', 'টোল', lang)}</span>
                  </button>

                  <button
                    onClick={() => setIsRecordingVoice(true)}
                    className="trip-chat-tool-btn"
                    title="Record Voice Note"
                  >
                    <Mic size={15} style={{ color: '#E11D48' }} />
                  </button>
                </div>
              )}

              {/* Expanding Input Textarea */}
              <div style={{ flex: 1, position: 'relative' }}>
                <textarea
                  ref={composerTextareaRef}
                  rows={1}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    selectedChannelId === 'emergency_sos'
                      ? t('Report highway emergency, breakdown or incident...', 'জরুরি সহায়তা চেয়ে বার্তা দিন...', lang)
                      : selectedChannelId === 'broadcast'
                      ? t('Broadcast announcement to all fleet drivers and vehicles...', 'সকল যানবাহনের জন্য ঘোষণা লিখুন...', lang)
                      : t(`Type message as ${personaName.split(' ')[0]}...`, `বার্তা লিখুন...`, lang)
                  }
                  className="fleet-chat-composer-textarea"
                />
              </div>

              {/* Send Button */}
              <button
                onClick={() => handleSendMessage()}
                disabled={!messageText.trim()}
                className="trip-chat-btn-send"
              >
                <span>{t('Send', 'পাঠান', lang)}</span>
                <Send size={14} />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          COLUMN 3: SLIDE-OVER INSPECTION DRAWERS
          ══════════════════════════════════════════════════════════════ */}
      {/* 1. Live GPS Radar Drawer */}
      {activeDrawer === 'radar' && currentRequisition && (
        <aside className="fleet-chat-drawer">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--brand-slate-200)', paddingBottom: '8px', marginBottom: '14px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#2563EB' }}>
              <Compass size={16} />
              <span>{t('Live Route Radar HUD', 'লাইভ রুট রাডার', lang)}</span>
            </span>
            <button onClick={() => setActiveDrawer('none')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94A3B8' }}>
              <X size={16} />
            </button>
          </div>

          {/* Telemetry KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px', marginBottom: '14px' }}>
            <div className="fleet-hud-card">
              <span style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#94A3B8' }}>SPEED TELEMETRY</span>
              <span style={{ fontSize: '18px', fontWeight: 900, color: '#2563EB', display: 'block', margin: '2px 0' }}>42 km/h</span>
              <span style={{ fontSize: '10.5px', color: '#059669', fontWeight: 600 }}>Normal Corridor</span>
            </div>
            <div className="fleet-hud-card">
              <span style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#94A3B8' }}>FUEL STATUS</span>
              <span style={{ fontSize: '18px', fontWeight: 900, color: '#059669', display: 'block', margin: '2px 0' }}>82%</span>
              <span style={{ fontSize: '10.5px', color: '#64748B' }}>Octane 95</span>
            </div>
          </div>

          {/* Route Visualizer */}
          <div className="fleet-hud-card" style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 800, fontSize: '12px', marginBottom: '8px' }}>
              <span>Transit Corridor</span>
              <span style={{ color: '#2563EB' }}>64% Completed</span>
            </div>

            <div style={{ height: '8px', width: '100%', borderRadius: '9999px', background: '#F1F5F9', overflow: 'hidden', marginBottom: '12px' }}>
              <div style={{ height: '100%', background: '#2563EB', borderRadius: '9999px', width: '64%' }} />
            </div>

            <div style={{ borderLeft: '2px solid #2563EB', paddingLeft: '12px', fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <span style={{ fontWeight: 800, display: 'block' }}>Origin:</span>
                <span style={{ color: '#64748B' }}>{currentRequisition.from}</span>
              </div>
              <div>
                <span style={{ fontWeight: 800, color: '#2563EB', display: 'block' }}>Current Position:</span>
                <span style={{ color: 'var(--brand-slate-700)' }}>Approaching Jatrabari Flyover Exit (45 km/h)</span>
              </div>
              <div>
                <span style={{ fontWeight: 800, display: 'block' }}>Destination:</span>
                <span style={{ color: '#64748B' }}>{currentRequisition.to}</span>
              </div>
            </div>
          </div>

          {/* Quick Hotline Call */}
          <button
            onClick={() => triggerDirectCall(
              currentRequisition.assignedDriverName || 'Driver',
              `Assigned Driver • ${currentRequisition.assignedVehiclePlate || 'Duty Car'}`,
              currentRequisition.assignedDriverPhone || EMERGENCY_PHONE
            )}
            className="trip-chat-btn-call"
            style={{ width: '100%', justifyContent: 'center', height: '38px' }}
          >
            <PhoneCall size={16} />
            <span>VoIP Call Driver</span>
          </button>
        </aside>
      )}

      {/* 2. Mission Dossier Drawer */}
      {activeDrawer === 'dossier' && currentRequisition && (
        <aside className="fleet-chat-drawer">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--brand-slate-200)', paddingBottom: '8px', marginBottom: '14px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <FileText size={16} style={{ color: '#2563EB' }} />
              <span>{t('Mission Dossier', 'মিশন চালান তথ্য', lang)}</span>
            </span>
            <button onClick={() => setActiveDrawer('none')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94A3B8' }}>
              <X size={16} />
            </button>
          </div>

          {/* Route Summary */}
          <div className="fleet-hud-card" style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontFamily: 'monospace', fontWeight: 800 }}>#{currentRequisition.id}</span>
              <span className={`fleet-status-badge ${statusMeta(currentRequisition.status, lang).cls}`}>
                {statusMeta(currentRequisition.status, lang).label}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, fontSize: '12px', marginTop: '4px' }}>
              <MapPin size={15} style={{ color: '#A51C30', flexShrink: 0 }} />
              <span>{currentRequisition.to}</span>
            </div>
            <div style={{ paddingLeft: '21px', fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
              From: {currentRequisition.from.split(',')[0]}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #F1F5F9', marginTop: '10px', paddingTop: '8px', fontSize: '11px', fontWeight: 600, color: '#64748B' }}>
              <span>Dept: {currentRequisition.departureTime}</span>
              <span>{currentRequisition.passengersCount} Pax</span>
            </div>
          </div>

          {/* Assigned Driver Profile */}
          {currentRequisition.assignedDriverName ? (
            <div className="fleet-hud-card" style={{ background: '#ECFDF5', borderColor: '#A7F3D0', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#059669', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '13px', flexShrink: 0 }}>
                  {initials(currentRequisition.assignedDriverName)}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: '12.5px', color: '#064E3B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {currentRequisition.assignedDriverName}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '11px', color: '#047857' }}>
                    {currentRequisition.assignedVehiclePlate || 'Duty Car Allocated'}
                  </div>
                </div>
              </div>

              <button
                onClick={() => triggerDirectCall(
                  currentRequisition.assignedDriverName || 'Driver',
                  `Assigned Driver • ${currentRequisition.assignedVehiclePlate || 'Duty Car'}`,
                  currentRequisition.assignedDriverPhone || EMERGENCY_PHONE
                )}
                className="trip-chat-btn-call"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <PhoneCall size={14} />
                <span>Call Driver ({currentRequisition.assignedDriverPhone?.slice(-4) || 'Dial'})</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '12px', border: '1px solid #FDE68A', background: '#FFFBEB', padding: '12px', fontSize: '12px', color: '#B45309', marginBottom: '14px' }}>
              <Clock size={16} style={{ color: '#D97706', flexShrink: 0 }} />
              <span>Awaiting driver assignment by transport supervisor</span>
            </div>
          )}

          {/* Security Gate Pass */}
          <button
            onClick={() => onNavigateToTripPass?.(currentRequisition)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              borderRadius: '12px',
              border: '1px solid #BFDBFE',
              background: '#EFF6FF',
              padding: '10px',
              fontSize: '12px',
              fontWeight: 800,
              color: '#1D4ED8',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <QrCode size={16} />
            <span>{t('View Security Gate Pass', 'গেট পাস প্রদর্শন', lang)}</span>
          </button>
        </aside>
      )}

      {/* 3. Highway Toll Claim Drawer */}
      {activeDrawer === 'toll' && currentRequisition && (
        <aside className="fleet-chat-drawer">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--brand-slate-200)', paddingBottom: '8px', marginBottom: '14px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#D97706' }}>
              <Receipt size={16} />
              <span>Submit Highway Toll</span>
            </span>
            <button onClick={() => setActiveDrawer('none')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94A3B8' }}>
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmitTollClaim} style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '4px' }}>Toll Plaza Name</label>
              <select
                value={tollPlaza}
                onChange={(e) => setTollPlaza(e.target.value)}
                style={{ width: '100%', borderRadius: '10px', border: '1px solid #CBD5E1', padding: '10px', fontSize: '12px', background: '#FFFFFF', boxSizing: 'border-box' }}
              >
                <option value="Mayor Hanif Flyover">Mayor Hanif Flyover</option>
                <option value="Second Buriganga Bridge">Second Buriganga Bridge (Babubazar)</option>
                <option value="Padma Bridge Highway Toll">Padma Bridge Toll Plaza</option>
                <option value="Meghna Ghat Bridge">Meghna Ghat Bridge Toll</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '4px' }}>Amount (৳ BDT)</label>
              <input
                type="number"
                value={tollAmount}
                onChange={(e) => setTollAmount(e.target.value)}
                style={{ width: '100%', borderRadius: '10px', border: '1px solid #CBD5E1', padding: '10px', fontSize: '12px', fontWeight: 800, background: '#FFFFFF', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '4px' }}>Voucher / Receipt Slip No.</label>
              <input
                type="text"
                value={tollSlipNo}
                onChange={(e) => setTollSlipNo(e.target.value)}
                style={{ width: '100%', borderRadius: '10px', border: '1px solid #CBD5E1', padding: '10px', fontSize: '12px', fontFamily: 'monospace', background: '#FFFFFF', boxSizing: 'border-box' }}
              />
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                borderRadius: '12px',
                background: '#D97706',
                color: '#FFFFFF',
                padding: '10px',
                fontSize: '12px',
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(217, 119, 6, 0.3)',
                marginTop: '6px'
              }}
            >
              Post Toll Claim to Chat Feed
            </button>
          </form>
        </aside>
      )}

      {/* VoIP Audio Phone Call Modal */}
      <DriverCallModal
        isOpen={showCallModal}
        onClose={() => setShowCallModal(false)}
        calleeName={activeCallee.name}
        calleeRole={activeCallee.role}
        calleePhone={activeCallee.phone}
        lang={lang}
      />
    </div>
  );
}
