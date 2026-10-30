import { useState, useEffect } from 'react';
import { AppRole, ROLE_META, SYSTEM_TODAY } from '../types';

export type AssetCategory = 'plant' | 'vehicle' | 'it' | 'safety' | 'lab' | 'corporate';

export type AssetFacility =
  | 'Keraniganj Bitumen Refinery'
  | 'Bashundhara Corporate HQ, Baridhara'
  | 'Chattogram Patenga Terminal';

export type AssetCriticality = 'critical_a' | 'essential_b' | 'general_c';

export type DepreciationMethod = 'SLM' | 'WDV' | 'UOP';

export type LifecycleStage =
  | 'in_stock'          // Stage 3: Ready in Store Room
  | 'operational'       // Stage 4: Active & In Use
  | 'in_transfer'       // Stage 5: Moving Between Offices / Staff
  | 'maintenance'       // Stage 6A: Under Repair / Servicing
  | 'calibration_due'   // Stage 6B: Safety / Quality Check Due (<30d)
  | 'decommissioned'    // Stage 7: Retired — Pending Disposal Sign-Off
  | 'disposed';         // Stage 8: Sold / Scrapped (Archived Record)

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
  const meta = ROLE_META[role];
  switch (role) {
    case 'chairman':
      return {
        roleTitle: 'Company-Wide Asset & Final Write-Off Authority',
        roleTitleBn: 'কোম্পানি-ব্যাপী সম্পদ ও চূড়ান্ত অবলোপন অনুমোদন কর্তৃপক্ষ',
        scopeBadge: 'All 3 Locations (Full Access)',
        scopeBadgeBn: 'সকল স্থাপনা (পূর্ণ পরিধি)',
        scopeDescription: 'View total asset value across all offices and plants, approve major equipment purchases, and sign final disposal / auction write-offs.',
        scopeDescriptionBn: 'সকল স্থাপনার সম্পদের বর্তমান মূল্য পর্যবেক্ষণ, বড় ক্রয় অনুমোদন ও অকেজো সম্পদ নিষ্পত্তি অনুমোদন।',
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
        roleTitle: 'Plant Machinery, Servicing & Safety Check Authority',
        roleTitleBn: 'প্ল্যান্ট যন্ত্রপাতি, সার্ভিসিং ও নিরাপত্তা পরীক্ষা কর্তৃপক্ষ',
        scopeBadge: 'Plant Machinery, Lab & Safety Gear',
        scopeBadgeBn: 'প্ল্যান্ট যন্ত্রপাতি, ল্যাব ও নিরাপত্তা সরঞ্জাম',
        scopeDescription: 'Register plant machinery, complete safety & quality inspections, manage repair jobs and spare parts, and mark worn-out machines for retirement.',
        scopeDescriptionBn: 'যন্ত্রপাতি নিবন্ধন, নিরাপত্তা ও মান পরীক্ষা সম্পন্নকরণ, মেরামত কাজ ও খুচরা যন্ত্রাংশ পরিচালনা।',
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
        roleTitle: 'Asset Value, Yearly Cost & Finance Approver',
        roleTitleBn: 'সম্পদের মূল্য, বার্ষিক ব্যয় ও অর্থ অনুমোদনকারী',
        scopeBadge: 'Finance Valuation & Budget Control',
        scopeBadgeBn: 'আর্থিক মূল্যায়ন ও বাজেট নিয়ন্ত্রণ',
        scopeDescription: 'Review current asset values and yearly value-drop schedules, check total repair costs, approve purchase budgets, and co-sign asset disposals.',
        scopeDescriptionBn: 'সম্পদের বর্তমান মূল্য ও বার্ষিক অবচয় পর্যালোচনা, মেরামত ব্যয় বিশ্লেষণ ও বাজেট অনুমোদন।',
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
        roleTitle: 'Staff Equipment Handover & Exit Return Manager',
        roleTitleBn: 'কর্মী সরঞ্জাম বরাদ্দ ও চাকরি ছাড়ার সময় পুনরুদ্ধার কর্তৃপক্ষ',
        scopeBadge: 'Staff Laptops, Phones & Office Gear',
        scopeBadgeBn: 'কর্মীদের ল্যাপটপ, ফোন ও অফিস সরঞ্জাম',
        scopeDescription: 'Assign laptops, phones, and office items to staff, track digital receipt signatures, approve staff requests, and collect items during exit clearance.',
        scopeDescriptionBn: 'কর্মীদের ল্যাপটপ ও অফিস সরঞ্জাম বরাদ্দ, গ্রহণ স্বাক্ষর ট্র্যাকিং এবং চাকরি সমাপ্তিতে সরঞ্জাম ফেরত নেওয়া।',
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
        roleTitle: 'Company Vehicles & Tanker Fleet Asset Supervisor',
        roleTitleBn: 'কোম্পানির গাড়ি ও ট্যাংকার বহর সম্পদ তত্ত্বাবধায়ক',
        scopeBadge: 'Cars, Vans & Bitumen Tankers',
        scopeBadgeBn: 'গাড়ি, মাইক্রোবাস ও বিটুমিন ট্যাংকার',
        scopeDescription: 'Manage company cars, shuttle vans, and bitumen tankers — track BRTA fitness renewals, workshop servicing, spare parts, and site transfers.',
        scopeDescriptionBn: 'কোম্পানির গাড়ি ও ট্যাংকারের ফিটনেস নবায়ন, ওয়ার্কশপ সার্ভিসিং এবং ডিপো স্থানান্তর ব্যবস্থাপনা।',
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
    case 'driver':
      return {
        roleTitle: 'My Assigned Company Vehicle & Safety Kit',
        roleTitleBn: 'আমার বরাদ্দকৃত গাড়ি ও নিরাপত্তা সরঞ্জাম',
        scopeBadge: `Assigned Vehicle (${meta.empId})`,
        scopeBadgeBn: `বরাদ্দকৃত গাড়ি (${meta.empId})`,
        scopeDescription: 'View the vehicle assigned to your duty, confirm handover receipt, check next workshop service date, and report any mechanical issue immediately.',
        scopeDescriptionBn: 'আপনার নামে বরাদ্দকৃত গাড়ি দেখুন, গ্রহণ নিশ্চিত করুন, পরবর্তী সার্ভিস তারিখ দেখুন এবং যান্ত্রিক ত্রুটি জানান।',
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
    case 'employee':
    default:
      return {
        roleTitle: 'My Assigned Office Equipment & New Item Requests',
        roleTitleBn: 'আমার বরাদ্দকৃত অফিস সরঞ্জাম ও নতুন আবেদন',
        scopeBadge: `My Assigned Items (${meta.empId})`,
        scopeBadgeBn: `ব্যক্তিগত বরাদ্দ (${meta.empId})`,
        scopeDescription: 'View laptops, phones, and work tools assigned to you, sign digital receipt, report damaged items, and request new or replacement equipment.',
        scopeDescriptionBn: 'আপনার নামে বরাদ্দকৃত ল্যাপটপ ও সরঞ্জাম দেখুন, গ্রহণ স্বাক্ষর করুন, ত্রুটি জানান ও নতুন সরঞ্জামের আবেদন করুন।',
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
   ASSET VALUE & LIFETIME COST CALCULATION
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
  const hex = (h >>> 0).toString(16).padStart(8, '0').toUpperCase();
  return `LOG-${hex}`;
};

/* ──────────────────────────────────────────────────────────────────────────
   EASY-TO-UNDERSTAND SAMPLE COMPANY ASSETS (12 Realistic Records)
   ────────────────────────────────────────────────────────────────────────── */
const INITIAL_ASSETS: AssetRecord[] = [
  {
    id: 'AST-001',
    tag: 'BOGCL-KER-GEN-101',
    sapAssetNo: 'AST-REG-00101',
    name: '1,200 kVA Main Factory Backup Power Generator',
    category: 'plant',
    criticality: 'critical_a',
    lifecycleStage: 'operational',
    facility: 'Keraniganj Bitumen Refinery',
    functionalLocation: 'Power House Room #1, Keraniganj Plant',
    glCostCenter: 'ACC-4102-KER',
    department: 'Plant Operations',
    custodian: 'Engr. Md. Harunur Rashid',
    custodianEmpId: 'EMP-0012',
    custodianAcknowledged: true,
    oem: 'Cummins Power Generation',
    modelNo: 'C1200-D5',
    serialNo: 'CUM-2022-88410',
    specs: '1,200 kVA Automatic Diesel Backup Generator · Powers Entire Factory During Grid Outage',
    procurementDate: '10 Mar 2022',
    commissioningDate: '25 Mar 2022',
    ageYears: 4.6,
    usefulLifeYears: 15,
    purchaseCost: 24000000,
    capitalizedAdditions: 1500000,
    salvageValue: 2500000,
    depreciationMethod: 'SLM',
    cumulativeMaintenanceOpex: 2200000,
    warrantyExpiry: '25 Mar 2025',
    isUnderWarranty: false,
    amcVendor: 'Energypac Power Generation Ltd.',
    runtimeHours: 14200,
    ratedLifetimeHours: 45000,
    healthScore: 86,
    mtbfHours: 3200,
    mttrHours: 4,
    calibrationCycleDays: 180,
    nextServiceDate: '15 Dec 2026',
    daysToService: 47,
    regulatoryAuthority: 'ASME / API-510',
    spares: [
      { id: 'SP-101', partNo: 'FLT-OIL-40', name: 'Heavy Diesel Oil Filter Set', stockQty: 6, minReorderQty: 3, unitCostBdt: 18500, leadTimeDays: 3 },
      { id: 'SP-102', partNo: 'PMP-WTR-12', name: 'Radiator Cooling Water Pump', stockQty: 1, minReorderQty: 2, unitCostBdt: 95000, leadTimeDays: 7 },
    ],
    custodyHistory: [
      {
        id: 'CH-101',
        custodianName: 'Engr. Md. Harunur Rashid',
        custodianEmpId: 'EMP-0012',
        department: 'Plant Operations',
        facility: 'Keraniganj Bitumen Refinery',
        functionalLocation: 'Power House Room #1, Keraniganj Plant',
        assignedDate: '25 Mar 2022',
        acknowledged: true,
        acknowledgedAt: '25 Mar 2022, 11:00 AM',
        conditionOnHandover: 'Brand New — Installed & Load-Tested by Energypac',
      },
    ],
    lifecycleEvents: [
      {
        id: 'EV-102',
        eventType: 'PM_CERTIFIED',
        stage: 'operational',
        title: '6-Month Routine Oil & Load Test Completed',
        notes: 'Full load backup test completed in 8 seconds switchover time. All readings normal.',
        actor: 'Engr. Tariqul Islam',
        actorRole: 'Senior Plant Maintenance Engineer',
        timestamp: '15 Jun 2026',
        financialDeltaBdt: 120000,
        sapRef: 'CERT-PM-2026-412',
        hash: makeHash('AST-001-pm'),
      },
      {
        id: 'EV-101',
        eventType: 'COMMISSIONED',
        stage: 'operational',
        title: 'Installed & Activated at Keraniganj Plant Power House',
        notes: 'Purchase value ৳2,40,00,000 recorded in company asset register.',
        actor: 'Engr. Md. Harunur Rashid',
        actorRole: 'Plant General Manager',
        timestamp: '25 Mar 2022',
        financialDeltaBdt: 24000000,
        sapRef: 'AST-REG-00101',
        hash: makeHash('AST-001-init'),
      },
    ],
  },
  {
    id: 'AST-002',
    tag: 'BOGCL-VEH-CAR-01',
    sapAssetNo: 'AST-REG-00201',
    name: 'Toyota Prado TXL Executive Car (DHAKA METRO GHA-13-8821)',
    category: 'vehicle',
    criticality: 'essential_b',
    lifecycleStage: 'operational',
    facility: 'Bashundhara Corporate HQ, Baridhara',
    functionalLocation: 'Head Office VIP Parking Bay #01',
    glCostCenter: 'ACC-4205-HQB',
    department: 'Transport & Logistics',
    custodian: 'Md. Rafiqul Islam',
    custodianEmpId: 'EMP-0821',
    custodianAcknowledged: true,
    oem: 'Toyota Motor Corp.',
    modelNo: 'Land Cruiser Prado TXL 2.8D',
    serialNo: 'JTEBR3FJ-8821',
    specs: '7-Seat Executive SUV · Plate: DHAKA METRO GHA-13-8821 · GPS Tracked',
    procurementDate: '12 Jan 2023',
    commissioningDate: '18 Jan 2023',
    ageYears: 3.8,
    usefulLifeYears: 8,
    purchaseCost: 16500000,
    capitalizedAdditions: 0,
    salvageValue: 3500000,
    depreciationMethod: 'WDV',
    cumulativeMaintenanceOpex: 480000,
    warrantyExpiry: '18 Jan 2026',
    isUnderWarranty: false,
    amcVendor: 'Navana Toyota Service Center',
    runtimeHours: 5400,
    ratedLifetimeHours: 20000,
    healthScore: 94,
    mtbfHours: 4500,
    mttrHours: 3,
    calibrationCycleDays: 180,
    nextServiceDate: '20 Jan 2027',
    daysToService: 83,
    regulatoryAuthority: 'BRTA',
    spares: [
      { id: 'SP-201', partNo: 'TYR-265-60R18', name: 'Bridgestone All-Season SUV Tire', stockQty: 4, minReorderQty: 2, unitCostBdt: 32000, leadTimeDays: 2 },
      { id: 'SP-202', partNo: 'BRK-PAD-PRD', name: 'Genuine Toyota Front Brake Pad Kit', stockQty: 2, minReorderQty: 1, unitCostBdt: 16500, leadTimeDays: 1 },
    ],
    custodyHistory: [
      {
        id: 'CH-201',
        custodianName: 'Md. Rafiqul Islam',
        custodianEmpId: 'EMP-0821',
        department: 'Transport & Logistics',
        facility: 'Bashundhara Corporate HQ, Baridhara',
        functionalLocation: 'Head Office VIP Parking Bay #01',
        assignedDate: '18 Jan 2023',
        acknowledged: true,
        acknowledgedAt: '18 Jan 2023, 10:15 AM',
        conditionOnHandover: 'Brand New — BRTA Registered & Assigned to Senior Driver Rafiqul',
      },
    ],
    lifecycleEvents: [
      {
        id: 'EV-201',
        eventType: 'PM_CERTIFIED',
        stage: 'operational',
        title: 'BRTA Fitness Renewed & 40,000 km Navana Servicing Done',
        notes: 'Engine oil, cabin AC filter, and brake inspection passed.',
        actor: 'Md. Kamruzzaman',
        actorRole: 'Transport & Admin Supervisor',
        timestamp: '22 Jul 2026',
        financialDeltaBdt: 42000,
        sapRef: 'BRTA-FIT-2026-8821',
        hash: makeHash('AST-002-fit'),
      },
    ],
  },
  {
    id: 'AST-003',
    tag: 'BOGCL-VEH-TNK-03',
    sapAssetNo: 'AST-REG-00203',
    name: 'Tata Prima 18,000L Heated Bitumen Tanker (DHAKA METRO KHA-11-9042)',
    category: 'vehicle',
    criticality: 'critical_a',
    lifecycleStage: 'operational',
    facility: 'Keraniganj Bitumen Refinery',
    functionalLocation: 'Keraniganj Truck Loading Bay #3',
    glCostCenter: 'ACC-4205-KER',
    department: 'Transport & Logistics',
    custodian: 'Md. Kamruzzaman',
    custodianEmpId: 'EMP-0045',
    custodianAcknowledged: true,
    oem: 'Tata Motors Heavy Commercial',
    modelNo: 'Prima 4028.S Insulated Tanker',
    serialNo: 'MAT449042-KER',
    specs: '18,000-Liter Insulated Hot Bitumen Delivery Tanker · Plate: DHAKA METRO KHA-11-9042',
    procurementDate: '05 Jun 2021',
    commissioningDate: '20 Jun 2021',
    ageYears: 5.3,
    usefulLifeYears: 10,
    purchaseCost: 11800000,
    capitalizedAdditions: 600000,
    salvageValue: 1800000,
    depreciationMethod: 'UOP',
    cumulativeMaintenanceOpex: 1450000,
    warrantyExpiry: '20 Jun 2024',
    isUnderWarranty: false,
    amcVendor: 'Nitol Motors Heavy Workshop',
    runtimeHours: 16800,
    ratedLifetimeHours: 32000,
    healthScore: 84,
    mtbfHours: 2400,
    mttrHours: 5,
    calibrationCycleDays: 180,
    nextServiceDate: '18 Nov 2026',
    daysToService: 20,
    regulatoryAuthority: 'BRTA',
    spares: [
      { id: 'SP-301', partNo: 'TYR-HVY-295', name: 'Heavy Truck Radial Tire (295/80R22.5)', stockQty: 6, minReorderQty: 4, unitCostBdt: 46000, leadTimeDays: 3 },
      { id: 'SP-302', partNo: 'VLV-BIT-4IN', name: '4-Inch Rear Bitumen Unloading Valve', stockQty: 2, minReorderQty: 1, unitCostBdt: 38000, leadTimeDays: 5 },
    ],
    custodyHistory: [
      {
        id: 'CH-301',
        custodianName: 'Md. Kamruzzaman',
        custodianEmpId: 'EMP-0045',
        department: 'Transport & Logistics',
        facility: 'Keraniganj Bitumen Refinery',
        functionalLocation: 'Keraniganj Truck Loading Bay #3',
        assignedDate: '14 Oct 2026',
        acknowledged: true,
        acknowledgedAt: '14 Oct 2026, 05:00 PM',
        conditionOnHandover: 'Transferred from Chattogram Depot for Dhaka–Mawa Road Supply',
        gatePassRef: 'GP-CTG-8841',
      },
    ],
    lifecycleEvents: [
      {
        id: 'EV-301',
        eventType: 'TRANSFER_COMPLETED',
        stage: 'operational',
        title: 'Moved from Chattogram Terminal to Keraniganj Plant',
        notes: 'Assigned to Keraniganj fleet pool for peak winter highway bitumen deliveries.',
        actor: 'Md. Kamruzzaman',
        actorRole: 'Transport & Admin Supervisor',
        timestamp: '14 Oct 2026',
        sapRef: 'TRF-2026-019',
        hash: makeHash('AST-003-trf'),
      },
    ],
  },
  {
    id: 'AST-004',
    tag: 'BOGCL-HQ-LAP-1042',
    sapAssetNo: 'AST-REG-00412',
    name: 'Apple MacBook Pro 14" Work Laptop',
    category: 'it',
    criticality: 'essential_b',
    lifecycleStage: 'operational',
    facility: 'Bashundhara Corporate HQ, Baridhara',
    functionalLocation: 'Sales & Distribution Floor (Level 4, Desk #14)',
    glCostCenter: 'ACC-4301-HQB',
    department: 'Sales & Distribution',
    custodian: 'Tanvir Ahmed',
    custodianEmpId: 'EMP-1042',
    custodianAcknowledged: true,
    oem: 'Apple Inc.',
    modelNo: 'MacBook Pro 14-inch (M3 Pro, 18GB RAM, 512GB)',
    serialNo: 'C02YM419-BG',
    specs: '14" Liquid Retina Display · M3 Pro Chip · 18GB Memory · Company Security Managed',
    procurementDate: '10 Feb 2025',
    commissioningDate: '14 Feb 2025',
    ageYears: 1.7,
    usefulLifeYears: 4,
    purchaseCost: 265000,
    capitalizedAdditions: 0,
    salvageValue: 35000,
    depreciationMethod: 'SLM',
    cumulativeMaintenanceOpex: 0,
    warrantyExpiry: '14 Feb 2027',
    isUnderWarranty: true,
    amcVendor: 'Executive Machines Ltd. (Apple Authorized)',
    runtimeHours: 3100,
    ratedLifetimeHours: 10000,
    healthScore: 98,
    mtbfHours: 8000,
    mttrHours: 2,
    calibrationCycleDays: 365,
    nextServiceDate: '14 Feb 2027',
    daysToService: 108,
    regulatoryAuthority: 'Corporate IT',
    spares: [],
    custodyHistory: [
      {
        id: 'CH-401',
        custodianName: 'Tanvir Ahmed',
        custodianEmpId: 'EMP-1042',
        department: 'Sales & Distribution',
        facility: 'Bashundhara Corporate HQ, Baridhara',
        functionalLocation: 'Sales Floor, Level 4',
        assignedDate: '14 Feb 2025',
        acknowledged: true,
        acknowledgedAt: '14 Feb 2025, 03:30 PM',
        conditionOnHandover: 'Brand New Sealed Box with Charger & Carry Sleeve',
      },
    ],
    lifecycleEvents: [
      {
        id: 'EV-401',
        eventType: 'CUSTODY_SIGNED',
        stage: 'operational',
        title: 'Handover Confirmed by Tanvir Ahmed (EMP-1042)',
        notes: 'Laptop issued for commercial sales tenders and client presentations.',
        actor: 'Tanvir Ahmed',
        actorRole: 'Senior Sales Officer',
        timestamp: '14 Feb 2025',
        hash: makeHash('AST-004-sign'),
      },
    ],
  },
  {
    id: 'AST-005',
    tag: 'BOGCL-HQ-PHN-1042',
    sapAssetNo: 'AST-REG-00488',
    name: 'Apple iPhone 15 Corporate Field Sales Phone',
    category: 'it',
    criticality: 'general_c',
    lifecycleStage: 'operational',
    facility: 'Bashundhara Corporate HQ, Baridhara',
    functionalLocation: 'Sales & Distribution Floor (Level 4)',
    glCostCenter: 'ACC-4301-HQB',
    department: 'Sales & Distribution',
    custodian: 'Tanvir Ahmed',
    custodianEmpId: 'EMP-1042',
    custodianAcknowledged: false, // Allows Tanvir to click "Confirm Receipt" cleanly!
    oem: 'Apple Inc.',
    modelNo: 'iPhone 15 (128GB, Black)',
    serialNo: 'F2LMN902-BG',
    specs: '5G Corporate Handset · Includes Official SIM & Protective Case',
    procurementDate: '25 Oct 2026',
    commissioningDate: '28 Oct 2026',
    ageYears: 0.1,
    usefulLifeYears: 3,
    purchaseCost: 118000,
    capitalizedAdditions: 0,
    salvageValue: 18000,
    depreciationMethod: 'SLM',
    cumulativeMaintenanceOpex: 0,
    warrantyExpiry: '28 Oct 2027',
    isUnderWarranty: true,
    amcVendor: 'Gadget & Gear Corporate Desk',
    runtimeHours: 24,
    ratedLifetimeHours: 8000,
    healthScore: 100,
    mtbfHours: 6000,
    mttrHours: 2,
    calibrationCycleDays: 365,
    nextServiceDate: '28 Oct 2027',
    daysToService: 364,
    regulatoryAuthority: 'Corporate IT',
    spares: [],
    custodyHistory: [
      {
        id: 'CH-501',
        custodianName: 'Tanvir Ahmed',
        custodianEmpId: 'EMP-1042',
        department: 'Sales & Distribution',
        facility: 'Bashundhara Corporate HQ, Baridhara',
        functionalLocation: 'Sales Floor, Level 4',
        assignedDate: '28 Oct 2026',
        acknowledged: false,
        conditionOnHandover: 'Brand New — Waiting for Staff Receipt Confirmation',
      },
    ],
    lifecycleEvents: [
      {
        id: 'EV-501',
        eventType: 'CUSTODY_ASSIGNED',
        stage: 'operational',
        title: 'Issued to Tanvir Ahmed — Pending Receipt Confirmation',
        notes: 'Handed over from HR & IT desk for regional dealer calls and mobile attendance.',
        actor: 'Sayeda Afroza Sultana',
        actorRole: 'GM, HR & Administration',
        timestamp: '28 Oct 2026',
        financialDeltaBdt: 118000,
        hash: makeHash('AST-005-issue'),
      },
    ],
  },
  {
    id: 'AST-006',
    tag: 'BOGCL-KER-BLR-01',
    sapAssetNo: 'AST-REG-00108',
    name: 'Main Bitumen Storage Tank Heating Boiler #1',
    category: 'plant',
    criticality: 'critical_a',
    lifecycleStage: 'calibration_due',
    facility: 'Keraniganj Bitumen Refinery',
    functionalLocation: 'Boiler House, Storage Tank Yard',
    glCostCenter: 'ACC-4102-KER',
    department: 'Plant Operations',
    custodian: 'Engr. Md. Harunur Rashid',
    custodianEmpId: 'EMP-0012',
    custodianAcknowledged: true,
    oem: 'Bosch Industrial Boilers',
    modelNo: 'UT-H 4000 Thermal Heater',
    serialNo: 'BSH-2021-4409',
    specs: '4-Ton Industrial Steam & Thermal Oil Heater · Keeps Bitumen Tanks Warm at 165°C',
    procurementDate: '15 Apr 2021',
    commissioningDate: '10 May 2021',
    ageYears: 5.5,
    usefulLifeYears: 15,
    purchaseCost: 19500000,
    capitalizedAdditions: 850000,
    salvageValue: 1950000,
    depreciationMethod: 'SLM',
    cumulativeMaintenanceOpex: 1680000,
    warrantyExpiry: '10 May 2024',
    isUnderWarranty: false,
    amcVendor: 'Bosch Industrial Service BD',
    runtimeHours: 24500,
    ratedLifetimeHours: 60000,
    healthScore: 79,
    mtbfHours: 2800,
    mttrHours: 4,
    calibrationCycleDays: 365,
    nextServiceDate: '12 Nov 2026',
    daysToService: 14,
    regulatoryAuthority: 'Dept. of Explosives (DoE)',
    spares: [
      { id: 'SP-601', partNo: 'VLV-SFT-2IN', name: 'High-Pressure Safety Relief Valve', stockQty: 2, minReorderQty: 2, unitCostBdt: 68000, leadTimeDays: 5 },
      { id: 'SP-602', partNo: 'BRN-NOZ-08', name: 'Gas Burner Ignition Nozzle', stockQty: 3, minReorderQty: 2, unitCostBdt: 24000, leadTimeDays: 4 },
    ],
    custodyHistory: [
      {
        id: 'CH-601',
        custodianName: 'Engr. Md. Harunur Rashid',
        custodianEmpId: 'EMP-0012',
        department: 'Plant Operations',
        facility: 'Keraniganj Bitumen Refinery',
        functionalLocation: 'Boiler House, Storage Tank Yard',
        assignedDate: '10 May 2021',
        acknowledged: true,
        acknowledgedAt: '10 May 2021, 09:30 AM',
        conditionOnHandover: 'Installed & Certified by Chief Boiler Inspector',
      },
    ],
    lifecycleEvents: [
      {
        id: 'EV-601',
        eventType: 'PM_CERTIFIED',
        stage: 'calibration_due',
        title: 'Annual Safety Valve & Pressure Check Due Within 14 Days',
        notes: 'Scheduled for annual government boiler safety inspection before 12 Nov 2026.',
        actor: 'Engr. Tariqul Islam',
        actorRole: 'Senior Plant Maintenance Engineer',
        timestamp: '24 Oct 2026',
        hash: makeHash('AST-006-cal'),
      },
    ],
  },
  {
    id: 'AST-007',
    tag: 'BOGCL-KER-FIR-04',
    sapAssetNo: 'AST-REG-00304',
    name: 'Factory Fire Water Pump & Foam Hydrant System',
    category: 'safety',
    criticality: 'critical_a',
    lifecycleStage: 'operational',
    facility: 'Keraniganj Bitumen Refinery',
    functionalLocation: 'Fire Pump Station, Main Gate #1',
    glCostCenter: 'ACC-4109-KER',
    department: 'HSE & Compliance',
    custodian: 'Nazmul Huda',
    custodianEmpId: 'EMP-1104',
    custodianAcknowledged: true,
    oem: 'Kirloskar Fire Systems',
    modelNo: 'KFP-500 Diesel + Electric Dual Pump',
    serialNo: 'KFP-2022-9104',
    specs: '500 GPM High-Pressure Fire Water & Foam Pump · Auto-Starts on Fire Alarm',
    procurementDate: '01 Aug 2022',
    commissioningDate: '20 Aug 2022',
    ageYears: 4.2,
    usefulLifeYears: 12,
    purchaseCost: 6800000,
    capitalizedAdditions: 0,
    salvageValue: 650000,
    depreciationMethod: 'SLM',
    cumulativeMaintenanceOpex: 320000,
    warrantyExpiry: '20 Aug 2025',
    isUnderWarranty: false,
    runtimeHours: 1450,
    ratedLifetimeHours: 20000,
    healthScore: 95,
    mtbfHours: 5000,
    mttrHours: 2,
    calibrationCycleDays: 90,
    nextServiceDate: '05 Jan 2027',
    daysToService: 68,
    regulatoryAuthority: 'Dept. of Explosives (DoE)',
    spares: [
      { id: 'SP-701', partNo: 'HSE-2.5IN-30M', name: '30-Meter Canvas Fire Hose Reel', stockQty: 8, minReorderQty: 4, unitCostBdt: 14500, leadTimeDays: 2 },
    ],
    custodyHistory: [
      {
        id: 'CH-701',
        custodianName: 'Nazmul Huda',
        custodianEmpId: 'EMP-1104',
        department: 'HSE & Compliance',
        facility: 'Keraniganj Bitumen Refinery',
        functionalLocation: 'Fire Pump Station',
        assignedDate: '05 Jan 2023',
        acknowledged: true,
        acknowledgedAt: '05 Jan 2023, 11:00 AM',
        conditionOnHandover: 'Tested at 8.5 Bar Full Pressure',
      },
    ],
    lifecycleEvents: [
      {
        id: 'EV-701',
        eventType: 'PM_CERTIFIED',
        stage: 'operational',
        title: 'Quarterly Fire Drill & Water Pressure Check Passed',
        notes: 'Tested with Fire Service guidelines; full tank yard pressure reached in 12 seconds.',
        actor: 'Nazmul Huda',
        actorRole: 'Senior Safety & Environment Officer',
        timestamp: '05 Oct 2026',
        sapRef: 'CERT-FIRE-2026-10',
        hash: makeHash('AST-007-drill'),
      },
    ],
  },
  {
    id: 'AST-008',
    tag: 'BOGCL-KER-LAB-02',
    sapAssetNo: 'AST-REG-00502',
    name: 'Automatic Bitumen Hardness & Quality Testing Machine',
    category: 'lab',
    criticality: 'essential_b',
    lifecycleStage: 'operational',
    facility: 'Keraniganj Bitumen Refinery',
    functionalLocation: 'Quality Testing Lab, Room #2',
    glCostCenter: 'ACC-4115-KER',
    department: 'Plant Operations',
    custodian: 'Engr. Md. Harunur Rashid',
    custodianEmpId: 'EMP-0012',
    custodianAcknowledged: true,
    oem: 'Controls Group Italy',
    modelNo: 'Bitutest Digital Penetrometer 81-PV',
    serialNo: 'CTL-2023-5521',
    specs: 'Digital Lab Tester for Road Bitumen Grade 60/70 & 80/100 BSTI Quality Certificates',
    procurementDate: '12 May 2023',
    commissioningDate: '25 May 2023',
    ageYears: 3.4,
    usefulLifeYears: 8,
    purchaseCost: 2850000,
    capitalizedAdditions: 0,
    salvageValue: 250000,
    depreciationMethod: 'SLM',
    cumulativeMaintenanceOpex: 140000,
    warrantyExpiry: '25 May 2026',
    isUnderWarranty: false,
    runtimeHours: 4200,
    ratedLifetimeHours: 16000,
    healthScore: 92,
    mtbfHours: 4000,
    mttrHours: 2,
    calibrationCycleDays: 180,
    nextServiceDate: '25 Mar 2027',
    daysToService: 147,
    regulatoryAuthority: 'BSTI',
    spares: [
      { id: 'SP-801', partNo: 'NDL-BSTI-60', name: 'Certified Stainless Testing Needle Set', stockQty: 10, minReorderQty: 3, unitCostBdt: 8500, leadTimeDays: 5 },
    ],
    custodyHistory: [
      {
        id: 'CH-801',
        custodianName: 'Engr. Md. Harunur Rashid',
        custodianEmpId: 'EMP-0012',
        department: 'Plant Operations',
        facility: 'Keraniganj Bitumen Refinery',
        functionalLocation: 'Quality Testing Lab',
        assignedDate: '25 May 2023',
        acknowledged: true,
        acknowledgedAt: '25 May 2023, 02:00 PM',
        conditionOnHandover: 'BSTI Accuracy Checked & Certified',
      },
    ],
    lifecycleEvents: [
      {
        id: 'EV-801',
        eventType: 'PM_CERTIFIED',
        stage: 'operational',
        title: 'BSTI Annual Accuracy Check Passed',
        notes: 'Verified accurate within ±0.05 mm for highway bitumen batch testing.',
        actor: 'Engr. Md. Harunur Rashid',
        actorRole: 'Plant General Manager',
        timestamp: '25 Sep 2026',
        sapRef: 'BSTI-CAL-2026-98',
        hash: makeHash('AST-008-bsti'),
      },
    ],
  },
  {
    id: 'AST-009',
    tag: 'BOGCL-HQ-SRV-01',
    sapAssetNo: 'AST-REG-00401',
    name: 'Head Office Main Accounting Server & Backup Rack',
    category: 'it',
    criticality: 'critical_a',
    lifecycleStage: 'operational',
    facility: 'Bashundhara Corporate HQ, Baridhara',
    functionalLocation: 'Head Office Server Room (Level 8)',
    glCostCenter: 'ACC-4301-HQB',
    department: 'Finance & Accounts',
    custodian: 'Farida Begum',
    custodianEmpId: 'EMP-0062',
    custodianAcknowledged: true,
    oem: 'Dell Technologies',
    modelNo: 'PowerEdge R760 Enterprise Server',
    serialNo: 'DLL-760-99201',
    specs: 'Dual Xeon Processors · 256GB RAM · 24TB Mirrored Storage with Daily Cloud Backup',
    procurementDate: '01 Nov 2023',
    commissioningDate: '15 Nov 2023',
    ageYears: 2.9,
    usefulLifeYears: 5,
    purchaseCost: 4200000,
    capitalizedAdditions: 350000,
    salvageValue: 400000,
    depreciationMethod: 'SLM',
    cumulativeMaintenanceOpex: 95000,
    warrantyExpiry: '15 Nov 2026',
    isUnderWarranty: true,
    amcVendor: 'Flora Systems Enterprise Support',
    runtimeHours: 25400,
    ratedLifetimeHours: 43800,
    healthScore: 96,
    mtbfHours: 12000,
    mttrHours: 1.5,
    calibrationCycleDays: 180,
    nextServiceDate: '15 Jan 2027',
    daysToService: 78,
    regulatoryAuthority: 'Corporate IT',
    spares: [
      { id: 'SP-901', partNo: 'SSD-NVME-3.8T', name: '3.84TB Enterprise Hot-Swap SSD Drive', stockQty: 2, minReorderQty: 1, unitCostBdt: 85000, leadTimeDays: 2 },
    ],
    custodyHistory: [
      {
        id: 'CH-901',
        custodianName: 'Farida Begum',
        custodianEmpId: 'EMP-0062',
        department: 'Finance & Accounts',
        facility: 'Bashundhara Corporate HQ, Baridhara',
        functionalLocation: 'Server Room, Level 8',
        assignedDate: '15 Nov 2023',
        acknowledged: true,
        acknowledgedAt: '15 Nov 2023, 04:00 PM',
        conditionOnHandover: 'Rack Mounted with UPS Battery Protection',
      },
    ],
    lifecycleEvents: [
      {
        id: 'EV-901',
        eventType: 'COMMISSIONED',
        stage: 'operational',
        title: 'Activated for Company Accounting, Payroll & Document Storage',
        notes: 'Protected under 3-year Dell ProSupport warranty.',
        actor: 'Farida Begum',
        actorRole: 'Head of Finance & Approver',
        timestamp: '15 Nov 2023',
        financialDeltaBdt: 4200000,
        hash: makeHash('AST-009-srv'),
      },
    ],
  },
  {
    id: 'AST-010',
    tag: 'BOGCL-HQ-LAP-1099',
    sapAssetNo: 'AST-REG-00499',
    name: 'Dell Latitude 5540 Office Laptop (Ready in Store Room)',
    category: 'it',
    criticality: 'general_c',
    lifecycleStage: 'in_stock',
    facility: 'Bashundhara Corporate HQ, Baridhara',
    functionalLocation: 'HR & IT Equipment Store Room (Level 6)',
    glCostCenter: 'ACC-4301-HQB',
    department: 'Human Resources',
    custodian: 'Central Store Pool (Unassigned)',
    custodianAcknowledged: true,
    oem: 'Dell Technologies',
    modelNo: 'Latitude 5540 Core i7 (16GB / 512GB)',
    serialNo: 'DLL-5540-7821',
    specs: '15.6" Full HD Business Laptop · Ready to Assign to New Staff',
    procurementDate: '01 Jun 2025',
    commissioningDate: '05 Jun 2025',
    ageYears: 1.4,
    usefulLifeYears: 4,
    purchaseCost: 145000,
    capitalizedAdditions: 0,
    salvageValue: 20000,
    depreciationMethod: 'SLM',
    cumulativeMaintenanceOpex: 0,
    warrantyExpiry: '05 Jun 2028',
    isUnderWarranty: true,
    runtimeHours: 1800,
    ratedLifetimeHours: 10000,
    healthScore: 97,
    mtbfHours: 7000,
    mttrHours: 2,
    calibrationCycleDays: 365,
    nextServiceDate: '05 Jun 2027',
    daysToService: 219,
    regulatoryAuthority: 'Corporate IT',
    spares: [],
    custodyHistory: [
      {
        id: 'CH-1001',
        custodianName: 'Shakil Ahmed',
        custodianEmpId: 'EMP-0782',
        department: 'Finance & Accounts',
        facility: 'Bashundhara Corporate HQ, Baridhara',
        functionalLocation: 'Accounts Desk, Level 9',
        assignedDate: '05 Jun 2025',
        returnedDate: '15 Sep 2026 (Exit Clearance)',
        acknowledged: true,
        conditionOnHandover: 'Issued New',
      },
      {
        id: 'CH-1002',
        custodianName: 'Central Store Pool (Unassigned)',
        department: 'Human Resources',
        facility: 'Bashundhara Corporate HQ, Baridhara',
        functionalLocation: 'HR & IT Equipment Store Room (Level 6)',
        assignedDate: '15 Sep 2026',
        acknowledged: true,
        acknowledgedAt: '15 Sep 2026, 04:15 PM',
        conditionOnHandover: 'Returned Clean During Exit Clearance of Shakil Ahmed (EMP-0782)',
      },
    ],
    lifecycleEvents: [
      {
        id: 'EV-1001',
        eventType: 'CUSTODY_RECLAIMED',
        stage: 'in_stock',
        title: 'Returned to Store Room During Staff Exit Clearance (Shakil Ahmed)',
        notes: 'Checked by IT, wiped clean, and ready to assign to next joining officer.',
        actor: 'Sayeda Afroza Sultana',
        actorRole: 'GM, HR & Administration',
        timestamp: '15 Sep 2026',
        hash: makeHash('AST-010-ret'),
      },
    ],
  },
  {
    id: 'AST-011',
    tag: 'BOGCL-KER-FRK-02',
    sapAssetNo: 'AST-REG-00145',
    name: '2016 Toyota 3-Ton Warehouse Diesel Forklift',
    category: 'plant',
    criticality: 'general_c',
    lifecycleStage: 'decommissioned',
    facility: 'Keraniganj Bitumen Refinery',
    functionalLocation: 'Scrap & Auction Holding Yard, Keraniganj',
    glCostCenter: 'ACC-4102-KER',
    department: 'Plant Operations',
    custodian: 'Engr. Md. Harunur Rashid',
    custodianEmpId: 'EMP-0012',
    custodianAcknowledged: true,
    oem: 'Toyota Material Handling',
    modelNo: '8FD30 3-Ton Forklift',
    serialNo: 'TYT-2016-3019',
    specs: '3-Ton Drum Lifting Forklift · 10 Years Old · High Engine Repair Cost',
    procurementDate: '10 Aug 2016',
    commissioningDate: '20 Aug 2016',
    ageYears: 10.2,
    usefulLifeYears: 10,
    purchaseCost: 3400000,
    capitalizedAdditions: 0,
    salvageValue: 340000,
    depreciationMethod: 'SLM',
    cumulativeMaintenanceOpex: 2150000,
    warrantyExpiry: '20 Aug 2019',
    isUnderWarranty: false,
    runtimeHours: 24800,
    ratedLifetimeHours: 25000,
    healthScore: 34,
    mtbfHours: 420,
    mttrHours: 14,
    calibrationCycleDays: 180,
    nextServiceDate: 'Retired',
    daysToService: 0,
    regulatoryAuthority: 'ASME / API-510',
    spares: [],
    disposalDossier: {
      reason: 'Economic Life Exhausted',
      surveyNotes: 'Completed full 10-year service life. Total lifetime repairs reached 63% of purchase price, and hydraulic transmission needs ৳7.5L rebuild. Recommended for open scrap/used-machinery auction.',
      initiatedBy: 'Engr. Md. Harunur Rashid (Plant General Manager)',
      initiatedDate: '24 Oct 2026',
      checklist: {
        technicalSurveySigned: true,
        decontaminationOrDataWipeCertified: true,
        sparesHarvested: true,
        financeCfoVetted: true,
      },
    },
    custodyHistory: [
      {
        id: 'CH-1101',
        custodianName: 'Engr. Md. Harunur Rashid',
        custodianEmpId: 'EMP-0012',
        department: 'Plant Operations',
        facility: 'Keraniganj Bitumen Refinery',
        functionalLocation: 'Drum Warehouse Bay',
        assignedDate: '20 Aug 2016',
        acknowledged: true,
        conditionOnHandover: '10 Years Heavy Warehouse Duty Completed',
      },
    ],
    lifecycleEvents: [
      {
        id: 'EV-1101',
        eventType: 'DECOMMISSION_SURVEY',
        stage: 'decommissioned',
        title: 'Marked for Retirement & Auction Sale (10-Year Life Completed)',
        notes: 'All 4 safety and finance checks completed. Ready for Chairman / Finance final write-off approval.',
        actor: 'Engr. Md. Harunur Rashid',
        actorRole: 'Plant General Manager',
        timestamp: '24 Oct 2026',
        hash: makeHash('AST-011-ret'),
      },
    ],
  },
  {
    id: 'AST-012',
    tag: 'BOGCL-HQ-PRN-04',
    sapAssetNo: 'AST-REG-00380',
    name: '2019 Canon Heavy Office Photocopier (Sold in Auction)',
    category: 'corporate',
    criticality: 'general_c',
    lifecycleStage: 'disposed',
    facility: 'Bashundhara Corporate HQ, Baridhara',
    functionalLocation: 'Disposed / Historical Archive',
    glCostCenter: 'ACC-4401-HQB',
    department: 'Human Resources',
    custodian: 'Disposed / Retired Archive',
    custodianAcknowledged: true,
    oem: 'Canon Inc.',
    modelNo: 'imageRUNNER ADVANCE 4545i',
    serialNo: 'CNN-2019-1182',
    specs: '45 ppm Floor-Standing Office Photocopier & Scanner (Replaced by New 2026 Model)',
    procurementDate: '15 Jun 2019',
    commissioningDate: '20 Jun 2019',
    ageYears: 7.3,
    usefulLifeYears: 6,
    purchaseCost: 480000,
    capitalizedAdditions: 0,
    salvageValue: 45000,
    depreciationMethod: 'SLM',
    cumulativeMaintenanceOpex: 165000,
    warrantyExpiry: '20 Jun 2022',
    isUnderWarranty: false,
    runtimeHours: 14000,
    ratedLifetimeHours: 14000,
    healthScore: 0,
    mtbfHours: 1200,
    mttrHours: 4,
    calibrationCycleDays: 365,
    nextServiceDate: 'Archived',
    daysToService: 0,
    regulatoryAuthority: 'Corporate IT',
    spares: [],
    disposalDossier: {
      reason: 'Technological Obsolescence',
      surveyNotes: 'Internal hard drive wiped clean by IT before resale to used office equipment buyer.',
      initiatedBy: 'Sayeda Afroza Sultana (GM, HR & Administration)',
      initiatedDate: '02 Sep 2026',
      checklist: {
        technicalSurveySigned: true,
        decontaminationOrDataWipeCertified: true,
        sparesHarvested: true,
        financeCfoVetted: true,
      },
      disposalMethod: 'Public Tender / Auction',
      buyerOrVendor: 'Motijheel Office Machines Resale House',
      salvageProceedsBdt: 58000,
      netBookValueAtDisposal: 45000,
      gainOrLossBdt: 13000,
      authorizedBy: 'Farida Begum (Head of Finance & Approver)',
      disposedDate: '10 Sep 2026',
      sapRetirementVoucher: 'VCH-RET-2026-4410',
    },
    custodyHistory: [],
    lifecycleEvents: [
      {
        id: 'EV-1201',
        eventType: 'DISPOSED_ARCHIVED',
        stage: 'disposed',
        title: 'Sold via Vendor Quote for ৳58,000 (+৳13,000 Gain Over Book Value)',
        notes: 'Sale proceeds deposited to company account (Voucher VCH-RET-2026-4410).',
        actor: 'Farida Begum',
        actorRole: 'Head of Finance & Approver',
        timestamp: '10 Sep 2026',
        financialDeltaBdt: 58000,
        sapRef: 'VCH-RET-2026-4410',
        hash: makeHash('AST-012-disp'),
      },
    ],
  },
];

const INITIAL_WORK_ORDERS: AssetWorkOrder[] = [
  {
    id: 'WO-01',
    woNumber: 'WO-2026-0951',
    assetId: 'AST-006',
    assetTag: 'BOGCL-KER-BLR-01',
    assetName: 'Main Bitumen Storage Tank Heating Boiler #1',
    type: 'CAL',
    priority: 'critical',
    title: 'Annual Boiler Safety Valve & Water Pressure Fitness Test',
    assignedEngineer: 'Engr. Tariqul Islam',
    facility: 'Keraniganj Bitumen Refinery',
    lotoPermitRef: 'SAFE-PERMIT-104',
    regulatoryBody: 'Office of the Chief Inspector of Boilers',
    estimatedCostBdt: 75000,
    isCapexOverhaul: false,
    coveredByWarranty: false,
    status: 'in_progress',
    dueDate: '12 Nov 2026',
    remarks: 'Mandatory annual safety test required to renew the Plant Boiler Fitness Certificate.',
  },
  {
    id: 'WO-02',
    woNumber: 'WO-2026-0954',
    assetId: 'AST-001',
    assetTag: 'BOGCL-KER-GEN-101',
    assetName: '1,200 kVA Main Factory Backup Power Generator',
    type: 'PM',
    priority: 'high',
    title: 'Cooling Water Pump & Alternator Seal Major Servicing',
    assignedEngineer: 'Energypac Service Team',
    facility: 'Keraniganj Bitumen Refinery',
    lotoPermitRef: 'SAFE-PERMIT-109',
    estimatedCostBdt: 4850000,
    isCapexOverhaul: true,
    coveredByWarranty: false,
    status: 'scheduled',
    dueDate: '15 Nov 2026',
    remarks: 'Major life-extending overhaul (+2 years extra life) linked to Official Document BOGCL/PLANT/2026/0894.',
  },
  {
    id: 'WO-03',
    woNumber: 'WO-2026-0942',
    assetId: 'AST-002',
    assetTag: 'BOGCL-VEH-CAR-01',
    assetName: 'Toyota Prado TXL Executive Car (DHAKA METRO GHA-13-8821)',
    type: 'PM',
    priority: 'routine',
    title: '40,000 km Routine Engine Oil, Brake & AC Servicing',
    assignedEngineer: 'Navana Toyota Service Center',
    facility: 'Bashundhara Corporate HQ, Baridhara',
    estimatedCostBdt: 42000,
    isCapexOverhaul: false,
    coveredByWarranty: false,
    status: 'completed',
    dueDate: '22 Jul 2026',
    completedDate: '22 Jul 2026',
    certificateNo: 'CERT-PM-2026-882',
    remarks: 'Completed on schedule; vehicle cleared for VIP & Head Office trips.',
  },
];

const INITIAL_REQUISITIONS: AssetRequisition[] = [
  {
    id: 'ARQ-01',
    reqNumber: 'ARQ-2026-022',
    title: 'New 3-Ton Electric Warehouse Forklift (Replacing 2016 Diesel Unit)',
    category: 'plant',
    criticality: 'essential_b',
    facility: 'Keraniganj Bitumen Refinery',
    department: 'Plant Operations',
    requestedBy: 'Engr. Md. Harunur Rashid',
    requestedByEmpId: 'EMP-0012',
    requestedDate: '26 Oct 2026',
    estimatedCapexBdt: 4200000,
    justification: 'Replaces our retired 10-year-old diesel forklift (BOGCL-KER-FRK-02) with a clean, low-maintenance electric loader for drum handling.',
    specs: 'Toyota 3-Ton Lithium-Ion Electric Forklift · Zero Indoor Smoke · 3-Year Full Warranty',
    urgency: 'high',
    stage: 'pending_executive',
    endorsedByHod: 'Farida Begum (Head of Finance & Approver)',
  },
  {
    id: 'ARQ-02',
    reqNumber: 'ARQ-2026-023',
    title: 'Portable Projector & Wireless Clicker for Client Presentations',
    category: 'it',
    criticality: 'general_c',
    facility: 'Bashundhara Corporate HQ, Baridhara',
    department: 'Sales & Distribution',
    requestedBy: 'Tanvir Ahmed',
    requestedByEmpId: 'EMP-1042',
    requestedDate: '28 Oct 2026',
    estimatedCapexBdt: 95000,
    justification: 'Needed by the Sales team for dealer meetings and Roads & Highways tender presentations.',
    specs: 'Epson Full HD Business Projector (4,000 Lumens) with HDMI & Carry Bag',
    urgency: 'normal',
    stage: 'pending_hod',
  },
  {
    id: 'ARQ-03',
    reqNumber: 'ARQ-2026-021',
    title: 'Digital Truck Weighbridge Scale Display Unit (Gate #2)',
    category: 'plant',
    criticality: 'critical_a',
    facility: 'Keraniganj Bitumen Refinery',
    department: 'Transport & Logistics',
    requestedBy: 'Md. Kamruzzaman',
    requestedByEmpId: 'EMP-0045',
    requestedDate: '21 Oct 2026',
    estimatedCapexBdt: 380000,
    justification: 'Ensures fast, accurate weight slips for every outgoing bitumen tanker at Keraniganj Gate #2.',
    specs: 'Mettler Toledo 60-Ton Digital Weighbridge Terminal & Receipt Printer (BSTI Approved)',
    urgency: 'high',
    stage: 'approved_procuring',
    endorsedByHod: 'Farida Begum (Head of Finance & Approver)',
    sanctionedByExec: 'Ahmed Akbar Sobhan (Chairman & MD)',
  },
];

const INITIAL_TRANSFERS: AssetTransfer[] = [
  {
    id: 'TRF-01',
    transferRef: 'TRF-2026-019',
    assetId: 'AST-003',
    assetTag: 'BOGCL-VEH-TNK-03',
    assetName: 'Tata Prima 18,000L Heated Bitumen Tanker (DHAKA METRO KHA-11-9042)',
    fromFacility: 'Chattogram Patenga Terminal',
    toFacility: 'Keraniganj Bitumen Refinery',
    fromLocation: 'Patenga Depot Parking Bay #04',
    toLocation: 'Keraniganj Truck Loading Bay #3',
    fromCustodian: 'Patenga Depot Supervisor',
    toCustodian: 'Md. Kamruzzaman',
    toCustodianEmpId: 'EMP-0045',
    toDepartment: 'Transport & Logistics',
    gatePassNo: 'GP-CTG-8841',
    reason: 'Moved to Keraniganj Plant to support high highway bitumen deliveries on Dhaka–Mawa corridor.',
    status: 'completed',
    initiatedBy: 'Md. Kamruzzaman',
    initiatedAt: '14 Oct 2026, 08:30 AM',
    completedAt: '14 Oct 2026, 04:45 PM',
  },
];

/* ──────────────────────────────────────────────────────────────────────────
   GLOBAL REACTIVE STORE SINGLETON
   ────────────────────────────────────────────────────────────────────────── */
let globalAssets: AssetRecord[] = [...INITIAL_ASSETS];
let globalWorkOrders: AssetWorkOrder[] = [...INITIAL_WORK_ORDERS];
let globalRequisitions: AssetRequisition[] = [...INITIAL_REQUISITIONS];
let globalTransfers: AssetTransfer[] = [...INITIAL_TRANSFERS];

let listeners: Array<() => void> = [];
const notify = () => listeners.forEach((fn) => fn());

export function getAssetStoreSnapshot() {
  return {
    assets: globalAssets,
    workOrders: globalWorkOrders,
    requisitions: globalRequisitions,
    transfers: globalTransfers,
  };
}

export function subscribeAssetStore(listener: () => void): () => void {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

export function advanceAssetRequisitionById(reqId: string, actorName: string, actorRole: string) {
  const req = globalRequisitions.find((r) => r.id === reqId || r.reqNumber === reqId);
  if (!req) return;
  if (req.stage === 'pending_hod') {
    globalRequisitions = globalRequisitions.map((r) =>
      r.id === req.id ? { ...r, stage: 'pending_executive', endorsedByHod: `${actorName} (${actorRole})` } : r
    );
    notify();
  } else if (req.stage === 'pending_executive') {
    globalRequisitions = globalRequisitions.map((r) =>
      r.id === req.id ? { ...r, stage: 'approved_procuring', sanctionedByExec: `${actorName} (${actorRole})` } : r
    );
    notify();
  }
}

export function rejectAssetRequisitionById(reqId: string, reason: string, actorName: string, actorRole: string) {
  globalRequisitions = globalRequisitions.map((r) =>
    r.id === reqId || r.reqNumber === reqId
      ? { ...r, stage: 'rejected', rejectionNote: `${reason} — Returned by ${actorName} (${actorRole})` }
      : r
  );
  notify();
}

const getCategoryGl = (cat: AssetCategory, facility: AssetFacility) => {
  const siteCode =
    facility === 'Keraniganj Bitumen Refinery'
      ? 'KER'
      : facility === 'Chattogram Patenga Terminal'
      ? 'CTG'
      : 'HQB';
  switch (cat) {
    case 'plant':
      return `ACC-4102-${siteCode}`;
    case 'vehicle':
      return `ACC-4205-${siteCode}`;
    case 'it':
      return `ACC-4301-${siteCode}`;
    case 'safety':
      return `ACC-4109-${siteCode}`;
    case 'lab':
      return `ACC-4115-${siteCode}`;
    case 'corporate':
      return `ACC-4401-${siteCode}`;
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
    const listener = () => setTick((n) => n + 1);
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  /* 1. Register New Asset */
  const registerAsset = (input: RegisterAssetInput): AssetRecord => {
    const seq = globalAssets.length + 1;
    const id = `AST-${String(seq).padStart(3, '0')}`;
    const sapAssetNo = `AST-REG-${String(500 + seq).padStart(5, '0')}`;
    const todayStr = SYSTEM_TODAY;
    const stage: LifecycleStage = input.placeInStorePool ? 'in_stock' : 'operational';
    const custodianName = input.placeInStorePool ? 'Central Store Pool (Unassigned)' : input.custodian;

    const warrantyDate = new Date(2026, 9, 29);
    warrantyDate.setMonth(warrantyDate.getMonth() + (input.warrantyMonths || 24));
    const warrantyExpiry = warrantyDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const nextSvc = new Date(2026, 9, 29);
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
      functionalLocation: input.functionalLocation || 'Main Work Area',
      glCostCenter: getCategoryGl(input.category, input.facility),
      department: input.department,
      custodian: custodianName,
      custodianEmpId: input.placeInStorePool ? undefined : input.custodianEmpId,
      custodianAcknowledged: input.placeInStorePool ? true : false,
      oem: input.oem || 'Approved Supplier',
      modelNo: input.modelNo || '2026-Model',
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
      regulatoryAuthority: input.regulatoryAuthority || 'Corporate IT',
      spares: [],
      custodyHistory: [
        {
          id: `CH-${Date.now()}`,
          custodianName,
          custodianEmpId: input.placeInStorePool ? undefined : input.custodianEmpId,
          department: input.department,
          facility: input.facility,
          functionalLocation: input.functionalLocation || 'Main Work Area',
          assignedDate: todayStr,
          acknowledged: input.placeInStorePool ? true : false,
          conditionOnHandover: 'Brand New — Checked & Added to Asset Register',
        },
      ],
      lifecycleEvents: [
        {
          id: `EV-${Date.now()}`,
          eventType: input.placeInStorePool ? 'CAPITALIZED_TAGGED' : 'COMMISSIONED',
          stage,
          title: input.placeInStorePool
            ? `Registered (${sapAssetNo}) & Stored in Equipment Room`
            : `Registered & Assigned to ${custodianName} (${sapAssetNo})`,
          notes: `Purchase cost ৳${input.purchaseCost.toLocaleString()} recorded under ${getCategoryGl(input.category, input.facility)}. Expected life: ${input.usefulLifeYears} years.`,
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

  /* 2. Custodian Digital Receipt Confirmation */
  const acknowledgeCustody = (assetId: string, actorName: string, actorRole: string) => {
    globalAssets = globalAssets.map((a) => {
      if (a.id !== assetId) return a;
      const updatedHistory = a.custodyHistory.map((ch, idx) =>
        idx === a.custodyHistory.length - 1
          ? { ...ch, acknowledged: true, acknowledgedAt: `${SYSTEM_TODAY}, Just Now` }
          : ch
      );
      const ev: AssetLifecycleEvent = {
        id: `EV-${Date.now()}`,
        eventType: 'CUSTODY_SIGNED',
        stage: a.lifecycleStage === 'in_stock' ? 'operational' : a.lifecycleStage,
        title: `Equipment Receipt Confirmed by ${actorName}`,
        notes: 'Staff confirmed receiving the item in good working order.',
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

  /* 3. Initiate & Complete Transfer */
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
        title: `Gate Pass ${gatePassNo} Issued → Moving to ${params.toCustodian} (${params.toFacility})`,
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
          ? { ...ch, returnedDate: SYSTEM_TODAY }
          : ch
      );
      const newCustody: CustodyRecord = {
        id: `CH-${Date.now()}`,
        custodianName: trf.toCustodian,
        custodianEmpId: trf.toCustodianEmpId,
        department: trf.toDepartment,
        facility: trf.toFacility,
        functionalLocation: trf.toLocation,
        assignedDate: SYSTEM_TODAY,
        acknowledged: false,
        conditionOnHandover: `Received via Gate Pass ${trf.gatePassNo} — Waiting for Recipient Confirmation`,
        gatePassRef: trf.gatePassNo,
      };
      const ev: AssetLifecycleEvent = {
        id: `EV-${Date.now()}`,
        eventType: 'TRANSFER_COMPLETED',
        stage: 'operational',
        title: `Handover Completed at ${trf.toFacility} → ${trf.toCustodian}`,
        notes: `Gate Pass ${trf.gatePassNo} closed. Assigned under account ${getCategoryGl(a.category, trf.toFacility)}.`,
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

  /* 4. HR Exit Clearance: Return All Assigned Equipment to Store Room */
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
          ? { ...ch, returnedDate: `${SYSTEM_TODAY} (Exit Clearance)` }
          : ch
      );
      const storeCustody: CustodyRecord = {
        id: `CH-${Date.now()}-${reclaimedCount}`,
        custodianName: 'Central Store Pool (Returned on Exit)',
        department: 'Human Resources',
        facility: a.facility,
        functionalLocation: 'Equipment Store Room — Ready Inventory',
        assignedDate: SYSTEM_TODAY,
        acknowledged: true,
        acknowledgedAt: `${SYSTEM_TODAY}, Just Now`,
        conditionOnHandover: `Returned by ${employeeName} (${employeeId}) during HR Exit Clearance`,
      };
      const ev: AssetLifecycleEvent = {
        id: `EV-${Date.now()}-${reclaimedCount}`,
        eventType: 'CUSTODY_RECLAIMED',
        stage: 'in_stock',
        title: `Returned to Store Room on Staff Exit (${employeeName})`,
        notes: 'Checked in good condition and stored for reassignment.',
        actor: actorName,
        actorRole: 'HR & Administration',
        timestamp: 'Today, Just Now',
        hash: makeHash(`${a.id}-reclaim-${Date.now()}`),
      };

      return {
        ...a,
        lifecycleStage: 'in_stock',
        custodian: 'Central Store Pool (Unassigned)',
        custodianEmpId: undefined,
        custodianAcknowledged: true,
        functionalLocation: 'Equipment Store Room — Ready Inventory',
        custodyHistory: [...closedHistory, storeCustody],
        lifecycleEvents: [ev, ...a.lifecycleEvents],
      };
    });
    if (reclaimedCount > 0) notify();
    return reclaimedCount;
  };

  /* 5. Create & Complete Servicing / Safety Check Work Orders */
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
        ? { ...w, status: 'completed', completedDate: SYSTEM_TODAY, certificateNo: certNo }
        : w
    );

    globalAssets = globalAssets.map((a) => {
      if (a.id !== wo.assetId) return a;
      const nextSvc = new Date(2026, 9, 29);
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
        title: `${wo.woNumber} Completed (${certNo}) — ${wo.title}`,
        notes: wo.coveredByWarranty
          ? 'Repaired free of charge under supplier warranty (৳0 cost).'
          : wo.isCapexOverhaul
          ? `Major upgrade completed (+৳${addCapex.toLocaleString()} added to asset value, +2 years expected life).`
          : `Service completed. Cost ৳${addOpex.toLocaleString()} added to maintenance log. Next check in ${a.calibrationCycleDays} days.`,
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

  const certifyAssetDirect = (assetId: string, actorName: string, actorRole: string) => {
    const openWo = globalWorkOrders.find((w) => w.assetId === assetId && w.status !== 'completed');
    if (openWo) {
      completeWorkOrder(openWo.id, actorName, actorRole);
      return;
    }

    globalAssets = globalAssets.map((a) => {
      if (a.id !== assetId) return a;
      const certNo = `CERT-CHK-2026-${Math.floor(100 + Math.random() * 899)}`;
      const nextSvc = new Date(2026, 9, 29);
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
        title: `Safety & Quality Inspection Passed (${certNo})`,
        notes: `Next routine check scheduled in ${a.calibrationCycleDays} days (${nextDateStr}).`,
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

  /* 6. Report Issue / Fault on an Asset */
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
        title: `Problem Reported: "${data.reason}"`,
        notes: `${data.observation} — Requested Fix: ${data.improvementsRequired}`,
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

    const woNumber = `WO-2026-${String(globalWorkOrders.length + 960).padStart(4, '0')}`;
    const autoWo: AssetWorkOrder = {
      id: `WO-${Date.now()}`,
      woNumber,
      assetId: target.id,
      assetTag: target.tag,
      assetName: target.name,
      type: 'CM',
      priority: target.criticality === 'critical_a' ? 'critical' : 'high',
      title: `Repair Ticket: ${data.reason}`,
      assignedEngineer: target.category === 'it' ? 'Head Office IT Support' : 'Plant Maintenance Team',
      facility: target.facility,
      estimatedCostBdt: target.isUnderWarranty ? 0 : 25000,
      isCapexOverhaul: false,
      coveredByWarranty: target.isUnderWarranty,
      status: 'in_progress',
      dueDate: '05 Nov 2026',
      remarks: data.improvementsRequired,
    };
    globalWorkOrders = [autoWo, ...globalWorkOrders];

    notify();
  };

  /* 7. Spare Parts Use & Restock */
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
            title: `Spare Part Used: 1x ${consumedSpare.name} (${consumedSpare.partNo})`,
            notes: `Cost ৳${consumedSpare.unitCostBdt.toLocaleString()} added to maintenance log (${a.glCostCenter}).`,
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

  /* 8. Change Yearly Value-Drop Calculation Method */
  const changeDepreciationMethod = (assetId: string, method: DepreciationMethod, actorName: string, actorRole: string) => {
    const methodLabel =
      method === 'SLM'
        ? 'Equal Yearly Amount (Straight-Line)'
        : method === 'WDV'
        ? 'Percentage of Remaining Value (Reducing Balance)'
        : 'Based on Hours Used (Usage-Based)';
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
            title: `Valuation Method Changed to ${methodLabel}`,
            notes: `Recalculated in Asset Register (${a.sapAssetNo}).`,
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

  /* 9. New Asset Purchase Requests (Approve, Advance, or Reject) */
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
    const reqNumber = `ARQ-2026-${String(globalRequisitions.length + 24).padStart(3, '0')}`;
    const newReq: AssetRequisition = {
      id: `ARQ-${Date.now()}`,
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
    const req = globalRequisitions.find((r) => r.id === reqId || r.reqNumber === reqId);
    if (!req) return { nextStage: '' };

    if (req.stage === 'pending_hod') {
      globalRequisitions = globalRequisitions.map((r) =>
        r.id === req.id ? { ...r, stage: 'pending_executive', endorsedByHod: `${actorName} (${actorRole})` } : r
      );
      notify();
      return { nextStage: 'pending_executive' };
    }

    if (req.stage === 'pending_executive') {
      globalRequisitions = globalRequisitions.map((r) =>
        r.id === req.id ? { ...r, stage: 'approved_procuring', sanctionedByExec: `${actorName} (${actorRole})` } : r
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
        functionalLocation: `${req.department} — Main Assignment`,
        department: req.department,
        custodian: req.requestedBy,
        custodianEmpId: req.requestedByEmpId,
        placeInStorePool: false,
        oem: 'Approved Supplier',
        modelNo: '2026-Model',
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
        r.id === req.id ? { ...r, stage: 'commissioned', mintedAssetTag: minted.tag } : r
      );
      notify();
      return { nextStage: 'commissioned', mintedAsset: minted };
    }

    return { nextStage: req.stage };
  };

  const rejectRequisition = (reqId: string, reason: string, actorName: string, actorRole: string) => {
    globalRequisitions = globalRequisitions.map((r) =>
      r.id === reqId || r.reqNumber === reqId
        ? { ...r, stage: 'rejected', rejectionNote: `${reason} — Returned by ${actorName} (${actorRole})` }
        : r
    );
    notify();
  };

  /* 10. Retirement, 4-Step Pre-Disposal Check & Final Disposal */
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
        initiatedDate: SYSTEM_TODAY,
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
        title: `Marked for Retirement (${reason})`,
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

    const ck = asset.disposalDossier.checklist;
    const allChecksComplete =
      ck.technicalSurveySigned &&
      ck.decontaminationOrDataWipeCertified &&
      ck.sparesHarvested &&
      ck.financeCfoVetted;

    if (!allChecksComplete) {
      return null;
    }

    const fin = calculateAssetFinancials(asset);
    const nbvAtDisposal = fin.netBookValue;
    const gainOrLoss = params.salvageProceedsBdt - nbvAtDisposal;
    const sapVoucher = `VCH-RET-2026-${Math.floor(1000 + Math.random() * 8999)}`;

    globalAssets = globalAssets.map((a) => {
      if (a.id !== params.assetId || !a.disposalDossier) return a;
      const updatedDossier: AssetDisposalDossier = {
        ...a.disposalDossier,
        disposalMethod: params.disposalMethod,
        buyerOrVendor: params.buyerOrVendor,
        salvageProceedsBdt: params.salvageProceedsBdt,
        netBookValueAtDisposal: nbvAtDisposal,
        gainOrLossBdt: gainOrLoss,
        authorizedBy: `${params.actorName} (${params.actorRole})`,
        disposedDate: SYSTEM_TODAY,
        sapRetirementVoucher: sapVoucher,
      };
      const ev: AssetLifecycleEvent = {
        id: `EV-${Date.now()}`,
        eventType: 'DISPOSED_ARCHIVED',
        stage: 'disposed',
        title: `Disposed via ${params.disposalMethod} (${gainOrLoss >= 0 ? `+৳${gainOrLoss.toLocaleString()} Gain` : `-৳${Math.abs(gainOrLoss).toLocaleString()} Write-Off Loss`})`,
        notes: `Sale amount: ৳${params.salvageProceedsBdt.toLocaleString()} (${params.buyerOrVendor}) vs Current Book Value ৳${nbvAtDisposal.toLocaleString()}. Finance Voucher: ${sapVoucher}.`,
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
    rejectRequisition,
    initiateDecommissioning,
    toggleDisposalChecklistItem,
    finalizeDisposalAndArchive,
  };
}
