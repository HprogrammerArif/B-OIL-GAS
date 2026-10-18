import React, { useState, useRef, useEffect } from 'react';
import { ViewProps, t } from '../types';
import { showToast } from '../App';
import {
  FileSignature, CheckCircle, Clock, AlertTriangle, ShieldCheck,
  Send, PenTool, Hash, Download, ArrowRight, UserCheck, Stamp,
  FileText, QrCode, Lock, CheckCheck, Eye, Layers, RefreshCw, X
} from 'lucide-react';

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
  status: 'pending_chairman' | 'approved' | 'in_review';
  date: string;
  sapRef: string;
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
    status: 'in_review',
    date: '12 Oct 2026',
    sapRef: 'SAP-FI-BUD-0211',
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
    status: 'in_review',
    date: '10 Oct 2026',
    sapRef: 'SAP-HR-POL-0342',
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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureHash, setSignatureHash] = useState<string | null>(null);

  const currentFile = files.find((f) => f.id === activeFileId) || files[0];

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

  const handleApproveChairman = () => {
    if (!isSigned) {
      showToast(
        t('Please sign or stamp your digital signature first.', 'অনুগ্রহ করে প্রথমে ডিজিটাল স্বাক্ষর করুন।', lang),
        'info'
      );
      return;
    }
    const chairmanNote: NoteItem = {
      id: currentFile.notes.length + 1,
      para: currentFile.notes.length + 1,
      author: 'Ahmed Akbar Sobhan',
      role: 'Chairman & Managing Director',
      dept: "Chairman's Secretariat, Bashundhara Group",
      date: 'Today, 22:04 (Real-Time Sign-Off)',
      body:
        newNoteText.trim() ||
        'Approved as recommended in Para 2 and 3. Expedite procurement before the onset of the bitumen supply schedule for the national highway expansion project. Maintain zero plant downtime.',
      status: 'approved',
      hash: signatureHash || 'SHA256: c3ab8ff13720e8ad9047dd39466b3c8974e592c2fa383d4a3960714caef0c4f2',
      isChairman: true,
    };

    setFiles((prev) =>
      prev.map((f) => {
        if (f.id === currentFile.id) {
          return {
            ...f,
            status: 'approved',
            notes: [...f.notes, chairmanNote],
          };
        }
        return f;
      })
    );
    setNewNoteText('');
    showToast(
      t(
        'Note Sheet approved with Executive Chairman Seal & routed to SAP!',
        'চেয়ারম্যান মহোদয়ের চূড়ান্ত সিলসহ নোটশীট অনুমোদিত হয়েছে!',
        lang
      ),
      'gold'
    );
    setShowCertModal(true);
  };

  return (
    <div className="view-container">
      {/* Top Header */}
      <div className="section-header">
        <div>
          <h2 className="section-title">
            ✍️ {t('E-Note Sheet & Cryptographic E-Sign Platform', 'ই-নোটশীট ও ডিজিটাল স্বাক্ষর প্ল্যাটফর্ম', lang)}
          </h2>
          <p className="section-subtitle">
            {t(
              'DocuSign-grade enterprise workflow with multi-tier endorsements, SHA-256 seal & SAP S/4HANA PO integration.',
              'বহুস্তরীয় অনুমোদন ব্যবস্থা, এসএইচএ-২৫৬ এনক্রিপশন সিল এবং স্যাপ এস/৪ হানা ক্রয়াদেশ সমন্বয়।',
              lang
            )}
          </p>
        </div>
        <div className="btn-group">
          <button
            className={`btn-sm-ghost ${activeTab === 'sheet' ? 'active' : ''}`}
            onClick={() => setActiveTab('sheet')}
          >
            <FileText size={14} /> {t('Note Sheet Document', 'নথিপত্র বিবরণী', lang)}
          </button>
          <button
            className={`btn-sm-ghost ${activeTab === 'compare' ? 'active' : ''}`}
            onClick={() => setActiveTab('compare')}
          >
            <Layers size={14} /> {t('Vendor Quotations (3)', 'দরপত্র তুলনা (৩টি)', lang)}
          </button>
          <button
            className={`btn-sm-ghost ${activeTab === 'audit' ? 'active' : ''}`}
            onClick={() => setActiveTab('audit')}
          >
            <Lock size={14} /> {t('Audit & Proof Ledger', 'নিরীক্ষা খতিয়ান', lang)}
          </button>
          <button
            className="btn-primary"
            onClick={() => setShowCertModal(true)}
          >
            <QrCode size={14} /> {t('Certificate of Execution', 'সম্পাদন সনদ', lang)}
          </button>
        </div>
      </div>

      {/* Multi-Document File Switcher Ribbon */}
      <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', marginBottom: '18px', paddingBottom: '4px' }}>
        {files.map((file) => (
          <div
            key={file.id}
            onClick={() => {
              setActiveFileId(file.id);
              clearCanvas();
            }}
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              border: activeFileId === file.id ? '2px solid var(--brand-crimson)' : '1px solid var(--brand-border)',
              background: activeFileId === file.id ? 'var(--brand-card-bg)' : 'var(--brand-slate-50)',
              cursor: 'pointer',
              minWidth: '260px',
              boxShadow: activeFileId === file.id ? 'var(--shadow-md)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--brand-crimson)' }}>
                {file.fileNo}
              </span>
              <span className={`badge ${file.status === 'approved' ? 'success' : 'warn'}`}>
                {file.status === 'approved' ? 'Approved' : 'Action Needed'}
              </span>
            </div>
            <div style={{ fontSize: '12px', fontWeight: 600, marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {file.title}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', color: 'var(--brand-slate-500)' }}>
              <span>Valuation: <strong>{file.amount}</strong></span>
              <span>{file.date}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Approval Flow Stepper (DocuSign Chain) */}
      <div className="card mb-4" style={{ padding: '14px 20px', background: 'linear-gradient(135deg, #0B132B 0%, #1E293B 100%)', color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#D4AF37', fontWeight: 700 }}>
              {t('SEQUENTIAL AUTHORIZATION PIPELINE (DOCUSIGN STANDARD)', 'ধারাবাহিক অনুমোদন পাইপলাইন', lang)}
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '2px' }}>
              File: {currentFile.fileNo} · {currentFile.sapRef}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#10B981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800 }}>✓</div>
              <span style={{ fontSize: '11.5px', color: '#E2E8F0' }}>1. Plant Engr</span>
            </div>
            <ArrowRight size={14} color="#64748B" />
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#10B981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800 }}>✓</div>
              <span style={{ fontSize: '11.5px', color: '#E2E8F0' }}>2. Plant GM</span>
            </div>
            <ArrowRight size={14} color="#64748B" />
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#10B981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800 }}>✓</div>
              <span style={{ fontSize: '11.5px', color: '#E2E8F0' }}>3. CFO Vetting</span>
            </div>
            <ArrowRight size={14} color="#64748B" />
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: currentFile.status === 'approved' ? '#10B981' : '#D4AF37',
                color: '#0F172A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 800
              }}>
                {currentFile.status === 'approved' ? '✓' : '👑'}
              </div>
              <span style={{ fontSize: '11.5px', fontWeight: 700, color: currentFile.status === 'approved' ? '#34D399' : '#FDE047' }}>
                4. Chairman Sign-off
              </span>
            </div>
          </div>
        </div>
      </div>

      {activeTab === 'sheet' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 0.75fr', gap: '20px' }}>
          {/* Official Document View */}
          <div className="card">
            <div className="card-hd">
              <div className="card-hd-left">
                <div className="card-hd-icon">
                  <FileSignature size={18} />
                </div>
                <div>
                  <div className="card-title">{t('Official Secretariat Note-Sheet', 'দাপ্তরিক কার্যবিবরণী ও নোটশীট', lang)}</div>
                  <div className="card-subtitle">{currentFile.fileNo} · {currentFile.dept}</div>
                </div>
              </div>
              <span className={`badge ${currentFile.urgency === 'urgent' ? 'danger' : 'info'}`}>
                {currentFile.urgency === 'urgent' ? '🚨 URGENT / জরুরি' : 'PRIORITY'}
              </span>
            </div>

            <div className="card-body">
              {/* Official Letterhead */}
              <div style={{ borderBottom: '2px solid var(--brand-crimson)', paddingBottom: '12px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--brand-crimson)', margin: 0 }}>
                    BASHUNDHARA OIL & GAS COMPANY LTD.
                  </h3>
                  <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)' }}>
                    Corporate Secretariat • Keraniganj Petroleum Refinery Division
                  </div>
                  <div style={{ fontSize: '9.5px', color: 'var(--brand-slate-400)', marginTop: '2px' }}>
                    ISO 9001:2015 & OHSAS 18001 Certified Refined Bitumen & Base Oil Facilities
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '12px' }}>{currentFile.fileNo}</div>
                  <div style={{ fontSize: '11px', color: 'var(--brand-slate-400)' }}>Date: {currentFile.date}</div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--brand-crimson)', marginTop: '2px' }}>
                    Value: {currentFile.amount}
                  </div>
                </div>
              </div>

              {/* Subject */}
              <div style={{ background: 'var(--brand-slate-50)', padding: '12px 14px', borderRadius: '6px', borderLeft: '4px solid var(--brand-crimson)', marginBottom: '16px', fontWeight: 600, fontSize: '13px' }}>
                {t('Subject: ', 'বিষয়: ', lang)} {currentFile.title}
              </div>

              {/* Notes Paragraphs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {currentFile.notes.map((n) => (
                  <div
                    key={n.id}
                    style={{
                      padding: '14px',
                      borderRadius: '8px',
                      border: n.isChairman ? '1.5px solid #D4AF37' : '1px solid var(--brand-border)',
                      background: n.isChairman ? 'rgba(212, 175, 55, 0.05)' : 'var(--brand-card-bg)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 800, color: n.isChairman ? '#B45309' : 'var(--brand-slate-700)' }}>
                          Para-{n.para}.
                        </span>
                        <strong>{n.author}</strong>
                        <span style={{ fontSize: '11px', color: 'var(--brand-slate-400)' }}>({n.role})</span>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--brand-slate-400)' }}>{n.date}</span>
                    </div>

                    <p style={{ fontSize: '13px', lineHeight: '1.6', margin: '0 0 10px 0', color: 'var(--brand-slate-800)' }}>
                      {n.body}
                    </p>

                    {n.hash && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--brand-border)', paddingTop: '6px', fontSize: '10px', color: 'var(--brand-slate-400)' }}>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="card">
              <div className="card-hd">
                <div className="card-hd-left">
                  <div className="card-hd-icon"><Stamp size={16} /></div>
                  <div>
                    <div className="card-title">{t('Cryptographic Signature Pad', 'ডিজিটাল স্বাক্ষর প্যাড', lang)}</div>
                    <div className="card-subtitle">{t('Draw signature or apply digital seal', 'স্বাক্ষর আঁকুন বা ডিজিটাল সিল প্রয়োগ করুন', lang)}</div>
                  </div>
                </div>
              </div>
              <div className="card-body">
                <div style={{ border: '1.5px dashed var(--brand-border)', borderRadius: '8px', background: '#FAFAFC', position: 'relative', height: '140px', marginBottom: '12px' }}>
                  <canvas
                    ref={canvasRef}
                    width={340}
                    height={140}
                    style={{ width: '100%', height: '100%', cursor: 'crosshair' }}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                  />
                  {!isDrawing && !isSigned && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', color: 'var(--brand-slate-400)', fontSize: '12px' }}>
                      <PenTool size={14} style={{ marginRight: '6px' }} /> Draw Signature with mouse / stylus
                    </div>
                  )}
                  {isSigned && (
                    <div style={{ position: 'absolute', bottom: '8px', right: '10px', background: 'rgba(5, 150, 105, 0.1)', border: '1px solid #10B981', color: '#059669', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700 }}>
                      ✓ Cryptographically Signed
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                  <button className="btn-outline" style={{ flex: 1, fontSize: '11.5px' }} onClick={clearCanvas}>
                    {t('Clear Pad', 'মুছে ফেলুন', lang)}
                  </button>
                  <button className="btn-primary" style={{ flex: 1, fontSize: '11.5px' }} onClick={handleApplySignature}>
                    <CheckCheck size={14} /> {t('Apply Signature', 'স্বাক্ষর প্রয়োগ', lang)}
                  </button>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label className="form-label">{t("Chairman / Approver's Directive Note", 'চেয়ারম্যানের নির্বাহী মন্তব্য', lang)}</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    placeholder="Enter executive directive or sanction text..."
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                  />
                </div>

                <button
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center', padding: '10px', background: 'linear-gradient(135deg, #A51C30 0%, #700B1A 100%)' }}
                  onClick={handleApproveChairman}
                >
                  <Stamp size={16} /> {t('Authorize with Executive Chairman Seal', 'চেয়ারম্যানের সিলসহ চূড়ান্ত অনুমোদন', lang)}
                </button>
              </div>
            </div>

            {/* Document Meta & SAP Connection */}
            <div className="card">
              <div className="card-hd">
                <div className="card-hd-left">
                  <div className="card-hd-icon">🔗</div>
                  <div>
                    <div className="card-title">SAP S/4HANA Linkage</div>
                    <div className="card-subtitle">Purchase Requisition: {currentFile.sapRef}</div>
                  </div>
                </div>
              </div>
              <div className="card-body" style={{ fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--brand-border)' }}>
                  <span style={{ color: 'var(--brand-slate-500)' }}>Cost Center:</span>
                  <strong>CC-4102 (Keraniganj Refinery)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--brand-border)' }}>
                  <span style={{ color: 'var(--brand-slate-500)' }}>GL Account:</span>
                  <strong>GL-88201 (Plant Capital Spares)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                  <span style={{ color: 'var(--brand-slate-500)' }}>Audit Hash:</span>
                  <code style={{ fontSize: '10px' }}>SHA256: 7f83b1...d9069</code>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Certificate of Completion Modal */}
      {showCertModal && (
        <div className="ic-call-overlay">
          <div className="ic-call-modal" style={{ width: '600px', background: 'var(--brand-modal-bg)', color: 'var(--brand-slate-900)' }}>
            <div className="ic-call-header" style={{ borderBottomColor: 'var(--brand-slate-200)', background: 'var(--brand-slate-100)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={18} color="#059669" />
                <strong style={{ fontSize: '13px' }}>BASHUNDHARA CERTIFICATE OF EXECUTION</strong>
              </div>
              <button className="ic-call-close" onClick={() => setShowCertModal(false)}>
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: '24px', textAlign: 'center' }}>
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

            <div style={{ padding: '14px 20px', background: 'var(--brand-slate-50)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn-outline" onClick={() => setShowCertModal(false)}>
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
    </div>
  );
}
