import React, { useState } from 'react';
import {
  Lock,
  CalendarClock,
  Check,
  Plus,
  ShieldCheck,
  AlertTriangle,
  Eye,
  Key,
  CheckCircle,
  Info,
  Flame,
  Zap,
  ArrowRight,
  UserCheck,
  RefreshCw,
  X,
  FileText,
  Clock,
  ShieldAlert,
  ChevronRight,
  HelpCircle
} from 'lucide-react';
import { t } from '../../types';
import { showToast } from '../../App';
import Pagination from '../../components/Pagination';
import RefineryOutputChart from '../../components/RefineryOutputChart';
import { DashboardSubViewProps, LotoPermitItem, ShiftHandoverItem } from './types';
import { INITIAL_LOTO_PERMITS, SHIFT_HANDOVER } from './dashboardData';

interface PlantGmDashboardProps extends DashboardSubViewProps {
  showBatchReleaseModal?: boolean;
  setShowBatchReleaseModal?: (show: boolean) => void;
}

export default function PlantGmDashboard({
  lang,
  activeTab,
  showBatchReleaseModal,
  setShowBatchReleaseModal
}: PlantGmDashboardProps) {
  const [lotoPermits, setLotoPermits] = useState<LotoPermitItem[]>(INITIAL_LOTO_PERMITS);
  const [shiftHandovers, setShiftHandovers] = useState<ShiftHandoverItem[]>(SHIFT_HANDOVER);
  const [lotoPage, setLotoPage] = useState(1);
  const [permitFilter, setPermitFilter] = useState<'all' | 'loto' | 'hot_work' | 'confined_space'>('all');
  const [showGuide, setShowGuide] = useState(true);

  // Modals
  const [selectedPermit, setSelectedPermit] = useState<LotoPermitItem | null>(null);
  const [showNewPermitModal, setShowNewPermitModal] = useState(false);
  const [showNewShiftModal, setShowNewShiftModal] = useState(false);

  // New Permit Form State
  const [newEquip, setNewEquip] = useState('');
  const [newType, setNewType] = useState<'loto' | 'hot_work' | 'confined_space'>('loto');
  const [newBreaker, setNewBreaker] = useState('');
  const [newTechnician, setNewTechnician] = useState('');
  const [newHazard, setNewHazard] = useState('');
  const [newSummary, setNewSummary] = useState('');

  // New Shift Handover Form State
  const [newShiftName, setNewShiftName] = useState('Morning → Afternoon Shift (02:00 PM)');
  const [newShiftOutgoing, setNewShiftOutgoing] = useState('Engr. Tariq Ahmed');
  const [newShiftIncoming, setNewShiftIncoming] = useState('Engr. Kamrul Hasan');
  const [newShiftNotes, setNewShiftNotes] = useState('');
  const [newShiftWatch, setNewShiftWatch] = useState('');

  const filteredPermits = lotoPermits.filter(p => {
    if (permitFilter === 'all') return true;
    return (p.type || 'loto') === permitFilter;
  });

  const handleDeIsolate = (permitId: string) => {
    setLotoPermits(prev => prev.map(p => p.id === permitId ? { ...p, status: 'DE-ISOLATED' } : p));
    if (selectedPermit?.id === permitId) {
      setSelectedPermit(prev => prev ? { ...prev, status: 'DE-ISOLATED' } : null);
    }
    showToast(
      t(
        `Safety padlocks removed and equipment successfully de-isolated for test run.`,
        `নিরাপত্তা লক সরানো হয়েছে এবং সরঞ্জাম টেস্ট রানের জন্য প্রস্তুত করা হয়েছে।`,
        lang
      ),
      'success'
    );
  };

  const handleSignShift = (idx: number) => {
    setShiftHandovers(prev => prev.map((s, i) => i === idx ? { ...s, safetyChecklistSigned: true, status: 'completed' } : s));
    showToast(
      t(
        `Shift handover acknowledged and digitally signed by Incoming Shift Engineer.`,
        `শিফট হস্তান্তর ডিজিটালভাবে গ্রহণ ও স্বাক্ষর সম্পন্ন হয়েছে।`,
        lang
      ),
      'success'
    );
  };

  const handleCreatePermit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEquip.trim() || !newTechnician.trim()) {
      showToast(t('Please specify machine and authorized technician.', 'মেশিন এবং টেকনিশিয়ান নাম দিন।', lang), 'info');
      return;
    }

    const nextId =
      newType === 'hot_work'
        ? `HOT-0${lotoPermits.length + 20}`
        : newType === 'confined_space'
        ? `CONF-0${lotoPermits.length + 10}`
        : `LOTO-0${lotoPermits.length + 45}`;

    const newPermit: LotoPermitItem = {
      id: nextId,
      type: newType,
      typeLabel:
        newType === 'hot_work'
          ? 'Hot Work / Welding Permit'
          : newType === 'confined_space'
          ? 'Inside Tank Entry Permit'
          : 'Electrical Power Lockout',
      equipment: newEquip.trim(),
      breaker: newBreaker.trim() || 'Main Control Breaker Switch',
      issuedTo: newTechnician.trim(),
      status: 'LOCKED OUT',
      hazard: newHazard.trim() || 'High Voltage Electricity / Fluid Pressure',
      plainSummary: newSummary.trim() || 'Power & valves isolated with safety padlock so maintenance can proceed safely.',
      checklist: {
        powerCutVerified: true,
        valvesDrained: true,
        physicalPadlockLocked: true,
        gasTestPassed: true,
        warningTagHung: true,
      },
      timeIssued: 'Just Now',
      validUntil: 'Today, 06:00 PM',
    };

    setLotoPermits([newPermit, ...lotoPermits]);
    setShowNewPermitModal(false);
    setNewEquip('');
    setNewBreaker('');
    setNewTechnician('');
    setNewHazard('');
    setNewSummary('');

    showToast(
      t(
        `Safety Lockout Permit ${newPermit.id} registered! Physical padlocks logged in safety station.`,
        `নিরাপত্তা পারমিট ${newPermit.id} নিবন্ধিত হয়েছে এবং প্যাডলক কার্যকর করা হয়েছে।`,
        lang
      ),
      'gold'
    );
  };

  const handleCreateShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShiftNotes.trim()) {
      showToast(t('Please write shift handover instructions.', 'হস্তান্তর নোট লিখুন।', lang), 'info');
      return;
    }

    const newShift: ShiftHandoverItem = {
      id: `SH-0${shiftHandovers.length + 1}`,
      shift: newShiftName,
      shiftType: 'evening',
      handover: `${newShiftOutgoing} ➔ ${newShiftIncoming}`,
      outgoingEngineer: newShiftOutgoing,
      incomingEngineer: newShiftIncoming,
      time: 'Just Now',
      status: 'completed',
      notes: newShiftNotes.trim(),
      criticalWatchItems: newShiftWatch.trim() ? newShiftWatch.split(',').map(s => s.trim()) : ['Normal routine monitoring'],
      safetyChecklistSigned: true,
    };

    setShiftHandovers([newShift, ...shiftHandovers]);
    setShowNewShiftModal(false);
    setNewShiftNotes('');
    setNewShiftWatch('');

    showToast(
      t(
        `Shift handover log recorded and broadcasted to incoming shift roster.`,
        `নতুন শিফট হস্তান্তর নোট সংরক্ষিত ও পরবর্তী দলের নিকট পৌঁছে দেওয়া হয়েছে।`,
        lang
      ),
      'success'
    );
  };

  return (
    <>
      {/* ═══════════════════════════════════════════
          PLANT GM: TAB "refinery"
          ═══════════════════════════════════════════ */}
      {activeTab === 'refinery' && (
        <div className="tab-pane-fade">
          <RefineryOutputChart lang={lang} />
        </div>
      )}

      {/* ═══════════════════════════════════════════
          PLANT GM: TAB "safety_loto"
          ═══════════════════════════════════════════ */}
      {activeTab === 'safety_loto' && (
        <div className="tab-pane-fade">
          {/* Friendly Explainer Banner */}
          {showGuide && (
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(245, 158, 11, 0.08) 100%)',
                border: '1.5px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '10px',
                padding: '12px 16px',
                marginBottom: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', gap: '10px' }}>
                <HelpCircle size={20} color="#DC2626" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '12px', lineHeight: 1.5, color: 'var(--brand-slate-800)' }}>
                  <div style={{ fontWeight: 800, fontSize: '13px', color: '#991B1B', marginBottom: '3px' }}>
                    {t('What is this section? (Easy Guide for Non-Technical Users)', 'এই সেকশনটি কী এবং কীভাবে কাজ করে? (সহজ নির্দেশিকা)', lang)}
                  </div>
                  <div>
                    In an oil and bitumen factory, repairing machinery is high-risk. This screen protects workers using two essential real-life safety systems:
                  </div>
                  <div style={{ marginTop: '6px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '8px' }}>
                    <div style={{ background: '#FFFFFF', padding: '8px 10px', borderRadius: '6px', border: '1px solid #FCA5A5' }}>
                      <strong style={{ color: '#B91C1C' }}>🔒 1. Machine Safety Locks (LOTO):</strong>
                      <div style={{ fontSize: '11px', color: 'var(--brand-slate-600)', marginTop: '2px' }}>
                        Before an engineer touches a pump, motor, or pipe, its electrical switch is <strong>physically padlocked and tagged</strong> with a warning sign. This guarantees no one can turn the power on accidentally while work is underway.
                      </div>
                    </div>
                    <div style={{ background: '#FFFFFF', padding: '8px 10px', borderRadius: '6px', border: '1px solid #FCD34D' }}>
                      <strong style={{ color: '#B45309' }}>📋 2. Shift Change Notes & Handover:</strong>
                      <div style={{ fontSize: '11px', color: 'var(--brand-slate-600)', marginTop: '2px' }}>
                        The factory runs 24/7 across Morning, Evening, and Night shifts. Departing engineers leave crucial instructions and watch items for the incoming team so nothing is missed.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="btn-sm-ghost"
                style={{ color: 'var(--brand-slate-500)', padding: '2px 6px', fontSize: '11px' }}
                onClick={() => setShowGuide(false)}
                title="Dismiss guide"
              >
                ✕ {t('Got It', 'বুঝেছি', lang)}
              </button>
            </div>
          )}

          {/* Side-by-Side Operational Columns */}
          <div className="col-2 mb-5">
            {/* ─── COLUMN 1: MACHINE LOCKS (LOTO) & WORK PERMITS ─── */}
            <div className="card">
              <div className="card-hd">
                <div className="card-hd-left">
                  <div className="card-hd-icon" style={{ background: '#FEE2E2', color: '#DC2626' }}>
                    <Lock size={16} />
                  </div>
                  <div>
                    <div className="card-title">
                      {t('Machine Safety Locks (LOTO) & Work Permits', 'মেশিন নিরাপত্তা লকআউট ও কাজের অনুমতি', lang)}
                    </div>
                    <div className="card-subtitle">
                      {t('Power & valves locked with padlocks during maintenance', 'মেরামতের সময় বিদ্যুৎ ও ভালভ লক রাখা হয়', lang)}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="badge danger">
                    {lotoPermits.filter(p => p.status === 'LOCKED OUT' || p.status === 'ACTIVE PERMIT').length} {t('Locked for Repair', 'টি মেশিন লকড', lang)}
                  </span>
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ fontSize: '11px', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    onClick={() => setShowNewPermitModal(true)}
                  >
                    <Plus size={13} /> {t('Issue Safety Lock', 'নতুন লক ইস্যু', lang)}
                  </button>
                </div>
              </div>

              {/* Filter Pills */}
              <div style={{ display: 'flex', gap: '6px', padding: '10px 16px 0', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className={`parcel-pill-tab ${permitFilter === 'all' ? 'active' : ''}`}
                  style={{ fontSize: '10.5px', padding: '4px 8px' }}
                  onClick={() => setPermitFilter('all')}
                >
                  All Active ({lotoPermits.length})
                </button>
                <button
                  type="button"
                  className={`parcel-pill-tab ${permitFilter === 'loto' ? 'active' : ''}`}
                  style={{ fontSize: '10.5px', padding: '4px 8px' }}
                  onClick={() => setPermitFilter('loto')}
                >
                  🔒 Power Locks (LOTO)
                </button>
                <button
                  type="button"
                  className={`parcel-pill-tab ${permitFilter === 'hot_work' ? 'active' : ''}`}
                  style={{ fontSize: '10.5px', padding: '4px 8px' }}
                  onClick={() => setPermitFilter('hot_work')}
                >
                  🔥 Welding / Flame
                </button>
                <button
                  type="button"
                  className={`parcel-pill-tab ${permitFilter === 'confined_space' ? 'active' : ''}`}
                  style={{ fontSize: '10.5px', padding: '4px 8px' }}
                  onClick={() => setPermitFilter('confined_space')}
                >
                  🛢️ Tank Interior
                </button>
              </div>

              <div className="card-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {filteredPermits.slice((lotoPage - 1) * 2, lotoPage * 2).map((p) => {
                    const isLocked = p.status === 'LOCKED OUT';
                    const isDeIsolated = p.status === 'DE-ISOLATED';

                    return (
                      <div
                        key={p.id}
                        style={{
                          border: isLocked ? '1.5px solid #FCA5A5' : isDeIsolated ? '1px solid #BBF7D0' : '1px solid var(--brand-slate-200)',
                          padding: '12px 14px',
                          borderRadius: '8px',
                          background: isLocked ? 'linear-gradient(180deg, #FFFFFF 0%, #FEF2F2 100%)' : 'var(--brand-card-bg)',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontFamily: 'monospace', fontWeight: 900, color: 'var(--brand-crimson)', fontSize: '12px' }}>
                              {p.id}
                            </span>
                            <span className="badge" style={{ fontSize: '9.5px', background: '#F1F5F9', color: '#475569' }}>
                              {p.typeLabel || 'Machine Lockout'}
                            </span>
                          </div>

                          <span className={`badge ${isLocked ? 'danger' : isDeIsolated ? 'success' : 'warn'}`} style={{ fontSize: '10px' }}>
                            {isLocked ? '🔒 LOCKED OUT' : isDeIsolated ? '✓ DE-ISOLATED' : p.status}
                          </span>
                        </div>

                        <div style={{ fontWeight: 800, fontSize: '13.5px', marginTop: '6px', color: 'var(--brand-slate-900)' }}>
                          {p.equipment}
                        </div>

                        {/* Plain Explanation Snippet */}
                        {p.plainSummary && (
                          <div style={{ fontSize: '11.5px', color: '#1E293B', marginTop: '4px', background: 'rgba(255,255,255,0.7)', padding: '5px 8px', borderRadius: '5px', border: '1px solid rgba(0,0,0,0.06)' }}>
                            💡 <strong>Why Locked:</strong> {p.plainSummary}
                          </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px', fontSize: '11px', color: 'var(--brand-slate-600)', marginTop: '6px' }}>
                          <span>
                            Locked Switch: <strong>{p.breaker}</strong>
                          </span>
                          <span>
                            Worker: <strong>{p.issuedTo}</strong>
                          </span>
                        </div>

                        <div
                          style={{
                            fontSize: '11px',
                            color: '#991B1B',
                            marginTop: '6px',
                            background: '#FEE2E2',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            border: '1px solid rgba(239,68,68,0.25)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                          }}
                        >
                          <AlertTriangle size={12} color="#DC2626" />
                          <span><strong>Hazard Avoided:</strong> {p.hazard}</span>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed var(--brand-slate-200)' }}>
                          <button
                            type="button"
                            className="btn-outline"
                            style={{ fontSize: '11px', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => setSelectedPermit(p)}
                          >
                            <Eye size={12} /> {t('Inspect 5-Point Safety Checklist', 'চেকলিস্ট দেখুন', lang)}
                          </button>

                          {isLocked && (
                            <button
                              type="button"
                              className="btn-outline-danger"
                              style={{ fontSize: '11px', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                              onClick={() => handleDeIsolate(p.id)}
                            >
                              <Key size={12} /> {t('Remove Lock (De-Isolate)', 'লক প্রত্যাহার করুন', lang)}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Pagination
                  currentPage={lotoPage}
                  totalItems={filteredPermits.length}
                  pageSize={2}
                  onPageChange={setLotoPage}
                  lang={lang}
                />
              </div>
            </div>

            {/* ─── COLUMN 2: SHIFT HANDOVER LOG ─── */}
            <div className="card">
              <div className="card-hd">
                <div className="card-hd-left">
                  <div className="card-hd-icon" style={{ background: '#FEF3C7', color: '#B45309' }}>
                    <CalendarClock size={16} />
                  </div>
                  <div>
                    <div className="card-title">
                      {t('Shift Change Notes & Handover Log', 'শিফট পরিবর্তন ও কাজের হস্তান্তর নোট', lang)}
                    </div>
                    <div className="card-subtitle">
                      {t('Continuous instructions between Morning, Evening & Night teams', 'সকাল, দুপুর ও রাতের দলের মধ্যে নির্দেশনা', lang)}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="badge info" style={{ fontSize: '9.5px' }}>
                    ACTIVE: MORNING SHIFT
                  </span>
                  <button
                    type="button"
                    className="btn-outline"
                    style={{ fontSize: '11px', padding: '5px 9px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    onClick={() => setShowNewShiftModal(true)}
                  >
                    <Plus size={13} /> {t('Log Shift Note', 'হস্তান্তর নোট', lang)}
                  </button>
                </div>
              </div>

              <div className="card-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {shiftHandovers.map((sh, i) => (
                    <div
                      key={sh.id || i}
                      style={{
                        border: '1px solid var(--brand-slate-200)',
                        borderRadius: '8px',
                        padding: '12px 14px',
                        background: 'var(--brand-card-bg)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <strong style={{ fontSize: '13px', color: 'var(--brand-slate-900)' }}>{sh.shift}</strong>
                        <span className={`badge ${sh.status === 'completed' ? 'success' : 'warn'}`}>
                          {sh.status === 'completed' ? '✓ COMPLETED' : 'UPCOMING'}
                        </span>
                      </div>

                      <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)', marginBottom: '6px' }}>
                        👤 {sh.handover} • <Clock size={11} style={{ display: 'inline', verticalAlign: 'middle' }} /> {sh.time}
                      </div>

                      <div style={{ fontSize: '12px', color: 'var(--brand-slate-700)', lineHeight: 1.45, background: 'var(--brand-slate-100)', padding: '8px 10px', borderRadius: '6px' }}>
                        {sh.notes}
                      </div>

                      {/* Critical Watch Items */}
                      {sh.criticalWatchItems && sh.criticalWatchItems.length > 0 && (
                        <div style={{ marginTop: '8px' }}>
                          <div style={{ fontSize: '10.5px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--brand-slate-500)', marginBottom: '3px' }}>
                            Critical Machine Watch Items:
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                            {sh.criticalWatchItems.map((item, idx) => (
                              <span key={idx} className="badge warn" style={{ fontSize: '10px', fontWeight: 600 }}>
                                ⚠️ {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Sign-off status */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed var(--brand-slate-200)', fontSize: '11px' }}>
                        {sh.safetyChecklistSigned ? (
                          <span style={{ color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle size={13} /> {t('Digitally Signed & Acknowledged', 'ডিজিটাল স্বাক্ষর সম্পন্ন', lang)}
                          </span>
                        ) : (
                          <span style={{ color: '#D97706', fontWeight: 600 }}>
                            ⏳ {t('Pending Incoming Shift Signature', 'স্বাক্ষর বাকি', lang)}
                          </span>
                        )}

                        {!sh.safetyChecklistSigned && (
                          <button
                            type="button"
                            className="btn-primary"
                            style={{ fontSize: '10.5px', padding: '3px 8px' }}
                            onClick={() => handleSignShift(i)}
                          >
                            <Check size={12} /> {t('Sign Shift Acceptance', 'স্বাক্ষর গ্রহণ', lang)}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          MODAL 1: INSPECT 5-POINT SAFETY CHECKLIST
          ═══════════════════════════════════════════ */}
      {selectedPermit && (
        <div className="modal-bg" onClick={() => setSelectedPermit(null)}>
          <div className="modal" style={{ maxWidth: '620px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-hd" style={{ background: '#7F1424', color: '#fff' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Lock size={18} color="#FDE047" />
                  <h3 style={{ color: '#fff', margin: 0 }}>
                    {t('Safety Isolation Checklist & Lockout Dossier', 'নিরাপত্তা আইসোলেশন ও লকআউট ডসিয়ার', lang)}
                  </h3>
                </div>
                <div style={{ fontSize: '11px', color: '#FECACA', marginTop: '2px' }}>
                  {selectedPermit.id} • {selectedPermit.equipment}
                </div>
              </div>
              <button className="modal-close" style={{ color: '#fff' }} onClick={() => setSelectedPermit(null)}>×</button>
            </div>

            <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', padding: '10px 12px', borderRadius: '6px', fontSize: '12px', color: '#991B1B', marginBottom: '14px' }}>
                🛡️ <strong>Life-Saving Rule:</strong> Under no circumstances may padlocks or tags be removed until the assigned engineer confirms all personnel are clear of the machinery.
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '12px', marginBottom: '16px' }}>
                <div><strong>Equipment Name:</strong> {selectedPermit.equipment}</div>
                <div><strong>Location:</strong> {selectedPermit.location || 'Keraniganj Complex'}</div>
                <div><strong>Power / Valve Isolated:</strong> {selectedPermit.breaker}</div>
                <div><strong>Authorized Technician:</strong> {selectedPermit.issuedTo}</div>
                <div><strong>Padlock Box Ref:</strong> {selectedPermit.lockoutBoxNo || 'STATION-01'}</div>
                <div><strong>Valid Shift Time:</strong> {selectedPermit.timeIssued || '07:30 AM'} – {selectedPermit.validUntil || '05:00 PM'}</div>
              </div>

              <div style={{ borderTop: '1px solid var(--brand-slate-200)', paddingTop: '12px', marginBottom: '14px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--brand-slate-600)', marginBottom: '8px' }}>
                  5-Point Safety Verification Protocol (OSHA Verified):
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11.5px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#F0FDF4', padding: '8px 10px', borderRadius: '5px', border: '1px solid #BBF7D0' }}>
                    <CheckCircle size={15} color="#15803D" />
                    <span><strong>1. Zero-Energy Test:</strong> Electrical breaker opened and tested with multimeter (0 Volts confirmed).</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#F0FDF4', padding: '8px 10px', borderRadius: '5px', border: '1px solid #BBF7D0' }}>
                    <CheckCircle size={15} color="#15803D" />
                    <span><strong>2. Physical Padlock Clamped:</strong> Master red safety padlock attached to lockout hasp. Key held by technician.</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#F0FDF4', padding: '8px 10px', borderRadius: '5px', border: '1px solid #BBF7D0' }}>
                    <CheckCircle size={15} color="#15803D" />
                    <span><strong>3. High-Vis Warning Tag:</strong> Waterproof "DANGER: DO NOT OPERATE" tag wired to breaker with technician contact.</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#F0FDF4', padding: '8px 10px', borderRadius: '5px', border: '1px solid #BBF7D0' }}>
                    <CheckCircle size={15} color="#15803D" />
                    <span><strong>4. Hydraulic & Steam Isolation:</strong> Molten bitumen supply valves chained closed and drained to 0 Bar pressure.</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#F0FDF4', padding: '8px 10px', borderRadius: '5px', border: '1px solid #BBF7D0' }}>
                    <CheckCircle size={15} color="#15803D" />
                    <span><strong>5. Combustible Gas Check:</strong> Atmospheric test confirmed 0.0% flammable vapor and 20.9% normal oxygen.</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-ft" style={{ justifyContent: 'space-between' }}>
              <button className="btn-sm-ghost" onClick={() => setSelectedPermit(null)}>{t('Close', 'বন্ধ করুন', lang)}</button>

              {selectedPermit.status === 'LOCKED OUT' ? (
                <button
                  type="button"
                  className="btn-outline-danger"
                  onClick={() => handleDeIsolate(selectedPermit.id)}
                >
                  <Key size={14} /> {t('Remove Padlock & De-Isolate Machine', 'প্যাডলক খুলে মেশিন সক্রিয় করুন', lang)}
                </button>
              ) : (
                <span className="badge success">✓ MACHINE RESTORED TO SERVICE</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          MODAL 2: ISSUE NEW SAFETY LOCK / PERMIT
          ═══════════════════════════════════════════ */}
      {showNewPermitModal && (
        <div className="modal-bg" onClick={() => setShowNewPermitModal(false)}>
          <div className="modal" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-hd" style={{ background: '#1E293B', color: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={18} color="#38BDF8" />
                <h3 style={{ color: '#fff', margin: 0 }}>
                  {t('Issue New Machine Safety Lock / Permit', 'নতুন মেশিন নিরাপত্তা লক ও পারমিট ইস্যু', lang)}
                </h3>
              </div>
              <button className="modal-close" style={{ color: '#fff' }} onClick={() => setShowNewPermitModal(false)}>×</button>
            </div>

            <form onSubmit={handleCreatePermit}>
              <div className="modal-body">
                <div className="form-group mb-3">
                  <label style={{ fontSize: '12px', fontWeight: 700 }}>{t('Permit Type', 'অনুমোদনের ধরন', lang)}</label>
                  <select
                    className="form-input"
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                  >
                    <option value="loto">🔒 Electrical Power Lockout (LOTO) — Motors, Pumps, Breakers</option>
                    <option value="hot_work">🔥 Hot Work Permit — Welding, Grinding, Open Flame</option>
                    <option value="confined_space">🛢️ Confined Space Entry — Inside Storage Tank or Vessel</option>
                  </select>
                </div>

                <div className="form-group mb-3">
                  <label style={{ fontSize: '12px', fontWeight: 700 }}>{t('Machine / Equipment Name', 'মেশিন বা যন্ত্রপাতির নাম', lang)}</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Heavy Duty Bitumen Booster Pump #3"
                    value={newEquip}
                    onChange={(e) => setNewEquip(e.target.value)}
                    required
                  />
                </div>

                <div className="form-row mb-3">
                  <div className="form-group">
                    <label style={{ fontSize: '12px', fontWeight: 700 }}>{t('Breaker Switch / Valve to Lock', 'যে সুইচ বা ভালভ লক করতে হবে', lang)}</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Substation Breaker 3A-08"
                      value={newBreaker}
                      onChange={(e) => setNewBreaker(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '12px', fontWeight: 700 }}>{t('Authorized Technician', 'দায়িত্বপ্রাপ্ত টেকনিশিয়ান', lang)}</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Tariq Ahmed (Mechanical Lead)"
                      value={newTechnician}
                      onChange={(e) => setNewTechnician(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group mb-3">
                  <label style={{ fontSize: '12px', fontWeight: 700 }}>{t('Hazard Being Prevented', 'কী ধরনের বিপদ থেকে রক্ষা করবে?', lang)}</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 415V Electric Shock & High-Pressure Molten Bitumen Spray"
                    value={newHazard}
                    onChange={(e) => setNewHazard(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '12px', fontWeight: 700 }}>{t('Plain Purpose Summary (For Easy Understanding)', 'সহজ ভাষায় কাজের উদ্দেশ্য', lang)}</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Locking pump power so technician can safely change worn bearings."
                    value={newSummary}
                    onChange={(e) => setNewSummary(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-ft">
                <button type="button" className="btn-sm-ghost" onClick={() => setShowNewPermitModal(false)}>{t('Cancel', 'বাতিল', lang)}</button>
                <button type="submit" className="btn-primary">
                  <Lock size={13} /> {t('Apply Padlock & Issue Permit', 'প্যাডলক নিশ্চিত ও পারমিট ইস্যু', lang)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          MODAL 3: LOG SHIFT HANDOVER NOTE
          ═══════════════════════════════════════════ */}
      {showNewShiftModal && (
        <div className="modal-bg" onClick={() => setShowNewShiftModal(false)}>
          <div className="modal" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-hd" style={{ background: '#B45309', color: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CalendarClock size={18} color="#FEF3C7" />
                <h3 style={{ color: '#fff', margin: 0 }}>
                  {t('Record Shift Change & Handover Notes', 'শিফট পরিবর্তন ও কাজের হস্তান্তর নোট লিপিবদ্ধকরণ', lang)}
                </h3>
              </div>
              <button className="modal-close" style={{ color: '#fff' }} onClick={() => setShowNewShiftModal(false)}>×</button>
            </div>

            <form onSubmit={handleCreateShift}>
              <div className="modal-body">
                <div className="form-group mb-3">
                  <label style={{ fontSize: '12px', fontWeight: 700 }}>{t('Shift Transition Window', 'শিফট পরিবর্তনের সময়', lang)}</label>
                  <select
                    className="form-input"
                    value={newShiftName}
                    onChange={(e) => setNewShiftName(e.target.value)}
                  >
                    <option value="Night → Morning Shift (06:00 AM)">Night → Morning Shift (06:00 AM)</option>
                    <option value="Morning → Afternoon Shift (02:00 PM)">Morning → Afternoon Shift (02:00 PM)</option>
                    <option value="Afternoon → Night Shift (10:00 PM)">Afternoon → Night Shift (10:00 PM)</option>
                  </select>
                </div>

                <div className="form-row mb-3">
                  <div className="form-group">
                    <label style={{ fontSize: '12px', fontWeight: 700 }}>{t('Outgoing Engineer (Leaving)', 'বিদায়ী প্রকৌশলী', lang)}</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newShiftOutgoing}
                      onChange={(e) => setNewShiftOutgoing(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '12px', fontWeight: 700 }}>{t('Incoming Engineer (Arriving)', 'নতুন দায়িত্বপ্রাপ্ত প্রকৌশলী', lang)}</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newShiftIncoming}
                      onChange={(e) => setNewShiftIncoming(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group mb-3">
                  <label style={{ fontSize: '12px', fontWeight: 700 }}>{t('Shift Operational Summary & Observations', 'কাজের বিবরণ ও পর্যবেক্ষণ', lang)}</label>
                  <textarea
                    rows={3}
                    className="form-input"
                    placeholder="Describe machine status, tank levels, refinery run rates, and work scheduled for the incoming crew..."
                    value={newShiftNotes}
                    onChange={(e) => setNewShiftNotes(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '12px', fontWeight: 700 }}>{t('Critical Watch Items (Separated by commas)', 'বিশেষ নজরদারি আইটেম (কমা দিয়ে লিখুন)', lang)}</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Tank TK-102 temperature, Boiler steam pressure, Valve V-204 replacement"
                    value={newShiftWatch}
                    onChange={(e) => setNewShiftWatch(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-ft">
                <button type="button" className="btn-sm-ghost" onClick={() => setShowNewShiftModal(false)}>{t('Cancel', 'বাতিল', lang)}</button>
                <button type="submit" className="btn-primary" style={{ background: '#B45309', borderColor: '#B45309' }}>
                  <Check size={13} /> {t('Save & Broadcast Handover', 'সংরক্ষণ ও শিফট হস্তান্তর সম্পন্ন', lang)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          PLANT GM: Batch Quality Release Modal
          ═══════════════════════════════════════════ */}
      {showBatchReleaseModal && (
        <div className="modal-bg" onClick={() => setShowBatchReleaseModal?.(false)}>
          <div className="modal" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-hd" style={{ background: '#0F172A', color: '#fff' }}>
              <div>
                <h3 style={{ color: '#fff', margin: 0 }}>
                  ★ {t('Plant GM Bitumen Batch Quality Release Authority', 'বিটুমিন ব্যাচ গুণমান সনদ ও রিলিজ অনুমোদন', lang)}
                </h3>
                <div style={{ fontSize: '11px', color: '#94A3B8' }}>BOGCL QC Lab Tested • Keraniganj Complex</div>
              </div>
              <button className="modal-close" style={{ color: '#fff' }} onClick={() => setShowBatchReleaseModal?.(false)}>×</button>
            </div>

            <div className="modal-body">
              <div style={{ border: '2px solid #E2E8F0', padding: '16px', borderRadius: '6px', background: '#FAFAFC', marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', borderBottom: '1px solid #CBD5E1', paddingBottom: '8px', marginBottom: '10px' }}>
                  <div>
                    <strong>Batch No:</strong> <span style={{ fontFamily: 'monospace' }}>BOGCL-BIT-2026-B88</span>
                  </div>
                  <div>
                    <strong>Product:</strong> <span style={{ color: '#D97706', fontWeight: 800 }}>Bitumen Grade 60/70</span>
                  </div>
                  <div>
                    <strong>Volume:</strong> 2,400 Metric Tons
                  </div>
                </div>

                <div style={{ fontSize: '11.5px', fontWeight: 700, marginBottom: '6px' }}>Laboratory Physical Test Parameters (BDS 1238:2020 Standard):</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', fontSize: '11px' }}>
                  <div style={{ background: '#ECFDF5', padding: '8px', borderRadius: '4px', border: '1px solid #A7F3D0' }}>
                    Penetration @ 25°C: <strong>64 dmm</strong> (Passed)
                  </div>
                  <div style={{ background: '#ECFDF5', padding: '8px', borderRadius: '4px', border: '1px solid #A7F3D0' }}>
                    Softening Point: <strong>51.2°C</strong> (Passed)
                  </div>
                  <div style={{ background: 'var(--status-success-bg)', padding: '8px', borderRadius: '4px', border: '1px solid rgba(16,185,129,0.3)' }}>
                    Ductility: <strong>&gt;100 cm</strong> (Passed)
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '12px', color: 'var(--brand-slate-600)', background: 'var(--status-warning-bg)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(245,158,11,0.3)' }}>
                🔒 <strong>Plant GM Digital Seal:</strong> Authorizing this release unlocks Tank Farm Gantry Dispensers 1–4 and dispatches delivery challans to RHD Highway contractor tankers.
              </div>
            </div>

            <div className="modal-ft">
              <button className="btn-sm-ghost" onClick={() => setShowBatchReleaseModal?.(false)}>{t('Cancel', 'বাতিল', lang)}</button>
              <button
                className="btn-gold"
                style={{ fontWeight: 800 }}
                onClick={() => {
                  showToast(t('Batch BOGCL-BIT-2026-B88 released! Delivery gates unlocked and SAP dispatch notification dispatched.', 'ব্যাচ রিলিজ সম্পন্ন! লোডিং গ্যান্ট্রি সক্রিয় করা হয়েছে।', lang), 'gold');
                  setShowBatchReleaseModal?.(false);
                }}
              >
                <Check size={14} />
                {t('Authorize Batch Release & Sign Off', 'ব্যাচ অনুমোদন ও ডিজিটাল স্বাক্ষর', lang)}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
