import React, { useState, useEffect, useRef } from 'react';
import { useFleetStore, VehicleRequisition, TripChatMessage } from '../../store/fleetStore';
import { t } from '../../types';
import { showToast } from '../../App';
import {
  MessageSquare, Send, Users, Phone, Car, MapPin,
  Clock, Shield, User, CheckCircle2, AlertOctagon, Radio,
  Search, Plus, Sparkles, Navigation, QrCode, DollarSign,
  Receipt, FileText, Check, ChevronRight, PhoneCall, AlertTriangle,
  CornerDownRight, Compass, CheckCheck, Loader2, PanelRightClose,
  PanelRightOpen, X
} from 'lucide-react';
import DriverCallModal from './DriverCallModal';

interface FleetChatCenterProps {
  userRole: 'employee' | 'admin' | 'driver';
  lang: 'en' | 'bn';
  onNavigateToTripPass?: (req: VehicleRequisition) => void;
}

export default function FleetChatCenter({
  userRole,
  lang,
  onNavigateToTripPass,
}: FleetChatCenterProps) {
  const {
    requisitions,
    vehicles,
    drivers,
    chatMessages,
    sendChatMessage,
    addTollExpense,
    approveTollExpense,
  } = useFleetStore();

  const isEmployee = userRole === 'employee';
  const isDriver = userRole === 'driver';
  const isAdmin = userRole === 'admin';

  // Strict Authenticated User Identity
  const currentUserName = isEmployee
    ? 'Tanvir Ahmed'
    : isDriver
    ? 'Md. Rafiqul Islam (Driver)'
    : 'Md. Kamruzzaman (Transport Admin)';
  const currentUserRole = isEmployee ? 'employee' : isDriver ? 'driver' : 'admin';

  // Collapsible right details panel state for responsiveness (fixing Image 2)
  const [showRightPanel, setShowRightPanel] = useState(true);

  // Filter requisitions relevant to role
  const relevantRequisitions = isEmployee
    ? requisitions.filter(r => r.requesterName.includes('Tanvir') || r.id === 'REQ-2026-441' || r.id === 'REQ-2026-435')
    : isDriver
    ? requisitions.filter(r => r.assignedDriverName?.includes('Rafiqul') || r.assignedDriverName?.includes('Shahidul') || r.id === 'REQ-2026-435' || r.id === 'REQ-2026-441')
    : requisitions;

  // Selected Channel State
  const [selectedChannelId, setSelectedChannelId] = useState<string>(
    relevantRequisitions[0]?.id || 'REQ-2026-435'
  );

  const [channelSearch, setChannelSearch] = useState('');
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState<string | null>(null);

  // Toll Claim Form State
  const [showTollForm, setShowTollForm] = useState(false);
  const [tollName, setTollName] = useState('Mayor Hanif Flyover');
  const [tollAmount, setTollAmount] = useState('260');
  const [tollReceiptNo, setTollReceiptNo] = useState(`TOL-2026-${Math.floor(1000 + Math.random() * 9000)}`);

  // Phone Call Modal State
  const [showCallModal, setShowCallModal] = useState(false);
  const [activeCallee, setActiveCallee] = useState<{ name: string; role: string; phone: string }>({
    name: 'Md. Shahidul Islam',
    role: 'Official Assigned Driver • Toyota Prado (GHA-13-8821)',
    phone: '+880 1711-229944'
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Current requisition if selectedChannelId is a trip ID
  const currentReq = requisitions.find(r => r.id === selectedChannelId);

  // Filter messages for current channel
  const activeMessages = chatMessages.filter(m => m.requisitionId === selectedChannelId);

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages.length, selectedChannelId, isTyping]);

  // Handle Send Message as Authenticated User
  const handleSendMessage = (customText?: string) => {
    const text = (customText || inputText).trim();
    if (!text) return;

    sendChatMessage(
      selectedChannelId,
      currentUserRole,
      currentUserName,
      text,
      { messageType: 'text' }
    );
    setInputText('');

    // Trigger realistic reactive simulated responses if applicable
    simulateCounterpartResponse(text, selectedChannelId);
  };

  // Realistic Automated Reactive Responses
  const simulateCounterpartResponse = (userText: string, channelId: string) => {
    const lower = userText.toLowerCase();

    if (channelId.startsWith('REQ-')) {
      const targetReq = requisitions.find(r => r.id === channelId);
      const driverName = targetReq?.assignedDriverName || 'Md. Shahidul Islam';
      const vehiclePlate = targetReq?.assignedVehiclePlate || 'DHAKA METRO GHA-13-8821';

      if (isEmployee) {
        setTimeout(() => {
          setIsTyping(`${driverName} (Driver)`);
        }, 800);

        setTimeout(() => {
          setIsTyping(null);
          let reply = '';
          if (lower.includes('where') || lower.includes('location') || lower.includes('porch') || lower.includes('gate')) {
            reply = `Ji Tanvir Sir, I am parked at Gate-1 porch by the main reception canopy with vehicle ${vehiclePlate}. AC is running at 22°C. Please come down whenever ready.`;
          } else if (lower.includes('min') || lower.includes('down') || lower.includes('delay') || lower.includes('wait')) {
            reply = `Noted Tanvir Sir, take your time. I have loaded fresh mineral water bottles in the back. Waiting safely at the porch bay.`;
          } else if (lower.includes('ac') || lower.includes('cool') || lower.includes('temp')) {
            reply = `Ji Sir, cabin temperature is cooled and fresh air filter is running. Ready for highway transit.`;
          } else if (lower.includes('toll') || lower.includes('flyover')) {
            reply = `Ji Sir, I have already paid the Mayor Hanif Flyover toll (৳260) with electronic pass and uploaded the voucher for Central Transport clearance.`;
          } else {
            reply = `Assalamu Alaikum Tanvir Sir, message received. Standing by at your service with vehicle ${vehiclePlate}.`;
          }

          sendChatMessage(
            channelId,
            'driver',
            `${driverName} (Driver)`,
            reply,
            { messageType: 'text' }
          );
        }, 2200);
      } else if (isDriver) {
        setTimeout(() => {
          setIsTyping('Tanvir Ahmed (Passenger)');
        }, 800);

        setTimeout(() => {
          setIsTyping(null);
          sendChatMessage(
            channelId,
            'employee',
            'Tanvir Ahmed',
            `Thank you Rafiqul Bhai, I have the batch test dossiers ready. We will depart in 5 minutes.`,
            { messageType: 'text' }
          );
        }, 2000);
      } else {
        setTimeout(() => {
          setIsTyping(`${driverName} (Driver)`);
        }, 800);

        setTimeout(() => {
          setIsTyping(null);
          sendChatMessage(
            channelId,
            'driver',
            `${driverName} (Driver)`,
            `Ji Kamruzzaman Sir, received instruction. Following designated highway corridor and maintaining safe speed limits.`,
            { messageType: 'text' }
          );
        }, 2200);
      }
    } else if (channelId === 'desk_direct') {
      if (isEmployee) {
        setTimeout(() => {
          setIsTyping('Md. Kamruzzaman (Transport Supervisor)');
        }, 800);

        setTimeout(() => {
          setIsTyping(null);
          sendChatMessage(
            'desk_direct',
            'admin',
            'Md. Kamruzzaman (Transport Supervisor)',
            `Assalamu Alaikum Tanvir. Central Transport Desk has logged your query. Vehicle allocation is prioritized. Feel free to contact hotline +880 1711-229944 if needed.`,
            { messageType: 'text' }
          );
        }, 2000);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Location Share
  const handleShareLocation = () => {
    const locTitle = isEmployee ? 'Bashundhara Corporate HQ Reception' : 'Central Transport Dispatch Yard';
    const locAddress = isEmployee
      ? 'Plot-3, Block-G, Umme Kulsum Road, Bashundhara R/A, Dhaka'
      : 'BOGCL Central Transport Fleet Yard Gate #1';

    sendChatMessage(
      selectedChannelId,
      currentUserRole,
      currentUserName,
      `📍 Shared Passenger Pickup Pin: ${locTitle}`,
      {
        messageType: 'location_share',
        locationData: {
          title: locTitle,
          address: locAddress,
          coordinates: '23.8166° N, 90.4328° E',
        }
      }
    );
  };

  // Submit Toll Claim
  const handleAddToll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentReq) return;
    const amountNum = parseFloat(tollAmount) || 0;
    if (amountNum <= 0) {
      showToast(t('Please enter valid toll amount', 'সঠিক টোলের পরিমাণ লিখুন', lang), 'info');
      return;
    }

    sendChatMessage(
      currentReq.id,
      isEmployee ? 'employee' : 'driver',
      isEmployee ? `${currentUserName} (Staff)` : `${currentReq.assignedDriverName || 'Driver'}`,
      `Claimed official highway toll: ${tollName} (৳${amountNum}). Receipt voucher: ${tollReceiptNo}`,
      {
        messageType: 'toll_claim',
        tollData: {
          tollName,
          amount: amountNum,
          receiptNo: tollReceiptNo,
          approved: false
        }
      }
    );

    setShowTollForm(false);
    showToast(t(
      `✓ Toll voucher claimed: ${tollName} (৳${amountNum}). Submitted for Transport Admin audit.`,
      `✓ টোল ভাউচার দাখিল সম্পন্ন: ৳${amountNum}`,
      lang
    ), 'success');
  };

  const triggerCall = (name: string, roleTitle: string, phone: string) => {
    setActiveCallee({ name, role: roleTitle, phone });
    setShowCallModal(true);
  };

  const activeQuickChips = isEmployee
    ? [
        t('📍 Waiting at Gate-1 porch', '📍 গেট-১ এ নথিপত্র নিয়ে প্রস্তুত আছি', lang),
        t('⏳ Coming down in 5 mins', '⏳ ৫ মিনিটের মধ্যে নিচে নামছি', lang),
        t('❄️ Please keep AC set to 21°C', '❄️ এসির তাপমাত্রা স্বাভাবিক রাখবেন', lang),
        t('🛑 Need to pick up 1 colleague at Mohakhali', '🛑 মহাখালীতে ১ জন সহকর্মীকে তুলতে হবে', lang),
      ]
    : isDriver
    ? [
        t('📍 Arrived at Gate-1 porch canopy', '📍 গেট-১ পোর্চে গাড়ি নিয়ে প্রস্তুত', lang),
        t('🚀 Started highway transit via flyover', '🚀 যাত্রা শুরু করেছি', lang),
        t('🧾 Uploaded flyover toll voucher', '🧾 টোল ভাউচার আপলোড করেছি', lang),
        t('🏁 Arrived safely at destination gate', '🏁 গন্তব্যে নিরাপদে পৌঁছেছি', lang),
      ]
    : [
        t('🟢 Gate clearance BOG-7729 authorized', '🟢 গেট পাস BOG-7729 অনুমোদিত', lang),
        t('⚠️ Traffic alert: Divert via Outer Ring Road', '⚠️ ফ্লাইওভারে জ্যাম, আউটার রিং রোড ব্যবহার করুন', lang),
        t('⛽ Fuel voucher approved for 60L Octane', '⛽ ৬০ লিটার ফুয়েল স্লিপ অনুমোদিত', lang),
      ];

  return (
    <div className="flex h-[750px] w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm transition-all">
      {/* ─── COLUMN 1: CONVERSATION DIRECTORY (FIXED WIDTH, NEVER SQUEEZED) ─ */}
      <div className="w-72 sm:w-80 shrink-0 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/70 dark:bg-slate-950/40">
        {/* User Card */}
        <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-crimson-600" style={{ color: 'var(--brand-crimson)' }} />
              <span>{t('Dispatch Desk', 'ডেসপ্যাচ ডেস্ক', lang)}</span>
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
              {isEmployee ? 'Staff Mode' : isDriver ? 'Driver Terminal' : 'Dispatcher'}
            </span>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs">
            <div className="w-7 h-7 rounded-full bg-crimson-600 text-white font-extrabold flex items-center justify-center text-[11px] shrink-0" style={{ background: 'var(--brand-crimson)' }}>
              {currentUserName.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-slate-900 dark:text-white truncate text-xs">{currentUserName}</div>
              <div className="text-[10px] text-slate-500 truncate">{isEmployee ? 'Sales & Distribution' : isDriver ? 'Fleet Driver' : 'Central Transport'}</div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="p-2.5 border-b border-slate-200 dark:border-slate-800">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={channelSearch}
              onChange={(e) => setChannelSearch(e.target.value)}
              placeholder={t('Search trips & channels...', 'চ্যানেল খুঁজুন...', lang)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Channels List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {/* Active Duty Trips Section */}
          <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-2 pt-1 pb-1">
            {isEmployee ? t('My Active Duty Trips', 'আমার ট্রিপসমূহ', lang) : isDriver ? t('Assigned Missions', 'আমার মিশনসমূহ', lang) : t('Active Fleet Trips', 'বহর ট্রিপসমূহ', lang)}
          </div>

          {relevantRequisitions
            .filter(r => r.id.toLowerCase().includes(channelSearch.toLowerCase()) || r.to.toLowerCase().includes(channelSearch.toLowerCase()))
            .map((r) => {
              const isSelected = selectedChannelId === r.id;
              const hasDriver = Boolean(r.assignedDriverName);
              const tripMsgs = chatMessages.filter(m => m.requisitionId === r.id);

              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedChannelId(r.id)}
                  className={`p-2.5 rounded-xl cursor-pointer transition text-xs border ${
                    isSelected
                      ? 'bg-crimson-50 dark:bg-crimson-950/20 border-crimson-300 dark:border-crimson-800'
                      : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                  style={isSelected ? { borderColor: 'rgba(165, 28, 48, 0.4)', background: 'rgba(165, 28, 48, 0.06)' } : {}}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-[11px]">#{r.id}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      r.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : r.status === 'in_transit'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                    }`}>
                      {r.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="font-semibold text-slate-800 dark:text-slate-200 truncate text-xs">
                    {r.to.split(',')[0]}
                  </div>

                  <div className="flex items-center justify-between mt-1 text-[10.5px] text-slate-500">
                    <span className="truncate">
                      {hasDriver ? `🚙 ${r.assignedDriverName?.split(' ')[0]}` : '⏳ Awaiting Driver'}
                    </span>
                    <span className="text-blue-600 dark:text-blue-400 font-bold shrink-0">
                      {tripMsgs.length} msgs
                    </span>
                  </div>
                </div>
              );
            })}

          {/* Support & Fleet Channels */}
          <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-2 pt-3 pb-1">
            {t('Support & Logistics Channels', 'সাপোর্ট ও ফ্লিট চ্যানেল', lang)}
          </div>

          <div
            onClick={() => setSelectedChannelId('desk_direct')}
            className={`p-2.5 rounded-xl cursor-pointer transition text-xs border ${
              selectedChannelId === 'desk_direct'
                ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700'
                : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1.5 text-xs">
                <Shield className="w-3.5 h-3.5" />
                <span>Central Transport Desk</span>
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <div className="text-[10.5px] text-slate-500 mt-0.5">Md. Kamruzzaman (Supervisor)</div>
          </div>

          <div
            onClick={() => setSelectedChannelId('broadcast')}
            className={`p-2.5 rounded-xl cursor-pointer transition text-xs border ${
              selectedChannelId === 'broadcast'
                ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700'
                : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 text-xs">
                <Radio className="w-3.5 h-3.5" />
                <span>#broadcast</span>
              </span>
              <span className="text-[9.5px] font-bold text-slate-400">All Fleet</span>
            </div>
            <div className="text-[10.5px] text-slate-500 mt-0.5">Logistics & Route Bulletins</div>
          </div>

          <div
            onClick={() => setSelectedChannelId('emergency_sos')}
            className={`p-2.5 rounded-xl cursor-pointer transition text-xs border ${
              selectedChannelId === 'emergency_sos'
                ? 'bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-700'
                : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5 text-xs">
                <AlertOctagon className="w-3.5 h-3.5" />
                <span>#emergency_sos</span>
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">24/7 Patrol</span>
            </div>
            <div className="text-[10.5px] text-slate-500 mt-0.5">Breakdowns & Highway Patrol</div>
          </div>
        </div>
      </div>

      {/* ─── COLUMN 2: MESSAGE STREAM (FLEX-1, TAKES ALL REMAINING SPACE) ─── */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900 relative">
        {/* Stream Header */}
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-950/30">
          <div className="min-w-0 flex-1 pr-3">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm truncate flex items-center gap-2">
              <span>
                {selectedChannelId === 'broadcast' && '📢 Central Logistics Broadcast Advisories'}
                {selectedChannelId === 'emergency_sos' && '🚨 24/7 Roadside Emergency & Incident Response'}
                {selectedChannelId === 'desk_direct' && '💬 Central Transport Support Hotline'}
                {currentReq && `Trip Dispatch #${currentReq.id}: ${currentReq.to.split(',')[0]}`}
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
              {currentReq ? (
                <span>
                  Passenger: <strong>{currentReq.requesterName}</strong> • Vehicle: <strong>{currentReq.assignedVehiclePlate || 'Unassigned'}</strong> • Driver: <strong>{currentReq.assignedDriverName || 'Pending'}</strong>
                </span>
              ) : selectedChannelId === 'desk_direct' ? (
                <span>Direct coordination with Central Transport Supervisor (Md. Kamruzzaman)</span>
              ) : (
                <span>Official BOGCL enterprise fleet frequency</span>
              )}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Call Driver Button */}
            {currentReq?.assignedDriverPhone && (
              <button
                onClick={() => triggerCall(
                  currentReq.assignedDriverName || 'Driver',
                  `Official Assigned Driver • ${currentReq.assignedVehiclePlate || 'Duty Car'}`,
                  currentReq.assignedDriverPhone || '+880 1711-229944'
                )}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-xs font-bold transition"
                title="Direct Phone Call with Driver"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('Call Driver', 'কল চালক', lang)}</span>
              </button>
            )}

            {/* Toggle Right Context Panel (Fixing Image 2 layout congestion) */}
            {currentReq && (
              <button
                onClick={() => setShowRightPanel(!showRightPanel)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition"
                title={showRightPanel ? 'Hide trip dossier' : 'Show trip dossier'}
              >
                {showRightPanel ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>

        {/* Messages Stream Container */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3.5 bg-slate-50/30 dark:bg-slate-900/50">
          {activeMessages.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <MessageSquare className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
              <div className="font-bold text-sm text-slate-700 dark:text-slate-300">{t('No messages in this channel yet', 'এই চ্যানেলে এখনও কোনো বার্তা নেই', lang)}</div>
              <p className="text-xs text-slate-500 mt-1">{t('Post a coordination update or waypoint note to begin.', 'সমন্বয় বার্তা লিখে কথোপকথন শুরু করুন।', lang)}</p>
            </div>
          ) : (
            activeMessages.map((m) => {
              const isMine = (isEmployee && m.senderRole === 'employee') || (isDriver && m.senderRole === 'driver') || (isAdmin && m.senderRole === 'admin');
              const isStaff = m.senderRole === 'employee';
              const isDriverMsg = m.senderRole === 'driver';
              const isAdminMsg = m.senderRole === 'admin';
              const isSystem = m.senderRole === 'system';

              return (
                <div
                  key={m.id}
                  className={`flex flex-col w-full ${isMine ? 'items-end' : 'items-start'}`}
                >
                  {/* Sender Header */}
                  <div className="text-[10px] font-bold mb-1 flex items-center gap-1.5 text-slate-500">
                    {isStaff && <span className="text-blue-600 font-extrabold">🧑‍💼 {m.senderName}</span>}
                    {isDriverMsg && <span className="text-emerald-600 font-extrabold">🚙 {m.senderName}</span>}
                    {isAdminMsg && <span className="text-amber-600 font-extrabold">👮 {m.senderName}</span>}
                    {isSystem && <span className="text-slate-600 font-extrabold">🤖 {m.senderName}</span>}
                    <span className="text-[9px] text-slate-400 font-normal">{m.timestamp}</span>
                  </div>

                  {/* Toll Voucher Message Card */}
                  {m.messageType === 'toll_claim' && m.tollData ? (
                    <div className="max-w-[85%] bg-white dark:bg-slate-900 border-2 border-amber-400 dark:border-amber-600 rounded-2xl p-3.5 shadow-sm space-y-2">
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-[11px] font-extrabold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                          <Receipt className="w-3.5 h-3.5" />
                          <span>HIGHWAY TOLL EXPENSE CLAIM</span>
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold ${
                          m.tollData.approved
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        }`}>
                          {m.tollData.approved ? '✓ Approved' : '⏳ Pending Audit'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Toll Plaza:</span>
                          <span className="font-bold text-slate-900 dark:text-white">{m.tollData.tollName}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Amount:</span>
                          <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">৳{m.tollData.amount}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Receipt Slip:</span>
                          <span className="font-mono text-slate-700 dark:text-slate-300">{m.tollData.receiptNo}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Cost Center:</span>
                          <span className="font-mono text-blue-600">CC-SALES-DHAKA-102</span>
                        </div>
                      </div>

                      {isAdmin && !m.tollData.approved && (
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                          <button
                            onClick={() => approveTollExpense(m.id, m.requisitionId, currentUserName)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve ৳{m.tollData.amount} Claim</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ) : m.messageType === 'location_share' && m.locationData ? (
                    /* Passenger Location Pin Card */
                    <div className="max-w-[85%] bg-blue-50 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-800 rounded-2xl p-3 shadow-sm space-y-1">
                      <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400 text-xs font-bold">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>PASSENGER PICKUP LOCATION</span>
                      </div>
                      <div className="font-bold text-xs text-slate-900 dark:text-white">{m.locationData.title}</div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-300">{m.locationData.address}</div>
                      <div className="text-[10px] font-mono text-blue-600 dark:text-blue-400 font-bold">GPS: {m.locationData.coordinates}</div>
                    </div>
                  ) : (
                    /* Standard Bubble */
                    <div
                      className={`max-w-[80%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed shadow-sm break-words ${
                        isMine
                          ? 'bg-crimson-600 text-white rounded-br-sm'
                          : isStaff
                          ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-950 dark:text-blue-200 border border-blue-200 dark:border-blue-800/50 rounded-bl-sm'
                          : isDriverMsg
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800/50 rounded-bl-sm'
                          : isSystem
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                          : 'bg-amber-50 dark:bg-amber-950/30 text-amber-950 dark:text-amber-200 border border-amber-200 dark:border-amber-800/50 rounded-bl-sm'
                      }`}
                      style={isMine ? { background: 'var(--brand-crimson)' } : {}}
                    >
                      {m.text}
                      {isMine && (
                        <div className="flex justify-end mt-0.5 opacity-80">
                          <CheckCheck className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {isTyping && (
            <div className="flex items-center gap-2 text-xs text-slate-500 italic">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-crimson-600" />
              <span>{isTyping} {t('is typing...', 'টাইপ করছেন...', lang)}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        {selectedChannelId !== 'broadcast' && (
          <div className="px-4 py-2 bg-slate-100/70 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex gap-1.5 overflow-x-auto whitespace-nowrap">
            {activeQuickChips.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10.5px] font-semibold text-slate-700 dark:text-slate-300 hover:border-blue-500 transition shadow-xs"
              >
                <span>{q}</span>
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2">
          {currentReq && (
            <>
              <button
                onClick={handleShareLocation}
                className="h-9 px-2.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center gap-1 hover:bg-blue-100 transition shrink-0"
                title="Share GPS Location Pin"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('Location', 'লোকেশন', lang)}</span>
              </button>

              <button
                onClick={() => setShowTollForm(true)}
                className="h-9 px-2.5 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 font-bold text-xs flex items-center gap-1 hover:bg-amber-100 transition shrink-0"
                title="Claim Toll Voucher"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('Toll', 'টোল', lang)}</span>
              </button>
            </>
          )}

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              selectedChannelId === 'broadcast'
                ? (isAdmin ? t('Post official broadcast announcement to fleet...', 'ঘোষণা পোস্ট করুন...', lang) : t('Channel is read-only for employees', 'এই চ্যানেলটি শুধুমাত্র প্রশাসকদের জন্য', lang))
                : selectedChannelId === 'emergency_sos'
                ? t('Report roadside emergency or breakdown...', 'জরুরি সহায়তা চেয়ে বার্তা দিন...', lang)
                : t('Type coordination message...', 'বার্তা লিখুন...', lang)
            }
            disabled={selectedChannelId === 'broadcast' && !isAdmin}
            className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim()}
            className="h-9 px-4 rounded-xl bg-crimson-600 hover:bg-crimson-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-crimson-600/20 transition disabled:opacity-50 shrink-0"
            style={{ background: 'var(--brand-crimson)' }}
          >
            <span>{t('Send', 'পাঠান', lang)}</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ─── COLUMN 3: COLLAPSIBLE TRIP DOSSIER (NEVER CROWDS CHAT STREAM) ─ */}
      {showRightPanel && currentReq && (
        <div className="w-72 lg:w-80 shrink-0 border-l border-slate-200 dark:border-slate-800 flex flex-col p-4 bg-slate-50/70 dark:bg-slate-950/40 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              {t('Trip Dossier', 'ট্রিপ চালান তথ্য', lang)}
            </span>
            <button
              onClick={() => setShowRightPanel(false)}
              className="text-slate-400 hover:text-slate-700 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Route Summary */}
          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-slate-900 dark:text-white">#{currentReq.id}</span>
              <span className="badge info" style={{ fontSize: '9px' }}>{currentReq.status.toUpperCase()}</span>
            </div>
            <div className="font-bold text-slate-800 dark:text-slate-200">
              📍 {currentReq.to}
            </div>
            <div className="text-[11px] text-slate-500">
              From: {currentReq.from.split(',')[0]}
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between text-[11px] text-slate-600 dark:text-slate-400 font-semibold">
              <span>Departure: {currentReq.departureTime}</span>
              <span>{currentReq.passengersCount} Pax</span>
            </div>
          </div>

          {/* Assigned Driver Card */}
          {currentReq.assignedDriverName ? (
            <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                  {currentReq.assignedDriverName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-emerald-950 dark:text-emerald-200 text-xs">{currentReq.assignedDriverName}</div>
                  <div className="text-[10.5px] text-emerald-700 dark:text-emerald-400">100% BAC Breathalyzer Passed</div>
                </div>
              </div>

              <button
                onClick={() => triggerCall(
                  currentReq.assignedDriverName || 'Driver',
                  `Assigned Driver • ${currentReq.assignedVehiclePlate || 'Duty Car'}`,
                  currentReq.assignedDriverPhone || '+880 1711-229944'
                )}
                className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Call Driver ({currentReq.assignedDriverPhone?.slice(-4) || 'Dial'})</span>
              </button>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
              ⏳ Awaiting Driver Allocation by Transport Supervisor
            </div>
          )}

          {/* Gate Pass Quick Button */}
          <button
            onClick={() => onNavigateToTripPass?.(currentReq)}
            className="w-full py-2.5 rounded-xl border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center gap-2 hover:bg-blue-100 transition"
          >
            <QrCode className="w-4 h-4 text-blue-600" />
            <span>{t('View Security Gate Pass', 'গেট পাস প্রদর্শন', lang)}</span>
          </button>

          {/* Submit Toll Claim Drawer Form */}
          {showTollForm ? (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Claim Highway Toll</span>
                </span>
                <button onClick={() => setShowTollForm(false)} className="text-amber-800 font-bold">✕</button>
              </div>

              <form onSubmit={handleAddToll} className="space-y-2">
                <div>
                  <label className="text-[10.5px] font-bold text-slate-700 dark:text-slate-300">Toll Plaza Name</label>
                  <select
                    value={tollName}
                    onChange={(e) => setTollName(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-1.5 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="Mayor Hanif Flyover">Mayor Hanif Flyover</option>
                    <option value="Padma Multipurpose Bridge">Padma Multipurpose Bridge</option>
                    <option value="Bangabandhu Jamuna Bridge">Bangabandhu Jamuna Bridge</option>
                    <option value="Dhaka Elevated Expressway">Dhaka Elevated Expressway</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10.5px] font-bold text-slate-700 dark:text-slate-300">Amount (৳)</label>
                    <input
                      type="number"
                      value={tollAmount}
                      onChange={(e) => setTollAmount(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-1.5 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10.5px] font-bold text-slate-700 dark:text-slate-300">Receipt #</label>
                    <input
                      type="text"
                      value={tollReceiptNo}
                      onChange={(e) => setTollReceiptNo(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-1.5 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition"
                >
                  Submit Voucher to Chat
                </button>
              </form>
            </div>
          ) : (
            <button
              onClick={() => setShowTollForm(true)}
              className="w-full py-2 rounded-xl border border-dashed border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-amber-100/50 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Claim Flyover / Bridge Toll</span>
            </button>
          )}
        </div>
      )}

      {/* VoIP Calling Modal */}
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
