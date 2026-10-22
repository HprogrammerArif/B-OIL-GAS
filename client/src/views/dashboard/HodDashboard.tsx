import React, { useState } from 'react';
import { FileCheck, Check, CheckSquare, Square } from 'lucide-react';
import { t } from '../../types';
import { showToast } from '../../App';
import Pagination from '../../components/Pagination';
import { DashboardSubViewProps } from './types';
import { INITIAL_HOD_QUEUE } from './dashboardData';

interface HodDashboardProps extends DashboardSubViewProps {
  approvedAmountSum?: number;
  setApprovedAmountSum?: React.Dispatch<React.SetStateAction<number>>;
}

export default function HodDashboard({
  lang,
  activeTab,
  approvedAmountSum = 0,
  setApprovedAmountSum
}: HodDashboardProps) {
  const [hodQueue, setHodQueue] = useState(INITIAL_HOD_QUEUE);
  const [selectedHodIds, setSelectedHodIds] = useState<string[]>([]);
  const [hodQueuePage, setHodQueuePage] = useState(1);

  const toggleSelectHodItem = (id: string) => {
    setSelectedHodIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleBatchApproveHod = () => {
    if (selectedHodIds.length === 0) return;
    const approvedCost = hodQueue
      .filter(item => selectedHodIds.includes(item.id))
      .reduce((sum, item) => sum + item.costTk, 0);

    setApprovedAmountSum?.(prev => prev + approvedCost);
    setHodQueue(prev => prev.filter(item => !selectedHodIds.includes(item.id)));
    showToast(t(
      `✓ Batch approved ${selectedHodIds.length} items (৳${approvedCost.toLocaleString()} debited from Q4 budget). SAP entries synced.`,
      `✓ ${selectedHodIds.length}টি আবেদন অনুমোদিত (৳${approvedCost.toLocaleString()} কিউ৪ বাজেট থেকে কর্তিত)।`,
      lang
    ), 'gold');
    setSelectedHodIds([]);
  };

  const handleApproveSingleHod = (item: typeof INITIAL_HOD_QUEUE[0]) => {
    setApprovedAmountSum?.(prev => prev + item.costTk);
    setHodQueue(prev => prev.filter(x => x.id !== item.id));
    showToast(t(`✓ Approved ${item.title}.`, `✓ অনুমোদিত: ${item.title}`, lang), 'success');
  };

  return (
    <>
      {/* ═══════════════════════════════════════════
          HOD: TAB "approvals" (Paginated & Checkbox Selection)
          ═══════════════════════════════════════════ */}
      {activeTab === 'approvals' && (
        <div className="card mb-5 tab-pane-fade">
          <div className="card-hd">
            <div className="card-hd-left">
              <div className="card-hd-icon"><FileCheck size={18} color="var(--brand-crimson)" /></div>
              <div>
                <div className="card-title">{t('HOD Unified Omni-Approval Inbox & Budget Burn-Down', 'বিভাগীয় প্রধান ইউনিফায়েড অনুমোদন ইনবক্স', lang)}</div>
                <div className="card-subtitle">{t('Multi-category triage for Claims, Travel, Stationery, and Leave', 'দাবিপত্র, ভ্রমণ, ক্রয় ও ছুটির একীভূত অনুমোদন ব্যবস্থা', lang)}</div>
              </div>
            </div>

            {/* Batch Approve Action */}
            <div className="flex-gap">
              {selectedHodIds.length > 0 && (
                <button
                  className="btn-gold"
                  style={{ fontSize: '11.5px', padding: '6px 14px', fontWeight: 800 }}
                  onClick={handleBatchApproveHod}
                >
                  <Check size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  {t(`Batch Approve (${selectedHodIds.length} Selected)`, `নির্বাচিত ${selectedHodIds.length}টি একযোগে অনুমোদন করুন`, lang)}
                </button>
              )}
              <span className="badge danger">{hodQueue.length} Pending Actions</span>
            </div>
          </div>

          <div className="card-body">
            {/* Live Q4 Budget Burn-Down Gauge */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '14px 18px', borderRadius: '6px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', marginBottom: '6px', flexWrap: 'wrap', gap: '6px' }}>
                <span style={{ fontWeight: 700, color: 'var(--brand-slate-900)' }}>Q4 Operational Expenditure (OPEX) Ceiling: ৳53,20,000</span>
                <span style={{ color: '#059669', fontWeight: 800 }}>
                  Safe Buffer: ৳{(5320000 - (3840000 + approvedAmountSum)).toLocaleString()} Remaining
                </span>
              </div>
              <div style={{ height: '8px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.min(100, ((3840000 + approvedAmountSum) / 5320000) * 100)}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #10B981, #F59E0B)',
                    transition: 'width 0.4s ease'
                  }}
                />
              </div>
            </div>

            {/* Approval Items List with Checkboxes */}
            <div className="approval-queue-list">
              {hodQueue.slice((hodQueuePage - 1) * 4, hodQueuePage * 4).map((item) => (
                <div key={item.id} className={`approval-queue-item${item.urgency === 'overdue' ? ' overdue' : ''}`}>
                  <button
                    type="button"
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}
                    onClick={() => toggleSelectHodItem(item.id)}
                  >
                    {selectedHodIds.includes(item.id) ? (
                      <CheckSquare size={18} color="var(--brand-crimson)" />
                    ) : (
                      <Square size={18} color="#94A3B8" />
                    )}
                  </button>

                  <div className="aq-icon">{item.icon}</div>
                  <div className="aq-info">
                    <div className="aq-title">{item.title}</div>
                    <div className="aq-detail">
                      {item.detail} · <span className="aq-type-badge">{item.type}</span>
                      {item.costTk > 0 && <strong style={{ color: 'var(--brand-slate-900)', marginLeft: '6px' }}>৳{item.costTk.toLocaleString()}</strong>} · {item.time}
                    </div>
                  </div>
                  <div className="aq-actions">
                    <button
                      className="btn-primary"
                      style={{ fontSize: '11px', padding: '5px 12px' }}
                      onClick={() => handleApproveSingleHod(item)}
                    >
                      Approve
                    </button>
                    <button
                      className="btn-sm-ghost"
                      style={{ fontSize: '11px' }}
                      onClick={() => showToast(`Reviewing documentation for ${item.id}`, 'info')}
                    >
                      Review
                    </button>
                    <button
                      className="btn-outline-danger"
                      style={{ fontSize: '11px', padding: '5px 10px' }}
                      onClick={() => {
                        setHodQueue(prev => prev.filter(x => x.id !== item.id));
                        showToast(`Returned ${item.id} to applicant for correction.`, 'info');
                      }}
                    >
                      Return
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <Pagination
              currentPage={hodQueuePage}
              totalItems={hodQueue.length}
              pageSize={4}
              onPageChange={setHodQueuePage}
              lang={lang}
            />
          </div>
        </div>
      )}
    </>
  );
}
