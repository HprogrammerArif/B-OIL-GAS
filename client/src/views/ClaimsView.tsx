import React, { useState } from 'react';
import { ViewProps, t, ROLE_META } from '../types';
import { showToast } from '../App';
import {
  Receipt, Plus, CheckCircle, Clock, AlertTriangle, Download,
  DollarSign, MapPin, Calendar, FileText, Send, UserCheck,
  ChevronRight, ArrowRight, ArrowLeft, ShieldAlert, Check, X, Filter
} from 'lucide-react';
import SubmitClaimModal, { ClaimSubmissionData } from '../components/claims/SubmitClaimModal';
import RejectionExplanationModal, { RejectionData } from '../components/RejectionExplanationModal';
import { useApprovalStore, ClaimItem } from '../store/approvalStore';

const GRADE_POLICY = [
  { grade: 'Grade 1-2 (Chairman / MD / C-Suite)', daDhaka: 'Actuals / ৳5,000', daDistrict: 'Actuals / ৳6,000', hotelLimit: '5-Star / Direct Billing', travelMode: 'Executive Car / Domestic Air' },
  { grade: 'Grade 3-4 (General Manager / Plant GM)', daDhaka: '৳3,500', daDistrict: '৳4,500', hotelLimit: '৳8,000 / night', travelMode: 'Company Car / Domestic Air' },
  { grade: 'Grade 5-6 (HOD / Senior Specialist / Manager)', daDhaka: '৳2,500', daDistrict: '৳3,200', hotelLimit: '৳5,500 / night', travelMode: 'Assigned Pool Car / AC Train' },
  { grade: 'Grade 7-8 (Officer / Engineer / Supervisor)', daDhaka: '৳1,500', daDistrict: '৳2,000', hotelLimit: '৳3,000 / night', travelMode: 'AC Intercity Bus / 1st Class Train' },
  { grade: 'Grade 9-10 (Junior Tech / Driver / Staff)', daDhaka: '৳800', daDistrict: '৳1,200', hotelLimit: '৳1,800 / night', travelMode: 'Standard Bus / Train' },
];

export default function ClaimsView({ role, lang }: ViewProps) {
  const { claims, addClaim, updateClaimStatus, rejectClaim, resubmitClaim } = useApprovalStore();
  const [activeTab, setActiveTab] = useState<'all' | 'tada' | 'conveyance' | 'tour_event' | 'policy'>('all');
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<'list' | 'detail'>('list');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  const selectedClaim = claims.find(c => c.id === selectedClaimId) || claims[0];
  const setSelectedClaim = (claim: ClaimItem | null) => setSelectedClaimId(claim ? claim.id : null);

  const filteredClaims = claims.filter(c => {
    if (activeTab === 'tada') return c.type === 'tada';
    if (activeTab === 'conveyance') return c.type === 'conveyance';
    if (activeTab === 'tour_event') return c.type === 'tour_event';
    return true;
  });

  const handleApprove = (id: string) => {
    const current = claims.find(c => c.id === id);
    if (!current) return;

    if (current.status === 'pending_hod') {
      updateClaimStatus(id, 'pending_finance');
      showToast(
        lang === 'en'
          ? `✓ Claim ${id} verified and forwarded to Corporate Finance for voucher release.`
          : `✓ দাবি ${id} যাচাই করে পেমেন্টের জন্য অর্থ বিভাগে পাঠানো হয়েছে।`,
        'success'
      );
    } else {
      updateClaimStatus(id, 'approved');
      showToast(
        lang === 'en'
          ? `✓ Claim ${id} authorized! Payment voucher generated.`
          : `✓ দাবি ${id} অনুমোদিত! পেমেন্ট ভাউচার প্রস্তুত করা হয়েছে।`,
        'success'
      );
    }
  };

  const handleReject = () => {
    setShowRejectModal(true);
  };

  const handleConfirmReject = (data: RejectionData) => {
    if (!selectedClaim) return;
    const actor = ROLE_META[role] || ROLE_META.hod;
    const reviewer = `${actor.name} (${actor.label})`;

    rejectClaim(
      selectedClaim.id,
      data.reasonCategory,
      data.observation,
      data.improvementsRequired,
      reviewer
    );
    setShowRejectModal(false);
    showToast(
      lang === 'en'
        ? `Claim ${selectedClaim.id} returned with query: "${data.reasonCategory}". Sent to ${selectedClaim.claimant}.`
        : `দাবি ${selectedClaim.id} আপত্তি ও নির্দেশনাসহ ফেরত পাঠানো হয়েছে।`,
      'warn'
    );
  };

  const handleResubmit = (claimId: string) => {
    resubmitClaim(claimId, 'Vouchers updated and per-diem recalculated.');
    showToast(
      lang === 'en'
        ? `Claim ${claimId} revised & resubmitted for approval.`
        : `দাবি ${claimId} সংশোধনপূর্বক পুনরায় দাখিল করা হয়েছে।`,
      'success'
    );
  };

  const handleCreateClaim = (data: ClaimSubmissionData) => {
    const newClaim = addClaim(data);
    setSelectedClaimId(newClaim.id);
    setActiveTab('all');
    showToast(
      lang === 'en'
        ? `Claim ${data.id} submitted for approval.`
        : `দাবি ${data.id} অনুমোদনের জন্য দাখিল করা হয়েছে।`,
      'success'
    );
  };

  const handleExportCSV = () => {
    const headers = ['Claim ID', 'Claimant', 'Department', 'Type', 'Amount (BDT)', 'Status', 'Date', 'Purpose'];
    const rows = claims.map(c => [
      c.id,
      `"${c.claimant.replace(/"/g, '""')}"`,
      `"${c.dept.replace(/"/g, '""')}"`,
      c.type,
      c.amount,
      c.status,
      c.dateSubmitted,
      `"${c.purpose.replace(/"/g, '""')}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BOGCL_Expense_Claims_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(t('Expense ledger downloaded as CSV.', 'এক্সপেন্স লেজার সিএসভি ফাইল হিসেবে ডাউনলোড করা হয়েছে।', lang), 'success');
  };

  const getStatusBadge = (status: ClaimItem['status']) => {
    switch (status) {
      case 'pending_hod':
        return <span className="badge warn">Pending Review</span>;
      case 'pending_finance':
        return <span className="badge info">Pending Finance</span>;
      case 'approved':
        return <span className="badge success">Approved</span>;
      case 'settled':
        return <span className="badge success">Paid Out</span>;
      case 'rejected':
        return <span className="badge danger">Returned</span>;
    }
  };

  const pendingAmount = claims
    .filter(c => c.status.includes('pending'))
    .reduce((acc, c) => acc + c.amount, 0);

  const approvedAmount = claims
    .filter(c => c.status === 'approved' || c.status === 'settled')
    .reduce((acc, c) => acc + c.amount, 0);

  return (
    <div className="view-container">
      {/* Top Header */}
      <div className="section-header">
        <div>
          <h2 className="section-title">
            💰 {t('Travel Expense & Conveyance Management', 'ভ্রমণ ও যাতায়াত ভাতা (টিএ/ডিএ) ব্যবস্থাপনা', lang)}
          </h2>
          <p className="section-subtitle">
            {t(
              'Tour expense claims, daily allowance per-diem, monthly conveyance reimbursement, and payment vouchers.',
              'দাপ্তরিক সফর ব্যয়, দৈনিক ভাতা, মাসিক যাতায়াত বিল এবং পেমেন্ট ভাউচার ব্যবস্থাপনা।',
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
            onClick={handleExportCSV}
          >
            <Download size={15} /> {t('Export CSV Ledger', 'লেজার ডাউনলোড', lang)}
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="kpi-grid mb-5">
        <div className="kpi-card">
          <div className="kpi-label">{t('Pending Verification', 'যাচাইয়ের অপেক্ষায়', lang)}</div>
          <div className="kpi-value text-amber">
            ৳{pendingAmount.toLocaleString()}
          </div>
          <div className="kpi-sub">{claims.filter(c => c.status.includes('pending')).length} active claims</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">{t('Approved Expenses', 'অনুমোদিত ব্যয়', lang)}</div>
          <div className="kpi-value text-emerald">৳{approvedAmount.toLocaleString()}</div>
          <div className="kpi-sub">Verified under company policy</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">{t('Monthly Conveyance Limit', 'মাসিক যাতায়াত ভাতা সীমা', lang)}</div>
          <div className="kpi-value">৳8,000 <span style={{ fontSize: '13px', color: 'var(--brand-slate-500)', fontWeight: 500 }}>/ Grade 8</span></div>
          <div className="kpi-sub">Monthly ceiling for local visits</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">{t('Settlement Time', 'গড় নিষ্পত্তি সময়', lang)}</div>
          <div className="kpi-value text-blue">24-48 Hrs</div>
          <div className="kpi-sub">Direct corporate bank transfer</div>
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
          🏆 {t('Tour & Event Advance', 'সফর ও ইভেন্ট অগ্রিম', lang)}
        </button>
        <button className={`pill-tab ${activeTab === 'policy' ? 'active' : ''}`} onClick={() => setActiveTab('policy')}>
          📜 {t('Allowance Policy Rates', 'ভাতা নীতিমালা হার', lang)}
        </button>
      </div>

      {/* Main Content Area */}
      {activeTab === 'policy' ? (
        <div className="card">
          <div className="card-hd">
            <div className="card-hd-left">
              <div className="card-hd-icon">📜</div>
              <div>
                <div className="card-title">{t('Bashundhara Group Official Travel Allowance Policy', 'বসুন্ধরা গ্রুপ ভ্রমণ ভাতা নীতিমালা', lang)}</div>
                <div className="card-subtitle">{t('Standard daily allowance rates based on staff designation grade', 'পদবি গ্রেড অনুযায়ী অনুমোদিত দৈনিক ভাতা ও যাতায়াত সুবিধা', lang)}</div>
              </div>
            </div>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="data-table">
              <thead>
                <tr>
                  <th>{t('Grade / Designation Category', 'গ্রেড / পদবি', lang)}</th>
                  <th>{t('Daily Allowance (Dhaka)', 'দৈনিক ভাতা (ঢাকা)', lang)}</th>
                  <th>{t('Daily Allowance (Districts/Plant)', 'দৈনিক ভাতা (বাহিরে/প্ল্যান্ট)', lang)}</th>
                  <th>{t('Hotel Accommodation Ceiling', 'হোটেল সিলিং', lang)}</th>
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
        <>
          {/* Mobile Tab Switcher */}
          <div className="mobile-view-toggle">
            <button
              type="button"
              className={mobileTab === 'list' ? 'active' : ''}
              onClick={() => setMobileTab('list')}
            >
              <Receipt size={14} />
              {t('Claims Queue', 'দাবি তালিকা', lang)} ({filteredClaims.length})
            </button>
            <button
              type="button"
              className={mobileTab === 'detail' ? 'active' : ''}
              onClick={() => setMobileTab('detail')}
            >
              <FileText size={14} />
              {t('Details & Vouchers', 'ভাউচার বিবরণ', lang)} {selectedClaim ? `(${selectedClaim.id})` : ''}
            </button>
          </div>

          <div className="responsive-col-2">
            {/* Claims List */}
            <div className={`card ${mobileTab === 'detail' ? 'mobile-hide' : ''}`}>
              <div className="card-hd">
                <div className="card-hd-left">
                  <div className="card-hd-icon"><Receipt size={16} /></div>
                  <div>
                    <div className="card-title">{t('Requisition & Expense Claims', 'দাবি তালিকা', lang)}</div>
                    <div className="card-subtitle">{t('Select any item to review voucher details', 'বিস্তারিত দেখতে যেকোনো দাবিতে ক্লিক করুন', lang)}</div>
                  </div>
                </div>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                {/* Desktop Table View */}
                <div className="claims-desktop-table">
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
                                  {item.type === 'tada' ? '✈️ TA/DA' : item.type === 'tour_event' ? '🏆 Tour' : '🚕 Conveyance'}
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

                {/* Mobile Cards View */}
                <div className="claims-mobile-cards">
                  {filteredClaims.map((item) => (
                    <div
                      key={item.id}
                      className={`claim-mobile-card ${selectedClaim?.id === item.id ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedClaim(item);
                        setMobileTab('detail');
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 800, fontFamily: 'monospace', fontSize: '11.5px', color: 'var(--brand-crimson)' }}>
                            {item.id}
                          </span>
                          <span className={`badge ${item.type === 'tada' ? 'info' : item.type === 'tour_event' ? 'gold' : 'purple'}`} style={{ fontSize: '9.5px', padding: '1px 5px' }}>
                            {item.type === 'tada' ? '✈️ TA/DA' : item.type === 'tour_event' ? '🏆 Tour' : '🚕 Conveyance'}
                          </span>
                        </div>
                        <span style={{ fontWeight: 800, fontSize: '13.5px', color: 'var(--brand-slate-900)' }}>
                          ৳{item.amount.toLocaleString()}
                        </span>
                      </div>

                      <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--brand-slate-900)', marginBottom: '3px' }}>
                        {item.purpose}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--brand-slate-500)', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid var(--brand-slate-100)' }}>
                        <div>
                          <strong>{item.claimant}</strong> · {item.dept}
                        </div>
                        {getStatusBadge(item.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Selected Claim Inspector Panel */}
            {selectedClaim && (
              <div className={`card ${mobileTab === 'list' ? 'mobile-hide' : ''}`}>
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
                  {/* Mobile Back Button */}
                  <div style={{ marginBottom: '14px' }}>
                    <button
                      type="button"
                      className="btn-outline mobile-view-toggle"
                      style={{ padding: '6px 12px', fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '6px', width: 'auto' }}
                      onClick={() => setMobileTab('list')}
                    >
                      <ArrowLeft size={13} /> {t('Back to Claims List', 'তালিকায় ফিরুন', lang)}
                    </button>
                  </div>

                  <div style={{ background: 'var(--brand-slate-50)', padding: '14px', borderRadius: '8px', marginBottom: '16px' }}>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--brand-slate-400)', fontWeight: 600 }}>
                      {t('Purpose of Travel', 'ভ্রমণের উদ্দেশ্য', lang)}
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
                        <span style={{ color: 'var(--brand-slate-500)' }}>{t('Advance Cash Given:', 'প্রদত্ত নগদ অগ্রিম:', lang)}</span>
                        <strong>৳{selectedClaim.advanceTaken.toLocaleString()}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ color: 'var(--brand-slate-500)' }}>{t('Verified Bills Total:', 'প্রকৃত খরচের পরিমাণ:', lang)}</span>
                        <strong>৳{selectedClaim.amount.toLocaleString()}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--brand-border)', paddingTop: '6px', fontWeight: 700 }}>
                        <span>{t('Final Balance:', 'চূড়ান্ত সমন্বয় স্থিতি:', lang)}</span>
                        <span style={{ color: (selectedClaim.netSettlement || 0) >= 0 ? '#15803D' : '#DC2626' }}>
                          {(selectedClaim.netSettlement || 0) >= 0
                            ? `+ ৳${(selectedClaim.netSettlement || 0).toLocaleString()} (Payable to Staff)`
                            : `- ৳${Math.abs(selectedClaim.netSettlement || 0).toLocaleString()} (Refund to Company)`}
                        </span>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--brand-border)', paddingTop: '12px', marginBottom: '20px' }}>
                    <span style={{ fontWeight: 600 }}>{selectedClaim.advanceTaken ? t('Total Verified Bills', 'মোট খরচ', lang) : t('Total Claim Amount', 'মোট দাবিকৃত টাকা', lang)}</span>
                    <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--brand-crimson)' }}>
                      ৳{selectedClaim.amount.toLocaleString()}
                    </span>
                  </div>

                  {selectedClaim.sapVoucher && (
                    <div style={{ background: 'rgba(5, 150, 105, 0.08)', border: '1px solid rgba(5, 150, 105, 0.2)', padding: '10px 14px', borderRadius: '6px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                      <CheckCircle size={16} color="#059669" />
                      <div>
                        <strong>Payment Voucher Generated:</strong> <code>{selectedClaim.sapVoucher}</code>
                      </div>
                    </div>
                  )}

                  {/* Rejection / Query Callout */}
                  {selectedClaim.status === 'rejected' && (
                    <div
                      style={{
                        background: '#FEF2F2',
                        border: '1.5px solid #FCA5A5',
                        borderRadius: '8px',
                        padding: '14px 16px',
                        marginBottom: '16px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#991B1B', fontWeight: 800, fontSize: '13px' }}>
                        <AlertTriangle size={16} />
                        <span>{t('Returned for Correction', 'সংশোধনের জন্য ফেরত পাঠানো হয়েছে', lang)}</span>
                        <span style={{ fontSize: '11px', color: '#B91C1C', marginLeft: 'auto', fontWeight: 500 }}>
                          {selectedClaim.rejectedBy || 'Audit Approver'} • {selectedClaim.rejectedAt || 'Recent'}
                        </span>
                      </div>

                      <div style={{ marginTop: '8px', fontSize: '12px', color: '#7F1D1D' }}>
                        <strong>{t('Reason:', 'কারণ:', lang)}</strong> {selectedClaim.rejectionReason || 'Voucher Incomplete'}
                      </div>

                      {selectedClaim.rejectionObservation && (
                        <div
                          style={{
                            marginTop: '6px',
                            fontSize: '11.5px',
                            color: '#991B1B',
                            background: 'rgba(255,255,255,0.7)',
                            padding: '6px 10px',
                            borderRadius: '4px',
                            border: '1px solid #FECACA',
                          }}
                        >
                          <strong>{t('Observation:', 'পর্যবেক্ষণ:', lang)}</strong> {selectedClaim.rejectionObservation}
                        </div>
                      )}

                      {selectedClaim.rejectionImprovementNotes && (
                        <div
                          style={{
                            marginTop: '6px',
                            fontSize: '11.5px',
                            color: '#065F46',
                            background: '#ECFDF5',
                            padding: '6px 10px',
                            borderRadius: '4px',
                            border: '1px solid #A7F3D0',
                          }}
                        >
                          <strong>{t('Changes Requested:', 'করণীয় সংশোধন:', lang)}</strong> {selectedClaim.rejectionImprovementNotes}
                        </div>
                      )}

                      <div style={{ marginTop: '12px', textAlign: 'right' }}>
                        <button
                          className="btn-primary"
                          style={{ fontSize: '11.5px', padding: '6px 14px', background: '#059669', borderColor: '#059669', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          onClick={() => handleResubmit(selectedClaim.id)}
                        >
                          <Check size={14} />
                          {t('Resubmit Corrected Claim', 'সংশোধন করে পুনরায় দাখিল করুন', lang)}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Approver Action Controls */}
                  {selectedClaim.status.includes('pending') && (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      {selectedClaim.status === 'pending_hod' && (
                        <button
                          className="btn-primary"
                          style={{ flex: 1 }}
                          onClick={() => handleApprove(selectedClaim.id)}
                        >
                          <Check size={16} /> {t('Verify & Forward to Finance', 'অনুমোদন ও অর্থ বিভাগে প্রেরণ', lang)}
                        </button>
                      )}

                      {selectedClaim.status === 'pending_finance' && (
                        <button
                          className="btn-primary"
                          style={{ flex: 1, background: 'linear-gradient(135deg, #059669 0%, #047857 100%)' }}
                          onClick={() => handleApprove(selectedClaim.id)}
                        >
                          <Check size={16} /> {t('Approve & Issue Voucher', 'পেমেন্ট অনুমোদন ও ভাউচার ইস্যু', lang)}
                        </button>
                      )}

                      <button
                        className="btn-outline-danger"
                        onClick={handleReject}
                      >
                        <X size={16} /> {t('Return with Query', 'জিজ্ঞাসাসহ ফেরত', lang)}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Rejection Modal */}
      {selectedClaim && (
        <RejectionExplanationModal
          isOpen={showRejectModal}
          onClose={() => setShowRejectModal(false)}
          onConfirm={handleConfirmReject}
          lang={lang}
          title={t('Return Travel Claim with Query', 'ভ্রমণ বিল সংশোধনের জন্য ফেরত পাঠান', lang)}
          itemId={selectedClaim.id}
          itemTitle={selectedClaim.purpose}
          requesterName={selectedClaim.claimant}
          department={selectedClaim.dept}
          amount={selectedClaim.amount}
          categoryType="claim"
        />
      )}

      {/* Submit Claim Modal */}
      <SubmitClaimModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        lang={lang}
        onSubmit={handleCreateClaim}
        currentRole={role}
      />
    </div>
  );
}
