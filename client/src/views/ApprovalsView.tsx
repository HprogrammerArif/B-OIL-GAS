import React, { useState } from 'react';
import { ViewProps, t, ROLE_META } from '../types';
import { showToast } from '../App';
import {
  ClipboardCheck, Check, X, CheckSquare, Square, Search,
  Clock, DollarSign, ShieldCheck, RefreshCw, FileText
} from 'lucide-react';

import { useApprovalStore, ApprovalItem } from '../store/approvalStore';
import { useFleetStore } from '../store/fleetStore';
import RejectionExplanationModal, { RejectionData } from '../components/RejectionExplanationModal';
import AuthorizeDirectiveModal, { AuthorizeData } from '../components/AuthorizeDirectiveModal';

export default function ApprovalsView({ role, lang }: ViewProps) {
  const { approvalItems, decidedItems, approveApprovalItem, rejectApprovalItem, batchApproveItems } = useApprovalStore();
  const { endorseHOD } = useFleetStore();

  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
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
    const actor = ROLE_META[role] || ROLE_META.hod;
    const reviewer = `${actor.name} (${actor.label})`;

    const res = approveApprovalItem(itemToAuthorize.id, data.directive, reviewer);
    if (itemToAuthorize.sourceType === 'requisition' && itemToAuthorize.sourceId) {
      endorseHOD(itemToAuthorize.sourceId, 'approved');
    }

    setSelectedIds((prev) => prev.filter((x) => x !== itemToAuthorize.id));

    showToast(
      lang === 'en'
        ? `✓ Approved ${itemToAuthorize.id} (${itemToAuthorize.amount || 'Approved'}). Voucher Reference: ${res.sapVoucher}.`
        : `✓ অনুমোদিত ${itemToAuthorize.id}: ভাউচার প্রস্তুত (${res.sapVoucher})।`,
      'gold'
    );
    setItemToAuthorize(null);
  };

  const handleRejectSingle = (item: ApprovalItem) => {
    setItemToReject(item);
  };

  const handleConfirmReject = (data: RejectionData) => {
    if (!itemToReject) return;
    const actor = ROLE_META[role] || ROLE_META.hod;
    const reviewer = `${actor.name} (${actor.label})`;

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
        `File ${itemToReject.id} returned to ${itemToReject.requester} with query: "${data.reasonCategory}".`,
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
        `✓ Batch approved ${res.count} items (৳${res.totalCost.toLocaleString()} authorized). Official vouchers created.`,
        `✓ একযোগে ${res.count}টি আবেদন অনুমোদিত (৳${res.totalCost.toLocaleString()})। ভাউচার প্রস্তুত।`,
        lang
      ),
      'gold'
    );
  };

  const listToDisplay = activeTab === 'pending' ? approvalItems : decidedItems;

  const filteredItems = listToDisplay.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      item.title.toLowerCase().includes(q) ||
      item.requester.toLowerCase().includes(q) ||
      item.id.toLowerCase().includes(q) ||
      item.dept.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const totalPendingCost = approvalItems.reduce((sum, i) => sum + (i.costTk || 0), 0);

  return (
    <div>
      {/* Header */}
      <div className="flex-between mb-4">
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--brand-slate-900)' }}>
            {t('Executive Document & Expense Approvals', 'নির্বাহী অনুমোদন ইনবক্স ও ব্যবস্থাপনা', lang)}
          </h2>
          <p className="text-muted">
            {t(
              'Review and approve purchase requests, expense claims, vehicle requisitions, and leave applications.',
              'ক্রয় আবেদন, ভ্রমণ বিল, গাড়ির রিকুইজিশন এবং ছুটির আবেদন পর্যালোচনা ও অনুমোদন করুন।',
              lang
            )}
          </p>
        </div>

        <div className="flex-gap">
          {activeTab === 'pending' && selectedIds.length > 0 && (
            <button
              className="btn-gold"
              style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={handleBatchApprove}
            >
              <Check size={15} />
              {t(`Batch Approve (${selectedIds.length})`, `নির্বাচিত (${selectedIds.length}) অনুমোদন`, lang)}
            </button>
          )}
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="stats-grid mb-4">
        <div className="stat-card red">
          <div className="stat-top">
            <span className="stat-label">{t('Pending In Queue', 'অনুমোদনের অপেক্ষায়', lang)}</span>
            <div className="stat-icon-wrap"><ClipboardCheck size={16} /></div>
          </div>
          <div className="stat-value">{approvalItems.length}</div>
          <div className="stat-sub">
            <span className="sub-warn">Action Required</span> • Awaiting Review
          </div>
        </div>

        <div className="stat-card gold">
          <div className="stat-top">
            <span className="stat-label">{t('Total Financial Value', 'মোট আর্থিক পরিমাণ', lang)}</span>
            <div className="stat-icon-wrap"><DollarSign size={16} /></div>
          </div>
          <div className="stat-value">৳ {(totalPendingCost / 100000).toFixed(2)}L</div>
          <div className="stat-sub">
            Approved under current quarter budget
          </div>
        </div>

        <div className="stat-card green">
          <div className="stat-top">
            <span className="stat-label">{t('Completed Approvals', 'নিষ্পন্ন অনুমোদন', lang)}</span>
            <div className="stat-icon-wrap"><ShieldCheck size={16} /></div>
          </div>
          <div className="stat-value">{decidedItems.length}</div>
          <div className="stat-sub">
            Archived in audit history
          </div>
        </div>
      </div>

      {/* Top Tab Bar: Pending vs History */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
        <button
          className={`btn-sm-ghost ${activeTab === 'pending' ? 'active-filter' : ''}`}
          style={{
            fontSize: '12px',
            padding: '7px 16px',
            background: activeTab === 'pending' ? 'var(--brand-crimson)' : 'transparent',
            color: activeTab === 'pending' ? '#fff' : 'var(--brand-slate-600)',
            borderColor: activeTab === 'pending' ? 'var(--brand-crimson)' : 'var(--brand-slate-200)',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
          onClick={() => setActiveTab('pending')}
        >
          <ClipboardCheck size={14} />
          {t('Actionable Pending Requests', 'অপেক্ষমাণ আবেদনসমূহ', lang)}
          <span style={{ background: activeTab === 'pending' ? 'rgba(255,255,255,0.25)' : 'var(--brand-slate-200)', color: activeTab === 'pending' ? '#fff' : 'var(--brand-slate-800)', padding: '1px 6px', borderRadius: '10px', fontSize: '10px' }}>
            {approvalItems.length}
          </span>
        </button>

        <button
          className={`btn-sm-ghost ${activeTab === 'history' ? 'active-filter' : ''}`}
          style={{
            fontSize: '12px',
            padding: '7px 16px',
            background: activeTab === 'history' ? 'var(--brand-slate-900)' : 'transparent',
            color: activeTab === 'history' ? 'var(--brand-gold)' : 'var(--brand-slate-600)',
            borderColor: activeTab === 'history' ? 'var(--brand-gold)' : 'var(--brand-slate-200)',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
          onClick={() => setActiveTab('history')}
        >
          <FileText size={14} />
          {t('Approval History & Archive', 'অনুমোদন খতিয়ান ও ইতিহাস', lang)}
          <span style={{ background: activeTab === 'history' ? 'rgba(212,175,55,0.3)' : 'var(--brand-slate-200)', color: activeTab === 'history' ? '#fff' : 'var(--brand-slate-800)', padding: '1px 6px', borderRadius: '10px', fontSize: '10px' }}>
            {decidedItems.length}
          </span>
        </button>
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
              {t('All Categories', 'সকল ক্যাটাগরি', lang)} ({listToDisplay.length})
            </button>
            <button
              className={`btn-sm-ghost ${selectedCategory === 'procurement' ? 'active' : ''}`}
              style={{ background: selectedCategory === 'procurement' ? 'var(--brand-crimson)' : 'transparent', color: selectedCategory === 'procurement' ? '#fff' : 'inherit' }}
              onClick={() => setSelectedCategory('procurement')}
            >
              {t('Procurement & Spares', 'ক্রয় ও খুচরা যন্ত্রাংশ', lang)}
            </button>
            <button
              className={`btn-sm-ghost ${selectedCategory === 'finance' ? 'active' : ''}`}
              style={{ background: selectedCategory === 'finance' ? 'var(--brand-crimson)' : 'transparent', color: selectedCategory === 'finance' ? '#fff' : 'inherit' }}
              onClick={() => setSelectedCategory('finance')}
            >
              {t('Travel & Expense Claims', 'ভ্রমণ ও যাতায়াত বিল', lang)}
            </button>
            <button
              className={`btn-sm-ghost ${selectedCategory === 'fleet' ? 'active' : ''}`}
              style={{ background: selectedCategory === 'fleet' ? 'var(--brand-crimson)' : 'transparent', color: selectedCategory === 'fleet' ? '#fff' : 'inherit' }}
              onClick={() => setSelectedCategory('fleet')}
            >
              {t('Vehicle Requisitions', 'গাড়ির আবেদন', lang)}
            </button>
            <button
              className={`btn-sm-ghost ${selectedCategory === 'leave' ? 'active' : ''}`}
              style={{ background: selectedCategory === 'leave' ? 'var(--brand-crimson)' : 'transparent', color: selectedCategory === 'leave' ? '#fff' : 'inherit' }}
              onClick={() => setSelectedCategory('leave')}
            >
              {t('Staff Leave', 'ছুটির আবেদন', lang)}
            </button>
          </div>

          <div style={{ position: 'relative', flex: '1 1 240px', minWidth: '180px' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--brand-slate-400)' }} />
            <input
              type="text"
              className="form-control"
              placeholder={t('Search by requester, ID, title...', 'নাম বা বিষয় দিয়ে খুঁজুন...', lang)}
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
            {activeTab === 'pending' && (
              <button className="btn-sm-ghost" onClick={selectAll} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {selectedIds.length === filteredItems.length && filteredItems.length > 0 ? (
                  <CheckSquare size={16} color="var(--brand-crimson)" />
                ) : (
                  <Square size={16} />
                )}
                <span>{t('Select All', 'সব নির্বাচন', lang)}</span>
              </button>
            )}
            <span className="text-muted" style={{ fontSize: '12px' }}>
              Showing {filteredItems.length} requests
            </span>
          </div>

          <button className="btn-sm-ghost" onClick={() => showToast(t('Queue refreshed.', 'তালিকা রিফ্রেশ হয়েছে।', lang), 'info')}>
            <RefreshCw size={13} /> {t('Refresh', 'রিফ্রেশ', lang)}
          </button>
        </div>

        <div className="card-body no-padding">
          {filteredItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px', color: 'var(--brand-slate-400)' }}>
              {activeTab === 'pending'
                ? t('No pending approvals matching criteria.', 'কোনো অপেক্ষমাণ আবেদন নেই।', lang)
                : t('No historical records found.', 'কোনো ইতিহাস পাওয়া যায়নি।', lang)}
            </div>
          ) : (
            <div className="approvals-desktop-table">
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      {activeTab === 'pending' && <th style={{ width: '40px' }}></th>}
                      <th>{t('Request Details', 'আবেদনের বিবরণ', lang)}</th>
                      <th>{t('Requester & Department', 'আবেদনকারী ও বিভাগ', lang)}</th>
                      <th>{t('Amount', 'পরিমাণ', lang)}</th>
                      <th>{t('Time / Status', 'সময় ও অবস্থা', lang)}</th>
                      <th style={{ textAlign: 'right' }}>{t('Action', 'পদক্ষেপ', lang)}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item) => {
                      const isChecked = selectedIds.includes(item.id);
                      return (
                        <tr key={item.id} className={isChecked ? 'row-selected' : ''}>
                          {activeTab === 'pending' && (
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
                          )}
                          <td style={{ verticalAlign: 'top', paddingTop: '14px' }}>
                            <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--brand-slate-900)' }}>
                              {t(item.title, item.titleBn, lang)}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)', marginTop: '2px', lineHeight: 1.4 }}>
                              Ref: <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{item.id}</span> • {item.details}
                            </div>

                            {/* Endorsement Trail */}
                            {item.approvalTrail && item.approvalTrail.length > 0 && (
                              <div style={{ marginTop: '8px' }}>
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
                                    border: '1px solid #E2E8F0',
                                    cursor: 'pointer',
                                  }}
                                >
                                  <ShieldCheck size={13} color="#059669" />
                                  <span>{t('Review History', 'অনুমোদন খতিয়ান', lang)} ({item.approvalTrail.length})</span>
                                  <span style={{ fontSize: '9px' }}>{expandedTrails[item.id] ? '▲' : '▼'}</span>
                                </button>

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
                                    }}
                                  >
                                    {item.approvalTrail.map((step, idx) => (
                                      <div key={idx} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '8px 10px', fontSize: '11.5px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                                          <div>
                                            <strong style={{ color: '#0F172A' }}>✓ {step.officerName}</strong>
                                            <span style={{ color: '#64748B', marginLeft: '6px' }}>({step.roleName} · {step.department})</span>
                                          </div>
                                          <span style={{ fontSize: '10px', color: '#94A3B8' }}>{step.timestamp}</span>
                                        </div>
                                        <div style={{ color: '#334155', fontStyle: 'italic', paddingLeft: '14px' }}>
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
                            {activeTab === 'pending' ? (
                              <>
                                <span className={`badge ${item.slaHoursLeft < 12 ? 'danger' : item.slaHoursLeft < 24 ? 'warn' : 'info'}`}>
                                  <Clock size={11} style={{ marginRight: '4px' }} />
                                  {item.slaHoursLeft}h left
                                </span>
                                <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-500)', marginTop: '3px' }}>
                                  Submitted: {item.date}
                                </div>
                              </>
                            ) : (
                              <span className="badge success">
                                ✓ Approved
                              </span>
                            )}
                          </td>

                          <td style={{ textAlign: 'right', verticalAlign: 'top', paddingTop: '14px' }}>
                            {activeTab === 'pending' ? (
                              <div className="flex-gap" style={{ justifyContent: 'flex-end' }}>
                                <button
                                  className="btn-sm-ghost"
                                  style={{ color: '#DC2626', borderColor: 'rgba(220,38,38,0.2)' }}
                                  onClick={() => handleRejectSingle(item)}
                                  title={t('Return with Query', 'আপত্তিসহ ফেরত', lang)}
                                >
                                  <X size={13} />
                                </button>
                                <button
                                  className="btn-primary"
                                  style={{ padding: '6px 14px', fontSize: '11.5px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '5px' }}
                                  onClick={() => handleOpenAuthorize(item)}
                                >
                                  <Check size={14} />
                                  {t('Approve', 'অনুমোদন', lang)}
                                </button>
                              </div>
                            ) : (
                              <span style={{ fontSize: '11px', color: '#059669', fontWeight: 700 }}>
                                Completed
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Authorize Directive Modal */}
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
          roleTitle={ROLE_META[role]?.label || 'Executive Approver'}
          signerName={ROLE_META[role]?.name || 'Executive Signer'}
        />
      )}

      {/* Rejection Modal */}
      {itemToReject && (
        <RejectionExplanationModal
          isOpen={!!itemToReject}
          onClose={() => setItemToReject(null)}
          onConfirm={handleConfirmReject}
          lang={lang}
          title={t('Return Request with Query', 'আপত্তি ও নির্দেশনাসহ আবেদন ফেরত', lang)}
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
