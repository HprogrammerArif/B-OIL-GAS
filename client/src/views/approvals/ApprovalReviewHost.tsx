import { useCallback, useMemo } from 'react';
import type { Lang } from '../../types';
import { useCan } from '../../auth/session';
import { slaMinutesLeft, useNow } from '../../lib/sla';
import { useMyApprovalQueue } from './config';
import ApprovalDetailDrawer from './ApprovalDetailDrawer';
import { useApprovalDecisions } from './useApprovalDecisions';

interface ApprovalReviewHostProps {
  /** Approval id to review, or null when closed. */
  openId: string | null;
  lang: Lang;
  onOpen: (id: string | null) => void;
}

/**
 * Review drawer for surfaces outside the Approvals page (dashboards). Uses the
 * same panel and the same directive / return-with-query modals, and walks the
 * signed-in user's pending queue.
 */
export default function ApprovalReviewHost({ openId, lang, onOpen }: ApprovalReviewHostProps) {
  const canDecide = useCan('approvals:decide');
  const { user, pending, decided } = useMyApprovalQueue();

  const now = useNow();
  const queue = useMemo(
    () => [...pending].sort((a, b) => slaMinutesLeft(a, now) - slaMinutesLeft(b, now)),
    [pending, now],
  );
  const item = openId ? [...pending, ...decided].find((i) => i.id === openId) ?? null : null;
  const isPending = !!item && pending.some((i) => i.id === item.id);
  const index = item ? queue.findIndex((i) => i.id === item.id) : -1;

  const onDecided = useCallback(
    (id: string) => {
      const idx = queue.findIndex((i) => i.id === id);
      onOpen((queue[idx + 1] ?? queue[idx - 1])?.id ?? null);
    },
    [queue, onOpen],
  );
  const { requestApprove, requestReturn, modals, busy } = useApprovalDecisions(lang, onDecided);

  const go = (delta: number) => {
    const next = queue[index + delta];
    if (next) onOpen(next.id);
  };

  return (
    <>
      {item && (
        <ApprovalDetailDrawer
          item={item}
          mode={isPending ? 'pending' : 'history'}
          lang={lang}
          canDecide={canDecide}
          position={isPending ? index + 1 : 1}
          total={isPending ? queue.length : 1}
          suspendKeys={busy}
          signerLabel={user ? `${user.name} (${user.label})` : ''}
          onClose={() => onOpen(null)}
          onPrev={() => go(-1)}
          onNext={() => go(1)}
          onApprove={requestApprove}
          onReturn={requestReturn}
        />
      )}
      {modals}
    </>
  );
}
