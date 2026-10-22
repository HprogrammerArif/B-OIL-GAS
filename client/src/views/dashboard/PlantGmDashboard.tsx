import React, { useState } from 'react';
import { Lock, CalendarClock, Check } from 'lucide-react';
import { t } from '../../types';
import { showToast } from '../../App';
import Pagination from '../../components/Pagination';
import RefineryOutputChart from '../../components/RefineryOutputChart';
import { DashboardSubViewProps } from './types';
import { INITIAL_LOTO_PERMITS, SHIFT_HANDOVER } from './dashboardData';

interface PlantGmDashboardProps extends DashboardSubViewProps {
  showBatchReleaseModal?: boolean;
  setShowBatchReleaseModal?: (show: boolean) => void;
}

export default function PlantGmDashboard({
  lang,
  activeTab,
  showBatchReleaseModal,
  setShowBatchReleaseModal
}: PlantGmDashboardProps) {
  const [lotoPermits] = useState(INITIAL_LOTO_PERMITS);
  const [lotoPage, setLotoPage] = useState(1);

  return (
    <>
      {/* ═══════════════════════════════════════════
          PLANT GM: TAB "refinery"
          ═══════════════════════════════════════════ */}
      {activeTab === 'refinery' && (
        <div className="tab-pane-fade">
          <RefineryOutputChart lang={lang} />
        </div>
      )}

      {/* ═══════════════════════════════════════════
          PLANT GM: TAB "safety_loto" (Paginated Permits + Handover)
          ═══════════════════════════════════════════ */}
      {activeTab === 'safety_loto' && (
        <div className="col-2 mb-5 tab-pane-fade">
          {/* Lockout Tagout (LOTO) Board */}
          <div className="card">
            <div className="card-hd">
              <div className="card-hd-left">
                <div className="card-hd-icon"><Lock size={16} color="var(--brand-crimson)" /></div>
                <div>
                  <div className="card-title">{t('Active Lockout-Tagout (LOTO) & High-Risk Permits', 'সক্রিয় লকআউট-ট্যাগআউট ও ঝুঁকি পারমিট', lang)}</div>
                  <div className="card-subtitle">{t('OSHA 1910.147 Control of Hazardous Energy', 'বিপজ্জনক শক্তি নিয়ন্ত্রণ ও নিরাপত্তা অনুমোদন', lang)}</div>
                </div>
              </div>
              <span className="badge danger">{lotoPermits.length} {t('Isolations', 'আইসোলেশন', lang)}</span>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {lotoPermits.slice((lotoPage - 1) * 2, lotoPage * 2).map((p) => (
                  <div key={p.id} style={{ border: '1px solid var(--brand-slate-200)', padding: '12px 14px', borderRadius: '6px', background: 'var(--brand-card-bg)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--brand-crimson)', fontSize: '12px' }}>{p.id}</span>
                      <span className="badge danger">{p.status}</span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '13px', marginTop: '3px', color: 'var(--brand-slate-900)' }}>{p.equipment}</div>
                    <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)', marginTop: '2px' }}>
                      Isolator: <strong>{p.breaker}</strong> • Permittee: <strong>{p.issuedTo}</strong>
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--status-danger)', marginTop: '4px', background: 'var(--status-danger-bg)', padding: '4px 8px', borderRadius: '4px', border: '1px solid rgba(239,68,68,0.2)' }}>
                      ⚠️ Hazard: {p.hazard}
                    </div>
                  </div>
                ))}
              </div>

              <Pagination
                currentPage={lotoPage}
                totalItems={lotoPermits.length}
                pageSize={2}
                onPageChange={setLotoPage}
                lang={lang}
              />
            </div>
          </div>

          {/* Shift Handover Log */}
          <div className="card">
            <div className="card-hd">
              <div className="card-hd-left">
                <div className="card-hd-icon"><CalendarClock size={16} /></div>
                <div>
                  <div className="card-title">{t('Shift Handover Continuity Log', 'শিফট হস্তান্তর ধারাবাহিকতা লগ', lang)}</div>
                  <div className="card-subtitle">{t('Operational continuity tracker (A/B/C Shifts)', 'অপারেশনাল ধারাবাহিকতা ট্র্যাকার', lang)}</div>
                </div>
              </div>
            </div>
            <div className="card-body">
              {SHIFT_HANDOVER.map((sh, i) => (
                <div key={i} className="shift-handover-row">
                  <div className="shift-handover-header">
                    <strong>{sh.shift}</strong>
                    <span className={`badge ${sh.status === 'completed' ? 'success' : 'info'}`}>{sh.status}</span>
                  </div>
                  <div className="shift-handover-meta">{sh.handover} · {sh.time}</div>
                  <div className="shift-handover-notes">{sh.notes}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          PLANT GM: Batch Quality Release Modal
          ═══════════════════════════════════════════ */}
      {showBatchReleaseModal && (
        <div className="modal-bg" onClick={() => setShowBatchReleaseModal?.(false)}>
          <div className="modal" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-hd" style={{ background: '#0F172A', color: '#fff' }}>
              <div>
                <h3 style={{ color: '#fff', margin: 0 }}>
                  ★ {t('Plant GM Bitumen Batch Quality Release Authority', 'বিটুমিন ব্যাচ গুণমান সনদ ও রিলিজ অনুমোদন', lang)}
                </h3>
                <div style={{ fontSize: '11px', color: '#94A3B8' }}>BOGCL QC Lab Tested • Keraniganj Complex</div>
              </div>
              <button className="modal-close" style={{ color: '#fff' }} onClick={() => setShowBatchReleaseModal?.(false)}>×</button>
            </div>

            <div className="modal-body">
              <div style={{ border: '2px solid #E2E8F0', padding: '16px', borderRadius: '6px', background: '#FAFAFC', marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', borderBottom: '1px solid #CBD5E1', paddingBottom: '8px', marginBottom: '10px' }}>
                  <div>
                    <strong>Batch No:</strong> <span style={{ fontFamily: 'monospace' }}>BOGCL-BIT-2026-B88</span>
                  </div>
                  <div>
                    <strong>Product:</strong> <span style={{ color: '#D97706', fontWeight: 800 }}>Bitumen Grade 60/70</span>
                  </div>
                  <div>
                    <strong>Volume:</strong> 2,400 Metric Tons
                  </div>
                </div>

                <div style={{ fontSize: '11.5px', fontWeight: 700, marginBottom: '6px' }}>Laboratory Physical Test Parameters (BDS 1238:2020 Standard):</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', fontSize: '11px' }}>
                  <div style={{ background: '#ECFDF5', padding: '8px', borderRadius: '4px', border: '1px solid #A7F3D0' }}>
                    Penetration @ 25°C: <strong>64 dmm</strong> (Passed)
                  </div>
                  <div style={{ background: '#ECFDF5', padding: '8px', borderRadius: '4px', border: '1px solid #A7F3D0' }}>
                    Softening Point: <strong>51.2°C</strong> (Passed)
                  </div>
                  <div style={{ background: 'var(--status-success-bg)', padding: '8px', borderRadius: '4px', border: '1px solid rgba(16,185,129,0.3)' }}>
                    Ductility: <strong>&gt;100 cm</strong> (Passed)
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '12px', color: 'var(--brand-slate-600)', background: 'var(--status-warning-bg)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(245,158,11,0.3)' }}>
                🔒 <strong>Plant GM Digital Seal:</strong> Authorizing this release unlocks Tank Farm Gantry Dispensers 1–4 and dispatches delivery challans to RHD Highway contractor tankers.
              </div>
            </div>

            <div className="modal-ft">
              <button className="btn-sm-ghost" onClick={() => setShowBatchReleaseModal?.(false)}>{t('Cancel', 'বাতিল', lang)}</button>
              <button
                className="btn-gold"
                style={{ fontWeight: 800 }}
                onClick={() => {
                  showToast(t('Batch BOGCL-BIT-2026-B88 released! Delivery gates unlocked and SAP dispatch notification dispatched.', 'ব্যাচ রিলিজ সম্পন্ন! লোডিং গ্যান্ট্রি সক্রিয় করা হয়েছে।', lang), 'gold');
                  setShowBatchReleaseModal?.(false);
                }}
              >
                <Check size={14} />
                {t('Authorize Batch Release & Sign Off', 'ব্যাচ অনুমোদন ও ডিজিটাল স্বাক্ষর', lang)}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
