import React, { useState } from 'react';
import {
  X,
  Receipt,
  Plane,
  Car,
  Trophy,
  Calendar,
  MapPin,
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  DollarSign,
  ShieldCheck,
  Building,
  User,
  CreditCard,
  Send,
  Sparkles,
} from 'lucide-react';
import { t } from '../../types';
import { showToast } from '../../App';

export interface ClaimSubmissionData {
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
  status: 'pending_hod';
  dateSubmitted: string;
  items: { desc: string; date: string; amount: number; category: string }[];
}

interface SubmitClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'en' | 'bn';
  onSubmit: (newClaim: ClaimSubmissionData) => void;
}

interface ItemizedExpense {
  id: string;
  date: string;
  category: string;
  desc: string;
  voucherNo: string;
  amount: number;
}

const PURPOSE_PRESETS = [
  {
    type: 'tada' as const,
    label: 'Chittagong Depot Dealer Network Inspection',
    destination: 'Chittagong & Sitakunda Depot',
    mode: 'AC Intercity Bus (Shohoz)',
  },
  {
    type: 'tada' as const,
    label: 'Keraniganj Refinery Turnaround Technical Meeting',
    destination: 'Keraniganj Bitumen Plant',
    mode: 'Company Pool Vehicle',
  },
  {
    type: 'conveyance' as const,
    label: 'Local Client Visits — Motijheel, Tejgaon & Narayanganj Outlets',
    destination: 'Dhaka Metro Area & Narayanganj',
    mode: 'Uber / Local CNG',
  },
  {
    type: 'tour_event' as const,
    label: 'BOGCL Annual Inter-Plant Sports & Cricket Tournament Delegation',
    destination: 'Refinery Ground & Sports Complex',
    mode: 'Chartered AC Bus',
  },
];

export default function SubmitClaimModal({
  isOpen,
  onClose,
  lang,
  onSubmit,
}: SubmitClaimModalProps) {
  const [claimType, setClaimType] = useState<'tada' | 'conveyance' | 'tour_event'>('tada');
  const [purpose, setPurpose] = useState('');
  const [destination, setDestination] = useState('Chittagong & Sitakunda Depot');
  const [startDate, setStartDate] = useState('2026-10-28');
  const [endDate, setEndDate] = useState('2026-10-31');
  const [travelMode, setTravelMode] = useState('AC Intercity Bus / 1st Class Train');
  const [advanceTaken, setAdvanceTaken] = useState<number>(0);

  // Itemized line items
  const [items, setItems] = useState<ItemizedExpense[]>([
    {
      id: 'item-1',
      date: '2026-10-28',
      category: 'Daily Allowance (DA)',
      desc: 'Official Duty DA — Grade 8 Statutory Rate (4 Days @ ৳1,500/day)',
      voucherNo: 'DA-CALC-001',
      amount: 6000,
    },
    {
      id: 'item-2',
      date: '2026-10-29',
      category: 'Hotel Accommodation',
      desc: 'Hotel Peninsula CTG (3 Nights with GST Bill #INV-7729)',
      voucherNo: 'VCH-HTL-7729',
      amount: 7200,
    },
    {
      id: 'item-3',
      date: '2026-10-28',
      category: 'Intercity Travel',
      desc: 'AC Bus Return Ticket (Dhaka – CTG – Dhaka, Shohoz #EB-4491)',
      voucherNo: 'TCK-SHZ-4491',
      amount: 1650,
    },
  ]);

  // Uploaded Vouchers Simulation
  const [vouchers, setVouchers] = useState([
    { name: 'Hotel_Peninsula_GST_Invoice_7729.pdf', size: '1.4 MB' },
    { name: 'Shohoz_AC_Bus_Ticket_EB4491.pdf', size: '420 KB' },
    { name: 'Depot_Gate_Clearance_Slip.jpg', size: '890 KB' },
  ]);

  if (!isOpen) return null;

  // Auto calculate total amount from line items
  const totalAmount = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const netSettlement = claimType === 'tour_event' ? totalAmount - advanceTaken : undefined;

  // Handle adding line item
  const handleAddItem = () => {
    const newItem: ItemizedExpense = {
      id: `item-${Date.now()}`,
      date: startDate || new Date().toISOString().split('T')[0],
      category: claimType === 'conveyance' ? 'Local Conveyance' : 'Food / Incidental',
      desc: claimType === 'conveyance' ? 'Local CNG / Uber Travel' : 'Official Outstation Incidental Expense',
      voucherNo: `VCH-${Math.floor(1000 + Math.random() * 9000)}`,
      amount: 500,
    };
    setItems([...items, newItem]);
  };

  // Handle removing line item
  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      showToast(t('At least one expense line item is required', 'কমপক্ষে একটি খরচের আইটেম আবশ্যক', lang), 'warn');
      return;
    }
    setItems(items.filter((item) => item.id !== id));
  };

  // Handle updating line item
  const handleUpdateItem = (id: string, field: keyof ItemizedExpense, value: any) => {
    setItems(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  // Auto calculate Grade 8 DA
  const handleAutoCalculateDA = () => {
    const days = 4;
    const rate = 1500;
    const daAmount = days * rate;

    const existingDaIndex = items.findIndex((i) => i.category.includes('Daily Allowance') || i.category === 'DA');
    if (existingDaIndex >= 0) {
      const updated = [...items];
      updated[existingDaIndex] = {
        ...updated[existingDaIndex],
        amount: daAmount,
        desc: `Grade 8 DA Entitlement (${days} days @ ৳${rate}/day compliant with Grade Policy)`,
      };
      setItems(updated);
    } else {
      setItems([
        {
          id: `item-${Date.now()}`,
          date: startDate || '2026-10-28',
          category: 'Daily Allowance (DA)',
          desc: `Grade 8 DA Entitlement (${days} days @ ৳${rate}/day compliant with Grade Policy)`,
          voucherNo: `DA-CALC-${Math.floor(100 + Math.random() * 900)}`,
          amount: daAmount,
        },
        ...items,
      ]);
    }
    showToast(t(`✓ Calculated Grade 8 Statutory DA: ৳${daAmount} (4 days)`, `✓ গ্রেড ৮ নির্ধারিত ডিএ হিসাব সম্পন্ন: ৳${daAmount}`, lang), 'success');
  };

  // Apply Preset
  const handleApplyPreset = (preset: typeof PURPOSE_PRESETS[0]) => {
    setClaimType(preset.type);
    setPurpose(preset.label);
    setDestination(preset.destination);
    setTravelMode(preset.mode);
    if (preset.type === 'conveyance') {
      setItems([
        { id: 'item-1', date: '2026-10-02', category: 'Local Conveyance', desc: 'Gulshan HQ to Motijheel BSEC (Uber CNG)', voucherNo: 'UBR-9021', amount: 480 },
        { id: 'item-2', date: '2026-10-05', category: 'Local Conveyance', desc: 'Motijheel to Tejgaon Industrial Zone (Local CNG)', voucherNo: 'CNG-4421', amount: 350 },
        { id: 'item-3', date: '2026-10-08', category: 'Local Conveyance', desc: 'HQ to Narayanganj River Depot & Return (Ride Share)', voucherNo: 'RDS-8812', amount: 1250 },
      ]);
    } else if (preset.type === 'tour_event') {
      setAdvanceTaken(50000);
      setItems([
        { id: 'item-1', date: '2026-10-12', category: 'Event Setup', desc: 'Refinery Ground Preparation, Canopy & Sound System', voucherNo: 'VCH-SPT-101', amount: 25000 },
        { id: 'item-2', date: '2026-10-13', category: 'Sports Kit', desc: 'Player Jerseys & Sports Equipment for 4 Plant Teams', voucherNo: 'VCH-SPT-102', amount: 18500 },
        { id: 'item-3', date: '2026-10-14', category: 'Catering', desc: 'Player Refreshment & Drinking Water Boxes', voucherNo: 'VCH-SPT-103', amount: 14000 },
      ]);
    }
    showToast(t(`Loaded preset: ${preset.label.slice(0, 32)}...`, `প্রিসেট তথ্য লোড করা হয়েছে`, lang), 'info');
  };

  // Handle Form Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!purpose.trim()) {
      showToast(t('Please specify the official purpose of travel', 'দয়া করে ভ্রমণের উদ্দেশ্য লিখুন', lang), 'warn');
      return;
    }
    if (totalAmount <= 0) {
      showToast(t('Claim amount must be greater than zero', 'দাবিকৃত টাকার পরিমাণ শূন্যের বেশি হতে হবে', lang), 'warn');
      return;
    }

    const newId = claimType === 'tada'
      ? `TADA-2026-${Math.floor(1000 + Math.random() * 9000)}`
      : claimType === 'tour_event'
      ? `TOUR-2026-${Math.floor(1000 + Math.random() * 9000)}`
      : `CNV-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const periodStr = claimType === 'conveyance'
      ? 'Oct 01 – Oct 31, 2026'
      : `${startDate} to ${endDate}`;

    const submissionData: ClaimSubmissionData = {
      id: newId,
      claimant: 'Tanvir Ahmed',
      designation: 'Sales Officer, Grade 8',
      dept: 'Sales & Distribution',
      type: claimType,
      purpose,
      destination: claimType === 'conveyance' ? 'Dhaka Metro Area' : destination,
      period: periodStr,
      amount: totalAmount,
      advanceTaken: advanceTaken > 0 ? advanceTaken : undefined,
      netSettlement: netSettlement,
      status: 'pending_hod',
      dateSubmitted: 'Today, Just now',
      items: items.map((it) => ({
        desc: it.desc,
        date: it.date,
        amount: Number(it.amount) || 0,
        category: it.category,
      })),
    };

    onSubmit(submissionData);
    onClose();
  };

  return (
    <div className="modal-bg" onClick={onClose} style={{ zIndex: 99999 }}>
      <div
        className="claims-modal-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ─── 1. MODAL HEADER ─── */}
        <div className="claims-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div className="claims-modal-icon">
              <Receipt size={22} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.2px' }}>
                  {t('Submit TA / DA & Conveyance Expense Claim', 'ভ্রমণ ও যাতায়াত ভাতা দাবি দাখিল', lang)}
                </h3>
                <span style={{ backgroundColor: 'var(--brand-gold, #D4AF37)', color: '#0F172A', fontSize: '10px', fontWeight: 900, padding: '2px 8px', borderRadius: '999px', textTransform: 'uppercase' }}>
                  Grade 8 Active
                </span>
              </div>
              <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#CBD5E1', lineHeight: 1.4 }}>
                {t(
                  'Automated Grade-policy verification with HOD approval and SAP S/4HANA direct BEFTN transfer',
                  'গ্রেড নীতিমালা যাচাই, বিভাগীয় প্রধানের অনুমোদন এবং সরাসরি স্যাপ বিইএফটিএন নিষ্পত্তি',
                  lang
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="claims-modal-close"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* ─── 2. CLAIMANT PROFILE & STATUTORY CEILING STRIP ─── */}
        <div className="claims-modal-profile-strip">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--brand-crimson, #A51C30)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800 }}>
                TA
              </div>
              <div>
                <strong style={{ color: 'var(--brand-slate-900, #0F172A)' }}>Tanvir Ahmed</strong>
                <span style={{ color: 'var(--brand-slate-500, #64748B)', marginLeft: '6px' }}>(Sales Officer, Grade 8)</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--brand-slate-600, #475569)' }}>
              <Building size={14} style={{ color: '#2563EB' }} />
              <span>Dept: <strong>Sales & Distribution</strong></span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--brand-slate-600, #475569)' }}>
              <CreditCard size={14} style={{ color: '#059669' }} />
              <span>Cost Center: <strong style={{ fontFamily: 'monospace' }}>CC-SALES-DHAKA-102</strong></span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#ECFDF5', padding: '4px 10px', borderRadius: '8px', border: '1px solid #A7F3D0', color: '#047857', fontWeight: 700, fontSize: '11px' }}>
            <ShieldCheck size={14} />
            <span>Conveyance Cap: ৳8,000 / mo (৳5,420 Claimed)</span>
          </div>
        </div>

        {/* ─── 3. FORM BODY SCROLLABLE ─── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '20px', boxSizing: 'border-box' }}>
          {/* Section A: Claim Type Cards */}
          <div>
            <label className="form-label" style={{ fontWeight: 800, fontSize: '12px', marginBottom: '8px', display: 'block' }}>
              {t('1. Select Expense Category', '১. খরচের ক্যাটাগরি নির্বাচন করুন', lang)}
            </label>
            <div className="claims-type-cards">
              {/* Option 1: TA/DA */}
              <div
                className={`claims-type-card ${claimType === 'tada' ? 'active' : ''}`}
                onClick={() => setClaimType('tada')}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '13px', color: claimType === 'tada' ? 'var(--brand-crimson, #A51C30)' : undefined }}>
                    <Plane size={18} style={{ color: '#2563EB' }} />
                    <span>TA / DA Tour Expense</span>
                  </div>
                  {claimType === 'tada' && <CheckCircle2 size={16} color="#A51C30" />}
                </div>
                <p style={{ margin: 0, fontSize: '11.5px', color: 'var(--brand-slate-500, #64748B)', lineHeight: 1.4 }}>
                  Outstation official travel, daily allowances, hotel lodging bills & inter-district bus/rail transport.
                </p>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#2563EB', background: '#EFF6FF', padding: '2px 8px', borderRadius: '6px', width: 'fit-content', marginTop: '4px' }}>
                  Statutory DA: ৳1,500 – ৳2,000/day
                </span>
              </div>

              {/* Option 2: Conveyance */}
              <div
                className={`claims-type-card ${claimType === 'conveyance' ? 'active' : ''}`}
                onClick={() => setClaimType('conveyance')}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '13px', color: claimType === 'conveyance' ? 'var(--brand-crimson, #A51C30)' : undefined }}>
                    <Car size={18} style={{ color: '#059669' }} />
                    <span>Monthly Local Conveyance</span>
                  </div>
                  {claimType === 'conveyance' && <CheckCircle2 size={16} color="#A51C30" />}
                </div>
                <p style={{ margin: 0, fontSize: '11.5px', color: 'var(--brand-slate-500, #64748B)', lineHeight: 1.4 }}>
                  Intra-city official movement: Uber, CNG, rickshaw fares, plant courier & factory shuttles.
                </p>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#059669', background: '#ECFDF5', padding: '2px 8px', borderRadius: '6px', width: 'fit-content', marginTop: '4px' }}>
                  Monthly Ceiling: ৳8,000 (Grade 8)
                </span>
              </div>

              {/* Option 3: Tour & Event */}
              <div
                className={`claims-type-card ${claimType === 'tour_event' ? 'active' : ''}`}
                onClick={() => setClaimType('tour_event')}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '13px', color: claimType === 'tour_event' ? 'var(--brand-crimson, #A51C30)' : undefined }}>
                    <Trophy size={18} style={{ color: '#D97706' }} />
                    <span>Tour & Event Advance Settlement</span>
                  </div>
                  {claimType === 'tour_event' && <CheckCircle2 size={16} color="#A51C30" />}
                </div>
                <p style={{ margin: 0, fontSize: '11.5px', color: 'var(--brand-slate-500, #64748B)', lineHeight: 1.4 }}>
                  Corporate events, sports tournament delegation, and plant shutdown advance reconciliation.
                </p>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#D97706', background: '#FFFBEB', padding: '2px 8px', borderRadius: '6px', width: 'fit-content', marginTop: '4px' }}>
                  Treasury Balance Settlement
                </span>
              </div>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div style={{ background: '#F8FAFC', padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--brand-slate-200, #E2E8F0)' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--brand-slate-500, #64748B)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={13} style={{ color: '#D97706' }} />
              <span>{t('Quick Presets / Recent Tour Orders:', 'দ্রুত টেমপ্লেট ও সাম্প্রতিক সফর অর্ডার:', lang)}</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {PURPOSE_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '8px',
                    border: '1px solid var(--brand-slate-300, #CBD5E1)',
                    background: '#FFFFFF',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--brand-slate-700, #334155)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--brand-crimson, #A51C30)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--brand-slate-300, #CBD5E1)'; }}
                >
                  {p.label.split('—')[0].slice(0, 32)}...
                </button>
              ))}
            </div>
          </div>

          {/* Section B: Purpose & Tour Details */}
          <div>
            <div style={{ marginBottom: '14px' }}>
              <label className="form-label" style={{ fontWeight: 800, fontSize: '12px' }}>
                {t('2. Official Purpose & Tour Authorization Reference', '২. দাপ্তরিক উদ্দেশ্য ও ট্যুর অনুমোদন নম্বর', lang)} <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder={
                  claimType === 'tour_event'
                    ? 'e.g. Annual Inter-plant Sports Meet delegation setup or Chittagong Riverine Terminal Technical Delegation'
                    : claimType === 'conveyance'
                    ? 'e.g. Local Client Visits — Motijheel BSEC, Tejgaon & Narayanganj Outlets'
                    : 'e.g. Chittagong Depot Dealer Network Inspection & Quality Audit (Tour Order #TO-2026-904)'
                }
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                required
              />
            </div>

            {claimType !== 'conveyance' && (
              <div className="responsive-col-3" style={{ marginBottom: '14px' }}>
                <div>
                  <label className="form-label">{t('Destination / Location', 'গন্তব্য / স্থান', lang)}</label>
                  <div style={{ position: 'relative' }}>
                    <MapPin size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: '#EF4444' }} />
                    <input
                      type="text"
                      className="form-input"
                      style={{ paddingLeft: '32px' }}
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      placeholder="e.g. Chittagong Depot & Sitakunda Terminal"
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">{t('Start Date', 'শুরুর তারিখ', lang)}</label>
                  <div style={{ position: 'relative' }}>
                    <Calendar size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: '#64748B' }} />
                    <input
                      type="date"
                      className="form-input"
                      style={{ paddingLeft: '32px' }}
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">{t('End Date', 'শেষের তারিখ', lang)}</label>
                  <div style={{ position: 'relative' }}>
                    <Calendar size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: '#64748B' }} />
                    <input
                      type="date"
                      className="form-input"
                      style={{ paddingLeft: '32px' }}
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {claimType === 'tada' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">{t('Authorized Travel Mode (Grade 8 Entitlement)', 'অনুমোদিত বাহন', lang)}</label>
                  <select
                    className="form-select"
                    value={travelMode}
                    onChange={(e) => setTravelMode(e.target.value)}
                  >
                    <option value="AC Intercity Bus / 1st Class Train">AC Intercity Bus / 1st Class Train (Standard Entitlement)</option>
                    <option value="Company Pool Vehicle / Fleet Chauffeur">Company Pool Vehicle / Fleet Chauffeur (Approved Pool)</option>
                    <option value="Economy Domestic Air (HOD Special Approval)">Economy Domestic Air (HOD Special Approval)</option>
                    <option value="Personal Vehicle with Mileage Requisition">Personal Vehicle with Mileage Requisition (৳18/km)</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">{t('Statutory Per Diem Rate', 'দৈনিক ভাতার হার', lang)}</label>
                  <input
                    className="form-input"
                    disabled
                    value="৳1,500 / Day (Dhaka Metro) • ৳2,000 / Day (Outside / Refinery Plant)"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section C: Itemized Expenses Table */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 800, fontSize: '12px', margin: 0 }}>
                  {t('3. Itemized Expense Breakdown & Receipts', '৩. খরচের বিবরণ ও ভাউচার সংযুক্তি', lang)}
                </label>
                <span style={{ fontSize: '11px', color: 'var(--brand-slate-500, #64748B)' }}>
                  Break down individual line items with dates, voucher slip numbers and amounts.
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                {claimType === 'tada' && (
                  <button
                    type="button"
                    onClick={handleAutoCalculateDA}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: '1px solid #BFDBFE',
                      background: '#EFF6FF',
                      color: '#1D4ED8',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Sparkles size={13} />
                    <span>Auto-Calculate DA</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleAddItem}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--brand-slate-300, #CBD5E1)',
                    background: '#FFFFFF',
                    color: 'var(--brand-slate-800, #1E293B)',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Plus size={13} />
                  <span>{t('Add Line Item', 'আইটেম যোগ করুন', lang)}</span>
                </button>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="claims-items-table">
                <thead>
                  <tr>
                    <th style={{ width: '130px' }}>{t('Date', 'তারিখ', lang)}</th>
                    <th style={{ width: '180px' }}>{t('Category', 'ক্যাটাগরি', lang)}</th>
                    <th>{t('Description / Particulars', 'বিবরণ', lang)}</th>
                    <th style={{ width: '130px' }}>{t('Voucher No.', 'ভাউচার নং', lang)}</th>
                    <th style={{ width: '120px', textAlign: 'right' }}>{t('Amount (৳)', 'টাকা', lang)}</th>
                    <th style={{ width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it.id}>
                      <td>
                        <input
                          type="date"
                          value={it.date}
                          onChange={(e) => handleUpdateItem(it.id, 'date', e.target.value)}
                          style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--brand-slate-200, #E2E8F0)', fontSize: '11px', background: 'transparent' }}
                        />
                      </td>
                      <td>
                        <select
                          value={it.category}
                          onChange={(e) => handleUpdateItem(it.id, 'category', e.target.value)}
                          style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--brand-slate-200, #E2E8F0)', fontSize: '11px', background: 'transparent' }}
                        >
                          <option value="Daily Allowance (DA)">Daily Allowance (DA)</option>
                          <option value="Hotel Accommodation">Hotel Accommodation</option>
                          <option value="Intercity Travel">Intercity Travel (Bus/Train/Air)</option>
                          <option value="Local Conveyance">Local Conveyance (CNG/Uber)</option>
                          <option value="Highway Toll & Parking">Highway Toll & Parking</option>
                          <option value="Event Setup">Event Setup / Logistics</option>
                          <option value="Sports Kit">Sports Kit / Uniforms</option>
                          <option value="Catering">Catering & Refreshments</option>
                          <option value="Food / Incidental">Food / Incidental</option>
                        </select>
                      </td>
                      <td>
                        <input
                          type="text"
                          value={it.desc}
                          onChange={(e) => handleUpdateItem(it.id, 'desc', e.target.value)}
                          placeholder="e.g. Hotel Peninsula 3 nights bill"
                          style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--brand-slate-200, #E2E8F0)', fontSize: '11.5px', background: 'transparent', boxSizing: 'border-box' }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={it.voucherNo}
                          onChange={(e) => handleUpdateItem(it.id, 'voucherNo', e.target.value)}
                          placeholder="INV-1234"
                          style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--brand-slate-200, #E2E8F0)', fontSize: '11px', fontFamily: 'monospace', background: 'transparent', boxSizing: 'border-box' }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={it.amount}
                          onChange={(e) => handleUpdateItem(it.id, 'amount', parseFloat(e.target.value) || 0)}
                          style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--brand-slate-200, #E2E8F0)', fontSize: '12px', fontWeight: 700, textAlign: 'right', background: 'transparent', boxSizing: 'border-box' }}
                        />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(it.id)}
                          style={{ border: 'none', background: 'transparent', color: '#94A3B8', cursor: 'pointer', padding: '4px' }}
                          title="Remove item"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section D: Advance Reconciliation (Tour / Event) */}
          {claimType === 'tour_event' && (
            <div style={{ background: '#FFFBEB', padding: '14px 18px', borderRadius: '14px', border: '1.5px solid #FCD34D' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '13px', color: '#92400E', marginBottom: '8px' }}>
                <DollarSign size={16} />
                <span>Advance Reconciliation & Settlement</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#78350F', display: 'block' }}>Total Incurred Expense:</span>
                  <strong style={{ fontSize: '16px', color: '#92400E' }}>৳{totalAmount.toLocaleString()}</strong>
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#78350F', display: 'block', marginBottom: '4px' }}>Advance Received (৳ BDT):</label>
                  <input
                    type="number"
                    value={advanceTaken}
                    onChange={(e) => setAdvanceTaken(parseFloat(e.target.value) || 0)}
                    style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', fontWeight: 800, width: '100%', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ background: '#FFFFFF', padding: '8px 12px', borderRadius: '10px', border: '1px solid #FDE68A' }}>
                  <span style={{ fontSize: '10px', color: '#64748B', display: 'block' }}>Net Settlement Status:</span>
                  {netSettlement && netSettlement >= 0 ? (
                    <strong style={{ fontSize: '14px', color: '#059669' }}>
                      + ৳{netSettlement.toLocaleString()} (Payable to Staff)
                    </strong>
                  ) : (
                    <strong style={{ fontSize: '14px', color: '#D97706' }}>
                      - ৳{Math.abs(netSettlement || 0).toLocaleString()} (Refund to BOGCL Treasury)
                    </strong>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Section E: Receipt Vouchers Attachment Zone */}
          <div>
            <label className="form-label" style={{ fontWeight: 800, fontSize: '12px', marginBottom: '6px', display: 'block' }}>
              {t('4. Supporting Invoices & Vouchers (GST / VAT Compliant)', '৪. ভাউচার ও রসিদ প্রমাণপত্র', lang)}
            </label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
              {vouchers.map((v, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 12px',
                    borderRadius: '10px',
                    background: '#F1F5F9',
                    border: '1px solid var(--brand-slate-200, #E2E8F0)',
                    fontSize: '11px',
                  }}
                >
                  <FileText size={14} style={{ color: '#2563EB' }} />
                  <span style={{ fontWeight: 600, color: 'var(--brand-slate-800, #1E293B)' }}>{v.name}</span>
                  <span style={{ color: '#94A3B8', fontSize: '10px' }}>({v.size})</span>
                  <button
                    type="button"
                    onClick={() => setVouchers(vouchers.filter((_, idx) => idx !== i))}
                    style={{ border: 'none', background: 'transparent', color: '#94A3B8', cursor: 'pointer', padding: '2px' }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div
              style={{
                border: '1.5px dashed var(--brand-slate-300, #CBD5E1)',
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'center',
                background: '#FAFAFA',
                cursor: 'pointer',
              }}
              onClick={() => {
                const sampleName = `Voucher_Slip_${Math.floor(1000 + Math.random() * 9000)}.pdf`;
                setVouchers([...vouchers, { name: sampleName, size: '820 KB' }]);
                showToast(t(`Attached voucher: ${sampleName}`, `ভাউচার সংযুক্ত করা হয়েছে`, lang), 'success');
              }}
            >
              <UploadCloud size={24} style={{ color: '#2563EB', margin: '0 auto 6px' }} />
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand-slate-700, #334155)' }}>
                {t('Click or drag receipts here to attach', 'রসিদ বা ইনভয়েস সংযুক্ত করতে ক্লিক করুন', lang)}
              </div>
              <div style={{ fontSize: '10.5px', color: '#94A3B8', marginTop: '2px' }}>
                PDF, JPG, PNG up to 15MB each (Tax invoice, Shohoz tickets, Uber receipts)
              </div>
            </div>
          </div>
        </div>

        {/* ─── 4. MODAL FOOTER ─── */}
        <div className="claims-modal-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div>
              <span style={{ fontSize: '10.5px', color: 'var(--brand-slate-400, #94A3B8)', display: 'block', textTransform: 'uppercase', fontWeight: 800 }}>
                {t('Total Requisition Claim:', 'মোট দাবি:', lang)}
              </span>
              <strong style={{ fontSize: '20px', fontWeight: 900, color: 'var(--brand-crimson, #A51C30)' }}>
                ৳{totalAmount.toLocaleString()}
              </strong>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#059669', background: '#ECFDF5', padding: '4px 10px', borderRadius: '8px', border: '1px solid #A7F3D0', fontWeight: 700 }}>
              <CheckCircle2 size={14} />
              <span>{items.length} Line Items Verified</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              className="btn-outline"
              onClick={onClose}
              style={{ padding: '8px 18px', fontSize: '12.5px', borderRadius: '10px' }}
            >
              {t('Cancel', 'বাতিল', lang)}
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              className="btn-primary"
              style={{
                padding: '8px 22px',
                fontSize: '12.5px',
                borderRadius: '10px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(165, 28, 48, 0.35)',
              }}
            >
              <Send size={15} />
              <span>{t('Submit Claim for HOD Approval', 'বিভাগীয় প্রধানের অনুমোদনের জন্য দাখিল', lang)}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
