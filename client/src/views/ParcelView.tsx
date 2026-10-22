import React, { useState, useMemo } from 'react';
import { ViewProps, ROLE_META, t } from '../types';
import { showToast } from '../App';
import {
  Package, CheckCircle, Clock, MapPin, QrCode, ShieldCheck,
  AlertTriangle, ArrowRight, UserCheck, Search, Plus, Lock,
  Camera, Printer, Key, Check, Eye, Download, ShieldAlert,
  FileText, ExternalLink, RefreshCw, Inbox, Send, RotateCcw,
  Truck, ArrowUpRight, ArrowDownLeft, AlertCircle, Building,
  Hash, Shield, User, Filter, CheckSquare, X
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
  dispatchedBy: string;
  tamperStatus: 'secure' | 'inspected' | 'flagged';
  deliveryOtp: string;
  chainOfCustody: CustodyLogEntry[];
  returnDetails?: ReturnDetails;
}

// ─────────────────────────────────────────────────────────────────────────────
// INITIAL ENTERPRISE PARCELS SEED DATA
// Fully segmented with realistic personal consignments for Tanvir Ahmed (Staff)
// and administrative manifests for leadership oversight
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

  // ── 2. INCOMING TO TANVIR AHMED (Delivered & Verified) ──
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

  // ── 3. INCOMING TO TANVIR AHMED (Delivered & Verified) ──
  {
    id: 'P-TA-03',
    trackingNo: 'BOGCL-WB-2026-8910',
    sealNo: 'TAMPER-SEAL #BG-99380',
    sender: 'Md. Kamruzzaman',
    senderDept: 'Admin & Transport Division',
    origin: 'HQ Transport & Security Counter',
    receiver: 'Tanvir Ahmed',
    receiverDept: 'Sales & Distribution, Dhaka',
    destination: 'Bashundhara Corporate HQ, Level 4',
    contents: 'Annual Refinery Gate RFID Access Smartcard & Fire-Retardant PPE Safety Gear Pack',
    category: 'it_hardware',
    weight: '2.50 kg',
    declaredValue: 'BDT 15,000',
    specialHandling: 'Standard Secure Parcel Box',
    urgency: 'normal',
    currentStage: 5,
    status: 'delivered',
    lastUpdated: '19 Oct 2026, 11:20 AM',
    dispatchedBy: 'HQ Logistics Counter #1',
    tamperStatus: 'secure',
    deliveryOtp: '5124',
    chainOfCustody: [
      {
        stage: 1,
        stageName: 'Despatch Logged',
        stageNameBn: 'ডেসপ্যাচ এন্ট্রি',
        location: 'HQ Logistics Counter #1',
        timestamp: '19 Oct 2026, 09:00 AM',
        actor: 'Md. Kamruzzaman',
        actorRole: 'Transport Supervisor',
        securityHash: 'sha256:5524a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0',
      },
      {
        stage: 5,
        stageName: 'Recipient Verified',
        stageNameBn: 'প্রাপকের নিকট হস্তান্তর সম্পন্ন',
        location: 'Dhaka HQ Level 4',
        timestamp: '19 Oct 2026, 11:20 AM',
        actor: 'Tanvir Ahmed',
        actorRole: 'Recipient',
        notes: 'PPE uniform and RFID card received.',
        securityHash: 'sha256:7724b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0',
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
      courierName: 'Courier Van #02 (Driver Kalam)',
    },
  },

  // ── 5. OUTBOUND SENT BY TANVIR AHMED (In-Transit to Keraniganj) ──
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
        notes: 'Vehicle reached Southern Toll corridor. ETA Keraniganj: 35 mins.',
        securityHash: 'sha256:8218c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0',
      },
    ],
  },

  // ── 6. OUTBOUND SENT BY TANVIR AHMED (Delivered & Verified) ──
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
    dispatchedBy: 'Internal HQ Messenger Service',
    tamperStatus: 'secure',
    deliveryOtp: '8832',
    chainOfCustody: [
      {
        stage: 1,
        stageName: 'Despatch Logged',
        stageNameBn: 'ডেসপ্যাচ এন্ট্রি',
        location: 'Sales Dept Counter Level 4',
        timestamp: '20 Oct 2026, 01:30 PM',
        actor: 'Tanvir Ahmed',
        actorRole: 'Sender',
        securityHash: 'sha256:8832a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0',
      },
      {
        stage: 5,
        stageName: 'Recipient Verified',
        stageNameBn: 'প্রাপকের নিকট হস্তান্তর সম্পন্ন',
        location: 'Level 11 Marketing Directorate',
        timestamp: '20 Oct 2026, 03:00 PM',
        actor: 'Executive Secretary to Marketing Director',
        actorRole: 'Recipient Authorized Agent',
        notes: 'Handover completed and signed with OTP 8832.',
        securityHash: 'sha256:9832b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0',
      },
    ],
  },

  // ── 7. OUTBOUND SENT BY TANVIR AHMED (In-Transit / Driver Handover) ──
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
    dispatchedBy: 'HQ Logistics Bay',
    tamperStatus: 'secure',
    deliveryOtp: '1943',
    chainOfCustody: [
      {
        stage: 1,
        stageName: 'Despatch Logged',
        stageNameBn: 'ডেসপ্যাচ এন্ট্রি',
        location: 'HQ Baridhara Logistics Desk',
        timestamp: 'Today, 08:30 AM',
        actor: 'Tanvir Ahmed',
        actorRole: 'Sender',
        securityHash: 'sha256:1943a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0',
      },
      {
        stage: 2,
        stageName: 'Driver Handover',
        stageNameBn: 'ড্রাইভার হস্তান্তর',
        location: 'HQ Baridhara Vehicle Bay',
        timestamp: 'Today, 09:15 AM',
        actor: 'Driver Anwar Hossain (Pickup #BOGCL-09)',
        actorRole: 'Inter-Office Shuttle Courier',
        notes: 'Handover complete. En route to Keraniganj plant.',
        securityHash: 'sha256:2943b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0',
      },
    ],
  },

  // ── 8. OTHER CORPORATE CONSIGNMENTS (Visible only in Master Manifest for Leadership/Admin) ──
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
    dispatchedBy: 'Md. Kamruzzaman (Admin)',
    tamperStatus: 'secure',
    deliveryOtp: '7482',
    chainOfCustody: [],
  },
  {
    id: 'P-GEN-02',
    trackingNo: 'BOGCL-WB-2026-8819',
    sealNo: 'TAMPER-SEAL #BG-99418',
    sender: 'Dr. Rafiqul Huq (QC Head)',
    senderDept: 'Central Quality Lab, Keraniganj',
    origin: 'Keraniganj Bitumen Plant',
    receiver: 'Director of Marketing & Sales',
    receiverDept: 'Corporate Head Office, Dhaka',
    destination: 'Dhaka Corporate HQ',
    contents: 'Certified Lab Test Reports (Ductility, Penetration Grade 60/70) for RHD Highway Tender',
    category: 'tender_bid',
    weight: '0.45 kg',
    declaredValue: 'Confidential Tender Asset',
    specialHandling: 'Tamper Evident Envelope',
    urgency: 'high',
    currentStage: 4,
    status: 'at_gate',
    lastUpdated: '17 Oct 2026, 04:30 PM',
    dispatchedBy: 'Keraniganj Gate Post #1',
    tamperStatus: 'secure',
    deliveryOtp: '3914',
    chainOfCustody: [],
  },
  {
    id: 'P-GEN-03',
    trackingNo: 'BOGCL-WB-2026-8824',
    sealNo: 'TAMPER-SEAL #BG-99430',
    sender: 'Procurement Specialist',
    senderDept: 'Supply Chain Division',
    origin: 'Dhaka Corporate HQ',
    receiver: 'Instrument Engineer',
    receiverDept: 'Bitumen Unit-2 Maintenance',
    destination: 'Keraniganj Plant',
    contents: 'Emergency Siemens Micro-PLC Interface Card for Reactor Temperature Controller',
    category: 'refinery_spares',
    weight: '1.80 kg',
    declaredValue: 'EUR 8,500',
    specialHandling: 'Electrostatic Sensitive • Anti-Static Bag',
    urgency: 'critical',
    currentStage: 2,
    status: 'in_transit',
    lastUpdated: '17 Oct 2026, 02:00 PM',
    dispatchedBy: 'Despatch Counter HQ',
    tamperStatus: 'secure',
    deliveryOtp: '5521',
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

  // Toggle for Admin / Leadership oversight: "My Parcels" vs "Master Corporate Manifest"
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
  // Filtered Parcels based on Staff Partitioning & Active Tab
  // ─────────────────────────────────────────────────────────────────────────
  const scopedParcels = useMemo(() => {
    // If staff (employee), STRICTLY partition to parcels where user is sender or receiver
    if (isStaff || scopeMode === 'personal') {
      return parcels.filter(p =>
        p.sender.toLowerCase().includes(currentUserName.toLowerCase()) ||
        p.receiver.toLowerCase().includes(currentUserName.toLowerCase())
      );
    }
    // If Admin / Leadership and master mode is enabled, show all
    return parcels;
  }, [parcels, isStaff, scopeMode, currentUserName]);

  // Selected Parcel (default to first of scoped list)
  const [selectedParcelId, setSelectedParcelId] = useState<string>(scopedParcels[0]?.id || 'P-TA-01');

  // Keep selected parcel in sync
  const selectedParcel = useMemo(() => {
    return parcels.find(p => p.id === selectedParcelId) || scopedParcels[0] || parcels[0];
  }, [parcels, selectedParcelId, scopedParcels]);

  // ─────────────────────────────────────────────────────────────────────────
  // Computed Statistics for the current user
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
  // Filtered List based on tab, search, and urgency
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
  // Actions
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
      // Step 5 requires OTP verification
      setIsReturnOtpMode(false);
      setShowOtpModal(true);
      return;
    }
    // Step 2, 3, 4 use Scanner Handshake
    setShowScannerModal(true);
  };

  const confirmScannerHandshake = () => {
    if (!selectedParcel) return;
    setParcels(prev => prev.map(p => {
      if (p.id === selectedParcel.id && p.currentStage < 5 && p.status !== 'returned') {
        const nextStage = p.currentStage + 1;
        const newStatus: ParcelItem['status'] = nextStage === 4 ? 'at_gate' : 'in_transit';
        const newHash = `sha256:${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
        
        const newLog: CustodyLogEntry = {
          stage: nextStage,
          stageName: STAGES[nextStage - 1].label,
          stageNameBn: STAGES[nextStage - 1].labelBn,
          location: nextStage === 3 ? 'Babubazar / Postogola Toll Transit Post' : 'Station Security Desk',
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
      // Return verification by original sender
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

    // Normal Delivery OTP
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
          lastUpdated: 'Just Now',
          chainOfCustody: [...p.chainOfCustody, newLog],
        };
      }
      return p;
    }));

    setShowOtpModal(false);
    setEnteredOtp('');
    showToast(t(`Handover successful! Consignment ${selectedParcel.trackingNo} confirmed delivered to ${selectedParcel.receiver}.`, `হস্তান্তর সফল! পার্সেল সফলভাবে প্রাপকের নিকট হস্তান্তর করা হয়েছে।`, lang), 'success');
  };

  // ── RETURN / RTO WORKFLOW ──
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
          returnDetails: newReturn,
          chainOfCustody: [...p.chainOfCustody, newLog],
        };
      }
      return p;
    }));

    setShowReturnModal(false);
    showToast(t(`Return Consignment ${rtoTrackingNo} initiated. Reverse logistics courier dispatched back to ${selectedParcel.sender}.`, `ফেরত চালান ${rtoTrackingNo} সফলভাবে ইস্যু হয়েছে। প্রেরকের নিকট ফেরত পাঠানো হচ্ছে।`, lang), 'gold');
  };

  // ── TAMPER / FLAG SEAL ALERT ──
  const handleOpenTamperModal = () => {
    setShowTamperModal(true);
  };

  const confirmTamperQuarantine = () => {
    if (!selectedParcel) return;
    setParcels(prev => prev.map(p => {
      if (p.id === selectedParcel.id) {
        const newLog: CustodyLogEntry = {
          stage: p.currentStage,
          stageName: 'Security Breach Flagged & Quarantined',
          stageNameBn: 'নিরাপত্তা ত্রুটি ও কোয়ারেন্টাইন',
          location: p.destination,
          timestamp: 'Just Now',
          actor: currentUserName,
          actorRole: 'Staff / Inspection Officer',
          notes: 'Tamper seal flagged. Plant Gate #1 Security and Chief Security Officer notified.',
          securityHash: `sha256:tamper_${Math.random().toString(36).substring(2, 15)}`,
        };
        return {
          ...p,
          tamperStatus: 'flagged',
          lastUpdated: 'Just Now',
          chainOfCustody: [...p.chainOfCustody, newLog],
        };
      }
      return p;
    }));
    setShowTamperModal(false);
    showToast(t('SECURITY ALERT ISSUED: Chief Security Officer & Keraniganj Gate alerted. Seal quarantined.', 'নিরাপত্তা অ্যালার্ট জারি: চিফ সিকিউরিটি অফিসার ও গেটকে অবহিত করা হয়েছে।', lang), 'danger');
  };

  // ── CREATE NEW CONSIGNMENT ──
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
    <div style={{ paddingBottom: '40px' }}>
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. Header Bar with Enterprise Controls */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="flex-between mb-4" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--brand-slate-900)', margin: 0 }}>
              {t('Inter-Office Parcel & Secure Waybill Tracker', 'আন্তঃঅফিস পার্সেল ও ওয়েবিল ট্র্যাকিং সিস্টেম', lang)}
            </h2>
            <span className="badge success" style={{ fontSize: '10.5px', textTransform: 'uppercase' }}>
              ISO 27001 CHAIN-OF-CUSTODY
            </span>
          </div>
          <p className="text-muted" style={{ margin: '4px 0 0', fontSize: '12.5px' }}>
            {t(
              'Tamper-Evident Chain of Custody & Reverse Logistics (RTO) between Dhaka HQ & Keraniganj Bitumen Refinery',
              'ঢাকা সদর দপ্তর ও কেরানীগঞ্জ রিফাইনারির মধ্যে বারকোড নিরাপত্তা ও রিটার্ন (RTO) লজিস্টিকস',
              lang
            )}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Admin toggle if not staff */}
          {!isStaff && (
            <div style={{ display: 'flex', background: 'var(--brand-slate-200)', borderRadius: '6px', padding: '2px' }}>
              <button
                className={`btn-sm-ghost ${scopeMode === 'personal' ? 'active' : ''}`}
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: '4px',
                  background: scopeMode === 'personal' ? '#FFF' : 'transparent',
                  color: scopeMode === 'personal' ? 'var(--brand-slate-900)' : 'var(--brand-slate-600)',
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
                  borderRadius: '4px',
                  background: scopeMode === 'master' ? '#FFF' : 'transparent',
                  color: scopeMode === 'master' ? 'var(--brand-slate-900)' : 'var(--brand-slate-600)',
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

      {/* Staff Identity & Privacy Indicator */}
      <div
        style={{
          background: isStaff ? 'rgba(59, 130, 246, 0.08)' : 'rgba(16, 185, 129, 0.08)',
          border: `1px solid ${isStaff ? 'rgba(59, 130, 246, 0.25)' : 'rgba(16, 185, 129, 0.25)'}`,
          borderRadius: 'var(--radius-md)',
          padding: '10px 16px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: isStaff ? '#3B82F6' : '#10B981',
              color: '#FFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '11px',
            }}
          >
            {currentUser.initials}
          </div>
          <div>
            <span style={{ fontWeight: 700, color: 'var(--brand-slate-900)' }}>
              {currentUserName} ({currentUserDept})
            </span>
            <span style={{ color: 'var(--brand-slate-500)', marginLeft: '6px' }}>
              {isStaff ? (
                <>• <strong>{t('Staff Personal Workspace', 'কর্মী ব্যক্তিগত ওয়ার্কস্পেস', lang)}:</strong> {t('Displaying your private inbound & outbound consignments only.', 'শুধুমাত্র আপনার নিজস্ব আসা ও পাঠানো পার্সেল প্রদর্শিত হচ্ছে।', lang)}</>
              ) : (
                <>• <strong>{currentUser.label}:</strong> {scopeMode === 'personal' ? t('Viewing your consignments.', 'আপনার পার্সেল দেখা হচ্ছে।', lang) : t('Viewing enterprise master manifests across terminals.', 'সকল টার্মিনালের মাস্টার চালান দেখা হচ্ছে।', lang)}</>
              )}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--brand-slate-500)' }}>
          <Shield size={13} color="#059669" />
          <span>{t('AES-256 Tamper Pouch Tracking Active', 'এএইএস-২৫৬ বারকোড ট্র্যাকিং সক্রিয়', lang)}</span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. Rich 5-KPI Statistics Cards Dashboard */}
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
      {/* 3. Selected Parcel Deep-Dive Inspector Card */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {selectedParcel && (
        <div className="card mb-5">
          <div className="card-hd" style={{ flexWrap: 'wrap', gap: '10px' }}>
            <div className="card-hd-left">
              <div
                className="card-hd-icon"
                style={{
                  background: selectedParcel.status === 'returned' ? '#FEF2F2' : undefined,
                  color: selectedParcel.status === 'returned' ? '#DC2626' : undefined,
                }}
              >
                {selectedParcel.status === 'returned' ? <RotateCcw size={18} /> : <Package size={18} />}
              </div>
              <div>
                <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span>{selectedParcel.trackingNo}</span>
                  <span style={{ color: 'var(--brand-slate-400)', fontWeight: 400 }}>•</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--brand-slate-600)' }}>
                    {selectedParcel.sealNo}
                  </span>
                  {selectedParcel.status === 'returned' && (
                    <span className="badge danger" style={{ fontSize: '10.5px' }}>
                      <RotateCcw size={10} style={{ marginRight: '4px' }} />
                      RETURN TO ORIGIN (RTO)
                    </span>
                  )}
                  {selectedParcel.tamperStatus === 'flagged' && (
                    <span className="badge danger" style={{ fontSize: '10.5px' }}>
                      <AlertTriangle size={10} style={{ marginRight: '4px' }} />
                      SEAL COMPROMISED
                    </span>
                  )}
                </div>
                <div className="card-subtitle">
                  {t('Origin:', 'উৎস:', lang)} <strong>{selectedParcel.origin}</strong> ➔ {t('Destination:', 'গন্তব্য:', lang)} <strong>{selectedParcel.destination}</strong>
                </div>
              </div>
            </div>

            <div className="flex-gap" style={{ flexWrap: 'wrap' }}>
              <button
                className="btn-sm-ghost"
                style={{ fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '5px' }}
                onClick={() => setShowAuditModal(true)}
              >
                <FileText size={13} />
                {t('Audit Trail Ledger', 'অডিট লেজার', lang)}
              </button>

              <button
                className="btn-sm-ghost"
                style={{ fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '5px' }}
                onClick={() => setShowManifestModal(true)}
              >
                <Printer size={13} />
                {t('Waybill Manifest', 'চালান স্লিপ', lang)}
              </button>

              <span className={`badge ${selectedParcel.urgency === 'critical' ? 'danger' : selectedParcel.urgency === 'high' ? 'warn' : 'neutral'}`}>
                {selectedParcel.urgency.toUpperCase()} PRIORITY
              </span>

              {/* Broken Seal Button */}
              {selectedParcel.tamperStatus !== 'flagged' && selectedParcel.status !== 'returned' && selectedParcel.currentStage < 5 && (
                <button
                  className="btn-outline-danger"
                  onClick={handleOpenTamperModal}
                  style={{ fontSize: '11px', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <AlertTriangle size={12} />
                  {t('Flag Broken Seal', 'সিল ত্রুটি রিপোর্ট', lang)}
                </button>
              )}

              {/* Initiate Return / RTO Button */}
              {selectedParcel.status !== 'returned' && selectedParcel.currentStage < 5 && (
                <button
                  className="btn-sm-ghost"
                  onClick={handleInitiateReturn}
                  style={{
                    fontSize: '11px',
                    padding: '5px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: '#DC2626',
                    borderColor: '#FCA5A5',
                    background: '#FFF5F5',
                  }}
                  title={t('Reject consignment and return to origin sender', 'পার্সেল প্রত্যাখ্যান ও প্রেরকের নিকট ফেরত পাঠান', lang)}
                >
                  <RotateCcw size={12} />
                  {t('Initiate Return (RTO)', 'ফেরত পাঠান (RTO)', lang)}
                </button>
              )}
            </div>
          </div>

          <div className="card-body">
            {/* ── Return Warning Banner if Parcel has RTO active ── */}
            {selectedParcel.status === 'returned' && selectedParcel.returnDetails && (
              <div
                style={{
                  background: '#FEF2F2',
                  border: '1px solid #F87171',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px 18px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ color: '#DC2626', marginTop: '2px' }}><AlertTriangle size={20} /></div>
                  <div>
                    <div style={{ fontWeight: 800, color: '#991B1B', fontSize: '13.5px' }}>
                      {t('RETURN CONSIGNMENT IN REVERSE LOGISTICS', 'ফেরত প্রক্রিয়াধীন চালান (RTO)', lang)} — {selectedParcel.returnDetails.returnTrackingNo}
                    </div>
                    <div style={{ fontSize: '12px', color: '#7F1D1D', marginTop: '3px' }}>
                      <strong>{t('Reason for Return:', 'ফেরতের কারণ:', lang)}</strong> {selectedParcel.returnDetails.reasonText}
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#991B1B', marginTop: '2px' }}>
                      <strong>{t('Discrepancy Notes:', 'পরিদর্শন মন্তব্য:', lang)}</strong> "{selectedParcel.returnDetails.notes}"
                    </div>
                    <div style={{ fontSize: '11px', color: '#B91C1C', marginTop: '4px' }}>
                      Initiated by <strong>{selectedParcel.returnDetails.initiatedBy}</strong> • Reverse Courier: <strong>{selectedParcel.returnDetails.courierName}</strong>
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right', minWidth: '150px' }}>
                  <span className="badge danger" style={{ fontSize: '11px' }}>
                    {selectedParcel.returnDetails.returnStage === 3 ? t('Returned & Resolved', 'ফেরত সম্পন্ন', lang) : t('Reverse Transit Active', 'ফেরত ট্রানজিটে আছে', lang)}
                  </span>
                  <div style={{ fontSize: '11px', color: '#7F1D1D', marginTop: '6px' }}>
                    Return PIN: <strong style={{ letterSpacing: '2px' }}>{selectedParcel.returnDetails.returnOtp}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* ── Visual Timeline: Standard 5-Stage vs Return 3-Stage ── */}
            {selectedParcel.status === 'returned' && selectedParcel.returnDetails ? (
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                  {t('Reverse Logistics (RTO) Chain-of-Custody Timeline', 'রিটার্ন লজিস্টিকস (RTO) চেইন অব কাস্টডি টাইমলাইন', lang)}
                </div>
                <div className="parcel-timeline">
                  {RETURN_STAGES.map((st) => {
                    const isDone = st.step < (selectedParcel.returnDetails?.returnStage || 1);
                    const isActive = st.step === (selectedParcel.returnDetails?.returnStage || 1);
                    return (
                      <div key={st.step} className={`timeline-point ${isDone ? 'done' : ''} ${isActive ? 'returned active' : ''}`}>
                        <div className="tl-circle">
                          {isDone ? <CheckCircle size={16} /> : st.step}
                        </div>
                        <div className="tl-label">{t(st.label, st.labelBn, lang)}</div>
                        <div className="tl-sub">{st.desc}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--brand-slate-500)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                  {t('Inter-Office Custody Stage Timeline (Dhaka HQ ➔ Keraniganj Plant)', 'আন্তঃঅফিস কাস্টডি টাইমলাইন (হেড অফিস ➔ কেরানীগঞ্জ প্ল্যান্ট)', lang)}
                </div>
                <div className="parcel-timeline">
                  {STAGES.map((st) => {
                    const isDone = st.step < selectedParcel.currentStage;
                    const isActive = st.step === selectedParcel.currentStage;
                    return (
                      <div key={st.step} className={`timeline-point ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}`}>
                        <div className="tl-circle">
                          {isDone ? <CheckCircle size={16} /> : st.step}
                        </div>
                        <div className="tl-label">{t(st.label, st.labelBn, lang)}</div>
                        <div className="tl-sub">{st.desc}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Consignment Deep-Dive Information Grid ── */}
            <div
              className="responsive-col-2"
              style={{
                marginTop: '16px',
                background: 'var(--brand-slate-100)',
                padding: '18px 22px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--brand-slate-200)',
              }}
            >
              <div>
                <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>
                  {t('Consignment Description & Sealed Content', 'পার্সেলের বিবরণ ও বিষয়বস্তু', lang)}
                </div>
                <div style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--brand-slate-900)', marginTop: '4px' }}>
                  {selectedParcel.contents}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginTop: '14px', fontSize: '12px' }}>
                  <div>
                    <span style={{ color: 'var(--brand-slate-500)', display: 'block', fontSize: '11px' }}>{t('Sender:', 'প্রেরক:', lang)}</span>
                    <strong style={{ color: 'var(--brand-slate-900)' }}>{selectedParcel.sender}</strong>
                    <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)' }}>{selectedParcel.senderDept}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--brand-slate-500)', display: 'block', fontSize: '11px' }}>{t('Recipient:', 'প্রাপক:', lang)}</span>
                    <strong style={{ color: 'var(--brand-slate-900)' }}>{selectedParcel.receiver}</strong>
                    <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)' }}>{selectedParcel.receiverDept}</div>
                  </div>
                </div>

                <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--brand-slate-200)', display: 'flex', flexWrap: 'wrap', gap: '14px', fontSize: '11.5px' }}>
                  <div>
                    <span style={{ color: 'var(--brand-slate-500)' }}>Weight: </span>
                    <strong>{selectedParcel.weight}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--brand-slate-500)' }}>Declared Value: </span>
                    <strong>{selectedParcel.declaredValue}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--brand-slate-500)' }}>Handling: </span>
                    <span style={{ color: 'var(--brand-crimson)', fontWeight: 600 }}>{selectedParcel.specialHandling}</span>
                  </div>
                </div>
              </div>

              {/* Right Box: Seal Status & Handover Action */}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: '12px', color: 'var(--brand-slate-600)', marginBottom: '4px' }}>
                  <strong>Security Seal Status: </strong>
                  {selectedParcel.tamperStatus === 'flagged' ? (
                    <span style={{ color: '#DC2626', fontWeight: 800 }}>⚠️ TAMPER DETECTED / COMPROMISED</span>
                  ) : (
                    <span style={{ color: '#059669', fontWeight: 800 }}>✓ INTACT & VERIFIED</span>
                  )}
                </div>

                <div style={{ fontSize: '11.5px', color: 'var(--brand-slate-500)', marginBottom: '6px' }}>
                  <strong>SHA-256 Checksum: </strong>
                  <span style={{ fontFamily: 'monospace', color: '#059669' }}>9a8f...21b4 (VALID)</span>
                </div>

                <div style={{ fontSize: '11.5px', color: 'var(--brand-slate-500)', marginBottom: '14px' }}>
                  <strong>Last Checkpoint: </strong> {selectedParcel.lastUpdated}
                </div>

                {/* Handover Buttons depending on Status */}
                {selectedParcel.status === 'returned' ? (
                  selectedParcel.returnDetails?.returnStage === 2 && selectedParcel.sender.includes(currentUserName) ? (
                    <button
                      className="btn-primary"
                      style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '6px', background: '#DC2626' }}
                      onClick={() => handleAdvanceStage(selectedParcel.id)}
                    >
                      <RotateCcw size={14} />
                      {t('Acknowledge Return Receipt (Sender PIN)', 'ফেরত পার্সেল গ্রহণ নিশ্চিত করুন (পিন)', lang)}
                    </button>
                  ) : (
                    <div style={{ color: '#DC2626', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                      <RotateCcw size={16} />
                      {selectedParcel.returnDetails?.returnStage === 3
                        ? t('Returned to Original Sender & Formally Closed', 'মূল প্রেরকের নিকট ফেরত সম্পন্ন ও কেস ক্লোজড', lang)
                        : t('Reverse Transit in Progress by Courier', 'কুরিয়ার কর্তৃক ফেরত যাত্রা চলমান', lang)}
                    </div>
                  )
                ) : selectedParcel.currentStage < 5 ? (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      className="btn-primary"
                      style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '6px' }}
                      onClick={() => handleAdvanceStage(selectedParcel.id)}
                    >
                      <UserCheck size={14} />
                      {selectedParcel.currentStage === 4 ? (
                        t('Verify Recipient OTP & Accept Delivery', 'প্রাপকের ওটিপি যাচাই ও ডেলিভারি গ্রহণ', lang)
                      ) : (
                        t(`Scan Seal & Advance to Stage ${selectedParcel.currentStage + 1}`, `সিল স্ক্যান ও পরবর্তী ধাপে স্থানান্তর (${selectedParcel.currentStage + 1})`, lang)
                      )}
                    </button>

                    <button
                      className="btn-sm-ghost"
                      style={{ color: '#DC2626', borderColor: '#FCA5A5', background: '#FFF5F5', display: 'flex', alignItems: 'center', gap: '4px' }}
                      onClick={handleInitiateReturn}
                    >
                      <RotateCcw size={13} />
                      {t('Reject & Return', 'প্রত্যাখ্যান ও ফেরত', lang)}
                    </button>
                  </div>
                ) : (
                  <div style={{ color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                    <CheckCircle size={16} />
                    {t('Delivered & Biometrically Signed by Recipient', 'প্রাপক কর্তৃক সফলভাবে গৃহীত ও স্বাক্ষরিত', lang)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 4. Filter Tabs, Search Bar & Consignments Data Table */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="card">
        <div className="card-hd" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <div className="card-hd-left">
            <div className="card-hd-icon"><Lock size={18} /></div>
            <div>
              <div className="card-title">
                {isStaff
                  ? t('My Inter-Office Consignments & Waybills', 'আমার আন্তঃঅফিস চালান ও ওয়েবিল রেজিস্টার', lang)
                  : scopeMode === 'personal'
                  ? t('My Personal Consignments', 'আমার নিজস্ব পার্সেল রেজিস্টার', lang)
                  : t('All Terminal Waybills & Active Transit Manifests', 'চলমান সকল ওয়েবিল ও চালান তালিকা', lang)}
              </div>
              <div className="card-subtitle">
                {displayedParcels.length} {t('Consignments Monitored in Ledger', 'টি চালান প্রদর্শিত হচ্ছে', lang)}
              </div>
            </div>
          </div>

          {/* Search & Urgency Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: '220px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--brand-slate-400)' }} />
              <input
                type="text"
                placeholder={t('Search tracking, seal, name...', 'খুঁজুন ট্র্যাকিং, সিল, নাম...', lang)}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  paddingLeft: '32px',
                  fontSize: '12px',
                  height: '34px',
                  borderRadius: '20px',
                  border: '1px solid var(--brand-slate-300)',
                  width: '100%',
                }}
              />
            </div>

            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value as any)}
              style={{
                fontSize: '12px',
                height: '34px',
                borderRadius: '20px',
                border: '1px solid var(--brand-slate-300)',
                padding: '0 12px',
                background: '#FFF',
              }}
            >
              <option value="all">{t('All Priorities', 'সকল অগ্রাধিকার', lang)}</option>
              <option value="critical">{t('Critical Only', 'শুধুমাত্র ক্রিটিক্যাল', lang)}</option>
              <option value="high">{t('High Priority', 'হাই প্রায়োরিটি', lang)}</option>
              <option value="normal">{t('Normal Routine', 'নরমাল রুটিন', lang)}</option>
            </select>
          </div>
        </div>

        {/* Pill Tab Bar */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--brand-slate-200)', background: 'var(--brand-slate-50)' }}>
          <div className="parcel-pill-tabs">
            <button
              className={`parcel-pill-tab ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              {t('All My Consignments', 'সকল পার্সেল', lang)}
              <span className="tab-badge">{scopedParcels.length}</span>
            </button>

            <button
              className={`parcel-pill-tab ${activeTab === 'inbound' ? 'active' : ''}`}
              onClick={() => setActiveTab('inbound')}
            >
              <ArrowDownLeft size={13} />
              {t('Incoming / Received', 'আসা পার্সেল', lang)}
              <span className="tab-badge">{stats.totalReceived}</span>
            </button>

            <button
              className={`parcel-pill-tab ${activeTab === 'outbound' ? 'active' : ''}`}
              onClick={() => setActiveTab('outbound')}
            >
              <ArrowUpRight size={13} />
              {t('Sent by Me', 'আমার পাঠানো', lang)}
              <span className="tab-badge">{stats.totalSent}</span>
            </button>

            <button
              className={`parcel-pill-tab ${activeTab === 'transit' ? 'active' : ''}`}
              onClick={() => setActiveTab('transit')}
            >
              <Truck size={13} />
              {t('Active In-Transit', 'ট্রানজিটে আছে', lang)}
              <span className="tab-badge">{stats.inTransitCount}</span>
            </button>

            <button
              className={`parcel-pill-tab ${activeTab === 'delivered' ? 'active' : ''}`}
              onClick={() => setActiveTab('delivered')}
            >
              <CheckCircle size={13} />
              {t('Delivered & Verified', 'হস্তান্তর সম্পন্ন', lang)}
              <span className="tab-badge">{scopedParcels.filter(p => p.status === 'delivered').length}</span>
            </button>

            <button
              className={`parcel-pill-tab ${activeTab === 'returned' ? 'active' : ''}`}
              onClick={() => setActiveTab('returned')}
            >
              <RotateCcw size={13} />
              {t('Returns & Issues (RTO)', 'ফেরত ও সমস্যা (RTO)', lang)}
              <span className="tab-badge" style={{ background: stats.returnsCount > 0 ? '#FEE2E2' : undefined, color: stats.returnsCount > 0 ? '#DC2626' : undefined }}>
                {stats.returnsCount}
              </span>
            </button>
          </div>
        </div>

        <div className="card-body">
          <div className="table-responsive">
            <table className="fleet-table">
              <thead>
                <tr>
                  <th>{t('Tracking / Seal', 'ট্র্যাকিং ও সিল', lang)}</th>
                  <th>{t('Sender', 'প্রেরক', lang)}</th>
                  <th>{t('Recipient', 'প্রাপক', lang)}</th>
                  <th>{t('Contents & Category', 'বিবরণ ও ক্যাটাগরি', lang)}</th>
                  <th>{t('Current Status', 'বর্তমান অবস্থা', lang)}</th>
                  <th>{t('Security / RTO', 'সিকিউরিটি / রিটার্ন', lang)}</th>
                  <th>{t('Action', 'পদক্ষেপ', lang)}</th>
                </tr>
              </thead>
              <tbody>
                {displayedParcels.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--brand-slate-500)' }}>
                      <Package size={32} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
                      <div style={{ fontWeight: 700, fontSize: '14px' }}>
                        {t('No consignments found matching your filter criteria.', 'কোনো পার্সেল খুঁজে পাওয়া যায়নি।', lang)}
                      </div>
                      <div style={{ fontSize: '12px', marginTop: '4px' }}>
                        {t('Try resetting search filters or register a new consignment.', 'অনুসন্ধান ফিল্টার পরিবর্তন করুন অথবা নতুন পার্সেল বুকিং করুন।', lang)}
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayedParcels.map((p) => {
                    const isSelected = selectedParcel?.id === p.id;
                    const isUserSender = p.sender.toLowerCase().includes(currentUserName.toLowerCase());
                    const isUserReceiver = p.receiver.toLowerCase().includes(currentUserName.toLowerCase());

                    return (
                      <tr
                        key={p.id}
                        style={{
                          cursor: 'pointer',
                          background: isSelected ? 'rgba(59, 130, 246, 0.06)' : undefined,
                        }}
                        onClick={() => setSelectedParcelId(p.id)}
                      >
                        {/* 1. Tracking / Seal */}
                        <td>
                          <div style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--brand-slate-900)' }}>
                            {p.trackingNo}
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--brand-slate-400)' }}>{p.sealNo}</div>
                          {isUserSender && (
                            <span className="badge neutral" style={{ fontSize: '9px', marginTop: '2px', padding: '1px 5px' }}>
                              Sent by Me
                            </span>
                          )}
                          {isUserReceiver && (
                            <span className="badge info" style={{ fontSize: '9px', marginTop: '2px', padding: '1px 5px' }}>
                              Incoming for Me
                            </span>
                          )}
                        </td>

                        {/* 2. Sender */}
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--brand-slate-900)' }}>{p.sender}</div>
                          <div style={{ fontSize: '11px', color: 'var(--brand-slate-400)' }}>{p.senderDept}</div>
                        </td>

                        {/* 3. Recipient */}
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--brand-slate-900)' }}>{p.receiver}</div>
                          <div style={{ fontSize: '11px', color: 'var(--brand-slate-400)' }}>{p.receiverDept}</div>
                        </td>

                        {/* 4. Contents */}
                        <td style={{ fontSize: '12px', maxWidth: '280px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--brand-slate-800)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {p.contents}
                          </div>
                          <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-500)', display: 'flex', gap: '8px' }}>
                            <span>{p.weight}</span>
                            <span>•</span>
                            <span style={{ textTransform: 'capitalize' }}>{p.category.replace('_', ' ')}</span>
                          </div>
                        </td>

                        {/* 5. Current Status */}
                        <td>
                          {p.status === 'returned' ? (
                            <span className="badge danger">
                              RTO — {RETURN_STAGES[(p.returnDetails?.returnStage || 1) - 1].label}
                            </span>
                          ) : (
                            <span className={`badge ${p.currentStage === 5 ? 'success' : p.currentStage >= 3 ? 'meeting' : 'warn'}`}>
                              Stage {p.currentStage}/5 — {STAGES[p.currentStage - 1].label}
                            </span>
                          )}
                          <div style={{ fontSize: '10px', color: 'var(--brand-slate-400)', marginTop: '2px' }}>
                            {p.lastUpdated}
                          </div>
                        </td>

                        {/* 6. Security / RTO */}
                        <td>
                          {p.status === 'returned' ? (
                            <div>
                              <span style={{ fontSize: '11px', color: '#DC2626', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <RotateCcw size={11} /> {t('Return Issued', 'ফেরত প্রক্রিয়াধীন', lang)}
                              </span>
                              <div style={{ fontSize: '9.5px', color: '#991B1B', fontFamily: 'monospace' }}>
                                {p.returnDetails?.returnTrackingNo}
                              </div>
                            </div>
                          ) : p.tamperStatus === 'flagged' ? (
                            <span style={{ fontSize: '11px', color: '#DC2626', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <AlertTriangle size={11} /> {t('Seal Flagged', 'সিল ত্রুটি', lang)}
                            </span>
                          ) : (
                            <span style={{ fontSize: '11px', color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <ShieldCheck size={12} /> {t('Seal Intact', 'সিল সুরক্ষিত', lang)}
                            </span>
                          )}
                        </td>

                        {/* 7. Action */}
                        <td>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            {p.status === 'returned' ? (
                              <button
                                className="btn-sm-ghost"
                                style={{ fontSize: '11px', color: '#DC2626' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedParcelId(p.id);
                                  if (p.returnDetails?.returnStage === 2 && p.sender.includes(currentUserName)) {
                                    setIsReturnOtpMode(true);
                                    setShowOtpModal(true);
                                  } else {
                                    setShowAuditModal(true);
                                  }
                                }}
                              >
                                <RotateCcw size={11} />
                                {p.returnDetails?.returnStage === 2 && p.sender.includes(currentUserName) ? 'Return PIN' : 'Details'}
                              </button>
                            ) : p.currentStage < 5 ? (
                              <button
                                className="btn-sm-ghost"
                                style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedParcelId(p.id);
                                  handleAdvanceStage(p.id);
                                }}
                              >
                                <UserCheck size={11} />
                                {p.currentStage === 4 ? 'OTP Verify' : 'Scan'}
                              </button>
                            ) : (
                              <button
                                className="btn-sm-ghost"
                                style={{ fontSize: '11px' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedParcelId(p.id);
                                  setShowManifestModal(true);
                                }}
                              >
                                <Eye size={11} />
                                View
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 5. Barcode / RFID Tag Scanner Simulation Modal */}
      {/* ─────────────────────────────────────────────────────────────────── */}
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
                ✓ Barcode recognized. Geo-location verified at <strong>{selectedParcel.currentStage === 2 ? 'Babubazar / Postogola Toll Transit Post' : 'Plant Gate Reception'}</strong>. Custody will advance to <strong>Stage {selectedParcel.currentStage + 1}</strong>.
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

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 6. Recipient / Return OTP Verification Modal */}
      {/* ─────────────────────────────────────────────────────────────────── */}
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
                    <>
                      Enter the 4-digit Return PIN issued when <strong>{selectedParcel.trackingNo}</strong> was rejected.
                    </>
                  ) : (
                    <>
                      A 4-digit security PIN was dispatched via SMS to <strong>{selectedParcel.receiver}</strong>.
                    </>
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

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 7. Comprehensive Return / RTO Initiation Modal */}
      {/* ─────────────────────────────────────────────────────────────────── */}
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
                    <span><strong>Immediate Reverse Courier Shuttle</strong> (Hand back to vehicle courier for direct return to sender)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="rto_courier"
                      checked={returnCourierOption === 'security_quarantine'}
                      onChange={() => setReturnCourierOption('security_quarantine')}
                    />
                    <span><strong>Security Quarantine Locker</strong> (Hold under station guard custody pending joint audit)</span>
                  </label>
                </div>
              </div>

              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '10px 12px', borderRadius: '6px', fontSize: '11.5px', color: '#475569' }}>
                ℹ️ <strong>Tamper-Evident Chain of Custody:</strong> An automated Return Waybill (<code>BOGCL-RTO-2026-XXXX</code>) will be generated. The sender ({selectedParcel.sender}) will be notified immediately via SMS/Email to receive the returned goods.
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

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 8. Tamper Seal Incident Alert Modal */}
      {/* ─────────────────────────────────────────────────────────────────── */}
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

                <button
                  className="btn-sm-ghost"
                  style={{ justifyContent: 'center', borderColor: '#DC2626', color: '#DC2626' }}
                  onClick={confirmTamperQuarantine}
                >
                  <ShieldAlert size={14} />
                  {t('Flag Seal Only (Await Joint Inspection)', 'শুধুমাত্র সিল ত্রুটি ফ্ল্যাগ করুন', lang)}
                </button>
              </div>
            </div>

            <div className="modal-ft">
              <button className="btn-sm-ghost" onClick={() => setShowTamperModal(false)}>{t('Cancel', 'বাতিল', lang)}</button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 9. Full Chain-of-Custody Audit Trail Ledger Modal (For Board Presentation) */}
      {/* ─────────────────────────────────────────────────────────────────── */}
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

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 10. Official Waybill Manifest Modal with Print Layout */}
      {/* ─────────────────────────────────────────────────────────────────── */}
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

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 11. Register New Consignment Modal (Pre-filled for logged-in user) */}
      {/* ─────────────────────────────────────────────────────────────────── */}
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
              {/* Sender Details (Auto-filled with Current Logged-in Staff) */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '10px 14px', borderRadius: '6px', marginBottom: '14px', fontSize: '12px' }}>
                <span style={{ color: '#64748B' }}>{t('Consignment Originator (Sender):', 'প্রেরকের বিবরণ:', lang)} </span>
                <strong style={{ color: 'var(--brand-slate-900)' }}>{currentUserName}</strong>
                <span style={{ color: '#64748B' }}> ({currentUserDept})</span>
              </div>

              {/* Recipient Name & Department */}
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
                    <option value="Instrument Engineer (Bitumen Unit-2 Maintenance)" />
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

              {/* Facilities */}
              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label>{t('Origin Facility', 'প্রেরক শাখা', lang)}</label>
                  <select value={newOrigin} onChange={(e) => setNewOrigin(e.target.value)}>
                    <option value="Bashundhara Corporate HQ, Baridhara">Bashundhara Corporate HQ, Baridhara</option>
                    <option value="Keraniganj Bitumen Refinery Complex">Keraniganj Bitumen Refinery Complex</option>
                    <option value="Chittagong Patenga Terminal Office">Chittagong Patenga Terminal Office</option>
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>{t('Destination Facility', 'গন্তব্য শাখা', lang)}</label>
                  <select value={newDestination} onChange={(e) => setNewDestination(e.target.value)}>
                    <option value="Keraniganj Bitumen Refinery Complex">Keraniganj Bitumen Refinery Complex</option>
                    <option value="Bashundhara Corporate HQ, Baridhara">Bashundhara Corporate HQ, Baridhara</option>
                    <option value="Chittagong Patenga Terminal Office">Chittagong Patenga Terminal Office</option>
                  </select>
                </div>
              </div>

              {/* Category & Urgency */}
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

              {/* Weight & Declared Value */}
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

              {/* Contents Description */}
              <div className="form-group">
                <label>{t('Contents Description & Sealed Items', 'পণ্যের বিস্তারিত বিবরণ ও নথির তালিকা', lang)} <span style={{ color: '#DC2626' }}>*</span></label>
                <textarea
                  rows={2}
                  placeholder="Specify confidential documents, sample vials, or spare part serial numbers..."
                  value={newContents}
                  onChange={(e) => setNewContents(e.target.value)}
                />
              </div>

              {/* Handling Notes */}
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
