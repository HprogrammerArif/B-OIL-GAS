import { ArrowRight, Navigation } from 'lucide-react';
import { t, type Lang } from '../../types';
import { useFleetStore } from '../../store/fleetStore';
import { EmptyState, StatusPill, type StatusTone } from '../../components/ui';

interface Trip {
  key: string;
  from: string;
  to: string;
  who: string;
  plate: string;
  driver: string;
  state: 'left' | 'not_left' | 'loading';
  progress?: number;
  where?: string;
}

const STATE: Record<Trip['state'], { label: readonly [string, string]; tone: StatusTone }> = {
  left: { label: ['On the road', 'পথে আছে'], tone: 'info' },
  not_left: { label: ['Not left yet', 'এখনো রওনা হয়নি'], tone: 'neutral' },
  loading: { label: ['Loading', 'লোড হচ্ছে'], tone: 'warn' },
};

const place = (s: string) => s.split(',')[0];

/** Every vehicle that is out or about to go: passenger trips and bulk deliveries in one list. */
export default function TransportTrips({ lang }: { lang: Lang }) {
  const { requisitions, vehicles } = useFleetStore();

  const passengerTrips: Trip[] = requisitions
    .filter((r) => r.status === 'assigned' || r.status === 'in_transit')
    .map((r) => {
      const vehicle = vehicles.find((v) => v.plate === r.assignedVehiclePlate);
      return {
        key: r.id,
        from: place(r.from),
        to: place(r.to),
        who: r.requesterName,
        plate: r.assignedVehiclePlate ?? '',
        driver: r.assignedDriverName ?? '',
        state: r.status === 'in_transit' ? 'left' : 'not_left',
        where: r.status === 'in_transit' ? vehicle?.location : undefined,
      };
    });

  const onPassengerTrip = new Set(passengerTrips.map((p) => p.plate));
  const bulkTrips: Trip[] = vehicles
    .filter((v) => (v.status === 'in_transit' || v.status === 'loading') && !onPassengerTrip.has(v.plate))
    .map((v) => ({
      key: v.id,
      from: v.routeOrigin ? place(v.routeOrigin) : place(v.location),
      to: v.routeDestination ? place(v.routeDestination) : '',
      who: v.type === 'tanker' ? t('Bitumen delivery', 'বিটুমিন সরবরাহ', lang) : v.model,
      plate: v.plate,
      driver: v.driverName ?? '',
      state: v.status === 'loading' ? 'loading' : 'left',
      progress: v.routeProgress,
      where: v.location,
    }));

  const trips = [...passengerTrips, ...bulkTrips];
  const onRoad = trips.filter((x) => x.state === 'left').length;

  return (
    <section className="tab-pane-fade dash-section" aria-labelledby="tt-title">
      <header className="dash-sec-head">
        <div>
          <h3 id="tt-title">{t('Trips on the road', 'পথে থাকা ট্রিপ', lang)}</h3>
          <p>{t('Every vehicle that is out, loading, or about to leave, with its driver.', 'যেসব গাড়ি বাইরে আছে, লোড হচ্ছে বা রওনা হবে, চালকসহ।', lang)}</p>
        </div>
        {onRoad > 0 && <StatusPill tone="info">{t(`${onRoad} on the road`, `${onRoad.toLocaleString('bn-BD')}টি পথে`, lang)}</StatusPill>}
      </header>

      {trips.length === 0 ? (
        <EmptyState
          compact
          icon={<Navigation size={20} />}
          title={t('No vehicle is out right now', 'এখন কোনো গাড়ি বাইরে নেই', lang)}
          description={t('Trips appear here once a vehicle is given to a request.', 'আবেদনে গাড়ি দিলে ট্রিপ এখানে দেখা যাবে।', lang)}
        />
      ) : (
        <ul className="tr-list">
          {trips.map((x) => (
            <li key={x.key} className="tr-item">
              <div className="tr-main">
                <strong className="tr-route">
                  {x.from}
                  {x.to && <><ArrowRight size={14} aria-hidden /> {x.to}</>}
                </strong>
                <small>{x.who} · {x.plate}{x.driver ? ` · ${x.driver}` : ''}</small>
                {x.progress !== undefined && x.state === 'left' && (
                  <div className="hs-bar" role="img" aria-label={t(`${x.progress}% of the way`, `পথের ${x.progress.toLocaleString('bn-BD')}% শেষ`, lang)}>
                    <span style={{ width: `${x.progress}%` }} />
                  </div>
                )}
                {x.where && x.state !== 'not_left' && <small>{t('Now near', 'এখন কাছে', lang)}: {x.where}</small>}
              </div>
              <StatusPill tone={STATE[x.state].tone}>{t(STATE[x.state].label[0], STATE[x.state].label[1], lang)}</StatusPill>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
