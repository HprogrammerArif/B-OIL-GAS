import React, { useState } from 'react';
import { ViewProps, t } from '../types';
import { showToast } from '../App';
import {
  ClipboardCheck, Check, X, CheckSquare, Square, Filter, Search,
  Clock, AlertTriangle, FileText, DollarSign, Car, Calendar,
  ShieldCheck, ArrowRight, Eye, RefreshCw, Sparkles, Building
} from 'lucide-react';

interface ApprovalItem {
  id: string;
  category: 'finance' | 'procurement' | 'fleet' | 'leave' | 'hr';
  title: string;
  titleBn: string;
  requester: string;
  designation: string;
  dept: string;
  amount?: string;
  costTk?: number;
  date: string;
  slaHoursLeft: number;
  urgency: 'critical' | 'high' | 'normal';
  sapDocRef: string;
  details: string;
}

const INITIAL_APPROVAL_ITEMS: ApprovalItem[] = [
  {
    id: 'APR-2026-0894',
    category: 'procurement',
    title: 'Emergency Bitumen Reactor Safety Relief Valves (Class 600)',
    titleBn: 'জরুরি বিটুমিন রিঅ্যাক্টর সেফটি রিলিফ ভালভ সংগ্রহ',
    requester: 'Engr. Tariq Ahmed',
    designation: 'Senior Plant Maintenance Lead',
    dept: 'Plant Maintenance',
    amount: '৳48,50,000',
    costTk: 4850000,
    date: 'Today, 09:30 AM',
    slaHoursLeft: 6,
    urgency: 'critical',
    sapDocRef: 'SAP-PR-2026-90412',
    details: '4 units of High-Pressure Relief Valves required to avert plant shutdown prior to peak asphalt paving season.',
  },
  {
    id: 'APR-2026-1042',
    category: 'finance',
    title: 'TA/DA Tour Claim — Chittagong Depot & Patenga Marine Terminal',
    titleBn: 'টিএ/ডিএ ভ্রমণ বিল — চট্টগ্রাম ডিপো ও পতেঙ্গা টার্মিনাল',
    requester: 'Tanvir Ahmed',
    designation: 'Sr. Sales & Distribution Specialist',
    dept: 'Sales & Distribution',
    amount: '৳14,850',
    costTk: 14850,
    date: 'Yesterday',
    slaHoursLeft: 18,
    urgency: 'normal',
    sapDocRef: 'SAP-FI-CLM-0419',
    details: '4-day dealer quality network inspection and bulk asphalt delivery reconciliation with Peninsula hotel invoices.',
  },
  {
    id: 'APR-2026-0312',
    category: 'fleet',
    title: 'Heavy Duty Pool Car Booking — Baridhara HQ to Keraniganj Plant',
    titleBn: 'অফিসিয়াল পরিবহন বরাদ্দ — হেডকোয়ার্টার হতে প্ল্যান্ট',
    requester: 'Engr. Md. Harunur Rashid',
    designation: 'Plant General Manager',
    dept: 'Plant Operations',
    amount: '৳0 (In-House Fleet)',
    costTk: 0,
    date: 'Today, 10:15 AM',
    slaHoursLeft: 3,
    urgency: 'critical',
    sapDocRef: 'VR-2026-144',
    details: 'Round-trip inspection with French technical delegates from Axens for Euro-V Base Oil project site inspection.',
  },
  {
    id: 'APR-2026-0211',
    category: 'finance',
    title: 'Q4 Natural Gas Industrial Steam Co-Generation Tariff Adjustment',
    titleBn: 'চতুর্থ ত্রৈমাসিক প্রাকৃতিক গ্যাস ইউটিলিটি ট্যারিফ সমন্বয়',
    requester: 'Farida Begum',
    designation: 'CFO & Head of Finance',
    dept: 'Corporate Finance',
    amount: '৳1,20,00,000',
    costTk: 12000000,
    date: '14 Oct 2026',
    slaHoursLeft: 22,
    urgency: 'high',
    sapDocRef: 'SAP-FI-BUD-0211',
    details: 'Refinery steam boiler natural gas tariff recalculation as gazetted by BERC.',
  },
  {
    id: 'APR-2026-0744',
    category: 'leave',
    title: 'Medical Sick Leave — Post-Surgical Recovery (5 Days)',
    titleBn: 'চিকিৎসাজনিত ছুটি — অপারেশন পরবর্তী বিশ্রাম (৫ দিন)',
    requester: 'Rahim Uddin',
    designation: 'Boiler Instrumentation Tech',
    dept: 'Refinery Utilities',
    amount: 'N/A',
    costTk: 0,
    date: 'Today, 08:45 AM',
    slaHoursLeft: 42,
    urgency: 'normal',
    sapDocRef: 'SAP-HCM-LV-089',
    details: 'Official medical certificate from Apollo/Evercare Hospital attached. Shift cover arranged with Kamrul Hasan.',
  },
];

export default function ApprovalsView({ role, lang }: ViewProps) {
  const [items, setItems] = useState<ApprovalItem[]>(INITIAL_APPROVAL_ITEMS);
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
    setItems((prev) => prev.filter((x) => x.id !== item.id));
    setSelectedIds((prev) => prev.filter((x) => x !== item.id));
    showToast(
      t(
        `✓ Authorized ${item.id}: ${item.title}. Synced to SAP S/4HANA (${item.sapDocRef}).`,
        `✓ অনুমোদিত ${item.id}: ${item.titleBn}। এসএপি ডাটাবেজে সিঙ্ক সম্পন্ন (${item.sapDocRef})।`,
        lang
      ),
      'gold'
    );
  };

  const handleRejectSingle = (item: ApprovalItem) => {
    setItems((prev) => prev.filter((x) => x.id !== item.id));
    setSelectedIds((prev) => prev.filter((x) => x !== item.id));
    showToast(
      t(`Returned ${item.id} to ${item.requester} with inquiry note.`, `${item.id} সংশোধনের জন্য ফেরত পাঠানো হয়েছে।`, lang),
      'warn'
    );
  };

  const handleBatchApprove = () => {
    if (selectedIds.length === 0) return;
    const selectedCount = selectedIds.length;
    const totalCost = items
      .filter((i) => selectedIds.includes(i.id))
      .reduce((sum, i) => sum + (i.costTk || 0), 0);

    setItems((prev) => prev.filter((i) => !selectedIds.includes(i.id)));
    setSelectedIds([]);
    showToast(
      t(
        `✓ Batch Approved ${selectedCount} items (৳${totalCost.toLocaleString()} debited). SAP FI/CO Journal Vouchers created.`,
        `✓ একযোগে ${selectedCount}টি আবেদন অনুমোদিত (৳${totalCost.toLocaleString()} কর্তিত)। এসএপিতে ভাউচার প্রস্তুত।`,
        lang
      ),
      'gold'
    );
  };

  const filteredItems = items.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.requester.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.dept.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalPendingCost = items.reduce((sum, i) => sum + (i.costTk || 0), 0);

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
          <div className="stat-value">{items.length}</div>
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
              {t('All Items', 'সকল আবেদন', lang)} ({items.length})
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
