import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, RotateCcw } from 'lucide-react';
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
      label: 'Missing Original Receipts / VAT Slips',
      labelBn: 'মূল রসিদ বা ভ্যাট স্লিপ সংযুক্ত নেই',
      defaultAdvice: 'Please attach clear photos or scans of original hotel/transport receipts and resubmit.',
    },
    {
      label: 'Daily Allowance / Hotel Bill Above Company Limit',
      labelBn: 'দৈনিক ভাতা বা হোটেল খরচ নির্ধারিত সীমার বেশি',
      defaultAdvice: 'Please adjust the hotel or daily food allowance to match your grade travel policy limit.',
    },
    {
      label: 'Trip Approval Note Not Attached',
      labelBn: 'সফরের পূর্বানুমোদন নোট সংযুক্ত নেই',
      defaultAdvice: 'Attach your manager’s travel approval note and visit schedule before resubmitting.',
    },
    {
      label: 'Duplicate or Unclear Travel Distance',
      labelBn: 'দ্বৈত এন্ট্রি বা দূরত্বের হিসাব অস্পষ্ট',
      defaultAdvice: 'Please check the local travel dates and fare amounts so there are no duplicate entries.',
    },
  ],
  notesheet: [
    {
      label: 'Budget Balance Check Needed',
      labelBn: 'বাজেট ব্যালেন্স পুনরায় যাচাই প্রয়োজন',
      defaultAdvice: 'Please confirm available budget with Finance & Accounts before sending for final signature.',
    },
    {
      label: 'Need 3 Vendor Price Quotes',
      labelBn: 'ন্যূনতম ৩টি সরবরাহকারীর দরপত্র প্রয়োজন',
      defaultAdvice: 'Please collect and attach at least 3 written vendor quotations for fair price comparison.',
    },
    {
      label: 'Technical / Warranty Details Unclear',
      labelBn: 'যন্ত্রপাতির বিবরণ বা ওয়ারেন্টি তথ্য অস্পষ্ট',
      defaultAdvice: 'Add clear model details, delivery timeline, and warranty period from the supplier.',
    },
    {
      label: 'Negotiate Better Price or Payment Terms',
      labelBn: 'মূল্য বা পরিশোধের শর্ত পুনর্বিবেচনা করুন',
      defaultAdvice: 'Please ask the supplier for a better discount or standard 30-day payment after delivery.',
    },
  ],
  requisition: [
    {
      label: 'All Office Cars Busy at Requested Time',
      labelBn: 'নির্ধারিত সময়ে সকল অফিসের গাড়ি ব্যস্ত',
      defaultAdvice: 'Please adjust your departure time slightly or share a pooled ride heading in the same direction.',
    },
    {
      label: 'Route Covered by Staff Shuttle Bus',
      labelBn: 'গন্তব্যটি নিয়মিত স্টাফ বাস রুটের অন্তর্ভুক্ত',
      defaultAdvice: 'Please use the scheduled staff shuttle bus unless carrying heavy samples or urgent client files.',
    },
    {
      label: 'Visit Purpose Needs More Detail',
      labelBn: 'সফরের উদ্দেশ্য আরও স্পষ্ট করুন',
      defaultAdvice: 'Please mention the client name, meeting time, or work purpose clearly in the booking form.',
    },
  ],
  asset: [
    {
      label: 'Check Existing Store Room Stock First',
      labelBn: 'প্রথমে স্টোর রুমে মজুদ আছে কি না দেখুন',
      defaultAdvice: 'Please check with HR/IT Store Room first to see if a spare unit is already available.',
    },
    {
      label: 'Need Engineer Inspection Report',
      labelBn: 'প্রকৌশলীর পরিদর্শন রিপোর্ট প্রয়োজন',
      defaultAdvice: 'Attach a short inspection note confirming why the current equipment cannot be repaired.',
    },
    {
      label: 'Price Estimate Needs Vendor Quote',
      labelBn: 'আনুমানিক মূল্যের সাথে সরবরাহকারীর কোটেশন দিন',
      defaultAdvice: 'Attach a recent supplier price quote matching the requested model and warranty.',
    },
  ],
  general: [
    {
      label: 'Supporting Papers Missing',
      labelBn: 'প্রয়োজনীয় কাগজপত্র অসম্পূর্ণ',
      defaultAdvice: 'Please attach all supporting documents and receipts before submitting again.',
    },
    {
      label: 'Manager Review Required First',
      labelBn: 'প্রথমে বিভাগীয় প্রধানের পর্যালোচনা প্রয়োজন',
      defaultAdvice: 'Please review the details with your supervisor and resubmit.',
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
  const [selectedReason, setSelectedReason] = useState(presets[0]?.label || 'Supporting Papers Missing');
  const [observation, setObservation] = useState('');
  const [improvementsRequired, setImprovementsRequired] = useState(presets[0]?.defaultAdvice || '');
  const [notifySms, setNotifySms] = useState(true);

  useEffect(() => {
    if (isOpen) {
      const currentPresets = CATEGORY_PRESETS[categoryType] || CATEGORY_PRESETS.general;
      setSelectedReason(currentPresets[0]?.label || 'Supporting Papers Missing');
      setObservation('');
      setImprovementsRequired(currentPresets[0]?.defaultAdvice || '');
    }
  }, [isOpen, itemId, categoryType]);

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  const handleSelectPreset = (p: (typeof presets)[0]) => {
    setSelectedReason(p.label);
    setImprovementsRequired(p.defaultAdvice);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({
      reasonCategory: selectedReason,
      observation: observation.trim() || selectedReason,
      improvementsRequired:
        improvementsRequired.trim() || 'Please update the details and resubmit.',
      notifySms,
    });
  };

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
        <div className="modal-hd danger">
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
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#FFFFFF' }}>
                {title || t('Return for Correction', 'সংশোধনের জন্য ফেরত পাঠান', lang)}
              </h3>
              <div style={{ fontSize: '11px', color: '#FCA5A5', marginTop: '2px' }}>
                {t('Explain clearly what needs to be fixed so the requester can update it easily', 'কী সংশোধন করতে হবে তা স্পষ্টভাবে উল্লেখ করুন', lang)}
              </div>
            </div>
          </div>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            title={t('Close', 'বন্ধ করুন', lang)}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleFormSubmit} style={{ margin: 0, display: 'flex', flexDirection: 'column', flex: '1 1 auto', overflow: 'hidden' }}>
          <div className="modal-body" style={{ padding: '20px', overflowY: 'auto', flex: '1 1 auto', maxHeight: 'calc(92vh - 135px)' }}>
            {/* Item Summary */}
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
                  {requesterName && <span>{t('Submitted By:', 'আবেদনকারী:', lang)} <strong>{requesterName}</strong></span>}
                  {department && <span>{t('Department:', 'বিভাগ:', lang)} <strong>{department}</strong></span>}
                </div>
              )}
            </div>

            {/* Common Reasons */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                {t('Choose Main Reason for Returning:', 'ফেরত পাঠানোর প্রধান কারণ নির্বাচন করুন:', lang)}
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

            {/* Field 1: Why Returning */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                {t('Details / What Was Found:', 'বিস্তারিত মন্তব্য (কেন ফেরত পাঠানো হচ্ছে?):', lang)}
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
                  'e.g. Hotel receipt photo is missing and daily food allowance was calculated for 5 days instead of 4 days...',
                  'যেমন: হোটেলের মূল রসিদ সংযুক্ত নেই এবং দৈনিক ভাতার হিসাব পুনরায় পরীক্ষা করা প্রয়োজন...',
                  lang
                )}
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
              />
            </div>

            {/* Field 2: Next Steps for Requester */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#047857', marginBottom: '4px' }}>
                {t('How to Fix Before Resubmitting:', 'আবেদনকারীর করণীয় (কী ঠিক করে আবার জমা দেবেন?):', lang)}
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
                {t('Send instant notification & SMS to requester', 'আবেদনকারীকে তাৎক্ষণিক নোটিফিকেশন ও এসএমএস পাঠান', lang)}
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
              {t('Return with Instructions', 'নির্দেশনাসহ ফেরত পাঠান', lang)}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
