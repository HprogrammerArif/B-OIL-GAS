import { useState, type FormEvent } from 'react';
import { CheckCircle2, Key, Lock, Plus, ShieldAlert, XCircle, CalendarClock } from 'lucide-react';
import { t, type Lang } from '../../types';
import { Button, FormField, Modal, StatusPill } from '../../components/ui';
import type { LotoPermitItem } from './types';

export type PermitType = NonNullable<LotoPermitItem['type']>;

export const PERMIT_TYPE_LABEL: Record<PermitType, readonly [string, string]> = {
  loto: ['Power lock', 'বিদ্যুৎ লক'],
  hot_work: ['Welding or flame', 'ওয়েল্ডিং বা আগুনের কাজ'],
  confined_space: ['Inside a tank', 'ট্যাংকের ভেতরে'],
};

const CHECKS: ReadonlyArray<{ key: keyof NonNullable<LotoPermitItem['checklist']>; label: readonly [string, string]; detail: readonly [string, string] }> = [
  { key: 'powerCutVerified', label: ['Power is off', 'বিদ্যুৎ বন্ধ'], detail: ['The breaker is open and a meter reads 0 volts.', 'ব্রেকার খোলা এবং মিটারে ০ ভোল্ট।'] },
  { key: 'physicalPadlockLocked', label: ['Padlock fitted', 'প্যাডলক লাগানো'], detail: ['A red padlock is on the switch. Only the technician holds the key.', 'সুইচে লাল প্যাডলক আছে। চাবি শুধু টেকনিশিয়ানের কাছে।'] },
  { key: 'warningTagHung', label: ['Warning tag hung', 'সতর্কতা ট্যাগ ঝোলানো'], detail: ['"Danger: do not operate" tag with the technician\'s contact.', '"বিপদ: চালু করবেন না" ট্যাগে টেকনিশিয়ানের যোগাযোগ।'] },
  { key: 'valvesDrained', label: ['Valves closed and drained', 'ভালভ বন্ধ ও খালি'], detail: ['Supply valves are chained shut and pressure is at 0 bar.', 'সরবরাহ ভালভ বন্ধ করে শিকল দেওয়া, চাপ ০ বার।'] },
  { key: 'gasTestPassed', label: ['Gas test passed', 'গ্যাস পরীক্ষা সফল'], detail: ['No flammable vapour and normal oxygen (20.9%).', 'দাহ্য গ্যাস নেই, অক্সিজেন স্বাভাবিক (২০.৯%)।'] },
];

/* ── Permit details ───────────────────────────────────────────────────────── */

interface PermitDetailProps {
  permit: LotoPermitItem | null;
  lang: Lang;
  onClose: () => void;
  onDeIsolate?: (id: string) => void;
}

export function PermitDetailModal({ permit, lang, onClose, onDeIsolate }: PermitDetailProps) {
  if (!permit) return null;
  const locked = permit.status === 'LOCKED OUT';
  const rows: Array<[readonly [string, string], string | undefined]> = [
    [['Equipment', 'যন্ত্র'], permit.equipment],
    [['Where', 'কোথায়'], permit.location],
    [['Isolated at', 'যেখানে বন্ধ'], permit.breaker],
    [['Worker', 'কর্মী'], permit.issuedTo],
    [['Valid', 'মেয়াদ'], permit.timeIssued && permit.validUntil ? `${permit.timeIssued} – ${permit.validUntil}` : permit.validUntil],
  ];

  return (
    <Modal
      open
      onClose={onClose}
      icon={<Lock size={16} />}
      title={`${permit.id} · ${permit.equipment}`}
      footer={(
        <>
          <Button variant="ghost" onClick={onClose}>{t('Close', 'বন্ধ করুন', lang)}</Button>
          {locked && onDeIsolate && (
            <Button variant="outline-danger" icon={<Key size={14} />} onClick={() => onDeIsolate(permit.id)}>
              {t('Remove lock and restore machine', 'লক খুলে মেশিন চালু করুন', lang)}
            </Button>
          )}
        </>
      )}
    >
      <div className="psf-modal">
        <p className="psf-danger"><ShieldAlert size={15} /> {t('Hazard prevented:', 'যে বিপদ ঠেকানো হচ্ছে:', lang)} {permit.hazard}</p>

        <dl className="psf-facts">
          {rows.filter(([, v]) => !!v).map(([label, value]) => (
            <div key={label[0]}><dt>{t(label[0], label[1], lang)}</dt><dd>{value}</dd></div>
          ))}
        </dl>

        <h4>{t('Safety checks', 'নিরাপত্তা পরীক্ষা', lang)}</h4>
        <ul className="psf-checks">
          {CHECKS.map((c) => {
            const ok = !!permit.checklist?.[c.key];
            return (
              <li key={c.key} className={ok ? 'ok' : 'missing'}>
                {ok ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                <span>
                  <strong>{t(c.label[0], c.label[1], lang)}</strong>
                  <small>{t(c.detail[0], c.detail[1], lang)}</small>
                </span>
              </li>
            );
          })}
        </ul>

        <p className="psf-rule">
          {t(
            'Never remove a padlock or tag until the engineer confirms everyone is clear of the machine.',
            'প্রকৌশলী নিশ্চিত না করা পর্যন্ত কেউ যন্ত্রের কাছে নেই, এমন অবস্থায় প্যাডলক বা ট্যাগ খোলা যাবে না।',
            lang,
          )}
        </p>
      </div>
    </Modal>
  );
}

/* ── New permit ───────────────────────────────────────────────────────────── */

export interface NewPermitInput {
  type: PermitType;
  equipment: string;
  breaker: string;
  worker: string;
  hazard: string;
  summary: string;
}

interface NewPermitProps {
  lang: Lang;
  onClose: () => void;
  onCreate: (input: NewPermitInput) => void;
}

export function NewPermitModal({ lang, onClose, onCreate }: NewPermitProps) {
  const [type, setType] = useState<PermitType>('loto');
  const [equipment, setEquipment] = useState('');
  const [breaker, setBreaker] = useState('');
  const [worker, setWorker] = useState('');
  const [hazard, setHazard] = useState('');
  const [summary, setSummary] = useState('');
  const [tried, setTried] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (!equipment.trim() || !worker.trim()) return;
    onCreate({ type, equipment: equipment.trim(), breaker: breaker.trim(), worker: worker.trim(), hazard: hazard.trim(), summary: summary.trim() });
  };

  const required = t('Required', 'আবশ্যক', lang);

  return (
    <Modal
      open
      onClose={onClose}
      icon={<Plus size={16} />}
      title={t('Issue a work permit', 'কাজের অনুমতি ইস্যু', lang)}
      footer={(
        <>
          <Button variant="ghost" onClick={onClose}>{t('Cancel', 'বাতিল', lang)}</Button>
          <Button type="submit" form="psf-permit-form" icon={<Lock size={13} />}>{t('Issue permit', 'অনুমতি ইস্যু করুন', lang)}</Button>
        </>
      )}
    >
      <form id="psf-permit-form" className="psf-form" onSubmit={submit} noValidate>
        <FormField label={t('What kind of work?', 'কী ধরনের কাজ?', lang)}>
          {(id) => (
            <select id={id} className="form-input" value={type} onChange={(e) => setType(e.target.value as PermitType)}>
              {(Object.keys(PERMIT_TYPE_LABEL) as PermitType[]).map((k) => (
                <option key={k} value={k}>{t(PERMIT_TYPE_LABEL[k][0], PERMIT_TYPE_LABEL[k][1], lang)}</option>
              ))}
            </select>
          )}
        </FormField>
        <FormField label={t('Machine', 'মেশিন', lang)} required error={tried && !equipment.trim() ? required : undefined}>
          {(id) => (
            <input id={id} className="form-input" value={equipment} onChange={(e) => setEquipment(e.target.value)}
              placeholder={t('e.g. Bitumen booster pump #3', 'যেমন: বিটুমিন বুস্টার পাম্প #৩', lang)} />
          )}
        </FormField>
        <div className="psf-row">
          <FormField label={t('Worker', 'কর্মী', lang)} required error={tried && !worker.trim() ? required : undefined}>
            {(id) => (
              <input id={id} className="form-input" value={worker} onChange={(e) => setWorker(e.target.value)}
                placeholder={t('Name and role', 'নাম ও পদবি', lang)} />
            )}
          </FormField>
          <FormField label={t('Switch or valve locked', 'যে সুইচ বা ভালভ লক হচ্ছে', lang)}>
            {(id) => (
              <input id={id} className="form-input" value={breaker} onChange={(e) => setBreaker(e.target.value)}
                placeholder={t('e.g. Breaker 3A-08', 'যেমন: ব্রেকার 3A-08', lang)} />
            )}
          </FormField>
        </div>
        <FormField label={t('Danger it prevents', 'যে বিপদ ঠেকাবে', lang)}>
          {(id) => (
            <input id={id} className="form-input" value={hazard} onChange={(e) => setHazard(e.target.value)}
              placeholder={t('e.g. Electric shock, hot bitumen spray', 'যেমন: বিদ্যুৎ শক, গরম বিটুমিন ছিটকানো', lang)} />
          )}
        </FormField>
        <FormField label={t('Why, in one line', 'কেন, এক লাইনে', lang)}>
          {(id) => (
            <input id={id} className="form-input" value={summary} onChange={(e) => setSummary(e.target.value)}
              placeholder={t('e.g. Changing worn bearings on the pump', 'যেমন: পাম্পের ক্ষয়প্রাপ্ত বিয়ারিং বদল', lang)} />
          )}
        </FormField>
      </form>
    </Modal>
  );
}

/* ── New shift handover ───────────────────────────────────────────────────── */

export const SHIFT_WINDOWS: ReadonlyArray<{ value: string; label: readonly [string, string] }> = [
  { value: 'Night → Morning Shift (06:00 AM)', label: ['Night to morning, 6:00 AM', 'রাত থেকে সকাল, সকাল ৬:০০'] },
  { value: 'Morning → Afternoon Shift (02:00 PM)', label: ['Morning to afternoon, 2:00 PM', 'সকাল থেকে বিকাল, দুপুর ২:০০'] },
  { value: 'Afternoon → Night Shift (10:00 PM)', label: ['Afternoon to night, 10:00 PM', 'বিকাল থেকে রাত, রাত ১০:০০'] },
];

export interface NewShiftInput {
  window: string;
  outgoing: string;
  incoming: string;
  notes: string;
  watch: string;
}

interface NewShiftProps {
  lang: Lang;
  onClose: () => void;
  onCreate: (input: NewShiftInput) => void;
}

export function NewShiftModal({ lang, onClose, onCreate }: NewShiftProps) {
  const [slot, setSlot] = useState(SHIFT_WINDOWS[1].value);
  const [outgoing, setOutgoing] = useState('Engr. Tariq Ahmed');
  const [incoming, setIncoming] = useState('Engr. Kamrul Hasan');
  const [notes, setNotes] = useState('');
  const [watch, setWatch] = useState('');
  const [tried, setTried] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (!notes.trim() || !outgoing.trim() || !incoming.trim()) return;
    onCreate({ window: slot, outgoing: outgoing.trim(), incoming: incoming.trim(), notes: notes.trim(), watch: watch.trim() });
  };
  const required = t('Required', 'আবশ্যক', lang);

  return (
    <Modal
      open
      onClose={onClose}
      icon={<CalendarClock size={16} />}
      title={t('Write a handover note', 'হস্তান্তর নোট লিখুন', lang)}
      footer={(
        <>
          <Button variant="ghost" onClick={onClose}>{t('Cancel', 'বাতিল', lang)}</Button>
          <Button type="submit" form="psf-shift-form">{t('Save and send to next shift', 'সংরক্ষণ করে পরের শিফটে পাঠান', lang)}</Button>
        </>
      )}
    >
      <form id="psf-shift-form" className="psf-form" onSubmit={submit} noValidate>
        <FormField label={t('Which handover?', 'কোন হস্তান্তর?', lang)}>
          {(id) => (
            <select id={id} className="form-input" value={slot} onChange={(e) => setSlot(e.target.value)}>
              {SHIFT_WINDOWS.map((w) => <option key={w.value} value={w.value}>{t(w.label[0], w.label[1], lang)}</option>)}
            </select>
          )}
        </FormField>
        <div className="psf-row">
          <FormField label={t('Leaving engineer', 'বিদায়ী প্রকৌশলী', lang)} required error={tried && !outgoing.trim() ? required : undefined}>
            {(id) => <input id={id} className="form-input" value={outgoing} onChange={(e) => setOutgoing(e.target.value)} />}
          </FormField>
          <FormField label={t('Arriving engineer', 'নতুন প্রকৌশলী', lang)} required error={tried && !incoming.trim() ? required : undefined}>
            {(id) => <input id={id} className="form-input" value={incoming} onChange={(e) => setIncoming(e.target.value)} />}
          </FormField>
        </div>
        <FormField
          label={t('What should the next shift know?', 'পরের শিফটের কী জানা দরকার?', lang)}
          required
          error={tried && !notes.trim() ? required : undefined}
        >
          {(id) => (
            <textarea id={id} rows={3} className="form-input" value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder={t('Machine status, tank levels, work planned…', 'মেশিনের অবস্থা, ট্যাংকের লেভেল, পরিকল্পিত কাজ…', lang)} />
          )}
        </FormField>
        <FormField
          label={t('Things to watch', 'নজরে রাখার বিষয়', lang)}
          hint={t('Separate with commas.', 'কমা দিয়ে আলাদা করুন।', lang)}
        >
          {(id) => (
            <input id={id} className="form-input" value={watch} onChange={(e) => setWatch(e.target.value)}
              placeholder={t('e.g. Tank TK-102 temperature, boiler pressure', 'যেমন: ট্যাংক TK-102 তাপমাত্রা, বয়লার চাপ', lang)} />
          )}
        </FormField>
      </form>
    </Modal>
  );
}

/* ── Shared pill helper for statuses ──────────────────────────────────────── */

export function PermitStatusPill({ status, lang }: { status: string; lang: Lang }) {
  if (status === 'LOCKED OUT') return <StatusPill tone="danger">{t('Locked', 'লক করা', lang)}</StatusPill>;
  if (status === 'DE-ISOLATED') return <StatusPill tone="success">{t('Restored', 'চালু করা হয়েছে', lang)}</StatusPill>;
  return <StatusPill tone="warn">{t('Permit active', 'অনুমতি সক্রিয়', lang)}</StatusPill>;
}
