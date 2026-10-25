import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useFleetStore, VehicleRequisition } from '../../store/fleetStore';
import { t } from '../../types';
import { showToast } from '../../App';
import {
  MessageSquare, Send, Car, MapPin, Clock, ShieldCheck, CheckCircle2,
  Radio, Search, Navigation, QrCode, Receipt, Check, PhoneCall,
  AlertTriangle, CheckCheck, X, Fuel, ArrowLeft, Lock, Users,
  Mic, Play, Pause, FileText, CornerDownLeft, Volume2,
  Compass, Phone, Activity
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
        cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
      };
    case 'in_transit':
      return {
        label: t('En Route', 'পথে', lang),
        cls: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
      };
    case 'assigned':
      return {
        label: t('Assigned', 'বরাদ্দকৃত', lang),
        cls: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800'
      };
    case 'pending':
      return {
        label: t('Pending', 'অপেক্ষমান', lang),
        cls: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
      };
    default:
      return {
        label: status.replace(/_/g, ' ').toUpperCase(),
        cls: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
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
    <div className="flex h-full w-full min-h-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
      {/* ══════════════════════════════════════════════════════════════
          COLUMN 1: MESSAGES DIRECTORY / CHAT INBOX (FIXED 340px ON DESKTOP)
          ══════════════════════════════════════════════════════════════ */}
      <aside
        className={`flex flex-col border-r border-slate-200 bg-slate-50/90 dark:border-slate-800 dark:bg-slate-950/70 ${
          mobileActiveView === 'conversation' ? 'max-md:hidden' : 'flex'
        }`}
        style={{ width: '340px', minWidth: '340px', maxWidth: '340px', flexShrink: 0 }}
      >
        {/* App Bar / Current User Capsule */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black text-white shadow-xs"
              style={{ background: 'var(--brand-crimson, #A51C30)' }}
            >
              {initials(personaName)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[13px] font-extrabold text-slate-900 dark:text-white">
                <span className="truncate">{personaName.replace(/\s*\(.*\)/, '')}</span>
                <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-emerald-500" title="Active on Fleet Frequency" />
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                <span>{activePersona === 'employee' ? 'Staff Passenger' : activePersona === 'driver' ? 'Duty Driver' : 'Central Dispatch'}</span>
              </div>
            </div>
          </div>

          <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {activePersona.toUpperCase()}
          </span>
        </div>

        {/* Filter Tabs (All, Trips, Direct Hotlines) */}
        <div className="border-b border-slate-200 bg-slate-100/70 px-3 py-2 dark:border-slate-800 dark:bg-slate-900/60">
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-200/80 p-0.5 dark:bg-slate-800">
            <button
              onClick={() => setChannelFilterTab('all')}
              className={`rounded-lg py-1 text-center text-xs font-bold transition ${
                channelFilterTab === 'all'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              {t('All', 'সকল', lang)} ({relevantRequisitions.length + directChannels.length})
            </button>
            <button
              onClick={() => setChannelFilterTab('trips')}
              className={`rounded-lg py-1 text-center text-xs font-bold transition ${
                channelFilterTab === 'trips'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              🚗 {t('Trips', 'ট্রিপ', lang)} ({relevantRequisitions.length})
            </button>
            <button
              onClick={() => setChannelFilterTab('direct')}
              className={`rounded-lg py-1 text-center text-xs font-bold transition ${
                channelFilterTab === 'direct'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              🛡️ {t('Hotlines', 'হটলাইন', lang)} ({directChannels.length})
            </button>
          </div>
        </div>

        {/* Real-time Search Box */}
        <div className="border-b border-slate-200 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900">
          <div className="relative flex items-center">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('Search trips, drivers, plates...', 'ট্রিপ, চালক বা গাড়ি খুঁজুন...', lang)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-8 text-xs text-slate-900 placeholder:text-slate-400 transition focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-700/80 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-800"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2.5 text-slate-400 hover:text-slate-600">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Conversation Items List */}
        <div className="flex-1 space-y-1.5 overflow-y-auto p-2">
          {/* Trip Rooms (Tri-Party: Driver ↔ Staff ↔ Admin) */}
          {(channelFilterTab === 'all' || channelFilterTab === 'trips') && (
            <div>
              <div className="flex items-center justify-between px-2 pb-1 pt-1.5 text-[10.5px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                <span>{t('Active Duty Trips (3-Party)', 'সক্রিয় ডিউটি ট্রিপ চ্যানেল', lang)}</span>
                <span className="rounded bg-blue-50 px-1.5 text-[10px] font-bold text-blue-600 dark:bg-blue-950">Tri-Party</span>
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
                    className={`cursor-pointer rounded-2xl border p-3 text-xs transition ${
                      isSelected
                        ? 'border-l-4 border-l-[#A51C30] border-rose-300 bg-gradient-to-r from-rose-50/90 to-white shadow-xs dark:border-rose-900 dark:from-rose-950/40 dark:to-slate-900'
                        : 'border-slate-200/80 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/70 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">#{r.id}</span>
                        <span className="text-[10px] text-slate-400">•</span>
                        <span className="max-w-[130px] truncate font-bold text-slate-800 dark:text-slate-100">
                          {r.to.split(',')[0]}
                        </span>
                      </div>
                      <span className={`rounded-full border px-2 py-0.5 text-[9px] font-extrabold ${sm.cls}`}>
                        {sm.label}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1 truncate">
                        <Car size={12} className="shrink-0 text-emerald-600" />
                        <span className="truncate font-medium text-slate-700 dark:text-slate-300">
                          {r.assignedDriverName ? r.assignedDriverName.replace(/\s*\(.*\)/, '') : 'Awaiting Driver'}
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="truncate">{r.requesterName.split(' ')[0]}</span>
                      </div>
                      {lastMsg && <span className="shrink-0 text-[10px] text-slate-400">{lastMsg.timestamp}</span>}
                    </div>

                    {lastMsg && (
                      <div className="mt-1.5 truncate border-t border-slate-100 pt-1.5 text-[11px] text-slate-500 dark:border-slate-800 dark:text-slate-400">
                        <strong className="text-slate-700 dark:text-slate-200">{lastMsg.senderName.split(' ')[0]}:</strong> {lastMsg.text}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Direct & Hotline Channels */}
          {(channelFilterTab === 'all' || channelFilterTab === 'direct') && (
            <div className="pt-2">
              <div className="px-2 pb-1 pt-1 text-[10.5px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {t('Dedicated Hotlines & SOS', 'সরাসরি হটলাইন ও এসওএস', lang)}
              </div>

              {filteredDirectChannels.map((c) => {
                const isSelected = selectedChannelId === c.id;
                const msgs = chatMessages.filter(m => m.requisitionId === c.id);
                const lastMsg = msgs[msgs.length - 1];
                const IconComponent = c.icon;

                return (
                  <div
                    key={c.id}
                    onClick={() => handleSelectChannel(c.id)}
                    className={`mb-1.5 cursor-pointer rounded-2xl border p-3 text-xs transition ${
                      isSelected
                        ? c.id === 'emergency_sos'
                          ? 'border-l-4 border-l-rose-600 border-rose-300 bg-rose-50/90 shadow-xs dark:border-rose-800 dark:bg-rose-950/40'
                          : 'border-l-4 border-l-indigo-600 border-indigo-300 bg-indigo-50/90 shadow-xs dark:border-indigo-800 dark:bg-indigo-950/40'
                        : 'border-slate-200/80 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/70'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                        c.id === 'emergency_sos'
                          ? 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400'
                          : c.id === 'broadcast'
                          ? 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
                          : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400'
                      }`}>
                        <IconComponent className="h-4 w-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="truncate text-[12.5px] font-bold text-slate-900 dark:text-white">{c.name}</span>
                          <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                            c.id === 'emergency_sos'
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950'
                          }`}>
                            {c.badge}
                          </span>
                        </div>
                        <div className="mt-0.5 truncate text-[10.5px] text-slate-500">{c.sub}</div>
                      </div>
                    </div>

                    {lastMsg && (
                      <div className="mt-1.5 truncate border-t border-slate-100 pt-1.5 text-[11px] text-slate-500 dark:border-slate-800 dark:text-slate-400">
                        <strong className="text-slate-700 dark:text-slate-200">{lastMsg.senderName.split(' ')[0]}:</strong> {lastMsg.text}
                      </div>
                    )}
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
        className={`relative flex min-w-0 flex-1 flex-col bg-white dark:bg-slate-900 ${
          mobileActiveView === 'inbox' ? 'max-md:hidden' : 'flex'
        }`}
      >
        {/* Thread Header Bar */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 py-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button
              onClick={() => setMobileActiveView('inbox')}
              className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 md:hidden dark:border-slate-700"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="flex items-center gap-2 truncate text-sm font-extrabold text-slate-900 sm:text-base dark:text-white">
                  {currentRequisition ? (
                    <>
                      <Car className="h-4 w-4 shrink-0 text-rose-600" />
                      <span>{currentRequisition.to.split(',')[0]} (Trip #{currentRequisition.id})</span>
                    </>
                  ) : currentDirectChannel ? (
                    <>
                      <currentDirectChannel.icon className="h-4 w-4 shrink-0 text-blue-600" />
                      <span>{currentDirectChannel.name}</span>
                    </>
                  ) : (
                    <span>Coordination Desk</span>
                  )}
                </h3>

                {currentRequisition && (
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusMeta(currentRequisition.status, lang).cls}`}>
                    {statusMeta(currentRequisition.status, lang).label}
                  </span>
                )}
              </div>

              {/* Subtitle Telemetry */}
              <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                {currentRequisition ? (
                  <span>
                    Vehicle: <strong className="text-slate-800 dark:text-slate-200">{currentRequisition.assignedVehiclePlate || 'Awaiting Allocation'}</strong> • Driver: <strong className="text-slate-800 dark:text-slate-200">{currentRequisition.assignedDriverName || 'Pending'}</strong> • Passenger: <strong className="text-slate-800 dark:text-slate-200">{currentRequisition.requesterName}</strong>
                  </span>
                ) : (
                  <span>{currentDirectChannel?.sub}</span>
                )}
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex shrink-0 items-center gap-2">
            {currentRequisition?.assignedDriverPhone && (
              <button
                onClick={() => triggerDirectCall(
                  currentRequisition.assignedDriverName || 'Driver',
                  `Assigned Driver • ${currentRequisition.assignedVehiclePlate || 'Duty Car'}`,
                  currentRequisition.assignedDriverPhone || EMERGENCY_PHONE
                )}
                className="flex h-9 items-center gap-1.5 rounded-xl bg-emerald-600 px-3 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-500"
                title="VoIP Audio Call with Driver"
              >
                <PhoneCall className="h-3.5 w-3.5" />
                <span className="hidden md:inline">{t('Call Driver', 'কল চালক', lang)}</span>
              </button>
            )}

            {currentRequisition && (
              <button
                onClick={() => setActiveDrawer(activeDrawer === 'radar' ? 'none' : 'radar')}
                className={`flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition ${
                  activeDrawer === 'radar'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                }`}
                title="Toggle Live Route & GPS Radar"
              >
                <Compass className="h-3.5 w-3.5 text-blue-600" />
                <span className="hidden md:inline">{t('Live Radar', 'লাইভ রাডার', lang)}</span>
              </button>
            )}

            {currentRequisition && (
              <button
                onClick={() => setActiveDrawer(activeDrawer === 'dossier' ? 'none' : 'dossier')}
                className={`flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition ${
                  activeDrawer === 'dossier'
                    ? 'border-slate-900 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                }`}
                title="Toggle Trip Details & Gate Pass"
              >
                <FileText className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t('Dossier', 'চালান তথ্য', lang)}</span>
              </button>
            )}
          </div>
        </div>

        {/* ─── TRI-PARTY MISSION ROSTER & LIFECYCLE BANNER ─── */}
        {currentRequisition && (
          <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-slate-50/90 px-5 py-2.5 text-xs dark:border-slate-800 dark:bg-slate-950/60">
            <div className="flex items-center gap-3 overflow-x-auto scrollbar-none">
              <span className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                <Users className="h-3.5 w-3.5 text-blue-600" />
                <span>{t('Tri-Party Mission Roster:', 'ত্রি-পক্ষীয় রুম:', lang)}</span>
              </span>

              {/* 1. Requesting Employee */}
              <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1 shadow-2xs dark:border-slate-700 dark:bg-slate-800">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                <span className="max-w-[120px] truncate text-[11px] font-bold text-slate-900 dark:text-white">{currentRequisition.requesterName}</span>
                <span className="rounded bg-blue-50 px-1 text-[9.5px] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">Staff Pax</span>
              </div>

              {/* 2. Assigned Driver */}
              <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1 shadow-2xs dark:border-slate-700 dark:bg-slate-800">
                <span className={`h-2 w-2 rounded-full ${currentRequisition.assignedDriverName ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                <span className="max-w-[120px] truncate text-[11px] font-bold text-slate-900 dark:text-white">
                  {currentRequisition.assignedDriverName || t('Awaiting Driver', 'চালক অপেক্ষমান', lang)}
                </span>
                <span className="rounded bg-emerald-50 px-1 text-[9.5px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">Duty Driver</span>
              </div>

              {/* 3. Vehicle Admin */}
              <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1 shadow-2xs dark:border-slate-700 dark:bg-slate-800">
                <span className="h-2 w-2 rounded-full bg-indigo-500" />
                <span className="text-[11px] font-bold text-slate-900 dark:text-white">Md. Kamruzzaman</span>
                <span className="rounded bg-indigo-50 px-1 text-[9.5px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400">Dispatch Admin</span>
              </div>
            </div>

            <div className="ml-3 hidden shrink-0 items-center gap-1.5 text-[11px] font-bold text-emerald-600 lg:flex dark:text-emerald-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              <span>{t('Active 3-Way Frequency', 'সক্রিয় ফ্রিকোয়েন্সি', lang)}</span>
            </div>
          </div>
        )}

        {/* ─── MESSAGE FEED VIEWPORT ─── */}
        <div
          ref={streamScrollRef}
          className="flex-1 space-y-4 overflow-y-auto bg-slate-50/60 p-4 sm:p-6 dark:bg-slate-950/40"
          style={{ backgroundImage: 'radial-gradient(rgba(148, 163, 184, 0.08) 1px, transparent 0)', backgroundSize: '24px 24px' }}
        >
          {/* Day Divider */}
          <div className="my-3 flex justify-center">
            <span className="rounded-full border border-slate-200 bg-white px-3.5 py-1 text-[10.5px] font-bold text-slate-500 shadow-2xs dark:border-slate-700 dark:bg-slate-800">
              TODAY • OFFICIAL DISPATCH LOG
            </span>
          </div>

          {activeConversationMessages.length === 0 ? (
            <div className="py-20 text-center text-slate-400">
              <MessageSquare className="mx-auto mb-2 h-12 w-12 text-slate-300 dark:text-slate-600" />
              <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                {t('No messages in this frequency yet', 'এই চ্যানেলে এখনও কোনো বার্তা নেই', lang)}
              </div>
              <p className="mt-1 text-xs text-slate-500">
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
              const isStaffMsg = m.senderRole === 'employee';
              const isSystem = m.senderRole === 'system' || m.messageType === 'system_event';

              // System Event Pills (Gate clearance, odometer, etc.)
              if (isSystem) {
                return (
                  <div key={m.id} className="my-2 flex justify-center">
                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-300/60 bg-slate-200/90 px-4 py-1.5 text-xs text-slate-700 shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                      <span className="font-semibold">{m.actionLabel || m.text}</span>
                      <span className="text-[11px] text-slate-400">• {m.timestamp}</span>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={m.id}
                  className={`flex w-full ${isMine ? 'justify-end' : 'justify-start items-start gap-2.5'}`}
                >
                  {/* Incoming Sender Avatar */}
                  {!isMine && (
                    <div
                      className={`h-8 w-8 rounded-xl flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-xs mt-1 ${
                        isDriverMsg ? 'bg-emerald-600' : isAdminMsg ? 'bg-indigo-600' : 'bg-blue-600'
                      }`}
                    >
                      {initials(m.senderName)}
                    </div>
                  )}

                  <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-[82%] sm:max-w-[75%]`}>
                    {/* Sender Label for Incoming */}
                    {!isMine && (
                      <div className="mb-1 flex items-center gap-1.5 px-1 text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        <span className="text-slate-900 dark:text-white">{m.senderName}</span>
                        <span className={`rounded-full border px-2 py-0.2 text-[9px] font-extrabold ${
                          isDriverMsg
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : isAdminMsg
                            ? 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                            : 'border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                        }`}>
                          {isDriverMsg ? 'Driver' : isAdminMsg ? 'Dispatch' : 'Staff'}
                        </span>
                        <span className="font-normal text-[9.5px] text-slate-400">{m.timestamp}</span>
                      </div>
                    )}

                    {/* Rich Toll Voucher Card */}
                    {m.messageType === 'toll_claim' && m.tollData ? (
                      <div className="w-full space-y-2.5 rounded-2xl border-2 border-amber-300 bg-white p-3.5 shadow-sm dark:border-amber-700 dark:bg-slate-800">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 dark:border-slate-700">
                          <span className="flex items-center gap-1.5 text-xs font-black text-amber-700 dark:text-amber-400">
                            <Receipt className="h-4 w-4" />
                            <span>HIGHWAY TOLL VOUCHER</span>
                          </span>
                          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                            m.tollData.approved
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}>
                            {m.tollData.approved ? '✓ Approved' : '⏳ Pending Audit'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-xs dark:border-slate-800 dark:bg-slate-900/60">
                          <div>
                            <span className="block text-[10px] font-medium text-slate-400">Plaza Name:</span>
                            <span className="font-bold text-slate-900 dark:text-white">{m.tollData.tollName}</span>
                          </div>
                          <div>
                            <span className="block text-[10px] font-medium text-slate-400">Amount:</span>
                            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">৳{m.tollData.amount}</span>
                          </div>
                          <div>
                            <span className="block text-[10px] font-medium text-slate-400">Slip Voucher:</span>
                            <span className="font-mono text-slate-700 dark:text-slate-300 text-[11px]">{m.tollData.receiptNo}</span>
                          </div>
                          <div>
                            <span className="block text-[10px] font-medium text-slate-400">Cost Center:</span>
                            <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                              {currentRequisition?.costCenter || 'CC-SALES-DHAKA-102'}
                            </span>
                          </div>
                        </div>

                        {/* RBAC: ONLY VEHICLE ADMIN CAN APPROVE TOLLS */}
                        {activePersona === 'admin' && !m.tollData.approved && (
                          <div className="flex justify-end border-t border-slate-100 pt-1.5 dark:border-slate-700">
                            <button
                              onClick={() => approveTollExpense(m.id, m.requisitionId, personaName)}
                              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-500"
                            >
                              <Check className="h-4 w-4" />
                              <span>Approve ৳{m.tollData.amount} Claim</span>
                            </button>
                          </div>
                        )}

                        {activePersona !== 'admin' && !m.tollData.approved && (
                          <div className="text-[10.5px] italic text-amber-700 dark:text-amber-400">
                            Awaiting Transport Supervisor authorization.
                          </div>
                        )}
                      </div>
                    ) : m.messageType === 'location_share' && m.locationData ? (
                      /* Rich Location Pin Card */
                      <div className="w-full space-y-2 rounded-2xl border border-blue-200 bg-white p-3.5 shadow-sm dark:border-blue-800 dark:bg-slate-800">
                        <div className="flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400">
                          <span className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>PASSENGER PICKUP PIN</span>
                          </span>
                          <button
                            onClick={() => setActiveDrawer('radar')}
                            className="text-[11px] font-extrabold text-blue-600 hover:underline"
                          >
                            View Radar ➔
                          </button>
                        </div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                          {m.locationData.title}
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-300">
                          {m.locationData.address}
                        </div>
                        {m.locationData.coordinates && (
                          <div className="inline-block rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 font-mono text-[11px] font-bold text-blue-700 dark:border-blue-900 dark:bg-blue-950/60 dark:text-blue-300">
                            GPS: {m.locationData.coordinates}
                          </div>
                        )}
                      </div>
                    ) : m.messageType === 'voice_note' && m.voiceData ? (
                      /* Voice Note Audio Bubble */
                      <div
                        className={`w-fit min-w-[180px] p-3 rounded-2xl flex items-center gap-2.5 shadow-xs ${
                          isMine
                            ? 'text-white rounded-br-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-tl-xs'
                        }`}
                        style={isMine ? { background: 'linear-gradient(135deg, #A51C30 0%, #871424 100%)' } : {}}
                      >
                        <button
                          onClick={() => setPlayingVoiceId(playingVoiceId === m.id ? null : m.id)}
                          className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold shadow-2xs transition ${
                            isMine ? 'bg-white text-rose-800' : 'bg-rose-600 text-white'
                          }`}
                        >
                          {playingVoiceId === m.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-0.5 py-0.5">
                            {[40, 75, 50, 90, 60, 80, 45, 95, 30, 65].map((h, i) => (
                              <span
                                key={i}
                                className={`w-1 rounded-full transition-all ${
                                  isMine ? 'bg-white/80' : 'bg-slate-400'
                                } ${playingVoiceId === m.id ? 'animate-pulse' : ''}`}
                                style={{ height: `${Math.max(4, (h / 100) * 16)}px` }}
                              />
                            ))}
                          </div>
                          <div className={`mt-0.5 flex items-center justify-between text-[10px] ${isMine ? 'text-white/80' : 'text-slate-400'}`}>
                            <span>Voice Note ({m.voiceData.duration})</span>
                            <span className="font-bold">1.0x</span>
                          </div>
                        </div>
                      </div>
                    ) : m.messageType === 'attachment' && m.attachmentData ? (
                      /* Document Attachment Bubble */
                      <div
                        className={`w-fit min-w-[200px] p-3 rounded-2xl flex items-center gap-2.5 shadow-xs ${
                          isMine
                            ? 'text-white rounded-br-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-tl-xs'
                        }`}
                        style={isMine ? { background: 'linear-gradient(135deg, #A51C30 0%, #871424 100%)' } : {}}
                      >
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold ${
                          isMine ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-600 dark:bg-blue-950'
                        }`}>
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-xs font-bold">{m.attachmentData.fileName}</div>
                          <div className={`text-[10px] ${isMine ? 'text-white/80' : 'text-slate-400'}`}>{m.attachmentData.fileSize} • Gate Pass</div>
                        </div>
                      </div>
                    ) : (
                      /* Standard Chat Bubble (w-fit, never clips, proper margins) */
                      <div
                        className={`w-fit min-w-[100px] max-w-full px-4 py-2.5 text-[12.5px] leading-relaxed shadow-xs break-words ${
                          isMine
                            ? 'rounded-2xl rounded-br-xs text-white shadow-sm mr-2'
                            : 'rounded-2xl rounded-tl-xs border border-slate-200 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'
                        }`}
                        style={isMine ? { background: 'linear-gradient(135deg, #A51C30 0%, #871424 100%)' } : {}}
                      >
                        <div className="whitespace-pre-wrap">{m.text}</div>
                        <div className={`mt-1 flex items-center justify-end gap-1 text-[9.5px] ${isMine ? 'text-white/85' : 'text-slate-400'}`}>
                          <span>{m.timestamp}</span>
                          {isMine && <CheckCheck className="h-3.5 w-3.5 text-white" />}
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
            <div className="flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs italic text-slate-500 shadow-xs dark:border-slate-700 dark:bg-slate-800">
              <span className="flex gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-rose-600" style={{ animationDelay: '0ms' }} />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-rose-600" style={{ animationDelay: '150ms' }} />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-rose-600" style={{ animationDelay: '300ms' }} />
              </span>
              <span>{isTypingUser} is typing...</span>
            </div>
          )}
        </div>

        {/* ─── ROLE PERSONA SWITCHER BAR (INTERACTIVE RBAC TESTING) ─── */}
        <div className="flex shrink-0 items-center justify-between border-t border-slate-200 bg-slate-100/90 px-5 py-2 text-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500">
              {t('Testing Persona:', 'প্রেরক মোড:', lang)}
            </span>
            <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setActivePersona('employee')}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                  activePersona === 'employee'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
                }`}
              >
                👤 Staff (Tanvir)
              </button>
              <button
                type="button"
                onClick={() => setActivePersona('driver')}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                  activePersona === 'driver'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
                }`}
              >
                🚗 Driver (Shahidul)
              </button>
              <button
                type="button"
                onClick={() => setActivePersona('admin')}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                  activePersona === 'admin'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
                }`}
              >
                🛡️ Admin (Kamruzzaman)
              </button>
            </div>
          </div>

          <span className="hidden text-[10.5px] text-slate-400 md:inline">
            Press <strong>Enter</strong> to send • <strong>Shift+Enter</strong> for newline
          </span>
        </div>

        {/* Role-Specific Quick Reply Suggestion Chips */}
        {!isReadOnlyBroadcast && (
          <div className="flex shrink-0 gap-2 overflow-x-auto border-t border-slate-200 bg-slate-50 px-5 py-2 scrollbar-none dark:border-slate-800 dark:bg-slate-900">
            {smartChips.map((chip, idx) => {
              const IconComp = chip.icon;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    setMessageText(chip.text);
                    composerTextareaRef.current?.focus();
                  }}
                  className="flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  <IconComp className="h-3.5 w-3.5 text-slate-400" />
                  <span>{chip.text}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* ─── REAL COMPOSER BAR (VOICE, LOCATION, TOLL & INPUT) ─── */}
        <div className="shrink-0 border-t border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900">
          {isReadOnlyBroadcast ? (
            <div className="flex items-center justify-center gap-2 rounded-xl bg-slate-100 p-3 text-xs text-slate-500 dark:bg-slate-800">
              <Lock className="h-4 w-4 text-slate-400" />
              <span>{t('Fleet Broadcast is read-only. Only Central Transport Admins can post announcements.', 'এই চ্যানেলটি শুধুমাত্র প্রশাসকদের ঘোষণার জন্য সংরক্ষিত।', lang)}</span>
            </div>
          ) : isRecordingVoice ? (
            /* Voice Note Recording State */
            <div className="flex items-center justify-between rounded-xl border border-rose-300 bg-rose-50 p-2.5 dark:border-rose-900 dark:bg-rose-950/40">
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 animate-ping rounded-full bg-rose-600" />
                <span className="font-mono text-xs font-black text-rose-700 dark:text-rose-300">
                  Recording audio dispatch... 0:{recordSeconds < 10 ? '0' : ''}{recordSeconds}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsRecordingVoice(false)}
                  className="rounded-lg px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-rose-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendVoiceNote}
                  className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-rose-500"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Send Voice Note</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-end gap-2">
              {/* Action Buttons: Pin, Toll, Voice */}
              {currentRequisition && (
                <div className="flex shrink-0 items-center gap-1 pb-0.5">
                  <button
                    onClick={handleShareLocationPin}
                    className="flex h-10 items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 text-xs font-bold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    title={t('Share Current GPS Pickup Pin', 'জিপিএস লোকেশন পিন পাঠান', lang)}
                  >
                    <MapPin className="h-4 w-4 text-blue-600" />
                    <span className="hidden md:inline">{t('Pin', 'পিন', lang)}</span>
                  </button>

                  <button
                    onClick={() => setActiveDrawer('toll')}
                    className="flex h-10 items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 text-xs font-bold text-slate-700 transition hover:border-amber-300 hover:bg-amber-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    title={t('Upload Highway Toll Voucher', 'টোল স্লিপ দাবি করুন', lang)}
                  >
                    <Receipt className="h-4 w-4 text-amber-600" />
                    <span className="hidden md:inline">{t('Toll Slip', 'টোল', lang)}</span>
                  </button>

                  <button
                    onClick={() => setIsRecordingVoice(true)}
                    className="flex h-10 items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 text-xs font-bold text-slate-700 transition hover:border-rose-300 hover:bg-rose-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    title="Record Voice Note"
                  >
                    <Mic className="h-4 w-4 text-rose-600" />
                  </button>
                </div>
              )}

              {/* Expanding Input Textarea */}
              <div className="relative flex-1">
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
                  className="max-h-32 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs leading-relaxed text-slate-900 placeholder:text-slate-400 transition focus:border-rose-600 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/90 dark:text-white"
                />
              </div>

              {/* Send Button */}
              <button
                onClick={() => handleSendMessage()}
                disabled={!messageText.trim()}
                className="flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl px-4 text-xs font-bold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #A51C30 0%, #871424 100%)' }}
              >
                <span>{t('Send', 'পাঠান', lang)}</span>
                <Send className="h-3.5 w-3.5" />
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
        <aside className="flex w-80 shrink-0 flex-col space-y-4 overflow-y-auto border-l border-slate-200 bg-slate-50/95 p-4 shadow-xl lg:w-88 dark:border-slate-800 dark:bg-slate-950/70">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2 dark:border-slate-800">
            <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
              <Compass className="h-4 w-4" />
              <span>{t('Live Route Radar HUD', 'লাইভ রুট রাডার', lang)}</span>
            </span>
            <button onClick={() => setActiveDrawer('none')} className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Telemetry KPIs */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
              <span className="block text-[10px] font-bold text-slate-400">SPEED TELEMETRY</span>
              <span className="text-lg font-black text-blue-600">42 km/h</span>
              <span className="block text-[10.5px] text-emerald-600 font-semibold">Normal Corridor</span>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
              <span className="block text-[10px] font-bold text-slate-400">FUEL STATUS</span>
              <span className="text-lg font-black text-emerald-600">82%</span>
              <span className="block text-[10.5px] text-slate-500">Octane 95</span>
            </div>
          </div>

          {/* Route Visualizer */}
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900 text-xs">
            <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
              <span>Transit Corridor</span>
              <span className="text-blue-600">64% Completed</span>
            </div>

            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden dark:bg-slate-800">
              <div className="h-full bg-blue-600 rounded-full" style={{ width: '64%' }} />
            </div>

            <div className="space-y-2 border-l-2 border-blue-600 pl-3 pt-1 text-[11px]">
              <div>
                <span className="block font-bold text-slate-900 dark:text-white">Origin:</span>
                <span className="text-slate-500">{currentRequisition.from}</span>
              </div>
              <div>
                <span className="block font-bold text-blue-600">Current Position:</span>
                <span className="text-slate-700 dark:text-slate-300">Approaching Jatrabari Flyover Exit (45 km/h)</span>
              </div>
              <div>
                <span className="block font-bold text-slate-900 dark:text-white">Destination:</span>
                <span className="text-slate-500">{currentRequisition.to}</span>
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
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-500"
          >
            <PhoneCall className="h-4 w-4" />
            <span>VoIP Call Driver</span>
          </button>
        </aside>
      )}

      {/* 2. Mission Dossier Drawer */}
      {activeDrawer === 'dossier' && currentRequisition && (
        <aside className="flex w-80 shrink-0 flex-col space-y-4 overflow-y-auto border-l border-slate-200 bg-slate-50/95 p-4 shadow-xl lg:w-88 dark:border-slate-800 dark:bg-slate-950/70">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2 dark:border-slate-800">
            <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
              <FileText className="h-4 w-4 text-blue-600" />
              <span>{t('Mission Dossier', 'মিশন চালান তথ্য', lang)}</span>
            </span>
            <button onClick={() => setActiveDrawer('none')} className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Route Summary */}
          <div className="space-y-2.5 rounded-2xl border border-slate-200 bg-white p-3.5 text-xs shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-slate-900 dark:text-white">#{currentRequisition.id}</span>
              <span className={`rounded-full border px-2 py-0.5 text-[9.5px] font-bold ${statusMeta(currentRequisition.status, lang).cls}`}>
                {statusMeta(currentRequisition.status, lang).label}
              </span>
            </div>

            <div className="flex items-center gap-1.5 pt-1 font-bold text-slate-900 dark:text-slate-100">
              <MapPin className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{currentRequisition.to}</span>
            </div>
            <div className="pl-5 text-[11px] text-slate-500">
              From: {currentRequisition.from.split(',')[0]}
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-2 text-[11px] font-semibold text-slate-600 dark:border-slate-800 dark:text-slate-400">
              <span>Dept: {currentRequisition.departureTime}</span>
              <span>{currentRequisition.passengersCount} Pax</span>
            </div>
          </div>

          {/* Assigned Driver Profile */}
          {currentRequisition.assignedDriverName ? (
            <div className="space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3.5 shadow-2xs dark:border-emerald-800 dark:bg-emerald-950/30">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-xs font-black text-white shadow-sm">
                  {initials(currentRequisition.assignedDriverName)}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-xs font-bold text-emerald-950 dark:text-emerald-200">
                    {currentRequisition.assignedDriverName}
                  </div>
                  <div className="truncate text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
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
                className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-500"
              >
                <PhoneCall className="h-3.5 w-3.5" />
                <span>Call Driver ({currentRequisition.assignedDriverPhone?.slice(-4) || 'Dial'})</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
              <Clock className="h-4 w-4 shrink-0 text-amber-600" />
              <span>Awaiting driver assignment by transport supervisor</span>
            </div>
          )}

          {/* Security Gate Pass */}
          <button
            onClick={() => onNavigateToTripPass?.(currentRequisition)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 py-2.5 text-xs font-bold text-blue-700 shadow-2xs transition hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300"
          >
            <QrCode className="h-4 w-4 text-blue-600" />
            <span>{t('View Security Gate Pass', 'গেট পাস প্রদর্শন', lang)}</span>
          </button>
        </aside>
      )}

      {/* 3. Highway Toll Claim Drawer */}
      {activeDrawer === 'toll' && currentRequisition && (
        <aside className="flex w-80 shrink-0 flex-col space-y-4 overflow-y-auto border-l border-slate-200 bg-slate-50/95 p-4 shadow-xl lg:w-88 dark:border-slate-800 dark:bg-slate-950/70">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2 dark:border-slate-800">
            <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
              <Receipt className="h-4 w-4" />
              <span>Submit Highway Toll</span>
            </span>
            <button onClick={() => setActiveDrawer('none')} className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700">
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmitTollClaim} className="space-y-3 text-xs">
            <div>
              <label className="mb-1 block text-[11px] font-bold text-slate-700 dark:text-slate-300">Toll Plaza Name</label>
              <select
                value={tollPlaza}
                onChange={(e) => setTollPlaza(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="Mayor Hanif Flyover">Mayor Hanif Flyover</option>
                <option value="Second Buriganga Bridge">Second Buriganga Bridge (Babubazar)</option>
                <option value="Padma Bridge Highway Toll">Padma Bridge Toll Plaza</option>
                <option value="Meghna Ghat Bridge">Meghna Ghat Bridge Toll</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold text-slate-700 dark:text-slate-300">Amount (৳ BDT)</label>
              <input
                type="number"
                value={tollAmount}
                onChange={(e) => setTollAmount(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white font-bold"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold text-slate-700 dark:text-slate-300">Voucher / Receipt Slip No.</label>
              <input
                type="text"
                value={tollSlipNo}
                onChange={(e) => setTollSlipNo(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-amber-600 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-amber-500"
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
