import { useMemo } from 'react';
import { t } from '../../types';
import { DashboardSubViewProps } from './types';
import { useMyApprovalQueue } from '../approvals/config';
import { slaMinutesLeft, useNow } from '../../lib/sla';
import { useCan } from '../../auth/session';
import ApprovalCard from '../approvals/ApprovalCard';
import { useApprovalDecisions } from '../approvals/useApprovalDecisions';
import { EmptyState, StatusPill } from '../../components/ui';
import ChairmanNotices from './ChairmanNotices';
import LeadershipPresence from './LeadershipPresence';

export default function ChairmanDashboard({
  lang,
  activeTab,
  onOpenDetailDrawer,
}: DashboardSubViewProps) {
  const canDecide = useCan('approvals:decide');
  const now = useNow();
  const { pending } = useMyApprovalQueue();
  const { requestApprove, requestReturn, modals } = useApprovalDecisions(lang);
  const queue = useMemo(
    () => [...pending].sort((a, b) => slaMinutesLeft(a, now) - slaMinutesLeft(b, now)),
    [pending, now],
  );

  return (
    <>
      {/* Files waiting for the Chairman's signature (same cards and decision flow as the Approvals page) */}
      {activeTab === 'approvals' && (
        <section className="tab-pane-fade dash-section" aria-labelledby="dash-apv-title">
          <header className="dash-sec-head">
            <div>
              <h3 id="dash-apv-title">{t('Files waiting for your signature', 'আপনার স্বাক্ষরের অপেক্ষায় ফাইল', lang)}</h3>
              <p>{t('Sent to you after each department has endorsed them. Most urgent first.', 'বিভাগীয় সুপারিশের পর আপনার কাছে পাঠানো। জরুরিগুলো আগে।', lang)}</p>
            </div>
            <StatusPill tone={queue.length > 0 ? 'danger' : 'success'}>
              {queue.length} {t(queue.length === 1 ? 'file' : 'files', 'টি ফাইল', lang)}
            </StatusPill>
          </header>
          {queue.length === 0 ? (
            <EmptyState
              compact
              title={t('Nothing is waiting for you', 'আপনার জন্য কিছু অপেক্ষমান নেই', lang)}
              description={t('New files sent to you will appear here.', 'আপনার কাছে পাঠানো নতুন ফাইল এখানে দেখা যাবে।', lang)}
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
                  selectable={false}
                  selected={false}
                  onToggleSelect={() => undefined}
                  onOpen={(id) => onOpenDetailDrawer?.(id)}
                  onApprove={requestApprove}
                  onReturn={requestReturn}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === 'inner_circle' && <LeadershipPresence lang={lang} />}
      {activeTab === 'notices' && <ChairmanNotices lang={lang} />}

      {modals}
    </>
  );
}
