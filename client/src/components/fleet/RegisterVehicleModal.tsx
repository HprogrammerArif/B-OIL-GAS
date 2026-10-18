import React, { useState } from 'react';
import { Lang, t } from '../../types';
import { useFleetStore, Vehicle } from '../../store/fleetStore';
import { showToast } from '../../App';
import { X, Truck, Check, ShieldCheck, MapPin, Gauge } from 'lucide-react';

interface RegisterVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Lang;
}

export default function RegisterVehicleModal({ isOpen, onClose, lang }: RegisterVehicleModalProps) {
  const { addVehicle } = useFleetStore();

  const [plate, setPlate] = useState('DHAKA METRO KHA-');
  const [model, setModel] = useState('');
  const [type, setType] = useState<Vehicle['type']>('tanker');
  const [capacitySeats, setCapacitySeats] = useState(2);
  const [location, setLocation] = useState('Keraniganj Refinery Complex Terminal');
  const [hazmatCertified, setHazmatCertified] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plate.trim() || plate.trim() === 'DHAKA METRO KHA-') {
      showToast(t('Please enter official BRTA commercial plate number.', 'অনুগ্রহ করে বিআরটিএ রেজিস্ট্রেশন নম্বর দিন।', lang), 'info');
      return;
    }
    if (!model.trim()) {
      showToast(t('Please enter vehicle model / specification.', 'অনুগ্রহ করে গাড়ির মডেল লিখুন।', lang), 'info');
      return;
    }

    const created = addVehicle({
      plate,
      model,
      type,
      capacitySeats,
      location,
      hazmatCertified,
    });

    showToast(t(
      `✓ New vehicle ${created.plate} (${created.model}) registered! Ready for dispatch roster.`,
      `✓ নতুন যানবাহন ${created.plate} বহরে যুক্ত হয়েছে!`,
      lang
    ), 'success');

    onClose();
  };

  return (
    <div className="modal-bg" style={{ zIndex: 1000 }}>
      <div className="modal" style={{ maxWidth: '600px' }}>
        <div className="modal-hd" style={{ background: 'linear-gradient(135deg, #0A1227 0%, #111E3D 100%)', borderBottom: '2px solid var(--brand-gold)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'rgba(212,175,55,0.2)', color: 'var(--brand-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Truck size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', color: '#F8FAFC' }}>
                {t('Register New Fleet Commercial Vehicle', 'বহরে নতুন যানবাহন রেজিস্ট্রেশন', lang)}
              </h3>
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>BRTA Fitness Verification · HAZMAT Permit · Telematics Bound</div>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
            <div className="form-group">
              <label>{t('BRTA Commercial Plate Number *', 'বিআরটিএ রেজিস্ট্রেশন প্লেট নম্বর *', lang)}</label>
              <input
                type="text"
                required
                style={{ fontFamily: 'monospace', fontWeight: 800, letterSpacing: '0.5px' }}
                placeholder="e.g. DHAKA METRO KHA-11-9042"
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div className="form-group">
                <label>{t('Vehicle Model & Make *', 'মডেল ও ব্র্যান্ড *', lang)}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hino 500 Heavy Bitumen Tanker (9,000L)"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>{t('Vehicle Category *', 'যানবাহনের ধরন *', lang)}</label>
                <select value={type} onChange={(e) => setType(e.target.value as Vehicle['type'])}>
                  <option value="tanker">Heavy Insulated Tanker (Bitumen/Fuel)</option>
                  <option value="microbus">Microbus Pool (Staff Shuttle)</option>
                  <option value="executive">Executive Sedan (Toyota Camry/Premio)</option>
                  <option value="pickup">4x4 Heavy Duty Double Cabin Pickup</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div className="form-group">
                <label>{t('Seating / Crew Capacity', 'আসন ক্ষমতা', lang)}</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={capacitySeats}
                  onChange={(e) => setCapacitySeats(parseInt(e.target.value) || 2)}
                />
              </div>

              <div className="form-group">
                <label>{t('Stationed Terminal Base *', 'নির্ধারিত স্টেশন / টার্মিনাল *', lang)}</label>
                <select value={location} onChange={(e) => setLocation(e.target.value)}>
                  <option value="Keraniganj Bitumen Refinery Gantry">Keraniganj Bitumen Refinery Gantry</option>
                  <option value="Bashundhara Corporate HQ Baridhara Pool">Bashundhara Corporate HQ Baridhara Pool</option>
                  <option value="Chattogram Coastal Port Terminal">Chattogram Coastal Port Terminal</option>
                </select>
              </div>
            </div>

            <div style={{ padding: '10px 14px', background: 'var(--brand-slate-100)', borderRadius: '6px', border: '1px solid var(--brand-slate-200)', marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand-slate-900)' }}>
                  HAZMAT Petroleum & Bitumen Certificate
                </div>
                <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-500)' }}>
                  Certified by Department of Explosives for high-temperature asphalt transit
                </div>
              </div>
              <input
                type="checkbox"
                checked={hazmatCertified}
                onChange={(e) => setHazmatCertified(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
            </div>

            <div style={{ background: 'var(--brand-slate-100)', border: '1px solid var(--brand-slate-200)', padding: '10px', borderRadius: 'var(--radius-sm)', fontSize: '11px', color: 'var(--brand-slate-500)' }}>
              🔒 <strong>Automatic Telematics Pairing:</strong> Once added, this vehicle is instantly bound to the GPS Telematics Radar, assigned initial fuel quota, and unlocked for employee duty requisition pooling.
            </div>
          </div>

          <div className="modal-ft">
            <button type="button" className="btn-sm-ghost" onClick={onClose}>
              {t('Cancel', 'বাতিল', lang)}
            </button>
            <button type="submit" className="btn-primary" style={{ fontWeight: 800 }}>
              <Check size={14} />
              {t('Enroll Vehicle into Active Pool', 'যানবাহন যুক্ত করুন', lang)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
