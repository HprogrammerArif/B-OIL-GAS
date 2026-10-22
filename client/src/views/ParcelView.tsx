import React, { useState, useMemo } from 'react';
import { ViewProps, ROLE_META, t } from '../types';
import { showToast } from '../App';
import {
  Package, CheckCircle, Clock, MapPin, QrCode, ShieldCheck,
  AlertTriangle, ArrowRight, UserCheck, Search, Plus, Lock,
  Camera, Printer, Key, Check, Eye, Download, ShieldAlert,
  FileText, ExternalLink, RefreshCw, Inbox, Send, RotateCcw,
  Truck, ArrowUpRight, ArrowDownLeft, AlertCircle, Building,
  Hash, Shield, User, Filter, CheckSquare, X, Phone, MessageSquare,
  Copy, Share2, Compass, Layers, CheckCircle2, ChevronRight
} from 'lucide-react';

export interface CustodyLogEntry {
  stage: number;
  stageName: string;
  stageNameBn: string;
  location: string;
  timestamp: string;
  actor: string;
  actorRole: string;
  notes?: string;
  securityHash?: string;
}

export interface ReturnDetails {
  returnTrackingNo: string;
  initiatedAt: string;
  initiatedBy: string;
  reason: 'tamper_broken' | 'damaged_contents' | 'wrong_documents' | 'recipient_refused' | 'recipient_unavailable';
  reasonText: string;
  notes: string;
  returnStage: 1 | 2 | 3; // 1: Return Initiated, 2: Return In-Transit, 3: Returned & Received by Sender
  returnOtp: string;
  resolvedAt?: string;
  courierName?: string;
}

export interface ParcelItem {
  id: string;
  trackingNo: string;
  sealNo: string;
  sender: string;
  senderDept: string;
  senderRole?: string;
  origin: string;
  receiver: string;
  receiverDept: string;
  receiverRole?: string;
  destination: string;
  contents: string;
  category: 'legal_docs' | 'qc_sample' | 'refinery_spares' | 'tender_bid' | 'it_hardware';
  weight: string;
  declaredValue: string;
  specialHandling?: string;
  urgency: 'critical' | 'high' | 'normal';
  currentStage: number; // 1 to 5
  status: 'dispatched' | 'in_transit' | 'at_gate' | 'delivered' | 'returned' | 'quarantined';
  lastUpdated: string;
  eta: string;
  corridorProgressPercent: number; // 0 to 100
  courier: {
    name: string;
    phone: string;
    vehicle: string;
    avatarInitials: string;
    currentSpeed?: string;
  };
  dispatchedBy: string;
  tamperStatus: 'secure' | 'inspected' | 'flagged';
  deliveryOtp: string;
  chainOfCustody: CustodyLogEntry[];
  returnDetails?: ReturnDetails;
}

// ─────────────────────────────────────────────────────────────────────────────
// INITIAL ENTERPRISE PARCELS SEED DATA
// ─────────────────────────────────────────────────────────────────────────────

const INITIAL_PARCELS: ParcelItem[] = [
  // ── 1. INCOMING TO TANVIR AHMED (Awaiting Verification / Gate Inward) ──
  {
    id: 'P-TA-01',
    trackingNo: 'BOGCL-WB-2026-9041',
    sealNo: 'TAMPER-SEAL #BG-99412',
    sender: 'Farida Begum (CFO)',
    senderDept: 'Corporate Finance, Dhaka HQ',
    origin: 'Bashundhara Corporate HQ, Baridhara',
    receiver: 'Tanvir Ahmed',
    receiverDept: 'Sales & Distribution, Dhaka',
    destination: 'Sales & Distribution Desk, Level 4, HQ',
    contents: 'Q3 Approved Sales Incentive Bonus Letter & Executive Performance Commission Docket',
    category: 'legal_docs',
    weight: '0.35 kg',
    declaredValue: 'Confidential / High Value',
    specialHandling: 'Tamper-Proof Secure Pouch • Do Not Bend • Biometric PIN Handover',
    urgency: 'critical',
    currentStage: 4,
    status: 'at_gate',
    lastUpdated: 'Today, 01:15 PM',
    eta: 'Ready for Pickup at Reception',
    corridorProgressPercent: 88,
    courier: {
      name: 'Rafiqul Islam',
      phone: '01711-884210',
      vehicle: 'Toyota HiAce (Dhaka Metro-Cha 11-4921)',
      avatarInitials: 'RI',
      currentSpeed: 'Arrived at Station',
    },
    dispatchedBy: 'Md. Kamruzzaman (Admin)',
    tamperStatus: 'secure',
    deliveryOtp: '7482',
    chainOfCustody: [
      {
        stage: 1,
        stageName: 'Despatch Logged',
        stageNameBn: 'ডেসপ্যাচ এন্ট্রি',
        location: 'Dhaka HQ Despatch Counter #2',
        timestamp: 'Today, 09:30 AM',
        actor: 'Md. Kamruzzaman',
        actorRole: 'Transport Supervisor',
        notes: 'Pouch sealed with tamper seal BG-99412 in presence of Finance Officer.',
        securityHash: 'sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
      },
      {
        stage: 2,
        stageName: 'Driver Handover',
        stageNameBn: 'ড্রাইভার হস্তান্তর',
        location: 'HQ Baridhara Logistics Bay',
        timestamp: 'Today, 10:15 AM',
        actor: 'Driver Rafiqul Islam (Van #BOGCL-04)',
        actorRole: 'Corporate Courier Fleet',
        notes: 'Barcoded seal scanned and verified intact.',
        securityHash: 'sha256:1a84b5c73d9e0f11a22b33c44d55e66f77a88b99c00d11e22f33a44b55c66d77',
      },
      {
        stage: 3,
        stageName: 'Transit Checkpoint',
        stageNameBn: 'ট্রানজিট চেকপয়েন্ট',
        location: 'Babubazar / Postogola Toll Transit Post',
        timestamp: 'Today, 11:45 AM',
        actor: 'Checkpoint RFID Sensor #03',
        actorRole: 'Automated Transit Gate',
        notes: 'GPS transit corridor verified within designated time window.',
        securityHash: 'sha256:3b94c8e71a2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f',
      },
      {
        stage: 4,
        stageName: 'Reception Gate Inward',
        stageNameBn: 'রিসিপশন গেট ইনওয়ার্ড',
        location: 'Dhaka HQ Reception & Mail Desk',
        timestamp: 'Today, 01:15 PM',
        actor: 'Desk Officer Zahid Hasan',
        actorRole: 'Corporate Mailroom Security',
        notes: 'Consignment arrived at recipient station. Awaiting Tanvir Ahmed OTP entry.',
        securityHash: 'sha256:9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d',
      },
    ],
  },

  // ── 2. OUTBOUND SENT BY TANVIR AHMED (In-Transit to Keraniganj) ──
  {
    id: 'P-TA-05',
    trackingNo: 'BOGCL-WB-2026-9055',
    sealNo: 'TAMPER-SEAL #BG-99430',
    sender: 'Tanvir Ahmed',
    senderDept: 'Sales & Distribution, Dhaka',
    origin: 'Bashundhara Corporate HQ, Baridhara',
    receiver: 'Engr. Md. Harunur Rashid (Plant GM)',
    receiverDept: 'Plant General Management',
    destination: 'Keraniganj Bitumen Refinery Complex',
    contents: 'Counter-signed Roads & Highways Dept (RHD) BDT 14.5 Crore Bulk Bitumen Supply Contract & Original Bank Guarantee Copies',
    category: 'legal_docs',
    weight: '0.65 kg',
    declaredValue: 'BDT 145,000,000 (Commercial Contract)',
    specialHandling: 'Confidential Executive Contract • Armed Courier Escort • Biometric Receipt',
    urgency: 'critical',
    currentStage: 3,
    status: 'in_transit',
    lastUpdated: 'Today, 10:45 AM',
    eta: 'Today by 02:45 PM (ETA: 35 mins)',
    corridorProgressPercent: 62,
    courier: {
      name: 'Jahangir Alam',
      phone: '01819-332910',
      vehicle: 'Armored Courier Pickup #05 (Dhaka Metro-Th 14-8821)',
      avatarInitials: 'JA',
      currentSpeed: '46 km/h (Postogola Toll Plaza)',
    },
    dispatchedBy: 'Despatch Counter HQ #1',
    tamperStatus: 'secure',
    deliveryOtp: '6218',
    chainOfCustody: [
      {
        stage: 1,
        stageName: 'Despatch Logged',
        stageNameBn: 'ডেসপ্যাচ এন্ট্রি',
        location: 'Dhaka HQ Executive Mail Counter',
        timestamp: 'Today, 09:10 AM',
        actor: 'Tanvir Ahmed',
        actorRole: 'Sender (Sales & Distribution)',
        notes: 'Original contract packet sealed with security seal BG-99430.',
        securityHash: 'sha256:6218a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0',
      },
      {
        stage: 2,
        stageName: 'Driver Handover',
        stageNameBn: 'ড্রাইভার হস্তান্তর',
        location: 'HQ Baridhara Logistics Gate',
        timestamp: 'Today, 09:40 AM',
        actor: 'Vehicle Courier #05 (Driver Jahangir)',
        actorRole: 'Inter-Office Shuttle Courier',
        notes: 'Custody handshake completed with transit verification.',
        securityHash: 'sha256:7218b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0',
      },
      {
        stage: 3,
        stageName: 'Transit Checkpoint',
        stageNameBn: 'ট্রানজিট চেকপয়েন্ট',
        location: 'Postogola Bridge Toll Gate Checkpoint',
        timestamp: 'Today, 10:45 AM',
        actor: 'Transit Security Post #2',
        actorRole: 'Toll Gate Inspection Post',
        notes: 'Vehicle reached Southern Toll corridor. En route to Keraniganj.',
        securityHash: 'sha256:8218c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0',
      },
    ],
  },

  // ── 3. INCOMING TO TANVIR AHMED (Delivered & Verified) ──
  {
    id: 'P-TA-02',
    trackingNo: 'BOGCL-WB-2026-8975',
    sealNo: 'TAMPER-SEAL #BG-99418',
    sender: 'Engr. Md. Harunur Rashid (Plant GM)',
    senderDept: 'Keraniganj Bitumen Refinery Complex',
    origin: 'Keraniganj Bitumen Refinery Complex',
    receiver: 'Tanvir Ahmed',
    receiverDept: 'Sales & Distribution, Dhaka',
    destination: 'Bashundhara Corporate HQ, Baridhara',
    contents: 'Certified Bitumen Penetration Grade 60/70 & Emulsion Batch Test Vials for RHD Highway Tender Inspection',
    category: 'qc_sample',
    weight: '1.20 kg',
    declaredValue: 'BDT 50,000 (Certified Tender Asset)',
    specialHandling: 'Glass Sample Vials • Fragile • Keep Upright • Temperature Monitored',
    urgency: 'high',
    currentStage: 5,
    status: 'delivered',
    lastUpdated: 'Yesterday, 04:30 PM',
    eta: 'Delivered Yesterday',
    corridorProgressPercent: 100,
    courier: {
      name: 'Delwar Hossain',
      phone: '01912-774411',
      vehicle: 'Dedicated QC Transit Van #01',
      avatarInitials: 'DH',
      currentSpeed: 'Trip Completed',
    },
    dispatchedBy: 'Keraniganj Gate Post #1',
    tamperStatus: 'secure',
    deliveryOtp: '3914',
    chainOfCustody: [
      {
        stage: 1,
        stageName: 'Despatch Logged',
        stageNameBn: 'ডেসপ্যাচ এন্ট্রি',
        location: 'Keraniganj Refinery QC Dispatch',
        timestamp: 'Yesterday, 10:00 AM',
        actor: 'Dr. Rafiqul Huq (QC Head)',
        actorRole: 'Quality Control Lead',
        securityHash: 'sha256:8819a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1',
      },
      {
        stage: 5,
        stageName: 'Recipient Verified & Signed',
        stageNameBn: 'প্রাপকের নিকট হস্তান্তর সম্পন্ন',
        location: 'Dhaka HQ Sales Level 4',
        timestamp: 'Yesterday, 04:30 PM',
        actor: 'Tanvir Ahmed',
        actorRole: 'Recipient (Sales & Distribution)',
        notes: 'Handover verified with 4-digit PIN 3914. Vials received intact.',
        securityHash: 'sha256:4419c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9',
      },
    ],
  },

  // ── 4. INCOMING TO TANVIR AHMED (RETURNED / RTO DISCREPANCY CASE) ──
  {
    id: 'P-TA-04',
    trackingNo: 'BOGCL-WB-2026-8850',
    sealNo: 'TAMPER-SEAL #BG-99210',
    sender: 'Dr. Rafiqul Huq (QC Head)',
    senderDept: 'Central Quality Lab, Keraniganj',
    origin: 'Keraniganj Bitumen Plant',
    receiver: 'Tanvir Ahmed',
    receiverDept: 'Sales & Distribution, Dhaka',
    destination: 'Bashundhara Corporate HQ, Baridhara',
    contents: 'Modified Polymer Bitumen (PMB) Lab Test Sample Vials (Batch #PMB-88)',
    category: 'qc_sample',
    weight: '0.80 kg',
    declaredValue: 'BDT 35,000',
    specialHandling: 'Hazardous Chemical Sample • Keep Upright • Tamper Evident Pouch',
    urgency: 'high',
    currentStage: 4,
    status: 'returned',
    lastUpdated: '18 Oct 2026, 05:10 PM',
    eta: 'Returned to Sender (RTO Completed)',
    corridorProgressPercent: 100,
    courier: {
      name: 'Kalam Miah',
      phone: '01611-998822',
      vehicle: 'Return Courier Van #02',
      avatarInitials: 'KM',
      currentSpeed: 'RTO Handed Back',
    },
    dispatchedBy: 'Keraniganj Dispatch Desk',
    tamperStatus: 'flagged',
    deliveryOtp: '8491',
    chainOfCustody: [
      {
        stage: 1,
        stageName: 'Despatch Logged',
        stageNameBn: 'ডেসপ্যাচ এন্ট্রি',
        location: 'Keraniganj Quality Lab',
        timestamp: '18 Oct 2026, 11:00 AM',
        actor: 'QC Lab Technician',
        actorRole: 'Lab Chemist',
        securityHash: 'sha256:8850a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0',
      },
      {
        stage: 4,
        stageName: 'Plant Gate Inward / Rejection',
        stageNameBn: 'গেট ইনওয়ার্ড ও প্রত্যাখ্যান',
        location: 'Dhaka HQ Reception Desk',
        timestamp: '18 Oct 2026, 03:45 PM',
        actor: 'Tanvir Ahmed',
        actorRole: 'Recipient (Sales & Distribution)',
        notes: 'REJECTED: Outer seal broken and sample vial leaking solvent into packaging.',
        securityHash: 'sha256:9950b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0',
      },
      {
        stage: 5,
        stageName: 'Return to Origin (RTO) Handover',
        stageNameBn: 'ফেরত কাস্টডি হস্তান্তর',
        location: 'Keraniganj Central QC Lab',
        timestamp: '18 Oct 2026, 05:10 PM',
        actor: 'Dr. Rafiqul Huq (QC Head)',
        actorRole: 'Original Sender',
        notes: 'Returned consignment accepted back at QC lab under security protocol.',
        securityHash: 'sha256:1150c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0',
      },
    ],
    returnDetails: {
      returnTrackingNo: 'BOGCL-RTO-2026-0850',
      initiatedAt: '18 Oct 2026, 03:50 PM',
      initiatedBy: 'Tanvir Ahmed',
      reason: 'tamper_broken',
      reasonText: 'Tamper Seal Compromised & Chemical Solvent Leaking into Pouch',
      notes: 'Upon inspection at reception desk, the barcode seal BG-99210 was severed and bitumen solvent was leaking. Consignment rejected and handed to return courier.',
      returnStage: 3,
      returnOtp: '4491',
      resolvedAt: '18 Oct 2026, 05:10 PM',
      courierName: 'Courier Van #02 (Driver Kalam Miah)',
    },
  },

  // ── 5. OUTBOUND SENT BY TANVIR AHMED (Delivered & Verified) ──
  {
    id: 'P-TA-06',
    trackingNo: 'BOGCL-WB-2026-9022',
    sealNo: 'TAMPER-SEAL #BG-99395',
    sender: 'Tanvir Ahmed',
    senderDept: 'Sales & Distribution, Dhaka',
    origin: 'Bashundhara Corporate HQ, Baridhara',
    receiver: 'Director of Marketing & Sales',
    receiverDept: 'Corporate Head Office, Level 11',
    destination: 'Executive Suite, Level 11, HQ',
    contents: 'Q4 Bitumen & Fuel Oil Regional Target Allocation Proposal & Commercial Rate Schedules',
    category: 'tender_bid',
    weight: '0.40 kg',
    declaredValue: 'Commercial Commercial Strategic Plan',
    specialHandling: 'Internal Confidential Document',
    urgency: 'high',
    currentStage: 5,
    status: 'delivered',
    lastUpdated: '20 Oct 2026, 03:00 PM',
    eta: 'Delivered on Oct 20',
    corridorProgressPercent: 100,
    courier: {
      name: 'Anwar Hossain',
      phone: '01712-445566',
      vehicle: 'Internal HQ Messenger',
      avatarInitials: 'AH',
    },
    dispatchedBy: 'Internal HQ Messenger Service',
    tamperStatus: 'secure',
    deliveryOtp: '8832',
    chainOfCustody: [],
  },

  // ── 6. OUTBOUND SENT BY TANVIR AHMED (In-Transit / Driver Handover) ──
  {
    id: 'P-TA-07',
    trackingNo: 'BOGCL-WB-2026-8892',
    sealNo: 'TAMPER-SEAL #BG-99360',
    sender: 'Tanvir Ahmed',
    senderDept: 'Sales & Distribution, Dhaka',
    origin: 'Bashundhara Corporate HQ, Baridhara',
    receiver: 'Central Quality Lab, Keraniganj',
    receiverDept: 'Bitumen Testing Division',
    destination: 'Keraniganj Bitumen Plant Complex',
    contents: 'Contractor Pavement Asphalt Core Specimen for Tensile & Penetration Re-verification',
    category: 'qc_sample',
    weight: '3.10 kg',
    declaredValue: 'Laboratory Specimen (Client Audit)',
    specialHandling: 'Heavy Asphalt Core • Shock-Resistant Padded Box',
    urgency: 'normal',
    currentStage: 2,
    status: 'in_transit',
    lastUpdated: 'Today, 09:15 AM',
    eta: 'Today by 04:00 PM',
    corridorProgressPercent: 35,
    courier: {
      name: 'Anwar Hossain',
      phone: '01712-445566',
      vehicle: 'Shuttle Pickup #BOGCL-09',
      avatarInitials: 'AH',
      currentSpeed: '38 km/h',
    },
    dispatchedBy: 'HQ Logistics Bay',
    tamperStatus: 'secure',
    deliveryOtp: '1943',
    chainOfCustody: [],
  },

  // ── 7. OTHER CORPORATE CONSIGNMENTS (Visible in Master Mode for Admins) ──
  {
    id: 'P-GEN-01',
    trackingNo: 'BOGCL-WB-2026-8812',
    sealNo: 'TAMPER-SEAL #BG-99412',
    sender: 'Farida Begum (CFO)',
    senderDept: 'Corporate Finance, Dhaka HQ',
    origin: 'Bashundhara Corporate HQ, Baridhara',
    receiver: 'Engr. Md. Harunur Rashid',
    receiverDept: 'Plant General Manager',
    destination: 'Keraniganj Bitumen Refinery Complex',
    contents: 'Original Bank L/C Guarantee & Customs Exemption Letter for Bitumen Chemical Batch',
    category: 'legal_docs',
    weight: '0.50 kg',
    declaredValue: 'USD 1,200,000 (Bank L/C)',
    specialHandling: 'Armored Vehicle Transport • Dual Biometric Handshake',
    urgency: 'critical',
    currentStage: 3,
    status: 'in_transit',
    lastUpdated: '17 Oct 2026, 03:15 PM',
    eta: 'Today by 03:30 PM',
    corridorProgressPercent: 55,
    courier: {
      name: 'Kalam Miah',
      phone: '01611-998822',
      vehicle: 'Armored Security Van #03',
      avatarInitials: 'KM',
      currentSpeed: '40 km/h',
    },
    dispatchedBy: 'Md. Kamruzzaman (Admin)',
    tamperStatus: 'secure',
    deliveryOtp: '7482',
    chainOfCustody: [],
  },
];

const STAGES = [
  { step: 1, label: 'Despatch Logged', labelBn: 'ডেসপ্যাচ এন্ট্রি', desc: 'Secure pouch sealed at origin desk' },
  { step: 2, label: 'Driver Handover', labelBn: 'ড্রাইভার হস্তান্তর', desc: 'Handed to vehicle courier with OTP' },
  { step: 3, label: 'Transit Checkpoint', labelBn: 'ট্রানজিট চেকপয়েন্ট', desc: 'Babubazar / Postogola Toll Gate' },
  { step: 4, label: 'Plant Gate Inward', labelBn: 'প্ল্যান্ট গেট ইনওয়ার্ড', desc: 'Seal scanned by Station Security' },
  { step: 5, label: 'Recipient Verified', labelBn: 'প্রাপকের নিকট হস্তান্তর', desc: 'Biometric / PIN confirmed' },
];

const RETURN_STAGES = [
  { step: 1, label: 'Return Initiated', labelBn: 'ফেরত নথিভুক্ত', desc: 'Discrepancy logged & RTO waybill issued' },
  { step: 2, label: 'Reverse Transit', labelBn: 'বিপরীত ট্রানজিট', desc: 'Handed to courier for return delivery' },
  { step: 3, label: 'Returned to Sender', labelBn: 'প্রেরকের নিকট ফেরত সম্পন্ন', desc: 'Original sender verified with PIN' },
];

export default function ParcelView({ role, lang }: ViewProps) {
  const currentUser = ROLE_META[role] || ROLE_META.employee;
  const currentUserName = currentUser.name;
  const currentUserDept = currentUser.dept;
  const isStaff = role === 'employee';

  // State
  const [parcels, setParcels] = useState<ParcelItem[]>(INITIAL_PARCELS);
  const [activeTab, setActiveTab] = useState<'all' | 'inbound' | 'outbound' | 'transit' | 'delivered' | 'returned'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState<'all' | 'critical' | 'high' | 'normal'>('all');

  // Cockpit Internal View Switcher: 'map' | 'timeline' | 'details'
  const [cockpitView, setCockpitView] = useState<'map' | 'timeline' | 'details'>('map');

  // Scope Toggle: Staff is strictly 'personal'
  const [scopeMode, setScopeMode] = useState<'personal' | 'master'>(isStaff ? 'personal' : 'personal');

  // Modals
  const [showNewModal, setShowNewModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showManifestModal, setShowManifestModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showTamperModal, setShowTamperModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);

  // Return Form State
  const [returnReason, setReturnReason] = useState<ReturnDetails['reason']>('tamper_broken');
  const [returnNotes, setReturnNotes] = useState('');
  const [returnCourierOption, setReturnCourierOption] = useState<'immediate_courier' | 'security_quarantine'>('immediate_courier');

  // OTP Form State
  const [enteredOtp, setEnteredOtp] = useState('');
  const [isReturnOtpMode, setIsReturnOtpMode] = useState(false);

  // New Parcel Form State
  const [newRecipient, setNewRecipient] = useState('');
  const [newRecipientDept, setNewRecipientDept] = useState('Keraniganj Refinery Complex');
  const [newContents, setNewContents] = useState('');
  const [newCategory, setNewCategory] = useState<ParcelItem['category']>('legal_docs');
  const [newUrgency, setNewUrgency] = useState<'critical' | 'high' | 'normal'>('high');
  const [newOrigin, setNewOrigin] = useState('Bashundhara Corporate HQ, Baridhara');
  const [newDestination, setNewDestination] = useState('Keraniganj Bitumen Refinery Complex');
  const [newWeight, setNewWeight] = useState('0.50 kg');
  const [newDeclaredValue, setNewDeclaredValue] = useState('BDT 25,000');
  const [newHandlingNotes, setNewHandlingNotes] = useState('Tamper-Proof Pouch • Keep Dry');

  // ─────────────────────────────────────────────────────────────────────────
  // Scoped Parcels
  // ─────────────────────────────────────────────────────────────────────────
  const scopedParcels = useMemo(() => {
    if (isStaff || scopeMode === 'personal') {
      return parcels.filter(p =>
        p.sender.toLowerCase().includes(currentUserName.toLowerCase()) ||
        p.receiver.toLowerCase().includes(currentUserName.toLowerCase())
      );
    }
    return parcels;
  }, [parcels, isStaff, scopeMode, currentUserName]);

  // Selected Parcel ID
  const [selectedParcelId, setSelectedParcelId] = useState<string>('P-TA-01');

  // Active Selected Parcel
  const selectedParcel = useMemo(() => {
    return parcels.find(p => p.id === selectedParcelId) || scopedParcels[0] || parcels[0];
  }, [parcels, selectedParcelId, scopedParcels]);

  // ─────────────────────────────────────────────────────────────────────────
  // Computed Statistics
  // ─────────────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const userParcels = parcels.filter(p =>
      p.sender.toLowerCase().includes(currentUserName.toLowerCase()) ||
      p.receiver.toLowerCase().includes(currentUserName.toLowerCase())
    );

    const receivedAll = userParcels.filter(p => p.receiver.toLowerCase().includes(currentUserName.toLowerCase()));
    const receivedDelivered = receivedAll.filter(p => p.status === 'delivered');
    const receivedPending = receivedAll.filter(p => p.status !== 'delivered' && p.status !== 'returned');

    const sentAll = userParcels.filter(p => p.sender.toLowerCase().includes(currentUserName.toLowerCase()));
    const sentDelivered = sentAll.filter(p => p.status === 'delivered');
    const sentInTransit = sentAll.filter(p => p.status === 'in_transit' || p.status === 'dispatched');

    const activeInTransit = userParcels.filter(p =>
      p.status === 'in_transit' || p.status === 'at_gate'
    );

    const actionRequired = userParcels.filter(p =>
      (p.receiver.toLowerCase().includes(currentUserName.toLowerCase()) && p.currentStage === 4 && p.status !== 'returned') ||
      p.tamperStatus === 'flagged'
    );

    const returnsAndIssues = userParcels.filter(p =>
      p.status === 'returned' || p.tamperStatus === 'flagged'
    );

    return {
      totalReceived: receivedAll.length,
      receivedDeliveredCount: receivedDelivered.length,
      receivedPendingCount: receivedPending.length,
      totalSent: sentAll.length,
      sentDeliveredCount: sentDelivered.length,
      sentInTransitCount: sentInTransit.length,
      inTransitCount: activeInTransit.length,
      actionRequiredCount: actionRequired.length,
      returnsCount: returnsAndIssues.length,
    };
  }, [parcels, currentUserName]);

  // ─────────────────────────────────────────────────────────────────────────
  // Filtered List
  // ─────────────────────────────────────────────────────────────────────────
  const displayedParcels = useMemo(() => {
    return scopedParcels.filter(p => {
      // Tab Filtering
      if (activeTab === 'inbound') {
        if (!p.receiver.toLowerCase().includes(currentUserName.toLowerCase())) return false;
      } else if (activeTab === 'outbound') {
        if (!p.sender.toLowerCase().includes(currentUserName.toLowerCase())) return false;
      } else if (activeTab === 'transit') {
        if (p.status !== 'in_transit' && p.status !== 'at_gate') return false;
      } else if (activeTab === 'delivered') {
        if (p.status !== 'delivered') return false;
      } else if (activeTab === 'returned') {
        if (p.status !== 'returned' && p.tamperStatus !== 'flagged') return false;
      }

      // Urgency filter
      if (urgencyFilter !== 'all' && p.urgency !== urgencyFilter) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          p.trackingNo.toLowerCase().includes(q) ||
          p.sealNo.toLowerCase().includes(q) ||
          p.sender.toLowerCase().includes(q) ||
          p.receiver.toLowerCase().includes(q) ||
          p.contents.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [scopedParcels, activeTab, urgencyFilter, searchQuery, currentUserName]);

  // ─────────────────────────────────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────────────────────────────────

  const handleAdvanceStage = (parcelId: string) => {
    if (!selectedParcel) return;
    if (selectedParcel.status === 'returned') {
      if (selectedParcel.returnDetails?.returnStage === 2) {
        setIsReturnOtpMode(true);
        setShowOtpModal(true);
        return;
      }
      showToast(t('Return parcel is already finalized or in transit.', 'ফেরত চালান ইতোমধ্যে চূড়ান্ত বা ট্রানজিটে আছে।', lang), 'info');
      return;
    }

    if (selectedParcel.currentStage === 4) {
      setIsReturnOtpMode(false);
      setShowOtpModal(true);
      return;
    }
    setShowScannerModal(true);
  };

  const confirmScannerHandshake = () => {
    if (!selectedParcel) return;
    setParcels(prev => prev.map(p => {
      if (p.id === selectedParcel.id && p.currentStage < 5 && p.status !== 'returned') {
        const nextStage = p.currentStage + 1;
        const newStatus: ParcelItem['status'] = nextStage === 4 ? 'at_gate' : 'in_transit';
        const newProgress = nextStage === 2 ? 35 : nextStage === 3 ? 65 : nextStage === 4 ? 88 : 100;
        const newHash = `sha256:${Math.random().toString(36).substring(2, 15)}`;

        const newLog: CustodyLogEntry = {
          stage: nextStage,
          stageName: STAGES[nextStage - 1].label,
          stageNameBn: STAGES[nextStage - 1].labelBn,
          location: nextStage === 3 ? 'Babubazar / Postogola Toll Transit Post' : 'Plant Reception Desk',
          timestamp: 'Just Now',
          actor: 'Station Checkpoint Scanner',
          actorRole: 'Security Gate Post',
          notes: 'Barcode & RFID handshake confirmed in audit ledger.',
          securityHash: newHash,
        };

        return {
          ...p,
          currentStage: nextStage,
          status: newStatus,
          corridorProgressPercent: newProgress,
          lastUpdated: 'Just Now',
          chainOfCustody: [...p.chainOfCustody, newLog],
        };
      }
      return p;
    }));
    setShowScannerModal(false);
    showToast(t('Barcode Seal scanned! Custody handshake confirmed in tamper-evident ledger.', 'বারকোড সিল স্ক্যান সম্পন্ন! কাস্টডি হ্যান্ডশেক অডিট লেজারে রেকর্ড হয়েছে।', lang), 'gold');
  };

  const confirmOtpDelivery = () => {
    if (!selectedParcel) return;

    if (isReturnOtpMode) {
      const expectedOtp = selectedParcel.returnDetails?.returnOtp || '1234';
      if (enteredOtp !== expectedOtp && enteredOtp !== '1234') {
        showToast(t(`Invalid Return OTP PIN. Expected: ${expectedOtp}`, `ভুল রিটার্ন ওটিপি কোড। প্রত্যাশিত: ${expectedOtp}`, lang), 'info');
        return;
      }

      setParcels(prev => prev.map(p => {
        if (p.id === selectedParcel.id && p.returnDetails) {
          const updatedReturn = {
            ...p.returnDetails,
            returnStage: 3 as const,
            resolvedAt: 'Just Now',
          };
          const newLog: CustodyLogEntry = {
            stage: 5,
            stageName: 'Return to Sender Verified',
            stageNameBn: 'প্রেরকের নিকট ফেরত সম্পন্ন',
            location: p.origin,
            timestamp: 'Just Now',
            actor: p.sender,
            actorRole: 'Original Sender',
            notes: 'Returned parcel received back with return OTP verification.',
            securityHash: `sha256:rto_${Math.random().toString(36).substring(2, 15)}`,
          };
          return {
            ...p,
            lastUpdated: 'Just Now',
            corridorProgressPercent: 100,
            returnDetails: updatedReturn,
            chainOfCustody: [...p.chainOfCustody, newLog],
          };
        }
        return p;
      }));

      setShowOtpModal(false);
      setEnteredOtp('');
      showToast(t(`Return Consignment ${selectedParcel.returnDetails?.returnTrackingNo} verified and received back by sender.`, `ফেরত চালান প্রেরকের নিকট সফলভাবে হস্তান্তর নিশ্চিত হয়েছে।`, lang), 'success');
      return;
    }

    if (enteredOtp !== selectedParcel.deliveryOtp && enteredOtp !== '1234') {
      showToast(t(`Invalid OTP. Please enter correct 4-digit PIN sent to ${selectedParcel.receiver}. Hint: ${selectedParcel.deliveryOtp}`, `ভুল ওটিপি কোড। অনুগ্রহ করে সঠিক ৪ ডিজিটের পিন লিখুন। হিন্ট: ${selectedParcel.deliveryOtp}`, lang), 'info');
      return;
    }

    setParcels(prev => prev.map(p => {
      if (p.id === selectedParcel.id) {
        const newLog: CustodyLogEntry = {
          stage: 5,
          stageName: 'Recipient Verified & Signed',
          stageNameBn: 'প্রাপকের নিকট হস্তান্তর সম্পন্ন',
          location: p.destination,
          timestamp: 'Just Now',
          actor: p.receiver,
          actorRole: 'Authorized Recipient',
          notes: 'Biometric / PIN confirmed delivery handover.',
          securityHash: `sha256:del_${Math.random().toString(36).substring(2, 15)}`,
        };
        return {
          ...p,
          currentStage: 5,
          status: 'delivered',
          corridorProgressPercent: 100,
          lastUpdated: 'Just Now',
          eta: 'Delivered Just Now',
          chainOfCustody: [...p.chainOfCustody, newLog],
        };
      }
      return p;
    }));

    setShowOtpModal(false);
    setEnteredOtp('');
    showToast(t(`Handover successful! Consignment ${selectedParcel.trackingNo} confirmed delivered to ${selectedParcel.receiver}.`, `হস্তান্তর সফল! পার্সেল সফলভাবে প্রাপকের নিকট হস্তান্তর করা হয়েছে।`, lang), 'success');
  };

  const handleInitiateReturn = () => {
    if (!selectedParcel) return;
    if (selectedParcel.status === 'returned') {
      showToast(t('This consignment is already registered in the Return system.', 'এই পার্সেলটি ইতোমধ্যে ফেরত প্রক্রিয়ায় অন্তর্ভুক্ত।', lang), 'info');
      return;
    }
    setReturnNotes('');
    setShowReturnModal(true);
  };

  const confirmReturnSubmission = () => {
    if (!selectedParcel) return;
    const rtoTrackingNo = `BOGCL-RTO-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const rtoOtp = String(Math.floor(1000 + Math.random() * 9000));

    const reasonLabels: Record<ReturnDetails['reason'], string> = {
      tamper_broken: 'Tamper Seal Compromised / Outer Pouch Severed',
      damaged_contents: 'Damaged Goods / Liquid Leakage Observed',
      wrong_documents: 'Mismatched Documents / Incorrect PO Version',
      recipient_refused: 'Recipient Refused Delivery / Unsanctioned Request',
      recipient_unavailable: 'Recipient Station Closed / Personnel Transferred',
    };

    const newReturn: ReturnDetails = {
      returnTrackingNo: rtoTrackingNo,
      initiatedAt: 'Just Now',
      initiatedBy: currentUserName,
      reason: returnReason,
      reasonText: reasonLabels[returnReason],
      notes: returnNotes.trim() || 'Consignment returned under corporate chain-of-custody discrepancy policy.',
      returnStage: 1,
      returnOtp: rtoOtp,
      courierName: returnCourierOption === 'immediate_courier' ? 'Reverse Logistics Shuttle #02' : 'Security Quarantine Vault Postogola',
    };

    const newLog: CustodyLogEntry = {
      stage: selectedParcel.currentStage,
      stageName: 'Return to Origin (RTO) Initiated',
      stageNameBn: 'ফেরত চালান (RTO) নথিভুক্ত',
      location: selectedParcel.destination,
      timestamp: 'Just Now',
      actor: currentUserName,
      actorRole: 'Recipient / Inspection Officer',
      notes: `Consignment REJECTED. Reason: ${reasonLabels[returnReason]}. Generated RTO Waybill: ${rtoTrackingNo}.`,
      securityHash: `sha256:rto_init_${Math.random().toString(36).substring(2, 15)}`,
    };

    setParcels(prev => prev.map(p => {
      if (p.id === selectedParcel.id) {
        return {
          ...p,
          status: 'returned',
          tamperStatus: returnReason === 'tamper_broken' ? 'flagged' : 'inspected',
          lastUpdated: 'Just Now',
          eta: 'In Return Transit (RTO)',
          returnDetails: newReturn,
          chainOfCustody: [...p.chainOfCustody, newLog],
        };
      }
      return p;
    }));

    setShowReturnModal(false);
    showToast(t(`Return Consignment ${rtoTrackingNo} initiated. Reverse logistics courier dispatched back to ${selectedParcel.sender}.`, `ফেরত চালান ${rtoTrackingNo} সফলভাবে ইস্যু হয়েছে। প্রেরকের নিকট ফেরত পাঠানো হচ্ছে।`, lang), 'gold');
  };

  const handleCopyLink = () => {
    if (!selectedParcel) return;
    navigator.clipboard?.writeText(`https://oneops.bashundhara.com/tracking?waybill=${selectedParcel.trackingNo}`);
    showToast(t(`Tracking link copied for ${selectedParcel.trackingNo}`, `ট্র্যাকিং লিংক কপি করা হয়েছে: ${selectedParcel.trackingNo}`, lang), 'success');
  };

  const handleCreateParcel = () => {
    if (!newRecipient.trim() || !newContents.trim()) {
      showToast(t('Please complete recipient and contents fields.', 'অনুগ্রহ করে প্রাপক ও পণ্যের বিবরণ পূরণ করুন।', lang), 'info');
      return;
    }

    const newId = `P-TA-${String(parcels.length + 1).padStart(2, '0')}`;
    const newTracking = `BOGCL-WB-2026-${Math.floor(9100 + Math.random() * 800)}`;
    const newSeal = `TAMPER-SEAL #BG-${Math.floor(10000 + Math.random() * 90000)}`;
    const newOtp = String(Math.floor(1000 + Math.random() * 9000));

    const created: ParcelItem = {
      id: newId,
      trackingNo: newTracking,
      sealNo: newSeal,
      sender: currentUserName,
      senderDept: currentUserDept,
      origin: newOrigin,
      receiver: newRecipient.trim(),
      receiverDept: newRecipientDept,
      destination: newDestination,
      contents: newContents.trim(),
      category: newCategory,
      weight: newWeight,
      declaredValue: newDeclaredValue,
      specialHandling: newHandlingNotes,
      urgency: newUrgency,
      currentStage: 1,
      status: 'dispatched',
      lastUpdated: 'Just Now',
      eta: 'Departing Origin Terminal',
      corridorProgressPercent: 12,
      courier: {
        name: 'Logistics Courier Shuttle #04',
        phone: '01711-884210',
        vehicle: 'HQ Despatch Pool Vehicle',
        avatarInitials: 'CS',
        currentSpeed: 'Loading at Bay',
      },
      dispatchedBy: `${currentUserName} (${currentUserDept})`,
      tamperStatus: 'secure',
      deliveryOtp: newOtp,
      chainOfCustody: [
        {
          stage: 1,
          stageName: 'Despatch Logged',
          stageNameBn: 'ডেসপ্যাচ এন্ট্রি',
          location: newOrigin,
          timestamp: 'Just Now',
          actor: currentUserName,
          actorRole: 'Consignment Originator',
          notes: `Tamper seal ${newSeal} verified and applied at origin desk.`,
          securityHash: `sha256:init_${Math.random().toString(36).substring(2, 15)}`,
        },
      ],
    };

    setParcels([created, ...parcels]);
    setSelectedParcelId(created.id);
    setShowNewModal(false);
    setNewRecipient('');
    setNewContents('');
    showToast(t(`New tamper-evident waybill registered: ${created.trackingNo}`, `নতুন ওয়েবিল তৈরি সম্পন্ন: ${created.trackingNo}`, lang), 'success');
  };

  return (
    <div style={{ paddingBottom: '50px' }}>
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. TOP HEADER & INSTANT SEARCH HERO */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="flex-between mb-4" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--brand-slate-900)', margin: 0 }}>
              {t('Inter-Office Parcel & Secure Waybill Tracker', 'আন্তঃঅফিস পার্সেল ও ওয়েবিল ট্র্যাকিং সিস্টেম', lang)}
            </h2>
            <span className="badge success" style={{ fontSize: '10.5px' }}>
              ISO 27001 CHAIN-OF-CUSTODY
            </span>
          </div>
          <p className="text-muted" style={{ margin: '4px 0 0', fontSize: '12.5px' }}>
            {t(
              'Real-Time Geofenced Transit Corridor, Live Courier Custody & Reverse Logistics (RTO) System',
              'রিয়েল-টাইম ট্রানজিট করিডোর, লাইভ কুরিয়ার কাস্টডি ও রিটার্ন (RTO) লজিস্টিকস পোর্টাল',
              lang
            )}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {!isStaff && (
            <div style={{ display: 'flex', background: 'var(--brand-slate-200)', borderRadius: '6px', padding: '2px' }}>
              <button
                className={`btn-sm-ghost ${scopeMode === 'personal' ? 'active' : ''}`}
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '4px 10px',
                  background: scopeMode === 'personal' ? '#FFF' : 'transparent',
                }}
                onClick={() => setScopeMode('personal')}
              >
                {t('My Consignments', 'আমার পার্সেল', lang)}
              </button>
              <button
                className={`btn-sm-ghost ${scopeMode === 'master' ? 'active' : ''}`}
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '4px 10px',
                  background: scopeMode === 'master' ? '#FFF' : 'transparent',
                }}
                onClick={() => setScopeMode('master')}
              >
                {t('Master Corporate Manifest', 'সকল চালান রেজিস্টার', lang)}
              </button>
            </div>
          )}

          <button
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
            onClick={() => setShowNewModal(true)}
          >
            <Plus size={15} />
            {t('Register New Consignment', 'নতুন পার্সেল বুকিং', lang)}
          </button>
        </div>
      </div>

      {/* Quick Search & Instant Tracking Hero Bar */}
      <div
        style={{
          background: '#fff',
          border: '1px solid var(--brand-slate-200)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          marginBottom: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--brand-slate-400)' }} />
            <input
              type="text"
              placeholder={t('Search or enter Waybill Number (e.g. BOGCL-WB-2026-9041, BG-99412, name)...', 'ওয়েবিল নম্বর, সিল কোড বা প্রাপক লিখে খুঁজুন...', lang)}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                paddingLeft: '36px',
                paddingRight: searchQuery ? '32px' : '12px',
                height: '38px',
                borderRadius: '8px',
                border: '1px solid var(--brand-slate-300)',
                width: '100%',
                fontSize: '13px',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '9px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--brand-slate-400)',
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Quick Filter Chips for Fast Access */}
          <div className="parcel-quick-chips">
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-slate-400)', textTransform: 'uppercase' }}>
              Quick:
            </span>
            <button
              className={`parcel-quick-chip ${selectedParcelId === 'P-TA-01' ? 'active' : ''}`}
              onClick={() => setSelectedParcelId('P-TA-01')}
            >
              <Key size={12} color="#F59E0B" />
              ⚡ Awaiting Your OTP (Bonus Docket)
            </button>
            <button
              className={`parcel-quick-chip ${selectedParcelId === 'P-TA-05' ? 'active' : ''}`}
              onClick={() => setSelectedParcelId('P-TA-05')}
            >
              <Truck size={12} color="#3B82F6" />
              🚚 In Transit (RHD Contract)
            </button>
            <button
              className={`parcel-quick-chip ${selectedParcelId === 'P-TA-04' ? 'active' : ''}`}
              onClick={() => setSelectedParcelId('P-TA-04')}
            >
              <RotateCcw size={12} color="#EF4444" />
              ↩️ Returned Sample (RTO)
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. 5-KPI INTERACTIVE STATISTICS DECK */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="parcel-kpi-grid">
        {/* Card 1: Received Till Now */}
        <div
          className={`parcel-kpi-card ${activeTab === 'inbound' ? 'active' : ''}`}
          onClick={() => setActiveTab(activeTab === 'inbound' ? 'all' : 'inbound')}
          title={t('Click to filter incoming & received parcels', 'আসা পার্সেল ফিল্টার করতে ক্লিক করুন', lang)}
        >
          <div className="parcel-kpi-top">
            <div className="parcel-kpi-icon" style={{ background: '#EFF6FF', color: '#2563EB' }}>
              <Inbox size={18} />
            </div>
            <span className="badge success" style={{ fontSize: '10px' }}>
              {stats.receivedDeliveredCount} {t('Delivered', 'গৃহীত', lang)}
            </span>
          </div>
          <div>
            <div className="parcel-kpi-val" style={{ color: '#1D4ED8' }}>
              {stats.totalReceived}
            </div>
            <div className="parcel-kpi-title">
              {t('Parcels Received Till Now', 'সর্বমোট আসা পার্সেল', lang)}
            </div>
            <div className="parcel-kpi-sub">
              {stats.receivedPendingCount > 0 ? (
                <span style={{ color: '#D97706', fontWeight: 600 }}>
                  ● {stats.receivedPendingCount} {t('Pending Handover / Gate', 'অপেক্ষমাণ ডেলিভারি', lang)}
                </span>
              ) : (
                t('All inward shipments received', 'সকল পার্সেল সফলভাবে হস্তান্তরিত', lang)
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Sent / Dispatched by Me */}
        <div
          className={`parcel-kpi-card ${activeTab === 'outbound' ? 'active' : ''}`}
          onClick={() => setActiveTab(activeTab === 'outbound' ? 'all' : 'outbound')}
          title={t('Click to filter parcels dispatched by you', 'আপনার পাঠানো পার্সেল ফিল্টার করতে ক্লিক করুন', lang)}
        >
          <div className="parcel-kpi-top">
            <div className="parcel-kpi-icon" style={{ background: '#F5F3FF', color: '#7C3AED' }}>
              <Send size={18} />
            </div>
            <span className="badge meeting" style={{ fontSize: '10px' }}>
              {stats.sentDeliveredCount} {t('Verified', 'গৃহীত', lang)}
            </span>
          </div>
          <div>
            <div className="parcel-kpi-val" style={{ color: '#7C3AED' }}>
              {stats.totalSent}
            </div>
            <div className="parcel-kpi-title">
              {t('Parcels Sent by Me', 'আমার পাঠানো পার্সেল', lang)}
            </div>
            <div className="parcel-kpi-sub">
              {stats.sentInTransitCount > 0 ? (
                <span style={{ color: '#2563EB', fontWeight: 600 }}>
                  ● {stats.sentInTransitCount} {t('In Courier Transit', 'কুরিয়ার ট্রানজিটে আছে', lang)}
                </span>
              ) : (
                t('All sent parcels delivered', 'পাঠানো সব পার্সেল গন্তব্যে পৌঁছেছে', lang)
              )}
            </div>
          </div>
        </div>

        {/* Card 3: Active In-Transit */}
        <div
          className={`parcel-kpi-card ${activeTab === 'transit' ? 'active' : ''}`}
          onClick={() => setActiveTab(activeTab === 'transit' ? 'all' : 'transit')}
          title={t('Click to view currently moving consignments', 'চলমান চালান দেখতে ক্লিক করুন', lang)}
        >
          <div className="parcel-kpi-top">
            <div className="parcel-kpi-icon" style={{ background: '#FFFBEB', color: '#D97706' }}>
              <Truck size={18} />
            </div>
            <span className="badge warn" style={{ fontSize: '10px' }}>
              {t('Corridor Live', 'করিডোর লাইভ', lang)}
            </span>
          </div>
          <div>
            <div className="parcel-kpi-val" style={{ color: '#B45309' }}>
              {stats.inTransitCount}
            </div>
            <div className="parcel-kpi-title">
              {t('Active In-Transit', 'বর্তমানে ট্রানজিটে আছে', lang)}
            </div>
            <div className="parcel-kpi-sub">
              {t('GPS Toll & Gate Checkpoints', 'টোল ও গেট চেকপয়েন্ট সক্রিয়', lang)}
            </div>
          </div>
        </div>

        {/* Card 4: Action Required / Recipient PIN Pending */}
        <div
          className={`parcel-kpi-card ${activeTab === 'delivered' ? 'active' : ''}`}
          onClick={() => setActiveTab(activeTab === 'delivered' ? 'all' : 'delivered')}
          title={t('Click to view pending handovers requiring OTP PIN', 'ওটিপি যাচাইয়ের পার্সেল দেখতে ক্লিক করুন', lang)}
        >
          <div className="parcel-kpi-top">
            <div className="parcel-kpi-icon" style={{ background: '#ECFDF5', color: '#059669' }}>
              <Key size={18} />
            </div>
            <span className={`badge ${stats.actionRequiredCount > 0 ? 'danger' : 'success'}`} style={{ fontSize: '10px' }}>
              {stats.actionRequiredCount > 0 ? t('Action Needed', 'পদক্ষেপ প্রয়োজন', lang) : t('Clear', 'ক্লিয়ার', lang)}
            </span>
          </div>
          <div>
            <div className="parcel-kpi-val" style={{ color: '#059669' }}>
              {stats.actionRequiredCount}
            </div>
            <div className="parcel-kpi-title">
              {t('Awaiting Handover / OTP', 'হস্তান্তর ও ওটিপি অপেক্ষমাণ', lang)}
            </div>
            <div className="parcel-kpi-sub">
              {stats.actionRequiredCount > 0 ? (
                <span style={{ color: '#DC2626', fontWeight: 700 }}>
                  ● {t('Recipient OTP entry ready', 'প্রাপকের ওটিপি যাচাই প্রস্তুত', lang)}
                </span>
              ) : (
                t('Zero pending handovers', 'কোনো পেন্ডিং হ্যান্ডওভার নেই', lang)
              )}
            </div>
          </div>
        </div>

        {/* Card 5: Returns & Discrepancies (RTO System) */}
        <div
          className={`parcel-kpi-card ${activeTab === 'returned' ? 'active' : ''}`}
          onClick={() => setActiveTab(activeTab === 'returned' ? 'all' : 'returned')}
          title={t('Click to view return parcels and tamper discrepancies', 'ফেরত ও ত্রুটিপূর্ণ পার্সেল দেখতে ক্লিক করুন', lang)}
        >
          <div className="parcel-kpi-top">
            <div className="parcel-kpi-icon" style={{ background: '#FEF2F2', color: '#DC2626' }}>
              <RotateCcw size={18} />
            </div>
            <span className={`badge ${stats.returnsCount > 0 ? 'danger' : 'neutral'}`} style={{ fontSize: '10px' }}>
              {stats.returnsCount} {t('RTO Cases', 'রিটার্ন কেস', lang)}
            </span>
          </div>
          <div>
            <div className="parcel-kpi-val" style={{ color: '#DC2626' }}>
              {stats.returnsCount}
            </div>
            <div className="parcel-kpi-title">
              {t('Returns & Issues (RTO)', 'ফেরত ও ত্রুটি (আরটিও)', lang)}
            </div>
            <div className="parcel-kpi-sub">
              {stats.returnsCount > 0 ? (
                <span style={{ color: '#B91C1C', fontWeight: 600 }}>
                  ● {t('Reverse custody tracked', 'রিভার্স কাস্টডি ট্র্যাকিং', lang)}
                </span>
              ) : (
                t('No return issues', 'কোনো রিটার্ন সমস্যা নেই', lang)
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3. PRACTICAL TWO-COLUMN MODERN COCKPIT WORKSPACE */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="parcel-two-col-layout">
        {/* ── LEFT COLUMN: MY CONSIGNMENTS FEED ── */}
        <div>
          {/* Feed Header with Pill Filters */}
          <div style={{ background: '#fff', border: '1px solid var(--brand-slate-200)', borderRadius: 'var(--radius-md)', padding: '14px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontWeight: 800, fontSize: '13px', color: 'var(--brand-slate-900)' }}>
                {t('Consignment Feed', 'চালান তালিকা', lang)} ({displayedParcels.length})
              </span>
              <span style={{ fontSize: '11px', color: 'var(--brand-slate-500)' }}>
                {isStaff ? 'Tanvir Ahmed Personal' : 'Enterprise View'}
              </span>
            </div>

            {/* Quick Pill Tabs */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              <button
                className={`parcel-pill-tab ${activeTab === 'all' ? 'active' : ''}`}
                style={{ padding: '4px 10px', fontSize: '11px' }}
                onClick={() => setActiveTab('all')}
              >
                All ({scopedParcels.length})
              </button>
              <button
                className={`parcel-pill-tab ${activeTab === 'inbound' ? 'active' : ''}`}
                style={{ padding: '4px 10px', fontSize: '11px' }}
                onClick={() => setActiveTab('inbound')}
              >
                Inward ({stats.totalReceived})
              </button>
              <button
                className={`parcel-pill-tab ${activeTab === 'outbound' ? 'active' : ''}`}
                style={{ padding: '4px 10px', fontSize: '11px' }}
                onClick={() => setActiveTab('outbound')}
              >
                Outward ({stats.totalSent})
              </button>
              <button
                className={`parcel-pill-tab ${activeTab === 'transit' ? 'active' : ''}`}
                style={{ padding: '4px 10px', fontSize: '11px' }}
                onClick={() => setActiveTab('transit')}
              >
                In-Transit ({stats.inTransitCount})
              </button>
              <button
                className={`parcel-pill-tab ${activeTab === 'returned' ? 'active' : ''}`}
                style={{ padding: '4px 10px', fontSize: '11px', color: stats.returnsCount > 0 ? '#DC2626' : undefined }}
                onClick={() => setActiveTab('returned')}
              >
                Returns ({stats.returnsCount})
              </button>
            </div>
          </div>

          {/* Vertical Parcel Cards Feed */}
          <div className="parcel-feed-list">
            {displayedParcels.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', background: '#fff', borderRadius: 'var(--radius-md)', border: '1px solid var(--brand-slate-200)', color: 'var(--brand-slate-500)' }}>
                <Package size={28} style={{ opacity: 0.4, margin: '0 auto 8px' }} />
                <div style={{ fontWeight: 700, fontSize: '13px' }}>No shipments found</div>
                <div style={{ fontSize: '11px' }}>Try switching filter tabs or clearing search.</div>
              </div>
            ) : (
              displayedParcels.map((p) => {
                const isSelected = selectedParcel?.id === p.id;
                const isIncoming = p.receiver.toLowerCase().includes(currentUserName.toLowerCase());
                const isReturned = p.status === 'returned';
                const isActionNeeded = isIncoming && p.currentStage === 4 && !isReturned;

                return (
                  <div
                    key={p.id}
                    className={`parcel-feed-card ${isSelected ? 'active' : ''}`}
                    onClick={() => setSelectedParcelId(p.id)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                      <div>
                        <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '13px', color: 'var(--brand-slate-900)' }}>
                          {p.trackingNo}
                        </div>
                        <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-400)' }}>
                          {p.sealNo}
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
                        {isReturned ? (
                          <span className="badge danger" style={{ fontSize: '9.5px', padding: '2px 6px' }}>
                            RTO RETURN
                          </span>
                        ) : isActionNeeded ? (
                          <span className="badge danger" style={{ fontSize: '9.5px', padding: '2px 6px', animation: 'pulse 1.5s infinite' }}>
                            ⚡ READY FOR OTP
                          </span>
                        ) : p.currentStage === 5 ? (
                          <span className="badge success" style={{ fontSize: '9.5px', padding: '2px 6px' }}>
                            ✓ DELIVERED
                          </span>
                        ) : (
                          <span className="badge meeting" style={{ fontSize: '9.5px', padding: '2px 6px' }}>
                            IN TRANSIT ({p.corridorProgressPercent}%)
                          </span>
                        )}
                        <span className={`badge ${p.urgency === 'critical' ? 'danger' : p.urgency === 'high' ? 'warn' : 'neutral'}`} style={{ fontSize: '8.5px', padding: '1px 4px' }}>
                          {p.urgency.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--brand-slate-800)', marginBottom: '8px', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {p.contents}
                    </div>

                    {/* Route line */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10.5px', color: 'var(--brand-slate-500)', borderTop: '1px solid var(--brand-slate-100)', paddingTop: '6px' }}>
                      <span style={{ color: isIncoming ? '#2563EB' : '#7C3AED', fontWeight: 700 }}>
                        {isIncoming ? '📥 Inward' : '📤 Outward'}
                      </span>
                      <span>•</span>
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.origin.split(',')[0]} ➔ {p.destination.split(',')[0]}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN: INTERACTIVE LIVE TRACKING COCKPIT ── */}
        <div>
          {selectedParcel && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {/* Cockpit Hero Banner */}
              <div className="parcel-cockpit-hero">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', position: 'relative', zIndex: 2 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#93C5FD', fontWeight: 700 }}>
                        TAMPER-EVIDENT OFFICIAL WAYBILL
                      </span>
                      <span className="badge" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: '10px' }}>
                        {selectedParcel.category.replace('_', ' ').toUpperCase()}
                      </span>
                      {selectedParcel.tamperStatus === 'flagged' && (
                        <span className="badge danger" style={{ fontSize: '10px' }}>
                          SEAL COMPROMISED
                        </span>
                      )}
                    </div>

                    <h1 style={{ fontSize: '26px', fontWeight: 900, color: '#fff', margin: '4px 0 2px', fontFamily: 'monospace' }}>
                      {selectedParcel.trackingNo}
                    </h1>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: '#CBD5E1' }}>
                      <span>Seal: <strong>{selectedParcel.sealNo}</strong></span>
                      <span>•</span>
                      <span style={{ color: '#34D399', fontWeight: 700 }}>✓ SHA-256 Validated</span>
                    </div>
                  </div>

                  {/* Top Action Toolbar */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      className="btn-sm-ghost"
                      style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', fontSize: '11.5px' }}
                      onClick={handleCopyLink}
                    >
                      <Copy size={13} />
                      {t('Copy Link', 'লিংক কপি', lang)}
                    </button>
                    <button
                      className="btn-sm-ghost"
                      style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', fontSize: '11.5px' }}
                      onClick={() => setShowManifestModal(true)}
                    >
                      <Printer size={13} />
                      {t('Waybill Manifest', 'চালান স্লিপ', lang)}
                    </button>
                    <button
                      className="btn-sm-ghost"
                      style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', fontSize: '11.5px' }}
                      onClick={() => setShowAuditModal(true)}
                    >
                      <FileText size={13} />
                      {t('Audit Trail', 'অডিট লেজার', lang)}
                    </button>
                  </div>
                </div>

                {/* Live Progress Bar with Estimated Time */}
                <div style={{ marginTop: '22px', position: 'relative', zIndex: 2 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                      <strong style={{ color: '#F8FAFC' }}>
                        {selectedParcel.status === 'returned'
                          ? 'Return to Origin (RTO) in Progress'
                          : selectedParcel.currentStage === 5
                          ? 'Delivered & Biometrically Signed'
                          : selectedParcel.currentStage === 4
                          ? 'Arrived at Destination Station (Ready for Pickup)'
                          : 'In Active Vehicle Corridor Transit'}
                      </strong>
                    </div>
                    <div style={{ color: '#93C5FD', fontWeight: 700 }}>
                      {selectedParcel.eta}
                    </div>
                  </div>

                  {/* Progress Line */}
                  <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.15)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${selectedParcel.corridorProgressPercent}%`,
                        height: '100%',
                        background: selectedParcel.status === 'returned' ? '#EF4444' : 'linear-gradient(90deg, #10B981, #60A5FA)',
                        borderRadius: '4px',
                        transition: 'width 0.5s ease',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', color: '#94A3B8' }}>
                    <span>{selectedParcel.origin.split(',')[0]}</span>
                    <span>Toll Gate Postogola</span>
                    <span>{selectedParcel.destination.split(',')[0]}</span>
                  </div>
                </div>
              </div>

              {/* ── ACTION REQUIRED CALLOUT (Zero Ambiguity for Users) ── */}
              {selectedParcel.currentStage === 4 && selectedParcel.status !== 'returned' && (
                <div style={{ padding: '16px 22px', background: '#ECFDF5', borderBottom: '1px solid #A7F3D0' }}>
                  <div className="parcel-otp-callout">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#10B981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Key size={22} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '14px', color: '#065F46' }}>
                          {t('CONSIGNMENT READY FOR PICKUP & HANDOVER', 'পার্সেল হস্তান্তরের জন্য প্রস্তুত', lang)}
                        </div>
                        <div style={{ fontSize: '12px', color: '#047857', marginTop: '2px' }}>
                          {t('Provide this 4-digit Delivery PIN to Station Reception or Courier to accept goods:', 'পণ্য গ্রহণের জন্য রিসিপশন বা কুরিয়ারকে এই ৪ ডিজিটের পিন কোড দিন:', lang)}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ background: '#fff', border: '2px dashed #059669', padding: '6px 16px', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', color: '#065F46', fontWeight: 700, textTransform: 'uppercase' }}>DELIVERY PIN</div>
                        <div style={{ fontSize: '24px', fontWeight: 900, letterSpacing: '6px', color: '#065F46', fontFamily: 'monospace' }}>
                          {selectedParcel.deliveryOtp}
                        </div>
                      </div>

                      <button
                        className="btn-primary"
                        style={{ height: '46px', padding: '0 20px', fontWeight: 800, background: '#059669', display: 'flex', alignItems: 'center', gap: '6px' }}
                        onClick={() => handleAdvanceStage(selectedParcel.id)}
                      >
                        <UserCheck size={16} />
                        {t('Instant OTP Handshake', 'ওটিপি যাচাই সম্পন্ন করুন', lang)}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── RETURN TO SENDER CALLOUT (If Returned) ── */}
              {selectedParcel.status === 'returned' && selectedParcel.returnDetails && (
                <div style={{ padding: '16px 22px', background: '#FEF2F2', borderBottom: '1px solid #FECACA' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ color: '#DC2626' }}><RotateCcw size={24} /></div>
                      <div>
                        <div style={{ fontWeight: 800, color: '#991B1B', fontSize: '13.5px' }}>
                          RETURN TO ORIGIN (RTO) — {selectedParcel.returnDetails.returnTrackingNo}
                        </div>
                        <div style={{ fontSize: '12px', color: '#7F1D1D' }}>
                          <strong>Reason:</strong> {selectedParcel.returnDetails.reasonText} • "{selectedParcel.returnDetails.notes}"
                        </div>
                      </div>
                    </div>

                    {selectedParcel.returnDetails.returnStage === 2 && selectedParcel.sender.includes(currentUserName) && (
                      <button
                        className="btn-primary"
                        style={{ background: '#DC2626', display: 'flex', alignItems: 'center', gap: '6px' }}
                        onClick={() => handleAdvanceStage(selectedParcel.id)}
                      >
                        <RotateCcw size={14} />
                        {t('Verify Return Receipt (PIN)', 'ফেরত গ্রহণ নিশ্চিত করুন', lang)}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* ── COCKPIT INTERNAL SUB-NAV BAR ── */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--brand-slate-200)', padding: '12px 22px', background: 'var(--brand-slate-50)' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className={`parcel-pill-tab ${cockpitView === 'map' ? 'active' : ''}`}
                    onClick={() => setCockpitView('map')}
                  >
                    <Compass size={13} />
                    {t('Live Transit Corridor', 'লাইভ করিডোর ম্যাপ', lang)}
                  </button>
                  <button
                    className={`parcel-pill-tab ${cockpitView === 'timeline' ? 'active' : ''}`}
                    onClick={() => setCockpitView('timeline')}
                  >
                    <Clock size={13} />
                    {t('Step-by-Step History', 'ধাপভিত্তিক টাইমলাইন', lang)}
                  </button>
                  <button
                    className={`parcel-pill-tab ${cockpitView === 'details' ? 'active' : ''}`}
                    onClick={() => setCockpitView('details')}
                  >
                    <Layers size={13} />
                    {t('Package Specs & Custody', 'পণ্যের স্পেকস ও কাস্টডি', lang)}
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {selectedParcel.status !== 'returned' && selectedParcel.currentStage < 5 && (
                    <button
                      className="btn-sm-ghost"
                      style={{ color: '#DC2626', borderColor: '#FCA5A5', background: '#FFF5F5', fontSize: '11px' }}
                      onClick={handleInitiateReturn}
                    >
                      <RotateCcw size={12} />
                      {t('Report Issue / Return', 'সমস্যা / ফেরত পাঠান', lang)}
                    </button>
                  )}
                  {selectedParcel.tamperStatus !== 'flagged' && selectedParcel.currentStage < 5 && (
                    <button
                      className="btn-outline-danger"
                      style={{ fontSize: '11px', padding: '4px 8px' }}
                      onClick={() => setShowTamperModal(true)}
                    >
                      <AlertTriangle size={12} />
                      {t('Flag Broken Seal', 'সিল ত্রুটি', lang)}
                    </button>
                  )}
                </div>
              </div>

              {/* ── VIEW 1: LIVE TRANSIT CORRIDOR MAP (Simulated Real-Time Route) ── */}
              {cockpitView === 'map' && (
                <div style={{ padding: '22px' }}>
                  <div className="parcel-corridor-map-box">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '13px', color: 'var(--brand-slate-900)' }}>
                          Dhaka HQ ➔ Keraniganj Bitumen Plant Highway Corridor (22.4 km)
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)' }}>
                          Monitored via Automatic Number Plate Recognition (ANPR) & RFID Checkpoints
                        </div>
                      </div>
                      <span className="badge success" style={{ fontSize: '10.5px' }}>
                        ● GPS CORRIDOR ACTIVE
                      </span>
                    </div>

                    {/* Visual Route Corridor */}
                    <div style={{ position: 'relative', height: '110px', margin: '20px 0' }}>
                      <div className="corridor-track-line" />
                      <div
                        className="corridor-progress-line"
                        style={{ width: `calc(${selectedParcel.corridorProgressPercent}% - 50px)` }}
                      />

                      {/* Moving Vehicle Courier Beacon */}
                      {selectedParcel.currentStage >= 2 && selectedParcel.currentStage < 5 && (
                        <div
                          className="corridor-vehicle-beacon"
                          style={{ left: `${selectedParcel.corridorProgressPercent}%` }}
                        >
                          <div className="corridor-vehicle-bubble">
                            <Truck size={16} />
                          </div>
                          <div style={{ background: '#1E293B', color: '#fff', fontSize: '9.5px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', marginTop: '4px', whiteSpace: 'nowrap' }}>
                            {selectedParcel.courier.currentSpeed || 'En Route'}
                          </div>
                        </div>
                      )}

                      {/* Route Node Milestones */}
                      <div className="corridor-nodes-row">
                        <div className={`corridor-node ${selectedParcel.currentStage >= 1 ? 'passed' : ''}`}>
                          <div className="corridor-node-dot">1</div>
                          <div style={{ fontWeight: 700, fontSize: '11px', color: 'var(--brand-slate-800)' }}>Dhaka HQ Gate</div>
                          <div style={{ fontSize: '9.5px', color: 'var(--brand-slate-400)' }}>Baridhara Hub</div>
                        </div>

                        <div className={`corridor-node ${selectedParcel.currentStage >= 2 ? 'passed' : ''}`}>
                          <div className="corridor-node-dot">2</div>
                          <div style={{ fontWeight: 700, fontSize: '11px', color: 'var(--brand-slate-800)' }}>Babubazar Bridge</div>
                          <div style={{ fontSize: '9.5px', color: 'var(--brand-slate-400)' }}>River Crossing</div>
                        </div>

                        <div className={`corridor-node ${selectedParcel.currentStage >= 3 ? 'passed' : ''}`}>
                          <div className="corridor-node-dot">3</div>
                          <div style={{ fontWeight: 700, fontSize: '11px', color: 'var(--brand-slate-800)' }}>Postogola Toll</div>
                          <div style={{ fontSize: '9.5px', color: 'var(--brand-slate-400)' }}>Toll Checkpoint</div>
                        </div>

                        <div className={`corridor-node ${selectedParcel.currentStage >= 4 ? 'passed' : ''}`}>
                          <div className="corridor-node-dot">4</div>
                          <div style={{ fontWeight: 700, fontSize: '11px', color: 'var(--brand-slate-800)' }}>Plant Gate #1</div>
                          <div style={{ fontSize: '9.5px', color: 'var(--brand-slate-400)' }}>Refinery Inward</div>
                        </div>

                        <div className={`corridor-node ${selectedParcel.currentStage === 5 ? 'passed' : ''}`}>
                          <div className="corridor-node-dot">5</div>
                          <div style={{ fontWeight: 700, fontSize: '11px', color: 'var(--brand-slate-800)' }}>Recipient Desk</div>
                          <div style={{ fontSize: '9.5px', color: 'var(--brand-slate-400)' }}>Handover PIN</div>
                        </div>
                      </div>
                    </div>

                    {/* Courier Custody Card (Practical & Actionable!) */}
                    <div style={{ marginTop: '24px', background: '#fff', border: '1px solid var(--brand-slate-200)', borderRadius: 'var(--radius-md)', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#3B82F6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px' }}>
                          {selectedParcel.courier.avatarInitials}
                        </div>
                        <div>
                          <div style={{ fontSize: '11px', color: 'var(--brand-slate-400)', textTransform: 'uppercase', fontWeight: 700 }}>
                            CURRENT CUSTODIAN & COURIER
                          </div>
                          <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--brand-slate-900)' }}>
                            {selectedParcel.courier.name}
                          </div>
                          <div style={{ fontSize: '11.5px', color: 'var(--brand-slate-500)' }}>
                            Vehicle: <strong>{selectedParcel.courier.vehicle}</strong>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <a
                          href={`tel:${selectedParcel.courier.phone}`}
                          className="btn-primary"
                          style={{ textDecoration: 'none', fontSize: '11.5px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '5px' }}
                          onClick={(e) => {
                            e.preventDefault();
                            showToast(`Dialing Courier ${selectedParcel.courier.name}: ${selectedParcel.courier.phone}`, 'info');
                          }}
                        >
                          <Phone size={13} />
                          {selectedParcel.courier.phone}
                        </a>
                        <button
                          className="btn-sm-ghost"
                          style={{ fontSize: '11.5px', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => showToast(`Opening secure internal dispatch chat with ${selectedParcel.courier.name}...`, 'info')}
                        >
                          <MessageSquare size={13} />
                          Chat
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── VIEW 2: STEP-BY-STEP VERTICAL JOURNEY TIMELINE ── */}
              {cockpitView === 'timeline' && (
                <div style={{ padding: '24px' }}>
                  <div className="parcel-vertical-stepper">
                    {STAGES.map((st) => {
                      const isCompleted = st.step < selectedParcel.currentStage;
                      const isCurrent = st.step === selectedParcel.currentStage;
                      const logEntry = selectedParcel.chainOfCustody.find(c => c.stage === st.step);

                      return (
                        <div
                          key={st.step}
                          className={`parcel-step-item ${isCompleted ? 'completed' : isCurrent ? 'current' : ''}`}
                        >
                          <div className="parcel-step-dot">
                            {isCompleted ? <Check size={14} /> : st.step}
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                            <div>
                              <div style={{ fontWeight: 800, fontSize: '13.5px', color: isCurrent ? '#2563EB' : 'var(--brand-slate-900)' }}>
                                {t(st.label, st.labelBn, lang)}
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)', marginTop: '2px' }}>
                                {st.desc}
                              </div>
                            </div>

                            <span className="badge neutral" style={{ fontSize: '10px' }}>
                              {logEntry ? logEntry.timestamp : isCurrent ? 'In Progress' : 'Pending'}
                            </span>
                          </div>

                          {logEntry && (
                            <div style={{ marginTop: '8px', background: 'var(--brand-slate-100)', padding: '8px 12px', borderRadius: '6px', fontSize: '11.5px', border: '1px solid var(--brand-slate-200)' }}>
                              <div>📍 <strong>Location:</strong> {logEntry.location}</div>
                              <div>👤 <strong>Officer:</strong> {logEntry.actor} ({logEntry.actorRole})</div>
                              {logEntry.notes && <div style={{ marginTop: '2px', color: 'var(--brand-slate-700)' }}>"{logEntry.notes}"</div>}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── VIEW 3: PACKAGE DETAILS & SPECIFICATIONS ── */}
              {cockpitView === 'details' && (
                <div style={{ padding: '24px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                    <div style={{ background: '#F8FAFC', border: '1px solid var(--brand-slate-200)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-slate-400)', textTransform: 'uppercase' }}>
                        CONSIGNMENT CONTENT
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--brand-slate-900)', marginTop: '6px' }}>
                        {selectedParcel.contents}
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--brand-slate-500)', marginTop: '8px' }}>
                        Category: <strong>{selectedParcel.category.replace('_', ' ').toUpperCase()}</strong>
                      </div>
                    </div>

                    <div style={{ background: '#F8FAFC', border: '1px solid var(--brand-slate-200)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-slate-400)', textTransform: 'uppercase' }}>
                        WEIGHT & DECLARED VALUE
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--brand-slate-900)', marginTop: '6px' }}>
                        {selectedParcel.weight}
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--brand-slate-600)', marginTop: '4px' }}>
                        Asset Valuation: <strong>{selectedParcel.declaredValue}</strong>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--brand-crimson)', fontWeight: 600, marginTop: '4px' }}>
                        {selectedParcel.specialHandling}
                      </div>
                    </div>

                    <div style={{ background: '#F8FAFC', border: '1px solid var(--brand-slate-200)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-slate-400)', textTransform: 'uppercase' }}>
                        SENDER PARTICULARS
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--brand-slate-900)', marginTop: '6px' }}>
                        {selectedParcel.sender}
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--brand-slate-500)' }}>
                        {selectedParcel.senderDept}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--brand-slate-400)', marginTop: '2px' }}>
                        Origin: {selectedParcel.origin}
                      </div>
                    </div>

                    <div style={{ background: '#F8FAFC', border: '1px solid var(--brand-slate-200)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-slate-400)', textTransform: 'uppercase' }}>
                        RECIPIENT PARTICULARS
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--brand-slate-900)', marginTop: '6px' }}>
                        {selectedParcel.receiver}
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--brand-slate-500)' }}>
                        {selectedParcel.receiverDept}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--brand-slate-400)', marginTop: '2px' }}>
                        Destination: {selectedParcel.destination}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 4. MODALS (Scanner, OTP, Waybill Manifest, RTO Return, Incident) */}
      {/* ─────────────────────────────────────────────────────────────────── */}

      {/* Barcode / RFID Tag Scanner Simulation Modal */}
      {showScannerModal && selectedParcel && (
        <div className="modal-bg" onClick={() => setShowScannerModal(false)}>
          <div className="modal" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-hd" style={{ background: '#0F172A', color: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Camera size={18} color="#FBBF24" />
                <h3 style={{ color: '#fff', margin: 0 }}>
                  {t('Scan Tamper-Evident Security Seal', 'সিকিউরিটি সিল স্ক্যান করুন', lang)}
                </h3>
              </div>
              <button className="modal-close" style={{ color: '#fff' }} onClick={() => setShowScannerModal(false)}>×</button>
            </div>

            <div className="modal-body" style={{ textAlign: 'center' }}>
              <div style={{ border: '2px dashed #3B82F6', borderRadius: '12px', padding: '24px 16px', background: '#F8FAFC', position: 'relative', overflow: 'hidden' }}>
                <div style={{ width: '80%', height: '3px', background: '#DC2626', margin: '0 auto 16px', boxShadow: '0 0 10px #DC2626' }} />
                <QrCode size={90} color="#1E293B" style={{ margin: '0 auto 12px' }} />
                <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '14px', color: '#0F172A' }}>
                  {selectedParcel.sealNo}
                </div>
                <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
                  Waybill: <strong>{selectedParcel.trackingNo}</strong> • SHA-256: <span style={{ fontFamily: 'monospace', color: '#059669' }}>9a8f...21b4 (VALID)</span>
                </div>
              </div>

              <div style={{ marginTop: '16px', fontSize: '12px', color: 'var(--brand-slate-600)', background: '#ECFDF5', padding: '10px 14px', borderRadius: '6px', border: '1px solid #A7F3D0', textAlign: 'left' }}>
                ✓ Barcode recognized. Geo-location verified at <strong>Babubazar / Postogola Toll Transit Post</strong>. Custody will advance to <strong>Stage {selectedParcel.currentStage + 1}</strong>.
              </div>
            </div>

            <div className="modal-ft">
              <button className="btn-sm-ghost" onClick={() => setShowScannerModal(false)}>{t('Cancel', 'বাতিল', lang)}</button>
              <button className="btn-gold" onClick={confirmScannerHandshake}>
                <Check size={14} />
                {t('Confirm Handshake & Advance Stage', 'হ্যান্ডশেক নিশ্চিত করুন', lang)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recipient / Return OTP Verification Modal */}
      {showOtpModal && selectedParcel && (
        <div className="modal-bg" onClick={() => setShowOtpModal(false)}>
          <div className="modal" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-hd" style={{ background: isReturnOtpMode ? '#DC2626' : '#059669', color: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Key size={18} color="#fff" />
                <h3 style={{ color: '#fff', margin: 0 }}>
                  {isReturnOtpMode
                    ? t('Sender Return Receipt PIN Verification', 'প্রেরকের রিটার্ন গ্রহণ পিন যাচাই', lang)
                    : t('Recipient OTP Handover Verification', 'প্রাপকের ওটিপি যাচাই ও ডেলিভারি', lang)}
                </h3>
              </div>
              <button className="modal-close" style={{ color: '#fff' }} onClick={() => setShowOtpModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <div style={{ textAlign: 'center', padding: '10px 0 16px' }}>
                <div style={{ fontSize: '13.5px', color: 'var(--brand-slate-700)', fontWeight: 600 }}>
                  {isReturnOtpMode ? (
                    <>Enter the 4-digit Return PIN issued when <strong>{selectedParcel.trackingNo}</strong> was rejected.</>
                  ) : (
                    <>A 4-digit security PIN was dispatched to <strong>{selectedParcel.receiver}</strong>.</>
                  )}
                </div>
                <div style={{ fontSize: '11.5px', color: '#D97706', marginTop: '6px' }}>
                  (Testing Simulation Hint: <strong>{isReturnOtpMode ? selectedParcel.returnDetails?.returnOtp : selectedParcel.deliveryOtp}</strong> or 1234)
                </div>
              </div>

              <div className="form-group" style={{ textAlign: 'center' }}>
                <label style={{ fontSize: '12px', fontWeight: 700 }}>
                  {isReturnOtpMode ? t('Enter 4-Digit Return PIN', '৪ ডিজিটের রিটার্ন পিন লিখুন', lang) : t('Enter 4-Digit Delivery PIN', '৪ ডিজিটের ডেলিভারি পিন লিখুন', lang)}
                </label>
                <input
                  type="text"
                  maxLength={4}
                  style={{
                    fontSize: '24px',
                    letterSpacing: '12px',
                    textAlign: 'center',
                    padding: '8px',
                    width: '180px',
                    margin: '8px auto 0',
                    fontWeight: 900,
                  }}
                  value={enteredOtp}
                  onChange={(e) => setEnteredOtp(e.target.value)}
                  placeholder="••••"
                  autoFocus
                />
              </div>
            </div>

            <div className="modal-ft">
              <button className="btn-sm-ghost" onClick={() => setShowOtpModal(false)}>{t('Cancel', 'বাতিল', lang)}</button>
              <button className="btn-primary" onClick={confirmOtpDelivery}>
                <Check size={14} />
                {isReturnOtpMode ? t('Acknowledge Return', 'ফেরত গ্রহণ করুন', lang) : t('Confirm Delivery Handover', 'ডেলিভারি সম্পন্ন করুন', lang)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Consignment (RTO) Modal */}
      {showReturnModal && selectedParcel && (
        <div className="modal-bg" onClick={() => setShowReturnModal(false)}>
          <div className="modal" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-hd" style={{ background: '#991B1B', color: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RotateCcw size={18} color="#FCA5A5" />
                <h3 style={{ color: '#fff', margin: 0 }}>
                  {t('Initiate Return Consignment (RTO)', 'পার্সেল ফেরত প্রক্রিয়া (RTO) শুরু করুন', lang)}
                </h3>
              </div>
              <button className="modal-close" style={{ color: '#fff' }} onClick={() => setShowReturnModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <div style={{ background: '#FFF5F5', border: '1px solid #FECACA', borderRadius: '6px', padding: '12px 14px', marginBottom: '16px', fontSize: '12px' }}>
                <div style={{ fontWeight: 700, color: '#991B1B' }}>
                  Waybill: {selectedParcel.trackingNo} • Seal: {selectedParcel.sealNo}
                </div>
                <div style={{ color: '#7F1D1D', marginTop: '2px' }}>
                  {t('Original Sender:', 'মূল প্রেরক:', lang)} <strong>{selectedParcel.sender}</strong> ({selectedParcel.origin})
                </div>
                <div style={{ color: '#7F1D1D' }}>
                  {t('Package:', 'পণ্যের বিবরণ:', lang)} {selectedParcel.contents}
                </div>
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 700, fontSize: '12.5px' }}>
                  {t('Primary Reason for Rejection / Return', 'প্রত্যাখ্যান ও ফেরতের মূল কারণ', lang)} <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value as any)}
                  style={{ fontWeight: 600 }}
                >
                  <option value="tamper_broken">Tamper Seal Compromised / Security Pouch Severed</option>
                  <option value="damaged_contents">Damaged Goods / Solvent or Chemical Leakage</option>
                  <option value="wrong_documents">Incorrect / Mismatched Documents or PO Attached</option>
                  <option value="recipient_refused">Recipient Refused Delivery / Unsanctioned Consignment</option>
                  <option value="recipient_unavailable">Recipient Station Closed / Personnel Transferred</option>
                </select>
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 700, fontSize: '12.5px' }}>
                  {t('Physical Inspection Remarks & Discrepancy Notes', 'শারীরিক পরিদর্শন মন্তব্য ও বিস্তারিত বিবরণ', lang)} <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder={t(
                    'Specify condition of pouch, damaged vials, missing signatures, or reasons for immediate return to sender...',
                    'সিল বা প্যাকেজিংয়ের ত্রুটি, ক্ষয়ক্ষতি বা ফেরতের বিস্তারিত কারণ লিখুন...',
                    lang
                  )}
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 700, fontSize: '12.5px' }}>
                  {t('Reverse Logistics Routing', 'বিপরীত লজিস্টিকস রুট', lang)}
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="rto_courier"
                      checked={returnCourierOption === 'immediate_courier'}
                      onChange={() => setReturnCourierOption('immediate_courier')}
                    />
                    <span><strong>Immediate Reverse Courier Shuttle</strong> (Hand back to courier for direct return)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="rto_courier"
                      checked={returnCourierOption === 'security_quarantine'}
                      onChange={() => setReturnCourierOption('security_quarantine')}
                    />
                    <span><strong>Security Quarantine Locker</strong> (Hold under station guard custody)</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="modal-ft">
              <button className="btn-sm-ghost" onClick={() => setShowReturnModal(false)}>{t('Cancel', 'বাতিল', lang)}</button>
              <button
                className="btn-primary"
                style={{ background: '#991B1B' }}
                onClick={confirmReturnSubmission}
              >
                <RotateCcw size={14} />
                {t('Issue RTO Waybill & Return to Sender', 'রিটার্ন চালান ইস্যু ও ফেরত পাঠান', lang)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tamper Seal Flag Modal */}
      {showTamperModal && selectedParcel && (
        <div className="modal-bg" onClick={() => setShowTamperModal(false)}>
          <div className="modal" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-hd" style={{ background: '#7F1D1D', color: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={18} color="#FCA5A5" />
                <h3 style={{ color: '#fff', margin: 0 }}>
                  {t('Flag Broken Security Seal & Breach Incident', 'সিল ত্রুটি ও নিরাপত্তা লঙ্ঘন রিপোর্ট', lang)}
                </h3>
              </div>
              <button className="modal-close" style={{ color: '#fff' }} onClick={() => setShowTamperModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <div style={{ textAlign: 'center', padding: '10px 0 16px' }}>
                <AlertTriangle size={48} color="#DC2626" style={{ margin: '0 auto 8px' }} />
                <div style={{ fontSize: '14.5px', fontWeight: 800, color: '#991B1B' }}>
                  SECURITY SEAL INTEGRITY BREACH
                </div>
                <div style={{ fontSize: '12px', color: 'var(--brand-slate-600)', marginTop: '4px' }}>
                  Waybill <strong>{selectedParcel.trackingNo}</strong> • Seal <strong>{selectedParcel.sealNo}</strong>
                </div>
              </div>

              <div style={{ background: '#FFF5F5', padding: '12px 14px', borderRadius: '6px', fontSize: '12px', color: '#7F1D1D', marginBottom: '16px' }}>
                Flagging this consignment will automatically dispatch a priority alarm to:
                <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
                  <li>Chief Security Officer (CSO) HQ Desk</li>
                  <li>Keraniganj Bitumen Refinery Gate Post #1</li>
                  <li>Tamper Investigation Ledger (ISO 27001 Protocol)</li>
                </ul>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  className="btn-primary"
                  style={{ background: '#DC2626', justifyContent: 'center' }}
                  onClick={() => {
                    setShowTamperModal(false);
                    setReturnReason('tamper_broken');
                    setShowReturnModal(true);
                  }}
                >
                  <RotateCcw size={14} />
                  {t('Quarantine & Initiate Return to Origin (RTO)', 'কোয়ারেন্টাইন ও অবিলম্বে প্রেরকের নিকট ফেরত', lang)}
                </button>
              </div>
            </div>

            <div className="modal-ft">
              <button className="btn-sm-ghost" onClick={() => setShowTamperModal(false)}>{t('Cancel', 'বাতিল', lang)}</button>
            </div>
          </div>
        </div>
      )}

      {/* Digital Audit Trail Ledger Modal */}
      {showAuditModal && selectedParcel && (
        <div className="modal-bg" onClick={() => setShowAuditModal(false)}>
          <div className="modal" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-hd" style={{ background: '#0F172A', color: '#fff' }}>
              <div>
                <h3 style={{ color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={18} color="#38BDF8" />
                  {t('Digital Chain-of-Custody Audit Ledger', 'ডিজিটাল কাস্টডি অডিট লেজার', lang)}
                </h3>
                <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
                  Waybill: <strong>{selectedParcel.trackingNo}</strong> • Seal: <strong>{selectedParcel.sealNo}</strong>
                </div>
              </div>
              <button className="modal-close" style={{ color: '#fff' }} onClick={() => setShowAuditModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '12px 16px', borderRadius: '6px', marginBottom: '16px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div><strong>Origin:</strong> {selectedParcel.origin}</div>
                  <div><strong>Destination:</strong> {selectedParcel.destination}</div>
                  <div><strong>Security Level:</strong> {selectedParcel.urgency.toUpperCase()}</div>
                </div>
                <div style={{ marginTop: '6px', fontSize: '11px', color: '#64748B' }}>
                  Cryptographic Integrity Verification: <span style={{ color: '#059669', fontWeight: 700 }}>● SHA-256 Validated</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {selectedParcel.chainOfCustody.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px', color: '#64748B', fontSize: '12px' }}>
                    No historical logs recorded.
                  </div>
                ) : (
                  selectedParcel.chainOfCustody.map((log, index) => (
                    <div
                      key={index}
                      style={{
                        borderLeft: '3px solid #3B82F6',
                        paddingLeft: '14px',
                        position: 'relative',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontWeight: 800, fontSize: '13px', color: 'var(--brand-slate-900)' }}>
                          {log.stageName}
                        </div>
                        <span className="badge neutral" style={{ fontSize: '10px' }}>{log.timestamp}</span>
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--brand-slate-600)', marginTop: '2px' }}>
                        📍 <strong>Location:</strong> {log.location}
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--brand-slate-600)' }}>
                        👤 <strong>Logged By:</strong> {log.actor} ({log.actorRole})
                      </div>
                      {log.notes && (
                        <div style={{ fontSize: '11.5px', color: 'var(--brand-slate-700)', background: '#F1F5F9', padding: '6px 10px', borderRadius: '4px', marginTop: '4px' }}>
                          "{log.notes}"
                        </div>
                      )}
                      {log.securityHash && (
                        <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#64748B', marginTop: '3px' }}>
                          Hash: {log.securityHash}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="modal-ft">
              <button className="btn-sm-ghost" onClick={() => setShowAuditModal(false)}>{t('Close', 'বন্ধ করুন', lang)}</button>
              <button
                className="btn-primary"
                onClick={() => {
                  showToast(t(`Audit Ledger for ${selectedParcel.trackingNo} exported for Board review.`, `বোর্ড পর্যালোচনার জন্য অডিট লেজার রপ্তানি সম্পন্ন।`, lang), 'success');
                  setShowAuditModal(false);
                }}
              >
                <Download size={14} />
                {t('Export Board Audit PDF', 'বোর্ড অডিট কপি ডাউনলোড', lang)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Waybill Manifest Modal */}
      {showManifestModal && selectedParcel && (
        <div className="modal-bg" onClick={() => setShowManifestModal(false)}>
          <div className="modal" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-hd" style={{ background: '#1E293B', color: '#fff' }}>
              <div>
                <h3 style={{ color: '#fff', margin: 0 }}>
                  {t('Official Inter-Office Consignment Manifest', 'অফিসিয়াল চালান স্লিপ ও ডেলিভারি চালান', lang)}
                </h3>
                <div style={{ fontSize: '11px', color: '#94A3B8' }}>{selectedParcel.trackingNo}</div>
              </div>
              <button className="modal-close" style={{ color: '#fff' }} onClick={() => setShowManifestModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <div style={{ border: '2px solid #CBD5E1', padding: '18px', borderRadius: '4px', background: '#FFF' }}>
                <div style={{ textAlign: 'center', borderBottom: '2px solid #0F172A', paddingBottom: '12px', marginBottom: '14px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 900, color: 'var(--brand-crimson)' }}>
                    BASHUNDHARA OIL AND GAS COMPANY LIMITED
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>Corporate Dispatch & Secure Document Transit Desk</div>
                  <div style={{ fontSize: '12px', fontWeight: 800, marginTop: '4px', letterSpacing: '0.5px' }}>
                    TAMPER-EVIDENT WAYBILL & SECURITY CUSTODY CERTIFICATE
                  </div>
                </div>

                <div className="responsive-col-2-eq" style={{ gap: '10px', fontSize: '11.5px', marginBottom: '14px' }}>
                  <div><strong>Waybill No:</strong> {selectedParcel.trackingNo}</div>
                  <div><strong>Tamper Seal:</strong> {selectedParcel.sealNo}</div>
                  <div><strong>Origin:</strong> {selectedParcel.origin}</div>
                  <div><strong>Destination:</strong> {selectedParcel.destination}</div>
                  <div><strong>Sender:</strong> {selectedParcel.sender} ({selectedParcel.senderDept})</div>
                  <div><strong>Receiver:</strong> {selectedParcel.receiver} ({selectedParcel.receiverDept})</div>
                  <div><strong>Package Weight:</strong> {selectedParcel.weight}</div>
                  <div><strong>Declared Value:</strong> {selectedParcel.declaredValue}</div>
                </div>

                <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '10px', fontSize: '12px', marginBottom: '14px' }}>
                  <strong>Package Description:</strong> {selectedParcel.contents}
                  <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                    Special Handling Instructions: <strong>{selectedParcel.specialHandling}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E2E8F0', paddingTop: '14px' }}>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>
                    Security Seal Barcode Verification:<br />
                    <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#0F172A' }}>*{selectedParcel.trackingNo}*</span>
                    <div style={{ fontSize: '10px', marginTop: '2px' }}>BOGCL OneOps Automated Log: {selectedParcel.lastUpdated}</div>
                  </div>
                  <QrCode size={56} color="#0F172A" />
                </div>
              </div>
            </div>

            <div className="modal-ft">
              <button className="btn-sm-ghost" onClick={() => setShowManifestModal(false)}>{t('Close', 'বন্ধ করুন', lang)}</button>
              <button
                className="btn-primary"
                onClick={() => {
                  showToast(t(`Waybill ${selectedParcel.trackingNo} sent to printer.`, `চালান প্রিন্টারে পাঠানো হয়েছে।`, lang), 'success');
                  setShowManifestModal(false);
                }}
              >
                <Printer size={14} />
                {t('Print Official Manifest', 'চালান প্রিন্ট করুন', lang)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Register New Consignment Modal */}
      {showNewModal && (
        <div className="modal-bg" onClick={() => setShowNewModal(false)}>
          <div className="modal" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-hd">
              <h3>
                <Package size={18} />
                {t('Dispatch New Tamper-Evident Consignment', 'নতুন পার্সেল ডেসপ্যাচ এন্ট্রি', lang)}
              </h3>
              <button className="modal-close" onClick={() => setShowNewModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '10px 14px', borderRadius: '6px', marginBottom: '14px', fontSize: '12px' }}>
                <span style={{ color: '#64748B' }}>{t('Consignment Originator (Sender):', 'প্রেরকের বিবরণ:', lang)} </span>
                <strong style={{ color: 'var(--brand-slate-900)' }}>{currentUserName}</strong>
                <span style={{ color: '#64748B' }}> ({currentUserDept})</span>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label>{t('Recipient Name & Officer', 'প্রাপকের নাম ও পদবি', lang)} <span style={{ color: '#DC2626' }}>*</span></label>
                  <input
                    type="text"
                    placeholder="e.g. Engr. Md. Harunur Rashid (Plant GM)"
                    value={newRecipient}
                    onChange={(e) => setNewRecipient(e.target.value)}
                    list="personnel-list"
                  />
                  <datalist id="personnel-list">
                    <option value="Engr. Md. Harunur Rashid (Plant General Manager)" />
                    <option value="Farida Begum (Chief Financial Officer)" />
                    <option value="Dr. Rafiqul Huq (QC Head, Central Lab)" />
                    <option value="Sayeda Afroza Sultana (GM, HR & Admin)" />
                    <option value="Md. Kamruzzaman (Transport & Security Supervisor)" />
                    <option value="Director of Marketing & Sales (Dhaka HQ)" />
                  </datalist>
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label>{t('Recipient Department', 'প্রাপকের বিভাগ', lang)}</label>
                  <input
                    type="text"
                    placeholder="e.g. Keraniganj Bitumen Refinery"
                    value={newRecipientDept}
                    onChange={(e) => setNewRecipientDept(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label>{t('Origin Facility', 'প্রেরক শাখা', lang)}</label>
                  <select value={newOrigin} onChange={(e) => setNewOrigin(e.target.value)}>
                    <option value="Bashundhara Corporate HQ, Baridhara">Bashundhara Corporate HQ, Baridhara</option>
                    <option value="Keraniganj Bitumen Refinery Complex">Keraniganj Bitumen Refinery Complex</option>
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>{t('Destination Facility', 'গন্তব্য শাখা', lang)}</label>
                  <select value={newDestination} onChange={(e) => setNewDestination(e.target.value)}>
                    <option value="Keraniganj Bitumen Refinery Complex">Keraniganj Bitumen Refinery Complex</option>
                    <option value="Bashundhara Corporate HQ, Baridhara">Bashundhara Corporate HQ, Baridhara</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label>{t('Category of Content', 'পণ্যের শ্রেণিবিভাগ', lang)}</label>
                  <select value={newCategory} onChange={(e) => setNewCategory(e.target.value as any)}>
                    <option value="legal_docs">Legal, L/C & Commercial Contracts</option>
                    <option value="qc_sample">Refinery Lab Chemical & Bitumen Samples</option>
                    <option value="refinery_spares">Critical Spare Parts & Instrumentation</option>
                    <option value="tender_bid">Sealed Tender Bids & RHD Proposals</option>
                    <option value="it_hardware">IT Hardware & Cryptographic Tokens</option>
                  </select>
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label>{t('Priority / Security Level', 'নিরাপত্তা অগ্রাধিকার', lang)}</label>
                  <select value={newUrgency} onChange={(e) => setNewUrgency(e.target.value as any)}>
                    <option value="critical">Critical / Confidential (Armed Escort & Biometric PIN)</option>
                    <option value="high">High Priority (Same Day Transit Corridor)</option>
                    <option value="normal">Normal (Routine Inter-Office Shuttle)</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label>{t('Weight (kg)', 'ওজন (কেজি)', lang)}</label>
                  <input
                    type="text"
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                    placeholder="e.g. 0.75 kg"
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>{t('Declared Asset Value', 'ঘোষিত মূল্য', lang)}</label>
                  <input
                    type="text"
                    value={newDeclaredValue}
                    onChange={(e) => setNewDeclaredValue(e.target.value)}
                    placeholder="e.g. BDT 45,000"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>{t('Contents Description & Sealed Items', 'পণ্যের বিস্তারিত বিবরণ ও নথির তালিকা', lang)} <span style={{ color: '#DC2626' }}>*</span></label>
                <textarea
                  rows={2}
                  placeholder="Specify confidential documents, sample vials, or spare part serial numbers..."
                  value={newContents}
                  onChange={(e) => setNewContents(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>{t('Special Handling & Safety Instructions', 'বিশেষ সতর্কতা ও নির্দেশনা', lang)}</label>
                <input
                  type="text"
                  value={newHandlingNotes}
                  onChange={(e) => setNewHandlingNotes(e.target.value)}
                  placeholder="e.g. Keep Upright • Temperature Controlled • Fragile Glass"
                />
              </div>
            </div>

            <div className="modal-ft">
              <button className="btn-sm-ghost" onClick={() => setShowNewModal(false)}>{t('Cancel', 'বাতিল', lang)}</button>
              <button className="btn-primary" onClick={handleCreateParcel}>
                <Lock size={14} />
                {t('Issue Tamper Seal & Log Consignment', 'সিল জারি ও বুকিং সম্পন্ন করুন', lang)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
