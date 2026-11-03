import { useState } from 'react';
import { CheckCircle2, Clock, Eye, Key, Lock, Plus, PenLine, ArrowRight } from 'lucide-react';
import { t, type Lang } from '../../types';
import { nowTime } from '../../lib/clock';
import { showToast } from '../../components/ToastManager';
import { Button, EmptyState, StatusPill } from '../../components/ui';
import { INITIAL_LOTO_PERMITS, SHIFT_HANDOVER } from './dashboardData';
import type { LotoPermitItem, ShiftHandoverItem } from './types';
import {
  NewPermitModal, NewShiftModal, PERMIT_TYPE_LABEL, PermitDetailModal, PermitStatusPill,
  type NewPermitInput, type NewShiftInput, type PermitType,
} from './SafetyModals';

type Filter = 'all' | PermitType;

const TYPE_DEFAULTS: Record<PermitType, { prefix: string; offset: number; label: string }> = {
  loto: { prefix: 'LOTO-0', offset: 45, label: 'Electrical Power Lockout' },
  hot_work: { prefix: 'HOT-0', offset: 20, label: 'Hot Work / Welding Permit' },
  confined_space: { prefix: 'CONF-0', offset: 10, label: 'Inside Tank Entry Permit' },
};

const isOpen = (p: LotoPermitItem) => p.status !== 'DE-ISOLATED';

/**
 * Plant safety: work permits (machines locked off while people work on them)
 * and the shift-to-shift handover log.
 */
export default function PlantSafety({ lang }: { lang: Lang }) {
  const [permits, setPermits] = useState<LotoPermitItem[]>(INITIAL_LOTO_PERMITS);
  const [shifts, setShifts] = useState<ShiftHandoverItem[]>(SHIFT_HANDOVER);
  const [filter, setFilter] = useState<Filter>('all');
  const [detail, setDetail] = useState<LotoPermitItem | null>(null);
  const [showNewPermit, setShowNewPermit] = useState(false);
  const [showNewShift, setShowNewShift] = useState(false);

  const visible = permits.filter((p) => filter === 'all' || (p.type ?? 'loto') === filter);
  const countOf = (f: Filter) => permits.filter((p) => f === 'all' || (p.type ?? 'loto') === f).length;
  const openCount = permits.filter(isOpen).length;
  const filters: Filter[] = ['all', 'loto', 'hot_work', 'confined_space'];

  const handleDeIsolate = (id: string) => {
    setPermits((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'DE-ISOLATED' } : p)));
    setDetail((prev) => (prev && prev.id === id ? { ...prev, status: 'DE-ISOLATED' } : prev));
    showToast(t('Lock removed. The machine is ready to run.', 'লক খোলা হয়েছে। মেশিন চালুর জন্য প্রস্তুত।', lang), 'success');
  };

  const handleCreatePermit = (input: NewPermitInput) => {
    const d = TYPE_DEFAULTS[input.type];
    const permit: LotoPermitItem = {
      id: `${d.prefix}${permits.length + d.offset}`,
      type: input.type,
      typeLabel: d.label,
      equipment: input.equipment,
      breaker: input.breaker || 'Main control breaker',
      issuedTo: input.worker,
      status: 'LOCKED OUT',
      hazard: input.hazard || 'High voltage electricity / fluid pressure',
      plainSummary: input.summary || 'Power and valves are locked off so maintenance can proceed safely.',
      checklist: {
        powerCutVerified: true,
        valvesDrained: true,
        physicalPadlockLocked: true,
        gasTestPassed: true,
        warningTagHung: true,
      },
      timeIssued: nowTime(lang),
      validUntil: 'Today, 06:00 PM',
    };
    setPermits((prev) => [permit, ...prev]);
    setShowNewPermit(false);
    showToast(t(`Permit ${permit.id} issued. The machine is locked.`, `অনুমতি ${permit.id} ইস্যু হয়েছে। মেশিন লক করা হয়েছে।`, lang), 'gold');
  };

  const handleSignShift = (id: string | undefined, idx: number) => {
    setShifts((prev) => prev.map((s, i) => ((id ? s.id === id : i === idx) ? { ...s, safetyChecklistSigned: true, status: 'completed' } : s)));
    showToast(t('Handover accepted and signed.', 'হস্তান্তর গ্রহণ ও স্বাক্ষর সম্পন্ন।', lang), 'success');
  };

  const handleCreateShift = (input: NewShiftInput) => {
    const shift: ShiftHandoverItem = {
      id: `SH-0${shifts.length + 1}`,
      shift: input.window,
      shiftType: 'evening',
      handover: `${input.outgoing} ➔ ${input.incoming}`,
      outgoingEngineer: input.outgoing,
      incomingEngineer: input.incoming,
      time: nowTime(lang),
      status: 'upcoming',
      notes: input.notes,
      criticalWatchItems: input.watch ? input.watch.split(',').map((s) => s.trim()).filter(Boolean) : [],
      safetyChecklistSigned: false,
    };
    setShifts((prev) => [shift, ...prev]);
    setShowNewShift(false);
    showToast(t('Handover note saved. The arriving engineer will sign to accept it.', 'হস্তান্তর নোট সংরক্ষিত। নতুন প্রকৌশলী স্বাক্ষর করে গ্রহণ করবেন।', lang), 'success');
  };

  const waiting = shifts.filter((s) => !s.safetyChecklistSigned).length;

  return (
    <div className="tab-pane-fade psf">
      {/* ── Work permits ── */}
      <section className="psf-card" aria-labelledby="psf-permits-title">
        <header className="psf-head">
          <div>
            <h3 id="psf-permits-title">{t('Work permits', 'কাজের অনুমতি', lang)}</h3>
            <p>
              {t(
                'Before anyone repairs a machine, its power is locked off with a padlock so nobody can switch it on by accident.',
                'কেউ মেশিন মেরামত করার আগে তার বিদ্যুৎ প্যাডলক দিয়ে বন্ধ রাখা হয়, যাতে ভুলে কেউ চালু করতে না পারে।',
                lang,
              )}
            </p>
          </div>
          <div className="psf-head-actions">
            <StatusPill tone={openCount > 0 ? 'danger' : 'success'}>
              {t(`${openCount} open`, `${openCount.toLocaleString('bn-BD')}টি চালু`, lang)}
            </StatusPill>
            <Button size="sm" icon={<Plus size={13} />} onClick={() => setShowNewPermit(true)}>
              {t('Issue permit', 'অনুমতি ইস্যু', lang)}
            </Button>
          </div>
        </header>

        <div className="psf-filters" role="group" aria-label={t('Filter by kind of work', 'কাজের ধরন অনুযায়ী ফিল্টার', lang)}>
          {filters.map((f) => (
            <button
              key={f}
              type="button"
              className={`psf-filter ${filter === f ? 'active' : ''}`}
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? t('All', 'সব', lang) : t(PERMIT_TYPE_LABEL[f][0], PERMIT_TYPE_LABEL[f][1], lang)}
              <b>{countOf(f)}</b>
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <EmptyState compact icon={<Lock size={20} />} title={t('No permits here', 'এখানে কোনো অনুমতি নেই', lang)} />
        ) : (
          <ul className="psf-list">
            {visible.map((p) => {
              const locked = p.status === 'LOCKED OUT';
              const typeKey = p.type ?? 'loto';
              return (
                <li key={p.id} className={`psf-item ${locked ? 'is-locked' : p.status === 'DE-ISOLATED' ? 'is-done' : ''}`}>
                  <div className="psf-item-top">
                    <div>
                      <h4>{p.equipment}</h4>
                      <span className="psf-sub">{t(PERMIT_TYPE_LABEL[typeKey][0], PERMIT_TYPE_LABEL[typeKey][1], lang)} · <code>{p.id}</code></span>
                    </div>
                    <PermitStatusPill status={p.status} lang={lang} />
                  </div>
                  {p.plainSummary && <p className="psf-why">{p.plainSummary}</p>}
                  <div className="psf-meta">
                    <span>{t('Worker', 'কর্মী', lang)}: <strong>{p.issuedTo}</strong></span>
                    {p.validUntil && <span><Clock size={12} /> {t('Until', 'মেয়াদ', lang)} {p.validUntil}</span>}
                  </div>
                  <div className="psf-actions">
                    <Button variant="secondary" size="sm" icon={<Eye size={12} />} onClick={() => setDetail(p)}>
                      {t('Details and checks', 'বিস্তারিত ও পরীক্ষা', lang)}
                    </Button>
                    {locked && (
                      <Button variant="outline-danger" size="sm" icon={<Key size={12} />} onClick={() => handleDeIsolate(p.id)}>
                        {t('Remove lock', 'লক খুলুন', lang)}
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ── Shift handover ── */}
      <section className="psf-card" aria-labelledby="psf-shift-title">
        <header className="psf-head">
          <div>
            <h3 id="psf-shift-title">{t('Shift handover', 'শিফট হস্তান্তর', lang)}</h3>
            <p>
              {t(
                'The plant runs day and night. The engineer who leaves writes what the next team must know.',
                'প্ল্যান্ট দিনরাত চলে। যিনি যাচ্ছেন তিনি লিখে যান পরের দলের কী জানা দরকার।',
                lang,
              )}
            </p>
          </div>
          <div className="psf-head-actions">
            <StatusPill tone={waiting > 0 ? 'warn' : 'success'}>
              {waiting > 0
                ? t(`${waiting} to sign`, `${waiting.toLocaleString('bn-BD')}টি স্বাক্ষর বাকি`, lang)
                : t('All signed', 'সব স্বাক্ষরিত', lang)}
            </StatusPill>
            <Button variant="secondary" size="sm" icon={<Plus size={13} />} onClick={() => setShowNewShift(true)}>
              {t('Write note', 'নোট লিখুন', lang)}
            </Button>
          </div>
        </header>

        <ul className="psf-list">
          {shifts.map((s, i) => (
            <li key={s.id ?? i} className={`psf-item ${s.safetyChecklistSigned ? 'is-done' : ''}`}>
              <div className="psf-item-top">
                <div>
                  <h4>{s.shift}</h4>
                  <span className="psf-sub">
                    {s.outgoingEngineer ?? s.handover.split('➔')[0].trim()} <ArrowRight size={11} /> {s.incomingEngineer ?? s.handover.split('➔')[1]?.trim()} · {s.time}
                  </span>
                </div>
                {s.safetyChecklistSigned
                  ? <StatusPill tone="success">{t('Signed', 'স্বাক্ষরিত', lang)}</StatusPill>
                  : <StatusPill tone="warn">{t('Waiting for signature', 'স্বাক্ষরের অপেক্ষায়', lang)}</StatusPill>}
              </div>
              <p className="psf-why">{s.notes}</p>
              {s.criticalWatchItems && s.criticalWatchItems.length > 0 && (
                <div className="psf-watch">
                  <span>{t('Watch', 'নজরে রাখুন', lang)}</span>
                  <ul>{s.criticalWatchItems.map((w) => <li key={w}>{w}</li>)}</ul>
                </div>
              )}
              {!s.safetyChecklistSigned && (
                <div className="psf-actions">
                  <Button size="sm" icon={<PenLine size={12} />} onClick={() => handleSignShift(s.id, i)}>
                    {t('Sign to accept', 'স্বাক্ষর করে গ্রহণ করুন', lang)}
                  </Button>
                </div>
              )}
              {s.safetyChecklistSigned && (
                <div className="psf-signed"><CheckCircle2 size={13} /> {t('Accepted by the arriving engineer', 'নতুন প্রকৌশলী গ্রহণ করেছেন', lang)}</div>
              )}
            </li>
          ))}
        </ul>
      </section>

      <PermitDetailModal permit={detail} lang={lang} onClose={() => setDetail(null)} onDeIsolate={handleDeIsolate} />
      {showNewPermit && <NewPermitModal lang={lang} onClose={() => setShowNewPermit(false)} onCreate={handleCreatePermit} />}
      {showNewShift && <NewShiftModal lang={lang} onClose={() => setShowNewShift(false)} onCreate={handleCreateShift} />}
    </div>
  );
}
