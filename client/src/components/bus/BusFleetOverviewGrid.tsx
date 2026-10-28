import React from 'react';
import { BusVehicle, RouteInfo, Seat } from './busTypes';
import { t } from '../../types';
import {
  Bus, MapPin, Users, Phone, Navigation, Shield, Plus,
  RefreshCw, Edit3, ArrowRight, CheckCircle2, UserCheck, Clock, Award
} from 'lucide-react';

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
  let totalVacated = 0;
  Object.values(routeSeats).forEach(seats => {
    totalOccupied += seats.filter(s => s.status === 'occupied').length;
    totalVacated += seats.filter(s => s.status === 'vacated').length;
  });

  const overallFillRate = totalCapacity > 0 ? ((totalOccupied / totalCapacity) * 100).toFixed(1) : '0';
  const totalFreeStandby = totalCapacity - totalOccupied;

  return (
    <div style={{ marginBottom: '28px' }}>
      {/* ─── Top Supervisor Command Header ─── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        background: 'linear-gradient(135deg, #091024 0%, #172554 100%)',
        color: '#FFFFFF',
        padding: '20px 24px',
        borderRadius: '16px',
        marginBottom: '20px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
        border: '1px solid rgba(255, 255, 255, 0.12)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(212, 175, 55, 0.2)',
              border: '1px solid #D4AF37',
              color: '#FDE68A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px'
            }}>
              🚌
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#FFFFFF', margin: 0, letterSpacing: '-0.2px' }}>
                  {t('10-Bus Commuter Fleet & Road Corridor Command Matrix', '১০-টি বাসের নিয়মিত বহর ও রোড নেটওয়ার্ক কমান্ড ম্যাট্রিক্স', lang)}
                </h3>
                <span className="badge gold" style={{ fontSize: '10px', padding: '2px 8px' }}>
                  {t('100% Fixed Route Network', 'স্থায়ী দৈনিক রুট বহর', lang)}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#94A3B8', margin: '4px 0 0 0' }}>
                {t(
                  'Full transport supervisor oversight: assign road corridors, designate licensed drivers, monitor seat occupancy, and reserve employee seating.',
                  'পরিবহন তত্ত্বাবধায়ক নিয়ন্ত্রণ: বাস রুট বরাদ্দ, চালক বণ্টন, আসন সংখ্যা নিরীক্ষণ এবং কর্মীদের আসন সংরক্ষণ।',
                  lang
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Supervisor Action Toolbar */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            onClick={onOpenAddBus}
            style={{
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: '#FFFFFF',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)',
              transition: 'all 0.15s ease'
            }}
          >
            <Plus size={15} />
            <span>{t('List New Bus', 'নতুন বাস অন্তর্ভুক্তি', lang)}</span>
          </button>

          <button
            onClick={() => onOpenRouteBuilder()}
            style={{
              background: 'rgba(212, 175, 55, 0.18)',
              border: '1.5px solid #D4AF37',
              color: '#FDE68A',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            <Navigation size={15} />
            <span>{t('Define Road & Timeline', 'রোড ও সময়সূচী প্রণয়ন', lang)}</span>
          </button>

          <button
            onClick={onOpenReassign}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              color: '#F1F5F9',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            <RefreshCw size={14} />
            <span>{t('Reassign Bus', 'বাস পরিবর্তন', lang)}</span>
          </button>
        </div>
      </div>

      {/* ─── Fleet Telemetry Stats Ribbon ─── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '14px',
        marginBottom: '20px'
      }}>
        <div className="card" style={{
          padding: '16px 20px',
          borderRadius: '12px',
          borderLeft: '5px solid #3B82F6',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          background: 'var(--brand-card-bg, #FFFFFF)'
        }}>
          <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.5px' }}>
            {t('Total Commuter Fleet', 'মোট বাস বহর', lang)}
          </div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--brand-slate-900)', marginTop: '4px' }}>
            {totalBuses} <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--brand-slate-500)' }}>{t('Buses', 'টি বাস', lang)}</span>
          </div>
          <div style={{ fontSize: '11px', color: '#059669', fontWeight: 700, marginTop: '4px' }}>
            ✓ 100% Operational Readiness
          </div>
        </div>

        <div className="card" style={{
          padding: '16px 20px',
          borderRadius: '12px',
          borderLeft: '5px solid #10B981',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          background: 'var(--brand-card-bg, #FFFFFF)'
        }}>
          <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.5px' }}>
            {t('Daily Seating Capacity', 'মোট আসন ক্ষমতা', lang)}
          </div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#059669', marginTop: '4px' }}>
            {totalCapacity} <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--brand-slate-500)' }}>{t('Seats', 'টি আসন', lang)}</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)', fontWeight: 600, marginTop: '4px' }}>
            Across 10 Dhaka Highway Corridors
          </div>
        </div>

        <div className="card" style={{
          padding: '16px 20px',
          borderRadius: '12px',
          borderLeft: '5px solid #D4AF37',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          background: 'var(--brand-card-bg, #FFFFFF)'
        }}>
          <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.5px' }}>
            {t('Network Occupancy Rate', 'সামগ্রিক আসন দখল', lang)}
          </div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#B45309', marginTop: '4px' }}>
            {overallFillRate}% <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--brand-slate-500)' }}>({totalOccupied}/{totalCapacity})</span>
          </div>
          <div style={{ fontSize: '11px', color: '#D97706', fontWeight: 700, marginTop: '4px' }}>
            {totalFreeStandby} Vacant / Standby Seats
          </div>
        </div>

        <div className="card" style={{
          padding: '16px 20px',
          borderRadius: '12px',
          borderLeft: '5px solid #8B5CF6',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          background: 'var(--brand-card-bg, #FFFFFF)'
        }}>
          <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.5px' }}>
            {t('Coverage Zone Network', 'নেটওয়ার্ক বিস্তার', lang)}
          </div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#6D28D9', marginTop: '4px' }}>
            10 {t('Corridors', 'টি রুট', lang)}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)', fontWeight: 600, marginTop: '4px' }}>
            Mirpur, Uttara, Narayanganj, Savar +
          </div>
        </div>
      </div>

      {/* ─── 10-Bus Fleet Cards Grid ─── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(370px, 1fr))',
        gap: '18px'
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
                border: isSelected ? '2px solid #D4AF37' : '1px solid var(--brand-border, #E2E8F0)',
                background: isSelected ? 'linear-gradient(180deg, rgba(212, 175, 55, 0.05) 0%, #FFFFFF 100%)' : 'var(--brand-card-bg, #FFFFFF)',
                borderRadius: '14px',
                padding: '18px 20px',
                position: 'relative',
                transition: 'all 0.2s ease',
                boxShadow: isSelected ? '0 8px 24px rgba(212, 175, 55, 0.22)' : '0 2px 8px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '14px'
              }}
            >
              {/* Card Top: Coach Number, Make, and Live Duty Tag */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background: isSelected ? 'linear-gradient(135deg, #D4AF37 0%, #B45309 100%)' : 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                      color: isSelected ? '#000000' : '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                      fontSize: '14px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                    }}>
                      #{index + 1}
                    </div>
                    <div>
                      <div style={{ fontWeight: 900, fontSize: '14.5px', color: 'var(--brand-slate-900)' }}>
                        {bus.coachNo}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)', marginTop: '2px' }}>
                        {bus.model}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span className={`badge ${isSelected ? 'gold' : 'success'}`} style={{ fontSize: '9.5px', padding: '2px 8px', fontWeight: 800 }}>
                      {isSelected ? '● ACTIVE INSPECTION' : 'ON DUTY'}
                    </span>
                    <div style={{ fontSize: '10.5px', color: '#059669', fontWeight: 700, marginTop: '3px' }}>
                      {bus.acType}
                    </div>
                  </div>
                </div>

                {/* Road Corridor and Timetable Card */}
                <div style={{
                  background: 'var(--brand-slate-50, #F8FAFC)',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  marginBottom: '12px',
                  border: '1px solid var(--brand-border, #E2E8F0)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: 800, color: '#1E3A8A' }}>
                      <Navigation size={13} color="#2563EB" />
                      <span>{route?.name.split(':')[0] || 'Unassigned Road'}</span>
                    </div>
                    <span className="badge info" style={{ fontSize: '9px', padding: '1px 6px' }}>
                      {route?.inboundStops.length || 5} Stops
                    </span>
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--brand-slate-800)', marginTop: '4px', fontWeight: 700 }}>
                    {route?.name.split(':')[1]?.trim() || 'Custom Road Corridor'}
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '11px',
                    color: 'var(--brand-slate-600)',
                    marginTop: '8px',
                    paddingTop: '6px',
                    borderTop: '1px solid rgba(0,0,0,0.06)'
                  }}>
                    <span>🌅 Morning: <strong>{route?.inboundStartTime || '06:45 AM'}</strong></span>
                    <span>🌆 Evening: <strong>{route?.outboundStartTime || '05:15 PM'}</strong></span>
                  </div>
                </div>

                {/* Driver & Conductor Master Crew Details */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  fontSize: '11px',
                  marginBottom: '12px',
                  background: '#FFFFFF',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: '1px solid var(--brand-border, #E2E8F0)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '13px' }}>👤</span>
                    <div>
                      <div style={{ fontSize: '9.5px', color: 'var(--brand-slate-400)', textTransform: 'uppercase', fontWeight: 700 }}>Driver</div>
                      <strong style={{ color: 'var(--brand-slate-900)', fontSize: '11.5px' }}>{bus.driverName.split(' ')[0]} {bus.driverName.split(' ')[1] || ''}</strong>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '13px' }}>🎫</span>
                    <div>
                      <div style={{ fontSize: '9.5px', color: 'var(--brand-slate-400)', textTransform: 'uppercase', fontWeight: 700 }}>Conductor</div>
                      <strong style={{ color: 'var(--brand-slate-900)', fontSize: '11.5px' }}>{bus.conductorName.split(' ')[0]} {bus.conductorName.split(' ')[1] || ''}</strong>
                    </div>
                  </div>
                </div>

                {/* Occupancy Bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--brand-slate-600)', fontWeight: 600 }}>{t('Seat Occupancy', 'আসন দখল', lang)}:</span>
                    <strong style={{ color: 'var(--brand-slate-900)' }}>
                      {occupied}/{bus.capacity} {t('seats', 'আসন', lang)} ({fillPercent}%)
                      {vacated > 0 && <span style={{ color: '#D97706', marginLeft: '6px' }}>• {vacated} Vacated</span>}
                    </strong>
                  </div>
                  <div style={{ width: '100%', height: '7px', background: 'var(--brand-slate-200, #E2E8F0)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${fillPercent}%`,
                      height: '100%',
                      background: fillPercent > 90 ? 'linear-gradient(90deg, #10B981, #059669)' : fillPercent > 70 ? 'linear-gradient(90deg, #3B82F6, #2563EB)' : 'linear-gradient(90deg, #D4AF37, #D97706)',
                      borderRadius: '4px',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>
              </div>

              {/* Card Actions: Primary Button + Secondary Tools */}
              <div style={{
                display: 'flex',
                gap: '8px',
                paddingTop: '12px',
                borderTop: '1px solid var(--brand-border, #E2E8F0)'
              }}>
                <button
                  onClick={() => onSelectRoute(bus.assignedRouteId)}
                  style={{
                    flex: 1,
                    background: isSelected ? 'linear-gradient(135deg, #D4AF37 0%, #B45309 100%)' : '#FFFFFF',
                    color: isSelected ? '#000000' : 'var(--brand-slate-800)',
                    border: isSelected ? 'none' : '1.5px solid var(--brand-border, #CBD5E1)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '11.5px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: isSelected ? '0 2px 6px rgba(212, 175, 55, 0.35)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Bus size={13} />
                  <span>{isSelected ? t('Active 52-Seat Map', 'সিট ম্যাপ সক্রিয়', lang) : t('Inspect 52-Seat Map & FIFO', '৫২-সিট ম্যাপ ও ফিফো', lang)}</span>
                </button>

                <button
                  onClick={() => onOpenRouteBuilder(route)}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid var(--brand-border, #CBD5E1)',
                    color: 'var(--brand-slate-700)',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    fontSize: '11.5px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.15s ease'
                  }}
                  title={t('Edit Road Corridor, Path & Timetable', 'রোড করিডোর ও সময়সূচী সম্পাদনা', lang)}
                >
                  <Edit3 size={13} />
                </button>

                <button
                  onClick={() => onOpenSupervisorSeat(bus.assignedRouteId)}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #D4AF37',
                    color: '#B45309',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    fontSize: '11.5px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.15s ease'
                  }}
                  title={t('Reserve Specific Seat for Employee', 'কর্মচারীর আসন সংরক্ষণ করুন', lang)}
                >
                  <Award size={13} color="#D4AF37" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
