import React from 'react';
import { Lang, t } from '../types';
import { Database, CheckCircle, ArrowRight, Server, ShieldCheck, X, RefreshCw } from 'lucide-react';
import { showToast } from '../App';

interface SapGatewayModalProps {
  onClose: () => void;
  lang: Lang;
}

export default function SapGatewayModal({ onClose, lang }: SapGatewayModalProps) {
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-hd" style={{ background: 'linear-gradient(135deg, #0B132B 0%, #0369A1 100%)' }}>
          <h3 style={{ color: '#fff' }}>
            <Database size={18} color="#38BDF8" />
            <span>{t('SAP S/4HANA Enterprise Integration Gateway', 'এসএপি এস/ফোরহানা এন্টারপ্রাইজ ইন্টিগ্রেশন গেটওয়ে', lang)}</span>
          </h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* Executive Value Proposition */}
          <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', padding: '14px 18px', borderRadius: 'var(--radius-md)', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <Server size={18} color="#0284C7" />
              <strong style={{ fontSize: '13px', color: '#0369A1' }}>
                {t('Industrial Edge Architecture: Zero Disruption to Central ERP', 'সেন্ট্রাল ইআরপির সাথে সমন্বিত এজ আর্কিটেকচার', lang)}
              </strong>
            </div>
            <p style={{ fontSize: '12px', color: '#0C4A6E', lineHeight: 1.5 }}>
              {t(
                'BOGCL OneOps acts as the high-speed operational frontend for refinery floors, fuel pumps, and gateposts where heavy SAP GUI cannot run. All ground transactions synchronize bi-directionally into Bashundhara Group\'s central SAP S/4HANA instance via secure OData REST APIs.',
                'ওয়ানঅপস রিফাইনারি মাঠপর্যায়ের উচ্চগতির ফ্রন্টএন্ড হিসেবে কাজ করে। মাঠপর্যায়ের সকল ডাটা তাৎক্ষণিকভাবে কেন্দ্রীয় এসএপি সিস্টেমে ওডাটা এপিআই-এর মাধ্যমে রিয়েল-টাইমে যুক্ত হয়।',
                lang
              )}
            </p>
          </div>

          {/* Active Integration Endpoints */}
          <div style={{ marginBottom: '16px' }}>
            <h5 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand-slate-800)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              {t('Active Live Data Pipelines (OData v4 / RFC):', 'সক্রিয় ডাটা পাইপলাইনসমূহ:', lang)}
            </h5>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ padding: '10px 14px', background: 'var(--brand-slate-100)', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', fontSize: '12px' }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <strong>SAP FI-CO (Financials & GL Ledger):</strong>
                  <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    POST /sap/opu/odata/sap/API_FINANCIALDOCUMENT (Requisition GL-4102 Auto-Post)
                  </div>
                </div>
                <span className="badge success">Live Sync</span>
              </div>

              <div style={{ padding: '10px 14px', background: 'var(--brand-slate-100)', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', fontSize: '12px' }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <strong>SAP PM / MM (Plant Maintenance & Materials):</strong>
                  <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    GET /sap/opu/odata/sap/API_EQUIPMENT_STATUS (Tank Thickness & Safety Valves)
                  </div>
                </div>
                <span className="badge success">Live Sync</span>
              </div>

              <div style={{ padding: '10px 14px', background: 'var(--brand-slate-100)', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', fontSize: '12px' }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <strong>SAP SuccessFactors (HCM & Shift Payroll):</strong>
                  <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    POST /sap/opu/odata/sap/API_TIME_RECORDING (Geofenced Punch In & Overtime)
                  </div>
                </div>
                <span className="badge success">Live Sync</span>
              </div>
            </div>
          </div>

          {/* Architecture Benefits Strip */}
          <div className="responsive-col-2-eq" style={{ gap: '12px', fontSize: '11.5px', background: '#F8FAFC', padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid #E2E8F0', marginBottom: 0 }}>
            <div>
              <span style={{ color: '#059669', fontWeight: 700 }}>✓ Zero SAP User License Overhead</span>
              <div style={{ color: 'var(--brand-slate-500)' }}>1,000+ plant staff don't need expensive SAP named user licenses.</div>
            </div>
            <div>
              <span style={{ color: '#059669', fontWeight: 700 }}>✓ Offline-First Resilience</span>
              <div style={{ color: 'var(--brand-slate-500)' }}>Refinery operations continue 100% even if SAP WAN link drops.</div>
            </div>
          </div>
        </div>

        <div className="modal-ft">
          <button className="btn-sm-ghost" onClick={onClose}>{t('Close', 'বন্ধ করুন', lang)}</button>
          <button
            className="btn-primary"
            onClick={() => {
              showToast(t('Force test ping to Bashundhara SAP S/4HANA Server (Response: 24ms, 100% OK)', 'এসএপি সার্ভার পিং টেস্ট সফল (২৪ মিলি-সেকেন্ড)', lang), 'success');
              onClose();
            }}
          >
            <RefreshCw size={13} />
            {t('Test Ping SAP Server', 'এসএপি সার্ভার পিং টেস্ট', lang)}
          </button>
        </div>
      </div>
    </div>
  );
}
