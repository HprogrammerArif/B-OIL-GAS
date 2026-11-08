import React, { useState } from 'react';
import { BusVehicle, RouteInfo } from './busTypes';
import { t } from '../../types';
import { nextRef } from '../../lib/refs';
import { Bus } from 'lucide-react';

interface RegisterBusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister: (bus: BusVehicle) => void;
  routes: Record<string, RouteInfo>;
  lang: 'en' | 'bn';
}

const BUS_MODELS: { label: string; seats: number; ac: BusVehicle['acType'] }[] = [
  { label: 'Hino RM2 Luxury AC', seats: 52, ac: 'Luxury AC' },
  { label: 'Scania Touring HD', seats: 52, ac: 'Luxury AC' },
  { label: 'Hyundai Universe Express', seats: 52, ac: 'Luxury AC' },
  { label: 'Volvo B11R', seats: 52, ac: 'Luxury AC' },
  { label: 'Ashok Leyland Falcon', seats: 52, ac: 'Standard AC' },
  { label: 'Isuzu LT434', seats: 52, ac: 'Standard AC' },
  { label: 'Mitsubishi Fuso', seats: 40, ac: 'Standard AC' },
  { label: 'Mercedes-Benz Tourismo', seats: 32, ac: 'Executive AC' },
];

const SEAT_CHOICES = [
  { seats: 52, en: '52 seats', bn: '৫২ আসন' },
  { seats: 40, en: '40 seats', bn: '৪০ আসন' },
  { seats: 32, en: '32 seats', bn: '৩২ আসন' },
];

export default function RegisterBusModal({
  isOpen,
  onClose,
  onRegister,
  routes,
  lang,
}: RegisterBusModalProps) {
  const [coachNo, setCoachNo] = useState('');
  const [model, setModel] = useState(BUS_MODELS[0].label);
  const [capacity, setCapacity] = useState(52);
  const [assignedRouteId, setAssignedRouteId] = useState(Object.keys(routes)[0] || 'route-1');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [conductorName, setConductorName] = useState('');
  const [conductorPhone, setConductorPhone] = useState('');
  const [acType, setAcType] = useState<BusVehicle['acType']>('Luxury AC');
  const [fitnessExpiry, setFitnessExpiry] = useState('2028-12-31');

  if (!isOpen) return null;

  const pickModel = (label: string) => {
    const found = BUS_MODELS.find((item) => item.label === label) ?? BUS_MODELS[0];
    setModel(found.label);
    setCapacity(found.seats);
    setAcType(found.ac);
  };

  const pickSeats = (seats: number) => {
    setCapacity(seats);
    const found = BUS_MODELS.find((item) => item.label === model);
    if (!found || found.seats !== seats) {
      const next = BUS_MODELS.find((item) => item.seats === seats) ?? BUS_MODELS[0];
      setModel(next.label);
      setAcType(next.ac);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetRoute = routes[assignedRouteId];
    const plate = coachNo.trim();
    const newBus: BusVehicle = {
      id: `bus-${Date.now().toString().slice(-4)}`,
      coachNo: plate,
      model: `${model} (${capacity}-Seater)`,
      capacity,
      assignedRouteId,
      assignedRoadName: targetRoute ? (targetRoute.name.split(':')[1]?.trim() || targetRoute.name) : '',
      plateNo: plate,
      driverName: driverName.trim(),
      driverPhone: driverPhone.trim(),
      conductorName: conductorName.trim(),
      conductorPhone: conductorPhone.trim(),
      status: 'active',
      fuelLevel: '95%',
      fitnessExpiry,
      acType,
      gpsTrackerId: nextRef('GPS', 3),
    };
    onRegister(newBus);
    onClose();
  };

  const selectedRoute = routes[assignedRouteId];

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal shuttle-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-hd">
          <div>
            <h3>
              <Bus size={18} />
              {t('Add a bus', 'একটি বাস যোগ করুন', lang)}
            </h3>
            <p className="shuttle-sub">
              {t(
                'This coach joins the fleet and runs the route you pick.',
                'এই বাস বহরে যোগ হবে এবং আপনি যে রুট বাছবেন সেটি চালাবে।',
                lang,
              )}
            </p>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label={t('Close', 'বন্ধ করুন', lang)}>×</button>
        </div>

        <form id="shuttle-add-bus" className="modal-body" onSubmit={handleSubmit}>
          <div className="shuttle-stack">
            <div className="shuttle-grid">
              <div>
                <label>{t('Registration number', 'রেজিস্ট্রেশন নম্বর', lang)}</label>
                <input
                  className="form-input"
                  value={coachNo}
                  onChange={(e) => setCoachNo(e.target.value)}
                  placeholder="DHAKA METRO-BA 21-0000"
                  autoComplete="off"
                  required
                />
              </div>
              <div>
                <label>{t('Model', 'মডেল', lang)}</label>
                <select className="form-input" value={model} onChange={(e) => pickModel(e.target.value)}>
                  {BUS_MODELS.map((item) => (
                    <option key={item.label} value={item.label}>{item.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label>{t('Seats', 'আসন', lang)}</label>
              <div className="shuttle-choice">
                {SEAT_CHOICES.map((choice) => (
                  <button
                    key={choice.seats}
                    type="button"
                    aria-pressed={capacity === choice.seats}
                    onClick={() => pickSeats(choice.seats)}
                  >
                    <strong>{t(choice.en, choice.bn, lang)}</strong>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label>{t('Air conditioning', 'শীতাতপ', lang)}</label>
              <select
                className="form-input"
                value={acType}
                onChange={(e) => setAcType(e.target.value as BusVehicle['acType'])}
              >
                <option value="Luxury AC">{t('Luxury AC', 'লাক্সারি এসি', lang)}</option>
                <option value="Executive AC">{t('Executive AC', 'এক্সিকিউটিভ এসি', lang)}</option>
                <option value="Standard AC">{t('Standard AC', 'স্ট্যান্ডার্ড এসি', lang)}</option>
              </select>
            </div>

            <div>
              <label>{t('Route', 'রুট', lang)}</label>
              <select
                className="form-input"
                value={assignedRouteId}
                onChange={(e) => setAssignedRouteId(e.target.value)}
              >
                {Object.values(routes).map((route) => (
                  <option key={route.id} value={route.id}>{route.name}</option>
                ))}
              </select>
              {selectedRoute && (
                <p className="shuttle-sub">
                  {selectedRoute.corridorRoad}
                  {' · '}
                  {t('Morning', 'সকাল', lang)} {selectedRoute.inboundStartTime}
                  {' · '}
                  {t('Evening', 'সন্ধ্যা', lang)} {selectedRoute.outboundStartTime}
                </p>
              )}
            </div>

            <div className="shuttle-grid">
              <div>
                <label>{t('Driver', 'চালক', lang)}</label>
                <input className="form-input" value={driverName} onChange={(e) => setDriverName(e.target.value)} required autoComplete="off" />
              </div>
              <div>
                <label>{t('Driver mobile', 'চালকের মোবাইল', lang)}</label>
                <input className="form-input" value={driverPhone} onChange={(e) => setDriverPhone(e.target.value)} placeholder="+880 17" required autoComplete="off" />
              </div>
              <div>
                <label>{t('Conductor', 'কন্ডাক্টর', lang)}</label>
                <input className="form-input" value={conductorName} onChange={(e) => setConductorName(e.target.value)} required autoComplete="off" />
              </div>
              <div>
                <label>{t('Conductor mobile', 'কন্ডাক্টরের মোবাইল', lang)}</label>
                <input className="form-input" value={conductorPhone} onChange={(e) => setConductorPhone(e.target.value)} placeholder="+880 18" required autoComplete="off" />
              </div>
            </div>

            <div>
              <label>{t('Fitness expires', 'ফিটনেস মেয়াদ', lang)}</label>
              <input type="date" className="form-input" value={fitnessExpiry} onChange={(e) => setFitnessExpiry(e.target.value)} />
            </div>
          </div>
        </form>

        <div className="modal-ft">
          <button type="button" className="btn-outline" onClick={onClose}>{t('Cancel', 'বাতিল', lang)}</button>
          <button type="submit" form="shuttle-add-bus" className="btn-primary">{t('Add this bus', 'এই বাস যোগ করুন', lang)}</button>
        </div>
      </div>
    </div>
  );
}
