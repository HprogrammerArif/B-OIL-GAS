import React from 'react';
import { Activity, Award, QrCode } from 'lucide-react';
import { t } from '../../types';
import { DashboardSubViewProps } from './types';
import { MY_RECENT_ACTIVITY } from './dashboardData';

interface EmployeeDashboardProps extends DashboardSubViewProps {
  showGatePassModal?: boolean;
  setShowGatePassModal?: (show: boolean) => void;
}

export default function EmployeeDashboard({
  lang,
  activeTab,
  showGatePassModal,
  setShowGatePassModal
}: EmployeeDashboardProps) {
  return (
    <>
      {/* ═══════════════════════════════════════════
          EMPLOYEE: TAB "activity" (Timeline & Balances)
          ═══════════════════════════════════════════ */}
      {activeTab === 'activity' && (
        <div className="col-2 mb-5 tab-pane-fade">
          <div className="card">
            <div className="card-hd">
              <div className="card-hd-left">
                <div className="card-hd-icon"><Activity size={16} /></div>
                <div>
                  <div className="card-title">{t('My Recent Activity Log', 'আমার সাম্প্রতিক কার্যক্রম', lang)}</div>
                  <div className="card-subtitle">{t('Your latest actions and updates', 'আপনার সর্বশেষ কার্যক্রম ও আপডেট', lang)}</div>
                </div>
              </div>
            </div>
            <div className="card-body">
              <div className="activity-timeline">
                {MY_RECENT_ACTIVITY.map((act, i) => (
                  <div key={i} className="activity-item">
                    <div className="activity-dot">{act.icon}</div>
                    <div className="activity-content">
                      <div className="activity-title">{act.title}</div>
                      <div className="activity-detail">{act.detail}</div>
                      <div className="activity-time">{act.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Leave & Benefit Balances */}
          <div className="card">
            <div className="card-hd">
              <div className="card-hd-left">
                <div className="card-hd-icon"><Award size={16} /></div>
                <div>
                  <div className="card-title">{t('Entitlements & Leave Balance', 'ছুটি ব্যালেন্স ও প্রাপ্য ভাতাসমূহ', lang)}</div>
                  <div className="card-subtitle">{t('Fiscal Year 2026 Allowance', 'চলতি অর্থবছরের ছুটি স্থিতি', lang)}</div>
                </div>
              </div>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>Casual Leave (CL)</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--brand-slate-900)' }}>8 / 10</div>
                  <div style={{ fontSize: '10px', color: '#059669' }}>2 Days Utilized</div>
                </div>

                <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>Medical / Sick Leave</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--brand-slate-900)' }}>6 / 14</div>
                  <div style={{ fontSize: '10px', color: '#D97706' }}>8 Days Remaining</div>
                </div>

                <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>Attendance Bonus</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#059669' }}>৳ 3,000</div>
                  <div style={{ fontSize: '10px', color: '#059669' }}>Qualified (100% On-Time)</div>
                </div>

                <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>Provident Fund Accrued</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#1D4ED8' }}>৳ 4,12,000</div>
                  <div style={{ fontSize: '10px', color: '#64748B' }}>Matching BOGCL Contrib.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          EMPLOYEE: Virtual NFC / QR Gate Pass Modal
          ═══════════════════════════════════════════ */}
      {showGatePassModal && (
        <div className="modal-bg" onClick={() => setShowGatePassModal?.(false)}>
          <div className="modal" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-hd" style={{ background: 'var(--brand-crimson)', color: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <QrCode size={18} color="#fff" />
                <h3 style={{ color: '#fff', margin: 0 }}>
                  {t('Employee Digital Access Badge', 'ডিজিটাল প্রবেশপত্র পাস', lang)}
                </h3>
              </div>
              <button className="modal-close" style={{ color: '#fff' }} onClick={() => setShowGatePassModal?.(false)}>×</button>
            </div>

            <div className="modal-body" style={{ textAlign: 'center' }}>
              {/* Badge Visual Card */}
              <div style={{ border: '2px solid #0F172A', borderRadius: '12px', padding: '20px 16px', background: '#FAFAFC', boxShadow: '0 4px 14px rgba(0,0,0,0.08)' }}>
                <div style={{ fontSize: '13px', fontWeight: 900, color: 'var(--brand-crimson)', letterSpacing: '0.5px' }}>
                  BASHUNDHARA OIL AND GAS COMPANY LTD.
                </div>
                <div style={{ fontSize: '10px', color: '#64748B', marginBottom: '12px' }}>
                  Corporate HQ & Keraniganj Bitumen Refinery
                </div>

                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#0F172A', color: 'var(--brand-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 900, margin: '0 auto 8px', border: '2px solid var(--brand-gold)' }}>
                  TA
                </div>

                <div style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>Tanvir Ahmed</div>
                <div style={{ fontSize: '11px', color: '#64748B' }}>Sr. Sales & Distribution Specialist</div>
                <div style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--brand-crimson)', marginTop: '2px' }}>
                  EMP ID: BOGCL-2024-0419
                </div>

                <div style={{ margin: '14px 0 10px', display: 'flex', justifyContent: 'center' }}>
                  <QrCode size={110} color="#0F172A" />
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '8px', fontSize: '10.5px', borderTop: '1px solid #CBD5E1', paddingTop: '10px' }}>
                  <div>Blood Group: <strong>B+ (Positive)</strong></div>
                  <div>Security Zone: <strong>Level-2 Refinery Access</strong></div>
                </div>
              </div>

              <div style={{ marginTop: '12px', fontSize: '11px', color: '#059669', fontWeight: 700 }}>
                ✓ NFC Active • Scan at RFID turnstiles or show to security guards
              </div>
            </div>

            <div className="modal-ft">
              <button className="btn-sm-ghost" onClick={() => setShowGatePassModal?.(false)}>{t('Close', 'বন্ধ করুন', lang)}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
