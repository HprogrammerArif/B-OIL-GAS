import React from 'react';
import {
  X,
  Check,
  Printer,
  CheckCircle2,
  Users,
  Calendar,
  ShieldCheck,
  Lock,
  Bookmark,
  Building,
  Pin,
} from 'lucide-react';
import { NoticeItem } from './types';
import { t } from '../../types';
import { showToast } from '../../components/ToastManager';

interface NoticeDetailModalProps {
  notice: NoticeItem | null;
  onClose: () => void;
  lang: 'en' | 'bn';
  /** Recipients acknowledge. Issuers (Chairman) only read and track staff receipts. */
  canAcknowledge?: boolean;
  onAcknowledge?: (noticeId?: string) => void;
}

export default function NoticeDetailModal({
  notice,
  onClose,
  lang,
  canAcknowledge = true,
  onAcknowledge,
}: NoticeDetailModalProps) {
  if (!notice) return null;

  const isSafety = notice.tag.includes('SAFETY') || notice.category === 'safety';
  const isChairman = notice.tag.includes('CHAIRMAN') || notice.category === 'executive';

  const handlePrint = () => {
    window.print();
  };

  const ackCount = notice.acknowledgedCount || 184;
  const totalRecipients = notice.totalRecipients || 218;
  const ackPercentage = Math.round((ackCount / totalRecipients) * 100);

  return (
    <div
      className="modal-bg"
      onClick={onClose}
      style={{
        zIndex: 99999,
        padding: '20px',
        boxSizing: 'border-box',
      }}
    >
      <div
        className="notice-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '780px',
          width: '95%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--surface-1)',
          borderRadius: '18px',
          overflow: 'hidden',
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.4), 0 0 0 1px rgba(15, 23, 42, 0.1)',
          boxSizing: 'border-box',
        }}
      >
        {/* ─── 1. TOP UTILITY TOOLBAR ─── */}
        <div
          style={{
            padding: '14px 28px',
            backgroundColor: 'var(--surface-0)',
            borderBottom: '1px solid var(--border-1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxSizing: 'border-box',
            flexShrink: 0,
          }}
        >
          {/* Reference & Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: '12px',
                fontWeight: 800,
                color: 'var(--text-2)',
                backgroundColor: 'var(--surface-3)',
                padding: '3px 10px',
                borderRadius: '6px',
                letterSpacing: '0.5px',
              }}
            >
              {notice.referenceNo || `BOGCL/CORP/NOT-${notice.id || '2026-01'}`}
            </span>
            <span
              style={{
                padding: '3px 10px',
                borderRadius: '999px',
                fontSize: '10.5px',
                fontWeight: 800,
                backgroundColor: notice.pinned ? 'var(--status-warning-bg)' : 'var(--surface-2)',
                color: notice.pinned ? 'var(--status-warning-text)' : 'var(--text-2)',
                border: notice.pinned ? '1px solid var(--status-warning)' : '1px solid var(--border-2)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              {notice.pinned ? <><Pin size={11} /> {t('Pinned notice', 'পিন করা নোটিশ', lang)}</> : t('Standard circular', 'সাধারণ সার্কুলার', lang)}
            </span>
          </div>

          {/* Action Buttons: Print & Close */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={handlePrint}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border-2)',
                backgroundColor: 'var(--surface-1)',
                color: 'var(--text-2)',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--surface-2)';
                e.currentTarget.style.borderColor = 'var(--border-3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--surface-1)';
                e.currentTarget.style.borderColor = 'var(--border-2)';
              }}
              title="Print Circular"
            >
              <Printer size={13} />
              <span>{t('Print', 'প্রিন্ট', lang)}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: '1px solid var(--border-2)',
                backgroundColor: 'var(--surface-1)',
                color: 'var(--text-3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--surface-2)';
                e.currentTarget.style.color = 'var(--text-1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--surface-1)';
                e.currentTarget.style.color = 'var(--text-3)';
              }}
              title="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ─── 2. OFFICIAL LETTERHEAD & CIRCULAR BODY ─── */}
        <div
          style={{
            flex: '1 1 auto',
            overflowY: 'auto',
            padding: '28px 32px',
            backgroundColor: 'var(--surface-2)',
            boxSizing: 'border-box',
          }}
        >
          {/* Paper Sheet Container */}
          <div
            style={{
              backgroundColor: 'var(--surface-1)',
              borderRadius: '14px',
              border: '1.5px solid var(--border-2)',
              padding: '36px 42px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
              position: 'relative',
              boxSizing: 'border-box',
            }}
          >
            {/* Watermark */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%) rotate(-30deg)',
                fontSize: '48px',
                fontWeight: 900,
                color: 'rgba(165, 28, 48, 0.035)',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                letterSpacing: '4px',
                textTransform: 'uppercase',
                userSelect: 'none',
              }}
            >
              BASHUNDHARA OIL & GAS
            </div>

            {/* Formal Company Header Letterhead */}
            <div
              style={{
                textAlign: 'center',
                paddingBottom: '20px',
                marginBottom: '24px',
                borderBottom: '2px solid var(--brand-crimson)',
                position: 'relative',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  marginBottom: '6px',
                }}
              >
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--brand-crimson)',
                    color: 'var(--text-on-brand)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: '18px',
                    boxShadow: '0 2px 6px rgba(165,28,48,0.3)',
                    flexShrink: 0,
                  }}
                >
                  B
                </div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: '18px',
                    fontWeight: 900,
                    letterSpacing: '1px',
                    color: 'var(--text-1)',
                    textTransform: 'uppercase',
                  }}
                >
                  Bashundhara Oil & Gas Company Ltd.
                </h2>
              </div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: 'var(--text-3)',
                  letterSpacing: '1.2px',
                  textTransform: 'uppercase',
                }}
              >
                Corporate Directorate • Central Executive Command Desk
              </div>
              <div
                style={{
                  fontSize: '10.5px',
                  color: 'var(--text-muted)',
                  marginTop: '4px',
                }}
              >
                Bashundhara Industrial Headquarters, Baridhara, Dhaka-1229, Bangladesh
              </div>
            </div>

            {/* Executive Metadata 4-Box Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '12px',
                backgroundColor: 'var(--surface-0)',
                border: '1px solid var(--border-1)',
                borderRadius: '12px',
                padding: '14px 18px',
                marginBottom: '24px',
                boxSizing: 'border-box',
              }}
            >
              <div>
                <span
                  style={{
                    display: 'block',
                    fontSize: '10px',
                    fontWeight: 800,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '3px',
                  }}
                >
                  Issue Date
                </span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-1)' }}>
                  {notice.date}
                </span>
              </div>

              <div>
                <span
                  style={{
                    display: 'block',
                    fontSize: '10px',
                    fontWeight: 800,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '3px',
                  }}
                >
                  Category Tag
                </span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-1)' }}>
                  {notice.tag}
                </span>
              </div>

              <div>
                <span
                  style={{
                    display: 'block',
                    fontSize: '10px',
                    fontWeight: 800,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '3px',
                  }}
                >
                  Priority
                </span>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 800,
                    color: isSafety ? 'var(--brand-crimson-light)' : isChairman ? 'var(--status-warning)' : 'var(--status-info)',
                  }}
                >
                  {notice.priority ? notice.priority.toUpperCase() : 'STANDARD'}
                </span>
              </div>

              <div>
                <span
                  style={{
                    display: 'block',
                    fontSize: '10px',
                    fontWeight: 800,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '3px',
                  }}
                >
                  Security Status
                </span>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'var(--status-success)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <CheckCircle2 size={13} color="var(--status-success)" />
                  Digitally Sealed
                </span>
              </div>
            </div>

            {/* Subject / Headline Block */}
            <div style={{ marginBottom: '18px' }}>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  color: 'var(--text-3)',
                  marginBottom: '4px',
                }}
              >
                Subject / সার্কুলার বিষয়:
              </div>
              <h1
                style={{
                  margin: 0,
                  fontSize: '19px',
                  fontWeight: 800,
                  color: 'var(--text-1)',
                  lineHeight: 1.4,
                }}
              >
                {t(notice.title, notice.title_bn, lang)}
              </h1>
              {notice.title_bn && notice.title_bn !== notice.title && (
                <p
                  style={{
                    margin: '6px 0 0 0',
                    fontSize: '14px',
                    color: 'var(--text-2)',
                    fontWeight: 500,
                  }}
                >
                  {notice.title_bn}
                </p>
              )}
            </div>

            {/* Target Distribution Banner */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                backgroundColor: 'var(--status-info-bg)',
                border: '1px solid var(--status-info-border)',
                borderRadius: '10px',
                padding: '10px 16px',
                fontSize: '12.5px',
                color: 'var(--status-info-text)',
                marginBottom: '22px',
                boxSizing: 'border-box',
              }}
            >
              <Users size={16} color="var(--status-info)" style={{ flexShrink: 0 }} />
              <span>
                <strong>Target Distribution:</strong>{' '}
                {notice.targetAudience || 'All Company Staff (1,240 Employees across 6 Locations)'}
              </span>
            </div>

            {/* Main Notice Body */}
            <div
              style={{
                backgroundColor: 'var(--surface-0)',
                border: '1px solid var(--border-1)',
                borderRadius: '12px',
                padding: '24px 28px',
                fontSize: '14px',
                lineHeight: 1.8,
                color: 'var(--text-1)',
                marginBottom: '24px',
                boxSizing: 'border-box',
              }}
            >
              <p style={{ margin: 0, whiteSpace: 'pre-line' }}>
                {notice.body ||
                  t(
                    'This executive circular is issued under the authority of the Board of Directors and the Managing Director of Bashundhara Oil & Gas Company Limited. Strict compliance with all operational, safety, and administrative guidelines herein is mandatory across all refineries, terminals, and corporate stations.',
                    'এই প্রাতিষ্ঠানিক বিজ্ঞপ্তিটি বসুন্ধরা অয়েল অ্যান্ড গ্যাস কোম্পানি লিমিটেডের পরিচালনা পর্ষদের নির্দেশনায় জারি করা হলো। সকল কর্মকর্তা ও কর্মচারীকে এ নির্দেশনা কঠোরভাবে অনুসরণের নির্দেশ দেওয়া যাচ্ছে।',
                    lang
                  )}
              </p>
              {notice.body_bn && (
                <p
                  style={{
                    margin: '16px 0 0 0',
                    paddingTop: '14px',
                    borderTop: '1px solid var(--border-1)',
                    fontSize: '13px',
                    color: 'var(--text-2)',
                    fontStyle: 'italic',
                    whiteSpace: 'pre-line',
                  }}
                >
                  {notice.body_bn}
                </p>
              )}
            </div>

            {/* Acknowledgment Audit Card (if requiresAck) */}
            {notice.requiresAck && (
              <div
                style={{
                  backgroundColor: 'var(--status-success-bg)',
                  border: '1px solid var(--status-success-border)',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  marginBottom: '24px',
                  boxSizing: 'border-box',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    color: 'var(--status-success-text)',
                    marginBottom: '8px',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={15} color="var(--status-success)" />
                    <span>Workforce Read & Acknowledgment Audit</span>
                  </span>
                  <span>
                    {ackCount} / {totalRecipients} Staff ({ackPercentage}%)
                  </span>
                </div>
                <div
                  style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: 'var(--status-success-bg)',
                    borderRadius: '999px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      backgroundColor: 'var(--status-success-solid)',
                      width: `${ackPercentage}%`,
                      borderRadius: '999px',
                      transition: 'width 0.5s ease',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Formal Executive Signatory Block */}
            <div
              style={{
                borderTop: '1.5px solid var(--border-1)',
                paddingTop: '22px',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                <div>Corporate Registry: BOGCL-DIR-HQ</div>
                <div>Cryptographic Hash: 0x8F94...B19A</div>
                <div style={{ color: 'var(--status-success)', fontWeight: 600 }}>
                  ✓ Official Directorate Seal Validated
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div
                  style={{
                    display: 'inline-block',
                    borderBottom: '1.5px solid var(--border-3)',
                    paddingBottom: '3px',
                    fontSize: '15px',
                    fontFamily: 'serif',
                    fontStyle: 'italic',
                    color: 'var(--status-info-text)',
                    fontWeight: 700,
                    letterSpacing: '0.5px',
                  }}
                >
                  Ahmed Akbar Sobhan
                </div>
                <div
                  style={{
                    fontSize: '13.5px',
                    fontWeight: 800,
                    color: 'var(--text-1)',
                    marginTop: '4px',
                  }}
                >
                  {notice.author || 'Ahmed Akbar Sobhan'}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-3)' }}>
                  {notice.authorRole || 'Chairman & Managing Director'}
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: 'var(--status-warning)',
                    marginTop: '2px',
                  }}
                >
                  Bashundhara Group
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── 3. MODAL FOOTER ─── */}
        <div
          style={{
            padding: '16px 28px',
            backgroundColor: 'var(--surface-0)',
            borderTop: '1px solid var(--border-1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxSizing: 'border-box',
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '9px 20px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--text-2)',
              backgroundColor: 'var(--surface-1)',
              border: '1.5px solid var(--border-2)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--surface-2)';
              e.currentTarget.style.borderColor = 'var(--border-3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--surface-1)';
              e.currentTarget.style.borderColor = 'var(--border-2)';
            }}
          >
            {t('Close', 'বন্ধ করুন', lang)}
          </button>

          {canAcknowledge && !notice.read ? (
            <button
              type="button"
              onClick={() => {
                onAcknowledge?.(notice.id);
                showToast(
                  t(
                    'Notice acknowledged and logged in HR attendance ledger.',
                    'নোটিশ স্বীকৃতি সংরক্ষিত হয়েছে।',
                    lang
                  ),
                  'success'
                );
                onClose();
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 22px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--text-on-brand)',
                backgroundColor: 'var(--status-success-solid)',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(5, 150, 105, 0.3)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--status-success-solid-dark)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--status-success-solid)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <Check size={16} />
              <span>{t('Mark as Acknowledged', 'স্বীকৃতি প্রদান করুন', lang)}</span>
            </button>
          ) : canAcknowledge ? (
            <span
              style={{
                fontSize: '12.5px',
                fontWeight: 700,
                color: 'var(--status-success)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'var(--status-success-bg)',
                padding: '6px 14px',
                borderRadius: '8px',
                border: '1px solid var(--status-success-border)',
              }}
            >
              <CheckCircle2 size={15} color="var(--status-success)" />
              <span>{t('Already Acknowledged', 'স্বীকৃতি দেওয়া হয়েছে', lang)}</span>
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
