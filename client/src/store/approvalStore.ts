import React from 'react';
import { AppRole, ROLE_META, SYSTEM_TODAY } from '../types';
import { ClaimSubmissionData } from '../components/claims/SubmitClaimModal';
import { notesheetStore } from './notesheetStore';
import { fleetStore } from './fleetStore';
import { operationsStore } from './operationsStore';
import { advanceAssetRequisitionById, rejectAssetRequisitionById } from './assetStore';

export interface ClaimItem {
  id: string;
  claimant: string;
  designation: string;
  dept: string;
  type: 'tada' | 'conveyance' | 'tour_event';
  purpose: string;
  destination?: string;
  period: string;
  amount: number;
  advanceTaken?: number;
  netSettlement?: number;
  status: 'pending_hod' | 'pending_finance' | 'approved' | 'settled' | 'rejected';
  dateSubmitted: string;
  sapVoucher?: string;
  items?: { desc: string; date: string; amount: number; category: string }[];
  rejectionReason?: string;
  rejectionObservation?: string;
  rejectionImprovementNotes?: string;
  rejectedBy?: string;
  rejectedAt?: string;
}

export interface DepartmentApprovalStep {
  stepNo: number;
  officerName: string;
  roleName: string;
  department: string;
  status: 'completed' | 'pending' | 'reviewing';
  timestamp: string;
  note: string;
  signatureHash?: string;
}

export interface ApprovalItem {
  id: string;
  category: 'finance' | 'procurement' | 'fleet' | 'leave' | 'hr';
  title: string;
  titleBn: string;
  requester: string;
  designation: string;
  dept: string;
  amount?: string;
  costTk?: number;
  date: string;
  slaHoursLeft: number;
  urgency: 'critical' | 'high' | 'normal';
  sapDocRef: string;
  details: string;
  sourceType?: 'claim' | 'requisition' | 'notesheet' | 'leave' | 'asset_req' | 'generic';
  sourceId?: string;
  approvalTrail?: DepartmentApprovalStep[];
  decisionStatus?: 'pending' | 'approved' | 'rejected';
  executiveDirective?: string;
  authorizedBy?: string;
  authorizedAt?: string;
  sapVoucher?: string;
  rejectionReason?: string;
  rejectionObservation?: string;
  rejectionImprovementNotes?: string;
  rejectedBy?: string;
  rejectedAt?: string;
}

const INITIAL_CLAIMS: ClaimItem[] = [
  {
    id: 'TOUR-2026-008',
    claimant: 'Engr. Md. Harunur Rashid',
    designation: 'Plant General Manager',
    dept: 'Plant Operations',
    type: 'tour_event',
    purpose: 'Official Regional Visit — Chattogram Depot Check & Customer Meetings',
    destination: 'Chattogram Depot',
    period: '20 Oct – 23 Oct 2026 (4 days)',
    amount: 40500,
    advanceTaken: 45000,
    netSettlement: -4500,
    status: 'approved',
    dateSubmitted: '25 Oct 2026',
    sapVoucher: 'VCH-2026-10492',
    items: [
      { desc: 'Return Flight Ticket (Dhaka – Chattogram)', date: '20, 23 Oct', amount: 14000, category: 'Airfare' },
      { desc: 'Hotel Peninsula Chattogram (3 Nights Stay)', date: '20-22 Oct', amount: 18000, category: 'Hotel' },
      { desc: 'Local Taxi & Depot Travel', date: '21-22 Oct', amount: 8500, category: 'Local Transport' },
    ],
  },
  {
    id: 'SPRT-2026-003',
    claimant: 'Md. Kamruzzaman',
    designation: 'Transport & Admin Supervisor',
    dept: 'Transport & Logistics',
    type: 'tour_event',
    purpose: 'Annual Staff Sports & Family Day Settlement (Keraniganj Ground)',
    destination: 'Keraniganj Plant Field',
    period: '24 Oct – 25 Oct 2026 (2 days)',
    amount: 362400,
    advanceTaken: 350000,
    netSettlement: 12400,
    status: 'pending_hod',
    dateSubmitted: '27 Oct 2026',
    items: [
      { desc: 'Tent, Chairs, Stage & Sound System Rental', date: '24 Oct', amount: 145000, category: 'Event Setup' },
      { desc: 'Team Jerseys & Trophies for 8 Staff Teams', date: '24 Oct', amount: 98400, category: 'Sports Kit' },
      { desc: 'Lunch & Refreshments for 350 Staff & Drivers', date: '24-25 Oct', amount: 119000, category: 'Food & Drinks' },
    ],
  },
  {
    id: 'TADA-2026-0419',
    claimant: 'Tanvir Ahmed',
    designation: 'Senior Sales Officer',
    dept: 'Sales & Distribution',
    type: 'tada',
    purpose: 'Chattogram Dealer Visits & Pending Payment Collection',
    destination: 'Chattogram & Sitakunda',
    period: '23 Oct – 26 Oct 2026 (4 days)',
    amount: 14850,
    status: 'pending_hod',
    dateSubmitted: '27 Oct 2026',
    items: [
      { desc: 'Daily Food & Travel Allowance (4 days @ ৳1,500/day)', date: '23-26 Oct', amount: 6000, category: 'Daily Allowance' },
      { desc: 'Hotel Peninsula Stay (3 nights with official VAT receipt)', date: '23-25 Oct', amount: 7200, category: 'Hotel' },
      { desc: 'AC Coach Ticket (Dhaka – Chattogram – Dhaka)', date: '23, 26 Oct', amount: 1650, category: 'Bus Ticket' },
    ],
  },
  {
    id: 'CNV-2026-1002',
    claimant: 'Tanvir Ahmed',
    designation: 'Senior Sales Officer',
    dept: 'Sales & Distribution',
    type: 'conveyance',
    purpose: 'Local Client Visits — Motijheel, Tejgaon & Narayanganj',
    destination: 'Dhaka & Narayanganj',
    period: '16 Oct – 28 Oct 2026',
    amount: 5420,
    status: 'pending_hod',
    dateSubmitted: '28 Oct 2026',
    items: [
      { desc: 'CNG Auto: Head Office to Motijheel Bank & Dealer Office', date: '18 Oct', amount: 450, category: 'CNG' },
      { desc: 'Ride-Share Car: Motijheel to Tejgaon Depot', date: '21 Oct', amount: 620, category: 'Car Fare' },
      { desc: 'CNG Auto: Narayanganj Distributor Visit', date: '24 Oct', amount: 850, category: 'CNG' },
      { desc: 'Local Transport: Retail Hardware & Bitumen Dealers', date: '26-28 Oct', amount: 3500, category: 'Local Travel' },
    ],
  },
];

const INITIAL_APPROVAL_ITEMS: ApprovalItem[] = [
  {
    id: 'APR-2026-0894',
    category: 'procurement',
    title: 'Backup Power Generator Maintenance & Spare Parts Purchase',
    titleBn: 'ব্যাকআপ বিদ্যুৎ জেনারেটর মেরামত ও যন্ত্রাংশ ক্রয়',
    requester: 'Engr. Md. Harunur Rashid',
    designation: 'Plant General Manager',
    dept: 'Plant Operations',
    amount: '৳48,50,000',
    costTk: 4850000,
    date: 'Today, 09:30 AM',
    slaHoursLeft: 6,
    urgency: 'critical',
    sapDocRef: 'BOGCL/PLANT/2026/0894',
    details: 'Urgent servicing and genuine parts for the 1,200 kVA main backup generator at Keraniganj Plant (Energypac lowest quote with 1-year warranty).',
    sourceType: 'notesheet',
    sourceId: 'f1',
    approvalTrail: [
      {
        stepNo: 1,
        officerName: 'Engr. Tariqul Islam',
        roleName: 'Senior Plant Maintenance Engineer',
        department: 'Plant Operations',
        status: 'completed',
        timestamp: '27 Oct 2026, 09:30 AM',
        note: 'Inspection found worn water pump and seals on the 1,200 kVA backup generator. Servicing needed before peak winter production.',
      },
      {
        stepNo: 2,
        officerName: 'Engr. Md. Harunur Rashid',
        roleName: 'Plant General Manager',
        department: 'Plant Operations',
        status: 'completed',
        timestamp: '27 Oct 2026, 02:45 PM',
        note: '3 vendor quotes compared. Energypac Power selected at ৳48,50,000 with genuine parts and 12-month warranty.',
      },
      {
        stepNo: 3,
        officerName: 'Farida Begum',
        roleName: 'Head of Finance & Approver',
        department: 'Finance & Accounts',
        status: 'completed',
        timestamp: '28 Oct 2026, 11:15 AM',
        note: 'Funds verified available in Factory Maintenance Account (ACC-4102-KER). Recommended for final approval.',
      },
    ],
  },
  {
    id: 'APR-ARQ-022',
    category: 'procurement',
    title: 'Asset Purchase Request — New 3-Ton Electric Warehouse Forklift',
    titleBn: 'নতুন ৩-টন ইলেকট্রিক ফর্কলিফট ক্রয়ের আবেদন',
    requester: 'Engr. Md. Harunur Rashid',
    designation: 'Plant General Manager',
    dept: 'Plant Operations',
    amount: '৳42,00,000',
    costTk: 4200000,
    date: '28 Oct 2026',
    slaHoursLeft: 14,
    urgency: 'high',
    sapDocRef: 'ARQ-2026-022',
    details: 'Replaces retired 2016 diesel forklift with a clean electric loader for Keraniganj drum warehouse. Already endorsed by Head of Finance.',
    sourceType: 'asset_req',
    sourceId: 'ARQ-01',
    approvalTrail: [
      {
        stepNo: 1,
        officerName: 'Engr. Md. Harunur Rashid',
        roleName: 'Plant General Manager',
        department: 'Plant Operations',
        status: 'completed',
        timestamp: '26 Oct 2026, 03:00 PM',
        note: 'Old 2016 forklift retired after 10 years of service. New electric unit lowers fuel & repair costs.',
      },
      {
        stepNo: 2,
        officerName: 'Farida Begum',
        roleName: 'Head of Finance & Approver',
        department: 'Finance & Accounts',
        status: 'completed',
        timestamp: '27 Oct 2026, 04:20 PM',
        note: 'Budget checked and endorsed for Executive sanction.',
      },
    ],
  },
  {
    id: 'APR-2026-003',
    category: 'finance',
    title: 'Event Expense Settlement — Annual Staff Sports & Family Day',
    titleBn: 'বার্ষিক কর্মী ক্রীড়া ও মিলনমেলা ব্যয় নিষ্পত্তি',
    requester: 'Md. Kamruzzaman',
    designation: 'Transport & Admin Supervisor',
    dept: 'Transport & Logistics',
    amount: '৳3,62,400',
    costTk: 362400,
    date: '27 Oct 2026',
    slaHoursLeft: 16,
    urgency: 'normal',
    sapDocRef: 'SPRT-2026-003',
    details: '৳3,50,000 advance taken earlier; ৳12,400 remaining balance payable for 350 staff catering, tents, and team jerseys.',
    sourceType: 'claim',
    sourceId: 'SPRT-2026-003',
  },
  {
    id: 'APR-ARQ-023',
    category: 'procurement',
    title: 'Asset Request — Portable Projector for Client Presentations',
    titleBn: 'ক্লায়েন্ট প্রেজেন্টেশনের জন্য পোর্টেবল প্রজেক্টর ক্রয়',
    requester: 'Tanvir Ahmed',
    designation: 'Senior Sales Officer',
    dept: 'Sales & Distribution',
    amount: '৳95,000',
    costTk: 95000,
    date: 'Yesterday',
    slaHoursLeft: 24,
    urgency: 'normal',
    sapDocRef: 'ARQ-2026-023',
    details: 'Epson Full HD projector for dealer meetings and Roads & Highways tender presentations.',
    sourceType: 'asset_req',
    sourceId: 'ARQ-02',
  },
  {
    id: 'APR-2026-0518',
    category: 'procurement',
    title: 'Quarterly Head Office Printing Paper, Stationery & Toner Purchase',
    titleBn: 'প্রধান কার্যালয়ের ত্রৈমাসিক কাগজ, স্টেশনারি ও টোনার ক্রয়',
    requester: 'Md. Kamruzzaman',
    designation: 'Transport & Admin Supervisor',
    dept: 'Transport & Logistics',
    amount: '৳85,000',
    costTk: 85000,
    date: 'Today, 11:15 AM',
    slaHoursLeft: 12,
    urgency: 'normal',
    sapDocRef: 'BOGCL/ADMIN/2026/0518',
    details: '150 reams of A4 paper, envelopes, and 18 printer toners for 5 Head Office floors (Prime Office Supplies lowest quote).',
    sourceType: 'notesheet',
    sourceId: 'f4',
    approvalTrail: [
      {
        stepNo: 1,
        officerName: 'Md. Kamruzzaman',
        roleName: 'Transport & Admin Supervisor',
        department: 'Transport & Logistics',
        status: 'completed',
        timestamp: 'Today, 10:30 AM',
        note: '3 market quotes collected; Prime Office Supplies selected as lowest price.',
      },
      {
        stepNo: 2,
        officerName: 'Sayeda Afroza Sultana',
        roleName: 'GM, HR & Administration',
        department: 'Human Resources',
        status: 'completed',
        timestamp: 'Today, 11:15 AM',
        note: 'Stock quantities verified and forwarded to Finance.',
      },
    ],
  },
  {
    id: 'APR-2026-1042',
    category: 'finance',
    title: 'Travel Expense Claim — Chattogram Dealer Visits (4 Days)',
    titleBn: 'ভ্রমণ ব্যয় বিল — চট্টগ্রাম ডিলার পরিদর্শন (৪ দিন)',
    requester: 'Tanvir Ahmed',
    designation: 'Senior Sales Officer',
    dept: 'Sales & Distribution',
    amount: '৳14,850',
    costTk: 14850,
    date: '27 Oct 2026',
    slaHoursLeft: 18,
    urgency: 'normal',
    sapDocRef: 'TADA-2026-0419',
    details: '4-day dealer visit & payment collection trip with official hotel VAT receipt and bus tickets attached.',
    sourceType: 'claim',
    sourceId: 'TADA-2026-0419',
  },
  {
    id: 'APR-2026-1002',
    category: 'finance',
    title: 'Local Travel Expense Bill — Dhaka & Narayanganj Client Visits',
    titleBn: 'স্থানীয় যাতায়াত বিল — ঢাকা ও নারায়ণগঞ্জ ক্লায়েন্ট ভিজিট',
    requester: 'Tanvir Ahmed',
    designation: 'Senior Sales Officer',
    dept: 'Sales & Distribution',
    amount: '৳5,420',
    costTk: 5420,
    date: 'Yesterday',
    slaHoursLeft: 26,
    urgency: 'normal',
    sapDocRef: 'CNV-2026-1002',
    details: 'Local CNG and car fares for client and distributor visits between 16 Oct and 28 Oct 2026.',
    sourceType: 'claim',
    sourceId: 'CNV-2026-1002',
  },
  {
    id: 'APR-REQ-441',
    category: 'fleet',
    title: 'Company Car Booking — Head Office to Keraniganj Plant',
    titleBn: 'অফিসিয়াল গাড়ির আবেদন — প্রধান কার্যালয় হতে কেরানীগঞ্জ প্ল্যান্ট',
    requester: 'Tanvir Ahmed',
    designation: 'Senior Sales Officer',
    dept: 'Sales & Distribution',
    amount: '৳0 (Company Pool Car)',
    costTk: 0,
    date: 'Today, 11:20 AM',
    slaHoursLeft: 4,
    urgency: 'high',
    sapDocRef: 'REQ-2026-441',
    details: 'Round trip today 2:30 PM – 6:00 PM (2 passengers) to deliver signed highway supply papers to Plant GM.',
    sourceType: 'requisition',
    sourceId: 'REQ-2026-441',
  },
  {
    id: 'APR-REQ-443',
    category: 'fleet',
    title: 'Company Car Booking — Head Office to Keraniganj Gate #1',
    titleBn: 'অফিসিয়াল গাড়ির আবেদন — প্রধান কার্যালয় হতে প্ল্যান্ট গেট #১',
    requester: 'Mizanur Rahman',
    designation: 'Main Gate & Security Officer',
    dept: 'Security Administration',
    amount: '৳0 (Company Pool Car)',
    costTk: 0,
    date: 'Today, 11:35 AM',
    slaHoursLeft: 5,
    urgency: 'normal',
    sapDocRef: 'REQ-2026-443',
    details: 'One-way trip today at 2:45 PM to carry visitor pass printer & security logbooks to Keraniganj Gate #1.',
    sourceType: 'requisition',
    sourceId: 'REQ-2026-443',
  },
  {
    id: 'APR-2026-0744',
    category: 'leave',
    title: 'Sick Leave Application — Post-Surgery Medical Rest (5 Days)',
    titleBn: 'অসুস্থতাজনিত ছুটির আবেদন — চিকিৎসা বিশ্রাম (৫ দিন)',
    requester: 'Md. Rahim Uddin',
    designation: 'Senior Accounts Executive',
    dept: 'Finance & Accounts',
    amount: '5 Days Leave',
    costTk: 0,
    date: 'Today, 08:45 AM',
    slaHoursLeft: 36,
    urgency: 'normal',
    sapDocRef: 'LV-2026-089',
    details: 'Evercare Hospital doctor certificate attached (30 Oct – 03 Nov 2026). Daily work handed over to colleague.',
    sourceType: 'leave',
    sourceId: 'LV-2026-089',
    approvalTrail: [
      {
        stepNo: 1,
        officerName: 'Md. Rahim Uddin',
        roleName: 'Senior Accounts Executive',
        department: 'Finance & Accounts',
        status: 'completed',
        timestamp: 'Today, 08:30 AM',
        note: 'Submitted medical certificate and duty handover note.',
      },
      {
        stepNo: 2,
        officerName: 'Sayeda Afroza Sultana',
        roleName: 'GM, HR & Administration',
        department: 'Human Resources',
        status: 'completed',
        timestamp: 'Today, 08:45 AM',
        note: '14 days sick leave balance available. Forwarded for department approval.',
      },
    ],
  },
];

const INITIAL_DECIDED_ITEMS: ApprovalItem[] = [
  {
    id: 'APR-2026-0211',
    category: 'procurement',
    title: 'Annual Office Software, Email & Cloud Backup Renewal (2026–2027)',
    titleBn: 'বার্ষিক অফিস সফটওয়্যার, ইমেইল ও ক্লাউড ব্যাকআপ নবায়ন',
    requester: 'Farida Begum',
    designation: 'Head of Finance & Approver',
    dept: 'Finance & Accounts',
    amount: '৳18,50,000',
    costTk: 1850000,
    date: '22 Oct 2026',
    slaHoursLeft: 0,
    urgency: 'high',
    sapDocRef: 'BOGCL/IT/2026/0211',
    details: '12-month renewal for company accounting software, staff business email, and daily cloud backup.',
    sourceType: 'notesheet',
    sourceId: 'f2',
    decisionStatus: 'approved',
    authorizedBy: 'Farida Begum (Head of Finance & Approver)',
    authorizedAt: '22 Oct 2026, 04:15 PM',
    sapVoucher: 'VCH-2026-44120',
  },
];

class ApprovalStore {
  private claims: ClaimItem[] = [...INITIAL_CLAIMS];
  private approvalItems: ApprovalItem[] = [...INITIAL_APPROVAL_ITEMS];
  private decidedItems: ApprovalItem[] = [...INITIAL_DECIDED_ITEMS];
  private listeners: Set<() => void> = new Set();

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  getClaims(): ClaimItem[] {
    return this.claims;
  }

  getApprovalItems(): ApprovalItem[] {
    return this.approvalItems;
  }

  getDecidedItems(): ApprovalItem[] {
    return this.decidedItems;
  }

  // 1. Submit a Claim and mirror it into Pending Approvals
  addClaim(data: ClaimSubmissionData): ClaimItem {
    const newClaim: ClaimItem = {
      id: data.id,
      claimant: data.claimant,
      designation: data.designation,
      dept: data.dept,
      type: data.type,
      purpose: data.purpose,
      destination: data.destination,
      period: data.period,
      amount: data.amount,
      advanceTaken: data.advanceTaken,
      netSettlement: data.netSettlement,
      status: 'pending_hod',
      dateSubmitted: data.dateSubmitted,
      items: data.items,
    };

    this.claims = [newClaim, ...this.claims];

    const typeLabel =
      data.type === 'tada' ? 'Travel Expense' : data.type === 'conveyance' ? 'Local Travel' : 'Event / Tour';

    const newApprovalItem: ApprovalItem = {
      id: `APR-${data.id}`,
      category: 'finance',
      title: `${typeLabel} Claim — ${data.purpose}`,
      titleBn: `${data.purpose}`,
      requester: data.claimant,
      designation: data.designation,
      dept: data.dept,
      amount: `৳${data.amount.toLocaleString()}`,
      costTk: data.amount,
      date: 'Today, Just Now',
      slaHoursLeft: 24,
      urgency: data.amount > 50000 ? 'critical' : 'normal',
      sapDocRef: data.id,
      details: `${data.period}. Submitted by ${data.claimant} (${data.dept}) for approval.`,
      sourceType: 'claim',
      sourceId: data.id,
    };

    this.approvalItems = [newApprovalItem, ...this.approvalItems];
    this.notify();
    return newClaim;
  }

  // 2. Mirror Vehicle Booking into Pending Approvals
  addRequisitionApproval(reqId: string, requester: string, dept: string, from: string, to: string, purpose: string) {
    if (this.approvalItems.some((a) => a.sourceId === reqId)) return;
    const approvalItem: ApprovalItem = {
      id: `APR-${reqId}`,
      category: 'fleet',
      title: `Company Car Booking — ${from} ➔ ${to}`,
      titleBn: `অফিসিয়াল গাড়ির আবেদন — ${from} হতে ${to}`,
      requester,
      designation: 'Staff / Officer',
      dept,
      amount: '৳0 (Company Pool Car)',
      costTk: 0,
      date: 'Today, Just Now',
      slaHoursLeft: 12,
      urgency: 'high',
      sapDocRef: reqId,
      details: `Purpose: ${purpose}. Waiting for approval and vehicle assignment.`,
      sourceType: 'requisition',
      sourceId: reqId,
    };

    this.approvalItems = [approvalItem, ...this.approvalItems];
    this.notify();
  }

  // 3. Mirror Official Notesheet into Pending Approvals
  addNotesheetApproval(fileNo: string, title: string, initiator: string, dept: string, amount: string) {
    if (this.approvalItems.some((a) => a.sourceId === fileNo)) return;
    const numericAmount = parseInt(amount.replace(/[^0-9]/g, ''), 10) || 0;
    const approvalItem: ApprovalItem = {
      id: `APR-NS-${Date.now().toString().slice(-4)}`,
      category: 'procurement',
      title: `Official Document Approval — ${title}`,
      titleBn: `দাপ্তরিক নথি অনুমোদন — ${title}`,
      requester: initiator,
      designation: 'Document Initiator',
      dept,
      amount,
      costTk: numericAmount,
      date: 'Today, Just Now',
      slaHoursLeft: 18,
      urgency: numericAmount > 500000 ? 'critical' : 'normal',
      sapDocRef: fileNo,
      details: `Official approval document submitted by ${initiator} (${dept}).`,
      sourceType: 'notesheet',
      sourceId: fileNo,
    };

    this.approvalItems = [approvalItem, ...this.approvalItems];
    this.notify();
  }

  // 4. Mirror Leave Request into Pending Approvals
  addLeaveApproval(leaveId: string, employeeName: string, designation: string, dept: string, leaveType: string, days: number, reason: string) {
    if (this.approvalItems.some((a) => a.sourceId === leaveId)) return;
    const approvalItem: ApprovalItem = {
      id: `APR-${leaveId}`,
      category: 'leave',
      title: `${leaveType} Application (${days} ${days === 1 ? 'Day' : 'Days'}) — ${employeeName}`,
      titleBn: `ছুটির আবেদন (${days} দিন) — ${employeeName}`,
      requester: employeeName,
      designation,
      dept,
      amount: `${days} ${days === 1 ? 'Day' : 'Days'}`,
      costTk: 0,
      date: 'Today, Just Now',
      slaHoursLeft: 24,
      urgency: 'normal',
      sapDocRef: leaveId,
      details: reason,
      sourceType: 'leave',
      sourceId: leaveId,
    };
    this.approvalItems = [approvalItem, ...this.approvalItems];
    this.notify();
  }

  // 5. Mirror Asset Purchase Request into Pending Approvals
  addAssetRequisitionApproval(reqId: string, reqNumber: string, title: string, requester: string, dept: string, costBdt: number, justification: string) {
    if (this.approvalItems.some((a) => a.sourceId === reqId)) return;
    const approvalItem: ApprovalItem = {
      id: `APR-${reqNumber}`,
      category: 'procurement',
      title: `Asset Request — ${title}`,
      titleBn: `নতুন সম্পদ ক্রয়ের আবেদন — ${title}`,
      requester,
      designation: 'Officer / Manager',
      dept,
      amount: `৳${costBdt.toLocaleString()}`,
      costTk: costBdt,
      date: 'Today, Just Now',
      slaHoursLeft: 24,
      urgency: costBdt >= 1000000 ? 'high' : 'normal',
      sapDocRef: reqNumber,
      details: justification,
      sourceType: 'asset_req',
      sourceId: reqId,
    };
    this.approvalItems = [approvalItem, ...this.approvalItems];
    this.notify();
  }

  // Sync decision triggered directly inside a source module (NotesheetView, FleetView, AttendanceView, AssetView)
  syncSourceDecision(
    sourceId: string,
    decision: 'approved' | 'rejected',
    actorName: string,
    noteOrReason?: string
  ) {
    const item = this.approvalItems.find((a) => a.sourceId === sourceId || a.sapDocRef === sourceId);
    if (!item) return;

    const voucher = `VCH-2026-${Math.floor(10000 + Math.random() * 89999)}`;
    const decided: ApprovalItem =
      decision === 'approved'
        ? {
            ...item,
            decisionStatus: 'approved',
            authorizedBy: actorName,
            authorizedAt: `${SYSTEM_TODAY}, Just Now`,
            executiveDirective: noteOrReason,
            sapVoucher: voucher,
          }
        : {
            ...item,
            decisionStatus: 'rejected',
            rejectedBy: actorName,
            rejectedAt: `${SYSTEM_TODAY}, Just Now`,
            rejectionReason: noteOrReason || 'Returned for revision',
          };

    this.approvalItems = this.approvalItems.filter((a) => a.id !== item.id);
    this.decidedItems = [decided, ...this.decidedItems];
    this.notify();
  }

  // 6. Approve an Item in Pending Approvals (Two-Way Sync with All Modules!)
  approveApprovalItem(
    itemId: string,
    directive?: string,
    authorizedBy?: string,
    authorizerRole: AppRole = 'chairman'
  ): { sapVoucher: string; sourceId?: string; sourceType?: string; directive?: string } {
    const item = this.approvalItems.find((a) => a.id === itemId);
    const meta = ROLE_META[authorizerRole];
    const approverLabel = authorizedBy || `${meta.name} (${meta.label})`;
    const generatedVoucher = `VCH-2026-${Math.floor(10000 + Math.random() * 90000)}`;

    if (item) {
      if (item.sourceType === 'claim' && item.sourceId) {
        this.claims = this.claims.map((c) =>
          c.id === item.sourceId ? { ...c, status: 'approved', sapVoucher: generatedVoucher } : c
        );
      } else if (item.sourceType === 'notesheet' && item.sourceId) {
        notesheetStore.approveFile({
          fileIdOrNo: item.sourceId,
          actorName: meta.name,
          actorRoleTitle: meta.label,
          actorDept: meta.dept,
          actorRole: authorizerRole,
          remark: directive || 'Approved via Approvals Center.',
          stampCode: generatedVoucher,
        });
      } else if (item.sourceType === 'requisition' && item.sourceId) {
        fleetStore.endorseHOD(item.sourceId, 'approved');
      } else if (item.sourceType === 'leave' && item.sourceId) {
        operationsStore.updateLeaveStatus(item.sourceId, 'approved', meta.name);
      } else if (item.sourceType === 'asset_req' && item.sourceId) {
        advanceAssetRequisitionById(item.sourceId, meta.name, meta.label);
      }

      const decided: ApprovalItem = {
        ...item,
        decisionStatus: 'approved',
        authorizedBy: approverLabel,
        authorizedAt: `${SYSTEM_TODAY}, Just Now`,
        executiveDirective: directive || item.executiveDirective,
        sapVoucher: generatedVoucher,
      };
      this.decidedItems = [decided, ...this.decidedItems];
    }

    this.approvalItems = this.approvalItems.filter((a) => a.id !== itemId);
    this.notify();

    return {
      sapVoucher: generatedVoucher,
      sourceId: item?.sourceId,
      sourceType: item?.sourceType,
      directive: directive || item?.executiveDirective,
    };
  }

  // 7. Reject / Return an Item in Pending Approvals (Two-Way Sync with All Modules!)
  rejectApprovalItem(
    itemId: string,
    reasonCategory?: string,
    observation?: string,
    improvementsRequired?: string,
    reviewer?: string,
    reviewerRole: AppRole = 'hod'
  ) {
    const item = this.approvalItems.find((a) => a.id === itemId);
    const meta = ROLE_META[reviewerRole];
    const timestamp = `${SYSTEM_TODAY}, Just Now`;
    const reviewerName = reviewer || `${meta.name} (${meta.label})`;
    const reason = reasonCategory || 'Additional Details Needed';
    const obs = observation || 'Please review attached figures and supporting receipts.';
    const imp = improvementsRequired || 'Update and resubmit with clear supporting documents.';

    if (item) {
      if (item.sourceType === 'claim' && item.sourceId) {
        this.claims = this.claims.map((c) =>
          c.id === item.sourceId
            ? {
                ...c,
                status: 'rejected',
                rejectionReason: reason,
                rejectionObservation: obs,
                rejectionImprovementNotes: imp,
                rejectedBy: reviewerName,
                rejectedAt: timestamp,
              }
            : c
        );
      } else if (item.sourceType === 'notesheet' && item.sourceId) {
        notesheetStore.returnFileForRevision({
          fileIdOrNo: item.sourceId,
          actorName: meta.name,
          actorRoleTitle: meta.label,
          actorDept: meta.dept,
          actorRole: reviewerRole,
          reasonCategory: reason,
          observation: obs,
          improvementsRequired: imp,
        });
      } else if (item.sourceType === 'requisition' && item.sourceId) {
        fleetStore.rejectRequisition(item.sourceId, `${reason}: ${obs}`);
      } else if (item.sourceType === 'leave' && item.sourceId) {
        operationsStore.updateLeaveStatus(item.sourceId, 'rejected', meta.name);
      } else if (item.sourceType === 'asset_req' && item.sourceId) {
        rejectAssetRequisitionById(item.sourceId, `${reason} — ${obs}`, meta.name, meta.label);
      }

      const decided: ApprovalItem = {
        ...item,
        decisionStatus: 'rejected',
        rejectionReason: reason,
        rejectionObservation: obs,
        rejectionImprovementNotes: imp,
        rejectedBy: reviewerName,
        rejectedAt: timestamp,
      };
      this.decidedItems = [decided, ...this.decidedItems];
    }

    this.approvalItems = this.approvalItems.filter((a) => a.id !== itemId);
    this.notify();
  }

  // 8. Direct Claim Return/Rejection from ClaimsView
  rejectClaim(
    id: string,
    reasonCategory: string,
    observation: string,
    improvementsRequired: string,
    reviewer?: string
  ) {
    const timestamp = `${SYSTEM_TODAY}, Just Now`;
    const reviewerName = reviewer || 'Approving Manager';

    this.claims = this.claims.map((c) =>
      c.id === id
        ? {
            ...c,
            status: 'rejected',
            rejectionReason: reasonCategory,
            rejectionObservation: observation,
            rejectionImprovementNotes: improvementsRequired,
            rejectedBy: reviewerName,
            rejectedAt: timestamp,
          }
        : c
    );

    const linked = this.approvalItems.find((a) => a.sourceId === id);
    if (linked) {
      this.decidedItems = [
        {
          ...linked,
          decisionStatus: 'rejected',
          rejectionReason: reasonCategory,
          rejectionObservation: observation,
          rejectionImprovementNotes: improvementsRequired,
          rejectedBy: reviewerName,
          rejectedAt: timestamp,
        },
        ...this.decidedItems,
      ];
      this.approvalItems = this.approvalItems.filter((a) => a.sourceId !== id);
    }

    this.notify();
  }

  // 9. Resubmit a Returned Claim
  resubmitClaim(id: string, revisionNotes?: string) {
    this.claims = this.claims.map((c) =>
      c.id === id
        ? {
            ...c,
            status: 'pending_hod',
            rejectionReason: undefined,
            rejectionObservation: undefined,
            rejectionImprovementNotes: undefined,
          }
        : c
    );

    const updatedClaim = this.claims.find((c) => c.id === id);
    if (updatedClaim) {
      this.approvalItems = [
        {
          id: `APR-${updatedClaim.id}-${Date.now().toString().slice(-3)}`,
          category: 'finance',
          title: `Expense Claim (Resubmitted) — ${updatedClaim.purpose}`,
          titleBn: `${updatedClaim.purpose} (সংশোধিত দাখিল)`,
          requester: updatedClaim.claimant,
          designation: updatedClaim.designation,
          dept: updatedClaim.dept,
          amount: `৳${updatedClaim.amount.toLocaleString()}`,
          costTk: updatedClaim.amount,
          date: 'Today, Resubmitted',
          slaHoursLeft: 24,
          urgency: 'high',
          sapDocRef: updatedClaim.id,
          details: `Resubmitted with updates: ${revisionNotes || 'Supporting receipts attached'}.`,
          sourceType: 'claim',
          sourceId: updatedClaim.id,
        },
        ...this.approvalItems,
      ];
    }

    this.notify();
  }

  // 10. Batch Approve Selected Items
  batchApproveItems(itemIds: string[], authorizerRole: AppRole = 'chairman'): { count: number; totalCost: number; vouchers: string[] } {
    let totalCost = 0;
    const vouchers: string[] = [];

    itemIds.forEach((id) => {
      const item = this.approvalItems.find((a) => a.id === id);
      if (item) {
        totalCost += item.costTk || 0;
        const res = this.approveApprovalItem(id, undefined, undefined, authorizerRole);
        vouchers.push(res.sapVoucher);
      }
    });

    this.notify();
    return { count: vouchers.length, totalCost, vouchers };
  }

  // 11. Direct Claim Status Updater (from ClaimsView)
  updateClaimStatus(id: string, status: ClaimItem['status'], sapVoucher?: string, actorName?: string) {
    const voucher = sapVoucher || (status === 'approved' ? `VCH-2026-${Math.floor(10000 + Math.random() * 90000)}` : undefined);
    this.claims = this.claims.map((c) =>
      c.id === id ? { ...c, status, sapVoucher: voucher || c.sapVoucher } : c
    );

    if (status === 'approved' || status === 'rejected') {
      const linked = this.approvalItems.find((a) => a.sourceId === id);
      if (linked) {
        this.decidedItems = [
          {
            ...linked,
            decisionStatus: status,
            authorizedBy: status === 'approved' ? actorName || 'Finance Approver' : undefined,
            authorizedAt: status === 'approved' ? `${SYSTEM_TODAY}, Just Now` : undefined,
            sapVoucher: voucher,
          },
          ...this.decidedItems,
        ];
        this.approvalItems = this.approvalItems.filter((a) => a.sourceId !== id);
      }
    }

    this.notify();
  }
}

export const approvalStore = new ApprovalStore();

export function useApprovalStore() {
  const [claims, setClaims] = React.useState<ClaimItem[]>(approvalStore.getClaims());
  const [approvalItems, setApprovalItems] = React.useState<ApprovalItem[]>(approvalStore.getApprovalItems());
  const [decidedItems, setDecidedItems] = React.useState<ApprovalItem[]>(approvalStore.getDecidedItems());

  React.useEffect(() => {
    const unsubscribe = approvalStore.subscribe(() => {
      setClaims([...approvalStore.getClaims()]);
      setApprovalItems([...approvalStore.getApprovalItems()]);
      setDecidedItems([...approvalStore.getDecidedItems()]);
    });
    return unsubscribe;
  }, []);

  return {
    claims,
    approvalItems,
    decidedItems,
    addClaim: approvalStore.addClaim.bind(approvalStore),
    updateClaimStatus: approvalStore.updateClaimStatus.bind(approvalStore),
    addRequisitionApproval: approvalStore.addRequisitionApproval.bind(approvalStore),
    addNotesheetApproval: approvalStore.addNotesheetApproval.bind(approvalStore),
    addLeaveApproval: approvalStore.addLeaveApproval.bind(approvalStore),
    addAssetRequisitionApproval: approvalStore.addAssetRequisitionApproval.bind(approvalStore),
    syncSourceDecision: approvalStore.syncSourceDecision.bind(approvalStore),
    approveApprovalItem: approvalStore.approveApprovalItem.bind(approvalStore),
    rejectApprovalItem: approvalStore.rejectApprovalItem.bind(approvalStore),
    rejectClaim: approvalStore.rejectClaim.bind(approvalStore),
    resubmitClaim: approvalStore.resubmitClaim.bind(approvalStore),
    batchApproveItems: approvalStore.batchApproveItems.bind(approvalStore),
  };
}
