import React, { useState, useMemo } from 'react';
import { ViewProps, ROLE_META, SYSTEM_TODAY, t } from '../types';
import { showToast } from '../App';
import {
  useOperationsStore,
  IncidentItem,
  IncidentType,
  IncidentWorkflowStage,
  InvolvedPerson,
  CapaActionItem,
} from '../store/operationsStore';
import { useEmployeeStore } from '../store/employeeStore';
import {
  AlertTriangle, ShieldAlert, CheckCircle, Clock, Flame,
  FileText, Plus, Eye, Zap, ShieldCheck, Activity, Camera,
  HelpCircle, ChevronRight, Siren, Download, Share2, Filter,
  Check, ArrowRight, UserCheck, AlertOctagon, Send, Wrench,
  Search, X, CheckSquare, Calendar, Building, MapPin, HeartPulse,
  HardHat, Award, User, RefreshCw, ChevronDown, ChevronUp, Layers, CheckCircle2
} from 'lucide-react';

export const PLANT_ZONES = [
  'All Plant Zones',
  'Storage Tank Yard (TK-101 to TK-108)',
  'Bitumen Thermal Processing Unit #2',
  'Bulk Tanker Loading Gantry',
  'Main Truck Logistics Gate #2',
  'Circulation Pump House, Unit-2',
  'Boiler House & Steam Utility',
  'Effluent Treatment Plant (ETP)',
  'Central Quality Control Lab',
  'Central Workshop & Fabrication Shed',
  'Electrical Substation #3',
] as const;

export const INCIDENT_TYPE_META: Record<IncidentType, { label: string; labelBn: string; color: string; icon: string }> = {
  near_miss: { label: 'Near-Miss (Zero Injury)', labelBn: 'নিয়ার-মিস (ক্ষতিহীন)', color: '#3B82F6', icon: '⚡' },
  hazard_observation: { label: 'Hazard / Unsafe Condition', labelBn: 'বিপদ পর্যবেক্ষণ', color: '#8B5CF6', icon: '👁️' },
  first_aid: { label: 'First-Aid Case (FAC)', labelBn: 'প্রাথমিক চিকিৎসা ঘটনা', color: '#10B981', icon: '🩹' },
  medical_treatment: { label: 'Medical Treatment (MTC)', labelBn: 'চিকিৎসাকেন্দ্রে চিকিৎসা', color: '#F59E0B', icon: '🏥' },
  lost_time: { label: 'Lost Time Injury (LTI)', labelBn: 'কর্মবিরতিজনিত আঘাত', color: '#DC2626', icon: '🛑' },
  spill_leak: { label: 'Spill / Leak (LOPC)', labelBn: 'তেল / বিটুমিন নিঃসরণ', color: '#EA580C', icon: '🛢️' },
  pressure_piping: { label: 'Pressure & Piping Alert', labelBn: 'পাইপলাইন ও চাপ ত্রুটি', color: '#D97706', icon: '⚠️' },
  fire_thermal: { label: 'Thermal / Flare Anomaly', labelBn: 'অগ্নিকাণ্ড বা অতিরিক্ত তাপ', color: '#B91C1C', icon: '🔥' },
  electrical_arc: { label: 'Electrical Arc / Fault', labelBn: 'বৈদ্যুতিক ত্রুটি', color: '#6366F1', icon: '⚡' },
  equipment_damage: { label: 'Equipment / Asset Damage', labelBn: 'যন্ত্রাংশের ক্ষতি', color: '#64748B', icon: '⚙️' },
  environmental: { label: 'Environmental Release', labelBn: 'পরিবেশগত নির্গমন', color: '#059669', icon: '🌱' },
};

export default function IncidentView({ role, lang, onNavigate }: ViewProps) {
  const {
    incidents,
    setIncidents,
    addIncident,
    updateIncident,
    advanceIncidentStatus,
    addCapaItem,
    toggleCapaStatus,
    closeIncidentWithSignOff,
  } = useOperationsStore();
  const { activeEmployees } = useEmployeeStore();
  const currentPersona = ROLE_META[role] || ROLE_META.employee;

  // ── Filters & Search State ──
  const [activeTab, setActiveTab] = useState<'all' | 'spill_leak' | 'near_miss' | 'first_aid' | 'pressure_piping' | 'electrical_arc' | 'statutory'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZone, setSelectedZone] = useState<string>('All Plant Zones');
  const [selectedSeverity, setSelectedSeverity] = useState<number>(0); // 0 = all
  const [selectedStage, setSelectedStage] = useState<'all' | IncidentWorkflowStage>('all');
  const [matrixFilter, setMatrixFilter] = useState<{ level: number; likelihood: number } | null>(null);

  // ── Modals State ──
  const [showLogWizard, setShowLogWizard] = useState(false);
  const [showQuickHazardModal, setShowQuickHazardModal] = useState(false);
  const [selectedRcaIncident, setSelectedRcaIncident] = useState<IncidentItem | null>(null);
  const [selectedCapaIncident, setSelectedCapaIncident] = useState<IncidentItem | null>(null);
  const [selectedDossierIncident, setSelectedDossierIncident] = useState<IncidentItem | null>(null);
  const [selectedSignoffIncident, setSelectedSignoffIncident] = useState<IncidentItem | null>(null);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [expandedIncidentId, setExpandedIncidentId] = useState<string | null>(null);

  // ── Wizard Form State (Modal 1) ──
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [wizardType, setWizardType] = useState<IncidentType>('near_miss');
  const [wizardTitle, setWizardTitle] = useState('');
  const [wizardZone, setWizardZone] = useState<string>('Storage Tank Yard (TK-101 to TK-108)');
  const [wizardLocation, setWizardLocation] = useState('Storage Tank Yard, Tank TK-102');
  const [wizardShift, setWizardShift] = useState<'Morning Shift (07:00 - 15:00)' | 'Evening Shift (15:00 - 23:00)' | 'Night Shift (23:00 - 07:00)'>('Morning Shift (07:00 - 15:00)');
  const [wizardSeverity, setWizardSeverity] = useState<1 | 2 | 3 | 4 | 5>(2);
  const [wizardLikelihood, setWizardLikelihood] = useState<1 | 2 | 3 | 4 | 5>(2);
  const [wizardImmediateActions, setWizardImmediateActions] = useState('');
  const [wizardHasInjury, setWizardHasInjury] = useState(false);
  const [wizardInjuredEmpId, setWizardInjuredEmpId] = useState('');
  const [wizardInjuryNature, setWizardInjuryNature] = useState('');
  const [wizardTreatmentGiven, setWizardTreatmentGiven] = useState('');
  const [wizardWitnessName, setWizardWitnessName] = useState('');
  const [wizardSimulatePhoto, setWizardSimulatePhoto] = useState(false);

  // ── Quick Hazard State (Modal 2) ──
  const [quickHazardTitle, setQuickHazardTitle] = useState('');
  const [quickHazardZone, setQuickHazardZone] = useState('Circulation Pump House, Unit-2');
  const [quickHazardDesc, setQuickHazardDesc] = useState('');
  const [quickHazardFix, setQuickHazardFix] = useState('');

  // ── 5-Whys & Fishbone State (Modal 3) ──
  const [rcaSubTab, setRcaSubTab] = useState<'5whys' | 'fishbone'>('5whys');
  const [rcaWhy1, setRcaWhy1] = useState('');
  const [rcaWhy2, setRcaWhy2] = useState('');
  const [rcaWhy3, setRcaWhy3] = useState('');
  const [rcaWhy4, setRcaWhy4] = useState('');
  const [rcaWhy5, setRcaWhy5] = useState('');
  const [rcaCategory, setRcaCategory] = useState<'Equipment' | 'Procedure' | 'Material' | 'Staffing' | 'Inspection' | 'Weather'>('Equipment');
  const [fishPeople, setFishPeople] = useState('');
  const [fishMachine, setFishMachine] = useState('');
  const [fishMethod, setFishMethod] = useState('');
  const [fishMaterial, setFishMaterial] = useState('');
  const [fishMeasurement, setFishMeasurement] = useState('');
  const [fishEnv, setFishEnv] = useState('');

  // ── CAPA Modal State (Modal 4) ──
  const [newCapaType, setNewCapaType] = useState<'immediate_containment' | 'corrective' | 'preventive'>('corrective');
  const [newCapaDesc, setNewCapaDesc] = useState('');
  const [newCapaOwner, setNewCapaOwner] = useState('Plant Maintenance Team');
  const [newCapaDueDate, setNewCapaDueDate] = useState('04 Nov 2026');
  const [newCapaPriority, setNewCapaPriority] = useState<'high' | 'medium' | 'low'>('high');

  // ── Sign-Off Modal State (Modal 6) ──
  const [signoffOfficer, setSignoffOfficer] = useState('Farhana Kabir (Lead Safety Officer)');
  const [signoffGm, setSignoffGm] = useState('Engr. Md. Harunur Rashid (Plant GM)');
  const [signoffRemarks, setSignoffRemarks] = useState('Site inspection completed. Preventative interlocks and physical barriers confirmed in full compliance with ISO 45001.');

  // ─────────────────────────────────────────────────────────────────────────
  // Computed Performance Metrics & Stats
  // ─────────────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = incidents.length;
    const open = incidents.filter(i => i.capaStatus !== 'closed').length;
    const closed = incidents.filter(i => i.capaStatus === 'closed').length;
    const critical = incidents.filter(i => i.level >= 3).length;
    const statutory = incidents.filter(i => i.statutoryReportable).length;

    // CAPA actions total & completed
    let totalCapa = 0;
    let completedCapa = 0;
    incidents.forEach(i => {
      (i.capaItems || []).forEach(c => {
        totalCapa++;
        if (c.status === 'completed') completedCapa++;
      });
    });
    const capaRate = totalCapa > 0 ? ((completedCapa / totalCapa) * 100).toFixed(1) : '100.0';

    return {
      total,
      open,
      closed,
      critical,
      statutory,
      capaRate,
      safeDays: 284,
      safeManHours: 1428500,
      trir: '0.14',
    };
  }, [incidents]);

  // ─────────────────────────────────────────────────────────────────────────
  // Filtered Incidents
  // ─────────────────────────────────────────────────────────────────────────
  const filteredIncidents = useMemo(() => {
    return incidents.filter(inc => {
      // Tab filter
      if (activeTab === 'statutory' && !inc.statutoryReportable) return false;
      if (activeTab === 'spill_leak' && inc.incidentType !== 'spill_leak' && inc.category !== 'spill') return false;
      if (activeTab === 'near_miss' && inc.incidentType !== 'near_miss' && inc.incidentType !== 'hazard_observation' && inc.category !== 'near_miss') return false;
      if (activeTab === 'first_aid' && inc.incidentType !== 'first_aid' && inc.incidentType !== 'medical_treatment' && inc.incidentType !== 'lost_time') return false;
      if (activeTab === 'pressure_piping' && inc.incidentType !== 'pressure_piping' && inc.category !== 'pressure') return false;
      if (activeTab === 'electrical_arc' && inc.incidentType !== 'electrical_arc' && inc.category !== 'electrical') return false;

      // Risk Matrix filter
      if (matrixFilter) {
        if (inc.level !== matrixFilter.level || (inc.likelihood || 2) !== matrixFilter.likelihood) {
          return false;
        }
      }

      // Zone filter
      if (selectedZone !== 'All Plant Zones' && inc.plantZone !== selectedZone) {
        return false;
      }

      // Severity level filter
      if (selectedSeverity > 0 && inc.level !== selectedSeverity) {
        return false;
      }

      // Stage filter
      if (selectedStage !== 'all' && (inc.workflowStage || (inc.capaStatus === 'closed' ? 'closed' : 'under_investigation')) !== selectedStage) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesNo = inc.incNo.toLowerCase().includes(q);
        const matchesTitle = inc.title.toLowerCase().includes(q) || (inc.titleBn && inc.titleBn.toLowerCase().includes(q));
        const matchesLoc = inc.location.toLowerCase().includes(q) || (inc.plantZone && inc.plantZone.toLowerCase().includes(q));
        const matchesReporter = inc.reportedBy.toLowerCase().includes(q);
        if (!matchesNo && !matchesTitle && !matchesLoc && !matchesReporter) return false;
      }

      return true;
    });
  }, [incidents, activeTab, matrixFilter, selectedZone, selectedSeverity, selectedStage, searchQuery]);

  // ─────────────────────────────────────────────────────────────────────────
  // RCA Modal Handlers
  // ─────────────────────────────────────────────────────────────────────────
  const openRcaModal = (inc: IncidentItem) => {
    setSelectedRcaIncident(inc);
    setRcaSubTab('5whys');
    setRcaWhy1(inc.fiveWhys?.why1 || `Why did the incident occur at ${inc.location}?`);
    setRcaWhy2(inc.fiveWhys?.why2 || '');
    setRcaWhy3(inc.fiveWhys?.why3 || '');
    setRcaWhy4(inc.fiveWhys?.why4 || '');
    setRcaWhy5(inc.fiveWhys?.why5 || '');
    setRcaCategory(inc.fiveWhys?.fishboneCategory || 'Equipment');

    setFishPeople(inc.fishboneFactors?.people?.join(', ') || '');
    setFishMachine(inc.fishboneFactors?.machine?.join(', ') || '');
    setFishMethod(inc.fishboneFactors?.method?.join(', ') || '');
    setFishMaterial(inc.fishboneFactors?.material?.join(', ') || '');
    setFishMeasurement(inc.fishboneFactors?.measurement?.join(', ') || '');
    setFishEnv(inc.fishboneFactors?.environment?.join(', ') || '');
  };

  const handleSaveRca = () => {
    if (!selectedRcaIncident) return;
    const parseFactors = (str: string) => str.split(',').map(s => s.trim()).filter(Boolean);

    updateIncident(selectedRcaIncident.id, {
      rootCause: rcaWhy5 || rcaWhy4 || selectedRcaIncident.rootCause,
      workflowStage: selectedRcaIncident.workflowStage === 'reported' || selectedRcaIncident.workflowStage === 'triaged'
        ? 'under_investigation'
        : selectedRcaIncident.workflowStage,
      fiveWhys: {
        why1: rcaWhy1,
        why2: rcaWhy2,
        why3: rcaWhy3,
        why4: rcaWhy4,
        why5: rcaWhy5,
        fishboneCategory: rcaCategory,
      },
      fishboneFactors: {
        people: parseFactors(fishPeople),
        machine: parseFactors(fishMachine),
        method: parseFactors(fishMethod),
        material: parseFactors(fishMaterial),
        measurement: parseFactors(fishMeasurement),
        environment: parseFactors(fishEnv),
      },
    });

    setSelectedRcaIncident(null);
    showToast(
      t(
        `Root Cause Analysis & Ishikawa Diagram updated for ${selectedRcaIncident.incNo}.`,
        `মূল কারণ বিশ্লেষণ ও ইশিকাওয়া ফিশবোন ডায়াগ্রাম সফলভাবে সংরক্ষিত হয়েছে (${selectedRcaIncident.incNo})।`,
        lang
      ),
      'gold'
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Wizard Submit Handler (Modal 1)
  // ─────────────────────────────────────────────────────────────────────────
  const handleWizardSubmit = () => {
    if (!wizardTitle.trim() || !wizardImmediateActions.trim()) {
      showToast(t('Please complete incident title and immediate containment actions.', 'অনুগ্রহ করে শিরোনাম ও তাৎক্ষণিক পদক্ষেপ পূরণ করুন।', lang), 'info');
      return;
    }

    const nextIdx = incidents.length + 1;
    const score = wizardSeverity * wizardLikelihood;
    const riskCat = score >= 15 ? 'extreme' : score >= 10 ? 'high' : score >= 5 ? 'medium' : 'low';

    // Map Category for backwards compatibility
    const legacyCategory =
      wizardType === 'spill_leak' ? 'spill' :
      wizardType === 'pressure_piping' ? 'pressure' :
      wizardType === 'fire_thermal' ? 'fire' :
      wizardType === 'electrical_arc' ? 'electrical' : 'near_miss';

    const chosenInjured = activeEmployees.find(e => e.id === wizardInjuredEmpId);
    const persons: InvolvedPerson[] = [];
    if (wizardHasInjury && chosenInjured) {
      persons.push({
        name: chosenInjured.name,
        empId: chosenInjured.id,
        role: chosenInjured.designation,
        involvementType: 'injured',
        injuryNature: wizardInjuryNature || 'Superficial Abrasion / Contusion',
        treatmentGiven: wizardTreatmentGiven || 'First aid administered at Plant Medical Post',
      });
    }
    if (wizardWitnessName.trim()) {
      persons.push({
        name: wizardWitnessName.trim(),
        role: 'On-Duty Witness',
        involvementType: 'witness',
      });
    }

    const defaultCapa: CapaActionItem[] = [
      {
        id: `CAPA-${Math.floor(100 + Math.random() * 900)}`,
        actionType: 'immediate_containment',
        description: wizardImmediateActions.trim(),
        owner: `${currentPersona.name} (${currentPersona.label})`,
        dueDate: SYSTEM_TODAY,
        priority: 'high',
        status: 'completed',
        completedAt: 'Just Now',
        verificationEvidence: 'Initial containment executed upon notification.',
      },
      {
        id: `CAPA-${Math.floor(100 + Math.random() * 900)}`,
        actionType: 'corrective',
        description: `Investigate physical cause and perform safety verification on ${wizardLocation}.`,
        owner: 'Plant Maintenance & EHS Team',
        dueDate: '04 Nov 2026',
        priority: wizardSeverity >= 3 ? 'high' : 'medium',
        status: 'pending',
      },
    ];

    const newInc: IncidentItem = {
      id: `INC-0${nextIdx}`,
      incNo: `BOGCL-HSE-2026-${String(43 + nextIdx).padStart(3, '0')}`,
      title: wizardTitle.trim(),
      titleBn: wizardTitle.trim(),
      incidentType: wizardType,
      category: legacyCategory,
      level: wizardSeverity,
      likelihood: wizardLikelihood,
      riskScore: score,
      riskCategory: riskCat,
      plantZone: wizardZone,
      location: wizardLocation.trim(),
      shift: wizardShift,
      reportedBy: `${currentPersona.name} (${currentPersona.label})`,
      reporterEmpId: currentPersona.empId,
      date: `${SYSTEM_TODAY}, Just Now`,
      workflowStage: 'reported',
      immediateActionsTaken: wizardImmediateActions.trim(),
      personsInvolved: persons,
      investigationLead: 'Farhana Kabir (Lead Safety Officer)',
      investigationTeam: ['Farhana Kabir (Lead Safety Officer)', 'Nazmul Huda (Safety Inspector)'],
      rootCause: 'Under active root-cause investigation by Keraniganj EHS Committee.',
      capaItems: defaultCapa,
      capaAction: wizardImmediateActions.trim(),
      capaOwner: 'Plant Maintenance & EHS Team',
      capaStatus: 'in_progress',
      statutoryReportable: wizardSeverity >= 3,
      statutoryAgency: wizardSeverity >= 3 ? 'Department of Explosives (DoE)' : undefined,
      statutoryNoticeHours: wizardSeverity >= 3 ? 24 : undefined,
      evidenceAttached: wizardSimulatePhoto,
    };

    addIncident(newInc);
    setShowLogWizard(false);
    setWizardStep(1);
    setWizardTitle('');
    setWizardImmediateActions('');
    setWizardHasInjury(false);
    setWizardInjuredEmpId('');

    showToast(
      t(
        `Incident ${newInc.incNo} logged! Auto-dispatched alert to Plant GM and EHS lead.`,
        `ইনসিডেন্ট ${newInc.incNo} সফলভাবে রেকর্ড সম্পন্ন হয়েছে এবং অ্যালার্ট জারি করা হয়েছে।`,
        lang
      ),
      'gold'
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Quick Hazard Observation Submit (Modal 2)
  // ─────────────────────────────────────────────────────────────────────────
  const handleQuickHazardSubmit = () => {
    if (!quickHazardTitle.trim() || !quickHazardDesc.trim()) {
      showToast(t('Please describe the hazard condition.', 'অনুগ্রহ করে বিপদ পর্যবেক্ষণ বিবরণ দিন।', lang), 'info');
      return;
    }

    const nextIdx = incidents.length + 1;
    const newInc: IncidentItem = {
      id: `INC-0${nextIdx}`,
      incNo: `BOGCL-HSE-2026-${String(43 + nextIdx).padStart(3, '0')}`,
      title: `Hazard Observation: ${quickHazardTitle.trim()}`,
      titleBn: `বিপদ পর্যবেক্ষণ: ${quickHazardTitle.trim()}`,
      incidentType: 'hazard_observation',
      category: 'near_miss',
      level: 1,
      likelihood: 2,
      riskScore: 2,
      riskCategory: 'low',
      plantZone: quickHazardZone,
      location: `${quickHazardZone}, Keraniganj Complex`,
      shift: 'Morning Shift (07:00 - 15:00)',
      reportedBy: `${currentPersona.name} (${currentPersona.label})`,
      reporterEmpId: currentPersona.empId,
      date: `${SYSTEM_TODAY}, Just Now`,
      workflowStage: 'triaged',
      immediateActionsTaken: quickHazardFix.trim() || 'Hazard flagged with safety tape and reported to shift supervisor.',
      rootCause: quickHazardDesc.trim(),
      capaItems: [
        {
          id: `CAPA-${Math.floor(100 + Math.random() * 900)}`,
          actionType: 'corrective',
          description: quickHazardFix.trim() || 'Inspect area and remediate flagged condition.',
          owner: 'Plant Maintenance Team',
          dueDate: '02 Nov 2026',
          priority: 'medium',
          status: 'pending',
        },
      ],
      capaAction: quickHazardFix.trim() || 'Area flagged and remediation assigned.',
      capaOwner: 'Plant Maintenance Team',
      capaStatus: 'open',
      statutoryReportable: false,
      evidenceAttached: false,
    };

    addIncident(newInc);
    setShowQuickHazardModal(false);
    setQuickHazardTitle('');
    setQuickHazardDesc('');
    setQuickHazardFix('');

    showToast(
      t(
        `Good catch! Hazard observation ${newInc.incNo} recorded. Zero-harm culture rewarded.`,
        `ধন্যবাদ! আপনার বিপদ পর্যবেক্ষণ ${newInc.incNo} সফলভাবে রেকর্ড করা হয়েছে।`,
        lang
      ),
      'success'
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Add New CAPA Item Handler
  // ─────────────────────────────────────────────────────────────────────────
  const handleAddNewCapa = () => {
    if (!selectedCapaIncident || !newCapaDesc.trim()) {
      showToast(t('Please provide CAPA description.', 'সিএপিএ বিবরণ লিখুন।', lang), 'info');
      return;
    }

    addCapaItem(selectedCapaIncident.id, {
      actionType: newCapaType,
      description: newCapaDesc.trim(),
      owner: newCapaOwner.trim(),
      dueDate: newCapaDueDate,
      priority: newCapaPriority,
      status: 'pending',
    });

    setNewCapaDesc('');
    showToast(t('New CAPA action item assigned and ledger updated.', 'নতুন সিএপিএ ব্যবস্থা যোগ করা হয়েছে।', lang), 'success');
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Digital Sign-Off & Closure Handler
  // ─────────────────────────────────────────────────────────────────────────
  const handleSignOffClosure = () => {
    if (!selectedSignoffIncident) return;
    closeIncidentWithSignOff(selectedSignoffIncident.id, signoffOfficer, signoffGm, signoffRemarks);
    setSelectedSignoffIncident(null);
    showToast(
      t(
        `Incident ${selectedSignoffIncident.incNo} formally closed and verified by Plant GM.`,
        `ইনসিডেন্ট ${selectedSignoffIncident.incNo} সফলভাবে সমাপ্ত ও জিএম মহোদয় কর্তৃক অনুমোদিত হয়েছে।`,
        lang
      ),
      'gold'
    );
  };

  return (
    <div>
      {/* ─── 1. TOP HEADER & INSTANT SAFETY CONTROLS ─── */}
      <div className="flex-between mb-4" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--brand-slate-900)', margin: 0 }}>
              {t('Factory Safety & Incident Management System', 'কারখানা স্বাস্থ্য-নিরাপত্তা ও ইনসিডেন্ট ব্যবস্থাপনা', lang)}
            </h2>
            <span className="badge success" style={{ fontSize: '10px' }}>
              OSHA & ISO 45001 STANDARDS
            </span>
          </div>
          <p className="text-muted" style={{ margin: '4px 0 0', fontSize: '12.5px' }}>
            {t(
              'Zero-Harm Workplace • Fast Floor Reporting • Step-by-Step Problem Solving (5-Whys) • Action Fixes (CAPA)',
              'শূন্য দুর্ঘটনা দর্শন • দ্রুত মেঝে পর্যায় থেকে রিপোর্ট • সমস্যার মূল কারণ অনুসন্ধান ও স্থায়ী সমাধান ব্যবস্থা',
              lang
            )}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-outline-danger"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
            onClick={() => setShowEmergencyModal(true)}
          >
            <Siren size={15} color="#DC2626" />
            {t('Emergency Siren & Drill', 'জরুরি সাইরেন ও ইভাকুয়েশন ড্রিল', lang)}
          </button>

          <button
            type="button"
            className="btn-sm-ghost"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, background: '#F5F3FF', color: '#7C3AED', border: '1px solid #DDD6FE' }}
            onClick={() => setShowQuickHazardModal(true)}
          >
            <Zap size={14} color="#7C3AED" />
            {t('1-Min Quick Hazard Spotter', '১-মিনিট দ্রুত বিপদ পর্যবেক্ষণ', lang)}
          </button>

          <button
            type="button"
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
            onClick={() => {
              setWizardStep(1);
              setShowLogWizard(true);
            }}
          >
            <Plus size={15} />
            {t('Report Incident / Near-Miss', 'নতুন ইনসিডেন্ট রিপোর্ট', lang)}
          </button>
        </div>
      </div>

      {/* ─── 2. REFINERY SAFETY LEADERSHIP KPI DECK ─── */}
      <div className="parcel-kpi-grid mb-4">
        {/* Card 1: Safe Days */}
        <div className="parcel-kpi-card" style={{ borderColor: '#A7F3D0', background: 'linear-gradient(180deg, #FFFFFF 0%, #F0FDF4 100%)' }}>
          <div className="parcel-kpi-top">
            <div className="parcel-kpi-icon" style={{ background: '#DCFCE7', color: '#15803D' }}>
              <ShieldCheck size={18} />
            </div>
            <span className="badge success" style={{ fontSize: '9.5px' }}>TARGET: 365 DAYS</span>
          </div>
          <div>
            <div className="parcel-kpi-val" style={{ color: '#15803D' }}>{stats.safeDays}</div>
            <div className="parcel-kpi-title">{t('Accident-Free Working Days', 'দুর্ঘটনামুক্ত নিরাপদ কর্মদিবস', lang)}</div>
            <div className="parcel-kpi-sub">
              {stats.safeManHours.toLocaleString()} {t('Safe Work Hours (No Lost Time)', 'নিরাপদ কর্মঘণ্টা (কোনো দুর্ঘটনা নেই)', lang)}
            </div>
          </div>
        </div>

        {/* Card 2: Open Investigations */}
        <div
          className={`parcel-kpi-card ${selectedStage === 'under_investigation' ? 'active' : ''}`}
          onClick={() => setSelectedStage(selectedStage === 'under_investigation' ? 'all' : 'under_investigation')}
          style={{ cursor: 'pointer' }}
        >
          <div className="parcel-kpi-top">
            <div className="parcel-kpi-icon" style={{ background: '#FFFBEB', color: '#D97706' }}>
              <Clock size={18} />
            </div>
            <span className="badge warn" style={{ fontSize: '9.5px' }}>ACTIVE</span>
          </div>
          <div>
            <div className="parcel-kpi-val" style={{ color: '#D97706' }}>{stats.open}</div>
            <div className="parcel-kpi-title">{t('Open Issues & Investigations', 'চলমান তদন্ত ও সমাধান', lang)}</div>
            <div className="parcel-kpi-sub">
              {stats.closed} {t('Resolved Safely This Year', 'টি ঘটনা সফলভাবে সমাধান হয়েছে', lang)}
            </div>
          </div>
        </div>

        {/* Card 3: CAPA Closure Rate */}
        <div className="parcel-kpi-card" style={{ borderColor: '#BFDBFE', background: 'linear-gradient(180deg, #FFFFFF 0%, #EFF6FF 100%)' }}>
          <div className="parcel-kpi-top">
            <div className="parcel-kpi-icon" style={{ background: '#DBEAFE', color: '#1D4ED8' }}>
              <CheckSquare size={18} />
            </div>
            <span className="badge info" style={{ fontSize: '9.5px' }}>TARGET: &gt;85%</span>
          </div>
          <div>
            <div className="parcel-kpi-val" style={{ color: '#1D4ED8' }}>{stats.capaRate}%</div>
            <div className="parcel-kpi-title">{t('Safety Fix Rate (CAPA)', 'নিরাপত্তা প্রতিকারের হার (CAPA)', lang)}</div>
            <div className="parcel-kpi-sub">
              {t('Fixing problems & preventing recurrence', 'সমস্যা সমাধান ও পুনরাবৃত্তি রোধ', lang)}
            </div>
          </div>
        </div>

        {/* Card 4: Statutory Reportable SLA */}
        <div
          className={`parcel-kpi-card ${activeTab === 'statutory' ? 'active' : ''}`}
          onClick={() => setActiveTab(activeTab === 'statutory' ? 'all' : 'statutory')}
          style={{ cursor: 'pointer', borderColor: '#FECACA', background: 'linear-gradient(180deg, #FFFFFF 0%, #FEF2F2 100%)' }}
        >
          <div className="parcel-kpi-top">
            <div className="parcel-kpi-icon" style={{ background: '#FEE2E2', color: '#B91C1C' }}>
              <FileText size={18} />
            </div>
            <span className="badge danger" style={{ fontSize: '9.5px' }}>GOVT DEADLINE</span>
          </div>
          <div>
            <div className="parcel-kpi-val" style={{ color: '#B91C1C' }}>{stats.statutory}</div>
            <div className="parcel-kpi-title">{t('Govt-Reportable Issues (DoE)', 'সরকারিভাবে রিপোর্টযোগ্য বিষয়', lang)}</div>
            <div className="parcel-kpi-sub">
              {t('Explosives Dept Form B-12 Ready', 'বিস্ফোরক পরিদপ্তর ফর্ম বি-১২ প্রস্তুত', lang)}
            </div>
          </div>
        </div>

        {/* Card 5: TRIR Safety Frequency */}
        <div className="parcel-kpi-card">
          <div className="parcel-kpi-top">
            <div className="parcel-kpi-icon" style={{ background: '#F3E8FF', color: '#7E22CE' }}>
              <Activity size={18} />
            </div>
            <span className="badge meeting" style={{ fontSize: '9.5px' }}>LOWER IS BETTER</span>
          </div>
          <div>
            <div className="parcel-kpi-val" style={{ color: '#7E22CE' }}>{stats.trir}</div>
            <div className="parcel-kpi-title">{t('Safety Score (Injury Rate - TRIR)', 'নিরাপত্তা স্কোর (আঘাতের হার - TRIR)', lang)}</div>
            <div className="parcel-kpi-sub">
              {t('0.14 vs industry benchmark 0.85', 'শিল্প গড়ের চেয়ে অনেক নিরাপদ (০.১৪)', lang)}
            </div>
          </div>
        </div>
      </div>

      {/* ─── 3. INTERACTIVE 5x5 RISK MATRIX ─── */}
      <div className="card mb-4" style={{ overflow: 'hidden' }}>
        <div className="card-hd">
          <div className="card-hd-left">
            <div className="card-hd-icon" style={{ background: '#FEF3C7', color: '#B45309' }}>
              <Activity size={18} />
            </div>
            <div>
              <div className="card-title">
                {t('Risk Priority Grid: How Likely? × How Severe?', 'ঝুঁকি মূল্যায়ন গ্রিড: সম্ভাবনা × প্রভাব', lang)}
              </div>
              <div className="card-subtitle">
                {t('Click any colored square to see factory issues with that risk rating', 'যেকোনো রঙের ঘরে ক্লিক করে নির্দিষ্ট ঝুঁকির ঘটনাগুলো ফিল্টার করুন', lang)}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {matrixFilter && (
              <button
                type="button"
                className="btn-sm-ghost"
                style={{ fontSize: '11px', background: '#F1F5F9', color: '#0F172A', fontWeight: 700 }}
                onClick={() => setMatrixFilter(null)}
              >
                ✕ {t('Clear Matrix Filter', 'ম্যাট্রিক্স ফিল্টার মুছুন', lang)} (Severity {matrixFilter.level} × Chance {matrixFilter.likelihood})
              </button>
            )}
            <span className="badge gold">5×5 RISK GRID</span>
          </div>
        </div>

        <div className="card-body" style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: '600px' }}>
            <div className="hse-risk-matrix-grid">
              {/* Top Row: Headers */}
              <div className="hse-matrix-header-cell" style={{ visibility: 'hidden' }}>-</div>
              <div className="hse-matrix-header-cell">1. Very Rare</div>
              <div className="hse-matrix-header-cell">2. Unlikely</div>
              <div className="hse-matrix-header-cell">3. Possible</div>
              <div className="hse-matrix-header-cell">4. Likely</div>
              <div className="hse-matrix-header-cell">5. Almost Certain</div>

              {/* Rows 5 down to 1 */}
              {[5, 4, 3, 2, 1].map((lvl) => {
                const rowLabel =
                  lvl === 5 ? '5. Severe Disaster' :
                  lvl === 4 ? '4. Serious Damage' :
                  lvl === 3 ? '3. Moderate Issue' :
                  lvl === 2 ? '2. Minor Problem' : '1. Negligible';

                return (
                  <React.Fragment key={lvl}>
                    <div className="hse-matrix-row-label">{rowLabel}</div>
                    {[1, 2, 3, 4, 5].map((prob) => {
                      const score = lvl * prob;
                      const riskClass =
                        score >= 20 ? 'risk-crimson' :
                        score >= 15 ? 'risk-red' :
                        score >= 10 ? 'risk-orange' :
                        score >= 5 ? 'risk-yellow' : 'risk-green';

                      const matching = incidents.filter(i => i.level === lvl && (i.likelihood || 2) === prob);
                      const isSelected = matrixFilter?.level === lvl && matrixFilter?.likelihood === prob;

                      return (
                        <div
                          key={prob}
                          className={`hse-matrix-cell ${riskClass} ${isSelected ? 'active-filter' : ''}`}
                          onClick={() => setMatrixFilter(isSelected ? null : { level: lvl, likelihood: prob })}
                          title={`Severity ${lvl} × Likelihood ${prob} = Score ${score}. Click to filter (${matching.length} incidents)`}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9.5px', fontWeight: 800 }}>
                            <span>{score}</span>
                            <span>{score >= 15 ? 'EXTREME' : score >= 10 ? 'HIGH' : score >= 5 ? 'MED' : 'LOW'}</span>
                          </div>

                          <div style={{ marginTop: '2px' }}>
                            {matching.map((m) => (
                              <div
                                key={m.id}
                                style={{
                                  fontSize: '9px',
                                  fontWeight: 800,
                                  background: 'rgba(0,0,0,0.6)',
                                  color: '#fff',
                                  padding: '1px 4px',
                                  borderRadius: '3px',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  marginTop: '2px'
                                }}
                              >
                                ★ {m.incNo.split('-').slice(-2).join('-')}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', fontSize: '11px', color: 'var(--brand-slate-500)' }}>
              <span>← Likelihood: Very Rare (1) to Almost Certain (5)</span>
              <span>★ Factory issues placed in grid by calculated risk</span>
              <span>Severity: Negligible (1) to Severe Disaster (5) ↑</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 4. EXPLORER TABS & ADVANCED SEARCH FILTER DOCK ─── */}
      <div className="card mb-4" style={{ padding: '14px', borderRadius: 'var(--radius-md)' }}>
        {/* Category Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
          <button
            type="button"
            className={`parcel-pill-tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => { setActiveTab('all'); setMatrixFilter(null); }}
          >
            📋 {t('All Safety Records', 'সকল ইনসিডেন্ট', lang)} ({incidents.length})
          </button>
          <button
            type="button"
            className={`parcel-pill-tab ${activeTab === 'spill_leak' ? 'active' : ''}`}
            onClick={() => { setActiveTab('spill_leak'); setMatrixFilter(null); }}
          >
            🛢️ {t('Oil & Fuel Spills', 'তেল / বিটুমিন নিঃসরণ', lang)}
          </button>
          <button
            type="button"
            className={`parcel-pill-tab ${activeTab === 'near_miss' ? 'active' : ''}`}
            onClick={() => { setActiveTab('near_miss'); setMatrixFilter(null); }}
          >
            ⚡ {t('Near-Misses (Almost Happened)', 'নিয়ার-মিস ও বিপদ পর্যবেক্ষণ', lang)}
          </button>
          <button
            type="button"
            className={`parcel-pill-tab ${activeTab === 'first_aid' ? 'active' : ''}`}
            onClick={() => { setActiveTab('first_aid'); setMatrixFilter(null); }}
          >
            🩹 {t('First-Aid & Health', 'প্রাথমিক চিকিৎসা ও আঘাত', lang)}
          </button>
          <button
            type="button"
            className={`parcel-pill-tab ${activeTab === 'pressure_piping' ? 'active' : ''}`}
            onClick={() => { setActiveTab('pressure_piping'); setMatrixFilter(null); }}
          >
            ⚠️ {t('Pipes & Pressure Valves', 'চাপ ও পাইপলাইন', lang)}
          </button>
          <button
            type="button"
            className={`parcel-pill-tab ${activeTab === 'electrical_arc' ? 'active' : ''}`}
            onClick={() => { setActiveTab('electrical_arc'); setMatrixFilter(null); }}
          >
            ⚙️ {t('Electrical & Machinery', 'বৈদ্যুতিক ও মেকানিক্যাল', lang)}
          </button>
          <button
            type="button"
            className={`parcel-pill-tab ${activeTab === 'statutory' ? 'active' : ''}`}
            style={{ color: stats.statutory > 0 ? '#DC2626' : undefined }}
            onClick={() => { setActiveTab('statutory'); setMatrixFilter(null); }}
          >
            🚨 {t('Govt-Reportable (Explosives Dept)', 'সরকারি নোটিশ রিপোর্টযোগ্য', lang)} ({stats.statutory})
          </button>
        </div>

        {/* Search, Zone & Status Filter Controls */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', alignItems: 'center' }}>
          {/* Live Search */}
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--brand-slate-400)' }} />
            <input
              type="text"
              className="form-input"
              style={{ width: '100%', paddingLeft: '32px', height: '36px', fontSize: '12px' }}
              placeholder={t('Search by issue #, keyword, location, or reporter...', 'আইডি, স্থান বা বিবরণ লিখে খুঁজুন...', lang)}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: '8px', top: '9px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--brand-slate-400)' }}
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Zone Selector */}
          <div>
            <select
              className="form-input"
              style={{ width: '100%', height: '36px', fontSize: '12px' }}
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
            >
              {PLANT_ZONES.map((zone) => (
                <option key={zone} value={zone}>{zone}</option>
              ))}
            </select>
          </div>

          {/* Severity Selector */}
          <div>
            <select
              className="form-input"
              style={{ width: '100%', height: '36px', fontSize: '12px' }}
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(Number(e.target.value))}
            >
              <option value={0}>{t('All Severity Levels (1 to 5)', 'সকল তীব্রতা স্তর', lang)}</option>
              <option value={1}>{t('Level 1: Minor (Routine Housekeeping)', 'লেভেল ১: সামান্য', lang)}</option>
              <option value={2}>{t('Level 2: Low (Near-Miss / First-Aid)', 'লেভেল ২: নিম্ন', lang)}</option>
              <option value={3}>{t('Level 3: Moderate (Hydrocarbon Leak)', 'লেভেল ৩: মাঝারি', lang)}</option>
              <option value={4}>{t('Level 4: Major (High Heat / Pressure Trip)', 'লেভেল ৪: গুরুতর', lang)}</option>
              <option value={5}>{t('Level 5: Critical (Refinery Emergency)', 'লেভেল ৫: চরম জরুরি', lang)}</option>
            </select>
          </div>

          {/* Workflow Stage */}
          <div>
            <select
              className="form-input"
              style={{ width: '100%', height: '36px', fontSize: '12px' }}
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value as any)}
            >
              <option value="all">{t('All Workflow Stages', 'সকল পর্যায়', lang)}</option>
              <option value="reported">{t('1. Reported', '১. দাখিলকৃত', lang)}</option>
              <option value="triaged">{t('2. Risk Evaluated', '২. ঝুঁকি যাচাই', lang)}</option>
              <option value="under_investigation">{t('3. Root Cause Investigation', '৩. তদন্তাধীন', lang)}</option>
              <option value="capa_execution">{t('4. Fixing Problem (CAPA)', '৪. প্রতিকার চলমান', lang)}</option>
              <option value="closed">{t('5. Closed & Verified', '৫. সমাপ্ত ও অনুমোদিত', lang)}</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─── 5. INCIDENT REGISTRY CARDS ─── */}
      <div className="incident-list">
        {filteredIncidents.length === 0 ? (
          <div className="card text-center" style={{ padding: '40px 20px', color: 'var(--brand-slate-500)' }}>
            <ShieldCheck size={36} style={{ margin: '0 auto 10px', color: '#10B981', opacity: 0.8 }} />
            <h4 style={{ margin: '0 0 4px', fontSize: '15px', color: 'var(--brand-slate-800)' }}>
              {t('No safety incidents match current filter criteria', 'কোনো ইনসিডেন্ট পাওয়া যায়নি', lang)}
            </h4>
            <p style={{ margin: 0, fontSize: '12px' }}>
              {t('All factory plant zones operating under normal safety parameters.', 'সকল প্ল্যান্ট এলাকা স্বাভাবিক ও নিরাপদ অবস্থায় পরিচালিত হচ্ছে।', lang)}
            </p>
          </div>
        ) : (
          filteredIncidents.map((inc) => {
            const isExpanded = expandedIncidentId === inc.id;
            const completedCount = (inc.capaItems || []).filter(c => c.status === 'completed').length;
            const totalCapaCount = (inc.capaItems || []).length;
            const capaPct = totalCapaCount > 0 ? Math.round((completedCount / totalCapaCount) * 100) : (inc.capaStatus === 'closed' ? 100 : 0);
            const currentStage = inc.workflowStage || (inc.capaStatus === 'closed' ? 'closed' : 'capa_execution');
            const typeMeta = INCIDENT_TYPE_META[inc.incidentType] || INCIDENT_TYPE_META.near_miss;

            return (
              <div key={inc.id} className={`incident-card l${inc.level}`}>
                {/* Header Strip */}
                <div className="inc-hd">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span className={`badge ${inc.level >= 4 ? 'danger' : inc.level === 3 ? 'warn' : 'info'}`} style={{ fontSize: '10px', fontWeight: 800 }}>
                      Level {inc.level} · {inc.riskCategory ? inc.riskCategory.toUpperCase() : 'RISK'} (Score {inc.riskScore || (inc.level * 2)})
                    </span>

                    <span className="badge" style={{ background: 'var(--brand-slate-100)', color: typeMeta.color, border: `1px solid ${typeMeta.color}40`, fontSize: '10px', fontWeight: 700 }}>
                      {typeMeta.icon} {typeMeta.label}
                    </span>

                    <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '11px', color: 'var(--brand-slate-600)' }}>
                      {inc.incNo}
                    </span>

                    {inc.statutoryReportable && (
                      <span className="badge danger" style={{ animation: 'pulse 1.5s infinite', fontSize: '9.5px' }}>
                        🚨 {t('Govt Report (Explosives Dept)', 'সরকারিভাবে রিপোর্টযোগ্য', lang)}
                      </span>
                    )}

                    {inc.fiveWhys && (
                      <span className="badge gold" style={{ fontSize: '9.5px' }}>
                        ✓ Root Cause Solved (5-Whys: {inc.fiveWhys.fishboneCategory})
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--brand-slate-400)' }}>
                    <span>{inc.shift}</span>
                    <span>•</span>
                    <span>{inc.date}</span>
                  </div>
                </div>

                {/* Workflow Progression Pipeline */}
                <div className="hse-workflow-pipeline mb-2">
                  <div className={`hse-pipeline-step ${currentStage === 'reported' ? 'active' : 'completed'}`}>
                    1. {t('Reported', 'দাখিল', lang)}
                  </div>
                  <ChevronRight size={10} color="#94A3B8" />
                  <div className={`hse-pipeline-step ${currentStage === 'triaged' ? 'active' : currentStage === 'reported' ? '' : 'completed'}`}>
                    2. {t('Risk Evaluated', 'ঝুঁকি যাচাই', lang)}
                  </div>
                  <ChevronRight size={10} color="#94A3B8" />
                  <div className={`hse-pipeline-step ${currentStage === 'under_investigation' ? 'active' : (currentStage === 'capa_execution' || currentStage === 'closed') ? 'completed' : ''}`}>
                    3. {t('Root Cause Found', 'তদন্ত ও আরসিএ', lang)}
                  </div>
                  <ChevronRight size={10} color="#94A3B8" />
                  <div className={`hse-pipeline-step ${currentStage === 'capa_execution' ? 'active' : currentStage === 'closed' ? 'completed' : ''}`}>
                    4. {t('Fixing Problem (CAPA)', 'সিএপিএ প্রয়োগ', lang)}
                  </div>
                  <ChevronRight size={10} color="#94A3B8" />
                  <div className={`hse-pipeline-step ${currentStage === 'closed' ? 'active' : ''}`}>
                    5. {t('Approved & Closed', 'সমাপ্ত ও অনুমোদিত', lang)}
                  </div>
                </div>

                {/* Title & Location */}
                <h3 className="inc-title" style={{ fontSize: '15px', margin: '4px 0 2px' }}>
                  {t(inc.title, inc.titleBn, lang)}
                </h3>

                <div className="inc-meta">
                  <span>📍 <strong>{inc.plantZone || 'Keraniganj Complex'}</strong> • {inc.location}</span>
                  <span style={{ marginLeft: '12px' }}>
                    Reported by: <strong>{inc.reportedBy}</strong>
                  </span>
                </div>

                {/* Immediate Containment Banner */}
                {inc.immediateActionsTaken && (
                  <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '10px 12px', borderRadius: '6px', margin: '8px 0', fontSize: '11.5px', color: '#166534' }}>
                    <div style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                      <ShieldCheck size={14} color="#15803D" />
                      {t('Immediate Safety Containment Actions Executed:', 'তাৎক্ষণিক গৃহীত নিরাপত্তা পদক্ষেপ:', lang)}
                    </div>
                    <div>{inc.immediateActionsTaken}</div>
                  </div>
                )}

                {/* Injured Person Info (if any) */}
                {inc.personsInvolved && inc.personsInvolved.some(p => p.involvementType === 'injured') && (
                  <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', padding: '10px 12px', borderRadius: '6px', margin: '8px 0', fontSize: '11.5px', color: '#991B1B' }}>
                    <div style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                      <HeartPulse size={14} color="#DC2626" />
                      {t('First-Aid / Occupational Health Record:', 'পেশাগত স্বাস্থ্য ও প্রাথমিক চিকিৎসা বিবরণ:', lang)}
                    </div>
                    {inc.personsInvolved.filter(p => p.involvementType === 'injured').map((p, idx) => (
                      <div key={idx}>
                        <strong>{p.name}</strong> ({p.role}) — {p.injuryNature}. <em>{p.treatmentGiven}</em>
                      </div>
                    ))}
                  </div>
                )}

                {/* Root Cause Analysis Summary */}
                <div style={{ background: 'var(--brand-slate-100)', padding: '10px 12px', borderRadius: '6px', margin: '8px 0', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '6px' }}>
                    <div>
                      <strong>{t('Root Cause:', 'মূল কারণ:', lang)}</strong> {inc.rootCause}
                    </div>
                    {inc.fiveWhys?.fishboneCategory && (
                      <span className="badge" style={{ background: '#DBEAFE', color: '#1D4ED8', fontSize: '9.5px', fontWeight: 800 }}>
                        {inc.fiveWhys.fishboneCategory.toUpperCase()} CAUSE
                      </span>
                    )}
                  </div>
                </div>

                {/* CAPA Progress Bar & Summary */}
                <div style={{ margin: '10px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                      <CheckSquare size={13} color="var(--brand-crimson)" />
                      <span>{t('Corrective & Preventive Actions (CAPA):', 'সংশোধনমূলক ও প্রতিরোধমূলক ব্যবস্থা:', lang)}</span>
                      <span style={{ color: 'var(--brand-slate-500)', fontWeight: 500 }}>
                        ({completedCount}/{totalCapaCount || 1} {t('Completed', 'সম্পন্ন', lang)})
                      </span>
                    </div>
                    <span style={{ fontWeight: 800, color: capaPct === 100 ? '#15803D' : '#D97706' }}>
                      {capaPct}%
                    </span>
                  </div>

                  <div style={{ height: '6px', background: 'var(--brand-slate-200)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${capaPct}%`,
                        background: capaPct === 100 ? '#10B981' : 'linear-gradient(90deg, #F59E0B 0%, #10B981 100%)',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>

                  {/* Expandable CAPA Items */}
                  {isExpanded && inc.capaItems && inc.capaItems.length > 0 && (
                    <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {inc.capaItems.map((c) => (
                        <div
                          key={c.id}
                          style={{
                            background: c.status === 'completed' ? '#F0FDF4' : '#FFFDF5',
                            border: c.status === 'completed' ? '1px solid #BBF7D0' : '1px solid #FDE68A',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '8px',
                            fontSize: '11.5px',
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span
                                className="badge"
                                style={{
                                  fontSize: '8.5px',
                                  padding: '1px 5px',
                                  background: c.actionType === 'immediate_containment' ? '#EFF6FF' : c.actionType === 'preventive' ? '#F5F3FF' : '#FEF3C7',
                                  color: c.actionType === 'immediate_containment' ? '#1D4ED8' : c.actionType === 'preventive' ? '#7C3AED' : '#B45309',
                                }}
                              >
                                {c.actionType.replace('_', ' ').toUpperCase()}
                              </span>
                              <strong style={{ color: 'var(--brand-slate-900)' }}>{c.description}</strong>
                            </div>
                            <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-500)', marginTop: '2px' }}>
                              Owner: <strong>{c.owner}</strong> • Target: {c.dueDate}
                              {c.verificationEvidence && <span style={{ color: '#059669', marginLeft: '8px' }}>✓ {c.verificationEvidence}</span>}
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {c.status === 'completed' ? (
                              <span className="badge success" style={{ fontSize: '9px' }}>✓ COMPLETED</span>
                            ) : (
                              <button
                                type="button"
                                className="btn-sm-ghost"
                                style={{ fontSize: '10.5px', padding: '3px 8px', background: '#10B981', color: '#fff' }}
                                onClick={() => toggleCapaStatus(inc.id, c.id, 'completed', 'Verified compliant on site')}
                              >
                                <Check size={11} /> {t('Mark Done', 'সম্পন্ন করুন', lang)}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Closure Stamp (if closed) */}
                {inc.closureSignOff && (
                  <div style={{ background: '#FFFDF5', border: '1.5px dashed #D4AF37', borderRadius: '6px', padding: '8px 12px', margin: '8px 0', fontSize: '11px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Award size={16} color="#D4AF37" />
                      <div>
                        <strong>ISO 45001 Closure Verified:</strong> {inc.closureSignOff.remarks}
                      </div>
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#92400E' }}>
                      Safety: {inc.closureSignOff.safetyOfficerName} • GM: {inc.closureSignOff.gmName}
                    </div>
                  </div>
                )}

                {/* Footer Controls */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--brand-slate-200)' }}>
                  <button
                    type="button"
                    className="btn-sm-ghost"
                    style={{ fontSize: '11px', padding: '4px 8px', color: 'var(--brand-slate-600)' }}
                    onClick={() => setExpandedIncidentId(isExpanded ? null : inc.id)}
                  >
                    {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    {isExpanded ? t('Hide CAPA Items', 'সিএপিএ সংক্ষেপ করুন', lang) : t('View Itemized Actions', 'বিস্তারিত পদক্ষেপ দেখুন', lang)} ({totalCapaCount})
                  </button>

                  <div className="flex-gap" style={{ flexWrap: 'wrap' }}>
                    {/* 5-Whys RCA Studio */}
                    <button
                      type="button"
                      className="btn-sm-ghost"
                      style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' }}
                      onClick={() => openRcaModal(inc)}
                    >
                      <HelpCircle size={12} color="#D97706" />
                      {inc.fiveWhys ? t('5-Whys & Fishbone', '৫-হোয়াইজ ও ফিশবোন', lang) : t('Run RCA', 'কারণ অনুসন্ধান', lang)}
                    </button>

                    {/* Manage CAPA Tasks */}
                    <button
                      type="button"
                      className="btn-sm-ghost"
                      style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' }}
                      onClick={() => setSelectedCapaIncident(inc)}
                    >
                      <CheckSquare size={12} color="#2563EB" />
                      {t('Manage CAPA', 'সিএপিএ পরিচালনা', lang)}
                    </button>

                    {/* Official Statutory Dossier */}
                    <button
                      type="button"
                      className="btn-sm-ghost"
                      style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' }}
                      onClick={() => setSelectedDossierIncident(inc)}
                    >
                      <FileText size={12} color="var(--brand-crimson)" />
                      {t('Govt / DoE Dossier', 'সরকারি ডসিয়ার', lang)}
                    </button>

                    {/* Executive Sign-off and Close */}
                    {inc.capaStatus !== 'closed' && (role === 'plant_gm' || role === 'chairman' || role === 'transport_admin') && (
                      <button
                        type="button"
                        className="btn-primary"
                        style={{ fontSize: '11px', padding: '4px 10px', background: 'linear-gradient(135deg, #059669 0%, #047857 100%)' }}
                        onClick={() => setSelectedSignoffIncident(inc)}
                      >
                        <CheckCircle size={12} />
                        {t('Verify & Close Incident', 'যাচাই ও সমাপ্তি ঘোষণা', lang)}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ─── MODAL 1: COMPREHENSIVE INDUSTRIAL REPORTING WIZARD ─── */}
      {showLogWizard && (
        <div className="modal-bg" onClick={() => setShowLogWizard(false)}>
          <div className="modal" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-hd" style={{ background: 'linear-gradient(135deg, #0B132B 0%, #1A2649 100%)', color: '#fff' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldAlert size={18} color="#FBBF24" />
                  <h3 style={{ color: '#fff', margin: 0 }}>
                    {t('Industrial Incident & Near-Miss Reporting Wizard', 'কারখানা ইনসিডেন্ট ও নিয়ার-মিস রিপোর্টিং উইজার্ড', lang)}
                  </h3>
                </div>
                <div style={{ fontSize: '11px', color: '#CBD5E1', marginTop: '2px' }}>
                  Step {wizardStep} of 3: {wizardStep === 1 ? 'Event Category & Plant Zone' : wizardStep === 2 ? 'Severity & Immediate Containment' : 'Personnel & Evidence'}
                </div>
              </div>
              <button className="modal-close" style={{ color: '#fff' }} onClick={() => setShowLogWizard(false)}>×</button>
            </div>

            <div className="modal-body" style={{ maxHeight: '76vh', overflowY: 'auto' }}>
              {/* Wizard Steps Tracker */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '18px', borderBottom: '1px solid var(--brand-slate-200)', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: wizardStep === 1 ? 800 : 500, color: wizardStep === 1 ? 'var(--brand-crimson)' : 'var(--brand-slate-500)' }}>
                  <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: wizardStep === 1 ? 'var(--brand-crimson)' : '#CBD5E1', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800 }}>1</span>
                  <span>1. Event Details</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: wizardStep === 2 ? 800 : 500, color: wizardStep === 2 ? 'var(--brand-crimson)' : 'var(--brand-slate-500)' }}>
                  <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: wizardStep === 2 ? 'var(--brand-crimson)' : '#CBD5E1', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800 }}>2</span>
                  <span>2. Risk & Containment</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: wizardStep === 3 ? 800 : 500, color: wizardStep === 3 ? 'var(--brand-crimson)' : 'var(--brand-slate-500)' }}>
                  <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: wizardStep === 3 ? 'var(--brand-crimson)' : '#CBD5E1', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800 }}>3</span>
                  <span>3. People & Evidence</span>
                </div>
              </div>

              {/* STEP 1: EVENT DETAILS */}
              {wizardStep === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '12px', fontWeight: 700 }}>{t('Incident / Event Classification', 'ঘটনার শ্রেণীবিভাগ', lang)}</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '6px', marginTop: '4px' }}>
                      {(Object.keys(INCIDENT_TYPE_META) as IncidentType[]).map((type) => {
                        const m = INCIDENT_TYPE_META[type];
                        const isSelected = wizardType === type;
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setWizardType(type)}
                            style={{
                              padding: '8px 10px',
                              borderRadius: '6px',
                              border: isSelected ? `2px solid ${m.color}` : '1px solid var(--brand-slate-200)',
                              background: isSelected ? `${m.color}15` : '#fff',
                              color: isSelected ? m.color : 'var(--brand-slate-700)',
                              fontWeight: isSelected ? 800 : 600,
                              fontSize: '11px',
                              textAlign: 'left',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            <span>{m.icon}</span>
                            <span>{m.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '12px', fontWeight: 700 }}>{t('Incident Headline / Summary', 'ঘটনার শিরোনাম', lang)}</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Minor thermal fluid drip discovered on flange V-204"
                      value={wizardTitle}
                      onChange={(e) => setWizardTitle(e.target.value)}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label style={{ fontSize: '12px', fontWeight: 700 }}>{t('Factory Plant Zone', 'প্ল্যান্টের এলাকা', lang)}</label>
                      <select
                        className="form-input"
                        value={wizardZone}
                        onChange={(e) => {
                          setWizardZone(e.target.value);
                          setWizardLocation(`${e.target.value}, Specific Bay`);
                        }}
                      >
                        {PLANT_ZONES.filter(z => z !== 'All Plant Zones').map((z) => (
                          <option key={z} value={z}>{z}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label style={{ fontSize: '12px', fontWeight: 700 }}>{t('Specific Equipment / Bay Location', 'সুনির্দিষ্ট সরঞ্জাম বা বে', lang)}</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Tank TK-102 lower discharge valve"
                        value={wizardLocation}
                        onChange={(e) => setWizardLocation(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label style={{ fontSize: '12px', fontWeight: 700 }}>{t('Operating Shift', 'অপারেটিং শিফট', lang)}</label>
                      <select
                        className="form-input"
                        value={wizardShift}
                        onChange={(e) => setWizardShift(e.target.value as any)}
                      >
                        <option value="Morning Shift (07:00 - 15:00)">Morning Shift (07:00 - 15:00)</option>
                        <option value="Evening Shift (15:00 - 23:00)">Evening Shift (15:00 - 23:00)</option>
                        <option value="Night Shift (23:00 - 07:00)">Night Shift (23:00 - 07:00)</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label style={{ fontSize: '12px', fontWeight: 700 }}>{t('Reporter Persona', 'প্রতিবেদনকারী', lang)}</label>
                      <input
                        type="text"
                        className="form-input"
                        disabled
                        value={`${currentPersona.name} (${currentPersona.label} · ${currentPersona.empId})`}
                        style={{ background: 'var(--brand-slate-100)', color: 'var(--brand-slate-600)' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: RISK & IMMEDIATE CONTAINMENT */}
              {wizardStep === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="form-row">
                    <div className="form-group">
                      <label style={{ fontSize: '12px', fontWeight: 700 }}>{t('Consequence Severity (Level 1 to 5)', 'তীব্রতা স্তর', lang)}</label>
                      <select
                        className="form-input"
                        value={wizardSeverity}
                        onChange={(e) => setWizardSeverity(Number(e.target.value) as any)}
                      >
                        <option value={1}>Level 1: Minor (Routine Housekeeping / Negligible)</option>
                        <option value={2}>Level 2: Low (Near-Miss / First-Aid Case)</option>
                        <option value={3}>Level 3: Moderate (Hydrocarbon Leak / Equipment Interruption)</option>
                        <option value={4}>Level 4: Major (High Heat / Pressure Line Emergency Alert)</option>
                        <option value={5}>Level 5: Critical (Refinery Shutdown / Disaster Protocol)</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label style={{ fontSize: '12px', fontWeight: 700 }}>{t('Occurrence Likelihood / Probability', 'পুনরাবৃত্তির সম্ভাবনা', lang)}</label>
                      <select
                        className="form-input"
                        value={wizardLikelihood}
                        onChange={(e) => setWizardLikelihood(Number(e.target.value) as any)}
                      >
                        <option value={1}>1: Rare (Happens once in 5+ years)</option>
                        <option value={2}>2: Unlikely (Has happened once in plant history)</option>
                        <option value={3}>3: Possible (Could happen under upset conditions)</option>
                        <option value={4}>4: Likely (Frequent recurrence without barrier)</option>
                        <option value={5}>5: Almost Certain (Impending recurrence)</option>
                      </select>
                    </div>
                  </div>

                  {/* Dynamic Risk Score Preview */}
                  <div
                    style={{
                      background: wizardSeverity * wizardLikelihood >= 15 ? '#FEF2F2' : wizardSeverity * wizardLikelihood >= 10 ? '#FFF7ED' : '#F0FDF4',
                      border: wizardSeverity * wizardLikelihood >= 15 ? '1px solid #F87171' : wizardSeverity * wizardLikelihood >= 10 ? '1px solid #FDBA74' : '1px solid #86EFAC',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-slate-600)', textTransform: 'uppercase' }}>
                        Calculated Petroleum Risk Rating:
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: 900, color: wizardSeverity * wizardLikelihood >= 15 ? '#991B1B' : wizardSeverity * wizardLikelihood >= 10 ? '#C2410C' : '#15803D' }}>
                        Score: {wizardSeverity * wizardLikelihood} / 25 ({wizardSeverity * wizardLikelihood >= 15 ? 'EXTREME RISK' : wizardSeverity * wizardLikelihood >= 10 ? 'HIGH RISK' : wizardSeverity * wizardLikelihood >= 5 ? 'MEDIUM RISK' : 'LOW RISK'})
                      </div>
                    </div>
                    {wizardSeverity >= 3 && (
                      <span className="badge danger" style={{ fontSize: '10px' }}>
                        ⚠️ Triggers 24-hr Statutory DoE Notice
                      </span>
                    )}
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '12px', fontWeight: 700 }}>{t('Immediate Actions & Safety Containment Taken', 'তাৎক্ষণিক গৃহীত পদক্ষেপ ও নিরাপত্তা ব্যবস্থা', lang)}</label>
                    <textarea
                      rows={3}
                      className="form-input"
                      placeholder="e.g. Manually closed isolation valve V-204, deployed oil-absorbent boom, cordoned 10-meter perimeter with yellow danger barrier tape..."
                      value={wizardImmediateActions}
                      onChange={(e) => setWizardImmediateActions(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* STEP 3: PERSONNEL & EVIDENCE */}
              {wizardStep === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      id="hasInjury"
                      checked={wizardHasInjury}
                      onChange={(e) => setWizardHasInjury(e.target.checked)}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <label htmlFor="hasInjury" style={{ fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}>
                      {t('Did this event involve an injury or first-aid treatment to any worker?', 'এই ঘটনায় কোনো কর্মী আহত হয়েছেন বা প্রাথমিক চিকিৎসা প্রয়োজন হয়েছে?', lang)}
                    </label>
                  </div>

                  {wizardHasInjury && (
                    <div style={{ background: '#FFFDF5', border: '1px solid #FDE68A', padding: '12px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div className="form-group">
                        <label style={{ fontSize: '11.5px', fontWeight: 700 }}>{t('Select Injured Personnel', 'আহত কর্মী নির্বাচন', lang)}</label>
                        <select
                          className="form-input"
                          value={wizardInjuredEmpId}
                          onChange={(e) => setWizardInjuredEmpId(e.target.value)}
                        >
                          <option value="">-- Choose Worker from Staff Directory --</option>
                          {activeEmployees.map((emp) => (
                            <option key={emp.id} value={emp.id}>{emp.name} ({emp.designation} · {emp.id})</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label style={{ fontSize: '11.5px', fontWeight: 700 }}>{t('Nature of Injury', 'আঘাতের ধরন', lang)}</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. Minor thermal burn on right forearm / thumb contusion"
                            value={wizardInjuryNature}
                            onChange={(e) => setWizardInjuryNature(e.target.value)}
                          />
                        </div>

                        <div className="form-group">
                          <label style={{ fontSize: '11.5px', fontWeight: 700 }}>{t('First-Aid / Clinic Treatment Given', 'প্রদত্ত চিকিৎসা', lang)}</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. Burnol applied; cold pack administered at plant clinic"
                            value={wizardTreatmentGiven}
                            onChange={(e) => setWizardTreatmentGiven(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="form-group">
                    <label style={{ fontSize: '12px', fontWeight: 700 }}>{t('Witnesses Present on Duty', 'প্রত্যক্ষদর্শী', lang)}</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Mizanur Rahman (Security), Kalam Miah (Driver)"
                      value={wizardWitnessName}
                      onChange={(e) => setWizardWitnessName(e.target.value)}
                    />
                  </div>

                  {/* Photo Simulation */}
                  <div
                    style={{
                      border: '1.5px dashed var(--brand-slate-300)',
                      borderRadius: '8px',
                      padding: '14px',
                      textAlign: 'center',
                      background: wizardSimulatePhoto ? '#F0FDF4' : '#FAFAFA',
                      cursor: 'pointer',
                    }}
                    onClick={() => setWizardSimulatePhoto(!wizardSimulatePhoto)}
                  >
                    <Camera size={24} style={{ color: wizardSimulatePhoto ? '#15803D' : 'var(--brand-slate-400)', margin: '0 auto 6px' }} />
                    <div style={{ fontSize: '12px', fontWeight: 700, color: wizardSimulatePhoto ? '#15803D' : 'var(--brand-slate-700)' }}>
                      {wizardSimulatePhoto ? '✓ 2 Photographs Attached (Site Perimeter & Valve Flange)' : '+ Click to Simulate On-Site Camera Photo Evidence'}
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-400)', marginTop: '2px' }}>
                      JPG, PNG, PDF up to 15MB • Time-stamped geo-coordinates will be embedded
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-ft">
              {wizardStep > 1 && (
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setWizardStep((prev) => (prev - 1) as any)}
                >
                  ← {t('Back', 'পূর্ববর্তী', lang)}
                </button>
              )}

              <button
                type="button"
                className="btn-sm-ghost"
                onClick={() => setShowLogWizard(false)}
              >
                {t('Cancel', 'বাতিল', lang)}
              </button>

              {wizardStep < 3 ? (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    if (wizardStep === 1 && !wizardTitle.trim()) {
                      showToast(t('Please provide incident headline.', 'শিরোনাম পূরণ করুন।', lang), 'info');
                      return;
                    }
                    setWizardStep((prev) => (prev + 1) as any);
                  }}
                >
                  {t('Continue', 'পরবর্তী ধাপ', lang)} →
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-primary"
                  style={{ background: 'linear-gradient(135deg, #A51C30 0%, #7F1424 100%)' }}
                  onClick={handleWizardSubmit}
                >
                  <ShieldAlert size={15} />
                  {t('Log Incident & Trigger Response', 'ইনসিডেন্ট নথিভুক্ত ও অ্যালার্ট জারি করুন', lang)}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: 1-MINUTE GOOD CATCH / HAZARD REPORTER ─── */}
      {showQuickHazardModal && (
        <div className="modal-bg" onClick={() => setShowQuickHazardModal(false)}>
          <div className="modal" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-hd" style={{ background: '#7C3AED', color: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={18} color="#FDE047" />
                <h3 style={{ color: '#fff', margin: 0 }}>
                  {t('1-Minute "Good Catch" / Hazard Observation', '১-মিনিট বিপদ ও নিয়ার-মিস পর্যবেক্ষণ রিপোর্ট', lang)}
                </h3>
              </div>
              <button className="modal-close" style={{ color: '#fff' }} onClick={() => setShowQuickHazardModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <div style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', padding: '10px 12px', borderRadius: '6px', fontSize: '11.5px', color: '#6D28D9', marginBottom: '14px' }}>
                💡 <strong>Zero-Blame Culture:</strong> Reporting an unsafe condition or near-miss protects everyone. Observations are logged positively in the refinery safety recognition roster.
              </div>

              <div className="form-group mb-3">
                <label style={{ fontSize: '12px', fontWeight: 700 }}>{t('What unsafe condition did you spot?', 'কী বিপদ পর্যবেক্ষণ করেছেন?', lang)}</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Loose handrail near Unit-2 staircase / missing fire extinguisher seal"
                  value={quickHazardTitle}
                  onChange={(e) => setQuickHazardTitle(e.target.value)}
                />
              </div>

              <div className="form-group mb-3">
                <label style={{ fontSize: '12px', fontWeight: 700 }}>{t('Plant Zone / Location', 'প্ল্যান্টের স্থান', lang)}</label>
                <select
                  className="form-input"
                  value={quickHazardZone}
                  onChange={(e) => setQuickHazardZone(e.target.value)}
                >
                  {PLANT_ZONES.filter(z => z !== 'All Plant Zones').map((z) => (
                    <option key={z} value={z}>{z}</option>
                  ))}
                </select>
              </div>

              <div className="form-group mb-3">
                <label style={{ fontSize: '12px', fontWeight: 700 }}>{t('Brief Observation Details', 'বিবরণ', lang)}</label>
                <textarea
                  rows={2}
                  className="form-input"
                  placeholder="Describe where it is and what could happen if uncorrected..."
                  value={quickHazardDesc}
                  onChange={(e) => setQuickHazardDesc(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '12px', fontWeight: 700 }}>{t('Suggested Immediate or Preventative Fix', 'প্রস্তাবিত সমাধান', lang)}</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Tighten anchor bolts / install replacement safety tag"
                  value={quickHazardFix}
                  onChange={(e) => setQuickHazardFix(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-ft">
              <button className="btn-sm-ghost" onClick={() => setShowQuickHazardModal(false)}>{t('Cancel', 'বাতিল', lang)}</button>
              <button
                type="button"
                className="btn-primary"
                style={{ background: '#7C3AED', borderColor: '#7C3AED' }}
                onClick={handleQuickHazardSubmit}
              >
                <Send size={13} />
                {t('Submit Good Catch', 'জমা দিন', lang)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: 5-WHYS & ISHIKAWA FISHBONE RCA STUDIO ─── */}
      {selectedRcaIncident && (
        <div className="modal-bg" onClick={() => setSelectedRcaIncident(null)}>
          <div className="modal" style={{ maxWidth: '720px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-hd" style={{ background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)', color: '#fff' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <HelpCircle size={18} color="#FBBF24" />
                  <h3 style={{ color: '#fff', margin: 0 }}>
                    {t('Problem Root Cause Finder (5-Whys & Fishbone Diagram)', 'সমস্যার মূল কারণ অনুসন্ধান (৫-কেন ও ফিশবোন চার্ট)', lang)}
                  </h3>
                </div>
                <div style={{ fontSize: '11px', color: '#CBD5E1', marginTop: '2px' }}>
                  {selectedRcaIncident.incNo} • {selectedRcaIncident.title}
                </div>
              </div>
              <button className="modal-close" style={{ color: '#fff' }} onClick={() => setSelectedRcaIncident(null)}>×</button>
            </div>

            {/* RCA Sub-Navigation */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--brand-slate-200)', background: 'var(--brand-slate-100)', padding: '0 16px' }}>
              <button
                type="button"
                onClick={() => setRcaSubTab('5whys')}
                style={{
                  padding: '10px 16px',
                  border: 'none',
                  background: 'transparent',
                  borderBottom: rcaSubTab === '5whys' ? '3px solid var(--brand-crimson)' : 'none',
                  fontWeight: rcaSubTab === '5whys' ? 800 : 600,
                  color: rcaSubTab === '5whys' ? 'var(--brand-crimson)' : 'var(--brand-slate-600)',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                1. {t('Step-by-Step "Why" Investigation (5-Whys)', 'ধাপে ধাপে "কেন" অনুসন্ধান (৫-কেন)', lang)}
              </button>
              <button
                type="button"
                onClick={() => setRcaSubTab('fishbone')}
                style={{
                  padding: '10px 16px',
                  border: 'none',
                  background: 'transparent',
                  borderBottom: rcaSubTab === 'fishbone' ? '3px solid var(--brand-crimson)' : 'none',
                  fontWeight: rcaSubTab === 'fishbone' ? 800 : 600,
                  color: rcaSubTab === 'fishbone' ? 'var(--brand-crimson)' : 'var(--brand-slate-600)',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                2. {t('Cause Categories (People, Machinery, Process)', 'কারণ শ্রেণী (কর্মী, যন্ত্রপাতি, পদ্ধতি)', lang)}
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
              {rcaSubTab === '5whys' ? (
                <div>
                  <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: '10px 14px', borderRadius: '6px', marginBottom: '16px', fontSize: '12px', color: '#92400E' }}>
                    💡 <strong>Easy Investigation Method:</strong> By asking "Why did this happen?" a few times in a row, we find the real underlying cause instead of just treating surface symptoms.
                  </div>

                  <div className="form-group mb-3">
                    <label style={{ fontSize: '12px', fontWeight: 700 }}>{t('Primary Cause Category', 'প্রধান কারণ শ্রেণী', lang)}</label>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                      {(['Equipment', 'Procedure', 'Material', 'Staffing', 'Inspection', 'Weather'] as const).map(cat => (
                        <button
                          key={cat}
                          type="button"
                          style={{
                            fontSize: '11px',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: rcaCategory === cat ? '2px solid #1D4ED8' : '1px solid var(--brand-slate-200)',
                            background: rcaCategory === cat ? '#EFF6FF' : '#FFF',
                            fontWeight: rcaCategory === cat ? 800 : 600,
                            color: rcaCategory === cat ? '#1D4ED8' : 'var(--brand-slate-700)',
                            cursor: 'pointer',
                          }}
                          onClick={() => setRcaCategory(cat)}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 5 Whys Visual Stack */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ borderLeft: '3px solid #60A5FA', paddingLeft: '12px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 800, color: '#1D4ED8' }}>1. Why did the direct physical problem occur?</label>
                      <input
                        type="text"
                        className="form-input"
                        style={{ fontSize: '12px', width: '100%', marginTop: '3px' }}
                        value={rcaWhy1}
                        onChange={(e) => setRcaWhy1(e.target.value)}
                        placeholder="e.g. Bitumen seeped past lower flange drain valve during shift walk"
                      />
                    </div>

                    <div style={{ borderLeft: '3px solid #3B82F6', paddingLeft: '12px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 800, color: '#1D4ED8' }}>2. Why did that happen?</label>
                      <input
                        type="text"
                        className="form-input"
                        style={{ fontSize: '12px', width: '100%', marginTop: '3px' }}
                        value={rcaWhy2}
                        onChange={(e) => setRcaWhy2(e.target.value)}
                        placeholder="e.g. Sealing gasket experienced thermal cracking and lost compression"
                      />
                    </div>

                    <div style={{ borderLeft: '3px solid #2563EB', paddingLeft: '12px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 800, color: '#1D4ED8' }}>3. Why did that happen?</label>
                      <input
                        type="text"
                        className="form-input"
                        style={{ fontSize: '12px', width: '100%', marginTop: '3px' }}
                        value={rcaWhy3}
                        onChange={(e) => setRcaWhy3(e.target.value)}
                        placeholder="e.g. Nitrile rubber gasket fitted instead of high-temperature Viton gasket"
                      />
                    </div>

                    <div style={{ borderLeft: '3px solid #1D4ED8', paddingLeft: '12px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 800, color: '#1D4ED8' }}>4. Why did that happen?</label>
                      <input
                        type="text"
                        className="form-input"
                        style={{ fontSize: '12px', width: '100%', marginTop: '3px' }}
                        value={rcaWhy4}
                        onChange={(e) => setRcaWhy4(e.target.value)}
                        placeholder="e.g. Viton seals were depleted in the store room during last turnaround"
                      />
                    </div>

                    <div style={{ borderLeft: '3px solid #B91C1C', paddingLeft: '12px', background: '#FEF2F2', padding: '10px 12px', borderRadius: '6px' }}>
                      <label style={{ fontSize: '11.5px', fontWeight: 900, color: '#B91C1C' }}>5. Systemic Root Cause (The Core Preventable Flaw):</label>
                      <textarea
                        rows={2}
                        className="form-input"
                        style={{ fontSize: '12px', width: '100%', marginTop: '4px', borderColor: '#FCA5A5' }}
                        value={rcaWhy5}
                        onChange={(e) => setRcaWhy5(e.target.value)}
                        placeholder="e.g. Enforce mandatory ERP safety stock of 10 Viton gaskets and require material verification in turnaround checklist."
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ background: '#F8FAFC', border: '1px solid var(--brand-slate-200)', padding: '10px 14px', borderRadius: '6px', marginBottom: '16px', fontSize: '12px', color: 'var(--brand-slate-700)' }}>
                    📊 <strong>Ishikawa 6M Cause Mapping:</strong> Map contributing factors across the 6 industrial dimensions (People, Machine, Method, Material, Measurement, Environment).
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                    <div className="form-group">
                      <label style={{ fontSize: '11.5px', fontWeight: 700 }}>👤 People (Training / Fatigue / Supervision)</label>
                      <input
                        type="text"
                        className="form-input"
                        value={fishPeople}
                        onChange={(e) => setFishPeople(e.target.value)}
                        placeholder="e.g. Night turnaround crew under time pressure"
                      />
                    </div>

                    <div className="form-group">
                      <label style={{ fontSize: '11.5px', fontWeight: 700 }}>⚙️ Machine (Equipment / Flanges / Valves)</label>
                      <input
                        type="text"
                        className="form-input"
                        value={fishMachine}
                        onChange={(e) => setFishMachine(e.target.value)}
                        placeholder="e.g. Tank TK-102 bottom discharge flange"
                      />
                    </div>

                    <div className="form-group">
                      <label style={{ fontSize: '11.5px', fontWeight: 700 }}>📋 Method (Procedures / SOPs / Checklists)</label>
                      <input
                        type="text"
                        className="form-input"
                        value={fishMethod}
                        onChange={(e) => setFishMethod(e.target.value)}
                        placeholder="e.g. Turnaround checklist lacked gasket rating signoff"
                      />
                    </div>

                    <div className="form-group">
                      <label style={{ fontSize: '11.5px', fontWeight: 700 }}>📦 Material (Chemicals / Gaskets / Spares)</label>
                      <input
                        type="text"
                        className="form-input"
                        value={fishMaterial}
                        onChange={(e) => setFishMaterial(e.target.value)}
                        placeholder="e.g. Standard nitrile used instead of Viton 240°C"
                      />
                    </div>

                    <div className="form-group">
                      <label style={{ fontSize: '11.5px', fontWeight: 700 }}>📐 Measurement (Sensors / Inspections)</label>
                      <input
                        type="text"
                        className="form-input"
                        value={fishMeasurement}
                        onChange={(e) => setFishMeasurement(e.target.value)}
                        placeholder="e.g. Flange thermographic imaging omitted"
                      />
                    </div>

                    <div className="form-group">
                      <label style={{ fontSize: '11.5px', fontWeight: 700 }}>🌦️ Environment (Heat / Rain / Lighting)</label>
                      <input
                        type="text"
                        className="form-input"
                        value={fishEnv}
                        onChange={(e) => setFishEnv(e.target.value)}
                        placeholder="e.g. Continuous 180°C thermal cycling"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-ft">
              <button className="btn-sm-ghost" onClick={() => setSelectedRcaIncident(null)}>{t('Cancel', 'বাতিল', lang)}</button>
              <button className="btn-primary" onClick={handleSaveRca}>
                <Check size={14} />
                {t('Commit RCA Findings to Ledger', 'আরসিএ সংরক্ষণ করুন', lang)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 4: MULTI-TASK CAPA MANAGEMENT MODAL ─── */}
      {selectedCapaIncident && (
        <div className="modal-bg" onClick={() => setSelectedCapaIncident(null)}>
          <div className="modal" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-hd" style={{ background: '#0F172A', color: '#fff' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckSquare size={18} color="#34D399" />
                  <h3 style={{ color: '#fff', margin: 0 }}>
                    {t('Safety Action Manager (Fix & Prevent - CAPA)', 'নিরাপত্তা প্রতিকার ও প্রতিরোধমূলক কাজ (CAPA)', lang)}
                  </h3>
                </div>
                <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
                  {selectedCapaIncident.incNo} • {selectedCapaIncident.title}
                </div>
              </div>
              <button className="modal-close" style={{ color: '#fff' }} onClick={() => setSelectedCapaIncident(null)}>×</button>
            </div>

            <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '9px 12px', borderRadius: '6px', fontSize: '11.5px', color: '#166534', marginBottom: '14px' }}>
                💡 <strong>What is CAPA?</strong> Corrective actions fix the problem immediately. Preventive actions change maintenance or processes so the issue never happens again.
              </div>

              {/* Existing Actions List */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--brand-slate-500)' }}>
                  Assigned Action Tasks ({(selectedCapaIncident.capaItems || []).length})
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                  {(selectedCapaIncident.capaItems || []).map((c) => (
                    <div
                      key={c.id}
                      style={{
                        background: c.status === 'completed' ? '#F0FDF4' : '#FFFDF5',
                        border: c.status === 'completed' ? '1px solid #BBF7D0' : '1px solid #FDE68A',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '8px',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: '220px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className={`badge ${c.priority === 'high' ? 'danger' : 'warn'}`} style={{ fontSize: '8.5px', padding: '1px 5px' }}>
                            {c.priority.toUpperCase()}
                          </span>
                          <span style={{ fontSize: '12px', fontWeight: 800 }}>{c.description}</span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)', marginTop: '2px' }}>
                          Owner: <strong>{c.owner}</strong> • Due: {c.dueDate}
                          {c.verificationEvidence && <span style={{ color: '#059669', marginLeft: '6px' }}>({c.verificationEvidence})</span>}
                        </div>
                      </div>

                      <div>
                        {c.status === 'completed' ? (
                          <span className="badge success" style={{ fontSize: '10px' }}>✓ VERIFIED DONE</span>
                        ) : (
                          <button
                            type="button"
                            className="btn-primary"
                            style={{ fontSize: '11px', padding: '4px 8px', background: '#10B981', borderColor: '#10B981' }}
                            onClick={() => {
                              toggleCapaStatus(selectedCapaIncident.id, c.id, 'completed', 'Completed & tested by technician');
                              showToast(t(`Action #${c.id} marked completed!`, 'পদক্ষেপটি সম্পন্ন হয়েছে।', lang), 'success');
                            }}
                          >
                            <Check size={12} /> {t('Mark Done', 'সম্পন্ন', lang)}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add New CAPA Item Form */}
              <div style={{ background: 'var(--brand-slate-100)', padding: '14px', borderRadius: '8px', border: '1px solid var(--brand-slate-200)' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Plus size={14} color="var(--brand-crimson)" />
                  {t('Assign New Action Item', 'নতুন সমাধান ব্যবস্থা যোগ করুন', lang)}
                </div>

                <div className="form-group mb-2">
                  <label style={{ fontSize: '11.5px', fontWeight: 700 }}>{t('Action Type', 'পদক্ষেপের ধরন', lang)}</label>
                  <select
                    className="form-input"
                    value={newCapaType}
                    onChange={(e) => setNewCapaType(e.target.value as any)}
                  >
                    <option value="immediate_containment">Immediate Containment (Fix right away)</option>
                    <option value="corrective">Corrective Action (Eliminate root cause)</option>
                    <option value="preventive">Preventive Action (Refinery-wide policy/SOP change)</option>
                  </select>
                </div>

                <div className="form-group mb-2">
                  <label style={{ fontSize: '11.5px', fontWeight: 700 }}>{t('Action Description', 'বিবরণ', lang)}</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Conduct ultrasonic thickness testing on Tank 103"
                    value={newCapaDesc}
                    onChange={(e) => setNewCapaDesc(e.target.value)}
                  />
                </div>

                <div className="form-row mb-2">
                  <div className="form-group">
                    <label style={{ fontSize: '11.5px', fontWeight: 700 }}>{t('Assigned Owner', 'দায়িত্বপ্রাপ্ত কর্মকর্তা / দল', lang)}</label>
                    <select
                      className="form-input"
                      value={newCapaOwner}
                      onChange={(e) => setNewCapaOwner(e.target.value)}
                    >
                      <option value="Plant Maintenance Team">Plant Maintenance Team</option>
                      <option value="Electrical & Gate Maintenance">Electrical & Gate Maintenance</option>
                      <option value="Central Workshop Fabrication Crew">Central Workshop Fabrication Crew</option>
                      <option value="Safety & Admin Team">Safety & Admin Team</option>
                      <option value="Farhana Kabir (Lead Safety Officer)">Farhana Kabir (Lead Safety Officer)</option>
                      <option value="Engr. Md. Harunur Rashid (Plant GM)">Engr. Md. Harunur Rashid (Plant GM)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '11.5px', fontWeight: 700 }}>{t('Priority Level', 'অগ্রাধিকার', lang)}</label>
                    <select
                      className="form-input"
                      value={newCapaPriority}
                      onChange={(e) => setNewCapaPriority(e.target.value as any)}
                    >
                      <option value="high">High Priority (1-2 Days)</option>
                      <option value="medium">Medium Priority (1 Week)</option>
                      <option value="low">Low Priority (2 Weeks)</option>
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-primary"
                  style={{ width: '100%', marginTop: '6px' }}
                  onClick={handleAddNewCapa}
                >
                  <Plus size={13} />
                  {t('Add Action Item to Incident', 'সিএপিএ ব্যবস্থা সংরক্ষণ করুন', lang)}
                </button>
              </div>
            </div>

            <div className="modal-ft">
              <button className="btn-primary" onClick={() => setSelectedCapaIncident(null)}>{t('Close', 'বন্ধ করুন', lang)}</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 5: OFFICIAL STATUTORY GOVERNMENT HSE DOSSIER (FORM B-12) ─── */}
      {selectedDossierIncident && (
        <div className="modal-bg" onClick={() => setSelectedDossierIncident(null)}>
          <div className="modal" style={{ maxWidth: '720px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-hd" style={{ background: '#7F1424', color: '#fff' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={18} color="#FDE68A" />
                  <h3 style={{ color: '#fff', margin: 0 }}>
                    {t('Official Government Incident Report (Form B-12)', 'সরকারি ফর্ম বি-১২ ইনসিডেন্ট রিপোর্ট', lang)}
                  </h3>
                </div>
                <div style={{ fontSize: '11px', color: '#FCA5A5', marginTop: '2px' }}>
                  Department of Explosives (DoE) & Bangladesh Petroleum Act Compliance Dossier
                </div>
              </div>
              <button className="modal-close" style={{ color: '#fff' }} onClick={() => setSelectedDossierIncident(null)}>×</button>
            </div>

            <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
              {/* Document Letterhead */}
              <div style={{ border: '2px solid #E2E8F0', padding: '18px', borderRadius: '6px', background: '#FAFAFA', color: '#0F172A' }}>
                <div style={{ textAlign: 'center', borderBottom: '2px solid #A51C30', paddingBottom: '12px', marginBottom: '14px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 900, color: '#7F1424', letterSpacing: '0.5px' }}>
                    BASHUNDHARA OIL AND GAS COMPANY LIMITED (BOGCL)
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>
                    Keraniganj Bitumen Refinery Complex & Bulk Petroleum Terminal • Dhaka, Bangladesh
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 800, marginTop: '6px', color: '#0F172A', textTransform: 'uppercase' }}>
                    FORM B-12: STATUTORY NOTICE OF INDUSTRIAL OCCURRENCE
                  </div>
                  <div style={{ fontSize: '10px', color: '#64748B' }}>
                    Pursuant to Bangladesh Petroleum Act 1934 & Environment Conservation Rules
                  </div>
                </div>

                <div className="responsive-col-2-eq" style={{ gap: '10px', fontSize: '11.5px', marginBottom: '14px' }}>
                  <div><strong>Dossier Ref:</strong> {selectedDossierIncident.incNo}</div>
                  <div><strong>Occurrence Date:</strong> {selectedDossierIncident.date}</div>
                  <div><strong>Plant Zone:</strong> {selectedDossierIncident.plantZone || 'Storage Tank Yard'}</div>
                  <div><strong>Shift:</strong> {selectedDossierIncident.shift}</div>
                  <div><strong>Reported By:</strong> {selectedDossierIncident.reportedBy}</div>
                  <div><strong>Severity Rating:</strong> Level {selectedDossierIncident.level} (Risk Score: {selectedDossierIncident.riskScore || 6})</div>
                </div>

                <div style={{ borderTop: '1px solid #CBD5E1', paddingTop: '10px', fontSize: '12px', marginBottom: '12px' }}>
                  <div style={{ fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>1. Incident Narrative & Event Description:</div>
                  <div style={{ color: '#334155', lineHeight: 1.5 }}>
                    {selectedDossierIncident.title}. Immediate containment executed by on-duty crew.
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #CBD5E1', paddingTop: '10px', fontSize: '12px', marginBottom: '12px' }}>
                  <div style={{ fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>2. Immediate Safety Containment Actions Taken:</div>
                  <div style={{ color: '#334155', lineHeight: 1.5 }}>
                    {selectedDossierIncident.immediateActionsTaken || 'Area cordoned off and safety valves isolated.'}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #CBD5E1', paddingTop: '10px', fontSize: '12px', marginBottom: '12px' }}>
                  <div style={{ fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>3. 5-Whys Root Cause Analysis (RCA):</div>
                  <div style={{ color: '#334155', lineHeight: 1.5 }}>
                    {selectedDossierIncident.rootCause}
                  </div>
                  {selectedDossierIncident.fiveWhys && (
                    <div style={{ marginTop: '6px', fontSize: '11px', color: '#1E40AF', background: '#EFF6FF', padding: '6px 10px', borderRadius: '4px' }}>
                      Primary Factor: <strong>{selectedDossierIncident.fiveWhys.fishboneCategory}</strong> • Systemic flaw validated under ISO 45001 protocol.
                    </div>
                  )}
                </div>

                <div style={{ borderTop: '1px solid #CBD5E1', paddingTop: '10px', fontSize: '12px', marginBottom: '14px' }}>
                  <div style={{ fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>4. Corrective & Preventive Action (CAPA) Log:</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {(selectedDossierIncident.capaItems || []).map((c, i) => (
                      <div key={c.id} style={{ fontSize: '11.5px', color: '#334155' }}>
                        {i + 1}. [{c.actionType.toUpperCase()}] {c.description} — <em>Owner: {c.owner} ({c.status.toUpperCase()})</em>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sign-Off Stamps */}
                <div className="responsive-col-2-eq" style={{ gap: '16px', borderTop: '2px solid #CBD5E1', paddingTop: '14px', marginTop: '10px' }}>
                  <div style={{ textAlign: 'center', border: '1px dashed #059669', padding: '10px', borderRadius: '4px', background: '#F0FDF4' }}>
                    <div style={{ fontSize: '11px', color: '#059669', fontWeight: 900 }}>✓ VERIFIED BY EHS HEAD</div>
                    <div style={{ fontSize: '12px', fontWeight: 800, marginTop: '2px' }}>Farhana Kabir</div>
                    <div style={{ fontSize: '10px', color: '#64748B' }}>Lead Safety Inspector • BOGCL</div>
                  </div>

                  <div style={{ textAlign: 'center', border: '1px dashed #A51C30', padding: '10px', borderRadius: '4px', background: '#FEF2F2' }}>
                    <div style={{ fontSize: '11px', color: '#A51C30', fontWeight: 900 }}>★ APPROVED BY PLANT GM</div>
                    <div style={{ fontSize: '12px', fontWeight: 800, marginTop: '2px' }}>Engr. Md. Harunur Rashid</div>
                    <div style={{ fontSize: '10px', color: '#64748B' }}>Plant GM & Licensed Controller</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-ft">
              <button className="btn-sm-ghost" onClick={() => setSelectedDossierIncident(null)}>{t('Close', 'বন্ধ করুন', lang)}</button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  window.print();
                  showToast(t(`Statutory Dossier ${selectedDossierIncident.incNo} prepared for printing.`, `সরকারি ডসিয়ার প্রিন্ট করা হচ্ছে।`, lang), 'gold');
                }}
              >
                <Download size={14} />
                {t('Print / Export Certified PDF Dossier', 'সার্টিফাইড পিডিএফ প্রিন্ট', lang)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 6: EXECUTIVE INCIDENT REVIEW & CLOSURE SIGN-OFF ─── */}
      {selectedSignoffIncident && (
        <div className="modal-bg" onClick={() => setSelectedSignoffIncident(null)}>
          <div className="modal" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-hd" style={{ background: '#047857', color: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={18} color="#FDE047" />
                <h3 style={{ color: '#fff', margin: 0 }}>
                  {t('Executive Review & Final Incident Closure Sign-Off', 'নির্বাহী মূল্যায়ন ও আনুষ্ঠানিক ইনসিডেন্ট সমাপ্তি অনুমোদন', lang)}
                </h3>
              </div>
              <button className="modal-close" style={{ color: '#fff' }} onClick={() => setSelectedSignoffIncident(null)}>×</button>
            </div>

            <div className="modal-body">
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '10px 14px', borderRadius: '6px', fontSize: '12px', color: '#166534', marginBottom: '14px' }}>
                ✓ <strong>ISO 45001 Closure Prerequisite:</strong> All assigned CAPA items must be executed and inspected before executive sign-off.
              </div>

              <div className="form-group mb-3">
                <label style={{ fontSize: '12px', fontWeight: 700 }}>{t('Lead Safety Officer Sign-Off', 'নিরাপত্তা প্রধানের স্বাক্ষর', lang)}</label>
                <input
                  type="text"
                  className="form-input"
                  value={signoffOfficer}
                  onChange={(e) => setSignoffOfficer(e.target.value)}
                />
              </div>

              <div className="form-group mb-3">
                <label style={{ fontSize: '12px', fontWeight: 700 }}>{t('Plant General Manager Approval', 'প্ল্যান্ট জিএম মহোদয়ের অনুমোদন', lang)}</label>
                <input
                  type="text"
                  className="form-input"
                  value={signoffGm}
                  onChange={(e) => setSignoffGm(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '12px', fontWeight: 700 }}>{t('Closure Audit Findings & Verification Remarks', 'অডিট পর্যবেক্ষণ ও সমাপ্তি মন্তব্য', lang)}</label>
                <textarea
                  rows={3}
                  className="form-input"
                  value={signoffRemarks}
                  onChange={(e) => setSignoffRemarks(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-ft">
              <button className="btn-sm-ghost" onClick={() => setSelectedSignoffIncident(null)}>{t('Cancel', 'বাতিল', lang)}</button>
              <button
                type="button"
                className="btn-primary"
                style={{ background: '#059669', borderColor: '#059669' }}
                onClick={handleSignOffClosure}
              >
                <Award size={14} />
                {t('Seal Sign-Off & Close Incident', 'অনুমোদন নিশ্চিত করুন ও ফাইল ক্লোজ করুন', lang)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 7: EMERGENCY REFINERY EVACUATION & SIREN DRILL ─── */}
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
                <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#991B1B', margin: '0 0 6px' }}>
                  Keraniganj Complex Emergency Readiness
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--brand-slate-600)', maxWidth: '420px', margin: '0 auto' }}>
                  Activating this protocol triggers the refinery acoustic horn, automatically trips SCADA fuel transfer pumps, and dispatches SMS alerts to Plant GM, Fire Service, and Chairman's Office.
                </p>
              </div>

              <div style={{ background: '#FFFDF5', border: '1px solid #FDE68A', padding: '12px', borderRadius: '6px', fontSize: '12px' }}>
                <div style={{ fontWeight: 700, color: '#92400E', marginBottom: '6px' }}>Automatic Safety Interlocks Triggered:</div>
                <ul style={{ margin: 0, paddingLeft: '18px', color: '#78350F', lineHeight: 1.6 }}>
                  <li>Main Crude/Bitumen Feed Valve V-101: <strong>Instant Pneumatic Closure</strong></li>
                  <li>Nitrogen Blanket Purge System: <strong>Activated on Tanks TK-101 to TK-108</strong></li>
                  <li>Evacuation Assembly Points A, B, C: <strong>Biometric Headcount Enabled</strong></li>
                </ul>
              </div>
            </div>

            <div className="modal-ft">
              <button className="btn-sm-ghost" onClick={() => setShowEmergencyModal(false)}>{t('Cancel', 'বাতিল', lang)}</button>
              <button
                type="button"
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
    </div>
  );
}
