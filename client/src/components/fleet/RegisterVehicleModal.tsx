import React, { useState } from 'react';
import { Truck, Check, X, ShieldCheck } from 'lucide-react';
import { Vehicle, useFleetStore } from '../../store/fleetStore';
import { t } from '../../types';
import { showToast } from '../../App';

interface RegisterVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister?: (vehicle: Omit<Vehicle, 'id' | 'maintenanceHistory'>) => void;
  lang: 'en' | 'bn';
}

export default function RegisterVehicleModal({
  isOpen,
  onClose,
  onRegister,
  lang,
}: RegisterVehicleModalProps) {
  const { addVehicle } = useFleetStore();
  const [plate, setPlate] = useState('');
  const [model, setModel] = useState('');
  const [type, setType] = useState<Vehicle['type']>('tanker');
  const [capacitySeats, setCapacitySeats] = useState(2);
  const [location, setLocation] = useState('Keraniganj Bitumen Refinery Gantry');
  const [hazmatCertified, setHazmatCertified] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plate.trim() || !model.trim()) {
      showToast(t('Please fill in required fields', 'প্রয়োজনীয় তথ্য পূরণ করুন', lang), 'warn');
      return;
    }

    const payload = {
      plate: plate.trim().toUpperCase(),
      model: model.trim(),
      type,
      capacitySeats,
      fuelPct: 100,
      status: 'available' as const,
      location,
      driverName: 'Awaiting Assignment',
      driverPhone: 'N/A',
      odometerKm: 12000,
      hazmatCertified,
    };

    if (onRegister) {
      onRegister(payload);
    } else {
      addVehicle(payload);
    }

    showToast(t(
      `✓ Vehicle ${plate.toUpperCase()} registered and assigned to ${location}!`,
      `✓ যানবাহন ${plate.toUpperCase()} সফলভাবে নিবন্ধিত হয়েছে!`,
      lang
    ), 'success');

    onClose();
  };

  return (
    <div
      className="modal-bg"
      onClick={onClose}
      style={{
        zIndex: 99999,
        padding: '20px',
        boxSizing: 'border-box',
      }}
    >
      <div
        className="fleet-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '680px',
          width: '95%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#FFFFFF',
          borderRadius: '18px',
          overflow: 'hidden',
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.4), 0 0 0 1px rgba(15, 23, 42, 0.1)',
          boxSizing: 'border-box',
        }}
      >
        {/* Header */}
        <div
          className="fleet-modal-hd"
          style={{
            padding: '18px 28px',
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 55%, #871424 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(217, 119, 6, 0.35)',
                flexShrink: 0,
              }}
            >
              <Truck size={20} color="#FFFFFF" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#FFFFFF' }}>
                {t('Register New Fleet Commercial Vehicle', 'বহরে নতুন যানবাহন রেজিস্ট্রেশন', lang)}
              </h3>
              <div style={{ fontSize: '12px', color: '#CBD5E1', marginTop: '2px' }}>
                BRTA Fitness Verification · HAZMAT Permit · Telematics Bound
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: '#CBD5E1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: '1 1 auto', overflowY: 'auto' }}>
          <div
            className="fleet-modal-body"
            style={{
              flex: '1 1 auto',
              overflowY: 'auto',
              padding: '26px 32px',
              backgroundColor: '#FFFFFF',
              boxSizing: 'border-box',
            }}
          >
            <div className="notice-field-group" style={{ marginBottom: '18px' }}>
              <div className="notice-field-label">
                <span>{t('BRTA Commercial Plate Number *', 'বিআরটিএ রেজিস্ট্রেশন প্লেট নম্বর *', lang)}</span>
              </div>
              <input
                type="text"
                required
                className="notice-input"
                style={{
                  width: '100%',
                  padding: '11px 16px',
                  borderRadius: '10px',
                  border: '1.5px solid #CBD5E1',
                  fontSize: '13.5px',
                  fontFamily: 'monospace',
                  fontWeight: 800,
                  letterSpacing: '0.5px',
                  boxSizing: 'border-box',
                }}
                placeholder="e.g. DHAKA METRO KHA-11-9042"
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
              />
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                marginBottom: '18px',
                boxSizing: 'border-box',
              }}
            >
              <div>
                <div className="notice-field-label">
                  <span>{t('Vehicle Model & Make *', 'মডেল ও ব্র্যান্ড *', lang)}</span>
                </div>
                <input
                  type="text"
                  required
                  className="notice-input"
                  style={{
                    width: '100%',
                    padding: '11px 16px',
                    borderRadius: '10px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                  placeholder="e.g. Hino 500 Heavy Bitumen Tanker"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                />
              </div>

              <div>
                <div className="notice-field-label">
                  <span>{t('Vehicle Category *', 'যানবাহনের ধরন *', lang)}</span>
                </div>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as Vehicle['type'])}
                  className="notice-select"
                  style={{
                    width: '100%',
                    padding: '11px 16px',
                    borderRadius: '10px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="tanker">Heavy Insulated Tanker (Bitumen/Fuel)</option>
                  <option value="microbus">Microbus Pool (Staff Shuttle)</option>
                  <option value="executive">Executive Sedan (Toyota Camry/Premio)</option>
                  <option value="pickup">4x4 Heavy Duty Double Cabin Pickup</option>
                </select>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                marginBottom: '18px',
                boxSizing: 'border-box',
              }}
            >
              <div>
                <div className="notice-field-label">
                  <span>{t('Seating / Crew Capacity', 'আসন ক্ষমতা', lang)}</span>
                </div>
                <input
                  type="number"
                  min={1}
                  max={50}
                  className="notice-input"
                  style={{
                    width: '100%',
                    padding: '11px 16px',
                    borderRadius: '10px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                  value={capacitySeats}
                  onChange={(e) => setCapacitySeats(parseInt(e.target.value) || 2)}
                />
              </div>

              <div>
                <div className="notice-field-label">
                  <span>{t('Stationed Terminal Base *', 'নির্ধারিত স্টেশন / টার্মিনাল *', lang)}</span>
                </div>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="notice-select"
                  style={{
                    width: '100%',
                    padding: '11px 16px',
                    borderRadius: '10px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="Keraniganj Bitumen Refinery Gantry">Keraniganj Bitumen Refinery Gantry</option>
                  <option value="Bashundhara Corporate HQ Baridhara Pool">Bashundhara Corporate HQ Baridhara Pool</option>
                  <option value="Chattogram Coastal Port Terminal">Chattogram Coastal Port Terminal</option>
                </select>
              </div>
            </div>

            {/* HAZMAT Certificate Check Card */}
            <div
              style={{
                padding: '14px 18px',
                background: '#F8FAFC',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxSizing: 'border-box',
              }}
            >
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                  HAZMAT Petroleum & Bitumen Certificate
                </div>
                <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
                  Certified by Department of Explosives for high-temperature asphalt transit
                </div>
              </div>
              <input
                type="checkbox"
                checked={hazmatCertified}
                onChange={(e) => setHazmatCertified(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#D97706' }}
              />
            </div>

            {/* Notice Alert */}
            <div
              style={{
                background: '#EFF6FF',
                border: '1px solid #BFDBFE',
                padding: '12px 16px',
                borderRadius: '10px',
                fontSize: '12px',
                color: '#1E40AF',
                lineHeight: 1.5,
              }}
            >
              🔒 <strong>Automatic Telematics Pairing:</strong> Once added, this vehicle is instantly bound to the GPS Telematics Radar, assigned initial fuel quota, and unlocked for employee duty requisition pooling.
            </div>
          </div>

          {/* Footer */}
          <div
            className="fleet-modal-ft"
            style={{
              padding: '16px 28px',
              backgroundColor: '#F8FAFC',
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              boxSizing: 'border-box',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 18px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#475569',
                backgroundColor: '#FFFFFF',
                border: '1.5px solid #CBD5E1',
                cursor: 'pointer',
              }}
            >
              {t('Cancel', 'বাতিল', lang)}
            </button>
            <button
              type="submit"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 22px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 700,
                color: '#FFFFFF',
                background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(217, 119, 6, 0.35)',
              }}
            >
              <Check size={15} />
              {t('Enroll Vehicle into Active Pool', 'যানবাহন যুক্ত করুন', lang)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
