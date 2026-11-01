import React, { useState, useMemo } from 'react';
import { ViewProps, t } from '../types';
import { showToast } from '../components/ToastManager';
import { useOperationsStore } from '../store/operationsStore';
import { useCurrentUser } from '../auth/session';
import { nextRef } from '../lib/refs';
import { today, nowTime } from '../lib/clock';
import {
  type ParcelMode, type ParcelAction, OTP_MAX_ATTEMPTS,
  parcelModeFor, parcelsVisibleTo, parcelActionFor, canRaiseIssue,
  isRecipient, isSender, newPin, custodyHash,
} from './parcel/config';
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
  /** Failed PIN entries; at OTP_MAX_ATTEMPTS the handover locks until the desk reissues. */
  otpAttempts?: number;
  chainOfCustody: CustodyLogEntry[];
  returnDetails?: ReturnDetails;
}


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

export default function ParcelView({ lang }: ViewProps) {
  const user = useCurrentUser();
  const mode: ParcelMode = user ? parcelModeFor(user) : 'personal';
  const currentUserName = user?.name ?? '';
  const currentUserDept = user?.dept ?? '';
  const isDesk = mode === 'desk';
  const canRegister = isDesk || mode === 'personal';

  const { parcels, setParcels } = useOperationsStore();
  const [activeTab, setActiveTab] = useState<'all' | 'inbound' | 'outbound' | 'transit' | 'delivered' | 'returned'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState<'all' | 'critical' | 'high' | 'normal'>('all');

  // Cockpit Internal View Switcher: 'map' | 'timeline' | 'details'
  const [cockpitView, setCockpitView] = useState<'map' | 'timeline' | 'details'>('map');
  const [mobileTab, setMobileTab] = useState<'feed' | 'tracker'>('feed');

  const [scopeMode, setScopeMode] = useState<'personal' | 'master'>(isDesk ? 'master' : 'personal');

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
  const scopedParcels = useMemo(
    () => (user ? parcelsVisibleTo(user, mode, parcels, scopeMode) : []),
    [user, mode, parcels, scopeMode],
  );

  const [selectedParcelId, setSelectedParcelId] = useState<string>('');

  const selectedParcel: ParcelItem | undefined = useMemo(
    () => scopedParcels.find(p => p.id === selectedParcelId) || scopedParcels[0],
    [selectedParcelId, scopedParcels],
  );
  const selectedAction: ParcelAction = selectedParcel && user ? parcelActionFor(selectedParcel, user, mode) : 'none';
  const iAmRecipient = !!(selectedParcel && user && isRecipient(selectedParcel, user));
  const iAmSender = !!(selectedParcel && user && isSender(selectedParcel, user));
  const canIssue = !!(selectedParcel && user && canRaiseIssue(selectedParcel, user, mode));

  // ─────────────────────────────────────────────────────────────────────────
  // Computed Statistics
  // ─────────────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const isMasterScope = isDesk && scopeMode === 'master';
    const pool = scopedParcels;
    const receivedAll = isMasterScope || !user ? pool : pool.filter(p => isRecipient(p, user));
    const receivedDelivered = receivedAll.filter(p => p.status === 'delivered');
    const receivedPending = receivedAll.filter(p => p.status !== 'delivered' && p.status !== 'returned');

    const sentAll = isMasterScope || !user ? pool : pool.filter(p => isSender(p, user));
    const sentDelivered = sentAll.filter(p => p.status === 'delivered');
    const sentInTransit = sentAll.filter(p => p.status === 'in_transit' || p.status === 'dispatched');

    const activeInTransit = pool.filter(p => p.status === 'in_transit' || p.status === 'at_gate');
    const actionRequired = pool.filter(p => (p.currentStage === 4 && p.status !== 'returned') || p.tamperStatus === 'flagged');
    const returnsAndIssues = pool.filter(p => p.status === 'returned' || p.tamperStatus === 'flagged');

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
  }, [scopedParcels, user, isDesk, scopeMode]);

  const displayedParcels = useMemo(() => {
    return scopedParcels.filter(p => {
      if (activeTab === 'inbound') {
        if (!user || !isRecipient(p, user)) return false;
      } else if (activeTab === 'outbound') {
        if (!user || !isSender(p, user)) return false;
      } else if (activeTab === 'transit') {
        if (p.status !== 'in_transit' && p.status !== 'at_gate') return false;
      } else if (activeTab === 'delivered') {
        if (p.status !== 'delivered') return false;
      } else if (activeTab === 'returned') {
        if (p.status !== 'returned' && p.tamperStatus !== 'flagged') return false;
      }

      if (urgencyFilter !== 'all' && p.urgency !== urgencyFilter) return false;

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
  }, [scopedParcels, activeTab, urgencyFilter, searchQuery, user]);

  // ─────────────────────────────────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────────────────────────────────

  const custodyStamp = () => `${today()}, ${nowTime()}`;

  const handleAdvanceStage = () => {
    if (!selectedParcel) return;
    if (selectedAction === 'verify_delivery' || selectedAction === 'verify_return') {
      setIsReturnOtpMode(selectedAction === 'verify_return');
      setEnteredOtp('');
      setShowOtpModal(true);
      return;
    }
    if (selectedAction === 'scan' || selectedAction === 'return_pickup') {
      setShowScannerModal(true);
    }
  };

  const confirmScannerHandshake = async () => {
    if (!selectedParcel || !user) return;
    const p = selectedParcel;
    const stamp = custodyStamp();

    if (selectedAction === 'return_pickup' && p.returnDetails) {
      const hash = await custodyHash(p, ['return_pickup', stamp, user.name]);
      setParcels(prev => prev.map(x => x.id !== p.id || !x.returnDetails ? x : {
        ...x,
        lastUpdated: stamp,
        eta: 'Returning to sender',
        returnDetails: { ...x.returnDetails, returnStage: 2 },
        chainOfCustody: [...x.chainOfCustody, {
          stage: x.currentStage,
          stageName: RETURN_STAGES[1].label,
          stageNameBn: RETURN_STAGES[1].labelBn,
          location: x.destination,
          timestamp: stamp,
          actor: user.name,
          actorRole: user.label,
          notes: `Return pouch ${x.returnDetails.returnTrackingNo} handed to courier; seal checked.`,
          securityHash: hash,
        }],
      }));
      setShowScannerModal(false);
      showToast(t('Return pouch handed to courier.', 'ফেরত পাউচ কুরিয়ারের কাছে হস্তান্তর হয়েছে।', lang), 'success');
      return;
    }

    if (selectedAction !== 'scan') return;
    const nextStage = p.currentStage + 1;
    const hash = await custodyHash(p, [`stage_${nextStage}`, stamp, user.name]);
    setParcels(prev => prev.map(x => {
      if (x.id !== p.id || x.currentStage >= 4 || x.status === 'returned') return x;
      const newLog: CustodyLogEntry = {
        stage: nextStage,
        stageName: STAGES[nextStage - 1].label,
        stageNameBn: STAGES[nextStage - 1].labelBn,
        location: nextStage === 4 ? x.destination : STAGES[nextStage - 1].desc,
        timestamp: stamp,
        actor: user.name,
        actorRole: user.label,
        notes: 'Seal number matched and intact at hand-off.',
        securityHash: hash,
      };
      return {
        ...x,
        currentStage: nextStage,
        status: nextStage === 4 ? 'at_gate' : 'in_transit',
        corridorProgressPercent: nextStage === 2 ? 35 : nextStage === 3 ? 65 : 88,
        lastUpdated: stamp,
        chainOfCustody: [...x.chainOfCustody, newLog],
      };
    }));
    setShowScannerModal(false);
    showToast(t(`Hand-off recorded: ${STAGES[nextStage - 1].label}.`, `হস্তান্তর রেকর্ড হয়েছে: ${STAGES[nextStage - 1].labelBn}।`, lang), 'success');
  };

  const recordFailedPin = (p: ParcelItem) => {
    const attempts = (p.otpAttempts ?? 0) + 1;
    setParcels(prev => prev.map(x => (x.id === p.id ? { ...x, otpAttempts: attempts } : x)));
    const left = OTP_MAX_ATTEMPTS - attempts;
    if (left <= 0) {
      setShowOtpModal(false);
      showToast(t('Too many wrong PINs. Handover locked — the parcel desk must reissue the PIN.', 'অনেকবার ভুল পিন। হস্তান্তর লক — পার্সেল ডেস্ককে নতুন পিন ইস্যু করতে হবে।', lang), 'danger');
    } else {
      showToast(t(`Incorrect PIN. ${left} attempt(s) left.`, `ভুল পিন। আর ${left} বার চেষ্টা করা যাবে।`, lang), 'info');
    }
  };

  const confirmOtpDelivery = async () => {
    if (!selectedParcel || !user) return;
    const p = selectedParcel;
    const pin = enteredOtp.trim();
    const stamp = custodyStamp();

    if (isReturnOtpMode) {
      if (selectedAction !== 'verify_return' || !p.returnDetails) return;
      if (pin !== p.returnDetails.returnOtp) { recordFailedPin(p); return; }
      const hash = await custodyHash(p, ['return_received', stamp, user.name]);
      setParcels(prev => prev.map(x => x.id !== p.id || !x.returnDetails ? x : {
        ...x,
        lastUpdated: stamp,
        corridorProgressPercent: 100,
        otpAttempts: 0,
        returnDetails: { ...x.returnDetails, returnStage: 3, resolvedAt: stamp },
        chainOfCustody: [...x.chainOfCustody, {
          stage: 5,
          stageName: 'Return to Sender Verified',
          stageNameBn: 'প্রেরকের নিকট ফেরত সম্পন্ন',
          location: x.origin,
          timestamp: stamp,
          actor: user.name,
          actorRole: user.label,
          notes: `Returned to ${x.sender}; sender's return PIN verified.`,
          securityHash: hash,
        }],
      }));
      setShowOtpModal(false);
      setEnteredOtp('');
      showToast(t(`Return ${p.returnDetails.returnTrackingNo} received back by the sender.`, 'ফেরত চালান প্রেরকের নিকট হস্তান্তর নিশ্চিত হয়েছে।', lang), 'success');
      return;
    }

    if (selectedAction !== 'verify_delivery') return;
    if (pin !== p.deliveryOtp) { recordFailedPin(p); return; }
    const hash = await custodyHash(p, ['delivered', stamp, user.name]);
    setParcels(prev => prev.map(x => x.id !== p.id ? x : {
      ...x,
      currentStage: 5,
      status: 'delivered',
      corridorProgressPercent: 100,
      lastUpdated: stamp,
      eta: `Delivered ${stamp}`,
      otpAttempts: 0,
      chainOfCustody: [...x.chainOfCustody, {
        stage: 5,
        stageName: 'Recipient Verified & Signed',
        stageNameBn: 'প্রাপকের নিকট হস্তান্তর সম্পন্ন',
        location: x.destination,
        timestamp: stamp,
        actor: user.name,
        actorRole: user.label,
        notes: `Handed to ${x.receiver}; recipient PIN verified.`,
        securityHash: hash,
      }],
    }));
    setShowOtpModal(false);
    setEnteredOtp('');
    showToast(t(`${p.trackingNo} delivered to ${p.receiver}.`, `${p.trackingNo} প্রাপকের নিকট হস্তান্তর সম্পন্ন।`, lang), 'success');
  };

  const handleReissuePin = () => {
    if (!selectedParcel || !isDesk) return;
    const pin = newPin();
    setParcels(prev => prev.map(x => {
      if (x.id !== selectedParcel.id) return x;
      if (x.status === 'returned' && x.returnDetails) {
        return { ...x, otpAttempts: 0, returnDetails: { ...x.returnDetails, returnOtp: pin } };
      }
      return { ...x, otpAttempts: 0, deliveryOtp: pin };
    }));
    const holder = selectedParcel.status === 'returned' ? selectedParcel.sender : selectedParcel.receiver;
    showToast(t(`New PIN sent to ${holder}.`, `${holder}-কে নতুন পিন পাঠানো হয়েছে।`, lang), 'success');
  };

  const handleInitiateReturn = () => {
    if (!selectedParcel || !canIssue) return;
    if (selectedParcel.status === 'returned') {
      showToast(t('This consignment is already being returned.', 'এই পার্সেলটি ইতোমধ্যে ফেরত প্রক্রিয়ায় আছে।', lang), 'info');
      return;
    }
    setReturnNotes('');
    setShowReturnModal(true);
  };

  const confirmReturnSubmission = async () => {
    if (!selectedParcel || !user || !canIssue) return;
    const p = selectedParcel;
    const stamp = custodyStamp();
    const rtoTrackingNo = nextRef('RET');

    const reasonLabels: Record<ReturnDetails['reason'], string> = {
      tamper_broken: 'Tamper Seal Compromised / Outer Pouch Severed',
      damaged_contents: 'Damaged Goods / Liquid Leakage Observed',
      wrong_documents: 'Mismatched Documents / Incorrect PO Version',
      recipient_refused: 'Recipient Refused Delivery / Unsanctioned Request',
      recipient_unavailable: 'Recipient Station Closed / Personnel Transferred',
    };

    const newReturn: ReturnDetails = {
      returnTrackingNo: rtoTrackingNo,
      initiatedAt: stamp,
      initiatedBy: user.name,
      reason: returnReason,
      reasonText: reasonLabels[returnReason],
      notes: returnNotes.trim() || 'Returned under the chain-of-custody discrepancy policy.',
      returnStage: 1,
      returnOtp: newPin(),
      courierName: returnCourierOption === 'immediate_courier' ? p.courier.name : 'Security quarantine store',
    };

    const hash = await custodyHash(p, ['return_initiated', stamp, user.name, returnReason]);
    const newLog: CustodyLogEntry = {
      stage: p.currentStage,
      stageName: 'Return to Origin (RTO) Initiated',
      stageNameBn: 'ফেরত চালান (RTO) নথিভুক্ত',
      location: p.destination,
      timestamp: stamp,
      actor: user.name,
      actorRole: user.label,
      notes: `Consignment rejected. Reason: ${reasonLabels[returnReason]}. Return waybill ${rtoTrackingNo}.`,
      securityHash: hash,
    };

    setParcels(prev => prev.map(x => x.id !== p.id ? x : {
      ...x,
      status: 'returned',
      tamperStatus: returnReason === 'tamper_broken' ? 'flagged' : 'inspected',
      lastUpdated: stamp,
      eta: 'Return pending pickup',
      otpAttempts: 0,
      returnDetails: newReturn,
      chainOfCustody: [...x.chainOfCustody, newLog],
    }));

    setShowReturnModal(false);
    showToast(t(`Return ${rtoTrackingNo} raised. ${p.sender} has been sent a return PIN.`, `ফেরত চালান ${rtoTrackingNo} নথিভুক্ত হয়েছে। প্রেরককে রিটার্ন পিন পাঠানো হয়েছে।`, lang), 'success');
  };

  const handleCopyLink = () => {
    if (!selectedParcel) return;
    navigator.clipboard?.writeText(selectedParcel.trackingNo);
    showToast(t(`Waybill number copied: ${selectedParcel.trackingNo}`, `ওয়েবিল নম্বর কপি হয়েছে: ${selectedParcel.trackingNo}`, lang), 'success');
  };

  const handleCreateParcel = async () => {
    if (!user || !canRegister) return;
    if (!newRecipient.trim() || !newContents.trim()) {
      showToast(t('Please complete recipient and contents fields.', 'অনুগ্রহ করে প্রাপক ও পণ্যের বিবরণ পূরণ করুন।', lang), 'info');
      return;
    }

    const stamp = custodyStamp();
    const trackingNo = nextRef('PKG');
    const sealNo = nextRef('SEAL', 5);
    const id = trackingNo;
    const draft: ParcelItem = {
      id,
      trackingNo,
      sealNo,
      sender: user.name,
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
      lastUpdated: stamp,
      eta: 'Awaiting courier pickup',
      corridorProgressPercent: 12,
      courier: {
        name: 'Unassigned',
        phone: '',
        vehicle: 'HQ despatch pool',
        avatarInitials: '—',
      },
      dispatchedBy: `${user.name} (${currentUserDept})`,
      tamperStatus: 'secure',
      deliveryOtp: newPin(),
      otpAttempts: 0,
      chainOfCustody: [],
    };
    const hash = await custodyHash(draft, ['logged', stamp, user.name, sealNo]);
    const created: ParcelItem = {
      ...draft,
      chainOfCustody: [{
        stage: 1,
        stageName: 'Despatch Logged',
        stageNameBn: 'ডেসপ্যাচ এন্ট্রি',
        location: newOrigin,
        timestamp: stamp,
        actor: user.name,
        actorRole: user.label,
        notes: `Tamper seal ${sealNo} applied at origin desk.`,
        securityHash: hash,
      }],
    };

    setParcels(prev => [created, ...prev]);
    setSelectedParcelId(created.id);
    setShowNewModal(false);
    setNewRecipient('');
    setNewContents('');
    showToast(t(`Waybill ${created.trackingNo} registered. ${created.receiver} will receive the delivery PIN.`, `ওয়েবিল ${created.trackingNo} নিবন্ধিত। প্রাপক ডেলিভারি পিন পাবেন।`, lang), 'success');
  };

  return (
    <div style={{ paddingBottom: '50px' }}>
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. TOP HEADER & INSTANT SEARCH HERO */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="flex-between mb-4" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-1)', margin: 0 }}>
              {isDesk
                ? t('Parcel Desk', 'পার্সেল ডেস্ক', lang)
                : mode === 'courier'
                ? t('My Deliveries', 'আমার ডেলিভারি', lang)
                : t('My Parcels', 'আমার পার্সেল', lang)}
            </h2>
          </div>
          <p className="text-muted" style={{ margin: '4px 0 0', fontSize: '12.5px' }}>
            {isDesk
              ? t('Sealed inter-office consignments, hand-offs and returns', 'সিলকৃত আন্তঃঅফিস পার্সেল, হস্তান্তর ও ফেরত', lang)
              : mode === 'courier'
              ? t('Pouches assigned to you — scan each hand-off and take the recipient’s PIN at delivery', 'আপনার বরাদ্দকৃত পাউচ — প্রতিটি হস্তান্তর স্ক্যান করুন ও ডেলিভারিতে প্রাপকের পিন নিন', lang)
              : t('Parcels you sent or are receiving', 'আপনার পাঠানো বা প্রাপ্য পার্সেল', lang)}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isDesk && (
            <div style={{ display: 'flex', background: 'var(--brand-slate-200)', borderRadius: '6px', padding: '2px' }}>
              <button
                className={`btn-sm-ghost ${scopeMode === 'personal' ? 'active' : ''}`}
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '4px 10px',
                  background: scopeMode === 'personal' ? 'var(--surface-1)' : 'transparent',
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
                  background: scopeMode === 'master' ? 'var(--surface-1)' : 'transparent',
                }}
                onClick={() => setScopeMode('master')}
              >
                {t('All consignments', 'সকল চালান', lang)}
              </button>
            </div>
          )}

          {canRegister && (
            <button
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
              onClick={() => setShowNewModal(true)}
            >
              <Plus size={15} />
              {t('Send a parcel', 'পার্সেল পাঠান', lang)}
            </button>
          )}
        </div>
      </div>

      {/* Quick Search & Instant Tracking Hero Bar */}
      <div
        style={{
          background: 'var(--surface-1)',
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
              {t('Quick:', 'দ্রুত:', lang)}
            </span>
            <button
              className={`parcel-quick-chip ${activeTab === 'delivered' ? 'active' : ''}`}
              onClick={() => setActiveTab(activeTab === 'delivered' ? 'all' : 'delivered')}
            >
              <Key size={12} color="var(--status-warning)" />
              {t('Awaiting PIN', 'পিনের অপেক্ষায়', lang)}
            </button>
            <button
              className={`parcel-quick-chip ${activeTab === 'transit' ? 'active' : ''}`}
              onClick={() => setActiveTab(activeTab === 'transit' ? 'all' : 'transit')}
            >
              <Truck size={12} color="var(--status-info)" />
              {t('In transit', 'পথে আছে', lang)}
            </button>
            <button
              className={`parcel-quick-chip ${activeTab === 'returned' ? 'active' : ''}`}
              onClick={() => setActiveTab(activeTab === 'returned' ? 'all' : 'returned')}
            >
              <RotateCcw size={12} color="var(--status-danger)" />
              {t('Returns', 'ফেরত', lang)}
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
            <div className="parcel-kpi-icon" style={{ background: 'var(--status-info-bg)', color: 'var(--status-info)' }}>
              <Inbox size={18} />
            </div>
            <span className="badge success" style={{ fontSize: '10px' }}>
              {stats.receivedDeliveredCount} {t('Delivered', 'গৃহীত', lang)}
            </span>
          </div>
          <div>
            <div className="parcel-kpi-val" style={{ color: 'var(--status-info-text)' }}>
              {stats.totalReceived}
            </div>
            <div className="parcel-kpi-title">
              {t('Parcels received', 'আসা পার্সেল', lang)}
            </div>
            <div className="parcel-kpi-sub">
              {stats.receivedPendingCount > 0 ? (
                <span style={{ color: 'var(--status-warning)', fontWeight: 600 }}>
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
            <div className="parcel-kpi-icon" style={{ background: 'var(--status-purple-bg)', color: 'var(--status-purple)' }}>
              <Send size={18} />
            </div>
            <span className="badge meeting" style={{ fontSize: '10px' }}>
              {stats.sentDeliveredCount} {t('Verified', 'গৃহীত', lang)}
            </span>
          </div>
          <div>
            <div className="parcel-kpi-val" style={{ color: 'var(--status-purple)' }}>
              {stats.totalSent}
            </div>
            <div className="parcel-kpi-title">
              {isDesk && scopeMode === 'master'
                ? t('Parcels sent', 'পাঠানো পার্সেল', lang)
                : t('Parcels sent by me', 'আমার পাঠানো পার্সেল', lang)}
            </div>
            <div className="parcel-kpi-sub">
              {stats.sentInTransitCount > 0 ? (
                <span style={{ color: 'var(--status-info)', fontWeight: 600 }}>
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
            <div className="parcel-kpi-icon" style={{ background: 'var(--status-warning-bg)', color: 'var(--status-warning)' }}>
              <Truck size={18} />
            </div>
            <span className="badge warn" style={{ fontSize: '10px' }}>
              {t('Moving', 'চলমান', lang)}
            </span>
          </div>
          <div>
            <div className="parcel-kpi-val" style={{ color: 'var(--status-warning-text)' }}>
              {stats.inTransitCount}
            </div>
            <div className="parcel-kpi-title">
              {t('Active In-Transit', 'বর্তমানে ট্রানজিটে আছে', lang)}
            </div>
            <div className="parcel-kpi-sub">
              {t('Updated at each scanned hand-off', 'প্রতিটি স্ক্যান করা হস্তান্তরে হালনাগাদ', lang)}
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
            <div className="parcel-kpi-icon" style={{ background: 'var(--status-success-bg)', color: 'var(--status-success)' }}>
              <Key size={18} />
            </div>
            <span className={`badge ${stats.actionRequiredCount > 0 ? 'danger' : 'success'}`} style={{ fontSize: '10px' }}>
              {stats.actionRequiredCount > 0 ? t('Action Needed', 'পদক্ষেপ প্রয়োজন', lang) : t('Clear', 'ক্লিয়ার', lang)}
            </span>
          </div>
          <div>
            <div className="parcel-kpi-val" style={{ color: 'var(--status-success)' }}>
              {stats.actionRequiredCount}
            </div>
            <div className="parcel-kpi-title">
              {t('Awaiting Handover / OTP', 'হস্তান্তর ও ওটিপি অপেক্ষমাণ', lang)}
            </div>
            <div className="parcel-kpi-sub">
              {stats.actionRequiredCount > 0 ? (
                <span style={{ color: 'var(--status-danger)', fontWeight: 700 }}>
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
            <div className="parcel-kpi-icon" style={{ background: 'var(--status-danger-bg)', color: 'var(--status-danger)' }}>
              <RotateCcw size={18} />
            </div>
            <span className={`badge ${stats.returnsCount > 0 ? 'danger' : 'neutral'}`} style={{ fontSize: '10px' }}>
              {stats.returnsCount} {t('RTO Cases', 'রিটার্ন কেস', lang)}
            </span>
          </div>
          <div>
            <div className="parcel-kpi-val" style={{ color: 'var(--status-danger)' }}>
              {stats.returnsCount}
            </div>
            <div className="parcel-kpi-title">
              {t('Returns & Issues (RTO)', 'ফেরত ও ত্রুটি (আরটিও)', lang)}
            </div>
            <div className="parcel-kpi-sub">
              {stats.returnsCount > 0 ? (
                <span style={{ color: 'var(--status-danger-text)', fontWeight: 600 }}>
                  ● {t('Reverse custody tracked', 'রিভার্স কাস্টডি ট্র্যাকিং', lang)}
                </span>
              ) : (
                t('No return issues', 'কোনো রিটার্ন সমস্যা নেই', lang)
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile View Segmented Switcher (Feed vs Tracker) ── */}
      <div className="mobile-view-toggle parcel-mobile-view-toggle">
        <button
          type="button"
          className={mobileTab === 'feed' ? 'active' : ''}
          onClick={() => setMobileTab('feed')}
        >
          <Package size={14} />
          <span>{t('Consignment Feed', 'চালান তালিকা', lang)} ({displayedParcels.length})</span>
        </button>
        <button
          type="button"
          className={mobileTab === 'tracker' ? 'active' : ''}
          onClick={() => setMobileTab('tracker')}
        >
          <Truck size={14} />
          <span>{t('Active Tracker & PIN', 'লাইভ ট্র্যাকার ও পিন', lang)}</span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3. PRACTICAL TWO-COLUMN MODERN COCKPIT WORKSPACE */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="parcel-two-col-layout">
        {/* ── LEFT COLUMN: MY CONSIGNMENTS FEED ── */}
        <div className={`parcel-feed-col ${mobileTab === 'tracker' ? 'mobile-hide' : ''}`}>
          {/* Feed Header with Pill Filters */}
          <div style={{ background: 'var(--surface-1)', border: '1px solid var(--brand-slate-200)', borderRadius: 'var(--radius-md)', padding: '14px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontWeight: 800, fontSize: '13px', color: 'var(--brand-slate-900)' }}>
                {t('Consignment Feed', 'চালান তালিকা', lang)} ({displayedParcels.length})
              </span>
              <span style={{ fontSize: '11px', color: 'var(--brand-slate-500)' }}>
                {isDesk && scopeMode === 'master' ? t('All consignments', 'সকল চালান', lang) : currentUserName}
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
                {t('Inward', 'আগত', lang)} ({stats.totalReceived})
              </button>
              <button
                className={`parcel-pill-tab ${activeTab === 'outbound' ? 'active' : ''}`}
                style={{ padding: '4px 10px', fontSize: '11px' }}
                onClick={() => setActiveTab('outbound')}
              >
                {t('Outward', 'প্রেরিত', lang)} ({stats.totalSent})
              </button>
              <button
                className={`parcel-pill-tab ${activeTab === 'transit' ? 'active' : ''}`}
                style={{ padding: '4px 10px', fontSize: '11px' }}
                onClick={() => setActiveTab('transit')}
              >
                {t('In transit', 'পথে', lang)} ({stats.inTransitCount})
              </button>
              <button
                className={`parcel-pill-tab ${activeTab === 'returned' ? 'active' : ''}`}
                style={{ padding: '4px 10px', fontSize: '11px', color: stats.returnsCount > 0 ? 'var(--status-danger)' : undefined }}
                onClick={() => setActiveTab('returned')}
              >
                {t('Returns', 'ফেরত', lang)} ({stats.returnsCount})
              </button>
            </div>
          </div>

          {/* Vertical Parcel Cards Feed */}
          <div className="parcel-feed-list">
            {displayedParcels.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', background: 'var(--surface-1)', borderRadius: 'var(--radius-md)', border: '1px solid var(--brand-slate-200)', color: 'var(--brand-slate-500)' }}>
                <Package size={28} style={{ opacity: 0.4, margin: '0 auto 8px' }} />
                <div style={{ fontWeight: 700, fontSize: '13px' }}>{t('No parcels here', 'কোনো পার্সেল নেই', lang)}</div>
                <div style={{ fontSize: '11px' }}>{t('Try another filter or clear the search.', 'অন্য ফিল্টার দিন বা সার্চ মুছুন।', lang)}</div>
              </div>
            ) : (
              displayedParcels.map((p) => {
                const isSelected = selectedParcel?.id === p.id;
                const isIncoming = !!user && isRecipient(p, user);
                const isReturned = p.status === 'returned';
                const isActionNeeded = !!user && (
                  (isIncoming && p.currentStage === 4 && !isReturned) ||
                  parcelActionFor(p, user, mode) !== 'none'
                );

                return (
                  <div
                    key={p.id}
                    className={`parcel-feed-card ${isSelected ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedParcelId(p.id);
                      setMobileTab('tracker');
                    }}
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
                            {t('Ready for PIN', 'পিনের জন্য প্রস্তুত', lang)}
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
                      <span style={{ color: isIncoming ? 'var(--status-info)' : 'var(--status-purple)', fontWeight: 700 }}>
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
        <div className={`parcel-tracker-col ${mobileTab === 'feed' ? 'mobile-hide' : ''}`}>
          {selectedParcel && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {/* Cockpit Hero Banner */}
              <div className="parcel-cockpit-hero">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', position: 'relative', zIndex: 2 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--status-info-bright)', fontWeight: 700 }}>
                        TAMPER-EVIDENT OFFICIAL WAYBILL
                      </span>
                      <span className="badge" style={{ background: 'rgba(255,255,255,0.15)', color: 'var(--text-on-brand)', fontSize: '10px' }}>
                        {selectedParcel.category.replace('_', ' ').toUpperCase()}
                      </span>
                      {selectedParcel.tamperStatus === 'flagged' && (
                        <span className="badge danger" style={{ fontSize: '10px' }}>
                          SEAL COMPROMISED
                        </span>
                      )}
                    </div>

                    <h1 style={{ fontSize: '26px', fontWeight: 900, color: 'var(--text-on-brand)', margin: '4px 0 2px', fontFamily: 'monospace' }}>
                      {selectedParcel.trackingNo}
                    </h1>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: 'var(--text-inverse-2)' }}>
                      <span>Seal: <strong>{selectedParcel.sealNo}</strong></span>
                      <span>•</span>
                      <span style={{ color: 'var(--status-success-bright)', fontWeight: 700 }}>✓ {t('Tamper-Check Validated', 'নিরাপত্তা সিল যাচাইকৃত', lang)}</span>
                    </div>
                  </div>

                  {/* Top Action Toolbar */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn-sm-ghost"
                      style={{ background: 'rgba(255,255,255,0.2)', color: 'var(--text-on-brand)', border: '1px solid rgba(255,255,255,0.35)', fontSize: '11.5px', fontWeight: 700 }}
                      onClick={() => setMobileTab('feed')}
                    >
                      ← {t('Back to List', 'তালিকায় ফিরুন', lang)}
                    </button>
                    <button
                      className="btn-sm-ghost"
                      style={{ background: 'rgba(255,255,255,0.12)', color: 'var(--text-on-brand)', border: '1px solid rgba(255,255,255,0.25)', fontSize: '11.5px' }}
                      onClick={handleCopyLink}
                    >
                      <Copy size={13} />
                      {t('Copy Link', 'লিংক কপি', lang)}
                    </button>
                    <button
                      className="btn-sm-ghost"
                      style={{ background: 'rgba(255,255,255,0.12)', color: 'var(--text-on-brand)', border: '1px solid rgba(255,255,255,0.25)', fontSize: '11.5px' }}
                      onClick={() => setShowManifestModal(true)}
                    >
                      <Printer size={13} />
                      {t('Waybill Manifest', 'চালান স্লিপ', lang)}
                    </button>
                    <button
                      className="btn-sm-ghost"
                      style={{ background: 'rgba(255,255,255,0.12)', color: 'var(--text-on-brand)', border: '1px solid rgba(255,255,255,0.25)', fontSize: '11.5px' }}
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
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--status-success-solid)', display: 'inline-block' }} />
                      <strong style={{ color: 'var(--text-inverse)' }}>
                        {selectedParcel.status === 'returned'
                          ? 'Return to Origin (RTO) in Progress'
                          : selectedParcel.currentStage === 5
                          ? 'Delivered & Biometrically Signed'
                          : selectedParcel.currentStage === 4
                          ? 'Arrived at Destination Station (Ready for Pickup)'
                          : 'In Active Vehicle Corridor Transit'}
                      </strong>
                    </div>
                    <div style={{ color: 'var(--status-info-bright)', fontWeight: 700 }}>
                      {selectedParcel.eta}
                    </div>
                  </div>

                  {/* Progress Line */}
                  <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.15)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${selectedParcel.corridorProgressPercent}%`,
                        height: '100%',
                        background: selectedParcel.status === 'returned' ? 'var(--status-danger-solid)' : 'linear-gradient(90deg, var(--status-success-solid), var(--status-info-bright))',
                        borderRadius: '4px',
                        transition: 'width 0.5s ease',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
                    <span>{selectedParcel.origin.split(',')[0]}</span>
                    <span>Toll Gate Postogola</span>
                    <span>{selectedParcel.destination.split(',')[0]}</span>
                  </div>
                </div>
              </div>

              {/* ── PIN for the person who holds it (recipient, or sender on a return) ── */}
              {((iAmRecipient && selectedParcel.status !== 'returned' && selectedParcel.currentStage === 4) ||
                (iAmSender && selectedParcel.status === 'returned' && selectedParcel.returnDetails?.returnStage === 2)) && (
                <div style={{ padding: '16px 22px', background: 'var(--status-success-bg)', borderBottom: '1px solid var(--status-success-border)' }}>
                  <div className="parcel-otp-callout">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--status-success-solid)', color: 'var(--text-on-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Key size={22} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--status-success-text)' }}>
                          {selectedParcel.status === 'returned'
                            ? t('Your parcel is on its way back', 'আপনার পার্সেল ফেরত আসছে', lang)
                            : t('Your parcel has arrived', 'আপনার পার্সেল পৌঁছেছে', lang)}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--status-success-text)', marginTop: '2px' }}>
                          {t('Give this PIN to the courier or reception only once the sealed pouch is in your hands.', 'সিলকৃত পাউচ হাতে পাওয়ার পরই কেবল কুরিয়ার বা রিসিপশনকে এই পিন দিন।', lang)}
                        </div>
                      </div>
                    </div>
                    <div style={{ background: 'var(--surface-1)', border: '2px dashed var(--status-success)', padding: '6px 16px', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', color: 'var(--status-success-text)', fontWeight: 700, textTransform: 'uppercase' }}>
                        {selectedParcel.status === 'returned' ? t('Return PIN', 'রিটার্ন পিন', lang) : t('Delivery PIN', 'ডেলিভারি পিন', lang)}
                      </div>
                      <div style={{ fontSize: '24px', fontWeight: 900, letterSpacing: '6px', color: 'var(--status-success-text)', fontFamily: 'monospace' }}>
                        {selectedParcel.status === 'returned' ? selectedParcel.returnDetails?.returnOtp : selectedParcel.deliveryOtp}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Next hand-off for the desk / assigned courier ── */}
              {selectedAction !== 'none' && (
                <div style={{ padding: '14px 22px', background: selectedAction === 'locked' ? 'var(--status-danger-bg)' : 'var(--status-info-bg)', borderBottom: '1px solid var(--border-1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ fontSize: '12.5px', color: selectedAction === 'locked' ? 'var(--status-danger-text)' : 'var(--status-info-text)' }}>
                      <strong>
                        {selectedAction === 'scan' && t(`Next: ${STAGES[selectedParcel.currentStage]?.label}`, `পরবর্তী: ${STAGES[selectedParcel.currentStage]?.labelBn}`, lang)}
                        {selectedAction === 'verify_delivery' && t(`Ask ${selectedParcel.receiver} for their delivery PIN`, `${selectedParcel.receiver}-এর কাছ থেকে ডেলিভারি পিন নিন`, lang)}
                        {selectedAction === 'return_pickup' && t('Return raised — hand the pouch to the return courier', 'ফেরত নথিভুক্ত — পাউচ ফেরত কুরিয়ারকে দিন', lang)}
                        {selectedAction === 'verify_return' && t(`Ask ${selectedParcel.sender} for their return PIN`, `${selectedParcel.sender}-এর কাছ থেকে রিটার্ন পিন নিন`, lang)}
                        {selectedAction === 'locked' && t(`Handover locked after ${OTP_MAX_ATTEMPTS} wrong PINs`, `${OTP_MAX_ATTEMPTS} বার ভুল পিনের পর হস্তান্তর লক`, lang)}
                      </strong>
                      {selectedAction === 'locked' && !isDesk && (
                        <div style={{ marginTop: '2px' }}>{t('Contact the parcel desk to reissue the PIN.', 'নতুন পিনের জন্য পার্সেল ডেস্কে যোগাযোগ করুন।', lang)}</div>
                      )}
                    </div>
                    {selectedAction === 'locked' ? (
                      isDesk && (
                        <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={handleReissuePin}>
                          <RefreshCw size={14} />
                          {t('Reissue PIN', 'নতুন পিন ইস্যু করুন', lang)}
                        </button>
                      )
                    ) : (
                      <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={handleAdvanceStage}>
                        {selectedAction === 'verify_delivery' || selectedAction === 'verify_return' ? <UserCheck size={14} /> : <QrCode size={14} />}
                        {selectedAction === 'verify_delivery' || selectedAction === 'verify_return'
                          ? t('Enter PIN', 'পিন লিখুন', lang)
                          : t('Scan seal', 'সিল স্ক্যান করুন', lang)}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* ── Return details ── */}
              {selectedParcel.status === 'returned' && selectedParcel.returnDetails && (
                <div style={{ padding: '14px 22px', background: 'var(--status-danger-bg)', borderBottom: '1px solid var(--status-danger-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ color: 'var(--status-danger)' }}><RotateCcw size={22} /></div>
                    <div>
                      <div style={{ fontWeight: 800, color: 'var(--status-danger-text)', fontSize: '13px' }}>
                        {t('Return', 'ফেরত', lang)} — {selectedParcel.returnDetails.returnTrackingNo} · {RETURN_STAGES[selectedParcel.returnDetails.returnStage - 1].label}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--status-danger-text)' }}>
                        <strong>{t('Reason', 'কারণ', lang)}:</strong> {selectedParcel.returnDetails.reasonText} • "{selectedParcel.returnDetails.notes}"
                      </div>
                    </div>
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
                    {t('Route', 'রুট', lang)}
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
                  {canIssue && selectedParcel.status !== 'returned' && selectedParcel.currentStage < 5 && (
                    <button
                      className="btn-sm-ghost"
                      style={{ color: 'var(--status-danger)', borderColor: 'var(--status-danger-bright)', background: 'var(--brand-crimson-soft)', fontSize: '11px' }}
                      onClick={handleInitiateReturn}
                    >
                      <RotateCcw size={12} />
                      {t('Report Issue / Return', 'সমস্যা / ফেরত পাঠান', lang)}
                    </button>
                  )}
                  {(canIssue || selectedAction !== 'none') && selectedParcel.tamperStatus !== 'flagged' && selectedParcel.currentStage < 5 && (
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
                          {selectedParcel.origin} ➔ {selectedParcel.destination}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>
                          {t('Progress from scanned hand-offs', 'স্ক্যান করা হস্তান্তর অনুযায়ী অগ্রগতি', lang)}
                        </div>
                      </div>
                      <span className={`badge ${selectedParcel.tamperStatus === 'flagged' ? 'danger' : 'success'}`} style={{ fontSize: '10.5px' }}>
                        ● {selectedParcel.tamperStatus === 'flagged' ? t('Seal flagged', 'সিল সন্দেহজনক', lang) : t('Seal intact', 'সিল অক্ষত', lang)}
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
                          <div style={{ background: 'var(--surface-inverse-2)', color: 'var(--text-on-brand)', fontSize: '9.5px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', marginTop: '4px', whiteSpace: 'nowrap' }}>
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
                    <div style={{ marginTop: '24px', background: 'var(--surface-1)', border: '1px solid var(--brand-slate-200)', borderRadius: 'var(--radius-md)', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--status-info-solid)', color: 'var(--text-on-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px' }}>
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
                              <div style={{ fontWeight: 800, fontSize: '13.5px', color: isCurrent ? 'var(--status-info)' : 'var(--brand-slate-900)' }}>
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
                    <div style={{ background: 'var(--surface-0)', border: '1px solid var(--brand-slate-200)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
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

                    <div style={{ background: 'var(--surface-0)', border: '1px solid var(--brand-slate-200)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
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

                    <div style={{ background: 'var(--surface-0)', border: '1px solid var(--brand-slate-200)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
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

                    <div style={{ background: 'var(--surface-0)', border: '1px solid var(--brand-slate-200)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
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
            <div className="modal-hd" style={{ background: 'var(--surface-inverse)', color: 'var(--text-on-brand)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Camera size={18} color="var(--status-warning-bright)" />
                <h3 style={{ color: 'var(--text-on-brand)', margin: 0 }}>
                  {t('Scan Tamper-Evident Security Seal', 'সিকিউরিটি সিল স্ক্যান করুন', lang)}
                </h3>
              </div>
              <button className="modal-close" style={{ color: 'var(--text-on-brand)' }} onClick={() => setShowScannerModal(false)}>×</button>
            </div>

            <div className="modal-body" style={{ textAlign: 'center' }}>
              <div style={{ border: '2px dashed var(--status-info)', borderRadius: '12px', padding: '24px 16px', background: 'var(--surface-0)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ width: '80%', height: '3px', background: 'var(--status-danger-solid)', margin: '0 auto 16px', boxShadow: '0 0 10px var(--status-danger)' }} />
                <QrCode size={90} color="var(--text-1)" style={{ margin: '0 auto 12px' }} />
                <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '14px', color: 'var(--text-1)' }}>
                  {selectedParcel.sealNo}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '4px' }}>
                  Waybill: <strong>{selectedParcel.trackingNo}</strong> • Security Seal: <span style={{ color: 'var(--status-success)', fontWeight: 700 }}>✓ Verified Intact</span>
                </div>
              </div>

              <div style={{ marginTop: '16px', fontSize: '12px', color: 'var(--brand-slate-600)', background: 'var(--status-success-bg)', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--status-success-border)', textAlign: 'left' }}>
                {selectedAction === 'return_pickup'
                  ? t('Seal number matches the waybill. Confirm the return pouch is handed to the courier.', 'সিল নম্বর ওয়েবিলের সাথে মিলেছে। ফেরত পাউচ কুরিয়ারকে দেওয়া হয়েছে নিশ্চিত করুন।', lang)
                  : t(`Seal number matches the waybill. Confirm to record: ${STAGES[selectedParcel.currentStage]?.label ?? ''}.`, `সিল নম্বর ওয়েবিলের সাথে মিলেছে। রেকর্ড করতে নিশ্চিত করুন: ${STAGES[selectedParcel.currentStage]?.labelBn ?? ''}।`, lang)}
              </div>
            </div>

            <div className="modal-ft">
              <button className="btn-sm-ghost" onClick={() => setShowScannerModal(false)}>{t('Cancel', 'বাতিল', lang)}</button>
              <button className="btn-gold" onClick={confirmScannerHandshake}>
                <Check size={14} />
                {t('Confirm hand-off', 'হস্তান্তর নিশ্চিত করুন', lang)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recipient / Return OTP Verification Modal */}
      {showOtpModal && selectedParcel && (
        <div className="modal-bg" onClick={() => setShowOtpModal(false)}>
          <div className="modal" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-hd" style={{ background: isReturnOtpMode ? 'var(--status-danger-solid)' : 'var(--status-success-solid)', color: 'var(--text-on-brand)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Key size={18} color="var(--text-on-brand)" />
                <h3 style={{ color: 'var(--text-on-brand)', margin: 0 }}>
                  {isReturnOtpMode
                    ? t('Sender Return Receipt PIN Verification', 'প্রেরকের রিটার্ন গ্রহণ পিন যাচাই', lang)
                    : t('Recipient OTP Handover Verification', 'প্রাপকের ওটিপি যাচাই ও ডেলিভারি', lang)}
                </h3>
              </div>
              <button className="modal-close" style={{ color: 'var(--text-on-brand)' }} onClick={() => setShowOtpModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <div style={{ textAlign: 'center', padding: '10px 0 16px' }}>
                <div style={{ fontSize: '13.5px', color: 'var(--brand-slate-700)', fontWeight: 600 }}>
                  {isReturnOtpMode
                    ? t(`Ask ${selectedParcel.sender} for the return PIN on their parcel screen.`, `${selectedParcel.sender}-এর পার্সেল স্ক্রিনে থাকা রিটার্ন পিন জিজ্ঞাসা করুন।`, lang)
                    : t(`Ask ${selectedParcel.receiver} for the delivery PIN on their parcel screen.`, `${selectedParcel.receiver}-এর পার্সেল স্ক্রিনে থাকা ডেলিভারি পিন জিজ্ঞাসা করুন।`, lang)}
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-3)', marginTop: '6px' }}>
                  {t(`${OTP_MAX_ATTEMPTS - (selectedParcel.otpAttempts ?? 0)} attempt(s) left before the handover locks.`, `হস্তান্তর লক হওয়ার আগে আর ${OTP_MAX_ATTEMPTS - (selectedParcel.otpAttempts ?? 0)} বার চেষ্টা করা যাবে।`, lang)}
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
                  inputMode="numeric"
                  value={enteredOtp}
                  onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
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
            <div className="modal-hd" style={{ background: 'var(--status-danger-solid-dark)', color: 'var(--text-on-brand)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RotateCcw size={18} color="var(--status-danger-bright)" />
                <h3 style={{ color: 'var(--text-on-brand)', margin: 0 }}>
                  {t('Initiate Return Consignment (RTO)', 'পার্সেল ফেরত প্রক্রিয়া (RTO) শুরু করুন', lang)}
                </h3>
              </div>
              <button className="modal-close" style={{ color: 'var(--text-on-brand)' }} onClick={() => setShowReturnModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <div style={{ background: 'var(--brand-crimson-soft)', border: '1px solid var(--status-danger-border)', borderRadius: '6px', padding: '12px 14px', marginBottom: '16px', fontSize: '12px' }}>
                <div style={{ fontWeight: 700, color: 'var(--status-danger-text)' }}>
                  Waybill: {selectedParcel.trackingNo} • Seal: {selectedParcel.sealNo}
                </div>
                <div style={{ color: 'var(--status-danger-text)', marginTop: '2px' }}>
                  {t('Original Sender:', 'মূল প্রেরক:', lang)} <strong>{selectedParcel.sender}</strong> ({selectedParcel.origin})
                </div>
                <div style={{ color: 'var(--status-danger-text)' }}>
                  {t('Package:', 'পণ্যের বিবরণ:', lang)} {selectedParcel.contents}
                </div>
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 700, fontSize: '12.5px' }}>
                  {t('Primary Reason for Rejection / Return', 'প্রত্যাখ্যান ও ফেরতের মূল কারণ', lang)} <span style={{ color: 'var(--status-danger)' }}>*</span>
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
                  {t('Physical Inspection Remarks & Discrepancy Notes', 'শারীরিক পরিদর্শন মন্তব্য ও বিস্তারিত বিবরণ', lang)} <span style={{ color: 'var(--status-danger)' }}>*</span>
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
                style={{ background: 'var(--status-danger-solid-dark)' }}
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
            <div className="modal-hd" style={{ background: 'var(--status-danger-solid-dark)', color: 'var(--text-on-brand)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={18} color="var(--status-danger-bright)" />
                <h3 style={{ color: 'var(--text-on-brand)', margin: 0 }}>
                  {t('Flag Broken Security Seal & Breach Incident', 'সিল ত্রুটি ও নিরাপত্তা লঙ্ঘন রিপোর্ট', lang)}
                </h3>
              </div>
              <button className="modal-close" style={{ color: 'var(--text-on-brand)' }} onClick={() => setShowTamperModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <div style={{ textAlign: 'center', padding: '10px 0 16px' }}>
                <AlertTriangle size={48} color="var(--status-danger)" style={{ margin: '0 auto 8px' }} />
                <div style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--status-danger-text)' }}>
                  SECURITY SEAL INTEGRITY BREACH
                </div>
                <div style={{ fontSize: '12px', color: 'var(--brand-slate-600)', marginTop: '4px' }}>
                  Waybill <strong>{selectedParcel.trackingNo}</strong> • Seal <strong>{selectedParcel.sealNo}</strong>
                </div>
              </div>

              <div style={{ background: 'var(--brand-crimson-soft)', padding: '12px 14px', borderRadius: '6px', fontSize: '12px', color: 'var(--status-danger-text)', marginBottom: '16px' }}>
                Flagging this consignment will automatically dispatch a priority alarm to:
                <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
                  <li>Chief Security Officer (CSO) HQ Desk</li>
                  <li>Keraniganj Bitumen Refinery Gate Post #1</li>
                  <li>Tamper investigation ledger</li>
                </ul>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  className="btn-primary"
                  style={{ background: 'var(--status-danger-solid)', justifyContent: 'center' }}
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
            <div className="modal-hd" style={{ background: 'var(--surface-inverse)', color: 'var(--text-on-brand)' }}>
              <div>
                <h3 style={{ color: 'var(--text-on-brand)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={18} color="var(--status-info-bright)" />
                  {t('Digital Chain-of-Custody Audit Ledger', 'ডিজিটাল কাস্টডি অডিট লেজার', lang)}
                </h3>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Waybill: <strong>{selectedParcel.trackingNo}</strong> • Seal: <strong>{selectedParcel.sealNo}</strong>
                </div>
              </div>
              <button className="modal-close" style={{ color: 'var(--text-on-brand)' }} onClick={() => setShowAuditModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <div style={{ background: 'var(--surface-0)', border: '1px solid var(--border-1)', padding: '12px 16px', borderRadius: '6px', marginBottom: '16px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div><strong>Origin:</strong> {selectedParcel.origin}</div>
                  <div><strong>Destination:</strong> {selectedParcel.destination}</div>
                  <div><strong>Security Level:</strong> {selectedParcel.urgency.toUpperCase()}</div>
                </div>
                <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--text-3)' }}>
                  {t('Digital Custody Verification:', 'ডিজিটাল কাস্টডি যাচাই:', lang)} <span style={{ color: 'var(--status-success)', fontWeight: 700 }}>● {t('Verified Intact', 'অক্ষত ও সুরক্ষিত', lang)}</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {selectedParcel.chainOfCustody.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-3)', fontSize: '12px' }}>
                    No historical logs recorded.
                  </div>
                ) : (
                  selectedParcel.chainOfCustody.map((log, index) => (
                    <div
                      key={index}
                      style={{
                        borderLeft: '3px solid var(--status-info)',
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
                        <div style={{ fontSize: '11.5px', color: 'var(--brand-slate-700)', background: 'var(--surface-2)', padding: '6px 10px', borderRadius: '4px', marginTop: '4px' }}>
                          "{log.notes}"
                        </div>
                      )}
                      {log.securityHash && (
                        <div style={{ fontSize: '10px', fontFamily: 'monospace', color: 'var(--text-3)', marginTop: '3px' }}>
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
            <div className="modal-hd" style={{ background: 'var(--surface-inverse-2)', color: 'var(--text-on-brand)' }}>
              <div>
                <h3 style={{ color: 'var(--text-on-brand)', margin: 0 }}>
                  {t('Official Inter-Office Consignment Manifest', 'অফিসিয়াল চালান স্লিপ ও ডেলিভারি চালান', lang)}
                </h3>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{selectedParcel.trackingNo}</div>
              </div>
              <button className="modal-close" style={{ color: 'var(--text-on-brand)' }} onClick={() => setShowManifestModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <div style={{ border: '2px solid var(--border-2)', padding: '18px', borderRadius: '4px', background: 'var(--surface-1)' }}>
                <div style={{ textAlign: 'center', borderBottom: '2px solid var(--border-strong)', paddingBottom: '12px', marginBottom: '14px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 900, color: 'var(--brand-crimson)' }}>
                    BASHUNDHARA OIL AND GAS COMPANY LIMITED
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>Corporate Dispatch & Secure Document Transit Desk</div>
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

                <div style={{ borderTop: '1px solid var(--border-1)', paddingTop: '10px', fontSize: '12px', marginBottom: '14px' }}>
                  <strong>Package Description:</strong> {selectedParcel.contents}
                  <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' }}>
                    Special Handling Instructions: <strong>{selectedParcel.specialHandling}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-1)', paddingTop: '14px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>
                    Security Seal Barcode Verification:<br />
                    <span style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--text-1)' }}>*{selectedParcel.trackingNo}*</span>
                    <div style={{ fontSize: '10px', marginTop: '2px' }}>BOGCL OneOps Automated Log: {selectedParcel.lastUpdated}</div>
                  </div>
                  <QrCode size={56} color="var(--text-1)" />
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
              <div style={{ background: 'var(--surface-0)', border: '1px solid var(--border-1)', padding: '10px 14px', borderRadius: '6px', marginBottom: '14px', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-3)' }}>{t('Consignment Originator (Sender):', 'প্রেরকের বিবরণ:', lang)} </span>
                <strong style={{ color: 'var(--brand-slate-900)' }}>{currentUserName}</strong>
                <span style={{ color: 'var(--text-3)' }}> ({currentUserDept})</span>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label>{t('Recipient Name & Officer', 'প্রাপকের নাম ও পদবি', lang)} <span style={{ color: 'var(--status-danger)' }}>*</span></label>
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
                    <option value="it_hardware">IT Hardware & Secure Keycards</option>
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
                <label>{t('Contents Description & Sealed Items', 'পণ্যের বিস্তারিত বিবরণ ও নথির তালিকা', lang)} <span style={{ color: 'var(--status-danger)' }}>*</span></label>
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
