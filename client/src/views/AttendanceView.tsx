import { useState, useMemo } from 'react';
import { ViewProps, t } from '../types';
import { showToast } from '../components/ToastManager';
import {
  Clock, MapPin, Users, LogIn, LogOut, CalendarDays, Plus, AlertTriangle, Navigation, ShieldAlert, Building2, Factory, LocateFixed, Search, X, SearchX,
} from 'lucide-react';
import { useOperationsStore, type ShiftWorker, type LeaveRequestItem } from '../store/operationsStore';
import { approvalStore } from '../store/approvalStore';
import { useCan } from '../auth/session';
import { Button, Card, EmptyState, FormField, Modal, PageHeader, StatusPill, type StatusTone } from '../components/ui';
import Pagination from '../components/Pagination';
import {
  SITES, SITE_LIST, type SiteId, type GeoFix, requestPosition, nearestSite, isLateFor, formatDistance, useAttendanceScope,
} from './attendance/config';

type RosterKind = 'all' | 'review' | 'late' | 'leave' | 'on_site';
const ROSTER_PAGE = 8;
const KIND_RANK: Record<Exclude<RosterKind, 'all'> | 'out', number> = {
  review: 0, late: 1, leave: 2, on_site: 3, out: 4,
};

function rowKind(w: ShiftWorker): Exclude<RosterKind, 'all'> | 'out' {
  if (w.locationStatus === 'manual_review') return 'review';
  if (w.locationStatus === 'late') return 'late';
  if (w.locationStatus === 'absent') return 'leave';
  if (w.outTime !== '-' && w.outTime !== 'On Duty') return 'out';
  return 'on_site';
}

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

/**
 * Compact geofence & location schematic showing where the employee checked in
 * relative to the Office or Plant and its allowed geofence perimeter.
 */
function GeofenceMiniMap({
  siteId,
  distanceM,
  outside,
  noFix = false,
  lang,
}: {
  siteId: SiteId;
  distanceM: number;
  outside: boolean;
  noFix?: boolean;
  lang: ViewProps['lang'];
}) {
  const site = SITES[siteId];
  const otherSite = SITES[siteId === 'HQ_BARIDHARA' ? 'PLANT_KERANIGANJ' : 'HQ_BARIDHARA'];
  const SiteIcon = siteId === 'PLANT_KERANIGANJ' ? Factory : Building2;
  const OtherIcon = otherSite.id === 'PLANT_KERANIGANJ' ? Factory : Building2;
  const siteShort = siteId === 'PLANT_KERANIGANJ'
    ? t('Keraniganj Plant', 'কেরানীগঞ্জ প্ল্যান্ট', lang)
    : t('Head Office, Baridhara', 'প্রধান কার্যালয়, বারিধারা', lang);
  const otherShort = otherSite.id === 'PLANT_KERANIGANJ'
    ? t('Keraniganj Plant', 'কেরানীগঞ্জ প্ল্যান্ট', lang)
    : t('Head Office, Baridhara', 'প্রধান কার্যালয়, বারিধারা', lang);
  const overFenceM = Math.max(0, distanceM - site.radiusM);
  const insidePct = !outside && !noFix && site.radiusM > 0
    ? Math.min(82, Math.max(24, Math.round((distanceM / site.radiusM) * 75) + 18))
    : 86;

  return (
    <div
      style={{
        background: 'var(--surface-0)',
        border: `1px solid ${outside ? 'var(--status-purple-border, rgba(124, 58, 237, 0.28))' : 'var(--border-1)'}`,
        borderRadius: 8,
        padding: '9px 11px',
        color: 'var(--text-1)',
      }}
    >
      {/* Top header: Site geofence vs current distance */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 7 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: 'var(--text-1)' }}>
          <SiteIcon size={12} color="#10B981" />
          <span>{siteShort}</span>
          <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)' }}>
            · {t(`${site.radiusM} m zone`, `${site.radiusM} মি. জোন`, lang)}
          </span>
        </div>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            padding: '1.5px 7px',
            borderRadius: 999,
            background: outside ? 'var(--status-purple-bg)' : 'rgba(16, 185, 129, 0.12)',
            color: outside ? 'var(--status-purple-text)' : '#059669',
          }}
        >
          {noFix
            ? t('GPS off · manual check-in', 'জিপিএস নেই · ম্যানুয়াল', lang)
            : outside
              ? t(`${formatDistance(distanceM)} away (+${formatDistance(overFenceM)} outside)`, `${formatDistance(distanceM)} দূরে (+${formatDistance(overFenceM)} বাইরে)`, lang)
              : t(`Inside zone · ${formatDistance(distanceM)} from gate`, `জোনের ভেতরে · গেট থেকে ${formatDistance(distanceM)}`, lang)}
        </span>
      </div>

      {/* Schematic track: [Site + Geofence Zone] ----dashed line----> [You Right Now] */}
      <div
        style={{
          position: 'relative',
          height: 50,
          borderRadius: 7,
          background:
            'radial-gradient(circle at 1px 1px, var(--border-1) 1px, transparent 0) 0 0 / 12px 12px, var(--surface-1)',
          border: '1px solid var(--border-1)',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          padding: '0 10px',
        }}
      >
        {/* Allowed Geofence Zone Box on the left */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: outside ? '38%' : '76%',
            background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.16) 0%, rgba(16, 185, 129, 0.06) 100%)',
            borderRight: '1.5px dashed rgba(16, 185, 129, 0.7)',
            pointerEvents: 'none',
          }}
        >
          <span
            style={{
              position: 'absolute',
              right: 4,
              top: 3,
              fontSize: 9,
              fontWeight: 800,
              color: '#059669',
              letterSpacing: 0.2,
            }}
          >
            {site.radiusM}m {t('fence', 'সীমা', lang)}
          </span>
        </div>

        {/* Connecting line between Site (left) and You */}
        <div
          style={{
            position: 'absolute',
            left: 26,
            right: outside ? 26 : `${100 - insidePct}%`,
            top: '50%',
            height: 0,
            borderTop: outside
              ? '1.5px dashed var(--status-purple, #7C3AED)'
              : '2px solid #10B981',
            transform: 'translateY(-4px)',
            zIndex: 1,
          }}
        />

        {/* Distance pill along the line when outside */}
        {outside && (
          <div
            style={{
              position: 'absolute',
              left: '63%',
              top: '50%',
              transform: 'translate(-50%, -62%)',
              background: 'var(--surface-0)',
              border: '1px solid var(--status-purple-border, rgba(124, 58, 237, 0.35))',
              color: 'var(--status-purple-text)',
              fontSize: 9.5,
              fontWeight: 800,
              padding: '1px 6px',
              borderRadius: 999,
              whiteSpace: 'nowrap',
              zIndex: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 3,
            }}
          >
            <Navigation size={9} />
            {noFix ? t('No GPS fix', 'জিপিএস নেই', lang) : formatDistance(distanceM)}
          </div>
        )}

        {/* Site Node (Left) */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 2,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: '#10B981',
                color: '#FFFFFF',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.22)',
              }}
            >
              <SiteIcon size={12} />
            </span>
            <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-1)' }}>
              {siteId === 'PLANT_KERANIGANJ' ? t('Plant gate', 'প্ল্যান্ট গেট', lang) : t('HQ gate', 'প্রধান কার্যালয়', lang)}
            </span>
          </div>
          <span style={{ fontSize: 9, color: 'var(--text-3)', paddingLeft: 2 }}>
            0 m · {site.lat.toFixed(3)}°N, {site.lng.toFixed(3)}°E
          </span>
        </div>

        {/* Employee Node (You right now) */}
        <div
          style={{
            position: 'absolute',
            left: outside ? undefined : `${insidePct}%`,
            right: outside ? 10 : undefined,
            transform: outside ? undefined : 'translateX(-50%)',
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: outside ? 'flex-end' : 'center',
            gap: 2,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            {outside && (
              <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--status-purple-text)' }}>
                {t('You now', 'আপনার অবস্থান', lang)}
              </span>
            )}
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: outside ? 'var(--status-purple-solid, #7C3AED)' : '#059669',
                color: '#FFFFFF',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: outside
                  ? '0 0 0 4px rgba(124, 58, 237, 0.22)'
                  : '0 0 0 3px rgba(16, 185, 129, 0.25)',
              }}
            >
              <LocateFixed size={12} />
            </span>
            {!outside && (
              <span style={{ fontSize: 10, fontWeight: 800, color: '#059669' }}>
                {t('You', 'আপনি', lang)} ({formatDistance(distanceM)})
              </span>
            )}
          </div>
          {outside && (
            <span style={{ fontSize: 9, color: 'var(--text-3)' }}>
              {noFix
                ? t('Unverified location', 'অবস্থান অযাচাইকৃত', lang)
                : t(`${formatDistance(distanceM)} from gate`, `গেট থেকে ${formatDistance(distanceM)}`, lang)}
            </span>
          )}
        </div>
      </div>

      {/* Sub-footer showing the other BOGCL site for full context */}
      <div
        style={{
          marginTop: 6,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 8,
          fontSize: 10,
          color: 'var(--text-3)',
          flexWrap: 'wrap',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <OtherIcon size={11} />
          {t('Other site:', 'অন্য সাইট:', lang)} <strong style={{ color: 'var(--text-2)' }}>{otherShort}</strong> ({otherSite.radiusM} m {t('zone', 'জোন', lang)})
        </span>
        <span>
          {outside
            ? t('Supervisor confirmation pending', 'সুপারভাইজারের অনুমোদনের অপেক্ষায়', lang)
            : t('Verified within site perimeter', 'সাইট সীমার ভেতরে যাচাইকৃত', lang)}
        </span>
      </div>
    </div>
  );
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
  const [rosterQuery, setRosterQuery] = useState('');
  const [rosterKind, setRosterKind] = useState<RosterKind>('all');
  const [rosterSite, setRosterSite] = useState<SiteId | 'all'>('all');
  const [rosterPage, setRosterPage] = useState(1);
  const canApplyLeave = role !== 'chairman';

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
      onSite: visible.filter((w) => rowKind(w) === 'on_site').length,
    };
  }, [visible]);

  const rosterSites = useMemo(() => {
    const ids = new Set(visible.map((w) => w.site));
    return SITE_LIST.filter((s) => ids.has(s.id));
  }, [visible]);

  const filteredRoster = useMemo(() => {
    const q = rosterQuery.trim().toLowerCase();
    const rows = visible.filter((w) => {
      if (rosterSite !== 'all' && w.site !== rosterSite) return false;
      if (rosterKind !== 'all' && rowKind(w) !== rosterKind) return false;
      if (!q) return true;
      return [w.name, w.roleTitle, w.dept, w.id, w.shift].some((v) => v.toLowerCase().includes(q));
    });
    return [...rows].sort((a, b) => {
      const rank = KIND_RANK[rowKind(a)] - KIND_RANK[rowKind(b)];
      return rank !== 0 ? rank : a.name.localeCompare(b.name);
    });
  }, [visible, rosterQuery, rosterKind, rosterSite]);

  const rosterPages = Math.max(1, Math.ceil(filteredRoster.length / ROSTER_PAGE));
  const safeRosterPage = Math.min(rosterPage, rosterPages);
  const pagedRoster = filteredRoster.slice((safeRosterPage - 1) * ROSTER_PAGE, safeRosterPage * ROSTER_PAGE);

  const setRosterFilter = (next: Partial<{ query: string; kind: RosterKind; site: SiteId | 'all' }>) => {
    if (next.query !== undefined) setRosterQuery(next.query);
    if (next.kind !== undefined) setRosterKind(next.kind);
    if (next.site !== undefined) setRosterSite(next.site);
    setRosterPage(1);
  };

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
  const bn = (n: number) => n.toLocaleString('bn-BD');
  const requestedDays = fromDate && toDate ? parseDays(fromDate, toDate) : 0;
  const pendingMine = myLeaves.filter((l) => l.status === 'pending').length;
  const punchedOutToday = !!myRecord && myRecord.outTime !== 'On Duty' && myRecord.outTime !== '-' && !onLeaveToday;

  /** One plain sentence: where the person stands right now and what to do next. */
  const dayStatus = onLeaveToday
    ? t('You are on approved leave today. No punch is needed.', 'আজ আপনি অনুমোদিত ছুটিতে আছেন। পাঞ্চ করতে হবে না।', lang)
    : onDuty && myRecord
      ? t(`You punched in at ${myRecord.inTime} at ${siteLabel(myRecord.site)}. Punch out when your shift ends.`, `আপনি ${myRecord.inTime}-এ ${siteLabel(myRecord.site)}-এ পাঞ্চ-ইন করেছেন। শিফট শেষে পাঞ্চ-আউট করুন।`, lang)
      : punchedOutToday && myRecord
        ? t(`You worked ${myRecord.inTime} to ${myRecord.outTime} today. Nothing more to do.`, `আজ আপনি ${myRecord.inTime} থেকে ${myRecord.outTime} পর্যন্ত কাজ করেছেন। আর কিছু করার নেই।`, lang)
        : t(`You have not punched in yet. Be at ${siteLabel(defaultSite)} and tap Punch in.`, `আপনি এখনও পাঞ্চ-ইন করেননি। ${siteLabel(defaultSite)}-এ পৌঁছে পাঞ্চ-ইন চাপুন।`, lang);
  const leaveStatus = canApplyLeave && pendingMine > 0
    ? t(` ${pendingMine} leave ${pendingMine === 1 ? 'request is' : 'requests are'} waiting for your manager.`, ` ${bn(pendingMine)}টি ছুটির আবেদন ম্যানেজারের অপেক্ষায়।`, lang)
    : '';

  return (
    <div className="view-container">
      {canApplyLeave && (
        <PageHeader
          title={t('Attendance & leave', 'উপস্থিতি ও ছুটি', lang)}
          actions={
            <Button variant="secondary" icon={<Plus size={14} />} onClick={() => setShowLeaveModal(true)} disabled={onLeaveToday}>
              {t('Request leave', 'ছুটির আবেদন', lang)}
            </Button>
          }
        />
      )}

      <p className={`lv-status ${onDuty ? 'ok' : ''}`} role="status">
        {onLeaveToday ? <CalendarDays size={16} /> : onDuty ? <LogIn size={16} /> : <Clock size={16} />}
        <span>{dayStatus}{leaveStatus}</span>
      </p>

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

          {onDuty && myRecord && (
            myRecord.locationStatus === 'manual_review' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9, padding: '10px', borderRadius: 10, background: 'var(--status-purple-bg)', color: 'var(--status-purple-text)', fontSize: 12, marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <ShieldAlert size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>
                    {myRecord.distanceMeters > 0
                      ? t('Today\'s check-in was outside the site geofence and will be confirmed by your supervisor.', 'আজকের চেক-ইন সাইটের জিওফেন্সের বাইরে ছিল; সুপারভাইজার নিশ্চিত করবেন।', lang)
                      : t('Today\'s check-in had no location fix and will be confirmed by your supervisor.', 'আজকের চেক-ইনে অবস্থান যাচাই হয়নি; সুপারভাইজার নিশ্চিত করবেন।', lang)}
                  </span>
                </div>
                <GeofenceMiniMap
                  siteId={myRecord.site}
                  distanceM={myRecord.distanceMeters}
                  outside
                  noFix={myRecord.distanceMeters === 0}
                  lang={lang}
                />
              </div>
            ) : (
              <div style={{ marginBottom: 12 }}>
                <GeofenceMiniMap
                  siteId={myRecord.site}
                  distanceM={myRecord.distanceMeters}
                  outside={false}
                  lang={lang}
                />
              </div>
            )
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
          subtitle={
            canApplyLeave
              ? t(`Days you can still take in ${new Date().getFullYear()}, and where your requests stand`, `${new Date().getFullYear()} সালে আর কত দিন ছুটি নিতে পারবেন, এবং আবেদনের অবস্থা`, lang)
              : t(`Leave balances for ${new Date().getFullYear()}. HR records any leave taken.`, `${new Date().getFullYear()} সালের ছুটির হিসাব। ছুটি এইচআর রেকর্ড করে।`, lang)
          }
        >
          <div className="lv-balances">
            {balances.map((b) => (
              <div key={b.type} className={`lv-balance ${b.left === 0 ? 'empty' : ''}`}>
                <span className="lv-balance-name">{t(...LEAVE_LABEL[b.type], lang)}</span>
                <strong>{t(`${b.left} ${b.left === 1 ? 'day' : 'days'} left`, `${bn(b.left)} দিন বাকি`, lang)}</strong>
                <small>{t(`${b.used} of ${LEAVE_ENTITLEMENT[b.type]} used`, `${bn(LEAVE_ENTITLEMENT[b.type])}-এর মধ্যে ${bn(b.used)} ব্যবহৃত`, lang)}</small>
                <div className="hs-bar" aria-hidden><span style={{ width: `${Math.min(100, (b.used / LEAVE_ENTITLEMENT[b.type]) * 100)}%` }} /></div>
              </div>
            ))}
          </div>

          {myLeaves.length === 0 ? (
            <EmptyState
              compact
              icon={<CalendarDays size={20} />}
              title={t('No leave requests yet', 'এখনও কোনো ছুটির আবেদন নেই', lang)}
              description={
                canApplyLeave
                  ? t('Requests you submit will be tracked here with their approval status.', 'আপনার জমা দেওয়া আবেদন ও অনুমোদনের অবস্থা এখানে দেখা যাবে।', lang)
                  : t('The Chairman does not submit leave requests. HR records any absence.', 'চেয়ারম্যান ছুটির আবেদন করেন না। অনুপস্থিতি এইচআর রেকর্ড করে।', lang)
              }
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {myLeaves.map((l) => (
                <div key={l.id} className="lv-request">
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700 }}>{t(...LEAVE_LABEL[l.leaveType], lang)} · {l.days} {t(l.days === 1 ? 'day' : 'days', 'দিন', lang)}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{l.fromDate} → {l.toDate}</div>
                  </div>
                  <StatusPill tone={l.status === 'approved' ? 'success' : l.status === 'rejected' ? 'danger' : 'warn'}>
                    {l.status === 'approved' ? t('Approved', 'অনুমোদিত', lang) : l.status === 'rejected' ? t('Declined', 'প্রত্যাখ্যাত', lang) : t('Waiting for your manager', 'ম্যানেজারের অপেক্ষায়', lang)}
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
          </div>

          <Card
            title={t('Team roster', 'দলের রোস্টার', lang)}
            subtitle={t(
              `${teamStats.present} of ${teamStats.total} on site or at work. ${teamStats.late} late, ${teamStats.onLeave} on leave${teamStats.review ? `, ${teamStats.review} to review` : ''}.`,
              `${bn(teamStats.total)} জনের মধ্যে ${bn(teamStats.present)} জন কাজে। ${bn(teamStats.late)} জন বিলম্বে, ${bn(teamStats.onLeave)} জন ছুটিতে${teamStats.review ? `, ${bn(teamStats.review)} জন পর্যালোচনায়` : ''}।`,
              lang,
            )}
            padded={false}
            className="mb-5"
          >
            <div className="cn-toolbar" style={{ padding: '12px 16px 8px' }}>
              <div className="psf-filters" role="group" aria-label={t('Filter roster', 'রোস্টার ফিল্টার', lang)}>
                {([
                  { key: 'all' as const, label: t('All', 'সব', lang), count: visible.length },
                  { key: 'review' as const, label: t('To review', 'পর্যালোচনা', lang), count: teamStats.review },
                  { key: 'late' as const, label: t('Late', 'বিলম্বে', lang), count: teamStats.late },
                  { key: 'leave' as const, label: t('On leave', 'ছুটিতে', lang), count: teamStats.onLeave },
                  { key: 'on_site' as const, label: t('On site', 'সাইটে', lang), count: teamStats.onSite },
                ]).filter((f) => f.key === 'all' || f.count > 0).map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    className={`psf-filter ${rosterKind === f.key ? 'active' : ''}`}
                    aria-pressed={rosterKind === f.key}
                    onClick={() => setRosterFilter({ kind: f.key })}
                  >
                    {f.label} <b>{f.count}</b>
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                {rosterSites.length > 1 && (
                  <select
                    className="form-input"
                    style={{ height: 36, fontSize: 12, minWidth: 160, padding: '0 10px' }}
                    value={rosterSite}
                    aria-label={t('Site', 'সাইট', lang)}
                    onChange={(e) => setRosterFilter({ site: e.target.value as SiteId | 'all' })}
                  >
                    <option value="all">{t('All sites', 'সব সাইট', lang)}</option>
                    {rosterSites.map((s) => (
                      <option key={s.id} value={s.id}>{t(...s.label, lang)}</option>
                    ))}
                  </select>
                )}
                <label className="dash-search">
                  <Search size={14} aria-hidden />
                  <input
                    type="search"
                    value={rosterQuery}
                    onChange={(e) => setRosterFilter({ query: e.target.value })}
                    placeholder={t('Search name, role or department', 'নাম, পদ বা বিভাগ খুঁজুন', lang)}
                    aria-label={t('Search roster', 'রোস্টার খুঁজুন', lang)}
                  />
                  {rosterQuery && (
                    <button type="button" onClick={() => setRosterFilter({ query: '' })} aria-label={t('Clear search', 'অনুসন্ধান মুছুন', lang)}>
                      <X size={13} />
                    </button>
                  )}
                </label>
              </div>
            </div>
            {pagedRoster.length === 0 ? (
              <div style={{ padding: '8px 16px 20px' }}>
                <EmptyState
                  compact
                  icon={<SearchX size={20} />}
                  title={t('No one matches', 'কেউ মেলেনি', lang)}
                  description={t('Try another name, site or status.', 'অন্য নাম, সাইট বা অবস্থা চেষ্টা করুন।', lang)}
                  action={
                    <Button variant="secondary" size="sm" onClick={() => setRosterFilter({ query: '', kind: 'all', site: 'all' })}>
                      {t('Show everyone', 'সবাই দেখুন', lang)}
                    </Button>
                  }
                />
              </div>
            ) : (
              <>
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
                      {pagedRoster.map((r) => (
                        <tr key={r.id}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{r.name}{r.id === user.empId ? ` (${t('you', 'আপনি', lang)})` : ''}</div>
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
                <div style={{ padding: '4px 16px 12px' }}>
                  <Pagination
                    currentPage={safeRosterPage}
                    totalItems={filteredRoster.length}
                    pageSize={ROSTER_PAGE}
                    onPageChange={setRosterPage}
                    lang={lang}
                  />
                </div>
              </>
            )}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <GeofenceMiniMap
              siteId={loc.siteId}
              distanceM={loc.distanceM}
              outside
              lang={lang}
            />
            <p style={{ fontSize: 13, margin: 0, lineHeight: 1.6 }}>
              {t(
                `Your device reports you are ${formatDistance(loc.distanceM)} from ${t(...SITES[loc.siteId].label, 'en')} (accuracy ±${loc.fix.accuracyM} m). Move inside the ${SITES[loc.siteId].radiusM} m perimeter and try again, or check in now and your supervisor will confirm it.`,
                `আপনার ডিভাইস অনুযায়ী আপনি ${t(...SITES[loc.siteId].label, 'bn')} থেকে ${formatDistance(loc.distanceM)} দূরে (নির্ভুলতা ±${loc.fix.accuracyM} মি.)। ${SITES[loc.siteId].radiusM} মি. সীমার ভেতরে এসে আবার চেষ্টা করুন, অথবা এখন চেক-ইন করুন এবং সুপারভাইজার নিশ্চিত করবেন।`,
                lang,
              )}
            </p>
          </div>
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

      {/* Apply for leave — not shown for Chairman (BR-10-12: informational / HR-recorded). */}
      <Modal
        open={canApplyLeave && showLeaveModal}
        onClose={() => { setShowLeaveModal(false); setLeaveError(null); }}
        title={t('Request leave', 'ছুটির আবেদন', lang)}
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
          hint={requestedDays > 0
            ? t(
              `${requestedDays} ${requestedDays === 1 ? 'day' : 'days'} requested. You would have ${Math.max(0, (balances.find((b) => b.type === leaveType)?.left ?? 0) - requestedDays)} left.`,
              `${bn(requestedDays)} দিন আবেদন। অনুমোদিত হলে বাকি থাকবে ${bn(Math.max(0, (balances.find((b) => b.type === leaveType)?.left ?? 0) - requestedDays))} দিন।`,
              lang,
            )
            : undefined}
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
