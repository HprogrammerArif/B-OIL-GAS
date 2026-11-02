import { Activity, Award, QrCode } from 'lucide-react';
import { t } from '../../types';
import { useCurrentUser } from '../../auth/session';
import { useOperationsStore } from '../../store/operationsStore';
import { useEmployeeStore } from '../../store/employeeStore';
import { EmptyState } from '../../components/ui';
import { DashboardSubViewProps } from './types';
import { CASUAL_LEAVE_ENTITLEMENT_DAYS, useDashboardData } from './useDashboardData';

const SICK_LEAVE_ENTITLEMENT_DAYS = 14;
const EARNED_LEAVE_ENTITLEMENT_DAYS = 20;

interface EmployeeDashboardProps extends DashboardSubViewProps {
  showGatePassModal?: boolean;
  setShowGatePassModal?: (show: boolean) => void;
}

interface ActivityEntry {
  icon: string;
  title: string;
  detail: string;
  time: string;
}

export default function EmployeeDashboard({
  lang,
  activeTab,
  showGatePassModal,
  setShowGatePassModal
}: EmployeeDashboardProps) {
  const user = useCurrentUser();
  const data = useDashboardData();
  const { leaveRequests } = useOperationsStore();
  const { employees } = useEmployeeStore();

  const me = employees.find((e) => e.id === user?.empId) ?? null;
  const myLeave = leaveRequests.filter((l) => l.empId === user?.empId);
  const usedDays = (type: string) =>
    myLeave.filter((l) => l.status === 'approved' && l.leaveType === type).reduce((s, l) => s + l.days, 0);
  const casualUsed = usedDays('Casual Leave');
  const sickUsed = usedDays('Sick Leave');
  const earnedUsed = usedDays('Earned Leave');
  const pendingLeave = myLeave.filter((l) => l.status === 'pending');

  /* Activity feed: assembled from the user's own records across stores */
  const activity: ActivityEntry[] = [];
  const rec = data.workforce.myRecord;
  if (rec && rec.locationStatus !== 'absent') {
    activity.push({
      icon: '✅',
      title: t('Attendance logged', 'উপস্থিতি রেকর্ড হয়েছে', lang),
      detail: t(
        `Punched in ${rec.inTime} · ${rec.site === 'PLANT_KERANIGANJ' ? 'Keraniganj plant' : 'Dhaka HQ'}${rec.locationStatus === 'late' ? ' · late' : ''}`,
        `পাঞ্চ-ইন ${rec.inTime} · ${rec.site === 'PLANT_KERANIGANJ' ? 'কেরানীগঞ্জ প্ল্যান্ট' : 'ঢাকা সদর দপ্তর'}${rec.locationStatus === 'late' ? ' · বিলম্বে' : ''}`,
        lang,
      ),
      time: t('Today', 'আজ', lang),
    });
  }
  for (const c of data.claims.mine.slice(0, 3)) {
    const status =
      c.status === 'pending_hod' ? t('Awaiting HOD', 'বিভাগীয় প্রধানের অপেক্ষায়', lang)
        : c.status === 'pending_finance' ? t('Awaiting finance', 'অর্থ বিভাগের অপেক্ষায়', lang)
          : c.status === 'approved' ? t('Approved', 'অনুমোদিত', lang)
            : c.status === 'settled' ? t('Settled', 'নিষ্পত্তি', lang)
              : t('Returned', 'ফেরত', lang);
    activity.push({
      icon: '🧾',
      title: t(`Claim ${c.id}`, `দাবি ${c.id}`, lang),
      detail: `${c.purpose} · ৳${c.amount.toLocaleString('en-IN')} · ${status}`,
      time: c.dateSubmitted,
    });
  }
  for (const r of data.fleet.myRequisitions.slice(0, 2)) {
    activity.push({
      icon: '🚗',
      title: t('Vehicle requisition', 'যানবাহন আবেদন', lang),
      detail: `${r.id} · ${r.from.split(',')[0]} → ${r.to.split(',')[0]} · ${r.status === 'pending' ? t('Pending', 'অপেক্ষমান', lang) : r.status === 'assigned' ? t('Assigned', 'বরাদ্দকৃত', lang) : t('In transit', 'চলমান', lang)}`,
      time: r.createdAt,
    });
  }
  if (data.shuttle.mySeat) {
    activity.push({
      icon: '🚌',
      title: t('Shuttle seat active', 'শাটল আসন সক্রিয়', lang),
      detail: t(`Seat #${data.shuttle.mySeat.num}${data.shuttle.mySeat.pickupPoint ? ` · ${data.shuttle.mySeat.pickupPoint}` : ''}`, `আসন #${data.shuttle.mySeat.num}${data.shuttle.mySeat.pickupPoint ? ` · ${data.shuttle.mySeat.pickupPoint}` : ''}`, lang),
      time: data.shuttle.mySeat.pickupTime ?? '',
    });
  }
  for (const l of pendingLeave.slice(0, 2)) {
    activity.push({
      icon: '🗓️',
      title: t(`${l.leaveType} requested`, `${l.leaveType} আবেদন`, lang),
      detail: `${l.fromDate} – ${l.toDate} · ${l.days} ${t('days', 'দিন', lang)} · ${t('Pending', 'অপেক্ষমান', lang)}`,
      time: l.submittedAt,
    });
  }

  const balanceTile = (label: string, used: number, total: number) => (
    <div style={{ background: 'var(--surface-0)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-1)' }}>
      <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{label}</div>
      <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-1)' }}>{Math.max(0, total - used)} / {total}</div>
      <div style={{ fontSize: '10px', color: used > 0 ? 'var(--status-warning)' : 'var(--status-success)' }}>
        {t(`${used} days used`, `${used.toLocaleString('bn-BD')} দিন ব্যবহৃত`, lang)}
      </div>
    </div>
  );

  return (
    <>
      {activeTab === 'activity' && (
        <div className="col-2 mb-5 tab-pane-fade">
          <div className="card">
            <div className="card-hd">
              <div className="card-hd-left">
                <div className="card-hd-icon"><Activity size={16} /></div>
                <div>
                  <div className="card-title">{t('My recent activity', 'আমার সাম্প্রতিক কার্যক্রম', lang)}</div>
                  <div className="card-subtitle">{t('Your latest records across attendance, claims, travel and leave', 'উপস্থিতি, দাবি, ভ্রমণ ও ছুটিতে আপনার সর্বশেষ রেকর্ড', lang)}</div>
                </div>
              </div>
            </div>
            <div className="card-body">
              {activity.length === 0 ? (
                <EmptyState compact title={t('No activity yet', 'এখনো কোনো কার্যক্রম নেই', lang)} description={t('Punch in, submit a claim or request a vehicle to see it here.', 'পাঞ্চ-ইন, দাবি জমা বা গাড়ি আবেদন করলে এখানে দেখা যাবে।', lang)} />
              ) : (
                <div className="activity-timeline">
                  {activity.map((act, i) => (
                    <div key={i} className="activity-item">
                      <div className="activity-dot">{act.icon}</div>
                      <div className="activity-content">
                        <div className="activity-title">{act.title}</div>
                        <div className="activity-detail">{act.detail}</div>
                        <div className="activity-time">{act.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-hd">
              <div className="card-hd-left">
                <div className="card-hd-icon"><Award size={16} /></div>
                <div>
                  <div className="card-title">{t('Leave balance', 'ছুটির স্থিতি', lang)}</div>
                  <div className="card-subtitle">{t('Calendar year 2026 entitlement', '২০২৬ পঞ্জিকাবর্ষের প্রাপ্যতা', lang)}</div>
                </div>
              </div>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                {balanceTile(t('Casual leave', 'ক্যাজুয়াল ছুটি', lang), casualUsed, CASUAL_LEAVE_ENTITLEMENT_DAYS)}
                {balanceTile(t('Sick leave', 'অসুস্থতাজনিত ছুটি', lang), sickUsed, SICK_LEAVE_ENTITLEMENT_DAYS)}
                {balanceTile(t('Earned leave', 'অর্জিত ছুটি', lang), earnedUsed, EARNED_LEAVE_ENTITLEMENT_DAYS)}
                <div style={{ background: 'var(--surface-0)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-1)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{t('Pending requests', 'অপেক্ষমান আবেদন', lang)}</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: pendingLeave.length > 0 ? 'var(--status-warning)' : 'var(--text-1)' }}>{pendingLeave.length}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-3)' }}>{t('Awaiting HR decision', 'এইচআর সিদ্ধান্তের অপেক্ষায়', lang)}</div>
                </div>
              </div>
            </div>
          </div>
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
