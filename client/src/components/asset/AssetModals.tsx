import React, { useState, useEffect } from 'react';
import { AppRole, Lang, ROLE_META, t } from '../../types';
import { showToast } from '../../App';
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
  const [name, setName] = useState('');
  const [category, setCategory] = useState<AssetCategory>(role === 'transport_admin' ? 'vehicle' : role === 'hr_admin' ? 'it' : 'plant');
  const [criticality, setCriticality] = useState<AssetCriticality>('essential_b');
  const [facility, setFacility] = useState<AssetFacility>(
    role === 'hr_admin' ? 'Bashundhara Corporate HQ, Baridhara' : 'Keraniganj Bitumen Refinery'
  );
  const [functionalLocation, setFunctionalLocation] = useState('Unit-2 High-Pressure Circulation Bay');
  const [selectedEmpId, setSelectedEmpId] = useState('EMP-0012');
  const [placeInStorePool, setPlaceInStorePool] = useState(false);
  const [oem, setOem] = useState('Sulzer Pumps AG / Siemens');
  const [modelNo, setModelNo] = useState('IND-2026-ATEX');
  const [serialNo, setSerialNo] = useState('SLZ-BPP-2026-BD');
  const [purchaseCost, setPurchaseCost] = useState('4500000');
  const [salvageValue, setSalvageValue] = useState('400000');
  const [usefulLifeYears, setUsefulLifeYears] = useState('12');
  const [depMethod, setDepMethod] = useState<DepreciationMethod>('SLM');
  const [calDays, setCalDays] = useState('180');
  const [warrantyMonths, setWarrantyMonths] = useState('24');
  const [regAuthority, setRegAuthority] = useState<AssetRecord['regulatoryAuthority']>('ASME / API-510');
  const [specs, setSpecs] = useState('High-Pressure Bitumen Circulation Booster Pump (28 Bar, ATEX Zone-1 Explosion-Proof)');

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
    setName('');
    onClose();
  };

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-hd">
          <div className="modal-hd-left">
            <div className="modal-hd-icon" style={{ background: 'rgba(165,28,48,0.1)', color: 'var(--brand-crimson)' }}>
              <Plus size={18} />
            </div>
            <div>
              <h3 className="modal-title">{t('Commission & Capitalize Enterprise Asset', 'নতুন মূলধনী সম্পদ নিবন্ধন ও কমিশনিং', lang)}</h3>
              <div className="modal-subtitle">ISO 55001 / ISO 14224 Taxonomy • SAP S/4HANA FI-AA Capitalization</div>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
            <div className="responsive-col-2-eq" style={{ gap: '12px', marginBottom: '12px' }}>
              <div>
                <label className="form-label">{t('Asset Tag Code', 'অ্যাসেট ট্যাগ কোড', lang)} *</label>
                <input className="form-input" value={tag} onChange={(e) => setTag(e.target.value)} required />
              </div>
              <div>
                <label className="form-label">{t('ISO 14224 Category', 'সরঞ্জাম শ্রেণী', lang)} *</label>
                <select className="form-input" value={category} onChange={(e) => setCategory(e.target.value as AssetCategory)}>
                  <option value="plant">⚙️ Refinery Plant & Process Machinery</option>
                  <option value="vehicle">🚛 Heavy Fleet & Bitumen Tankers</option>
                  <option value="it">💻 SCADA, DCS & Corporate IT Hardware</option>
                  <option value="safety">🛡️ HSE, Fire & Gas Detection</option>
                  <option value="lab">🔬 QC Metrology & Bitumen Lab</option>
                  <option value="corporate">🏢 Corporate Facility & Infrastructure</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label className="form-label">{t('Asset / Equipment Full Title', 'যন্ত্রপাতির পূর্ণ নাম', lang)} *</label>
              <input
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sulzer High-Pressure Bitumen Circulation Booster Pump"
                required
              />
            </div>

            <div className="responsive-col-2-eq" style={{ gap: '12px', marginBottom: '12px' }}>
              <div>
                <label className="form-label">{t('Facility / Site', 'স্থাপনা / সাইট', lang)}</label>
                <select className="form-input" value={facility} onChange={(e) => setFacility(e.target.value as AssetFacility)}>
                  <option value="Keraniganj Bitumen Refinery">Keraniganj Bitumen Refinery</option>
                  <option value="Bashundhara Corporate HQ, Baridhara">Bashundhara Corporate HQ, Baridhara</option>
                  <option value="Chattogram Patenga Terminal">Chattogram Patenga Terminal</option>
                </select>
              </div>
              <div>
                <label className="form-label">{t('Functional Location (Unit / Floor)', 'ইউনিট বা অবস্থান', lang)}</label>
                <input className="form-input" value={functionalLocation} onChange={(e) => setFunctionalLocation(e.target.value)} />
              </div>
            </div>

            <div className="responsive-col-2-eq" style={{ gap: '12px', marginBottom: '12px' }}>
              <div>
                <label className="form-label">{t('Criticality Class (RCM)', 'ঝুঁকি ও গুরুত্ব শ্রেণী', lang)}</label>
                <select className="form-input" value={criticality} onChange={(e) => setCriticality(e.target.value as AssetCriticality)}>
                  <option value="critical_a">Class A — Safety / Production Critical</option>
                  <option value="essential_b">Class B — Operational Essential</option>
                  <option value="general_c">Class C — General Corporate / Support</option>
                </select>
              </div>
              <div>
                <label className="form-label">{t('Assigned Custodian Officer', 'দায়িত্বপ্রাপ্ত কর্মকর্তা', lang)}</label>
                <select
                  className="form-input"
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  disabled={placeInStorePool}
                >
                  {activeEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.id} · {emp.dept})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '12px', padding: '8px 12px', background: 'var(--brand-slate-100)', borderRadius: '6px', fontSize: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={placeInStorePool}
                  onChange={(e) => setPlaceInStorePool(e.target.checked)}
                />
                <span>
                  {t(
                    'Place initially in Central Store Pool (Stage 3: Tagged & Capitalized, awaiting custodian allocation)',
                    'প্রাথমিকভাবে কেন্দ্রীয় স্টোর পুলে রাখুন (পরবর্তীতে কর্মীকে বরাদ্দ দেওয়ার জন্য)',
                    lang
                  )}
                </span>
              </label>
            </div>

            {/* Financial & IAS 16 Section */}
            <div className="responsive-col-2-eq" style={{ gap: '12px', marginBottom: '12px' }}>
              <div>
                <label className="form-label">{t('Acquisition Cost / CAPEX (BDT ৳)', 'ক্রয়মূল্য (টাকা)', lang)}</label>
                <input className="form-input" type="number" value={purchaseCost} onChange={(e) => setPurchaseCost(e.target.value)} />
              </div>
              <div>
                <label className="form-label">{t('Residual / Salvage Value (BDT ৳)', 'ভগ্নাংশ / অবশিষ্ট মূল্য (টাকা)', lang)}</label>
                <input className="form-input" type="number" value={salvageValue} onChange={(e) => setSalvageValue(e.target.value)} />
              </div>
            </div>

            <div className="responsive-col-2-eq" style={{ gap: '12px', marginBottom: '12px' }}>
              <div>
                <label className="form-label">{t('Useful Life (Years)', 'আয়ুষ্কাল (বছর)', lang)}</label>
                <input className="form-input" type="number" value={usefulLifeYears} onChange={(e) => setUsefulLifeYears(e.target.value)} />
              </div>
              <div>
                <label className="form-label">{t('IAS 16 Depreciation Method', 'অবচয় পদ্ধতি (IAS 16)', lang)}</label>
                <select className="form-input" value={depMethod} onChange={(e) => setDepMethod(e.target.value as DepreciationMethod)}>
                  <option value="SLM">Straight-Line Method (SLM)</option>
                  <option value="WDV">Written-Down Value / Declining (WDV)</option>
                  <option value="UOP">Units of Production / Runtime Hours (UoP)</option>
                </select>
              </div>
            </div>

            <div className="responsive-col-2-eq" style={{ gap: '12px', marginBottom: '12px' }}>
              <div>
                <label className="form-label">{t('OEM Manufacturer & Model', 'প্রস্তুতকারক ও মডেল', lang)}</label>
                <input className="form-input" value={`${oem} · ${modelNo}`} onChange={(e) => { setOem(e.target.value); setModelNo('ENT'); }} />
              </div>
              <div>
                <label className="form-label">{t('Manufacturer Serial No', 'সিরিয়াল নম্বর', lang)}</label>
                <input className="form-input" value={serialNo} onChange={(e) => setSerialNo(e.target.value)} />
              </div>
            </div>

            <div className="responsive-col-2-eq" style={{ gap: '12px', marginBottom: '12px' }}>
              <div>
                <label className="form-label">{t('Calibration / PM Cycle (Days)', 'ক্যালিব্রেশন চক্র (দিন)', lang)}</label>
                <input className="form-input" type="number" value={calDays} onChange={(e) => setCalDays(e.target.value)} />
              </div>
              <div>
                <label className="form-label">{t('OEM Warranty Coverage (Months)', 'ওয়ারেন্টি মেয়াদ (মাস)', lang)}</label>
                <input className="form-input" type="number" value={warrantyMonths} onChange={(e) => setWarrantyMonths(e.target.value)} />
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label className="form-label">{t('Statutory Calibration Authority', 'নিয়ন্ত্রক সংস্থা', lang)}</label>
              <select className="form-input" value={regAuthority} onChange={(e) => setRegAuthority(e.target.value as any)}>
                <option value="ASME / API-510">ASME Sec VIII / API-510 Mechanical Integrity</option>
                <option value="Dept. of Explosives (DoE)">Department of Explosives (DoE Bangladesh)</option>
                <option value="BSTI">BSTI National Metrology Standards</option>
                <option value="BRTA">BRTA Commercial Heavy Vehicle Fitness</option>
                <option value="ISO-17025">ISO/IEC 17025 Lab Calibration</option>
                <option value="Corporate IT">Corporate IT & Cybersecurity MDM</option>
              </select>
            </div>

            <div>
              <label className="form-label">{t('Technical Operating Specifications', 'প্রযুক্তিগত বৈশিষ্ট্য', lang)}</label>
              <textarea className="form-input" rows={2} value={specs} onChange={(e) => setSpecs(e.target.value)} />
            </div>
          </div>

          <div className="modal-ft">
            <button type="button" className="btn-sm-ghost" onClick={onClose}>{t('Cancel', 'বাতিল', lang)}</button>
            <button type="submit" className="btn-primary">
              <CheckCircle size={15} /> {t('Capitalize in SAP FI-AA & Generate QR Tag', 'এসএপিতে নিবন্ধন ও ট্যাগ তৈরি করুন', lang)}
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
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" style={{ maxWidth: '560px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-hd">
          <div className="modal-hd-left">
            <div className="modal-hd-icon" style={{ background: '#EFF6FF', color: '#0284C7' }}>
              <ArrowRightLeft size={18} />
            </div>
            <div>
              <h3 className="modal-title">{t('Assign / Transfer Custody & Site Gate Pass', 'সম্পদ হস্তান্তর ও গেট পাস ইস্যু', lang)}</h3>
              <div className="modal-subtitle">{asset.tag} • {asset.name}</div>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ padding: '10px 12px', background: 'var(--brand-slate-100)', borderRadius: '8px', fontSize: '12px', marginBottom: '14px' }}>
              <div><strong>{t('Current Custodian:', 'বর্তমান হেফাজতকারী:', lang)}</strong> {asset.custodian}</div>
              <div><strong>{t('Current Facility:', 'বর্তমান অবস্থান:', lang)}</strong> {asset.facility} ({asset.functionalLocation})</div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label className="form-label">{t('New Receiving Custodian (SAP PERNR Bound)', 'নতুন গ্রহণকারী কর্মকর্তা', lang)} *</label>
              <select className="form-input" value={toEmpId} onChange={(e) => setToEmpId(e.target.value)}>
                {activeEmployees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} — {emp.designation} ({emp.id})
                  </option>
                ))}
              </select>
            </div>

            <div className="responsive-col-2-eq" style={{ gap: '12px', marginBottom: '12px' }}>
              <div>
                <label className="form-label">{t('Destination Facility', 'গন্তব্য স্থাপনা', lang)}</label>
                <select className="form-input" value={toFacility} onChange={(e) => setToFacility(e.target.value as AssetFacility)}>
                  <option value="Keraniganj Bitumen Refinery">Keraniganj Bitumen Refinery</option>
                  <option value="Bashundhara Corporate HQ, Baridhara">Bashundhara Corporate HQ, Baridhara</option>
                  <option value="Chattogram Patenga Terminal">Chattogram Patenga Terminal</option>
                </select>
              </div>
              <div>
                <label className="form-label">{t('Target Functional Location', 'গন্তব্য ইউনিট / ডেস্ক', lang)}</label>
                <input className="form-input" value={toLocation} onChange={(e) => setToLocation(e.target.value)} required />
              </div>
            </div>

            <div>
              <label className="form-label">{t('Transfer Justification & Gate Pass Remarks', 'স্থানান্তরের কারণ ও নির্দেশনা', lang)}</label>
              <textarea className="form-input" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} required />
            </div>
          </div>

          <div className="modal-ft">
            <button type="button" className="btn-sm-ghost" onClick={onClose}>{t('Cancel', 'বাতিল', lang)}</button>
            <button type="submit" className="btn-primary">
              <ArrowRightLeft size={15} /> {t('Issue Transit Gate Pass & Initiate Handover', 'গেট পাস ইস্যু ও স্থানান্তর শুরু করুন', lang)}
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
  const autoWarrantyFree = chosenAsset?.isUnderWarranty && type === 'CM' && !isCapexOverhaul;

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
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" style={{ maxWidth: '620px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-hd">
          <div className="modal-hd-left">
            <div className="modal-hd-icon" style={{ background: '#FEF3C7', color: '#D97706' }}>
              <Wrench size={18} />
            </div>
            <div>
              <h3 className="modal-title">{t('Dispatch Maintenance / Calibration Work Order', 'রক্ষণাবেক্ষণ ও ক্যালিব্রেশন কার্যাদেশ তৈরি', lang)}</h3>
              <div className="modal-subtitle">SAP PM Work Order • OSHA LOTO Interlock • IAS 16 CAPEX/OPEX Split</div>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
            <div style={{ marginBottom: '12px' }}>
              <label className="form-label">{t('Target Asset Tag', 'লক্ষ্যকৃত সম্পদ', lang)} *</label>
              <select className="form-input" value={chosenAsset?.id || ''} onChange={(e) => setAssetId(e.target.value)}>
                {activeAssets.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.tag} — {a.name} ({a.facility})
                  </option>
                ))}
              </select>
            </div>

            {chosenAsset?.isUnderWarranty && (
              <div style={{ marginBottom: '12px', padding: '8px 12px', background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '6px', fontSize: '11.5px', color: '#065F46', fontWeight: 600 }}>
                <ShieldCheck size={14} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'text-bottom' }} />
                {t(
                  `Active OEM Warranty valid until ${chosenAsset.warrantyExpiry}! Corrective Breakdown (CM) repairs automatically claim ৳0 OEM coverage.`,
                  `এই সম্পদের ওয়ারেন্টি ${chosenAsset.warrantyExpiry} পর্যন্ত সক্রিয়! ব্রেকডাউন মেরামতে (CM) কোনো খরচ প্রযোজ্য হবে না।`,
                  lang
                )}
              </div>
            )}

            <div className="responsive-col-2-eq" style={{ gap: '12px', marginBottom: '12px' }}>
              <div>
                <label className="form-label">{t('Work Order Classification', 'কার্যাদেশের ধরন', lang)}</label>
                <select className="form-input" value={type} onChange={(e) => setType(e.target.value as AssetWorkOrder['type'])}>
                  <option value="CAL">CAL — Statutory Calibration / NDT</option>
                  <option value="PM">PM — Scheduled Preventive Maintenance</option>
                  <option value="CBM">CbM — Predictive / Condition-Based</option>
                  <option value="CM">CM — Corrective / Breakdown Repair</option>
                </select>
              </div>
              <div>
                <label className="form-label">{t('Urgency / Priority', 'অগ্রাধিকার', lang)}</label>
                <select className="form-input" value={priority} onChange={(e) => setPriority(e.target.value as AssetWorkOrder['priority'])}>
                  <option value="critical">Critical — Safety / Statutory Mandatory</option>
                  <option value="high">High — Operational Throughput</option>
                  <option value="routine">Routine — Scheduled Window</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label className="form-label">{t('Work Order Scope Title', 'কাজের শিরোনাম', lang)} *</label>
              <input className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>

            <div className="responsive-col-2-eq" style={{ gap: '12px', marginBottom: '12px' }}>
              <div>
                <label className="form-label">{t('Assigned Engineer / Certified Vendor', 'দায়িত্বপ্রাপ্ত প্রকৌশলী / ভেন্ডর', lang)}</label>
                <input className="form-input" value={assignedEngineer} onChange={(e) => setAssignedEngineer(e.target.value)} required />
              </div>
              <div>
                <label className="form-label">{t('Target Completion Due Date', 'সম্পন্নের সময়সীমা', lang)}</label>
                <input className="form-input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
              </div>
            </div>

            <div className="responsive-col-2-eq" style={{ gap: '12px', marginBottom: '12px' }}>
              <div>
                <label className="form-label">{t('LOTO Safety Permit Ref', 'এলওটিও নিরাপত্তা পারমিট', lang)}</label>
                <input className="form-input" value={lotoPermitRef} onChange={(e) => setLotoPermitRef(e.target.value)} placeholder="Optional for IT/Office" />
              </div>
              <div>
                <label className="form-label">{t('Estimated Cost (BDT ৳)', 'প্রাক্কলিত ব্যয় (টাকা)', lang)}</label>
                <input
                  className="form-input"
                  type="number"
                  value={autoWarrantyFree ? '0' : cost}
                  disabled={autoWarrantyFree}
                  onChange={(e) => setCost(e.target.value)}
                />
              </div>
            </div>

            <div style={{ marginBottom: '12px', padding: '8px 12px', background: 'var(--brand-slate-100)', borderRadius: '6px', fontSize: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600 }}>
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
            </div>

            <div>
              <label className="form-label">{t('Technical Instructions & Test Protocol', 'কারিগরি নির্দেশনা', lang)}</label>
              <textarea className="form-input" rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
            </div>
          </div>

          <div className="modal-ft">
            <button type="button" className="btn-sm-ghost" onClick={onClose}>{t('Cancel', 'বাতিল', lang)}</button>
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
      ? 'Required for multi-district bitumen dealer credit reconciliation and mobile SAP S/4HANA order entry.'
      : 'Preventive refractory & electrical hotspot diagnostics across Keraniganj Distillation Unit 1 & 2.'
  );

  if (!isOpen) return null;
  const meta = ROLE_META[role];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitReq({
      title,
      category,
      criticality,
      facility,
      department: meta.dept,
      requestedBy: meta.name,
      requestedByEmpId: role === 'employee' ? 'EMP-1042' : undefined,
      estimatedCapexBdt: Number(cost) || 100000,
      justification,
      specs,
      urgency,
    });
    onClose();
  };

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-hd">
          <div className="modal-hd-left">
            <div className="modal-hd-icon" style={{ background: '#F5F3FF', color: '#7C3AED' }}>
              <FilePlus size={18} />
            </div>
            <div>
              <h3 className="modal-title">{t('New Asset / Replacement CAPEX Requisition', 'নতুন সম্পদ বা প্রতিস্থাপন রিকুইজিশন', lang)}</h3>
              <div className="modal-subtitle">Stage 1 Lifecycle Birth • Multi-Tier Budget & Executive Sanction</div>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ marginBottom: '12px' }}>
              <label className="form-label">{t('Requested Equipment / Asset Title', 'প্রয়োজনীয় সরঞ্জামের নাম', lang)} *</label>
              <input className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>

            <div className="responsive-col-2-eq" style={{ gap: '12px', marginBottom: '12px' }}>
              <div>
                <label className="form-label">{t('Asset Category', 'সম্পদ শ্রেণী', lang)}</label>
                <select className="form-input" value={category} onChange={(e) => setCategory(e.target.value as AssetCategory)}>
                  <option value="it">💻 SCADA / Corporate IT & Mobility</option>
                  <option value="plant">⚙️ Refinery Plant Machinery</option>
                  <option value="vehicle">🚛 Fleet & Tanker</option>
                  <option value="safety">🛡️ Safety & Detection</option>
                  <option value="lab">🔬 QC Lab Metrology</option>
                  <option value="corporate">🏢 Corporate Facility</option>
                </select>
              </div>
              <div>
                <label className="form-label">{t('Deployment Facility', 'ব্যবহারের স্থাপনা', lang)}</label>
                <select className="form-input" value={facility} onChange={(e) => setFacility(e.target.value as AssetFacility)}>
                  <option value="Bashundhara Corporate HQ, Baridhara">Bashundhara Corporate HQ, Baridhara</option>
                  <option value="Keraniganj Bitumen Refinery">Keraniganj Bitumen Refinery</option>
                  <option value="Chattogram Patenga Terminal">Chattogram Patenga Terminal</option>
                </select>
              </div>
            </div>

            <div className="responsive-col-2-eq" style={{ gap: '12px', marginBottom: '12px' }}>
              <div>
                <label className="form-label">{t('Estimated CAPEX Budget (BDT ৳)', 'আনুমানিক মূল্য (টাকা)', lang)}</label>
                <input className="form-input" type="number" value={cost} onChange={(e) => setCost(e.target.value)} required />
              </div>
              <div>
                <label className="form-label">{t('Urgency Level', 'জরুরিতা', lang)}</label>
                <select className="form-input" value={urgency} onChange={(e) => setUrgency(e.target.value as any)}>
                  <option value="normal">Normal — Planned Quarterly CAPEX</option>
                  <option value="high">High — Operational Bottleneck</option>
                  <option value="critical">Critical — Safety / Breakdown Replacement</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label className="form-label">{t('Required Technical Specifications', 'প্রযুক্তিগত স্পেসিফিকেশন', lang)}</label>
              <input className="form-input" value={specs} onChange={(e) => setSpecs(e.target.value)} required />
            </div>

            <div>
              <label className="form-label">{t('Business / ROI Justification', 'ব্যবসায়িক যৌক্তিকতা', lang)} *</label>
              <textarea className="form-input" rows={2} value={justification} onChange={(e) => setJustification(e.target.value)} required />
            </div>
          </div>

          <div className="modal-ft">
            <button type="button" className="btn-sm-ghost" onClick={onClose}>{t('Cancel', 'বাতিল', lang)}</button>
            <button type="submit" className="btn-primary">
              <CheckCircle size={15} /> {t('Submit Asset Requisition', 'রিকুইজিশন দাখিল করুন', lang)}
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
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" style={{ maxWidth: '560px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-hd danger">
          <div className="modal-hd-left">
            <div className="modal-hd-icon" style={{ background: 'rgba(255,255,255,0.18)', color: '#FCA5A5' }}>
              <ShieldAlert size={18} />
            </div>
            <div>
              <h3 className="modal-title" style={{ color: '#fff' }}>{t('Initiate Stage-7 Condemnation & Decommissioning', 'অকেজো ঘোষণা ও ডিকমিশনিং জরিপ শুরু', lang)}</h3>
              <div className="modal-subtitle" style={{ color: '#FCA5A5' }}>{asset.tag} • NBV: ৳{fin.netBookValue.toLocaleString()}</div>
            </div>
          </div>
          <button className="modal-close" style={{ color: '#fff' }} onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ padding: '10px 12px', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)', borderRadius: '8px', fontSize: '12px', marginBottom: '14px' }}>
              <div><strong>{asset.name}</strong> ({asset.serialNo})</div>
              <div style={{ marginTop: '4px' }}>
                Age: <strong>{asset.ageYears} / {asset.usefulLifeYears} yrs</strong> · Repair/CAPEX Ratio: <strong>{fin.repairToCapexRatioPct}%</strong> · Current NBV: <strong>৳{fin.netBookValue.toLocaleString()}</strong>
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label className="form-label">{t('Primary Condemnation Cause', 'ডিকমিশনিং-এর প্রধান কারণ', lang)}</label>
              <select className="form-input" value={reason} onChange={(e) => setReason(e.target.value as AssetDisposalDossier['reason'])}>
                <option value="Economic Life Exhausted">Economic Life Exhausted (High Repair-to-Replacement Ratio)</option>
                <option value="Irreparable Breakdown">Irreparable Mechanical / Structural Failure</option>
                <option value="Technological Obsolescence">Technological / Cybersecurity Obsolescence</option>
                <option value="Regulatory / Safety Condemnation">Statutory DoE / BSTI / HSE Safety Condemnation</option>
              </select>
            </div>

            <div>
              <label className="form-label">{t('Engineering / Audit Survey Findings', 'কারিগরি জরিপ প্রতিবেদন', lang)} *</label>
              <textarea className="form-input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} required />
            </div>
          </div>

          <div className="modal-ft">
            <button type="button" className="btn-sm-ghost" onClick={onClose}>{t('Cancel', 'বাতিল', lang)}</button>
            <button type="submit" className="btn-danger">
              <Archive size={15} /> {t('Move to Stage-7 Decommissioned Queue', 'ডিকমিশন তালিকায় স্থানান্তর করুন', lang)}
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
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-hd" style={{ background: '#0F172A', color: '#fff' }}>
          <div className="modal-hd-left">
            <div className="modal-hd-icon" style={{ background: 'rgba(212,175,55,0.2)', color: '#FDE047' }}>
              <DollarSign size={18} />
            </div>
            <div>
              <h3 className="modal-title" style={{ color: '#fff' }}>{t('Executive Write-Off & Stage-8 Disposal Realization', 'চূড়ান্ত অবলোপন, নিলাম ও আর্কাইভ অনুমোদন', lang)}</h3>
              <div className="modal-subtitle" style={{ color: '#94A3B8' }}>SAP S/4HANA FI-AA Asset Retirement • IAS 16.71 Gain/Loss Posting</div>
            </div>
          </div>
          <button className="modal-close" style={{ color: '#fff' }} onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ marginBottom: '12px' }}>
              <label className="form-label">{t('Disposal Execution Channel', 'নিষ্পত্তি / বিক্রয়ের মাধ্যম', lang)}</label>
              <select className="form-input" value={method} onChange={(e) => setMethod(e.target.value as any)}>
                <option value="Public Tender / Auction">Sealed Public Tender / Corporate Auction</option>
                <option value="OEM Trade-In">Authorized OEM Upgrade Trade-In Credit</option>
                <option value="Certified Scrap / E-Waste Recycling">DoE Certified Scrap / E-Waste Recycler</option>
                <option value="Insurance Claim Write-Off">Insurance Total-Loss Claim Settlement</option>
              </select>
            </div>

            <div className="responsive-col-2-eq" style={{ gap: '12px', marginBottom: '12px' }}>
              <div>
                <label className="form-label">{t('Winning Bidder / Recycler / Counterparty', 'ক্রেতা বা রিসাইক্লিং প্রতিষ্ঠান', lang)} *</label>
                <input className="form-input" value={buyer} onChange={(e) => setBuyer(e.target.value)} required />
              </div>
              <div>
                <label className="form-label">{t('Realized Proceeds / Credit (BDT ৳)', 'প্রাপ্ত নিলাম/স্ক্র্যাপ মূল্য (টাকা)', lang)} *</label>
                <input className="form-input" type="number" value={proceeds} onChange={(e) => setProceeds(e.target.value)} required />
              </div>
            </div>

            {/* Live IAS 16 Gain/Loss Accounting Preview */}
            <div style={{ padding: '12px 14px', background: 'var(--brand-slate-100)', border: '1px solid var(--brand-slate-200)', borderRadius: '8px', fontSize: '12px' }}>
              <div style={{ fontWeight: 800, marginBottom: '6px', color: 'var(--brand-slate-900)' }}>
                📊 {t('SAP FI-AA Retirement Journal Preview', 'এসএপি অবলোপন হিসাব প্রাকদর্শন', lang)} ({asset.sapAssetNo})
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>Gross Capitalized Cost:</span>
                <strong>৳{fin.grossCapitalizedCost.toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>Accumulated Depreciation Reversed:</span>
                <strong>৳{fin.accumulatedDepreciation.toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>Carrying Net Book Value (NBV) at Retirement:</span>
                <strong>৳{fin.netBookValue.toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px dashed var(--brand-slate-300)', fontSize: '13px' }}>
                <span><strong>{gainOrLoss >= 0 ? 'Net Gain on Disposal (GL Income):' : 'Net Loss on Write-Off (GL Expense):'}</strong></span>
                <strong style={{ color: gainOrLoss >= 0 ? '#059669' : '#DC2626' }}>
                  {gainOrLoss >= 0 ? `+৳${gainOrLoss.toLocaleString()}` : `-৳${Math.abs(gainOrLoss).toLocaleString()}`}
                </strong>
              </div>
            </div>
          </div>

          <div className="modal-ft">
            <button type="button" className="btn-sm-ghost" onClick={onClose}>{t('Cancel', 'বাতিল', lang)}</button>
            <button type="submit" className="btn-gold" style={{ fontWeight: 800 }}>
              👑 {t('Sanction Write-Off, Post SAP Voucher & Archive', 'অবলোপন অনুমোদন ও আর্কাইভ করুন', lang)}
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
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-hd">
          <div className="modal-hd-left">
            <div className="modal-hd-icon" style={{ background: '#ECFDF5', color: '#059669' }}>
              <DollarSign size={18} />
            </div>
            <div>
              <h3 className="modal-title">{t('IAS 16 / BAS 16 Fixed Asset Depreciation Schedule', 'স্থায়ী সম্পদ অবচয় তফসিল (IAS 16)', lang)}</h3>
              <div className="modal-subtitle">{asset.tag} • {asset.sapAssetNo} • Cost Center: {asset.glCostCenter}</div>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px', padding: '10px 12px', background: 'var(--brand-slate-100)', borderRadius: '8px' }}>
            <div style={{ fontSize: '12px' }}>
              <div><strong>Gross Capitalized:</strong> ৳{fin.grossCapitalizedCost.toLocaleString()} · <strong>Salvage:</strong> ৳{asset.salvageValue.toLocaleString()}</div>
              <div><strong>Current Carrying NBV:</strong> <span style={{ color: '#059669', fontWeight: 800 }}>৳{fin.netBookValue.toLocaleString()}</span> · <strong>TCO:</strong> ৳{fin.totalCostOfOwnership.toLocaleString()}</div>
            </div>

            {canEditPolicy && asset.lifecycleStage !== 'disposed' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700 }}>{t('Method:', 'পদ্ধতি:', lang)}</span>
                {(['SLM', 'WDV', 'UOP'] as DepreciationMethod[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={asset.depreciationMethod === m ? 'btn-primary' : 'btn-outline'}
                    style={{ padding: '4px 10px', fontSize: '11px' }}
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
                  <th>{t('Opening NBV', 'প্রারম্ভিক মূল্য', lang)}</th>
                  <th>{t('Annual Charge', 'বার্ষিক অবচয়', lang)}</th>
                  <th>{t('Accumulated Dep.', 'পুঞ্জীভূত অবচয়', lang)}</th>
                  <th>{t('Closing NBV', 'সমাপনী মূল্য', lang)}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const isCurrentYear = r.calendarYear === 2026;
                  return (
                    <tr
                      key={r.yearNumber}
                      style={{
                        background: isCurrentYear ? 'rgba(165, 28, 48, 0.07)' : undefined,
                        fontWeight: isCurrentYear ? 700 : 400,
                      }}
                    >
                      <td>Yr {r.yearNumber}</td>
                      <td>
                        FY {r.calendarYear} {isCurrentYear && <span className="badge info" style={{ fontSize: '9px' }}>Current</span>}
                      </td>
                      <td>৳{r.openingNbv.toLocaleString()}</td>
                      <td style={{ color: '#DC2626' }}>-৳{r.annualCharge.toLocaleString()}</td>
                      <td>৳{r.accumulatedDep.toLocaleString()}</td>
                      <td style={{ fontWeight: 700, color: '#059669' }}>৳{r.closingNbv.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="modal-ft">
          <button type="button" className="btn-sm-ghost" onClick={onClose}>{t('Close', 'বন্ধ করুন', lang)}</button>
          <button type="button" className="btn-primary" onClick={handleExportCsv}>
            <Download size={14} /> {t('Export SAP FI-AA Schedule (CSV)', 'সিএসভি ডাউনলোড করুন', lang)}
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
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" style={{ maxWidth: '550px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-hd" style={{ background: '#0F172A', color: '#fff' }}>
          <div className="modal-hd-left">
            <div className="modal-hd-icon" style={{ background: 'rgba(255,255,255,0.15)', color: '#FCD34D' }}>
              <QrCode size={18} />
            </div>
            <div>
              <h3 className="modal-title" style={{ color: '#fff' }}>
                {t('Digital Equipment Passport & Metal QR Plate', 'ডিজিটাল সরঞ্জাম পাসপোর্ট ও মেটাল কিউআর ট্যাগ', lang)}
              </h3>
              <div className="modal-subtitle" style={{ color: '#94A3B8' }}>
                ISO 55001 • SAP FI-AA ({asset.sapAssetNo}) • Tamper-Evident Anodized Seal
              </div>
            </div>
          </div>
          <button className="modal-close" style={{ color: '#fff' }} onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body">
          <div
            style={{
              background: 'linear-gradient(135deg, #E2E8F0 0%, #CBD5E1 50%, #94A3B8 100%)',
              padding: '18px',
              borderRadius: '10px',
              border: '2px solid #64748B',
              boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.8), 0 4px 12px rgba(0,0,0,0.15)',
              color: '#0F172A',
              fontFamily: 'monospace',
              marginBottom: '14px',
              position: 'relative',
            }}
          >
            <div style={{ position: 'absolute', top: '8px', left: '8px', width: '8px', height: '8px', borderRadius: '50%', background: '#475569', border: '1px solid #1E293B' }} />
            <div style={{ position: 'absolute', top: '8px', right: '8px', width: '8px', height: '8px', borderRadius: '50%', background: '#475569', border: '1px solid #1E293B' }} />
            <div style={{ position: 'absolute', bottom: '8px', left: '8px', width: '8px', height: '8px', borderRadius: '50%', background: '#475569', border: '1px solid #1E293B' }} />
            <div style={{ position: 'absolute', bottom: '8px', right: '8px', width: '8px', height: '8px', borderRadius: '50%', background: '#475569', border: '1px solid #1E293B' }} />

            <div style={{ textAlign: 'center', borderBottom: '1.5px solid #475569', paddingBottom: '8px', marginBottom: '12px' }}>
              <div style={{ fontWeight: 900, fontSize: '13px', letterSpacing: '1px', color: '#7F1424' }}>
                BASHUNDHARA OIL & GAS CO. LTD.
              </div>
              <div style={{ fontSize: '10px', color: '#334155', fontWeight: 700 }}>
                {asset.facility.toUpperCase()} • CAPITAL ASSET IDENTIFIER
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div
                style={{
                  width: '102px',
                  height: '102px',
                  background: '#fff',
                  borderRadius: '8px',
                  padding: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #000',
                  flexShrink: 0,
                }}
              >
                <QrCode size={76} color="#0F172A" />
                <span style={{ fontSize: '7px', fontWeight: 900, color: '#000' }}>{asset.tag}</span>
              </div>

              <div style={{ flex: 1, fontSize: '11px', lineHeight: 1.55 }}>
                <div><strong>TAG:</strong> <span style={{ color: '#7F1424', fontWeight: 800 }}>{asset.tag}</span></div>
                <div><strong>SAP FI-AA:</strong> {asset.sapAssetNo} ({asset.glCostCenter})</div>
                <div><strong>SERIAL:</strong> {asset.serialNo}</div>
                <div><strong>CUSTODIAN:</strong> {asset.custodian}</div>
                <div><strong>COMMISSIONED:</strong> {asset.commissioningDate}</div>
                <div><strong>NEXT AUDIT:</strong> <span style={{ color: asset.daysToService <= 15 ? '#DC2626' : '#059669', fontWeight: 800 }}>{asset.nextServiceDate}</span></div>
              </div>
            </div>

            <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px dashed #64748B', fontSize: '10px', color: '#1E293B' }}>
              OEM: {asset.oem} ({asset.modelNo}) • SPEC: {asset.specs}
            </div>
          </div>

          <div style={{ fontSize: '11.5px', color: 'var(--brand-slate-500)', lineHeight: 1.5 }}>
            ℹ️ <strong>Field Verification:</strong> Scanning this QR/RFID plate on any ATEX Zone-1 tablet or mobile terminal loads immutable custody history, calibration certificates, and open LOTO work orders.
          </div>
        </div>

        <div className="modal-ft">
          <button className="btn-sm-ghost" onClick={onClose}>{t('Close', 'বন্ধ করুন', lang)}</button>
          <button
            className="btn-primary"
            onClick={() => {
              showToast(t(`Laser QR etching job dispatched for ${asset.tag} (${asset.sapAssetNo}).`, 'লেজার ট্যাগ প্রিন্ট কমান্ড প্রেরিত হয়েছে।', lang), 'success');
              onClose();
            }}
          >
            <Printer size={15} /> {t('Print Anodized Metal QR Tag', 'ধাতব কিউআর ট্যাগ প্রিন্ট', lang)}
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
  if (!isOpen) return null;

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-hd" style={{ background: '#0F172A', color: '#fff' }}>
          <div className="modal-hd-left">
            <div className="modal-hd-icon" style={{ background: 'rgba(255,255,255,0.15)', color: '#34D399' }}>
              <Barcode size={18} />
            </div>
            <div>
              <h3 className="modal-title" style={{ color: '#fff' }}>
                {t('Optical QR, Barcode & UHF RFID Scanner', 'অপটিক্যাল কিউআর ও আরএফআইডি স্ক্যানার', lang)}
              </h3>
              <div className="modal-subtitle" style={{ color: '#94A3B8' }}>
                Field Custody & Calibration Lookup • Aim at Equipment Nameplate
              </div>
            </div>
          </div>
          <button className="modal-close" style={{ color: '#fff' }} onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body" style={{ textAlign: 'center' }}>
          <div
            style={{
              height: '175px',
              background: '#020617',
              borderRadius: '10px',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #334155',
              marginBottom: '14px',
            }}
          >
            <div style={{ width: '125px', height: '125px', border: '2px dashed #10B981', borderRadius: '8px', position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  height: '2px',
                  background: '#EF4444',
                  boxShadow: '0 0 8px #EF4444',
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
              />
            </div>
            <div style={{ position: 'absolute', bottom: '8px', fontSize: '10.5px', color: '#64748B', fontFamily: 'monospace' }}>
              ATEX OPTICAL + NFC READER • READY
            </div>
          </div>

          <div style={{ fontSize: '12px', color: 'var(--brand-slate-500)', marginBottom: '10px' }}>
            {t('Tap an asset tag below to simulate field scan detection:', 'ফিল্ড স্ক্যান সিমুলেশনের জন্য যেকোনো ট্যাগ নির্বাচন করুন:', lang)}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', maxHeight: '210px', overflowY: 'auto' }}>
            {assets.slice(0, 6).map((a) => (
              <button
                key={a.id}
                type="button"
                className="btn-outline"
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', fontSize: '11.5px', width: '100%' }}
                onClick={() => {
                  onSelectScanned(a);
                  onClose();
                  showToast(t(`✓ Scanned ${a.tag} (${a.sapAssetNo}). Loaded full 360° lifetime dossier.`, `✓ ট্যাগ ${a.tag} স্ক্যান সম্পন্ন।`, lang), 'success');
                }}
              >
                <span style={{ textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '8px' }}>
                  <strong>{a.tag}</strong> — {a.name}
                </span>
                <span className="badge success" style={{ flexShrink: 0 }}>Scan</span>
              </button>
            ))}
          </div>
        </div>

        <div className="modal-ft">
          <button className="btn-sm-ghost" onClick={onClose}>{t('Close', 'বন্ধ করুন', lang)}</button>
        </div>
      </div>
    </div>
  );
}

