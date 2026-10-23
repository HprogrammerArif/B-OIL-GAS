import React from 'react';
import {
  Users, FileCheck, AlertTriangle, TrendingUp, Clock, CheckCircle,
  Zap, Truck, Package, Bus, Receipt, PieChart, Navigation, Gauge, Fuel
} from 'lucide-react';
import { AppRole } from '../../types';
import { DetailDrawerData } from '../../components/DetailDrawer';
import {
  StatDef, InnerCircleMember, NoticeItem, DcsAlarmItem,
  LotoPermitItem, ShiftHandoverItem, VehicleRequestItem, HodQueueItem
} from './types';

/* ═══════════════════════════════════════════
   INNER CIRCLE DATA (Chairman only)
   ═══════════════════════════════════════════ */
export const INNER_CIRCLE: InnerCircleMember[] = [
  { name: 'Engr. M. Harunur Rashid', role: 'Plant GM, Keraniganj', initials: 'HR', color: '#0369A1', status: 'present', statusLabel: 'Present at Plant', statusLabelBn: 'প্ল্যান্টে উপস্থিত', badge: 'present', location: 'Control Room Unit-1', phone: '+880 1711-002101' },
  { name: 'Farida Begum', role: 'CFO & Finance Director', initials: 'FB', color: '#7C3AED', status: 'meeting', statusLabel: 'In Board Meeting', statusLabelBn: 'বোর্ড মিটিংয়ে আছেন', badge: 'meeting', location: 'Boardroom A, Dhaka HQ', phone: '+880 1711-002102' },
  { name: 'Adv. Karim Molla', role: 'Head of Legal & Compliance', initials: 'KM', color: '#059669', status: 'travel', statusLabel: 'At BSTI Inspection', statusLabelBn: 'বিএসটিআই পরিদর্শনে', badge: 'travel', location: 'BSTI Directorate, Tejgaon', phone: '+880 1711-002103' },
  { name: 'Md. Shafiqul Islam', role: 'Director, Sales & Dist.', initials: 'SI', color: '#D97706', status: 'present', statusLabel: 'Present at HQ', statusLabelBn: 'সদর দপ্তরে উপস্থিত', badge: 'present', location: 'Level-8 Commercial Wing', phone: '+880 1711-002104' },
  { name: 'Engr. Tariq Ahmed', role: 'Plant Engineer, Unit-2', initials: 'TA', color: '#A51C30', status: 'leave', statusLabel: 'Informed Leave (Pre-Approved)', statusLabelBn: 'অনুমোদিত ছুটি (অবহিত)', badge: 'leave', location: 'Dhanmondi, Dhaka', phone: '+880 1711-002105' },
  { name: 'Dr. Rafiqul Huq', role: 'Chief Chemist & Lab Head', initials: 'RH', color: '#D97706', status: 'sick', statusLabel: 'Sick Leave (Medical Cert)', statusLabelBn: 'অসুস্থতাজনিত ছুটি (মেডিকেল)', badge: 'warn', location: 'Apollo Hospital Dhaka', phone: '+880 1711-002107' },
  { name: 'Kazi Moinul Islam', role: 'Chief SCADA DCS Automation', initials: 'MI', color: '#DC2626', status: 'uninformed', statusLabel: '⚠️ Uninformed Absent', statusLabelBn: '⚠️ অননুমোদিত অনুপস্থিত', badge: 'danger', location: 'Unknown (No Biometric/App Punch)', phone: '+880 1711-002108' },
  { name: 'Nusrat Jahan', role: 'GM, Human Resources', initials: 'NJ', color: '#0891B2', status: 'present', statusLabel: 'Present at HQ', statusLabelBn: 'সদর দপ্তরে উপস্থিত', badge: 'present', location: 'HR Suite, Dhaka HQ', phone: '+880 1711-002106' },
];

export const PENDING_APPROVALS: DetailDrawerData[] = [
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

export const NOTICE_BOARD: NoticeItem[] = [
  { title: 'Mandatory Safety Briefing — Q4 Plant Operations', title_bn: 'বাধ্যতামূলক নিরাপত্তা ব্রিফিং', tag: '⚠️ SAFETY CRITICAL', date: 'Oct 15, 2026', read: false, pinned: true },
  { title: 'HSE Incident Report Submission Deadline Extended', title_bn: 'এইচএসই ঘটনা প্রতিবেদন জমার সময়সীমা বর্ধিত', tag: 'HSE', date: 'Oct 13, 2026', read: true, pinned: false },
  { title: 'Annual Medical Check-up Camp — Nov 4-6, 2026 (All Staff)', title_bn: 'বার্ষিক স্বাস্থ্য পরীক্ষা শিবির — ৪-৬ নভেম্বর ২০২৬', tag: 'HR Circular', date: 'Oct 10, 2026', read: true, pinned: false },
];

export const ROLE_STATS: Record<AppRole, StatDef[]> = {
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
    { label: 'SAP HCM Sync', labelBn: 'এসএপি এইচসিএম সিঙ্ক', value: '100%', sub: 'PERNR Master up to date', type: 'green', icon: <ShieldCheckIcon />, sparkline: [100, 100, 100, 100, 100, 100, 100], sparkColor: '#059669' },
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
  driver: [
    { label: 'Assigned Mission', labelBn: 'বরাদ্দকৃত ট্রিপ', value: '1 Active', sub: 'Baridhara HQ ➔ Keraniganj', type: 'green', icon: <Truck size={16}/>, sparkline: [1, 2, 1, 2, 1], sparkColor: '#059669' },
    { label: 'Sobriety BAC', labelBn: 'অ্যালকোহল টেস্ট', value: '0.00%', sub: 'Zero Alcohol Cleared Today', type: 'blue', icon: <CheckCircle size={16}/>, sparkline: [0, 0, 0, 0, 0], sparkColor: '#0284C7' },
    { label: 'Toll Slips Claimed', labelBn: 'টোল দাবি স্লিপ', value: '৳410', sub: '2 claims awaiting reimbursement', type: 'warn', icon: <Receipt size={16}/>, sparkline: [150, 260, 410], sparkColor: '#D97706' },
    { label: 'Safety Rating', labelBn: 'নিরাপত্তা স্কোর', value: '4.9/5.0', sub: 'Top Chauffeur Category', type: 'green', icon: <TrendingUp size={16}/>, sparkline: [4.7, 4.8, 4.8, 4.9, 4.9], sparkColor: '#059669' },
  ],
};

function ShieldCheckIcon() {
  return <CheckCircle size={16} />;
}

export const DCS_ALARMS: DcsAlarmItem[] = [
  { id: 'ALM-001', tag: 'TI-C102-14', desc: 'Column C-102 Top Temperature HIGH', value: '342°C', limit: '335°C', severity: 'high', time: '10:42 AM', ack: false },
  { id: 'ALM-002', tag: 'PI-R201-03', desc: 'Reactor R-201 Pressure Warning', value: '4.2 bar', limit: '4.5 bar', severity: 'medium', time: '10:15 AM', ack: true },
  { id: 'ALM-003', tag: 'LI-TK-05', desc: 'Tank TK-05 Base Oil Level Low', value: '22%', limit: '25%', severity: 'low', time: '09:30 AM', ack: true },
];

export const INITIAL_LOTO_PERMITS: LotoPermitItem[] = [
  { id: 'LOTO-044', equipment: 'Bitumen Feed Pump P-101B', breaker: 'Substation Feeder 4B-12', issuedTo: 'Tariq Ahmed', status: 'LOCKED OUT', hazard: 'High Voltage & Molten Hydrocarbon' },
  { id: 'HOT-019', equipment: 'Flare Header Elevation +14m', breaker: 'N/A (Hot Work Weld)', issuedTo: 'Kamrul Hasan', status: 'ACTIVE PERMIT', hazard: 'Sparking in Hazardous Zone-1' },
];

export const SHIFT_HANDOVER: ShiftHandoverItem[] = [
  { shift: 'Night → Morning', handover: 'Engr. Babul → Engr. Tariq', time: '06:00 AM', status: 'completed', notes: 'Unit-2 catalyst bed normal. Column C-102 temp trending high — monitor closely.' },
  { shift: 'Morning → Afternoon', handover: 'Engr. Tariq → Engr. Kamrul', time: '02:00 PM', status: 'upcoming', notes: 'Scheduled: Valve isolation on V-204 for maintenance window.' },
];

export const INITIAL_VEHICLE_REQUESTS: VehicleRequestItem[] = [
  { id: 'VR-2026-142', requester: 'Md. Shafiqul Islam', designation: 'Director, Sales', from: 'HQ Baridhara', to: 'Chittagong Port', date: 'Oct 18', time: '08:00 AM', passengers: 2, priority: 'high', status: 'pending' },
  { id: 'VR-2026-143', requester: 'Farida Begum', designation: 'CFO', from: 'HQ Baridhara', to: 'Bangladesh Bank', date: 'Oct 17', time: '02:00 PM', passengers: 1, priority: 'high', status: 'pending' },
  { id: 'VR-2026-144', requester: 'Tanvir Ahmed', designation: 'Sr. Sales Executive', from: 'HQ Baridhara', to: 'Keraniganj Plant', date: 'Oct 17', time: '11:00 AM', passengers: 3, priority: 'normal', status: 'pending' },
  { id: 'VR-2026-145', requester: 'Kamrul Hasan', designation: 'Boiler Operator', from: 'Mirpur-10', to: 'Keraniganj Plant', date: 'Oct 17', time: '06:00 AM', passengers: 1, priority: 'normal', status: 'assigned' },
  { id: 'VR-2026-146', requester: 'Nusrat Jahan', designation: 'GM, HR', from: 'HQ Baridhara', to: 'BGMEA Building', date: 'Oct 18', time: '10:00 AM', passengers: 2, priority: 'normal', status: 'pending' },
];

export const INITIAL_HOD_QUEUE: HodQueueItem[] = [
  { id: 'APR-001', type: 'Leave', icon: '📅', title: 'Annual Leave — Tanvir Ahmed', detail: 'Oct 20-24, 2026 (5 days)', dept: 'Sales', time: '2h ago', urgency: 'normal', costTk: 0 },
  { id: 'APR-002', type: 'Expense', icon: '💰', title: 'Travel Expense Claim — Chittagong Visit', detail: 'Chittagong client visit, Oct 10-12', dept: 'Sales', time: '1d ago', urgency: 'normal', costTk: 12400 },
  { id: 'APR-003', type: 'Conveyance', icon: '🚌', title: 'Monthly Conveyance — Sep 2026', detail: '22 working days × ৳191/day', dept: 'Finance', time: '3d ago', urgency: 'overdue', costTk: 4200 },
  { id: 'APR-004', type: 'TA/DA', icon: '✈️', title: 'TA/DA Request — Sylhet Site Visit', detail: 'Oct 25-27, ৳18,500 estimated', dept: 'Sales', time: '4h ago', urgency: 'normal', costTk: 18500 },
  { id: 'APR-005', type: 'Purchase', icon: '🛒', title: 'Stationery & Consumables Requisition — Q4', detail: 'High-speed printer toners + secure pouches', dept: 'Finance', time: '2d ago', urgency: 'normal', costTk: 8700 },
  { id: 'APR-006', type: 'Document', icon: '📄', title: 'Policy Amendment — WFH Guidelines', detail: 'Updated remote work policy draft', dept: 'HR', time: '5h ago', urgency: 'normal', costTk: 0 },
  { id: 'APR-007', type: 'Leave', icon: '📅', title: 'Sick Leave — Rahim Uddin (Backdated)', detail: 'Oct 14, medical certificate attached', dept: 'Finance', time: '1d ago', urgency: 'overdue', costTk: 0 },
];

export const MY_RECENT_ACTIVITY = [
  { icon: '✅', title: 'Attendance logged', detail: 'Punch-in at 08:52 AM — Inside geofence (South Gate)', time: 'Today, 08:52 AM' },
  { icon: '📄', title: 'Conveyance claim submitted', detail: '৳4,850 for October 2026 — Pending HOD review', time: 'Today, 09:30 AM' },
  { icon: '📦', title: 'Parcel dispatched to you', detail: 'From Head Office → Keraniganj — In Transit', time: 'Yesterday, 04:15 PM' },
  { icon: '🚌', title: 'Bus seat confirmed', detail: 'Seat #7, Route 3 (Mirpur → Plant) — Active Pass', time: 'Oct 14, 2026' },
];
