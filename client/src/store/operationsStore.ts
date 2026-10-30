import { useState, useEffect } from 'react';
import { AppRole, ROLE_META, SYSTEM_TODAY } from '../types';
import type {
  CustodyLogEntry,
  ReturnDetails,
  ParcelItem,
} from '../views/ParcelView';
import type {
  PermittedZone,
  InspectionFindingItem,
  VisitorRecord,
} from '../views/GuestView';

/* ──────────────────────────────────────────────────────────────────────────
   1. PERMITS & LICENSES (COMPLIANCE)
   ────────────────────────────────────────────────────────────────────────── */
export interface AuditItem {
  item: string;
  itemBn?: string;
  passed: boolean;
}

export interface DocVaultItem {
  name: string;
  size: string;
  date: string;
  type: string;
}

export interface LicenseCard {
  id: string;
  tag: 'bsti' | 'doe' | 'fire' | 'env' | 'trade';
  tagLabel: string;
  agency: string;
  agencyBn: string;
  title: string;
  titleBn: string;
  refNo: string;
  daysLeft: number;
  stage: number; // 1 to 5
  focalPerson: string;
  focalDesignation: string;
  lastInspection: string;
  criticality: 'critical' | 'high' | 'medium';
  sroLawRef: string;
  feeAmountTk: string;
  dailyShutdownRiskTk: string;
  statutoryPenalty: string;
  statutoryPenaltyBn: string;
  inspectorName: string;
  inspectorDesignation: string;
  ministryRecipient: string;
  ministryAddress: string;
  certificateValidity: string;
  auditChecklist: AuditItem[];
  documents: DocVaultItem[];
}

const INITIAL_LICENSES: LicenseCard[] = [
  {
    id: 'BPC-QUOTA-02',
    tag: 'trade',
    tagLabel: 'ENERGY DIV',
    agency: 'Energy & Mineral Resources Div.',
    agencyBn: 'জ্বালানি ও খনিজ সম্পদ বিভাগ',
    title: 'Annual Raw Material Import & Plant Quota Permit',
    titleBn: 'বার্ষিক কাঁচামাল আমদানি ও প্রক্রিয়াকরণ অনুমোদন',
    refNo: 'EMRD/BOGCL/2026/09',
    daysLeft: 7,
    stage: 4,
    focalPerson: 'Ahmed Akbar Sobhan',
    focalDesignation: 'Chairman & Managing Director',
    lastInspection: '18 Oct 2026',
    criticality: 'critical',
    sroLawRef: 'National Energy Import Policy & Industrial Quota Rules',
    feeAmountTk: '৳ 15,00,000',
    dailyShutdownRiskTk: '৳ 2,40,00,000 / day',
    statutoryPenalty: 'Port customs clearance hold on incoming raw material shipments and extra port waiting charges.',
    statutoryPenaltyBn: 'বন্দরে কাঁচামাল খালাস স্থগিত এবং অতিরিক্ত বন্দর ডেমারেজ চার্জ।',
    inspectorName: 'Md. Nurul Alam',
    inspectorDesignation: 'Additional Secretary, Energy Division',
    ministryRecipient: 'The Senior Secretary',
    ministryAddress: 'Energy & Mineral Resources Division, Bangladesh Secretariat, Dhaka-1000',
    certificateValidity: '06 Nov 2025 – 05 Nov 2026',
    auditChecklist: [
      { item: 'Bank Letter of Credit clearance submitted', passed: true },
      { item: 'Monthly plant production summary sent to ministry', passed: true },
      { item: 'Customs warehouse license copy verified', passed: true },
    ],
    documents: [
      { name: 'Annual_Plant_Production_Summary_2026.pdf', size: '2.6 MB', date: '18 Oct 2026', type: 'Production Report' },
      { name: 'Ministry_Quota_Application_Copy.pdf', size: '1.8 MB', date: '15 Oct 2026', type: 'Official Letter' },
      { name: 'Bangladesh_Bank_Clearance_Slip.pdf', size: '940 KB', date: '12 Oct 2026', type: 'Bank Clearance' },
    ],
  },
  {
    id: 'EXP-KER-01',
    tag: 'fire',
    tagLabel: 'STORAGE PERMIT',
    agency: 'Dept. of Explosives',
    agencyBn: 'বিস্ফোরক পরিদপ্তর',
    title: 'Main Bitumen & Fuel Storage Tank License (Tanks TK-101 to TK-104)',
    titleBn: 'প্রধান বিটুমিন ও জ্বালানি স্টোরেজ ট্যাংক লাইসেন্স (TK-101 হতে TK-104)',
    refNo: 'EXP/KER/TANK/2025/119',
    daysLeft: 18,
    stage: 4,
    focalPerson: 'Engr. Md. Harunur Rashid',
    focalDesignation: 'Plant General Manager, Keraniganj',
    lastInspection: '20 Oct 2026',
    criticality: 'critical',
    sroLawRef: 'Bangladesh Petroleum Storage Safety Rules, Section 4',
    feeAmountTk: '৳ 2,50,000',
    dailyShutdownRiskTk: '৳ 1,85,00,000 / day',
    statutoryPenalty: 'Temporary suspension of bulk tank storage operations until renewal certificate is issued.',
    statutoryPenaltyBn: 'নবায়ন সনদ না পাওয়া পর্যন্ত বাল্ক স্টোরেজ ট্যাংকের কার্যক্রম সাময়িক স্থগিত।',
    inspectorName: 'Dr. Shahabuddin Ahmed',
    inspectorDesignation: 'Chief Inspector, Dept. of Explosives',
    ministryRecipient: 'The Chief Inspector of Explosives',
    ministryAddress: 'Department of Explosives, 8/C Segunbagicha, Dhaka-1000',
    certificateValidity: '17 Nov 2025 – 16 Nov 2026',
    auditChecklist: [
      { item: 'Pressure safety valves tested on Tanks TK-101 to TK-104', passed: true },
      { item: 'Concrete safety boundary wall around tanks inspected', passed: true },
      { item: 'Earthing and lightning protection cables checked', passed: true },
      { item: 'Weatherproof outdoor safety lights installed in tank yard', passed: false },
    ],
    documents: [
      { name: 'Storage_Tank_Thickness_Inspection_2026.pdf', size: '3.2 MB', date: '20 Oct 2026', type: 'Inspection Report' },
      { name: 'Safety_Valve_Test_Certificate.pdf', size: '1.5 MB', date: '18 Oct 2026', type: 'Safety Certificate' },
      { name: 'Govt_Fee_Payment_Receipt.pdf', size: '820 KB', date: '14 Oct 2026', type: 'Bank Receipt' },
    ],
  },
  {
    id: 'CAL-VALVE-08',
    tag: 'env',
    tagLabel: 'BOILER SAFETY',
    agency: 'Office of the Chief Inspector of Boilers',
    agencyBn: 'প্রধান বয়লার পরিদর্শকের কার্যালয়',
    title: 'Plant Steam Boiler & Safety Valve Annual Fitness Certificate',
    titleBn: 'প্ল্যান্ট স্টিম বয়লার ও সেফটি ভালভ বার্ষিক ফিটনেস সনদ',
    refNo: 'BOILER/DHAKA/KER-662',
    daysLeft: 22,
    stage: 2,
    focalPerson: 'Engr. Tariqul Islam',
    focalDesignation: 'Senior Plant Maintenance Engineer',
    lastInspection: '24 Oct 2026',
    criticality: 'high',
    sroLawRef: 'Boilers Act 2022 — Annual Safety Inspection',
    feeAmountTk: '৳ 75,000',
    dailyShutdownRiskTk: '৳ 65,00,000 / day',
    statutoryPenalty: 'Heating boiler must remain turned off if annual safety fitness expires.',
    statutoryPenaltyBn: 'বার্ষিক ফিটনেস মেয়াদোত্তীর্ণ হলে বয়লার চালু রাখা নিষিদ্ধ।',
    inspectorName: 'Engr. Faruk Hossain',
    inspectorDesignation: 'Senior Boiler Inspector, Dhaka Zone',
    ministryRecipient: 'The Chief Inspector of Boilers',
    ministryAddress: 'Shilpa Bhaban Annex, Motijheel C/A, Dhaka-1000',
    certificateValidity: '21 Nov 2025 – 20 Nov 2026',
    auditChecklist: [
      { item: 'Water pressure test completed with zero leaks', passed: true },
      { item: 'Emergency auto-shutoff switch tested', passed: false },
    ],
    documents: [
      { name: 'Boiler_Pressure_Test_Sheet_Oct2026.pdf', size: '1.4 MB', date: '24 Oct 2026', type: 'Test Sheet' },
    ],
  },
  {
    id: 'DOE-ECC-04',
    tag: 'doe',
    tagLabel: 'ENVIRONMENT',
    agency: 'Department of Environment',
    agencyBn: 'পরিবেশ অধিদপ্তর',
    title: 'Factory Environmental Clearance Certificate (Annual Renewal)',
    titleBn: 'কারখানার পরিবেশগত ছাড়পত্র (বার্ষিক নবায়ন)',
    refNo: 'DoE/CLEAR/DHAKA/884',
    daysLeft: 34,
    stage: 3,
    focalPerson: 'Nazmul Huda',
    focalDesignation: 'Senior Safety & Environment Officer',
    lastInspection: '15 Oct 2026',
    criticality: 'critical',
    sroLawRef: 'Bangladesh Environment Conservation Rules 2023',
    feeAmountTk: '৳ 4,00,000',
    dailyShutdownRiskTk: '৳ 1,20,00,000 / day',
    statutoryPenalty: 'Environmental fine and compliance notice from the Department of Environment.',
    statutoryPenaltyBn: 'পরিবেশ অধিদপ্তর কর্তৃক জরিমানা ও কারণ দর্শানোর নোটিশ।',
    inspectorName: 'Dr. Kazi Mahbubur Rahman',
    inspectorDesignation: 'Director, DoE Dhaka Region',
    ministryRecipient: 'The Director General',
    ministryAddress: 'Department of Environment, Paribesh Bhaban, Agargaon, Dhaka-1207',
    certificateValidity: '03 Dec 2025 – 02 Dec 2026',
    auditChecklist: [
      { item: 'Water treatment plant (ETP) running 24/7 properly', passed: true },
      { item: 'Treated water lab test meets clean water rules', passed: true },
      { item: 'Chimney air filter readings within clean limits', passed: true },
      { item: 'Approved waste collection vendor contract active', passed: true },
    ],
    documents: [
      { name: 'Water_Treatment_Lab_Report_Oct2026.pdf', size: '2.1 MB', date: '15 Oct 2026', type: 'Lab Report' },
      { name: 'Clean_Air_Monitoring_Summary.pdf', size: '1.8 MB', date: '12 Oct 2026', type: 'Air Quality Log' },
    ],
  },
  {
    id: 'FSCD-FIRE-09',
    tag: 'fire',
    tagLabel: 'FIRE SAFETY',
    agency: 'Fire Service & Civil Defence',
    agencyBn: 'ফায়ার সার্ভিস ও সিভিল ডিফেন্স',
    title: 'Factory & Head Office Fire Safety License',
    titleBn: 'কারখানা ও প্রধান কার্যালয় অগ্নিনির্বাপণ লাইসেন্স',
    refNo: 'FSCD/HQ/LIC/2026/410',
    daysLeft: 84,
    stage: 2,
    focalPerson: 'Mizanur Rahman',
    focalDesignation: 'Main Gate & Security Officer',
    lastInspection: '05 Oct 2026',
    criticality: 'high',
    sroLawRef: 'Fire Prevention & Safety Act 2003',
    feeAmountTk: '৳ 1,80,000',
    dailyShutdownRiskTk: '৳ 95,00,000 / day',
    statutoryPenalty: 'Building fire safety warning and restriction on fuel truck entry.',
    statutoryPenaltyBn: 'অগ্নি-নিরাপত্তা সতর্কতা ও ট্যাংকার প্রবেশে বিধি-নিষেধ।',
    inspectorName: 'Lt. Col. Tajul Islam',
    inspectorDesignation: 'Director (Operations), Fire Service',
    ministryRecipient: 'The Director General',
    ministryAddress: 'Fire Service & Civil Defence HQ, Kazi Nazrul Islam Ave, Dhaka-1000',
    certificateValidity: '22 Jan 2026 – 21 Jan 2027',
    auditChecklist: [
      { item: 'Fire water pumps and hoses tested at full pressure', passed: true },
      { item: 'Water sprinkler system over storage tanks working', passed: true },
      { item: 'Fire-fighting foam stock checked (12,000 Liters ready)', passed: true },
      { item: 'Quarterly staff fire drill completed and recorded', passed: true },
    ],
    documents: [
      { name: 'Fire_Hydrant_Pressure_Check_2026.pdf', size: '2.0 MB', date: '05 Oct 2026', type: 'Safety Log' },
      { name: 'Quarterly_Fire_Drill_Attendance.pdf', size: '1.1 MB', date: '01 Oct 2026', type: 'Drill Report' },
    ],
  },
  {
    id: 'BSTI-BIT-60',
    tag: 'bsti',
    tagLabel: 'BSTI QUALITY',
    agency: 'BSTI Standards Bureau',
    agencyBn: 'বাংলাদেশ স্ট্যান্ডার্ডস অ্যান্ড টেস্টিং ইনস্টিটিউশন (বিএসটিআই)',
    title: 'BSTI Product Quality Certificate — Road Bitumen Grades 60/70 & 80/100',
    titleBn: 'বিএসটিআই মানসনদ — সড়ক বিটুমিন গ্রেড ৬০/৭০ ও ৮০/১০০',
    refNo: 'BSTI/CM/KER/2026-98',
    daysLeft: 142,
    stage: 5,
    focalPerson: 'Engr. Md. Harunur Rashid',
    focalDesignation: 'Plant General Manager',
    lastInspection: '25 Oct 2026',
    criticality: 'medium',
    sroLawRef: 'BSTI Quality Certification Act 2018',
    feeAmountTk: '৳ 1,25,000',
    dailyShutdownRiskTk: '৳ 2,10,00,000 / day',
    statutoryPenalty: 'Cannot supply bitumen to government road construction tenders without active BSTI mark.',
    statutoryPenaltyBn: 'সক্রিয় বিএসটিআই সনদ ছাড়া সরকারি সড়ক প্রকল্পে বিটুমিন সরবরাহ করা যাবে না।',
    inspectorName: 'Engr. Tahmina Begum',
    inspectorDesignation: 'Deputy Director, BSTI Dhaka',
    ministryRecipient: 'The Director General',
    ministryAddress: 'BSTI Head Office, 116/A Tejgaon Industrial Area, Dhaka-1208',
    certificateValidity: '20 Mar 2026 – 19 Mar 2027',
    auditChecklist: [
      { item: 'Bitumen hardness & grade lab test passed (60/70 standard)', passed: true },
      { item: 'Heat resistance test passed (>= 49°C)', passed: true },
      { item: 'Flexibility & road binding strength verified', passed: true },
      { item: 'High-temperature safety flash test passed (> 230°C)', passed: true },
    ],
    documents: [
      { name: 'BSTI_Lab_Quality_Certificate_Oct2026.pdf', size: '2.4 MB', date: '25 Oct 2026', type: 'BSTI Certificate' },
    ],
  },
];

/* ──────────────────────────────────────────────────────────────────────────
   2. SAFETY & INCIDENT REPORTS
   ────────────────────────────────────────────────────────────────────────── */
export interface IncidentItem {
  id: string;
  incNo: string;
  title: string;
  titleBn: string;
  category: 'spill' | 'pressure' | 'fire' | 'near_miss' | 'electrical';
  level: 1 | 2 | 3 | 4 | 5;
  location: string;
  reportedBy: string;
  date: string;
  rootCause: string;
  capaAction: string;
  capaOwner: string;
  capaStatus: 'open' | 'in_progress' | 'closed';
  statutoryReportable: boolean;
  fiveWhys?: {
    why1: string;
    why2: string;
    why3: string;
    why4: string;
    why5: string;
    fishboneCategory: 'Equipment' | 'Procedure' | 'Material' | 'Staffing' | 'Inspection' | 'Weather';
  };
  evidenceAttached?: boolean;
}

const INITIAL_INCIDENTS: IncidentItem[] = [
  {
    id: 'INC-01',
    incNo: 'INC-2026-041',
    title: 'Small Hot Bitumen Drip Found on Storage Tank TK-102 Drain Valve',
    titleBn: 'স্টোরেজ ট্যাংক TK-102 এর ড্রেন ভালভে সামান্য বিটুমিন ফোঁটা',
    category: 'spill',
    level: 3,
    location: 'Storage Tank Yard, Keraniganj Plant',
    reportedBy: 'Nazmul Huda (Safety Officer)',
    date: '28 Oct 2026, 11:20 AM',
    rootCause: 'Rubber valve seal wore out early due to continuous high heat.',
    capaAction: 'Closed valve line safely, cleaned drip tray, and installing new heat-resistant seal.',
    capaOwner: 'Plant Maintenance Team',
    capaStatus: 'in_progress',
    statutoryReportable: false,
    evidenceAttached: true,
    fiveWhys: {
      why1: 'Small bitumen drip noticed on the lower drain valve during morning walk.',
      why2: 'The inner valve rubber ring became stiff and cracked from heat.',
      why3: 'A standard seal was fitted during last quarter servicing instead of a high-heat ring.',
      why4: 'High-heat spare rings were temporarily out of stock that week.',
      why5: 'Main Cause & Fix: Keep minimum 10 high-heat seals in store room and verify part grade before fitting.',
      fishboneCategory: 'Material',
    },
  },
  {
    id: 'INC-02',
    incNo: 'INC-2026-040',
    title: 'Delivery Gate Barrier Arm Sensor Stuck During Morning Rain',
    titleBn: 'সকালের বৃষ্টিতে ডেলিভারি গেট ব্যারিয়ার সেন্সর আটকে যাওয়া',
    category: 'electrical',
    level: 1,
    location: 'Main Truck Gate #2, Keraniganj Plant',
    reportedBy: 'Mizanur Rahman (Security Officer)',
    date: '29 Oct 2026, 08:15 AM',
    rootCause: 'Rainwater entered the outdoor sensor cover at Gate #2.',
    capaAction: 'Electrician drying sensor box and fitting a waterproof protective hood.',
    capaOwner: 'Electrical & Gate Maintenance',
    capaStatus: 'open',
    statutoryReportable: false,
    evidenceAttached: true,
  },
  {
    id: 'INC-03',
    incNo: 'INC-2026-039',
    title: 'Near-Miss: Unsecured Repair Ladder Near Loading Bay Walkway',
    titleBn: 'নিয়ার-মিস: লোডিং বে পথের পাশে অরক্ষিত মেরামত মই',
    category: 'near_miss',
    level: 2,
    location: 'Truck Loading Bay #1, Keraniganj Plant',
    reportedBy: 'Md. Kamruzzaman (Transport Supervisor)',
    date: '25 Oct 2026, 03:45 PM',
    rootCause: 'Painting contractor left a folding ladder without warning cones during tea break.',
    capaAction: 'Area cordoned immediately and contractor supervisor briefed on mandatory safety cones.',
    capaOwner: 'Safety & Admin Team',
    capaStatus: 'closed',
    statutoryReportable: false,
    evidenceAttached: true,
    fiveWhys: {
      why1: 'Folding ladder was left unattended near a busy pedestrian walkway.',
      why2: 'Contractor workers went on break without folding or tying the ladder.',
      why3: 'Daily safety checklist was not signed before starting afternoon painting.',
      why4: 'Contractor team leader arrived 30 minutes late.',
      why5: 'Main Cause & Fix: Security now checks contractor safety supervisor presence before issuing work pass.',
      fishboneCategory: 'Procedure',
    },
  },
  {
    id: 'INC-04',
    incNo: 'INC-2026-036',
    title: 'High Pressure Warning Alarm on Heating Pipe Line #2',
    titleBn: 'হিটিং পাইপলাইন #২-এ অতিরিক্ত চাপ সতর্কতা সংকেত',
    category: 'pressure',
    level: 4,
    location: 'Heating Unit #2, Keraniganj Plant',
    reportedBy: 'Engr. Md. Harunur Rashid (Plant GM)',
    date: '20 Oct 2026, 02:15 PM',
    rootCause: 'Thick bitumen buildup partially blocked a manual bypass valve.',
    capaAction: 'Flushed pipe clean and installed an automatic pressure release alarm in the control room.',
    capaOwner: 'Plant GM & Maintenance Engineers',
    capaStatus: 'closed',
    statutoryReportable: true,
    evidenceAttached: true,
  },
];

/* ──────────────────────────────────────────────────────────────────────────
   3. OFFICE MAIL & PARCELS
   ────────────────────────────────────────────────────────────────────────── */
const INITIAL_PARCELS: ParcelItem[] = [
  {
    id: 'P-TA-01',
    trackingNo: 'PKG-2026-9041',
    sealNo: 'SEAL-99412',
    sender: 'Farida Begum',
    senderDept: 'Finance & Accounts',
    origin: 'Head Office, Baridhara',
    receiver: 'Tanvir Ahmed',
    receiverDept: 'Sales & Distribution',
    destination: 'Sales Desk, Level 4, Head Office',
    contents: 'Approved Q3 Sales Performance Bonus Letter & Commission Statement',
    category: 'legal_docs',
    weight: '0.35 kg',
    declaredValue: 'Confidential HR / Finance Document',
    specialHandling: 'Sealed Envelope • Do Not Fold • Hand Over with 4-Digit PIN',
    urgency: 'critical',
    currentStage: 4,
    status: 'at_gate',
    lastUpdated: 'Today, 01:15 PM',
    eta: 'Ready for Pickup at Reception',
    corridorProgressPercent: 88,
    courier: {
      name: 'Md. Rafiqul Islam',
      phone: '+880 1715-882100',
      vehicle: 'Office Dispatch Car (Dhaka Metro-Gha 13-8821)',
      avatarInitials: 'RI',
      currentSpeed: 'Arrived at Reception',
    },
    dispatchedBy: 'Md. Kamruzzaman',
    tamperStatus: 'secure',
    deliveryOtp: '7482',
    chainOfCustody: [
      {
        stage: 1,
        stageName: 'Parcel Logged',
        stageNameBn: 'পার্সেল এন্ট্রি',
        location: 'Head Office Mail Desk',
        timestamp: 'Today, 09:30 AM',
        actor: 'Md. Kamruzzaman',
        actorRole: 'Transport & Admin Supervisor',
        notes: 'Envelope sealed with sticker SEAL-99412.',
      },
      {
        stage: 2,
        stageName: 'Handed to Driver',
        stageNameBn: 'ড্রাইভারের নিকট হস্তান্তর',
        location: 'Head Office Dispatch Bay',
        timestamp: 'Today, 10:15 AM',
        actor: 'Md. Rafiqul Islam',
        actorRole: 'Senior Company Driver',
        notes: 'Seal checked intact before departure.',
      },
      {
        stage: 3,
        stageName: 'On the Way',
        stageNameBn: 'পথে রয়েছে',
        location: 'Baridhara Office Gate',
        timestamp: 'Today, 11:45 AM',
        actor: 'Reception Mail Desk',
        actorRole: 'Mailroom Staff',
        notes: 'Sorted for Level 4 Sales & Distribution.',
      },
      {
        stage: 4,
        stageName: 'Arrived at Reception',
        stageNameBn: 'রিসিপশনে পৌঁছেছে',
        location: 'Head Office Reception Desk',
        timestamp: 'Today, 01:15 PM',
        actor: 'Zahid Hasan',
        actorRole: 'Reception Officer',
        notes: 'Ready for recipient pickup with 4-digit PIN.',
      },
    ],
  },
  {
    id: 'P-TA-05',
    trackingNo: 'PKG-2026-9055',
    sealNo: 'SEAL-99430',
    sender: 'Tanvir Ahmed',
    senderDept: 'Sales & Distribution',
    origin: 'Head Office, Baridhara',
    receiver: 'Engr. Md. Harunur Rashid',
    receiverDept: 'Plant Operations',
    destination: 'Keraniganj Plant Office',
    contents: 'Signed Highway Bitumen Supply Contract (৳14.5 Crore) & Bank Guarantee Copies',
    category: 'legal_docs',
    weight: '0.65 kg',
    declaredValue: '৳14,50,00,000 Contract File',
    specialHandling: 'Original Signed Contract • Direct Delivery to Plant GM Office',
    urgency: 'critical',
    currentStage: 3,
    status: 'in_transit',
    lastUpdated: 'Today, 11:45 AM',
    eta: 'Today by 02:45 PM',
    corridorProgressPercent: 62,
    courier: {
      name: 'Abdul Mannan',
      phone: '+880 1819-338811',
      vehicle: 'Toyota HiAce (Dhaka Metro-Cha 53-4102)',
      avatarInitials: 'AM',
      currentSpeed: '42 km/h (Near Babubazar Bridge)',
    },
    dispatchedBy: 'Head Office Mail Desk',
    tamperStatus: 'secure',
    deliveryOtp: '6218',
    chainOfCustody: [
      {
        stage: 1,
        stageName: 'Parcel Logged',
        stageNameBn: 'পার্সেল এন্ট্রি',
        location: 'Head Office Mail Counter',
        timestamp: 'Today, 09:10 AM',
        actor: 'Tanvir Ahmed',
        actorRole: 'Senior Sales Officer',
        notes: 'Contract folder sealed in waterproof pouch.',
      },
      {
        stage: 2,
        stageName: 'Handed to Driver',
        stageNameBn: 'ড্রাইভারের নিকট হস্তান্তর',
        location: 'Baridhara Car Porch',
        timestamp: 'Today, 09:40 AM',
        actor: 'Abdul Mannan',
        actorRole: 'Shuttle Van Driver',
        notes: 'Picked up for Keraniganj Plant run.',
      },
      {
        stage: 3,
        stageName: 'On the Way',
        stageNameBn: 'পথে রয়েছে',
        location: 'Babubazar Bridge Checkpoint',
        timestamp: 'Today, 11:45 AM',
        actor: 'Transit Update',
        actorRole: 'GPS Route Check',
        notes: 'Crossed river bridge, heading to Keraniganj Plant Gate-1.',
      },
    ],
  },
  {
    id: 'P-HR-01',
    trackingNo: 'PKG-2026-9062',
    sealNo: 'SEAL-99448',
    sender: 'Sayeda Afroza Sultana',
    senderDept: 'Human Resources',
    origin: 'Head Office, Baridhara',
    receiver: 'Md. Kamruzzaman',
    receiverDept: 'Transport & Logistics',
    destination: 'Admin Office, Keraniganj Plant',
    contents: '15 Printed Staff ID Cards & Driver Uniform Allowance Vouchers',
    category: 'it_hardware',
    weight: '1.10 kg',
    declaredValue: '৳45,000',
    specialHandling: 'Boxed Staff ID Badges • Hand Over to Admin Supervisor',
    urgency: 'high',
    currentStage: 2,
    status: 'in_transit',
    lastUpdated: 'Today, 10:30 AM',
    eta: 'Today by 03:30 PM',
    corridorProgressPercent: 40,
    courier: {
      name: 'Abdul Mannan',
      phone: '+880 1819-338811',
      vehicle: 'Toyota HiAce (Dhaka Metro-Cha 53-4102)',
      avatarInitials: 'AM',
      currentSpeed: '42 km/h',
    },
    dispatchedBy: 'HR Mail Desk',
    tamperStatus: 'secure',
    deliveryOtp: '5120',
    chainOfCustody: [
      {
        stage: 1,
        stageName: 'Parcel Logged',
        stageNameBn: 'পার্সেল এন্ট্রি',
        location: 'HR Department, Level 6',
        timestamp: 'Today, 09:50 AM',
        actor: 'Sayeda Afroza Sultana',
        actorRole: 'GM, HR & Administration',
        notes: 'New staff ID cards packed and sealed.',
      },
      {
        stage: 2,
        stageName: 'Handed to Driver',
        stageNameBn: 'ড্রাইভারের নিকট হস্তান্তর',
        location: 'Head Office Dispatch Gate',
        timestamp: 'Today, 10:30 AM',
        actor: 'Abdul Mannan',
        actorRole: 'Shuttle Van Driver',
        notes: 'En route to Keraniganj Plant.',
      },
    ],
  },
  {
    id: 'P-TA-02',
    trackingNo: 'PKG-2026-8975',
    sealNo: 'SEAL-99418',
    sender: 'Engr. Md. Harunur Rashid',
    senderDept: 'Plant Operations',
    origin: 'Keraniganj Plant',
    receiver: 'Tanvir Ahmed',
    receiverDept: 'Sales & Distribution',
    destination: 'Head Office, Baridhara',
    contents: 'BSTI Certified Bitumen Quality Test Reports & Road Sample Tins',
    category: 'qc_sample',
    weight: '1.20 kg',
    declaredValue: '৳50,000 (Tender Sample Set)',
    specialHandling: 'Sample Tins Inside • Keep Upright',
    urgency: 'high',
    currentStage: 5,
    status: 'delivered',
    lastUpdated: '28 Oct 2026, 04:30 PM',
    eta: 'Delivered Yesterday',
    corridorProgressPercent: 100,
    courier: {
      name: 'Sujon Mia',
      phone: '+880 1720-551122',
      vehicle: 'Mitsubishi Pickup (Dhaka Metro-Da 14-3312)',
      avatarInitials: 'SM',
      currentSpeed: 'Delivered',
    },
    dispatchedBy: 'Keraniganj Plant Gate #1',
    tamperStatus: 'secure',
    deliveryOtp: '3914',
    chainOfCustody: [
      {
        stage: 1,
        stageName: 'Parcel Logged',
        stageNameBn: 'পার্সেল এন্ট্রি',
        location: 'Keraniganj Quality Lab',
        timestamp: '28 Oct 2026, 10:00 AM',
        actor: 'Engr. Md. Harunur Rashid',
        actorRole: 'Plant General Manager',
      },
      {
        stage: 5,
        stageName: 'Delivered & Confirmed',
        stageNameBn: 'প্রাপকের নিকট হস্তান্তর সম্পন্ন',
        location: 'Head Office, Level 4',
        timestamp: '28 Oct 2026, 04:30 PM',
        actor: 'Tanvir Ahmed',
        actorRole: 'Senior Sales Officer',
        notes: 'Received in good condition using 4-digit PIN.',
      },
    ],
  },
  {
    id: 'P-TA-04',
    trackingNo: 'PKG-2026-8850',
    sealNo: 'SEAL-99210',
    sender: 'Quality Testing Lab, Keraniganj',
    senderDept: 'Plant Operations',
    origin: 'Keraniganj Plant',
    receiver: 'Tanvir Ahmed',
    receiverDept: 'Sales & Distribution',
    destination: 'Head Office, Baridhara',
    contents: 'Liquid Bitumen Sample Jars (Batch #88)',
    category: 'qc_sample',
    weight: '0.80 kg',
    declaredValue: '৳15,000',
    specialHandling: 'Glass Jars • Handle With Care',
    urgency: 'normal',
    currentStage: 4,
    status: 'returned',
    lastUpdated: '26 Oct 2026, 05:10 PM',
    eta: 'Returned to Sender',
    corridorProgressPercent: 100,
    courier: {
      name: 'Sujon Mia',
      phone: '+880 1720-551122',
      vehicle: 'Mitsubishi Pickup (Dhaka Metro-Da 14-3312)',
      avatarInitials: 'SM',
      currentSpeed: 'Returned',
    },
    dispatchedBy: 'Keraniganj Dispatch Desk',
    tamperStatus: 'flagged',
    deliveryOtp: '8491',
    chainOfCustody: [
      {
        stage: 1,
        stageName: 'Parcel Logged',
        stageNameBn: 'পার্সেল এন্ট্রি',
        location: 'Keraniganj Quality Lab',
        timestamp: '26 Oct 2026, 11:00 AM',
        actor: 'Lab Assistant',
        actorRole: 'Quality Lab',
      },
      {
        stage: 4,
        stageName: 'Returned from Reception',
        stageNameBn: 'রিসিপশন থেকে ফেরত',
        location: 'Head Office Reception Desk',
        timestamp: '26 Oct 2026, 03:45 PM',
        actor: 'Tanvir Ahmed',
        actorRole: 'Senior Sales Officer',
        notes: 'Returned because outer box sticker was torn and one jar lid was loose.',
      },
    ],
    returnDetails: {
      returnTrackingNo: 'RET-2026-0850',
      initiatedAt: '26 Oct 2026, 03:50 PM',
      initiatedBy: 'Tanvir Ahmed',
      reason: 'tamper_broken',
      reasonText: 'Outer Box Seal Torn & Sample Lid Loose',
      notes: 'Box arrived with a torn seal sticker. Sent back for fresh sealed sample.',
      returnStage: 3,
      returnOtp: '4491',
      resolvedAt: '26 Oct 2026, 05:10 PM',
      courierName: 'Sujon Mia (Pickup Van)',
    },
  },
  {
    id: 'P-EXEC-01',
    trackingNo: 'PKG-2026-9070',
    sealNo: 'SEAL-99501',
    sender: 'Farida Begum',
    senderDept: 'Finance & Accounts',
    origin: 'Head Office, Baridhara',
    receiver: 'Ahmed Akbar Sobhan',
    receiverDept: "Chairman's Office",
    destination: 'Chairman Secretariat, Level 12, Head Office',
    contents: 'Monthly Group Financial Summary & Signed Bank L/C Documents',
    category: 'legal_docs',
    weight: '0.50 kg',
    declaredValue: 'Confidential Board Folder',
    specialHandling: 'Direct Handover to Chairman Secretariat',
    urgency: 'critical',
    currentStage: 4,
    status: 'at_gate',
    lastUpdated: 'Today, 12:20 PM',
    eta: 'At Level 12 Secretariat Desk',
    corridorProgressPercent: 92,
    courier: {
      name: 'Anwar Hossain',
      phone: '+880 1712-445566',
      vehicle: 'Internal Office Messenger',
      avatarInitials: 'AH',
      currentSpeed: 'At Desk',
    },
    dispatchedBy: 'Finance Dispatch Desk',
    tamperStatus: 'secure',
    deliveryOtp: '9012',
    chainOfCustody: [
      {
        stage: 1,
        stageName: 'Parcel Logged',
        stageNameBn: 'পার্সেল এন্ট্রি',
        location: 'Finance Department, Level 9',
        timestamp: 'Today, 11:50 AM',
        actor: 'Farida Begum',
        actorRole: 'Head of Finance & Approver',
      },
      {
        stage: 4,
        stageName: 'Arrived at Reception',
        stageNameBn: 'রিসিপশনে পৌঁছেছে',
        location: 'Chairman Secretariat, Level 12',
        timestamp: 'Today, 12:20 PM',
        actor: 'Executive Secretary',
        actorRole: "Chairman's Office",
      },
    ],
  },
];

/* ──────────────────────────────────────────────────────────────────────────
   4. VISITOR GATE PASSES
   ────────────────────────────────────────────────────────────────────────── */
const INITIAL_VISITORS: VisitorRecord[] = [
  {
    id: 'VIS-2026-0811',
    name: 'Dr. Shahabuddin Ahmed',
    organization: 'Department of Explosives, Govt. of Bangladesh',
    designation: 'Chief Inspector',
    category: 'govt',
    hostEmployee: 'Engr. Md. Harunur Rashid',
    hostDept: 'Plant Operations',
    hostPhone: '+880 1713-441199',
    facility: 'Keraniganj Bitumen Refinery',
    permittedZones: [
      { zoneId: 'Z-01', name: 'Admin Building & Reception', nameBn: 'প্রশাসন ভবন ও অভ্যর্থনা', level: 'green', escortRequired: false },
      { zoneId: 'Z-02', name: 'Quality Testing Lab', nameBn: 'মান নিয়ন্ত্রণ ল্যাব', level: 'yellow', escortRequired: false },
      { zoneId: 'Z-03', name: 'Storage Tank Yard (TK-101 to TK-104)', nameBn: 'স্টোরেজ ট্যাংক ইয়ার্ড', level: 'red', escortRequired: true },
    ],
    purpose: 'Annual Government Safety Inspection of Storage Tanks TK-101 to TK-104',
    expectedDate: 'Today, 29 Oct',
    expectedTime: '10:30 AM',
    checkInTime: '10:28 AM',
    status: 'checked_in',
    durationHours: 4,
    vehiclePlate: 'DHAKA-METRO-GHA-11-9042',
    badgeNo: 'GOVT-04',
    vipProtocol: true,
    safetyBriefingCompleted: true,
    ndaSigned: true,
    ppeCleared: {
      hardHat: true,
      safetyGoggles: true,
      safetyShoes: true,
      hiVisVest: true,
      h2sBriefing: true,
    },
    phone: '+880 1711-234567',
    email: 'shahabuddin@explosives.gov.bd',
    idProofType: 'Official Govt Badge',
    idProofNumber: 'DOE-HQ-9902',
    emergencyContact: 'Dept. of Explosives Office: 02-9552144',
    vipTier: 'VIP - Level 2',
    escortOfficer: 'Mizanur Rahman (Main Gate & Security Officer)',
    executiveSuite: 'Plant Conference Room (Ground Floor)',
    parkingBay: 'VIP Bay #02',
    dietaryPreferences: 'Light Refreshments & Green Tea',
    isEvacuatedSafe: true,
    inspectionFindings: [
      { focusArea: 'Storage Tanks TK-101 to TK-104 Safety Valves', observation: 'All tank pressure gauges and valves working properly with zero leaks.', status: 'passed', signOffDate: 'Today, 11:15 AM' },
      { focusArea: 'Fire Hydrant Water Pressure', observation: 'Full water pressure verified around the storage tank boundary.', status: 'passed', signOffDate: 'Today, 11:45 AM' },
    ],
  },
  {
    id: 'VIS-2026-0812',
    name: 'Francois Dubois',
    organization: 'Axens Clean Energy Partners (France)',
    designation: 'Regional Engineering Director',
    category: 'vip',
    hostEmployee: 'Ahmed Akbar Sobhan',
    hostDept: "Chairman's Office",
    hostPhone: '+880 1711-000001',
    facility: 'Bashundhara Corporate HQ, Baridhara',
    permittedZones: [
      { zoneId: 'Z-01', name: 'Executive Boardroom (Level 12)', nameBn: 'এক্সিকিউটিভ বোর্ডরুম (১২ তলা)', level: 'green', escortRequired: false },
      { zoneId: 'Z-04', name: 'Project Planning Office (Level 9)', nameBn: 'প্রজেক্ট প্ল্যানিং অফিস', level: 'green', escortRequired: false },
    ],
    purpose: 'Partnership Meeting for New Plant Expansion & Equipment Supply',
    expectedDate: 'Today, 29 Oct',
    expectedTime: '02:30 PM',
    status: 'pre_registered',
    durationHours: 3,
    vehiclePlate: 'DHAKA-METRO-CHA-22-1001',
    badgeNo: 'VIP-01',
    vipProtocol: true,
    safetyBriefingCompleted: true,
    ndaSigned: true,
    ppeCleared: {
      hardHat: false,
      safetyGoggles: false,
      safetyShoes: false,
      hiVisVest: false,
      h2sBriefing: false,
    },
    phone: '+33 6 12 34 56 78',
    email: 'francois.dubois@axens.net',
    idProofType: 'Passport',
    idProofNumber: 'FR-88914022',
    emergencyContact: 'Embassy Liaison Desk: 02-55668600',
    vipTier: 'VVIP - Level 1',
    escortOfficer: 'Engr. Md. Harunur Rashid (Plant GM)',
    executiveSuite: 'Chairman Boardroom (Level 12)',
    parkingBay: 'VIP Portico Bay #01',
    dietaryPreferences: 'Coffee & Continental Lunch',
    isEvacuatedSafe: false,
    inspectionFindings: [],
  },
  {
    id: 'VIS-2026-0814',
    name: 'Engr. Mahfuzur Rahman',
    organization: 'Roads & Highways Department (RHD)',
    designation: 'Executive Engineer',
    category: 'govt',
    hostEmployee: 'Tanvir Ahmed',
    hostDept: 'Sales & Distribution',
    hostPhone: '+880 1712-334455',
    facility: 'Bashundhara Corporate HQ, Baridhara',
    permittedZones: [
      { zoneId: 'Z-01', name: 'Sales & Distribution Floor (Level 4)', nameBn: 'বিক্রয় বিভাগ (৪র্থ তলা)', level: 'green', escortRequired: false },
      { zoneId: 'Z-02', name: 'Meeting Room B (Level 4)', nameBn: 'সভাকক্ষ বি (৪র্থ তলা)', level: 'green', escortRequired: false },
    ],
    purpose: 'Review ৳14.5 Crore Highway Bitumen Supply Schedule & BSTI Test Reports',
    expectedDate: 'Today, 29 Oct',
    expectedTime: '03:15 PM',
    status: 'pre_registered',
    durationHours: 2,
    vehiclePlate: 'DHAKA-METRO-GHA-14-3829',
    badgeNo: 'GOVT-06',
    vipProtocol: true,
    safetyBriefingCompleted: true,
    ndaSigned: true,
    ppeCleared: {
      hardHat: false,
      safetyGoggles: false,
      safetyShoes: false,
      hiVisVest: false,
      h2sBriefing: false,
    },
    phone: '+880 1712-449911',
    email: 'mahfuz.rhd@rhd.gov.bd',
    idProofType: 'Official Govt Badge',
    idProofNumber: 'RHD-EE-4190',
    emergencyContact: 'RHD Dhaka Office: 02-48119830',
    vipTier: 'VIP - Level 2',
    escortOfficer: 'Tanvir Ahmed (Senior Sales Officer)',
    executiveSuite: 'Meeting Room B (Level 4)',
    parkingBay: 'Visitor Bay #04',
    dietaryPreferences: 'Tea & Afternoon Snacks',
    isEvacuatedSafe: false,
  },
  {
    id: 'VIS-2026-0815',
    name: 'S.M. Rezaul Karim',
    organization: 'National Road & Construction Ltd.',
    designation: 'Managing Director',
    category: 'client',
    hostEmployee: 'Tanvir Ahmed',
    hostDept: 'Sales & Distribution',
    hostPhone: '+880 1712-334455',
    facility: 'Bashundhara Corporate HQ, Baridhara',
    permittedZones: [
      { zoneId: 'Z-01', name: 'Sales & Distribution Floor (Level 4)', nameBn: 'বিক্রয় বিভাগ (৪র্থ তলা)', level: 'green', escortRequired: false },
    ],
    purpose: 'Sign Purchase Order for 2,500 Tons Road Bitumen Delivery',
    expectedDate: 'Today, 29 Oct',
    expectedTime: '11:00 AM',
    checkInTime: '11:05 AM',
    status: 'checked_in',
    durationHours: 3,
    vehiclePlate: 'DHAKA-METRO-GHA-18-2020',
    badgeNo: 'CLN-09',
    vipProtocol: false,
    safetyBriefingCompleted: true,
    ndaSigned: true,
    ppeCleared: {
      hardHat: false,
      safetyGoggles: false,
      safetyShoes: false,
      hiVisVest: false,
      h2sBriefing: false,
    },
    phone: '+880 1819-338822',
    email: 'rezaul@nationalroad.com.bd',
    idProofType: 'National ID',
    idProofNumber: '19842691234567890',
    emergencyContact: 'Office: 01819-001122',
    vipTier: 'Official Delegation',
    executiveSuite: 'Sales Meeting Room B',
    parkingBay: 'Visitor Bay #08',
    dietaryPreferences: 'Tea & Coffee',
    isEvacuatedSafe: true,
  },
  {
    id: 'VIS-2026-0813',
    name: 'Enamul Haque',
    organization: 'Energypac Power Generation Ltd.',
    designation: 'Senior Generator Service Engineer',
    category: 'vendor',
    hostEmployee: 'Engr. Md. Harunur Rashid',
    hostDept: 'Plant Operations',
    hostPhone: '+880 1713-441199',
    facility: 'Keraniganj Bitumen Refinery',
    permittedZones: [
      { zoneId: 'Z-01', name: 'Plant Workshop & Power Room', nameBn: 'প্ল্যান্ট ওয়ার্কশপ ও পাওয়ার রুম', level: 'yellow', escortRequired: true },
    ],
    purpose: 'Pre-Maintenance Inspection of 1,200 kVA Backup Power Generator',
    expectedDate: 'Today, 29 Oct',
    expectedTime: '11:15 AM',
    checkInTime: '11:12 AM',
    status: 'checked_in',
    durationHours: 4,
    vehiclePlate: 'DHAKA-METRO-KHA-55-4019',
    badgeNo: 'VND-18',
    vipProtocol: false,
    safetyBriefingCompleted: true,
    ndaSigned: true,
    ppeCleared: {
      hardHat: true,
      safetyGoggles: true,
      safetyShoes: true,
      hiVisVest: true,
      h2sBriefing: true,
    },
    phone: '+880 1912-345678',
    email: 'enamul.haque@energypac.com',
    idProofType: 'Company ID',
    idProofNumber: 'EPG-BD-8841',
    emergencyContact: 'Energypac Service Desk: 02-9883300',
    escortOfficer: 'Nazmul Huda (Safety Officer)',
    parkingBay: 'Service Van Lot #12',
    isEvacuatedSafe: true,
  },
  {
    id: 'VIS-2026-0810',
    name: 'Kazi Mahbub Alam',
    organization: 'BSTI Standards Bureau',
    designation: 'Senior Quality Inspector',
    category: 'govt',
    hostEmployee: 'Farida Begum',
    hostDept: 'Finance & Accounts',
    hostPhone: '+880 1819-223344',
    facility: 'Keraniganj Bitumen Refinery',
    permittedZones: [
      { zoneId: 'Z-02', name: 'Quality Testing Lab', nameBn: 'মান নিয়ন্ত্রণ ল্যাব', level: 'yellow', escortRequired: false },
    ],
    purpose: 'Verify Renewal Fee Challan & Collect Product Quality Sample',
    expectedDate: 'Today, 29 Oct',
    expectedTime: '09:00 AM',
    checkInTime: '09:05 AM',
    checkOutTime: '12:40 PM',
    status: 'checked_out',
    durationHours: 3.5,
    badgeNo: 'GOVT-02',
    ndaSigned: true,
    safetyBriefingCompleted: true,
    ppeCleared: {
      hardHat: true,
      safetyGoggles: true,
      safetyShoes: true,
      hiVisVest: true,
      h2sBriefing: true,
    },
    phone: '+880 1819-876543',
    idProofType: 'Official Govt Badge',
    idProofNumber: 'BSTI-CHEM-092',
    vipTier: 'VIP - Level 2',
    isEvacuatedSafe: true,
  },
];

/* ──────────────────────────────────────────────────────────────────────────
   5. DAILY ATTENDANCE ROSTER & LEAVE REQUESTS
   ────────────────────────────────────────────────────────────────────────── */
export interface ShiftWorker {
  id: string; // Canonical empId e.g. EMP-1042
  name: string;
  roleTitle: string;
  appRole: AppRole;
  dept: string;
  site: 'HQ_BARIDHARA' | 'PLANT_KERANIGANJ';
  shift: string;
  inTime: string;
  outTime: string;
  locationStatus: 'inside_geofence' | 'remote_approved' | 'late' | 'absent';
  overtimeHours: number;
  distanceMeters: number;
}

export interface LeaveRequestItem {
  id: string;
  empId: string;
  employeeName: string;
  designation: string;
  dept: string;
  leaveType: 'Sick Leave' | 'Casual Leave' | 'Earned Leave' | 'Late Arrival Note';
  fromDate: string;
  toDate: string;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedBy?: string;
}

const INITIAL_ATTENDANCE_ROSTER: ShiftWorker[] = [
  {
    id: 'EMP-0001',
    name: 'Ahmed Akbar Sobhan',
    roleTitle: 'Chairman & Managing Director',
    appRole: 'chairman',
    dept: "Chairman's Office",
    site: 'HQ_BARIDHARA',
    shift: 'Executive Hours',
    inTime: '09:05 AM',
    outTime: 'On Duty',
    locationStatus: 'inside_geofence',
    overtimeHours: 0,
    distanceMeters: 15,
  },
  {
    id: 'EMP-0012',
    name: 'Engr. Md. Harunur Rashid',
    roleTitle: 'Plant General Manager',
    appRole: 'plant_gm',
    dept: 'Plant Operations',
    site: 'PLANT_KERANIGANJ',
    shift: 'General (08:30 AM – 05:30 PM)',
    inTime: '08:18 AM',
    outTime: 'On Duty',
    locationStatus: 'inside_geofence',
    overtimeHours: 1.0,
    distanceMeters: 30,
  },
  {
    id: 'EMP-0028',
    name: 'Sayeda Afroza Sultana',
    roleTitle: 'GM, HR & Administration',
    appRole: 'hr_admin',
    dept: 'Human Resources',
    site: 'HQ_BARIDHARA',
    shift: 'General (09:00 AM – 06:00 PM)',
    inTime: '08:50 AM',
    outTime: 'On Duty',
    locationStatus: 'inside_geofence',
    overtimeHours: 0,
    distanceMeters: 22,
  },
  {
    id: 'EMP-0045',
    name: 'Md. Kamruzzaman',
    roleTitle: 'Transport & Admin Supervisor',
    appRole: 'transport_admin',
    dept: 'Transport & Logistics',
    site: 'PLANT_KERANIGANJ',
    shift: 'Morning (08:00 AM – 05:00 PM)',
    inTime: '07:52 AM',
    outTime: 'On Duty',
    locationStatus: 'inside_geofence',
    overtimeHours: 1.5,
    distanceMeters: 48,
  },
  {
    id: 'EMP-0062',
    name: 'Farida Begum',
    roleTitle: 'Head of Finance & Approver',
    appRole: 'hod',
    dept: 'Finance & Accounts',
    site: 'HQ_BARIDHARA',
    shift: 'General (09:00 AM – 06:00 PM)',
    inTime: '08:55 AM',
    outTime: 'On Duty',
    locationStatus: 'inside_geofence',
    overtimeHours: 0,
    distanceMeters: 18,
  },
  {
    id: 'EMP-1042',
    name: 'Tanvir Ahmed',
    roleTitle: 'Senior Sales Officer',
    appRole: 'employee',
    dept: 'Sales & Distribution',
    site: 'HQ_BARIDHARA',
    shift: 'General (09:00 AM – 06:00 PM)',
    inTime: '08:52 AM',
    outTime: 'On Duty',
    locationStatus: 'inside_geofence',
    overtimeHours: 0,
    distanceMeters: 42,
  },
  {
    id: 'EMP-0821',
    name: 'Md. Rafiqul Islam',
    roleTitle: 'Senior Company Driver',
    appRole: 'driver',
    dept: 'Transport & Logistics',
    site: 'HQ_BARIDHARA',
    shift: 'Morning Shift (07:00 AM – 04:00 PM)',
    inTime: '06:48 AM',
    outTime: 'On Duty',
    locationStatus: 'inside_geofence',
    overtimeHours: 2.0,
    distanceMeters: 65,
  },
  {
    id: 'EMP-1088',
    name: 'Engr. Tariqul Islam',
    roleTitle: 'Senior Plant Maintenance Engineer',
    appRole: 'employee',
    dept: 'Plant Operations',
    site: 'PLANT_KERANIGANJ',
    shift: 'General (08:30 AM – 05:30 PM)',
    inTime: 'On Approved Leave',
    outTime: '-',
    locationStatus: 'absent',
    overtimeHours: 0,
    distanceMeters: 0,
  },
  {
    id: 'EMP-1104',
    name: 'Nazmul Huda',
    roleTitle: 'Senior Safety & Environment Officer',
    appRole: 'employee',
    dept: 'HSE & Compliance',
    site: 'PLANT_KERANIGANJ',
    shift: 'General (09:00 AM – 06:00 PM)',
    inTime: '09:14 AM',
    outTime: 'On Duty',
    locationStatus: 'late',
    overtimeHours: 0,
    distanceMeters: 120,
  },
  {
    id: 'EMP-0914',
    name: 'Mizanur Rahman',
    roleTitle: 'Main Gate & Security Officer',
    appRole: 'employee',
    dept: 'Security Administration',
    site: 'PLANT_KERANIGANJ',
    shift: 'Shift A (07:00 AM – 03:00 PM)',
    inTime: '06:54 AM',
    outTime: 'On Duty',
    locationStatus: 'inside_geofence',
    overtimeHours: 1.0,
    distanceMeters: 12,
  },
];

const INITIAL_LEAVES: LeaveRequestItem[] = [
  {
    id: 'LV-2026-089',
    empId: 'EMP-0952',
    employeeName: 'Md. Rahim Uddin',
    designation: 'Senior Accounts Executive',
    dept: 'Finance & Accounts',
    leaveType: 'Sick Leave',
    fromDate: '30 Oct 2026',
    toDate: '03 Nov 2026',
    days: 5,
    reason: 'Post-surgery medical rest recommended by Evercare Hospital doctor. Daily work handed over to colleague.',
    status: 'pending',
    submittedAt: '29 Oct 2026, 08:45 AM',
  },
  {
    id: 'LV-2026-084',
    empId: 'EMP-1088',
    employeeName: 'Engr. Tariqul Islam',
    designation: 'Senior Plant Maintenance Engineer',
    dept: 'Plant Operations',
    leaveType: 'Casual Leave',
    fromDate: '29 Oct 2026',
    toDate: '30 Oct 2026',
    days: 2,
    reason: 'Family medical checkup in Dhaka.',
    status: 'approved',
    submittedAt: '27 Oct 2026, 04:10 PM',
    reviewedBy: 'Engr. Md. Harunur Rashid',
  },
];

/* ──────────────────────────────────────────────────────────────────────────
   6. LEADERSHIP MESSAGING (INNER CIRCLE CHAT)
   ────────────────────────────────────────────────────────────────────────── */
export interface ChatMember {
  id: string;
  name: string;
  role: string;
  initials: string;
  color: string;
  status: 'online' | 'away' | 'in-meeting' | 'offline';
  statusLabel: string;
  location: string;
  phone: string;
  lastSeen?: string;
  unread?: number;
}

export interface ChatChannel {
  id: string;
  name: string;
  description: string;
  membersCount: number;
  unread?: number;
  isLocked?: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole?: string;
  senderInitials: string;
  senderColor: string;
  content: string;
  timestamp: string;
  type: 'text' | 'voice' | 'document' | 'directive';
  isUrgent?: boolean;
  isPinned?: boolean;
  isChairman?: boolean;
  readBy: string[];
  directiveId?: string;
  directiveAcknowledged?: boolean;
  fileName?: string;
  fileSize?: string;
  voiceDuration?: string;
  reactions?: Record<string, number>;
  repliesCount?: number;
}

const INITIAL_CHANNELS: ChatChannel[] = [
  { id: 'ch_executive', name: 'leadership-board', description: 'Chairman & Department Heads — Daily Decisions & Updates', membersCount: 7, unread: 2 },
  { id: 'ch_refinery', name: 'keraniganj-plant-updates', description: 'Daily Bitumen Production, Tank Levels & Maintenance', membersCount: 5, unread: 1 },
  { id: 'ch_capex', name: 'finance-and-purchases', description: 'Bank Payments, Vendor Quotes & Major Purchase Approvals', membersCount: 4 },
  { id: 'ch_statutory', name: 'permits-and-safety', description: 'Government License Renewals, BSTI & Plant Safety', membersCount: 4, isLocked: true },
];

const INITIAL_CHAT_MEMBERS: ChatMember[] = [
  { id: 'hr', name: 'Engr. Md. Harunur Rashid', role: 'Plant General Manager', initials: 'HR', color: '#0369A1', status: 'online', statusLabel: 'At Plant Control Office', location: 'Keraniganj Plant', phone: '+880 1713-441199', unread: 1 },
  { id: 'fb', name: 'Farida Begum', role: 'Head of Finance & Approver', initials: 'FB', color: '#7C3AED', status: 'in-meeting', statusLabel: 'In Monthly Budget Review', location: 'Head Office, Level 9', phone: '+880 1819-223344' },
  { id: 'sas', name: 'Sayeda Afroza Sultana', role: 'GM, HR & Administration', initials: 'SAS', color: '#BE185D', status: 'online', statusLabel: 'Available at HR Office', location: 'Head Office, Level 6', phone: '+880 1714-882200' },
  { id: 'kz', name: 'Md. Kamruzzaman', role: 'Transport & Admin Supervisor', initials: 'KZ', color: '#059669', status: 'online', statusLabel: 'At Dispatch Yard', location: 'Keraniganj Plant', phone: '+880 1712-990011' },
  { id: 'km', name: 'Adv. Karim Molla', role: 'Head of Legal & Permits', initials: 'KM', color: '#0891B2', status: 'away', statusLabel: 'Visiting Energy Ministry', location: 'Secretariat, Dhaka', phone: '+880 1711-002103', unread: 1 },
  { id: 'si', name: 'Md. Shafiqul Islam', role: 'Head of Sales & Marketing', initials: 'SI', color: '#D97706', status: 'online', statusLabel: 'Available at Head Office', location: 'Head Office, Level 4', phone: '+880 1711-002104' },
];

const INITIAL_CHAT_MESSAGES: Record<string, ChatMessage[]> = {
  ch_executive: [
    {
      id: 'm1',
      senderId: 'hr',
      senderName: 'Engr. Md. Harunur Rashid',
      senderRole: 'Plant General Manager',
      senderInitials: 'HR',
      senderColor: '#0369A1',
      content: 'Assalamu Alaikum Chairman Sir. Keraniganj Plant produced 520 Metric Tons of Grade 60/70 road bitumen yesterday — 8% above our daily target. All 4 main storage tanks are operating smoothly.',
      timestamp: '09:14 AM',
      type: 'text',
      readBy: ['fb', 'km', 'si', 'sas', 'chairman'],
      reactions: { '👍': 4, '👏': 2 },
    },
    {
      id: 'm2',
      senderId: 'hr',
      senderName: 'Engr. Md. Harunur Rashid',
      senderRole: 'Plant General Manager',
      senderInitials: 'HR',
      senderColor: '#0369A1',
      content: 'Daily_Plant_Production_Summary_29Oct2026.pdf',
      timestamp: '09:15 AM',
      type: 'document',
      fileName: 'Daily_Plant_Production_Summary_29Oct2026.pdf',
      fileSize: '2.4 MB',
      readBy: ['fb', 'km', 'si', 'sas', 'chairman'],
      reactions: { '📥': 3 },
    },
    {
      id: 'm3',
      senderId: 'chairman',
      senderName: 'Ahmed Akbar Sobhan',
      senderRole: 'Chairman & Managing Director',
      senderInitials: 'AAS',
      senderColor: '#A51C30',
      content: 'PROCEED WITH THE 1,200 KVA BACKUP GENERATOR MAINTENANCE IMMEDIATELY SO FACTORY POWER IS NEVER INTERRUPTED. FINANCE PLEASE PREPARE THE PURCHASE ORDER ONCE SIGNED.',
      timestamp: '09:22 AM',
      type: 'directive',
      directiveId: 'DIR-2026-0922',
      directiveAcknowledged: true,
      isChairman: true,
      isUrgent: true,
      isPinned: true,
      readBy: ['hr', 'fb', 'km', 'si', 'sas'],
      reactions: { '✅': 5 },
    },
    {
      id: 'm4',
      senderId: 'fb',
      senderName: 'Farida Begum',
      senderRole: 'Head of Finance & Approver',
      senderInitials: 'FB',
      senderColor: '#7C3AED',
      content: 'Noted Chairman Sir. Funds are reserved in the Factory Maintenance Account and Energypac Purchase Order draft is ready for immediate release.',
      timestamp: '09:28 AM',
      type: 'text',
      readBy: ['hr', 'km', 'si', 'sas', 'chairman'],
      reactions: { '👍': 3 },
    },
    {
      id: 'm5',
      senderId: 'sas',
      senderName: 'Sayeda Afroza Sultana',
      senderRole: 'GM, HR & Administration',
      senderInitials: 'SAS',
      senderColor: '#BE185D',
      content: 'Morning Attendance & Shuttle Bus Arrival Summary (94.2% On-Time)',
      timestamp: '10:05 AM',
      type: 'voice',
      voiceDuration: '0:38',
      readBy: ['hr', 'fb', 'chairman'],
    },
  ],
  ch_refinery: [
    {
      id: 'rf1',
      senderId: 'hr',
      senderName: 'Engr. Md. Harunur Rashid',
      senderRole: 'Plant General Manager',
      senderInitials: 'HR',
      senderColor: '#0369A1',
      content: 'Morning check complete: Storage Tank TK-102 small drain valve seal is being replaced today by our maintenance team. Zero impact on truck loading.',
      timestamp: '08:20 AM',
      type: 'text',
      isUrgent: true,
      readBy: ['chairman'],
    },
    {
      id: 'rf2',
      senderId: 'kz',
      senderName: 'Md. Kamruzzaman',
      senderRole: 'Transport & Admin Supervisor',
      senderInitials: 'KZ',
      senderColor: '#059669',
      content: '3 bulk bitumen tankers loaded this morning for Mongla Port and Narayanganj road contractors. All drivers passed morning safety check.',
      timestamp: '09:40 AM',
      type: 'text',
      readBy: ['hr', 'chairman'],
    },
  ],
  ch_capex: [
    {
      id: 'cp1',
      senderId: 'fb',
      senderName: 'Farida Begum',
      senderRole: 'Head of Finance & Approver',
      senderInitials: 'FB',
      senderColor: '#7C3AED',
      content: 'October Expense Summary: ৳48.50 Lakh pending for Plant Backup Generator service, and ৳85,000 pending for Q4 Head Office paper & printer toner.',
      timestamp: '10:15 AM',
      type: 'text',
      readBy: ['chairman', 'hr'],
    },
  ],
  ch_statutory: [
    {
      id: 'st1',
      senderId: 'km',
      senderName: 'Adv. Karim Molla',
      senderRole: 'Head of Legal & Permits',
      senderInitials: 'KM',
      senderColor: '#0891B2',
      content: 'Energy Division raw material import permit (7 days remaining) is on the Additional Secretary’s desk today. Official reminder letter ready for dispatch.',
      timestamp: '10:50 AM',
      type: 'text',
      isUrgent: true,
      readBy: ['chairman', 'hr'],
    },
  ],
  hr: [
    {
      id: 'dm_hr1',
      senderId: 'hr',
      senderName: 'Engr. Md. Harunur Rashid',
      senderRole: 'Plant General Manager',
      senderInitials: 'HR',
      senderColor: '#0369A1',
      content: 'Sir, Chief Inspector Dr. Shahabuddin from the Dept. of Explosives arrived at 10:28 AM for our annual tank storage license renewal check. Everything is going smoothly.',
      timestamp: '10:35 AM',
      type: 'text',
      readBy: ['chairman'],
    },
    {
      id: 'dm_hr2',
      senderId: 'chairman',
      senderName: 'Ahmed Akbar Sobhan',
      senderRole: 'Chairman & Managing Director',
      senderInitials: 'AAS',
      senderColor: '#A51C30',
      content: 'Thank you Harunur. Give him full access to all safety inspection logs and update me once the visit concludes.',
      timestamp: '10:42 AM',
      type: 'text',
      isChairman: true,
      readBy: ['hr'],
    },
  ],
  fb: [
    {
      id: 'dm_fb1',
      senderId: 'fb',
      senderName: 'Farida Begum',
      senderRole: 'Head of Finance & Approver',
      senderInitials: 'FB',
      senderColor: '#7C3AED',
      content: 'Assalamu Alaikum Sir. Tomorrow at 10:00 AM I have a meeting at Bangladesh Bank Motijheel regarding our raw material import L/C.',
      timestamp: '09:50 AM',
      type: 'text',
      readBy: ['chairman'],
    },
  ],
  sas: [
    {
      id: 'dm_sas1',
      senderId: 'sas',
      senderName: 'Sayeda Afroza Sultana',
      senderRole: 'GM, HR & Administration',
      senderInitials: 'SAS',
      senderColor: '#BE185D',
      content: 'All 10 active staff shuttle bus routes arrived on time at Keraniganj Plant before 8:05 AM today.',
      timestamp: '08:30 AM',
      type: 'text',
      readBy: ['chairman'],
    },
  ],
  kz: [
    {
      id: 'dm_kz1',
      senderId: 'kz',
      senderName: 'Md. Kamruzzaman',
      senderRole: 'Transport & Admin Supervisor',
      senderInitials: 'KZ',
      senderColor: '#059669',
      content: 'Executive Prado (GHA-13-8821) and Senior Driver Md. Rafiqul Islam are on standby at Head Office Gate-1.',
      timestamp: '09:00 AM',
      type: 'text',
      readBy: ['chairman'],
    },
  ],
  km: [
    {
      id: 'dm_km1',
      senderId: 'km',
      senderName: 'Adv. Karim Molla',
      senderRole: 'Head of Legal & Permits',
      senderInitials: 'KM',
      senderColor: '#0891B2',
      content: 'Sir, I am at the Bangladesh Secretariat following up on the Annual Import Quota renewal file (EMRD/BOGCL/2026/09). Expecting clearance signature by Thursday.',
      timestamp: '11:10 AM',
      type: 'text',
      readBy: [],
    },
  ],
  si: [
    {
      id: 'dm_si1',
      senderId: 'si',
      senderName: 'Md. Shafiqul Islam',
      senderRole: 'Head of Sales & Marketing',
      senderInitials: 'SI',
      senderColor: '#D97706',
      content: 'Roads & Highways (RHD) Executive Engineer is visiting Level 4 at 3:15 PM today to finalize the ৳14.5 Crore bitumen supply schedule.',
      timestamp: '10:20 AM',
      type: 'text',
      readBy: ['chairman'],
    },
  ],
};

/* ──────────────────────────────────────────────────────────────────────────
   7. USER PROFILE SETTINGS (DELEGATION & SESSIONS)
   ────────────────────────────────────────────────────────────────────────── */
export interface UserDeviceSession {
  id: string;
  device: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface UserProfilePreferences {
  delegationActive: boolean;
  delegateToName: string;
  delegateUntil: string;
  sessions: UserDeviceSession[];
}

const INITIAL_PROFILE_PREFS: UserProfilePreferences = {
  delegationActive: false,
  delegateToName: 'Farida Begum (Head of Finance)',
  delegateUntil: '05 Nov 2026',
  sessions: [
    { id: 'sess-1', device: 'Windows Office Workstation · Chrome Browser', location: 'Dhaka, Bangladesh (Current)', lastActive: 'Active Now', isCurrent: true },
    { id: 'sess-2', device: 'Company Mobile App · iPhone / Android', location: 'Baridhara Head Office Wi-Fi', lastActive: 'Today, 09:15 AM', isCurrent: false },
  ],
};

/* ──────────────────────────────────────────────────────────────────────────
   OPERATIONS SINGLETON STORE
   ────────────────────────────────────────────────────────────────────────── */
class OperationsStore {
  private licenses: LicenseCard[] = [...INITIAL_LICENSES];
  private incidents: IncidentItem[] = [...INITIAL_INCIDENTS];
  private parcels: ParcelItem[] = [...INITIAL_PARCELS];
  private visitors: VisitorRecord[] = [...INITIAL_VISITORS];
  private attendanceRoster: ShiftWorker[] = [...INITIAL_ATTENDANCE_ROSTER];
  private leaveRequests: LeaveRequestItem[] = [...INITIAL_LEAVES];
  private chatChannels: ChatChannel[] = [...INITIAL_CHANNELS];
  private chatMembers: ChatMember[] = [...INITIAL_CHAT_MEMBERS];
  private chatMessages: Record<string, ChatMessage[]> = { ...INITIAL_CHAT_MESSAGES };
  private profilePrefs: UserProfilePreferences = { ...INITIAL_PROFILE_PREFS };
  private listeners: Set<() => void> = new Set();

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  // ── Getters ──
  getLicenses() { return this.licenses; }
  getIncidents() { return this.incidents; }
  getParcels() { return this.parcels; }
  getVisitors() { return this.visitors; }
  getAttendanceRoster() { return this.attendanceRoster; }
  getLeaveRequests() { return this.leaveRequests; }
  getChatChannels() { return this.chatChannels; }
  getChatMembers() { return this.chatMembers; }
  getChatMessages() { return this.chatMessages; }
  getProfilePrefs() { return this.profilePrefs; }

  // ── 1. Compliance Licenses Actions ──
  setLicenses(updater: LicenseCard[] | ((prev: LicenseCard[]) => LicenseCard[])) {
    const next = typeof updater === 'function' ? updater(this.licenses) : updater;
    // Automatically normalize Stage 5 (Renewed & Active) permits so they never show urgent expiring alerts!
    this.licenses = next.map((lic) => {
      if (lic.stage === 5 && lic.daysLeft < 60) {
        return {
          ...lic,
          daysLeft: 365,
          lastInspection: SYSTEM_TODAY,
          certificateValidity: '29 Oct 2026 – 28 Oct 2027 (Renewed)',
          auditChecklist: lic.auditChecklist.map((c) => ({ ...c, passed: true })),
        };
      }
      return lic;
    });
    this.notify();
  }

  // ── 2. Safety Incidents Actions ──
  setIncidents(updater: IncidentItem[] | ((prev: IncidentItem[]) => IncidentItem[])) {
    this.incidents = typeof updater === 'function' ? updater(this.incidents) : updater;
    this.notify();
  }

  advanceIncidentStatus(incidentId: string) {
    this.incidents = this.incidents.map((inc) => {
      if (inc.id !== incidentId) return inc;
      const nextStatus: IncidentItem['capaStatus'] =
        inc.capaStatus === 'open' ? 'in_progress' : 'closed';
      return { ...inc, capaStatus: nextStatus };
    });
    this.notify();
  }

  // ── 3. Parcels Actions ──
  setParcels(updater: ParcelItem[] | ((prev: ParcelItem[]) => ParcelItem[])) {
    this.parcels = typeof updater === 'function' ? updater(this.parcels) : updater;
    this.notify();
  }

  advanceParcelStage(parcelId: string, actorName: string, actorRoleTitle: string) {
    const STAGE_LABELS: Record<number, { en: string; bn: string; loc: string; eta: string; pct: number; status: ParcelItem['status'] }> = {
      2: { en: 'Handed to Driver', bn: 'ড্রাইভারের নিকট হস্তান্তর', loc: 'Dispatch Loading Gate', eta: 'On the road (ETA 1 hr)', pct: 35, status: 'in_transit' },
      3: { en: 'On the Way (Checkpoint Passed)', bn: 'পথে রয়েছে (চেকপয়েন্ট অতিক্রম)', loc: 'Babubazar Bridge Checkpoint', eta: 'Arriving within 30 mins', pct: 68, status: 'in_transit' },
      4: { en: 'Arrived at Reception Desk', bn: 'রিসিপশন ডেস্কে পৌঁছেছে', loc: 'Destination Reception Desk', eta: 'Ready for PIN Handover', pct: 90, status: 'at_gate' },
    };

    this.parcels = this.parcels.map((p) => {
      if (p.id !== parcelId || p.currentStage >= 4 || p.status === 'delivered' || p.status === 'returned') {
        return p;
      }
      const nextStage = p.currentStage + 1;
      const meta = STAGE_LABELS[nextStage];
      if (!meta) return p;

      const log: CustodyLogEntry = {
        stage: nextStage,
        stageName: meta.en,
        stageNameBn: meta.bn,
        location: meta.loc,
        timestamp: 'Today, Just Now',
        actor: actorName,
        actorRole: actorRoleTitle,
        notes: `Parcel moved to Stage ${nextStage} (${meta.en}). Seal checked intact.`,
      };

      return {
        ...p,
        currentStage: nextStage,
        status: meta.status,
        eta: meta.eta,
        corridorProgressPercent: meta.pct,
        lastUpdated: 'Today, Just Now',
        chainOfCustody: [...p.chainOfCustody, log],
      };
    });
    this.notify();
  }

  // ── 4. Visitors Actions ──
  setVisitors(updater: VisitorRecord[] | ((prev: VisitorRecord[]) => VisitorRecord[])) {
    this.visitors = typeof updater === 'function' ? updater(this.visitors) : updater;
    this.notify();
  }

  // ── 5. Daily Attendance & Leave Actions ──
  punchAttendance(role: AppRole, action: 'in' | 'out', site?: 'HQ_BARIDHARA' | 'PLANT_KERANIGANJ') {
    const meta = ROLE_META[role];
    const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const exists = this.attendanceRoster.some((w) => w.id === meta.empId);
    if (exists) {
      this.attendanceRoster = this.attendanceRoster.map((w) => {
        if (w.id !== meta.empId) return w;
        if (action === 'in') {
          return {
            ...w,
            site: site || w.site,
            inTime: nowTime,
            outTime: 'On Duty',
            locationStatus: 'inside_geofence',
            distanceMeters: 28,
          };
        }
        return {
          ...w,
          outTime: nowTime,
        };
      });
    } else {
      this.attendanceRoster = [
        {
          id: meta.empId,
          name: meta.name,
          roleTitle: meta.label,
          appRole: role,
          dept: meta.dept,
          site: site || (meta.site === 'PLANT_KERANIGANJ' ? 'PLANT_KERANIGANJ' : 'HQ_BARIDHARA'),
          shift: 'General (09:00 AM – 06:00 PM)',
          inTime: action === 'in' ? nowTime : '08:55 AM',
          outTime: action === 'out' ? nowTime : 'On Duty',
          locationStatus: 'inside_geofence',
          overtimeHours: 0,
          distanceMeters: 25,
        },
        ...this.attendanceRoster,
      ];
    }
    this.notify();
  }

  addLeaveRequest(data: Omit<LeaveRequestItem, 'id' | 'status' | 'submittedAt'>): LeaveRequestItem {
    const newLeave: LeaveRequestItem = {
      ...data,
      id: `LV-2026-${Math.floor(100 + Math.random() * 899)}`,
      status: 'pending',
      submittedAt: `${SYSTEM_TODAY}, Just Now`,
    };
    this.leaveRequests = [newLeave, ...this.leaveRequests];
    this.notify();
    return newLeave;
  }

  updateLeaveStatus(leaveId: string, status: 'approved' | 'rejected', reviewerName: string) {
    let targetEmpId: string | undefined;
    this.leaveRequests = this.leaveRequests.map((lv) => {
      if (lv.id === leaveId) {
        targetEmpId = lv.empId;
        return { ...lv, status, reviewedBy: reviewerName };
      }
      return lv;
    });

    if (status === 'approved' && targetEmpId) {
      this.attendanceRoster = this.attendanceRoster.map((w) =>
        w.id === targetEmpId
          ? { ...w, inTime: 'On Approved Leave', outTime: '-', locationStatus: 'absent' }
          : w
      );
    }
    this.notify();
  }

  // ── 6. Leadership Messaging Actions ──
  markConversationRead(targetType: 'channel' | 'dm', targetId: string) {
    if (targetType === 'channel') {
      const ch = this.chatChannels.find((c) => c.id === targetId);
      if (ch && ch.unread) {
        this.chatChannels = this.chatChannels.map((c) => (c.id === targetId ? { ...c, unread: 0 } : c));
        this.notify();
      }
    } else {
      const mem = this.chatMembers.find((m) => m.id === targetId);
      if (mem && mem.unread) {
        this.chatMembers = this.chatMembers.map((m) => (m.id === targetId ? { ...m, unread: 0 } : m));
        this.notify();
      }
    }
  }

  setChatMessages(
    updater:
      | Record<string, ChatMessage[]>
      | ((prev: Record<string, ChatMessage[]>) => Record<string, ChatMessage[]>)
  ) {
    this.chatMessages = typeof updater === 'function' ? updater(this.chatMessages) : updater;
    this.notify();
  }

  // ── 7. Profile Preferences Actions ──
  updateProfilePrefs(updates: Partial<UserProfilePreferences>) {
    this.profilePrefs = { ...this.profilePrefs, ...updates };
    this.notify();
  }

  revokeSession(sessionId: string) {
    this.profilePrefs = {
      ...this.profilePrefs,
      sessions: this.profilePrefs.sessions.filter((s) => s.id !== sessionId || s.isCurrent),
    };
    this.notify();
  }
}

export const operationsStore = new OperationsStore();

export function useOperationsStore() {
  const [state, setState] = useState(() => ({
    licenses: operationsStore.getLicenses(),
    incidents: operationsStore.getIncidents(),
    parcels: operationsStore.getParcels(),
    visitors: operationsStore.getVisitors(),
    attendanceRoster: operationsStore.getAttendanceRoster(),
    leaveRequests: operationsStore.getLeaveRequests(),
    chatChannels: operationsStore.getChatChannels(),
    chatMembers: operationsStore.getChatMembers(),
    chatMessages: operationsStore.getChatMessages(),
    profilePrefs: operationsStore.getProfilePrefs(),
  }));

  useEffect(() => {
    return operationsStore.subscribe(() => {
      setState({
        licenses: [...operationsStore.getLicenses()],
        incidents: [...operationsStore.getIncidents()],
        parcels: [...operationsStore.getParcels()],
        visitors: [...operationsStore.getVisitors()],
        attendanceRoster: [...operationsStore.getAttendanceRoster()],
        leaveRequests: [...operationsStore.getLeaveRequests()],
        chatChannels: [...operationsStore.getChatChannels()],
        chatMembers: [...operationsStore.getChatMembers()],
        chatMessages: { ...operationsStore.getChatMessages() },
        profilePrefs: { ...operationsStore.getProfilePrefs() },
      });
    });
  }, []);

  return {
    ...state,
    setLicenses: operationsStore.setLicenses.bind(operationsStore),
    setIncidents: operationsStore.setIncidents.bind(operationsStore),
    advanceIncidentStatus: operationsStore.advanceIncidentStatus.bind(operationsStore),
    setParcels: operationsStore.setParcels.bind(operationsStore),
    advanceParcelStage: operationsStore.advanceParcelStage.bind(operationsStore),
    setVisitors: operationsStore.setVisitors.bind(operationsStore),
    punchAttendance: operationsStore.punchAttendance.bind(operationsStore),
    addLeaveRequest: operationsStore.addLeaveRequest.bind(operationsStore),
    updateLeaveStatus: operationsStore.updateLeaveStatus.bind(operationsStore),
    markConversationRead: operationsStore.markConversationRead.bind(operationsStore),
    setChatMessages: operationsStore.setChatMessages.bind(operationsStore),
    updateProfilePrefs: operationsStore.updateProfilePrefs.bind(operationsStore),
    revokeSession: operationsStore.revokeSession.bind(operationsStore),
  };
}

