import React, { useState } from 'react';
import { ViewProps, t } from '../types';
import { showToast } from '../App';
import { useFleetStore, Driver, Vehicle, VehicleRequisition } from '../store/fleetStore';
import {
  Truck, Car, Fuel, MapPin, CheckCircle, Clock, AlertCircle,
  Plus, Users, Navigation, QrCode, FileText, Sparkles, Award,
  Gauge, Radio, ShieldCheck, AlertTriangle, ArrowRight, Eye,
  Maximize2, Activity, Cpu, Check, Compass, PhoneCall, Zap,
  UserCheck, Shield, Key, Calendar, Printer, Search, RotateCcw, UserPlus
} from 'lucide-react';
import RegisterVehicleModal from '../components/fleet/RegisterVehicleModal';
import EnrollDriverModal from '../components/fleet/EnrollDriverModal';

export default function FleetView({ role, lang }: ViewProps) {
  const { drivers, vehicles, requisitions, addRequisition, assignRequisition, recordBreathalyzer } = useFleetStore();

  // Active Tab for Admin/General: 'requisitions' | 'drivers' | 'telematics' | 'fuel'
  const isEmployee = role === 'employee';
  const [activeTab, setActiveTab] = useState<'requisitions' | 'drivers' | 'telematics' | 'fuel'>(
    isEmployee ? 'requisitions' : 'requisitions'
  );

  // Selected telemetry vehicle
  const [selectedVehicleTelemetry, setSelectedVehicleTelemetry] = useState<Vehicle | null>(vehicles[4]);

  // Modals
  const [showNewRequisitionModal, setShowNewRequisitionModal] = useState(false);
  const [showRegisterVehicleModal, setShowRegisterVehicleModal] = useState(false);
  const [showEnrollDriverModal, setShowEnrollDriverModal] = useState(false);
  const [assigningReq, setAssigningReq] = useState<VehicleRequisition | null>(null);
  const [selectedTripPassReq, setSelectedTripPassReq] = useState<VehicleRequisition | null>(null);
  const [showFuelModal, setShowFuelModal] = useState<Vehicle | null>(null);
  const [fuelLiters, setFuelLiters] = useState('65');
  const [fuelStation, setFuelStation] = useState('Bashundhara Filling Station, 300 Feet Road');

  // New Requisition Form State
  const [fromLoc, setFromLoc] = useState('Bashundhara Corporate HQ, Baridhara');
  const [toLoc, setToLoc] = useState('Keraniganj Bitumen Refinery Complex');
  const [tripType, setTripType] = useState<'round_trip' | 'one_way'>('round_trip');
  const [departureTime, setDepartureTime] = useState('Today, 02:30 PM');
  const [returnTime, setReturnTime] = useState('Today, 06:30 PM');
  const [requiredCapacity, setRequiredCapacity] = useState<'sedan_4' | 'microbus_7' | 'pickup_4x4' | 'tanker_heavy'>('sedan_4');
  const [passengersCount, setPassengersCount] = useState(2);
  const [passengerNames, setPassengerNames] = useState(role === 'employee' ? 'Tanvir Ahmed, Engr. Tariq' : 'Executive Team');
  const [purpose, setPurpose] = useState('Official refinery site inspection and delivery of asphalt laboratory batch dossiers');
  const [costCenter, setCostCenter] = useState('CC-SALES-DHAKA-102');

  // Assignment Modal State
  const [assignCarPlate, setAssignCarPlate] = useState(vehicles.find(v => v.status === 'available')?.plate || vehicles[0].plate);
  const [assignDriverId, setAssignDriverId] = useState(drivers.find(d => d.status === 'available')?.id || drivers[0].id);

  // Smart Pooling Action
  const handleSmartPoolMerge = () => {
    showToast(t(
      'Smart Pool Activated! Matching requisitions merged into Toyota HiAce (CHA-53-4102). Estimated savings: ৳1,850 fuel + 1 vehicle freed.',
      'স্মার্ট পুলিং সফল! আবেদনসমূহ টয়োটা হাইএইস-এ মার্জ করা হয়েছে। আনুমানিক সাশ্রয়: ১,৮৫০ টাকা ও ১টি অতিরিক্ত গাড়ি উপলব্ধ।',
      lang
    ), 'gold');
  };

  // Submit Requisition Handler
  const handleCreateRequisition = () => {
    if (!purpose) {
      showToast(t('Please specify the official business purpose.', 'অনুগ্রহ করে দাপ্তরিক কাজের উদ্দেশ্য লিখুন।', lang), 'info');
      return;
    }
    const created = addRequisition({
      requesterName: role === 'employee' ? 'Tanvir Ahmed' : role === 'plant_gm' ? 'Engr. Harunur Rashid' : 'Md. Shafiqul Islam',
      requesterRole: role === 'employee' ? 'Sr. Sales & Distribution Specialist' : 'Department Lead',
      dept: role === 'employee' ? 'Sales & Distribution' : 'Plant Operations',
      phone: '+880 1712-334455',
      from: fromLoc,
      to: toLoc,
      tripType,
      departureTime,
      returnTime: tripType === 'round_trip' ? returnTime : undefined,
      requiredCapacity,
      passengersCount,
      passengerNames,
      purpose,
      costCenter,
    });
    setShowNewRequisitionModal(false);
    showToast(t(
      `Duty Travel Requisition ${created.id} submitted! Transferred to Transport Admin (Md. Kamruzzaman) for driver & vehicle assignment.`,
      `যানবাহন রিকুইজিশন ${created.id} দাখিল সম্পন্ন! পরিবহন প্রশাসকের নিকট প্রেরিত হয়েছে।`,
      lang
    ), 'success');
  };

  // Confirm Assignment
  const handleConfirmAssignment = () => {
    if (!assigningReq) return;
    assignRequisition(assigningReq.id, assignCarPlate, assignDriverId);
    showToast(t(
      `✓ Vehicle ${assignCarPlate} & Driver assigned to Requisition ${assigningReq.id}! Digital Trip Challan Pass generated.`,
      `✓ গাড়ি ও চালক সফলভাবে বরাদ্দ করা হয়েছে! ডিজিটাল ট্রিপ পাস তৈরি সম্পন্ন।`,
      lang
    ), 'gold');
    setAssigningReq(null);
  };

  const handleIssueFuelSlip = (v: Vehicle) => {
    setShowFuelModal(v);
  };

  const confirmFuelSlip = () => {
    if (!showFuelModal) return;
    showToast(t(
      `Digital Fuel Slip generated for ${showFuelModal.plate} (${fuelLiters} Liters Octane). QR barcode dispatched to Driver.`,
      `${showFuelModal.plate} এর জন্য ডিজিটাল ফুয়েল স্লিপ ইস্যু করা হয়েছে (${fuelLiters} লিটার)। কিউআর কোড চালকের ফোনে পাঠানো হয়েছে।`,
      lang
    ), 'gold');
    setShowFuelModal(null);
  };

  return (
    <div>
      {/* View Header */}
      <div className="flex-between mb-4">
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--brand-slate-900)' }}>
            {isEmployee
              ? t('My Official Vehicle Requisitions & Duty Travel Desk', 'আমার দাপ্তরিক যানবাহন আবেদন ও ট্রাভেল ডেস্ক', lang)
              : t('Fleet Command, Driver Pool & Requisition Dispatch Desk', 'যানবাহন বহর কমান্ড, চালক পুল ও ডেসপ্যাচ কন্ট্রোল রুম', lang)}
          </h2>
          <p className="text-muted">
            {t('End-to-End Duty Travel Lifecycle • Driver Roster & Sobriety Audit • Live Tanker GPS Telematics • Digital Trip Gate Passes', 'দাপ্তরিক যাতায়াত রিকুইজিশন • চালক তথ্য ও ফিটনেস অডিট • রিয়েল-টাইম জিপিএস ট্র্যাকিং • ডিজিটাল ট্রিপ পাস', lang)}
          </p>
        </div>

        <div className="flex-gap">
          {!isEmployee && (
            <>
              <button
                className="btn-gold"
                style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
                onClick={() => setShowRegisterVehicleModal(true)}
              >
                <Truck size={14} />
                {t('Register Vehicle', 'গাড়ি রেজিস্ট্রেশন', lang)}
              </button>

              <button
                className="btn-sm-ghost"
                style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '8px 14px' }}
                onClick={() => setShowEnrollDriverModal(true)}
              >
                <UserCheck size={14} />
                {t('Enroll Driver', 'চালক তালিকাভুক্তি', lang)}
              </button>
            </>
          )}

          <button
            className="btn-primary"
            style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => setShowNewRequisitionModal(true)}
          >
            <Plus size={15} />
            {t('New Duty Vehicle Requisition', 'নতুন গাড়ির আবেদন', lang)}
          </button>
        </div>
      </div>

      {/* Tabs Navigation (for Admin / Executive roles) */}
      {!isEmployee && (
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--brand-slate-200)', paddingBottom: '8px', marginBottom: '20px' }}>
          <button
            className={`btn-sm-ghost ${activeTab === 'requisitions' ? 'active-filter' : ''}`}
            style={{
              fontSize: '12px',
              padding: '7px 14px',
              background: activeTab === 'requisitions' ? 'var(--brand-crimson)' : 'var(--brand-card-bg)',
              color: activeTab === 'requisitions' ? '#FFF' : 'var(--brand-slate-700)',
              borderColor: activeTab === 'requisitions' ? 'var(--brand-crimson)' : 'var(--brand-slate-200)',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onClick={() => setActiveTab('requisitions')}
          >
            <Car size={14} />
            {t('Requisitions Dispatch Queue', 'রিকুইজিশন ডেসপ্যাচ সারি', lang)}
            <span style={{ background: activeTab === 'requisitions' ? 'rgba(255,255,255,0.25)' : 'var(--brand-slate-200)', color: activeTab === 'requisitions' ? '#FFF' : 'var(--brand-slate-800)', padding: '1px 6px', borderRadius: '10px', fontSize: '10px' }}>
              {requisitions.filter(r => r.status === 'pending').length}
            </span>
          </button>

          <button
            className={`btn-sm-ghost ${activeTab === 'drivers' ? 'active-filter' : ''}`}
            style={{
              fontSize: '12px',
              padding: '7px 14px',
              background: activeTab === 'drivers' ? 'var(--brand-crimson)' : 'var(--brand-card-bg)',
              color: activeTab === 'drivers' ? '#FFF' : 'var(--brand-slate-700)',
              borderColor: activeTab === 'drivers' ? 'var(--brand-crimson)' : 'var(--brand-slate-200)',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onClick={() => setActiveTab('drivers')}
          >
            <Users size={14} />
            {t('Driver Pool & Sobriety Audit', 'চালক তালিকা ও ফিটনেস অডিট', lang)}
            <span style={{ background: activeTab === 'drivers' ? 'rgba(255,255,255,0.25)' : 'var(--brand-slate-200)', color: activeTab === 'drivers' ? '#FFF' : 'var(--brand-slate-800)', padding: '1px 6px', borderRadius: '10px', fontSize: '10px' }}>
              {drivers.length}
            </span>
          </button>

          <button
            className={`btn-sm-ghost ${activeTab === 'telematics' ? 'active-filter' : ''}`}
            style={{
              fontSize: '12px',
              padding: '7px 14px',
              background: activeTab === 'telematics' ? 'var(--brand-crimson)' : 'var(--brand-card-bg)',
              color: activeTab === 'telematics' ? '#FFF' : 'var(--brand-slate-700)',
              borderColor: activeTab === 'telematics' ? 'var(--brand-crimson)' : 'var(--brand-slate-200)',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onClick={() => setActiveTab('telematics')}
          >
            <Navigation size={14} />
            {t('Heavy Tankers & GPS Telematics', 'ভারী ট্যাংকার ও টেলিমেটিক্স', lang)}
          </button>

          <button
            className={`btn-sm-ghost ${activeTab === 'fuel' ? 'active-filter' : ''}`}
            style={{
              fontSize: '12px',
              padding: '7px 14px',
              background: activeTab === 'fuel' ? 'var(--brand-crimson)' : 'var(--brand-card-bg)',
              color: activeTab === 'fuel' ? '#FFF' : 'var(--brand-slate-700)',
              borderColor: activeTab === 'fuel' ? 'var(--brand-crimson)' : 'var(--brand-slate-200)',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onClick={() => setActiveTab('fuel')}
          >
            <Fuel size={14} />
            {t('Fuel Station & Anti-Pilferage', 'ফুয়েল ও ইনসেন্টিভ প্রোগ্রাম', lang)}
          </button>
        </div>
      )}

      {/* AI Smart Pooling Opportunity Box */}
      <div className="pool-suggestion mb-4">
        <div className="pool-icon">
          <Sparkles size={24} color="#1D4ED8" />
        </div>
        <div style={{ flex: 1 }}>
          <div className="pool-text">
            <h4>{t('AI Route Optimization & Smart Pooling Opportunity Detected', 'এআই রুট অপ্টিমাইজেশন ও কারপুলিং সুযোগ শনাক্ত হয়েছে', lang)}</h4>
            <p>
              {t(
                'Two requisitions share matching routes today between Dhaka HQ and Keraniganj Bitumen Plant (2:30 PM & 2:45 PM). Merging them saves 1 vehicle and eliminates 38 km redundant transit (৳1,850 fuel saved).',
                'আজ ঢাকা সদর দপ্তর থেকে কেরানীগঞ্জ প্ল্যান্টের একই রুটে দুটি পৃথক রিকুইজিশন এসেছে। গাড়ি মার্জ করলে ১টি অতিরিক্ত গাড়ি ফ্রি থাকবে এবং ৩৮ কিমি জ্বালানি সাশ্রয় হবে।',
                lang
              )}
            </p>
          </div>
        </div>
        <button className="btn-gold" onClick={handleSmartPoolMerge} style={{ fontSize: '11.5px', padding: '6px 14px' }}>
          <Users size={14} />
          {t('Merge into Single Pool Vehicle', 'এক গাড়িতে মার্জ করুন', lang)}
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          TAB 1: REQUISITIONS DISPATCH QUEUE (Always shown to Employee)
          ══════════════════════════════════════════════════════════════ */}
      {(isEmployee || activeTab === 'requisitions') && (
        <div className="card mb-5">
          <div className="card-hd">
            <div className="card-hd-left">
              <div className="card-hd-icon"><Car size={18} /></div>
              <div>
                <div className="card-title">
                  {isEmployee
                    ? t('My Official Duty Travel Requisitions', 'আমার দাপ্তরিক যাতায়াত আবেদনসমূহ', lang)
                    : t('Incoming Duty Requisitions Awaiting Vehicle & Driver Allocation', 'অপেক্ষমান যানবাহন আবেদনসমূহ', lang)}
                </div>
                <div className="card-subtitle">
                  {requisitions.length} {t('Total Requisitions Tracked Today', 'টি আবেদন নথিভুক্ত হয়েছে', lang)}
                </div>
              </div>
            </div>
            <span className="badge warn">
              {requisitions.filter(r => r.status === 'pending').length} {t('Pending Assignment', 'অমীমাংসিত', lang)}
            </span>
          </div>

          <div className="card-body">
            <div className="table-responsive">
              <table className="fleet-table">
              <thead>
                <tr>
                  <th>Req ID</th>
                  <th>Requester & Department</th>
                  <th>Route & Trip Type</th>
                  <th>Departure / Return</th>
                  <th>Required Vehicle</th>
                  <th>Assigned Vehicle & Driver</th>
                  <th>Status & Pass</th>
                </tr>
              </thead>
              <tbody>
                {requisitions.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--brand-slate-900)' }}>
                        {r.id}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--brand-slate-900)' }}>{r.requesterName}</div>
                      <div style={{ fontSize: '11px', color: 'var(--brand-slate-400)' }}>
                        {r.dept} • {r.phone}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12.5px', fontWeight: 600 }}>
                        <span>{r.from.split(',')[0]}</span>
                        <span style={{ color: 'var(--brand-crimson)' }}>➔</span>
                        <span>{r.to.split(',')[0]}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: r.tripType === 'round_trip' ? '#1D4ED8' : '#64748B', fontWeight: 700, marginTop: '2px' }}>
                        {r.tripType === 'round_trip' ? '🔄 Round Trip (Return)' : '➡️ One-Way Transit'}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '12px', fontWeight: 600 }}>{r.departureTime}</div>
                      {r.returnTime && (
                        <div style={{ fontSize: '11px', color: '#1D4ED8' }}>Return: {r.returnTime}</div>
                      )}
                      <span className="badge info" style={{ marginTop: '2px' }}>
                        {r.passengersCount} {r.passengersCount === 1 ? 'Passenger' : 'Passengers'}
                      </span>
                    </td>
                    <td>
                      <span className="badge" style={{ background: '#F1F5F9', color: '#0F172A', fontWeight: 700 }}>
                        {r.requiredCapacity === 'sedan_4' && '🚗 Sedan (4-Seater)'}
                        {r.requiredCapacity === 'microbus_7' && '🚐 Microbus (7-Seater)'}
                        {r.requiredCapacity === 'pickup_4x4' && '🛻 4x4 Emergency Patrol'}
                        {r.requiredCapacity === 'tanker_heavy' && '🚛 Heavy Bulk Tanker'}
                      </span>
                    </td>
                    <td>
                      {r.status === 'assigned' ? (
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '12px', color: '#059669' }}>
                            ✓ {r.assignedVehiclePlate}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--brand-slate-600)' }}>
                            Driver: <strong>{r.assignedDriverName}</strong>
                          </div>
                          <div style={{ fontSize: '11px', color: '#1D4ED8', fontFamily: 'monospace' }}>
                            📞 {r.assignedDriverPhone}
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: '#D97706', fontSize: '12px', fontWeight: 600 }}>
                          ⏳ Awaiting Transport Admin
                        </span>
                      )}
                    </td>
                    <td>
                      {r.status === 'pending' ? (
                        !isEmployee ? (
                          <button
                            className="btn-primary"
                            style={{ fontSize: '11px', padding: '5px 12px' }}
                            onClick={() => {
                              setAssigningReq(r);
                              setAssignCarPlate(vehicles.find(v => v.status === 'available')?.plate || vehicles[0].plate);
                              setAssignDriverId(drivers.find(d => d.status === 'available')?.id || drivers[0].id);
                            }}
                          >
                            Assign Vehicle & Driver
                          </button>
                        ) : (
                          <span className="badge warn">Pending Assignment</span>
                        )
                      ) : (
                        <button
                          className="btn-sm-ghost"
                          style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', color: '#059669', borderColor: '#A7F3D0', background: '#ECFDF5' }}
                          onClick={() => setSelectedTripPassReq(r)}
                        >
                          <QrCode size={13} />
                          {t('Trip Challan Pass', 'ডিজিটাল ট্রিপ চালান', lang)}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 2: DRIVER POOL & SOBRIETY AUDIT (Admin view)
          ══════════════════════════════════════════════════════════════ */}
      {!isEmployee && activeTab === 'drivers' && (
        <div className="card mb-5">
          <div className="card-hd">
            <div className="card-hd-left">
              <div className="card-hd-icon"><Users size={18} /></div>
              <div>
                <div className="card-title">{t('BOGCL Certified Driver Directory & Sobriety Audit', 'বসুন্ধরা সার্টিফাইড চালক তালিকা ও ফিটনেস অডিট', lang)}</div>
                <div className="card-subtitle">{t('BRTA Commercial Licensing, Breathalyzer Logs & Shift Hours', 'বিআরটিএ লাইসেন্স যাচাই, ব্রেথলাইজার টেস্ট ও দৈনিক ড্রাইভিং আওয়ার', lang)}</div>
              </div>
            </div>
            <span className="badge success">{drivers.filter(d => d.status === 'available').length} Drivers Ready for Dispatch</span>
          </div>

          <div className="card-body">
            <div className="responsive-col-3">
              {drivers.map(d => (
                <div key={d.id} style={{ border: '1px solid var(--brand-slate-200)', borderRadius: '8px', padding: '14px', background: 'var(--brand-card-bg)', position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--brand-slate-900)', color: 'var(--brand-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px' }}>
                        {d.initials}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '13.5px', color: 'var(--brand-slate-900)' }}>{d.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)', fontFamily: 'monospace' }}>📞 {d.phone}</div>
                      </div>
                    </div>
                    <span className={`badge ${d.status === 'available' ? 'present' : d.status === 'on_trip' ? 'meeting' : 'warn'}`}>
                      {d.status === 'available' ? 'AVAILABLE' : d.status === 'on_trip' ? 'ON TRIP' : 'REST REQUIRED'}
                    </span>
                  </div>

                  <div style={{ background: 'var(--brand-slate-100)', padding: '10px', borderRadius: '6px', fontSize: '11.5px', marginBottom: '10px' }}>
                    <div><strong>License:</strong> {d.licenseNo} ({d.licenseType})</div>
                    <div><strong>Valid Until:</strong> {d.licenseExpiry}</div>
                    <div style={{ marginTop: '4px', color: 'var(--status-success)', fontWeight: 700 }}>
                      ✓ Breathalyzer: {d.breathalyzerToday}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--brand-slate-500)' }}>
                    <span>Duty Today: <strong>{d.dutyHoursToday} hrs</strong></span>
                    <span>Blood Group: <strong>{d.bloodGroup}</strong></span>
                    <span>Rating: <strong>★ {d.rating}</strong></span>
                  </div>

                  <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--brand-slate-200)', display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                    <button
                      className="btn-sm-ghost"
                      style={{ fontSize: '10.5px' }}
                      onClick={() => {
                        recordBreathalyzer(d.id, '0.00% BAC (PASSED)');
                        showToast(`Breathalyzer test verified for ${d.name}: 0.00% Zero-Alcohol.`, 'success');
                      }}
                    >
                      ✓ Log Sobriety Test
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 3: HEAVY TANKERS & TELEMATICS HUD (Admin / Executive view)
          ══════════════════════════════════════════════════════════════ */}
      {(!isEmployee && activeTab === 'telematics') && (
        <>
          {/* Live GPS Telematics HUD */}
          {selectedVehicleTelemetry && (
            <div className="card mb-5" style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', color: '#fff', border: '1px solid #334155' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'rgba(217, 119, 6, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Navigation size={18} color="#FBBF24" />
                  </div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#F8FAFC' }}>
                      {selectedVehicleTelemetry.plate} — {selectedVehicleTelemetry.model}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                      Assigned Driver: <strong>{selectedVehicleTelemetry.driverName}</strong> • 📞 {selectedVehicleTelemetry.driverPhone}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span className={`badge ${selectedVehicleTelemetry.status === 'in_transit' ? 'meeting' : selectedVehicleTelemetry.status === 'loading' ? 'warn' : 'present'}`}>
                    {selectedVehicleTelemetry.status === 'in_transit' ? '⚡ LIVE ON ROUTE' : selectedVehicleTelemetry.status.toUpperCase()}
                  </span>
                </div>
              </div>

              <div style={{ padding: '20px' }}>
                <div className="responsive-col-4" style={{ marginBottom: '20px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.05)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ fontSize: '11px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Gauge size={14} color="#60A5FA" />
                      Speedometer
                    </div>
                    <div style={{ fontSize: '26px', fontWeight: 900, color: '#fff', marginTop: '4px' }}>
                      {selectedVehicleTelemetry.speed} <span style={{ fontSize: '13px', color: '#94A3B8' }}>KM/H</span>
                    </div>
                    <div style={{ fontSize: '10px', color: selectedVehicleTelemetry.speed > 60 ? '#F87171' : '#4ADE80', marginTop: '2px' }}>
                      Speed Governor: 60 KM/H Limit
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.05)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ fontSize: '11px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Cpu size={14} color="#FBBF24" />
                      {selectedVehicleTelemetry.bitumenCargoTemp ? 'Bitumen Tank Heat' : 'Engine Temp'}
                    </div>
                    <div style={{ fontSize: '26px', fontWeight: 900, color: selectedVehicleTelemetry.bitumenCargoTemp ? '#F59E0B' : '#fff', marginTop: '4px' }}>
                      {selectedVehicleTelemetry.bitumenCargoTemp ? `${selectedVehicleTelemetry.bitumenCargoTemp}°C` : `${selectedVehicleTelemetry.engineTemp}°C`}
                    </div>
                    <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '2px' }}>
                      {selectedVehicleTelemetry.bitumenCargoTemp ? 'Molten Asphalt Optimal: 160-170°C' : 'Coolant Normal: 80-95°C'}
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.05)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ fontSize: '11px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Fuel size={14} color="#34D399" />
                      Ultrasonic Fuel Gauge
                    </div>
                    <div style={{ fontSize: '26px', fontWeight: 900, color: '#34D399', marginTop: '4px' }}>
                      {selectedVehicleTelemetry.fuelPct}%
                    </div>
                    <div style={{ fontSize: '10px', color: '#4ADE80', marginTop: '2px' }}>
                      Anti-Pilferage Sensor: Sealed
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.05)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ fontSize: '11px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ShieldCheck size={14} color="#A78BFA" />
                      Safety Clearances
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                      <span style={{ fontSize: '11px', color: '#4ADE80', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Check size={12} /> HAZMAT Certified
                      </span>
                      <span style={{ fontSize: '11px', color: '#4ADE80', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Check size={12} /> 0.00% Breathalyzer
                      </span>
                    </div>
                  </div>
                </div>

                {selectedVehicleTelemetry.routeProgress !== undefined && (
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '14px 18px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', marginBottom: '8px' }}>
                      <div>
                        <span style={{ color: '#94A3B8' }}>Origin: </span>
                        <strong>{selectedVehicleTelemetry.routeOrigin}</strong>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#FBBF24', fontWeight: 700 }}>
                        <Compass size={14} />
                        <span>Current: {selectedVehicleTelemetry.location}</span>
                      </div>
                      <div>
                        <span style={{ color: '#94A3B8' }}>Destination: </span>
                        <strong>{selectedVehicleTelemetry.routeDestination}</strong>
                      </div>
                    </div>

                    <div style={{ height: '8px', background: '#334155', borderRadius: '4px', position: 'relative', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${selectedVehicleTelemetry.routeProgress}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #3B82F6, #10B981)',
                          borderRadius: '4px',
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#94A3B8', marginTop: '6px' }}>
                      <span>0% Departed</span>
                      <span>{selectedVehicleTelemetry.routeProgress}% of Route Completed (ETA: 35 mins)</span>
                      <span>100% Delivery Gate</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* All Vehicles Directory */}
          <div className="card">
            <div className="card-hd">
              <div className="card-hd-left">
                <div className="card-hd-icon"><Truck size={18} /></div>
                <div>
                  <div className="card-title">{t('BOGCL Corporate & Heavy Plant Fleet Directory', 'বসুন্ধরা অয়েল অ্যান্ড গ্যাস যানবাহন বহর', lang)}</div>
                  <div className="card-subtitle">{t('Keraniganj Tankers, Executive Pool & Staff Microbuses', 'কেরানীগঞ্জ ট্যাংকার, এক্সিকিউটিভ কার ও স্টাফ মাইক্রোবাস', lang)}</div>
                </div>
              </div>
              <span className="badge success">{vehicles.length} Vehicles Monitored</span>
            </div>

            <div className="card-body">
              <div className="table-responsive">
                <table className="fleet-table">
                <thead>
                  <tr>
                    <th>Plate Number</th>
                    <th>Vehicle Model & Capacity</th>
                    <th>Assigned Driver</th>
                    <th>GPS Geofence Location</th>
                    <th>Fuel Level</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map((v) => (
                    <tr
                      key={v.id}
                      style={{
                        background: selectedVehicleTelemetry?.id === v.id ? '#F1F5F9' : 'transparent',
                        cursor: 'pointer'
                      }}
                      onClick={() => setSelectedVehicleTelemetry(v)}
                    >
                      <td>
                        <span className="vehicle-plate">{v.plate}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--brand-slate-900)' }}>{v.model}</div>
                        <div style={{ fontSize: '11px', color: 'var(--brand-slate-400)' }}>
                          Capacity: {v.capacitySeats} Seats • Service Due: {v.nextServiceKm} KM
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{v.driverName}</div>
                        <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)', fontFamily: 'monospace' }}>
                          📞 {v.driverPhone}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px' }}>
                          <MapPin size={13} color="var(--brand-crimson)" />
                          <span>{v.location}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ width: '100px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, marginBottom: '2px' }}>
                            <span>{v.fuelPct}%</span>
                            <Fuel size={12} color={v.fuelPct < 30 ? '#DC2626' : '#059669'} />
                          </div>
                          <div style={{ height: '5px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${v.fuelPct}%`,
                                height: '100%',
                                background: v.fuelPct < 30 ? '#DC2626' : v.fuelPct < 60 ? '#D97706' : '#059669',
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td>
                        {v.status === 'available' && <span className="badge present">{t('Available', 'উপলব্ধ', lang)}</span>}
                        {v.status === 'in_transit' && <span className="badge meeting">{t('In Transit', 'চলমান', lang)}</span>}
                        {v.status === 'loading' && <span className="badge warn">{t('Loading Bitumen', 'লোড হচ্ছে', lang)}</span>}
                        {v.status === 'maintenance' && <span className="badge absent">{t('Under Maintenance', 'মেরামত চলছে', lang)}</span>}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
                          <button
                            className="btn-sm-ghost"
                            style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => setSelectedVehicleTelemetry(v)}
                          >
                            <Activity size={12} color="#1D4ED8" />
                            HUD
                          </button>
                          <button
                            className="btn-sm-ghost"
                            style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => handleIssueFuelSlip(v)}
                          >
                            <QrCode size={12} />
                            Fuel
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 4: FUEL MANAGEMENT & ANTI-PILFERAGE
          ══════════════════════════════════════════════════════════════ */}
      {!isEmployee && activeTab === 'fuel' && (
        <div className="card mb-5" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
          <div style={{ padding: '12px 18px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={16} color="#D97706" />
              <strong style={{ fontSize: '12.5px', color: 'var(--brand-slate-900)' }}>
                {t('Driver Anti-Pilferage & Fuel Efficiency Incentive Program', 'চালক সততা ও জ্বালানি সাশ্রয় ইনসেন্টিভ প্রোগ্রাম', lang)}
              </strong>
            </div>
            <span className="badge success">
              {t('Zero Fuel Theft: 9 Months Streak', 'জ্বালানি অপচয় রোধ: ৯ মাস অক্ষুণ্ণ', lang)}
            </span>
          </div>
          <div className="responsive-col-3" style={{ padding: '16px 18px', fontSize: '12px' }}>
            <div className="driver-score-card">
              <div>
                <div style={{ fontWeight: 700 }}>Md. Shahidul Islam</div>
                <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)' }}>Prado TXL • Score: 98.4%</div>
              </div>
              <span className="badge gold">+৳ 3,500 Bonus</span>
            </div>

            <div className="driver-score-card">
              <div>
                <div style={{ fontWeight: 700 }}>Babul Hossain</div>
                <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)' }}>Bitumen Tanker #V-03 • Zero Variance</div>
              </div>
              <span className="badge gold">+৳ 4,200 Bonus</span>
            </div>

            <div className="driver-score-card">
              <div>
                <div style={{ fontWeight: 700 }}>Abdul Mannan</div>
                <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)' }}>HiAce Transit • 100% On-Time</div>
              </div>
              <span className="badge gold">+৳ 2,800 Bonus</span>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          MODAL: SUBMIT NEW VEHICLE REQUISITION (For Employee & All Roles)
          ══════════════════════════════════════════════════════════════ */}
      {showNewRequisitionModal && (
        <div className="modal-bg" onClick={() => setShowNewRequisitionModal(false)}>
          <div className="modal" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-hd" style={{ background: '#0F172A', color: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Car size={18} color="#FBBF24" />
                <h3 style={{ color: '#fff', margin: 0 }}>
                  {t('Submit Official Duty Travel Vehicle Requisition', 'দাপ্তরিক যাতায়াত যানবাহন আবেদনপত্র', lang)}
                </h3>
              </div>
              <button className="modal-close" style={{ color: '#fff' }} onClick={() => setShowNewRequisitionModal(false)}>×</button>
            </div>

            <div className="modal-body" style={{ maxHeight: '74vh', overflowY: 'auto' }}>
              {/* Trip Type Selector */}
              <div className="form-group mb-3">
                <label style={{ fontSize: '12px', fontWeight: 700 }}>{t('Trip Type', 'যাত্রার ধরন', lang)}</label>
                <div className="responsive-col-2-eq" style={{ gap: '10px' }}>
                  <button
                    type="button"
                    style={{
                      padding: '10px',
                      borderRadius: '6px',
                      border: tripType === 'round_trip' ? '2px solid #1D4ED8' : '1px solid #CBD5E1',
                      background: tripType === 'round_trip' ? '#EFF6FF' : '#FFF',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                    onClick={() => setTripType('round_trip')}
                  >
                    <div style={{ fontWeight: 800, fontSize: '13px', color: tripType === 'round_trip' ? '#1D4ED8' : '#0F172A' }}>
                      🔄 Round Trip (Going & Returning)
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#64748B' }}>Same vehicle will wait and bring passengers back</div>
                  </button>

                  <button
                    type="button"
                    style={{
                      padding: '10px',
                      borderRadius: '6px',
                      border: tripType === 'one_way' ? '2px solid #1D4ED8' : '1px solid #CBD5E1',
                      background: tripType === 'one_way' ? '#EFF6FF' : '#FFF',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                    onClick={() => setTripType('one_way')}
                  >
                    <div style={{ fontWeight: 800, fontSize: '13px', color: tripType === 'one_way' ? '#1D4ED8' : '#0F172A' }}>
                      ➡️ One-Way Transit Drop-off
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#64748B' }}>Drop passengers at target destination only</div>
                  </button>
                </div>
              </div>

              {/* Required Vehicle Class */}
              <div className="form-group mb-3">
                <label style={{ fontSize: '12px', fontWeight: 700 }}>{t('Required Vehicle Capacity / Class', 'প্রয়োজনীয় গাড়ির ধরন', lang)}</label>
                <div className="responsive-col-4" style={{ gap: '8px' }}>
                  {[
                    { id: 'sedan_4', label: 'Sedan (4-Seats)', desc: 'Executive / Meeting' },
                    { id: 'microbus_7', label: 'HiAce (7-Seats)', desc: 'Team Delegation' },
                    { id: 'pickup_4x4', label: 'Pickup 4x4', desc: 'Refinery Emergency' },
                    { id: 'tanker_heavy', label: 'Tanker (Bulk)', desc: 'Industrial Bitumen' },
                  ].map(vClass => (
                    <button
                      key={vClass.id}
                      type="button"
                      style={{
                        padding: '8px 6px',
                        borderRadius: '6px',
                        border: requiredCapacity === vClass.id ? '2px solid #1D4ED8' : '1px solid #CBD5E1',
                        background: requiredCapacity === vClass.id ? '#EFF6FF' : '#FFF',
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}
                      onClick={() => setRequiredCapacity(vClass.id as any)}
                    >
                      <div style={{ fontSize: '12px', fontWeight: 800, color: requiredCapacity === vClass.id ? '#1D4ED8' : '#0F172A' }}>
                        {vClass.label}
                      </div>
                      <div style={{ fontSize: '9.5px', color: '#64748B' }}>{vClass.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Route: From & To */}
              <div className="form-row mb-3">
                <div className="form-group">
                  <label>{t('Pickup Location / Origin Office', 'যাত্রার প্রারম্ভিক স্থান', lang)}</label>
                  <select value={fromLoc} onChange={(e) => setFromLoc(e.target.value)}>
                    <option value="Bashundhara Corporate HQ, Baridhara">Bashundhara Corporate HQ, Baridhara</option>
                    <option value="Keraniganj Bitumen Refinery Complex">Keraniganj Bitumen Refinery Complex</option>
                    <option value="Bashundhara City, Panthapath">Bashundhara City, Panthapath Office</option>
                    <option value="Chittagong Terminal Office">Chittagong Terminal Office</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>{t('Target Destination', 'গন্তব্য স্থান', lang)}</label>
                  <input
                    type="text"
                    value={toLoc}
                    onChange={(e) => setToLoc(e.target.value)}
                    placeholder="e.g. Keraniganj Bitumen Plant Gate #1 / Bangladesh Bank"
                  />
                </div>
              </div>

              {/* Date & Time */}
              <div className="form-row mb-3">
                <div className="form-group">
                  <label>{t('Departure Date & Time', 'যাত্রার সময়', lang)}</label>
                  <input
                    type="text"
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                  />
                </div>

                {tripType === 'round_trip' && (
                  <div className="form-group">
                    <label>{t('Expected Return Time', 'প্রত্যাবর্তনের সময়', lang)}</label>
                    <input
                      type="text"
                      value={returnTime}
                      onChange={(e) => setReturnTime(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* Passengers */}
              <div className="form-row mb-3">
                <div className="form-group">
                  <label>{t('Number of Passengers', 'যাত্রী সংখ্যা', lang)}</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={passengersCount}
                    onChange={(e) => setPassengersCount(Number(e.target.value))}
                  />
                </div>
                <div className="form-group">
                  <label>{t('Passenger Names & Designations', 'যাত্রীদের নাম ও পদবি', lang)}</label>
                  <input
                    type="text"
                    value={passengerNames}
                    onChange={(e) => setPassengerNames(e.target.value)}
                  />
                </div>
              </div>

              {/* Official Purpose & Cost Center */}
              <div className="form-group mb-3">
                <label>{t('Official Business Purpose / Justification', 'দাপ্তরিক কাজের উদ্দেশ্য ও যৌক্তিকতা', lang)}</label>
                <textarea
                  rows={2}
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="Specify client meeting, refinery engineering inspection, or ministry tender submission..."
                />
              </div>

              <div className="form-group">
                <label>{t('Cost Center / Department Billing Code', 'বিভাগীয় কস্ট সেন্টার কোড', lang)}</label>
                <input
                  type="text"
                  value={costCenter}
                  onChange={(e) => setCostCenter(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-ft">
              <button className="btn-sm-ghost" onClick={() => setShowNewRequisitionModal(false)}>{t('Cancel', 'বাতিল', lang)}</button>
              <button className="btn-primary" onClick={handleCreateRequisition}>
                <Car size={14} />
                {t('Submit Requisition to Transport Admin', 'পরিবহন প্রশাসনে আবেদন দাখিল করুন', lang)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          MODAL: TRANSPORT ADMIN ASSIGNMENT MODAL (Vehicle + Driver)
          ══════════════════════════════════════════════════════════════ */}
      {assigningReq && (
        <div className="modal-bg" onClick={() => setAssigningReq(null)}>
          <div className="modal" style={{ maxWidth: '620px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-hd" style={{ background: '#0F172A', color: '#fff' }}>
              <div>
                <h3 style={{ color: '#fff', margin: 0 }}>
                  {t('Dispatch Desk: Assign Vehicle & Driver', 'গাড়ি ও চালক বরাদ্দ করণ', lang)}
                </h3>
                <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                  Requisition ID: <strong>{assigningReq.id}</strong> • Requester: <strong>{assigningReq.requesterName}</strong>
                </div>
              </div>
              <button className="modal-close" style={{ color: '#fff' }} onClick={() => setAssigningReq(null)}>×</button>
            </div>

            <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
              {/* Requisition Summary Card */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '12px 14px', borderRadius: '6px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span><strong>Route:</strong> {assigningReq.from.split(',')[0]} ➔ {assigningReq.to.split(',')[0]}</span>
                  <span className="badge info">{assigningReq.tripType === 'round_trip' ? 'Round Trip' : 'One-Way'}</span>
                </div>
                <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '4px' }}>
                  Departure: <strong>{assigningReq.departureTime}</strong> • Passengers: <strong>{assigningReq.passengersCount} ({assigningReq.passengerNames})</strong>
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--brand-slate-700)', marginTop: '4px' }}>
                  Purpose: <em>{assigningReq.purpose}</em>
                </div>
              </div>

              {/* Vehicle Selection */}
              <div className="form-group mb-3">
                <label style={{ fontSize: '12px', fontWeight: 800 }}>1. Select Roadworthy Vehicle from Fleet:</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {vehicles.map(v => (
                    <div
                      key={v.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: assignCarPlate === v.plate ? '2px solid #1D4ED8' : '1px solid #CBD5E1',
                        background: assignCarPlate === v.plate ? '#EFF6FF' : '#FFF',
                        cursor: 'pointer'
                      }}
                      onClick={() => setAssignCarPlate(v.plate)}
                    >
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '12.5px' }}>{v.plate}</div>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>{v.model} • Seats: {v.capacitySeats} • Location: {v.location.split('(')[0]}</div>
                      </div>
                      <span className={`badge ${v.status === 'available' ? 'present' : 'warn'}`}>
                        {v.status.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Driver Selection */}
              <div className="form-group mb-3">
                <label style={{ fontSize: '12px', fontWeight: 800 }}>2. Select Certified Driver (Sobriety & License Verified):</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {drivers.map(d => (
                    <div
                      key={d.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: assignDriverId === d.id ? '2px solid #059669' : '1px solid #CBD5E1',
                        background: assignDriverId === d.id ? '#ECFDF5' : '#FFF',
                        cursor: 'pointer'
                      }}
                      onClick={() => setAssignDriverId(d.id)}
                    >
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '12.5px' }}>{d.name} ({d.phone})</div>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>License: {d.licenseNo} • Breathalyzer: <strong style={{ color: '#059669' }}>{d.breathalyzerToday}</strong></div>
                      </div>
                      <span className={`badge ${d.status === 'available' ? 'present' : 'warn'}`}>
                        {d.status.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-ft">
              <button className="btn-sm-ghost" onClick={() => setAssigningReq(null)}>{t('Cancel', 'বাতিল', lang)}</button>
              <button className="btn-gold" style={{ fontWeight: 800 }} onClick={handleConfirmAssignment}>
                <Check size={14} />
                {t('Confirm Assignment & Dispatch Challan', 'বরাদ্দ ও ট্রিপ চালান ইস্যু করুন', lang)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          MODAL: OFFICIAL DIGITAL TRIP CHALLAN PASS (For Requester & Gate)
          ══════════════════════════════════════════════════════════════ */}
      {selectedTripPassReq && (
        <div className="modal-bg" onClick={() => setSelectedTripPassReq(null)}>
          <div className="modal" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-hd" style={{ background: '#0F172A', color: '#fff' }}>
              <div>
                <h3 style={{ color: '#fff', margin: 0 }}>
                  {t('Official Vehicle Trip Challan & Security Gate Pass', 'অফিসিয়াল ট্রিপ চালান ও নিরাপত্তা গেট পাস', lang)}
                </h3>
                <div style={{ fontSize: '11px', color: '#FDE68A' }}>Challan No: {selectedTripPassReq.tripPassNo}</div>
              </div>
              <button className="modal-close" style={{ color: '#fff' }} onClick={() => setSelectedTripPassReq(null)}>×</button>
            </div>

            <div className="modal-body">
              <div style={{ border: '2px solid var(--brand-slate-200)', padding: '18px', borderRadius: '6px', background: 'var(--brand-card-bg)' }}>
                <div style={{ textAlign: 'center', borderBottom: '2px solid var(--brand-crimson)', paddingBottom: '12px', marginBottom: '14px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 900, color: 'var(--brand-crimson)', letterSpacing: '0.5px' }}>
                    BASHUNDHARA OIL AND GAS COMPANY LIMITED
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)' }}>Corporate Logistics & Security Gate Administration</div>
                  <div style={{ fontSize: '12px', fontWeight: 800, marginTop: '4px', color: 'var(--brand-slate-900)' }}>
                    OFFICIAL DUTY TRAVEL CHALLAN PASS
                  </div>
                </div>

                <div className="responsive-col-2-eq" style={{ gap: '10px', fontSize: '11.5px', marginBottom: '14px' }}>
                  <div><strong>Pass Ref:</strong> {selectedTripPassReq.tripPassNo}</div>
                  <div><strong>Date of Issue:</strong> 17 Oct 2026</div>
                  <div><strong>Authorized Requester:</strong> {selectedTripPassReq.requesterName}</div>
                  <div><strong>Department:</strong> {selectedTripPassReq.dept}</div>
                  <div><strong>Assigned Vehicle:</strong> <span style={{ color: '#059669', fontWeight: 800 }}>{selectedTripPassReq.assignedVehiclePlate}</span></div>
                  <div><strong>Vehicle Model:</strong> {selectedTripPassReq.assignedVehicleModel}</div>
                  <div><strong>Assigned Driver:</strong> {selectedTripPassReq.assignedDriverName}</div>
                  <div><strong>Driver Contact:</strong> {selectedTripPassReq.assignedDriverPhone}</div>
                  <div><strong>Authorized Route:</strong> {selectedTripPassReq.from.split(',')[0]} ➔ {selectedTripPassReq.to.split(',')[0]}</div>
                  <div><strong>Trip Mode:</strong> {selectedTripPassReq.tripType === 'round_trip' ? 'Round Trip (Return Authorized)' : 'One-Way Drop-off'}</div>
                </div>

                <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '10px', fontSize: '11.5px', marginBottom: '14px' }}>
                  <strong>Official Duty Purpose:</strong> {selectedTripPassReq.purpose}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E2E8F0', paddingTop: '14px' }}>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>
                    Security Gate Clearance Barcode:<br />
                    <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#0F172A' }}>*BOGCL-TRIP-{selectedTripPassReq.tripPassNo}*</span>
                    <div style={{ color: '#059669', fontWeight: 700, marginTop: '4px' }}>✓ Gate Outward Verified by Transport Admin</div>
                  </div>
                  <QrCode size={70} color="#0F172A" />
                </div>
              </div>
            </div>

            <div className="modal-ft">
              <button className="btn-sm-ghost" onClick={() => setSelectedTripPassReq(null)}>{t('Close', 'বন্ধ করুন', lang)}</button>
              <button
                className="btn-primary"
                onClick={() => {
                  showToast(t(`Challan Pass ${selectedTripPassReq.tripPassNo} sent to printer.`, `চালান পাস প্রিন্টারে পাঠানো হয়েছে।`, lang), 'success');
                  setSelectedTripPassReq(null);
                }}
              >
                <Printer size={14} />
                {t('Print Official Trip Pass', 'ট্রিপ পাস প্রিন্ট করুন', lang)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          MODAL: FUEL SLIP
          ══════════════════════════════════════════════════════════════ */}
      {showFuelModal && (
        <div className="modal-bg" onClick={() => setShowFuelModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-hd">
              <h3>
                <Fuel size={18} />
                {t('Issue Digital Fuel Requisition Slip', 'ডিজিটাল ফুয়েল স্লিপ ইস্যু', lang)}
              </h3>
              <button className="modal-close" onClick={() => setShowFuelModal(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '16px', background: '#F8FAFC', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Target Vehicle</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--brand-slate-900)', marginTop: '2px' }}>
                  {showFuelModal.plate}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--brand-slate-600)' }}>
                  {showFuelModal.model} • Driver: {showFuelModal.driverName} ({showFuelModal.driverPhone})
                </div>
              </div>

              <div className="form-group">
                <label>{t('Authorized Fuel Station / Pump', 'অনুমোদিত ফিলিং স্টেশন', lang)}</label>
                <select value={fuelStation} onChange={(e) => setFuelStation(e.target.value)}>
                  <option value="Bashundhara Filling Station, 300 Feet Road">Bashundhara Filling Station, 300 Feet Road</option>
                  <option value="Keraniganj Plant Dedicated Diesel Dispenser">Keraniganj Plant Dedicated Diesel Dispenser (In-House)</option>
                  <option value="Padma Oil Depot, Fatullah, Narayanganj">Padma Oil Depot, Fatullah, Narayanganj</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>{t('Fuel Volume (Liters)', 'জ্বালানির পরিমাণ (লিটার)', lang)}</label>
                  <input
                    type="text"
                    value={fuelLiters}
                    onChange={(e) => setFuelLiters(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>{t('Fuel Category', 'জ্বালানির ধরন', lang)}</label>
                  <select defaultValue="Octane">
                    <option value="Octane">Octane (Euro-4 Standard)</option>
                    <option value="Diesel">Diesel (Low Sulfur - Industrial)</option>
                    <option value="CNG">CNG Compressed Gas</option>
                  </select>
                </div>
              </div>

              <div style={{ background: 'var(--status-warning-bg)', border: '1px solid var(--status-warning)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: '11.5px', color: 'var(--status-warning)' }}>
                🔒 <strong>OTP Security:</strong> A 4-digit verification PIN and single-use QR Code will be sent to the driver. The pump operator will scan to validate before fuel dispensing.
              </div>
            </div>
            <div className="modal-ft">
              <button className="btn-sm-ghost" onClick={() => setShowFuelModal(null)}>{t('Cancel', 'বাতিল', lang)}</button>
              <button className="btn-primary" onClick={confirmFuelSlip}>
                <QrCode size={14} />
                {t('Issue QR Fuel Voucher', 'কিউআর ভাউচার ইস্যু করুন', lang)}
              </button>
            </div>
          </div>
        </div>
      )}

      <RegisterVehicleModal
        isOpen={showRegisterVehicleModal}
        onClose={() => setShowRegisterVehicleModal(false)}
        lang={lang}
      />

      <EnrollDriverModal
        isOpen={showEnrollDriverModal}
        onClose={() => setShowEnrollDriverModal(false)}
        lang={lang}
      />
    </div>
  );
}
