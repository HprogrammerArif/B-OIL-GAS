import { useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import { t } from '../../types';
import { showToast } from '../../components/ToastManager';
import { Button, EmptyState, Modal, StatusPill } from '../../components/ui';
import { useCan } from '../../auth/session';
import { slaMinutesLeft, useNow } from '../../lib/sla';
import { useApprovalStore } from '../../store/approvalStore';
import { useMyApprovalQueue } from '../approvals/config';
import ApprovalCard from '../approvals/ApprovalCard';
import { useApprovalDecisions } from '../approvals/useApprovalDecisions';
import { DEPT_BUDGET, deptBudgetUsed, fmtBdt } from './config';
import { useDashboardData } from './useDashboardData';
import { DashboardSubViewProps } from './types';

export default function HodDashboard({ lang, activeTab, onOpenDetailDrawer }: DashboardSubViewProps) {
  const canDecide = useCan('approvals:decide');
  const { batchApproveItems } = useApprovalStore();
  const { user, pending } = useMyApprovalQueue();
  const data = useDashboardData();
  const now = useNow();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { requestApprove, requestReturn, modals } = useApprovalDecisions(lang, (id) => {
    setSelectedIds((prev) => prev.filter((x) => x !== id));
  });

  const queue = useMemo(
    () => [...pending].sort((a, b) => slaMinutesLeft(a, now) - slaMinutesLeft(b, now)),
    [pending, now],
  );
  const selected = queue.filter((i) => selectedIds.includes(i.id));
  const selectedCost = selected.reduce((sum, i) => sum + (i.costTk ?? 0), 0);

  const used = deptBudgetUsed(data);
  const left = DEPT_BUDGET.ceilingBdt - used;
  const usedPct = Math.min(100, Math.round((used / DEPT_BUDGET.ceilingBdt) * 100));
  const tight = left < DEPT_BUDGET.ceilingBdt * 0.1;
  const bn = (n: number) => n.toLocaleString('bn-BD');

  const toggle = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const approveSelected = () => {
    if (!user || selected.length === 0) return;
    const res = batchApproveItems(selected.map((i) => i.id), user.role);
    setSelectedIds([]);
    setConfirmOpen(false);
    showToast(
      t(
        `Approved ${res.count} requests (${fmtBdt(res.totalCost)} taken from this quarter's budget).`,
        `${bn(res.count)}টি আবেদন অনুমোদিত (${fmtBdt(res.totalCost)} এই প্রান্তিকের বাজেট থেকে)।`,
        lang,
      ),
      'gold',
    );
  };

  if (activeTab !== 'approvals') return null;

  return (
    <section className="tab-pane-fade dash-section" aria-labelledby="hod-title">
      <header className="dash-sec-head">
        <div>
          <h3 id="hod-title">{t('Waiting for your approval', 'আপনার অনুমোদনের অপেক্ষায়', lang)}</h3>
          <p>{t('Claims, travel, purchases and leave from your department. Most urgent first.', 'আপনার বিভাগের দাবি, ভ্রমণ, ক্রয় ও ছুটি। জরুরিগুলো আগে।', lang)}</p>
        </div>
        <div className="cn-head-actions">
          {canDecide && selected.length > 0 && (
            <Button variant="gold" size="sm" icon={<Check size={13} />} onClick={() => setConfirmOpen(true)}>
              {t(`Approve ${selected.length} selected`, `নির্বাচিত ${bn(selected.length)}টি অনুমোদন`, lang)}
            </Button>
          )}
          <StatusPill tone={queue.length > 0 ? 'danger' : 'success'}>
            {t(`${queue.length} waiting`, `${bn(queue.length)}টি অপেক্ষায়`, lang)}
          </StatusPill>
        </div>
      </header>

      <div className="hod-budget">
        <p>
          {t('This quarter you can still spend', 'এই প্রান্তিকে আপনি আর খরচ করতে পারবেন', lang)}{' '}
          <strong className={tight ? 'is-tight' : ''}>{fmtBdt(left)}</strong>{' '}
          <span>{t(`of ${fmtBdt(DEPT_BUDGET.ceilingBdt)}`, `${fmtBdt(DEPT_BUDGET.ceilingBdt)}-এর মধ্যে`, lang)}</span>
        </p>
        <div className="hs-bar" role="img" aria-label={t(`${usedPct}% used`, `${bn(usedPct)}% ব্যবহৃত`, lang)}>
          <span style={{ width: `${usedPct}%`, background: tight ? 'var(--status-danger)' : undefined }} />
        </div>
      </div>

      {queue.length === 0 ? (
        <EmptyState
          compact
          title={t('Nothing is waiting for you', 'আপনার জন্য কিছু অপেক্ষমান নেই', lang)}
          description={t('New requests from your department will appear here.', 'আপনার বিভাগের নতুন আবেদন এখানে দেখা যাবে।', lang)}
        />
      ) : (
        <div className="apv-list">
          {queue.map((item) => (
            <ApprovalCard
              key={item.id}
              item={item}
              mode="pending"
              lang={lang}
              canDecide={canDecide}
              selectable={canDecide}
              selected={selectedIds.includes(item.id)}
              onToggleSelect={toggle}
              onOpen={(id) => onOpenDetailDrawer?.(id)}
              onApprove={requestApprove}
              onReturn={requestReturn}
            />
          ))}
        </div>
      )}

      {confirmOpen && (
        <Modal
          open
          onClose={() => setConfirmOpen(false)}
          size="sm"
          title={t(`Approve ${selected.length} requests?`, `${bn(selected.length)}টি আবেদন অনুমোদন করবেন?`, lang)}
          footer={(
            <>
              <Button variant="ghost" onClick={() => setConfirmOpen(false)}>{t('Not yet', 'এখনই নয়', lang)}</Button>
              <Button variant="gold" onClick={approveSelected}>{t('Approve all', 'সব অনুমোদন', lang)}</Button>
            </>
          )}
        >
          <p className="tr-modal-note">
            {selectedCost > 0
              ? t(`Together they use ${fmtBdt(selectedCost)} of this quarter's budget.`, `সব মিলিয়ে এই প্রান্তিকের বাজেট থেকে ${fmtBdt(selectedCost)} লাগবে।`, lang)
              : t('These requests have no cost.', 'এই আবেদনগুলোতে কোনো খরচ নেই।', lang)}
          </p>
        </Modal>
      )}

      {modals}
    </section>
  );
}
