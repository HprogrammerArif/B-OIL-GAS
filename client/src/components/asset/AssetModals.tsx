import React, { useState, useEffect, useMemo } from 'react';
import { AppRole, Lang, ROLE_META, t } from '../../types';
import { showToast } from '../ToastManager';
import { peekRef } from '../../lib/refs';
import { useEmployeeStore } from '../../store/employeeStore';
import {
  AssetCategory,
  AssetCriticality,
  AssetDisposalDossier,
  AssetFacility,
  AssetRecord,
  AssetWorkOrder,
  buildDepreciationSchedule,
  calculateAssetFinancials,
  DepreciationMethod,
  RegisterAssetInput,
} from '../../store/assetStore';
import {
  Plus,
  X,
  CheckCircle,
  QrCode,
  Printer,
  Barcode,
  ArrowRightLeft,
  Wrench,
  FilePlus,
  Archive,
  DollarSign,
  Download,
  ShieldAlert,
  ShieldCheck,
  Search,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════════════════════
   1. REGISTER / COMMISSION CAPITAL ASSET MODAL
   ══════════════════════════════════════════════════════════════════════════ */
export function RegisterAssetModal({
  isOpen,
  onClose,
  onRegister,
  role,
  lang,
}: {
  isOpen: boolean;
  onClose: () => void;
  onRegister: (input: RegisterAssetInput) => void;
  role: AppRole;
  lang: Lang;
}) {
  const { activeEmployees } = useEmployeeStore();
  const [tag, setTag] = useState('BOGCL-KER-PMP-109');
  const [name, setName] = useState('Sulzer High-Pressure Bitumen Circulation Booster Pump');
  const [category, setCategory] = useState<AssetCategory>(
    role === 'transport_admin' ? 'vehicle' : role === 'hr_admin' ? 'it' : 'plant'
  );
  const [criticality, setCriticality] = useState<AssetCriticality>('essential_b');
  const [facility, setFacility] = useState<AssetFacility>(
    role === 'hr_admin' ? 'Bashundhara Corporate HQ, Baridhara' : 'Keraniganj Bitumen Refinery'
  );
  const [functionalLocation, setFunctionalLocation] = useState('Unit-2 High-Pressure Circulation Bay');
  const [selectedEmpId, setSelectedEmpId] = useState('EMP-0012');
  const [placeInStorePool, setPlaceInStorePool] = useState(false);
  const [oem, setOem] = useState('Sulzer Pumps AG');
  const [modelNo, setModelNo] = useState('IND-2026-ATEX');
  const [serialNo, setSerialNo] = useState('SLZ-BPP-2026-BD');
  const [purchaseCost, setPurchaseCost] = useState('4500000');
  const [salvageValue, setSalvageValue] = useState('400000');
  const [usefulLifeYears, setUsefulLifeYears] = useState('12');
  const [depMethod, setDepMethod] = useState<DepreciationMethod>('SLM');
  const [calDays, setCalDays] = useState('180');
  const [warrantyMonths, setWarrantyMonths] = useState('24');
  const [regAuthority, setRegAuthority] = useState<AssetRecord['regulatoryAuthority']>('ASME / API-510');
  const [specs, setSpecs] = useState(
    'High-Pressure Bitumen Circulation Booster Pump (28 Bar, 240°C Thermal Jacket, ATEX Zone-1 Explosion-Proof)'
  );

  const applyPreset = (presetKey: 'pump' | 'laptop' | 'tanker' | 'safety' | 'lab') => {
    const suffix = peekRef('TAG', 3).slice(-3);
    if (presetKey === 'pump') {
      setTag(`BOGCL-KER-PMP-${suffix}`);
      setName('Sulzer High-Pressure Bitumen Circulation Booster Pump');
      setCategory('plant');
      setCriticality('critical_a');
      setFacility('Keraniganj Bitumen Refinery');
      setFunctionalLocation('Unit-2 High-Pressure Circulation Bay');
      setOem('Sulzer Pumps AG');
      setModelNo('MSD-28B-ATEX');
      setSerialNo(`SLZ-2026-${suffix}`);
      setPurchaseCost('4500000');
      setSalvageValue('400000');
      setUsefulLifeYears('12');
      setDepMethod('SLM');
      setCalDays('180');
      setWarrantyMonths('24');
      setRegAuthority('ASME / API-510');
      setSpecs('28 Bar Thermal-Jacketed Bitumen Pump, 240°C rated, ATEX Zone-1 Motor');
    } else if (presetKey === 'laptop') {
      setTag(`BOGCL-HQ-IT-${suffix}`);
      setName('ThinkPad P16s Gen-3 Enterprise Workstation');
      setCategory('it');
      setCriticality('general_c');
      setFacility('Bashundhara Corporate HQ, Baridhara');
      setFunctionalLocation('Level-8 Finance Wing');
      setOem('Lenovo Enterprise');
      setModelNo('P16s-G3-vPro');
      setSerialNo(`LNV-BD-${suffix}`);
      setPurchaseCost('245000');
      setSalvageValue('20000');
      setUsefulLifeYears('4');
      setDepMethod('SLM');
      setCalDays('365');
      setWarrantyMonths('36');
      setRegAuthority('Corporate IT');
      setSpecs('Intel Core Ultra 7 vPro, 32GB ECC RAM, 1TB NVMe Hardware Encrypted MDM');
    } else if (presetKey === 'tanker') {
      setTag(`BOGCL-FLT-TNK-${suffix}`);
      setName('Volvo FMX 440 Insulated 30,000L Hot Bitumen Tanker');
      setCategory('vehicle');
      setCriticality('critical_a');
      setFacility('Chattogram Patenga Terminal');
      setFunctionalLocation('Heavy Tanker Dispatch Bay-3');
      setOem('Volvo Trucks Sweden');
      setModelNo('FMX-440-6x4');
      setSerialNo(`YV2X-2026-${suffix}`);
      setPurchaseCost('18500000');
      setSalvageValue('2200000');
      setUsefulLifeYears('10');
      setDepMethod('UOP');
      setCalDays('90');
      setWarrantyMonths('36');
      setRegAuthority('BRTA');
      setSpecs('30,000L Rockwool Thermal Tanker with Dual Burner, GPS Telemetry & ADR Safety');
    } else if (presetKey === 'safety') {
      setTag(`BOGCL-KER-HSE-${suffix}`);
      setName('Honeywell Searchpoint Optima Plus H2S & Hydrocarbon Gas Detector');
      setCategory('safety');
      setCriticality('critical_a');
      setFacility('Keraniganj Bitumen Refinery');
      setFunctionalLocation('Tank Farm Zone-A Perimeter');
      setOem('Honeywell Analytics');
      setModelNo('Optima-IR-SIL2');
      setSerialNo(`HNW-SIL2-${suffix}`);
      setPurchaseCost('680000');
      setSalvageValue('35000');
      setUsefulLifeYears('7');
      setDepMethod('SLM');
      setCalDays('90');
      setWarrantyMonths('24');
      setRegAuthority('Dept. of Explosives (DoE)');
      setSpecs('Infrared Point Hydrocarbon & H2S Transmitter, SIL-2 Certified, 4-20mA HART');
    } else if (presetKey === 'lab') {
      setTag(`BOGCL-KER-LAB-${suffix}`);
      setName('Anton Paar SmartPave 102e Dynamic Shear Rheometer');
      setCategory('lab');
      setCriticality('essential_b');
      setFacility('Keraniganj Bitumen Refinery');
      setFunctionalLocation('Central Bitumen QC Metrology Lab');
      setOem('Anton Paar GmbH');
      setModelNo('SmartPave-102e');
      setSerialNo(`AP-DSR-${suffix}`);
      setPurchaseCost('3800000');
      setSalvageValue('250000');
      setUsefulLifeYears('8');
      setDepMethod('WDV');
      setCalDays('180');
      setWarrantyMonths('24');
      setRegAuthority('BSTI');
      setSpecs('ASTM D7175 / AASHTO T315 Peltier Temperature-Controlled Bitumen Rheometer');
    }
  };

  const livePreview = useMemo(() => {
    const costNum = Math.max(0, Number(purchaseCost) || 0);
    const salvNum = Math.min(costNum, Math.max(0, Number(salvageValue) || 0));
    const lifeNum = Math.max(1, Number(usefulLifeYears) || 1);
    const depBase = Math.max(0, costNum - salvNum);
    const annual =
      depMethod === 'WDV'
        ? Math.round(costNum * (2 / lifeNum))
        : Math.round(depBase / lifeNum);
    const monthly = Math.round(annual / 12);
    return { depBase, annual, monthly };
  }, [purchaseCost, salvageValue, usefulLifeYears, depMethod]);

  if (!isOpen) return null;

  const chosenEmp = activeEmployees.find((e) => e.id === selectedEmpId) || activeEmployees[0];
  const actor = ROLE_META[role];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast(t('Please enter the equipment / asset title.', 'অনুগ্রহ করে সম্পদের পূর্ণ নাম লিখুন।', lang), 'warn');
      return;
    }
    onRegister({
      tag,
      name,
      category,
      criticality,
      facility,
      functionalLocation,
      department: chosenEmp?.dept || 'Plant Operations',
      custodian: chosenEmp?.name || 'Engr. Md. Harunur Rashid',
      custodianEmpId: chosenEmp?.id,
      placeInStorePool,
      oem,
      modelNo,
      serialNo,
      specs,
      purchaseCost: Number(purchaseCost) || 1000000,
      salvageValue: Number(salvageValue) || 80000,
      usefulLifeYears: Number(usefulLifeYears) || 10,
      depreciationMethod: depMethod,
      calibrationCycleDays: Number(calDays) || 180,
      warrantyMonths: Number(warrantyMonths) || 24,
      regulatoryAuthority: regAuthority,
      actorName: actor.name,
      actorRole: actor.label,
    });
    onClose();
  };

  return (
    <div className="eam-modal-overlay" onClick={onClose}>
      <div className="eam-modal lg" onClick={(e) => e.stopPropagation()}>
        <div className="eam-modal-hd crimson">
          <div className="eam-modal-hd-left">
            <div className="eam-modal-icon">
              <Plus size={19} />
            </div>
            <div>
              <h3 className="eam-modal-title">{t('Add Purchased Equipment to Register', 'নতুন মূলধনী সম্পদ নিবন্ধন ও কমিশনিং', lang)}</h3>
              <div className="eam-modal-subtitle">{t('Record details, assign an operator or store pool, and set yearly depreciation.', 'তথ্য নথিভুক্ত করুন, দায়িত্বপ্রাপ্ত কর্মকর্তা নির্ধারণ করুন এবং বার্ষিক অবচয় নির্ধারণ করুন।', lang)}</div>
            </div>
          </div>
          <button type="button" className="eam-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="eam-modal-body">
            {/* 1-Click Quick-Fill Templates */}
            <div className="eam-preset-bar">
              <div className="eam-preset-lbl">
                <span>{t('Fill with an example', 'দ্রুত পূরণের টেমপ্লেট নির্বাচন করুন', lang)}</span>
              </div>
              <select
                className="eam-select"
                value=""
                onChange={(e) => {
                  if (e.target.value) applyPreset(e.target.value as 'pump' | 'laptop' | 'tanker' | 'safety' | 'lab');
                }}
              >
                <option value="">{t('Choose an example…', 'একটি উদাহরণ বেছে নিন…', lang)}</option>
                <option value="pump">{t('Refinery Pump', 'রিফাইনারি পাম্প', lang)}</option>
                <option value="laptop">{t('Corporate Laptop', 'কর্পোরেট ল্যাপটপ', lang)}</option>
                <option value="tanker">{t('30kL Bitumen Tanker', '৩০কেএল বিটুমিন ট্যাংকার', lang)}</option>
                <option value="safety">{t('Gas Detector', 'গ্যাস ডিটেক্টর', lang)}</option>
                <option value="lab">{t('Lab Rheometer', 'ল্যাব রিওমিটার', lang)}</option>
              </select>
            </div>

            <div className="eam-form-section-title">
              1. {t('Equipment Identity, Site & Operator', 'সম্পদের পরিচিতি, অবস্থান ও হেফাজত', lang)}
            </div>

            <div className="eam-form-grid-2">
              <div className="eam-field">
                <label className="eam-label">{t('Equipment Tag Code', 'অ্যাসেট ট্যাগ কোড', lang)} *</label>
                <input type="text" className="eam-input" value={tag} onChange={(e) => setTag(e.target.value)} required />
              </div>
              <div className="eam-field">
                <label className="eam-label">{t('Equipment Category', 'সরঞ্জাম শ্রেণী', lang)} *</label>
                <select className="eam-select" value={category} onChange={(e) => setCategory(e.target.value as AssetCategory)}>
                  <option value="plant">{t('Refinery Plant & Process Machinery', 'রিফাইনারি প্ল্যান্ট ও প্রসেস যন্ত্রপাতি', lang)}</option>
                  <option value="vehicle">{t('Heavy Fleet & Bitumen Tankers', 'ভারী বহর ও বিটুমিন ট্যাংকার', lang)}</option>
                  <option value="it">{t('Control Systems & Corporate IT', 'কন্ট্রোল সিস্টেম ও কর্পোরেট আইটি', lang)}</option>
                  <option value="safety">{t('Safety, Fire & Gas Detection', 'নিরাপত্তা, অগ্নি ও গ্যাস শনাক্তকরণ', lang)}</option>
                  <option value="lab">{t('Quality Control & Bitumen Lab', 'মান নিয়ন্ত্রণ ও বিটুমিন ল্যাব', lang)}</option>
                  <option value="corporate">{t('Office & Facility Infrastructure', 'অফিস ও স্থাপনা অবকাঠামো', lang)}</option>
                </select>
              </div>
            </div>

            <div className="eam-field">
              <label className="eam-label">{t('Equipment Full Name', 'যন্ত্রপাতির পূর্ণ নাম', lang)} *</label>
              <input
                type="text"
                className="eam-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sulzer High-Pressure Bitumen Circulation Booster Pump"
                required
              />
            </div>

            <div className="eam-form-grid-2">
              <div className="eam-field">
                <label className="eam-label">{t('Facility / Site', 'স্থাপনা / সাইট', lang)}</label>
                <select className="eam-select" value={facility} onChange={(e) => setFacility(e.target.value as AssetFacility)}>
                  <option value="Keraniganj Bitumen Refinery">Keraniganj Bitumen Refinery</option>
                  <option value="Bashundhara Corporate HQ, Baridhara">Bashundhara Corporate HQ, Baridhara</option>
                  <option value="Chattogram Patenga Terminal">Chattogram Patenga Terminal</option>
                </select>
              </div>
              <div className="eam-field">
                <label className="eam-label">{t('Unit, Bay or Floor', 'ইউনিট বা অবস্থান', lang)}</label>
                <input type="text" className="eam-input" value={functionalLocation} onChange={(e) => setFunctionalLocation(e.target.value)} />
              </div>
            </div>

            <div className="eam-form-grid-2">
              <div className="eam-field">
                <label className="eam-label">{t('Importance Level', 'ঝুঁকি ও গুরুত্ব শ্রেণী', lang)}</label>
                <select className="eam-select" value={criticality} onChange={(e) => setCriticality(e.target.value as AssetCriticality)}>
                  <option value="critical_a">{t('Safety or Production Critical', 'নিরাপত্তা বা উৎপাদন ক্রিটিক্যাল', lang)}</option>
                  <option value="essential_b">{t('Operations Essential', 'অপারেশন আবশ্যক', lang)}</option>
                  <option value="general_c">{t('General Office / Support', 'সাধারণ অফিস / সহায়তা', lang)}</option>
                </select>
              </div>
              <div className="eam-field">
                <label className="eam-label">{t('Assigned Operator / Custodian', 'দায়িত্বপ্রাপ্ত কর্মকর্তা', lang)}</label>
                <select
                  className="eam-select"
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  disabled={placeInStorePool}
                >
                  {activeEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} — {emp.dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <label className="eam-checkbox-card">
              <input
                type="checkbox"
                checked={placeInStorePool}
                onChange={(e) => setPlaceInStorePool(e.target.checked)}
              />
              <span>
                {t(
                  'Keep in Central Store Pool for now (assign to an operator later)',
                  'প্রাথমিকভাবে কেন্দ্রীয় স্টোর পুলে রাখুন (পরবর্তীতে কর্মীকে বরাদ্দ দেওয়ার জন্য)',
                  lang
                )}
              </span>
            </label>

            <div className="eam-form-section-title">
              2. {t('Purchase Cost, Scrap Value & Yearly Depreciation', 'মূল্যায়ন ও অবচয় নীতি', lang)}
            </div>

            <div className="eam-form-grid-2">
              <div className="eam-field">
                <label className="eam-label">{t('Purchase Cost (BDT ৳)', 'ক্রয়মূল্য (টাকা)', lang)}</label>
                <input type="number" className="eam-input" value={purchaseCost} onChange={(e) => setPurchaseCost(e.target.value)} />
              </div>
              <div className="eam-field">
                <label className="eam-label">{t('Expected Scrap / Resale Value (BDT ৳)', 'অবশিষ্ট মূল্য (টাকা)', lang)}</label>
                <input type="number" className="eam-input" value={salvageValue} onChange={(e) => setSalvageValue(e.target.value)} />
              </div>
            </div>

            <div className="eam-form-grid-2">
              <div className="eam-field">
                <label className="eam-label">{t('Expected Lifespan (Years)', 'আয়ুষ্কাল (বছর)', lang)}</label>
                <input type="number" className="eam-input" value={usefulLifeYears} onChange={(e) => setUsefulLifeYears(e.target.value)} />
              </div>
              <div className="eam-field">
                <label className="eam-label">{t('Depreciation Method', 'অবচয় পদ্ধতি', lang)}</label>
                <select className="eam-select" value={depMethod} onChange={(e) => setDepMethod(e.target.value as DepreciationMethod)}>
                  <option value="SLM">{t('Equal amount each year (Straight-Line)', 'প্রতি বছর সমান হারে (SLM)', lang)}</option>
                  <option value="WDV">{t('Higher in early years (Declining Balance)', 'প্রথম দিকে বেশি হারে (WDV)', lang)}</option>
                  <option value="UOP">{t('Based on running hours (Usage)', 'ব্যবহারের ঘণ্টার ওপর ভিত্তি করে (UoP)', lang)}</option>
                </select>
              </div>
            </div>

            {/* Live Calculated Depreciation Preview */}
            <div className="eam-live-calc-box">
              <div>
                <span style={{ color: 'var(--brand-slate-500)' }}>{t('Depreciable Value:', 'অবচয়যোগ্য ভিত্তি:', lang)}</span>{' '}
                <strong>৳{livePreview.depBase.toLocaleString('en-IN')}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--brand-slate-500)' }}>{t('Yearly Drop:', 'বার্ষিক অবচয়:', lang)}</span>{' '}
                <strong style={{ color: 'var(--brand-crimson)' }}>৳{livePreview.annual.toLocaleString('en-IN')}/yr</strong>
              </div>
              <div>
                <span style={{ color: 'var(--brand-slate-500)' }}>{t('Monthly Drop:', 'মাসিক চার্জ:', lang)}</span>{' '}
                <strong style={{ color: 'var(--status-success)' }}>৳{livePreview.monthly.toLocaleString('en-IN')}/mo</strong>
              </div>
            </div>

            <div className="eam-form-section-title">
              3. {t('Manufacturer, Warranty & Inspection Schedule', 'প্রস্তুতকারক, ওয়ারেন্টি ও পরিদর্শন সময়সূচী', lang)}
            </div>

            <div className="eam-form-grid-3">
              <div className="eam-field">
                <label className="eam-label">{t('OEM Manufacturer', 'প্রস্তুতকারক', lang)}</label>
                <input type="text" className="eam-input" value={oem} onChange={(e) => setOem(e.target.value)} />
              </div>
              <div className="eam-field">
                <label className="eam-label">{t('Model No.', 'মডেল নম্বর', lang)}</label>
                <input type="text" className="eam-input" value={modelNo} onChange={(e) => setModelNo(e.target.value)} />
              </div>
              <div className="eam-field">
                <label className="eam-label">{t('Serial No.', 'সিরিয়াল নম্বর', lang)}</label>
                <input type="text" className="eam-input" value={serialNo} onChange={(e) => setSerialNo(e.target.value)} />
              </div>
            </div>

            <div className="eam-form-grid-3">
              <div className="eam-field">
                <label className="eam-label">{t('Calibration Cycle (Days)', 'ক্যালিব্রেশন চক্র (দিন)', lang)}</label>
                <input type="number" className="eam-input" value={calDays} onChange={(e) => setCalDays(e.target.value)} />
              </div>
              <div className="eam-field">
                <label className="eam-label">{t('OEM Warranty (Months)', 'ওয়ারেন্টি মেয়াদ (মাস)', lang)}</label>
                <input type="number" className="eam-input" value={warrantyMonths} onChange={(e) => setWarrantyMonths(e.target.value)} />
              </div>
              <div className="eam-field">
                <label className="eam-label">{t('Regulatory Body', 'নিয়ন্ত্রক সংস্থা', lang)}</label>
                <select className="eam-select" value={regAuthority} onChange={(e) => setRegAuthority(e.target.value as AssetRecord['regulatoryAuthority'])}>
                  <option value="ASME / API-510">ASME / API-510</option>
                  <option value="Dept. of Explosives (DoE)">Dept. of Explosives (DoE)</option>
                  <option value="BSTI">BSTI Metrology</option>
                  <option value="BRTA">BRTA Heavy Fleet</option>
                  <option value="ISO-17025">ISO-17025 Lab</option>
                  <option value="Corporate IT">Corporate IT MDM</option>
                </select>
              </div>
            </div>

            <div className="eam-field" style={{ marginBottom: 0 }}>
              <label className="eam-label">{t('Technical Operating Specifications', 'প্রযুক্তিগত বৈশিষ্ট্য', lang)}</label>
              <textarea className="eam-textarea" rows={2} value={specs} onChange={(e) => setSpecs(e.target.value)} />
            </div>
          </div>

          <div className="eam-modal-ft">
            <button type="button" className="btn-outline" onClick={onClose}>{t('Cancel', 'বাতিল', lang)}</button>
            <button type="submit" className="btn-primary">
              <CheckCircle size={15} /> {t('Register Asset & Generate QR Tag', 'সম্পদ নিবন্ধন ও ট্যাগ তৈরি করুন', lang)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   2. CUSTODY & INTER-SITE TRANSFER MODAL
   ══════════════════════════════════════════════════════════════════════════ */
export function TransferAssetModal({
  asset,
  isOpen,
  onClose,
  onConfirm,
  role,
  lang,
}: {
  asset: AssetRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (params: {
    assetId: string;
    toFacility: AssetFacility;
    toLocation: string;
    toCustodian: string;
    toCustodianEmpId?: string;
    toDepartment: string;
    reason: string;
    actorName: string;
    actorRole: string;
  }) => void;
  role: AppRole;
  lang: Lang;
}) {
  const { activeEmployees } = useEmployeeStore();
  const [toFacility, setToFacility] = useState<AssetFacility>('Keraniganj Bitumen Refinery');
  const [toLocation, setToLocation] = useState('Unit-2 Operational Deployment');
  const [toEmpId, setToEmpId] = useState('EMP-1042');
  const [reason, setReason] = useState('Operational reallocation & custodian handover under official material gate pass.');

  useEffect(() => {
    if (asset) {
      setToFacility(asset.facility);
      setToLocation(asset.functionalLocation);
    }
  }, [asset]);

  if (!isOpen || !asset) return null;
  const targetEmp = activeEmployees.find((e) => e.id === toEmpId) || activeEmployees[0];
  const actor = ROLE_META[role];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({
      assetId: asset.id,
      toFacility,
      toLocation,
      toCustodian: targetEmp.name,
      toCustodianEmpId: targetEmp.id,
      toDepartment: targetEmp.dept,
      reason,
      actorName: actor.name,
      actorRole: actor.label,
    });
    onClose();
  };

  return (
    <div className="eam-modal-overlay" onClick={onClose}>
      <div className="eam-modal" onClick={(e) => e.stopPropagation()}>
        <div className="eam-modal-hd">
          <div className="eam-modal-hd-left">
            <div className="eam-modal-icon">
              <ArrowRightLeft size={18} />
            </div>
            <div>
              <h3 className="eam-modal-title">{t('Transfer Equipment & Issue Gate Pass', 'সম্পদ হস্তান্তর ও গেট পাস ইস্যু', lang)}</h3>
              <div className="eam-modal-subtitle">{asset.name}</div>
            </div>
          </div>
          <button type="button" className="eam-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="eam-modal-body">
            <div className="eam-spec-box" style={{ marginBottom: '14px' }}>
              <div className="eam-spec-lbl">{t('Current Operator & Site', 'বর্তমান হেফাজতকারী ও অবস্থান', lang)}</div>
              <div className="eam-spec-val">{asset.custodian} ({asset.department})</div>
              <div className="eam-spec-sub">{asset.facility} — {asset.functionalLocation}</div>
            </div>

            <div className="eam-preset-bar">
              <div className="eam-preset-lbl">
                <span>{t('Fill with a common handover reason', 'স্থানান্তরের ধরন নির্বাচন করুন', lang)}</span>
              </div>
              <select
                className="eam-select"
                value=""
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === 'store') {
                    setToLocation('Active Field / Operational Bay');
                    setReason('Deployed from Central Store Pool to active custodian duty with signed handover.');
                  } else if (v === 'sites') {
                    setToFacility('Chattogram Patenga Terminal');
                    setToLocation('Marine Terminal Jetty-2 Dispatch');
                    setReason('Inter-site operational transfer under Security Material Gate Pass.');
                  } else if (v === 'operator') {
                    setReason('Departmental custodian reassignment following role rotation.');
                  }
                }}
              >
                <option value="">{t('Choose a handover type…', 'হস্তান্তরের ধরন বেছে নিন…', lang)}</option>
                <option value="store">{t('From Store Pool', 'স্টোর পুল থেকে বরাদ্দ', lang)}</option>
                <option value="sites">{t('Between Sites (Gate Pass)', 'অন্য স্থাপনায় স্থানান্তর', lang)}</option>
                <option value="operator">{t('Change Operator', 'কর্মকর্তা পরিবর্তন', lang)}</option>
              </select>
            </div>

            <div className="eam-field">
              <label className="eam-label">{t('New Receiving Operator', 'নতুন গ্রহণকারী কর্মকর্তা', lang)} *</label>
              <select className="eam-select" value={toEmpId} onChange={(e) => setToEmpId(e.target.value)}>
                {activeEmployees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} — {emp.designation} ({emp.dept})
                  </option>
                ))}
              </select>
            </div>

            <div className="eam-form-grid-2">
              <div className="eam-field">
                <label className="eam-label">{t('Destination Site', 'গন্তব্য স্থাপনা', lang)}</label>
                <select className="eam-select" value={toFacility} onChange={(e) => setToFacility(e.target.value as AssetFacility)}>
                  <option value="Keraniganj Bitumen Refinery">Keraniganj Bitumen Refinery</option>
                  <option value="Bashundhara Corporate HQ, Baridhara">Bashundhara Corporate HQ, Baridhara</option>
                  <option value="Chattogram Patenga Terminal">Chattogram Patenga Terminal</option>
                </select>
              </div>
              <div className="eam-field">
                <label className="eam-label">{t('Destination Unit or Desk', 'গন্তব্য ইউনিট / ডেস্ক', lang)} *</label>
                <input type="text" className="eam-input" value={toLocation} onChange={(e) => setToLocation(e.target.value)} required />
              </div>
            </div>

            <div className="eam-field" style={{ marginBottom: 0 }}>
              <label className="eam-label">{t('Why is this equipment moving?', 'স্থানান্তরের কারণ ও নির্দেশনা', lang)} *</label>
              <textarea className="eam-textarea" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} required />
            </div>
          </div>

          <div className="eam-modal-ft">
            <button type="button" className="btn-outline" onClick={onClose}>{t('Cancel', 'বাতিল', lang)}</button>
            <button type="submit" className="btn-primary">
              <ArrowRightLeft size={15} /> {t('Issue Gate Pass & Start Handover', 'গেট পাস ইস্যু ও স্থানান্তর শুরু করুন', lang)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   3. CREATE MAINTENANCE / CALIBRATION WORK ORDER MODAL
   ══════════════════════════════════════════════════════════════════════════ */
export function CreateWorkOrderModal({
  assets,
  defaultAssetId,
  isOpen,
  onClose,
  onCreate,
  role,
  lang,
}: {
  assets: AssetRecord[];
  defaultAssetId?: string;
  isOpen: boolean;
  onClose: () => void;
  onCreate: (params: {
    assetId: string;
    type: AssetWorkOrder['type'];
    priority: AssetWorkOrder['priority'];
    title: string;
    assignedEngineer: string;
    lotoPermitRef?: string;
    regulatoryBody?: string;
    estimatedCostBdt: number;
    isCapexOverhaul: boolean;
    dueDate: string;
    remarks: string;
    actorName: string;
    actorRole: string;
  }) => void;
  role: AppRole;
  lang: Lang;
}) {
  const activeAssets = assets.filter((a) => a.lifecycleStage !== 'disposed' && a.lifecycleStage !== 'decommissioned');
  const [assetId, setAssetId] = useState(defaultAssetId || activeAssets[0]?.id || '');
  const [type, setType] = useState<AssetWorkOrder['type']>('CAL');
  const [priority, setPriority] = useState<AssetWorkOrder['priority']>('high');
  const [title, setTitle] = useState('Statutory Ultrasonic Thickness NDT & Safety Valve Calibration');
  const [assignedEngineer, setAssignedEngineer] = useState('Engr. Tariqul Islam & Authorized OEM Team');
  const [lotoPermitRef, setLotoPermitRef] = useState('LOTO-2026-135');
  const [regulatoryBody, setRegulatoryBody] = useState('BSTI / Dept. of Explosives (DoE)');
  const [cost, setCost] = useState('85000');
  const [isCapexOverhaul, setIsCapexOverhaul] = useState(false);
  const [dueDate, setDueDate] = useState('15 Nov 2026');
  const [remarks, setRemarks] = useState('Execute 14-point reliability & calibration checklist under OSHA LOTO energy isolation.');

  useEffect(() => {
    if (defaultAssetId) setAssetId(defaultAssetId);
  }, [defaultAssetId]);

  if (!isOpen) return null;
  const chosenAsset = activeAssets.find((a) => a.id === assetId) || activeAssets[0];
  const actor = ROLE_META[role];
  const autoWarrantyFree = Boolean(chosenAsset?.isUnderWarranty && type === 'CM' && !isCapexOverhaul);

  const applyWoPreset = (p: 'cal' | 'pm' | 'cm' | 'capex') => {
    if (p === 'cal') {
      setType('CAL');
      setPriority('critical');
      setTitle('Statutory BSTI / DoE Metrology & Pressure Relief Calibration');
      setRegulatoryBody(chosenAsset?.regulatoryAuthority || 'BSTI / Dept. of Explosives (DoE)');
      setCost('65000');
      setIsCapexOverhaul(false);
      setRemarks('Mandatory statutory accuracy & safety interlock certification with traceable reference standard.');
    } else if (p === 'pm') {
      setType('PM');
      setPriority('routine');
      setTitle('500-Hour Preventive Mechanical Seal, Bearing & Lubrication Service');
      setRegulatoryBody('');
      setCost('42000');
      setIsCapexOverhaul(false);
      setRemarks('Replace Viton seals, flush thermal lubrication circuit, and verify vibration baseline.');
    } else if (p === 'cm') {
      setType('CM');
      setPriority('high');
      setTitle('Corrective Fault Diagnostics & Sub-Assembly Replacement');
      setRegulatoryBody('');
      setCost('95000');
      setIsCapexOverhaul(false);
      setRemarks('Isolate fault, replace defective module, and perform full load re-commissioning.');
    } else if (p === 'capex') {
      setType('PM');
      setPriority('high');
      setTitle('Major Life-Extending Rotor/Core Rebuild & Control Upgrade (IAS 16)');
      setRegulatoryBody('ASME / API-510');
      setCost('650000');
      setIsCapexOverhaul(true);
      setRemarks('Value-adding major overhaul extending remaining economic life by +2 years under IAS 16.14.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chosenAsset) return;
    onCreate({
      assetId: chosenAsset.id,
      type,
      priority,
      title,
      assignedEngineer,
      lotoPermitRef: lotoPermitRef.trim() || undefined,
      regulatoryBody: regulatoryBody.trim() || undefined,
      estimatedCostBdt: autoWarrantyFree ? 0 : Number(cost) || 0,
      isCapexOverhaul,
      dueDate,
      remarks,
      actorName: actor.name,
      actorRole: actor.label,
    });
    onClose();
  };

  return (
    <div className="eam-modal-overlay" onClick={onClose}>
      <div className="eam-modal lg" onClick={(e) => e.stopPropagation()}>
        <div className="eam-modal-hd">
          <div className="eam-modal-hd-left">
            <div className="eam-modal-icon">
              <Wrench size={18} />
            </div>
            <div>
              <h3 className="eam-modal-title">{t('Create Servicing or Repair Work Order', 'রক্ষণাবেক্ষণ ও ক্যালিব্রেশন কার্যাদেশ তৈরি', lang)}</h3>
              <div className="eam-modal-subtitle">{t('Schedule servicing, safety calibration, or breakdown repair for a machine.', 'যন্ত্রের সার্ভিসিং, ক্যালিব্রেশন বা মেরামতের কাজের আদেশ দিন।', lang)}</div>
            </div>
          </div>
          <button type="button" className="eam-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="eam-modal-body">
            <div className="eam-preset-bar">
              <div className="eam-preset-lbl">
                <span>{t('Fill with a common work order', 'দ্রুত কার্যাদেশ টেমপ্লেট', lang)}</span>
              </div>
              <select
                className="eam-select"
                value=""
                onChange={(e) => {
                  if (e.target.value) applyWoPreset(e.target.value as 'cal' | 'pm' | 'cm' | 'capex');
                }}
              >
                <option value="">{t('Choose a work-order example…', 'কার্যাদেশের উদাহরণ বেছে নিন…', lang)}</option>
                <option value="cal">{t('Safety Calibration', 'নিরাপত্তা ক্যালিব্রেশন', lang)}</option>
                <option value="pm">{t('Scheduled Service', 'নিয়মিত সার্ভিস', lang)}</option>
                <option value="cm">{t('Breakdown Repair', 'ব্রেকডাউন মেরামত', lang)}</option>
                <option value="capex">{t('Major Overhaul', 'বৃহৎ ওভারহল', lang)}</option>
              </select>
            </div>

            <div className="eam-field">
              <label className="eam-label">{t('Machine / Equipment', 'লক্ষ্যকৃত সম্পদ', lang)} *</label>
              <select className="eam-select" value={chosenAsset?.id || ''} onChange={(e) => setAssetId(e.target.value)}>
                {activeAssets.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.facility})
                  </option>
                ))}
              </select>
            </div>

            {chosenAsset?.isUnderWarranty && (
              <div
                style={{
                  marginBottom: '12px',
                  padding: '9px 12px',
                  background: 'rgba(5, 150, 105, 0.1)',
                  border: '1px solid rgba(5, 150, 105, 0.3)',
                  borderRadius: '8px',
                  fontSize: '11.5px',
                  color: 'var(--status-success)',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                }}
              >
                <ShieldCheck size={15} style={{ flexShrink: 0 }} />
                <span>
                  {t(
                    `Active OEM Warranty valid until ${chosenAsset.warrantyExpiry}! Corrective Breakdown (CM) repairs automatically claim ৳0 OEM coverage.`,
                    `এই সম্পদের ওয়ারেন্টি ${chosenAsset.warrantyExpiry} পর্যন্ত সক্রিয়! ব্রেকডাউন মেরামতে (CM) কোনো খরচ প্রযোজ্য হবে না।`,
                    lang
                  )}
                </span>
              </div>
            )}

            <div className="eam-form-grid-2">
              <div className="eam-field">
                <label className="eam-label">{t('Work Order Classification', 'কার্যাদেশের ধরন', lang)}</label>
                <select className="eam-select" value={type} onChange={(e) => setType(e.target.value as AssetWorkOrder['type'])}>
                  <option value="CAL">CAL — Statutory Calibration / NDT</option>
                  <option value="PM">PM — Scheduled Preventive Maintenance</option>
                  <option value="CBM">CbM — Predictive / Condition-Based</option>
                  <option value="CM">CM — Corrective / Breakdown Repair</option>
                </select>
              </div>
              <div className="eam-field">
                <label className="eam-label">{t('Urgency / Priority', 'অগ্রাধিকার', lang)}</label>
                <select className="eam-select" value={priority} onChange={(e) => setPriority(e.target.value as AssetWorkOrder['priority'])}>
                  <option value="critical">Critical — Safety / Statutory Mandatory</option>
                  <option value="high">High — Operational Throughput</option>
                  <option value="routine">Routine — Scheduled Window</option>
                </select>
              </div>
            </div>

            <div className="eam-field">
              <label className="eam-label">{t('Work Order Scope Title', 'কাজের শিরোনাম', lang)} *</label>
              <input type="text" className="eam-input" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>

            <div className="eam-form-grid-2">
              <div className="eam-field">
                <label className="eam-label">{t('Assigned Engineer / Certified Vendor', 'দায়িত্বপ্রাপ্ত প্রকৌশলী / ভেন্ডর', lang)}</label>
                <input type="text" className="eam-input" value={assignedEngineer} onChange={(e) => setAssignedEngineer(e.target.value)} required />
              </div>
              <div className="eam-field">
                <label className="eam-label">{t('Target Completion Due Date', 'সম্পন্নের সময়সীমা', lang)}</label>
                <input type="text" className="eam-input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
              </div>
            </div>

            <div className="eam-form-grid-3">
              <div className="eam-field">
                <label className="eam-label">{t('LOTO Safety Permit Ref', 'এলওটিও পারমিট', lang)}</label>
                <input type="text" className="eam-input" value={lotoPermitRef} onChange={(e) => setLotoPermitRef(e.target.value)} placeholder="Optional for IT" />
              </div>
              <div className="eam-field">
                <label className="eam-label">{t('Regulatory Authority', 'নিয়ন্ত্রক সংস্থা', lang)}</label>
                <input type="text" className="eam-input" value={regulatoryBody} onChange={(e) => setRegulatoryBody(e.target.value)} placeholder="BSTI / DoE / ASME" />
              </div>
              <div className="eam-field">
                <label className="eam-label">{t('Estimated Cost (BDT ৳)', 'প্রাক্কলিত ব্যয় (টাকা)', lang)}</label>
                <input
                  type="number"
                  className="eam-input"
                  value={autoWarrantyFree ? '0' : cost}
                  disabled={autoWarrantyFree}
                  onChange={(e) => setCost(e.target.value)}
                />
              </div>
            </div>

            <label className="eam-checkbox-card">
              <input
                type="checkbox"
                checked={isCapexOverhaul}
                onChange={(e) => setIsCapexOverhaul(e.target.checked)}
              />
              <span>
                {t(
                  'Capitalize as Major Value-Adding Overhaul (IAS 16.14: Adds to Gross Book Value & extends Useful Life +2 yrs instead of OPEX)',
                  'বৃহৎ ওভারহল হিসেবে মূলধনে যোগ করুন (IAS 16: বইমূল্য বৃদ্ধি ও আয়ুষ্কাল +২ বছর বর্ধিত হবে)',
                  lang
                )}
              </span>
            </label>

            <div className="eam-field" style={{ marginBottom: 0 }}>
              <label className="eam-label">{t('Technical Instructions & Test Protocol', 'কারিগরি নির্দেশনা', lang)}</label>
              <textarea className="eam-textarea" rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
            </div>
          </div>

          <div className="eam-modal-ft">
            <button type="button" className="btn-outline" onClick={onClose}>{t('Cancel', 'বাতিল', lang)}</button>
            <button type="submit" className="btn-primary">
              <Wrench size={15} /> {t('Issue Work Order', 'কার্যাদেশ জারি করুন', lang)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   4. SUBMIT NEW ASSET / REPLACEMENT REQUISITION MODAL (Stage 1 Birth)
   ══════════════════════════════════════════════════════════════════════════ */
export function SubmitAssetRequisitionModal({
  isOpen,
  onClose,
  onSubmitReq,
  role,
  lang,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmitReq: (params: {
    title: string;
    category: AssetCategory;
    criticality: AssetCriticality;
    facility: AssetFacility;
    department: string;
    requestedBy: string;
    requestedByEmpId?: string;
    estimatedCapexBdt: number;
    justification: string;
    specs: string;
    urgency: 'critical' | 'high' | 'normal';
  }) => void;
  role: AppRole;
  lang: Lang;
}) {
  const isStaff = role === 'employee';
  const [title, setTitle] = useState(
    isStaff ? 'Dell Latitude 7440 Rugged Field Laptop Upgrade' : 'Fluke Ti480 PRO Infrared Thermal Imaging Camera'
  );
  const [category, setCategory] = useState<AssetCategory>(isStaff ? 'it' : 'safety');
  const [criticality, setCriticality] = useState<AssetCriticality>(isStaff ? 'general_c' : 'essential_b');
  const [facility, setFacility] = useState<AssetFacility>(
    isStaff ? 'Bashundhara Corporate HQ, Baridhara' : 'Keraniganj Bitumen Refinery'
  );
  const [cost, setCost] = useState(isStaff ? '185000' : '920000');
  const [urgency, setUrgency] = useState<'critical' | 'high' | 'normal'>('high');
  const [specs, setSpecs] = useState(
    isStaff
      ? 'Intel Core i7, 32GB RAM, LTE SIM Slot for nationwide bitumen distributor ERP order sync'
      : '640x480 Thermal Resolution, -20°C to +1000°C range for hot bitumen pipeline & switchgear thermography'
  );
  const [justification, setJustification] = useState(
    isStaff
      ? 'Required for multi-district bitumen dealer credit reconciliation and mobile ERP order entry.'
      : 'Preventive refractory & electrical hotspot diagnostics across Keraniganj Distillation Unit 1 & 2.'
  );

  if (!isOpen) return null;
  const meta = ROLE_META[role];

  const applyReqPreset = (p: 'laptop' | 'thermal' | 'lab' | 'pump') => {
    if (p === 'laptop') {
      setTitle('Dell Latitude 7440 Enterprise Field Laptop');
      setCategory('it');
      setCriticality('general_c');
      setFacility('Bashundhara Corporate HQ, Baridhara');
      setCost('185000');
      setUrgency('normal');
      setSpecs('Core i7 vPro, 32GB RAM, 1TB NVMe, 5G LTE Module & Hardware TPM');
      setJustification('Required for field order & distributor reconciliation.');
    } else if (p === 'thermal') {
      setTitle('Fluke Ti480 PRO Infrared Thermography Camera');
      setCategory('safety');
      setCriticality('essential_b');
      setFacility('Keraniganj Bitumen Refinery');
      setCost('920000');
      setUrgency('high');
      setSpecs('640x480 IR Sensor, up to 1000°C range for hot bitumen line & HV switchgear scans');
      setJustification('Early detection of insulation breakdown and switchgear hotspots across Units 1 & 2.');
    } else if (p === 'lab') {
      setTitle('Automated Digital Bitumen Penetrometer (ASTM D5)');
      setCategory('lab');
      setCriticality('essential_b');
      setFacility('Keraniganj Bitumen Refinery');
      setCost('740000');
      setUrgency('high');
      setSpecs('0.01mm Optical Laser Resolution, Peltier 25°C Water Bath & LIMS Auto-Sync');
      setJustification('Eliminate manual penetration test bottlenecks for 60/70 & 80/100 grade batch release.');
    } else if (p === 'pump') {
      setTitle('Standby Thermal Oil Circulation Pump Skid');
      setCategory('plant');
      setCriticality('critical_a');
      setFacility('Chattogram Patenga Terminal');
      setCost('3200000');
      setUrgency('critical');
      setSpecs('300°C Thermal Oil Rated, 55kW ATEX Ex-d Motor with Mechanical Double Seal');
      setJustification('N+1 redundancy for marine terminal heated bitumen storage tank farm.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitReq({
      title,
      category,
      criticality,
      facility,
      department: meta.dept,
      requestedBy: meta.name,
      requestedByEmpId: meta.empId,
      estimatedCapexBdt: Number(cost) || 100000,
      justification,
      specs,
      urgency,
    });
    onClose();
  };

  return (
    <div className="eam-modal-overlay" onClick={onClose}>
      <div className="eam-modal" onClick={(e) => e.stopPropagation()}>
        <div className="eam-modal-hd crimson">
          <div className="eam-modal-hd-left">
            <div className="eam-modal-icon">
              <FilePlus size={18} />
            </div>
            <div>
              <h3 className="eam-modal-title">{t('Request New or Replacement Equipment', 'নতুন সম্পদ বা প্রতিস্থাপন রিকুইজিশন', lang)}</h3>
              <div className="eam-modal-subtitle">
                {t(
                  'Ask to buy new or replacement equipment. Department head and leadership approve based on cost.',
                  'নতুন বা প্রতিস্থাপন সরঞ্জাম কেনার আবেদন। খরচের পরিমাণের ওপর ভিত্তি করে অনুমোদন হবে।',
                  lang
                )}
              </div>
            </div>
          </div>
          <button type="button" className="eam-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="eam-modal-body">
            <div className="eam-preset-bar">
              <div className="eam-preset-lbl">
                <span>{t('Fill with an example', 'দ্রুত রিকুইজিশন টেমপ্লেট', lang)}</span>
              </div>
              <select
                className="eam-select"
                value=""
                onChange={(e) => {
                  if (e.target.value) applyReqPreset(e.target.value as 'laptop' | 'thermal' | 'lab' | 'pump');
                }}
              >
                <option value="">{t('Choose an example…', 'একটি উদাহরণ বেছে নিন…', lang)}</option>
                <option value="laptop">{t('Field Laptop', 'ফিল্ড ল্যাপটপ', lang)}</option>
                <option value="thermal">{t('Thermal IR Camera', 'থার্মাল ক্যামেরা', lang)}</option>
                <option value="lab">{t('Digital Penetrometer', 'ডিজিটাল পেনেট্রোমিটার', lang)}</option>
                <option value="pump">{t('Standby Pump Skid', 'স্ট্যান্ডবাই পাম্প স্কিড', lang)}</option>
              </select>
            </div>

            <div className="eam-field">
              <label className="eam-label">{t('Equipment Needed', 'প্রয়োজনীয় সরঞ্জামের নাম', lang)} *</label>
              <input type="text" className="eam-input" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>

            <div className="eam-form-grid-2">
              <div className="eam-field">
                <label className="eam-label">{t('Category', 'সম্পদ শ্রেণী', lang)}</label>
                <select className="eam-select" value={category} onChange={(e) => setCategory(e.target.value as AssetCategory)}>
                  <option value="it">{t('IT, Computers & Control', 'আইটি, কম্পিউটার ও কন্ট্রোল', lang)}</option>
                  <option value="plant">{t('Refinery Plant Machinery', 'রিফাইনারি প্ল্যান্ট যন্ত্রপাতি', lang)}</option>
                  <option value="vehicle">{t('Vehicles & Tankers', 'যানবাহন ও ট্যাংকার', lang)}</option>
                  <option value="safety">{t('Safety & Gas Detection', 'নিরাপত্তা ও গ্যাস শনাক্তকরণ', lang)}</option>
                  <option value="lab">{t('Quality Control Lab', 'মান নিয়ন্ত্রণ ল্যাব', lang)}</option>
                  <option value="corporate">{t('Office & Building', 'অফিস ও ভবন', lang)}</option>
                </select>
              </div>
              <div className="eam-field">
                <label className="eam-label">{t('Site Where Needed', 'ব্যবহারের স্থাপনা', lang)}</label>
                <select className="eam-select" value={facility} onChange={(e) => setFacility(e.target.value as AssetFacility)}>
                  <option value="Bashundhara Corporate HQ, Baridhara">Bashundhara Corporate HQ, Baridhara</option>
                  <option value="Keraniganj Bitumen Refinery">Keraniganj Bitumen Refinery</option>
                  <option value="Chattogram Patenga Terminal">Chattogram Patenga Terminal</option>
                </select>
              </div>
            </div>

            <div className="eam-form-grid-2">
              <div className="eam-field">
                <label className="eam-label">
                  {t('Estimated Cost (BDT ৳)', 'আনুমানিক মূল্য (টাকা)', lang)} *{' '}
                  {Number(cost) > 0 && (
                    <span style={{ color: 'var(--brand-crimson)', fontWeight: 800 }}>
                      (৳{(Number(cost) || 0).toLocaleString('en-IN')})
                    </span>
                  )}
                </label>
                <input type="number" className="eam-input" value={cost} onChange={(e) => setCost(e.target.value)} required />
              </div>
              <div className="eam-field">
                <label className="eam-label">{t('Urgency', 'জরুরিতা', lang)}</label>
                <select className="eam-select" value={urgency} onChange={(e) => setUrgency(e.target.value as 'critical' | 'high' | 'normal')}>
                  <option value="normal">{t('Normal — Planned purchase', 'স্বাভাবিক — পরিকল্পিত ক্রয়', lang)}</option>
                  <option value="high">{t('High — Slowing down work', 'উচ্চ — কাজে বিঘ্ন ঘটছে', lang)}</option>
                  <option value="critical">{t('Critical — Safety or breakdown replacement', 'জরুরি — নিরাপত্তা বা ব্রেকডাউন প্রতিস্থাপন', lang)}</option>
                </select>
              </div>
            </div>

            <div className="eam-field">
              <label className="eam-label">{t('Key Specifications Needed', 'প্রযুক্তিগত স্পেসিফিকেশন', lang)} *</label>
              <input type="text" className="eam-input" value={specs} onChange={(e) => setSpecs(e.target.value)} required />
            </div>

            <div className="eam-field">
              <label className="eam-label">{t('Why this equipment is needed', 'ব্যবসায়িক যৌক্তিকতা', lang)} *</label>
              <textarea className="eam-textarea" rows={2} value={justification} onChange={(e) => setJustification(e.target.value)} required />
            </div>

            <div className="eam-live-calc-box" style={{ marginBottom: 0 }}>
              <span>
                <strong>{t('What happens next:', 'পরবর্তী ধাপ:', lang)}</strong>{' '}
                {(Number(cost) || 0) >= 500000
                  ? t(
                      'Because the estimated cost is ৳5,00,000 or more, this request goes to your Department Head, Finance, and the Managing Director for approval.',
                      'প্রাক্কলিত ব্যয় ৳৫,০০,০০০ বা তার বেশি হওয়ায় এটি বিভাগীয় প্রধান, অর্থ বিভাগ এবং ব্যবস্থাপনা পরিচালকের অনুমোদনের জন্য যাবে।',
                      lang
                    )
                  : t(
                      'This request goes to your Department Head and Finance for approval before purchase.',
                      'ক্রয়ের আগে এটি আপনার বিভাগীয় প্রধান এবং অর্থ বিভাগের অনুমোদনের জন্য যাবে।',
                      lang
                    )}
              </span>
            </div>
          </div>

          <div className="eam-modal-ft">
            <button type="button" className="btn-outline" onClick={onClose}>{t('Cancel', 'বাতিল', lang)}</button>
            <button type="submit" className="btn-primary">
              <CheckCircle size={15} /> {t('Submit Request', 'রিকুইজিশন দাখিল করুন', lang)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   5. STAGE 7: INITIATE CONDEMNATION / DECOMMISSIONING SURVEY MODAL
   ══════════════════════════════════════════════════════════════════════════ */
export function InitiateDecommissionModal({
  asset,
  isOpen,
  onClose,
  onConfirm,
  role,
  lang,
}: {
  asset: AssetRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (assetId: string, reason: AssetDisposalDossier['reason'], notes: string, actorName: string, actorRole: string) => void;
  role: AppRole;
  lang: Lang;
}) {
  const [reason, setReason] = useState<AssetDisposalDossier['reason']>('Economic Life Exhausted');
  const [notes, setNotes] = useState(
    'Technical survey confirms cumulative maintenance OPEX and wear exceed economic repair threshold. Recommended for LOTO isolation, decontamination/data-wipe, and CFO/Chairman write-off.'
  );

  if (!isOpen || !asset) return null;
  const fin = calculateAssetFinancials(asset);
  const meta = ROLE_META[role];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(asset.id, reason, notes, meta.name, meta.label);
    onClose();
  };

  return (
    <div className="eam-modal-overlay" onClick={onClose}>
      <div className="eam-modal" onClick={(e) => e.stopPropagation()}>
        <div className="eam-modal-hd danger">
          <div className="eam-modal-hd-left">
            <div className="eam-modal-icon" style={{ color: 'var(--status-danger-bright)' }}>
              <ShieldAlert size={18} />
            </div>
            <div>
              <h3 className="eam-modal-title">{t('Retire Machine from Service', 'অকেজো ঘোষণা ও ডিকমিশনিং জরিপ শুরু', lang)}</h3>
              <div className="eam-modal-subtitle">{asset.name} • {t('Book Value:', 'বর্তমান মূল্য:', lang)} ৳{fin.netBookValue.toLocaleString('en-IN')}</div>
            </div>
          </div>
          <button type="button" className="eam-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="eam-modal-body">
            <div
              style={{
                padding: '11px 14px',
                background: 'rgba(220, 38, 38, 0.08)',
                border: '1px solid rgba(220, 38, 38, 0.25)',
                borderRadius: '9px',
                fontSize: '12px',
                marginBottom: '14px',
              }}
            >
              <div style={{ fontWeight: 800, color: 'var(--brand-slate-900)' }}>{asset.name}</div>
              <div style={{ marginTop: '4px', color: 'var(--brand-slate-600)' }}>
                {t('Age:', 'বয়স:')} <strong>{asset.ageYears} / {asset.usefulLifeYears} {t('yrs', 'বছর', lang)}</strong> · {t('Repairs vs Cost:', 'মেরামত ও মূল্যের অনুপাত:', lang)}{' '}
                <strong style={{ color: 'var(--status-danger)' }}>{fin.repairToCapexRatioPct}%</strong> · {t('Book Value:', 'বর্তমান মূল্য:', lang)}{' '}
                <strong>৳{fin.netBookValue.toLocaleString('en-IN')}</strong>
              </div>
            </div>

            <div className="eam-field">
              <label className="eam-label">{t('Main Reason for Retirement', 'ডিকমিশনিং-এর প্রধান কারণ', lang)}</label>
              <select
                className="eam-select"
                value={reason}
                onChange={(e) => setReason(e.target.value as AssetDisposalDossier['reason'])}
              >
                <option value="Economic Life Exhausted">{t('Lifespan reached / too costly to keep repairing', 'আয়ুষ্কাল শেষ / মেরামত ব্যয় বেশি', lang)}</option>
                <option value="Irreparable Breakdown">{t('Cannot be repaired after breakdown', 'মেরামত-অযোগ্য যান্ত্রিক ত্রুটি', lang)}</option>
                <option value="Technological Obsolescence">{t('Outdated technology', 'প্রযুক্তিগতভাবে পুরনো', lang)}</option>
                <option value="Regulatory / Safety Condemnation">{t('Failed safety or government inspection', 'নিরাপত্তা বা সরকারি পরিদর্শনে অকৃতকার্য', lang)}</option>
              </select>
            </div>

            <div className="eam-field" style={{ marginBottom: 0 }}>
              <label className="eam-label">{t('Inspection Findings & Notes', 'কারিগরি জরিপ প্রতিবেদন', lang)} *</label>
              <textarea className="eam-textarea" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} required />
            </div>
          </div>

          <div className="eam-modal-ft">
            <button type="button" className="btn-outline" onClick={onClose}>{t('Cancel', 'বাতিল', lang)}</button>
            <button type="submit" className="btn-danger">
              <Archive size={15} /> {t('Retire Machine & Move to Scrap Queue', 'ডিকমিশন তালিকায় স্থানান্তর করুন', lang)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   6. STAGE 8: FINALIZE DISPOSAL, AUCTION PROCEEDS & SAP WRITE-OFF MODAL
   ══════════════════════════════════════════════════════════════════════════ */
export function FinalizeDisposalModal({
  asset,
  isOpen,
  onClose,
  onFinalize,
  role,
  lang,
}: {
  asset: AssetRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onFinalize: (params: {
    assetId: string;
    disposalMethod: NonNullable<AssetDisposalDossier['disposalMethod']>;
    buyerOrVendor: string;
    salvageProceedsBdt: number;
    actorName: string;
    actorRole: string;
  }) => void;
  role: AppRole;
  lang: Lang;
}) {
  const [method, setMethod] = useState<NonNullable<AssetDisposalDossier['disposalMethod']>>('Public Tender / Auction');
  const [buyer, setBuyer] = useState('M/S Bengal Industrial Auctioneers Ltd.');
  const [proceeds, setProceeds] = useState('850000');

  useEffect(() => {
    if (asset) {
      setProceeds(String(asset.salvageValue || 250000));
    }
  }, [asset]);

  if (!isOpen || !asset) return null;
  const fin = calculateAssetFinancials(asset);
  const proceedsNum = Number(proceeds) || 0;
  const gainOrLoss = proceedsNum - fin.netBookValue;
  const meta = ROLE_META[role];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFinalize({
      assetId: asset.id,
      disposalMethod: method,
      buyerOrVendor: buyer,
      salvageProceedsBdt: proceedsNum,
      actorName: meta.name,
      actorRole: meta.label,
    });
    onClose();
  };

  return (
    <div className="eam-modal-overlay" onClick={onClose}>
      <div className="eam-modal" onClick={(e) => e.stopPropagation()}>
        <div className="eam-modal-hd">
          <div className="eam-modal-hd-left">
            <div className="eam-modal-icon">
              <DollarSign size={18} />
            </div>
            <div>
              <h3 className="eam-modal-title">{t('Record Final Sale or Scrap', 'চূড়ান্ত অবলোপন, নিলাম ও আর্কাইভ অনুমোদন', lang)}</h3>
              <div className="eam-modal-subtitle">{asset.name}</div>
            </div>
          </div>
          <button type="button" className="eam-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="eam-modal-body">
            <div className="eam-field">
              <label className="eam-label">{t('How is it being disposed?', 'নিষ্পত্তি / বিক্রয়ের মাধ্যম', lang)}</label>
              <select
                className="eam-select"
                value={method}
                onChange={(e) => setMethod(e.target.value as NonNullable<AssetDisposalDossier['disposalMethod']>)}
              >
                <option value="Public Tender / Auction">{t('Public Tender / Auction', 'পাবলিক টেন্ডার / নিলাম', lang)}</option>
                <option value="OEM Trade-In">{t('Manufacturer Trade-In Credit', 'প্রস্তুতকারক ট্রেড-ইন ক্রেডিট', lang)}</option>
                <option value="Certified Scrap / E-Waste Recycling">{t('Certified Scrap / E-Waste Recycler', 'অনুমোদিত স্ক্র্যাপ / ই-ওয়েস্ট রিসাইক্লার', lang)}</option>
                <option value="Insurance Claim Write-Off">{t('Insurance Claim Settlement', 'বীমা দাবি নিষ্পত্তি', lang)}</option>
              </select>
            </div>

            <div className="eam-form-grid-2">
              <div className="eam-field">
                <label className="eam-label">{t('Buyer or Recycler Name', 'ক্রেতা বা রিসাইক্লিং প্রতিষ্ঠান', lang)} *</label>
                <input type="text" className="eam-input" value={buyer} onChange={(e) => setBuyer(e.target.value)} required />
              </div>
              <div className="eam-field">
                <label className="eam-label">{t('Sale / Scrap Proceeds (BDT ৳)', 'প্রাপ্ত নিলাম/স্ক্র্যাপ মূল্য (টাকা)', lang)} *</label>
                <input type="number" className="eam-input" value={proceeds} onChange={(e) => setProceeds(e.target.value)} required />
              </div>
            </div>

            {/* Live IAS 16 Gain/Loss Accounting Preview */}
            <div className="eam-spec-box" style={{ fontSize: '12px' }}>
              <div style={{ fontWeight: 800, marginBottom: '8px', color: 'var(--brand-slate-900)' }}>
                {t('Write-Off Summary', 'অবলোপন হিসাব প্রাকদর্শন', lang)}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span>{t('Total Purchase Cost:', 'মোট ক্রয়মূল্য:', lang)}</span>
                <strong>৳{fin.grossCapitalizedCost.toLocaleString('en-IN')}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span>{t('Depreciation Used:', 'পুঞ্জীভূত অবচয়:', lang)}</span>
                <strong>৳{fin.accumulatedDepreciation.toLocaleString('en-IN')}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>{t('Current Book Value:', 'বর্তমান বইমূল্য:', lang)}</span>
                <strong>৳{fin.netBookValue.toLocaleString('en-IN')}</strong>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: '8px',
                  borderTop: '1px dashed var(--brand-slate-300)',
                  fontSize: '13px',
                }}
              >
                <strong>{gainOrLoss >= 0 ? t('Net Gain on Sale:', 'বিক্রয়ে নিট লাভ:', lang) : t('Net Loss on Write-Off:', 'অবলোপনে নিট ক্ষতি:', lang)}</strong>
                <strong style={{ color: gainOrLoss >= 0 ? 'var(--status-success)' : 'var(--status-danger)' }}>
                  {gainOrLoss >= 0 ? `+৳${gainOrLoss.toLocaleString('en-IN')}` : `-৳${Math.abs(gainOrLoss).toLocaleString('en-IN')}`}
                </strong>
              </div>
            </div>
          </div>

          <div className="eam-modal-ft">
            <button type="button" className="btn-outline" onClick={onClose}>{t('Cancel', 'বাতিল', lang)}</button>
            <button type="submit" className="btn-gold" style={{ fontWeight: 800 }}>
              <CheckCircle size={15} /> {t('Approve Write-Off & Archive', 'অবলোপন অনুমোদন ও আর্কাইভ করুন', lang)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   7. IAS 16 MULTI-YEAR DEPRECIATION SCHEDULE MODAL
   ══════════════════════════════════════════════════════════════════════════ */
export function DepreciationScheduleModal({
  asset,
  isOpen,
  onClose,
  canEditPolicy,
  onChangeMethod,
  role,
  lang,
}: {
  asset: AssetRecord | null;
  isOpen: boolean;
  onClose: () => void;
  canEditPolicy: boolean;
  onChangeMethod: (assetId: string, method: DepreciationMethod, actorName: string, actorRole: string) => void;
  role: AppRole;
  lang: Lang;
}) {
  if (!isOpen || !asset) return null;
  const rows = buildDepreciationSchedule(asset);
  const fin = calculateAssetFinancials(asset);
  const meta = ROLE_META[role];

  const handleExportCsv = () => {
    const header = 'Year,Calendar_Year,Opening_NBV_BDT,Annual_Depreciation_BDT,Accumulated_Depreciation_BDT,Closing_NBV_BDT\n';
    const body = rows
      .map((r) => `${r.yearNumber},${r.calendarYear},${r.openingNbv},${r.annualCharge},${r.accumulatedDep},${r.closingNbv}`)
      .join('\n');
    const blob = new Blob([header + body], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${asset.tag}_IAS16_Depreciation_Schedule.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(t(`Exported IAS 16 schedule for ${asset.tag} (${asset.sapAssetNo}).`, 'অবচয় তফসিল ডাউনলোড সম্পন্ন হয়েছে।', lang), 'success');
  };

  return (
    <div className="eam-modal-overlay" onClick={onClose}>
      <div className="eam-modal lg" onClick={(e) => e.stopPropagation()}>
        <div className="eam-modal-hd">
          <div className="eam-modal-hd-left">
            <div className="eam-modal-icon" style={{ color: 'var(--status-success-bright)' }}>
              <DollarSign size={18} />
            </div>
            <div>
              <h3 className="eam-modal-title">{t('Yearly Value & Depreciation Schedule', 'স্থায়ী সম্পদ অবচয় তফসিল', lang)}</h3>
              <div className="eam-modal-subtitle">{asset.name} • {asset.facility}</div>
            </div>
          </div>
          <button type="button" className="eam-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="eam-modal-body">
          <div
            className="eam-spec-box"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              marginBottom: '14px',
            }}
          >
            <div style={{ fontSize: '12px', lineHeight: 1.55 }}>
              <div>
                <strong>{t('Purchase Cost:', 'ক্রয়মূল্য:', lang)}</strong> ৳{fin.grossCapitalizedCost.toLocaleString('en-IN')} ·{' '}
                <strong>{t('Expected Scrap Value:', 'অবশিষ্ট মূল্য:', lang)}</strong> ৳{asset.salvageValue.toLocaleString('en-IN')}
              </div>
              <div>
                <strong>{t('Current Book Value:', 'বর্তমান মূল্য:', lang)}</strong>{' '}
                <span style={{ color: 'var(--status-success)', fontWeight: 800 }}>৳{fin.netBookValue.toLocaleString('en-IN')}</span> ·{' '}
                <strong>{t('Lifetime Cost (Purchase + Repairs):', 'আজীবন মোট ব্যয়:', lang)}</strong> ৳{fin.totalCostOfOwnership.toLocaleString('en-IN')}
              </div>
            </div>

            {canEditPolicy && asset.lifecycleStage !== 'disposed' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800 }}>{t('Method:', 'পদ্ধতি:', lang)}</span>
                {(['SLM', 'WDV', 'UOP'] as DepreciationMethod[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={asset.depreciationMethod === m ? 'btn-primary' : 'btn-outline'}
                    style={{ padding: '5px 11px', fontSize: '11px' }}
                    onClick={() => {
                      onChangeMethod(asset.id, m, meta.name, meta.label);
                      showToast(t(`Updated ${asset.tag} depreciation policy to ${m}.`, `অবচয় পদ্ধতি ${m}-এ পরিবর্তিত হয়েছে।`, lang), 'gold');
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('Yr', 'বছর', lang)}</th>
                  <th>{t('Fiscal Year', 'অর্থবছর', lang)}</th>
                  <th>{t('Opening Value', 'প্রারম্ভিক মূল্য', lang)}</th>
                  <th>{t('Yearly Drop', 'বার্ষিক অবচয়', lang)}</th>
                  <th>{t('Total Depreciation', 'পুঞ্জীভূত অবচয়', lang)}</th>
                  <th>{t('Closing Value', 'সমাপনী মূল্য', lang)}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const isCurrentYear = r.calendarYear === 2026;
                  return (
                    <tr
                      key={r.yearNumber}
                      style={{
                        background: isCurrentYear ? 'rgba(165, 28, 48, 0.08)' : undefined,
                        fontWeight: isCurrentYear ? 700 : 400,
                      }}
                    >
                      <td>Yr {r.yearNumber}</td>
                      <td>
                        FY {r.calendarYear}{' '}
                        {isCurrentYear && <span className="badge info" style={{ fontSize: '9px' }}>{t('Current', 'চলমান', lang)}</span>}
                      </td>
                      <td>৳{r.openingNbv.toLocaleString('en-IN')}</td>
                      <td style={{ color: 'var(--status-danger)' }}>-৳{r.annualCharge.toLocaleString('en-IN')}</td>
                      <td>৳{r.accumulatedDep.toLocaleString('en-IN')}</td>
                      <td style={{ fontWeight: 700, color: 'var(--status-success)' }}>৳{r.closingNbv.toLocaleString('en-IN')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="eam-modal-ft">
          <button type="button" className="btn-outline" onClick={onClose}>{t('Close', 'বন্ধ করুন', lang)}</button>
          <button type="button" className="btn-primary" onClick={handleExportCsv}>
            <Download size={14} /> {t('Export Schedule (CSV)', 'সিএসভি ডাউনলোড করুন', lang)}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   8. DIGITAL METAL QR PASSPORT & LASER TAG SCANNER MODALS
   ══════════════════════════════════════════════════════════════════════════ */
export function AssetPassportModal({
  asset,
  isOpen,
  onClose,
  lang,
}: {
  asset: AssetRecord | null;
  isOpen: boolean;
  onClose: () => void;
  lang: Lang;
}) {
  if (!isOpen || !asset) return null;

  return (
    <div className="eam-modal-overlay" onClick={onClose}>
      <div className="eam-modal sm" onClick={(e) => e.stopPropagation()}>
        <div className="eam-modal-hd">
          <div className="eam-modal-hd-left">
            <div className="eam-modal-icon">
              <QrCode size={18} />
            </div>
            <div>
              <h3 className="eam-modal-title">
                {t('Metal QR Plate & Equipment Passport', 'ডিজিটাল সরঞ্জাম পাসপোর্ট ও মেটাল কিউআর ট্যাগ', lang)}
              </h3>
              <div className="eam-modal-subtitle">
                {asset.name}
              </div>
            </div>
          </div>
          <button type="button" className="eam-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="eam-modal-body">
          <div
            style={{
              background: 'linear-gradient(135deg, var(--surface-3) 0%, var(--surface-4) 50%, var(--surface-4) 100%)',
              padding: '18px',
              borderRadius: '10px',
              border: '2px solid var(--border-3)',
              boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.8), 0 4px 12px rgba(0,0,0,0.15)',
              color: 'var(--text-1)',
              fontFamily: 'monospace',
              marginBottom: '14px',
              position: 'relative',
            }}
          >
            <div style={{ position: 'absolute', top: '8px', left: '8px', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--surface-inverse-3)', border: '1px solid var(--border-inverse)' }} />
            <div style={{ position: 'absolute', top: '8px', right: '8px', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--surface-inverse-3)', border: '1px solid var(--border-inverse)' }} />
            <div style={{ position: 'absolute', bottom: '8px', left: '8px', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--surface-inverse-3)', border: '1px solid var(--border-inverse)' }} />
            <div style={{ position: 'absolute', bottom: '8px', right: '8px', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--surface-inverse-3)', border: '1px solid var(--border-inverse)' }} />

            <div style={{ textAlign: 'center', borderBottom: '1.5px solid var(--border-inverse-2)', paddingBottom: '8px', marginBottom: '12px' }}>
              <div style={{ fontWeight: 900, fontSize: '13px', letterSpacing: '1px', color: 'var(--brand-crimson-dark)' }}>
                BASHUNDHARA OIL & GAS CO. LTD.
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-2)', fontWeight: 700 }}>
                {asset.facility.toUpperCase()} • CAPITAL ASSET IDENTIFIER
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div
                style={{
                  width: '102px',
                  height: '102px',
                  background: 'var(--surface-1)',
                  borderRadius: '8px',
                  padding: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--border-strong)',
                  flexShrink: 0,
                }}
              >
                <QrCode size={76} color="var(--text-1)" />
                <span style={{ fontSize: '7px', fontWeight: 900, color: 'var(--text-1)' }}>{asset.tag}</span>
              </div>

              <div style={{ flex: 1, fontSize: '11px', lineHeight: 1.55 }}>
                <div><strong>TAG:</strong> <span style={{ color: 'var(--brand-crimson-dark)', fontWeight: 800 }}>{asset.tag}</span></div>
                <div><strong>Ledger no.:</strong> {asset.sapAssetNo} ({asset.glCostCenter})</div>
                <div><strong>SERIAL:</strong> {asset.serialNo}</div>
                <div><strong>CUSTODIAN:</strong> {asset.custodian}</div>
                <div><strong>COMMISSIONED:</strong> {asset.commissioningDate}</div>
                <div>
                  <strong>NEXT AUDIT:</strong>{' '}
                  <span style={{ color: asset.daysToService <= 15 ? 'var(--status-danger)' : 'var(--status-success)', fontWeight: 800 }}>
                    {asset.nextServiceDate}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px dashed var(--border-3)', fontSize: '10px', color: 'var(--text-1)' }}>
              OEM: {asset.oem} ({asset.modelNo}) • SPEC: {asset.specs}
            </div>
          </div>

          <div style={{ fontSize: '11.5px', color: 'var(--brand-slate-500)', lineHeight: 1.5 }}>
            <strong>{t('Field verification:', 'মাঠপর্যায়ে যাচাই:', lang)}</strong>{' '}
            {t(
              'Scanning this plate opens the full custody history, calibration certificates, and open repair orders.',
              'এই প্লেট স্ক্যান করলে পূর্ণ হস্তান্তর ইতিহাস, ক্যালিব্রেশন সনদ ও চলমান কাজের আদেশ দেখা যাবে।',
              lang
            )}
          </div>
        </div>

        <div className="eam-modal-ft">
          <button type="button" className="btn-outline" onClick={onClose}>{t('Close', 'বন্ধ করুন', lang)}</button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              showToast(t(`Laser QR etching job dispatched for ${asset.tag} (${asset.sapAssetNo}).`, 'লেজার ট্যাগ প্রিন্ট কমান্ড প্রেরিত হয়েছে।', lang), 'success');
              onClose();
            }}
          >
            <Printer size={15} /> {t('Print Metal QR Tag', 'ধাতব কিউআর ট্যাগ প্রিন্ট', lang)}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AssetScannerModal({
  assets,
  isOpen,
  onClose,
  onSelectScanned,
  lang,
}: {
  assets: AssetRecord[];
  isOpen: boolean;
  onClose: () => void;
  onSelectScanned: (asset: AssetRecord) => void;
  lang: Lang;
}) {
  const [scanQuery, setScanQuery] = useState('');

  if (!isOpen) return null;

  const filtered = assets.filter((a) => {
    const q = scanQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      a.tag.toLowerCase().includes(q) ||
      a.name.toLowerCase().includes(q) ||
      a.sapAssetNo.toLowerCase().includes(q) ||
      a.custodian.toLowerCase().includes(q)
    );
  });

  return (
    <div className="eam-modal-overlay" onClick={onClose}>
      <div className="eam-modal sm" onClick={(e) => e.stopPropagation()}>
        <div className="eam-modal-hd">
          <div className="eam-modal-hd-left">
            <div className="eam-modal-icon" style={{ color: 'var(--status-success-bright)' }}>
              <Barcode size={18} />
            </div>
            <div>
              <h3 className="eam-modal-title">
                {t('Scan Equipment QR or Tag', 'অপটিক্যাল কিউআর ও আরএফআইডি স্ক্যানার', lang)}
              </h3>
              <div className="eam-modal-subtitle">
                {t('Aim at the equipment plate or search below to open its record.', 'সরঞ্জামের প্লেটের দিকে ধরুন অথবা নিচে খুঁজে রেকর্ড খুলুন।', lang)}
              </div>
            </div>
          </div>
          <button type="button" className="eam-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="eam-modal-body">
          <div
            style={{
              height: '155px',
              background: 'var(--surface-inverse-deep)',
              borderRadius: '10px',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid var(--border-inverse-2)',
              marginBottom: '12px',
            }}
          >
            <div style={{ width: '115px', height: '115px', border: '2px dashed var(--status-success)', borderRadius: '8px', position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  height: '2px',
                  background: 'var(--status-danger-solid)',
                  boxShadow: '0 0 8px var(--status-danger)',
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
              />
            </div>
            <div style={{ position: 'absolute', bottom: '8px', fontSize: '10.5px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
              {t('Camera ready — aim at tag', 'ক্যামেরা প্রস্তুত — ট্যাগের দিকে ধরুন', lang)}
            </div>
          </div>

          <div className="eam-search-box" style={{ marginBottom: '10px' }}>
            <Search size={14} className="eam-search-icon" />
            <input
              type="text"
              className="eam-search-input"
              placeholder={t('Type to narrow the list…', 'তালিকা ছোট করতে লিখুন…', lang)}
              value={scanQuery}
              onChange={(e) => setScanQuery(e.target.value)}
            />
          </div>

          <div className="eam-field" style={{ marginBottom: 0 }}>
            <label className="eam-label">{t('Choose the tagged machine', 'ট্যাগ করা মেশিন বেছে নিন', lang)}</label>
            <select
              className="eam-select"
              value=""
              onChange={(e) => {
                const a = assets.find((item) => item.id === e.target.value);
                if (!a) return;
                onSelectScanned(a);
                onClose();
                showToast(t(`Opened ${a.name}.`, `ট্যাগ ${a.tag} স্ক্যান সম্পন্ন।`, lang), 'success');
              }}
            >
              <option value="">
                {filtered.length === 0
                  ? t('No machine matches that search', 'এই খোঁজে কোনো মেশিন নেই', lang)
                  : t(`Select from ${filtered.length} machines…`, `${filtered.length}টি মেশিন থেকে বেছে নিন…`, lang)}
              </option>
              {filtered.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} — {a.facility} ({a.tag})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="eam-modal-ft">
          <button type="button" className="btn-outline" onClick={onClose}>{t('Close', 'বন্ধ করুন', lang)}</button>
        </div>
      </div>
    </div>
  );
}
