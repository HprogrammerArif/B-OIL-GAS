import React, { useEffect, useState } from 'react';
import { useFleetStore, VehicleRequisition, Driver } from '../../store/fleetStore';
import { t } from '../../types';
import { showToast } from '../ToastManager';
import DriverCallModal from './DriverCallModal';
import { EmptyState } from '../ui';
import { useCurrentUser } from '../../auth/session';
import { driverRecordFor, ENABLE_FLEET_CHAT_DESK } from '../../views/fleet/config';
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

const TOLL_PLAZAS: { name: string; amount: number }[] = [
  { name: 'Babubazar Second Buriganga Bridge', amount: 150 },
  { name: 'Mayor Mohammad Hanif Flyover', amount: 260 },
  { name: 'Dhaka Elevated Expressway (Kuril-Farmgate)', amount: 80 },
  { name: 'Padma Multipurpose Bridge', amount: 800 },
  { name: 'Kanchpur Second Meghna Bridge', amount: 120 },
];

function clock(totalSec: number): string {
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function DriverConsoleBody({ lang, onOpenChat, currentDriver }: DriverConsoleProps & { currentDriver: Driver }) {
  const {
    requisitions,
    driverTollSlips,
    startTrip,
    completeTrip,
    updateDriverStatus,
    submitDriverTollClaim,
    reviewDriverTollSlip,
    markPickupArrived,
    markDestinationArrived,
    raiseTripSos,
    clearTripSos,
    logDriverCall,
  } = useFleetStore();

  const assignedMissions = requisitions.filter(
    r => r.assignedDriverId === currentDriver.id && (r.status === 'assigned' || r.status === 'in_transit')
  );
  const activeMission = assignedMissions[0];

  // Call Modal State
  const [showCallModal, setShowCallModal] = useState(false);
  const [calleeInfo, setCalleeInfo] = useState({ name: '', role: '', phone: '' });

  const [showTollModal, setShowTollModal] = useState(false);
  const [tollPlaza, setTollPlaza] = useState(TOLL_PLAZAS[0].name);
  const [tollAmount, setTollAmount] = useState(String(TOLL_PLAZAS[0].amount));

  const [showStartTripDialog, setShowStartTripDialog] = useState(false);
  const [startOdoInput, setStartOdoInput] = useState('42350');

  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [closingOdoInput, setClosingOdoInput] = useState('42392');

  const [closedTrip, setClosedTrip] = useState<{ id: string; from: string; to: string; km: number; gateIn: string } | null>(null);
  const [, setRoadTick] = useState(0);

  const onRest = currentDriver.status === 'rest_required';
  const moving = activeMission?.status === 'in_transit';
  const atPickup = !!activeMission?.pickupArrivedAt;
  const atDestination = !!activeMission?.destinationArrivedAt;

  useEffect(() => {
    if (!moving || !activeMission?.gateOutEpoch) return;
    const id = window.setInterval(() => setRoadTick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [moving, activeMission?.gateOutEpoch, activeMission?.id]);

  const mySlips = driverTollSlips.filter((slip) =>
    requisitions.some((r) => r.id === slip.reqId && r.assignedDriverId === currentDriver.id),
  );

  const handleStatusChange = (newStatus: Driver['status']) => {
    if (newStatus === currentDriver.status && newStatus !== 'on_trip') return;
    if (newStatus === 'on_trip') {
      if (moving) return;
      showToast(
        t('You go en route when you start the journey from the mission card.', 'মিশন কার্ড থেকে যাত্রা শুরু করলেই আপনি পথে আছেন।', lang),
        'info',
      );
      if (atPickup && !onRest) setShowStartTripDialog(true);
      return;
    }
    if (newStatus === 'available' && moving) {
      showToast(
        t('This trip is still on the road. End it before marking yourself free.', 'ট্রিপ এখনো চলছে। ফ্রি হওয়ার আগে ট্রিপ শেষ করুন।', lang),
        'warn',
      );
      return;
    }
    if (newStatus === 'rest_required' && moving) {
      showToast(
        t('You are on the road. Reach the destination before a rest break.', 'আপনি পথে আছেন। বিরতির আগে গন্তব্যে পৌঁছান।', lang),
        'warn',
      );
      return;
    }
    updateDriverStatus(currentDriver.id, newStatus);
    showToast(
      newStatus === 'rest_required'
        ? t('Rest break started. Dispatch will not give you a new trip until you are back on duty.', 'বিরতি শুরু। ডিউটিতে ফেরার আগে নতুন ট্রিপ দেওয়া হবে না।', lang)
        : t('You are back on duty and ready for a trip.', 'আপনি আবার ডিউটিতে এবং ট্রিপের জন্য প্রস্তুত।', lang),
      'info',
    );
  };

  const handleNotifyArrival = () => {
    if (!activeMission || onRest) return;
    markPickupArrived(activeMission.id, currentDriver.name);
    showToast(
      t(
        `Told ${activeMission.requesterName} you are waiting at ${activeMission.from}.`,
        `${activeMission.requesterName}-কে জানানো হয়েছে আপনি ${activeMission.from}-এ অপেক্ষা করছেন।`,
        lang,
      ),
      'success',
    );
  };

  // 2. Start Trip Handler
  const handleConfirmStartJourney = () => {
    if (!activeMission) return;
    const odo = parseInt(startOdoInput, 10) || 42350;
    startTrip(activeMission.id, odo, nowTime());
    setClosingOdoInput(String(odo + 42));
    setShowStartTripDialog(false);
    showToast(
      t(
        `Gate-out recorded at ${odo.toLocaleString('en-IN')} km. You are on the road to ${activeMission.to}.`,
        `গেট-আউট ${odo.toLocaleString('bn-BD')} কিমিতে নথিভুক্ত। আপনি ${activeMission.to}-এর পথে।`,
        lang,
      ),
      'success',
    );
  };

  const handleConfirmCompleteJourney = () => {
    if (!activeMission) return;
    const startKm = activeMission.odometerStart ?? 42350;
    const odo = parseInt(closingOdoInput, 10) || startKm + 42;
    if (odo < startKm) {
      showToast(t('The closing reading cannot be lower than the start reading.', 'শেষ রিডিং শুরুর রিডিংয়ের চেয়ে কম হতে পারে না।', lang), 'warn');
      return;
    }
    const gateIn = nowTime();
    setClosedTrip({
      id: activeMission.id,
      from: activeMission.from,
      to: activeMission.to,
      km: odo - startKm,
      gateIn,
    });
    completeTrip(activeMission.id, odo, gateIn, 5, 'Trip completed smoothly by duty driver.');
    setShowCompleteDialog(false);
    showToast(
      t(
        `Trip closed. ${odo - startKm} km recorded and the car is back in the pool.`,
        `ট্রিপ শেষ। ${odo - startKm} কিমি নথিভুক্ত এবং গাড়ি পুলে ফিরেছে।`,
        lang,
      ),
      'success',
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
    if (amt <= 0 || !activeMission) return;
    const slip = submitDriverTollClaim(activeMission.id, currentDriver.name, tollPlaza, amt);
    setShowTollModal(false);
    showToast(
      t(
        `৳${amt.toLocaleString('en-IN')} toll sent to the transport desk. They review it next.`,
        `৳${amt.toLocaleString('bn-BD')} টোল পরিবহন ডেস্কে গেছে। তারা এখন দেখবেন।`,
        lang,
      ),
      'success',
    );
    window.setTimeout(() => {
      reviewDriverTollSlip(slip.id, 'Approved');
      showToast(
        t(
          `Transport desk approved ৳${amt.toLocaleString('en-IN')} for ${tollPlaza}. It will be paid with this month's conveyance.`,
          `পরিবহন ডেস্ক ${tollPlaza}-এর ৳${amt.toLocaleString('bn-BD')} অনুমোদন করেছে। এ মাসের কনভেয়েন্সের সাথে পরিশোধ হবে।`,
          lang,
        ),
        'success',
      );
    }, 2800);
  };

  const handleTriggerSos = () => {
    if (!activeMission) return;
    raiseTripSos(activeMission.id, currentDriver.name);
    showToast(
      t(
        'SOS sent. Transport desk and the passenger were told. Stay with the vehicle.',
        'এসওএস পাঠানো হয়েছে। পরিবহন ডেস্ক ও যাত্রীকে জানানো হয়েছে। গাড়ির কাছে থাকুন।',
        lang,
      ),
      'danger',
    );
  };

  const handleClearSos = () => {
    if (!activeMission) return;
    clearTripSos(activeMission.id, currentDriver.name);
    showToast(t('SOS cancelled. You reported that everyone is safe.', 'এসওএস বাতিল। সবাই নিরাপদ বলে জানিয়েছেন।', lang), 'success');
  };

  const roadElapsed = activeMission?.gateOutEpoch
    ? Math.max(0, Math.floor((Date.now() - activeMission.gateOutEpoch) / 1000))
    : 0;
  const roadKm = Math.min(42, Math.floor(roadElapsed / 3));
  const roadPct = atDestination ? 100 : Math.min(82, roadElapsed * 2);

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
                {moving
                  ? atDestination
                    ? t('AT DESTINATION', 'গন্তব্যে পৌঁছেছেন', lang)
                    : t('ON THE ROAD', 'পথে আছেন', lang)
                  : atPickup
                    ? t('AT PICKUP', 'পিকআপে আছেন', lang)
                    : t('ASSIGNED MISSION', 'বরাদ্দকৃত মিশন', lang)}
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
                    {t('Lead:', 'প্রধান:', lang)} {activeMission.requesterName} ({activeMission.dept})
                  </div>
                  {activeMission.passengerAck && (
                    <div style={{ fontSize: '11.5px', color: 'var(--status-success-text)', fontWeight: 700, marginTop: '6px' }}>
                      {activeMission.passengerAck}
                    </div>
                  )}
                  {activeMission.lastCallNote && (
                    <div style={{ fontSize: '11.5px', color: 'var(--text-2)', marginTop: '4px' }}>
                      {activeMission.lastCallNote}
                    </div>
                  )}
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
                  {atPickup && (
                    <div className="driver-step-done">
                      <CheckCircle2 size={15} />
                      <span>{t(`Waiting at pickup since ${activeMission.pickupArrivedAt}.`, `পিকআপে আছেন ${activeMission.pickupArrivedAt} থেকে।`, lang)}</span>
                    </div>
                  )}
                  {moving && (
                    <div className="driver-road">
                      <div style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--text-1)' }}>
                        {atDestination
                          ? t(`Parked at ${activeMission.to} since ${activeMission.destinationArrivedAt}.`, `${activeMission.to}-এ দাঁড়িয়ে আছেন ${activeMission.destinationArrivedAt} থেকে।`, lang)
                          : t(`On the road to ${activeMission.to} · ${clock(roadElapsed)} · about ${roadKm} km`, `${activeMission.to}-এর পথে · ${clock(roadElapsed)} · প্রায় ${roadKm} কিমি`, lang)}
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-3)', marginTop: 4 }}>
                        {t(
                          `Left at ${activeMission.gateOutTime} · meter ${activeMission.odometerStart?.toLocaleString('en-IN') ?? '—'} km`,
                          `ছাড়ার সময় ${activeMission.gateOutTime} · মিটার ${activeMission.odometerStart?.toLocaleString('bn-BD') ?? '—'} কিমি`,
                          lang,
                        )}
                      </div>
                      <div className="driver-road-track" aria-hidden>
                        <div className="driver-road-fill" style={{ width: `${roadPct}%` }} />
                      </div>
                    </div>
                  )}
                  {atDestination && (
                    <div className="driver-step-done">
                      <CheckCircle2 size={15} />
                      <span>{t('Destination reached. Close the trip when the passenger is dropped.', 'গন্তব্যে পৌঁছেছেন। যাত্রী নামিয়ে ট্রিপ বন্ধ করুন।', lang)}</span>
                    </div>
                  )}

                  {onRest ? (
                    <button type="button" className="driver-progression-btn start" onClick={() => handleStatusChange('available')}>
                      <Coffee size={18} />
                      <span>{t('End rest and go back on duty', 'বিরতি শেষ করে ডিউটিতে ফিরুন', lang)}</span>
                    </button>
                  ) : !atPickup ? (
                    <button type="button" className="driver-progression-btn bay" onClick={handleNotifyArrival}>
                      <MapPin size={18} />
                      <span>{t('I have arrived at the pickup', 'আমি পিকআপে পৌঁছেছি', lang)}</span>
                    </button>
                  ) : !moving ? (
                    <button type="button" className="driver-progression-btn start" onClick={() => setShowStartTripDialog(true)}>
                      <Navigation size={18} />
                      <span>{t('Start journey (gate-out)', 'যাত্রা শুরু (গেট-আউট)', lang)}</span>
                    </button>
                  ) : !atDestination ? (
                    <button type="button" className="driver-progression-btn bay" onClick={() => markDestinationArrived(activeMission.id, currentDriver.name)}>
                      <MapPin size={18} />
                      <span>{t(`I have reached ${activeMission.to}`, `আমি ${activeMission.to}-এ পৌঁছেছি`, lang)}</span>
                    </button>
                  ) : (
                    <button type="button" className="driver-progression-btn complete" onClick={() => setShowCompleteDialog(true)}>
                      <CheckCircle2 size={18} />
                      <span>{t('End trip and return the car', 'ট্রিপ শেষ করে গাড়ি ফেরত দিন', lang)}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    className="driver-progression-btn toll"
                    disabled={!moving}
                    onClick={() => moving && setShowTollModal(true)}
                  >
                    <Receipt size={18} />
                    <span>
                      {moving
                        ? t('Log a highway toll', 'হাইওয়ে টোল লিখুন', lang)
                        : t('Toll opens once you are on the road', 'পথে বেরোলে টোল লেখা যাবে', lang)}
                    </span>
                  </button>
                </div>
              </div>

              <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--brand-slate-200)' }}>
                {activeMission.sosActive ? (
                  <div className="driver-sos-live">
                    <strong>{t(`SOS live since ${activeMission.sosRaisedAt}.`, `এসওএস চালু ${activeMission.sosRaisedAt} থেকে।`, lang)}</strong>
                    <div style={{ marginTop: 4 }}>
                      {t(
                        'Transport desk and the passenger were told. Stay with the vehicle until you cancel this.',
                        'পরিবহন ডেস্ক ও যাত্রীকে জানানো হয়েছে। বাতিল না করা পর্যন্ত গাড়ির কাছে থাকুন।',
                        lang,
                      )}
                    </div>
                    <button type="button" className="driver-progression-btn complete" style={{ marginTop: 10 }} onClick={handleClearSos}>
                      <ShieldCheck size={16} />
                      <span>{t('I am safe — cancel the SOS', 'আমি নিরাপদ — এসওএস বাতিল', lang)}</span>
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={handleTriggerSos} className="driver-sos-btn">
                    <AlertOctagon size={18} />
                    <span>{t('Emergency highway SOS', 'জরুরি হাইওয়ে এসওএস', lang)}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : closedTrip ? (
        <div className="driver-mission-card" style={{ padding: '28px' }}>
          <div className="driver-step-done" style={{ fontSize: '15px' }}>
            <CheckCircle2 size={18} />
            <span>{t(`Trip ${closedTrip.id} is closed.`, `ট্রিপ ${closedTrip.id} বন্ধ হয়েছে।`, lang)}</span>
          </div>
          <p style={{ margin: '10px 0 0', fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.5 }}>
            {t(
              `${closedTrip.from} to ${closedTrip.to}. ${closedTrip.km} km. Gate-in at ${closedTrip.gateIn}. The car is back in the pool. Nothing else for you to do until dispatch assigns the next trip.`,
              `${closedTrip.from} থেকে ${closedTrip.to}। ${closedTrip.km} কিমি। গেট-ইন ${closedTrip.gateIn}। গাড়ি পুলে ফিরেছে। পরের ট্রিপ না আসা পর্যন্ত আপনার কিছু করার নেই।`,
              lang,
            )}
          </p>
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
            type="button"
            onClick={() => moving && setShowTollModal(true)}
            disabled={!moving}
            style={{ fontSize: '12px', fontWeight: 700, color: moving ? 'var(--status-warning)' : 'var(--text-3)', background: 'none', border: 'none', cursor: moving ? 'pointer' : 'not-allowed' }}
          >
            + {t('Submit new slip', 'নতুন স্লিপ', lang)}
          </button>
        </div>

        <div>
          {mySlips.length === 0 && (
            <div style={{ padding: '16px 18px', fontSize: '12.5px', color: 'var(--text-3)' }}>
              {t('No toll slips yet. Log one after you leave the gate.', 'এখনো কোনো টোল স্লিপ নেই। গেট ছাড়ার পর একটি লিখুন।', lang)}
            </div>
          )}
          {mySlips.map((claim) => (
            <div key={claim.id} className="driver-ledger-row">
              <div>
                <div style={{ fontWeight: 800, color: 'var(--brand-slate-900)', fontSize: '12.5px' }}>{claim.plaza}</div>
                <div style={{ fontSize: '11px', color: 'var(--brand-slate-400)', marginTop: '2px' }}>{claim.id} · {claim.time}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--brand-slate-900)', fontSize: '13.5px' }}>
                  ৳{claim.amount.toLocaleString('en-IN')}
                </div>
                <span className={`badge ${claim.status === 'Pending Review' ? 'warn' : 'success'}`}>
                  {claim.status === 'Pending Review'
                    ? t('Waiting for the desk', 'ডেস্কের অপেক্ষায়', lang)
                    : claim.status === 'Approved'
                      ? t('Approved', 'অনুমোদিত', lang)
                      : t('Paid', 'পরিশোধিত', lang)}
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
                <span>
                  {t(
                    `Distance this trip: ${Math.max(0, (parseInt(closingOdoInput, 10) || 0) - (activeMission.odometerStart ?? 0))} km.`,
                    `এই ট্রিপে দূরত্ব: ${Math.max(0, (parseInt(closingOdoInput, 10) || 0) - (activeMission.odometerStart ?? 0))} কিমি।`,
                    lang,
                  )}
                </span>
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
                  onChange={(e) => {
                    const plaza = TOLL_PLAZAS.find((p) => p.name === e.target.value) ?? TOLL_PLAZAS[0];
                    setTollPlaza(plaza.name);
                    setTollAmount(String(plaza.amount));
                  }}
                  className="notice-select"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--brand-slate-300)', fontSize: '12px' }}
                >
                  {TOLL_PLAZAS.map((plaza) => (
                    <option key={plaza.name} value={plaza.name}>{plaza.name} (৳{plaza.amount})</option>
                  ))}
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
        onEnded={(durationSec, connected) => {
          if (!activeMission) return;
          logDriverCall(activeMission.id, calleeInfo.name, durationSec, connected);
        }}
      />
    </div>
  );
}
