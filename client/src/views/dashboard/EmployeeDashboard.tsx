import { Activity, Building2, CalendarDays, Car, Droplets, QrCode, Receipt, ShieldCheck, UserCheck, type LucideIcon } from 'lucide-react';
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
          <div className="modal" style={{ maxWidth: '380px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-hd" style={{ padding: '11px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <QrCode size={16} color="var(--brand-crimson)" />
                <h3 style={{ margin: 0, fontSize: '14px' }}>
                  {t('Digital access badge', 'ডিজিটাল প্রবেশপত্র', lang)}
                </h3>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: '999px',
                    background: 'var(--status-success-bg, rgba(16, 185, 129, 0.12))',
                    color: 'var(--status-success-text, #065F46)',
                  }}
                >
                  {t('Active', 'সক্রিয়', lang)}
                </span>
              </div>
              <button className="modal-close" style={{ width: '28px', height: '28px' }} onClick={() => setShowGatePassModal?.(false)}>×</button>
            </div>

            <div className="modal-body" style={{ padding: '14px 16px' }}>
              <div
                style={{
                  border: '1px solid var(--border-2)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  background: 'var(--surface-0)',
                  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.06)',
                }}
              >
                {/* Company Crest Banner */}
                <div
                  style={{
                    background: 'linear-gradient(135deg, var(--surface-inverse) 0%, var(--brand-crimson-dark) 100%)',
                    color: 'var(--text-on-brand)',
                    padding: '9px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                  }}
                >
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '10.5px', fontWeight: 800, letterSpacing: '0.4px' }}>
                      BASHUNDHARA OIL & GAS CO. LTD.
                    </div>
                    <div style={{ fontSize: '9.5px', opacity: 0.8 }}>
                      {t('Official Employee Gate Credential', 'দাপ্তরিক কর্মী গেট পরিচয়পত্র', lang)}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '9.5px',
                      fontFamily: 'monospace',
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: 'rgba(255, 255, 255, 0.14)',
                      color: 'var(--brand-gold)',
                    }}
                  >
                    {user.empId}
                  </span>
                </div>

                {/* Employee Identity Row */}
                <div
                  style={{
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    borderBottom: '1px solid var(--border-1)',
                    background: 'var(--surface-1)',
                  }}
                >
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      background: 'var(--surface-inverse)',
                      color: 'var(--brand-gold)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '15px',
                      fontWeight: 900,
                      border: '1.5px solid var(--brand-gold)',
                      flexShrink: 0,
                    }}
                  >
                    {me?.initials ?? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ textAlign: 'left', minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-1)', lineHeight: 1.2 }}>
                      {t(user.name, user.nameBn, lang)}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-2)', fontWeight: 600, marginTop: '1px' }}>
                      {t(user.label, user.labelBn, lang)}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: '1px' }}>
                      {t(user.dept, user.deptBn, lang)}
                    </div>
                  </div>
                </div>

                {/* Side-by-Side QR Code & Gate Metadata Grid (zero empty space) */}
                <div
                  style={{
                    padding: '10px 12px',
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr',
                    gap: '12px',
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid var(--border-2)',
                      borderRadius: '10px',
                      padding: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <QrCode size={72} color="#0F172A" />
                    <span style={{ fontSize: '8.5px', fontWeight: 800, letterSpacing: '0.5px', color: '#475569', marginTop: '3px' }}>
                      {t('SCAN AT GATE', 'গেটে স্ক্যান করুন', lang)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' }}>
                    <div
                      style={{
                        padding: '5px 8px',
                        borderRadius: '7px',
                        background: 'var(--surface-1)',
                        border: '1px solid var(--border-1)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '7px',
                      }}
                    >
                      <Building2 size={13} color="var(--status-info)" style={{ flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: '9.5px', color: 'var(--text-3)', lineHeight: 1.1 }}>{t('Primary Site', 'প্রধান কর্মস্থল', lang)}</div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-1)' }}>
                          {me?.assignedSite === 'PLANT_KERANIGANJ'
                            ? t('Keraniganj Plant', 'কেরানীগঞ্জ প্ল্যান্ট', lang)
                            : me?.assignedSite === 'TERMINAL_CTG'
                              ? t('Chattogram Terminal', 'চট্টগ্রাম টার্মিনাল', lang)
                              : t('Dhaka Corporate HQ', 'ঢাকা সদর দপ্তর', lang)}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        padding: '5px 8px',
                        borderRadius: '7px',
                        background: 'var(--surface-1)',
                        border: '1px solid var(--border-1)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '7px',
                      }}
                    >
                      <ShieldCheck size={13} color="var(--status-success)" style={{ flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: '9.5px', color: 'var(--text-3)', lineHeight: 1.1 }}>{t('Gate Clearance', 'গেট অনুমতি', lang)}</div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-1)' }}>
                          {t('HQ & Refinery Turnstiles', 'সদর দপ্তর ও রিফাইনারি গেট', lang)}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        padding: '5px 8px',
                        borderRadius: '7px',
                        background: 'var(--surface-1)',
                        border: '1px solid var(--border-1)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '7px',
                      }}
                    >
                      <Droplets size={13} color="var(--brand-crimson)" style={{ flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: '9.5px', color: 'var(--text-3)', lineHeight: 1.1 }}>{t('Blood Group & Status', 'রক্তের গ্রুপ ও অবস্থা', lang)}</div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-1)' }}>
                          {me?.bloodGroup ?? 'O+'} · {rec && rec.locationStatus !== 'absent' ? t(`In ${rec.inTime}`, `প্রবেশ ${rec.inTime}`, lang) : t('Ready to scan', 'স্ক্যানের জন্য প্রস্তুত', lang)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '8px', fontSize: '10.5px', color: 'var(--text-3)', textAlign: 'center' }}>
                {t('Present this QR badge at the gate reader or to security staff.', 'গেট রিডারে বা নিরাপত্তা কর্মীকে এই কিউআর ব্যাজটি দেখান।', lang)}
              </div>
            </div>

            <div className="modal-ft" style={{ padding: '9px 16px' }}>
              <button className="btn-sm-ghost" onClick={() => setShowGatePassModal?.(false)}>{t('Close', 'বন্ধ করুন', lang)}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
