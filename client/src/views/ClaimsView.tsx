import React, { useState } from 'react';
import { ViewProps, t } from '../types';
import { showToast } from '../App';
import {
  Receipt, Plus, CheckCircle, Clock, AlertTriangle, Download,
  DollarSign, MapPin, Calendar, FileText, Send, UserCheck,
  ChevronRight, ArrowRight, ShieldAlert, Check, X, Filter
} from 'lucide-react';
import SubmitClaimModal, { ClaimSubmissionData } from '../components/claims/SubmitClaimModal';

interface ClaimItem {
  id: string;
  claimant: string;
  designation: string;
  dept: string;
  type: 'tada' | 'conveyance' | 'tour_event';
  purpose: string;
  destination?: string;
  period: string;
  amount: number;
  advanceTaken?: number;
  netSettlement?: number;
  status: 'pending_hod' | 'pending_finance' | 'approved' | 'settled' | 'rejected';
  dateSubmitted: string;
  sapVoucher?: string;
  items?: { desc: string; date: string; amount: number; category: string }[];
}

const INITIAL_CLAIMS: ClaimItem[] = [
  {
    id: 'TOUR-2026-008',
    claimant: 'Engr. Md. Harunur Rashid',
    designation: 'Plant General Manager',
    dept: 'Keraniganj Refinery',
    type: 'tour_event',
    purpose: 'Chittagong Coastal Oil Terminal Turnaround Delegation Tour & Jetty Audit',
    destination: 'Patenga Terminal & BIWTA Jetty',
    period: 'Oct 05 – Oct 08, 2026 (4 days)',
    amount: 114500,
    advanceTaken: 120000,
    netSettlement: -5500, // Refund to BOGCL Treasury
    status: 'approved',
    dateSubmitted: '11 Oct 2026',
    sapVoucher: 'SAP-TR-2026-10492',
    items: [
      { desc: 'Official Technical Delegation Airfare (4 Engineers)', date: '05, 08 Oct', amount: 56000, category: 'Airfare' },
      { desc: 'Port Area Hotel Agrabad (3 Rooms, 3 Nights)', date: '05-07 Oct', amount: 38500, category: 'Accommodation' },
      { desc: 'Local Speedboat & River Jetty Inspection Logistics', date: '06-07 Oct', amount: 20000, category: 'River Logistics' },
    ],
  },
  {
    id: 'SPRT-2026-003',
    claimant: 'Md. Kamruzzaman',
    designation: 'Transport & Admin Supervisor',
    dept: 'Admin & Transport',
    type: 'tour_event',
    purpose: 'BOGCL Annual Inter-Plant Sports & Cricket Tournament (Keraniganj Ground)',
    destination: 'Keraniganj Refinery Ground',
    period: 'Oct 12 – Oct 14, 2026',
    amount: 362400,
    advanceTaken: 350000,
    netSettlement: 12400, // Reimbursement Payable to Admin
    status: 'pending_hod',
    dateSubmitted: '16 Oct 2026',
    items: [
      { desc: 'Refinery Ground Preparation, Tents & Sound System', date: '12 Oct', amount: 145000, category: 'Event Setup' },
      { desc: 'Player Jerseys & Sports Equipment for 8 Plant Teams', date: '12 Oct', amount: 98400, category: 'Sports Kit' },
      { desc: 'Player Catering & Refreshment (350 Staff for 3 Days)', date: '12-14 Oct', amount: 119000, category: 'Catering' },
    ],
  },
  {
    id: 'TADA-2026-0419',
    claimant: 'Tanvir Ahmed',
    designation: 'Sales Officer, Grade 8',
    dept: 'Sales & Distribution',
    type: 'tada',
    purpose: 'Chittagong Depot Dealer Network Inspection & Quality Audit',
    destination: 'Chittagong & Sitakunda',
    period: 'Oct 10 – Oct 13, 2026 (4 days)',
    amount: 14850,
    status: 'pending_hod',
    dateSubmitted: '14 Oct 2026',
    items: [
      { desc: 'Daily Allowance (4 days @ ৳1,500/day)', date: '10-13 Oct', amount: 6000, category: 'DA' },
      { desc: 'Hotel Peninsula CTG (3 nights with GST invoice)', date: '10-12 Oct', amount: 7200, category: 'Accommodation' },
      { desc: 'Inter-district AC Bus (Dhaka-CTG-Dhaka)', date: '10, 13 Oct', amount: 1650, category: 'Travel' },
    ],
  },
  {
    id: 'CNV-2026-1002',
    claimant: 'Tanvir Ahmed',
    designation: 'Sales Officer, Grade 8',
    dept: 'Sales & Distribution',
    type: 'conveyance',
    purpose: 'Local Client Visits — Motijheel, Tejgaon & Narayanganj Outlets',
    period: 'Oct 01 – Oct 15, 2026',
    amount: 5420,
    status: 'pending_hod',
    dateSubmitted: '15 Oct 2026',
    items: [
      { desc: 'Gulshan HQ to Motijheel BSEC (Uber CNG)', date: '02 Oct', amount: 480, category: 'CNG' },
      { desc: 'Motijheel to Tejgaon Industrial Zone (Local CNG)', date: '05 Oct', amount: 350, category: 'CNG' },
      { desc: 'HQ to Narayanganj River Depot & Return', date: '08 Oct', amount: 1250, category: 'Ride Share' },
      { desc: 'Uttara Dealer Meet & Sample Delivery', date: '11 Oct', amount: 840, category: 'CNG' },
      { desc: 'Mirpur DOHS Transport Logistics Coordination', date: '14 Oct', amount: 600, category: 'Rickshaw/CNG' },
      { desc: 'Tejgaon BSTI Office Document Handover', date: '15 Oct', amount: 400, category: 'CNG' },
    ],
  },
  {
    id: 'TADA-2026-0398',
    claimant: 'Engr. Tariq Ahmed',
    designation: 'Senior Plant Maintenance Engineer',
    dept: 'Keraniganj Refinery',
    type: 'tada',
    purpose: 'Siemens Gas Turbine Sensor Calibration Testing',
    destination: 'Ashuganj Power Hub',
    period: 'Oct 02 – Oct 04, 2026',
    amount: 18200,
    status: 'approved',
    dateSubmitted: '05 Oct 2026',
    sapVoucher: 'SAP-FI-2026-88092',
    items: [
      { desc: 'DA Grade 6 Senior Specialist (3 days)', date: '02-04 Oct', amount: 7500, category: 'DA' },
      { desc: 'Guest House Accommodation', date: '02-03 Oct', amount: 4500, category: 'Accommodation' },
      { desc: 'Express Transport & Testing Kit Baggage', date: '02-04 Oct', amount: 6200, category: 'Logistics' },
    ],
  },
  {
    id: 'CNV-2026-0941',
    claimant: 'Farida Begum',
    designation: 'CFO & Head of Finance',
    dept: 'Corporate Finance',
    type: 'conveyance',
    purpose: 'NBR Large Taxpayers Unit (LTU) Hearing & Bangladesh Bank Meeting',
    period: 'Sep 15 – Sep 30, 2026',
    amount: 8500,
    status: 'settled',
    dateSubmitted: '01 Oct 2026',
    sapVoucher: 'SAP-FI-2026-87114',
  },
];

const GRADE_POLICY = [
  { grade: 'Grade 1-2 (C-Suite / Chairman / MD)', daDhaka: 'Actuals / ৳5,000', daDistrict: 'Actuals / ৳6,000', hotelLimit: '5-Star / Direct Billing', travelMode: 'Executive Chauffeur / Air Business' },
  { grade: 'Grade 3-4 (General Manager / Plant GM)', daDhaka: '৳3,500', daDistrict: '৳4,500', hotelLimit: '৳8,000 / night', travelMode: 'Company Car / Domestic Air' },
  { grade: 'Grade 5-6 (HOD / Senior Specialist / Manager)', daDhaka: '৳2,500', daDistrict: '৳3,200', hotelLimit: '৳5,500 / night', travelMode: 'Assigned Pool Car / AC Train' },
  { grade: 'Grade 7-8 (Officer / Engineer / Supervisor)', daDhaka: '৳1,500', daDistrict: '৳2,000', hotelLimit: '৳3,000 / night', travelMode: 'AC Intercity Bus / 1st Class Train' },
  { grade: 'Grade 9-10 (Junior Tech / Driver / Staff)', daDhaka: '৳800', daDistrict: '৳1,200', hotelLimit: '৳1,800 / night', travelMode: 'Non-AC Bus / Second Class Train' },
];

export default function ClaimsView({ role, lang }: ViewProps) {
  const [claims, setClaims] = useState<ClaimItem[]>(INITIAL_CLAIMS);
  const [activeTab, setActiveTab] = useState<'all' | 'tada' | 'conveyance' | 'tour_event' | 'policy'>('all');
  const [selectedClaim, setSelectedClaim] = useState<ClaimItem | null>(INITIAL_CLAIMS[0]);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const filteredClaims = claims.filter(c => {
    if (activeTab === 'tada') return c.type === 'tada';
    if (activeTab === 'conveyance') return c.type === 'conveyance';
    if (activeTab === 'tour_event') return c.type === 'tour_event';
    return true;
  });

  const handleApprove = (id: string) => {
    setClaims(prev => prev.map(c => {
      if (c.id === id) {
        const nextStatus = role === 'hod' ? 'pending_finance' : 'approved';
        return { ...c, status: nextStatus, sapVoucher: nextStatus === 'approved' ? `SAP-FI-2026-${Math.floor(10000 + Math.random() * 90000)}` : undefined };
      }
      return c;
    }));
    showToast(
      lang === 'en'
        ? `Claim ${id} approved and routed for payment disbursement.`
        : `দাবি ${id} অনুমোদিত এবং অর্থ পরিশোধের জন্য পাঠানো হয়েছে।`,
      'success'
    );
  };

  const handleReject = (id: string) => {
    setClaims(prev => prev.map(c => c.id === id ? { ...c, status: 'rejected' } : c));
    showToast(lang === 'en' ? `Claim ${id} returned to employee with notes.` : `দাবি ${id} সংশোধনের জন্য ফেরত পাঠানো হয়েছে।`, 'info');
  };

  const handleCreateClaim = (data: ClaimSubmissionData) => {
    const newClaim: ClaimItem = {
      id: data.id,
      claimant: data.claimant,
      designation: data.designation,
      dept: data.dept,
      type: data.type,
      purpose: data.purpose,
      destination: data.destination,
      period: data.period,
      amount: data.amount,
      advanceTaken: data.advanceTaken,
      netSettlement: data.netSettlement,
      status: 'pending_hod',
      dateSubmitted: data.dateSubmitted,
      items: data.items,
    };
    setClaims([newClaim, ...claims]);
    setSelectedClaim(newClaim);
    setActiveTab('all');
    showToast(lang === 'en' ? `Claim ${data.id} submitted for HOD approval.` : `দাবি ${data.id} বিভাগীয় প্রধানের অনুমোদনের জন্য দাখিল করা হয়েছে।`, 'success');
  };

  const getStatusBadge = (status: ClaimItem['status']) => {
    switch (status) {
      case 'pending_hod':
        return <span className="badge warn">Pending HOD</span>;
      case 'pending_finance':
        return <span className="badge info">Pending Finance</span>;
      case 'approved':
        return <span className="badge success">Approved (SAP)</span>;
      case 'settled':
        return <span className="badge success">Disbursed</span>;
      case 'rejected':
        return <span className="badge danger">Returned</span>;
    }
  };

  return (
    <div className="view-container">
      {/* Top Header */}
      <div className="section-header">
        <div>
          <h2 className="section-title">
            💰 {t('TA / DA & Conveyance Management System', 'ভ্রমণ ও দৈনিক ভাতা (টিএ/ডিএ) এবং যাতায়াত ব্যবস্থাপনা', lang)}
          </h2>
          <p className="section-subtitle">
            {t(
              'Corporate tour expense requisitions, daily allowance calculation, monthly conveyance claims & SAP S/4HANA disbursement.',
              'কর্পোরেট সফর ব্যয় অনুমোদন, দৈনিক ভাতা হিসাব, মাসিক যাতায়াত ভাতা দাবি এবং স্যাপ এস/৪ হানা পেমেন্ট অটোমেশন।',
              lang
            )}
          </p>
        </div>
        <div className="btn-group">
          <button
            className="btn-primary"
            onClick={() => setShowSubmitModal(true)}
          >
            <Plus size={15} /> {t('Submit New Claim', 'নতুন দাবি দাখিল', lang)}
          </button>
          <button
            className="btn-outline"
            onClick={() => showToast(t('Exporting Monthly Expense Ledger to Excel...', 'মাসিক এক্সপেন্স লেজার এক্সেল রপ্তানি হচ্ছে...', lang), 'info')}
          >
            <Download size={15} /> {t('Export Ledger', 'লেজার ডাউনলোড', lang)}
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="kpi-grid mb-5">
        <div className="kpi-card">
          <div className="kpi-label">{t('Pending Verification', 'যাচাইয়ের অপেক্ষায়', lang)}</div>
          <div className="kpi-value text-amber">
            ৳{claims.filter(c => c.status.includes('pending')).reduce((acc, c) => acc + c.amount, 0).toLocaleString()}
          </div>
          <div className="kpi-sub">{claims.filter(c => c.status.includes('pending')).length} active requisitions</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">{t('Approved This Month', 'এই মাসে অনুমোদিত', lang)}</div>
          <div className="kpi-value text-emerald">৳1,48,200</div>
          <div className="kpi-sub">100% compliant with Grade Policy</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">{t('Monthly Conveyance Cap', 'মাসিক যাতায়াত সীমা', lang)}</div>
          <div className="kpi-value">৳8,000 <span style={{ fontSize: '13px', color: 'var(--brand-slate-500)', fontWeight: 500 }}>/ Grade 8</span></div>
          <div className="kpi-sub">৳5,420 claimed (67.7% utilized)</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">{t('Avg Settlement SLA', 'গড় নিষ্পত্তি সময়', lang)}</div>
          <div className="kpi-value text-blue">48 Hrs</div>
          <div className="kpi-sub">Integrated with BEFTN / Corporate Bank</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="pill-tabs mb-4">
        <button className={`pill-tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
          {t('All Claims', 'সকল দাবি', lang)} ({claims.length})
        </button>
        <button className={`pill-tab ${activeTab === 'tada' ? 'active' : ''}`} onClick={() => setActiveTab('tada')}>
          ✈️ {t('Tour TA / DA', 'সফর টিএ / ডিএ', lang)}
        </button>
        <button className={`pill-tab ${activeTab === 'conveyance' ? 'active' : ''}`} onClick={() => setActiveTab('conveyance')}>
          🚕 {t('Monthly Conveyance', 'মাসিক যাতায়াত', lang)}
        </button>
        <button className={`pill-tab ${activeTab === 'tour_event' ? 'active' : ''}`} onClick={() => setActiveTab('tour_event')}>
          🏆 {t('Tour & Event Advance Settlement', 'সফর ও ইভেন্ট অগ্রিম সমন্বয়', lang)}
        </button>
        <button className={`pill-tab ${activeTab === 'policy' ? 'active' : ''}`} onClick={() => setActiveTab('policy')}>
          📜 {t('Grade Entitlement Matrix', 'গ্রেড নীতিমালা ম্যাট্রিক্স', lang)}
        </button>
      </div>

      {/* Main Content Area */}
      {activeTab === 'policy' ? (
        <div className="card">
          <div className="card-hd">
            <div className="card-hd-left">
              <div className="card-hd-icon">📜</div>
              <div>
                <div className="card-title">{t('Bashundhara Group TA / DA Entitlement Policy (2026 Revision)', 'বাশুন্ধারা গ্রুপ টিএ/ডিএ নীতিমালা ২০২৬', lang)}</div>
                <div className="card-subtitle">{t('Statutory allowances per diem based on executive & technical grading', 'কর্মকর্তা ও কারিগরি গ্রেড অনুযায়ী দৈনিক ভাতা ও ভ্রমণ সুবিধা', lang)}</div>
              </div>
            </div>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="data-table">
              <thead>
                <tr>
                  <th>{t('Grade / Designation Category', 'গ্রেড / পদবি', lang)}</th>
                  <th>{t('DA Dhaka Metro', 'দৈনিক ভাতা (ঢাকা)', lang)}</th>
                  <th>{t('DA Outside Metro / Plant', 'দৈনিক ভাতা (বাহিরে/প্ল্যান্ট)', lang)}</th>
                  <th>{t('Hotel Accommodation Cap', 'হোটেল সিলিং', lang)}</th>
                  <th>{t('Authorized Travel Mode', 'অনুমোদিত বাহন', lang)}</th>
                </tr>
              </thead>
              <tbody>
                {GRADE_POLICY.map((p, i) => (
                  <tr key={i}>
                    <td><strong>{p.grade}</strong></td>
                    <td>{p.daDhaka}</td>
                    <td><span className="badge info">{p.daDistrict}</span></td>
                    <td>{p.hotelLimit}</td>
                    <td>{p.travelMode}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="responsive-col-2">
          {/* Claims List Table */}
          <div className="card">
            <div className="card-hd">
              <div className="card-hd-left">
                <div className="card-hd-icon"><Receipt size={16} /></div>
                <div>
                  <div className="card-title">{t('Requisition & Claim Queue', 'দাবি তালিকা', lang)}</div>
                  <div className="card-subtitle">{t('Click any item to inspect breakdowns and vouchers', 'বিস্তারিত ও ভাউচার দেখতে আইটেমে ক্লিক করুন', lang)}</div>
                </div>
              </div>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              <div className="table-responsive">
                <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('ID / Date', 'আইডি / তারিখ', lang)}</th>
                    <th>{t('Claimant', 'দাবিদার', lang)}</th>
                    <th>{t('Type / Purpose', 'ধরন ও বিবরণ', lang)}</th>
                    <th>{t('Amount', 'পরিমাণ', lang)}</th>
                    <th>{t('Status', 'অবস্থা', lang)}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClaims.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedClaim(item)}
                      style={{
                        cursor: 'pointer',
                        background: selectedClaim?.id === item.id ? 'var(--brand-gold-glow, rgba(165,28,48,0.06))' : undefined,
                      }}
                    >
                      <td>
                        <div style={{ fontWeight: 600, fontFamily: 'monospace' }}>{item.id}</div>
                        <div style={{ fontSize: '11px', color: 'var(--brand-slate-400)' }}>{item.dateSubmitted}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{item.claimant}</div>
                        <div style={{ fontSize: '11px', color: 'var(--brand-slate-400)' }}>{item.dept}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className={`badge ${item.type === 'tada' ? 'info' : item.type === 'tour_event' ? 'gold' : 'purple'}`}>
                            {item.type === 'tada' ? '✈️ TA/DA' : item.type === 'tour_event' ? '🏆 Tour & Event' : '🚕 Conveyance'}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', marginTop: '3px', maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.purpose}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, fontSize: '13px' }}>৳{item.amount.toLocaleString()}</div>
                        {item.destination && (
                          <div style={{ fontSize: '11px', color: 'var(--brand-slate-400)' }}>{item.destination}</div>
                        )}
                      </td>
                      <td>{getStatusBadge(item.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          </div>

          {/* Selected Claim Inspector Panel */}
          {selectedClaim && (
            <div className="card">
              <div className="card-hd">
                <div className="card-hd-left">
                  <div className="card-hd-icon">📄</div>
                  <div>
                    <div className="card-title">{selectedClaim.id}</div>
                    <div className="card-subtitle">{selectedClaim.claimant} · {selectedClaim.designation}</div>
                  </div>
                </div>
                {getStatusBadge(selectedClaim.status)}
              </div>
              <div className="card-body">
                <div style={{ background: 'var(--brand-slate-50)', padding: '14px', borderRadius: '8px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--brand-slate-400)', fontWeight: 600 }}>
                    {t('Official Purpose', 'দাপ্তরিক উদ্দেশ্য', lang)}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '13px', marginTop: '4px' }}>
                    {selectedClaim.purpose}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--brand-slate-600)', marginTop: '4px' }}>
                    📅 {selectedClaim.period}
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>
                    {t('Itemized Expenses Breakdown', 'ব্যয়ের বিস্তারিত তালিকা', lang)}
                  </div>
                  {selectedClaim.items && selectedClaim.items.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {selectedClaim.items.map((it, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--brand-card-bg)', border: '1px solid var(--brand-border)', borderRadius: '6px', fontSize: '12px' }}>
                          <div>
                            <div style={{ fontWeight: 500 }}>{it.desc}</div>
                            <div style={{ fontSize: '11px', color: 'var(--brand-slate-400)' }}>{it.date} · {it.category}</div>
                          </div>
                          <div style={{ fontWeight: 700 }}>৳{it.amount.toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: '12px', color: 'var(--brand-slate-400)' }}>Direct voucher submission</div>
                  )}
                </div>

                {selectedClaim.advanceTaken !== undefined && (
                  <div style={{ background: 'var(--brand-slate-100)', borderRadius: '6px', padding: '10px 14px', marginBottom: '14px', border: '1px solid var(--brand-border)', fontSize: '11.5px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--brand-slate-500)' }}>{t('Advance Cash Disbursed:', 'প্রদত্ত নগদ অগ্রিম:', lang)}</span>
                      <strong>৳{selectedClaim.advanceTaken.toLocaleString()}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--brand-slate-500)' }}>{t('Actual Verified Bills:', 'যাচাইকৃত প্রকৃত বিল:', lang)}</span>
                      <strong>৳{selectedClaim.amount.toLocaleString()}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--brand-border)', paddingTop: '6px', fontWeight: 700 }}>
                      <span>{t('Net Settlement Balance:', 'চূড়ান্ত সমন্বয় স্থিতি:', lang)}</span>
                      <span style={{ color: (selectedClaim.netSettlement || 0) >= 0 ? '#15803D' : '#DC2626' }}>
                        {(selectedClaim.netSettlement || 0) >= 0
                          ? `+ ৳${(selectedClaim.netSettlement || 0).toLocaleString()} (Payable to Staff)`
                          : `- ৳${Math.abs(selectedClaim.netSettlement || 0).toLocaleString()} (Refund to Treasury)`}
                      </span>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--brand-border)', paddingTop: '12px', marginBottom: '20px' }}>
                  <span style={{ fontWeight: 600 }}>{selectedClaim.advanceTaken ? t('Total Verified Bills', 'মোট যাচাইকৃত ব্যয়', lang) : t('Total Claimable', 'মোট দাবিযোগ্য', lang)}</span>
                  <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--brand-crimson)' }}>
                    ৳{selectedClaim.amount.toLocaleString()}
                  </span>
                </div>

                {selectedClaim.sapVoucher && (
                  <div style={{ background: 'rgba(5, 150, 105, 0.08)', border: '1px solid rgba(5, 150, 105, 0.2)', padding: '10px 14px', borderRadius: '6px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                    <CheckCircle size={16} color="#059669" />
                    <div>
                      <strong>SAP S/4HANA Linked:</strong> <code>{selectedClaim.sapVoucher}</code>
                    </div>
                  </div>
                )}

                {/* Role-based action controls */}
                {(role === 'hod' || role === 'chairman') && selectedClaim.status.includes('pending') && (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      className="btn-primary"
                      style={{ flex: 1 }}
                      onClick={() => handleApprove(selectedClaim.id)}
                    >
                      <Check size={16} /> {role === 'hod' ? t('Verify & Forward to Finance', 'অনুমোদন ও অর্থ বিভাগে প্রেরণ', lang) : t('Authorize Disbursement', 'পেমেন্ট অনুমোদন', lang)}
                    </button>
                    <button
                      className="btn-outline-danger"
                      onClick={() => handleReject(selectedClaim.id)}
                    >
                      <X size={16} /> {t('Return with Query', 'জিজ্ঞাসাসহ ফেরত', lang)}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Submit Claim Modal */}
      <SubmitClaimModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        lang={lang}
        onSubmit={handleCreateClaim}
      />
    </div>
  );
}
