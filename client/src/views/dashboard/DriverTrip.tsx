import { useState, type FormEvent } from 'react';
import { Flag, MapPin, Navigation, Phone, Play, Receipt, Check } from 'lucide-react';
import { t, type Lang } from '../../types';
import { Button, EmptyState, FormField, Modal, StatusPill } from '../../components/ui';
import type { Vehicle, VehicleRequisition } from '../../store/fleetStore';

interface DriverTripProps {
  lang: Lang;
  mission: VehicleRequisition | null;
  vehicle: Vehicle | undefined;
  onStart: () => void;
  onComplete: () => void;
  onNotify: () => void;
  onCall: () => void;
  onToll: () => void;
}

/** The driver's current trip: where, who, what to do next. */
export default function DriverTrip({ lang, mission, vehicle, onStart, onComplete, onNotify, onCall, onToll }: DriverTripProps) {
  if (!mission) {
    return (
      <div className="tab-pane-fade">
        <EmptyState
          icon={<Navigation size={22} />}
          title={t('No trip right now', 'এখন কোনো ট্রিপ নেই', lang)}
          description={t('You are on standby at the transport pool. The transport desk will tell you when a trip is assigned.', 'আপনি পরিবহন পুলে স্ট্যান্ডবাই আছেন। ট্রিপ বরাদ্দ হলে পরিবহন ডেস্ক জানাবে।', lang)}
        />
      </div>
    );
  }

  const onRoad = mission.status === 'in_transit';
  const done = mission.status === 'completed';
  const plate = mission.assignedVehiclePlate || vehicle?.plate;
  const model = mission.assignedVehicleModel || vehicle?.model;
  const steps: Array<{ label: readonly [string, string]; state: 'done' | 'now' | 'todo' }> = [
    { label: ['Assigned to you', 'আপনাকে বরাদ্দ'], state: 'done' },
    { label: ['On the road', 'যাত্রাপথে'], state: done ? 'done' : onRoad ? 'now' : 'todo' },
    { label: ['Back at the bay', 'শেডে ফেরত'], state: done ? 'done' : 'todo' },
  ];

  return (
    <section className="tab-pane-fade dt-card" aria-labelledby="dt-title">
      <header className="dt-head">
        <div>
          <h3 id="dt-title">{mission.from.split(',')[0]} → {mission.to.split(',')[0]}</h3>
          <p>{mission.purpose}</p>
        </div>
        <StatusPill tone={onRoad ? 'success' : 'gold'}>
          {onRoad ? t('On the road', 'যাত্রাপথে', lang) : t('Ready to depart', 'যাত্রার জন্য প্রস্তুত', lang)}
        </StatusPill>
      </header>

      <ol className="dt-steps" aria-label={t('Trip progress', 'ট্রিপের অগ্রগতি', lang)}>
        {steps.map((s, i) => (
          <li key={s.label[0]} className={`is-${s.state}`}>
            <span>{s.state === 'done' ? <Check size={13} /> : i + 1}</span>
            {t(s.label[0], s.label[1], lang)}
          </li>
        ))}
      </ol>

      <dl className="dt-facts">
        <div><dt>{t('Passenger', 'যাত্রী', lang)}</dt><dd><strong>{mission.requesterName}</strong><small>{mission.dept}</small></dd></div>
        <div><dt>{t('Vehicle', 'গাড়ি', lang)}</dt><dd><strong className="mono">{plate}</strong><small>{model}</small></dd></div>
        <div><dt>{t('Departs', 'ছাড়বে', lang)}</dt><dd><strong>{mission.departureTime}</strong>{mission.tripPassNo && <small>{t('Pass', 'পাস', lang)} {mission.tripPassNo}</small>}</dd></div>
      </dl>

      <p className="dt-next" role="status">
        {onRoad
          ? t('Press "Complete trip" when you are back at the bay and have the meter reading.', 'শেডে ফিরে মিটার রিডিংসহ "ট্রিপ সমাপ্ত" চাপুন।', lang)
          : t('Press "Start trip" when you leave the gate. You will enter the meter reading.', 'গেট ছাড়ার সময় "ট্রিপ শুরু" চাপুন। মিটার রিডিং দিতে হবে।', lang)}
      </p>

      <div className="dt-actions">
        {!onRoad ? (
          <Button variant="primary" icon={<Play size={15} />} onClick={onStart}>{t('Start trip', 'ট্রিপ শুরু', lang)}</Button>
        ) : (
          <Button variant="primary" icon={<Flag size={15} />} onClick={onComplete}>{t('Complete trip', 'ট্রিপ সমাপ্ত', lang)}</Button>
        )}
        <Button variant="secondary" icon={<MapPin size={14} />} onClick={onNotify}>{t('Tell passenger I have arrived', 'যাত্রীকে জানান পৌঁছেছি', lang)}</Button>
        <Button variant="secondary" icon={<Phone size={14} />} onClick={onCall}>{t('Call passenger', 'যাত্রীকে কল', lang)}</Button>
        <Button variant="secondary" icon={<Receipt size={14} />} onClick={onToll}>{t('Add toll slip', 'টোল স্লিপ', lang)}</Button>
      </div>
    </section>
  );
}

/* ── Meter reading dialog (start and end of trip) ─────────────────────────── */

interface MeterModalProps {
  lang: Lang;
  mode: 'start' | 'complete';
  /** Reading to start from: last known reading, or the trip's start reading when completing. */
  floor: number | null;
  onClose: () => void;
  onConfirm: (km: number) => void;
}

export function MeterModal({ lang, mode, floor, onClose, onConfirm }: MeterModalProps) {
  const [value, setValue] = useState(mode === 'start' && floor ? String(floor) : '');
  const [tried, setTried] = useState(false);
  const km = Number(value);
  const valid = value.trim() !== '' && Number.isFinite(km) && km > 0 && (floor === null || km >= floor);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (valid) onConfirm(km);
  };

  const error = tried && !valid
    ? floor !== null && km < floor
      ? t(`Must be at least ${floor.toLocaleString('en-IN')} km.`, `কমপক্ষে ${floor.toLocaleString('en-IN')} কিমি হতে হবে।`, lang)
      : t('Enter the meter reading in km.', 'মিটার রিডিং (কিমি) লিখুন।', lang)
    : undefined;

  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      icon={mode === 'start' ? <Play size={15} /> : <Flag size={15} />}
      title={mode === 'start' ? t('Start trip', 'ট্রিপ শুরু', lang) : t('Complete trip', 'ট্রিপ সমাপ্ত', lang)}
      footer={(
        <>
          <Button variant="ghost" onClick={onClose}>{t('Cancel', 'বাতিল', lang)}</Button>
          <Button type="submit" form="dt-meter-form">{mode === 'start' ? t('Start', 'শুরু করুন', lang) : t('Complete', 'সমাপ্ত করুন', lang)}</Button>
        </>
      )}
    >
      <form id="dt-meter-form" onSubmit={submit} noValidate>
        <FormField
          label={mode === 'start' ? t('Meter reading now (km)', 'এখনকার মিটার রিডিং (কিমি)', lang) : t('Meter reading at the bay (km)', 'শেডে মিটার রিডিং (কিমি)', lang)}
          required
          error={error}
          hint={floor !== null && !error ? (mode === 'start' ? t(`Last recorded: ${floor.toLocaleString('en-IN')} km`, `সর্বশেষ রেকর্ড: ${floor.toLocaleString('en-IN')} কিমি`, lang) : t(`Trip started at ${floor.toLocaleString('en-IN')} km`, `ট্রিপ শুরু ${floor.toLocaleString('en-IN')} কিমিতে`, lang)) : undefined}
        >
          {(id) => <input id={id} type="number" inputMode="numeric" className="form-input" value={value} onChange={(e) => setValue(e.target.value)} autoFocus />}
        </FormField>
      </form>
    </Modal>
  );
}
