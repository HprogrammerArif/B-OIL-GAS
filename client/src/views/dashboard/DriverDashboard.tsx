import React, { useState } from 'react';
import {
  Truck, Navigation, Receipt, ShieldCheck, MapPin, Phone,
  AlertTriangle, Clock, CheckCircle, Car, ArrowRight, Gauge,
  AlertOctagon, Plus, Send, Check, QrCode, Sparkles
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
  const activeMission = requisitions.find(r => r.assignedDriverId === currentDriver.id || r.status === 'assigned' || r.status === 'in_transit') || requisitions[0];
  const assignedVehicle = vehicles.find(v => v.plate === activeMission?.assignedVehiclePlate) || vehicles[0];

  const [tollModalOpen, setTollModalOpen] = useState(false);
  const [tollPlaza, setTollPlaza] = useState('Babubazar Buriganga Second Bridge');
  const [tollAmount, setTollAmount] = useState('150');
  const [tollSlips, setTollSlips] = useState([
    { id: 'TOL-901', plaza: 'Babubazar Buriganga Bridge', amount: 150, time: '09:40 AM', status: 'Approved' },
    { id: 'TOL-884', plaza: 'Mayor Hanif Flyover (Dhaka Exit)', amount: 260, time: 'Yesterday', status: 'Reimbursed' },
  ]);

  const handleNotifyPassenger = () => {
    if (!activeMission) return;
    sendChatMessage(
      activeMission.id,
      'driver',
      currentDriver.name,
      `📍 Salam Sir, I have arrived at pickup point (${activeMission.from.split(',')[0]}). The vehicle (${activeMission.assignedVehiclePlate}) is parked, AC on at 21°C.`
    );
    showToast(
      t(
        `Arrival notification dispatched to ${activeMission.requesterName}!`,
        `${activeMission.requesterName}-কে গাড়ির আগমন বার্তা পাঠানো হয়েছে!`,
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
      status: 'Pending Dispatch Review',
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
      {/* ─── OVERVIEW TAB: ACTIVE MISSION HERO & VEHICLE RADAR ─── */}
      {(activeTab === 'overview' || !activeTab) && (
        <div className="tab-pane-fade">
          {/* Active Mission Hero Card */}
          <div className="card mb-4" style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.98) 100%)',
            border: '1.5px solid rgba(212, 175, 55, 0.4)',
            color: '#fff',
            padding: '24px',
            borderRadius: '16px',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '18px' }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(212, 175, 55, 0.2)', border: '1px solid #D4AF37', color: '#FDE047', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 800 }}>
                  <Navigation size={12} />
                  <span>{t('ACTIVE DUTY MISSION IN PROGRESS', 'চলতি অফিশিয়াল ট্রিপ মিশন', lang)}</span>
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: '8px 0 2px' }}>
                  {activeMission.from.split(',')[0]} ➔ {activeMission.to.split(',')[0]}
                </h3>
                <div style={{ fontSize: '12.5px', color: '#94A3B8' }}>
                  {activeMission.id} • Challan Pass: <code style={{ color: '#FDE047', fontWeight: 700 }}>{activeMission.tripPassNo || 'TC-2026-9042'}</code>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span className="badge success" style={{ fontSize: '12px', padding: '5px 12px' }}>
                  {activeMission.status === 'in_transit' ? 'ON HIGHWAY TRANSIT' : 'DISPATCH READY'}
                </span>
                <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>
                  Gate Out: {activeMission.gateOutTime || '09:15 AM'} • Odometer: 42,350 km
                </div>
              </div>
            </div>

            {/* Passenger & Vehicle Metric Pill Bar */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '14px 18px',
              marginBottom: '18px'
            }}>
              <div>
                <div style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Passenger</div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#fff' }}>{activeMission.requesterName}</div>
                <div style={{ fontSize: '11px', color: '#CBD5E1' }}>{activeMission.dept} (Grade 8)</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Allocated Vehicle</div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#FDE047', fontFamily: 'monospace' }}>
                  {activeMission.assignedVehiclePlate || 'DHAKA-METRO-GA 13-4412'}
                </div>
                <div style={{ fontSize: '11px', color: '#CBD5E1' }}>{activeMission.assignedVehicleModel || 'Toyota Allion Executive'}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Corridor Telemetry</div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#38BDF8' }}>38.4 km (~1h 15m)</div>
                <div style={{ fontSize: '11px', color: '#CBD5E1' }}>Babubazar Bridge Expressway</div>
              </div>
            </div>

            {/* Live Driver Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn-primary"
                style={{
                  padding: '9px 16px',
                  fontSize: '12px',
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  border: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onClick={handleNotifyPassenger}
              >
                <MapPin size={14} />
                {t('Notify Passenger of Arrival at Bay', 'যাত্রীকে আগমন বার্তা পাঠান', lang)}
              </button>

              <button
                type="button"
                className="btn-outline"
                style={{
                  padding: '9px 16px',
                  fontSize: '12px',
                  fontWeight: 700,
                  borderColor: 'rgba(212, 175, 55, 0.6)',
                  color: '#FDE047',
                  background: 'rgba(212, 175, 55, 0.1)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onClick={() => setTollModalOpen(true)}
              >
                <Receipt size={14} />
                {t('Upload Highway Toll Slip', 'হাইওয়ে টোল স্লিপ আপলোড', lang)}
              </button>

              <button
                type="button"
                className="btn-outline"
                style={{
                  padding: '9px 14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  borderColor: 'rgba(255,255,255,0.2)',
                  color: '#CBD5E1',
                  background: 'transparent',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onClick={() => {
                  showToast(t(`Calling passenger ${activeMission.requesterName} (+880 1711-009988)...`, `${activeMission.requesterName}-কে কল করা হচ্ছে...`, lang), 'info');
                }}
              >
                <Phone size={14} />
                {t('Call Passenger', 'যাত্রীকে কল করুন', lang)}
              </button>

              <button
                type="button"
                className="btn-outline"
                style={{
                  padding: '9px 14px',
                  fontSize: '12px',
                  fontWeight: 700,
                  borderColor: '#DC2626',
                  color: '#EF4444',
                  background: 'rgba(220, 38, 38, 0.1)',
                  marginLeft: 'auto',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onClick={() => {
                  showToast(t('🚨 HIGHWAY EMERGENCY SOS BROADCASTED to Central Transport Command & Highway Patrol!', '🚨 জরুরী এসওএস বার্তা পাঠানো হয়েছে!', lang), 'danger');
                }}
              >
                <AlertOctagon size={14} />
                {t('Highway SOS', 'জরুরি সহায়তা', lang)}
              </button>
            </div>
          </div>

          {/* 2-Column Driver Status & Vehicle Health Radar */}
          <div className="responsive-col-2">
            {/* Left: Driver Sobriety & Fitness Radar */}
            <div className="card">
              <div className="card-hd">
                <div className="card-hd-left">
                  <div className="card-hd-icon" style={{ background: '#ECFDF5', color: '#059669' }}>
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <div className="card-title">{t('Daily Sobriety & Duty Hours Compliance', 'দৈনিক ফিটনেস ও অ্যালকোহল টেস্ট', lang)}</div>
                    <div className="card-subtitle">{t('Statutory transport safety audit passed', 'আইনগত পরিবহন নিরাপত্তা অডিট', lang)}</div>
                  </div>
                </div>
                <span className="badge success">0.00% BAC (PASSED)</span>
              </div>
              <div className="card-body" style={{ fontSize: '12.5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--brand-slate-100)' }}>
                  <span style={{ color: 'var(--brand-slate-500)' }}>Breathalyzer Audit:</span>
                  <strong style={{ color: '#059669' }}>0.00% BAC Passed at Gate-1 (05:48 AM)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--brand-slate-100)' }}>
                  <span style={{ color: 'var(--brand-slate-500)' }}>Duty Shift Hours:</span>
                  <strong>4.2 / 8.0 Hours (Well within safe limit)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--brand-slate-100)' }}>
                  <span style={{ color: 'var(--brand-slate-500)' }}>Safety Rating:</span>
                  <strong style={{ color: '#D97706' }}>★ 4.9 / 5.0 (52 Completed Trips)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                  <span style={{ color: 'var(--brand-slate-500)' }}>Driver License:</span>
                  <strong>DL-DH-90142 (Heavy Commercial HAZMAT Valid 2029)</strong>
                </div>
              </div>
            </div>

            {/* Right: Assigned Vehicle Health Telematics */}
            <div className="card">
              <div className="card-hd">
                <div className="card-hd-left">
                  <div className="card-hd-icon" style={{ background: '#EFF6FF', color: '#2563EB' }}>
                    <Gauge size={16} />
                  </div>
                  <div>
                    <div className="card-title">{t('Vehicle Health & Telematics', 'গাড়ির কারিগরি স্বাস্থ্য ও সেন্সর', lang)}</div>
                    <div className="card-subtitle">{assignedVehicle.model} ({assignedVehicle.plate})</div>
                  </div>
                </div>
                <span className="badge info">Telematics Online</span>
              </div>
              <div className="card-body" style={{ fontSize: '12.5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--brand-slate-100)' }}>
                  <span style={{ color: 'var(--brand-slate-500)' }}>Octane / Fuel Tank:</span>
                  <strong style={{ color: '#2563EB' }}>78% Capacity (38L remaining)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--brand-slate-100)' }}>
                  <span style={{ color: 'var(--brand-slate-500)' }}>Engine Coolant Temp:</span>
                  <strong style={{ color: '#059669' }}>88°C (Optimal Operating Window)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--brand-slate-100)' }}>
                  <span style={{ color: 'var(--brand-slate-500)' }}>Tire Pressure Monitor:</span>
                  <strong>32 PSI (All 4 wheels nominal)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                  <span style={{ color: 'var(--brand-slate-500)' }}>Periodic Service:</span>
                  <strong>Next maintenance in 3,420 km</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TOLLS TAB: HIGHWAY TOLL REIMBURSEMENTS ─── */}
      {activeTab === 'tolls' && (
        <div className="card tab-pane-fade">
          <div className="card-hd">
            <div className="card-hd-left">
              <div className="card-hd-icon"><Receipt size={16} /></div>
              <div>
                <div className="card-title">{t('Highway Toll Vouchers & Reimbursement Ledger', 'হাইওয়ে টোল স্লিপ ও প্রতিপূরণ লেজার', lang)}</div>
                <div className="card-subtitle">{t('Direct claim submission with photo receipt to Transport Desk', 'পরিবহন ডেস্কে সরাসরি টোল বিল দাখিল', lang)}</div>
              </div>
            </div>
            <button className="btn-primary" style={{ fontSize: '11.5px', padding: '5px 12px' }} onClick={() => setTollModalOpen(true)}>
              <Plus size={13} /> {t('Submit New Toll Slip', 'নতুন টোল স্লিপ যুক্ত করুন', lang)}
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
                    <th>{t('Submission Time', 'সময়', lang)}</th>
                    <th>{t('Audit Status', 'অবস্থা', lang)}</th>
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
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>{t('Claim Highway Toll Receipt', 'হাইওয়ে টোল স্লিপ দাখিল', lang)}</h3>
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
                📷 Receipt photo verified via in-cab telematics camera. Synced directly to Transport Admin & Finance HOD.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn-outline" onClick={() => setTollModalOpen(false)}>{t('Cancel', 'বাতিল', lang)}</button>
                <button type="submit" className="btn-primary" style={{ background: 'linear-gradient(135deg, #A51C30 0%, #700B1A 100%)' }}>
                  <Check size={14} /> {t('Submit for Reimbursement', 'দাখিল করুন', lang)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
