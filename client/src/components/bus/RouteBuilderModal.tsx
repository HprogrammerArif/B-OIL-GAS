import React, { useState } from 'react';
import { RouteInfo, RouteStop, BusVehicle, shortBusModel } from './busTypes';
import { t } from '../../types';
import { MapPin, Plus, Trash2, Clock } from 'lucide-react';

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
  const [routeName, setRouteName] = useState(existingRoute?.name || '');
  const [routeNameBn, setRouteNameBn] = useState(existingRoute?.nameBn || '');
  const [busId, setBusId] = useState(existingRoute?.busId || buses[0]?.id || '');
  const [corridorRoad, setCorridorRoad] = useState(existingRoute?.corridorRoad || '');
  const [driverName, setDriverName] = useState(existingRoute?.driverName || '');
  const [driverPhone, setDriverPhone] = useState(existingRoute?.driverPhone || '');
  const [conductorName, setConductorName] = useState(existingRoute?.conductorName || '');
  const [conductorPhone, setConductorPhone] = useState(existingRoute?.conductorPhone || '');
  const [inboundStartTime, setInboundStartTime] = useState(existingRoute?.inboundStartTime || '06:30 AM');
  const [outboundStartTime, setOutboundStartTime] = useState(existingRoute?.outboundStartTime || '05:15 PM');
  const [activeDirectionTab, setActiveDirectionTab] = useState<'inbound' | 'outbound'>('inbound');
  const [inboundStops, setInboundStops] = useState<RouteStop[]>(existingRoute?.inboundStops || []);
  const [outboundStops, setOutboundStops] = useState<RouteStop[]>(existingRoute?.outboundStops || []);
  const [newStopName, setNewStopName] = useState('');
  const [newStopTime, setNewStopTime] = useState('07:10 AM');
  const [newStopDistance, setNewStopDistance] = useState('');
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
      passengers: 0,
      status: 'upcoming',
      distanceKm: newStopDistance.trim() || '0 km',
      landmark: newStopLandmark.trim(),
    };
    const insert = (list: RouteStop[]) => {
      const updated = [...list];
      if (updated.length > 0) updated.splice(updated.length - 1, 0, newStop);
      else updated.push(newStop);
      return updated;
    };
    if (activeDirectionTab === 'inbound') setInboundStops(insert(inboundStops));
    else setOutboundStops(insert(outboundStops));
    setNewStopName('');
    setNewStopLandmark('');
  };

  const handleRemoveStop = (id: string) => {
    if (activeDirectionTab === 'inbound') {
      if (inboundStops.length <= 2) return;
      setInboundStops(inboundStops.filter((stop) => stop.id !== id));
    } else {
      if (outboundStops.length <= 2) return;
      setOutboundStops(outboundStops.filter((stop) => stop.id !== id));
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedBus = buses.find((bus) => bus.id === busId) || buses[0];
    const routeId = existingRoute?.id || `route-${Date.now().toString().slice(-4)}`;
    const compiledRoute: RouteInfo = {
      id: routeId,
      name: routeName.trim(),
      nameBn: routeNameBn.trim() || routeName.trim(),
      coachNo: selectedBus?.coachNo || '',
      busId: selectedBus?.id || '',
      model: selectedBus?.model || '',
      corridorRoad: corridorRoad.trim(),
      driverName: driverName.trim(),
      driverPhone: driverPhone.trim(),
      conductorName: conductorName.trim(),
      conductorPhone: conductorPhone.trim(),
      speed: existingRoute?.speed || '42 km/h',
      nextStop: inboundStops[0]?.name || '',
      nextEta: existingRoute?.nextEta || '',
      progressPercent: existingRoute?.progressPercent || 0,
      capacity: selectedBus?.capacity || existingRoute?.capacity || 52,
      inboundStops,
      outboundStops,
      inboundStartTime,
      outboundStartTime,
    };
    onSaveRoute(compiledRoute);
    onClose();
  };

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal shuttle-dialog wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-hd">
          <div>
            <h3>
              <MapPin size={18} />
              {t('Edit route and stops', 'রুট ও স্টপ বদলান', lang)}
            </h3>
            <p className="shuttle-sub">
              {t(
                'Changes the road, the times, and the stops on this route.',
                'এই রুটের রাস্তা, সময় এবং স্টপ বদলায়।',
                lang,
              )}
            </p>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label={t('Close', 'বন্ধ করুন', lang)}>×</button>
        </div>

        <form id="shuttle-edit-route" className="modal-body" onSubmit={handleSave}>
          <div className="shuttle-stack">
            <div>
              <label>{t('Route name', 'রুটের নাম', lang)}</label>
              <input className="form-input" value={routeName} onChange={(e) => setRouteName(e.target.value)} required autoComplete="off" />
            </div>
            <div>
              <label>{t('Route name in Bangla', 'রুটের নাম বাংলায়', lang)}</label>
              <input className="form-input" value={routeNameBn} onChange={(e) => setRouteNameBn(e.target.value)} autoComplete="off" />
            </div>
            <div>
              <label>{t('Bus', 'বাস', lang)}</label>
              <select className="form-input" value={busId} onChange={(e) => setBusId(e.target.value)}>
                {buses.map((bus) => (
                  <option key={bus.id} value={bus.id}>
                    {bus.coachNo} · {shortBusModel(bus.model)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>{t('Road', 'রাস্তা', lang)}</label>
              <input className="form-input" value={corridorRoad} onChange={(e) => setCorridorRoad(e.target.value)} required autoComplete="off" />
            </div>

            <div className="shuttle-grid">
              <div>
                <label>{t('Morning departure', 'সকালের রওনা', lang)}</label>
                <input className="form-input" value={inboundStartTime} onChange={(e) => setInboundStartTime(e.target.value)} />
              </div>
              <div>
                <label>{t('Evening departure', 'সন্ধ্যার রওনা', lang)}</label>
                <input className="form-input" value={outboundStartTime} onChange={(e) => setOutboundStartTime(e.target.value)} />
              </div>
              <div>
                <label>{t('Driver', 'চালক', lang)}</label>
                <input className="form-input" value={driverName} onChange={(e) => setDriverName(e.target.value)} autoComplete="off" />
              </div>
              <div>
                <label>{t('Driver mobile', 'চালকের মোবাইল', lang)}</label>
                <input className="form-input" value={driverPhone} onChange={(e) => setDriverPhone(e.target.value)} autoComplete="off" />
              </div>
              <div>
                <label>{t('Conductor', 'কন্ডাক্টর', lang)}</label>
                <input className="form-input" value={conductorName} onChange={(e) => setConductorName(e.target.value)} autoComplete="off" />
              </div>
              <div>
                <label>{t('Conductor mobile', 'কন্ডাক্টরের মোবাইল', lang)}</label>
                <input className="form-input" value={conductorPhone} onChange={(e) => setConductorPhone(e.target.value)} autoComplete="off" />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <strong>{t('Stops', 'স্টপ', lang)}</strong>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button type="button" className="btn-outline" aria-pressed={activeDirectionTab === 'inbound'} onClick={() => setActiveDirectionTab('inbound')}>
                    {t('Morning', 'সকাল', lang)} ({inboundStops.length})
                  </button>
                  <button type="button" className="btn-outline" aria-pressed={activeDirectionTab === 'outbound'} onClick={() => setActiveDirectionTab('outbound')}>
                    {t('Evening', 'সন্ধ্যা', lang)} ({outboundStops.length})
                  </button>
                </div>
              </div>
              <div className="shuttle-stack">
                {currentStops.map((stop, index) => {
                  const isEnd = index === 0 || index === currentStops.length - 1;
                  return (
                    <div key={stop.id} className="shuttle-stop">
                      <div style={{ minWidth: 0 }}>
                        <strong>{index + 1}. {stop.name}</strong>
                        <span style={{ display: 'block', fontSize: 12, color: 'var(--text-3)' }}>
                          <Clock size={11} style={{ verticalAlign: 'middle' }} /> {stop.scheduledTime}
                          {stop.landmark ? ` · ${stop.landmark}` : ''}
                        </span>
                      </div>
                      {!isEnd && (
                        <button type="button" className="btn-outline" onClick={() => handleRemoveStop(stop.id)} aria-label={t('Remove stop', 'স্টপ সরান', lang)}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="shuttle-grid" style={{ marginTop: 10 }}>
                <div>
                  <label>{t('New stop', 'নতুন স্টপ', lang)}</label>
                  <input className="form-input" value={newStopName} onChange={(e) => setNewStopName(e.target.value)} autoComplete="off" />
                </div>
                <div>
                  <label>{t('Time', 'সময়', lang)}</label>
                  <input className="form-input" value={newStopTime} onChange={(e) => setNewStopTime(e.target.value)} />
                </div>
                <div>
                  <label>{t('Distance', 'দূরত্ব', lang)}</label>
                  <input className="form-input" value={newStopDistance} onChange={(e) => setNewStopDistance(e.target.value)} placeholder="14 km" />
                </div>
                <div>
                  <label>{t('Landmark', 'চেনার জায়গা', lang)}</label>
                  <input className="form-input" value={newStopLandmark} onChange={(e) => setNewStopLandmark(e.target.value)} autoComplete="off" />
                </div>
              </div>
              <button type="button" className="btn-outline" style={{ marginTop: 8 }} onClick={handleAddStop}>
                <Plus size={14} /> {t('Add stop', 'স্টপ যোগ করুন', lang)}
              </button>
            </div>
          </div>
        </form>

        <div className="modal-ft">
          <button type="button" className="btn-outline" onClick={onClose}>{t('Cancel', 'বাতিল', lang)}</button>
          <button type="submit" form="shuttle-edit-route" className="btn-primary">{t('Save route', 'রুট সেভ করুন', lang)}</button>
        </div>
      </div>
    </div>
  );
}
