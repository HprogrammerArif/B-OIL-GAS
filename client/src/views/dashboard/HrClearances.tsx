import { useState } from 'react';
import { Check, Clock, UserCheck } from 'lucide-react';
import { t, type Lang } from '../../types';
import { useEmployeeStore, type Employee, type ExitClearance } from '../../store/employeeStore';
import { Button, EmptyState, StatusPill } from '../../components/ui';
import OffboardClearanceDrawer from '../../components/workforce/OffboardClearanceDrawer';

type StepKey = 'itAccessRevoked' | 'rfidGateBadgeSurrendered' | 'vehicleFuelCardReturned' | 'financeAccountsSettled';

/** The four hand-backs an exit needs. `team` is who we wait on while it is open. */
const STEPS: ReadonlyArray<{ key: StepKey; label: readonly [string, string]; team: readonly [string, string] }> = [
  { key: 'itAccessRevoked', label: ['IT access', 'আইটি অ্যাক্সেস'], team: ['IT', 'আইটি'] },
  { key: 'rfidGateBadgeSurrendered', label: ['Gate badge', 'গেট ব্যাজ'], team: ['Security', 'নিরাপত্তা'] },
  { key: 'vehicleFuelCardReturned', label: ['Vehicle & fuel card', 'গাড়ি ও জ্বালানি কার্ড'], team: ['Transport', 'পরিবহন'] },
  { key: 'financeAccountsSettled', label: ['Dues settled', 'পাওনা নিষ্পত্তি'], team: ['Finance', 'অর্থ'] },
];

const isDone = (c: ExitClearance | undefined, key: StepKey) => !!c?.[key];
const doneCount = (e: Employee) => STEPS.filter((s) => isDone(e.clearance, s.key)).length;

/** "IT", "IT and Finance", "IT, Security and Finance". */
function joinList(items: string[], lang: Lang): string {
  if (items.length <= 1) return items.join('');
  const and = t('and', 'ও', lang);
  return `${items.slice(0, -1).join(', ')} ${and} ${items[items.length - 1]}`;
}

/** People who are leaving, and which hand-backs are still open. */
export default function HrClearances({ lang, onOpenWorkforce }: { lang: Lang; onOpenWorkforce: () => void }) {
  const { employees } = useEmployeeStore();
  const [openId, setOpenId] = useState<string | null>(null);

  const leaving = employees.filter((e) => e.clearance);
  const open = leaving.filter((e) => doneCount(e) < STEPS.length);
  const closed = leaving.filter((e) => doneCount(e) === STEPS.length);
  const bn = (n: number) => n.toLocaleString('bn-BD');
  const openEmployee = employees.find((e) => e.id === openId) ?? null;

  return (
    <section className="tab-pane-fade dash-section" aria-labelledby="hc-title">
      <header className="dash-sec-head">
        <div>
          <h3 id="hc-title">{t('People leaving', 'যারা চলে যাচ্ছেন', lang)}</h3>
          <p>{t('Before someone leaves, four things must be handed back. Open a person to tick them off.', 'কেউ চলে যাওয়ার আগে চারটি জিনিস ফেরত দিতে হয়। টিক দিতে ব্যক্তিকে খুলুন।', lang)}</p>
        </div>
        <div className="cn-head-actions">
          {open.length > 0 && (
            <StatusPill tone="warn">{t(`${open.length} still open`, `${bn(open.length)} জনের বাকি`, lang)}</StatusPill>
          )}
          <Button variant="secondary" size="sm" onClick={onOpenWorkforce}>{t('Start an exit', 'বিদায় শুরু করুন', lang)}</Button>
        </div>
      </header>

      {open.length === 0 ? (
        <EmptyState
          compact
          icon={<UserCheck size={20} />}
          title={t('Nobody is leaving right now', 'এখন কেউ চলে যাচ্ছেন না', lang)}
          description={t('To start an exit, open the person in Workforce.', 'বিদায় শুরু করতে ওয়ার্কফোর্সে ব্যক্তিকে খুলুন।', lang)}
        />
      ) : (
        <ul className="hc-list">
          {open.map((e) => {
            const waiting = STEPS.filter((s) => !isDone(e.clearance, s.key)).map((s) => t(s.team[0], s.team[1], lang));
            return (
              <li key={e.id} className="hc-item">
                <div className="hc-top">
                  <div className="hc-who">
                    <strong>{t(e.name, e.nameBn ?? e.name, lang)}</strong>
                    <small>
                      {t(e.designation, e.designationBn ?? e.designation, lang)}
                      {e.exitDate ? ` · ${t('leaves', 'বিদায়', lang)} ${e.exitDate}` : ''}
                    </small>
                  </div>
                  <Button size="sm" onClick={() => setOpenId(e.id)}>{t('Open', 'খুলুন', lang)}</Button>
                </div>
                <ul className="hc-steps" aria-label={t('Hand-backs', 'ফেরত দেওয়ার তালিকা', lang)}>
                  {STEPS.map((s) => {
                    const ok = isDone(e.clearance, s.key);
                    return (
                      <li key={s.key} className={ok ? 'is-done' : ''}>
                        {ok ? <Check size={12} aria-hidden /> : <Clock size={12} aria-hidden />}
                        {t(s.label[0], s.label[1], lang)}
                      </li>
                    );
                  })}
                </ul>
                <p className="hc-wait">{t(`Waiting on ${joinList(waiting, lang)}.`, `${joinList(waiting, lang)}-এর অপেক্ষায়।`, lang)}</p>
              </li>
            );
          })}
        </ul>
      )}

      {closed.length > 0 && (
        <details className="hc-done">
          <summary>{t(`Finished (${closed.length})`, `সম্পন্ন (${bn(closed.length)})`, lang)}</summary>
          <ul>
            {closed.map((e) => (
              <li key={e.id}>
                <strong>{t(e.name, e.nameBn ?? e.name, lang)}</strong>
                <small>{e.clearance?.clearedAt ? `${t('Cleared', 'ছাড়পত্র', lang)} ${e.clearance.clearedAt}` : e.exitDate ?? ''}</small>
              </li>
            ))}
          </ul>
        </details>
      )}

      <OffboardClearanceDrawer employee={openEmployee} onClose={() => setOpenId(null)} lang={lang} />
    </section>
  );
}
