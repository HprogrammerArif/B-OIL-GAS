import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Crown, CheckCircle2, ShieldCheck, Clock, Sparkles } from 'lucide-react';
import { AppRole, Lang, ROLE_META, t } from '../types';
import { DepartmentApprovalStep } from '../store/approvalStore';

export interface AuthorizeData {
  directive: string;
  notifySms: boolean;
  signatureHash: string;
}

interface AuthorizeDirectiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: AuthorizeData) => void;
  lang: Lang;
  itemId: string;
  itemTitle: string;
  requesterName?: string;
  department?: string;
  amount?: string | number;
  sapDocRef?: string;
  approvalTrail?: DepartmentApprovalStep[];
  role?: AppRole;
  roleTitle?: string;
  signerName?: string;
}

const DIRECTIVE_PRESETS = [
  {
    label: 'Standard Approval',
    labelBn: 'সাধারণ অনুমোদন',
    text: 'Approved as recommended by the reviewing department. Budget and purpose checked — please proceed as per company rules.',
  },
  {
    label: '5% Warranty Hold',
    labelBn: '৫% ওয়ারেন্টি জামানত শর্ত',
    text: 'Approved subject to keeping 5% security retention for 90 days after successful delivery, installation, and quality check.',
  },
  {
    label: 'Release Bank Payment',
    labelBn: 'ব্যাংক পেমেন্ট ছাড়ের অনুমোদন',
    text: 'Approved for immediate payment release through Finance & Accounts via official company bank transfer.',
  },
  {
    label: 'Check VAT Receipt Before Payment',
    labelBn: 'পেমেন্টের পূর্বে ভ্যাট রসিদ যাচাই',
    text: 'Approved. Accounts team please verify the original vendor VAT receipt and deduct applicable source tax before releasing payment.',
  },
];

export default function AuthorizeDirectiveModal({
  isOpen,
  onClose,
  onConfirm,
  lang,
  itemId,
  itemTitle,
  requesterName,
  department,
  amount,
  sapDocRef,
  approvalTrail,
  role,
  roleTitle,
  signerName,
}: AuthorizeDirectiveModalProps) {
  const [directive, setDirective] = useState(DIRECTIVE_PRESETS[0].text);
  const [notifySms, setNotifySms] = useState(true);
  const [showTrailDetails, setShowTrailDetails] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setDirective(DIRECTIVE_PRESETS[0].text);
    }
  }, [isOpen, itemId]);

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  const resolvedMeta = role ? ROLE_META[role] : undefined;
  const displayTitle =
    roleTitle ||
    (resolvedMeta ? t(resolvedMeta.label, resolvedMeta.labelBn, lang) : t('Chairman & Managing Director', 'চেয়ারম্যান ও ব্যবস্থাপনা পরিচালক', lang));

  const displaySigner =
    signerName ||
    (resolvedMeta
      ? t(resolvedMeta.name, resolvedMeta.nameBn, lang)
      : roleTitle && roleTitle.toLowerCase().includes('finance')
      ? 'Farida Begum'
      : roleTitle && roleTitle.toLowerCase().includes('hr')
      ? 'Sayeda Afroza Sultana'
      : roleTitle && roleTitle.toLowerCase().includes('plant')
      ? 'Engr. Md. Harunur Rashid'
      : 'Ahmed Akbar Sobhan');

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const stampCode =
      'APPROVED-' +
      new Date().getFullYear() +
      '-' +
      Math.floor(100000 + Math.random() * 900000);

    onConfirm({
      directive: directive.trim() || DIRECTIVE_PRESETS[0].text,
      notifySms,
      signatureHash: stampCode,
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
          maxWidth: '680px',
          width: '100%',
          maxHeight: '94vh',
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
            background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%)',
            color: '#FFFFFF',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
            borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(212, 175, 55, 0.25)',
                border: '1px solid rgba(212, 175, 55, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FDE047',
              }}
            >
              <Crown size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#FFFFFF' }}>
                {t('Confirm Approval & Add Note', 'অনুমোদন নিশ্চিত করুন ও নির্দেশনা যোগ করুন', lang)}
              </h3>
              <div style={{ fontSize: '11.5px', color: '#CBD5E1', marginTop: '2px' }}>
                {t('Review previous checks, add any approval note, and apply your official stamp', 'পূর্ববর্তী সুপারিশ দেখে চূড়ান্ত অনুমোদন নিশ্চিত করুন', lang)}
              </div>
            </div>
          </div>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            title={t('Close', 'বন্ধ করুন', lang)}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              borderColor: 'rgba(255, 255, 255, 0.25)',
              color: '#FFFFFF',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleFormSubmit} style={{ margin: 0, display: 'flex', flexDirection: 'column', flex: '1 1 auto', overflow: 'hidden' }}>
          <div className="modal-body" style={{ padding: '20px', overflowY: 'auto', flex: '1 1 auto', maxHeight: 'calc(94vh - 135px)' }}>
            {/* Summary Card */}
            <div
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '10px',
                padding: '14px 16px',
                marginBottom: '16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#4338CA', fontFamily: 'monospace' }}>
                      {itemId}
                    </span>
                    {sapDocRef && sapDocRef !== itemId && (
                      <span className="badge info" style={{ fontSize: '10px', padding: '1px 6px' }}>
                        {t('Ref:', 'রেফারেন্স:', lang)} {sapDocRef}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A', marginTop: '3px' }}>
                    {itemTitle}
                  </div>
                </div>
                {amount && (
                  <span className="badge" style={{ background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', fontWeight: 800, fontSize: '13px', padding: '4px 10px' }}>
                    {typeof amount === 'number' ? `৳${amount.toLocaleString()}` : amount}
                  </span>
                )}
              </div>

              {(requesterName || department) && (
                <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '6px', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                  {requesterName && (
                    <span>
                      {t('Submitted By:', 'আবেদনকারী:', lang)} <strong style={{ color: '#1E293B' }}>{requesterName}</strong>
                    </span>
                  )}
                  {department && (
                    <span>
                      {t('Department:', 'বিভাগ:', lang)} <strong style={{ color: '#1E293B' }}>{department}</strong>
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Prior Endorsements */}
            {approvalTrail && approvalTrail.length > 0 && (
              <div style={{ marginBottom: '18px', background: '#F1F5F9', borderRadius: '10px', padding: '12px 14px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, color: '#1E293B' }}>
                    <ShieldCheck size={16} color="#059669" />
                    <span>{t('Previous Reviews & Recommendations', 'পূর্ববর্তী যাচাই ও সুপারিশ', lang)}</span>
                    <span className="badge green" style={{ fontSize: '10px', padding: '1px 6px' }}>
                      {approvalTrail.filter((s) => s.status === 'completed').length} {t('Checked', 'যাচাইকৃত', lang)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowTrailDetails(!showTrailDetails)}
                    style={{ background: 'none', border: 'none', color: '#4338CA', fontSize: '11px', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                  >
                    {showTrailDetails ? t('Hide Details', 'সংক্ষিপ্ত করুন', lang) : t('Show Details', 'বিস্তারিত দেখুন', lang)}
                  </button>
                </div>

                {showTrailDetails && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                    {approvalTrail.map((step, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: '#FFFFFF',
                          border: '1px solid #CBD5E1',
                          borderRadius: '8px',
                          padding: '10px 12px',
                          fontSize: '11.5px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap', gap: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#DCFCE7', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800 }}>
                              ✓
                            </span>
                            <strong style={{ color: '#0F172A', fontSize: '12px' }}>{step.officerName}</strong>
                            <span style={{ color: '#64748B' }}>({step.roleName})</span>
                          </div>
                          <span style={{ fontSize: '10.5px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <Clock size={11} /> {step.timestamp}
                          </span>
                        </div>
                        <div style={{ paddingLeft: '24px', color: '#334155', fontStyle: 'italic', lineHeight: 1.45 }}>
                          "{step.note}"
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Quick Presets */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <Sparkles size={14} color="#D97706" />
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                  {t('Quick Approval Note Templates:', 'দ্রুত অনুমোদন নোট নির্বাচন করুন:', lang)}
                </label>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {DIRECTIVE_PRESETS.map((p, idx) => {
                  const isSelected = directive === p.text;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setDirective(p.text)}
                      style={{
                        fontSize: '11px',
                        padding: '6px 11px',
                        borderRadius: '6px',
                        border: isSelected ? '1.5px solid #4338CA' : '1px solid #CBD5E1',
                        background: isSelected ? '#EEF2FF' : '#FFFFFF',
                        color: isSelected ? '#3730A3' : '#475569',
                        fontWeight: isSelected ? 800 : 500,
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

            {/* Approval Remarks */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1E293B', marginBottom: '4px' }}>
                {t('Approval Note / Instructions:', 'অনুমোদন নোট বা বিশেষ নির্দেশনা:', lang)}
              </label>
              <textarea
                rows={3}
                required
                className="form-input"
                style={{
                  width: '100%',
                  fontSize: '12.5px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1.5px solid #818CF8',
                  background: '#F8FAFC',
                  color: '#0F172A',
                  boxSizing: 'border-box',
                  lineHeight: 1.45,
                }}
                value={directive}
                onChange={(e) => setDirective(e.target.value)}
                placeholder={t(
                  'Write your approval instructions or payment conditions...',
                  'আপনার অনুমোদন নোট বা পেমেন্ট নির্দেশনা লিখুন...',
                  lang
                )}
              />
            </div>

            {/* Dynamic Signer Stamp Preview */}
            <div
              style={{
                background: '#F0FDF4',
                border: '1px solid #BBF7D0',
                borderRadius: '8px',
                padding: '10px 14px',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    background: resolvedMeta?.avatarColor || '#166534',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '10.5px',
                  }}
                >
                  {resolvedMeta?.initials || '✓'}
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#166534' }}>
                    {displaySigner} — {displayTitle}
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#15803D' }}>
                    {t('Official Company Digital Approval Stamp Attached', 'অফিসিয়াল ডিজিটাল অনুমোদন সিল সংযুক্ত হবে', lang)}
                  </div>
                </div>
              </div>
              <span className="badge green" style={{ fontSize: '10.5px', fontWeight: 800 }}>
                ✓ {t('Verified Signatory', 'অনুমোদিত স্বাক্ষরকারী', lang)}
              </span>
            </div>

            {/* Notification Checkbox */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#475569' }}>
              <input
                type="checkbox"
                id="notifyAuthSms"
                checked={notifySms}
                onChange={(e) => setNotifySms(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              <label htmlFor="notifyAuthSms" style={{ cursor: 'pointer' }}>
                {t('Notify requester and Finance team immediately upon approval', 'অনুমোদনের সাথে সাথে আবেদনকারী ও অর্থ বিভাগকে বিজ্ঞপ্তি পাঠান', lang)}
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
                padding: '8px 18px',
                background: 'linear-gradient(135deg, #15803D 0%, #166534 100%)',
                borderColor: '#15803D',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 800,
                color: '#FFFFFF',
                boxShadow: '0 2px 8px rgba(22, 101, 52, 0.25)',
              }}
            >
              <CheckCircle2 size={16} />
              {t('Approve Now', 'অনুমোদন নিশ্চিত করুন', lang)}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
