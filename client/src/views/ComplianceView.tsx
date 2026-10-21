import React, { useState } from 'react';
import { ViewProps, t } from '../types';
import { showToast } from '../App';
import {
  ShieldCheck, AlertTriangle, Clock, CheckCircle, FileText,
  Flame, Leaf, Building, ArrowRight, Upload, Zap, RefreshCw,
  ExternalLink, Eye, Award, Check, Download, AlertOctagon,
  ChevronRight, Printer, Sparkles
} from 'lucide-react';

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
  lastInspection: string;
  criticality: 'critical' | 'high' | 'medium';
  sroLawRef: string;
  feeAmountTk: string;
  auditChecklist: { item: string; passed: boolean }[];
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
    focalPerson: 'Engr. Harunur Rashid (GM)',
    lastInspection: '04 Oct 2026',
    criticality: 'critical',
    sroLawRef: 'Petroleum Act 1934 & Petroleum Rules 1937, Section 4(1)',
    feeAmountTk: '৳ 2,50,000',
    auditChecklist: [
      { item: 'Nitrogen blanketing pressure integrity verified on all 8 tanks', passed: true },
      { item: 'Pressure vacuum relief valves (PVRV) calibrated to 2.5 bar', passed: true },
      { item: 'Dyke containment wall volumetric retention capacity > 110%', passed: true },
      { item: 'Explosion-proof ATEX lighting certified in Zone-1 areas', passed: false },
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
    focalPerson: 'Farhana Kabir (EHS Lead)',
    lastInspection: '12 Sep 2026',
    criticality: 'critical',
    sroLawRef: 'Bangladesh Environment Conservation Act 1995 & ECR 2023',
    feeAmountTk: '৳ 4,00,000',
    auditChecklist: [
      { item: 'Online Continuous Effluent Monitoring System (CEMS) online', passed: true },
      { item: 'ETP Treated discharge: BOD < 30 mg/L, COD < 200 mg/L', passed: true },
      { item: 'Stack emission analyzer: SOx/NOx within DoE threshold', passed: true },
      { item: 'Hazardous sludge disposal contract with certified vendor', passed: true },
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
    lastInspection: '20 Aug 2026',
    criticality: 'high',
    sroLawRef: 'Fire Prevention & Extinguishing Act 2003, Section 7',
    feeAmountTk: '৳ 1,80,000',
    auditChecklist: [
      { item: 'Ring hydrant header maintained at continuous 8.5 bar pressure', passed: true },
      { item: 'Deluge water spray system over Tank 101/102 functional', passed: true },
      { item: 'AFFF Foam concentrate stock: 12,000 Liters available', passed: true },
      { item: 'Quarterly full-plant emergency evacuation drill logged', passed: true },
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
    focalPerson: 'Dr. Rafiqul Huq (QC Head)',
    lastInspection: '01 Oct 2026',
    criticality: 'medium',
    sroLawRef: 'BSTI Act 2018 & BDS 1238:2020 Specification',
    feeAmountTk: '৳ 1,25,000',
    auditChecklist: [
      { item: 'Penetration index at 25°C between 60 and 70 (0.1 mm)', passed: true },
      { item: 'Softening point (Ring & Ball) >= 49°C', passed: true },
      { item: 'Ductility at 25°C > 100 cm', passed: true },
      { item: 'Flash Point (Cleveland Open Cup) > 230°C', passed: true },
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
    lastInspection: '28 Sep 2026',
    criticality: 'critical',
    sroLawRef: 'Import Policy Order 2021-2024 & Hydrocarbon Import Guideline',
    feeAmountTk: '৳ 15,00,000',
    auditChecklist: [
      { item: 'Letter of Credit clearance from Bangladesh Bank', passed: true },
      { item: 'Monthly throughput utilization report submitted to BPC', passed: true },
      { item: 'Customs bonded warehouse bond renewal validated', passed: true },
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
    lastInspection: 'Due this week',
    criticality: 'high',
    sroLawRef: 'Weights and Measures Act & Boiler Inspection Rules',
    feeAmountTk: '৳ 75,000',
    auditChecklist: [
      { item: 'Deadweight tester calibration certificate verified', passed: true },
      { item: 'Seat leakage test at 90% set pressure recorded zero bubbles', passed: false },
    ],
  },
];

const STAGES = [
  { id: 1, title: '1. Internal Review', titleBn: '১. অভ্যন্তরীণ মূল্যায়ন', color: '#7C3AED' },
  { id: 2, title: '2. Application Filed', titleBn: '২. আবেদন দাখিল', color: '#0284C7' },
  { id: 3, title: '3. Field Inspection', titleBn: '৩. মাঠ পরিদর্শন', color: '#D97706' },
  { id: 4, title: '4. Ministry Vetting', titleBn: '৪. মন্ত্রণালয়ে যাচাই', color: '#A51C30' },
  { id: 5, title: '5. Renewed & Active', titleBn: '৫. সক্রিয় ও নবায়িত', color: '#059669' },
];

export default function ComplianceView({ role, lang }: ViewProps) {
  const [licenses, setLicenses] = useState<LicenseCard[]>(INITIAL_LICENSES);
  const [selectedLicense, setSelectedLicense] = useState<LicenseCard | null>(null);
  const [showDoLetterModal, setShowDoLetterModal] = useState<LicenseCard | null>(null);

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

  const toggleChecklistItem = (itemIndex: number) => {
    if (!selectedLicense) return;
    const updatedChecklist = [...selectedLicense.auditChecklist];
    updatedChecklist[itemIndex].passed = !updatedChecklist[itemIndex].passed;
    const updated = { ...selectedLicense, auditChecklist: updatedChecklist };
    setSelectedLicense(updated);
    setLicenses(prev => prev.map(l => l.id === updated.id ? updated : l));
  };

  const urgentEscalate = (lic: LicenseCard) => {
    showToast(t(`URGENT alert dispatched to Chairman's Office: ${lic.title}`, `চেয়ারম্যানের দপ্তরে জরুরি সতর্কবার্তা পাঠানো হয়েছে: ${lic.title}`, lang), 'gold');
  };

  return (
    <div>
      {/* Top Banner */}
      <div className="flex-between mb-4">
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--brand-slate-900)' }}>
            {t('Compliance Vault & Regulatory Safety Cockpit', 'কমপ্লায়েন্স ভল্ট ও নিয়ন্ত্রক লাইসেন্স ককপিট', lang)}
          </h2>
          <p className="text-muted">
            {t('Keraniganj Bitumen Plant & Tank Farm — Zero Shutdown Guarantee & Ministry Pipeline', 'কেরানীগঞ্জ বিটুমিন রিফাইনারি ও ট্যাংক ফার্ম — শূন্য শাটডাউন ব্যবস্থাপনা ও লাইসেন্স ট্র্যাকিং', lang)}
          </p>
        </div>
        <div className="flex-gap">
          <div style={{ padding: '8px 14px', background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={18} color="#059669" />
            <div style={{ fontSize: '11px', color: '#065F46' }}>
              <strong>{t('Plant Audit Readiness Score: 94.2%', 'প্ল্যান্ট অডিট প্রস্তুতি স্কোর: ৯৪.২%', lang)}</strong>
              <div>{t('Complies with Petroleum Act & DoE 2026', 'পেট্রোলিয়াম আইন ও পরিবেশ সংরক্ষণ বিধি সম্মত', lang)}</div>
            </div>
          </div>
          <button
            className="btn-primary"
            onClick={() => showToast(t('Initiated live audit sync with Bangladesh Govt e-Nothi portal...', 'সরকারি ই-নথি সিস্টেমের সাথে সিঙ্ক হচ্ছে...', lang), 'info')}
          >
            <RefreshCw size={14} />
            {t('Sync Ministry Status', 'মন্ত্রণালয় সিঙ্ক', lang)}
          </button>
        </div>
      </div>

      {/* Critical Countdown Warning Strip */}
      <div style={{
        background: 'linear-gradient(90deg, #7F1424 0%, #A51C30 100%)',
        color: '#fff',
        padding: '12px 18px',
        borderRadius: 'var(--radius-md)',
        marginBottom: '22px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: 'var(--shadow-crimson)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <AlertTriangle size={20} color="#F0DFA0" />
          <div style={{ fontSize: '12.5px' }}>
            <strong>{t('CRITICAL COMPLIANCE NOTICE:', 'জরুরি বিধিবদ্ধ নোটিশ:', lang)}</strong>{' '}
            {t(
              'Bulk Hydrocarbon Tank Farm License (Tanks 1-8) has 18 days remaining. Ministry inspection report finalized.',
              'বাল্ক হাইড্রোকার্বন ট্যাংক ফার্ম লাইসেন্সের মেয়াদ শেষ হতে মাত্র ১৮ দিন বাকি। জরুরি পদক্ষেপ প্রয়োজন।',
              lang
            )}
          </div>
        </div>
        <button
          className="btn-gold"
          style={{ fontSize: '11.5px', padding: '5px 12px' }}
          onClick={() => setShowDoLetterModal(licenses[0])}
        >
          <FileText size={13} />
          {t('Dispatch DO Letter to DG Explosives', 'ডিজি বিস্ফোরকে ডিও লেটার পাঠান', lang)}
        </button>
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
          <span className="badge info">{licenses.length} {t('Active Regulatory Filings', 'টি বিধিবদ্ধ নথি', lang)}</span>
        </div>

        <div className="card-body">
          <div className="kanban">
            {STAGES.map(stage => {
              const stageLicenses = licenses.filter(l => l.stage === stage.id);
              return (
                <div key={stage.id} className="kanban-col">
                  <div className={`kanban-col-hd stage-${stage.id}`}>
                    <h4>{t(stage.title, stage.titleBn, lang)}</h4>
                    <span className="kanban-count">{stageLicenses.length}</span>
                  </div>
                  <div className="kanban-cards">
                    {stageLicenses.map(lic => (
                      <div
                        key={lic.id}
                        className="k-card"
                        onClick={() => setSelectedLicense(lic)}
                        style={{ borderLeft: lic.daysLeft <= 20 ? '4px solid #DC2626' : lic.daysLeft <= 60 ? '4px solid #D97706' : '4px solid #059669', cursor: 'pointer' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className={`k-tag ${lic.tag}`}>{lic.tagLabel}</span>
                          <span className={`k-countdown ${lic.daysLeft <= 20 ? 'urgent' : lic.daysLeft <= 60 ? 'warning' : 'ok'}`}>
                            {lic.daysLeft <= 0 ? 'EXPIRED' : `${lic.daysLeft}d left`}
                          </span>
                        </div>

                        <div className="k-title">{t(lic.title, lic.titleBn, lang)}</div>
                        <div className="k-meta">
                          <div><strong>{t(lic.agency, lic.agencyBn, lang)}</strong></div>
                          <div style={{ fontFamily: 'monospace', fontSize: '10px' }}>{lic.refNo}</div>
                          <div style={{ marginTop: '4px', color: 'var(--brand-slate-500)' }}>
                            👤 {lic.focalPerson}
                          </div>
                        </div>

                        <div className="k-footer">
                          <div style={{ display: 'flex', gap: '4px' }}>
                            {lic.stage > 1 && (
                              <button
                                className="btn-sm-ghost"
                                style={{ padding: '2px 6px', fontSize: '10px' }}
                                onClick={(e) => { e.stopPropagation(); moveLicense(lic.id, -1); }}
                                title="Move back"
                              >
                                ◀
                              </button>
                            )}
                            {lic.stage < 5 && (
                              <button
                                className="btn-sm-ghost"
                                style={{ padding: '2px 6px', fontSize: '10px' }}
                                onClick={(e) => { e.stopPropagation(); moveLicense(lic.id, 1); }}
                                title="Advance stage"
                              >
                                ▶
                              </button>
                            )}
                          </div>
                          {lic.daysLeft <= 30 && (
                            <button
                              className="btn-outline-danger"
                              style={{ padding: '2px 6px', fontSize: '10px' }}
                              onClick={(e) => { e.stopPropagation(); urgentEscalate(lic); }}
                            >
                              ⚡ {t('Escalate', 'তাগিদ', lang)}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}

                    {stageLicenses.length === 0 && (
                      <div style={{ padding: '24px 10px', textAlign: 'center', color: 'var(--brand-slate-400)', fontSize: '11px', border: '1px dashed var(--brand-slate-200)', borderRadius: 'var(--radius-sm)' }}>
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
      <div className="col-2">
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
            <span className="badge success">100% Compliant</span>
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

            <div style={{ marginTop: '14px', fontSize: '11px', color: 'var(--brand-slate-600)', background: '#ECFDF5', padding: '8px 12px', borderRadius: '4px', border: '1px solid #A7F3D0' }}>
              ✓ Data streams continuously to DoE Paribesh Bhaban central portal under ECR 2023 regulations.
            </div>
          </div>
        </div>
      </div>

      {/* Ministry Licensing Dossier & Audit Inspection Modal */}
      {selectedLicense && (
        <div className="modal-bg" onClick={() => setSelectedLicense(null)}>
          <div className="modal" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-hd" style={{ background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)', color: '#fff' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Building size={18} color="#FBBF24" />
                  <h3 style={{ color: '#fff', margin: 0 }}>
                    {t(selectedLicense.title, selectedLicense.titleBn, lang)}
                  </h3>
                </div>
                <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
                  {selectedLicense.agency} • Ref: {selectedLicense.refNo}
                </div>
              </div>
              <button className="modal-close" style={{ color: '#fff' }} onClick={() => setSelectedLicense(null)}>×</button>
            </div>

            <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
              {/* Summary Strip */}
              <div className="responsive-col-3" style={{ gap: '10px', marginBottom: '16px' }}>
                <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-500)' }}>Statutory Law Reference</div>
                  <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--brand-slate-900)', marginTop: '2px' }}>{selectedLicense.sroLawRef}</div>
                </div>

                <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-500)' }}>Annual Renewal Fee</div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#059669', marginTop: '2px' }}>{selectedLicense.feeAmountTk}</div>
                </div>

                <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-500)' }}>Days to Expiry</div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: selectedLicense.daysLeft <= 20 ? '#DC2626' : '#D97706', marginTop: '2px' }}>
                    {selectedLicense.daysLeft} Days
                  </div>
                </div>
              </div>

              {/* Pipeline Stage Visual */}
              <div style={{ marginBottom: '16px', background: '#F1F5F9', padding: '12px', borderRadius: '6px' }}>
                <div style={{ fontSize: '11.5px', fontWeight: 700, marginBottom: '8px', color: 'var(--brand-slate-900)' }}>
                  Current Approval Stage:
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {STAGES.map(s => (
                    <div
                      key={s.id}
                      style={{
                        flex: 1,
                        padding: '6px 4px',
                        textAlign: 'center',
                        fontSize: '10px',
                        borderRadius: '4px',
                        background: s.id === selectedLicense.stage ? s.color : s.id < selectedLicense.stage ? '#059669' : '#E2E8F0',
                        color: s.id <= selectedLicense.stage ? '#fff' : '#64748B',
                        fontWeight: s.id === selectedLicense.stage ? 800 : 500,
                      }}
                    >
                      {s.id <= selectedLicense.stage ? '✓ ' : ''}{s.id}. {s.title.split('. ')[1]}
                    </div>
                  ))}
                </div>
              </div>

              {/* Interactive Audit Verification Checklist */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--brand-slate-900)', marginBottom: '8px' }}>
                  {t('Mandatory Statutory Audit Checklist:', 'বাধ্যতামূলক বিধিবদ্ধ অডিট চেকলিস্ট:', lang)}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedLicense.auditChecklist.map((c, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 12px',
                        background: c.passed ? '#ECFDF5' : '#FFFDF5',
                        border: c.passed ? '1px solid #A7F3D0' : '1px solid #FDE68A',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                      onClick={() => toggleChecklistItem(idx)}
                    >
                      <input
                        type="checkbox"
                        checked={c.passed}
                        onChange={() => {}}
                        style={{ cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '12px', color: c.passed ? '#065F46' : '#92400E', flex: 1 }}>
                        {c.item}
                      </span>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: c.passed ? '#059669' : '#D97706' }}>
                        {c.passed ? 'VERIFIED' : 'PENDING'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-ft">
              <button className="btn-sm-ghost" onClick={() => setSelectedLicense(null)}>{t('Close', 'বন্ধ করুন', lang)}</button>
              {selectedLicense.stage < 5 && (
                <button
                  className="btn-primary"
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
      )}

      {/* Demi-Official (DO) Letter Modal to Ministry */}
      {showDoLetterModal && (
        <div className="modal-bg" onClick={() => setShowDoLetterModal(null)}>
          <div className="modal" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-hd" style={{ background: '#7F1424', color: '#fff' }}>
              <div>
                <h3 style={{ color: '#fff', margin: 0 }}>
                  {t('Demi-Official (DO) Expedited Clearance Letter', 'জরুরি ডিও লেটার ড্রাফট', lang)}
                </h3>
                <div style={{ fontSize: '11px', color: '#FCA5A5', marginTop: '2px' }}>
                  Chairman's Executive Office • Bashundhara Group
                </div>
              </div>
              <button className="modal-close" style={{ color: '#fff' }} onClick={() => setShowDoLetterModal(null)}>×</button>
            </div>

            <div className="modal-body">
              <div style={{ border: '2px solid #E2E8F0', padding: '16px', borderRadius: '4px', background: '#FAFAFA', fontSize: '12px', lineHeight: 1.6 }}>
                <div style={{ textAlign: 'center', borderBottom: '2px solid #7F1424', paddingBottom: '10px', marginBottom: '14px' }}>
                  <div style={{ fontWeight: 900, fontSize: '14px', color: '#7F1424' }}>BASHUNDHARA GROUP</div>
                  <div style={{ fontSize: '10.5px', color: '#64748B' }}>Corporate HQ, Plot-3, Block-G, Umme Kulsum Road, Bashundhara R/A, Dhaka-1229</div>
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <strong>Ref:</strong> BOGCL/CMD-DO/EXP-2026/041<br />
                  <strong>Date:</strong> 17 October 2026<br /><br />
                  <strong>To:</strong><br />
                  The Chief Inspector of Explosives<br />
                  Department of Explosives, Segunbagicha, Dhaka.
                </div>

                <div style={{ fontWeight: 700, marginBottom: '8px', color: '#0F172A' }}>
                  SUBJECT: REQUEST FOR EXPEDITIOUS ISSUANCE OF BULK BITUMEN TANK FARM LICENSE RENEWAL (TANKS 1-8), KERANIGANJ COMPLEX.
                </div>

                <div style={{ color: '#334155' }}>
                  Dear Sir,<br />
                  Greetings from Bashundhara Oil & Gas Company Limited. This is to apprise your good office that the comprehensive safety audit, nitrogen blanketing validation, and ultrasonic thickness tests for Tanks 1 through 8 have been completed with full compliance.<br /><br />
                  As the primary bitumen supplier to the national highway mega-projects, uninterrupted operations are vital to prevent asphalt supply deficits. We respectfully solicit your expedited approval of the final vetting.
                </div>

                <div style={{ marginTop: '16px', textAlign: 'right' }}>
                  <strong>Ahmed Akbar Sobhan</strong><br />
                  <span style={{ fontSize: '11px', color: '#64748B' }}>Chairman & Managing Director, Bashundhara Group</span>
                </div>
              </div>
            </div>

            <div className="modal-ft">
              <button className="btn-sm-ghost" onClick={() => setShowDoLetterModal(null)}>{t('Cancel', 'বাতিল', lang)}</button>
              <button
                className="btn-gold"
                onClick={() => {
                  showToast(t('DO Letter dispatched via confidential courier & encrypted email to DG Explosives.', 'ডিও লেটার প্রেরিত হয়েছে।', lang), 'gold');
                  setShowDoLetterModal(null);
                }}
              >
                <Printer size={14} />
                {t('Dispatch & Print DO Letter', 'প্রেরণ ও প্রিন্ট করুন', lang)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
