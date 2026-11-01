import { useMemo, useState } from 'react';
import { ViewProps, t } from '../types';
import { showToast } from '../components/ToastManager';
import {
  Receipt, Plus, CheckCircle, AlertTriangle, Download,
  FileText, ArrowLeft, Check, X, Banknote, Inbox
} from 'lucide-react';
import SubmitClaimModal, { ClaimSubmissionData } from '../components/claims/SubmitClaimModal';
import RejectionExplanationModal, { RejectionData } from '../components/RejectionExplanationModal';
import { useApprovalStore, ClaimItem } from '../store/approvalStore';
import { EmptyState, StatusPill } from '../components/ui';
import {
  CLAIM_STATUS, CLAIM_TYPE, type ClaimsFilter, actionFor, applyFilter, daysWaiting, isMine, isOverdue, isPending, useClaimsScope,
} from './claims/config';

const GRADE_POLICY = [
  { grade: 'Grade 1-2 (Chairman / MD / C-Suite)', daDhaka: 'Actuals / ৳5,000', daDistrict: 'Actuals / ৳6,000', hotelLimit: '5-Star / Direct Billing', travelMode: 'Executive Car / Domestic Air' },
  { grade: 'Grade 3-4 (General Manager / Plant GM)', daDhaka: '৳3,500', daDistrict: '৳4,500', hotelLimit: '৳8,000 / night', travelMode: 'Company Car / Domestic Air' },
  { grade: 'Grade 5-6 (HOD / Senior Specialist / Manager)', daDhaka: '৳2,500', daDistrict: '৳3,200', hotelLimit: '৳5,500 / night', travelMode: 'Assigned Pool Car / AC Train' },
  { grade: 'Grade 7-8 (Officer / Engineer / Supervisor)', daDhaka: '৳1,500', daDistrict: '৳2,000', hotelLimit: '৳3,000 / night', travelMode: 'AC Intercity Bus / 1st Class Train' },
  { grade: 'Grade 9-10 (Junior Tech / Driver / Staff)', daDhaka: '৳800', daDistrict: '৳1,200', hotelLimit: '৳1,800 / night', travelMode: 'Standard Bus / Train' },
];

export default function ClaimsView({ role, lang }: ViewProps) {
  const { claims, addClaim, updateClaimStatus, rejectClaim, resubmitClaim, settleClaim } = useApprovalStore();
  const { user, visible, canViewAll, isApprover } = useClaimsScope(claims);
  const [activeTab, setActiveTab] = useState<'claims' | 'policy'>('claims');
  const [filter, setFilter] = useState<ClaimsFilter>(isApprover ? 'awaiting_me' : 'all');
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<'list' | 'detail'>('list');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  const filteredClaims = useMemo(
    () => (user ? applyFilter(visible, filter, user) : []),
    [visible, filter, user],
  );
  const selectedClaim = filteredClaims.find(c => c.id === selectedClaimId) ?? visible.find(c => c.id === selectedClaimId) ?? filteredClaims[0] ?? null;
  const setSelectedClaim = (claim: ClaimItem | null) => setSelectedClaimId(claim ? claim.id : null);
  const action = selectedClaim && user ? actionFor(selectedClaim, user) : null;
  const selectedIsMine = !!selectedClaim && !!user && isMine(selectedClaim, user);
  const reviewer = user ? `${user.name} (${user.label})` : '';

  const counts = useMemo(() => {
    const open = visible.filter(isPending);
    return {
      awaitingMe: user ? visible.filter((c) => { const a = actionFor(c, user); return a !== null && a !== 'resubmit'; }).length : 0,
      openCount: open.length,
      openAmount: open.reduce((s, c) => s + c.amount, 0),
      overdue: visible.filter(isOverdue).length,
      paymentDue: visible.filter((c) => c.status === 'approved'),
      paid: visible.filter((c) => c.status === 'settled'),
      returned: visible.filter((c) => c.status === 'rejected').length,
    };
  }, [visible, user]);

  const handleVerify = (id: string) => {
    updateClaimStatus(id, 'pending_finance', undefined, reviewer);
    showToast(
      t(`Claim ${id} verified and forwarded to Finance.`, `দাবি ${id} যাচাই করে অর্থ বিভাগে পাঠানো হয়েছে।`, lang),
      'success'
    );
  };

  const handleApprove = (id: string) => {
    updateClaimStatus(id, 'approved', undefined, reviewer);
    const voucher = claims.find((c) => c.id === id)?.sapVoucher;
    showToast(
      t(`Claim ${id} approved${voucher ? ` · voucher ${voucher}` : ''}.`, `দাবি ${id} অনুমোদিত${voucher ? ` · ভাউচার ${voucher}` : ''}।`, lang),
      'success'
    );
  };

  const handleSettle = (id: string) => {
    settleClaim(id);
    showToast(t(`Claim ${id} marked as paid.`, `দাবি ${id} পরিশোধিত হিসেবে চিহ্নিত।`, lang), 'success');
  };

  const handleReject = () => {
    setShowRejectModal(true);
  };

  const handleConfirmReject = (data: RejectionData) => {
    if (!selectedClaim) return;

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
      t(`Claim ${claimId} revised and resubmitted for approval.`, `দাবি ${claimId} সংশোধন করে পুনরায় দাখিল করা হয়েছে।`, lang),
      'success'
    );
  };

  const handleCreateClaim = (data: ClaimSubmissionData) => {
    const newClaim = addClaim(data);
    setSelectedClaimId(newClaim.id);
    setActiveTab('claims');
    setFilter(isApprover ? 'mine' : 'all');
    showToast(
      t(`Claim ${data.id} submitted for approval.`, `দাবি ${data.id} অনুমোদনের জন্য দাখিল করা হয়েছে।`, lang),
      'success'
    );
  };

  const handleExportCSV = () => {
    const headers = ['Claim ID', 'Claimant', 'Department', 'Type', 'Amount (BDT)', 'Status', 'Date', 'Purpose'];
    const rows = visible.map(c => [
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
    showToast(t('Claims exported as CSV.', 'দাবির তালিকা সিএসভি হিসেবে ডাউনলোড হয়েছে।', lang), 'success');
  };

  const getStatusBadge = (claim: ClaimItem) => {
    const meta = CLAIM_STATUS[claim.status];
    return (
      <span style={{ display: 'inline-flex', gap: 4, flexWrap: 'wrap' }}>
        <StatusPill tone={meta.tone}>{t(...meta.label, lang)}</StatusPill>
        {isOverdue(claim) && <StatusPill tone="danger">{t(`${daysWaiting(claim)} d overdue`, `${daysWaiting(claim)} দিন বিলম্বিত`, lang)}</StatusPill>}
      </span>
    );
  };

  const typeBadge = (type: ClaimItem['type'], small = false) => (
    <StatusPill tone={CLAIM_TYPE[type].tone} className={small ? 'ui-pill-sm' : ''}>{t(...CLAIM_TYPE[type].label, lang)}</StatusPill>
  );

  if (!user) return null;

  const FILTERS: { id: ClaimsFilter; label: [string, string]; count: number; show: boolean }[] = [
    { id: 'awaiting_me', label: ['Awaiting me', 'আমার অপেক্ষায়'], count: counts.awaitingMe, show: isApprover },
    { id: 'all', label: canViewAll ? ['All claims', 'সকল দাবি'] : ['My claims', 'আমার দাবি'], count: visible.length, show: true },
    { id: 'mine', label: ['Mine', 'আমার'], count: visible.filter((c) => isMine(c, user)).length, show: canViewAll },
    { id: 'open', label: ['Open', 'চলমান'], count: counts.openCount + counts.returned, show: true },
    { id: 'paid', label: ['Approved & paid', 'অনুমোদিত ও পরিশোধিত'], count: counts.paymentDue.length + counts.paid.length, show: true },
  ];

  return (
    <div className="view-container">
      {/* Top Header */}
      <div className="section-header">
        <div>
          <h2 className="section-title">
            {t('Expense claims', 'ব্যয় দাবি', lang)}
          </h2>
          <p className="section-subtitle">
            {canViewAll
              ? t('Travel (TA/DA), local conveyance and event settlements across the company, with the decisions you owe.', 'কোম্পানিজুড়ে ভ্রমণ (টিএ/ডিএ), স্থানীয় যাতায়াত ও ইভেন্ট নিষ্পত্তি এবং আপনার করণীয় সিদ্ধান্ত।', lang)
              : t('Your travel, conveyance and event claims, from submission to payment.', 'আপনার ভ্রমণ, যাতায়াত ও ইভেন্ট দাবি — জমা থেকে পরিশোধ পর্যন্ত।', lang)}
          </p>
        </div>
        <div className="btn-group">
          <button className="btn-primary" onClick={() => setShowSubmitModal(true)}>
            <Plus size={15} /> {t('New claim', 'নতুন দাবি', lang)}
          </button>
          {canViewAll && (
            <button className="btn-outline" onClick={handleExportCSV}>
              <Download size={15} /> {t('Export CSV', 'সিএসভি ডাউনলোড', lang)}
            </button>
          )}
        </div>
      </div>

      {/* KPI Stat Cards (computed from the claims in scope) */}
      <div className="kpi-grid mb-5">
        {isApprover ? (
          <div className="kpi-card">
            <div className="kpi-label">{t('Awaiting my decision', 'আমার সিদ্ধান্তের অপেক্ষায়', lang)}</div>
            <div className={`kpi-value ${counts.awaitingMe ? 'text-amber' : ''}`}>{counts.awaitingMe}</div>
            <div className="kpi-sub">{t(`${counts.overdue} overdue (> 5 days)`, `${counts.overdue}টি বিলম্বিত (৫ দিনের বেশি)`, lang)}</div>
          </div>
        ) : (
          <div className="kpi-card">
            <div className="kpi-label">{t('In approval', 'অনুমোদনাধীন', lang)}</div>
            <div className="kpi-value text-amber">৳{counts.openAmount.toLocaleString('en-IN')}</div>
            <div className="kpi-sub">{t(`${counts.openCount} claim(s) pending`, `${counts.openCount}টি দাবি অপেক্ষমাণ`, lang)}</div>
          </div>
        )}
        <div className="kpi-card">
          <div className="kpi-label">{isApprover ? t('Open value', 'চলমান মূল্য', lang) : canViewAll ? t('Returned for correction', 'সংশোধনের জন্য ফেরত', lang) : t('Returned to me', 'আমার কাছে ফেরত', lang)}</div>
          <div className={`kpi-value ${!isApprover && counts.returned ? 'text-amber' : ''}`}>{isApprover ? `৳${counts.openAmount.toLocaleString('en-IN')}` : counts.returned}</div>
          <div className="kpi-sub">{isApprover ? t(`${counts.openCount} claim(s) in approval`, `${counts.openCount}টি দাবি অনুমোদনাধীন`, lang) : t('Needs correction and resubmission', 'সংশোধন ও পুনরায় দাখিল প্রয়োজন', lang)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">{t('Approved, payment due', 'অনুমোদিত, পরিশোধ বাকি', lang)}</div>
          <div className="kpi-value text-blue">৳{counts.paymentDue.reduce((s, c) => s + c.amount, 0).toLocaleString('en-IN')}</div>
          <div className="kpi-sub">{t(`${counts.paymentDue.length} voucher(s) issued`, `${counts.paymentDue.length}টি ভাউচার জারি`, lang)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">{t('Paid this month', 'এ মাসে পরিশোধিত', lang)}</div>
          <div className="kpi-value text-emerald">৳{counts.paid.reduce((s, c) => s + c.amount, 0).toLocaleString('en-IN')}</div>
          <div className="kpi-sub">{t(`${counts.paid.length} claim(s) settled`, `${counts.paid.length}টি দাবি নিষ্পন্ন`, lang)}</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="pill-tabs mb-4">
        {FILTERS.filter((f) => f.show).map((f) => (
          <button
            key={f.id}
            className={`pill-tab ${activeTab === 'claims' && filter === f.id ? 'active' : ''}`}
            onClick={() => { setActiveTab('claims'); setFilter(f.id); }}
          >
            {t(...f.label, lang)} ({f.count})
          </button>
        ))}
        <button className={`pill-tab ${activeTab === 'policy' ? 'active' : ''}`} onClick={() => setActiveTab('policy')}>
          {t('Allowance policy', 'ভাতা নীতিমালা', lang)}
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
                                {typeBadge(item.type)}
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
                            <td>{getStatusBadge(item)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {filteredClaims.length === 0 && (
                    <EmptyState
                      compact
                      icon={<Inbox size={22} />}
                      title={filter === 'awaiting_me' ? t('Nothing awaiting your decision', 'আপনার সিদ্ধান্তের অপেক্ষায় কিছু নেই', lang) : t('No claims in this view', 'এই তালিকায় কোনো দাবি নেই', lang)}
                      description={filter === 'awaiting_me' ? t('New claims routed to you will appear here.', 'আপনার কাছে পাঠানো নতুন দাবি এখানে দেখা যাবে।', lang) : t('Submit a claim or change the filter.', 'নতুন দাবি জমা দিন বা ফিল্টার পরিবর্তন করুন।', lang)}
                    />
                  )}
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
                          {typeBadge(item.type, true)}
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
                        {getStatusBadge(item)}
                      </div>
                    </div>
                  ))}
                  {filteredClaims.length === 0 && (
                    <EmptyState
                      compact
                      icon={<Inbox size={22} />}
                      title={t('No claims in this view', 'এই তালিকায় কোনো দাবি নেই', lang)}
                    />
                  )}
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
                      <div className="card-subtitle">{selectedClaim.claimant}{selectedIsMine ? ` (${t('you', 'আপনি', lang)})` : ''} · {selectedClaim.designation} · {t('Submitted', 'জমা', lang)} {selectedClaim.dateSubmitted}</div>
                    </div>
                  </div>
                  {getStatusBadge(selectedClaim)}
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
                      <div style={{ fontSize: '12px', color: 'var(--brand-slate-400)' }}>{t('Single-line claim, no itemisation', 'একক দাবি, বিস্তারিত বিভাজন নেই', lang)}</div>
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
                        <span style={{ color: (selectedClaim.netSettlement || 0) >= 0 ? 'var(--status-success-text)' : 'var(--status-danger)' }}>
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
                    <div style={{ background: 'var(--status-success-bg)', border: '1px solid var(--status-success-border)', padding: '10px 14px', borderRadius: '6px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                      <CheckCircle size={16} color="var(--status-success)" />
                      <div>
                        <strong>{t('Payment voucher', 'পেমেন্ট ভাউচার', lang)}:</strong> <code>{selectedClaim.sapVoucher}</code>
                        {selectedClaim.status === 'settled' && selectedClaim.settledAt && (
                          <span style={{ color: 'var(--status-success-text)' }}> · {t('paid', 'পরিশোধিত', lang)} {selectedClaim.settledAt}</span>
                        )}
                        {selectedClaim.status === 'approved' && (
                          <span style={{ color: 'var(--text-3)' }}> · {t('bank transfer pending', 'ব্যাংক ট্রান্সফার বাকি', lang)}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {isPending(selectedClaim) && (
                    <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginBottom: 14, display: 'flex', gap: 6, alignItems: 'center' }}>
                      <Banknote size={13} />
                      {selectedClaim.status === 'pending_hod'
                        ? t('Step 1 of 2 · awaiting department head verification', 'ধাপ ১/২ · বিভাগীয় প্রধানের যাচাইয়ের অপেক্ষায়', lang)
                        : t('Step 2 of 2 · awaiting finance approval and voucher', 'ধাপ ২/২ · অর্থ বিভাগের অনুমোদন ও ভাউচারের অপেক্ষায়', lang)}
                      {daysWaiting(selectedClaim) > 0 && ` · ${t(`${daysWaiting(selectedClaim)} day(s) waiting`, `${daysWaiting(selectedClaim)} দিন অপেক্ষমাণ`, lang)}`}
                    </div>
                  )}

                  {/* Rejection / Query Callout */}
                  {selectedClaim.status === 'rejected' && (
                    <div
                      style={{
                        background: 'var(--status-danger-bg)',
                        border: '1.5px solid var(--status-danger-bright)',
                        borderRadius: '8px',
                        padding: '14px 16px',
                        marginBottom: '16px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--status-danger-text)', fontWeight: 800, fontSize: '13px' }}>
                        <AlertTriangle size={16} />
                        <span>{t('Returned for Correction', 'সংশোধনের জন্য ফেরত পাঠানো হয়েছে', lang)}</span>
                        <span style={{ fontSize: '11px', color: 'var(--status-danger-text)', marginLeft: 'auto', fontWeight: 500 }}>
                          {selectedClaim.rejectedBy ?? t('Approver', 'অনুমোদনকারী', lang)}{selectedClaim.rejectedAt ? ` • ${selectedClaim.rejectedAt}` : ''}
                        </span>
                      </div>

                      <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--status-danger-text)' }}>
                        <strong>{t('Reason:', 'কারণ:', lang)}</strong> {selectedClaim.rejectionReason ?? t('Not specified', 'উল্লেখ নেই', lang)}
                      </div>

                      {selectedClaim.rejectionObservation && (
                        <div
                          style={{
                            marginTop: '6px',
                            fontSize: '11.5px',
                            color: 'var(--status-danger-text)',
                            background: 'var(--surface-1)',
                            padding: '6px 10px',
                            borderRadius: '4px',
                            border: '1px solid var(--status-danger-border)',
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
                            color: 'var(--status-success-text)',
                            background: 'var(--status-success-bg)',
                            padding: '6px 10px',
                            borderRadius: '4px',
                            border: '1px solid var(--status-success-border)',
                          }}
                        >
                          <strong>{t('Changes Requested:', 'করণীয় সংশোধন:', lang)}</strong> {selectedClaim.rejectionImprovementNotes}
                        </div>
                      )}

                      {action === 'resubmit' && (
                        <div style={{ marginTop: '12px', textAlign: 'right' }}>
                          <button
                            className="btn-primary"
                            style={{ fontSize: '11.5px', padding: '6px 14px', background: 'var(--status-success-solid)', borderColor: 'var(--status-success)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            onClick={() => handleResubmit(selectedClaim.id)}
                          >
                            <Check size={14} />
                            {t('Resubmit corrected claim', 'সংশোধন করে পুনরায় দাখিল করুন', lang)}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Decision controls — only for the officer whose step it is, never on your own claim */}
                  {(action === 'verify' || action === 'approve') && (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      {action === 'verify' && (
                        <button className="btn-primary" style={{ flex: 1 }} onClick={() => handleVerify(selectedClaim.id)}>
                          <Check size={16} /> {t('Verify & forward to Finance', 'যাচাই ও অর্থ বিভাগে প্রেরণ', lang)}
                        </button>
                      )}
                      {action === 'approve' && (
                        <button
                          className="btn-primary"
                          style={{ flex: 1, background: 'linear-gradient(135deg, var(--status-success-solid) 0%, var(--status-success-solid-dark) 100%)' }}
                          onClick={() => handleApprove(selectedClaim.id)}
                        >
                          <Check size={16} /> {t('Approve & issue voucher', 'অনুমোদন ও ভাউচার ইস্যু', lang)}
                        </button>
                      )}
                      <button className="btn-outline-danger" onClick={handleReject}>
                        <X size={16} /> {t('Return with query', 'জিজ্ঞাসাসহ ফেরত', lang)}
                      </button>
                    </div>
                  )}
                  {action === 'settle' && (
                    <button className="btn-primary" style={{ width: '100%' }} onClick={() => handleSettle(selectedClaim.id)}>
                      <Banknote size={16} /> {t('Mark as paid', 'পরিশোধিত হিসেবে চিহ্নিত করুন', lang)}
                    </button>
                  )}
                  {action === null && isPending(selectedClaim) && (
                    <div style={{ fontSize: 12, color: 'var(--text-3)', padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 8 }}>
                      {selectedIsMine
                        ? t('Your claim is with the approver. You will see the decision here.', 'আপনার দাবি অনুমোদনকারীর কাছে আছে। সিদ্ধান্ত এখানে দেখা যাবে।', lang)
                        : t('Read-only: this claim is decided by another approver.', 'শুধু দেখার জন্য: এই দাবির সিদ্ধান্ত অন্য অনুমোদনকারী নেবেন।', lang)}
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
