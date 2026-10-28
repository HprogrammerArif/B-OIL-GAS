import React from 'react';
import { BusVehicle, RouteInfo, Seat } from './busTypes';
import { t } from '../../types';
import { Bus, MapPin, Users, Phone, Navigation, Shield, Plus, RefreshCw, Edit3, ArrowRight, CheckCircle2, UserCheck } from 'lucide-react';

interface BusFleetOverviewGridProps {
  buses: BusVehicle[];
  routes: Record<string, RouteInfo>;
  routeSeats: Record<string, Seat[]>;
  selectedRouteKey: string;
  onSelectRoute: (routeId: string) => void;
  onOpenAddBus: () => void;
  onOpenRouteBuilder: (route?: RouteInfo) => void;
  onOpenReassign: () => void;
  onOpenSupervisorSeat: (routeKey: string) => void;
  lang: 'en' | 'bn';
}

export default function BusFleetOverviewGrid({
  buses,
  routes,
  routeSeats,
  selectedRouteKey,
  onSelectRoute,
  onOpenAddBus,
  onOpenRouteBuilder,
  onOpenReassign,
  onOpenSupervisorSeat,
  lang,
}: BusFleetOverviewGridProps) {
  // Aggregate stats across all 10 buses
  const totalBuses = buses.length;
  const totalCapacity = buses.reduce((sum, b) => sum + b.capacity, 0);

  let totalOccupied = 0;
  Object.values(routeSeats).forEach(seats => {
    totalOccupied += seats.filter(s => s.status === 'occupied').length;
  });

  const overallFillRate = totalCapacity > 0 ? ((totalOccupied / totalCapacity) * 100).toFixed(1) : '0';

  return (
    <div style={{ marginBottom: '24px' }}>
      {/* Top Supervisor Command Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        background: 'linear-gradient(135deg, #091024 0%, #172554 100%)',
        color: '#FFFFFF',
        padding: '16px 20px',
        borderRadius: '12px',
        marginBottom: '16px',
        boxShadow: '0 4px 14px rgba(0,0,0,0.15)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>🚌</span>
            <h3 style={{ fontSize: '17px', fontWeight: 900, color: '#FFFFFF', margin: 0 }}>
              {t('10-Bus Commuter Fleet & Road Network Control', '১০-টি বাসের নিয়মিত বহর ও রোড নেটওয়ার্ক কন্ট্রোল', lang)}
            </h3>
            <span className="badge gold" style={{ fontSize: '10px' }}>
              {t('Fixed Daily Commute', 'স্থায়ী দৈনিক যাতায়াত', lang)}
            </span>
          </div>
          <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px', margin: 0 }}>
            {t(
              'Supervise daily dedicated office-to-plant commuter shuttles, manage road corridors, assign drivers, and control seat allocations.',
              'প্রতিদিনের অফিস-প্ল্যান্ট নিয়মিত বাস বহর পরিচালনা, রোড নির্ধারণ, চালক বণ্টন এবং সংরক্ষিত আসন ব্যবস্থাপনা।',
              lang
            )}
          </p>
        </div>

        {/* Supervisor Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            className="btn-gold"
            style={{ fontSize: '11.5px', padding: '6px 12px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={onOpenAddBus}
          >
            <Plus size={14} />
            {t('List New Bus', 'নতুন বাস অন্তর্ভুক্তি', lang)}
          </button>

          <button
            className="btn-primary"
            style={{ fontSize: '11.5px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => onOpenRouteBuilder()}
          >
            <Navigation size={14} />
            {t('Define Road & Timeline', 'রোড ও সময়সূচী প্রণয়ন', lang)}
          </button>

          <button
            className="btn-outline"
            style={{ fontSize: '11.5px', padding: '6px 12px', color: '#FFFFFF', borderColor: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={onOpenReassign}
          >
            <RefreshCw size={13} />
            {t('Reassign Bus', 'বাস পুনর্নির্ধারণ', lang)}
          </button>
        </div>
      </div>

      {/* Fleet Stats Ribbon */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px',
        marginBottom: '16px'
      }}>
        <div className="card" style={{ padding: '12px 16px', borderLeft: '4px solid #3B82F6' }}>
          <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)', textTransform: 'uppercase', fontWeight: 700 }}>
            {t('Total Fleet Size', 'মোট বাস বহর', lang)}
          </div>
          <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--brand-slate-900)', marginTop: '2px' }}>
            {totalBuses} {t('Buses', 'টি বাস', lang)}
          </div>
          <div style={{ fontSize: '11px', color: '#059669' }}>
            ✓ 100% On-Duty Fixed Fleet
          </div>
        </div>

        <div className="card" style={{ padding: '12px 16px', borderLeft: '4px solid #10B981' }}>
          <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)', textTransform: 'uppercase', fontWeight: 700 }}>
            {t('Daily Seating Capacity', 'মোট আসন ক্ষমতা', lang)}
          </div>
          <div style={{ fontSize: '20px', fontWeight: 900, color: '#059669', marginTop: '2px' }}>
            {totalCapacity} {t('Seats', 'টি আসন', lang)}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)' }}>
            Across 10 Highway Corridors
          </div>
        </div>

        <div className="card" style={{ padding: '12px 16px', borderLeft: '4px solid #D4AF37' }}>
          <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)', textTransform: 'uppercase', fontWeight: 700 }}>
            {t('Network Seat Occupancy', 'সামগ্রিক আসন দখল', lang)}
          </div>
          <div style={{ fontSize: '20px', fontWeight: 900, color: '#B45309', marginTop: '2px' }}>
            {totalOccupied} / {totalCapacity} ({overallFillRate}%)
          </div>
          <div style={{ fontSize: '11px', color: '#B45309' }}>
            {totalCapacity - totalOccupied} Vacant Standby Seats
          </div>
        </div>

        <div className="card" style={{ padding: '12px 16px', borderLeft: '4px solid #8B5CF6' }}>
          <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)', textTransform: 'uppercase', fontWeight: 700 }}>
            {t('Commute Network Reach', 'নেটওয়ার্ক বিস্তার', lang)}
          </div>
          <div style={{ fontSize: '20px', fontWeight: 900, color: '#6D28D9', marginTop: '2px' }}>
            10 {t('Routes', 'টি রুট', lang)}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)' }}>
            Mirpur, Uttara, Narayanganj, Savar, Gazipur +
          </div>
        </div>
      </div>

      {/* 10-Bus Grid Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
        gap: '14px'
      }}>
        {buses.map((bus, index) => {
          const route = routes[bus.assignedRouteId];
          const busSeats = routeSeats[bus.assignedRouteId] || [];
          const occupied = busSeats.filter(s => s.status === 'occupied').length;
          const vacated = busSeats.filter(s => s.status === 'vacated').length;
          const isSelected = route?.id === selectedRouteKey;
          const fillPercent = bus.capacity > 0 ? Math.round((occupied / bus.capacity) * 100) : 0;

          return (
            <div
              key={bus.id}
              className="card"
              style={{
                border: isSelected ? '2px solid #D4AF37' : '1px solid var(--brand-border)',
                background: isSelected ? 'var(--brand-gold-glow, rgba(212, 175, 55, 0.04))' : 'var(--brand-card-bg)',
                borderRadius: '10px',
                padding: '14px',
                position: 'relative',
                transition: 'all 0.2s ease',
                boxShadow: isSelected ? '0 4px 12px rgba(212, 175, 55, 0.2)' : 'none'
              }}
            >
              {/* Card Top: Coach Number and Status */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    background: isSelected ? '#D4AF37' : '#0F172A',
                    color: isSelected ? '#000000' : '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: '13px'
                  }}>
                    {index + 1}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '13.5px', color: 'var(--brand-slate-900)' }}>
                      {bus.coachNo}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)' }}>
                      {bus.model}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span className={`badge ${isSelected ? 'gold' : 'success'}`} style={{ fontSize: '10px' }}>
                    {isSelected ? '● ACTIVE INSPECTION' : 'ON DUTY'}
                  </span>
                  <div style={{ fontSize: '10px', color: '#059669', fontWeight: 700, marginTop: '2px' }}>
                    {bus.acType}
                  </div>
                </div>
              </div>

              {/* Road Corridor and Timeline */}
              <div style={{
                background: 'var(--brand-slate-50, #F8FAFC)',
                padding: '10px 12px',
                borderRadius: '8px',
                marginBottom: '10px',
                border: '1px solid var(--brand-border)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 800, color: '#1E3A8A' }}>
                  <Navigation size={13} color="#2563EB" />
                  <span>{route?.name.split(':')[0] || 'Unassigned Road'}</span>
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--brand-slate-700)', marginTop: '2px', fontWeight: 600 }}>
                  {route?.name.split(':')[1]?.trim() || 'Custom Road Corridor'}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: 'var(--brand-slate-500)', marginTop: '4px' }}>
                  <span>🌅 {t('Morning Inbound:', 'সকাল:', lang)} {route?.inboundStartTime || '06:45 AM'}</span>
                  <span>🌆 {t('Evening Outbound:', 'সন্ধ্যা:', lang)} {route?.outboundStartTime || '05:15 PM'}</span>
                </div>
              </div>

              {/* Driver & Conductor */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ color: 'var(--brand-slate-400)' }}>👤 {t('Driver:', 'চালক:', lang)}</span>
                  <strong style={{ color: 'var(--brand-slate-800)' }}>{bus.driverName.split(' ')[0]} {bus.driverName.split(' ')[1] || ''}</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ color: 'var(--brand-slate-400)' }}>🎫 {t('Cond.:', 'কন্ডাক্টর:', lang)}</span>
                  <strong style={{ color: 'var(--brand-slate-800)' }}>{bus.conductorName.split(' ')[0]} {bus.conductorName.split(' ')[1] || ''}</strong>
                </div>
              </div>

              {/* Occupancy Bar */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--brand-slate-500)' }}>{t('Seat Occupancy', 'আসন দখল', lang)}:</span>
                  <strong>
                    {occupied}/{bus.capacity} {t('seats', 'আসন', lang)} ({fillPercent}%)
                    {vacated > 0 && <span style={{ color: '#D97706', marginLeft: '4px' }}>· {vacated} Vacated</span>}
                  </strong>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'var(--brand-slate-200)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${fillPercent}%`,
                    height: '100%',
                    background: fillPercent > 90 ? '#059669' : fillPercent > 70 ? '#3B82F6' : '#D97706',
                    borderRadius: '3px'
                  }} />
                </div>
              </div>

              {/* Card Actions */}
              <div style={{ display: 'flex', gap: '6px', paddingTop: '6px', borderTop: '1px solid var(--brand-border)' }}>
                <button
                  className={isSelected ? 'btn-gold' : 'btn-outline'}
                  style={{ flex: 1, justifyContent: 'center', fontSize: '11px', padding: '6px' }}
                  onClick={() => onSelectRoute(bus.assignedRouteId)}
                >
                  <Bus size={12} />
                  {isSelected ? t('Viewing Seat Map', 'সিট ম্যাপ সক্রিয়', lang) : t('Inspect 52-Seat Map', 'সিট ম্যাপ দেখুন', lang)}
                </button>

                <button
                  className="btn-sm-ghost"
                  style={{ fontSize: '11px', padding: '6px 8px' }}
                  onClick={() => onOpenRouteBuilder(route)}
                  title="Edit Road Corridor & Timetable"
                >
                  <Edit3 size={12} />
                </button>

                <button
                  className="btn-sm-ghost"
                  style={{ fontSize: '11px', padding: '6px 8px' }}
                  onClick={() => onOpenSupervisorSeat(bus.assignedRouteId)}
                  title="Supervisor Seat Reservation Console"
                >
                  <UserCheck size={12} color="#D4AF37" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
