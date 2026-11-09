import { useCallback, useMemo, useState } from 'react';
import { ViewProps, t } from '../types';
import { showToast } from '../components/ToastManager';
import { today, nowStamp } from '../lib/clock';
import { signatureCode } from '../lib/hash';
import { useCurrentUser, useCan } from '../auth/session';
import { Plus, Inbox } from 'lucide-react';
import OfficialDocumentModal, { DocumentData } from '../components/OfficialDocumentModal';
import InitiateNotesheetModal, {
  NewNotesheetData,
  AVAILABLE_OFFICERS,
} from '../components/notesheet/InitiateNotesheetModal';
import RejectionExplanationModal, { RejectionData } from '../components/RejectionExplanationModal';
import { Button, EmptyState, PageHeader } from '../components/ui';
import { approvalStore } from '../store/approvalStore';
import { useNotesheetStore, NoteFile, isTurnOf, pendingStepOf } from '../store/notesheetStore';
import FileRail from './notesheet/FileRail';
import SignPanel from './notesheet/SignPanel';
import CertificateModal from './notesheet/CertificateModal';
import FileSummary from './notesheet/Summary';
import { BudgetCheck, Discussion, PriceComparison } from './notesheet/Panels';
import { fileStateOf } from './notesheet/helpers';

export default function NotesheetView({ role, lang }: ViewProps) {
  const { files, addFile, signStep, returnFileForRevision } = useNotesheetStore();
  const user = useCurrentUser();
  const canSign = useCan('notesheet:sign');
  const canCreate = useCan('notesheet:create');
  const canViewAll = useCan('notesheet:view_all');

  // Scope: executives/approvers see every file; others only files they
  // initiated, sit on the route of, or that belong to their department.
  const visibleFiles = useMemo(() => {
    if (canViewAll || !user) return files;
    return files.filter(
      (f) =>
        f.initiatorName === user.name ||
        f.signatoryRoute?.some((s) => s.roleId === user.role) ||
        f.dept === user.dept
    );
  }, [files, canViewAll, user]);

  const stateOf = useCallback(
    (file: NoteFile) => fileStateOf(file, user?.role, canSign),
    [user?.role, canSign],
  );

  // Land on the first file that needs this user's signature, otherwise the first file.
  const [activeFileId, setActiveFileId] = useState<string>(
    () => (visibleFiles.find((f) => stateOf(f) === 'mine') ?? visibleFiles[0])?.id ?? '',
  );
  const [showCertModal, setShowCertModal] = useState(false);
  const [showOfficialDoc, setShowOfficialDoc] = useState(false);
  const [showInitiateModal, setShowInitiateModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);

  const currentFile: NoteFile | null =
    visibleFiles.find((f) => f.id === activeFileId) ?? visibleFiles[0] ?? null;

  const actorName = user?.name ?? '';
  const actorRoleTitle = user?.label ?? '';
  const actorDept = user?.dept ?? '';

  const handleRejectOrReturn = async (data: RejectionData) => {
    if (!currentFile || !user) return;
    const hash = await signatureCode([currentFile.fileNo, 'RETURN', user.empId, data.reasonCategory, nowStamp()]);
    returnFileForRevision({
      fileIdOrNo: currentFile.id,
      actorName,
      actorRoleTitle,
      actorDept,
      actorRole: role,
      reasonCategory: data.reasonCategory,
      observation: data.observation,
      improvementsRequired: data.improvementsRequired,
      hash,
    });

    // Mirror to approval store
    approvalStore.syncSourceDecision(currentFile.id, 'rejected', data.reasonCategory);

    setShowReturnModal(false);
    showToast(
      t(
        `File ${currentFile.fileNo} returned with query: "${data.reasonCategory}". Sent to initiator for corrections.`,
        `নথিটি সংশোধনের নির্দেশনাসহ ফেরত পাঠানো হয়েছে।`,
        lang
      ),
      'warn'
    );
  };

  // Route position: whose turn it is, and whether that is the final step.
  const route = currentFile?.signatoryRoute ?? [];
  const currentPendingStep = currentFile ? pendingStepOf(currentFile) : null;
  const currentPendingStepIndex = currentPendingStep ? route.indexOf(currentPendingStep) : -1;
  const nextStep = currentPendingStepIndex >= 0 ? route[currentPendingStepIndex + 1] ?? null : null;
  const isFinalStep = currentFile ? (currentPendingStep ? nextStep === null : currentFile.status !== 'approved') : false;
  const isMyTurn = !!currentFile && !!user && canSign && isTurnOf(currentFile, user.role);
  const state = currentFile ? stateOf(currentFile) : 'waiting';

  const fallbackApprover = AVAILABLE_OFFICERS.find((o) => o.roleId === (currentFile?.finalApproverRole ?? 'chairman'));
  const awaitingName = currentPendingStep?.officerName ?? fallbackApprover?.officerName ?? '';

  const handleCreateNotesheet = async (data: NewNotesheetData) => {
    const stamp = nowStamp();
    const initHash = await signatureCode([data.fileNo, '1', data.initiatorName, data.initialNote, stamp]);
    const newFile: NoteFile = {
      id: `f-${data.fileNo.replace(/\//g, '-')}`,
      fileNo: data.fileNo,
      title: data.title,
      dept: data.dept,
      amount: data.amount,
      urgency: data.urgency,
      status: data.signatoryRoute[0]?.roleId === 'chairman' ? 'pending_chairman' : 'pending_approval',
      date: today(),
      sapRef: data.sapRef,
      initiatorName: data.initiatorName,
      initiatorRole: data.initiatorRole,
      initiatorDept: data.initiatorDept,
      finalApproverRole: data.finalApproverRole,
      signatoryRoute: data.signatoryRoute,
      notes: [
        {
          id: 1,
          para: 1,
          author: data.initiatorName,
          role: data.initiatorRole,
          dept: data.initiatorDept,
          date: stamp,
          body: data.initialNote,
          status: 'forwarded',
          hash: initHash,
        },
      ],
      attachments: data.attachments,
      quotations: [],
      budgetInfo: {
        budgetHead: data.dept,
        accountCode: 'GL-2026-OPEX',
        annualAllocation: '৳1,00,00,000',
        availableBalance: '৳65,00,000',
        thisProposalAmount: data.amount,
        purchaseOrderRef: `PO-${data.fileNo.replace(/\//g, '-')}`,
      },
    };

    addFile(newFile);
    setActiveFileId(newFile.id);

    // Mirror to the approvals queue
    approvalStore.addNotesheetApproval(newFile.id, data.fileNo, data.title, data.initiatorName, data.dept, data.amount);
    showToast(
      t(
        `Note-sheet ${data.fileNo} created and sent to ${data.signatoryRoute[0]?.officerName ?? 'the first reviewer'}.`,
        `নোট-শীট ${data.fileNo} তৈরি হয়েছে এবং ${data.signatoryRoute[0]?.officerName ?? 'প্রথম পর্যালোচক'}-এর কাছে পাঠানো হয়েছে।`,
        lang
      ),
      'gold'
    );
  };

  /** Records this officer's signature; resolves true when it was accepted. */
  const handleSign = async (remark: string): Promise<boolean> => {
    if (!currentFile || !user || !isMyTurn) return false;

    const defaultRemark = isFinalStep
      ? t('Approved as recommended. The concerned department may proceed as per company rules.', 'সুপারিশ অনুযায়ী অনুমোদিত। সংশ্লিষ্ট বিভাগ কোম্পানির নিয়ম অনুযায়ী অগ্রসর হতে পারে।', lang)
      : t(`Reviewed and found in order. Forwarded to ${nextStep?.officerName ?? 'the next approving authority'}.`, `পর্যালোচিত ও যথাযথ পাওয়া গেছে। ${nextStep?.officerName ?? 'পরবর্তী অনুমোদনকারী'}-এর কাছে পাঠানো হলো।`, lang);
    const comment = remark || defaultRemark;

    const stamp = nowStamp();
    const hash = await signatureCode([currentFile.fileNo, String(currentFile.notes.length + 1), user.empId, comment, stamp]);
    const result = signStep({
      fileIdOrNo: currentFile.id,
      actorRole: user.role,
      actorName,
      actorRoleTitle,
      actorDept,
      remark: comment,
      hash,
    });

    if (!result.signed) {
      showToast(t('This file is not waiting on your signature.', 'এই ফাইলটি আপনার স্বাক্ষরের অপেক্ষায় নেই।', lang), 'warn');
      return false;
    }

    if (result.final) {
      approvalStore.syncSourceDecision(currentFile.id, 'approved', comment);
      showToast(
        t(`File ${currentFile.fileNo} is now approved. Signature ${hash}.`, `নথি ${currentFile.fileNo} অনুমোদিত হয়েছে। স্বাক্ষর ${hash}।`, lang),
        'success'
      );
      setShowCertModal(true);
    } else {
      showToast(
        t(`Signed and forwarded to ${result.nextStep?.officerName ?? 'the next authority'}.`, `স্বাক্ষরিত ও ${result.nextStep?.officerName ?? 'পরবর্তী কর্তৃপক্ষ'}-এর কাছে পাঠানো হয়েছে।`, lang),
        'info'
      );
    }
    return true;
  };

  const jumpToSign = () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById('ns-sign-panel')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  };

  const finalApprover = AVAILABLE_OFFICERS.find((o) => o.roleId === (currentFile?.finalApproverRole ?? 'chairman'));
  const officialDocData: DocumentData | null = currentFile ? {
    type: 'notesheet',
    docNumber: currentFile.fileNo,
    title: currentFile.title,
    date: currentFile.date,
    department: currentFile.dept,
    authorizedBy: finalApprover?.officerName ?? '',
    authorizerRole: finalApprover?.roleName ?? '',
    amountOrValue: currentFile.amount,
    sapReference: currentFile.sapRef,
    status: state === 'approved' ? 'approved' : state === 'returned' ? 'returned' : 'in_progress',
    paragraphs: currentFile.notes.map((n) => ({
      label: `${t('Para', 'অনুচ্ছেদ', lang)} ${n.para} (${n.dept})`,
      text: n.body,
      signedBy: `${n.author} — ${n.role}`,
      hash: n.hash,
    })),
  } : null;

  // Mounted only while open so each new note-sheet starts from a clean form.
  const initiateModal = showInitiateModal ? (
    <InitiateNotesheetModal
      isOpen
      onClose={() => setShowInitiateModal(false)}
      onSubmit={handleCreateNotesheet}
      lang={lang}
      currentRole={role}
    />
  ) : null;

  const newButton = canCreate ? (
    <Button variant="primary" icon={<Plus size={14} />} onClick={() => setShowInitiateModal(true)}>
      {t('New note-sheet', 'নতুন নোট-শীট', lang)}
    </Button>
  ) : undefined;

  const header = newButton ? <PageHeader actions={newButton} /> : null;

  if (!currentFile || !officialDocData) {
    return (
      <div className="ns-page">
        {header}
        <div className="card">
          <EmptyState
            icon={<Inbox size={28} />}
            title={t('No note-sheets in your scope', 'আপনার আওতায় কোনো নোট-শীট নেই', lang)}
            description={t('Files you initiate or are asked to sign will appear here.', 'আপনি যে ফাইল শুরু করবেন বা স্বাক্ষরের জন্য পাবেন তা এখানে দেখা যাবে।', lang)}
          />
        </div>
        {initiateModal}
      </div>
    );
  }

  return (
    <div className="ns-page">
      {header}

      <div className="ns-workspace">
        <FileRail
          files={visibleFiles}
          activeId={currentFile.id}
          lang={lang}
          canSign={canSign}
          stateOf={stateOf}
          onSelect={setActiveFileId}
        />

        <div className="ns-main">
          <FileSummary
            file={currentFile}
            state={state}
            lang={lang}
            myRole={user?.role}
            isFinal={isFinalStep}
            awaitingName={awaitingName}
            nextName={nextStep?.officerName ?? null}
            onPrint={() => setShowOfficialDoc(true)}
            onCertificate={() => setShowCertModal(true)}
            onJumpToSign={jumpToSign}
          />

          <div className={`ns-sheet ${isMyTurn ? 'with-side' : ''}`}>
            <div className="ns-doc">
              <PriceComparison file={currentFile} lang={lang} />
              <BudgetCheck file={currentFile} lang={lang} />
              <Discussion file={currentFile} state={state} awaitingName={awaitingName} lang={lang} />
            </div>

            {isMyTurn && user && (
              <div className="ns-side">
                <SignPanel
                  key={`${currentFile.id}:${currentPendingStep?.id ?? 'final'}`}
                  file={currentFile}
                  user={user}
                  lang={lang}
                  isFinal={isFinalStep}
                  nextOfficer={nextStep?.officerName ?? null}
                  onSign={handleSign}
                  onReturn={() => setShowReturnModal(true)}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <CertificateModal file={currentFile} open={showCertModal} lang={lang} onClose={() => setShowCertModal(false)} />

      <OfficialDocumentModal
        isOpen={showOfficialDoc}
        onClose={() => setShowOfficialDoc(false)}
        lang={lang}
        docData={officialDocData}
      />

      {initiateModal}

      <RejectionExplanationModal
        isOpen={showReturnModal}
        onClose={() => setShowReturnModal(false)}
        onConfirm={handleRejectOrReturn}
        title={t(`Return File: ${currentFile.fileNo}`, `নথি ফেরত: ${currentFile.fileNo}`, lang)}
        itemId={currentFile.id}
        itemTitle={currentFile.title}
        department={currentFile.dept}
        amount={currentFile.amount}
        categoryType="notesheet"
        lang={lang}
      />
    </div>
  );
}
