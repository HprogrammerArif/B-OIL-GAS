import React from 'react';
import { Lang, t } from '../types';
import { X, CheckCircle, ShieldAlert, FileText, Calendar, DollarSign, UserCheck, ArrowRight, CornerDownRight } from 'lucide-react';
import { showToast } from '../App';

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
}

interface DetailDrawerProps {
  data: DetailDrawerData | null;
  onClose: () => void;
  lang: Lang;
}

export default function DetailDrawer({ data, onClose, lang }: DetailDrawerProps) {
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

  const handleApprove = () => {
    showToast(`✅ ${data.id} authorized with SHA-256 digital signature stamp.`, 'gold');
    onClose();
  };

  const handleSendBack = () => {
    showToast(`↩️ ${data.id} sent back to ${data.dept} for budget verification.`, 'info');
    onClose();
  };

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <div>
            <div className="drawer-tag-row">
              <span className={`badge ${data.urgency === 'urgent' ? 'danger' : 'info'}`}>
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
                <span className="lbl">{t('Requisition Amount', 'অনুমোদিত অর্থ', lang)}</span>
                <span className="val val-gold">{data.amount}</span>
              </div>
            )}
            <div className="drawer-metric-item">
              <span className="lbl">{t('Pending Duration', 'অপেক্ষার সময়', lang)}</span>
              <span className="val">{data.time}</span>
            </div>
            <div className="drawer-metric-item">
              <span className="lbl">{t('SAP S/4HANA Ref', 'এসএপি রেফারেন্স', lang)}</span>
              <span className="val font-mono">{data.sapRef || 'SAP-PR-2026-90412'}</span>
            </div>
          </div>

          {/* Description & Context */}
          <div className="drawer-section">
            <h4>{t('Operational Justification', 'প্রয়োজনীয়তার যৌক্তিকতা', lang)}</h4>
            <p>
              {data.description ||
                t(
                  'Critical emergency procurement required for Keraniganj Bitumen Plant Unit-2 shutdown turnaround. Compliant with Bashundhara Group Procurement Policy Sec. 4.2.',
                  'কেরানীগঞ্জ বিটুমিন প্ল্যান্ট ইউনিট-২ রক্ষণাবেক্ষণ কাজের জন্য অতীব জরুরি মালামাল ক্রয় অনুমোদন। বসুন্ধরা গ্রুপ প্রকিউরমেন্ট নীতিমালার ৪.২ ধারা অনুযায়ী যাচাইকৃত।',
                  lang
                )}
            </p>
          </div>

          {/* Audit Chain */}
          <div className="drawer-section">
            <h4>{t('Approval Flow & Digital Audit Chain', 'অনুমোদন প্রক্রিয়া ও অডিট ট্রেইল', lang)}</h4>
            <div className="drawer-timeline">
              <div className="timeline-step done">
                <div className="timeline-dot" />
                <div className="timeline-content">
                  <div className="timeline-name">Engr. Md. Harunur Rashid (Plant GM)</div>
                  <div className="timeline-sub">Verified Technical Specs · SHA-256 Signed · 4h ago</div>
                </div>
              </div>
              <div className="timeline-step done">
                <div className="timeline-dot" />
                <div className="timeline-content">
                  <div className="timeline-name">Farida Begum (CFO & Finance Director)</div>
                  <div className="timeline-sub">Budget Verified in SAP S/4HANA · 2h ago</div>
                </div>
              </div>
              <div className="timeline-step current">
                <div className="timeline-dot" />
                <div className="timeline-content">
                  <div className="timeline-name">Chairman & Managing Director</div>
                  <div className="timeline-sub">Awaiting Final Executive Authorisation</div>
                </div>
              </div>
            </div>
          </div>

          {/* Security Compliance Seal */}
          <div className="drawer-security-seal">
            <UserCheck size={16} color="var(--brand-gold)" />
            <div>
              <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--brand-gold-dark)' }}>
                {t('Tamper-Proof Cryptographic Verification', 'নিরাপদ ক্রিপ্টোগ্রাফিক যাচাইকরণ', lang)}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--brand-slate-500)', fontFamily: 'monospace' }}>
                CERT: BOGCL-CORP-HQ-2026-ECDSA-SEC-P256
              </div>
            </div>
          </div>
        </div>

        {/* Drawer Actions */}
        <div className="drawer-footer">
          <button className="btn-gold" style={{ flex: 1, padding: '10px' }} onClick={handleApprove}>
            👑 {t('Authorize File', 'অনুমোদন প্রদান করুন', lang)}
          </button>
          <button className="btn-outline-danger" style={{ padding: '10px 14px' }} onClick={handleSendBack}>
            {t('Send Back', 'ফেরত পাঠান', lang)}
          </button>
          <button className="btn-sm-ghost" style={{ padding: '10px 14px' }} onClick={onClose}>
            {t('Close', 'বন্ধ', lang)}
          </button>
        </div>
      </div>
    </div>
  );
}
