import React, { useState, useEffect } from 'react';
import { ViewProps, t, AppRole } from '../types';
import {
  Users, FileCheck, AlertTriangle, TrendingUp, Clock, CheckCircle,
  Building2, Zap, ArrowUpRight, Eye, ShieldCheck, ChevronRight,
  Crown, Gauge, Truck, Package, MapPin, Car, Briefcase,
  DollarSign, Calendar, Award, BarChart3, Shield, Fuel,
  Thermometer, Activity, Bell, MessageSquare, UserCheck,
  Bus, Receipt, PieChart, Target, Navigation, CalendarClock,
  Sparkles, Check, QrCode, FileSignature, Download, Printer,
  Cpu, Wrench, Lock, ArrowRight, CheckSquare, Square
} from 'lucide-react';
import { showToast } from '../App';
import AnimatedCounter from '../components/AnimatedCounter';
import Sparkline from '../components/Sparkline';
import RefineryOutputChart from '../components/RefineryOutputChart';
import DetailDrawer, { DetailDrawerData } from '../components/DetailDrawer';
import Pagination from '../components/Pagination';
import { useFleetStore } from '../store/fleetStore';

/* ═══════════════════════════════════════════
   INNER CIRCLE DATA (Chairman only)
   ═══════════════════════════════════════════ */
const INNER_CIRCLE = [
  { name: 'Engr. M. Harunur Rashid', role: 'Plant GM, Keraniganj', initials: 'HR', color: '#0369A1', status: 'present', statusLabel: 'Present at Plant', statusLabelBn: 'প্ল্যান্টে উপস্থিত', badge: 'present', location: 'Control Room Unit-1', phone: '+880 1711-002101' },
  { name: 'Farida Begum', role: 'CFO & Finance Director', initials: 'FB', color: '#7C3AED', status: 'meeting', statusLabel: 'In Board Meeting', statusLabelBn: 'বোর্ড মিটিংয়ে আছেন', badge: 'meeting', location: 'Boardroom A, Dhaka HQ', phone: '+880 1711-002102' },
  { name: 'Adv. Karim Molla', role: 'Head of Legal & Compliance', initials: 'KM', color: '#059669', status: 'travel', statusLabel: 'At BSTI Inspection', statusLabelBn: 'বিএসটিআই পরিদর্শনে', badge: 'travel', location: 'BSTI Directorate, Tejgaon', phone: '+880 1711-002103' },
  { name: 'Md. Shafiqul Islam', role: 'Director, Sales & Dist.', initials: 'SI', color: '#D97706', status: 'present', statusLabel: 'Present at HQ', statusLabelBn: 'সদর দপ্তরে উপস্থিত', badge: 'present', location: 'Level-8 Commercial Wing', phone: '+880 1711-002104' },
  { name: 'Engr. Tariq Ahmed', role: 'Plant Engineer, Unit-2', initials: 'TA', color: '#A51C30', status: 'leave', statusLabel: 'Informed Leave (Pre-Approved)', statusLabelBn: 'অনুমোদিত ছুটি (অবহিত)', badge: 'leave', location: 'Dhanmondi, Dhaka', phone: '+880 1711-002105' },
  { name: 'Dr. Rafiqul Huq', role: 'Chief Chemist & Lab Head', initials: 'RH', color: '#D97706', status: 'sick', statusLabel: 'Sick Leave (Medical Cert)', statusLabelBn: 'অসুস্থতাজনিত ছুটি (মেডিকেল)', badge: 'warn', location: 'Apollo Hospital Dhaka', phone: '+880 1711-002107' },
  { name: 'Kazi Moinul Islam', role: 'Chief SCADA DCS Automation', initials: 'MI', color: '#DC2626', status: 'uninformed', statusLabel: '⚠️ Uninformed Absent', statusLabelBn: '⚠️ অননুমোদিত অনুপস্থিত', badge: 'danger', location: 'Unknown (No Biometric/App Punch)', phone: '+880 1711-002108' },
  { name: 'Nusrat Jahan', role: 'GM, Human Resources', initials: 'NJ', color: '#0891B2', status: 'present', statusLabel: 'Present at HQ', statusLabelBn: 'সদর দপ্তরে উপস্থিত', badge: 'present', location: 'HR Suite, Dhaka HQ', phone: '+880 1711-002106' },
];

const PENDING_APPROVALS: DetailDrawerData[] = [
  {
    id: 'BOGCL/PROC/2026/0894',
    title: 'Safety Valve Procurement — Keraniganj Plant',
    amount: '৳48,50,000',
    dept: 'Plant Maintenance',
    urgency: 'urgent',
    time: '2h pending',
    initiator: 'Engr. Md. Harunur Rashid',
    description: 'Procurement of 12 ASME Section VIII safety relief valves for Bitumen Distillation Column C-102. Verified in SAP S/4HANA PO #90412.',
    sapRef: 'SAP-PR-2026-90412',
  },
  {
    id: 'BOGCL/HR/2026/0342',
    title: 'Annual Increment Policy — Grade 7-10 Staff',
    amount: 'Policy',
    dept: 'Human Resources',
    urgency: 'normal',
    time: '1d pending',
    initiator: 'Nusrat Jahan',
    description: 'Performance-indexed statutory grade revision covering 482 refinery shift technicians and field operators.',
    sapRef: 'SAP-HR-POL-0342',
  },
  {
    id: 'BOGCL/FIN/2026/0211',
    title: 'Q4 Fuel & Utility Budget Revision',
    amount: '৳1,20,00,000',
    dept: 'Finance',
    urgency: 'normal',
    time: '3h pending',
    initiator: 'Farida Begum',
    description: 'Refinery natural gas utility feed tariff recalculation as gazetted by BERC for industrial steam co-generation boilers.',
    sapRef: 'SAP-FI-BUD-0211',
  },
];

const NOTICE_BOARD = [
  { title: 'Mandatory Safety Briefing — Q4 Plant Operations', title_bn: 'বাধ্যতামূলক নিরাপত্তা ব্রিফিং', tag: '⚠️ SAFETY CRITICAL', date: 'Oct 15, 2026', read: false, pinned: true },
  { title: 'HSE Incident Report Submission Deadline Extended', title_bn: 'এইচএসই ঘটনা প্রতিবেদন জমার সময়সীমা বর্ধিত', tag: 'HSE', date: 'Oct 13, 2026', read: true, pinned: false },
  { title: 'Annual Medical Check-up Camp — Nov 4-6, 2026 (All Staff)', title_bn: 'বার্ষিক স্বাস্থ্য পরীক্ষা শিবির — ৪-৬ নভেম্বর ২০২৬', tag: 'HR Circular', date: 'Oct 10, 2026', read: true, pinned: false },
];

/* ═══════════════════════════════════════════
   ROLE-SPECIFIC STAT CARDS
   ═══════════════════════════════════════════ */
interface StatDef {
  label: string;
  labelBn: string;
  value: string;
  sub: string;
  type: string;
  icon: React.ReactNode;
  sparkline: number[];
  sparkColor: string;
}

const ROLE_STATS: Record<AppRole, StatDef[]> = {
  chairman: [
    { label: 'Present Today', labelBn: 'আজকের উপস্থিতি', value: '743', sub: '94.2% of total workforce', type: 'green', icon: <Users size={16}/>, sparkline: [710, 725, 718, 730, 738, 740, 743], sparkColor: '#059669' },
    { label: 'Urgent Approvals', labelBn: 'জরুরি অনুমোদন', value: '3', sub: '2 files >48hrs overdue', type: 'red', icon: <FileCheck size={16}/>, sparkline: [8, 6, 5, 4, 3, 4, 3], sparkColor: '#DC2626' },
    { label: 'License Alerts', labelBn: 'লাইসেন্স সতর্কতা', value: '5', sub: '2 critical <30 days', type: 'warn', icon: <AlertTriangle size={16}/>, sparkline: [6, 6, 5, 5, 5, 4, 5], sparkColor: '#D97706' },
    { label: 'Revenue This Month', labelBn: 'এই মাসের রাজস্ব', value: '৳18.2 Cr', sub: '+8% vs target', type: 'blue', icon: <TrendingUp size={16}/>, sparkline: [14.2, 15.1, 16.0, 16.8, 17.5, 17.9, 18.2], sparkColor: '#0284C7' },
  ],
  plant_gm: [
    { label: 'Plant Headcount', labelBn: 'প্ল্যান্টে উপস্থিত', value: '218', sub: 'Keraniganj Refinery, today', type: 'green', icon: <Users size={16}/>, sparkline: [205, 210, 212, 215, 214, 217, 218], sparkColor: '#059669' },
    { label: 'DCS Active Alarms', labelBn: 'ডিসিএস সক্রিয় অ্যালার্ম', value: '3', sub: '1 high priority — Column C-102 temp', type: 'red', icon: <Zap size={16}/>, sparkline: [5, 4, 4, 3, 2, 3, 3], sparkColor: '#DC2626' },
    { label: 'Active Work Orders', labelBn: 'সক্রিয় কার্যাদেশ', value: '14', sub: '4 preventive, 10 corrective', type: 'warn', icon: <FileCheck size={16}/>, sparkline: [18, 16, 15, 14, 15, 14, 14], sparkColor: '#D97706' },
    { label: 'Refinery Efficiency', labelBn: 'রিফাইনারি দক্ষতা', value: '96.3%', sub: '+1.2% vs last week', type: 'blue', icon: <Gauge size={16}/>, sparkline: [94.1, 94.8, 95.2, 95.7, 95.9, 96.1, 96.3], sparkColor: '#0284C7' },
  ],
  transport_admin: [
    { label: 'Fleet Available', labelBn: 'গাড়ি উপলব্ধ', value: '8/24', sub: '16 assigned to active trips', type: 'green', icon: <Truck size={16}/>, sparkline: [10, 9, 8, 11, 7, 9, 8], sparkColor: '#059669' },
    { label: 'Pending Requests', labelBn: 'অনিষ্পন্ন আবেদন', value: '5', sub: '2 urgent from Directors', type: 'warn', icon: <Clock size={16}/>, sparkline: [8, 7, 6, 5, 4, 6, 5], sparkColor: '#D97706' },
    { label: 'Active Trips Now', labelBn: 'চলমান ট্রিপ', value: '11', sub: '3 to Keraniganj Plant', type: 'blue', icon: <Navigation size={16}/>, sparkline: [7, 8, 9, 10, 11, 12, 11], sparkColor: '#0284C7' },
    { label: 'Fuel Consumed Today', labelBn: 'আজকের জ্বালানি ব্যবহার', value: '340 L', sub: '৳32,640 — within daily budget', type: 'green', icon: <Fuel size={16}/>, sparkline: [280, 310, 295, 320, 330, 335, 340], sparkColor: '#059669' },
  ],
  hr_admin: [
    { label: 'Active Workforce', labelBn: 'সক্রিয় কর্মী', value: '743', sub: 'Across HQ, Plant & Terminal', type: 'green', icon: <Users size={16}/>, sparkline: [730, 735, 738, 740, 741, 742, 743], sparkColor: '#059669' },
    { label: 'Pending Clearances', labelBn: 'বহির্গমন ছাড়পত্র', value: '1', sub: '1 separation in-progress (50%)', type: 'warn', icon: <FileCheck size={16}/>, sparkline: [3, 2, 2, 1, 1, 1, 1], sparkColor: '#D97706' },
    { label: 'Today Attendance', labelBn: 'আজকের বায়োমেট্রিক', value: '94.8%', sub: 'Haversine geofenced verified', type: 'blue', icon: <TrendingUp size={16}/>, sparkline: [92, 93, 93.5, 94, 94.2, 94.5, 94.8], sparkColor: '#0284C7' },
    { label: 'SAP HCM Sync', labelBn: 'এসএপি এইচসিএম সিঙ্ক', value: '100%', sub: 'PERNR Master up to date', type: 'green', icon: <ShieldCheck size={16}/>, sparkline: [100, 100, 100, 100, 100, 100, 100], sparkColor: '#059669' },
  ],
  hod: [
    { label: 'Pending Approvals', labelBn: 'অনুমোদন বাকি', value: '7', sub: '3 expense + 2 travel + 2 leave', type: 'warn', icon: <FileCheck size={16}/>, sparkline: [12, 10, 9, 8, 7, 8, 7], sparkColor: '#D97706' },
    { label: 'Dept. Attendance', labelBn: 'বিভাগীয় উপস্থিতি', value: '96%', sub: 'Finance & Accounts, today', type: 'green', icon: <Users size={16}/>, sparkline: [92, 94, 93, 95, 96, 95, 96], sparkColor: '#059669' },
    { label: 'Budget Utilization', labelBn: 'বাজেট ব্যবহার', value: '72%', sub: '৳38.4L of ৳53.2L Q4 allocation', type: 'blue', icon: <PieChart size={16}/>, sparkline: [45, 52, 58, 63, 68, 70, 72], sparkColor: '#0284C7' },
    { label: 'Overdue Actions', labelBn: 'মেয়াদোত্তীর্ণ কাজ', value: '2', sub: 'SLA breach in 24hrs', type: 'red', icon: <AlertTriangle size={16}/>, sparkline: [5, 4, 4, 3, 2, 2, 2], sparkColor: '#DC2626' },
  ],
  employee: [
    { label: 'My Attendance', labelBn: 'আমার উপস্থিতি', value: '22/23', sub: 'October 2026 — 1 sick leave', type: 'green', icon: <CheckCircle size={16}/>, sparkline: [18, 19, 20, 21, 22], sparkColor: '#059669' },
    { label: 'Pending Claims', labelBn: 'দাবিপত্র বাকি', value: '৳4,850', sub: 'Oct conveyance — awaiting HOD', type: 'warn', icon: <Receipt size={16}/>, sparkline: [2100, 3200, 4850], sparkColor: '#D97706' },
    { label: 'My Parcel', labelBn: 'আমার পার্সেল', value: '1 In Transit', sub: 'From Head Office → Keraniganj', type: 'blue', icon: <Package size={16}/>, sparkline: [0, 1, 1], sparkColor: '#0284C7' },
    { label: 'Bus Seat', labelBn: 'বাস সিট', value: 'Seat #7', sub: 'Route 3 — Mirpur ↔ Plant', type: 'green', icon: <Bus size={16}/>, sparkline: [7, 7, 7], sparkColor: '#059669' },
  ],
};

/* ═══════════════════════════════════════════
   PLANT GM SPECIFIC DATA & LOTO PERMITS
   ═══════════════════════════════════════════ */
const DCS_ALARMS = [
  { id: 'ALM-001', tag: 'TI-C102-14', desc: 'Column C-102 Top Temperature HIGH', value: '342°C', limit: '335°C', severity: 'high', time: '10:42 AM', ack: false },
  { id: 'ALM-002', tag: 'PI-R201-03', desc: 'Reactor R-201 Pressure Warning', value: '4.2 bar', limit: '4.5 bar', severity: 'medium', time: '10:15 AM', ack: true },
  { id: 'ALM-003', tag: 'LI-TK-05', desc: 'Tank TK-05 Base Oil Level Low', value: '22%', limit: '25%', severity: 'low', time: '09:30 AM', ack: true },
];

const INITIAL_LOTO_PERMITS = [
  { id: 'LOTO-044', equipment: 'Bitumen Feed Pump P-101B', breaker: 'Substation Feeder 4B-12', issuedTo: 'Tariq Ahmed', status: 'LOCKED OUT', hazard: 'High Voltage & Molten Hydrocarbon' },
  { id: 'HOT-019', equipment: 'Flare Header Elevation +14m', breaker: 'N/A (Hot Work Weld)', issuedTo: 'Kamrul Hasan', status: 'ACTIVE PERMIT', hazard: 'Sparking in Hazardous Zone-1' },
];

const SHIFT_HANDOVER = [
  { shift: 'Night → Morning', handover: 'Engr. Babul → Engr. Tariq', time: '06:00 AM', status: 'completed', notes: 'Unit-2 catalyst bed normal. Column C-102 temp trending high — monitor closely.' },
  { shift: 'Morning → Afternoon', handover: 'Engr. Tariq → Engr. Kamrul', time: '02:00 PM', status: 'upcoming', notes: 'Scheduled: Valve isolation on V-204 for maintenance window.' },
];

/* ═══════════════════════════════════════════
   TRANSPORT ADMIN SPECIFIC DATA
   ═══════════════════════════════════════════ */
const INITIAL_VEHICLE_REQUESTS = [
  { id: 'VR-2026-142', requester: 'Md. Shafiqul Islam', designation: 'Director, Sales', from: 'HQ Baridhara', to: 'Chittagong Port', date: 'Oct 18', time: '08:00 AM', passengers: 2, priority: 'high', status: 'pending' },
  { id: 'VR-2026-143', requester: 'Farida Begum', designation: 'CFO', from: 'HQ Baridhara', to: 'Bangladesh Bank', date: 'Oct 17', time: '02:00 PM', passengers: 1, priority: 'high', status: 'pending' },
  { id: 'VR-2026-144', requester: 'Tanvir Ahmed', designation: 'Sr. Sales Executive', from: 'HQ Baridhara', to: 'Keraniganj Plant', date: 'Oct 17', time: '11:00 AM', passengers: 3, priority: 'normal', status: 'pending' },
  { id: 'VR-2026-145', requester: 'Kamrul Hasan', designation: 'Boiler Operator', from: 'Mirpur-10', to: 'Keraniganj Plant', date: 'Oct 17', time: '06:00 AM', passengers: 1, priority: 'normal', status: 'assigned' },
  { id: 'VR-2026-146', requester: 'Nusrat Jahan', designation: 'GM, HR', from: 'HQ Baridhara', to: 'BGMEA Building', date: 'Oct 18', time: '10:00 AM', passengers: 2, priority: 'normal', status: 'pending' },
];

/* ═══════════════════════════════════════════
   HOD SPECIFIC DATA
   ═══════════════════════════════════════════ */
const INITIAL_HOD_QUEUE = [
  { id: 'APR-001', type: 'Leave', icon: '📅', title: 'Annual Leave — Tanvir Ahmed', detail: 'Oct 20-24, 2026 (5 days)', dept: 'Sales', time: '2h ago', urgency: 'normal', costTk: 0 },
  { id: 'APR-002', type: 'Expense', icon: '💰', title: 'Travel Expense Claim — Chittagong Visit', detail: 'Chittagong client visit, Oct 10-12', dept: 'Sales', time: '1d ago', urgency: 'normal', costTk: 12400 },
  { id: 'APR-003', type: 'Conveyance', icon: '🚌', title: 'Monthly Conveyance — Sep 2026', detail: '22 working days × ৳191/day', dept: 'Finance', time: '3d ago', urgency: 'overdue', costTk: 4200 },
  { id: 'APR-004', type: 'TA/DA', icon: '✈️', title: 'TA/DA Request — Sylhet Site Visit', detail: 'Oct 25-27, ৳18,500 estimated', dept: 'Sales', time: '4h ago', urgency: 'normal', costTk: 18500 },
  { id: 'APR-005', type: 'Purchase', icon: '🛒', title: 'Stationery & Consumables Requisition — Q4', detail: 'High-speed printer toners + secure pouches', dept: 'Finance', time: '2d ago', urgency: 'normal', costTk: 8700 },
  { id: 'APR-006', type: 'Document', icon: '📄', title: 'Policy Amendment — WFH Guidelines', detail: 'Updated remote work policy draft', dept: 'HR', time: '5h ago', urgency: 'normal', costTk: 0 },
  { id: 'APR-007', type: 'Leave', icon: '📅', title: 'Sick Leave — Rahim Uddin (Backdated)', detail: 'Oct 14, medical certificate attached', dept: 'Finance', time: '1d ago', urgency: 'overdue', costTk: 0 },
];

/* ═══════════════════════════════════════════
   EMPLOYEE SPECIFIC DATA
   ═══════════════════════════════════════════ */
const MY_RECENT_ACTIVITY = [
  { icon: '✅', title: 'Attendance logged', detail: 'Punch-in at 08:52 AM — Inside geofence (South Gate)', time: 'Today, 08:52 AM' },
  { icon: '📄', title: 'Conveyance claim submitted', detail: '৳4,850 for October 2026 — Pending HOD review', time: 'Today, 09:30 AM' },
  { icon: '📦', title: 'Parcel dispatched to you', detail: 'From Head Office → Keraniganj — In Transit', time: 'Yesterday, 04:15 PM' },
  { icon: '🚌', title: 'Bus seat confirmed', detail: 'Seat #7, Route 3 (Mirpur → Plant) — Active Pass', time: 'Oct 14, 2026' },
];

export default function DashboardView({ role, lang }: ViewProps) {
  const [selectedDrawerItem, setSelectedDrawerItem] = useState<DetailDrawerData | null>(null);
  const stats = ROLE_STATS[role] || ROLE_STATS.chairman;

  // Plant GM State
  const [showBatchReleaseModal, setShowBatchReleaseModal] = useState(false);
  const [lotoPermits, setLotoPermits] = useState(INITIAL_LOTO_PERMITS);

  // HOD State
  const [hodQueue, setHodQueue] = useState(INITIAL_HOD_QUEUE);
  const [selectedHodIds, setSelectedHodIds] = useState<string[]>([]);
  const [approvedAmountSum, setApprovedAmountSum] = useState(0);

  // Transport & Fleet Store
  const { requisitions: sharedRequisitions, assignRequisition: sharedAssignRequisition, vehicles: sharedVehicles, drivers: sharedDrivers } = useFleetStore();

  // Employee State
  const [showGatePassModal, setShowGatePassModal] = useState(false);

  // Chairman Notice Board State
  const [notices, setNotices] = useState(NOTICE_BOARD);

  // Cockpit Segmented Tabs & Pagination State (Solves Information Overload)
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [approvalsPage, setApprovalsPage] = useState(1);
  const [innerCirclePage, setInnerCirclePage] = useState(1);
  const [innerCircleFilter, setInnerCircleFilter] = useState<string>('all');
  const [noticesPage, setNoticesPage] = useState(1);
  const [requisitionsPage, setRequisitionsPage] = useState(1);
  const [hodQueuePage, setHodQueuePage] = useState(1);
  const [lotoPage, setLotoPage] = useState(1);

  useEffect(() => {
    setActiveTab('overview');
  }, [role]);

  const getRoleTabs = () => {
    switch (role) {
      case 'chairman':
        return [
          { id: 'overview',     label: 'Strategic Cockpit',    labelBn: 'কক্পিট সংক্ষিপ্ত', icon: <Crown size={15} /> },
          { id: 'approvals',    label: 'Priority Approvals',   labelBn: 'জরুরি অনুমোদন',    icon: <FileCheck size={15} />, badge: PENDING_APPROVALS.length, badgeType: 'danger' as const },
          { id: 'inner_circle', label: 'Inner Circle Roster',  labelBn: 'ইনার সার্কেল',      icon: <Users size={15} />, badge: INNER_CIRCLE.length, badgeType: 'info' as const },
          { id: 'notices',      label: 'Corporate Notices',    labelBn: 'নোটিশ বোর্ড',      icon: <Bell size={15} />, badge: notices.filter(n => !n.read).length || undefined, badgeType: 'warn' as const },
        ];
      case 'plant_gm':
        return [
          { id: 'overview',    label: 'Plant SCADA Console',  labelBn: 'প্ল্যান্ট কনসোল',    icon: <Gauge size={15} />, badge: DCS_ALARMS.length, badgeType: 'danger' as const },
          { id: 'refinery',    label: 'Refinery Production',  labelBn: 'উৎপাদন চার্ট',      icon: <BarChart3 size={15} /> },
          { id: 'safety_loto', label: 'LOTO Safety & Shifts', labelBn: 'নিরাপত্তা পারমিট',  icon: <Lock size={15} />, badge: lotoPermits.length, badgeType: 'warn' as const },
        ];
      case 'transport_admin':
        return [
          { id: 'overview',     label: 'Fleet Operations',     labelBn: 'ফ্লিট হাব',         icon: <Truck size={15} /> },
          { id: 'requisitions', label: 'Travel Requisitions',  labelBn: 'যানবাহন আবেদন',    icon: <Car size={15} />, badge: sharedRequisitions.filter(r => r.status === 'pending').length, badgeType: 'warn' as const },
          { id: 'corridor',     label: 'Corridor Transit HUD', labelBn: 'টোল করিডোর',       icon: <Navigation size={15} /> },
        ];
      case 'hod':
        return [
          { id: 'overview',  label: 'Department Hub',        labelBn: 'বিভাগ হাব',          icon: <Briefcase size={15} /> },
          { id: 'approvals', label: 'Omni-Approval Queue',   labelBn: 'অনুমোদন সারি',       icon: <FileCheck size={15} />, badge: hodQueue.length, badgeType: 'danger' as const },
        ];
      case 'hr_admin':
        return [
          { id: 'overview',  label: 'Workforce Cockpit',     labelBn: 'কর্মী কক্পিট',      icon: <Users size={15} /> },
          { id: 'clearance', label: 'Exit Clearances',       labelBn: 'ছাড়পত্র অডিট',     icon: <UserCheck size={15} />, badge: '1', badgeType: 'warn' as const },
          { id: 'sites',     label: 'Site Deployment Nodes', labelBn: 'আঞ্চলিক নোড',      icon: <Building2 size={15} /> },
        ];
      case 'employee':
        return [
          { id: 'overview', label: 'My Launchpad',           labelBn: 'সেলফ-সার্ভিস',      icon: <Sparkles size={15} /> },
          { id: 'activity', label: 'Activity & Entitlements',labelBn: 'কার্যক্রম ও ছুটি',   icon: <Activity size={15} /> },
        ];
      default:
        return [{ id: 'overview', label: 'Overview', labelBn: 'সংক্ষিপ্ত', icon: <Crown size={15} /> }];
    }
  };

  const filteredInnerCircle = INNER_CIRCLE.filter(p => {
    if (innerCircleFilter === 'all') return true;
    return p.status === innerCircleFilter;
  });

  const handleRowClick = (item: DetailDrawerData) => {
    setSelectedDrawerItem(item);
  };

  // HOD Batch Handlers
  const toggleSelectHodItem = (id: string) => {
    setSelectedHodIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleBatchApproveHod = () => {
    if (selectedHodIds.length === 0) return;
    const approvedCost = hodQueue
      .filter(item => selectedHodIds.includes(item.id))
      .reduce((sum, item) => sum + item.costTk, 0);
    
    setApprovedAmountSum(prev => prev + approvedCost);
    setHodQueue(prev => prev.filter(item => !selectedHodIds.includes(item.id)));
    showToast(t(
      `✓ Batch approved ${selectedHodIds.length} items (৳${approvedCost.toLocaleString()} debited from Q4 budget). SAP entries synced.`,
      `✓ ${selectedHodIds.length}টি আবেদন অনুমোদিত (৳${approvedCost.toLocaleString()} কিউ৪ বাজেট থেকে কর্তিত)।`,
      lang
    ), 'gold');
    setSelectedHodIds([]);
  };

  const handleApproveSingleHod = (item: typeof INITIAL_HOD_QUEUE[0]) => {
    setApprovedAmountSum(prev => prev + item.costTk);
    setHodQueue(prev => prev.filter(x => x.id !== item.id));
    showToast(t(`✓ Approved ${item.title}.`, `✓ অনুমোদিত: ${item.title}`, lang), 'success');
  };

  return (
    <div className="view-container page-enter-active">

      {/* ═══════════════════════════════════════════
          ROI BANNER — Role-specific messaging
          ═══════════════════════════════════════════ */}
      <div className="roi-banner">
        <div className="roi-stats-row">
          {role === 'chairman' && (
            <>
              <div className="roi-stat-item">
                <div className="val"><AnimatedCounter value="৳ 4,82,50,000" /></div>
                <div className="lbl">{t('Net Realized Savings & Loss Mitigation', 'সাশ্রয় ও ক্ষতি প্রতিরোধ (চলতি অর্থবছর)', lang)}</div>
              </div>
              <div className="roi-stat-item divider">
                <div className="val" style={{ color: '#34D399' }}><AnimatedCounter value="284 Days" /></div>
                <div className="lbl">{t('Zero-Shutdown Safety Record', 'শূন্য শাটডাউন নিরাপদ কর্মদিবস', lang)}</div>
              </div>
              <div className="roi-stat-item divider">
                <div className="val" style={{ color: '#38BDF8' }}><AnimatedCounter value="৳ 18.2 Cr" /></div>
                <div className="lbl">{t('October Revenue (Running)', 'অক্টোবর রাজস্ব (চলমান)', lang)}</div>
              </div>
            </>
          )}
          {role === 'plant_gm' && (
            <>
              <div className="roi-stat-item">
                <div className="val"><AnimatedCounter value="5,000 MT/Day" /></div>
                <div className="lbl">{t('Refinery Output — Keraniganj', 'রিফাইনারি উৎপাদন — কেরানীগঞ্জ', lang)}</div>
              </div>
              <div className="roi-stat-item divider">
                <div className="val" style={{ color: '#34D399' }}><AnimatedCounter value="96.3%" /></div>
                <div className="lbl">{t('Overall Equipment Effectiveness (OEE)', 'যন্ত্রপাতি সামগ্রিক কার্যকারিতা', lang)}</div>
              </div>
              <div className="roi-stat-item divider">
                <div className="val" style={{ color: '#FBBF24' }}><AnimatedCounter value="2 Active LOTO" /></div>
                <div className="lbl">{t('Lockout-Tagout Safety Isolations', 'সক্রিয় এলওটিও নিরাপত্তা ট্যাগ', lang)}</div>
              </div>
            </>
          )}
          {role === 'transport_admin' && (
            <>
              <div className="roi-stat-item">
                <div className="val"><AnimatedCounter value="24 Heavy Fleet" /></div>
                <div className="lbl">{t('Tankers & Executive Pool', 'ট্যাংকার ও নির্বাহী বহর', lang)}</div>
              </div>
              <div className="roi-stat-item divider">
                <div className="val" style={{ color: '#34D399' }}><AnimatedCounter value="0.00% Zero Theft" /></div>
                <div className="lbl">{t('Fuel Dip-Rod Variance Today', 'জ্বালানি পরিমাপ নির্ভুলতা', lang)}</div>
              </div>
              <div className="roi-stat-item divider">
                <div className="val" style={{ color: '#38BDF8' }}><AnimatedCounter value="৳ 14,80,000" /></div>
                <div className="lbl">{t('Fleet Cost Savings (AI Pooling)', 'ফ্লিট পুলিং সাশ্রয়', lang)}</div>
              </div>
            </>
          )}
          {role === 'hr_admin' && (
            <>
              <div className="roi-stat-item">
                <div className="val"><AnimatedCounter value="743 Personnel" /></div>
                <div className="lbl">{t('Total Active Corporate Workforce', 'মোট সক্রিয় কর্মকর্তা ও কর্মচারী', lang)}</div>
              </div>
              <div className="roi-stat-item divider">
                <div className="val" style={{ color: '#34D399' }}><AnimatedCounter value="94.8% Checked In" /></div>
                <div className="lbl">{t('Geofenced Attendance (Shift-A)', 'জিওফেন্স উপস্থিতি (শিফট-এ)', lang)}</div>
              </div>
              <div className="roi-stat-item divider">
                <div className="val" style={{ color: '#FBBF24' }}><AnimatedCounter value="1 In Clearance" /></div>
                <div className="lbl">{t('Active Separation Exit Checklist', 'সক্রিয় বহির্গমন ছাড়পত্র অডিট', lang)}</div>
              </div>
            </>
          )}
          {role === 'hod' && (
            <>
              <div className="roi-stat-item">
                <div className="val"><AnimatedCounter value={`${hodQueue.length} Items`} /></div>
                <div className="lbl">{t('Pending Your Approval', 'আপনার অনুমোদনের অপেক্ষায়', lang)}</div>
              </div>
              <div className="roi-stat-item divider">
                <div className="val" style={{ color: '#F87171' }}><AnimatedCounter value="2 Overdue" /></div>
                <div className="lbl">{t('SLA Breach Alert (<24h)', 'এসএলএ লঙ্ঘন সতর্কতা', lang)}</div>
              </div>
              <div className="roi-stat-item divider">
                <div className="val" style={{ color: '#34D399' }}>
                  <AnimatedCounter value={`৳ ${(3840000 + approvedAmountSum).toLocaleString()}`} />
                </div>
                <div className="lbl">{t('Q4 Budget Debited (of ৳53.2L)', 'চতুর্থ ত্রৈমাসিক বাজেট কর্তিত', lang)}</div>
              </div>
            </>
          )}
          {role === 'employee' && (
            <>
              <div className="roi-stat-item">
                <div className="val"><AnimatedCounter value="22/23 Days" /></div>
                <div className="lbl">{t('October Attendance Record', 'অক্টোবর উপস্থিতি রেকর্ড', lang)}</div>
              </div>
              <div className="roi-stat-item divider">
                <div className="val" style={{ color: '#FBBF24' }}><AnimatedCounter value="৳ 4,850" /></div>
                <div className="lbl">{t('Conveyance Claim — Pending HOD', 'যাতায়াত দাবি — অনুমোদনের অপেক্ষায়', lang)}</div>
              </div>
              <div className="roi-stat-item divider">
                <div className="val" style={{ color: '#38BDF8' }}><AnimatedCounter value="14 Days" /></div>
                <div className="lbl">{t('Casual / Sick Leave Balance', 'অবশিষ্ট ছুটি ব্যালেন্স', lang)}</div>
              </div>
            </>
          )}
        </div>

        {/* Action button inside banner */}
        {role === 'chairman' && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-gold" style={{ fontSize: '11px', padding: '6px 12px' }}
              onClick={() => showToast(t('Executive Audit Report generated.', 'অডিট রিপোর্ট প্রস্তুত', lang), 'gold')}>
              📊 {t('Executive ROI Dossier', 'আরওআই বিবরণী', lang)}
            </button>
          </div>
        )}

        {role === 'plant_gm' && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-gold" style={{ fontSize: '11.5px', padding: '6px 14px', fontWeight: 800 }}
              onClick={() => setShowBatchReleaseModal(true)}>
              ★ {t('Release Bitumen Batch', 'বিটুমিন ব্যাচ রিলিজ', lang)}
            </button>
          </div>
        )}

        {role === 'hr_admin' && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-gold" style={{ fontSize: '11px', padding: '6px 14px' }}
              onClick={() => showToast(t('Workforce monthly compliance digest dispatched to Chairman.', 'কর্মশক্তি মাসিক কমপ্লায়েন্স রিপোর্ট প্রস্তুত।', lang), 'gold')}>
              📋 {t('Workforce Audit Dossier', 'কর্মী অডিট বিবরণী', lang)}
            </button>
          </div>
        )}

        {role === 'employee' && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-gold" style={{ fontSize: '11px', padding: '6px 14px' }}
              onClick={() => setShowGatePassModal(true)}>
              <QrCode size={13} style={{ display: 'inline', marginRight: '5px' }} />
              {t('Digital Gate Pass', 'ডিজিটাল গেট পাস', lang)}
            </button>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════
          COCKPIT SEGMENTED TABS BAR
          ═══════════════════════════════════════════ */}
      <div className="cockpit-tabs-container mb-4">
        {getRoleTabs().map(tab => (
          <button
            key={tab.id}
            className={`cockpit-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            <span>{t(tab.label, tab.labelBn, lang)}</span>
            {tab.badge !== undefined && (
              <span className={`cockpit-tab-badge ${tab.badgeType || ''}`}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════
          TAB CONTENT: OVERVIEW (Lightweight & Uncluttered)
          ═══════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="tab-pane-fade">
          {/* CHAIRMAN: Executive Ribbon */}
          {role === 'chairman' && (
            <div className="exec-ribbon">
              <div className="ribbon-left">
                <div className="ribbon-icon">👑</div>
                <div className="ribbon-text">
                  <h4>{t('Chairman\'s 3-Point Decision Briefing', 'চেয়ারম্যান মহোদয়ের ৩-দফা নীতিগত ব্রিফিং', lang)}</h4>
                  <p>{t(
                    '1. Keraniganj Output: 5,000 MT/Day (96.3%) • 2. Net Cash Outflow Pending: ৳ 48.5L • 3. Explosives License Due: 18 Days',
                    '১. কেরানীগঞ্জ উৎপাদন: ৫,০০০ মে.টন/দিন (৯৬.৩%) • ২. বকেয়া অনুমোদন: ৪৮.৫ লাখ • ৩. বিস্ফোরক লাইসেন্স: ১৮ দিন বাকি',
                    lang
                  )}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn-ribbon" onClick={() => showToast('60-Sec Voice Memo delivered.', 'gold')}>
                  🎙️ {t('Send Voice Briefing', 'ভয়েস ব্রিফিং পাঠান', lang)}
                </button>
              </div>
            </div>
          )}

          {/* PLANT GM: DCS Alarm Banner */}
          {role === 'plant_gm' && (
            <div className="dcs-alarm-banner">
              <div className="ribbon-left">
                <div className="ribbon-icon">🔴</div>
                <div className="ribbon-text">
                  <h4>{t('DCS SCADA Alarm Console — Keraniganj Complex Unit-1 & Unit-2', 'ডিসিএস স্ক্যাডা অ্যালার্ম কনসোল', lang)}</h4>
                  <p>{t('Column C-102 top temp 342°C (Set Point 335°C). Reflux pump P-102 operating at 85% capacity. All vacuum seals nominal.', 'কলাম C-102 তাপমাত্রা ৩৪২°C। রিফ্লাক্স পাম্প ৮৫% গতিতে সক্রিয়।', lang)}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn-ribbon" style={{ background: '#DC2626' }} onClick={() => showToast('🔴 Alarm acknowledged. Set point trimmed by 2°C.', 'danger')}>
                  ⚡ {t('Acknowledge Alarm', 'অ্যালার্ম স্বীকৃতি', lang)}
                </button>
              </div>
            </div>
          )}

          {/* EMPLOYEE: Quick Action Launchpad */}
          {role === 'employee' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                <div
                  className="card interactive-row"
                  style={{ padding: '16px', textAlign: 'center', cursor: 'pointer', border: '1px solid #BFDBFE', background: '#EFF6FF' }}
                  onClick={() => showToast('📍 Geofence verified: Punched In at South Gate Keraniganj Complex (08:52 AM)', 'success')}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#3B82F6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                    <MapPin size={20} />
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '13px', color: '#1E40AF' }}>Clock-In Geofence</div>
                  <div style={{ fontSize: '11px', color: '#60A5FA', marginTop: '2px' }}>Verified Biometric GPS</div>
                </div>

                <div
                  className="card interactive-row"
                  style={{ padding: '16px', textAlign: 'center', cursor: 'pointer', border: '1px solid var(--brand-gold-muted)', background: 'var(--brand-card-bg)' }}
                  onClick={() => showToast('🚗 Duty Vehicle requisition modal initiated.', 'info')}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#F59E0B', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                    <Car size={20} />
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '13px', color: 'var(--brand-gold-dark)' }}>Request Vehicle</div>
                  <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)', marginTop: '2px' }}>Inter-terminal transit</div>
                </div>

                <div
                  className="card interactive-row"
                  style={{ padding: '16px', textAlign: 'center', cursor: 'pointer', border: '1px solid #A7F3D0', background: '#ECFDF5' }}
                  onClick={() => showToast('🚌 Commuter Shuttle Pass: Seat #7, Mirpur-Keraniganj Express Active', 'success')}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#10B981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                    <Bus size={20} />
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '13px', color: '#065F46' }}>Shuttle Bus Pass</div>
                  <div style={{ fontSize: '11px', color: '#059669', marginTop: '2px' }}>Seat #7 Confirmed</div>
                </div>

                <div
                  className="card interactive-row"
                  style={{ padding: '16px', textAlign: 'center', cursor: 'pointer', border: '1px solid #DDD6FE', background: '#F5F3FF' }}
                  onClick={() => showToast('🧾 Local Conveyance & Tour Claim form ready.', 'info')}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#8B5CF6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                    <Receipt size={20} />
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '13px', color: '#5B21B6' }}>Submit Claim</div>
                  <div style={{ fontSize: '11px', color: '#7C3AED', marginTop: '2px' }}>Grade 7-10 Matrix</div>
                </div>
              </div>

              {/* Active Requisition Status Banner for Employee */}
              {sharedRequisitions.filter(r => r.requesterName.includes('Tanvir')).slice(0, 1).map(myReq => (
                <div key={myReq.id} className="card mb-4" style={{ background: myReq.status === 'assigned' ? '#F0FDF4' : '#FFFBEB', border: myReq.status === 'assigned' ? '1px solid #86EFAC' : '1px solid #FDE68A', padding: '14px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Car size={20} color={myReq.status === 'assigned' ? '#16A34A' : '#D97706'} />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--brand-slate-900)' }}>
                          {myReq.status === 'assigned' ? '✓ Vehicle & Driver Allocated for Your Duty Travel' : '⏳ Vehicle Requisition Under Review by Transport Admin (Md. Kamruzzaman)'}
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--brand-slate-600)' }}>
                          {myReq.id} • {myReq.from.split(',')[0]} ➔ {myReq.to.split(',')[0]} ({myReq.tripType === 'round_trip' ? 'Round Trip' : 'One-Way'}) • Departure: {myReq.departureTime}
                        </div>
                        {myReq.status === 'assigned' && (
                          <div style={{ fontSize: '12px', color: '#15803D', fontWeight: 700, marginTop: '3px' }}>
                            Car: {myReq.assignedVehiclePlate} • Driver: {myReq.assignedDriverName} (📞 {myReq.assignedDriverPhone}) • Pass #{myReq.tripPassNo}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className={`badge ${myReq.status === 'assigned' ? 'success' : 'warn'}`}>
                      {myReq.status === 'assigned' ? 'DISPATCH READY' : 'PENDING ADMIN'}
                    </span>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* STATS GRID — High-level KPI cards with sparklines */}
          <div className="stats-grid mb-5">
            {stats.map((s, i) => (
              <div key={i} className={`stat-card ${s.type}`}>
                <div className="stat-top">
                  <div className="stat-label">{t(s.label, s.labelBn, lang)}</div>
                  <div className="stat-icon-wrap">{s.icon}</div>
                </div>
                <div className="stat-main-row">
                  <div className="stat-value"><AnimatedCounter value={s.value} /></div>
                  <Sparkline data={s.sparkline} color={s.sparkColor} />
                </div>
                <div className="stat-sub">{s.sub}</div>
              </div>
            ))}
          </div>

          {/* PROGRESSIVE DISCLOSURE JUMP CARDS (Zero clutter — clean direct pathways) */}
          <div className="tab-jump-grid">
            {role === 'chairman' && (
              <>
                <div className="tab-jump-card interactive-row" onClick={() => setActiveTab('approvals')}>
                  <div className="tab-jump-top">
                    <div className="tab-jump-title">
                      <FileCheck size={18} color="var(--brand-crimson)" />
                      <span>{t('Priority Approvals', 'জরুরি অনুমোদন', lang)}</span>
                    </div>
                    <span className="badge danger">3 {t('Pending', 'অপেক্ষমান', lang)}</span>
                  </div>
                  <div className="tab-jump-desc">
                    {t('High-value files awaiting Chairman\'s signature: ASME Safety Valves (৳48.5L), Grade 7-10 HR Policy, and Q4 Utility Budget (৳1.2 Cr).', 'চেয়ারম্যান মহোদয়ের স্বাক্ষরের অপেক্ষায় ৩টি উচ্চমূল্যের ফাইল: সেফটি ভালভ (৪৮.৫ লাখ), এইচআর নীতিমালা ও কিউ৪ ইউটিলিটি বাজেট।', lang)}
                  </div>
                  <div className="tab-jump-footer">
                    <span>{t('Open Approval Queue', 'অনুমোদন সারি দেখুন', lang)}</span>
                    <ArrowRight size={14} />
                  </div>
                </div>

                <div className="tab-jump-card interactive-row" onClick={() => setActiveTab('inner_circle')}>
                  <div className="tab-jump-top">
                    <div className="tab-jump-title">
                      <Users size={18} color="var(--brand-gold-dark)" />
                      <span>{t('Executive Inner Circle', 'ইনার সার্কেল নেতৃত্ব', lang)}</span>
                    </div>
                    <span className="badge info">8 {t('Tracked', 'ট্র্যাকড', lang)}</span>
                  </div>
                  <div className="tab-jump-desc">
                    {t('Live presence roster of key leadership: 4 Present at Plant/HQ, 1 Board Meeting, 1 BSTI Travel, 🔴 1 Uninformed Absent.', 'মূল নেতৃত্বের রিয়েল-টাইম উপস্থিতি: ৪ জন কর্মস্থলে, ১ জন মিটিংয়ে, ১ জন সরকারি পরিদর্শনে, ১ জন অননুমোদিত অনুপস্থিত।', lang)}
                  </div>
                  <div className="tab-jump-footer">
                    <span>{t('View Executive Roster', 'নেতৃত্ব উপস্থিতি তালিকা', lang)}</span>
                    <ArrowRight size={14} />
                  </div>
                </div>

                <div className="tab-jump-card interactive-row" onClick={() => setActiveTab('notices')}>
                  <div className="tab-jump-top">
                    <div className="tab-jump-title">
                      <Bell size={18} color="#0284C7" />
                      <span>{t('Enterprise Notices', 'এন্টারপ্রাইজ নোটিশ বোর্ড', lang)}</span>
                    </div>
                    <span className="badge gold">{notices.length} {t('Circulars', 'বিজ্ঞপ্তি', lang)}</span>
                  </div>
                  <div className="tab-jump-desc">
                    {t('Latest circulars & announcements: Chairman\'s Eid Message, Mandatory Q4 Plant Safety Briefing, HSE Incident protocol.', 'সর্বশেষ নোটিশ ও ঘোষণা: চেয়ারম্যানের বার্তা, চতুর্থ ত্রৈমাসিক নিরাপত্তা ব্রিফিং ও এইচএসই প্রটোকল।', lang)}
                  </div>
                  <div className="tab-jump-footer">
                    <span>{t('Open Notice Board', 'নোটিশ বোর্ড দেখুন', lang)}</span>
                    <ArrowRight size={14} />
                  </div>
                </div>
              </>
            )}

            {role === 'plant_gm' && (
              <>
                <div className="tab-jump-card interactive-row" onClick={() => setActiveTab('refinery')}>
                  <div className="tab-jump-top">
                    <div className="tab-jump-title">
                      <BarChart3 size={18} color="#0284C7" />
                      <span>{t('Refinery Telemetry & Output', 'উৎপাদন ও ডিস্টিলেশন চার্ট', lang)}</span>
                    </div>
                    <span className="badge success">5,000 MT/Day</span>
                  </div>
                  <div className="tab-jump-desc">
                    {t('96.3% Overall Equipment Effectiveness (OEE). 24-hour Bitumen 60/70 & 80/100 production yield graph and furnace vacuum seals.', '৯৬.৩% সামগ্রিক কার্যকারিতা। ২৪ ঘণ্টার বিটুমিন উৎপাদন লেখচিত্র এবং ফার্নেস ভ্যাকুয়াম অবস্থা।', lang)}
                  </div>
                  <div className="tab-jump-footer">
                    <span>{t('Inspect Refinery Production', 'উৎপাদন গ্রাফ দেখুন', lang)}</span>
                    <ArrowRight size={14} />
                  </div>
                </div>

                <div className="tab-jump-card interactive-row" onClick={() => setActiveTab('safety_loto')}>
                  <div className="tab-jump-top">
                    <div className="tab-jump-title">
                      <Lock size={18} color="var(--brand-crimson)" />
                      <span>{t('LOTO Safety & Shift Handover', 'এলওটিও নিরাপত্তা ও শিফট লগ', lang)}</span>
                    </div>
                    <span className="badge danger">{lotoPermits.length} {t('Active Isolations', 'সক্রিয় আইসোলেশন', lang)}</span>
                  </div>
                  <div className="tab-jump-desc">
                    {t('OSHA 1910.147 Control of Hazardous Energy permits & shift handover continuity between Shift-A, B and C engineers.', 'ঝুঁকিপূর্ণ শক্তি নিয়ন্ত্রণ পারমিট এবং এ, বি ও সি শিফটের প্রকৌশলীদের ধারাবাহিকতা লগ।', lang)}
                  </div>
                  <div className="tab-jump-footer">
                    <span>{t('View LOTO Permits & Shifts', 'পারমিট ও শিফট লগ দেখুন', lang)}</span>
                    <ArrowRight size={14} />
                  </div>
                </div>
              </>
            )}

            {role === 'transport_admin' && (
              <>
                <div className="tab-jump-card interactive-row" onClick={() => setActiveTab('requisitions')}>
                  <div className="tab-jump-top">
                    <div className="tab-jump-title">
                      <Car size={18} color="#D97706" />
                      <span>{t('Duty Travel Requisitions', 'অফিসিয়াল যানবাহন আবেদন', lang)}</span>
                    </div>
                    <span className="badge warn">{sharedRequisitions.filter(r => r.status === 'pending').length} {t('Pending', 'বাকি', lang)}</span>
                  </div>
                  <div className="tab-jump-desc">
                    {t('Review inter-depot and headquarters transport applications. Assign roadworthy vehicles and certified drivers.', 'হেডকোয়ার্টার ও ডিপো যাতায়াত আবেদন পর্যালোচনা এবং চালক ও গাড়ি বরাদ্দ নিশ্চিত করুন।', lang)}
                  </div>
                  <div className="tab-jump-footer">
                    <span>{t('Manage Requisitions', 'আবেদন নিষ্পত্তি করুন', lang)}</span>
                    <ArrowRight size={14} />
                  </div>
                </div>

                <div className="tab-jump-card interactive-row" onClick={() => setActiveTab('corridor')}>
                  <div className="tab-jump-top">
                    <div className="tab-jump-title">
                      <Navigation size={18} color="#059669" />
                      <span>{t('Corridor Transit & Toll Alerts', 'ট্যাংকার করিডোর ও টোল সতর্কতা', lang)}</span>
                    </div>
                    <span className="badge success">Live Telematics</span>
                  </div>
                  <div className="tab-jump-desc">
                    {t('Live telematics for Babubazar Bridge, Postogola Toll Plaza and Padma Bridge Expressway heavy carrier corridor.', 'বাবুবাজার ব্রিজ, পোস্তগোলা টোল ও পদ্মা সেতু এক্সপ্রেসওয়েতে ভারী ট্যাংকার করিডোরের লাইভ তথ্য।', lang)}
                  </div>
                  <div className="tab-jump-footer">
                    <span>{t('Open Corridor HUD', 'করিডোর ট্র্যাকার দেখুন', lang)}</span>
                    <ArrowRight size={14} />
                  </div>
                </div>
              </>
            )}

            {role === 'hr_admin' && (
              <>
                <div className="tab-jump-card interactive-row" onClick={() => setActiveTab('clearance')}>
                  <div className="tab-jump-top">
                    <div className="tab-jump-title">
                      <UserCheck size={18} color="var(--brand-crimson)" />
                      <span>{t('Exit Clearance Audits', 'বহির্গমন ছাড়পত্র অডিট', lang)}</span>
                    </div>
                    <span className="badge warn">1 In Progress</span>
                  </div>
                  <div className="tab-jump-desc">
                    {t('Track 4-way separation audits (IT, Security, Fleet, Finance) for resigning personnel prior to final settlement.', 'চাকরি ইস্তফাদানকারী কর্মীদের ৪-ধাপ নিরীক্ষা (আইটি, সিকিউরিটি, ফ্লিট, ফিন্যান্স) ট্র্যাকিং।', lang)}
                  </div>
                  <div className="tab-jump-footer">
                    <span>{t('View Clearance Checklists', 'ছাড়পত্র বিবরণী দেখুন', lang)}</span>
                    <ArrowRight size={14} />
                  </div>
                </div>

                <div className="tab-jump-card interactive-row" onClick={() => setActiveTab('sites')}>
                  <div className="tab-jump-top">
                    <div className="tab-jump-title">
                      <Building2 size={18} color="#0284C7" />
                      <span>{t('Regional Deployment Nodes', 'আঞ্চলিক জনবল ডেপ্লয়মেন্ট', lang)}</span>
                    </div>
                    <span className="badge info">743 Staff</span>
                  </div>
                  <div className="tab-jump-desc">
                    {t('Deployment distribution across Dhaka HQ (420), Keraniganj Bitumen Refinery (218) and Chattogram Terminal (105).', 'ঢাকা সদর দপ্তর (৪২০), কেরানীগঞ্জ রিফাইনারি (২১৮) ও চট্টগ্রাম টার্মিনালে (১০৫) জনবল বণ্টন।', lang)}
                  </div>
                  <div className="tab-jump-footer">
                    <span>{t('Inspect Site Nodes', 'আঞ্চলিক নোড দেখুন', lang)}</span>
                    <ArrowRight size={14} />
                  </div>
                </div>
              </>
            )}

            {role === 'hod' && (
              <div className="tab-jump-card interactive-row" onClick={() => setActiveTab('approvals')}>
                <div className="tab-jump-top">
                  <div className="tab-jump-title">
                    <FileCheck size={18} color="var(--brand-crimson)" />
                    <span>{t('Omni-Approval Inbox & OPEX Ceiling', 'বিভাগীয় অনুমোদন ইনবক্স ও বাজেট', lang)}</span>
                  </div>
                  <span className="badge danger">{hodQueue.length} {t('Pending', 'বাকি', lang)}</span>
                </div>
                <div className="tab-jump-desc">
                  {t('Multi-category triage for employee conveyance claims, duty travel, stationery POs, and leave applications. Safe OPEX buffer remaining: ৳', 'যাতায়াত দাবি, ভ্রমণ, স্টেশনারি ক্রয় ও ছুটির অনুমোদন। অবশিষ্ট নিরাপদ পরিচালন বাজেট: ৳', lang)}{(5320000 - (3840000 + approvedAmountSum)).toLocaleString()}.
                </div>
                <div className="tab-jump-footer">
                  <span>{t('Open Approval Queue & Batch Actions', 'অনুমোদন সারি ও ব্যাচ অ্যাকশন খুলুন', lang)}</span>
                  <ArrowRight size={14} />
                </div>
              </div>
            )}

            {role === 'employee' && (
              <div className="tab-jump-card interactive-row" onClick={() => setActiveTab('activity')}>
                <div className="tab-jump-top">
                  <div className="tab-jump-title">
                    <Activity size={18} color="#059669" />
                    <span>{t('Recent Activity & Leave Entitlements', 'সাম্প্রতিক কার্যক্রম ও ছুটি স্থিতি', lang)}</span>
                  </div>
                  <span className="badge success">Active</span>
                </div>
                <div className="tab-jump-desc">
                  {t('Check your biometric punch timeline, shuttle pass details, approved requisitions, and casual/sick leave balances.', 'আপনার বায়োমেট্রিক পাঞ্চ টাইমলাইন, শাটল পাস, অনুমোদিত রিকুইজিশন এবং ক্যাজুয়াল/মেডিকেল ছুটি স্থিতি দেখুন।', lang)}
                </div>
                <div className="tab-jump-footer">
                  <span>{t('View Detailed Activity & Leave Ledger', 'বিস্তারিত কার্যক্রম ও ছুটি লেজার দেখুন', lang)}</span>
                  <ArrowRight size={14} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          CHAIRMAN: TAB "approvals" (Paginated)
          ═══════════════════════════════════════════ */}
      {role === 'chairman' && activeTab === 'approvals' && (
        <div className="card mb-5 tab-pane-fade">
          <div className="card-hd">
            <div className="card-hd-left">
              <div className="card-hd-icon">⚡</div>
              <div>
                <div className="card-title">{t('Priority Approvals — Chairman\'s Action Required', 'জরুরি অনুমোদন — চেয়ারম্যানের পদক্ষেপ প্রয়োজন', lang)}</div>
                <div className="card-subtitle">{t('High-value files escalated to Chairman\'s office', 'উচ্চ-মূল্যের ফাইল চেয়ারম্যান দপ্তরে উন্নীত', lang)}</div>
              </div>
            </div>
            <span className="badge danger">{PENDING_APPROVALS.length} {t('items', 'টি ফাইল', lang)}</span>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {PENDING_APPROVALS.slice((approvalsPage - 1) * 2, approvalsPage * 2).map((item, i) => (
                <div
                  key={i}
                  className="approval-interactive-card"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderLeft: `4px solid ${item.urgency === 'urgent' ? 'var(--brand-crimson)' : 'var(--brand-slate-400)'}`
                  }}
                  onClick={() => handleRowClick(item)}
                >
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--brand-slate-900)' }}>{item.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--brand-slate-400)', marginTop: '2px' }}>
                      {item.id} · {item.dept} · <strong style={{ color: 'var(--brand-gold-dark)' }}>{item.amount}</strong>
                    </div>
                  </div>
                  <div className="flex-gap" onClick={(e) => e.stopPropagation()}>
                    <button className="btn-gold" style={{ fontSize: '11px', padding: '6px 14px' }} onClick={() => showToast(`👑 Chairman authorized: ${item.id}`, 'gold')}>
                      👑 {t('Authorize', 'অনুমোদন', lang)}
                    </button>
                    <button className="btn-outline" style={{ fontSize: '11px', padding: '6px 12px' }} onClick={() => handleRowClick(item)}>
                      {t('Inspect File', 'নথি দেখুন', lang)}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <Pagination
              currentPage={approvalsPage}
              totalItems={PENDING_APPROVALS.length}
              pageSize={2}
              onPageChange={setApprovalsPage}
              lang={lang}
            />
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          CHAIRMAN: TAB "inner_circle" (Paginated & Filterable)
          ═══════════════════════════════════════════ */}
      {role === 'chairman' && activeTab === 'inner_circle' && (
        <div className="card mb-5 tab-pane-fade">
          <div className="card-hd">
            <div className="card-hd-left">
              <div className="card-hd-icon">👥</div>
              <div>
                <div className="card-title">{t('Inner Circle — Executive Presence', 'ইনার সার্কেল — নেতৃত্ব উপস্থিতি', lang)}</div>
                <div className="card-subtitle">{t('Live status of key leadership across Refinery, Finance & Operations', 'মূল নেতৃত্বের লাইভ স্ট্যাটাস', lang)}</div>
              </div>
            </div>
            <span className="badge success">{filteredInnerCircle.length} {t('executives', 'জন কর্মকর্তা', lang)}</span>
          </div>
          <div className="card-body">
            {/* Interactive Filter Pills */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px', fontSize: '11px' }}>
              {[
                { id: 'all', label: 'All Tracked (8)', bg: '#F1F5F9', color: '#334155' },
                { id: 'present', label: '🟢 Present (4)', bg: '#ECFDF5', color: '#065F46' },
                { id: 'meeting', label: '🔵 In Meeting (1)', bg: '#EFF6FF', color: '#1E40AF' },
                { id: 'leave', label: '🟡 Informed Leave (1)', bg: '#FEF3C7', color: '#92400E' },
                { id: 'sick', label: '🟠 Sick Leave (1)', bg: '#FFFBEB', color: '#B45309' },
                { id: 'uninformed', label: '🔴 Uninformed Absent (1)', bg: '#FEE2E2', color: '#991B1B' },
              ].map(pill => (
                <button
                  key={pill.id}
                  onClick={() => { setInnerCircleFilter(pill.id); setInnerCirclePage(1); }}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    border: innerCircleFilter === pill.id ? '2px solid var(--brand-crimson)' : '1px solid transparent',
                    background: pill.bg,
                    color: pill.color,
                    fontWeight: innerCircleFilter === pill.id ? 800 : 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            <div className="presence-list">
              {filteredInnerCircle.slice((innerCirclePage - 1) * 4, innerCirclePage * 4).map((person, i) => (
                <div
                  key={i}
                  className="presence-row interactive-row"
                  onClick={() => {
                    if (person.status === 'uninformed') {
                      showToast(`🚨 URGENT: HR GM Sayeda Afroza instructed to initiate formal inquiry for ${person.name}.`, 'danger');
                    } else {
                      showToast(`📍 ${person.name} location: ${person.location} (${person.phone})`, 'info');
                    }
                  }}
                  title="Click to view leadership detail or trigger intervention"
                  style={{
                    background: person.status === 'uninformed' ? '#FEF2F2' : undefined,
                    border: person.status === 'uninformed' ? '1px solid #FECACA' : undefined
                  }}
                >
                  <div className="presence-person">
                    <div className="presence-avatar" style={{ background: person.color }}>{person.initials}</div>
                    <div>
                      <div className="prs-name">{person.name}</div>
                      <div className="prs-role">{person.role} • <span style={{ fontSize: '10.5px', color: 'var(--brand-slate-400)' }}>{person.location}</span></div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={`badge ${person.badge}`}>{t(person.statusLabel, person.statusLabelBn, lang)}</span>
                    {person.status === 'uninformed' ? (
                      <button
                        className="btn-outline-danger"
                        style={{ padding: '2px 8px', fontSize: '10px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          showToast(`🚨 Priority Notice dispatched to ${person.name} & GM HR for unauthorized absence.`, 'danger');
                        }}
                      >
                        Alert HR
                      </button>
                    ) : (
                      <ChevronRight size={14} color="var(--brand-slate-300)" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <Pagination
              currentPage={innerCirclePage}
              totalItems={filteredInnerCircle.length}
              pageSize={4}
              onPageChange={setInnerCirclePage}
              lang={lang}
            />
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          CHAIRMAN: TAB "notices" (Paginated)
          ═══════════════════════════════════════════ */}
      {role === 'chairman' && activeTab === 'notices' && (
        <div className="card mb-5 tab-pane-fade">
          <div className="card-hd">
            <div className="card-hd-left">
              <div className="card-hd-icon">📢</div>
              <div>
                <div className="card-title">{t('Enterprise Notice Board', 'এন্টারপ্রাইজ নোটিশ বোর্ড', lang)}</div>
                <div className="card-subtitle">{t('Latest corporate announcements & group circulars', 'সর্বশেষ কর্পোরেট ঘোষণা', lang)}</div>
              </div>
            </div>
            <button
              className="btn-outline"
              style={{ fontSize: '11px', padding: '4px 10px' }}
              onClick={() => {
                const titleInput = prompt('Enter new corporate circular headline / নোটিশ শিরোনাম লিখুন:');
                if (!titleInput) return;
                const newNotice = {
                  title: titleInput,
                  title_bn: titleInput,
                  tag: 'URGENT CIRCULAR',
                  date: 'Today, Just Now',
                  read: false,
                  pinned: true
                };
                setNotices([newNotice, ...notices]);
                showToast('📢 New company-wide notice published & pushed to all 1,240 employees via App & SMS.', 'gold');
              }}
            >
              + {t('Publish Notice', 'নোটিশ প্রকাশ', lang)}
            </button>
          </div>
          <div className="card-body">
            {/* Pinned Chairman Message */}
            <div className="notice-card gold-pin" style={{ marginBottom: '12px' }}>
              <div className="notice-hd">
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand-gold-dark)' }}>
                  👑 {t("Chairman's Message — Eid ul-Adha 2026", "চেয়ারম্যানের বার্তা — ঈদুল আযহা ২০২৬", lang)}
                </div>
                <span className="badge gold">Pinned</span>
              </div>
              <div className="notice-meta">Jun 17, 2026 · Ahmed Akbar Sobhan, Chairman</div>
              <div className="notice-body" style={{ fontStyle: 'italic', color: 'var(--brand-slate-600)' }}>
                {t('"On behalf of Bashundhara Group, I extend heartfelt Eid Mubarak to every employee and their families..."', '"বাশুন্ধারা গ্রুপের পক্ষে সকল কর্মী ও তাদের পরিবারকে ঈদ মোবারক..."', lang)}
              </div>
            </div>

            <div className="notice-list">
              {notices.slice((noticesPage - 1) * 2, noticesPage * 2).map((notice, i) => (
                <div key={i} className={`notice-card${notice.pinned ? ' pinned' : ''}`}>
                  <div className="notice-hd">
                    <div className="notice-title">{t(notice.title, notice.title_bn, lang)}</div>
                    <span className={`badge ${notice.pinned ? 'danger' : 'info'}`}>{notice.tag}</span>
                  </div>
                  <div className="notice-meta">{notice.date}</div>
                  {!notice.read && (
                    <button className="btn-sm-ghost" style={{ fontSize: '11px' }} onClick={() => showToast('Notice acknowledged.', 'success')}>
                      ✅ {t('Acknowledge', 'পড়েছি', lang)}
                    </button>
                  )}
                </div>
              ))}
            </div>

            <Pagination
              currentPage={noticesPage}
              totalItems={notices.length}
              pageSize={2}
              onPageChange={setNoticesPage}
              lang={lang}
            />
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          PLANT GM: TAB "refinery"
          ═══════════════════════════════════════════ */}
      {role === 'plant_gm' && activeTab === 'refinery' && (
        <div className="tab-pane-fade">
          <RefineryOutputChart lang={lang} />
        </div>
      )}

      {/* ═══════════════════════════════════════════
          PLANT GM: TAB "safety_loto" (Paginated Permits + Handover)
          ═══════════════════════════════════════════ */}
      {role === 'plant_gm' && activeTab === 'safety_loto' && (
        <div className="col-2 mb-5 tab-pane-fade">
          {/* Lockout Tagout (LOTO) Board */}
          <div className="card">
            <div className="card-hd">
              <div className="card-hd-left">
                <div className="card-hd-icon"><Lock size={16} color="var(--brand-crimson)" /></div>
                <div>
                  <div className="card-title">{t('Active Lockout-Tagout (LOTO) & High-Risk Permits', 'সক্রিয় লকআউট-ট্যাগআউট ও ঝুঁকি পারমিট', lang)}</div>
                  <div className="card-subtitle">{t('OSHA 1910.147 Control of Hazardous Energy', 'বিপজ্জনক শক্তি নিয়ন্ত্রণ ও নিরাপত্তা অনুমোদন', lang)}</div>
                </div>
              </div>
              <span className="badge danger">{lotoPermits.length} {t('Isolations', 'আইসোলেশন', lang)}</span>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {lotoPermits.slice((lotoPage - 1) * 2, lotoPage * 2).map((p) => (
                  <div key={p.id} style={{ border: '1px solid var(--brand-slate-200)', padding: '12px 14px', borderRadius: '6px', background: 'var(--brand-card-bg)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--brand-crimson)', fontSize: '12px' }}>{p.id}</span>
                      <span className="badge danger">{p.status}</span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '13px', marginTop: '3px', color: 'var(--brand-slate-900)' }}>{p.equipment}</div>
                    <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)', marginTop: '2px' }}>
                      Isolator: <strong>{p.breaker}</strong> • Permittee: <strong>{p.issuedTo}</strong>
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--status-danger)', marginTop: '4px', background: 'var(--status-danger-bg)', padding: '4px 8px', borderRadius: '4px', border: '1px solid rgba(239,68,68,0.2)' }}>
                      ⚠️ Hazard: {p.hazard}
                    </div>
                  </div>
                ))}
              </div>

              <Pagination
                currentPage={lotoPage}
                totalItems={lotoPermits.length}
                pageSize={2}
                onPageChange={setLotoPage}
                lang={lang}
              />
            </div>
          </div>

          {/* Shift Handover Log */}
          <div className="card">
            <div className="card-hd">
              <div className="card-hd-left">
                <div className="card-hd-icon"><CalendarClock size={16} /></div>
                <div>
                  <div className="card-title">{t('Shift Handover Continuity Log', 'শিফট হস্তান্তর ধারাবাহিকতা লগ', lang)}</div>
                  <div className="card-subtitle">{t('Operational continuity tracker (A/B/C Shifts)', 'অপারেশনাল ধারাবাহিকতা ট্র্যাকার', lang)}</div>
                </div>
              </div>
            </div>
            <div className="card-body">
              {SHIFT_HANDOVER.map((sh, i) => (
                <div key={i} className="shift-handover-row">
                  <div className="shift-handover-header">
                    <strong>{sh.shift}</strong>
                    <span className={`badge ${sh.status === 'completed' ? 'success' : 'info'}`}>{sh.status}</span>
                  </div>
                  <div className="shift-handover-meta">{sh.handover} · {sh.time}</div>
                  <div className="shift-handover-notes">{sh.notes}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          TRANSPORT ADMIN: TAB "requisitions" (Paginated)
          ═══════════════════════════════════════════ */}
      {role === 'transport_admin' && activeTab === 'requisitions' && (
        <div className="card mb-5 tab-pane-fade">
          <div className="card-hd">
            <div className="card-hd-left">
              <div className="card-hd-icon"><Car size={16} /></div>
              <div>
                <div className="card-title">{t('Incoming Duty Travel Requisitions', 'আগত অফিসিয়াল যানবাহন আবেদনসমূহ', lang)}</div>
                <div className="card-subtitle">{t('Assign certified drivers & roadworthy vehicles', 'অনুমোদিত চালক ও গাড়ি বরাদ্দ নিশ্চিত করুন', lang)}</div>
              </div>
            </div>
            <span className="badge warn">{sharedRequisitions.filter(r => r.status === 'pending').length} pending</span>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="fleet-table">
                <thead>
                  <tr>
                    <th>{t('ID', 'আইডি', lang)}</th>
                    <th>{t('Requester & Dept', 'অনুরোধকারী ও বিভাগ', lang)}</th>
                    <th>{t('Route & Trip Mode', 'রুট ও ধরন', lang)}</th>
                    <th>{t('Departure Time', 'যাত্রার সময়', lang)}</th>
                    <th>{t('Required Capacity', 'প্রয়োজনীয় ধরন', lang)}</th>
                    <th>{t('Actions', 'পদক্ষেপ', lang)}</th>
                  </tr>
                </thead>
                <tbody>
                  {sharedRequisitions.slice((requisitionsPage - 1) * 3, requisitionsPage * 3).map((req, i) => (
                    <tr key={i} className={req.status === 'assigned' ? 'row-muted' : ''}>
                      <td><code style={{ fontWeight: 800 }}>{req.id}</code></td>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--brand-slate-900)' }}>{req.requesterName}</div>
                        <div style={{ fontSize: '11px', color: 'var(--brand-slate-400)' }}>{req.dept} • {req.requesterRole}</div>
                      </td>
                      <td>
                        <div>{req.from.split(',')[0]} → {req.to.split(',')[0]}</div>
                        <div style={{ fontSize: '10.5px', color: '#1D4ED8', fontWeight: 600 }}>
                          {req.tripType === 'round_trip' ? '🔄 Round Trip' : '➡️ One-Way Drop'}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '12px', fontWeight: 600 }}>{req.departureTime}</div>
                        <span className="badge info">{req.passengersCount} Passengers</span>
                      </td>
                      <td>
                        <span className="badge" style={{ background: '#F1F5F9', color: '#0F172A', fontWeight: 700 }}>
                          {req.requiredCapacity === 'sedan_4' ? '4-Seat Sedan' : req.requiredCapacity === 'microbus_7' ? '7-Seat HiAce' : '4x4 Pickup'}
                        </span>
                      </td>
                      <td>
                        {req.status === 'pending' ? (
                          <div className="flex-gap">
                            <button
                              className="btn-primary"
                              style={{ fontSize: '11px', padding: '5px 12px' }}
                              onClick={() => {
                                const availableCar = sharedVehicles.find(v => v.status === 'available') || sharedVehicles[0];
                                const availableDriver = sharedDrivers.find(d => d.status === 'available') || sharedDrivers[0];
                                sharedAssignRequisition(req.id, availableCar.plate, availableDriver.id);
                                showToast(`🚗 Allocated ${availableCar.plate} & Driver ${availableDriver.name} to ${req.requesterName}!`, 'success');
                              }}
                            >
                              Assign Driver & Vehicle
                            </button>
                          </div>
                        ) : (
                          <div>
                            <span className="badge success">✓ {req.assignedVehiclePlate}</span>
                            <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-600)', marginTop: '2px' }}>
                              Driver: <strong>{req.assignedDriverName}</strong>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={requisitionsPage}
              totalItems={sharedRequisitions.length}
              pageSize={3}
              onPageChange={setRequisitionsPage}
              lang={lang}
            />
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          TRANSPORT ADMIN: TAB "corridor"
          ═══════════════════════════════════════════ */}
      {role === 'transport_admin' && activeTab === 'corridor' && (
        <div className="card mb-5 tab-pane-fade" style={{ background: '#0F172A', color: '#fff', border: '1px solid #334155' }}>
          <div style={{ padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Navigation size={16} color="#FBBF24" />
              <strong style={{ fontSize: '13px' }}>
                {t('Live Tanker Corridor Transit & Toll Alert HUD', 'ট্যাংকার করিডোর ট্রানজিট ও টোল প্লাজা সতর্কতা', lang)}
              </strong>
            </div>
            <span className="badge success">Live Telematics</span>
          </div>
          <div style={{ padding: '16px 18px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>Babubazar Bridge Corridor</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#34D399', marginTop: '2px' }}>Normal Flow (18m)</div>
              <div style={{ fontSize: '10.5px', color: '#94A3B8' }}>4 Tankers in Transit • Zero Delay</div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>Postogola Bridge Toll Plaza</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#FBBF24', marginTop: '2px' }}>Moderate Congestion (38m)</div>
              <div style={{ fontSize: '10.5px', color: '#94A3B8' }}>Reroute Bitumen Bulk to Mawa Expressway</div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>Padma Bridge Expressway Corridor</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#60A5FA', marginTop: '2px' }}>High Speed Clear (80 km/h)</div>
              <div style={{ fontSize: '10.5px', color: '#94A3B8' }}>Mongla Depot Carrier #V-05 Passing Toll</div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          HR ADMIN: TAB "clearance"
          ═══════════════════════════════════════════ */}
      {role === 'hr_admin' && activeTab === 'clearance' && (
        <div className="card mb-5 tab-pane-fade">
          <div className="card-hd">
            <div className="card-hd-left">
              <div className="card-hd-icon"><UserCheck size={16} color="var(--brand-crimson)" /></div>
              <div>
                <div className="card-title">{t('Active Employee Separation & Exit Clearance', 'সক্রিয় কর্মী বহির্গমন ও ছাড়পত্র ট্র্যাকার', lang)}</div>
                <div className="card-subtitle">{t('4-Way Audit: IT · Security · Fleet · Finance', '৪-ধাপ নিরীক্ষা: আইটি · নিরাপত্তা · পরিবহন · অর্থায়ন', lang)}</div>
              </div>
            </div>
            <span className="badge danger">1 In Clearance</span>
          </div>
          <div className="card-body">
            <div style={{ background: 'var(--brand-slate-100)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <strong style={{ fontSize: '13.5px', color: 'var(--brand-slate-900)' }}>Engr. Faisal Ahmed</strong>
                  <span style={{ fontSize: '11px', color: 'var(--brand-slate-500)', marginLeft: '8px' }}>EMP-004 · Maintenance Lead</span>
                </div>
                <span className="badge warn">50% Cleared (2/4)</span>
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--brand-slate-600)', marginBottom: '10px' }}>
                Resignation notice submitted · Last working day: <strong>Nov 15, 2026</strong> · Keraniganj Plant
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', fontSize: '10.5px' }}>
                <div style={{ background: '#ECFDF5', padding: '6px 8px', borderRadius: '4px', border: '1px solid #A7F3D0', color: '#065F46' }}>
                  ✓ IT Accounts Revoked
                </div>
                <div style={{ background: '#ECFDF5', padding: '6px 8px', borderRadius: '4px', border: '1px solid #A7F3D0', color: '#065F46' }}>
                  ✓ Security RFID Surrendered
                </div>
                <div style={{ background: '#FEF3C7', padding: '6px 8px', borderRadius: '4px', border: '1px solid #FDE68A', color: '#92400E' }}>
                  ⏳ Fleet: Pool Car Return
                </div>
                <div style={{ background: '#FEE2E2', padding: '6px 8px', borderRadius: '4px', border: '1px solid #FECACA', color: '#991B1B' }}>
                  ⏳ Finance: TA/DA Reconciliation
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <button
                className="btn-outline"
                style={{ fontSize: '11px', padding: '6px 12px' }}
                onClick={() => showToast(t('Access the Workforce Master from the sidebar for full clearance sign-off.', 'কর্মী মাস্টার থেকে পূর্ণ ছাড়পত্র সম্পন্ন করুন।', lang), 'info')}
              >
                {t('Open Complete Workforce Directory →', 'সম্পূর্ণ কর্মী ডিরেক্টরি দেখুন →', lang)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          HR ADMIN: TAB "sites"
          ═══════════════════════════════════════════ */}
      {role === 'hr_admin' && activeTab === 'sites' && (
        <div className="card mb-5 tab-pane-fade">
          <div className="card-hd">
            <div className="card-hd-left">
              <div className="card-hd-icon"><Building2 size={16} /></div>
              <div>
                <div className="card-title">{t('Enterprise Headcount & Site Deployment', 'সংস্থার কর্মী বণ্টন ও সাইট ডেপ্লয়মেন্ট', lang)}</div>
                <div className="card-subtitle">{t('Active personnel across 3 regional nodes', '৩টি আঞ্চলিক নোডে সক্রিয় জনবল', lang)}</div>
              </div>
            </div>
            <span className="badge info">743 Total</span>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--brand-slate-100)', borderRadius: '6px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <strong style={{ fontSize: '13px' }}>Bashundhara Dhaka HQ</strong>
                  <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)' }}>Plot-3, Block-G, Umme Kulsum Road, Baridhara</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#059669' }}>420 Staff</div>
                  <div style={{ fontSize: '10px', color: 'var(--brand-slate-400)' }}>Corporate, Finance & Sales</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--brand-slate-100)', borderRadius: '6px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <strong style={{ fontSize: '13px' }}>Keraniganj Bitumen Refinery Complex</strong>
                  <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)' }}>Industrial Area, Dhaleshwari River Corridor</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#0284C7' }}>218 Staff</div>
                  <div style={{ fontSize: '10px', color: 'var(--brand-slate-400)' }}>Engineering, QC & Plant Ops</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--brand-slate-100)', borderRadius: '6px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <strong style={{ fontSize: '13px' }}>Chattogram Marine Bulk Terminal</strong>
                  <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)' }}>Guptakhal, Patenga River Jetty</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#D97706' }}>105 Staff</div>
                  <div style={{ fontSize: '10px', color: 'var(--brand-slate-400)' }}>Maritime Discharge & Heavy Fleet</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          HOD: TAB "approvals" (Paginated & Checkbox Selection)
          ═══════════════════════════════════════════ */}
      {role === 'hod' && activeTab === 'approvals' && (
        <div className="card mb-5 tab-pane-fade">
          <div className="card-hd">
            <div className="card-hd-left">
              <div className="card-hd-icon"><FileCheck size={18} color="var(--brand-crimson)" /></div>
              <div>
                <div className="card-title">{t('HOD Unified Omni-Approval Inbox & Budget Burn-Down', 'বিভাগীয় প্রধান ইউনিফায়েড অনুমোদন ইনবক্স', lang)}</div>
                <div className="card-subtitle">{t('Multi-category triage for Claims, Travel, Stationery, and Leave', 'দাবিপত্র, ভ্রমণ, ক্রয় ও ছুটির একীভূত অনুমোদন ব্যবস্থা', lang)}</div>
              </div>
            </div>
            
            {/* Batch Approve Action */}
            <div className="flex-gap">
              {selectedHodIds.length > 0 && (
                <button
                  className="btn-gold"
                  style={{ fontSize: '11.5px', padding: '6px 14px', fontWeight: 800 }}
                  onClick={handleBatchApproveHod}
                >
                  <Check size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  {t(`Batch Approve (${selectedHodIds.length} Selected)`, `নির্বাচিত ${selectedHodIds.length}টি একযোগে অনুমোদন করুন`, lang)}
                </button>
              )}
              <span className="badge danger">{hodQueue.length} Pending Actions</span>
            </div>
          </div>

          <div className="card-body">
            {/* Live Q4 Budget Burn-Down Gauge */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '14px 18px', borderRadius: '6px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', marginBottom: '6px', flexWrap: 'wrap', gap: '6px' }}>
                <span style={{ fontWeight: 700, color: 'var(--brand-slate-900)' }}>Q4 Operational Expenditure (OPEX) Ceiling: ৳53,20,000</span>
                <span style={{ color: '#059669', fontWeight: 800 }}>
                  Safe Buffer: ৳{(5320000 - (3840000 + approvedAmountSum)).toLocaleString()} Remaining
                </span>
              </div>
              <div style={{ height: '8px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.min(100, ((3840000 + approvedAmountSum) / 5320000) * 100)}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #10B981, #F59E0B)',
                    transition: 'width 0.4s ease'
                  }}
                />
              </div>
            </div>

            {/* Approval Items List with Checkboxes */}
            <div className="approval-queue-list">
              {hodQueue.slice((hodQueuePage - 1) * 4, hodQueuePage * 4).map((item) => (
                <div key={item.id} className={`approval-queue-item${item.urgency === 'overdue' ? ' overdue' : ''}`}>
                  <button
                    type="button"
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}
                    onClick={() => toggleSelectHodItem(item.id)}
                  >
                    {selectedHodIds.includes(item.id) ? (
                      <CheckSquare size={18} color="var(--brand-crimson)" />
                    ) : (
                      <Square size={18} color="#94A3B8" />
                    )}
                  </button>

                  <div className="aq-icon">{item.icon}</div>
                  <div className="aq-info">
                    <div className="aq-title">{item.title}</div>
                    <div className="aq-detail">
                      {item.detail} · <span className="aq-type-badge">{item.type}</span>
                      {item.costTk > 0 && <strong style={{ color: 'var(--brand-slate-900)', marginLeft: '6px' }}>৳{item.costTk.toLocaleString()}</strong>} · {item.time}
                    </div>
                  </div>
                  <div className="aq-actions">
                    <button
                      className="btn-primary"
                      style={{ fontSize: '11px', padding: '5px 12px' }}
                      onClick={() => handleApproveSingleHod(item)}
                    >
                      Approve
                    </button>
                    <button
                      className="btn-sm-ghost"
                      style={{ fontSize: '11px' }}
                      onClick={() => showToast(`Reviewing documentation for ${item.id}`, 'info')}
                    >
                      Review
                    </button>
                    <button
                      className="btn-outline-danger"
                      style={{ fontSize: '11px', padding: '5px 10px' }}
                      onClick={() => {
                        setHodQueue(prev => prev.filter(x => x.id !== item.id));
                        showToast(`Returned ${item.id} to applicant for correction.`, 'info');
                      }}
                    >
                      Return
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <Pagination
              currentPage={hodQueuePage}
              totalItems={hodQueue.length}
              pageSize={4}
              onPageChange={setHodQueuePage}
              lang={lang}
            />
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          EMPLOYEE: TAB "activity" (Timeline & Balances)
          ═══════════════════════════════════════════ */}
      {role === 'employee' && activeTab === 'activity' && (
        <div className="col-2 mb-5 tab-pane-fade">
          <div className="card">
            <div className="card-hd">
              <div className="card-hd-left">
                <div className="card-hd-icon"><Activity size={16} /></div>
                <div>
                  <div className="card-title">{t('My Recent Activity Log', 'আমার সাম্প্রতিক কার্যক্রম', lang)}</div>
                  <div className="card-subtitle">{t('Your latest actions and updates', 'আপনার সর্বশেষ কার্যক্রম ও আপডেট', lang)}</div>
                </div>
              </div>
            </div>
            <div className="card-body">
              <div className="activity-timeline">
                {MY_RECENT_ACTIVITY.map((act, i) => (
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
            </div>
          </div>

          {/* Leave & Benefit Balances */}
          <div className="card">
            <div className="card-hd">
              <div className="card-hd-left">
                <div className="card-hd-icon"><Award size={16} /></div>
                <div>
                  <div className="card-title">{t('Entitlements & Leave Balance', 'ছুটি ব্যালেন্স ও প্রাপ্য ভাতাসমূহ', lang)}</div>
                  <div className="card-subtitle">{t('Fiscal Year 2026 Allowance', 'চলতি অর্থবছরের ছুটি স্থিতি', lang)}</div>
                </div>
              </div>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>Casual Leave (CL)</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--brand-slate-900)' }}>8 / 10</div>
                  <div style={{ fontSize: '10px', color: '#059669' }}>2 Days Utilized</div>
                </div>

                <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>Medical / Sick Leave</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--brand-slate-900)' }}>6 / 14</div>
                  <div style={{ fontSize: '10px', color: '#D97706' }}>8 Days Remaining</div>
                </div>

                <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>Attendance Bonus</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#059669' }}>৳ 3,000</div>
                  <div style={{ fontSize: '10px', color: '#059669' }}>Qualified (100% On-Time)</div>
                </div>

                <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>Provident Fund Accrued</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#1D4ED8' }}>৳ 4,12,000</div>
                  <div style={{ fontSize: '10px', color: '#64748B' }}>Matching BOGCL Contrib.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          PLANT GM: Batch Quality Release Modal
          ═══════════════════════════════════════════ */}
      {showBatchReleaseModal && (
        <div className="modal-bg" onClick={() => setShowBatchReleaseModal(false)}>
          <div className="modal" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-hd" style={{ background: '#0F172A', color: '#fff' }}>
              <div>
                <h3 style={{ color: '#fff', margin: 0 }}>
                  ★ {t('Plant GM Bitumen Batch Quality Release Authority', 'বিটুমিন ব্যাচ গুণমান সনদ ও রিলিজ অনুমোদন', lang)}
                </h3>
                <div style={{ fontSize: '11px', color: '#94A3B8' }}>BOGCL QC Lab Tested • Keraniganj Complex</div>
              </div>
              <button className="modal-close" style={{ color: '#fff' }} onClick={() => setShowBatchReleaseModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <div style={{ border: '2px solid #E2E8F0', padding: '16px', borderRadius: '6px', background: '#FAFAFC', marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', borderBottom: '1px solid #CBD5E1', paddingBottom: '8px', marginBottom: '10px' }}>
                  <div>
                    <strong>Batch No:</strong> <span style={{ fontFamily: 'monospace' }}>BOGCL-BIT-2026-B88</span>
                  </div>
                  <div>
                    <strong>Product:</strong> <span style={{ color: '#D97706', fontWeight: 800 }}>Bitumen Grade 60/70</span>
                  </div>
                  <div>
                    <strong>Volume:</strong> 2,400 Metric Tons
                  </div>
                </div>

                <div style={{ fontSize: '11.5px', fontWeight: 700, marginBottom: '6px' }}>Laboratory Physical Test Parameters (BDS 1238:2020 Standard):</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', fontSize: '11px' }}>
                  <div style={{ background: '#ECFDF5', padding: '8px', borderRadius: '4px', border: '1px solid #A7F3D0' }}>
                    Penetration @ 25°C: <strong>64 dmm</strong> (Passed)
                  </div>
                  <div style={{ background: '#ECFDF5', padding: '8px', borderRadius: '4px', border: '1px solid #A7F3D0' }}>
                    Softening Point: <strong>51.2°C</strong> (Passed)
                  </div>
                  <div style={{ background: 'var(--status-success-bg)', padding: '8px', borderRadius: '4px', border: '1px solid rgba(16,185,129,0.3)' }}>
                    Ductility: <strong>&gt;100 cm</strong> (Passed)
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '12px', color: 'var(--brand-slate-600)', background: 'var(--status-warning-bg)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(245,158,11,0.3)' }}>
                🔒 <strong>Plant GM Digital Seal:</strong> Authorizing this release unlocks Tank Farm Gantry Dispensers 1–4 and dispatches delivery challans to RHD Highway contractor tankers.
              </div>
            </div>

            <div className="modal-ft">
              <button className="btn-sm-ghost" onClick={() => setShowBatchReleaseModal(false)}>{t('Cancel', 'বাতিল', lang)}</button>
              <button
                className="btn-gold"
                style={{ fontWeight: 800 }}
                onClick={() => {
                  showToast(t('Batch BOGCL-BIT-2026-B88 released! Delivery gates unlocked and SAP dispatch notification dispatched.', 'ব্যাচ রিলিজ সম্পন্ন! লোডিং গ্যান্ট্রি সক্রিয় করা হয়েছে।', lang), 'gold');
                  setShowBatchReleaseModal(false);
                }}
              >
                <Check size={14} />
                {t('Authorize Batch Release & Sign Off', 'ব্যাচ অনুমোদন ও ডিজিটাল স্বাক্ষর', lang)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          EMPLOYEE: Virtual NFC / QR Gate Pass Modal
          ═══════════════════════════════════════════ */}
      {showGatePassModal && (
        <div className="modal-bg" onClick={() => setShowGatePassModal(false)}>
          <div className="modal" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-hd" style={{ background: 'var(--brand-crimson)', color: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <QrCode size={18} color="#fff" />
                <h3 style={{ color: '#fff', margin: 0 }}>
                  {t('Employee Digital Access Badge', 'ডিজিটাল প্রবেশপত্র পাস', lang)}
                </h3>
              </div>
              <button className="modal-close" style={{ color: '#fff' }} onClick={() => setShowGatePassModal(false)}>×</button>
            </div>

            <div className="modal-body" style={{ textAlign: 'center' }}>
              {/* Badge Visual Card */}
              <div style={{ border: '2px solid #0F172A', borderRadius: '12px', padding: '20px 16px', background: '#FAFAFC', boxShadow: '0 4px 14px rgba(0,0,0,0.08)' }}>
                <div style={{ fontSize: '13px', fontWeight: 900, color: 'var(--brand-crimson)', letterSpacing: '0.5px' }}>
                  BASHUNDHARA OIL AND GAS COMPANY LTD.
                </div>
                <div style={{ fontSize: '10px', color: '#64748B', marginBottom: '12px' }}>
                  Corporate HQ & Keraniganj Bitumen Refinery
                </div>

                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#0F172A', color: 'var(--brand-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 900, margin: '0 auto 8px', border: '2px solid var(--brand-gold)' }}>
                  TA
                </div>

                <div style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>Tanvir Ahmed</div>
                <div style={{ fontSize: '11px', color: '#64748B' }}>Sr. Sales & Distribution Specialist</div>
                <div style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--brand-crimson)', marginTop: '2px' }}>
                  EMP ID: BOGCL-2024-0419
                </div>

                <div style={{ margin: '14px 0 10px', display: 'flex', justifyContent: 'center' }}>
                  <QrCode size={110} color="#0F172A" />
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '8px', fontSize: '10.5px', borderTop: '1px solid #CBD5E1', paddingTop: '10px' }}>
                  <div>Blood Group: <strong>B+ (Positive)</strong></div>
                  <div>Security Zone: <strong>Level-2 Refinery Access</strong></div>
                </div>
              </div>

              <div style={{ marginTop: '12px', fontSize: '11px', color: '#059669', fontWeight: 700 }}>
                ✓ NFC Active • Scan at RFID turnstiles or show to security guards
              </div>
            </div>

            <div className="modal-ft">
              <button className="btn-sm-ghost" onClick={() => setShowGatePassModal(false)}>{t('Close', 'বন্ধ করুন', lang)}</button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-in Detail Drawer */}
      <DetailDrawer
        data={selectedDrawerItem}
        onClose={() => setSelectedDrawerItem(null)}
        lang={lang}
      />
    </div>
  );
}
