import { useEffect, useMemo, useState } from 'react';
import type { VehicleRequisition, Vehicle, Driver } from '../../store/fleetStore';
import { t, type Lang } from '../../types';
import { AlertTriangle, Car, Check, CheckCircle2, MapPin, UserRound, XCircle } from 'lucide-react';
import { daysUntil } from '../../lib/clock';
import { Button, FormField, Modal } from '../ui';

interface AssignVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  requisition: VehicleRequisition | null;
  vehicles: Vehicle[];
  drivers: Driver[];
  onConfirm: (reqId: string, vehiclePlate: string, driverId: string, dispatchNotes?: string) => void;
  lang: Lang;
}

type Tone = 'ok' | 'warn' | 'bad';
interface Check {
  tone: Tone;
  text: string;
}

const TYPE_LABEL: Record<Vehicle['type'], [string, string]> = {
  executive: ['car', 'গাড়ি'],
  microbus: ['microbus', 'মাইক্রোবাস'],
  tanker: ['tanker', 'ট্যাংকার'],
  pickup: ['pickup', 'পিকআপ'],
};

/** Vehicle type the requester asked for. */
const REQUESTED_TYPE: Record<VehicleRequisition['requiredCapacity'], Vehicle['type']> = {
  sedan_4: 'executive',
  microbus_7: 'microbus',
  pickup_4x4: 'pickup',
  tanker_heavy: 'tanker',
};

/** Licence classes that may drive each vehicle type. */
const LICENCE_FOR: Record<Vehicle['type'], Driver['licenseType'][]> = {
  executive: ['Light Commercial', 'Heavy Commercial (HAZMAT)'],
  pickup: ['Light Commercial', 'Heavy Commercial (HAZMAT)'],
  microbus: ['PSV Microbus'],
  tanker: ['Heavy Commercial (HAZMAT)'],
};

const LICENCE_LABEL: Record<Driver['licenseType'], [string, string]> = {
  'Light Commercial': ['Light Commercial', 'লাইট কমার্শিয়াল'],
  'PSV Microbus': ['PSV Microbus', 'পিএসভি মাইক্রোবাস'],
  'Heavy Commercial (HAZMAT)': ['Heavy Commercial (HAZMAT)', 'হেভি কমার্শিয়াল (হ্যাজম্যাট)'],
};

const worst = (checks: Check[]): Tone => (checks.some((c) => c.tone === 'bad') ? 'bad' : checks.some((c) => c.tone === 'warn') ? 'warn' : 'ok');

/** Dispatch dialog: pick a vehicle and driver that really fit the trip. Unsuitable ones are shown with the reason and cannot be chosen. */
export default function AssignVehicleModal({
  isOpen,
  onClose,
  requisition,
  vehicles,
  drivers,
  onConfirm,
  lang,
}: AssignVehicleModalProps) {
  const [plate, setPlate] = useState('');
  const [driverId, setDriverId] = useState('');
  const [notes, setNotes] = useState('');

  const bn = (n: number) => (lang === 'bn' ? n.toLocaleString('bn-BD') : String(n));
  const typeName = (type: Vehicle['type']) => t(...TYPE_LABEL[type], lang);
  const people = (n: number) => t(`${n} ${n === 1 ? 'person' : 'people'}`, `${bn(n)} জন`, lang);

  const readyVehicles = useMemo(() => vehicles.filter((v) => v.status === 'available'), [vehicles]);
  const readyDrivers = useMemo(() => drivers.filter((d) => d.status === 'available'), [drivers]);

  const vehicleChecks = (v: Vehicle): Check[] => {
    if (!requisition) return [];
    const out: Check[] = [];
    const need = requisition.passengersCount;
    out.push(
      v.capacitySeats >= need
        ? { tone: 'ok', text: t(`${v.capacitySeats} seats for ${people(need)}`, `${bn(need)} জনের জন্য ${bn(v.capacitySeats)}টি আসন`, lang) }
        : { tone: 'bad', text: t(`Only ${v.capacitySeats} seats, but ${people(need)} are travelling`, `মাত্র ${bn(v.capacitySeats)}টি আসন, কিন্তু যাচ্ছেন ${bn(need)} জন`, lang) },
    );
    const asked = REQUESTED_TYPE[requisition.requiredCapacity];
    if (v.type !== asked) {
      out.push({ tone: 'warn', text: t(`A ${typeName(asked)} was requested; this is a ${typeName(v.type)}`, `${typeName(asked)} চাওয়া হয়েছিল; এটি ${typeName(v.type)}`, lang) });
    }
    if (v.type === 'tanker' && !v.hazmatCertified) {
      out.push({ tone: 'bad', text: t('This tanker is not certified for hazardous cargo', 'এই ট্যাংকার বিপজ্জনক মালের জন্য সনদপ্রাপ্ত নয়', lang) });
    }
    if (v.fuelPct < 25) {
      out.push({ tone: 'warn', text: t(`Fuel is low (${v.fuelPct}%)`, `জ্বালানি কম (${bn(v.fuelPct)}%)`, lang) });
    }
    return out;
  };

  const driverChecks = (d: Driver, v: Vehicle | undefined): Check[] => {
    const out: Check[] = [];
    if (v) {
      const ok = LICENCE_FOR[v.type].includes(d.licenseType);
      out.push(
        ok
          ? { tone: 'ok', text: t(`Licence (${t(...LICENCE_LABEL[d.licenseType], 'en')}) covers a ${typeName(v.type)}`, `লাইসেন্স (${t(...LICENCE_LABEL[d.licenseType], 'bn')}) দিয়ে ${typeName(v.type)} চালানো যায়`, lang) }
          : {
            tone: 'bad',
            text: t(
              `Licence is ${t(...LICENCE_LABEL[d.licenseType], 'en')}; a ${typeName(v.type)} needs ${LICENCE_FOR[v.type].map((l) => t(...LICENCE_LABEL[l], 'en')).join(' or ')}`,
              `লাইসেন্স ${t(...LICENCE_LABEL[d.licenseType], 'bn')}; ${typeName(v.type)} চালাতে লাগে ${LICENCE_FOR[v.type].map((l) => t(...LICENCE_LABEL[l], 'bn')).join(' বা ')}`,
              lang,
            ),
          },
      );
    }
    const left = daysUntil(d.licenseExpiry);
    if (Number.isFinite(left)) {
      if (left < 0) out.push({ tone: 'bad', text: t(`Licence expired on ${d.licenseExpiry}`, `লাইসেন্সের মেয়াদ শেষ হয়েছে ${d.licenseExpiry}`, lang) });
      else if (left <= 30) out.push({ tone: 'warn', text: t(`Licence expires in ${left} days (${d.licenseExpiry})`, `লাইসেন্সের মেয়াদ ${bn(left)} দিনে শেষ (${d.licenseExpiry})`, lang) });
    }
    if (d.breathalyzerToday === 'FAILED') out.push({ tone: 'bad', text: t('Failed today\'s alcohol test', 'আজকের অ্যালকোহল পরীক্ষায় অকৃতকার্য', lang) });
    else if (d.breathalyzerToday === 'PENDING') out.push({ tone: 'warn', text: t('Today\'s alcohol test is not done yet', 'আজকের অ্যালকোহল পরীক্ষা এখনও হয়নি', lang) });
    else out.push({ tone: 'ok', text: t('Passed today\'s alcohol test', 'আজকের অ্যালকোহল পরীক্ষায় উত্তীর্ণ', lang) });
    if (d.dutyHoursToday >= 10) out.push({ tone: 'warn', text: t(`Already on duty ${d.dutyHoursToday} hours today`, `আজ ইতিমধ্যে ${bn(d.dutyHoursToday)} ঘণ্টা ডিউটি করেছেন`, lang) });
    return out;
  };

  const vehicleRows = useMemo(
    () => readyVehicles.map((v) => ({ v, checks: vehicleChecks(v) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [readyVehicles, requisition, lang],
  );
  const selectedVehicle = readyVehicles.find((v) => v.plate === plate);
  const driverRows = useMemo(
    () => readyDrivers.map((d) => ({ d, checks: driverChecks(d, selectedVehicle) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [readyDrivers, selectedVehicle, lang],
  );

  const firstGoodVehicle = vehicleRows.find((r) => worst(r.checks) !== 'bad')?.v.plate ?? '';
  const firstGoodDriver = driverRows.find((r) => worst(r.checks) !== 'bad')?.d.id ?? '';

  // Start each request on the best fit; move off a choice that stops fitting.
  useEffect(() => {
    if (!isOpen) return;
    setNotes('');
    setPlate(firstGoodVehicle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, requisition?.id]);

  useEffect(() => {
    if (!isOpen) return;
    const current = vehicleRows.find((r) => r.v.plate === plate);
    if (!current || worst(current.checks) === 'bad') setPlate(firstGoodVehicle);
  }, [isOpen, vehicleRows, plate, firstGoodVehicle]);

  useEffect(() => {
    if (!isOpen) return;
    const current = driverRows.find((r) => r.d.id === driverId);
    if (!current || worst(current.checks) === 'bad') setDriverId(firstGoodDriver);
  }, [isOpen, driverRows, driverId, firstGoodDriver]);

  if (!requisition) return null;

  const vehicleRow = vehicleRows.find((r) => r.v.plate === plate);
  const driverRow = driverRows.find((r) => r.d.id === driverId);
  const canConfirm = !!vehicleRow && !!driverRow && worst(vehicleRow.checks) !== 'bad' && worst(driverRow.checks) !== 'bad';
  const nothingFits = vehicleRows.length > 0 && !firstGoodVehicle;

  const confirm = () => {
    if (!canConfirm) return;
    onConfirm(requisition.id, plate, driverId, notes.trim() || undefined);
    onClose();
  };

  const reasonOf = (checks: Check[]) => checks.find((c) => c.tone === 'bad')?.text;
  const icon = (tone: Tone) => (tone === 'ok' ? <CheckCircle2 size={13} /> : tone === 'warn' ? <AlertTriangle size={13} /> : <XCircle size={13} />);
  const renderChecks = (checks: Check[]) => (
    <ul className="asg-checks">
      {checks.map((c, i) => (
        <li key={i} className={c.tone}>{icon(c.tone)} <span>{c.text}</span></li>
      ))}
    </ul>
  );

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={t('Assign a vehicle and driver', 'গাড়ি ও চালক বরাদ্দ করুন', lang)}
      icon={<Car size={16} />}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>{t('Cancel', 'বাতিল', lang)}</Button>
          <Button icon={<Check size={15} />} disabled={!canConfirm} onClick={confirm}>
            {t('Assign and create trip pass', 'বরাদ্দ করুন ও ট্রিপ পাস তৈরি করুন', lang)}
          </Button>
        </>
      }
    >
      <div className="asg-trip">
        <strong><MapPin size={14} /> {requisition.from.split(',')[0]} → {requisition.to.split(',')[0]}</strong>
        <span>
          {t(
            `${requisition.requesterName} (${requisition.dept}) needs a ${typeName(REQUESTED_TYPE[requisition.requiredCapacity])} for ${people(requisition.passengersCount)}, leaving ${requisition.departureTime}${requisition.tripType === 'round_trip' ? ', round trip' : ', one way'}.`,
            `${requisition.requesterName} (${requisition.dept})-এর ${typeName(REQUESTED_TYPE[requisition.requiredCapacity])} দরকার, ${bn(requisition.passengersCount)} জনের জন্য, ছাড়বে ${requisition.departureTime}, ${requisition.tripType === 'round_trip' ? 'যাওয়া-আসা' : 'একমুখী'}।`,
            lang,
          )}
        </span>
        {requisition.purpose && <em>“{requisition.purpose}”</em>}
      </div>

      <FormField label={t('Vehicle', 'গাড়ি', lang)} required hint={t('Only vehicles that are free now are listed.', 'শুধু এখন খালি গাড়ি দেখানো হচ্ছে।', lang)}>
        {(id) =>
          vehicleRows.length === 0 ? (
            <p className="asg-empty"><AlertTriangle size={14} /> {t('No vehicle is free right now. All are on the road or in the workshop.', 'এখন কোনো গাড়ি খালি নেই। সবগুলো সড়কে অথবা ওয়ার্কশপে।', lang)}</p>
          ) : (
            <>
              <select id={id} value={plate} onChange={(e) => setPlate(e.target.value)}>
                {vehicleRows.map(({ v, checks }) => (
                  <option key={v.id} value={v.plate} disabled={worst(checks) === 'bad'}>
                    {v.plate} · {v.model} · {t(`${v.capacitySeats} seats`, `${bn(v.capacitySeats)}টি আসন`, lang)}
                    {worst(checks) === 'bad' ? ` — ${reasonOf(checks)}` : ''}
                  </option>
                ))}
              </select>
              {nothingFits && (
                <p className="asg-empty"><XCircle size={14} /> {t('None of the free vehicles fit this trip. Open the list to see why, or wait for one to return.', 'খালি কোনো গাড়িই এই ট্রিপের উপযোগী নয়। কারণ দেখতে তালিকা খুলুন, অথবা কোনোটি ফেরার অপেক্ষা করুন।', lang)}</p>
              )}
              {vehicleRow && renderChecks(vehicleRow.checks)}
            </>
          )
        }
      </FormField>

      <FormField label={t('Driver', 'চালক', lang)} required hint={t('Only drivers who are free now are listed. The licence is checked against the chosen vehicle.', 'শুধু এখন খালি চালক দেখানো হচ্ছে। নির্বাচিত গাড়ির সঙ্গে লাইসেন্স মিলিয়ে দেখা হয়।', lang)}>
        {(id) =>
          driverRows.length === 0 ? (
            <p className="asg-empty"><UserRound size={14} /> {t('No driver is free right now (on a trip, on leave or needs rest).', 'এখন কোনো চালক খালি নেই (ট্রিপে, ছুটিতে বা বিশ্রামে)।', lang)}</p>
          ) : (
            <>
              <select id={id} value={driverId} onChange={(e) => setDriverId(e.target.value)}>
                {driverRows.map(({ d, checks }) => (
                  <option key={d.id} value={d.id} disabled={worst(checks) === 'bad'}>
                    {d.name}
                    {worst(checks) === 'bad' ? ` — ${reasonOf(checks)}` : ''}
                  </option>
                ))}
              </select>
              {vehicleRows.length > 0 && !firstGoodDriver && (
                <p className="asg-empty"><XCircle size={14} /> {t('No free driver can take this vehicle. Open the list to see why, or pick another vehicle.', 'কোনো খালি চালক এই গাড়ি চালাতে পারবেন না। কারণ দেখতে তালিকা খুলুন, অথবা অন্য গাড়ি বেছে নিন।', lang)}</p>
              )}
              {driverRow && renderChecks(driverRow.checks)}
            </>
          )
        }
      </FormField>

      <FormField label={t('Note for the driver (optional)', 'চালকের জন্য নোট (ঐচ্ছিক)', lang)}>
        {(id) => (
          <textarea
            id={id}
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('e.g. Pick up the guest from gate 2 first', 'যেমন: আগে ২ নম্বর গেট থেকে অতিথিকে তুলুন', lang)}
          />
        )}
      </FormField>
    </Modal>
  );
}
