import React, { useState } from 'react';
import { useFleetStore, VehicleRequisition, Vehicle, Driver } from '../../store/fleetStore';
import { t } from '../../types';
import { showToast } from '../../App';
import DriverCallModal from './DriverCallModal';
import {
  Car, UserCheck, ShieldCheck, Phone, MessageSquare, AlertTriangle,
  MapPin, Clock, CheckCircle2, Navigation, AlertOctagon, Receipt,
  Check, ArrowRight, Gauge, Radio, Coffee, Sparkles, Send, PhoneCall
} from 'lucide-react';

interface DriverConsoleProps {
  lang: 'en' | 'bn';
  onOpenChat: (req: VehicleRequisition) => void;
}

export default function DriverConsole({ lang, onOpenChat }: DriverConsoleProps) {
  const {
    drivers,
    vehicles,
    requisitions,
    startTrip,
    completeTrip,
    updateDriverStatus,
    sendChatMessage,
  } = useFleetStore();

  // Current logged in driver persona: Md. Rafiqul Islam (DRV-01)
  const currentDriver = drivers.find(d => d.id === 'DRV-01') || drivers[0];

  // Active missions assigned to this driver or available assigned ones
  const assignedMissions = requisitions.filter(
    r => (r.assignedDriverId === currentDriver.id || !r.assignedDriverId) &&
         (r.status === 'assigned' || r.status === 'in_transit')
  );

  // Pick the foremost active mission
  const activeMission = assignedMissions[0] || requisitions.find(r => r.status === 'assigned' || r.status === 'in_transit');

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
    startTrip(activeMission.id, odo, new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    setShowStartTripDialog(false);
    showToast(
      lang === 'en'
        ? `🚀 Journey started for ${activeMission.id}! Gate-out departure recorded (Odometer: ${odo.toLocaleString()} km).`
        : `🚀 ট্রিপ শুরু হয়েছে! ওডোমিটার: ${odo.toLocaleString()} কিমি।`,
      'gold'
    );
  };

  // 3. Complete Trip Handler
  const handleConfirmCompleteJourney = () => {
    if (!activeMission) return;
    const odo = parseInt(closingOdoInput, 10) || 42435;
    completeTrip(
      activeMission.id,
      odo,
      new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      5,
      'Trip completed safely. Inward security gate pass validated.'
    );
    setShowCompleteDialog(false);
    showToast(
      lang === 'en'
        ? `🏁 Journey completed! Inward gate clearance granted. Vehicle returned to pool.`
        : `🏁 ট্রিপ সমাপ্ত হয়েছে! ইনওয়ার্ড গেট পাস নিবন্ধিত।`,
      'success'
    );
  };

  // 4. Open Phone Call Modal
  const initiateCall = (name: string, role: string, phone: string) => {
    setCalleeInfo({ name, role, phone });
    setShowCallModal(true);
  };

  // 5. Submit Toll Claim
  const handleAddTollClaim = () => {
    const amt = parseFloat(tollAmount) || 0;
    if (amt <= 0) return;
    const newClaim = {
      id: `TOL-${Math.floor(100 + Math.random() * 900)}`,
      plaza: tollPlaza,
      amount: amt,
      time: 'Just now',
      status: 'Pending Dispatch Review',
    };
    setTollClaims([newClaim, ...tollClaims]);
    if (activeMission) {
      sendChatMessage(
        activeMission.id,
        'driver',
        currentDriver.name,
        `🧾 Submitted toll slip voucher: ৳${amt} at ${tollPlaza}. Receipt photo logged to dispatch.`
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
        `🚨 EMERGENCY SOS: Highway breakdown or route anomaly near Keraniganj corridor! Immediate assistance requested!`
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
    <div className="space-y-6">
      {/* ─── Driver Profile & Terminal Header ───────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border-2 border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-2xl shadow-inner">
              👨‍✈️
            </div>
            <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-[10px]">
              ✓
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-white tracking-tight">
                {currentDriver.name}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                Badge #{currentDriver.id}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                {t('0.00% BAC Sobriety Cleared', 'মদ্যপানমুক্ত ০.০০% সনদপ্রাপ্ত')}
              </span>
            </div>

            <p className="text-xs text-slate-300 mt-1 flex items-center gap-3 flex-wrap">
              <span>{t('Assigned Vehicle:', 'বরাদ্দকৃত গাড়ি:')} <strong className="text-white font-mono">{currentDriver.assignedVehiclePlate || 'DHAKA METRO GHA-13-8821'}</strong></span>
              <span>•</span>
              <span>{t('License:', 'ড্রাইভিং লাইসেন্স:')} <strong className="text-white">{currentDriver.licenseNo}</strong></span>
              <span>•</span>
              <span>{t('Safety Rating:', 'নিরাপত্তা রেটিং:')} <strong className="text-amber-400">★ {currentDriver.rating} / 5.0</strong></span>
            </p>
          </div>
        </div>

        {/* Driver Availability Quick Switcher */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-slate-950/60 p-2 rounded-xl border border-slate-800">
          <span className="text-xs font-medium text-slate-400 px-2">{t('My Duty Status:', 'আমার বর্তমান অবস্থা:')}</span>
          <div className="flex gap-1.5">
            <button
              onClick={() => handleStatusChange('available')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                currentDriver.status === 'available'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
              {t('On Duty (Ready)', 'উপস্থিত')}
            </button>
            <button
              onClick={() => handleStatusChange('on_trip')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                currentDriver.status === 'on_trip'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-900/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              {t('En Route (On Trip)', 'ট্রিপে আছি')}
            </button>
            <button
              onClick={() => handleStatusChange('rest_required')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                currentDriver.status === 'rest_required'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Coffee className="w-3.5 h-3.5" />
              {t('Rest Break (15m)', 'বিরতি')}
            </button>
          </div>
        </div>
      </div>

      {/* ─── Active Mission Terminal Cockpit ────────────────────────── */}
      {activeMission ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-amber-500/40 shadow-xl overflow-hidden transition-all">
          {/* Mission Top Bar */}
          <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent px-6 py-4 border-b border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-md bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider">
                {activeMission.status === 'in_transit' ? t('🚀 IN TRANSIT', '🚀 চলমান ট্রিপ') : t('📋 ASSIGNED MISSION', '📋 বরাদ্দকৃত মিশন')}
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {t('Requisition Pass #', 'রিকুইজিশন পাস #')}{activeMission.id}
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                • {activeMission.tripType === 'round_trip' ? t('Round Trip Return', 'রাউন্ড ট্রিপ') : t('One-Way Drop-off', 'একমুখী ড্রপ')}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenChat(activeMission)}
                className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold transition flex items-center gap-1.5 border border-blue-200 dark:border-blue-800"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                {t('Mission Chat (3-Way)', 'ট্রিপ চ্যাট')}
              </button>
              <button
                onClick={() => initiateCall(activeMission.requesterName, activeMission.dept, activeMission.phone || '+880 1712-334455')}
                className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition flex items-center gap-1.5 border border-emerald-200 dark:border-emerald-800"
              >
                <Phone className="w-3.5 h-3.5" />
                {t('Call Passenger Lead', 'যাত্রীকে কল দিন')}
              </button>
            </div>
          </div>

          {/* Mission Details Grid */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Route Details */}
            <div className="md:col-span-2 space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-amber-500" />
                  {t('Transit Route & Multi-Stop Waypoints', 'যাত্রাপথ ও ভায়া স্টপসমূহ')}
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center mt-1">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20"></span>
                    <span className="w-0.5 h-10 bg-slate-300 dark:bg-slate-700 my-1"></span>
                    <span className="w-3 h-3 rounded-full bg-red-500 ring-4 ring-red-500/20"></span>
                  </div>

                  <div className="flex-1 space-y-3">
                    <div>
                      <div className="text-xs text-slate-400 font-medium">{t('Pickup Origin Bay', 'পিকআপ স্থান')}</div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        {activeMission.from}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-slate-400 font-medium">{t('Target Destination', 'গন্তব্য')}</div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        {activeMission.to}
                      </div>
                    </div>
                  </div>
                </div>

                {activeMission.intermediateStops && activeMission.intermediateStops.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <div className="text-xs font-semibold text-slate-500 mb-2">
                      {t('Scheduled Intermediate Waypoints:', 'নির্ধারিত বিরতিসমূহ:')}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {activeMission.intermediateStops.map((stop, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] flex items-center justify-center font-bold">
                            {i + 1}
                          </span>
                          {stop.location}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Passenger & Purpose Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="text-xs text-slate-400 font-semibold mb-1">{t('Passenger Manifest', 'যাত্রীদের তালিকা')}</div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{activeMission.passengerNames}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {activeMission.passengersCount} Pax
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Lead: {activeMission.requesterName} ({activeMission.dept})
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="text-xs text-slate-400 font-semibold mb-1">{t('Official Purpose', 'দাপ্তরিক উদ্দেশ্য')}</div>
                  <div className="text-xs font-medium text-slate-800 dark:text-slate-200 line-clamp-2">
                    {activeMission.purpose}
                  </div>
                  <div className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-1">
                    Departure: {activeMission.departureTime}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Action Progression Controls */}
            <div className="flex flex-col justify-between bg-gradient-to-b from-slate-50 to-amber-50/30 dark:from-slate-800/40 dark:to-slate-800/80 p-5 rounded-xl border border-amber-500/20">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-amber-500" />
                  {t('Mission Action Progression', 'মিশন বাস্তবায়ন ধাপসমূহ')}
                </h4>

                <div className="space-y-3">
                  {/* Step 1: Arrive at Bay */}
                  <button
                    onClick={handleNotifyArrival}
                    className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-sm"
                  >
                    <MapPin className="w-4 h-4" />
                    {t('1. Arrived at Pickup Bay', '১. পিকআপ পয়েন্টে পৌঁছেছি')}
                  </button>

                  {/* Step 2: Start Trip */}
                  {activeMission.status === 'assigned' && (
                    <button
                      onClick={() => setShowStartTripDialog(true)}
                      className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Navigation className="w-4 h-4" />
                      {t('2. Start Journey (Gate-Out)', '২. যাত্রা শুরু (গেট আউট)')}
                    </button>
                  )}

                  {/* Step 3: Complete Trip */}
                  {activeMission.status === 'in_transit' && (
                    <button
                      onClick={() => setShowCompleteDialog(true)}
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-sm"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {t('3. Complete Journey (Gate-In)', '৩. যাত্রা সমাপ্ত (গেট ইন)')}
                    </button>
                  )}

                  {/* Step 4: Quick Toll Claim */}
                  <button
                    onClick={() => setShowTollModal(true)}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-semibold text-xs transition flex items-center justify-center gap-2"
                  >
                    <Receipt className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    {t('Log Highway Toll Voucher', 'হাইওয়ে টোল ভাউচার এন্ট্রি')}
                  </button>
                </div>
              </div>

              {/* Highway SOS Button */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700 mt-4">
                <button
                  onClick={handleTriggerSos}
                  disabled={sosSent}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
                    sosSent
                      ? 'bg-red-800 text-white opacity-70 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-900/20'
                  }`}
                >
                  <AlertOctagon className="w-4 h-4" />
                  {sosSent ? t('SOS Broadcast Active', 'জরুরী সতর্কবার্তা সচল') : t('Emergency Highway SOS', 'জরুরী হাইওয়ে এসওএস')}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {t('No Active Missions Pending', 'এই মুহূর্তে কোনো নতুন ট্রিপ নেই')}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            {t('You are on standby at Bashundhara HQ Driver Pool. Central Transport Dispatch will alert you when a new duty travel requisition is assigned.', 'আপনি সদর দপ্তরে স্ট্যান্ডবাই আছেন। নতুন রিকুইজিশন বরাদ্দ হলে নোটিফিকেশন পাবেন।')}
          </p>
        </div>
      )}

      {/* ─── Toll Slips & Highway Vouchers Table ─────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              {t('My Toll & Conveyance Slips (Reimbursement Ledger)', 'আমার টোল ও কনভেয়েন্স স্লিপসমূহ')}
            </h3>
          </div>
          <button
            onClick={() => setShowTollModal(true)}
            className="text-xs font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 flex items-center gap-1"
          >
            + {t('Submit New Voucher', 'নতুন ভাউচার')}
          </button>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {tollClaims.map((claim) => (
            <div key={claim.id} className="px-6 py-3.5 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900 dark:text-white">{claim.plaza}</div>
                <div className="text-[11px] text-slate-400">ID: {claim.id} • {claim.time}</div>
              </div>
              <div className="flex items-center gap-4">
                <div className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                  ৳{claim.amount}
                </div>
                <span className={`px-2.5 py-0.5 rounded-full font-semibold text-[10px] ${
                  claim.status.includes('Approved') || claim.status.includes('Reimbursed')
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                }`}>
                  {claim.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── MODAL: Start Trip Dialog ───────────────────────────────── */}
      {showStartTripDialog && activeMission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Navigation className="w-5 h-5 text-amber-500" />
              {t('Start Highway Journey (Gate-Out Pass)', 'যাত্রা শুরু ও গেট পাস লগ')}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {t('Record vehicle starting odometer reading and confirm passenger aboard.', 'ওডোমিটার রিডিং নিশ্চিত করে যাত্রা শুরু করুন।')}
            </p>

            <div className="space-y-3 mb-5">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  {t('Current Starting Odometer (km)', 'শুরুর ওডোমিটার (কিমি)')}
                </label>
                <input
                  type="number"
                  value={startOdoInput}
                  onChange={(e) => setStartOdoInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono"
                />
              </div>

              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400">
                ⚠️ Speed limit: 60 km/h on Dhaka corridors, 80 km/h on expressways. Seatbelts mandatory for all passengers.
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowStartTripDialog(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {t('Cancel', 'বাতিল')}
              </button>
              <button
                onClick={handleConfirmStartJourney}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-900/20"
              >
                {t('Confirm Departure & Open Gate', 'যাত্রা শুরু নিশ্চিত করুন')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: Complete Trip Dialog ────────────────────────────── */}
      {showCompleteDialog && activeMission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              {t('Complete Journey (Inward Security Gate Pass)', 'যাত্রা সমাপ্তি ও ইনওয়ার্ড গেট পাস')}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {t('Enter ending odometer reading and return vehicle to pool.', 'সমাপনী ওডোমিটার রিডিং প্রদান করুন।')}
            </p>

            <div className="space-y-3 mb-5">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  {t('Final Odometer Reading (km)', 'সমাপনী ওডোমিটার (কিমি)')}
                </label>
                <input
                  type="number"
                  value={closingOdoInput}
                  onChange={(e) => setClosingOdoInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono"
                />
              </div>

              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-400">
                ✓ Distance Traveled: ~{(parseInt(closingOdoInput, 10) || 42435) - 42350} km recorded in BOGCL fleet log.
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCompleteDialog(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {t('Cancel', 'বাতিল')}
              </button>
              <button
                onClick={handleConfirmCompleteJourney}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-900/20"
              >
                {t('Submit Inward Gate Pass', 'ইনওয়ার্ড পাস নিশ্চিত করুন')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: Quick Toll Claim ────────────────────────────────── */}
      {showTollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-amber-500" />
              {t('Submit Highway Toll Voucher', 'হাইওয়ে টোল ভাউচার দাখিল')}
            </h3>

            <div className="space-y-3 mb-5">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  {t('Toll Plaza / Bridge Name', 'টোল প্লাজা বা সেতুর নাম')}
                </label>
                <select
                  value={tollPlaza}
                  onChange={(e) => setTollPlaza(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                >
                  <option value="Babubazar Second Buriganga Bridge">Babubazar Second Buriganga Bridge (৳150)</option>
                  <option value="Mayor Mohammad Hanif Flyover">Mayor Mohammad Hanif Flyover (৳260)</option>
                  <option value="Dhaka Elevated Expressway (Kuril-Farmgate)">Dhaka Elevated Expressway (৳80)</option>
                  <option value="Padma Multipurpose Bridge">Padma Multipurpose Bridge (৳800)</option>
                  <option value="Kanchpur Second Meghna Bridge">Kanchpur Second Meghna Bridge (৳120)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  {t('Amount Paid (BDT)', 'প্রদেয় পরিমাণ (টাকা)')}
                </label>
                <input
                  type="number"
                  value={tollAmount}
                  onChange={(e) => setTollAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowTollModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {t('Cancel', 'বাতিল')}
              </button>
              <button
                onClick={handleAddTollClaim}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-900/20"
              >
                {t('Submit Voucher', 'ভাউচার দাখিল করুন')}
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
