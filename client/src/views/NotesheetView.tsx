import React, { useState, useRef, useEffect } from 'react';
import { AppRole, ViewProps, t } from '../types';
import { showToast } from '../App';
import {
  FileSignature, CheckCircle, Clock, AlertTriangle, ShieldCheck,
  Send, PenTool, Hash, Download, ArrowRight, UserCheck, Stamp,
  FileText, QrCode, Lock, CheckCheck, Eye, Layers, RefreshCw, X, Printer, RotateCcw, Crown, Plus, Sparkles
} from 'lucide-react';
import OfficialDocumentModal, { DocumentData } from '../components/OfficialDocumentModal';
import InitiateNotesheetModal, {
  SignatoryStep,
  NewNotesheetData,
  AVAILABLE_OFFICERS,
} from '../components/notesheet/InitiateNotesheetModal';

interface NoteItem {
  id: number;
  para: number;
  author: string;
  role: string;
  dept: string;
  date: string;
  body: string;
  status: 'approved' | 'forwarded' | 'pending';
  hash?: string;
  isChairman?: boolean;
}

interface NoteFile {
  id: string;
  fileNo: string;
  title: string;
  dept: string;
  amount: string;
  urgency: 'urgent' | 'high' | 'normal';
  status: 'pending_chairman' | 'approved' | 'in_review' | 'pending_approval';
  date: string;
  sapRef: string;
  initiatorName?: string;
  initiatorRole?: string;
  initiatorDept?: string;
  finalApproverRole?: AppRole;
  signatoryRoute?: SignatoryStep[];
  notes: NoteItem[];
}

const FILES_DATABASE: NoteFile[] = [
  {
    id: 'f1',
    fileNo: 'BOGCL/PROC/KER-2026/0894',
    title: 'Emergency Procurement for Keraniganj Bitumen Reactor Safety Relief Valves & Chemical Batch',
    dept: 'Plant Maintenance & Reliability',
    amount: '৳48,50,000',
    urgency: 'urgent',
    status: 'pending_chairman',
    date: '14 Oct 2026',
    sapRef: 'SAP-PR-2026-90412',
    initiatorName: 'Engr. Tariq Ahmed',
    initiatorRole: 'Senior Plant Maintenance Engineer',
    initiatorDept: 'Keraniganj Bitumen Plant',
    finalApproverRole: 'chairman',
    signatoryRoute: [
      {
        ...AVAILABLE_OFFICERS[0], // Plant GM
        id: 's1',
        status: 'signed',
        signedAt: '14 Oct 2026, 02:45 PM',
        hash: 'SHA256: d5a7a93a8905b6324d2b380645495c64393962d85d77aa5d7c862bc2b557b707',
      },
      {
        ...AVAILABLE_OFFICERS[1], // CFO Farida Begum
        id: 's2',
        status: 'signed',
        signedAt: '15 Oct 2026, 11:15 AM',
        hash: 'SHA256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      },
      {
        ...AVAILABLE_OFFICERS[4], // Chairman Ahmed Akbar Sobhan
        id: 's3',
        status: 'pending',
      },
    ],
    notes: [
      {
        id: 1,
        para: 1,
        author: 'Engr. Tariq Ahmed',
        role: 'Senior Plant Maintenance Engineer',
        dept: 'Keraniganj Bitumen Plant',
        date: '14 Oct 2026, 09:30 AM',
        body: 'Submitted for kind perusal and administrative approval. As per scheduled maintenance protocol for Bitumen Unit-2 reactor lines, 4 units of High-Pressure Safety Relief Valves (Class 600, ASTM A216) and 2,500 kg of cationic rapid-setting emulsifier agent require immediate procurement to prevent shutdown during the forthcoming peak asphalt season.',
        status: 'approved',
        hash: 'SHA256: 7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
      },
      {
        id: 2,
        para: 2,
        author: 'Engr. Md. Harunur Rashid',
        role: 'Plant General Manager',
        dept: 'Keraniganj Refinery Complex',
        date: '14 Oct 2026, 02:45 PM',
        body: 'Forwarded with strong recommendation. The existing relief valves were inspected during the DoE & Explosives joint audit on 10 Oct 2026 and flagged for mandatory replacement before 30 Nov 2026. Three competitive quotations from authorized European OEM vendors have been obtained by plant procurement. Lowest vetted quote is ৳48,50,000 (inclusive of import duty and BSTI testing fee).',
        status: 'approved',
        hash: 'SHA256: d5a7a93a8905b6324d2b380645495c64393962d85d77aa5d7c862bc2b557b707',
      },
      {
        id: 3,
        para: 3,
        author: 'Farida Begum',
        role: 'CFO & Head of Finance',
        dept: 'Corporate Finance & Accounts',
        date: '15 Oct 2026, 11:15 AM',
        body: 'Vetted from budgetary standpoint. Provision exists under CAPEX Head: Plant Safety & Reliability (GL Code 4102-KER). Financial viability and tax deductions (5% AIT + 7.5% VAT) have been adjusted. Subject to formal approval of Honourable Chairman & Managing Director, L/C can be established through Bashundhara Corporate Bank branch within 48 hours.',
        status: 'approved',
        hash: 'SHA256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      },
    ],
  },
  {
    id: 'f2',
    fileNo: 'BOGCL/FIN/2026/0211',
    title: 'Q4 Natural Gas Industrial Steam Co-Generation Tariff Adjustment',
    dept: 'Corporate Finance & Energy Economics',
    amount: '৳1,20,00,000',
    urgency: 'high',
    status: 'approved',
    date: '12 Oct 2026',
    sapRef: 'SAP-FI-BUD-0211',
    initiatorName: 'Farida Begum',
    initiatorRole: 'CFO & Head of Finance',
    initiatorDept: 'Corporate Finance & Accounts',
    finalApproverRole: 'hod',
    signatoryRoute: [
      {
        ...AVAILABLE_OFFICERS[1], // CFO Farida Begum
        id: 's1',
        status: 'signed',
        signedAt: '12 Oct 2026, 10:00 AM',
        hash: 'SHA256: 41b2c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b112',
      },
    ],
    notes: [
      {
        id: 1,
        para: 1,
        author: 'Farida Begum',
        role: 'CFO & Head of Finance',
        dept: 'Finance Directorate',
        date: '12 Oct 2026, 10:00 AM',
        body: 'In accordance with Bangladesh Energy Regulatory Commission (BERC) gazette #402/2026, natural gas tariff for captive co-generation plants has been adjusted. Financial impact for Q4 is estimated at ৳1.20 Cr.',
        status: 'approved',
        hash: 'SHA256: 41b2c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b112',
      },
    ],
  },
  {
    id: 'f3',
    fileNo: 'BOGCL/HR/2026/0342',
    title: 'Grade 7-10 Refinery Technical Staff Annual Shift Increment Policy',
    dept: 'Human Resources Directorate',
    amount: 'Statutory Policy',
    urgency: 'normal',
    status: 'approved',
    date: '10 Oct 2026',
    sapRef: 'SAP-HR-POL-0342',
    initiatorName: 'Nusrat Jahan',
    initiatorRole: 'GM, Human Resources',
    initiatorDept: 'HR Suite, Dhaka HQ',
    finalApproverRole: 'hr_admin',
    signatoryRoute: [
      {
        ...AVAILABLE_OFFICERS[2], // GM HR Afroza Sultana
        id: 's1',
        status: 'signed',
        signedAt: '10 Oct 2026, 03:20 PM',
        hash: 'SHA256: a1e0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b774',
      },
    ],
    notes: [
      {
        id: 1,
        para: 1,
        author: 'Nusrat Jahan',
        role: 'GM, Human Resources',
        dept: 'HR Suite, Dhaka HQ',
        date: '10 Oct 2026, 03:20 PM',
        body: 'Submitted for approval. Annual statutory increment framework covering 482 shift technicians, boiler operators, and safety marshals. Budget impact factored into 2026-2027 OPEX.',
        status: 'approved',
        hash: 'SHA256: a1e0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b774',
      },
    ],
  },
];

export default function NotesheetView({ role, lang }: ViewProps) {
  const [activeFileId, setActiveFileId] = useState('f1');
  const [files, setFiles] = useState<NoteFile[]>(FILES_DATABASE);
  const [newNoteText, setNewNoteText] = useState('');
  const [forwardTo, setForwardTo] = useState('Chairman & MD');
  const [isSigned, setIsSigned] = useState(false);
  const [activeTab, setActiveTab] = useState<'sheet' | 'audit' | 'compare'>('sheet');
  const [showCertModal, setShowCertModal] = useState(false);
  const [showOfficialDoc, setShowOfficialDoc] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureHash, setSignatureHash] = useState<string | null>(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState('Budget Justification Incomplete');
  const [returnObservation, setReturnObservation] = useState('');

  const currentFile = files.find((f) => f.id === activeFileId) || files[0];

  const handleRejectOrReturn = () => {
    const reasonText = returnObservation.trim() || returnReason;
    const returnNote: NoteItem = {
      id: currentFile.notes.length + 1,
      para: currentFile.notes.length + 1,
      author: role === 'chairman' ? 'Ahmed Akbar Sobhan' : 'Reviewing Authority',
      role: role === 'chairman' ? 'Chairman & Managing Director' : 'Executive Approver',
      dept: "Chairman's Secretariat, Bashundhara Group",
      date: 'Today, Just Now',
      body: `[RETURNED FOR REVISION / কোয়ারি ও ফেরত]: ${returnReason} — ${reasonText}. File sent back to initiating department for clarification before further consideration.`,
      status: 'pending',
      hash: 'REVISION-AUDIT-STAMP: ' + Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      isChairman: role === 'chairman',
    };

    setFiles((prev) =>
      prev.map((f) => {
        if (f.id === currentFile.id) {
          return {
            ...f,
            status: 'in_review',
            notes: [...f.notes, returnNote],
          };
        }
        return f;
      })
    );

    setShowReturnModal(false);
    setReturnObservation('');
    showToast(
      t(
        `File ${currentFile.fileNo} returned with official query note: "${returnReason}". Initiator notified.`,
        `নথিটি কোয়ারি নোটসহ আবেদনকারী বিভাগে ফেরত পাঠানো হয়েছে।`,
        lang
      ),
      'info'
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

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
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

  const handleApplySignature = () => {
    const generatedHash =
      'SHA256: ' +
      Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    setSignatureHash(generatedHash);
    setIsSigned(true);
    showToast(
      t(
        'Digital signature cryptographically stamped with SHA-256 seal.',
        'ডিজিটাল স্বাক্ষর সফলভাবে সংযুক্ত করা হয়েছে।',
        lang
      ),
      'gold'
    );
  };

  const [showInitiateModal, setShowInitiateModal] = useState(false);

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
    : (currentFile.dept || "Corporate Secretariat");

  const handleCreateNotesheet = (data: NewNotesheetData) => {
    const newFile: NoteFile = {
      id: `f-${Date.now()}`,
      fileNo: data.fileNo,
      title: data.title,
      dept: data.dept,
      amount: data.amount,
      urgency: data.urgency,
      status: 'pending_approval',
      date: 'Today, Just Now',
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
          date: 'Today, Just Now',
          body: data.initialNote,
          status: 'approved',
          hash: 'SHA256: ' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
        },
      ],
    };

    setFiles((prev) => [newFile, ...prev]);
    setActiveFileId(newFile.id);
    setActiveTab('sheet');
    clearCanvas();
    showToast(
      t(
        `✓ Note-Sheet ${data.fileNo} created! Routed to ${data.signatoryRoute[0].officerName}.`,
        `✓ নতুন নোট-শীট ${data.fileNo} তৈরি ও প্রথম অনুমোদনকারীর নিকট প্রেরিত।`,
        lang
      ),
      'gold'
    );
  };

  const handleQuickSignActiveOfficer = () => {
    const generatedHash =
      'SHA256: ' +
      Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    setSignatureHash(generatedHash);
    setIsSigned(true);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#1E293B';
        ctx.font = 'italic 700 22px "Outfit", "Times New Roman", serif';
        ctx.fillText(activeSignatoryName, 25, 75);
        ctx.beginPath();
        ctx.moveTo(20, 88);
        ctx.bezierCurveTo(70, 105, 180, 65, 270, 80);
        ctx.stroke();
      }
    }
    showToast(
      t(
        `Cryptographic digital signature token applied for ${activeSignatoryName}.`,
        `${activeSignatoryName}-এর ডিজিটাল স্বাক্ষর টোকেন প্রয়োগ করা হয়েছে।`,
        lang
      ),
      'gold'
    );
  };

  const handleSignAndAdvance = () => {
    if (!isSigned) {
      showToast(
        t('Please sign or stamp your digital signature first.', 'অনুগ্রহ করে প্রথমে ডিজিটাল স্বাক্ষর করুন।', lang),
        'info'
      );
      return;
    }

    const defaultRemark = isFinalStep
      ? (currentPendingStep?.roleId === 'chairman'
          ? 'Approved as recommended in preceding paragraphs. Expedite procurement before peak asphalt refining run. Zero plant downtime authorized.'
          : `Approved under delegated authority as ${activeSignatoryRole}. Financial and technical scope verified compliant. Work execution authorized.`)
      : `Reviewed and vetted from technical and administrative standpoint. Recommended for final authorization by ${currentFile.signatoryRoute && currentFile.signatoryRoute[currentPendingStepIndex + 1] ? currentFile.signatoryRoute[currentPendingStepIndex + 1].officerName : 'Next Authority'}.`;

    const newNotePara: NoteItem = {
      id: currentFile.notes.length + 1,
      para: currentFile.notes.length + 1,
      author: activeSignatoryName,
      role: activeSignatoryRole,
      dept: activeSignatoryDept,
      date: 'Today, Just Now (Real-Time Sign-Off)',
      body: newNoteText.trim() || defaultRemark,
      status: 'approved',
      hash: signatureHash || ('SHA256: ' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')),
      isChairman: currentPendingStep?.roleId === 'chairman',
    };

    setFiles((prev) =>
      prev.map((f) => {
        if (f.id === currentFile.id) {
          const updatedRoute = f.signatoryRoute ? f.signatoryRoute.map((s, idx) => {
            if (idx === currentPendingStepIndex) {
              return { ...s, status: 'signed' as const, signedAt: 'Today, Just Now', hash: signatureHash || undefined };
            }
            if (idx === currentPendingStepIndex + 1) {
              return { ...s, status: 'pending' as const };
            }
            return s;
          }) : undefined;

          return {
            ...f,
            status: isFinalStep ? ('approved' as const) : ('in_review' as const),
            signatoryRoute: updatedRoute,
            notes: [...f.notes, newNotePara],
          };
        }
        return f;
      })
    );

    setNewNoteText('');
    setIsSigned(false);
    clearCanvas();

    if (isFinalStep) {
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
      : 'Chairman & Managing Director, Bashundhara Group',
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
      {/* ─── SLEEK MINIMAL HEADER & TOOLBAR ─── */}
      <div className="section-header" style={{ marginBottom: '14px', alignItems: 'center' }}>
        <div>
          <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '18px' }}>
            <span>✍️</span>
            <span>{t('E-Note Sheet & Sign-Off Platform', 'ই-নোটশীট ও ডিজিটাল স্বাক্ষর প্ল্যাটফর্ম', lang)}</span>
          </h2>
          <p className="section-subtitle" style={{ margin: '3px 0 0', fontSize: '11.5px', color: 'var(--brand-slate-500)' }}>
            {t(
              'DocuSign-grade sequential authorization & cryptographic ledger.',
              'ধারাবাহিক অনুমোদন ব্যবস্থা ও ক্রিপ্টোগ্রাফিক ডিজিটাল খতিয়ান।',
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
                transition: 'all 0.15s ease'
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
                transition: 'all 0.15s ease'
              }}
            >
              <Layers size={13} /> {t('Quotations (3)', 'দরপত্র (৩টি)', lang)}
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
                transition: 'all 0.15s ease'
              }}
            >
              <Lock size={13} /> {t('Audit Ledger', 'খতিয়ান', lang)}
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
              boxShadow: '0 2px 6px rgba(165,28,48,0.2)'
            }}
          >
            <Plus size={13} /> {t('+ Start Note-Sheet', '+ নতুন নোট-শীট', lang)}
          </button>
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
            style={{ fontSize: '11.5px', padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
          >
            <QrCode size={13} /> {t('Certificate', 'সনদ', lang)}
          </button>
        </div>
      </div>

      {/* ─── SLEEK MINIMAL DOSSIER BAR & DYNAMIC STEPPER ─── */}
      <div className="card mb-4" style={{ padding: '10px 16px', background: 'var(--brand-card-bg)', border: '1px solid var(--brand-border)', borderRadius: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          
          {/* Clean Dossier Pill Selector with '+ New' Trigger */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', maxWidth: '100%' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-slate-400)', textTransform: 'uppercase', letterSpacing: '0.5px', marginRight: '4px' }}>
              Dossier:
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
                transition: 'all 0.15s ease'
              }}
              title={t('Initiate a new note-sheet document', 'নতুন নোট-শীট প্রস্তুত করুন', lang)}
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
                    background: isSelected ? 'rgba(165, 28, 48, 0.08)' : 'transparent',
                    color: isSelected ? 'var(--brand-crimson)' : 'var(--brand-slate-700)',
                    padding: '4px 10px',
                    borderRadius: '16px',
                    fontSize: '11.5px',
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: file.status === 'approved' ? '#10B981' : '#F59E0B'
                  }} />
                  <span style={{ fontFamily: 'monospace' }}>{file.fileNo.split('/')[2] || file.fileNo}</span>
                  <span style={{ opacity: 0.75, fontSize: '10.5px' }}>({file.amount})</span>
                  {file.urgency === 'urgent' && isSelected && (
                    <span style={{ fontSize: '9px', background: '#FEE2E2', color: '#DC2626', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>
                      URGENT
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Dynamic Signatory Authorization Route Pipeline */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', flexWrap: 'wrap' }}>
            {currentFile.initiatorName && (
              <span style={{ fontSize: '10.5px', color: 'var(--brand-slate-500)', marginRight: '2px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#64748B' }}></span>
                <span style={{ fontWeight: 600 }}>{currentFile.initiatorName.split(' ')[0]}</span> (Initiator) ➔
              </span>
            )}
            {currentFile.signatoryRoute && currentFile.signatoryRoute.length > 0 ? (
              currentFile.signatoryRoute.map((step, idx) => {
                const isSigned = step.status === 'signed';
                const isPending = step.status === 'pending';
                const isFinal = idx === (currentFile.signatoryRoute?.length || 0) - 1;
                const isChairman = step.roleId === 'chairman';

                return (
                  <React.Fragment key={step.id}>
                    {idx > 0 && <span style={{ color: 'var(--brand-slate-300)', fontSize: '10px' }}>➔</span>}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        background: isSigned
                          ? 'rgba(16, 185, 129, 0.1)'
                          : isPending
                          ? isChairman ? 'rgba(212, 175, 55, 0.18)' : 'rgba(165, 28, 48, 0.1)'
                          : 'rgba(148, 163, 184, 0.1)',
                        color: isSigned
                          ? '#059669'
                          : isPending
                          ? isChairman ? '#B45309' : 'var(--brand-crimson)'
                          : 'var(--brand-slate-400)',
                        fontWeight: isPending ? 700 : 600,
                        border: isPending ? (isChairman ? '1px solid #D4AF37' : '1px solid var(--brand-crimson)') : '1px solid transparent',
                        fontSize: '11px'
                      }}
                      title={`${step.officerName} (${step.roleName}) - Status: ${step.status}`}
                    >
                      {isSigned ? (
                        <CheckCircle size={12} color="#059669" />
                      ) : isPending ? (
                        <span>{isChairman ? '👑' : '✍️'}</span>
                      ) : (
                        <Clock size={11} />
                      )}
                      <span>
                        {step.officerName.split(' ')[0]} {isFinal ? '★' : ''}
                      </span>
                    </div>
                  </React.Fragment>
                );
              })
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#059669', fontWeight: 600 }}>
                <CheckCircle size={12} />
                <span>Authorized</span>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ─── TAB 1: OFFICIAL NOTE-SHEET DOCUMENT ─── */}
      {activeTab === 'sheet' && (
        <div className="responsive-col-2">
          {/* Official Document View */}
          <div className="card" style={{ border: '1px solid var(--brand-slate-200)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div className="card-body" style={{ padding: '24px' }}>
              {/* Official Letterhead Directly on Document Paper */}
              <div style={{ borderBottom: '2px solid var(--brand-crimson)', paddingBottom: '14px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--brand-crimson)', margin: 0, letterSpacing: '0.4px' }}>
                    BASHUNDHARA OIL & GAS COMPANY LTD.
                  </h3>
                  <div style={{ fontSize: '11px', color: 'var(--brand-slate-600)', marginTop: '2px' }}>
                    Corporate Secretariat • Keraniganj Petroleum Refinery Division
                  </div>
                  <div style={{ fontSize: '9.5px', color: 'var(--brand-slate-400)', marginTop: '2px' }}>
                    ISO 9001:2015 & OHSAS 18001 Certified Refined Bitumen & Base Oil Facilities
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '12px', color: 'var(--brand-slate-900)' }}>{currentFile.fileNo}</div>
                  <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)', marginTop: '2px' }}>Date: {currentFile.date}</div>
                  <div style={{ display: 'inline-block', fontSize: '11px', fontWeight: 700, color: 'var(--brand-crimson)', marginTop: '3px', background: 'rgba(165,28,48,0.06)', padding: '2px 8px', borderRadius: '4px' }}>
                    Value: {currentFile.amount}
                  </div>
                </div>
              </div>

              {/* Subject */}
              <div style={{ background: 'var(--brand-slate-50)', padding: '12px 14px', borderRadius: '6px', borderLeft: '3px solid var(--brand-crimson)', marginBottom: '18px', fontWeight: 600, fontSize: '12.5px', color: 'var(--brand-slate-900)', lineHeight: 1.5 }}>
                <span style={{ color: 'var(--brand-slate-500)', fontWeight: 700 }}>{t('Subject: ', 'বিষয়: ', lang)}</span> {currentFile.title}
              </div>

              {/* Notes Paragraphs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {currentFile.notes.map((n) => (
                  <div
                    key={n.id}
                    style={{
                      padding: '14px',
                      borderRadius: '8px',
                      border: n.isChairman ? '1px solid #D4AF37' : '1px solid var(--brand-slate-200)',
                      background: n.isChairman ? 'rgba(212, 175, 55, 0.04)' : 'var(--brand-card-bg)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11.5px', fontWeight: 800, color: n.isChairman ? '#B45309' : 'var(--brand-slate-700)' }}>
                          Para-{n.para}.
                        </span>
                        <strong style={{ fontSize: '12.5px', color: 'var(--brand-slate-900)' }}>{n.author}</strong>
                        <span style={{ fontSize: '11px', color: 'var(--brand-slate-500)' }}>({n.role})</span>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--brand-slate-400)' }}>{n.date}</span>
                    </div>

                    <p style={{ fontSize: '12.5px', lineHeight: '1.65', margin: '0 0 10px 0', color: 'var(--brand-slate-800)' }}>
                      {n.body}
                    </p>

                    {n.hash && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--brand-slate-100)', paddingTop: '6px', fontSize: '10px', color: 'var(--brand-slate-400)', flexWrap: 'wrap', gap: '4px' }}>
                        <span style={{ fontFamily: 'monospace' }}>🔒 {n.hash}</span>
                        <span style={{ color: '#059669', fontWeight: 600 }}>✓ Digitally Validated</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Signature Pad & Executive Authorization */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="card" style={{ border: '1px solid var(--brand-slate-200)' }}>
              <div className="card-hd" style={{ padding: '12px 16px' }}>
                <div className="card-hd-left">
                  <div className="card-hd-icon"><Stamp size={15} /></div>
                  <div>
                    <div className="card-title" style={{ fontSize: '13px' }}>{t('Executive E-Sign Pad', 'ডিজিটাল স্বাক্ষর প্যাড', lang)}</div>
                    <div className="card-subtitle">{t('Draw or apply 1-click cryptographic token', 'স্বাক্ষর আঁকুন বা ডিজিটাল সিল প্রয়োগ করুন', lang)}</div>
                  </div>
                </div>
              </div>
              <div className="card-body" style={{ padding: '16px' }}>
                {/* File Status Alert if Fully Approved */}
                {currentFile.status === 'approved' && (
                  <div style={{
                    padding: '10px 12px',
                    borderRadius: '6px',
                    background: '#ECFDF5',
                    border: '1px solid #10B981',
                    color: '#065F46',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <ShieldCheck size={18} color="#059669" />
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '12px' }}>
                        {t('File Finalized & Authorized', 'নথি চূড়ান্ত অনুমোদিত ও সিলমোহরকৃত', lang)}
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#047857', marginTop: '1px' }}>
                        {t('All route signatories approved. Cryptographic certificate issued.', 'অনুমোদন প্রক্রিয়া সম্পূর্ণ। ডিজিটাল সনদ তৈরি হয়েছে।', lang)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Active Pending Signatory Header */}
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      background: isFinalStep ? '#D4AF37' : 'var(--brand-crimson)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px'
                    }}>
                      {currentPendingStep?.roleId === 'chairman' ? '👑' : <Stamp size={13} />}
                    </div>
                    <div>
                      <div style={{ fontSize: '9.5px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--brand-slate-500)', fontWeight: 700 }}>
                        {isFinalStep ? t('Final Sanction Authority', 'চূড়ান্ত অনুমোদনকারী', lang) : t('Pending Reviewer / Signatory', 'বর্তমান অনুমোদনকারী', lang)}
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--brand-slate-900)' }}>
                        {activeSignatoryName}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--brand-slate-500)' }}>
                        {activeSignatoryRole}
                      </div>
                    </div>
                  </div>
                  {isFinalStep && (
                    <span style={{ fontSize: '9px', background: '#FEF3C7', color: '#92400E', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>
                      FINAL
                    </span>
                  )}
                </div>

                {/* 1-Click Quick Sign Action for Active Officer */}
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
                    transition: 'all 0.15s ease'
                  }}
                >
                  {currentPendingStep?.roleId === 'chairman' ? <Crown size={14} color="#D4AF37" /> : <Stamp size={14} color="#B45309" />}
                  <span>
                    {t(
                      `⚡ 1-Click Digital Token: ${activeSignatoryName}`,
                      `⚡ ডিজিটাল স্বাক্ষর টোকেন প্রয়োগ: ${activeSignatoryName}`,
                      lang
                    )}
                  </span>
                </button>

                {/* Canvas Drawing Box */}
                <div style={{ border: '1px solid var(--brand-slate-200)', borderRadius: '6px', background: '#FAFAFC', position: 'relative', height: '110px', marginBottom: '10px' }}>
                  <canvas
                    ref={canvasRef}
                    width={340}
                    height={110}
                    style={{ width: '100%', height: '100%', cursor: 'crosshair' }}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                  />
                  {!isDrawing && !isSigned && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', color: 'var(--brand-slate-400)', fontSize: '11px' }}>
                      <PenTool size={13} style={{ marginRight: '5px' }} /> Or draw signature with stylus / mouse
                    </div>
                  )}
                  {isSigned && (
                    <div style={{ position: 'absolute', bottom: '6px', right: '8px', background: '#ECFDF5', border: '1px solid #10B981', color: '#059669', padding: '2px 6px', borderRadius: '4px', fontSize: '9.5px', fontWeight: 700 }}>
                      ✓ Cryptographically Signed
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <button className="btn-outline" style={{ flex: 1, fontSize: '11px', padding: '5px 8px' }} onClick={clearCanvas}>
                    {t('Clear Pad', 'মুছে ফেলুন', lang)}
                  </button>
                  <button className="btn-primary" style={{ flex: 1, fontSize: '11px', padding: '5px 8px' }} onClick={handleApplySignature}>
                    <CheckCheck size={13} /> {t('Apply Signature', 'স্বাক্ষর প্রয়োগ', lang)}
                  </button>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label className="form-label" style={{ fontSize: '11px', fontWeight: 600 }}>
                    {isFinalStep
                      ? t('Final Executive Sanction Directive', 'চূড়ান্ত নির্বাহী পর্যবেক্ষণ ও অনুমোদন মন্তব্য', lang)
                      : t('Review / Recommendation Remarks', 'পর্যালোচনা ও অগ্রগমন মন্তব্য', lang)}
                  </label>
                  <textarea
                    className="form-input"
                    rows={2}
                    placeholder={isFinalStep
                      ? t('Enter final executive approval directive or sanction remarks...', 'চূড়ান্ত অনুমোদন নির্দেশনা লিখুন...', lang)
                      : t('Enter endorsement remarks to forward to next officer...', 'পরবর্তী কর্মকর্তার জন্য মন্তব্য লিখুন...', lang)
                    }
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    style={{ fontSize: '12px', padding: '8px 10px' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="btn-primary"
                    style={{
                      flex: 1.5,
                      justifyContent: 'center',
                      padding: '9px 12px',
                      background: isFinalStep
                        ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                        : 'linear-gradient(135deg, #A51C30 0%, #700B1A 100%)',
                      fontSize: '12px',
                      fontWeight: 700
                    }}
                    onClick={handleSignAndAdvance}
                  >
                    {isFinalStep ? (
                      <>
                        <ShieldCheck size={14} /> {t('Authorize & Grant Final Approval', 'চূড়ান্ত অনুমোদন ও সিল', lang)}
                      </>
                    ) : (
                      <>
                        <Send size={14} /> {t(
                          `Sign & Forward ➔ ${currentFile.signatoryRoute && currentFile.signatoryRoute[currentPendingStepIndex + 1] ? currentFile.signatoryRoute[currentPendingStepIndex + 1].officerName.split(' ')[0] : 'Next'}`,
                          'স্বাক্ষর ও পরবর্তী ধাপে প্রেরণ',
                          lang
                        )}
                      </>
                    )}
                  </button>
                  <button
                    className="btn-outline"
                    style={{ flex: 1, justifyContent: 'center', padding: '9px 10px', borderColor: '#DC2626', color: '#DC2626', background: 'rgba(220, 38, 38, 0.04)', fontSize: '12px' }}
                    onClick={() => setShowReturnModal(true)}
                  >
                    <RotateCcw size={13} /> {t('Return / Query', 'আপত্তি ও ফেরত', lang)}
                  </button>
                </div>
              </div>
            </div>

            {/* Document Meta & SAP Connection */}
            <div className="card" style={{ border: '1px solid var(--brand-slate-200)' }}>
              <div className="card-hd" style={{ padding: '10px 14px' }}>
                <div className="card-hd-left">
                  <div className="card-hd-icon" style={{ width: '24px', height: '24px' }}>🔗</div>
                  <div>
                    <div className="card-title" style={{ fontSize: '12px' }}>SAP S/4HANA Linkage</div>
                    <div className="card-subtitle" style={{ fontSize: '10.5px' }}>Purchase Requisition: {currentFile.sapRef}</div>
                  </div>
                </div>
              </div>
              <div className="card-body" style={{ padding: '12px 14px', fontSize: '11.5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--brand-slate-100)' }}>
                  <span style={{ color: 'var(--brand-slate-500)' }}>Cost Center:</span>
                  <strong>CC-4102 (Keraniganj Refinery)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--brand-slate-100)' }}>
                  <span style={{ color: 'var(--brand-slate-500)' }}>GL Account:</span>
                  <strong>GL-88201 (Plant Capital Spares)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                  <span style={{ color: 'var(--brand-slate-500)' }}>Audit Hash:</span>
                  <code style={{ fontSize: '10px', color: 'var(--brand-slate-600)' }}>SHA256: 7f83b1...d9069</code>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: VENDOR QUOTATIONS COMPARISON ─── */}
      {activeTab === 'compare' && (
        <div className="card mb-4" style={{ border: '1px solid var(--brand-slate-200)', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: 'var(--brand-slate-900)' }}>
                {t('Commercial & Technical Tender Comparison (3 OEM Bids)', 'বাণিজ্যিক ও কারিগরি দরপত্র তুলনা (৩টি ওইএম দরপত্র)', lang)}
              </h3>
              <p style={{ margin: '3px 0 0', fontSize: '11.5px', color: 'var(--brand-slate-500)' }}>
                Dossier {currentFile.fileNo} · ASME Section VIII Div 1 Safety Relief Valves (Class 600)
              </p>
            </div>
            <span className="badge success">3/3 Bids Vetted & BSTI Compliant</span>
          </div>

          <div className="responsive-col-3" style={{ marginBottom: '16px' }}>
            {/* Vendor 1 (Selected) */}
            <div style={{ border: '2px solid #059669', borderRadius: '8px', padding: '16px', background: '#F0FDF4', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '-10px', right: '14px', background: '#059669', color: '#fff', fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '10px' }}>
                RECOMMENDED & LOWEST BID
              </div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#065F46' }}>KSB Valves SE & Co.</div>
              <div style={{ fontSize: '11px', color: '#047857' }}>Frankenthal, Germany (OEM Authorized)</div>
              
              <div style={{ margin: '14px 0', borderTop: '1px solid #A7F3D0', borderBottom: '1px solid #A7F3D0', padding: '10px 0' }}>
                <div style={{ fontSize: '22px', fontWeight: 900, color: '#065F46' }}>৳48,50,000</div>
                <div style={{ fontSize: '10.5px', color: '#059669' }}>Inclusive of C&F, Import Duty & BSTI Fee</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11.5px', color: '#064E3B' }}>
                <div><strong>Lead Time:</strong> 14 Calendar Days (Air Freight)</div>
                <div><strong>Warranty:</strong> 36 Months Comprehensive</div>
                <div><strong>Material:</strong> ASTM A216 WCB / Stellite Trim</div>
                <div><strong>Quality Score:</strong> 98.4% (Highest Technical Rating)</div>
              </div>
            </div>

            {/* Vendor 2 */}
            <div style={{ border: '1px solid var(--brand-slate-200)', borderRadius: '8px', padding: '16px', background: 'var(--brand-card-bg)' }}>
              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--brand-slate-900)' }}>Flowserve SAS</div>
              <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)' }}>Arnhem, France</div>
              
              <div style={{ margin: '14px 0', borderTop: '1px solid var(--brand-slate-100)', borderBottom: '1px solid var(--brand-slate-100)', padding: '10px 0' }}>
                <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--brand-slate-800)' }}>৳52,10,000</div>
                <div style={{ fontSize: '10.5px', color: '#DC2626' }}>+৳3,60,000 variance vs lowest bid</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11.5px', color: 'var(--brand-slate-600)' }}>
                <div><strong>Lead Time:</strong> 21 Calendar Days (Sea Freight)</div>
                <div><strong>Warranty:</strong> 24 Months Standard</div>
                <div><strong>Material:</strong> ASME Class 600 Carbon Steel</div>
                <div><strong>Quality Score:</strong> 92.1%</div>
              </div>
            </div>

            {/* Vendor 3 */}
            <div style={{ border: '1px solid var(--brand-slate-200)', borderRadius: '8px', padding: '16px', background: 'var(--brand-card-bg)' }}>
              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--brand-slate-900)' }}>Velan Inc.</div>
              <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)' }}>Montreal, Canada / Tokyo Depot</div>
              
              <div style={{ margin: '14px 0', borderTop: '1px solid var(--brand-slate-100)', borderBottom: '1px solid var(--brand-slate-100)', padding: '10px 0' }}>
                <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--brand-slate-800)' }}>৳54,80,000</div>
                <div style={{ fontSize: '10.5px', color: '#DC2626' }}>+৳6,30,000 variance vs lowest bid</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11.5px', color: 'var(--brand-slate-600)' }}>
                <div><strong>Lead Time:</strong> 30 Calendar Days</div>
                <div><strong>Warranty:</strong> 24 Months Standard</div>
                <div><strong>Material:</strong> ASME Class 600 Monel Trim</div>
                <div><strong>Quality Score:</strong> 94.0%</div>
              </div>
            </div>
          </div>

          <div style={{ padding: '12px 14px', background: 'var(--brand-slate-50)', borderRadius: '6px', borderLeft: '3px solid #059669', fontSize: '12px', color: 'var(--brand-slate-700)' }}>
            ✓ <strong>Procurement Committee Resolution:</strong> KSB Valves SE & Co. complies 100% with technical parameters and saves <strong>৳3,60,000</strong> compared to the second lowest bidder. Recommended for immediate Chairman sanction and SAP PO release.
          </div>
        </div>
      )}

      {/* ─── TAB 3: AUDIT & PROOF LEDGER ─── */}
      {activeTab === 'audit' && (
        <div className="card mb-4" style={{ border: '1px solid var(--brand-slate-200)', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: 'var(--brand-slate-900)' }}>
                {t('Cryptographic Endorsement Ledger & Audit Trail', 'ক্রিপ্টোগ্রাফিক নিরীক্ষা খতিয়ান ও টাইমস্ট্যাম্প', lang)}
              </h3>
              <p style={{ margin: '3px 0 0', fontSize: '11.5px', color: 'var(--brand-slate-500)' }}>
                Envelope Ref: ENV-2026-90412 · SHA-256 Merkle Provenance
              </p>
            </div>
            <span className="badge success">4-Tier Chain Validated</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {currentFile.notes.map((n, idx) => (
              <div key={n.id} style={{ display: 'flex', gap: '14px', padding: '14px', background: 'var(--brand-slate-50)', borderRadius: '8px', border: '1px solid var(--brand-slate-200)' }}>
                <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: n.isChairman ? '#D4AF37' : '#059669', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '12px', flexShrink: 0 }}>
                  {idx + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--brand-slate-900)' }}>
                      {n.author} <span style={{ fontWeight: 400, color: 'var(--brand-slate-500)', fontSize: '11px' }}>({n.role})</span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--brand-slate-400)', fontFamily: 'monospace' }}>{n.date}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--brand-slate-700)', margin: '4px 0 8px 0', lineHeight: 1.5 }}>
                    {n.body}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10.5px', fontFamily: 'monospace', color: 'var(--brand-slate-500)', flexWrap: 'wrap' }}>
                    <span style={{ background: '#fff', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--brand-slate-200)' }}>
                      {n.hash}
                    </span>
                    <span style={{ color: '#059669', fontWeight: 700 }}>✓ SHA-256 VERIFIED</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certificate of Completion Modal */}
      {showCertModal && (
        <div className="app-modal-overlay" onClick={() => setShowCertModal(false)}>
          <div className="app-modal-dialog" style={{ maxWidth: '620px', width: '95vw' }} onClick={e => e.stopPropagation()}>
            <div className="app-modal-header">
              <div className="app-modal-header-left">
                <div className="app-modal-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#059669' }}>
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h3 className="app-modal-title">{t('Bashundhara Certificate of Execution', 'বসুন্ধরা এক্সিকিউশন সার্টিফিকেট', lang)}</h3>
                  <div className="app-modal-subtitle">{t('Cryptographic SHA-256 Immutable Audit Trail Record', 'ক্রিপ্টোগ্রাফিক ডিজিটাল অডিট রেকর্ড', lang)}</div>
                </div>
              </div>
              <button className="app-modal-close" onClick={() => setShowCertModal(false)} aria-label="Close">
                <X size={16} />
              </button>
            </div>

            <div className="app-modal-body">
              <div style={{ border: '2px solid #D4AF37', borderRadius: '12px', padding: '20px', background: 'rgba(212, 175, 55, 0.04)' }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#B45309', fontWeight: 800 }}>
                  IMMUTABLE AUDIT TRAIL RECORD
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '8px 0 4px 0', color: 'var(--brand-crimson)' }}>
                  CERTIFICATE OF COMPLETION
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--brand-slate-600)' }}>
                  Envelope ID: <code>ENV-2026-90412-BOGCL-0894</code>
                </div>

                <div style={{ marginTop: '20px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--brand-slate-200)', paddingBottom: '6px' }}>
                    <span style={{ color: 'var(--brand-slate-500)' }}>Document:</span>
                    <strong>{currentFile.title}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--brand-slate-200)', paddingBottom: '6px' }}>
                    <span style={{ color: 'var(--brand-slate-500)' }}>Final Executive Signer:</span>
                    <strong>Ahmed Akbar Sobhan (Chairman & MD)</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--brand-slate-200)', paddingBottom: '6px' }}>
                    <span style={{ color: 'var(--brand-slate-500)' }}>Security Verification:</span>
                    <span className="badge success">SHA-256 Digest Cryptographically Verified</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--brand-slate-500)' }}>SAP S/4HANA PO Released:</span>
                    <strong style={{ color: 'var(--status-success)' }}>PO #90412 Auto-Approved</strong>
                  </div>
                </div>

                <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
                  <QrCode size={64} color="#0F172A" />
                </div>
              </div>
            </div>

            <div className="app-modal-footer">
              <button className="btn-sm-ghost" onClick={() => setShowCertModal(false)}>
                {t('Close', 'বন্ধ করুন', lang)}
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  showToast(t('Downloaded Official Watermarked PDF with SHA-256 seal.', 'পিডিএফ ডাউনলোড সম্পন্ন।', lang), 'success');
                  setShowCertModal(false);
                }}
              >
                <Download size={14} /> {t('Download Sealed PDF', 'সিলকৃত পিডিএফ ডাউনলোড', lang)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection / Return with Query Modal */}
      {showReturnModal && (
        <div className="modal-backdrop" onClick={() => setShowReturnModal(false)}>
          <div className="modal-container" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ background: '#7F1D1D', color: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RotateCcw size={18} color="#FCA5A5" />
                <h3 style={{ margin: 0, fontSize: '15px', color: '#fff' }}>
                  {t('Return File with Official Observation Query', 'দাপ্তরিক কোয়ারি ও আপত্তি সহ ফাইল ফেরত', lang)}
                </h3>
              </div>
              <button className="modal-close-btn" style={{ color: '#fff' }} onClick={() => setShowReturnModal(false)}>×</button>
            </div>

            <div className="modal-body" style={{ padding: '20px' }}>
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '6px', padding: '12px 14px', marginBottom: '16px', fontSize: '12px', color: '#991B1B' }}>
                ⚠️ <strong>DocuSign Audit Trail Notice:</strong> This action will append a formal numbered observation paragraph to the running note-sheet and route the dossier back to the initiating department.
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '12px' }}>
                  {t('Primary Regulatory / Operational Reason', 'প্রধান আপত্তি বা পর্যালোচনার কারণ', lang)}
                </label>
                <select
                  className="form-select"
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--brand-border)', fontSize: '12.5px' }}
                >
                  <option value="Budget Justification Incomplete">Budget Justification & Capex GL Account Mismatch</option>
                  <option value="Vendor Quotation Discrepancy">Vendor Quotations Lack 3 Competitive OEM Bids</option>
                  <option value="Technical Clarification Required">Technical Clarification Required on ASME Spec</option>
                  <option value="Regulatory Non-Compliance">DoE / Explosives Statutory Certificate Missing</option>
                  <option value="Commercial Terms Re-negotiation">Commercial Price Revision / Payment Terms Adjustment</option>
                </select>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '12px' }}>
                  {t('Executive Directive & Specific Instructions to Initiator', 'সুনির্দিষ্ট পর্যবেক্ষণ ও সংশোধনী নির্দেশনা', lang)}
                </label>
                <textarea
                  className="form-input"
                  rows={4}
                  placeholder={t(
                    'Specify what data, revised quotes, or technical certificates must be resubmitted...',
                    'কী কী তথ্য, সংশোধিত দরপত্র বা সনদ পুনরায় দাখিল করতে হবে তা লিখুন...',
                    lang
                  )}
                  value={returnObservation}
                  onChange={(e) => setReturnObservation(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--brand-border)', fontSize: '12.5px' }}
                />
              </div>
            </div>

            <div className="modal-footer" style={{ padding: '12px 20px', background: 'var(--brand-slate-50)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn-outline" onClick={() => setShowReturnModal(false)}>
                {t('Cancel', 'বাতিল', lang)}
              </button>
              <button
                className="btn-primary"
                style={{ background: '#DC2626', borderColor: '#DC2626' }}
                onClick={handleRejectOrReturn}
              >
                <RotateCcw size={14} /> {t('Confirm Return & Notify Dept', 'ফেরত নিশ্চিত করুন ও বিভাগকে জানান', lang)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Bashundhara Group Letterhead & Memo Print Modal */}
      <OfficialDocumentModal
        isOpen={showOfficialDoc}
        onClose={() => setShowOfficialDoc(false)}
        lang={lang}
        docData={officialDocData}
      />

      {/* Dynamic Note-Sheet Initiator Studio Modal */}
      <InitiateNotesheetModal
        isOpen={showInitiateModal}
        onClose={() => setShowInitiateModal(false)}
        onSubmit={handleCreateNotesheet}
        lang={lang}
        currentRole={role}
      />
    </div>
  );
}
