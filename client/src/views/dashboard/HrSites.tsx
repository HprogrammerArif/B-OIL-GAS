import { Users } from 'lucide-react';
import { t, type Lang } from '../../types';
import { useEmployeeStore, type Employee } from '../../store/employeeStore';
import { Button, EmptyState } from '../../components/ui';

const SITES: ReadonlyArray<{ id: Employee['assignedSite']; name: readonly [string, string]; place: readonly [string, string] }> = [
  { id: 'HQ_BARIDHARA', name: ['Dhaka head office', 'ঢাকা সদর দপ্তর'], place: ['Baridhara, Dhaka', 'বারিধারা, ঢাকা'] },
  { id: 'PLANT_KERANIGANJ', name: ['Keraniganj refinery', 'কেরানীগঞ্জ রিফাইনারি'], place: ['Keraniganj, Dhaka', 'কেরানীগঞ্জ, ঢাকা'] },
  { id: 'TERMINAL_CTG', name: ['Chattogram terminal', 'চট্টগ্রাম টার্মিনাল'], place: ['Patenga, Chattogram', 'পতেঙ্গা, চট্টগ্রাম'] },
];

/** Where our people work: headcount per site, who is on leave, and the main teams. */
export default function HrSites({ lang, onOpenWorkforce }: { lang: Lang; onOpenWorkforce: () => void }) {
  const { employees } = useEmployeeStore();
  const active = employees.filter((e) => e.status !== 'offboarded');
  const bn = (n: number) => n.toLocaleString('bn-BD');

  return (
    <section className="tab-pane-fade dash-section" aria-labelledby="hs-title">
      <header className="dash-sec-head">
        <div>
          <h3 id="hs-title">{t('Where our people work', 'আমাদের কর্মীরা কোথায় কাজ করেন', lang)}</h3>
          <p>{t(`${active.length} people across 3 sites. People who have left are not counted.`, `৩টি কর্মস্থলে ${bn(active.length)} জন। যারা চলে গেছেন তাদের গণনা করা হয়নি।`, lang)}</p>
        </div>
        <Button variant="secondary" size="sm" onClick={onOpenWorkforce}>{t('See everyone', 'সবাইকে দেখুন', lang)}</Button>
      </header>

      {active.length === 0 ? (
        <EmptyState compact icon={<Users size={20} />} title={t('No staff on record', 'কোনো কর্মী নেই', lang)} />
      ) : (
        <ul className="hs-list">
          {SITES.map((site) => {
            const staff = active.filter((e) => e.assignedSite === site.id);
            const onLeave = staff.filter((e) => e.status === 'on_leave').length;
            const share = Math.round((staff.length / active.length) * 100);
            const teams = new Map<string, number>();
            staff.forEach((e) => teams.set(e.dept, (teams.get(e.dept) ?? 0) + 1));
            const top = [...teams.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
            return (
              <li key={site.id} className="hs-item">
                <div className="hs-head">
                  <div>
                    <strong>{t(site.name[0], site.name[1], lang)}</strong>
                    <small>{t(site.place[0], site.place[1], lang)}</small>
                  </div>
                  <div className="hs-count">
                    <b>{staff.length.toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US')}</b>
                    <small>{t('people', 'জন', lang)}</small>
                  </div>
                </div>
                <div
                  className="hs-bar"
                  role="img"
                  aria-label={t(`${share}% of all staff`, `মোট কর্মীর ${bn(share)}%`, lang)}
                >
                  <span style={{ width: `${share}%` }} />
                </div>
                <p className="hs-meta">
                  {staff.length === 0
                    ? t('Nobody assigned here yet.', 'এখানে এখনো কেউ নেই।', lang)
                    : top.map(([dept, n]) => `${dept} ${n}`).join(' · ')}
                  {onLeave > 0 ? ` · ${t(`${onLeave} on leave`, `${bn(onLeave)} জন ছুটিতে`, lang)}` : ''}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
