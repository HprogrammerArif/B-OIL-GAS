import { useState } from 'react';
import { Phone, MapPin } from 'lucide-react';
import { t, type Lang } from '../../types';
import { showToast } from '../../components/ToastManager';
import { Button, StatusPill, type StatusTone } from '../../components/ui';
import { INNER_CIRCLE } from './dashboardData';

const STATUSES: ReadonlyArray<{ id: string; label: readonly [string, string]; tone: StatusTone }> = [
  { id: 'present', label: ['Present', 'উপস্থিত'], tone: 'success' },
  { id: 'meeting', label: ['In a meeting', 'মিটিংয়ে'], tone: 'info' },
  { id: 'travel', label: ['Travelling', 'সফরে'], tone: 'purple' },
  { id: 'leave', label: ['On leave', 'ছুটিতে'], tone: 'warn' },
  { id: 'sick', label: ['Sick leave', 'অসুস্থতাজনিত ছুটি'], tone: 'warn' },
  { id: 'uninformed', label: ['Absent, not informed', 'না জানিয়ে অনুপস্থিত'], tone: 'danger' },
];

/** Where each member of the leadership team is today, and how to reach them. */
export default function LeadershipPresence({ lang }: { lang: Lang }) {
  const [filter, setFilter] = useState('all');
  const [hrAsked, setHrAsked] = useState<Record<string, boolean>>({});
  const count = (id: string) => INNER_CIRCLE.filter((p) => p.status === id).length;
  const people = INNER_CIRCLE.filter((p) => filter === 'all' || p.status === filter);
  const uninformed = count('uninformed');

  return (
    <section className="tab-pane-fade dash-section" aria-labelledby="lp-title">
      <header className="dash-sec-head">
        <div>
          <h3 id="lp-title">{t('Leadership team today', 'আজকের নেতৃত্ব দল', lang)}</h3>
          <p>{t('Where each senior leader is right now, and how to reach them.', 'প্রত্যেক জ্যেষ্ঠ নেতা এখন কোথায় এবং কীভাবে যোগাযোগ করবেন।', lang)}</p>
        </div>
        {uninformed > 0 && (
          <StatusPill tone="danger">{t(`${uninformed} absent without notice`, `${uninformed.toLocaleString('bn-BD')} জন না জানিয়ে অনুপস্থিত`, lang)}</StatusPill>
        )}
      </header>

      <div className="psf-filters" role="group" aria-label={t('Filter by status', 'অবস্থা অনুযায়ী ফিল্টার', lang)}>
        <button type="button" className={`psf-filter ${filter === 'all' ? 'active' : ''}`} aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>
          {t('Everyone', 'সবাই', lang)}<b>{INNER_CIRCLE.length}</b>
        </button>
        {STATUSES.filter((s) => count(s.id) > 0).map((s) => (
          <button key={s.id} type="button" className={`psf-filter ${filter === s.id ? 'active' : ''}`} aria-pressed={filter === s.id} onClick={() => setFilter(s.id)}>
            {t(s.label[0], s.label[1], lang)}<b>{count(s.id)}</b>
          </button>
        ))}
      </div>

      <ul className="lp-list">
        {people.map((p) => {
          const tone = STATUSES.find((s) => s.id === p.status)?.tone ?? 'neutral';
          return (
            <li key={p.name} className={`lp-item ${p.status === 'uninformed' ? 'is-alert' : ''}`}>
              <span className="lp-avatar" style={{ background: p.color }} aria-hidden>{p.initials}</span>
              <div className="lp-who">
                <strong>{p.name}</strong>
                <span>{p.role}</span>
                <small>
                  <MapPin size={11} /> {p.location}
                  {p.phone && <> · <Phone size={11} /> <a href={`tel:${p.phone.replace(/\s/g, '')}`}>{p.phone}</a></>}
                </small>
              </div>
              <div className="lp-end">
                <StatusPill tone={tone}>{t(p.statusLabel, p.statusLabelBn, lang)}</StatusPill>
                {p.status === 'uninformed' && (
                  <Button
                    variant="outline-danger"
                    size="sm"
                    disabled={!!hrAsked[p.name]}
                    onClick={() => {
                      setHrAsked((prev) => ({ ...prev, [p.name]: true }));
                      showToast(t(`HR has been asked to follow up with ${p.name}.`, `${p.name}-এর বিষয়ে এইচআরকে অনুসন্ধান করতে বলা হয়েছে।`, lang), 'danger');
                    }}
                  >
                    {hrAsked[p.name]
                      ? t('HR has been asked', 'এইচআরকে জানানো হয়েছে', lang)
                      : t('Ask HR to follow up', 'এইচআরকে জানান', lang)}
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
