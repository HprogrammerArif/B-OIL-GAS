/**
 * Per-role dashboard configuration.
 *
 * Each persona's hero strip, cockpit tabs, KPI cards and jump cards are
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
import type { AppRole } from '../../types';
import type { DashboardLiveData } from './useDashboardData';
import { INITIAL_LOTO_PERMITS, INNER_CIRCLE } from './dashboardData';
import { COMPLIANCE_HORIZON_DAYS } from './useDashboardData';

export type Bilingual = readonly [en: string, bn: string];
export type Tone = 'success' | 'info' | 'warning' | 'danger' | 'purple' | 'gold' | 'neutral';

export interface HeroStat {
  value: string | Bilingual;
  label: Bilingual;
  tone?: Tone;
}

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

export interface JumpCard {
  tab: string;
  icon: React.ReactNode;
  title: Bilingual;
  badge: { text: Bilingual; tone: Tone };
  desc: Bilingual;
  cta: Bilingual;
}

export interface DashboardRoleConfig {
  hero: (d: DashboardLiveData) => HeroStat[];
  tabs: (d: DashboardLiveData) => DashTab[];
  stats: (d: DashboardLiveData) => StatCard[];
  jumpCards: (d: DashboardLiveData) => JumpCard[];
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

function joinTitles(items: { title: string }[], max = 2): string {
  const names = items.slice(0, max).map((i) => i.title);
  const rest = items.length - names.length;
  return rest > 0 ? `${names.join(', ')} +${rest}` : names.join(', ');
}

/* ─────────────────────────────── Chairman ─────────────────────────────── */

const chairman: DashboardRoleConfig = {
  hero: (d) => {
    const mirrored = new Set(d.approvals.pending.map((a) => a.sourceId));
    const awaiting = d.approvals.pending.length + d.notesheets.awaitingMe.filter((f) => !mirrored.has(f.id)).length;
    return [
      { value: String(awaiting), label: ['Files awaiting your decision', 'আপনার সিদ্ধান্তের অপেক্ষায় ফাইল'], tone: awaiting > 0 ? 'gold' : 'success' },
      { value: `${d.workforce.present} / ${d.workforce.roster.length}`, label: ['Staff present today', 'আজ উপস্থিত কর্মী'], tone: 'success' },
      { value: String(d.compliance.dueSoon.length), label: [`Permits due within ${COMPLIANCE_HORIZON_DAYS} days`, `${bn(COMPLIANCE_HORIZON_DAYS)} দিনের মধ্যে নবায়নযোগ্য লাইসেন্স`], tone: d.compliance.critical > 0 ? 'danger' : 'info' },
    ];
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
  jumpCards: (d) => {
    const present = INNER_CIRCLE.filter((m) => m.status === 'present').length;
    const away = INNER_CIRCLE.filter((m) => m.status === 'meeting' || m.status === 'travel').length;
    const absent = INNER_CIRCLE.length - present - away;
    const n = d.approvals.pending.length;
    return [
      {
        tab: 'approvals', icon: <FileCheck size={18} color="var(--brand-crimson)" />,
        title: ['Priority Approvals', 'জরুরি অনুমোদন'],
        badge: { text: [`${n} ${plural(n, 'Pending', 'Pending')}`, `${bn(n)}টি অপেক্ষমান`], tone: n > 0 ? 'danger' : 'success' },
        desc: n > 0
          ? [`Awaiting your signature: ${joinTitles(d.approvals.pending)}.`, `আপনার স্বাক্ষরের অপেক্ষায়: ${joinTitles(d.approvals.pending)}।`]
          : ['Nothing is waiting on you right now.', 'এই মুহূর্তে কোনো ফাইল অপেক্ষমান নেই।'],
        cta: ['Open approval queue', 'অনুমোদন সারি দেখুন'],
      },
      {
        tab: 'inner_circle', icon: <Users size={18} color="var(--brand-gold-dark)" />,
        title: ['Leadership Team', 'নেতৃত্বের তালিকা'],
        badge: { text: [`${INNER_CIRCLE.length} Tracked`, `${bn(INNER_CIRCLE.length)} জন`], tone: 'info' },
        desc: [`${present} present at plant/HQ, ${away} in meetings or travelling, ${absent} on leave or absent.`, `${bn(present)} জন কর্মস্থলে, ${bn(away)} জন মিটিং/সফরে, ${bn(absent)} জন ছুটি/অনুপস্থিত।`],
        cta: ['View leadership roster', 'নেতৃত্ব উপস্থিতি দেখুন'],
      },
      {
        tab: 'notices', icon: <Bell size={18} color="var(--status-info)" />,
        title: ['Company Notices', 'নোটিশ বোর্ড'],
        badge: { text: [`${d.notices.unread} Unread`, `${bn(d.notices.unread)}টি অপঠিত`], tone: d.notices.unread > 0 ? 'warning' : 'neutral' },
        desc: [`${d.notices.total} circulars on the board; publish or pin board-level announcements from here.`, `বোর্ডে ${bn(d.notices.total)}টি বিজ্ঞপ্তি; এখান থেকে ঘোষণা প্রকাশ বা পিন করুন।`],
        cta: ['Open notice board', 'নোটিশ বোর্ড দেখুন'],
      },
    ];
  },
};

/* ─────────────────────────────── Plant GM ─────────────────────────────── */

const plant_gm: DashboardRoleConfig = {
  hero: (d) => [
    { value: String(d.workforce.plantPresent), label: ['On site at Keraniganj today', 'আজ কেরানীগঞ্জ প্ল্যান্টে উপস্থিত'], tone: 'success' },
    { value: String(d.incidents.open.length), label: ['Open incident files', 'খোলা দুর্ঘটনা ফাইল'], tone: d.incidents.highRisk > 0 ? 'danger' : 'info' },
    { value: String(INITIAL_LOTO_PERMITS.length), label: ['Active isolation permits (LOTO)', 'সক্রিয় আইসোলেশন পারমিট'], tone: 'warning' },
  ],
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
  jumpCards: () => [
    {
      tab: 'refinery', icon: <BarChart3 size={18} color="var(--status-info)" />,
      title: ['Production Log', 'উৎপাদন লগ'],
      badge: { text: ['24-hour view', '২৪ ঘণ্টার চিত্র'], tone: 'info' },
      desc: ['Bitumen 60/70 and 80/100 output as logged by shift engineers, with furnace and storage status.', 'শিফট প্রকৌশলীদের লগ অনুযায়ী বিটুমিন ৬০/৭০ ও ৮০/১০০ উৎপাদন এবং ফার্নেস ও স্টোরেজ অবস্থা।'],
      cta: ['Open production log', 'উৎপাদন লগ দেখুন'],
    },
    {
      tab: 'safety_loto', icon: <Lock size={18} color="var(--brand-crimson)" />,
      title: ['Safety Permits & Shift Handover', 'নিরাপত্তা পারমিট ও শিফট হস্তান্তর'],
      badge: { text: [`${INITIAL_LOTO_PERMITS.length} Active`, `${bn(INITIAL_LOTO_PERMITS.length)}টি সক্রিয়`], tone: 'danger' },
      desc: ['Lockout-tagout, hot-work and confined-space permits, plus the handover notes between Shift A, B and C.', 'লকআউট-ট্যাগআউট, হট-ওয়ার্ক ও কনফাইন্ড-স্পেস পারমিট এবং এ, বি ও সি শিফটের হস্তান্তর নোট।'],
      cta: ['View permits & shifts', 'পারমিট ও শিফট দেখুন'],
    },
  ],
};

/* ──────────────────────────── Transport Admin ─────────────────────────── */

const transport_admin: DashboardRoleConfig = {
  hero: (d) => [
    { value: `${d.fleet.available} / ${d.fleet.total}`, label: ['Vehicles available now', 'এখন উপলব্ধ যানবাহন'], tone: 'success' },
    { value: String(d.fleet.inTransit), label: ['Vehicles on the road', 'রাস্তায় থাকা যানবাহন'], tone: 'info' },
    { value: String(d.fleet.pendingRequisitions), label: ['Requisitions awaiting assignment', 'বরাদ্দের অপেক্ষায় আবেদন'], tone: d.fleet.pendingRequisitions > 0 ? 'warning' : 'success' },
  ],
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
  jumpCards: (d) => [
    {
      tab: 'requisitions', icon: <Car size={18} color="var(--status-warning)" />,
      title: ['Vehicle Requisitions', 'যানবাহন আবেদন'],
      badge: { text: [`${d.fleet.pendingRequisitions} Pending`, `${bn(d.fleet.pendingRequisitions)}টি বাকি`], tone: d.fleet.pendingRequisitions > 0 ? 'warning' : 'success' },
      desc: ['Review duty-travel requests from HQ and the plant; assign a roadworthy vehicle and a licensed driver.', 'সদর দপ্তর ও প্ল্যান্টের অফিসিয়াল ভ্রমণ আবেদন পর্যালোচনা করে গাড়ি ও লাইসেন্সধারী চালক বরাদ্দ করুন।'],
      cta: ['Manage requisitions', 'আবেদন নিষ্পত্তি করুন'],
    },
    {
      tab: 'corridor', icon: <Navigation size={18} color="var(--status-success)" />,
      title: ['Trips in Transit', 'চলমান ট্রিপ'],
      badge: { text: [`${d.fleet.inTransit} On the road`, `${bn(d.fleet.inTransit)}টি রাস্তায়`], tone: 'success' },
      desc: ['Vehicles currently on the road with their route, driver and expected return.', 'বর্তমানে রাস্তায় থাকা গাড়ি, রুট, চালক ও প্রত্যাশিত ফেরার সময়।'],
      cta: ['Open trip tracker', 'ট্রিপ ট্র্যাকার দেখুন'],
    },
  ],
};

/* ──────────────────────────────── HR Admin ────────────────────────────── */

const hr_admin: DashboardRoleConfig = {
  hero: (d) => [
    { value: String(d.workforce.employeesActive), label: ['Active employees on record', 'সক্রিয় কর্মী'], tone: 'info' },
    { value: `${d.workforce.present} / ${d.workforce.roster.length}`, label: ['Present today', 'আজ উপস্থিত'], tone: 'success' },
    { value: String(d.workforce.pendingLeave), label: ['Leave requests awaiting decision', 'সিদ্ধান্তের অপেক্ষায় ছুটির আবেদন'], tone: d.workforce.pendingLeave > 0 ? 'warning' : 'success' },
  ],
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
  jumpCards: (d) => [
    {
      tab: 'clearance', icon: <UserCheck size={18} color="var(--brand-crimson)" />,
      title: ['Exit Clearances', 'বহির্গমন ছাড়পত্র'],
      badge: { text: [`${d.workforce.exitInProgress} In progress`, `${bn(d.workforce.exitInProgress)}টি চলমান`], tone: 'warning' },
      desc: ['Four-way separation checklist (IT, security, fleet, finance) for leaving staff before final settlement.', 'চূড়ান্ত নিষ্পত্তির আগে বিদায়ী কর্মীদের ৪-ধাপ ছাড়পত্র (আইটি, নিরাপত্তা, পরিবহন, অর্থ)।'],
      cta: ['View clearance checklists', 'ছাড়পত্র তালিকা দেখুন'],
    },
    {
      tab: 'sites', icon: <Building2 size={18} color="var(--status-info)" />,
      title: ['Sites & Deployment', 'কর্মস্থল ও জনবল'],
      badge: { text: [`${d.workforce.employeesActive} Staff`, `${bn(d.workforce.employeesActive)} জন`], tone: 'info' },
      desc: [`${d.workforce.hqPresent} present at Dhaka HQ and ${d.workforce.plantPresent} at the Keraniganj plant today.`, `আজ ঢাকা সদর দপ্তরে ${bn(d.workforce.hqPresent)} জন ও কেরানীগঞ্জ প্ল্যান্টে ${bn(d.workforce.plantPresent)} জন উপস্থিত।`],
      cta: ['Inspect sites', 'কর্মস্থল দেখুন'],
    },
  ],
};

/* ─────────────────────────────────── HOD ──────────────────────────────── */

export function deptBudgetUsed(d: DashboardLiveData): number {
  return DEPT_BUDGET.committedBeforeTodayBdt + d.approvals.approvedByMeBdt;
}

const hod: DashboardRoleConfig = {
  hero: (d) => {
    const used = deptBudgetUsed(d);
    const pct = Math.round((used / DEPT_BUDGET.ceilingBdt) * 100);
    return [
      { value: String(d.approvals.pending.length), label: ['Approvals in your inbox', 'আপনার ইনবক্সে অনুমোদন'], tone: d.approvals.pending.length > 0 ? 'gold' : 'success' },
      { value: fmtBdt(DEPT_BUDGET.ceilingBdt - used), label: [`Budget remaining this quarter (${pct}% used)`, `এই প্রান্তিকে অবশিষ্ট বাজেট (${bn(pct)}% ব্যবহৃত)`], tone: pct >= 90 ? 'danger' : 'success' },
      { value: String(d.approvals.urgent), label: ['Items due within 24 hours', '২৪ ঘণ্টার মধ্যে নিষ্পত্তিযোগ্য'], tone: d.approvals.urgent > 0 ? 'danger' : 'info' },
    ];
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
  jumpCards: (d) => [
    {
      tab: 'approvals', icon: <FileCheck size={18} color="var(--brand-crimson)" />,
      title: ['Approval Inbox & Budget', 'অনুমোদন ইনবক্স ও বাজেট'],
      badge: { text: [`${d.approvals.pending.length} Pending`, `${bn(d.approvals.pending.length)}টি বাকি`], tone: d.approvals.pending.length > 0 ? 'danger' : 'success' },
      desc: [`Claims, duty travel, procurement and leave from your department. Budget remaining this quarter: ${fmtBdt(DEPT_BUDGET.ceilingBdt - deptBudgetUsed(d))}.`, `আপনার বিভাগের দাবি, ভ্রমণ, ক্রয় ও ছুটি। এই প্রান্তিকে অবশিষ্ট বাজেট: ${fmtBdt(DEPT_BUDGET.ceilingBdt - deptBudgetUsed(d))}।`],
      cta: ['Open approval queue', 'অনুমোদন সারি খুলুন'],
    },
  ],
};

/* ─────────────────────────────── Employee ─────────────────────────────── */

/** The signed-in user's roster record, or null when they have not punched in. */
function activeRecord(d: DashboardLiveData) {
  const rec = d.workforce.myRecord;
  return rec && rec.locationStatus !== 'absent' ? rec : null;
}

const employee: DashboardRoleConfig = {
  hero: (d) => {
    const rec = activeRecord(d);
    return [
      { value: rec ? rec.inTime : '—', label: rec ? ['Punched in today', 'আজ পাঞ্চ-ইন'] : ['Not punched in yet', 'এখনো পাঞ্চ-ইন হয়নি'], tone: rec ? 'success' : 'warning' },
      { value: d.claims.minePending.length > 0 ? fmtBdt(d.claims.minePendingBdt) : '৳0', label: [`${d.claims.minePending.length} ${plural(d.claims.minePending.length, 'claim', 'claims')} under review`, `${bn(d.claims.minePending.length)}টি দাবি পর্যালোচনাধীন`], tone: 'info' },
      { value: [`${d.workforce.myCasualLeaveBalance} days`, `${bn(d.workforce.myCasualLeaveBalance)} দিন`], label: ['Casual leave remaining', 'অবশিষ্ট ক্যাজুয়াল ছুটি'], tone: 'purple' },
    ];
  },
  tabs: () => [
    { id: 'overview', label: ['My Dashboard', 'আমার ড্যাশবোর্ড'], icon: <Users size={15} /> },
    { id: 'activity', label: ['Activity & Leave', 'কার্যক্রম ও ছুটি'], icon: <Activity size={15} /> },
  ],
  stats: (d) => {
    const rec = activeRecord(d);
    return [
      { label: ['Attendance today', 'আজকের উপস্থিতি'], value: rec ? rec.inTime : '—', sub: rec ? [rec.site === 'PLANT_KERANIGANJ' ? 'Keraniganj plant' : 'Dhaka HQ', rec.site === 'PLANT_KERANIGANJ' ? 'কেরানীগঞ্জ প্ল্যান্ট' : 'ঢাকা সদর দপ্তর'] : ['Punch in from Attendance', 'অ্যাটেনডেন্স থেকে পাঞ্চ-ইন করুন'], type: rec ? 'green' : 'warn', icon: <MapPin size={16} /> },
      { label: ['Claims under review', 'পর্যালোচনাধীন দাবি'], value: String(d.claims.minePending.length), sub: [fmtBdt(d.claims.minePendingBdt), fmtBdt(d.claims.minePendingBdt)], type: 'blue', icon: <Receipt size={16} /> },
      { label: ['Vehicle requests', 'যানবাহন আবেদন'], value: String(d.fleet.myRequisitions.length), sub: [d.fleet.myRequisitions.some((r) => r.status === 'assigned') ? 'Vehicle assigned' : 'Awaiting transport desk', d.fleet.myRequisitions.some((r) => r.status === 'assigned') ? 'গাড়ি বরাদ্দ হয়েছে' : 'পরিবহন ডেস্কের অপেক্ষায়'], type: 'warn', icon: <Car size={16} /> },
      { label: ['Casual leave balance', 'ক্যাজুয়াল ছুটি'], value: `${d.workforce.myCasualLeaveBalance}`, sub: ['Days remaining this year', 'এ বছর অবশিষ্ট দিন'], type: 'green', icon: <CalendarCheck size={16} /> },
    ];
  },
  jumpCards: () => [
    {
      tab: 'activity', icon: <Activity size={18} color="var(--status-success)" />,
      title: ['Recent Activity & Leave', 'সাম্প্রতিক কার্যক্রম ও ছুটি'],
      badge: { text: ['This month', 'এই মাস'], tone: 'success' },
      desc: ['Your punch history, shuttle pass, vehicle requests and leave balances in one place.', 'আপনার পাঞ্চ ইতিহাস, শাটল পাস, যানবাহন আবেদন ও ছুটির স্থিতি এক জায়গায়।'],
      cta: ['View activity & leave', 'কার্যক্রম ও ছুটি দেখুন'],
    },
  ],
};

/* ──────────────────────────────── Driver ──────────────────────────────── */

const DRIVER_STATUS: Record<string, Bilingual> = {
  available: ['Available for dispatch', 'ডিসপ্যাচের জন্য প্রস্তুত'],
  trip_assigned: ['Trip assigned', 'ট্রিপ নির্ধারিত'],
  on_trip: ['On trip', 'ট্রিপে আছেন'],
  off_duty: ['Off duty', 'ডিউটির বাইরে'],
  rest_required: ['Rest period', 'বিশ্রামে'],
  sick_leave: ['Sick leave', 'অসুস্থতাজনিত ছুটি'],
  on_leave: ['On leave', 'ছুটিতে'],
};

const driver: DashboardRoleConfig = {
  hero: (d) => {
    const me = d.fleet.me;
    const tripAssigned = me?.status === 'available' && d.fleet.myMission?.status === 'assigned';
    const status = tripAssigned
      ? DRIVER_STATUS.trip_assigned
      : me
        ? DRIVER_STATUS[me.status] ?? DRIVER_STATUS.available
        : DRIVER_STATUS.available;
    return [
      { value: status, label: ['Duty status', 'ডিউটি অবস্থা'], tone: me?.status === 'on_trip' || tripAssigned ? 'info' : 'success' },
      { value: `${me?.dutyHoursToday ?? 0} / 8 hrs`, label: ['Duty hours logged today', 'আজকের ডিউটি ঘণ্টা'], tone: (me?.dutyHoursToday ?? 0) >= 7 ? 'warning' : 'info' },
      { value: me ? `${me.rating.toFixed(1)} / 5.0 ★` : '—', label: ['Passenger rating', 'যাত্রী রেটিং'], tone: 'gold' },
    ];
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
  jumpCards: (d) => [
    {
      tab: 'mission', icon: <Navigation size={18} color="var(--status-info)" />,
      title: ['Current Trip', 'বর্তমান ট্রিপ'],
      badge: { text: d.fleet.myMission ? [d.fleet.myMission.status === 'in_transit' ? 'In transit' : 'Assigned', d.fleet.myMission.status === 'in_transit' ? 'চলমান' : 'বরাদ্দকৃত'] : ['None', 'নেই'], tone: d.fleet.myMission ? 'info' : 'neutral' },
      desc: d.fleet.myMission
        ? [`${d.fleet.myMission.from.split(',')[0]} → ${d.fleet.myMission.to.split(',')[0]} · departs ${d.fleet.myMission.departureTime}`, `${d.fleet.myMission.from.split(',')[0]} → ${d.fleet.myMission.to.split(',')[0]} · ছাড়বে ${d.fleet.myMission.departureTime}`]
        : ['No trip assigned yet. The transport desk will notify you.', 'এখনো কোনো ট্রিপ বরাদ্দ হয়নি। পরিবহন ডেস্ক জানাবে।'],
      cta: ['Open trip details', 'ট্রিপ বিবরণ দেখুন'],
    },
    {
      tab: 'tolls', icon: <Receipt size={18} color="var(--status-warning)" />,
      title: ['Toll & Fuel Slips', 'টোল ও জ্বালানি স্লিপ'],
      badge: { text: ['Submit', 'জমা দিন'], tone: 'warning' },
      desc: ['Log toll plaza receipts and fuel slips for reimbursement against your trip pass.', 'ট্রিপ পাসের বিপরীতে টোল রসিদ ও জ্বালানি স্লিপ জমা দিন।'],
      cta: ['Open slips', 'স্লিপ দেখুন'],
    },
  ],
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
