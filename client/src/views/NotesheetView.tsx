import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ViewProps, t } from '../types';
import { showToast } from '../components/ToastManager';
import { readToken } from '../lib/theme';
import { today, nowStamp } from '../lib/clock';
import { signatureCode } from '../lib/hash';
import { useCurrentUser, useCan } from '../auth/session';
import {
  CheckCircle, Clock, ShieldCheck, PenTool, Stamp,
  FileText, QrCode, Lock, CheckCheck, Layers, X, Printer, RotateCcw, Crown, Plus, Inbox
} from 'lucide-react';
import OfficialDocumentModal, { DocumentData } from '../components/OfficialDocumentModal';
import InitiateNotesheetModal, {
  NewNotesheetData,
  AVAILABLE_OFFICERS,
} from '../components/notesheet/InitiateNotesheetModal';
import RejectionExplanationModal, { RejectionData } from '../components/RejectionExplanationModal';
import { EmptyState } from '../components/ui';
import { approvalStore } from '../store/approvalStore';
import { useNotesheetStore, NoteFile, isTurnOf, pendingStepOf } from '../store/notesheetStore';

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

  const [activeFileId, setActiveFileId] = useState<string>(() => visibleFiles[0]?.id ?? '');
  const [newNoteText, setNewNoteText] = useState('');
  const [isSigned, setIsSigned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'sheet' | 'audit' | 'compare'>('sheet');
  const [showCertModal, setShowCertModal] = useState(false);
  const [showOfficialDoc, setShowOfficialDoc] = useState(false);
  const [showInitiateModal, setShowInitiateModal] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = readToken('--text-1');
  }, [activeFileId, activeTab]);

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    const mouseEvent = e as React.MouseEvent<HTMLCanvasElement>;
    return {
      x: mouseEvent.clientX - rect.left,
      y: mouseEvent.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCanvasCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCanvasCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    // A drawn stroke counts as the signer's mark; the hash is computed on submit.
    setIsSigned(true);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsSigned(false);
  };

  // Route position: whose turn it is, and whether that is the final step.
  const route = currentFile?.signatoryRoute ?? [];
  const currentPendingStep = currentFile ? pendingStepOf(currentFile) : null;
  const currentPendingStepIndex = currentPendingStep ? route.indexOf(currentPendingStep) : -1;
  const nextStep = currentPendingStepIndex >= 0 ? route[currentPendingStepIndex + 1] ?? null : null;
  const isFinalStep = currentFile ? (currentPendingStep ? nextStep === null : currentFile.status !== 'approved') : false;
  const isMyTurn = !!currentFile && !!user && canSign && isTurnOf(currentFile, user.role);
  const isApproved = currentFile?.status === 'approved';

  const awaitingName = currentPendingStep?.officerName
    ?? AVAILABLE_OFFICERS.find((o) => o.roleId === (currentFile?.finalApproverRole ?? 'chairman'))?.officerName
    ?? '';
  const awaitingRole = currentPendingStep?.roleName
    ?? AVAILABLE_OFFICERS.find((o) => o.roleId === (currentFile?.finalApproverRole ?? 'chairman'))?.roleName
    ?? '';

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
    setActiveTab('sheet');
    clearCanvas();

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

  const handleQuickSign = () => {
    if (!isMyTurn) return;
    setIsSigned(true);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = readToken('--text-1');
        ctx.fillStyle = readToken('--text-1');
        ctx.font = 'italic 700 20px "Outfit", Georgia, serif';
        ctx.fillText(actorName, 25, 65);
        ctx.beginPath();
        ctx.moveTo(20, 75);
        ctx.bezierCurveTo(70, 95, 180, 55, 270, 70);
        ctx.stroke();
      }
    }
  };

  const handleSignAndAdvance = async () => {
    if (!currentFile || !user || !isMyTurn || isSubmitting) return;
    if (!isSigned) {
      showToast(
        t('Sign in the pad or use the signature stamp first.', 'অনুগ্রহ করে প্রথমে স্বাক্ষর করুন।', lang),
        'info'
      );
      return;
    }

    const defaultRemark = isFinalStep
      ? t('Approved as recommended. The concerned department may proceed as per company rules.', 'সুপারিশ অনুযায়ী অনুমোদিত। সংশ্লিষ্ট বিভাগ কোম্পানির নিয়ম অনুযায়ী অগ্রসর হতে পারে।', lang)
      : t(`Reviewed and found in order. Forwarded to ${nextStep?.officerName ?? 'the next approving authority'}.`, `পর্যালোচিত ও যথাযথ পাওয়া গেছে। ${nextStep?.officerName ?? 'পরবর্তী অনুমোদনকারী'}-এর কাছে পাঠানো হলো।`, lang);
    const comment = newNoteText.trim() || defaultRemark;

    setIsSubmitting(true);
    try {
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
        return;
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

      setNewNoteText('');
      clearCanvas();
    } finally {
      setIsSubmitting(false);
    }
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
    paragraphs: currentFile.notes.map((n) => ({
      label: `Para ${n.para} (${n.dept})`,
      text: n.body,
      signedBy: `${n.author} — ${n.role}`,
      hash: n.hash,
    })),
  } : null;

  if (!currentFile || !officialDocData) {
    return (
      <div className="view-container">
        <EmptyState
          icon={<Inbox size={28} />}
          title={t('No note-sheets in your scope', 'আপনার আওতায় কোনো নোট-শীট নেই', lang)}
          description={t('Files you initiate or are asked to sign will appear here.', 'আপনি যে ফাইল শুরু করবেন বা স্বাক্ষরের জন্য পাবেন তা এখানে দেখা যাবে।', lang)}
          action={canCreate ? (
            <button className="btn-primary" onClick={() => setShowInitiateModal(true)}>
              <Plus size={13} /> {t('New note-sheet', 'নতুন নোট-শীট', lang)}
            </button>
          ) : undefined}
        />
        {showInitiateModal && (
          <InitiateNotesheetModal
            isOpen={showInitiateModal}
            onClose={() => setShowInitiateModal(false)}
            onSubmit={handleCreateNotesheet}
            lang={lang}
            currentRole={role}
          />
        )}
      </div>
    );
  }

  return (
    <div className="view-container">
      {/* Header & Actions */}
      <div className="section-header" style={{ marginBottom: '14px', alignItems: 'center' }}>
        <div>
          <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '18px' }}>
            <span>✍️</span>
            <span>{t('Electronic Note-Sheet & Document Approvals', 'ই-নোটশীট ও ডিজিটাল অনুমোদন প্ল্যাটফর্ম', lang)}</span>
          </h2>
          <p className="section-subtitle" style={{ margin: '3px 0 0', fontSize: '11.5px', color: 'var(--brand-slate-500)' }}>
            {t(
              'Sequential departmental review, transparent remarks, and verified digital signatures.',
              'ধারাবাহিক বিভাগীয় অনুমোদন, সুস্পষ্ট মন্তব্য ও ডিজিটাল স্বাক্ষর খতিয়ান।',
              lang
            )}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Segmented View Switcher */}
          <div style={{ display: 'inline-flex', background: 'var(--brand-slate-100)', padding: '3px', borderRadius: '8px', border: '1px solid var(--brand-slate-200)' }}>
            <button
              onClick={() => setActiveTab('sheet')}
              style={{
                border: 'none',
                background: activeTab === 'sheet' ? 'var(--surface-1)' : 'transparent',
                boxShadow: activeTab === 'sheet' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '11.5px',
                fontWeight: activeTab === 'sheet' ? 700 : 500,
                color: activeTab === 'sheet' ? 'var(--brand-crimson)' : 'var(--brand-slate-600)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <FileText size={13} /> {t('Note Sheet', 'নোটশীট', lang)}
            </button>
            <button
              onClick={() => setActiveTab('compare')}
              style={{
                border: 'none',
                background: activeTab === 'compare' ? 'var(--surface-1)' : 'transparent',
                boxShadow: activeTab === 'compare' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '11.5px',
                fontWeight: activeTab === 'compare' ? 700 : 500,
                color: activeTab === 'compare' ? 'var(--brand-crimson)' : 'var(--brand-slate-600)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <Layers size={13} /> {t('Vendor Quotations', 'দরপত্র ও প্রাক্কলন', lang)}
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              style={{
                border: 'none',
                background: activeTab === 'audit' ? 'var(--surface-1)' : 'transparent',
                boxShadow: activeTab === 'audit' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '11.5px',
                fontWeight: activeTab === 'audit' ? 700 : 500,
                color: activeTab === 'audit' ? 'var(--brand-crimson)' : 'var(--brand-slate-600)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <Lock size={13} /> {t('Signatures & History', 'স্বাক্ষর ও খতিয়ান', lang)}
            </button>
          </div>

          {/* Quick Actions */}
          {canCreate && (
            <button
              className="btn-primary"
              onClick={() => setShowInitiateModal(true)}
              style={{ fontSize: '11.5px', padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
            >
              <Plus size={13} /> {t('New note-sheet', 'নতুন নোট-শীট', lang)}
            </button>
          )}
          <button
            className="btn-outline"
            onClick={() => setShowOfficialDoc(true)}
            style={{ fontSize: '11.5px', padding: '5px 10px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
          >
            <Printer size={13} /> {t('Print', 'প্রিন্ট', lang)}
          </button>
          <button
            className="btn-outline"
            onClick={() => setShowCertModal(true)}
            disabled={!isApproved}
            title={isApproved ? undefined : t('Available once the file is approved', 'ফাইল অনুমোদিত হলে পাওয়া যাবে', lang)}
            style={{ fontSize: '11.5px', padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: '5px', opacity: isApproved ? 1 : 0.55 }}
          >
            <QrCode size={13} /> {t('Approval certificate', 'অনুমোদন সনদ', lang)}
          </button>
        </div>
      </div>

      {/* Dossier Selector Bar */}
      <div className="card mb-4" style={{ padding: '10px 16px', background: 'var(--brand-card-bg)', border: '1px solid var(--brand-border)', borderRadius: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', maxWidth: '100%' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-slate-400)', textTransform: 'uppercase', letterSpacing: '0.5px', marginRight: '4px' }}>
              {t('Files', 'ফাইল', lang)}:
            </span>
            {visibleFiles.map((file) => {
              const isSelected = currentFile.id === file.id;
              const myTurn = !!user && canSign && isTurnOf(file, user.role);
              return (
                <button
                  key={file.id}
                  onClick={() => {
                    setActiveFileId(file.id);
                    clearCanvas();
                  }}
                  style={{
                    border: isSelected ? '1px solid var(--brand-crimson)' : '1px solid var(--brand-slate-200)',
                    background: isSelected ? 'var(--brand-crimson)' : 'var(--brand-card-bg)',
                    color: isSelected ? 'var(--text-on-brand)' : 'var(--brand-slate-700)',
                    padding: '4px 11px',
                    borderRadius: '16px',
                    fontSize: '11.5px',
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span>{file.fileNo.split('/').slice(-2).join('/')}</span>
                  {file.status === 'approved' ? (
                    <CheckCircle size={11} style={{ color: isSelected ? 'var(--text-on-brand)' : 'var(--status-success)' }} />
                  ) : myTurn ? (
                    <PenTool size={11} style={{ color: isSelected ? 'var(--text-on-brand)' : 'var(--brand-crimson)' }} />
                  ) : (
                    <Clock size={11} style={{ color: isSelected ? 'var(--text-on-brand)' : 'var(--status-warning)' }} />
                  )}
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className={`badge ${currentFile.urgency === 'urgent' ? 'danger' : currentFile.urgency === 'high' ? 'warn' : 'info'}`}>
              {currentFile.urgency === 'urgent' ? t('Urgent', 'জরুরি', lang) : currentFile.urgency === 'high' ? t('High', 'উচ্চ', lang) : t('Normal', 'সাধারণ', lang)}
            </span>
            <span className={`badge ${currentFile.status === 'approved' ? 'success' : currentFile.status === 'in_review' ? 'warn' : isMyTurn ? 'danger' : 'gold'}`}>
              {currentFile.status === 'approved'
                ? t('Approved', 'অনুমোদিত', lang)
                : currentFile.status === 'in_review'
                  ? t('Returned for correction', 'সংশোধনের জন্য ফেরত', lang)
                  : isMyTurn
                    ? t('Awaiting your signature', 'আপনার স্বাক্ষরের অপেক্ষায়', lang)
                    : t(`Awaiting ${awaitingName}`, `${awaitingName}-এর অপেক্ষায়`, lang)}
            </span>
          </div>
        </div>
      </div>

      {/* TAB 1: MAIN NOTE SHEET */}
      {activeTab === 'sheet' && (
        <div className="notesheet-grid-2col grid-2col-main">
          {/* Left Column: Note-Sheet Document */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="card" style={{ padding: '20px', border: '1px solid var(--brand-slate-200)', background: 'var(--brand-card-bg)' }}>
              {/* Document Letterhead */}
              <div style={{ borderBottom: '2px solid var(--brand-crimson)', paddingBottom: '14px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 800, color: 'var(--brand-crimson)' }}>
                      BASHUNDHARA OIL & GAS COMPANY LIMITED
                    </div>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--brand-slate-900)', margin: '4px 0 2px 0' }}>
                      {currentFile.title}
                    </h3>
                    <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)' }}>
                      File No: <strong>{currentFile.fileNo}</strong> • Date: {currentFile.date} • Dept: {currentFile.dept}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '10px', color: 'var(--brand-slate-400)', textTransform: 'uppercase' }}>Financial Value</div>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--brand-crimson)' }}>{currentFile.amount}</div>
                  </div>
                </div>
              </div>

              {/* Sequential Signatory Route Tracker */}
              {currentFile.signatoryRoute && currentFile.signatoryRoute.length > 0 && (
                <div style={{ background: 'var(--brand-slate-50)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--brand-slate-200)', marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-slate-500)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                    Approval Route & Status
                  </div>
                  <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                    {currentFile.signatoryRoute.map((step, idx) => (
                      <div
                        key={step.id || idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          background: step.status === 'signed' ? 'var(--status-success-bg)' : step.status === 'pending' ? 'var(--status-warning-bg)' : 'var(--surface-2)',
                          border: step.status === 'signed' ? '1px solid var(--status-success)' : step.status === 'pending' ? '1px solid var(--status-warning)' : '1px solid var(--border-1)',
                          fontSize: '11px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <span style={{ fontWeight: 800, color: step.status === 'signed' ? 'var(--status-success)' : step.status === 'pending' ? 'var(--status-warning)' : 'var(--text-muted)' }}>
                          {idx + 1}. {step.officerName}
                        </span>
                        <span style={{ fontSize: '10px', color: step.status === 'signed' ? 'var(--status-success)' : 'var(--text-3)' }}>
                          ({step.roleName.split(' ')[0]})
                        </span>
                        {step.status === 'signed' ? (
                          <span style={{ color: 'var(--status-success)', fontWeight: 800 }}>✓</span>
                        ) : step.status === 'pending' ? (
                          <span style={{ color: 'var(--status-warning)', fontWeight: 800 }}>⏳</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>•</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes Paragraphs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {currentFile.notes.map((n) => (
                  <div
                    key={n.id}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: n.isChairman ? '1px solid var(--brand-gold)' : '1px solid var(--brand-slate-200)',
                      background: n.isChairman ? 'rgba(212, 175, 55, 0.04)' : 'var(--brand-card-bg)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '11.5px', fontWeight: 800, color: n.isChairman ? 'var(--status-warning-text)' : 'var(--brand-slate-700)' }}>
                          Para {n.para}.
                        </span>
                        <strong style={{ fontSize: '12.5px', color: 'var(--brand-slate-900)' }}>{n.author}</strong>
                        <span style={{ fontSize: '11px', color: 'var(--brand-slate-500)' }}>({n.role} · {n.dept})</span>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--brand-slate-400)' }}>{n.date}</span>
                    </div>

                    <p style={{ fontSize: '12.5px', lineHeight: '1.6', margin: '0 0 8px 0', color: 'var(--brand-slate-800)', whiteSpace: 'pre-line' }}>
                      {n.body}
                    </p>

                    {n.hash && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--brand-slate-100)', paddingTop: '6px', fontSize: '10px', color: 'var(--brand-slate-400)', flexWrap: 'wrap', gap: '4px' }}>
                        <span style={{ fontFamily: 'monospace' }}>🔒 Verification Code: {n.hash}</span>
                        <span style={{ color: 'var(--status-success)', fontWeight: 600 }}>✓ Verified Stamp</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Budget Allocation Summary Card */}
            {currentFile.budgetInfo && (
              <div className="card" style={{ padding: '14px 18px', border: '1px solid var(--brand-slate-200)', background: 'var(--brand-slate-50)' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--brand-slate-800)', marginBottom: '8px' }}>
                  📊 Budget & Account Allocation Summary
                </div>
                <div className="responsive-col-3" style={{ gap: '10px', fontSize: '11.5px' }}>
                  <div>
                    <div style={{ color: 'var(--brand-slate-500)' }}>Budget Head:</div>
                    <strong>{currentFile.budgetInfo.budgetHead}</strong>
                  </div>
                  <div>
                    <div style={{ color: 'var(--brand-slate-500)' }}>Account Code:</div>
                    <code style={{ fontWeight: 700 }}>{currentFile.budgetInfo.accountCode}</code>
                  </div>
                  <div>
                    <div style={{ color: 'var(--brand-slate-500)' }}>Available Balance:</div>
                    <strong style={{ color: 'var(--status-success)' }}>{currentFile.budgetInfo.availableBalance}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: signing controls (only for the officer whose turn it is) or file status */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {isMyTurn ? (
            <div className="card" style={{ border: '1px solid var(--brand-slate-200)', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <div className="card-hd-icon" style={{ width: '28px', height: '28px' }}><Stamp size={15} /></div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--brand-slate-900)' }}>
                    {t('Sign & endorse', 'স্বাক্ষর ও অনুমোদন', lang)}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)' }}>
                    {t('Add remarks and apply your digital signature', 'মন্তব্য যোগ করুন ও স্বাক্ষর সম্পন্ন করুন', lang)}
                  </div>
                </div>
              </div>

              {/* Signer capsule: always the signed-in user */}
              <div style={{
                padding: '9px 12px',
                background: isFinalStep ? 'rgba(212, 175, 55, 0.1)' : 'rgba(165, 28, 48, 0.05)',
                border: isFinalStep ? '1px solid var(--brand-gold)' : '1px solid rgba(165, 28, 48, 0.2)',
                borderRadius: '6px',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontSize: '9.5px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--brand-slate-500)', fontWeight: 700 }}>
                    {isFinalStep ? t('Signing as final approver', 'চূড়ান্ত অনুমোদনকারী হিসেবে স্বাক্ষর', lang) : t('Signing as reviewing officer', 'পর্যালোচনাকারী কর্মকর্তা হিসেবে স্বাক্ষর', lang)}
                  </div>
                  <div style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--brand-slate-900)' }}>
                    {t(user?.name ?? '', user?.nameBn ?? '', lang)}
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-500)' }}>
                    {t(user?.label ?? '', user?.labelBn ?? '', lang)} · {user?.empId}
                  </div>
                </div>
                {isFinalStep && (
                  <span style={{ fontSize: '9px', background: 'var(--status-warning-bg)', color: 'var(--status-warning-text)', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>
                    {t('FINAL STEP', 'চূড়ান্ত ধাপ', lang)}
                  </span>
                )}
              </div>

              {/* Signature stamp */}
              <button
                type="button"
                onClick={handleQuickSign}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px dashed var(--brand-gold)',
                  background: 'rgba(212, 175, 55, 0.08)',
                  color: 'var(--status-warning-text)',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  marginBottom: '10px',
                }}
              >
                {user?.role === 'chairman' ? <Crown size={14} color="var(--brand-gold)" /> : <Stamp size={14} color="var(--status-warning-text)" />}
                <span>{t('Apply my signature stamp', 'আমার স্বাক্ষর স্ট্যাম্প প্রয়োগ করুন', lang)}</span>
              </button>

              {/* Canvas Pad */}
              <div style={{ border: '1px solid var(--brand-slate-200)', borderRadius: '6px', background: 'var(--surface-0)', position: 'relative', height: '100px', marginBottom: '10px' }}>
                <canvas
                  ref={canvasRef}
                  width={340}
                  height={100}
                  style={{ width: '100%', height: '100%', cursor: 'crosshair', touchAction: 'none' }}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
                {!isDrawing && !isSigned && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', color: 'var(--brand-slate-400)', fontSize: '11px' }}>
                    <PenTool size={13} style={{ marginRight: '5px' }} /> {t('Or draw your signature here', 'অথবা এখানে স্বাক্ষর আঁকুন', lang)}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <button
                  type="button"
                  onClick={clearCanvas}
                  style={{ border: 'none', background: 'transparent', color: 'var(--brand-slate-500)', fontSize: '11px', cursor: 'pointer', padding: 0 }}
                >
                  {t('Clear signature', 'স্বাক্ষর মুছুন', lang)}
                </button>
                {isSigned && (
                  <span style={{ fontSize: '10.5px', color: 'var(--status-success)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle size={11} /> {t('Signature ready', 'স্বাক্ষর প্রস্তুত', lang)}
                  </span>
                )}
              </div>

              {/* Remarks Textarea */}
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px' }}>{t('Remarks', 'মন্তব্য', lang)}</label>
                <textarea
                  rows={3}
                  placeholder={
                    isFinalStep
                      ? t('Approved as recommended. Release purchase order and proceed with works.', 'সুপারিশ অনুযায়ী অনুমোদিত। ক্রয়াদেশ জারি করে কাজ শুরু করুন।', lang)
                      : t('Reviewed and found in order. Forwarded for next signature.', 'পর্যালোচিত ও যথাযথ। পরবর্তী স্বাক্ষরের জন্য পাঠানো হলো।', lang)
                  }
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  style={{ fontSize: '12px' }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleSignAndAdvance}
                  disabled={isSubmitting}
                  style={{
                    flex: 2,
                    fontWeight: 800,
                    fontSize: '12px',
                    padding: '9px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <CheckCheck size={14} />
                  <span>{isFinalStep ? t('Approve & close file', 'অনুমোদন ও ফাইল বন্ধ', lang) : t('Sign & forward', 'স্বাক্ষর ও ফরোয়ার্ড', lang)}</span>
                </button>

                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setShowReturnModal(true)}
                  style={{
                    flex: 1,
                    fontSize: '12px',
                    padding: '9px 10px',
                    color: 'var(--status-danger)',
                    borderColor: 'var(--status-danger)',
                    background: 'rgba(220, 38, 38, 0.04)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                  }}
                >
                  <RotateCcw size={13} />
                  <span>{t('Return', 'ফেরত', lang)}</span>
                </button>
              </div>
            </div>
            ) : (
            <div className="card" style={{ border: '1px solid var(--brand-slate-200)', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <div className="card-hd-icon" style={{ width: '28px', height: '28px' }}>
                  {isApproved ? <ShieldCheck size={15} /> : <Clock size={15} />}
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--brand-slate-900)' }}>
                    {isApproved
                      ? t('File approved', 'ফাইল অনুমোদিত', lang)
                      : currentFile.status === 'in_review'
                        ? t('Returned to initiator', 'সূচনাকারীর কাছে ফেরত', lang)
                        : t('Awaiting signature', 'স্বাক্ষরের অপেক্ষায়', lang)}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)' }}>
                    {isApproved
                      ? t('All signatories have signed. The certificate is available.', 'সব স্বাক্ষরকারী স্বাক্ষর করেছেন। সনদ পাওয়া যাচ্ছে।', lang)
                      : currentFile.status === 'in_review'
                        ? t('Corrections requested; the file will be re-routed once resubmitted.', 'সংশোধন চাওয়া হয়েছে; পুনরায় জমা দিলে ফাইলটি আবার পাঠানো হবে।', lang)
                        : t('You have read access to this file.', 'এই ফাইলে আপনার কেবল পড়ার অনুমতি আছে।', lang)}
                  </div>
                </div>
              </div>

              {!isApproved && currentFile.status !== 'in_review' && (
                <div style={{ padding: '9px 12px', background: 'var(--status-warning-bg)', border: '1px solid var(--status-warning-border)', borderRadius: '6px', marginBottom: '12px' }}>
                  <div style={{ fontSize: '9.5px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--brand-slate-500)', fontWeight: 700 }}>
                    {isFinalStep ? t('Final approver', 'চূড়ান্ত অনুমোদনকারী', lang) : t('Next signatory', 'পরবর্তী স্বাক্ষরকারী', lang)}
                  </div>
                  <div style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--brand-slate-900)' }}>{awaitingName}</div>
                  <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-500)' }}>{awaitingRole}</div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11.5px', color: 'var(--brand-slate-700)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--brand-slate-500)' }}>{t('Initiated by', 'সূচনাকারী', lang)}</span>
                  <strong>{currentFile.initiatorName ?? currentFile.notes[0]?.author ?? '—'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--brand-slate-500)' }}>{t('Signatures', 'স্বাক্ষর', lang)}</span>
                  <strong>{route.length ? `${route.filter((s) => s.status === 'signed').length}/${route.length}` : currentFile.notes.filter((n) => n.hash).length}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--brand-slate-500)' }}>{t('Purchase ref', 'ক্রয় রেফারেন্স', lang)}</span>
                  <code style={{ fontSize: '11px' }}>{currentFile.sapRef}</code>
                </div>
              </div>

              <button
                type="button"
                className="btn-outline"
                onClick={() => setActiveTab('audit')}
                style={{ width: '100%', marginTop: '12px', fontSize: '11.5px', padding: '7px 10px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Lock size={12} /> {t('View signature history', 'স্বাক্ষর ইতিহাস দেখুন', lang)}
              </button>
            </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: VENDOR QUOTATIONS */}
      {activeTab === 'compare' && (
        <div className="card mb-4" style={{ border: '1px solid var(--brand-slate-200)', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: 'var(--brand-slate-900)' }}>
                {t('Vendor Quotations & Price Comparison', 'সরবরাহকারী দরপত্র ও মূল্য তুলনা', lang)}
              </h3>
              <p style={{ margin: '3px 0 0', fontSize: '11.5px', color: 'var(--brand-slate-500)' }}>
                File: {currentFile.fileNo} · {currentFile.title}
              </p>
            </div>
            <span className="badge success">Vetted by Procurement Committee</span>
          </div>

          {currentFile.quotations && currentFile.quotations.length > 0 ? (
            <div className="responsive-col-3" style={{ gap: '14px', marginBottom: '16px' }}>
              {currentFile.quotations.map((quote, idx) => (
                <div
                  key={idx}
                  style={{
                    border: quote.isRecommended ? '2px solid var(--status-success)' : '1px solid var(--brand-slate-200)',
                    borderRadius: '8px',
                    padding: '16px',
                    background: quote.isRecommended ? 'var(--status-success-bg)' : 'var(--brand-card-bg)',
                    position: 'relative',
                  }}
                >
                  {quote.isRecommended && (
                    <div style={{ position: 'absolute', top: '-10px', right: '14px', background: 'var(--status-success-solid)', color: 'var(--text-on-brand)', fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '10px' }}>
                      RECOMMENDED & LOWEST BID
                    </div>
                  )}
                  <div style={{ fontSize: '14px', fontWeight: 800, color: quote.isRecommended ? 'var(--status-success-text)' : 'var(--brand-slate-900)' }}>
                    {quote.vendor}
                  </div>
                  <div style={{ fontSize: '11px', color: quote.isRecommended ? 'var(--status-success-text)' : 'var(--brand-slate-500)' }}>
                    Origin: {quote.origin}
                  </div>

                  <div style={{ margin: '12px 0', borderTop: '1px solid var(--brand-slate-200)', borderBottom: '1px solid var(--brand-slate-200)', padding: '8px 0' }}>
                    <div style={{ fontSize: '20px', fontWeight: 900, color: quote.isRecommended ? 'var(--status-success-text)' : 'var(--brand-slate-800)' }}>
                      {quote.priceText}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '11.5px', color: 'var(--brand-slate-700)' }}>
                    <div><strong>Delivery:</strong> {quote.deliveryTime}</div>
                    <div><strong>Warranty:</strong> {quote.warranty}</div>
                    <div><strong>Notes:</strong> {quote.remarks}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '36px', background: 'var(--brand-slate-50)', borderRadius: '8px' }}>
              <FileText size={32} color="var(--brand-slate-400)" style={{ margin: '0 auto 8px' }} />
              <div style={{ fontWeight: 700, fontSize: '13px' }}>Standard Purchasing File</div>
              <div style={{ fontSize: '11.5px', color: 'var(--brand-slate-500)', marginTop: '4px' }}>
                Competitive vendor bids are verified and linked under purchase reference <strong>{currentFile.sapRef}</strong>.
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SIGNATURES & HISTORY */}
      {activeTab === 'audit' && (
        <div className="card mb-4" style={{ border: '1px solid var(--brand-slate-200)', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: 'var(--brand-slate-900)' }}>
                {t('Document Approval History & Audit Trail', 'অনুমোদন প্রক্রিয়া ও দাপ্তরিক খতিয়ান', lang)}
              </h3>
              <p style={{ margin: '3px 0 0', fontSize: '11.5px', color: 'var(--brand-slate-500)' }}>
                {t('File', 'ফাইল', lang)}: {currentFile.fileNo}
              </p>
            </div>
            <span className={`badge ${isApproved ? 'success' : 'warn'}`}>
              {isApproved
                ? t('All signatures verified', 'সব স্বাক্ষর যাচাইকৃত', lang)
                : t(`${currentFile.notes.filter((n) => n.hash).length} signed · awaiting ${awaitingName}`, `${currentFile.notes.filter((n) => n.hash).length}টি স্বাক্ষরিত · ${awaitingName}-এর অপেক্ষায়`, lang)}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {currentFile.notes.map((n, idx) => (
              <div key={n.id} style={{ display: 'flex', gap: '12px', padding: '12px 14px', background: 'var(--brand-slate-50)', borderRadius: '8px', border: '1px solid var(--brand-slate-200)' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: n.isChairman ? 'var(--brand-gold)' : 'var(--status-success-solid)', color: 'var(--text-on-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '11px', flexShrink: 0 }}>
                  {idx + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                    <div style={{ fontWeight: 700, fontSize: '12.5px', color: 'var(--brand-slate-900)' }}>
                      {n.author} <span style={{ fontWeight: 400, color: 'var(--brand-slate-500)', fontSize: '11px' }}>({n.role})</span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--brand-slate-400)' }}>{n.date}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--brand-slate-700)', margin: '4px 0 6px 0', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                    {n.body}
                  </div>
                  {n.hash && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10.5px', color: 'var(--brand-slate-500)' }}>
                      <span style={{ background: 'var(--surface-1)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--brand-slate-200)', fontFamily: 'monospace' }}>
                        {n.hash}
                      </span>
                      <span style={{ color: 'var(--status-success)', fontWeight: 700 }}>✓ Verified Digital Signature</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certificate of Completion Modal */}
      {showCertModal && (
        <div className="app-modal-overlay" onClick={() => setShowCertModal(false)}>
          <div className="app-modal-dialog" style={{ maxWidth: '600px', width: '95vw' }} onClick={(e) => e.stopPropagation()}>
            <div className="app-modal-header">
              <div className="app-modal-header-left">
                <div className="app-modal-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--status-success)' }}>
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h3 className="app-modal-title">{t('Official Certificate of Approval', 'দাপ্তরিক অনুমোদন সনদ', lang)}</h3>
                  <div className="app-modal-subtitle">{t('Verified Corporate Document Record', 'বসুন্ধরা অয়েল অ্যান্ড গ্যাস কোম্পানি লিমিটেড', lang)}</div>
                </div>
              </div>
              <button className="app-modal-close" onClick={() => setShowCertModal(false)} aria-label="Close">
                <X size={16} />
              </button>
            </div>

            <div className="app-modal-body">
              <div style={{ border: '2px solid var(--brand-gold)', borderRadius: '12px', padding: '20px', background: 'rgba(212, 175, 55, 0.04)' }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--status-warning-text)', fontWeight: 800 }}>
                  BASHUNDHARA OIL & GAS COMPANY LIMITED
                </div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, margin: '8px 0 4px 0', color: 'var(--brand-crimson)' }}>
                  CERTIFICATE OF FINAL APPROVAL
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--brand-slate-600)' }}>
                  File Reference: <code>{currentFile.fileNo}</code>
                </div>

                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                  <div><strong>Subject:</strong> {currentFile.title}</div>
                  <div><strong>Amount Authorized:</strong> {currentFile.amount}</div>
                  <div><strong>Department:</strong> {currentFile.dept}</div>
                  <div><strong>Approval Date:</strong> {currentFile.date}</div>
                  <div style={{ color: 'var(--status-success)', fontWeight: 700 }}>✓ Verified by all designated authorities</div>
                </div>
              </div>
            </div>

            <div className="app-modal-footer">
              <button className="btn-primary" onClick={() => setShowCertModal(false)}>
                {t('Close', 'বন্ধ করুন', lang)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Printable Document Modal */}
      <OfficialDocumentModal
        isOpen={showOfficialDoc}
        onClose={() => setShowOfficialDoc(false)}
        lang={lang}
        docData={officialDocData}
      />

      {/* Initiate New Notesheet Modal */}
      <InitiateNotesheetModal
        isOpen={showInitiateModal}
        onClose={() => setShowInitiateModal(false)}
        onSubmit={handleCreateNotesheet}
        lang={lang}
        currentRole={role}
      />

      {/* Rejection / Query Explanation Modal */}
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
