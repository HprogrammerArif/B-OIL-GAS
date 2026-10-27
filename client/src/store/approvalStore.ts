import React from 'react';
import { ClaimSubmissionData } from '../components/claims/SubmitClaimModal';

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
  sourceType?: 'claim' | 'requisition' | 'notesheet' | 'generic';
  sourceId?: string;
}

const INITIAL_CLAIMS: ClaimItem[] = [
  {
    id: 'TOUR-2026-008',
    claimant: 'Engr. Md. Harunur Rashid',
    designation: 'Plant General Manager',
    dept: 'Keraniganj Refinery',
    type: 'tour_event',
    purpose: 'Chittagong Coastal Oil Terminal Turnaround Delegation Tour & Jetty Audit',
    destination: 'Patenga Terminal & BIWTA Jetty',
    period: 'Oct 05 – Oct 08, 2026 (4 days)',
    amount: 114500,
    advanceTaken: 120000,
    netSettlement: -5500,
    status: 'approved',
    dateSubmitted: '11 Oct 2026',
    sapVoucher: 'SAP-TR-2026-10492',
    items: [
      { desc: 'Official Technical Delegation Airfare (4 Engineers)', date: '05, 08 Oct', amount: 56000, category: 'Airfare' },
      { desc: 'Port Area Hotel Agrabad (3 Rooms, 3 Nights)', date: '05-07 Oct', amount: 38500, category: 'Accommodation' },
      { desc: 'Local Speedboat & River Jetty Inspection Logistics', date: '06-07 Oct', amount: 20000, category: 'River Logistics' },
    ],
  },
  {
    id: 'SPRT-2026-003',
    claimant: 'Md. Kamruzzaman',
    designation: 'Transport & Admin Supervisor',
    dept: 'Admin & Transport',
    type: 'tour_event',
    purpose: 'BOGCL Annual Inter-Plant Sports & Cricket Tournament (Keraniganj Ground)',
    destination: 'Keraniganj Refinery Ground',
    period: 'Oct 12 – Oct 14, 2026',
    amount: 362400,
    advanceTaken: 350000,
    netSettlement: 12400,
    status: 'pending_hod',
    dateSubmitted: '16 Oct 2026',
    items: [
      { desc: 'Refinery Ground Preparation, Tents & Sound System', date: '12 Oct', amount: 145000, category: 'Event Setup' },
      { desc: 'Player Jerseys & Sports Equipment for 8 Plant Teams', date: '12 Oct', amount: 98400, category: 'Sports Kit' },
      { desc: 'Player Catering & Refreshment (350 Staff for 3 Days)', date: '12-14 Oct', amount: 119000, category: 'Catering' },
    ],
  },
  {
    id: 'TADA-2026-0419',
    claimant: 'Tanvir Ahmed',
    designation: 'Sales Officer, Grade 8',
    dept: 'Sales & Distribution',
    type: 'tada',
    purpose: 'Chittagong Depot Dealer Network Inspection & Quality Audit',
    destination: 'Chittagong & Sitakunda',
    period: 'Oct 10 – Oct 13, 2026 (4 days)',
    amount: 14850,
    status: 'pending_hod',
    dateSubmitted: '14 Oct 2026',
    items: [
      { desc: 'Daily Allowance (4 days @ ৳1,500/day)', date: '10-13 Oct', amount: 6000, category: 'DA' },
      { desc: 'Hotel Peninsula CTG (3 nights with GST invoice)', date: '10-12 Oct', amount: 7200, category: 'Accommodation' },
      { desc: 'Inter-district AC Bus (Dhaka-CTG-Dhaka)', date: '10, 13 Oct', amount: 1650, category: 'Travel' },
    ],
  },
  {
    id: 'CNV-2026-1002',
    claimant: 'Tanvir Ahmed',
    designation: 'Sales Officer, Grade 8',
    dept: 'Sales & Distribution',
    type: 'conveyance',
    purpose: 'Local Client Visits — Motijheel, Tejgaon & Narayanganj Outlets',
    period: 'Oct 01 – Oct 15, 2026',
    amount: 5420,
    status: 'pending_hod',
    dateSubmitted: '15 Oct 2026',
    items: [
      { desc: 'CNG Auto: Baridhara HQ to Motijheel Sonali Bank', date: '02 Oct', amount: 450, category: 'CNG' },
      { desc: 'Uber Ride: Motijheel to Tejgaon Dealer Depot', date: '04 Oct', amount: 620, category: 'Cab' },
      { desc: 'CNG Auto: Narayanganj Asphalt Stockyard Audit', date: '08 Oct', amount: 850, category: 'CNG' },
      { desc: 'Local Transit: Various Distributor Outlets', date: '11-15 Oct', amount: 3500, category: 'Conveyance' },
    ],
  },
];

const INITIAL_APPROVAL_ITEMS: ApprovalItem[] = [
  {
    id: 'APR-2026-0894',
    category: 'procurement',
    title: 'Emergency Bitumen Reactor Safety Relief Valves (Class 600)',
    titleBn: 'জরুরি বিটুমিন রিঅ্যাক্টর সেফটি রিলিফ ভালভ সংগ্রহ',
    requester: 'Engr. Tariq Ahmed',
    designation: 'Senior Plant Maintenance Lead',
    dept: 'Plant Maintenance',
    amount: '৳48,50,000',
    costTk: 4850000,
    date: 'Today, 09:30 AM',
    slaHoursLeft: 6,
    urgency: 'critical',
    sapDocRef: 'SAP-PR-2026-90412',
    details: '4 units of High-Pressure Relief Valves required to avert plant shutdown prior to peak asphalt paving season.',
    sourceType: 'notesheet',
    sourceId: 'f1',
  },
  {
    id: 'APR-2026-1042',
    category: 'finance',
    title: 'TA/DA Tour Claim — Chittagong Depot & Patenga Marine Terminal',
    titleBn: 'টিএ/ডিএ ভ্রমণ বিল — চট্টগ্রাম ডিপো ও পতেঙ্গা টার্মিনাল',
    requester: 'Tanvir Ahmed',
    designation: 'Sr. Sales & Distribution Specialist',
    dept: 'Sales & Distribution',
    amount: '৳14,850',
    costTk: 14850,
    date: 'Yesterday',
    slaHoursLeft: 18,
    urgency: 'normal',
    sapDocRef: 'SAP-FI-CLM-0419',
    details: '4-day dealer quality network inspection and bulk asphalt delivery reconciliation with Peninsula hotel invoices.',
    sourceType: 'claim',
    sourceId: 'TADA-2026-0419',
  },
  {
    id: 'APR-2026-0312',
    category: 'fleet',
    title: 'Heavy Duty Pool Car Booking — Baridhara HQ to Keraniganj Plant',
    titleBn: 'অফিসিয়াল পরিবহন বরাদ্দ — হেডকোয়ার্টার হতে প্ল্যান্ট',
    requester: 'Engr. Md. Harunur Rashid',
    designation: 'Plant General Manager',
    dept: 'Plant Operations',
    amount: '৳0 (In-House Fleet)',
    costTk: 0,
    date: 'Today, 10:15 AM',
    slaHoursLeft: 3,
    urgency: 'critical',
    sapDocRef: 'VR-2026-144',
    details: 'Round-trip inspection with French technical delegates from Axens for Euro-V Base Oil project site inspection.',
    sourceType: 'requisition',
    sourceId: 'REQ-2026-435',
  },
  {
    id: 'APR-2026-0211',
    category: 'finance',
    title: 'Q4 Natural Gas Industrial Steam Co-Generation Tariff Adjustment',
    titleBn: 'চতুর্থ ত্রৈমাসিক প্রাকৃতিক গ্যাস ইউটিলিটি ট্যারিফ সমন্বয়',
    requester: 'Farida Begum',
    designation: 'CFO & Head of Finance',
    dept: 'Corporate Finance',
    amount: '৳1,20,00,000',
    costTk: 12000000,
    date: '14 Oct 2026',
    slaHoursLeft: 22,
    urgency: 'high',
    sapDocRef: 'SAP-FI-BUD-0211',
    details: 'Refinery steam boiler natural gas tariff recalculation as gazetted by BERC.',
    sourceType: 'generic',
  },
  {
    id: 'APR-2026-0744',
    category: 'leave',
    title: 'Medical Sick Leave — Post-Surgical Recovery (5 Days)',
    titleBn: 'চিকিৎসাজনিত ছুটি — অপারেশন পরবর্তী বিশ্রাম (৫ দিন)',
    requester: 'Rahim Uddin',
    designation: 'Boiler Instrumentation Tech',
    dept: 'Refinery Utilities',
    amount: 'N/A',
    costTk: 0,
    date: 'Today, 08:45 AM',
    slaHoursLeft: 42,
    urgency: 'normal',
    sapDocRef: 'SAP-HCM-LV-089',
    details: 'Official medical certificate from Apollo/Evercare Hospital attached. Shift cover arranged with Kamrul Hasan.',
    sourceType: 'generic',
  },
];

class ApprovalStore {
  private claims: ClaimItem[] = [...INITIAL_CLAIMS];
  private approvalItems: ApprovalItem[] = [...INITIAL_APPROVAL_ITEMS];
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

  // 1. Submit a Claim and dynamically mirror it into the Approvals Queue
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

    // Automatically create a dynamic ApprovalItem in the Omni-Approval Queue
    const newApprovalItem: ApprovalItem = {
      id: `APR-${data.id}`,
      category: 'finance',
      title: `${data.type.toUpperCase()} Claim — ${data.purpose}`,
      titleBn: `${data.purpose}`,
      requester: data.claimant,
      designation: data.designation,
      dept: data.dept,
      amount: `৳${data.amount.toLocaleString()}`,
      costTk: data.amount,
      date: 'Today, Just Now',
      slaHoursLeft: 24,
      urgency: data.amount > 50000 ? 'critical' : 'normal',
      sapDocRef: `SAP-FI-${data.id}`,
      details: `${data.period}. Submitted through BOGCL OneOps Claim Studio. Ready for HOD / CFO authorization.`,
      sourceType: 'claim',
      sourceId: data.id,
    };

    this.approvalItems = [newApprovalItem, ...this.approvalItems];
    this.notify();
    return newClaim;
  }

  // 2. Add an initiated Vehicle Requisition into the Approval Queue
  addRequisitionApproval(reqId: string, requester: string, dept: string, from: string, to: string, purpose: string) {
    const approvalItem: ApprovalItem = {
      id: `APR-${reqId}`,
      category: 'fleet',
      title: `Vehicle Requisition — ${from} ➔ ${to}`,
      titleBn: `অফিসিয়াল পরিবহন আবেদন — ${from} হতে ${to}`,
      requester,
      designation: 'Officer / Staff',
      dept,
      amount: '৳0 (Pool Fleet)',
      costTk: 0,
      date: 'Today, Just Now',
      slaHoursLeft: 12,
      urgency: 'high',
      sapDocRef: `SAP-VR-${reqId}`,
      details: `Official Purpose: ${purpose}. Vehicle requisition submitted for HOD endorsement before dispatch allocation.`,
      sourceType: 'requisition',
      sourceId: reqId,
    };

    this.approvalItems = [approvalItem, ...this.approvalItems];
    this.notify();
  }

  // 3. Add an initiated Note-Sheet into the Approval Queue
  addNotesheetApproval(fileNo: string, title: string, initiator: string, dept: string, amount: string) {
    const numericAmount = parseInt(amount.replace(/[^0-9]/g, ''), 10) || 0;
    const approvalItem: ApprovalItem = {
      id: `APR-NS-${Date.now().toString().slice(-4)}`,
      category: 'procurement',
      title: `E-Note Sheet Review — ${title}`,
      titleBn: `নোট-শীট পর্যালোচনা — ${title}`,
      requester: initiator,
      designation: 'Note Initiator',
      dept,
      amount,
      costTk: numericAmount,
      date: 'Today, Just Now',
      slaHoursLeft: 18,
      urgency: numericAmount > 500000 ? 'critical' : 'normal',
      sapDocRef: fileNo,
      details: `Sequential cryptographic review note routed for executive sign-off. Initiated by ${initiator} (${dept}).`,
      sourceType: 'notesheet',
      sourceId: fileNo,
    };

    this.approvalItems = [approvalItem, ...this.approvalItems];
    this.notify();
  }

  // 4. Approve an Item in the Omni-Approval Queue
  approveApprovalItem(itemId: string): { sapVoucher: string; sourceId?: string; sourceType?: string } {
    const item = this.approvalItems.find((a) => a.id === itemId);
    const generatedVoucher = `SAP-FI-2026-${Math.floor(10000 + Math.random() * 90000)}`;

    if (item && item.sourceType === 'claim' && item.sourceId) {
      this.claims = this.claims.map((c) => {
        if (c.id === item.sourceId) {
          return {
            ...c,
            status: 'approved',
            sapVoucher: generatedVoucher,
          };
        }
        return c;
      });
    }

    this.approvalItems = this.approvalItems.filter((a) => a.id !== itemId);
    this.notify();

    return {
      sapVoucher: generatedVoucher,
      sourceId: item?.sourceId,
      sourceType: item?.sourceType,
    };
  }

  // 5. Reject an Item in the Omni-Approval Queue
  rejectApprovalItem(itemId: string) {
    const item = this.approvalItems.find((a) => a.id === itemId);
    if (item && item.sourceType === 'claim' && item.sourceId) {
      this.claims = this.claims.map((c) => {
        if (c.id === item.sourceId) {
          return { ...c, status: 'rejected' };
        }
        return c;
      });
    }
    this.approvalItems = this.approvalItems.filter((a) => a.id !== itemId);
    this.notify();
  }

  // 6. Batch Approve selected Items in the Omni-Approval Queue
  batchApproveItems(itemIds: string[]): { count: number; totalCost: number; vouchers: string[] } {
    let totalCost = 0;
    const vouchers: string[] = [];

    itemIds.forEach((id) => {
      const item = this.approvalItems.find((a) => a.id === id);
      if (item) {
        totalCost += item.costTk || 0;
        const res = this.approveApprovalItem(id);
        vouchers.push(res.sapVoucher);
      }
    });

    this.notify();
    return { count: itemIds.length, totalCost, vouchers };
  }

  // 7. Direct Claim Status Updater (from ClaimsView)
  updateClaimStatus(id: string, status: ClaimItem['status'], sapVoucher?: string) {
    this.claims = this.claims.map((c) => {
      if (c.id === id) {
        return {
          ...c,
          status,
          sapVoucher: sapVoucher || (status === 'approved' ? `SAP-FI-2026-${Math.floor(10000 + Math.random() * 90000)}` : c.sapVoucher),
        };
      }
      return c;
    });

    if (status === 'approved' || status === 'rejected') {
      // Remove corresponding item from approval queue if it exists
      this.approvalItems = this.approvalItems.filter((a) => a.sourceId !== id);
    }

    this.notify();
  }
}

export const approvalStore = new ApprovalStore();

export function useApprovalStore() {
  const [claims, setClaims] = React.useState<ClaimItem[]>(approvalStore.getClaims());
  const [approvalItems, setApprovalItems] = React.useState<ApprovalItem[]>(approvalStore.getApprovalItems());

  React.useEffect(() => {
    const unsubscribe = approvalStore.subscribe(() => {
      setClaims([...approvalStore.getClaims()]);
      setApprovalItems([...approvalStore.getApprovalItems()]);
    });
    return unsubscribe;
  }, []);

  return {
    claims,
    approvalItems,
    addClaim: approvalStore.addClaim.bind(approvalStore),
    updateClaimStatus: approvalStore.updateClaimStatus.bind(approvalStore),
    addRequisitionApproval: approvalStore.addRequisitionApproval.bind(approvalStore),
    addNotesheetApproval: approvalStore.addNotesheetApproval.bind(approvalStore),
    approveApprovalItem: approvalStore.approveApprovalItem.bind(approvalStore),
    rejectApprovalItem: approvalStore.rejectApprovalItem.bind(approvalStore),
    batchApproveItems: approvalStore.batchApproveItems.bind(approvalStore),
  };
}
