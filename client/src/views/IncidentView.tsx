import React, { useState } from 'react';
import { ViewProps, t } from '../types';
import { showToast } from '../App';
import {
  AlertTriangle, ShieldAlert, CheckCircle, Clock, Flame,
  FileText, Plus, Eye, Zap, ShieldCheck, Activity, Camera,
  HelpCircle, ChevronRight, Siren, Download, Share2, Filter,
  Check, ArrowRight, UserCheck, AlertOctagon, Send
} from 'lucide-react';

interface IncidentItem {
  id: string;
  incNo: string;
  title: string;
  titleBn: string;
  category: 'spill' | 'pressure' | 'fire' | 'near_miss' | 'electrical';
  level: 1 | 2 | 3 | 4 | 5;
  location: string;
  reportedBy: string;
  date: string;
  rootCause: string;
  capaAction: string;
  capaOwner: string;
  capaStatus: 'open' | 'in_progress' | 'closed';
  statutoryReportable: boolean; // DoE / Explosives report
  fiveWhys?: {
    why1: string;
    why2: string;
    why3: string;
    why4: string;
    why5: string;
    fishboneCategory: 'Machine' | 'Method' | 'Material' | 'Man' | 'Measurement' | 'Environment';
  };
  evidenceAttached?: boolean;
}

const INITIAL_INCIDENTS: IncidentItem[] = [
  {
    id: 'INC-01',
    incNo: 'BOGCL-HSE-2026-041',
    title: 'Minor Bitumen Residue Weepage at Tank #TK-201 Bottom Flange',
    titleBn: 'ট্যাংক #TK-201 এর নিচের ফ্ল্যাঞ্জে সামান্য বিটুমিন নিঃসরণ',
    category: 'spill',
    level: 3,
    location: 'Tank Farm Zone-B, Keraniganj Plant',
    reportedBy: 'Engr. Tariq Ahmed (Maintenance)',
    date: '15 Oct 2026, 11:20 AM',
    rootCause: 'High-temperature thermal expansion caused gasket elasticity degradation on 4-inch drain valve.',
    capaAction: 'Isolate line, drain remnant asphalt, replace with spiral-wound graphite gasket and torque to 180 Nm.',
    capaOwner: 'Maintenance Division',
    capaStatus: 'in_progress',
    statutoryReportable: true,
    evidenceAttached: true,
    fiveWhys: {
      why1: 'Why did bitumen seep from flange? Gasket seal failed to maintain compression.',
      why2: 'Why did the gasket fail? Compressed fiber material hardened under 180°C continuous asphalt holding.',
      why3: 'Why was that material used? Procurement substitute installed during previous turnaround.',
      why4: 'Why was substitute installed without MOC? Urgent stockout forced local requisition.',
      why5: 'Root Cause: Management of Change (MOC) process bypassed without chemical compatibility sign-off.',
      fishboneCategory: 'Material',
    },
  },
  {
    id: 'INC-02',
    incNo: 'BOGCL-HSE-2026-039',
    title: 'Near-Miss: Contractor Scaffold Clamps Unsecured Near Gas Flare Stack',
    titleBn: 'নিয়ার-মিস: গ্যাস ফ্লেয়ার স্ট্যাকের কাছে অসংরক্ষিত মাচা',
    category: 'near_miss',
    level: 2,
    location: 'Flare Header Elevation +14m',
    reportedBy: 'Farhana Kabir (EHS Lead)',
    date: '13 Oct 2026, 03:45 PM',
    rootCause: 'Third-party scaffolding vendor skipped daily pre-shift tag inspection checklist.',
    capaAction: 'Issued work-stop notice. Suspended contractor pass for 3 days until full retraining is completed.',
    capaOwner: 'Safety Inspection Team',
    capaStatus: 'closed',
    statutoryReportable: false,
    evidenceAttached: true,
    fiveWhys: {
      why1: 'Why were clamps loose? Scaffolder did not use calibrated torque wrench.',
      why2: 'Why was wrench not used? Tool was left in contractor truck outside gate.',
      why3: 'Why did supervisor allow work to proceed? Shift supervisor rushed to beat afternoon rain.',
      why4: 'Why was there schedule pressure? Flare stack inspection window was restricted to 4 hours.',
      why5: 'Root Cause: Contractor supervisory oversight lacking daily Permit-to-Work (PTW) checklist audit.',
      fishboneCategory: 'Method',
    },
  },
  {
    id: 'INC-03',
    incNo: 'BOGCL-HSE-2026-036',
    title: 'Electrical Trip on Emulsion Agitator Motor #M-04 during Heavy Surge',
    titleBn: 'ইমালসিফায়ার মিক্সার মোটর #M-04 এ বৈদ্যুতিক ট্রিপ',
    category: 'electrical',
    level: 2,
    location: 'Chemical Blending Unit #1',
    reportedBy: 'Mahbub Alam (Electrical Engr)',
    date: '10 Oct 2026, 06:10 PM',
    rootCause: 'Substation relay calibration drift caused premature earth leakage trip.',
    capaAction: 'Relay recalibrated and insulation megger test recorded 120 M-ohms (Passed).',
    capaOwner: 'Electrical Department',
    capaStatus: 'closed',
    statutoryReportable: false,
    evidenceAttached: false,
  },
  {
    id: 'INC-04',
    incNo: 'BOGCL-HSE-2026-031',
    title: 'High Pressure Alarm Triggered on Hydro-Testing Bypass Line',
    titleBn: 'হাইড্রো-টেস্টিং বাইপাস পাইপলাইনে অতিরিক্ত চাপ সংকেত',
    category: 'pressure',
    level: 4,
    location: 'Hydro-Testing Bay #2',
    reportedBy: 'Dr. Rafiqul Huq (QC Head)',
    date: '06 Oct 2026, 02:15 PM',
    rootCause: 'Manual throttling valve jammed due to bituminous slurry buildup.',
    capaAction: 'Automatic safety pressure-relief interlock installed with SCADA audio buzzer.',
    capaOwner: 'Plant GM & Automation Team',
    capaStatus: 'closed',
    statutoryReportable: true,
    evidenceAttached: true,
  },
];

export default function IncidentView({ role, lang }: ViewProps) {
  const [incidents, setIncidents] = useState<IncidentItem[]>(INITIAL_INCIDENTS);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'spill' | 'pressure' | 'near_miss' | 'critical'>('all');
  
  // Modals
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedRcaIncident, setSelectedRcaIncident] = useState<IncidentItem | null>(null);
  const [selectedDossierIncident, setSelectedDossierIncident] = useState<IncidentItem | null>(null);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);

  // Form state for new incident
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<'spill' | 'pressure' | 'fire' | 'near_miss' | 'electrical'>('near_miss');
  const [formLevel, setFormLevel] = useState<1 | 2 | 3 | 4 | 5>(2);
  const [formLocation, setFormLocation] = useState('Keraniganj Tank Farm Series-B');
  const [formDescription, setFormDescription] = useState('');

  // 5-Whys Form State
  const [rcaWhy1, setRcaWhy1] = useState('');
  const [rcaWhy2, setRcaWhy2] = useState('');
  const [rcaWhy3, setRcaWhy3] = useState('');
  const [rcaWhy4, setRcaWhy4] = useState('');
  const [rcaWhy5, setRcaWhy5] = useState('');
  const [rcaCategory, setRcaCategory] = useState<'Machine' | 'Method' | 'Material' | 'Man' | 'Measurement' | 'Environment'>('Machine');

  const openRcaModal = (inc: IncidentItem) => {
    setSelectedRcaIncident(inc);
    setRcaWhy1(inc.fiveWhys?.why1 || `Why did the incident occur at ${inc.location}?`);
    setRcaWhy2(inc.fiveWhys?.why2 || '');
    setRcaWhy3(inc.fiveWhys?.why3 || '');
    setRcaWhy4(inc.fiveWhys?.why4 || '');
    setRcaWhy5(inc.fiveWhys?.why5 || '');
    setRcaCategory(inc.fiveWhys?.fishboneCategory || 'Machine');
  };

  const handleSaveRca = () => {
    if (!selectedRcaIncident) return;
    const updated = incidents.map(inc => {
      if (inc.id === selectedRcaIncident.id) {
        return {
          ...inc,
          rootCause: rcaWhy5 || rcaWhy4 || inc.rootCause,
          fiveWhys: {
            why1: rcaWhy1,
            why2: rcaWhy2,
            why3: rcaWhy3,
            why4: rcaWhy4,
            why5: rcaWhy5,
            fishboneCategory: rcaCategory,
          }
        };
      }
      return inc;
    });
    setIncidents(updated);
    setSelectedRcaIncident(null);
    showToast(t(
      `5-Whys Root Cause Analysis saved for ${selectedRcaIncident.incNo}. Audit ledger updated.`,
      `৫-হোয়াইজ মূল কারণ বিশ্লেষণ সংরক্ষিত হয়েছে (${selectedRcaIncident.incNo})।`,
      lang
    ), 'gold');
  };

  const handleCreateIncident = () => {
    if (!formTitle || !formDescription) {
      showToast(t('Please fill in title and description of the incident.', 'অনুগ্রহ করে শিরোনাম ও বিবরণ পূরণ করুন।', lang), 'info');
      return;
    }
    const newInc: IncidentItem = {
      id: `INC-0${incidents.length + 1}`,
      incNo: `BOGCL-HSE-2026-0${42 + incidents.length}`,
      title: formTitle,
      titleBn: formTitle,
      category: formCategory,
      level: formLevel,
      location: formLocation,
      reportedBy: role === 'plant_gm' ? 'Engr. Harunur Rashid (GM)' : 'Tanvir Ahmed (Staff)',
      date: '17 Oct 2026, Just Now',
      rootCause: 'Under active root-cause investigation by Plant EHS team.',
      capaAction: formDescription,
      capaOwner: 'EHS Investigation Committee',
      capaStatus: 'open',
      statutoryReportable: formLevel >= 3,
      evidenceAttached: false,
    };
    setIncidents([newInc, ...incidents]);
    setShowLogModal(false);
    setFormTitle('');
    setFormDescription('');
    showToast(t(`New HSE Incident logged: ${newInc.incNo}. Emergency response protocol initiated!`, `নতুন ইনসিডেন্ট রেকর্ড সম্পন্ন: ${newInc.incNo}। নিরাপত্তা প্রটোকল সক্রিয় করা হয়েছে!`, lang), 'gold');
  };

  const filteredIncidents = incidents.filter(inc => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'critical') return inc.level >= 3;
    return inc.category === selectedFilter;
  });

  return (
    <div>
      {/* View Header */}
      <div className="flex-between mb-4">
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--brand-slate-900)' }}>
            {t('EHS & Plant Incident Management Cockpit', 'পরিবেশ, স্বাস্থ্য ও নিরাপত্তা (ইএইচএস) ইনসিডেন্ট ককপিট', lang)}
          </h2>
          <p className="text-muted">
            {t('Zero-Harm Refinery Philosophy • 5x5 Petroleum Risk Matrix • 5-Whys RCA & Statutory Dossier Generator', 'শূন্য দুর্ঘটনা দর্শন • ৫x৫ পেট্রোলিয়াম ঝুঁকি ম্যাট্রিক্স • ৫-হোয়াইজ আরসিএ ও সরকারি ডসিয়ার', lang)}
          </p>
        </div>
        <div className="flex-gap">
          <button
            className="btn-outline-danger"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
            onClick={() => setShowEmergencyModal(true)}
          >
            <Siren size={15} color="#DC2626" />
            {t('Emergency Drill / Shutdown', 'জরুরি ড্রিল / শাটডাউন', lang)}
          </button>
          <button
            className="btn-primary"
            onClick={() => setShowLogModal(true)}
          >
            <Plus size={14} />
            {t('Report HSE Incident / Near-Miss', 'নতুন ঘটনা / নিয়ার-মিস রিপোর্ট', lang)}
          </button>
        </div>
      </div>

      {/* Safety Performance Metrics & Risk Matrix */}
      <div className="col-2 mb-5">
        {/* Severity Metrics */}
        <div className="card">
          <div className="card-hd">
            <div className="card-hd-left">
              <div className="card-hd-icon"><ShieldAlert size={18} /></div>
              <div>
                <div className="card-title">{t('HSE Safety Performance Metrics', 'নিরাপত্তা পারফরম্যান্স সূচক', lang)}</div>
                <div className="card-subtitle">{t('Days without Lost Time Injury (LTI)', 'কর্মবিরতিহীন নিরাপদ কর্মদিবস', lang)}</div>
              </div>
            </div>
            <span className="badge success">Target: 365 Days</span>
          </div>

          <div className="card-body">
            <div className="responsive-col-3" style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div style={{ background: '#ECFDF5', padding: '16px 10px', borderRadius: 'var(--radius-md)', border: '1px solid #A7F3D0' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 800, color: '#059669', lineHeight: 1 }}>284</div>
                <div style={{ fontSize: '11px', color: '#065F46', fontWeight: 700, marginTop: '4px' }}>
                  {t('Safe Days Without LTI', 'নিরাপদ কর্মদিবস', lang)}
                </div>
              </div>

              <div style={{ background: '#FFFBEB', padding: '16px 10px', borderRadius: 'var(--radius-md)', border: '1px solid #FDE68A' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 800, color: '#D97706', lineHeight: 1 }}>1</div>
                <div style={{ fontSize: '11px', color: '#92400E', fontWeight: 700, marginTop: '4px' }}>
                  {t('Active Investigation', 'চলমান তদন্ত', lang)}
                </div>
              </div>

              <div style={{ background: '#EFF6FF', padding: '16px 10px', borderRadius: 'var(--radius-md)', border: '1px solid #BFDBFE' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 800, color: '#1D4ED8', lineHeight: 1 }}>98.2%</div>
                <div style={{ fontSize: '11px', color: '#1E40AF', fontWeight: 700, marginTop: '4px' }}>
                  {t('CAPA Closure Rate', 'সমাধানের হার', lang)}
                </div>
              </div>
            </div>

            <div style={{ fontSize: '12px', color: 'var(--brand-slate-600)', background: 'var(--brand-slate-100)', padding: '10px 14px', borderRadius: 'var(--radius-sm)' }}>
              ⚡ <strong>Explosives Department SLA:</strong> Any hydrocarbon leak over 50 liters must be notified to Chief Inspector within 24 hours. Level-3 Incident #041 report generated and ready for Plant GM review.
            </div>
          </div>
        </div>

        {/* 5x5 Risk Matrix Graphic */}
        <div className="card">
          <div className="card-hd">
            <div className="card-hd-left">
              <div className="card-hd-icon"><Activity size={18} /></div>
              <div>
                <div className="card-title">{t('5x5 Petroleum Risk Matrix (AS/NZS 4360)', '৫x৫ পেট্রোলিয়াম ঝুঁকি ম্যাট্রিক্স', lang)}</div>
                <div className="card-subtitle">{t('Consequence Severity vs Occurrence Probability', 'ক্ষতির তীব্রতা বনাম পুনরাবৃত্তির সম্ভাবনা', lang)}</div>
              </div>
            </div>
            <span className="badge gold">ISO 45001 / OSHA</span>
          </div>

          <div className="card-body">
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '4px' }}>
              <div style={{ minWidth: '340px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px', textAlign: 'center', fontSize: '10px', fontWeight: 700 }}>
              {/* Row 5 Catastrophic */}
              <div style={{ background: '#FEF08A', padding: '8px 2px', borderRadius: '3px' }}>Low (5)</div>
              <div style={{ background: '#FDBA74', padding: '8px 2px', borderRadius: '3px' }}>Med (10)</div>
              <div style={{ background: '#F87171', padding: '8px 2px', borderRadius: '3px', color: '#fff' }}>High (15)</div>
              <div style={{ background: '#EF4444', padding: '8px 2px', borderRadius: '3px', color: '#fff' }}>Extreme (20)</div>
              <div style={{ background: '#991B1B', padding: '8px 2px', borderRadius: '3px', color: '#fff' }}>Critical (25)</div>

              {/* Row 4 Major */}
              <div style={{ background: '#BBF7D0', padding: '8px 2px', borderRadius: '3px' }}>Low (4)</div>
              <div style={{ background: '#FEF08A', padding: '8px 2px', borderRadius: '3px' }}>Low (8)</div>
              <div style={{ background: '#FDBA74', padding: '8px 2px', borderRadius: '3px' }}>Med (12)</div>
              <div style={{ background: '#F87171', padding: '8px 2px', borderRadius: '3px', color: '#fff', border: '2px solid #000' }}>★ Inc-031</div>
              <div style={{ background: '#EF4444', padding: '8px 2px', borderRadius: '3px', color: '#fff' }}>Extreme (20)</div>

              {/* Row 3 Moderate */}
              <div style={{ background: '#BBF7D0', padding: '8px 2px', borderRadius: '3px' }}>Low (3)</div>
              <div style={{ background: '#BBF7D0', padding: '8px 2px', borderRadius: '3px' }}>Low (6)</div>
              <div style={{ background: '#FDBA74', padding: '8px 2px', borderRadius: '3px', border: '2px solid #000' }}>★ Inc-041</div>
              <div style={{ background: '#F87171', padding: '8px 2px', borderRadius: '3px', color: '#fff' }}>High (12)</div>
              <div style={{ background: '#EF4444', padding: '8px 2px', borderRadius: '3px', color: '#fff' }}>Extreme (15)</div>

              {/* Row 2 Minor */}
              <div style={{ background: '#DCFCE7', padding: '8px 2px', borderRadius: '3px' }}>Negligible</div>
              <div style={{ background: '#BBF7D0', padding: '8px 2px', borderRadius: '3px', border: '2px solid #000' }}>★ Inc-039</div>
              <div style={{ background: '#BBF7D0', padding: '8px 2px', borderRadius: '3px' }}>Low (6)</div>
              <div style={{ background: '#FEF08A', padding: '8px 2px', borderRadius: '3px' }}>Med (8)</div>
              <div style={{ background: '#FDBA74', padding: '8px 2px', borderRadius: '3px' }}>Med (10)</div>

              {/* Row 1 Insignificant */}
              <div style={{ background: '#DCFCE7', padding: '8px 2px', borderRadius: '3px' }}>Negligible</div>
              <div style={{ background: '#DCFCE7', padding: '8px 2px', borderRadius: '3px' }}>Negligible</div>
              <div style={{ background: '#BBF7D0', padding: '8px 2px', borderRadius: '3px' }}>Low (3)</div>
              <div style={{ background: '#BBF7D0', padding: '8px 2px', borderRadius: '3px' }}>Low (4)</div>
              <div style={{ background: '#FEF08A', padding: '8px 2px', borderRadius: '3px' }}>Low (5)</div>
            </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '10.5px', color: 'var(--brand-slate-500)' }}>
              <span>Probability: Rare ➔ Almost Certain</span>
              <span>★ Active Plant Incidents Mapped</span>
            </div>
          </div>
        </div>
      </div>

      {/* Incident Log Cards */}
      <div className="card">
        <div className="card-hd">
          <div className="card-hd-left">
            <div className="card-hd-icon"><Flame size={18} /></div>
            <div>
              <div className="card-title">{t('Active Incident Registry & Corrective Action Log (CAPA)', 'ইনসিডেন্ট রেজিস্ট্রি ও সংশোধনমূলক ব্যবস্থা লগ', lang)}</div>
              <div className="card-subtitle">{incidents.length} {t('Incidents Logged in Fiscal Year 2026', 'টি ঘটনা নথিভুক্ত হয়েছে', lang)}</div>
            </div>
          </div>
          
          {/* Quick Filters */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              className={`btn-sm-ghost ${selectedFilter === 'all' ? 'active-filter' : ''}`}
              style={{ fontSize: '11px', background: selectedFilter === 'all' ? 'var(--brand-slate-200)' : 'transparent' }}
              onClick={() => setSelectedFilter('all')}
            >
              {t('All', 'সব', lang)} ({incidents.length})
            </button>
            <button
              className={`btn-sm-ghost ${selectedFilter === 'critical' ? 'active-filter' : ''}`}
              style={{ fontSize: '11px', color: '#DC2626', background: selectedFilter === 'critical' ? '#FEE2E2' : 'transparent' }}
              onClick={() => setSelectedFilter('critical')}
            >
              ⚠️ {t('Level 3+', 'তীব্র', lang)}
            </button>
            <button
              className={`btn-sm-ghost ${selectedFilter === 'spill' ? 'active-filter' : ''}`}
              style={{ fontSize: '11px', background: selectedFilter === 'spill' ? 'var(--brand-slate-200)' : 'transparent' }}
              onClick={() => setSelectedFilter('spill')}
            >
              {t('Spills', 'নিঃসরণ', lang)}
            </button>
            <button
              className={`btn-sm-ghost ${selectedFilter === 'near_miss' ? 'active-filter' : ''}`}
              style={{ fontSize: '11px', background: selectedFilter === 'near_miss' ? 'var(--brand-slate-200)' : 'transparent' }}
              onClick={() => setSelectedFilter('near_miss')}
            >
              {t('Near Miss', 'নিয়ার-মিস', lang)}
            </button>
          </div>
        </div>

        <div className="card-body">
          <div className="incident-list">
            {filteredIncidents.map((inc) => (
              <div key={inc.id} className={`incident-card l${inc.level}`}>
                <div className="inc-hd">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span className={`badge ${inc.level >= 4 ? 'danger' : inc.level === 3 ? 'warn' : 'info'}`}>
                      Level {inc.level} — {inc.category.toUpperCase()}
                    </span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '11px', color: 'var(--brand-slate-500)' }}>
                      {inc.incNo}
                    </span>
                    {inc.statutoryReportable && (
                      <span className="badge danger">
                        ⚠️ {t('Statutory Reportable (DoE/Explosives)', 'বিধিবদ্ধ রিপোর্টযোগ্য', lang)}
                      </span>
                    )}
                    {inc.fiveWhys && (
                      <span className="badge gold">
                        ✓ 5-Whys RCA Completed ({inc.fiveWhys.fishboneCategory})
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--brand-slate-400)' }}>{inc.date}</span>
                </div>

                <div className="inc-title">{t(inc.title, inc.titleBn, lang)}</div>
                <div className="inc-meta">
                  📍 {inc.location} • Reported by: <strong>{inc.reportedBy}</strong>
                </div>

                <div style={{ background: 'var(--brand-slate-100)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', marginBottom: '12px', fontSize: '12px' }}>
                  <div style={{ marginBottom: '6px' }}>
                    <strong>Root Cause:</strong> {inc.rootCause}
                  </div>
                  <div>
                    <strong>Corrective & Preventive Action (CAPA):</strong> {inc.capaAction}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div className="inc-capa">
                    <span>CAPA Owner: <strong>{inc.capaOwner}</strong></span>
                    <span style={{ marginLeft: '12px' }}>
                      Status:{' '}
                      <span className={`badge ${inc.capaStatus === 'closed' ? 'success' : 'warn'}`}>
                        {inc.capaStatus === 'closed' ? 'Closed' : 'Investigation in Progress'}
                      </span>
                    </span>
                  </div>

                  <div className="flex-gap">
                    {/* 5-Whys RCA Button */}
                    <button
                      className="btn-sm-ghost"
                      style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' }}
                      onClick={() => openRcaModal(inc)}
                    >
                      <HelpCircle size={12} color="#D97706" />
                      {inc.fiveWhys ? t('Edit 5-Whys RCA', '৫-হোয়াইজ সম্পাদন', lang) : t('Run 5-Whys RCA', '৫-হোয়াইজ আরসিএ করুন', lang)}
                    </button>

                    {/* Official Statutory HSE Dossier Export */}
                    <button
                      className="btn-sm-ghost"
                      style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' }}
                      onClick={() => setSelectedDossierIncident(inc)}
                    >
                      <FileText size={12} color="var(--brand-crimson)" />
                      {t('Govt / DoE Dossier', 'সরকারি ডসিয়ার', lang)}
                    </button>

                    {inc.capaStatus !== 'closed' && (
                      <button
                        className="btn-primary"
                        style={{ fontSize: '11px', padding: '4px 10px' }}
                        onClick={() => {
                          setIncidents(prev => prev.map(i => i.id === inc.id ? { ...i, capaStatus: 'closed' } : i));
                          showToast(t(`CAPA closed for ${inc.incNo}. Sign-off logged by GM.`, `সিএপিএ সফলভাবে সম্পন্ন হিসেবে চিহ্নিত করা হয়েছে।`, lang), 'success');
                        }}
                      >
                        <CheckCircle size={12} />
                        {t('Close CAPA', 'সিএপিএ সমাপ্তি', lang)}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5-Whys Root Cause Analysis (RCA) Modal */}
      {selectedRcaIncident && (
        <div className="modal-bg" onClick={() => setSelectedRcaIncident(null)}>
          <div className="modal" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-hd" style={{ background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)', color: '#fff' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <HelpCircle size={18} color="#FBBF24" />
                  <h3 style={{ color: '#fff', margin: 0 }}>
                    {t('5-Whys Root Cause Analysis (RCA)', '৫-হোয়াইজ মূল কারণ বিশ্লেষণ', lang)}
                  </h3>
                </div>
                <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
                  {selectedRcaIncident.incNo} • {selectedRcaIncident.title}
                </div>
              </div>
              <button className="modal-close" style={{ color: '#fff' }} onClick={() => setSelectedRcaIncident(null)}>×</button>
            </div>

            <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
              <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: '10px 14px', borderRadius: 'var(--radius-sm)', marginBottom: '16px', fontSize: '12px', color: '#92400E' }}>
                💡 <strong>Methodology:</strong> Drill down by repeatedly asking "Why" at each tier until the systemic root cause is uncovered. This ensures prevention rather than just treating symptoms.
              </div>

              {/* Fishbone Category Selector */}
              <div className="form-group mb-3">
                <label style={{ fontSize: '11.5px', fontWeight: 700 }}>{t('Ishikawa / Fishbone Primary Factor', 'ইশিকাওয়া কারণ শ্রেণী', lang)}</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {(['Machine', 'Method', 'Material', 'Man', 'Measurement', 'Environment'] as const).map(cat => (
                    <button
                      key={cat}
                      type="button"
                      style={{
                        fontSize: '11px',
                        padding: '5px 10px',
                        borderRadius: '4px',
                        border: rcaCategory === cat ? '2px solid #1D4ED8' : '1px solid #CBD5E1',
                        background: rcaCategory === cat ? '#EFF6FF' : '#FFF',
                        fontWeight: rcaCategory === cat ? 700 : 500,
                        cursor: 'pointer'
                      }}
                      onClick={() => setRcaCategory(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* 5 Whys Visual Hierarchy */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ borderLeft: '3px solid #60A5FA', paddingLeft: '12px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#1D4ED8' }}>1. Why did the direct problem happen?</label>
                  <input
                    type="text"
                    style={{ fontSize: '12px', padding: '7px 10px', width: '100%', marginTop: '3px' }}
                    value={rcaWhy1}
                    onChange={(e) => setRcaWhy1(e.target.value)}
                    placeholder="e.g. Gasket seal failed to maintain compression during 180°C asphalt flow"
                  />
                </div>

                <div style={{ borderLeft: '3px solid #3B82F6', paddingLeft: '12px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#1D4ED8' }}>2. Why did that happen?</label>
                  <input
                    type="text"
                    style={{ fontSize: '12px', padding: '7px 10px', width: '100%', marginTop: '3px' }}
                    value={rcaWhy2}
                    onChange={(e) => setRcaWhy2(e.target.value)}
                    placeholder="e.g. Compressed fiber material degraded rapidly under thermal cycling"
                  />
                </div>

                <div style={{ borderLeft: '3px solid #2563EB', paddingLeft: '12px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#1D4ED8' }}>3. Why did that happen?</label>
                  <input
                    type="text"
                    style={{ fontSize: '12px', padding: '7px 10px', width: '100%', marginTop: '3px' }}
                    value={rcaWhy3}
                    onChange={(e) => setRcaWhy3(e.target.value)}
                    placeholder="e.g. Local substitute was installed during urgent night turnaround"
                  />
                </div>

                <div style={{ borderLeft: '3px solid #1D4ED8', paddingLeft: '12px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#1D4ED8' }}>4. Why did that happen?</label>
                  <input
                    type="text"
                    style={{ fontSize: '12px', padding: '7px 10px', width: '100%', marginTop: '3px' }}
                    value={rcaWhy4}
                    onChange={(e) => setRcaWhy4(e.target.value)}
                    placeholder="e.g. Spiral-wound graphite gaskets were out of inventory in central store"
                  />
                </div>

                <div style={{ borderLeft: '3px solid #B91C1C', paddingLeft: '12px', background: '#FEF2F2', padding: '10px 12px', borderRadius: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#B91C1C' }}>5. Systemic Root Cause (The Core Preventable Flaw):</label>
                  <textarea
                    rows={2}
                    style={{ fontSize: '12px', padding: '7px 10px', width: '100%', marginTop: '4px', border: '1px solid #FCA5A5' }}
                    value={rcaWhy5}
                    onChange={(e) => setRcaWhy5(e.target.value)}
                    placeholder="e.g. Management of Change (MOC) protocol bypassed without materials compatibility sign-off by Plant QC"
                  />
                </div>
              </div>
            </div>

            <div className="modal-ft">
              <button className="btn-sm-ghost" onClick={() => setSelectedRcaIncident(null)}>{t('Cancel', 'বাতিল', lang)}</button>
              <button className="btn-gold" onClick={handleSaveRca}>
                <Check size={14} />
                {t('Commit Root Cause & Update Ledger', 'আরসিএ সংরক্ষণ করুন', lang)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Statutory HSE Dossier Modal */}
      {selectedDossierIncident && (
        <div className="modal-bg" onClick={() => setSelectedDossierIncident(null)}>
          <div className="modal" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-hd" style={{ background: '#7F1424', color: '#fff' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={18} color="#FDE68A" />
                  <h3 style={{ color: '#fff', margin: 0 }}>
                    {t('Official Statutory HSE Incident Dossier', 'সরকারি এইচএসই ইনসিডেন্ট ডসিয়ার', lang)}
                  </h3>
                </div>
                <div style={{ fontSize: '11px', color: '#FCA5A5', marginTop: '2px' }}>
                  Department of Explosives & DoE Form B-12 Compliance
                </div>
              </div>
              <button className="modal-close" style={{ color: '#fff' }} onClick={() => setSelectedDossierIncident(null)}>×</button>
            </div>

            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              {/* Document Header Watermark */}
              <div style={{ border: '2px solid #E2E8F0', padding: '16px', borderRadius: 'var(--radius-sm)', background: '#FAFAFA' }}>
                <div style={{ textAlign: 'center', borderBottom: '2px solid #A51C30', paddingBottom: '12px', marginBottom: '14px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 900, color: '#7F1424', letterSpacing: '0.5px' }}>
                    BASHUNDHARA OIL AND GAS COMPANY LIMITED (BOGCL)
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--brand-slate-600)' }}>
                    Refinery Complex & Tank Farm • South Keraniganj, Dhaka, Bangladesh
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 800, marginTop: '6px', color: '#0F172A', textTransform: 'uppercase' }}>
                    Statutory Incident Report (Petroleum Act 1934 & ECR 2023)
                  </div>
                </div>

                <div className="responsive-col-2-eq" style={{ gap: '10px', fontSize: '11.5px', marginBottom: '14px' }}>
                  <div><strong>Dossier Ref:</strong> {selectedDossierIncident.incNo}</div>
                  <div><strong>Occurrence Date:</strong> {selectedDossierIncident.date}</div>
                  <div><strong>Refinery Section:</strong> {selectedDossierIncident.location}</div>
                  <div><strong>Reported By:</strong> {selectedDossierIncident.reportedBy}</div>
                  <div><strong>Severity Category:</strong> Level {selectedDossierIncident.level} ({selectedDossierIncident.category.toUpperCase()})</div>
                  <div><strong>Statutory Notice SLA:</strong> Within 24 Hours (Explosives Inspectorate)</div>
                </div>

                <div style={{ borderTop: '1px solid #CBD5E1', paddingTop: '10px', fontSize: '12px', marginBottom: '12px' }}>
                  <div style={{ fontWeight: 700, color: 'var(--brand-slate-900)', marginBottom: '4px' }}>1. Incident Narrative & Immediate Containment:</div>
                  <div style={{ color: 'var(--brand-slate-700)', lineHeight: 1.5 }}>
                    {selectedDossierIncident.title}. Immediate containment executed by on-duty crew. Hazardous perimeter cordoned off with safety barrier tapes.
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #CBD5E1', paddingTop: '10px', fontSize: '12px', marginBottom: '12px' }}>
                  <div style={{ fontWeight: 700, color: 'var(--brand-slate-900)', marginBottom: '4px' }}>2. 5-Whys Root Cause Analysis:</div>
                  <div style={{ color: 'var(--brand-slate-700)', lineHeight: 1.5 }}>
                    {selectedDossierIncident.rootCause}
                  </div>
                  {selectedDossierIncident.fiveWhys && (
                    <div style={{ marginTop: '6px', fontSize: '11px', color: '#1E40AF', background: '#EFF6FF', padding: '6px 10px', borderRadius: '4px' }}>
                      Primary Factor: <strong>{selectedDossierIncident.fiveWhys.fishboneCategory}</strong> • Systemic flaw validated under ISO 45001 protocol.
                    </div>
                  )}
                </div>

                <div style={{ borderTop: '1px solid #CBD5E1', paddingTop: '10px', fontSize: '12px', marginBottom: '14px' }}>
                  <div style={{ fontWeight: 700, color: 'var(--brand-slate-900)', marginBottom: '4px' }}>3. Corrective & Preventive Action (CAPA):</div>
                  <div style={{ color: 'var(--brand-slate-700)', lineHeight: 1.5 }}>
                    {selectedDossierIncident.capaAction}
                  </div>
                </div>

                {/* Sign-off Stamps */}
                <div className="responsive-col-2-eq" style={{ gap: '16px', borderTop: '2px solid #CBD5E1', paddingTop: '14px', marginTop: '10px' }}>
                  <div style={{ textAlign: 'center', border: '1px dashed #94A3B8', padding: '10px', borderRadius: '4px' }}>
                    <div style={{ fontSize: '11px', color: '#059669', fontWeight: 800 }}>✓ VERIFIED BY EHS HEAD</div>
                    <div style={{ fontSize: '12px', fontWeight: 700, marginTop: '2px' }}>Farhana Kabir</div>
                    <div style={{ fontSize: '10px', color: '#64748B' }}>Lead Safety Inspector • BOGCL</div>
                  </div>

                  <div style={{ textAlign: 'center', border: '1px dashed #A51C30', padding: '10px', borderRadius: '4px' }}>
                    <div style={{ fontSize: '11px', color: '#A51C30', fontWeight: 800 }}>★ APPROVED BY PLANT GM</div>
                    <div style={{ fontSize: '12px', fontWeight: 700, marginTop: '2px' }}>Engr. Md. Harunur Rashid</div>
                    <div style={{ fontSize: '10px', color: '#64748B' }}>Plant GM & Licensed Controller</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-ft">
              <button className="btn-sm-ghost" onClick={() => setSelectedDossierIncident(null)}>{t('Close', 'বন্ধ করুন', lang)}</button>
              <button
                className="btn-primary"
                onClick={() => {
                  showToast(t(`Official HSE Dossier ${selectedDossierIncident.incNo} exported as PDF. Ready for submission to Chief Inspector of Explosives.`, `সরকারি ডসিয়ার পিডিএফ হিসেবে ডাউনলোড সম্পন্ন।`, lang), 'gold');
                  setSelectedDossierIncident(null);
                }}
              >
                <Download size={14} />
                {t('Download Certified PDF Dossier', 'পিডিএফ ডাউনলোড', lang)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Plant Siren Drill Modal */}
      {showEmergencyModal && (
        <div className="modal-bg" onClick={() => setShowEmergencyModal(false)}>
          <div className="modal" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-hd" style={{ background: '#991B1B', color: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertOctagon size={20} color="#FBBF24" />
                <h3 style={{ color: '#fff', margin: 0 }}>
                  {t('Emergency Refinery Shutdown & Muster Drill', 'জরুরি রিফাইনারি শাটডাউন ও ড্রিল প্রটোকল', lang)}
                </h3>
              </div>
              <button className="modal-close" style={{ color: '#fff' }} onClick={() => setShowEmergencyModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <div style={{ textAlign: 'center', padding: '10px 0 16px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <Siren size={30} color="#DC2626" />
                </div>
                <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#991B1B' }}>
                  Keraniganj Plant Emergency Readiness
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--brand-slate-600)', maxWidth: '420px', margin: '6px auto 0' }}>
                  Activating this protocol triggers the refinery audio evacuation horn, automatically trips SCADA fuel transfer pumps, and dispatches SMS alerts to Plant GM, Fire Service, and Chairman's Office.
                </p>
              </div>

              <div style={{ background: '#FFFDF5', border: '1px solid #FDE68A', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '12px', marginBottom: '14px' }}>
                <div style={{ fontWeight: 700, color: '#92400E', marginBottom: '6px' }}>Automatic Safety Interlocks:</div>
                <ul style={{ margin: 0, paddingLeft: '18px', color: '#78350F', lineHeight: 1.6 }}>
                  <li>Main Crude/Bitumen Feed Valve V-101: <strong>Instant Pneumatic Closure</strong></li>
                  <li>Nitrogen Blanket Purge System: <strong>Activated on Tanks 1-8</strong></li>
                  <li>Evacuation Assembly Points A, B, C: <strong>Biometric Headcount Enabled</strong></li>
                </ul>
              </div>
            </div>

            <div className="modal-ft">
              <button className="btn-sm-ghost" onClick={() => setShowEmergencyModal(false)}>{t('Cancel', 'বাতিল', lang)}</button>
              <button
                className="btn-danger"
                style={{ background: '#DC2626', color: '#fff', fontWeight: 800 }}
                onClick={() => {
                  setShowEmergencyModal(false);
                  showToast(t('EMERGENCY SIREN TRIGGERED! All 8 refinery valves isolated. SMS dispatched to Chairman and Fire Dept.', 'জরুরি সাইরেন সক্রিয়! প্ল্যান্টের ভালভ বিচ্ছিন্ন ও চেয়ারম্যান মহোদয়ের দপ্তরে বার্তা প্রেরণ করা হয়েছে।', lang), 'gold');
                }}
              >
                <Siren size={14} />
                {t('Initiate Emergency Drill Protocol', 'জরুরি ড্রিল সক্রিয় করুন', lang)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Incident Log Modal */}
      {showLogModal && (
        <div className="modal-bg" onClick={() => setShowLogModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-hd">
              <h3>
                <AlertTriangle size={18} />
                {t('Report HSE Incident / Near-Miss / Hazard', 'নতুন ঘটনা / নিয়ার-মিস দাখিল', lang)}
              </h3>
              <button className="modal-close" onClick={() => setShowLogModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>{t('Incident Title / Short Summary', 'ঘটনার শিরোনাম', lang)}</label>
                <input
                  type="text"
                  placeholder="e.g. Hydrocarbon vapor whiff detected near Tank Farm Flare Header"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>{t('Category', 'বিভাগ', lang)}</label>
                  <select value={formCategory} onChange={(e) => setFormCategory(e.target.value as any)}>
                    <option value="near_miss">Near-Miss (No injury or damage)</option>
                    <option value="spill">Hydrocarbon / Bitumen Spill</option>
                    <option value="pressure">Pressure Valve & Piping Anomaly</option>
                    <option value="electrical">Electrical Arc / Trip</option>
                    <option value="fire">Thermal / Flare Anomaly</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>{t('Severity Level (1-5)', 'তীব্রতা স্তর', lang)}</label>
                  <select value={formLevel} onChange={(e) => setFormLevel(Number(e.target.value) as any)}>
                    <option value={1}>Level 1: Minor (Routine housekeeping)</option>
                    <option value={2}>Level 2: Low (First aid / near-miss)</option>
                    <option value={3}>Level 3: Moderate (Hydrocarbon leak / equipment stop)</option>
                    <option value={4}>Level 4: Major (Plant-wide alert / safety interlock)</option>
                    <option value={5}>Level 5: Critical (Refinery emergency shutdown)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>{t('Location in Keraniganj Plant', 'প্ল্যান্টের সুনির্দিষ্ট স্থান', lang)}</label>
                <input
                  type="text"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>{t('Detailed Description & Immediate Protective Actions Taken', 'বিস্তারিত বিবরণ ও তাৎক্ষণিক পদক্ষেপ', lang)}</label>
                <textarea
                  rows={3}
                  placeholder="Describe observed conditions, affected personnel, immediate valve closures, and emergency steps taken..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />
              </div>

              <div style={{ background: '#FFFDF5', border: '1px solid #FDE68A', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '11.5px', color: '#92400E' }}>
                📸 <strong>EHS Mandatory Protocol:</strong> Submitting will automatically generate an immutable time-stamped incident report and dispatch SMS notifications to Plant GM Engr. Harunur Rashid and EHS Safety Lead Farhana Kabir.
              </div>
            </div>
            <div className="modal-ft">
              <button className="btn-sm-ghost" onClick={() => setShowLogModal(false)}>{t('Cancel', 'বাতিল', lang)}</button>
              <button className="btn-primary" onClick={handleCreateIncident}>
                <ShieldAlert size={14} />
                {t('Submit & Trigger EHS Response', 'জমা দিন ও অ্যালার্ট জারি করুন', lang)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
