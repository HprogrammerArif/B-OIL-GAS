import React, { useState, useEffect, useRef } from 'react';
import { VehicleRequisition, useFleetStore } from '../../store/fleetStore';
import { ROLE_META, t } from '../../types';
import { showToast } from '../../App';
import {
  MessageSquare, Send, X, Users, Car, MapPin,
  Clock, ShieldCheck, Check, CheckCheck,
  Receipt, PhoneCall, ExternalLink, Play, Pause, FileText,
  Mic
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

  const currentStaff = ROLE_META[userRole as keyof typeof ROLE_META] || ROLE_META['employee'];

  // Sender Persona Mode
  const [activePersona, setActivePersona] = useState<'employee' | 'driver' | 'admin'>(
    userRole === 'driver' ? 'driver' : userRole === 'admin' ? 'admin' : 'employee'
  );

  useEffect(() => {
    setActivePersona(userRole === 'driver' ? 'driver' : userRole === 'admin' ? 'admin' : 'employee');
  }, [userRole]);

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
    ? requisition?.requesterName || currentStaff.name
    : activePersona === 'driver'
    ? requisition?.assignedDriverName || ROLE_META['driver']?.name || 'Md. Rafiqul Islam (Driver)'
    : ROLE_META['transport_admin']?.name || 'Md. Kamruzzaman (Transport Admin)';

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
    <div className="modal-bg" onClick={onClose}>
      <div
        className="trip-chat-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ─── 1. PREMIUM HEADER ─── */}
        <div className="trip-chat-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
            <div className="trip-chat-header-icon">
              <Car size={22} color="#FFFFFF" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 className="trip-chat-header-title">
                  {t('Tri-Party Mission Coordination Desk', 'ত্রি-পক্ষীয় ট্রিপ সমন্বয় ডায়ালগ', lang)}
                </h3>
                <span className="trip-chat-id-badge">
                  #{requisition.id}
                </span>
              </div>
              <p className="trip-chat-header-sub">
                <MapPin size={13} style={{ color: '#F43F5E', flexShrink: 0 }} />
                <span>{requisition.from.split(',')[0]} ➔ <strong>{requisition.to.split(',')[0]}</strong></span>
                {requisition.assignedVehiclePlate && (
                  <span style={{ fontFamily: 'monospace', color: '#FCD34D', marginLeft: '6px' }}>({requisition.assignedVehiclePlate})</span>
                )}
              </p>
            </div>
          </div>

          <div className="trip-chat-header-actions">
            {requisition.assignedDriverPhone && (
              <button
                onClick={() => setShowCallModal(true)}
                className="trip-chat-btn-call"
                title="VoIP Audio Call"
              >
                <PhoneCall size={14} />
                <span>{t('Call Driver', 'কল চালক', lang)}</span>
              </button>
            )}

            {onOpenFullDesk && (
              <button
                onClick={() => {
                  onClose();
                  onOpenFullDesk(requisition);
                }}
                className="trip-chat-btn-tool"
                title="Open full-screen communications desk"
              >
                <ExternalLink size={14} />
                <span>{t('Full Desk', 'পূর্ণ ডেস্ক', lang)}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="trip-chat-btn-close"
              title="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ─── 2. TRI-PARTY PRESENCE ROSTER STRIP ─── */}
        <div className="trip-chat-roster-bar">
          <div className="trip-chat-roster-pills">
            <span className="trip-chat-roster-tag">
              <Users size={14} style={{ color: '#2563EB' }} />
              <span>{t('Live 3-Way Frequency:', '৩-পক্ষীয় লাইভ:', lang)}</span>
            </span>

            {/* 1. Requesting Employee */}
            <div className="trip-chat-presence-chip">
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3B82F6', flexShrink: 0 }} />
              <span className="trip-chat-presence-name">{requisition.requesterName}</span>
              <span className="trip-chat-presence-role staff">Staff</span>
            </div>

            {/* 2. Assigned Driver */}
            <div className="trip-chat-presence-chip">
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: requisition.assignedDriverName ? '#10B981' : '#F59E0B',
                flexShrink: 0
              }} />
              <span className="trip-chat-presence-name">
                {requisition.assignedDriverName ? requisition.assignedDriverName.replace(/\s*\(.*\)/, '') : 'Awaiting Driver'}
              </span>
              <span className="trip-chat-presence-role driver">Driver</span>
            </div>

            {/* 3. Vehicle Admin */}
            <div className="trip-chat-presence-chip">
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366F1', flexShrink: 0 }} />
              <span className="trip-chat-presence-name">Kamruzzaman</span>
              <span className="trip-chat-presence-role admin">Admin</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: '#059669' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
            <span>Connected</span>
          </div>
        </div>

        {/* ─── 3. SENDER IDENTITY & PERSPECTIVE BAR ─── */}
        <div className="trip-chat-persona-bar">
          <div className="trip-chat-persona-controls">
            {userRole === 'admin' ? (
              <>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-slate-500, #64748B)' }}>
                  {t('Dispatch Channel Perspective:', 'প্রেরক মোড:', lang)}
                </span>
                <div className="trip-chat-persona-group">
                  <button
                    type="button"
                    onClick={() => setActivePersona('employee')}
                    className={`trip-chat-persona-btn ${activePersona === 'employee' ? 'active-employee' : ''}`}
                  >
                    👤 Staff ({requisition?.requesterName?.split(' ')[0] || 'Staff'})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePersona('driver')}
                    className={`trip-chat-persona-btn ${activePersona === 'driver' ? 'active-driver' : ''}`}
                  >
                    🚗 Driver ({requisition?.assignedDriverName?.split(' ')[1] || 'Driver'})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePersona('admin')}
                    className={`trip-chat-persona-btn ${activePersona === 'admin' ? 'active-admin' : ''}`}
                  >
                    🛡️ Dispatch Desk
                  </button>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px' }}>
                <span style={{ color: 'var(--brand-slate-500)', fontWeight: 600 }}>{t('Posting as:', 'প্রেরক:', lang)}</span>
                <span style={{ fontWeight: 700, color: 'var(--brand-slate-900)' }}>{personaName}</span>
                <span className="badge teal" style={{ fontSize: '10px', textTransform: 'capitalize' }}>
                  ✓ {activePersona}
                </span>
              </div>
            )}
          </div>

          <span style={{ fontSize: '10.5px', color: 'var(--brand-slate-400, #94A3B8)' }}>
            Enter sends • Shift+Enter for newline
          </span>
        </div>

        {/* ─── 4. MESSAGES STREAM ─── */}
        <div className="trip-chat-stream">
          {/* Day Divider */}
          <div className="trip-chat-day-divider">
            <span className="trip-chat-day-pill">
              TODAY • OFFICIAL DISPATCH LOG
            </span>
          </div>

          {reqMessages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--brand-slate-400, #94A3B8)' }}>
              <MessageSquare size={40} style={{ margin: '0 auto 10px', opacity: 0.6 }} />
              <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--brand-slate-700, #334155)' }}>
                {t('No messages in this trip channel yet', 'এই ট্রিপে এখনও কোনো বার্তা নেই', lang)}
              </div>
              <p style={{ fontSize: '12px', marginTop: '4px', color: 'var(--brand-slate-500, #64748B)' }}>
                {t('Coordinate pickup point, AC preferences, or baggage requirements.', 'পিকআপ স্থান ও যাত্রা সংক্রান্ত বার্তা পাঠিয়ে আলোচনা শুরু করুন।', lang)}
              </p>
            </div>
          ) : (
            reqMessages.map((m) => {
              const isMine = m.senderRole === activePersona;
              const isDriverMsg = m.senderRole === 'driver';
              const isAdminMsg = m.senderRole === 'admin';
              const isSystem = m.senderRole === 'system' || m.messageType === 'system_event';

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
                            <span style={{ fontSize: '10px', color: 'var(--brand-slate-400)', display: 'block' }}>Status:</span>
                            <span style={{ fontSize: '11px', fontWeight: 600 }}>
                              {m.tollData.approved ? 'Reimbursed' : 'Awaiting Audit'}
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
                            Awaiting Central Transport Admin authorization.
                          </div>
                        )}
                      </div>
                    ) : m.messageType === 'location_share' && m.locationData ? (
                      /* Rich Location Pin Card */
                      <div className="trip-chat-location-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#2563EB', fontWeight: 800, fontSize: '12px' }}>
                          <MapPin size={16} />
                          <span>PASSENGER PICKUP PIN</span>
                        </div>
                        <div style={{ fontWeight: 800, fontSize: '13px', color: 'var(--brand-slate-900)' }}>{m.locationData.title}</div>
                        <div style={{ fontSize: '11.5px', color: 'var(--brand-slate-600)' }}>{m.locationData.address}</div>
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
                          <div style={{ fontSize: '10px', opacity: 0.8 }}>{m.attachmentData.fileSize} • Gate Clearance</div>
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

          {isTyping && (
            <div className="trip-chat-typing-pill">
              <span style={{ display: 'inline-flex', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#A51C30', display: 'inline-block' }} />
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#A51C30', display: 'inline-block' }} />
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#A51C30', display: 'inline-block' }} />
              </span>
              <span>{isTyping} is typing...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ─── 5. TOLL CLAIM FORM DRAWER IN MODAL ─── */}
        {showTollForm && (
          <div style={{ padding: '12px 20px', background: '#FFFBEB', borderTop: '1px solid #FDE68A', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#92400E', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Receipt size={16} color="#D97706" />
                <span>Submit Official Highway Toll Slip</span>
              </span>
              <button onClick={() => setShowTollForm(false)} style={{ border: 'none', background: 'transparent', color: '#92400E', cursor: 'pointer', fontWeight: 800 }}>✕</button>
            </div>
            <form onSubmit={handleSubmitTollClaim} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', fontSize: '12px' }}>
              <select
                value={tollPlaza}
                onChange={(e) => setTollPlaza(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: '12px' }}
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
                style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: '12px', fontWeight: 800 }}
              />
              <button
                type="submit"
                style={{
                  padding: '8px 14px',
                  borderRadius: '10px',
                  background: '#D97706',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '12px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Post Toll to Chat
              </button>
            </form>
          </div>
        )}

        {/* ─── 6. ROLE-SPECIFIC QUICK REPLIES ─── */}
        <div className="trip-chat-quick-bar">
          {quickReplies.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              className="trip-chat-quick-pill"
            >
              <span>{q}</span>
            </button>
          ))}
        </div>

        {/* ─── 7. MODERN INPUT COMPOSER BAR ─── */}
        <div className="trip-chat-composer">
          {isRecordingVoice ? (
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
            <div className="trip-chat-composer-row">
              {/* Quick Action Tools */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                <button
                  onClick={handleShareLocationPin}
                  className="trip-chat-tool-btn"
                  title="Share Pickup Pin"
                >
                  <MapPin size={15} style={{ color: '#2563EB' }} />
                  <span>Pin</span>
                </button>

                <button
                  onClick={() => setShowTollForm(!showTollForm)}
                  className="trip-chat-tool-btn"
                  title="Toll Voucher"
                >
                  <Receipt size={15} style={{ color: '#D97706' }} />
                  <span>Toll</span>
                </button>

                <button
                  onClick={() => setIsRecordingVoice(true)}
                  className="trip-chat-tool-btn"
                  title="Voice Note"
                >
                  <Mic size={15} style={{ color: '#E11D48' }} />
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
                className="trip-chat-input-field"
              />

              {/* Send Button */}
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim()}
                className="trip-chat-btn-send"
              >
                <span>{t('Send', 'পাঠান', lang)}</span>
                <Send size={14} />
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
