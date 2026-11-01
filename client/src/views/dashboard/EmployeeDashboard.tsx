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
                <div style={{ background: 'var(--surface-0)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-1)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>Casual Leave (CL)</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--brand-slate-900)' }}>8 / 10</div>
                  <div style={{ fontSize: '10px', color: 'var(--status-success)' }}>2 Days Utilized</div>
                </div>

                <div style={{ background: 'var(--surface-0)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-1)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>Medical / Sick Leave</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--brand-slate-900)' }}>6 / 14</div>
                  <div style={{ fontSize: '10px', color: 'var(--status-warning)' }}>8 Days Remaining</div>
                </div>

                <div style={{ background: 'var(--surface-0)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-1)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>Attendance Bonus</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--status-success)' }}>৳ 3,000</div>
                  <div style={{ fontSize: '10px', color: 'var(--status-success)' }}>Qualified (100% On-Time)</div>
                </div>

                <div style={{ background: 'var(--surface-0)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-1)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>Provident Fund Accrued</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--status-info-text)' }}>৳ 4,12,000</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-3)' }}>Matching BOGCL Contrib.</div>
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
            <div className="modal-hd" style={{ background: 'var(--brand-crimson)', color: 'var(--text-on-brand)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <QrCode size={18} color="var(--text-on-brand)" />
                <h3 style={{ color: 'var(--text-on-brand)', margin: 0 }}>
                  {t('Employee Digital Access Badge', 'ডিজিটাল প্রবেশপত্র পাস', lang)}
                </h3>
              </div>
              <button className="modal-close" style={{ color: 'var(--text-on-brand)' }} onClick={() => setShowGatePassModal?.(false)}>×</button>
            </div>

            <div className="modal-body" style={{ textAlign: 'center' }}>
              {/* Badge Visual Card */}
              <div style={{ border: '2px solid var(--border-strong)', borderRadius: '12px', padding: '20px 16px', background: 'var(--surface-0)', boxShadow: '0 4px 14px rgba(0,0,0,0.08)' }}>
                <div style={{ fontSize: '13px', fontWeight: 900, color: 'var(--brand-crimson)', letterSpacing: '0.5px' }}>
                  BASHUNDHARA OIL AND GAS COMPANY LTD.
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-3)', marginBottom: '12px' }}>
                  Corporate HQ & Keraniganj Bitumen Refinery
                </div>

                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--surface-inverse)', color: 'var(--brand-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 900, margin: '0 auto 8px', border: '2px solid var(--brand-gold)' }}>
                  TA
                </div>

                <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-1)' }}>Tanvir Ahmed</div>
                <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>Sr. Sales & Distribution Specialist</div>
                <div style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--brand-crimson)', marginTop: '2px' }}>
                  EMP ID: BOGCL-2024-0419
                </div>

                <div style={{ margin: '14px 0 10px', display: 'flex', justifyContent: 'center' }}>
                  <QrCode size={110} color="var(--text-1)" />
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '8px', fontSize: '10.5px', borderTop: '1px solid var(--border-2)', paddingTop: '10px' }}>
                  <div>Blood Group: <strong>B+ (Positive)</strong></div>
                  <div>Security Zone: <strong>Level-2 Refinery Access</strong></div>
                </div>
              </div>

              <div style={{ marginTop: '12px', fontSize: '11px', color: 'var(--status-success)', fontWeight: 700 }}>
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
