import React, { useState } from 'react';
import {
  Truck, Navigation, Receipt, ShieldCheck, MapPin, Phone,
  AlertTriangle, Clock, CheckCircle, Car, ArrowRight, Gauge,
  AlertOctagon, Plus, Send, Check, QrCode, Play, Flag, MessageSquare
} from 'lucide-react';
import { t } from '../../types';
import { showToast } from '../../App';
import { useFleetStore } from '../../store/fleetStore';
import { DashboardSubViewProps } from './types';

export default function DriverDashboard({
  lang,
  activeTab
}: DashboardSubViewProps) {
  const {
    requisitions,
    drivers,
    vehicles,
    startTrip,
    completeTrip,
    sendChatMessage
  } = useFleetStore();

  // Active driver persona: Md. Rafiqul Islam (DRV-01)
  const currentDriver = drivers.find(d => d.id === 'DRV-01') || drivers[0];
  const activeMission = requisitions.find(
    r => r.assignedDriverId === currentDriver?.id || r.status === 'in_transit' || r.status === 'assigned'
  ) || requisitions[0];

  const assignedVehicle = vehicles.find(v => v.plate === activeMission?.assignedVehiclePlate) || vehicles[0];

  const [tollModalOpen, setTollModalOpen] = useState(false);
  const [tollPlaza, setTollPlaza] = useState('Babubazar Buriganga Second Bridge');
  const [tollAmount, setTollAmount] = useState('150');
  const [tollSlips, setTollSlips] = useState([
    { id: 'TOL-901', plaza: 'Babubazar Buriganga Bridge', amount: 150, time: '09:40 AM', status: 'Approved' },
    { id: 'TOL-884', plaza: 'Mayor Hanif Flyover (Dhaka Exit)', amount: 260, time: '28 Oct 2026', status: 'Reimbursed' },
  ]);

  const handleStartMission = () => {
    if (!activeMission) return;
    startTrip(activeMission.id, 42350, '09:15 AM');
    showToast(
      t(
        `✓ Trip ${activeMission.id} started! Vehicle logged out of gate bay.`,
        `✓ ট্রিপ ${activeMission.id} শুরু হয়েছে! গাড়ি গেইট থেকে রওনা হয়েছে।`,
        lang
      ),
      'success'
    );
  };

  const handleCompleteMission = () => {
    if (!activeMission) return;
    completeTrip(activeMission.id, 42395, '11:45 AM', 5, 'Trip completed smoothly');
    showToast(
      t(
        `✓ Mission completed! Trip ${activeMission.id} successfully marked as finished.`,
        `✓ ট্রিপ সফলভাবে সম্পন্ন হয়েছে!`,
        lang
      ),
      'success'
    );
  };

  const handleNotifyPassenger = () => {
    if (!activeMission) return;
    sendChatMessage(
      activeMission.id,
      'driver',
      currentDriver ? currentDriver.name : 'Driver',
      `📍 Assalamu Alaikum Sir, I have arrived at the pickup location (${activeMission.from}). Vehicle (${activeMission.assignedVehiclePlate || assignedVehicle.plate}) is parked and waiting.`
    );
    showToast(
      t(
        `Arrival message sent to passenger ${activeMission.requesterName}!`,
        `${activeMission.requesterName}-কে আগমন বার্তা পাঠানো হয়েছে!`,
        lang
      ),
      'success'
    );
  };

  const handleAddToll = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(tollAmount) || 0;
    if (amt <= 0) return;
    const newSlip = {
      id: `TOL-${Math.floor(100 + Math.random() * 900)}`,
      plaza: tollPlaza,
      amount: amt,
      time: 'Just now',
      status: 'Pending Verification',
    };
    setTollSlips([newSlip, ...tollSlips]);
    setTollModalOpen(false);
    showToast(
      t(
        `✓ Toll slip of ৳${amt} submitted to Central Transport Desk!`,
        `✓ ৳${amt} টাকার টোল স্লিপ সফলভাবে দাখিল করা হয়েছে!`,
        lang
      ),
      'gold'
    );
  };

  return (
    <>
      {/* ─── 1. OVERVIEW TAB ─── */}
      {(activeTab === 'overview' || !activeTab) && (
        <div className="tab-pane-fade">
          {/* Quick Mission Summary Card */}
          {activeMission && (
            <div className="card mb-4" style={{
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.98) 100%)',
              border: '1.5px solid rgba(212, 175, 55, 0.4)',
              color: '#fff',
              padding: '20px 24px',
              borderRadius: '16px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(212, 175, 55, 0.2)', border: '1px solid #D4AF37', color: '#FDE047', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 800 }}>
                    <Navigation size={12} />
                    <span>{t('ASSIGNED DUTY TRIP', 'নির্ধারিত অফিশিয়াল ট্রিপ', lang)}</span>
                  </div>
                  <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#fff', margin: '8px 0 2px' }}>
                    {activeMission.from} ➔ {activeMission.to}
                  </h3>
                  <div style={{ fontSize: '12px', color: '#94A3B8' }}>
                    Pass No: <code style={{ color: '#FDE047', fontWeight: 700 }}>{activeMission.tripPassNo || 'TC-2026-9042'}</code> • Passenger: <strong>{activeMission.requesterName}</strong>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span className={`badge ${activeMission.status === 'in_transit' ? 'success' : 'gold'}`} style={{ fontSize: '12px', padding: '4px 12px' }}>
                    {activeMission.status === 'in_transit' ? 'IN TRANSIT' : 'ASSIGNED / READY'}
                  </span>
                  <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>
                    Departure: {activeMission.departureTime || '09:00 AM'}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {activeMission.status === 'assigned' && (
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ background: '#059669', borderColor: '#059669', fontWeight: 800, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    onClick={handleStartMission}
                  >
                    <Play size={14} /> {t('Start Trip (Gate Out)', 'ট্রিপ শুরু করুন', lang)}
                  </button>
                )}

                {activeMission.status === 'in_transit' && (
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ background: '#2563EB', borderColor: '#2563EB', fontWeight: 800, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    onClick={handleCompleteMission}
                  >
                    <Flag size={14} /> {t('Complete Trip', 'ট্রিপ সমাপ্ত করুন', lang)}
                  </button>
                )}

                <button
                  type="button"
                  className="btn-outline"
                  style={{ color: '#FDE047', borderColor: 'rgba(212, 175, 55, 0.6)', background: 'rgba(212, 175, 55, 0.1)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  onClick={handleNotifyPassenger}
                >
                  <MapPin size={14} /> {t('Notify Arrival', 'পৌঁছানোর বার্তা', lang)}
                </button>

                <button
                  type="button"
                  className="btn-outline"
                  style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.2)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  onClick={() => setTollModalOpen(true)}
                >
                  <Receipt size={14} /> {t('Add Toll Slip', 'টোল স্লিপ', lang)}
                </button>
              </div>
            </div>
          )}

          {/* 2-Column Driver Status & Vehicle Health Radar */}
          <div className="responsive-col-2">
            {/* Left: Driver Duty & Compliance */}
            <div className="card">
              <div className="card-hd">
                <div className="card-hd-left">
                  <div className="card-hd-icon" style={{ background: '#ECFDF5', color: '#059669' }}>
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <div className="card-title">{t('Driver Duty & Safety Status', 'ড্রাইভার ডিউটি ও নিরাপত্তা অবস্থা', lang)}</div>
                    <div className="card-subtitle">{t('Daily fitness and vehicle verification', 'দৈনিক ফিটনেস ও যানবাহন অনুমোদন', lang)}</div>
                  </div>
                </div>
                <span className="badge success">On Duty</span>
              </div>
              <div className="card-body" style={{ fontSize: '12.5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--brand-slate-100)' }}>
                  <span style={{ color: 'var(--brand-slate-500)' }}>Driver Name:</span>
                  <strong>{currentDriver ? currentDriver.name : 'Md. Rafiqul Islam'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--brand-slate-100)' }}>
                  <span style={{ color: 'var(--brand-slate-500)' }}>Staff ID & License:</span>
                  <strong>DRV-01 (Heavy License: DL-DH-90142)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--brand-slate-100)' }}>
                  <span style={{ color: 'var(--brand-slate-500)' }}>Today Shift Hours:</span>
                  <strong>4.5 / 8.0 Hours (Normal limit)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                  <span style={{ color: 'var(--brand-slate-500)' }}>Performance Rating:</span>
                  <strong style={{ color: '#D97706' }}>★ 4.9 / 5.0 (Safe Driving Record)</strong>
                </div>
              </div>
            </div>

            {/* Right: Assigned Vehicle Status */}
            <div className="card">
              <div className="card-hd">
                <div className="card-hd-left">
                  <div className="card-hd-icon" style={{ background: '#EFF6FF', color: '#2563EB' }}>
                    <Gauge size={16} />
                  </div>
                  <div>
                    <div className="card-title">{t('Assigned Vehicle Condition', 'বরাদ্দকৃত গাড়ির অবস্থা', lang)}</div>
                    <div className="card-subtitle">{assignedVehicle.model} ({assignedVehicle.plate})</div>
                  </div>
                </div>
                <span className="badge info">Active</span>
              </div>
              <div className="card-body" style={{ fontSize: '12.5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--brand-slate-100)' }}>
                  <span style={{ color: 'var(--brand-slate-500)' }}>Fuel Level:</span>
                  <strong style={{ color: '#059669' }}>78% Full (Approx. 38 Liters)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--brand-slate-100)' }}>
                  <span style={{ color: 'var(--brand-slate-500)' }}>Odometer:</span>
                  <strong>42,350 km</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--brand-slate-100)' }}>
                  <span style={{ color: 'var(--brand-slate-500)' }}>Tire Pressure:</span>
                  <strong>32 PSI (Standard)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                  <span style={{ color: 'var(--brand-slate-500)' }}>Next Maintenance:</span>
                  <strong>In 3,400 km</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── 2. ACTIVE MISSION TAB (CRITICAL: FULL WORKSPACE) ─── */}
      {activeTab === 'mission' && (
        <div className="tab-pane-fade">
          {activeMission ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Mission Header Card */}
              <div className="card" style={{ padding: '20px 24px', borderLeft: '5px solid var(--brand-crimson)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <span className="badge info" style={{ marginBottom: '6px', fontSize: '11px' }}>
                      Trip ID: {activeMission.id}
                    </span>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '2px 0 4px', color: 'var(--brand-slate-900)' }}>
                      {activeMission.from} ➔ {activeMission.to}
                    </h3>
                    <div style={{ fontSize: '12px', color: 'var(--brand-slate-500)' }}>
                      Official Purpose: <strong>{activeMission.purpose}</strong>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span className={`badge ${activeMission.status === 'in_transit' ? 'success' : 'gold'}`} style={{ fontSize: '12.5px', padding: '6px 14px' }}>
                      {activeMission.status === 'in_transit' ? 'IN TRANSIT' : 'READY TO DEPART'}
                    </span>
                    <div style={{ fontSize: '11.5px', color: 'var(--brand-slate-500)', marginTop: '4px' }}>
                      Gate Pass: <code>{activeMission.tripPassNo || 'TC-2026-9042'}</code>
                    </div>
                  </div>
                </div>

                {/* Progress Tracker */}
                <div style={{ background: 'var(--brand-slate-50)', padding: '14px 18px', borderRadius: '8px', border: '1px solid var(--brand-slate-200)', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', fontWeight: 700, marginBottom: '8px' }}>
                    <span style={{ color: '#059669' }}>1. Requisition Approved ✓</span>
                    <span style={{ color: activeMission.status === 'in_transit' || activeMission.status === 'completed' ? '#059669' : '#D97706' }}>
                      2. Vehicle Dispatched {activeMission.status === 'in_transit' ? '⏳' : ''}
                    </span>
                    <span style={{ color: activeMission.status === 'completed' ? '#059669' : 'var(--brand-slate-400)' }}>
                      3. Return & Trip Completed
                    </span>
                  </div>
                  <div style={{ height: '6px', width: '100%', background: 'var(--brand-slate-200)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: activeMission.status === 'completed' ? '100%' : activeMission.status === 'in_transit' ? '65%' : '35%',
                      background: 'var(--brand-crimson)',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>

                {/* Mission Details Grid */}
                <div className="responsive-col-3" style={{ gap: '14px', marginBottom: '18px', fontSize: '12.5px' }}>
                  <div style={{ padding: '12px', background: 'var(--brand-card-bg)', border: '1px solid var(--brand-slate-200)', borderRadius: '8px' }}>
                    <div style={{ color: 'var(--brand-slate-500)', fontSize: '11px', textTransform: 'uppercase' }}>Passenger</div>
                    <strong style={{ fontSize: '14px', display: 'block', marginTop: '2px' }}>{activeMission.requesterName}</strong>
                    <div style={{ color: 'var(--brand-slate-600)', marginTop: '2px' }}>{activeMission.dept}</div>
                  </div>

                  <div style={{ padding: '12px', background: 'var(--brand-card-bg)', border: '1px solid var(--brand-slate-200)', borderRadius: '8px' }}>
                    <div style={{ color: 'var(--brand-slate-500)', fontSize: '11px', textTransform: 'uppercase' }}>Assigned Vehicle</div>
                    <strong style={{ fontSize: '14px', display: 'block', marginTop: '2px', fontFamily: 'monospace' }}>
                      {activeMission.assignedVehiclePlate || assignedVehicle.plate}
                    </strong>
                    <div style={{ color: 'var(--brand-slate-600)', marginTop: '2px' }}>
                      {activeMission.assignedVehicleModel || assignedVehicle.model}
                    </div>
                  </div>

                  <div style={{ padding: '12px', background: 'var(--brand-card-bg)', border: '1px solid var(--brand-slate-200)', borderRadius: '8px' }}>
                    <div style={{ color: 'var(--brand-slate-500)', fontSize: '11px', textTransform: 'uppercase' }}>Schedule & Date</div>
                    <strong style={{ fontSize: '14px', display: 'block', marginTop: '2px' }}>{activeMission.createdAt}</strong>
                    <div style={{ color: 'var(--brand-slate-600)', marginTop: '2px' }}>Departure: {activeMission.departureTime}</div>
                  </div>
                </div>

                {/* Primary Action Controls */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', paddingTop: '10px', borderTop: '1px solid var(--brand-slate-200)' }}>
                  {activeMission.status === 'assigned' && (
                    <button
                      type="button"
                      className="btn-primary"
                      style={{ padding: '10px 20px', fontSize: '13px', fontWeight: 800, background: '#059669', borderColor: '#059669', display: 'flex', alignItems: 'center', gap: '8px' }}
                      onClick={handleStartMission}
                    >
                      <Play size={16} /> {t('Start Trip (Depart Gate)', 'ট্রিপ শুরু করুন (গেইট প্রস্থান)', lang)}
                    </button>
                  )}

                  {activeMission.status === 'in_transit' && (
                    <button
                      type="button"
                      className="btn-primary"
                      style={{ padding: '10px 20px', fontSize: '13px', fontWeight: 800, background: '#2563EB', borderColor: '#2563EB', display: 'flex', alignItems: 'center', gap: '8px' }}
                      onClick={handleCompleteMission}
                    >
                      <Flag size={16} /> {t('Complete Trip (Return to Bay)', 'ট্রিপ সমাপ্ত করুন (গাড়ির শেডে প্রত্যাবর্তন)', lang)}
                    </button>
                  )}

                  <button
                    type="button"
                    className="btn-outline"
                    style={{ fontSize: '12.5px', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    onClick={handleNotifyPassenger}
                  >
                    <MapPin size={15} color="#059669" />
                    {t('Send Arrival Notification', 'পৌঁছানোর নোটিফিকেশন পাঠান', lang)}
                  </button>

                  <button
                    type="button"
                    className="btn-outline"
                    style={{ fontSize: '12.5px', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    onClick={() => {
                      showToast(t(`Calling passenger ${activeMission.requesterName}...`, `যাত্রীকে কল করা হচ্ছে...`, lang), 'info');
                    }}
                  >
                    <Phone size={15} color="#2563EB" />
                    {t('Call Passenger', 'যাত্রীকে কল করুন', lang)}
                  </button>

                  <button
                    type="button"
                    className="btn-outline"
                    style={{ fontSize: '12.5px', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    onClick={() => setTollModalOpen(true)}
                  >
                    <Receipt size={15} color="#D97706" />
                    {t('Submit Toll Expense Slip', 'টোল স্লিপ জমা দিন', lang)}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: '36px', textAlign: 'center' }}>
              <Navigation size={36} color="var(--brand-slate-400)" style={{ margin: '0 auto 10px' }} />
              <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--brand-slate-800)' }}>
                {t('No Active Mission Assigned', 'কোনো সক্রিয় ট্রিপ নেই', lang)}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--brand-slate-500)', marginTop: '4px' }}>
                {t('You are currently on standby at the Transport Pool.', 'বর্তমানে আপনি গাড়ি ডিপোতে স্ট্যান্ডবাই আছেন।', lang)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ─── 3. TOLLS TAB ─── */}
      {activeTab === 'tolls' && (
        <div className="card tab-pane-fade">
          <div className="card-hd">
            <div className="card-hd-left">
              <div className="card-hd-icon"><Receipt size={16} /></div>
              <div>
                <div className="card-title">{t('Highway Toll Expense Claims', 'হাইওয়ে টোল স্লিপ ও খরচের হিসাব', lang)}</div>
                <div className="card-subtitle">{t('Direct submission with verified plaza rates for driver reimbursement', 'টোল প্লাজা খরচের হিসাব ও রিইমবার্সমেন্ট রেকর্ড', lang)}</div>
              </div>
            </div>
            <button className="btn-primary" style={{ fontSize: '11.5px', padding: '6px 14px' }} onClick={() => setTollModalOpen(true)}>
              <Plus size={13} /> {t('Add New Toll Slip', 'নতুন টোল স্লিপ যোগ করুন', lang)}
            </button>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="fleet-table">
                <thead>
                  <tr>
                    <th>{t('Slip ID', 'স্লিপ আইডি', lang)}</th>
                    <th>{t('Toll Plaza Location', 'টোল প্লাজা', lang)}</th>
                    <th>{t('Amount', 'পরিমাণ', lang)}</th>
                    <th>{t('Time', 'সময়', lang)}</th>
                    <th>{t('Status', 'অবস্থা', lang)}</th>
                  </tr>
                </thead>
                <tbody>
                  {tollSlips.map((toll, i) => (
                    <tr key={i}>
                      <td><code>{toll.id}</code></td>
                      <td><strong>{toll.plaza}</strong></td>
                      <td><strong style={{ color: 'var(--brand-crimson)' }}>৳{toll.amount}</strong></td>
                      <td>{toll.time}</td>
                      <td>
                        <span className={`badge ${toll.status === 'Approved' || toll.status === 'Reimbursed' ? 'success' : 'warn'}`}>
                          {toll.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TOLL SUBMISSION MODAL ─── */}
      {tollModalOpen && (
        <div className="modal-bg" onClick={() => setTollModalOpen(false)} style={{ zIndex: 99999, padding: '20px' }}>
          <div className="fleet-modal-dialog" style={{ maxWidth: '480px', width: '95%', background: '#fff', borderRadius: '16px', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div className="fleet-modal-hd" style={{ padding: '16px 22px', background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Receipt size={18} color="#FDE047" />
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>{t('Submit Highway Toll Receipt', 'হাইওয়ে টোল স্লিপ জমা দিন', lang)}</h3>
              </div>
              <button type="button" onClick={() => setTollModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '18px' }}>✕</button>
            </div>
            <form onSubmit={handleAddToll} style={{ padding: '20px 24px' }}>
              <div style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 700 }}>{t('Toll Plaza Location', 'টোল প্লাজা', lang)}</label>
                <select className="form-input" value={tollPlaza} onChange={e => setTollPlaza(e.target.value)} style={{ fontSize: '12.5px' }}>
                  <option value="Babubazar Buriganga Second Bridge">Babubazar Buriganga Second Bridge (৳150)</option>
                  <option value="Mayor Hanif Flyover (Dhaka Exit)">Mayor Hanif Flyover (Dhaka Exit) (৳260)</option>
                  <option value="Postogola Buriganga Bridge">Postogola Buriganga Bridge (৳120)</option>
                  <option value="Padma Bridge Expressway Tolling Point">Padma Bridge Expressway Tolling Point (৳450)</option>
                  <option value="Meghna Ghat Bridge Plaza">Meghna Ghat Bridge Plaza (৳200)</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 700 }}>{t('Voucher Amount (৳)', 'টাকার পরিমাণ', lang)}</label>
                <input type="number" className="form-input" value={tollAmount} onChange={e => setTollAmount(e.target.value)} style={{ fontSize: '13px', fontWeight: 700 }} required />
              </div>

              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '10px 14px', borderRadius: '8px', fontSize: '11px', color: '#64748B', marginBottom: '18px' }}>
                📷 Toll voucher will be logged under your active trip and submitted to the Transport Desk for payment.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn-outline" onClick={() => setTollModalOpen(false)}>{t('Cancel', 'বাতিল', lang)}</button>
                <button type="submit" className="btn-primary" style={{ background: 'linear-gradient(135deg, #A51C30 0%, #700B1A 100%)' }}>
                  <Check size={14} /> {t('Submit Toll Claim', 'দাখিল করুন', lang)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
