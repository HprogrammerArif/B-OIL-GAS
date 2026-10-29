import React, { useState, useMemo } from 'react';
import { ViewProps, t } from '../types';
import { showToast } from '../App';
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

const INITIAL_LICENSES: LicenseCard[] = [
  {
    id: 'EXP-KER-01',
    tag: 'fire',
    tagLabel: 'EXPLOSIVES',
    agency: 'Dept. of Explosives',
    agencyBn: 'বিস্ফোরক পরিদপ্তর',
    title: 'Bulk Hydrocarbon & Bitumen Tank Farm License (Tanks 1-8)',
    titleBn: 'বিটুমিন ও হাইড্রোকার্বন বাল্ক স্টোরেজ লাইসেন্স (ট্যাংক ১-৮)',
    refNo: 'EXP/KER/PETRO/2025/119',
    daysLeft: 18,
    stage: 4,
    focalPerson: 'Engr. Harunur Rashid',
    focalDesignation: 'Plant General Manager, Keraniganj',
    lastInspection: '04 Oct 2026',
    criticality: 'critical',
    sroLawRef: 'Petroleum Act 1934 & Petroleum Rules 1937, Section 4(1)',
    feeAmountTk: '৳ 2,50,000',
    dailyShutdownRiskTk: '৳ 1,85,00,000 / day',
    statutoryPenalty: 'Mandatory seal of 14,000 MT tank farm storage, seizure of petroleum inventory, and legal prosecution under Petroleum Act 1934.',
    statutoryPenaltyBn: 'পেট্রোলিয়াম আইন অনুযায়ী ১৪,০০০ মে.টন ট্যাংক ফার্ম সিলগালা, পণ্য বাজেয়াপ্ত এবং আইনি ব্যবস্থা গ্রহণ।',
    inspectorName: 'Engr. Md. Monirul Islam',
    inspectorDesignation: 'Chief Inspector of Explosives, Dept of Explosives',
    ministryRecipient: 'The Chief Inspector of Explosives',
    ministryAddress: 'Department of Explosives, 8/C Segunbagicha, Dhaka-1000',
    certificateValidity: '01 Nov 2025 – 31 Oct 2026',
    auditChecklist: [
      { item: 'Nitrogen blanketing pressure integrity verified on all 8 tanks', passed: true },
      { item: 'Pressure vacuum relief valves (PVRV) calibrated to 2.5 bar', passed: true },
      { item: 'Dyke containment wall volumetric retention capacity > 110%', passed: true },
      { item: 'Explosion-proof ATEX lighting certified in Zone-1 areas', passed: false },
    ],
    documents: [
      { name: 'Ultrasonic_API653_TK1-8_Summary.pdf', size: '3.8 MB', date: '04 Oct 2026', type: 'Engineering Log' },
      { name: 'PVRV_Nitrogen_Integrity_Cert.pdf', size: '1.9 MB', date: '02 Oct 2026', type: 'Calibration Report' },
      { name: 'Treasury_Challan_EXP_Fee.pdf', size: '850 KB', date: '28 Sep 2026', type: 'Govt Treasury Receipt' },
    ],
  },
  {
    id: 'DOE-ECC-04',
    tag: 'doe',
    tagLabel: 'DoE ECC',
    agency: 'Department of Environment',
    agencyBn: 'পরিবেশ অধিদপ্তর',
    title: 'Environmental Clearance Certificate (Red Category)',
    titleBn: 'পরিবেশগত ছাড়পত্র (লাল শ্রেণী — রিফাইনারি)',
    refNo: 'DoE/CLEAR/DHAKA-DIV/884',
    daysLeft: 34,
    stage: 3,
    focalPerson: 'Farhana Kabir',
    focalDesignation: 'EHS & Sustainability Lead',
    lastInspection: '12 Sep 2026',
    criticality: 'critical',
    sroLawRef: 'Bangladesh Environment Conservation Act 1995 & ECR 2023',
    feeAmountTk: '৳ 4,00,000',
    dailyShutdownRiskTk: '৳ 1,20,00,000 / day',
    statutoryPenalty: 'Immediate factory closure notice by DoE Director General, environmental penalty surcharge, and power disconnection.',
    statutoryPenaltyBn: 'পরিবেশ অধিদপ্তর কর্তৃক শিল্প কারখানা বন্ধের নোটিশ, ক্ষতিপূরণ জরিমানা এবং বিদ্যুৎ সংযোগ বিচ্ছিন্ন।',
    inspectorName: 'Dr. Kazi Mahbubur Rahman',
    inspectorDesignation: 'Director (Air & Water Quality), DoE Dhaka Division',
    ministryRecipient: 'The Director General',
    ministryAddress: 'Department of Environment, Paribesh Bhaban, E-16 Agargaon, Dhaka-1207',
    certificateValidity: '15 Nov 2025 – 14 Nov 2026',
    auditChecklist: [
      { item: 'Online Continuous Effluent Monitoring System (CEMS) online', passed: true },
      { item: 'ETP Treated discharge: BOD < 30 mg/L, COD < 200 mg/L', passed: true },
      { item: 'Stack emission analyzer: SOx/NOx within DoE threshold', passed: true },
      { item: 'Hazardous sludge disposal contract with certified vendor', passed: true },
    ],
    documents: [
      { name: 'CEMS_Online_Telemetry_Log_Q3.pdf', size: '5.1 MB', date: '12 Sep 2026', type: 'IoT Telemetry' },
      { name: 'ETP_Discharge_Water_Test_Report.pdf', size: '2.1 MB', date: '10 Sep 2026', type: 'Lab Analysis' },
      { name: 'Hazardous_Sludge_Manifest_2026.pdf', size: '1.4 MB', date: '05 Sep 2026', type: 'Disposal NOC' },
    ],
  },
  {
    id: 'FSCD-FIRE-09',
    tag: 'fire',
    tagLabel: 'FIRE SAFETY',
    agency: 'Fire Service & Civil Defence',
    agencyBn: 'ফায়ার সার্ভিস ও সিভিল ডিফেন্স',
    title: 'Refinery Industrial Fire Safety & Hydrant System Clearance',
    titleBn: 'শিল্প অগ্নিনির্বাপণ ও হাইড্র্যান্ট ব্যবস্থা সনদ',
    refNo: 'FSCD/HQ/LIC-OIL/2026/410',
    daysLeft: 84,
    stage: 2,
    focalPerson: 'Lt. (Retd.) M. Selim',
    focalDesignation: 'Chief Security & Safety Officer',
    lastInspection: '20 Aug 2026',
    criticality: 'high',
    sroLawRef: 'Fire Prevention & Extinguishing Act 2003, Section 7',
    feeAmountTk: '৳ 1,80,000',
    dailyShutdownRiskTk: '৳ 95,00,000 / day',
    statutoryPenalty: 'Suspension of factory occupancy certificate and restriction on heavy petroleum tankers entering terminal gates.',
    statutoryPenaltyBn: 'কারখানা ব্যবহারের অনুমতি স্থগিত এবং ডিপোতে ভারী তেল ট্যাংকার প্রবেশে নিষেধাজ্ঞা।',
    inspectorName: 'Lt. Col. Tajul Islam',
    inspectorDesignation: 'Director (Operations & Maintenance), FSCD',
    ministryRecipient: 'The Director General',
    ministryAddress: 'Fire Service & Civil Defence Directorate, Kazi Nazrul Islam Ave, Dhaka-1000',
    certificateValidity: '01 Jan 2026 – 31 Dec 2026',
    auditChecklist: [
      { item: 'Ring hydrant header maintained at continuous 8.5 bar pressure', passed: true },
      { item: 'Deluge water spray system over Tank 101/102 functional', passed: true },
      { item: 'AFFF Foam concentrate stock: 12,000 Liters available', passed: true },
      { item: 'Quarterly full-plant emergency evacuation drill logged', passed: true },
    ],
    documents: [
      { name: 'Ring_Hydrant_Pressure_Certification.pdf', size: '2.7 MB', date: '20 Aug 2026', type: 'Pressure Log' },
      { name: 'AFFF_Foam_Stock_Inventory_Audit.pdf', size: '1.2 MB', date: '18 Aug 2026', type: 'Safety Certificate' },
    ],
  },
  {
    id: 'BSTI-BIT-60',
    tag: 'bsti',
    tagLabel: 'BSTI CERT',
    agency: 'BSTI Standards Bureau',
    agencyBn: 'বাংলাদেশ স্ট্যান্ডার্ডস ব্যুরো',
    title: 'BDS 1238:2020 Quality Standard — Bitumen 60/70 & 80/100',
    titleBn: 'বিডিএস মানসনদ — বিটুমিন গ্রেড ৬০/৭০ ও ৮০/১০০',
    refNo: 'BSTI/CM/KER/CHEM-98',
    daysLeft: 142,
    stage: 5,
    focalPerson: 'Dr. Rafiqul Huq',
    focalDesignation: 'Quality Control Head & Chief Chemist',
    lastInspection: '01 Oct 2026',
    criticality: 'medium',
    sroLawRef: 'BSTI Act 2018 & BDS 1238:2020 Specification',
    feeAmountTk: '৳ 1,25,000',
    dailyShutdownRiskTk: '৳ 2,10,00,000 / day',
    statutoryPenalty: 'Disqualification from Roads & Highways Department (RHD) mega-project tenders and immediate commercial sales embargo.',
    statutoryPenaltyBn: 'সড়ক ও জনপথ অধিদপ্তরের মেগা-প্রকল্পে সরবরাহ বাতিল এবং বাণিজ্যিক বিক্রি স্থগিতাদেশ।',
    inspectorName: 'Engr. Tahmina Begum',
    inspectorDesignation: 'Deputy Director (Chemical Certification), BSTI',
    ministryRecipient: 'The Director General',
    ministryAddress: 'Bangladesh Standards & Testing Institution (BSTI), 116/A Tejgaon I/A, Dhaka-1208',
    certificateValidity: '01 Mar 2026 – 28 Feb 2027',
    auditChecklist: [
      { item: 'Penetration index at 25°C between 60 and 70 (0.1 mm)', passed: true },
      { item: 'Softening point (Ring & Ball) >= 49°C', passed: true },
      { item: 'Ductility at 25°C > 100 cm', passed: true },
      { item: 'Flash Point (Cleveland Open Cup) > 230°C', passed: true },
    ],
    documents: [
      { name: 'BDS_1238_Penetration_Test_Cert.pdf', size: '3.1 MB', date: '01 Oct 2026', type: 'BSTI Test Report' },
      { name: 'BSTI_Mark_CM_License_Renewal.pdf', size: '2.0 MB', date: '25 Sep 2026', type: 'CM Mark License' },
    ],
  },
  {
    id: 'BPC-QUOTA-02',
    tag: 'trade',
    tagLabel: 'ENERGY DIV',
    agency: 'Energy & Mineral Resources Div.',
    agencyBn: 'জ্বালানি ও খনিজ সম্পদ বিভাগ',
    title: 'Crude Residue Import & Re-processing Annual Allocation Quota',
    titleBn: 'বার্ষিক অপরিশোধিত হাইড্রোকার্বন আমদানি কোটা',
    refNo: 'EMRD/PETRO-BOGCL/2026/09',
    daysLeft: 7,
    stage: 4,
    focalPerson: 'Ahmed Akbar Sobhan (CMD)',
    focalDesignation: 'Chairman & Managing Director, Bashundhara Group',
    lastInspection: '28 Sep 2026',
    criticality: 'critical',
    sroLawRef: 'Import Policy Order 2021-2024 & Hydrocarbon Import Guideline',
    feeAmountTk: '৳ 15,00,000',
    dailyShutdownRiskTk: '৳ 2,40,00,000 / day',
    statutoryPenalty: 'Suspension of Customs bonded warehouse import entitlement, vessel berthing denial at port, and port demurrage charges.',
    statutoryPenaltyBn: 'বন্ডেড ওয়্যারহাউস আমদানি সুবিধা স্থগিত, বন্দরে মাদার ভেসেল খালাস আটকে যাওয়া ও ডেমারেজ চার্জ।',
    inspectorName: 'Md. Nurul Alam',
    inspectorDesignation: 'Additional Secretary (Hydrocarbon), Energy Division',
    ministryRecipient: 'The Senior Secretary',
    ministryAddress: 'Energy & Mineral Resources Division, Bangladesh Secretariat, Dhaka-1000',
    certificateValidity: '01 Nov 2025 – 31 Oct 2026',
    auditChecklist: [
      { item: 'Letter of Credit clearance from Bangladesh Bank', passed: true },
      { item: 'Monthly throughput utilization report submitted to BPC', passed: true },
      { item: 'Customs bonded warehouse bond renewal validated', passed: true },
    ],
    documents: [
      { name: 'Annual_Refinery_Throughput_Audit_2026.pdf', size: '4.6 MB', date: '28 Sep 2026', type: 'Throughput Audit' },
      { name: 'BPC_National_Demand_Alignment_Memo.pdf', size: '2.8 MB', date: '20 Sep 2026', type: 'Ministry Memo' },
      { name: 'BB_Foreign_Exchange_Allocation_NOC.pdf', size: '1.7 MB', date: '15 Sep 2026', type: 'Central Bank NOC' },
    ],
  },
  {
    id: 'CAL-VALVE-08',
    tag: 'env',
    tagLabel: 'CALIBRATION',
    agency: 'National Metrology Lab',
    agencyBn: 'জাতীয় মেট্রোলজি ল্যাবরেটরি',
    title: 'Reactor Pressure Relief Valve Hydro-Testing Calibration',
    titleBn: 'রিঅ্যাক্টর সেফটি ভালভ প্রেসার ক্যালিব্রেশন',
    refNo: 'NML/CAL-KER-662',
    daysLeft: 22,
    stage: 1,
    focalPerson: 'Engr. Tariq Ahmed',
    focalDesignation: 'Process Instrumentation Lead',
    lastInspection: 'Due this week',
    criticality: 'high',
    sroLawRef: 'Weights and Measures Act & Boiler Inspection Rules',
    feeAmountTk: '৳ 75,000',
    dailyShutdownRiskTk: '৳ 65,00,000 / day',
    statutoryPenalty: 'Mandatory cold shut-down of bitumen oxidation reactor column by Boiler Inspector for life-safety hazard.',
    statutoryPenaltyBn: 'জীবন ও সরঞ্জাম সুরক্ষার স্বার্থে রিঅ্যাক্টর কলামের বাধ্যতামূলক কোল্ড শাটডাউন।',
    inspectorName: 'Dr. Faruk Hossain',
    inspectorDesignation: 'Chief Metrologist, National Metrology Laboratory',
    ministryRecipient: 'The Director General',
    ministryAddress: 'National Metrology Laboratory (NML), BSTI Campus, Tejgaon, Dhaka-1208',
    certificateValidity: '10 Nov 2025 – 09 Nov 2026',
    auditChecklist: [
      { item: 'Deadweight tester calibration certificate verified', passed: true },
      { item: 'Seat leakage test at 90% set pressure recorded zero bubbles', passed: false },
    ],
    documents: [
      { name: 'Reactor_PVRV_Deadweight_Calibration.pdf', size: '1.9 MB', date: '24 Sep 2026', type: 'Calibration Chart' },
      { name: 'Bench_Seat_Leakage_Log_Valve08.pdf', size: '1.1 MB', date: '22 Sep 2026', type: 'Inspection Sheet' },
    ],
  },
];

const STAGES = [
  { id: 1, title: '1. Internal Review', titleBn: '১. অভ্যন্তরীণ মূল্যায়ন', color: '#7C3AED', badgeColor: '#EDE9FE', textColor: '#6D28D9' },
  { id: 2, title: '2. Application Filed', titleBn: '২. আবেদন দাখিল', color: '#0284C7', badgeColor: '#E0F2FE', textColor: '#0369A1' },
  { id: 3, title: '3. Field Inspection', titleBn: '৩. মাঠ পরিদর্শন', color: '#D97706', badgeColor: '#FEF3C7', textColor: '#B45309' },
  { id: 4, title: '4. Ministry Vetting', titleBn: '৪. মন্ত্রণালয়ে যাচাই', color: '#A51C30', badgeColor: '#FEE2E2', textColor: '#991B1B' },
  { id: 5, title: '5. Renewed & Active', titleBn: '৫. সক্রিয় ও নবায়িত', color: '#059669', badgeColor: '#ECFDF5', textColor: '#065F46' },
];

export default function ComplianceView({ role, lang }: ViewProps) {
  const [licenses, setLicenses] = useState<LicenseCard[]>(INITIAL_LICENSES);
  const [selectedLicense, setSelectedLicense] = useState<LicenseCard | null>(null);
  const [showDoLetterModal, setShowDoLetterModal] = useState<LicenseCard | null>(null);
  const [showSyncModal, setShowSyncModal] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('08:21 AM Live');

  // Filtering & Search
  const [selectedAgencyFilter, setSelectedAgencyFilter] = useState<string>('all');
  const [selectedUrgencyFilter, setSelectedUrgencyFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Customization of DO Letter in Modal
  const [doLetterCustomSubject, setDoLetterCustomSubject] = useState<string>('');
  const [doLetterDeliveryMode, setDoLetterDeliveryMode] = useState<'enothi' | 'courier' | 'liaison'>('enothi');

  // Advance / Reverse Pipeline Stage
  const moveLicense = (id: string, dir: number) => {
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
    if (!selectedLicense) return;
    const updatedChecklist = [...selectedLicense.auditChecklist];
    updatedChecklist[itemIndex].passed = !updatedChecklist[itemIndex].passed;
    const updated = { ...selectedLicense, auditChecklist: updatedChecklist };
    setSelectedLicense(updated);
    setLicenses(prev => prev.map(l => l.id === updated.id ? updated : l));
    showToast(t('Statutory audit verification updated.', 'অডিট ভেরিফিকেশন হালনাগাদ করা হয়েছে।', lang), 'info');
  };

  const urgentEscalate = (lic: LicenseCard) => {
    showToast(t(`URGENT alert dispatched to Chairman's Office: ${lic.title}`, `চেয়ারম্যানের দপ্তরে জরুরি সতর্কবার্তা পাঠানো হয়েছে: ${lic.title}`, lang), 'gold');
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
  const criticalCount = licenses.filter(l => l.daysLeft <= 30).length;
  const closestExpiry = Math.min(...licenses.map(l => l.daysLeft));
  const mostCriticalLicense = licenses.reduce((prev, curr) => (curr.daysLeft < prev.daysLeft ? curr : prev), licenses[0]);

  // Handle Ministry Sync simulation
  const handlePerformSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' Live';
      setLastSyncTime(timeStr);
      showToast(t('Successfully synchronized with Bangladesh Govt e-Nothi and DoE CEMS cloud.', 'সরকারি ই-নথি ও পরিবেশ অধিদপ্তর ক্লাউডের সাথে সফলভাবে সিঙ্ক হয়েছে।', lang), 'success');
    }, 1200);
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Top Header & Barometer */}
      <div className="flex-between mb-4" style={{ flexWrap: 'wrap', gap: '14px', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="badge danger" style={{ fontSize: '10.5px', padding: '3px 8px', letterSpacing: '0.4px', fontWeight: 800 }}>
              {t('OVERSIGHT & RISK COCKPIT', 'তত্ত্বাবধান ও ঝুঁকি ব্যবস্থাপনা', lang)}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--brand-slate-500)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={12} /> {t(`Last Ministry Sync: ${lastSyncTime}`, `মন্ত্রণালয় সিঙ্ক: ${lastSyncTime}`, lang)}
            </span>
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 900, color: 'var(--brand-slate-900)', letterSpacing: '-0.4px', margin: 0 }}>
            {t('Compliance Vault & Regulatory Safety Cockpit', 'কমপ্লায়েন্স ভল্ট ও নিয়ন্ত্রক লাইসেন্স ককপিট', lang)}
          </h2>
          <p className="text-muted" style={{ margin: '4px 0 0 0', fontSize: '13px' }}>
            {t('Keraniganj Bitumen Plant & Tank Farm — Zero Shutdown Guarantee & Ministry Pipeline', 'কেরানীগঞ্জ বিটুমিন রিফাইনারি ও ট্যাংক ফার্ম — শূন্য শাটডাউন নিশ্চয়তা ও মন্ত্রণালয় সমন্বয়', lang)}
          </p>
        </div>

        <div className="flex-gap" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ padding: '8px 14px', background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={20} color="#059669" />
            <div style={{ fontSize: '11.5px', color: '#065F46' }}>
              <div style={{ fontWeight: 800, fontSize: '13px' }}>{t('Audit Readiness Score: 94.2%', 'প্ল্যান্ট অডিট প্রস্তুতি স্কোর: ৯৪.২%', lang)}</div>
              <div>{t('Complies with Petroleum Act & DoE 2026', 'পেট্রোলিয়াম আইন ও পরিবেশ সংরক্ষণ বিধি সম্মত', lang)}</div>
            </div>
          </div>

          <button
            className="btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '8px 16px', fontWeight: 700 }}
            onClick={() => setShowSyncModal(true)}
          >
            <RefreshCw size={14} className={isSyncing ? 'spin' : ''} />
            {t('Sync Ministry Status', 'মন্ত্রণালয় সিঙ্ক স্ট্যাটাস', lang)}
          </button>
        </div>
      </div>

      {/* 4-Stat Executive Regulatory Risk Barometer */}
      <div className="responsive-col-4 mb-4" style={{ gap: '14px' }}>
        <div className="card" style={{ padding: '14px 16px', borderLeft: '4px solid #DC2626' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-slate-500)', textTransform: 'uppercase' }}>
              {t('Immediate Expiry Alert', 'আসন্ন মেয়াদোত্তীর্ণ সতর্কতা', lang)}
            </span>
            <AlertTriangle size={16} color="#DC2626" />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 900, color: '#DC2626', marginTop: '4px' }}>
            {closestExpiry} {t('Days Left', 'দিন বাকি', lang)}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--brand-slate-600)', marginTop: '2px' }}>
            {t(`2 Critical Filings (< 30d): Tank Farm & Quota`, `২টি ঝুঁকিপূর্ণ নথি: বাল্ক ট্যাংক ফার্ম ও ক্রুড কোটা`, lang)}
          </div>
        </div>

        <div className="card" style={{ padding: '14px 16px', borderLeft: '4px solid #D97706' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-slate-500)', textTransform: 'uppercase' }}>
              {t('Shutdown Exposure Risk', 'শাটডাউন রাজস্ব ঝুঁকি', lang)}
            </span>
            <DollarSign size={16} color="#D97706" />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 900, color: '#92400E', marginTop: '4px' }}>
            ৳ 2.65 Cr <span style={{ fontSize: '12px', fontWeight: 600 }}>/ {t('day', 'দিন', lang)}</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--brand-slate-600)', marginTop: '2px' }}>
            {t('Production halt & port demurrage liability', 'উৎপাদন বন্ধ ও বন্দর ডেমারেজ ঝুঁকি', lang)}
          </div>
        </div>

        <div className="card" style={{ padding: '14px 16px', borderLeft: '4px solid #059669' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-slate-500)', textTransform: 'uppercase' }}>
              {t('Active Filings Monitored', 'সক্রিয় তদারকি নথি', lang)}
            </span>
            <Building size={16} color="#059669" />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--brand-slate-900)', marginTop: '4px' }}>
            {licenses.length} <span style={{ fontSize: '12px', fontWeight: 600 }}>{t('Permits', 'টি পারমিট', lang)}</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--brand-slate-600)', marginTop: '2px' }}>
            {t('BSTI, Explosives, DoE, FSCD, Metrology, BPC', 'বিএসটিআই, বিস্ফোরক, পরিবেশ, ফায়ার, বিআইডব্লিউটিসি', lang)}
          </div>
        </div>

        <div className="card" style={{ padding: '14px 16px', borderLeft: '4px solid #0284C7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-slate-500)', textTransform: 'uppercase' }}>
              {t('DoE CEMS Continuous Stream', 'অনলাইন নির্গমন পরিবীক্ষণ', lang)}
            </span>
            <Leaf size={16} color="#0284C7" />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 900, color: '#0369A1', marginTop: '4px' }}>
            100% <span style={{ fontSize: '12px', fontWeight: 600 }}>{t('Compliant', 'সম্মত', lang)}</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--brand-slate-600)', marginTop: '2px' }}>
            {t('Real-time SO2, NOx & ETP streaming live', 'সরাসরি পরিবেশ অধিদপ্তরে ডাটা প্রেরণ সচল', lang)}
          </div>
        </div>
      </div>

      {/* Critical Countdown Warning Strip */}
      <div style={{
        background: 'linear-gradient(90deg, #7F1424 0%, #A51C30 100%)',
        color: '#fff',
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
            <AlertTriangle size={22} color="#F0DFA0" />
          </div>
          <div style={{ fontSize: '13px', lineHeight: 1.5 }}>
            <div style={{ fontWeight: 800, color: '#FDE68A', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>{t('CRITICAL COMPLIANCE NOTICE:', 'জরুরি বিধিবদ্ধ নোটিশ:', lang)}</span>
              <span className="badge danger" style={{ background: '#450A0A', color: '#FCA5A5', border: '1px solid #7F1D1D', fontSize: '10px' }}>
                {t('ACTION REQUIRED WITHIN 18 DAYS', '১৮ দিনের মধ্যে সমাধান প্রয়োজন', lang)}
              </span>
            </div>
            <div style={{ color: '#F8FAFC', marginTop: '2px' }}>
              {t(
                `Bulk Hydrocarbon Tank Farm License (Tanks 1-8) has 18 days remaining. Chief Inspector of Explosives final audit sign-off pending. Daily shutdown exposure: ৳ 1.85 Cr.`,
                `বাল্ক হাইড্রোকার্বন ও বিটুমিন ট্যাংক ফার্ম লাইসেন্সের মেয়াদ শেষ হতে মাত্র ১৮ দিন বাকি। বিস্ফোরক পরিদপ্তরের চূড়ান্ত অডিট সাইন-অফ বিবেচনাধীন। সম্ভাব্য শাটডাউন ক্ষতি: দৈনিক ১.৮৫ কোটি টাকা।`,
                lang
              )}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            className="btn-gold"
            style={{ fontSize: '12px', padding: '7px 16px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
            onClick={() => handleOpenDoLetter(mostCriticalLicense)}
          >
            <FileText size={14} />
            {t('Dispatch DO Letter to DG Explosives', 'বিস্ফোরক পরিদপ্তরে ডিও লেটার প্রেরণ', lang)}
          </button>
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
              { id: 'all', label: 'All Agencies (6)', labelBn: 'সকল সংস্থা (৬)' },
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
                  background: selectedAgencyFilter === f.id ? 'var(--brand-crimson)' : '#fff',
                  color: selectedAgencyFilter === f.id ? '#fff' : 'var(--brand-slate-700)',
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
                  background: '#F8FAFC'
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
              <div className="card-subtitle">{t('Real-time tracking of BSTI, Explosives Dept, Fire Service, and DoE approvals', 'বিএসটিআই, বিস্ফোরক অধিদপ্তর, ফায়ার সার্ভিস ও পরিবেশ অধিদপ্তরের লাইসেন্স পাইপলাইন', lang)}</div>
            </div>
          </div>
          <div className="flex-gap" style={{ alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--brand-slate-500)' }}>
              {t('Swipe horizontally on mobile to view all 5 stages', 'সবগুলো স্টেজ দেখতে স্ক্রল করুন', lang)}
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
                            borderLeft: isUrgent ? '4px solid #DC2626' : isWarn ? '4px solid #D97706' : '4px solid #059669',
                            cursor: 'pointer',
                            position: 'relative',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <span className={`k-tag ${lic.tag}`}>{lic.tagLabel}</span>
                            <span className={`k-countdown ${isUrgent ? 'urgent' : isWarn ? 'warning' : 'ok'}`} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {isUrgent && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#DC2626', animation: 'pulse 1.5s infinite' }} />}
                              {lic.daysLeft <= 0 ? t('EXPIRED', 'মেয়াদোত্তীর্ণ', lang) : `${lic.daysLeft}d left`}
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

                          {/* Risk Exposure Tag */}
                          <div style={{
                            margin: '8px 0',
                            padding: '4px 8px',
                            background: isUrgent ? '#FEF2F2' : '#F8FAFC',
                            borderRadius: '4px',
                            border: `1px solid ${isUrgent ? '#FECACA' : '#E2E8F0'}`,
                            fontSize: '10.5px',
                            color: isUrgent ? '#991B1B' : '#475569',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}>
                            <span>{t('Stoppage Risk:', 'শাটডাউন ক্ষতি:', lang)}</span>
                            <strong>{lic.dailyShutdownRiskTk}</strong>
                          </div>

                          <div className="k-footer" style={{ paddingTop: '8px' }}>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              {lic.stage > 1 && (
                                <button
                                  className="btn-sm-ghost"
                                  style={{ padding: '3px 8px', fontSize: '10.5px', display: 'inline-flex', alignItems: 'center', gap: '2px' }}
                                  onClick={(e) => { e.stopPropagation(); moveLicense(lic.id, -1); }}
                                  title="Return to previous stage"
                                >
                                  <ArrowLeft size={11} /> {t('Back', 'পূর্ববর্তী', lang)}
                                </button>
                              )}
                              {lic.stage < 5 && (
                                <button
                                  className="btn-sm-ghost"
                                  style={{ padding: '3px 8px', fontSize: '10.5px', display: 'inline-flex', alignItems: 'center', gap: '2px', color: '#0369A1' }}
                                  onClick={(e) => { e.stopPropagation(); moveLicense(lic.id, 1); }}
                                  title="Advance to next stage"
                                >
                                  {t('Next', 'পরবর্তী', lang)} <ArrowRight size={11} />
                                </button>
                              )}
                            </div>

                            {lic.daysLeft <= 30 && (
                              <button
                                className="btn-outline-danger"
                                style={{ padding: '3px 8px', fontSize: '10.5px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                onClick={(e) => { e.stopPropagation(); handleOpenDoLetter(lic); }}
                                title="Draft DO Letter from Chairman's Office"
                              >
                                <FileText size={11} /> {t('DO Letter', 'ডিও লেটার', lang)}
                              </button>
                            )}
                          </div>
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

      {/* Tank Farm & Equipment Calibration Grid */}
      <div className="col-2 mb-4" style={{ gap: '18px' }}>
        {/* Tank Ultrasound & Thickness Logs */}
        <div className="card">
          <div className="card-hd">
            <div className="card-hd-left">
              <div className="card-hd-icon"><Flame size={16} /></div>
              <div>
                <div className="card-title">{t('Keraniganj Bitumen Storage Tank Status (API 653)', 'কেরানীগঞ্জ বিটুমিন স্টোরেজ ট্যাংক অবস্থা (এপিআই ৬৫৩)', lang)}</div>
                <div className="card-subtitle">{t('Ultrasonic wall thickness and pressure integrity log', 'আল্ট্রাসোনিক ওয়াল পুরুত্ব ও চাপ পরীক্ষা লগ', lang)}</div>
              </div>
            </div>
            <span className="badge success">8 Tanks Online</span>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="doc-table">
                <thead>
                  <tr>
                    <th>Tank ID</th>
                    <th>Product / Capacity</th>
                    <th>Wall Thickness</th>
                    <th>Relief Valve Test</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Tank #TK-101</strong></td>
                    <td>Bitumen 60/70 (5,000 MT)</td>
                    <td>12.4 mm (Nominal 12.5)</td>
                    <td><span className="badge success">Passed (10 Sep)</span></td>
                    <td><span className="badge success">Operational</span></td>
                  </tr>
                  <tr>
                    <td><strong>Tank #TK-102</strong></td>
                    <td>Bitumen 80/100 (5,000 MT)</td>
                    <td>12.1 mm (Nominal 12.5)</td>
                    <td><span className="badge success">Passed (10 Sep)</span></td>
                    <td><span className="badge success">Operational</span></td>
                  </tr>
                  <tr style={{ background: '#FFFDF5' }}>
                    <td><strong>Tank #TK-201</strong></td>
                    <td>Emulsion SS-1 (2,000 MT)</td>
                    <td>11.2 mm (Threshold 10.8)</td>
                    <td><span className="badge warn">Retest Due 20 Oct</span></td>
                    <td><span className="badge warn">Monitoring</span></td>
                  </tr>
                  <tr>
                    <td><strong>Tank #TK-202</strong></td>
                    <td>Cutback RC-70 (2,000 MT)</td>
                    <td>12.3 mm (Nominal 12.5)</td>
                    <td><span className="badge success">Passed (04 Oct)</span></td>
                    <td><span className="badge success">Operational</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Environmental & Flare Emissions Monitoring */}
        <div className="card">
          <div className="card-hd">
            <div className="card-hd-left">
              <div className="card-hd-icon"><Leaf size={16} /></div>
              <div>
                <div className="card-title">{t('DoE Continuous Emission Monitoring (CEMS)', 'পরিবেশ অধিদপ্তর অনলাইন নির্গমন পরিবীক্ষণ', lang)}</div>
                <div className="card-subtitle">{t('Real-time Stack Flue Gas & Flare Analyzer', 'ফ্লু গ্যাস ও ফ্লেয়ার স্ট্যাক অ্যানালাইজার', lang)}</div>
              </div>
            </div>
            <span className="badge success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#059669', animation: 'pulse 1.5s infinite' }} />
              Live Telemetry
            </span>
          </div>
          <div className="card-body">
            <div className="responsive-col-2-eq" style={{ gap: '12px' }}>
              <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)' }}>SO2 Stack Emission</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#059669', marginTop: '2px' }}>142 mg/Nm³</div>
                <div style={{ fontSize: '10px', color: '#64748B' }}>Limit: &lt; 500 mg/Nm³ (Passed)</div>
              </div>

              <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)' }}>NOx Stack Emission</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#059669', marginTop: '2px' }}>210 mg/Nm³</div>
                <div style={{ fontSize: '10px', color: '#64748B' }}>Limit: &lt; 400 mg/Nm³ (Passed)</div>
              </div>

              <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)' }}>Particulate Matter (PM)</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#059669', marginTop: '2px' }}>38 mg/Nm³</div>
                <div style={{ fontSize: '10px', color: '#64748B' }}>Limit: &lt; 150 mg/Nm³ (Passed)</div>
              </div>

              <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)' }}>ETP Water Discharge COD</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#059669', marginTop: '2px' }}>82 mg/L</div>
                <div style={{ fontSize: '10px', color: '#64748B' }}>Limit: &lt; 200 mg/L (Passed)</div>
              </div>
            </div>

            <div style={{ marginTop: '14px', fontSize: '11px', color: 'var(--brand-slate-700)', background: '#ECFDF5', padding: '10px 14px', borderRadius: '6px', border: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={15} color="#059669" />
              <span>{t('Telemetry streams 24/7 to DoE Paribesh Bhaban central gateway under ECR 2023 regulations.', 'পরিবেশ সংরক্ষণ বিধিমালা ২০২৩ অনুযায়ী পরিবেশ অধিদপ্তরের কেন্দ্রীয় সার্ভারে অবিচ্ছিন্ন ডাটা সম্প্রচারিত হচ্ছে।', lang)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ministry Licensing Dossier & Audit Inspection Modal */}
      {selectedLicense && (
        <div className="modal-bg" onClick={() => setSelectedLicense(null)}>
          <div className="modal" style={{ maxWidth: '780px', width: '95%' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-hd" style={{ background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)', color: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '8px', borderRadius: '6px' }}>
                  <Building size={20} color="#FBBF24" />
                </div>
                <div>
                  <h3 style={{ color: '#fff', margin: 0, fontSize: '16px', fontWeight: 800 }}>
                    {t(selectedLicense.title, selectedLicense.titleBn, lang)}
                  </h3>
                  <div style={{ fontSize: '11.5px', color: '#94A3B8', marginTop: '2px' }}>
                    {selectedLicense.agency} • Ref: <span style={{ fontFamily: 'monospace', color: '#CBD5E1' }}>{selectedLicense.refNo}</span>
                  </div>
                </div>
              </div>
              <button className="modal-close" style={{ color: '#fff' }} onClick={() => setSelectedLicense(null)}>×</button>
            </div>

            <div className="modal-body" style={{ maxHeight: '76vh', overflowY: 'auto', padding: '20px' }}>
              {/* Summary 4-Metrics Strip */}
              <div className="responsive-col-4" style={{ gap: '10px', marginBottom: '18px' }}>
                <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-500)', textTransform: 'uppercase', fontWeight: 700 }}>Statutory Law</div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-slate-900)', marginTop: '2px', lineHeight: 1.3 }}>{selectedLicense.sroLawRef}</div>
                </div>

                <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-500)', textTransform: 'uppercase', fontWeight: 700 }}>Renewal Fee</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#059669', marginTop: '2px' }}>{selectedLicense.feeAmountTk}</div>
                </div>

                <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-500)', textTransform: 'uppercase', fontWeight: 700 }}>Days to Expiry</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: selectedLicense.daysLeft <= 30 ? '#DC2626' : '#D97706', marginTop: '2px' }}>
                    {selectedLicense.daysLeft} Days
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-500)', textTransform: 'uppercase', fontWeight: 700 }}>Stoppage Risk</div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#991B1B', marginTop: '2px' }}>{selectedLicense.dailyShutdownRiskTk}</div>
                </div>
              </div>

              {/* Statutory Non-Compliance Penalty Alert */}
              <div style={{
                background: '#FEF2F2',
                border: '1px solid #FCA5A5',
                borderRadius: '8px',
                padding: '12px 14px',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px'
              }}>
                <ShieldAlert size={18} color="#DC2626" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '12px', lineHeight: 1.5 }}>
                  <strong style={{ color: '#991B1B' }}>{t('Statutory Non-Compliance Penalty Exposure:', 'বিধিবদ্ধ আইন অমান্যের সম্ভাব্য দণ্ড ও ঝুঁকি:', lang)}</strong>
                  <div style={{ color: '#7F1D1D', marginTop: '2px' }}>
                    {t(selectedLicense.statutoryPenalty, selectedLicense.statutoryPenaltyBn, lang)}
                  </div>
                </div>
              </div>

              {/* Inspector & Government Vetting Dossier */}
              <div style={{
                background: '#F1F5F9',
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
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#0369A1', marginTop: '2px' }}>
                    {selectedLicense.lastInspection}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--brand-slate-600)' }}>
                    Valid: {selectedLicense.certificateValidity}
                  </div>
                </div>
              </div>

              {/* Pipeline Stage Visual Stepper */}
              <div style={{ marginBottom: '18px', background: '#F8FAFC', padding: '14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
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
                          background: isCurrent ? s.color : isPassed ? '#059669' : '#E2E8F0',
                          color: isCurrent || isPassed ? '#fff' : '#64748B',
                          fontWeight: isCurrent ? 800 : 600,
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px'
                        }}
                      >
                        {isPassed && <Check size={12} />}
                        {isCurrent && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff' }} />}
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
                        background: c.passed ? '#ECFDF5' : '#FFFDF5',
                        border: c.passed ? '1px solid #A7F3D0' : '1px solid #FDE68A',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      onClick={() => toggleChecklistItem(idx)}
                    >
                      <input
                        type="checkbox"
                        checked={c.passed}
                        onChange={() => {}}
                        style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#059669' }}
                      />
                      <span style={{ fontSize: '12.5px', color: c.passed ? '#065F46' : '#92400E', flex: 1, fontWeight: 500 }}>
                        {c.item}
                      </span>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: c.passed ? '#D1FAE5' : '#FEF3C7',
                        color: c.passed ? '#059669' : '#D97706'
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
                        background: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        borderRadius: '6px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '6px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 800 }}>
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
              <button
                className="btn-gold"
                style={{ fontSize: '12px', padding: '7px 16px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                onClick={() => {
                  setSelectedLicense(null);
                  handleOpenDoLetter(selectedLicense);
                }}
              >
                <FileText size={14} />
                {t('Draft Official DO Letter to Ministry', 'মন্ত্রণালয়ে অফিশিয়াল ডিও লেটার ড্রাফট', lang)}
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn-sm-ghost" onClick={() => setSelectedLicense(null)}>
                  {t('Close', 'বন্ধ করুন', lang)}
                </button>
                {selectedLicense.stage < 5 && (
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
            <div className="modal-hd" style={{ background: '#7F1424', color: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: 'rgba(255,255,255,0.15)', padding: '6px', borderRadius: '6px' }}>
                  <FileText size={18} color="#FDE68A" />
                </div>
                <div>
                  <h3 style={{ color: '#fff', margin: 0, fontSize: '15px', fontWeight: 800 }}>
                    {t('Demi-Official (DO) Expedited Clearance Letter', 'জরুরি ডিও লেটার ড্রাফট ও প্রেরণ', lang)}
                  </h3>
                  <div style={{ fontSize: '11px', color: '#FCA5A5', marginTop: '2px' }}>
                    {t("Office of the Chairman & Managing Director • Bashundhara Group", "চেয়ারম্যানের নির্বাহী দপ্তর • বসুন্ধরা গ্রুপ", lang)}
                  </div>
                </div>
              </div>
              <button className="modal-close" style={{ color: '#fff' }} onClick={() => setShowDoLetterModal(null)}>×</button>
            </div>

            <div className="modal-body" style={{ maxHeight: '74vh', overflowY: 'auto', padding: '20px' }}>
              {/* Delivery Channel Selector */}
              <div style={{ marginBottom: '14px', background: '#F8FAFC', padding: '10px 14px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
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
                        style={{ accentColor: '#7F1424' }}
                      />
                      <span>{t(c.label, c.labelBn, lang)}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Official Letterhead Simulation */}
              <div style={{
                border: '2px solid #E2E8F0',
                padding: '24px',
                borderRadius: '6px',
                background: '#FFFFFF',
                fontSize: '12.5px',
                lineHeight: 1.6,
                boxShadow: 'var(--shadow-xs)',
                position: 'relative'
              }}>
                {/* Official Letterhead Crest */}
                <div style={{ textAlign: 'center', borderBottom: '2px solid #7F1424', paddingBottom: '12px', marginBottom: '16px' }}>
                  <div style={{ fontWeight: 900, fontSize: '16px', color: '#7F1424', letterSpacing: '0.8px' }}>
                    BASHUNDHARA GROUP
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>
                    OFFICE OF THE CHAIRMAN & MANAGING DIRECTOR
                  </div>
                  <div style={{ fontSize: '10px', color: '#64748B', marginTop: '2px' }}>
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
                    <span style={{ fontSize: '10.5px', color: '#DC2626', fontWeight: 700 }}>PRIORITY: IMMEDIATE EXPEDITE</span>
                  </div>
                </div>

                {/* Ministry Recipient */}
                <div style={{ marginBottom: '14px' }}>
                  <strong>To:</strong><br />
                  <strong>{showDoLetterModal.ministryRecipient}</strong><br />
                  <span style={{ color: '#475569' }}>{showDoLetterModal.ministryAddress}</span>
                </div>

                {/* Subject Line */}
                <div style={{
                  fontWeight: 800,
                  marginBottom: '12px',
                  color: '#0F172A',
                  background: '#F8FAFC',
                  padding: '8px 10px',
                  borderRadius: '4px',
                  borderLeft: '4px solid #7F1424'
                }}>
                  SUBJECT: REQUEST FOR EXPEDITIOUS ISSUANCE OF STATUTORY RENEWAL FOR {showDoLetterModal.title.toUpperCase()} — KERANIGANJ REFINERY & TANK FARM COMPLEX.
                </div>

                {/* Letter Body */}
                <div style={{ color: '#334155', textAlign: 'justify' }}>
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
                      border: '2px dashed #DC2626',
                      borderRadius: '50%',
                      width: '64px',
                      height: '64px',
                      color: '#DC2626',
                      fontSize: '9px',
                      fontWeight: 800,
                      transform: 'rotate(-10deg)',
                      margin: '0 auto 6px auto'
                    }}>
                      BOGCL<br />SEAL
                    </div>
                    <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '13px' }}>Ahmed Akbar Sobhan</div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>Chairman & Managing Director</div>
                    <div style={{ fontSize: '10px', color: '#64748B' }}>Bashundhara Group</div>
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
                      t(`DO Letter dispatched via ${doLetterDeliveryMode === 'enothi' ? 'Govt e-Nothi' : doLetterDeliveryMode === 'courier' ? 'Confidential Diplomatic Courier' : 'Executive Liaison'} to ${showDoLetterModal.agency}.`, `ডিও লেটার সফলভাবে প্রেরণ করা হয়েছে।`, lang),
                      'gold'
                    );
                    setShowDoLetterModal(null);
                  }}
                >
                  <Send size={14} />
                  {t('Dispatch DO Letter via Selected Channel', 'ডিও লেটার প্রেরণ করুন', lang)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ministry Live API Sync Gateway Modal */}
      {showSyncModal && (
        <div className="modal-bg" onClick={() => setShowSyncModal(false)}>
          <div className="modal" style={{ maxWidth: '640px', width: '95%' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-hd" style={{ background: '#0F172A', color: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '6px', borderRadius: '6px' }}>
                  <RefreshCw size={18} color="#38BDF8" className={isSyncing ? 'spin' : ''} />
                </div>
                <div>
                  <h3 style={{ color: '#fff', margin: 0, fontSize: '15px', fontWeight: 800 }}>
                    {t('Bangladesh Govt Regulatory Telemetry Gateway', 'সরকারি নিয়ন্ত্রক টেলিমেট্রি গেটওয়ে', lang)}
                  </h3>
                  <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
                    {t('Real-time connection with National Single Window (NSW) & e-Nothi', 'জাতীয় সিঙ্গেল উইন্ডো ও ই-নথি সিস্টেম সিঙ্ক্রোনাইজেশন', lang)}
                  </div>
                </div>
              </div>
              <button className="modal-close" style={{ color: '#fff' }} onClick={() => setShowSyncModal(false)}>×</button>
            </div>

            <div className="modal-body" style={{ padding: '20px' }}>
              <div style={{ marginBottom: '14px', fontSize: '12.5px', color: 'var(--brand-slate-600)' }}>
                {t(
                  'The Chairman Cockpit maintains continuous automated telemetry hooks with ministerial ERP gateways to prevent regulatory blindspots:',
                  'নিয়ন্ত্রক অন্ধত্ব দূর করতে এই ককপিট সরকারি গেটওয়ের সাথে সার্বক্ষণিক যোগাযোগ রক্ষা করে:',
                  lang
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { name: 'Bangladesh Govt e-Nothi (Nothi 2.0)', entity: 'Ministry of Public Admin & Energy Div', ping: '18 ms', status: 'Connected', code: 'SEC-TLS-1.3' },
                  { name: 'National Single Window (NSW)', entity: 'NBR Customs & Port Authority Gateway', ping: '24 ms', status: 'Synchronized', code: 'ASYCUDA-LIVE' },
                  { name: 'DoE Paribesh Bhaban CEMS Cloud', entity: 'Department of Environment Real-Time Server', ping: '14 ms', status: 'Live Telemetry', code: 'CEMS-STREAM-OK' },
                  { name: 'BPC Hydrocarbon Quota Allocation', entity: 'Bangladesh Petroleum Corporation ERP', ping: '31 ms', status: 'Active Bond', code: 'BPC-QUOTA-2026' },
                ].map((gate, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--brand-slate-900)' }}>{gate.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)', marginTop: '2px' }}>
                        {gate.entity} • Protocol: <span style={{ fontFamily: 'monospace', color: '#0369A1' }}>{gate.code}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="badge success" style={{ fontSize: '10px' }}>{gate.status}</span>
                      <div style={{ fontSize: '10px', color: 'var(--brand-slate-400)', marginTop: '2px' }}>Latency: {gate.ping}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-ft" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--brand-slate-500)' }}>
                {t(`Last verified: ${lastSyncTime}`, `সর্বশেষ যাচাই: ${lastSyncTime}`, lang)}
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn-sm-ghost" onClick={() => setShowSyncModal(false)}>
                  {t('Close', 'বন্ধ করুন', lang)}
                </button>
                <button
                  className="btn-primary"
                  disabled={isSyncing}
                  onClick={handlePerformSync}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
                >
                  <RefreshCw size={13} className={isSyncing ? 'spin' : ''} />
                  {isSyncing ? t('Synchronizing...', 'সিঙ্ক হচ্ছে...', lang) : t('Force Full Resync Now', 'এখনই পুনরায় সিঙ্ক করুন', lang)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

