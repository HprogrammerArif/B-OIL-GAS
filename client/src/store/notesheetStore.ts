import { useState, useEffect } from 'react';
import { AppRole, SYSTEM_TODAY } from '../types';
import type { SignatoryStep } from '../components/notesheet/InitiateNotesheetModal';

export interface NoteItem {
  id: number;
  para: number;
  author: string;
  role: string;
  dept: string;
  date: string;
  body: string;
  status: 'approved' | 'forwarded' | 'pending';
  hash?: string;
  isChairman?: boolean;
}

export interface VendorQuoteItem {
  vendor: string;
  origin: string;
  deliveryTime: string;
  warranty: string;
  priceText: string;
  isRecommended: boolean;
  remarks: string;
}

export interface BudgetSummaryInfo {
  budgetHead: string;
  accountCode: string;
  annualAllocation: string;
  availableBalance: string;
  thisProposalAmount: string;
  purchaseOrderRef: string;
}

export interface NoteFile {
  id: string;
  fileNo: string;
  title: string;
  dept: string;
  amount: string;
  urgency: 'urgent' | 'high' | 'normal';
  status: 'pending_chairman' | 'approved' | 'in_review' | 'pending_approval';
  date: string;
  sapRef: string;
  initiatorName?: string;
  initiatorRole?: string;
  initiatorDept?: string;
  finalApproverRole?: AppRole;
  signatoryRoute?: SignatoryStep[];
  notes: NoteItem[];
  quotations: VendorQuoteItem[];
  budgetInfo: BudgetSummaryInfo;
}

const makeStampCode = (prefix = 'VERIFIED-SIGN') =>
  `${prefix}-${Math.random().toString(16).slice(2, 10).toUpperCase()}-${Date.now().toString().slice(-4)}`;

const INITIAL_NOTE_FILES: NoteFile[] = [
  {
    id: 'f1',
    fileNo: 'BOGCL/PLANT/2026/0894',
    title: 'Backup Power Generator Maintenance & Spare Parts Purchase',
    dept: 'Plant Operations',
    amount: '৳48,50,000',
    urgency: 'urgent',
    status: 'pending_chairman',
    date: '27 Oct 2026',
    sapRef: 'REF-PR-2026-90412',
    initiatorName: 'Engr. Tariqul Islam',
    initiatorRole: 'Senior Plant Maintenance Engineer',
    initiatorDept: 'Keraniganj Plant Operations',
    finalApproverRole: 'chairman',
    signatoryRoute: [
      {
        id: 's1',
        roleId: 'plant_gm',
        roleName: 'Plant General Manager',
        roleNameBn: 'প্ল্যান্ট জেনারেল ম্যানেজার',
        officerName: 'Engr. Md. Harunur Rashid',
        dept: 'Plant Operations',
        avatarColor: '#0369A1',
        initials: 'HR',
        status: 'signed',
        signedAt: '27 Oct 2026, 02:45 PM',
        hash: 'VERIFIED-SIGN-HR-2026-8841',
      },
      {
        id: 's2',
        roleId: 'hod',
        roleName: 'Head of Finance & Approver',
        roleNameBn: 'প্রধান অর্থ কর্মকর্তা',
        officerName: 'Farida Begum',
        dept: 'Finance & Accounts',
        avatarColor: '#7C3AED',
        initials: 'FB',
        status: 'signed',
        signedAt: '28 Oct 2026, 11:15 AM',
        hash: 'VERIFIED-SIGN-FB-2026-9102',
      },
      {
        id: 's3',
        roleId: 'chairman',
        roleName: 'Chairman & Managing Director',
        roleNameBn: 'চেয়ারম্যান ও ব্যবস্থাপনা পরিচালক',
        officerName: 'Ahmed Akbar Sobhan',
        dept: "Chairman's Office",
        avatarColor: '#A51C30',
        initials: 'AAS',
        status: 'pending',
      },
    ],
    notes: [
      {
        id: 1,
        para: 1,
        author: 'Engr. Tariqul Islam',
        role: 'Senior Plant Maintenance Engineer',
        dept: 'Keraniganj Plant Operations',
        date: '27 Oct 2026, 09:30 AM',
        body: 'Submitted for kind review and approval. We need urgent servicing and genuine replacement parts for the main 1,200 kVA backup power generator at Keraniganj Plant. Keeping this backup generator healthy ensures uninterrupted 24/7 factory electricity and prevents costly production stops during power cuts.',
        status: 'approved',
        hash: 'VERIFIED-SIGN-TI-2026-7710',
      },
      {
        id: 2,
        para: 2,
        author: 'Engr. Md. Harunur Rashid',
        role: 'Plant General Manager',
        dept: 'Plant Operations',
        date: '27 Oct 2026, 02:45 PM',
        body: 'Recommended for approval. Our monthly inspection found worn cooling water pumps and seals on the generator. We collected 3 competitive quotes from authorized suppliers. Energypac Power offered the best price at ৳48,50,000 including genuine parts, full installation, and a 1-year on-site warranty.',
        status: 'approved',
        hash: 'VERIFIED-SIGN-HR-2026-8841',
      },
      {
        id: 3,
        para: 3,
        author: 'Farida Begum',
        role: 'Head of Finance & Approver',
        dept: 'Finance & Accounts',
        date: '28 Oct 2026, 11:15 AM',
        body: 'Budget verified. Sufficient funds are available under the Annual Factory Maintenance Budget (Account 4102-KER). Applicable VAT and tax deductions have been checked. Recommended for final approval by the Honourable Chairman.',
        status: 'approved',
        hash: 'VERIFIED-SIGN-FB-2026-9102',
      },
    ],
    quotations: [
      {
        vendor: 'Energypac Power Generation Ltd.',
        origin: 'Authorized Cummins Partner (Genuine Parts)',
        deliveryTime: '7 Working Days',
        warranty: '12 Months Full On-Site Warranty',
        priceText: '৳48,50,000',
        isRecommended: true,
        remarks: 'Lowest price with genuine parts & free installation.',
      },
      {
        vendor: 'Rahimafrooz Industrial Power',
        origin: 'Authorized Distributor',
        deliveryTime: '14 Working Days',
        warranty: '12 Months Parts Only',
        priceText: '৳51,80,000',
        isRecommended: false,
        remarks: 'Higher price and 2-week waiting period.',
      },
      {
        vendor: 'Bengal Diesel & Engineering Services',
        origin: 'Local Importer',
        deliveryTime: '10 Working Days',
        warranty: '6 Months Service Warranty',
        priceText: '৳50,20,000',
        isRecommended: false,
        remarks: 'Shorter warranty coverage.',
      },
    ],
    budgetInfo: {
      budgetHead: 'Factory Equipment Maintenance',
      accountCode: 'ACC-4102-KER',
      annualAllocation: '৳2,50,00,000',
      availableBalance: '৳1,42,00,000',
      thisProposalAmount: '৳48,50,000',
      purchaseOrderRef: 'PO-2026-90412',
    },
  },
  {
    id: 'f4',
    fileNo: 'BOGCL/ADMIN/2026/0518',
    title: 'Quarterly Head Office Printing Paper, Stationery & Toner Purchase',
    dept: 'Transport & Logistics',
    amount: '৳85,000',
    urgency: 'normal',
    status: 'pending_approval',
    date: '29 Oct 2026',
    sapRef: 'REF-PO-2026-0518',
    initiatorName: 'Md. Kamruzzaman',
    initiatorRole: 'Transport & Admin Supervisor',
    initiatorDept: 'Admin & Transport Division',
    finalApproverRole: 'hod',
    signatoryRoute: [
      {
        id: 's1',
        roleId: 'hr_admin',
        roleName: 'GM, HR & Administration',
        roleNameBn: 'মহাব্যবস্থাপক, মানবসম্পদ ও প্রশাসন',
        officerName: 'Sayeda Afroza Sultana',
        dept: 'Human Resources',
        avatarColor: '#BE185D',
        initials: 'SAS',
        status: 'signed',
        signedAt: '29 Oct 2026, 11:15 AM',
        hash: 'VERIFIED-SIGN-SAS-2026-5518',
      },
      {
        id: 's2',
        roleId: 'hod',
        roleName: 'Head of Finance & Approver',
        roleNameBn: 'প্রধান অর্থ কর্মকর্তা',
        officerName: 'Farida Begum',
        dept: 'Finance & Accounts',
        avatarColor: '#7C3AED',
        initials: 'FB',
        status: 'pending',
      },
    ],
    notes: [
      {
        id: 1,
        para: 1,
        author: 'Md. Kamruzzaman',
        role: 'Transport & Admin Supervisor',
        dept: 'Admin & Transport Division',
        date: '29 Oct 2026, 10:30 AM',
        body: 'Submitted for approval to purchase Q4 office supplies for Head Office departments: 150 reams of A4 printing paper, official envelopes, file folders, and 18 laser printer toner cartridges. Three supplier quotes were collected and Prime Office Supplies offered the lowest price at ৳85,000.',
        status: 'approved',
        hash: 'VERIFIED-SIGN-KZ-2026-5510',
      },
      {
        id: 2,
        para: 2,
        author: 'Sayeda Afroza Sultana',
        role: 'GM, HR & Administration',
        dept: 'Human Resources',
        date: '29 Oct 2026, 11:15 AM',
        body: 'Quantities checked against current store room stock and approved for 5 Head Office floors. Forwarded to Head of Finance for final payment approval.',
        status: 'approved',
        hash: 'VERIFIED-SIGN-SAS-2026-5518',
      },
    ],
    quotations: [
      {
        vendor: 'Prime Office Supplies & Paper Mart',
        origin: 'Bashundhara Approved Supplier',
        deliveryTime: '2 Working Days',
        warranty: 'Original HP/Canon Sealed Cartridges',
        priceText: '৳85,000',
        isRecommended: true,
        remarks: 'Lowest total cost with free delivery to Head Office.',
      },
      {
        vendor: 'Motijheel Corporate Stationery House',
        origin: 'Wholesale Vendor',
        deliveryTime: '3 Working Days',
        warranty: 'Standard Replacement Guarantee',
        priceText: '৳91,500',
        isRecommended: false,
        remarks: '7.6% higher than lowest quote.',
      },
      {
        vendor: 'Dhaka Tech & Toner World',
        origin: 'Retail Supplier',
        deliveryTime: '2 Working Days',
        warranty: 'Original Cartridges',
        priceText: '৳94,200',
        isRecommended: false,
        remarks: 'Higher paper unit rate.',
      },
    ],
    budgetInfo: {
      budgetHead: 'Office Administration & Stationery',
      accountCode: 'ACC-5104-HQ',
      annualAllocation: '৳6,00,000',
      availableBalance: '৳2,45,000',
      thisProposalAmount: '৳85,000',
      purchaseOrderRef: 'PO-2026-0518',
    },
  },
  {
    id: 'f2',
    fileNo: 'BOGCL/IT/2026/0211',
    title: 'Annual Office Software, Email & Cloud Backup Renewal (2026–2027)',
    dept: 'Finance & Accounts',
    amount: '৳18,50,000',
    urgency: 'high',
    status: 'approved',
    date: '22 Oct 2026',
    sapRef: 'REF-IT-2026-0211',
    initiatorName: 'Farida Begum',
    initiatorRole: 'Head of Finance & Approver',
    initiatorDept: 'Finance & Accounts',
    finalApproverRole: 'hod',
    signatoryRoute: [
      {
        id: 's1',
        roleId: 'hod',
        roleName: 'Head of Finance & Approver',
        roleNameBn: 'প্রধান অর্থ কর্মকর্তা',
        officerName: 'Farida Begum',
        dept: 'Finance & Accounts',
        avatarColor: '#7C3AED',
        initials: 'FB',
        status: 'signed',
        signedAt: '22 Oct 2026, 04:15 PM',
        hash: 'VERIFIED-SIGN-FB-2026-4412',
      },
    ],
    notes: [
      {
        id: 1,
        para: 1,
        author: 'Farida Begum',
        role: 'Head of Finance & Approver',
        dept: 'Finance & Accounts',
        date: '22 Oct 2026, 04:15 PM',
        body: 'Approved under departmental budget authority. Covers the 12-month renewal for company accounting software, staff business email accounts, and daily cloud backup protection across Head Office and Keraniganj Plant. An 8% annual renewal discount was negotiated.',
        status: 'approved',
        hash: 'VERIFIED-SIGN-FB-2026-4412',
      },
    ],
    quotations: [
      {
        vendor: 'Aamra Enterprise Cloud Solutions',
        origin: 'Official Local Licensing Partner',
        deliveryTime: 'Instant License Activation',
        warranty: '24/7 Local Support SLA',
        priceText: '৳18,50,000',
        isRecommended: true,
        remarks: 'Includes 8% loyalty discount and free daily cloud backup.',
      },
      {
        vendor: 'DataSoft Business Systems Ltd.',
        origin: 'Enterprise Reseller',
        deliveryTime: '3 Working Days',
        warranty: 'Business Hours Support',
        priceText: '৳19,90,000',
        isRecommended: false,
        remarks: 'Excludes automated backup storage.',
      },
      {
        vendor: 'Flora Telecom & IT Services',
        origin: 'Authorized Partner',
        deliveryTime: '5 Working Days',
        warranty: 'Standard Annual Support',
        priceText: '৳20,40,000',
        isRecommended: false,
        remarks: 'Higher annual support fee.',
      },
    ],
    budgetInfo: {
      budgetHead: 'Office IT & Software Subscriptions',
      accountCode: 'ACC-5201-HQ',
      annualAllocation: '৳45,00,000',
      availableBalance: '৳26,50,000',
      thisProposalAmount: '৳18,50,000',
      purchaseOrderRef: 'PO-2026-0211',
    },
  },
  {
    id: 'f3',
    fileNo: 'BOGCL/HR/2026/0342',
    title: 'Annual Plant Shift Staff & Driver Salary Increment Policy',
    dept: 'Human Resources',
    amount: 'Approved HR Policy',
    urgency: 'normal',
    status: 'approved',
    date: '18 Oct 2026',
    sapRef: 'REF-HR-2026-0342',
    initiatorName: 'Sayeda Afroza Sultana',
    initiatorRole: 'GM, HR & Administration',
    initiatorDept: 'Human Resources',
    finalApproverRole: 'hr_admin',
    signatoryRoute: [
      {
        id: 's1',
        roleId: 'hr_admin',
        roleName: 'GM, HR & Administration',
        roleNameBn: 'মহাব্যবস্থাপক, মানবসম্পদ ও প্রশাসন',
        officerName: 'Sayeda Afroza Sultana',
        dept: 'Human Resources',
        avatarColor: '#BE185D',
        initials: 'SAS',
        status: 'signed',
        signedAt: '18 Oct 2026, 03:20 PM',
        hash: 'VERIFIED-SIGN-SAS-2026-3342',
      },
    ],
    notes: [
      {
        id: 1,
        para: 1,
        author: 'Sayeda Afroza Sultana',
        role: 'GM, HR & Administration',
        dept: 'Human Resources',
        date: '18 Oct 2026, 03:20 PM',
        body: 'Approved annual performance-based salary increment policy covering plant shift technicians, operators, company drivers, and support staff. All adjustments are within the approved 2026–2027 annual payroll budget.',
        status: 'approved',
        hash: 'VERIFIED-SIGN-SAS-2026-3342',
      },
    ],
    quotations: [
      {
        vendor: 'Option A — 8% Merit + Attendance Bonus (Approved)',
        origin: 'Internal HR Compensation Review',
        deliveryTime: 'Effective 01 Nov 2026 Payroll',
        warranty: '100% Within Approved Payroll Budget',
        priceText: '8% Avg. Increment',
        isRecommended: true,
        remarks: 'Rewards punctual shift attendance and strong safety record.',
      },
      {
        vendor: 'Option B — Flat 7% Across-the-Board',
        origin: 'Alternative HR Proposal',
        deliveryTime: 'Effective 01 Nov 2026 Payroll',
        warranty: 'Standard Payroll Allocation',
        priceText: '7% Flat Increment',
        isRecommended: false,
        remarks: 'Does not reward top performers or shift attendance.',
      },
    ],
    budgetInfo: {
      budgetHead: 'Annual Staff Payroll & Welfare',
      accountCode: 'ACC-3100-GRP',
      annualAllocation: 'Approved FY 2026–27 Payroll',
      availableBalance: '100% Provisioned',
      thisProposalAmount: 'Policy Circular',
      purchaseOrderRef: 'HR-CIR-2026-0342',
    },
  },
];

class NotesheetStore {
  private files: NoteFile[] = [...INITIAL_NOTE_FILES];
  private listeners: Set<() => void> = new Set();

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  getFiles(): NoteFile[] {
    return this.files;
  }

  getFileByIdOrNo(idOrFileNo: string): NoteFile | undefined {
    return this.files.find((f) => f.id === idOrFileNo || f.fileNo === idOrFileNo);
  }

  addFile(file: NoteFile) {
    this.files = [file, ...this.files];
    this.notify();
  }

  appendNote(
    fileId: string,
    note: Omit<NoteItem, 'id' | 'para'>,
    nextStatus?: NoteFile['status']
  ) {
    this.files = this.files.map((f) => {
      if (f.id !== fileId && f.fileNo !== fileId) return f;
      const newNote: NoteItem = {
        ...note,
        id: f.notes.length + 1,
        para: f.notes.length + 1,
      };
      return {
        ...f,
        status: nextStatus || f.status,
        notes: [...f.notes, newNote],
      };
    });
    this.notify();
  }

  approveFile(params: {
    fileIdOrNo: string;
    actorName: string;
    actorRoleTitle: string;
    actorDept: string;
    actorRole: AppRole;
    remark?: string;
    stampCode?: string;
  }) {
    const code = params.stampCode || makeStampCode('APPROVED');
    this.files = this.files.map((f) => {
      if (f.id !== params.fileIdOrNo && f.fileNo !== params.fileIdOrNo) return f;
      if (f.status === 'approved') return f;

      const updatedRoute = f.signatoryRoute?.map((s) =>
        s.roleId === params.actorRole || s.status === 'pending'
          ? { ...s, status: 'signed' as const, signedAt: `${SYSTEM_TODAY}, Just Now`, hash: code }
          : s
      );

      const approvalNote: NoteItem = {
        id: f.notes.length + 1,
        para: f.notes.length + 1,
        author: params.actorName,
        role: params.actorRoleTitle,
        dept: params.actorDept,
        date: `${SYSTEM_TODAY}, Just Now`,
        body:
          params.remark ||
          'Proposal reviewed and officially approved. Concerned department may proceed as per company rules.',
        status: 'approved',
        hash: code,
        isChairman: params.actorRole === 'chairman',
      };

      return {
        ...f,
        status: 'approved',
        signatoryRoute: updatedRoute,
        notes: [...f.notes, approvalNote],
      };
    });
    this.notify();
  }

  returnFileForRevision(params: {
    fileIdOrNo: string;
    actorName: string;
    actorRoleTitle: string;
    actorDept: string;
    actorRole: AppRole;
    reasonCategory: string;
    observation: string;
    improvementsRequired: string;
  }) {
    const code = makeStampCode('RETURNED');
    this.files = this.files.map((f) => {
      if (f.id !== params.fileIdOrNo && f.fileNo !== params.fileIdOrNo) return f;
      const returnNote: NoteItem = {
        id: f.notes.length + 1,
        para: f.notes.length + 1,
        author: params.actorName,
        role: params.actorRoleTitle,
        dept: params.actorDept,
        date: `${SYSTEM_TODAY}, Just Now`,
        body: `[Returned for Correction]: ${params.reasonCategory}\n• Observation: ${params.observation}\n• Requested Changes: ${params.improvementsRequired}`,
        status: 'pending',
        hash: code,
        isChairman: params.actorRole === 'chairman',
      };
      return {
        ...f,
        status: 'in_review',
        notes: [...f.notes, returnNote],
      };
    });
    this.notify();
  }
}

export const notesheetStore = new NotesheetStore();

export function useNotesheetStore() {
  const [files, setFiles] = useState<NoteFile[]>(notesheetStore.getFiles());

  useEffect(() => {
    return notesheetStore.subscribe(() => {
      setFiles([...notesheetStore.getFiles()]);
    });
  }, []);

  return {
    files,
    addFile: notesheetStore.addFile.bind(notesheetStore),
    appendNote: notesheetStore.appendNote.bind(notesheetStore),
    approveFile: notesheetStore.approveFile.bind(notesheetStore),
    returnFileForRevision: notesheetStore.returnFileForRevision.bind(notesheetStore),
  };
}

