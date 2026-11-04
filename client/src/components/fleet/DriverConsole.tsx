import React, { useState } from 'react';
import { useFleetStore, VehicleRequisition, Driver } from '../../store/fleetStore';
import { t } from '../../types';
import { showToast } from '../ToastManager';
import DriverCallModal from './DriverCallModal';
import { EmptyState } from '../ui';
import { useCurrentUser } from '../../auth/session';
import { driverRecordFor, ENABLE_FLEET_CHAT_DESK } from '../../views/fleet/config';
import { nextRef } from '../../lib/refs';
import { nowTime } from '../../lib/clock';
import {
  Car, UserCheck, ShieldCheck, Phone, MessageSquare, AlertTriangle,
  MapPin, CheckCircle2, Navigation, AlertOctagon, Receipt,
  Coffee, Gauge, X
} from 'lucide-react';

interface DriverConsoleProps {
  lang: 'en' | 'bn';
  onOpenChat: (req: VehicleRequisition) => void;
}

export default function DriverConsole(props: DriverConsoleProps) {
  const user = useCurrentUser();
  const { drivers } = useFleetStore();
  const currentDriver = user ? driverRecordFor(user, drivers) : undefined;

  if (!currentDriver) {
    return (
      <EmptyState
        icon={<Car size={22} />}
        title={t('No driver record linked to your account', 'আপনার অ্যাকাউন্টে কোনো চালক রেকর্ড যুক্ত নেই', props.lang)}
        description={t('Ask the transport cell to link your employee ID to the driver roster.', 'আপনার কর্মী আইডি চালক তালিকায় যুক্ত করতে ট্রান্সপোর্ট সেলকে বলুন।', props.lang)}
      />
    );
  }
  return <DriverConsoleBody {...props} currentDriver={currentDriver} />;
}

function DriverConsoleBody({ lang, onOpenChat, currentDriver }: DriverConsoleProps & { currentDriver: Driver }) {
  const {
    requisitions,
    startTrip,
    completeTrip,
    updateDriverStatus,
    sendChatMessage,
  } = useFleetStore();

  const assignedMissions = requisitions.filter(
    r => r.assignedDriverId === currentDriver.id && (r.status === 'assigned' || r.status === 'in_transit')
  );
  const activeMission = assignedMissions[0];

  // Call Modal State
  const [showCallModal, setShowCallModal] = useState(false);
  const [calleeInfo, setCalleeInfo] = useState({ name: '', role: '', phone: '' });

  // Toll Claim Modal State
  const [showTollModal, setShowTollModal] = useState(false);
  const [tollAmount, setTollAmount] = useState('150');
  const [tollPlaza, setTollPlaza] = useState('Babubazar Second Buriganga Bridge');
  const [tollClaims, setTollClaims] = useState([
    { id: 'TOL-901', plaza: 'Babubazar Buriganga Bridge', amount: 150, time: '09:40 AM', status: 'Approved' },
    { id: 'TOL-884', plaza: 'Mayor Hanif Flyover (Dhaka Exit)', amount: 260, time: 'Yesterday', status: 'Reimbursed' },
  ]);

  // Start Trip Dialog State
  const [showStartTripDialog, setShowStartTripDialog] = useState(false);
  const [startOdoInput, setStartOdoInput] = useState('42350');

  // Complete Trip Dialog State
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [closingOdoInput, setClosingOdoInput] = useState('42435');

  // Emergency SOS State
  const [sosSent, setSosSent] = useState(false);

  // Helper to handle driver status changes
  const handleStatusChange = (newStatus: Driver['status']) => {
    updateDriverStatus(currentDriver.id, newStatus);
    showToast(
      lang === 'en'
        ? `Driver status updated to: ${newStatus.replace('_', ' ').toUpperCase()}`
        : `চালক স্ট্যাটাস আপডেট: ${newStatus}`,
      'info'
    );
  };

  // 1. Notify Passenger of Arrival at Bay
  const handleNotifyArrival = () => {
    if (!activeMission) return;
    sendChatMessage(
      activeMission.id,
      'driver',
      currentDriver.name,
      `📍 Salam Sir, I have arrived at the designated pickup bay (${activeMission.from.split(',')[0]}). The vehicle (${activeMission.assignedVehiclePlate || 'Assigned Car'}) is parked, AC running at 21°C. Ready whenever you are.`
    );
    showToast(
      lang === 'en'
        ? `✓ Arrival alert dispatched to ${activeMission.requesterName}! Message broadcasted to Central Dispatch.`
        : `✓ যাত্রী ${activeMission.requesterName}-কে গাড়ির আগমন বার্তা পাঠানো হয়েছে!`,
      'success'
    );
  };

  // 2. Start Trip Handler
  const handleConfirmStartJourney = () => {
    if (!activeMission) return;
    const odo = parseInt(startOdoInput, 10) || 42350;
    startTrip(activeMission.id, odo, nowTime());
    setShowStartTripDialog(false);
    showToast(
      lang === 'en'
        ? `🚀 Journey started for ${activeMission.id}! Gate-out departure recorded (Odometer: ${odo.toLocaleString()} km).`
        : `🚀 ট্রিপ শুরু হয়েছে! ওডোমিটার: ${odo.toLocaleString()} কিমি।`,
      'success'
    );
  };

  // 3. Complete Trip Handler
  const handleConfirmCompleteJourney = () => {
    if (!activeMission) return;
    const odo = parseInt(closingOdoInput, 10) || 42435;
    completeTrip(
      activeMission.id,
      odo,
      nowTime(),
      5,
      'Trip completed smoothly by duty driver.'
    );
    setShowCompleteDialog(false);
    showToast(
      lang === 'en'
        ? `✓ Mission ${activeMission.id} marked as COMPLETED! Inward security clearance logged & vehicle returned to pool.`
        : `✓ ট্রিপ সম্পন্ন! গাড়ি পুলে ফেরত এসেছে।`,
      'success'
    );
  };

  // 4. Initiate Call
  const initiateCall = (name: string, role: string, phone: string) => {
    setCalleeInfo({ name, role, phone });
    setShowCallModal(true);
  };

  // 5. Submit Toll Claim
  const handleAddTollClaim = () => {
    const amt = parseFloat(tollAmount) || 0;
    if (amt <= 0) return;
    const newClaim = {
      id: nextRef('TOL'),
      plaza: tollPlaza,
      amount: amt,
      time: nowTime(),
      status: 'Pending Dispatch Review',
    };
    setTollClaims([newClaim, ...tollClaims]);
    if (activeMission) {
      sendChatMessage(
        activeMission.id,
        'driver',
        currentDriver.name,
        `Claimed official highway toll: ${tollPlaza} (৳${amt}). Receipt voucher: ${newClaim.id}`,
        { messageType: 'toll_claim', tollData: { tollName: tollPlaza, amount: amt, receiptNo: newClaim.id, approved: false } }
      );
    }
    setShowTollModal(false);
    showToast(
      lang === 'en'
        ? `✓ Toll voucher of ৳${amt} submitted to Central Transport Desk!`
        : `✓ ৳${amt} টাকার টোল স্লিপ জমা দেওয়া হয়েছে!`,
      'success'
    );
  };

  // 6. Emergency SOS Trigger
  const handleTriggerSos = () => {
    setSosSent(true);
    if (activeMission) {
      sendChatMessage(
        activeMission.id,
        'driver',
        currentDriver.name,
        `🚨 EMERGENCY SOS: breakdown or route problem on the way to ${activeMission.to}. Immediate assistance requested.`
      );
    }
    showToast(
      lang === 'en'
        ? '🚨 EMERGENCY SOS DISPATCHED: Central Transport Command & Highway Patrol alerted!'
        : '🚨 জরুরী এসওএস বার্তা পাঠানো হয়েছে! পরিবহন কন্ট্রোল রুমে সতর্কবার্তা প্রেরিত।',
      'danger'
    );
  };

  return (
    <div className="driver-console-container">
      {/* ─── Driver Profile & Terminal Header ───────────────────────── */}
      <div className="driver-profile-header">
        <div className="driver-profile-left">
          <div className="driver-avatar-medallion">
            <UserCheck size={32} />
            <span className="driver-badge-verified">✓</span>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-on-brand)', letterSpacing: '-0.3px' }}>
                {currentDriver.name}
              </h2>
              <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: 'rgba(217, 119, 6, 0.2)', border: '1px solid rgba(217, 119, 6, 0.4)', color: 'var(--status-warning-bright)' }}>
                {t('Driver ID', 'চালক আইডি', lang)} {currentDriver.id}
              </span>
              <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: 'rgba(16, 185, 129, 0.2)', border: '1px solid rgba(16, 185, 129, 0.4)', color: 'var(--status-success-bright)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={13} />
                {t('0.00% BAC Sobriety Cleared', 'মদ্যপানমুক্ত ০.০০% সনদপ্রাপ্ত', lang)}
              </span>
            </div>

            <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: 'var(--text-inverse-2)', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span>{t('Assigned Vehicle:', 'বরাদ্দকৃত গাড়ি:', lang)} <strong style={{ color: 'var(--text-on-brand)', fontFamily: 'monospace' }}>{currentDriver.assignedVehiclePlate || '—'}</strong></span>
              <span>•</span>
              <span>{t('License:', 'ড্রাইভিং লাইসেন্স:', lang)} <strong style={{ color: 'var(--text-on-brand)' }}>{currentDriver.licenseNo}</strong></span>
              <span>•</span>
              <span>{t('Safety Rating:', 'নিরাপত্তা রেটিং:', lang)} <strong style={{ color: 'var(--status-warning-bright)' }}>★ {currentDriver.rating} / 5.0</strong></span>
            </p>
          </div>
        </div>

        {/* Driver Availability Quick Switcher */}
        <div className="driver-status-switcher">
          <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)', padding: '0 4px' }}>
            {t('My Duty Status:', 'আমার বর্তমান অবস্থা:', lang)}
          </span>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              onClick={() => handleStatusChange('available')}
              className={`driver-status-btn ${currentDriver.status === 'available' ? 'active-available' : ''}`}
            >
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--status-success-bright)' }} />
              {t('On Duty (Ready)', 'উপস্থিত', lang)}
            </button>
            <button
              onClick={() => handleStatusChange('on_trip')}
              className={`driver-status-btn ${currentDriver.status === 'on_trip' ? 'active-on_trip' : ''}`}
            >
              <Car size={13} />
              {t('En Route (On Trip)', 'ট্রিপে আছি', lang)}
            </button>
            <button
              onClick={() => handleStatusChange('rest_required')}
              className={`driver-status-btn ${currentDriver.status === 'rest_required' ? 'active-rest' : ''}`}
            >
              <Coffee size={13} />
              {t('Rest Break (15m)', 'বিরতি', lang)}
            </button>
          </div>
        </div>
      </div>

      {/* ─── Active Mission Terminal Cockpit ────────────────────────── */}
      {activeMission ? (
        <div className="driver-mission-card">
          {/* Mission Top Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', paddingBottom: '16px', borderBottom: '1px solid var(--brand-slate-200)', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ padding: '4px 10px', borderRadius: '6px', background: 'var(--status-warning-solid)', color: 'var(--text-on-brand)', fontWeight: 800, fontSize: '11px', letterSpacing: '0.5px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <Navigation size={13} />
                {activeMission.status === 'in_transit' ? t('IN TRANSIT', 'চলমান ট্রিপ', lang) : t('ASSIGNED MISSION', 'বরাদ্দকৃত মিশন', lang)}
              </span>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--brand-slate-900)' }}>
                {t('Requisition Pass #', 'রিকুইজিশন পাস #', lang)}{activeMission.id}
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--brand-slate-500)', fontWeight: 600 }}>
                • {activeMission.tripType === 'round_trip' ? t('Round Trip Return', 'রাউন্ড ট্রিপ', lang) : t('One-Way Drop-off', 'একমুখী ড্রপ', lang)}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {ENABLE_FLEET_CHAT_DESK && (
                <button
                  onClick={() => onOpenChat(activeMission)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, background: 'var(--status-info-bg)', color: 'var(--status-info-text)', border: '1px solid var(--status-info-border)', cursor: 'pointer' }}
                >
                  <MessageSquare size={13} />
                  {t('Mission Chat (3-Way)', 'ট্রিপ চ্যাট', lang)}
                </button>
              )}
              <button
                onClick={() => initiateCall(activeMission.requesterName, activeMission.dept, activeMission.phone || '+880 1712-334455')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, background: 'var(--status-success-bg)', color: 'var(--status-success-text)', border: '1px solid var(--status-success-border)', cursor: 'pointer' }}
              >
                <Phone size={13} />
                {t('Call Passenger Lead', 'যাত্রীকে কল দিন', lang)}
              </button>
            </div>
          </div>

          {/* Mission Details 2-Column Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            {/* Route & Passenger Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="driver-route-block">
                <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--status-warning-text)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Navigation size={14} color="var(--status-warning)" />
                  {t('Transit Route & Multi-Stop Waypoints', 'যাত্রাপথ ও ভায়া স্টপসমূহ', lang)}
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '4px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--status-success-solid)' }} />
                    <span style={{ width: '2px', height: '36px', background: 'var(--brand-slate-300)', margin: '4px 0' }} />
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--status-danger-solid)' }} />
                  </div>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)', fontWeight: 600 }}>{t('Pickup Origin Bay', 'পিকআপ স্থান', lang)}</div>
                      <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--brand-slate-900)' }}>
                        {activeMission.from}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)', fontWeight: 600 }}>{t('Target Destination', 'গন্তব্য', lang)}</div>
                      <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--brand-slate-900)' }}>
                        {activeMission.to}
                      </div>
                    </div>
                  </div>
                </div>

                {activeMission.intermediateStops && activeMission.intermediateStops.length > 0 && (
                  <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--brand-slate-200)' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-slate-500)', marginBottom: '6px' }}>
                      {t('Scheduled Intermediate Waypoints:', 'নির্ধারিত বিরতিসমূহ:', lang)}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {activeMission.intermediateStops.map((stop, i) => (
                        <span key={i} style={{ padding: '3px 8px', borderRadius: '6px', background: 'var(--surface-1)', fontSize: '11px', fontWeight: 600, color: 'var(--brand-slate-700)', border: '1px solid var(--brand-slate-200)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: 'rgba(217, 119, 6, 0.15)', color: 'var(--status-warning)', fontSize: '9px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                            {i + 1}
                          </span>
                          {stop.location}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Passenger & Purpose Manifest */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="driver-manifest-card">
                  <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)', fontWeight: 700, textTransform: 'uppercase' }}>{t('Passenger Manifest', 'যাত্রীদের তালিকা', lang)}</div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--brand-slate-900)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{activeMission.passengerNames}</span>
                    <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '10px', background: 'var(--surface-3)', color: 'var(--text-2)', fontWeight: 700 }}>
                      {activeMission.passengersCount} Pax
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)', marginTop: '4px' }}>
                    Lead: {activeMission.requesterName} ({activeMission.dept})
                  </div>
                </div>

                <div className="driver-manifest-card">
                  <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)', fontWeight: 700, textTransform: 'uppercase' }}>{t('Official Purpose', 'দাপ্তরিক উদ্দেশ্য', lang)}</div>
                  <div style={{ fontSize: '12px', color: 'var(--brand-slate-700)', fontWeight: 600, marginTop: '2px', lineHeight: 1.4 }}>
                    {activeMission.purpose}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--status-warning)', fontWeight: 700, marginTop: '4px' }}>
                    Departure: {activeMission.departureTime}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Action Progression Controls */}
            <div className="driver-progression-panel">
              <div>
                <h4 style={{ margin: '0 0 14px 0', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--status-warning-text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Gauge size={15} color="var(--status-warning)" />
                  {t('Mission Action Progression', 'মিশন বাস্তবায়ন ধাপসমূহ', lang)}
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {/* Step 1: Arrive at Bay */}
                  <button
                    onClick={handleNotifyArrival}
                    className="driver-progression-btn bay"
                  >
                    <MapPin size={18} />
                    <span>{t('1. Arrived at Pickup Bay', '১. পিকআপ পয়েন্টে পৌঁছেছি', lang)}</span>
                  </button>

                  {/* Step 2: Start Trip */}
                  {activeMission.status === 'assigned' && (
                    <button
                      onClick={() => setShowStartTripDialog(true)}
                      className="driver-progression-btn start"
                    >
                      <Navigation size={18} />
                      <span>{t('2. Start Journey (Gate-Out Pass)', '২. যাত্রা শুরু (গেট আউট)', lang)}</span>
                    </button>
                  )}

                  {/* Step 3: Complete Trip */}
                  {activeMission.status === 'in_transit' && (
                    <button
                      onClick={() => setShowCompleteDialog(true)}
                      className="driver-progression-btn complete"
                    >
                      <CheckCircle2 size={18} />
                      <span>{t('3. Complete Journey (Gate-In Pass)', '৩. যাত্রা সমাপ্ত (গেট ইন)', lang)}</span>
                    </button>
                  )}

                  {/* Step 4: Quick Toll Claim */}
                  <button
                    onClick={() => setShowTollModal(true)}
                    className="driver-progression-btn toll"
                  >
                    <Receipt size={18} color="var(--status-warning)" />
                    <span>{t('Log Highway Toll Voucher', 'হাইওয়ে টোল ভাউচার এন্ট্রি', lang)}</span>
                  </button>
                </div>
              </div>

              {/* Highway SOS Button */}
              <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--brand-slate-200)' }}>
                <button
                  onClick={handleTriggerSos}
                  disabled={sosSent}
                  className="driver-sos-btn"
                >
                  <AlertOctagon size={18} />
                  <span>{sosSent ? t('SOS Broadcast Active', 'জরুরী সতর্কবার্তা সচল', lang) : t('Emergency Highway SOS', 'জরুরী হাইওয়ে এসওএস', lang)}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="driver-mission-card" style={{ padding: '36px', textAlign: 'center' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'var(--brand-slate-100)', color: 'var(--brand-slate-400)', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={30} color="var(--status-success)" />
          </div>
          <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 800, color: 'var(--brand-slate-900)' }}>
            {t('No Active Missions Pending', 'এই মুহূর্তে কোনো নতুন ট্রিপ নেই', lang)}
          </h3>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--brand-slate-500)', maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 }}>
            {t('You are on standby at Bashundhara HQ Driver Pool. Central Transport Dispatch will alert you when a new duty travel requisition is assigned.', 'আপনি সদর দপ্তরে স্ট্যান্ডবাই আছেন। নতুন রিকুইজিশন বরাদ্দ হলে নোটিফিকেশন পাবেন।', lang)}
          </p>
        </div>
      )}

      {/* ─── Toll Slips & Highway Vouchers Table ─────────────────────── */}
      <div className="driver-ledger-card">
        <div className="driver-ledger-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Receipt size={18} color="var(--status-warning)" />
            <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: 'var(--brand-slate-900)' }}>
              {t('My Toll & Conveyance Slips (Reimbursement Ledger)', 'আমার টোল ও কনভেয়েন্স স্লিপসমূহ', lang)}
            </h3>
          </div>
          <button
            onClick={() => setShowTollModal(true)}
            style={{ fontSize: '12px', fontWeight: 700, color: 'var(--status-warning)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            + {t('Submit New Voucher', 'নতুন ভাউচার', lang)}
          </button>
        </div>

        <div>
          {tollClaims.map((claim) => (
            <div key={claim.id} className="driver-ledger-row">
              <div>
                <div style={{ fontWeight: 800, color: 'var(--brand-slate-900)', fontSize: '12.5px' }}>{claim.plaza}</div>
                <div style={{ fontSize: '11px', color: 'var(--brand-slate-400)', marginTop: '2px' }}>ID: {claim.id} • {claim.time}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--brand-slate-900)', fontSize: '13.5px' }}>
                  ৳{claim.amount}
                </div>
                <span className={`badge ${claim.status.includes('Approved') || claim.status.includes('Reimbursed') ? 'success' : 'warn'}`}>
                  {claim.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── MODAL 1: Start Trip Dialog ───────────────────────────────── */}
      {showStartTripDialog && activeMission && (
        <div className="modal-bg" onClick={() => setShowStartTripDialog(false)}>
          <div className="fleet-modal-dialog" style={{ maxWidth: '480px', width: '92%' }} onClick={(e) => e.stopPropagation()}>
            <div className="fleet-modal-hd" style={{ background: 'linear-gradient(135deg, var(--surface-inverse) 0%, var(--surface-inverse-2) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Navigation size={18} color="var(--status-warning)" />
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--text-on-brand)' }}>
                  {t('Start Highway Journey (Gate-Out Pass)', 'যাত্রা শুরু ও গেট পাস লগ', lang)}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowStartTripDialog(false)}
                style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', color: 'var(--text-inverse-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={15} />
              </button>
            </div>

            <div className="fleet-modal-body" style={{ padding: '24px 28px' }}>
              <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: 'var(--brand-slate-500)', lineHeight: 1.4 }}>
                {t('Record vehicle starting odometer reading and confirm passenger aboard.', 'ওডোমিটার রিডিং নিশ্চিত করে যাত্রা শুরু করুন।', lang)}
              </p>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--brand-slate-700)', marginBottom: '6px' }}>
                  {t('Current Starting Odometer (km)', 'শুরুর ওডোমিটার (কিমি)', lang)}
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setStartOdoInput(prev => String(Math.max(0, (parseInt(prev, 10) || 42350) - 5)))}
                    style={{ width: '48px', height: '44px', borderRadius: '10px', background: 'var(--brand-slate-100)', color: 'var(--brand-slate-700)', border: '1px solid var(--brand-slate-300)', fontWeight: 800, fontSize: '15px', cursor: 'pointer' }}
                  >
                    -5
                  </button>
                  <input
                    type="number"
                    value={startOdoInput}
                    onChange={(e) => setStartOdoInput(e.target.value)}
                    style={{ flex: 1, height: '44px', textAlign: 'center', borderRadius: '10px', border: '1.5px solid var(--brand-slate-300)', fontSize: '16px', fontWeight: 800, fontFamily: 'monospace' }}
                  />
                  <button
                    type="button"
                    onClick={() => setStartOdoInput(prev => String((parseInt(prev, 10) || 42350) + 5))}
                    style={{ width: '48px', height: '44px', borderRadius: '10px', background: 'var(--brand-slate-100)', color: 'var(--brand-slate-700)', border: '1px solid var(--brand-slate-300)', fontWeight: 800, fontSize: '15px', cursor: 'pointer' }}
                  >
                    +5
                  </button>
                </div>
              </div>

              <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'var(--status-warning-bg)', border: '1px solid var(--status-warning-bright)', fontSize: '11.5px', color: 'var(--status-warning-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <span>Speed limit: 60 km/h on Dhaka corridors, 80 km/h on expressways. Seatbelts mandatory.</span>
              </div>
            </div>

            <div className="fleet-modal-ft" style={{ padding: '14px 24px', backgroundColor: 'var(--surface-0)', borderTop: '1px solid var(--border-1)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowStartTripDialog(false)}
                style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, color: 'var(--text-2)', backgroundColor: 'var(--surface-1)', border: '1px solid var(--border-2)', cursor: 'pointer' }}
              >
                {t('Cancel', 'বাতিল', lang)}
              </button>
              <button
                type="button"
                onClick={handleConfirmStartJourney}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 18px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 800, color: 'var(--text-on-brand)', background: 'linear-gradient(135deg, var(--status-warning-solid) 0%, var(--status-warning-solid-dark) 100%)', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(217, 119, 6, 0.35)' }}
              >
                <Navigation size={14} />
                {t('Confirm Departure & Open Gate', 'যাত্রা শুরু নিশ্চিত করুন', lang)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: Complete Trip Dialog ────────────────────────────── */}
      {showCompleteDialog && activeMission && (
        <div className="modal-bg" onClick={() => setShowCompleteDialog(false)}>
          <div className="fleet-modal-dialog" style={{ maxWidth: '480px', width: '92%' }} onClick={(e) => e.stopPropagation()}>
            <div className="fleet-modal-hd" style={{ background: 'linear-gradient(135deg, var(--status-success-solid-dark) 0%, var(--status-success-solid-dark) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={18} color="var(--status-success-bright)" />
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--text-on-brand)' }}>
                  {t('Complete Journey (Inward Security Gate Pass)', 'যাত্রা সমাপ্তি ও ইনওয়ার্ড গেট পাস', lang)}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCompleteDialog(false)}
                style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', color: 'var(--text-inverse-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={15} />
              </button>
            </div>

            <div className="fleet-modal-body" style={{ padding: '24px 28px' }}>
              <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: 'var(--brand-slate-500)', lineHeight: 1.4 }}>
                {t('Enter ending odometer reading and return vehicle to pool.', 'সমাপনী ওডোমিটার রিডিং প্রদান করুন।', lang)}
              </p>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--brand-slate-700)', marginBottom: '6px' }}>
                  {t('Final Odometer Reading (km)', 'সমাপনী ওডোমিটার (কিমি)', lang)}
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setClosingOdoInput(prev => String(Math.max(0, (parseInt(prev, 10) || 42435) - 5)))}
                    style={{ width: '48px', height: '44px', borderRadius: '10px', background: 'var(--brand-slate-100)', color: 'var(--brand-slate-700)', border: '1px solid var(--brand-slate-300)', fontWeight: 800, fontSize: '15px', cursor: 'pointer' }}
                  >
                    -5
                  </button>
                  <input
                    type="number"
                    value={closingOdoInput}
                    onChange={(e) => setClosingOdoInput(e.target.value)}
                    style={{ flex: 1, height: '44px', textAlign: 'center', borderRadius: '10px', border: '1.5px solid var(--brand-slate-300)', fontSize: '16px', fontWeight: 800, fontFamily: 'monospace' }}
                  />
                  <button
                    type="button"
                    onClick={() => setClosingOdoInput(prev => String((parseInt(prev, 10) || 42435) + 5))}
                    style={{ width: '48px', height: '44px', borderRadius: '10px', background: 'var(--brand-slate-100)', color: 'var(--brand-slate-700)', border: '1px solid var(--brand-slate-300)', fontWeight: 800, fontSize: '15px', cursor: 'pointer' }}
                  >
                    +5
                  </button>
                </div>
              </div>

              <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'var(--status-success-bg)', border: '1px solid var(--status-success-border)', fontSize: '11.5px', color: 'var(--status-success-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                <span>Distance Traveled: ~{(parseInt(closingOdoInput, 10) || 42435) - 42350} km recorded in BOGCL fleet log.</span>
              </div>
            </div>

            <div className="fleet-modal-ft" style={{ padding: '14px 24px', backgroundColor: 'var(--surface-0)', borderTop: '1px solid var(--border-1)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowCompleteDialog(false)}
                style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, color: 'var(--text-2)', backgroundColor: 'var(--surface-1)', border: '1px solid var(--border-2)', cursor: 'pointer' }}
              >
                {t('Cancel', 'বাতিল', lang)}
              </button>
              <button
                type="button"
                onClick={handleConfirmCompleteJourney}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 18px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 800, color: 'var(--text-on-brand)', background: 'linear-gradient(135deg, var(--status-success-solid) 0%, var(--status-success-solid-dark) 100%)', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(5, 150, 105, 0.35)' }}
              >
                <CheckCircle2 size={14} />
                {t('Submit Inward Gate Pass', 'ইনওয়ার্ড পাস নিশ্চিত করুন', lang)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: Quick Toll Claim ────────────────────────────────── */}
      {showTollModal && (
        <div className="modal-bg" onClick={() => setShowTollModal(false)}>
          <div className="fleet-modal-dialog" style={{ maxWidth: '440px', width: '92%' }} onClick={(e) => e.stopPropagation()}>
            <div className="fleet-modal-hd" style={{ background: 'linear-gradient(135deg, var(--surface-inverse) 0%, var(--surface-inverse-2) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Receipt size={18} color="var(--status-warning)" />
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--text-on-brand)' }}>
                  {t('Submit Highway Toll Voucher', 'হাইওয়ে টোল ভাউচার দাখিল', lang)}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTollModal(false)}
                style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', color: 'var(--text-inverse-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={15} />
              </button>
            </div>

            <div className="fleet-modal-body" style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--brand-slate-700)', marginBottom: '6px' }}>
                  {t('Toll Plaza / Bridge Name', 'টোল প্লাজা বা সেতুর নাম', lang)}
                </label>
                <select
                  value={tollPlaza}
                  onChange={(e) => setTollPlaza(e.target.value)}
                  className="notice-select"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--brand-slate-300)', fontSize: '12px' }}
                >
                  <option value="Babubazar Second Buriganga Bridge">Babubazar Second Buriganga Bridge (৳150)</option>
                  <option value="Mayor Mohammad Hanif Flyover">Mayor Mohammad Hanif Flyover (৳260)</option>
                  <option value="Dhaka Elevated Expressway (Kuril-Farmgate)">Dhaka Elevated Expressway (৳80)</option>
                  <option value="Padma Multipurpose Bridge">Padma Multipurpose Bridge (৳800)</option>
                  <option value="Kanchpur Second Meghna Bridge">Kanchpur Second Meghna Bridge (৳120)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--brand-slate-700)', marginBottom: '6px' }}>
                  {t('Amount Paid (BDT)', 'প্রদেয় পরিমাণ (টাকা)', lang)}
                </label>
                <input
                  type="number"
                  value={tollAmount}
                  onChange={(e) => setTollAmount(e.target.value)}
                  className="notice-input"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--brand-slate-300)', fontSize: '14px', fontFamily: 'monospace', fontWeight: 700 }}
                />
              </div>
            </div>

            <div className="fleet-modal-ft" style={{ padding: '14px 24px', backgroundColor: 'var(--surface-0)', borderTop: '1px solid var(--border-1)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowTollModal(false)}
                style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, color: 'var(--text-2)', backgroundColor: 'var(--surface-1)', border: '1px solid var(--border-2)', cursor: 'pointer' }}
              >
                {t('Cancel', 'বাতিল', lang)}
              </button>
              <button
                type="button"
                onClick={handleAddTollClaim}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 18px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 800, color: 'var(--text-on-brand)', background: 'linear-gradient(135deg, var(--status-warning-solid) 0%, var(--status-warning-solid-dark) 100%)', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(217, 119, 6, 0.35)' }}
              >
                <Receipt size={14} />
                {t('Submit Voucher', 'ভাউচার দাখিল করুন', lang)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: Driver Phone Call Simulation ────────────────────── */}
      <DriverCallModal
        isOpen={showCallModal}
        onClose={() => setShowCallModal(false)}
        calleeName={calleeInfo.name}
        calleeRole={calleeInfo.role}
        calleePhone={calleeInfo.phone}
        lang={lang}
      />
    </div>
  );
}
