import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Crown,
  TrendingUp,
  ShieldCheck,
  DollarSign,
  Truck,
  Gauge,
  FileCheck2,
  Download,
  Share2,
  Printer,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Building,
} from 'lucide-react';
import { Lang, t } from '../../types';
import { showToast } from '../../App';

interface ExecutiveROIDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Lang;
}

export default function ExecutiveROIDossierModal({
  isOpen,
  onClose,
  lang,
}: ExecutiveROIDossierModalProps) {
  const [activePillarTab, setActivePillarTab] = useState<'all' | 'fleet' | 'scada' | 'procure' | 'tax'>('all');

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  const handleShareBoard = () => {
    showToast(
      lang === 'en'
        ? '👑 Executive ROI Dossier dispatched to Board of Directors & Central Finance Directorate.'
        : '👑 পরিচালনা পর্ষদ এবং সেন্ট্রাল ফিন্যান্স ডিরেক্টরেটে আরওআই বিবরণী প্রেরিত হয়েছে।',
      'gold'
    );
  };

  const handlePrint = () => {
    window.print();
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
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
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
          maxWidth: '860px',
          width: '100%',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '16px',
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
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
            background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #312E81 100%)',
            color: '#FFFFFF',
            padding: '18px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
            borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.3) 0%, rgba(212, 175, 55, 0.1) 100%)',
                border: '1.5px solid rgba(212, 175, 55, 0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FDE047',
              }}
            >
              <Crown size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.3px' }}>
                  {t('BOGCL Executive Board ROI Dossier', 'বিওজিসিএল এক্সিকিউটিভ বোর্ড আরওআই বিবরণী', lang)}
                </h3>
                <span
                  style={{
                    background: 'rgba(212, 175, 55, 0.2)',
                    color: '#FDE047',
                    border: '1px solid rgba(212, 175, 55, 0.4)',
                    fontSize: '10px',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontWeight: 800,
                  }}
                >
                  CONFIDENTIAL · BOARD ONLY
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#CBD5E1', marginTop: '3px' }}>
                {t(
                  'Consolidated Net Realized Value, Operational Loss Mitigation & Enterprise Capital Yield (FY26-27)',
                  'সঞ্চিত সাশ্রয়, পরিচালন ক্ষতি প্রতিরোধ ও বিনিয়োগের আর্থিক মূল্যায়ন অডিট খতিয়ান',
                  lang
                )}
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
        <div className="modal-body" style={{ padding: '24px', overflowY: 'auto', flex: '1 1 auto' }}>
          {/* Official Letterhead Strip */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '2px solid #E2E8F0',
              paddingBottom: '12px',
              marginBottom: '20px',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>
                BASHUNDHARA OIL & GAS COMPANY LTD.
              </div>
              <div style={{ fontSize: '11px', color: '#64748B' }}>
                Keraniganj Bitumen Refinery Complex · Directorate of Corporate Governance & Finance
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 700, color: '#4338CA' }}>
                AUDIT-REF: BOGCL/BOARD/ROI-2026-Q4
              </div>
              <div style={{ fontSize: '10.5px', color: '#64748B' }}>
                Validated against SAP S/4HANA General Ledger (October 2026)
              </div>
            </div>
          </div>

          {/* 4 Primary Top Metrics */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px',
              marginBottom: '24px',
            }}
          >
            <div
              style={{
                background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
                border: '1px solid #F59E0B',
                borderRadius: '12px',
                padding: '14px 16px',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#92400E', textTransform: 'uppercase' }}>
                {t('Net Realized Savings', 'মোট অর্জিত সাশ্রয়', lang)}
              </div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#78350F', marginTop: '4px' }}>
                ৳ 4,82,50,000
              </div>
              <div style={{ fontSize: '11px', color: '#B45309', marginTop: '2px', fontWeight: 600 }}>
                ▲ +18.4% YoY vs FY25 Baseline
              </div>
            </div>

            <div
              style={{
                background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
                border: '1px solid #10B981',
                borderRadius: '12px',
                padding: '14px 16px',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#065F46', textTransform: 'uppercase' }}>
                {t('Loss-Free Safety Record', 'নিরাপদ কর্মদিবস রেকর্ড', lang)}
              </div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#047857', marginTop: '4px' }}>
                284 Days
              </div>
              <div style={{ fontSize: '11px', color: '#059669', marginTop: '2px', fontWeight: 600 }}>
                Zero Unscheduled Plant Stoppage
              </div>
            </div>

            <div
              style={{
                background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
                border: '1px solid #3B82F6',
                borderRadius: '12px',
                padding: '14px 16px',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#1E40AF', textTransform: 'uppercase' }}>
                {t('October Running Revenue', 'অক্টোবর চলতি রাজস্ব', lang)}
              </div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#1D4ED8', marginTop: '4px' }}>
                ৳ 18.2 Crore
              </div>
              <div style={{ fontSize: '11px', color: '#2563EB', marginTop: '2px', fontWeight: 600 }}>
                104.2% of Monthly Plan Target
              </div>
            </div>

            <div
              style={{
                background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
                border: '1px solid #6366F1',
                borderRadius: '12px',
                padding: '14px 16px',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#3730A3', textTransform: 'uppercase' }}>
                {t('Capital Yield / ROI', 'বিনিয়োগ ফেরত অনুপাত', lang)}
              </div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#4338CA', marginTop: '4px' }}>
                4.82x Multiplier
              </div>
              <div style={{ fontSize: '11px', color: '#4F46E5', marginTop: '2px', fontWeight: 600 }}>
                OneOps Digital ROI Verified
              </div>
            </div>
          </div>

          {/* Strategic Value Pillars Section */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={16} color="#D97706" />
                <span>{t('4 Pillars of Realized Value & Loss Avoidance', 'সাশ্রয় ও ক্ষতি প্রতিরোধের ৪টি মূল স্তম্ভ', lang)}</span>
              </div>
              <span style={{ fontSize: '11px', color: '#64748B' }}>Pre-Audited for Board Review</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '14px' }}>
              {/* Pillar 1 */}
              <div
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  borderLeft: '4px solid #D97706',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '6px', background: '#FEF3C7', color: '#B45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Truck size={16} />
                    </div>
                    <div>
                      <strong style={{ fontSize: '13px', color: '#0F172A' }}>
                        1. Fleet Telematics & Anti-Theft AI
                      </strong>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>Corporate Fleet Hub · 24 Heavy Road Tankers</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 900, color: '#B45309' }}>৳ 2,15,00,000</span>
                </div>
                <p style={{ fontSize: '11.5px', color: '#475569', marginTop: '10px', lineHeight: 1.5, margin: '10px 0 0' }}>
                  Automated ultrasonic dip-rod telemetry and GPS route geo-fencing eliminated fuel pilferage across Baridhara HQ, Postogola Bridge, and Chittagong transit corridors. Zero variance maintained.
                </p>
              </div>

              {/* Pillar 2 */}
              <div
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  borderLeft: '4px solid #10B981',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '6px', background: '#DCFCE7', color: '#15803D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Gauge size={16} />
                    </div>
                    <div>
                      <strong style={{ fontSize: '13px', color: '#0F172A' }}>
                        2. Predictive SCADA & Loss Mitigation
                      </strong>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>Keraniganj Complex · Unit-1 & Unit-2 Columns</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 900, color: '#047857' }}>৳ 1,48,50,000</span>
                </div>
                <p style={{ fontSize: '11.5px', color: '#475569', marginTop: '10px', lineHeight: 1.5, margin: '10px 0 0' }}>
                  Automated cooling set-point trimming on vacuum distillation column C-102 prevented emergency shutdown during 5,000 MT/day peak refining, saving estimated 48 hours of plant downtime.
                </p>
              </div>

              {/* Pillar 3 */}
              <div
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  borderLeft: '4px solid #4338CA',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '6px', background: '#EEF2FF', color: '#4338CA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ShieldCheck size={16} />
                    </div>
                    <div>
                      <strong style={{ fontSize: '13px', color: '#0F172A' }}>
                        3. Vendor Competitive Sourcing & Warranties
                      </strong>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>Central Procurement & Tender Board</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 900, color: '#3730A3' }}>৳ 76,50,000</span>
                </div>
                <p style={{ fontSize: '11.5px', color: '#475569', marginTop: '10px', lineHeight: 1.5, margin: '10px 0 0' }}>
                  Enforced mandatory 3-quote competitive bidding and 5% advance retention warranty terms across all major capital overhauls, achieving lowest compliant bids on Cummins generator spares.
                </p>
              </div>

              {/* Pillar 4 */}
              <div
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  borderLeft: '4px solid #0284C7',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '6px', background: '#E0F2FE', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FileCheck2 size={16} />
                    </div>
                    <div>
                      <strong style={{ fontSize: '13px', color: '#0F172A' }}>
                        4. Tax Pre-Audit & BEFTN Early Rebates
                      </strong>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>Corporate Finance & Statutory Accounts</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 900, color: '#0369A1' }}>৳ 42,50,000</span>
                </div>
                <p style={{ fontSize: '11.5px', color: '#475569', marginTop: '10px', lineHeight: 1.5, margin: '10px 0 0' }}>
                  Rigorous pre-audit enforcement of Mushak-6.3 tax invoices, AIT adjustments, and 2% prompt vendor electronic disbursement discounts integrated with SAP S/4HANA FI-CO.
                </p>
              </div>
            </div>
          </div>

          {/* Departmental Contributions Audit Ledger */}
          <div style={{ marginBottom: '18px' }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A', marginBottom: '10px' }}>
              {t('Departmental Savings Contribution Ledger (SAP Verified)', 'বিভাগীয় সাশ্রয় অডিট লেজার (এসএপি পরীক্ষিত)', lang)}
            </div>
            <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#F1F5F9', color: '#475569', fontWeight: 700, borderBottom: '1px solid #E2E8F0' }}>
                    <th style={{ padding: '8px 12px' }}>Department</th>
                    <th style={{ padding: '8px 12px' }}>Division Head</th>
                    <th style={{ padding: '8px 12px' }}>Realized Savings</th>
                    <th style={{ padding: '8px 12px' }}>SAP GL Reference</th>
                    <th style={{ padding: '8px 12px' }}>Compliance Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '9px 12px', fontWeight: 700, color: '#0F172A' }}>Plant Operations</td>
                    <td style={{ padding: '9px 12px', color: '#475569' }}>Engr. Md. Harunur Rashid</td>
                    <td style={{ padding: '9px 12px', fontWeight: 800, color: '#059669' }}>৳ 1,62,00,000</td>
                    <td style={{ padding: '9px 12px', fontFamily: 'monospace', color: '#64748B' }}>GL-4102-KER</td>
                    <td style={{ padding: '9px 12px' }}><span className="badge green" style={{ fontSize: '10px' }}>✓ 100% Certified</span></td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '9px 12px', fontWeight: 700, color: '#0F172A' }}>Transport & Heavy Fleet</td>
                    <td style={{ padding: '9px 12px', color: '#475569' }}>Md. Kamruzzaman</td>
                    <td style={{ padding: '9px 12px', fontWeight: 800, color: '#059669' }}>৳ 1,48,00,000</td>
                    <td style={{ padding: '9px 12px', fontFamily: 'monospace', color: '#64748B' }}>GL-5108-FLT</td>
                    <td style={{ padding: '9px 12px' }}><span className="badge green" style={{ fontSize: '10px' }}>✓ 100% Certified</span></td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '9px 12px', fontWeight: 700, color: '#0F172A' }}>Corporate Finance</td>
                    <td style={{ padding: '9px 12px', color: '#475569' }}>Farida Begum</td>
                    <td style={{ padding: '9px 12px', fontWeight: 800, color: '#059669' }}>৳ 1,12,00,000</td>
                    <td style={{ padding: '9px 12px', fontFamily: 'monospace', color: '#64748B' }}>GL-7101-FIN</td>
                    <td style={{ padding: '9px 12px' }}><span className="badge green" style={{ fontSize: '10px' }}>✓ 100% Certified</span></td>
                  </tr>
                  <tr>
                    <td style={{ padding: '9px 12px', fontWeight: 700, color: '#0F172A' }}>IT & Digital Systems</td>
                    <td style={{ padding: '9px 12px', color: '#475569' }}>S. M. Mahbubur Rahman</td>
                    <td style={{ padding: '9px 12px', fontWeight: 800, color: '#059669' }}>৳ 60,50,000</td>
                    <td style={{ padding: '9px 12px', fontFamily: 'monospace', color: '#64748B' }}>GL-5201-IT</td>
                    <td style={{ padding: '9px 12px' }}><span className="badge green" style={{ fontSize: '10px' }}>✓ 100% Certified</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Cryptographic Auditor Seal */}
          <div
            style={{
              background: '#F0FDF4',
              border: '1px solid #86EFAC',
              borderRadius: '8px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={18} color="#16A34A" />
              <div>
                <strong style={{ fontSize: '12px', color: '#166534' }}>
                  Audited & Digitally Sealed by Corporate Secretariat
                </strong>
                <div style={{ fontSize: '10.5px', color: '#15803D' }}>
                  Hash: SHA256-BOGCL-ROI-2026-OCT-88A9213F982C • SAP Connector Live Verified
                </div>
              </div>
            </div>
            <span className="badge green" style={{ fontSize: '11px', fontWeight: 800 }}>
              VERIFIED BOARD ASSET
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          className="modal-footer"
          style={{
            padding: '14px 24px',
            background: '#F8FAFC',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn-outline"
              onClick={handlePrint}
              style={{ fontSize: '11.5px', padding: '7px 12px', display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <Printer size={14} />
              {t('Print Dossier', 'প্রিন্ট করুন', lang)}
            </button>
            <button
              type="button"
              className="btn-outline"
              onClick={() => showToast(t('Executive PDF generated and downloaded.', 'পিডিএফ ডাউনলোড সম্পন্ন।', lang), 'success')}
              style={{ fontSize: '11.5px', padding: '7px 12px', display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <Download size={14} />
              {t('Export Board PDF', 'বোর্ড পিডিএফ ডাউনলোড', lang)}
            </button>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="btn-outline"
              onClick={onClose}
              style={{ fontSize: '11.5px', padding: '7px 14px' }}
            >
              {t('Close', 'বন্ধ করুন', lang)}
            </button>
            <button
              type="button"
              className="btn-gold"
              onClick={handleShareBoard}
              style={{
                fontSize: '11.5px',
                padding: '7px 16px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Share2 size={14} />
              {t('Dispatch to Board of Directors', 'পরিচালনা পর্ষদে প্রেরণ', lang)}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
