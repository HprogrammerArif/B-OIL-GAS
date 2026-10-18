import React, { useState } from 'react';
import { ViewProps, t } from '../types';
import { showToast } from '../App';
import {
  Package, CheckCircle, Clock, MapPin, QrCode, ShieldCheck,
  AlertTriangle, ArrowRight, UserCheck, Search, Plus, Lock,
  Camera, Printer, Key, Check, Eye, Download, ShieldAlert,
  FileText, ExternalLink, RefreshCw
} from 'lucide-react';

interface ParcelItem {
  id: string;
  trackingNo: string;
  sealNo: string;
  sender: string;
  senderDept: string;
  origin: string;
  receiver: string;
  receiverDept: string;
  destination: string;
  contents: string;
  urgency: 'critical' | 'high' | 'normal';
  currentStage: number; // 1 to 5
  lastUpdated: string;
  dispatchedBy: string;
  tamperStatus: 'secure' | 'inspected';
  deliveryOtp: string;
}

const INITIAL_PARCELS: ParcelItem[] = [
  {
    id: 'P-01',
    trackingNo: 'BOGCL-WB-2026-8812',
    sealNo: 'TAMPER-SEAL #BG-99412',
    sender: 'Farida Begum (CFO)',
    senderDept: 'Corporate Finance, Dhaka HQ',
    origin: 'Bashundhara Corporate HQ, Baridhara',
    receiver: 'Engr. Md. Harunur Rashid',
    receiverDept: 'Plant General Manager',
    destination: 'Keraniganj Bitumen Refinery Complex',
    contents: 'Original Bank L/C Guarantee & Customs Exemption Letter for Bitumen Chemical Batch',
    urgency: 'critical',
    currentStage: 3,
    lastUpdated: '17 Oct 2026, 03:15 PM',
    dispatchedBy: 'Md. Kamruzzaman (Admin)',
    tamperStatus: 'secure',
    deliveryOtp: '7482',
  },
  {
    id: 'P-02',
    trackingNo: 'BOGCL-WB-2026-8819',
    sealNo: 'TAMPER-SEAL #BG-99418',
    sender: 'Dr. Rafiqul Huq (QC Head)',
    senderDept: 'Central Quality Lab, Keraniganj',
    origin: 'Keraniganj Bitumen Plant',
    receiver: 'Director of Marketing & Sales',
    receiverDept: 'Corporate Head Office, Dhaka',
    destination: 'Dhaka Corporate HQ',
    contents: 'Certified Lab Test Reports (Ductility, Penetration Grade 60/70) for RHD Highway Tender',
    urgency: 'high',
    currentStage: 4,
    lastUpdated: '17 Oct 2026, 04:30 PM',
    dispatchedBy: 'Keraniganj Gate Post #1',
    tamperStatus: 'secure',
    deliveryOtp: '3914',
  },
  {
    id: 'P-03',
    trackingNo: 'BOGCL-WB-2026-8824',
    sealNo: 'TAMPER-SEAL #BG-99430',
    sender: 'Procurement Specialist',
    senderDept: 'Supply Chain Division',
    origin: 'Dhaka Corporate HQ',
    receiver: 'Instrument Engineer',
    receiverDept: 'Bitumen Unit-2 Maintenance',
    destination: 'Keraniganj Plant',
    contents: 'Emergency Siemens Micro-PLC Interface Card for Reactor Temperature Controller',
    urgency: 'critical',
    currentStage: 2,
    lastUpdated: '17 Oct 2026, 02:00 PM',
    dispatchedBy: 'Despatch Counter HQ',
    tamperStatus: 'secure',
    deliveryOtp: '5521',
  },
];

const STAGES = [
  { step: 1, label: 'Despatch Logged', labelBn: 'ডেসপ্যাচ এন্ট্রি', desc: 'Secure pouch sealed at HQ' },
  { step: 2, label: 'Driver Handover', labelBn: 'ড্রাইভার হস্তান্তর', desc: 'Handed to vehicle courier with OTP' },
  { step: 3, label: 'Transit Checkpoint', labelBn: 'ট্রানজিট চেকপয়েন্ট', desc: 'Babubazar / Postogola Toll Gate' },
  { step: 4, label: 'Plant Gate Inward', labelBn: 'প্ল্যান্ট গেট ইনওয়ার্ড', desc: 'Seal scanned by Plant Security' },
  { step: 5, label: 'Recipient Verified', labelBn: 'প্রাপকের নিকট হস্তান্তর', desc: 'Biometric / PIN confirmed' },
];

export default function ParcelView({ role, lang }: ViewProps) {
  const [parcels, setParcels] = useState<ParcelItem[]>(INITIAL_PARCELS);
  const [selectedParcel, setSelectedParcel] = useState<ParcelItem>(INITIAL_PARCELS[0]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [showNewModal, setShowNewModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showManifestModal, setShowManifestModal] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState('');

  // New parcel state
  const [newRecipient, setNewRecipient] = useState('');
  const [newContents, setNewContents] = useState('');
  const [newUrgency, setNewUrgency] = useState<'critical' | 'high' | 'normal'>('high');

  const advanceStage = (parcelId: string) => {
    if (selectedParcel.currentStage === 4) {
      // Step 5 requires OTP verification
      setShowOtpModal(true);
      return;
    }
    // Step 2, 3, 4 can use Scanner Handshake
    setShowScannerModal(true);
  };

  const confirmScannerHandshake = () => {
    setParcels(prev => prev.map(p => {
      if (p.id === selectedParcel.id && p.currentStage < 5) {
        const nextStage = p.currentStage + 1;
        const updated = { ...p, currentStage: nextStage, lastUpdated: '17 Oct 2026, Just Now' };
        setSelectedParcel(updated);
        return updated;
      }
      return p;
    }));
    setShowScannerModal(false);
    showToast(t('Barcode Seal scanned! Custody handshake confirmed in tamper-evident blockchain ledger.', 'বারকোড সিল স্ক্যান সম্পন্ন! কাস্টডি হ্যান্ডশেক অডিট লেজারে রেকর্ড হয়েছে।', lang), 'gold');
  };

  const confirmOtpDelivery = () => {
    if (enteredOtp !== selectedParcel.deliveryOtp && enteredOtp !== '1234') {
      showToast(t(`Invalid OTP. Please enter correct 4-digit PIN sent to ${selectedParcel.receiver}. Hint: ${selectedParcel.deliveryOtp}`, `ভুল ওটিপি কোড। অনুগ্রহ করে সঠিক ৪ ডিজিটের পিন লিখুন। হিন্ট: ${selectedParcel.deliveryOtp}`, lang), 'info');
      return;
    }
    setParcels(prev => prev.map(p => {
      if (p.id === selectedParcel.id) {
        const updated = { ...p, currentStage: 5, lastUpdated: '17 Oct 2026, Just Now' };
        setSelectedParcel(updated);
        return updated;
      }
      return p;
    }));
    setShowOtpModal(false);
    setEnteredOtp('');
    showToast(t(`Handover successful! Consignment ${selectedParcel.trackingNo} confirmed delivered to ${selectedParcel.receiver}.`, `হস্তান্তর সফল! পার্সেল সফলভাবে প্রাপকের নিকট হস্তান্তর করা হয়েছে।`, lang), 'success');
  };

  const handleReportTamper = () => {
    showToast(t('TAMPER ALERT FLAGGED! Chief Security Officer & Keraniganj Gate alerted immediately.', 'নিরাপত্তা সিল ত্রুটি অ্যালার্ট জারি! প্রধান নিরাপত্তা কর্মকর্তা ও প্ল্যান্ট গেটকে অবহিত করা হয়েছে।', lang), 'info');
  };

  const handleCreateParcel = () => {
    if (!newRecipient || !newContents) {
      showToast(t('Please complete recipient and contents fields.', 'অনুগ্রহ করে প্রাপক ও পণ্যের বিবরণ পূরণ করুন।', lang), 'info');
      return;
    }
    const created: ParcelItem = {
      id: `P-0${parcels.length + 1}`,
      trackingNo: `BOGCL-WB-2026-${8820 + parcels.length + 1}`,
      sealNo: `TAMPER-SEAL #BG-${Math.floor(10000 + Math.random() * 90000)}`,
      sender: 'Md. Kamruzzaman',
      senderDept: 'Corporate Despatch Desk',
      origin: 'Bashundhara Corporate HQ, Dhaka',
      receiver: newRecipient,
      receiverDept: 'Keraniganj Operations',
      destination: 'Keraniganj Bitumen Plant',
      contents: newContents,
      urgency: newUrgency,
      currentStage: 1,
      lastUpdated: 'Just Now',
      dispatchedBy: 'Despatch Counter Desk #2',
      tamperStatus: 'secure',
      deliveryOtp: String(Math.floor(1000 + Math.random() * 9000)),
    };
    setParcels([created, ...parcels]);
    setSelectedParcel(created);
    setShowNewModal(false);
    setNewRecipient('');
    setNewContents('');
    showToast(t(`New tamper-evident waybill created: ${created.trackingNo}`, `নতুন ওয়েবিল তৈরি সম্পন্ন: ${created.trackingNo}`, lang), 'success');
  };

  return (
    <div>
      {/* View Header */}
      <div className="flex-between mb-4">
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--brand-slate-900)' }}>
            {t('Inter-Office Parcel & Secure Waybill Tracker', 'আন্তঃঅফিস পার্সেল ও ওয়েবিল ট্র্যাকিং সিস্টেম', lang)}
          </h2>
          <p className="text-muted">
            {t('Tamper-Evident Chain of Custody between Dhaka HQ & Keraniganj Bitumen Refinery', 'ঢাকা সদর দপ্তর ও কেরানীগঞ্জ রিফাইনারির মধ্যে বারকোড নিরাপত্তা চেইন অব কাস্টডি', lang)}
          </p>
        </div>
        <div className="flex-gap">
          <button
            className="btn-primary"
            onClick={() => setShowNewModal(true)}
          >
            <Plus size={14} />
            {t('Register New Consignment', 'নতুন পার্সেল বুকিং', lang)}
          </button>
        </div>
      </div>

      {/* Selected Parcel Deep-Dive Card */}
      <div className="card mb-5">
        <div className="card-hd">
          <div className="card-hd-left">
            <div className="card-hd-icon"><Package size={18} /></div>
            <div>
              <div className="card-title">
                {selectedParcel.trackingNo} • {selectedParcel.sealNo}
              </div>
              <div className="card-subtitle">
                {t('Origin:', 'উৎস:', lang)} {selectedParcel.origin} ➔ {t('Destination:', 'গন্তব্য:', lang)} {selectedParcel.destination}
              </div>
            </div>
          </div>
          <div className="flex-gap">
            <button
              className="btn-sm-ghost"
              style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
              onClick={() => setShowManifestModal(true)}
            >
              <Printer size={12} />
              {t('Waybill Manifest', 'চালান স্লিপ', lang)}
            </button>
            <span className={`badge ${selectedParcel.urgency === 'critical' ? 'danger' : 'warn'}`}>
              {selectedParcel.urgency.toUpperCase()} PRIORITY
            </span>
            <button className="btn-outline-danger" onClick={handleReportTamper} style={{ fontSize: '11px', padding: '4px 8px' }}>
              <AlertTriangle size={12} />
              {t('Flag Broken Seal', 'সিল ত্রুটি রিপোর্ট', lang)}
            </button>
          </div>
        </div>

        <div className="card-body">
          {/* Visual 5-Stage Custody Timeline */}
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

          {/* Consignment Details Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', marginTop: '20px', background: 'var(--brand-slate-100)', padding: '16px 20px', borderRadius: 'var(--radius-md)' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--brand-slate-400)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {t('Consignment Description & Sealed Content', 'পার্সেলের বিবরণ ও বিষয়বস্তু', lang)}
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--brand-slate-900)', marginTop: '4px' }}>
                {selectedParcel.contents}
              </div>
              <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '12px' }}>
                <div>
                  <span style={{ color: 'var(--brand-slate-500)' }}>Sender: </span>
                  <strong>{selectedParcel.sender}</strong> ({selectedParcel.senderDept})
                </div>
                <div>
                  <span style={{ color: 'var(--brand-slate-500)' }}>Receiver: </span>
                  <strong>{selectedParcel.receiver}</strong> ({selectedParcel.receiverDept})
                </div>
              </div>
            </div>

            <div style={{ borderLeft: '1px solid var(--brand-slate-200)', paddingLeft: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)', marginBottom: '4px' }}>
                <strong>Security Seal Status:</strong> <span style={{ color: '#059669', fontWeight: 700 }}>✓ INTACT & VERIFIED</span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)', marginBottom: '12px' }}>
                <strong>Last Checkpoint:</strong> {selectedParcel.lastUpdated}
              </div>

              {selectedParcel.currentStage < 5 ? (
                <button
                  className="btn-primary"
                  style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '6px' }}
                  onClick={() => advanceStage(selectedParcel.id)}
                >
                  <UserCheck size={14} />
                  {selectedParcel.currentStage === 4 ? (
                    t('Verify Recipient OTP & Deliver', 'প্রাপকের ওটিপি যাচাই ও ডেলিভারি', lang)
                  ) : (
                    t(`Scan Seal & Advance to Stage ${selectedParcel.currentStage + 1}`, `সিল স্ক্যান ও পরবর্তী ধাপে স্থানান্তর (${selectedParcel.currentStage + 1})`, lang)
                  )}
                </button>
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

      {/* Parcels List Table */}
      <div className="card">
        <div className="card-hd">
          <div className="card-hd-left">
            <div className="card-hd-icon"><Lock size={18} /></div>
            <div>
              <div className="card-title">{t('All Active Waybills & Transit Manifests', 'চলমান সকল ওয়েবিল ও চালান তালিকা', lang)}</div>
              <div className="card-subtitle">{parcels.length} {t('Consignments Monitored Across Terminals', 'টি চালান নজরদারিতে আছে', lang)}</div>
            </div>
          </div>
        </div>

        <div className="card-body">
          <table className="fleet-table">
            <thead>
              <tr>
                <th>Tracking / Seal</th>
                <th>Sender (HQ / Plant)</th>
                <th>Recipient</th>
                <th>Content Description</th>
                <th>Current Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {parcels.map((p) => (
                <tr
                  key={p.id}
                  style={{ cursor: 'pointer', background: selectedParcel.id === p.id ? '#F8FAFC' : 'transparent' }}
                  onClick={() => setSelectedParcel(p)}
                >
                  <td>
                    <div style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--brand-slate-900)' }}>
                      {p.trackingNo}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--brand-slate-400)' }}>{p.sealNo}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{p.sender}</div>
                    <div style={{ fontSize: '11px', color: 'var(--brand-slate-400)' }}>{p.senderDept}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{p.receiver}</div>
                    <div style={{ fontSize: '11px', color: 'var(--brand-slate-400)' }}>{p.receiverDept}</div>
                  </td>
                  <td style={{ fontSize: '12px', maxWidth: '300px' }}>
                    {p.contents}
                  </td>
                  <td>
                    <span className={`badge ${p.currentStage === 5 ? 'success' : p.currentStage >= 3 ? 'meeting' : 'warn'}`}>
                      Stage {p.currentStage}/5 — {STAGES[p.currentStage - 1].label}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn-sm-ghost"
                      style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedParcel(p);
                        advanceStage(p.id);
                      }}
                    >
                      <UserCheck size={12} />
                      {p.currentStage === 4 ? 'OTP Verify' : 'Scan'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Barcode / RFID Tag Scanner Simulation Modal */}
      {showScannerModal && (
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
                  SHA-256 Checksum: <span style={{ fontFamily: 'monospace', color: '#059669' }}>9a8f...21b4 (VALID)</span>
                </div>
              </div>

              <div style={{ marginTop: '16px', fontSize: '12px', color: 'var(--brand-slate-600)', background: '#ECFDF5', padding: '10px 14px', borderRadius: '6px', border: '1px solid #A7F3D0' }}>
                ✓ Security seal barcode recognized. Geo-location verified at <strong>Babubazar Bridge Transit Post</strong>.
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

      {/* Recipient OTP Verification Modal */}
      {showOtpModal && (
        <div className="modal-bg" onClick={() => setShowOtpModal(false)}>
          <div className="modal" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-hd" style={{ background: '#059669', color: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Key size={18} color="#fff" />
                <h3 style={{ color: '#fff', margin: 0 }}>
                  {t('Recipient OTP Handover Verification', 'প্রাপকের ওটিপি যাচাই ও ডেলিভারি', lang)}
                </h3>
              </div>
              <button className="modal-close" style={{ color: '#fff' }} onClick={() => setShowOtpModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <div style={{ textAlign: 'center', padding: '10px 0 16px' }}>
                <div style={{ fontSize: '13px', color: 'var(--brand-slate-600)' }}>
                  A 4-digit security PIN was dispatched via SMS to <strong>{selectedParcel.receiver}</strong>.
                </div>
                <div style={{ fontSize: '11px', color: '#D97706', marginTop: '4px' }}>
                  (Testing Simulation Hint: <strong>{selectedParcel.deliveryOtp}</strong> or 1234)
                </div>
              </div>

              <div className="form-group" style={{ textAlign: 'center' }}>
                <label style={{ fontSize: '12px', fontWeight: 700 }}>{t('Enter 4-Digit Delivery PIN', '৪ ডিজিটের ডেলিভারি পিন লিখুন', lang)}</label>
                <input
                  type="text"
                  maxLength={4}
                  style={{
                    fontSize: '24px',
                    letterSpacing: '12px',
                    textAlign: 'center',
                    padding: '8px',
                    width: '180px',
                    margin: '6px auto 0',
                    fontWeight: 900
                  }}
                  value={enteredOtp}
                  onChange={(e) => setEnteredOtp(e.target.value)}
                  placeholder="••••"
                />
              </div>
            </div>

            <div className="modal-ft">
              <button className="btn-sm-ghost" onClick={() => setShowOtpModal(false)}>{t('Cancel', 'বাতিল', lang)}</button>
              <button className="btn-primary" onClick={confirmOtpDelivery}>
                <Check size={14} />
                {t('Confirm Delivery Handover', 'ডেলিভারি সম্পন্ন করুন', lang)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Waybill Manifest Modal */}
      {showManifestModal && (
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
                  <div style={{ fontSize: '14px', fontWeight: 900, color: 'var(--brand-crimson)' }}>
                    BASHUNDHARA OIL AND GAS COMPANY LIMITED
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>Corporate Dispatch & Secure Document Transit Desk</div>
                  <div style={{ fontSize: '12px', fontWeight: 800, marginTop: '4px' }}>WAYBILL & SECURITY CUSTODY CERTIFICATE</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '11.5px', marginBottom: '14px' }}>
                  <div><strong>Waybill No:</strong> {selectedParcel.trackingNo}</div>
                  <div><strong>Tamper Seal:</strong> {selectedParcel.sealNo}</div>
                  <div><strong>Origin:</strong> {selectedParcel.origin}</div>
                  <div><strong>Destination:</strong> {selectedParcel.destination}</div>
                  <div><strong>Sender:</strong> {selectedParcel.sender}</div>
                  <div><strong>Receiver:</strong> {selectedParcel.receiver}</div>
                </div>

                <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '10px', fontSize: '12px', marginBottom: '14px' }}>
                  <strong>Package Description:</strong> {selectedParcel.contents}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E2E8F0', paddingTop: '14px' }}>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>
                    Security Seal Barcode Verification:<br />
                    <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#0F172A' }}>*BOGCL-2026-WB*</span>
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

      {/* New Consignment Modal */}
      {showNewModal && (
        <div className="modal-bg" onClick={() => setShowNewModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-hd">
              <h3>
                <Package size={18} />
                {t('Dispatch New Tamper-Evident Consignment', 'নতুন পার্সেল ডেসপ্যাচ এন্ট্রি', lang)}
              </h3>
              <button className="modal-close" onClick={() => setShowNewModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>{t('Recipient Name & Designation', 'প্রাপকের নাম ও পদবি', lang)}</label>
                <input
                  type="text"
                  placeholder="e.g. Engr. Harunur Rashid (Plant GM)"
                  value={newRecipient}
                  onChange={(e) => setNewRecipient(e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>{t('Origin Facility', 'প্রেরক শাখা', lang)}</label>
                  <select defaultValue="Bashundhara Corporate HQ, Baridhara">
                    <option value="Bashundhara Corporate HQ, Baridhara">Bashundhara Corporate HQ, Baridhara</option>
                    <option value="Keraniganj Bitumen Plant">Keraniganj Bitumen Plant</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>{t('Destination Facility', 'গন্তব্য শাখা', lang)}</label>
                  <select defaultValue="Keraniganj Bitumen Refinery">
                    <option value="Keraniganj Bitumen Refinery">Keraniganj Bitumen Refinery</option>
                    <option value="Dhaka Corporate HQ">Dhaka Corporate HQ</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>{t('Priority / Security Level', 'নিরাপত্তা অগ্রাধিকার', lang)}</label>
                <select value={newUrgency} onChange={(e) => setNewUrgency(e.target.value as any)}>
                  <option value="critical">Critical / Confidential (Armed Courier & Biometric)</option>
                  <option value="high">High Priority (Same Day Transit)</option>
                  <option value="normal">Normal (Routine Inter-Office Courier)</option>
                </select>
              </div>

              <div className="form-group">
                <label>{t('Contents Description', 'পণ্যের বিবরণ ও নথি তালিকা', lang)}</label>
                <textarea
                  rows={3}
                  placeholder="Specify confidential documents, sample vials, or critical spare parts..."
                  value={newContents}
                  onChange={(e) => setNewContents(e.target.value)}
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
