import React, { useState } from 'react';
import { BusVehicle, RouteInfo } from './busTypes';
import { t } from '../../types';
import { RefreshCw, X, CheckCircle, Bus, ArrowRight, Shield } from 'lucide-react';

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
    <div className="modal-bg" onClick={onClose} style={{ zIndex: 9999 }}>
      <div className="modal" style={{ maxWidth: '580px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-hd" style={{ background: '#0F172A', color: '#FFFFFF' }}>
          <div className="modal-hd-left">
            <div className="modal-hd-icon" style={{ background: 'rgba(212, 175, 55, 0.25)', color: '#FCD34D' }}>
              <RefreshCw size={18} />
            </div>
            <div>
              <h3 className="modal-title" style={{ color: '#FFFFFF' }}>
                {t('Reassign Bus Coach to Road Corridor', 'রোড করিডোরে বাস পুনর্নির্ধারণ', lang)}
              </h3>
              <div className="modal-subtitle" style={{ color: '#94A3B8' }}>
                {t('Dynamic Daily Commuter Fleet Allocation & Transit Re-routing', 'দৈনিক যাত্রী চাহিদা ও বাস পুনর্বণ্টন', lang)}
              </div>
            </div>
          </div>
          <button className="modal-close" style={{ color: '#FFFFFF' }} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ marginBottom: '16px' }}>
              <label className="form-label" style={{ fontWeight: 700 }}>
                {t('Select Bus Vehicle from 10-Bus Commuter Fleet', 'বহরের বাস নির্বাচন করুন', lang)} *
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
              >
                {buses.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.coachNo} ({b.model}) — Currently on Route {b.assignedRouteId.replace('route-', '')}
                  </option>
                ))}
              </select>
            </div>

            {/* Current vs New Route Display */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto 1fr',
              gap: '12px',
              alignItems: 'center',
              background: 'var(--brand-slate-50, #F8FAFC)',
              border: '1px solid var(--brand-border)',
              borderRadius: '10px',
              padding: '14px',
              marginBottom: '18px'
            }}>
              <div>
                <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--brand-slate-500)', textTransform: 'uppercase' }}>
                  {t('Current Road Corridor', 'বর্তমান রুট', lang)}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 800, marginTop: '4px', color: 'var(--brand-slate-800)' }}>
                  {currentRoute?.name.split(':')[0] || 'Unassigned'}
                </div>
                <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-500)', marginTop: '2px' }}>
                  {currentRoute?.coachNo}
                </div>
              </div>

              <div style={{ color: '#D4AF37' }}>
                <ArrowRight size={20} />
              </div>

              <div>
                <div style={{ fontSize: '10px', fontWeight: 800, color: '#059669', textTransform: 'uppercase' }}>
                  {t('New Road Assignment', 'নতুন নির্ধারিত রুট', lang)}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 800, marginTop: '4px', color: '#059669' }}>
                  {targetRoute?.name.split(':')[0]}
                </div>
                <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-500)', marginTop: '2px' }}>
                  {targetRoute?.capacity} Seats
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label className="form-label" style={{ fontWeight: 700 }}>
                {t('Assign to Road Corridor / Route', 'নতুন রোড করিডোর নির্ধারণ', lang)} *
              </label>
              <select className="form-input" value={targetRouteId} onChange={e => setTargetRouteId(e.target.value)}>
                {Object.values(routes).map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ fontSize: '12px', color: 'var(--brand-slate-600)', background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '10px 14px', borderRadius: '8px' }}>
              ℹ️ <strong>{t('Operational Notice:', 'প্রশাসনিক বিজ্ঞপ্তি:', lang)}</strong>{' '}
              {t(
                'Reassigning this bus will update the live passenger GPS broadcast, digital boarding passes, and conductor gate rosters for tomorrow\'s morning inbound schedule.',
                'বাস পুনর্নির্ধারণ করলে সংশ্লিষ্ট সকল যাত্রীর জিপিএস ট্র্যাকিং ও ডিজিটাল পাস স্বয়ংক্রিয়ভাবে আপডেট হবে।',
                lang
              )}
            </div>
          </div>

          <div className="modal-ft">
            <button type="button" className="btn-sm-ghost" onClick={onClose}>
              {t('Cancel', 'বাতিল', lang)}
            </button>
            <button type="submit" className="btn-gold" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle size={15} />
              {t('Confirm Road Reassignment', 'পুনর্নির্ধারণ নিশ্চিত করুন', lang)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
