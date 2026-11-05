import React, { useState, useMemo } from 'react';
import { BusVehicle, RouteInfo, Seat } from './busTypes';
import { t } from '../../types';
import {
  Bus, MapPin, Users, Phone, Navigation, Shield, Plus,
  RefreshCw, Edit3, ArrowRight, CheckCircle2, UserCheck, Clock, UserPlus,
  Search, X, User, Ticket, Sun, Sunset
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
  onOpenRouteBuilder,
  onOpenSupervisorSeat,
  lang,
}: BusFleetOverviewGridProps) {
  const [corridorQuery, setCorridorQuery] = useState('');

  const filteredBuses = useMemo(() => {
    const q = corridorQuery.trim().toLowerCase();
    if (!q) return buses;
    return buses.filter(bus => {
      const route = routes[bus.assignedRouteId];
      return (
        bus.coachNo.toLowerCase().includes(q) ||
        bus.model.toLowerCase().includes(q) ||
        bus.driverName.toLowerCase().includes(q) ||
        bus.conductorName.toLowerCase().includes(q) ||
        (route?.name && route.name.toLowerCase().includes(q)) ||
        (route?.corridorRoad && route.corridorRoad.toLowerCase().includes(q))
      );
    });
  }, [buses, routes, corridorQuery]);

  return (
    <div style={{ marginBottom: '28px' }}>
      {/* ─── Quick Filter / Search Bar for the 10-Bus Fleet ─── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          background: 'var(--surface-1)',
          border: '1px solid var(--brand-border)',
          borderRadius: '10px',
          padding: '10px 14px',
          marginBottom: '16px',
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: '260px', maxWidth: '480px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '9px', color: 'var(--brand-slate-400)' }} />
          <input
            type="text"
            className="input-text"
            placeholder={t('Filter routes by corridor, stop, driver, or coach number...', 'করিডোর, স্টপ, চালক বা কোচ নম্বর লিখে খুঁজুন...', lang)}
            value={corridorQuery}
            onChange={(e) => setCorridorQuery(e.target.value)}
            style={{ width: '100%', paddingLeft: '32px', paddingRight: corridorQuery ? '28px' : '10px', height: '32px', fontSize: '12px' }}
          />
          {corridorQuery && (
            <button
              type="button"
              onClick={() => setCorridorQuery('')}
              style={{
                position: 'absolute',
                right: '8px',
                top: '7px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--brand-slate-400)',
                padding: 0,
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div style={{ fontSize: '11.5px', color: 'var(--brand-slate-500)', fontWeight: 600 }}>
          {t(
            `Showing ${filteredBuses.length} of ${buses.length} staff coaches · Click any coach to open its seat map`,
            `${buses.length}টি বাসের মধ্যে ${filteredBuses.length}টি প্রদর্শিত · সিট ম্যাপ দেখতে যেকোনো কার্ডে ক্লিক করুন`,
            lang,
          )}
        </div>
      </div>

      {/* ─── 10-Bus Fleet Cards Grid ─── */}
      {filteredBuses.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--brand-slate-500)' }}>
          <Bus size={28} style={{ opacity: 0.4, margin: '0 auto 8px' }} />
          <div style={{ fontWeight: 700, fontSize: '13px' }}>{t('No matching bus routes', 'কোনো রুট পাওয়া যায়নি', lang)}</div>
          <div style={{ fontSize: '11.5px', marginTop: '2px' }}>{t('Clear the search box to see all 10 staff coaches.', 'সবগুলো বাস দেখতে সার্চ বক্স পরিষ্কার করুন।', lang)}</div>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(370px, 1fr))',
            gap: '16px',
          }}
        >
          {filteredBuses.map((bus) => {
            const route = routes[bus.assignedRouteId];
            const busSeats = routeSeats[bus.assignedRouteId] || [];
            const occupied = busSeats.filter(s => s.status === 'occupied').length;
            const vacated = busSeats.filter(s => s.status === 'vacated').length;
            const freeSeats = Math.max(0, bus.capacity - occupied);
            const isSelected = route?.id === selectedRouteKey;
            const fillPercent = bus.capacity > 0 ? Math.round((occupied / bus.capacity) * 100) : 0;
            const routeCode = route?.name.split(':')[0] || t('Route', 'রুট', lang);
            const corridorLabel = route?.name.split(':')[1]?.trim() || bus.assignedRoadName || t('Custom Corridor', 'কাস্টম করিডোর', lang);

            return (
              <div
                key={bus.id}
                className="card"
                style={{
                  border: isSelected ? '2px solid var(--brand-gold)' : '1px solid var(--brand-border)',
                  background: isSelected
                    ? 'linear-gradient(180deg, rgba(212, 175, 55, 0.06) 0%, var(--surface-1) 100%)'
                    : 'var(--brand-card-bg)',
                  borderRadius: '14px',
                  padding: '16px 18px',
                  position: 'relative',
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected ? '0 8px 24px rgba(212, 175, 55, 0.18)' : '0 2px 8px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                {/* Card Top: Lead with Route Corridor & Stops, Coach Plate second */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', minWidth: 0 }}>
                      <div
                        style={{
                          padding: '5px 9px',
                          borderRadius: '8px',
                          background: isSelected
                            ? 'linear-gradient(135deg, var(--brand-gold) 0%, var(--status-warning-solid-dark) 100%)'
                            : 'var(--surface-inverse)',
                          color: isSelected ? 'var(--text-1)' : 'var(--text-on-brand)',
                          fontWeight: 900,
                          fontSize: '11.5px',
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                        }}
                      >
                        {routeCode}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: '13.5px', color: 'var(--brand-slate-900)', lineHeight: 1.3 }}>
                          {corridorLabel}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <strong style={{ color: 'var(--brand-slate-700)' }}>{bus.coachNo}</strong>
                          <span>·</span>
                          <span>{bus.model}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span className={`badge ${isSelected ? 'gold' : 'success'}`} style={{ fontSize: '9.5px', padding: '2px 8px', fontWeight: 800 }}>
                        {isSelected ? t('Selected', 'নির্বাচিত', lang) : t('On duty', 'ডিউটিতে', lang)}
                      </span>
                      <div style={{ fontSize: '10px', color: 'var(--brand-slate-500)', fontWeight: 600, marginTop: '3px' }}>
                        {route?.inboundStops.length || 5} {t('stops', 'স্টপ', lang)} · {bus.acType}
                      </div>
                    </div>
                  </div>

                  {/* Schedule & Crew Strip */}
                  <div
                    style={{
                      background: 'var(--brand-slate-50)',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      marginBottom: '12px',
                      border: '1px solid var(--brand-border)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', fontSize: '11px', color: 'var(--brand-slate-700)' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <Sun size={12} color="var(--status-warning)" />
                        {t('Morning:', 'সকাল:', lang)} <strong>{route?.inboundStartTime || '06:45 AM'}</strong>
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <Sunset size={12} color="var(--status-info)" />
                        {t('Evening:', 'সন্ধ্যা:', lang)} <strong>{route?.outboundStartTime || '05:15 PM'}</strong>
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '8px',
                        fontSize: '11px',
                        paddingTop: '7px',
                        borderTop: '1px solid rgba(0,0,0,0.06)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                        <User size={12} color="var(--status-info)" style={{ flexShrink: 0 }} />
                        <div style={{ minWidth: 0 }}>
                          <span style={{ color: 'var(--brand-slate-500)', fontSize: '10px' }}>{t('Driver:', 'চালক:', lang)} </span>
                          <strong style={{ color: 'var(--brand-slate-900)' }}>
                            {bus.driverName.split(' ')[0]} {bus.driverName.split(' ')[1] || ''}
                          </strong>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                        <Ticket size={12} color="var(--status-warning)" style={{ flexShrink: 0 }} />
                        <div style={{ minWidth: 0 }}>
                          <span style={{ color: 'var(--brand-slate-500)', fontSize: '10px' }}>{t('Conductor:', 'কন্ডাক্টর:', lang)} </span>
                          <strong style={{ color: 'var(--brand-slate-900)' }}>
                            {bus.conductorName.split(' ')[0]} {bus.conductorName.split(' ')[1] || ''}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Occupancy Bar */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', marginBottom: '5px' }}>
                      <span style={{ color: 'var(--brand-slate-600)', fontWeight: 600 }}>
                        {t('Seats booked:', 'বুককৃত আসন:', lang)} <strong style={{ color: 'var(--brand-slate-900)' }}>{occupied}/{bus.capacity}</strong> ({fillPercent}%)
                      </span>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: freeSeats > 0 ? 'var(--status-success)' : 'var(--brand-slate-500)' }}>
                        {t(`${freeSeats} free`, `${freeSeats}টি খালি`, lang)}
                        {vacated > 0 && (
                          <span style={{ color: 'var(--status-warning-text)' }}>
                            {' · '}{t(`${vacated} released today`, `আজ ${vacated}টি ছাড়া হয়েছে`, lang)}
                          </span>
                        )}
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '7px', background: 'var(--brand-slate-200)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${fillPercent}%`,
                          height: '100%',
                          background:
                            fillPercent > 90
                              ? 'var(--status-success-solid)'
                              : fillPercent > 70
                              ? 'var(--status-info-solid)'
                              : 'var(--brand-gold)',
                          borderRadius: '4px',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Actions: Labeled Self-Explanatory Buttons */}
                <div
                  style={{
                    display: 'flex',
                    gap: '6px',
                    paddingTop: '10px',
                    borderTop: '1px solid var(--brand-border)',
                    flexWrap: 'wrap',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => onSelectRoute(bus.assignedRouteId)}
                    style={{
                      flex: 1,
                      minWidth: '140px',
                      background: isSelected
                        ? 'linear-gradient(135deg, var(--brand-gold) 0%, var(--status-warning-solid-dark) 100%)'
                        : 'var(--surface-1)',
                      color: isSelected ? 'var(--text-1)' : 'var(--brand-slate-800)',
                      border: isSelected ? 'none' : '1.5px solid var(--brand-border)',
                      borderRadius: '8px',
                      padding: '7px 10px',
                      fontSize: '11.5px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      boxShadow: isSelected ? '0 2px 6px rgba(212, 175, 55, 0.3)' : 'none',
                    }}
                  >
                    <Bus size={13} />
                    <span>{t('Seat Map & Queue', 'সিট ম্যাপ ও কিউ', lang)}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenRouteBuilder(route)}
                    style={{
                      background: 'var(--surface-1)',
                      border: '1px solid var(--brand-border)',
                      color: 'var(--brand-slate-700)',
                      borderRadius: '8px',
                      padding: '7px 10px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Edit3 size={12} />
                    <span>{t('Edit Route', 'রুট সম্পাদনা', lang)}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenSupervisorSeat(bus.assignedRouteId)}
                    style={{
                      background: 'var(--surface-1)',
                      border: '1px solid var(--brand-gold)',
                      color: 'var(--status-warning-text)',
                      borderRadius: '8px',
                      padding: '7px 10px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <UserPlus size={12} />
                    <span>{t('Assign Seat', 'সিট বরাদ্দ', lang)}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
