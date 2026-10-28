import React, { useState } from 'react';
import { BusVehicle, RouteInfo } from './busTypes';
import { t } from '../../types';
import {
  Bus, X, CheckCircle, Shield, Truck, Calendar, Phone,
  User, Check, Sparkles, Navigation, Fuel, KeyRound
} from 'lucide-react';

interface RegisterBusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister: (bus: BusVehicle) => void;
  routes: Record<string, RouteInfo>;
  lang: 'en' | 'bn';
}

export default function RegisterBusModal({
  isOpen,
  onClose,
  onRegister,
  routes,
  lang,
}: RegisterBusModalProps) {
  const [coachNo, setCoachNo] = useState('DHAKA METRO-BA 21-');
  const [model, setModel] = useState('Hino RM2 Luxury AC (52-Seater)');
  const [capacity, setCapacity] = useState<number>(52);
  const [assignedRouteId, setAssignedRouteId] = useState<string>(Object.keys(routes)[0] || 'route-1');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('+880 17');
  const [conductorName, setConductorName] = useState('');
  const [conductorPhone, setConductorPhone] = useState('+880 18');
  const [acType, setAcType] = useState<'Luxury AC' | 'Executive AC' | 'Standard AC'>('Luxury AC');
  const [fitnessExpiry, setFitnessExpiry] = useState('2028-12-31');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetRoute = routes[assignedRouteId];
    const newBus: BusVehicle = {
      id: `bus-${Date.now().toString().slice(-4)}`,
      coachNo: coachNo.trim(),
      model: model.trim(),
      capacity: Number(capacity) || 52,
      assignedRouteId,
      assignedRoadName: targetRoute ? (targetRoute.name.split(':')[1]?.trim() || targetRoute.name) : 'Custom Corridor',
      plateNo: coachNo.trim(),
      driverName: driverName.trim() || 'Assigned Master Driver',
      driverPhone: driverPhone.trim() || '+880 1711-000000',
      conductorName: conductorName.trim() || 'Assigned Duty Conductor',
      conductorPhone: conductorPhone.trim() || '+880 1811-000000',
      status: 'active',
      fuelLevel: '95%',
      fitnessExpiry,
      acType,
      gpsTrackerId: `GPS-BOGCL-${Math.floor(10 + Math.random() * 90)}`
    };

    onRegister(newBus);
    onClose();
  };

  const selectedRouteObj = routes[assignedRouteId];

  return (
    <div className="modal-bg" onClick={onClose} style={{ zIndex: 9999, backdropFilter: 'blur(6px)' }}>
      <div
        className="modal"
        style={{
          maxWidth: '680px',
          width: '92vw',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
          border: '1px solid rgba(255, 255, 255, 0.15)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #091024 0%, #172554 100%)',
          color: '#FFFFFF',
          padding: '18px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(212, 175, 55, 0.25)',
              border: '1px solid rgba(212, 175, 55, 0.5)',
              color: '#FDE68A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Bus size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '17px', fontWeight: 900, color: '#FFFFFF', margin: 0, letterSpacing: '-0.2px' }}>
                  {t('Enlist New Commuter Bus / Coach', 'নতুন কমিউটার বাস ও কোচ অন্তর্ভুক্তি', lang)}
                </h3>
                <span className="badge gold" style={{ fontSize: '10px', padding: '2px 8px' }}>
                  {t('Fleet Registration', 'বহর নিবন্ধন', lang)}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#94A3B8', margin: '4px 0 0 0' }}>
                {t(
                  'Register a dedicated corporate coach, allocate seat capacity, and assign fixed highway road corridors.',
                  'প্রতিষ্ঠানিক বাস নিবন্ধন, আসন সংখ্যা নির্ধারণ এবং নির্দিষ্ট মহাসড়ক করিডোরে নিয়োগ করুন।',
                  lang
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#E2E8F0',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{
            padding: '20px 24px',
            maxHeight: '74vh',
            overflowY: 'auto',
            background: 'var(--brand-card-bg, #FFFFFF)',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px'
          }}>
            {/* ─── SECTION 1: Vehicle Plate & Model Make ─── */}
            <div style={{
              background: 'var(--brand-slate-50, #F8FAFC)',
              border: '1px solid var(--brand-border, #E2E8F0)',
              borderRadius: '12px',
              padding: '16px'
            }}>
              <div style={{
                fontSize: '11.5px',
                fontWeight: 800,
                color: '#1E40AF',
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Truck size={14} />
                <span>{t('Vehicle Identification & Chassis Model', 'গাড়ির পরিচিতি ও বডি স্পেসিফিকেশন', lang)}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '6px', color: 'var(--brand-slate-800)' }}>
                    {t('Coach Registration No.', 'বাস রেজিস্ট্রেশন নম্বর', lang)} <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    className="form-input"
                    value={coachNo}
                    onChange={e => setCoachNo(e.target.value)}
                    placeholder="DHAKA METRO-BA 15-4421"
                    style={{ width: '100%', padding: '9px 12px', fontSize: '12.5px', borderRadius: '8px', fontWeight: 700 }}
                    required
                  />
                  <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-500)', marginTop: '4px' }}>
                    BRTA official commuter commercial registration plate
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '6px', color: 'var(--brand-slate-800)' }}>
                    {t('Bus Model & Make', 'বাসের মডেল ও বডি', lang)} <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <select
                    className="form-input"
                    value={model}
                    onChange={e => setModel(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', fontSize: '12.5px', borderRadius: '8px' }}
                  >
                    <option value="Hino RM2 Luxury AC (52-Seater)">Hino RM2 Luxury AC (52-Seater)</option>
                    <option value="Scania Touring HD (52-Seater)">Scania Touring HD (52-Seater)</option>
                    <option value="Hyundai Universe Express (52-Seater)">Hyundai Universe Express (52-Seater)</option>
                    <option value="Volvo B11R Intercity Cruiser (52-Seater)">Volvo B11R Intercity Cruiser (52-Seater)</option>
                    <option value="Ashok Leyland Falcon Intercity (52-Seater)">Ashok Leyland Falcon Intercity (52-Seater)</option>
                    <option value="Isuzu LT434 Heavy Duty Bus (52-Seater)">Isuzu LT434 Heavy Duty Bus (52-Seater)</option>
                    <option value="Mitsubishi Fuso Feeder Coach (40-Seater)">Mitsubishi Fuso Feeder Coach (40-Seater)</option>
                    <option value="Mercedes-Benz Tourismo VIP Shuttle (32-Seater)">Mercedes-Benz Tourismo VIP Shuttle (32-Seater)</option>
                  </select>
                </div>
              </div>

              {/* Seating Capacity Tier Cards */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '8px', color: 'var(--brand-slate-800)' }}>
                  {t('Seating Capacity & Fuselage Layout', 'আসন সংখ্যা ও লেআউট কাঠামো', lang)} <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {[
                    { cap: 52, title: '52 Seats', desc: 'Standard Commuter Cruiser', icon: '🚍' },
                    { cap: 40, title: '40 Seats', desc: 'Medium Feeder Coach', icon: '🚐' },
                    { cap: 32, title: '32 Seats', desc: 'VIP Executive Shuttle', icon: '✨' },
                  ].map(tier => {
                    const isSel = capacity === tier.cap;
                    return (
                      <button
                        key={tier.cap}
                        type="button"
                        onClick={() => setCapacity(tier.cap)}
                        style={{
                          background: isSel ? 'rgba(212, 175, 55, 0.12)' : '#FFFFFF',
                          border: isSel ? '2px solid #D4AF37' : '1px solid var(--brand-border)',
                          borderRadius: '10px',
                          padding: '10px 12px',
                          textAlign: 'left',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          boxShadow: isSel ? '0 2px 8px rgba(212, 175, 55, 0.2)' : 'none'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '16px' }}>{tier.icon}</span>
                          {isSel && <Check size={14} color="#B45309" />}
                        </div>
                        <div style={{ fontWeight: 800, fontSize: '13px', color: isSel ? '#B45309' : 'var(--brand-slate-900)', marginTop: '4px' }}>
                          {tier.title}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--brand-slate-500)', marginTop: '2px' }}>
                          {tier.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Climate Specification */}
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '6px', color: 'var(--brand-slate-800)' }}>
                  {t('AC / Climate Specification', 'শীতাতপ নিয়ন্ত্রণ ধরন', lang)}
                </label>
                <select
                  className="form-input"
                  value={acType}
                  onChange={e => setAcType(e.target.value as any)}
                  style={{ width: '100%', padding: '9px 12px', fontSize: '12.5px', borderRadius: '8px' }}
                >
                  <option value="Luxury AC">Luxury Carrier Air-Conditioned (Central Chiller)</option>
                  <option value="Executive AC">Executive Dual Compressor AC</option>
                  <option value="Standard AC">Standard Intercity AC</option>
                </select>
              </div>
            </div>

            {/* ─── SECTION 2: Road Corridor Assignment ─── */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(239, 246, 255, 0.6) 0%, rgba(219, 234, 254, 0.3) 100%)',
              border: '1.5px solid #93C5FD',
              borderRadius: '12px',
              padding: '16px'
            }}>
              <div style={{
                fontSize: '11.5px',
                fontWeight: 800,
                color: '#1E3A8A',
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Navigation size={14} />
                <span>{t('Assigned Highway Road Corridor / Route', 'রোড করিডোর বা রুট বরাদ্দ', lang)}</span>
              </div>

              <select
                className="form-input"
                value={assignedRouteId}
                onChange={e => setAssignedRouteId(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', fontSize: '12.5px', borderRadius: '8px', fontWeight: 700 }}
              >
                {Object.values(routes).map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>

              {selectedRouteObj && (
                <div style={{
                  background: '#FFFFFF',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  marginTop: '10px',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  fontSize: '11.5px',
                  color: '#1E3A8A'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span><strong>Path:</strong> {selectedRouteObj.corridorRoad}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', marginTop: '6px', fontSize: '11px', color: 'var(--brand-slate-600)' }}>
                    <span>🌅 Morning: <strong>{selectedRouteObj.inboundStartTime}</strong></span>
                    <span>🌆 Evening: <strong>{selectedRouteObj.outboundStartTime}</strong></span>
                    <span>📍 Stops: <strong>{selectedRouteObj.inboundStops.length} Stations</strong></span>
                  </div>
                </div>
              )}
            </div>

            {/* ─── SECTION 3: Driver & Conductor Master Crew ─── */}
            <div style={{
              background: 'var(--brand-slate-50, #F8FAFC)',
              border: '1px solid var(--brand-border, #E2E8F0)',
              borderRadius: '12px',
              padding: '16px'
            }}>
              <div style={{
                fontSize: '11.5px',
                fontWeight: 800,
                color: '#B45309',
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <User size={14} />
                <span>{t('Designated Duty Driver & Conductor', 'দায়িত্বপ্রাপ্ত চালক ও কন্ডাক্টর', lang)}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', marginBottom: '14px' }}>
                <div style={{ background: '#FFFFFF', padding: '12px', borderRadius: '8px', border: '1px solid var(--brand-border)' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--brand-slate-700)', marginBottom: '4px' }}>
                    {t('Master Heavy Driver Name', 'চালকের নাম', lang)} <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    className="form-input"
                    value={driverName}
                    onChange={e => setDriverName(e.target.value)}
                    placeholder="e.g. Master Rafiqul Islam"
                    style={{ width: '100%', padding: '7px 10px', fontSize: '12px', borderRadius: '6px', marginBottom: '8px' }}
                    required
                  />
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--brand-slate-700)', marginBottom: '4px' }}>
                    {t('Driver Mobile Contact', 'চালকের মোবাইল', lang)} <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    className="form-input"
                    value={driverPhone}
                    onChange={e => setDriverPhone(e.target.value)}
                    placeholder="+880 1712-334499"
                    style={{ width: '100%', padding: '7px 10px', fontSize: '12px', borderRadius: '6px' }}
                    required
                  />
                </div>

                <div style={{ background: '#FFFFFF', padding: '12px', borderRadius: '8px', border: '1px solid var(--brand-border)' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--brand-slate-700)', marginBottom: '4px' }}>
                    {t('Conductor Name', 'কন্ডাক্টরের নাম', lang)} <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    className="form-input"
                    value={conductorName}
                    onChange={e => setConductorName(e.target.value)}
                    placeholder="e.g. Jalal Uddin Mia"
                    style={{ width: '100%', padding: '7px 10px', fontSize: '12px', borderRadius: '6px', marginBottom: '8px' }}
                    required
                  />
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--brand-slate-700)', marginBottom: '4px' }}>
                    {t('Conductor Mobile Contact', 'কন্ডাক্টরের মোবাইল', lang)} <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    className="form-input"
                    value={conductorPhone}
                    onChange={e => setConductorPhone(e.target.value)}
                    placeholder="+880 1819-223344"
                    style={{ width: '100%', padding: '7px 10px', fontSize: '12px', borderRadius: '6px' }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '6px', color: 'var(--brand-slate-800)' }}>
                  <Calendar size={13} style={{ display: 'inline', marginRight: '5px' }} />
                  {t('BRTA Route Permit & Fitness Expiry', 'ফিটনেস ও রুট পারমিট মেয়াদ', lang)}
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={fitnessExpiry}
                  onChange={e => setFitnessExpiry(e.target.value)}
                  style={{ width: '220px', padding: '7px 10px', fontSize: '12px', borderRadius: '6px' }}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{
            padding: '16px 24px',
            background: 'var(--brand-slate-50, #F8FAFC)',
            borderTop: '1px solid var(--brand-border, #E2E8F0)',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: '12px'
          }}>
            <button
              type="button"
              className="btn-outline"
              onClick={onClose}
              style={{ padding: '8px 16px', fontSize: '12.5px', fontWeight: 600, borderRadius: '8px' }}
            >
              {t('Cancel', 'বাতিল', lang)}
            </button>
            <button
              type="submit"
              className="btn-gold"
              style={{
                padding: '8px 20px',
                fontSize: '12.5px',
                fontWeight: 800,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 8px rgba(212, 175, 55, 0.35)'
              }}
            >
              <CheckCircle size={16} />
              <span>{t('Enlist Bus to Commuter Fleet', 'বহরে বাস যুক্ত করুন', lang)}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
