import React, { useState, useEffect, useRef } from 'react';
import { VehicleRequisition, useFleetStore, TripChatMessage } from '../../store/fleetStore';
import { t } from '../../types';
import { showToast } from '../../App';
import {
  MessageSquare, Send, X, Users, Phone, Car, MapPin,
  Clock, Shield, User, CheckCircle2, Sparkles, PhoneCall,
  Receipt, Check, CheckCheck, UserCheck, ShieldCheck,
  Navigation, Info, Mic, Play, Pause, FileText, ExternalLink,
  ChevronRight, CornerDownLeft, Volume2
} from 'lucide-react';
import DriverCallModal from './DriverCallModal';

interface TripChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  requisition: VehicleRequisition | null;
  userRole: 'employee' | 'driver' | 'admin';
  lang: 'en' | 'bn';
  onOpenFullDesk?: (req: VehicleRequisition) => void;
}

const EMERGENCY_PHONE = '+880 1711-229944';

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

export default function TripChatModal({
  isOpen,
  onClose,
  requisition,
  userRole,
  lang,
  onOpenFullDesk,
}: TripChatModalProps) {
  const { chatMessages, sendChatMessage, approveTollExpense } = useFleetStore();

  // Interactive Persona Switcher (Allows testing all 3 parties in real-time)
  const [activePersona, setActivePersona] = useState<'employee' | 'driver' | 'admin'>(
    userRole === 'driver' ? 'driver' : userRole === 'admin' ? 'admin' : 'employee'
  );

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState<string | null>(null);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showTollForm, setShowTollForm] = useState(false);
  const [tollPlaza, setTollPlaza] = useState('Mayor Hanif Flyover');
  const [tollAmount, setTollAmount] = useState('260');
  const [tollSlipNo, setTollSlipNo] = useState(`TOL-2026-${Math.floor(1000 + Math.random() * 9000)}`);

  // Audio Voice Player state
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Authenticated Persona Profile
  const personaName = activePersona === 'employee'
    ? requisition?.requesterName || 'Tanvir Ahmed'
    : activePersona === 'driver'
    ? requisition?.assignedDriverName || 'Md. Shahidul Islam (Driver)'
    : 'Md. Kamruzzaman (Transport Admin)';

  const personaRole = activePersona;

  // Filter messages for current requisition
  const reqMessages = requisition
    ? chatMessages.filter(m => m.requisitionId === requisition.id)
    : [];

  // Voice recording timer
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

  // Scroll to bottom on new message or typing
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [reqMessages.length, isOpen, isTyping, showTollForm, isRecordingVoice]);

  if (!isOpen || !requisition) return null;

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    sendChatMessage(
      requisition.id,
      personaRole,
      personaName,
      text,
      { messageType: 'text' }
    );
    setInputText('');

    // Simulate realistic counterpart response
    simulateCounterpartResponse(text, requisition);
  };

  const simulateCounterpartResponse = (userText: string, req: VehicleRequisition) => {
    const lower = userText.toLowerCase();
    const driverName = req.assignedDriverName || 'Md. Shahidul Islam';
    const vehiclePlate = req.assignedVehiclePlate || 'DHAKA METRO GHA-13-8821';

    if (activePersona === 'employee') {
      setTimeout(() => {
        setIsTyping(`${driverName} (Driver)`);
      }, 800);

      setTimeout(() => {
        setIsTyping(null);
        let reply = '';
        if (lower.includes('where') || lower.includes('location') || lower.includes('gate') || lower.includes('porch')) {
          reply = `Ji Tanvir Sir, I am at Gate-1 porch with ${vehiclePlate}. AC is running at 21°C. Please come down whenever ready.`;
        } else if (lower.includes('5 min') || lower.includes('down') || lower.includes('delay') || lower.includes('wait')) {
          reply = `Noted Sir, take your time. I am parked safely in the bay with drinking water bottles ready.`;
        } else if (lower.includes('ac') || lower.includes('cool')) {
          reply = `Cabin temperature is cooled to 20°C Sir. Ready for highway transit.`;
        } else if (lower.includes('toll') || lower.includes('flyover')) {
          reply = `Ji Sir, I have paid the Mayor Hanif Flyover toll (৳260) with electronic pass and uploaded the voucher for clearance.`;
        } else {
          reply = `Assalamu Alaikum Tanvir Sir, message received. Vehicle ${vehiclePlate} is ready for official duty.`;
        }

        sendChatMessage(req.id, 'driver', `${driverName} (Driver)`, reply, { messageType: 'text' });
      }, 2100);
    } else if (activePersona === 'driver') {
      setTimeout(() => {
        setIsTyping('Tanvir Ahmed (Passenger)');
      }, 800);

      setTimeout(() => {
        setIsTyping(null);
        sendChatMessage(req.id, 'employee', 'Tanvir Ahmed', 'Thank you Shahidul Bhai. I am bringing down the documents now.', { messageType: 'text' });
      }, 2000);
    } else {
      setTimeout(() => {
        setIsTyping(`${driverName} (Driver)`);
      }, 800);

      setTimeout(() => {
        setIsTyping(null);
        sendChatMessage(req.id, 'driver', `${driverName} (Driver)`, `Ji Kamruzzaman Sir, instruction received. Following designated corridor safely.`, { messageType: 'text' });
      }, 2100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Share Location Pin
  const handleShareLocationPin = () => {
    const locTitle = activePersona === 'employee' ? 'Bashundhara Corporate HQ Reception' : 'Central Dispatch Bay Gate #1';
    const locAddress = activePersona === 'employee'
      ? 'Plot-3, Block-G, Umme Kulsum Road, Bashundhara R/A, Dhaka'
      : 'BOGCL Central Transport Fleet Yard Gate #1, Baridhara';

    sendChatMessage(requisition.id, personaRole, personaName, `Shared Pickup Location Pin: ${locTitle}`, {
      messageType: 'location_share',
      locationData: { title: locTitle, address: locAddress, coordinates: '23.8166° N, 90.4328° E' },
    });
    showToast(t('📍 Location pin shared in mission chat', 'লোকেশন পিন পাঠানো হয়েছে', lang), 'success');
  };

  // Submit Toll Claim
  const handleSubmitTollClaim = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(tollAmount) || 0;
    if (amountNum <= 0) {
      showToast(t('Please enter valid toll amount', 'সঠিক টোলের পরিমাণ লিখুন', lang), 'info');
      return;
    }

    sendChatMessage(
      requisition.id,
      personaRole,
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

    setShowTollForm(false);
    setTollSlipNo(`TOL-2026-${Math.floor(1000 + Math.random() * 9000)}`);
    showToast(t(
      `✓ Toll voucher claimed: ${tollPlaza} (৳${amountNum}). Awaiting Admin audit.`,
      `✓ টোল ভাউচার দাখিল সম্পন্ন: ৳${amountNum}`,
      lang
    ), 'success');
  };

  // Send Voice Note Simulation
  const handleSendVoiceNote = () => {
    setIsRecordingVoice(false);
    const durationStr = `0:${recordSeconds < 10 ? '0' : ''}${recordSeconds || 12}`;
    sendChatMessage(
      requisition.id,
      personaRole,
      personaName,
      `🎙️ Audio dispatch voice note (${durationStr})`,
      {
        messageType: 'voice_note',
        voiceData: { duration: durationStr }
      }
    );
    showToast(t('Voice note sent to mission chat', 'ভয়েস বার্তা পাঠানো হয়েছে', lang), 'success');
    simulateCounterpartResponse('voice note', requisition);
  };

  const quickReplies = activePersona === 'employee'
    ? [
        t('📍 Waiting at Gate-1 porch with documents', '📍 গেট-১ এ নথিপত্র নিয়ে প্রস্তুত আছি', lang),
        t('⏳ Coming down in 5 mins from 4th floor', '⏳ ৫ মিনিটের মধ্যে নিচে নামছি', lang),
        t('❄️ Please keep AC cooling at nominal temp', '❄️ এসির তাপমাত্রা স্বাভাবিক রাখবেন', lang),
        t('🛑 Need to pick up 1 colleague at Mohakhali', '🛑 মহাখালীতে ১ জন সহকর্মীকে তুলতে হবে', lang),
      ]
    : activePersona === 'driver'
    ? [
        t('🚗 Stationed at porch canopy, car ready', '🚗 গেট-১ পোর্চে গাড়ি প্রস্তুত', lang),
        t('🛣️ Started highway transit via expressway', '🛣️ যাত্রা শুরু করেছি', lang),
        t('🧾 Uploaded flyover toll slip (৳260)', '🧾 টোল স্লিপ আপলোড করেছি', lang),
        t('✅ Arrived safely at destination terminal', '✅ গন্তব্যে পৌঁছেছি', lang),
      ]
    : [
        t('🟢 Gate clearance BOG-7729 authorized', '🟢 গেট পাস BOG-7729 অনুমোদিত', lang),
        t('⚠️ Heavy congestion on flyover, take outer bypass', '⚠️ ফ্লাইওভারে জ্যাম, আউটার বাইপাস ব্যবহার করুন', lang),
        t('⛽ Fuel voucher approved for 60L Octane', '⛽ ৬০ লিটার ফুয়েল স্লিপ অনুমোদিত', lang),
      ];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-3 sm:p-5 overflow-y-auto" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col h-[88vh] max-h-[780px] my-auto transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ─── 1. PREMIUM HEADER ─── */}
        <div className="shrink-0 px-5 py-4 border-b border-slate-200/90 dark:border-slate-800 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-600 to-rose-800 text-white flex items-center justify-center font-bold shadow-sm shrink-0">
              <Car className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base text-white truncate">
                  {t('Tri-Party Mission Coordination Desk', 'ত্রি-পক্ষীয় ট্রিপ সমন্বয় ডায়ালগ', lang)}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-400 text-slate-950 shrink-0">
                  #{requisition.id}
                </span>
              </div>
              <p className="text-xs text-slate-300 truncate mt-0.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>{requisition.from.split(',')[0]} ➔ <strong>{requisition.to.split(',')[0]}</strong></span>
                {requisition.assignedVehiclePlate && (
                  <span className="font-mono text-amber-300 ml-1">({requisition.assignedVehiclePlate})</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {requisition.assignedDriverPhone && (
              <button
                onClick={() => setShowCallModal(true)}
                className="h-8 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs"
                title="VoIP Audio Call"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('Call', 'কল', lang)}</span>
              </button>
            )}

            {onOpenFullDesk && (
              <button
                onClick={() => {
                  onClose();
                  onOpenFullDesk(requisition);
                }}
                className="h-8 px-2.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1 transition"
                title="Open full-screen communications desk"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{t('Full Desk', 'পূর্ণ ডেস্ক', lang)}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ─── 2. TRI-PARTY PRESENCE ROSTER STRIP ─── */}
        <div className="shrink-0 px-5 py-2.5 bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>{t('Live 3-Way Frequency:', '৩-পক্ষীয় লাইভ:', lang)}</span>
            </span>

            {/* 1. Requesting Employee */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
              <span className="font-bold text-slate-900 dark:text-slate-100 text-[11px] truncate max-w-[110px]">{requisition.requesterName}</span>
              <span className="text-[9px] text-blue-700 dark:text-blue-300 font-extrabold bg-blue-50 dark:bg-blue-950 px-1 rounded">Staff</span>
            </div>

            {/* 2. Assigned Driver */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <span className={`w-2 h-2 rounded-full shrink-0 ${requisition.assignedDriverName ? 'bg-emerald-500' : 'bg-amber-400'}`} />
              <span className="font-bold text-slate-900 dark:text-slate-100 text-[11px] truncate max-w-[110px]">
                {requisition.assignedDriverName ? requisition.assignedDriverName.replace(/\s*\(.*\)/, '') : 'Awaiting Driver'}
              </span>
              <span className="text-[9px] text-emerald-700 dark:text-emerald-400 font-extrabold bg-emerald-50 dark:bg-emerald-950 px-1 rounded">Driver</span>
            </div>

            {/* 3. Vehicle Admin */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
              <span className="font-bold text-slate-900 dark:text-slate-100 text-[11px]">Kamruzzaman</span>
              <span className="text-[9px] text-indigo-700 dark:text-indigo-400 font-extrabold bg-indigo-50 dark:bg-indigo-950 px-1 rounded">Admin</span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0 ml-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Connected</span>
          </div>
        </div>

        {/* ─── 3. INTERACTIVE PERSONA SWITCHER BAR (TEST ALL 3 ROLES) ─── */}
        <div className="shrink-0 px-5 py-2 bg-slate-100/80 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500">
              {t('Testing Persona:', 'প্রেরক মোড:', lang)}
            </span>
            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setActivePersona('employee')}
                className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition ${
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
                className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition ${
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
                className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition ${
                  activePersona === 'admin'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
                }`}
              >
                🛡️ Admin (Kamruzzaman)
              </button>
            </div>
          </div>

          <span className="text-[10px] text-slate-400 hidden sm:inline">
            Enter sends • Shift+Enter for newline
          </span>
        </div>

        {/* ─── 4. MESSAGES STREAM (WHATSAPP/TELEGRAM BUBBLE FEED) ─── */}
        <div
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/60 dark:bg-slate-950/40"
          style={{ backgroundImage: 'radial-gradient(rgba(148, 163, 184, 0.08) 1px, transparent 0)', backgroundSize: '24px 24px' }}
        >
          {/* Day Divider */}
          <div className="flex justify-center my-1">
            <span className="px-3 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-500 shadow-2xs">
              TODAY • OFFICIAL DISPATCH LOG
            </span>
          </div>

          {reqMessages.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <MessageSquare className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
              <div className="font-bold text-sm text-slate-700 dark:text-slate-300">{t('No messages in this trip channel yet', 'এই ট্রিপে এখনও কোনো বার্তা নেই', lang)}</div>
              <p className="text-xs text-slate-500 mt-1">{t('Coordinate pickup point, AC preferences, or baggage requirements.', 'পিকআপ স্থান ও যাত্রা সংক্রান্ত বার্তা পাঠিয়ে আলোচনা শুরু করুন।', lang)}</p>
            </div>
          ) : (
            reqMessages.map((m) => {
              const isMine = m.senderRole === activePersona;
              const isStaff = m.senderRole === 'employee';
              const isDriverMsg = m.senderRole === 'driver';
              const isAdminMsg = m.senderRole === 'admin';
              const isSystem = m.senderRole === 'system' || m.messageType === 'system_event';

              if (isSystem) {
                return (
                  <div key={m.id} className="flex justify-center my-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200/80 dark:bg-slate-800 text-[11px] text-slate-700 dark:text-slate-300 border border-slate-300/50 dark:border-slate-700 shadow-2xs">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span className="font-medium">{m.actionLabel || m.text}</span>
                      <span className="text-slate-400">• {m.timestamp}</span>
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
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-xs mt-1 ${
                        isDriverMsg ? 'bg-emerald-600' : isAdminMsg ? 'bg-indigo-600' : 'bg-blue-600'
                      }`}
                    >
                      {initials(m.senderName)}
                    </div>
                  )}

                  <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-[82%] sm:max-w-[75%]`}>
                    {/* Sender Label for Incoming */}
                    {!isMine && (
                      <div className="text-[11px] font-bold mb-1 flex items-center gap-1.5 px-1 text-slate-600 dark:text-slate-400">
                        <span className="text-slate-900 dark:text-white">{m.senderName}</span>
                        <span className={`px-2 py-0.2 rounded-full text-[9px] font-extrabold border ${
                          isDriverMsg
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200'
                            : isAdminMsg
                            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200'
                            : 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200'
                        }`}>
                          {isDriverMsg ? 'Driver' : isAdminMsg ? 'Dispatch' : 'Staff'}
                        </span>
                        <span className="text-[9.5px] text-slate-400 font-normal">{m.timestamp}</span>
                      </div>
                    )}

                    {/* Rich Toll Voucher Card */}
                    {m.messageType === 'toll_claim' && m.tollData ? (
                      <div className="w-full bg-white dark:bg-slate-800 border-2 border-amber-300 dark:border-amber-700 rounded-2xl p-3.5 shadow-xs space-y-2.5">
                        <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-700">
                          <span className="text-xs font-black text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                            <Receipt className="w-4 h-4" />
                            <span>HIGHWAY TOLL VOUCHER</span>
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                            m.tollData.approved
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          }`}>
                            {m.tollData.approved ? '✓ Approved' : '⏳ Pending Audit'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-medium">Plaza Name:</span>
                            <span className="font-bold text-slate-900 dark:text-white">{m.tollData.tollName}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-medium">Amount:</span>
                            <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">৳{m.tollData.amount}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-medium">Slip Voucher:</span>
                            <span className="font-mono text-slate-700 dark:text-slate-300 text-[11px]">{m.tollData.receiptNo}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-medium">Status:</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300 text-[11px]">
                              {m.tollData.approved ? 'Reimbursed' : 'Awaiting Audit'}
                            </span>
                          </div>
                        </div>

                        {/* RBAC: ONLY ADMIN CAN APPROVE */}
                        {activePersona === 'admin' && !m.tollData.approved && (
                          <div className="pt-1.5 border-t border-slate-100 dark:border-slate-700 flex justify-end">
                            <button
                              onClick={() => approveTollExpense(m.id, m.requisitionId, personaName)}
                              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve ৳{m.tollData.amount} Claim</span>
                            </button>
                          </div>
                        )}

                        {activePersona !== 'admin' && !m.tollData.approved && (
                          <div className="text-[10.5px] italic text-amber-700 dark:text-amber-400">
                            Awaiting Central Transport Admin authorization.
                          </div>
                        )}
                      </div>
                    ) : m.messageType === 'location_share' && m.locationData ? (
                      /* Rich Location Pin Card */
                      <div className="w-full bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 rounded-2xl p-3.5 shadow-xs space-y-2">
                        <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold text-xs">
                          <MapPin className="w-4 h-4" />
                          <span>PASSENGER PICKUP PIN</span>
                        </div>
                        <div className="font-bold text-xs text-slate-900 dark:text-white">{m.locationData.title}</div>
                        <div className="text-[11.5px] text-slate-600 dark:text-slate-300">{m.locationData.address}</div>
                        {m.locationData.coordinates && (
                          <div className="text-[10.5px] font-mono text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-900 inline-block font-bold">
                            GPS: {m.locationData.coordinates}
                          </div>
                        )}
                      </div>
                    ) : m.messageType === 'voice_note' && m.voiceData ? (
                      /* Playable Voice Note Bubble */
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
                        <div className="flex-1 min-w-0">
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
                          <div className={`text-[10px] mt-0.5 flex justify-between ${isMine ? 'text-white/80' : 'text-slate-400'}`}>
                            <span>Voice Note ({m.voiceData.duration})</span>
                            <span className="font-bold">1.0x</span>
                          </div>
                        </div>
                      </div>
                    ) : m.messageType === 'attachment' && m.attachmentData ? (
                      /* Document Attachment Card */
                      <div
                        className={`w-fit min-w-[200px] p-3 rounded-2xl flex items-center gap-2.5 shadow-xs ${
                          isMine
                            ? 'text-white rounded-br-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-tl-xs'
                        }`}
                        style={isMine ? { background: 'linear-gradient(135deg, #A51C30 0%, #871424 100%)' } : {}}
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${isMine ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-600'}`}>
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-xs truncate">{m.attachmentData.fileName}</div>
                          <div className={`text-[10px] ${isMine ? 'text-white/80' : 'text-slate-400'}`}>{m.attachmentData.fileSize} • Gate Clearance</div>
                        </div>
                      </div>
                    ) : (
                      /* Standard Speech Bubble (Fixed geometry, no clipping, w-fit) */
                      <div
                        className={`w-fit min-w-[100px] max-w-full px-4 py-2.5 rounded-2xl text-[12.5px] leading-relaxed shadow-xs break-words ${
                          isMine
                            ? 'text-white rounded-br-xs shadow-sm'
                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/90 dark:border-slate-700 rounded-tl-xs'
                        }`}
                        style={isMine ? { background: 'linear-gradient(135deg, #A51C30 0%, #871424 100%)' } : {}}
                      >
                        <div className="whitespace-pre-wrap">{m.text}</div>
                        <div className={`flex items-center gap-1 justify-end mt-1 text-[9.5px] ${isMine ? 'text-white/85' : 'text-slate-400'}`}>
                          <span>{m.timestamp}</span>
                          {isMine && <CheckCheck className="w-3.5 h-3.5 text-white" />}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {isTyping && (
            <div className="flex items-center gap-2 text-xs text-slate-500 italic bg-white dark:bg-slate-800 px-3.5 py-1.5 rounded-full shadow-2xs border border-slate-200 dark:border-slate-700 w-fit">
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
              <span>{isTyping} is typing...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ─── 5. TOLL CLAIM FORM DRAWER IN MODAL ─── */}
        {showTollForm && (
          <div className="px-5 py-3 bg-amber-50 dark:bg-amber-950/40 border-t border-amber-200 dark:border-amber-900 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-amber-600" />
                <span>Submit Official Highway Toll Slip</span>
              </span>
              <button onClick={() => setShowTollForm(false)} className="text-amber-700 hover:text-amber-950 text-xs font-bold">✕</button>
            </div>
            <form onSubmit={handleSubmitTollClaim} className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <select
                value={tollPlaza}
                onChange={(e) => setTollPlaza(e.target.value)}
                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2 text-xs text-slate-900 dark:text-white"
              >
                <option value="Mayor Hanif Flyover">Mayor Hanif Flyover</option>
                <option value="Second Buriganga Bridge">Second Buriganga Bridge</option>
                <option value="Padma Bridge Toll">Padma Bridge Toll</option>
              </select>
              <input
                type="number"
                value={tollAmount}
                onChange={(e) => setTollAmount(e.target.value)}
                placeholder="Amount ৳"
                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2 text-xs text-slate-900 dark:text-white font-bold"
              />
              <button
                type="submit"
                className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl py-2 shadow-xs transition"
              >
                Post Toll to Chat
              </button>
            </form>
          </div>
        )}

        {/* ─── 6. ROLE-SPECIFIC QUICK REPLIES ─── */}
        <div className="px-5 py-2 bg-slate-50 dark:bg-slate-900 border-t border-slate-200/90 dark:border-slate-800 flex gap-2 overflow-x-auto scrollbar-none shrink-0">
          {quickReplies.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              className="px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-slate-400 hover:bg-slate-50 transition shadow-2xs shrink-0"
            >
              <span>{q}</span>
            </button>
          ))}
        </div>

        {/* ─── 7. MODERN INPUT COMPOSER BAR ─── */}
        <div className="p-3.5 border-t border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          {isRecordingVoice ? (
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
            <div className="flex items-center gap-2">
              {/* Quick Action Tools */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={handleShareLocationPin}
                  className="h-10 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1 transition"
                  title="Share Pickup Pin"
                >
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span className="hidden sm:inline">Pin</span>
                </button>

                <button
                  onClick={() => setShowTollForm(!showTollForm)}
                  className="h-10 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-amber-50 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1 transition"
                  title="Toll Voucher"
                >
                  <Receipt className="w-4 h-4 text-amber-600" />
                  <span className="hidden sm:inline">Toll</span>
                </button>

                <button
                  onClick={() => setIsRecordingVoice(true)}
                  className="h-10 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-rose-50 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1 transition"
                  title="Voice Note"
                >
                  <Mic className="w-4 h-4 text-rose-600" />
                </button>
              </div>

              {/* Text Input */}
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  activePersona === 'employee'
                    ? t('Message driver & dispatch as Tanvir...', 'যাত্রী হিসেবে বার্তা দিন...', lang)
                    : activePersona === 'driver'
                    ? t('Message passenger & dispatch as Driver Shahidul...', 'চালক হিসেবে বার্তা দিন...', lang)
                    : t('Send official dispatch instruction as Kamruzzaman...', 'ডেসপ্যাচ নির্দেশনা দিন...', lang)
                }
                className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-rose-600 focus:bg-white transition"
              />

              {/* Send Button */}
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim()}
                className="h-10 px-4 rounded-xl text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition disabled:opacity-40 shrink-0"
                style={{ background: 'linear-gradient(135deg, #A51C30 0%, #871424 100%)' }}
              >
                <span>{t('Send', 'পাঠান', lang)}</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* VoIP Calling Modal */}
      {requisition.assignedDriverPhone && (
        <DriverCallModal
          isOpen={showCallModal}
          onClose={() => setShowCallModal(false)}
          calleeName={requisition.assignedDriverName || 'Driver'}
          calleeRole={`Assigned Driver • ${requisition.assignedVehiclePlate || 'Duty Vehicle'}`}
          calleePhone={requisition.assignedDriverPhone}
          lang={lang}
        />
      )}
    </div>
  );
}
