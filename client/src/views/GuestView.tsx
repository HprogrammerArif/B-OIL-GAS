import React, { useState, useMemo } from 'react';
import { ViewProps, t } from '../types';
import { showToast } from '../components/ToastManager';
import { useOperationsStore } from '../store/operationsStore';
import { useCurrentUser } from '../auth/session';
import { nextRef } from '../lib/refs';
import { nowStamp, nowTime, today } from '../lib/clock';
import { type GuestMode, guestModeFor, visitorsVisibleTo, isMyGuest } from './guest/config';
import {
  Users, User, UserCheck, ShieldAlert, QrCode, Plus, Search,
  CheckCircle, Clock, AlertTriangle, Building2,
  Download, Car, Shield, Phone, FileText, Check, X,
  Printer, Smartphone, ShieldCheck, Send,
  HardHat, Eye, MapPin, Compass, AlertCircle, Share2,
  ExternalLink, Key, CheckSquare, RefreshCw, ChevronRight,
  Radio, UserX, MessageSquare, Scan, Camera, Coffee,
  FileCheck, CheckCircle2, Navigation, Mail, MessageCircle
} from 'lucide-react';

export interface PermittedZone {
  zoneId: string;
  name: string;
  nameBn: string;
  level: 'green' | 'yellow' | 'red';
  escortRequired: boolean;
}

export interface InspectionFindingItem {
  id?: string;
  focusArea: string;
  observation: string;
  status: 'passed' | 'observation' | 'critical';
  signOffDate: string;
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
  // VIP & Inspection Enhancements
  vipTier?: 'VVIP - Level 1' | 'VIP - Level 2' | 'Official Delegation';
  escortOfficer?: string;
  executiveSuite?: string;
  parkingBay?: string;
  dietaryPreferences?: string;
  inspectionFindings?: InspectionFindingItem[];
  isEvacuatedSafe?: boolean;
}


export default function GuestView({ lang }: ViewProps) {
  const user = useCurrentUser();
  const mode: GuestMode = user ? guestModeFor(user) : 'host';
  const currentUserName = user?.name ?? '';
  const currentUserDept = user?.dept ?? '';
  const isStaff = mode === 'host';
  const isGate = mode === 'gate';
  const canInvite = !!user?.permissions.has('guest:invite');

  const { visitors, setVisitors } = useOperationsStore();
  const [selectedVisitorId, setSelectedVisitorId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'all' | 'inside' | 'my_guests' | 'vip_govt' | 'pre_registered'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [facilityFilter, setFacilityFilter] = useState<'all' | 'Keraniganj Bitumen Refinery' | 'Bashundhara Corporate HQ, Baridhara'>('all');

  // Scope Toggle: Staff defaults to 'my_guests' or 'all'
  const [scopeMode, setScopeMode] = useState<'my_guests' | 'all'>(isStaff ? 'my_guests' : 'all');

  // Cockpit Internal Sub-Views: 'pass' | 'protocol' | 'inspection' | 'ppe' | 'alpr' | 'zones'
  const [cockpitSubTab, setCockpitSubTab] = useState<'pass' | 'protocol' | 'inspection' | 'ppe' | 'alpr' | 'zones'>('pass');

  // Modals
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showGatePassModal, setShowGatePassModal] = useState(false);
  const [showALPRModal, setShowALPRModal] = useState(false);
  const [showMusterModal, setShowMusterModal] = useState(false);
  const [showSMSModal, setShowSMSModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);

  // Quick QR Scanner state
  const [scannerTargetId, setScannerTargetId] = useState('VIS-2026-0812');
  const [isScanningAnimation, setIsScanningAnimation] = useState(false);

  // Live Inspection findings form state
  const [newFindingFocus, setNewFindingFocus] = useState('');
  const [newFindingObs, setNewFindingObs] = useState('');
  const [newFindingStatus, setNewFindingStatus] = useState<'passed' | 'observation' | 'critical'>('passed');

  // Multi-channel Pass Dispatch State
  const [dispatchChannel, setDispatchChannel] = useState<'whatsapp' | 'sms' | 'email'>('whatsapp');

  // Barrier simulator state
  const [barrierOpen, setBarrierOpen] = useState(false);

  // New Visitor Form State
  const [formName, setFormName] = useState('');
  const [formOrg, setFormOrg] = useState('');
  const [formDesignation, setFormDesignation] = useState('');
  const [formCategory, setFormCategory] = useState<VisitorRecord['category']>('client');
  const [formFacility, setFormFacility] = useState<VisitorRecord['facility']>('Bashundhara Corporate HQ, Baridhara');
  const [formPurpose, setFormPurpose] = useState('');
  const [formVehicle, setFormVehicle] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formDate, setFormDate] = useState(`Today, ${today().split(' ').slice(0, 2).join(' ')}`);
  const [formTime, setFormTime] = useState('02:30 PM');
  const [formDuration, setFormDuration] = useState('3');
  const [formIdProofType, setFormIdProofType] = useState<VisitorRecord['idProofType']>('National ID');
  const [formIdProofNum, setFormIdProofNum] = useState('');

  // ─────────────────────────────────────────────────────────────────────────
  // Scoped & Filtered Visitors
  // ─────────────────────────────────────────────────────────────────────────
  const scopedVisitors = useMemo(
    () => (user ? visitorsVisibleTo(user, mode, visitors, scopeMode) : []),
    [user, mode, visitors, scopeMode],
  );

  const selectedVisitor: VisitorRecord | undefined = useMemo(
    () => scopedVisitors.find(v => v.id === selectedVisitorId) || scopedVisitors[0],
    [selectedVisitorId, scopedVisitors],
  );

  const stats = useMemo(() => {
    const pool = mode === 'host' ? scopedVisitors : visitors;
    const inside = pool.filter(v => v.status === 'checked_in');
    const preReg = pool.filter(v => v.status === 'pre_registered');
    const vipGovt = pool.filter(v => v.category === 'vip' || v.category === 'govt');
    const myGuests = user ? visitors.filter(v => isMyGuest(v, user)) : [];
    const myGuestsInside = myGuests.filter(v => v.status === 'checked_in');

    const ppeTotal = pool.filter(v => v.facility === 'Keraniganj Bitumen Refinery');
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
      overdueCount: pool.filter(v => v.status === 'overdue').length,
    };
  }, [visitors, scopedVisitors, mode, user]);

  const displayedVisitors = useMemo(() => {
    return scopedVisitors.filter(v => {
      // Tab Filtering
      if (activeTab === 'inside' && v.status !== 'checked_in') return false;
      if (activeTab === 'my_guests' && (!user || !isMyGuest(v, user))) return false;
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
  }, [scopedVisitors, activeTab, facilityFilter, searchQuery, user]);

  // ─────────────────────────────────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────────────────────────────────

  const handleCheckIn = (id: string) => {
    if (!isGate) return;
    const target = visitors.find(v => v.id === id);
    if (!target || target.status === 'checked_in') return;
    const badge = nextRef('BDG', 3);
    const time = nowTime();
    setVisitors(prev => prev.map(v => v.id === id ? {
      ...v,
      status: 'checked_in',
      checkInTime: time,
      badgeNo: badge,
      safetyBriefingCompleted: true,
    } : v));

    if (target.vipProtocol || target.category === 'vip' || target.category === 'govt') {
      showToast(t(`${target.name} checked in with badge ${badge}. Host ${target.hostEmployee} notified for escort.`, `${target.name} ব্যাজ ${badge} সহ প্রবেশ করেছেন। হোস্টকে এসকর্টের জন্য জানানো হয়েছে।`, lang), 'gold');
    } else {
      showToast(t(`${target.name} checked in. Badge ${badge} issued.`, `${target.name} চেক-ইন সম্পন্ন। ব্যাজ ${badge} প্রদান করা হয়েছে।`, lang), 'success');
    }
  };

  const handleCheckOut = (id: string) => {
    if (!isGate) return;
    const time = nowTime();
    setVisitors(prev => prev.map(v => v.id === id ? { ...v, status: 'checked_out', checkOutTime: time } : v));
    showToast(t('Checked out. Badge returned.', 'চেক-আউট সম্পন্ন। ব্যাজ জমা হয়েছে।', lang), 'info');
  };

  const handleTogglePPE = (gearKey: keyof VisitorRecord['ppeCleared']) => {
    if (!selectedVisitor || !isGate) return;
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
    if (!isGate) return;
    setBarrierOpen(true);
    showToast(t('Plate matches the pass. Barrier raised.', 'প্লেট পাসের সাথে মিলেছে। বেরিয়ার খোলা হয়েছে।', lang), 'success');
    setTimeout(() => {
      setBarrierOpen(false);
    }, 4000);
  };

  const handleToggleEvacuated = (id: string) => {
    if (!isGate) return;
    setVisitors(prev => prev.map(v => v.id === id ? { ...v, isEvacuatedSafe: !v.isEvacuatedSafe } : v));
    const target = visitors.find(v => v.id === id);
    showToast(t(`Evacuation safety status updated for ${target?.name || 'visitor'}.`, `ইভাকুয়েশন স্ট্যাটাস আপডেট করা হয়েছে।`, lang), 'info');
  };

  const handleMarkAllEvacuatedSafe = () => {
    if (!isGate) return;
    setVisitors(prev => prev.map(v => v.status === 'checked_in' ? { ...v, isEvacuatedSafe: true } : v));
    showToast(t(`✓ All inside visitors marked safe at Assembly Point #3.`, `✓ সকল অতিথিকে অ্যাসেম্বলি পয়েন্ট ৩-এ নিরাপদ চিহ্নিত করা হয়েছে।`, lang), 'success');
  };

  const handleApproveAllPPE = () => {
    if (!selectedVisitor || !isGate) return;
    setVisitors(prev => prev.map(v => {
      if (v.id === selectedVisitor.id) {
        return {
          ...v,
          ppeCleared: {
            hardHat: true,
            safetyGoggles: true,
            safetyShoes: true,
            hiVisVest: true,
            h2sBriefing: true,
          },
          safetyBriefingCompleted: true,
        };
      }
      return v;
    }));
    showToast(t(`✓ All 5 safety equipment clearances approved for ${selectedVisitor.name}!`, `✓ সকল ৫টি নিরাপত্তা সরঞ্জাম ছাড়পত্র অনুমোদিত হয়েছে!`, lang), 'success');
  };

  const handleCopyPassLink = (visitorId: string) => {
    const link = `https://oneops.bogcl.com/gate-pass/${visitorId}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link);
    }
    showToast(t(`Digital Pass Link copied to clipboard! (${link})`, `পাস লিংক ক্লিপবোর্ডে কপি হয়েছে!`, lang), 'info');
  };

  const handleBroadcastEvacuationAlert = () => {
    if (!isGate) return;
    const insideCount = visitors.filter(v => v.status === 'checked_in').length;
    showToast(t(`Evacuation SMS sent to ${insideCount} visitor(s) on site.`, `সাইটে থাকা ${insideCount} জন অতিথিকে ইভাকুয়েশন এসএমএস পাঠানো হয়েছে।`, lang), 'danger');
  };

  const handleNotifyChairmanVIP = (v: VisitorRecord) => {
    showToast(t(`Arrival notice for ${v.name} sent to the host and the Chairman's office.`, `${v.name}-এর আগমন বার্তা হোস্ট ও চেয়ারম্যান দপ্তরে পাঠানো হয়েছে।`, lang), 'success');
  };

  const handleAddInspectionFinding = () => {
    if (!newFindingFocus.trim() || !newFindingObs.trim()) {
      showToast(t('Please enter both focus area and observation notes.', 'অনুগ্রহ করে পরিদর্শনের বিষয় ও পর্যবেক্ষণ লিখুন।', lang), 'warn');
      return;
    }
    if (!selectedVisitor) return;

    const newFinding: InspectionFindingItem = {
      focusArea: newFindingFocus.trim(),
      observation: newFindingObs.trim(),
      status: newFindingStatus,
      signOffDate: nowStamp(),
    };

    const updatedFindings = [...(selectedVisitor.inspectionFindings || []), newFinding];
    setVisitors(prev => prev.map(v => v.id === selectedVisitor.id ? { ...v, inspectionFindings: updatedFindings } : v));
    setNewFindingFocus('');
    setNewFindingObs('');
    showToast(t('Inspection observation recorded and counter-signed.', 'পরিদর্শন পর্যবেক্ষণ সফলভাবে লিপিবদ্ধ হয়েছে।', lang), 'success');
  };

  const handleExecuteQuickScan = (targetId: string) => {
    setIsScanningAnimation(true);
    setTimeout(() => {
      setIsScanningAnimation(false);
      handleCheckIn(targetId);
      setSelectedVisitorId(targetId);
      setShowScannerModal(false);
      setBarrierOpen(true);
      setTimeout(() => setBarrierOpen(false), 4000);
    }, 1000);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canInvite) return;
    if (!formName.trim() || !formOrg.trim() || !formPurpose.trim()) {
      showToast(lang === 'en' ? 'Please complete required fields.' : 'অনুগ্রহ করে প্রয়োজনীয় তথ্য পূরণ করুন।', 'warn');
      return;
    }

    const newId = nextRef('VIS');
    const newVis: VisitorRecord = {
      id: newId,
      name: formName.trim(),
      organization: formOrg.trim(),
      designation: formDesignation.trim() || (formCategory === 'vip' ? 'Honorary Dignitary' : formCategory === 'govt' ? 'Official Inspector' : 'Representative'),
      category: formCategory,
      hostEmployee: currentUserName,
      hostDept: currentUserDept,
      hostPhone: user?.phone ?? '',
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
      idProofNumber: formIdProofNum.trim(),
    };

    setVisitors(prev => [newVis, ...prev]);
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

    showToast(t(`Gate pass ${newId} issued for ${newVis.name}. The QR pass has been sent to the visitor.`, `${newVis.name}-এর জন্য গেট পাস ${newId} তৈরি হয়েছে। কিউআর পাস অতিথিকে পাঠানো হয়েছে।`, lang), 'success');
  };

  const getCategoryBadge = (category: VisitorRecord['category']) => {
    switch (category) {
      case 'vip':
        return <span className="badge gold" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>{t('VIP Guest', 'ভিআইপি অতিথি', lang)}</span>;
      case 'govt':
        return <span className="badge danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>{t('Govt Inspector', 'সরকারি পরিদর্শক', lang)}</span>;
      case 'client':
        return <span className="badge meeting" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>{t('Client', 'গ্রাহক', lang)}</span>;
      case 'vendor':
        return <span className="badge info" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>{t('Vendor', 'ভেন্ডর', lang)}</span>;
      case 'regular':
      default:
        return <span className="badge">{t('Visitor', 'অতিথি', lang)}</span>;
    }
  };

  const ppeClearedCount = (v: VisitorRecord) =>
    Object.values(v.ppeCleared).filter(Boolean).length;

  const sortedVisitors = useMemo(() => {
    const rank = (v: VisitorRecord) => {
      if (v.status === 'overdue') return 0;
      if (v.status === 'checked_in') return 1;
      if (v.status === 'pre_registered') return 2;
      return 3;
    };
    return [...displayedVisitors].sort((a, b) => rank(a) - rank(b));
  }, [displayedVisitors]);

  const statusSummary = useMemo(() => {
    if (mode === 'host') {
      if (stats.myGuestsInsideCount > 0) {
        return t(
          `You have ${stats.myGuestsInsideCount} guest(s) on site right now and ${stats.preRegisteredCount} expected today.`,
          `আপনার ${stats.myGuestsInsideCount} জন অতিথি এখন সাইটে আছেন এবং আজ আরও ${stats.preRegisteredCount} জন প্রত্যাশিত।`,
          lang
        );
      }
      return t(
        `You have ${stats.myGuestsCount} registered guest pass(es) (${stats.preRegisteredCount} expected today).`,
        `আপনার ${stats.myGuestsCount}টি নিবন্ধিত গেট পাস রয়েছে (আজ ${stats.preRegisteredCount} জন প্রত্যাশিত)।`,
        lang
      );
    }
    const siteBreakdown = t(
      `${stats.insideRefinery} at Keraniganj Refinery, ${stats.insideHQ} at Dhaka HQ`,
      `${stats.insideRefinery} জন কেরানীগঞ্জ রিফাইনারিতে, ${stats.insideHQ} জন ঢাকা প্রধান কার্যালয়ে`,
      lang
    );
    return t(
      `${stats.totalInside} visitor(s) are on site right now (${siteBreakdown}) and ${stats.preRegisteredCount} more are expected today.`,
      `বর্তমানে ${stats.totalInside} জন অতিথি সাইটে আছেন (${siteBreakdown}) এবং আজ আরও ${stats.preRegisteredCount} জন প্রত্যাশিত।`,
      lang
    );
  }, [mode, stats, lang]);

  const visitorNextStep = (v: VisitorRecord) => {
    const cleared = ppeClearedCount(v);
    const isRefinery = v.facility === 'Keraniganj Bitumen Refinery';
    if (v.status === 'pre_registered') {
      return {
        tone: 'info' as const,
        text: t(
          `Expected at ${v.expectedTime} to meet ${v.hostEmployee} (${v.hostDept}). Gate security will verify ID, issue a badge, and notify the host on arrival.`,
          `${v.hostEmployee} (${v.hostDept})-এর সাথে সাক্ষাতের জন্য ${v.expectedTime}-এ প্রত্যাশিত। গেটে পরিচয় যাচাই করে ব্যাজ দেওয়া হবে।`,
          lang
        ),
      };
    }
    if (v.status === 'checked_in' && isRefinery && cleared < 5) {
      return {
        tone: 'warn' as const,
        text: t(
          `On site since ${v.checkInTime}, but refinery safety clearance is incomplete (${cleared} of 5 items checked). Complete safety gear and H2S briefing before entering plant units.`,
          `${v.checkInTime} থেকে সাইটে আছেন, কিন্তু রিফাইনারি নিরাপত্তা ছাড়পত্র অসম্পূর্ণ (${cleared}/৫ সম্পন্ন)। প্ল্যান্টে প্রবেশের আগে সম্পূর্ণ করুন।`,
          lang
        ),
      };
    }
    if (v.status === 'checked_in') {
      return {
        tone: 'ok' as const,
        text: t(
          `Currently on site since ${v.checkInTime} with host ${v.hostEmployee} (${v.hostDept}). Gate security will record check-out and collect badge ${v.badgeNo || ''} upon departure.`,
          `${v.checkInTime} থেকে স্বাগতিক ${v.hostEmployee} (${v.hostDept})-এর সাথে সাইটে আছেন। প্রস্থানের সময় গেটে ব্যাজ জমা নেওয়া হবে।`,
          lang
        ),
      };
    }
    return {
      tone: 'neutral' as const,
      text: t(
        `Visit completed — checked out at ${v.checkOutTime || 'gate'} and badge returned.`,
        `পরিদর্শন সম্পন্ন — ${v.checkOutTime || 'গেটে'} চেক-আউট সম্পন্ন হয়েছে এবং ব্যাজ জমা দেওয়া হয়েছে।`,
        lang
      ),
    };
  };

  return (
    <div style={{ paddingBottom: '50px' }}>
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. TOP HEADER & EMERGENCY MUSTER ACTIONS */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="flex-between mb-3" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-1)', margin: 0 }}>
            {isGate
              ? t('Visitor Gate', 'ভিজিটর গেট', lang)
              : mode === 'oversight'
              ? t('Visitors on Site', 'সাইটে অতিথি', lang)
              : t('My Guests', 'আমার অতিথি', lang)}
          </h2>
          <p className="text-muted" style={{ margin: '4px 0 0', fontSize: '12.5px' }}>
            {isGate
              ? t('Check visitors in and out, issue badges, clear safety gear, and run the evacuation roll-call.', 'অতিথি চেক-ইন/আউট, ব্যাজ, পিপিই ছাড়পত্র ও ইভাকুয়েশন রোল-কল।', lang)
              : mode === 'oversight'
              ? t('Live visitor register and gate passes across Dhaka HQ and Keraniganj Refinery.', 'প্রধান কার্যালয় ও প্ল্যান্টের সকল গেট পাস।', lang)
              : t('Invite a visitor and track their gate pass.', 'অতিথি আমন্ত্রণ জানান ও গেট পাস অনুসরণ করুন।', lang)}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {mode !== 'host' && (
            <div style={{ display: 'flex', background: 'var(--surface-2)', borderRadius: '6px', padding: '2px' }}>
              <button
                className={`btn-sm-ghost ${scopeMode === 'my_guests' ? 'active' : ''}`}
                style={{ fontSize: '11.5px', fontWeight: 700, padding: '5px 10px', background: scopeMode === 'my_guests' ? 'var(--surface-1)' : 'transparent' }}
                onClick={() => setScopeMode('my_guests')}
              >
                {t('My guests', 'আমার অতিথি', lang)} ({stats.myGuestsCount})
              </button>
              <button
                className={`btn-sm-ghost ${scopeMode === 'all' ? 'active' : ''}`}
                style={{ fontSize: '11.5px', fontWeight: 700, padding: '5px 10px', background: scopeMode === 'all' ? 'var(--surface-1)' : 'transparent' }}
                onClick={() => setScopeMode('all')}
              >
                {t('All visitors', 'সকল অতিথি', lang)} ({visitors.length})
              </button>
            </div>
          )}

          {canInvite && (
            <button
              className="btn-primary"
              style={{ fontSize: '12px', padding: '7px 14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={() => setShowRegisterModal(true)}
            >
              <Plus size={14} />
              {t('Invite a guest', 'অতিথি আমন্ত্রণ', lang)}
            </button>
          )}

          {isGate && (
            <>
              <button
                className="btn-gold"
                style={{ fontSize: '12px', padding: '7px 14px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800 }}
                onClick={() => setShowScannerModal(true)}
              >
                <Scan size={14} />
                {t('Scan pass', 'পাস স্ক্যান', lang)}
              </button>
              <button
                className="btn-outline-danger"
                style={{ fontSize: '12px', padding: '7px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={() => setShowMusterModal(true)}
              >
                <Users size={14} />
                {t('Evacuation roll-call', 'ইভাকুয়েশন রোল-কল', lang)} ({stats.totalInside})
              </button>
              <button
                className="btn-outline"
                style={{ fontSize: '12px', padding: '7px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={() => setShowALPRModal(true)}
              >
                <Car size={14} />
                {t('Vehicle gate', 'গাড়ি গেট', lang)}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. ONE-SENTENCE STATUS BANNER */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className={`lv-status ${stats.overdueCount > 0 ? 'lv-status--warn' : 'lv-status--ok'}`} style={{ marginBottom: '16px' }}>
        <UserCheck size={16} style={{ flexShrink: 0 }} />
        <span>{statusSummary}</span>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3. PRACTICAL TWO-COLUMN MASTER-DETAIL WORKSPACE */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="guest-two-col-layout">
        {/* ── LEFT COLUMN: VISITOR DIRECTORY FEED ── */}
        <div className="guest-directory-col">
          <div className="guest-directory-bar">
            <div className="workforce-tabs" role="group" aria-label={t('Filter visitors', 'অতিথি ফিল্টার', lang)}>
              <button type="button" className={`workforce-tab${activeTab === 'all' ? ' active' : ''}`} aria-pressed={activeTab === 'all'} onClick={() => setActiveTab('all')}>
                {t('All', 'সব', lang)} <b>{scopedVisitors.length}</b>
              </button>
              <button type="button" className={`workforce-tab${activeTab === 'inside' ? ' active' : ''}`} aria-pressed={activeTab === 'inside'} onClick={() => setActiveTab('inside')}>
                {t('On site', 'উপস্থিত', lang)} <b>{stats.totalInside}</b>
              </button>
              <button type="button" className={`workforce-tab${activeTab === 'pre_registered' ? ' active' : ''}`} aria-pressed={activeTab === 'pre_registered'} onClick={() => setActiveTab('pre_registered')}>
                {t('Expected', 'প্রত্যাশিত', lang)} <b>{stats.preRegisteredCount}</b>
              </button>
              <button type="button" className={`workforce-tab${activeTab === 'vip_govt' ? ' active' : ''}`} aria-pressed={activeTab === 'vip_govt'} onClick={() => setActiveTab('vip_govt')}>
                {t('VIP & Govt', 'ভিআইপি ও সরকারি', lang)} <b>{stats.vipGovtCount}</b>
              </button>
              <button type="button" className={`workforce-tab${activeTab === 'my_guests' ? ' active' : ''}`} aria-pressed={activeTab === 'my_guests'} onClick={() => setActiveTab('my_guests')}>
                {t('My guests', 'আমার অতিথি', lang)} <b>{stats.myGuestsCount}</b>
              </button>
            </div>
            <div className="workforce-filter-row">
              <div className="workforce-search-wrap">
                <Search size={14} className="workforce-search-icon" aria-hidden />
                <input
                  type="search"
                  className="workforce-search-input"
                  placeholder={t('Search visitor, organization, host, or plate...', 'নাম, সংস্থা, স্বাগতিক বা গাড়ি খুঁজুন...', lang)}
                  aria-label={t('Search visitors', 'অতিথি খুঁজুন', lang)}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select
                className="workforce-select"
                value={facilityFilter}
                aria-label={t('Site', 'স্থাপনা', lang)}
                onChange={(e) => setFacilityFilter(e.target.value as typeof facilityFilter)}
              >
                <option value="all">{t('All sites', 'সকল স্থাপনা', lang)}</option>
                <option value="Keraniganj Bitumen Refinery">{t('Keraniganj Refinery', 'কেরানীগঞ্জ রিফাইনারি', lang)}</option>
                <option value="Bashundhara Corporate HQ, Baridhara">{t('Dhaka HQ', 'ঢাকা প্রধান কার্যালয়', lang)}</option>
              </select>
            </div>
          </div>

          {/* Scrollable Visitor Cards Feed */}
          <div className="guest-feed-list">
            {sortedVisitors.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', background: 'var(--surface-1)', borderRadius: 'var(--radius-md)', border: '1px solid var(--brand-slate-200)', color: 'var(--brand-slate-500)' }}>
                <Users size={28} style={{ opacity: 0.4, margin: '0 auto 8px' }} />
                <div style={{ fontWeight: 700, fontSize: '13px' }}>{t('No matching visitors', 'কোনো অতিথি পাওয়া যায়নি', lang)}</div>
                <div style={{ fontSize: '11px' }}>{t('Try clearing your search or invite a new guest.', 'ফিল্টার পরিবর্তন করুন বা নতুন অতিথি আমন্ত্রণ জানান।', lang)}</div>
              </div>
            ) : (
              sortedVisitors.map((v) => {
                const isSelected = selectedVisitor?.id === v.id;
                const isHostMe = v.hostEmployee.toLowerCase().includes(currentUserName.toLowerCase());
                const shortSite = v.facility.includes('Keraniganj')
                  ? t('Keraniganj Refinery', 'কেরানীগঞ্জ রিফাইনারি', lang)
                  : v.facility.includes('Chittagong')
                  ? t('Patenga Terminal', 'পতেঙ্গা টার্মিনাল', lang)
                  : t('Dhaka HQ', 'ঢাকা প্রধান কার্যালয়', lang);

                return (
                  <div
                    key={v.id}
                    className={`guest-feed-card ${isSelected ? 'active' : ''}`}
                    onClick={() => setSelectedVisitorId(v.id)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '4px' }}>
                      <div style={{ fontWeight: 800, fontSize: '13.5px', color: 'var(--brand-slate-900)', lineHeight: 1.25 }}>
                        {v.name}
                      </div>
                      {v.status === 'checked_in' ? (
                        <span className="badge success" style={{ fontSize: '10px', padding: '2px 7px', flexShrink: 0 }}>
                          {t(`On site · ${v.checkInTime}`, `উপস্থিত · ${v.checkInTime}`, lang)}
                        </span>
                      ) : v.status === 'pre_registered' ? (
                        <span className="badge info" style={{ fontSize: '10px', padding: '2px 7px', flexShrink: 0 }}>
                          {t(`Expected ${v.expectedTime}`, `প্রত্যাশিত ${v.expectedTime}`, lang)}
                        </span>
                      ) : (
                        <span className="badge neutral" style={{ fontSize: '10px', padding: '2px 7px', flexShrink: 0 }}>
                          {t('Checked out', 'চেক-আউট', lang)}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <div style={{ fontSize: '11.5px', color: 'var(--brand-slate-600)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {v.organization}
                      </div>
                      <div style={{ flexShrink: 0 }}>{getCategoryBadge(v.category)}</div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '7px', borderTop: '1px solid var(--brand-slate-100)', fontSize: '11px', gap: '8px' }}>
                      <div style={{ color: 'var(--brand-slate-600)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <strong>{shortSite}</strong> ·{' '}
                        <span style={{ color: isHostMe ? 'var(--status-info)' : 'var(--brand-slate-600)', fontWeight: isHostMe ? 700 : 500 }}>
                          {t('Host', 'স্বাগতিক', lang)}: {v.hostEmployee}
                        </span>
                      </div>

                      {isGate && v.status === 'pre_registered' && (
                        <button
                          type="button"
                          className="btn-primary"
                          style={{ fontSize: '10.5px', padding: '3px 9px', background: 'var(--status-success-solid)', color: 'var(--text-on-brand)', borderRadius: '4px', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCheckIn(v.id);
                          }}
                        >
                          <UserCheck size={11} /> {t('Check in', 'চেক-ইন', lang)}
                        </button>
                      )}
                      {isGate && v.status === 'checked_in' && (
                        <button
                          type="button"
                          style={{ fontSize: '10.5px', padding: '3px 9px', background: 'var(--status-danger-bg)', color: 'var(--status-danger)', border: '1px solid var(--status-danger-border)', borderRadius: '4px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCheckOut(v.id);
                          }}
                        >
                          <Clock size={11} /> {t('Check out', 'চেক-আউট', lang)}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN: DIGITAL GATE PASS & SECURITY COCKPIT ── */}
        <div>
          {selectedVisitor && (() => {
            const nextInfo = visitorNextStep(selectedVisitor);
            const clearedCount = ppeClearedCount(selectedVisitor);
            const hasProtocolOrFindings =
              selectedVisitor.category === 'vip' ||
              selectedVisitor.category === 'govt' ||
              Boolean(selectedVisitor.vipProtocol) ||
              Boolean(selectedVisitor.inspectionFindings && selectedVisitor.inspectionFindings.length > 0);
            const activeMainTab =
              cockpitSubTab === 'ppe'
                ? 'ppe'
                : cockpitSubTab === 'protocol' || cockpitSubTab === 'inspection'
                ? 'protocol'
                : 'pass';

            return (
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {/* Digital Pass Header */}
                <div className="guest-pass-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', position: 'relative', zIndex: 2 }}>
                    <div style={{ flex: 1, minWidth: '220px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--status-info-bright)', fontWeight: 700 }}>
                          {selectedVisitor.facility}
                        </span>
                        {getCategoryBadge(selectedVisitor.category)}
                        {selectedVisitor.vipProtocol && (
                          <span className="badge gold" style={{ fontSize: '10px' }}>
                            {t('VIP Escort', 'ভিআইপি এসকর্ট', lang)}
                          </span>
                        )}
                      </div>

                      <h1 style={{ fontSize: '23px', fontWeight: 900, color: 'var(--text-on-brand)', margin: '4px 0 2px' }}>
                        {selectedVisitor.name}
                      </h1>

                      <div style={{ fontSize: '13px', color: 'var(--text-inverse-2)', fontWeight: 600 }}>
                        {selectedVisitor.designation} · <strong>{selectedVisitor.organization}</strong>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px', fontSize: '11.5px', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                        <span>
                          {t('Host:', 'স্বাগতিক:', lang)}{' '}
                          <strong style={{ color: 'var(--text-on-brand)' }}>{selectedVisitor.hostEmployee}</strong> ({selectedVisitor.hostDept})
                        </span>
                        {selectedVisitor.badgeNo && (
                          <>
                            <span>•</span>
                            <span>
                              {t('Badge:', 'ব্যাজ:', lang)}{' '}
                              <strong style={{ color: 'var(--status-info-bright)', fontFamily: 'monospace' }}>{selectedVisitor.badgeNo}</strong>
                            </span>
                          </>
                        )}
                        {selectedVisitor.vehiclePlate && !/pedestrian/i.test(selectedVisitor.vehiclePlate) && (
                          <>
                            <span>•</span>
                            <span>
                              {t('Vehicle:', 'গাড়ি:', lang)}{' '}
                              <code style={{ color: 'var(--status-success-bright)' }}>{selectedVisitor.vehiclePlate}</code>
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* QR Code */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', background: 'var(--surface-1)', padding: '10px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', flexShrink: 0 }}>
                      <QrCode size={60} color="var(--text-1)" />
                      <span style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-1)', letterSpacing: '0.5px' }}>
                        {t('GATE PASS QR', 'গেট পাস কিউআর', lang)}
                      </span>
                    </div>
                  </div>

                  {/* Status & Action Bar */}
                  <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', position: 'relative', zIndex: 2 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: selectedVisitor.status === 'checked_in' ? 'var(--status-success-solid)' : selectedVisitor.status === 'pre_registered' ? 'var(--status-warning-solid)' : 'var(--brand-slate-400)', display: 'inline-block' }} />
                      <strong style={{ color: 'var(--text-inverse)' }}>
                        {selectedVisitor.status === 'checked_in'
                          ? t(`On site since ${selectedVisitor.checkInTime}`, `${selectedVisitor.checkInTime} হতে ক্যাম্পাসে অবস্থান করছেন`, lang)
                          : selectedVisitor.status === 'pre_registered'
                          ? t(`Expected today at ${selectedVisitor.expectedTime}`, `প্রত্যাশিত আগমন: ${selectedVisitor.expectedTime}`, lang)
                          : t(`Checked out at ${selectedVisitor.checkOutTime}`, `${selectedVisitor.checkOutTime}-এ চেক-আউট সম্পন্ন`, lang)}
                      </strong>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        className="btn-sm-ghost"
                        style={{ background: 'rgba(255,255,255,0.15)', color: 'var(--text-on-brand)', border: '1px solid rgba(255,255,255,0.25)', fontSize: '11px' }}
                        onClick={() => handleCopyPassLink(selectedVisitor.id)}
                      >
                        <Share2 size={12} />
                        {t('Copy Link', 'লিংক কপি', lang)}
                      </button>
                      <button
                        className="btn-sm-ghost"
                        style={{ background: 'rgba(255,255,255,0.15)', color: 'var(--text-on-brand)', border: '1px solid rgba(255,255,255,0.25)', fontSize: '11px' }}
                        onClick={() => setShowGatePassModal(true)}
                      >
                        <Printer size={12} />
                        {t('Print Badge', 'ব্যাজ প্রিন্ট', lang)}
                      </button>
                      <button
                        className="btn-sm-ghost"
                        style={{ background: 'rgba(255,255,255,0.15)', color: 'var(--text-on-brand)', border: '1px solid rgba(255,255,255,0.25)', fontSize: '11px' }}
                        onClick={() => setShowSMSModal(true)}
                      >
                        <Send size={12} />
                        {t('Share Pass', 'শেয়ার করুন', lang)}
                      </button>
                    </div>
                  </div>
                </div>

                {/* ── WHAT HAPPENS NEXT BANNER ── */}
                <div
                  style={{
                    padding: '12px 20px',
                    background:
                      nextInfo.tone === 'warn'
                        ? 'var(--status-warning-bg)'
                        : nextInfo.tone === 'info'
                        ? 'var(--status-info-bg)'
                        : nextInfo.tone === 'ok'
                        ? 'var(--status-success-bg)'
                        : 'var(--surface-2)',
                    borderBottom: '1px solid var(--brand-slate-200)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    flexWrap: 'wrap',
                    fontSize: '12.5px',
                  }}
                >
                  <div style={{ color: 'var(--brand-slate-800)', lineHeight: 1.45, flex: 1 }}>
                    <strong>{t('What happens next:', 'পরবর্তী ধাপ:', lang)}</strong> {nextInfo.text}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    {isGate && selectedVisitor.status === 'pre_registered' && (
                      <button
                        className="btn-primary"
                        style={{ fontSize: '12px', padding: '6px 14px', background: 'var(--status-success-solid)', display: 'flex', alignItems: 'center', gap: '6px' }}
                        onClick={() => handleCheckIn(selectedVisitor.id)}
                      >
                        <UserCheck size={14} />
                        {t('Check in & issue badge', 'চেক-ইন ও ব্যাজ প্রদান', lang)}
                      </button>
                    )}
                    {isGate && selectedVisitor.status === 'checked_in' && (
                      <button
                        className="btn-outline-danger"
                        style={{ fontSize: '12px', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
                        onClick={() => handleCheckOut(selectedVisitor.id)}
                      >
                        <Clock size={14} />
                        {t('Check out', 'চেক-আউট', lang)}
                      </button>
                    )}
                  </div>
                </div>

                {/* ── CLEAN 3-TAB SUB-NAVIGATION (NO HORIZONTAL OVERFLOW) ── */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--brand-slate-200)', padding: '10px 20px', background: 'var(--brand-slate-50)', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      className={`parcel-pill-tab ${activeMainTab === 'pass' ? 'active' : ''}`}
                      onClick={() => setCockpitSubTab('pass')}
                    >
                      <User size={13} />
                      {t('Visit, Host & Zones', 'সাক্ষাৎ, স্বাগতিক ও অঞ্চল', lang)}
                    </button>
                    <button
                      className={`parcel-pill-tab ${activeMainTab === 'ppe' ? 'active' : ''}`}
                      onClick={() => setCockpitSubTab('ppe')}
                    >
                      <HardHat size={13} />
                      {t('Safety Clearance', 'নিরাপত্তা ছাড়পত্র', lang)} ({clearedCount}/5)
                    </button>
                    <button
                      className={`parcel-pill-tab ${activeMainTab === 'protocol' ? 'active' : ''}`}
                      onClick={() => setCockpitSubTab('protocol')}
                    >
                      <FileCheck size={13} />
                      {hasProtocolOrFindings
                        ? t('VIP Escort & Inspection Log', 'ভিআইপি প্রটোকল ও পরিদর্শন নোট', lang)
                        : t('Visit Notes & Hospitality', 'পরিদর্শন নোট ও আপ্যায়ন', lang)}
                      {selectedVisitor.inspectionFindings && selectedVisitor.inspectionFindings.length > 0
                        ? ` (${selectedVisitor.inspectionFindings.length})`
                        : ''}
                    </button>
                  </div>
                </div>

                {/* ── TAB 1: VISIT, HOST, PERMITTED ZONES & GATE BARRIER ── */}
                {activeMainTab === 'pass' && (
                  <div style={{ padding: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '18px' }}>
                      {/*Purpose of Visit */}
                      <div style={{ background: 'var(--surface-0)', border: '1px solid var(--brand-slate-200)', borderRadius: 'var(--radius-md)', padding: '15px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-slate-500)', textTransform: 'uppercase' }}>
                          {t('Why they are visiting', 'পরিদর্শনের উদ্দেশ্য', lang)}
                        </div>
                        <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--brand-slate-900)', marginTop: '6px', lineHeight: 1.45 }}>
                          {selectedVisitor.purpose}
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--brand-slate-500)', marginTop: '8px' }}>
                          {t('Site:', 'স্থাপনা:', lang)} <strong>{selectedVisitor.facility}</strong>
                        </div>
                      </div>

                      {/* Host Card */}
                      <div style={{ background: 'var(--surface-0)', border: '1px solid var(--brand-slate-200)', borderRadius: 'var(--radius-md)', padding: '15px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-slate-500)', textTransform: 'uppercase' }}>
                          {t('Host Officer & Escort', 'স্বাগতিক কর্মকর্তা ও এসকর্ট', lang)}
                        </div>
                        <div style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--brand-slate-900)', marginTop: '4px' }}>
                          {selectedVisitor.hostEmployee}
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--brand-slate-500)', marginTop: '2px' }}>
                          {selectedVisitor.hostDept}
                        </div>
                        <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button
                            className="btn-primary"
                            style={{ fontSize: '11px', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}
                            onClick={() => showToast(t(`Calling Host ${selectedVisitor.hostEmployee}: ${selectedVisitor.hostPhone || '01711-000000'}`, `হোস্ট ${selectedVisitor.hostEmployee}-কে কল করা হচ্ছে`, lang), 'info')}
                          >
                            <Phone size={12} />
                            {t('Call Host', 'হোস্টকে কল করুন', lang)}
                          </button>
                          <button
                            className="btn-sm-ghost"
                            style={{ fontSize: '11px', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}
                            onClick={() => showToast(t(`Host ${selectedVisitor.hostEmployee} notified of guest arrival at reception.`, `হোস্ট ${selectedVisitor.hostEmployee}-কে অতিথির আগমন জানানো হয়েছে।`, lang), 'success')}
                          >
                            <MessageSquare size={12} />
                            {t('Notify Host', 'বার্তা পাঠান', lang)}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Permitted Areas inline */}
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--brand-slate-800)', marginBottom: '8px' }}>
                        {t('Permitted Areas on Site', 'অনুমোদিত এলাকা', lang)}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '8px' }}>
                        {selectedVisitor.permittedZones.map((zone, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '10px 12px',
                              borderRadius: '8px',
                              border: '1px solid var(--brand-slate-200)',
                              background: 'var(--surface-1)',
                              gap: '8px',
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '12.5px', color: 'var(--brand-slate-900)' }}>
                                {lang === 'bn' ? zone.nameBn : zone.name}
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)' }}>
                                {zone.escortRequired
                                  ? t('Escort required', 'এসকর্ট আবশ্যক', lang)
                                  : t('Unaccompanied access allowed', 'স্বাভাবিক প্রবেশাধিকার', lang)}
                              </div>
                            </div>
                            <span className={`guest-zone-tag ${zone.level}`}>
                              {zone.level === 'green'
                                ? t('Standard', 'সাধারণ', lang)
                                : zone.level === 'yellow'
                                ? t('Controlled', 'নিয়ন্ত্রিত', lang)
                                : t('High-Hazard', 'উচ্চ-ঝুঁকি', lang)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Vehicle & Gate Barrier (if driving or Gate role) */}
                    {selectedVisitor.vehiclePlate && !/pedestrian/i.test(selectedVisitor.vehiclePlate) && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '12px',
                          padding: '12px 16px',
                          borderRadius: '8px',
                          border: '1px solid var(--brand-slate-200)',
                          background: 'var(--surface-0)',
                          marginBottom: '14px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Car size={18} color="var(--status-info)" />
                          <div>
                            <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)', fontWeight: 700 }}>
                              {t('Registered Vehicle Plate', 'নিবন্ধিত গাড়ির নম্বরপ্লেট', lang)}
                            </div>
                            <div style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 800, color: 'var(--brand-slate-900)' }}>
                              {selectedVisitor.vehiclePlate}
                              {selectedVisitor.parkingBay ? ` · ${selectedVisitor.parkingBay}` : ''}
                            </div>
                          </div>
                        </div>
                        {isGate && (
                          <button
                            className="btn-gold"
                            style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            onClick={handleSimulateBarrier}
                          >
                            <Car size={14} />
                            {barrierOpen
                              ? t('Barrier open', 'বেরিয়ার খোলা', lang)
                              : t('Plate matches — raise barrier', 'প্লেট মিলেছে — বেরিয়ার খুলুন', lang)}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Reference & ID Proof Disclosure */}
                    <details className="apv-ref-details">
                      <summary>
                        {t('Pass ID, ID verification & emergency contact', 'পাস আইডি, পরিচয়পত্র যাচাই ও জরুরি যোগাযোগ', lang)}
                      </summary>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginTop: '10px', fontSize: '12px' }}>
                        <div>
                          <span style={{ color: 'var(--brand-slate-500)' }}>{t('Pass ID:', 'পাস আইডি:', lang)}</span>{' '}
                          <strong style={{ fontFamily: 'monospace' }}>{selectedVisitor.id}</strong>
                        </div>
                        <div>
                          <span style={{ color: 'var(--brand-slate-500)' }}>{t('Badge No:', 'ব্যাজ নম্বর:', lang)}</span>{' '}
                          <strong style={{ fontFamily: 'monospace' }}>{selectedVisitor.badgeNo || t('Not issued yet', 'এখনও ইস্যু হয়নি', lang)}</strong>
                        </div>
                        <div>
                          <span style={{ color: 'var(--brand-slate-500)' }}>{selectedVisitor.idProofType || t('ID Document', 'পরিচয়পত্র', lang)}:</span>{' '}
                          <strong style={{ fontFamily: 'monospace' }}>{selectedVisitor.idProofNumber || '—'}</strong>
                        </div>
                        <div>
                          <span style={{ color: 'var(--brand-slate-500)' }}>{t('Emergency Contact:', 'জরুরি যোগাযোগ:', lang)}</span>{' '}
                          <strong>{selectedVisitor.emergencyContact || selectedVisitor.phone || t('Via Reception', 'অভ্যর্থনা ডেস্ক', lang)}</strong>
                        </div>
                      </div>
                    </details>
                  </div>
                )}

                {/* ── TAB 2: HSE SAFETY GEAR & INDUCTION CLEARANCE ── */}
                {activeMainTab === 'ppe' && (
                  <div style={{ padding: '20px' }}>
                    <div style={{ background: clearedCount === 5 ? 'var(--status-success-bg)' : 'var(--status-warning-bg)', border: `1px solid ${clearedCount === 5 ? 'var(--status-success-border)' : 'var(--status-warning-bright)'}`, padding: '14px 18px', borderRadius: 'var(--radius-md)', marginBottom: '18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <HardHat size={24} color={clearedCount === 5 ? 'var(--status-success-text)' : 'var(--status-warning-text)'} />
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '13.5px', color: clearedCount === 5 ? 'var(--status-success-text)' : 'var(--status-warning-text)' }}>
                            {clearedCount === 5
                              ? t('All 5 Safety Gear & Briefing Checks Completed', 'সকল ৫টি নিরাপত্তা সরঞ্জাম ও ব্রিফিং সম্পন্ন', lang)
                              : t(`${clearedCount} of 5 Safety Checks Completed`, `${clearedCount}/৫টি নিরাপত্তা যাচাই সম্পন্ন`, lang)}
                          </div>
                          <div style={{ fontSize: '11.5px', color: 'var(--brand-slate-700)', marginTop: '2px' }}>
                            {t(
                              'Visitors entering refinery units must wear full protective gear and complete the H2S emergency briefing.',
                              'রিফাইনারি ইউনিটে প্রবেশকারী অতিথিদের সম্পূর্ণ পিপিই পরিধান এবং H2S জরুরি ব্রিফিং সম্পন্ন করতে হবে।',
                              lang
                            )}
                          </div>
                        </div>
                      </div>
                      {isGate && clearedCount < 5 && (
                        <button
                          type="button"
                          className="btn-primary"
                          style={{ fontSize: '12px', padding: '7px 14px', background: 'var(--status-success-solid)', color: 'var(--text-on-brand)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                          onClick={handleApproveAllPPE}
                        >
                          <CheckCircle2 size={15} />
                          {t('Approve All 5 Checks', 'সকল ৫টি ছাড়পত্র অনুমোদন', lang)}
                        </button>
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                      {(
                        [
                          { key: 'hardHat', title: t('Industrial Hard Hat', 'শিল্প নিরাপত্তা হেলমেট', lang), sub: t('White visitor helmet', 'সাদা ভিজিটর হেলমেট', lang) },
                          { key: 'safetyGoggles', title: t('Safety Eye Goggles', 'নিরাপত্তা চশমা', lang), sub: t('Anti-splash eye protection', 'চোখের সুরক্ষা চশমা', lang) },
                          { key: 'safetyShoes', title: t('Steel-Toe Safety Boots', 'স্টিল-টো সেফটি জুতা', lang), sub: t('Anti-static sole', 'অ্যান্টি-স্ট্যাটিক সোল', lang) },
                          { key: 'hiVisVest', title: t('High-Visibility Vest', 'রিফ্লেক্টিভ সেফটি ভেস্ট', lang), sub: t('Reflective visitor jacket', 'প্রতিফলক জ্যাকেট', lang) },
                          { key: 'h2sBriefing', title: t('H2S Gas & Evacuation Briefing', 'H2S গ্যাস ও ইভাকুয়েশন ব্রিফিং', lang), sub: t('Assembly Point #3 briefed', 'অ্যাসেম্বলি পয়েন্ট ৩ ব্রিফিং', lang) },
                        ] as const
                      ).map((item) => {
                        const checked = selectedVisitor.ppeCleared[item.key];
                        return (
                          <div
                            key={item.key}
                            style={{
                              padding: '12px 14px',
                              borderRadius: '8px',
                              border: '1px solid',
                              borderColor: checked ? 'var(--status-success-border)' : 'var(--border-1)',
                              background: checked ? 'var(--status-success-bg)' : 'var(--surface-1)',
                              cursor: isGate ? 'pointer' : 'default',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                            onClick={() => handleTogglePPE(item.key)}
                          >
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '12.5px' }}>{item.title}</div>
                              <div style={{ fontSize: '10.5px', color: 'var(--text-3)' }}>{item.sub}</div>
                            </div>
                            <span className={`badge ${checked ? 'success' : 'neutral'}`}>
                              {checked ? t('Cleared', 'সম্পন্ন', lang) : t('Pending', 'বাকি', lang)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── TAB 3: VIP ESCORT, HOSPITALITY & INSPECTION LOG ── */}
                {activeMainTab === 'protocol' && (
                  <div style={{ padding: '20px' }}>
                    {/* VIP Hospitality & Escort Summary */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--brand-slate-900)' }}>
                        {t('Escort, Meeting Room & Hospitality Arrangements', 'এসকর্ট, সভাকক্ষ ও আপ্যায়ন ব্যবস্থা', lang)}
                      </div>
                      {(selectedVisitor.category === 'vip' || selectedVisitor.category === 'govt') && (
                        <button
                          className="btn-gold"
                          style={{ fontSize: '11.5px', padding: '5px 12px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          onClick={() => handleNotifyChairmanVIP(selectedVisitor)}
                        >
                          <Send size={12} />
                          {t('Notify Chairman’s Office & GM', 'চেয়ারম্যান দপ্তর ও জিএম-কে জানান', lang)}
                        </button>
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px', marginBottom: '22px' }}>
                      <div style={{ background: 'var(--surface-0)', border: '1px solid var(--border-1)', borderRadius: '8px', padding: '13px' }}>
                        <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--brand-slate-500)', textTransform: 'uppercase' }}>
                          {t('Escort Officer', 'প্রটোকল কর্মকর্তা', lang)}
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--brand-slate-900)', marginTop: '4px' }}>
                          {selectedVisitor.escortOfficer || selectedVisitor.hostEmployee}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)', marginTop: '2px' }}>
                          {selectedVisitor.hostDept}
                        </div>
                      </div>

                      <div style={{ background: 'var(--surface-0)', border: '1px solid var(--border-1)', borderRadius: '8px', padding: '13px' }}>
                        <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--brand-slate-500)', textTransform: 'uppercase' }}>
                          {t('Meeting Room / Suite', 'সভাকক্ষ / লাউঞ্জ', lang)}
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--brand-slate-900)', marginTop: '4px' }}>
                          {selectedVisitor.executiveSuite || t('Main Conference Room', 'প্রধান সভাকক্ষ', lang)}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--status-success)', fontWeight: 600, marginTop: '2px' }}>
                          {t('Ready for visitor', 'প্রস্তুত', lang)}
                        </div>
                      </div>

                      <div style={{ background: 'var(--surface-0)', border: '1px solid var(--border-1)', borderRadius: '8px', padding: '13px' }}>
                        <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--brand-slate-500)', textTransform: 'uppercase' }}>
                          {t('Reserved Parking', 'নির্ধারিত পার্কিং', lang)}
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--brand-slate-900)', marginTop: '4px' }}>
                          {selectedVisitor.parkingBay || t('Visitor Parking Bay', 'ভিজিটর পার্কিং বে', lang)}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)', marginTop: '2px', fontFamily: 'monospace' }}>
                          {selectedVisitor.vehiclePlate || t('No vehicle', 'গাড়ি নেই', lang)}
                        </div>
                      </div>

                      <div style={{ background: 'var(--surface-0)', border: '1px solid var(--border-1)', borderRadius: '8px', padding: '13px' }}>
                        <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--brand-slate-500)', textTransform: 'uppercase' }}>
                          {t('Hospitality & Refreshments', 'আপ্যায়ন ও খাবার', lang)}
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--brand-slate-900)', marginTop: '4px' }}>
                          {selectedVisitor.dietaryPreferences || t('Tea, Coffee & Light Refreshments', 'চা, কফি ও হালকা নাস্তা', lang)}
                        </div>
                        <div style={{ marginTop: '6px' }}>
                          <button
                            className="btn-sm-ghost"
                            style={{ fontSize: '11px', padding: '3px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => showToast(t(`Hospitality team notified for ${selectedVisitor.name}.`, `আপ্যায়ন টিমকে অবহিত করা হয়েছে।`, lang), 'success')}
                          >
                            <Coffee size={11} /> {t('Notify Pantry', 'প্যান্ট্রিতে জানান', lang)}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Inspection Observations & Visit Notes */}
                    <div style={{ borderTop: '1px solid var(--brand-slate-200)', paddingTop: '18px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--brand-slate-900)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <CheckCircle2 size={15} color="var(--status-success)" />
                          {t('Inspection Observations & Visit Checkpoints', 'পরিদর্শন পর্যবেক্ষণ ও নোট', lang)}
                        </div>
                        {selectedVisitor.inspectionFindings && selectedVisitor.inspectionFindings.length > 0 && (
                          <button
                            className="btn-outline"
                            style={{ fontSize: '11.5px', padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            onClick={() => showToast(t(`Joint Inspection Memo PDF exported for ${selectedVisitor.name}.`, `যৌথ পরিদর্শন মেমো প্রস্তুত সম্পন্ন।`, lang), 'success')}
                          >
                            <Download size={13} />
                            {t('Export Memo (PDF)', 'মেমো ডাউনলোড', lang)}
                          </button>
                        )}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                        {(!selectedVisitor.inspectionFindings || selectedVisitor.inspectionFindings.length === 0) ? (
                          <div style={{ padding: '18px', textAlign: 'center', background: 'var(--surface-0)', borderRadius: '8px', border: '1px dashed var(--border-2)', color: 'var(--brand-slate-500)', fontSize: '12px' }}>
                            {t('No observations recorded for this visit yet. Add a checkpoint below if needed.', 'এখনও কোনো পর্যবেক্ষণ লিপিবদ্ধ হয়নি। প্রয়োজনে নিচের ফর্ম ব্যবহার করুন।', lang)}
                          </div>
                        ) : (
                          selectedVisitor.inspectionFindings.map((finding, idx) => (
                            <div
                              key={idx}
                              style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                justifyContent: 'space-between',
                                padding: '12px 16px',
                                background: 'var(--surface-1)',
                                border: '1px solid var(--brand-slate-200)',
                                borderRadius: '8px',
                                gap: '12px',
                              }}
                            >
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{
                                    fontSize: '10px',
                                    fontWeight: 800,
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    background: finding.status === 'passed' ? 'var(--status-success-bg)' : finding.status === 'observation' ? 'var(--status-warning-bg)' : 'var(--status-danger-bg)',
                                    color: finding.status === 'passed' ? 'var(--status-success-text)' : finding.status === 'observation' ? 'var(--status-warning-text)' : 'var(--status-danger-text)',
                                  }}>
                                    {finding.status === 'passed'
                                      ? t('Passed', 'উত্তীর্ণ', lang)
                                      : finding.status === 'observation'
                                      ? t('Advisory', 'পরামর্শ', lang)
                                      : t('Critical', 'জরুরি', lang)}
                                  </span>
                                  <strong style={{ fontSize: '13px', color: 'var(--brand-slate-900)' }}>
                                    {finding.focusArea}
                                  </strong>
                                </div>
                                <div style={{ fontSize: '12px', color: 'var(--brand-slate-700)', marginTop: '4px', lineHeight: 1.4 }}>
                                  {finding.observation}
                                </div>
                                <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-400)', marginTop: '4px' }}>
                                  {t('Recorded:', 'নথিভুক্ত:', lang)} {finding.signOffDate}
                                </div>
                              </div>
                              <CheckCircle size={16} color="var(--status-success)" style={{ flexShrink: 0, marginTop: '2px' }} />
                            </div>
                          ))
                        )}
                      </div>

                      {/* Add New Finding Form */}
                      <div style={{ background: 'var(--surface-0)', border: '1px solid var(--border-1)', borderRadius: '8px', padding: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                          <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--brand-slate-900)' }}>
                            {t('Add Observation or Checkpoint', 'নতুন পর্যবেক্ষণ যোগ করুন', lang)}
                          </div>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              className="badge info"
                              style={{ cursor: 'pointer', border: 'none' }}
                              onClick={() => {
                                setNewFindingFocus('Bitumen Storage Tank TK-101 Pressure Relief');
                                setNewFindingObs('Pressure verified at 2.4 bar, nitrogen blanket sealed, PRV stamp valid.');
                                setNewFindingStatus('passed');
                              }}
                            >
                              {t('+ Relief Valve (Passed)', '+ রিলিফ ভালভ (উত্তীর্ণ)', lang)}
                            </button>
                            <button
                              type="button"
                              className="badge warn"
                              style={{ cursor: 'pointer', border: 'none' }}
                              onClick={() => {
                                setNewFindingFocus('Flare Header Elevation +14m Grounding');
                                setNewFindingObs('Static grounding copper braid shows slight atmospheric oxidation; maintenance scheduled.');
                                setNewFindingStatus('observation');
                              }}
                            >
                              {t('+ Grounding (Advisory)', '+ গ্রাউন্ডিং (পরামর্শ)', lang)}
                            </button>
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '10px' }}>
                          <div>
                            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-slate-600)' }}>{t('Area or Equipment', 'যন্ত্রাংশ বা বিভাগ', lang)}</label>
                            <input
                              type="text"
                              placeholder="e.g. Tank 1-8 Nitrogen Blanketing Pressure"
                              value={newFindingFocus}
                              onChange={(e) => setNewFindingFocus(e.target.value)}
                              style={{ width: '100%', fontSize: '12px', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border-2)', marginTop: '2px' }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-slate-600)' }}>{t('Outcome', 'মূল্যায়ন ফলাফল', lang)}</label>
                            <select
                              value={newFindingStatus}
                              onChange={(e) => setNewFindingStatus(e.target.value as any)}
                              style={{ width: '100%', fontSize: '12px', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border-2)', marginTop: '2px' }}
                            >
                              <option value="passed">{t('Passed — Compliant', 'উত্তীর্ণ — সন্তোষজনক', lang)}</option>
                              <option value="observation">{t('Advisory — Follow-up note', 'পরামর্শ — অনুসরণ প্রয়োজন', lang)}</option>
                              <option value="critical">{t('Critical — Action required', 'জরুরি — ব্যবস্থা প্রয়োজন', lang)}</option>
                            </select>
                          </div>
                        </div>
                        <div style={{ marginBottom: '12px' }}>
                          <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-slate-600)' }}>{t('Observation Notes', 'পর্যবেক্ষণ বিবরণ', lang)}</label>
                          <textarea
                            rows={2}
                            placeholder="e.g. Pressure verified at 2.5 bar, nitrogen seal intact..."
                            value={newFindingObs}
                            onChange={(e) => setNewFindingObs(e.target.value)}
                            style={{ width: '100%', fontSize: '12px', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border-2)', marginTop: '2px' }}
                          />
                        </div>
                        <button
                          className="btn-primary"
                          style={{ fontSize: '11.5px', padding: '6px 14px' }}
                          onClick={handleAddInspectionFinding}
                        >
                          {t('Save Observation', 'সংরক্ষণ করুন', lang)}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <QrCode size={20} color="var(--brand-crimson)" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--brand-slate-900)' }}>
                    {t('Invite a Guest / Issue Gate Pass', 'অতিথি বা প্রতিনিধিদল পূর্ব-নিবন্ধন', lang)}
                  </h3>
                  <div style={{ fontSize: '11.5px', color: 'var(--brand-slate-500)', marginTop: '2px' }}>
                    {t('Creates a QR gate pass for security check-in and vehicle gate entry.', 'নিরাপত্তা গেট ও গাড়ি প্রবেশের জন্য কিউআর গেট পাস তৈরি হবে।', lang)}
                  </div>
                </div>
              </div>
              <button className="modal-close" onClick={() => setShowRegisterModal(false)}>×</button>
            </div>

            <form onSubmit={handleRegister}>
              <div className="modal-body">
                {/* Quick Fill Presets */}
                <div style={{ background: 'var(--surface-0)', border: '1px solid var(--brand-slate-200)', borderRadius: '8px', padding: '9px 12px', marginBottom: '14px' }}>
                  <div style={{ fontSize: '10.5px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--brand-slate-500)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span>{t('Fill with an example', 'উদাহরণ দিয়ে পূরণ করুন', lang)}</span>
                  </div>
                  <select
                    className="form-input"
                    value=""
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === 'rhd') {
                        setFormName('Engr. Kamrul Hasan');
                        setFormOrg('Roads & Highways Department (RHD)');
                        setFormDesignation('Superintending Engineer');
                        setFormCategory('govt');
                        setFormFacility('Keraniganj Bitumen Refinery');
                        setFormVehicle('DHAKA-METRO-GHA-15-4410');
                        setFormPhone('+880 1711-224488');
                        setFormPurpose('Bitumen 60/70 batch quality verification and laboratory witness test.');
                      } else if (v === 'vip') {
                        setFormName('Syed Mahbubur Rahman');
                        setFormOrg('Eastern Infrastructure & Asphalt Ltd.');
                        setFormDesignation('Managing Director');
                        setFormCategory('vip');
                        setFormFacility('Bashundhara Corporate HQ, Baridhara');
                        setFormVehicle('DHAKA-METRO-GA-39-8801');
                        setFormPhone('+880 1713-009911');
                        setFormPurpose('Annual bulk bitumen supply contract review with commercial leadership.');
                      } else if (v === 'vendor') {
                        setFormName('Tariqul Alam');
                        setFormOrg('Siemens Bangladesh Ltd.');
                        setFormDesignation('Lead Automation Specialist');
                        setFormCategory('vendor');
                        setFormFacility('Keraniganj Bitumen Refinery');
                        setFormVehicle('DHAKA-METRO-CHA-51-2109');
                        setFormPhone('+880 1819-554433');
                        setFormPurpose('PLC control panel diagnostics and scheduled instrumentation service.');
                      }
                    }}
                  >
                    <option value="">{t('Choose an example guest…', 'একটি উদাহরণ বেছে নিন…', lang)}</option>
                    <option value="rhd">{t('RHD Govt Engineer', 'সড়ক ও জনপথ প্রকৌশলী', lang)}</option>
                    <option value="vip">{t('VIP Commercial Client', 'ভিআইপি গ্রাহক', lang)}</option>
                    <option value="vendor">{t('Service Vendor', 'সার্ভিস ভেন্ডর', lang)}</option>
                  </select>
                </div>

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
                    <label>{t('Organization / Agency', 'সংস্থা বা প্রতিষ্ঠান', lang)} *</label>
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
                    <label>{t('Job Title / Role', 'দাপ্তরিক পদবি', lang)}</label>
                    <input
                      type="text"
                      placeholder="e.g. Executive Engineer / Technical Director"
                      value={formDesignation}
                      onChange={(e) => setFormDesignation(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>{t('Visitor Type', 'অতিথির শ্রেণি', lang)}</label>
                    <select value={formCategory} onChange={(e) => setFormCategory(e.target.value as any)}>
                      <option value="client">{t('Client / Contractor', 'গ্রাহক / ঠিকাদার', lang)}</option>
                      <option value="vip">{t('VIP Dignitary / Board Guest', 'ভিআইপি অতিথি', lang)}</option>
                      <option value="govt">{t('Government Inspector', 'সরকারি পরিদর্শক', lang)}</option>
                      <option value="vendor">{t('Technical Vendor / Specialist', 'কারিগরি ভেন্ডর / বিশেষজ্ঞ', lang)}</option>
                      <option value="regular">{t('General Visitor / Meeting', 'সাধারণ অতিথি / সভা', lang)}</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>{t('Site to Visit', 'পরিদর্শনের শাখা', lang)}</label>
                    <select value={formFacility} onChange={(e) => setFormFacility(e.target.value as any)}>
                      <option value="Bashundhara Corporate HQ, Baridhara">Bashundhara Corporate HQ, Baridhara</option>
                      <option value="Keraniganj Bitumen Refinery">Keraniganj Bitumen Refinery</option>
                      <option value="Chittagong Patenga Terminal">Chittagong Patenga Terminal</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>{t('Host Employee', 'স্বাগতিক কর্মকর্তা', lang)}</label>
                    <input type="text" value={`${currentUserName} (${currentUserDept})`} readOnly />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>{t('Vehicle Plate (optional)', 'গাড়ির নম্বরপ্লেট (ঐচ্ছিক)', lang)}</label>
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

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>{t('Purpose of Visit', 'পরিদর্শনের দাপ্তরিক উদ্দেশ্য', lang)} *</label>
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
                  {t('Issue Gate Pass', 'গেট পাস ইস্যু করুন', lang)}
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
            <div className="modal-hd" style={{ background: 'var(--surface-inverse)', color: 'var(--text-on-brand)' }}>
              <div>
                <h3 style={{ color: 'var(--text-on-brand)', margin: 0 }}>
                  {t('Official Gate Security Visitor Badge Slip', 'অফিসিয়াল গেট সিকিউরিটি ভিজিটর ব্যাজ', lang)}
                </h3>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Pass ID: {selectedVisitor.id}</div>
              </div>
              <button className="modal-close" style={{ color: 'var(--text-on-brand)' }} onClick={() => setShowGatePassModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <div style={{ border: '2px solid var(--border-strong)', padding: '18px', borderRadius: '8px', background: 'var(--surface-1)' }}>
                <div style={{ textAlign: 'center', borderBottom: '2px solid var(--border-strong)', paddingBottom: '10px', marginBottom: '14px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 900, color: 'var(--brand-crimson)' }}>
                    BASHUNDHARA OIL AND GAS COMPANY LIMITED
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>Corporate Security & Refinery Gate Control Division</div>
                  <div style={{ fontSize: '12px', fontWeight: 900, marginTop: '4px', letterSpacing: '1px' }}>
                    OFFICIAL VISITOR PASS · {selectedVisitor.category.toUpperCase()} CLEARANCE
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text-1)' }}>
                      {selectedVisitor.name}
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-2)' }}>
                      {selectedVisitor.designation} · {selectedVisitor.organization}
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-3)', marginTop: '6px' }}>
                      Host Officer: <strong>{selectedVisitor.hostEmployee}</strong> ({selectedVisitor.hostDept})
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-3)' }}>
                      Security Badge Number: <strong style={{ fontFamily: 'monospace', color: 'var(--status-info)' }}>{selectedVisitor.badgeNo || 'BDG-01'}</strong>
                    </div>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <QrCode size={70} color="var(--text-1)" />
                    <div style={{ fontSize: '10px', fontFamily: 'monospace', fontWeight: 700, marginTop: '2px' }}>
                      {selectedVisitor.id}
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-1)', paddingTop: '10px', fontSize: '11.5px', color: 'var(--text-2)' }}>
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
      {showMusterModal && (() => {
        const insideVisitors = visitors.filter(v => v.status === 'checked_in');
        const safeCount = insideVisitors.filter(v => v.isEvacuatedSafe).length;
        const totalInside = insideVisitors.length;
        const isAllSafe = totalInside > 0 && safeCount === totalInside;

        return (
          <div className="modal-bg" onClick={() => setShowMusterModal(false)}>
            <div className="modal" style={{ maxWidth: '820px' }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-hd" style={{ background: 'var(--status-danger-solid-dark)', color: 'var(--text-on-brand)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Users size={22} color="var(--text-on-brand)" />
                  <div>
                    <h3 style={{ color: 'var(--text-on-brand)', margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {t('Emergency Evacuation Muster List (HSE Roll-Call)', 'জরুরি ইভাকুয়েশন মাস্টার রোল-কল তালিকা', lang)}
                      <span style={{ fontSize: '11px', background: isAllSafe ? 'var(--status-success-solid)' : 'var(--status-danger-solid)', color: 'var(--text-on-brand)', padding: '2px 8px', borderRadius: '12px', fontWeight: 800 }}>
                        {safeCount} / {totalInside} {t('Accounted Safe', 'নিরাপদ চিহ্নিত', lang)}
                      </span>
                    </h3>
                    <div style={{ fontSize: '11px', color: 'var(--status-danger-bright)', marginTop: '2px' }}>
                      Live count of all {totalInside} external visitors currently logged inside refinery/HQ gates
                    </div>
                  </div>
                </div>
                <button className="modal-close" style={{ color: 'var(--text-on-brand)' }} onClick={() => setShowMusterModal(false)}>×</button>
              </div>

              <div className="modal-body">
                {/* Emergency Control Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--status-danger-bg)', border: '1px solid var(--status-danger-border)', padding: '12px 16px', borderRadius: '8px', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--status-danger-text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <AlertTriangle size={15} />
                      {t('Muster Point: Evacuation Assembly Point #3 (Main Security Gate Ground)', 'মাস্টার পয়েন্ট: ইভাকুয়েশন অ্যাসেম্বলি পয়েন্ট ৩ (প্রধান নিরাপত্তা গেট প্রাঙ্গণ)', lang)}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--status-danger-text)', marginTop: '2px' }}>
                      Safety wardens must tick off each visitor upon physical verification at muster point.
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn-outline"
                      style={{ background: 'var(--status-success-bg)', borderColor: 'var(--status-success)', color: 'var(--status-success-text)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 12px', fontWeight: 700, cursor: 'pointer', borderRadius: '6px' }}
                      onClick={handleMarkAllEvacuatedSafe}
                    >
                      <CheckCircle2 size={14} />
                      {t('Mark All Safe at Muster Point', 'সবাইকে নিরাপদ চিহ্নিত করুন', lang)}
                    </button>
                    <button
                      type="button"
                      className="btn-primary"
                      style={{ background: 'var(--status-danger-solid)', color: 'var(--text-on-brand)', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}
                      onClick={handleBroadcastEvacuationAlert}
                    >
                      <Radio size={14} />
                      {t('Broadcast Siren SMS Alert', 'সাইরেন এসএমএস ব্রডকাস্ট করুন', lang)}
                    </button>
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="fleet-table">
                    <thead>
                      <tr>
                        <th>Guest Name & Org</th>
                        <th>Facility & Location</th>
                        <th>Host Officer</th>
                        <th>Emergency Contact</th>
                        <th style={{ textAlign: 'center' }}>Roll-Call Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {insideVisitors.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: 'var(--brand-slate-500)' }}>
                            No external visitors currently logged inside.
                          </td>
                        </tr>
                      ) : (
                        insideVisitors.map(v => (
                          <tr key={v.id} style={{ background: v.isEvacuatedSafe ? 'var(--status-success-bg)' : 'inherit' }}>
                            <td>
                              <strong>{v.name}</strong>
                              <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)' }}>{v.organization}</div>
                            </td>
                            <td>
                              <span className="badge info">{v.facility.split(',')[0]}</span>
                              {v.executiveSuite && (
                                <div style={{ fontSize: '10.5px', color: 'var(--status-purple)', marginTop: '2px' }}>{v.executiveSuite}</div>
                              )}
                            </td>
                            <td>
                              <div>{v.hostEmployee}</div>
                              <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-500)' }}>{v.hostDept}</div>
                            </td>
                            <td>
                              <a href={`tel:${v.phone}`} style={{ fontWeight: 600, color: 'var(--status-info)', textDecoration: 'none' }}>{v.phone}</a>
                              {v.emergencyContact && (
                                <div style={{ fontSize: '10px', color: 'var(--status-danger)' }}>{v.emergencyContact}</div>
                              )}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <button
                                style={{
                                  border: 'none',
                                  borderRadius: '20px',
                                  padding: '5px 12px',
                                  fontSize: '11.5px',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  background: v.isEvacuatedSafe ? 'var(--status-success-bg)' : 'var(--status-danger-bg)',
                                  color: v.isEvacuatedSafe ? 'var(--status-success-text)' : 'var(--status-danger-text)',
                                  boxShadow: v.isEvacuatedSafe ? '0 1px 3px rgba(34,197,94,0.2)' : '0 1px 3px rgba(239,68,68,0.2)',
                                  transition: 'all 0.15s ease'
                                }}
                                onClick={() => handleToggleEvacuated(v.id)}
                              >
                                {v.isEvacuatedSafe ? (
                                  <>
                                    <CheckCircle2 size={13} color="var(--status-success-text)" />
                                    {t('Safe at Muster Point', 'নিরাপদ চিহ্নিত', lang)}
                                  </>
                                ) : (
                                  <>
                                    <AlertTriangle size={13} color="var(--status-danger-text)" />
                                    {t('Unaccounted (Mark Safe)', 'অনুপস্থিত (নিরাপদ করুন)', lang)}
                                  </>
                                )}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="modal-ft" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '11.5px', color: isAllSafe ? 'var(--status-success-text)' : 'var(--status-danger-text)', fontWeight: 700 }}>
                  {isAllSafe
                    ? t('All visitors on site are accounted for at Assembly Point #3.', 'সকল অতিথি অ্যাসেম্বলি পয়েন্ট ৩-এ নিরাপদ চিহ্নিত হয়েছেন।', lang)
                    : t(`${totalInside - safeCount} visitor(s) still awaiting physical roll-call verification.`, `${totalInside - safeCount} জন অতিথির উপস্থিতি যাচাই বাকি।`, lang)
                  }
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn-sm-ghost" onClick={() => setShowMusterModal(false)}>{t('Close', 'বন্ধ করুন', lang)}</button>
                  <button
                    className="btn-primary"
                    style={{ background: 'var(--status-danger-solid-dark)' }}
                    onClick={() => {
                      showToast(t('Evacuation roll-call sheet downloaded.', 'ইভাকুয়েশন মাস্টার শিট ডাউনলোড সম্পন্ন।', lang), 'success');
                      setShowMusterModal(false);
                    }}
                  >
                    <Download size={14} />
                    {t('Export Roll-Call PDF', 'মাস্টার শিট ডাউনলোড', lang)}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ALPR Camera & Gate Scanner Simulator Modal */}
      {showALPRModal && (
        <div className="modal-bg" onClick={() => setShowALPRModal(false)}>
          <div className="modal" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-hd" style={{ background: 'var(--surface-inverse)', color: 'var(--text-on-brand)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Car size={18} color="var(--status-info-bright)" />
                <h3 style={{ color: 'var(--text-on-brand)', margin: 0 }}>
                  {t('Vehicle gate', 'গাড়ি গেট', lang)}
                </h3>
              </div>
              <button className="modal-close" style={{ color: 'var(--text-on-brand)' }} onClick={() => setShowALPRModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <div style={{ fontSize: '12px', color: 'var(--text-3)', marginBottom: '10px' }}>
                {t('Vehicles registered on today’s passes. Check the plate, then raise the barrier.', 'আজকের পাসে নিবন্ধিত গাড়ি। প্লেট মিলিয়ে বেরিয়ার খুলুন।', lang)}
              </div>
              {(() => {
                const expected = visitors.filter(v => (v.status === 'pre_registered' || v.status === 'checked_in') && v.vehiclePlate && !/pedestrian/i.test(v.vehiclePlate));
                if (expected.length === 0) {
                  return <div style={{ padding: '18px', textAlign: 'center', color: 'var(--text-3)' }}>{t('No vehicles expected.', 'কোনো গাড়ি প্রত্যাশিত নয়।', lang)}</div>;
                }
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {expected.map(v => (
                      <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', border: '1px solid var(--border-1)', borderRadius: '8px', padding: '10px 12px', background: 'var(--surface-0)' }}>
                        <div>
                          <div style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--text-1)' }}>{v.vehiclePlate}</div>
                          <div style={{ fontSize: '11.5px', color: 'var(--text-3)' }}>{v.name} · {v.organization} · {v.status === 'checked_in' ? t('On site', 'সাইটে', lang) : t('Expected', 'প্রত্যাশিত', lang)}</div>
                        </div>
                        <button className="btn-gold" style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }} onClick={handleSimulateBarrier}>
                          <Car size={14} />
                          {t('Raise barrier', 'বেরিয়ার খুলুন', lang)}
                        </button>
                      </div>
                    ))}
                  </div>
                );
              })()}
              <div style={{ marginTop: '12px', fontSize: '12px', fontWeight: 800, color: barrierOpen ? 'var(--status-success)' : 'var(--text-3)' }}>
                {barrierOpen ? t('Barrier open', 'বেরিয়ার খোলা', lang) : t('Barrier closed', 'বেরিয়ার বন্ধ', lang)}
              </div>
            </div>

            <div className="modal-ft">
              <button className="btn-sm-ghost" onClick={() => setShowALPRModal(false)}>{t('Close', 'বন্ধ করুন', lang)}</button>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Channel Digital Pass Dispatch Modal */}
      {showSMSModal && selectedVisitor && (
        <div className="modal-bg" onClick={() => setShowSMSModal(false)}>
          <div className="modal" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-hd" style={{ background: 'var(--surface-inverse)', color: 'var(--text-on-brand)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Share2 size={18} color="var(--status-info-bright)" />
                <h3 style={{ color: 'var(--text-on-brand)', margin: 0, fontSize: '15px' }}>
                  {t('Dispatch Digital QR Pass to Guest', 'অতিথির মোবাইলে ডিজিটাল কিউআর পাস প্রেরণ', lang)}
                </h3>
              </div>
              <button className="modal-close" style={{ color: 'var(--text-on-brand)' }} onClick={() => setShowSMSModal(false)}>×</button>
            </div>

            <div className="modal-body">
              {/* Channel Selector Tabs */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', background: 'var(--surface-2)', padding: '4px', borderRadius: '8px' }}>
                <button
                  type="button"
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px 10px',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: dispatchChannel === 'whatsapp' ? 'var(--brand-whatsapp)' : 'transparent',
                    color: dispatchChannel === 'whatsapp' ? 'var(--text-on-brand)' : 'var(--text-2)',
                    boxShadow: dispatchChannel === 'whatsapp' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                  onClick={() => setDispatchChannel('whatsapp')}
                >
                  <MessageCircle size={14} />
                  WhatsApp
                </button>
                <button
                  type="button"
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px 10px',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: dispatchChannel === 'sms' ? 'var(--status-info-solid)' : 'transparent',
                    color: dispatchChannel === 'sms' ? 'var(--text-on-brand)' : 'var(--text-2)',
                    boxShadow: dispatchChannel === 'sms' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                  onClick={() => setDispatchChannel('sms')}
                >
                  <Smartphone size={14} />
                  SMS Direct
                </button>
                <button
                  type="button"
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px 10px',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: dispatchChannel === 'email' ? 'var(--status-purple-solid)' : 'transparent',
                    color: dispatchChannel === 'email' ? 'var(--text-on-brand)' : 'var(--text-2)',
                    boxShadow: dispatchChannel === 'email' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                  onClick={() => setDispatchChannel('email')}
                >
                  <Mail size={14} />
                  Secure Email
                </button>
              </div>

              {/* Channel-Specific Preview */}
              {dispatchChannel === 'whatsapp' && (
                <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border-1)', borderRadius: '10px', padding: '14px', position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--status-teal-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-on-brand)', fontSize: '11px', fontWeight: 800 }}>
                      BOG
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--status-teal-text)' }}>Bashundhara Oil & Gas Visitor Desk</div>
                      <div style={{ fontSize: '10px', color: 'var(--status-teal-text)' }}>Official Verified Business Account</div>
                    </div>
                  </div>

                  <div style={{ background: 'var(--status-teal-bg)', border: '1px solid var(--status-success-border)', borderRadius: '8px', padding: '12px', fontSize: '12px', color: 'var(--status-teal-text)', lineHeight: 1.55 }}>
                    <p style={{ margin: '0 0 6px 0' }}>
                      <strong>Official Visitor Pass — Bashundhara Oil & Gas Co. Ltd.</strong>
                    </p>
                    <p style={{ margin: '0 0 4px 0' }}>Dear <strong>{selectedVisitor.name}</strong> ({selectedVisitor.organization}),</p>
                    <p style={{ margin: '0 0 6px 0' }}>Your gate pass for <strong>{selectedVisitor.facility}</strong> is confirmed.</p>
                    <div style={{ background: 'rgba(255,255,255,0.7)', padding: '8px 10px', borderRadius: '6px', fontSize: '11px', margin: '8px 0', fontFamily: 'monospace' }}>
                      <div>PASS ID: <strong>{selectedVisitor.id}</strong></div>
                      <div>PARKING: <strong>{selectedVisitor.parkingBay || 'Visitor Parking Bay'}</strong></div>
                      <div>HOST: <strong>{selectedVisitor.escortOfficer || selectedVisitor.hostEmployee}</strong></div>
                    </div>
                    <p style={{ margin: '0', fontSize: '11px', color: 'var(--status-info)' }}>
                      Open your QR pass to show at the gate: <br />
                      <span style={{ textDecoration: 'underline' }}>https://oneops.bashundhara.com/pass/{selectedVisitor.id}</span>
                    </p>
                  </div>
                </div>
              )}

              {dispatchChannel === 'sms' && (
                <div style={{ background: 'var(--surface-0)', border: '1px solid var(--border-1)', borderRadius: '10px', padding: '14px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: '8px' }}>
                    Telco Route: BOGCL-SMS-GATEWAY · Recipient: <strong>{selectedVisitor.phone}</strong>
                  </div>
                  <div style={{ background: 'var(--status-info-bg)', border: '1px solid var(--status-info-border)', borderRadius: '8px', padding: '12px', fontSize: '12px', color: 'var(--status-info)', lineHeight: 1.5 }}>
                    [BASHUNDHARA OIL & GAS] Gate Pass confirmed for {selectedVisitor.name}. Pass ID: {selectedVisitor.id}. Host: {selectedVisitor.hostEmployee}. Show this SMS/QR at Gate 1: https://oneops.bashundhara.com/pass/{selectedVisitor.id}
                  </div>
                </div>
              )}

              {dispatchChannel === 'email' && (
                <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border-1)', borderRadius: '10px', padding: '14px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: '8px' }}>
                    Subject: <strong>Official Security Gate Clearance · Pass ID {selectedVisitor.id}</strong>
                  </div>
                  <div style={{ border: '1px solid var(--border-1)', borderRadius: '6px', padding: '12px', fontSize: '11.5px', color: 'var(--text-2)', lineHeight: 1.5 }}>
                    <div style={{ fontWeight: 800, color: 'var(--brand-crimson)', marginBottom: '4px' }}>Bashundhara Oil & Gas Company Ltd.</div>
                    <div>Dear {selectedVisitor.name},</div>
                    <div style={{ marginTop: '4px' }}>Attached is your encrypted digital badge and refinery safety compliance dossier. Please present your QR badge at the security turnstiles upon arrival.</div>
                    <div style={{ marginTop: '8px', fontSize: '10.5px', color: 'var(--text-3)' }}>To: {selectedVisitor.email || `${selectedVisitor.name.toLowerCase().replace(/\s+/g, '.')}@partner.com`}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-ft">
              <button className="btn-sm-ghost" onClick={() => setShowSMSModal(false)}>{t('Cancel', 'বাতিল', lang)}</button>
              <button
                className="btn-primary"
                style={{
                  background: dispatchChannel === 'whatsapp' ? 'var(--brand-whatsapp)' : dispatchChannel === 'sms' ? 'var(--status-info-solid)' : 'var(--status-purple-solid)',
                  color: 'var(--text-on-brand)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onClick={() => {
                  const channelName = dispatchChannel === 'whatsapp' ? 'WhatsApp' : dispatchChannel === 'sms' ? 'SMS' : 'Email';
                  showToast(t(`Digital QR Gate Pass dispatched via ${channelName} to ${selectedVisitor.name}!`, `ডিজিটাল পাস ${channelName}-এর মাধ্যমে পাঠানো হয়েছে!`, lang), 'success');
                  setShowSMSModal(false);
                }}
              >
                <Send size={14} />
                {t(`Dispatch Pass via ${dispatchChannel.toUpperCase()}`, `পাস প্রেরণ করুন`, lang)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fast QR Gate Scanner & ALPR Reader Simulator Modal */}
      {showScannerModal && (
        <div className="modal-bg" onClick={() => setShowScannerModal(false)}>
          <div className="modal" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-hd" style={{ background: 'var(--surface-inverse)', color: 'var(--text-on-brand)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Scan size={20} color="var(--status-info-bright)" />
                <div>
                  <h3 style={{ color: 'var(--text-on-brand)', margin: 0, fontSize: '15px' }}>
                    {t('Fast Optical QR Gate Scanner & ALPR Reader', 'দ্রুত অপটিক্যাল কিউআর স্ক্যানার ও বেরিয়ার সেন্সর', lang)}
                  </h3>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Automated terminal check-in · Direct sync with barrier access controller
                  </div>
                </div>
              </div>
              <button className="modal-close" style={{ color: 'var(--text-on-brand)' }} onClick={() => setShowScannerModal(false)}>×</button>
            </div>

            <div className="modal-body">
              {/* Camera Scanner Viewport */}
              <div style={{
                position: 'relative',
                background: 'var(--surface-inverse-deep)',
                border: '2px solid var(--border-inverse)',
                borderRadius: '10px',
                padding: '24px',
                color: 'var(--text-on-brand)',
                overflow: 'hidden'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', fontSize: '11px', color: 'var(--text-3)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Camera size={13} color="var(--status-info-bright)" />
                    {t('Main Gate QR Scanner', 'প্রধান গেট কিউআর স্ক্যানার', lang)}
                  </span>
                  <span style={{ color: 'var(--status-success)', fontWeight: 800 }}>● {t('Ready', 'প্রস্তুত', lang)}</span>
                </div>

                {/* Laser Reticle Frame */}
                <div style={{
                  position: 'relative',
                  border: '2px dashed var(--status-info)',
                  borderRadius: '12px',
                  height: '180px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'radial-gradient(ellipse at center, rgba(14, 165, 233, 0.12) 0%, rgba(2, 6, 23, 0.8) 100%)',
                  overflow: 'hidden'
                }}>
                  {/* Laser Scan Animation Line */}
                  <div style={{
                    position: 'absolute',
                    top: isScanningAnimation ? '85%' : '15%',
                    left: '5%',
                    right: '5%',
                    height: '3px',
                    background: 'linear-gradient(90deg, transparent, var(--status-success-solid), var(--status-success-bright), var(--status-success-solid), transparent)',
                    boxShadow: '0 0 12px var(--status-success), 0 0 24px var(--status-success-bright)',
                    transition: isScanningAnimation ? 'top 0.8s ease-in-out' : 'top 2s ease-in-out infinite alternate',
                    zIndex: 2
                  }} />

                  <QrCode size={70} color={isScanningAnimation ? 'var(--status-success-bright)' : 'var(--status-info-bright)'} style={{ opacity: 0.85, transition: 'all 0.3s' }} />
                  <div style={{ fontSize: '13px', fontWeight: 800, color: isScanningAnimation ? 'var(--status-success-bright)' : 'var(--text-inverse)', marginTop: '10px', letterSpacing: '0.5px' }}>
                    {isScanningAnimation ? t('Checking gate pass...', 'গেট পাস যাচাই করা হচ্ছে...', lang) : t('Aim camera at visitor QR pass', 'ভিজিটর কিউআর পাসের দিকে ক্যামেরা ধরুন', lang)}
                  </div>
                </div>

                {/* Visitor Selection for Quick Scan Simulation */}
                <div style={{ marginTop: '16px', background: 'var(--surface-inverse)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border-inverse-2)' }}>
                  <label style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 700 }}>
                    {t('Select Pre-Registered Visitor / Incoming Vehicle to Simulate Gate Arrival:', 'গেটে আগমনকারী ভিজিটর অথবা গাড়ি নির্বাচন করুন:', lang)}
                  </label>
                  <select
                    value={scannerTargetId}
                    onChange={(e) => setScannerTargetId(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'var(--surface-inverse-2)',
                      color: 'var(--text-inverse)',
                      border: '1px solid var(--border-inverse-2)',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      fontSize: '13px',
                      fontWeight: 600
                    }}
                  >
                    {visitors.map(v => (
                      <option key={v.id} value={v.id}>
                        [{v.status.toUpperCase()}] {v.name} · {v.organization} ({v.vehiclePlate || 'No Vehicle'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Target Visitor Info Preview */}
                {(() => {
                  const target = visitors.find(v => v.id === scannerTargetId);
                  if (!target) return null;
                  return (
                    <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', fontSize: '11px', background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '6px' }}>
                      <div>
                        <span style={{ color: 'var(--text-3)' }}>Category:</span>
                        <div style={{ fontWeight: 700, color: target.category === 'vip' ? 'var(--status-warning)' : target.category === 'govt' ? 'var(--status-info-bright)' : 'var(--text-inverse-2)' }}>
                          {target.vipTier || target.category.toUpperCase()}
                        </div>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-3)' }}>Vehicle Plate:</span>
                        <div style={{ fontWeight: 700, color: 'var(--status-info-bright)', fontFamily: 'monospace' }}>
                          {target.vehiclePlate || 'Pedestrian Entry'}
                        </div>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-3)' }}>Host Officer:</span>
                        <div style={{ fontWeight: 700, color: 'var(--text-inverse)' }}>{target.hostEmployee}</div>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-3)' }}>Status:</span>
                        <div style={{ fontWeight: 800, color: target.status === 'checked_in' ? 'var(--status-success-bright)' : 'var(--status-warning-bright)' }}>
                          {target.status.toUpperCase()}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="modal-ft" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '11.5px', color: 'var(--brand-slate-500)' }}>
                Boom Barrier #1 auto-triggers on valid cryptographic token match.
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn-sm-ghost" onClick={() => setShowScannerModal(false)}>{t('Cancel', 'বাতিল', lang)}</button>
                <button
                  className="btn-primary"
                  style={{ background: 'var(--status-info-solid)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}
                  disabled={isScanningAnimation}
                  onClick={() => handleExecuteQuickScan(scannerTargetId)}
                >
                  <Scan size={15} />
                  {isScanningAnimation ? t('Scanning & Authorizing...', 'যাচাই করা হচ্ছে...', lang) : t('Simulate QR Fast Scan & Open Barrier', 'কিউআর স্ক্যান ও বেরিয়ার উন্মুক্ত করুন', lang)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
