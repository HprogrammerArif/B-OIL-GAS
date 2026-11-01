import React, { useState, useMemo } from 'react';
import { ViewProps, t } from '../types';
import { showToast } from '../components/ToastManager';
import { useOperationsStore } from '../store/operationsStore';
import { useCurrentUser } from '../auth/session';
import {
  ShieldCheck, AlertTriangle, Clock, CheckCircle, FileText,
  Flame, Leaf, Building, ArrowRight, ArrowLeft, Upload, Zap, RefreshCw,
  ExternalLink, Eye, Award, Check, Download, AlertOctagon,
  ChevronRight, Printer, Sparkles, Filter, Search, Send,
  FileCheck, DollarSign, Calendar, User, Scale, CheckSquare, X,
  BadgeCheck, Info, Radio, HardHat, FileBadge, Lock, HelpCircle, ShieldAlert
} from 'lucide-react';

interface AuditItem {
  item: string;
  itemBn?: string;
  passed: boolean;
}

interface DocVaultItem {
  name: string;
  size: string;
  date: string;
  type: string;
}

interface LicenseCard {
  id: string;
  tag: 'bsti' | 'doe' | 'fire' | 'env' | 'trade';
  tagLabel: string;
  agency: string;
  agencyBn: string;
  title: string;
  titleBn: string;
  refNo: string;
  daysLeft: number;
  stage: number; // 1 to 5
  focalPerson: string;
  focalDesignation: string;
  lastInspection: string;
  criticality: 'critical' | 'high' | 'medium';
  sroLawRef: string;
  feeAmountTk: string;
  dailyShutdownRiskTk: string;
  statutoryPenalty: string;
  statutoryPenaltyBn: string;
  inspectorName: string;
  inspectorDesignation: string;
  ministryRecipient: string;
  ministryAddress: string;
  certificateValidity: string;
  auditChecklist: AuditItem[];
  documents: DocVaultItem[];
}


const STAGES = [
  { id: 1, title: '1. Internal Review', titleBn: '১. অভ্যন্তরীণ মূল্যায়ন', color: 'var(--status-purple)', badgeColor: 'var(--status-purple-bg)', textColor: 'var(--status-purple-text)' },
  { id: 2, title: '2. Application Filed', titleBn: '২. আবেদন দাখিল', color: 'var(--status-info)', badgeColor: 'var(--status-info-bg)', textColor: 'var(--status-info)' },
  { id: 3, title: '3. Field Inspection', titleBn: '৩. মাঠ পরিদর্শন', color: 'var(--status-warning)', badgeColor: 'var(--status-warning-bg)', textColor: 'var(--status-warning-text)' },
  { id: 4, title: '4. Ministry Vetting', titleBn: '৪. মন্ত্রণালয়ে যাচাই', color: 'var(--brand-crimson)', badgeColor: 'var(--status-danger-bg)', textColor: 'var(--status-danger-text)' },
  { id: 5, title: '5. Renewed & Active', titleBn: '৫. সক্রিয় ও নবায়িত', color: 'var(--status-success)', badgeColor: 'var(--status-success-bg)', textColor: 'var(--status-success-text)' },
];

export default function ComplianceView({ lang }: ViewProps) {
  const { licenses, setLicenses } = useOperationsStore();
  const user = useCurrentUser();
  const canManage = !!user?.permissions.has('compliance:manage');
  const canDispatch = !!user?.permissions.has('compliance:dispatch_letter');
  const canDraftLetter = canManage || canDispatch;
  const [selectedLicense, setSelectedLicense] = useState<LicenseCard | null>(null);
  const [showDoLetterModal, setShowDoLetterModal] = useState<LicenseCard | null>(null);

  // Filtering & Search
  const [selectedAgencyFilter, setSelectedAgencyFilter] = useState<string>('all');
  const [selectedUrgencyFilter, setSelectedUrgencyFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Customization of DO Letter in Modal
  const [doLetterCustomSubject, setDoLetterCustomSubject] = useState<string>('');
  const [doLetterDeliveryMode, setDoLetterDeliveryMode] = useState<'enothi' | 'courier' | 'liaison'>('enothi');

  // Advance / Reverse Pipeline Stage
  const moveLicense = (id: string, dir: number) => {
    if (!canManage) return;
    setLicenses(prev => prev.map(lic => {
      if (lic.id === id) {
        const nextStage = Math.max(1, Math.min(5, lic.stage + dir));
        return { ...lic, stage: nextStage };
      }
      return lic;
    }));
    showToast(t('License pipeline stage updated.', 'লাইসেন্স পাইপলাইন স্টেজ আপডেট করা হয়েছে।', lang), 'success');
  };

  // Toggle checklist item
  const toggleChecklistItem = (itemIndex: number) => {
    if (!selectedLicense || !canManage) return;
    const updatedChecklist = selectedLicense.auditChecklist.map((c, i) => (i === itemIndex ? { ...c, passed: !c.passed } : c));
    const updated = { ...selectedLicense, auditChecklist: updatedChecklist };
    setSelectedLicense(updated);
    setLicenses(prev => prev.map(l => l.id === updated.id ? updated : l));
    showToast(t('Statutory audit verification updated.', 'অডিট ভেরিফিকেশন হালনাগাদ করা হয়েছে।', lang), 'info');
  };

  const handleOpenDoLetter = (lic: LicenseCard) => {
    setShowDoLetterModal(lic);
    setDoLetterCustomSubject(`REQUEST FOR EXPEDITED STATUTORY RENEWAL: ${lic.title.toUpperCase()} (REF: ${lic.refNo})`);
  };

  // Filtered Licenses
  const filteredLicenses = useMemo(() => {
    return licenses.filter(lic => {
      // Agency Filter
      if (selectedAgencyFilter !== 'all') {
        if (selectedAgencyFilter === 'explosives' && lic.tag !== 'fire') return false;
        if (selectedAgencyFilter === 'doe' && lic.tag !== 'doe') return false;
        if (selectedAgencyFilter === 'bsti' && lic.tag !== 'bsti') return false;
        if (selectedAgencyFilter === 'trade' && lic.tag !== 'trade') return false;
        if (selectedAgencyFilter === 'calibration' && lic.tag !== 'env') return false;
      }
      // Urgency Filter
      if (selectedUrgencyFilter === 'critical' && lic.daysLeft > 30) return false;
      if (selectedUrgencyFilter === 'warning' && (lic.daysLeft <= 30 || lic.daysLeft > 90)) return false;
      if (selectedUrgencyFilter === 'active' && lic.daysLeft <= 90) return false;
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = lic.title.toLowerCase().includes(q) || lic.titleBn.toLowerCase().includes(q);
        const matchRef = lic.refNo.toLowerCase().includes(q);
        const matchAgency = lic.agency.toLowerCase().includes(q) || lic.agencyBn.toLowerCase().includes(q);
        const matchFocal = lic.focalPerson.toLowerCase().includes(q);
        if (!matchTitle && !matchRef && !matchAgency && !matchFocal) return false;
      }
      return true;
    });
  }, [licenses, selectedAgencyFilter, selectedUrgencyFilter, searchQuery]);

  // Overall Metrics
  const criticalLicenses = licenses.filter(l => l.daysLeft <= 30);
  const closestExpiry = licenses.length ? Math.min(...licenses.map(l => l.daysLeft)) : 0;
  const mostCriticalLicense = licenses.length
    ? licenses.reduce((prev, curr) => (curr.daysLeft < prev.daysLeft ? curr : prev), licenses[0])
    : undefined;
  const renewalsInProgress = licenses.filter(l => l.stage < 5).length;
  const checklistTotal = licenses.reduce((n, l) => n + l.auditChecklist.length, 0);
  const checklistPassed = licenses.reduce((n, l) => n + l.auditChecklist.filter(c => c.passed).length, 0);
  const readinessPct = checklistTotal ? Math.round((checklistPassed / checklistTotal) * 100) : 100;
  const agencyCount = new Set(licenses.map(l => l.agency)).size;

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Top Header & Barometer */}
      <div className="flex-between mb-4" style={{ flexWrap: 'wrap', gap: '14px', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 900, color: 'var(--brand-slate-900)', letterSpacing: '-0.4px', margin: 0 }}>
            {t('Permits & Licenses', 'লাইসেন্স ও অনুমোদনপত্র', lang)}
          </h2>
          <p className="text-muted" style={{ margin: '4px 0 0 0', fontSize: '13px' }}>
            {canManage
              ? t('Track renewals, verify audit checklists and keep every permit current.', 'নবায়ন অনুসরণ, অডিট চেকলিস্ট যাচাই এবং প্রতিটি লাইসেন্স হালনাগাদ রাখুন।', lang)
              : t('Status of statutory permits and renewals for the Keraniganj plant.', 'কেরানীগঞ্জ প্ল্যান্টের বিধিবদ্ধ লাইসেন্স ও নবায়নের অবস্থা।', lang)}
          </p>
        </div>

        <div style={{ padding: '8px 14px', background: readinessPct >= 85 ? 'var(--status-success-bg)' : 'var(--status-warning-bg)', border: `1px solid ${readinessPct >= 85 ? 'var(--status-success-border)' : 'var(--status-warning-border)'}`, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldCheck size={20} color={readinessPct >= 85 ? 'var(--status-success)' : 'var(--status-warning)'} />
          <div style={{ fontSize: '11.5px', color: readinessPct >= 85 ? 'var(--status-success-text)' : 'var(--status-warning-text)' }}>
            <div style={{ fontWeight: 800, fontSize: '13px' }}>{t(`Audit readiness: ${readinessPct}%`, `অডিট প্রস্তুতি: ${readinessPct}%`, lang)}</div>
            <div>{t(`${checklistPassed} of ${checklistTotal} checklist items verified`, `${checklistTotal}টির মধ্যে ${checklistPassed}টি চেকলিস্ট আইটেম যাচাইকৃত`, lang)}</div>
          </div>
        </div>
      </div>

      {/* Regulatory Risk Barometer */}
      <div className="responsive-col-4 mb-4" style={{ gap: '14px' }}>
        <div className="card" style={{ padding: '14px 16px', borderLeft: '4px solid var(--status-danger)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-slate-500)', textTransform: 'uppercase' }}>
              {t('Nearest Expiry', 'নিকটতম মেয়াদোত্তীর্ণ', lang)}
            </span>
            <AlertTriangle size={16} color="var(--status-danger)" />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--status-danger)', marginTop: '4px' }}>
            {closestExpiry} {t('Days Left', 'দিন বাকি', lang)}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--brand-slate-600)', marginTop: '2px' }}>
            {t(`${criticalLicenses.length} permit(s) due within 30 days`, `৩০ দিনের মধ্যে ${criticalLicenses.length}টি লাইসেন্স নবায়নযোগ্য`, lang)}
          </div>
        </div>

        <div className="card" style={{ padding: '14px 16px', borderLeft: '4px solid var(--status-warning)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-slate-500)', textTransform: 'uppercase' }}>
              {t('Renewals In Progress', 'চলমান নবায়ন', lang)}
            </span>
            <RefreshCw size={16} color="var(--status-warning)" />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--status-warning-text)', marginTop: '4px' }}>
            {renewalsInProgress}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--brand-slate-600)', marginTop: '2px' }}>
            {t('Not yet at Renewed & Active', 'এখনো সক্রিয় ও নবায়িত ধাপে পৌঁছায়নি', lang)}
          </div>
        </div>

        <div className="card" style={{ padding: '14px 16px', borderLeft: '4px solid var(--status-success)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-slate-500)', textTransform: 'uppercase' }}>
              {t('Permits Tracked', 'তদারকিকৃত লাইসেন্স', lang)}
            </span>
            <Building size={16} color="var(--status-success)" />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--brand-slate-900)', marginTop: '4px' }}>
            {licenses.length} <span style={{ fontSize: '12px', fontWeight: 600 }}>{t('Permits', 'টি লাইসেন্স', lang)}</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--brand-slate-600)', marginTop: '2px' }}>
            {t(`Across ${agencyCount} issuing agencies`, `${agencyCount}টি ইস্যুকারী সংস্থা`, lang)}
          </div>
        </div>

        <div className="card" style={{ padding: '14px 16px', borderLeft: '4px solid var(--status-info)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-slate-500)', textTransform: 'uppercase' }}>
              {t('Checklist Items Open', 'অসম্পন্ন চেকলিস্ট আইটেম', lang)}
            </span>
            <CheckSquare size={16} color="var(--status-info)" />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--status-info)', marginTop: '4px' }}>
            {checklistTotal - checklistPassed}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--brand-slate-600)', marginTop: '2px' }}>
            {t('Must be verified before renewal', 'নবায়নের আগে যাচাই করতে হবে', lang)}
          </div>
        </div>
      </div>

      {/* Critical Countdown Warning Strip */}
      <div style={{
        background: 'linear-gradient(90deg, var(--brand-crimson-dark) 0%, var(--brand-crimson) 100%)',
        color: 'var(--text-on-brand)',
        padding: '14px 20px',
        borderRadius: 'var(--radius-md)',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        boxShadow: 'var(--shadow-crimson)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1 1 500px' }}>
          <div style={{ background: 'rgba(255,255,255,0.15)', padding: '8px', borderRadius: '8px', display: 'flex' }}>
            <AlertTriangle size={22} color="var(--brand-gold-light)" />
          </div>
          <div style={{ fontSize: '13px', lineHeight: 1.5 }}>
            <div style={{ fontWeight: 800, color: 'var(--status-warning-bright)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>{t('CRITICAL COMPLIANCE NOTICE:', 'জরুরি বিধিবদ্ধ নোটিশ:', lang)}</span>
              <span className="badge danger" style={{ background: 'var(--status-danger-solid-dark)', color: 'var(--status-danger-bright)', border: '1px solid var(--status-danger-solid-dark)', fontSize: '10px' }}>
                {t(`ACTION REQUIRED WITHIN ${mostCriticalLicense?.daysLeft || 7} DAYS`, `${mostCriticalLicense?.daysLeft || 7} দিনের মধ্যে সমাধান প্রয়োজন`, lang)}
              </span>
            </div>
            <div style={{ color: 'var(--text-inverse)', marginTop: '2px' }}>
              {mostCriticalLicense ? (
                t(
                  `${mostCriticalLicense.title} (${mostCriticalLicense.agency}) has ${mostCriticalLicense.daysLeft} days remaining. Current stage: ${STAGES[mostCriticalLicense.stage - 1].title.split('. ')[1]}.`,
                  `${mostCriticalLicense.titleBn} (${mostCriticalLicense.agencyBn})-এর মেয়াদ শেষ হতে ${mostCriticalLicense.daysLeft} দিন বাকি। বর্তমান ধাপ: ${STAGES[mostCriticalLicense.stage - 1].titleBn.split('. ')[1]}।`,
                  lang
                )
              ) : null}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {mostCriticalLicense && canDraftLetter && (
            <button
              className="btn-gold"
              style={{ fontSize: '12px', padding: '7px 16px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
              onClick={() => handleOpenDoLetter(mostCriticalLicense)}
            >
              <FileText size={14} />
              {t('Prepare DO Letter', 'ডিও লেটার প্রস্তুত করুন', lang)}
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="card mb-4" style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          {/* Agency Filter Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-slate-500)', display: 'flex', alignItems: 'center', gap: '4px', marginRight: '4px' }}>
              <Filter size={13} /> {t('Filter Agency:', 'সংস্থা ফিল্টার:', lang)}
            </span>
            {[
              { id: 'all', label: 'All Agencies', labelBn: 'সকল সংস্থা' },
              { id: 'explosives', label: 'Explosives / Fire', labelBn: 'বিস্ফোরক ও ফায়ার' },
              { id: 'doe', label: 'Environment (DoE)', labelBn: 'পরিবেশ অধিদপ্তর' },
              { id: 'bsti', label: 'BSTI Standards', labelBn: 'বিএসটিআই মান' },
              { id: 'trade', label: 'Energy Div Quota', labelBn: 'জ্বালানি বিভাগ কোটা' },
              { id: 'calibration', label: 'Metrology / Boilers', labelBn: 'মেট্রোলজি ও বয়লার' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setSelectedAgencyFilter(f.id)}
                style={{
                  fontSize: '11px',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
                  border: selectedAgencyFilter === f.id ? '1px solid var(--brand-crimson)' : '1px solid var(--brand-slate-200)',
                  background: selectedAgencyFilter === f.id ? 'var(--brand-crimson)' : 'var(--surface-1)',
                  color: selectedAgencyFilter === f.id ? 'var(--text-on-brand)' : 'var(--brand-slate-700)',
                  fontWeight: selectedAgencyFilter === f.id ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {t(f.label, f.labelBn, lang)}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '240px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--brand-slate-400)' }} />
              <input
                type="text"
                placeholder={t('Search license, ref#, focal engineer...', 'লাইসেন্স, রেফারেন্স নং বা কর্মকর্তা খুঁজুন...', lang)}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 10px 6px 30px',
                  fontSize: '12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--brand-slate-200)',
                  outline: 'none',
                  background: 'var(--surface-0)'
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--brand-slate-400)' }}
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 5-Stage Kanban Board */}
      <div className="card mb-5">
        <div className="card-hd">
          <div className="card-hd-left">
            <div className="card-hd-icon">
              <Building size={18} />
            </div>
            <div>
              <div className="card-title">{t('Regulatory Approval Life-Cycle Pipeline', 'নিয়ামক সংস্থা অনুমোদন ও লাইসেন্স পাইপলাইন', lang)}</div>
              <div className="card-subtitle">{t('Renewals with BSTI, Explosives Dept, Fire Service and DoE, stage by stage', 'বিএসটিআই, বিস্ফোরক অধিদপ্তর, ফায়ার সার্ভিস ও পরিবেশ অধিদপ্তরের লাইসেন্স পাইপলাইন', lang)}</div>
            </div>
          </div>
          <div className="flex-gap" style={{ alignItems: 'center' }}>
            <span className="telemetry-hide-desktop" style={{ fontSize: '11px', color: 'var(--brand-slate-500)' }}>
              {t('Swipe to see all 5 stages', 'সবগুলো স্টেজ দেখতে স্ক্রল করুন', lang)}
            </span>
            <span className="badge info">{filteredLicenses.length} {t('Active Filings', 'টি বিধিবদ্ধ নথি', lang)}</span>
          </div>
        </div>

        <div className="card-body">
          <div className="kanban" style={{ scrollSnapType: 'x mandatory' }}>
            {STAGES.map(stage => {
              const stageLicenses = filteredLicenses.filter(l => l.stage === stage.id);
              return (
                <div key={stage.id} className="kanban-col" style={{ scrollSnapAlign: 'start', minWidth: '240px' }}>
                  <div className={`kanban-col-hd stage-${stage.id}`} style={{ borderBottom: `2px solid ${stage.color}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: stage.color }} />
                      <h4 style={{ margin: 0, fontSize: '12px' }}>{t(stage.title, stage.titleBn, lang)}</h4>
                    </div>
                    <span className="kanban-count" style={{ background: stage.badgeColor, color: stage.textColor, borderColor: 'transparent' }}>
                      {stageLicenses.length}
                    </span>
                  </div>
                  <div className="kanban-cards">
                    {stageLicenses.map(lic => {
                      const isUrgent = lic.daysLeft <= 30;
                      const isWarn = lic.daysLeft > 30 && lic.daysLeft <= 90;
                      return (
                        <div
                          key={lic.id}
                          className="k-card"
                          onClick={() => setSelectedLicense(lic)}
                          style={{
                            borderLeft: isUrgent ? '4px solid var(--status-danger)' : isWarn ? '4px solid var(--status-warning)' : '4px solid var(--status-success)',
                            cursor: 'pointer',
                            position: 'relative',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <span className={`k-tag ${lic.tag}`}>{lic.tagLabel}</span>
                            <span className={`k-countdown ${isUrgent ? 'urgent' : isWarn ? 'warning' : 'ok'}`} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {isUrgent && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--status-danger-solid)', animation: 'pulse 1.5s infinite' }} />}
                              {lic.daysLeft <= 0 ? t('EXPIRED', 'মেয়াদোত্তীর্ণ', lang) : t(`${lic.daysLeft}d left`, `${lic.daysLeft} দিন বাকি`, lang)}
                            </span>
                          </div>

                          <div className="k-title" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--brand-slate-900)' }}>
                            {t(lic.title, lic.titleBn, lang)}
                          </div>

                          <div className="k-meta">
                            <div style={{ color: 'var(--brand-slate-800)', fontWeight: 600 }}>{t(lic.agency, lic.agencyBn, lang)}</div>
                            <div style={{ fontFamily: 'monospace', fontSize: '10px', color: 'var(--brand-slate-500)', marginTop: '2px' }}>
                              {lic.refNo}
                            </div>
                            <div style={{ marginTop: '5px', color: 'var(--brand-slate-600)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <User size={12} color="var(--brand-slate-400)" />
                              <span>{lic.focalPerson}</span>
                            </div>
                          </div>

                          {(canManage || (lic.daysLeft <= 30 && canDraftLetter)) && (
                          <div className="k-footer" style={{ paddingTop: '8px' }}>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              {canManage && lic.stage > 1 && (
                                <button
                                  className="btn-sm-ghost"
                                  style={{ padding: '3px 8px', fontSize: '10.5px', display: 'inline-flex', alignItems: 'center', gap: '2px' }}
                                  onClick={(e) => { e.stopPropagation(); moveLicense(lic.id, -1); }}
                                  title="Return to previous stage"
                                >
                                  <ArrowLeft size={11} /> {t('Back', 'পূর্ববর্তী', lang)}
                                </button>
                              )}
                              {canManage && lic.stage < 5 && (
                                <button
                                  className="btn-sm-ghost"
                                  style={{ padding: '3px 8px', fontSize: '10.5px', display: 'inline-flex', alignItems: 'center', gap: '2px', color: 'var(--status-info)' }}
                                  onClick={(e) => { e.stopPropagation(); moveLicense(lic.id, 1); }}
                                  title="Advance to next stage"
                                >
                                  {t('Next', 'পরবর্তী', lang)} <ArrowRight size={11} />
                                </button>
                              )}
                            </div>

                            {lic.daysLeft <= 30 && canDraftLetter && (
                              <button
                                className="btn-outline-danger"
                                style={{ padding: '3px 8px', fontSize: '10.5px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                onClick={(e) => { e.stopPropagation(); handleOpenDoLetter(lic); }}
                              >
                                <FileText size={11} /> {t('DO Letter', 'ডিও লেটার', lang)}
                              </button>
                            )}
                          </div>
                          )}
                        </div>
                      );
                    })}

                    {stageLicenses.length === 0 && (
                      <div style={{ padding: '32px 10px', textAlign: 'center', color: 'var(--brand-slate-400)', fontSize: '11.5px', border: '1px dashed var(--brand-slate-200)', borderRadius: 'var(--radius-sm)' }}>
                        {t('No filings in this stage', 'এই ধাপে কোনো আবেদন নেই', lang)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tank inspection log */}
      <div className="card mb-4">
        <div className="card-hd">
          <div className="card-hd-left">
            <div className="card-hd-icon"><Flame size={16} /></div>
            <div>
              <div className="card-title">{t('Storage Tank Inspection Log (API 653)', 'স্টোরেজ ট্যাংক পরিদর্শন লগ (এপিআই ৬৫৩)', lang)}</div>
              <div className="card-subtitle">{t('Latest wall-thickness and relief-valve test results recorded by the inspection team', 'পরিদর্শন দলের সর্বশেষ ওয়াল পুরুত্ব ও রিলিফ ভালভ পরীক্ষার ফলাফল', lang)}</div>
            </div>
          </div>
          <span className="badge warn">{t('1 retest due', '১টি পুনঃপরীক্ষা বাকি', lang)}</span>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="doc-table">
              <thead>
                <tr>
                  <th>{t('Tank', 'ট্যাংক', lang)}</th>
                  <th>{t('Product / Capacity', 'পণ্য / ধারণক্ষমতা', lang)}</th>
                  <th>{t('Wall Thickness', 'ওয়াল পুরুত্ব', lang)}</th>
                  <th>{t('Relief Valve Test', 'রিলিফ ভালভ পরীক্ষা', lang)}</th>
                  <th>{t('Status', 'অবস্থা', lang)}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>TK-101</strong></td>
                  <td>Bitumen 60/70 (5,000 MT)</td>
                  <td>12.4 mm ({t('nominal', 'নির্ধারিত', lang)} 12.5)</td>
                  <td><span className="badge success">{t('Passed 10 Sep', 'উত্তীর্ণ ১০ সেপ্ট', lang)}</span></td>
                  <td><span className="badge success">{t('In service', 'চালু', lang)}</span></td>
                </tr>
                <tr>
                  <td><strong>TK-102</strong></td>
                  <td>Bitumen 80/100 (5,000 MT)</td>
                  <td>12.1 mm ({t('nominal', 'নির্ধারিত', lang)} 12.5)</td>
                  <td><span className="badge success">{t('Passed 10 Sep', 'উত্তীর্ণ ১০ সেপ্ট', lang)}</span></td>
                  <td><span className="badge success">{t('In service', 'চালু', lang)}</span></td>
                </tr>
                <tr style={{ background: 'var(--status-warning-bg)' }}>
                  <td><strong>TK-201</strong></td>
                  <td>Emulsion SS-1 (2,000 MT)</td>
                  <td>11.2 mm ({t('threshold', 'সীমা', lang)} 10.8)</td>
                  <td><span className="badge warn">{t('Retest overdue (20 Oct)', 'পুনঃপরীক্ষা বাকি (২০ অক্টো)', lang)}</span></td>
                  <td><span className="badge warn">{t('Monitoring', 'পর্যবেক্ষণে', lang)}</span></td>
                </tr>
                <tr>
                  <td><strong>TK-202</strong></td>
                  <td>Cutback RC-70 (2,000 MT)</td>
                  <td>12.3 mm ({t('nominal', 'নির্ধারিত', lang)} 12.5)</td>
                  <td><span className="badge success">{t('Passed 04 Oct', 'উত্তীর্ণ ০৪ অক্টো', lang)}</span></td>
                  <td><span className="badge success">{t('In service', 'চালু', lang)}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Ministry Licensing Dossier & Audit Inspection Modal */}
      {selectedLicense && (
        <div className="modal-bg" onClick={() => setSelectedLicense(null)}>
          <div className="modal" style={{ maxWidth: '780px', width: '95%' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-hd" style={{ background: 'linear-gradient(135deg, var(--surface-inverse-2) 0%, var(--surface-inverse) 100%)', color: 'var(--text-on-brand)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '8px', borderRadius: '6px' }}>
                  <Building size={20} color="var(--status-warning-bright)" />
                </div>
                <div>
                  <h3 style={{ color: 'var(--text-on-brand)', margin: 0, fontSize: '16px', fontWeight: 800 }}>
                    {t(selectedLicense.title, selectedLicense.titleBn, lang)}
                  </h3>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {selectedLicense.agency} • Ref: <span style={{ fontFamily: 'monospace', color: 'var(--text-inverse-2)' }}>{selectedLicense.refNo}</span>
                  </div>
                </div>
              </div>
              <button className="modal-close" style={{ color: 'var(--text-on-brand)' }} onClick={() => setSelectedLicense(null)}>×</button>
            </div>

            <div className="modal-body" style={{ maxHeight: '76vh', overflowY: 'auto', padding: '20px' }}>
              {/* Summary 4-Metrics Strip */}
              <div className="responsive-col-4" style={{ gap: '10px', marginBottom: '18px' }}>
                <div style={{ background: 'var(--surface-0)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-1)' }}>
                  <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-500)', textTransform: 'uppercase', fontWeight: 700 }}>{t('Statutory Law', 'প্রযোজ্য আইন', lang)}</div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-slate-900)', marginTop: '2px', lineHeight: 1.3 }}>{selectedLicense.sroLawRef}</div>
                </div>

                <div style={{ background: 'var(--surface-0)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-1)' }}>
                  <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-500)', textTransform: 'uppercase', fontWeight: 700 }}>{t('Renewal Fee', 'নবায়ন ফি', lang)}</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--status-success)', marginTop: '2px' }}>{selectedLicense.feeAmountTk}</div>
                </div>

                <div style={{ background: 'var(--surface-0)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-1)' }}>
                  <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-500)', textTransform: 'uppercase', fontWeight: 700 }}>{t('Days to Expiry', 'মেয়াদ শেষ হতে', lang)}</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: selectedLicense.daysLeft <= 30 ? 'var(--status-danger)' : 'var(--status-warning)', marginTop: '2px' }}>
                    {selectedLicense.daysLeft} {t('days', 'দিন', lang)}
                  </div>
                </div>

                <div style={{ background: 'var(--surface-0)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-1)' }}>
                  <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-500)', textTransform: 'uppercase', fontWeight: 700 }}>{t('Validity', 'মেয়াদ', lang)}</div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--brand-slate-900)', marginTop: '2px' }}>{selectedLicense.certificateValidity}</div>
                </div>
              </div>

              {/* Statutory Non-Compliance Penalty Alert */}
              <div style={{
                background: 'var(--status-danger-bg)',
                border: '1px solid var(--status-danger-bright)',
                borderRadius: '8px',
                padding: '12px 14px',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px'
              }}>
                <ShieldAlert size={18} color="var(--status-danger)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '12px', lineHeight: 1.5 }}>
                  <strong style={{ color: 'var(--status-danger-text)' }}>{t('Statutory Non-Compliance Penalty Exposure:', 'বিধিবদ্ধ আইন অমান্যের সম্ভাব্য দণ্ড ও ঝুঁকি:', lang)}</strong>
                  <div style={{ color: 'var(--status-danger-text)', marginTop: '2px' }}>
                    {t(selectedLicense.statutoryPenalty, selectedLicense.statutoryPenaltyBn, lang)}
                  </div>
                </div>
              </div>

              {/* Inspector & Government Vetting Dossier */}
              <div style={{
                background: 'var(--surface-2)',
                padding: '12px 14px',
                borderRadius: '8px',
                marginBottom: '18px',
                display: 'flex',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)', fontWeight: 700, textTransform: 'uppercase' }}>
                    {t('Assigned Ministry Inspector', 'দায়িত্বপ্রাপ্ত সরকারি পরিদর্শক', lang)}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--brand-slate-900)', marginTop: '2px' }}>
                    {selectedLicense.inspectorName}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--brand-slate-600)' }}>
                    {selectedLicense.inspectorDesignation}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)', fontWeight: 700, textTransform: 'uppercase' }}>
                    {t('Internal Focal Engineer', 'অভ্যন্তরীণ দায়িত্বপ্রাপ্ত কর্মকর্তা', lang)}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--brand-slate-900)', marginTop: '2px' }}>
                    {selectedLicense.focalPerson}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--brand-slate-600)' }}>
                    {selectedLicense.focalDesignation}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)', fontWeight: 700, textTransform: 'uppercase' }}>
                    {t('Last Physical Site Inspection', 'সর্বশেষ সরেজমিন পরিদর্শন', lang)}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--status-info)', marginTop: '2px' }}>
                    {selectedLicense.lastInspection}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--brand-slate-600)' }}>
                    Valid: {selectedLicense.certificateValidity}
                  </div>
                </div>
              </div>

              {/* Pipeline Stage Visual Stepper */}
              <div style={{ marginBottom: '18px', background: 'var(--surface-0)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--brand-slate-900)' }}>
                    {t('Regulatory Approval Life-Cycle Progress:', 'অনুমোদন ও নবায়ন অগ্রগতির ধাপ:', lang)}
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: STAGES[selectedLicense.stage - 1].color }}>
                    {t(`Stage ${selectedLicense.stage} of 5`, `ধাপ ${selectedLicense.stage} / ৫`, lang)}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {STAGES.map(s => {
                    const isCurrent = s.id === selectedLicense.stage;
                    const isPassed = s.id < selectedLicense.stage;
                    return (
                      <div
                        key={s.id}
                        style={{
                          flex: '1 1 120px',
                          padding: '8px 6px',
                          textAlign: 'center',
                          fontSize: '11px',
                          borderRadius: '6px',
                          background: isCurrent ? s.color : isPassed ? 'var(--status-success)' : 'var(--text-inverse)',
                          color: isCurrent || isPassed ? 'var(--text-on-brand)' : 'var(--text-3)',
                          fontWeight: isCurrent ? 800 : 600,
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px'
                        }}
                      >
                        {isPassed && <Check size={12} />}
                        {isCurrent && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--surface-1)' }} />}
                        <span>{s.id}. {t(s.title.split('. ')[1], s.titleBn.split('. ')[1], lang)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Mandatory Statutory Audit Verification Checklist */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--brand-slate-900)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckSquare size={16} color="var(--brand-crimson)" />
                    {t('Mandatory Statutory Audit Checklist:', 'বাধ্যতামূলক বিধিবদ্ধ অডিট চেকলিস্ট:', lang)}
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--brand-slate-500)' }}>
                    {selectedLicense.auditChecklist.filter(c => c.passed).length} / {selectedLicense.auditChecklist.length} {t('Items Verified', 'টি যাচাই সম্পন্ন', lang)}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedLicense.auditChecklist.map((c, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 14px',
                        background: c.passed ? 'var(--status-success-bg)' : 'var(--status-warning-bg)',
                        border: c.passed ? '1px solid var(--status-success-border)' : '1px solid var(--status-warning-bright)',
                        borderRadius: '6px',
                        cursor: canManage ? 'pointer' : 'default',
                        transition: 'all 0.15s ease'
                      }}
                      onClick={() => toggleChecklistItem(idx)}
                    >
                      <input
                        type="checkbox"
                        checked={c.passed}
                        disabled={!canManage}
                        onChange={() => {}}
                        style={{ cursor: canManage ? 'pointer' : 'default', width: '16px', height: '16px', accentColor: 'var(--status-success-solid)' }}
                      />
                      <span style={{ fontSize: '12.5px', color: c.passed ? 'var(--status-success-text)' : 'var(--status-warning-text)', flex: 1, fontWeight: 500 }}>
                        {t(c.item, c.itemBn ?? c.item, lang)}
                      </span>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: c.passed ? 'var(--status-success-bg)' : 'var(--status-warning-bg)',
                        color: c.passed ? 'var(--status-success)' : 'var(--status-warning)'
                      }}>
                        {c.passed ? t('VERIFIED', 'যাচাইকৃত', lang) : t('ACTION REQUIRED', 'পদক্ষেপ প্রয়োজন', lang)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Digital Certificate & Evidence Vault */}
              <div>
                <div style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--brand-slate-900)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileBadge size={16} color="var(--brand-gold-dark)" />
                  {t('Digital Certificate & Inspection Evidence Vault:', 'ডিজিটাল সনদ ও পরিদর্শন নথি ভল্ট:', lang)}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedLicense.documents.map((doc, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        background: 'var(--surface-0)',
                        border: '1px solid var(--border-1)',
                        borderRadius: '6px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ background: 'var(--status-danger-bg)', color: 'var(--status-danger-text)', padding: '6px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 800 }}>
                          PDF
                        </div>
                        <div>
                          <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--brand-slate-900)' }}>{doc.name}</div>
                          <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-500)' }}>
                            {doc.type} • {doc.size} • Uploaded: {doc.date}
                          </div>
                        </div>
                      </div>
                      <button
                        className="btn-sm-ghost"
                        style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px' }}
                        onClick={() => showToast(t(`Downloaded official certificate: ${doc.name}`, `নথি ডাউনলোড সম্পন্ন হয়েছে: ${doc.name}`, lang), 'success')}
                      >
                        <Download size={13} /> {t('Download', 'ডাউনলোড', lang)}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-ft" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              {canDraftLetter ? (
                <button
                  className="btn-gold"
                  style={{ fontSize: '12px', padding: '7px 16px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  onClick={() => {
                    setSelectedLicense(null);
                    handleOpenDoLetter(selectedLicense);
                  }}
                >
                  <FileText size={14} />
                  {t('Prepare DO Letter', 'ডিও লেটার প্রস্তুত করুন', lang)}
                </button>
              ) : <span />}

              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn-sm-ghost" onClick={() => setSelectedLicense(null)}>
                  {t('Close', 'বন্ধ করুন', lang)}
                </button>
                {canManage && selectedLicense.stage < 5 && (
                  <button
                    className="btn-primary"
                    style={{ fontSize: '12px', padding: '7px 16px' }}
                    onClick={() => {
                      moveLicense(selectedLicense.id, 1);
                      setSelectedLicense(prev => prev ? { ...prev, stage: prev.stage + 1 } : null);
                    }}
                  >
                    <ArrowRight size={14} />
                    {t('Advance to Next Stage', 'পরবর্তী ধাপে স্থানান্তর', lang)}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Universal Demi-Official (DO) Letter Modal to Ministry */}
      {showDoLetterModal && (
        <div className="modal-bg" onClick={() => setShowDoLetterModal(null)}>
          <div className="modal" style={{ maxWidth: '720px', width: '95%' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-hd" style={{ background: 'var(--brand-crimson-dark)', color: 'var(--text-on-brand)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: 'rgba(255,255,255,0.15)', padding: '6px', borderRadius: '6px' }}>
                  <FileText size={18} color="var(--status-warning-bright)" />
                </div>
                <div>
                  <h3 style={{ color: 'var(--text-on-brand)', margin: 0, fontSize: '15px', fontWeight: 800 }}>
                    {t('Demi-Official (DO) Expedited Clearance Letter', 'জরুরি ডিও লেটার ড্রাফট ও প্রেরণ', lang)}
                  </h3>
                  <div style={{ fontSize: '11px', color: 'var(--status-danger-bright)', marginTop: '2px' }}>
                    {t("Office of the Chairman & Managing Director • Bashundhara Group", "চেয়ারম্যানের নির্বাহী দপ্তর • বসুন্ধরা গ্রুপ", lang)}
                  </div>
                </div>
              </div>
              <button className="modal-close" style={{ color: 'var(--text-on-brand)' }} onClick={() => setShowDoLetterModal(null)}>×</button>
            </div>

            <div className="modal-body" style={{ maxHeight: '74vh', overflowY: 'auto', padding: '20px' }}>
              {/* Delivery Channel Selector */}
              <div style={{ marginBottom: '14px', background: 'var(--surface-0)', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--border-1)' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-slate-600)', marginBottom: '6px' }}>
                  {t('Select Official Dispatch Channel:', 'সরকারি প্রেরণ মাধ্যম নির্বাচন করুন:', lang)}
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {[
                    { id: 'enothi', label: 'Govt e-Nothi Encrypted Dispatch', labelBn: 'সরকারি ই-নথি এনক্রিপ্টেড প্রেরণ' },
                    { id: 'courier', label: 'Confidential Sealed Diplomatic Courier', labelBn: 'গোপনীয় সিলগালা কুরিয়ার' },
                    { id: 'liaison', label: 'Executive Liaison Hand-Delivery', labelBn: 'বিশেষ প্রতিনিধির মাধ্যমে সরাসরি প্রদান' },
                  ].map(c => (
                    <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', cursor: 'pointer', color: 'var(--brand-slate-800)' }}>
                      <input
                        type="radio"
                        name="deliveryMode"
                        checked={doLetterDeliveryMode === c.id}
                        onChange={() => setDoLetterDeliveryMode(c.id as any)}
                        style={{ accentColor: 'var(--brand-crimson-dark)' }}
                      />
                      <span>{t(c.label, c.labelBn, lang)}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Official Letterhead Simulation */}
              <div style={{
                border: '2px solid var(--border-1)',
                padding: '24px',
                borderRadius: '6px',
                background: 'var(--surface-1)',
                fontSize: '12.5px',
                lineHeight: 1.6,
                boxShadow: 'var(--shadow-xs)',
                position: 'relative'
              }}>
                {/* Official Letterhead Crest */}
                <div style={{ textAlign: 'center', borderBottom: '2px solid var(--brand-crimson-dark)', paddingBottom: '12px', marginBottom: '16px' }}>
                  <div style={{ fontWeight: 900, fontSize: '16px', color: 'var(--brand-crimson-dark)', letterSpacing: '0.8px' }}>
                    BASHUNDHARA GROUP
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-1)', marginTop: '2px' }}>
                    OFFICE OF THE CHAIRMAN & MANAGING DIRECTOR
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: '2px' }}>
                    Corporate HQ, Plot-3, Block-G, Umme Kulsum Road, Bashundhara R/A, Dhaka-1229, Bangladesh
                  </div>
                </div>

                {/* References & Date */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px', fontSize: '11.5px' }}>
                  <div>
                    <strong>DO Memo No:</strong> BOGCL/CMD-DO/{showDoLetterModal.tag.toUpperCase()}-2026/089<br />
                    <strong>License Ref:</strong> <span style={{ fontFamily: 'monospace' }}>{showDoLetterModal.refNo}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <strong>Date:</strong> 29 October 2026<br />
                    <span style={{ fontSize: '10.5px', color: 'var(--status-danger)', fontWeight: 700 }}>PRIORITY: IMMEDIATE EXPEDITE</span>
                  </div>
                </div>

                {/* Ministry Recipient */}
                <div style={{ marginBottom: '14px' }}>
                  <strong>To:</strong><br />
                  <strong>{showDoLetterModal.ministryRecipient}</strong><br />
                  <span style={{ color: 'var(--text-2)' }}>{showDoLetterModal.ministryAddress}</span>
                </div>

                {/* Subject Line */}
                <div style={{
                  fontWeight: 800,
                  marginBottom: '12px',
                  color: 'var(--text-1)',
                  background: 'var(--surface-0)',
                  padding: '8px 10px',
                  borderRadius: '4px',
                  borderLeft: '4px solid var(--brand-crimson-dark)'
                }}>
                  SUBJECT: REQUEST FOR EXPEDITIOUS ISSUANCE OF STATUTORY RENEWAL FOR {showDoLetterModal.title.toUpperCase()} — KERANIGANJ REFINERY & TANK FARM COMPLEX.
                </div>

                {/* Letter Body */}
                <div style={{ color: 'var(--text-2)', textAlign: 'justify' }}>
                  Dear Sir,<br /><br />
                  Greetings from Bashundhara Oil & Gas Company Limited (BOGCL).<br /><br />
                  I have the honor to bring to your kind notice that all mandatory statutory safety audits, engineering validations, and technical inspection requisites for the subject filing (<strong>{showDoLetterModal.refNo}</strong>) have been executed with 100% compliance in accordance with the <strong>{showDoLetterModal.sroLawRef}</strong>.<br /><br />
                  As you are well aware, our Keraniganj Bitumen & Hydrocarbon complex serves as the sovereign national backbone supplying specialized bitumen grades (BDS 1238) to national priority mega-projects, including the Bangabandhu Expressway, Dhaka-Sylhet 4-lane highway expansion, and Roads & Highways Department (RHD) infrastructure nationwide.<br /><br />
                  Any procedural hiatus in the final renewal vetting risks a statutory plant operational halt, generating an estimated industrial loss of <strong>{showDoLetterModal.dailyShutdownRiskTk}</strong> and disrupting essential national construction timelines.<br /><br />
                  In view of the complete technical clearance documented herein, I most respectfully solicit your personal directive to your esteemed division to issue the formal renewal certificate without delay.
                </div>

                {/* Official Signature Block */}
                <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{ textAlign: 'center', width: '220px' }}>
                    {/* Digital Seal Watermark */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px dashed var(--status-danger)',
                      borderRadius: '50%',
                      width: '64px',
                      height: '64px',
                      color: 'var(--status-danger)',
                      fontSize: '9px',
                      fontWeight: 800,
                      transform: 'rotate(-10deg)',
                      margin: '0 auto 6px auto'
                    }}>
                      BOGCL<br />SEAL
                    </div>
                    <div style={{ fontWeight: 800, color: 'var(--text-1)', fontSize: '13px' }}>Ahmed Akbar Sobhan</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>Chairman & Managing Director</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-3)' }}>Bashundhara Group</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-ft" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button className="btn-sm-ghost" onClick={() => setShowDoLetterModal(null)}>
                {t('Cancel', 'বাতিল', lang)}
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn-outline"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px' }}
                  onClick={() => showToast(t('DO Letter sent to executive network printer.', 'ডিও লেটার প্রিন্টারে পাঠানো হয়েছে।', lang), 'info')}
                >
                  <Printer size={13} /> {t('Print Letter', 'প্রিন্ট', lang)}
                </button>
                <button
                  className="btn-gold"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800 }}
                  onClick={() => {
                    showToast(
                      canDispatch
                        ? t(`DO Letter signed and sent via ${doLetterDeliveryMode === 'enothi' ? 'e-Nothi' : doLetterDeliveryMode === 'courier' ? 'courier' : 'executive liaison'} to ${showDoLetterModal.agency}.`, `ডিও লেটার স্বাক্ষর করে ${showDoLetterModal.agencyBn}-এ পাঠানো হয়েছে।`, lang)
                        : t("Draft sent to the Chairman's Office for signature.", 'স্বাক্ষরের জন্য খসড়া চেয়ারম্যানের দপ্তরে পাঠানো হয়েছে।', lang),
                      'gold'
                    );
                    setShowDoLetterModal(null);
                  }}
                >
                  <Send size={14} />
                  {canDispatch
                    ? t('Sign & Send', 'স্বাক্ষর করে পাঠান', lang)
                    : t('Send to Chairman for Signature', 'স্বাক্ষরের জন্য চেয়ারম্যানের কাছে পাঠান', lang)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

