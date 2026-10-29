import { useState, useEffect } from 'react';
import { AppRole } from '../types';

export type AssetCategory = 'plant' | 'vehicle' | 'it' | 'safety' | 'lab' | 'corporate';

export type AssetFacility =
  | 'Keraniganj Bitumen Refinery'
  | 'Bashundhara Corporate HQ, Baridhara'
  | 'Chattogram Patenga Terminal';

export type AssetCriticality = 'critical_a' | 'essential_b' | 'general_c';

export type DepreciationMethod = 'SLM' | 'WDV' | 'UOP';

export type LifecycleStage =
  | 'in_stock'          // Stage 3: Capitalized & Tagged in Central Store Pool
  | 'operational'       // Stage 4: Commissioned & Active Duty
  | 'in_transfer'       // Stage 5: Inter-Site / Custodian Transit
  | 'maintenance'       // Stage 6A: Under PM / CM Overhaul
  | 'calibration_due'   // Stage 6B: Statutory Calibration / NDT Window (<30d)
  | 'decommissioned'    // Stage 7: Condemned / Pending Write-Off & Disposal
  | 'disposed';         // Stage 8: Disposed / Auctioned / 10-Yr Immutable Archive

export interface AssetLifecycleEvent {
  id: string;
  eventType:
    | 'REQUISITION_APPROVED'
    | 'PROCURED_FAT_SAT'
    | 'CAPITALIZED_TAGGED'
    | 'COMMISSIONED'
    | 'CUSTODY_ASSIGNED'
    | 'CUSTODY_SIGNED'
    | 'TRANSFER_INITIATED'
    | 'TRANSFER_COMPLETED'
    | 'CUSTODY_RECLAIMED'
    | 'PM_CERTIFIED'
    | 'CAPEX_OVERHAUL'
    | 'DEFECT_FLAGGED'
    | 'DECOMMISSION_SURVEY'
    | 'DISPOSED_ARCHIVED';
  stage: LifecycleStage;
  title: string;
  notes: string;
  actor: string;
  actorRole: string;
  timestamp: string;
  financialDeltaBdt?: number;
  sapRef?: string;
  hash: string;
}

export interface CustodyRecord {
  id: string;
  custodianName: string;
  custodianEmpId?: string;
  department: string;
  facility: AssetFacility;
  functionalLocation: string;
  assignedDate: string;
  returnedDate?: string;
  acknowledged: boolean;
  acknowledgedAt?: string;
  conditionOnHandover: string;
  gatePassRef?: string;
}

export interface AssetSpareItem {
  id: string;
  partNo: string;
  name: string;
  stockQty: number;
  minReorderQty: number;
  unitCostBdt: number;
  leadTimeDays: number;
}

export interface AssetDisposalDossier {
  reason: 'Economic Life Exhausted' | 'Irreparable Breakdown' | 'Technological Obsolescence' | 'Regulatory / Safety Condemnation';
  surveyNotes: string;
  initiatedBy: string;
  initiatedDate: string;
  checklist: {
    technicalSurveySigned: boolean;
    decontaminationOrDataWipeCertified: boolean;
    sparesHarvested: boolean;
    financeCfoVetted: boolean;
  };
  disposalMethod?: 'Public Tender / Auction' | 'OEM Trade-In' | 'Certified Scrap / E-Waste Recycling' | 'Insurance Claim Write-Off';
  buyerOrVendor?: string;
  salvageProceedsBdt?: number;
  netBookValueAtDisposal?: number;
  gainOrLossBdt?: number;
  authorizedBy?: string;
  disposedDate?: string;
  sapRetirementVoucher?: string;
}

export interface AssetRecord {
  id: string;
  tag: string;
  sapAssetNo: string;
  name: string;
  category: AssetCategory;
  criticality: AssetCriticality;
  lifecycleStage: LifecycleStage;
  facility: AssetFacility;
  functionalLocation: string;
  glCostCenter: string;
  department: string;
  custodian: string;
  custodianEmpId?: string;
  custodianAcknowledged: boolean;
  oem: string;
  modelNo: string;
  serialNo: string;
  specs: string;
  procurementDate: string;
  commissioningDate: string;
  ageYears: number;
  usefulLifeYears: number;
  purchaseCost: number;
  capitalizedAdditions: number;
  salvageValue: number;
  depreciationMethod: DepreciationMethod;
  cumulativeMaintenanceOpex: number;
  warrantyExpiry: string;
  isUnderWarranty: boolean;
  amcVendor?: string;
  runtimeHours: number;
  ratedLifetimeHours: number;
  healthScore: number; // 0 - 100
  mtbfHours: number;
  mttrHours: number;
  calibrationCycleDays: number;
  nextServiceDate: string;
  daysToService: number;
  regulatoryAuthority?: 'BSTI' | 'Dept. of Explosives (DoE)' | 'ASME / API-510' | 'BRTA' | 'ISO-17025' | 'Corporate IT';
  defectQuery?: {
    reason: string;
    observation: string;
    improvementsRequired: string;
    reportedBy: string;
    reportedAt: string;
  };
  spares: AssetSpareItem[];
  custodyHistory: CustodyRecord[];
  lifecycleEvents: AssetLifecycleEvent[];
  disposalDossier?: AssetDisposalDossier;
}

export interface AssetWorkOrder {
  id: string;
  woNumber: string;
  assetId: string;
  assetTag: string;
  assetName: string;
  type: 'PM' | 'CM' | 'CBM' | 'CAL';
  priority: 'critical' | 'high' | 'routine';
  title: string;
  assignedEngineer: string;
  facility: AssetFacility;
  lotoPermitRef?: string;
  regulatoryBody?: string;
  estimatedCostBdt: number;
  isCapexOverhaul: boolean;
  coveredByWarranty: boolean;
  status: 'scheduled' | 'in_progress' | 'completed';
  dueDate: string;
  completedDate?: string;
  certificateNo?: string;
  remarks: string;
}

export interface AssetRequisition {
  id: string;
  reqNumber: string;
  title: string;
  category: AssetCategory;
  criticality: AssetCriticality;
  facility: AssetFacility;
  department: string;
  requestedBy: string;
  requestedByEmpId?: string;
  requestedDate: string;
  estimatedCapexBdt: number;
  justification: string;
  specs: string;
  urgency: 'critical' | 'high' | 'normal';
  stage: 'pending_hod' | 'pending_executive' | 'approved_procuring' | 'commissioned' | 'rejected';
  endorsedByHod?: string;
  sanctionedByExec?: string;
  mintedAssetTag?: string;
  rejectionNote?: string;
}

export interface AssetTransfer {
  id: string;
  transferRef: string;
  assetId: string;
  assetTag: string;
  assetName: string;
  fromFacility: AssetFacility;
  toFacility: AssetFacility;
  fromLocation: string;
  toLocation: string;
  fromCustodian: string;
  toCustodian: string;
  toCustodianEmpId?: string;
  toDepartment: string;
  gatePassNo: string;
  reason: string;
  status: 'in_transit' | 'completed';
  initiatedBy: string;
  initiatedAt: string;
  completedAt?: string;
}

export interface AssetFinancialMetrics {
  grossCapitalizedCost: number;
  depreciableBase: number;
  annualDepreciation: number;
  monthlyDepreciation: number;
  accumulatedDepreciation: number;
  netBookValue: number;
  totalCostOfOwnership: number;
  repairToCapexRatioPct: number;
  remainingUsefulLifeYears: number;
  remainingUsefulLifePct: number;
  isEconomicEoLCandidate: boolean;
}

export interface YearlyDepreciationRow {
  yearNumber: number;
  calendarYear: number;
  openingNbv: number;
  annualCharge: number;
  accumulatedDep: number;
  closingNbv: number;
}

/* ──────────────────────────────────────────────────────────────────────────
   RBAC GOVERNANCE MATRIX: Keeps Asset Lifetime Management in exact proper roles
   ────────────────────────────────────────────────────────────────────────── */
export interface AssetRoleConfig {
  roleTitle: string;
  roleTitleBn: string;
  scopeBadge: string;
  scopeBadgeBn: string;
  scopeDescription: string;
  scopeDescriptionBn: string;
  isSelfServiceOnly: boolean;
  defaultCategory: 'all' | AssetCategory;
  canRegisterAsset: boolean;
  canManageWorkOrders: boolean;
  canCertifyCalibration: boolean;
  canTransferCustody: boolean;
  canViewFinancialLedger: boolean;
  canEditDepreciationPolicy: boolean;
  canApproveRequisition: boolean;
  canInitiateDecommission: boolean;
  canAuthorizeWriteOff: boolean;
}

export function getAssetRoleConfig(role: AppRole): AssetRoleConfig {
  switch (role) {
    case 'chairman':
      return {
        roleTitle: 'Executive Capital Portfolio & Write-Off Authority',
        roleTitleBn: 'নির্বাহী মূলধনী পোর্টফোলিও ও অবলোপন অনুমোদন কর্তৃপক্ষ',
        scopeBadge: 'Group-Wide Capital Scope (3 Sites)',
        scopeBadgeBn: 'গ্রুপ-ব্যাপী পূর্ণ মূলধন পরিধি',
        scopeDescription: 'Full balance-sheet valuation, IAS 16 depreciation oversight, high-value CAPEX sanctioning & final condemnation write-off authority.',
        scopeDescriptionBn: 'সকল স্থাপনার মূলধনী সম্পদের মূল্যায়ন, অবচয় পর্যবেক্ষণ, নতুন ক্রয় অনুমোদন ও চূড়ান্ত অবলোপন এখতিয়ার।',
        isSelfServiceOnly: false,
        defaultCategory: 'all',
        canRegisterAsset: true,
        canManageWorkOrders: true,
        canCertifyCalibration: true,
        canTransferCustody: true,
        canViewFinancialLedger: true,
        canEditDepreciationPolicy: true,
        canApproveRequisition: true,
        canInitiateDecommission: true,
        canAuthorizeWriteOff: true,
      };
    case 'plant_gm':
      return {
        roleTitle: 'Chief Plant Reliability, Calibration & Engineering Authority',
        roleTitleBn: 'প্রধান প্ল্যান্ট রক্ষণাবেক্ষণ, ক্যালিব্রেশন ও প্রকৌশল কর্তৃপক্ষ',
        scopeBadge: 'Refinery, SCADA, Lab & HSE Engineering',
        scopeBadgeBn: 'রিফাইনারি, স্কাডা ও নিরাপত্তা প্রকৌশল',
        scopeDescription: 'Commission machinery, certify BSTI/DoE/ASME statutory calibrations, execute PM/CM overhauls, manage BOM spares & initiate condemnation surveys.',
        scopeDescriptionBn: 'যন্ত্রপাতি কমিশনিং, বিএসটিআই/বিস্ফোরক পরিদপ্তর ক্যালিব্রেশন প্রত্যয়ন, ওভারহল কার্যাদেশ ও কারিগরি অকেজো জরিপ পরিচালনা।',
        isSelfServiceOnly: false,
        defaultCategory: 'all',
        canRegisterAsset: true,
        canManageWorkOrders: true,
        canCertifyCalibration: true,
        canTransferCustody: true,
        canViewFinancialLedger: true,
        canEditDepreciationPolicy: false,
        canApproveRequisition: true,
        canInitiateDecommission: true,
        canAuthorizeWriteOff: false,
      };
    case 'hod':
      return {
        roleTitle: 'Fixed Asset Accounting (IAS 16 / SAP FI-AA) & Financial Controller',
        roleTitleBn: 'স্থায়ী সম্পদ হিসাবরক্ষণ (IAS 16) ও আর্থিক নিয়ন্ত্রক',
        scopeBadge: 'SAP FI-AA Valuation & Budget Audit',
        scopeBadgeBn: 'এসএপি স্থায়ী সম্পদ খতিয়ান ও অডিট',
        scopeDescription: 'Audit SLM/WDV/UoP depreciation schedules, monitor TCO repair-to-replacement thresholds, endorse CAPEX budgets & co-authorize asset write-offs.',
        scopeDescriptionBn: 'অবচয় তফসিল নিরীক্ষা, মোট জীবনচক্র ব্যয় (TCO) বিশ্লেষণ, বাজেট অনুমোদন ও অবলোপন লাভ-ক্ষতি হিসাবায়ন।',
        isSelfServiceOnly: false,
        defaultCategory: 'all',
        canRegisterAsset: true,
        canManageWorkOrders: false,
        canCertifyCalibration: false,
        canTransferCustody: true,
        canViewFinancialLedger: true,
        canEditDepreciationPolicy: true,
        canApproveRequisition: true,
        canInitiateDecommission: true,
        canAuthorizeWriteOff: true,
      };
    case 'hr_admin':
      return {
        roleTitle: 'Corporate Infrastructure & Workforce Asset Custody Authority',
        roleTitleBn: 'করপোরেট অবকাঠামো ও কর্মী সম্পদ হেফাজত কর্তৃপক্ষ',
        scopeBadge: 'Workforce ITAM & 4-Way Exit Recovery',
        scopeBadgeBn: 'কর্মী সম্পদ বরাদ্দ ও ছাড়পত্র পুনরুদ্ধার',
        scopeDescription: 'Issue & transfer corporate IT/office assets to personnel, enforce handover signatures, approve staff equipment requests & reclaim assets during offboarding.',
        scopeDescriptionBn: 'কর্মীদের ল্যাপটপ ও প্রাতিষ্ঠানিক সরঞ্জাম বরাদ্দ, হস্তান্তর স্বাক্ষর গ্রহণ এবং চাকরি সমাপ্তিতে সম্পদ পুনরুদ্ধার।',
        isSelfServiceOnly: false,
        defaultCategory: 'all',
        canRegisterAsset: true,
        canManageWorkOrders: true,
        canCertifyCalibration: false,
        canTransferCustody: true,
        canViewFinancialLedger: true,
        canEditDepreciationPolicy: false,
        canApproveRequisition: true,
        canInitiateDecommission: true,
        canAuthorizeWriteOff: false,
      };
    case 'transport_admin':
      return {
        roleTitle: 'Heavy Fleet, Tanker & Logistics Asset Lifecycle Supervisor',
        roleTitleBn: 'ভারী ট্যাংকার বহর ও লজিস্টিক্স সম্পদ তত্ত্বাবধায়ক',
        scopeBadge: 'Fleet, Tanker & Transit Depot Scope',
        scopeBadgeBn: 'ট্যাংকার ও পরিবহন বহর পরিধি',
        scopeDescription: 'Manage 30,000L heated bitumen tankers & corporate fleet lifecycle, BRTA fitness/calibration renewals, depot transfers & overhaul work orders.',
        scopeDescriptionBn: 'বিটুমিন ট্যাংকার ও কোম্পানির গাড়ির ফিটনেস, ক্যালিব্রেশন, ডিপো স্থানান্তর এবং মেরামত জীবনচক্র ব্যবস্থাপনা।',
        isSelfServiceOnly: false,
        defaultCategory: 'vehicle',
        canRegisterAsset: true,
        canManageWorkOrders: true,
        canCertifyCalibration: true,
        canTransferCustody: true,
        canViewFinancialLedger: true,
        canEditDepreciationPolicy: false,
        canApproveRequisition: false,
        canInitiateDecommission: true,
        canAuthorizeWriteOff: false,
      };
    case 'employee':
    default:
      return {
        roleTitle: 'Staff Asset Custodian Self-Service Portal',
        roleTitleBn: 'কর্মী ব্যক্তিগত সম্পদ হেফাজত ও রিকুইজিশন পোর্টাল',
        scopeBadge: 'Personal Custody Scope (EMP-1042)',
        scopeBadgeBn: 'ব্যক্তিগত বরাদ্দকৃত সম্পদ পরিধি',
        scopeDescription: 'View & digitally acknowledge your assigned corporate equipment, inspect QR passports, report hardware defects & request new or replacement work assets.',
        scopeDescriptionBn: 'আপনার নামে বরাদ্দকৃত প্রাতিষ্ঠানিক সরঞ্জাম দেখুন, ডিজিটাল গ্রহণ স্বাক্ষর করুন, ত্রুটি জানান ও নতুন সরঞ্জামের আবেদন করুন।',
        isSelfServiceOnly: true,
        defaultCategory: 'all',
        canRegisterAsset: false,
        canManageWorkOrders: false,
        canCertifyCalibration: false,
        canTransferCustody: false,
        canViewFinancialLedger: false,
        canEditDepreciationPolicy: false,
        canApproveRequisition: false,
        canInitiateDecommission: false,
        canAuthorizeWriteOff: false,
      };
  }
}

/* ──────────────────────────────────────────────────────────────────────────
   IAS 16 / BAS 16 DEPRECIATION & TCO CALCULATION ENGINE
   ────────────────────────────────────────────────────────────────────────── */
export function calculateAssetFinancials(asset: AssetRecord): AssetFinancialMetrics {
  const grossCapitalizedCost = asset.purchaseCost + (asset.capitalizedAdditions || 0);
  const salvage = Math.min(asset.salvageValue, grossCapitalizedCost * 0.5);
  const depreciableBase = Math.max(0, grossCapitalizedCost - salvage);
  const usefulLife = Math.max(1, asset.usefulLifeYears);

  let annualDepreciation = 0;
  let accumulatedDepreciation = 0;

  if (asset.depreciationMethod === 'SLM') {
    annualDepreciation = depreciableBase / usefulLife;
    accumulatedDepreciation = Math.min(depreciableBase, annualDepreciation * asset.ageYears);
  } else if (asset.depreciationMethod === 'WDV') {
    const rate = Math.min(0.35, Math.max(0.12, 1 - Math.pow(Math.max(salvage, 1) / Math.max(grossCapitalizedCost, 1), 1 / usefulLife)));
    const currentNbvRaw = grossCapitalizedCost * Math.pow(1 - rate, asset.ageYears);
    const clampedNbv = Math.max(salvage, currentNbvRaw);
    accumulatedDepreciation = Math.max(0, grossCapitalizedCost - clampedNbv);
    annualDepreciation = clampedNbv > salvage ? Math.min(clampedNbv - salvage, clampedNbv * rate) : 0;
  } else {
    // Units of Production (UOP)
    const ratedHrs = Math.max(1, asset.ratedLifetimeHours);
    const ratio = Math.min(1, asset.runtimeHours / ratedHrs);
    accumulatedDepreciation = depreciableBase * ratio;
    const avgHrsPerYear = asset.ageYears > 0 ? asset.runtimeHours / asset.ageYears : ratedHrs / usefulLife;
    annualDepreciation = Math.min(depreciableBase - accumulatedDepreciation, depreciableBase * (avgHrsPerYear / ratedHrs));
  }

  if (asset.lifecycleStage === 'disposed') {
    annualDepreciation = 0;
  }

  const netBookValue =
    asset.lifecycleStage === 'disposed'
      ? 0
      : Math.max(salvage, Math.round(grossCapitalizedCost - accumulatedDepreciation));

  const totalCostOfOwnership =
    grossCapitalizedCost + asset.cumulativeMaintenanceOpex - (asset.disposalDossier?.salvageProceedsBdt ?? salvage);

  const repairToCapexRatioPct =
    grossCapitalizedCost > 0 ? Number(((asset.cumulativeMaintenanceOpex / grossCapitalizedCost) * 100).toFixed(1)) : 0;

  const remainingUsefulLifeYears = Math.max(0, Number((usefulLife - asset.ageYears).toFixed(1)));
  const remainingUsefulLifePct = Math.max(0, Math.min(100, Math.round((remainingUsefulLifeYears / usefulLife) * 100)));

  const isEconomicEoLCandidate =
    asset.lifecycleStage !== 'disposed' &&
    (repairToCapexRatioPct >= 50 || (remainingUsefulLifeYears <= 0.5 && asset.healthScore < 55) || asset.lifecycleStage === 'decommissioned');

  return {
    grossCapitalizedCost: Math.round(grossCapitalizedCost),
    depreciableBase: Math.round(depreciableBase),
    annualDepreciation: Math.round(annualDepreciation),
    monthlyDepreciation: Math.round(annualDepreciation / 12),
    accumulatedDepreciation: Math.round(accumulatedDepreciation),
    netBookValue,
    totalCostOfOwnership: Math.round(totalCostOfOwnership),
    repairToCapexRatioPct,
    remainingUsefulLifeYears,
    remainingUsefulLifePct,
    isEconomicEoLCandidate,
  };
}

export function buildDepreciationSchedule(asset: AssetRecord): YearlyDepreciationRow[] {
  const gross = asset.purchaseCost + (asset.capitalizedAdditions || 0);
  const salvage = Math.min(asset.salvageValue, gross * 0.5);
  const base = Math.max(0, gross - salvage);
  const years = Math.max(1, Math.round(asset.usefulLifeYears));
  const startYear = 2026 - Math.floor(asset.ageYears);

  const rows: YearlyDepreciationRow[] = [];
  let opening = gross;
  let acc = 0;
  const wdvRate = Math.min(0.35, Math.max(0.12, 1 - Math.pow(Math.max(salvage, 1) / Math.max(gross, 1), 1 / years)));

  for (let y = 1; y <= years; y++) {
    let charge = 0;
    if (asset.depreciationMethod === 'WDV') {
      charge = y === years ? Math.max(0, opening - salvage) : Math.min(Math.max(0, opening - salvage), opening * wdvRate);
    } else {
      charge = y === years ? Math.max(0, opening - salvage) : base / years;
    }
    charge = Math.round(charge);
    acc = Math.min(base, acc + charge);
    const closing = Math.max(salvage, Math.round(gross - acc));
    rows.push({
      yearNumber: y,
      calendarYear: startYear + y - 1,
      openingNbv: Math.round(opening),
      annualCharge: charge,
      accumulatedDep: Math.round(acc),
      closingNbv: closing,
    });
    opening = closing;
  }
  return rows;
}

const makeHash = (seed: string) => {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  const hex = (h >>> 0).toString(16).padStart(8, '0');
  return `SHA256:${hex}e4b9c21f7a08d3${hex}`;
};

/* ──────────────────────────────────────────────────────────────────────────
   INITIAL ENTERPRISE DATASET (11 Realistic BOGCL Cradle-to-Grave Assets)
   ────────────────────────────────────────────────────────────────────────── */
const INITIAL_ASSETS: AssetRecord[] = [
  {
    id: 'AST-001',
    tag: 'BOGCL-KER-PMP-102',
    sapAssetNo: 'AA-4102-00102',
    name: 'Sulzer Multiphase Crude Oil Feed Pump',
    category: 'plant',
    criticality: 'critical_a',
    lifecycleStage: 'operational',
    facility: 'Keraniganj Bitumen Refinery',
    functionalLocation: 'Unit-1 Crude Feed Pumping Skid A',
    glCostCenter: 'GL-4102-KER',
    department: 'Plant Operations',
    custodian: 'Engr. Md. Harunur Rashid',
    custodianEmpId: 'EMP-0012',
    custodianAcknowledged: true,
    oem: 'Sulzer Pumps AG (Switzerland)',
    modelNo: 'MPP-350-42B-EX',
    serialNo: 'SLZ-MPP-99214-DE',
    specs: 'Flow: 350 m³/h, Discharge: 42 Bar, Motor: 180kW ABB ATEX Zone-1 Explosion-Proof',
    procurementDate: '12 Jan 2022',
    commissioningDate: '04 Feb 2022',
    ageYears: 4.8,
    usefulLifeYears: 15,
    purchaseCost: 8500000,
    capitalizedAdditions: 450000,
    salvageValue: 850000,
    depreciationMethod: 'UOP',
    cumulativeMaintenanceOpex: 1120000,
    warrantyExpiry: '04 Feb 2025',
    isUnderWarranty: false,
    amcVendor: 'Sulzer Bangladesh Technical Services',
    runtimeHours: 28450,
    ratedLifetimeHours: 90000,
    healthScore: 94,
    mtbfHours: 4320,
    mttrHours: 3.5,
    calibrationCycleDays: 180,
    nextServiceDate: '26 Nov 2026',
    daysToService: 28,
    regulatoryAuthority: 'ASME / API-510',
    spares: [
      { id: 'SP-101', partNo: 'SLZ-MS-882', name: 'Tungsten Carbide Double Mechanical Seal Kit', stockQty: 2, minReorderQty: 2, unitCostBdt: 185000, leadTimeDays: 21 },
      { id: 'SP-102', partNo: 'ABB-BRG-6319', name: 'SKF Insulated Ceramic Drive-End Bearing', stockQty: 4, minReorderQty: 2, unitCostBdt: 42000, leadTimeDays: 7 },
    ],
    custodyHistory: [
      {
        id: 'CH-001',
        custodianName: 'Engr. Md. Harunur Rashid',
        custodianEmpId: 'EMP-0012',
        department: 'Plant Operations',
        facility: 'Keraniganj Bitumen Refinery',
        functionalLocation: 'Unit-1 Crude Feed Pumping Skid A',
        assignedDate: '04 Feb 2022',
        acknowledged: true,
        acknowledgedAt: '04 Feb 2022, 11:20 AM',
        conditionOnHandover: 'Brand New — FAT & SAT Passed at 42 Bar Hydro-Test',
      },
    ],
    lifecycleEvents: [
      {
        id: 'EV-101',
        eventType: 'REQUISITION_APPROVED',
        stage: 'in_stock',
        title: 'CAPEX Sanctioned by Board & Chairman',
        notes: 'Approved under Keraniganj Phase-II Refinery Expansion CAPEX Note-Sheet #NS-2021-409.',
        actor: 'Ahmed Akbar Sobhan',
        actorRole: 'Chairman & Managing Director',
        timestamp: '10 Nov 2021',
        financialDeltaBdt: 8500000,
        sapRef: 'SAP-PR-2021-0409',
        hash: makeHash('AST-001-1'),
      },
      {
        id: 'EV-102',
        eventType: 'COMMISSIONED',
        stage: 'operational',
        title: 'SAT Hydro-Test Passed & Capitalized in SAP FI-AA',
        notes: 'Laser-etched stainless QR plate riveted. Assigned to Plant GM custody.',
        actor: 'Engr. Md. Harunur Rashid',
        actorRole: 'Plant General Manager',
        timestamp: '04 Feb 2022',
        sapRef: 'AA-4102-00102',
        hash: makeHash('AST-001-2'),
      },
      {
        id: 'EV-103',
        eventType: 'CAPEX_OVERHAUL',
        stage: 'operational',
        title: 'Impeller Trim Upgrade & VFD Harmonic Filter Retrofit',
        notes: 'Life-extending throughput upgrade (+8% efficiency) capitalized under IAS 16.',
        actor: 'Farida Begum',
        actorRole: 'Head of Finance & Accounts',
        timestamp: '19 May 2025',
        financialDeltaBdt: 450000,
        sapRef: 'SAP-AA-CAP-2509',
        hash: makeHash('AST-001-3'),
      },
    ],
  },
  {
    id: 'AST-002',
    tag: 'BOGCL-KER-DST-C102',
    sapAssetNo: 'AA-4102-00018',
    name: 'Atmospheric Bitumen Distillation Tower C-102',
    category: 'plant',
    criticality: 'critical_a',
    lifecycleStage: 'calibration_due',
    facility: 'Keraniganj Bitumen Refinery',
    functionalLocation: 'Column Farm — Atmospheric Vacuum Unit',
    glCostCenter: 'GL-4102-KER',
    department: 'Plant Operations',
    custodian: 'Engr. Tariqul Islam',
    custodianEmpId: 'EMP-1088',
    custodianAcknowledged: true,
    oem: 'Larsen & Toubro Heavy Engineering',
    modelNo: 'AVU-COL-38M-ASME',
    serialNo: 'BOGCL-FAB-2020-09',
    specs: 'Height: 38m, Dia: 3.2m, Operating Temp: 385°C, 34 Valve Trays, ASME Sec VIII Div 1',
    procurementDate: '18 Nov 2020',
    commissioningDate: '15 Jan 2021',
    ageYears: 5.8,
    usefulLifeYears: 20,
    purchaseCost: 65000000,
    capitalizedAdditions: 2500000,
    salvageValue: 6500000,
    depreciationMethod: 'SLM',
    cumulativeMaintenanceOpex: 4850000,
    warrantyExpiry: '15 Jan 2024',
    isUnderWarranty: false,
    amcVendor: 'Bureau Veritas NDT & Statutory Inspection',
    runtimeHours: 47200,
    ratedLifetimeHours: 160000,
    healthScore: 88,
    mtbfHours: 8600,
    mttrHours: 18.0,
    calibrationCycleDays: 365,
    nextServiceDate: '09 Nov 2026',
    daysToService: 11,
    regulatoryAuthority: 'Dept. of Explosives (DoE)',
    spares: [
      { id: 'SP-201', partNo: 'ASME-PSV-400', name: '4-Inch Spring-Loaded Pressure Safety Relief Valve', stockQty: 1, minReorderQty: 2, unitCostBdt: 490000, leadTimeDays: 30 },
      { id: 'SP-202', partNo: 'GKT-SPW-3200', name: 'Spiral Wound Graphite Manway Gasket Set (380°C)', stockQty: 6, minReorderQty: 3, unitCostBdt: 38000, leadTimeDays: 10 },
    ],
    custodyHistory: [
      {
        id: 'CH-002',
        custodianName: 'Engr. Tariqul Islam',
        custodianEmpId: 'EMP-1088',
        department: 'Plant Operations',
        facility: 'Keraniganj Bitumen Refinery',
        functionalLocation: 'Column Farm — Atmospheric Vacuum Unit',
        assignedDate: '15 Jan 2021',
        acknowledged: true,
        acknowledgedAt: '15 Jan 2021, 09:00 AM',
        conditionOnHandover: 'ASME U-Stamp Certified Commissioning',
      },
    ],
    lifecycleEvents: [
      {
        id: 'EV-201',
        eventType: 'COMMISSIONED',
        stage: 'operational',
        title: 'Commissioned with DoE & ASME Sec VIII U-Stamp',
        notes: 'Primary 5,000 MT/day atmospheric residue & 60/70 penetration bitumen column.',
        actor: 'Engr. Md. Harunur Rashid',
        actorRole: 'Plant General Manager',
        timestamp: '15 Jan 2021',
        financialDeltaBdt: 65000000,
        sapRef: 'AA-4102-00018',
        hash: makeHash('AST-002-1'),
      },
      {
        id: 'EV-202',
        eventType: 'PM_CERTIFIED',
        stage: 'calibration_due',
        title: 'T-15 Statutory Ultrasonic Wall Thickness NDT Alert Triggered',
        notes: 'Annual DoE & API-510 shell thickness & PSV pop-test scheduled within 11 days.',
        actor: 'OneOps Compliance Scheduler',
        actorRole: 'Automated Statutory Engine',
        timestamp: '25 Oct 2026',
        hash: makeHash('AST-002-2'),
      },
    ],
  },
  {
    id: 'AST-003',
    tag: 'BOGCL-FLT-TNK-08',
    sapAssetNo: 'AA-4205-00008',
    name: 'Scania R500 Heated Bulk Bitumen Tanker (30,000L)',
    category: 'vehicle',
    criticality: 'essential_b',
    lifecycleStage: 'operational',
    facility: 'Chattogram Patenga Terminal',
    functionalLocation: 'Heavy Transit Pool — Bay 04 (Dhaka-CTG Corridor)',
    glCostCenter: 'GL-4205-FLT',
    department: 'Transport & Logistics',
    custodian: 'Md. Kamruzzaman',
    custodianEmpId: 'EMP-0045',
    custodianAcknowledged: true,
    oem: 'Scania CV AB (Sweden)',
    modelNo: 'R500-A6X4NZ-BIT30K',
    serialNo: 'YS2R6X200021948',
    specs: '30,000L Rockwool Insulated Thermal Bitumen Tank (200°C), Dual Diesel Burner, GPS + Fuel Dip Telemetry',
    procurementDate: '05 Mar 2023',
    commissioningDate: '20 Mar 2023',
    ageYears: 3.6,
    usefulLifeYears: 10,
    purchaseCost: 12500000,
    capitalizedAdditions: 0,
    salvageValue: 1800000,
    depreciationMethod: 'WDV',
    cumulativeMaintenanceOpex: 940000,
    warrantyExpiry: '20 Mar 2026',
    isUnderWarranty: false,
    amcVendor: 'Runner Motors Heavy Commercial Workshop',
    runtimeHours: 14800,
    ratedLifetimeHours: 45000,
    healthScore: 91,
    mtbfHours: 2900,
    mttrHours: 5.0,
    calibrationCycleDays: 180,
    nextServiceDate: '21 Dec 2026',
    daysToService: 53,
    regulatoryAuthority: 'BRTA',
    spares: [
      { id: 'SP-301', partNo: 'SCN-BRK-994', name: 'Heavy-Duty Rear Axle Pneumatic Brake Pad Kit', stockQty: 3, minReorderQty: 2, unitCostBdt: 64000, leadTimeDays: 5 },
    ],
    custodyHistory: [
      {
        id: 'CH-003',
        custodianName: 'Md. Kamruzzaman',
        custodianEmpId: 'EMP-0045',
        department: 'Transport & Logistics',
        facility: 'Chattogram Patenga Terminal',
        functionalLocation: 'Heavy Transit Pool — Bay 04',
        assignedDate: '20 Mar 2023',
        acknowledged: true,
        acknowledgedAt: '20 Mar 2023, 03:15 PM',
        conditionOnHandover: 'BRTA & BSTI Volumetric Dip-Chart Sealed',
      },
    ],
    lifecycleEvents: [
      {
        id: 'EV-301',
        eventType: 'COMMISSIONED',
        stage: 'operational',
        title: 'Registered with BRTA & BSTI 30,000L Volumetric Calibration',
        notes: 'Deployed to Dhaka–Chattogram RHD Highway bulk hot-bitumen delivery fleet.',
        actor: 'Md. Kamruzzaman',
        actorRole: 'Transport & Admin Supervisor',
        timestamp: '20 Mar 2023',
        financialDeltaBdt: 12500000,
        sapRef: 'AA-4205-00008',
        hash: makeHash('AST-003-1'),
      },
    ],
  },
  {
    id: 'AST-004',
    tag: 'BOGCL-IT-SRV-04',
    sapAssetNo: 'AA-4301-00044',
    name: 'HPE ProLiant DL380 Gen10 Plus SCADA Historian Server',
    category: 'it',
    criticality: 'critical_a',
    lifecycleStage: 'operational',
    facility: 'Keraniganj Bitumen Refinery',
    functionalLocation: 'Control Room Tier-3 Server Suite — Rack B02',
    glCostCenter: 'GL-4301-ICT',
    department: 'Plant Operations',
    custodian: 'Engr. Tariqul Islam',
    custodianEmpId: 'EMP-1088',
    custodianAcknowledged: true,
    oem: 'Hewlett Packard Enterprise',
    modelNo: 'DL380-G10P-24SFF',
    serialNo: 'HPE-CZJ240187B',
    specs: 'Dual Xeon Gold 6330 (56C), 256GB ECC RAM, 15.3TB RAID-10 Enterprise NVMe, Dual 1600W Titanium PSU',
    procurementDate: '10 Aug 2024',
    commissioningDate: '22 Aug 2024',
    ageYears: 2.2,
    usefulLifeYears: 5,
    purchaseCost: 1850000,
    capitalizedAdditions: 0,
    salvageValue: 150000,
    depreciationMethod: 'SLM',
    cumulativeMaintenanceOpex: 65000,
    warrantyExpiry: '22 Aug 2027',
    isUnderWarranty: true,
    amcVendor: 'HPE Pointnext 24x7 4-Hr Mission Critical',
    runtimeHours: 19100,
    ratedLifetimeHours: 43800,
    healthScore: 99,
    mtbfHours: 19100,
    mttrHours: 1.5,
    calibrationCycleDays: 180,
    nextServiceDate: '11 Feb 2027',
    daysToService: 105,
    regulatoryAuthority: 'Corporate IT',
    spares: [
      { id: 'SP-401', partNo: 'HPE-NVME-192', name: '1.92TB U.3 Hot-Plug Mixed-Use NVMe SSD', stockQty: 2, minReorderQty: 1, unitCostBdt: 92000, leadTimeDays: 3 },
    ],
    custodyHistory: [
      {
        id: 'CH-004',
        custodianName: 'Engr. Tariqul Islam',
        custodianEmpId: 'EMP-1088',
        department: 'Plant Operations',
        facility: 'Keraniganj Bitumen Refinery',
        functionalLocation: 'Control Room Tier-3 Server Suite',
        assignedDate: '22 Aug 2024',
        acknowledged: true,
        acknowledgedAt: '22 Aug 2024, 05:40 PM',
        conditionOnHandover: 'Burn-in & Failover Cluster Verified',
      },
    ],
    lifecycleEvents: [
      {
        id: 'EV-401',
        eventType: 'COMMISSIONED',
        stage: 'operational',
        title: 'SCADA DCS Historian Cluster Node Commissioned (3-Yr HPE Warranty)',
        notes: 'Zero-downtime redundant historian streaming 4,200 Keraniganj PLC tags.',
        actor: 'Engr. Tariqul Islam',
        actorRole: 'Lead SCADA & Automation Engineer',
        timestamp: '22 Aug 2024',
        financialDeltaBdt: 1850000,
        sapRef: 'AA-4301-00044',
        hash: makeHash('AST-004-1'),
      },
    ],
  },
  {
    id: 'AST-005',
    tag: 'BOGCL-SFT-DET-18',
    sapAssetNo: 'AA-4109-00081',
    name: 'Honeywell Searchpoint Optima Plus H2S & LEL Flame Array',
    category: 'safety',
    criticality: 'critical_a',
    lifecycleStage: 'maintenance',
    facility: 'Keraniganj Bitumen Refinery',
    functionalLocation: 'Sulfur Recovery Unit (SRU) — Perimeter Zone 0',
    glCostCenter: 'GL-4109-HSE',
    department: 'HSE & Compliance',
    custodian: 'Nazmul Huda',
    custodianEmpId: 'EMP-1104',
    custodianAcknowledged: true,
    oem: 'Honeywell Analytics (UK)',
    modelNo: 'OPTIMA-PLUS-ATEX-Z0',
    serialNo: 'HW-FGD-88102-BD',
    specs: 'ATEX Zone-0 / SIL-2 Certified Infrared Hydrocarbon + Electrochemical Toxic H2S Loop, 4-20mA HART',
    procurementDate: '14 Feb 2024',
    commissioningDate: '01 Mar 2024',
    ageYears: 2.6,
    usefulLifeYears: 7,
    purchaseCost: 950000,
    capitalizedAdditions: 0,
    salvageValue: 50000,
    depreciationMethod: 'SLM',
    cumulativeMaintenanceOpex: 115000,
    warrantyExpiry: '01 Mar 2027',
    isUnderWarranty: true,
    amcVendor: 'Honeywell Process Solutions Authorized BD',
    runtimeHours: 22900,
    ratedLifetimeHours: 61320,
    healthScore: 81,
    mtbfHours: 5200,
    mttrHours: 2.0,
    calibrationCycleDays: 90,
    nextServiceDate: '03 Nov 2026',
    daysToService: 5,
    regulatoryAuthority: 'Dept. of Explosives (DoE)',
    spares: [
      { id: 'SP-501', partNo: 'HW-H2S-CELL', name: 'Electrochemical H2S Sensor Cartridge (0-100 ppm)', stockQty: 1, minReorderQty: 3, unitCostBdt: 48000, leadTimeDays: 14 },
    ],
    custodyHistory: [
      {
        id: 'CH-005',
        custodianName: 'Nazmul Huda',
        custodianEmpId: 'EMP-1104',
        department: 'HSE & Compliance',
        facility: 'Keraniganj Bitumen Refinery',
        functionalLocation: 'Sulfur Recovery Unit (SRU)',
        assignedDate: '01 Mar 2024',
        acknowledged: true,
        acknowledgedAt: '01 Mar 2024, 10:15 AM',
        conditionOnHandover: 'SIL-2 Loop & ESD Trip Matrix Tested',
      },
    ],
    lifecycleEvents: [
      {
        id: 'EV-501',
        eventType: 'COMMISSIONED',
        stage: 'operational',
        title: 'ATEX Zone-0 Toxic H2S Detection Loop Activated',
        notes: 'Interlocked with Refinery Emergency Shutdown (ESD) Deluge Valve.',
        actor: 'Nazmul Huda',
        actorRole: 'Senior Safety & Environmental Inspector',
        timestamp: '01 Mar 2024',
        financialDeltaBdt: 950000,
        sapRef: 'AA-4109-00081',
        hash: makeHash('AST-005-1'),
      },
      {
        id: 'EV-502',
        eventType: 'DEFECT_FLAGGED',
        stage: 'maintenance',
        title: 'Span-Gas Bump Test Drift Detected on Node #3',
        notes: 'Placed under LOTO maintenance for optical mirror cleaning & zero-span recalibration under OEM warranty.',
        actor: 'Nazmul Huda',
        actorRole: 'Senior Safety & Environmental Inspector',
        timestamp: '27 Oct 2026',
        hash: makeHash('AST-005-2'),
      },
    ],
  },
  {
    id: 'AST-006',
    tag: 'BOGCL-LAB-PEN-03',
    sapAssetNo: 'AA-4115-00019',
    name: 'Anton Paar PNR-12 Automatic Bitumen Penetrometer',
    category: 'lab',
    criticality: 'essential_b',
    lifecycleStage: 'calibration_due',
    facility: 'Keraniganj Bitumen Refinery',
    functionalLocation: 'Central QC Metrology Laboratory — Bench 02',
    glCostCenter: 'GL-4115-QCL',
    department: 'Plant Operations',
    custodian: 'Engr. Md. Harunur Rashid',
    custodianEmpId: 'EMP-0012',
    custodianAcknowledged: true,
    oem: 'Anton Paar GmbH (Austria)',
    modelNo: 'PNR-12-ASTM-D5',
    serialNo: 'AP-83920144-AT',
    specs: 'ASTM D5 / BDS 1238 Bitumen 60/70 Penetration Metrology, 0.01 mm Optical Resolution, Peltier Bath 25.0°C',
    procurementDate: '12 May 2023',
    commissioningDate: '28 May 2023',
    ageYears: 3.4,
    usefulLifeYears: 8,
    purchaseCost: 1420000,
    capitalizedAdditions: 0,
    salvageValue: 100000,
    depreciationMethod: 'SLM',
    cumulativeMaintenanceOpex: 95000,
    warrantyExpiry: '28 May 2025',
    isUnderWarranty: false,
    amcVendor: 'BSTI National Metrology Reference Lab',
    runtimeHours: 6400,
    ratedLifetimeHours: 24000,
    healthScore: 93,
    mtbfHours: 6400,
    mttrHours: 2.5,
    calibrationCycleDays: 180,
    nextServiceDate: '07 Nov 2026',
    daysToService: 9,
    regulatoryAuthority: 'BSTI',
    spares: [
      { id: 'SP-601', partNo: 'ASTM-NDL-25G', name: 'NIST/BSTI Certified 2.50g Hardened Penetration Needle', stockQty: 5, minReorderQty: 2, unitCostBdt: 18500, leadTimeDays: 10 },
    ],
    custodyHistory: [
      {
        id: 'CH-006A',
        custodianName: 'Khadija Akhter (Offboarded)',
        custodianEmpId: 'EMP-0640',
        department: 'Plant Operations',
        facility: 'Keraniganj Bitumen Refinery',
        functionalLocation: 'Central QC Metrology Laboratory',
        assignedDate: '28 May 2023',
        returnedDate: '30 Aug 2026',
        acknowledged: true,
        acknowledgedAt: '28 May 2023, 02:00 PM',
        conditionOnHandover: 'ISO 17025 Certified',
      },
      {
        id: 'CH-006B',
        custodianName: 'Engr. Md. Harunur Rashid',
        custodianEmpId: 'EMP-0012',
        department: 'Plant Operations',
        facility: 'Keraniganj Bitumen Refinery',
        functionalLocation: 'Central QC Metrology Laboratory',
        assignedDate: '30 Aug 2026',
        acknowledged: true,
        acknowledgedAt: '30 Aug 2026, 05:10 PM',
        conditionOnHandover: 'Reassigned upon Senior Chemist exit clearance verification',
      },
    ],
    lifecycleEvents: [
      {
        id: 'EV-601',
        eventType: 'COMMISSIONED',
        stage: 'operational',
        title: 'BSTI Reference Metrology Calibration Certified',
        notes: 'Primary batch-release instrument for BOGCL 60/70 & 80/100 Penetration Grade Bitumen.',
        actor: 'Engr. Md. Harunur Rashid',
        actorRole: 'Plant General Manager',
        timestamp: '28 May 2023',
        financialDeltaBdt: 1420000,
        sapRef: 'AA-4115-00019',
        hash: makeHash('AST-006-1'),
      },
      {
        id: 'EV-602',
        eventType: 'CUSTODY_RECLAIMED',
        stage: 'operational',
        title: 'Custody Transferred During HR 4-Way Exit Clearance (EMP-0640)',
        notes: 'Recovered from outgoing Senior Chemist Khadija Akhter & reassigned to Plant GM oversight.',
        actor: 'Sayeda Afroza Sultana',
        actorRole: 'GM, HR & Corporate Services',
        timestamp: '30 Aug 2026',
        hash: makeHash('AST-006-2'),
      },
    ],
  },
  {
    id: 'AST-007',
    tag: 'BOGCL-HQ-LTP-419',
    sapAssetNo: 'AA-4301-00419',
    name: 'Lenovo ThinkPad X1 Carbon Gen 11 Corporate Ultrabook',
    category: 'it',
    criticality: 'general_c',
    lifecycleStage: 'operational',
    facility: 'Bashundhara Corporate HQ, Baridhara',
    functionalLocation: 'Level-7 Commercial & Sales Wing — Desk 14',
    glCostCenter: 'GL-4301-ICT',
    department: 'Sales & Distribution',
    custodian: 'Tanvir Ahmed',
    custodianEmpId: 'EMP-1042',
    custodianAcknowledged: true,
    oem: 'Lenovo Enterprise',
    modelNo: '21HM-X1C-G11',
    serialNo: 'PF-4L992K-BD',
    specs: 'Intel Core i7-1365U vPro, 32GB LPDDR5, 1TB Opal2 Encrypted NVMe, BitLocker + CrowdStrike EDR',
    procurementDate: '10 Jun 2024',
    commissioningDate: '15 Jun 2024',
    ageYears: 2.3,
    usefulLifeYears: 4,
    purchaseCost: 215000,
    capitalizedAdditions: 0,
    salvageValue: 20000,
    depreciationMethod: 'SLM',
    cumulativeMaintenanceOpex: 0,
    warrantyExpiry: '15 Jun 2027',
    isUnderWarranty: true,
    amcVendor: 'Lenovo Premier Support Bangladesh',
    runtimeHours: 4900,
    ratedLifetimeHours: 14000,
    healthScore: 96,
    mtbfHours: 4900,
    mttrHours: 2.0,
    calibrationCycleDays: 365,
    nextServiceDate: '15 Jun 2027',
    daysToService: 229,
    regulatoryAuthority: 'Corporate IT',
    spares: [],
    custodyHistory: [
      {
        id: 'CH-007',
        custodianName: 'Tanvir Ahmed',
        custodianEmpId: 'EMP-1042',
        department: 'Sales & Distribution',
        facility: 'Bashundhara Corporate HQ, Baridhara',
        functionalLocation: 'Level-7 Commercial & Sales Wing',
        assignedDate: '15 Jun 2024',
        acknowledged: true,
        acknowledgedAt: '15 Jun 2024, 11:45 AM',
        conditionOnHandover: 'New Sealed Box + Docking Station & YubiKey 5C',
      },
    ],
    lifecycleEvents: [
      {
        id: 'EV-701',
        eventType: 'CUSTODY_SIGNED',
        stage: 'operational',
        title: 'Issued to Tanvir Ahmed (EMP-1042) with Cryptographic Handover Receipt',
        notes: 'Enrolled in Bashundhara Intune MDM & SAP GUI SSO.',
        actor: 'Tanvir Ahmed',
        actorRole: 'Senior Sales & Distribution Specialist',
        timestamp: '15 Jun 2024',
        financialDeltaBdt: 215000,
        sapRef: 'AA-4301-00419',
        hash: makeHash('AST-007-1'),
      },
    ],
  },
  {
    id: 'AST-008',
    tag: 'BOGCL-HQ-TAB-112',
    sapAssetNo: 'AA-4301-00588',
    name: 'Samsung Galaxy Tab Active4 Pro Rugged Field Sales Terminal',
    category: 'it',
    criticality: 'general_c',
    lifecycleStage: 'operational',
    facility: 'Bashundhara Corporate HQ, Baridhara',
    functionalLocation: 'Sales & Dealer Field Mobility Kit',
    glCostCenter: 'GL-4301-ICT',
    department: 'Sales & Distribution',
    custodian: 'Tanvir Ahmed',
    custodianEmpId: 'EMP-1042',
    custodianAcknowledged: false,
    oem: 'Samsung Electronics',
    modelNo: 'SM-T636B-5G-RUGGED',
    serialNo: 'R52X908172M',
    specs: 'MIL-STD-810H / IP68 Rugged 5G Tablet, S-Pen Digital Challan Signer, NFC Dealer Tag Reader',
    procurementDate: '20 Oct 2026',
    commissioningDate: '26 Oct 2026',
    ageYears: 0.1,
    usefulLifeYears: 4,
    purchaseCost: 110000,
    capitalizedAdditions: 0,
    salvageValue: 10000,
    depreciationMethod: 'SLM',
    cumulativeMaintenanceOpex: 0,
    warrantyExpiry: '26 Oct 2028',
    isUnderWarranty: true,
    amcVendor: 'Samsung Enterprise Mobility BD',
    runtimeHours: 45,
    ratedLifetimeHours: 12000,
    healthScore: 100,
    mtbfHours: 8000,
    mttrHours: 2.0,
    calibrationCycleDays: 365,
    nextServiceDate: '26 Oct 2027',
    daysToService: 362,
    regulatoryAuthority: 'Corporate IT',
    spares: [],
    custodyHistory: [
      {
        id: 'CH-008',
        custodianName: 'Tanvir Ahmed',
        custodianEmpId: 'EMP-1042',
        department: 'Sales & Distribution',
        facility: 'Bashundhara Corporate HQ, Baridhara',
        functionalLocation: 'Sales & Dealer Field Mobility Kit',
        assignedDate: '26 Oct 2026',
        acknowledged: false,
        conditionOnHandover: 'Brand New — Pending Custodian E-Signature Receipt',
      },
    ],
    lifecycleEvents: [
      {
        id: 'EV-801',
        eventType: 'CUSTODY_ASSIGNED',
        stage: 'operational',
        title: 'Allocated from Central IT Store to Tanvir Ahmed (Pending Custodian Sign-Off)',
        notes: 'Issued for Chittagong & Narayanganj bitumen distributor credit/order field audits.',
        actor: 'Sayeda Afroza Sultana',
        actorRole: 'GM, HR & Corporate Services',
        timestamp: '26 Oct 2026',
        financialDeltaBdt: 110000,
        sapRef: 'AA-4301-00588',
        hash: makeHash('AST-008-1'),
      },
    ],
  },
  {
    id: 'AST-009',
    tag: 'BOGCL-HQ-LTP-502',
    sapAssetNo: 'AA-4301-00610',
    name: 'Apple MacBook Pro 16" M3 Max (Executive Reserve Unit)',
    category: 'it',
    criticality: 'general_c',
    lifecycleStage: 'in_stock',
    facility: 'Bashundhara Corporate HQ, Baridhara',
    functionalLocation: 'Central IT & Corporate Store Vault — Locker A4',
    glCostCenter: 'GL-4301-ICT',
    department: 'Human Resources',
    custodian: 'Central Store Pool (Unassigned)',
    custodianAcknowledged: true,
    oem: 'Apple Inc.',
    modelNo: 'MRW13LL/A-M3MAX',
    serialNo: 'C02ZN819MD6R',
    specs: 'Apple M3 Max 16-Core CPU, 48GB Unified Memory, 1TB SSD, Pre-enrolled in Bashundhara Apple ABM',
    procurementDate: '15 Oct 2026',
    commissioningDate: '18 Oct 2026',
    ageYears: 0.1,
    usefulLifeYears: 4,
    purchaseCost: 380000,
    capitalizedAdditions: 0,
    salvageValue: 45000,
    depreciationMethod: 'SLM',
    cumulativeMaintenanceOpex: 0,
    warrantyExpiry: '18 Oct 2029',
    isUnderWarranty: true,
    amcVendor: 'AppleCare+ Enterprise 3-Year',
    runtimeHours: 4,
    ratedLifetimeHours: 14000,
    healthScore: 100,
    mtbfHours: 10000,
    mttrHours: 2.0,
    calibrationCycleDays: 365,
    nextServiceDate: '18 Oct 2027',
    daysToService: 354,
    regulatoryAuthority: 'Corporate IT',
    spares: [],
    custodyHistory: [
      {
        id: 'CH-009',
        custodianName: 'Central Store Pool (Unassigned)',
        department: 'Human Resources',
        facility: 'Bashundhara Corporate HQ, Baridhara',
        functionalLocation: 'Central IT & Corporate Store Vault',
        assignedDate: '18 Oct 2026',
        acknowledged: true,
        acknowledgedAt: '18 Oct 2026, 04:00 PM',
        conditionOnHandover: 'Tagged & Capitalized — Ready for Custodian Allocation',
      },
    ],
    lifecycleEvents: [
      {
        id: 'EV-901',
        eventType: 'CAPITALIZED_TAGGED',
        stage: 'in_stock',
        title: 'GRN Verified, Asset Tag Applied & Stored in Central IT Pool',
        notes: 'Available for immediate executive/engineering onboarding allocation.',
        actor: 'Sayeda Afroza Sultana',
        actorRole: 'GM, HR & Corporate Services',
        timestamp: '18 Oct 2026',
        financialDeltaBdt: 380000,
        sapRef: 'AA-4301-00610',
        hash: makeHash('AST-009-1'),
      },
    ],
  },
  {
    id: 'AST-010',
    tag: 'BOGCL-KER-GEN-01',
    sapAssetNo: 'AA-4102-00004',
    name: 'Caterpillar C18 650kVA Auxiliary Diesel Generator (2014)',
    category: 'plant',
    criticality: 'essential_b',
    lifecycleStage: 'decommissioned',
    facility: 'Keraniganj Bitumen Refinery',
    functionalLocation: 'Old Utility Power House — Condemnation Yard Bay 2',
    glCostCenter: 'GL-4102-KER',
    department: 'Plant Operations',
    custodian: 'Engr. Md. Harunur Rashid',
    custodianEmpId: 'EMP-0012',
    custodianAcknowledged: true,
    oem: 'Caterpillar Inc. (USA)',
    modelNo: 'CAT-C18-650KVA',
    serialNo: 'CAT00C18J91042',
    specs: '650 kVA / 520 kW Prime 415V 3-Phase Diesel Alternator (Replaced by new 1,200 kVA Cummins Unit)',
    procurementDate: '10 Sep 2014',
    commissioningDate: '01 Oct 2014',
    ageYears: 12.0,
    usefulLifeYears: 12,
    purchaseCost: 7200000,
    capitalizedAdditions: 0,
    salvageValue: 720000,
    depreciationMethod: 'SLM',
    cumulativeMaintenanceOpex: 4280000,
    warrantyExpiry: '01 Oct 2017',
    isUnderWarranty: false,
    runtimeHours: 61400,
    ratedLifetimeHours: 60000,
    healthScore: 34,
    mtbfHours: 620,
    mttrHours: 26.0,
    calibrationCycleDays: 180,
    nextServiceDate: 'Decommissioned',
    daysToService: 0,
    regulatoryAuthority: 'ASME / API-510',
    spares: [],
    custodyHistory: [
      {
        id: 'CH-010',
        custodianName: 'Engr. Md. Harunur Rashid',
        custodianEmpId: 'EMP-0012',
        department: 'Plant Operations',
        facility: 'Keraniganj Bitumen Refinery',
        functionalLocation: 'Old Utility Power House',
        assignedDate: '01 Oct 2014',
        acknowledged: true,
        acknowledgedAt: '01 Oct 2014',
        conditionOnHandover: 'Commissioned for Phase-I Utility Load',
      },
    ],
    disposalDossier: {
      reason: 'Economic Life Exhausted',
      surveyNotes: '12-year useful life exhausted (61,400 hrs). Cumulative repair OPEX reached 59.4% of CAPEX with crankshaft journal wear. Isolated under LOTO & drained of lube/diesel.',
      initiatedBy: 'Engr. Md. Harunur Rashid (Plant GM)',
      initiatedDate: '18 Oct 2026',
      checklist: {
        technicalSurveySigned: true,
        decontaminationOrDataWipeCertified: true,
        sparesHarvested: true,
        financeCfoVetted: true,
      },
    },
    lifecycleEvents: [
      {
        id: 'EV-1001',
        eventType: 'COMMISSIONED',
        stage: 'operational',
        title: 'Commissioned at Keraniganj Utility Power House',
        notes: 'Served 61,400 runtime hours across 12 years of continuous refinery utility backup.',
        actor: 'Plant Engineering Division',
        actorRole: 'Commissioning Lead',
        timestamp: '01 Oct 2014',
        financialDeltaBdt: 7200000,
        sapRef: 'AA-4102-00004',
        hash: makeHash('AST-010-1'),
      },
      {
        id: 'EV-1002',
        eventType: 'DECOMMISSION_SURVEY',
        stage: 'decommissioned',
        title: 'Technical Condemnation Survey Signed & LOTO Isolated',
        notes: 'Repair-to-CAPEX ratio hit 59.4%. Fuel/oil purged; starter motor & AVR harvested to spares. Ready for Chairman/CFO Auction Write-Off.',
        actor: 'Engr. Md. Harunur Rashid',
        actorRole: 'Plant General Manager',
        timestamp: '18 Oct 2026',
        hash: makeHash('AST-010-2'),
      },
    ],
  },
  {
    id: 'AST-011',
    tag: 'BOGCL-FLT-SED-02',
    sapAssetNo: 'AA-4205-00002',
    name: 'Toyota Corolla Altis 1.6G Pool Sedan (Dhaka Metro-Ga-39-2109)',
    category: 'vehicle',
    criticality: 'general_c',
    lifecycleStage: 'disposed',
    facility: 'Bashundhara Corporate HQ, Baridhara',
    functionalLocation: 'Retired Fleet Archive (Auctioned)',
    glCostCenter: 'GL-4205-FLT',
    department: 'Transport & Logistics',
    custodian: 'Disposed / Retired Archive',
    custodianAcknowledged: true,
    oem: 'Toyota Motor Corp.',
    modelNo: 'ZRE171R-ALTIS-2017',
    serialNo: 'JTDBR92380019284',
    specs: '1,600cc Executive Pool Sedan — Retired at 2,48,000 km Odometer via Sealed Corporate Tender',
    procurementDate: '14 Mar 2017',
    commissioningDate: '20 Mar 2017',
    ageYears: 9.5,
    usefulLifeYears: 8,
    purchaseCost: 3400000,
    capitalizedAdditions: 0,
    salvageValue: 510000,
    depreciationMethod: 'WDV',
    cumulativeMaintenanceOpex: 1180000,
    warrantyExpiry: '20 Mar 2020',
    isUnderWarranty: false,
    runtimeHours: 9800,
    ratedLifetimeHours: 10000,
    healthScore: 0,
    mtbfHours: 900,
    mttrHours: 12.0,
    calibrationCycleDays: 365,
    nextServiceDate: 'Archived',
    daysToService: 0,
    regulatoryAuthority: 'BRTA',
    spares: [],
    custodyHistory: [
      {
        id: 'CH-011',
        custodianName: 'Md. Kamruzzaman',
        custodianEmpId: 'EMP-0045',
        department: 'Transport & Logistics',
        facility: 'Bashundhara Corporate HQ, Baridhara',
        functionalLocation: 'HQ Pool Dispatch',
        assignedDate: '20 Mar 2017',
        returnedDate: '12 Sep 2026',
        acknowledged: true,
        conditionOnHandover: 'Active Pool Duty (2017–2026)',
      },
    ],
    disposalDossier: {
      reason: 'Economic Life Exhausted',
      surveyNotes: 'Completed 2,48,000 km corporate service. Auctioned via public tender notice #BOGCL-TND-2026-09.',
      initiatedBy: 'Md. Kamruzzaman (Transport Admin)',
      initiatedDate: '01 Sep 2026',
      checklist: {
        technicalSurveySigned: true,
        decontaminationOrDataWipeCertified: true,
        sparesHarvested: true,
        financeCfoVetted: true,
      },
      disposalMethod: 'Public Tender / Auction',
      buyerOrVendor: 'M/S Dhaka Auto Traders (Highest Sealed Bidder)',
      salvageProceedsBdt: 820000,
      netBookValueAtDisposal: 510000,
      gainOrLossBdt: 310000,
      authorizedBy: 'Ahmed Akbar Sobhan (Chairman & MD)',
      disposedDate: '12 Sep 2026',
      sapRetirementVoucher: 'SAP-AA-RET-2026-0041',
    },
    lifecycleEvents: [
      {
        id: 'EV-1101',
        eventType: 'COMMISSIONED',
        stage: 'operational',
        title: 'Commissioned into Baridhara HQ Executive Pool Fleet',
        notes: 'BRTA Registration Dhaka Metro-Ga-39-2109.',
        actor: 'Md. Kamruzzaman',
        actorRole: 'Transport & Admin Supervisor',
        timestamp: '20 Mar 2017',
        financialDeltaBdt: 3400000,
        sapRef: 'AA-4205-00002',
        hash: makeHash('AST-011-1'),
      },
      {
        id: 'EV-1102',
        eventType: 'DISPOSED_ARCHIVED',
        stage: 'disposed',
        title: 'Disposed via Sealed Public Tender (+৳3,10,000 Net Gain Realized)',
        notes: 'Sold for ৳8,20,000 vs NBV ৳5,10,000. BRTA ownership transfer & SAP FI-AA retirement voucher posted. Retained in 10-Yr Statutory Archive.',
        actor: 'Ahmed Akbar Sobhan',
        actorRole: 'Chairman & Managing Director',
        timestamp: '12 Sep 2026',
        financialDeltaBdt: 820000,
        sapRef: 'SAP-AA-RET-2026-0041',
        hash: makeHash('AST-011-2'),
      },
    ],
  },
];

const INITIAL_WORK_ORDERS: AssetWorkOrder[] = [
  {
    id: 'WO-01',
    woNumber: 'WO-2026-0941',
    assetId: 'AST-002',
    assetTag: 'BOGCL-KER-DST-C102',
    assetName: 'Atmospheric Bitumen Distillation Tower C-102',
    type: 'CAL',
    priority: 'critical',
    title: 'Annual DoE & API-510 Ultrasonic Shell Thickness NDT + PSV Pop-Test',
    assignedEngineer: 'Engr. Tariqul Islam & Bureau Veritas Inspector',
    facility: 'Keraniganj Bitumen Refinery',
    lotoPermitRef: 'LOTO-2026-118',
    regulatoryBody: 'Dept. of Explosives (DoE) & ASME',
    estimatedCostBdt: 240000,
    isCapexOverhaul: false,
    coveredByWarranty: false,
    status: 'in_progress',
    dueDate: '09 Nov 2026',
    remarks: 'Ultrasonic thickness grid check on Zones 1–4 and 4-inch safety relief valve bench calibration.',
  },
  {
    id: 'WO-02',
    woNumber: 'WO-2026-0948',
    assetId: 'AST-005',
    assetTag: 'BOGCL-SFT-DET-18',
    assetName: 'Honeywell Searchpoint Optima Plus H2S & LEL Flame Array',
    type: 'CM',
    priority: 'critical',
    title: 'SRU Node #3 Optical Path Cleaning & H2S Span-Gas Recalibration',
    assignedEngineer: 'Nazmul Huda (HSE) & Honeywell OEM Tech',
    facility: 'Keraniganj Bitumen Refinery',
    lotoPermitRef: 'LOTO-2026-124',
    regulatoryBody: 'ATEX / SIL-2 Compliance',
    estimatedCostBdt: 0,
    isCapexOverhaul: false,
    coveredByWarranty: true,
    status: 'in_progress',
    dueDate: '03 Nov 2026',
    remarks: '100% covered under Honeywell 3-Year OEM Warranty (৳0 charge to BOGCL).',
  },
  {
    id: 'WO-03',
    woNumber: 'WO-2026-0952',
    assetId: 'AST-006',
    assetTag: 'BOGCL-LAB-PEN-03',
    assetName: 'Anton Paar PNR-12 Automatic Bitumen Penetrometer',
    type: 'CAL',
    priority: 'high',
    title: 'Semi-Annual BSTI Reference Needle & Peltier 25.0°C Bath Certification',
    assignedEngineer: 'BSTI Metrology Wing & QC Chemist',
    facility: 'Keraniganj Bitumen Refinery',
    regulatoryBody: 'BSTI / ISO-17025',
    estimatedCostBdt: 35000,
    isCapexOverhaul: false,
    coveredByWarranty: false,
    status: 'scheduled',
    dueDate: '07 Nov 2026',
    remarks: 'Mandatory for BDS 1238:2020 RHD Highway Bitumen 60/70 batch release signatory validity.',
  },
  {
    id: 'WO-04',
    woNumber: 'WO-2026-0881',
    assetId: 'AST-001',
    assetTag: 'BOGCL-KER-PMP-102',
    assetName: 'Sulzer Multiphase Crude Oil Feed Pump',
    type: 'PM',
    priority: 'routine',
    title: '28,000-Hr Laser Shaft Alignment, Vibration Spectrum & Lube Oil Analysis',
    assignedEngineer: 'Engr. Md. Harunur Rashid',
    facility: 'Keraniganj Bitumen Refinery',
    regulatoryBody: 'ISO 10816 Vibration Class',
    estimatedCostBdt: 68000,
    isCapexOverhaul: false,
    coveredByWarranty: false,
    status: 'completed',
    dueDate: '15 Sep 2026',
    completedDate: '14 Sep 2026',
    certificateNo: 'CERT-VIB-2026-441',
    remarks: 'RMS vibration at 1.4 mm/s (well below 4.5 mm/s alarm threshold).',
  },
];

const INITIAL_REQUISITIONS: AssetRequisition[] = [
  {
    id: 'REQ-A1',
    reqNumber: 'ARQ-2026-014',
    title: 'Olympus 38DL PLUS Ultrasonic Corrosion Wall-Thickness NDT Gauge',
    category: 'lab',
    criticality: 'critical_a',
    facility: 'Keraniganj Bitumen Refinery',
    department: 'HSE & Compliance',
    requestedBy: 'Nazmul Huda',
    requestedByEmpId: 'EMP-1104',
    requestedDate: '24 Oct 2026',
    estimatedCapexBdt: 680000,
    justification: 'In-house API-510 hot-surface ultrasonic pipe & distillation column thickness auditing to save ৳4.2L/yr in third-party vendor callouts.',
    specs: 'Olympus 38DL PLUS with High-Temp Dual Element Transducer (up to 500°C), IP67 ATEX safe',
    urgency: 'high',
    stage: 'pending_executive',
    endorsedByHod: 'Engr. Md. Harunur Rashid (Plant GM)',
  },
  {
    id: 'REQ-A2',
    reqNumber: 'ARQ-2026-018',
    title: 'Zebra ZQ521 Rugged Bluetooth Field Invoice & Challan Thermal Printer',
    category: 'it',
    criticality: 'general_c',
    facility: 'Bashundhara Corporate HQ, Baridhara',
    department: 'Sales & Distribution',
    requestedBy: 'Tanvir Ahmed',
    requestedByEmpId: 'EMP-1042',
    requestedDate: '27 Oct 2026',
    estimatedCapexBdt: 78000,
    justification: 'Pair with Galaxy Tab Active4 Pro to print instant QR-sealed bitumen dealer delivery receipts during depot visits.',
    specs: 'Zebra ZQ521 4-inch IP54 Rugged Mobile Direct Thermal Printer, Bluetooth 5.0',
    urgency: 'normal',
    stage: 'pending_hod',
  },
  {
    id: 'REQ-A3',
    reqNumber: 'ARQ-2026-021',
    title: 'Emerson Micro Motion Coriolis Mass Flowmeter (Jetty Gantry #2)',
    category: 'plant',
    criticality: 'critical_a',
    facility: 'Chattogram Patenga Terminal',
    department: 'Plant Operations',
    requestedBy: 'Engr. Md. Harunur Rashid',
    requestedByEmpId: 'EMP-0012',
    requestedDate: '21 Oct 2026',
    estimatedCapexBdt: 2450000,
    justification: 'Custody-transfer precision (±0.10%) hot bitumen barge-to-tanker metering at Patenga Marine Jetty.',
    specs: 'Emerson CMF300M 3-Inch 316L Stainless Coriolis Meter, 350°C High-Temp Jacket, BSTI Custody Seal',
    urgency: 'critical',
    stage: 'approved_procuring',
    endorsedByHod: 'Farida Begum (CFO Finance)',
    sanctionedByExec: 'Ahmed Akbar Sobhan (Chairman & MD)',
  },
];

const INITIAL_TRANSFERS: AssetTransfer[] = [
  {
    id: 'TRF-01',
    transferRef: 'TRF-2026-019',
    assetId: 'AST-003',
    assetTag: 'BOGCL-FLT-TNK-08',
    assetName: 'Scania R500 Heated Bulk Bitumen Tanker (30,000L)',
    fromFacility: 'Chattogram Patenga Terminal',
    toFacility: 'Keraniganj Bitumen Refinery',
    fromLocation: 'Patenga Heavy Transit Pool — Bay 04',
    toLocation: 'Keraniganj Gantry Loading Bay 01',
    fromCustodian: 'Md. Kamruzzaman',
    toCustodian: 'Engr. Md. Harunur Rashid',
    toCustodianEmpId: 'EMP-0012',
    toDepartment: 'Plant Operations',
    gatePassNo: 'GP-CTG-2026-8841',
    reason: 'Seasonal RHD Dhaka–Mawa Expressway peak hot-bitumen dispatch reallocation.',
    status: 'completed',
    initiatedBy: 'Md. Kamruzzaman',
    initiatedAt: '14 Oct 2026, 08:30 AM',
    completedAt: '14 Oct 2026, 04:45 PM',
  },
];

/* ──────────────────────────────────────────────────────────────────────────
   GLOBAL REACTIVE STORE SINGLETON (Shared across all Views & Drawers)
   ────────────────────────────────────────────────────────────────────────── */
let globalAssets: AssetRecord[] = [...INITIAL_ASSETS];
let globalWorkOrders: AssetWorkOrder[] = [...INITIAL_WORK_ORDERS];
let globalRequisitions: AssetRequisition[] = [...INITIAL_REQUISITIONS];
let globalTransfers: AssetTransfer[] = [...INITIAL_TRANSFERS];

let listeners: Array<() => void> = [];
const notify = () => listeners.forEach((fn) => fn());

const getCategoryGl = (cat: AssetCategory, facility: AssetFacility) => {
  const siteCode =
    facility === 'Keraniganj Bitumen Refinery'
      ? 'KER'
      : facility === 'Chattogram Patenga Terminal'
      ? 'CTG'
      : 'HQB';
  switch (cat) {
    case 'plant':
      return `GL-4102-${siteCode}`;
    case 'vehicle':
      return `GL-4205-${siteCode}`;
    case 'it':
      return `GL-4301-${siteCode}`;
    case 'safety':
      return `GL-4109-${siteCode}`;
    case 'lab':
      return `GL-4115-${siteCode}`;
    case 'corporate':
      return `GL-4401-${siteCode}`;
  }
};

export interface RegisterAssetInput {
  tag: string;
  name: string;
  category: AssetCategory;
  criticality: AssetCriticality;
  facility: AssetFacility;
  functionalLocation: string;
  department: string;
  custodian: string;
  custodianEmpId?: string;
  placeInStorePool?: boolean;
  oem: string;
  modelNo: string;
  serialNo: string;
  specs: string;
  purchaseCost: number;
  salvageValue: number;
  usefulLifeYears: number;
  depreciationMethod: DepreciationMethod;
  calibrationCycleDays: number;
  warrantyMonths: number;
  regulatoryAuthority?: AssetRecord['regulatoryAuthority'];
  actorName: string;
  actorRole: string;
}

export function useAssetStore() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const listener = () => setTick((t) => t + 1);
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  /* 1. Register / Commission New Asset */
  const registerAsset = (input: RegisterAssetInput): AssetRecord => {
    const seq = globalAssets.length + 1;
    const id = `AST-${String(seq).padStart(3, '0')}`;
    const sapAssetNo = `AA-${4100 + seq}-${String(100 + seq).padStart(5, '0')}`;
    const todayStr = '29 Oct 2026';
    const stage: LifecycleStage = input.placeInStorePool ? 'in_stock' : 'operational';
    const custodianName = input.placeInStorePool ? 'Central Store Pool (Unassigned)' : input.custodian;

    const warrantyDate = new Date();
    warrantyDate.setMonth(warrantyDate.getMonth() + (input.warrantyMonths || 24));
    const warrantyExpiry = warrantyDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const nextSvc = new Date();
    nextSvc.setDate(nextSvc.getDate() + (input.calibrationCycleDays || 180));
    const nextServiceDate = nextSvc.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const newAsset: AssetRecord = {
      id,
      tag: input.tag.trim() || `BOGCL-EQ-${100 + seq}`,
      sapAssetNo,
      name: input.name.trim(),
      category: input.category,
      criticality: input.criticality,
      lifecycleStage: stage,
      facility: input.facility,
      functionalLocation: input.functionalLocation || 'Primary Operational Bay',
      glCostCenter: getCategoryGl(input.category, input.facility),
      department: input.department,
      custodian: custodianName,
      custodianEmpId: input.placeInStorePool ? undefined : input.custodianEmpId,
      custodianAcknowledged: input.placeInStorePool ? true : false,
      oem: input.oem || 'Certified Industrial OEM',
      modelNo: input.modelNo || 'STD-2026',
      serialNo: input.serialNo || `SN-${Date.now().toString().slice(-7)}`,
      specs: input.specs,
      procurementDate: todayStr,
      commissioningDate: todayStr,
      ageYears: 0.05,
      usefulLifeYears: input.usefulLifeYears || 10,
      purchaseCost: input.purchaseCost || 1000000,
      capitalizedAdditions: 0,
      salvageValue: input.salvageValue ?? Math.round((input.purchaseCost || 1000000) * 0.08),
      depreciationMethod: input.depreciationMethod || 'SLM',
      cumulativeMaintenanceOpex: 0,
      warrantyExpiry,
      isUnderWarranty: (input.warrantyMonths || 0) > 0,
      runtimeHours: 0,
      ratedLifetimeHours: (input.usefulLifeYears || 10) * 4000,
      healthScore: 100,
      mtbfHours: 5000,
      mttrHours: 2.0,
      calibrationCycleDays: input.calibrationCycleDays || 180,
      nextServiceDate,
      daysToService: input.calibrationCycleDays || 180,
      regulatoryAuthority: input.regulatoryAuthority || 'ASME / API-510',
      spares: [],
      custodyHistory: [
        {
          id: `CH-${Date.now()}`,
          custodianName,
          custodianEmpId: input.placeInStorePool ? undefined : input.custodianEmpId,
          department: input.department,
          facility: input.facility,
          functionalLocation: input.functionalLocation || 'Primary Operational Bay',
          assignedDate: todayStr,
          acknowledged: input.placeInStorePool ? true : false,
          conditionOnHandover: 'Brand New — FAT/SAT & SAP FI-AA Capitalized',
        },
      ],
      lifecycleEvents: [
        {
          id: `EV-${Date.now()}`,
          eventType: input.placeInStorePool ? 'CAPITALIZED_TAGGED' : 'COMMISSIONED',
          stage,
          title: input.placeInStorePool
            ? `Capitalized in SAP FI-AA (${sapAssetNo}) & Placed in Central Store Pool`
            : `Commissioned & Assigned to ${custodianName} (${sapAssetNo})`,
          notes: `Initial CAPEX ৳${input.purchaseCost.toLocaleString()} posted to ${getCategoryGl(input.category, input.facility)}. Depreciation: ${input.depreciationMethod} (${input.usefulLifeYears} yrs).`,
          actor: input.actorName,
          actorRole: input.actorRole,
          timestamp: 'Today, Just Now',
          financialDeltaBdt: input.purchaseCost,
          sapRef: sapAssetNo,
          hash: makeHash(`${id}-${Date.now()}`),
        },
      ],
    };

    globalAssets = [newAsset, ...globalAssets];
    notify();
    return newAsset;
  };

  /* 2. Custodian Digital Handover Sign-Off */
  const acknowledgeCustody = (assetId: string, actorName: string, actorRole: string) => {
    globalAssets = globalAssets.map((a) => {
      if (a.id !== assetId) return a;
      const updatedHistory = a.custodyHistory.map((ch, idx) =>
        idx === a.custodyHistory.length - 1
          ? { ...ch, acknowledged: true, acknowledgedAt: '29 Oct 2026, Just Now' }
          : ch
      );
      const ev: AssetLifecycleEvent = {
        id: `EV-${Date.now()}`,
        eventType: 'CUSTODY_SIGNED',
        stage: a.lifecycleStage === 'in_stock' ? 'operational' : a.lifecycleStage,
        title: `Digital Custody Acceptance Signed by ${actorName}`,
        notes: 'Cryptographic custodian accountability bound to employee SAP PERNR dossier.',
        actor: actorName,
        actorRole,
        timestamp: 'Today, Just Now',
        hash: makeHash(`${assetId}-sign-${Date.now()}`),
      };
      return {
        ...a,
        custodianAcknowledged: true,
        lifecycleStage: a.lifecycleStage === 'in_stock' ? 'operational' : a.lifecycleStage,
        custodyHistory: updatedHistory,
        lifecycleEvents: [ev, ...a.lifecycleEvents],
      };
    });
    notify();
  };

  /* 3. Initiate & Complete Custody / Inter-Site Transfer */
  const initiateTransfer = (params: {
    assetId: string;
    toFacility: AssetFacility;
    toLocation: string;
    toCustodian: string;
    toCustodianEmpId?: string;
    toDepartment: string;
    reason: string;
    actorName: string;
    actorRole: string;
  }): AssetTransfer | null => {
    const target = globalAssets.find((a) => a.id === params.assetId);
    if (!target) return null;

    const transferRef = `TRF-2026-${String(globalTransfers.length + 20).padStart(3, '0')}`;
    const gatePassNo = `GP-${Math.floor(1000 + Math.random() * 9000)}`;

    const trf: AssetTransfer = {
      id: `TRF-${Date.now()}`,
      transferRef,
      assetId: target.id,
      assetTag: target.tag,
      assetName: target.name,
      fromFacility: target.facility,
      toFacility: params.toFacility,
      fromLocation: target.functionalLocation,
      toLocation: params.toLocation,
      fromCustodian: target.custodian,
      toCustodian: params.toCustodian,
      toCustodianEmpId: params.toCustodianEmpId,
      toDepartment: params.toDepartment,
      gatePassNo,
      reason: params.reason,
      status: 'in_transit',
      initiatedBy: params.actorName,
      initiatedAt: 'Today, Just Now',
    };

    globalTransfers = [trf, ...globalTransfers];

    globalAssets = globalAssets.map((a) => {
      if (a.id !== target.id) return a;
      const ev: AssetLifecycleEvent = {
        id: `EV-${Date.now()}`,
        eventType: 'TRANSFER_INITIATED',
        stage: 'in_transfer',
        title: `Transit Gate Pass ${gatePassNo} Issued → ${params.toCustodian} (${params.toFacility})`,
        notes: params.reason,
        actor: params.actorName,
        actorRole: params.actorRole,
        timestamp: 'Today, Just Now',
        sapRef: transferRef,
        hash: makeHash(`${a.id}-trf-${Date.now()}`),
      };
      return {
        ...a,
        lifecycleStage: 'in_transfer',
        lifecycleEvents: [ev, ...a.lifecycleEvents],
      };
    });

    notify();
    return trf;
  };

  const completeTransfer = (transferId: string, actorName: string, actorRole: string) => {
    const trf = globalTransfers.find((t) => t.id === transferId);
    if (!trf || trf.status === 'completed') return;

    globalTransfers = globalTransfers.map((t) =>
      t.id === transferId ? { ...t, status: 'completed', completedAt: 'Today, Just Now' } : t
    );

    globalAssets = globalAssets.map((a) => {
      if (a.id !== trf.assetId) return a;
      const closedHistory = a.custodyHistory.map((ch, idx) =>
        idx === a.custodyHistory.length - 1 && !ch.returnedDate
          ? { ...ch, returnedDate: '29 Oct 2026' }
          : ch
      );
      const newCustody: CustodyRecord = {
        id: `CH-${Date.now()}`,
        custodianName: trf.toCustodian,
        custodianEmpId: trf.toCustodianEmpId,
        department: trf.toDepartment,
        facility: trf.toFacility,
        functionalLocation: trf.toLocation,
        assignedDate: '29 Oct 2026',
        acknowledged: false,
        conditionOnHandover: `Received via Gate Pass ${trf.gatePassNo} — Pending Custodian Sign-Off`,
        gatePassRef: trf.gatePassNo,
      };
      const ev: AssetLifecycleEvent = {
        id: `EV-${Date.now()}`,
        eventType: 'TRANSFER_COMPLETED',
        stage: 'operational',
        title: `Custody Handover Completed at ${trf.toFacility} → ${trf.toCustodian}`,
        notes: `Gate Pass ${trf.gatePassNo} closed. Cost Center updated to ${getCategoryGl(a.category, trf.toFacility)}.`,
        actor: actorName,
        actorRole,
        timestamp: 'Today, Just Now',
        sapRef: trf.transferRef,
        hash: makeHash(`${a.id}-trfdone-${Date.now()}`),
      };
      return {
        ...a,
        lifecycleStage: 'operational',
        facility: trf.toFacility,
        functionalLocation: trf.toLocation,
        glCostCenter: getCategoryGl(a.category, trf.toFacility),
        department: trf.toDepartment,
        custodian: trf.toCustodian,
        custodianEmpId: trf.toCustodianEmpId,
        custodianAcknowledged: false,
        custodyHistory: [...closedHistory, newCustody],
        lifecycleEvents: [ev, ...a.lifecycleEvents],
      };
    });

    notify();
  };

  /* 4. HR 4-Way Exit Clearance Interlock: Reclaim All Assets Held by Separating Employee */
  const reclaimEmployeeAssets = (employeeId: string, employeeName: string, actorName: string): number => {
    let reclaimedCount = 0;
    globalAssets = globalAssets.map((a) => {
      const isHeld =
        a.lifecycleStage !== 'disposed' &&
        a.lifecycleStage !== 'in_stock' &&
        (a.custodianEmpId === employeeId || a.custodian.toLowerCase() === employeeName.toLowerCase());
      if (!isHeld) return a;
      reclaimedCount += 1;

      const closedHistory = a.custodyHistory.map((ch, idx) =>
        idx === a.custodyHistory.length - 1 && !ch.returnedDate
          ? { ...ch, returnedDate: '29 Oct 2026 (Exit Clearance)' }
          : ch
      );
      const storeCustody: CustodyRecord = {
        id: `CH-${Date.now()}-${reclaimedCount}`,
        custodianName: 'Central Store Pool (Reclaimed on Exit)',
        department: 'Human Resources',
        facility: a.facility,
        functionalLocation: 'Central Store Vault — Cleared Inventory',
        assignedDate: '29 Oct 2026',
        acknowledged: true,
        acknowledgedAt: '29 Oct 2026, Just Now',
        conditionOnHandover: `Reclaimed from ${employeeName} (${employeeId}) during 4-Way Exit Clearance`,
      };
      const ev: AssetLifecycleEvent = {
        id: `EV-${Date.now()}-${reclaimedCount}`,
        eventType: 'CUSTODY_RECLAIMED',
        stage: 'in_stock',
        title: `Asset Reclaimed to Store Pool on Exit Clearance (${employeeName})`,
        notes: 'Verified undamaged & returned to Central Store Pool prior to final payroll settlement.',
        actor: actorName,
        actorRole: 'HR & Corporate Services',
        timestamp: 'Today, Just Now',
        hash: makeHash(`${a.id}-reclaim-${Date.now()}`),
      };

      return {
        ...a,
        lifecycleStage: 'in_stock',
        custodian: 'Central Store Pool (Unassigned)',
        custodianEmpId: undefined,
        custodianAcknowledged: true,
        functionalLocation: 'Central Store Vault — Cleared Inventory',
        custodyHistory: [...closedHistory, storeCustody],
        lifecycleEvents: [ev, ...a.lifecycleEvents],
      };
    });
    if (reclaimedCount > 0) notify();
    return reclaimedCount;
  };

  /* 5. Create & Complete Maintenance / Calibration Work Orders */
  const createWorkOrder = (params: {
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
  }): AssetWorkOrder | null => {
    const asset = globalAssets.find((a) => a.id === params.assetId);
    if (!asset) return null;

    const coveredByWarranty = asset.isUnderWarranty && !params.isCapexOverhaul && params.type === 'CM';
    const effectiveCost = coveredByWarranty ? 0 : params.estimatedCostBdt;
    const woNumber = `WO-2026-${String(globalWorkOrders.length + 960).padStart(4, '0')}`;

    const wo: AssetWorkOrder = {
      id: `WO-${Date.now()}`,
      woNumber,
      assetId: asset.id,
      assetTag: asset.tag,
      assetName: asset.name,
      type: params.type,
      priority: params.priority,
      title: params.title,
      assignedEngineer: params.assignedEngineer,
      facility: asset.facility,
      lotoPermitRef: params.lotoPermitRef,
      regulatoryBody: params.regulatoryBody,
      estimatedCostBdt: effectiveCost,
      isCapexOverhaul: params.isCapexOverhaul,
      coveredByWarranty,
      status: 'in_progress',
      dueDate: params.dueDate || '12 Nov 2026',
      remarks: params.remarks,
    };

    globalWorkOrders = [wo, ...globalWorkOrders];

    globalAssets = globalAssets.map((a) => {
      if (a.id !== asset.id) return a;
      return {
        ...a,
        lifecycleStage: params.type === 'CAL' ? 'calibration_due' : 'maintenance',
      };
    });

    notify();
    return wo;
  };

  const completeWorkOrder = (woId: string, actorName: string, actorRole: string) => {
    const wo = globalWorkOrders.find((w) => w.id === woId);
    if (!wo || wo.status === 'completed') return;

    const certNo = `CERT-${wo.type}-2026-${Math.floor(100 + Math.random() * 899)}`;
    globalWorkOrders = globalWorkOrders.map((w) =>
      w.id === woId
        ? { ...w, status: 'completed', completedDate: '29 Oct 2026', certificateNo: certNo }
        : w
    );

    globalAssets = globalAssets.map((a) => {
      if (a.id !== wo.assetId) return a;
      const nextSvc = new Date();
      nextSvc.setDate(nextSvc.getDate() + (a.calibrationCycleDays || 180));
      const nextDateStr = nextSvc.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

      const addCapex = wo.isCapexOverhaul ? wo.estimatedCostBdt : 0;
      const addOpex = wo.isCapexOverhaul ? 0 : wo.estimatedCostBdt;
      const extendLife = wo.isCapexOverhaul ? 2 : 0;

      const ev: AssetLifecycleEvent = {
        id: `EV-${Date.now()}`,
        eventType: wo.isCapexOverhaul ? 'CAPEX_OVERHAUL' : 'PM_CERTIFIED',
        stage: 'operational',
        title: `${wo.woNumber} Certified (${certNo}) — ${wo.title}`,
        notes: wo.coveredByWarranty
          ? 'Completed under OEM Warranty Coverage (৳0 cost).'
          : wo.isCapexOverhaul
          ? `Capitalized value-adding overhaul (+৳${addCapex.toLocaleString()} added to Gross Book Value, +2 yrs Useful Life).`
          : `Routine ${wo.type} completed. Cost ৳${addOpex.toLocaleString()} added to Cumulative TCO OPEX. Next cycle in ${a.calibrationCycleDays}d.`,
        actor: actorName,
        actorRole,
        timestamp: 'Today, Just Now',
        financialDeltaBdt: wo.estimatedCostBdt,
        sapRef: certNo,
        hash: makeHash(`${a.id}-${wo.woNumber}-${Date.now()}`),
      };

      return {
        ...a,
        lifecycleStage: 'operational',
        capitalizedAdditions: a.capitalizedAdditions + addCapex,
        usefulLifeYears: a.usefulLifeYears + extendLife,
        cumulativeMaintenanceOpex: a.cumulativeMaintenanceOpex + addOpex,
        healthScore: Math.min(100, a.healthScore + (wo.isCapexOverhaul ? 15 : 7)),
        nextServiceDate: nextDateStr,
        daysToService: a.calibrationCycleDays || 180,
        defectQuery: undefined,
        lifecycleEvents: [ev, ...a.lifecycleEvents],
      };
    });

    notify();
  };

  /* Quick direct calibration certification on an asset */
  const certifyAssetDirect = (assetId: string, actorName: string, actorRole: string) => {
    const openWo = globalWorkOrders.find((w) => w.assetId === assetId && w.status !== 'completed');
    if (openWo) {
      completeWorkOrder(openWo.id, actorName, actorRole);
      return;
    }

    globalAssets = globalAssets.map((a) => {
      if (a.id !== assetId) return a;
      const certNo = `CERT-CAL-2026-${Math.floor(100 + Math.random() * 899)}`;
      const nextSvc = new Date();
      nextSvc.setDate(nextSvc.getDate() + (a.calibrationCycleDays || 180));
      const nextDateStr = nextSvc.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

      const ev: AssetLifecycleEvent = {
        id: `EV-${Date.now()}`,
        eventType: 'PM_CERTIFIED',
        stage: 'operational',
        title: `Preventive Calibration & Safety Integrity Certified (${certNo})`,
        notes: `Next statutory audit scheduled in ${a.calibrationCycleDays} days (${nextDateStr}).`,
        actor: actorName,
        actorRole,
        timestamp: 'Today, Just Now',
        sapRef: certNo,
        hash: makeHash(`${a.id}-cal-${Date.now()}`),
      };

      return {
        ...a,
        lifecycleStage: 'operational',
        healthScore: Math.min(100, a.healthScore + 5),
        nextServiceDate: nextDateStr,
        daysToService: a.calibrationCycleDays || 180,
        defectQuery: undefined,
        lifecycleEvents: [ev, ...a.lifecycleEvents],
      };
    });
    notify();
  };

  /* 6. Flag Deficiency / Fault Ticket (Also used by Staff Self-Service to report defects!) */
  const flagAssetDeficiency = (
    assetId: string,
    data: { reason: string; observation: string; improvementsRequired: string },
    actorName: string,
    actorRole: string
  ) => {
    const target = globalAssets.find((a) => a.id === assetId);
    if (!target) return;

    globalAssets = globalAssets.map((a) => {
      if (a.id !== assetId) return a;
      const ev: AssetLifecycleEvent = {
        id: `EV-${Date.now()}`,
        eventType: 'DEFECT_FLAGGED',
        stage: 'maintenance',
        title: `Deficiency / Fault Flagged: "${data.reason}"`,
        notes: `${data.observation} — Action Required: ${data.improvementsRequired}`,
        actor: actorName,
        actorRole,
        timestamp: 'Today, Just Now',
        hash: makeHash(`${a.id}-def-${Date.now()}`),
      };
      return {
        ...a,
        lifecycleStage: 'maintenance',
        healthScore: Math.max(25, a.healthScore - 10),
        defectQuery: {
          reason: data.reason,
          observation: data.observation,
          improvementsRequired: data.improvementsRequired,
          reportedBy: `${actorName} (${actorRole})`,
          reportedAt: 'Today, Just Now',
        },
        lifecycleEvents: [ev, ...a.lifecycleEvents],
      };
    });

    // Auto-generate Corrective Maintenance Work Order
    const woNumber = `WO-2026-${String(globalWorkOrders.length + 960).padStart(4, '0')}`;
    const autoWo: AssetWorkOrder = {
      id: `WO-${Date.now()}`,
      woNumber,
      assetId: target.id,
      assetTag: target.tag,
      assetName: target.name,
      type: 'CM',
      priority: target.criticality === 'critical_a' ? 'critical' : 'high',
      title: `Corrective Resolution: ${data.reason}`,
      assignedEngineer: target.category === 'it' ? 'Corporate IT Helpdesk Team' : 'Keraniganj Reliability Engineering',
      facility: target.facility,
      estimatedCostBdt: target.isUnderWarranty ? 0 : 45000,
      isCapexOverhaul: false,
      coveredByWarranty: target.isUnderWarranty,
      status: 'in_progress',
      dueDate: '05 Nov 2026',
      remarks: data.improvementsRequired,
    };
    globalWorkOrders = [autoWo, ...globalWorkOrders];

    notify();
  };

  /* 7. BOM Spare Parts Consumption & Reorder */
  const consumeSparePart = (assetId: string, spareId: string, actorName: string, actorRole: string) => {
    globalAssets = globalAssets.map((a) => {
      if (a.id !== assetId) return a;
      let consumedSpare: AssetSpareItem | undefined;
      const updatedSpares = a.spares.map((sp) => {
        if (sp.id === spareId && sp.stockQty > 0) {
          consumedSpare = sp;
          return { ...sp, stockQty: sp.stockQty - 1 };
        }
        return sp;
      });
      if (!consumedSpare) return a;

      return {
        ...a,
        spares: updatedSpares,
        cumulativeMaintenanceOpex: a.cumulativeMaintenanceOpex + consumedSpare.unitCostBdt,
        lifecycleEvents: [
          {
            id: `EV-${Date.now()}`,
            eventType: 'PM_CERTIFIED',
            stage: a.lifecycleStage,
            title: `BOM Spare Issued: 1x ${consumedSpare.name} (${consumedSpare.partNo})`,
            notes: `Charged ৳${consumedSpare.unitCostBdt.toLocaleString()} to ${a.glCostCenter} maintenance OPEX.`,
            actor: actorName,
            actorRole,
            timestamp: 'Today, Just Now',
            financialDeltaBdt: consumedSpare.unitCostBdt,
            hash: makeHash(`${a.id}-sp-${Date.now()}`),
          },
          ...a.lifecycleEvents,
        ],
      };
    });
    notify();
  };

  const restockSparePart = (assetId: string, spareId: string, qty = 3) => {
    globalAssets = globalAssets.map((a) => {
      if (a.id !== assetId) return a;
      return {
        ...a,
        spares: a.spares.map((sp) => (sp.id === spareId ? { ...sp, stockQty: sp.stockQty + qty } : sp)),
      };
    });
    notify();
  };

  /* 8. Change IAS 16 Depreciation Method (CFO / Chairman Audit Control) */
  const changeDepreciationMethod = (assetId: string, method: DepreciationMethod, actorName: string, actorRole: string) => {
    globalAssets = globalAssets.map((a) => {
      if (a.id !== assetId) return a;
      return {
        ...a,
        depreciationMethod: method,
        lifecycleEvents: [
          {
            id: `EV-${Date.now()}`,
            eventType: 'CAPITALIZED_TAGGED',
            stage: a.lifecycleStage,
            title: `IAS 16 Depreciation Schedule Updated to ${method}`,
            notes: `Audited & recalculated in SAP FI-AA ledger (${a.sapAssetNo}).`,
            actor: actorName,
            actorRole,
            timestamp: 'Today, Just Now',
            sapRef: a.sapAssetNo,
            hash: makeHash(`${a.id}-dep-${Date.now()}`),
          },
          ...a.lifecycleEvents,
        ],
      };
    });
    notify();
  };

  /* 9. Asset Acquisition Requisition Pipeline (Stage 1 -> Stage 2 -> Stage 3/4 Auto-Mint!) */
  const submitRequisition = (params: {
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
    urgency: AssetRequisition['urgency'];
  }): AssetRequisition => {
    const reqNumber = `ARQ-2026-${String(globalRequisitions.length + 25).padStart(3, '0')}`;
    const newReq: AssetRequisition = {
      id: `REQ-${Date.now()}`,
      reqNumber,
      title: params.title,
      category: params.category,
      criticality: params.criticality,
      facility: params.facility,
      department: params.department,
      requestedBy: params.requestedBy,
      requestedByEmpId: params.requestedByEmpId,
      requestedDate: 'Today, Just Now',
      estimatedCapexBdt: params.estimatedCapexBdt,
      justification: params.justification,
      specs: params.specs,
      urgency: params.urgency,
      stage: 'pending_hod',
    };
    globalRequisitions = [newReq, ...globalRequisitions];
    notify();
    return newReq;
  };

  const advanceRequisition = (reqId: string, actorName: string, actorRole: string): { nextStage: string; mintedAsset?: AssetRecord } => {
    const req = globalRequisitions.find((r) => r.id === reqId);
    if (!req) return { nextStage: '' };

    if (req.stage === 'pending_hod') {
      globalRequisitions = globalRequisitions.map((r) =>
        r.id === reqId ? { ...r, stage: 'pending_executive', endorsedByHod: `${actorName} (${actorRole})` } : r
      );
      notify();
      return { nextStage: 'pending_executive' };
    }

    if (req.stage === 'pending_executive') {
      globalRequisitions = globalRequisitions.map((r) =>
        r.id === reqId ? { ...r, stage: 'approved_procuring', sanctionedByExec: `${actorName} (${actorRole})` } : r
      );
      notify();
      return { nextStage: 'approved_procuring' };
    }

    if (req.stage === 'approved_procuring') {
      const sitePrefix =
        req.facility === 'Keraniganj Bitumen Refinery'
          ? 'KER'
          : req.facility === 'Chattogram Patenga Terminal'
          ? 'CTG'
          : 'HQ';
      const catPrefix = req.category.slice(0, 3).toUpperCase();
      const autoTag = `BOGCL-${sitePrefix}-${catPrefix}-${110 + globalAssets.length}`;

      const minted = registerAsset({
        tag: autoTag,
        name: req.title,
        category: req.category,
        criticality: req.criticality,
        facility: req.facility,
        functionalLocation: `${req.department} — Primary Assignment`,
        department: req.department,
        custodian: req.requestedBy,
        custodianEmpId: req.requestedByEmpId,
        placeInStorePool: false,
        oem: 'Approved Tender OEM Vendor',
        modelNo: '2026-ENT',
        serialNo: `SN-${Date.now().toString().slice(-7)}`,
        specs: req.specs,
        purchaseCost: req.estimatedCapexBdt,
        salvageValue: Math.round(req.estimatedCapexBdt * 0.08),
        usefulLifeYears: req.category === 'it' ? 4 : req.category === 'vehicle' ? 8 : 12,
        depreciationMethod: req.category === 'vehicle' ? 'WDV' : 'SLM',
        calibrationCycleDays: req.category === 'safety' ? 90 : 180,
        warrantyMonths: 24,
        actorName,
        actorRole,
      });

      globalRequisitions = globalRequisitions.map((r) =>
        r.id === reqId ? { ...r, stage: 'commissioned', mintedAssetTag: minted.tag } : r
      );
      notify();
      return { nextStage: 'commissioned', mintedAsset: minted };
    }

    return { nextStage: req.stage };
  };

  /* 10. Stage 7 & 8: End-of-Life Condemnation, Checklist & Final Disposal Realization */
  const initiateDecommissioning = (
    assetId: string,
    reason: AssetDisposalDossier['reason'],
    surveyNotes: string,
    actorName: string,
    actorRole: string
  ) => {
    globalAssets = globalAssets.map((a) => {
      if (a.id !== assetId) return a;
      const dossier: AssetDisposalDossier = {
        reason,
        surveyNotes,
        initiatedBy: `${actorName} (${actorRole})`,
        initiatedDate: '29 Oct 2026',
        checklist: {
          technicalSurveySigned: true,
          decontaminationOrDataWipeCertified: false,
          sparesHarvested: false,
          financeCfoVetted: false,
        },
      };
      const ev: AssetLifecycleEvent = {
        id: `EV-${Date.now()}`,
        eventType: 'DECOMMISSION_SURVEY',
        stage: 'decommissioned',
        title: `Condemnation Survey Initiated (${reason})`,
        notes: surveyNotes,
        actor: actorName,
        actorRole,
        timestamp: 'Today, Just Now',
        hash: makeHash(`${a.id}-decom-${Date.now()}`),
      };
      return {
        ...a,
        lifecycleStage: 'decommissioned',
        disposalDossier: dossier,
        lifecycleEvents: [ev, ...a.lifecycleEvents],
      };
    });
    notify();
  };

  const toggleDisposalChecklistItem = (
    assetId: string,
    key: keyof AssetDisposalDossier['checklist']
  ) => {
    globalAssets = globalAssets.map((a) => {
      if (a.id !== assetId || !a.disposalDossier) return a;
      return {
        ...a,
        disposalDossier: {
          ...a.disposalDossier,
          checklist: {
            ...a.disposalDossier.checklist,
            [key]: !a.disposalDossier.checklist[key],
          },
        },
      };
    });
    notify();
  };

  const finalizeDisposalAndArchive = (params: {
    assetId: string;
    disposalMethod: NonNullable<AssetDisposalDossier['disposalMethod']>;
    buyerOrVendor: string;
    salvageProceedsBdt: number;
    actorName: string;
    actorRole: string;
  }): { sapVoucher: string; gainOrLoss: number } | null => {
    const asset = globalAssets.find((a) => a.id === params.assetId);
    if (!asset || !asset.disposalDossier) return null;

    const fin = calculateAssetFinancials(asset);
    const nbvAtDisposal = fin.netBookValue;
    const gainOrLoss = params.salvageProceedsBdt - nbvAtDisposal;
    const sapVoucher = `SAP-AA-RET-2026-${Math.floor(1000 + Math.random() * 8999)}`;

    globalAssets = globalAssets.map((a) => {
      if (a.id !== params.assetId || !a.disposalDossier) return a;
      const updatedDossier: AssetDisposalDossier = {
        ...a.disposalDossier,
        checklist: {
          technicalSurveySigned: true,
          decontaminationOrDataWipeCertified: true,
          sparesHarvested: true,
          financeCfoVetted: true,
        },
        disposalMethod: params.disposalMethod,
        buyerOrVendor: params.buyerOrVendor,
        salvageProceedsBdt: params.salvageProceedsBdt,
        netBookValueAtDisposal: nbvAtDisposal,
        gainOrLossBdt: gainOrLoss,
        authorizedBy: `${params.actorName} (${params.actorRole})`,
        disposedDate: '29 Oct 2026',
        sapRetirementVoucher: sapVoucher,
      };
      const ev: AssetLifecycleEvent = {
        id: `EV-${Date.now()}`,
        eventType: 'DISPOSED_ARCHIVED',
        stage: 'disposed',
        title: `Disposed via ${params.disposalMethod} (${gainOrLoss >= 0 ? `+৳${gainOrLoss.toLocaleString()} Gain` : `-৳${Math.abs(gainOrLoss).toLocaleString()} Write-Off Loss`})`,
        notes: `Proceeds: ৳${params.salvageProceedsBdt.toLocaleString()} (${params.buyerOrVendor}) vs NBV ৳${nbvAtDisposal.toLocaleString()}. SAP FI-AA Retirement Voucher: ${sapVoucher}. Record locked in 10-Yr Statutory Archive.`,
        actor: params.actorName,
        actorRole: params.actorRole,
        timestamp: 'Today, Just Now',
        financialDeltaBdt: params.salvageProceedsBdt,
        sapRef: sapVoucher,
        hash: makeHash(`${a.id}-disp-${Date.now()}`),
      };
      return {
        ...a,
        lifecycleStage: 'disposed',
        custodian: 'Disposed / Retired Archive',
        custodianEmpId: undefined,
        healthScore: 0,
        nextServiceDate: 'Archived',
        daysToService: 0,
        disposalDossier: updatedDossier,
        lifecycleEvents: [ev, ...a.lifecycleEvents],
      };
    });

    notify();
    return { sapVoucher, gainOrLoss };
  };

  return {
    assets: globalAssets,
    workOrders: globalWorkOrders,
    requisitions: globalRequisitions,
    transfers: globalTransfers,
    registerAsset,
    acknowledgeCustody,
    initiateTransfer,
    completeTransfer,
    reclaimEmployeeAssets,
    createWorkOrder,
    completeWorkOrder,
    certifyAssetDirect,
    flagAssetDeficiency,
    consumeSparePart,
    restockSparePart,
    changeDepreciationMethod,
    submitRequisition,
    advanceRequisition,
    initiateDecommissioning,
    toggleDisposalChecklistItem,
    finalizeDisposalAndArchive,
  };
}

