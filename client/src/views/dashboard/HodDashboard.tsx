import { useState } from 'react';
import { FileCheck, Check, CheckSquare, Square, Inbox } from 'lucide-react';
import { t } from '../../types';
import { showToast } from '../../components/ToastManager';
import Pagination from '../../components/Pagination';
import { EmptyState } from '../../components/ui';
import { useCan } from '../../auth/session';
import { useApprovalStore, type ApprovalItem } from '../../store/approvalStore';
import { CATEGORY_LABELS, useMyApprovalQueue } from '../approvals/config';
import { DEPT_BUDGET, deptBudgetUsed, fmtBdt } from './config';
import { useDashboardData } from './useDashboardData';
import { DashboardSubViewProps } from './types';

const PAGE_SIZE = 4;

const CATEGORY_ICON: Record<ApprovalItem['category'], string> = {
  finance: '🧾',
  procurement: '📦',
  fleet: '🚗',
  leave: '🗓️',
  hr: '👤',
};

export default function HodDashboard({ lang, activeTab }: DashboardSubViewProps) {
  const canDecide = useCan('approvals:decide');
  const { approveApprovalItem, rejectApprovalItem, batchApproveItems } = useApprovalStore();
  const { user, pending: queue } = useMyApprovalQueue();
  const data = useDashboardData();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  const reviewer = user ? `${user.name} (${user.label})` : '';
  const used = deptBudgetUsed(data);
  const remaining = DEPT_BUDGET.ceilingBdt - used;
  const usedPct = Math.min(100, (used / DEPT_BUDGET.ceilingBdt) * 100);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleBatchApprove = () => {
    if (!user || selectedIds.length === 0) return;
    const res = batchApproveItems(selectedIds, user.role);
    showToast(
      t(
        `Approved ${res.count} items (${fmtBdt(res.totalCost)} against this quarter's budget).`,
        `${res.count.toLocaleString('bn-BD')}টি আবেদন অনুমোদিত (${fmtBdt(res.totalCost)} এই প্রান্তিকের বাজেট থেকে)।`,
        lang,
      ),
      'gold',
    );
    setSelectedIds([]);
  };

  const handleApprove = (item: ApprovalItem) => {
    if (!user) return;
    approveApprovalItem(item.id, undefined, reviewer, user.role);
    setSelectedIds((prev) => prev.filter((x) => x !== item.id));
    showToast(t(`Approved ${item.title}.`, `অনুমোদিত: ${item.titleBn || item.title}`, lang), 'success');
  };

  const handleReturn = (item: ApprovalItem) => {
    if (!user) return;
    rejectApprovalItem(
      item.id,
      'Returned for correction',
      t('Returned by the department head for correction or supporting documents.', 'সংশোধন বা সহায়ক কাগজপত্রের জন্য বিভাগীয় প্রধান ফেরত পাঠিয়েছেন।', lang),
      undefined,
      reviewer,
      user.role,
    );
    setSelectedIds((prev) => prev.filter((x) => x !== item.id));
    showToast(t(`Returned ${item.id} to the applicant.`, `${item.id} আবেদনকারীর কাছে ফেরত পাঠানো হয়েছে।`, lang), 'info');
  };

  const pageItems = queue.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      {activeTab === 'approvals' && (
        <div className="card mb-5 tab-pane-fade">
          <div className="card-hd">
            <div className="card-hd-left">
              <div className="card-hd-icon"><FileCheck size={18} color="var(--brand-crimson)" /></div>
              <div>
                <div className="card-title">{t('Department approval inbox', 'বিভাগীয় অনুমোদন ইনবক্স', lang)}</div>
                <div className="card-subtitle">{t('Claims, duty travel, procurement and leave routed to you', 'আপনার কাছে পাঠানো দাবি, ভ্রমণ, ক্রয় ও ছুটি', lang)}</div>
              </div>
            </div>

            <div className="flex-gap">
              {canDecide && selectedIds.length > 0 && (
                <button
                  className="btn-gold"
                  style={{ fontSize: '11.5px', padding: '6px 14px', fontWeight: 800 }}
                  onClick={handleBatchApprove}
                >
                  <Check size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  {t(`Approve ${selectedIds.length} selected`, `নির্বাচিত ${selectedIds.length.toLocaleString('bn-BD')}টি অনুমোদন করুন`, lang)}
                </button>
              )}
              <span className={`badge ${queue.length > 0 ? 'danger' : 'success'}`}>
                {queue.length} {t('pending', 'অপেক্ষমান', lang)}
              </span>
            </div>
          </div>

          <div className="card-body">
            {/* Quarter budget */}
            <div style={{ background: 'var(--surface-0)', border: '1px solid var(--border-1)', padding: '14px 18px', borderRadius: '6px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', marginBottom: '6px', flexWrap: 'wrap', gap: '6px' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-1)' }}>
                  {t('Quarterly OPEX ceiling', 'ত্রৈমাসিক পরিচালন বাজেট সীমা', lang)}: {fmtBdt(DEPT_BUDGET.ceilingBdt)}
                </span>
                <span style={{ color: remaining < DEPT_BUDGET.ceilingBdt * 0.1 ? 'var(--status-danger)' : 'var(--status-success)', fontWeight: 800 }}>
                  {t('Remaining', 'অবশিষ্ট', lang)}: {fmtBdt(remaining)}
                </span>
              </div>
              <div style={{ height: '8px', background: 'var(--surface-3)', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${usedPct}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, var(--status-success-solid), var(--status-warning-solid))',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            </div>

            {queue.length === 0 ? (
              <EmptyState
                icon={<Inbox size={28} />}
                title={t('Inbox clear', 'ইনবক্স খালি', lang)}
                description={t('Nothing from your department is waiting on you.', 'আপনার বিভাগ থেকে কোনো আবেদন অপেক্ষমান নেই।', lang)}
              />
            ) : (
              <div className="approval-queue-list">
                {pageItems.map((item) => {
                  const overdue = item.slaHoursLeft <= 0;
                  const cat = CATEGORY_LABELS[item.category];
                  return (
                    <div key={item.id} className={`approval-queue-item${overdue ? ' overdue' : ''}`}>
                      {canDecide && (
                        <button
                          type="button"
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}
                          onClick={() => toggleSelect(item.id)}
                          aria-label={t('Select for batch approval', 'ব্যাচ অনুমোদনের জন্য নির্বাচন', lang)}
                        >
                          {selectedIds.includes(item.id) ? (
                            <CheckSquare size={18} color="var(--brand-crimson)" />
                          ) : (
                            <Square size={18} color="var(--text-muted)" />
                          )}
                        </button>
                      )}

                      <div className="aq-icon">{CATEGORY_ICON[item.category]}</div>
                      <div className="aq-info">
                        <div className="aq-title">{t(item.title, item.titleBn || item.title, lang)}</div>
                        <div className="aq-detail">
                          {item.requester} · {item.designation} · <span className="aq-type-badge">{t(cat[0], cat[1], lang)}</span>
                          {(item.costTk ?? 0) > 0 && <strong style={{ color: 'var(--text-1)', marginLeft: '6px' }}>{fmtBdt(item.costTk ?? 0)}</strong>} · {item.date}
                          {overdue && <span className="badge danger" style={{ marginLeft: '6px' }}>{t('SLA breached', 'সময়সীমা অতিক্রান্ত', lang)}</span>}
                        </div>
                      </div>
                      <div className="aq-actions">
                        {canDecide ? (
                          <>
                            <button className="btn-primary" style={{ fontSize: '11px', padding: '5px 12px' }} onClick={() => handleApprove(item)}>
                              {t('Approve', 'অনুমোদন', lang)}
                            </button>
                            <button className="btn-outline-danger" style={{ fontSize: '11px', padding: '5px 10px' }} onClick={() => handleReturn(item)}>
                              {t('Return', 'ফেরত', lang)}
                            </button>
                          </>
                        ) : (
                          <span className="badge info">{t('View only', 'শুধু দেখা', lang)}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {queue.length > PAGE_SIZE && (
              <Pagination
                currentPage={page}
                totalItems={queue.length}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
                lang={lang}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
