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
    id: 'BOGCL/PROC/KER-2026/0894',
    title: 'Emergency Power Generator Overhaul — Keraniganj Plant',
    amount: '৳48,50,000',
    dept: 'Plant Maintenance',
    urgency: 'urgent',
    time: '2h pending',
    initiator: 'Engr. Md. Harunur Rashid',
    description: 'Urgent overhaul of 1,200 kVA emergency backup power generator and replacement spare parts to prevent factory downtime during upcoming peak manufacturing season.',
    sapRef: 'SAP-PR-2026-90412',
    approvalTrail: [
      {
        stepNo: 1,
        officerName: 'Engr. Tariq Ahmed',
        roleName: 'Senior Plant Maintenance Engineer',
        department: 'Plant Operations',
        status: 'completed',
        timestamp: '14 Oct 2026, 09:30 AM',
        note: 'Diagnostic inspection revealed rotor thermal imbalance and alternator bearing wear. Overhaul critical to avert 24/7 continuous factory power blackout.',
        signatureHash: 'SHA256: 7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
      },
      {
        stepNo: 2,
        officerName: 'Engr. Md. Harunur Rashid',
        roleName: 'Plant General Manager',
        department: 'Keraniganj Plant',
        status: 'completed',
        timestamp: '14 Oct 2026, 02:45 PM',
        note: 'Technically vetted & endorsed. Energypac Cummins OEM quote verified against 2 competitor bids. Scope includes 12-month on-site warranty.',
        signatureHash: 'SHA256: d5a7a93a8905b6324d2b380645495c64393962d85d77aa5d7c862bc2b557b707',
      },
      {
        stepNo: 3,
        officerName: 'Farida Begum',
        roleName: 'CFO & Head of Finance',
        department: 'Corporate Finance & Accounts',
        status: 'completed',
        timestamp: '15 Oct 2026, 11:15 AM',
        note: 'Pre-audited. Provision exists under CAPEX Plant Maintenance (GL-4102-KER). Recommended for Chairman sanction with 5% retention clause.',
        signatureHash: 'SHA256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      },
    ],
  },
  {
    id: 'BOGCL/HR/2026/0342',
    title: 'Annual Staff Salary Increment Policy — Operations Team',
    amount: 'HR Policy',
    dept: 'Human Resources',
    urgency: 'normal',
    time: '1d pending',
    initiator: 'Nusrat Jahan',
    description: 'Annual statutory performance increment framework covering 482 factory shift workers, technicians, and transport drivers.',
    sapRef: 'SAP-HR-POL-0342',
    approvalTrail: [
      {
        stepNo: 1,
        officerName: 'Nusrat Jahan',
        roleName: 'GM, Human Resources',
        department: 'Corporate HR Directorate',
        status: 'completed',
        timestamp: '13 Oct 2026, 11:00 AM',
        note: 'Performance evaluations completed for 482 shift workers. Increments aligned with inflation index and collective bargaining guidelines.',
      },
      {
        stepNo: 2,
        officerName: 'Farida Begum',
        roleName: 'CFO & Head of Finance',
        department: 'Corporate Finance & Accounts',
        status: 'completed',
        timestamp: '14 Oct 2026, 03:20 PM',
        note: 'Financial model audited. Total incremental annual payroll impact is ৳22.4L, well within FY27 personnel OPEX budget.',
      },
    ],
  },
  {
    id: 'BOGCL/IT/2026/0211',
    title: 'Annual Office IT Cloud ERP & Software License Renewal',
    amount: '৳18,50,000',
    dept: 'Information Technology',
    urgency: 'normal',
    time: '3h pending',
    initiator: 'Farida Begum',
    description: 'Annual enterprise SAP S/4HANA cloud system, corporate email accounts, and database cybersecurity licenses for 750 employees.',
    sapRef: 'SAP-IT-LIC-0211',
    approvalTrail: [
      {
        stepNo: 1,
        officerName: 'S. M. Mahbubur Rahman',
        roleName: 'Head of IT & Digital Systems',
        department: 'Information Technology',
        status: 'completed',
        timestamp: '14 Oct 2026, 10:00 AM',
        note: 'SAP S/4HANA enterprise cloud subscription and AWS redundant cluster backup. Essential for 24/7 refinery SCADA billing and accounting.',
      },
      {
        stepNo: 2,
        officerName: 'Farida Begum',
        roleName: 'CFO & Head of Finance',
        department: 'Corporate Finance & Accounts',
        status: 'completed',
        timestamp: '14 Oct 2026, 04:30 PM',
        note: 'Commercial terms verified. 8% multi-year volume discount applied by SAP Southeast Asia. Verified under OPEX software budget (GL-520101).',
      },
    ],
  },
];

export const NOTICE_BOARD: NoticeItem[] = [
  {
    id: 'NOT-2026-089',
    title: 'Mandatory Safety Briefing — Q4 Plant Operations',
    title_bn: 'বাধ্যতামূলক নিরাপত্তা ব্রিফিং — ৪র্থ প্রান্তিক প্ল্যান্ট অপারেশন',
    tag: '⚠️ SAFETY CRITICAL',
    category: 'safety',
    priority: 'critical',
    date: 'Oct 15, 2026',
    author: 'Engr. Harunur Rashid',
    authorRole: 'Plant General Manager & HSE Lead',
    targetAudience: 'All Plant & Operations Staff (218 Personnel)',
    body: 'All engineering, maintenance, and contractor personnel at Keraniganj Bitumen Refinery must complete the revised LOTO & high-pressure steam line briefing before Oct 20. Zero-tolerance policy strictly enforced across all operational units.',
    body_bn: 'কেরানীগঞ্জ বিটুমিন রিফাইনারির সকল প্রকৌশল, রক্ষণাবেক্ষণ ও ঠিকাদার কর্মীদের ২০ অক্টোবরের মধ্যে সংশোধিত এলওটিও ও হাই-প্রেসার স্টিম লাইন ব্রিফিং সম্পন্ন করতে হবে।',
    read: false,
    pinned: true,
    requiresAck: true,
    acknowledgedCount: 184,
    totalRecipients: 218,
    referenceNo: 'BOGCL/HSE/CIR-2026-Q4-019'
  },
  {
    id: 'NOT-2026-088',
    title: 'HSE Incident Report Submission Deadline Extended',
    title_bn: 'এইচএসই ঘটনা প্রতিবেদন জমার সময়সীমা বর্ধিতকরণ',
    tag: 'HSE',
    category: 'operational',
    priority: 'normal',
    date: 'Oct 13, 2026',
    author: 'Sayeda Afroza',
    authorRole: 'HSE Audit Controller',
    targetAudience: 'Department Heads & Safety Marshals',
    body: 'Monthly safety observation audits and hazard observation logs for September have been extended until Sunday 5:00 PM due to the continuous bitumen vacuum distillation expansion run.',
    body_bn: 'ধারাবাহিক বিটুমিন ভ্যাকুয়াম ডিস্টিলেশন সম্প্রসারণের কারণে সেপ্টেম্বর মাসের মাসিক নিরাপত্তা পর্যবেক্ষণ অডিট আগামী রবিবার বিকাল ৫টা পর্যন্ত বাড়ানো হয়েছে।',
    read: true,
    pinned: false,
    requiresAck: false,
    acknowledgedCount: 42,
    totalRecipients: 42,
    referenceNo: 'BOGCL/HSE/NOT-2026-044'
  },
  {
    id: 'NOT-2026-087',
    title: 'Annual Medical Check-up Camp — Nov 4-6, 2026 (All Staff)',
    title_bn: 'বার্ষিক স্বাস্থ্য পরীক্ষা শিবির — ৪-৬ নভেম্বর ২০২৬ (সকল কর্মী)',
    tag: 'HR Circular',
    category: 'hr',
    priority: 'high',
    date: 'Oct 10, 2026',
    author: 'Directorate of Human Resources',
    authorRole: 'Bashundhara Group Central HR',
    targetAudience: 'All Group Employees (1,240 Staff)',
    body: 'Comprehensive occupational health screening, audiometry tests, and respiratory checks will be conducted by Apollo/Evercare medical teams at Baridhara HQ Medical Center and Keraniganj On-site Clinic.',
    body_bn: 'বসুন্ধরা হেড অফিস মেডিকেল সেন্টার এবং কেরানীগঞ্জ অন-সাইট ক্লিনিকে সকল কর্মকর্তা ও কর্মচারীদের জন্য বার্ষিক স্বাস্থ্য পরীক্ষা পরিচালিত হবে।',
    read: true,
    pinned: false,
    requiresAck: true,
    acknowledgedCount: 890,
    totalRecipients: 1240,
    referenceNo: 'BOGCL/HR/MED-2026-012'
  },
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
    { label: 'Sensor & Heat Alerts', labelBn: 'সেন্সর ও তাপমাত্রা সতর্কতা', value: '3', sub: '1 high priority — Column C-102 temp', type: 'red', icon: <Zap size={16}/>, sparkline: [5, 4, 4, 3, 2, 3, 3], sparkColor: '#DC2626' },
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
    { label: 'Staff Attendance', labelBn: 'আজকের উপস্থিতি', value: '94.8%', sub: 'Verified inside office boundary (GPS)', type: 'blue', icon: <TrendingUp size={16}/>, sparkline: [92, 93, 93.5, 94, 94.2, 94.5, 94.8], sparkColor: '#0284C7' },
    { label: 'HR Master Records', labelBn: 'এইচআর মাস্টার রেকর্ড', value: '100%', sub: 'All employee profiles up to date', type: 'green', icon: <ShieldCheckIcon />, sparkline: [100, 100, 100, 100, 100, 100, 100], sparkColor: '#059669' },
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
    { label: 'Alcohol Breath Test', labelBn: 'অ্যালকোহল টেস্ট', value: '100% Passed', sub: 'Zero alcohol (0.00% BAC) verified', type: 'blue', icon: <CheckCircle size={16}/>, sparkline: [0, 0, 0, 0, 0], sparkColor: '#0284C7' },
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
  {
    id: 'LOTO-044',
    type: 'loto',
    typeLabel: 'Electrical Power Lockout',
    equipment: 'Bitumen Feed Pump P-101B',
    equipmentTag: 'BOGCL-KER-PMP-101B',
    location: 'Circulation Pump House #2, Keraniganj Plant',
    breaker: 'Substation Feeder 4B-12',
    lockoutBoxNo: 'LOTO-STATION-02 (Red Padlock #LK-884)',
    padlockCount: 2,
    issuedTo: 'Tariq Ahmed (Senior Maintenance Engineer)',
    issuedBy: 'Engr. Md. Harunur Rashid (Plant GM)',
    status: 'LOCKED OUT',
    hazard: 'High Voltage Electricity (415V) & 180°C Molten Asphalt Circulation',
    plainSummary: 'Electrical power switch is physically locked with a padlock and warning tag so nobody can accidentally turn on the pump while Tariq replaces the mechanical seal.',
    checklist: {
      powerCutVerified: true,
      valvesDrained: true,
      physicalPadlockLocked: true,
      gasTestPassed: true,
      warningTagHung: true,
    },
    timeIssued: '29 Oct 2026, 07:30 AM',
    validUntil: '29 Oct 2026, 05:00 PM',
  },
  {
    id: 'HOT-019',
    type: 'hot_work',
    typeLabel: 'Hot Work & Welding Permit',
    equipment: 'Flare Header Elevation +14m',
    equipmentTag: 'BOGCL-KER-FLR-01',
    location: 'Flare Stack Base, Safety Zone-1',
    breaker: 'Fuel Line Block Valve Locked & Blind Flange Installed',
    lockoutBoxNo: 'HOT-STATION-01',
    padlockCount: 1,
    issuedTo: 'Kamrul Hasan (Certified Pipeline Welder)',
    issuedBy: 'Nazmul Huda (Safety Officer)',
    status: 'ACTIVE PERMIT',
    hazard: 'Welding Sparks & Hot Slag in Hydrocarbon Zone',
    plainSummary: 'High-altitude welding permit. Gas detector test passed (0.0% flammable gas), two 50kg dry chemical fire extinguishers stationed, and safety watchman on duty.',
    checklist: {
      powerCutVerified: true,
      valvesDrained: true,
      physicalPadlockLocked: true,
      gasTestPassed: true,
      warningTagHung: true,
    },
    timeIssued: '29 Oct 2026, 08:45 AM',
    validUntil: '29 Oct 2026, 04:00 PM',
  },
  {
    id: 'CONF-008',
    type: 'confined_space',
    typeLabel: 'Inside Tank Entry Permit',
    equipment: 'Storage Tank TK-103 Internal Inspection',
    equipmentTag: 'BOGCL-KER-TK-103',
    location: 'Tank Farm Bund A, Keraniganj Plant',
    breaker: 'Inlet & Outlet Pipe Flanges Blinded & Locked',
    lockoutBoxNo: 'ENTRY-BOX-04',
    padlockCount: 3,
    issuedTo: 'Nazmul Huda (Safety Officer) & Inspection Team',
    issuedBy: 'Engr. Md. Harunur Rashid (Plant GM)',
    status: 'LOCKED OUT',
    hazard: 'Oxygen Deficiency & Heavy Asphalt Fumes Inside Tank',
    plainSummary: 'Tank ventilated with forced air for 48 hours. Continuous gas monitor shows 20.9% normal oxygen. Safety harness and rescue tripod stationed at the manhole.',
    checklist: {
      powerCutVerified: true,
      valvesDrained: true,
      physicalPadlockLocked: true,
      gasTestPassed: true,
      warningTagHung: true,
    },
    timeIssued: '29 Oct 2026, 09:00 AM',
    validUntil: '29 Oct 2026, 06:00 PM',
  },
];

export const SHIFT_HANDOVER: ShiftHandoverItem[] = [
  {
    id: 'SH-01',
    shift: 'Night → Morning Shift (06:00 AM)',
    shiftType: 'morning',
    handover: 'Engr. Babul (Night Supervisor) ➔ Engr. Tariq (Morning GM In-Charge)',
    outgoingEngineer: 'Engr. Babul Akhter',
    incomingEngineer: 'Engr. Tariq Ahmed',
    time: 'Today, 06:00 AM',
    status: 'completed',
    notes: 'Unit-2 production steady at 5,000 MT/day. Bitumen Tank TK-102 temperature reached 182°C (normal). Watch vacuum distillation column C-102 cooling water pressure closely during midday heat.',
    criticalWatchItems: [
      'Vacuum Column C-102 cooling water pressure',
      'Tanker loading gantry queue during peak morning delivery',
      'Bitumen Pump P-101B seal replacement underway under LOTO-044',
    ],
    safetyChecklistSigned: true,
  },
  {
    id: 'SH-02',
    shift: 'Morning → Afternoon Shift (02:00 PM)',
    shiftType: 'evening',
    handover: 'Engr. Tariq ➔ Engr. Kamrul (Afternoon Supervisor)',
    outgoingEngineer: 'Engr. Tariq Ahmed',
    incomingEngineer: 'Engr. Kamrul Hasan',
    time: 'Today, 02:00 PM',
    status: 'upcoming',
    notes: 'Scheduled: Valve isolation and replacement on V-204 at 03:00 PM. Tanker bay dispatch quota 85% completed for today.',
    criticalWatchItems: [
      'Valve V-204 safety isolation checklist',
      'Evening highway delivery gate traffic',
    ],
    safetyChecklistSigned: false,
  },
  {
    id: 'SH-03',
    shift: 'Afternoon → Night Shift (10:00 PM)',
    shiftType: 'night',
    handover: 'Engr. Kamrul ➔ Engr. Babul (Night Shift)',
    outgoingEngineer: 'Engr. Kamrul Hasan',
    incomingEngineer: 'Engr. Babul Akhter',
    time: 'Tonight, 10:00 PM',
    status: 'upcoming',
    notes: 'Night steam boiler feedwater dosing scheduled at 11:30 PM. Fire sprinkler line routine pressure test at 02:00 AM.',
    criticalWatchItems: [
      'Steam boiler water chemical balance',
      'Night security boundary patrol',
    ],
    safetyChecklistSigned: false,
  },
];

export const INITIAL_VEHICLE_REQUESTS: VehicleRequestItem[] = [
  { id: 'VR-2026-142', requester: 'Md. Shafiqul Islam', designation: 'Director, Sales', from: 'HQ Baridhara', to: 'Chittagong Port', date: 'Oct 18', time: '08:00 AM', passengers: 2, priority: 'high', status: 'pending' },
  { id: 'VR-2026-143', requester: 'Farida Begum', designation: 'CFO', from: 'HQ Baridhara', to: 'Bangladesh Bank', date: 'Oct 17', time: '02:00 PM', passengers: 1, priority: 'high', status: 'pending' },
  { id: 'VR-2026-144', requester: 'Tanvir Ahmed', designation: 'Sr. Sales Executive', from: 'HQ Baridhara', to: 'Keraniganj Plant', date: 'Oct 17', time: '11:00 AM', passengers: 3, priority: 'normal', status: 'pending' },
  { id: 'VR-2026-145', requester: 'Kamrul Hasan', designation: 'Boiler Operator', from: 'Mirpur-10', to: 'Keraniganj Plant', date: 'Oct 17', time: '06:00 AM', passengers: 1, priority: 'normal', status: 'assigned' },
  { id: 'VR-2026-146', requester: 'Nusrat Jahan', designation: 'GM, HR', from: 'HQ Baridhara', to: 'BGMEA Building', date: 'Oct 18', time: '10:00 AM', passengers: 2, priority: 'normal', status: 'pending' },
];

export const INITIAL_HOD_QUEUE: HodQueueItem[] = [
  { id: 'APR-001', type: 'Leave', icon: '📅', title: 'Annual Leave Application — Tanvir Ahmed (5 Days)', detail: 'Oct 20-24, 2026 — Sales duty handed over to Kabir', dept: 'Sales', time: '2h ago', urgency: 'normal', costTk: 0 },
  { id: 'APR-002', type: 'Expense', icon: '💰', title: 'Sales Tour Expense Claim — Chittagong Depot Visit', detail: '4-day dealer network audit, hotel & travel vouchers verified', dept: 'Sales', time: '1d ago', urgency: 'normal', costTk: 14850 },
  { id: 'APR-003', type: 'Conveyance', icon: '🚌', title: 'Monthly Local Travel Allowance — September 2026', detail: '22 field client visits across Dhaka, Motijheel & Tejgaon', dept: 'Sales', time: '3d ago', urgency: 'overdue', costTk: 5420 },
  { id: 'APR-004', type: 'Transport', icon: '🚗', title: 'Official Duty Pool Car Booking — Head Office to Factory', detail: 'Executive site visit with visiting financial auditors (Oct 18)', dept: 'Finance', time: '4h ago', urgency: 'normal', costTk: 0 },
  { id: 'APR-005', type: 'Purchase', icon: '🛒', title: 'Quarterly Office Stationery & Laser Printer Toners', detail: 'A4 paper (150 reams) + high-speed printer toner cartridges', dept: 'Admin', time: '2d ago', urgency: 'normal', costTk: 85000 },
  { id: 'APR-006', type: 'Document', icon: '📄', title: 'Corporate Flexible Hours & Work From Home Guidelines', detail: 'Updated HR policy draft for corporate head office staff', dept: 'HR', time: '5h ago', urgency: 'normal', costTk: 0 },
  { id: 'APR-007', type: 'Leave', icon: '📅', title: 'Medical Sick Leave — Md. Rahim Uddin (5 Days)', detail: 'Post-surgery recovery, Evercare Hospital certificate attached', dept: 'Finance', time: '1d ago', urgency: 'overdue', costTk: 0 },
];

export const MY_RECENT_ACTIVITY = [
  { icon: '✅', title: 'Attendance logged', detail: 'Punch-in at 08:52 AM — Inside geofence (South Gate)', time: 'Today, 08:52 AM' },
  { icon: '📄', title: 'Conveyance claim submitted', detail: '৳4,850 for October 2026 — Pending HOD review', time: 'Today, 09:30 AM' },
  { icon: '📦', title: 'Parcel dispatched to you', detail: 'From Head Office → Keraniganj — In Transit', time: 'Yesterday, 04:15 PM' },
  { icon: '🚌', title: 'Bus seat confirmed', detail: 'Seat #7, Route 3 (Mirpur → Plant) — Active Pass', time: 'Oct 14, 2026' },
];
