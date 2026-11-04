import { useState, type FormEvent } from 'react';
import { ArrowRight, CarFront, Clock, Users } from 'lucide-react';
import { t, type Lang } from '../../types';
import { showToast } from '../../components/ToastManager';
import { useFleetStore, type VehicleRequisition } from '../../store/fleetStore';
import { Button, EmptyState, FormField, Modal, StatusPill } from '../../components/ui';
import AssignVehicleModal from '../../components/fleet/AssignVehicleModal';

const CAPACITY: Record<VehicleRequisition['requiredCapacity'], readonly [string, string]> = {
  sedan_4: ['Car (4 seats)', 'গাড়ি (৪ আসন)'],
  microbus_7: ['Microbus (7 seats)', 'মাইক্রোবাস (৭ আসন)'],
  pickup_4x4: ['Pickup (4x4)', 'পিকআপ (৪x৪)'],
  tanker_heavy: ['Heavy tanker', 'ভারী ট্যাংকার'],
};

const place = (s: string) => s.split(',')[0];

/** Vehicle requests: what staff asked for, and the vehicle and driver we gave them. */
export default function TransportRequests({ lang }: { lang: Lang }) {
  const { requisitions, vehicles, drivers, assignRequisition, rejectRequisition } = useFleetStore();
  const [assigning, setAssigning] = useState<VehicleRequisition | null>(null);
  const [declining, setDeclining] = useState<VehicleRequisition | null>(null);

  const waiting = requisitions.filter((r) => r.status === 'pending');
  const assigned = requisitions.filter((r) => r.status === 'assigned');
  const bn = (n: number) => n.toLocaleString('bn-BD');

  return (
    <section className="tab-pane-fade dash-section" aria-labelledby="tr-title">
      <header className="dash-sec-head">
        <div>
          <h3 id="tr-title">{t('Vehicle requests', 'যানবাহন আবেদন', lang)}</h3>
          <p>{t('Staff ask for a vehicle for official travel. Give each request a vehicle and a driver, or decline it.', 'কর্মীরা অফিসিয়াল যাত্রার জন্য গাড়ি চান। প্রতিটি আবেদনে গাড়ি ও চালক দিন, অথবা বাতিল করুন।', lang)}</p>
        </div>
        {waiting.length > 0 && <StatusPill tone="warn">{t(`${waiting.length} waiting`, `${bn(waiting.length)}টি অপেক্ষায়`, lang)}</StatusPill>}
      </header>

      {waiting.length === 0 ? (
        <EmptyState
          compact
          icon={<CarFront size={20} />}
          title={t('No requests waiting', 'কোনো আবেদন অপেক্ষায় নেই', lang)}
          description={t('New requests from staff will show up here.', 'কর্মীদের নতুন আবেদন এখানে দেখা যাবে।', lang)}
        />
      ) : (
        <ul className="tr-list">
          {waiting.map((r) => (
            <li key={r.id} className="tr-item">
              <div className="tr-main">
                <strong className="tr-route">
                  {place(r.from)} <ArrowRight size={14} aria-hidden /> {place(r.to)}
                </strong>
                <small>
                  {r.requesterName} · {r.dept}
                  {r.hodApproval === 'pending' ? ` · ${t('Manager has not approved yet', 'ম্যানেজার এখনো অনুমোদন দেননি', lang)}` : ''}
                </small>
                <p className="tr-purpose">{r.purpose}</p>
                <div className="tr-facts">
                  <span><Clock size={12} aria-hidden /> {r.departureTime}</span>
                  <span><Users size={12} aria-hidden /> {t(`${r.passengersCount} people`, `${bn(r.passengersCount)} জন`, lang)}</span>
                  <span><CarFront size={12} aria-hidden /> {t(CAPACITY[r.requiredCapacity][0], CAPACITY[r.requiredCapacity][1], lang)}</span>
                  <span>{r.tripType === 'round_trip' ? t('Round trip', 'যাওয়া-আসা', lang) : t('One way', 'একমুখী', lang)}</span>
                </div>
              </div>
              <div className="tr-actions">
                <Button size="sm" onClick={() => setAssigning(r)}>{t('Assign', 'বরাদ্দ করুন', lang)}</Button>
                <Button size="sm" variant="ghost" onClick={() => setDeclining(r)}>{t('Decline', 'বাতিল', lang)}</Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {assigned.length > 0 && (
        <details className="hc-done">
          <summary>{t(`Given a vehicle, not left yet (${assigned.length})`, `গাড়ি দেওয়া হয়েছে, এখনো রওনা হয়নি (${bn(assigned.length)})`, lang)}</summary>
          <ul>
            {assigned.map((r) => (
              <li key={r.id}>
                <strong>{place(r.from)} → {place(r.to)} · {r.requesterName}</strong>
                <small>{r.assignedVehiclePlate} · {r.assignedDriverName}</small>
              </li>
            ))}
          </ul>
        </details>
      )}

      <AssignVehicleModal
        isOpen={!!assigning}
        onClose={() => setAssigning(null)}
        requisition={assigning}
        vehicles={vehicles}
        drivers={drivers}
        lang={lang}
        onConfirm={(id, plate, driverId) => {
          assignRequisition(id, plate, driverId);
          showToast(t(`Vehicle ${plate} and a driver were given to ${id}.`, `${id}-এর জন্য গাড়ি ${plate} ও চালক দেওয়া হয়েছে।`, lang), 'success');
          setAssigning(null);
        }}
      />

      {declining && (
        <DeclineModal
          lang={lang}
          request={declining}
          onClose={() => setDeclining(null)}
          onConfirm={(reason) => {
            rejectRequisition(declining.id, reason);
            showToast(t(`${declining.requesterName} will be told the request was declined.`, `${declining.requesterName}-কে জানানো হবে আবেদন বাতিল হয়েছে।`, lang), 'info');
            setDeclining(null);
          }}
        />
      )}
    </section>
  );
}

function DeclineModal({ lang, request, onClose, onConfirm }: { lang: Lang; request: VehicleRequisition; onClose: () => void; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState('');
  const [tried, setTried] = useState(false);
  const valid = reason.trim().length >= 5;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (valid) onConfirm(reason.trim());
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title={t('Decline this request?', 'আবেদনটি বাতিল করবেন?', lang)}
      footer={(
        <>
          <Button variant="ghost" onClick={onClose}>{t('Keep it', 'রেখে দিন', lang)}</Button>
          <Button type="submit" form="decline-form" variant="danger">{t('Decline', 'বাতিল করুন', lang)}</Button>
        </>
      )}
    >
      <form id="decline-form" className="psf-form" onSubmit={submit} noValidate>
        <p className="tr-modal-note">
          {request.requesterName}: {place(request.from)} → {place(request.to)}, {request.departureTime}
        </p>
        <FormField
          label={t('Reason', 'কারণ', lang)}
          required
          hint={t('The requester will see this.', 'আবেদনকারী এটি দেখতে পাবেন।', lang)}
          error={tried && !valid ? t('Write a short reason.', 'সংক্ষিপ্ত কারণ লিখুন।', lang) : undefined}
        >
          {(id) => <textarea id={id} rows={3} className="form-input" value={reason} onChange={(e) => setReason(e.target.value)} />}
        </FormField>
      </form>
    </Modal>
  );
}
