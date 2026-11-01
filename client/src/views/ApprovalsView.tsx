import { useState } from 'react';
import { ViewProps, t } from '../types';
import { showToast } from '../components/ToastManager';
import {
  ClipboardCheck, Check, X, CheckSquare, Square, Search,
  Clock, DollarSign, ShieldCheck, RefreshCw, FileText, Inbox
} from 'lucide-react';

import { useApprovalStore, ApprovalItem } from '../store/approvalStore';
import { useCan } from '../auth/session';
import { CATEGORY_LABELS, useMyApprovalQueue } from './approvals/config';
import { EmptyState } from '../components/ui';
import RejectionExplanationModal, { RejectionData } from '../components/RejectionExplanationModal';
import AuthorizeDirectiveModal, { AuthorizeData } from '../components/AuthorizeDirectiveModal';

export default function ApprovalsView({ lang }: ViewProps) {
  const canDecide = useCan('approvals:decide');
  const { approveApprovalItem, rejectApprovalItem, batchApproveItems } = useApprovalStore();
  const { user, config: cfg, pending: approvalItems, decided: decidedItems } = useMyApprovalQueue();

  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [itemToReject, setItemToReject] = useState<ApprovalItem | null>(null);
  const [itemToAuthorize, setItemToAuthorize] = useState<ApprovalItem | null>(null);
  const [expandedTrails, setExpandedTrails] = useState<Record<string, boolean>>({});

  const categories = cfg?.categories ?? [];
  const canBatch = canDecide && (cfg?.canBatch ?? false);
  const reviewer = user ? `${user.name} (${user.label})` : '';

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
    if (!itemToAuthorize || !user) return;

    const res = approveApprovalItem(itemToAuthorize.id, data.directive, reviewer, user.role);
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
    if (!itemToReject || !user) return;

    rejectApprovalItem(
      itemToReject.id,
      data.reasonCategory,
      data.observation,
      data.improvementsRequired,
      reviewer,
      user.role
    );
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
    if (selectedIds.length === 0 || !user) return;
    const res = batchApproveItems(selectedIds, user.role);
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
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-1)' }}>
            {cfg ? t(cfg.title[0], cfg.title[1], lang) : t('Approvals', 'অনুমোদন', lang)}
          </h2>
          <p className="text-muted">
            {cfg
              ? t(cfg.description[0], cfg.description[1], lang)
              : t('You do not have an approval queue.', 'আপনার কোনো অনুমোদন তালিকা নেই।', lang)}
          </p>
        </div>

        <div className="flex-gap">
          {activeTab === 'pending' && canBatch && selectedIds.length > 0 && (
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
            {approvalItems.some((i) => i.slaHoursLeft < 12)
              ? <><span className="sub-warn">{t('Due within 12 hours', '১২ ঘণ্টার মধ্যে', lang)}</span> • {approvalItems.filter((i) => i.slaHoursLeft < 12).length}</>
              : t('Within service level', 'নির্ধারিত সময়সীমার মধ্যে', lang)}
          </div>
        </div>

        <div className="stat-card gold">
          <div className="stat-top">
            <span className="stat-label">{t('Value awaiting decision', 'সিদ্ধান্তের অপেক্ষায় থাকা অর্থ', lang)}</span>
            <div className="stat-icon-wrap"><DollarSign size={16} /></div>
          </div>
          <div className="stat-value">৳ {(totalPendingCost / 100000).toFixed(2)}L</div>
          <div className="stat-sub">
            {t('Across all pending files in your queue', 'আপনার তালিকার সকল অপেক্ষমাণ নথি', lang)}
          </div>
        </div>

        <div className="stat-card green">
          <div className="stat-top">
            <span className="stat-label">{t('Decided by you', 'আপনার নিষ্পন্ন সিদ্ধান্ত', lang)}</span>
            <div className="stat-icon-wrap"><ShieldCheck size={16} /></div>
          </div>
          <div className="stat-value">{decidedItems.length}</div>
          <div className="stat-sub">
            {decidedItems.filter((d) => d.decisionStatus === 'rejected').length > 0
              ? t(`${decidedItems.filter((d) => d.decisionStatus === 'rejected').length} returned with query`, `${decidedItems.filter((d) => d.decisionStatus === 'rejected').length}টি আপত্তিসহ ফেরত`, lang)
              : t('All approved', 'সব অনুমোদিত', lang)}
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
            color: activeTab === 'pending' ? 'var(--text-on-brand)' : 'var(--brand-slate-600)',
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
          <span style={{ background: activeTab === 'pending' ? 'color-mix(in srgb, var(--text-on-brand) 25%, transparent)' : 'var(--brand-slate-200)', color: activeTab === 'pending' ? 'var(--text-on-brand)' : 'var(--brand-slate-800)', padding: '1px 6px', borderRadius: '10px', fontSize: '10px' }}>
            {approvalItems.length}
          </span>
        </button>

        <button
          className={`btn-sm-ghost ${activeTab === 'history' ? 'active-filter' : ''}`}
          style={{
            fontSize: '12px',
            padding: '7px 16px',
            background: activeTab === 'history' ? 'var(--surface-selected)' : 'transparent',
            color: activeTab === 'history' ? 'var(--text-on-selected)' : 'var(--brand-slate-600)',
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
          <span style={{ background: activeTab === 'history' ? 'color-mix(in srgb, var(--text-on-selected) 20%, transparent)' : 'var(--brand-slate-200)', color: activeTab === 'history' ? 'var(--text-on-selected)' : 'var(--brand-slate-800)', padding: '1px 6px', borderRadius: '10px', fontSize: '10px' }}>
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
              style={{ background: selectedCategory === 'all' ? 'var(--brand-crimson)' : 'transparent', color: selectedCategory === 'all' ? 'var(--text-on-brand)' : 'inherit' }}
              onClick={() => setSelectedCategory('all')}
            >
              {t('All', 'সব', lang)} ({listToDisplay.length})
            </button>
            {categories.map((cat) => {
              const count = listToDisplay.filter((i) => i.category === cat).length;
              return (
                <button
                  key={cat}
                  className={`btn-sm-ghost ${selectedCategory === cat ? 'active' : ''}`}
                  style={{ background: selectedCategory === cat ? 'var(--brand-crimson)' : 'transparent', color: selectedCategory === cat ? 'var(--text-on-brand)' : 'inherit' }}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {t(CATEGORY_LABELS[cat][0], CATEGORY_LABELS[cat][1], lang)}{count > 0 ? ` (${count})` : ''}
                </button>
              );
            })}
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
            {activeTab === 'pending' && canBatch && (
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
              {t(`Showing ${filteredItems.length} of ${listToDisplay.length}`, `${listToDisplay.length}টির মধ্যে ${filteredItems.length}টি দেখানো হচ্ছে`, lang)}
            </span>
          </div>

          <button className="btn-sm-ghost" onClick={() => showToast(t('Queue is up to date.', 'তালিকা হালনাগাদ আছে।', lang), 'info')}>
            <RefreshCw size={13} /> {t('Refresh', 'রিফ্রেশ', lang)}
          </button>
        </div>

        <div className="card-body no-padding">
          {filteredItems.length === 0 ? (
            <EmptyState
              icon={<Inbox size={20} />}
              title={activeTab === 'pending'
                ? t('Nothing waiting for you', 'আপনার জন্য কিছু অপেক্ষমাণ নেই', lang)
                : t('No decisions recorded yet', 'এখনও কোনো সিদ্ধান্ত নথিভুক্ত হয়নি', lang)}
              description={activeTab === 'pending'
                ? (searchQuery || selectedCategory !== 'all'
                  ? t('Try clearing the search or category filter.', 'অনুসন্ধান বা ক্যাটাগরি ফিল্টার মুছে দেখুন।', lang)
                  : t('New files routed to you will appear here.', 'আপনার কাছে পাঠানো নতুন নথি এখানে দেখা যাবে।', lang))
                : t('Approved and returned files will be archived here.', 'অনুমোদিত ও ফেরত পাঠানো নথি এখানে সংরক্ষিত থাকবে।', lang)}
            />
          ) : (
            <div className="approvals-desktop-table">
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      {activeTab === 'pending' && canBatch && <th style={{ width: '40px' }}></th>}
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
                          {activeTab === 'pending' && canBatch && (
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
                            <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-1)' }}>
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
                                    background: expandedTrails[item.id] ? 'var(--status-purple-bg)' : 'var(--surface-2)',
                                    color: expandedTrails[item.id] ? 'var(--status-purple-text)' : 'var(--text-2)',
                                    border: '1px solid var(--border-1)',
                                    cursor: 'pointer',
                                  }}
                                >
                                  <ShieldCheck size={13} color="var(--status-success)" />
                                  <span>{t('Review History', 'অনুমোদন খতিয়ান', lang)} ({item.approvalTrail.length})</span>
                                  <span style={{ fontSize: '9px' }}>{expandedTrails[item.id] ? '▲' : '▼'}</span>
                                </button>

                                {expandedTrails[item.id] && (
                                  <div
                                    style={{
                                      marginTop: '8px',
                                      background: 'var(--surface-0)',
                                      border: '1px solid var(--border-2)',
                                      borderRadius: '8px',
                                      padding: '10px 12px',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: '8px',
                                    }}
                                  >
                                    {item.approvalTrail.map((step, idx) => (
                                      <div key={idx} style={{ background: 'var(--surface-1)', border: '1px solid var(--border-1)', borderRadius: '6px', padding: '8px 10px', fontSize: '11.5px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                                          <div>
                                            <strong style={{ color: 'var(--text-1)' }}>✓ {step.officerName}</strong>
                                            <span style={{ color: 'var(--text-3)', marginLeft: '6px' }}>({step.roleName} · {step.department})</span>
                                          </div>
                                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{step.timestamp}</span>
                                        </div>
                                        <div style={{ color: 'var(--text-2)', fontStyle: 'italic', paddingLeft: '14px' }}>
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
                                  {t('Submitted', 'দাখিল', lang)}: {item.date}
                                </div>
                              </>
                            ) : item.decisionStatus === 'rejected' ? (
                              <>
                                <span className="badge warn">{t('Returned with query', 'আপত্তিসহ ফেরত', lang)}</span>
                                <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-500)', marginTop: '3px' }}>
                                  {item.rejectedAt}{item.rejectionReason ? ` • ${item.rejectionReason}` : ''}
                                </div>
                              </>
                            ) : (
                              <>
                                <span className="badge success">✓ {t('Approved', 'অনুমোদিত', lang)}</span>
                                <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-500)', marginTop: '3px' }}>
                                  {item.authorizedAt}{item.sapVoucher ? ` • ${item.sapVoucher}` : ''}
                                </div>
                              </>
                            )}
                          </td>

                          <td style={{ textAlign: 'right', verticalAlign: 'top', paddingTop: '14px' }}>
                            {activeTab === 'pending' ? (
                              canDecide ? (
                                <div className="flex-gap" style={{ justifyContent: 'flex-end' }}>
                                  <button
                                    className="btn-sm-ghost"
                                    style={{ color: 'var(--status-danger)', borderColor: 'var(--status-danger-border)' }}
                                    onClick={() => handleRejectSingle(item)}
                                    title={t('Return with Query', 'আপত্তিসহ ফেরত', lang)}
                                    aria-label={t('Return with Query', 'আপত্তিসহ ফেরত', lang)}
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
                                <span className="badge info">{t('View only', 'শুধু দেখার জন্য', lang)}</span>
                              )
                            ) : (
                              <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>
                                {item.decisionStatus === 'rejected'
                                  ? t('Returned by', 'ফেরত পাঠিয়েছেন', lang)
                                  : t('Approved by', 'অনুমোদন করেছেন', lang)}
                                <div style={{ fontWeight: 700, color: 'var(--text-1)' }}>{item.decisionStatus === 'rejected' ? item.rejectedBy : item.authorizedBy}</div>
                              </div>
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
          roleTitle={user?.label ?? ''}
          signerName={user?.name ?? ''}
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
