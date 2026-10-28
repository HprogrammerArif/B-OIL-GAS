import React, { useState } from 'react';
import { RouteInfo, RouteStop, BusVehicle } from './busTypes';
import { t } from '../../types';
import {
  MapPin, Plus, Trash2, CheckCircle, X, Navigation, Clock,
  Bus, User, Phone, ArrowRight, ShieldCheck, Compass, Sparkles, ChevronRight
} from 'lucide-react';

interface RouteBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveRoute: (route: RouteInfo) => void;
  existingRoute?: RouteInfo | null;
  buses: BusVehicle[];
  lang: 'en' | 'bn';
}

export default function RouteBuilderModal({
  isOpen,
  onClose,
  onSaveRoute,
  existingRoute,
  buses,
  lang,
}: RouteBuilderModalProps) {
  const [routeName, setRouteName] = useState(
    existingRoute?.name || 'Route-11: Narsingdi ➔ Kanchpur ➔ Jatrabari ➔ Plant'
  );
  const [routeNameBn, setRouteNameBn] = useState(
    existingRoute?.nameBn || 'রুট-১১: নরসিংদী ➔ কাঁচপুর ➔ যাত্রাবাড়ী ➔ প্ল্যান্ট'
  );
  const [busId, setBusId] = useState(existingRoute?.busId || buses[0]?.id || 'bus-1');
  const [corridorRoad, setCorridorRoad] = useState(
    existingRoute?.corridorRoad ||
      'Dhaka-Sylhet Highway ➔ Kanchpur Bridge ➔ Postogola Bridge ➔ Babubazar Overpass ➔ Keraniganj Plant Complex'
  );
  const [driverName, setDriverName] = useState(existingRoute?.driverName || 'Master Nurul Huda');
  const [driverPhone, setDriverPhone] = useState(existingRoute?.driverPhone || '+880 1718-445566');
  const [conductorName, setConductorName] = useState(existingRoute?.conductorName || 'Shafiqul Islam');
  const [conductorPhone, setConductorPhone] = useState(existingRoute?.conductorPhone || '+880 1819-556677');
  const [inboundStartTime, setInboundStartTime] = useState(existingRoute?.inboundStartTime || '06:30 AM');
  const [outboundStartTime, setOutboundStartTime] = useState(existingRoute?.outboundStartTime || '05:15 PM');

  // Direction view toggle inside modal
  const [activeDirectionTab, setActiveDirectionTab] = useState<'inbound' | 'outbound'>('inbound');

  // Stoppages lists
  const [inboundStops, setInboundStops] = useState<RouteStop[]>(
    existingRoute?.inboundStops || [
      { id: 'st-1', name: 'Narsingdi Velanagar Terminal', nameBn: 'ভেলানগর বাস টার্মিনাল', scheduledTime: '06:30 AM', passengers: 15, status: 'passed', distanceKm: '0.0 km', landmark: 'Bus Bay #1' },
      { id: 'st-2', name: 'Madhabdi Bus Stand', nameBn: 'মাধবদী বাস স্ট্যান্ড', scheduledTime: '06:50 AM', passengers: 12, status: 'passed', distanceKm: '9.5 km', landmark: 'Bazar Mosque' },
      { id: 'st-3', name: 'Kanchpur Overpass Foot', nameBn: 'কাঁচপুর ওভারপাস ফুট', scheduledTime: '07:20 AM', passengers: 11, status: 'active', distanceKm: '22.0 km', landmark: 'Highway Crossing' },
      { id: 'st-4', name: 'Jatrabari Hanif Flyover Ramp', nameBn: 'যাত্রাবাড়ী হানিফ ফ্লাইওভার র‍্যাম্প', scheduledTime: '07:38 AM', passengers: 8, status: 'upcoming', distanceKm: '31.2 km', landmark: 'Toll Entrance' },
      { id: 'st-5', name: 'Keraniganj Plant Gate-1', nameBn: 'কেরানীগঞ্জ প্ল্যান্ট গেট-১', scheduledTime: '08:05 AM', passengers: 0, status: 'upcoming', distanceKm: '42.0 km', landmark: 'Main Refinery Gate' },
    ]
  );

  const [outboundStops, setOutboundStops] = useState<RouteStop[]>(
    existingRoute?.outboundStops || [
      { id: 'ost-1', name: 'Keraniganj Plant Gate-1', nameBn: 'কেরানীগঞ্জ প্ল্যান্ট গেট-১', scheduledTime: '05:15 PM', passengers: 46, status: 'upcoming', distanceKm: '0.0 km', landmark: 'Refinery Departure Bay' },
      { id: 'ost-2', name: 'Jatrabari Hanif Flyover Ramp', nameBn: 'যাত্রাবাড়ী হানিফ ফ্লাইওভার র‍্যাম্প', scheduledTime: '05:42 PM', passengers: 8, status: 'upcoming', distanceKm: '10.8 km', landmark: 'Toll Exit' },
      { id: 'ost-3', name: 'Kanchpur Overpass Foot', nameBn: 'কাঁচপুর ওভারপাস ফুট', scheduledTime: '06:05 PM', passengers: 11, status: 'upcoming', distanceKm: '20.0 km', landmark: 'Overpass Foot' },
      { id: 'ost-4', name: 'Madhabdi Bus Stand', nameBn: 'মাধবদী বাস স্ট্যান্ড', scheduledTime: '06:32 PM', passengers: 12, status: 'upcoming', distanceKm: '32.5 km', landmark: 'Bazar Footover' },
      { id: 'ost-5', name: 'Narsingdi Velanagar Terminal', nameBn: 'ভেলানগর বাস টার্মিনাল', scheduledTime: '06:55 PM', passengers: 15, status: 'upcoming', distanceKm: '42.0 km', landmark: 'Final Terminal' },
    ]
  );

  // New Stop input states
  const [newStopName, setNewStopName] = useState('');
  const [newStopTime, setNewStopTime] = useState('07:10 AM');
  const [newStopDistance, setNewStopDistance] = useState('14.5 km');
  const [newStopLandmark, setNewStopLandmark] = useState('');

  if (!isOpen) return null;

  const currentStops = activeDirectionTab === 'inbound' ? inboundStops : outboundStops;

  const handleAddStop = () => {
    if (!newStopName.trim()) return;
    const newStop: RouteStop = {
      id: `st-${Date.now()}`,
      name: newStopName.trim(),
      nameBn: newStopName.trim(),
      scheduledTime: newStopTime.trim(),
      passengers: 8,
      status: 'upcoming',
      distanceKm: newStopDistance.trim() || '15.0 km',
      landmark: newStopLandmark.trim() || 'Designated Station Stop',
    };

    if (activeDirectionTab === 'inbound') {
      const updated = [...inboundStops];
      if (updated.length > 0) {
        updated.splice(updated.length - 1, 0, newStop);
      } else {
        updated.push(newStop);
      }
      setInboundStops(updated);
    } else {
      const updated = [...outboundStops];
      if (updated.length > 0) {
        updated.splice(updated.length - 1, 0, newStop);
      } else {
        updated.push(newStop);
      }
      setOutboundStops(updated);
    }

    setNewStopName('');
    setNewStopLandmark('');
  };

  const handleRemoveStop = (id: string) => {
    if (activeDirectionTab === 'inbound') {
      if (inboundStops.length <= 2) return;
      setInboundStops(inboundStops.filter(s => s.id !== id));
    } else {
      if (outboundStops.length <= 2) return;
      setOutboundStops(outboundStops.filter(s => s.id !== id));
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedBus = buses.find(b => b.id === busId) || buses[0];
    const routeId = existingRoute?.id || `route-${Date.now().toString().slice(-4)}`;

    const compiledRoute: RouteInfo = {
      id: routeId,
      name: routeName.trim(),
      nameBn: routeNameBn.trim(),
      coachNo: selectedBus?.coachNo || 'DHAKA METRO-BA 15-4421',
      busId: selectedBus?.id || 'bus-1',
      model: selectedBus?.model || 'Hino RM2 Luxury AC (52-Seater)',
      corridorRoad: corridorRoad.trim(),
      driverName: driverName.trim(),
      driverPhone: driverPhone.trim(),
      conductorName: conductorName.trim(),
      conductorPhone: conductorPhone.trim(),
      speed: '42 km/h',
      nextStop: inboundStops[2]?.name || inboundStops[0]?.name || 'Next Station',
      nextEta: '8 mins',
      progressPercent: 55,
      capacity: selectedBus?.capacity || 52,
      inboundStops,
      outboundStops,
      inboundStartTime,
      outboundStartTime,
    };

    onSaveRoute(compiledRoute);
    onClose();
  };

  const selectedBusObj = buses.find(b => b.id === busId) || buses[0];

  return (
    <div className="modal-bg" onClick={onClose} style={{ zIndex: 9999, backdropFilter: 'blur(6px)' }}>
      <div
        className="modal"
        style={{
          maxWidth: '860px',
          width: '94vw',
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
              background: 'rgba(59, 130, 246, 0.25)',
              border: '1px solid rgba(96, 165, 250, 0.4)',
              color: '#93C5FD',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Navigation size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '17px', fontWeight: 900, color: '#FFFFFF', margin: 0, letterSpacing: '-0.2px' }}>
                  {existingRoute
                    ? t('Configure Road Corridor & Stoppages Timetable', 'রোড করিডোর ও স্টপেজ সময়সূচী রূপরেখা', lang)
                    : t('Define New Road Corridor & Sequential Stoppages', 'নতুন রোড করিডোর ও পর্যায়ক্রমিক স্টপেজ প্রণয়ন', lang)}
                </h3>
                <span className="badge gold" style={{ fontSize: '10px', padding: '2px 8px' }}>
                  {selectedBusObj ? `${selectedBusObj.coachNo}` : 'Fleet Bus'}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#94A3B8', margin: '4px 0 0 0' }}>
                {t(
                  'Set highway transit corridors, sequential boarding stations, morning departure & evening return timetables.',
                  'মহাসড়ক পথ, পর্যায়ক্রমিক যাত্রী বোর্ডিং স্টপেজ, সকাল ও সন্ধ্যার যাতায়াত সময়সূচী নির্ধারণ করুন।',
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
              justifyContent: 'center',
              transition: 'background 0.15s ease'
            }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave}>
          <div style={{
            padding: '20px 24px',
            maxHeight: '74vh',
            overflowY: 'auto',
            background: 'var(--brand-card-bg, #FFFFFF)',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px'
          }}>
            {/* ─── SECTION 1: Route Corridor & Bus Assignment ─── */}
            <div style={{
              background: 'var(--brand-slate-50, #F8FAFC)',
              border: '1px solid var(--brand-border, #E2E8F0)',
              borderRadius: '12px',
              padding: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
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
                <Compass size={14} />
                <span>{t('Corridor Identity & Fleet Assignment', 'রোড করিডোর ও বাস বরাদ্দ', lang)}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '6px', color: 'var(--brand-slate-800)' }}>
                    {t('Route Code & Designation (English)', 'রুটের নাম (ইংরেজি)', lang)} <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    className="form-input"
                    value={routeName}
                    onChange={e => setRouteName(e.target.value)}
                    placeholder="Route-5: Gazipur ➔ Tongi ➔ Plant"
                    style={{ width: '100%', padding: '9px 12px', fontSize: '12.5px', borderRadius: '8px' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '6px', color: 'var(--brand-slate-800)' }}>
                    {t('Assign Dedicated Bus Coach', 'নির্ধারিত বাস ও কোচ নির্বাচন', lang)} <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <select
                    className="form-input"
                    value={busId}
                    onChange={e => setBusId(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', fontSize: '12.5px', borderRadius: '8px' }}
                  >
                    {buses.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.coachNo} • {b.model} ({b.capacity} Seats)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '6px', color: 'var(--brand-slate-800)' }}>
                  {t('Highway / Road Corridor Path Description', 'মহাসড়ক ও সংযোগ সড়ক বিবরণী', lang)} <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <textarea
                  className="form-input"
                  rows={2}
                  value={corridorRoad}
                  onChange={e => setCorridorRoad(e.target.value)}
                  placeholder="e.g. Mirpur Road ➔ Agargaon Metro ➔ Farmgate Overbridge ➔ Shahbagh ➔ Babubazar Bridge ➔ Keraniganj Complex"
                  style={{ width: '100%', padding: '8px 12px', fontSize: '12px', borderRadius: '8px', lineHeight: 1.5 }}
                  required
                />
              </div>
            </div>

            {/* ─── SECTION 2: Morning Inbound vs Evening Return Departure Timetable ─── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px' }}>
              {/* Morning Schedule Card */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(239, 246, 255, 0.8) 0%, rgba(219, 234, 254, 0.4) 100%)',
                border: '1.5px solid #93C5FD',
                borderRadius: '12px',
                padding: '14px 16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#1E3A8A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🌅</span>
                    <span>{t('Morning Inbound (City ➔ Plant/HQ)', 'সকালের সময়সূচী (শহর ➔ অফিস)', lang)}</span>
                  </div>
                  <span className="badge info" style={{ fontSize: '10px' }}>Inbound</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Clock size={16} color="#2563EB" />
                  <span style={{ fontSize: '12px', color: '#1E3A8A', fontWeight: 600 }}>{t('First Stop Departure:', 'প্রথম স্টপ থেকে রওনা:', lang)}</span>
                  <input
                    className="form-input"
                    style={{ width: '120px', padding: '6px 10px', fontSize: '12px', borderRadius: '6px', fontWeight: 800, textAlign: 'center' }}
                    value={inboundStartTime}
                    onChange={e => setInboundStartTime(e.target.value)}
                    placeholder="06:30 AM"
                  />
                </div>
              </div>

              {/* Evening Schedule Card */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(254, 243, 199, 0.8) 0%, rgba(253, 230, 138, 0.3) 100%)',
                border: '1.5px solid #FCD34D',
                borderRadius: '12px',
                padding: '14px 16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#92400E', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🌇</span>
                    <span>{t('Evening Return (Plant/HQ ➔ City)', 'সন্ধ্যার সময়সূচী (অফিস ➔ শহর)', lang)}</span>
                  </div>
                  <span className="badge gold" style={{ fontSize: '10px' }}>Outbound</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Clock size={16} color="#D97706" />
                  <span style={{ fontSize: '12px', color: '#92400E', fontWeight: 600 }}>{t('Plant Gate Departure:', 'প্ল্যান্ট গেট থেকে রওনা:', lang)}</span>
                  <input
                    className="form-input"
                    style={{ width: '120px', padding: '6px 10px', fontSize: '12px', borderRadius: '6px', fontWeight: 800, textAlign: 'center' }}
                    value={outboundStartTime}
                    onChange={e => setOutboundStartTime(e.target.value)}
                    placeholder="05:15 PM"
                  />
                </div>
              </div>
            </div>

            {/* ─── SECTION 3: Driver & Conductor Crew Assignment ─── */}
            <div style={{
              background: 'var(--brand-slate-50, #F8FAFC)',
              border: '1px solid var(--brand-border, #E2E8F0)',
              borderRadius: '12px',
              padding: '16px'
            }}>
              <div style={{
                fontSize: '11.5px',
                fontWeight: 800,
                color: '#059669',
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <ShieldCheck size={14} />
                <span>{t('Assigned Highway Crew (Licensed Driver & Door Marshall)', 'মনোনীত বাস চালক ও কন্ডাক্টর', lang)}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                <div style={{ background: '#FFFFFF', padding: '12px', borderRadius: '8px', border: '1px solid var(--brand-border)' }}>
                  <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--brand-slate-700)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <User size={13} color="#2563EB" />
                    <span>{t('Master Heavy Driver', 'মূল চালক', lang)}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px' }}>
                    <input
                      className="form-input"
                      value={driverName}
                      onChange={e => setDriverName(e.target.value)}
                      placeholder="Driver Name"
                      style={{ padding: '7px 10px', fontSize: '12px', borderRadius: '6px' }}
                    />
                    <input
                      className="form-input"
                      value={driverPhone}
                      onChange={e => setDriverPhone(e.target.value)}
                      placeholder="+880 17..."
                      style={{ padding: '7px 10px', fontSize: '12px', borderRadius: '6px' }}
                    />
                  </div>
                </div>

                <div style={{ background: '#FFFFFF', padding: '12px', borderRadius: '8px', border: '1px solid var(--brand-border)' }}>
                  <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--brand-slate-700)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <User size={13} color="#059669" />
                    <span>{t('Conductor / Passenger Marshall', 'কন্ডাক্টর', lang)}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px' }}>
                    <input
                      className="form-input"
                      value={conductorName}
                      onChange={e => setConductorName(e.target.value)}
                      placeholder="Conductor Name"
                      style={{ padding: '7px 10px', fontSize: '12px', borderRadius: '6px' }}
                    />
                    <input
                      className="form-input"
                      value={conductorPhone}
                      onChange={e => setConductorPhone(e.target.value)}
                      placeholder="+880 18..."
                      style={{ padding: '7px 10px', fontSize: '12px', borderRadius: '6px' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ─── SECTION 4: Sequential Stoppages Builder ─── */}
            <div style={{
              border: '1.5px solid var(--brand-border, #CBD5E1)',
              borderRadius: '12px',
              padding: '16px',
              background: '#FFFFFF'
            }}>
              {/* Stoppage Tab Switcher */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={17} color="#2563EB" />
                  <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--brand-slate-900)' }}>
                    {t('Sequential Station Stoppages & Arrival Timeline', 'পর্যায়ক্রমিক স্টপেজ তালিকা ও আগমন সময়সূচী', lang)}
                  </span>
                </div>

                {/* Sub Tab: Inbound Morning vs Outbound Evening Stops */}
                <div style={{ display: 'flex', background: 'var(--brand-slate-100, #F1F5F9)', padding: '3px', borderRadius: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setActiveDirectionTab('inbound')}
                    style={{
                      background: activeDirectionTab === 'inbound' ? '#FFFFFF' : 'transparent',
                      color: activeDirectionTab === 'inbound' ? '#1E3A8A' : 'var(--brand-slate-600)',
                      border: 'none',
                      padding: '5px 12px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      boxShadow: activeDirectionTab === 'inbound' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                    }}
                  >
                    <span>🌅 Morning Inbound ({inboundStops.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveDirectionTab('outbound')}
                    style={{
                      background: activeDirectionTab === 'outbound' ? '#FFFFFF' : 'transparent',
                      color: activeDirectionTab === 'outbound' ? '#92400E' : 'var(--brand-slate-600)',
                      border: 'none',
                      padding: '5px 12px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      boxShadow: activeDirectionTab === 'outbound' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                    }}
                  >
                    <span>🌇 Evening Outbound ({outboundStops.length})</span>
                  </button>
                </div>
              </div>

              {/* Station Timeline List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {currentStops.map((st, idx) => {
                  const isFirst = idx === 0;
                  const isLast = idx === currentStops.length - 1;

                  return (
                    <div
                      key={st.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: isLast ? 'rgba(16, 185, 129, 0.08)' : isFirst ? 'rgba(59, 130, 246, 0.06)' : 'var(--brand-slate-50, #F8FAFC)',
                        border: isLast ? '1.5px solid #10B981' : isFirst ? '1.5px solid #60A5FA' : '1px solid var(--brand-border)',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        fontSize: '12px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '50%',
                          background: isLast ? '#059669' : isFirst ? '#2563EB' : 'var(--brand-slate-600)',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '11px'
                        }}>
                          {idx + 1}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <strong style={{ fontSize: '13px', color: 'var(--brand-slate-900)' }}>{st.name}</strong>
                            {isFirst && <span className="badge info" style={{ fontSize: '9px', padding: '1px 5px' }}>{t('Origin', 'শুরু', lang)}</span>}
                            {isLast && <span className="badge success" style={{ fontSize: '9px', padding: '1px 5px' }}>{t('Final Terminus', 'গন্তব্য', lang)}</span>}
                          </div>
                          {st.landmark && (
                            <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)', marginTop: '2px' }}>
                              📍 {st.landmark}
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <span style={{
                          fontWeight: 800,
                          color: '#D97706',
                          background: '#FFFBEB',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          border: '1px solid #FCD34D',
                          fontSize: '11.5px'
                        }}>
                          ⏰ {st.scheduledTime}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--brand-slate-500)', fontWeight: 600 }}>
                          🛣️ {st.distanceKm}
                        </span>

                        {!isFirst && !isLast && (
                          <button
                            type="button"
                            onClick={() => handleRemoveStop(st.id)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#EF4444',
                              cursor: 'pointer',
                              padding: '4px',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                            title="Remove stoppage point"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add New Intermediate Stoppage Form Strip */}
              <div style={{
                background: 'linear-gradient(135deg, var(--brand-slate-50, #F8FAFC) 0%, #FFFFFF 100%)',
                padding: '14px',
                borderRadius: '10px',
                border: '1.5px dashed #94A3B8'
              }}>
                <div style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--brand-slate-800)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Plus size={14} color="#059669" />
                  <span>
                    {t(
                      `Add Intermediate Stoppage to ${activeDirectionTab === 'inbound' ? 'Morning Inbound' : 'Evening Outbound'}:`,
                      `নতুন স্টপেজ পয়েন্ট যুক্ত করুন (${activeDirectionTab === 'inbound' ? 'সকাল' : 'সন্ধ্যা'}):`,
                      lang
                    )}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr)) auto', gap: '10px', alignItems: 'flex-end' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '10.5px', color: 'var(--brand-slate-600)', marginBottom: '4px', fontWeight: 600 }}>
                      {t('Station Name', 'স্টেশনের নাম', lang)}
                    </label>
                    <input
                      className="form-input"
                      style={{ fontSize: '12px', padding: '7px 10px', borderRadius: '6px', width: '100%' }}
                      placeholder="e.g. Shahbagh Square"
                      value={newStopName}
                      onChange={e => setNewStopName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '10.5px', color: 'var(--brand-slate-600)', marginBottom: '4px', fontWeight: 600 }}>
                      {t('Arrival Time', 'আগমন সময়', lang)}
                    </label>
                    <input
                      className="form-input"
                      style={{ fontSize: '12px', padding: '7px 10px', borderRadius: '6px', width: '100%' }}
                      placeholder="07:15 AM"
                      value={newStopTime}
                      onChange={e => setNewStopTime(e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '10.5px', color: 'var(--brand-slate-600)', marginBottom: '4px', fontWeight: 600 }}>
                      {t('Distance', 'দূরত্ব', lang)}
                    </label>
                    <input
                      className="form-input"
                      style={{ fontSize: '12px', padding: '7px 10px', borderRadius: '6px', width: '100%' }}
                      placeholder="14.5 km"
                      value={newStopDistance}
                      onChange={e => setNewStopDistance(e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '10.5px', color: 'var(--brand-slate-600)', marginBottom: '4px', fontWeight: 600 }}>
                      {t('Key Landmark (Optional)', 'ল্যান্ডমার্ক (ঐচ্ছিক)', lang)}
                    </label>
                    <input
                      className="form-input"
                      style={{ fontSize: '12px', padding: '7px 10px', borderRadius: '6px', width: '100%' }}
                      placeholder="e.g. Overbridge Foot"
                      value={newStopLandmark}
                      onChange={e => setNewStopLandmark(e.target.value)}
                    />
                  </div>

                  <button
                    type="button"
                    className="btn-primary"
                    style={{
                      padding: '8px 16px',
                      fontSize: '12px',
                      fontWeight: 700,
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      height: '35px'
                    }}
                    onClick={handleAddStop}
                  >
                    <Plus size={14} />
                    <span>{t('Add Stop', 'স্টপ যোগ করুন', lang)}</span>
                  </button>
                </div>
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
              className="btn-primary"
              style={{
                padding: '8px 20px',
                fontSize: '12.5px',
                fontWeight: 800,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.35)'
              }}
            >
              <CheckCircle size={16} />
              <span>{t('Save Road Corridor & Stoppages Timetable', 'রোড করিডোর ও সময়সূচী সংরক্ষণ করুন', lang)}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
