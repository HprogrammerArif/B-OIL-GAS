import React, { useState } from 'react';
import { ViewProps, t } from '../types';
import { showToast } from '../App';
import {
  ClipboardCheck, Check, X, CheckSquare, Square, Filter, Search,
  Clock, AlertTriangle, FileText, DollarSign, Car, Calendar,
  ShieldCheck, ArrowRight, Eye, RefreshCw, Sparkles, Building
} from 'lucide-react';

import { useApprovalStore, ApprovalItem } from '../store/approvalStore';
import { useFleetStore } from '../store/fleetStore';

export default function ApprovalsView({ role, lang }: ViewProps) {
  const { approvalItems, approveApprovalItem, rejectApprovalItem, batchApproveItems } = useApprovalStore();
  const { endorseHOD } = useFleetStore();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const selectAll = () => {
    if (selectedIds.length === filteredItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map((i) => i.id));
    }
  };

  const handleApproveSingle = (item: ApprovalItem) => {
    const res = approveApprovalItem(item.id);
    if (item.sourceType === 'requisition' && item.sourceId) {
      endorseHOD(item.sourceId, 'approved');
    }
    setSelectedIds((prev) => prev.filter((x) => x !== item.id));
    showToast(
      t(
        `✓ Authorized ${item.id}: ${item.title}. Synced to SAP S/4HANA (Voucher: ${res.sapVoucher}).`,
        `✓ অনুমোদিত ${item.id}: ${item.titleBn}। এসএপি ডাটাবেজে সিঙ্ক সম্পন্ন (${res.sapVoucher})।`,
        lang
      ),
      'gold'
    );
  };

  const handleRejectSingle = (item: ApprovalItem) => {
    rejectApprovalItem(item.id);
    if (item.sourceType === 'requisition' && item.sourceId) {
      endorseHOD(item.sourceId, 'rejected');
    }
    setSelectedIds((prev) => prev.filter((x) => x !== item.id));
    showToast(
      t(`Returned ${item.id} to ${item.requester} with inquiry note.`, `${item.id} সংশোধনের জন্য ফেরত পাঠানো হয়েছে।`, lang),
      'warn'
    );
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

          <div style={{ position: 'relative', width: '260px' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--brand-slate-400)' }} />
            <input
              type="text"
              className="form-control"
              placeholder={t('Search queue by keyword or requester...', 'অনুসন্ধান...', lang)}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '34px', fontSize: '12px' }}
            />
          </div>
        </div>
      </div>

      {/* Main Approvals Table */}
      <div className="card">
        <div className="card-hd flex-between">
          <div className="flex-gap">
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
                      <td>
                        <button
                          type="button"
                          className="btn-link-plain"
                          onClick={() => toggleSelect(item.id)}
                          style={{ cursor: 'pointer', background: 'transparent', border: 'none' }}
                        >
                          {isChecked ? <CheckSquare size={16} color="var(--brand-crimson)" /> : <Square size={16} color="var(--brand-slate-400)" />}
                        </button>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--brand-slate-900)' }}>
                          {t(item.title, item.titleBn, lang)}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)', marginTop: '2px' }}>
                          Ref: <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{item.id}</span> • {item.details}
                        </div>
                      </td>
                      <td>
                        <strong style={{ fontSize: '12.5px' }}>{item.requester}</strong>
                        <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)' }}>
                          {item.designation} • {item.dept}
                        </div>
                      </td>
                      <td>
                        <strong style={{ fontSize: '13px', color: item.costTk ? 'var(--brand-crimson)' : 'var(--brand-slate-700)' }}>
                          {item.amount || 'N/A'}
                        </strong>
                        <div style={{ fontSize: '10px', fontFamily: 'monospace', color: 'var(--brand-slate-400)' }}>
                          {item.sapDocRef}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${item.slaHoursLeft < 12 ? 'danger' : item.slaHoursLeft < 24 ? 'warn' : 'info'}`}>
                          <Clock size={11} style={{ marginRight: '4px' }} />
                          {item.slaHoursLeft}h SLA
                        </span>
                        <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-500)', marginTop: '3px' }}>
                          Submitted: {item.date}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="flex-gap" style={{ justifyContent: 'flex-end' }}>
                          <button
                            className="btn-sm-ghost"
                            style={{ color: '#DC2626', borderColor: 'rgba(220,38,38,0.2)' }}
                            onClick={() => handleRejectSingle(item)}
                            title="Return with note"
                          >
                            <X size={13} />
                          </button>
                          <button
                            className="btn-primary"
                            style={{ padding: '5px 12px', fontSize: '11.5px', fontWeight: 700 }}
                            onClick={() => handleApproveSingle(item)}
                          >
                            <Check size={13} />
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
      </div>
    </div>
  );
}
