import React, { useState, useMemo } from 'react';
import { ViewProps, ROLE_META, t } from '../types';
import { showToast } from '../App';
import {
  Users, User, UserCheck, ShieldAlert, QrCode, Plus, Search,
  CheckCircle, Clock, AlertTriangle, Building2, Crown,
  Download, Car, Shield, Phone, FileText, Check, X,
  Printer, Smartphone, ShieldCheck, Send, Sparkles,
  HardHat, Eye, MapPin, Compass, AlertCircle, Share2,
  ExternalLink, Key, CheckSquare, RefreshCw, ChevronRight,
  Flame, Radio, UserX, MessageSquare
} from 'lucide-react';

export interface PermittedZone {
  zoneId: string;
  name: string;
  nameBn: string;
  level: 'green' | 'yellow' | 'red';
  escortRequired: boolean;
}

export interface VisitorRecord {
  id: string; // e.g. 'VIS-2026-0811'
  name: string;
  organization: string;
  designation: string;
  category: 'vip' | 'govt' | 'vendor' | 'client' | 'regular';
  hostEmployee: string;
  hostDept: string;
  hostPhone?: string;
  facility: 'Keraniganj Bitumen Refinery' | 'Bashundhara Corporate HQ, Baridhara' | 'Chittagong Patenga Terminal';
  permittedZones: PermittedZone[];
  purpose: string;
  expectedDate: string;
  expectedTime: string;
  checkInTime?: string;
  checkOutTime?: string;
  durationHours?: number;
  status: 'pre_registered' | 'checked_in' | 'checked_out' | 'overdue';
  vehiclePlate?: string;
  badgeNo?: string;
  vipProtocol?: boolean;
  safetyBriefingCompleted: boolean;
  ndaSigned: boolean;
  ppeCleared: {
    hardHat: boolean;
    safetyGoggles: boolean;
    safetyShoes: boolean;
    hiVisVest: boolean;
    h2sBriefing: boolean;
  };
  phone?: string;
  email?: string;
  idProofType?: 'National ID' | 'Passport' | 'Official Govt Badge' | 'Company ID';
  idProofNumber?: string;
  emergencyContact?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPREHENSIVE REFINERY & CORPORATE SEED DATA
// ─────────────────────────────────────────────────────────────────────────────

const INITIAL_VISITORS: VisitorRecord[] = [
  // ── 1. REGULATORY GOVERNMENT INSPECTOR (Checked In - High Risk Zone) ──
  {
    id: 'VIS-2026-0811',
    name: 'Dr. Shahabuddin Ahmed',
    organization: 'Directorate of Explosives, Govt. of Bangladesh',
    designation: 'Chief Inspector of Explosives (Grade-1)',
    category: 'govt',
    hostEmployee: 'Engr. Md. Harunur Rashid',
    hostDept: 'Keraniganj Refinery Complex',
    hostPhone: '01711-554433',
    facility: 'Keraniganj Bitumen Refinery',
    permittedZones: [
      { zoneId: 'Z-01', name: 'Admin Building & Reception', nameBn: 'প্রশাসন ভবন ও অভ্যর্থনা', level: 'green', escortRequired: false },
      { zoneId: 'Z-02', name: 'Central QC & Bitumen Testing Lab', nameBn: 'কেন্দ্রীয় কিউসি ল্যাব', level: 'yellow', escortRequired: false },
      { zoneId: 'Z-03', name: 'Bitumen Reactor & Tank Farm Spheres', nameBn: 'রিঅ্যাক্টর ও স্টোরেজ স্ফিয়ার', level: 'red', escortRequired: true },
    ],
    purpose: 'Statutory Annual Inspection of Bitumen Storage Spheres, Pressure Relief Valves & Flare Stack',
    expectedDate: 'Today, 17 Oct',
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
    emergencyContact: 'Dept of Explosives Control: 02-9552144',
  },

  // ── 2. INTERNATIONAL VIP DIGNITARY (Pre-Registered - Chairman Escort) ──
  {
    id: 'VIS-2026-0812',
    name: 'Francois Dubois',
    organization: 'Axens Catalysts & Clean Fuels (France)',
    designation: 'Senior Technical Director, Hydroprocessing',
    category: 'vip',
    hostEmployee: 'Ahmed Akbar Sobhan',
    hostDept: "Chairman's Office",
    hostPhone: '01713-000001',
    facility: 'Bashundhara Corporate HQ, Baridhara',
    permittedZones: [
      { zoneId: 'Z-01', name: 'Executive Suite & Boardroom (Level 12)', nameBn: 'এক্সিকিউটিভ স্যুট ও বোর্ডরুম', level: 'green', escortRequired: false },
      { zoneId: 'Z-04', name: 'Project Engineering Studio (Level 9)', nameBn: 'প্রজেক্ট ইঞ্জিনিয়ারিং স্টুডিও', level: 'green', escortRequired: false },
    ],
    purpose: 'High-Level Technical Review for Euro-V Base Oil Expansion Plant & Catalyst Supply Agreement',
    expectedDate: 'Today, 17 Oct',
    expectedTime: '02:30 PM',
    status: 'pre_registered',
    durationHours: 3,
    vehiclePlate: 'DHAKA-METRO-CHA-22-1001 (VIP Escort Pool)',
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
    emergencyContact: 'French Embassy Diplomatic Security: 02-55668600',
  },

  // ── 3. ROADS & HIGHWAYS (RHD) EXECUTIVE (Pre-Registered - Host: TANVIR AHMED) ──
  {
    id: 'VIS-2026-0814',
    name: 'Engr. Mahfuzur Rahman',
    organization: 'Roads & Highways Department (RHD), Govt of BD',
    designation: 'Executive Engineer, Procurement & Quality Audit',
    category: 'govt',
    hostEmployee: 'Tanvir Ahmed',
    hostDept: 'Sales & Distribution, Dhaka',
    hostPhone: '01711-998877',
    facility: 'Bashundhara Corporate HQ, Baridhara',
    permittedZones: [
      { zoneId: 'Z-01', name: 'Sales & Commercial Division (Level 4)', nameBn: 'বিক্রয় ও বাণিজ্যিক বিভাগ', level: 'green', escortRequired: false },
      { zoneId: 'Z-02', name: 'Executive Meeting Room B (Level 4)', nameBn: 'নির্বাহী সভাকক্ষ', level: 'green', escortRequired: false },
    ],
    purpose: 'Commercial Review of BDT 14.5 Crore Penetration 60/70 Bitumen Tender & Certified Test Certificates',
    expectedDate: 'Today, 17 Oct',
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
    emergencyContact: 'RHD Dhaka Division: 02-48119830',
  },

  // ── 4. MAJOR ROAD CONTRACTOR (Checked In - Host: TANVIR AHMED) ──
  {
    id: 'VIS-2026-0815',
    name: 'S.M. Rezaul Karim',
    organization: 'National Asphalt & Infrastructure Works Ltd.',
    designation: 'Managing Director & Chief Contractor',
    category: 'client',
    hostEmployee: 'Tanvir Ahmed',
    hostDept: 'Sales & Distribution, Dhaka',
    hostPhone: '01711-998877',
    facility: 'Bashundhara Corporate HQ, Baridhara',
    permittedZones: [
      { zoneId: 'Z-01', name: 'Sales & Commercial Division (Level 4)', nameBn: 'বিক্রয় ও বাণিজ্যিক বিভাগ', level: 'green', escortRequired: false },
    ],
    purpose: 'Finalize Purchase Order for 2,500 MT Bulk Bitumen & Payment Term L/C Verification',
    expectedDate: 'Today, 17 Oct',
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
    email: 'rezaul@nationalasphalt.com.bd',
    idProofType: 'National ID',
    idProofNumber: '19842691234567890',
    emergencyContact: 'Corporate HQ: 01819-001122',
  },

  // ── 5. TECHNICAL VENDOR (Checked In - High Hazards SCADA PLC Checks) ──
  {
    id: 'VIS-2026-0813',
    name: 'Enamul Haque',
    organization: 'Siemens Energy Bangladesh Ltd.',
    designation: 'Field Service Automation Engineer',
    category: 'vendor',
    hostEmployee: 'Engr. Tariq Ahmed',
    hostDept: 'Refinery Maintenance',
    hostPhone: '01712-334455',
    facility: 'Keraniganj Bitumen Refinery',
    permittedZones: [
      { zoneId: 'Z-01', name: 'Admin Building & Workshop', nameBn: 'ওয়ার্কশপ ও প্রশাসন', level: 'green', escortRequired: false },
      { zoneId: 'Z-05', name: 'SCADA Central Control Room (DCS)', nameBn: 'স্কার্ডা কন্ট্রোল রুম', level: 'yellow', escortRequired: true },
    ],
    purpose: 'SCADA PLC Unit 2 firmware diagnostics, redundant safety interlock checks & burner trip loop verification',
    expectedDate: 'Today, 17 Oct',
    expectedTime: '11:15 AM',
    checkInTime: '11:12 AM',
    status: 'checked_in',
    durationHours: 6,
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
    email: 'enamul.haque@siemens-energy.com',
    idProofType: 'Company ID',
    idProofNumber: 'SIE-BD-8841',
    emergencyContact: 'Siemens Dispatch Control: 02-9883300',
  },

  // ── 6. STATUTORY STANDARDS OFFICER (Checked Out) ──
  {
    id: 'VIS-2026-0810',
    name: 'Kazi Mahbub Alam',
    organization: 'BSTI Standards Directorate',
    designation: 'Senior Field Officer, Chemical Testing Division',
    category: 'govt',
    hostEmployee: 'Adv. Karim Molla',
    hostDept: 'Legal & Regulatory Compliance',
    facility: 'Keraniganj Bitumen Refinery',
    permittedZones: [
      { zoneId: 'Z-02', name: 'Central Quality Lab (Keraniganj)', nameBn: 'কেন্দ্রীয় মান নিয়ন্ত্রণ ল্যাব', level: 'yellow', escortRequired: false },
    ],
    purpose: 'Sample verification for VG-30 Paving Grade Bitumen certification & laboratory batch logs audit',
    expectedDate: 'Today, 17 Oct',
    expectedTime: '09:00 AM',
    checkInTime: '09:05 AM',
    checkOutTime: '12:40 PM',
    status: 'checked_out',
    durationHours: 4,
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
  },
];

export default function GuestView({ role, lang }: ViewProps) {
  const currentUser = ROLE_META[role] || ROLE_META.employee;
  const currentUserName = currentUser.name;
  const currentUserDept = currentUser.dept;
  const isStaff = role === 'employee';

  // State
  const [visitors, setVisitors] = useState<VisitorRecord[]>(INITIAL_VISITORS);
  const [selectedVisitorId, setSelectedVisitorId] = useState<string>('VIS-2026-0811');
  const [activeTab, setActiveTab] = useState<'all' | 'inside' | 'my_guests' | 'vip_govt' | 'pre_registered'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [facilityFilter, setFacilityFilter] = useState<'all' | 'Keraniganj Bitumen Refinery' | 'Bashundhara Corporate HQ, Baridhara'>('all');

  // Scope Toggle: Staff defaults to 'my_guests' or 'all'
  const [scopeMode, setScopeMode] = useState<'my_guests' | 'all'>(isStaff ? 'my_guests' : 'all');

  // Cockpit Internal Sub-Views: 'pass' | 'ppe' | 'alpr' | 'zones'
  const [cockpitSubTab, setCockpitSubTab] = useState<'pass' | 'ppe' | 'alpr' | 'zones'>('pass');

  // Modals
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showGatePassModal, setShowGatePassModal] = useState(false);
  const [showALPRModal, setShowALPRModal] = useState(false);
  const [showMusterModal, setShowMusterModal] = useState(false);
  const [showSMSModal, setShowSMSModal] = useState(false);

  // Barrier simulator state
  const [barrierOpen, setBarrierOpen] = useState(false);

  // New Visitor Form State
  const [formName, setFormName] = useState('');
  const [formOrg, setFormOrg] = useState('');
  const [formDesignation, setFormDesignation] = useState('');
  const [formCategory, setFormCategory] = useState<VisitorRecord['category']>('client');
  const [formFacility, setFormFacility] = useState<VisitorRecord['facility']>('Bashundhara Corporate HQ, Baridhara');
  const [formHost, setFormHost] = useState(isStaff ? currentUserName : '');
  const [formPurpose, setFormPurpose] = useState('');
  const [formVehicle, setFormVehicle] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formDate, setFormDate] = useState('Today, 17 Oct');
  const [formTime, setFormTime] = useState('02:30 PM');
  const [formDuration, setFormDuration] = useState('3');
  const [formIdProofType, setFormIdProofType] = useState<VisitorRecord['idProofType']>('National ID');
  const [formIdProofNum, setFormIdProofNum] = useState('');

  // ─────────────────────────────────────────────────────────────────────────
  // Scoped & Filtered Visitors
  // ─────────────────────────────────────────────────────────────────────────
  const scopedVisitors = useMemo(() => {
    if (scopeMode === 'my_guests') {
      return visitors.filter(v => v.hostEmployee.toLowerCase().includes(currentUserName.toLowerCase()));
    }
    return visitors;
  }, [visitors, scopeMode, currentUserName]);

  const selectedVisitor = useMemo(() => {
    return visitors.find(v => v.id === selectedVisitorId) || scopedVisitors[0] || visitors[0];
  }, [visitors, selectedVisitorId, scopedVisitors]);

  // Statistics calculation
  const stats = useMemo(() => {
    const inside = visitors.filter(v => v.status === 'checked_in');
    const preReg = visitors.filter(v => v.status === 'pre_registered');
    const vipGovt = visitors.filter(v => v.category === 'vip' || v.category === 'govt');
    const myGuests = visitors.filter(v => v.hostEmployee.toLowerCase().includes(currentUserName.toLowerCase()));
    const myGuestsInside = myGuests.filter(v => v.status === 'checked_in');

    const ppeTotal = visitors.filter(v => v.facility === 'Keraniganj Bitumen Refinery');
    const ppeCleared = ppeTotal.filter(v => v.ppeCleared.hardHat && v.ppeCleared.safetyShoes);

    return {
      totalInside: inside.length,
      insideRefinery: inside.filter(v => v.facility === 'Keraniganj Bitumen Refinery').length,
      insideHQ: inside.filter(v => v.facility === 'Bashundhara Corporate HQ, Baridhara').length,
      preRegisteredCount: preReg.length,
      vipGovtCount: vipGovt.length,
      myGuestsCount: myGuests.length,
      myGuestsInsideCount: myGuestsInside.length,
      ppeComplianceRate: ppeTotal.length ? Math.round((ppeCleared.length / ppeTotal.length) * 100) : 100,
      overdueCount: visitors.filter(v => v.status === 'overdue').length,
    };
  }, [visitors, currentUserName]);

  const displayedVisitors = useMemo(() => {
    return scopedVisitors.filter(v => {
      // Tab Filtering
      if (activeTab === 'inside' && v.status !== 'checked_in') return false;
      if (activeTab === 'my_guests' && !v.hostEmployee.toLowerCase().includes(currentUserName.toLowerCase())) return false;
      if (activeTab === 'vip_govt' && v.category !== 'vip' && v.category !== 'govt') return false;
      if (activeTab === 'pre_registered' && v.status !== 'pre_registered') return false;

      // Facility filter
      if (facilityFilter !== 'all' && v.facility !== facilityFilter) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          v.name.toLowerCase().includes(q) ||
          v.organization.toLowerCase().includes(q) ||
          v.hostEmployee.toLowerCase().includes(q) ||
          v.id.toLowerCase().includes(q) ||
          (v.badgeNo && v.badgeNo.toLowerCase().includes(q)) ||
          (v.vehiclePlate && v.vehiclePlate.toLowerCase().includes(q)) ||
          v.purpose.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [scopedVisitors, activeTab, facilityFilter, searchQuery, currentUserName]);

  // ─────────────────────────────────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────────────────────────────────

  const handleCheckIn = (id: string) => {
    setVisitors(prev => prev.map(v => {
      if (v.id === id) {
        const badge = v.category === 'vip' ? 'VIP-02' : v.category === 'govt' ? 'GOVT-05' : `BDG-${Math.floor(100 + Math.random() * 900)}`;
        return {
          ...v,
          status: 'checked_in',
          checkInTime: 'Just Now',
          badgeNo: badge,
          safetyBriefingCompleted: true,
        };
      }
      return v;
    }));

    const target = visitors.find(v => v.id === id);
    if (target?.vipProtocol || target?.category === 'vip' || target?.category === 'govt') {
      showToast(
        lang === 'en'
          ? `👑 VIP PROTOCOL ACTIVATED: ${target?.name} checked in. Escort vehicle & Chairman Secretariat alerted.`
          : `👑 ভিআইপি প্রটোকল সক্রিয়: ${target?.name} প্রবেশ করেছেন। সচিবালয়কে অবহিত করা হয়েছে।`,
        'gold'
      );
    } else {
      showToast(lang === 'en' ? `Visitor ${target?.name} checked in. Badge ${target?.badgeNo || 'BDG-01'} issued.` : `অতিথি চেক-ইন সফল হয়েছে। ব্যাজ প্রদান সম্পন্ন।`, 'success');
    }
  };

  const handleCheckOut = (id: string) => {
    setVisitors(prev => prev.map(v => v.id === id ? { ...v, status: 'checked_out', checkOutTime: 'Just Now' } : v));
    showToast(lang === 'en' ? `Security checkout logged. Badge surrendered & barrier cleared.` : `পাস জমা ও নিরাপত্তা চেক-আউট সম্পন্ন হয়েছে।`, 'info');
  };

  const handleTogglePPE = (gearKey: keyof VisitorRecord['ppeCleared']) => {
    if (!selectedVisitor) return;
    setVisitors(prev => prev.map(v => {
      if (v.id === selectedVisitor.id) {
        const updatedPPE = {
          ...v.ppeCleared,
          [gearKey]: !v.ppeCleared[gearKey],
        };
        return {
          ...v,
          ppeCleared: updatedPPE,
        };
      }
      return v;
    }));
    showToast(t('HSE Safety PPE Equipment Checklist updated.', 'নিরাপত্তা সরঞ্জাম তালিকা হালনাগাদ হয়েছে।', lang), 'success');
  };

  const handleSimulateBarrier = () => {
    setBarrierOpen(true);
    showToast(t('ALPR CAMERA MATCHED: Vehicle plate verified. Gate Barrier #1 RAISED.', 'লাইসেন্স প্লেট মিল নিশ্চিত: গেট বেরিয়ার ১ উন্মুক্ত হয়েছে।', lang), 'gold');
    setTimeout(() => {
      setBarrierOpen(false);
    }, 4000);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formOrg.trim() || !formPurpose.trim()) {
      showToast(lang === 'en' ? 'Please complete required fields.' : 'অনুগ্রহ করে প্রয়োজনীয় তথ্য পূরণ করুন।', 'warn');
      return;
    }

    const newId = `VIS-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newVis: VisitorRecord = {
      id: newId,
      name: formName.trim(),
      organization: formOrg.trim(),
      designation: formDesignation.trim() || (formCategory === 'vip' ? 'Honorary Dignitary' : formCategory === 'govt' ? 'Official Inspector' : 'Representative'),
      category: formCategory,
      hostEmployee: formHost.trim() || currentUserName,
      hostDept: isStaff ? currentUserDept : 'Plant Administration',
      hostPhone: '+880 1711-998877',
      facility: formFacility,
      permittedZones: [
        { zoneId: 'Z-01', name: 'Reception & Admin Lobby', nameBn: 'অভ্যর্থনা ও লবি', level: 'green', escortRequired: false },
        { zoneId: 'Z-02', name: 'Meeting Room Suites', nameBn: 'মিটিং রুম স্যুট', level: 'green', escortRequired: false },
      ],
      purpose: formPurpose.trim(),
      expectedDate: formDate,
      expectedTime: formTime,
      durationHours: Number(formDuration) || 3,
      status: 'pre_registered',
      vehiclePlate: formVehicle.trim() || 'Pedestrian / Escort Pool',
      phone: formPhone.trim() || '+880 1700-000000',
      email: formEmail.trim(),
      vipProtocol: formCategory === 'vip' || formCategory === 'govt',
      safetyBriefingCompleted: false,
      ndaSigned: true,
      ppeCleared: {
        hardHat: formFacility === 'Keraniganj Bitumen Refinery',
        safetyGoggles: formFacility === 'Keraniganj Bitumen Refinery',
        safetyShoes: formFacility === 'Keraniganj Bitumen Refinery',
        hiVisVest: formFacility === 'Keraniganj Bitumen Refinery',
        h2sBriefing: formFacility === 'Keraniganj Bitumen Refinery',
      },
      idProofType: formIdProofType,
      idProofNumber: formIdProofNum.trim() || 'NID-VERIFIED',
    };

    setVisitors([newVis, ...visitors]);
    setSelectedVisitorId(newVis.id);
    setShowRegisterModal(false);

    // Reset Form
    setFormName('');
    setFormOrg('');
    setFormDesignation('');
    setFormPurpose('');
    setFormVehicle('');
    setFormPhone('');
    setFormEmail('');
    setFormIdProofNum('');

    showToast(
      lang === 'en'
        ? `Digital Gate Pass ${newId} issued for ${newVis.name}! Encrypted QR dispatched.`
        : `ডিজিটাল গেট পাস ${newId} সফলভাবে তৈরি হয়েছে! কিউআর কোড পাঠানো হয়েছে।`,
      'success'
    );
  };

  const getCategoryBadge = (category: VisitorRecord['category']) => {
    switch (category) {
      case 'vip':
        return <span className="badge gold" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>👑 VIP Guest</span>;
      case 'govt':
        return <span className="badge danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>🏛️ Govt Inspector</span>;
      case 'client':
        return <span className="badge meeting" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>🤝 Commercial Client</span>;
      case 'vendor':
        return <span className="badge info" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>🔧 Technical Vendor</span>;
      case 'regular':
      default:
        return <span className="badge">Regular Visitor</span>;
    }
  };

  return (
    <div style={{ paddingBottom: '50px' }}>
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. TOP HEADER & EMERGENCY MUSTER ACTIONS */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="flex-between mb-4" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--brand-slate-900)', margin: 0 }}>
              {t('Guest & VIP Protocol Management System', 'অতিথি ও ভিআইপি প্রটোকল ব্যবস্থাপনা', lang)}
            </h2>
            <span className="badge success" style={{ fontSize: '10.5px' }}>
              ALPR & HSE PERMIT-TO-ENTER
            </span>
          </div>
          <p className="text-muted" style={{ margin: '4px 0 0', fontSize: '12.5px' }}>
            {t(
              'Encrypted QR Gate Passes, ALPR Barrier Automation, HSE Safety Gear Allotment & Emergency Evacuation Muster',
              'এনক্রিপ্টেড কিউআর গেট পাস, লাইসেন্স প্লেট বেরিয়ার, এইচএসই নিরাপত্তা সরঞ্জাম ও জরুরি ইভাকুয়েশন মাস্টার',
              lang
            )}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Emergency Muster Button */}
          <button
            className="btn-outline-danger"
            style={{ fontSize: '12px', padding: '7px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => setShowMusterModal(true)}
            title="View Live Evacuation Muster Roll"
          >
            <Flame size={14} />
            {t('Emergency Muster List', 'জরুরি ইভাকুয়েশন তালিকা', lang)} ({stats.totalInside})
          </button>

          {/* ALPR Gate Barrier Scanner Simulator */}
          <button
            className="btn-outline"
            style={{ fontSize: '12px', padding: '7px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => setShowALPRModal(true)}
          >
            <Car size={14} />
            {t('ALPR Gate Barrier 1', 'গেট ১ ক্যামেরা ও বেরিয়ার', lang)}
          </button>

          {/* Pre-Register Button */}
          <button
            className="btn-primary"
            style={{ fontSize: '12px', padding: '7px 14px', background: 'var(--brand-crimson)', color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => {
              setFormHost(isStaff ? currentUserName : '');
              setShowRegisterModal(true);
            }}
          >
            <Plus size={14} />
            {t('Pre-Register Guest', 'নতুন অতিথি প্রাক-নিবন্ধন', lang)}
          </button>
        </div>
      </div>

      {/* Staff Workspace & Scope Notice */}
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
              • {t('Active Workspace:', 'সক্রিয় মোড:', lang)}{' '}
              <strong>
                {scopeMode === 'my_guests'
                  ? t('Showing guests hosted by you', 'আপনার আমন্ত্রিত অতিথি দেখা হচ্ছে', lang)
                  : t('Showing all campus visitors across facilities', 'সকল শাখার অতিথি প্রদর্শিত হচ্ছে', lang)}
              </strong>
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', background: 'var(--brand-slate-200)', borderRadius: '6px', padding: '2px' }}>
            <button
              className={`btn-sm-ghost ${scopeMode === 'my_guests' ? 'active' : ''}`}
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '3px 10px',
                background: scopeMode === 'my_guests' ? '#FFF' : 'transparent',
              }}
              onClick={() => setScopeMode('my_guests')}
            >
              {t('My Guests', 'আমার অতিথি', lang)} ({stats.myGuestsCount})
            </button>
            <button
              className={`btn-sm-ghost ${scopeMode === 'all' ? 'active' : ''}`}
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '3px 10px',
                background: scopeMode === 'all' ? '#FFF' : 'transparent',
              }}
              onClick={() => setScopeMode('all')}
            >
              {t('All Campus Manifest', 'সকল ক্যাম্পাস তালিকা', lang)} ({visitors.length})
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. 5-KPI EXECUTIVE SECURITY & PROTOCOL CARDS */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="parcel-kpi-grid">
        {/* Card 1: Currently Inside Campus */}
        <div
          className={`parcel-kpi-card ${activeTab === 'inside' ? 'active' : ''}`}
          onClick={() => setActiveTab(activeTab === 'inside' ? 'all' : 'inside')}
          title="Click to view guests currently inside"
        >
          <div className="parcel-kpi-top">
            <div className="parcel-kpi-icon" style={{ background: '#ECFDF5', color: '#059669' }}>
              <UserCheck size={18} />
            </div>
            <span className="badge success" style={{ fontSize: '10px' }}>
              ● LIVE MUSTER
            </span>
          </div>
          <div>
            <div className="parcel-kpi-val" style={{ color: '#059669' }}>
              {stats.totalInside} <span style={{ fontSize: '14px', fontWeight: 600 }}>Guests</span>
            </div>
            <div className="parcel-kpi-title">
              {t('Currently Inside Perimeter', 'বর্তমানে ক্যাম্পাসে উপস্থিত', lang)}
            </div>
            <div className="parcel-kpi-sub">
              {stats.insideRefinery} at Keraniganj • {stats.insideHQ} at Dhaka HQ
            </div>
          </div>
        </div>

        {/* Card 2: Pre-Registered / Expected */}
        <div
          className={`parcel-kpi-card ${activeTab === 'pre_registered' ? 'active' : ''}`}
          onClick={() => setActiveTab(activeTab === 'pre_registered' ? 'all' : 'pre_registered')}
          title="Click to view pre-registered upcoming visits"
        >
          <div className="parcel-kpi-top">
            <div className="parcel-kpi-icon" style={{ background: '#EFF6FF', color: '#2563EB' }}>
              <Clock size={18} />
            </div>
            <span className="badge info" style={{ fontSize: '10px' }}>
              TODAY
            </span>
          </div>
          <div>
            <div className="parcel-kpi-val" style={{ color: '#1D4ED8' }}>
              {stats.preRegisteredCount}
            </div>
            <div className="parcel-kpi-title">
              {t('Expected / Pre-Registered', 'প্রত্যাশিত অতিথি তালিকা', lang)}
            </div>
            <div className="parcel-kpi-sub">
              Digital QR Gate Passes Issued
            </div>
          </div>
        </div>

        {/* Card 3: VIP & Govt Inspections */}
        <div
          className={`parcel-kpi-card ${activeTab === 'vip_govt' ? 'active' : ''}`}
          onClick={() => setActiveTab(activeTab === 'vip_govt' ? 'all' : 'vip_govt')}
          title="Click to view VIP & Govt inspectors"
        >
          <div className="parcel-kpi-top">
            <div className="parcel-kpi-icon" style={{ background: 'rgba(212, 175, 55, 0.15)', color: '#B45309' }}>
              <Crown size={18} />
            </div>
            <span className="badge warn" style={{ fontSize: '10px' }}>
              HIGH PROTOCOL
            </span>
          </div>
          <div>
            <div className="parcel-kpi-val" style={{ color: 'var(--brand-crimson)' }}>
              {stats.vipGovtCount} <span style={{ fontSize: '13px', fontWeight: 500 }}>Delegations</span>
            </div>
            <div className="parcel-kpi-title">
              {t('VIP & Govt Inspections', 'ভিআইপি ও সরকারি পরিদর্শন', lang)}
            </div>
            <div className="parcel-kpi-sub">
              DoE Explosives & Axens France
            </div>
          </div>
        </div>

        {/* Card 4: Safety Induction & PPE Allotment */}
        <div
          className="parcel-kpi-card"
          onClick={() => setCockpitSubTab('ppe')}
          title="Click to inspect safety gear & induction checklist"
        >
          <div className="parcel-kpi-top">
            <div className="parcel-kpi-icon" style={{ background: '#F0F9FF', color: '#0284C7' }}>
              <HardHat size={18} />
            </div>
            <span className="badge success" style={{ fontSize: '10px' }}>
              {stats.ppeComplianceRate}%
            </span>
          </div>
          <div>
            <div className="parcel-kpi-val" style={{ color: '#0284C7' }}>
              100%
            </div>
            <div className="parcel-kpi-title">
              {t('HSE Gear Allotment & NDA', 'নিরাপত্তা সরঞ্জাম ও চুক্তি', lang)}
            </div>
            <div className="parcel-kpi-sub">
              Mandatory Refinery Plant PPE Active
            </div>
          </div>
        </div>

        {/* Card 5: ALPR Barrier & Gate Protocol */}
        <div
          className="parcel-kpi-card"
          onClick={() => setShowALPRModal(true)}
          title="Click to view ALPR gate camera feed"
        >
          <div className="parcel-kpi-top">
            <div className="parcel-kpi-icon" style={{ background: '#FEF2F2', color: '#DC2626' }}>
              <Shield size={18} />
            </div>
            <span className="badge success" style={{ fontSize: '10px' }}>
              ALPR ACTIVE
            </span>
          </div>
          <div>
            <div className="parcel-kpi-val" style={{ fontSize: '20px', color: '#991B1B' }}>
              GATE 1 & 2
            </div>
            <div className="parcel-kpi-title">
              {t('Automatic Plate Recognition', 'নম্বরপ্লেট সেন্সর বেরিয়ার', lang)}
            </div>
            <div className="parcel-kpi-sub">
              Barrier Auto-Open on QR Match
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3. PRACTICAL TWO-COLUMN MASTER-DETAIL WORKSPACE */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="guest-two-col-layout">
        {/* ── LEFT COLUMN: VISITOR DIRECTORY FEED ── */}
        <div>
          {/* Feed Header & Search Filter */}
          <div style={{ background: '#fff', border: '1px solid var(--brand-slate-200)', borderRadius: 'var(--radius-md)', padding: '14px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontWeight: 800, fontSize: '13px', color: 'var(--brand-slate-900)' }}>
                {t('Visitor Directory', 'অতিথি রেজিস্টার', lang)} ({displayedVisitors.length})
              </span>
              <select
                value={facilityFilter}
                onChange={(e) => setFacilityFilter(e.target.value as any)}
                style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', border: '1px solid var(--brand-slate-300)' }}
              >
                <option value="all">All Facilities</option>
                <option value="Keraniganj Bitumen Refinery">Keraniganj Refinery</option>
                <option value="Bashundhara Corporate HQ, Baridhara">Dhaka HQ Baridhara</option>
              </select>
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', marginBottom: '10px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '9px', color: 'var(--brand-slate-400)' }} />
              <input
                type="text"
                placeholder={t('Search visitor, agency, host, car plate...', 'নাম, সংস্থা, স্বাগতিক বা গাড়ি খুঁজুন...', lang)}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  paddingLeft: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  border: '1px solid var(--brand-slate-300)',
                  width: '100%',
                  fontSize: '12px',
                }}
              />
            </div>

            {/* Quick Filter Tabs */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              <button
                className={`parcel-pill-tab ${activeTab === 'all' ? 'active' : ''}`}
                style={{ padding: '3px 8px', fontSize: '10.5px' }}
                onClick={() => setActiveTab('all')}
              >
                All ({scopedVisitors.length})
              </button>
              <button
                className={`parcel-pill-tab ${activeTab === 'inside' ? 'active' : ''}`}
                style={{ padding: '3px 8px', fontSize: '10.5px' }}
                onClick={() => setActiveTab('inside')}
              >
                🟢 Inside ({stats.totalInside})
              </button>
              <button
                className={`parcel-pill-tab ${activeTab === 'vip_govt' ? 'active' : ''}`}
                style={{ padding: '3px 8px', fontSize: '10.5px' }}
                onClick={() => setActiveTab('vip_govt')}
              >
                👑 VIP/Govt ({stats.vipGovtCount})
              </button>
              <button
                className={`parcel-pill-tab ${activeTab === 'pre_registered' ? 'active' : ''}`}
                style={{ padding: '3px 8px', fontSize: '10.5px' }}
                onClick={() => setActiveTab('pre_registered')}
              >
                ⏳ Expected ({stats.preRegisteredCount})
              </button>
            </div>
          </div>

          {/* Scrollable Visitor Cards Feed */}
          <div className="guest-feed-list">
            {displayedVisitors.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', background: '#fff', borderRadius: 'var(--radius-md)', border: '1px solid var(--brand-slate-200)', color: 'var(--brand-slate-500)' }}>
                <Users size={28} style={{ opacity: 0.4, margin: '0 auto 8px' }} />
                <div style={{ fontWeight: 700, fontSize: '13px' }}>No visitors found</div>
                <div style={{ fontSize: '11px' }}>Adjust filters or pre-register a new guest.</div>
              </div>
            ) : (
              displayedVisitors.map((v) => {
                const isSelected = selectedVisitor?.id === v.id;
                const isHostMe = v.hostEmployee.toLowerCase().includes(currentUserName.toLowerCase());

                return (
                  <div
                    key={v.id}
                    className={`guest-feed-card ${isSelected ? 'active' : ''}`}
                    onClick={() => setSelectedVisitorId(v.id)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '13.5px', color: 'var(--brand-slate-900)' }}>
                          {v.name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)' }}>
                          {v.organization}
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
                        {v.status === 'checked_in' ? (
                          <span className="badge success" style={{ fontSize: '9.5px', padding: '2px 6px' }}>
                            ✓ INSIDE CAMPUS
                          </span>
                        ) : v.status === 'pre_registered' ? (
                          <span className="badge info" style={{ fontSize: '9.5px', padding: '2px 6px' }}>
                            EXPECTED {v.expectedTime}
                          </span>
                        ) : (
                          <span className="badge neutral" style={{ fontSize: '9.5px', padding: '2px 6px' }}>
                            CHECKED OUT
                          </span>
                        )}
                        {getCategoryBadge(v.category)}
                      </div>
                    </div>

                    <div style={{ fontSize: '11.5px', color: 'var(--brand-slate-700)', marginBottom: '8px', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {v.purpose}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px', borderTop: '1px solid var(--brand-slate-100)', fontSize: '10.5px' }}>
                      <span style={{ color: isHostMe ? '#2563EB' : 'var(--brand-slate-500)', fontWeight: isHostMe ? 700 : 500 }}>
                        Host: {v.hostEmployee}
                      </span>
                      <span style={{ color: 'var(--brand-slate-400)', fontFamily: 'monospace' }}>
                        {v.id}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN: DIGITAL GATE PASS & SECURITY COCKPIT ── */}
        <div>
          {selectedVisitor && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {/* Digital Pass Holographic Card Header */}
              <div className="guest-pass-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', position: 'relative', zIndex: 2 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '1px', color: '#93C5FD', fontWeight: 800 }}>
                        BASHUNDHARA OIL & GAS · ENCRYPTED DIGITAL ACCESS CREDENTIAL
                      </span>
                      {selectedVisitor.vipProtocol && (
                        <span className="badge gold" style={{ fontSize: '9.5px' }}>
                          👑 VIP PROTOCOL ESCORT
                        </span>
                      )}
                    </div>

                    <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#fff', margin: '6px 0 2px' }}>
                      {selectedVisitor.name}
                    </h1>

                    <div style={{ fontSize: '13px', color: '#CBD5E1', fontWeight: 600 }}>
                      {selectedVisitor.designation} • <strong>{selectedVisitor.organization}</strong>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px', fontSize: '11.5px', color: '#94A3B8' }}>
                      <span>Pass ID: <strong style={{ color: '#fff', fontFamily: 'monospace' }}>{selectedVisitor.id}</strong></span>
                      <span>•</span>
                      <span>Badge No: <strong style={{ color: '#38BDF8', fontFamily: 'monospace' }}>{selectedVisitor.badgeNo || 'UNISSUED'}</strong></span>
                      <span>•</span>
                      <span>ALPR Plate: <code style={{ color: '#4ADE80' }}>{selectedVisitor.vehiclePlate}</code></span>
                    </div>
                  </div>

                  {/* QR Code & Printable Slip */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', background: '#fff', padding: '10px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                    <QrCode size={64} color="#000" />
                    <span style={{ fontSize: '9px', fontWeight: 800, color: '#0F172A', letterSpacing: '0.5px' }}>
                      SCAN AT GATE
                    </span>
                  </div>
                </div>

                {/* Status Bar */}
                <div style={{ marginTop: '20px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', position: 'relative', zIndex: 2 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: selectedVisitor.status === 'checked_in' ? '#10B981' : '#F59E0B', display: 'inline-block' }} />
                    <strong style={{ color: '#F8FAFC' }}>
                      {selectedVisitor.status === 'checked_in'
                        ? `Inside Premises since ${selectedVisitor.checkInTime}`
                        : selectedVisitor.status === 'pre_registered'
                        ? `Expected Arrival: ${selectedVisitor.expectedTime}`
                        : `Checked Out at ${selectedVisitor.checkOutTime}`}
                    </strong>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn-sm-ghost"
                      style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', fontSize: '11px' }}
                      onClick={() => setShowGatePassModal(true)}
                    >
                      <Printer size={12} />
                      {t('Print ID Badge', 'ব্যাজ প্রিন্ট', lang)}
                    </button>
                    <button
                      className="btn-sm-ghost"
                      style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', fontSize: '11px' }}
                      onClick={() => setShowSMSModal(true)}
                    >
                      <Send size={12} />
                      {t('SMS QR Pass', 'এসএমএস পাঠান', lang)}
                    </button>
                  </div>
                </div>
              </div>

              {/* ── COCKPIT SUB-NAVIGATION ── */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--brand-slate-200)', padding: '12px 20px', background: 'var(--brand-slate-50)' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className={`parcel-pill-tab ${cockpitSubTab === 'pass' ? 'active' : ''}`}
                    onClick={() => setCockpitSubTab('pass')}
                  >
                    <User size={13} />
                    {t('Visit & Host Details', 'সাক্ষাৎ ও স্বাগতিক বিবরণ', lang)}
                  </button>
                  <button
                    className={`parcel-pill-tab ${cockpitSubTab === 'ppe' ? 'active' : ''}`}
                    onClick={() => setCockpitSubTab('ppe')}
                  >
                    <HardHat size={13} />
                    {t('HSE Gear & Safety Induction', 'এইচএসই গিয়ার ও নিরাপত্তা সম্মতি', lang)}
                  </button>
                  <button
                    className={`parcel-pill-tab ${cockpitSubTab === 'alpr' ? 'active' : ''}`}
                    onClick={() => setCockpitSubTab('alpr')}
                  >
                    <Car size={13} />
                    {t('ALPR Vehicle Entry & Barrier', 'গাড়ি এন্ট্রি ও গেট বেরিয়ার', lang)}
                  </button>
                  <button
                    className={`parcel-pill-tab ${cockpitSubTab === 'zones' ? 'active' : ''}`}
                    onClick={() => setCockpitSubTab('zones')}
                  >
                    <MapPin size={13} />
                    {t('Permitted Plant Zones', 'অনুমোদিত প্ল্যান্ট অঞ্চল', lang)}
                  </button>
                </div>

                {/* Primary Action Buttons */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  {selectedVisitor.status === 'pre_registered' ? (
                    <button
                      className="btn-primary"
                      style={{ fontSize: '12px', padding: '6px 14px', background: '#059669', display: 'flex', alignItems: 'center', gap: '6px' }}
                      onClick={() => handleCheckIn(selectedVisitor.id)}
                    >
                      <UserCheck size={14} />
                      {t('Check-In & Issue Badge', 'চেক-ইন ও ব্যাজ প্রদান', lang)}
                    </button>
                  ) : selectedVisitor.status === 'checked_in' ? (
                    <button
                      className="btn-outline-danger"
                      style={{ fontSize: '12px', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
                      onClick={() => handleCheckOut(selectedVisitor.id)}
                    >
                      <Clock size={14} />
                      {t('Check-Out & Surrender', 'চেক-আউট ও পাস ফেরত', lang)}
                    </button>
                  ) : (
                    <span className="badge" style={{ padding: '6px 12px' }}>Visit Completed</span>
                  )}
                </div>
              </div>

              {/* ── TAB 1: VISIT & HOST DETAILS ── */}
              {cockpitSubTab === 'pass' && (
                <div style={{ padding: '24px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                    {/* Host Card */}
                    <div style={{ background: '#F8FAFC', border: '1px solid var(--brand-slate-200)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-slate-400)', textTransform: 'uppercase' }}>
                        HOST OFFICER & ESCORT
                      </div>
                      <div style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--brand-slate-900)', marginTop: '4px' }}>
                        {selectedVisitor.hostEmployee}
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--brand-slate-500)', marginTop: '2px' }}>
                        {selectedVisitor.hostDept}
                      </div>
                      <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                        <button
                          className="btn-primary"
                          style={{ fontSize: '11px', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}
                          onClick={() => showToast(`Calling Host ${selectedVisitor.hostEmployee}: ${selectedVisitor.hostPhone || '01711-000000'}`, 'info')}
                        >
                          <Phone size={12} />
                          Call Host
                        </button>
                        <button
                          className="btn-sm-ghost"
                          style={{ fontSize: '11px', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}
                          onClick={() => showToast(`Host ${selectedVisitor.hostEmployee} notified of guest arrival at reception desk.`, 'success')}
                        >
                          <MessageSquare size={12} />
                          Notify Host
                        </button>
                      </div>
                    </div>

                    {/* Purpose of Visit */}
                    <div style={{ background: '#F8FAFC', border: '1px solid var(--brand-slate-200)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-slate-400)', textTransform: 'uppercase' }}>
                        OFFICIAL PURPOSE
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--brand-slate-900)', marginTop: '6px', lineHeight: 1.4 }}>
                        {selectedVisitor.purpose}
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--brand-slate-500)', marginTop: '8px' }}>
                        Target Facility: <strong>{selectedVisitor.facility}</strong>
                      </div>
                    </div>

                    {/* Identity Proof & Security Verification */}
                    <div style={{ background: '#F8FAFC', border: '1px solid var(--brand-slate-200)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-slate-400)', textTransform: 'uppercase' }}>
                        ID PROOF & CLEARANCE
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--brand-slate-900)', marginTop: '6px' }}>
                        {selectedVisitor.idProofType}: <span style={{ fontFamily: 'monospace' }}>{selectedVisitor.idProofNumber}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#059669', fontWeight: 700, marginTop: '4px' }}>
                        ✓ Biometric & ID Match Confirmed
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)', marginTop: '4px' }}>
                        Emergency: {selectedVisitor.emergencyContact || 'Direct Contact via Reception'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB 2: HSE SAFETY GEAR & INDUCTION CLEARANCE ── */}
              {cockpitSubTab === 'ppe' && (
                <div style={{ padding: '24px' }}>
                  <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: '14px 18px', borderRadius: 'var(--radius-md)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <HardHat size={28} color="#B45309" />
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '13.5px', color: '#92400E' }}>
                        MANDATORY PETROCHEMICAL REFINERY SAFETY INDUCTION (HSE POLICY 10.4)
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#B45309', marginTop: '2px' }}>
                        Visitors entering refinery process units must wear full PPE, undergo H2S emergency breathing briefing, and surrender non-intrinsically safe mobile phones.
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                    <div
                      style={{
                        padding: '12px 14px',
                        borderRadius: '8px',
                        border: '1px solid',
                        borderColor: selectedVisitor.ppeCleared.hardHat ? '#A7F3D0' : '#E2E8F0',
                        background: selectedVisitor.ppeCleared.hardHat ? '#ECFDF5' : '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                      onClick={() => handleTogglePPE('hardHat')}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '12.5px' }}>Industrial Hard Hat</div>
                        <div style={{ fontSize: '10.5px', color: '#64748B' }}>Color: White (Visitor Tag)</div>
                      </div>
                      <span className={`badge ${selectedVisitor.ppeCleared.hardHat ? 'success' : 'neutral'}`}>
                        {selectedVisitor.ppeCleared.hardHat ? '✓ Issued' : 'Pending'}
                      </span>
                    </div>

                    <div
                      style={{
                        padding: '12px 14px',
                        borderRadius: '8px',
                        border: '1px solid',
                        borderColor: selectedVisitor.ppeCleared.safetyGoggles ? '#A7F3D0' : '#E2E8F0',
                        background: selectedVisitor.ppeCleared.safetyGoggles ? '#ECFDF5' : '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                      onClick={() => handleTogglePPE('safetyGoggles')}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '12.5px' }}>Safety Eye Goggles</div>
                        <div style={{ fontSize: '10.5px', color: '#64748B' }}>Anti-Chemical Impact</div>
                      </div>
                      <span className={`badge ${selectedVisitor.ppeCleared.safetyGoggles ? 'success' : 'neutral'}`}>
                        {selectedVisitor.ppeCleared.safetyGoggles ? '✓ Issued' : 'Pending'}
                      </span>
                    </div>

                    <div
                      style={{
                        padding: '12px 14px',
                        borderRadius: '8px',
                        border: '1px solid',
                        borderColor: selectedVisitor.ppeCleared.safetyShoes ? '#A7F3D0' : '#E2E8F0',
                        background: selectedVisitor.ppeCleared.safetyShoes ? '#ECFDF5' : '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                      onClick={() => handleTogglePPE('safetyShoes')}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '12.5px' }}>Steel-Toe Boots</div>
                        <div style={{ fontSize: '10.5px', color: '#64748B' }}>Static Dissipative Sole</div>
                      </div>
                      <span className={`badge ${selectedVisitor.ppeCleared.safetyShoes ? 'success' : 'neutral'}`}>
                        {selectedVisitor.ppeCleared.safetyShoes ? '✓ Issued' : 'Pending'}
                      </span>
                    </div>

                    <div
                      style={{
                        padding: '12px 14px',
                        borderRadius: '8px',
                        border: '1px solid',
                        borderColor: selectedVisitor.ppeCleared.hiVisVest ? '#A7F3D0' : '#E2E8F0',
                        background: selectedVisitor.ppeCleared.hiVisVest ? '#ECFDF5' : '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                      onClick={() => handleTogglePPE('hiVisVest')}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '12.5px' }}>Hi-Vis Safety Vest</div>
                        <div style={{ fontSize: '10.5px', color: '#64748B' }}>Reflective Luminescent</div>
                      </div>
                      <span className={`badge ${selectedVisitor.ppeCleared.hiVisVest ? 'success' : 'neutral'}`}>
                        {selectedVisitor.ppeCleared.hiVisVest ? '✓ Issued' : 'Pending'}
                      </span>
                    </div>

                    <div
                      style={{
                        padding: '12px 14px',
                        borderRadius: '8px',
                        border: '1px solid',
                        borderColor: selectedVisitor.ppeCleared.h2sBriefing ? '#A7F3D0' : '#E2E8F0',
                        background: selectedVisitor.ppeCleared.h2sBriefing ? '#ECFDF5' : '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                      onClick={() => handleTogglePPE('h2sBriefing')}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '12.5px' }}>H2S Toxic Gas Alarm Drill</div>
                        <div style={{ fontSize: '10.5px', color: '#64748B' }}>Assembly Point #3 briefed</div>
                      </div>
                      <span className={`badge ${selectedVisitor.ppeCleared.h2sBriefing ? 'success' : 'neutral'}`}>
                        {selectedVisitor.ppeCleared.h2sBriefing ? '✓ Briefed' : 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB 3: ALPR VEHICLE ENTRY & GATE BARRIER ── */}
              {cockpitSubTab === 'alpr' && (
                <div style={{ padding: '24px' }}>
                  <div className="guest-barrier-box">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: '#fff' }}>
                          ALPR SMART BARRIER GATE #1 — KERANIGANJ MAIN PERIMETER
                        </div>
                        <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                          Camera Resolution: 4K UHD 60fps • Neural License Plate Match Algorithm
                        </div>
                      </div>
                      <span className="badge success">
                        SENSOR ONLINE
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', flexWrap: 'wrap', gap: '20px', padding: '20px 0' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '6px' }}>
                          RECOGNIZED NUMBER PLATE
                        </div>
                        <div style={{ background: '#F8FAFC', color: '#0F172A', border: '3px solid #3B82F6', padding: '8px 24px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '18px', fontWeight: 900, letterSpacing: '2px' }}>
                          {selectedVisitor.vehiclePlate}
                        </div>
                        <div style={{ fontSize: '11px', color: '#34D399', fontWeight: 700, marginTop: '6px' }}>
                          ✓ Plate Matched Pre-Registration (Confidence: 99.4%)
                        </div>
                      </div>

                      {/* Visual Barrier Arm Animation */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '10px' }}>
                          BOOM BARRIER GATE STATUS
                        </div>
                        <div style={{ width: '40px', height: '60px', background: '#334155', borderRadius: '6px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div className={`guest-barrier-arm ${barrierOpen ? 'open' : ''}`} />
                        </div>
                        <div style={{ marginTop: '10px', fontSize: '12px', fontWeight: 800, color: barrierOpen ? '#34D399' : '#EF4444' }}>
                          {barrierOpen ? '🟢 BARRIER RAISED (OPEN)' : '🔴 BARRIER LOWERED (CLOSED)'}
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
                      <button
                        className="btn-gold"
                        style={{ padding: '8px 24px', fontWeight: 800 }}
                        onClick={handleSimulateBarrier}
                      >
                        <Car size={16} />
                        {t('Trigger Simulated Gate Barrier Open', 'গেট বেরিয়ার খোলার সিমুলেশন চালান', lang)}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB 4: PERMITTED FACILITY ZONES ── */}
              {cockpitSubTab === 'zones' && (
                <div style={{ padding: '24px' }}>
                  <div style={{ fontSize: '12.5px', fontWeight: 700, marginBottom: '12px', color: 'var(--brand-slate-800)' }}>
                    SECURITY CLEARANCE ACCESS MATRIX FOR {selectedVisitor.name.toUpperCase()}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {selectedVisitor.permittedZones.map((zone, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 16px',
                          borderRadius: '8px',
                          border: '1px solid var(--brand-slate-200)',
                          background: '#fff',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span className={`guest-zone-tag ${zone.level}`}>
                            {zone.level === 'green' ? '🟢 GREEN ZONE' : zone.level === 'yellow' ? '🟡 YELLOW ZONE' : '🔴 RED ZONE (HIGH HAZARD)'}
                          </span>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '13px', color: 'var(--brand-slate-900)' }}>
                              {zone.name}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)' }}>
                              Zone Code: {zone.zoneId}
                            </div>
                          </div>
                        </div>

                        <div>
                          {zone.escortRequired ? (
                            <span className="badge danger" style={{ fontSize: '10.5px' }}>
                              ⚠️ Mandatory Security Officer Escort
                            </span>
                          ) : (
                            <span className="badge success" style={{ fontSize: '10.5px' }}>
                              ✓ Unaccompanied Movement Permitted
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 4. MODALS (Pre-Register, ID Badge Print, ALPR Scanner, Muster List) */}
      {/* ─────────────────────────────────────────────────────────────────── */}

      {/* Pre-Register Guest Modal */}
      {showRegisterModal && (
        <div className="modal-bg" onClick={() => setShowRegisterModal(false)}>
          <div className="modal" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-hd">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>🎫</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--brand-slate-900)' }}>
                    {t('Pre-Register Official Guest / Inspection Delegation', 'অতিথি বা প্রতিনিধিদল পূর্ব-নিবন্ধন', lang)}
                  </h3>
                  <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)', marginTop: '2px' }}>
                    {t('Generates encrypted QR digital gate pass for ALPR sensor & security gates', 'স্বয়ংক্রিয় কিউআর গেট পাস ও নম্বরপ্লেট এন্ট্রি প্রস্তুত হবে', lang)}
                  </div>
                </div>
              </div>
              <button className="modal-close" onClick={() => setShowRegisterModal(false)}>×</button>
            </div>

            <form onSubmit={handleRegister}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>{t('Guest Full Name', 'অতিথির পূর্ণ নাম', lang)} *</label>
                    <input
                      type="text"
                      placeholder="e.g. Dr. Mohammad Rafiqul Islam"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>{t('Organization / Government Agency', 'সংস্থা বা প্রতিষ্ঠান', lang)} *</label>
                    <input
                      type="text"
                      placeholder="e.g. Roads & Highways Dept / Axens France"
                      value={formOrg}
                      onChange={(e) => setFormOrg(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>{t('Official Designation', 'দাপ্তরিক পদবি', lang)}</label>
                    <input
                      type="text"
                      placeholder="e.g. Executive Engineer / Technical Director"
                      value={formDesignation}
                      onChange={(e) => setFormDesignation(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>{t('Visitor Category', 'অতিথির শ্রেণি', lang)}</label>
                    <select value={formCategory} onChange={(e) => setFormCategory(e.target.value as any)}>
                      <option value="client">🤝 Commercial Client / Contractor</option>
                      <option value="vip">👑 VIP Dignitary / Board Guest</option>
                      <option value="govt">🏛️ Government Regulatory Inspector</option>
                      <option value="vendor">🔧 Technical Vendor / Specialist</option>
                      <option value="regular">Regular Visitor / Business Meeting</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>{t('Target Facility', 'পরিদর্শনের শাখা', lang)}</label>
                    <select value={formFacility} onChange={(e) => setFormFacility(e.target.value as any)}>
                      <option value="Bashundhara Corporate HQ, Baridhara">Bashundhara Corporate HQ, Baridhara</option>
                      <option value="Keraniganj Bitumen Refinery">Keraniganj Bitumen Refinery Complex</option>
                      <option value="Chittagong Patenga Terminal">Chittagong Patenga Terminal Office</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>{t('Host Employee', 'স্বাগতিক কর্মকর্তা', lang)}</label>
                    <input
                      type="text"
                      value={formHost}
                      onChange={(e) => setFormHost(e.target.value)}
                      placeholder="e.g. Tanvir Ahmed (Sales)"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>{t('Vehicle Plate (for ALPR barrier)', 'গাড়ির নম্বরপ্লেট (ALPR)', lang)}</label>
                    <input
                      type="text"
                      placeholder="e.g. DHAKA-METRO-GHA-11-9042"
                      value={formVehicle}
                      onChange={(e) => setFormVehicle(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>{t('Mobile Number (for QR Pass SMS)', 'মোবাইল নম্বর', lang)}</label>
                    <input
                      type="text"
                      placeholder="+880 1711-xxxxxx"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>{t('Official Purpose of Visit', 'পরিদর্শনের দাপ্তরিক উদ্দেশ্য', lang)} *</label>
                  <textarea
                    rows={2}
                    placeholder="Specify meeting agenda, tender docket review, technical inspection..."
                    value={formPurpose}
                    onChange={(e) => setFormPurpose(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-ft">
                <button type="button" className="btn-sm-ghost" onClick={() => setShowRegisterModal(false)}>
                  {t('Cancel', 'বাতিল', lang)}
                </button>
                <button type="submit" className="btn-primary" style={{ background: 'var(--brand-crimson)' }}>
                  <QrCode size={14} />
                  {t('Issue Digital QR Pass', 'ডিজিটাল কিউআর পাস ইস্যু করুন', lang)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Security Visitor Badge Print Slip Modal */}
      {showGatePassModal && selectedVisitor && (
        <div className="modal-bg" onClick={() => setShowGatePassModal(false)}>
          <div className="modal" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-hd" style={{ background: '#0F172A', color: '#fff' }}>
              <div>
                <h3 style={{ color: '#fff', margin: 0 }}>
                  {t('Official Gate Security Visitor Badge Slip', 'অফিসিয়াল গেট সিকিউরিটি ভিজিটর ব্যাজ', lang)}
                </h3>
                <div style={{ fontSize: '11px', color: '#94A3B8' }}>Pass ID: {selectedVisitor.id}</div>
              </div>
              <button className="modal-close" style={{ color: '#fff' }} onClick={() => setShowGatePassModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <div style={{ border: '2px solid #0F172A', padding: '18px', borderRadius: '8px', background: '#FFF' }}>
                <div style={{ textAlign: 'center', borderBottom: '2px solid #0F172A', paddingBottom: '10px', marginBottom: '14px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 900, color: 'var(--brand-crimson)' }}>
                    BASHUNDHARA OIL AND GAS COMPANY LIMITED
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>Corporate Security & Refinery Gate Control Division</div>
                  <div style={{ fontSize: '12px', fontWeight: 900, marginTop: '4px', letterSpacing: '1px' }}>
                    OFFICIAL VISITOR PASS · {selectedVisitor.category.toUpperCase()} CLEARANCE
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: '#0F172A' }}>
                      {selectedVisitor.name}
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                      {selectedVisitor.designation} · {selectedVisitor.organization}
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '6px' }}>
                      Host Officer: <strong>{selectedVisitor.hostEmployee}</strong> ({selectedVisitor.hostDept})
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#64748B' }}>
                      Security Badge Number: <strong style={{ fontFamily: 'monospace', color: '#0284C7' }}>{selectedVisitor.badgeNo || 'BDG-01'}</strong>
                    </div>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <QrCode size={70} color="#000" />
                    <div style={{ fontSize: '10px', fontFamily: 'monospace', fontWeight: 700, marginTop: '2px' }}>
                      {selectedVisitor.id}
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '10px', fontSize: '11.5px', color: '#475569' }}>
                  <div><strong>Permitted Zones:</strong> {selectedVisitor.permittedZones.map(z => z.name).join(', ')}</div>
                  <div style={{ marginTop: '2px' }}><strong>Vehicle Plate:</strong> {selectedVisitor.vehiclePlate}</div>
                  <div style={{ marginTop: '2px' }}><strong>HSE Safety Status:</strong> PPE Allotment Verified • Assembly Point #3</div>
                </div>
              </div>
            </div>

            <div className="modal-ft">
              <button className="btn-sm-ghost" onClick={() => setShowGatePassModal(false)}>{t('Close', 'বন্ধ করুন', lang)}</button>
              <button
                className="btn-primary"
                onClick={() => {
                  showToast(t(`Visitor Badge slip sent to gate printer.`, `ভিজিটর স্লিপ প্রিন্টারে পাঠানো হয়েছে।`, lang), 'success');
                  setShowGatePassModal(false);
                }}
              >
                <Printer size={14} />
                {t('Print Security Badge', 'ব্যাজ প্রিন্ট করুন', lang)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Evacuation Muster List Modal */}
      {showMusterModal && (
        <div className="modal-bg" onClick={() => setShowMusterModal(false)}>
          <div className="modal" style={{ maxWidth: '720px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-hd" style={{ background: '#991B1B', color: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Flame size={20} color="#FCA5A5" />
                <div>
                  <h3 style={{ color: '#fff', margin: 0, fontSize: '15px' }}>
                    {t('Emergency Evacuation Muster List (HSE Roll-Call)', 'জরুরি ইভাকুয়েশন মাস্টার রোল-কল তালিকা', lang)}
                  </h3>
                  <div style={{ fontSize: '11px', color: '#FEE2E2' }}>
                    Live count of all {stats.totalInside} external visitors currently on campus
                  </div>
                </div>
              </div>
              <button className="modal-close" style={{ color: '#fff' }} onClick={() => setShowMusterModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <div style={{ background: '#FEF2F2', padding: '10px 14px', borderRadius: '6px', fontSize: '12px', color: '#991B1B', marginBottom: '14px' }}>
                🚨 In the event of a plant emergency or fire drill, all safety wardens must verify visitor headcounts at <strong>Evacuation Assembly Point #3 (Main Security Gate Ground)</strong>.
              </div>

              <div className="table-responsive">
                <table className="fleet-table">
                  <thead>
                    <tr>
                      <th>Guest Name</th>
                      <th>Organization</th>
                      <th>Facility & Location</th>
                      <th>Host Officer</th>
                      <th>Contact Phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visitors.filter(v => v.status === 'checked_in').map(v => (
                      <tr key={v.id}>
                        <td><strong>{v.name}</strong></td>
                        <td>{v.organization}</td>
                        <td><span className="badge info">{v.facility.split(',')[0]}</span></td>
                        <td>{v.hostEmployee}</td>
                        <td><a href={`tel:${v.phone}`}>{v.phone}</a></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="modal-ft">
              <button className="btn-sm-ghost" onClick={() => setShowMusterModal(false)}>{t('Close', 'বন্ধ করুন', lang)}</button>
              <button
                className="btn-primary"
                style={{ background: '#991B1B' }}
                onClick={() => {
                  showToast(t('HSE Evacuation Muster PDF generated for Incident Commander.', 'ইভাকুয়েশন মাস্টার শিট ডাউনলোড সম্পন্ন।', lang), 'success');
                  setShowMusterModal(false);
                }}
              >
                <Download size={14} />
                {t('Export Muster Roll-Call PDF', 'মাস্টার শিট ডাউনলোড', lang)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ALPR Camera & Gate Scanner Simulator Modal */}
      {showALPRModal && (
        <div className="modal-bg" onClick={() => setShowALPRModal(false)}>
          <div className="modal" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-hd" style={{ background: '#0F172A', color: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Car size={18} color="#38BDF8" />
                <h3 style={{ color: '#fff', margin: 0 }}>
                  {t('ALPR Gate Barrier Camera Live Telemetry', 'গেট ক্যামেরা ও বেরিয়ার লাইভ ফিড', lang)}
                </h3>
              </div>
              <button className="modal-close" style={{ color: '#fff' }} onClick={() => setShowALPRModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <div style={{ border: '2px solid #334155', borderRadius: '8px', background: '#090F1E', padding: '20px', color: '#fff', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94A3B8', marginBottom: '14px' }}>
                  <span>CAM-01: KERANIGANJ GATE 1 INWARD</span>
                  <span style={{ color: '#34D399', fontWeight: 800 }}>● 60 FPS UHD LIVE</span>
                </div>

                <div style={{ border: '2px dashed #3B82F6', borderRadius: '8px', height: '140px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(59, 130, 246, 0.05)', position: 'relative' }}>
                  <div style={{ fontSize: '16px', fontWeight: 900, fontFamily: 'monospace', letterSpacing: '2px', color: '#38BDF8' }}>
                    [ DHAKA-METRO-GHA-11-9042 ]
                  </div>
                  <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '6px' }}>
                    Target: Dr. Shahabuddin Ahmed (Directorate of Explosives)
                  </div>
                  <div style={{ fontSize: '10px', color: '#34D399', fontWeight: 700, marginTop: '2px' }}>
                    ALPR MATCH CONFIRMED (99.4%) · PRE-REGISTERED
                  </div>
                </div>

                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>Barrier Boom Status:</div>
                    <div style={{ fontWeight: 800, color: barrierOpen ? '#34D399' : '#EF4444' }}>
                      {barrierOpen ? '🟢 BARRIER RAISED (OPEN)' : '🔴 BARRIER LOWERED (LOCKED)'}
                    </div>
                  </div>

                  <button
                    className="btn-gold"
                    style={{ fontWeight: 800 }}
                    onClick={handleSimulateBarrier}
                  >
                    <Car size={14} />
                    {t('Raise Gate Barrier', 'বেরিয়ার উন্মুক্ত করুন', lang)}
                  </button>
                </div>
              </div>
            </div>

            <div className="modal-ft">
              <button className="btn-sm-ghost" onClick={() => setShowALPRModal(false)}>{t('Close', 'বন্ধ করুন', lang)}</button>
            </div>
          </div>
        </div>
      )}

      {/* SMS QR Pass Dispatch Modal */}
      {showSMSModal && selectedVisitor && (
        <div className="modal-bg" onClick={() => setShowSMSModal(false)}>
          <div className="modal" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-hd" style={{ background: '#059669', color: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Smartphone size={18} color="#fff" />
                <h3 style={{ color: '#fff', margin: 0 }}>
                  {t('Send Digital QR Pass via SMS / WhatsApp', 'এসএমএস/হোয়াটসঅ্যাপে কিউআর পাস প্রেরণ', lang)}
                </h3>
              </div>
              <button className="modal-close" style={{ color: '#fff' }} onClick={() => setShowSMSModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <div style={{ fontSize: '12px', color: 'var(--brand-slate-600)', marginBottom: '12px' }}>
                Recipient Phone: <strong>{selectedVisitor.phone}</strong>
              </div>

              <div style={{ background: '#DCF8C6', border: '1px solid #C4E2B1', borderRadius: '8px', padding: '14px', fontSize: '12px', color: '#075E54', lineHeight: 1.5 }}>
                "Dear {selectedVisitor.name}, your Digital Gate Pass for Bashundhara Oil & Gas Co. Ltd. is confirmed! Pass ID: {selectedVisitor.id}. Click link to view your QR Pass & Google Maps Gate directions: https://oneops.bashundhara.com/pass/{selectedVisitor.id}"
              </div>
            </div>

            <div className="modal-ft">
              <button className="btn-sm-ghost" onClick={() => setShowSMSModal(false)}>{t('Cancel', 'বাতিল', lang)}</button>
              <button
                className="btn-primary"
                style={{ background: '#059669' }}
                onClick={() => {
                  showToast(t(`Digital QR Gate Pass dispatched to ${selectedVisitor.phone}!`, `ডিজিটাল পাস সফলভাবে পাঠানো হয়েছে!`, lang), 'success');
                  setShowSMSModal(false);
                }}
              >
                <Send size={14} />
                {t('Dispatch Pass to Phone', 'মোবাইলে প্রেরণ করুন', lang)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
