/**
 * Per-role dashboard configuration.
 *
 * Each persona's "needs you" list, cockpit tabs and KPI cards are
 * described here as functions of live store data (see useDashboardData), so
 * DashboardView carries no hard-coded counts or copy; the only role checks
 * left there decide which overview section / sub-dashboard to mount, while
 * actions are gated with `useCan`.
 */
import React from 'react';
import {
  Users, FileCheck, Crown, Gauge, Truck, Car, Briefcase, BarChart3, Navigation,
  Bell, UserCheck, Activity, Lock, Receipt, AlertTriangle, ShieldAlert, Wrench,
  CalendarCheck, Building2, Clock, Star, MapPin,
} from 'lucide-react';
import type { AppRole, AppView } from '../../types';
import type { DashboardLiveData } from './useDashboardData';
import { INITIAL_LOTO_PERMITS, INNER_CIRCLE } from './dashboardData';
import { COMPLIANCE_HORIZON_DAYS } from './useDashboardData';

export type Bilingual = readonly [en: string, bn: string];
export type Tone = 'success' | 'info' | 'warning' | 'danger' | 'purple' | 'gold' | 'neutral';

export interface DashTab {
  id: string;
  label: Bilingual;
  icon: React.ReactNode;
  badge?: number | string;
  badgeType?: 'danger' | 'warn' | 'info';
}

export interface StatCard {
  label: Bilingual;
  value: string;
  sub: Bilingual;
  type: 'green' | 'red' | 'warn' | 'blue';
  icon: React.ReactNode;
}

/** One thing that needs the signed-in user, in a plain sentence. */
export interface AttentionItem {
  id: string;
  tone: 'danger' | 'warning' | 'info';
  text: Bilingual;
  /** Button label; leave out when there is nothing to open. */
  cta?: Bilingual;
  /** Switch to a tab on the dashboard... */
  tab?: string;
  /** ...or open another module. */
  view?: AppView;
}

export interface DashboardRoleConfig {
  attention: (d: DashboardLiveData) => AttentionItem[];
  tabs: (d: DashboardLiveData) => DashTab[];
  stats: (d: DashboardLiveData) => StatCard[];
}

/** Departmental OPEX envelope shown on the HOD dashboard (quarter to date). */
export const DEPT_BUDGET = {
  ceilingBdt: 12_000_000,
  committedBeforeTodayBdt: 3_840_000,
} as const;

export function fmtBdt(n: number): string {
  return `৳${n.toLocaleString('en-IN')}`;
}

const bn = (n: number) => n.toLocaleString('bn-BD');

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

const chairman: DashboardRoleConfig = {
  attention: (d) => {
    const items: AttentionItem[] = [];
    const n = d.approvals.pending.length;
    const urgent = d.approvals.urgent;
    if (n > 0) {
      items.push({
        id: 'approvals', tone: urgent > 0 ? 'danger' : 'warning',
        text: [
          `${n} ${plural(n, 'file needs', 'files need')} your signature${urgent > 0 ? `; ${urgent} due within 24 hours` : ''}.`,
          `${bn(n)}টি ফাইলে আপনার স্বাক্ষর প্রয়োজন${urgent > 0 ? `; ${bn(urgent)}টি ২৪ ঘণ্টার মধ্যে` : ''}।`,
        ],
        cta: ['Review', 'দেখুন'], tab: 'approvals',
      });
    }
    const mirrored = new Set(d.approvals.pending.map((a) => a.sourceId));
    const sheets = d.notesheets.awaitingMe.filter((f) => !mirrored.has(f.id)).length;
    if (sheets > 0) {
      items.push({
        id: 'notesheets', tone: 'warning',
        text: [`${sheets} ${plural(sheets, 'note-sheet is', 'note-sheets are')} waiting for your signature.`, `${bn(sheets)}টি নোট-শীটে আপনার স্বাক্ষর বাকি।`],
        cta: ['Open', 'খুলুন'], view: 'notesheet',
      });
    }
    const lic = d.compliance.nearest;
    if (lic) {
      items.push({
        id: 'permit', tone: lic.daysLeft <= 30 ? 'danger' : 'warning',
        text: [`${lic.title} expires in ${lic.daysLeft} days.`, `${lic.titleBn} ${bn(lic.daysLeft)} দিনের মধ্যে মেয়াদ শেষ হবে।`],
        cta: ['View', 'দেখুন'], view: 'compliance',
      });
    }
    const risk = d.incidents.highRisk;
    if (risk > 0) {
      items.push({
        id: 'incidents', tone: 'danger',
        text: [`${risk} high-risk ${plural(risk, 'incident is', 'incidents are')} still open.`, `${bn(risk)}টি উচ্চ ঝুঁকির দুর্ঘটনা এখনো খোলা।`],
        cta: ['View', 'দেখুন'], view: 'incident',
      });
    }
    if (d.notices.unread > 0) {
      items.push({
        id: 'notices', tone: 'info',
        text: [`${d.notices.unread} unread ${plural(d.notices.unread, 'notice', 'notices')} on the board.`, `নোটিশ বোর্ডে ${bn(d.notices.unread)}টি অপঠিত নোটিশ।`],
        cta: ['Read', 'পড়ুন'], tab: 'notices',
      });
    }
    return items;
  },
  tabs: (d) => [
    { id: 'overview', label: ['Executive Overview', 'এক্সিকিউটিভ ওভারভিউ'], icon: <Crown size={15} /> },
    { id: 'approvals', label: ['Priority Approvals', 'জরুরি অনুমোদন'], icon: <FileCheck size={15} />, badge: d.approvals.pending.length || undefined, badgeType: 'danger' },
    { id: 'inner_circle', label: ['Leadership Team', 'নেতৃত্বের তালিকা'], icon: <Users size={15} />, badge: INNER_CIRCLE.length, badgeType: 'info' },
    { id: 'notices', label: ['Company Notices', 'নোটিশ বোর্ড'], icon: <Bell size={15} />, badge: d.notices.unread || undefined, badgeType: 'warn' },
  ],
  stats: (d) => [
    { label: ['Present today', 'আজকের উপস্থিতি'], value: String(d.workforce.present), sub: [`of ${d.workforce.roster.length} on roster · ${d.workforce.late} late`, `${bn(d.workforce.roster.length)} জনের মধ্যে · ${bn(d.workforce.late)} জন বিলম্বে`], type: 'green', icon: <Users size={16} /> },
    { label: ['Awaiting signature', 'স্বাক্ষরের অপেক্ষায়'], value: String(d.approvals.pending.length), sub: [`${d.approvals.urgent} within 24h SLA`, `${bn(d.approvals.urgent)}টি ২৪ ঘণ্টার মধ্যে`], type: d.approvals.urgent > 0 ? 'red' : 'blue', icon: <FileCheck size={16} /> },
    { label: ['Compliance alerts', 'কমপ্লায়েন্স সতর্কতা'], value: String(d.compliance.dueSoon.length), sub: [`${d.compliance.critical} critical (<30 days)`, `${bn(d.compliance.critical)}টি জরুরি (৩০ দিনের কম)`], type: 'warn', icon: <AlertTriangle size={16} /> },
    { label: ['Open incidents', 'খোলা দুর্ঘটনা'], value: String(d.incidents.open.length), sub: [`${d.incidents.highRisk} high / extreme risk`, `${bn(d.incidents.highRisk)}টি উচ্চ ঝুঁকি`], type: d.incidents.highRisk > 0 ? 'red' : 'blue', icon: <ShieldAlert size={16} /> },
  ],
};

/* ─────────────────────────────── Plant GM ─────────────────────────────── */

const plant_gm: DashboardRoleConfig = {
  attention: (d) => {
    const items: AttentionItem[] = [];
    const risk = d.incidents.highRisk;
    if (risk > 0) {
      items.push({
        id: 'incidents', tone: 'danger',
        text: [`${risk} high-risk ${plural(risk, 'incident is', 'incidents are')} still open.`, `${bn(risk)}টি উচ্চ ঝুঁকির দুর্ঘটনা এখনো খোলা।`],
        cta: ['View', 'দেখুন'], view: 'incident',
      });
    }
    const crit = d.maintenance.critical;
    if (crit > 0) {
      items.push({
        id: 'workorders', tone: 'warning',
        text: [`${crit} critical ${plural(crit, 'work order is', 'work orders are')} open.`, `${bn(crit)}টি জরুরি কার্যাদেশ খোলা।`],
        cta: ['View', 'দেখুন'], view: 'asset',
      });
    }
    const n = d.approvals.pending.length;
    if (n > 0) {
      items.push({
        id: 'approvals', tone: d.approvals.urgent > 0 ? 'danger' : 'warning',
        text: [`${n} ${plural(n, 'file needs', 'files need')} your approval.`, `${bn(n)}টি ফাইলে আপনার অনুমোদন প্রয়োজন।`],
        cta: ['Review', 'দেখুন'], view: 'approvals',
      });
    }
    const loto = INITIAL_LOTO_PERMITS.length;
    if (loto > 0) {
      items.push({
        id: 'loto', tone: 'info',
        text: [`${loto} isolation ${plural(loto, 'permit is', 'permits are')} active on the plant.`, `প্ল্যান্টে ${bn(loto)}টি আইসোলেশন পারমিট সক্রিয়।`],
        cta: ['View', 'দেখুন'], tab: 'safety_loto',
      });
    }
    return items;
  },
  tabs: (d) => [
    { id: 'overview', label: ['Plant Overview', 'প্ল্যান্ট ওভারভিউ'], icon: <Gauge size={15} />, badge: d.incidents.open.length || undefined, badgeType: 'danger' },
    { id: 'refinery', label: ['Production', 'উৎপাদন'], icon: <BarChart3 size={15} /> },
    { id: 'safety_loto', label: ['Safety Permits & Shifts', 'নিরাপত্তা পারমিট ও শিফট'], icon: <Lock size={15} />, badge: INITIAL_LOTO_PERMITS.length, badgeType: 'warn' },
  ],
  stats: (d) => [
    { label: ['Plant headcount', 'প্ল্যান্টে উপস্থিত'], value: String(d.workforce.plantPresent), sub: ['Keraniganj Refinery, today', 'কেরানীগঞ্জ রিফাইনারি, আজ'], type: 'green', icon: <Users size={16} /> },
    { label: ['Open incidents', 'খোলা দুর্ঘটনা'], value: String(d.incidents.open.length), sub: [`${d.incidents.highRisk} high / extreme risk`, `${bn(d.incidents.highRisk)}টি উচ্চ ঝুঁকি`], type: d.incidents.highRisk > 0 ? 'red' : 'blue', icon: <ShieldAlert size={16} /> },
    { label: ['Open work orders', 'খোলা কার্যাদেশ'], value: String(d.maintenance.openWorkOrders), sub: [`${d.maintenance.critical} critical priority`, `${bn(d.maintenance.critical)}টি জরুরি`], type: 'warn', icon: <Wrench size={16} /> },
    { label: ['Plant approvals', 'প্ল্যান্ট অনুমোদন'], value: String(d.approvals.pending.length), sub: [`${d.approvals.urgent} due within 24h`, `${bn(d.approvals.urgent)}টি ২৪ ঘণ্টার মধ্যে`], type: 'blue', icon: <FileCheck size={16} /> },
  ],
};

/* ──────────────────────────── Transport Admin ─────────────────────────── */

const transport_admin: DashboardRoleConfig = {
  attention: (d) => {
    const items: AttentionItem[] = [];
    const p = d.fleet.pendingRequisitions;
    if (p > 0) {
      items.push({
        id: 'requisitions', tone: 'warning',
        text: [`${p} vehicle ${plural(p, 'request needs', 'requests need')} a vehicle and driver.`, `${bn(p)}টি যানবাহন আবেদনে গাড়ি ও চালক বরাদ্দ করতে হবে।`],
        cta: ['Assign', 'বরাদ্দ করুন'], tab: 'requisitions',
      });
    }
    const w = d.fleet.inWorkshop;
    if (w > 0) {
      items.push({
        id: 'workshop', tone: 'info',
        text: [`${w} ${plural(w, 'vehicle is', 'vehicles are')} in the workshop and can't be assigned.`, `${bn(w)}টি গাড়ি ওয়ার্কশপে, বরাদ্দ দেওয়া যাবে না।`],
        cta: ['View fleet', 'ফ্লিট দেখুন'], view: 'fleet',
      });
    }
    return items;
  },
  tabs: (d) => [
    { id: 'overview', label: ['Fleet Operations', 'ফ্লিট পরিচালনা'], icon: <Truck size={15} /> },
    { id: 'requisitions', label: ['Vehicle Requests', 'যানবাহন আবেদন'], icon: <Car size={15} />, badge: d.fleet.pendingRequisitions || undefined, badgeType: 'warn' },
    { id: 'corridor', label: ['Trips in Transit', 'চলমান ট্রিপ'], icon: <Navigation size={15} />, badge: d.fleet.inTransit || undefined, badgeType: 'info' },
  ],
  stats: (d) => [
    { label: ['Fleet available', 'গাড়ি উপলব্ধ'], value: `${d.fleet.available}/${d.fleet.total}`, sub: [`${d.fleet.inTransit} out on trips`, `${bn(d.fleet.inTransit)}টি ট্রিপে`], type: 'green', icon: <Truck size={16} /> },
    { label: ['Pending requisitions', 'অপেক্ষমান আবেদন'], value: String(d.fleet.pendingRequisitions), sub: ['Need a vehicle and driver', 'গাড়ি ও চালক বরাদ্দ প্রয়োজন'], type: d.fleet.pendingRequisitions > 0 ? 'warn' : 'blue', icon: <Car size={16} /> },
    { label: ['In workshop', 'ওয়ার্কশপে'], value: String(d.fleet.inWorkshop), sub: ['Maintenance or grounded', 'মেরামত বা বসানো'], type: d.fleet.inWorkshop > 0 ? 'red' : 'blue', icon: <Wrench size={16} /> },
    { label: ['Drivers available', 'চালক উপলব্ধ'], value: String(d.fleet.driversAvailable), sub: ['Ready for dispatch', 'ডিসপ্যাচের জন্য প্রস্তুত'], type: 'blue', icon: <UserCheck size={16} /> },
  ],
};

/* ──────────────────────────────── HR Admin ────────────────────────────── */

const hr_admin: DashboardRoleConfig = {
  attention: (d) => {
    const items: AttentionItem[] = [];
    const l = d.workforce.pendingLeave;
    if (l > 0) {
      items.push({
        id: 'leave', tone: 'warning',
        text: [`${l} leave ${plural(l, 'request is', 'requests are')} waiting for your decision.`, `${bn(l)}টি ছুটির আবেদন আপনার সিদ্ধান্তের অপেক্ষায়।`],
        cta: ['Decide', 'সিদ্ধান্ত দিন'], view: 'attendance',
      });
    }
    const a = d.workforce.absent;
    if (a > 0) {
      items.push({
        id: 'absent', tone: 'warning',
        text: [`${a} ${plural(a, 'person is', 'people are')} absent today without notice.`, `আজ ${bn(a)} জন না জানিয়ে অনুপস্থিত।`],
        cta: ['View', 'দেখুন'], view: 'attendance',
      });
    }
    const x = d.workforce.exitInProgress;
    if (x > 0) {
      items.push({
        id: 'exit', tone: 'info',
        text: [`${x} exit ${plural(x, 'clearance is', 'clearances are')} still in progress.`, `${bn(x)}টি ছাড়পত্র এখনো চলমান।`],
        cta: ['View', 'দেখুন'], tab: 'clearance',
      });
    }
    return items;
  },
  tabs: (d) => [
    { id: 'overview', label: ['Workforce Overview', 'কর্মী ওভারভিউ'], icon: <Users size={15} /> },
    { id: 'clearance', label: ['Exit Clearances', 'ছাড়পত্র'], icon: <UserCheck size={15} />, badge: d.workforce.exitInProgress || undefined, badgeType: 'warn' },
    { id: 'sites', label: ['Sites', 'কর্মস্থল'], icon: <Building2 size={15} /> },
  ],
  stats: (d) => [
    { label: ['Present today', 'আজকের উপস্থিতি'], value: String(d.workforce.present), sub: [`${d.workforce.remote} approved remote`, `${bn(d.workforce.remote)} জন অনুমোদিত দূরবর্তী`], type: 'green', icon: <Users size={16} /> },
    { label: ['Late arrivals', 'বিলম্বে আগমন'], value: String(d.workforce.late), sub: [`${d.workforce.absent} absent without notice`, `${bn(d.workforce.absent)} জন অনুপস্থিত`], type: d.workforce.absent > 0 ? 'red' : 'warn', icon: <Clock size={16} /> },
    { label: ['Leave requests', 'ছুটির আবেদন'], value: String(d.workforce.pendingLeave), sub: ['Pending HR decision', 'এইচআর সিদ্ধান্তের অপেক্ষায়'], type: 'warn', icon: <CalendarCheck size={16} /> },
    { label: ['Exit clearances', 'ছাড়পত্র'], value: String(d.workforce.exitInProgress), sub: ['In progress', 'চলমান'], type: 'blue', icon: <UserCheck size={16} /> },
  ],
};

/* ─────────────────────────────────── HOD ──────────────────────────────── */

export function deptBudgetUsed(d: DashboardLiveData): number {
  return DEPT_BUDGET.committedBeforeTodayBdt + d.approvals.approvedByMeBdt;
}

const hod: DashboardRoleConfig = {
  attention: (d) => {
    const items: AttentionItem[] = [];
    const n = d.approvals.pending.length;
    const urgent = d.approvals.urgent;
    if (n > 0) {
      items.push({
        id: 'approvals', tone: urgent > 0 ? 'danger' : 'warning',
        text: [
          `${n} ${plural(n, 'request needs', 'requests need')} your approval${urgent > 0 ? `; ${urgent} due within 24 hours` : ''}.`,
          `${bn(n)}টি আবেদনে আপনার অনুমোদন প্রয়োজন${urgent > 0 ? `; ${bn(urgent)}টি ২৪ ঘণ্টার মধ্যে` : ''}।`,
        ],
        cta: ['Review', 'দেখুন'], tab: 'approvals',
      });
    }
    const pct = Math.round((deptBudgetUsed(d) / DEPT_BUDGET.ceilingBdt) * 100);
    if (pct >= 80) {
      items.push({
        id: 'budget', tone: pct >= 90 ? 'danger' : 'warning',
        text: [`${pct}% of this quarter's budget is used. ${fmtBdt(DEPT_BUDGET.ceilingBdt - deptBudgetUsed(d))} is left.`, `এই প্রান্তিকের ${bn(pct)}% বাজেট ব্যবহৃত। বাকি ${fmtBdt(DEPT_BUDGET.ceilingBdt - deptBudgetUsed(d))}।`],
        cta: ['Review', 'দেখুন'], tab: 'approvals',
      });
    }
    return items;
  },
  tabs: (d) => [
    { id: 'overview', label: ['Department Hub', 'বিভাগ হাব'], icon: <Briefcase size={15} /> },
    { id: 'approvals', label: ['Pending Approvals', 'অনুমোদন তালিকা'], icon: <FileCheck size={15} />, badge: d.approvals.pending.length || undefined, badgeType: 'danger' },
  ],
  stats: (d) => [
    { label: ['Pending approvals', 'অপেক্ষমান অনুমোদন'], value: String(d.approvals.pending.length), sub: [`${d.approvals.urgent} within 24h SLA`, `${bn(d.approvals.urgent)}টি ২৪ ঘণ্টার মধ্যে`], type: d.approvals.urgent > 0 ? 'red' : 'blue', icon: <FileCheck size={16} /> },
    { label: ['Claims awaiting finance', 'অর্থ ছাড়ের অপেক্ষায় দাবি'], value: String(d.claims.financePending), sub: [`${d.claims.deptPending} from your own department`, `${bn(d.claims.deptPending)}টি আপনার বিভাগ থেকে`], type: d.claims.financePending > 0 ? 'warn' : 'blue', icon: <Receipt size={16} /> },
    { label: ['Budget used', 'বাজেট ব্যবহার'], value: `${Math.round((deptBudgetUsed(d) / DEPT_BUDGET.ceilingBdt) * 100)}%`, sub: [`${fmtBdt(deptBudgetUsed(d))} of ${fmtBdt(DEPT_BUDGET.ceilingBdt)}`, `${fmtBdt(DEPT_BUDGET.ceilingBdt)}-এর মধ্যে ${fmtBdt(deptBudgetUsed(d))}`], type: 'blue', icon: <BarChart3 size={16} /> },
    { label: ['Department present', 'বিভাগে উপস্থিত'], value: String(d.workforce.deptPresent), sub: ['On roster today', 'আজকের রোস্টারে'], type: 'green', icon: <Users size={16} /> },
  ],
};

/* ─────────────────────────────── Employee ─────────────────────────────── */

/** The signed-in user's roster record, or null when they have not punched in. */
function activeRecord(d: DashboardLiveData) {
  const rec = d.workforce.myRecord;
  return rec && rec.locationStatus !== 'absent' ? rec : null;
}

const employee: DashboardRoleConfig = {
  attention: (d) => {
    const items: AttentionItem[] = [];
    if (!activeRecord(d)) {
      items.push({
        id: 'punch', tone: 'warning',
        text: ["You haven't punched in today.", 'আপনি আজ এখনো পাঞ্চ-ইন করেননি।'],
        cta: ['Punch in', 'পাঞ্চ-ইন করুন'], view: 'attendance',
      });
    }
    return items;
  },
  tabs: () => [
    { id: 'overview', label: ['My Dashboard', 'আমার ড্যাশবোর্ড'], icon: <Users size={15} /> },
    { id: 'activity', label: ['Activity & Leave', 'কার্যক্রম ও ছুটি'], icon: <Activity size={15} /> },
  ],
  stats: () => [],
};

/* ──────────────────────────────── Driver ──────────────────────────────── */

const driver: DashboardRoleConfig = {
  attention: (d) => {
    const items: AttentionItem[] = [];
    const me = d.fleet.me;
    const trip = d.fleet.myMission;
    if (me?.breathalyzerToday === 'FAILED') {
      items.push({
        id: 'fitness', tone: 'danger',
        text: ['Your pre-trip fitness check failed. You cannot drive today.', 'আপনার ট্রিপ-পূর্ব ফিটনেস পরীক্ষা ব্যর্থ হয়েছে। আজ গাড়ি চালানো যাবে না।'],
      });
    } else if (me?.breathalyzerToday === 'PENDING') {
      items.push({
        id: 'fitness', tone: 'warning',
        text: ['Your pre-trip fitness check is pending at the dispatch yard.', 'ডিসপ্যাচ ইয়ার্ডে আপনার ট্রিপ-পূর্ব ফিটনেস পরীক্ষা বাকি।'],
      });
    }
    if (trip) {
      const from = trip.from.split(',')[0];
      const to = trip.to.split(',')[0];
      items.push({
        id: 'trip', tone: 'info',
        text: [`Trip: ${from} to ${to}, departs ${trip.departureTime}.`, `ট্রিপ: ${from} থেকে ${to}, ছাড়বে ${trip.departureTime}।`],
        cta: ['Open trip', 'ট্রিপ দেখুন'], tab: 'mission',
      });
    }
    if (me && me.dutyHoursToday >= 7) {
      items.push({
        id: 'hours', tone: 'warning',
        text: [`You have driven ${me.dutyHoursToday} hours today. Rest is required after 8.`, `আজ ${bn(me.dutyHoursToday)} ঘণ্টা ডিউটি হয়েছে। ৮ ঘণ্টার পর বিশ্রাম বাধ্যতামূলক।`],
      });
    }
    return items;
  },
  tabs: (d) => [
    { id: 'overview', label: ['Duty Cockpit', 'ডিউটি কক্পিট'], icon: <Gauge size={15} /> },
    { id: 'mission', label: ['Current Trip', 'বর্তমান ট্রিপ'], icon: <Navigation size={15} />, badge: d.fleet.myMission ? 1 : undefined, badgeType: 'info' },
    { id: 'tolls', label: ['Toll & Slips', 'টোল ও স্লিপ'], icon: <Receipt size={15} /> },
  ],
  stats: (d) => {
    const me = d.fleet.me;
    return [
      { label: ['Assigned vehicle', 'বরাদ্দকৃত গাড়ি'], value: me?.assignedVehiclePlate ?? d.fleet.myMission?.assignedVehiclePlate ?? '—', sub: [d.fleet.myMission?.assignedVehicleModel ?? 'No vehicle assigned', d.fleet.myMission?.assignedVehicleModel ?? 'কোনো গাড়ি বরাদ্দ নেই'], type: 'blue', icon: <Truck size={16} /> },
      { label: ['Duty hours today', 'আজকের ডিউটি ঘণ্টা'], value: `${me?.dutyHoursToday ?? 0}h`, sub: ['Limit 8 hours before rest', 'বিশ্রামের আগে সর্বোচ্চ ৮ ঘণ্টা'], type: (me?.dutyHoursToday ?? 0) >= 7 ? 'warn' : 'green', icon: <Clock size={16} /> },
      { label: ['Trips completed', 'সম্পন্ন ট্রিপ'], value: String(me?.totalTrips ?? 0), sub: ['Career total', 'মোট'], type: 'green', icon: <Navigation size={16} /> },
      { label: ['Pre-trip fitness check', 'ট্রিপ-পূর্ব ফিটনেস পরীক্ষা'], value: me?.breathalyzerToday === 'PENDING' ? 'Pending' : me?.breathalyzerToday === 'FAILED' ? 'Failed' : 'Passed', sub: ['Recorded at dispatch yard', 'ডিসপ্যাচ ইয়ার্ডে রেকর্ডকৃত'], type: me?.breathalyzerToday === 'FAILED' ? 'red' : me?.breathalyzerToday === 'PENDING' ? 'warn' : 'green', icon: <Star size={16} /> },
    ];
  },
};

export const DASHBOARD_CONFIG: Record<AppRole, DashboardRoleConfig> = {
  chairman,
  plant_gm,
  transport_admin,
  hr_admin,
  hod,
  employee,
  driver,
};
