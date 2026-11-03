import { useState, type ReactNode } from 'react';
import { t, type Lang } from '../../types';
import { showToast } from '../../components/ToastManager';
import { useCurrentUser } from '../../auth/session';
import { useApprovalStore, type ApprovalItem } from '../../store/approvalStore';
import AuthorizeDirectiveModal, { type AuthorizeData } from '../../components/AuthorizeDirectiveModal';
import RejectionExplanationModal, { type RejectionData } from '../../components/RejectionExplanationModal';

interface Decisions {
  requestApprove: (item: ApprovalItem) => void;
  requestReturn: (item: ApprovalItem) => void;
  /** Render once, anywhere in the tree: the directive and return-with-query modals. */
  modals: ReactNode;
  /** True while one of the decision modals is open (pause keyboard shortcuts). */
  busy: boolean;
}

/**
 * Single decision flow for every place an approval can be decided
 * (Approvals page, dashboard review drawer): approve captures an executive
 * directive, return captures a structured query. BR-17-20.
 */
export function useApprovalDecisions(lang: Lang, onDecided?: (id: string) => void): Decisions {
  const user = useCurrentUser();
  const { approveApprovalItem, rejectApprovalItem } = useApprovalStore();
  const [toAuthorize, setToAuthorize] = useState<ApprovalItem | null>(null);
  const [toReturn, setToReturn] = useState<ApprovalItem | null>(null);

  const reviewer = user ? `${user.name} (${user.label})` : '';

  const confirmAuthorize = (data: AuthorizeData) => {
    if (!toAuthorize || !user) return;
    const item = toAuthorize;
    const res = approveApprovalItem(item.id, data.directive, reviewer, user.role);
    setToAuthorize(null);
    onDecided?.(item.id);
    showToast(
      t(
        `✓ Approved ${item.id} (${item.amount || 'no amount'}). Voucher: ${res.sapVoucher}.`,
        `✓ অনুমোদিত ${item.id}: ভাউচার প্রস্তুত (${res.sapVoucher})।`,
        lang,
      ),
      'gold',
    );
  };

  const confirmReturn = (data: RejectionData) => {
    if (!toReturn || !user) return;
    const item = toReturn;
    rejectApprovalItem(item.id, data.reasonCategory, data.observation, data.improvementsRequired, reviewer, user.role);
    setToReturn(null);
    onDecided?.(item.id);
    showToast(
      t(
        `File ${item.id} returned to ${item.requester} with query: "${data.reasonCategory}".`,
        `${item.id} আপত্তি ও নির্দেশনাসহ ${item.requester}-এর নিকট ফেরত পাঠানো হয়েছে।`,
        lang,
      ),
      'warn',
    );
  };

  const modals = (
    <>
      {toAuthorize && (
        <AuthorizeDirectiveModal
          isOpen
          onClose={() => setToAuthorize(null)}
          onConfirm={confirmAuthorize}
          lang={lang}
          itemId={toAuthorize.id}
          itemTitle={toAuthorize.title}
          requesterName={toAuthorize.requester}
          department={toAuthorize.dept}
          amount={toAuthorize.amount}
          sapDocRef={toAuthorize.sapDocRef}
          approvalTrail={toAuthorize.approvalTrail}
          roleTitle={user?.label ?? ''}
          signerName={user?.name ?? ''}
        />
      )}
      {toReturn && (
        <RejectionExplanationModal
          isOpen
          onClose={() => setToReturn(null)}
          onConfirm={confirmReturn}
          lang={lang}
          title={t('Return Request with Query', 'আপত্তি ও নির্দেশনাসহ আবেদন ফেরত', lang)}
          itemId={toReturn.id}
          itemTitle={toReturn.title}
          requesterName={toReturn.requester}
          department={toReturn.dept}
          amount={toReturn.amount}
          categoryType={
            toReturn.sourceType === 'claim' || toReturn.sourceType === 'requisition' || toReturn.sourceType === 'notesheet'
              ? toReturn.sourceType
              : 'general'
          }
        />
      )}
    </>
  );

  return {
    requestApprove: setToAuthorize,
    requestReturn: setToReturn,
    modals,
    busy: !!toAuthorize || !!toReturn,
  };
}
