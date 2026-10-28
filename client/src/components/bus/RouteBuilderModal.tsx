import React, { useState } from 'react';
import { RouteInfo, RouteStop, BusVehicle } from './busTypes';
import { t } from '../../types';
import { MapPin, Plus, Trash2, CheckCircle, X, Navigation, Clock, Bus, User, Phone } from 'lucide-react';

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
      'Dhaka-Sylhet Highway ➔ Kanchpur Bridge ➔ Postogola Bridge ➔ Babubazar Overpass ➔ Keraniganj Plant'
  );
  const [driverName, setDriverName] = useState(existingRoute?.driverName || 'Master Nurul Huda');
  const [driverPhone, setDriverPhone] = useState(existingRoute?.driverPhone || '+880 1718-445566');
  const [conductorName, setConductorName] = useState(existingRoute?.conductorName || 'Shafiqul Islam');
  const [conductorPhone, setConductorPhone] = useState(existingRoute?.conductorPhone || '+880 1819-556677');
  const [inboundStartTime, setInboundStartTime] = useState(existingRoute?.inboundStartTime || '06:30 AM');
  const [outboundStartTime, setOutboundStartTime] = useState(existingRoute?.outboundStartTime || '05:15 PM');

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

  const handleAddInboundStop = () => {
    if (!newStopName.trim()) return;
    const newStop: RouteStop = {
      id: `st-${Date.now()}`,
      name: newStopName.trim(),
      nameBn: newStopName.trim(),
      scheduledTime: newStopTime,
      passengers: 8,
      status: 'upcoming',
      distanceKm: newStopDistance,
      landmark: newStopLandmark || 'Main Road Stoppage',
    };
    // Insert before the last stop (which is the Plant)
    const updated = [...inboundStops];
    if (updated.length > 0) {
      updated.splice(updated.length - 1, 0, newStop);
    } else {
      updated.push(newStop);
    }
    setInboundStops(updated);
    setNewStopName('');
    setNewStopLandmark('');
  };

  const handleRemoveInboundStop = (id: string) => {
    if (inboundStops.length <= 2) return;
    setInboundStops(inboundStops.filter(s => s.id !== id));
  };

  const handleRemoveOutboundStop = (id: string) => {
    if (outboundStops.length <= 2) return;
    setOutboundStops(outboundStops.filter(s => s.id !== id));
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
      speed: '40 km/h',
      nextStop: inboundStops[2]?.name || inboundStops[0]?.name || 'Next Stoppage',
      nextEta: '10 mins',
      progressPercent: 50,
      capacity: selectedBus?.capacity || 52,
      inboundStops,
      outboundStops,
      inboundStartTime,
      outboundStartTime,
    };

    onSaveRoute(compiledRoute);
    onClose();
  };

  return (
    <div className="modal-bg" onClick={onClose} style={{ zIndex: 9999 }}>
      <div className="modal" style={{ maxWidth: '820px', width: '92vw' }} onClick={e => e.stopPropagation()}>
        <div className="modal-hd" style={{ background: '#0F172A', color: '#FFFFFF' }}>
          <div className="modal-hd-left">
            <div className="modal-hd-icon" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60A5FA' }}>
              <Navigation size={18} />
            </div>
            <div>
              <h3 className="modal-title" style={{ color: '#FFFFFF' }}>
                {existingRoute
                  ? t('Edit Road Corridor, Path & Timetable', 'রোড করিডোর, রুট ও সময়সূচী সম্পাদনা', lang)
                  : t('Define New Road Corridor & Stoppages Timetable', 'নতুন রোড করিডোর, স্টপেজ ও সময়সূচী প্রণয়ন', lang)}
              </h3>
              <div className="modal-subtitle" style={{ color: '#94A3B8' }}>
                {t('Configure Morning Inbound (Home ➔ Office/Plant) & Evening Outbound (Office/Plant ➔ Home)', 'সকাল ও সন্ধ্যার স্টপেজ, সময়সূচী ও মনোনীত বাস নির্ধারণ', lang)}
              </div>
            </div>
          </div>
          <button className="modal-close" style={{ color: '#FFFFFF' }} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave}>
          <div className="modal-body" style={{ maxHeight: '74vh', overflowY: 'auto' }}>
            {/* Basic Info */}
            <div className="responsive-col-2-eq" style={{ gap: '14px', marginBottom: '14px' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 700 }}>
                  {t('Route Code & Name (English)', 'রুটের নাম (ইংরেজি)', lang)} *
                </label>
                <input
                  className="form-input"
                  value={routeName}
                  onChange={e => setRouteName(e.target.value)}
                  placeholder="Route-5: Gazipur ➔ Tongi ➔ Plant"
                  required
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 700 }}>
                  {t('Assign Designated Bus Coach', 'নির্ধারিত বাস ও কোচ নির্বাচন', lang)} *
                </label>
                <select className="form-input" value={busId} onChange={e => setBusId(e.target.value)}>
                  {buses.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.coachNo} ({b.model}) — {b.capacity} Seats
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label className="form-label" style={{ fontWeight: 700 }}>
                {t('Highway / Road Corridor Path Description', 'মহাসড়ক ও সংযোগ সড়ক বিবরণী', lang)} *
              </label>
              <textarea
                className="form-input"
                rows={2}
                value={corridorRoad}
                onChange={e => setCorridorRoad(e.target.value)}
                placeholder="e.g. Mirpur Road ➔ Agargaon Metro ➔ Farmgate ➔ Babubazar Bridge ➔ Keraniganj Complex"
                required
              />
            </div>

            {/* Timings & Crew */}
            <div className="responsive-col-2-eq" style={{ gap: '14px', marginBottom: '16px' }}>
              <div style={{ background: 'var(--brand-slate-50, #F8FAFC)', padding: '12px', borderRadius: '8px', border: '1px solid var(--brand-border)' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#2563EB', textTransform: 'uppercase', marginBottom: '8px' }}>
                  🌅 {t('Morning Inbound Schedule (Home ➔ Plant/HQ)', 'সকালের সময়সূচী (বাসা ➔ অফিস)', lang)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={14} color="#64748B" />
                  <span style={{ fontSize: '12px', color: 'var(--brand-slate-600)' }}>{t('First Pickup Time:', 'প্রথম পিকআপ:', lang)}</span>
                  <input
                    className="form-input"
                    style={{ width: '120px', padding: '4px 8px', fontSize: '12px' }}
                    value={inboundStartTime}
                    onChange={e => setInboundStartTime(e.target.value)}
                    placeholder="06:30 AM"
                  />
                </div>
              </div>

              <div style={{ background: 'var(--brand-slate-50, #F8FAFC)', padding: '12px', borderRadius: '8px', border: '1px solid var(--brand-border)' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#D97706', textTransform: 'uppercase', marginBottom: '8px' }}>
                  🌆 {t('Evening Outbound Schedule (Plant/HQ ➔ Home)', 'সন্ধ্যার সময়সূচী (অফিস ➔ বাসা)', lang)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={14} color="#64748B" />
                  <span style={{ fontSize: '12px', color: 'var(--brand-slate-600)' }}>{t('Plant Departure Time:', 'প্ল্যান্ট থেকে ছাড়ার সময়:', lang)}</span>
                  <input
                    className="form-input"
                    style={{ width: '120px', padding: '4px 8px', fontSize: '12px' }}
                    value={outboundStartTime}
                    onChange={e => setOutboundStartTime(e.target.value)}
                    placeholder="05:15 PM"
                  />
                </div>
              </div>
            </div>

            {/* Crew Contacts */}
            <div className="responsive-col-2-eq" style={{ gap: '14px', marginBottom: '16px' }}>
              <div>
                <label className="form-label">{t('Designated Driver & Phone', 'দায়িত্বপ্রাপ্ত চালক ও ফোন', lang)}</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '6px' }}>
                  <input className="form-input" value={driverName} onChange={e => setDriverName(e.target.value)} placeholder="Driver Name" />
                  <input className="form-input" value={driverPhone} onChange={e => setDriverPhone(e.target.value)} placeholder="+880 17..." />
                </div>
              </div>
              <div>
                <label className="form-label">{t('Conductor & Phone', 'কন্ডাক্টর ও ফোন', lang)}</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '6px' }}>
                  <input className="form-input" value={conductorName} onChange={e => setConductorName(e.target.value)} placeholder="Conductor Name" />
                  <input className="form-input" value={conductorPhone} onChange={e => setConductorPhone(e.target.value)} placeholder="+880 18..." />
                </div>
              </div>
            </div>

            {/* Inbound Morning Stoppages List */}
            <div style={{ border: '1px solid var(--brand-border)', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ fontWeight: 800, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={16} color="#059669" />
                  {t('Morning Inbound Stoppages Timeline (Sequential Order)', 'সকালের ইনবাউন্ড স্টপেজ ক্রমানুসারে তালিকা', lang)}
                  <span className="badge success">{inboundStops.length} {t('Stoppages', 'স্টপেজ', lang)}</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                {inboundStops.map((st, idx) => (
                  <div
                    key={st.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: idx === inboundStops.length - 1 ? '#ECFDF5' : 'var(--brand-card-bg)',
                      border: idx === inboundStops.length - 1 ? '1.5px solid #10B981' : '1px solid var(--brand-border)',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: idx === inboundStops.length - 1 ? '#059669' : '#3B82F6',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '11px'
                      }}>
                        {idx + 1}
                      </span>
                      <div>
                        <strong>{st.name}</strong>
                        {st.landmark && <span style={{ fontSize: '11px', color: 'var(--brand-slate-500)', marginLeft: '6px' }}>({st.landmark})</span>}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <span style={{ fontWeight: 700, color: '#D97706' }}>⏰ {st.scheduledTime}</span>
                      <span style={{ fontSize: '11px', color: 'var(--brand-slate-500)' }}>🛣️ {st.distanceKm}</span>
                      {idx > 0 && idx < inboundStops.length - 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveInboundStop(st.id)}
                          style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer' }}
                          title="Remove stop"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add New Inbound Stoppage Form Strip */}
              <div style={{ background: 'var(--brand-slate-50, #F8FAFC)', padding: '10px 12px', borderRadius: '8px', border: '1px dashed #94A3B8' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-slate-600)', marginBottom: '6px' }}>
                  ➕ {t('Add Intermediate Inbound Stoppage Point:', 'নতুন স্টপেজ পয়েন্ট যুক্ত করুন:', lang)}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1.2fr auto', gap: '8px', alignItems: 'center' }}>
                  <input
                    className="form-input"
                    style={{ fontSize: '12px' }}
                    placeholder="Stoppage Name (e.g. Shahbagh)"
                    value={newStopName}
                    onChange={e => setNewStopName(e.target.value)}
                  />
                  <input
                    className="form-input"
                    style={{ fontSize: '12px' }}
                    placeholder="Time (07:15 AM)"
                    value={newStopTime}
                    onChange={e => setNewStopTime(e.target.value)}
                  />
                  <input
                    className="form-input"
                    style={{ fontSize: '12px' }}
                    placeholder="Distance (12.4 km)"
                    value={newStopDistance}
                    onChange={e => setNewStopDistance(e.target.value)}
                  />
                  <input
                    className="form-input"
                    style={{ fontSize: '12px' }}
                    placeholder="Landmark (Optional)"
                    value={newStopLandmark}
                    onChange={e => setNewStopLandmark(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                    onClick={handleAddInboundStop}
                  >
                    <Plus size={14} /> {t('Add', 'যুক্ত করুন', lang)}
                  </button>
                </div>
              </div>
            </div>

            {/* Outbound Return Summary */}
            <div style={{ border: '1px solid var(--brand-border)', borderRadius: '10px', padding: '14px' }}>
              <div style={{ fontWeight: 800, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <Navigation size={15} color="#D97706" />
                {t('Evening Return Stoppages (Office ➔ Home drop-offs)', 'সন্ধ্যার ফিরতি স্টপেজ (প্ল্যান্ট থেকে বাসায় নামানো)', lang)}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--brand-slate-600)', lineHeight: 1.5 }}>
                {outboundStops.map((st, i) => (
                  <span key={st.id}>
                    <strong>{st.name}</strong> ({st.scheduledTime}){i < outboundStops.length - 1 ? ' ➔ ' : ''}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="modal-ft">
            <button type="button" className="btn-sm-ghost" onClick={onClose}>
              {t('Cancel', 'বাতিল', lang)}
            </button>
            <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle size={15} />
              {t('Save Road Corridor & Stoppages Timetable', 'রোড করিডোর ও সময়সূচী সংরক্ষণ করুন', lang)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
