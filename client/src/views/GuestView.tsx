import React, { useState } from 'react';
import { ViewProps, t } from '../types';
import { showToast } from '../App';
import {
  Users, UserCheck, ShieldAlert, QrCode, Plus, Search,
  CheckCircle, Clock, AlertTriangle, Building2, Crown,
  Download, Car, Shield, Phone, FileText, Check, X
} from 'lucide-react';

interface VisitorRecord {
  id: string;
  name: string;
  organization: string;
  designation: string;
  category: 'vip' | 'govt' | 'vendor' | 'regular';
  hostEmployee: string;
  hostDept: string;
  purpose: string;
  expectedDate: string;
  expectedTime: string;
  checkInTime?: string;
  checkOutTime?: string;
  status: 'pre_registered' | 'checked_in' | 'checked_out' | 'overdue';
  vehiclePlate?: string;
  badgeNo?: string;
  vipProtocol?: boolean;
  ndaSigned: boolean;
}

const INITIAL_VISITORS: VisitorRecord[] = [
  {
    id: 'VIS-2026-0811',
    name: 'Dr. Shahabuddin Ahmed',
    organization: 'Directorate of Explosives, Govt. of Bangladesh',
    designation: 'Chief Inspector of Explosives (Grade-1)',
    category: 'govt',
    hostEmployee: 'Engr. Md. Harunur Rashid',
    hostDept: 'Keraniganj Refinery',
    purpose: 'Statutory Annual Inspection of Bitumen Storage Spheres & Flare Stack',
    expectedDate: 'Today, 17 Oct',
    expectedTime: '10:30 AM',
    checkInTime: '10:28 AM',
    status: 'checked_in',
    vehiclePlate: 'DHAKA-METRO-GHA-11-9042',
    badgeNo: 'GOVT-04',
    vipProtocol: true,
    ndaSigned: true,
  },
  {
    id: 'VIS-2026-0812',
    name: 'Francois Dubois',
    organization: 'Axens Catalysts & Clean Fuels (France)',
    designation: 'Senior Technical Director, Hydroprocessing',
    category: 'vip',
    hostEmployee: 'Ahmed Akbar Sobhan',
    hostDept: "Chairman's Office",
    purpose: 'High-Level Technical Review for Euro-V Base Oil Expansion Plant',
    expectedDate: 'Today, 17 Oct',
    expectedTime: '02:30 PM',
    status: 'pre_registered',
    vehiclePlate: 'DHAKA-METRO-CHA-22-1001 (VIP Escort Pool)',
    badgeNo: 'VIP-01',
    vipProtocol: true,
    ndaSigned: true,
  },
  {
    id: 'VIS-2026-0810',
    name: 'Kazi Mahbub Alam',
    organization: 'BSTI Standards Directorate',
    designation: 'Senior Field Officer, Chemical Testing Division',
    category: 'govt',
    hostEmployee: 'Adv. Karim Molla',
    hostDept: 'Legal & Regulatory Compliance',
    purpose: 'Sample verification for VG-30 Paving Grade Bitumen certification',
    expectedDate: 'Today, 17 Oct',
    expectedTime: '09:00 AM',
    checkInTime: '09:05 AM',
    checkOutTime: '12:40 PM',
    status: 'checked_out',
    badgeNo: 'GOVT-02',
    ndaSigned: true,
  },
  {
    id: 'VIS-2026-0813',
    name: 'Enamul Haque',
    organization: 'Siemens Energy Bangladesh Ltd.',
    designation: 'Field Service Automation Engineer',
    category: 'vendor',
    hostEmployee: 'Engr. Tariq Ahmed',
    hostDept: 'Refinery Maintenance',
    purpose: 'SCADA PLC Unit 2 firmware diagnostics and safety loop checks',
    expectedDate: 'Today, 17 Oct',
    expectedTime: '11:15 AM',
    checkInTime: '11:12 AM',
    status: 'checked_in',
    vehiclePlate: 'DHAKA-METRO-KHA-55-4019',
    badgeNo: 'VND-18',
    ndaSigned: true,
  },
];

export default function GuestView({ role, lang }: ViewProps) {
  const [visitors, setVisitors] = useState<VisitorRecord[]>(INITIAL_VISITORS);
  const [selectedVisitor, setSelectedVisitor] = useState<VisitorRecord | null>(INITIAL_VISITORS[0]);
  const [activeTab, setActiveTab] = useState<'all' | 'checked_in' | 'vip' | 'govt' | 'register'>('all');
  
  // New Visitor Form State
  const [formName, setFormName] = useState('');
  const [formOrg, setFormOrg] = useState('');
  const [formCategory, setFormCategory] = useState<'vip' | 'govt' | 'vendor' | 'regular'>('regular');
  const [formHost, setFormHost] = useState('');
  const [formPurpose, setFormPurpose] = useState('');
  const [formVehicle, setFormVehicle] = useState('');
  const [formTime, setFormTime] = useState('02:00 PM');

  const filteredVisitors = visitors.filter(v => {
    if (activeTab === 'checked_in') return v.status === 'checked_in';
    if (activeTab === 'vip') return v.category === 'vip';
    if (activeTab === 'govt') return v.category === 'govt';
    return true;
  });

  const handleCheckIn = (id: string) => {
    setVisitors(prev => prev.map(v => {
      if (v.id === id) {
        return {
          ...v,
          status: 'checked_in',
          checkInTime: 'Just Now',
          badgeNo: `BDG-${Math.floor(100 + Math.random() * 900)}`
        };
      }
      return v;
    }));
    const target = visitors.find(v => v.id === id);
    if (target?.vipProtocol) {
      showToast(
        lang === 'en'
          ? `👑 VIP PROTOCOL TRIGGERED: ${target.name} has entered facility. Chairman's Office & Escort Officer notified.`
          : `👑 ভিআইপি প্রটোকল সক্রিয়: ${target.name} প্রবেশ করেছেন। চেয়ারম্যান কার্যালয়কে অবহিত করা হয়েছে।`,
        'success'
      );
    } else {
      showToast(lang === 'en' ? `Visitor ${target?.name} checked in successfully.` : `অতিথি চেক-ইন সম্পন্ন হয়েছে।`, 'success');
    }
  };

  const handleCheckOut = (id: string) => {
    setVisitors(prev => prev.map(v => v.id === id ? { ...v, status: 'checked_out', checkOutTime: 'Just Now' } : v));
    showToast(lang === 'en' ? `Visitor pass surrendered & checkout logged.` : `পাস জমা ও চেক-আউট সম্পন্ন হয়েছে।`, 'info');
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formOrg || !formPurpose) {
      showToast(lang === 'en' ? 'Please complete required fields.' : 'প্রয়োজনীয় তথ্য পূরণ করুন।', 'warn');
      return;
    }
    const newId = `VIS-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newVis: VisitorRecord = {
      id: newId,
      name: formName,
      organization: formOrg,
      designation: 'Representative',
      category: formCategory,
      hostEmployee: formHost || 'Operations Division',
      hostDept: 'Corporate Office',
      purpose: formPurpose,
      expectedDate: 'Today',
      expectedTime: formTime,
      status: 'pre_registered',
      vehiclePlate: formVehicle,
      vipProtocol: formCategory === 'vip' || formCategory === 'govt',
      ndaSigned: true,
    };
    setVisitors([newVis, ...visitors]);
    setSelectedVisitor(newVis);
    setActiveTab('all');
    setFormName('');
    setFormOrg('');
    setFormPurpose('');
    showToast(lang === 'en' ? `Visitor Pre-Registered with Digital QR Gate Pass: ${newId}` : `অতিথি ডিজিটাল কিউআর পাস তৈরি সম্পন্ন: ${newId}`, 'success');
  };

  const getCategoryBadge = (category: VisitorRecord['category']) => {
    switch (category) {
      case 'vip':
        return <span className="badge gold">👑 VIP Guest</span>;
      case 'govt':
        return <span className="badge danger">🏛️ Govt Inspector</span>;
      case 'vendor':
        return <span className="badge info">🔧 Technical Vendor</span>;
      case 'regular':
        return <span className="badge">Regular Visitor</span>;
    }
  };

  return (
    <div className="view-container">
      {/* Header */}
      <div className="section-header">
        <div>
          <h2 className="section-title">
            🎫 {t('Guest & VIP Protocol Management System', 'অতিথি ও ভিআইপি প্রটোকল ব্যবস্থাপনা পদ্ধতি', lang)}
          </h2>
          <p className="section-subtitle">
            {t(
              'Digital gate passes, government regulatory audit delegations, biometric safety briefings & Chairman VIP protocols.',
              'ডিজিটাল গেট পাস, সরকারি নিয়ন্ত্রক অডিট পরিদর্শন দল, বায়োমেট্রিক নিরাপত্তা ব্রিফিং এবং ভিআইপি প্রটোকল মনিটরিং।',
              lang
            )}
          </p>
        </div>
        <div className="btn-group">
          <button
            className={`btn-primary ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => setActiveTab('register')}
          >
            <Plus size={15} /> {t('Pre-Register Guest', 'অতিথি পূর্ব-নিবন্ধন', lang)}
          </button>
          <button
            className="btn-outline"
            onClick={() => showToast(t('Gate camera QR reader active.', 'গেট ক্যামেরা কিউআর রিডার সক্রিয়।', lang), 'info')}
          >
            <QrCode size={15} /> {t('Scan Pass at Gate', 'পাস স্ক্যান', lang)}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid mb-5">
        <div className="kpi-card">
          <div className="kpi-label">{t('Currently on Premises', 'বর্তমানে ক্যাম্পাসে উপস্থিত', lang)}</div>
          <div className="kpi-value text-emerald">
            {visitors.filter(v => v.status === 'checked_in').length} Guests
          </div>
          <div className="kpi-sub">Refinery & HQ Security perimeter</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">{t('VIP / Govt Inspections Today', 'আজকের ভিআইপি/সরকারি পরিদর্শন', lang)}</div>
          <div className="kpi-value text-crimson">
            {visitors.filter(v => v.category === 'vip' || v.category === 'govt').length} Delegations
          </div>
          <div className="kpi-sub">DoE & Axens France in schedule</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">{t('Safety Induction NDA', 'নিরাপত্তা চুক্তি (এনডিএ)', lang)}</div>
          <div className="kpi-value text-blue">100% Signed</div>
          <div className="kpi-sub">Mandatory refinery plant clearance</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">{t('Security Gate Protocol', 'নিরাপত্তা গেট প্রটোকল', lang)}</div>
          <div className="kpi-value">DEFCON Level 1</div>
          <div className="kpi-sub">Automated license plate recognition (ALPR)</div>
        </div>
      </div>

      {/* Tab Filter */}
      <div className="pill-tabs mb-4">
        <button className={`pill-tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
          {t('All Registrations', 'সকল নিবন্ধন', lang)} ({visitors.length})
        </button>
        <button className={`pill-tab ${activeTab === 'checked_in' ? 'active' : ''}`} onClick={() => setActiveTab('checked_in')}>
          🟢 {t('Currently Inside', 'বর্তমানে ভেতরে', lang)} ({visitors.filter(v => v.status === 'checked_in').length})
        </button>
        <button className={`pill-tab ${activeTab === 'vip' ? 'active' : ''}`} onClick={() => setActiveTab('vip')}>
          👑 {t('VIP Dignitaries', 'ভিআইপি সম্মানিত অতিথি', lang)}
        </button>
        <button className={`pill-tab ${activeTab === 'govt' ? 'active' : ''}`} onClick={() => setActiveTab('govt')}>
          🏛️ {t('Govt Regulatory Inspections', 'সরকারি নিয়ন্ত্রক পরিদর্শন', lang)}
        </button>
      </div>

      {activeTab === 'register' ? (
        <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div className="card-hd">
            <div className="card-hd-left">
              <div className="card-hd-icon">📝</div>
              <div>
                <div className="card-title">{t('Pre-Register Guest / Official Delegation', 'অতিথি বা প্রতিনিধিদল পূর্ব-নিবন্ধন', lang)}</div>
                <div className="card-subtitle">{t('Generates encrypted QR digital gate pass sent directly to visitor via SMS / Email', 'স্বয়ংক্রিয় এসএমএস/ইমেলের মাধ্যমে কিউআর গেট পাস প্রেরিত হবে', lang)}</div>
              </div>
            </div>
          </div>
          <div className="card-body">
            <form onSubmit={handleRegister}>
              <div className="responsive-col-2-eq" style={{ marginBottom: '16px' }}>
                <div>
                  <label className="form-label">{t('Full Name of Guest', 'অতিথির পূর্ণ নাম', lang)}</label>
                  <input
                    className="form-input"
                    placeholder="e.g. Dr. Mohammad Rafiqul Islam"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">{t('Organization / Government Agency', 'প্রতিষ্ঠান বা সরকারি সংস্থা', lang)}</label>
                  <input
                    className="form-input"
                    placeholder="e.g. Bangladesh Petroleum Corporation (BPC)"
                    value={formOrg}
                    onChange={(e) => setFormOrg(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="responsive-col-3" style={{ marginBottom: '16px' }}>
                <div>
                  <label className="form-label">{t('Guest Category', 'অতিথির শ্রেণি', lang)}</label>
                  <select
                    className="form-select"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                  >
                    <option value="regular">Regular Visitor / Business Meeting</option>
                    <option value="govt">🏛️ Government Regulatory Inspector</option>
                    <option value="vip">👑 VIP Dignitary / Board Guest</option>
                    <option value="vendor">🔧 Technical Vendor / Specialist</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">{t('Host Officer', 'স্বাগতিক কর্মকর্তা', lang)}</label>
                  <input
                    className="form-input"
                    placeholder="e.g. Engr. Harunur Rashid (Plant GM)"
                    value={formHost}
                    onChange={(e) => setFormHost(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">{t('Expected Arrival Time', 'প্রত্যাশিত আগমনের সময়', lang)}</label>
                  <input
                    className="form-input"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="responsive-col-2-eq" style={{ marginBottom: '20px' }}>
                <div>
                  <label className="form-label">{t('Official Purpose of Visit', 'পরিদর্শনের দাপ্তরিক উদ্দেশ্য', lang)}</label>
                  <input
                    className="form-input"
                    placeholder="e.g. Technical refinery audit and laboratory inspection"
                    value={formPurpose}
                    onChange={(e) => setFormPurpose(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">{t('Vehicle Plate Number (for ALPR barrier entry)', 'যানবাহনের নম্বরপ্লেট', lang)}</label>
                  <input
                    className="form-input"
                    placeholder="e.g. DHAKA-METRO-GHA-11-9042"
                    value={formVehicle}
                    onChange={(e) => setFormVehicle(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex-gap" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="btn-outline" onClick={() => setActiveTab('all')}>
                  {t('Cancel', 'বাতিল', lang)}
                </button>
                <button type="submit" className="btn-primary">
                  <QrCode size={15} /> {t('Issue Digital QR Pass', 'ডিজিটাল কিউআর পাস ইস্যু করুন', lang)}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div className="responsive-col-2">
          {/* Visitor Table */}
          <div className="card">
            <div className="card-hd">
              <div className="card-hd-left">
                <div className="card-hd-icon"><Users size={16} /></div>
                <div>
                  <div className="card-title">{t('Visitor Manifest & Access Log', 'অতিথি তালিকা ও প্রবেশ লগ', lang)}</div>
                  <div className="card-subtitle">{t('Real-time security gate telemetry & clearance', 'নিরাপত্তা গেটের লাইভ তথ্য ও অনুমোদন', lang)}</div>
                </div>
              </div>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t('Pass / Guest', 'পাস ও অতিথি', lang)}</th>
                      <th>{t('Category', 'শ্রেণি', lang)}</th>
                      <th>{t('Host & Purpose', 'স্বাগতিক ও উদ্দেশ্য', lang)}</th>
                      <th>{t('Timing', 'সময়', lang)}</th>
                      <th>{t('Status', 'অবস্থা', lang)}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVisitors.map(v => (
                      <tr
                        key={v.id}
                        onClick={() => setSelectedVisitor(v)}
                        style={{
                          cursor: 'pointer',
                          background: selectedVisitor?.id === v.id ? 'var(--brand-gold-glow, rgba(165,28,48,0.06))' : undefined,
                        }}
                      >
                        <td>
                          <div style={{ fontWeight: 600 }}>{v.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)' }}>{v.organization}</div>
                          <div style={{ fontSize: '10.5px', fontFamily: 'monospace', color: 'var(--brand-crimson)' }}>{v.id}</div>
                        </td>
                        <td>{getCategoryBadge(v.category)}</td>
                        <td>
                          <div style={{ fontSize: '12px', fontWeight: 500 }}>Host: {v.hostEmployee}</div>
                          <div style={{ fontSize: '11px', color: 'var(--brand-slate-400)', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {v.purpose}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: '12px' }}>{v.expectedDate}</div>
                          <div style={{ fontSize: '11px', color: 'var(--brand-slate-400)' }}>
                            {v.checkInTime ? `In: ${v.checkInTime}` : `Exp: ${v.expectedTime}`}
                          </div>
                        </td>
                        <td>
                          {v.status === 'checked_in' ? (
                            <span className="badge success">Inside Campus</span>
                          ) : v.status === 'pre_registered' ? (
                            <span className="badge info">Pre-Registered</span>
                          ) : (
                            <span className="badge">Checked Out</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Visitor Inspector & QR Pass */}
          {selectedVisitor && (
            <div className="card">
              <div className="card-hd">
                <div className="card-hd-left">
                  <div className="card-hd-icon">🪪</div>
                  <div>
                    <div className="card-title">{selectedVisitor.name}</div>
                    <div className="card-subtitle">{selectedVisitor.designation} · {selectedVisitor.organization}</div>
                  </div>
                </div>
                {getCategoryBadge(selectedVisitor.category)}
              </div>
              <div className="card-body">
                {/* QR Pass Card Preview */}
                <div style={{ background: '#0B132B', border: '1px solid #1E293B', color: '#fff', borderRadius: '12px', padding: '16px', marginBottom: '16px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#94A3B8' }}>BOGCL DIGITAL GATE PASS</div>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: '#F1F5F9', marginTop: '2px' }}>{selectedVisitor.name}</div>
                      <div style={{ fontSize: '11px', color: '#CBD5E1' }}>{selectedVisitor.organization}</div>
                    </div>
                    <div className="qr-box" style={{ background: '#fff', padding: '6px', borderRadius: '6px' }}>
                      <QrCode size={48} color="#000" />
                    </div>
                  </div>

                  <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
                    <div>
                      <div style={{ color: '#94A3B8' }}>Badge ID:</div>
                      <div style={{ fontWeight: 700, color: '#38BDF8' }}>{selectedVisitor.badgeNo || 'PENDING CHECK-IN'}</div>
                    </div>
                    <div>
                      <div style={{ color: '#94A3B8' }}>Gate Barrier:</div>
                      <div style={{ fontWeight: 700, color: '#4ADE80' }}>ALPR CLEAR</div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px', fontSize: '12.5px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--brand-border)' }}>
                    <span style={{ color: 'var(--brand-slate-500)' }}>Host Division:</span>
                    <strong>{selectedVisitor.hostEmployee} ({selectedVisitor.hostDept})</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--brand-border)' }}>
                    <span style={{ color: 'var(--brand-slate-500)' }}>Vehicle Entry:</span>
                    <code>{selectedVisitor.vehiclePlate || 'Pedestrian / Escort Car'}</code>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--brand-border)' }}>
                    <span style={{ color: 'var(--brand-slate-500)' }}>Safety Induction NDA:</span>
                    <span className="badge success">Verified & Signed</span>
                  </div>
                </div>

                {/* Gate Security Action Controls */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  {selectedVisitor.status === 'pre_registered' ? (
                    <button
                      className="btn-primary"
                      style={{ flex: 1, justifyContent: 'center' }}
                      onClick={() => handleCheckIn(selectedVisitor.id)}
                    >
                      <UserCheck size={16} /> {t('Check-In & Issue Badge', 'চেক-ইন ও ব্যাজ প্রদান', lang)}
                    </button>
                  ) : selectedVisitor.status === 'checked_in' ? (
                    <button
                      className="btn-outline-danger"
                      style={{ flex: 1, justifyContent: 'center' }}
                      onClick={() => handleCheckOut(selectedVisitor.id)}
                    >
                      <Clock size={16} /> {t('Check-Out & Surrender Pass', 'চেক-আউট ও পাস ফেরত', lang)}
                    </button>
                  ) : (
                    <button
                      className="btn-outline"
                      style={{ flex: 1, justifyContent: 'center' }}
                      disabled
                    >
                      <CheckCircle size={16} /> {t('Visit Completed', 'সাক্ষাৎ সম্পন্ন', lang)}
                    </button>
                  )}
                  <button
                    className="btn-outline"
                    onClick={() => showToast(t(`Printing official gate slip for ${selectedVisitor.name}...`, `গেট স্লিপ প্রিন্ট হচ্ছে...`, lang), 'info')}
                  >
                    <Download size={15} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
