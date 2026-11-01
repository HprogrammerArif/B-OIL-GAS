import { useState, useMemo } from 'react';
import { ViewProps, t } from '../types';
import { showToast } from '../components/ToastManager';
import {
  Clock, MapPin, Users, LogIn, LogOut, CalendarDays, Plus, AlertTriangle, Navigation, ShieldAlert,
} from 'lucide-react';
import { useOperationsStore, type ShiftWorker, type LeaveRequestItem } from '../store/operationsStore';
import { approvalStore } from '../store/approvalStore';
import { useCan } from '../auth/session';
import { today } from '../lib/clock';
import { Button, Card, EmptyState, FormField, Modal, PageHeader, StatusPill, type StatusTone } from '../components/ui';
import {
  SITES, SITE_LIST, type SiteId, type GeoFix, requestPosition, nearestSite, isLateFor, formatDistance, useAttendanceScope,
} from './attendance/config';

/** Annual entitlements (days) — see docs/platform/06 BR-LV. */
const LEAVE_ENTITLEMENT: Record<LeaveRequestItem['leaveType'], number> = {
  'Casual Leave': 10,
  'Sick Leave': 14,
  'Earned Leave': 20,
  'Late Arrival Note': 0,
};
const LEAVE_TYPES: LeaveRequestItem['leaveType'][] = ['Casual Leave', 'Sick Leave', 'Earned Leave'];

const LEAVE_LABEL: Record<LeaveRequestItem['leaveType'], [string, string]> = {
  'Casual Leave': ['Casual leave', 'নৈমিত্তিক ছুটি'],
  'Sick Leave': ['Sick leave', 'অসুস্থতাজনিত ছুটি'],
  'Earned Leave': ['Earned leave', 'অর্জিত ছুটি'],
  'Late Arrival Note': ['Late arrival note', 'বিলম্বে আগমনের নোট'],
};

type LocationState =
  | { phase: 'idle' }
  | { phase: 'locating' }
  | { phase: 'outside'; fix: GeoFix; siteId: SiteId; distanceM: number }
  | { phase: 'unavailable'; reason: string };

function statusPill(w: ShiftWorker, lang: ViewProps['lang']) {
  const punchedOut = w.outTime !== '-' && w.outTime !== 'On Duty';
  let tone: StatusTone = 'success';
  let label = t('On site', 'সাইটে উপস্থিত', lang);
  if (punchedOut) {
    tone = 'info';
    label = t(`Punched out ${w.outTime}`, `পাঞ্চ-আউট ${w.outTime}`, lang);
  } else if (w.locationStatus === 'late') {
    tone = 'warn';
    label = t('Late', 'বিলম্বে', lang);
  } else if (w.locationStatus === 'remote_approved') {
    tone = 'info';
    label = t('Remote (approved)', 'দূরবর্তী (অনুমোদিত)', lang);
  } else if (w.locationStatus === 'manual_review') {
    tone = 'purple';
    label = t('Manual check-in · review', 'ম্যানুয়াল চেক-ইন · পর্যালোচনা', lang);
  } else if (w.locationStatus === 'absent') {
    tone = 'neutral';
    label = t('On leave', 'ছুটিতে', lang);
  }
  return <StatusPill tone={tone}>{label}</StatusPill>;
}

function parseDays(from: string, to: string): number {
  const a = new Date(from).getTime();
  const b = new Date(to).getTime();
  if (Number.isNaN(a) || Number.isNaN(b) || b < a) return 0;
  return Math.round((b - a) / 86_400_000) + 1;
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function AttendanceView({ role, lang, onNavigate }: ViewProps) {
  const { attendanceRoster, leaveRequests, punchAttendance, addLeaveRequest } = useOperationsStore();
  const { user, visible, seesOthers } = useAttendanceScope(attendanceRoster);
  const canApproveLeave = useCan('leave:approve');

  const myRecord = user ? attendanceRoster.find((w) => w.id === user.empId) ?? null : null;
  const onDuty = !!myRecord && myRecord.outTime === 'On Duty' && myRecord.locationStatus !== 'absent';
  const onLeaveToday = myRecord?.locationStatus === 'absent';
  const defaultSite: SiteId = user?.site === 'PLANT_KERANIGANJ' ? 'PLANT_KERANIGANJ' : 'HQ_BARIDHARA';

  const [loc, setLoc] = useState<LocationState>({ phase: 'idle' });
  const [manualSite, setManualSite] = useState<SiteId>(defaultSite);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveType, setLeaveType] = useState<LeaveRequestItem['leaveType']>('Casual Leave');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');
  const [leaveError, setLeaveError] = useState<string | null>(null);

  const myLeaves = useMemo(
    () => (user ? leaveRequests.filter((l) => l.empId === user.empId) : []),
    [leaveRequests, user],
  );
  const teamLeaves = useMemo(
    () => (user && seesOthers ? leaveRequests.filter((l) => l.empId !== user.empId && visible.some((w) => w.id === l.empId || w.dept === l.dept)) : []),
    [leaveRequests, user, seesOthers, visible],
  );
  const balances = useMemo(
    () =>
      LEAVE_TYPES.map((type) => {
        const used = myLeaves.filter((l) => l.leaveType === type && l.status === 'approved').reduce((s, l) => s + l.days, 0);
        return { type, used, left: Math.max(0, LEAVE_ENTITLEMENT[type] - used) };
      }),
    [myLeaves],
  );

  const teamStats = useMemo(() => {
    const present = visible.filter((w) => w.locationStatus !== 'absent').length;
    return {
      total: visible.length,
      present,
      late: visible.filter((w) => w.locationStatus === 'late').length,
      review: visible.filter((w) => w.locationStatus === 'manual_review').length,
      onLeave: visible.filter((w) => w.locationStatus === 'absent').length,
    };
  }, [visible]);

  const recordPunchIn = (siteId: SiteId, status: ShiftWorker['locationStatus'], distanceM: number) => {
    punchAttendance(role, 'in', siteId, { locationStatus: status, distanceMeters: distanceM });
    setLoc({ phase: 'idle' });
    const siteName = t(...SITES[siteId].label, lang);
    showToast(
      status === 'manual_review'
        ? distanceM > 0
          ? t(`Checked in ${formatDistance(distanceM)} from ${siteName} — flagged for supervisor review.`, `${siteName} থেকে ${formatDistance(distanceM)} দূরে চেক-ইন — সুপারভাইজারের পর্যালোচনার জন্য চিহ্নিত।`, lang)
          : t(`Checked in at ${siteName} without a location fix — flagged for supervisor review.`, `${siteName}-এ অবস্থান যাচাই ছাড়া চেক-ইন — সুপারভাইজারের পর্যালোচনার জন্য চিহ্নিত।`, lang)
        : status === 'late'
          ? t(`Punched in at ${siteName} (${formatDistance(distanceM)} from gate) — marked late.`, `${siteName}-এ পাঞ্চ-ইন (${formatDistance(distanceM)}) — বিলম্বে চিহ্নিত।`, lang)
          : t(`Punched in at ${siteName} (${formatDistance(distanceM)} from gate).`, `${siteName}-এ পাঞ্চ-ইন (${formatDistance(distanceM)})।`, lang),
      status === 'inside_geofence' ? 'success' : 'warn',
    );
  };

  const handlePunchIn = async () => {
    setLoc({ phase: 'locating' });
    const result = await requestPosition();
    if (result.kind === 'unavailable') {
      const reason = {
        denied: t('Location permission was denied.', 'অবস্থানের অনুমতি দেওয়া হয়নি।', lang),
        timeout: t('No GPS fix within 8 seconds.', '৮ সেকেন্ডে জিপিএস পাওয়া যায়নি।', lang),
        unsupported: t('This browser has no location service.', 'এই ব্রাউজারে অবস্থান সেবা নেই।', lang),
        error: t('Location service returned an error.', 'অবস্থান সেবায় ত্রুটি।', lang),
      }[result.reason];
      setManualSite(defaultSite);
      setLoc({ phase: 'unavailable', reason });
      return;
    }
    const { site, distanceM } = nearestSite(result.fix);
    if (distanceM <= site.radiusM + result.fix.accuracyM) {
      recordPunchIn(site.id, isLateFor(site.id) ? 'late' : 'inside_geofence', distanceM);
    } else {
      setManualSite(site.id);
      setLoc({ phase: 'outside', fix: result.fix, siteId: site.id, distanceM });
    }
  };

  const handlePunchOut = () => {
    punchAttendance(role, 'out');
    showToast(t('Punched out. Have a safe commute.', 'পাঞ্চ-আউট সম্পন্ন। নিরাপদে বাড়ি ফিরুন।', lang), 'info');
  };

  const submitLeave = () => {
    if (!user) return;
    const days = parseDays(fromDate, toDate);
    if (!fromDate || !toDate || days === 0) {
      setLeaveError(t('Choose a valid date range.', 'সঠিক তারিখ পরিসর নির্বাচন করুন।', lang));
      return;
    }
    if (reason.trim().length < 5) {
      setLeaveError(t('Add a short reason for the record.', 'রেকর্ডের জন্য সংক্ষিপ্ত কারণ লিখুন।', lang));
      return;
    }
    const balance = balances.find((b) => b.type === leaveType);
    if (balance && days > balance.left) {
      setLeaveError(t(`Only ${balance.left} day(s) of ${t(...LEAVE_LABEL[leaveType], 'en').toLowerCase()} left.`, `${t(...LEAVE_LABEL[leaveType], 'bn')} মাত্র ${balance.left} দিন অবশিষ্ট।`, lang));
      return;
    }
    const created = addLeaveRequest({
      empId: user.empId,
      employeeName: user.name,
      designation: user.label,
      dept: user.dept,
      leaveType,
      fromDate: fmtDate(fromDate),
      toDate: fmtDate(toDate),
      days,
      reason: reason.trim(),
    });
    approvalStore.addLeaveApproval(created.id, user.name, user.label, user.dept, leaveType, days, reason.trim());
    setShowLeaveModal(false);
    setFromDate('');
    setToDate('');
    setReason('');
    setLeaveError(null);
    showToast(
      t(`Leave request ${created.id} submitted for approval.`, `ছুটির আবেদন ${created.id} অনুমোদনের জন্য জমা হয়েছে।`, lang),
      'success',
    );
  };

  if (!user) return null;

  const siteLabel = (id: ShiftWorker['site']) => t(...SITES[id].label, lang);

  return (
    <div className="view-container">
      <PageHeader
        title={t('Attendance & leave', 'উপস্থিতি ও ছুটি', lang)}
        description={
          seesOthers
            ? t('Your punch console, leave requests, and the attendance roster for your team.', 'আপনার পাঞ্চ কনসোল, ছুটির আবেদন এবং আপনার দলের উপস্থিতি রোস্টার।', lang)
            : t('Punch in at a company site, track your hours and apply for leave.', 'কোম্পানির সাইটে পাঞ্চ-ইন করুন, কর্মঘণ্টা দেখুন ও ছুটির আবেদন করুন।', lang)
        }
        meta={<span style={{ fontSize: 12, color: 'var(--text-3)' }}>{today()}</span>}
        actions={
          <Button variant="secondary" icon={<Plus size={14} />} onClick={() => setShowLeaveModal(true)} disabled={onLeaveToday}>
            {t('Apply for leave', 'ছুটির আবেদন', lang)}
          </Button>
        }
      />

      <div className="responsive-col-2-eq" style={{ marginBottom: 20 }}>
        {/* Punch console */}
        <Card
          title={t('My shift', 'আমার শিফট', lang)}
          subtitle={`${t(user.name, user.nameBn, lang)} · ${user.empId} · ${siteLabel(defaultSite)}`}
          actions={
            onLeaveToday ? (
              <StatusPill tone="neutral">{t('On approved leave', 'অনুমোদিত ছুটিতে', lang)}</StatusPill>
            ) : (
              <StatusPill tone={onDuty ? 'success' : 'warn'} dot>
                {onDuty ? t('On duty', 'কর্তব্যরত', lang) : t('Off duty', 'কর্তব্যের বাইরে', lang)}
              </StatusPill>
            )
          }
        >
          <div style={{ background: 'var(--surface-2)', padding: 16, borderRadius: 10, marginBottom: 14, display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 700 }}>{t('Shift', 'শিফট', lang)}</div>
              <div style={{ fontSize: 16, fontWeight: 800, marginTop: 2 }}>{myRecord?.shift ?? t('General (09:00 AM – 06:00 PM)', 'সাধারণ (০৯:০০ – ০৬:০০)', lang)}</div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
                {onLeaveToday
                  ? t('No punch expected today.', 'আজ পাঞ্চের প্রয়োজন নেই।', lang)
                  : onDuty && myRecord
                    ? t(`Punched in ${myRecord.inTime} · ${siteLabel(myRecord.site)}${myRecord.distanceMeters ? ` · ${formatDistance(myRecord.distanceMeters)} from gate` : ''}`, `পাঞ্চ-ইন ${myRecord.inTime} · ${siteLabel(myRecord.site)}`, lang)
                    : myRecord && myRecord.outTime !== 'On Duty' && myRecord.outTime !== '-'
                      ? t(`Today: ${myRecord.inTime} → ${myRecord.outTime}`, `আজ: ${myRecord.inTime} → ${myRecord.outTime}`, lang)
                      : t('Not punched in yet.', 'এখনও পাঞ্চ-ইন হয়নি।', lang)}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 700 }}>{t('Overtime (month)', 'ওভারটাইম (মাস)', lang)}</div>
              <div style={{ fontSize: 16, fontWeight: 800, marginTop: 2, color: 'var(--brand-crimson)' }}>{myRecord ? `${myRecord.overtimeHours.toFixed(1)} h` : '0.0 h'}</div>
            </div>
          </div>

          {myRecord?.locationStatus === 'manual_review' && onDuty && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '8px 10px', borderRadius: 8, background: 'var(--status-purple-bg)', color: 'var(--status-purple-text)', fontSize: 12, marginBottom: 12 }}>
              <ShieldAlert size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              {myRecord.distanceMeters > 0
                ? t('Today\'s check-in was outside the site geofence and will be confirmed by your supervisor.', 'আজকের চেক-ইন সাইটের জিওফেন্সের বাইরে ছিল; সুপারভাইজার নিশ্চিত করবেন।', lang)
                : t('Today\'s check-in had no location fix and will be confirmed by your supervisor.', 'আজকের চেক-ইনে অবস্থান যাচাই হয়নি; সুপারভাইজার নিশ্চিত করবেন।', lang)}
            </div>
          )}

          {!onLeaveToday && (
            onDuty ? (
              <Button variant="outline-danger" block icon={<LogOut size={15} />} onClick={handlePunchOut}>
                {t('Punch out', 'পাঞ্চ-আউট', lang)}
              </Button>
            ) : (
              <Button block icon={<LogIn size={15} />} loading={loc.phase === 'locating'} onClick={handlePunchIn}>
                {loc.phase === 'locating' ? t('Checking your location…', 'আপনার অবস্থান যাচাই হচ্ছে…', lang) : t('Punch in', 'পাঞ্চ-ইন', lang)}
              </Button>
            )
          )}
          <p style={{ fontSize: 11, color: 'var(--text-3)', margin: '10px 0 0', display: 'flex', gap: 6, alignItems: 'center' }}>
            <MapPin size={12} />
            {t(`Punch-in is accepted within ${SITES.HQ_BARIDHARA.radiusM} m of Head Office or ${SITES.PLANT_KERANIGANJ.radiusM} m of the plant gate.`, `প্রধান কার্যালয়ের ${SITES.HQ_BARIDHARA.radiusM} মি. বা প্ল্যান্ট গেটের ${SITES.PLANT_KERANIGANJ.radiusM} মি. মধ্যে পাঞ্চ-ইন গ্রহণযোগ্য।`, lang)}
          </p>
        </Card>

        {/* My leave */}
        <Card
          title={t('My leave', 'আমার ছুটি', lang)}
          subtitle={t('Balances for the current year and your requests', 'চলতি বছরের ব্যালেন্স ও আপনার আবেদন', lang)}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
            {balances.map((b) => (
              <div key={b.type} style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: 10.5, color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 700 }}>{t(...LEAVE_LABEL[b.type], lang)}</div>
                <div style={{ fontSize: 18, fontWeight: 800, marginTop: 2 }}>
                  {b.left}<span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}> / {LEAVE_ENTITLEMENT[b.type]}</span>
                </div>
              </div>
            ))}
          </div>

          {myLeaves.length === 0 ? (
            <EmptyState
              compact
              icon={<CalendarDays size={20} />}
              title={t('No leave requests yet', 'এখনও কোনো ছুটির আবেদন নেই', lang)}
              description={t('Requests you submit will be tracked here with their approval status.', 'আপনার জমা দেওয়া আবেদন ও অনুমোদনের অবস্থা এখানে দেখা যাবে।', lang)}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {myLeaves.map((l) => (
                <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: '8px 10px', border: '1px solid var(--border-1)', borderRadius: 8 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700 }}>{t(...LEAVE_LABEL[l.leaveType], lang)} · {l.days} {t(l.days === 1 ? 'day' : 'days', 'দিন', lang)}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{l.fromDate} → {l.toDate} · {l.id}</div>
                  </div>
                  <StatusPill tone={l.status === 'approved' ? 'success' : l.status === 'rejected' ? 'danger' : 'warn'}>
                    {l.status === 'approved' ? t('Approved', 'অনুমোদিত', lang) : l.status === 'rejected' ? t('Declined', 'প্রত্যাখ্যাত', lang) : t('Pending', 'অপেক্ষমাণ', lang)}
                  </StatusPill>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {seesOthers && (
        <>
          <div className="kpi-grid mb-5">
            <div className="kpi-card">
              <div className="kpi-label">{t('Present today', 'আজ উপস্থিত', lang)}</div>
              <div className="kpi-value text-emerald">{teamStats.present} / {teamStats.total}</div>
              <div className="kpi-sub">{t(`${teamStats.onLeave} on approved leave`, `${teamStats.onLeave} জন অনুমোদিত ছুটিতে`, lang)}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">{t('Late arrivals', 'বিলম্বে আগমন', lang)}</div>
              <div className={`kpi-value ${teamStats.late ? 'text-amber' : ''}`}>{teamStats.late}</div>
              <div className="kpi-sub">{t('After shift start + 10 min grace', 'শিফট শুরুর ১০ মিনিট পরে', lang)}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">{t('Check-ins to review', 'পর্যালোচনার চেক-ইন', lang)}</div>
              <div className={`kpi-value ${teamStats.review ? 'text-amber' : ''}`}>{teamStats.review}</div>
              <div className="kpi-sub">{t('Punched in without a location fix', 'অবস্থান যাচাই ছাড়া পাঞ্চ-ইন', lang)}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">{t('Leave awaiting decision', 'সিদ্ধান্তের অপেক্ষায় ছুটি', lang)}</div>
              <div className="kpi-value text-blue">{teamLeaves.filter((l) => l.status === 'pending').length}</div>
              <div className="kpi-sub">{canApproveLeave ? t('Decide in Approvals', 'অনুমোদন কেন্দ্রে সিদ্ধান্ত নিন', lang) : t('Routed to the approving manager', 'অনুমোদনকারী ব্যবস্থাপকের কাছে পাঠানো', lang)}</div>
            </div>
          </div>

          <Card
            title={t('Team roster', 'দলের রোস্টার', lang)}
            subtitle={t('Today\'s punches and site verification for people in your scope', 'আপনার আওতাধীন কর্মীদের আজকের পাঞ্চ ও সাইট যাচাই', lang)}
            padded={false}
            className="mb-5"
          >
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('Employee', 'কর্মী', lang)}</th>
                    <th>{t('Role & department', 'পদ ও বিভাগ', lang)}</th>
                    <th>{t('Site · shift', 'সাইট · শিফট', lang)}</th>
                    <th>{t('Punch in', 'পাঞ্চ-ইন', lang)}</th>
                    <th>{t('Status', 'অবস্থা', lang)}</th>
                    <th>{t('Overtime', 'ওভারটাইম', lang)}</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{r.name}{r.id === user.empId ? ` (${t('you', 'আপনি', lang)})` : ''}</div>
                        <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-3)' }}>{r.id}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: 12 }}>{r.roleTitle}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{r.dept}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: 12 }}>{siteLabel(r.site)}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{r.shift}</div>
                      </td>
                      <td><strong>{r.locationStatus === 'absent' ? '—' : r.inTime}</strong></td>
                      <td>{statusPill(r, lang)}</td>
                      <td>
                        {r.overtimeHours > 0 ? (
                          <StatusPill tone="gold">+{r.overtimeHours} h</StatusPill>
                        ) : (
                          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {teamLeaves.length > 0 && (
            <Card
              title={t('Team leave requests', 'দলের ছুটির আবেদন', lang)}
              subtitle={t('Pending requests are decided in the Approvals centre.', 'অপেক্ষমাণ আবেদনের সিদ্ধান্ত অনুমোদন কেন্দ্রে নেওয়া হয়।', lang)}
              actions={
                canApproveLeave && onNavigate ? (
                  <Button variant="secondary" size="sm" onClick={() => onNavigate('approvals')}>
                    {t('Open approvals', 'অনুমোদন খুলুন', lang)}
                  </Button>
                ) : undefined
              }
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {teamLeaves.map((l) => (
                  <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: '8px 10px', border: '1px solid var(--border-1)', borderRadius: 8, flexWrap: 'wrap' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 700 }}>{l.employeeName} <span style={{ fontWeight: 500, color: 'var(--text-3)' }}>· {l.designation}</span></div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{t(...LEAVE_LABEL[l.leaveType], lang)} · {l.days} {t(l.days === 1 ? 'day' : 'days', 'দিন', lang)} · {l.fromDate} → {l.toDate}</div>
                    </div>
                    <StatusPill tone={l.status === 'approved' ? 'success' : l.status === 'rejected' ? 'danger' : 'warn'}>
                      {l.status === 'approved' ? t('Approved', 'অনুমোদিত', lang) : l.status === 'rejected' ? t('Declined', 'প্রত্যাখ্যাত', lang) : t('Pending', 'অপেক্ষমাণ', lang)}
                    </StatusPill>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}

      {/* Location fallback: outside the geofence */}
      <Modal
        open={loc.phase === 'outside'}
        onClose={() => setLoc({ phase: 'idle' })}
        title={t('You are outside the site geofence', 'আপনি সাইটের জিওফেন্সের বাইরে', lang)}
        icon={<Navigation size={16} />}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setLoc({ phase: 'idle' })}>{t('Cancel', 'বাতিল', lang)}</Button>
            <Button
              variant="secondary"
              onClick={() => loc.phase === 'outside' && recordPunchIn(loc.siteId, 'manual_review', loc.distanceM)}
            >
              {t('Check in anyway (flag for review)', 'তবুও চেক-ইন (পর্যালোচনার জন্য)', lang)}
            </Button>
          </>
        }
      >
        {loc.phase === 'outside' && (
          <p style={{ fontSize: 13, margin: 0, lineHeight: 1.6 }}>
            {t(
              `Your device reports you are ${formatDistance(loc.distanceM)} from ${t(...SITES[loc.siteId].label, 'en')} (accuracy ±${loc.fix.accuracyM} m). Move inside the ${SITES[loc.siteId].radiusM} m perimeter and try again, or check in now and your supervisor will confirm it.`,
              `আপনার ডিভাইস অনুযায়ী আপনি ${t(...SITES[loc.siteId].label, 'bn')} থেকে ${formatDistance(loc.distanceM)} দূরে (নির্ভুলতা ±${loc.fix.accuracyM} মি.)। ${SITES[loc.siteId].radiusM} মি. সীমার ভেতরে এসে আবার চেষ্টা করুন, অথবা এখন চেক-ইন করুন এবং সুপারভাইজার নিশ্চিত করবেন।`,
              lang,
            )}
          </p>
        )}
      </Modal>

      {/* Location fallback: no fix */}
      <Modal
        open={loc.phase === 'unavailable'}
        onClose={() => setLoc({ phase: 'idle' })}
        title={t('Location unavailable', 'অবস্থান পাওয়া যায়নি', lang)}
        icon={<AlertTriangle size={16} />}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setLoc({ phase: 'idle' })}>{t('Cancel', 'বাতিল', lang)}</Button>
            <Button onClick={() => recordPunchIn(manualSite, 'manual_review', 0)}>
              {t('Confirm check-in', 'চেক-ইন নিশ্চিত করুন', lang)}
            </Button>
          </>
        }
      >
        {loc.phase === 'unavailable' && (
          <>
            <p style={{ fontSize: 13, margin: '0 0 12px', lineHeight: 1.6 }}>
              {loc.reason} {t('Confirm which site you are at; the check-in will be flagged for your supervisor to verify.', 'আপনি কোন সাইটে আছেন নিশ্চিত করুন; চেক-ইনটি সুপারভাইজারের যাচাইয়ের জন্য চিহ্নিত থাকবে।', lang)}
            </p>
            <FormField label={t('Site', 'সাইট', lang)} required>
              {(id) => (
                <select id={id} value={manualSite} onChange={(e) => setManualSite(e.target.value as SiteId)}>
                  {SITE_LIST.map((s) => (
                    <option key={s.id} value={s.id}>{t(...s.label, lang)}</option>
                  ))}
                </select>
              )}
            </FormField>
          </>
        )}
      </Modal>

      {/* Apply for leave */}
      <Modal
        open={showLeaveModal}
        onClose={() => { setShowLeaveModal(false); setLeaveError(null); }}
        title={t('Apply for leave', 'ছুটির আবেদন', lang)}
        icon={<CalendarDays size={16} />}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setShowLeaveModal(false); setLeaveError(null); }}>{t('Cancel', 'বাতিল', lang)}</Button>
            <Button onClick={submitLeave}>{t('Submit request', 'আবেদন জমা দিন', lang)}</Button>
          </>
        }
      >
        <FormField label={t('Leave type', 'ছুটির ধরন', lang)} required>
          {(id) => (
            <select id={id} value={leaveType} onChange={(e) => setLeaveType(e.target.value as LeaveRequestItem['leaveType'])}>
              {balances.map((b) => (
                <option key={b.type} value={b.type}>{t(...LEAVE_LABEL[b.type], lang)} ({b.left} {t('left', 'অবশিষ্ট', lang)})</option>
              ))}
            </select>
          )}
        </FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <FormField label={t('From', 'শুরু', lang)} required>
            {(id) => <input id={id} type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />}
          </FormField>
          <FormField label={t('To', 'শেষ', lang)} required>
            {(id) => <input id={id} type="date" value={toDate} min={fromDate || undefined} onChange={(e) => setToDate(e.target.value)} />}
          </FormField>
        </div>
        <FormField
          label={t('Reason', 'কারণ', lang)}
          required
          error={leaveError}
          hint={fromDate && toDate ? t(`${parseDays(fromDate, toDate)} day(s) requested`, `${parseDays(fromDate, toDate)} দিন আবেদন`, lang) : undefined}
        >
          {(id) => <textarea id={id} rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t('e.g. Family event in Chattogram', 'যেমন: চট্টগ্রামে পারিবারিক অনুষ্ঠান', lang)} />}
        </FormField>
        <p style={{ fontSize: 11.5, color: 'var(--text-3)', margin: 0, display: 'flex', gap: 6, alignItems: 'center' }}>
          <Clock size={12} /> {t('Routed to your approving manager; you will see the decision here.', 'আপনার অনুমোদনকারী ব্যবস্থাপকের কাছে পাঠানো হবে; সিদ্ধান্ত এখানে দেখা যাবে।', lang)}
        </p>
      </Modal>

      {!seesOthers && (
        <p style={{ fontSize: 11.5, color: 'var(--text-3)', display: 'flex', gap: 6, alignItems: 'center' }}>
          <Users size={12} /> {t('Team attendance is visible to department heads and HR.', 'দলের উপস্থিতি বিভাগীয় প্রধান ও এইচআর দেখতে পান।', lang)}
        </p>
      )}
    </div>
  );
}
