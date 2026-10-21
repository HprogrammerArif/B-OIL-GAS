import React, { useState } from 'react';
import { ViewProps, t } from '../types';
import { showToast } from '../App';
import {
  Users, UserCheck, ShieldAlert, QrCode, Plus, Search,
  CheckCircle, Clock, AlertTriangle, Building2, Crown,
  Download, Car, Shield, Phone, FileText, Check, X,
  Printer, Smartphone, ShieldCheck, Send, Sparkles
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
  phone?: string;
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
    phone: '+880 1711-234567',
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
    phone: '+33 6 12 34 56 78',
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
    phone: '+880 1819-876543',
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
    phone: '+880 1912-345678',
  },
];

export default function GuestView({ role, lang }: ViewProps) {
  const [visitors, setVisitors] = useState<VisitorRecord[]>(INITIAL_VISITORS);
  const [selectedVisitor, setSelectedVisitor] = useState<VisitorRecord | null>(INITIAL_VISITORS[0]);
  const [activeTab, setActiveTab] = useState<'all' | 'checked_in' | 'vip' | 'govt'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showGatePassModal, setShowGatePassModal] = useState(false);
  
  // New Visitor Form State
  const [formName, setFormName] = useState('');
  const [formOrg, setFormOrg] = useState('');
  const [formCategory, setFormCategory] = useState<'vip' | 'govt' | 'vendor' | 'regular'>('vip');
  const [formHost, setFormHost] = useState('');
  const [formPurpose, setFormPurpose] = useState('');
  const [formVehicle, setFormVehicle] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formTime, setFormTime] = useState('02:30 PM');

  const filteredVisitors = visitors.filter(v => {
    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'checked_in' && v.status === 'checked_in') ||
      (activeTab === 'vip' && v.category === 'vip') ||
      (activeTab === 'govt' && v.category === 'govt');

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      v.name.toLowerCase().includes(q) ||
      v.organization.toLowerCase().includes(q) ||
      v.hostEmployee.toLowerCase().includes(q) ||
      v.id.toLowerCase().includes(q) ||
      (v.badgeNo && v.badgeNo.toLowerCase().includes(q));

    return matchesTab && matchesSearch;
  });

  const handleCheckIn = (id: string) => {
    setVisitors(prev => prev.map(v => {
      if (v.id === id) {
        return {
          ...v,
          status: 'checked_in',
          checkInTime: 'Just Now',
          badgeNo: v.category === 'vip' ? 'VIP-02' : v.category === 'govt' ? 'GOVT-05' : `BDG-${Math.floor(100 + Math.random() * 900)}`
        };
      }
      return v;
    }));
    const target = visitors.find(v => v.id === id);
    if (target?.vipProtocol || target?.category === 'vip' || target?.category === 'govt') {
      showToast(
        lang === 'en'
          ? `👑 VIP PROTOCOL ACTIVATED: ${target?.name} checked in. Escort vehicle & Chairman Secretariat alerted.`
          : `👑 ভিআইপি প্রটোকল সক্রিয়: ${target?.name} প্রবেশ করেছেন। চেয়ারম্যান সচিবালয়কে অবহিত করা হয়েছে।`,
        'gold'
      );
    } else {
      showToast(lang === 'en' ? `Visitor ${target?.name} checked in successfully.` : `অতিথি চেক-ইন সম্পন্ন হয়েছে।`, 'success');
    }
  };

  const handleCheckOut = (id: string) => {
    setVisitors(prev => prev.map(v => v.id === id ? { ...v, status: 'checked_out', checkOutTime: 'Just Now' } : v));
    showToast(lang === 'en' ? `Visitor pass surrendered & security checkout logged.` : `পাস জমা ও নিরাপত্তা চেক-আউট সম্পন্ন হয়েছে।`, 'info');
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
      designation: formCategory === 'vip' ? 'Honorary Dignitary' : formCategory === 'govt' ? 'Inspector' : 'Representative',
      category: formCategory,
      hostEmployee: formHost || 'Operations Division',
      hostDept: formCategory === 'vip' ? "Chairman's Secretariat" : 'Keraniganj Complex',
      purpose: formPurpose,
      expectedDate: 'Today',
      expectedTime: formTime,
      status: 'pre_registered',
      vehiclePlate: formVehicle || 'Pending Entry',
      phone: formPhone || '+880 1700-000000',
      vipProtocol: formCategory === 'vip' || formCategory === 'govt',
      ndaSigned: true,
      badgeNo: formCategory === 'vip' ? 'VIP-03' : undefined,
    };
    setVisitors([newVis, ...visitors]);
    setSelectedVisitor(newVis);
    setShowRegisterModal(false);
    setFormName('');
    setFormOrg('');
    setFormPurpose('');
    setFormVehicle('');
    setFormPhone('');
    showToast(
      lang === 'en'
        ? `Digital Gate Pass ${newId} issued for ${newVis.name}! Encrypted QR dispatched.`
        : `ডিজিটাল গেট পাস ${newId} সফলভাবে তৈরি হয়েছে!`,
      'success'
    );
  };

  const getCategoryBadge = (category: VisitorRecord['category']) => {
    switch (category) {
      case 'vip':
        return <span className="badge gold" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>👑 VIP Guest</span>;
      case 'govt':
        return <span className="badge danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>🏛️ Govt Inspector</span>;
      case 'vendor':
        return <span className="badge info" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>🔧 Technical Vendor</span>;
      case 'regular':
        return <span className="badge">Regular Visitor</span>;
    }
  };

  return (
    <div className="view-container page-enter-active">
      {/* ─── SLEEK MINIMAL HEADER & TOOLBAR ─── */}
      <div className="section-header" style={{ marginBottom: '16px', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '18px' }}>
            <span>🎫</span>
            <span>{t('Guest & VIP Protocol Management', 'অতিথি ও ভিআইপি প্রটোকল ব্যবস্থাপনা', lang)}</span>
          </h2>
          <p className="section-subtitle" style={{ margin: '3px 0 0', fontSize: '11.5px', color: 'var(--brand-slate-500)' }}>
            {t(
              'Digital QR gate passes, regulatory audit delegations & Chairman VIP escort protocols.',
              'ডিজিটাল কিউআর গেট পাস, সরকারি নিয়ন্ত্রক অডিট পরিদর্শন দল ও ভিআইপি প্রটোকল।',
              lang
            )}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            className="btn-outline"
            onClick={() => {
              showToast(
                t(
                  'Camera ALPR & QR Scanner Active. Gate barrier 1 ready.',
                  'গেট ক্যামেরা কিউআর রিডার ও নম্বরপ্লেট সেন্সর সক্রিয়।',
                  lang
                ),
                'info'
              );
            }}
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            <QrCode size={14} /> {t('Scan Pass at Gate', 'পাস স্ক্যান', lang)}
          </button>

          <button
            className="btn-primary"
            onClick={() => setShowRegisterModal(true)}
            style={{ fontSize: '12px', padding: '6px 14px', background: 'var(--brand-crimson)', color: '#fff', fontWeight: 700 }}
          >
            <Plus size={14} /> {t('Pre-Register Guest', 'অতিথি পূর্ব-নিবন্ধন', lang)}
          </button>
        </div>
      </div>

      {/* ─── EXECUTIVE KPI STATS STRIP ─── */}
      <div className="stats-grid mb-4">
        {/* Card 1: Currently Inside */}
        <div className="stat-card green">
          <div className="stat-top">
            <span className="stat-label">{t('Currently on Premises', 'বর্তমানে ক্যাম্পাসে উপস্থিত', lang)}</span>
            <div className="stat-icon-wrap" style={{ background: '#ECFDF5', color: '#059669' }}>
              <UserCheck size={16} />
            </div>
          </div>
          <div className="stat-value" style={{ color: '#059669' }}>
            {visitors.filter(v => v.status === 'checked_in').length} <span style={{ fontSize: '14px', fontWeight: 500 }}>Guests</span>
          </div>
          <div className="stat-sub">
            {t('Refinery & HQ Security Perimeter', 'রিফাইনারি ও সদর দপ্তর প্রাঙ্গণ', lang)}
          </div>
        </div>

        {/* Card 2: VIP & Delegations */}
        <div className="stat-card gold">
          <div className="stat-top">
            <span className="stat-label">{t('VIP / Govt Inspections Today', 'আজকের ভিআইপি/সরকারি পরিদর্শন', lang)}</span>
            <div className="stat-icon-wrap" style={{ background: 'rgba(212, 175, 55, 0.15)', color: '#B45309' }}>
              <Crown size={16} />
            </div>
          </div>
          <div className="stat-value" style={{ color: 'var(--brand-crimson)' }}>
            {visitors.filter(v => v.category === 'vip' || v.category === 'govt').length} <span style={{ fontSize: '14px', fontWeight: 500 }}>Delegations</span>
          </div>
          <div className="stat-sub">
            DoE Explosives & Axens France in Schedule
          </div>
        </div>

        {/* Card 3: Safety Induction NDA */}
        <div className="stat-card blue">
          <div className="stat-top">
            <span className="stat-label">{t('Safety Induction & NDA', 'নিরাপত্তা চুক্তি (এনডিএ)', lang)}</span>
            <div className="stat-icon-wrap" style={{ background: '#F0F9FF', color: '#0284C7' }}>
              <ShieldCheck size={16} />
            </div>
          </div>
          <div className="stat-value" style={{ color: '#0284C7' }}>
            100% <span style={{ fontSize: '14px', fontWeight: 500 }}>Signed</span>
          </div>
          <div className="stat-sub">
            {t('Mandatory Refinery Plant Clearance', 'বাধ্যতামূলক রিফাইনারি প্রবেশ সম্মতি', lang)}
          </div>
        </div>

        {/* Card 4: Security Protocol */}
        <div className="stat-card warn">
          <div className="stat-top">
            <span className="stat-label">{t('Security Gate Protocol', 'নিরাপত্তা গেট প্রটোকল', lang)}</span>
            <div className="stat-icon-wrap" style={{ background: '#FFFBEB', color: '#D97706' }}>
              <Shield size={16} />
            </div>
          </div>
          <div className="stat-value" style={{ fontSize: '18px' }}>
            DEFCON 1
          </div>
          <div className="stat-sub">
            Automated License Plate (ALPR) Active
          </div>
        </div>
      </div>

      {/* ─── SEGMENTED FILTER & SEARCH TOOLBAR ─── */}
      <div className="card mb-4" style={{ padding: '10px 14px', background: 'var(--brand-card-bg)', border: '1px solid var(--brand-slate-200)', borderRadius: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          {/* Filter Pills */}
          <div className="pill-tabs">
            <button
              className={`pill-tab ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              {t('All Registrations', 'সকল নিবন্ধন', lang)} ({visitors.length})
            </button>
            <button
              className={`pill-tab ${activeTab === 'checked_in' ? 'active' : ''}`}
              onClick={() => setActiveTab('checked_in')}
            >
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
              {t('Currently Inside', 'বর্তমানে ভেতরে', lang)} ({visitors.filter(v => v.status === 'checked_in').length})
            </button>
            <button
              className={`pill-tab ${activeTab === 'vip' ? 'active' : ''}`}
              onClick={() => setActiveTab('vip')}
            >
              👑 {t('VIP Dignitaries', 'ভিআইপি সম্মানিত অতিথি', lang)}
            </button>
            <button
              className={`pill-tab ${activeTab === 'govt' ? 'active' : ''}`}
              onClick={() => setActiveTab('govt')}
            >
              🏛️ {t('Govt Regulatory Inspections', 'সরকারি নিয়ন্ত্রক পরিদর্শন', lang)}
            </button>
          </div>

          {/* Quick Search Box */}
          <div style={{ position: 'relative', minWidth: '220px', maxWidth: '300px', flex: '1 1 auto' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--brand-slate-400)' }} />
            <input
              type="text"
              className="form-input"
              placeholder={t('Search guest, agency, host or pass ID...', 'নাম, সংস্থা বা পাস খুঁজুন...', lang)}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '32px', fontSize: '11.5px', height: '34px' }}
            />
          </div>
        </div>
      </div>

      {/* ─── MAIN CONTENT: DUAL RESPONSIVE LAYOUT ─── */}
      <div className="responsive-col-2">
        {/* Left Column: Visitor Manifest (Desktop Table + Mobile Cards) */}
        <div className="card" style={{ border: '1px solid var(--brand-slate-200)', overflow: 'hidden' }}>
          <div className="card-hd" style={{ padding: '12px 16px' }}>
            <div className="card-hd-left">
              <div className="card-hd-icon" style={{ width: '28px', height: '28px' }}><Users size={15} /></div>
              <div>
                <div className="card-title" style={{ fontSize: '13px' }}>{t('Visitor Manifest & Access Log', 'অতিথি তালিকা ও প্রবেশ লগ', lang)}</div>
                <div className="card-subtitle" style={{ fontSize: '10.5px' }}>{t('Real-time security gate telemetry & clearance', 'নিরাপত্তা গেটের লাইভ তথ্য ও অনুমোদন', lang)}</div>
              </div>
            </div>
            <span className="badge info" style={{ fontSize: '10.5px' }}>
              {filteredVisitors.length} {t('Records', 'জন', lang)}
            </span>
          </div>

          <div className="card-body" style={{ padding: 0 }}>
            {/* 1. DESKTOP VIEW: Clean, Spacious Data Table */}
            <div className="visitor-desktop-table">
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t('Pass / Guest', 'পাস ও অতিথি', lang)}</th>
                      <th>{t('Category', 'শ্রেণি', lang)}</th>
                      <th>{t('Host & Purpose', 'স্বাগতিক ও উদ্দেশ্য', lang)}</th>
                      <th>{t('Timing', 'সময়', lang)}</th>
                      <th style={{ textAlign: 'right' }}>{t('Status / Action', 'অবস্থা ও ব্যবস্থা', lang)}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVisitors.map(v => {
                      const isSelected = selectedVisitor?.id === v.id;
                      return (
                        <tr
                          key={v.id}
                          onClick={() => setSelectedVisitor(v)}
                          style={{
                            cursor: 'pointer',
                            background: isSelected ? 'rgba(165, 28, 48, 0.05)' : undefined,
                            borderLeft: isSelected ? '3px solid var(--brand-crimson)' : '3px solid transparent',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <td>
                            <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--brand-slate-900)' }}>{v.name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)', marginTop: '1px' }}>{v.organization}</div>
                            <div style={{ fontSize: '10px', fontFamily: 'monospace', color: 'var(--brand-crimson)', marginTop: '2px' }}>{v.id}</div>
                          </td>
                          <td>{getCategoryBadge(v.category)}</td>
                          <td>
                            <div style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--brand-slate-800)' }}>Host: {v.hostEmployee}</div>
                            <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-500)', maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {v.purpose}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontSize: '11.5px', fontWeight: 500 }}>{v.expectedDate}</div>
                            <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-400)' }}>
                              {v.checkInTime ? `In: ${v.checkInTime}` : `Exp: ${v.expectedTime}`}
                            </div>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                              {v.status === 'checked_in' ? (
                                <span className="badge success" style={{ fontSize: '10px' }}>✓ Inside Campus</span>
                              ) : v.status === 'pre_registered' ? (
                                <span className="badge info" style={{ fontSize: '10px' }}>Pre-Registered</span>
                              ) : (
                                <span className="badge" style={{ fontSize: '10px' }}>Checked Out</span>
                              )}
                              {v.status === 'pre_registered' && (
                                <button
                                  className="btn-primary"
                                  style={{ padding: '3px 8px', fontSize: '10.5px' }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCheckIn(v.id);
                                  }}
                                >
                                  Check In
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2. MOBILE VIEW: Touch-Friendly Responsive Cards (No Squished Columns!) */}
            <div className="visitor-mobile-cards" style={{ padding: '12px' }}>
              {filteredVisitors.map(v => {
                const isSelected = selectedVisitor?.id === v.id;
                return (
                  <div
                    key={v.id}
                    className={`visitor-card-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedVisitor(v)}
                    style={{
                      borderLeft: isSelected ? '4px solid var(--brand-crimson)' : '1px solid var(--brand-slate-200)',
                      background: isSelected ? 'rgba(165, 28, 48, 0.04)' : 'var(--brand-card-bg)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--brand-slate-900)' }}>{v.name}</div>
                        <div style={{ fontSize: '11.5px', color: 'var(--brand-slate-600)' }}>{v.organization}</div>
                        <div style={{ fontSize: '10px', fontFamily: 'monospace', color: 'var(--brand-crimson)' }}>Pass: {v.id}</div>
                      </div>
                      <div>
                        {getCategoryBadge(v.category)}
                      </div>
                    </div>

                    <div style={{ fontSize: '11.5px', color: 'var(--brand-slate-700)', padding: '6px 8px', background: 'var(--brand-slate-100)', borderRadius: '6px', marginBottom: '8px' }}>
                      <strong>Host:</strong> {v.hostEmployee} ({v.hostDept})<br />
                      <span style={{ color: 'var(--brand-slate-500)' }}>{v.purpose}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px', borderTop: '1px solid var(--brand-slate-100)', flexWrap: 'wrap', gap: '6px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)' }}>
                        🕒 {v.checkInTime ? `Checked In: ${v.checkInTime}` : `Expected: ${v.expectedTime}`}
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        {v.status === 'pre_registered' ? (
                          <button
                            className="btn-primary"
                            style={{ padding: '5px 10px', fontSize: '11px' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCheckIn(v.id);
                            }}
                          >
                            <UserCheck size={12} /> {t('Check In', 'চেক ইন', lang)}
                          </button>
                        ) : v.status === 'checked_in' ? (
                          <button
                            className="btn-outline-danger"
                            style={{ padding: '5px 10px', fontSize: '11px' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCheckOut(v.id);
                            }}
                          >
                            <Clock size={12} /> {t('Check Out', 'চেক আউট', lang)}
                          </button>
                        ) : (
                          <span className="badge" style={{ fontSize: '10px' }}>Completed</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Digital Gate Pass & VIP Protocol Details */}
        {selectedVisitor ? (
          <div className="card" style={{ border: '1px solid var(--brand-slate-200)', height: 'fit-content' }}>
            <div className="card-hd" style={{ padding: '12px 16px' }}>
              <div className="card-hd-left">
                <div className="card-hd-icon" style={{ width: '28px', height: '28px' }}>🪪</div>
                <div>
                  <div className="card-title" style={{ fontSize: '13px' }}>{selectedVisitor.name}</div>
                  <div className="card-subtitle" style={{ fontSize: '10.5px' }}>{selectedVisitor.designation} · {selectedVisitor.organization}</div>
                </div>
              </div>
              {getCategoryBadge(selectedVisitor.category)}
            </div>

            <div className="card-body" style={{ padding: '16px' }}>
              {/* VIP Protocol Banner if applicable */}
              {(selectedVisitor.category === 'vip' || selectedVisitor.category === 'govt') && (
                <div style={{
                  padding: '10px 12px',
                  borderRadius: '6px',
                  background: 'rgba(212, 175, 55, 0.08)',
                  border: '1px solid #D4AF37',
                  marginBottom: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '11.5px',
                  color: '#92400E'
                }}>
                  <Crown size={15} color="#D4AF37" style={{ flexShrink: 0 }} />
                  <div>
                    <strong>{t('VIP Executive Escort Protocol Active', 'ভিআইপি প্রটোকল সক্রিয়', lang)}</strong>
                    <div style={{ fontSize: '10.5px', color: '#B45309' }}>
                      Security escort unit assigned · Chairman / GM reception briefed · Priority parking cleared.
                    </div>
                  </div>
                </div>
              )}

              {/* Encrypted Digital Gate Pass Credential Card */}
              <div style={{
                background: 'linear-gradient(135deg, #0B132B 0%, #172554 100%)',
                border: '1px solid #1E293B',
                color: '#fff',
                borderRadius: '10px',
                padding: '16px',
                marginBottom: '14px',
                position: 'relative',
                boxShadow: '0 4px 14px rgba(11, 19, 43, 0.15)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '9.5px', textTransform: 'uppercase', letterSpacing: '1px', color: '#94A3B8' }}>
                      BASHUNDHARA OIL & GAS · GATE CREDENTIAL
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#F8FAFC', marginTop: '3px' }}>
                      {selectedVisitor.name}
                    </div>
                    <div style={{ fontSize: '11px', color: '#CBD5E1', marginTop: '1px' }}>
                      {selectedVisitor.organization}
                    </div>
                  </div>
                  <div style={{ background: '#fff', padding: '6px', borderRadius: '6px', flexShrink: 0 }}>
                    <QrCode size={44} color="#000" />
                  </div>
                </div>

                <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.12)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
                  <div>
                    <div style={{ color: '#94A3B8' }}>Security Badge:</div>
                    <div style={{ fontWeight: 700, color: '#38BDF8', fontFamily: 'monospace' }}>
                      {selectedVisitor.badgeNo || 'PENDING CHECK-IN'}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#94A3B8' }}>Gate Barrier Sensor:</div>
                    <div style={{ fontWeight: 700, color: '#4ADE80' }}>
                      {selectedVisitor.status === 'checked_in' ? '🟢 PERMITTED / INSIDE' : '⏳ READY FOR SCAN'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Metadata Grid */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', marginBottom: '16px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--brand-slate-100)' }}>
                  <span style={{ color: 'var(--brand-slate-500)' }}>Host Officer:</span>
                  <strong>{selectedVisitor.hostEmployee} ({selectedVisitor.hostDept})</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--brand-slate-100)' }}>
                  <span style={{ color: 'var(--brand-slate-500)' }}>Vehicle ALPR Entry:</span>
                  <code style={{ fontSize: '11px', color: 'var(--brand-slate-800)' }}>{selectedVisitor.vehiclePlate || 'Pedestrian / Escort Pool'}</code>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--brand-slate-100)' }}>
                  <span style={{ color: 'var(--brand-slate-500)' }}>Safety Induction NDA:</span>
                  <span style={{ color: '#059669', fontWeight: 600 }}>✓ Verified & Signed</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                  <span style={{ color: 'var(--brand-slate-500)' }}>Contact Phone:</span>
                  <span>{selectedVisitor.phone || '+880 1711-000000'}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {selectedVisitor.status === 'pre_registered' ? (
                  <button
                    className="btn-primary"
                    style={{ flex: 1.5, justifyContent: 'center', padding: '8px 12px', fontSize: '12px' }}
                    onClick={() => handleCheckIn(selectedVisitor.id)}
                  >
                    <UserCheck size={14} /> {t('Check-In & Issue Badge', 'চেক-ইন ও ব্যাজ প্রদান', lang)}
                  </button>
                ) : selectedVisitor.status === 'checked_in' ? (
                  <button
                    className="btn-outline-danger"
                    style={{ flex: 1.5, justifyContent: 'center', padding: '8px 12px', fontSize: '12px' }}
                    onClick={() => handleCheckOut(selectedVisitor.id)}
                  >
                    <Clock size={14} /> {t('Check-Out & Surrender', 'চেক-আউট ও পাস ফেরত', lang)}
                  </button>
                ) : (
                  <button
                    className="btn-outline"
                    style={{ flex: 1.5, justifyContent: 'center', padding: '8px 12px', fontSize: '12px' }}
                    disabled
                  >
                    <CheckCircle size={14} /> {t('Visit Completed', 'সাক্ষাৎ সম্পন্ন', lang)}
                  </button>
                )}

                <button
                  className="btn-outline"
                  style={{ fontSize: '12px', padding: '8px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}
                  onClick={() => {
                    showToast(t(`Digital Gate Pass slip printed for ${selectedVisitor.name}.`, `গেট পাস প্রিন্ট সম্পন্ন হয়েছে।`, lang), 'info');
                  }}
                  title="Print Gate Slip"
                >
                  <Printer size={13} /> {t('Print Slip', 'প্রিন্ট', lang)}
                </button>

                <button
                  className="btn-outline"
                  style={{ fontSize: '12px', padding: '8px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}
                  onClick={() => {
                    showToast(t(`Encrypted QR Gate Pass dispatched via SMS to ${selectedVisitor.phone || 'visitor mobile'}.`, `মোবাইলে কিউআর গেট পাস প্রেরণ সম্পন্ন।`, lang), 'success');
                  }}
                  title="Dispatch QR via SMS/WhatsApp"
                >
                  <Send size={13} /> {t('SMS Pass', 'এসএমএস', lang)}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="card" style={{ padding: '30px', textAlign: 'center', color: 'var(--brand-slate-400)' }}>
            <Users size={32} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
            <p style={{ margin: 0, fontSize: '13px' }}>Select any visitor from the manifest to inspect digital credential.</p>
          </div>
        )}
      </div>

      {/* ─── PRE-REGISTER GUEST MODAL ─── */}
      {showRegisterModal && (
        <div className="modal-backdrop" onClick={() => setShowRegisterModal(false)}>
          <div className="modal" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-hd">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>📝</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--brand-slate-900)' }}>
                    {t('Pre-Register Guest / Official Delegation', 'অতিথি বা প্রতিনিধিদল পূর্ব-নিবন্ধন', lang)}
                  </h3>
                  <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)', marginTop: '2px' }}>
                    {t('Generates encrypted QR digital gate pass for ALPR sensor & security gates', 'স্বয়ংক্রিয় কিউআর গেট পাস ও নম্বরপ্লেট এন্ট্রি প্রস্তুত হবে', lang)}
                  </div>
                </div>
              </div>
              <button className="btn-link-plain" onClick={() => setShowRegisterModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRegister}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="responsive-col-2-eq">
                  <div>
                    <label className="form-label" style={{ fontSize: '11.5px', fontWeight: 600 }}>{t('Full Name of Guest', 'অতিথির পূর্ণ নাম', lang)} *</label>
                    <input
                      className="form-input"
                      placeholder="e.g. Dr. Mohammad Rafiqul Islam"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '11.5px', fontWeight: 600 }}>{t('Organization / Government Agency', 'প্রতিষ্ঠান বা সরকারি সংস্থা', lang)} *</label>
                    <input
                      className="form-input"
                      placeholder="e.g. Directorate of Explosives / Axens France"
                      value={formOrg}
                      onChange={(e) => setFormOrg(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="responsive-col-3">
                  <div>
                    <label className="form-label" style={{ fontSize: '11.5px', fontWeight: 600 }}>{t('Category', 'শ্রেণি', lang)}</label>
                    <select
                      className="form-input"
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as any)}
                    >
                      <option value="vip">👑 VIP Dignitary / Board Guest</option>
                      <option value="govt">🏛️ Government Regulatory Inspector</option>
                      <option value="vendor">🔧 Technical Vendor / Specialist</option>
                      <option value="regular">Regular Visitor / Business Meeting</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '11.5px', fontWeight: 600 }}>{t('Host Employee', 'স্বাগতিক কর্মকর্তা', lang)}</label>
                    <input
                      className="form-input"
                      placeholder="e.g. Engr. Harunur Rashid"
                      value={formHost}
                      onChange={(e) => setFormHost(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '11.5px', fontWeight: 600 }}>{t('Expected Time', 'প্রত্যাশিত সময়', lang)}</label>
                    <input
                      className="form-input"
                      value={formTime}
                      onChange={(e) => setFormTime(e.target.value)}
                    />
                  </div>
                </div>

                <div className="responsive-col-2-eq">
                  <div>
                    <label className="form-label" style={{ fontSize: '11.5px', fontWeight: 600 }}>{t('Vehicle Plate (for ALPR barrier)', 'গাড়ির নম্বরপ্লেট', lang)}</label>
                    <input
                      className="form-input"
                      placeholder="e.g. DHAKA-METRO-GHA-11-9042"
                      value={formVehicle}
                      onChange={(e) => setFormVehicle(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '11.5px', fontWeight: 600 }}>{t('Mobile Phone (for QR SMS)', 'মোবাইল নম্বর', lang)}</label>
                    <input
                      className="form-input"
                      placeholder="+880 1711-xxxxxx"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '11.5px', fontWeight: 600 }}>{t('Official Purpose of Visit', 'পরিদর্শনের দাপ্তরিক উদ্দেশ্য', lang)} *</label>
                  <textarea
                    className="form-input"
                    rows={2}
                    placeholder="e.g. Statutory annual inspection of bitumen storage spheres and safety valves..."
                    value={formPurpose}
                    onChange={(e) => setFormPurpose(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-ft" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn-outline" onClick={() => setShowRegisterModal(false)}>
                  {t('Cancel', 'বাতিল', lang)}
                </button>
                <button type="submit" className="btn-primary" style={{ background: 'var(--brand-crimson)' }}>
                  <QrCode size={14} /> {t('Issue Digital QR Pass', 'ডিজিটাল কিউআর পাস ইস্যু করুন', lang)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
