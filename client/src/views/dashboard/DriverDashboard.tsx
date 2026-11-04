import { useState } from 'react';
import { t } from '../../types';
import { showToast } from '../../components/ToastManager';
import { useFleetStore } from '../../store/fleetStore';
import { DashboardSubViewProps } from './types';
import { useCurrentUser } from '../../auth/session';
import { nextRef } from '../../lib/refs';
import { nowTime } from '../../lib/clock';
import DriverTrip, { MeterModal } from './DriverTrip';
import { TollModal, TollSlipList, type TollSlip } from './TollSlips';

const INITIAL_SLIPS: TollSlip[] = [
  { id: 'TOL-901', plaza: 'Babubazar Buriganga Bridge', amount: 150, time: '09:40 AM', status: 'approved' },
  { id: 'TOL-884', plaza: 'Mayor Hanif Flyover (Dhaka Exit)', amount: 260, time: '28 Oct 2026', status: 'reimbursed' },
];

export default function DriverDashboard({ lang, activeTab }: DashboardSubViewProps) {
  const { requisitions, drivers, vehicles, startTrip, completeTrip, sendChatMessage } = useFleetStore();

  // The signed-in driver's record, matched on the session identity.
  const user = useCurrentUser();
  const me = drivers.find((d) => d.name === user?.name) || null;
  const mission =
    requisitions.find((r) => r.assignedDriverId === me?.id && r.status === 'in_transit') ||
    requisitions.find((r) => r.assignedDriverId === me?.id && r.status === 'assigned') ||
    null;
  const plate = mission?.assignedVehiclePlate ?? me?.assignedVehiclePlate;
  const vehicle = plate ? vehicles.find((v) => v.plate === plate) : undefined;

  const [slips, setSlips] = useState<TollSlip[]>(INITIAL_SLIPS);
  const [tollOpen, setTollOpen] = useState(false);
  const [meter, setMeter] = useState<'start' | 'complete' | null>(null);

  /** Highest meter reading recorded for this vehicle on earlier trips. */
  const lastKm = (() => {
    const readings = requisitions
      .filter((r) => r.assignedVehiclePlate === plate && r.id !== mission?.id)
      .flatMap((r) => [r.odometerStart, r.odometerEnd])
      .filter((n): n is number => typeof n === 'number');
    return readings.length > 0 ? Math.max(...readings) : null;
  })();

  const confirmMeter = (km: number) => {
    if (!mission) return;
    if (meter === 'start') {
      startTrip(mission.id, km, nowTime(lang));
      showToast(t('Trip started. Drive safely.', 'ট্রিপ শুরু হয়েছে। নিরাপদে চালান।', lang), 'success');
    } else {
      completeTrip(mission.id, km, nowTime(lang));
      showToast(t('Trip completed. Thank you.', 'ট্রিপ সমাপ্ত হয়েছে। ধন্যবাদ।', lang), 'success');
    }
    setMeter(null);
  };

  const notifyPassenger = () => {
    if (!mission) return;
    sendChatMessage(
      mission.id,
      'driver',
      me ? me.name : 'Driver',
      `📍 Assalamu Alaikum Sir, I have arrived at the pickup location (${mission.from}). Vehicle (${plate}) is parked and waiting.`,
    );
    showToast(t(`${mission.requesterName} has been told you have arrived.`, `${mission.requesterName}-কে জানানো হয়েছে যে আপনি পৌঁছেছেন।`, lang), 'success');
  };

  const addSlip = (plaza: string, amount: number) => {
    setSlips((prev) => [{ id: nextRef('TOL'), plaza, amount, time: nowTime(lang), status: 'pending' }, ...prev]);
    setTollOpen(false);
    showToast(t(`Toll slip of ৳${amount} sent to the transport desk.`, `৳${amount} টাকার টোল স্লিপ পরিবহন ডেস্কে পাঠানো হয়েছে।`, lang), 'gold');
  };

  return (
    <>
      {(activeTab === 'overview' || !activeTab) && (
        <section className="tab-pane-fade dash-section" aria-labelledby="dd-vehicle-title">
          <header className="dash-sec-head">
            <div>
              <h3 id="dd-vehicle-title">{t('Your vehicle and licence', 'আপনার গাড়ি ও লাইসেন্স', lang)}</h3>
              <p>{t('Check these before you drive.', 'গাড়ি চালানোর আগে এগুলো দেখে নিন।', lang)}</p>
            </div>
          </header>
          <dl className="dd-facts">
            <div>
              <dt>{t('Vehicle', 'গাড়ি', lang)}</dt>
              <dd>
                <strong>{vehicle ? `${vehicle.model}` : t('None assigned', 'বরাদ্দ নেই', lang)}</strong>
                {vehicle && <small className="mono">{vehicle.plate}</small>}
              </dd>
            </div>
            {vehicle && (
              <>
                <div className={vehicle.fuelPct < 25 ? 'bad' : ''}>
                  <dt>{t('Fuel', 'জ্বালানি', lang)}</dt>
                  <dd>
                    <strong>{vehicle.fuelPct}%</strong>
                    <small>{vehicle.fuelPct < 25 ? t('Low. Refuel before the trip.', 'কম। ট্রিপের আগে ভরে নিন।', lang) : t('Enough for a trip', 'ট্রিপের জন্য যথেষ্ট', lang)}</small>
                  </dd>
                </div>
                <div>
                  <dt>{t('Next service', 'পরবর্তী সার্ভিস', lang)}</dt>
                  <dd><strong>{t(`in ${vehicle.nextServiceKm.toLocaleString('en-IN')} km`, `${vehicle.nextServiceKm.toLocaleString('en-IN')} কিমি পরে`, lang)}</strong></dd>
                </div>
              </>
            )}
            <div>
              <dt>{t('Licence', 'লাইসেন্স', lang)}</dt>
              <dd>
                <strong className="mono">{me?.licenseNo ?? '—'}</strong>
                {me && <small>{me.licenseType}</small>}
              </dd>
            </div>
            <div>
              <dt>{t('Passenger rating', 'যাত্রী রেটিং', lang)}</dt>
              <dd><strong>{me ? `★ ${me.rating.toFixed(1)} / 5.0` : '—'}</strong></dd>
            </div>
          </dl>
        </section>
      )}

      {activeTab === 'mission' && (
        <DriverTrip
          lang={lang}
          mission={mission}
          vehicle={vehicle}
          onStart={() => setMeter('start')}
          onComplete={() => setMeter('complete')}
          onNotify={notifyPassenger}
          onCall={() => mission && showToast(t(`Calling ${mission.requesterName}…`, `${mission.requesterName}-কে কল করা হচ্ছে…`, lang), 'info')}
          onToll={() => setTollOpen(true)}
        />
      )}

      {activeTab === 'tolls' && <TollSlipList lang={lang} slips={slips} onAdd={() => setTollOpen(true)} />}

      {tollOpen && <TollModal lang={lang} onClose={() => setTollOpen(false)} onSubmit={addSlip} />}
      {meter && (
        <MeterModal
          lang={lang}
          mode={meter}
          floor={meter === 'start' ? lastKm : mission?.odometerStart ?? null}
          onClose={() => setMeter(null)}
          onConfirm={confirmMeter}
        />
      )}
    </>
  );
}
