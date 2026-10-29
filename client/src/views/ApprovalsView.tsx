import React, { useState } from 'react';
import { ViewProps, t } from '../types';
import { showToast } from '../App';
import {
  ClipboardCheck, Check, X, CheckSquare, Square, Filter, Search,
  Clock, AlertTriangle, FileText, DollarSign, Car, Calendar,
  ShieldCheck, ArrowRight, Eye, RefreshCw, Sparkles, Building, RotateCcw
} from 'lucide-react';

import { useApprovalStore, ApprovalItem } from '../store/approvalStore';
import { useFleetStore } from '../store/fleetStore';
import RejectionExplanationModal, { RejectionData } from '../components/RejectionExplanationModal';
import AuthorizeDirectiveModal, { AuthorizeData } from '../components/AuthorizeDirectiveModal';

export default function ApprovalsView({ role, lang }: ViewProps) {
  const { approvalItems, approveApprovalItem, rejectApprovalItem, batchApproveItems } = useApprovalStore();
  const { endorseHOD } = useFleetStore();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [itemToReject, setItemToReject] = useState<ApprovalItem | null>(null);
  const [itemToAuthorize, setItemToAuthorize] = useState<ApprovalItem | null>(null);
  const [expandedTrails, setExpandedTrails] = useState<Record<string, boolean>>({});

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleTrail = (id: string) => {
    setExpandedTrails((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const selectAll = () => {
    if (selectedIds.length === filteredItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map((i) => i.id));
    }
  };

  const handleOpenAuthorize = (item: ApprovalItem) => {
    setItemToAuthorize(item);
  };

  const handleConfirmAuthorize = (data: AuthorizeData) => {
    if (!itemToAuthorize) return;
    const reviewer =
      role === 'chairman'
        ? 'Ahmed Akbar Sobhan (Chairman & Managing Director)'
        : 'Farida Begum (CFO & Head of Finance)';

    const res = approveApprovalItem(itemToAuthorize.id, data.directive, reviewer);
    if (itemToAuthorize.sourceType === 'requisition' && itemToAuthorize.sourceId) {
      endorseHOD(itemToAuthorize.sourceId, 'approved');
    }

    setSelectedIds((prev) => prev.filter((x) => x !== itemToAuthorize.id));

    const directiveSnippet =
      data.directive.length > 55 ? `${data.directive.slice(0, 55)}...` : data.directive;

    showToast(
      lang === 'en'
        ? `👑 Authorized ${itemToAuthorize.id} (${itemToAuthorize.amount || 'Approved'}). Directive: "${directiveSnippet}". Synced to SAP (Voucher: ${res.sapVoucher}).`
        : `👑 অনুমোদিত ${itemToAuthorize.id}: বিশেষ নির্দেশনাসহ এসএপিতে পোস্ট করা হয়েছে (${res.sapVoucher})।`,
      'gold'
    );
    setItemToAuthorize(null);
  };

  const handleRejectSingle = (item: ApprovalItem) => {
    setItemToReject(item);
  };

  const handleConfirmReject = (data: RejectionData) => {
    if (!itemToReject) return;
    const reviewer = role === 'chairman' ? 'Ahmed Akbar Sobhan (Chairman & MD)' : 'Farida Begum (HOD Finance)';
    rejectApprovalItem(
      itemToReject.id,
      data.reasonCategory,
      data.observation,
      data.improvementsRequired,
      reviewer
    );
    if (itemToReject.sourceType === 'requisition' && itemToReject.sourceId) {
      endorseHOD(itemToReject.sourceId, 'rejected');
    }
    setSelectedIds((prev) => prev.filter((x) => x !== itemToReject.id));
    showToast(
      t(
        `File ${itemToReject.id} returned to ${itemToReject.requester} with inquiry: "${data.reasonCategory}".`,
        `${itemToReject.id} আপত্তি ও নির্দেশনাসহ ${itemToReject.requester}-এর নিকট ফেরত পাঠানো হয়েছে।`,
        lang
      ),
      'warn'
    );
    setItemToReject(null);
  };

  const handleBatchApprove = () => {
    if (selectedIds.length === 0) return;
    const res = batchApproveItems(selectedIds);
    selectedIds.forEach((id) => {
      const it = approvalItems.find((a) => a.id === id);
      if (it?.sourceType === 'requisition' && it.sourceId) {
        endorseHOD(it.sourceId, 'approved');
      }
    });
    setSelectedIds([]);
    showToast(
      t(
        `✓ Batch Authorized ${res.count} items (৳${res.totalCost.toLocaleString()} debited). SAP FI/CO Journal Vouchers created.`,
        `✓ একযোগে ${res.count}টি আবেদন অনুমোদিত (৳${res.totalCost.toLocaleString()} কর্তিত)। এসএপিতে ভাউচার প্রস্তুত।`,
        lang
      ),
      'gold'
    );
  };

  const filteredItems = approvalItems.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.requester.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.dept.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalPendingCost = approvalItems.reduce((sum, i) => sum + (i.costTk || 0), 0);

  return (
    <div>
      {/* Header */}
      <div className="flex-between mb-4">
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--brand-slate-900)' }}>
            {t('Unified Executive Approval Inbox', 'একীভূত নির্বাহী অনুমোদন ইনবক্স', lang)}
          </h2>
          <p className="text-muted">
            {t(
              'Consolidated Multi-Department Approvals: Procurements, Claims, Fleet & Leaves with 1-Click SAP S/4HANA Sync',
              'সম্মিলিত বিভাগীয় অনুমোদন: ক্রয়, ভ্রমণ ব্যয়, যানবাহন ও ছুটি সমন্বয় এবং সরাসরি এসএপি পোস্টিং',
              lang
            )}
          </p>
        </div>

        <div className="flex-gap">
          {selectedIds.length > 0 && (
            <button
              className="btn-gold"
              style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={handleBatchApprove}
            >
              <Check size={15} />
              {t(`Batch Authorize Selected (${selectedIds.length})`, `নির্বাচিত (${selectedIds.length}) অনুমোদন করুন`, lang)}
            </button>
          )}
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="stats-grid mb-4">
        <div className="stat-card red">
          <div className="stat-top">
            <span className="stat-label">{t('Pending In Queue', 'অনুমোদনের অপেক্ষায়', lang)}</span>
            <div className="stat-icon-wrap"><ClipboardCheck size={16} /></div>
          </div>
          <div className="stat-value">{approvalItems.length}</div>
          <div className="stat-sub">
            <span className="sub-warn">2 Approaching SLA Breach</span>
          </div>
        </div>

        <div className="stat-card gold">
          <div className="stat-top">
            <span className="stat-label">{t('Total Financial Commitment', 'মোট আর্থিক দায়বদ্ধতা', lang)}</span>
            <div className="stat-icon-wrap"><DollarSign size={16} /></div>
          </div>
          <div className="stat-value">৳ {(totalPendingCost / 100000).toFixed(2)}L</div>
          <div className="stat-sub">
            Q4 CAPEX & OPEX Ledger
          </div>
        </div>

        <div className="stat-card green">
          <div className="stat-top">
            <span className="stat-label">{t('SAP ERP Validation', 'এসএপি বৈধতা পরীক্ষা', lang)}</span>
            <div className="stat-icon-wrap"><ShieldCheck size={16} /></div>
          </div>
          <div className="stat-value">100% Valid</div>
          <div className="stat-sub">
            All GL Codes Pre-Audited
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="card mb-4" style={{ padding: '14px 18px' }}>
        <div className="flex-between" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <div className="flex-gap" style={{ flexWrap: 'wrap' }}>
            <button
              className={`btn-sm-ghost ${selectedCategory === 'all' ? 'active' : ''}`}
              style={{ background: selectedCategory === 'all' ? 'var(--brand-crimson)' : 'transparent', color: selectedCategory === 'all' ? '#fff' : 'inherit' }}
              onClick={() => setSelectedCategory('all')}
            >
              {t('All Items', 'সকল আবেদন', lang)} ({approvalItems.length})
            </button>
            <button
              className={`btn-sm-ghost ${selectedCategory === 'procurement' ? 'active' : ''}`}
              style={{ background: selectedCategory === 'procurement' ? 'var(--brand-crimson)' : 'transparent', color: selectedCategory === 'procurement' ? '#fff' : 'inherit' }}
              onClick={() => setSelectedCategory('procurement')}
            >
              {t('Procurement PR', 'ক্রয় অনুমোদন', lang)}
            </button>
            <button
              className={`btn-sm-ghost ${selectedCategory === 'finance' ? 'active' : ''}`}
              style={{ background: selectedCategory === 'finance' ? 'var(--brand-crimson)' : 'transparent', color: selectedCategory === 'finance' ? '#fff' : 'inherit' }}
              onClick={() => setSelectedCategory('finance')}
            >
              {t('TA/DA & Claims', 'টিএ/ডিএ ও ভ্রমণ দাবি', lang)}
            </button>
            <button
              className={`btn-sm-ghost ${selectedCategory === 'fleet' ? 'active' : ''}`}
              style={{ background: selectedCategory === 'fleet' ? 'var(--brand-crimson)' : 'transparent', color: selectedCategory === 'fleet' ? '#fff' : 'inherit' }}
              onClick={() => setSelectedCategory('fleet')}
            >
              {t('Vehicle Requisitions', 'গাড়ির রিকুইজিশন', lang)}
            </button>
            <button
              className={`btn-sm-ghost ${selectedCategory === 'leave' ? 'active' : ''}`}
              style={{ background: selectedCategory === 'leave' ? 'var(--brand-crimson)' : 'transparent', color: selectedCategory === 'leave' ? '#fff' : 'inherit' }}
              onClick={() => setSelectedCategory('leave')}
            >
              {t('Staff Leaves', 'কর্মী ছুটি', lang)}
            </button>
          </div>

          <div style={{ position: 'relative', flex: '1 1 240px', minWidth: '180px' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--brand-slate-400)' }} />
            <input
              type="text"
              className="form-control"
              placeholder={t('Search queue by keyword or requester...', 'অনুসন্ধান...', lang)}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '34px', fontSize: '12px', width: '100%' }}
            />
          </div>
        </div>
      </div>

      {/* Main Approvals Table & Mobile Cards */}
      <div className="card">
        <div className="card-hd flex-between">
          <div className="flex-gap" style={{ alignItems: 'center' }}>
            <button className="btn-sm-ghost" onClick={selectAll} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {selectedIds.length === filteredItems.length && filteredItems.length > 0 ? (
                <CheckSquare size={16} color="var(--brand-crimson)" />
              ) : (
                <Square size={16} />
              )}
              <span>{t('Select All', 'সব নির্বাচন', lang)}</span>
            </button>
            <span className="text-muted" style={{ fontSize: '12px' }}>
              Showing {filteredItems.length} actionable requests
            </span>
          </div>

          <button className="btn-sm-ghost" onClick={() => showToast(t('Syncing live OData approval queue with SAP S/4HANA...', 'এসএপি থেকে রিফ্রেশ হচ্ছে...', lang), 'info')}>
            <RefreshCw size={13} /> {t('Refresh Queue', 'রিফ্রেশ', lang)}
          </button>
        </div>

        <div className="card-body no-padding">
          {/* Desktop Table View (> 768px) */}
          <div className="approvals-desktop-table">
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}></th>
                    <th>{t('Request Details', 'আবেদনের বিবরণ', lang)}</th>
                    <th>{t('Requester & Department', 'আবেদনকারী ও বিভাগ', lang)}</th>
                    <th>{t('Financial Impact', 'আর্থিক পরিমাণ', lang)}</th>
                    <th>{t('SLA & Urgency', 'এসএলএ সময়সীমা', lang)}</th>
                    <th style={{ textAlign: 'right' }}>{t('Authority Action', 'পদক্ষেপ', lang)}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => {
                    const isChecked = selectedIds.includes(item.id);
                    return (
                      <tr key={item.id} className={isChecked ? 'row-selected' : ''}>
                        <td style={{ verticalAlign: 'top', paddingTop: '14px' }}>
                          <button
                            type="button"
                            className="btn-link-plain"
                            onClick={() => toggleSelect(item.id)}
                            style={{ cursor: 'pointer', background: 'transparent', border: 'none' }}
                          >
                            {isChecked ? <CheckSquare size={16} color="var(--brand-crimson)" /> : <Square size={16} color="var(--brand-slate-400)" />}
                          </button>
                        </td>
                        <td style={{ verticalAlign: 'top', paddingTop: '14px' }}>
                          <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--brand-slate-900)' }}>
                            {t(item.title, item.titleBn, lang)}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)', marginTop: '2px', lineHeight: 1.4 }}>
                            Ref: <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{item.id}</span> • {item.details}
                          </div>

                          {/* Departmental Endorsement Trail & Notes (Who approved and why) */}
                          {item.approvalTrail && item.approvalTrail.length > 0 && (
                            <div style={{ marginTop: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <button
                                  type="button"
                                  onClick={() => toggleTrail(item.id)}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    background: expandedTrails[item.id] ? '#EEF2FF' : '#F1F5F9',
                                    color: expandedTrails[item.id] ? '#4338CA' : '#475569',
                                    border: expandedTrails[item.id] ? '1px solid #C7D2FE' : '1px solid #E2E8F0',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                  }}
                                  title={t('Click to inspect detailed departmental notes', 'বিভাগীয় অনুমোদনের কারণ দেখতে ক্লিক করুন', lang)}
                                >
                                  <ShieldCheck size={13} color={expandedTrails[item.id] ? '#4338CA' : '#059669'} />
                                  <span>{t('Endorsement Path', 'বিভাগীয় সুপারিশ খতিয়ান', lang)} ({item.approvalTrail.length} {t('Notes', 'টি নোট', lang)})</span>
                                  <span style={{ fontSize: '9px' }}>{expandedTrails[item.id] ? '▲' : '▼'}</span>
                                </button>

                                {/* Compact inline breadcrumb preview when collapsed */}
                                {!expandedTrails[item.id] && (
                                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '10.5px', color: '#64748B', flexWrap: 'wrap' }}>
                                    {item.approvalTrail.map((st, idx) => (
                                      <React.Fragment key={idx}>
                                        {idx > 0 && <span style={{ color: '#CBD5E1', fontSize: '9px' }}>➔</span>}
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                          <span style={{ width: '13px', height: '13px', borderRadius: '50%', background: '#DCFCE7', color: '#166534', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '8.5px', fontWeight: 800 }}>✓</span>
                                          <strong style={{ color: '#334155' }}>{st.officerName.split(' ')[0]}</strong>
                                          <span style={{ color: '#94A3B8', fontSize: '9.5px' }}>({st.department.split(' ')[0]})</span>
                                        </span>
                                      </React.Fragment>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Expanded Department Justifications & Why Approved */}
                              {expandedTrails[item.id] && (
                                <div
                                  style={{
                                    marginTop: '8px',
                                    background: '#F8FAFC',
                                    border: '1px solid #CBD5E1',
                                    borderRadius: '8px',
                                    padding: '10px 12px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '8px',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                                  }}
                                >
                                  <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 800, color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span>📋</span> {t('Department Endorsement Trail & Approval Justifications:', 'বিভাগীয় সুপারিশ ও অনুমোদনের কারণ:', lang)}
                                  </div>
                                  {item.approvalTrail.map((step, idx) => (
                                    <div
                                      key={idx}
                                      style={{
                                        background: '#FFFFFF',
                                        border: '1px solid #E2E8F0',
                                        borderRadius: '6px',
                                        padding: '8px 10px',
                                        fontSize: '11.5px',
                                      }}
                                    >
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px', flexWrap: 'wrap', gap: '4px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                          <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#DCFCE7', color: '#15803D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800 }}>✓</span>
                                          <strong style={{ color: '#0F172A' }}>{step.officerName}</strong>
                                          <span style={{ color: '#64748B' }}>({step.roleName} · {step.department})</span>
                                        </div>
                                        <span style={{ fontSize: '10px', color: '#94A3B8' }}>{step.timestamp}</span>
                                      </div>
                                      <div style={{ paddingLeft: '22px', color: '#334155', fontStyle: 'italic', lineHeight: 1.45 }}>
                                        "{step.note}"
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td style={{ verticalAlign: 'top', paddingTop: '14px' }}>
                          <strong style={{ fontSize: '12.5px' }}>{item.requester}</strong>
                          <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)' }}>
                            {item.designation} • {item.dept}
                          </div>
                        </td>
                        <td style={{ verticalAlign: 'top', paddingTop: '14px' }}>
                          <strong style={{ fontSize: '13px', color: item.costTk ? 'var(--brand-crimson)' : 'var(--brand-slate-700)' }}>
                            {item.amount || 'N/A'}
                          </strong>
                          <div style={{ fontSize: '10px', fontFamily: 'monospace', color: 'var(--brand-slate-400)' }}>
                            {item.sapDocRef}
                          </div>
                        </td>
                        <td style={{ verticalAlign: 'top', paddingTop: '14px' }}>
                          <span className={`badge ${item.slaHoursLeft < 12 ? 'danger' : item.slaHoursLeft < 24 ? 'warn' : 'info'}`}>
                            <Clock size={11} style={{ marginRight: '4px' }} />
                            {item.slaHoursLeft}h SLA
                          </span>
                          <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-500)', marginTop: '3px' }}>
                            Submitted: {item.date}
                          </div>
                        </td>
                        <td style={{ textAlign: 'right', verticalAlign: 'top', paddingTop: '14px' }}>
                          <div className="flex-gap" style={{ justifyContent: 'flex-end' }}>
                            <button
                              className="btn-sm-ghost"
                              style={{ color: '#DC2626', borderColor: 'rgba(220,38,38,0.2)' }}
                              onClick={() => handleRejectSingle(item)}
                              title={t('Return with Query Note', 'আপত্তিসহ ফেরত', lang)}
                            >
                              <X size={13} />
                            </button>
                            <button
                              className="btn-primary"
                              style={{ padding: '6px 14px', fontSize: '11.5px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '5px' }}
                              onClick={() => handleOpenAuthorize(item)}
                              title={t('Authorize with Executive Directive & Seal', 'অনুমোদন ও নির্দেশিকা প্রদান', lang)}
                            >
                              <Check size={14} />
                              {t('Authorize', 'অনুমোদন', lang)}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards View (<= 768px) */}
          <div className="approvals-mobile-cards">
            {filteredItems.map((item) => {
              const isChecked = selectedIds.includes(item.id);
              return (
                <div key={item.id} className={`approval-mobile-card ${isChecked ? 'selected' : ''}`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        className="btn-link-plain"
                        onClick={() => toggleSelect(item.id)}
                        style={{ cursor: 'pointer', background: 'transparent', border: 'none', padding: 0 }}
                      >
                        {isChecked ? <CheckSquare size={18} color="var(--brand-crimson)" /> : <Square size={18} color="var(--brand-slate-400)" />}
                      </button>
                      <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '11.5px', color: 'var(--brand-crimson)' }}>
                        {item.id}
                      </span>
                    </div>
                    <span className="badge" style={{ fontWeight: 800, fontSize: '11.5px', background: item.costTk ? '#FEE2E2' : '#F1F5F9', color: item.costTk ? '#991B1B' : '#475569' }}>
                      {item.amount || 'N/A'}
                    </span>
                  </div>

                  <div>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--brand-slate-900)' }}>
                      {t(item.title, item.titleBn, lang)}
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--brand-slate-500)', marginTop: '2px', lineHeight: 1.4 }}>
                      {item.details}
                    </div>
                  </div>

                  {/* Mobile Endorsement Trail Accordion */}
                  {item.approvalTrail && item.approvalTrail.length > 0 && (
                    <div style={{ background: '#F8FAFC', borderRadius: '6px', padding: '8px 10px', border: '1px solid #E2E8F0' }}>
                      <button
                        type="button"
                        onClick={() => toggleTrail(item.id)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#4338CA',
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <ShieldCheck size={13} color="#059669" />
                          {t('Department Endorsement Path', 'বিভাগীয় সুপারিশ খতিয়ান', lang)} ({item.approvalTrail.length})
                        </span>
                        <span>{expandedTrails[item.id] ? '▲' : '▼'}</span>
                      </button>

                      {expandedTrails[item.id] && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                          {item.approvalTrail.map((st, idx) => (
                            <div key={idx} style={{ background: '#FFFFFF', padding: '6px 8px', borderRadius: '4px', border: '1px solid #E2E8F0', fontSize: '10.5px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#0F172A' }}>
                                <span>✓ {st.officerName}</span>
                                <span style={{ color: '#94A3B8', fontSize: '9.5px' }}>{st.department}</span>
                              </div>
                              <div style={{ color: '#475569', fontStyle: 'italic', marginTop: '2px' }}>
                                "{st.note}"
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px', fontSize: '11px', color: 'var(--brand-slate-500)', borderTop: '1px solid var(--brand-slate-100)', paddingTop: '8px' }}>
                    <div>
                      <strong style={{ color: 'var(--brand-slate-800)' }}>{item.requester}</strong> · {item.dept}
                    </div>
                    <span className={`badge ${item.slaHoursLeft < 12 ? 'danger' : item.slaHoursLeft < 24 ? 'warn' : 'info'}`} style={{ fontSize: '10px' }}>
                      <Clock size={10} style={{ marginRight: '3px' }} />
                      {item.slaHoursLeft}h SLA
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
                    <button
                      type="button"
                      className="btn-outline"
                      style={{ padding: '8px', fontSize: '11.5px', color: '#DC2626', borderColor: '#FCA5A5', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                      onClick={() => handleRejectSingle(item)}
                    >
                      <X size={14} />
                      {t('Return Query', 'আপত্তি', lang)}
                    </button>
                    <button
                      type="button"
                      className="btn-primary"
                      style={{ padding: '8px', fontSize: '11.5px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                      onClick={() => handleOpenAuthorize(item)}
                    >
                      <Check size={14} />
                      {t('Authorize', 'অনুমোদন', lang)}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Authorize Directive & Executive Sanction Modal */}
      {itemToAuthorize && (
        <AuthorizeDirectiveModal
          isOpen={!!itemToAuthorize}
          onClose={() => setItemToAuthorize(null)}
          onConfirm={handleConfirmAuthorize}
          lang={lang}
          itemId={itemToAuthorize.id}
          itemTitle={itemToAuthorize.title}
          requesterName={itemToAuthorize.requester}
          department={itemToAuthorize.dept}
          amount={itemToAuthorize.amount}
          sapDocRef={itemToAuthorize.sapDocRef}
          approvalTrail={itemToAuthorize.approvalTrail}
          roleTitle={role === 'chairman' ? 'Chairman & Managing Director' : 'CFO & Head of Finance'}
        />
      )}

      {/* Rejection & Inquiry Explanation Modal */}
      {itemToReject && (
        <RejectionExplanationModal
          isOpen={!!itemToReject}
          onClose={() => setItemToReject(null)}
          onConfirm={handleConfirmReject}
          lang={lang}
          title={t('Return Approval Request with Query', 'আপত্তি ও নির্দেশনাসহ আবেদন ফেরত', lang)}
          itemId={itemToReject.id}
          itemTitle={itemToReject.title}
          requesterName={itemToReject.requester}
          department={itemToReject.dept}
          amount={itemToReject.amount}
          categoryType={
            itemToReject.sourceType === 'claim'
              ? 'claim'
              : itemToReject.sourceType === 'requisition'
              ? 'requisition'
              : itemToReject.sourceType === 'notesheet'
              ? 'notesheet'
              : 'general'
          }
        />
      )}
    </div>
  );
}
