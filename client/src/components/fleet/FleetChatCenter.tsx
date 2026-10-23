import React, { useState, useEffect, useRef } from 'react';
import { useFleetStore, VehicleRequisition, TripChatMessage } from '../../store/fleetStore';
import { t } from '../../types';
import { showToast } from '../../App';
import {
  MessageSquare, Send, Users, Phone, Car, MapPin,
  Clock, Shield, User, CheckCircle2, AlertOctagon, Radio,
  Search, Plus, Sparkles, Navigation, QrCode, DollarSign,
  Receipt, FileText, Check, ChevronRight, PhoneCall, AlertTriangle,
  CornerDownRight, Compass, CheckCheck, Loader2
} from 'lucide-react';
import DriverCallModal from './DriverCallModal';

interface FleetChatCenterProps {
  userRole: 'employee' | 'admin';
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

  // Current authenticated user identity (Strict RBAC - NO fake persona switching)
  const currentUserName = isEmployee ? 'Tanvir Ahmed' : 'Md. Kamruzzaman (Transport Admin)';
  const currentUserRole = isEmployee ? 'employee' : 'admin';

  // Relevant trip requisitions
  const relevantRequisitions = isEmployee
    ? requisitions.filter(r => r.requesterName.includes('Tanvir') || r.id === 'REQ-2026-441' || r.id === 'REQ-2026-435')
    : requisitions;

  // Selected Channel
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

  // Get current selected requisition if channel is a trip ID
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

    // Send the user's authentic message
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

  // Realistic Automated Reactive Responses (Simulated Living Chat)
  const simulateCounterpartResponse = (userText: string, channelId: string) => {
    const lower = userText.toLowerCase();

    // Case 1: Trip Dispatch Channel (Talking to Assigned Driver)
    if (channelId.startsWith('REQ-')) {
      const targetReq = requisitions.find(r => r.id === channelId);
      const driverName = targetReq?.assignedDriverName || 'Md. Shahidul Islam';
      const vehiclePlate = targetReq?.assignedVehiclePlate || 'DHAKA METRO GHA-13-8821';

      if (isEmployee) {
        // Staff messaging Driver
        setTimeout(() => {
          setIsTyping(`${driverName} (Driver)`);
        }, 800);

        setTimeout(() => {
          setIsTyping(null);
          let reply = '';
          if (lower.includes('where') || lower.includes('location') || lower.includes('porch') || lower.includes('gate')) {
            reply = `Ji Tanvir Sir, I am right at Gate-1 porch by the main reception canopy with vehicle ${vehiclePlate}. AC is set to 22°C. Whenever you exit the building, please look for the silver Prado.`;
          } else if (lower.includes('min') || lower.includes('down') || lower.includes('delay') || lower.includes('wait')) {
            reply = `Noted Tanvir Sir, take your time. I have loaded fresh mineral water bottles in the back. Waiting safely at the porch bay.`;
          } else if (lower.includes('ac') || lower.includes('cool') || lower.includes('temp')) {
            reply = `Ji Sir, cabin temperature is cooled and fresh air filter is running. Ready for highway transit.`;
          } else if (lower.includes('toll') || lower.includes('flyover') || lower.includes('money') || lower.includes('cost')) {
            reply = `Ji Sir, I have already paid the Mayor Hanif Flyover toll (৳260) with electronic pass and uploaded the voucher for Central Transport clearance.`;
          } else if (lower.includes('stop') || lower.includes('motijheel') || lower.includes('bank')) {
            reply = `Noted Sir, route waypoint confirmed. I will navigate via Sonali Bank Motijheel before proceeding to the highway.`;
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
        }, 2400);
      } else {
        // Transport Admin messaging Driver
        setTimeout(() => {
          setIsTyping(`${driverName} (Driver)`);
        }, 900);

        setTimeout(() => {
          setIsTyping(null);
          sendChatMessage(
            channelId,
            'driver',
            `${driverName} (Driver)`,
            `Assalamu Alaikum Kamruzzaman Sir. Received your instruction. Following the designated highway corridor and maintaining strict 60 km/h speed limit per BOGCL safety standards.`,
            { messageType: 'text' }
          );
        }, 2200);
      }
    }

    // Case 2: Direct Transport Help Desk
    else if (channelId === 'desk_direct') {
      if (isEmployee) {
        setTimeout(() => {
          setIsTyping('Md. Kamruzzaman (Transport Supervisor)');
        }, 800);

        setTimeout(() => {
          setIsTyping(null);
          let reply = `Assalamu Alaikum Tanvir. Central Transport Desk has logged your query. Requisition priority is assigned. Feel free to contact hotline +880 1711-229944 if you need immediate roadside escalation.`;
          if (lower.includes('microbus') || lower.includes('hiace') || lower.includes('seat')) {
            reply = `Assalamu Alaikum Tanvir. 7-seater Toyota HiAce (CHA-53-4102) is available in pool. Please make sure to specify all passenger designations in your request.`;
          } else if (lower.includes('emergency') || lower.includes('urgent')) {
            reply = `Noted urgent request! Central Logistics will expedite car allocation within 10 minutes. Stand by for gate pass code.`;
          }

          sendChatMessage(
            'desk_direct',
            'admin',
            'Md. Kamruzzaman (Transport Supervisor)',
            reply,
            { messageType: 'text' }
          );
        }, 2200);
      }
    }

    // Case 3: Driver Direct Lines (Admin talking to driver)
    else if (channelId.startsWith('drv_direct_')) {
      const driverId = channelId.replace('drv_direct_', '');
      const drv = drivers.find(d => d.id === driverId);
      const drvName = drv?.name || 'Driver';

      setTimeout(() => {
        setIsTyping(`${drvName} (Driver)`);
      }, 900);

      setTimeout(() => {
        setIsTyping(null);
        sendChatMessage(
          channelId,
          'driver',
          `${drvName} (Driver)`,
          `Ji Kamruzzaman Sir, vehicle checklist verified and breathalyzer cleared. Ready for next trip dispatch whenever instructed.`,
          { messageType: 'text' }
        );
      }, 2300);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Send Location Share
  const handleShareLocation = () => {
    const locTitle = isEmployee ? 'Bashundhara Corporate HQ Reception' : 'Central Transport Dispatch Bay';
    const locAddress = isEmployee
      ? 'Plot-3, Block-G, Umme Kulsum Road, Bashundhara R/A, Dhaka'
      : 'BOGCL Central Transport Fleet Yard Gate #1';
    const coords = '23.8166° N, 90.4328° E';

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
          coordinates: coords,
        }
      }
    );

    // Simulate driver acknowledgment
    if (selectedChannelId.startsWith('REQ-')) {
      setTimeout(() => {
        setIsTyping('Md. Shahidul Islam (Driver)');
      }, 1000);

      setTimeout(() => {
        setIsTyping(null);
        sendChatMessage(
          selectedChannelId,
          'driver',
          'Md. Shahidul Islam (Driver)',
          `GPS location pin received Sir! Pulling right up to ${locTitle}.`,
          { messageType: 'text' }
        );
      }, 2500);
    }
  };

  // Submit Toll Claim Form
  const handleAddToll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentReq) return;
    const amountNum = parseFloat(tollAmount) || 0;
    if (amountNum <= 0) {
      showToast(t('Please enter valid toll amount', 'সঠিক টোলের পরিমাণ লিখুন', lang), 'info');
      return;
    }

    // Post toll claim message into chat stream
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

  // Trigger Phone Call
  const triggerCall = (name: string, roleTitle: string, phone: string) => {
    setActiveCallee({
      name,
      role: roleTitle,
      phone,
    });
    setShowCallModal(true);
  };

  // Quick Action Chips strictly tailored to authenticated role
  const employeeQuickChips = [
    t('📍 Waiting at Gate-1 porch', '📍 গেট-১ এ নথিপত্র নিয়ে প্রস্তুত আছি', lang),
    t('⏳ Coming down in 5 mins', '⏳ ৫ মিনিটের মধ্যে নিচে নামছি', lang),
    t('❄️ Please keep AC set to 21°C', '❄️ এসির তাপমাত্রা স্বাভাবিক রাখবেন', lang),
    t('🛑 Need to pick up 1 colleague at Mohakhali', '🛑 মহাখালীতে ১ জন সহকর্মীকে তুলতে হবে', lang),
    t('🚦 Heavy flyover traffic, 10m delay', '🚦 ফ্লাইওভারে জ্যাম, ১০ মিনিট দেরি হতে পারে', lang),
  ];

  const adminQuickChips = [
    t('🟢 Gate clearance BOG-7729 authorized', '🟢 গেট পাস BOG-7729 অনুমোদিত', lang),
    t('⚠️ Traffic warning: Use Outer Ring Road bypass', '⚠️ সতর্কবার্তা: আউটার রিং রোড ব্যবহার করুন', lang),
    t('⛽ Fuel voucher approved for 60L Octane', '⛽ ৬০ লিটার ফুয়েল স্লিপ অনুমোদিত', lang),
    t('🛡️ Driver BAC 0.00% breathalyzer verified', '🛡️ চালকের অ্যালকোহল টেস্ট পাস নিশ্চিত', lang),
  ];

  const activeQuickChips = isEmployee ? employeeQuickChips : adminQuickChips;

  return (
    <div className="card" style={{
      display: 'grid',
      gridTemplateColumns: '290px 1fr 310px',
      height: '760px',
      padding: 0,
      overflow: 'hidden',
      borderRadius: '12px',
      border: '1px solid var(--brand-slate-200)',
      background: 'var(--brand-card-bg)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.04)'
    }}>
      {/* ─── COLUMN 1: ROLE-ORGANIZED COMMUNICATIONS DIRECTORY ──────── */}
      <div style={{
        borderRight: '1px solid var(--brand-slate-200)',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--brand-card-bg)'
      }}>
        {/* Header with Authenticated Identity Card */}
        <div style={{
          padding: '14px 16px',
          borderBottom: '1px solid var(--brand-slate-200)',
          background: 'var(--brand-card-bg)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--brand-slate-900)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MessageSquare size={16} color="var(--brand-crimson)" />
              {t('Communications Desk', 'কমিউনিকেশন ডেস্ক', lang)}
            </span>
            <span className="badge info" style={{ fontSize: '9.5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {isEmployee ? 'Staff Mode' : 'Dispatcher Mode'}
            </span>
          </div>

          {/* Authenticated User Identity Pill */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: isEmployee ? 'rgba(59, 130, 246, 0.06)' : 'rgba(212, 175, 55, 0.08)',
            border: isEmployee ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid rgba(212, 175, 55, 0.3)',
            borderRadius: '8px',
            padding: '6px 10px',
            fontSize: '11px',
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: isEmployee ? '#2563EB' : '#059669',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '10px'
            }}>
              {isEmployee ? 'TA' : 'KZ'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontWeight: 800, color: 'var(--brand-slate-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentUserName}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--brand-slate-500)' }}>
                {isEmployee ? 'Sales & Distribution • Requester' : 'Admin & Transport Division • Dispatcher'}
              </div>
            </div>
          </div>
        </div>

        {/* Channel Search Input */}
        <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--brand-slate-100)' }}>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: '8px', top: '7px', color: 'var(--brand-slate-400)' }} />
            <input
              type="text"
              className="input-text"
              placeholder={t('Search trips, drivers, channels...', 'চ্যানেল বা ড্রাইভার খুঁজুন...', lang)}
              style={{ width: '100%', paddingLeft: '26px', height: '28px', fontSize: '11px' }}
              value={channelSearch}
              onChange={(e) => setChannelSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Channels List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '6px' }}>
          {/* ── Category 1: Active Duty Trips ── */}
          <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--brand-slate-400)', textTransform: 'uppercase', padding: '6px 8px 4px', letterSpacing: '0.5px' }}>
            {isEmployee ? t('My Active Duty Trips', 'আমার ট্রিপ চ্যাট', lang) : t('Active Fleet Duty Trips', 'চলমান বহর ট্রিপসমূহ', lang)}
          </div>

          {relevantRequisitions
            .filter(r => r.id.toLowerCase().includes(channelSearch.toLowerCase()) || r.to.toLowerCase().includes(channelSearch.toLowerCase()))
            .map(r => {
              const isSelected = selectedChannelId === r.id;
              const hasDriver = Boolean(r.assignedDriverName);
              const tripUnread = chatMessages.filter(m => m.requisitionId === r.id).length;

              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedChannelId(r.id)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '8px',
                    marginBottom: '4px',
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(165, 28, 48, 0.08)' : 'transparent',
                    border: isSelected ? '1px solid rgba(165, 28, 48, 0.25)' : '1px solid transparent',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{
                      fontWeight: 800,
                      fontSize: '11.5px',
                      color: isSelected ? 'var(--brand-crimson)' : 'var(--brand-slate-900)',
                      fontFamily: 'monospace'
                    }}>
                      #{r.id}
                    </span>
                    <span className={`badge ${r.status === 'completed' ? 'success' : r.status === 'in_transit' ? 'info' : 'warn'}`} style={{ fontSize: '9px', padding: '1px 5px' }}>
                      {r.status.toUpperCase()}
                    </span>
                  </div>

                  <div style={{ fontSize: '11px', color: 'var(--brand-slate-700)', fontWeight: 600, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {r.to.split(',')[0]}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px', fontSize: '10px', color: 'var(--brand-slate-500)' }}>
                    <span>
                      {hasDriver ? `🚙 ${r.assignedDriverName?.split(' ')[0]}` : '⏳ Awaiting Driver'}
                    </span>
                    <span style={{ color: '#2563EB', fontWeight: 700 }}>
                      {tripUnread} msgs
                    </span>
                  </div>
                </div>
              );
            })}

          {/* ── Category 2: Direct Support Lines ── */}
          <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--brand-slate-400)', textTransform: 'uppercase', padding: '12px 8px 4px', letterSpacing: '0.5px' }}>
            {isEmployee ? t('Transport Help Desk', 'পরিবহন সাপোর্ট ডেস্ক', lang) : t('Driver Direct Hotlines', 'চালক সরাসরি হটলাইন', lang)}
          </div>

          {isEmployee ? (
            <div
              onClick={() => setSelectedChannelId('desk_direct')}
              style={{
                padding: '8px 10px',
                borderRadius: '8px',
                marginBottom: '4px',
                cursor: 'pointer',
                background: selectedChannelId === 'desk_direct' ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                border: selectedChannelId === 'desk_direct' ? '1px solid rgba(59, 130, 246, 0.25)' : '1px solid transparent',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 800, fontSize: '11.5px', color: '#1D4ED8', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Shield size={12} color="#1D4ED8" />
                  Central Transport Desk
                </span>
                <span className="badge success" style={{ fontSize: '8.5px', padding: '1px 4px' }}>Online</span>
              </div>
              <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-600)', marginTop: '2px' }}>
                Md. Kamruzzaman (Supervisor)
              </div>
            </div>
          ) : (
            drivers.slice(0, 3).map(drv => {
              const chId = `drv_direct_${drv.id}`;
              const isSel = selectedChannelId === chId;
              return (
                <div
                  key={drv.id}
                  onClick={() => setSelectedChannelId(chId)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '8px',
                    marginBottom: '4px',
                    cursor: 'pointer',
                    background: isSel ? 'rgba(5, 150, 105, 0.08)' : 'transparent',
                    border: isSel ? '1px solid rgba(5, 150, 105, 0.25)' : '1px solid transparent',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 800, fontSize: '11.5px', color: isSel ? '#059669' : 'var(--brand-slate-900)' }}>
                      🚙 {drv.name}
                    </span>
                    <span className="badge" style={{ fontSize: '8.5px', background: '#ECFDF5', color: '#065F46' }}>
                      {drv.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-500)', marginTop: '2px' }}>
                    {drv.phone}
                  </div>
                </div>
              );
            })
          )}

          {/* ── Category 3: Fleet Broadcast & Roadside SOS ── */}
          <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--brand-slate-400)', textTransform: 'uppercase', padding: '12px 8px 4px', letterSpacing: '0.5px' }}>
            {t('Fleet Channels', 'ফ্লিট চ্যানেলসমূহ', lang)}
          </div>

          <div
            onClick={() => setSelectedChannelId('broadcast')}
            style={{
              padding: '8px 10px',
              borderRadius: '8px',
              marginBottom: '4px',
              cursor: 'pointer',
              background: selectedChannelId === 'broadcast' ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
              border: selectedChannelId === 'broadcast' ? '1px solid rgba(59, 130, 246, 0.25)' : '1px solid transparent',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 800, fontSize: '11.5px', color: '#2563EB', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Radio size={12} color="#2563EB" />
                #broadcast
              </span>
              <span className="badge info" style={{ fontSize: '8.5px', padding: '1px 4px' }}>All Fleet</span>
            </div>
            <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-600)', marginTop: '2px' }}>
              Company Logistics Advisories
            </div>
          </div>

          <div
            onClick={() => setSelectedChannelId('emergency_sos')}
            style={{
              padding: '8px 10px',
              borderRadius: '8px',
              marginBottom: '4px',
              cursor: 'pointer',
              background: selectedChannelId === 'emergency_sos' ? 'rgba(239, 68, 68, 0.08)' : 'transparent',
              border: selectedChannelId === 'emergency_sos' ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid transparent',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 800, fontSize: '11.5px', color: '#EF4444', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <AlertOctagon size={12} color="#EF4444" />
                #emergency_sos
              </span>
              <span className="badge danger" style={{ fontSize: '8.5px', padding: '1px 4px' }}>24/7 Patrol</span>
            </div>
            <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-600)', marginTop: '2px' }}>
              Breakdown & Roadside Help
            </div>
          </div>
        </div>
      </div>

      {/* ─── COLUMN 2: ACTIVE CONVERSATION STREAM & ACTIONS ─────────── */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        background: '#FAFBFD',
        position: 'relative'
      }}>
        {/* Stream Header */}
        <div style={{
          padding: '12px 18px',
          borderBottom: '1px solid var(--brand-slate-200)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--brand-card-bg)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '14.5px', fontWeight: 800, color: 'var(--brand-slate-900)' }}>
                {selectedChannelId === 'broadcast' && '📢 Central Logistics Broadcast Advisories'}
                {selectedChannelId === 'emergency_sos' && '🚨 24/7 Roadside Emergency & Incident Response'}
                {selectedChannelId === 'desk_direct' && '💬 Central Transport Support Hotline'}
                {selectedChannelId.startsWith('drv_direct_') && `🚙 Driver Hotline • ${drivers.find(d => d.id === selectedChannelId.replace('drv_direct_', ''))?.name || 'Driver'}`}
                {currentReq && `Trip Dispatch #${currentReq.id}: ${currentReq.to.split(',')[0]}`}
              </h3>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)', marginTop: '2px' }}>
              {currentReq ? (
                <span>
                  Passenger Lead: <strong>{currentReq.requesterName}</strong> • Assigned: <strong>{currentReq.assignedVehiclePlate || 'Unassigned'}</strong> ({currentReq.assignedDriverName || 'Pending'})
                </span>
              ) : selectedChannelId === 'desk_direct' ? (
                <span>Direct inquiry channel with Central Transport Dispatcher (Md. Kamruzzaman)</span>
              ) : (
                <span>Official BOGCL logistics and fleet operations frequency</span>
              )}
            </div>
          </div>

          {/* Quick Call Action Button */}
          {currentReq?.assignedDriverPhone && (
            <button
              onClick={() => triggerCall(
                currentReq.assignedDriverName || 'Driver',
                `Official Assigned Driver • ${currentReq.assignedVehiclePlate || 'Duty Car'}`,
                currentReq.assignedDriverPhone || '+880 1711-229944'
              )}
              className="btn-outline"
              style={{
                fontSize: '11.5px',
                padding: '5px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                borderColor: '#10B981',
                color: '#047857',
                background: '#ECFDF5'
              }}
              title="Call Assigned Driver"
            >
              <PhoneCall size={13} />
              <span>{t('Call Driver', 'কল চালক', lang)}</span>
            </button>
          )}

          {selectedChannelId === 'desk_direct' && (
            <button
              onClick={() => triggerCall(
                'Md. Kamruzzaman',
                'Supervisor, Central Transport & Admin Division',
                '+880 1711-229944'
              )}
              className="btn-outline"
              style={{
                fontSize: '11.5px',
                padding: '5px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                borderColor: '#2563EB',
                color: '#1D4ED8',
                background: '#EFF6FF'
              }}
            >
              <PhoneCall size={13} />
              <span>{t('Call Transport Cell', 'পরিবহন সেল কল', lang)}</span>
            </button>
          )}
        </div>

        {/* Message Stream */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          background: '#FAFBFD'
        }}>
          {activeMessages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94A3B8' }}>
              <MessageSquare size={36} color="#CBD5E1" style={{ margin: '0 auto 10px' }} />
              <div style={{ fontWeight: 700, fontSize: '13px' }}>{t('No messages in this frequency yet', 'এই চ্যানেলে এখনও কোনো বার্তা নেই', lang)}</div>
              <div style={{ fontSize: '11.5px', marginTop: '4px' }}>
                {t('Post a coordination update or waypoint note to begin.', 'সমন্বয় বার্তা লিখে কথোপকথন শুরু করুন।', lang)}
              </div>
            </div>
          ) : (
            activeMessages.map(m => {
              const isMine = (isEmployee && m.senderRole === 'employee') || (!isEmployee && m.senderRole === 'admin');
              const isStaff = m.senderRole === 'employee';
              const isDriver = m.senderRole === 'driver';
              const isAdmin = m.senderRole === 'admin';
              const isSystem = m.senderRole === 'system';

              return (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isMine ? 'flex-end' : 'flex-start',
                    width: '100%'
                  }}
                >
                  {/* Sender Header */}
                  <div style={{
                    fontSize: '10.5px',
                    fontWeight: 700,
                    marginBottom: '3px',
                    color: isMine ? 'var(--brand-crimson)' : isStaff ? '#1D4ED8' : isDriver ? '#047857' : isAdmin ? '#B45309' : '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}>
                    {isStaff && <span>🧑‍💼 {m.senderName}</span>}
                    {isDriver && <span>🚙 {m.senderName}</span>}
                    {isAdmin && <span>👮 {m.senderName}</span>}
                    {isSystem && <span>🤖 {m.senderName}</span>}
                    <span style={{ fontSize: '9.5px', color: '#94A3B8', fontWeight: 500 }}>{m.timestamp}</span>
                  </div>

                  {/* ── Rich Card 1: Toll Expense Claim Voucher ── */}
                  {m.messageType === 'toll_claim' && m.tollData ? (
                    <div style={{
                      maxWidth: '85%',
                      background: '#FFF',
                      border: '1.5px solid #F59E0B',
                      borderRadius: '12px',
                      padding: '12px 14px',
                      boxShadow: '0 4px 12px rgba(245, 158, 11, 0.08)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#B45309', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Receipt size={14} color="#D97706" />
                          OFFICIAL TOLL EXPENSE VOUCHER
                        </span>
                        <span className={`badge ${m.tollData.approved ? 'success' : 'warn'}`} style={{ fontSize: '9px' }}>
                          {m.tollData.approved ? '✓ Approved' : '⏳ Pending Audit'}
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11.5px', marginBottom: '8px' }}>
                        <div>
                          <div style={{ fontSize: '10px', color: '#64748B' }}>Toll Plaza / Bridge</div>
                          <div style={{ fontWeight: 800, color: '#0F172A' }}>{m.tollData.tollName}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '10px', color: '#64748B' }}>Claimed Amount</div>
                          <div style={{ fontWeight: 900, color: '#059669', fontSize: '13px' }}>৳{m.tollData.amount.toLocaleString()}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '10px', color: '#64748B' }}>Receipt Voucher #</div>
                          <div style={{ fontFamily: 'monospace', fontWeight: 700 }}>{m.tollData.receiptNo}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '10px', color: '#64748B' }}>Billing Account</div>
                          <div style={{ fontFamily: 'monospace', color: '#1D4ED8' }}>CC-SALES-DHAKA-102</div>
                        </div>
                      </div>

                      {/* Interactive Audit Action strictly for Transport Admin */}
                      {!isEmployee && !m.tollData.approved ? (
                        <div style={{ borderTop: '1px dashed #CBD5E1', paddingTop: '8px', display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                          <button
                            className="btn-primary"
                            style={{ fontSize: '10.5px', padding: '4px 10px', background: '#059669', borderColor: '#059669' }}
                            onClick={() => approveTollExpense(m.id, m.requisitionId, currentUserName)}
                          >
                            <Check size={12} /> {t('Approve ৳' + m.tollData.amount + ' Voucher', 'ভাউচার অনুমোদন করুন', lang)}
                          </button>
                        </div>
                      ) : m.tollData.approved ? (
                        <div style={{ fontSize: '10.5px', color: '#059669', fontWeight: 700, borderTop: '1px dashed #CBD5E1', paddingTop: '6px' }}>
                          ✓ Approved by {m.tollData.approvedBy || 'Transport Admin'} at {m.tollData.approvedAt || '09:50 AM'}
                        </div>
                      ) : (
                        <div style={{ fontSize: '10.5px', color: '#D97706', fontWeight: 600, borderTop: '1px dashed #CBD5E1', paddingTop: '6px' }}>
                          ⏳ Awaiting Central Transport Admin Review & Approval
                        </div>
                      )}
                    </div>
                  ) : m.messageType === 'location_share' && m.locationData ? (
                    /* ── Rich Card 2: Passenger Location Pin ── */
                    <div style={{
                      maxWidth: '85%',
                      background: '#EFF6FF',
                      border: '1.5px solid #3B82F6',
                      borderRadius: '12px',
                      padding: '12px 14px',
                      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.08)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <MapPin size={15} color="#2563EB" />
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#1D4ED8' }}>
                          LIVE PASSENGER PICKUP PIN
                        </span>
                      </div>
                      <div style={{ fontWeight: 800, fontSize: '12.5px', color: '#0F172A' }}>
                        {m.locationData.title}
                      </div>
                      <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>
                        {m.locationData.address}
                      </div>
                      <div style={{ fontSize: '10.5px', fontFamily: 'monospace', color: '#2563EB', marginTop: '4px', fontWeight: 700 }}>
                        GPS: {m.locationData.coordinates}
                      </div>
                    </div>
                  ) : (
                    /* ── Standard Text Bubble ── */
                    <div style={{
                      maxWidth: '80%',
                      padding: '9px 14px',
                      borderRadius: isMine ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                      fontSize: '12.5px',
                      lineHeight: '1.45',
                      background: isMine
                        ? 'linear-gradient(135deg, #A51C30 0%, #871424 100%)'
                        : isStaff
                        ? '#EFF6FF'
                        : isDriver
                        ? '#ECFDF5'
                        : isSystem
                        ? '#F1F5F9'
                        : '#FEF3C7',
                      color: isMine ? '#fff' : isStaff ? '#1E3A8A' : isDriver ? '#065F46' : isSystem ? '#0F172A' : '#78350F',
                      border: isMine
                        ? 'none'
                        : isStaff
                        ? '1px solid #BFDBFE'
                        : isDriver
                        ? '1px solid #A7F3D0'
                        : isSystem
                        ? '1px solid #CBD5E1'
                        : '1px solid #FDE68A',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                      wordBreak: 'break-word'
                    }}>
                      {m.text}
                      {isMine && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2px', opacity: 0.8 }}>
                          <CheckCheck size={12} color="#fff" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Typing Indicator */}
          {isTyping && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748B', fontStyle: 'italic' }}>
              <Loader2 size={12} className="animate-spin" color="var(--brand-crimson)" />
              <span>{isTyping} {t('is typing a response...', 'উত্তর লিখছেন...', lang)}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips (Tailored strictly to logged-in user) */}
        {selectedChannelId !== 'broadcast' && (
          <div style={{
            padding: '7px 14px',
            background: '#F1F5F9',
            borderTop: '1px solid var(--brand-slate-200)',
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            whiteSpace: 'nowrap'
          }}>
            {activeQuickChips.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  border: '1px solid #CBD5E1',
                  background: '#fff',
                  fontSize: '10.5px',
                  color: '#334155',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: 600
                }}
              >
                <span>{q}</span>
              </button>
            ))}
          </div>
        )}

        {/* Message Input Box & Actions Bar */}
        <div style={{
          padding: '10px 16px',
          borderTop: '1px solid var(--brand-slate-200)',
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          background: 'var(--brand-card-bg)'
        }}>
          {/* Share Location Button */}
          {currentReq && (
            <button
              onClick={handleShareLocation}
              style={{
                height: '38px',
                padding: '0 10px',
                border: '1px solid #BFDBFE',
                borderRadius: '8px',
                background: '#EFF6FF',
                color: '#1D4ED8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                fontWeight: 700
              }}
              title="Share GPS Pickup Pin"
            >
              <MapPin size={14} />
              <span>{t('Location', 'লোকেশন', lang)}</span>
            </button>
          )}

          {/* Claim Toll Voucher Button */}
          {currentReq && (
            <button
              onClick={() => setShowTollForm(true)}
              style={{
                height: '38px',
                padding: '0 10px',
                border: '1px solid #FDE68A',
                borderRadius: '8px',
                background: '#FFFBEB',
                color: '#B45309',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                fontWeight: 700
              }}
              title="Submit Toll Voucher"
            >
              <Receipt size={14} />
              <span>{t('Toll Claim', 'টোল দাবি', lang)}</span>
            </button>
          )}

          <input
            type="text"
            className="input-text"
            style={{
              flex: 1,
              height: '38px',
              fontSize: '12.5px',
              paddingLeft: '12px',
              borderRadius: '8px'
            }}
            placeholder={
              selectedChannelId === 'broadcast'
                ? (!isEmployee ? t('Post official broadcast announcement to fleet...', 'ঘোষণা পোস্ট করুন...', lang) : t('Channel is read-only for employees', 'এই চ্যানেলটি শুধুমাত্র প্রশাসকদের জন্য', lang))
                : selectedChannelId === 'emergency_sos'
                ? t('Report highway emergency, tire puncture or accident...', 'জরুরি সহায়তা চেয়ে বার্তা দিন...', lang)
                : selectedChannelId === 'desk_direct'
                ? t('Message Transport Supervisor (Md. Kamruzzaman)...', 'পরিবহন সুপারভাইজারকে বার্তা দিন...', lang)
                : t(`Message Driver ${currentReq?.assignedDriverName ? currentReq.assignedDriverName.split(' ')[0] : ''} & Central Dispatch...`, 'বার্তা লিখুন...', lang)
            }
            disabled={selectedChannelId === 'broadcast' && isEmployee}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          <button
            className="btn-primary"
            style={{
              height: '38px',
              padding: '0 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 700,
              borderRadius: '8px'
            }}
            disabled={selectedChannelId === 'broadcast' && isEmployee}
            onClick={() => handleSendMessage()}
          >
            <span>{t('Send', 'পাঠান', lang)}</span>
            <Send size={13} />
          </button>
        </div>
      </div>

      {/* ─── COLUMN 3: CONTEXTUAL TRIP DOSSIER & ACTIONS ───────────── */}
      <div style={{
        borderLeft: '1px solid var(--brand-slate-200)',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--brand-card-bg)',
        overflowY: 'auto'
      }}>
        {currentReq ? (
          <div style={{ padding: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--brand-slate-400)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
              {t('Official Trip Challan Dossier', 'ডিজিটাল ট্রিপ চালান তথ্য', lang)}
            </div>

            {/* Dossier Card */}
            <div style={{
              background: '#F8FAFC',
              border: '1px solid var(--brand-slate-200)',
              borderRadius: '10px',
              padding: '12px',
              marginBottom: '14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontWeight: 900, color: 'var(--brand-slate-900)', fontFamily: 'monospace', fontSize: '13px' }}>
                  {currentReq.id}
                </span>
                <span className={`badge ${currentReq.status === 'completed' ? 'success' : currentReq.status === 'in_transit' ? 'info' : 'warn'}`} style={{ fontSize: '9px' }}>
                  {currentReq.status.toUpperCase()}
                </span>
              </div>

              <div style={{ fontSize: '12px', fontWeight: 700, color: '#1E293B', marginBottom: '4px' }}>
                📍 {currentReq.to}
              </div>

              <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-500)', lineHeight: '1.4' }}>
                Origin: {currentReq.from.split(',')[0]}
              </div>

              <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #CBD5E1', fontSize: '11px', display: 'flex', justifyContent: 'space-between' }}>
                <span>{t('Departure:', 'যাত্রা:', lang)} <strong>{currentReq.departureTime}</strong></span>
                <span>{currentReq.passengersCount} Pax</span>
              </div>
            </div>

            {/* Assigned Driver Live Hotline Card */}
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--brand-slate-400)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
              {t('Assigned Driver Contact', 'দায়িত্বরত চালকের তথ্য', lang)}
            </div>

            {currentReq.assignedDriverName ? (
              <div style={{
                background: '#ECFDF5',
                border: '1px solid #A7F3D0',
                borderRadius: '10px',
                padding: '12px',
                marginBottom: '14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: '#059669',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '13px'
                  }}>
                    {currentReq.assignedDriverName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: '12.5px', color: '#065F46' }}>
                      {currentReq.assignedDriverName}
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#047857' }}>
                      BRTA Hazmat Certified • 0.00% BAC
                    </div>
                  </div>
                </div>

                <div style={{
                  marginTop: '10px',
                  display: 'flex',
                  gap: '6px'
                }}>
                  <button
                    onClick={() => triggerCall(
                      currentReq.assignedDriverName || 'Driver',
                      `Official Assigned Driver • ${currentReq.assignedVehiclePlate || 'Duty Car'}`,
                      currentReq.assignedDriverPhone || '+880 1711-229944'
                    )}
                    style={{
                      flex: 1,
                      height: '32px',
                      background: '#059669',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px'
                    }}
                  >
                    <Phone size={12} />
                    <span>{t('Cell Call', 'সরাসরি কল', lang)}</span>
                  </button>

                  <a
                    href={`tel:${currentReq.assignedDriverPhone || '+8801711229944'}`}
                    style={{
                      height: '32px',
                      padding: '0 10px',
                      background: '#fff',
                      border: '1px solid #A7F3D0',
                      borderRadius: '6px',
                      color: '#065F46',
                      fontSize: '11px',
                      fontWeight: 700,
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {currentReq.assignedDriverPhone?.slice(-4) || 'Dial'}
                  </a>
                </div>
              </div>
            ) : (
              <div style={{ padding: '12px', background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '8px', fontSize: '11px', color: '#92400E', marginBottom: '14px' }}>
                ⏳ Transport Admin is currently allocating an available driver from pool.
              </div>
            )}

            {/* Quick Trip Pass Launcher */}
            <div style={{ marginBottom: '14px' }}>
              <button
                onClick={() => onNavigateToTripPass?.(currentReq)}
                className="btn-outline"
                style={{
                  width: '100%',
                  fontSize: '11.5px',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  borderColor: '#2563EB',
                  color: '#1D4ED8',
                  background: '#EFF6FF'
                }}
              >
                <QrCode size={14} />
                <span>{t('View Official Security Gate Pass', 'গেট পাস প্রদর্শন', lang)}</span>
              </button>
            </div>

            {/* Claim Toll Voucher Drawer */}
            {showTollForm ? (
              <div style={{
                background: '#FFFBEB',
                border: '1px solid #FCD34D',
                borderRadius: '10px',
                padding: '12px',
                marginBottom: '14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#B45309', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Receipt size={13} />
                    {t('New Toll Claim Slip', 'নতুন টোল ভাউচার', lang)}
                  </span>
                  <button
                    onClick={() => setShowTollForm(false)}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#92400E', fontWeight: 700 }}
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleAddToll}>
                  <div style={{ marginBottom: '8px' }}>
                    <label style={{ fontSize: '10px', fontWeight: 700, color: '#78350F' }}>Toll Plaza Name</label>
                    <select
                      value={tollName}
                      onChange={(e) => setTollName(e.target.value)}
                      style={{ width: '100%', fontSize: '11px', padding: '4px', borderRadius: '4px', border: '1px solid #FCD34D' }}
                    >
                      <option value="Mayor Hanif Flyover">Mayor Hanif Flyover</option>
                      <option value="Padma Multipurpose Bridge">Padma Multipurpose Bridge</option>
                      <option value="Bangabandhu Jamuna Bridge">Bangabandhu Jamuna Bridge</option>
                      <option value="Meghna & Gumti Bridges">Meghna & Gumti Bridges</option>
                      <option value="Dhaka Elevated Expressway">Dhaka Elevated Expressway</option>
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '10px' }}>
                    <div>
                      <label style={{ fontSize: '10px', fontWeight: 700, color: '#78350F' }}>Amount (BDT)</label>
                      <input
                        type="number"
                        value={tollAmount}
                        onChange={(e) => setTollAmount(e.target.value)}
                        style={{ width: '100%', fontSize: '11px', padding: '4px', borderRadius: '4px', border: '1px solid #FCD34D' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '10px', fontWeight: 700, color: '#78350F' }}>Slip / Receipt #</label>
                      <input
                        type="text"
                        value={tollReceiptNo}
                        onChange={(e) => setTollReceiptNo(e.target.value)}
                        style={{ width: '100%', fontSize: '11px', padding: '4px', borderRadius: '4px', border: '1px solid #FCD34D' }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn-gold"
                    style={{ width: '100%', fontSize: '11px', padding: '6px', fontWeight: 800 }}
                  >
                    {t('Submit Voucher to Chat', 'ভাউচার দাখিল করুন', lang)}
                  </button>
                </form>
              </div>
            ) : (
              <button
                onClick={() => setShowTollForm(true)}
                className="btn-outline"
                style={{
                  width: '100%',
                  fontSize: '11px',
                  padding: '7px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  borderColor: '#D4AF37',
                  color: '#B45309'
                }}
              >
                <Plus size={13} />
                <span>{t('Claim Flyover / Bridge Toll', 'টোল ভাউচার যোগ করুন', lang)}</span>
              </button>
            )}
          </div>
        ) : (
          <div style={{ padding: '20px 16px', textAlign: 'center', color: '#94A3B8' }}>
            <Compass size={32} color="#CBD5E1" style={{ margin: '0 auto 8px' }} />
            <div style={{ fontSize: '12px', fontWeight: 700 }}>{t('Central Logistics Channel', 'সেন্ট্রাল লজিস্টিকস চ্যানেল', lang)}</div>
            <div style={{ fontSize: '11px', marginTop: '4px' }}>
              {t('Broadcast notices & highway advisories broadcasted company-wide.', 'কোম্পানি-ব্যাপী সকল সড়ক ও বহর সংক্রান্ত নির্দেশনা।', lang)}
            </div>
          </div>
        )}
      </div>

      {/* ─── VOICE CELLULAR CALL MODAL ──────────────────────────────── */}
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
