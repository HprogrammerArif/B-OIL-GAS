import { Activity, CalendarDays, Car, QrCode, Receipt, UserCheck, type LucideIcon } from 'lucide-react';
import { t, type AppView } from '../../types';
import { useCurrentUser } from '../../auth/session';
import { useOperationsStore } from '../../store/operationsStore';
import { useEmployeeStore } from '../../store/employeeStore';
import { Button, EmptyState } from '../../components/ui';
import { DashboardSubViewProps } from './types';
import { CASUAL_LEAVE_ENTITLEMENT_DAYS, useDashboardData } from './useDashboardData';

const SICK_LEAVE_ENTITLEMENT_DAYS = 14;
const EARNED_LEAVE_ENTITLEMENT_DAYS = 20;

interface EmployeeDashboardProps extends DashboardSubViewProps {
  showGatePassModal?: boolean;
  setShowGatePassModal?: (show: boolean) => void;
  onNavigate?: (view: AppView) => void;
}

interface ActivityEntry {
  icon: LucideIcon;
  title: string;
  detail: string;
  time: string;
}

export default function EmployeeDashboard({
  lang,
  activeTab,
  showGatePassModal,
  setShowGatePassModal,
  onNavigate,
}: EmployeeDashboardProps) {
  const user = useCurrentUser();
  const data = useDashboardData();
  const { leaveRequests } = useOperationsStore();
  const { employees } = useEmployeeStore();

  const me = employees.find((e) => e.id === user?.empId) ?? null;
  const myLeave = leaveRequests.filter((l) => l.empId === user?.empId);
  const usedDays = (type: string) =>
    myLeave.filter((l) => l.status === 'approved' && l.leaveType === type).reduce((s, l) => s + l.days, 0);
  const pendingLeave = myLeave.filter((l) => l.status === 'pending');
  const bn = (n: number) => n.toLocaleString('bn-BD');
  const num = (n: number) => (lang === 'bn' ? bn(n) : String(n));

  const balances = [
    { label: t('Casual leave', 'ক্যাজুয়াল ছুটি', lang), used: usedDays('Casual Leave'), total: CASUAL_LEAVE_ENTITLEMENT_DAYS },
    { label: t('Sick leave', 'অসুস্থতাজনিত ছুটি', lang), used: usedDays('Sick Leave'), total: SICK_LEAVE_ENTITLEMENT_DAYS },
    { label: t('Earned leave', 'অর্জিত ছুটি', lang), used: usedDays('Earned Leave'), total: EARNED_LEAVE_ENTITLEMENT_DAYS },
  ];

  /* Recent activity: assembled from the user's own records across stores */
  const activity: ActivityEntry[] = [];
  const rec = data.workforce.myRecord;
  if (rec && rec.locationStatus !== 'absent') {
    activity.push({
      icon: UserCheck,
      title: t('You punched in', 'আপনি পাঞ্চ-ইন করেছেন', lang),
      detail: t(
        `${rec.inTime} at ${rec.site === 'PLANT_KERANIGANJ' ? 'Keraniganj plant' : 'Dhaka head office'}${rec.locationStatus === 'late' ? ' (late)' : ''}`,
        `${rec.inTime}, ${rec.site === 'PLANT_KERANIGANJ' ? 'কেরানীগঞ্জ প্ল্যান্টে' : 'ঢাকা সদর দপ্তরে'}${rec.locationStatus === 'late' ? ' (বিলম্বে)' : ''}`,
        lang,
      ),
      time: t('Today', 'আজ', lang),
    });
  }
  for (const c of data.claims.mine.slice(0, 3)) {
    const status =
      c.status === 'pending_hod' ? t('waiting for your department head', 'বিভাগীয় প্রধানের অপেক্ষায়', lang)
        : c.status === 'pending_finance' ? t('waiting for finance', 'অর্থ বিভাগের অপেক্ষায়', lang)
          : c.status === 'approved' ? t('approved', 'অনুমোদিত', lang)
            : c.status === 'settled' ? t('paid', 'পরিশোধিত', lang)
              : t('sent back to you', 'আপনার কাছে ফেরত', lang);
    activity.push({
      icon: Receipt,
      title: t(`Claim for ${c.purpose}`, `${c.purpose}-এর দাবি`, lang),
      detail: `৳${c.amount.toLocaleString('en-IN')} · ${status}`,
      time: c.dateSubmitted,
    });
  }
  for (const r of data.fleet.myRequisitions.slice(0, 2)) {
    const status = r.status === 'pending' ? t('waiting for a vehicle', 'গাড়ির অপেক্ষায়', lang)
      : r.status === 'assigned' ? t('vehicle ready', 'গাড়ি প্রস্তুত', lang)
        : t('on the road', 'পথে আছে', lang);
    activity.push({
      icon: Car,
      title: t(`Vehicle request: ${r.from.split(',')[0]} to ${r.to.split(',')[0]}`, `গাড়ির আবেদন: ${r.from.split(',')[0]} থেকে ${r.to.split(',')[0]}`, lang),
      detail: status,
      time: r.createdAt,
    });
  }
  for (const l of pendingLeave.slice(0, 2)) {
    activity.push({
      icon: CalendarDays,
      title: t(`${l.leaveType} request`, `${l.leaveType} আবেদন`, lang),
      detail: `${l.fromDate} – ${l.toDate} (${num(l.days)} ${t('days', 'দিন', lang)}) · ${t('waiting for HR', 'এইচআরের অপেক্ষায়', lang)}`,
      time: l.submittedAt,
    });
  }

  return (
    <>
      {activeTab === 'activity' && (
        <div className="tab-pane-fade my-grid">
          <section className="dash-section" aria-labelledby="my-leave-title">
            <header className="dash-sec-head">
              <div>
                <h3 id="my-leave-title">{t('My leave in 2026', 'আমার ২০২৬ সালের ছুটি', lang)}</h3>
                <p>{t('Days you can still take this year.', 'এ বছর আর যত দিন ছুটি নিতে পারবেন।', lang)}</p>
              </div>
              <Button size="sm" onClick={() => onNavigate?.('attendance')}>{t('Request leave', 'ছুটির আবেদন', lang)}</Button>
            </header>
            <ul className="my-leave">
              {balances.map((b) => {
                const left = Math.max(0, b.total - b.used);
                return (
                  <li key={b.label}>
                    <span>{b.label}</span>
                    <strong>{t(`${left} days left`, `${bn(left)} দিন বাকি`, lang)}</strong>
                    <small>{t(`${b.used} of ${b.total} used`, `${bn(b.total)}-এর মধ্যে ${bn(b.used)} ব্যবহৃত`, lang)}</small>
                    <div className="hs-bar" aria-hidden><span style={{ width: `${Math.min(100, (b.used / b.total) * 100)}%` }} /></div>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="dash-section" aria-labelledby="my-act-title">
            <header className="dash-sec-head">
              <div>
                <h3 id="my-act-title">{t('What happened recently', 'সাম্প্রতিক ঘটনা', lang)}</h3>
                <p>{t('Your latest attendance, claims, travel and leave.', 'আপনার সর্বশেষ উপস্থিতি, দাবি, ভ্রমণ ও ছুটি।', lang)}</p>
              </div>
            </header>
            {activity.length === 0 ? (
              <EmptyState compact icon={<Activity size={20} />} title={t('Nothing yet', 'এখনো কিছু নেই', lang)} description={t('Punch in, send a claim or ask for a vehicle and it will show here.', 'পাঞ্চ-ইন, দাবি জমা বা গাড়ির আবেদন করলে এখানে দেখা যাবে।', lang)} />
            ) : (
              <ul className="my-act">
                {activity.map((a, i) => (
                  <li key={i}>
                    <span className="my-act-icon"><a.icon size={15} aria-hidden /></span>
                    <div>
                      <strong>{a.title}</strong>
                      <small>{a.detail}</small>
                    </div>
                    <time>{a.time}</time>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {/* Digital gate pass */}
      {showGatePassModal && user && (
        <div className="modal-bg" onClick={() => setShowGatePassModal?.(false)}>
          <div className="modal" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-hd" style={{ background: 'var(--brand-crimson)', color: 'var(--text-on-brand)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <QrCode size={18} color="var(--text-on-brand)" />
                <h3 style={{ color: 'var(--text-on-brand)', margin: 0 }}>
                  {t('Digital access badge', 'ডিজিটাল প্রবেশপত্র', lang)}
                </h3>
              </div>
              <button className="modal-close" style={{ color: 'var(--text-on-brand)' }} onClick={() => setShowGatePassModal?.(false)}>×</button>
            </div>

            <div className="modal-body" style={{ textAlign: 'center' }}>
              <div style={{ border: '2px solid var(--border-strong)', borderRadius: '12px', padding: '20px 16px', background: 'var(--surface-0)', boxShadow: '0 4px 14px rgba(0,0,0,0.08)' }}>
                <div style={{ fontSize: '13px', fontWeight: 900, color: 'var(--brand-crimson)', letterSpacing: '0.5px' }}>
                  BASHUNDHARA OIL AND GAS COMPANY LTD.
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-3)', marginBottom: '12px' }}>
                  {t('Corporate HQ & Keraniganj Bitumen Refinery', 'কর্পোরেট সদর দপ্তর ও কেরানীগঞ্জ বিটুমিন রিফাইনারি', lang)}
                </div>

                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--surface-inverse)', color: 'var(--brand-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 900, margin: '0 auto 8px', border: '2px solid var(--brand-gold)' }}>
                  {me?.initials ?? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>

                <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-1)' }}>{t(user.name, user.nameBn, lang)}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{t(user.label, user.labelBn, lang)}</div>
                <div style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--brand-crimson)', marginTop: '2px' }}>
                  {user.empId}
                </div>

                <div style={{ margin: '14px 0 10px', display: 'flex', justifyContent: 'center' }}>
                  <QrCode size={110} color="var(--text-1)" />
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '8px', fontSize: '10.5px', borderTop: '1px solid var(--border-2)', paddingTop: '10px' }}>
                  <div>{t('Blood group', 'রক্তের গ্রুপ', lang)}: <strong>{me?.bloodGroup ?? '—'}</strong></div>
                  <div>{t('Site', 'কর্মস্থল', lang)}: <strong>{me?.assignedSite === 'PLANT_KERANIGANJ' ? t('Keraniganj plant', 'কেরানীগঞ্জ প্ল্যান্ট', lang) : me?.assignedSite === 'TERMINAL_CTG' ? t('Chattogram terminal', 'চট্টগ্রাম টার্মিনাল', lang) : t('Dhaka HQ', 'ঢাকা সদর দপ্তর', lang)}</strong></div>
                </div>
              </div>

              <div style={{ marginTop: '12px', fontSize: '11px', color: 'var(--text-3)', fontWeight: 600 }}>
                {t('Show this QR at the gate turnstile or to security.', 'গেট টার্নস্টাইলে বা নিরাপত্তা কর্মীকে এই কিউআর দেখান।', lang)}
              </div>
            </div>

            <div className="modal-ft">
              <button className="btn-sm-ghost" onClick={() => setShowGatePassModal?.(false)}>{t('Close', 'বন্ধ করুন', lang)}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
