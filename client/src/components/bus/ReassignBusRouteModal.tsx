import React, { useState } from 'react';
import { BusVehicle, RouteInfo } from './busTypes';
import { t } from '../../types';
import {
  RefreshCw, X, CheckCircle, Bus, ArrowRight, Shield,
  Navigation, AlertCircle, Sparkles, Check
} from 'lucide-react';

interface ReassignBusRouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  buses: BusVehicle[];
  routes: Record<string, RouteInfo>;
  onReassign: (busId: string, targetRouteId: string) => void;
  lang: 'en' | 'bn';
}

export default function ReassignBusRouteModal({
  isOpen,
  onClose,
  buses,
  routes,
  onReassign,
  lang,
}: ReassignBusRouteModalProps) {
  const [selectedBusId, setSelectedBusId] = useState<string>(buses[0]?.id || 'bus-1');
  const [targetRouteId, setTargetRouteId] = useState<string>(Object.keys(routes)[0] || 'route-1');

  if (!isOpen) return null;

  const selectedBus = buses.find(b => b.id === selectedBusId) || buses[0];
  const currentRoute = routes[selectedBus?.assignedRouteId];
  const targetRoute = routes[targetRouteId];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onReassign(selectedBusId, targetRouteId);
    onClose();
  };

  return (
    <div className="modal-bg" onClick={onClose} style={{ zIndex: 9999, backdropFilter: 'blur(6px)' }}>
      <div
        className="modal"
        style={{
          maxWidth: '620px',
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
              <RefreshCw size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '17px', fontWeight: 900, color: '#FFFFFF', margin: 0, letterSpacing: '-0.2px' }}>
                  {t('Reassign Bus Coach to Road Corridor', 'রোড করিডোরে বাস পুনর্নির্ধারণ', lang)}
                </h3>
              </div>
              <p style={{ fontSize: '12px', color: '#94A3B8', margin: '4px 0 0 0' }}>
                {t('Dynamic Commuter Fleet Re-routing & Corridor Reallocation', 'যাত্রী চাহিদা অনুযায়ী বাস স্থানান্তর ও রুট পুনর্বণ্টন', lang)}
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
            {/* Bus Coach Selector */}
            <div style={{
              background: 'var(--brand-slate-50, #F8FAFC)',
              border: '1px solid var(--brand-border, #E2E8F0)',
              borderRadius: '12px',
              padding: '16px'
            }}>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 800, color: 'var(--brand-slate-800)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {t('Select Bus Coach to Reallocate', 'স্থানান্তরের জন্য বাস নির্বাচন করুন', lang)} <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <select
                className="form-input"
                value={selectedBusId}
                onChange={e => {
                  setSelectedBusId(e.target.value);
                  const b = buses.find(x => x.id === e.target.value);
                  if (b) {
                    setTargetRouteId(b.assignedRouteId);
                  }
                }}
                style={{ width: '100%', padding: '9px 12px', fontSize: '12.5px', borderRadius: '8px', fontWeight: 700 }}
              >
                {buses.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.coachNo} • {b.model} ({b.capacity} Seats) — Currently on {routes[b.assignedRouteId]?.name.split(':')[0] || 'Unassigned'}
                  </option>
                ))}
              </select>

              {selectedBus && (
                <div style={{ display: 'flex', gap: '16px', marginTop: '10px', fontSize: '11px', color: 'var(--brand-slate-600)' }}>
                  <span>Driver: <strong>{selectedBus.driverName}</strong></span>
                  <span>Fitness: <strong>{selectedBus.fitnessExpiry}</strong></span>
                  <span>AC: <strong>{selectedBus.acType}</strong></span>
                </div>
              )}
            </div>

            {/* Current vs New Route Flow Visualization */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto 1fr',
              gap: '14px',
              alignItems: 'center',
              background: 'linear-gradient(135deg, rgba(239, 246, 255, 0.6) 0%, rgba(219, 234, 254, 0.3) 100%)',
              border: '1.5px solid #93C5FD',
              borderRadius: '12px',
              padding: '16px'
            }}>
              <div style={{ background: '#FFFFFF', padding: '12px', borderRadius: '10px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--brand-slate-500)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {t('Current Road Corridor', 'বর্তমান রুট', lang)}
                </div>
                <div style={{ fontSize: '13px', fontWeight: 900, marginTop: '4px', color: '#1E3A8A' }}>
                  {currentRoute?.name.split(':')[0] || 'Unassigned'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--brand-slate-600)', marginTop: '2px', lineHeight: 1.3 }}>
                  {currentRoute?.name.split(':')[1]?.trim() || 'Custom Road Corridor'}
                </div>
                <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-500)', marginTop: '4px' }}>
                  🌅 {currentRoute?.inboundStartTime}
                </div>
              </div>

              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: '#D4AF37',
                color: '#000000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(212, 175, 55, 0.4)'
              }}>
                <ArrowRight size={18} />
              </div>

              <div style={{ background: '#FFFFFF', padding: '12px', borderRadius: '10px', border: '1.5px solid #10B981' }}>
                <div style={{ fontSize: '10px', fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {t('Target New Road Corridor', 'নতুন নির্ধারিত রুট', lang)}
                </div>
                <div style={{ fontSize: '13px', fontWeight: 900, marginTop: '4px', color: '#059669' }}>
                  {targetRoute?.name.split(':')[0]}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--brand-slate-600)', marginTop: '2px', lineHeight: 1.3 }}>
                  {targetRoute?.name.split(':')[1]?.trim() || 'New Destination'}
                </div>
                <div style={{ fontSize: '10.5px', color: '#059669', marginTop: '4px', fontWeight: 700 }}>
                  🌅 {targetRoute?.inboundStartTime}
                </div>
              </div>
            </div>

            {/* Target Corridor Dropdown */}
            <div style={{
              background: '#FFFFFF',
              border: '1px solid var(--brand-border, #E2E8F0)',
              borderRadius: '12px',
              padding: '16px'
            }}>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 800, color: 'var(--brand-slate-800)', marginBottom: '8px' }}>
                {t('Select Target Road Corridor from Master Network', 'মাস্টার নেটওয়ার্ক থেকে নতুন রোড নির্বাচন করুন', lang)} <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <select
                className="form-input"
                value={targetRouteId}
                onChange={e => setTargetRouteId(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', fontSize: '12.5px', borderRadius: '8px', fontWeight: 700 }}
              >
                {Object.values(routes).map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Dispatch Telemetry Warning Strip */}
            <div style={{
              fontSize: '11.5px',
              color: '#1E3A8A',
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1.5px solid #BFDBFE',
              padding: '12px 14px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px'
            }}>
              <AlertCircle size={17} color="#2563EB" style={{ flexShrink: 0, marginTop: '1px' }} />
              <div>
                <strong>{t('Operational Telemetry Notice:', 'প্রশাসনিক বিজ্ঞপ্তি:', lang)}</strong>{' '}
                {t(
                  'Reassigning this bus automatically updates the satellite GPS beacon feed, passenger SMS timetable notices, and digital gate check-in manifests for tomorrow\'s morning inbound shift.',
                  'বাস পুনর্নির্ধারণ করলে সংশ্লিষ্ট সকল যাত্রীর জিপিএস ট্র্যাকিং, এসএমএস সময়সূচী এবং ডিজিটাল গেট পাস স্বয়ংক্রিয়ভাবে আপডেট হবে।',
                  lang
                )}
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
              <span>{t('Confirm Road Reassignment', 'পুনর্নির্ধারণ নিশ্চিত করুন', lang)}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
