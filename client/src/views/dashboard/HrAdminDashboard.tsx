import React from 'react';
import { UserCheck, Building2 } from 'lucide-react';
import { t } from '../../types';
import { showToast } from '../../App';
import { DashboardSubViewProps } from './types';

export default function HrAdminDashboard({
  lang,
  activeTab
}: DashboardSubViewProps) {
  return (
    <>
      {/* ═══════════════════════════════════════════
          HR ADMIN: TAB "clearance"
          ═══════════════════════════════════════════ */}
      {activeTab === 'clearance' && (
        <div className="card mb-5 tab-pane-fade">
          <div className="card-hd">
            <div className="card-hd-left">
              <div className="card-hd-icon"><UserCheck size={16} color="var(--brand-crimson)" /></div>
              <div>
                <div className="card-title">{t('Active Employee Separation & Exit Clearance', 'সক্রিয় কর্মী বহির্গমন ও ছাড়পত্র ট্র্যাকার', lang)}</div>
                <div className="card-subtitle">{t('4-Way Audit: IT · Security · Fleet · Finance', '৪-ধাপ নিরীক্ষা: আইটি · নিরাপত্তা · পরিবহন · অর্থায়ন', lang)}</div>
              </div>
            </div>
            <span className="badge danger">1 In Clearance</span>
          </div>
          <div className="card-body">
            <div style={{ background: 'var(--brand-slate-100)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <strong style={{ fontSize: '13.5px', color: 'var(--brand-slate-900)' }}>Engr. Faisal Ahmed</strong>
                  <span style={{ fontSize: '11px', color: 'var(--brand-slate-500)', marginLeft: '8px' }}>EMP-004 · Maintenance Lead</span>
                </div>
                <span className="badge warn">50% Cleared (2/4)</span>
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--brand-slate-600)', marginBottom: '10px' }}>
                Resignation notice submitted · Last working day: <strong>Nov 15, 2026</strong> · Keraniganj Plant
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', fontSize: '10.5px' }}>
                <div style={{ background: '#ECFDF5', padding: '6px 8px', borderRadius: '4px', border: '1px solid #A7F3D0', color: '#065F46' }}>
                  ✓ IT Accounts Revoked
                </div>
                <div style={{ background: '#ECFDF5', padding: '6px 8px', borderRadius: '4px', border: '1px solid #A7F3D0', color: '#065F46' }}>
                  ✓ Security RFID Surrendered
                </div>
                <div style={{ background: '#FEF3C7', padding: '6px 8px', borderRadius: '4px', border: '1px solid #FDE68A', color: '#92400E' }}>
                  ⏳ Fleet: Pool Car Return
                </div>
                <div style={{ background: '#FEE2E2', padding: '6px 8px', borderRadius: '4px', border: '1px solid #FECACA', color: '#991B1B' }}>
                  ⏳ Finance: TA/DA Reconciliation
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <button
                className="btn-outline"
                style={{ fontSize: '11px', padding: '6px 12px' }}
                onClick={() => showToast(t('Access the Workforce Master from the sidebar for full clearance sign-off.', 'কর্মী মাস্টার থেকে পূর্ণ ছাড়পত্র সম্পন্ন করুন।', lang), 'info')}
              >
                {t('Open Complete Workforce Directory →', 'সম্পূর্ণ কর্মী ডিরেক্টরি দেখুন →', lang)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          HR ADMIN: TAB "sites"
          ═══════════════════════════════════════════ */}
      {activeTab === 'sites' && (
        <div className="card mb-5 tab-pane-fade">
          <div className="card-hd">
            <div className="card-hd-left">
              <div className="card-hd-icon"><Building2 size={16} /></div>
              <div>
                <div className="card-title">{t('Enterprise Headcount & Site Deployment', 'সংস্থার কর্মী বণ্টন ও সাইট ডেপ্লয়মেন্ট', lang)}</div>
                <div className="card-subtitle">{t('Active personnel across 3 regional nodes', '৩টি আঞ্চলিক নোডে সক্রিয় জনবল', lang)}</div>
              </div>
            </div>
            <span className="badge info">743 Total</span>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--brand-slate-100)', borderRadius: '6px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <strong style={{ fontSize: '13px' }}>Bashundhara Dhaka HQ</strong>
                  <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)' }}>Plot-3, Block-G, Umme Kulsum Road, Baridhara</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#059669' }}>420 Staff</div>
                  <div style={{ fontSize: '10px', color: 'var(--brand-slate-400)' }}>Corporate, Finance & Sales</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--brand-slate-100)', borderRadius: '6px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <strong style={{ fontSize: '13px' }}>Keraniganj Bitumen Refinery Complex</strong>
                  <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)' }}>Industrial Area, Dhaleshwari River Corridor</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#0284C7' }}>218 Staff</div>
                  <div style={{ fontSize: '10px', color: 'var(--brand-slate-400)' }}>Engineering, QC & Plant Ops</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--brand-slate-100)', borderRadius: '6px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <strong style={{ fontSize: '13px' }}>Chattogram Marine Bulk Terminal</strong>
                  <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)' }}>Guptakhal, Patenga River Jetty</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#D97706' }}>105 Staff</div>
                  <div style={{ fontSize: '10px', color: 'var(--brand-slate-400)' }}>Maritime Discharge & Heavy Fleet</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
