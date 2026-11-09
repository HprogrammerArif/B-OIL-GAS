import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ViewProps, SYSTEM_TODAY, t } from '../types';
import { showToast } from '../components/ToastManager';
import Pagination from '../components/Pagination';
import { useCurrentUser } from '../auth/session';
import { nextRef } from '../lib/refs';
import { nowStamp, nowTime } from '../lib/clock';
import { type IncidentMode, incidentModeFor, incidentsVisibleTo, daysSinceLostTime } from './incident/config';
import { clearIncidentDraft, incidentDraftPlace, peekIncidentDraft, queueIncidentDraft } from './incident/handoff';
import {
  incidentPhotoFor,
  useOperationsStore,
  IncidentItem,
  IncidentSpotFile,
  IncidentType,
  IncidentWorkflowStage,
  InvolvedPerson,
  CapaActionItem,
} from '../store/operationsStore';
import { useEmployeeStore } from '../store/employeeStore';
import { Button, EmptyState, FormField, Modal, PageHeader, StatusPill } from '../components/ui';
import {
  AlertTriangle, ShieldAlert, CheckCircle, FileText, Plus, ShieldCheck, Activity, Camera, HelpCircle, Siren, Download, Check, ArrowRight, Send, Search, X, CheckSquare, MapPin, HeartPulse, ChevronDown, ChevronUp, SearchX, Paperclip, Info,
  CheckCircle2,
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

export const INCIDENT_TYPE_META: Record<IncidentType, { label: string; labelBn: string; color: string }> = {
  near_miss: { label: 'Near-Miss (Zero Injury)', labelBn: 'নিয়ার-মিস (ক্ষতিহীন)', color: 'var(--status-info)' },
  hazard_observation: { label: 'Hazard / Unsafe Condition', labelBn: 'বিপদ পর্যবেক্ষণ', color: 'var(--status-purple)' },
  first_aid: { label: 'First-Aid Case (FAC)', labelBn: 'প্রাথমিক চিকিৎসা ঘটনা', color: 'var(--status-success)' },
  medical_treatment: { label: 'Medical Treatment (MTC)', labelBn: 'চিকিৎসাকেন্দ্রে চিকিৎসা', color: 'var(--status-warning)' },
  lost_time: { label: 'Lost Time Injury (LTI)', labelBn: 'কর্মবিরতিজনিত আঘাত', color: 'var(--status-danger)' },
  spill_leak: { label: 'Spill / Leak (LOPC)', labelBn: 'তেল / বিটুমিন নিঃসরণ', color: 'var(--status-warning)' },
  pressure_piping: { label: 'Pressure & Piping Alert', labelBn: 'পাইপলাইন ও চাপ ত্রুটি', color: 'var(--status-warning)' },
  fire_thermal: { label: 'Thermal / Flare Anomaly', labelBn: 'অগ্নিকাণ্ড বা অতিরিক্ত তাপ', color: 'var(--status-danger-text)' },
  electrical_arc: { label: 'Electrical Arc / Fault', labelBn: 'বৈদ্যুতিক ত্রুটি', color: 'var(--status-purple)' },
  equipment_damage: { label: 'Equipment / Asset Damage', labelBn: 'যন্ত্রাংশের ক্ষতি', color: 'var(--text-3)' },
  environmental: { label: 'Environmental Release', labelBn: 'পরিবেশগত নির্গমন', color: 'var(--status-success)' },
};

const CAPA_PAGE = 4;
const INCIDENT_PAGE = 4;
const MAX_SPOT_FILES = 6;
const MAX_SPOT_BYTES = 8 * 1024 * 1024;

function isSpotFileAllowed(file: File): boolean {
  const mime = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  return mime.startsWith('image/') || mime === 'application/pdf' || /\.(jpe?g|png|webp|gif|heic|pdf)$/.test(name);
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function shrinkSpotImage(file: File): Promise<string> {
  return readFileAsDataUrl(file).then((src) => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const max = 1280;
      let width = img.width;
      let height = img.height;
      if (width > max || height > max) {
        const scale = Math.min(max / width, max / height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, width);
      canvas.height = Math.max(1, height);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(src);
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.72));
    };
    img.onerror = () => resolve(src);
    img.src = src;
  }));
}

async function toSpotFile(file: File): Promise<IncidentSpotFile> {
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  const dataUrl = isPdf ? await readFileAsDataUrl(file) : await shrinkSpotImage(file);
  return {
    id: `spot-${crypto.randomUUID()}`,
    name: file.name,
    mime: isPdf ? 'application/pdf' : (file.type || 'image/jpeg'),
    dataUrl,
    sizeBytes: file.size,
  };
}

const EMERGENCY_KINDS: {
  id: 'fire' | 'spill' | 'gas' | 'medical' | 'evacuation';
  type: IncidentType;
  en: string;
  bn: string;
  photo?: string;
}[] = [
  { id: 'fire', type: 'fire_thermal', en: 'Fire', bn: 'আগুন' },
  { id: 'spill', type: 'spill_leak', en: 'Spill or leak', bn: 'নিঃসরণ বা লিক' },
  { id: 'gas', type: 'pressure_piping', en: 'Gas or pressure', bn: 'গ্যাস বা চাপ' },
  { id: 'medical', type: 'medical_treatment', en: 'Medical', bn: 'চিকিৎসা' },
  { id: 'evacuation', type: 'near_miss', en: 'Evacuation', bn: 'সরিয়ে নেওয়া', photo: '/incidents/gate-barrier.jpg' },
];

export default function IncidentView({ lang, onNavigate }: ViewProps) {
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
  const user = useCurrentUser();
  const mode: IncidentMode = user ? incidentModeFor(user) : 'reporter';
  const canInvestigate = mode === 'investigate';
  const currentPersona = { name: user?.name ?? '', label: user?.label ?? '', empId: user?.empId ?? '' };
  const visibleIncidents = useMemo(
    () => (user ? incidentsVisibleTo(user, mode, incidents) : []),
    [user, mode, incidents],
  );

  // ── Filters & Search State ──
  const [activeTab, setActiveTab] = useState<'all' | 'spill_leak' | 'near_miss' | 'first_aid' | 'pressure_piping' | 'electrical_arc' | 'statutory'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [wizardError, setWizardError] = useState<string | null>(null);
  const [quick, setQuick] = useState<'all' | 'open' | 'serious' | 'statutory' | 'closed'>('open');
  const [incListPage, setIncListPage] = useState(1);
  const [selectedZone, setSelectedZone] = useState<string>('All Plant Zones');
  const [selectedSeverity, setSelectedSeverity] = useState<number>(0); // 0 = all
  const [selectedStage, setSelectedStage] = useState<'all' | IncidentWorkflowStage>('all');
  const [matrixFilter, setMatrixFilter] = useState<{ level: number; likelihood: number } | null>(null);

  // ── Modals State ──
  const [showLogWizard, setShowLogWizard] = useState(() => peekIncidentDraft() != null);
  const [showQuickHazardModal, setShowQuickHazardModal] = useState(false);
  const [selectedRcaIncident, setSelectedRcaIncident] = useState<IncidentItem | null>(null);
  const [selectedCapaIncidentId, setSelectedCapaIncidentId] = useState<string | null>(null);
  const selectedCapaIncident = useMemo(
    () => (selectedCapaIncidentId ? incidents.find((i) => i.id === selectedCapaIncidentId) ?? null : null),
    [selectedCapaIncidentId, incidents],
  );
  const [selectedDossierIncident, setSelectedDossierIncident] = useState<IncidentItem | null>(null);
  const [selectedSignoffIncident, setSelectedSignoffIncident] = useState<IncidentItem | null>(null);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [expandedIncidentId, setExpandedIncidentId] = useState<string | null>(null);

  // ── Wizard Form State (Modal 1) ──
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [wizardType, setWizardType] = useState<IncidentType>('near_miss');
  const [wizardTitle, setWizardTitle] = useState('');
  const [wizardZone, setWizardZone] = useState<string>('Storage Tank Yard (TK-101 to TK-108)');
  const [wizardLocation, setWizardLocation] = useState(() => {
    const draft = peekIncidentDraft();
    return draft ? incidentDraftPlace(draft) : 'Storage Tank Yard, Tank TK-102';
  });
  const [wizardShift, setWizardShift] = useState<'Morning Shift (07:00 - 15:00)' | 'Evening Shift (15:00 - 23:00)' | 'Night Shift (23:00 - 07:00)'>('Morning Shift (07:00 - 15:00)');
  const [wizardSeverity, setWizardSeverity] = useState<1 | 2 | 3 | 4 | 5>(2);
  const [wizardLikelihood, setWizardLikelihood] = useState<1 | 2 | 3 | 4 | 5>(2);
  const [wizardImmediateActions, setWizardImmediateActions] = useState('');
  const [wizardHasInjury, setWizardHasInjury] = useState(false);
  const [wizardInjuredEmpId, setWizardInjuredEmpId] = useState('');
  const [wizardInjuryNature, setWizardInjuryNature] = useState('');
  const [wizardTreatmentGiven, setWizardTreatmentGiven] = useState('');
  const [wizardWitnessName, setWizardWitnessName] = useState('');
  const [wizardSpotFiles, setWizardSpotFiles] = useState<IncidentSpotFile[]>([]);
  const spotFileInputRef = useRef<HTMLInputElement>(null);
  const spotCameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const draft = peekIncidentDraft();
    if (!draft) return;
    clearIncidentDraft();
    setWizardTitle('');
    setWizardStep(1);
    setWizardError(null);
    setWizardLocation(incidentDraftPlace(draft));
    setShowLogWizard(true);
    let settled = false;
    queueMicrotask(() => { settled = true; });
    return () => {
      if (!settled) queueIncidentDraft(draft);
    };
  }, []);

  // ── Quick Hazard State (Modal 2) ──
  const [quickHazardTitle, setQuickHazardTitle] = useState('');
  const [quickHazardZone, setQuickHazardZone] = useState('Circulation Pump House, Unit-2');
  const [quickHazardDesc, setQuickHazardDesc] = useState('');
  const [quickHazardFix, setQuickHazardFix] = useState('');
  const [quickHazardFiles, setQuickHazardFiles] = useState<IncidentSpotFile[]>([]);
  const hazardFileInputRef = useRef<HTMLInputElement>(null);
  const hazardCameraInputRef = useRef<HTMLInputElement>(null);

  const [emergencyKind, setEmergencyKind] = useState<'fire' | 'spill' | 'gas' | 'medical' | 'evacuation'>('fire');
  const [emergencyZone, setEmergencyZone] = useState('');
  const [emergencyWhat, setEmergencyWhat] = useState('');
  const [emergencyLine, setEmergencyLine] = useState<{ kind: string; kindBn: string; place: string; time: string } | null>(null);

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
  const [capaListFilter, setCapaListFilter] = useState<'open' | 'done' | 'all'>('open');
  const [capaListQuery, setCapaListQuery] = useState('');
  const [capaListPage, setCapaListPage] = useState(1);
  const [capaAddOpen, setCapaAddOpen] = useState(false);
  const [capaDescError, setCapaDescError] = useState(false);

  useEffect(() => {
    if (!selectedCapaIncidentId) return;
    setCapaListFilter('open');
    setCapaListQuery('');
    setCapaListPage(1);
    setCapaAddOpen(false);
    setCapaDescError(false);
    setNewCapaDesc('');
  }, [selectedCapaIncidentId]);

  useEffect(() => {
    if (!capaAddOpen) return;
    const form = document.getElementById('capa-add-form');
    form?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    document.getElementById('capa-desc')?.focus();
  }, [capaAddOpen]);

  const capaItems = selectedCapaIncident?.capaItems;
  const filteredCapaItems = useMemo(() => {
    const list = capaItems ?? [];
    const q = capaListQuery.trim().toLowerCase();
    return list.filter((c) => {
      if (capaListFilter === 'open' && c.status === 'completed') return false;
      if (capaListFilter === 'done' && c.status !== 'completed') return false;
      if (!q) return true;
      return `${c.description} ${c.owner}`.toLowerCase().includes(q);
    });
  }, [capaItems, capaListFilter, capaListQuery]);

  // ── Sign-Off Modal State (Modal 6) ──
  const [signoffOfficer, setSignoffOfficer] = useState('');
  const [signoffRemarks, setSignoffRemarks] = useState('');

  // ─────────────────────────────────────────────────────────────────────────
  // Computed Performance Metrics & Stats
  // ─────────────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const pool = visibleIncidents;
    const total = pool.length;
    const open = pool.filter(i => i.capaStatus !== 'closed').length;
    const closed = pool.filter(i => i.capaStatus === 'closed').length;
    const critical = pool.filter(i => i.level >= 3).length;
    const statutory = pool.filter(i => i.statutoryReportable).length;

    let totalCapa = 0;
    let completedCapa = 0;
    pool.forEach(i => {
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
      safeDays: daysSinceLostTime(incidents),
    };
  }, [visibleIncidents, incidents]);

  // ─────────────────────────────────────────────────────────────────────────
  // Filtered Incidents
  // ─────────────────────────────────────────────────────────────────────────
  const filteredIncidents = useMemo(() => {
    return visibleIncidents.filter(inc => {
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
  }, [visibleIncidents, activeTab, matrixFilter, selectedZone, selectedSeverity, selectedStage, searchQuery]);

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
  const addSpotFiles = async (
    list: FileList | null,
    current: IncidentSpotFile[],
    setFiles: React.Dispatch<React.SetStateAction<IncidentSpotFile[]>>,
  ) => {
    if (!list || list.length === 0) return;
    const room = MAX_SPOT_FILES - current.length;
    if (room <= 0) {
      showToast(t(`You can attach up to ${MAX_SPOT_FILES} files.`, `সর্বোচ্চ ${MAX_SPOT_FILES}টি ফাইল যুক্ত করা যায়।`, lang), 'warn');
      return;
    }
    const picked = Array.from(list).slice(0, room);
    const next: IncidentSpotFile[] = [];
    for (const file of picked) {
      if (!isSpotFileAllowed(file)) {
        showToast(t(`${file.name} is not a photo or PDF.`, `${file.name} ছবি বা PDF নয়।`, lang), 'warn');
        continue;
      }
      if (file.size > MAX_SPOT_BYTES) {
        showToast(t(`${file.name} is larger than 8 MB.`, `${file.name} ৮ এমবির বেশি।`, lang), 'warn');
        continue;
      }
      try {
        next.push(await toSpotFile(file));
      } catch {
        showToast(t(`Could not read ${file.name}.`, `${file.name} পড়া যায়নি।`, lang), 'warn');
      }
    }
    if (next.length > 0) {
      setFiles((prev) => [...prev, ...next]);
      showToast(
        t(
          next.length === 1 ? `${next[0].name} attached.` : `${next.length} files attached.`,
          next.length === 1 ? `${next[0].name} যুক্ত হয়েছে।` : `${next.length}টি ফাইল যুক্ত হয়েছে।`,
          lang,
        ),
        'success',
      );
    }
  };

  // Wizard Submit Handler (Modal 1)
  // ─────────────────────────────────────────────────────────────────────────
  const handleWizardSubmit = () => {
    if (!wizardTitle.trim() || !wizardImmediateActions.trim()) {
      showToast(t('Please complete incident title and immediate containment actions.', 'অনুগ্রহ করে শিরোনাম ও তাৎক্ষণিক পদক্ষেপ পূরণ করুন।', lang), 'info');
      return;
    }

    const incRef = nextRef('INC');
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
        id: nextRef('CAPA', 3),
        actionType: 'immediate_containment',
        description: wizardImmediateActions.trim(),
        owner: `${currentPersona.name} (${currentPersona.label})`,
        dueDate: SYSTEM_TODAY,
        priority: 'high',
        status: 'completed',
        completedAt: nowStamp(),
        verificationEvidence: 'Initial containment executed upon notification.',
      },
      {
        id: nextRef('CAPA', 3),
        actionType: 'corrective',
        description: `Investigate physical cause and perform safety verification on ${wizardLocation}.`,
        owner: 'Plant Maintenance & EHS Team',
        dueDate: '04 Nov 2026',
        priority: wizardSeverity >= 3 ? 'high' : 'medium',
        status: 'pending',
      },
    ];

    const imagePhotos = wizardSpotFiles
      .filter((file) => file.mime.startsWith('image/'))
      .map((file) => file.dataUrl);
    const photos = imagePhotos.length > 0 ? imagePhotos : [incidentPhotoFor(wizardType)];
    const newInc: IncidentItem = {
      id: incRef,
      incNo: incRef,
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
      date: `${SYSTEM_TODAY}, ${nowTime()}`,
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
      evidenceAttached: wizardSpotFiles.length > 0,
      spotFiles: wizardSpotFiles,
      photo: photos[0],
      photos,
    };

    addIncident(newInc);
    setShowLogWizard(false);
    setWizardStep(1);
    setWizardTitle('');
    setWizardImmediateActions('');
    setWizardHasInjury(false);
    setWizardInjuredEmpId('');
    setWizardSpotFiles([]);

    showToast(
      t(
        `Incident ${newInc.incNo} logged! Auto-dispatched alert to Plant GM and EHS lead.`,
        `ইনসিডেন্ট ${newInc.incNo} সফলভাবে রেকর্ড সম্পন্ন হয়েছে এবং অ্যালার্ট জারি করা হয়েছে।`,
        lang
      ),
      'gold'
    );
  };

  const closeEmergency = () => {
    setShowEmergencyModal(false);
    setEmergencyKind('fire');
    setEmergencyZone('');
    setEmergencyWhat('');
  };

  const handleSendEmergency = () => {
    if (!emergencyZone || !emergencyWhat.trim()) return;
    const kind = EMERGENCY_KINDS.find((item) => item.id === emergencyKind) ?? EMERGENCY_KINDS[0];
    const incRef = nextRef('INC');
    const photo = kind.photo ?? incidentPhotoFor(kind.type);
    const legacyCategory =
      kind.type === 'spill_leak' ? 'spill' :
      kind.type === 'pressure_piping' ? 'pressure' :
      kind.type === 'fire_thermal' ? 'fire' : 'near_miss';
    const statutory = kind.id === 'fire' || kind.id === 'spill' || kind.id === 'gas';
    const sentAt = nowTime();
    addIncident({
      id: incRef,
      incNo: incRef,
      title: `${kind.en}: ${emergencyWhat.trim()}`,
      titleBn: `${kind.bn}: ${emergencyWhat.trim()}`,
      incidentType: kind.type,
      category: legacyCategory,
      level: 4,
      likelihood: 3,
      riskScore: 12,
      riskCategory: 'high',
      plantZone: emergencyZone,
      location: `${emergencyZone}, Keraniganj Complex`,
      shift: 'Morning Shift (07:00 - 15:00)',
      reportedBy: `${currentPersona.name} (${currentPersona.label})`,
      reporterEmpId: currentPersona.empId,
      date: `${SYSTEM_TODAY}, ${sentAt}`,
      workflowStage: 'reported',
      immediateActionsTaken: emergencyWhat.trim(),
      rootCause: 'Site emergency alert. Cause not yet investigated.',
      capaItems: [{
        id: nextRef('CAPA', 3),
        actionType: 'immediate_containment',
        description: emergencyWhat.trim(),
        owner: 'Plant safety team',
        dueDate: SYSTEM_TODAY,
        priority: 'high',
        status: 'pending',
      }],
      capaAction: emergencyWhat.trim(),
      capaOwner: 'Plant safety team',
      capaStatus: 'open',
      statutoryReportable: statutory,
      statutoryAgency: statutory ? 'Department of Explosives (DoE)' : undefined,
      statutoryNoticeHours: statutory ? 24 : undefined,
      evidenceAttached: false,
      photo,
      photos: [photo],
    });
    setEmergencyLine({ kind: kind.en, kindBn: kind.bn, place: emergencyZone, time: sentAt });
    closeEmergency();
    showToast(
      t(
        `Emergency alert sent at ${sentAt}. Muster roll call started.`,
        `${nowTime(lang)}-এ জরুরি সতর্কবার্তা পাঠানো হয়েছে। হাজিরা গণনা শুরু হয়েছে।`,
        lang,
      ),
      'danger',
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

    const incRef = nextRef('INC');
    const imagePhotos = quickHazardFiles
      .filter((file) => file.mime.startsWith('image/'))
      .map((file) => file.dataUrl);
    const photos = imagePhotos.length > 0 ? imagePhotos : [incidentPhotoFor('hazard_observation')];
    const newInc: IncidentItem = {
      id: incRef,
      incNo: incRef,
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
      date: `${SYSTEM_TODAY}, ${nowTime()}`,
      workflowStage: 'triaged',
      immediateActionsTaken: quickHazardFix.trim() || 'Hazard flagged with safety tape and reported to shift supervisor.',
      rootCause: quickHazardDesc.trim(),
      capaItems: [
        {
          id: nextRef('CAPA', 3),
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
      evidenceAttached: quickHazardFiles.length > 0,
      spotFiles: quickHazardFiles,
      photo: photos[0],
      photos,
    };

    addIncident(newInc);
    setShowQuickHazardModal(false);
    setQuickHazardTitle('');
    setQuickHazardDesc('');
    setQuickHazardFix('');
    setQuickHazardFiles([]);

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
      setCapaDescError(true);
      showToast(t('Write what needs to be done.', 'কী করতে হবে তা লিখুন।', lang), 'info');
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
    setCapaDescError(false);
    setCapaListFilter('open');
    setCapaListQuery('');
    setCapaListPage(1);
    setCapaAddOpen(false);
    showToast(t('Fix assigned. It is now on the still-open list.', 'সমাধানের দায়িত্ব দেওয়া হয়েছে। এটি এখন চলমান তালিকায়।', lang), 'success');
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Digital Sign-Off & Closure Handler
  // ─────────────────────────────────────────────────────────────────────────
  const handleSignOffClosure = () => {
    if (!selectedSignoffIncident || !signoffOfficer.trim()) return;
    closeIncidentWithSignOff(selectedSignoffIncident.id, signoffOfficer.trim(), `${currentPersona.name} (${currentPersona.label})`, signoffRemarks);
    setSelectedSignoffIncident(null);
    setSignoffOfficer('');
    showToast(
      t(
        `Incident ${selectedSignoffIncident.incNo} verified and closed.`,
        `ইনসিডেন্ট ${selectedSignoffIncident.incNo} যাচাই করে সমাপ্ত করা হয়েছে।`,
        lang
      ),
      'gold'
    );
  };

  const bn = (n: number) => n.toLocaleString('bn-BD');
  const isOpenInc = (i: IncidentItem) => i.capaStatus !== 'closed';
  const quickCounts = {
    all: visibleIncidents.length,
    open: visibleIncidents.filter(isOpenInc).length,
    serious: visibleIncidents.filter((i) => isOpenInc(i) && i.level >= 3).length,
    statutory: visibleIncidents.filter((i) => i.statutoryReportable && isOpenInc(i)).length,
    closed: visibleIncidents.filter((i) => !isOpenInc(i)).length,
  };
  const QUICK: { id: typeof quick; label: [string, string]; count: number }[] = [
    { id: 'all', label: ['All', 'সব'], count: quickCounts.all },
    { id: 'open', label: ['Still open', 'চলমান'], count: quickCounts.open },
    { id: 'serious', label: ['Serious and open', 'গুরুতর ও চলমান'], count: quickCounts.serious },
    { id: 'statutory', label: ['Needs government report', 'সরকারি রিপোর্ট দরকার'], count: quickCounts.statutory },
    { id: 'closed', label: ['Closed', 'সমাপ্ত'], count: quickCounts.closed },
  ];
  const quickFiltered = filteredIncidents.filter((i) =>
    quick === 'open' ? isOpenInc(i)
      : quick === 'serious' ? isOpenInc(i) && i.level >= 3
        : quick === 'statutory' ? i.statutoryReportable && isOpenInc(i)
          : quick === 'closed' ? !isOpenInc(i)
            : true,
  );
  const hasFilter = quick !== 'open' || activeTab !== 'all' || !!matrixFilter || selectedZone !== 'All Plant Zones' || selectedSeverity > 0 || selectedStage !== 'all' || !!searchQuery.trim();
  const clearFilters = () => {
    setQuick('open'); setActiveTab('all'); setMatrixFilter(null); setSelectedZone('All Plant Zones');
    setSelectedSeverity(0); setSelectedStage('all'); setSearchQuery('');
    setIncListPage(1);
  };

  useEffect(() => {
    setIncListPage(1);
  }, [quick, searchQuery, activeTab, selectedZone, selectedSeverity, selectedStage, matrixFilter]);

  const incPageCount = Math.max(1, Math.ceil(quickFiltered.length / INCIDENT_PAGE));
  const safeIncPage = Math.min(incListPage, incPageCount);
  const pagedIncidents = quickFiltered.slice((safeIncPage - 1) * INCIDENT_PAGE, safeIncPage * INCIDENT_PAGE);

  const LEVEL_LABEL: Record<number, [string, string]> = {
    1: ['Minor', 'সামান্য'], 2: ['Low', 'নিম্ন'], 3: ['Moderate', 'মাঝারি'], 4: ['Major', 'গুরুতর'], 5: ['Critical', 'চরম'],
  };
  const STAGES: IncidentWorkflowStage[] = ['reported', 'triaged', 'under_investigation', 'capa_execution', 'closed'];
  const STAGE_LABEL: Record<string, [string, string]> = {
    reported: ['Reported', 'দাখিল হয়েছে'],
    triaged: ['Risk checked', 'ঝুঁকি যাচাই হয়েছে'],
    under_investigation: ['Finding the cause', 'কারণ খোঁজা হচ্ছে'],
    capa_execution: ['Fixing the problem', 'সমাধান চলছে'],
    closed: ['Closed', 'সমাপ্ত'],
  };

  const verdictTone = mode !== 'reporter' && quickCounts.statutory > 0
    ? 'danger'
    : mode !== 'reporter' && quickCounts.serious > 0
      ? 'warn'
      : quickCounts.open > 0
        ? 'info'
        : 'ok';
  const verdict = mode === 'reporter'
    ? quickCounts.all === 0
      ? t('You have not reported anything yet. If you see a hazard or something goes wrong, report it right away.', 'আপনি এখনও কিছু রিপোর্ট করেননি। কোনো বিপদ বা সমস্যা দেখলে সঙ্গে সঙ্গে রিপোর্ট করুন।', lang)
      : t(`You reported ${quickCounts.all} ${quickCounts.all === 1 ? 'issue' : 'issues'}. ${quickCounts.open} ${quickCounts.open === 1 ? 'is' : 'are'} still being handled by the safety team.`, `আপনি ${bn(quickCounts.all)}টি বিষয় রিপোর্ট করেছেন। ${bn(quickCounts.open)}টি এখনও নিরাপত্তা দলের হাতে।`, lang)
    : t(
      `${quickCounts.open} ${quickCounts.open === 1 ? 'incident is' : 'incidents are'} open${quickCounts.serious > 0 ? `, ${quickCounts.serious} serious` : ''}${quickCounts.statutory > 0 ? `, ${quickCounts.statutory} to report to the government` : ''}. ${stats.safeDays} days without a lost-time injury.`,
      `${bn(quickCounts.open)}টি ঘটনা চলমান${quickCounts.serious > 0 ? `, ${bn(quickCounts.serious)}টি গুরুতর` : ''}${quickCounts.statutory > 0 ? `, ${bn(quickCounts.statutory)}টি সরকারকে জানাতে হবে` : ''}। কর্মবিরতিজনিত আঘাত ছাড়া ${bn(stats.safeDays)} দিন।`,
      lang,
    );

  /** Plain sentence per card: where the incident is, who still owes work, and what you do. */
  const nextStep = (inc: IncidentItem): string => {
    const stage = inc.workflowStage || (inc.capaStatus === 'closed' ? 'closed' : 'under_investigation');
    const items = inc.capaItems || [];
    const open = items.filter((c) => c.status !== 'completed');
    const done = items.length - open.length;
    const owners = [...new Set(open.map((c) => c.owner).filter(Boolean))];
    const waiting = owners.length > 0 ? owners.join(', ') : inc.investigationLead;
    const lead = mode === 'investigate';
    switch (stage) {
      case 'reported':
      case 'triaged':
        return lead
          ? t('New report. Check the risk and start finding the cause.', 'নতুন রিপোর্ট। ঝুঁকি যাচাই করে কারণ খোঁজা শুরু করুন।', lang)
          : t('Waiting for the plant safety team to check it. Nothing for you to do.', 'প্ল্যান্ট নিরাপত্তা দলের যাচাইয়ের অপেক্ষায়। আপনার কিছু করার নেই।', lang);
      case 'under_investigation':
        return lead
          ? t('Find the root cause, then assign the people who will fix it.', 'মূল কারণ খুঁজে বের করে যারা সমাধান করবেন তাদের দায়িত্ব দিন।', lang)
          : inc.investigationLead
            ? t(`${inc.investigationLead} is finding the cause.`, `${inc.investigationLead} কারণ খুঁজছেন।`, lang)
            : t('The safety team is finding the cause.', 'নিরাপত্তা দল কারণ খুঁজছে।', lang);
      case 'capa_execution':
        if (done === items.length && items.length > 0) {
          return lead
            ? t('All fixes are done. Verify on site and close the incident.', 'সব সমাধান শেষ। সাইটে যাচাই করে ঘটনাটি বন্ধ করুন।', lang)
            : t('All fixes are done. Waiting for safety and the plant manager to close it.', 'সব সমাধান শেষ। নিরাপত্তা ও প্ল্যান্ট ম্যানেজারের বন্ধ করার অপেক্ষায়।', lang);
        }
        return waiting
          ? t(`${done} of ${items.length} fixes done. Waiting on ${waiting}.`, `${bn(items.length)}টির মধ্যে ${bn(done)}টি সমাধান শেষ। অপেক্ষা: ${waiting}।`, lang)
          : t(`${done} of ${items.length} fixes done.`, `${bn(items.length)}টির মধ্যে ${bn(done)}টি সমাধান শেষ।`, lang);
      default:
        return t('Closed and verified. Nothing more to do.', 'সমাপ্ত ও যাচাইকৃত। আর কিছু করার নেই।', lang);
    }
  };

  const canReport = mode !== 'oversight' || user?.role === 'hr_admin';
  const capaOpenCount = (capaItems ?? []).filter((c) => c.status !== 'completed').length;
  const capaDoneCount = (capaItems ?? []).length - capaOpenCount;
  const capaPageCount = Math.max(1, Math.ceil(filteredCapaItems.length / CAPA_PAGE));
  const safeCapaPage = Math.min(capaListPage, capaPageCount);
  const pagedCapaItems = filteredCapaItems.slice((safeCapaPage - 1) * CAPA_PAGE, safeCapaPage * CAPA_PAGE);
  const showCapaAddForm = capaAddOpen || (capaItems ?? []).length === 0;
  const capaKindLabel = (type: CapaActionItem['actionType']) => (
    type === 'immediate_containment'
      ? t('Fix now', 'এখনই সমাধান', lang)
      : type === 'preventive'
        ? t('Stop it happening again', 'পুনরাবৃত্তি রোধ', lang)
        : t('Remove the cause', 'মূল কারণ সরান', lang)
  );

  return (
    <div>
      {mode === 'oversight' && canReport && (
        <div className="ui-page-header">
          <div className="ui-page-actions" style={{ marginLeft: 'auto' }}>
            <Button variant="secondary" icon={<AlertTriangle size={14} />} onClick={() => setShowQuickHazardModal(true)}>
              {t('Quick hazard report', 'দ্রুত বিপদ রিপোর্ট', lang)}
            </Button>
            <Button icon={<Plus size={14} />} onClick={() => { setWizardStep(1); setWizardSpotFiles([]); setShowLogWizard(true); }}>
              {t('Report an incident', 'ঘটনা রিপোর্ট করুন', lang)}
            </Button>
          </div>
        </div>
      )}
      {mode !== 'oversight' && (canReport || canInvestigate) && (
        <PageHeader
          title={mode === 'reporter' ? t('My safety reports', 'আমার নিরাপত্তা রিপোর্ট', lang) : t('Safety and incidents', 'নিরাপত্তা ও দুর্ঘটনা', lang)}
          actions={
            <>
              {canInvestigate && (
                <Button variant="outline-danger" icon={<Siren size={14} />} onClick={() => setShowEmergencyModal(true)}>
                  {t('Emergency alert', 'জরুরি সতর্কবার্তা', lang)}
                </Button>
              )}
              {canReport && (
                <>
                  <Button variant="secondary" icon={<AlertTriangle size={14} />} onClick={() => setShowQuickHazardModal(true)}>
                    {t('Quick hazard report', 'দ্রুত বিপদ রিপোর্ট', lang)}
                  </Button>
                  <Button icon={<Plus size={14} />} onClick={() => { setWizardStep(1); setWizardSpotFiles([]); setShowLogWizard(true); }}>
                    {t('Report an incident', 'ঘটনা রিপোর্ট করুন', lang)}
                  </Button>
                </>
              )}
            </>
          }
        />
      )}

      <p className={`lv-status ${verdictTone}`} role="status">
        {verdictTone === 'danger' ? <Siren size={16} /> : verdictTone === 'warn' ? <AlertTriangle size={16} /> : verdictTone === 'info' ? <Info size={16} /> : <ShieldCheck size={16} />}
        <span>{verdict}</span>
      </p>
      {emergencyLine && (
        <div className="inc-emergency-line" role="status">
          <Siren size={16} />
          <span>
            {t(
              `Emergency alert at ${emergencyLine.time}: ${emergencyLine.kind} at ${emergencyLine.place}. Muster roll call started.`,
              `${emergencyLine.time}-এ জরুরি সতর্কবার্তা: ${emergencyLine.kindBn}, ${emergencyLine.place}। হাজিরা গণনা শুরু হয়েছে।`,
              lang,
            )}
          </span>
          <Button variant="outline-danger" size="sm" onClick={() => setEmergencyLine(null)}>
            {t('Stand down', 'সতর্কতা তুলে নিন', lang)}
          </Button>
        </div>
      )}

      <div className="inc-sticky-chrome">
      <div className="card mb-4 inc-filters">
        <div className="inc-find">
          <select
            className="form-input"
            value={quick}
            onChange={(e) => setQuick(e.target.value as typeof quick)}
            aria-label={t('Show incidents', 'ঘটনা দেখান', lang)}
          >
            {QUICK.map((q) => (
              <option key={q.id} value={q.id}>{t(...q.label, lang)} ({q.count})</option>
            ))}
          </select>
          <div className="inc-search">
          <Search size={15} />
          <input
            type="text"
            className="form-input"
            placeholder={t('Search by title, place or who reported it', 'শিরোনাম, স্থান বা রিপোর্টকারী দিয়ে খুঁজুন', lang)}
            aria-label={t('Search incidents', 'ঘটনা খুঁজুন', lang)}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button type="button" onClick={() => setSearchQuery('')} aria-label={t('Clear search', 'অনুসন্ধান মুছুন', lang)}><X size={15} /></button>
          )}
          </div>
          <select className="form-input" value={activeTab} onChange={(e) => { setActiveTab(e.target.value as typeof activeTab); setMatrixFilter(null); }} aria-label={t('Kind of incident', 'ঘটনার ধরন', lang)}>
            <option value="all">{t('Every kind of incident', 'সব ধরনের ঘটনা', lang)}</option>
            <option value="spill_leak">{t('Oil and fuel spills', 'তেল / বিটুমিন নিঃসরণ', lang)}</option>
            <option value="near_miss">{t('Near-misses and hazards', 'নিয়ার-মিস ও বিপদ', lang)}</option>
            <option value="first_aid">{t('Injuries and first aid', 'আঘাত ও প্রাথমিক চিকিৎসা', lang)}</option>
            <option value="pressure_piping">{t('Pipes and pressure', 'চাপ ও পাইপলাইন', lang)}</option>
            <option value="electrical_arc">{t('Electrical and machinery', 'বৈদ্যুতিক ও যান্ত্রিক', lang)}</option>
          </select>
          <select className="form-input" value={selectedZone} onChange={(e) => setSelectedZone(e.target.value)} aria-label={t('Plant area', 'প্ল্যান্ট এলাকা', lang)}>
            {PLANT_ZONES.map((zone) => (
              <option key={zone} value={zone}>{zone === 'All Plant Zones' ? t('Every plant area', 'সব প্ল্যান্ট এলাকা', lang) : zone}</option>
            ))}
          </select>
          <select className="form-input" value={selectedSeverity} onChange={(e) => setSelectedSeverity(Number(e.target.value))} aria-label={t('Severity', 'তীব্রতা', lang)}>
            <option value={0}>{t('Any severity', 'যেকোনো তীব্রতা', lang)}</option>
            {[1, 2, 3, 4, 5].map((l) => (
              <option key={l} value={l}>{t(`${l} · ${LEVEL_LABEL[l][0]}`, `${bn(l)} · ${LEVEL_LABEL[l][1]}`, lang)}</option>
            ))}
          </select>
          <select className="form-input" value={selectedStage} onChange={(e) => setSelectedStage(e.target.value as 'all' | IncidentWorkflowStage)} aria-label={t('Stage', 'ধাপ', lang)}>
            <option value="all">{t('Any stage', 'যেকোনো ধাপ', lang)}</option>
            {STAGES.map((s) => (
              <option key={s} value={s}>{t(...STAGE_LABEL[s], lang)}</option>
            ))}
          </select>
        </div>
      </div>
      </div>

      {/* Risk grid: a tool for people who assess risk, hidden for reporters */}
      {mode !== 'reporter' && (
        <details className="card mb-4 inc-grid">
          <summary>
            <Activity size={15} />
            <span>
              <strong>{t('Risk grid: how likely and how severe', 'ঝুঁকির গ্রিড: কত সম্ভাব্য ও কত গুরুতর', lang)}</strong>
              <small>{t('Tap a square to list only the incidents with that risk.', 'কোনো ঘরে চাপ দিলে শুধু সেই ঝুঁকির ঘটনা দেখাবে।', lang)}</small>
            </span>
            {matrixFilter && <em>{t(`Showing severity ${matrixFilter.level} × likelihood ${matrixFilter.likelihood}`, `দেখানো হচ্ছে: তীব্রতা ${bn(matrixFilter.level)} × সম্ভাবনা ${bn(matrixFilter.likelihood)}`, lang)}</em>}
          </summary>
          <div className="card-body" style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: '600px' }}>
              <div className="hse-risk-matrix-grid">
                <div className="hse-matrix-header-cell" style={{ visibility: 'hidden' }}>-</div>
                {([['1. Very rare', '১. অতি বিরল'], ['2. Unlikely', '২. অসম্ভাব্য'], ['3. Possible', '৩. সম্ভাব্য'], ['4. Likely', '৪. সম্ভবত'], ['5. Almost certain', '৫. প্রায় নিশ্চিত']] as [string, string][]).map((h) => (
                  <div key={h[0]} className="hse-matrix-header-cell">{t(h[0], h[1], lang)}</div>
                ))}
                {[5, 4, 3, 2, 1].map((lvl) => (
                  <React.Fragment key={lvl}>
                    <div className="hse-matrix-row-label">{lvl}. {t(...LEVEL_LABEL[lvl], lang)}</div>
                    {[1, 2, 3, 4, 5].map((prob) => {
                      const score = lvl * prob;
                      const riskClass = score >= 20 ? 'risk-crimson' : score >= 15 ? 'risk-red' : score >= 10 ? 'risk-orange' : score >= 5 ? 'risk-yellow' : 'risk-green';
                      const matching = visibleIncidents.filter((i) => i.level === lvl && (i.likelihood || 2) === prob);
                      const isSelected = matrixFilter?.level === lvl && matrixFilter?.likelihood === prob;
                      return (
                        <button
                          type="button"
                          key={prob}
                          className={`hse-matrix-cell ${riskClass} ${isSelected ? 'active-filter' : ''}`}
                          onClick={() => setMatrixFilter(isSelected ? null : { level: lvl, likelihood: prob })}
                          aria-pressed={isSelected}
                          title={t(`${matching.length} incident(s) with severity ${lvl} and likelihood ${prob}`, `তীব্রতা ${bn(lvl)} ও সম্ভাবনা ${bn(prob)} — ${bn(matching.length)}টি ঘটনা`, lang)}
                        >
                          <span style={{ fontSize: '10px', fontWeight: 800 }}>{score >= 15 ? t('Extreme', 'অত্যধিক', lang) : score >= 10 ? t('High', 'উচ্চ', lang) : score >= 5 ? t('Medium', 'মাঝারি', lang) : t('Low', 'নিম্ন', lang)}</span>
                          {matching.length > 0 && <strong className="inc-cell-count">{matching.length}</strong>}
                        </button>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
              <div className="inc-grid-axes">
                <span>← {t('Less likely', 'কম সম্ভাব্য', lang)} · {t('More likely', 'বেশি সম্ভাব্য', lang)} →</span>
                <span>↑ {t('More severe', 'বেশি গুরুতর', lang)}</span>
              </div>
            </div>
          </div>
        </details>
      )}

      {/* Incident cards — compact work queue */}
      <div className="incident-list">
        {quickFiltered.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={hasFilter ? <SearchX size={20} /> : <ShieldCheck size={20} />}
              title={hasFilter ? t('No incident matches these filters', 'এই ফিল্টারে কোনো ঘটনা নেই', lang) : mode === 'reporter' ? t('You have no reports yet', 'আপনার কোনো রিপোর্ট নেই', lang) : t('No incidents recorded', 'কোনো ঘটনা নথিভুক্ত নেই', lang)}
              description={hasFilter ? t('Clear the filters to see everything again.', 'সব দেখতে ফিল্টার মুছুন।', lang) : t('Use "Report an incident" or "Quick hazard report" above.', 'উপরের "ঘটনা রিপোর্ট করুন" বা "দ্রুত বিপদ রিপোর্ট" ব্যবহার করুন।', lang)}
              action={hasFilter ? <Button variant="secondary" size="sm" onClick={clearFilters}>{t('Clear filters', 'ফিল্টার মুছুন', lang)}</Button> : undefined}
            />
          </div>
        ) : (
          pagedIncidents.map((inc) => {
            const isExpanded = expandedIncidentId === inc.id;
            const items = inc.capaItems || [];
            const stage = inc.workflowStage || (inc.capaStatus === 'closed' ? 'closed' : 'under_investigation');
            const stageIdx = Math.max(0, STAGES.indexOf(stage));
            const typeMeta = INCIDENT_TYPE_META[inc.incidentType] || INCIDENT_TYPE_META.near_miss;
            const injured = (inc.personsInvolved || []).filter((p) => p.involvementType === 'injured');
            const capaDone = items.length > 0 && items.every((c) => c.status === 'completed');
            const needsCause = !inc.fiveWhys && (stage === 'reported' || stage === 'triaged' || stage === 'under_investigation');
            const primary: 'rca' | 'capa' | 'close' | null = !canInvestigate || inc.capaStatus === 'closed'
              ? null
              : needsCause
                ? 'rca'
                : capaDone
                  ? 'close'
                  : 'capa';

            return (
              <div key={inc.id} className={`incident-card inc-compact l${inc.level}${isExpanded ? ' is-open' : ''}`}>
                <div className="inc-hd">
                  <div className="inc-tags">
                    <StatusPill tone={inc.level >= 4 ? 'danger' : inc.level === 3 ? 'warn' : 'info'}>
                      {t(...LEVEL_LABEL[inc.level], lang)}
                    </StatusPill>
                    <span className="inc-kind">{t(typeMeta.label, typeMeta.labelBn, lang)}</span>
                    {inc.statutoryReportable && (
                      <StatusPill tone="danger">{t('Tell the government', 'সরকারকে জানান', lang)}</StatusPill>
                    )}
                  </div>
                  <span className="inc-when">{inc.date}</span>
                </div>

                <div className="inc-title-row">
                  <img className="inc-feed-photo" src={inc.photo} alt={t(inc.title, inc.titleBn, lang)} />
                  <div className="inc-title-copy">
                    <h3 className="inc-title">{t(inc.title, inc.titleBn, lang)}</h3>
                    <div className="inc-meta">
                      <MapPin size={12} /> {inc.plantZone || inc.location}
                      {' · '}{t('from', 'রিপোর্ট', lang)} {inc.reportedBy}
                    </div>
                  </div>
                </div>

                {injured.length > 0 && (
                  <div className="inc-injury">
                    <HeartPulse size={14} />
                    <span>
                      {injured.map((p, idx) => (
                        <span key={idx}><strong>{p.name}</strong> ({p.role}): {p.injuryNature}{idx < injured.length - 1 ? ' · ' : ''}</span>
                      ))}
                    </span>
                  </div>
                )}

                <p className="inc-next"><ArrowRight size={13} /> {nextStep(inc)}</p>

                <div className="inc-row-actions">
                  {primary === 'rca' && (
                    <Button size="sm" icon={<HelpCircle size={13} />} onClick={() => openRcaModal(inc)}>
                      {t('Find the cause', 'কারণ খুঁজুন', lang)}
                    </Button>
                  )}
                  {primary === 'capa' && (
                    <Button size="sm" icon={<CheckSquare size={13} />} onClick={() => setSelectedCapaIncidentId(inc.id)}>
                      {t('Manage fixes', 'সমাধান পরিচালনা', lang)}
                    </Button>
                  )}
                  {primary === 'close' && (
                    <Button size="sm" icon={<CheckCircle size={13} />} onClick={() => setSelectedSignoffIncident(inc)}>
                      {t('Verify and close', 'যাচাই করে বন্ধ করুন', lang)}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    onClick={() => setExpandedIncidentId(isExpanded ? null : inc.id)}
                    aria-expanded={isExpanded}
                  >
                    {isExpanded ? t('Less', 'কম', lang) : t('More', 'আরও', lang)}
                  </Button>
                </div>

                {isExpanded && (
                  <div className="inc-more-panel">
                    <div className="inc-photo-row">
                      {inc.photos.map((src, index) => (
                        <img key={`${inc.id}-${index}`} src={src} alt={t(inc.title, inc.titleBn, lang)} />
                      ))}
                    </div>
                    {(inc.spotFiles ?? []).some((file) => file.mime === 'application/pdf') && (
                      <div className="inc-spot-block">
                        <div className="inc-spot-label">{t('Files', 'ফাইল', lang)}</div>
                        <div className="inc-spot-grid">
                          {inc.spotFiles!.filter((file) => file.mime === 'application/pdf').map((file) => (
                            <a key={file.id} className="inc-spot-pdf" href={file.dataUrl} target="_blank" rel="noreferrer">
                              <Paperclip size={14} />
                              <span>{file.name}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    {inc.rootCause && (
                      <p className="inc-cause"><strong>{t('Cause', 'কারণ', lang)}:</strong> {inc.rootCause}</p>
                    )}
                    <div className="inc-steps" role="img" aria-label={t(`Step ${stageIdx + 1} of 5: ${STAGE_LABEL[stage][0]}`, `ধাপ ${bn(stageIdx + 1)}/৫: ${STAGE_LABEL[stage][1]}`, lang)}>
                      <div className="inc-step-bars">
                        {STAGES.map((s, i) => <span key={s} className={i <= stageIdx ? 'on' : ''} />)}
                      </div>
                      <small>{t(`Step ${stageIdx + 1} of 5 · ${STAGE_LABEL[stage][0]}`, `ধাপ ${bn(stageIdx + 1)}/৫ · ${STAGE_LABEL[stage][1]}`, lang)}</small>
                    </div>
                    {inc.immediateActionsTaken && (
                      <p className="inc-cause"><strong>{t('Done on the spot', 'তাৎক্ষণিক পদক্ষেপ', lang)}:</strong> {inc.immediateActionsTaken}</p>
                    )}
                    {inc.closureSignOff && (
                      <p className="inc-closed">
                        <ShieldCheck size={14} />
                        <span>
                          {t('Closed by', 'বন্ধ করেছেন', lang)} {inc.closureSignOff.safetyOfficerName}
                          {inc.closureSignOff.gmName ? ` · ${inc.closureSignOff.gmName}` : ''}
                        </span>
                      </p>
                    )}
                    <p className="inc-ref-line">
                      {inc.incNo}
                      {' · '}{inc.shift}
                      {' · '}{t(`Risk ${inc.riskScore || inc.level * 2} of 25`, `ঝুঁকি ${bn(inc.riskScore || inc.level * 2)}/২৫`, lang)}
                    </p>
                    <div className="inc-foot-actions">
                      {canInvestigate && primary !== 'rca' && (
                        <Button variant="secondary" size="sm" icon={<HelpCircle size={13} />} onClick={() => openRcaModal(inc)}>
                          {inc.fiveWhys ? t('Cause analysis', 'কারণ বিশ্লেষণ', lang) : t('Find the cause', 'কারণ খুঁজুন', lang)}
                        </Button>
                      )}
                      {canInvestigate && primary !== 'capa' && inc.capaStatus !== 'closed' && (
                        <Button variant="secondary" size="sm" icon={<CheckSquare size={13} />} onClick={() => setSelectedCapaIncidentId(inc.id)}>
                          {t('Manage fixes', 'সমাধান পরিচালনা', lang)}
                        </Button>
                      )}
                      {mode !== 'reporter' && inc.statutoryReportable && (
                        <Button variant="secondary" size="sm" icon={<FileText size={13} />} onClick={() => setSelectedDossierIncident(inc)}>
                          {t('Government report', 'সরকারি প্রতিবেদন', lang)}
                        </Button>
                      )}
                      {canInvestigate && primary !== 'close' && inc.capaStatus !== 'closed' && (
                        <Button
                          size="sm"
                          icon={<CheckCircle size={13} />}
                          disabled={!capaDone}
                          title={capaDone ? undefined : t('Finish all fixes first', 'আগে সব সমাধান শেষ করুন', lang)}
                          onClick={() => capaDone && setSelectedSignoffIncident(inc)}
                        >
                          {t('Verify and close', 'যাচাই করে বন্ধ করুন', lang)}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      {quickFiltered.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <Pagination
            currentPage={safeIncPage}
            totalItems={quickFiltered.length}
            pageSize={INCIDENT_PAGE}
            onPageChange={setIncListPage}
            lang={lang}
            alwaysShow
          />
        </div>
      )}

      {/* Report an incident: three short steps */}
      <Modal
        open={showLogWizard}
        onClose={() => { setShowLogWizard(false); setWizardError(null); }}
        title={t('Report an incident', 'ঘটনা রিপোর্ট করুন', lang)}
        icon={<ShieldAlert size={16} />}
        size="md"
        footer={
          <>
            {wizardStep > 1 && (
              <Button variant="ghost" onClick={() => { setWizardError(null); setWizardStep((prev) => (prev - 1) as 1 | 2 | 3); }}>
                {t('Back', 'পূর্ববর্তী', lang)}
              </Button>
            )}
            <Button variant="ghost" onClick={() => { setShowLogWizard(false); setWizardError(null); }}>{t('Cancel', 'বাতিল', lang)}</Button>
            {wizardStep < 3 ? (
              <Button
                icon={<ArrowRight size={14} />}
                onClick={() => {
                  if (wizardStep === 1 && !wizardTitle.trim()) {
                    setWizardError(t('Say in one line what happened.', 'এক লাইনে লিখুন কী ঘটেছে।', lang));
                    return;
                  }
                  if (wizardStep === 2 && !wizardImmediateActions.trim()) {
                    setWizardError(t('Write what was done on the spot, even if it was only to keep people away.', 'ঘটনাস্থলে কী করা হয়েছে লিখুন, এমনকি শুধু মানুষকে সরিয়ে রাখা হলেও।', lang));
                    return;
                  }
                  setWizardError(null);
                  setWizardStep((prev) => (prev + 1) as 1 | 2 | 3);
                }}
              >
                {t('Continue', 'পরবর্তী ধাপ', lang)}
              </Button>
            ) : (
              <Button icon={<Send size={14} />} onClick={() => { setWizardError(null); handleWizardSubmit(); }}>
                {t('Submit report', 'রিপোর্ট জমা দিন', lang)}
              </Button>
            )}
          </>
        }
      >
        <div className="inc-steps" style={{ marginTop: 0, marginBottom: 14 }}>
          <div className="inc-step-bars" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {[1, 2, 3].map((n) => <span key={n} className={n <= wizardStep ? 'on' : ''} />)}
          </div>
          <small>
            {t(`Step ${wizardStep} of 3`, `ধাপ ${bn(wizardStep)}/৩`, lang)}
            {' · '}
            {wizardStep === 1 ? t('What happened and where', 'কী ঘটেছে ও কোথায়', lang) : wizardStep === 2 ? t('How serious, and what you did', 'কতটা গুরুতর, আর কী করেছেন', lang)
              : t('Who was involved', 'কারা জড়িত', lang)}
          </small>
        </div>

        {wizardStep === 1 && (
          <>
            <FormField label={t('What happened? (one line)', 'কী ঘটেছে? (এক লাইনে)', lang)} required error={wizardError}>
              {(id) => (
                <input
                  id={id}
                  type="text"
                  value={wizardTitle}
                  onChange={(e) => { setWizardTitle(e.target.value); setWizardError(null); }}
                  placeholder={t('e.g. Small oil drip on valve V-204', 'যেমন: ভালভ V-204 থেকে অল্প তেল চুঁইয়ে পড়ছে', lang)}
                />
              )}
            </FormField>
            <FormField label={t('Kind of incident', 'ঘটনার ধরন', lang)} required>
              {(id) => (
                <select id={id} value={wizardType} onChange={(e) => setWizardType(e.target.value as IncidentType)}>
                  {(Object.keys(INCIDENT_TYPE_META) as IncidentType[]).map((type) => (
                    <option key={type} value={type}>{t(INCIDENT_TYPE_META[type].label, INCIDENT_TYPE_META[type].labelBn, lang)}</option>
                  ))}
                </select>
              )}
            </FormField>
            <FormField label={t('Plant area', 'প্ল্যান্টের এলাকা', lang)} required>
              {(id) => (
                <select
                  id={id}
                  value={wizardZone}
                  onChange={(e) => { setWizardZone(e.target.value); setWizardLocation(e.target.value); }}
                >
                  {PLANT_ZONES.filter((z) => z !== 'All Plant Zones').map((z) => (
                    <option key={z} value={z}>{z}</option>
                  ))}
                </select>
              )}
            </FormField>
            <FormField label={t('Exact spot or equipment', 'সুনির্দিষ্ট জায়গা বা যন্ত্র', lang)} hint={t('For example the tank, valve or bay number.', 'যেমন ট্যাংক, ভালভ বা বে নম্বর।', lang)}>
              {(id) => (
                <input id={id} type="text" value={wizardLocation} onChange={(e) => setWizardLocation(e.target.value)} placeholder={t('e.g. Tank TK-102 lower valve', 'যেমন: ট্যাংক TK-102 এর নিচের ভালভ', lang)} />
              )}
            </FormField>
            <FormField label={t('Shift when it happened', 'যে শিফটে ঘটেছে', lang)}>
              {(id) => (
                <select id={id} value={wizardShift} onChange={(e) => setWizardShift(e.target.value as typeof wizardShift)}>
                  <option value="Morning Shift (07:00 - 15:00)">{t('Morning (07:00 – 15:00)', 'সকাল (০৭:০০ – ১৫:০০)', lang)}</option>
                  <option value="Evening Shift (15:00 - 23:00)">{t('Evening (15:00 – 23:00)', 'সন্ধ্যা (১৫:০০ – ২৩:০০)', lang)}</option>
                  <option value="Night Shift (23:00 - 07:00)">{t('Night (23:00 – 07:00)', 'রাত (২৩:০০ – ০৭:০০)', lang)}</option>
                </select>
              )}
            </FormField>
            <p className="hs-meta">{t('Reported by', 'রিপোর্টকারী', lang)}: <strong>{currentPersona.name}</strong> ({currentPersona.label})</p>
          </>
        )}

        {wizardStep === 2 && (
          <>
            <FormField label={t('How serious was the result?', 'ফলাফল কতটা গুরুতর?', lang)} required>
              {(id) => (
                <select id={id} value={wizardSeverity} onChange={(e) => setWizardSeverity(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}>
                  <option value={1}>{t('1 Minor: nothing damaged, nobody hurt', '১ সামান্য: কিছু নষ্ট হয়নি, কেউ আহত হয়নি', lang)}</option>
                  <option value={2}>{t('2 Low: a near-miss or minor first aid', '২ নিম্ন: অল্পের জন্য রক্ষা বা সামান্য প্রাথমিক চিকিৎসা', lang)}</option>
                  <option value={3}>{t('3 Moderate: a leak or equipment stopped', '৩ মাঝারি: লিক বা যন্ত্র বন্ধ', lang)}</option>
                  <option value={4}>{t('4 Major: high heat or pressure emergency', '৪ গুরুতর: অতিরিক্ত তাপ বা চাপের জরুরি অবস্থা', lang)}</option>
                  <option value={5}>{t('5 Critical: plant shutdown or disaster', '৫ চরম: প্ল্যান্ট বন্ধ বা বিপর্যয়', lang)}</option>
                </select>
              )}
            </FormField>
            <FormField label={t('How likely is it to happen again?', 'আবার ঘটার সম্ভাবনা কতটা?', lang)} required>
              {(id) => (
                <select id={id} value={wizardLikelihood} onChange={(e) => setWizardLikelihood(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}>
                  <option value={1}>{t('1 Rare: about once in 5+ years', '১ বিরল: ৫+ বছরে একবার', lang)}</option>
                  <option value={2}>{t('2 Unlikely: has happened once here', '২ অসম্ভাব্য: এখানে একবার ঘটেছে', lang)}</option>
                  <option value={3}>{t('3 Possible: could happen in abnormal conditions', '৩ সম্ভাব্য: অস্বাভাবিক অবস্থায় ঘটতে পারে', lang)}</option>
                  <option value={4}>{t('4 Likely: will recur without a safeguard', '৪ সম্ভবত: প্রতিরোধ ছাড়া আবার ঘটবে', lang)}</option>
                  <option value={5}>{t('5 Almost certain: about to recur', '৫ প্রায় নিশ্চিত: শিগগির আবার ঘটবে', lang)}</option>
                </select>
              )}
            </FormField>

            {(() => {
              const score = wizardSeverity * wizardLikelihood;
              const tone = score >= 15 ? 'bad' : score >= 10 ? 'warn' : 'ok';
              const word = score >= 15 ? t('extreme', 'অত্যধিক', lang) : score >= 10 ? t('high', 'উচ্চ', lang) : score >= 5 ? t('medium', 'মাঝারি', lang) : t('low', 'নিম্ন', lang);
              return (
                <ul className="asg-checks" style={{ marginBottom: 14 }}>
                  <li className={tone}>
                    {tone === 'ok' ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
                    <span>{t(`Risk is ${word} (${score} out of 25).`, `ঝুঁকি ${word} (২৫-এর মধ্যে ${bn(score)})।`, lang)}</span>
                  </li>
                  {wizardSeverity >= 3 && (
                    <li className="bad">
                      <AlertTriangle size={13} />
                      <span>{t('This must be reported to the Department of Explosives within 24 hours. We prepare the report for you.', 'এটি ২৪ ঘণ্টার মধ্যে বিস্ফোরক অধিদপ্তরকে জানাতে হবে। রিপোর্ট আমরা তৈরি করে দেব।', lang)}</span>
                    </li>
                  )}
                </ul>
              );
            })()}

            <FormField label={t('What was done on the spot?', 'ঘটনাস্থলে কী করা হয়েছে?', lang)} required error={wizardError}>
              {(id) => (
                <textarea
                  id={id}
                  rows={3}
                  value={wizardImmediateActions}
                  onChange={(e) => { setWizardImmediateActions(e.target.value); setWizardError(null); }}
                  placeholder={t('e.g. Closed valve V-204, put absorbent boom around it, kept people 10 m away', 'যেমন: ভালভ V-204 বন্ধ করা হয়েছে, চারপাশে শোষক বুম দেওয়া হয়েছে, ১০ মিটারের মধ্যে কাউকে যেতে দেওয়া হয়নি', lang)}
                />
              )}
            </FormField>
          </>
        )}

        {wizardStep === 3 && (
          <>
            <label className="inc-check">
              <input type="checkbox" checked={wizardHasInjury} onChange={(e) => setWizardHasInjury(e.target.checked)} />
              <span>{t('Was anyone hurt or given first aid?', 'কেউ কি আহত হয়েছেন বা প্রাথমিক চিকিৎসা পেয়েছেন?', lang)}</span>
            </label>

            {wizardHasInjury && (
              <div className="inc-injury-box">
                <FormField label={t('Who was hurt?', 'কে আহত হয়েছেন?', lang)} required>
                  {(id) => (
                    <select id={id} value={wizardInjuredEmpId} onChange={(e) => setWizardInjuredEmpId(e.target.value)}>
                      <option value="">{t('Choose from the staff list', 'কর্মী তালিকা থেকে বেছে নিন', lang)}</option>
                      {activeEmployees.map((emp) => (
                        <option key={emp.id} value={emp.id}>{emp.name} ({emp.designation})</option>
                      ))}
                    </select>
                  )}
                </FormField>
                <FormField label={t('What was the injury?', 'আঘাত কী ধরনের?', lang)}>
                  {(id) => (
                    <input id={id} type="text" value={wizardInjuryNature} onChange={(e) => setWizardInjuryNature(e.target.value)} placeholder={t('e.g. Small burn on the right forearm', 'যেমন: ডান হাতের কবজির কাছে সামান্য পোড়া', lang)} />
                  )}
                </FormField>
                <FormField label={t('What treatment was given?', 'কী চিকিৎসা দেওয়া হয়েছে?', lang)}>
                  {(id) => (
                    <input id={id} type="text" value={wizardTreatmentGiven} onChange={(e) => setWizardTreatmentGiven(e.target.value)} placeholder={t('e.g. Cold pack at the plant clinic', 'যেমন: প্ল্যান্ট ক্লিনিকে ঠান্ডা প্যাক', lang)} />
                  )}
                </FormField>
              </div>
            )}

            <FormField label={t('Who saw it? (optional)', 'কে দেখেছেন? (ঐচ্ছিক)', lang)}>
              {(id) => (
                <input id={id} type="text" value={wizardWitnessName} onChange={(e) => setWizardWitnessName(e.target.value)} placeholder={t('e.g. Mizanur Rahman (Security)', 'যেমন: মিজানুর রহমান (নিরাপত্তা)', lang)} />
              )}
            </FormField>

            <div className="inc-spot-attach">
              <div className="inc-spot-label">{t('Photos or files of the spot', 'ঘটনাস্থলের ছবি বা ফাইল', lang)}</div>
              <p className="inc-spot-hint">
                {t('Take a photo or attach a picture or PDF from this phone. Up to 6 files.', 'এই ফোন থেকে ছবি তুলুন, অথবা ছবি বা PDF যুক্ত করুন। সর্বোচ্চ ৬টি।', lang)}
              </p>
              <input
                ref={spotCameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                hidden
                onChange={(e) => { void addSpotFiles(e.target.files, wizardSpotFiles, setWizardSpotFiles); e.target.value = ''; }}
              />
              <input
                ref={spotFileInputRef}
                type="file"
                accept="image/*,application/pdf,.pdf"
                multiple
                hidden
                onChange={(e) => { void addSpotFiles(e.target.files, wizardSpotFiles, setWizardSpotFiles); e.target.value = ''; }}
              />
              <div className="inc-spot-actions">
                <Button type="button" variant="secondary" icon={<Camera size={14} />} onClick={() => spotCameraInputRef.current?.click()}>
                  {t('Take a photo', 'ছবি তুলুন', lang)}
                </Button>
                <Button type="button" variant="ghost" icon={<Paperclip size={14} />} onClick={() => spotFileInputRef.current?.click()}>
                  {t('Choose files', 'ফাইল বেছে নিন', lang)}
                </Button>
              </div>
              {wizardSpotFiles.length > 0 && (
                <div className="inc-spot-grid">
                  {wizardSpotFiles.map((file) => (
                    <div key={file.id} className="inc-spot-item">
                      {file.mime === 'application/pdf' ? (
                        <div className="inc-spot-pdf">
                          <Paperclip size={14} />
                          <span>{file.name}</span>
                        </div>
                      ) : (
                        <img src={file.dataUrl} alt={file.name} />
                      )}
                      <button
                        type="button"
                        className="inc-spot-remove"
                        aria-label={t(`Remove ${file.name}`, `${file.name} সরান`, lang)}
                        onClick={() => setWizardSpotFiles((prev) => prev.filter((f) => f.id !== file.id))}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </Modal>

      {/* ─── MODAL 2: 1-MINUTE GOOD CATCH / HAZARD REPORTER ─── */}
      {showQuickHazardModal && (
        <div className="modal-bg" onClick={() => { setShowQuickHazardModal(false); setQuickHazardFiles([]); }}>
          <div className="modal" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-hd" style={{ background: 'var(--status-purple-solid)', color: 'var(--text-on-brand)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={18} color="var(--text-on-brand)" />
                <h3 style={{ color: 'var(--text-on-brand)', margin: 0 }}>
                  {t('1-Minute "Good Catch" / Hazard Observation', '১-মিনিট বিপদ ও নিয়ার-মিস পর্যবেক্ষণ রিপোর্ট', lang)}
                </h3>
              </div>
              <button className="modal-close" style={{ color: 'var(--text-on-brand)' }} onClick={() => { setShowQuickHazardModal(false); setQuickHazardFiles([]); }}>×</button>
            </div>

            <div className="modal-body">
              <div style={{ background: 'var(--status-purple-bg)', border: '1px solid var(--status-purple-border)', padding: '10px 12px', borderRadius: '6px', fontSize: '11.5px', color: 'var(--status-purple-text)', marginBottom: '14px' }}>
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

              <div className="inc-spot-attach">
                <div className="inc-spot-label">{t('Photos or files of the spot', 'ঘটনাস্থলের ছবি বা ফাইল', lang)}</div>
                <p className="inc-spot-hint">
                  {t('Take a photo or attach a picture or PDF from this phone. Up to 6 files.', 'এই ফোন থেকে ছবি তুলুন, অথবা ছবি বা PDF যুক্ত করুন। সর্বোচ্চ ৬টি।', lang)}
                </p>
                <input
                  ref={hazardCameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  hidden
                  onChange={(e) => { void addSpotFiles(e.target.files, quickHazardFiles, setQuickHazardFiles); e.target.value = ''; }}
                />
                <input
                  ref={hazardFileInputRef}
                  type="file"
                  accept="image/*,application/pdf,.pdf"
                  multiple
                  hidden
                  onChange={(e) => { void addSpotFiles(e.target.files, quickHazardFiles, setQuickHazardFiles); e.target.value = ''; }}
                />
                <div className="inc-spot-actions">
                  <Button type="button" variant="secondary" icon={<Camera size={14} />} onClick={() => hazardCameraInputRef.current?.click()}>
                    {t('Take a photo', 'ছবি তুলুন', lang)}
                  </Button>
                  <Button type="button" variant="ghost" icon={<Paperclip size={14} />} onClick={() => hazardFileInputRef.current?.click()}>
                    {t('Choose files', 'ফাইল বেছে নিন', lang)}
                  </Button>
                </div>
                {quickHazardFiles.length > 0 && (
                  <div className="inc-spot-grid">
                    {quickHazardFiles.map((file) => (
                      <div key={file.id} className="inc-spot-item">
                        {file.mime === 'application/pdf' ? (
                          <div className="inc-spot-pdf">
                            <Paperclip size={14} />
                            <span>{file.name}</span>
                          </div>
                        ) : (
                          <img src={file.dataUrl} alt={file.name} />
                        )}
                        <button
                          type="button"
                          className="inc-spot-remove"
                          aria-label={t(`Remove ${file.name}`, `${file.name} সরান`, lang)}
                          onClick={() => setQuickHazardFiles((prev) => prev.filter((f) => f.id !== file.id))}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-ft">
              <button className="btn-sm-ghost" onClick={() => { setShowQuickHazardModal(false); setQuickHazardFiles([]); }}>{t('Cancel', 'বাতিল', lang)}</button>
              <button
                type="button"
                className="btn-primary"
                style={{ background: 'var(--status-purple-solid)', borderColor: 'var(--status-purple)' }}
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
            <div className="modal-hd" style={{ background: 'linear-gradient(135deg, var(--surface-inverse-2) 0%, var(--surface-inverse) 100%)', color: 'var(--text-on-brand)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <HelpCircle size={18} color="var(--status-warning-bright)" />
                  <h3 style={{ color: 'var(--text-on-brand)', margin: 0 }}>
                    {t('Problem Root Cause Finder (5-Whys & Fishbone Diagram)', 'সমস্যার মূল কারণ অনুসন্ধান (৫-কেন ও ফিশবোন চার্ট)', lang)}
                  </h3>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-inverse-2)', marginTop: '2px' }}>
                  {selectedRcaIncident.incNo} • {selectedRcaIncident.title}
                </div>
              </div>
              <button className="modal-close" style={{ color: 'var(--text-on-brand)' }} onClick={() => setSelectedRcaIncident(null)}>×</button>
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
                  <div style={{ background: 'var(--status-warning-bg)', border: '1px solid var(--status-warning-bright)', padding: '10px 14px', borderRadius: '6px', marginBottom: '16px', fontSize: '12px', color: 'var(--status-warning-text)' }}>
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
                            border: rcaCategory === cat ? '2px solid var(--status-info-solid-dark)' : '1px solid var(--brand-slate-200)',
                            background: rcaCategory === cat ? 'var(--status-info-bg)' : 'var(--surface-1)',
                            fontWeight: rcaCategory === cat ? 800 : 600,
                            color: rcaCategory === cat ? 'var(--status-info-text)' : 'var(--brand-slate-700)',
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
                    <div style={{ borderLeft: '3px solid var(--status-info-bright)', paddingLeft: '12px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--status-info-text)' }}>1. Why did the direct physical problem occur?</label>
                      <input
                        type="text"
                        className="form-input"
                        style={{ fontSize: '12px', width: '100%', marginTop: '3px' }}
                        value={rcaWhy1}
                        onChange={(e) => setRcaWhy1(e.target.value)}
                        placeholder="e.g. Bitumen seeped past lower flange drain valve during shift walk"
                      />
                    </div>

                    <div style={{ borderLeft: '3px solid var(--status-info)', paddingLeft: '12px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--status-info-text)' }}>2. Why did that happen?</label>
                      <input
                        type="text"
                        className="form-input"
                        style={{ fontSize: '12px', width: '100%', marginTop: '3px' }}
                        value={rcaWhy2}
                        onChange={(e) => setRcaWhy2(e.target.value)}
                        placeholder="e.g. Sealing gasket experienced thermal cracking and lost compression"
                      />
                    </div>

                    <div style={{ borderLeft: '3px solid var(--status-info)', paddingLeft: '12px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--status-info-text)' }}>3. Why did that happen?</label>
                      <input
                        type="text"
                        className="form-input"
                        style={{ fontSize: '12px', width: '100%', marginTop: '3px' }}
                        value={rcaWhy3}
                        onChange={(e) => setRcaWhy3(e.target.value)}
                        placeholder="e.g. Nitrile rubber gasket fitted instead of high-temperature Viton gasket"
                      />
                    </div>

                    <div style={{ borderLeft: '3px solid var(--status-info-solid-dark)', paddingLeft: '12px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--status-info-text)' }}>4. Why did that happen?</label>
                      <input
                        type="text"
                        className="form-input"
                        style={{ fontSize: '12px', width: '100%', marginTop: '3px' }}
                        value={rcaWhy4}
                        onChange={(e) => setRcaWhy4(e.target.value)}
                        placeholder="e.g. Viton seals were depleted in the store room during last turnaround"
                      />
                    </div>

                    <div style={{ borderLeft: '3px solid var(--status-danger-solid-dark)', paddingLeft: '12px', background: 'var(--status-danger-bg)', padding: '10px 12px', borderRadius: '6px' }}>
                      <label style={{ fontSize: '11.5px', fontWeight: 900, color: 'var(--status-danger-text)' }}>5. Systemic Root Cause (The Core Preventable Flaw):</label>
                      <textarea
                        rows={2}
                        className="form-input"
                        style={{ fontSize: '12px', width: '100%', marginTop: '4px', borderColor: 'var(--status-danger-bright)' }}
                        value={rcaWhy5}
                        onChange={(e) => setRcaWhy5(e.target.value)}
                        placeholder="e.g. Enforce mandatory ERP safety stock of 10 Viton gaskets and require material verification in turnaround checklist."
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ background: 'var(--surface-0)', border: '1px solid var(--brand-slate-200)', padding: '10px 14px', borderRadius: '6px', marginBottom: '16px', fontSize: '12px', color: 'var(--brand-slate-700)' }}>
                    📊 <strong>Ishikawa 6M Cause Mapping:</strong> Map contributing factors across the 6 industrial dimensions (People, Machine, Method, Material, Measurement, Environment).
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                    <div className="form-group">
                      <label style={{ fontSize: '11.5px', fontWeight: 700 }}>People (training / fatigue / supervision)</label>
                      <input
                        type="text"
                        className="form-input"
                        value={fishPeople}
                        onChange={(e) => setFishPeople(e.target.value)}
                        placeholder="e.g. Night turnaround crew under time pressure"
                      />
                    </div>

                    <div className="form-group">
                      <label style={{ fontSize: '11.5px', fontWeight: 700 }}>Machine (equipment / flanges / valves)</label>
                      <input
                        type="text"
                        className="form-input"
                        value={fishMachine}
                        onChange={(e) => setFishMachine(e.target.value)}
                        placeholder="e.g. Tank TK-102 bottom discharge flange"
                      />
                    </div>

                    <div className="form-group">
                      <label style={{ fontSize: '11.5px', fontWeight: 700 }}>Method (procedures / SOPs / checklists)</label>
                      <input
                        type="text"
                        className="form-input"
                        value={fishMethod}
                        onChange={(e) => setFishMethod(e.target.value)}
                        placeholder="e.g. Turnaround checklist lacked gasket rating signoff"
                      />
                    </div>

                    <div className="form-group">
                      <label style={{ fontSize: '11.5px', fontWeight: 700 }}>Material (chemicals / gaskets / spares)</label>
                      <input
                        type="text"
                        className="form-input"
                        value={fishMaterial}
                        onChange={(e) => setFishMaterial(e.target.value)}
                        placeholder="e.g. Standard nitrile used instead of Viton 240°C"
                      />
                    </div>

                    <div className="form-group">
                      <label style={{ fontSize: '11.5px', fontWeight: 700 }}>Measurement (sensors / inspections)</label>
                      <input
                        type="text"
                        className="form-input"
                        value={fishMeasurement}
                        onChange={(e) => setFishMeasurement(e.target.value)}
                        placeholder="e.g. Flange thermographic imaging omitted"
                      />
                    </div>

                    <div className="form-group">
                      <label style={{ fontSize: '11.5px', fontWeight: 700 }}>Environment (heat / rain / lighting)</label>
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

      {/* ─── MODAL 4: ASSIGN AND TRACK FIXES ─── */}
      {selectedCapaIncident && (
        <div className="modal-bg" onClick={() => setSelectedCapaIncidentId(null)}>
          <div className="modal" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-hd">
              <div>
                <h3>
                  <CheckSquare size={18} />
                  {t('Assign and track fixes', 'সমাধান দিন ও খোঁজ রাখুন', lang)}
                </h3>
                <p className="capa-hd-sub">
                  {t(selectedCapaIncident.title, selectedCapaIncident.titleBn, lang)}
                </p>
              </div>
              <button type="button" className="modal-close" onClick={() => setSelectedCapaIncidentId(null)} aria-label={t('Close', 'বন্ধ করুন', lang)}>×</button>
            </div>

            <div className="modal-body capa-body">
              <p className="capa-next" role="status">
                {capaOpenCount > 0
                  ? t(
                    `${capaOpenCount} still open of ${(capaItems ?? []).length}. Mark one done, or add another named owner.`,
                    `${bn((capaItems ?? []).length)}টির মধ্যে ${bn(capaOpenCount)}টি এখনো চলমান। একটি শেষ করুন, অথবা নতুন দায়িত্ব দিন।`,
                    lang,
                  )
                  : (capaItems ?? []).length > 0
                    ? t('All listed fixes are done. Verify on site, then close the incident.', 'তালিকার সব সমাধান শেষ। সাইটে যাচাই করে ঘটনাটি বন্ধ করুন।', lang)
                    : t('No fixes assigned yet. Add the first named owner and what they must do.', 'এখনও কোনো সমাধান দেওয়া হয়নি। প্রথম দায়িত্ব ও কাজ লিখুন।', lang)}
              </p>

              <div className="capa-toolbar">
                <div className="psf-filters" role="group" aria-label={t('Filter fixes', 'সমাধান ফিল্টার', lang)}>
                  {([
                    { key: 'open' as const, label: t('Still open', 'চলমান', lang), count: capaOpenCount },
                    { key: 'done' as const, label: t('Done', 'শেষ', lang), count: capaDoneCount },
                    { key: 'all' as const, label: t('All', 'সব', lang), count: (capaItems ?? []).length },
                  ]).map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      className={`psf-filter ${capaListFilter === f.key ? 'active' : ''}`}
                      aria-pressed={capaListFilter === f.key}
                      onClick={() => { setCapaListFilter(f.key); setCapaListPage(1); }}
                    >
                      {f.label} <b>{f.count}</b>
                    </button>
                  ))}
                </div>
                <label className="dash-search capa-search">
                  <Search size={14} aria-hidden />
                  <input
                    type="search"
                    value={capaListQuery}
                    onChange={(e) => { setCapaListQuery(e.target.value); setCapaListPage(1); }}
                    placeholder={t('Search by work or owner', 'কাজ বা দায়িত্বপ্রাপ্ত খুঁজুন', lang)}
                    aria-label={t('Search fixes', 'সমাধান খুঁজুন', lang)}
                  />
                  {capaListQuery && (
                    <button type="button" onClick={() => { setCapaListQuery(''); setCapaListPage(1); }} aria-label={t('Clear search', 'অনুসন্ধান মুছুন', lang)}>
                      <X size={13} />
                    </button>
                  )}
                </label>
              </div>

              {pagedCapaItems.length === 0 ? (
                <EmptyState
                  compact
                  icon={<SearchX size={20} />}
                  title={capaListQuery || capaListFilter !== 'open'
                    ? t('No fix matches', 'কোনো সমাধান মেলেনি', lang)
                    : t('Nothing still open', 'কিছুই চলমান নেই', lang)}
                  description={capaListQuery || capaListFilter !== 'all'
                    ? t('Try another search, or show all.', 'অন্য খোঁজ করুন, অথবা সব দেখুন।', lang)
                    : t('Add a named owner and what they must do.', 'দায়িত্বপ্রাপ্ত ও কাজ লিখে যোগ করুন।', lang)}
                  action={
                    (capaListQuery || capaListFilter !== 'all') ? (
                      <Button variant="secondary" size="sm" onClick={() => { setCapaListQuery(''); setCapaListFilter('all'); setCapaListPage(1); }}>
                        {t('Show all fixes', 'সব সমাধান দেখুন', lang)}
                      </Button>
                    ) : undefined
                  }
                />
              ) : (
                <>
                  <ul className="inc-fix-list capa-scroll">
                    {pagedCapaItems.map((c) => (
                      <li key={c.id} className={c.status === 'completed' ? 'done' : ''}>
                        <span>
                          <strong>{c.description}</strong>
                          <small>
                            {t('Assigned to', 'দায়িত্ব', lang)} {c.owner}
                            {' · '}{capaKindLabel(c.actionType)}
                            {' · '}{t('due', 'সময়সীমা', lang)} {c.dueDate}
                            {c.priority === 'high' ? ` · ${t('High', 'জরুরি', lang)}` : ''}
                          </small>
                        </span>
                        {c.status === 'completed' ? (
                          <StatusPill tone="success">{t('Done', 'শেষ', lang)}</StatusPill>
                        ) : (
                          <Button
                            size="sm"
                            variant="secondary"
                            icon={<Check size={12} />}
                            onClick={() => {
                              toggleCapaStatus(selectedCapaIncident.id, c.id, 'completed', 'Verified compliant on site');
                              showToast(t('Marked done. Waiting for site verification before close.', 'শেষ হিসেবে চিহ্নিত। বন্ধ করার আগে সাইটে যাচাই বাকি।', lang), 'success');
                            }}
                          >
                            {t('Mark done', 'শেষ করুন', lang)}
                          </Button>
                        )}
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {showCapaAddForm ? (
                <div className="capa-add" id="capa-add-form">
                  <div className="capa-add-hd">
                    <strong>{t('Add a fix', 'একটি সমাধান যোগ করুন', lang)}</strong>
                    {(capaItems ?? []).length > 0 && (
                      <button type="button" className="btn-sm-ghost" onClick={() => setCapaAddOpen(false)}>
                        {t('Hide form', 'ফর্ম লুকান', lang)}
                      </button>
                    )}
                  </div>
                  <div className="form-group mb-2">
                    <label htmlFor="capa-desc">{t('What must be done', 'কী করতে হবে', lang)}</label>
                    <input
                      id="capa-desc"
                      type="text"
                      className="form-input"
                      placeholder={t('e.g. Replace the TK-102 drain-valve gasket tonight', 'যেমন: আজ রাতে ট্যাংক ১০২-এর গ্যাসকেট বদলান', lang)}
                      value={newCapaDesc}
                      aria-invalid={capaDescError}
                      onChange={(e) => {
                        setNewCapaDesc(e.target.value);
                        if (e.target.value.trim()) setCapaDescError(false);
                      }}
                    />
                    {capaDescError && (
                      <small className="capa-err">{t('A short description is required.', 'সংক্ষিপ্ত বিবরণ প্রয়োজন।', lang)}</small>
                    )}
                  </div>
                  <div className="form-row mb-2">
                    <div className="form-group">
                      <label htmlFor="capa-owner">{t('Who will do it', 'কে করবেন', lang)}</label>
                      <select id="capa-owner" className="form-input" value={newCapaOwner} onChange={(e) => setNewCapaOwner(e.target.value)}>
                        <option value="Plant Maintenance Team">{t('Plant Maintenance Team', 'প্ল্যান্ট রক্ষণাবেক্ষণ দল', lang)}</option>
                        <option value="Electrical & Gate Maintenance">{t('Electrical & Gate Maintenance', 'বৈদ্যুতিক ও গেট রক্ষণাবেক্ষণ', lang)}</option>
                        <option value="Central Workshop Fabrication Crew">{t('Central Workshop Fabrication Crew', 'কেন্দ্রীয় ওয়ার্কশপ দল', lang)}</option>
                        <option value="Safety & Admin Team">{t('Safety & Admin Team', 'নিরাপত্তা ও প্রশাসন দল', lang)}</option>
                        <option value="Farhana Kabir (Lead Safety Officer)">Farhana Kabir</option>
                        <option value="Engr. Md. Harunur Rashid (Plant GM)">Engr. Md. Harunur Rashid</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="capa-priority">{t('How soon', 'কত তাড়াতাড়ি', lang)}</label>
                      <select id="capa-priority" className="form-input" value={newCapaPriority} onChange={(e) => setNewCapaPriority(e.target.value as 'high' | 'medium' | 'low')}>
                        <option value="high">{t('High — 1 to 2 days', 'জরুরি — ১–২ দিন', lang)}</option>
                        <option value="medium">{t('Medium — about a week', 'মাঝারি — প্রায় এক সপ্তাহ', lang)}</option>
                        <option value="low">{t('Low — up to two weeks', 'কম — দুই সপ্তাহ পর্যন্ত', lang)}</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group mb-2">
                    <label htmlFor="capa-type">{t('Kind of fix', 'সমাধানের ধরন', lang)}</label>
                    <select id="capa-type" className="form-input" value={newCapaType} onChange={(e) => setNewCapaType(e.target.value as typeof newCapaType)}>
                      <option value="immediate_containment">{t('Fix now — stop the immediate risk', 'এখনই সমাধান — তাৎক্ষণিক ঝুঁকি থামান', lang)}</option>
                      <option value="corrective">{t('Remove the cause', 'মূল কারণ সরান', lang)}</option>
                      <option value="preventive">{t('Stop it happening again', 'পুনরাবৃত্তি রোধ করুন', lang)}</option>
                    </select>
                  </div>
                  <Button block icon={<Plus size={13} />} onClick={handleAddNewCapa}>
                    {t('Add this fix', 'এই সমাধান যোগ করুন', lang)}
                  </Button>
                </div>
              ) : (
                <Button variant="secondary" icon={<Plus size={13} />} onClick={() => setCapaAddOpen(true)}>
                  {t('Add another fix', 'আরেকটি সমাধান যোগ করুন', lang)}
                </Button>
              )}
            </div>

            <div className="modal-ft capa-ft">
              <Pagination
                currentPage={safeCapaPage}
                totalItems={filteredCapaItems.length}
                pageSize={CAPA_PAGE}
                onPageChange={setCapaListPage}
                lang={lang}
              />
              <button type="button" className="btn-sm-ghost" onClick={() => setSelectedCapaIncidentId(null)}>{t('Close', 'বন্ধ করুন', lang)}</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 5: OFFICIAL STATUTORY GOVERNMENT HSE DOSSIER (FORM B-12) ─── */}
      {selectedDossierIncident && (
        <div className="modal-bg" onClick={() => setSelectedDossierIncident(null)}>
          <div className="modal" style={{ maxWidth: '720px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-hd" style={{ background: 'var(--brand-crimson-dark)', color: 'var(--text-on-brand)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={18} color="var(--status-warning-bright)" />
                  <h3 style={{ color: 'var(--text-on-brand)', margin: 0 }}>
                    {t('Official Government Incident Report (Form B-12)', 'সরকারি ফর্ম বি-১২ ইনসিডেন্ট রিপোর্ট', lang)}
                  </h3>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--status-danger-bright)', marginTop: '2px' }}>
                  Department of Explosives (DoE) & Bangladesh Petroleum Act Compliance Dossier
                </div>
              </div>
              <button className="modal-close" style={{ color: 'var(--text-on-brand)' }} onClick={() => setSelectedDossierIncident(null)}>×</button>
            </div>

            <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
              {/* Document Letterhead */}
              <div style={{ border: '2px solid var(--border-1)', padding: '18px', borderRadius: '6px', background: 'var(--surface-0)', color: 'var(--text-1)' }}>
                <div style={{ textAlign: 'center', borderBottom: '2px solid var(--brand-crimson)', paddingBottom: '12px', marginBottom: '14px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 900, color: 'var(--brand-crimson-dark)', letterSpacing: '0.5px' }}>
                    BASHUNDHARA OIL AND GAS COMPANY LIMITED (BOGCL)
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>
                    Keraniganj Bitumen Refinery Complex & Bulk Petroleum Terminal • Dhaka, Bangladesh
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 800, marginTop: '6px', color: 'var(--text-1)', textTransform: 'uppercase' }}>
                    FORM B-12: STATUTORY NOTICE OF INDUSTRIAL OCCURRENCE
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-3)' }}>
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

                <div style={{ borderTop: '1px solid var(--border-2)', paddingTop: '10px', fontSize: '12px', marginBottom: '12px' }}>
                  <div style={{ fontWeight: 800, color: 'var(--text-1)', marginBottom: '4px' }}>1. Incident Narrative & Event Description:</div>
                  <div style={{ color: 'var(--text-2)', lineHeight: 1.5 }}>
                    {selectedDossierIncident.title}. Immediate containment executed by on-duty crew.
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-2)', paddingTop: '10px', fontSize: '12px', marginBottom: '12px' }}>
                  <div style={{ fontWeight: 800, color: 'var(--text-1)', marginBottom: '4px' }}>2. Immediate Safety Containment Actions Taken:</div>
                  <div style={{ color: 'var(--text-2)', lineHeight: 1.5 }}>
                    {selectedDossierIncident.immediateActionsTaken || 'Area cordoned off and safety valves isolated.'}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-2)', paddingTop: '10px', fontSize: '12px', marginBottom: '12px' }}>
                  <div style={{ fontWeight: 800, color: 'var(--text-1)', marginBottom: '4px' }}>3. 5-Whys Root Cause Analysis (RCA):</div>
                  <div style={{ color: 'var(--text-2)', lineHeight: 1.5 }}>
                    {selectedDossierIncident.rootCause}
                  </div>
                  {selectedDossierIncident.fiveWhys && (
                    <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--status-info-text)', background: 'var(--status-info-bg)', padding: '6px 10px', borderRadius: '4px' }}>
                      Primary Factor: <strong>{selectedDossierIncident.fiveWhys.fishboneCategory}</strong>                    </div>
                  )}
                </div>

                <div style={{ borderTop: '1px solid var(--border-2)', paddingTop: '10px', fontSize: '12px', marginBottom: '14px' }}>
                  <div style={{ fontWeight: 800, color: 'var(--text-1)', marginBottom: '4px' }}>4. Corrective & Preventive Action (CAPA) Log:</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {(selectedDossierIncident.capaItems || []).map((c, i) => (
                      <div key={c.id} style={{ fontSize: '11.5px', color: 'var(--text-2)' }}>
                        {i + 1}. [{c.actionType.toUpperCase()}] {c.description} — <em>Owner: {c.owner} ({c.status.toUpperCase()})</em>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sign-Off Stamps */}
                <div className="responsive-col-2-eq" style={{ gap: '16px', borderTop: '2px solid var(--border-2)', paddingTop: '14px', marginTop: '10px' }}>
                  <div style={{ textAlign: 'center', border: '1px dashed var(--status-success)', padding: '10px', borderRadius: '4px', background: 'var(--status-success-bg)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--status-success)', fontWeight: 900 }}>✓ VERIFIED BY EHS HEAD</div>
                    <div style={{ fontSize: '12px', fontWeight: 800, marginTop: '2px' }}>Farhana Kabir</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-3)' }}>Lead Safety Inspector • BOGCL</div>
                  </div>

                  <div style={{ textAlign: 'center', border: '1px dashed var(--brand-crimson)', padding: '10px', borderRadius: '4px', background: 'var(--status-danger-bg)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--brand-crimson)', fontWeight: 900 }}>★ APPROVED BY PLANT GM</div>
                    <div style={{ fontSize: '12px', fontWeight: 800, marginTop: '2px' }}>Engr. Md. Harunur Rashid</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-3)' }}>Plant GM & Licensed Controller</div>
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
            <div className="modal-hd" style={{ background: 'var(--status-success-solid-dark)', color: 'var(--text-on-brand)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={18} color="var(--text-on-brand)" />
                <h3 style={{ color: 'var(--text-on-brand)', margin: 0 }}>
                  {t('Executive Review & Final Incident Closure Sign-Off', 'নির্বাহী মূল্যায়ন ও আনুষ্ঠানিক ইনসিডেন্ট সমাপ্তি অনুমোদন', lang)}
                </h3>
              </div>
              <button className="modal-close" style={{ color: 'var(--text-on-brand)' }} onClick={() => setSelectedSignoffIncident(null)}>×</button>
            </div>

            <div className="modal-body">
              <div style={{ background: 'var(--status-success-bg)', border: '1px solid var(--status-success-border)', padding: '10px 14px', borderRadius: '6px', fontSize: '12px', color: 'var(--status-success-text)', marginBottom: '14px' }}>
                ✓ {t('All CAPA actions are complete. Record the safety officer who inspected them, then close.', 'সব সিএপিএ ব্যবস্থা সম্পন্ন। যাচাইকারী নিরাপত্তা কর্মকর্তার নাম লিখে সমাপ্ত করুন।', lang)}
              </div>

              <div className="form-group mb-3">
                <label style={{ fontSize: '12px', fontWeight: 700 }}>{t('Inspected by (safety officer)', 'যাচাইকারী (নিরাপত্তা কর্মকর্তা)', lang)}</label>
                <input
                  type="text"
                  className="form-input"
                  value={signoffOfficer}
                  placeholder={t('Name and designation', 'নাম ও পদবি', lang)}
                  onChange={(e) => setSignoffOfficer(e.target.value)}
                />
              </div>

              <div className="form-group mb-3">
                <label style={{ fontSize: '12px', fontWeight: 700 }}>{t('Approved by', 'অনুমোদনকারী', lang)}</label>
                <input
                  type="text"
                  className="form-input"
                  value={`${currentPersona.name} (${currentPersona.label})`}
                  readOnly
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
                style={{ background: 'var(--status-success-solid)', borderColor: 'var(--status-success)', opacity: signoffOfficer.trim() ? 1 : 0.55 }}
                disabled={!signoffOfficer.trim()}
                onClick={handleSignOffClosure}
              >
                <ShieldCheck size={14} />
                {t('Sign off & close incident', 'অনুমোদন করে সমাপ্ত করুন', lang)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 7: SITE EMERGENCY ALERT ─── */}
      {showEmergencyModal && canInvestigate && (
        <div className="modal-bg" onClick={closeEmergency}>
          <div className="modal" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-hd danger">
              <h3>
                <Siren size={18} />
                {t('Site emergency alert', 'সাইট জরুরি সতর্কবার্তা', lang)}
              </h3>
              <button className="modal-close" onClick={closeEmergency}>×</button>
            </div>

            <div className="modal-body">
              <p style={{ margin: '0 0 14px', fontSize: '13px', lineHeight: 1.45 }}>
                {t(
                  'This tells the plant manager, the chairman’s office, and the gate supervisors, and starts a muster roll call.',
                  'এটি প্ল্যান্ট ম্যানেজার, চেয়ারম্যানের দপ্তর ও গেট তত্ত্বাবধায়কদের জানায় এবং হাজিরা গণনা শুরু করে।',
                  lang,
                )}
              </p>

              <div className="form-group mb-3">
                <label>{t('What is it?', 'এটি কী?', lang)}</label>
                <select className="form-input" value={emergencyKind} onChange={(e) => setEmergencyKind(e.target.value as typeof emergencyKind)}>
                  {EMERGENCY_KINDS.map((kind) => (
                    <option key={kind.id} value={kind.id}>{t(kind.en, kind.bn, lang)}</option>
                  ))}
                </select>
              </div>

              <div className="form-group mb-3">
                <label>{t('Where?', 'কোথায়?', lang)}</label>
                <select className="form-input" value={emergencyZone} onChange={(e) => setEmergencyZone(e.target.value)}>
                  <option value="">{t('Choose the area', 'এলাকা বেছে নিন', lang)}</option>
                  {PLANT_ZONES.filter((zone) => zone !== 'All Plant Zones').map((zone) => (
                    <option key={zone} value={zone}>{zone}</option>
                  ))}
                </select>
              </div>

              <div className="form-group mb-3">
                <label>{t('What is happening?', 'কী হচ্ছে?', lang)}</label>
                <input
                  type="text"
                  className="form-input"
                  value={emergencyWhat}
                  onChange={(e) => setEmergencyWhat(e.target.value)}
                  placeholder={t('e.g. Smoke from the pump house', 'যেমন: পাম্প হাউস থেকে ধোঁয়া', lang)}
                />
              </div>

              <div style={{ fontSize: '12.5px', lineHeight: 1.55 }}>
                <div style={{ fontWeight: 700, marginBottom: '4px' }}>{t('Who is told', 'যাদের জানানো হবে', lang)}</div>
                <div>{t('Plant General Manager', 'প্ল্যান্ট জেনারেল ম্যানেজার', lang)}</div>
                <div>{t("Chairman's Office", 'চেয়ারম্যানের দপ্তর', lang)}</div>
                <div>{t('Transport and gate supervisors, for the muster roll call', 'পরিবহন ও গেট তত্ত্বাবধায়ক, হাজিরা গণনার জন্য', lang)}</div>
              </div>
            </div>

            <div className="modal-ft">
              <button className="btn-sm-ghost" onClick={closeEmergency}>{t('Cancel', 'বাতিল', lang)}</button>
              <button
                type="button"
                className="btn-danger"
                style={{ background: 'var(--status-danger-solid)', color: 'var(--text-on-brand)', fontWeight: 800, opacity: !emergencyZone || !emergencyWhat.trim() ? 0.55 : 1 }}
                disabled={!emergencyZone || !emergencyWhat.trim()}
                onClick={handleSendEmergency}
              >
                <Siren size={14} />
                {t('Send Emergency Alert', 'জরুরি সতর্কবার্তা পাঠান', lang)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
