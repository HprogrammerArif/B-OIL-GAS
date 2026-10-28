import React, { useState } from 'react';
import { BusVehicle, RouteInfo } from './busTypes';
import { t } from '../../types';
import { Bus, X, CheckCircle, Shield, Truck, Calendar, Phone, User } from 'lucide-react';

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
    const newBus: BusVehicle = {
      id: `bus-${Date.now().toString().slice(-4)}`,
      coachNo: coachNo.trim(),
      model: model.trim(),
      capacity: Number(capacity) || 52,
      assignedRouteId,
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

  return (
    <div className="modal-bg" onClick={onClose} style={{ zIndex: 9999 }}>
      <div className="modal" style={{ maxWidth: '640px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-hd" style={{ background: '#0F172A', color: '#FFFFFF' }}>
          <div className="modal-hd-left">
            <div className="modal-hd-icon" style={{ background: 'rgba(212, 175, 55, 0.2)', color: '#FCD34D' }}>
              <Bus size={18} />
            </div>
            <div>
              <h3 className="modal-title" style={{ color: '#FFFFFF' }}>
                {t('Enlist New Commuter Bus / Coach', 'নতুন কমিউটার বাস ও কোচ অন্তর্ভুক্তি', lang)}
              </h3>
              <div className="modal-subtitle" style={{ color: '#94A3B8' }}>
                {t('BOGCL Transport Cell • Dedicated Daily Staff Transit Fleet', 'বসুন্ধরা পরিবহন সেল • নিয়মিত কর্মী যাতায়াত বহর', lang)}
              </div>
            </div>
          </div>
          <button className="modal-close" style={{ color: '#FFFFFF' }} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
            <div className="responsive-col-2-eq" style={{ gap: '14px', marginBottom: '14px' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 700 }}>
                  {t('Coach Registration No.', 'বাস রেজিস্ট্রেশন নম্বর', lang)} *
                </label>
                <input
                  className="form-input"
                  value={coachNo}
                  onChange={e => setCoachNo(e.target.value)}
                  placeholder="DHAKA METRO-BA 15-4421"
                  required
                />
              </div>
              <div>
                <label className="form-label" style={{ fontWeight: 700 }}>
                  {t('Bus Model & Make', 'বাসের মডেল ও বডি', lang)} *
                </label>
                <select className="form-input" value={model} onChange={e => setModel(e.target.value)}>
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

            <div className="responsive-col-2-eq" style={{ gap: '14px', marginBottom: '14px' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 700 }}>
                  {t('Seating Capacity', 'আসন সংখ্যা', lang)} *
                </label>
                <select className="form-input" value={capacity} onChange={e => setCapacity(Number(e.target.value))}>
                  <option value={52}>52 Seats (Standard Heavy Bus)</option>
                  <option value={40}>40 Seats (Medium Feeder Coach)</option>
                  <option value={32}>32 Seats (VIP Executive Shuttle)</option>
                </select>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 700 }}>
                  {t('AC / Climate Specification', 'শীতাতপ নিয়ন্ত্রণ ধরন', lang)}
                </label>
                <select className="form-input" value={acType} onChange={e => setAcType(e.target.value as any)}>
                  <option value="Luxury AC">Luxury Carrier Air-Conditioned</option>
                  <option value="Executive AC">Executive Dual Compressor AC</option>
                  <option value="Standard AC">Standard Intercity AC</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label className="form-label" style={{ fontWeight: 700 }}>
                {t('Assign to Road Corridor / Route', 'রোড করিডোর বা রুট নির্ধারণ', lang)} *
              </label>
              <select className="form-input" value={assignedRouteId} onChange={e => setAssignedRouteId(e.target.value)}>
                {Object.values(routes).map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
              <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)', marginTop: '4px' }}>
                ℹ️ {t('This bus will operate fixed morning and evening commuter schedules on this designated road.', 'এই বাসটি নির্দিষ্ট রুটে সকাল ও সন্ধ্যার নির্ধারিত সময়ে চলবে।', lang)}
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--brand-border)', paddingTop: '12px', marginTop: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#D4AF37', marginBottom: '10px', textTransform: 'uppercase' }}>
                👤 {t('Designated Duty Driver & Conductor', 'দায়িত্বপ্রাপ্ত চালক ও কন্ডাক্টর', lang)}
              </div>

              <div className="responsive-col-2-eq" style={{ gap: '14px', marginBottom: '12px' }}>
                <div>
                  <label className="form-label">{t('Master Driver Name', 'চালকের নাম', lang)} *</label>
                  <input
                    className="form-input"
                    value={driverName}
                    onChange={e => setDriverName(e.target.value)}
                    placeholder="e.g. Master Rafiqul Islam"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">{t('Driver Mobile Contact', 'চালকের মোবাইল', lang)} *</label>
                  <input
                    className="form-input"
                    value={driverPhone}
                    onChange={e => setDriverPhone(e.target.value)}
                    placeholder="+880 1712-334499"
                    required
                  />
                </div>
              </div>

              <div className="responsive-col-2-eq" style={{ gap: '14px', marginBottom: '12px' }}>
                <div>
                  <label className="form-label">{t('Conductor Name', 'কন্ডাক্টরের নাম', lang)} *</label>
                  <input
                    className="form-input"
                    value={conductorName}
                    onChange={e => setConductorName(e.target.value)}
                    placeholder="e.g. Jalal Uddin Mia"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">{t('Conductor Mobile Contact', 'কন্ডাক্টরের মোবাইল', lang)} *</label>
                  <input
                    className="form-input"
                    value={conductorPhone}
                    onChange={e => setConductorPhone(e.target.value)}
                    placeholder="+880 1819-223344"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="form-label">{t('BRTA Route Permit & Fitness Expiry', 'ফিটনেস ও রুট পারমিট মেয়াদ', lang)}</label>
                <input
                  type="date"
                  className="form-input"
                  value={fitnessExpiry}
                  onChange={e => setFitnessExpiry(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="modal-ft">
            <button type="button" className="btn-sm-ghost" onClick={onClose}>
              {t('Cancel', 'বাতিল', lang)}
            </button>
            <button type="submit" className="btn-gold" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle size={15} />
              {t('Enlist Bus to Commuter Fleet', 'বহরে বাস যুক্ত করুন', lang)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
