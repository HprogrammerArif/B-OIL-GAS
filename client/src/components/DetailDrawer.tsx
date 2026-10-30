import React from 'react';
import { AppRole, Lang, ROLE_META, t } from '../types';
import { X, UserCheck, Clock } from 'lucide-react';
import { showToast } from '../App';
import { DepartmentApprovalStep, useApprovalStore } from '../store/approvalStore';

export interface DetailDrawerData {
  id: string;
  title: string;
  amount?: string;
  dept: string;
  urgency: string;
  time: string;
  description?: string;
  initiator?: string;
  sapRef?: string;
  approvalTrail?: DepartmentApprovalStep[];
}

interface DetailDrawerProps {
  data: DetailDrawerData | null;
  onClose: () => void;
  lang: Lang;
  role?: AppRole;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}

export default function DetailDrawer({
  data,
  onClose,
  lang,
  role = 'chairman',
  onApprove,
  onReject,
}: DetailDrawerProps) {
  const { approvalItems, approveApprovalItem, rejectApprovalItem } = useApprovalStore();

  React.useEffect(() => {
    if (!data) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [data, onClose]);

  if (!data) return null;

  const meta = ROLE_META[role];

  const findMatchingApproval = () =>
    approvalItems.find(
      (a) => a.id === data.id || a.sourceId === data.id || a.sapDocRef === data.id || a.sapDocRef === data.sapRef
    );

  const handleApprove = () => {
    if (onApprove) {
      onApprove(data.id);
      onClose();
      return;
    }
    const matched = findMatchingApproval();
    if (matched) {
      const res = approveApprovalItem(matched.id, undefined, undefined, role);
      showToast(
        t(
          `Approved ${matched.title} (Voucher: ${res.sapVoucher}).`,
          `${matched.titleBn} অনুমোদিত হয়েছে (ভাউচার: ${res.sapVoucher})।`,
          lang
        ),
        'gold'
      );
    } else {
      showToast(
        t(
          `${data.id} approved by ${meta.name}.`,
          `${data.id} অনুমোদন সম্পন্ন হয়েছে।`,
          lang
        ),
        'gold'
      );
    }
    onClose();
  };

  const handleSendBack = () => {
    if (onReject) {
      onReject(data.id);
      onClose();
      return;
    }
    const matched = findMatchingApproval();
    if (matched) {
      rejectApprovalItem(
        matched.id,
        'Returned for Clarification',
        'Please double-check the budget breakdown and attached supporting papers.',
        'Revise and resubmit after department verification.',
        undefined,
        role
      );
    }
    showToast(
      t(
        `Returned ${data.id} to ${data.dept} for clarification.`,
        `${data.id} সংশোধনের জন্য ${data.dept}-এ ফেরত পাঠানো হয়েছে।`,
        lang
      ),
      'info'
    );
    onClose();
  };

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <div>
            <div className="drawer-tag-row">
              <span className={`badge ${data.urgency === 'urgent' || data.urgency === 'critical' ? 'danger' : 'info'}`}>
                {data.urgency.toUpperCase()}
              </span>
              <span className="drawer-id">{data.id}</span>
            </div>
            <h3 className="drawer-title">{data.title}</h3>
          </div>
          <button className="drawer-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="drawer-body">
          {/* Key Metrics Grid */}
          <div className="drawer-metrics-grid">
            <div className="drawer-metric-item">
              <span className="lbl">{t('Department', 'বিভাগ', lang)}</span>
              <span className="val">{data.dept}</span>
            </div>
            {data.amount && (
              <div className="drawer-metric-item">
                <span className="lbl">{t('Amount / Value', 'পরিমাণ / মূল্য', lang)}</span>
                <span className="val val-gold">{data.amount}</span>
              </div>
            )}
            <div className="drawer-metric-item">
              <span className="lbl">{t('Submitted', 'দাখিলের সময়', lang)}</span>
              <span className="val">{data.time}</span>
            </div>
            <div className="drawer-metric-item">
              <span className="lbl">{t('Reference No.', 'রেফারেন্স নম্বর', lang)}</span>
              <span className="val font-mono">{data.sapRef || data.id}</span>
            </div>
          </div>

          {/* Description */}
          <div className="drawer-section">
            <h4>{t('Purpose & Details', 'প্রস্তাবের বিবরণ ও যৌক্তিকতা', lang)}</h4>
            <p>
              {data.description ||
                t(
                  'Submitted for review and official approval under company operating guidelines. Budget availability and supporting papers have been checked.',
                  'কোম্পানির নীতিমালা অনুযায়ী যাচাই ও চূড়ান্ত অনুমোদনের জন্য উপস্থাপিত। বাজেট ও প্রয়োজনীয় কাগজপত্র পরীক্ষা করা হয়েছে।',
                  lang
                )}
            </p>
          </div>

          {/* Approval History */}
          <div className="drawer-section">
            <h4>{t('Review & Approval Steps', 'অনুমোদন ধাপসমূহ', lang)}</h4>
            <div className="drawer-timeline">
              {data.approvalTrail && data.approvalTrail.length > 0 ? (
                <>
                  {data.approvalTrail.map((step, idx) => (
                    <div key={idx} className="timeline-step done">
                      <div className="timeline-dot" />
                      <div className="timeline-content">
                        <div className="timeline-name" style={{ fontWeight: 700, color: 'var(--brand-slate-900)' }}>
                          {step.officerName} ({step.roleName})
                        </div>
                        <div className="timeline-sub" style={{ fontSize: '11px', color: 'var(--brand-slate-600)', marginTop: '2px' }}>
                          <span style={{ color: '#059669', fontWeight: 600 }}>✓ {t('Checked:', 'সুপারিশ:', lang)}</span> "{step.note}"
                        </div>
                        <div style={{ fontSize: '9.5px', color: 'var(--brand-slate-400)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Clock size={10} /> {step.timestamp}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="timeline-step current">
                    <div className="timeline-dot" />
                    <div className="timeline-content">
                      <div className="timeline-name">
                        {meta.name} ({t(meta.label, meta.labelBn, lang)})
                      </div>
                      <div className="timeline-sub">
                        {t('Waiting for your decision', 'আপনার সিদ্ধান্তের অপেক্ষায়', lang)}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {data.initiator && (
                    <div className="timeline-step done">
                      <div className="timeline-dot" />
                      <div className="timeline-content">
                        <div className="timeline-name">{data.initiator}</div>
                        <div className="timeline-sub">{t('Submitted request with supporting details', 'প্রয়োজনীয় তথ্যসহ আবেদন দাখিল করেছেন', lang)}</div>
                      </div>
                    </div>
                  )}
                  <div className="timeline-step current">
                    <div className="timeline-dot" />
                    <div className="timeline-content">
                      <div className="timeline-name">
                        {meta.name} ({t(meta.label, meta.labelBn, lang)})
                      </div>
                      <div className="timeline-sub">
                        {t('Waiting for your review and approval', 'আপনার পর্যালোচনা ও অনুমোদনের অপেক্ষায়', lang)}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Verified Signatory Note */}
          <div className="drawer-security-seal">
            <UserCheck size={16} color="var(--brand-gold)" />
            <div>
              <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--brand-gold-dark)' }}>
                {t('Official Recorded Approval', 'সংরক্ষিত দাপ্তরিক অনুমোদন', lang)}
              </div>
              <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-500)' }}>
                {t(`Approving as ${meta.name} (${meta.empId})`, `অনুমোদনকারী: ${meta.nameBn} (${meta.empId})`, lang)}
              </div>
            </div>
          </div>
        </div>

        {/* Drawer Actions */}
        <div className="drawer-footer">
          <button className="btn-gold" style={{ flex: 1, padding: '10px' }} onClick={handleApprove}>
            ✓ {t('Approve Now', 'অনুমোদন দিন', lang)}
          </button>
          <button className="btn-outline-danger" style={{ padding: '10px 14px' }} onClick={handleSendBack}>
            {t('Return for Correction', 'ফেরত পাঠান', lang)}
          </button>
          <button className="btn-sm-ghost" style={{ padding: '10px 14px' }} onClick={onClose}>
            {t('Close', 'বন্ধ', lang)}
          </button>
        </div>
      </div>
    </div>
  );
}
