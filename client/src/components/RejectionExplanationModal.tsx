import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, RotateCcw, AlertTriangle, FileText, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Lang, t } from '../types';

export interface RejectionData {
  reasonCategory: string;
  observation: string;
  improvementsRequired: string;
  notifySms: boolean;
}

interface RejectionExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: RejectionData) => void;
  lang: Lang;
  title?: string;
  itemId: string;
  itemTitle: string;
  requesterName?: string;
  department?: string;
  amount?: string | number;
  categoryType: 'claim' | 'notesheet' | 'requisition' | 'asset' | 'general';
}

const CATEGORY_PRESETS: Record<string, { label: string; labelBn: string; defaultAdvice: string }[]> = {
  claim: [
    {
      label: 'Missing Original VAT Vouchers & Receipts',
      labelBn: 'মূল ভ্যাট রসিদ ও ভাউচার অনুপস্থিত',
      defaultAdvice: 'Please attach scanned copies of original BIN-registered tax invoices and stamped conveyance slips.',
    },
    {
      label: 'Per Diem / Hotel Tariff Exceeds Grade Limit',
      labelBn: 'দৈনিক ভাতা বা হোটেল খরচ পদমর্যাদা সীমা অতিক্রম করেছে',
      defaultAdvice: 'Adjust hotel bill or daily allowance to adhere strictly to BOGCL Grade Travel Policy ceilings.',
    },
    {
      label: 'Tour Authorization Letter Not Attached',
      labelBn: 'দাপ্তরিক সফর পূর্বানুমোদন পত্র সংযুক্ত নেই',
      defaultAdvice: 'Attach official HOD/GM pre-approved tour sanction memo and travel itinerary before resubmission.',
    },
    {
      label: 'Duplicate / Overlapping Route Mileage Claimed',
      labelBn: 'একই দূরত্বের দ্বৈত বা অতিরিক্ত ভ্রমণ বিল দাখিল',
      defaultAdvice: 'Reconcile local conveyance distance with standard Google Maps corridor odometer calculations.',
    },
    {
      label: 'Non-Compliant Mode of Transit',
      labelBn: 'অননুমোদিত ভ্রমণ মাধ্যম ব্যবহার',
      defaultAdvice: 'Provide written administrative justification why company pool vehicle or approved transit class was not utilized.',
    },
  ],
  notesheet: [
    {
      label: 'Budget Justification & Capex GL Account Mismatch',
      labelBn: 'বাজেট ন্যায্যতা ও সিএপিইএক্স জিএল অ্যাকাউন্ট অসঙ্গতি',
      defaultAdvice: 'Reconcile with Finance & Accounts department to ensure required GL Head balance exists in Q4 OPEX/CAPEX allocation.',
    },
    {
      label: 'Vendor Quotations Lack 3 Competitive OEM Bids',
      labelBn: 'দরপত্রে ন্যূনতম ৩টি অনুমোদিত প্রস্তুতকারক বিড নেই',
      defaultAdvice: 'Submit 3 formal competitive tender quotations from authorized OEM distributors with comparative vetting matrix.',
    },
    {
      label: 'Technical Clarification Required on ASME/API Spec',
      labelBn: 'কারিগরি ও নিরাপত্তা স্পেসিফিকেশন স্পষ্টীকরণ প্রয়োজন',
      defaultAdvice: 'Obtain engineering sign-off from Keraniganj Plant Technical Services on pressure/temperature ratings.',
    },
    {
      label: 'DoE / Explosives Statutory Certificate Missing',
      labelBn: 'পরিবেশ বা বিস্ফোরক পরিদপ্তরের সংবিধিবদ্ধ ছাড়পত্র অনুপস্থিত',
      defaultAdvice: 'Attach valid statutory clearance certificate or inspection permit prior to procurement commitment.',
    },
    {
      label: 'Commercial Price Revision / Payment Terms Adjustment',
      labelBn: 'বাণিজ্যিক মূল্য বা পরিশোধের শর্তাবলী পুনর্বিবেচনা',
      defaultAdvice: 'Negotiate minimum 90-day deferred credit term or 5% advance retention warranty clause with vendor.',
    },
  ],
  requisition: [
    {
      label: 'All Pool Sedans Occupied for Emergency Plant Duty',
      labelBn: 'জরুরি কারখানা ডিউটিতে সকল কোম্পানির গাড়ি নিয়োজিত',
      defaultAdvice: 'Reschedule travel time or submit pooled ride request with colleagues heading along the same highway corridor.',
    },
    {
      label: 'Destination Covered by Company Staff Bus Route',
      labelBn: 'গন্তব্যটি নিয়মিত কোম্পানির স্টাফ বাস রুটের অন্তর্ভুক্ত',
      defaultAdvice: 'Utilize Route 01 or Route 04 scheduled staff transit coaches unless transporting heavy official cargo.',
    },
    {
      label: 'Official Duty Purpose Insufficiently Detailed',
      labelBn: 'অফিসিয়াল কাজের বিবরণ সুনির্দিষ্ট নয়',
      defaultAdvice: 'Provide detailed client meeting schedule or plant work order reference in requisition narrative.',
    },
  ],
  asset: [
    {
      label: 'Calibration Certificate Expired / Uncertified',
      labelBn: 'সরঞ্জামের ক্যালিব্রেশন সনদ মেয়াদোত্তীর্ণ',
      defaultAdvice: 'Submit certified BSTI or ISO 17025 laboratory calibration test report before work order approval.',
    },
    {
      label: 'Vibration & Thermal Wear Exceeds Safety Margin',
      labelBn: 'কম্পন ও তাপমাত্রা মান নিরাপত্তা সীমা অতিক্রম করেছে',
      defaultAdvice: 'Perform non-destructive ultrasonic testing (NDT) and include maintenance engineer diagnostic log.',
    },
    {
      label: 'Preventive Maintenance Checksheet Incomplete',
      labelBn: 'নিয়মিত প্রতিরোধমূলক রক্ষণাবেক্ষণ চেকশিট অসম্পূর্ণ',
      defaultAdvice: 'Fill all 14 checklist points including lubricant grade and electrical megger insulation resistance.',
    },
  ],
  general: [
    {
      label: 'Incomplete Documentation',
      labelBn: 'অসম্পূর্ণ কাগজপত্র ও প্রমাণাদি',
      defaultAdvice: 'Please furnish all requisite supporting documents, vouchers, and previous approval references.',
    },
    {
      label: 'Administrative Review Required',
      labelBn: 'প্রশাসনিক পর্যালোচনা ও সুপারিশ প্রয়োজন',
      defaultAdvice: 'Review and revise with immediate departmental supervisor before resubmitting for executive sanction.',
    },
  ],
};

export default function RejectionExplanationModal({
  isOpen,
  onClose,
  onConfirm,
  lang,
  title,
  itemId,
  itemTitle,
  requesterName,
  department,
  amount,
  categoryType,
}: RejectionExplanationModalProps) {
  const presets = CATEGORY_PRESETS[categoryType] || CATEGORY_PRESETS.general;
  const [selectedReason, setSelectedReason] = useState(presets[0]?.label || 'Incomplete Documentation');
  const [observation, setObservation] = useState('');
  const [improvementsRequired, setImprovementsRequired] = useState(presets[0]?.defaultAdvice || '');
  const [notifySms, setNotifySms] = useState(true);

  if (!isOpen) return null;

  const handleSelectPreset = (p: typeof presets[0]) => {
    setSelectedReason(p.label);
    if (!improvementsRequired || presets.some((x) => x.defaultAdvice === improvementsRequired)) {
      setImprovementsRequired(p.defaultAdvice);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({
      reasonCategory: selectedReason,
      observation: observation.trim() || selectedReason,
      improvementsRequired: improvementsRequired.trim() || 'Please revise documentation according to standard BOGCL policy guidelines.',
      notifySms,
    });
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="modal-bg"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        padding: '16px',
        boxSizing: 'border-box',
      }}
    >
      <div
        className="modal"
        style={{
          maxWidth: '620px',
          width: '100%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '16px',
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.4), 0 0 0 1px rgba(15, 23, 42, 0.08)',
          overflow: 'hidden',
          background: '#FFFFFF',
          margin: 'auto',
          animation: 'modal-pop 0.22s cubic-bezier(0.16,1,0.3,1) both',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className="modal-hd"
          style={{
            background: 'linear-gradient(135deg, #7F1D1D 0%, #991B1B 100%)',
            color: '#FFFFFF',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FCA5A5',
              }}
            >
              <RotateCcw size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#FFFFFF' }}>
                {title || t('Return / Query for Correction', 'সংশোধন ও পর্যালোচনার জন্য ফেরত', lang)}
              </h3>
              <div style={{ fontSize: '11px', color: '#FCA5A5', marginTop: '2px' }}>
                {t('Provide clear actionable audit observations and instructions', 'সুনির্দিষ্ট আপত্তি ও সংশোধনী নির্দেশনা প্রদান করুন', lang)}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              color: '#FFFFFF',
              width: '30px',
              height: '30px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.28)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleFormSubmit} style={{ margin: 0, display: 'flex', flexDirection: 'column', flex: '1 1 auto', overflow: 'hidden' }}>
          <div className="modal-body" style={{ padding: '20px', overflowY: 'auto', flex: '1 1 auto', maxHeight: 'calc(92vh - 135px)' }}>
            {/* Target Item Dossier Card */}
            <div
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                padding: '12px 14px',
                marginBottom: '16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '6px' }}>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#B91C1C', fontFamily: 'monospace' }}>
                    {itemId}
                  </span>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>
                    {itemTitle}
                  </div>
                </div>
                {amount && (
                  <span className="badge" style={{ background: '#FEE2E2', color: '#991B1B', fontWeight: 800, fontSize: '12px' }}>
                    {typeof amount === 'number' ? `৳${amount.toLocaleString()}` : amount}
                  </span>
                )}
              </div>

              {(requesterName || department) && (
                <div style={{ fontSize: '11px', color: '#64748B', marginTop: '6px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {requesterName && <span>Initiator: <strong>{requesterName}</strong></span>}
                  {department && <span>Dept: <strong>{department}</strong></span>}
                </div>
              )}
            </div>

            {/* Quick Presets Ribbon */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                {t('Select Primary Regulatory / Audit Objection:', 'প্রধান আপত্তি বা পর্যালোচনার কারণ নির্বাচন করুন:', lang)}
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {presets.map((p, idx) => {
                  const isSelected = selectedReason === p.label;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectPreset(p)}
                      style={{
                        fontSize: '11px',
                        padding: '6px 11px',
                        borderRadius: '6px',
                        border: isSelected ? '1.5px solid #DC2626' : '1px solid #CBD5E1',
                        background: isSelected ? '#FEF2F2' : '#FFFFFF',
                        color: isSelected ? '#991B1B' : '#475569',
                        fontWeight: isSelected ? 700 : 500,
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {lang === 'bn' ? p.labelBn : p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Field 1: Detailed Observation & Why Returning */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                {t('Observation & Justification for Return (Why is this rejected?):', 'আপত্তির বিস্তারিত বিবরণ (ফাইলটি কেন ফেরত পাঠানো হচ্ছে?):', lang)}
              </label>
              <textarea
                rows={3}
                required
                className="form-input"
                style={{
                  width: '100%',
                  fontSize: '12.5px',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#0F172A',
                  boxSizing: 'border-box',
                }}
                placeholder={t(
                  'e.g. Invoices lack official Mushak-6.3 tax registration, and per diem requested exceeds the standard grade policy limits...',
                  'যেমন: মূল ভ্যাট রসিদ সংযুক্ত নেই, দৈনিক ভাতার পরিমাণ গ্রেড সীমার অতিরিক্ত দাখিল করা হয়েছে...',
                  lang
                )}
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
              />
            </div>

            {/* Field 2: What need to improve / Fix before resubmission */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#047857', marginBottom: '4px' }}>
                {t('Actionable Guidance for Initiator (What needs to be fixed / improved?):', 'আবেদনকারীর করণীয় নির্দেশনা (কী কী সংশোধন করে পুনরায় দাখিল করতে হবে?):', lang)}
              </label>
              <textarea
                rows={2}
                required
                className="form-input"
                style={{
                  width: '100%',
                  fontSize: '12.5px',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  border: '1px solid #A7F3D0',
                  background: '#F0FDF4',
                  color: '#065F46',
                  boxSizing: 'border-box',
                }}
                placeholder={t(
                  'e.g. Please collect the revised tax invoice from hotel, recalculate daily allowance at ৳1,500/day, and upload the signed tour approval memo.',
                  'যেমন: সংশোধিত ভ্যাট রসিদ সংযুক্ত করুন এবং দৈনিক ভাতা নীতিমালা অনুযায়ী পুনঃহিসাব করে দাখিল করুন।',
                  lang
                )}
                value={improvementsRequired}
                onChange={(e) => setImprovementsRequired(e.target.value)}
              />
            </div>

            {/* Notification Checkbox */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#475569' }}>
              <input
                type="checkbox"
                id="notifySms"
                checked={notifySms}
                onChange={(e) => setNotifySms(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              <label htmlFor="notifySms" style={{ cursor: 'pointer' }}>
                {t('Dispatch high-priority SMS and in-app return notification to initiator', 'আবেদনকারীকে জরুরি এসএমএস ও ইন-অ্যাপ ফেরত বিজ্ঞপ্তি পাঠান', lang)}
              </label>
            </div>
          </div>

          {/* Modal Footer */}
          <div
            className="modal-footer"
            style={{
              padding: '12px 20px',
              background: '#F8FAFC',
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              className="btn-outline"
              onClick={onClose}
              style={{ fontSize: '12px', padding: '8px 14px' }}
            >
              {t('Cancel', 'বাতিল', lang)}
            </button>
            <button
              type="submit"
              className="btn-primary"
              style={{
                fontSize: '12px',
                padding: '8px 16px',
                background: '#DC2626',
                borderColor: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 700,
                color: '#FFFFFF',
              }}
            >
              <RotateCcw size={14} />
              {t('Confirm Return with Instructions', 'নির্দেশনাসহ ফেরত নিশ্চিত করুন', lang)}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
