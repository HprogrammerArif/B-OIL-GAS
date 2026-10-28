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
  rejectionReason?: string;
  rejectionObservation?: string;
  rejectionImprovementNotes?: string;
  rejectedBy?: string;
  rejectedAt?: string;
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
    purpose: 'Official Field Tour — Regional Depot Audit & Customer Visits (Chittagong)',
    destination: 'Chittagong Commercial Depot',
    period: 'Oct 05 – Oct 08, 2026 (4 days)',
    amount: 40500,
    advanceTaken: 45000,
    netSettlement: -4500,
    status: 'approved',
    dateSubmitted: '11 Oct 2026',
    sapVoucher: 'SAP-TR-2026-10492',
    items: [
      { desc: 'Economy Return Airfare (Dhaka - Chittagong)', date: '05, 08 Oct', amount: 14000, category: 'Airfare' },
      { desc: 'Hotel Peninsula Chittagong (3 Nights Accommodation)', date: '05-07 Oct', amount: 18000, category: 'Accommodation' },
      { desc: 'Local Travel & Depot Transportation', date: '06-07 Oct', amount: 8500, category: 'Local Conveyance' },
    ],
  },
  {
    id: 'SPRT-2026-003',
    claimant: 'Md. Kamruzzaman',
    designation: 'Transport & Admin Supervisor',
    dept: 'Corporate Admin',
    type: 'tour_event',
    purpose: 'Annual Staff Sports & Team-Building Day (Keraniganj Ground)',
    destination: 'Keraniganj Plant Ground',
    period: 'Oct 12 – Oct 14, 2026',
    amount: 362400,
    advanceTaken: 350000,
    netSettlement: 12400,
    status: 'pending_hod',
    dateSubmitted: '16 Oct 2026',
    items: [
      { desc: 'Field Setup, Tents, Seating & Sound System', date: '12 Oct', amount: 145000, category: 'Event Setup' },
      { desc: 'Player Jerseys & Sports Kits for 8 Teams', date: '12 Oct', amount: 98400, category: 'Sports Kit' },
      { desc: 'Catering & Lunch Refreshments (350 Staff for 3 Days)', date: '12-14 Oct', amount: 119000, category: 'Catering' },
    ],
  },
  {
    id: 'TADA-2026-0419',
    claimant: 'Tanvir Ahmed',
    designation: 'Senior Sales Executive',
    dept: 'Sales & Marketing',
    type: 'tada',
    purpose: 'Dealer Network Inspection & Sales Order Audit (Chittagong)',
    destination: 'Chittagong & Sitakunda',
    period: 'Oct 10 – Oct 13, 2026 (4 days)',
    amount: 14850,
    status: 'pending_hod',
    dateSubmitted: '14 Oct 2026',
    items: [
      { desc: 'Daily Allowance (4 days @ ৳1,500/day)', date: '10-13 Oct', amount: 6000, category: 'DA' },
      { desc: 'Hotel Peninsula CTG (3 nights with GST invoice)', date: '10-12 Oct', amount: 7200, category: 'Accommodation' },
      { desc: 'Inter-district AC Bus (Dhaka - CTG - Dhaka)', date: '10, 13 Oct', amount: 1650, category: 'Travel' },
    ],
  },
  {
    id: 'CNV-2026-1002',
    claimant: 'Tanvir Ahmed',
    designation: 'Senior Sales Executive',
    dept: 'Sales & Marketing',
    type: 'conveyance',
    purpose: 'Monthly Local Client Visits — Motijheel, Tejgaon & Narayanganj',
    period: 'Oct 01 – Oct 15, 2026',
    amount: 5420,
    status: 'pending_hod',
    dateSubmitted: '15 Oct 2026',
    items: [
      { desc: 'CNG Auto: Baridhara HQ to Motijheel Commercial Area', date: '02 Oct', amount: 450, category: 'CNG' },
      { desc: 'Uber Ride: Motijheel to Tejgaon Industrial Depot', date: '04 Oct', amount: 620, category: 'Cab' },
      { desc: 'CNG Auto: Narayanganj Distribution Center', date: '08 Oct', amount: 850, category: 'CNG' },
      { desc: 'Local Transit: Various Retail Distributor Outlets', date: '11-15 Oct', amount: 3500, category: 'Conveyance' },
    ],
  },
];

const INITIAL_APPROVAL_ITEMS: ApprovalItem[] = [
  {
    id: 'APR-2026-0894',
    category: 'procurement',
    title: 'Factory Backup Power Generator Overhaul & Critical Spares',
    titleBn: 'কারখানার ব্যাকআপ বিদ্যুৎ জেনারেটর মেরামত ও যন্ত্রাংশ সংগ্রহ',
    requester: 'Engr. Md. Harunur Rashid',
    designation: 'Plant General Manager',
    dept: 'Plant Operations & Maintenance',
    amount: '৳48,50,000',
    costTk: 4850000,
    date: 'Today, 09:30 AM',
    slaHoursLeft: 6,
    urgency: 'critical',
    sapDocRef: 'SAP-PR-2026-90412',
    details: 'Urgent maintenance and replacement parts for the 1,200 kVA emergency backup generator at Keraniganj Plant to ensure 24/7 continuous factory power.',
    sourceType: 'notesheet',
    sourceId: 'f1',
  },
  {
    id: 'APR-2026-1042',
    category: 'finance',
    title: 'Sales Officer Travel Expense Claim (TA/DA) — Chittagong Depot Visit',
    titleBn: 'কর্মকর্তার ভ্রমণ ব্যয় বিল (টিএ/ডিএ) — চট্টগ্রাম ডিপো সফর',
    requester: 'Tanvir Ahmed',
    designation: 'Senior Sales Executive',
    dept: 'Sales & Marketing',
    amount: '৳14,850',
    costTk: 14850,
    date: 'Yesterday',
    slaHoursLeft: 18,
    urgency: 'normal',
    sapDocRef: 'SAP-FI-CLM-0419',
    details: '4-day dealer network visit and customer account reconciliation with verified hotel invoices and travel receipts attached.',
    sourceType: 'claim',
    sourceId: 'TADA-2026-0419',
  },
  {
    id: 'APR-2026-0312',
    category: 'fleet',
    title: 'Official Duty Pool Car Requisition — Baridhara HQ to Keraniganj Factory',
    titleBn: 'অফিসিয়াল পরিবহন বরাদ্দ — হেডকোয়ার্টার হতে প্ল্যান্ট',
    requester: 'Farida Begum',
    designation: 'CFO & Head of Finance',
    dept: 'Corporate Finance',
    amount: '৳0 (In-House Pool Car)',
    costTk: 0,
    date: 'Today, 10:15 AM',
    slaHoursLeft: 4,
    urgency: 'high',
    sapDocRef: 'VR-2026-144',
    details: 'Official pool car booking for executive site audit and monthly financial stock verification (Car: Dhaka Metro-Ga 13-4412).',
    sourceType: 'requisition',
    sourceId: 'REQ-2026-435',
  },
  {
    id: 'APR-2026-0211',
    category: 'procurement',
    title: 'Annual Office IT Cloud ERP & Business Software License Renewal',
    titleBn: 'বার্ষিক অফিস আইটি সফটওয়্যার, ইআরপি ক্লাউড ও সাইবার নিরাপত্তা নবায়ন',
    requester: 'S. M. Mahbubur Rahman',
    designation: 'Head of IT & Digital Systems',
    dept: 'Information Technology',
    amount: '৳18,50,000',
    costTk: 1850000,
    date: '14 Oct 2026',
    slaHoursLeft: 22,
    urgency: 'high',
    sapDocRef: 'SAP-IT-LIC-0211',
    details: 'Annual enterprise license renewal for corporate SAP S/4HANA cloud, employee email system, and automated database backups for 750 staff.',
    sourceType: 'notesheet',
    sourceId: 'f2',
  },
  {
    id: 'APR-2026-0744',
    category: 'leave',
    title: 'Medical Sick Leave Application — Post-Surgery Recovery (5 Days)',
    titleBn: 'চিকিৎসাজনিত ছুটির আবেদন — অপারেশন পরবর্তী বিশ্রাম (৫ দিন)',
    requester: 'Md. Rahim Uddin',
    designation: 'Senior Accounts Executive',
    dept: 'Finance & Accounts',
    amount: '5 Days Leave',
    costTk: 0,
    date: 'Today, 08:45 AM',
    slaHoursLeft: 42,
    urgency: 'normal',
    sapDocRef: 'SAP-HCM-LV-089',
    details: 'Official medical certificate from Evercare Hospital Dhaka attached. Daily accounting duty handover completed with Farzana Akhter.',
    sourceType: 'generic',
  },
  {
    id: 'APR-2026-0518',
    category: 'procurement',
    title: 'Quarterly Head Office Stationery, Paper & Laser Printer Toners',
    titleBn: 'হেড অফিসের ত্রৈমাসিক স্টেশনারি ও প্রিন্টার সামগ্রী ক্রয়',
    requester: 'Md. Kamruzzaman',
    designation: 'Admin Supervisor',
    dept: 'Corporate Admin',
    amount: '৳85,000',
    costTk: 85000,
    date: 'Today, 11:30 AM',
    slaHoursLeft: 12,
    urgency: 'normal',
    sapDocRef: 'SAP-MM-PO-0518',
    details: 'Supply of A4 printing paper (150 reams), official envelopes, and laser printer toner cartridges for Q4 administrative operations.',
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

  // 5. Reject an Item in the Omni-Approval Queue with formal inquiry observation
  rejectApprovalItem(
    itemId: string,
    reasonCategory?: string,
    observation?: string,
    improvementsRequired?: string,
    reviewer?: string
  ) {
    const item = this.approvalItems.find((a) => a.id === itemId);
    const timestamp = 'Today, Just Now';
    const reviewerName = reviewer || 'Executive Approver';

    if (item && item.sourceType === 'claim' && item.sourceId) {
      this.claims = this.claims.map((c) => {
        if (c.id === item.sourceId) {
          return {
            ...c,
            status: 'rejected',
            rejectionReason: reasonCategory || 'Observation Query Raised',
            rejectionObservation: observation || 'Audit inspection required additional documentation.',
            rejectionImprovementNotes: improvementsRequired || 'Please revise and attach verified tax invoices.',
            rejectedBy: reviewerName,
            rejectedAt: timestamp,
          };
        }
        return c;
      });
    }

    this.approvalItems = this.approvalItems.filter((a) => a.id !== itemId);
    this.notify();
  }

  // 6. Direct Claim Rejection with Observation & Improvement Guidance
  rejectClaim(
    id: string,
    reasonCategory: string,
    observation: string,
    improvementsRequired: string,
    reviewer?: string
  ) {
    const timestamp = 'Today, Just Now';
    const reviewerName = reviewer || 'Department Head / Approver';

    this.claims = this.claims.map((c) => {
      if (c.id === id) {
        return {
          ...c,
          status: 'rejected',
          rejectionReason: reasonCategory,
          rejectionObservation: observation,
          rejectionImprovementNotes: improvementsRequired,
          rejectedBy: reviewerName,
          rejectedAt: timestamp,
        };
      }
      return c;
    });

    this.approvalItems = this.approvalItems.filter((a) => a.sourceId !== id);
    this.notify();
  }

  // 7. Resubmit a Returned Claim with revisions
  resubmitClaim(id: string, revisionNotes?: string) {
    this.claims = this.claims.map((c) => {
      if (c.id === id) {
        return {
          ...c,
          status: 'pending_hod',
          rejectionReason: undefined,
          rejectionObservation: undefined,
          rejectionImprovementNotes: undefined,
        };
      }
      return c;
    });

    const updatedClaim = this.claims.find((c) => c.id === id);
    if (updatedClaim) {
      this.approvalItems = [
        {
          id: `APR-${updatedClaim.id}`,
          category: 'finance',
          title: `${updatedClaim.type.toUpperCase()} Claim (Resubmitted) — ${updatedClaim.purpose}`,
          titleBn: `${updatedClaim.purpose} (সংশোধিত দাখিল)`,
          requester: updatedClaim.claimant,
          designation: updatedClaim.designation,
          dept: updatedClaim.dept,
          amount: `৳${updatedClaim.amount.toLocaleString()}`,
          costTk: updatedClaim.amount,
          date: 'Today, Resubmitted',
          slaHoursLeft: 24,
          urgency: 'high',
          sapDocRef: `SAP-FI-${updatedClaim.id}`,
          details: `Corrected claim resubmitted with requested revisions: ${revisionNotes || 'All required VAT receipts and tax vouchers attached'}. Ready for re-audit.`,
          sourceType: 'claim',
          sourceId: updatedClaim.id,
        },
        ...this.approvalItems,
      ];
    }

    this.notify();
  }

  // 8. Batch Approve selected Items in the Omni-Approval Queue
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

  // 9. Direct Claim Status Updater (from ClaimsView)
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
    rejectClaim: approvalStore.rejectClaim.bind(approvalStore),
    resubmitClaim: approvalStore.resubmitClaim.bind(approvalStore),
    batchApproveItems: approvalStore.batchApproveItems.bind(approvalStore),
  };
}
