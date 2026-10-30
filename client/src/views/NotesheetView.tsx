import React, { useState, useRef, useEffect } from 'react';
import { AppRole, ViewProps, t, ROLE_META } from '../types';
import { showToast } from '../App';
import {
  FileSignature, CheckCircle, Clock, ShieldCheck,
  Send, PenTool, Hash, ArrowRight, Stamp,
  FileText, QrCode, Lock, CheckCheck, Layers, X, Printer, RotateCcw, Crown, Plus
} from 'lucide-react';
import OfficialDocumentModal, { DocumentData } from '../components/OfficialDocumentModal';
import InitiateNotesheetModal, {
  SignatoryStep,
  NewNotesheetData,
  AVAILABLE_OFFICERS,
} from '../components/notesheet/InitiateNotesheetModal';
import RejectionExplanationModal, { RejectionData } from '../components/RejectionExplanationModal';
import { approvalStore } from '../store/approvalStore';
import { useNotesheetStore, NoteFile, NoteItem } from '../store/notesheetStore';

export default function NotesheetView({ role, lang }: ViewProps) {
  const { files, addFile, appendNote, approveFile, returnFileForRevision } = useNotesheetStore();

  const [activeFileId, setActiveFileId] = useState(files[0]?.id || 'f1');
  const [newNoteText, setNewNoteText] = useState('');
  const [isSigned, setIsSigned] = useState(false);
  const [activeTab, setActiveTab] = useState<'sheet' | 'audit' | 'compare'>('sheet');
  const [showCertModal, setShowCertModal] = useState(false);
  const [showOfficialDoc, setShowOfficialDoc] = useState(false);
  const [showInitiateModal, setShowInitiateModal] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureHash, setSignatureHash] = useState<string | null>(null);
  const [showReturnModal, setShowReturnModal] = useState(false);

  // Fallback to first file if active not found
  const currentFile = files.find((f) => f.id === activeFileId) || files[0] || {
    id: 'f1',
    fileNo: 'BOGCL/PLANT/2026/0894',
    title: 'Backup Power Generator Maintenance & Spare Parts Purchase',
    dept: 'Plant Operations',
    amount: '৳48,50,000',
    urgency: 'urgent' as const,
    status: 'pending_chairman' as const,
    date: '27 Oct 2026',
    sapRef: 'REF-PR-2026-90412',
    initiatorName: 'Engr. Tariqul Islam',
    initiatorRole: 'Senior Maintenance Engineer',
    initiatorDept: 'Keraniganj Plant Operations',
    finalApproverRole: 'chairman' as AppRole,
    signatoryRoute: [],
    notes: [],
    quotations: [],
    budgetInfo: {
      budgetHead: 'Plant Maintenance & Reliability',
      accountCode: 'GL-4102-KER',
      annualAllocation: '৳2,50,00,000',
      availableBalance: '৳1,18,40,000',
      thisProposalAmount: '৳48,50,000',
      purchaseOrderRef: 'PO-2026-KER-0894',
    },
  };

  const handleRejectOrReturn = (data: RejectionData) => {
    const actorMeta = ROLE_META[role] || ROLE_META.hod;
    returnFileForRevision({
      fileIdOrNo: currentFile.id,
      actorName: actorMeta.name,
      actorRoleTitle: actorMeta.label,
      actorDept: actorMeta.dept,
      actorRole: role,
      reasonCategory: data.reasonCategory,
      observation: data.observation,
      improvementsRequired: data.improvementsRequired,
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
    ctx.strokeStyle = '#1E293B';
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
    setIsDrawing(false);
    // Auto-enable signature when user finishes drawing
    setIsSigned(true);
    if (!signatureHash) {
      setSignatureHash(`VERIFIED-SIGN-${Math.random().toString(16).slice(2, 10).toUpperCase()}`);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureHash(null);
    setIsSigned(false);
  };

  // Identify currently pending signatory in route
  const currentPendingStepIndex = currentFile.signatoryRoute
    ? currentFile.signatoryRoute.findIndex((s) => s.status === 'pending')
    : -1;
  const currentPendingStep = currentPendingStepIndex >= 0 && currentFile.signatoryRoute
    ? currentFile.signatoryRoute[currentPendingStepIndex]
    : null;
  const isFinalStep = currentFile.signatoryRoute && currentPendingStepIndex >= 0
    ? currentPendingStepIndex === currentFile.signatoryRoute.length - 1
    : currentFile.status !== 'approved';

  const activeSignatoryName = currentPendingStep
    ? currentPendingStep.officerName
    : (currentFile.finalApproverRole === 'chairman' ? 'Ahmed Akbar Sobhan' : (currentFile.notes[currentFile.notes.length - 1]?.author || 'Executive Authority'));
  const activeSignatoryRole = currentPendingStep
    ? currentPendingStep.roleName
    : (currentFile.finalApproverRole === 'chairman' ? 'Chairman & Managing Director' : 'Executive Approver');
  const activeSignatoryDept = currentPendingStep
    ? currentPendingStep.dept
    : (currentFile.dept || 'Corporate Management');

  const handleCreateNotesheet = (data: NewNotesheetData) => {
    const newFile: NoteFile = {
      id: `f-${Date.now()}`,
      fileNo: data.fileNo,
      title: data.title,
      dept: data.dept,
      amount: data.amount,
      urgency: data.urgency,
      status: 'pending_approval',
      date: '29 Oct 2026',
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
          date: '29 Oct 2026, 09:30 AM',
          body: data.initialNote,
          status: 'approved',
          hash: `VERIFIED-SIGN-INIT-${Math.random().toString(16).slice(2, 8).toUpperCase()}`,
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

    // Mirror to Omni-Approval Queue
    approvalStore.addNotesheetApproval(data.fileNo, data.title, data.initiatorName, data.dept, data.amount);
    showToast(
      t(
        `✓ Note-Sheet ${data.fileNo} created! Sent to ${data.signatoryRoute[0]?.officerName || 'Reviewer'}.`,
        `✓ নতুন নোট-শীট ${data.fileNo} তৈরি ও প্রথম অনুমোদনকারীর নিকট প্রেরিত।`,
        lang
      ),
      'gold'
    );
  };

  const handleQuickSignActiveOfficer = () => {
    const generatedHash = `VERIFIED-SIGN-${Math.random().toString(16).slice(2, 10).toUpperCase()}`;
    setSignatureHash(generatedHash);
    setIsSigned(true);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#1E293B';
        ctx.font = 'italic 700 20px "Outfit", Georgia, serif';
        ctx.fillText(activeSignatoryName, 25, 65);
        ctx.beginPath();
        ctx.moveTo(20, 75);
        ctx.bezierCurveTo(70, 95, 180, 55, 270, 70);
        ctx.stroke();
      }
    }
    showToast(
      t(
        `Digital signature stamp applied for ${activeSignatoryName}.`,
        `${activeSignatoryName}-এর ডিজিটাল স্বাক্ষর প্রয়োগ করা হয়েছে।`,
        lang
      ),
      'gold'
    );
  };

  const handleSignAndAdvance = () => {
    if (!isSigned) {
      showToast(
        t('Please sign or click quick stamp first.', 'অনুগ্রহ করে প্রথমে ডিজিটাল স্বাক্ষর করুন।', lang),
        'info'
      );
      return;
    }

    const defaultRemark = isFinalStep
      ? (currentPendingStep?.roleId === 'chairman'
          ? 'Approved as recommended. Expedite procurement before scheduled plant operations. All standards verified compliant.'
          : `Approved under delegated authority as ${activeSignatoryRole}. Financial and technical scope verified compliant. Work execution authorized.`)
      : `Reviewed and found compliant. Recommended for approval to ${currentFile.signatoryRoute && currentFile.signatoryRoute[currentPendingStepIndex + 1] ? currentFile.signatoryRoute[currentPendingStepIndex + 1].officerName : 'the Next Approving Authority'}.`;

    const comment = newNoteText.trim() || defaultRemark;

    if (isFinalStep) {
      approveFile({
        fileIdOrNo: currentFile.id,
        actorName: activeSignatoryName,
        actorRoleTitle: activeSignatoryRole,
        actorDept: activeSignatoryDept,
        actorRole: role,
        remark: comment,
      });

      // Cross-platform sync with approval store
      approvalStore.syncSourceDecision(currentFile.id, 'approved', comment);

      showToast(
        t(
          `✓ File ${currentFile.fileNo} received FINAL APPROVAL from ${activeSignatoryName}! Process Complete.`,
          `✓ নথি ${currentFile.fileNo} ${activeSignatoryName} কর্তৃক চূড়ান্ত অনুমোদিত হয়েছে!`,
          lang
        ),
        'success'
      );
      setShowCertModal(true);
    } else {
      // Intermediate step
      appendNote(currentFile.id, {
        author: activeSignatoryName,
        role: activeSignatoryRole,
        dept: activeSignatoryDept,
        body: comment,
        date: '29 Oct 2026, Just Now',
        status: 'approved',
        isChairman: currentPendingStep?.roleId === 'chairman',
        hash: signatureHash || `VERIFIED-SIGN-${Math.random().toString(16).slice(2, 8).toUpperCase()}`,
      });

      const nextOfficer = currentFile.signatoryRoute ? currentFile.signatoryRoute[currentPendingStepIndex + 1] : null;
      showToast(
        t(
          `✓ Endorsed by ${activeSignatoryName} and forwarded to ${nextOfficer ? nextOfficer.officerName : 'next authority'}.`,
          `✓ ${activeSignatoryName} কর্তৃক স্বাক্ষরিত ও পরবর্তী কর্মকর্তার নিকট প্রেরিত।`,
          lang
        ),
        'info'
      );
    }

    setNewNoteText('');
    setIsSigned(false);
    clearCanvas();
  };

  const officialDocData: DocumentData = {
    type: 'notesheet',
    docNumber: currentFile.fileNo,
    title: currentFile.title,
    date: currentFile.date,
    department: currentFile.dept,
    authorizedBy: currentFile.finalApproverRole
      ? (AVAILABLE_OFFICERS.find((o) => o.roleId === currentFile.finalApproverRole)?.officerName || 'Ahmed Akbar Sobhan')
      : 'Ahmed Akbar Sobhan',
    authorizerRole: currentFile.finalApproverRole
      ? (AVAILABLE_OFFICERS.find((o) => o.roleId === currentFile.finalApproverRole)?.roleName || 'Chairman & Managing Director')
      : 'Chairman & Managing Director, Bashundhara Oil & Gas Company',
    amountOrValue: currentFile.amount,
    sapReference: currentFile.sapRef,
    paragraphs: currentFile.notes.map((n) => ({
      label: `Para ${n.para} (${n.dept})`,
      text: n.body,
      signedBy: `${n.author} — ${n.role}`,
      hash: n.hash,
    })),
  };

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
                background: activeTab === 'sheet' ? '#fff' : 'transparent',
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
                background: activeTab === 'compare' ? '#fff' : 'transparent',
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
                background: activeTab === 'audit' ? '#fff' : 'transparent',
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
          <button
            className="btn-primary"
            onClick={() => setShowInitiateModal(true)}
            style={{
              fontSize: '11.5px',
              padding: '5px 12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'linear-gradient(135deg, #A51C30 0%, #700B1A 100%)',
              fontWeight: 700,
            }}
          >
            <Plus size={13} /> {t('+ New Note-Sheet', '+ নতুন নোট-শীট', lang)}
          </button>
          <button
            className="btn-outline"
            onClick={() => setShowOfficialDoc(true)}
            style={{ fontSize: '11.5px', padding: '5px 10px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
          >
            <Printer size={13} /> {t('Print Document', 'প্রিন্ট', lang)}
          </button>
          <button
            className="btn-outline"
            onClick={() => setShowCertModal(true)}
            style={{ fontSize: '11.5px', padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
          >
            <QrCode size={13} /> {t('Approval Certificate', 'অনুমোদন সনদ', lang)}
          </button>
        </div>
      </div>

      {/* Dossier Selector Bar */}
      <div className="card mb-4" style={{ padding: '10px 16px', background: 'var(--brand-card-bg)', border: '1px solid var(--brand-border)', borderRadius: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', maxWidth: '100%' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-slate-400)', textTransform: 'uppercase', letterSpacing: '0.5px', marginRight: '4px' }}>
              Files:
            </span>
            <button
              onClick={() => setShowInitiateModal(true)}
              style={{
                border: '1px dashed var(--brand-crimson)',
                background: 'rgba(165, 28, 48, 0.05)',
                color: 'var(--brand-crimson)',
                padding: '4px 10px',
                borderRadius: '16px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                whiteSpace: 'nowrap',
              }}
            >
              <Plus size={12} /> {t('New Note', 'নতুন নোট', lang)}
            </button>
            {files.map((file) => {
              const isSelected = activeFileId === file.id;
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
                    color: isSelected ? '#fff' : 'var(--brand-slate-700)',
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
                    <span style={{ fontSize: '10px', color: isSelected ? '#fff' : '#059669' }}>✓</span>
                  ) : (
                    <span style={{ fontSize: '10px', color: isSelected ? '#fff' : '#D97706' }}>⏳</span>
                  )}
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className={`badge ${currentFile.urgency === 'urgent' ? 'danger' : currentFile.urgency === 'high' ? 'warn' : 'info'}`}>
              {currentFile.urgency.toUpperCase()}
            </span>
            <span className={`badge ${currentFile.status === 'approved' ? 'success' : currentFile.status === 'in_review' ? 'warn' : 'gold'}`}>
              {currentFile.status === 'approved' ? 'APPROVED' : currentFile.status === 'in_review' ? 'QUERY / IN REVIEW' : 'PENDING APPROVAL'}
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
                          background: step.status === 'signed' ? '#ECFDF5' : step.status === 'pending' ? '#FFFBEB' : '#F1F5F9',
                          border: step.status === 'signed' ? '1px solid #10B981' : step.status === 'pending' ? '1px solid #F59E0B' : '1px solid #E2E8F0',
                          fontSize: '11px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <span style={{ fontWeight: 800, color: step.status === 'signed' ? '#059669' : step.status === 'pending' ? '#D97706' : '#94A3B8' }}>
                          {idx + 1}. {step.officerName}
                        </span>
                        <span style={{ fontSize: '10px', color: step.status === 'signed' ? '#059669' : '#64748B' }}>
                          ({step.roleName.split(' ')[0]})
                        </span>
                        {step.status === 'signed' ? (
                          <span style={{ color: '#059669', fontWeight: 800 }}>✓</span>
                        ) : step.status === 'pending' ? (
                          <span style={{ color: '#D97706', fontWeight: 800 }}>⏳</span>
                        ) : (
                          <span style={{ color: '#94A3B8' }}>•</span>
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
                      border: n.isChairman ? '1px solid #D4AF37' : '1px solid var(--brand-slate-200)',
                      background: n.isChairman ? 'rgba(212, 175, 55, 0.04)' : 'var(--brand-card-bg)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '11.5px', fontWeight: 800, color: n.isChairman ? '#B45309' : 'var(--brand-slate-700)' }}>
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
                        <span style={{ color: '#059669', fontWeight: 600 }}>✓ Verified Stamp</span>
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
                    <strong style={{ color: '#059669' }}>{currentFile.budgetInfo.availableBalance}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Signature Pad & Decision Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="card" style={{ border: '1px solid var(--brand-slate-200)', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <div className="card-hd-icon" style={{ width: '28px', height: '28px' }}><Stamp size={15} /></div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--brand-slate-900)' }}>
                    {t('Sign & Endorse Document', 'স্বাক্ষর ও অনুমোদন নিয়ন্ত্রণ', lang)}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)' }}>
                    {t('Add remarks and apply your digital signature', 'মন্তব্য যোগ করুন ও স্বাক্ষর সম্পন্ন করুন', lang)}
                  </div>
                </div>
              </div>

              {/* Current Signer Capsule */}
              <div style={{
                padding: '9px 12px',
                background: isFinalStep ? 'rgba(212, 175, 55, 0.1)' : 'rgba(165, 28, 48, 0.05)',
                border: isFinalStep ? '1px solid #D4AF37' : '1px solid rgba(165, 28, 48, 0.2)',
                borderRadius: '6px',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontSize: '9.5px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--brand-slate-500)', fontWeight: 700 }}>
                    {isFinalStep ? t('Final Sanction Authority', 'চূড়ান্ত অনুমোদনকারী', lang) : t('Current Reviewing Officer', 'বর্তমান অনুমোদনকারী', lang)}
                  </div>
                  <div style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--brand-slate-900)' }}>
                    {activeSignatoryName}
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-500)' }}>
                    {activeSignatoryRole}
                  </div>
                </div>
                {isFinalStep && (
                  <span style={{ fontSize: '9px', background: '#FEF3C7', color: '#92400E', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>
                    FINAL APPROVAL
                  </span>
                )}
              </div>

              {/* 1-Click Quick Stamp */}
              <button
                type="button"
                onClick={handleQuickSignActiveOfficer}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px dashed #D4AF37',
                  background: 'rgba(212, 175, 55, 0.08)',
                  color: '#B45309',
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
                {currentPendingStep?.roleId === 'chairman' ? <Crown size={14} color="#D4AF37" /> : <Stamp size={14} color="#B45309" />}
                <span>
                  {t(
                    `⚡ 1-Click Digital Stamp: ${activeSignatoryName}`,
                    `⚡ ডিজিটাল স্বাক্ষর প্রয়োগ: ${activeSignatoryName}`,
                    lang
                  )}
                </span>
              </button>

              {/* Canvas Pad */}
              <div style={{ border: '1px solid var(--brand-slate-200)', borderRadius: '6px', background: '#FAFAFC', position: 'relative', height: '100px', marginBottom: '10px' }}>
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
                    <PenTool size={13} style={{ marginRight: '5px' }} /> Or draw signature with stylus / mouse
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <button
                  type="button"
                  onClick={clearCanvas}
                  style={{ border: 'none', background: 'transparent', color: 'var(--brand-slate-500)', fontSize: '11px', cursor: 'pointer', padding: 0 }}
                >
                  Clear Signature
                </button>
                {isSigned && (
                  <span style={{ fontSize: '10.5px', color: '#059669', fontWeight: 700 }}>
                    ✓ Signature Ready
                  </span>
                )}
              </div>

              {/* Remarks Textarea */}
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px' }}>{t('Official Remarks / Approval Note', 'দাপ্তরিক মন্তব্য / অনুমোদন নোট', lang)}</label>
                <textarea
                  rows={3}
                  placeholder={
                    isFinalStep
                      ? 'Approved as recommended. Release purchase order and proceed with works.'
                      : 'Reviewed and found technically compliant. Forwarded for final sanction.'
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
                  <span>{isFinalStep ? t('Final Sanction & Approve', 'চূড়ান্ত অনুমোদন প্রদান', lang) : t('Sign & Forward', 'স্বাক্ষর ও ফরোয়ার্ড', lang)}</span>
                </button>

                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setShowReturnModal(true)}
                  style={{
                    flex: 1,
                    fontSize: '12px',
                    padding: '9px 10px',
                    color: '#DC2626',
                    borderColor: '#DC2626',
                    background: 'rgba(220, 38, 38, 0.04)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                  }}
                >
                  <RotateCcw size={13} />
                  <span>{t('Return / Query', 'আপত্তি / ফেরত', lang)}</span>
                </button>
              </div>
            </div>
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
                    border: quote.isRecommended ? '2px solid #059669' : '1px solid var(--brand-slate-200)',
                    borderRadius: '8px',
                    padding: '16px',
                    background: quote.isRecommended ? '#F0FDF4' : 'var(--brand-card-bg)',
                    position: 'relative',
                  }}
                >
                  {quote.isRecommended && (
                    <div style={{ position: 'absolute', top: '-10px', right: '14px', background: '#059669', color: '#fff', fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '10px' }}>
                      RECOMMENDED & LOWEST BID
                    </div>
                  )}
                  <div style={{ fontSize: '14px', fontWeight: 800, color: quote.isRecommended ? '#065F46' : 'var(--brand-slate-900)' }}>
                    {quote.vendor}
                  </div>
                  <div style={{ fontSize: '11px', color: quote.isRecommended ? '#047857' : 'var(--brand-slate-500)' }}>
                    Origin: {quote.origin}
                  </div>

                  <div style={{ margin: '12px 0', borderTop: '1px solid var(--brand-slate-200)', borderBottom: '1px solid var(--brand-slate-200)', padding: '8px 0' }}>
                    <div style={{ fontSize: '20px', fontWeight: 900, color: quote.isRecommended ? '#065F46' : 'var(--brand-slate-800)' }}>
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
                Document Reference: {currentFile.fileNo} · Recorded & Verified
              </p>
            </div>
            <span className="badge success">Sequential Approvals Verified</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {currentFile.notes.map((n, idx) => (
              <div key={n.id} style={{ display: 'flex', gap: '12px', padding: '12px 14px', background: 'var(--brand-slate-50)', borderRadius: '8px', border: '1px solid var(--brand-slate-200)' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: n.isChairman ? '#D4AF37' : '#059669', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '11px', flexShrink: 0 }}>
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
                      <span style={{ background: '#fff', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--brand-slate-200)', fontFamily: 'monospace' }}>
                        {n.hash}
                      </span>
                      <span style={{ color: '#059669', fontWeight: 700 }}>✓ Verified Digital Signature</span>
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
                <div className="app-modal-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#059669' }}>
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
              <div style={{ border: '2px solid #D4AF37', borderRadius: '12px', padding: '20px', background: 'rgba(212, 175, 55, 0.04)' }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#B45309', fontWeight: 800 }}>
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
                  <div style={{ color: '#059669', fontWeight: 700 }}>✓ Verified by all designated authorities</div>
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
